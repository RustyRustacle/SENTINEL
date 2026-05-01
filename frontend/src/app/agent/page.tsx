"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import SentinelBot from "@/components/SentinelBot";
import Icons from "@/components/Icons";

// ─── Deployed Contract Addresses (Mantle Testnet Sepolia) ─────
const CONTRACTS = {
  registry: "0xa6446C060e93A91b00dA94135d784704F27558eb",
  executor: "0xa3c740c8F64eB59c21743792c10aA7E6e1734160",
  agentId: "0x5252d3ba920df791e2c8f8eec5a0e389a3c3f32578b9db85e79347f6fada2ede",
  agentSigner: "0x4f3c0610e2ACf990fD382A5Fb11021CaECCAf1D7",
  explorerBase: "https://sepolia.mantlescan.xyz",
};

const truncateAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

const CAPABILITIES = [
  { name: "Multi-source data ingestion", desc: "Pyth, RedStone, Mantle RPC, FRED API", active: true },
  { name: "5-signal risk scoring", desc: "De-peg, liquidity, correlation, volatility, TradFi", active: true },
  { name: "Autonomous execution", desc: "HOLD, REDUCE, EXIT, HEDGE via SentinelExecutor", active: true },
  { name: "ERC-8004 reputation", desc: "On-chain action recording & scoring", active: true },
  { name: "Telegram alerts", desc: "Real-time notifications to operators", active: true },
  { name: "Cross-chain monitoring", desc: "Mantle + Ethereum mainnet coverage", active: false },
];

const ACTIONS = [
  { time: "2 min ago", type: "FULL_EXIT", asset: "USDY", score: 82, result: "Protected $21,300" },
  { time: "4 min ago", type: "REDUCE_50", asset: "USDY", score: 65, result: "Reduced 50% exposure" },
  { time: "8 min ago", type: "REDUCE_25", asset: "mETH", score: 42, result: "Reduced 25% exposure" },
  { time: "35 min ago", type: "HOLD", asset: "ALL", score: 12, result: "No action needed" },
  { time: "1h ago", type: "HOLD", asset: "ALL", score: 8, result: "No action needed" },
];

const LOGO_MAP: Record<string, string> = {
  mETH: "/methlogo.png",
  USDY: "/usdylogo.svg",
  fBTC: "/fbtclogo.png",
};

export default function AgentPage() {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="app-wrapper">
      <Header />
      <main className="main-content">
        <div className="agent-page">
          {/* Bot + Profile */}
          <div className="agent-hero">
            <div className="agent-bot-section">
              <SentinelBot agentId={truncateAddr(CONTRACTS.agentId)} reputationScore={743} trustLevel="Elite" totalActions={47} isRevealed={revealed} onReveal={() => setRevealed(true)} />
            </div>
            <div className="agent-info-panel">
              <div className="card">
                <div className="card-header"><span className="card-title">Agent Profile</span><span className="card-icon">{Icons.cpu}</span></div>
                <div className="agent-detail-grid">
                  {[
                    { l: "Model", v: "Claude Sonnet 4" }, { l: "Framework", v: "LangChain 0.3" },
                    { l: "Network", v: "Mantle Sepolia (5003)" }, { l: "Cycle", v: "30 seconds" },
                    { l: "Standard", v: "ERC-8004" },
                  ].map((d) => (
                    <div key={d.l} className="agent-detail"><span className="agent-detail-label">{d.l}</span><span className="agent-detail-value">{d.v}</span></div>
                  ))}
                  <div className="agent-detail">
                    <span className="agent-detail-label">Status</span>
                    <span className="agent-detail-value" style={{ color: "#00e68a" }}><span className="network-dot" style={{ display: "inline-block", marginRight: 6 }} />Active</span>
                  </div>
                </div>

                {/* ─── On-Chain Identity ─────────────────── */}
                <div className="card-header" style={{ marginTop: 8 }}><span className="card-title">On-Chain Identity</span><span className="card-icon">{Icons.link}</span></div>
                <div className="agent-identity-grid">
                  <div className="agent-identity-row">
                    <span className="agent-identity-label">Agent ID</span>
                    <a href={`${CONTRACTS.explorerBase}/address/${CONTRACTS.agentSigner}`} target="_blank" rel="noopener noreferrer" className="agent-identity-addr">
                      {truncateAddr(CONTRACTS.agentId)}
                      <span className="addr-icon">{Icons.externalLink}</span>
                    </a>
                  </div>
                  <div className="agent-identity-row">
                    <span className="agent-identity-label">Signer</span>
                    <a href={`${CONTRACTS.explorerBase}/address/${CONTRACTS.agentSigner}`} target="_blank" rel="noopener noreferrer" className="agent-identity-addr">
                      {truncateAddr(CONTRACTS.agentSigner)}
                      <span className="addr-icon">{Icons.externalLink}</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Capabilities */}
          <div className="agent-section">
            <h3 className="agent-section-title">{Icons.layers}<span>Capabilities</span></h3>
            <div className="capabilities-grid">
              {CAPABILITIES.map((c) => (
                <div key={c.name} className={`capability-card ${c.active ? "" : "disabled"}`}>
                  <div className="capability-status">{c.active ? <span style={{ color: "#00e68a" }}>{Icons.checkCircle}</span> : <span style={{ color: "var(--text-muted)" }}>{Icons.clock}</span>}</div>
                  <div className="capability-info"><span className="capability-name">{c.name}</span><span className="capability-desc">{c.desc}</span></div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity */}
          <div className="agent-section">
            <h3 className="agent-section-title">{Icons.list}<span>Activity Log</span></h3>
            <div className="card">
              <div className="activity-log">
                {ACTIONS.map((e, i) => {
                  const logo = LOGO_MAP[e.asset];
                  return (
                    <div key={i} className="activity-entry">
                      <div className="activity-time">{e.time}</div>
                      <div className={`action-badge ${e.type === "HOLD" ? "hold" : e.type.startsWith("REDUCE") ? "reduce" : "exit"}`}>{e.type}</div>
                      <div className="activity-asset" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {logo && <img src={logo} alt={e.asset} style={{ width: '16px', height: '16px', objectFit: 'contain' }} />}
                        <span>{e.asset}</span>
                      </div>
                      <div className="activity-score">Score: {e.score}</div>
                      <div className="activity-result">{e.result}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Contracts */}
          <div className="agent-section">
            <h3 className="agent-section-title">{Icons.shield}<span>Deployed Contracts</span></h3>
            <div className="contract-grid">
              <div className="card contract-card">
                <div className="contract-card-header">
                  <span className="contract-name">SentinelExecutor</span>
                  <span className="contract-network-badge"><span className="network-dot" />Mantle Sepolia</span>
                </div>
                <span className="contract-purpose">Action execution with ECDSA verification, cooldown enforcement, and on-chain risk actions</span>
                <div className="contract-addr-row">
                  <span className="contract-addr-mono">{CONTRACTS.executor}</span>
                </div>
                <a href={`${CONTRACTS.explorerBase}/address/${CONTRACTS.executor}`} target="_blank" rel="noopener noreferrer" className="contract-link">View on Mantle Explorer {Icons.externalLink}</a>
              </div>
              <div className="card contract-card">
                <div className="contract-card-header">
                  <span className="contract-name">ERC8004Registry</span>
                  <span className="contract-network-badge"><span className="network-dot" />Mantle Sepolia</span>
                </div>
                <span className="contract-purpose">Agent identity & reputation ledger — records actions and computes on-chain reputation score</span>
                <div className="contract-addr-row">
                  <span className="contract-addr-mono">{CONTRACTS.registry}</span>
                </div>
                <a href={`${CONTRACTS.explorerBase}/address/${CONTRACTS.registry}`} target="_blank" rel="noopener noreferrer" className="contract-link">View on Mantle Explorer {Icons.externalLink}</a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
