"use client";

import React, { useState, useEffect } from "react";
import Icons from "./Icons";

/* ═══════════════════════════════════════════════════════════════
   SENTINEL BOT — ERC-8004 Interactive Agent Identity
   A visual AI character with reveal animation and live stats
   ═══════════════════════════════════════════════════════════════ */

interface BotProps {
  agentId?: string;
  reputationScore?: number;
  trustLevel?: string;
  totalActions?: number;
  isRevealed?: boolean;
  onReveal?: () => void;
}

export default function SentinelBot({
  agentId = "0x7a3f...sentinel-rwa-v1",
  reputationScore = 500,
  trustLevel = "Trusted",
  totalActions = 0,
  isRevealed: externalRevealed,
  onReveal,
}: BotProps) {
  const [revealed, setRevealed] = useState(externalRevealed ?? false);
  const [glitching, setGlitching] = useState(false);
  const [eyePulse, setEyePulse] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [showStats, setShowStats] = useState(false);

  const fullIdentity = `SENTINEL-RWA-V1 // ERC-8004 AGENT`;

  useEffect(() => {
    if (externalRevealed !== undefined) setRevealed(externalRevealed);
  }, [externalRevealed]);

  // Eye pulse animation
  useEffect(() => {
    const interval = setInterval(() => {
      setEyePulse(true);
      setTimeout(() => setEyePulse(false), 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Typewriter effect on reveal
  useEffect(() => {
    if (!revealed) {
      setTypedText("");
      setShowStats(false);
      return;
    }
    setGlitching(true);
    setTimeout(() => setGlitching(false), 600);

    let i = 0;
    const timer = setInterval(() => {
      if (i <= fullIdentity.length) {
        setTypedText(fullIdentity.slice(0, i));
        i++;
      } else {
        clearInterval(timer);
        setTimeout(() => setShowStats(true), 300);
      }
    }, 40);
    return () => clearInterval(timer);
  }, [revealed]);

  const handleReveal = () => {
    setRevealed(true);
    onReveal?.();
  };

  const scoreColor =
    reputationScore >= 700 ? "#00e68a" :
    reputationScore >= 500 ? "#00f0c0" :
    reputationScore >= 300 ? "#f0c000" : "#f03050";

  return (
    <div className={`bot-container ${revealed ? "revealed" : ""} ${glitching ? "glitch" : ""}`}>
      {/* ─── Bot Avatar ──────────────────────────────── */}
      <div className="bot-avatar-wrapper">
        <div className={`bot-avatar ${revealed ? "active" : ""}`}>
          {/* Outer ring */}
          <svg className="bot-ring" viewBox="0 0 120 120">
            <circle
              cx="60" cy="60" r="56"
              fill="none"
              stroke="rgba(0,240,192,0.1)"
              strokeWidth="1"
            />
            <circle
              cx="60" cy="60" r="56"
              fill="none"
              stroke="#00f0c0"
              strokeWidth="1.5"
              strokeDasharray={`${revealed ? 352 : 80} 352`}
              strokeLinecap="round"
              className="bot-ring-progress"
            />
            {/* Data nodes around ring */}
            {[0, 60, 120, 180, 240, 300].map((deg, i) => (
              <circle
                key={i}
                cx={60 + 56 * Math.cos((deg * Math.PI) / 180)}
                cy={60 + 56 * Math.sin((deg * Math.PI) / 180)}
                r={revealed ? 2.5 : 1.5}
                fill={revealed ? "#00f0c0" : "rgba(0,240,192,0.3)"}
                className="bot-node"
              />
            ))}
          </svg>

          {/* Face */}
          <div className="bot-face">
            {/* Shield body */}
            <svg viewBox="0 0 80 80" className="bot-body-svg">
              <path
                d="M40 8L12 20v16c0 18.4 11.9 35.5 28 40 16.1-4.5 28-21.6 28-40V20L40 8z"
                fill="rgba(0,240,192,0.05)"
                stroke="#00f0c0"
                strokeWidth="1.2"
                className="bot-shield"
              />
              {/* Inner pattern */}
              <path
                d="M40 18L22 26v12c0 13 8.4 25 18 28 9.6-3 18-15 18-28V26L40 18z"
                fill="none"
                stroke="rgba(0,240,192,0.15)"
                strokeWidth="0.8"
              />
            </svg>

            {/* Eyes */}
            <div className="bot-eyes">
              <div className={`bot-eye left ${eyePulse ? "pulse" : ""} ${revealed ? "active" : ""}`}>
                <div className="bot-pupil" />
              </div>
              <div className={`bot-eye right ${eyePulse ? "pulse" : ""} ${revealed ? "active" : ""}`}>
                <div className="bot-pupil" />
              </div>
            </div>

            {/* Mouth / status indicator */}
            <div className={`bot-mouth ${revealed ? "active" : ""}`}>
              <div className="bot-mouth-line" />
            </div>
          </div>
        </div>

        {/* Status glow */}
        {revealed && <div className="bot-glow" />}
      </div>

      {/* ─── Identity Text ───────────────────────────── */}
      <div className="bot-identity">
        {!revealed ? (
          <>
            <div className="bot-unknown">IDENTITY LOCKED</div>
            <div className="bot-unknown-sub">ERC-8004 Agent</div>
            <button className="bot-reveal-btn" onClick={handleReveal}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <span>Reveal Identity</span>
            </button>
          </>
        ) : (
          <>
            <div className="bot-name-typed">
              <span className="bot-typed-text">{typedText}</span>
              <span className="bot-cursor">|</span>
            </div>
            <div className="bot-agent-id">{agentId}</div>
          </>
        )}
      </div>

      {/* ─── Stats (shown after reveal) ──────────────── */}
      {revealed && showStats && (
        <div className="bot-stats">
          <div className="bot-stat">
            <div className="bot-stat-value" style={{ color: scoreColor }}>
              {reputationScore}
            </div>
            <div className="bot-stat-label">Reputation</div>
            <div className="bot-stat-bar">
              <div
                className="bot-stat-bar-fill"
                style={{ width: `${(reputationScore / 1000) * 100}%`, background: scoreColor }}
              />
            </div>
          </div>
          <div className="bot-stat">
            <div className="bot-stat-value">{trustLevel}</div>
            <div className="bot-stat-label">Trust Level</div>
          </div>
          <div className="bot-stat">
            <div className="bot-stat-value">{totalActions}</div>
            <div className="bot-stat-label">Actions</div>
          </div>
          <div className="bot-stat">
            <div className="bot-stat-value bot-chain-badge">
              <span className="network-dot" />
              Mantle
            </div>
            <div className="bot-stat-label">Network</div>
          </div>
        </div>
      )}
    </div>
  );
}
