package com.shulkershop.advert;

import com.shulkershop.advert.config.BotConfig;
import com.zenith.plugin.api.Plugin;
import com.zenith.plugin.api.PluginAPI;
import com.zenith.plugin.api.ZenithProxyPlugin;

import java.nio.file.Path;
import java.nio.file.Paths;

@Plugin(
        id = "shulker-advert",
        version = "0.1.0",
        description = "Fake-conversation advert bot for 2b2t",
        url = "https://shulker.shop",
        authors = {"shulker-mechanic"},
        mcVersions = {"1.21.4"}
)
public class AdvertPlugin implements ZenithProxyPlugin {

    @Override
    public void onLoad(PluginAPI api) {
        try {
            Path configPath = Paths.get("advert-bot", "config", "bot-config.json");
            BotConfig config = BotConfig.load(configPath);
            System.out.println("[ShulkerAdvert] Loaded config for role: " + config.botRole);

            AdvertModule module = new AdvertModule(api, config);
            api.registerModule(module);
        } catch (Exception e) {
            System.err.println("[ShulkerAdvert] Failed to load: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
