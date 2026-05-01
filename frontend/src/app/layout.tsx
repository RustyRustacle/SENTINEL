import type { Metadata } from "next";
import { Providers } from "@/lib/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "SENTINEL — Autonomous RWA Risk Guardian",
  description:
    "Real-time autonomous risk monitoring and protection for Real-World Assets on Mantle Network. Powered by AI agents and ERC-8004 reputation.",
  keywords: [
    "Mantle",
    "RWA",
    "Risk Management",
    "AI Agent",
    "ERC-8004",
    "DeFi",
    "mETH",
    "USDY",
    "fBTC",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
