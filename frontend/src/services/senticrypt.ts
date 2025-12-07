// Fear & Greed Sentiment Analysis Service
// Alternative.me API - Free, No API Key Required
// https://alternative.me/crypto/fear-and-greed-index/

export interface SentimentData {
  symbol: string;
  sentiment: number; // 0-100
  fearGreedIndex?: number;
  classification?: string;
}

export interface SentimentResponse {
  success?: boolean;
  error?: string;
  fallback?: boolean;
  data: Record<string, number>;
  fearGreedIndex: number;
  classification: string;
  source?: string;
}

let cachedSentiment: SentimentResponse | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5분

/**
 * Fear & Greed API에서 감정 데이터 가져오기
 */
export async function fetchSentimentData(): Promise<SentimentResponse> {
  // 캐시 확인
  if (cachedSentiment && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedSentiment;
  }

  try {
    const response = await fetch("/api/sentiment");
    const result: SentimentResponse = await response.json();

    if (result.success || result.data) {
      cachedSentiment = result;
      cacheTimestamp = Date.now();
      return result;
    }

    // 폴백 데이터 사용
    return {
      data: getDefaultSentiment(),
      fearGreedIndex: 50,
      classification: "Neutral",
      fallback: true,
    };
  } catch (error) {
    console.error("Failed to fetch sentiment data:", error);
    return {
      data: getDefaultSentiment(),
      fearGreedIndex: 50,
      classification: "Neutral",
      fallback: true,
      error: "fetch_failed",
    };
  }
}

/**
 * 특정 밈코인의 감정 점수 가져오기
 */
export async function getMemeTokenSentiment(symbol: string): Promise<number> {
  const response = await fetchSentimentData();
  return response.data[symbol] || 50;
}

/**
 * 현재 Fear & Greed Index 가져오기
 */
export async function getFearGreedIndex(): Promise<{
  value: number;
  classification: string;
}> {
  const response = await fetchSentimentData();
  return {
    value: response.fearGreedIndex,
    classification: response.classification,
  };
}

/**
 * 모든 밈코인의 감정 데이터 가져오기
 */
export async function getAllMemeTokenSentiment(): Promise<Record<string, number>> {
  const response = await fetchSentimentData();
  return response.data;
}

/**
 * 감정 점수를 라벨로 변환
 */
export function sentimentToLabel(sentiment: number): "Bullish" | "Neutral" | "Bearish" {
  if (sentiment >= 55) return "Bullish";
  if (sentiment >= 45) return "Neutral";
  return "Bearish";
}

/**
 * Fear & Greed 분류를 라벨로 변환
 */
export function fearGreedToLabel(classification: string): "Bullish" | "Neutral" | "Bearish" {
  const lower = classification.toLowerCase();
  if (lower.includes("greed")) return "Bullish";
  if (lower.includes("fear")) return "Bearish";
  return "Neutral";
}

/**
 * 감정 점수 색상 클래스
 */
export function sentimentColor(sentiment: number): string {
  if (sentiment >= 55) return "text-green-400";
  if (sentiment >= 45) return "text-yellow-400";
  return "text-red-400";
}

/**
 * Fear & Greed 색상 클래스
 */
export function fearGreedColor(value: number): string {
  if (value >= 75) return "text-green-400"; // Extreme Greed
  if (value >= 55) return "text-lime-400";  // Greed
  if (value >= 45) return "text-yellow-400"; // Neutral
  if (value >= 25) return "text-orange-400"; // Fear
  return "text-red-400"; // Extreme Fear
}

// 폴백 데이터
function getDefaultSentiment(): Record<string, number> {
  return {
    BTC: 50,
    ETH: 48,
    DOGE: 55,
    SHIB: 52,
    PEPE: 58,
    WIF: 56,
    BONK: 54,
    FLOKI: 53,
  };
}
