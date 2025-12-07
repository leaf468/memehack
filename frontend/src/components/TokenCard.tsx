"use client";

import { formatPrice, formatMarketCap, formatVolume } from "@/services/dexscreener";
import { Tooltip, InfoIcon, METRIC_EXPLANATIONS } from "./Tooltip";

interface TokenCardProps {
  symbol: string;
  name: string;
  culturalScore: number;
  memeCount: number;
  trend: number;
  insight: string;
  priceChange?: number;
  price?: number;
  volume?: number;
  marketCap?: number;
  image?: string;
}

export function TokenCard({
  symbol,
  name,
  culturalScore,
  memeCount,
  trend,
  insight,
  priceChange,
  price,
  volume,
  marketCap,
  image,
}: TokenCardProps) {
  const trendLabel = trend === 2 ? "Bullish" : trend === 1 ? "Neutral" : "Bearish";
  const trendColor =
    trend === 2
      ? "text-green-400 bg-green-400/10"
      : trend === 1
      ? "text-yellow-400 bg-yellow-400/10"
      : "text-red-400 bg-red-400/10";

  const scoreColor =
    culturalScore >= 8000
      ? "text-green-400"
      : culturalScore >= 6000
      ? "text-yellow-400"
      : "text-red-400";

  const scoreBarColor =
    culturalScore >= 8000
      ? "bg-gradient-to-r from-green-500 to-green-400"
      : culturalScore >= 6000
      ? "bg-gradient-to-r from-yellow-500 to-yellow-400"
      : "bg-gradient-to-r from-red-500 to-red-400";

  const priceChangeColor =
    priceChange && priceChange > 0
      ? "text-green-400"
      : priceChange && priceChange < 0
      ? "text-red-400"
      : "text-gray-400";

  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {image ? (
            <img src={image} alt={symbol} className="w-10 h-10 rounded-full" />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-lg font-bold">
              {symbol.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="font-bold text-lg text-gray-100">${symbol}</h3>
            <p className="text-xs text-gray-400">{name}</p>
          </div>
        </div>
        <Tooltip
          content={
            <div className="space-y-2">
              <p className="font-semibold text-white">{METRIC_EXPLANATIONS.trend.title}</p>
              <p className="text-gray-300">{METRIC_EXPLANATIONS.trend.description}</p>
              <div className="text-xs space-y-1">
                <p className="text-green-400">Bullish: {METRIC_EXPLANATIONS.trend.indicators.bullish}</p>
                <p className="text-yellow-400">Neutral: {METRIC_EXPLANATIONS.trend.indicators.neutral}</p>
                <p className="text-red-400">Bearish: {METRIC_EXPLANATIONS.trend.indicators.bearish}</p>
              </div>
            </div>
          }
          position="left"
        >
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${trendColor}`}>
            {trendLabel}
          </span>
        </Tooltip>
      </div>

      {/* Price Info */}
      {price !== undefined && (
        <div className="flex items-baseline justify-between mb-4 pb-4 border-b border-gray-700">
          <div>
            <p className="text-2xl font-bold text-gray-100">${formatPrice(price)}</p>
            {marketCap && (
              <p className="text-xs text-gray-500">MCap: {formatMarketCap(marketCap)}</p>
            )}
          </div>
          {priceChange !== undefined && (
            <div className="text-right">
              <p className={`text-lg font-semibold ${priceChangeColor}`}>
                {priceChange > 0 ? "+" : ""}{priceChange.toFixed(2)}%
              </p>
              <p className="text-xs text-gray-500">24h</p>
            </div>
          )}
        </div>
      )}

      {/* Cultural Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-gray-400">Cultural Impact Score</span>
            <Tooltip
              content={
                <div className="space-y-2">
                  <p className="font-semibold text-white">{METRIC_EXPLANATIONS.culturalScore.title}</p>
                  <p className="text-gray-300">{METRIC_EXPLANATIONS.culturalScore.description}</p>
                  <div className="text-xs space-y-1 text-gray-400">
                    {METRIC_EXPLANATIONS.culturalScore.factors.map((f, i) => (
                      <p key={i}>• {f}</p>
                    ))}
                  </div>
                </div>
              }
              position="right"
            >
              <InfoIcon className="w-3.5 h-3.5" />
            </Tooltip>
          </div>
          <span className={`text-xl font-bold ${scoreColor}`}>
            {(culturalScore / 100).toFixed(1)}<span className="text-sm text-gray-500">/100</span>
          </span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${scoreBarColor}`}
            style={{ width: `${Math.min(100, culturalScore / 100)}%` }}
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-900/50 rounded-lg p-2.5">
          <div className="flex items-center gap-1 mb-0.5">
            <p className="text-xs text-gray-500">Meme Activity</p>
            <Tooltip
              content={
                <div className="space-y-2">
                  <p className="font-semibold text-white">{METRIC_EXPLANATIONS.memeActivity.title}</p>
                  <p className="text-gray-300">{METRIC_EXPLANATIONS.memeActivity.description}</p>
                  <div className="text-xs text-gray-400">
                    <p className="font-medium mb-1">Sources:</p>
                    {METRIC_EXPLANATIONS.memeActivity.sources.map((s, i) => (
                      <p key={i}>• {s}</p>
                    ))}
                  </div>
                </div>
              }
              position="top"
            >
              <InfoIcon className="w-3 h-3" />
            </Tooltip>
          </div>
          <p className="font-semibold text-white">{memeCount.toLocaleString()}</p>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-2.5">
          <div className="flex items-center gap-1 mb-0.5">
            <p className="text-xs text-gray-500">24h Volume</p>
            <Tooltip
              content={
                <div className="space-y-1">
                  <p className="font-semibold text-white">{METRIC_EXPLANATIONS.volume.title}</p>
                  <p className="text-gray-300">{METRIC_EXPLANATIONS.volume.description}</p>
                  <p className="text-xs text-gray-400">{METRIC_EXPLANATIONS.volume.note}</p>
                </div>
              }
              position="top"
            >
              <InfoIcon className="w-3 h-3" />
            </Tooltip>
          </div>
          <p className="font-semibold text-white">{volume ? formatVolume(volume) : "-"}</p>
        </div>
      </div>

      {/* AI Insight */}
      <div className="bg-purple-900/20 border border-purple-800/30 rounded-lg p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <svg className="w-3.5 h-3.5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" />
          </svg>
          <span className="text-xs text-purple-400 font-medium">AI Insight</span>
        </div>
        <p className="text-sm text-gray-300 line-clamp-2">{insight}</p>
      </div>
    </div>
  );
}
