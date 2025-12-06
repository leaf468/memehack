"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [showDropdown, setShowDropdown] = useState(false);

  // MemeCore local chain ID
  const MEMECORE_CHAIN_ID = 31337;

  if (isConnected) {
    const isCorrectChain = chainId === MEMECORE_CHAIN_ID;

    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isCorrectChain
              ? "bg-green-600/20 border border-green-600 text-green-400"
              : "bg-yellow-600/20 border border-yellow-600 text-yellow-400"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isCorrectChain ? "bg-green-400" : "bg-yellow-400"}`} />
          <span className="font-mono">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
            <div className="p-3 border-b border-gray-700">
              <p className="text-xs text-gray-400">Connected Wallet</p>
              <p className="font-mono text-sm truncate">{address}</p>
            </div>

            <div className="p-3 border-b border-gray-700">
              <p className="text-xs text-gray-400">Network</p>
              <p className={`text-sm ${isCorrectChain ? "text-green-400" : "text-yellow-400"}`}>
                {isCorrectChain ? "MemeCore (Local)" : `Chain ID: ${chainId}`}
              </p>
              {!isCorrectChain && (
                <button
                  onClick={() => switchChain?.({ chainId: MEMECORE_CHAIN_ID })}
                  className="mt-2 w-full text-xs bg-purple-600 hover:bg-purple-700 px-3 py-1.5 rounded transition-colors"
                >
                  Switch to MemeCore
                </button>
              )}
            </div>

            <div className="p-2">
              <button
                onClick={() => {
                  disconnect();
                  setShowDropdown(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-700 rounded transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        const injectedConnector = connectors.find(c => c.id === "injected");
        if (injectedConnector) {
          connect({ connector: injectedConnector });
        }
      }}
      disabled={isPending}
      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 rounded-lg text-sm font-semibold transition-all shadow-lg hover:shadow-purple-500/25"
    >
      {isPending ? (
        <>
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span>Connect Wallet</span>
        </>
      )}
    </button>
  );
}
