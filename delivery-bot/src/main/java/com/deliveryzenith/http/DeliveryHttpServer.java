package com.deliveryzenith.http;

import com.deliveryzenith.DeliveryZenithConfig.DeliveryBotConfig.Order;
import com.deliveryzenith.DeliveryZenithConfig.DeliveryBotConfig.OrderItem;
import com.deliveryzenith.DeliveryZenithConfig.DeliveryBotConfig.State;
import com.deliveryzenith.feature.DeliveryBot;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Executors;

import static com.deliveryzenith.DeliveryZenithPlugin.DELIVERY_BOT;
import static com.deliveryzenith.DeliveryZenithPlugin.LOG;
import static com.deliveryzenith.DeliveryZenithPlugin.PLUGIN_CONFIG;

/**
 * Embedded HTTP server for the DeliveryBot plugin.
 *
 * <p>Exposes a REST-like API so a backend server or Discord bot can submit
 * orders and trigger workflow steps without going through in-game commands.
 *
 * <pre>
 *   POST /order              – submit a new order
 *   GET  /order/status       – current order state as JSON
 *   POST /order/arrived      – customer has arrived → startArrival()
 *   POST /order/complete     – manually mark order complete
 *   POST /order/cancel       – cancel the running workflow
 * </pre>
 */
public class DeliveryHttpServer {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private HttpServer server;
    private final String apiSecret;

    public DeliveryHttpServer(final String apiSecret) {
        this.apiSecret = apiSecret;
    }

    public void start(final int port) throws IOException {
        server = HttpServer.create(new InetSocketAddress(port), 16);
        server.createContext("/order/status",  this::handleStatus);
        server.createContext("/order/arrived", this::handleArrived);
        server.createContext("/order/complete", this::handleComplete);
        server.createContext("/order/cancel",  this::handleCancel);
        // /order must be registered last — it is a prefix of the above paths
        server.createContext("/order",         this::handleOrder);
        server.setExecutor(Executors.newCachedThreadPool());
        server.start();
        LOG.info("DeliveryBot HTTP server listening on port {}", port);
    }

    public void stop() {
        if (server != null) {
            server.stop(1);
            LOG.info("DeliveryBot HTTP server stopped");
        }
    }

    // -------------------------------------------------------------------------
    // POST /order  — create / replace the active order
    // -------------------------------------------------------------------------

    private void handleOrder(final HttpExchange exchange) throws IOException {
        if (!checkMethod(exchange, "POST")) return;
        if (!checkAuth(exchange)) return;
        try {
            JsonNode body = MAPPER.readTree(exchange.getRequestBody());

            String id      = body.path("id").asText(null);
            String ign     = body.path("orderIGN").asText(null);
            JsonNode items = body.path("items");

            if (id == null || id.isBlank()) {
                sendError(exchange, 400, "Missing field: id");
                return;
            }
            if (ign == null || ign.isBlank()) {
                sendError(exchange, 400, "Missing field: orderIGN");
                return;
            }
            if (!items.isArray() || items.isEmpty()) {
                sendError(exchange, 400, "Missing or empty field: items");
                return;
            }
            if (DELIVERY_BOT.isRunning()) {
                sendError(exchange, 409, "A delivery workflow is currently running — cancel it first");
                return;
            }

            Order order = new Order(id, ign);
            for (JsonNode itemNode : items) {
                int count          = itemNode.path("count").asInt(0);
                String sourceChestId = itemNode.path("sourceChestId").asText(null);
                if (count <= 0) {
                    sendError(exchange, 400, "Item count must be > 0");
                    return;
                }
                if (sourceChestId == null || sourceChestId.isBlank()) {
                    sendError(exchange, 400, "Missing field: items[].sourceChestId");
                    return;
                }
                order.items.add(new OrderItem(count, sourceChestId));
            }

            PLUGIN_CONFIG.deliveryBot.activeOrder = order;

            ObjectNode resp = MAPPER.createObjectNode();
            resp.put("success", true);
            resp.put("orderId", id);
            sendJson(exchange, 200, resp);
        } catch (Exception e) {
            LOG.error("Error handling POST /order", e);
            sendError(exchange, 500, e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // GET /order/status
    // -------------------------------------------------------------------------

    private void handleStatus(final HttpExchange exchange) throws IOException {
        if (!checkMethod(exchange, "GET")) return;
        if (!checkAuth(exchange)) return;
        Order order = PLUGIN_CONFIG.deliveryBot.activeOrder;
        ObjectNode resp = MAPPER.createObjectNode();
        resp.put("running", DELIVERY_BOT.isRunning());
        if (order == null) {
            resp.putNull("order");
        } else {
            ObjectNode o = resp.putObject("order");
            o.put("id",      order.id);
            o.put("orderIGN", order.orderIGN);
            o.put("state",   order.state.name());
            o.put("status",  order.status != null ? order.status : "");
            o.put("updatedAtEpochMs", order.updatedAtEpochMs);
            if (order.deliveryLocation != null) {
                ObjectNode loc = o.putObject("deliveryLocation");
                loc.put("x", order.deliveryLocation.x());
                loc.put("y", order.deliveryLocation.y());
                loc.put("z", order.deliveryLocation.z());
            }
        }
        sendJson(exchange, 200, resp);
    }

    // -------------------------------------------------------------------------
    // POST /order/arrived — customer confirmed presence
    // -------------------------------------------------------------------------

    private void handleArrived(final HttpExchange exchange) throws IOException {
        if (!checkMethod(exchange, "POST")) return;
        if (!checkAuth(exchange)) return;
        Order order = PLUGIN_CONFIG.deliveryBot.activeOrder;
        if (order == null) {
            sendError(exchange, 400, "No active order");
            return;
        }
        if (order.state != State.WAITING_FOR_CUSTOMER && order.state != State.WAITING_FOR_KILL) {
            sendError(exchange, 409, "Order is not in WAITING_FOR_CUSTOMER state — current state: " + order.state);
            return;
        }
        boolean started = DELIVERY_BOT.startArrival(null);
        ObjectNode resp = MAPPER.createObjectNode();
        resp.put("success", started);
        resp.put("message", started ? "Arrival workflow started" : "Delivery bot is already running");
        sendJson(exchange, started ? 200 : 409, resp);
    }

    // -------------------------------------------------------------------------
    // POST /order/complete — manually complete
    // -------------------------------------------------------------------------

    private void handleComplete(final HttpExchange exchange) throws IOException {
        if (!checkMethod(exchange, "POST")) return;
        if (!checkAuth(exchange)) return;
        var result = DELIVERY_BOT.completeActiveOrderManually();
        ObjectNode resp = MAPPER.createObjectNode();
        resp.put("success", result.success());
        resp.put("message", result.message());
        sendJson(exchange, result.success() ? 200 : 409, resp);
    }

    // -------------------------------------------------------------------------
    // POST /order/cancel
    // -------------------------------------------------------------------------

    private void handleCancel(final HttpExchange exchange) throws IOException {
        if (!checkMethod(exchange, "POST")) return;
        if (!checkAuth(exchange)) return;
        boolean cancelled = DELIVERY_BOT.cancel();
        ObjectNode resp = MAPPER.createObjectNode();
        resp.put("success", true);
        resp.put("cancelled", cancelled);
        sendJson(exchange, 200, resp);
    }

    // -------------------------------------------------------------------------
    // Request guards
    // -------------------------------------------------------------------------

    private boolean checkMethod(final HttpExchange exchange, final String expected) throws IOException {
        if (!exchange.getRequestMethod().equalsIgnoreCase(expected)) {
            sendError(exchange, 405, "Method not allowed — expected " + expected);
            return false;
        }
        return true;
    }

    private boolean checkAuth(final HttpExchange exchange) throws IOException {
        if (apiSecret == null || apiSecret.isBlank()) return true; // auth disabled
        String header = exchange.getRequestHeaders().getFirst("X-Api-Secret");
        if (!apiSecret.equals(header)) {
            sendError(exchange, 401, "Unauthorized");
            return false;
        }
        return true;
    }

    // -------------------------------------------------------------------------
    // Response helpers
    // -------------------------------------------------------------------------

    private static void sendJson(final HttpExchange exchange, final int status, final ObjectNode body) throws IOException {
        byte[] bytes = MAPPER.writeValueAsBytes(body);
        exchange.getResponseHeaders().add("Content-Type", "application/json; charset=utf-8");
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static void sendError(final HttpExchange exchange, final int status, final String message) throws IOException {
        ObjectNode err = MAPPER.createObjectNode();
        err.put("success", false);
        err.put("error", message);
        sendJson(exchange, status, err);
    }
}
