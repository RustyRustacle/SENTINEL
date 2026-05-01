# agents/sentinel_agent.py
"""
SentinelAgent — Core LangChain agent for autonomous RWA risk management.

Monitors mETH, USDY, and fBTC positions on Mantle Network.
Executes protective on-chain actions when risk thresholds are breached.
Records all decisions via ERC-8004 for verifiable agent reputation.
"""

import asyncio
import hashlib
import time
import logging
import os

from langchain_anthropic import ChatAnthropic
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate
from langchain.tools import StructuredTool
from dotenv import load_dotenv

from data.aggregator import DataAggregator
from agents.risk_engine import RiskEngine
from agents.decision_maker import DecisionMaker
from execution.signer import ActionSigner
from execution.submitter import MantleSubmitter
from reputation.erc8004_client import ERC8004Client
from alerts.telegram_bot import AlertService

load_dotenv()
logger = logging.getLogger("SentinelRWA")

SYSTEM_PROMPT = """
You are SentinelRWA — an autonomous on-chain risk guardian for
Real-World Asset positions on the Mantle Network.

Your mandate:
1. Continuously monitor mETH, USDY, and fBTC positions
2. Detect de-peg events, liquidity crises, and correlated liquidation risks
3. Make decisive, risk-proportional actions: HOLD, REDUCE_25, REDUCE_50,
   FULL_EXIT, or HEDGE
4. Record every action via ERC-8004 to build verifiable on-chain reputation

Risk Score Scale (0-100):
- 0-30:  GREEN  — normal conditions, HOLD
- 31-50: YELLOW — elevated risk, consider REDUCE_25
- 51-70: ORANGE — high risk, execute REDUCE_50
- 71-85: RED    — critical, FULL_EXIT or HEDGE
- 86-100: BLACK — systemic crisis, immediate FULL_EXIT

Prioritize capital preservation over yield maximization.
Always consider gas costs and slippage before executing.
"""


class SentinelAgent:
    """Main agent orchestrator — runs the monitoring loop."""

    def __init__(self, config: dict):
        self.llm = ChatAnthropic(
            model="claude-sonnet-4-20250514",
            temperature=0,
            max_tokens=2048,
        )
        self.aggregator = DataAggregator(config)
        self.risk_engine = RiskEngine(config)
        self.decision = DecisionMaker(config)
        self.signer = ActionSigner(config.get("AGENT_PRIVATE_KEY", ""))
        self.submitter = MantleSubmitter(config)
        self.erc8004 = ERC8004Client(config)
        self.alerts = AlertService(config.get("TELEGRAM_BOT_TOKEN", ""))
        self.agent_id = config.get("AGENT_ID", "")
        self.interval = int(config.get("MONITORING_INTERVAL_SECONDS", 30))
        self.tools = self._build_tools()
        self.executor = self._build_executor()

    def _build_tools(self):
        return [
            StructuredTool.from_function(
                func=self.aggregator.get_current_snapshot,
                name="get_market_snapshot",
                description="Fetch current price feeds, on-chain state, and TradFi data for mETH, USDY, and fBTC.",
            ),
            StructuredTool.from_function(
                func=self.risk_engine.compute_risk_score,
                name="compute_risk_score",
                description="Compute composite risk score (0-100) from a market snapshot dict.",
            ),
            StructuredTool.from_function(
                func=self.decision.get_recommendation,
                name="get_action_recommendation",
                description="Get recommended action type (HOLD/REDUCE_25/REDUCE_50/FULL_EXIT/HEDGE) given a risk score.",
            ),
            StructuredTool.from_function(
                func=self.erc8004.get_agent_reputation,
                name="get_agent_reputation",
                description="Query current ERC-8004 reputation score and action history for the Sentinel agent.",
            ),
        ]

    def _build_executor(self):
        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", SYSTEM_PROMPT),
                ("human", "{input}"),
                ("placeholder", "{agent_scratchpad}"),
            ]
        )
        agent = create_tool_calling_agent(self.llm, self.tools, prompt)
        return AgentExecutor(agent=agent, tools=self.tools, verbose=True)

    async def run_cycle(self):
        """Single monitoring cycle — runs every interval."""
        try:
            result = await asyncio.to_thread(
                self.executor.invoke,
                {
                    "input": (
                        "Run a full risk assessment cycle. "
                        "1. Collect current market data snapshot. "
                        "2. Compute the composite risk score. "
                        "3. Determine if protective action is needed. "
                        "4. Report your findings and recommended action."
                    )
                },
            )

            action = self.decision.parse_agent_output(result["output"])

            if action and action.action_type != "HOLD":
                await self._execute_action(action)
                logger.info(f"Action executed: {action.action_type} on {action.asset}")
            else:
                logger.info("Cycle complete — no action needed (HOLD)")

        except Exception as e:
            logger.error(f"Cycle error: {e}")
            await self.alerts.send_error(str(e))

    async def _execute_action(self, action):
        """Sign and submit a protective action to Mantle."""
        signed = self.signer.sign_action(action)
        tx_hash = await self.submitter.submit(signed)
        logger.info(f"Transaction submitted: {tx_hash}")
        await self.alerts.send_action_alert(action, tx_hash)

    async def run_forever(self):
        """Main loop — runs indefinitely."""
        logger.info("=" * 60)
        logger.info("  SENTINEL RWA — Autonomous Risk Guardian")
        logger.info("  Mantle Network (Chain ID: 5000)")
        logger.info("=" * 60)
        logger.info(f"Agent ID: {self.agent_id}")
        logger.info(f"Monitoring: mETH, USDY, fBTC")
        logger.info(f"Cycle interval: {self.interval}s")
        logger.info("Guardian mode: ACTIVE")
        logger.info("=" * 60)

        while True:
            await self.run_cycle()
            await asyncio.sleep(self.interval)


def main():
    """Entry point for the Sentinel agent."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
    )

    config = {
        "AGENT_PRIVATE_KEY": os.getenv("AGENT_PRIVATE_KEY", ""),
        "AGENT_ID": os.getenv("AGENT_ID", ""),
        "MANTLE_RPC_URL": os.getenv("MANTLE_RPC_URL", "https://rpc.mantle.xyz"),
        "SENTINEL_EXECUTOR_ADDRESS": os.getenv("SENTINEL_EXECUTOR_ADDRESS", ""),
        "ERC8004_REGISTRY_ADDRESS": os.getenv("ERC8004_REGISTRY_ADDRESS", ""),
        "ANTHROPIC_API_KEY": os.getenv("ANTHROPIC_API_KEY", ""),
        "TELEGRAM_BOT_TOKEN": os.getenv("TELEGRAM_BOT_TOKEN", ""),
        "TELEGRAM_CHAT_ID": os.getenv("TELEGRAM_CHAT_ID", ""),
        "PYTH_HERMES_URL": os.getenv("PYTH_HERMES_URL", "https://hermes.pyth.network"),
        "REDSTONE_API_KEY": os.getenv("REDSTONE_API_KEY", ""),
        "FRED_API_KEY": os.getenv("FRED_API_KEY", ""),
        "REDIS_URL": os.getenv("REDIS_URL", "redis://localhost:6379"),
        "MONITORING_INTERVAL_SECONDS": os.getenv("MONITORING_INTERVAL_SECONDS", "30"),
        "METH_TOKEN": os.getenv("METH_TOKEN", "0xcDA86A272531e8640cD7F1a92c01839711B3Aa6E"),
        "USDY_TOKEN": os.getenv("USDY_TOKEN", "0x5bE26527e817998A7206475496fDE1E68957c5A6"),
        "FBTC_TOKEN": os.getenv("FBTC_TOKEN", "0xC96dE26018A54D51c097160568752c4E3BD6C364"),
    }

    agent = SentinelAgent(config)
    asyncio.run(agent.run_forever())


if __name__ == "__main__":
    main()
