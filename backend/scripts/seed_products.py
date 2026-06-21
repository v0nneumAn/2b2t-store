#!/usr/bin/env python3
"""Seed starter catalog into the database."""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy.orm import Session
from src.models import engine, SessionLocal, Base, Product


SEED_PRODUCTS = [
    {
        "id": "totems_64",
        "name": "Stack of Totems (64)",
        "description": "64 totems of undying. Essential for PvP.",
        "category": "consumable",
        "price_usd": 4.50,
        "delivery_types": ["random", "specified", "meetup"],
        "contents": [{"item_name": "minecraft:totem_of_undying", "display_name": "Totem of Undying", "quantity": 64}],
    },
    {
        "id": "fireworks_fd3_64",
        "name": "FD3 Fireworks (64)",
        "description": "Duration 3 elytra fireworks.",
        "category": "consumable",
        "price_usd": 2.00,
        "delivery_types": ["random", "specified", "meetup"],
        "contents": [{"item_name": "minecraft:firework_rocket", "display_name": "Firework Rocket", "quantity": 64, "nbt": {"flight_duration": 3}}],
    },
    {
        "id": "pearls_64",
        "name": "Ender Pearls (64)",
        "description": "64 ender pearls for travel and PvP.",
        "category": "consumable",
        "price_usd": 3.00,
        "delivery_types": ["random", "specified", "meetup"],
        "contents": [{"item_name": "minecraft:ender_pearl", "display_name": "Ender Pearl", "quantity": 64}],
    },
    {
        "id": "crystals_64",
        "name": "End Crystals (64)",
        "description": "64 end crystals for crystal PvP.",
        "category": "consumable",
        "price_usd": 5.50,
        "delivery_types": ["random", "specified", "meetup"],
        "contents": [{"item_name": "minecraft:end_crystal", "display_name": "End Crystal", "quantity": 64}],
    },
    {
        "id": "gapples_16",
        "name": "Enchanted Golden Apples (16)",
        "description": "16 enchanted golden apples.",
        "category": "consumable",
        "price_usd": 5.00,
        "delivery_types": ["random", "specified", "meetup"],
        "contents": [{"item_name": "minecraft:enchanted_golden_apple", "display_name": "Enchanted Golden Apple", "quantity": 16}],
    },
    {
        "id": "xp_64",
        "name": "XP Bottles (64)",
        "description": "64 bottles o' enchanting for repairs.",
        "category": "consumable",
        "price_usd": 4.00,
        "delivery_types": ["random", "specified", "meetup"],
        "contents": [{"item_name": "minecraft:experience_bottle", "display_name": "Bottle o' Enchanting", "quantity": 64}],
    },
    {
        "id": "neth_meta_pvp",
        "name": "Neth Meta PvP Kit",
        "description": "Netherite PvP kit with current meta enchants.",
        "category": "kit",
        "price_usd": 4.00,
        "delivery_types": ["random", "specified", "meetup"],
        "contents": [{"item_name": "minecraft:shulker_box", "display_name": "PvP Shulker", "quantity": 1}],
    },
    {
        "id": "neth_survival",
        "name": "Neth Survival Kit",
        "description": "Netherite survival kit with tools and food.",
        "category": "kit",
        "price_usd": 5.00,
        "delivery_types": ["random", "specified", "meetup"],
        "contents": [{"item_name": "minecraft:shulker_box", "display_name": "Survival Shulker", "quantity": 1}],
    },
    {
        "id": "travel_kit",
        "name": "Travel Kit",
        "description": "Elytra, fireworks, food, and pearls.",
        "category": "kit",
        "price_usd": 5.00,
        "delivery_types": ["random", "specified", "meetup"],
        "contents": [{"item_name": "minecraft:shulker_box", "display_name": "Travel Shulker", "quantity": 1}],
    },
    {
        "id": "spawn_kit_v1",
        "name": "Spawn Kit V1",
        "description": "Basic kit for escaping spawn.",
        "category": "kit",
        "price_usd": 4.00,
        "delivery_types": ["random", "specified", "meetup"],
        "contents": [{"item_name": "minecraft:shulker_box", "display_name": "Spawn Shulker", "quantity": 1}],
    },
    {
        "id": "elytra",
        "name": "Elytra",
        "description": "One elytra.",
        "category": "armor",
        "price_usd": 5.00,
        "delivery_types": ["random", "specified", "meetup"],
        "contents": [{"item_name": "minecraft:elytra", "display_name": "Elytra", "quantity": 1}],
    },
    {
        "id": "density_v_mace",
        "name": "Density V Mace",
        "description": "Netherite mace with Density V enchantment.",
        "category": "weapon",
        "price_usd": 12.00,
        "delivery_types": ["random", "specified", "meetup"],
        "contents": [{"item_name": "minecraft:mace", "display_name": "Density V Mace", "quantity": 1, "nbt": {"enchantments": {"density": 5}}}],
    },
]


def seed():
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
                price_usd=data["price_usd"],
                delivery_types=data["delivery_types"],
                contents=data["contents"],
                is_active=True,
            )
            db.add(product)
            print(f"Added product: {data['id']}")
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
