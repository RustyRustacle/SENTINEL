# tests/test_risk_engine.py
"""
Unit tests for the RiskEngine — validates risk scoring logic
across normal, elevated, and crisis conditions.
"""

import pytest
from agents.risk_engine import RiskEngine, RiskScore


@pytest.fixture
def engine():
    return RiskEngine({})


def test_normal_conditions_scores_low(engine):
    """Normal market conditions should produce a GREEN (< 30) score."""
    snapshot = {
        "prices": {
            "USDY": {"usd": 1.000},
            "mETH": {"usd": 3200},
            "ETH": {"usd": 3200},
            "fBTC": {"usd": 65000},
        },
        "liquidity": {"pool_depth_ratio": 1.2, "spread_bps": 5},
        "correlations": {"mETH_ETH": 0.98, "fBTC_BTC": 0.99},
        "volatility": {"realized_24h": 0.02},
        "tradfi": {"tbill_3m": 0.045, "defi_avg_yield": 0.12},
    }
    score = engine.compute_risk_score(snapshot)
    assert score.total < 30, f"Expected GREEN (< 30), got {score.total}"
    assert score.level == "GREEN"


def test_usdy_depeg_scores_critical(engine):
    """A 3.5% USDY de-peg with poor liquidity should score CRITICAL."""
    snapshot = {
        "prices": {
            "USDY": {"usd": 0.965},  # 3.5% de-peg
            "mETH": {"usd": 3200},
            "ETH": {"usd": 3200},
            "fBTC": {"usd": 65000},
        },
        "liquidity": {"pool_depth_ratio": 0.5, "spread_bps": 80},
        "correlations": {"mETH_ETH": 0.95, "fBTC_BTC": 0.98},
        "volatility": {"realized_24h": 0.12},
        "tradfi": {"tbill_3m": 0.045, "defi_avg_yield": 0.08},
    }
    score = engine.compute_risk_score(snapshot)
    assert score.total >= 70, f"Expected CRITICAL (>= 70), got {score.total}"
    assert score.depeg_score == 100.0


def test_mild_depeg_scores_yellow(engine):
    """A 0.5% USDY deviation should produce YELLOW range."""
    snapshot = {
        "prices": {
            "USDY": {"usd": 0.995},  # 0.5% de-peg
            "mETH": {"usd": 3200},
            "ETH": {"usd": 3200},
            "fBTC": {"usd": 65000},
        },
        "liquidity": {"pool_depth_ratio": 1.0, "spread_bps": 15},
        "correlations": {"mETH_ETH": 0.90, "fBTC_BTC": 0.92},
        "volatility": {"realized_24h": 0.04},
        "tradfi": {"tbill_3m": 0.045, "defi_avg_yield": 0.10},
    }
    score = engine.compute_risk_score(snapshot)
    assert 20 <= score.total <= 50, f"Expected YELLOW range, got {score.total}"


def test_weights_sum_to_one(engine):
    """Risk signal weights must sum to exactly 1.0."""
    total = sum(engine.WEIGHTS.values())
    assert abs(total - 1.0) < 1e-9, f"Weights sum to {total}, expected 1.0"


def test_risk_score_to_dict(engine):
    """RiskScore.to_dict should include all fields."""
    snapshot = {
        "prices": {
            "USDY": {"usd": 1.000},
            "mETH": {"usd": 3200},
            "ETH": {"usd": 3200},
            "fBTC": {"usd": 65000},
        },
        "liquidity": {"pool_depth_ratio": 1.0, "spread_bps": 5},
        "correlations": {"mETH_ETH": 0.50, "fBTC_BTC": 0.50},
        "volatility": {"realized_24h": 0.02},
        "tradfi": {"tbill_3m": 0.045, "defi_avg_yield": 0.10},
    }
    score = engine.compute_risk_score(snapshot)
    d = score.to_dict()
    assert "total" in d
    assert "level" in d
    assert "depeg_score" in d
    assert "liquidity_score" in d
    assert "correlation_score" in d
    assert "volatility_score" in d
    assert "tradfi_score" in d


def test_high_volatility_increases_score(engine):
    """High 24h volatility should contribute to a higher total score."""
    base = {
        "prices": {
            "USDY": {"usd": 1.000},
            "mETH": {"usd": 3200},
            "ETH": {"usd": 3200},
            "fBTC": {"usd": 65000},
        },
        "liquidity": {"pool_depth_ratio": 1.0, "spread_bps": 5},
        "correlations": {"mETH_ETH": 0.50, "fBTC_BTC": 0.50},
        "tradfi": {"tbill_3m": 0.045, "defi_avg_yield": 0.10},
    }

    low_vol = {**base, "volatility": {"realized_24h": 0.01}}
    high_vol = {**base, "volatility": {"realized_24h": 0.14}}

    score_low = engine.compute_risk_score(low_vol)
    score_high = engine.compute_risk_score(high_vol)

    assert score_high.total > score_low.total
    assert score_high.volatility_score > score_low.volatility_score


def test_negative_defi_spread_increases_tradfi_score(engine):
    """When DeFi yield < T-bill yield, TradFi score should be high (80)."""
    snapshot = {
        "prices": {
            "USDY": {"usd": 1.000},
            "mETH": {"usd": 3200},
            "ETH": {"usd": 3200},
            "fBTC": {"usd": 65000},
        },
        "liquidity": {"pool_depth_ratio": 1.0, "spread_bps": 5},
        "correlations": {"mETH_ETH": 0.50, "fBTC_BTC": 0.50},
        "volatility": {"realized_24h": 0.02},
        "tradfi": {"tbill_3m": 0.06, "defi_avg_yield": 0.04},  # negative spread
    }
    score = engine.compute_risk_score(snapshot)
    assert score.tradfi_score == 80
