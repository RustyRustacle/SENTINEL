import asyncio
import aiohttp
import logging
from typing import Dict, Optional

logger = logging.getLogger("SentinelRWA.PriceCollector")

PYTH_FEED_IDS = {
    "ETH": "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
    "BTC": "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
}

REDSTONE_FEED_IDS = {
    "USDY": "USDY",
    "METH": "METH",
}


class PriceCollector:

    def __init__(self, config: dict):
        self.pyth_url = config.get("PYTH_HERMES_URL", "https://hermes.pyth.network")
        self.redstone_url = config.get(
            "REDSTONE_URL", "https://cache.com.br.decentrafi.xyz"
        )
        self.redstone_key = config.get("REDSTONE_API_KEY", "")
        self.meth_eth_pool = config.get("METH_ETH_POOL", "")
        self.usdy_usdc_pool = config.get("USDY_USDC_POOL", "")
        self.fbtc_btc_pool = config.get("FBTC_BTC_POOL", "")
        self._session: Optional[aiohttp.ClientSession] = None

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession()
        return self._session

    async def fetch_pyth_prices(self) -> Dict:
        session = await self._get_session()
        prices = {}

        try:
            feed_ids = list(PYTH_FEED_IDS.values())
            params = [("ids[]", fid) for fid in feed_ids]
            url = f"{self.pyth_url}/api/latest_price_feeds"

            async with session.get(
                url, params=params, timeout=aiohttp.ClientTimeout(total=10)
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    for feed in data:
                        feed_id = "0x" + feed.get("id", "")
                        price_data = feed.get("price", {})
                        price = int(price_data.get("price", 0))
                        expo = int(price_data.get("expo", 0))
                        usd_price = float(price) * (10**expo)

                        for name, fid in PYTH_FEED_IDS.items():
                            if fid == feed_id:
                                prices[name] = {"usd": usd_price}
                                break
        except Exception as e:
            logger.error(f"Pyth price fetch error: {e}")

        return prices

    async def fetch_redstone_prices(self) -> Dict:
        session = await self._get_session()
        prices = {}

        try:
            for name, feed_id in REDSTONE_FEED_IDS.items():
                url = f"{self.redstone_url}/v1/oracle/redstone/{feed_id}"
                async with session.get(
                    url, timeout=aiohttp.ClientTimeout(total=10)
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        usd_price = float(data.get("value", 0))
                        prices[name] = {"usd": usd_price}
        except Exception as e:
            logger.error(f"RedStone price fetch error: {e}")

        return prices

    async def fetch_all_prices(self) -> Dict:
        pyth_task = self.fetch_pyth_prices()
        redstone_task = self.fetch_redstone_prices()
        pyth_prices, redstone_prices = await asyncio.gather(
            pyth_task, redstone_task, return_exceptions=True
        )

        if isinstance(pyth_prices, BaseException):
            logger.error(f"Pyth gather error: {pyth_prices}")
            pyth_prices = {}
        if isinstance(redstone_prices, BaseException):
            logger.error(f"RedStone gather error: {redstone_prices}")
            redstone_prices = {}

        eth_price = pyth_prices.get("ETH", {}).get("usd", 3200)
        btc_price = pyth_prices.get("BTC", {}).get("usd", 65000)
        usdy_price = redstone_prices.get("USDY", {}).get("usd", 1.0)
        meth_price = redstone_prices.get("METH", {}).get("usd", eth_price)
        fbtc_price = btc_price

        prices = {
            "ETH": {"usd": eth_price},
            "BTC": {"usd": btc_price},
            "mETH": {"usd": meth_price},
            "USDY": {"usd": usdy_price},
            "fBTC": {"usd": fbtc_price},
        }

        logger.info(
            f"Prices: ETH=${eth_price:.0f} BTC=${btc_price:.0f} "
            f"mETH=${meth_price:.2f} USDY=${usdy_price:.4f} fBTC=${fbtc_price:.0f}"
        )
        return prices

    async def close(self):
        if self._session and not self._session.closed:
            await self._session.close()
