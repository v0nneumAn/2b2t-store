package com.setup;

import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.World;
import org.bukkit.plugin.java.JavaPlugin;

public class SetupWorldPlugin extends JavaPlugin {
    @Override
    public void onEnable() {
        Bukkit.getScheduler().runTaskLater(this, this::setup, 1L);
    }

    private void setup() {
        World world = Bukkit.getWorlds().get(0);
        Location spawn = world.getSpawnLocation();
        world.getChunkAt(spawn).load(true);

        Location ecLoc = spawn.clone();
        ecLoc.setY(world.getHighestBlockYAt(spawn));
        ecLoc.getBlock().setType(Material.ENDER_CHEST);
        getLogger().info("Placed ender chest at " + ecLoc);

        Location chestLoc = ecLoc.clone().add(2, 0, 2);
        chestLoc.setY(world.getHighestBlockYAt(chestLoc));
        chestLoc.getBlock().setType(Material.CHEST);
        getLogger().info("Placed empty chest at " + chestLoc);

        Bukkit.getScheduler().runTaskLater(this, () -> fillChest(chestLoc), 2L);

        String opPlayer = System.getenv("SETUP_OP_PLAYER");
        if (opPlayer != null && !opPlayer.isBlank()) {
            dispatch("op " + opPlayer);
        }
    }

    private void fillChest(Location loc) {
        StringBuilder items = new StringBuilder();
        for (int i = 0; i < 27; i++) {
            if (i > 0) items.append(",");
            items.append("{Slot:").append(i).append("b,id:\"minecraft:shulker_box\",Count:1b}");
        }
        String cmd = "data merge block " + loc.getBlockX() + " " + loc.getBlockY() + " " + loc.getBlockZ() + " {Items:[" + items + "]}";
        boolean ok = dispatch(cmd);
        getLogger().info("Fill chest command result: " + ok);
    }

    private boolean dispatch(String command) {
        boolean ok = Bukkit.dispatchCommand(Bukkit.getConsoleSender(), command);
        getLogger().info("Command '" + command + "' result: " + ok);
        return ok;
    }
}
