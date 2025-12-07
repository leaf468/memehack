"use client";

import { useState, useEffect } from "react";
import { TokenInsight } from "@/services/ai-analysis";

interface WatchlistProps {
  insights: TokenInsight[];
}

const WATCHLIST_KEY = "misp_watchlist";

export function Watchlist({ insights }: WatchlistProps) {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(WATCHLIST_KEY);
    if (saved) {
      setWatchlist(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage when watchlist changes
  const saveWatchlist = (newList: string[]) => {
    setWatchlist(newList);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(newList));
  };

  const addToWatchlist = (symbol: string) => {
    if (!watchlist.includes(symbol)) {
      saveWatchlist([...watchlist, symbol]);
    }
  };

  const removeFromWatchlist = (symbol: string) => {
    saveWatchlist(watchlist.filter((s) => s !== symbol));
  };

  const isInWatchlist = (symbol: string) => watchlist.includes(symbol);

  // Get watched tokens data
  const watchedTokens = insights.filter((t) => watchlist.includes(t.symbol));

  return (
    <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 rounded-xl p-5 border border-yellow-700/50">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">⭐</span>
          <h3 className="text-lg font-bold text-white">Watchlist</h3>
          <span className="text-xs bg-yellow-600/30 text-yellow-400 px-2 py-0.5 rounded-full">
            {watchlist.length} tokens
          </span>
        </div>
        <button className="text-gray-400 hover:text-white transition-colors">
          <svg
            className={`w-5 h-5 transform transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          {/* Add tokens dropdown */}
          <div className="flex gap-2">
            <select
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none"
              onChange={(e) => {
                if (e.target.value) {
                  addToWatchlist(e.target.value);
                  e.target.value = "";
                }
              }}
              defaultValue=""
            >
              <option value="" disabled>
                + Add token to watchlist
              </option>
              {insights
                .filter((t) => !isInWatchlist(t.symbol))
                .map((t) => (
                  <option key={t.symbol} value={t.symbol}>
                    {t.symbol} - {t.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Watched tokens list */}
          {watchedTokens.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p className="text-sm">No tokens in watchlist</p>
              <p className="text-xs mt-1">Add tokens to track them here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {watchedTokens.map((token) => (
                <div
                  key={token.symbol}
                  className="flex items-center justify-between bg-gray-900/50 rounded-lg p-3 border border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                      {token.priceData.image ? (
                        <img
                          src={token.priceData.image}
                          alt={token.symbol}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <span className="text-xs font-bold">
                          {token.symbol.slice(0, 2)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-white">${token.symbol}</p>
                      <p className="text-xs text-gray-500">
                        ${token.priceData.price.toFixed(6)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          token.priceData.change24h >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {token.priceData.change24h >= 0 ? "+" : ""}
                        {token.priceData.change24h.toFixed(2)}%
                      </p>
                      <p className="text-xs text-gray-500">
                        Score: {(token.culturalScore / 100).toFixed(0)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromWatchlist(token.symbol)}
                      className="text-gray-500 hover:text-red-400 transition-colors p-1"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick stats for watched tokens */}
          {watchedTokens.length > 0 && (
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-700">
              <div className="text-center">
                <p className="text-lg font-bold text-green-400">
                  {watchedTokens.filter((t) => t.priceData.change24h > 0).length}
                </p>
                <p className="text-xs text-gray-500">Gaining</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-red-400">
                  {watchedTokens.filter((t) => t.priceData.change24h < 0).length}
                </p>
                <p className="text-xs text-gray-500">Losing</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-yellow-400">
                  {(
                    watchedTokens.reduce(
                      (sum, t) => sum + t.priceData.change24h,
                      0
                    ) / watchedTokens.length
                  ).toFixed(1)}
                  %
                </p>
                <p className="text-xs text-gray-500">Avg Change</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Export hook for other components to use
export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(WATCHLIST_KEY);
    if (saved) {
      setWatchlist(JSON.parse(saved));
    }
  }, []);

  const toggle = (symbol: string) => {
    const newList = watchlist.includes(symbol)
      ? watchlist.filter((s) => s !== symbol)
      : [...watchlist, symbol];
    setWatchlist(newList);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(newList));
  };

  const isWatched = (symbol: string) => watchlist.includes(symbol);

  return { watchlist, toggle, isWatched };
}
