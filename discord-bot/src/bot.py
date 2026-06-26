import asyncio
import os
import logging
import httpx
import discord
from discord import app_commands
from discord.ext import commands, tasks

logging.basicConfig(level=logging.INFO)

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")
GUILD_ID = os.getenv("GUILD_ID")
BOT_API_KEY = os.getenv("BOT_API_KEY")

intents = discord.Intents.default()
intents.message_content = True
intents.reactions = True
bot = commands.Bot(command_prefix="!", intents=intents)

# Track orders we've already notified about so we don't spam DMs.
_notified_order_ids: set[str] = set()


def _api_headers(discord_id: str | None = None):
    headers = {}
    if BOT_API_KEY:
        headers["X-Bot-Key"] = BOT_API_KEY
    if discord_id:
        headers["X-Discord-Id"] = discord_id
    return headers


def backend_get(path: str, discord_id: str | None = None):
    return httpx.get(f"{BACKEND_URL}{path}", headers=_api_headers(discord_id), timeout=10)


def backend_post(path: str, json: dict, discord_id: str | None = None):
    return httpx.post(
        f"{BACKEND_URL}{path}",
        headers=_api_headers(discord_id),
        json=json,
        timeout=10,
    )


@bot.event
async def on_ready():
    print(f"Logged in as {bot.user}")
    try:
        if GUILD_ID:
            guild = discord.Object(id=int(GUILD_ID))
            bot.tree.copy_global_to(guild=guild)
            synced = await bot.tree.sync(guild=guild)
        else:
            synced = await bot.tree.sync()
        print(f"Synced {len(synced)} slash commands")
    except Exception as e:
        print(f"Failed to sync commands: {e}")

    # Start the delivery-notification polling loop.
    if BOT_API_KEY:
        notify_customers.start()
    else:
        print("BOT_API_KEY not set; delivery notifications disabled.")


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
    await interaction.response.defer(ephemeral=True)
    try:
        resp = backend_post(
            "/api/cart",
            {
                "discord_id": str(interaction.user.id),
                "items": [{"product_id": product_id, "quantity": quantity}],
            },
        )
        if not resp.is_success:
            raise Exception(resp.text)
        cart = resp.json()
        await interaction.followup.send(
            f"Added {quantity}x `{product_id}` to your cart. "
            f"Use `/cart_checkout` when ready. Cart ID: `{cart['id']}`.",
            ephemeral=True,
        )
    except Exception as e:
        await interaction.followup.send(f"Error adding to cart: {e}", ephemeral=True)


@bot.tree.command(name="cart_checkout", description="Checkout your cart")
async def cart_checkout(interaction: discord.Interaction):
    await interaction.response.defer(ephemeral=True)
    try:
        # Find the most recent cart for this Discord user.
        # The backend doesn't have a lookup-by-discord endpoint, so we require the user
        # to provide the cart ID from /cart_add. For the demo we keep it simple:
        # instruct users to pass the cart ID as the command input next iteration.
        await interaction.followup.send(
            "Please use `/cart_checkout_id <cart_id>` with the cart ID from `/cart_add`.",
            ephemeral=True,
        )
    except Exception as e:
        await interaction.followup.send(f"Error: {e}", ephemeral=True)


@bot.tree.command(name="cart_checkout_id", description="Checkout a specific cart")
@app_commands.describe(cart_id="Cart ID from /cart_add")
async def cart_checkout_id(interaction: discord.Interaction, cart_id: str):
    await interaction.response.defer(ephemeral=True)
    try:
        discord_id = str(interaction.user.id)
        order_resp = backend_post(
            "/api/orders",
            {
                "cart_id": cart_id,
                "delivery_type": "random",
                "customer_discord_id": discord_id,
            },
        )
        if not order_resp.is_success:
            raise Exception(order_resp.text)
        order = order_resp.json()

        checkout_resp = backend_post(
            f"/api/payments/checkout/{order['id']}", {}, discord_id=discord_id
        )
        if not checkout_resp.is_success:
            raise Exception(checkout_resp.text)
        checkout = checkout_resp.json()

        await interaction.followup.send(
            f"Order `{order['id']}` created. Complete payment here:\n{checkout['checkout_url']}",
            ephemeral=True,
        )
    except Exception as e:
        await interaction.followup.send(f"Checkout failed: {e}", ephemeral=True)


@bot.tree.command(name="order_status", description="Check order status")
@app_commands.describe(order_id="Order ID")
async def order_status(interaction: discord.Interaction, order_id: str):
    await interaction.response.defer(ephemeral=True)
    try:
        resp = backend_get(f"/api/orders/{order_id}", discord_id=str(interaction.user.id))
        order = resp.json()
        status = order["status"].replace("_", " ").title()
        message = (
            f"Order `{order_id}`: **{status}**\n"
            f"Total: ${order['price_usd']} ({order.get('payment_provider', 'stripe')})"
        )
        if order.get("handoff_coords"):
            coords = order["handoff_coords"]
            message += (
                f"\n📍 Handoff location: `{coords['x']}, {coords['y']}, {coords['z']}`"
            )
        if order.get("delivered_at"):
            message += "\n✅ Items have been dropped."
        await interaction.followup.send(message, ephemeral=True)
    except Exception as e:
        await interaction.followup.send(f"Error: {e}", ephemeral=True)


@tasks.loop(seconds=30)
async def notify_customers():
    """Poll for orders ready for pickup and DM customers who haven't been notified."""
    if not BOT_API_KEY:
        return

    try:
        resp = backend_get("/api/bot/orders/ready")
        if not resp.is_success:
            logging.warning("Failed to poll orders: %s", resp.status_code)
            return

        orders = resp.json().get("orders", [])
        for order in orders:
            order_id = order["id"]
            if order["status"] != "ready_for_pickup":
                _notified_order_ids.discard(order_id)
                continue
            if order_id in _notified_order_ids:
                continue
            discord_id = order.get("customer_discord_id")
            if not discord_id:
                continue

            user = bot.get_user(int(discord_id))
            if not user:
                try:
                    user = await bot.fetch_user(int(discord_id))
                except Exception as e:
                    logging.warning("Could not fetch user %s: %s", discord_id, e)
                    continue

            coords = order.get("handoff_coords") or {}
            coord_str = f"{coords.get('x')}, {coords.get('y')}, {coords.get('z')}"
            try:
                dm = await user.create_dm()
                message = await dm.send(
                    f"Your order `{order_id}` is ready for pickup!\n"
                    f"Travel to `{coord_str}` and react ✅ to this message when you arrive.\n"
                    f"You can also confirm on the website order page."
                )
                await message.add_reaction("✅")
                _notified_order_ids.add(order_id)
            except Exception as e:
                logging.warning("Failed to DM user %s: %s", discord_id, e)
    except Exception as e:
        logging.error("Error in notify_customers loop: %s", e)


@notify_customers.before_loop
async def before_notify_customers():
    await bot.wait_until_ready()


@bot.event
async def on_reaction_add(reaction: discord.Reaction, user: discord.User):
    """Listen for ✅ reactions on delivery notification DMs."""
    if user.bot:
        return
    if str(reaction.emoji) != "✅":
        return

    # Only handle DMs from the bot to the user.
    if not isinstance(reaction.message.channel, discord.DMChannel):
        return
    if reaction.message.author.id != bot.user.id:
        return

    # Extract order ID from the message.
    content = reaction.message.content
    if "Your order `" not in content:
        return

    try:
        order_id = content.split("Your order `")[1].split("`")[0]
    except IndexError:
        return

    try:
        resp = backend_post(
            f"/api/orders/{order_id}/arrived", {}, discord_id=str(user.id)
        )
        if resp.is_success:
            await reaction.message.reply("Arrival confirmed! The bot will drop your items shortly.")
        else:
            error = resp.json().get("detail", resp.text)
            await reaction.message.reply(f"Could not confirm arrival: {error}")
    except Exception as e:
        await reaction.message.reply(f"Error confirming arrival: {e}")


def _is_valid_discord_token(token: str) -> bool:
    # Discord tokens are ~70 chars: base64 user id + 6 dots + base64 hmac
    return bool(token) and len(token) >= 50 and token.count(".") >= 2


if __name__ == "__main__":
    if not DISCORD_TOKEN or DISCORD_TOKEN == "your-bot-token-here" or not _is_valid_discord_token(DISCORD_TOKEN):
        raise RuntimeError(
            "DISCORD_TOKEN is not set or invalid. "
            "Copy discord-bot/.env.example to .env and paste your bot token."
        )
    bot.run(DISCORD_TOKEN)
