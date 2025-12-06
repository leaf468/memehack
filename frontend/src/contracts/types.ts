// TypeScript types for MISP contracts

export interface MemeData {
  memeId: string;
  tokenSymbol: string;
  culturalScore: bigint;
  viralVelocity: bigint;
  sentimentScore: bigint;
  correlationScore: bigint;
  timestamp: bigint;
  region: string;
  isActive: boolean;
}

export interface TokenAnalysis {
  tokenSymbol: string;
  totalMemeCount: bigint;
  avgCulturalScore: bigint;
  priceCorrelation: bigint;
  trendDirection: bigint;
  lastUpdated: bigint;
  aiInsight: string;
}

export interface PredictionRound {
  roundId: bigint;
  tokenSymbol: string;
  startTime: bigint;
  endTime: bigint;
  resolutionTime: bigint;
  initialScore: bigint;
  finalScore: bigint;
  totalUpStake: bigint;
  totalDownStake: bigint;
  status: number; // 0: Open, 1: Closed, 2: Resolved
  predictionType: number;
  resolved: boolean;
  upWon: boolean;
}

export interface UserPrediction {
  roundId: bigint;
  user: `0x${string}`;
  predictedUp: boolean;
  stakeAmount: bigint;
  claimed: boolean;
  reward: bigint;
}

export interface UserProfile {
  totalRewardsEarned: bigint;
  contributionScore: bigint;
  predictionAccuracy: bigint;
  streakCount: bigint;
  maxStreak: bigint;
  tier: number; // 0: Bronze, 1: Silver, 2: Gold, 3: Platinum, 4: Diamond
  lastClaimTime: bigint;
  isActive: boolean;
}

export interface UserStats {
  totalPredictions: bigint;
  totalWins: bigint;
  winRate: bigint;
}

// Enum helpers
export const RoundStatus = {
  Open: 0,
  Closed: 1,
  Resolved: 2,
} as const;

export const RewardTier = {
  Bronze: 0,
  Silver: 1,
  Gold: 2,
  Platinum: 3,
  Diamond: 4,
} as const;

export const TierNames = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"] as const;

export const TrendDirection = {
  Down: 0,
  Stable: 1,
  Up: 2,
} as const;

// Utility functions
export function formatScore(score: bigint): number {
  return Number(score) / 100; // Convert from 0-10000 to 0-100
}

export function formatEther(value: bigint): string {
  return (Number(value) / 1e18).toFixed(4);
}

export function getTierName(tier: number): string {
  return TierNames[tier] || "Unknown";
}

export function getTrendEmoji(trend: bigint): string {
  const t = Number(trend);
  if (t === 0) return "📉";
  if (t === 1) return "➡️";
  return "📈";
}
