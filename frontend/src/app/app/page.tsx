"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import Header from "@/components/Header";
import RiskGauge from "@/components/RiskGauge";
import AssetCard from "@/components/AssetCard";
import ReputationDisplay from "@/components/ReputationDisplay";
import RiskBreakdown from "@/components/RiskBreakdown";
import ActionHistory from "@/components/ActionHistory";
import Icons from "@/components/Icons";

/* ═══════════════════════════════════════════════════════════════
   DEMO DATA
   ═══════════════════════════════════════════════════════════════ */

type RiskLevel = "normal" | "warn" | "alert" | "critical";

interface AssetData {
  symbol: string;
  name: string;
  price: number;
  peg: number;
  deviation: number;
  change24h: number;
  riskLevel: RiskLevel;
}

interface SignalData {
  name: string;
  value: number;
  weight: string;
}

const INITIAL_RISK = 12;

const INITIAL_ASSETS: AssetData[] = [
  { symbol: "USDY", name: "Ondo USD Yield", price: 1.0002, peg: 1.0, deviation: 0.0002, change24h: 0.01, riskLevel: "normal" },
  { symbol: "mETH", name: "Mantle ETH", price: 3247.82, peg: 3245.0, deviation: 0.00087, change24h: 1.24, riskLevel: "normal" },
  { symbol: "fBTC", name: "Firebitcoin", price: 67842.5, peg: 67800.0, deviation: 0.00063, change24h: 0.45, riskLevel: "normal" },
];

const INITIAL_SIGNALS: SignalData[] = [
  { name: "De-peg Risk", value: 5.7, weight: "35%" },
  { name: "Liquidity Risk", value: 8.0, weight: "25%" },
  { name: "Correlation", value: 18.0, weight: "20%" },
  { name: "Volatility", value: 13.3, weight: "10%" },
  { name: "TradFi Macro", value: 20.0, weight: "10%" },
];

/* ═══════════════════════════════════════════════════════════════
   CRISIS FRAMES
   ═══════════════════════════════════════════════════════════════ */

interface CrisisFrame {
  risk: number;
  assets: AssetData[];
  signals: SignalData[];
  newAction?: any;
  reputation?: { score: number; successful: number; failed: number };
}

function generateCrisisFrames(): CrisisFrame[] {
  const frames: CrisisFrame[] = [];

  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    frames.push({
      risk: Math.round(12 + t * 23),
      assets: [
        { symbol: "USDY", name: "Ondo USD Yield", price: +(1.0002 - t * 0.004).toFixed(4), peg: 1.0, deviation: -(t * 0.004), change24h: -(t * 0.4), riskLevel: t > 0.5 ? "warn" : "normal" },
        { symbol: "mETH", name: "Mantle ETH", price: +(3247.82 - t * 80).toFixed(2), peg: 3245.0, deviation: -t * 0.012, change24h: -(t * 2.5), riskLevel: "normal" },
        { symbol: "fBTC", name: "Firebitcoin", price: +(67842.5 - t * 500).toFixed(2), peg: 67800.0, deviation: -t * 0.005, change24h: -(t * 0.8), riskLevel: "normal" },
      ],
      signals: [
        { name: "De-peg Risk", value: +(5.7 + t * 25), weight: "35%" },
        { name: "Liquidity Risk", value: +(8.0 + t * 15), weight: "25%" },
        { name: "Correlation", value: +(18.0 + t * 10), weight: "20%" },
        { name: "Volatility", value: +(13.3 + t * 20), weight: "10%" },
        { name: "TradFi Macro", value: +(20.0 + t * 15), weight: "10%" },
      ],
    });
  }

  frames.push({
    risk: 42,
    assets: [
      { symbol: "USDY", name: "Ondo USD Yield", price: 0.9935, peg: 1.0, deviation: -0.0065, change24h: -0.65, riskLevel: "warn" },
      { symbol: "mETH", name: "Mantle ETH", price: 3148.20, peg: 3245.0, deviation: -0.03, change24h: -3.1, riskLevel: "warn" },
      { symbol: "fBTC", name: "Firebitcoin", price: 66890.0, peg: 67800.0, deviation: -0.013, change24h: -1.4, riskLevel: "normal" },
    ],
    signals: [
      { name: "De-peg Risk", value: 42.0, weight: "35%" },
      { name: "Liquidity Risk", value: 35.0, weight: "25%" },
      { name: "Correlation", value: 38.0, weight: "20%" },
      { name: "Volatility", value: 45.0, weight: "10%" },
      { name: "TradFi Macro", value: 50.0, weight: "10%" },
    ],
    newAction: { id: "act-001", timestamp: new Date().toISOString(), actionType: "REDUCE_25", asset: "USDY", riskScore: 42, txHash: "0x7a3f8c2e1b9d0e5f4a6c8b7d3e2f1a0c9b8d7e6f", success: true },
    reputation: { score: 520, successful: 1, failed: 0 },
  });

  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    frames.push({
      risk: Math.round(48 + t * 24),
      assets: [
        { symbol: "USDY", name: "Ondo USD Yield", price: +(0.9935 - t * 0.015).toFixed(4), peg: 1.0, deviation: -(0.0065 + t * 0.015), change24h: -(0.65 + t * 1.5), riskLevel: t > 0.5 ? "alert" : "warn" },
        { symbol: "mETH", name: "Mantle ETH", price: +(3148.2 - t * 200).toFixed(2), peg: 3245.0, deviation: -(0.03 + t * 0.04), change24h: -(3.1 + t * 4), riskLevel: "warn" },
        { symbol: "fBTC", name: "Firebitcoin", price: +(66890 - t * 1500).toFixed(2), peg: 67800.0, deviation: -(0.013 + t * 0.02), change24h: -(1.4 + t * 2.2), riskLevel: t > 0.6 ? "warn" : "normal" },
      ],
      signals: [
        { name: "De-peg Risk", value: +(42 + t * 35), weight: "35%" },
        { name: "Liquidity Risk", value: +(35 + t * 30), weight: "25%" },
        { name: "Correlation", value: +(38 + t * 25), weight: "20%" },
        { name: "Volatility", value: +(45 + t * 30), weight: "10%" },
        { name: "TradFi Macro", value: +(50 + t * 15), weight: "10%" },
      ],
    });
  }

  frames.push({
    risk: 65,
    assets: [
      { symbol: "USDY", name: "Ondo USD Yield", price: 0.9755, peg: 1.0, deviation: -0.0245, change24h: -2.45, riskLevel: "alert" },
      { symbol: "mETH", name: "Mantle ETH", price: 2920.40, peg: 3245.0, deviation: -0.10, change24h: -8.0, riskLevel: "alert" },
      { symbol: "fBTC", name: "Firebitcoin", price: 64800.0, peg: 67800.0, deviation: -0.044, change24h: -4.5, riskLevel: "warn" },
    ],
    signals: [
      { name: "De-peg Risk", value: 70.0, weight: "35%" },
      { name: "Liquidity Risk", value: 62.0, weight: "25%" },
      { name: "Correlation", value: 58.0, weight: "20%" },
      { name: "Volatility", value: 72.0, weight: "10%" },
      { name: "TradFi Macro", value: 60.0, weight: "10%" },
    ],
    newAction: { id: "act-002", timestamp: new Date(Date.now() + 60000).toISOString(), actionType: "REDUCE_50", asset: "USDY", riskScore: 65, txHash: "0x2b4d6e8f0a1c3e5d7b9f0a2c4e6d8b0a1c3e5d7f", success: true },
    reputation: { score: 580, successful: 2, failed: 0 },
  });

  for (let i = 0; i < 4; i++) {
    const t = i / 3;
    frames.push({
      risk: Math.round(72 + t * 10),
      assets: [
        { symbol: "USDY", name: "Ondo USD Yield", price: +(0.9755 - t * 0.012).toFixed(4), peg: 1.0, deviation: -(0.0245 + t * 0.012), change24h: -(2.45 + t * 1.2), riskLevel: "critical" },
        { symbol: "mETH", name: "Mantle ETH", price: +(2920 - t * 150).toFixed(2), peg: 3245.0, deviation: -(0.10 + t * 0.03), change24h: -(8 + t * 3), riskLevel: "alert" },
        { symbol: "fBTC", name: "Firebitcoin", price: +(64800 - t * 800).toFixed(2), peg: 67800.0, deviation: -(0.044 + t * 0.01), change24h: -(4.5 + t * 1.5), riskLevel: "alert" },
      ],
      signals: [
        { name: "De-peg Risk", value: +(70 + t * 25), weight: "35%" },
        { name: "Liquidity Risk", value: +(62 + t * 20), weight: "25%" },
        { name: "Correlation", value: +(58 + t * 20), weight: "20%" },
        { name: "Volatility", value: +(72 + t * 18), weight: "10%" },
        { name: "TradFi Macro", value: +(60 + t * 20), weight: "10%" },
      ],
    });
  }

  frames.push({
    risk: 82,
    assets: [
      { symbol: "USDY", name: "Ondo USD Yield", price: 0.9650, peg: 1.0, deviation: -0.035, change24h: -3.5, riskLevel: "critical" },
      { symbol: "mETH", name: "Mantle ETH", price: 2780.0, peg: 3245.0, deviation: -0.143, change24h: -11.2, riskLevel: "critical" },
      { symbol: "fBTC", name: "Firebitcoin", price: 63200.0, peg: 67800.0, deviation: -0.068, change24h: -6.8, riskLevel: "alert" },
    ],
    signals: [
      { name: "De-peg Risk", value: 100.0, weight: "35%" },
      { name: "Liquidity Risk", value: 85.0, weight: "25%" },
      { name: "Correlation", value: 78.0, weight: "20%" },
      { name: "Volatility", value: 90.0, weight: "10%" },
      { name: "TradFi Macro", value: 80.0, weight: "10%" },
    ],
    newAction: { id: "act-003", timestamp: new Date(Date.now() + 120000).toISOString(), actionType: "FULL_EXIT", asset: "ALL", riskScore: 82, txHash: "0x9c1d3e5f7a2b4c6d8e0f1a3b5c7d9e0f2a4b6c8d", success: true },
    reputation: { score: 620, successful: 3, failed: 0 },
  });

  return frames;
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function DashboardPage() {
  const [riskScore, setRiskScore] = useState(INITIAL_RISK);
  const [assets, setAssets] = useState(INITIAL_ASSETS);
  const [signals, setSignals] = useState(INITIAL_SIGNALS);
  const [actions, setActions] = useState<any[]>([]);
  const [reputation, setReputation] = useState({ score: 500, successful: 0, failed: 0 });
  const [isSimulating, setIsSimulating] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const frameRef = useRef(0);
  const framesRef = useRef<CrisisFrame[]>([]);

  const startSimulation = useCallback(() => {
    framesRef.current = generateCrisisFrames();
    frameRef.current = 0;
    setIsSimulating(true);
    setCycleCount(0);
    timerRef.current = setInterval(() => {
      const frames = framesRef.current;
      const idx = frameRef.current;
      if (idx >= frames.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsSimulating(false);
        return;
      }
      const frame = frames[idx];
      setRiskScore(frame.risk);
      setAssets(frame.assets);
      setSignals(frame.signals);
      setCycleCount(idx + 1);
      if (frame.newAction) setActions((prev) => [frame.newAction!, ...prev]);
      if (frame.reputation) setReputation(frame.reputation);
      frameRef.current++;
    }, 800);
  }, []);

  const resetDashboard = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsSimulating(false);
    setRiskScore(INITIAL_RISK);
    setAssets(INITIAL_ASSETS);
    setSignals(INITIAL_SIGNALS);
    setActions([]);
    setReputation({ score: 500, successful: 0, failed: 0 });
    setCycleCount(0);
    frameRef.current = 0;
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return (
    <div className="app-wrapper">
      <Header />
      <main className="main-content">
        <div className="simulate-section animate-in">
          <div className="simulate-info">
            <span className="simulate-title">Crisis Simulation</span>
            <span className="simulate-desc">
              Replay the Oct 2025 USDe de-peg event to see Sentinel in action
              {isSimulating && ` — Cycle ${cycleCount}`}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <button className={`btn-simulate ${isSimulating ? "running" : ""}`} onClick={isSimulating ? resetDashboard : startSimulation}>
              {isSimulating ? Icons.pause : Icons.play}
              <span>{isSimulating ? "Stop" : "Simulate Crisis"}</span>
            </button>
            {!isSimulating && actions.length > 0 && (
              <button className="btn-reset" onClick={resetDashboard}>{Icons.refresh}</button>
            )}
          </div>
        </div>

        <div className="dashboard-grid">
          <RiskGauge score={riskScore} />
          <ReputationDisplay
            score={reputation.score} maxScore={1000}
            successfulActions={reputation.successful} failedActions={reputation.failed}
            trustLevel={reputation.score < 300 ? "Probationary" : reputation.score < 500 ? "Standard" : reputation.score < 700 ? "Trusted" : reputation.score < 850 ? "Elite" : "Sovereign"}
            totalProtected={reputation.successful > 0 ? `$${(reputation.successful * 21300).toLocaleString()}` : "$0"}
          />
          <div className="stats-row">
            <div className="card stat-card animate-in animate-delay-3">
              <div className="card-header">
                <span className="card-title">Monitoring Cycle</span>
                <span className="card-icon">{Icons.clock}</span>
              </div>
              <span className="stat-value">{cycleCount}</span>
              <span className="stat-label">30s interval</span>
            </div>
            <div className="card stat-card animate-in animate-delay-3">
              <div className="card-header">
                <span className="card-title">Capital Saved</span>
                <span className="card-icon">{Icons.trendingUp}</span>
              </div>
              <span className="stat-value" style={{ color: reputation.successful > 0 ? "#00e68a" : undefined }}>
                {reputation.successful > 0 ? `$${(reputation.successful * 21300).toLocaleString()}` : "$0"}
              </span>
              <span className="stat-label">vs unprotected</span>
            </div>
          </div>
          <div className="assets-section animate-in animate-delay-4">
            <div className="assets-grid">
              {assets.map((asset) => (<AssetCard key={asset.symbol} asset={asset} />))}
            </div>
          </div>
          <RiskBreakdown signals={signals} />
          <ActionHistory actions={actions} />
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
