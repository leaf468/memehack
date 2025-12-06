// Reddit Social Data Service
// 실시간 Reddit API는 rate limit이 매우 엄격하므로
// 시뮬레이션 데이터 + 주기적 서버사이드 업데이트 방식 사용

export interface RedditPost {
  id: string;
  title: string;
  author: string;
  score: number;
  upvoteRatio: number;
  numComments: number;
  created: number;
  url: string;
  subreddit: string;
}

export interface SubredditStats {
  symbol: string;
  subreddit: string;
  subscribers: number;
  activeUsers: number;
  postsLast24h: number;
  avgScore: number;
  avgComments: number;
  sentiment: number; // 0-100
  hotPosts: RedditPost[];
  mentionCount: number;
}

// 밈코인 서브레딧 매핑
const MEME_SUBREDDITS: Record<string, string[]> = {
  DOGE: ["dogecoin"],
  SHIB: ["SHIBArmy", "Shibainucoin"],
  PEPE: ["pepecoin"],
  WIF: ["dogwifhat"],
  BONK: ["BonkToken"],
  FLOKI: ["Floki"],
};

/**
 * 포스트 감성 분석 (간단한 키워드 기반)
 */
function analyzeSentiment(posts: RedditPost[]): number {
  if (posts.length === 0) return 50;

  const positiveKeywords = ["moon", "bullish", "pump", "buy", "hold", "diamond", "hands", "🚀", "💎", "📈", "lfg", "wagmi"];
  const negativeKeywords = ["dump", "sell", "crash", "bearish", "scam", "rug", "dead", "📉", "💀", "rip"];

  let positiveCount = 0;
  let negativeCount = 0;

  for (const post of posts) {
    const text = post.title.toLowerCase();

    for (const keyword of positiveKeywords) {
      if (text.includes(keyword)) positiveCount++;
    }
    for (const keyword of negativeKeywords) {
      if (text.includes(keyword)) negativeCount++;
    }

    if (post.upvoteRatio > 0.8) positiveCount++;
    else if (post.upvoteRatio < 0.5) negativeCount++;
  }

  const total = positiveCount + negativeCount;
  if (total === 0) return 60;

  const sentiment = (positiveCount / total) * 100;
  return Math.round(Math.min(100, Math.max(0, sentiment)));
}

/**
 * 기본 시뮬레이션 데이터 (실제 Reddit 데이터 기반 추정치)
 * 실제 서비스에서는 서버사이드에서 주기적으로 업데이트
 */
const BASE_REDDIT_DATA: Record<string, Omit<SubredditStats, "symbol" | "subreddit">> = {
  DOGE: { subscribers: 2400000, activeUsers: 3500, postsLast24h: 45, avgScore: 250, avgComments: 85, sentiment: 72, hotPosts: [], mentionCount: 320 },
  SHIB: { subscribers: 520000, activeUsers: 1200, postsLast24h: 30, avgScore: 180, avgComments: 45, sentiment: 65, hotPosts: [], mentionCount: 180 },
  PEPE: { subscribers: 85000, activeUsers: 450, postsLast24h: 25, avgScore: 120, avgComments: 35, sentiment: 78, hotPosts: [], mentionCount: 150 },
  WIF: { subscribers: 25000, activeUsers: 180, postsLast24h: 18, avgScore: 90, avgComments: 25, sentiment: 82, hotPosts: [], mentionCount: 95 },
  BONK: { subscribers: 15000, activeUsers: 120, postsLast24h: 12, avgScore: 65, avgComments: 18, sentiment: 70, hotPosts: [], mentionCount: 60 },
  FLOKI: { subscribers: 45000, activeUsers: 280, postsLast24h: 15, avgScore: 85, avgComments: 22, sentiment: 68, hotPosts: [], mentionCount: 75 },
};

/**
 * 약간의 랜덤 변동을 추가한 시뮬레이션 데이터 생성
 */
function generateDynamicStats(symbol: string): SubredditStats {
  const base = BASE_REDDIT_DATA[symbol];
  const subreddit = MEME_SUBREDDITS[symbol]?.[0] || "N/A";

  if (!base) {
    return {
      symbol,
      subreddit,
      subscribers: 10000,
      activeUsers: 100,
      postsLast24h: 5,
      avgScore: 50,
      avgComments: 10,
      sentiment: 50,
      hotPosts: [],
      mentionCount: 30,
    };
  }

  // 시간에 따른 자연스러운 변동 (±15%)
  const variance = () => 0.85 + Math.random() * 0.3;

  return {
    symbol,
    subreddit,
    subscribers: base.subscribers,
    activeUsers: Math.round(base.activeUsers * variance()),
    postsLast24h: Math.round(base.postsLast24h * variance()),
    avgScore: Math.round(base.avgScore * variance()),
    avgComments: Math.round(base.avgComments * variance()),
    sentiment: Math.round(Math.min(100, Math.max(0, base.sentiment + (Math.random() - 0.5) * 20))),
    hotPosts: [],
    mentionCount: Math.round(base.mentionCount * variance()),
  };
}

/**
 * 토큰별 Reddit 데이터 가져오기 (시뮬레이션)
 */
export async function fetchRedditStats(symbol: string): Promise<SubredditStats | null> {
  // 네트워크 지연 시뮬레이션 (UX용)
  await new Promise((resolve) => setTimeout(resolve, 100));
  return generateDynamicStats(symbol);
}

/**
 * 모든 토큰의 Reddit 데이터 가져오기
 */
export async function fetchAllRedditStats(): Promise<SubredditStats[]> {
  const symbols = Object.keys(MEME_SUBREDDITS);
  return symbols.map(generateDynamicStats);
}

/**
 * 빠른 Reddit 데이터 (즉시 반환)
 */
export async function fetchQuickRedditStats(): Promise<SubredditStats[]> {
  const symbols = Object.keys(MEME_SUBREDDITS);
  return symbols.map(generateDynamicStats);
}

/**
 * 시뮬레이션 데이터 (레거시 호환)
 */
export function getSimulatedRedditStats(): SubredditStats[] {
  const symbols = Object.keys(MEME_SUBREDDITS);
  return symbols.map(generateDynamicStats);
}

export { analyzeSentiment };
