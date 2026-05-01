"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import SentinelBot from "@/components/SentinelBot";
import Icons from "@/components/Icons";

/* ═══════════════════════════════════════════════════════════════
   AGENT PAGE — Interactive ERC-8004 Identity
   ═══════════════════════════════════════════════════════════════ */

const ACTION_LOG = [
  { time: "2 min ago", type: "FULL_EXIT", asset: "USDY", score: 82, result: "Protected $21,300" },
  { time: "4 min ago", type: "REDUCE_50", asset: "USDY", score: 65, result: "Reduced 50% exposure" },
  { time: "8 min ago", type: "REDUCE_25", asset: "mETH", score: 42, result: "Reduced 25% exposure" },
  { time: "35 min ago", type: "HOLD", asset: "ALL", score: 12, result: "No action needed" },
  { time: "1h ago", type: "HOLD", asset: "ALL", score: 8, result: "No action needed" },
];

const CAPABILITIES = [
  { name: "Multi-source data ingestion", desc: "Pyth, RedStone, Mantle RPC, FRED API", active: true },
  { name: "5-signal risk scoring", desc: "De-peg, liquidity, correlation, volatility, TradFi", active: true },
  { name: "Autonomous execution", desc: "HOLD, REDUCE, EXIT, HEDGE via SentinelExecutor", active: true },
  { name: "ERC-8004 reputation", desc: "On-chain action recording & scoring", active: true },
  { name: "Telegram alerts", desc: "Real-time notifications to operators", active: true },
  { name: "Cross-chain monitoring", desc: "Mantle + Ethereum mainnet coverage", active: false },
];

export default function AgentPage() {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="app-wrapper">
      <Header />

      <main className="main-content">
        <div className="agent-page">
          {/* ─── Bot Section ─────────────────────────────── */}
          <div className="agent-hero">
            <div className="agent-bot-section">
              <SentinelBot
                agentId="0x7a3f8c2e...sentinel-rwa-v1"
                reputationScore={743}
                trustLevel="Elite"
                totalActions={47}
                isRevealed={revealed}
                onReveal={() => setRevealed(true)}
              />
            </div>

            {/* ─── Agent Info Panel ──────────────────────── */}
            <div className="agent-info-panel">
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Agent Profile</span>
                  <span className="card-icon">{Icons.cpu}</span>
                </div>

                <div className="agent-detail-grid">
                  <div className="agent-detail">
                    <span className="agent-detail-label">Model</span>
                    <span className="agent-detail-value">Claude Sonnet 4</span>
                  </div>
                  <div className="agent-detail">
                    <span className="agent-detail-label">Framework</span>
                    <span className="agent-detail-value">LangChain 0.3</span>
                  </div>
                  <div className="agent-detail">
                    <span className="agent-detail-label">Network</span>
                    <span className="agent-detail-value">Mantle (5000)</span>
                  </div>
                  <div className="agent-detail">
                    <span className="agent-detail-label">Cycle</span>
                    <span className="agent-detail-value">30 seconds</span>
                  </div>
                  <div className="agent-detail">
                    <span className="agent-detail-label">Standard</span>
                    <span className="agent-detail-value">ERC-8004</span>
                  </div>
                  <div className="agent-detail">
                    <span className="agent-detail-label">Status</span>
                    <span className="agent-detail-value" style={{ color: "#00e68a" }}>
                      <span className="network-dot" style={{ display: "inline-block", marginRight: 6 }} />
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Capabilities ────────────────────────────── */}
          <div className="agent-section">
            <h3 className="agent-section-title">
              {Icons.layers}
              <span>Capabilities</span>
            </h3>
            <div className="capabilities-grid">
              {CAPABILITIES.map((cap) => (
                <div key={cap.name} className={`capability-card ${cap.active ? "" : "disabled"}`}>
                  <div className="capability-status">
                    {cap.active ? (
                      <span style={{ color: "#00e68a" }}>{Icons.checkCircle}</span>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>{Icons.clock}</span>
                    )}
                  </div>
                  <div className="capability-info">
                    <span className="capability-name">{cap.name}</span>
                    <span className="capability-desc">{cap.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Recent Activity Log ─────────────────────── */}
          <div className="agent-section">
            <h3 className="agent-section-title">
              {Icons.list}
              <span>Activity Log</span>
            </h3>
            <div className="card">
              <div className="activity-log">
                {ACTION_LOG.map((entry, i) => (
                  <div key={i} className="activity-entry">
                    <div className="activity-time">{entry.time}</div>
                    <div className={`action-badge ${
                      entry.type === "HOLD" ? "hold" :
                      entry.type.startsWith("REDUCE") ? "reduce" :
                      entry.type === "FULL_EXIT" ? "exit" : "hedge"
                    }`}>{entry.type}</div>
                    <div className="activity-asset">{entry.asset}</div>
                    <div className="activity-score">Score: {entry.score}</div>
                    <div className="activity-result">{entry.result}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Contract Info ────────────────────────────── */}
          <div className="agent-section">
            <h3 className="agent-section-title">
              {Icons.shield}
              <span>On-Chain Contracts</span>
            </h3>
            <div className="contract-grid">
              <div className="card contract-card">
                <span className="contract-name">SentinelExecutor</span>
                <span className="contract-purpose">Action execution with ECDSA verification</span>
                <a href="https://explorer.mantle.xyz" target="_blank" rel="noopener noreferrer" className="contract-link">
                  View on Explorer {Icons.externalLink}
                </a>
              </div>
              <div className="card contract-card">
                <span className="contract-name">ERC8004Registry</span>
                <span className="contract-purpose">Agent identity & reputation ledger</span>
                <a href="https://explorer.mantle.xyz" target="_blank" rel="noopener noreferrer" className="contract-link">
                  View on Explorer {Icons.externalLink}
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <span className="footer-text">SENTINEL v1.0 — Mantle Turing Test Hackathon 2026</span>
          <div className="footer-links">
            <a href="https://docs.mantle.xyz" target="_blank" rel="noopener noreferrer" className="footer-link">Mantle Docs</a>
            <a href="https://explorer.mantle.xyz" target="_blank" rel="noopener noreferrer" className="footer-link">Explorer</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
