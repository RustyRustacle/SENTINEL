# agents/decision_maker.py
"""
DecisionMaker — Maps risk scores to protective actions.

Action Matrix:
  0-30  GREEN   -> HOLD
  31-50 YELLOW  -> REDUCE_25
  51-70 ORANGE  -> REDUCE_50
  71-85 RED     -> FULL_EXIT or HEDGE
  86+   BLACK   -> FULL_EXIT (immediate)
"""

import re
from dataclasses import dataclass
from typing import Optional, Dict


@dataclass
class ProtectiveAction:
    """Represents a protective action to be executed on-chain."""

    action_type: str  # HOLD, REDUCE_25, REDUCE_50, FULL_EXIT, HEDGE
    asset: str  # Token address
    amount: int  # Amount in wei
    risk_score: int  # 0-100
    reason: str  # Human-readable justification

    @property
    def action_type_enum(self) -> int:
        """Map to Solidity enum values."""
        mapping = {
            "HOLD": 0,
            "REDUCE_25": 1,
            "REDUCE_50": 2,
            "FULL_EXIT": 3,
            "HEDGE": 4,
        }
        return mapping.get(self.action_type, 0)


class DecisionMaker:
    """Maps risk scores to concrete protective actions."""

    # Risk score -> action mapping
    ACTION_MAP = {
        (0, 30): "HOLD",
        (31, 50): "REDUCE_25",
        (51, 70): "REDUCE_50",
        (71, 85): "FULL_EXIT",
        (86, 100): "FULL_EXIT",
    }

    # Asset-specific thresholds for de-peg detection
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

    def get_recommendation(self, risk_score: float) -> str:
        """
        Get recommended action type for a given risk score.

        Args:
            risk_score: Composite risk score 0-100

        Returns:
            Action type string
        """
        score = int(risk_score)
        for (low, high), action in self.ACTION_MAP.items():
            if low <= score <= high:
                return action
        return "HOLD"

    def build_action(
        self,
        risk_score: float,
        asset_address: str,
        amount: int,
        reason: str = "",
    ) -> ProtectiveAction:
        """
        Build a complete ProtectiveAction from risk assessment.

        Args:
            risk_score: Composite risk score 0-100
            asset_address: Token contract address
            amount: Position size in wei
            reason: Human-readable justification

        Returns:
            ProtectiveAction ready for signing
        """
        action_type = self.get_recommendation(risk_score)
        return ProtectiveAction(
            action_type=action_type,
            asset=asset_address,
            amount=amount,
            risk_score=int(risk_score),
            reason=reason or f"Risk score {risk_score} triggered {action_type}",
        )

    def parse_agent_output(self, output: str) -> Optional[ProtectiveAction]:
        """
        Parse the LLM agent's output to extract a ProtectiveAction.

        Args:
            output: Raw string output from the LangChain agent

        Returns:
            ProtectiveAction if an action is recommended, None if HOLD
        """
        output_upper = output.upper()

        # Detect action type from agent output
        action_type = "HOLD"
        for action in ["FULL_EXIT", "REDUCE_50", "REDUCE_25", "HEDGE"]:
            if action in output_upper:
                action_type = action
                break

        if action_type == "HOLD":
            return None

        # Extract risk score if mentioned
        score_match = re.search(r"risk\s*score[:\s]*(\d+)", output, re.IGNORECASE)
        risk_score = int(score_match.group(1)) if score_match else 50

        return ProtectiveAction(
            action_type=action_type,
            asset="",  # Will be set by the execution layer
            amount=0,  # Will be computed from portfolio
            risk_score=risk_score,
            reason=output[:200],
        )
