"use client";

import { useState, useRef } from "react";
import { useAccount } from "wagmi";
import { ConnectWallet } from "@/components/ConnectWallet";
import { Dashboard } from "@/components/Dashboard";
import { PredictionArena } from "@/components/PredictionArena";
import { UserStats } from "@/components/UserStats";

type TabType = "dashboard" | "predictions" | "profile";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const { isConnected } = useAccount();

  const tabs = [
    { id: "dashboard" as TabType, label: "Dashboard", icon: "📊" },
    { id: "predictions" as TabType, label: "Predictions", icon: "🎯" },
    { id: "profile" as TabType, label: "My Profile", icon: "👤", requiresAuth: true },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <span className="text-xl">🧠</span>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  MISP
                </h1>
                <p className="text-[10px] text-gray-500 leading-tight">
                  Meme Intelligence
                </p>
              </div>
            </div>

            {/* Tab Navigation */}
            <nav className="hidden md:flex items-center bg-gray-800/50 rounded-lg p-1">
              {tabs.map((tab) => {
                const isDisabled = tab.requiresAuth && !isConnected;
                return (
                  <button
                    key={tab.id}
                    onClick={() => !isDisabled && setActiveTab(tab.id)}
                    disabled={isDisabled}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? "bg-purple-600 text-white shadow-lg"
                        : isDisabled
                        ? "text-gray-600 cursor-not-allowed"
                        : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Wallet */}
            <ConnectWallet />
          </div>

          {/* Mobile Tab Navigation */}
          <nav className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto">
            {tabs.map((tab) => {
              const isDisabled = tab.requiresAuth && !isConnected;
              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && setActiveTab(tab.id)}
                  disabled={isDisabled}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? "bg-purple-600 text-white"
                      : isDisabled
                      ? "text-gray-600 cursor-not-allowed"
                      : "text-gray-400 bg-gray-800"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Hero Section - Only on Dashboard */}
      {activeTab === "dashboard" && (
        <section className="relative py-12 overflow-hidden border-b border-gray-800">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent" />
          <div className="max-w-7xl mx-auto px-4 relative">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                  AI-Powered Meme Analytics
                </span>
              </h2>
              <p className="text-gray-400 mb-6">
                Predict meme trends, earn rewards, and unlock cultural intelligence in crypto.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <span className="bg-purple-900/50 text-purple-300 px-3 py-1 rounded-full text-sm border border-purple-700">
                  InfoFi Track
                </span>
                <span className="bg-green-900/50 text-green-300 px-3 py-1 rounded-full text-sm border border-green-700">
                  MemeCore Hackathon
                </span>
                <span className="bg-orange-900/50 text-orange-300 px-3 py-1 rounded-full text-sm border border-orange-700">
                  AI-Driven
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === "dashboard" && <Dashboard />}

        {activeTab === "predictions" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Prediction Arena</h2>
                <p className="text-gray-400 text-sm">
                  Predict meme token cultural scores and earn rewards
                </p>
              </div>
              {!isConnected && (
                <div className="bg-yellow-900/30 border border-yellow-700 px-4 py-2 rounded-lg">
                  <p className="text-yellow-400 text-sm">Connect wallet to participate</p>
                </div>
              )}
            </div>
            <PredictionArena />
          </div>
        )}

        {activeTab === "profile" && (
          <div className="space-y-6">
            {isConnected ? (
              <>
                <div>
                  <h2 className="text-2xl font-bold">My Profile</h2>
                  <p className="text-gray-400 text-sm">
                    Track your predictions, rewards, and tier progress
                  </p>
                </div>
                <UserStats />
              </>
            ) : (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">🔒</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Connect Your Wallet</h3>
                <p className="text-gray-400 mb-6">
                  Connect your wallet to view your profile and stats
                </p>
                <ConnectWallet />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🧠</span>
              <span className="text-gray-500 text-sm">MISP - Meme Intelligence Social Platform</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Built for Memekathon Seoul 2025</span>
              <span className="text-purple-400">InfoFi Track</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
