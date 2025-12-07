"use client";

import { useMemo } from "react";
import { TokenInsight } from "@/services/ai-analysis";

interface ResponsivenessScoreProps {
  insights: TokenInsight[];
}

interface TokenResponsiveness {
  symbol: string;
  score: number; // 0-100 responsiveness score
  priceVolatility: number;
  socialReactivity: number;
  momentumStrength: number;
  buySellActivity: number;
  grade: "A" | "B" | "C" | "D" | "F";
}

export function ResponsivenessScore({ insights }: ResponsivenessScoreProps) {
  const responsiveTokens = useMemo(() => {
    return insights
      .map((token): TokenResponsiveness => {
        // Price volatility (0-100)
        const priceVolatility = Math.min(100, Math.abs(token.priceData.change24h) * 4);

        // Social reactivity (0-100) - based on sentiment divergence and activity
        const socialReactivity = Math.min(
          100,
          Math.abs((token.sentimentScore || 50) - 50) * 2 +
            (token.coinGeckoData?.communityData.redditActiveAccounts48h || 0) / 100
        );

        // Momentum strength (0-100)
        const momentumStrength = Math.min(100, Math.abs(token.signals.momentum) + 50);

        // Buy/Sell activity (0-100)
        const buySellActivity = Math.min(
          100,
          (Math.abs(token.priceData.buySellRatio - 1) * 50 + 50) *
            Math.min(1, token.priceData.volume24h / 1e8)
        );

        // Calculate overall responsiveness score
        const score = Math.round(
          priceVolatility * 0.3 +
            socialReactivity * 0.25 +
            momentumStrength * 0.25 +
            buySellActivity * 0.2
        );

        // Assign grade
        let grade: "A" | "B" | "C" | "D" | "F";
        if (score >= 80) grade = "A";
        else if (score >= 60) grade = "B";
        else if (score >= 40) grade = "C";
        else if (score >= 20) grade = "D";
        else grade = "F";

        return {
          symbol: token.symbol,
          score,
          priceVolatility: Math.round(priceVolatility),
          socialReactivity: Math.round(socialReactivity),
          momentumStrength: Math.round(momentumStrength),
          buySellActivity: Math.round(buySellActivity),
          grade,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [insights]);

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "text-emerald-400 bg-emerald-900/30 border-emerald-700";
      case "B":
        return "text-green-400 bg-green-900/30 border-green-700";
      case "C":
        return "text-yellow-400 bg-yellow-900/30 border-yellow-700";
      case "D":
        return "text-orange-400 bg-orange-900/30 border-orange-700";
      default:
        return "text-red-400 bg-red-900/30 border-red-700";
    }
  };

  const getBarColor = (value: number) => {
    if (value >= 70) return "bg-emerald-500";
    if (value >= 50) return "bg-green-500";
    if (value >= 30) return "bg-yellow-500";
    return "bg-red-500";
  };

  const avgScore =
    responsiveTokens.length > 0
      ? Math.round(
          responsiveTokens.reduce((sum, t) => sum + t.score, 0) / responsiveTokens.length
        )
      : 0;

  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold">Responsiveness Score</h3>
          <p className="text-xs text-gray-500">
            How reactive tokens are to market changes
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-purple-400">{avgScore}</p>
          <p className="text-xs text-gray-500">Avg Score</p>
        </div>
      </div>

      {/* Top Responsive Tokens */}
      <div className="space-y-3">
        {responsiveTokens.slice(0, 5).map((token, index) => (
          <div
            key={token.symbol}
            className="bg-gray-900 rounded-lg p-3 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm w-4">#{index + 1}</span>
                <span className="font-bold">${token.symbol}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">{token.score}/100</span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold border ${getGradeColor(
                    token.grade
                  )}`}
                >
                  {token.grade}
                </span>
              </div>
            </div>

            {/* Score breakdown */}
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div>
                <div className="flex justify-between text-gray-500 mb-1">
                  <span>Price</span>
                  <span>{token.priceVolatility}</span>
                </div>
                <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getBarColor(token.priceVolatility)}`}
                    style={{ width: `${token.priceVolatility}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-gray-500 mb-1">
                  <span>Social</span>
                  <span>{token.socialReactivity}</span>
                </div>
                <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getBarColor(token.socialReactivity)}`}
                    style={{ width: `${token.socialReactivity}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-gray-500 mb-1">
                  <span>Momentum</span>
                  <span>{token.momentumStrength}</span>
                </div>
                <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getBarColor(token.momentumStrength)}`}
                    style={{ width: `${token.momentumStrength}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-gray-500 mb-1">
                  <span>Activity</span>
                  <span>{token.buySellActivity}</span>
                </div>
                <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getBarColor(token.buySellActivity)}`}
                    style={{ width: `${token.buySellActivity}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-500 mb-2">Score Components:</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
          <span>Price: 24h volatility (30%)</span>
          <span>Social: Community reaction (25%)</span>
          <span>Momentum: Market direction (25%)</span>
          <span>Activity: Trading volume (20%)</span>
        </div>
      </div>
    </div>
  );
}
