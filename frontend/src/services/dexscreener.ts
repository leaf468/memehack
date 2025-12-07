// DexScreener API Service - 완전 무료, API 키 불필요
// https://docs.dexscreener.com/api/reference

export interface DexPair {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    h24: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h1: { buys: number; sells: number };
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
  };
  priceChange: {
    h24: number;
    h6: number;
    h1: number;
  };
  liquidity: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv: number;
  marketCap: number;
  info?: {
    imageUrl?: string;
  };
}

export interface TokenMarketData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change1h: number;
  volume24h: number;
  marketCap: number;
  liquidity: number;
  txns24h: number;
  buySellRatio: number;
  image: string;
  trend: number; // 0: down, 1: stable, 2: up
  chain: string;
}

// 밈코인 컨트랙트 주소
const MEME_TOKENS: Record<string, { address: string; chain: string }> = {
  // Ethereum tokens
  PEPE: { address: "0x6982508145454Ce325dDbE47a25d4ec3d2311933", chain: "ethereum" },
  SHIB: { address: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE", chain: "ethereum" },
  FLOKI: { address: "0xcf0C122c6b73ff809C693DB761e7BaeBe62b6a2E", chain: "ethereum" },
  MOG: { address: "0xaaeE1A9723aaDB7afA2810263653A34bA2C21C7a", chain: "ethereum" },
  NEIRO: { address: "0x812Ba41e071C7b7fA4EBcFB62dF5F45f6fA853Ee", chain: "ethereum" },
  MEME: { address: "0xb131f4A55907B10d1F0A50d8ab8FA09EC342cd74", chain: "ethereum" },
  TURBO: { address: "0xA35923162C49cF95e6BF26623385eb431ad920D3", chain: "ethereum" },
  LADYS: { address: "0x12970E6868f88f6557B76120662c1B3E50A646bf", chain: "ethereum" },
  SPX: { address: "0xE0f63A424a4439cBE457D80E4f4b51aD25b2c56C", chain: "ethereum" },
  // Solana tokens
  WIF: { address: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm", chain: "solana" },
  BONK: { address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", chain: "solana" },
  POPCAT: { address: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr", chain: "solana" },
  // Base chain tokens
  BRETT: { address: "0x532f27101965dd16442E59d40670FaF5eBB142E4", chain: "base" },
};

// DOGE는 DexScreener에서 직접 지원 안됨 - CoinPaprika 사용 (무료, API 키 불필요)
const DOGE_COINPAPRIKA_ID = "doge-dogecoin";

/**
 * DexScreener에서 토큰 데이터 가져오기
 */
async function fetchTokenFromDex(symbol: string): Promise<TokenMarketData | null> {
  const tokenInfo = MEME_TOKENS[symbol];
  if (!tokenInfo) return null;

  try {
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${tokenInfo.address}`,
      { cache: "no-store" }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const pairs: DexPair[] = data.pairs || [];

    if (pairs.length === 0) return null;

    // 가장 유동성이 높은 페어 선택
    const bestPair = pairs.reduce((best, current) =>
      (current.liquidity?.usd || 0) > (best.liquidity?.usd || 0) ? current : best
    );

    const price = parseFloat(bestPair.priceUsd) || 0;
    const change24h = bestPair.priceChange?.h24 || 0;
    const change1h = bestPair.priceChange?.h1 || 0;
    const txns24h = (bestPair.txns?.h24?.buys || 0) + (bestPair.txns?.h24?.sells || 0);
    const buys = bestPair.txns?.h24?.buys || 1;
    const sells = bestPair.txns?.h24?.sells || 1;

    // 트렌드 계산
    let trend = 1;
    if (change24h > 5) trend = 2;
    else if (change24h < -5) trend = 0;

    return {
      symbol,
      name: bestPair.baseToken.name,
      price,
      change24h,
      change1h,
      volume24h: bestPair.volume?.h24 || 0,
      marketCap: bestPair.marketCap || bestPair.fdv || 0,
      liquidity: bestPair.liquidity?.usd || 0,
      txns24h,
      buySellRatio: buys / sells,
      image: bestPair.info?.imageUrl || "",
      trend,
      chain: tokenInfo.chain,
    };
  } catch (error) {
    console.error(`DexScreener fetch failed for ${symbol}:`, error);
    return null;
  }
}

/**
 * CoinPaprika에서 DOGE 데이터 가져오기 (무료, API 키 불필요)
 */
async function fetchDogeFromCoinPaprika(): Promise<TokenMarketData | null> {
  try {
    const response = await fetch(
      `https://api.coinpaprika.com/v1/tickers/${DOGE_COINPAPRIKA_ID}`,
      { cache: "no-store" }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const quotes = data.quotes?.USD || {};

    const price = quotes.price || 0;
    const change24h = quotes.percent_change_24h || 0;
    const change1h = quotes.percent_change_1h || 0;

    let trend = 1;
    if (change24h > 5) trend = 2;
    else if (change24h < -5) trend = 0;

    return {
      symbol: "DOGE",
      name: "Dogecoin",
      price,
      change24h,
      change1h,
      volume24h: quotes.volume_24h || 0,
      marketCap: quotes.market_cap || 0,
      liquidity: 0,
      txns24h: 0,
      buySellRatio: 1,
      image: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png",
      trend,
      chain: "multi",
    };
  } catch (error) {
    console.error("CoinPaprika fetch failed for DOGE:", error);
    return null;
  }
}

/**
 * 모든 밈코인 데이터 가져오기
 */
export async function fetchAllMemeTokens(): Promise<TokenMarketData[]> {
  const symbols = Object.keys(MEME_TOKENS);

  const [dexResults, dogeResult] = await Promise.all([
    Promise.all(symbols.map(fetchTokenFromDex)),
    fetchDogeFromCoinPaprika(),
  ]);

  const results: TokenMarketData[] = [];

  // DexScreener 결과 추가
  for (const result of dexResults) {
    if (result) results.push(result);
  }

  // DOGE 추가
  if (dogeResult) results.push(dogeResult);

  // fallback 데이터 (API 실패 시)
  if (results.length === 0) {
    return getFallbackData();
  }

  return results.sort((a, b) => b.marketCap - a.marketCap);
}

/**
 * Fallback 데이터
 */
function getFallbackData(): TokenMarketData[] {
  return [
    { symbol: "DOGE", name: "Dogecoin", price: 0.14, change24h: 2.5, change1h: 0.5, volume24h: 1e9, marketCap: 20e9, liquidity: 0, txns24h: 0, buySellRatio: 1, image: "", trend: 2, chain: "multi" },
    { symbol: "SHIB", name: "Shiba Inu", price: 0.000025, change24h: -1.2, change1h: -0.3, volume24h: 5e8, marketCap: 15e9, liquidity: 0, txns24h: 0, buySellRatio: 1, image: "", trend: 1, chain: "ethereum" },
    { symbol: "PEPE", name: "Pepe", price: 0.000012, change24h: 8.5, change1h: 1.2, volume24h: 8e8, marketCap: 5e9, liquidity: 0, txns24h: 0, buySellRatio: 1, image: "", trend: 2, chain: "ethereum" },
    { symbol: "WIF", name: "dogwifhat", price: 2.5, change24h: -5.2, change1h: -1.1, volume24h: 3e8, marketCap: 2.5e9, liquidity: 0, txns24h: 0, buySellRatio: 1, image: "", trend: 0, chain: "solana" },
    { symbol: "BONK", name: "Bonk", price: 0.00003, change24h: 1.5, change1h: 0.2, volume24h: 2e8, marketCap: 2e9, liquidity: 0, txns24h: 0, buySellRatio: 1, image: "", trend: 1, chain: "solana" },
    { symbol: "FLOKI", name: "Floki", price: 0.0002, change24h: -2.1, change1h: -0.4, volume24h: 1.5e8, marketCap: 1.8e9, liquidity: 0, txns24h: 0, buySellRatio: 1, image: "", trend: 1, chain: "ethereum" },
    { symbol: "MOG", name: "Mog Coin", price: 0.0000018, change24h: 3.2, change1h: 0.8, volume24h: 8e7, marketCap: 7e8, liquidity: 0, txns24h: 0, buySellRatio: 1, image: "", trend: 2, chain: "ethereum" },
    { symbol: "BRETT", name: "Brett", price: 0.12, change24h: 1.8, change1h: 0.3, volume24h: 5e7, marketCap: 1.2e9, liquidity: 0, txns24h: 0, buySellRatio: 1, image: "", trend: 1, chain: "base" },
    { symbol: "POPCAT", name: "Popcat", price: 0.8, change24h: -2.5, change1h: -0.5, volume24h: 4e7, marketCap: 8e8, liquidity: 0, txns24h: 0, buySellRatio: 1, image: "", trend: 0, chain: "solana" },
    { symbol: "NEIRO", name: "Neiro", price: 0.0012, change24h: 5.5, change1h: 1.0, volume24h: 6e7, marketCap: 5e8, liquidity: 0, txns24h: 0, buySellRatio: 1, image: "", trend: 2, chain: "ethereum" },
    { symbol: "MEME", name: "Memecoin", price: 0.012, change24h: -1.5, change1h: -0.2, volume24h: 3e7, marketCap: 4e8, liquidity: 0, txns24h: 0, buySellRatio: 1, image: "", trend: 1, chain: "ethereum" },
    { symbol: "TURBO", name: "Turbo", price: 0.008, change24h: 4.2, change1h: 0.6, volume24h: 2.5e7, marketCap: 3.5e8, liquidity: 0, txns24h: 0, buySellRatio: 1, image: "", trend: 2, chain: "ethereum" },
    { symbol: "LADYS", name: "Milady Meme Coin", price: 0.00000015, change24h: -3.1, change1h: -0.7, volume24h: 2e7, marketCap: 1.5e8, liquidity: 0, txns24h: 0, buySellRatio: 1, image: "", trend: 0, chain: "ethereum" },
    { symbol: "SPX", name: "SPX6900", price: 0.85, change24h: 6.5, change1h: 1.5, volume24h: 5e7, marketCap: 8e8, liquidity: 0, txns24h: 0, buySellRatio: 1, image: "", trend: 2, chain: "ethereum" },
  ];
}

/**
 * 포맷팅 헬퍼
 */
export function formatPrice(price: number): string {
  if (price < 0.0000001) return price.toExponential(2);
  if (price < 0.00001) return price.toFixed(8);
  if (price < 0.001) return price.toFixed(6);
  if (price < 1) return price.toFixed(4);
  if (price < 100) return price.toFixed(2);
  return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
  if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
  if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
  if (marketCap >= 1e3) return `$${(marketCap / 1e3).toFixed(2)}K`;
  return `$${marketCap.toFixed(0)}`;
}

export function formatVolume(volume: number): string {
  if (volume >= 1e9) return `$${(volume / 1e9).toFixed(1)}B`;
  if (volume >= 1e6) return `$${(volume / 1e6).toFixed(1)}M`;
  if (volume >= 1e3) return `$${(volume / 1e3).toFixed(1)}K`;
  return `$${volume.toFixed(0)}`;
}
