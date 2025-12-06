"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchAllMemeTokens, TokenMarketData } from "@/services/dexscreener";
import { fetchQuickRedditStats, SubredditStats } from "@/services/reddit";
import {
  generateTokenInsight,
  generateAIReport,
  TokenInsight,
  AIReport,
} from "@/services/ai-analysis";

const REFRESH_INTERVAL = 30000; // 30초 (DexScreener는 빠른 업데이트 지원)

export interface UseTokenDataResult {
  insights: TokenInsight[];
  report: AIReport | null;
  priceData: TokenMarketData[];
  socialData: SubredditStats[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
  dataSource: {
    price: string;
    social: string;
  };
}

export function useTokenData(): UseTokenDataResult {
  const [insights, setInsights] = useState<TokenInsight[]>([]);
  const [report, setReport] = useState<AIReport | null>(null);
  const [priceData, setPriceData] = useState<TokenMarketData[]>([]);
  const [socialData, setSocialData] = useState<SubredditStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 병렬로 가격 데이터와 소셜 데이터 가져오기
      const [prices, social] = await Promise.all([
        fetchAllMemeTokens(),
        fetchQuickRedditStats(),
      ]);

      setPriceData(prices);
      setSocialData(social);

      // 각 토큰별 인사이트 생성
      const tokenInsights: TokenInsight[] = [];

      for (const price of prices) {
        const socialInfo = social.find((s) => s.symbol === price.symbol);
        const insight = generateTokenInsight(price, socialInfo);
        tokenInsights.push(insight);
      }

      // Market Cap 기준 정렬
      tokenInsights.sort((a, b) => b.priceData.marketCap - a.priceData.marketCap);

      setInsights(tokenInsights);

      // AI 리포트 생성
      if (tokenInsights.length > 0) {
        const aiReport = generateAIReport(tokenInsights);
        setReport(aiReport);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to fetch token data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 초기 로드 및 주기적 업데이트
  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    insights,
    report,
    priceData,
    socialData,
    isLoading,
    error,
    lastUpdated,
    refresh: fetchData,
    dataSource: {
      price: "DexScreener + CoinPaprika (Free, No API Key)",
      social: "Reddit (Free, No API Key)",
    },
  };
}

/**
 * 특정 토큰의 상세 데이터 Hook
 */
export function useTokenDetail(symbol: string) {
  const [insight, setInsight] = useState<TokenInsight | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        setIsLoading(true);

        const [prices, social] = await Promise.all([
          fetchAllMemeTokens(),
          fetchQuickRedditStats(),
        ]);

        const price = prices.find((p) => p.symbol === symbol);
        const socialInfo = social.find((s) => s.symbol === symbol);

        if (price) {
          setInsight(generateTokenInsight(price, socialInfo));
        }
      } catch (error) {
        console.error("Failed to fetch token detail:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetch();
  }, [symbol]);

  return { insight, isLoading };
}
