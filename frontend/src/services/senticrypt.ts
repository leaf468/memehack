// SentiCrypt Sentiment Analysis Service
// Free crypto sentiment API - https://senticrypt.com

export interface SentimentData {
  symbol: string;
  sentiment: number; // 0-100 (normalized from -1 to 1)
  timestamp: string;
}

// 밈코인들의 감정 데이터 매핑 (BTC/ETH 기반 추정)
// SentiCrypt는 대형 코인 위주라 밈코인은 BTC/ETH 트렌드 + 변동 적용
const MEME_COIN_CORRELATION: Record<string, { base: string; volatility: number }> = {
  DOGE: { base: "BTC", volatility: 1.2 },
  SHIB: { base: "ETH", volatility: 1.5 },
  PEPE: { base: "ETH", volatility: 1.8 },
  WIF: { base: "BTC", volatility: 1.6 },
  BONK: { base: "BTC", volatility: 1.7 },
  FLOKI: { base: "ETH", volatility: 1.4 },
};

let cachedSentiment: Record<string, number> | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5분

/**
 * SentiCrypt API에서 감정 데이터 가져오기
 */
export async function fetchSentimentData(): Promise<Record<string, number>> {
  // 캐시 확인
  if (cachedSentiment && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedSentiment;
  }

  try {
    const response = await fetch("/api/sentiment");
    const result = await response.json();

    if (result.success && result.data) {
      cachedSentiment = result.data;
      cacheTimestamp = Date.now();
      return result.data;
    }

    // 폴백 데이터 사용
    return result.data || getDefaultSentiment();
  } catch (error) {
    console.error("Failed to fetch sentiment data:", error);
    return getDefaultSentiment();
  }
}

/**
 * 특정 밈코인의 감정 점수 계산
 * BTC/ETH 감정 + 변동성 기반 추정
 */
export async function getMemeTokenSentiment(symbol: string): Promise<number> {
  const sentimentData = await fetchSentimentData();

  // 직접 데이터가 있으면 사용
  if (sentimentData[symbol]) {
    return sentimentData[symbol];
  }

  // 없으면 상관관계 기반 추정
  const correlation = MEME_COIN_CORRELATION[symbol];
  if (correlation) {
    const baseSentiment = sentimentData[correlation.base] || 50;
    // 변동성 적용 (50 기준으로 편차 확대)
    const deviation = (baseSentiment - 50) * correlation.volatility;
    const estimatedSentiment = Math.round(50 + deviation);
    // 0-100 범위로 클램프
    return Math.max(0, Math.min(100, estimatedSentiment));
  }

  return 50; // 기본값
}

/**
 * 모든 밈코인의 감정 데이터 가져오기
 */
export async function getAllMemeTokenSentiment(): Promise<Record<string, number>> {
  const sentimentData = await fetchSentimentData();
  const memeTokens = Object.keys(MEME_COIN_CORRELATION);

  const result: Record<string, number> = {};

  for (const symbol of memeTokens) {
    if (sentimentData[symbol]) {
      result[symbol] = sentimentData[symbol];
    } else {
      const correlation = MEME_COIN_CORRELATION[symbol];
      if (correlation) {
        const baseSentiment = sentimentData[correlation.base] || 50;
        const deviation = (baseSentiment - 50) * correlation.volatility;
        result[symbol] = Math.max(0, Math.min(100, Math.round(50 + deviation)));
      } else {
        result[symbol] = 50;
      }
    }
  }

  return result;
}

/**
 * 감정 점수를 라벨로 변환
 */
export function sentimentToLabel(sentiment: number): "Bullish" | "Neutral" | "Bearish" {
  if (sentiment >= 60) return "Bullish";
  if (sentiment >= 40) return "Neutral";
  return "Bearish";
}

/**
 * 감정 점수 색상 클래스
 */
export function sentimentColor(sentiment: number): string {
  if (sentiment >= 60) return "text-green-400";
  if (sentiment >= 40) return "text-yellow-400";
  return "text-red-400";
}

// 폴백 데이터
function getDefaultSentiment(): Record<string, number> {
  return {
    BTC: 65,
    ETH: 60,
    DOGE: 70,
    SHIB: 62,
    PEPE: 75,
    WIF: 72,
    BONK: 68,
    FLOKI: 64,
  };
}
