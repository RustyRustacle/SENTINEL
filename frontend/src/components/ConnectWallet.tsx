"use client";

import React, { useState } from "react";
import { useAccount, useConnect, useDisconnect, useBalance, useChainId } from "wagmi";
import Icons from "./Icons";

export default function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { data: balance } = useBalance({ address });
  const [showDropdown, setShowDropdown] = useState(false);

  if (isConnected && address) {
    const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;
    const networkName = chainId === 5000 ? "Mantle" : chainId === 5003 ? "Mantle Sepolia" : `Chain ${chainId}`;

    return (
      <div className="wallet-connected" style={{ position: "relative" }}>
        <button
          className="wallet-btn connected"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <span className="wallet-dot" />
          <span className="wallet-addr">{shortAddr}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {showDropdown && (
          <div className="wallet-dropdown">
            <div className="wallet-dropdown-item wallet-info-row">
              <span className="wallet-info-label">Network</span>
              <span className="wallet-info-value">{networkName}</span>
            </div>
            <div className="wallet-dropdown-item wallet-info-row">
              <span className="wallet-info-label">Balance</span>
              <span className="wallet-info-value">
                {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : "..."}
              </span>
            </div>
            <div className="wallet-dropdown-divider" />
            <button
              className="wallet-dropdown-item wallet-disconnect"
              onClick={() => { disconnect(); setShowDropdown(false); }}
            >
              {Icons.xCircle}
              <span>Disconnect</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      className="wallet-btn"
      onClick={() => {
        const connector = connectors[0];
        if (connector) connect({ connector });
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
      <span>Connect Wallet</span>
    </button>
  );
}
