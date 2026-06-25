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
        DELIVERY_BOT = new DeliveryBot();
        pluginAPI.registerCommand(new DeliveryBotCommand());

        BackendClient backend = new BackendClient(
            PLUGIN_CONFIG.deliveryBot.backendUrl,
            PLUGIN_CONFIG.deliveryBot.botKey,
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
