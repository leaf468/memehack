import { NextResponse } from "next/server";

// OpenAI API Route for AI Insights
// Server-side to avoid CORS issues

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface TokenData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  sentiment?: number;
  communityScore?: number;
}

export async function POST(request: Request) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured", fallback: true },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { tokens, type = "insight", prompt: directPrompt } = body as {
      tokens?: TokenData[];
      type?: string;
      prompt?: string;
    };

    // Direct prompt mode (for meme captions, etc.)
    if (directPrompt) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a creative meme caption generator for crypto traders. Be funny, relatable, and brief." },
            { role: "user", content: directPrompt },
          ],
          max_tokens: 100,
          temperature: 0.9,
        }),
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: "AI service unavailable", fallback: true },
          { status: 500 }
        );
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";

      return NextResponse.json({
        success: true,
        content,
        model: "gpt-4o-mini",
      });
    }

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ error: "No token data provided" }, { status: 400 });
    }

    let prompt: string;
    let systemPrompt: string;

    if (type === "report") {
      // 전체 시장 리포트
      systemPrompt = `You are a crypto meme coin analyst. Provide concise, data-driven market analysis.
Keep responses under 200 words. Use emojis sparingly. Be direct and actionable.`;

      prompt = `Analyze this meme coin market data and provide a brief market report:

${tokens.map(t => `${t.symbol}: $${t.price.toFixed(6)}, 24h: ${t.change24h > 0 ? '+' : ''}${t.change24h.toFixed(1)}%, Vol: $${(t.volume24h / 1e6).toFixed(1)}M, MCap: $${(t.marketCap / 1e6).toFixed(0)}M${t.sentiment ? `, Sentiment: ${t.sentiment}%` : ''}`).join('\n')}

Provide:
1. Overall market sentiment (1 sentence)
2. Top opportunity (1 sentence with symbol)
3. Key risk to watch (1 sentence)
4. Short-term outlook (1 sentence)`;
    } else {
      // 개별 토큰 인사이트
      const token = tokens[0];
      systemPrompt = `You are a meme coin analyst. Provide brief, actionable insights.
Keep responses under 50 words. Be direct.`;

      prompt = `${token.symbol} (${token.name}):
- Price: $${token.price.toFixed(6)}
- 24h Change: ${token.change24h > 0 ? '+' : ''}${token.change24h.toFixed(1)}%
- Volume: $${(token.volume24h / 1e6).toFixed(1)}M
- Market Cap: $${(token.marketCap / 1e6).toFixed(0)}M
${token.sentiment ? `- Community Sentiment: ${token.sentiment}%` : ''}
${token.communityScore ? `- Community Activity: ${token.communityScore}/100` : ''}

Give a 1-2 sentence trading insight.`;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenAI API error:", response.status, errorData);
      return NextResponse.json(
        { error: "AI service unavailable", fallback: true },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "Analysis unavailable";

    return NextResponse.json({
      success: true,
      insight: content,
      model: "gpt-4o-mini",
      usage: data.usage,
    });
  } catch (error) {
    console.error("AI route error:", error);
    return NextResponse.json(
      { error: "Failed to generate insight", fallback: true },
      { status: 500 }
    );
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "OpenAI GPT-4o-mini",
    features: ["token_insight", "market_report"],
  });
}
