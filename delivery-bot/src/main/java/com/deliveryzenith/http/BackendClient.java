package com.deliveryzenith.http;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

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

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final HttpClient HTTP = HttpClient.newBuilder()
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
     * @return the job node, or {@code null} if no job is available
     */
    public JsonNode nextJob() throws Exception {
        HttpRequest req = newBuilder("/api/bot/jobs/next")
            .GET()
            .build();
        HttpResponse<String> resp = HTTP.send(req, HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() != 200) {
            throw new RuntimeException("nextJob failed: HTTP " + resp.statusCode() + " " + resp.body());
        }
        JsonNode root = MAPPER.readTree(resp.body());
        JsonNode job = root.path("job");
        return job.isNull() || job.isMissingNode() ? null : job;
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
    public void updateJob(final String jobId, final String status, final ObjectNode payload) throws Exception {
        ObjectNode body = MAPPER.createObjectNode();
        body.put("status", status);
        if (payload != null) {
            body.set("payload", payload);
        }

        HttpRequest req = newBuilder("/api/bot/jobs/" + jobId + "/update")
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
        ObjectNode coords = MAPPER.createObjectNode();
        coords.put("x", x);
        coords.put("y", y);
        coords.put("z", z);

        ObjectNode body = MAPPER.createObjectNode();
        body.set("coords", coords);
        body.put("bot_id", botId);

        HttpRequest req = newBuilder("/api/bot/orders/" + orderId + "/handoff")
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
    public void reportDropped(final String orderId, final ObjectNode proof) throws Exception {
        ObjectNode body = MAPPER.createObjectNode();
        if (proof != null) {
            body.set("proof", proof);
        } else {
            body.set("proof", MAPPER.createObjectNode());
        }

        HttpRequest req = newBuilder("/api/bot/orders/" + orderId + "/dropped")
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
            .header("Accept", "application/json")
            .timeout(Duration.ofSeconds(15));
    }

    private HttpRequest.BodyPublisher jsonBody(final ObjectNode node) {
        return HttpRequest.BodyPublishers.ofString(node.toString());
    }
}
