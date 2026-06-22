import os
import logging
import httpx
import discord
from discord import app_commands
from discord.ext import commands

logging.basicConfig(level=logging.INFO)

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")
GUILD_ID = os.getenv("GUILD_ID")

intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix="!", intents=intents)


def backend_get(path: str):
    return httpx.get(f"{BACKEND_URL}{path}", timeout=10)


def backend_post(path: str, json: dict):
    return httpx.post(f"{BACKEND_URL}{path}", json=json, timeout=10)


@bot.event
async def on_ready():
    print(f"Logged in as {bot.user}")
    try:
        synced = await bot.tree.sync()
        print(f"Synced {len(synced)} slash commands")
    except Exception as e:
        print(f"Failed to sync commands: {e}")


@bot.tree.command(name="shop", description="Browse available products")
async def shop(interaction: discord.Interaction):
    await interaction.response.defer()
    try:
        resp = backend_get("/api/products")
        products = resp.json()
        lines = [f"**{p['name']}** — ${p['price_usd']} ({p['category']})" for p in products]
        await interaction.followup.send("\n".join(lines[:25]) or "No products available.")
    except Exception as e:
        await interaction.followup.send(f"Error fetching shop: {e}")


@bot.tree.command(name="cart_add", description="Add a product to your cart")
@app_commands.describe(product_id="Product ID", quantity="Quantity")
async def cart_add(interaction: discord.Interaction, product_id: str, quantity: int = 1):
    await interaction.response.send_message(
        f"Added {quantity}x `{product_id}` to your cart. Use `/cart_checkout` when ready.",
        ephemeral=True,
    )


@bot.tree.command(name="cart_checkout", description="Checkout your cart")
async def cart_checkout(interaction: discord.Interaction):
    await interaction.response.send_message(
        "Checkout flow placeholder. Connects to backend cart + order endpoints.",
        ephemeral=True,
    )


@bot.tree.command(name="order_status", description="Check order status")
@app_commands.describe(order_id="Order ID")
async def order_status(interaction: discord.Interaction, order_id: str):
    await interaction.response.defer(ephemeral=True)
    try:
        resp = backend_get(f"/api/orders/{order_id}")
        order = resp.json()
        await interaction.followup.send(
            f"Order `{order_id}`: **{order['status']}**\n"
            f"Total: ${order['price_usd']} ({order.get('payment_provider', 'stripe')})",
            ephemeral=True,
        )
    except Exception as e:
        await interaction.followup.send(f"Error: {e}", ephemeral=True)


if __name__ == "__main__":
    if not DISCORD_TOKEN or DISCORD_TOKEN == "your-bot-token-here":
        raise RuntimeError(
            "DISCORD_TOKEN is not set. "
            "Copy discord-bot/.env.example to .env and paste your bot token."
        )
    bot.run(DISCORD_TOKEN)
