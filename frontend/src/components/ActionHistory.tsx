"use client";

import React from "react";
import Icons from "./Icons";

interface ActionRecord {
  id: string;
  timestamp: string;
  actionType: string;
  asset: string;
  riskScore: number;
  txHash: string;
  success: boolean;
}

interface ActionHistoryProps {
  actions: ActionRecord[];
}

function getActionBadgeClass(type: string): string {
  switch (type) {
    case "HOLD": return "hold";
    case "REDUCE_25":
    case "REDUCE_50": return "reduce";
    case "FULL_EXIT": return "exit";
    case "HEDGE": return "hedge";
    default: return "hold";
  }
}

const LOGO_MAP: Record<string, string> = {
  mETH: "/methlogo.png",
  USDY: "/usdylogo.svg",
  fBTC: "/fbtclogo.png",
};

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function ActionHistory({ actions }: ActionHistoryProps) {
  return (
    <div className="card history-card animate-in animate-delay-6">
      <div className="card-header">
        <span className="card-title">Action History</span>
        <span className="card-icon">{Icons.list}</span>
      </div>

      {actions.length === 0 ? (
        <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
          No actions recorded yet
        </div>
      ) : (
        <table className="history-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Action</th>
              <th>Asset</th>
              <th>Score</th>
              <th>TX</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {actions.map((action) => {
              const logo = LOGO_MAP[action.asset];
              return (
                <tr key={action.id}>
                  <td>{formatTimestamp(action.timestamp)}</td>
                  <td>
                    <span className={`action-badge ${getActionBadgeClass(action.actionType)}`}>
                      {action.actionType}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {logo && <img src={logo} alt={action.asset} style={{ width: '16px', height: '16px', objectFit: 'contain' }} />}
                      <span>{action.asset}</span>
                    </div>
                  </td>
                  <td>{action.riskScore}</td>
                <td>
                  <a
                    href={`https://explorer.mantle.xyz/tx/${action.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tx-link"
                  >
                    {action.txHash.slice(0, 8)}...{Icons.externalLink}
                  </a>
                </td>
                <td>
                  {action.success ? (
                    <span style={{ color: "#00e68a" }}>{Icons.checkCircle}</span>
                  ) : (
                    <span style={{ color: "#f03050" }}>{Icons.xCircle}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
