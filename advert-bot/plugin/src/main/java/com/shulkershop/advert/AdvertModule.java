package com.shulkershop.advert;

import com.shulkershop.advert.config.BotConfig;
import com.zenith.module.api.Module;
import com.zenith.plugin.api.PluginAPI;
import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.util.Collections;
import java.util.List;

/**
 * Main advert module. Handles conversation playback, chat event listening,
 * whisper replies, and safety pauses.
 *
 * Chat packet sending uses reflection to avoid a compile-time dependency on
 * MCProtocolLib. At runtime the classes are provided by ZenithProxy.
 */
public class AdvertModule extends Module {

    private final BotConfig config;
    private final BackendClient backend;
    private final ConversationPlayer player;
    private final SafetyModule safety;
    private final ConversationPoller poller;

    public AdvertModule(PluginAPI api, BotConfig config) {
        this.config = config;
        this.backend = new BackendClient(config);
        this.safety = new SafetyModule(config);
        this.player = new ConversationPlayer(config, backend, safety, this);
        this.poller = new ConversationPoller(config, backend, player, safety);
    }

    @Override
    public boolean enabledSetting() {
        return true;
    }

    @Override
    public void onEnable() {
        System.out.println("[ShulkerAdvert] Module enabled for role: " + config.botRole);
        poller.start();
    }

    @Override
    @SuppressWarnings({"rawtypes", "unchecked"})
    public List registerEvents() {
        // TODO: subscribe to PublicChatEvent, WhisperChatEvent, SystemChatEvent
        // when EventConsumer API is available at compile time.
        return Collections.emptyList();
    }

    /**
     * Sends a chat message or whisper using reflection.
     */
    public void sendChat(String message) {
        try {
            Class<?> packetClass = Class.forName(
                    "org.geysermc.mcprotocollib.protocol.packet.ingame.serverbound.ServerboundChatPacket"
            );
            Constructor<?> ctor = packetClass.getConstructor(String.class);
            Object packet = ctor.newInstance(message);

            Method sendMethod = Module.class.getDeclaredMethod("sendClientPacketAsync", Object.class);
            sendMethod.invoke(this, packet);
        } catch (Exception e) {
            System.err.println("[ShulkerAdvert] Failed to send chat: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
