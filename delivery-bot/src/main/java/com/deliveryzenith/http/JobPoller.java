package com.deliveryzenith.http;

import com.deliveryzenith.DeliveryZenithConfig;
import com.deliveryzenith.DeliveryZenithConfig.DeliveryBotConfig.Order;
import com.deliveryzenith.DeliveryZenithConfig.DeliveryBotConfig.OrderItem;
import com.deliveryzenith.DeliveryZenithConfig.DeliveryBotConfig.SourceChest;
import com.deliveryzenith.DeliveryZenithConfig.DeliveryBotConfig.State;
import com.deliveryzenith.feature.DeliveryBot;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

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
            JsonObject job = backend.nextJob();
            if (job == null) return;

            String jobId = getString(job, "id");
            String jobType = getString(job, "job_type");
            String orderId = getString(job, "order_id");
            JsonObject payload = job.has("payload") && job.get("payload").isJsonObject()
                ? job.getAsJsonObject("payload")
                : new JsonObject();

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

    private Order buildOrder(final String orderId, final String jobType, final JsonObject payload) {
        String customerIgn = getString(payload, "customer_ign");
        if (customerIgn == null) customerIgn = "unknown";
        Order order = new Order(orderId, customerIgn);
        order.state = State.NEW;

        boolean isDrop = "drop".equalsIgnoreCase(jobType);
        JsonArray items = payload.has("items") && payload.get("items").isJsonArray()
            ? payload.getAsJsonArray("items")
            : new JsonArray();
        for (JsonElement element : items) {
            if (!element.isJsonObject()) continue;
            JsonObject item = element.getAsJsonObject();
            int count = item.has("quantity") ? item.get("quantity").getAsInt()
                : (item.has("count") ? item.get("count").getAsInt() : 0);
            String sourceId = getString(item, "source_chest_id");
            if (sourceId == null) {
                // Fallback to the depot/source chest supplied by the backend.
                JsonObject chest = payload.has("source_chest") && payload.get("source_chest").isJsonObject()
                    ? payload.getAsJsonObject("source_chest")
                    : null;
                if (chest != null) {
                    sourceId = getString(chest, "id");
                }
            }
            // Drop jobs withdraw from the handoff ender chest and do not need a source chest.
            if (count <= 0 || (sourceId == null && !isDrop)) {
                LOG.warn("Skipping malformed item in order {}: {}", orderId, item);
                continue;
            }
            order.items.add(new OrderItem(count, sourceId));
        }

        if (order.items.isEmpty()) {
            LOG.error("Job payload for order {} contained no valid items", orderId);
            return null;
        }

        // For drop jobs the handoff location is supplied in the payload.
        JsonObject handoff = payload.has("handoff_coords") && payload.get("handoff_coords").isJsonObject()
            ? payload.getAsJsonObject("handoff_coords")
            : null;
        if (handoff != null) {
            order.deliveryLocation = new DeliveryZenithConfig.DeliveryBotConfig.Position(
                handoff.get("x").getAsInt(),
                handoff.get("y").getAsInt(),
                handoff.get("z").getAsInt()
            );
        }

        // For prepare jobs the source chest is supplied in the payload.
        JsonObject sourceChest = payload.has("source_chest") && payload.get("source_chest").isJsonObject()
            ? payload.getAsJsonObject("source_chest")
            : null;
        if (sourceChest != null) {
            String rawId = getString(sourceChest, "id");
            final String chestId = rawId != null ? rawId : orderId + "-chest";
            int x = sourceChest.has("x") ? sourceChest.get("x").getAsInt() : 0;
            int y = sourceChest.has("y") ? sourceChest.get("y").getAsInt() : 0;
            int z = sourceChest.has("z") ? sourceChest.get("z").getAsInt() : 0;
            // Inject the dynamic source chest into config if not already present.
            var config = PLUGIN_CONFIG.deliveryBot;
            boolean exists = config.sourceChests.stream().anyMatch(s -> s.id().equalsIgnoreCase(chestId));
            if (!exists) {
                if (config.sourceChests == null) config.sourceChests = new ArrayList<>();
                config.sourceChests.add(new SourceChest(chestId, x, y, z));
            }
        }

        return order;
    }

    private String getString(final JsonObject obj, final String key) {
        if (obj == null || !obj.has(key)) return null;
        JsonElement el = obj.get(key);
        return el.isJsonNull() ? null : el.getAsString();
    }
}
