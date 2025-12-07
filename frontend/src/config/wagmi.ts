"use client";

import { http, createConfig } from "wagmi";
import { mainnet, sepolia, localhost } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { defineChain } from "viem";

// MemeCore Mainnet
export const memecoreMainnet = defineChain({
  id: 4352,
  name: "MemeCore",
  nativeCurrency: {
    decimals: 18,
    name: "M",
    symbol: "M",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.memecore.net/"],
      webSocket: ["wss://ws.memecore.net"],
    },
  },
  blockExplorers: {
    default: {
      name: "MemeCore Scan",
      url: "https://memecorescan.io",
    },
  },
});

// MemeCore Formicarium Testnet
export const memecoreTestnet = defineChain({
  id: 43521,
  name: "Formicarium Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "M",
    symbol: "M",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.formicarium.memecore.net"],
      webSocket: ["wss://ws.formicarium.memecore.net"],
    },
  },
  blockExplorers: {
    default: {
      name: "Formicarium Explorer",
      url: "https://formicarium.memecorescan.io",
    },
  },
  testnet: true,
});

// Local Anvil for development
export const localAnvil = defineChain({
  id: 31337,
  name: "Local Anvil",
  nativeCurrency: {
    decimals: 18,
    name: "ETH",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
    },
  },
});

export const config = createConfig({
  chains: [memecoreTestnet, memecoreMainnet, localAnvil, localhost, sepolia, mainnet],
  connectors: [injected()],
  transports: {
    [memecoreTestnet.id]: http(),
    [memecoreMainnet.id]: http(),
    [localAnvil.id]: http(),
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
