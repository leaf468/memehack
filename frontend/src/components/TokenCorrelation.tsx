"use client";

import { useMemo } from "react";
import { TokenInsight } from "@/services/ai-analysis";

interface TokenCorrelationProps {
  insights: TokenInsight[];
}

interface CorrelationPair {
  token1: string;
  token2: string;
  correlation: number;
  type: "positive" | "negative" | "neutral";
}

export function TokenCorrelation({ insights }: TokenCorrelationProps) {
  // Calculate correlation based on similar price movements and sentiment
  const correlations = useMemo(() => {
    const pairs: CorrelationPair[] = [];
    const tokens = insights.slice(0, 8); // Top 8 tokens for performance

    for (let i = 0; i < tokens.length; i++) {
      for (let j = i + 1; j < tokens.length; j++) {
        const t1 = tokens[i];
        const t2 = tokens[j];

        // Simple correlation calculation based on:
        // 1. Price change direction similarity
        // 2. Trend similarity
        // 3. Sentiment similarity
        const priceCorr =
          t1.priceData.change24h * t2.priceData.change24h > 0 ? 0.4 : -0.4;
        const trendCorr = t1.trend === t2.trend ? 0.3 : -0.1;
        const sentimentCorr =
          Math.abs((t1.sentimentScore || 50) - (t2.sentimentScore || 50)) < 15
            ? 0.3
            : 0;

        const correlation = Math.max(
          -1,
          Math.min(1, priceCorr + trendCorr + sentimentCorr)
        );

        pairs.push({
          token1: t1.symbol,
          token2: t2.symbol,
          correlation,
          type:
            correlation > 0.3
              ? "positive"
              : correlation < -0.3
              ? "negative"
              : "neutral",
        });
      }
    }

    return pairs.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }, [insights]);

  const strongPositive = correlations.filter((c) => c.type === "positive");
  const strongNegative = correlations.filter((c) => c.type === "negative");

  const getCorrelationColor = (corr: number) => {
    if (corr > 0.5) return "text-green-400 bg-green-900/30";
    if (corr > 0.3) return "text-green-300 bg-green-900/20";
    if (corr < -0.5) return "text-red-400 bg-red-900/30";
    if (corr < -0.3) return "text-red-300 bg-red-900/20";
    return "text-gray-400 bg-gray-800";
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900/20 to-violet-900/20 rounded-xl p-5 border border-indigo-700/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔗</span>
          <h3 className="text-lg font-bold text-white">Token Correlation</h3>
        </div>
        <span className="text-xs text-gray-500">Based on price & sentiment</span>
      </div>

      {/* Correlation Matrix Preview */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Positive Correlations */}
        <div>
          <h4 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-1">
            <span>📈</span> Moving Together
          </h4>
          <div className="space-y-1">
            {strongPositive.slice(0, 4).map((pair, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-green-900/20 rounded px-2 py-1.5 text-xs"
              >
                <span className="text-white">
                  {pair.token1} ↔ {pair.token2}
                </span>
                <span className="text-green-400 font-mono">
                  +{(pair.correlation * 100).toFixed(0)}%
                </span>
              </div>
            ))}
            {strongPositive.length === 0 && (
              <p className="text-xs text-gray-500 py-2">No strong correlations</p>
            )}
          </div>
        </div>

        {/* Negative Correlations */}
        <div>
          <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-1">
            <span>📉</span> Moving Opposite
          </h4>
          <div className="space-y-1">
            {strongNegative.slice(0, 4).map((pair, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-red-900/20 rounded px-2 py-1.5 text-xs"
              >
                <span className="text-white">
                  {pair.token1} ↔ {pair.token2}
                </span>
                <span className="text-red-400 font-mono">
                  {(pair.correlation * 100).toFixed(0)}%
                </span>
              </div>
            ))}
            {strongNegative.length === 0 && (
              <p className="text-xs text-gray-500 py-2">No inverse correlations</p>
            )}
          </div>
        </div>
      </div>

      {/* Mini Correlation Heatmap */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <h4 className="text-xs text-gray-400 mb-2">Correlation Heatmap (Top 6)</h4>
        <div className="overflow-x-auto">
          <div className="flex gap-1">
            <div className="w-12" /> {/* Spacer for row labels */}
            {insights.slice(0, 6).map((t) => (
              <div
                key={t.symbol}
                className="w-10 text-center text-xs text-gray-500 truncate"
              >
                {t.symbol}
              </div>
            ))}
          </div>
          {insights.slice(0, 6).map((t1, i) => (
            <div key={t1.symbol} className="flex gap-1 mt-1">
              <div className="w-12 text-xs text-gray-500 truncate">{t1.symbol}</div>
              {insights.slice(0, 6).map((t2, j) => {
                if (i === j) {
                  return (
                    <div
                      key={t2.symbol}
                      className="w-10 h-8 bg-purple-600/50 rounded flex items-center justify-center text-xs text-white"
                    >
                      1.0
                    </div>
                  );
                }
                const pair = correlations.find(
                  (c) =>
                    (c.token1 === t1.symbol && c.token2 === t2.symbol) ||
                    (c.token1 === t2.symbol && c.token2 === t1.symbol)
                );
                const corr = pair?.correlation || 0;
                return (
                  <div
                    key={t2.symbol}
                    className={`w-10 h-8 rounded flex items-center justify-center text-xs font-mono ${getCorrelationColor(
                      corr
                    )}`}
                  >
                    {corr.toFixed(1)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span className="text-gray-400">Positive</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-600 rounded" />
          <span className="text-gray-400">Neutral</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded" />
          <span className="text-gray-400">Negative</span>
        </div>
      </div>
    </div>
  );
}
