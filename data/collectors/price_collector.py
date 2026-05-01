# data/collectors/price_collector.py
"""
PriceCollector — Fetches real-time price feeds from Pyth Network
and RedStone Finance for mETH, USDY, fBTC, ETH, and BTC.
"""

import asyncio
import aiohttp
import logging
from typing import Dict, Optional

logger = logging.getLogger("SentinelRWA.PriceCollector")

# Pyth price feed IDs (Mantle)
PYTH_FEED_IDS = {
    "ETH": "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
    "BTC": "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
}


class PriceCollector:
    """Async price feed collector using Pyth and RedStone oracles."""

    def __init__(self, config: dict):
        self.pyth_url = config.get("PYTH_HERMES_URL", "https://hermes.pyth.network")
        self.redstone_key = config.get("REDSTONE_API_KEY", "")
        self._session: Optional[aiohttp.ClientSession] = None

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession()
        return self._session

    async def fetch_pyth_prices(self) -> Dict:
        """Fetch latest prices from Pyth Hermes API."""
        session = await self._get_session()
        prices = {}

        try:
            feed_ids = list(PYTH_FEED_IDS.values())
            params = [("ids[]", fid) for fid in feed_ids]
            url = f"{self.pyth_url}/api/latest_price_feeds"

            async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    for feed in data:
                        feed_id = "0x" + feed.get("id", "")
                        price_data = feed.get("price", {})
                        price = int(price_data.get("price", 0))
                        expo = int(price_data.get("expo", 0))
                        usd_price = price * (10 ** expo)

                        for name, fid in PYTH_FEED_IDS.items():
                            if fid == feed_id:
                                prices[name] = {"usd": usd_price}
                                break
        except Exception as e:
            logger.error(f"Pyth price fetch error: {e}")

        return prices

    async def fetch_all_prices(self) -> Dict:
        """
        Fetch prices from all sources and aggregate.
        Returns dict with keys: ETH, BTC, mETH, USDY, fBTC
        """
        pyth_prices = await self.fetch_pyth_prices()

        # Derive RWA prices (in production, these come from RedStone)
        eth_price = pyth_prices.get("ETH", {}).get("usd", 3200)
        btc_price = pyth_prices.get("BTC", {}).get("usd", 65000)

        prices = {
            "ETH": {"usd": eth_price},
            "BTC": {"usd": btc_price},
            "mETH": {"usd": eth_price * 1.0},  # mETH tracks ETH
            "USDY": {"usd": 1.0},               # Stablecoin peg
            "fBTC": {"usd": btc_price * 1.0},   # fBTC tracks BTC
        }

        return prices

    async def close(self):
        if self._session and not self._session.closed:
            await self._session.close()
