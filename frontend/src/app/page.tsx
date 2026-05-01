"use client";

import React, { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import SentinelBot from "@/components/SentinelBot";
import Icons from "@/components/Icons";

/* ═══════════════════════════════════════════════════════════════
   SENTINEL — Landing Page (Company Profile)
   Minimalist, Mantle ecosystem style
   ═══════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  const [botRevealed, setBotRevealed] = useState(false);

  return (
    <div className="app-wrapper">
      <Header />

      {/* ─── Hero Section ─────────────────────────────────── */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="network-dot" />
              <span>Built on Mantle Network</span>
            </div>
            <h1 className="hero-title">
              Autonomous Risk
              <br />
              <span className="hero-accent">Guardian</span> for RWA
            </h1>
            <p className="hero-desc">
              AI-powered protection for your real-world asset positions.
              Monitor mETH, USDY, and fBTC in real-time. Execute protective
              actions autonomously. Build verifiable reputation on-chain
              via ERC-8004.
            </p>
            <div className="hero-actions">
              <Link href="/app" className="btn-primary">
                <span>Launch App</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              <a href="https://docs.mantle.xyz" target="_blank" rel="noopener noreferrer" className="btn-secondary">
                Documentation
              </a>
            </div>
          </div>

          <div className="hero-visual">
            <SentinelBot
              reputationScore={743}
              trustLevel="Elite"
              totalActions={47}
              isRevealed={botRevealed}
              onReveal={() => setBotRevealed(true)}
            />
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ────────────────────────────────────── */}
      <section className="stats-bar">
        <div className="stats-bar-inner">
          <div className="stat-item animate-in animate-delay-1">
            <span className="stat-item-value">$21.3M</span>
            <span className="stat-item-label">Capital Protected</span>
          </div>
          <div className="stat-bar-divider" />
          <div className="stat-item animate-in animate-delay-2">
            <span className="stat-item-value">47</span>
            <span className="stat-item-label">Actions Executed</span>
          </div>
          <div className="stat-bar-divider" />
          <div className="stat-item animate-in animate-delay-3">
            <span className="stat-item-value">743</span>
            <span className="stat-item-label">Reputation Score</span>
          </div>
          <div className="stat-bar-divider" />
          <div className="stat-item animate-in animate-delay-4">
            <span className="stat-item-value">30s</span>
            <span className="stat-item-label">Monitoring Cycle</span>
          </div>
        </div>
      </section>

      {/* ─── Problem Section ──────────────────────────────── */}
      <section className="section">
        <div className="section-inner">
          <div className="section-header">
            <span className="section-tag">The Problem</span>
            <h2 className="section-title">
              RWA positions carry systemic risk —<br />
              without automated protection
            </h2>
          </div>
          <div className="problem-grid">
            <div className="problem-card">
              <div className="problem-icon-wrap" style={{ color: "#f03050" }}>
                {Icons.alertTriangle}
              </div>
              <h3 className="problem-card-title">De-Peg Events</h3>
              <p className="problem-card-desc">
                The Oct 2025 USDe de-peg triggered $500M–$1B in forced liquidations within minutes. No autonomous guardian existed.
              </p>
            </div>
            <div className="problem-card">
              <div className="problem-icon-wrap" style={{ color: "#f0c000" }}>
                {Icons.trendingDown}
              </div>
              <h3 className="problem-card-title">Liquidity Crises</h3>
              <p className="problem-card-desc">
                Pool depth collapses and bid-ask spread explosions create cascading losses before humans can react.
              </p>
            </div>
            <div className="problem-card">
              <div className="problem-icon-wrap" style={{ color: "#f07000" }}>
                {Icons.layers}
              </div>
              <h3 className="problem-card-title">Correlated Liquidations</h3>
              <p className="problem-card-desc">
                Cross-asset correlation during stress events amplifies losses across entire RWA portfolios simultaneously.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────────── */}
      <section className="section section-dark">
        <div className="section-inner">
          <div className="section-header">
            <span className="section-tag">How It Works</span>
            <h2 className="section-title">
              Four-layer autonomous<br />protection pipeline
            </h2>
          </div>
          <div className="pipeline-grid">
            <div className="pipeline-step">
              <div className="pipeline-number">01</div>
              <div className="pipeline-icon">{Icons.activity}</div>
              <h3 className="pipeline-step-title">Monitor</h3>
              <p className="pipeline-step-desc">
                Continuous 30-second cycles ingesting price feeds from Pyth, on-chain state from Mantle RPC, and macro data from FRED.
              </p>
            </div>
            <div className="pipeline-connector" />
            <div className="pipeline-step">
              <div className="pipeline-number">02</div>
              <div className="pipeline-icon">{Icons.cpu}</div>
              <h3 className="pipeline-step-title">Evaluate</h3>
              <p className="pipeline-step-desc">
                5-signal composite risk scoring: de-peg, liquidity, correlation, volatility, and TradFi macro — weighted and normalized to 0–100.
              </p>
            </div>
            <div className="pipeline-connector" />
            <div className="pipeline-step">
              <div className="pipeline-number">03</div>
              <div className="pipeline-icon">{Icons.zap}</div>
              <h3 className="pipeline-step-title">Decide</h3>
              <p className="pipeline-step-desc">
                AI agent reasons through data using Claude, selecting the optimal action: HOLD, REDUCE, EXIT, or HEDGE — proportional to risk.
              </p>
            </div>
            <div className="pipeline-connector" />
            <div className="pipeline-step">
              <div className="pipeline-number">04</div>
              <div className="pipeline-icon">{Icons.shield}</div>
              <h3 className="pipeline-step-title">Execute</h3>
              <p className="pipeline-step-desc">
                Signed actions submitted to SentinelExecutor on Mantle. Every action recorded on-chain via ERC-8004 reputation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Assets Monitored ─────────────────────────────── */}
      <section className="section">
        <div className="section-inner">
          <div className="section-header">
            <span className="section-tag">Coverage</span>
            <h2 className="section-title">Native Mantle asset monitoring</h2>
          </div>
          <div className="coverage-grid">
            <div className="coverage-card">
              <div className="coverage-icon">M</div>
              <div className="coverage-info">
                <h3 className="coverage-name">mETH</h3>
                <p className="coverage-desc">Mantle Staked ETH — Liquid staking derivative pegged to ETH</p>
              </div>
              <span className="coverage-addr">0xcDA8...Aa6E</span>
            </div>
            <div className="coverage-card">
              <div className="coverage-icon">U</div>
              <div className="coverage-info">
                <h3 className="coverage-name">USDY</h3>
                <p className="coverage-desc">Ondo USD Yield — Tokenized T-bill yield bearing stablecoin</p>
              </div>
              <span className="coverage-addr">0x5bE2...c5A6</span>
            </div>
            <div className="coverage-card">
              <div className="coverage-icon">F</div>
              <div className="coverage-info">
                <h3 className="coverage-name">fBTC</h3>
                <p className="coverage-desc">Firebitcoin — Wrapped BTC on Mantle Network</p>
              </div>
              <span className="coverage-addr">0xC96d...6364</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ERC-8004 Section ─────────────────────────────── */}
      <section className="section section-dark">
        <div className="section-inner">
          <div className="section-header">
            <span className="section-tag">ERC-8004</span>
            <h2 className="section-title">
              Verifiable AI agent reputation<br />on-chain
            </h2>
            <p className="section-subtitle">
              Every action builds a permanent, auditable track record.
              Higher reputation unlocks greater autonomous capabilities.
            </p>
          </div>
          <div className="trust-grid">
            {[
              { range: "0 – 300", level: "Probationary", cap: "$10K", color: "#f03050" },
              { range: "300 – 500", level: "Standard", cap: "$50K", color: "#f0c000" },
              { range: "500 – 700", level: "Trusted", cap: "$250K", color: "#00f0c0" },
              { range: "700 – 850", level: "Elite", cap: "$1M", color: "#00e68a" },
              { range: "850 – 1000", level: "Sovereign", cap: "Unlimited", color: "#a855f7" },
            ].map((tier) => (
              <div key={tier.level} className="trust-card">
                <div className="trust-score" style={{ color: tier.color }}>{tier.range}</div>
                <div className="trust-level">{tier.level}</div>
                <div className="trust-cap">
                  <span className="trust-cap-label">Max per action</span>
                  <span className="trust-cap-value">{tier.cap}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ──────────────────────────────────── */}
      <section className="section cta-section">
        <div className="section-inner" style={{ textAlign: "center" }}>
          <h2 className="section-title">Ready to protect your RWA positions?</h2>
          <p className="section-subtitle" style={{ maxWidth: 500, margin: "0 auto 32px" }}>
            Launch the Sentinel dashboard to monitor your portfolio in real-time
            and see autonomous protection in action.
          </p>
          <Link href="/app" className="btn-primary btn-lg">
            <span>Launch Sentinel</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────── */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-left">
            <div className="footer-brand">
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                <path d="M16 2L4 8v8c0 7.2 5.12 13.92 12 16 6.88-2.08 12-8.8 12-16V8L16 2z" stroke="#00f0c0" strokeWidth="1.5" fill="none" />
              </svg>
              <span className="footer-brand-name">SENTINEL</span>
            </div>
            <span className="footer-text">
              Mantle Turing Test Hackathon 2026 — AI x RWA Track
            </span>
          </div>
          <div className="footer-links">
            <a href="https://docs.mantle.xyz" target="_blank" rel="noopener noreferrer" className="footer-link">Mantle Docs</a>
            <a href="https://explorer.mantle.xyz" target="_blank" rel="noopener noreferrer" className="footer-link">Explorer</a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="footer-link">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
