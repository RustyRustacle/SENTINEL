"use client";

import React from "react";
import Icons from "./Icons";

interface BreakdownSignal {
  name: string;
  value: number; // 0-100
  weight: string;
}

interface RiskBreakdownProps {
  signals: BreakdownSignal[];
}

function getBarColor(value: number): string {
  if (value <= 30) return "#00e68a";
  if (value <= 50) return "#f0c000";
  if (value <= 70) return "#f07000";
  return "#f03050";
}

export default function RiskBreakdown({ signals }: RiskBreakdownProps) {
  return (
    <div className="card breakdown-card animate-in animate-delay-5">
      <div className="card-header">
        <span className="card-title">Risk Breakdown</span>
        <span className="card-icon">{Icons.barChart}</span>
      </div>

      <div className="breakdown-list">
        {signals.map((signal) => (
          <div key={signal.name} className="breakdown-item">
            <div className="breakdown-item-header">
              <span className="breakdown-item-name">
                {signal.name}{" "}
                <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
                  ({signal.weight})
                </span>
              </span>
              <span
                className="breakdown-item-value"
                style={{ color: getBarColor(signal.value) }}
              >
                {signal.value.toFixed(1)}
              </span>
            </div>
            <div className="breakdown-bar-bg">
              <div
                className="breakdown-bar-fill"
                style={{
                  width: `${Math.min(signal.value, 100)}%`,
                  background: getBarColor(signal.value),
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
