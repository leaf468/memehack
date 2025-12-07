"use client";

import { useState, useEffect, useMemo } from "react";
import { useAccount, useChainId } from "wagmi";
import { useActiveRoundsCount, usePlacePrediction } from "@/hooks/useContracts";
import { getContractAddress } from "@/contracts";
import { useTokenData } from "@/hooks/useTokenData";
import { Tooltip, InfoIcon } from "./Tooltip";

interface PredictionRound {
  id: number;
  tokenSymbol: string;
  initialScore: number;
  endTime: number;
  totalUpStake: string;
  totalDownStake: string;
  status: "open" | "closed" | "resolved";
  isFromContract: boolean;
  predictionType?: "score_up" | "viral" | "price_target";
  targetValue?: number;
  participants?: number;
}

// Enhanced mock data with more variety
const MOCK_ROUNDS: PredictionRound[] = [
  {
    id: 1,
    tokenSymbol: "WIF",
    initialScore: 8500,
    endTime: Date.now() + 3600000,
    totalUpStake: "2.5",
    totalDownStake: "1.8",
    status: "open",
    isFromContract: false,
    predictionType: "score_up",
    participants: 47,
  },
  {
    id: 2,
    tokenSymbol: "PEPE",
    initialScore: 9200,
    endTime: Date.now() + 7200000,
    totalUpStake: "5.2",
    totalDownStake: "3.1",
    status: "open",
    isFromContract: false,
    predictionType: "viral",
    participants: 89,
  },
  {
    id: 3,
    tokenSymbol: "DOGE",
    initialScore: 7800,
    endTime: Date.now() + 1800000,
    totalUpStake: "1.2",
    totalDownStake: "2.4",
    status: "open",
    isFromContract: false,
    predictionType: "score_up",
    participants: 156,
  },
];

// Mock leaderboard data
const MOCK_LEADERBOARD = [
  { rank: 1, address: "0x1234...5678", winRate: 78, totalPredictions: 45, earnings: "12.5 ETH" },
  { rank: 2, address: "0xabcd...ef01", winRate: 72, totalPredictions: 38, earnings: "8.2 ETH" },
  { rank: 3, address: "0x9876...5432", winRate: 68, totalPredictions: 52, earnings: "6.8 ETH" },
  { rank: 4, address: "0xfedc...ba98", winRate: 65, totalPredictions: 29, earnings: "4.1 ETH" },
  { rank: 5, address: "0x5555...6666", winRate: 62, totalPredictions: 41, earnings: "3.5 ETH" },
];

// Mock past predictions (resolved)
const MOCK_PAST_PREDICTIONS = [
  { id: 101, tokenSymbol: "SHIB", result: "up", finalScore: 7850, winners: 234, pool: "15.2 ETH" },
  { id: 102, tokenSymbol: "BONK", result: "down", finalScore: 6200, winners: 156, pool: "8.7 ETH" },
  { id: 103, tokenSymbol: "FLOKI", result: "up", finalScore: 8100, winners: 89, pool: "5.4 ETH" },
];

export function PredictionArena() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const isContractAvailable = !!getContractAddress(chainId, "MemePrediction");
  const { insights } = useTokenData();
  const [activeTab, setActiveTab] = useState<"live" | "past" | "leaderboard">("live");

  const { data: roundCount } = useActiveRoundsCount();
  const [rounds, setRounds] = useState<PredictionRound[]>(MOCK_ROUNDS);
  const [userPredictions, setUserPredictions] = useState<Record<number, { direction: "up" | "down"; amount: string }>>({});

  // Generate dynamic rounds from real token data
  useEffect(() => {
    if (insights.length > 0) {
      const dynamicRounds: PredictionRound[] = insights.slice(0, 6).map((token, index) => ({
        id: index + 1,
        tokenSymbol: token.symbol,
        initialScore: token.culturalScore,
        endTime: Date.now() + (1 + index) * 1800000, // 30min intervals
        totalUpStake: (Math.random() * 5 + 0.5).toFixed(2),
        totalDownStake: (Math.random() * 5 + 0.5).toFixed(2),
        status: "open" as const,
        isFromContract: isContractAvailable,
      }));
      setRounds(dynamicRounds);
    }
  }, [insights, isContractAvailable]);

  const handlePredictionMade = (roundId: number, direction: "up" | "down", amount: string) => {
    setUserPredictions(prev => ({
      ...prev,
      [roundId]: { direction, amount }
    }));
  };

  // Calculate user stats
  const totalPredictions = Object.keys(userPredictions).length;
  const totalStaked = Object.values(userPredictions).reduce((sum, p) => sum + parseFloat(p.amount), 0);

  return (
    <div className="space-y-6">
      {/* How it works */}
      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-5 border border-purple-700/50">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-purple-600/30 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2 text-gray-100">How Prediction Arena Works</h3>
            <ul className="text-sm text-gray-200 space-y-1">
              <li>1. Choose a meme coin and predict if its Cultural Score will go UP or DOWN</li>
              <li>2. Stake ETH on your prediction before the round ends</li>
              <li>3. Winners split the pool proportionally to their stake</li>
              <li>4. Scores are resolved based on real-time social + market data</li>
            </ul>
          </div>
        </div>
      </div>

      {/* User Stats */}
      {totalPredictions > 0 && (
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h4 className="text-sm text-gray-400 mb-3">Your Active Predictions</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-2xl font-bold text-purple-400">{totalPredictions}</p>
              <p className="text-xs text-gray-500">Predictions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-400">{totalStaked.toFixed(3)} ETH</p>
              <p className="text-xs text-gray-500">Total Staked</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">-</p>
              <p className="text-xs text-gray-500">Win Rate</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400">-</p>
              <p className="text-xs text-gray-500">Total Earnings</p>
            </div>
          </div>
        </div>
      )}

      {/* Connection Status */}
      {isContractAvailable ? (
        <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-400 text-sm">
            Connected to MemeCore (Chain ID: {chainId}) - Live predictions enabled
          </span>
        </div>
      ) : (
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-yellow-400 rounded-full" />
          <span className="text-yellow-400 text-sm">
            Demo Mode - Connect wallet to MemeCore Testnet for live predictions
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        {[
          { id: "live" as const, label: "Live Rounds", icon: "🔴" },
          { id: "past" as const, label: "Past Results", icon: "📊" },
          { id: "leaderboard" as const, label: "Leaderboard", icon: "🏆" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-purple-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Live Predictions */}
      {activeTab === "live" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rounds.map((round) => (
            <PredictionCard
              key={round.id}
              round={round}
              isConnected={isConnected}
              isContractAvailable={isContractAvailable}
              userPrediction={userPredictions[round.id]}
              onPredictionMade={handlePredictionMade}
            />
          ))}
        </div>
      )}

      {/* Past Predictions */}
      {activeTab === "past" && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-200">Recently Resolved Predictions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MOCK_PAST_PREDICTIONS.map((pred) => (
              <div
                key={pred.id}
                className="bg-gray-800 rounded-xl p-5 border border-gray-700"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xl font-bold">${pred.tokenSymbol}</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-bold ${
                      pred.result === "up"
                        ? "bg-green-900/50 text-green-400 border border-green-700"
                        : "bg-red-900/50 text-red-400 border border-red-700"
                    }`}
                  >
                    {pred.result === "up" ? "UP" : "DOWN"}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Final Score</span>
                    <span className="text-white">{(pred.finalScore / 100).toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Winners</span>
                    <span className="text-green-400">{pred.winners}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Pool</span>
                    <span className="text-purple-400">{pred.pool}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {activeTab === "leaderboard" && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-200">Top Predictors</h3>
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr className="text-left text-sm text-gray-400">
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Win Rate</th>
                  <th className="px-4 py-3">Predictions</th>
                  <th className="px-4 py-3">Earnings</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_LEADERBOARD.map((user) => (
                  <tr
                    key={user.rank}
                    className="border-t border-gray-700 hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`font-bold ${
                          user.rank === 1
                            ? "text-yellow-400"
                            : user.rank === 2
                            ? "text-gray-300"
                            : user.rank === 3
                            ? "text-orange-400"
                            : "text-gray-400"
                        }`}
                      >
                        #{user.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">{user.address}</td>
                    <td className="px-4 py-3">
                      <span className="text-green-400">{user.winRate}%</span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{user.totalPredictions}</td>
                    <td className="px-4 py-3 text-purple-400 font-medium">{user.earnings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 text-center">
            Leaderboard updates daily based on prediction accuracy
          </p>
        </div>
      )}
    </div>
  );
}

function PredictionCard({
  round,
  isConnected,
  isContractAvailable,
  userPrediction,
  onPredictionMade,
}: {
  round: PredictionRound;
  isConnected: boolean;
  isContractAvailable: boolean;
  userPrediction?: { direction: "up" | "down"; amount: string };
  onPredictionMade: (roundId: number, direction: "up" | "down", amount: string) => void;
}) {
  const [stakeAmount, setStakeAmount] = useState("0.1");
  const [selectedDirection, setSelectedDirection] = useState<"up" | "down" | null>(
    userPrediction?.direction || null
  );

  const { placePrediction, isPending, isConfirming, isSuccess, error } = usePlacePrediction();

  const timeLeft = Math.max(0, round.endTime - Date.now());
  const hours = Math.floor(timeLeft / 3600000);
  const minutes = Math.floor((timeLeft % 3600000) / 60000);

  const totalPool = parseFloat(round.totalUpStake) + parseFloat(round.totalDownStake);
  const upPercentage = totalPool > 0
    ? ((parseFloat(round.totalUpStake) / totalPool) * 100).toFixed(1)
    : "50";
  const downPercentage = totalPool > 0
    ? ((parseFloat(round.totalDownStake) / totalPool) * 100).toFixed(1)
    : "50";

  const handlePredict = async (direction: "up" | "down") => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    if (userPrediction) {
      alert("You already placed a prediction on this round!");
      return;
    }

    setSelectedDirection(direction);

    if (isContractAvailable) {
      try {
        await placePrediction(
          BigInt(round.id),
          direction === "up",
          stakeAmount
        );
        onPredictionMade(round.id, direction, stakeAmount);
      } catch (err) {
        console.error("Prediction failed:", err);
      }
    } else {
      // Demo mode - simulate success
      console.log(`[Demo] Predicting ${direction} for round ${round.id} with ${stakeAmount} ETH`);
      onPredictionMade(round.id, direction, stakeAmount);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xl font-bold">${round.tokenSymbol}</span>
          <p className="text-sm text-gray-400">Round #{round.id}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Time Left</p>
          <p className="text-lg font-mono text-purple-400">
            {hours}h {minutes}m
          </p>
        </div>
      </div>

      {/* Current Score */}
      <div className="bg-gray-900 rounded-lg p-4 mb-4">
        <p className="text-sm text-gray-400 mb-1">Initial Cultural Score</p>
        <p className="text-2xl font-bold text-white">
          {(round.initialScore / 100).toFixed(1)}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Predict: Will it go UP or DOWN?
        </p>
      </div>

      {/* Pool Distribution */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-green-400">UP: {round.totalUpStake} ETH</span>
          <span className="text-red-400">DOWN: {round.totalDownStake} ETH</span>
        </div>
        <div className="h-3 bg-gray-700 rounded-full overflow-hidden flex">
          <div
            className="bg-green-500 h-full transition-all duration-300"
            style={{ width: `${upPercentage}%` }}
          />
          <div
            className="bg-red-500 h-full transition-all duration-300"
            style={{ width: `${downPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{upPercentage}%</span>
          <span>{downPercentage}%</span>
        </div>
      </div>

      {/* Stake Input */}
      <div className="mb-4">
        <label className="text-sm text-gray-400 block mb-2">Stake Amount</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            min="0.001"
            step="0.01"
            className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
          />
          <span className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-gray-400">
            ETH
          </span>
        </div>
      </div>

      {/* Status Messages */}
      {isPending && (
        <div className="mb-3 text-center text-sm text-purple-400">
          Confirm transaction in wallet...
        </div>
      )}
      {isConfirming && (
        <div className="mb-3 text-center text-sm text-yellow-400">
          Transaction confirming...
        </div>
      )}
      {isSuccess && (
        <div className="mb-3 text-center text-sm text-green-400">
          Prediction placed successfully!
        </div>
      )}
      {error && (
        <div className="mb-3 text-center text-sm text-red-400">
          Error: {error.message.slice(0, 50)}...
        </div>
      )}

      {/* Prediction Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handlePredict("up")}
          disabled={!isConnected || isPending || isConfirming}
          className={`py-3 rounded-lg font-semibold transition-colors ${
            selectedDirection === "up"
              ? "bg-green-600"
              : "bg-green-600/20 hover:bg-green-600/40 border border-green-600"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          UP
        </button>
        <button
          onClick={() => handlePredict("down")}
          disabled={!isConnected || isPending || isConfirming}
          className={`py-3 rounded-lg font-semibold transition-colors ${
            selectedDirection === "down"
              ? "bg-red-600"
              : "bg-red-600/20 hover:bg-red-600/40 border border-red-600"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          DOWN
        </button>
      </div>

      {/* User's Prediction */}
      {userPrediction && (
        <div className={`mt-3 p-3 rounded-lg border ${
          userPrediction.direction === "up"
            ? "bg-green-900/20 border-green-700/50"
            : "bg-red-900/20 border-red-700/50"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Your Prediction</span>
            <span className={`font-bold ${
              userPrediction.direction === "up" ? "text-green-400" : "text-red-400"
            }`}>
              {userPrediction.direction.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Staked: {userPrediction.amount} ETH
          </p>
        </div>
      )}

      {!isConnected && (
        <p className="text-center text-sm text-gray-500 mt-3">
          Connect wallet to participate
        </p>
      )}
    </div>
  );
}
