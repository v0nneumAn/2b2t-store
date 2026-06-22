package com.shulkershop.advert.config;

import com.google.gson.Gson;
import java.nio.file.Files;
import java.nio.file.Path;

public class BotConfig {

    public String backendUrl = "http://localhost:8000";
    public String botApiKey = "change-me-in-production";
    public String botRole = "adbot-alpha";
    public String shopShortlink = "shulker.shop";
    public int pollIntervalSeconds = 10;
    public TypingDelay typingDelay = new TypingDelay();
    public Safety safety = new Safety();

    public static class TypingDelay {
        public int minMs = 1200;
        public int maxMs = 3500;
    }

    public static class Safety {
        public boolean pauseForNonFriends = true;
        public int muteCooldownMinutes = 15;
        public int maxConversationsPerHour = 2;
    }

    public static BotConfig load(Path path) throws Exception {
        String json = Files.readString(path);
        return new Gson().fromJson(json, BotConfig.class);
    }
}
