package com.shulkershop.advert;

import com.google.gson.Gson;
import com.shulkershop.advert.config.BotConfig;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

public class BackendClient {

    private final HttpClient httpClient;
    private final Gson gson;
    private final BotConfig config;

    public BackendClient(BotConfig config) {
        this.config = config;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.gson = new Gson();
    }

    public ConversationScript pollNextConversation() {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(config.backendUrl + "/api/advert/conversations/next?role=" + config.botRole))
                    .header("X-Bot-Key", config.botApiKey)
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 204 || response.body().isBlank()) {
                return null;
            }
            if (response.statusCode() == 200) {
                return gson.fromJson(response.body(), ConversationScript.class);
            }
            System.err.println("Backend poll failed: " + response.statusCode() + " " + response.body());
        } catch (Exception e) {
            System.err.println("Backend poll error: " + e.getMessage());
        }
        return null;
    }

    public void reportStatus(BotStatus status) {
        try {
            String body = gson.toJson(status);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(config.backendUrl + "/api/advert/bots/status"))
                    .header("Content-Type", "application/json")
                    .header("X-Bot-Key", config.botApiKey)
                    .timeout(Duration.ofSeconds(10))
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString());
        } catch (Exception e) {
            System.err.println("Status report error: " + e.getMessage());
        }
    }

    public static class BotStatus {
        public String role;
        public boolean inGame;
        public boolean isQueue;
        public Integer queuePosition;
        public boolean conversationActive;
        public long lastSeenAt;
    }
}
