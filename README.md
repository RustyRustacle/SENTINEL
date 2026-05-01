<p align="center">
  <img src="sentinelbanner.png" alt="SENTINEL — Autonomous RWA Risk Guardian" width="100%" />
</p>

<p align="center">
  <strong>Autonomous On-Chain Risk Guardian for Real-World Assets</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Mantle-Network-00F0C0?style=flat-square&logo=ethereum" alt="Mantle Network" />
  <img src="https://img.shields.io/badge/ERC-8004-00F0C0?style=flat-square" alt="ERC-8004" />
  <img src="https://img.shields.io/badge/Solidity-0.8.24-363636?style=flat-square&logo=solidity" alt="Solidity" />
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python" alt="Python" />
  <img src="https://img.shields.io/badge/Next.js-14-000000?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
</p>

---

## Overview

**SENTINEL** is an autonomous, multi-agent risk management system deployed on Mantle Network. It continuously monitors real-world asset positions — including **mETH**, **USDY**, and **fBTC** — and executes protective on-chain actions when predefined risk thresholds are breached, without human intervention.

Every protective action is recorded as verifiable agent reputation via **ERC-8004**.

> Built for the **Mantle Turing Test Hackathon 2026** — AI x RWA Track

---

## Problem

In October 2025, a USDe de-peg triggered **$500M–$1B in forced liquidations** in minutes. No autonomous on-chain guardian existed to prevent cascading losses for RWA holders on Mantle.

## Solution

SENTINEL deploys a fleet of AI agents that **monitor**, **evaluate**, and **act** — reducing exposure, re-hedging positions, and alerting users in real time, all recorded on-chain via ERC-8004 reputation.

---

## Architecture

```
DATA LAYER          RISK ENGINE         DECISION LAYER       EXECUTION
 Pyth Oracles        SentinelAgent       HOLD (GREEN)         SentinelExecutor.sol
 RedStone            LangChain +         REDUCE (YELLOW)      Merchant Moe DEX
 Mantle RPC          Claude Sonnet       EXIT (RED)           Agni Finance
 FRED API            5-Signal Score      HEDGE (PURPLE)       INIT Capital
                                                              |
                                                              v
                                                         ERC-8004 Registry
                                                         (On-Chain Reputation)
```

---

## Project Structure

```
sentinel-rwa/
├── agents/                   # Python AI Agent
│   ├── sentinel_agent.py     # Core LangChain agent
│   ├── risk_engine.py        # 5-signal risk scoring
│   └── decision_maker.py     # Action selection logic
├── data/
│   └── collectors/           # Price, chain, and TradFi data
├── execution/                # Signing and Mantle tx submission
├── reputation/               # ERC-8004 client
├── alerts/                   # Telegram bot alerts
├── contracts/                # Solidity smart contracts
│   ├── SentinelExecutor.sol  # On-chain action execution
│   ├── ERC8004Registry.sol   # Agent identity & reputation
│   └── interfaces/           # Protocol interfaces
├── frontend/                 # Next.js monitoring dashboard
├── scripts/                  # Deploy + backtest scripts
├── test/                     # Hardhat contract tests
└── tests/                    # Python unit tests
```

---

## Risk Engine

SENTINEL computes a **composite risk score (0–100)** from five weighted signals:

| Signal | Weight | Source |
|--------|--------|--------|
| De-peg Risk | 35% | Price deviation from peg |
| Liquidity Risk | 25% | Pool depth + bid-ask spread |
| Correlation | 20% | Cross-asset movement correlation |
| Volatility | 10% | 24h realized volatility |
| TradFi Macro | 10% | T-bill yield spread vs DeFi |

### Action Matrix

| Score | Level | Action |
|-------|-------|--------|
| 0–30 | GREEN | HOLD |
| 31–50 | YELLOW | REDUCE 25% |
| 51–70 | ORANGE | REDUCE 50% |
| 71–85 | RED | FULL EXIT or HEDGE |
| 86–100 | BLACK | IMMEDIATE EXIT |

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- Git

### Setup

```bash
# Clone
git clone https://github.com/your-org/sentinel-rwa
cd sentinel-rwa

# Install Node dependencies (contracts)
npm install

# Install Python dependencies (agent)
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your keys
```

### Compile & Test Contracts

```bash
npx hardhat compile    # Compile Solidity contracts
npx hardhat test       # Run 9 contract tests
```

### Run Dashboard

```bash
cd frontend
npm install
npm run dev            # http://localhost:3000
```

### Run AI Agent

```bash
python -m agents       # Starts the monitoring loop
```

### Run Backtest

```bash
python scripts/backtest.py --initial-capital 100000
```

---

## Smart Contracts

| Contract | Purpose |
|----------|---------|
| `SentinelExecutor.sol` | Accepts signed AI actions, executes swaps/hedges on Mantle |
| `ERC8004Registry.sol` | On-chain agent identity, action recording, reputation scoring |

### Key Security Features

- ECDSA signature verification for all actions
- 5-minute cooldown between consecutive actions
- Risk score threshold enforcement (minimum 40)
- ReentrancyGuard on state-modifying functions
- Authorized caller access control

---

## ERC-8004 Reputation

Every action builds verifiable on-chain reputation:

| Score | Trust Level | Capability |
|-------|-------------|------------|
| 0–300 | Probationary | Manual review required |
| 300–500 | Standard | Autonomous up to $50K |
| 500–700 | Trusted | Autonomous up to $250K |
| 700–850 | Elite | Autonomous up to $1M |
| 850–1000 | Sovereign | Full autonomous operation |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| AI Agent | Python, LangChain, Claude Sonnet |
| Smart Contracts | Solidity 0.8.24, OpenZeppelin v5 |
| Frontend | Next.js 14, TypeScript, Vanilla CSS |
| Network | Mantle L2 (Chain ID: 5000) |
| Oracles | Pyth Network, RedStone Finance |
| DEX | Merchant Moe, Agni Finance |

---

## Token Addresses (Mantle Mainnet)

| Token | Address |
|-------|---------|
| mETH | `0xcDA86A272531e8640cD7F1a92c01839711B3Aa6E` |
| USDY | `0x5bE26527e817998A7206475496fDE1E68957c5A6` |
| fBTC | `0xC96dE26018A54D51c097160568752c4E3BD6C364` |

---

## License

MIT

---

<p align="center">
  <strong>SENTINEL</strong> — Protecting real value with autonomous intelligence on Mantle Network
</p>
