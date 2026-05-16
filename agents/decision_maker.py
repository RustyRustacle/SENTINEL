import re
from dataclasses import dataclass
from typing import Optional, Dict


@dataclass
class ProtectiveAction:
    action_type: str
    asset: str
    amount: int
    amount_out_min: int
    risk_score: int
    reason: str
    portfolio_pct: float

    @property
    def action_type_enum(self) -> int:
        mapping = {
            "HOLD": 0,
            "REDUCE_25": 1,
            "REDUCE_50": 2,
            "FULL_EXIT": 3,
            "HEDGE": 4,
        }
        return mapping.get(self.action_type, 0)


class DecisionMaker:

    ACTION_MAP = {
        (0, 30): "HOLD",
        (31, 50): "REDUCE_25",
        (51, 70): "REDUCE_50",
        (71, 85): "FULL_EXIT",
        (86, 100): "FULL_EXIT",
    }

    REDUCTION_PCT = {
        "REDUCE_25": 0.25,
        "REDUCE_50": 0.50,
        "FULL_EXIT": 1.0,
        "HEDGE": 0.50,
    }

    ASSET_THRESHOLDS = {
        "USDY": {
            "warn": 0.005,
            "alert": 0.01,
            "critical": 0.035,
            "alert_action": "REDUCE_50",
            "critical_action": "FULL_EXIT",
        },
        "mETH": {
            "warn": 0.005,
            "alert": 0.02,
            "critical": 0.05,
            "alert_action": "REDUCE_25",
            "critical_action": "HEDGE",
        },
        "fBTC": {
            "warn": 0.003,
            "alert": 0.015,
            "critical": 0.04,
            "alert_action": "REDUCE_25",
            "critical_action": "FULL_EXIT",
        },
    }

    def __init__(self, config: dict = None):
        self.config = config or {}
        self.asset_addresses = {
            "mETH": config.get("METH_TOKEN", ""),
            "USDY": config.get("USDY_TOKEN", ""),
            "fBTC": config.get("FBTC_TOKEN", ""),
        } if config else {}

    def get_recommendation(self, risk_score: float) -> str:
        score = int(risk_score)
        for (low, high), action in self.ACTION_MAP.items():
            if low <= score <= high:
                return action
        return "HOLD"

    def build_action(
        self,
        risk_score: float,
        asset_symbol: str,
        portfolio_size_usd: float,
        slippage_bps: int = 100,
        reason: str = "",
    ) -> Optional[ProtectiveAction]:
        action_type = self.get_recommendation(risk_score)
        if action_type == "HOLD":
            return None

        asset_address = self.asset_addresses.get(asset_symbol, "")
        if not asset_address:
            logger.error(f"No address for asset {asset_symbol}")
            return None

        reduction_pct = self.REDUCTION_PCT.get(action_type, 0)
        amount = int(portfolio_size_usd * reduction_pct)
        amount_out_min = amount * (10000 - slippage_bps) // 10000
        if amount_out_min < 1:
            amount_out_min = 1

        return ProtectiveAction(
            action_type=action_type,
            asset=asset_address,
            amount=amount,
            amount_out_min=amount_out_min,
            risk_score=int(risk_score),
            reason=reason or f"Risk score {risk_score} triggered {action_type}",
            portfolio_pct=reduction_pct,
        )

    def parse_agent_output(
        self, output: str, portfolio: Dict = None
    ) -> Optional[ProtectiveAction]:
        output_upper = output.upper()

        action_type = "HOLD"
        for action in ["FULL_EXIT", "REDUCE_50", "REDUCE_25", "HEDGE"]:
            if action in output_upper:
                action_type = action
                break

        if action_type == "HOLD":
            return None

        score_match = re.search(r"risk\s*score[:\s]*(\d+)", output, re.IGNORECASE)
        risk_score = int(score_match.group(1)) if score_match else 50

        asset_match = re.search(
            r"(mETH|USDY|fBTC|0x[a-fA-F0-9]{40})", output, re.IGNORECASE
        )
        asset_symbol = asset_match.group(1) if asset_match else "USDY"

        amount = 0
        amount_out_min = 0
        if portfolio:
            reduction_pct = self.REDUCTION_PCT.get(action_type, 0)
            total = sum(portfolio.values()) if isinstance(portfolio, dict) else float(portfolio.get(asset_symbol, 0))
            amount = int(total * reduction_pct)
            amount_out_min = amount * 99 // 100

        asset_address = self.asset_addresses.get(asset_symbol, "")
        if not asset_address:
            asset_address = asset_symbol if asset_symbol.startswith("0x") else ""

        return ProtectiveAction(
            action_type=action_type,
            asset=asset_address,
            amount=amount,
            amount_out_min=amount_out_min,
            risk_score=risk_score,
            reason=output[:200],
            portfolio_pct=self.REDUCTION_PCT.get(action_type, 0),
        )


import logging
logger = logging.getLogger("SentinelRWA.DecisionMaker")
