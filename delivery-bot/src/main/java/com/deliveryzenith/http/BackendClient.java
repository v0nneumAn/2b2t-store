package com.deliveryzenith.http;

import com.google.gson.Gson;
import com.google.gson.JsonObject;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

import static com.deliveryzenith.DeliveryZenithPlugin.LOG;

/**
 * Outbound HTTP client that talks to the 2b2t Store backend.
 *
 * <p>All requests are authenticated with {@code X-Bot-Key}.</p>
 */
public final class BackendClient {

    private static final Gson GSON = new Gson();
    private static final HttpClient HTTP = HttpClient.newBuilder()
        .version(HttpClient.Version.HTTP_1_1)
        .connectTimeout(Duration.ofSeconds(10))
        .build();

    private final String backendUrl;
    private final String botKey;
    private final String botId;

    public BackendClient(final String backendUrl, final String botKey, final String botId) {
        this.backendUrl = backendUrl.endsWith("/") ? backendUrl.substring(0, backendUrl.length() - 1) : backendUrl;
        this.botKey = botKey;
        this.botId = botId;
    }

    /**
     * Poll for the next queued delivery job.
     *
     * @return the job object, or {@code null} if no job is available
     */
    public JsonObject nextJob() throws Exception {
        HttpRequest req = newBuilder("/api/bot/jobs/next")
            .GET()
            .build();
        HttpResponse<String> resp = HTTP.send(req, HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() != 200) {
            throw new RuntimeException("nextJob failed: HTTP " + resp.statusCode() + " " + resp.body());
        }
        JsonObject root = GSON.fromJson(resp.body(), JsonObject.class);
        if (root == null || !root.has("job") || root.get("job").isJsonNull()) {
            return null;
        }
        return root.getAsJsonObject("job");
    }

    /**
     * Claim a job so no other bot takes it.
     */
    public void claimJob(final String jobId) throws Exception {
        HttpRequest req = newBuilder("/api/bot/jobs/" + jobId + "/claim?bot_id=" + botId)
            .POST(HttpRequest.BodyPublishers.noBody())
            .build();
        HttpResponse<String> resp = HTTP.send(req, HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() != 200) {
            throw new RuntimeException("claimJob failed: HTTP " + resp.statusCode() + " " + resp.body());
        }
    }

    /**
     * Report a job status update. Well-known statuses are synced to the parent order.
     */
    public void updateJob(final String jobId, final String status, final JsonObject payload) throws Exception {
        JsonObject body = new JsonObject();
        body.addProperty("status", status);
        if (payload != null) {
            body.add("payload", payload);
        }

        HttpRequest req = newJsonBuilder("/api/bot/jobs/" + jobId + "/update")
            .POST(jsonBody(body))
            .build();
        HttpResponse<String> resp = HTTP.send(req, HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() != 200) {
            throw new RuntimeException("updateJob failed: HTTP " + resp.statusCode() + " " + resp.body());
        }
    }

    /**
     * Report the EnderChest handoff coordinates to the backend.
     */
    public void reportHandoff(final String orderId, final int x, final int y, final int z) throws Exception {
        JsonObject coords = new JsonObject();
        coords.addProperty("x", x);
        coords.addProperty("y", y);
        coords.addProperty("z", z);

        JsonObject body = new JsonObject();
        body.add("coords", coords);
        body.addProperty("bot_id", botId);

        HttpRequest req = newJsonBuilder("/api/bot/orders/" + orderId + "/handoff")
            .POST(jsonBody(body))
            .build();
        HttpResponse<String> resp = HTTP.send(req, HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() != 200) {
            throw new RuntimeException("reportHandoff failed: HTTP " + resp.statusCode() + " " + resp.body());
        }
    }

    /**
     * Report that items have been dropped for the customer.
     */
    public void reportDropped(final String orderId, final JsonObject proof) throws Exception {
        JsonObject body = new JsonObject();
        if (proof != null) {
            body.add("proof", proof);
        } else {
            body.add("proof", new JsonObject());
        }

        HttpRequest req = newJsonBuilder("/api/bot/orders/" + orderId + "/dropped")
            .POST(jsonBody(body))
            .build();
        HttpResponse<String> resp = HTTP.send(req, HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() != 200) {
            throw new RuntimeException("reportDropped failed: HTTP " + resp.statusCode() + " " + resp.body());
        }
    }

    private HttpRequest.Builder newBuilder(final String path) {
        return HttpRequest.newBuilder()
            .uri(URI.create(backendUrl + path))
            .header("X-Bot-Key", botKey)
            .header("X-Bot-Id", botId)
            .header("Accept", "application/json")
            .timeout(Duration.ofSeconds(15));
    }

    private HttpRequest.Builder newJsonBuilder(final String path) {
        return newBuilder(path).header("Content-Type", "application/json");
    }

    private HttpRequest.BodyPublisher jsonBody(final JsonObject obj) {
        return HttpRequest.BodyPublishers.ofString(GSON.toJson(obj));
    }
}
