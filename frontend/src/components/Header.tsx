"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ConnectWallet from "./ConnectWallet";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="header">
      <div className="header-inner">
        <Link href="/" className="header-brand">
          <svg className="header-logo" viewBox="0 0 32 32" fill="none">
            <path d="M16 2L4 8v8c0 7.2 5.12 13.92 12 16 6.88-2.08 12-8.8 12-16V8L16 2z" stroke="#00f0c0" strokeWidth="1.5" fill="none" />
            <path d="M16 7l-7 3.5v5c0 4.5 3.2 8.7 7 10 3.8-1.3 7-5.5 7-10v-5L16 7z" fill="rgba(0,240,192,0.1)" stroke="#00f0c0" strokeWidth="1" />
            <text x="16" y="19" textAnchor="middle" fill="#00f0c0" fontSize="9" fontWeight="700" fontFamily="Inter, sans-serif">S</text>
          </svg>
          <span className="header-title">SENTINEL</span>
        </Link>

        <nav className="header-nav">
          <Link href="/" className={`header-nav-link ${pathname === "/" ? "active" : ""}`}>Sentinel</Link>
          <Link href="/feature" className={`header-nav-link ${pathname === "/feature" ? "active" : ""}`}>Feature</Link>
          <Link href="/agent" className={`header-nav-link ${pathname === "/agent" ? "active" : ""}`}>Agent</Link>
        </nav>

        <ConnectWallet />
      </div>
    </header>
  );
}
