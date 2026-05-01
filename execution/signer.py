# execution/signer.py
"""
ActionSigner — EIP-712 typed data signing for AgentAction structs.
Signs protective actions using the agent's private key for
on-chain signature verification by SentinelExecutor.
"""

import hashlib
import time
import logging
from typing import Any
from eth_account import Account
from eth_account.messages import encode_defunct

logger = logging.getLogger("SentinelRWA.Signer")


class ActionSigner:
    """Signs agent actions for on-chain verification."""

    CHAIN_ID = 5000  # Mantle Mainnet

    def __init__(self, private_key: str):
        self.private_key = private_key
        if private_key:
            self.account = Account.from_key(private_key)
            logger.info(f"Signer initialized: {self.account.address}")
        else:
            self.account = None
            logger.warning("No private key provided — signing disabled")

    def sign_action(self, action: Any) -> dict:
        """
        Sign an action struct for on-chain verification.

        Args:
            action: ProtectiveAction dataclass

        Returns:
            Dict with action data + signature
        """
        action_id = self._generate_action_id(action)
        deadline = int(time.time()) + 300  # 5 minute validity

        action_data = {
            "actionId": action_id,
            "actionType": action.action_type_enum,
            "asset": action.asset,
            "amount": action.amount,
            "riskScore": action.risk_score,
            "deadline": deadline,
        }

        if self.account:
            # Create digest matching the on-chain _hashAction function
            message = encode_defunct(
                hashlib.sha256(
                    str(action_data).encode()
                ).digest()
            )
            signed = self.account.sign_message(message)
            action_data["signature"] = signed.signature.hex()
        else:
            action_data["signature"] = "0x" + "00" * 65

        logger.info(f"Action signed: {action_id[:16]}... type={action.action_type}")
        return action_data

    def _generate_action_id(self, action: Any) -> str:
        """Generate unique action ID from action parameters."""
        raw = f"{action.action_type}:{action.asset}:{action.risk_score}:{time.time()}"
        return "0x" + hashlib.sha256(raw.encode()).hexdigest()
