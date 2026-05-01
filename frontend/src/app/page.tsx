"use client";

import React, { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import SentinelBot from "@/components/SentinelBot";
import Icons from "@/components/Icons";

export default function HomePage() {
  const [botRevealed, setBotRevealed] = useState(false);

  return (
    <div className="app-wrapper">
      <Header />

      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-badge"><span className="network-dot" /><span>Built on Mantle Network</span></div>
            <h1 className="hero-title">Autonomous Risk<br /><span className="hero-accent">Guardian</span> for RWA</h1>
            <p className="hero-desc">AI-powered protection for your real-world asset positions. Monitor mETH, USDY, and fBTC in real-time. Execute protective actions autonomously. Build verifiable reputation on-chain via ERC-8004.</p>
            <div className="hero-actions">
              <Link href="/feature" className="btn-primary"><span>Launch App</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></Link>
              <a href="https://docs.mantle.xyz" target="_blank" rel="noopener noreferrer" className="btn-secondary">Documentation</a>
            </div>
          </div>
          <div className="hero-visual">
            <SentinelBot reputationScore={743} trustLevel="Elite" totalActions={47} isRevealed={botRevealed} onReveal={() => setBotRevealed(true)} />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-bar">
        <div className="stats-bar-inner">
          {[{ v: "$21.3M", l: "Capital Protected" }, { v: "47", l: "Actions Executed" }, { v: "743", l: "Reputation Score" }, { v: "30s", l: "Monitoring Cycle" }].map((s, i) => (
            <React.Fragment key={s.l}>{i > 0 && <div className="stat-bar-divider" />}<div className="stat-item"><span className="stat-item-value">{s.v}</span><span className="stat-item-label">{s.l}</span></div></React.Fragment>
          ))}
        </div>
      </section>

      {/* Problem */}
      <section className="section">
        <div className="section-inner">
          <div className="section-header"><span className="section-tag">The Problem</span><h2 className="section-title">RWA positions carry systemic risk —<br />without automated protection</h2></div>
          <div className="problem-grid">
            {[
              { icon: Icons.alertTriangle, color: "#f03050", title: "De-Peg Events", desc: "The Oct 2025 USDe de-peg triggered $500M–$1B in forced liquidations within minutes." },
              { icon: Icons.trendingDown, color: "#f0c000", title: "Liquidity Crises", desc: "Pool depth collapses and bid-ask spread explosions create cascading losses before humans can react." },
              { icon: Icons.layers, color: "#f07000", title: "Correlated Liquidations", desc: "Cross-asset correlation during stress events amplifies losses across entire RWA portfolios." },
            ].map((c) => (
              <div key={c.title} className="problem-card"><div className="problem-icon-wrap" style={{ color: c.color }}>{c.icon}</div><h3 className="problem-card-title">{c.title}</h3><p className="problem-card-desc">{c.desc}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section section-dark">
        <div className="section-inner">
          <div className="section-header"><span className="section-tag">How It Works</span><h2 className="section-title">Four-layer autonomous protection pipeline</h2></div>
          <div className="pipeline-grid">
            {[
              { n: "01", icon: Icons.activity, title: "Monitor", desc: "Continuous 30s cycles ingesting price feeds from Pyth, on-chain state from Mantle RPC, and macro data from FRED." },
              { n: "02", icon: Icons.cpu, title: "Evaluate", desc: "5-signal composite risk scoring: de-peg, liquidity, correlation, volatility, and TradFi macro." },
              { n: "03", icon: Icons.zap, title: "Decide", desc: "AI agent reasons through data using Claude, selecting optimal action: HOLD, REDUCE, EXIT, or HEDGE." },
              { n: "04", icon: Icons.shield, title: "Execute", desc: "Signed actions submitted to SentinelExecutor on Mantle. Recorded on-chain via ERC-8004." },
            ].map((s, i) => (
              <React.Fragment key={s.n}>{i > 0 && <div className="pipeline-connector" />}<div className="pipeline-step"><div className="pipeline-number">{s.n}</div><div className="pipeline-icon">{s.icon}</div><h3 className="pipeline-step-title">{s.title}</h3><p className="pipeline-step-desc">{s.desc}</p></div></React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage */}
      <section className="section">
        <div className="section-inner">
          <div className="section-header"><span className="section-tag">Coverage</span><h2 className="section-title">Native Mantle asset monitoring</h2></div>
          <div className="coverage-grid">
            {[
              { icon: "M", name: "mETH", desc: "Mantle Staked ETH — Liquid staking derivative", addr: "0xcDA8...Aa6E" },
              { icon: "U", name: "USDY", desc: "Ondo USD Yield — Tokenized T-bill stablecoin", addr: "0x5bE2...c5A6" },
              { icon: "F", name: "fBTC", desc: "Firebitcoin — Wrapped BTC on Mantle", addr: "0xC96d...6364" },
            ].map((a) => (
              <div key={a.name} className="coverage-card"><div className="coverage-icon">{a.icon}</div><div className="coverage-info"><h3 className="coverage-name">{a.name}</h3><p className="coverage-desc">{a.desc}</p></div><span className="coverage-addr">{a.addr}</span></div>
            ))}
          </div>
        </div>
      </section>

      {/* ERC-8004 */}
      <section className="section section-dark">
        <div className="section-inner">
          <div className="section-header"><span className="section-tag">ERC-8004</span><h2 className="section-title">Verifiable AI agent reputation on-chain</h2><p className="section-subtitle">Every action builds a permanent, auditable track record. Higher reputation unlocks greater autonomous capabilities.</p></div>
          <div className="trust-grid">
            {[
              { range: "0–300", level: "Probationary", cap: "$10K", color: "#f03050" },
              { range: "300–500", level: "Standard", cap: "$50K", color: "#f0c000" },
              { range: "500–700", level: "Trusted", cap: "$250K", color: "#00f0c0" },
              { range: "700–850", level: "Elite", cap: "$1M", color: "#00e68a" },
              { range: "850–1000", level: "Sovereign", cap: "Unlimited", color: "#a855f7" },
            ].map((t) => (
              <div key={t.level} className="trust-card"><div className="trust-score" style={{ color: t.color }}>{t.range}</div><div className="trust-level">{t.level}</div><div className="trust-cap"><span className="trust-cap-label">Max per action</span><span className="trust-cap-value">{t.cap}</span></div></div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section cta-section">
        <div className="section-inner" style={{ textAlign: "center" }}>
          <h2 className="section-title">Ready to protect your RWA positions?</h2>
          <p className="section-subtitle" style={{ maxWidth: 500, margin: "0 auto 32px" }}>Connect your wallet and launch the Sentinel monitoring dashboard.</p>
          <Link href="/feature" className="btn-primary btn-lg"><span>Launch Sentinel</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-left"><div className="footer-brand"><img src="/sentinelrwalogo.png" alt="Sentinel Logo" width="20" height="20" /><span className="footer-brand-name">SENTINEL</span></div><span className="footer-text">Mantle Turing Test Hackathon 2026 — AI x RWA Track</span></div>
          <div className="footer-links"><a href="https://docs.mantle.xyz" target="_blank" rel="noopener noreferrer" className="footer-link">Mantle Docs</a><a href="https://explorer.mantle.xyz" target="_blank" rel="noopener noreferrer" className="footer-link">Explorer</a><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="footer-link">GitHub</a></div>
        </div>
      </footer>
    </div>
  );
}
