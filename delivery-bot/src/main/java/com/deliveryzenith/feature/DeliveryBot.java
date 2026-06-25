package com.deliveryzenith.feature;

import com.deliveryzenith.DeliveryZenithConfig.DeliveryBotConfig.Order;
import com.deliveryzenith.DeliveryZenithConfig.DeliveryBotConfig.OrderItem;
import com.deliveryzenith.DeliveryZenithConfig.DeliveryBotConfig.Position;
import com.deliveryzenith.DeliveryZenithConfig.DeliveryBotConfig.SourceChest;
import com.deliveryzenith.DeliveryZenithConfig.DeliveryBotConfig.State;
import com.deliveryzenith.http.BackendClient;
import com.deliveryzenith.http.PearlBotClient;
import com.google.gson.JsonObject;
import com.zenith.Proxy;
import com.zenith.cache.data.inventory.Container;
import com.zenith.command.api.CommandContext;
import com.zenith.discord.Embed;
import com.zenith.event.chat.DeathMessageChatEvent;
import com.zenith.event.chat.SystemChatEvent;
import com.zenith.feature.deathmessages.KillerType;
import com.zenith.feature.inventory.InventoryActionRequest;
import com.zenith.feature.inventory.actions.ClickItem;
import com.zenith.feature.inventory.actions.CloseContainer;
import com.zenith.feature.inventory.actions.InventoryAction;
import com.zenith.feature.inventory.actions.ShiftClick;
import com.zenith.feature.pathfinder.PathingRequestFuture;
import com.zenith.mc.block.BlockPos;
import com.zenith.mc.block.BlockRegistry;
import com.zenith.mc.item.ItemData;
import com.zenith.mc.item.ItemRegistry;
import com.zenith.module.api.ModuleUtils;
import com.zenith.module.impl.AutoReconnect;
import com.zenith.util.Wait;
import org.geysermc.mcprotocollib.protocol.data.game.ClientCommand;
import org.geysermc.mcprotocollib.protocol.data.game.inventory.ClickItemAction;
import org.geysermc.mcprotocollib.protocol.data.game.inventory.ShiftClickItemAction;
import org.geysermc.mcprotocollib.protocol.data.game.item.ItemStack;
import org.geysermc.mcprotocollib.protocol.data.game.entity.object.Direction;
import org.geysermc.mcprotocollib.protocol.data.game.entity.player.PlayerAction;
import org.geysermc.mcprotocollib.protocol.packet.ingame.serverbound.ServerboundChatPacket;
import org.geysermc.mcprotocollib.protocol.packet.ingame.serverbound.ServerboundClientCommandPacket;
import org.geysermc.mcprotocollib.protocol.packet.ingame.serverbound.player.ServerboundMovePlayerRotPacket;
import org.geysermc.mcprotocollib.protocol.packet.ingame.serverbound.player.ServerboundPlayerActionPacket;
import org.geysermc.mcprotocollib.protocol.packet.ingame.serverbound.player.ServerboundSetCarriedItemPacket;
import org.geysermc.mcprotocollib.protocol.packet.ingame.serverbound.player.ServerboundUseItemPacket;
import org.jspecify.annotations.Nullable;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.regex.Pattern;

import static com.deliveryzenith.DeliveryZenithPlugin.PLUGIN_CONFIG;
import static com.github.rfresh2.EventConsumer.of;
import static com.zenith.Globals.*;
import static com.zenith.util.DisconnectMessages.SYSTEM_DISCONNECT;

public final class DeliveryBot extends ModuleUtils {
    private final AtomicBoolean running = new AtomicBoolean(false);
    private volatile @Nullable CommandContext lastCommandContext = null;
    private volatile @Nullable BackendClient backendClient = null;

    private static final String ENDER_PEARL_ITEM = "minecraft:ender_pearl";

    /** All shulker box item name suffixes in Minecraft */
    private static final List<String> SHULKER_BOX_NAMES = List.of(
        "minecraft:shulker_box",
        "minecraft:white_shulker_box",
        "minecraft:orange_shulker_box",
        "minecraft:magenta_shulker_box",
        "minecraft:light_blue_shulker_box",
        "minecraft:yellow_shulker_box",
        "minecraft:lime_shulker_box",
        "minecraft:pink_shulker_box",
        "minecraft:gray_shulker_box",
        "minecraft:light_gray_shulker_box",
        "minecraft:cyan_shulker_box",
        "minecraft:purple_shulker_box",
        "minecraft:blue_shulker_box",
        "minecraft:brown_shulker_box",
        "minecraft:green_shulker_box",
        "minecraft:red_shulker_box",
        "minecraft:black_shulker_box"
    );

    public DeliveryBot() {
        EVENT_BUS.subscribe(
            this,
            of(DeathMessageChatEvent.class, this::handleDeathMessage),
            of(SystemChatEvent.class, this::handleSystemChat)
        );
    }

    public boolean startPrepare(final CommandContext ctx) {
        if (!running.compareAndSet(false, true)) return false;
        lastCommandContext = ctx;
        EXECUTOR.execute(() -> runWorkflow(ctx, "prepare", this::prepareActiveOrder));
        return true;
    }

    public boolean startArrival(final CommandContext ctx) {
        if (!running.compareAndSet(false, true)) return false;
        lastCommandContext = ctx;
        EXECUTOR.execute(() -> runWorkflow(ctx, "arrival", this::arrivalActiveOrder));
        return true;
    }

    public boolean isRunning() {
        return running.get();
    }

    public void setBackendClient(final BackendClient backendClient) {
        this.backendClient = backendClient;
    }

    private void reportJobStatus(final String status, final JsonObject payload) {
        Order order = PLUGIN_CONFIG.deliveryBot.activeOrder;
        if (order == null || order.backendJobId == null || order.backendJobId.isBlank()) return;
        BackendClient client = backendClient;
        if (client == null) return;
        try {
            client.updateJob(order.backendJobId, status, payload);
        } catch (Exception e) {
            warn("Failed to report job status {} for {}: {}", status, order.backendJobId, e.getMessage());
        }
    }

    private void reportJobStatus(final String status) {
        reportJobStatus(status, null);
    }

    public CompletionResult completeActiveOrderManually() {
        Order order = PLUGIN_CONFIG.deliveryBot.activeOrder;
        if (order == null) {
            return new CompletionResult(false, "No active delivery order configured");
        }
        if (order.state == State.COMPLETED) {
            return new CompletionResult(true, "Order `" + order.id + "` is already complete.");
        }
        if (order.state != State.WAITING_FOR_KILL) {
            return new CompletionResult(false, "Order must be waiting for the customer kill before it can be completed. Current state: " + order.state);
        }

        completeOrder(order, "Manually confirmed kill by " + order.orderIGN);
        return new CompletionResult(true, "Order `" + order.id + "` manually completed for `" + order.orderIGN + "`.");
    }

    public boolean cancel() {
        boolean wasRunning = running.getAndSet(false);
        BARITONE.stop();
        closeContainerQuietly();
        Order order = PLUGIN_CONFIG.deliveryBot.activeOrder;
        if (order != null && order.state != State.COMPLETED) {
            setOrderState(order, State.CANCELLED, "Cancelled");
            reportJobStatus("cancelled");
            saveConfigAsync();
            PLUGIN_CONFIG.deliveryBot.activeOrder = null;
            return true;
        }
        return wasRunning;
    }

    private void runWorkflow(final CommandContext ctx, final String name, final Workflow workflow) {
        try {
            workflow.run();
        } catch (WorkflowCancelledException e) {
            info("{} workflow cancelled", name);
        } catch (Exception e) {
            Order order = PLUGIN_CONFIG.deliveryBot.activeOrder;
            if (order != null) {
                setOrderState(order, State.FAILED, e.getMessage());
                reportJobStatus("failed");
                saveConfigAsync();
                PLUGIN_CONFIG.deliveryBot.activeOrder = null;
            }
            error("DeliveryBot {} workflow failed", name, e);
            notify(ctx, Embed.builder()
                .title("DeliveryBot Failed")
                .description(e.getMessage())
                .errorColor());
        } finally {
            running.set(false);
        }
    }

    // -------------------------------------------------------------------------
    // Prepare workflow: collect shulker boxes → deposit into ender chest → /kill → park
    // -------------------------------------------------------------------------

    private void prepareActiveOrder() throws Exception {
        Order order = requireActiveOrder();
        validateOrder(order);
        if (PLUGIN_CONFIG.deliveryBot.sourceChests.isEmpty()) {
            throw new IllegalStateException("No source chests configured");
        }

        setOrderState(order, State.PREPARING, "Collecting shulker boxes from source chests");
        reportJobStatus("preparing");
        saveConfigAsync();
        ensureOnline();
        closeOpenContainer();

        // Pull the specified number of shulker boxes from each pre-sorted source chest
        for (OrderItem item : order.items) {
            checkRunning();
            withdrawShulkerBoxesFromSource(item);
        }

        checkRunning();
        setOrderState(order, State.PREPARING, "Depositing shulker boxes into ender chest");
        saveConfigAsync();
        openNearestEnderChest();
        // Deposit ALL shulker boxes currently in inventory into the ender chest
        int deposited = transferAllShulkerBoxes(false);
        if (deposited == 0) {
            throw new IllegalStateException("No shulker boxes deposited into the ender chest — inventory may be empty");
        }
        closeOpenContainer();

        setOrderState(order, State.ENDER_CHEST_STOCKED, "Order stocked in ender chest");
        reportJobStatus("in_transit");
        saveConfigAsync();
        slashKillAndWaitForRespawn(order);

        checkRunning();
        setOrderState(order, State.KILLING_TO_SPAWN, "Pathing to nearest ender chest at spawn");
        saveConfigAsync();
        openNearestEnderChest();
        BlockPos deliveryPos = CACHE.getPlayerCache().getThePlayer().blockPos();
        order.deliveryLocation = new Position(deliveryPos.x(), deliveryPos.y(), deliveryPos.z());
        closeOpenContainer();

        setOrderState(order, State.WAITING_FOR_CUSTOMER, "Parked at delivery ender chest");
        reportHandoff(order);
        saveConfigAsync();
        notify(lastCommandContext, Embed.builder()
            .title("DeliveryBot Parked")
            .description("Order `" + order.id + "` is waiting for customer arrival.")
            .addField("Order IGN", order.orderIGN)
            .addField("Location", formatPosition(order.deliveryLocation))
            .successColor());

        MODULE.get(AutoReconnect.class).cancelAutoReconnect();
        Proxy.getInstance().disconnect(SYSTEM_DISCONNECT);
        reportJobStatus("ready_for_pickup");
    }

    private void reportHandoff(final Order order) {
        BackendClient client = backendClient;
        if (client == null || order.deliveryLocation == null) return;
        try {
            client.reportHandoff(order.id, order.deliveryLocation.x(), order.deliveryLocation.y(), order.deliveryLocation.z());
        } catch (Exception e) {
            warn("Failed to report handoff for order {}: {}", order.id, e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // Arrival workflow: withdraw shulker boxes from ender chest → wait for kill
    // -------------------------------------------------------------------------

    private void arrivalActiveOrder() throws Exception {
        Order order = requireActiveOrder();
        validateOrder(order);
        if (order.state != State.WAITING_FOR_CUSTOMER && order.state != State.WAITING_FOR_KILL) {
            throw new IllegalStateException("Order must be waiting for customer arrival before delivery. Current state: " + order.state);
        }

        setOrderState(order, State.DELIVERING, "Withdrawing shulker boxes from ender chest");
        reportJobStatus("dropping");
        saveConfigAsync();
        ensureOnline();
        closeOpenContainer();
        openNearestEnderChest();
        int withdrawn = transferAllShulkerBoxes(true);
        if (withdrawn == 0) {
            throw new IllegalStateException("No shulker boxes found in the ender chest to withdraw");
        }
        closeOpenContainer();

        setOrderState(order, State.DELIVERING, "Moving to drop point");
        saveConfigAsync();
        moveToDropPoint(order);
        dropAllShulkerBoxes();

        setOrderState(order, State.COMPLETED, "Items dropped for " + order.orderIGN);
        reportDropped(order);
        reportJobStatus("completed");
        saveConfigAsync();
        notify(lastCommandContext, Embed.builder()
            .title("DeliveryBot Dropped")
            .description("Dropped " + withdrawn + " shulker boxes for `" + order.orderIGN + "`.")
            .successColor());

        MODULE.get(AutoReconnect.class).cancelAutoReconnect();
        Proxy.getInstance().disconnect(SYSTEM_DISCONNECT);
    }

    private void moveToDropPoint(final Order order) throws Exception {
        // If a handoff location was provided by the backend, move a short distance away
        // from the ender chest to avoid dropping directly on top of it.
        if (order.deliveryLocation != null) {
            awaitPath(BARITONE.pathTo(order.deliveryLocation.x(), order.deliveryLocation.y(), order.deliveryLocation.z()), "move to drop point");
        }
    }

    private void dropAllShulkerBoxes() throws Exception {
        Container inventory = CACHE.getPlayerCache().getInventoryCache().getPlayerInventory();
        int dropped = 0;
        for (int slot = 9; slot < 45; slot++) {
            if (!isAnyShulkerBox(inventory.getItemStack(slot))) continue;

            // Move shulker to hotbar slot 0 if it isn't already there.
            if (slot != 36) {
                submitInventoryActions(List.of(
                    new ClickItem(0, slot, ClickItemAction.LEFT_CLICK),
                    new ClickItem(0, 36, ClickItemAction.LEFT_CLICK),
                    new ClickItem(0, slot, ClickItemAction.LEFT_CLICK)
                ), 1);
                Wait.waitMs(100);
            }

            // Select hotbar slot 0 and drop the item.
            Proxy.getInstance().getClient().sendAsync(new ServerboundSetCarriedItemPacket(0));
            Wait.waitMs(50);
            Proxy.getInstance().getClient().sendAsync(new ServerboundPlayerActionPacket(
                PlayerAction.DROP_ITEM,
                0, 0, 0,
                Direction.DOWN,
                0
            ));
            Wait.waitMs(200);
            dropped++;
        }
        if (dropped == 0) {
            throw new IllegalStateException("No shulker boxes found in inventory to drop");
        }
        info("Dropped {} shulker box(es)", dropped);
    }

    private void reportDropped(final Order order) {
        BackendClient client = backendClient;
        if (client == null) return;
        try {
            JsonObject proof = new JsonObject();
            if (order.deliveryLocation != null) {
                JsonObject coords = new JsonObject();
                coords.addProperty("x", order.deliveryLocation.x());
                coords.addProperty("y", order.deliveryLocation.y());
                coords.addProperty("z", order.deliveryLocation.z());
                proof.add("coords", coords);
            }
            proof.addProperty("bot_id", PLUGIN_CONFIG.deliveryBot.botId);
            client.reportDropped(order.id, proof);
        } catch (Exception e) {
            warn("Failed to report dropped for order {}: {}", order.id, e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // Shulker box collection
    // -------------------------------------------------------------------------

    private void withdrawShulkerBoxesFromSource(final OrderItem item) throws Exception {
        checkRunning();
        SourceChest source = requireSource(item.sourceChestId());
        setActiveStatus("Opening source chest " + source.id() + " for " + item.count() + " shulker boxes");
        openSourceChest(source);
        int moved = transferShulkerBoxes(true, item.count());
        closeOpenContainer();
        if (moved < item.count()) {
            throw new IllegalStateException(
                "Only withdrew " + moved + "/" + item.count() + " shulker boxes from chest '" + source.id() + "'"
            );
        }
    }

    /**
     * Shift-clicks up to {@code maxCount} shulker boxes from one container section to the other.
     *
     * @param fromTop true = source is the top (chest) slots, destination is player inventory;
     *                false = source is player inventory, destination is top (chest)
     * @param maxCount maximum number of shulker boxes to transfer (use Integer.MAX_VALUE to transfer all)
     * @return actual number transferred
     */
    private int transferShulkerBoxes(final boolean fromTop, final int maxCount) throws Exception {
        if (maxCount <= 0) return 0;
        Container container = currentOpenContainer();
        int containerId = container.getContainerId();
        SlotRange sourceRange = sourceRange(container, fromTop);
        int transferred = 0;

        while (running.get() && transferred < maxCount) {
            container = currentOpenContainer();
            if (container.getContainerId() != containerId) {
                throw new IllegalStateException("Open container changed while transferring shulker boxes");
            }
            sourceRange = sourceRange(container, fromTop);
            int sourceSlot = findShulkerBoxSlot(container, sourceRange);
            if (sourceSlot == -1) break; // no more shulker boxes in source

            int beforeCount = countShulkerBoxes(container, destinationRange(container, fromTop));
            submitInventoryActions(List.of(new ShiftClick(containerId, sourceSlot, ShiftClickItemAction.LEFT_CLICK)), null);
            waitForShulkerBoxCountIncrease(containerId, fromTop, beforeCount);
            transferred++;
        }
        if (!running.get()) throw new WorkflowCancelledException();
        return transferred;
    }

    /**
     * Transfers ALL shulker boxes found in the source section to the destination.
     */
    private int transferAllShulkerBoxes(final boolean fromTop) throws Exception {
        return transferShulkerBoxes(fromTop, Integer.MAX_VALUE);
    }

    // -------------------------------------------------------------------------
    // Stasis pearl reset (after PearlBot teleports DeliveryBot home)
    // -------------------------------------------------------------------------

    /**
     * After PearlBot triggers the existing stasis pearl and this bot is back at the chamber:
     * 1. Opens the PEARL CHEST and takes one enderpearl
     * 2. Equips it to main hand (hotbar slot 0)
     * 3. Looks straight down
     * 4. Throws it downward to arm the next stasis pearl
     */
    private void setReplacementEnderPearl(final Order order) throws Exception {
        Position pearlChestPos = PLUGIN_CONFIG.deliveryBot.pearlChest;
        Position stasisPos = PLUGIN_CONFIG.deliveryBot.stasisChamber;
        if (pearlChestPos == null) throw new IllegalStateException("Pearl chest position is not configured");
        if (stasisPos == null) throw new IllegalStateException("Stasis chamber position is not configured");

        setOrderState(order, State.STAGING_PEARL, "Opening pearl chest to retrieve enderpearl");
        saveConfigAsync();

        // 1. Open the pearl chest
        awaitPath(BARITONE.rightClickBlock(pearlChestPos.x(), pearlChestPos.y(), pearlChestPos.z()), "open pearl chest");
        waitForOpenContainer("pearl chest");
        Container chest = currentOpenContainer();
        int containerId = chest.getContainerId();

        // 2. Find one enderpearl in the chest and shift-click it to inventory
        int pearlSlot = findEnderPearlSlot(chest, sourceRange(chest, true));
        if (pearlSlot == -1) {
            throw new IllegalStateException("No enderpearl found in the pearl chest");
        }
        int beforeCount = countItem(chest, destinationRange(chest, true), ENDER_PEARL_ITEM);
        submitInventoryActions(List.of(new ShiftClick(containerId, pearlSlot, ShiftClickItemAction.LEFT_CLICK)), null);
        waitForDestinationIncrease(containerId, true, ENDER_PEARL_ITEM, beforeCount);
        closeOpenContainer();

        checkRunning();
        setActiveStatus("Returning to stasis chamber stand position");

        // Opening the pearl chest may move the bot slightly. Return to the configured
        // stand position before throwing the replacement pearl.
        awaitPath(BARITONE.pathTo(stasisPos.x(), stasisPos.y(), stasisPos.z()), "return to stasis chamber");

        checkRunning();

        // 4. Equip enderpearl to hotbar slot 0 (main hand) and look straight down
        equipEnderPearlToMainHand();
        lookStraightDown();
        Wait.waitMs(300); // brief settle

        // 5. Use the item (throw pearl downward into stasis)
        Proxy.getInstance().getClient().sendAsync(new ServerboundUseItemPacket(
            org.geysermc.mcprotocollib.protocol.data.game.entity.player.Hand.MAIN_HAND, 0, 0f, 0f
        ));

        // Brief wait for the pearl entity to register
        Wait.waitMs(500);

        setActiveStatus("Replacement stasis pearl staged");
    }

    private void triggerStasisTeleport(final Order order) throws Exception {
        Position stasisPos = PLUGIN_CONFIG.deliveryBot.stasisChamber;
        if (stasisPos == null) throw new IllegalStateException("Stasis chamber position is not configured");

        setOrderState(order, State.STAGING_PEARL, "Triggering existing stasis pearl via PearlBot");
        saveConfigAsync();
        PearlBotClient.closeTrapDoor(order.id, PLUGIN_CONFIG.deliveryBot.pearlBotUrl, PLUGIN_CONFIG.deliveryBot.apiSecret);

        boolean teleported = Wait.waitUntil(
            () -> isNear(CACHE.getPlayerCache().getThePlayer().blockPos(), stasisPos, 3),
            200,
            PLUGIN_CONFIG.deliveryBot.operationTimeoutSeconds,
            TimeUnit.SECONDS);
        if (!teleported) {
            throw new IllegalStateException("Timed out waiting for PearlBot stasis teleport");
        }
        Wait.waitMs(1000);
    }

    private boolean isNear(final BlockPos actual, final Position target, final int radius) {
        int dx = actual.x() - target.x();
        int dy = actual.y() - target.y();
        int dz = actual.z() - target.z();
        return dx * dx + dy * dy + dz * dz <= radius * radius;
    }

    /**
     * Moves the enderpearl from wherever it is in the player inventory to hotbar slot 0.
     */
    private void equipEnderPearlToMainHand() throws Exception {
        Container inventory = CACHE.getPlayerCache().getInventoryCache().getPlayerInventory();
        int inventoryContainerId = 0; // player inventory is always container 0

        // Hotbar slots 36-44 map to hotbar positions 0-8; slot 36 = hotbar slot 0 (main hand when selectedSlot=0)
        int hotbarSlot0 = 36;

        // Check if enderpearl is already in hotbar slot 0
        if (isEnderPearl(inventory.getItemStack(hotbarSlot0))) {
            return;
        }

        // Find enderpearl anywhere in inventory (slots 9-44)
        for (int i = 9; i < 45; i++) {
            if (isEnderPearl(inventory.getItemStack(i))) {
                // Swap with hotbar slot 0 via click
                submitInventoryActions(List.of(
                    new ClickItem(inventoryContainerId, i, ClickItemAction.LEFT_CLICK),
                    new ClickItem(inventoryContainerId, hotbarSlot0, ClickItemAction.LEFT_CLICK),
                    new ClickItem(inventoryContainerId, i, ClickItemAction.LEFT_CLICK)
                ), 1);
                Wait.waitMs(200);
                return;
            }
        }
        throw new IllegalStateException("Enderpearl not found in inventory after taking from pearl chest");
    }

    /**
     * Sends a rotation packet looking straight down (pitch = 90°).
     */
    private void lookStraightDown() {
        float currentYaw = CACHE.getPlayerCache().getYaw();
        // boolean args: onGround, horizontalCollision, yaw, pitch
        Proxy.getInstance().getClient().sendAsync(
            new ServerboundMovePlayerRotPacket(true, false, currentYaw, 90.0f)
        );
        Wait.waitMs(100);
    }

    // -------------------------------------------------------------------------
    // Inventory helpers
    // -------------------------------------------------------------------------

    private void submitInventoryActions(final List<InventoryAction> actions, final @Nullable Integer delayTicks) throws Exception {
        if (actions.isEmpty()) return;
        var builder = InventoryActionRequest.builder()
            .owner(this)
            .actions(actions)
            .priority(PLUGIN_CONFIG.deliveryBot.actionPriority);
        if (delayTicks != null) {
            builder.actionDelayTicks(delayTicks);
        }
        boolean accepted = INVENTORY.submit(builder.build()).get(PLUGIN_CONFIG.deliveryBot.operationTimeoutSeconds, TimeUnit.SECONDS);
        if (!accepted) {
            throw new IllegalStateException("Inventory action request was rejected");
        }
    }

    private void waitForShulkerBoxCountIncrease(final int containerId, final boolean fromTop, final int beforeCount) {
        boolean updated = Wait.waitUntil(() -> {
            if (CACHE.getPlayerCache().getInventoryCache().getOpenContainerId() != containerId) return true;
            Container current = CACHE.getPlayerCache().getInventoryCache().getOpenContainer();
            return countShulkerBoxes(current, destinationRange(current, fromTop)) > beforeCount;
        }, 50, 5, TimeUnit.SECONDS);
        if (!updated) {
            throw new IllegalStateException("Timed out waiting for shulker box to arrive in destination");
        }
    }

    private void waitForDestinationIncrease(final int containerId, final boolean fromTop, final String itemName, final int beforeCount) {
        boolean updated = Wait.waitUntil(() -> {
            if (CACHE.getPlayerCache().getInventoryCache().getOpenContainerId() != containerId) return true;
            Container current = CACHE.getPlayerCache().getInventoryCache().getOpenContainer();
            return countItem(current, destinationRange(current, fromTop), itemName) > beforeCount;
        }, 50, 5, TimeUnit.SECONDS);
        if (!updated) {
            throw new IllegalStateException("Timed out waiting for inventory update while moving " + itemName);
        }
    }

    private void closeOpenContainer() throws Exception {
        int openContainerId = CACHE.getPlayerCache().getInventoryCache().getOpenContainerId();
        if (openContainerId == 0) return;
        submitInventoryActions(List.of(new CloseContainer(openContainerId)), null);
        Wait.waitUntil(() -> CACHE.getPlayerCache().getInventoryCache().getOpenContainerId() == 0, 50, 5, TimeUnit.SECONDS);
    }

    private void closeContainerQuietly() {
        try {
            closeOpenContainer();
        } catch (Exception ignored) { }
    }

    private Container currentOpenContainer() {
        Container container = CACHE.getPlayerCache().getInventoryCache().getOpenContainer();
        if (container.getContainerId() == 0) {
            throw new IllegalStateException("No open container");
        }
        if (container.getSize() <= 36) {
            throw new IllegalStateException("Open container has no storage slots");
        }
        return container;
    }

    private SlotRange sourceRange(final Container container, final boolean fromTop) {
        int topEnd = container.getSize() - 36;
        return fromTop ? new SlotRange(0, topEnd) : new SlotRange(topEnd, container.getSize());
    }

    private SlotRange destinationRange(final Container container, final boolean fromTop) {
        int topEnd = container.getSize() - 36;
        return fromTop ? new SlotRange(topEnd, container.getSize()) : new SlotRange(0, topEnd);
    }

    // -------------------------------------------------------------------------
    // Item detection helpers
    // -------------------------------------------------------------------------

    /** Returns true if the stack is any variant of a shulker box. */
    private boolean isAnyShulkerBox(final @Nullable ItemStack stack) {
        if (stack == null || stack == Container.EMPTY_STACK) return false;
        ItemData item = ItemRegistry.REGISTRY.get(stack.getId());
        if (item == null) return false;
        return SHULKER_BOX_NAMES.contains(item.name());
    }

    private boolean isEnderPearl(final @Nullable ItemStack stack) {
        if (stack == null || stack == Container.EMPTY_STACK) return false;
        ItemData item = ItemRegistry.REGISTRY.get(stack.getId());
        return item != null && item.name().equals(ENDER_PEARL_ITEM);
    }

    private boolean isItem(final @Nullable ItemStack stack, final String itemName) {
        if (stack == null || stack == Container.EMPTY_STACK) return false;
        ItemData item = ItemRegistry.REGISTRY.get(stack.getId());
        return item != null && item.name().equals(itemName);
    }

    private int findShulkerBoxSlot(final Container container, final SlotRange range) {
        for (int i = range.start(); i < range.end(); i++) {
            if (isAnyShulkerBox(container.getItemStack(i))) return i;
        }
        return -1;
    }

    private int findEnderPearlSlot(final Container container, final SlotRange range) {
        for (int i = range.start(); i < range.end(); i++) {
            if (isEnderPearl(container.getItemStack(i))) return i;
        }
        return -1;
    }

    private int countShulkerBoxes(final Container container, final SlotRange range) {
        int count = 0;
        for (int i = range.start(); i < range.end(); i++) {
            if (isAnyShulkerBox(container.getItemStack(i))) count++;
        }
        return count;
    }

    private int countItem(final Container container, final SlotRange range, final String itemName) {
        int count = 0;
        for (int i = range.start(); i < range.end(); i++) {
            ItemStack stack = container.getItemStack(i);
            if (isItem(stack, itemName)) {
                count += stack.getAmount();
            }
        }
        return count;
    }

    // -------------------------------------------------------------------------
    // Pathing helpers
    // -------------------------------------------------------------------------

    private void openSourceChest(final SourceChest source) throws Exception {
        awaitPath(BARITONE.rightClickBlock(source.x(), source.y(), source.z()), "open source chest " + source.id());
        waitForOpenContainer("source chest " + source.id());
    }

    private void openNearestEnderChest() throws Exception {
        awaitPath(BARITONE.getTo(BlockRegistry.ENDER_CHEST, true), "open nearest ender chest");
        waitForOpenContainer("ender chest");
    }

    private void slashKillAndWaitForRespawn(final Order order) {
        checkRunning();
        setOrderState(order, State.KILLING_TO_SPAWN, "Sending /kill");
        saveConfigAsync();
        Proxy.getInstance().getClient().sendAsync(new ServerboundChatPacket("/kill"));
        boolean died = Wait.waitUntil(() -> !CACHE.getPlayerCache().isAlive(), 100, PLUGIN_CONFIG.deliveryBot.operationTimeoutSeconds, TimeUnit.SECONDS);
        if (!died) {
            throw new IllegalStateException("Timed out waiting for /kill to take effect");
        }
        if (!CACHE.getPlayerCache().isAlive()) {
            Proxy.getInstance().getClient().sendAsync(new ServerboundClientCommandPacket(ClientCommand.RESPAWN));
        }
        boolean respawned = Wait.waitUntil(
            () -> Proxy.getInstance().isConnected() && CACHE.getPlayerCache().isAlive(),
            100,
            PLUGIN_CONFIG.deliveryBot.operationTimeoutSeconds,
            TimeUnit.SECONDS);
        if (!respawned) {
            throw new IllegalStateException("Timed out waiting for respawn after /kill");
        }
        Wait.waitMs(2000);
    }

    private void awaitPath(final PathingRequestFuture future, final String action) throws Exception {
        boolean accepted = future.get(PLUGIN_CONFIG.deliveryBot.operationTimeoutSeconds, TimeUnit.SECONDS);
        if (!accepted) {
            throw new IllegalStateException("Failed to " + action);
        }
    }

    private void waitForOpenContainer(final String label) {
        boolean opened = Wait.waitUntil(
            () -> CACHE.getPlayerCache().getInventoryCache().getOpenContainerId() != 0,
            50,
            10,
            TimeUnit.SECONDS);
        if (!opened) {
            throw new IllegalStateException("Timed out opening " + label);
        }
    }

    // -------------------------------------------------------------------------
    // Online / connection helpers
    // -------------------------------------------------------------------------

    private void ensureOnline() {
        if (Proxy.getInstance().hasActivePlayer()) {
            throw new IllegalStateException("A player is currently controlling the account");
        }
        if (!Proxy.getInstance().isConnected()) {
            Proxy.getInstance().connectAndCatchExceptions();
        }
        boolean online = Wait.waitUntil(
            () -> Proxy.getInstance().isConnected()
                && !Proxy.getInstance().isInQueue()
                && CACHE.getPlayerCache().getThePlayer().getEntityId() != -1,
            500,
            PLUGIN_CONFIG.deliveryBot.onlineTimeoutSeconds,
            TimeUnit.SECONDS);
        if (!online) {
            throw new IllegalStateException("Timed out waiting for the delivery account to be online");
        }
        if (!CACHE.getPlayerCache().isAlive()) {
            Proxy.getInstance().getClient().sendAsync(new ServerboundClientCommandPacket(ClientCommand.RESPAWN));
            Wait.waitUntil(() -> CACHE.getPlayerCache().isAlive(), 100, 30, TimeUnit.SECONDS);
        }
        if (!CACHE.getPlayerCache().isAlive()) {
            throw new IllegalStateException("Delivery account is not alive");
        }
    }

    // -------------------------------------------------------------------------
    // Order validation / state helpers
    // -------------------------------------------------------------------------

    private Order requireActiveOrder() {
        Order order = PLUGIN_CONFIG.deliveryBot.activeOrder;
        if (order == null) {
            throw new IllegalStateException("No active delivery order configured");
        }
        return order;
    }

    private SourceChest requireSource(final String id) {
        return PLUGIN_CONFIG.deliveryBot.sourceChests.stream()
            .filter(s -> s.id().equalsIgnoreCase(id))
            .findFirst()
            .orElseThrow(() -> new IllegalStateException("Source chest '" + id + "' not found in config"));
    }

    private void validateOrder(final Order order) {
        if (order.id == null || order.id.isBlank()) {
            throw new IllegalStateException("Order id is not set");
        }
        if (order.orderIGN == null || order.orderIGN.isBlank()) {
            throw new IllegalStateException("Order IGN is not set");
        }
        if (order.items.isEmpty()) {
            throw new IllegalStateException("Order has no items");
        }
        for (OrderItem item : order.items) {
            if (item.count() <= 0) {
                throw new IllegalStateException("Invalid shulker box count for source " + item.sourceChestId());
            }
            if (item.sourceChestId() == null || item.sourceChestId().isBlank()) {
                throw new IllegalStateException("Missing sourceChestId on order item");
            }
            requireSource(item.sourceChestId()); // validate the source exists
        }
    }

    private void setActiveStatus(final String status) {
        Order order = PLUGIN_CONFIG.deliveryBot.activeOrder;
        if (order == null) return;
        setOrderState(order, order.state, status);
        saveConfigAsync();
        info(status);
    }

    private void setOrderState(final Order order, final State state, final @Nullable String status) {
        order.state = state;
        order.status = status;
        order.updatedAtEpochMs = System.currentTimeMillis();
    }

    private void checkRunning() {
        if (!running.get()) throw new WorkflowCancelledException();
        if (Proxy.getInstance().hasActivePlayer()) {
            throw new IllegalStateException("A player started controlling the account");
        }
    }

    // -------------------------------------------------------------------------
    // Death event handlers → trigger stasis pearl staging
    // -------------------------------------------------------------------------

    private void handleDeathMessage(final DeathMessageChatEvent event) {
        if (!PLUGIN_CONFIG.deliveryBot.pearlBotEnabled) return;
        Order order = PLUGIN_CONFIG.deliveryBot.activeOrder;
        if (order == null || order.state != State.WAITING_FOR_KILL) return;
        String selfName = CACHE.getProfileCache().getProfile().getName();
        if (!event.deathMessage().victim().equalsIgnoreCase(selfName)) return;
        var killer = event.deathMessage().killer();
        if (killer.isEmpty()
            || killer.get().type() != KillerType.PLAYER
            || !killer.get().name().equalsIgnoreCase(order.orderIGN)) {
            warn("Ignoring delivery death because killer did not match order IGN. Expected: {}, message: {}", order.orderIGN, event.message());
            return;
        }
        completeOrderAndStage(order, killer.get().name());
    }

    private void handleSystemChat(final SystemChatEvent event) {
        if (!PLUGIN_CONFIG.deliveryBot.pearlBotEnabled) return;
        Order order = PLUGIN_CONFIG.deliveryBot.activeOrder;
        if (order == null || order.state != State.WAITING_FOR_KILL) return;
        String selfName = CACHE.getProfileCache().getProfile().getName();
        if (!isVanillaPlayerKillMessage(event.message(), selfName, order.orderIGN)) return;
        completeOrderAndStage(order, order.orderIGN);
    }

    private boolean isVanillaPlayerKillMessage(final String message, final String selfName, final String killerName) {
        String self = Pattern.quote(selfName);
        String killer = Pattern.quote(killerName);
        return Pattern.compile("^" + self + " was slain by " + killer + "(?: using .+)?$").matcher(message).matches()
            || Pattern.compile("^" + self + " was shot by " + killer + "(?: using .+)?$").matcher(message).matches()
            || Pattern.compile("^" + self + " was fireballed by " + killer + "(?: using .+)?$").matcher(message).matches()
            || Pattern.compile("^" + self + " was killed by " + killer + "(?: using magic)?$").matcher(message).matches()
            || Pattern.compile("^" + self + " was blown up by " + killer + "(?: using .+)?$").matcher(message).matches()
            || Pattern.compile("^" + self + " was doomed to fall by " + killer + "(?: using .+)?$").matcher(message).matches()
            || Pattern.compile("^" + self + " fell too far and was finished by " + killer + "(?: using .+)?$").matcher(message).matches()
            || Pattern.compile("^" + self + " was killed trying to hurt " + killer + "$").matcher(message).matches()
            || Pattern.compile("^" + self + " didn't want to live in the same world as " + killer + "$").matcher(message).matches();
    }

    /**
     * Called when the customer successfully kills this bot.
     * Marks the order as staging pearl, then asynchronously runs the stasis staging workflow.
     */
    private void completeOrderAndStage(final Order order, final String killerName) {
        if (!PLUGIN_CONFIG.deliveryBot.pearlBotEnabled) {
            completeOrder(order, "Killed by " + killerName + " — pearl bot disabled");
            return;
        }
        notify(lastCommandContext, Embed.builder()
            .title("DeliveryBot Killed")
            .description("Killed by `" + killerName + "`. Respawning, triggering stasis teleport, then setting the next pearl...")
            .primaryColor());

        // Run the pearl staging in the executor — it needs to respawn first
        if (running.compareAndSet(false, true)) {
            EXECUTOR.execute(() -> runWorkflow(lastCommandContext, "pearl staging", () -> {
                // Wait for the bot to respawn after being killed
                boolean respawned = Wait.waitUntil(
                    () -> Proxy.getInstance().isConnected() && CACHE.getPlayerCache().isAlive(),
                    200,
                    PLUGIN_CONFIG.deliveryBot.operationTimeoutSeconds,
                    TimeUnit.SECONDS);
                if (!respawned) {
                    throw new IllegalStateException("Timed out waiting for respawn after customer kill");
                }
                Wait.waitMs(2000); // let the world load

                triggerStasisTeleport(order);
                setReplacementEnderPearl(order);

                completeOrder(order, "Killed by " + killerName + " — teleported to stasis and replacement pearl staged");
                notify(lastCommandContext, Embed.builder()
                    .title("DeliveryBot Order Complete")
                    .description("Order `" + order.id + "` is complete. DeliveryBot was teleported to stasis and set the next pearl.")
                    .successColor());
            }));
        }
    }

    private void completeOrder(final Order order, final String status) {
        setOrderState(order, State.COMPLETED, status);
        saveConfigAsync();
        PLUGIN_CONFIG.deliveryBot.activeOrder = null;
    }

    // -------------------------------------------------------------------------
    // Formatting / notification helpers
    // -------------------------------------------------------------------------

    private String formatPosition(final @Nullable Position position) {
        if (position == null) return "Unknown";
        if (!CONFIG.discord.reportCoords) return "Coords disabled";
        return "||[" + position.x() + ", " + position.y() + ", " + position.z() + "]||";
    }

    private void notify(final @Nullable CommandContext ctx, final Embed embed) {
        if (ctx != null) {
            ctx.getSource().logEmbed(ctx, embed);
        } else {
            DISCORD.sendEmbedMessage(embed);
        }
    }

    // -------------------------------------------------------------------------
    // Inner types
    // -------------------------------------------------------------------------

    private record SlotRange(int start, int end) { }

    public record CompletionResult(boolean success, String message) { }

    private interface Workflow {
        void run() throws Exception;
    }

    private static final class WorkflowCancelledException extends RuntimeException { }
}
