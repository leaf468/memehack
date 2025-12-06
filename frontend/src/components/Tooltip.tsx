"use client";

import { useState, useRef, useEffect, ReactNode } from "react";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ content, children, position = "top" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      let x = 0;
      let y = 0;

      switch (position) {
        case "top":
          x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          y = triggerRect.top - tooltipRect.height - 8;
          break;
        case "bottom":
          x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          y = triggerRect.bottom + 8;
          break;
        case "left":
          x = triggerRect.left - tooltipRect.width - 8;
          y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          break;
        case "right":
          x = triggerRect.right + 8;
          y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          break;
      }

      // Keep tooltip within viewport
      x = Math.max(8, Math.min(x, window.innerWidth - tooltipRect.width - 8));
      y = Math.max(8, Math.min(y, window.innerHeight - tooltipRect.height - 8));

      setCoords({ x, y });
    }
  }, [isVisible, position]);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="inline-flex items-center cursor-help"
      >
        {children}
      </div>
      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-50 px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-w-xs"
          style={{ left: coords.x, top: coords.y }}
        >
          {content}
        </div>
      )}
    </>
  );
}

// Info icon for tooltips
export function InfoIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={`${className} text-gray-500 hover:text-gray-400 transition-colors`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

// Metric explanations
export const METRIC_EXPLANATIONS = {
  culturalScore: {
    title: "Cultural Impact Score",
    description: "A composite score (0-100) measuring the token's cultural relevance and market momentum.",
    factors: [
      "Price momentum (30%): Recent price changes",
      "Trading activity (20%): 24h volume relative to market cap",
      "Social activity (30%): Reddit mentions and sentiment",
      "Liquidity (10%): Available trading liquidity",
      "Buy/Sell ratio (10%): Market pressure indicator",
    ],
    interpretation: {
      high: "80+: Strong cultural presence, high engagement",
      medium: "60-79: Moderate activity, growing interest",
      low: "<60: Lower engagement, watch for catalysts",
    },
  },
  memeActivity: {
    title: "Meme Activity",
    description: "Total mentions and discussions across crypto communities in the last 24 hours.",
    sources: ["Reddit (r/CryptoCurrency, r/memecoins, etc.)", "Token-specific subreddits"],
    interpretation: {
      high: "1000+: Viral potential, high community engagement",
      medium: "100-999: Active discussions, steady interest",
      low: "<100: Quieter period, may indicate consolidation",
    },
  },
  trend: {
    title: "Market Trend",
    description: "Overall market sentiment based on price action and social signals.",
    indicators: {
      bullish: "Price up >5%, positive social sentiment, buying pressure",
      neutral: "Sideways movement, mixed signals",
      bearish: "Price down >5%, negative sentiment, selling pressure",
    },
  },
  volume: {
    title: "24h Volume",
    description: "Total trading volume in the last 24 hours across all tracked DEX pairs.",
    note: "Higher volume indicates more active trading and better liquidity for entries/exits.",
  },
  priceChange: {
    title: "24h Price Change",
    description: "Percentage change in price over the last 24 hours.",
    note: "Meme coins are highly volatile. Double-digit moves are common.",
  },
};
