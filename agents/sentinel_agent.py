import asyncio
import hashlib
import time
import logging
import os

from langchain_google_genai import ChatGoogleGenerativeAI
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

    def __init__(self, config: dict):
        self.llm = ChatGoogleGenerativeAI(
            model=config.get("GEMINI_MODEL", "gemini-2.5-flash"),
            google_api_key=config.get("GEMINI_API_KEY", ""),
            temperature=0,
            max_tokens=2048,
        )
        self.aggregator = DataAggregator(config)
        self.risk_engine = RiskEngine(config)
        self.decision = DecisionMaker(config)
        self.signer = ActionSigner(
            config.get("AGENT_PRIVATE_KEY", ""),
            config.get("SENTINEL_EXECUTOR_ADDRESS", ""),
        )
        self.submitter = MantleSubmitter(config)
        self.erc8004 = ERC8004Client(config)
        self.alerts = AlertService(
            config.get("TELEGRAM_BOT_TOKEN", ""),
            config.get("TELEGRAM_CHAT_ID", ""),
        )
        self.agent_id = config.get("AGENT_ID", "")
        self.sentinel_address = config.get("SENTINEL_EXECUTOR_ADDRESS", "")
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
                func=self.risk_engine.compute_risk_score_for_agent,
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
        try:
            snapshot = await asyncio.to_thread(
                self.aggregator.get_current_snapshot
            )
            risk = self.risk_engine.compute_risk_score(snapshot)
            action = self.decision.build_action(
                risk_score=risk.total,
                asset_symbol="USDY",
                portfolio_size_usd=100000,
                slippage_bps=100,
                reason=f"Risk score {risk.total} ({risk.level}) triggered by {risk.to_dict()}",
            )

            logger.info(
                f"Cycle: risk={risk.total:.1f} ({risk.level}) "
                f"action={action.action_type if action else 'HOLD'}"
            )

            if action and action.action_type != "HOLD":
                await self._execute_action(action)
                logger.info(
                    f"Action executed: {action.action_type} on {action.asset[:10]}..."
                )
                return action
            else:
                logger.info("Cycle complete — no action needed (HOLD)")
                return None

        except Exception as e:
            logger.error(f"Cycle error: {e}", exc_info=True)
            await self.alerts.send_error(str(e))
            return None

    async def _execute_action(self, action):
        signed = self.signer.sign_action(action)
        tx_hash = await self.submitter.submit(signed)
        logger.info(f"Transaction submitted: {tx_hash[:16]}...")
        await self.alerts.send_action_alert(action, tx_hash)
        return tx_hash

    async def run_forever(self):
        logger.info("=" * 60)
        logger.info("  SENTINEL RWA — Autonomous Risk Guardian")
        logger.info("  Mantle Network (Chain ID: 5000)")
        logger.info("=" * 60)
        logger.info(f"Agent ID: {self.agent_id}")
        logger.info(f"Executor: {self.sentinel_address}")
        logger.info(f"Monitoring: mETH, USDY, fBTC")
        logger.info(f"Cycle interval: {self.interval}s")
        logger.info("Guardian mode: ACTIVE")
        logger.info("=" * 60)

        while True:
            await self.run_cycle()
            await asyncio.sleep(self.interval)


def main():
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
        "GEMINI_API_KEY": os.getenv("GEMINI_API_KEY", ""),
        "GEMINI_MODEL": os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
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
        "METH_ETH_POOL": os.getenv("METH_ETH_POOL", ""),
        "USDY_USDC_POOL": os.getenv("USDY_USDC_POOL", ""),
        "FBTC_BTC_POOL": os.getenv("FBTC_BTC_POOL", ""),
    }

    agent = SentinelAgent(config)
    asyncio.run(agent.run_forever())


if __name__ == "__main__":
    main()
