import { NextResponse } from "next/server";

// CoinGecko Social Data API Route
// Free API - No key required (rate limited: ~10-30 calls/min)

interface CoinGeckoCommunityData {
  telegram_channel_user_count: number | null;
  reddit_subscribers: number;
  reddit_accounts_active_48h: number;
  reddit_average_posts_48h: number;
  reddit_average_comments_48h: number;
}

interface CoinGeckoDeveloperData {
  forks: number;
  stars: number;
  subscribers: number;
  total_issues: number;
  closed_issues: number;
  pull_requests_merged: number;
  commit_count_4_weeks: number;
}

interface CoinGeckoResponse {
  symbol: string;
  sentiment_votes_up_percentage: number;
  sentiment_votes_down_percentage: number;
  community_data: CoinGeckoCommunityData;
  developer_data: CoinGeckoDeveloperData;
  public_interest_score: number | null;
}

// CoinGecko ID 매핑
const COINGECKO_IDS: Record<string, string> = {
  DOGE: "dogecoin",
  SHIB: "shiba-inu",
  PEPE: "pepe",
  WIF: "dogwifcoin",
  BONK: "bonk",
  FLOKI: "floki",
  BRETT: "brett",
  POPCAT: "popcat",
  MOG: "mog-coin",
  NEIRO: "neiro-3",
};

// 캐시
let cachedData: Map<string, CoinGeckoSocialData> = new Map();
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5분

export interface CoinGeckoSocialData {
  symbol: string;
  coingeckoId: string;
  sentimentVotesUpPercentage: number;
  sentimentVotesDownPercentage: number;
  communityData: {
    telegramUsers: number | null;
    redditSubscribers: number;
    redditActiveAccounts48h: number;
    redditAveragePosts48h: number;
    redditAverageComments48h: number;
  };
  developerData: {
    forks: number;
    stars: number;
    subscribers: number;
    totalIssues: number;
    closedIssues: number;
    pullRequestsMerged: number;
    commitCount4Weeks: number;
  };
  publicInterestScore: number | null;
}

async function fetchCoinData(coingeckoId: string, symbol: string): Promise<CoinGeckoSocialData | null> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coingeckoId}?localization=false&tickers=false&market_data=false&community_data=true&developer_data=true&sparkline=false`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "MISP/1.0 (Meme Intelligence Social Platform)",
        },
        next: { revalidate: 300 }, // 5분 캐시
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        console.warn("CoinGecko rate limit hit");
        return null;
      }
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data: CoinGeckoResponse = await response.json();

    return {
      symbol: symbol.toUpperCase(),
      coingeckoId,
      sentimentVotesUpPercentage: data.sentiment_votes_up_percentage || 50,
      sentimentVotesDownPercentage: data.sentiment_votes_down_percentage || 50,
      communityData: {
        telegramUsers: data.community_data?.telegram_channel_user_count || null,
        redditSubscribers: data.community_data?.reddit_subscribers || 0,
        redditActiveAccounts48h: data.community_data?.reddit_accounts_active_48h || 0,
        redditAveragePosts48h: data.community_data?.reddit_average_posts_48h || 0,
        redditAverageComments48h: data.community_data?.reddit_average_comments_48h || 0,
      },
      developerData: {
        forks: data.developer_data?.forks || 0,
        stars: data.developer_data?.stars || 0,
        subscribers: data.developer_data?.subscribers || 0,
        totalIssues: data.developer_data?.total_issues || 0,
        closedIssues: data.developer_data?.closed_issues || 0,
        pullRequestsMerged: data.developer_data?.pull_requests_merged || 0,
        commitCount4Weeks: data.developer_data?.commit_count_4_weeks || 0,
      },
      publicInterestScore: data.public_interest_score || null,
    };
  } catch (error) {
    console.error(`Failed to fetch ${coingeckoId}:`, error);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");

  // 캐시 확인
  if (cachedData.size > 0 && Date.now() - cacheTimestamp < CACHE_DURATION) {
    if (symbol) {
      const data = cachedData.get(symbol.toUpperCase());
      if (data) {
        return NextResponse.json({ success: true, data, cached: true });
      }
    } else {
      return NextResponse.json({
        success: true,
        data: Object.fromEntries(cachedData),
        cached: true,
      });
    }
  }

  try {
    // 특정 심볼만 요청
    if (symbol) {
      const coingeckoId = COINGECKO_IDS[symbol.toUpperCase()];
      if (!coingeckoId) {
        return NextResponse.json({ error: `Unknown symbol: ${symbol}` }, { status: 400 });
      }

      const data = await fetchCoinData(coingeckoId, symbol);
      if (data) {
        cachedData.set(symbol.toUpperCase(), data);
        cacheTimestamp = Date.now();
        return NextResponse.json({ success: true, data });
      }

      return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }

    // 전체 데이터 요청 (순차 처리 + 딜레이)
    const results: Record<string, CoinGeckoSocialData> = {};
    const symbols = Object.keys(COINGECKO_IDS);

    // 처음 3개만 병렬로 (rate limit 고려)
    const firstBatch = symbols.slice(0, 3);
    const firstResults = await Promise.all(
      firstBatch.map(async (sym) => {
        const data = await fetchCoinData(COINGECKO_IDS[sym], sym);
        return { sym, data };
      })
    );

    for (const { sym, data } of firstResults) {
      if (data) results[sym] = data;
    }

    // 나머지는 순차 처리 + 딜레이
    for (const sym of symbols.slice(3)) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const data = await fetchCoinData(COINGECKO_IDS[sym], sym);
      if (data) results[sym] = data;
    }

    // 캐시 업데이트
    cachedData = new Map(Object.entries(results));
    cacheTimestamp = Date.now();

    return NextResponse.json({
      success: true,
      data: results,
      count: Object.keys(results).length,
      source: "CoinGecko API (Real-time Community & Sentiment Data)",
    });
  } catch (error) {
    console.error("Social API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch social data", fallback: true },
      { status: 500 }
    );
  }
}
