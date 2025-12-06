// Twitter/X Meme Data Service
// Note: X API requires authentication. This uses alternative approaches.

export interface MemeData {
  id: string;
  text: string;
  author: string;
  likes: number;
  retweets: number;
  timestamp: Date;
  sentiment: "positive" | "negative" | "neutral";
  tokenMentions: string[];
}

export interface MemeAnalytics {
  symbol: string;
  totalMentions: number;
  sentimentScore: number; // 0-100
  viralScore: number; // 0-100
  topMemes: MemeData[];
  trendingHashtags: string[];
  regions: { region: string; count: number }[];
}

// 밈 관련 키워드
const MEME_KEYWORDS: Record<string, string[]> = {
  WIF: ["$WIF", "dogwifhat", "wif coin", "dog wif hat"],
  PEPE: ["$PEPE", "pepe coin", "pepe frog", "pepe meme"],
  DOGE: ["$DOGE", "dogecoin", "doge meme", "much wow"],
  SHIB: ["$SHIB", "shiba inu", "shib army"],
  BONK: ["$BONK", "bonk coin", "bonk meme"],
  FLOKI: ["$FLOKI", "floki inu"],
};

/**
 * 밈 데이터 분석 (시뮬레이션 + 실제 트렌드 기반)
 * 실제로는 X API, Reddit API, Telegram 등에서 수집
 */
export async function analyzeMemeActivity(
  symbol: string
): Promise<MemeAnalytics | null> {
  // 실제 구현시: X API v2 사용
  // const response = await fetch(`https://api.twitter.com/2/tweets/search/recent?query=${keywords}`, {
  //   headers: { Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}` }
  // });

  // 현재는 시뮬레이션 데이터 + 실시간 요소 결합
  const baseMetrics = getBaseMetrics(symbol);
  const timeVariation = getTimeBasedVariation();

  return {
    symbol,
    totalMentions: Math.floor(baseMetrics.mentions * timeVariation),
    sentimentScore: Math.min(100, Math.floor(baseMetrics.sentiment * timeVariation)),
    viralScore: Math.min(100, Math.floor(baseMetrics.viral * timeVariation)),
    topMemes: generateTopMemes(symbol),
    trendingHashtags: baseMetrics.hashtags,
    regions: [
      { region: "US", count: Math.floor(baseMetrics.mentions * 0.35) },
      { region: "Asia", count: Math.floor(baseMetrics.mentions * 0.30) },
      { region: "Europe", count: Math.floor(baseMetrics.mentions * 0.25) },
      { region: "Other", count: Math.floor(baseMetrics.mentions * 0.10) },
    ],
  };
}

/**
 * 여러 토큰의 밈 활동 분석
 */
export async function analyzeMultipleMemes(
  symbols: string[]
): Promise<MemeAnalytics[]> {
  const results = await Promise.all(
    symbols.map((symbol) => analyzeMemeActivity(symbol))
  );
  return results.filter((r): r is MemeAnalytics => r !== null);
}

/**
 * Cultural Impact Score 계산
 * 밈 활동, 감성, 확산성을 종합
 */
export function calculateCulturalScore(analytics: MemeAnalytics): number {
  const mentionWeight = 0.3;
  const sentimentWeight = 0.35;
  const viralWeight = 0.35;

  // 멘션 수 정규화 (0-100)
  const mentionScore = Math.min(100, (analytics.totalMentions / 10000) * 100);

  const score =
    mentionScore * mentionWeight +
    analytics.sentimentScore * sentimentWeight +
    analytics.viralScore * viralWeight;

  return Math.round(score * 100) / 100; // 소수점 2자리
}

// === Helper Functions ===

function getBaseMetrics(symbol: string) {
  const metrics: Record<string, { mentions: number; sentiment: number; viral: number; hashtags: string[] }> = {
    WIF: {
      mentions: 2450,
      sentiment: 78,
      viral: 85,
      hashtags: ["#WIF", "#dogwifhat", "#memecoin", "#SOL"],
    },
    PEPE: {
      mentions: 18200,
      sentiment: 82,
      viral: 92,
      hashtags: ["#PEPE", "#PepeCoin", "#memeseason", "#ETH"],
    },
    DOGE: {
      mentions: 32000,
      sentiment: 72,
      viral: 78,
      hashtags: ["#DOGE", "#Dogecoin", "#ToTheMoon", "#Elon"],
    },
    SHIB: {
      mentions: 8900,
      sentiment: 65,
      viral: 62,
      hashtags: ["#SHIB", "#ShibArmy", "#ShibaInu"],
    },
    BONK: {
      mentions: 3200,
      sentiment: 75,
      viral: 80,
      hashtags: ["#BONK", "#Solana", "#memecoin"],
    },
    FLOKI: {
      mentions: 4500,
      sentiment: 70,
      viral: 68,
      hashtags: ["#FLOKI", "#FlokiInu", "#Vikings"],
    },
  };

  return metrics[symbol] || { mentions: 1000, sentiment: 50, viral: 50, hashtags: ["#crypto"] };
}

function getTimeBasedVariation(): number {
  // 시간대별 활동량 변화 시뮬레이션
  const hour = new Date().getHours();
  const dayOfWeek = new Date().getDay();

  // 주말과 저녁 시간대에 활동 증가
  let multiplier = 1;
  if (dayOfWeek === 0 || dayOfWeek === 6) multiplier *= 1.2;
  if (hour >= 18 || hour <= 2) multiplier *= 1.15;

  // 랜덤 변동 (±15%)
  multiplier *= 0.85 + Math.random() * 0.3;

  return multiplier;
}

function generateTopMemes(symbol: string): MemeData[] {
  const templates = [
    `When $${symbol} pumps 20% and you only bought $10 worth 😭`,
    `Me explaining to my wife why I put our savings in $${symbol} 🤡`,
    `$${symbol} holders watching the chart every 5 seconds`,
    `POV: You didn't buy $${symbol} at the dip`,
    `$${symbol} to $1 is not a meme, it's a prophecy 🚀`,
  ];

  return templates.slice(0, 3).map((text, i) => ({
    id: `meme_${symbol}_${i}`,
    text,
    author: `@meme_trader_${Math.floor(Math.random() * 1000)}`,
    likes: Math.floor(Math.random() * 5000) + 500,
    retweets: Math.floor(Math.random() * 1000) + 100,
    timestamp: new Date(Date.now() - Math.random() * 86400000),
    sentiment: "positive" as const,
    tokenMentions: [symbol],
  }));
}

/**
 * 실시간 트렌드 감지
 */
export function detectMemeTrend(
  current: MemeAnalytics,
  previous: MemeAnalytics | null
): { trending: boolean; direction: "up" | "down" | "stable"; momentum: number } {
  if (!previous) {
    return { trending: false, direction: "stable", momentum: 0 };
  }

  const mentionChange =
    ((current.totalMentions - previous.totalMentions) / previous.totalMentions) * 100;

  let direction: "up" | "down" | "stable" = "stable";
  if (mentionChange > 10) direction = "up";
  else if (mentionChange < -10) direction = "down";

  return {
    trending: Math.abs(mentionChange) > 20,
    direction,
    momentum: mentionChange,
  };
}
