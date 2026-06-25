package com.deliveryzenith;

import com.deliveryzenith.command.DeliveryBotCommand;
import com.deliveryzenith.feature.DeliveryBot;
import com.deliveryzenith.http.BackendClient;
import com.deliveryzenith.http.DeliveryHttpServer;
import com.deliveryzenith.http.JobPoller;
import com.zenith.plugin.api.Plugin;
import com.zenith.plugin.api.PluginAPI;
import com.zenith.plugin.api.ZenithProxyPlugin;
import net.kyori.adventure.text.logger.slf4j.ComponentLogger;

@Plugin(
    id = BuildConstants.PLUGIN_ID,
    version = BuildConstants.VERSION,
    description = "DeliveryBot workflow plugin for ZenithProxy",
    url = "https://github.com/burnr/DeliveryZenith",
    authors = {"burnr"},
    mcVersions = {BuildConstants.MC_VERSION}
)
public class DeliveryZenithPlugin implements ZenithProxyPlugin {
    public static DeliveryZenithConfig PLUGIN_CONFIG;
    public static DeliveryBot DELIVERY_BOT;
    public static ComponentLogger LOG;

    private static DeliveryHttpServer HTTP_SERVER;
    private static JobPoller JOB_POLLER;

    @Override
    public void onLoad(final PluginAPI pluginAPI) {
        LOG = pluginAPI.getLogger();
        LOG.info("DeliveryZenith loading...");
        PLUGIN_CONFIG = pluginAPI.registerConfig(BuildConstants.PLUGIN_ID, DeliveryZenithConfig.class);
        try {
            java.nio.file.Path configPath = java.nio.file.Path.of("/zenith/config/delivery-zenith.json");
            if (java.nio.file.Files.exists(configPath)) {
                String content = java.nio.file.Files.readString(configPath);
                LOG.info("Read delivery-zenith.json ({} bytes), contains botKey: {}",
                    content.length(), content.contains("\"botKey\""));
            } else {
                LOG.warn("delivery-zenith.json not found at /zenith/config/delivery-zenith.json");
            }
        } catch (Exception e) {
            LOG.error("Failed to read config file", e);
        }
        DELIVERY_BOT = new DeliveryBot();
        pluginAPI.registerCommand(new DeliveryBotCommand());

        String botKey = PLUGIN_CONFIG.deliveryBot.botKey;
        LOG.info("Backend URL: {}, Bot ID: {}, Bot key present: {}",
            PLUGIN_CONFIG.deliveryBot.backendUrl,
            PLUGIN_CONFIG.deliveryBot.botId,
            botKey != null && !botKey.isBlank());
        BackendClient backend = new BackendClient(
            PLUGIN_CONFIG.deliveryBot.backendUrl,
            botKey,
            PLUGIN_CONFIG.deliveryBot.botId
        );
        DELIVERY_BOT.setBackendClient(backend);

        if (PLUGIN_CONFIG.deliveryBot.jobPollingEnabled) {
            JOB_POLLER = new JobPoller(backend, DELIVERY_BOT);
            JOB_POLLER.start();
        }

        HTTP_SERVER = new DeliveryHttpServer(PLUGIN_CONFIG.deliveryBot.apiSecret);
        try {
            HTTP_SERVER.start(PLUGIN_CONFIG.deliveryBot.httpPort);
        } catch (Exception e) {
            LOG.error("Failed to start DeliveryBot HTTP server on port {}", PLUGIN_CONFIG.deliveryBot.httpPort, e);
        }

        // Register a JVM shutdown hook to stop the HTTP server and poller cleanly
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            if (HTTP_SERVER != null) HTTP_SERVER.stop();
            if (JOB_POLLER != null) JOB_POLLER.stop();
        }, "delivery-http-shutdown"));

        LOG.info("DeliveryZenith loaded!");
    }
}
