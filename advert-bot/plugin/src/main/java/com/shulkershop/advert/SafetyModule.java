package com.shulkershop.advert;

import com.shulkershop.advert.config.BotConfig;

public class SafetyModule {

    private final BotConfig config;
    private volatile boolean muteCooldown = false;
    private volatile long muteCooldownUntil = 0;

    public SafetyModule(BotConfig config) {
        this.config = config;
    }

    public boolean shouldPause() {
        if (!config.safety.pauseForNonFriends) {
            return false;
        }
        if (muteCooldown && System.currentTimeMillis() < muteCooldownUntil) {
            return true;
        }
        // TODO: integrate with ZenithProxy visual range / player list / friend list
        // Return true if non-friend players are nearby.
        return false;
    }

    public void onChatMessage(String message) {
        String lower = message.toLowerCase();
        if (lower.contains("you are muted") || lower.contains("slow mode") || lower.contains("do not spam")) {
            triggerMuteCooldown();
        }
    }

    private void triggerMuteCooldown() {
        muteCooldown = true;
        muteCooldownUntil = System.currentTimeMillis() + (config.safety.muteCooldownMinutes * 60_000L);
        System.err.println("[ShulkerAdvert] Mute/slow-mode detected. Pausing for " + config.safety.muteCooldownMinutes + " minutes.");
    }
}
