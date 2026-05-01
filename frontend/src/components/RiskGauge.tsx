"use client";

import React, { useEffect, useRef } from "react";
import Icons from "./Icons";

interface RiskGaugeProps {
  score: number; // 0-100
}

function getColor(score: number): string {
  if (score <= 30) return "#00e68a";
  if (score <= 50) return "#f0c000";
  if (score <= 70) return "#f07000";
  if (score <= 85) return "#f03050";
  return "#8b00ff";
}

function getLevel(score: number): string {
  if (score <= 30) return "GREEN";
  if (score <= 50) return "YELLOW";
  if (score <= 70) return "ORANGE";
  if (score <= 85) return "RED";
  return "BLACK";
}

function getLevelClass(score: number): string {
  if (score <= 30) return "green";
  if (score <= 50) return "yellow";
  if (score <= 70) return "orange";
  if (score <= 85) return "red";
  return "black";
}

function getLevelLabel(score: number): string {
  if (score <= 30) return "Normal";
  if (score <= 50) return "Elevated";
  if (score <= 70) return "High Risk";
  if (score <= 85) return "Critical";
  return "Systemic Crisis";
}

export default function RiskGauge({ score }: RiskGaugeProps) {
  const radius = 85;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(score / 100, 1);
  const dashOffset = circumference * (1 - progress);
  const color = getColor(score);

  return (
    <div className="card risk-gauge-card animate-in animate-delay-1">
      <div className="card-header">
        <span className="card-title">Risk Score</span>
        <span className="card-icon">{Icons.shield}</span>
      </div>

      <div className="gauge-container">
        <svg className="gauge-svg" viewBox="0 0 200 200">
          <circle className="gauge-bg" cx="100" cy="100" r={radius} />
          <circle
            className="gauge-fill"
            cx="100"
            cy="100"
            r={radius}
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="gauge-center">
          <span className="gauge-value" style={{ color }}>
            {score}
          </span>
          <span className="gauge-label">/ 100</span>
        </div>
      </div>

      <div className={`gauge-status ${getLevelClass(score)}`}>
        {Icons.activity}
        <span>{getLevelLabel(score)}</span>
      </div>
    </div>
  );
}
