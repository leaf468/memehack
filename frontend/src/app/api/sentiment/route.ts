import { NextResponse } from "next/server";

// SentiCrypt API - Free crypto sentiment analysis
// https://senticrypt.com - No API key required
// Updates every 2 hours

interface SentiCryptData {
  symbol: string;
  sentiment: number; // -1.0 to 1.0
  timestamp: string;
}

export async function GET() {
  try {
    const response = await fetch("https://api.senticrypt.com/v2/all.json", {
      headers: {
        "User-Agent": "MISP/1.0 (Meme Intelligence Social Platform)",
      },
      next: { revalidate: 300 }, // 5분 캐시 (API는 2시간마다 업데이트)
    });

    if (!response.ok) {
      console.error("SentiCrypt API error:", response.status, response.statusText);
      return NextResponse.json({
        error: "api_error",
        fallback: true,
        data: getDefaultSentiment(),
      });
    }

    const data: SentiCryptData[] = await response.json();

    // 밈코인 심볼 매핑 (SentiCrypt는 주로 BTC, ETH 등 대형 코인 위주)
    const sentimentMap: Record<string, number> = {};

    for (const item of data) {
      // -1.0 ~ 1.0 을 0 ~ 100 으로 변환
      const normalizedSentiment = Math.round((item.sentiment + 1) * 50);
      sentimentMap[item.symbol.toUpperCase()] = normalizedSentiment;
    }

    return NextResponse.json({
      success: true,
      data: sentimentMap,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("SentiCrypt fetch error:", error);
    return NextResponse.json({
      error: "fetch_failed",
      fallback: true,
      data: getDefaultSentiment(),
    });
  }
}

// 폴백용 기본 감정 데이터
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
