"use client";

import React from "react";
import { useAccount, useConnect } from "wagmi";
import Header from "@/components/Header";
import RiskGauge from "@/components/RiskGauge";
import AssetCard from "@/components/AssetCard";
import ReputationDisplay from "@/components/ReputationDisplay";
import RiskBreakdown from "@/components/RiskBreakdown";
import ActionHistory from "@/components/ActionHistory";
import Icons from "@/components/Icons";
import { useCrisisSimulation } from "@/lib/useCrisisSimulation";

export default function FeaturePage() {
  const { isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const sim = useCrisisSimulation();

  const handleConnect = () => {
    const c = connectors.find(c => c.id === "injected" || c.name === "MetaMask") || connectors[0];
    if (c) connect({ connector: c });
  };

  return (
    <div className="app-wrapper">
      <Header />
      <main className="main-content">
        {!isConnected ? (
          /* ─── Wallet Gate ────────────────────────────── */
          <div className="gate-container">
            <div className="gate-card">
              <div className="gate-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </div>
              <h2 className="gate-title">Connect Your Wallet</h2>
              <p className="gate-desc">
                Connect your wallet to access the Sentinel monitoring dashboard,
                crisis simulation, and real-time risk analysis.
              </p>
              <button className="btn-primary btn-lg" onClick={handleConnect} disabled={isPending}>
                {isPending ? (
                  <><svg className="wallet-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg><span>Connecting...</span></>
                ) : (
                  <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg><span>Connect Wallet</span></>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* ─── Dashboard ─────────────────────────────── */
          <>
            <div className="simulate-section animate-in">
              <div className="simulate-info">
                <span className="simulate-title">Crisis Simulation</span>
                <span className="simulate-desc">Replay the Oct 2025 USDe de-peg event to see Sentinel in action{sim.running && ` — Cycle ${sim.cycle}`}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <button className={`btn-simulate ${sim.running ? "running" : ""}`} onClick={sim.running ? sim.reset : sim.start}>
                  {sim.running ? Icons.pause : Icons.play}<span>{sim.running ? "Stop" : "Simulate Crisis"}</span>
                </button>
                {!sim.running && sim.actions.length > 0 && <button className="btn-reset" onClick={sim.reset}>{Icons.refresh}</button>}
              </div>
            </div>

            <div className="dashboard-grid">
              <RiskGauge score={sim.risk} />
              <ReputationDisplay score={sim.rep.score} maxScore={1000} successfulActions={sim.rep.successful} failedActions={sim.rep.failed} trustLevel={sim.rep.score < 300 ? "Probationary" : sim.rep.score < 500 ? "Standard" : sim.rep.score < 700 ? "Trusted" : sim.rep.score < 850 ? "Elite" : "Sovereign"} totalProtected={sim.rep.successful > 0 ? `$${(sim.rep.successful * 21300).toLocaleString()}` : "$0"} />
              <div className="stats-row">
                <div className="card stat-card animate-in animate-delay-3">
                  <div className="card-header"><span className="card-title">Monitoring Cycle</span><span className="card-icon">{Icons.clock}</span></div>
                  <span className="stat-value">{sim.cycle}</span><span className="stat-label">30s interval</span>
                </div>
                <div className="card stat-card animate-in animate-delay-3">
                  <div className="card-header"><span className="card-title">Capital Saved</span><span className="card-icon">{Icons.trendingUp}</span></div>
                  <span className="stat-value" style={{ color: sim.rep.successful > 0 ? "#00e68a" : undefined }}>{sim.rep.successful > 0 ? `$${(sim.rep.successful * 21300).toLocaleString()}` : "$0"}</span><span className="stat-label">vs unprotected</span>
                </div>
              </div>
              <div className="assets-section animate-in animate-delay-4"><div className="assets-grid">{sim.assets.map((a) => <AssetCard key={a.symbol} asset={a} />)}</div></div>
              <RiskBreakdown signals={sim.signals} />
              <ActionHistory actions={sim.actions} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
