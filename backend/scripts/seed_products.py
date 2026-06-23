#!/usr/bin/env python3
"""Seed the partner's storefront catalog into the database."""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy.orm import Session
from src.models import engine, SessionLocal, Base, Product


def shulker_box(display_name: str) -> list:
    """Return a generic shulker-box content payload."""
    return [
        {
            "item_name": "minecraft:shulker_box",
            "display_name": display_name,
            "quantity": 1,
        }
    ]


SEED_PRODUCTS = [
    # --- Other / Generic ---
    {
        "id": "other-giftcard",
        "name": "Shulker of Gift Cards ($25)",
        "server": "other",
        "category": "packs",
        "price_usd": 25.00,
        "image_url": "/assets/landing/logo_transparent.png",
        "description": "Contains a physical voucher redeemable in-game for $25 of store credit on any server. Packed in a signature glowing purple shulker box.",
    },
    {
        "id": "other-cape",
        "name": "Shulker of Cape Vouchers",
        "server": "other",
        "category": "items",
        "price_usd": 3.49,
        "image_url": "/assets/landing/logo_transparent.png",
        "description": "Delivers a custom cape texture voucher. Redeemable on our site to apply a glowing cape design visible to all OptiFine/Labymod users. Shipped in a shulker box.",
    },
    {
        "id": "other-nitro",
        "name": "Shulker of Nitro Codes",
        "server": "other",
        "category": "packs",
        "price_usd": 9.99,
        "image_url": "/assets/landing/logo_transparent.png",
        "description": "Get a 1-month Discord Nitro subscription code voucher. The voucher is placed inside a custom shulker box delivered to your in-game mailbox.",
    },
    {
        "id": "other-lifesteal-kit",
        "name": "Shulker of Lifesteal Starter Kits",
        "server": "other",
        "category": "kits",
        "price_usd": 1.99,
        "image_url": "/assets/landing/logo_transparent.png",
        "description": "Ideal for popular public Lifesteal servers. Contains a full set of Diamond Protection III gear, 3 hearts, and 16 golden apples, all packed in a red shulker box.",
    },
    {
        "id": "other-title",
        "name": "Shulker of Chat Tag Tokens",
        "server": "other",
        "category": "ranks",
        "price_usd": 2.99,
        "image_url": "/assets/landing/logo_transparent.png",
        "description": "Voucher token that grants a customizable colored chat prefix (e.g., [GOD] or [RICH]) on Discord and supporting servers. Delivered inside a shulker box.",
    },

    # --- Donut SMP ---
    {
        "id": "donut-keys",
        "name": "Shulker of Donut Spawn Keys (5x)",
        "server": "donutsmp",
        "category": "packs",
        "price_usd": 4.99,
        "image_url": "/assets/landing/donutsmp_transparent.png",
        "description": "Contains 5x Spawn Keys to open legendary crates at the Donut SMP spawn. Packed inside a cyan shulker box for fast delivery.",
    },
    {
        "id": "donut-netherite",
        "name": "Shulker of Netherite Blocks (10x)",
        "server": "donutsmp",
        "category": "items",
        "price_usd": 2.99,
        "image_url": "/assets/landing/donutsmp_transparent.png",
        "description": "A full shulker box containing 10 blocks of pure Netherite, essential for crafting top-tier lifesteal armor and trading with players.",
    },
    {
        "id": "donut-emperor",
        "name": "Shulker of Emperor Rank Vouchers",
        "server": "donutsmp",
        "category": "ranks",
        "price_usd": 19.99,
        "image_url": "/assets/landing/donutsmp_transparent.png",
        "description": "Voucher for the premium Emperor Rank on Donut SMP. Grants flying, custom kits (/kit emperor), colored name, and chat features. Shipped in a gold shulker box.",
    },
    {
        "id": "donut-godset",
        "name": "Shulker of God Armor Set",
        "server": "donutsmp",
        "category": "items",
        "price_usd": 9.99,
        "image_url": "/assets/landing/donutsmp_transparent.png",
        "description": "Contains 1 full set of Netherite Armor with Protection V, Unbreaking IV, Mending, and Thorns III. Placed safely inside a protective shulker box.",
    },
    {
        "id": "donut-hearts",
        "name": "Shulker of Lifesteal Hearts (10x)",
        "server": "donutsmp",
        "category": "items",
        "price_usd": 1.49,
        "image_url": "/assets/landing/donutsmp_transparent.png",
        "description": "A shulker box loaded with 10 Lifesteal Hearts. Click them to permanently increase your max health. Essential for recovery after battles!",
    },

    # --- 2b2t ---
    {
        "id": "tbt-totems",
        "name": "Shulker of Totems (27x)",
        "server": "2b2t",
        "category": "items",
        "price_usd": 5.99,
        "image_url": "/assets/landing/2b2t_transparent.png",
        "description": "A purple shulker box completely packed with 27 Totems of Undying. Crucial for PVP survival and traveling through the dangerous anarchy spawn.",
    },
    {
        "id": "tbt-sharp32k",
        "name": "Shulker of 32k Hacked Swords",
        "server": "2b2t",
        "category": "items",
        "price_usd": 8.99,
        "image_url": "/assets/landing/2b2t_transparent.png",
        "description": "A legendary anarchy weapon: contains 2x Diamond Swords enchanted with Sharpness 32767. Delivered inside a secure obsidian-colored shulker box.",
    },
    {
        "id": "tbt-stash-coords",
        "name": "Shulker of Stash Coordinates",
        "server": "2b2t",
        "category": "packs",
        "price_usd": 14.99,
        "image_url": "/assets/landing/2b2t_transparent.png",
        "description": "Contains a written book with verified coordinates to a hidden dupe stash. The stash has 100+ chests with building materials, god gear, and crystals. Shipped in a shulker.",
    },
    {
        "id": "tbt-priqueue",
        "name": "Shulker of Pri-Queue Passes (1m)",
        "server": "2b2t",
        "category": "ranks",
        "price_usd": 24.99,
        "image_url": "/assets/landing/2b2t_transparent.png",
        "description": "Contains a redeemable priority queue code voucher for 1 month of fast queue bypass. Delivered inside a custom shulker box.",
    },
    {
        "id": "tbt-illegals",
        "name": "Shulker of Illegal Blocks",
        "server": "2b2t",
        "category": "items",
        "price_usd": 12.99,
        "image_url": "/assets/landing/2b2t_transparent.png",
        "description": "Contains vanilla-unobtainable blocks: Bedrock, Barrier blocks, End Portal Frames, and Mob Spawners. Safely stored in an illegal shulker box.",
    },
]


def seed():
    # Drop and recreate products table so schema changes are applied cleanly in dev.
    Base.metadata.tables["products"].drop(bind=engine, checkfirst=True)
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        for data in SEED_PRODUCTS:
            existing = db.query(Product).filter(Product.id == data["id"]).first()
            if existing:
                print(f"Skipping existing product: {data['id']}")
                continue
            product = Product(
                id=data["id"],
                name=data["name"],
                description=data["description"],
                category=data["category"],
                server=data["server"],
                price_usd=data["price_usd"],
                image_url=data.get("image_url"),
                delivery_types=["random", "specified", "meetup"],
                contents=shulker_box(data["name"]),
                is_active=True,
            )
            db.add(product)
            print(f"Added product: {data['id']}")
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
