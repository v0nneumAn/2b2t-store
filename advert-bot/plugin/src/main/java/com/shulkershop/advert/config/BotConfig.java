package com.shulkershop.advert.config;

import com.google.gson.FieldNamingPolicy;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
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

    private static final Gson GSON = new GsonBuilder()
            .setFieldNamingPolicy(FieldNamingPolicy.LOWER_CASE_WITH_UNDERSCORES)
            .create();

    public static BotConfig load(Path path) throws Exception {
        String json = Files.readString(path);
        return GSON.fromJson(json, BotConfig.class);
    }
}
