import logging
import os
from typing import Dict, Optional
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware
from eth_account import Account

logger = logging.getLogger("SentinelRWA.Submitter")


class MantleSubmitter:

    def __init__(self, config: dict):
        rpc_url = config.get("MANTLE_RPC_URL", "https://rpc.mantle.xyz")
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        self.w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
        self.executor_address = config.get("SENTINEL_EXECUTOR_ADDRESS", "")
        self.max_gas_gwei = int(config.get("MAX_GAS_GWEI", 50))
        self.private_key = config.get("AGENT_PRIVATE_KEY", "")

        if self.private_key:
            self.account = Account.from_key(self.private_key)
        else:
            self.account = None

        if self.executor_address and self.w3.is_connected():
            self.contract_abi = self._load_abi()
            self.contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(self.executor_address),
                abi=self.contract_abi,
            )
            logger.info(
                f"Submitter ready: executor={self.executor_address[:10]}... "
                f"rpc={rpc_url[:30]}..."
            )
        else:
            self.contract = None
            logger.warning("Submitter not fully initialized")

    def _load_abi(self) -> list:
        abi_path = os.path.join(
            os.path.dirname(__file__),
            "..",
            "artifacts",
            "contracts",
            "SentinelExecutor.sol",
            "SentinelExecutor.json",
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
                    "name": "executeAction",
                    "inputs": [
                        {
                            "type": "tuple",
                            "name": "action",
                            "components": [
                                {"type": "bytes32", "name": "actionId"},
                                {"type": "uint8", "name": "actionType"},
                                {"type": "address", "name": "asset"},
                                {"type": "uint256", "name": "amount"},
                                {"type": "uint256", "name": "amountOutMin"},
                                {"type": "uint256", "name": "riskScore"},
                                {"type": "uint256", "name": "deadline"},
                                {"type": "bytes", "name": "signature"},
                            ],
                        }
                    ],
                    "stateMutability": "nonpayable",
                    "outputs": [],
                },
                {
                    "type": "function",
                    "name": "canExecute",
                    "inputs": [],
                    "stateMutability": "view",
                    "outputs": [{"type": "bool"}],
                },
            ]

    async def submit(self, signed_action: Dict) -> str:
        if not self.contract or not self.account:
            logger.error("Submitter not initialized")
            raise RuntimeError("Submitter not initialized")

        try:
            action = (
                signed_action["actionId"],
                signed_action["actionType"],
                Web3.to_checksum_address(signed_action["asset"]),
                signed_action["amount"],
                signed_action.get("amountOutMin", 1),
                signed_action["riskScore"],
                signed_action["deadline"],
                "0x" + signed_action["signature"],
            )

            can_execute = self.contract.functions.canExecute().call()
            if not can_execute:
                raise RuntimeError("Cooldown active or contract paused")

            gas_estimate = self.contract.functions.executeAction(action).estimate_gas(
                {"from": self.account.address}
            )

            base_fee = self.w3.eth.gas_price
            max_fee = self.w3.to_wei(self.max_gas_gwei, "gwei")
            gas_price = min(base_fee * 2, max_fee)

            tx = self.contract.functions.executeAction(action).build_transaction({
                "from": self.account.address,
                "gas": gas_estimate,
                "gasPrice": gas_price,
                "nonce": self.w3.eth.get_transaction_count(self.account.address),
            })

            signed_tx = self.account.sign_transaction(tx)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)

            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            if receipt["status"] == 0:
                raise RuntimeError(f"Transaction reverted: {tx_hash.hex()[:16]}...")

            tx_hash_str = tx_hash.hex()
            logger.info(f"Transaction confirmed: {tx_hash_str[:16]}...")
            return tx_hash_str

        except Exception as e:
            logger.error(f"Submission failed: {e}")
            raise
