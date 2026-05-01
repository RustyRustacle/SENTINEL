"use client";

import React from "react";
import Icons from "./Icons";

interface ReputationProps {
  score: number;
  maxScore: number;
  successfulActions: number;
  failedActions: number;
  trustLevel: string;
  totalProtected: string;
}

export default function ReputationDisplay({
  score,
  maxScore,
  successfulActions,
  failedActions,
  trustLevel,
  totalProtected,
}: ReputationProps) {
  const percentage = (score / maxScore) * 100;

  return (
    <div className="card reputation-card animate-in animate-delay-2">
      <div className="card-header">
        <span className="card-title">ERC-8004 Reputation</span>
        <span className="card-icon">{Icons.award}</span>
      </div>

      <div className="reputation-content">
        <div className="reputation-score-block">
          <span className="reputation-score-value">{score}</span>
          <span className="reputation-score-max">/ {maxScore}</span>
        </div>

        <div className="reputation-details">
          <div className="reputation-trust-level">
            {Icons.checkCircle}
            <span>{trustLevel}</span>
          </div>

          <div className="reputation-bar-container">
            <div className="reputation-bar-bg">
              <div
                className="reputation-bar-fill"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          <div className="reputation-stats">
            <div className="reputation-stat">
              <span className="reputation-stat-value" style={{ color: "#00e68a" }}>
                {successfulActions}
              </span>
              <span className="reputation-stat-label">Successful</span>
            </div>
            <div className="reputation-stat">
              <span className="reputation-stat-value" style={{ color: "#f03050" }}>
                {failedActions}
              </span>
              <span className="reputation-stat-label">Failed</span>
            </div>
            <div className="reputation-stat">
              <span className="reputation-stat-value">{totalProtected}</span>
              <span className="reputation-stat-label">Protected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
