import { NextResponse } from "next/server";

// Alternative.me Fear & Greed Index API - Free, No API Key Required
// https://alternative.me/crypto/fear-and-greed-index/
// Updates daily

interface FearGreedResponse {
  name: string;
  data: Array<{
    value: string;
    value_classification: string;
    timestamp: string;
    time_until_update: string;
  }>;
  metadata: {
    error: string | null;
  };
}

// 밈코인별 변동성 계수 (Fear & Greed 기반 추정)
const MEME_VOLATILITY: Record<string, number> = {
  DOGE: 1.1,  // 도지는 상대적으로 안정적
  SHIB: 1.3,
  PEPE: 1.5,
  WIF: 1.4,
  BONK: 1.5,
  FLOKI: 1.3,
};

export async function GET() {
  try {
    const response = await fetch("https://api.alternative.me/fng/?limit=1", {
      headers: {
        "User-Agent": "MISP/1.0 (Meme Intelligence Social Platform)",
      },
      next: { revalidate: 300 }, // 5분 캐시
    });

    if (!response.ok) {
      console.error("Fear & Greed API error:", response.status, response.statusText);
      return NextResponse.json({
        error: "api_error",
        fallback: true,
        data: getDefaultSentiment(),
        fearGreedIndex: 50,
        classification: "Neutral",
      });
    }

    const result: FearGreedResponse = await response.json();

    if (result.metadata.error || !result.data || result.data.length === 0) {
      return NextResponse.json({
        error: "no_data",
        fallback: true,
        data: getDefaultSentiment(),
        fearGreedIndex: 50,
        classification: "Neutral",
      });
    }

    const fearGreedValue = parseInt(result.data[0].value, 10);
    const classification = result.data[0].value_classification;

    // Fear & Greed Index를 각 밈코인에 적용 (변동성 계수 반영)
    const sentimentMap: Record<string, number> = {};

    for (const [symbol, volatility] of Object.entries(MEME_VOLATILITY)) {
      // Fear & Greed를 기반으로 변동성 적용
      // 50이 중립, 변동성이 높을수록 극단적인 값
      const deviation = (fearGreedValue - 50) * volatility;
      const adjustedSentiment = Math.round(50 + deviation);
      sentimentMap[symbol] = Math.max(0, Math.min(100, adjustedSentiment));
    }

    // BTC, ETH는 Fear & Greed 그대로 사용
    sentimentMap["BTC"] = fearGreedValue;
    sentimentMap["ETH"] = Math.round(fearGreedValue * 0.95); // ETH는 약간 보수적

    return NextResponse.json({
      success: true,
      data: sentimentMap,
      fearGreedIndex: fearGreedValue,
      classification,
      timestamp: new Date().toISOString(),
      source: "Alternative.me Fear & Greed Index",
    });
  } catch (error) {
    console.error("Fear & Greed fetch error:", error);
    return NextResponse.json({
      error: "fetch_failed",
      fallback: true,
      data: getDefaultSentiment(),
      fearGreedIndex: 50,
      classification: "Neutral",
    });
  }
}

// 폴백용 기본 감정 데이터
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
