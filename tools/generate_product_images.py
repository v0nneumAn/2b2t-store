#!/usr/bin/env python3
"""
Generate high-resolution Minecraft shulker-box product images.

Requires Pillow (pip install Pillow).
Run from the repo root:
    python tools/generate_product_images.py

Outputs to web/public/assets/products/.
Item textures are downloaded once from assets.mcasset.cloud and cached under
/tmp/mc_product_cache.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import List, Optional
from urllib.request import urlopen
from urllib.error import HTTPError

from PIL import Image, ImageDraw, ImageFilter

ASSET_VERSION = "1.21.4"
ASSET_BASE = f"https://assets.mcasset.cloud/{ASSET_VERSION}/assets/minecraft"
CACHE_DIR = Path("/tmp/mc_product_cache")
OUTPUT_DIR = Path("web/public/assets/products")

GUI_CROP = (0, 0, 176, 83)  # top part of shulker_box.png (title + 3x9 slots)
SLOT_ORIGIN = (7, 17)
SLOT_SIZE = 18

CANVAS_W, CANVAS_H = 1600, 1000
GUI_WIDTH = 1200  # scaled width of the GUI crop on the canvas
SHADOW_OFFSET = 30
SHADOW_BLUR = 20
SHADOW_ALPHA = 80
ITEM_FILL = 0.85  # item icon fills this fraction of a slot


def texture_url(path: str) -> str:
    """Return a full asset URL for a minecraft texture path."""
    return f"{ASSET_BASE}/{path}"


def fetch_texture(path: str) -> Image.Image:
    """Fetch a texture into the local cache and return it as RGBA."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    safe_name = path.replace("/", "_")
    local = CACHE_DIR / safe_name
    if not local.exists():
        url = texture_url(path)
        try:
            with urlopen(url, timeout=30) as resp:
                local.write_bytes(resp.read())
        except HTTPError as e:
            raise RuntimeError(f"Failed to download {url}: {e}") from e
    return Image.open(local).convert("RGBA")


def get_item_texture(item_id: str) -> Image.Image:
    """Resolve an item id like 'diamond_sword' or 'block/tnt_side' to a texture."""
    if item_id.startswith("block/"):
        return fetch_texture(f"textures/{item_id}.png")
    return fetch_texture(f"textures/item/{item_id}.png")


def draw_shadow(canvas: Image.Image, box: tuple[int, int, int, int]) -> None:
    """Draw a soft rounded shadow behind the given box."""
    x1, y1, x2, y2 = box
    w, h = x2 - x1, y2 - y1
    shadow = Image.new("RGBA", (w + SHADOW_OFFSET * 2, h + SHADOW_OFFSET * 2), (0, 0, 0, 0))
    draw = ImageDraw.Draw(shadow)
    draw.rounded_rectangle(
        [SHADOW_OFFSET, SHADOW_OFFSET, SHADOW_OFFSET + w, SHADOW_OFFSET + h],
        radius=20,
        fill=(0, 0, 0, SHADOW_ALPHA),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=SHADOW_BLUR))
    canvas.paste(shadow, (x1 - SHADOW_OFFSET, y1 - SHADOW_OFFSET), shadow)


def generate_product(product_id: str, slots: List[Optional[str]]) -> Path:
    """Render one product image and return the output path."""
    if len(slots) != 27:
        raise ValueError(f"product {product_id} must have exactly 27 slots")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    gui = fetch_texture("textures/gui/container/shulker_box.png")
    gui_top = gui.crop(GUI_CROP)

    scale = GUI_WIDTH / gui_top.width
    gui_h = int(gui_top.height * scale)
    gui_scaled = gui_top.resize((GUI_WIDTH, gui_h), Image.NEAREST)

    canvas = Image.new("RGBA", (CANVAS_W, CANVAS_H), (255, 255, 255, 255))

    x0 = (CANVAS_W - GUI_WIDTH) // 2
    y0 = (CANVAS_H - gui_h) // 2
    draw_shadow(canvas, (x0, y0, x0 + GUI_WIDTH, y0 + gui_h))
    canvas.paste(gui_scaled, (x0, y0), gui_scaled)

    item_slot_px = SLOT_SIZE * scale
    item_icon_px = int(item_slot_px * ITEM_FILL)

    for idx, item_id in enumerate(slots):
        if item_id is None:
            continue
        col = idx % 9
        row = idx // 9
        sx = SLOT_ORIGIN[0] + col * SLOT_SIZE
        sy = SLOT_ORIGIN[1] + row * SLOT_SIZE

        icon = get_item_texture(item_id)
        icon = icon.resize((item_icon_px, item_icon_px), Image.NEAREST)

        ix = int(x0 + sx * scale + (item_slot_px - item_icon_px) / 2)
        iy = int(y0 + sy * scale + (item_slot_px - item_icon_px) / 2)
        canvas.paste(icon, (ix, iy), icon)

    out_path = OUTPUT_DIR / f"{product_id}.png"
    canvas.save(out_path, "PNG")
    print(f"Saved {out_path}")
    return out_path


# ---------------------------------------------------------------------------
# Product layouts: 27 slots per shulker (3 rows of 9, left-to-right, top-down).
# Use None for an empty slot. Prefix with "block/" to load a block texture.
# ---------------------------------------------------------------------------
PRODUCTS = {
    "demo-starter-kit": [
        "netherite_sword", "netherite_pickaxe", "netherite_axe", "bow", "arrow",
        "totem_of_undying", "golden_apple", "golden_carrot", "cooked_beef",
        "netherite_helmet", "netherite_chestplate", "netherite_leggings", "netherite_boots",
        "mace", "ender_pearl", "firework_rocket", "wind_charge", "experience_bottle",
        "bread", "baked_potato", "bucket", "block/torch", "block/obsidian", "water_bucket",
        "lava_bucket", "flint_and_steel", "block/tnt_side",
    ],
    "demo-totem-box": ["totem_of_undying"] * 27,
    "demo-pvp-kit": [
        "netherite_sword", "mace", "bow", "crossbow_standby", "arrow", "wind_charge",
        "ender_pearl", "golden_apple", "totem_of_undying",
        "netherite_helmet", "netherite_chestplate", "netherite_leggings", "netherite_boots",
        "splash_potion", "splash_potion", "lingering_potion", "experience_bottle", "golden_carrot",
        "cooked_beef", "baked_potato", "firework_rocket", "ender_pearl", "totem_of_undying",
        "totem_of_undying", "wind_charge", "wind_charge", "mace",
    ],
    "demo-spawn-kit": [
        "elytra", "firework_rocket", "firework_rocket", "ender_pearl", "ender_pearl",
        "golden_carrot", "golden_carrot", "water_bucket", "totem_of_undying",
        "block/obsidian", "block/obsidian", "block/obsidian", "block/obsidian",
        "flint_and_steel", "block/torch", "redstone", "block/tnt_side", "end_crystal",
        "mace", "netherite_sword", "wind_charge", "splash_potion", "golden_apple",
        "cooked_beef", "bread", "bucket", "experience_bottle",
    ],
    "demo-survival-kit": [
        "netherite_pickaxe", "netherite_axe", "netherite_shovel", "netherite_hoe",
        "netherite_sword", "bow", "arrow", "block/torch", "bucket",
        "netherite_helmet", "netherite_chestplate", "netherite_leggings", "netherite_boots",
        "golden_apple", "golden_carrot", "cooked_beef", "baked_potato", "bread",
        "water_bucket", "lava_bucket", "flint_and_steel", "block/obsidian", "ender_pearl",
        "totem_of_undying", "experience_bottle", "firework_rocket", "mace",
    ],
    "demo-egap-box": ["golden_apple"] * 27,
    "demo-travel-kit": [
        "elytra", "firework_rocket", "firework_rocket", "firework_rocket", "ender_pearl",
        "ender_pearl", "golden_carrot", "golden_carrot", "water_bucket",
        "oak_boat", "saddle", "lead", "name_tag", "map", "fishing_rod",
        "carrot_on_a_stick", "warped_fungus_on_a_stick", "shears",
        "bread", "cooked_beef", "baked_potato", "golden_carrot", "pumpkin_pie",
        "melon_slice", "cake", "cookie", "sweet_berries",
    ],
    "demo-adventure-kit": [
        "bow", "crossbow_standby", "arrow", "spectral_arrow", "arrow", "trident",
        "fishing_rod", "carrot_on_a_stick", "warped_fungus_on_a_stick",
        "netherite_sword", "netherite_axe", "block/torch", "block/torch", "block/torch", "block/torch",
        "bucket", "water_bucket", "lava_bucket",
        "golden_apple", "golden_carrot", "cooked_beef", "bread", "baked_potato",
        "pumpkin_pie", "cookie", "experience_bottle", "totem_of_undying",
    ],
}


def main() -> int:
    for product_id, slots in PRODUCTS.items():
        generate_product(product_id, slots)
    return 0


if __name__ == "__main__":
    sys.exit(main())
