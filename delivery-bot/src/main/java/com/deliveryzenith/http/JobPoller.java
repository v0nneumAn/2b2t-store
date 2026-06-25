package com.deliveryzenith.http;

import com.deliveryzenith.DeliveryZenithConfig;
import com.deliveryzenith.DeliveryZenithConfig.DeliveryBotConfig.Order;
import com.deliveryzenith.DeliveryZenithConfig.DeliveryBotConfig.OrderItem;
import com.deliveryzenith.DeliveryZenithConfig.DeliveryBotConfig.SourceChest;
import com.deliveryzenith.DeliveryZenithConfig.DeliveryBotConfig.State;
import com.deliveryzenith.feature.DeliveryBot;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import static com.deliveryzenith.DeliveryZenithPlugin.LOG;
import static com.deliveryzenith.DeliveryZenithPlugin.PLUGIN_CONFIG;

/**
 * Polls the 2b2t Store backend for delivery jobs and drives the {@link DeliveryBot}.
 */
public final class JobPoller {

    private final BackendClient backend;
    private final DeliveryBot bot;
    private final ScheduledExecutorService scheduler;

    public JobPoller(final BackendClient backend, final DeliveryBot bot) {
        this.backend = backend;
        this.bot = bot;
        this.scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "delivery-job-poller");
            t.setDaemon(true);
            return t;
        });
    }

    public void start() {
        int interval = Math.max(5, PLUGIN_CONFIG.deliveryBot.jobPollIntervalSeconds);
        scheduler.scheduleAtFixedRate(this::tick, interval, interval, TimeUnit.SECONDS);
        LOG.info("Job poller started (interval {}s)", interval);
    }

    public void stop() {
        scheduler.shutdownNow();
    }

    private void tick() {
        if (!PLUGIN_CONFIG.deliveryBot.jobPollingEnabled) return;
        if (bot.isRunning()) return;
        if (PLUGIN_CONFIG.deliveryBot.activeOrder != null) return;

        try {
            JsonNode job = backend.nextJob();
            if (job == null) return;

            String jobId = job.path("id").asText(null);
            String jobType = job.path("job_type").asText(null);
            String orderId = job.path("order_id").asText(null);
            JsonNode payload = job.path("payload");

            if (jobId == null || orderId == null) {
                LOG.warn("Received malformed job from backend, skipping");
                return;
            }

            LOG.info("Claiming job {} (type={}, order={})", jobId, jobType, orderId);
            backend.claimJob(jobId);

            Order order = buildOrder(orderId, jobType, payload);
            if (order == null) {
                LOG.error("Unable to build order from job payload for {}", orderId);
                backend.updateJob(jobId, "failed", null);
                return;
            }

            order.backendJobId = jobId;
            PLUGIN_CONFIG.deliveryBot.activeOrder = order;

            if ("drop".equalsIgnoreCase(jobType)) {
                // Drop jobs are created after the customer confirms arrival.
                order.state = State.WAITING_FOR_CUSTOMER;
                bot.startArrival(null);
            } else {
                bot.startPrepare(null);
            }
        } catch (Exception e) {
            LOG.error("Job poller tick failed", e);
        }
    }

    private Order buildOrder(final String orderId, final String jobType, final JsonNode payload) {
        String customerIgn = payload.path("customer_ign").asText("unknown");
        Order order = new Order(orderId, customerIgn);
        order.state = State.NEW;

        JsonNode items = payload.path("items");
        if (items.isArray()) {
            for (JsonNode item : items) {
                int count = item.path("quantity").asInt(item.path("count").asInt(0));
                String sourceId = item.path("source_chest_id").asText(null);
                if (sourceId == null) {
                    // Fallback to the depot/source chest supplied by the backend.
                    JsonNode chest = payload.path("source_chest");
                    if (!chest.isMissingNode()) {
                        sourceId = chest.path("id").asText(orderId + "-chest");
                    }
                }
                if (count <= 0 || sourceId == null) {
                    LOG.warn("Skipping malformed item in order {}: {}", orderId, item);
                    continue;
                }
                order.items.add(new OrderItem(count, sourceId));
            }
        }

        if (order.items.isEmpty()) {
            LOG.error("Job payload for order {} contained no valid items", orderId);
            return null;
        }

        // For drop jobs the handoff location is supplied in the payload.
        JsonNode handoff = payload.path("handoff_coords");
        if (!handoff.isMissingNode()) {
            order.deliveryLocation = new DeliveryZenithConfig.DeliveryBotConfig.Position(
                handoff.path("x").asInt(),
                handoff.path("y").asInt(),
                handoff.path("z").asInt()
            );
        }

        // For prepare jobs the source chest is supplied in the payload.
        JsonNode sourceChest = payload.path("source_chest");
        if (!sourceChest.isMissingNode()) {
            String id = sourceChest.path("id").asText(orderId + "-chest");
            int x = sourceChest.path("x").asInt();
            int y = sourceChest.path("y").asInt();
            int z = sourceChest.path("z").asInt();
            // Inject the dynamic source chest into config if not already present.
            var config = PLUGIN_CONFIG.deliveryBot;
            boolean exists = config.sourceChests.stream().anyMatch(s -> s.id().equalsIgnoreCase(id));
            if (!exists) {
                if (config.sourceChests == null) config.sourceChests = new ArrayList<>();
                config.sourceChests.add(new SourceChest(id, x, y, z));
            }
        }

        return order;
    }
}
