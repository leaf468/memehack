"use client";

import { useState, useEffect } from "react";

interface MemeEntry {
  id: string;
  imageUrl: string;
  caption: string;
  creator: string;
  votes: number;
  timestamp: Date;
  tokenSymbol?: string;
}

// Mock data for demonstration (in production, this would come from a backend/blockchain)
const MOCK_MEMES: MemeEntry[] = [
  {
    id: "1",
    imageUrl: "",
    caption: "When PEPE hits $1",
    creator: "0x1234...5678",
    votes: 156,
    timestamp: new Date(Date.now() - 3600000),
    tokenSymbol: "PEPE",
  },
  {
    id: "2",
    imageUrl: "",
    caption: "Diamond hands checking portfolio",
    creator: "0xabcd...efgh",
    votes: 142,
    timestamp: new Date(Date.now() - 7200000),
    tokenSymbol: "DOGE",
  },
  {
    id: "3",
    imageUrl: "",
    caption: "Me explaining crypto to my parents",
    creator: "0x9876...5432",
    votes: 128,
    timestamp: new Date(Date.now() - 10800000),
    tokenSymbol: "SHIB",
  },
  {
    id: "4",
    imageUrl: "",
    caption: "Paper hands vs Diamond hands",
    creator: "0xfedc...ba98",
    votes: 115,
    timestamp: new Date(Date.now() - 14400000),
    tokenSymbol: "BONK",
  },
  {
    id: "5",
    imageUrl: "",
    caption: "Bought the dip, it keeps dipping",
    creator: "0x2468...1357",
    votes: 98,
    timestamp: new Date(Date.now() - 18000000),
    tokenSymbol: "WIF",
  },
];

const VOTED_KEY = "misp_voted_memes";

export function MemeVoting() {
  const [memes, setMemes] = useState<MemeEntry[]>(MOCK_MEMES);
  const [votedMemes, setVotedMemes] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"hot" | "new" | "top">("hot");
  const [isVoting, setIsVoting] = useState<string | null>(null);

  // Load voted memes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(VOTED_KEY);
    if (saved) {
      setVotedMemes(new Set(JSON.parse(saved)));
    }
  }, []);

  // Save voted memes to localStorage
  const saveVoted = (newVoted: Set<string>) => {
    setVotedMemes(newVoted);
    localStorage.setItem(VOTED_KEY, JSON.stringify([...newVoted]));
  };

  // Vote for a meme
  const vote = async (memeId: string, direction: "up" | "down") => {
    if (votedMemes.has(memeId)) return;

    setIsVoting(memeId);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    setMemes((prev) =>
      prev.map((m) =>
        m.id === memeId
          ? { ...m, votes: m.votes + (direction === "up" ? 1 : -1) }
          : m
      )
    );

    const newVoted = new Set(votedMemes);
    newVoted.add(memeId);
    saveVoted(newVoted);
    setIsVoting(null);
  };

  // Sort memes based on active tab
  const sortedMemes = [...memes].sort((a, b) => {
    switch (activeTab) {
      case "hot":
        // Hot = votes / time decay
        const timeDecayA = (Date.now() - a.timestamp.getTime()) / 3600000;
        const timeDecayB = (Date.now() - b.timestamp.getTime()) / 3600000;
        return b.votes / (timeDecayB + 1) - a.votes / (timeDecayA + 1);
      case "new":
        return b.timestamp.getTime() - a.timestamp.getTime();
      case "top":
        return b.votes - a.votes;
      default:
        return 0;
    }
  });

  // Get time ago string
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

  // Get rank badge
  const getRankBadge = (index: number) => {
    if (index === 0) return { emoji: "🥇", color: "text-yellow-400" };
    if (index === 1) return { emoji: "🥈", color: "text-gray-300" };
    if (index === 2) return { emoji: "🥉", color: "text-orange-400" };
    return { emoji: `#${index + 1}`, color: "text-gray-500" };
  };

  return (
    <div className="bg-gradient-to-br from-orange-900/20 to-red-900/20 rounded-xl p-5 border border-orange-700/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🗳️</span>
          <h3 className="text-lg font-bold text-white">Meme Arena</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-orange-600/30 text-orange-400 px-2 py-1 rounded-full">
            {memes.length} Memes
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(["hot", "new", "top"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-orange-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {tab === "hot" && "🔥 Hot"}
            {tab === "new" && "✨ New"}
            {tab === "top" && "🏆 Top"}
          </button>
        ))}
      </div>

      {/* Meme list */}
      <div className="space-y-3">
        {sortedMemes.map((meme, index) => {
          const rank = getRankBadge(index);
          const hasVoted = votedMemes.has(meme.id);
          const isCurrentlyVoting = isVoting === meme.id;

          return (
            <div
              key={meme.id}
              className={`bg-gray-900 rounded-lg p-4 border transition-colors ${
                hasVoted ? "border-orange-600/30" : "border-gray-700"
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Rank */}
                <div className={`text-xl font-bold ${rank.color} w-8 text-center`}>
                  {rank.emoji}
                </div>

                {/* Meme preview placeholder */}
                <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  {meme.tokenSymbol ? (
                    <span className="text-lg font-bold text-gray-600">
                      ${meme.tokenSymbol.slice(0, 3)}
                    </span>
                  ) : (
                    <span className="text-2xl">🖼️</span>
                  )}
                </div>

                {/* Meme info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{meme.caption}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <span>{meme.creator}</span>
                    <span>•</span>
                    <span>{getTimeAgo(meme.timestamp)}</span>
                    {meme.tokenSymbol && (
                      <>
                        <span>•</span>
                        <span className="text-orange-400">${meme.tokenSymbol}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Voting */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => vote(meme.id, "up")}
                    disabled={hasVoted || isCurrentlyVoting}
                    className={`p-2 rounded-lg transition-colors ${
                      hasVoted
                        ? "bg-orange-600/20 text-orange-400 cursor-not-allowed"
                        : "bg-gray-800 hover:bg-green-600/30 text-gray-400 hover:text-green-400"
                    }`}
                  >
                    {isCurrentlyVoting ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </button>

                  <div className="text-center min-w-[40px]">
                    <p className={`font-bold ${meme.votes > 0 ? "text-green-400" : meme.votes < 0 ? "text-red-400" : "text-gray-400"}`}>
                      {meme.votes}
                    </p>
                  </div>

                  <button
                    onClick={() => vote(meme.id, "down")}
                    disabled={hasVoted || isCurrentlyVoting}
                    className={`p-2 rounded-lg transition-colors ${
                      hasVoted
                        ? "bg-orange-600/20 text-orange-400 cursor-not-allowed"
                        : "bg-gray-800 hover:bg-red-600/30 text-gray-400 hover:text-red-400"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-700">
        <div className="text-center bg-gray-900/50 rounded-lg p-2">
          <p className="text-lg font-bold text-orange-400">
            {memes.reduce((sum, m) => sum + m.votes, 0)}
          </p>
          <p className="text-xs text-gray-500">Total Votes</p>
        </div>
        <div className="text-center bg-gray-900/50 rounded-lg p-2">
          <p className="text-lg font-bold text-green-400">{votedMemes.size}</p>
          <p className="text-xs text-gray-500">Your Votes</p>
        </div>
        <div className="text-center bg-gray-900/50 rounded-lg p-2">
          <p className="text-lg font-bold text-purple-400">
            {new Set(memes.map((m) => m.creator)).size}
          </p>
          <p className="text-xs text-gray-500">Creators</p>
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 bg-gray-900/50 rounded-lg p-3 border border-gray-700">
        <p className="text-xs text-gray-500">
          <span className="text-orange-400">Tip:</span> Vote for the best crypto memes!
          Top memes earn community recognition and potential rewards.
        </p>
      </div>
    </div>
  );
}
