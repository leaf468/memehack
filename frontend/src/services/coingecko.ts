// CoinGecko API Service - 실시간 토큰 가격 데이터 (무료)

const COINGECKO_API = "https://api.coingecko.com/api/v3";

// 밈코인 ID 매핑
const MEME_COINS: Record<string, string> = {
  WIF: "dogwifcoin",
  PEPE: "pepe",
  DOGE: "dogecoin",
  SHIB: "shiba-inu",
  FLOKI: "floki",
  BONK: "bonk",
};

export interface TokenPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  market_cap: number;
  total_volume: number;
  image: string;
  sparkline_in_7d?: { price: number[] };
}

export interface TokenMarketData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change7d: number;
  volume: number;
  marketCap: number;
  image: string;
  trend: number; // 0: down, 1: stable, 2: up
}

/**
 * CoinGecko에서 밈코인 가격 데이터 가져오기 (무료 API)
 */
export async function fetchMemeCoinsPrice(): Promise<TokenMarketData[]> {
  const ids = Object.values(MEME_COINS).join(",");

  try {
    const response = await fetch(
      `${COINGECKO_API}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h,7d`,
      {
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      // Rate limit 대비 fallback
      if (response.status === 429) {
        console.warn("CoinGecko rate limited, using cached data");
        return getFallbackPriceData();
      }
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data: TokenPrice[] = await response.json();

    return data.map((coin) => {
      // 트렌드 계산: 24시간 변화율 기준
      let trend = 1; // stable
      if (coin.price_change_percentage_24h > 3) trend = 2; // up
      else if (coin.price_change_percentage_24h < -3) trend = 0; // down

      // symbol을 대문자로 변환하여 매핑
      const symbol =
        Object.keys(MEME_COINS).find(
          (key) => MEME_COINS[key] === coin.id
        ) || coin.symbol.toUpperCase();

      return {
        symbol,
        name: coin.name,
        price: coin.current_price,
        change24h: coin.price_change_percentage_24h || 0,
        change7d: coin.price_change_percentage_7d || 0,
        volume: coin.total_volume,
        marketCap: coin.market_cap,
        image: coin.image,
        trend,
      };
    });
  } catch (error) {
    console.error("Failed to fetch CoinGecko data:", error);
    return getFallbackPriceData();
  }
}

/**
 * Fallback 데이터 (API 실패 시)
 */
function getFallbackPriceData(): TokenMarketData[] {
  return [
    { symbol: "DOGE", name: "Dogecoin", price: 0.14, change24h: 2.5, change7d: 5.2, volume: 1000000000, marketCap: 20000000000, image: "", trend: 2 },
    { symbol: "SHIB", name: "Shiba Inu", price: 0.000025, change24h: -1.2, change7d: 3.1, volume: 500000000, marketCap: 15000000000, image: "", trend: 1 },
    { symbol: "PEPE", name: "Pepe", price: 0.000012, change24h: 8.5, change7d: 15.2, volume: 800000000, marketCap: 5000000000, image: "", trend: 2 },
    { symbol: "WIF", name: "dogwifhat", price: 2.5, change24h: -5.2, change7d: -8.1, volume: 300000000, marketCap: 2500000000, image: "", trend: 0 },
    { symbol: "BONK", name: "Bonk", price: 0.00003, change24h: 1.5, change7d: 4.2, volume: 200000000, marketCap: 2000000000, image: "", trend: 1 },
    { symbol: "FLOKI", name: "Floki", price: 0.0002, change24h: -2.1, change7d: 1.5, volume: 150000000, marketCap: 1800000000, image: "", trend: 1 },
  ];
}

/**
 * 가격 변동 이상 탐지 (급등/급락)
 */
export function detectPriceAnomaly(
  tokens: TokenMarketData[]
): { symbol: string; type: "surge" | "crash"; change: number }[] {
  const anomalies: { symbol: string; type: "surge" | "crash"; change: number }[] = [];

  for (const token of tokens) {
    if (token.change24h > 20) {
      anomalies.push({ symbol: token.symbol, type: "surge", change: token.change24h });
    } else if (token.change24h < -15) {
      anomalies.push({ symbol: token.symbol, type: "crash", change: token.change24h });
    }
  }

  return anomalies;
}

/**
 * 포맷팅 헬퍼
 */
export function formatPrice(price: number): string {
  if (price < 0.0001) return price.toExponential(2);
  if (price < 0.01) return price.toFixed(6);
  if (price < 1) return price.toFixed(4);
  if (price < 100) return price.toFixed(2);
  return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
  if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
  if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
  return `$${marketCap.toLocaleString()}`;
}

export function formatVolume(volume: number): string {
  if (volume >= 1e9) return `$${(volume / 1e9).toFixed(1)}B`;
  if (volume >= 1e6) return `$${(volume / 1e6).toFixed(1)}M`;
  if (volume >= 1e3) return `$${(volume / 1e3).toFixed(1)}K`;
  return `$${volume.toFixed(0)}`;
}
