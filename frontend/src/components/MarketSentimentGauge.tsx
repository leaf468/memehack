"use client";

import { useMemo } from "react";
import { TokenInsight } from "@/services/ai-analysis";

interface MarketSentimentGaugeProps {
  insights: TokenInsight[];
}

export function MarketSentimentGauge({ insights }: MarketSentimentGaugeProps) {
  const metrics = useMemo(() => {
    if (insights.length === 0) {
      return {
        overallScore: 50,
        bullishCount: 0,
        bearishCount: 0,
        neutralCount: 0,
        avgPriceChange: 0,
        avgSentiment: 50,
        marketMood: "Neutral" as const,
        fearGreedLabel: "Neutral" as const,
        topGainer: null as TokenInsight | null,
        topLoser: null as TokenInsight | null,
      };
    }

    const bullishCount = insights.filter((i) => i.trend === 2).length;
    const bearishCount = insights.filter((i) => i.trend === 0).length;
    const neutralCount = insights.filter((i) => i.trend === 1).length;

    const avgPriceChange =
      insights.reduce((sum, i) => sum + i.priceData.change24h, 0) / insights.length;
    const avgSentiment =
      insights.reduce((sum, i) => sum + (i.sentimentScore || 50), 0) / insights.length;

    // Calculate overall market score (0-100)
    const trendScore = ((bullishCount - bearishCount) / insights.length + 1) * 50;
    const priceScore = Math.min(100, Math.max(0, 50 + avgPriceChange * 2));
    const sentimentScore = avgSentiment;

    const overallScore = Math.round(trendScore * 0.4 + priceScore * 0.3 + sentimentScore * 0.3);

    // Determine market mood
    let marketMood: "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed";
    if (overallScore < 20) marketMood = "Extreme Fear";
    else if (overallScore < 40) marketMood = "Fear";
    else if (overallScore < 60) marketMood = "Neutral";
    else if (overallScore < 80) marketMood = "Greed";
    else marketMood = "Extreme Greed";

    // Fear & Greed style label
    let fearGreedLabel: "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed";
    if (avgSentiment < 25) fearGreedLabel = "Extreme Fear";
    else if (avgSentiment < 45) fearGreedLabel = "Fear";
    else if (avgSentiment < 55) fearGreedLabel = "Neutral";
    else if (avgSentiment < 75) fearGreedLabel = "Greed";
    else fearGreedLabel = "Extreme Greed";

    // Top gainer and loser
    const sorted = [...insights].sort(
      (a, b) => b.priceData.change24h - a.priceData.change24h
    );
    const topGainer = sorted[0] || null;
    const topLoser = sorted[sorted.length - 1] || null;

    return {
      overallScore,
      bullishCount,
      bearishCount,
      neutralCount,
      avgPriceChange,
      avgSentiment,
      marketMood,
      fearGreedLabel,
      topGainer,
      topLoser,
    };
  }, [insights]);

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case "Extreme Fear":
        return "text-red-400";
      case "Fear":
        return "text-orange-400";
      case "Neutral":
        return "text-gray-400";
      case "Greed":
        return "text-green-400";
      case "Extreme Greed":
        return "text-emerald-400";
      default:
        return "text-gray-400";
    }
  };

  const getGaugeColor = (score: number) => {
    if (score < 25) return "from-red-600 to-red-500";
    if (score < 45) return "from-orange-600 to-orange-500";
    if (score < 55) return "from-gray-600 to-gray-500";
    if (score < 75) return "from-green-600 to-green-500";
    return "from-emerald-600 to-emerald-500";
  };

  return (
    <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/20 rounded-xl p-5 border border-purple-700/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Market Sentiment</h3>
        <span className="text-xs text-gray-500">Real-time from token data</span>
      </div>

      {/* Main Gauge */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-40 h-20">
          {/* Gauge Background */}
          <svg className="w-full h-full" viewBox="0 0 100 50">
            {/* Background arc */}
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke="#374151"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Colored arc based on score */}
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(metrics.overallScore / 100) * 126} 126`}
            />
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="25%" stopColor="#f97316" />
                <stop offset="50%" stopColor="#6b7280" />
                <stop offset="75%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            {/* Needle */}
            <line
              x1="50"
              y1="50"
              x2={50 + 30 * Math.cos(Math.PI * (1 - metrics.overallScore / 100))}
              y2={50 - 30 * Math.sin(Math.PI * (1 - metrics.overallScore / 100))}
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="50" cy="50" r="4" fill="white" />
          </svg>

          {/* Score display */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
            <p className="text-2xl font-bold">{metrics.overallScore}</p>
          </div>
        </div>
      </div>

      {/* Mood Label */}
      <div className="text-center mb-4">
        <p className={`text-xl font-bold ${getMoodColor(metrics.marketMood)}`}>
          {metrics.marketMood}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Based on {insights.length} tokens analysis
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-900 rounded-lg p-3 text-center">
          <p className="text-green-400 text-lg font-bold">{metrics.bullishCount}</p>
          <p className="text-xs text-gray-500">Bullish</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-3 text-center">
          <p className="text-gray-400 text-lg font-bold">{metrics.neutralCount}</p>
          <p className="text-xs text-gray-500">Neutral</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-3 text-center">
          <p className="text-red-400 text-lg font-bold">{metrics.bearishCount}</p>
          <p className="text-xs text-gray-500">Bearish</p>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Avg 24h Change</span>
          <span
            className={
              metrics.avgPriceChange > 0 ? "text-green-400" : "text-red-400"
            }
          >
            {metrics.avgPriceChange > 0 ? "+" : ""}
            {metrics.avgPriceChange.toFixed(2)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Avg Sentiment</span>
          <span className={getMoodColor(metrics.fearGreedLabel)}>
            {metrics.avgSentiment.toFixed(0)} ({metrics.fearGreedLabel})
          </span>
        </div>
        {metrics.topGainer && (
          <div className="flex justify-between">
            <span className="text-gray-400">Top Gainer</span>
            <span className="text-green-400">
              {metrics.topGainer.symbol} (+{metrics.topGainer.priceData.change24h.toFixed(1)}%)
            </span>
          </div>
        )}
        {metrics.topLoser && metrics.topLoser.priceData.change24h < 0 && (
          <div className="flex justify-between">
            <span className="text-gray-400">Top Loser</span>
            <span className="text-red-400">
              {metrics.topLoser.symbol} ({metrics.topLoser.priceData.change24h.toFixed(1)}%)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
