"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { TokenCard } from "./TokenCard";
import { useTokenData } from "@/hooks/useTokenData";
import { formatMarketCap } from "@/services/dexscreener";
import { getMarketAIReport } from "@/services/openai";
import { PriceAlerts } from "./PriceAlerts";
import { MarketSentimentGauge } from "./MarketSentimentGauge";
import { ResponsivenessScore } from "./ResponsivenessScore";
import { Watchlist } from "./Watchlist";
import { PriceComparisonChart } from "./PriceComparisonChart";
import { TokenCorrelation } from "./TokenCorrelation";
import { MemeGenerator } from "./MemeGenerator";
import { ScreenshotToMeme } from "./ScreenshotToMeme";
import { MemeVoting } from "./MemeVoting";
import { MemeTimeline } from "./MemeTimeline";

export function Dashboard() {
  const { isConnected } = useAccount();
  const { insights, report, isLoading, error, lastUpdated, refresh, dataSource } = useTokenData();
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // 실제 AI 리포트 생성
  useEffect(() => {
    async function fetchAIReport() {
      if (insights.length === 0) return;

      setAiLoading(true);
      try {
        const tokenData = insights.map((i) => ({
          symbol: i.symbol,
          name: i.name,
          price: i.priceData.price,
          change24h: i.priceData.change24h,
          volume24h: i.priceData.volume24h,
          marketCap: i.priceData.marketCap,
          sentiment: i.sentimentScore,
          communityScore: i.communityScore,
        }));

        const report = await getMarketAIReport(tokenData);
        setAiReport(report);
      } catch (err) {
        console.error("AI report error:", err);
      } finally {
        setAiLoading(false);
      }
    }

    fetchAIReport();
  }, [insights]);

  // 통계 계산
  const totalMemes = insights.reduce((sum, i) => sum + i.memeCount, 0);
  const avgCulturalScore = insights.length
    ? Math.round(insights.reduce((sum, i) => sum + i.culturalScore, 0) / insights.length / 100)
    : 0;
  const bullishCount = insights.filter(i => i.trend === 2).length;

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Tokens Tracked"
          value={isLoading ? "-" : insights.length.toString()}
          subtitle="Active monitoring"
          color="purple"
        />
        <StatCard
          title="Meme Activity"
          value={isLoading ? "-" : totalMemes.toLocaleString()}
          subtitle="Total mentions"
          color="blue"
        />
        <StatCard
          title="Avg Cultural Score"
          value={isLoading ? "-" : `${avgCulturalScore}`}
          subtitle="Out of 100"
          color="green"
        />
        <StatCard
          title="Market Sentiment"
          value={isLoading ? "-" : `${bullishCount}/${insights.length}`}
          subtitle="Bullish tokens"
          color="orange"
        />
      </div>

      {/* Price Alerts */}
      {!isLoading && insights.length > 0 && (
        <PriceAlerts insights={insights} />
      )}

      {/* Market Intelligence Grid */}
      {!isLoading && insights.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MarketSentimentGauge insights={insights} />
          <ResponsivenessScore insights={insights} />
        </div>
      )}

      {/* Watchlist & Charts */}
      {!isLoading && insights.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Watchlist insights={insights} />
          <PriceComparisonChart insights={insights} />
          <TokenCorrelation insights={insights} />
        </div>
      )}

      {/* Meme Generator */}
      {!isLoading && insights.length > 0 && (
        <MemeGenerator insights={insights} />
      )}

      {/* Screenshot to Meme & Meme Voting */}
      {!isLoading && insights.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ScreenshotToMeme />
          <MemeVoting />
        </div>
      )}

      {/* Meme Timeline */}
      {!isLoading && insights.length > 0 && (
        <MemeTimeline insights={insights} />
      )}

      {/* AI Market Analysis */}
      {(report || aiReport) && (
        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl p-6 border border-purple-700/50">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-purple-600/30 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold">AI Market Analysis</h3>
                <span className="text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded-full">
                  GPT-4o-mini
                </span>
              </div>
              {aiLoading ? (
                <div className="flex items-center gap-2 text-gray-400">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating AI analysis...
                </div>
              ) : (
                <p className="text-gray-100 leading-relaxed whitespace-pre-line">
                  {aiReport || report?.marketSummary}
                </p>
              )}

              {/* Alerts */}
              {report && report.alerts.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {report.alerts.slice(0, 3).map((alert, i) => (
                    <span
                      key={i}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                        alert.severity === "critical"
                          ? "bg-red-600/30 text-red-300 border border-red-600/50"
                          : alert.severity === "warning"
                          ? "bg-yellow-600/30 text-yellow-300 border border-yellow-600/50"
                          : "bg-blue-600/30 text-blue-300 border border-blue-600/50"
                      }`}
                    >
                      {alert.message}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="text-right">
                <p className="text-xs text-gray-500">Last updated</p>
                <p className="text-sm font-mono text-gray-400">
                  {lastUpdated?.toLocaleTimeString() || "-"}
                </p>
              </div>
              <button
                onClick={refresh}
                disabled={isLoading}
                className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 disabled:text-gray-600 transition-colors"
              >
                <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-red-400">Data fetch failed</p>
              <p className="text-sm text-red-400/70">{error}</p>
            </div>
          </div>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Token Analysis Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Token Cultural Analysis</h2>
            <p className="text-sm text-gray-500">Real-time meme coin insights powered by AI</p>
          </div>
          {isLoading && (
            <span className="flex items-center gap-2 text-sm text-gray-400">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading...
            </span>
          )}
        </div>

        {isLoading && insights.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-gray-800 rounded-xl p-5 border border-gray-700 animate-pulse"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-700 rounded-full" />
                  <div>
                    <div className="h-5 bg-gray-700 rounded w-16 mb-1" />
                    <div className="h-3 bg-gray-700 rounded w-24" />
                  </div>
                </div>
                <div className="h-8 bg-gray-700 rounded w-24 mb-4" />
                <div className="h-2 bg-gray-700 rounded w-full mb-4" />
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="h-14 bg-gray-700 rounded" />
                  <div className="h-14 bg-gray-700 rounded" />
                </div>
                <div className="h-16 bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((token) => (
              <TokenCard
                key={token.symbol}
                symbol={token.symbol}
                name={token.priceData?.name || token.symbol}
                culturalScore={token.culturalScore}
                memeCount={token.memeCount}
                trend={token.trend}
                insight={token.insight}
                priceChange={token.priceData.change24h}
                price={token.priceData.price}
                volume={token.priceData.volume24h}
                marketCap={token.priceData.marketCap}
                image={token.priceData.image}
              />
            ))}
          </div>
        )}
      </section>

      {/* Data Sources */}
      <section className="mt-8 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Data Sources (All Real-time APIs)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span className="text-gray-500">Price:</span>
            <span className="text-gray-300">{dataSource.price}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span className="text-gray-500">Social:</span>
            <span className="text-gray-300">{dataSource.social}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span className="text-gray-500">AI:</span>
            <span className="text-gray-300">OpenAI GPT-4o-mini</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  color: "purple" | "blue" | "green" | "orange";
}) {
  const colorClasses = {
    purple: "from-purple-600/20 to-purple-600/5 border-purple-700/50",
    blue: "from-blue-600/20 to-blue-600/5 border-blue-700/50",
    green: "from-green-600/20 to-green-600/5 border-green-700/50",
    orange: "from-orange-600/20 to-orange-600/5 border-orange-700/50",
  };

  const textColors = {
    purple: "text-purple-400",
    blue: "text-blue-400",
    green: "text-green-400",
    orange: "text-orange-400",
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-4 border`}>
      <p className="text-gray-400 text-sm mb-1">{title}</p>
      <p className={`text-2xl font-bold ${textColors[color]}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}
