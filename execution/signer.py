import hashlib
import time
import logging
from typing import Any
from eth_account import Account
from eth_hash.auto import keccak
from eth_abi import encode as abi_encode

logger = logging.getLogger("SentinelRWA.Signer")


class ActionSigner:

    CHAIN_ID = 5000

    def __init__(self, private_key: str, executor_address: str = ""):
        self.private_key = private_key
        self.executor_address = executor_address
        if private_key:
            self.account = Account.from_key(private_key)
            logger.info(f"Signer initialized: {self.account.address}")
        else:
            self.account = None
            logger.warning("No private key provided")

    def sign_action(self, action: Any) -> dict:
        amount_out_min = getattr(action, 'amount_out_min',
                                 max(action.amount // 100, 1))
        action_id = self._generate_action_id(action)
        deadline = int(time.time()) + 300

        action_id_bytes = bytes.fromhex(action_id[2:])
        asset_bytes = (
            bytes.fromhex(action.asset[2:].zfill(40))
            if action.asset and action.asset.startswith("0x")
            else b"\x00" * 20
        )
        executor_bytes = (
            bytes.fromhex(self.executor_address[2:].zfill(40))
            if self.executor_address and self.executor_address.startswith("0x")
            else b"\x00" * 20
        )

        sol_types = [
            "uint256", "address", "bytes32", "uint8",
            "address", "uint256", "uint256", "uint256", "uint256",
        ]
        sol_values = [
            self.CHAIN_ID,
            executor_bytes,
            action_id_bytes,
            action.action_type_enum,
            asset_bytes,
            action.amount,
            amount_out_min,
            action.risk_score,
            deadline,
        ]

        encoded = abi_encode(sol_types, sol_values)
        digest = keccak(encoded)

        if self.account:
            v, r, s = self.account._key.sign_msg_hash(digest)
            if v < 27:
                v += 27
            signature = (
                r.to_bytes(32, "big").hex()
                + s.to_bytes(32, "big").hex()
                + v.to_bytes(1, "big").hex()
            )
        else:
            signature = "00" * 65

        result = {
            "actionId": action_id,
            "actionType": action.action_type_enum,
            "asset": action.asset,
            "amount": action.amount,
            "amountOutMin": amount_out_min,
            "riskScore": action.risk_score,
            "deadline": deadline,
            "signature": signature,
        }

        logger.info(
            f"Action signed: {action_id[:16]}... type={action.action_type} "
            f"asset={action.asset[:10] if action.asset else 'none'}..."
        )
        return result

    def _generate_action_id(self, action: Any) -> str:
        raw = (
            f"{action.action_type}:{action.asset}:{action.risk_score}:"
            f"{time.time()}:{self.executor_address}"
        )
        return "0x" + hashlib.sha256(raw.encode()).hexdigest()
