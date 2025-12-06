import { NextResponse } from "next/server";

// Reddit API를 서버사이드에서 호출 (CORS 우회)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get("endpoint");

  if (!endpoint) {
    return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
  }

  try {
    const response = await fetch(`https://www.reddit.com${endpoint}`, {
      headers: {
        "User-Agent": "MISP/1.0 (Meme Intelligence Social Platform)",
      },
      next: { revalidate: 60 }, // 1분 캐시
    });

    if (!response.ok) {
      // Rate limit 시 시뮬레이션 데이터 반환
      if (response.status === 429) {
        return NextResponse.json({
          error: "rate_limited",
          fallback: true
        }, { status: 200 });
      }
      return NextResponse.json({ error: response.statusText }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Reddit API error:", error);
    return NextResponse.json({
      error: "fetch_failed",
      fallback: true
    }, { status: 200 });
  }
}
