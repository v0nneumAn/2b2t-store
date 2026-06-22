package com.shulkershop.advert;

import com.shulkershop.advert.config.BotConfig;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class ConversationPlayer {

    private final BotConfig config;
    private final BackendClient backend;
    private final SafetyModule safety;
    private final AdvertModule advertModule;
    private final ScheduledExecutorService scheduler;
    private volatile boolean playing = false;

    public ConversationPlayer(BotConfig config, BackendClient backend, SafetyModule safety, AdvertModule advertModule) {
        this.config = config;
        this.backend = backend;
        this.safety = safety;
        this.advertModule = advertModule;
        this.scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "shulker-advert-player");
            t.setDaemon(true);
            return t;
        });
    }

    public boolean isPlaying() {
        return playing;
    }

    public void play(ConversationScript script) {
        if (playing) {
            return;
        }
        playing = true;
        long accumulatedDelay = 0;
        for (ConversationScript.Line line : script.lines) {
            if (!line.role.equalsIgnoreCase(config.botRole)) {
                continue;
            }
            accumulatedDelay += line.delayMs;
            final String text = line.text;
            final int typingMs = Math.max(line.typingMs, jitter(config.typingDelay.minMs, config.typingDelay.maxMs));
            scheduler.schedule(() -> sendLine(text, typingMs), accumulatedDelay, TimeUnit.MILLISECONDS);
            accumulatedDelay += typingMs;
        }
        scheduler.schedule(() -> {
            playing = false;
            System.out.println("[ShulkerAdvert] Conversation finished.");
        }, accumulatedDelay + 500, TimeUnit.MILLISECONDS);
    }

    private void sendLine(String text, int typingMs) {
        if (safety.shouldPause()) {
            System.out.println("[ShulkerAdvert] Safety pause active, dropping line: " + text);
            return;
        }
        try {
            Thread.sleep(typingMs);
            advertModule.sendChat(text);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private int jitter(int min, int max) {
        return min + (int) (Math.random() * (max - min));
    }
}
