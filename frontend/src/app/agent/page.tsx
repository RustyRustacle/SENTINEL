"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import SentinelBot from "@/components/SentinelBot";
import Icons from "@/components/Icons";

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
              <SentinelBot agentId="0x7a3f8c2e...sentinel-rwa-v1" reputationScore={743} trustLevel="Elite" totalActions={47} isRevealed={revealed} onReveal={() => setRevealed(true)} />
            </div>
            <div className="agent-info-panel">
              <div className="card">
                <div className="card-header"><span className="card-title">Agent Profile</span><span className="card-icon">{Icons.cpu}</span></div>
                <div className="agent-detail-grid">
                  {[
                    { l: "Model", v: "Claude Sonnet 4" }, { l: "Framework", v: "LangChain 0.3" },
                    { l: "Network", v: "Mantle (5000)" }, { l: "Cycle", v: "30 seconds" },
                    { l: "Standard", v: "ERC-8004" },
                  ].map((d) => (
                    <div key={d.l} className="agent-detail"><span className="agent-detail-label">{d.l}</span><span className="agent-detail-value">{d.v}</span></div>
                  ))}
                  <div className="agent-detail">
                    <span className="agent-detail-label">Status</span>
                    <span className="agent-detail-value" style={{ color: "#00e68a" }}><span className="network-dot" style={{ display: "inline-block", marginRight: 6 }} />Active</span>
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
                {ACTIONS.map((e, i) => (
                  <div key={i} className="activity-entry">
                    <div className="activity-time">{e.time}</div>
                    <div className={`action-badge ${e.type === "HOLD" ? "hold" : e.type.startsWith("REDUCE") ? "reduce" : "exit"}`}>{e.type}</div>
                    <div className="activity-asset">{e.asset}</div>
                    <div className="activity-score">Score: {e.score}</div>
                    <div className="activity-result">{e.result}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contracts */}
          <div className="agent-section">
            <h3 className="agent-section-title">{Icons.shield}<span>On-Chain Contracts</span></h3>
            <div className="contract-grid">
              <div className="card contract-card">
                <span className="contract-name">SentinelExecutor</span>
                <span className="contract-purpose">Action execution with ECDSA verification</span>
                <a href="https://explorer.mantle.xyz" target="_blank" rel="noopener noreferrer" className="contract-link">View on Explorer {Icons.externalLink}</a>
              </div>
              <div className="card contract-card">
                <span className="contract-name">ERC8004Registry</span>
                <span className="contract-purpose">Agent identity & reputation ledger</span>
                <a href="https://explorer.mantle.xyz" target="_blank" rel="noopener noreferrer" className="contract-link">View on Explorer {Icons.externalLink}</a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
