"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import Icons from "./Icons";

export default function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const [showDropdown, setShowDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent SSR hydration mismatch
  useEffect(() => { setMounted(true); }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return;
    const handler = () => setShowDropdown(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showDropdown]);

  if (!mounted) {
    return (
      <button className="wallet-btn" disabled>
        <span>Connect Wallet</span>
      </button>
    );
  }

  if (isConnected && address) {
    const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;

    return (
      <div className="wallet-connected" style={{ position: "relative" }}>
        <button
          className="wallet-btn connected"
          onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}
        >
          <span className="wallet-dot" />
          <span className="wallet-addr">{shortAddr}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {showDropdown && (
          <div className="wallet-dropdown" onClick={(e) => e.stopPropagation()}>
            <div className="wallet-dropdown-item wallet-info-row">
              <span className="wallet-info-label">Address</span>
              <span className="wallet-info-value">{shortAddr}</span>
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

  const handleConnect = () => {
    const metamask = connectors.find(c => c.id === "injected" || c.name === "MetaMask");
    const connector = metamask || connectors[0];
    if (connector) {
      connect({ connector });
    } else {
      window.open("https://metamask.io/download/", "_blank");
    }
  };

  return (
    <button
      className="wallet-btn"
      onClick={handleConnect}
      disabled={isPending}
    >
      {isPending ? (
        <>
          <svg className="wallet-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
          <span>Connect Wallet</span>
        </>
      )}
    </button>
  );
}
