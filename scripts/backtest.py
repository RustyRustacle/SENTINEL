# scripts/backtest.py
"""
Backtest Runner — Replays historical market data through the Sentinel
risk engine to validate protective action timing and effectiveness.

Usage:
    python scripts/backtest.py --start 2025-10-15 --end 2025-10-20 \
        --assets USDY,mETH,fBTC --initial-capital 100000
"""

import argparse
import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.risk_engine import RiskEngine
from agents.decision_maker import DecisionMaker


def simulate_oct_2025_depeg():
    """
    Simulate the October 2025 USDe de-peg event.
    Returns a list of hourly snapshots with progressive de-peg.
    """
    snapshots = []
    # Day 1: Normal conditions
    for hour in range(24):
        snapshots.append({
            "hour": hour,
            "day": 1,
            "prices": {
                "USDY": {"usd": 1.000 - (hour * 0.0001)},
                "mETH": {"usd": 3200 - (hour * 5)},
                "ETH": {"usd": 3200 - (hour * 5)},
                "fBTC": {"usd": 65000},
            },
            "liquidity": {"pool_depth_ratio": 1.2 - (hour * 0.005), "spread_bps": 5 + hour},
            "correlations": {"mETH_ETH": 0.98, "fBTC_BTC": 0.99},
            "volatility": {"realized_24h": 0.02 + (hour * 0.001)},
            "tradfi": {"tbill_3m": 0.045, "defi_avg_yield": 0.10},
        })

    # Day 2: De-peg begins
    for hour in range(24):
        depeg = 0.003 + (hour * 0.0015)  # progressive de-peg
        snapshots.append({
            "hour": hour,
            "day": 2,
            "prices": {
                "USDY": {"usd": 1.000 - depeg},
                "mETH": {"usd": 3100 - (hour * 15)},
                "ETH": {"usd": 3150 - (hour * 10)},
                "fBTC": {"usd": 64000 - (hour * 100)},
            },
            "liquidity": {
                "pool_depth_ratio": max(0.3, 0.9 - (hour * 0.025)),
                "spread_bps": 15 + (hour * 3),
            },
            "correlations": {"mETH_ETH": 0.92, "fBTC_BTC": 0.95},
            "volatility": {"realized_24h": 0.05 + (hour * 0.004)},
            "tradfi": {"tbill_3m": 0.045, "defi_avg_yield": 0.08},
        })

    return snapshots


def run_backtest(initial_capital: float = 100000):
    """Run backtest simulation and output results."""
    engine = RiskEngine({})
    decision = DecisionMaker({})
    snapshots = simulate_oct_2025_depeg()

    capital = initial_capital
    unprotected_capital = initial_capital
    actions_taken = []
    position_pct = 1.0  # 100% position

    print("=" * 55)
    print("  BACKTEST: Oct 2025 USDe De-Peg Event Simulation")
    print("=" * 55)

    for snap in snapshots:
        score = engine.compute_risk_score(snap)
        action_type = decision.get_recommendation(score.total)

        usdy_price = snap["prices"]["USDY"]["usd"]
        price_change = (usdy_price - 1.0) * 0.6
        unprotected_capital = initial_capital * (1 + price_change)

        if action_type != "HOLD" and position_pct > 0:
            reduction = decision.REDUCTION_PCT.get(action_type, 0)
            position_pct *= (1.0 - reduction)

            actions_taken.append({
                "day": snap["day"],
                "hour": snap["hour"],
                "action": action_type,
                "risk_score": score.total,
                "usdy_price": usdy_price,
                "position_remaining": position_pct,
            })

            print(
                f"  Day {snap['day']} Hour {snap['hour']:02d} | "
                f"Score: {score.total:5.1f} ({score.level:6s}) | "
                f"Action: {action_type:10s} | Position: {position_pct*100:.0f}%"
            )

        capital = initial_capital * (1 + price_change * position_pct)

    # Final results
    unprotected_loss = unprotected_capital - initial_capital
    sentinel_loss = capital - initial_capital

    print()
    print("=" * 55)
    print("  BACKTEST RESULTS")
    print("=" * 55)
    print(f"  Initial Capital:     ${initial_capital:>12,.0f}")
    print(f"  Unprotected Loss:    ${unprotected_loss:>12,.0f}  ({unprotected_loss/initial_capital*100:+.1f}%)")
    print(f"  Sentinel Loss:       ${sentinel_loss:>12,.0f}  ({sentinel_loss/initial_capital*100:+.1f}%)")
    print(f"  Capital Saved:       ${sentinel_loss - unprotected_loss:>12,.0f}")
    print(f"  Actions Taken:       {len(actions_taken)}")
    print(f"  Final Position:      {position_pct*100:.0f}%")
    print("=" * 55)

    return {
        "initial_capital": initial_capital,
        "unprotected_loss": round(unprotected_loss, 2),
        "sentinel_loss": round(sentinel_loss, 2),
        "capital_saved": round(sentinel_loss - unprotected_loss, 2),
        "actions_taken": actions_taken,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sentinel RWA Backtest Runner")
    parser.add_argument("--initial-capital", type=float, default=100000)
    parser.add_argument("--start", type=str, default="2025-10-15")
    parser.add_argument("--end", type=str, default="2025-10-20")
    parser.add_argument("--assets", type=str, default="USDY,mETH,fBTC")
    parser.add_argument("--output", type=str, default=None)
    args = parser.parse_args()

    results = run_backtest(args.initial_capital)

    if args.output:
        os.makedirs(os.path.dirname(args.output), exist_ok=True)
        with open(args.output, "w") as f:
            json.dump(results, f, indent=2)
        print(f"\nResults saved to: {args.output}")
