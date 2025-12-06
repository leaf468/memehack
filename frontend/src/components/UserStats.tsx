"use client";

import { useAccount, useChainId } from "wagmi";
import { formatEther } from "viem";
import { useUserData, useClaimDailyReward, useMemeTokenBalance } from "@/hooks/useContracts";
import { getContractAddress } from "@/contracts";

const TIER_NAMES = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"];

export function UserStats() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { profile, balance, isContractsAvailable, isLoading } = useUserData();
  const { claimReward, isPending, isConfirming, isSuccess, error } = useClaimDailyReward();

  // Calculate stats from on-chain data or use fallback
  const totalPredictions = profile ? Number(profile.totalPredictions) : 47;
  const correctPredictions = profile ? Number(profile.correctPredictions) : 32;
  const tier = profile ? profile.tier : 2;
  const totalPoints = profile ? Number(profile.totalPoints) : 1250;

  const winRate = totalPredictions > 0
    ? ((correctPredictions / totalPredictions) * 100).toFixed(1)
    : "0";

  const tierColors: Record<string, string> = {
    Bronze: "text-orange-400",
    Silver: "text-gray-300",
    Gold: "text-yellow-400",
    Platinum: "text-cyan-400",
    Diamond: "text-purple-400",
  };

  const currentTierName = TIER_NAMES[tier] || "Bronze";
  const nextTierName = TIER_NAMES[tier + 1] || "Diamond";

  // Calculate tier progress (simplified)
  const tierThresholds = [0, 100, 500, 1000, 5000];
  const currentThreshold = tierThresholds[tier] || 0;
  const nextThreshold = tierThresholds[tier + 1] || tierThresholds[tier];
  const tierProgress = Math.min(100, ((totalPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100);

  const handleClaimReward = async () => {
    try {
      await claimReward();
    } catch (err) {
      console.error("Failed to claim reward:", err);
    }
  };

  // Check if user can claim (last claim was more than 24 hours ago)
  const canClaim = profile
    ? profile.lastClaimTime === BigInt(0) ||
      Date.now() / 1000 >= Number(profile.lastClaimTime) + 86400
    : true;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Profile Card */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl">
            {isContractsAvailable ? "🎮" : "🎭"}
          </div>
          <div>
            <p className="text-gray-400 text-sm">Wallet</p>
            <p className="font-mono">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
            <p className={`font-bold ${tierColors[currentTierName]}`}>
              {currentTierName} Tier
              {!isContractsAvailable && <span className="text-xs text-gray-500 ml-2">(Demo)</span>}
            </p>
          </div>
        </div>

        {/* Tier Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Tier Progress</span>
            <span>{tierProgress.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${
                tier === 0 ? "from-orange-500 to-orange-300" :
                tier === 1 ? "from-gray-400 to-gray-200" :
                tier === 2 ? "from-yellow-500 to-yellow-300" :
                tier === 3 ? "from-cyan-500 to-cyan-300" :
                "from-purple-500 to-purple-300"
              }`}
              style={{ width: `${tierProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {tier < 4
              ? `${nextThreshold - totalPoints} more points to ${nextTierName}`
              : "Maximum tier reached!"
            }
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900 rounded-lg p-3">
            <p className="text-gray-400 text-xs">MEME Balance</p>
            <p className="text-xl font-bold text-green-400">
              {isLoading ? "..." : parseFloat(balance).toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-900 rounded-lg p-3">
            <p className="text-gray-400 text-xs">Win Rate</p>
            <p className="text-xl font-bold">
              {winRate}%
            </p>
          </div>
        </div>
      </div>

      {/* Prediction Stats */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-bold mb-4">
          Prediction History
          {isContractsAvailable && (
            <span className="text-xs text-green-400 ml-2 font-normal">
              On-chain
            </span>
          )}
        </h3>

        <div className="space-y-4">
          {/* Win/Loss Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-green-400">
                Wins: {correctPredictions}
              </span>
              <span className="text-red-400">
                Losses: {totalPredictions - correctPredictions}
              </span>
            </div>
            <div className="h-4 bg-gray-700 rounded-full overflow-hidden flex">
              <div
                className="bg-green-500 h-full transition-all duration-300"
                style={{
                  width: totalPredictions > 0
                    ? `${(correctPredictions / totalPredictions) * 100}%`
                    : "50%",
                }}
              />
              <div
                className="bg-red-500 h-full transition-all duration-300"
                style={{
                  width: totalPredictions > 0
                    ? `${((totalPredictions - correctPredictions) / totalPredictions) * 100}%`
                    : "50%",
                }}
              />
            </div>
          </div>

          {/* Points Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-gray-400 text-xs mb-1">Total Points</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-purple-400">
                  {totalPoints.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-gray-400 text-xs mb-1">Total Predictions</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  {totalPredictions}
                </span>
              </div>
            </div>
          </div>

          {/* Daily Reward Button */}
          {isContractsAvailable ? (
            <button
              onClick={handleClaimReward}
              disabled={isPending || isConfirming || !canClaim}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Confirming..." :
               isConfirming ? "Processing..." :
               isSuccess ? "Claimed!" :
               !canClaim ? "Already Claimed Today" :
               "Claim Daily Reward"}
            </button>
          ) : (
            <button
              className="w-full py-3 bg-gradient-to-r from-gray-600 to-gray-500 rounded-lg font-semibold cursor-not-allowed opacity-75"
              disabled
            >
              Connect to MemeCore to Claim
            </button>
          )}

          {error && (
            <p className="text-red-400 text-xs text-center">
              {error.message.slice(0, 60)}...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
