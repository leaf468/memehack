"use client";

import { useMemo } from "react";
import { TokenInsight } from "@/services/ai-analysis";

interface PriceComparisonChartProps {
  insights: TokenInsight[];
}

export function PriceComparisonChart({ insights }: PriceComparisonChartProps) {
  const sortedTokens = useMemo(() => {
    return [...insights]
      .sort((a, b) => b.priceData.change24h - a.priceData.change24h)
      .slice(0, 10);
  }, [insights]);

  const maxChange = useMemo(() => {
    return Math.max(...sortedTokens.map((t) => Math.abs(t.priceData.change24h)), 1);
  }, [sortedTokens]);

  const getBarWidth = (change: number) => {
    return (Math.abs(change) / maxChange) * 100;
  };

  return (
    <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-xl p-5 border border-green-700/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">📊</span>
          <h3 className="text-lg font-bold text-white">24h Price Comparison</h3>
        </div>
        <span className="text-xs text-gray-500">Top 10 by change</span>
      </div>

      <div className="space-y-2">
        {sortedTokens.map((token, index) => {
          const change = token.priceData.change24h;
          const isPositive = change >= 0;
          const barWidth = getBarWidth(change);

          return (
            <div key={token.symbol} className="flex items-center gap-2">
              {/* Rank */}
              <span className="text-xs text-gray-500 w-4">#{index + 1}</span>

              {/* Symbol */}
              <span className="text-sm font-medium text-white w-16">
                ${token.symbol}
              </span>

              {/* Bar Chart */}
              <div className="flex-1 flex items-center">
                {/* Negative side */}
                <div className="w-1/2 flex justify-end">
                  {!isPositive && (
                    <div
                      className="h-5 bg-gradient-to-l from-red-500 to-red-600 rounded-l"
                      style={{ width: `${barWidth}%` }}
                    />
                  )}
                </div>

                {/* Center line */}
                <div className="w-px h-6 bg-gray-600" />

                {/* Positive side */}
                <div className="w-1/2">
                  {isPositive && (
                    <div
                      className="h-5 bg-gradient-to-r from-green-500 to-green-600 rounded-r"
                      style={{ width: `${barWidth}%` }}
                    />
                  )}
                </div>
              </div>

              {/* Percentage */}
              <span
                className={`text-sm font-bold w-16 text-right ${
                  isPositive ? "text-green-400" : "text-red-400"
                }`}
              >
                {isPositive ? "+" : ""}
                {change.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span className="text-xs text-gray-400">Gainers</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded" />
          <span className="text-xs text-gray-400">Losers</span>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        <div className="text-center bg-gray-900/50 rounded-lg p-2">
          <p className="text-sm font-bold text-green-400">
            {insights.filter((t) => t.priceData.change24h > 0).length}
          </p>
          <p className="text-xs text-gray-500">Green</p>
        </div>
        <div className="text-center bg-gray-900/50 rounded-lg p-2">
          <p className="text-sm font-bold text-red-400">
            {insights.filter((t) => t.priceData.change24h < 0).length}
          </p>
          <p className="text-xs text-gray-500">Red</p>
        </div>
        <div className="text-center bg-gray-900/50 rounded-lg p-2">
          <p
            className={`text-sm font-bold ${
              insights.reduce((sum, t) => sum + t.priceData.change24h, 0) /
                insights.length >
              0
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {(
              insights.reduce((sum, t) => sum + t.priceData.change24h, 0) /
              insights.length
            ).toFixed(1)}
            %
          </p>
          <p className="text-xs text-gray-500">Avg</p>
        </div>
      </div>
    </div>
  );
}
