"use client";

import { useState, useMemo } from "react";
import { TokenInsight } from "@/services/ai-analysis";

interface MemeTimelineProps {
  insights: TokenInsight[];
}

interface TimelineEvent {
  id: string;
  type: "meme_peak" | "viral" | "price_pump" | "community_milestone" | "trend_change";
  title: string;
  description: string;
  tokenSymbol: string;
  timestamp: Date;
  impact: "high" | "medium" | "low";
  metrics?: {
    priceChange?: number;
    memeCount?: number;
    viralScore?: number;
  };
}

// Generate timeline events from token data
const generateTimelineEvents = (insights: TokenInsight[]): TimelineEvent[] => {
  const events: TimelineEvent[] = [];
  const now = Date.now();

  insights.forEach((token) => {
    // Price pump events
    if (token.priceData.change24h > 15) {
      events.push({
        id: `pump-${token.symbol}`,
        type: "price_pump",
        title: `${token.symbol} Pumping!`,
        description: `${token.symbol} surged ${token.priceData.change24h.toFixed(1)}% in 24 hours`,
        tokenSymbol: token.symbol,
        timestamp: new Date(now - Math.random() * 12 * 3600000),
        impact: token.priceData.change24h > 30 ? "high" : "medium",
        metrics: {
          priceChange: token.priceData.change24h,
        },
      });
    }

    // Meme activity peaks
    if (token.memeCount > 100) {
      events.push({
        id: `meme-${token.symbol}`,
        type: "meme_peak",
        title: `${token.symbol} Meme Explosion`,
        description: `${token.memeCount} memes created in the last 24h`,
        tokenSymbol: token.symbol,
        timestamp: new Date(now - Math.random() * 8 * 3600000),
        impact: token.memeCount > 500 ? "high" : "medium",
        metrics: {
          memeCount: token.memeCount,
        },
      });
    }

    // Viral moments
    if (token.culturalScore > 7000) {
      events.push({
        id: `viral-${token.symbol}`,
        type: "viral",
        title: `${token.symbol} Going Viral`,
        description: `Cultural score reached ${(token.culturalScore / 100).toFixed(0)}/100`,
        tokenSymbol: token.symbol,
        timestamp: new Date(now - Math.random() * 6 * 3600000),
        impact: "high",
        metrics: {
          viralScore: token.culturalScore / 100,
        },
      });
    }

    // Trend changes
    if (token.trend === 2) {
      events.push({
        id: `trend-${token.symbol}`,
        type: "trend_change",
        title: `${token.symbol} Turning Bullish`,
        description: `Sentiment shifted to bullish with strong momentum`,
        tokenSymbol: token.symbol,
        timestamp: new Date(now - Math.random() * 4 * 3600000),
        impact: "medium",
      });
    }

    // Community milestones
    if (token.communityScore && token.communityScore > 70) {
      events.push({
        id: `community-${token.symbol}`,
        type: "community_milestone",
        title: `${token.symbol} Community Active`,
        description: `Community engagement score: ${token.communityScore}/100`,
        tokenSymbol: token.symbol,
        timestamp: new Date(now - Math.random() * 10 * 3600000),
        impact: "low",
      });
    }
  });

  // Sort by timestamp (newest first)
  return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export function MemeTimeline({ insights }: MemeTimelineProps) {
  const [filter, setFilter] = useState<"all" | TimelineEvent["type"]>("all");

  const events = useMemo(() => generateTimelineEvents(insights), [insights]);

  const filteredEvents = useMemo(() => {
    if (filter === "all") return events;
    return events.filter((e) => e.type === filter);
  }, [events, filter]);

  const getEventIcon = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "meme_peak":
        return "🎭";
      case "viral":
        return "🔥";
      case "price_pump":
        return "🚀";
      case "community_milestone":
        return "👥";
      case "trend_change":
        return "📈";
      default:
        return "📌";
    }
  };

  const getEventColor = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "meme_peak":
        return "border-purple-500 bg-purple-900/30";
      case "viral":
        return "border-red-500 bg-red-900/30";
      case "price_pump":
        return "border-green-500 bg-green-900/30";
      case "community_milestone":
        return "border-blue-500 bg-blue-900/30";
      case "trend_change":
        return "border-yellow-500 bg-yellow-900/30";
      default:
        return "border-gray-500 bg-gray-900/30";
    }
  };

  const getImpactBadge = (impact: TimelineEvent["impact"]) => {
    switch (impact) {
      case "high":
        return "bg-red-600/30 text-red-400 border-red-600/50";
      case "medium":
        return "bg-yellow-600/30 text-yellow-400 border-yellow-600/50";
      case "low":
        return "bg-gray-600/30 text-gray-400 border-gray-600/50";
    }
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const filterOptions: { value: "all" | TimelineEvent["type"]; label: string; icon: string }[] = [
    { value: "all", label: "All", icon: "🌐" },
    { value: "viral", label: "Viral", icon: "🔥" },
    { value: "price_pump", label: "Pumps", icon: "🚀" },
    { value: "meme_peak", label: "Memes", icon: "🎭" },
    { value: "trend_change", label: "Trends", icon: "📈" },
    { value: "community_milestone", label: "Community", icon: "👥" },
  ];

  return (
    <div className="bg-gradient-to-br from-indigo-900/20 to-violet-900/20 rounded-xl p-5 border border-indigo-700/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📜</span>
          <h3 className="text-lg font-bold text-white">Meme Timeline</h3>
        </div>
        <span className="text-xs bg-indigo-600/30 text-indigo-400 px-2 py-1 rounded-full">
          {events.length} Events
        </span>
      </div>

      {/* Filters */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              filter === option.value
                ? "bg-indigo-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {option.icon} {option.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-700" />

        {/* Events */}
        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No events matching this filter</p>
            </div>
          ) : (
            filteredEvents.slice(0, 10).map((event, index) => (
              <div key={event.id} className="relative pl-10">
                {/* Timeline dot */}
                <div
                  className={`absolute left-2 w-5 h-5 rounded-full flex items-center justify-center text-xs border-2 ${getEventColor(
                    event.type
                  )}`}
                >
                  {getEventIcon(event.type)}
                </div>

                {/* Event card */}
                <div
                  className={`rounded-lg p-3 border ${getEventColor(event.type)}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm">
                          {event.title}
                        </h4>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded border ${getImpactBadge(
                            event.impact
                          )}`}
                        >
                          {event.impact}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {event.description}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-500">
                        {getTimeAgo(event.timestamp)}
                      </p>
                      <p className="text-xs font-bold text-indigo-400 mt-1">
                        ${event.tokenSymbol}
                      </p>
                    </div>
                  </div>

                  {/* Metrics */}
                  {event.metrics && (
                    <div className="flex gap-3 mt-2 pt-2 border-t border-gray-700">
                      {event.metrics.priceChange !== undefined && (
                        <div className="text-xs">
                          <span className="text-gray-500">Price: </span>
                          <span
                            className={
                              event.metrics.priceChange >= 0
                                ? "text-green-400"
                                : "text-red-400"
                            }
                          >
                            {event.metrics.priceChange >= 0 ? "+" : ""}
                            {event.metrics.priceChange.toFixed(1)}%
                          </span>
                        </div>
                      )}
                      {event.metrics.memeCount !== undefined && (
                        <div className="text-xs">
                          <span className="text-gray-500">Memes: </span>
                          <span className="text-purple-400">
                            {event.metrics.memeCount}
                          </span>
                        </div>
                      )}
                      {event.metrics.viralScore !== undefined && (
                        <div className="text-xs">
                          <span className="text-gray-500">Viral: </span>
                          <span className="text-red-400">
                            {event.metrics.viralScore.toFixed(0)}/100
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-gray-700">
        <div className="text-center bg-gray-900/50 rounded-lg p-2">
          <p className="text-lg font-bold text-red-400">
            {events.filter((e) => e.type === "viral").length}
          </p>
          <p className="text-xs text-gray-500">Viral</p>
        </div>
        <div className="text-center bg-gray-900/50 rounded-lg p-2">
          <p className="text-lg font-bold text-green-400">
            {events.filter((e) => e.type === "price_pump").length}
          </p>
          <p className="text-xs text-gray-500">Pumps</p>
        </div>
        <div className="text-center bg-gray-900/50 rounded-lg p-2">
          <p className="text-lg font-bold text-purple-400">
            {events.filter((e) => e.type === "meme_peak").length}
          </p>
          <p className="text-xs text-gray-500">Meme Peaks</p>
        </div>
        <div className="text-center bg-gray-900/50 rounded-lg p-2">
          <p className="text-lg font-bold text-yellow-400">
            {events.filter((e) => e.impact === "high").length}
          </p>
          <p className="text-xs text-gray-500">High Impact</p>
        </div>
      </div>
    </div>
  );
}
