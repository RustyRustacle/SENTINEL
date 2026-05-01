"use client";

import { http, createConfig } from "wagmi";
import { mainnet } from "wagmi/chains";
import { injected } from "wagmi/connectors";

/* ─── Mantle chain definitions ─────────────────────────────── */
const mantle = {
  id: 5000,
  name: "Mantle",
  nativeCurrency: { name: "MNT", symbol: "MNT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.mantle.xyz"] },
  },
  blockExplorers: {
    default: { name: "Mantle Explorer", url: "https://explorer.mantle.xyz" },
  },
} as const;

const mantleSepolia = {
  id: 5003,
  name: "Mantle Sepolia",
  nativeCurrency: { name: "MNT", symbol: "MNT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.sepolia.mantle.xyz"] },
  },
  blockExplorers: {
    default: { name: "Mantle Explorer", url: "https://explorer.sepolia.mantle.xyz" },
  },
  testnet: true,
} as const;

export const config = createConfig({
  chains: [mantle, mantleSepolia],
  connectors: [injected()],
  transports: {
    [mantle.id]: http(),
    [mantleSepolia.id]: http(),
  },
  ssr: true,
});
