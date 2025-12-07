// CoinGecko Social & Sentiment Data Service
// Uses server-side API route to avoid CORS issues
// https://www.coingecko.com/api/documentation

export interface CoinGeckoSocialData {
  symbol: string;
  coingeckoId: string;
  sentimentVotesUpPercentage: number;
  sentimentVotesDownPercentage: number;
  communityData: {
    telegramUsers: number | null;
    redditSubscribers: number;
    redditActiveAccounts48h: number;
    redditAveragePosts48h: number;
    redditAverageComments48h: number;
  };
  developerData: {
    forks: number;
    stars: number;
    subscribers: number;
    totalIssues: number;
    closedIssues: number;
    pullRequestsMerged: number;
    commitCount4Weeks: number;
  };
  publicInterestScore: number | null;
}

// CoinGecko ID 매핑 (symbol -> coingecko_id)
const COINGECKO_IDS: Record<string, string> = {
  DOGE: "dogecoin",
  SHIB: "shiba-inu",
  PEPE: "pepe",
  WIF: "dogwifcoin",
  BONK: "bonk",
  FLOKI: "floki",
  BRETT: "brett",
  POPCAT: "popcat",
  MOG: "mog-coin",
  NEIRO: "neiro-3",
  MEME: "memecoin-2",
  TURBO: "turbo",
  LADYS: "milady-meme-coin",
  SPX: "spx6900",
};

let cachedData: Map<string, CoinGeckoSocialData> = new Map();
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5분 (CoinGecko rate limit 고려)

/**
 * 서버 API를 통해 특정 심볼의 소셜 데이터 가져오기
 * CORS 문제를 피하기 위해 /api/social 라우트 사용
 */
export async function getCoinSocialData(symbol: string): Promise<CoinGeckoSocialData | null> {
  if (!COINGECKO_IDS[symbol]) {
    return null;
  }

  // 캐시 확인
  if (cachedData.has(symbol) && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedData.get(symbol) || null;
  }

  try {
    const response = await fetch(`/api/social?symbol=${symbol}`);
    const result = await response.json();

    if (result.success && result.data) {
      cachedData.set(symbol, result.data);
      cacheTimestamp = Date.now();
      return result.data;
    }

    return null;
  } catch (error) {
    console.warn(`Failed to fetch social data for ${symbol}:`, error);
    return null;
  }
}

/**
 * 서버 API를 통해 모든 밈코인의 소셜 데이터 가져오기
 */
export async function getAllMemeTokenSocialData(): Promise<Map<string, CoinGeckoSocialData>> {
  // 캐시 확인
  if (cachedData.size > 0 && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedData;
  }

  try {
    const response = await fetch("/api/social");
    const result = await response.json();

    if (result.success && result.data) {
      const newCache = new Map<string, CoinGeckoSocialData>(
        Object.entries(result.data)
      );
      cachedData = newCache;
      cacheTimestamp = Date.now();
      return newCache;
    }

    return cachedData;
  } catch (error) {
    console.warn("Failed to fetch all social data:", error);
    return cachedData;
  }
}

/**
 * 감정 점수 계산 (0-100)
 * CoinGecko sentiment_votes_up_percentage 기반
 */
export function calculateSentimentScore(data: CoinGeckoSocialData): number {
  return Math.round(data.sentimentVotesUpPercentage);
}

/**
 * 커뮤니티 활성도 점수 계산 (0-100)
 */
export function calculateCommunityScore(data: CoinGeckoSocialData): number {
  const { communityData, developerData } = data;

  let score = 0;

  // Telegram 사용자 (최대 30점)
  if (communityData.telegramUsers) {
    score += Math.min(30, (communityData.telegramUsers / 100000) * 30);
  }

  // Reddit 활동 (최대 30점)
  const redditScore =
    Math.min(10, communityData.redditSubscribers / 100000 * 10) +
    Math.min(10, communityData.redditActiveAccounts48h / 1000 * 10) +
    Math.min(10, (communityData.redditAveragePosts48h + communityData.redditAverageComments48h) * 2);
  score += redditScore;

  // 개발 활동 (최대 40점)
  const devScore =
    Math.min(15, (developerData.stars / 10000) * 15) +
    Math.min(15, (developerData.forks / 3000) * 15) +
    Math.min(10, developerData.commitCount4Weeks * 2);
  score += devScore;

  return Math.min(100, Math.round(score));
}

/**
 * 소셜 데이터를 기반으로 한 종합 인사이트 생성
 */
export function generateSocialInsight(data: CoinGeckoSocialData): string {
  const sentimentScore = calculateSentimentScore(data);
  const communityScore = calculateCommunityScore(data);

  const insights: string[] = [];

  // 감정 분석
  if (sentimentScore >= 80) {
    insights.push(`Very bullish sentiment (${sentimentScore}% positive)`);
  } else if (sentimentScore >= 60) {
    insights.push(`Bullish sentiment (${sentimentScore}% positive)`);
  } else if (sentimentScore <= 40) {
    insights.push(`Bearish sentiment (${sentimentScore}% positive)`);
  }

  // 텔레그램 활동
  if (data.communityData.telegramUsers && data.communityData.telegramUsers > 50000) {
    insights.push(`Strong Telegram community (${(data.communityData.telegramUsers / 1000).toFixed(0)}K users)`);
  }

  // 개발 활동
  if (data.developerData.commitCount4Weeks > 10) {
    insights.push(`Active development (${data.developerData.commitCount4Weeks} commits/month)`);
  } else if (data.developerData.stars > 1000) {
    insights.push(`${(data.developerData.stars / 1000).toFixed(1)}K GitHub stars`);
  }

  if (insights.length === 0) {
    return communityScore > 50
      ? "Moderate community engagement"
      : "Limited community activity";
  }

  return insights.slice(0, 2).join(". ") + ".";
}

export { COINGECKO_IDS };
