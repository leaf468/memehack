"use client";

import { useState, useEffect } from "react";
import { useAccount, useChainId } from "wagmi";
import { formatEther } from "viem";
import { useActiveRoundsCount, usePredictionRound, usePlacePrediction } from "@/hooks/useContracts";
import { getContractAddress } from "@/contracts";

interface PredictionRound {
  id: number;
  tokenSymbol: string;
  initialScore: number;
  endTime: number;
  totalUpStake: string;
  totalDownStake: string;
  status: "open" | "closed" | "resolved";
  isFromContract: boolean;
}

// Fallback mock data when contracts not available
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
  },
];

export function PredictionArena() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const isContractAvailable = !!getContractAddress(chainId, "MemePrediction");

  const { data: roundCount } = useActiveRoundsCount();
  const [rounds, setRounds] = useState<PredictionRound[]>(MOCK_ROUNDS);

  // Fetch on-chain rounds when available
  useEffect(() => {
    if (isContractAvailable && roundCount) {
      // For now, still show mock rounds but indicate chain status
      setRounds(MOCK_ROUNDS.map(r => ({ ...r, isFromContract: false })));
    }
  }, [isContractAvailable, roundCount]);

  return (
    <div>
      {isContractAvailable && (
        <div className="mb-4 bg-green-900/30 border border-green-700 rounded-lg p-3 flex items-center gap-2">
          <span className="text-green-400 text-sm">
            Connected to MemeCore (Chain ID: {chainId})
          </span>
        </div>
      )}

      {!isContractAvailable && (
        <div className="mb-4 bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 flex items-center gap-2">
          <span className="text-yellow-400 text-sm">
            Demo mode - Connect to MemeCore network for live predictions
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rounds.map((round) => (
          <PredictionCard
            key={round.id}
            round={round}
            isConnected={isConnected}
            isContractAvailable={isContractAvailable}
          />
        ))}
      </div>
    </div>
  );
}

function PredictionCard({
  round,
  isConnected,
  isContractAvailable,
}: {
  round: PredictionRound;
  isConnected: boolean;
  isContractAvailable: boolean;
}) {
  const [stakeAmount, setStakeAmount] = useState("0.1");
  const [selectedDirection, setSelectedDirection] = useState<"up" | "down" | null>(null);

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

    setSelectedDirection(direction);

    if (isContractAvailable) {
      try {
        await placePrediction(
          BigInt(round.id),
          direction === "up",
          stakeAmount
        );
      } catch (err) {
        console.error("Prediction failed:", err);
      }
    } else {
      // Demo mode
      console.log(`[Demo] Predicting ${direction} for round ${round.id} with ${stakeAmount} ETH`);
      alert(`Demo: You predicted ${direction.toUpperCase()} with ${stakeAmount} ETH`);
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

      {!isConnected && (
        <p className="text-center text-sm text-gray-500 mt-3">
          Connect wallet to participate
        </p>
      )}
    </div>
  );
}
