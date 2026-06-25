package com.deliveryzenith.command;

import com.deliveryzenith.DeliveryZenithConfig.DeliveryBotConfig.Order;
import com.deliveryzenith.DeliveryZenithConfig.DeliveryBotConfig.OrderItem;
import com.deliveryzenith.DeliveryZenithConfig.DeliveryBotConfig.Position;
import com.deliveryzenith.DeliveryZenithConfig.DeliveryBotConfig.SourceChest;
import com.mojang.brigadier.builder.LiteralArgumentBuilder;
import com.zenith.Proxy;
import com.zenith.command.api.Command;
import com.zenith.command.api.CommandCategory;
import com.zenith.command.api.CommandContext;
import com.zenith.command.api.CommandUsage;
import com.zenith.discord.Embed;

import static com.deliveryzenith.DeliveryZenithPlugin.DELIVERY_BOT;
import static com.deliveryzenith.DeliveryZenithPlugin.PLUGIN_CONFIG;
import static com.mojang.brigadier.arguments.IntegerArgumentType.getInteger;
import static com.mojang.brigadier.arguments.IntegerArgumentType.integer;
import static com.zenith.Globals.CONFIG;
import static com.zenith.command.brigadier.BlockPosArgument.blockPos;
import static com.zenith.command.brigadier.BlockPosArgument.getBlockPos;
import static com.zenith.command.brigadier.CustomStringArgumentType.getString;
import static com.zenith.command.brigadier.CustomStringArgumentType.wordWithChars;

public class DeliveryBotCommand extends Command {

    @Override
    public CommandUsage commandUsage() {
        return CommandUsage.builder()
            .name("deliveryBot")
            .category(CommandCategory.MODULE)
            .description("""
                Delivery bot workflow for pre-sorted shulker-box source chests, ender chest staging, and stasis pearl delivery.
                Source chests hold shulker boxes already sorted per order — no item type needed.
                """)
            .usageLines(
                "status",
                "source add <id> <x> <y> <z>",
                "source del <id>",
                "source list",
                "source clear",
                "order new <orderId> <orderIGN>",
                "order add <sourceId> <count>",
                "order del <sourceId>",
                "order clear",
                "pearlchest <x> <y> <z>",
                "stasis <x> <y> <z>",
                "prepare",
                "arrived",
                "complete",
                "cancel"
            )
            .aliases("dbot", "delivery")
            .build();
    }

    @Override
    public LiteralArgumentBuilder<CommandContext> register() {
        return command("deliveryBot")
            .executes(c -> {
                statusEmbed(c.getSource().getEmbed());
                return OK;
            })
            .then(literal("status").executes(c -> {
                statusEmbed(c.getSource().getEmbed());
                return OK;
            }))

            // ---- source chest management ----
            .then(literal("source")
                .then(literal("add").then(argument("id", wordWithChars()).then(argument("pos", blockPos()).executes(c -> {
                    if (!ensureNotRunning(c.getSource().getEmbed())) return ERROR;
                    String id = getString(c, "id");
                    var pos = getBlockPos(c, "pos");
                    var sources = PLUGIN_CONFIG.deliveryBot.sourceChests;
                    sources.removeIf(source -> source.id().equalsIgnoreCase(id));
                    sources.add(new SourceChest(id, pos.x(), pos.y(), pos.z()));
                    c.getSource().getEmbed()
                        .title("Delivery Source Added")
                        .addField("ID", id)
                        .addField("Position", formatPosition(new Position(pos.x(), pos.y(), pos.z())))
                        .successColor();
                    return OK;
                }))))
                .then(literal("del").then(argument("id", wordWithChars()).executes(c -> {
                    if (!ensureNotRunning(c.getSource().getEmbed())) return ERROR;
                    String id = getString(c, "id");
                    boolean removed = PLUGIN_CONFIG.deliveryBot.sourceChests.removeIf(source -> source.id().equalsIgnoreCase(id));
                    c.getSource().getEmbed()
                        .title(removed ? "Delivery Source Removed" : "Delivery Source Not Found")
                        .addField("ID", id);
                    return removed ? OK : ERROR;
                })))
                .then(literal("clear").executes(c -> {
                    if (!ensureNotRunning(c.getSource().getEmbed())) return ERROR;
                    PLUGIN_CONFIG.deliveryBot.sourceChests.clear();
                    c.getSource().getEmbed()
                        .title("Delivery Sources Cleared")
                        .successColor();
                    return OK;
                }))
                .then(literal("list").executes(c -> {
                    c.getSource().getEmbed()
                        .title("Delivery Sources")
                        .description(formatSources())
                        .primaryColor();
                    return OK;
                })))

            // ---- order management ----
            .then(literal("order")
                .then(literal("new").then(argument("orderId", wordWithChars()).then(argument("orderIGN", wordWithChars()).executes(c -> {
                    if (!ensureNotRunning(c.getSource().getEmbed())) return ERROR;
                    String orderId = getString(c, "orderId");
                    String orderIGN = getString(c, "orderIGN");
                    PLUGIN_CONFIG.deliveryBot.activeOrder = new Order(orderId, orderIGN);
                    c.getSource().getEmbed()
                        .title("Delivery Order Created")
                        .addField("Order ID", orderId)
                        .addField("Order IGN", orderIGN)
                        .successColor();
                    return OK;
                }))))
                // order add <sourceId> <count>  — each entry = N shulker boxes from a pre-sorted chest
                .then(literal("add").then(argument("sourceId", wordWithChars()).then(argument("count", integer(1)).executes(c -> {
                    if (!ensureNotRunning(c.getSource().getEmbed())) return ERROR;
                    String sourceId = getString(c, "sourceId");
                    int count = getInteger(c, "count");

                    if (findSource(sourceId) == null) {
                        c.getSource().getEmbed()
                            .title("Delivery Source Not Found")
                            .addField("ID", sourceId)
                            .errorColor();
                        return ERROR;
                    }

                    Order order = PLUGIN_CONFIG.deliveryBot.activeOrder;
                    if (order == null) {
                        noOrder(c.getSource().getEmbed());
                        return ERROR;
                    }

                    // Merge if source already present
                    for (int i = 0; i < order.items.size(); i++) {
                        OrderItem existing = order.items.get(i);
                        if (existing.sourceChestId().equalsIgnoreCase(sourceId)) {
                            order.items.set(i, new OrderItem(existing.count() + count, sourceId));
                            c.getSource().getEmbed()
                                .title("Delivery Order Item Updated")
                                .addField("Source Chest", sourceId)
                                .addField("Total Shulker Boxes", existing.count() + count)
                                .successColor();
                            return OK;
                        }
                    }

                    order.items.add(new OrderItem(count, sourceId));
                    c.getSource().getEmbed()
                        .title("Delivery Order Item Added")
                        .addField("Source Chest", sourceId)
                        .addField("Shulker Boxes", count)
                        .successColor();
                    return OK;
                }))))
                .then(literal("del").then(argument("sourceId", wordWithChars()).executes(c -> {
                    if (!ensureNotRunning(c.getSource().getEmbed())) return ERROR;
                    Order order = PLUGIN_CONFIG.deliveryBot.activeOrder;
                    if (order == null) {
                        noOrder(c.getSource().getEmbed());
                        return ERROR;
                    }
                    String sourceId = getString(c, "sourceId");
                    boolean removed = order.items.removeIf(item -> item.sourceChestId().equalsIgnoreCase(sourceId));
                    c.getSource().getEmbed()
                        .title(removed ? "Delivery Order Item Removed" : "Delivery Order Item Not Found")
                        .addField("Source Chest", sourceId);
                    return removed ? OK : ERROR;
                })))
                .then(literal("clear").executes(c -> {
                    if (!ensureNotRunning(c.getSource().getEmbed())) return ERROR;
                    PLUGIN_CONFIG.deliveryBot.activeOrder = null;
                    c.getSource().getEmbed()
                        .title("Delivery Order Cleared")
                        .successColor();
                    return OK;
                })))

            // ---- pearl staging config ----
            .then(literal("pearlchest").then(argument("pos", blockPos()).executes(c -> {
                var pos = getBlockPos(c, "pos");
                PLUGIN_CONFIG.deliveryBot.pearlChest = new Position(pos.x(), pos.y(), pos.z());
                c.getSource().getEmbed()
                    .title("Pearl Chest Set")
                    .addField("Position", formatPosition(PLUGIN_CONFIG.deliveryBot.pearlChest))
                    .successColor();
                return OK;
            })))
            .then(literal("stasis").then(argument("pos", blockPos()).executes(c -> {
                var pos = getBlockPos(c, "pos");
                PLUGIN_CONFIG.deliveryBot.stasisChamber = new Position(pos.x(), pos.y(), pos.z());
                c.getSource().getEmbed()
                    .title("Stasis Chamber Stand Position Set")
                    .addField("Position", formatPosition(PLUGIN_CONFIG.deliveryBot.stasisChamber))
                    .successColor();
                return OK;
            })))

            // ---- workflow commands ----
            .then(literal("prepare").executes(c -> {
                if (!ensureRunnable(c.getSource().getEmbed())) return ERROR;
                if (DELIVERY_BOT.startPrepare(c.getSource())) {
                    c.getSource().getEmbed()
                        .title("DeliveryBot Prepare Started")
                        .description("Collecting shulker boxes, staging the ender chest, then parking at spawn.")
                        .primaryColor();
                    return OK;
                }
                c.getSource().getEmbed()
                    .title("DeliveryBot Busy")
                    .description("A delivery workflow is already running.")
                    .errorColor();
                return ERROR;
            }))
            .then(literal("arrived").executes(c -> {
                if (!ensureRunnable(c.getSource().getEmbed())) return ERROR;
                if (DELIVERY_BOT.startArrival(c.getSource())) {
                    c.getSource().getEmbed()
                        .title("DeliveryBot Arrival Started")
                        .description("Opening the ender chest, loading inventory, then waiting for the order IGN kill.")
                        .primaryColor();
                    return OK;
                }
                c.getSource().getEmbed()
                    .title("DeliveryBot Busy")
                    .description("A delivery workflow is already running.")
                    .errorColor();
                return ERROR;
            }))
            .then(literal("complete").executes(c -> {
                if (!ensureNotRunning(c.getSource().getEmbed())) return ERROR;
                var result = DELIVERY_BOT.completeActiveOrderManually();
                c.getSource().getEmbed()
                    .title(result.success() ? "DeliveryBot Order Complete" : "DeliveryBot Complete Blocked")
                    .description(result.message());
                if (result.success()) {
                    c.getSource().getEmbed().successColor();
                    return OK;
                }
                c.getSource().getEmbed().errorColor();
                return ERROR;
            }))
            .then(literal("cancel").executes(c -> {
                boolean cancelled = DELIVERY_BOT.cancel();
                c.getSource().getEmbed()
                    .title(cancelled ? "DeliveryBot Cancelled" : "DeliveryBot Idle")
                    .primaryColor();
                return OK;
            }));
    }

    // -------------------------------------------------------------------------
    // Guards
    // -------------------------------------------------------------------------

    private boolean ensureRunnable(final Embed embed) {
        if (Proxy.getInstance().hasActivePlayer()) {
            embed.title("DeliveryBot Blocked")
                .description("A player is currently controlling the account.")
                .errorColor();
            return false;
        }
        if (PLUGIN_CONFIG.deliveryBot.activeOrder == null) {
            noOrder(embed);
            return false;
        }
        return true;
    }

    private boolean ensureNotRunning(final Embed embed) {
        if (!DELIVERY_BOT.isRunning()) return true;
        embed.title("DeliveryBot Busy")
            .description("Stop or finish the current workflow before changing delivery config.")
            .errorColor();
        return false;
    }

    private void noOrder(final Embed embed) {
        embed.title("No Active Delivery Order")
            .description("Create one with `deliveryBot order new <orderId> <orderIGN>`.")
            .errorColor();
    }

    private @org.jspecify.annotations.Nullable SourceChest findSource(final String id) {
        return PLUGIN_CONFIG.deliveryBot.sourceChests.stream()
            .filter(source -> source.id().equalsIgnoreCase(id))
            .findFirst()
            .orElse(null);
    }

    // -------------------------------------------------------------------------
    // Status embed
    // -------------------------------------------------------------------------

    private void statusEmbed(final Embed embed) {
        Order order = PLUGIN_CONFIG.deliveryBot.activeOrder;
        embed.title("DeliveryBot Status")
            .addField("Running", toggleStr(DELIVERY_BOT.isRunning()))
            .addField("Sources", PLUGIN_CONFIG.deliveryBot.sourceChests.size())
            .addField("HTTP Port", PLUGIN_CONFIG.deliveryBot.httpPort)
            .addField("Pearl Chest", formatPosition(PLUGIN_CONFIG.deliveryBot.pearlChest))
            .addField("Stasis Chamber", formatPosition(PLUGIN_CONFIG.deliveryBot.stasisChamber))
            .addField("Active Order", order == null ? "None" : order.id)
            .primaryColor();
        if (order != null) {
            embed.addField("Order IGN", order.orderIGN)
                .addField("State", order.state)
                .addField("Status", order.status == null ? "None" : order.status)
                .addField("Location", formatPosition(order.deliveryLocation))
                .description(formatOrderItems(order));
        }
    }

    private String formatOrderItems(final Order order) {
        if (order.items.isEmpty()) return "No items";
        StringBuilder sb = new StringBuilder();
        for (OrderItem item : order.items) {
            sb.append(item.count())
                .append(" shulker box(es) from `")
                .append(item.sourceChestId())
                .append("`\n");
        }
        return sb.toString();
    }

    private String formatSources() {
        var sources = PLUGIN_CONFIG.deliveryBot.sourceChests;
        if (sources.isEmpty()) return "None";
        StringBuilder sb = new StringBuilder();
        for (SourceChest source : sources) {
            sb.append("`")
                .append(source.id())
                .append("`: ")
                .append(formatPosition(new Position(source.x(), source.y(), source.z())))
                .append('\n');
        }
        return sb.toString();
    }

    private String formatPosition(final @org.jspecify.annotations.Nullable Position position) {
        if (position == null) return "Not set";
        if (!CONFIG.discord.reportCoords) return "Coords disabled";
        return "||[" + position.x() + ", " + position.y() + ", " + position.z() + "]||";
    }
}
