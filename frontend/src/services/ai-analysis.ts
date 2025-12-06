// AI Analysis Service - Cultural Impact 분석 및 인사이트 생성
// DexScreener + Reddit 데이터 통합 분석

import { TokenMarketData } from "./dexscreener";
import { SubredditStats } from "./reddit";

export interface TokenInsight {
  symbol: string;
  name: string;
  culturalScore: number; // 0-10000
  memeCount: number;
  trend: number; // 0: down, 1: stable, 2: up
  insight: string;
  priceData: TokenMarketData;
  socialData?: SubredditStats;
  riskLevel: "low" | "medium" | "high";
  prediction: {
    direction: "up" | "down" | "stable";
    confidence: number;
  };
  signals: {
    price: number;
    social: number;
    momentum: number;
  };
}

export interface AIReport {
  timestamp: Date;
  tokens: TokenInsight[];
  marketSummary: string;
  topMover: string;
  alerts: Alert[];
  overallSentiment: "bullish" | "bearish" | "neutral";
}

export interface Alert {
  type: "price_surge" | "price_crash" | "social_spike" | "sentiment_shift" | "whale_activity";
  symbol: string;
  message: string;
  severity: "info" | "warning" | "critical";
  timestamp: Date;
}

/**
 * 토큰별 종합 분석 및 인사이트 생성
 */
export function generateTokenInsight(
  priceData: TokenMarketData,
  socialData?: SubredditStats
): TokenInsight {
  // Cultural Score 계산 (0-10000)
  const culturalScore = calculateCulturalScore(priceData, socialData);

  // 트렌드 결정
  const trend = determineTrend(priceData, socialData);

  // 리스크 레벨 계산
  const riskLevel = calculateRiskLevel(priceData, socialData);

  // 시그널 계산
  const signals = calculateSignals(priceData, socialData);

  // 예측 생성
  const prediction = generatePrediction(signals, culturalScore);

  // AI 인사이트 텍스트 생성
  const insight = generateInsightText(priceData, socialData, signals, trend);

  return {
    symbol: priceData.symbol,
    name: priceData.name,
    culturalScore,
    memeCount: socialData?.mentionCount || Math.round(priceData.txns24h * 0.1),
    trend,
    insight,
    priceData,
    socialData,
    riskLevel,
    prediction,
    signals,
  };
}

/**
 * Cultural Impact Score 계산
 */
function calculateCulturalScore(price: TokenMarketData, social?: SubredditStats): number {
  let score = 0;

  // 가격 모멘텀 (30%)
  const priceScore = Math.min(100, Math.max(0, 50 + price.change24h * 2));
  score += priceScore * 30;

  // 거래 활동 (20%)
  const volumeScore = Math.min(100, (price.volume24h / 1e8) * 10);
  score += volumeScore * 20;

  // 소셜 활동 (30%)
  if (social) {
    const socialScore = Math.min(100, (social.mentionCount / 100) * 50 + (social.sentiment || 50));
    score += socialScore * 30;
  } else {
    score += 50 * 30; // 중립
  }

  // 유동성 (10%)
  const liquidityScore = Math.min(100, (price.liquidity / 1e7) * 10);
  score += liquidityScore * 10;

  // 매수/매도 비율 (10%)
  const ratioScore = price.buySellRatio > 1 ? Math.min(100, price.buySellRatio * 50) : 50;
  score += ratioScore * 10;

  return Math.round(score);
}

/**
 * 시그널 계산
 */
function calculateSignals(price: TokenMarketData, social?: SubredditStats): {
  price: number;
  social: number;
  momentum: number;
} {
  // Price signal (-100 to 100)
  const priceSignal = Math.max(-100, Math.min(100, price.change24h * 5));

  // Social signal (-100 to 100)
  let socialSignal = 0;
  if (social) {
    socialSignal = (social.sentiment - 50) * 2;
    if (social.activeUsers > 1000) socialSignal += 20;
    if (social.postsLast24h > 50) socialSignal += 15;
  }

  // Momentum signal
  const momentum = (priceSignal + socialSignal) / 2 + (price.buySellRatio > 1.2 ? 20 : price.buySellRatio < 0.8 ? -20 : 0);

  return {
    price: Math.round(priceSignal),
    social: Math.round(socialSignal),
    momentum: Math.round(Math.max(-100, Math.min(100, momentum))),
  };
}

/**
 * 트렌드 결정
 */
function determineTrend(price: TokenMarketData, social?: SubredditStats): number {
  const priceWeight = 0.5;
  const socialWeight = 0.3;
  const volumeWeight = 0.2;

  let score = 0;

  // 가격 트렌드
  if (price.change24h > 5) score += 2 * priceWeight;
  else if (price.change24h > 0) score += 1 * priceWeight;
  else if (price.change24h > -5) score += 0.5 * priceWeight;

  // 소셜 트렌드
  if (social) {
    if (social.sentiment > 70) score += 2 * socialWeight;
    else if (social.sentiment > 50) score += 1 * socialWeight;
    else score += 0.5 * socialWeight;
  } else {
    score += 1 * socialWeight;
  }

  // 볼륨 트렌드
  if (price.volume24h > 1e8) score += 2 * volumeWeight;
  else if (price.volume24h > 1e7) score += 1 * volumeWeight;

  if (score >= 1.3) return 2; // bullish
  if (score <= 0.7) return 0; // bearish
  return 1; // neutral
}

/**
 * 리스크 레벨 계산
 */
function calculateRiskLevel(price: TokenMarketData, social?: SubredditStats): "low" | "medium" | "high" {
  const volatility = Math.abs(price.change24h);
  const liquidityRisk = price.liquidity < 1e6 ? 2 : price.liquidity < 1e7 ? 1 : 0;
  const sentimentRisk = social && social.sentiment < 40 ? 1 : 0;

  const totalRisk = (volatility > 20 ? 2 : volatility > 10 ? 1 : 0) + liquidityRisk + sentimentRisk;

  if (totalRisk >= 3) return "high";
  if (totalRisk >= 1) return "medium";
  return "low";
}

/**
 * 예측 생성
 */
function generatePrediction(
  signals: { price: number; social: number; momentum: number },
  culturalScore: number
): { direction: "up" | "down" | "stable"; confidence: number } {
  const combinedSignal = (signals.price * 0.4 + signals.social * 0.3 + signals.momentum * 0.3);

  let direction: "up" | "down" | "stable" = "stable";
  if (combinedSignal > 20) direction = "up";
  else if (combinedSignal < -20) direction = "down";

  // 신뢰도: 시그널 강도 + Cultural Score
  const confidence = Math.min(95, Math.max(30,
    50 + Math.abs(combinedSignal) * 0.3 + (culturalScore / 200)
  ));

  return { direction, confidence: Math.round(confidence) };
}

/**
 * AI 인사이트 텍스트 생성
 */
function generateInsightText(
  price: TokenMarketData,
  social: SubredditStats | undefined,
  signals: { price: number; social: number; momentum: number },
  trend: number
): string {
  const insights: string[] = [];

  // 가격 분석
  if (Math.abs(price.change24h) > 10) {
    insights.push(`${price.change24h > 0 ? "📈" : "📉"} ${Math.abs(price.change24h).toFixed(1)}% in 24h`);
  }

  // 소셜 분석
  if (social) {
    if (social.sentiment > 75) {
      insights.push(`Strong bullish sentiment (${social.sentiment}%)`);
    } else if (social.sentiment < 40) {
      insights.push(`Bearish community mood (${social.sentiment}%)`);
    }

    if (social.activeUsers > 1000) {
      insights.push(`High community activity (${social.activeUsers.toLocaleString()} active)`);
    }
  }

  // 매수/매도 분석
  if (price.buySellRatio > 1.5) {
    insights.push("Strong buying pressure");
  } else if (price.buySellRatio < 0.7) {
    insights.push("Selling pressure detected");
  }

  // 모멘텀
  if (signals.momentum > 50) {
    insights.push("Bullish momentum building");
  } else if (signals.momentum < -50) {
    insights.push("Bearish momentum");
  }

  if (insights.length === 0) {
    return trend === 2 ? "Positive market conditions" :
           trend === 0 ? "Market showing weakness" :
           "Consolidating, watch for breakout";
  }

  return insights.slice(0, 2).join(". ") + ".";
}

/**
 * 전체 시장 AI 리포트 생성
 */
export function generateAIReport(insights: TokenInsight[]): AIReport {
  const alerts: Alert[] = [];

  // 이상 탐지 및 알림 생성
  for (const insight of insights) {
    if (insight.priceData.change24h > 20) {
      alerts.push({
        type: "price_surge",
        symbol: insight.symbol,
        message: `${insight.symbol} surged ${insight.priceData.change24h.toFixed(1)}%`,
        severity: "warning",
        timestamp: new Date(),
      });
    }

    if (insight.priceData.change24h < -15) {
      alerts.push({
        type: "price_crash",
        symbol: insight.symbol,
        message: `${insight.symbol} dropped ${Math.abs(insight.priceData.change24h).toFixed(1)}%`,
        severity: "critical",
        timestamp: new Date(),
      });
    }

    if (insight.socialData && insight.socialData.activeUsers > 2000) {
      alerts.push({
        type: "social_spike",
        symbol: insight.symbol,
        message: `${insight.symbol} social activity spike`,
        severity: "info",
        timestamp: new Date(),
      });
    }
  }

  // Top mover
  const topMover = insights.reduce((prev, current) =>
    Math.abs(current.priceData.change24h) > Math.abs(prev.priceData.change24h) ? current : prev
  );

  // 시장 감성
  const bullishCount = insights.filter((i) => i.trend === 2).length;
  const bearishCount = insights.filter((i) => i.trend === 0).length;
  const overallSentiment = bullishCount > bearishCount ? "bullish" :
                           bearishCount > bullishCount ? "bearish" : "neutral";

  // 시장 요약
  const avgScore = insights.reduce((sum, i) => sum + i.culturalScore, 0) / insights.length;
  const marketSummary = generateMarketSummary(insights, overallSentiment, avgScore);

  return {
    timestamp: new Date(),
    tokens: insights,
    marketSummary,
    topMover: topMover.symbol,
    alerts,
    overallSentiment,
  };
}

function generateMarketSummary(
  insights: TokenInsight[],
  sentiment: "bullish" | "bearish" | "neutral",
  avgScore: number
): string {
  const bullish = insights.filter((i) => i.trend === 2).length;
  const bearish = insights.filter((i) => i.trend === 0).length;

  let summary = "";

  if (sentiment === "bullish") {
    summary = `Meme market showing strength. ${bullish}/${insights.length} tokens bullish.`;
  } else if (sentiment === "bearish") {
    summary = `Meme market under pressure. ${bearish}/${insights.length} tokens bearish.`;
  } else {
    summary = `Mixed signals in meme market. Watching for direction.`;
  }

  summary += ` Avg Cultural Score: ${(avgScore / 100).toFixed(0)}/100.`;

  return summary;
}
