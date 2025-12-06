// Contract ABIs
import MemeTokenABI from "./MemeToken.json";
import MemeAnalyticsABI from "./MemeAnalytics.json";
import MemePredictionABI from "./MemePrediction.json";
import MemeRewardABI from "./MemeReward.json";

// Deployed contract addresses (Anvil local - chainId: 31337)
export const CONTRACTS = {
  31337: {
    // Anvil/Localhost
    MemeToken: "0x5FbDB2315678afecb367f032d93F642f64180aa3" as const,
    MemeAnalytics: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512" as const,
    MemePrediction: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0" as const,
    MemeReward: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9" as const,
  },
  // MemeCore testnet (to be added)
  // 12345: {
  //   MemeToken: "0x...",
  //   ...
  // }
} as const;

export const ABIS = {
  MemeToken: MemeTokenABI,
  MemeAnalytics: MemeAnalyticsABI,
  MemePrediction: MemePredictionABI,
  MemeReward: MemeRewardABI,
} as const;

// Type helpers
export type ContractName = keyof typeof ABIS;
export type SupportedChainId = keyof typeof CONTRACTS;

export function getContractAddress(
  chainId: number,
  contract: ContractName
): `0x${string}` | undefined {
  const chainContracts = CONTRACTS[chainId as SupportedChainId];
  if (!chainContracts) return undefined;
  return chainContracts[contract] as `0x${string}`;
}
