// Contract Addresses
// TODO: Update these after deploying to MemeCore testnet

export const CONTRACT_ADDRESSES = {
  // Local/Testnet addresses (update after deployment)
  MemeToken: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  MemeAnalytics: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  MemePrediction: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  MemeReward: "0x0000000000000000000000000000000000000000" as `0x${string}`,
} as const;

// Chain configuration for MemeCore
export const MEMECORE_CHAIN = {
  id: 0, // TODO: Update with actual MemeCore chain ID
  name: "MemeCore",
  nativeCurrency: {
    decimals: 18,
    name: "MEME",
    symbol: "MEME",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.memecore.com"], // TODO: Update with actual RPC
    },
  },
  blockExplorers: {
    default: {
      name: "MemeCore Explorer",
      url: "https://explorer.memecore.com", // TODO: Update
    },
  },
} as const;
