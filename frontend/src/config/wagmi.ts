"use client";

import { http, createConfig } from "wagmi";
import { mainnet, sepolia, localhost } from "wagmi/chains";
import { injected } from "wagmi/connectors";

// Custom MemeCore chain (update when available)
export const memecore = {
  id: 31337, // Using localhost ID for now
  name: "MemeCore",
  nativeCurrency: {
    decimals: 18,
    name: "MEME",
    symbol: "MEME",
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"], // Anvil local
    },
  },
  blockExplorers: {
    default: {
      name: "MemeCore Explorer",
      url: "https://explorer.memecore.com",
    },
  },
} as const;

export const config = createConfig({
  chains: [memecore, localhost, sepolia, mainnet],
  connectors: [injected()],
  transports: {
    [memecore.id]: http(),
    [localhost.id]: http(),
    [sepolia.id]: http(),
    [mainnet.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
