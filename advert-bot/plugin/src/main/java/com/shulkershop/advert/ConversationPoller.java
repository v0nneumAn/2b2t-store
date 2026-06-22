package com.shulkershop.advert;

import com.shulkershop.advert.config.BotConfig;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class ConversationPoller implements Runnable {

    private final BotConfig config;
    private final BackendClient backend;
    private final ConversationPlayer player;
    private final SafetyModule safety;
    private final ScheduledExecutorService scheduler;

    public ConversationPoller(BotConfig config, BackendClient backend, ConversationPlayer player, SafetyModule safety) {
        this.config = config;
        this.backend = backend;
        this.player = player;
        this.safety = safety;
        this.scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "shulker-advert-poller");
            t.setDaemon(true);
            return t;
        });
    }

    public void start() {
        scheduler.scheduleAtFixedRate(
                this,
                config.pollIntervalSeconds,
                config.pollIntervalSeconds,
                TimeUnit.SECONDS
        );
    }

    @Override
    public void run() {
        try {
            if (safety.shouldPause()) {
                System.out.println("[ShulkerAdvert] Safety pause active, skipping poll.");
                return;
            }
            if (player.isPlaying()) {
                return;
            }
            ConversationScript script = backend.pollNextConversation();
            if (script != null) {
                System.out.println("[ShulkerAdvert] Received conversation: " + script.id);
                player.play(script);
            }
        } catch (Exception e) {
            System.err.println("[ShulkerAdvert] Poller error: " + e.getMessage());
        }
    }
}
