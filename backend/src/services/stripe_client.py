from decimal import Decimal
from functools import lru_cache

import stripe

from ..config import get_settings


def _amount_in_cents(usd: Decimal) -> int:
    return int((usd * Decimal("100")).to_integral_value())


class StripeClient:
    def __init__(self):
        settings = get_settings()
        stripe.api_key = settings.stripe_secret_key
        self.currency = settings.stripe_currency

    def create_checkout_session(self, order_id: str, amount_usd: Decimal, success_url: str, cancel_url: str):
        session = stripe.checkout.Session.create(
            line_items=[
                {
                    "price_data": {
                        "currency": self.currency,
                        "product_data": {"name": f"2b2t Store Order {order_id}"},
                        "unit_amount": _amount_in_cents(amount_usd),
                    },
                    "quantity": 1,
                }
            ],
            mode="payment",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={"order_id": order_id},
        )
        return session

    def construct_event(self, payload: bytes, signature: str):
        settings = get_settings()
        return stripe.Webhook.construct_event(
            payload, signature, settings.stripe_webhook_secret
        )


@lru_cache()
def get_stripe_client() -> StripeClient:
    return StripeClient()
