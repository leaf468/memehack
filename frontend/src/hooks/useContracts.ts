"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, useChainId } from "wagmi";
import { parseEther, formatEther } from "viem";
import { CONTRACTS, ABIS, getContractAddress } from "@/contracts";

/**
 * Hook for reading MemeToken balance
 */
export function useMemeTokenBalance(address?: `0x${string}`) {
  const chainId = useChainId();
  const contractAddress = getContractAddress(chainId, "MemeToken");

  return useReadContract({
    address: contractAddress,
    abi: ABIS.MemeToken,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contractAddress,
    },
  });
}

/**
 * Hook for MemeAnalytics - get token analysis
 */
export function useTokenAnalysis(symbol: string) {
  const chainId = useChainId();
  const contractAddress = getContractAddress(chainId, "MemeAnalytics");

  return useReadContract({
    address: contractAddress,
    abi: ABIS.MemeAnalytics,
    functionName: "tokenAnalyses",
    args: [symbol],
    query: {
      enabled: !!symbol && !!contractAddress,
    },
  });
}

/**
 * Hook for MemePrediction - get current rounds
 */
export function usePredictionRound(roundId: bigint) {
  const chainId = useChainId();
  const contractAddress = getContractAddress(chainId, "MemePrediction");

  return useReadContract({
    address: contractAddress,
    abi: ABIS.MemePrediction,
    functionName: "rounds",
    args: [roundId],
    query: {
      enabled: !!contractAddress,
    },
  });
}

/**
 * Hook for getting active rounds count
 */
export function useActiveRoundsCount() {
  const chainId = useChainId();
  const contractAddress = getContractAddress(chainId, "MemePrediction");

  return useReadContract({
    address: contractAddress,
    abi: ABIS.MemePrediction,
    functionName: "nextRoundId",
    query: {
      enabled: !!contractAddress,
    },
  });
}

/**
 * Hook for placing predictions
 */
export function usePlacePrediction() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const chainId = useChainId();
  const contractAddress = getContractAddress(chainId, "MemePrediction");

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const placePrediction = async (
    roundId: bigint,
    prediction: boolean, // true = yes, false = no
    amount: string // in ETH
  ) => {
    if (!contractAddress) throw new Error("Contract not deployed on this chain");

    writeContract({
      address: contractAddress,
      abi: ABIS.MemePrediction,
      functionName: "placePrediction",
      args: [roundId, prediction],
      value: parseEther(amount),
    });
  };

  return {
    placePrediction,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook for MemeReward - get user profile
 */
export function useUserProfile(address?: `0x${string}`) {
  const chainId = useChainId();
  const contractAddress = getContractAddress(chainId, "MemeReward");

  return useReadContract({
    address: contractAddress,
    abi: ABIS.MemeReward,
    functionName: "profiles",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contractAddress,
    },
  });
}

/**
 * Hook for claiming daily reward
 */
export function useClaimDailyReward() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const chainId = useChainId();
  const contractAddress = getContractAddress(chainId, "MemeReward");

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimReward = async () => {
    if (!contractAddress) throw new Error("Contract not deployed on this chain");

    writeContract({
      address: contractAddress,
      abi: ABIS.MemeReward,
      functionName: "claimDailyReward",
    });
  };

  return {
    claimReward,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Combined hook for all user data
 */
export function useUserData() {
  const { address } = useAccount();
  const chainId = useChainId();

  const { data: balance, isLoading: balanceLoading } = useMemeTokenBalance(address);
  const { data: profile, isLoading: profileLoading } = useUserProfile(address);

  const isContractsAvailable = !!getContractAddress(chainId, "MemeToken");

  return {
    address,
    balance: balance ? formatEther(balance as bigint) : "0",
    profile: profile as {
      totalPoints: bigint;
      correctPredictions: bigint;
      totalPredictions: bigint;
      tier: number;
      lastClaimTime: bigint;
    } | undefined,
    isLoading: balanceLoading || profileLoading,
    isContractsAvailable,
    chainId,
  };
}
