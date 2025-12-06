// MISP Contract ABIs

export const MemeAnalyticsABI = [
  {
    type: "function",
    name: "getMeme",
    inputs: [{ name: "_memeId", type: "string" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "memeId", type: "string" },
          { name: "tokenSymbol", type: "string" },
          { name: "culturalScore", type: "uint256" },
          { name: "viralVelocity", type: "uint256" },
          { name: "sentimentScore", type: "uint256" },
          { name: "correlationScore", type: "uint256" },
          { name: "timestamp", type: "uint256" },
          { name: "region", type: "string" },
          { name: "isActive", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getRecentMemes",
    inputs: [
      { name: "_tokenSymbol", type: "string" },
      { name: "_count", type: "uint256" },
    ],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "memeId", type: "string" },
          { name: "tokenSymbol", type: "string" },
          { name: "culturalScore", type: "uint256" },
          { name: "viralVelocity", type: "uint256" },
          { name: "sentimentScore", type: "uint256" },
          { name: "correlationScore", type: "uint256" },
          { name: "timestamp", type: "uint256" },
          { name: "region", type: "string" },
          { name: "isActive", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "tokenAnalyses",
    inputs: [{ name: "", type: "string" }],
    outputs: [
      { name: "tokenSymbol", type: "string" },
      { name: "totalMemeCount", type: "uint256" },
      { name: "avgCulturalScore", type: "uint256" },
      { name: "priceCorrelation", type: "uint256" },
      { name: "trendDirection", type: "uint256" },
      { name: "lastUpdated", type: "uint256" },
      { name: "aiInsight", type: "string" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTrackedTokens",
    inputs: [],
    outputs: [{ name: "", type: "string[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTotalMemeCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

export const MemePredictionABI = [
  {
    type: "function",
    name: "getRound",
    inputs: [{ name: "_roundId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "roundId", type: "uint256" },
          { name: "tokenSymbol", type: "string" },
          { name: "startTime", type: "uint256" },
          { name: "endTime", type: "uint256" },
          { name: "resolutionTime", type: "uint256" },
          { name: "initialScore", type: "uint256" },
          { name: "finalScore", type: "uint256" },
          { name: "totalUpStake", type: "uint256" },
          { name: "totalDownStake", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "predictionType", type: "uint8" },
          { name: "resolved", type: "bool" },
          { name: "upWon", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "predict",
    inputs: [
      { name: "_roundId", type: "uint256" },
      { name: "_predictUp", type: "bool" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "claimReward",
    inputs: [{ name: "_roundId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getUserPrediction",
    inputs: [
      { name: "_roundId", type: "uint256" },
      { name: "_user", type: "address" },
    ],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "roundId", type: "uint256" },
          { name: "user", type: "address" },
          { name: "predictedUp", type: "bool" },
          { name: "stakeAmount", type: "uint256" },
          { name: "claimed", type: "bool" },
          { name: "reward", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getUserStats",
    inputs: [{ name: "_user", type: "address" }],
    outputs: [
      { name: "totalPredictions", type: "uint256" },
      { name: "totalWins", type: "uint256" },
      { name: "winRate", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getActiveRounds",
    inputs: [],
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "currentRoundId",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "minStake",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

export const MemeRewardABI = [
  {
    type: "function",
    name: "getUserProfile",
    inputs: [{ name: "_user", type: "address" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "totalRewardsEarned", type: "uint256" },
          { name: "contributionScore", type: "uint256" },
          { name: "predictionAccuracy", type: "uint256" },
          { name: "streakCount", type: "uint256" },
          { name: "maxStreak", type: "uint256" },
          { name: "tier", type: "uint8" },
          { name: "lastClaimTime", type: "uint256" },
          { name: "isActive", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "claimDailyReward",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getLeaderboard",
    inputs: [{ name: "_count", type: "uint256" }],
    outputs: [
      { name: "users", type: "address[]" },
      { name: "rewards", type: "uint256[]" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "registerUser",
    inputs: [{ name: "_user", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

export const MemeTokenABI = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;
