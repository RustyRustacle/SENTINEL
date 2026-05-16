import logging
import os
from typing import Dict, Optional
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware

logger = logging.getLogger("SentinelRWA.ERC8004")


class ERC8004Client:

    def __init__(self, config: dict):
        rpc_url = config.get("MANTLE_RPC_URL", "https://rpc.mantle.xyz")
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        self.w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
        self.registry_address = config.get("ERC8004_REGISTRY_ADDRESS", "")
        self.agent_id = config.get("AGENT_ID", "")

        if self.registry_address and self.w3.is_connected():
            self.contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(self.registry_address),
                abi=self._load_abi(),
            )
            logger.info(
                f"ERC8004Client ready: registry={self.registry_address[:10]}..."
            )
        else:
            self.contract = None
            logger.warning("ERC8004Client not fully initialized")

    def _load_abi(self) -> list:
        abi_path = os.path.join(
            os.path.dirname(__file__),
            "..",
            "artifacts",
            "contracts",
            "ERC8004Registry.sol",
            "ERC8004Registry.json",
        )
        try:
            import json
            with open(abi_path) as f:
                return json.load(f)["abi"]
        except Exception as e:
            logger.warning(f"ABI load failed ({e}), using minimal ABI")
            return [
                {
                    "type": "function",
                    "name": "getReputationScore",
                    "inputs": [{"type": "bytes32"}],
                    "stateMutability": "view",
                    "outputs": [{"type": "uint256"}],
                },
                {
                    "type": "function",
                    "name": "getActionCount",
                    "inputs": [{"type": "bytes32"}],
                    "stateMutability": "view",
                    "outputs": [
                        {"type": "uint256"},
                        {"type": "uint256"},
                    ],
                },
                {
                    "type": "function",
                    "name": "getAgentProfile",
                    "inputs": [{"type": "bytes32"}],
                    "stateMutability": "view",
                    "outputs": [
                        {"type": "address"},
                        {"type": "string"},
                        {"type": "uint256"},
                        {"type": "uint256"},
                        {"type": "uint256"},
                        {"type": "uint256"},
                        {"type": "uint256"},
                        {"type": "uint256"},
                    ],
                },
                {
                    "type": "function",
                    "name": "computeReputationScore",
                    "inputs": [{"type": "bytes32"}],
                    "stateMutability": "view",
                    "outputs": [{"type": "uint256"}],
                },
                {
                    "type": "function",
                    "name": "getActionHistory",
                    "inputs": [{"type": "bytes32"}],
                    "stateMutability": "view",
                    "outputs": [
                        {
                            "type": "tuple[]",
                            "components": [
                                {"type": "bytes32", "name": "actionId"},
                                {"type": "uint256", "name": "timestamp"},
                                {"type": "uint256", "name": "riskScore"},
                                {"type": "bool", "name": "wasSuccessful"},
                                {"type": "uint256", "name": "valueProtected"},
                            ],
                        }
                    ],
                },
            ]

    def get_agent_reputation(self) -> Dict:
        try:
            if not self.contract or not self.agent_id:
                return self._fallback("Contract not ready")

            agent_bytes = Web3.to_bytes(hexstr=self.agent_id) if self.agent_id.startswith("0x") else self.agent_id.encode()

            score = self.contract.functions.getReputationScore(agent_bytes).call()
            counts = self.contract.functions.getActionCount(agent_bytes).call()
            profile = self.contract.functions.getAgentProfile(agent_bytes).call()

            return {
                "agent_id": self.agent_id,
                "reputation_score": score,
                "max_score": 1000,
                "successful_actions": counts[0],
                "failed_actions": counts[1],
                "total_value_protected": profile[4],
                "trust_level": self._compute_trust_level(score),
                "registry_address": self.registry_address,
            }
        except Exception as e:
            logger.error(f"ERC-8004 query error: {e}")
            return self._fallback(str(e))

    def _fallback(self, error: str) -> Dict:
        return {
            "agent_id": self.agent_id,
            "reputation_score": 500,
            "max_score": 1000,
            "trust_level": "Standard",
            "error": error,
        }

    def _compute_trust_level(self, score: int) -> str:
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
