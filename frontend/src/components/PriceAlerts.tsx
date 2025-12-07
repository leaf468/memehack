"use client";

import { useState, useEffect, useMemo } from "react";
import { TokenInsight } from "@/services/ai-analysis";

interface PriceAlert {
  id: string;
  symbol: string;
  type: "surge" | "crash" | "volatility" | "momentum";
  message: string;
  change: number;
  timestamp: Date;
  severity: "info" | "warning" | "critical";
}

interface PriceAlertsProps {
  insights: TokenInsight[];
  previousInsights?: TokenInsight[];
}

export function PriceAlerts({ insights, previousInsights }: PriceAlertsProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [alertHistory, setAlertHistory] = useState<PriceAlert[]>([]);

  // Generate alerts from existing price data
  const currentAlerts = useMemo(() => {
    const alerts: PriceAlert[] = [];

    for (const token of insights) {
      const change = token.priceData.change24h;

      // Price surge alert (>15%)
      if (change > 15) {
        alerts.push({
          id: `${token.symbol}-surge-${Date.now()}`,
          symbol: token.symbol,
          type: "surge",
          message: `${token.symbol} up ${change.toFixed(1)}% in 24h`,
          change,
          timestamp: new Date(),
          severity: change > 25 ? "critical" : "warning",
        });
      }

      // Price crash alert (<-10%)
      if (change < -10) {
        alerts.push({
          id: `${token.symbol}-crash-${Date.now()}`,
          symbol: token.symbol,
          type: "crash",
          message: `${token.symbol} down ${Math.abs(change).toFixed(1)}% in 24h`,
          change,
          timestamp: new Date(),
          severity: change < -20 ? "critical" : "warning",
        });
      }

      // High volatility alert
      if (Math.abs(change) > 20 && token.riskLevel === "high") {
        alerts.push({
          id: `${token.symbol}-volatility-${Date.now()}`,
          symbol: token.symbol,
          type: "volatility",
          message: `High volatility detected for ${token.symbol}`,
          change,
          timestamp: new Date(),
          severity: "warning",
        });
      }

      // Strong momentum alert
      if (token.signals.momentum > 60) {
        alerts.push({
          id: `${token.symbol}-momentum-${Date.now()}`,
          symbol: token.symbol,
          type: "momentum",
          message: `${token.symbol} showing strong bullish momentum`,
          change: token.signals.momentum,
          timestamp: new Date(),
          severity: "info",
        });
      } else if (token.signals.momentum < -60) {
        alerts.push({
          id: `${token.symbol}-momentum-down-${Date.now()}`,
          symbol: token.symbol,
          type: "momentum",
          message: `${token.symbol} showing strong bearish momentum`,
          change: token.signals.momentum,
          timestamp: new Date(),
          severity: "warning",
        });
      }
    }

    // Sort by severity
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }, [insights]);

  // Filter out dismissed alerts
  const visibleAlerts = currentAlerts.filter(
    (alert) => !dismissedAlerts.has(`${alert.symbol}-${alert.type}`)
  );

  const dismissAlert = (alert: PriceAlert) => {
    setDismissedAlerts((prev) => new Set(prev).add(`${alert.symbol}-${alert.type}`));
    setAlertHistory((prev) => [...prev, alert].slice(-10)); // Keep last 10
  };

  const getSeverityStyles = (severity: PriceAlert["severity"]) => {
    switch (severity) {
      case "critical":
        return "bg-red-900/40 border-red-600/50 text-red-200";
      case "warning":
        return "bg-yellow-900/40 border-yellow-600/50 text-yellow-200";
      default:
        return "bg-blue-900/40 border-blue-600/50 text-blue-200";
    }
  };

  const getAlertIcon = (type: PriceAlert["type"], change: number) => {
    switch (type) {
      case "surge":
        return "🚀";
      case "crash":
        return "📉";
      case "volatility":
        return "⚡";
      case "momentum":
        return change > 0 ? "📈" : "📉";
      default:
        return "🔔";
    }
  };

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
          <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
          Price Alerts ({visibleAlerts.length})
        </h3>
        {visibleAlerts.length > 0 && (
          <button
            onClick={() => {
              visibleAlerts.forEach((a) => dismissAlert(a));
            }}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Dismiss All
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {visibleAlerts.slice(0, 5).map((alert) => (
          <div
            key={alert.id}
            className={`flex items-center justify-between p-3 rounded-lg border ${getSeverityStyles(
              alert.severity
            )} transition-all duration-300`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{getAlertIcon(alert.type, alert.change)}</span>
              <div>
                <p className="text-sm font-medium">{alert.message}</p>
                <p className="text-xs opacity-70">
                  {alert.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <button
              onClick={() => dismissAlert(alert)}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
