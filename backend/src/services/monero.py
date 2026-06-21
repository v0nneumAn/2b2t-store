from decimal import Decimal
import httpx
from functools import lru_cache

from ..config import get_settings

XMR_ATOMIC = Decimal("1000000000000")  # 1 XMR = 10^12 piconero


class MoneroClient:
    def __init__(self):
        settings = get_settings()
        self.url = settings.monero_wallet_rpc_url
        self.auth = None
        if settings.monero_wallet_rpc_user:
            self.auth = (settings.monero_wallet_rpc_user, settings.monero_wallet_rpc_password)
        self.confirmations_required = settings.monero_confirmations_required

    def _call(self, method: str, params: dict = None):
        payload = {
            "jsonrpc": "2.0",
            "id": "0",
            "method": method,
            "params": params or {},
        }
        try:
            resp = httpx.post(self.url, json=payload, auth=self.auth, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            if "error" in data:
                raise RuntimeError(f"Monero RPC error: {data['error']}")
            return data.get("result", {})
        except httpx.ConnectError:
            raise RuntimeError("Cannot connect to monero-wallet-rpc")

    def create_address(self, label: str = ""):
        result = self._call("create_address", {"account_index": 0, "label": label})
        return result["address"], result["address_index"]

    def get_balance(self):
        return self._call("get_balance", {"account_index": 0})

    def check_payment(self, address: str, expected_xmr: Decimal):
        """Look for incoming transfer matching the subaddress and amount."""
        result = self._call("get_transfers", {
            "in": True,
            "account_index": 0,
        })
        transfers = result.get("in", [])
        expected_atomic = int(expected_xmr * XMR_ATOMIC)
        for tx in transfers:
            if tx.get("address") == address and tx.get("amount") >= expected_atomic:
                return {
                    "tx_hash": tx.get("txid"),
                    "amount": Decimal(tx.get("amount", 0)) / XMR_ATOMIC,
                    "confirmations": tx.get("confirmations", 0),
                    "timestamp": tx.get("timestamp"),
                }
        return None

    def usd_to_xmr(self, usd: Decimal, xmr_usd_rate: Decimal) -> Decimal:
        return usd / xmr_usd_rate


@lru_cache()
def get_monero_client() -> MoneroClient:
    return MoneroClient()
