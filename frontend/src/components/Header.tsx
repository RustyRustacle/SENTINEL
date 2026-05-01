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
          <img src="/sentinelrwalogo.png" alt="Sentinel Logo" className="header-logo" width="32" height="32" />
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
