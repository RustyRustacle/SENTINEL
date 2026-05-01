# agents/risk_engine.py
"""
RiskEngine — Composite risk scoring from multiple market signals.

Computes a 0-100 risk score from five weighted signals:
  - De-peg probability (35%)
  - Liquidity risk (25%)
  - Cross-asset correlation (20%)
  - Realized volatility (10%)
  - TradFi macro risk (10%)

Calibrated against the October 2025 USDe de-peg incident.
"""

import numpy as np
from dataclasses import dataclass
from typing import Dict


@dataclass
class RiskScore:
    """Composite risk assessment result."""

    total: float  # 0-100 composite score
    depeg_score: float  # De-peg probability signal
    liquidity_score: float  # Liquidity risk signal
    correlation_score: float  # Cross-asset correlation signal
    volatility_score: float  # 24h realized volatility signal
    tradfi_score: float  # TradFi macro risk signal

    @property
    def level(self) -> str:
        if self.total <= 30:
            return "GREEN"
        elif self.total <= 50:
            return "YELLOW"
        elif self.total <= 70:
            return "ORANGE"
        elif self.total <= 85:
            return "RED"
        else:
            return "BLACK"

    def to_dict(self) -> dict:
        return {
            "total": self.total,
            "level": self.level,
            "depeg_score": self.depeg_score,
            "liquidity_score": self.liquidity_score,
            "correlation_score": self.correlation_score,
            "volatility_score": self.volatility_score,
            "tradfi_score": self.tradfi_score,
        }


class RiskEngine:
    """Multi-signal risk scoring engine."""

    # Signal weights (must sum to 1.0)
    WEIGHTS = {
        "depeg": 0.35,
        "liquidity": 0.25,
        "correlation": 0.20,
        "volatility": 0.10,
        "tradfi": 0.10,
    }

    # De-peg thresholds (calibrated to Oct 2025 USDe event)
    DEPEG_THRESHOLD_WARN = 0.005  # 0.5% deviation
    DEPEG_THRESHOLD_ALERT = 0.01  # 1.0% deviation
    DEPEG_THRESHOLD_CRIT = 0.035  # 3.5% deviation

    def __init__(self, config: dict = None):
        self.config = config or {}

    def compute_risk_score(self, snapshot: Dict) -> RiskScore:
        """
        Compute composite risk score from market snapshot.

        Args:
            snapshot: Dict with keys: prices, liquidity, correlations,
                      volatility, tradfi

        Returns:
            RiskScore with total 0-100 and individual signal scores
        """
        depeg_s = self._compute_depeg_score(snapshot)
        liquidity_s = self._compute_liquidity_score(snapshot)
        correl_s = self._compute_correlation_score(snapshot)
        vol_s = self._compute_volatility_score(snapshot)
        tradfi_s = self._compute_tradfi_score(snapshot)

        total = (
            depeg_s * self.WEIGHTS["depeg"]
            + liquidity_s * self.WEIGHTS["liquidity"]
            + correl_s * self.WEIGHTS["correlation"]
            + vol_s * self.WEIGHTS["volatility"]
            + tradfi_s * self.WEIGHTS["tradfi"]
        )

        return RiskScore(
            total=round(total, 2),
            depeg_score=round(depeg_s, 2),
            liquidity_score=round(liquidity_s, 2),
            correlation_score=round(correl_s, 2),
            volatility_score=round(vol_s, 2),
            tradfi_score=round(tradfi_s, 2),
        )

    def _compute_depeg_score(self, snapshot: Dict) -> float:
        """Score based on stablecoin/LST deviation from peg."""
        prices = snapshot.get("prices", {})

        usdy_price = prices.get("USDY", {}).get("usd", 1.0)
        meth_price = prices.get("mETH", {}).get("usd", 0)
        eth_price = prices.get("ETH", {}).get("usd", 1)

        usdy_dev = abs(usdy_price - 1.0)
        meth_dev = abs(meth_price - eth_price) / max(eth_price, 1) if eth_price > 0 else 0

        # Normalize to 0-100
        usdy_score = min(usdy_dev / self.DEPEG_THRESHOLD_CRIT * 100, 100)
        meth_score = min(meth_dev / 0.05 * 100, 100)  # 5% = max score

        return max(usdy_score, meth_score)

    def _compute_liquidity_score(self, snapshot: Dict) -> float:
        """Score based on pool depth and bid-ask spread."""
        liq = snapshot.get("liquidity", {})
        depth_ratio = liq.get("pool_depth_ratio", 1.0)
        spread_bps = liq.get("spread_bps", 5)

        depth_score = max(0, (1 - depth_ratio) * 100)
        spread_score = min(spread_bps / 50 * 100, 100)

        return depth_score * 0.6 + spread_score * 0.4

    def _compute_correlation_score(self, snapshot: Dict) -> float:
        """High cross-asset correlation = systemic risk."""
        corr_matrix = snapshot.get("correlations", {})
        if not corr_matrix:
            return 0

        values = [v for v in corr_matrix.values() if isinstance(v, (int, float))]
        if not values:
            return 0

        avg_corr = np.mean(values)
        return min(avg_corr * 100, 100)

    def _compute_volatility_score(self, snapshot: Dict) -> float:
        """Score based on 24h realized volatility."""
        vol = snapshot.get("volatility", {})
        vol_24h = vol.get("realized_24h", 0)
        return min(vol_24h / 0.15 * 100, 100)  # 15% vol = 100

    def _compute_tradfi_score(self, snapshot: Dict) -> float:
        """Score based on TradFi macro conditions (yield spread)."""
        tradfi = snapshot.get("tradfi", {})
        tbill_yield = tradfi.get("tbill_3m", 0.045)
        defi_yield = tradfi.get("defi_avg_yield", 0.10)

        spread = defi_yield - tbill_yield

        # Negative spread = capital flight risk from DeFi
        if spread < 0:
            return 80
        elif spread < 0.02:
            return 50
        else:
            return 20
