package com.deliveryzenith.http;

import com.deliveryzenith.DeliveryZenithConfig.DeliveryBotConfig.Order;
import com.deliveryzenith.DeliveryZenithConfig.DeliveryBotConfig.OrderItem;
import com.deliveryzenith.DeliveryZenithConfig.DeliveryBotConfig.State;
import com.deliveryzenith.feature.DeliveryBot;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
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
 * <p>Exposes a REST-like API so an operator or Discord bot can inspect status
 * and trigger workflow steps without going through in-game commands.</p>
 *
 * <pre>
 *   GET  /order/status       – current order state as JSON
 *   POST /order/arrived      – customer has arrived → startArrival()
 *   POST /order/complete     – manually mark order complete
 *   POST /order/cancel       – cancel the running workflow
 * </pre>
 */
public class DeliveryHttpServer {

    private static final Gson GSON = new Gson();

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
    // GET /order/status
    // -------------------------------------------------------------------------

    private void handleStatus(final HttpExchange exchange) throws IOException {
        if (!checkMethod(exchange, "GET")) return;
        if (!checkAuth(exchange)) return;
        Order order = PLUGIN_CONFIG.deliveryBot.activeOrder;
        JsonObject resp = new JsonObject();
        resp.addProperty("running", DELIVERY_BOT.isRunning());
        if (order == null) {
            resp.add("order", null);
        } else {
            JsonObject o = new JsonObject();
            o.addProperty("id", order.id);
            o.addProperty("orderIGN", order.orderIGN);
            o.addProperty("state", order.state.name());
            o.addProperty("status", order.status != null ? order.status : "");
            o.addProperty("updatedAtEpochMs", order.updatedAtEpochMs);
            if (order.deliveryLocation != null) {
                JsonObject loc = new JsonObject();
                loc.addProperty("x", order.deliveryLocation.x());
                loc.addProperty("y", order.deliveryLocation.y());
                loc.addProperty("z", order.deliveryLocation.z());
                o.add("deliveryLocation", loc);
            }
            resp.add("order", o);
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
        JsonObject resp = new JsonObject();
        resp.addProperty("success", started);
        resp.addProperty("message", started ? "Arrival workflow started" : "Delivery bot is already running");
        sendJson(exchange, started ? 200 : 409, resp);
    }

    // -------------------------------------------------------------------------
    // POST /order/complete — manually complete
    // -------------------------------------------------------------------------

    private void handleComplete(final HttpExchange exchange) throws IOException {
        if (!checkMethod(exchange, "POST")) return;
        if (!checkAuth(exchange)) return;
        var result = DELIVERY_BOT.completeActiveOrderManually();
        JsonObject resp = new JsonObject();
        resp.addProperty("success", result.success());
        resp.addProperty("message", result.message());
        sendJson(exchange, result.success() ? 200 : 409, resp);
    }

    // -------------------------------------------------------------------------
    // POST /order/cancel
    // -------------------------------------------------------------------------

    private void handleCancel(final HttpExchange exchange) throws IOException {
        if (!checkMethod(exchange, "POST")) return;
        if (!checkAuth(exchange)) return;
        boolean cancelled = DELIVERY_BOT.cancel();
        JsonObject resp = new JsonObject();
        resp.addProperty("success", true);
        resp.addProperty("cancelled", cancelled);
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
        if (apiSecret == null || apiSecret.isBlank()) {
            // Fail closed: the operator must generate an apiSecret in delivery-zenith.json.
            sendError(exchange, 401, "apiSecret not configured");
            return false;
        }
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

    private static void sendJson(final HttpExchange exchange, final int status, final JsonObject body) throws IOException {
        byte[] bytes = GSON.toJson(body).getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json; charset=utf-8");
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static void sendError(final HttpExchange exchange, final int status, final String message) throws IOException {
        JsonObject err = new JsonObject();
        err.addProperty("success", false);
        err.addProperty("error", message);
        sendJson(exchange, status, err);
    }
}
