# reputation/erc8004_client.py
"""
ERC8004Client — Python client for the ERC-8004 Agent Registry contract.
Reads reputation scores and action history from Mantle.
"""

import logging
from typing import Dict

logger = logging.getLogger("SentinelRWA.ERC8004")


class ERC8004Client:
    """Client for reading/writing to the ERC8004Registry on Mantle."""

    def __init__(self, config: dict):
        self.rpc_url = config.get("MANTLE_RPC_URL", "https://rpc.mantle.xyz")
        self.registry_address = config.get("ERC8004_REGISTRY_ADDRESS", "")
        self.agent_id = config.get("AGENT_ID", "")

    def get_agent_reputation(self) -> Dict:
        """
        Query the current ERC-8004 reputation score and history.

        Returns:
            Dict with score, action counts, trust level
        """
        try:
            # In production: use web3.py to call contract
            score = 500  # default initial score
            successful = 0
            failed = 0

            trust_level = self._compute_trust_level(score)

            return {
                "agent_id": self.agent_id,
                "reputation_score": score,
                "max_score": 1000,
                "successful_actions": successful,
                "failed_actions": failed,
                "trust_level": trust_level,
                "registry_address": self.registry_address,
            }
        except Exception as e:
            logger.error(f"ERC-8004 query error: {e}")
            return {
                "agent_id": self.agent_id,
                "reputation_score": 500,
                "max_score": 1000,
                "trust_level": "Standard",
                "error": str(e),
            }

    def _compute_trust_level(self, score: int) -> str:
        """Map score to trust level per spec."""
        if score < 300:
            return "Probationary"
        elif score < 500:
            return "Standard"
        elif score < 700:
            return "Trusted"
        elif score < 850:
            return "Elite"
        else:
            return "Sovereign"
