# data/collectors/tradfi_collector.py
"""
TradFiCollector — Fetches traditional finance macro data.
Includes T-bill yields from FRED API and DeFi yield comparisons.
"""

import aiohttp
import logging
from typing import Dict, Optional

logger = logging.getLogger("SentinelRWA.TradFiCollector")


class TradFiCollector:
    """Fetches TradFi macro indicators for yield spread analysis."""

    def __init__(self, config: dict):
        self.fred_key = config.get("FRED_API_KEY", "")
        self.fred_url = "https://api.stlouisfed.org/fred/series/observations"
        self._session: Optional[aiohttp.ClientSession] = None

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession()
        return self._session

    async def fetch_tbill_yield(self) -> float:
        """Fetch 3-month T-bill yield from FRED."""
        if not self.fred_key:
            return 0.045  # fallback

        try:
            session = await self._get_session()
            params = {
                "series_id": "DTB3",
                "api_key": self.fred_key,
                "file_type": "json",
                "sort_order": "desc",
                "limit": 1,
            }
            async with session.get(self.fred_url, params=params, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    obs = data.get("observations", [])
                    if obs:
                        return float(obs[0]["value"]) / 100
        except Exception as e:
            logger.error(f"FRED API error: {e}")

        return 0.045  # fallback

    async def fetch_tradfi_data(self) -> Dict:
        """Fetch all TradFi macro data."""
        tbill = await self.fetch_tbill_yield()
        return {
            "tbill_3m": tbill,
            "defi_avg_yield": 0.10,  # In production: aggregate from protocols
        }

    async def close(self):
        if self._session and not self._session.closed:
            await self._session.close()
