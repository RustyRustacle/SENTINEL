# data/aggregator.py
"""
DataAggregator — Normalizes data from all collectors into a unified
snapshot format consumed by the RiskEngine.
"""

import asyncio
import logging
from typing import Dict

from data.collectors.price_collector import PriceCollector
from data.collectors.chain_collector import ChainCollector
from data.collectors.tradfi_collector import TradFiCollector

logger = logging.getLogger("SentinelRWA.Aggregator")


class DataAggregator:
    """Aggregates all data sources into a normalized snapshot."""

    def __init__(self, config: dict):
        self.price_collector = PriceCollector(config)
        self.chain_collector = ChainCollector(config)
        self.tradfi_collector = TradFiCollector(config)

    def get_current_snapshot(self) -> Dict:
        """
        Synchronous wrapper for async snapshot collection.
        Used as a LangChain tool function.
        """
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    return pool.submit(
                        asyncio.run, self._collect_snapshot()
                    ).result()
            else:
                return asyncio.run(self._collect_snapshot())
        except Exception as e:
            logger.error(f"Snapshot collection error: {e}")
            return self._get_fallback_snapshot()

    async def _collect_snapshot(self) -> Dict:
        """Async collection from all data sources."""
        prices, liquidity, correlations, volatility, tradfi = await asyncio.gather(
            self.price_collector.fetch_all_prices(),
            self.chain_collector.fetch_liquidity_metrics(),
            self.chain_collector.fetch_correlations(),
            self.chain_collector.fetch_volatility(),
            self.tradfi_collector.fetch_tradfi_data(),
        )

        snapshot = {
            "prices": prices,
            "liquidity": liquidity,
            "correlations": correlations,
            "volatility": volatility,
            "tradfi": tradfi,
        }

        logger.info(f"Snapshot collected: {len(prices)} price feeds")
        return snapshot

    def _get_fallback_snapshot(self) -> Dict:
        """Fallback snapshot with safe default values."""
        return {
            "prices": {
                "USDY": {"usd": 1.000},
                "mETH": {"usd": 3200},
                "ETH": {"usd": 3200},
                "fBTC": {"usd": 65000},
                "BTC": {"usd": 65000},
            },
            "liquidity": {"pool_depth_ratio": 1.0, "spread_bps": 10},
            "correlations": {"mETH_ETH": 0.98, "fBTC_BTC": 0.99},
            "volatility": {"realized_24h": 0.03},
            "tradfi": {"tbill_3m": 0.045, "defi_avg_yield": 0.10},
        }
