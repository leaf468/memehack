// OpenAI Service - Real AI Insights
// Uses server-side API route to avoid CORS

export interface AIInsightRequest {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  sentiment?: number;
  communityScore?: number;
}

export interface AIInsightResponse {
  success: boolean;
  insight: string;
  model?: string;
  fallback?: boolean;
  error?: string;
}

let insightCache: Map<string, { insight: string; timestamp: number }> = new Map();
const CACHE_DURATION = 3 * 60 * 1000; // 3분 캐시

/**
 * 개별 토큰 AI 인사이트 생성
 */
export async function getTokenAIInsight(token: AIInsightRequest): Promise<string> {
  const cacheKey = `${token.symbol}-${Math.floor(Date.now() / CACHE_DURATION)}`;

  // 캐시 확인
  const cached = insightCache.get(token.symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.insight;
  }

  try {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tokens: [token],
        type: "insight",
      }),
    });

    const data: AIInsightResponse = await response.json();

    if (data.success && data.insight) {
      insightCache.set(token.symbol, {
        insight: data.insight,
        timestamp: Date.now(),
      });
      return data.insight;
    }

    return getFallbackInsight(token);
  } catch (error) {
    console.error("AI insight error:", error);
    return getFallbackInsight(token);
  }
}

/**
 * 전체 시장 AI 리포트 생성
 */
export async function getMarketAIReport(tokens: AIInsightRequest[]): Promise<string> {
  try {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tokens,
        type: "report",
      }),
    });

    const data: AIInsightResponse = await response.json();

    if (data.success && data.insight) {
      return data.insight;
    }

    return getFallbackReport(tokens);
  } catch (error) {
    console.error("AI report error:", error);
    return getFallbackReport(tokens);
  }
}

/**
 * 폴백 인사이트 (AI 실패시)
 */
function getFallbackInsight(token: AIInsightRequest): string {
  const { symbol, change24h, sentiment, communityScore } = token;

  if (change24h > 10) {
    return `${symbol} showing strong momentum with ${change24h.toFixed(1)}% gains. Watch for potential pullback.`;
  } else if (change24h < -10) {
    return `${symbol} under pressure with ${Math.abs(change24h).toFixed(1)}% decline. Could be accumulation opportunity.`;
  } else if (sentiment && sentiment > 70) {
    return `${symbol} has bullish community sentiment (${sentiment}%). Momentum building.`;
  } else if (communityScore && communityScore > 60) {
    return `${symbol} shows high community engagement. Watch for breakout signals.`;
  }

  return `${symbol} consolidating. Monitor volume for direction.`;
}

/**
 * 폴백 리포트 (AI 실패시)
 */
function getFallbackReport(tokens: AIInsightRequest[]): string {
  const bullish = tokens.filter((t) => t.change24h > 5).length;
  const bearish = tokens.filter((t) => t.change24h < -5).length;
  const topGainer = tokens.reduce((a, b) => (a.change24h > b.change24h ? a : b));
  const topLoser = tokens.reduce((a, b) => (a.change24h < b.change24h ? a : b));

  let sentiment = "mixed";
  if (bullish > bearish * 2) sentiment = "bullish";
  else if (bearish > bullish * 2) sentiment = "bearish";

  return `Meme market is ${sentiment}. ${bullish}/${tokens.length} tokens positive.
Top performer: ${topGainer.symbol} (+${topGainer.change24h.toFixed(1)}%).
Weakest: ${topLoser.symbol} (${topLoser.change24h.toFixed(1)}%).
Monitor high-volume movers for opportunities.`;
}

/**
 * 캐시 클리어
 */
export function clearInsightCache(): void {
  insightCache.clear();
}
