package com.deliveryzenith.http;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

import static com.deliveryzenith.DeliveryZenithPlugin.LOG;

/**
 * HTTP client used by DeliveryBot to communicate with the PearlBot service.
 *
 * <p>Called after the delivery bot has staged its enderpearl in the stasis chamber.
 * Sends {@code POST /trapdoor} to PearlBot, which then right-clicks the configured
 * trapdoor block to seal the chamber.
 */
public class PearlBotClient {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final HttpClient HTTP = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(10))
        .build();

    private PearlBotClient() { }

    /**
     * Notifies PearlBot to close the stasis chamber trapdoor.
     *
     * @param orderId   the active order ID (for logging / idempotency on PearlBot side)
     * @param baseUrl   PearlBot base URL, e.g. {@code http://pearl-bot:8081}
     * @param apiSecret optional shared secret; empty string disables auth
     * @throws Exception if the request fails or PearlBot returns a non-2xx status
     */
    public static void closeTrapDoor(final String orderId, final String baseUrl, final String apiSecret) throws Exception {
        ObjectNode body = MAPPER.createObjectNode();
        body.put("orderId", orderId);

        byte[] bodyBytes = MAPPER.writeValueAsBytes(body);

        HttpRequest.Builder builder = HttpRequest.newBuilder()
            .uri(URI.create((baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl) + "/trapdoor"))
            .timeout(Duration.ofSeconds(30))
            .header("Content-Type", "application/json; charset=utf-8")
            .POST(HttpRequest.BodyPublishers.ofByteArray(bodyBytes));

        if (apiSecret != null && !apiSecret.isBlank()) {
            builder.header("X-Api-Secret", apiSecret);
        }

        HttpResponse<String> response = HTTP.send(builder.build(), HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException(
                "PearlBot /trapdoor returned HTTP " + response.statusCode() + ": " + response.body()
            );
        }
        LOG.info("PearlBot trapdoor closed successfully for order {}", orderId);
    }
}
