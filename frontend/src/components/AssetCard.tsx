"use client";

import React from "react";
import Icons from "./Icons";

interface AssetData {
  symbol: string;
  name: string;
  price: number;
  peg: number;
  deviation: number;
  change24h: number;
  riskLevel: "normal" | "warn" | "alert" | "critical";
}

interface AssetCardProps {
  asset: AssetData;
}

function formatPrice(price: number): string {
  if (price >= 1000) return "$" + price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return "$" + price.toFixed(4);
}

function formatDeviation(dev: number): string {
  const sign = dev >= 0 ? "+" : "";
  return sign + (dev * 100).toFixed(3) + "%";
}

function formatChange(change: number): string {
  const sign = change >= 0 ? "+" : "";
  return sign + change.toFixed(2) + "%";
}

const LOGO_MAP: Record<string, string> = {
  mETH: "/methlogo.png",
  USDY: "/usdylogo.svg",
  fBTC: "/fbtclogo.png",
};

export default function AssetCard({ asset }: AssetCardProps) {
  const logo = LOGO_MAP[asset.symbol];

  return (
    <div className="card asset-card">
      <div className="asset-top">
        <div className="asset-info">
          <div className="asset-icon">
            {logo ? (
              <img src={logo} alt={asset.symbol} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
            ) : (
              asset.symbol.charAt(0)
            )}
          </div>
          <div>
            <div className="asset-name">{asset.symbol}</div>
            <div className="asset-type">{asset.name}</div>
          </div>
        </div>
        <span className={`asset-badge ${asset.riskLevel}`}>
          {asset.riskLevel === "normal" ? "Stable" :
           asset.riskLevel === "warn" ? "Warning" :
           asset.riskLevel === "alert" ? "Alert" : "Critical"}
        </span>
      </div>

      <div className="asset-price">{formatPrice(asset.price)}</div>

      <hr className="asset-divider" />

      <div className="asset-row">
        <span className="asset-label">Peg Deviation</span>
        <span className={`asset-value ${asset.deviation >= 0 ? "" : "negative"}`}>
          {formatDeviation(asset.deviation)}
        </span>
      </div>
      <div className="asset-row">
        <span className="asset-label">24h Change</span>
        <span className={`asset-value ${asset.change24h >= 0 ? "positive" : "negative"}`}>
          {formatChange(asset.change24h)}
        </span>
      </div>
      <div className="asset-row">
        <span className="asset-label">Peg Target</span>
        <span className="asset-value">{formatPrice(asset.peg)}</span>
      </div>
    </div>
  );
}
