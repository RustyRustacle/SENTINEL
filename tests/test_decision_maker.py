# tests/test_decision_maker.py
"""
Unit tests for the DecisionMaker — validates action mapping
across all risk score ranges.
"""

import pytest
from agents.decision_maker import DecisionMaker, ProtectiveAction


@pytest.fixture
def maker():
    return DecisionMaker({
        "METH_TOKEN": "0xcDA86A272531e8640cD7F1a92c01839711B3Aa6E",
        "USDY_TOKEN": "0x5bE26527e817998A7206475496fDE1E68957c5A6",
        "FBTC_TOKEN": "0xC96dE26018A54D51c097160568752c4E3BD6C364",
    })


def test_low_risk_returns_hold(maker):
    assert maker.get_recommendation(15) == "HOLD"
    assert maker.get_recommendation(0) == "HOLD"
    assert maker.get_recommendation(30) == "HOLD"


def test_elevated_risk_returns_reduce_25(maker):
    assert maker.get_recommendation(35) == "REDUCE_25"
    assert maker.get_recommendation(50) == "REDUCE_25"


def test_high_risk_returns_reduce_50(maker):
    assert maker.get_recommendation(55) == "REDUCE_50"
    assert maker.get_recommendation(70) == "REDUCE_50"


def test_critical_risk_returns_full_exit(maker):
    assert maker.get_recommendation(75) == "FULL_EXIT"
    assert maker.get_recommendation(85) == "FULL_EXIT"


def test_systemic_risk_returns_full_exit(maker):
    assert maker.get_recommendation(90) == "FULL_EXIT"
    assert maker.get_recommendation(100) == "FULL_EXIT"


def test_build_action_creates_correct_struct(maker):
    action = maker.build_action(
        risk_score=65,
        asset_symbol="USDY",
        portfolio_size_usd=100000,
        slippage_bps=100,
        reason="Test action",
    )
    assert isinstance(action, ProtectiveAction)
    assert action.action_type == "REDUCE_50"
    assert action.risk_score == 65
    assert action.asset == maker.asset_addresses["USDY"]
    assert action.amount == 50000


def test_action_type_enum_mapping(maker):
    action = maker.build_action(75, "USDY", 100000)
    assert action is not None
    assert action.action_type_enum == 3  # FULL_EXIT

    action2 = maker.build_action(15, "USDY", 100000)
    assert action2 is None  # HOLD returns None


def test_parse_agent_output_detects_actions(maker):
    output = "Risk score is 72. I recommend FULL_EXIT on all USDY positions."
    action = maker.parse_agent_output(output, portfolio={"USDY": 100000})
    assert action is not None
    assert action.action_type == "FULL_EXIT"
    assert action.risk_score == 72


def test_parse_agent_output_hold_returns_none(maker):
    output = "Risk score is 15. All positions are safe. HOLD recommended."
    action = maker.parse_agent_output(output, portfolio={"USDY": 100000})
    assert action is None


def test_parse_agent_output_reduce_25(maker):
    output = "Elevated risk detected (score 42). Recommend REDUCE_25."
    action = maker.parse_agent_output(output, portfolio={"USDY": 100000})
    assert action is not None
    assert action.action_type == "REDUCE_25"
