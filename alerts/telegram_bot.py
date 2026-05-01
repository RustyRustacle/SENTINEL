# alerts/telegram_bot.py
"""
AlertService — Sends formatted Telegram alerts for risk events.
Supports different severity levels with appropriate formatting.
"""

import aiohttp
import logging
from typing import Any, Optional

logger = logging.getLogger("SentinelRWA.Alerts")


class AlertService:
    """Telegram bot for real-time risk alerts."""

    TELEGRAM_API = "https://api.telegram.org/bot{token}/sendMessage"

    # Severity icons (unicode, not emoji)
    LEVEL_ICONS = {
        "GREEN": "\u25CF",   # filled circle
        "YELLOW": "\u25B2",  # triangle
        "ORANGE": "\u25A0",  # filled square
        "RED": "\u2716",     # heavy X
        "BLACK": "\u2620",   # skull
    }

    def __init__(self, token: str, chat_id: str = ""):
        self.token = token
        self.chat_id = chat_id
        self._session: Optional[aiohttp.ClientSession] = None

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession()
        return self._session

    async def send_action_alert(self, action: Any, tx_hash: str):
        """Send alert when a protective action is executed."""
        message = (
            f"SENTINEL ACTION EXECUTED\n"
            f"{'=' * 30}\n"
            f"Type: {action.action_type}\n"
            f"Asset: {action.asset[:10]}...\n"
            f"Risk Score: {action.risk_score}/100\n"
            f"Reason: {action.reason[:100]}\n"
            f"TX: {tx_hash[:16]}...\n"
            f"Network: Mantle (5000)"
        )
        await self._send(message)

    async def send_error(self, error: str):
        """Send error alert."""
        message = f"SENTINEL ERROR\n{'=' * 30}\n{error[:500]}"
        await self._send(message)

    async def _send(self, text: str):
        """Send message via Telegram Bot API."""
        if not self.token or not self.chat_id:
            logger.info(f"Alert (no Telegram): {text[:100]}...")
            return

        try:
            session = await self._get_session()
            url = self.TELEGRAM_API.format(token=self.token)
            payload = {"chat_id": self.chat_id, "text": text, "parse_mode": "Markdown"}
            async with session.post(url, json=payload) as resp:
                if resp.status != 200:
                    logger.error(f"Telegram send failed: {resp.status}")
        except Exception as e:
            logger.error(f"Telegram error: {e}")

    async def close(self):
        if self._session and not self._session.closed:
            await self._session.close()
