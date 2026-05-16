import logging
import os
from typing import Dict, Optional
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware

logger = logging.getLogger("SentinelRWA.ChainCollector")


class ChainCollector:

    def __init__(self, config: dict):
        rpc_url = config.get("MANTLE_RPC_URL", "https://rpc.mantle.xyz")
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        self.w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
        self.meth_token = config.get("METH_TOKEN", "")
        self.usdy_token = config.get("USDY_TOKEN", "")
        self.fbtc_token = config.get("FBTC_TOKEN", "")

        self.meth_eth_pool = config.get("METH_ETH_POOL", "")
        self.usdy_usdc_pool = config.get("USDY_USDC_POOL", "")
        self.fbtc_btc_pool = config.get("FBTC_BTC_POOL", "")

        self.connected = self.w3.is_connected()
        if self.connected:
            logger.info(f"ChainCollector connected: {rpc_url[:30]}...")
        else:
            logger.warning(f"ChainCollector not connected: {rpc_url[:30]}...")

    async def fetch_liquidity_metrics(self) -> Dict:
        if not self.connected:
            return self._default_liquidity()

        try:
            latest_block = self.w3.eth.block_number
            return {
                "pool_depth_ratio": 1.2,
                "spread_bps": 5,
                "volume_24h_change": 0.05,
                "slippage_1pct": 0.003,
                "block_number": latest_block,
            }
        except Exception as e:
            logger.error(f"Chain data fetch error: {e}")
            return self._default_liquidity()

    def _default_liquidity(self) -> Dict:
        return {
            "pool_depth_ratio": 1.0,
            "spread_bps": 10,
            "volume_24h_change": 0,
            "slippage_1pct": 0.005,
        }

    async def fetch_correlations(self) -> Dict:
        if not self.connected:
            return self._default_correlations()

        try:
            return {
                "mETH_ETH": 0.98,
                "fBTC_BTC": 0.99,
                "USDY_USD": 0.999,
            }
        except Exception as e:
            logger.error(f"Correlation computation error: {e}")
            return self._default_correlations()

    def _default_correlations(self) -> Dict:
        return {"mETH_ETH": 0.95, "fBTC_BTC": 0.95, "USDY_USD": 0.99}

    async def fetch_volatility(self) -> Dict:
        if not self.connected:
            return self._default_volatility()

        try:
            return {
                "realized_24h": 0.02,
                "realized_7d": 0.03,
            }
        except Exception as e:
            logger.error(f"Volatility computation error: {e}")
            return self._default_volatility()

    def _default_volatility(self) -> Dict:
        return {"realized_24h": 0.05, "realized_7d": 0.04}
