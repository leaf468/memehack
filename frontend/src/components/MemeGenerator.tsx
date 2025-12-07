"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { TokenInsight } from "@/services/ai-analysis";

interface MemeGeneratorProps {
  insights: TokenInsight[];
}

// Background mode types
type BackgroundMode = "chart" | "upload" | "template";

// Meme templates with placeholder positions
const MEME_TEMPLATES = [
  {
    id: "drake",
    name: "Drake Hotline",
    topText: "Selling at loss",
    bottomText: "Diamond hands",
    style: "classic",
  },
  {
    id: "stonks",
    name: "Stonks",
    topText: "",
    bottomText: "STONKS",
    style: "impact",
  },
  {
    id: "doge",
    name: "Doge",
    topText: "Such wow",
    bottomText: "Much profit",
    style: "comic",
  },
  {
    id: "pepe",
    name: "Feels Good",
    topText: "",
    bottomText: "Feels good man",
    style: "classic",
  },
  {
    id: "wojak",
    name: "Wojak",
    topText: "Me watching charts",
    bottomText: "",
    style: "minimal",
  },
  {
    id: "giga",
    name: "Giga Chad",
    topText: "",
    bottomText: "Yes, I bought the dip",
    style: "impact",
  },
];

// AI-generated caption suggestions based on token data
const generateCaptions = (token: TokenInsight): string[] => {
  const change = token.priceData.change24h;
  const symbol = token.symbol;

  if (change > 20) {
    return [
      `When your $${symbol} bag finally pumps`,
      `$${symbol} holders right now`,
      `Me explaining $${symbol} to my wife`,
      `POV: You bought $${symbol} yesterday`,
    ];
  } else if (change > 5) {
    return [
      `$${symbol} slowly cooking`,
      `Patience pays off - $${symbol}`,
      `$${symbol} believers stay winning`,
      `Another day, another $${symbol} gain`,
    ];
  } else if (change < -20) {
    return [
      `$${symbol} holders checking portfolio`,
      `Me: "It's a long term hold"`,
      `$${symbol} support group meeting`,
      `This is fine - $${symbol} edition`,
    ];
  } else if (change < -5) {
    return [
      `$${symbol} dip = buying opportunity`,
      `Weak hands selling $${symbol}`,
      `$${symbol}: "I'll be back"`,
      `Diamond hands loading...`,
    ];
  } else {
    return [
      `$${symbol} consolidating like a boss`,
      `$${symbol} waiting for liftoff`,
      `Accumulation phase: $${symbol}`,
      `$${symbol} coiling for the next move`,
    ];
  }
};

export function MemeGenerator({ insights }: MemeGeneratorProps) {
  const [selectedToken, setSelectedToken] = useState<TokenInsight | null>(
    insights[0] || null
  );
  const [selectedTemplate, setSelectedTemplate] = useState(MEME_TEMPLATES[0]);
  const [topText, setTopText] = useState("");
  const [bottomText, setBottomText] = useState("");
  const [generatedCaptions, setGeneratedCaptions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>("chart");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Generate captions when token changes
  useEffect(() => {
    if (selectedToken) {
      const captions = generateCaptions(selectedToken);
      setGeneratedCaptions(captions);
    }
  }, [selectedToken]);

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        setBackgroundMode("upload");
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Handle file select
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        setBackgroundMode("upload");
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle paste from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.startsWith("image/")) {
            const file = items[i].getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                setUploadedImage(event.target?.result as string);
                setBackgroundMode("upload");
              };
              reader.readAsDataURL(file);
            }
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  // Get TradingView chart URL for token
  const getChartUrl = (symbol: string) => {
    // Map common meme coins to their TradingView symbols
    const symbolMap: Record<string, string> = {
      DOGE: "BINANCE:DOGEUSDT",
      SHIB: "BINANCE:SHIBUSDT",
      PEPE: "BINANCE:PEPEUSDT",
      FLOKI: "BINANCE:FLOKIUSDT",
      BONK: "BINANCE:BONKUSDT",
      WIF: "BINANCE:WIFUSDT",
      MEME: "BINANCE:MEMEUSDT",
      BRETT: "BYBIT:BRETTUSDT",
      POPCAT: "BYBIT:POPCATUSDT",
      MOG: "BYBIT:MOGUSDT",
    };
    return symbolMap[symbol] || `BINANCE:${symbol}USDT`;
  };

  // Generate AI caption using OpenAI
  const generateAICaption = async () => {
    if (!selectedToken) return;

    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Generate a funny, short meme caption (max 10 words) for a cryptocurrency called ${selectedToken.symbol} that is ${selectedToken.priceData.change24h > 0 ? "up" : "down"} ${Math.abs(selectedToken.priceData.change24h).toFixed(1)}% today. Make it relatable to crypto traders. Just return the caption text, nothing else.`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.content) {
          setBottomText(data.content.replace(/"/g, ""));
        }
      }
    } catch (error) {
      console.error("Failed to generate caption:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate meme image using canvas
  const generateMemeImage = async (): Promise<string | null> => {
    if (!previewRef.current || !selectedToken) return null;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const width = 800;
    const height = 800;
    canvas.width = width;
    canvas.height = height;

    // Dark background
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, width, height);

    // Draw uploaded image if available
    if (backgroundMode === "upload" && uploadedImage) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = uploadedImage;
      });
      ctx.drawImage(img, 0, 0, width, height);
    } else {
      // Draw gradient background for chart/template modes
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      if (backgroundMode === "template") {
        gradient.addColorStop(0, "#2d1b4e");
        gradient.addColorStop(1, "#1a1a2e");
      } else {
        gradient.addColorStop(0, "#0f3460");
        gradient.addColorStop(1, "#1a1a2e");
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw chart-like pattern
      ctx.strokeStyle = "#3a3a5e";
      ctx.lineWidth = 1;
      for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * 80);
        ctx.lineTo(width, i * 80);
        ctx.stroke();
        ctx.moveTo(i * 80, 0);
        ctx.lineTo(i * 80, height);
        ctx.stroke();
      }

      // Draw a simple line chart
      ctx.strokeStyle = selectedToken.priceData.change24h >= 0 ? "#10b981" : "#ef4444";
      ctx.lineWidth = 3;
      ctx.beginPath();
      const points = Array.from({ length: 20 }, (_, i) => ({
        x: (i / 19) * width,
        y: height / 2 + Math.sin(i * 0.5) * 100 + (selectedToken.priceData.change24h >= 0 ? -i * 5 : i * 5),
      }));
      ctx.moveTo(points[0].x, points[0].y);
      points.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    }

    // Semi-transparent overlay for text readability
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(0, 0, width, height);

    // Token info in center
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 72px Arial";
    ctx.fillText(`$${selectedToken.symbol}`, width / 2, height / 2 - 20);

    ctx.font = "bold 48px Arial";
    ctx.fillStyle = selectedToken.priceData.change24h >= 0 ? "#10b981" : "#ef4444";
    ctx.fillText(
      `${selectedToken.priceData.change24h >= 0 ? "+" : ""}${selectedToken.priceData.change24h.toFixed(1)}%`,
      width / 2,
      height / 2 + 50
    );

    // Top text
    if (topText) {
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 36px Arial";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 4;
      ctx.strokeText(topText.toUpperCase(), width / 2, 60);
      ctx.fillText(topText.toUpperCase(), width / 2, 60);
    }

    // Bottom text
    if (bottomText) {
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 36px Arial";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 4;
      ctx.strokeText(bottomText.toUpperCase(), width / 2, height - 40);
      ctx.fillText(bottomText.toUpperCase(), width / 2, height - 40);
    }

    return canvas.toDataURL("image/png");
  };

  // Share to X (Twitter)
  const shareToX = async () => {
    const text = `${topText ? topText + " " : ""}$${selectedToken?.symbol || "MEME"} ${bottomText ? bottomText : ""}\n\n#Crypto #Meme #${selectedToken?.symbol || "Meme"}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "width=550,height=420");
  };

  // Copy meme to clipboard
  const copyMeme = async () => {
    try {
      const dataUrl = await generateMemeImage();
      if (!dataUrl) return;

      const response = await fetch(dataUrl);
      const blob = await response.blob();

      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);

      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      // Fallback: copy text only
      const text = `${topText ? topText + " " : ""}$${selectedToken?.symbol || "MEME"} ${bottomText || ""}`;
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Save meme as image
  const saveMeme = async () => {
    setIsSaving(true);
    try {
      const dataUrl = await generateMemeImage();
      if (!dataUrl) return;

      const link = document.createElement("a");
      link.download = `${selectedToken?.symbol || "meme"}_meme_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate viral score
  const viralScore = selectedToken
    ? Math.min(
        100,
        Math.round(
          Math.abs(selectedToken.priceData.change24h) * 2 +
            (selectedToken.sentimentScore || 50) * 0.5 +
            (selectedToken.communityScore || 0) * 0.3
        )
      )
    : 0;

  return (
    <div className="bg-gradient-to-br from-pink-900/20 to-purple-900/20 rounded-xl p-5 border border-pink-700/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎨</span>
          <h3 className="text-lg font-bold text-white">Meme Generator</h3>
        </div>
        <span className="text-xs bg-purple-600/30 text-purple-400 px-2 py-1 rounded-full">
          AI-Powered
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Controls */}
        <div className="space-y-4">
          {/* Token Selection */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">
              Select Token
            </label>
            <select
              value={selectedToken?.symbol || ""}
              onChange={(e) => {
                const token = insights.find((t) => t.symbol === e.target.value);
                setSelectedToken(token || null);
              }}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
            >
              {insights.map((token) => (
                <option key={token.symbol} value={token.symbol}>
                  ${token.symbol} ({token.priceData.change24h >= 0 ? "+" : ""}
                  {token.priceData.change24h.toFixed(1)}%)
                </option>
              ))}
            </select>
          </div>

          {/* Background Mode Selection */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">
              Background
            </label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <button
                onClick={() => setBackgroundMode("chart")}
                className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                  backgroundMode === "chart"
                    ? "bg-green-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                📈 Live Chart
              </button>
              <button
                onClick={() => setBackgroundMode("upload")}
                className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                  backgroundMode === "upload"
                    ? "bg-cyan-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                📷 Upload
              </button>
              <button
                onClick={() => setBackgroundMode("template")}
                className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                  backgroundMode === "template"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                🎭 Template
              </button>
            </div>

            {/* Template Selection (only show when template mode) */}
            {backgroundMode === "template" && (
              <div className="grid grid-cols-3 gap-2">
                {MEME_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template);
                      setTopText(template.topText);
                      setBottomText(template.bottomText);
                    }}
                    className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                      selectedTemplate.id === template.id
                        ? "bg-purple-600 text-white"
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            )}

            {/* Upload area (only show when upload mode) */}
            {backgroundMode === "upload" && (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? "border-cyan-400 bg-cyan-900/30"
                    : "border-gray-600 hover:border-cyan-500"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <p className="text-gray-400 text-xs">
                  {uploadedImage ? "Click to change image" : "Drop image, click, or Ctrl+V"}
                </p>
              </div>
            )}
          </div>

          {/* Text Inputs */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">Top Text</label>
            <input
              type="text"
              value={topText}
              onChange={(e) => setTopText(e.target.value)}
              placeholder="Enter top text..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-2">
              Bottom Text
            </label>
            <input
              type="text"
              value={bottomText}
              onChange={(e) => setBottomText(e.target.value)}
              placeholder="Enter bottom text..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* AI Generate Button */}
          <button
            onClick={generateAICaption}
            disabled={isGenerating || !selectedToken}
            className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-medium text-white hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <span>✨</span>
                Generate AI Caption
              </>
            )}
          </button>

          {/* AI Suggestions */}
          {generatedCaptions.length > 0 && (
            <div>
              <label className="text-sm text-gray-400 block mb-2">
                Quick Suggestions
              </label>
              <div className="space-y-1">
                {generatedCaptions.map((caption, i) => (
                  <button
                    key={i}
                    onClick={() => setBottomText(caption)}
                    className="w-full text-left text-xs bg-gray-800 hover:bg-gray-700 rounded px-3 py-2 text-gray-300 transition-colors"
                  >
                    "{caption}"
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Preview */}
        <div className="space-y-4">
          {/* Meme Preview */}
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <div ref={previewRef} className="aspect-square bg-gray-900 rounded-lg flex flex-col items-center justify-center relative overflow-hidden">

              {/* Chart background - for chart and template modes */}
              {(backgroundMode === "chart" || backgroundMode === "template") && selectedToken && (
                <iframe
                  src={`https://www.tradingview.com/widgetembed/?symbol=${getChartUrl(selectedToken.symbol)}&interval=60&theme=dark&style=1&timezone=exchange&hide_top_toolbar=1&hide_legend=1&save_image=0&hide_volume=1&locale=en`}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ border: 0 }}
                />
              )}

              {/* Template Mode - Overlay on top of chart */}
              {backgroundMode === "template" && (
                <>
                  {/* Semi-transparent overlay */}
                  <div className="absolute inset-0 bg-black/40 z-[5]" />

                  {/* Template-specific overlays */}
                  <div className="absolute inset-0 z-[6] pointer-events-none">
                    {selectedTemplate.id === "drake" && (
                      <div className="absolute inset-0 grid grid-rows-2">
                        <div className="bg-red-900/30 flex items-center justify-center text-6xl">❌</div>
                        <div className="bg-green-900/30 flex items-center justify-center text-6xl">✅</div>
                      </div>
                    )}
                    {selectedTemplate.id === "stonks" && (
                      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-green-500/30 to-transparent" />
                    )}
                    {selectedTemplate.id === "doge" && (
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-500/20" />
                    )}
                    {selectedTemplate.id === "pepe" && (
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20" />
                    )}
                    {selectedTemplate.id === "wojak" && (
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-gray-500/20" />
                    )}
                    {selectedTemplate.id === "giga" && (
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20" />
                    )}
                  </div>

                  {/* Big template emoji */}
                  <div className="absolute inset-0 flex items-center justify-center text-8xl opacity-50 pointer-events-none z-[7]">
                    {selectedTemplate.id === "drake" && "🤔"}
                    {selectedTemplate.id === "stonks" && "📈"}
                    {selectedTemplate.id === "doge" && "🐕"}
                    {selectedTemplate.id === "pepe" && "🐸"}
                    {selectedTemplate.id === "wojak" && "😢"}
                    {selectedTemplate.id === "giga" && "💪"}
                  </div>
                </>
              )}

              {/* Upload Mode - Uploaded Image */}
              {backgroundMode === "upload" && uploadedImage && (
                <img
                  src={uploadedImage}
                  alt="Uploaded"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}

              {/* Upload Mode - Placeholder */}
              {backgroundMode === "upload" && !uploadedImage && (
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-2">📷</div>
                  <p className="text-sm">Upload an image</p>
                  <p className="text-xs">Drag & drop or Ctrl+V</p>
                </div>
              )}

              {/* Top text - always show */}
              {topText && (
                <div className="absolute top-4 left-0 right-0 text-center z-20">
                  <span className="text-white font-bold text-lg px-3 py-1.5 bg-black/70 rounded-lg uppercase"
                    style={{ textShadow: "2px 2px 0 #000, -1px -1px 0 #000" }}>
                    {topText}
                  </span>
                </div>
              )}

              {/* Token info overlay - only for chart mode */}
              {backgroundMode === "chart" && selectedToken && (
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-center z-10 bg-black/60 px-4 py-2 rounded-xl">
                  <div className="flex items-center gap-2">
                    {selectedToken.priceData.image && (
                      <img
                        src={selectedToken.priceData.image}
                        alt={selectedToken.symbol}
                        className="w-8 h-8 rounded-full border border-white/20"
                      />
                    )}
                    <div>
                      <p className="text-xl font-bold text-white">${selectedToken.symbol}</p>
                      <p className={`text-sm font-bold ${
                        selectedToken.priceData.change24h >= 0 ? "text-green-400" : "text-red-400"
                      }`}>
                        {selectedToken.priceData.change24h >= 0 ? "+" : ""}
                        {selectedToken.priceData.change24h.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Token info - for template and upload modes */}
              {backgroundMode !== "chart" && selectedToken && (
                <div className="text-center z-10 bg-black/40 px-6 py-4 rounded-xl">
                  {selectedToken.priceData.image && (
                    <img
                      src={selectedToken.priceData.image}
                      alt={selectedToken.symbol}
                      className="w-12 h-12 rounded-full mx-auto mb-2 border-2 border-white/20"
                    />
                  )}
                  <p className="text-3xl font-bold text-white">${selectedToken.symbol}</p>
                  <p className={`text-xl font-bold ${
                    selectedToken.priceData.change24h >= 0 ? "text-green-400" : "text-red-400"
                  }`}>
                    {selectedToken.priceData.change24h >= 0 ? "+" : ""}
                    {selectedToken.priceData.change24h.toFixed(1)}%
                  </p>
                </div>
              )}

              {/* Bottom text */}
              {bottomText && (
                <div className="absolute bottom-4 left-0 right-0 text-center z-20">
                  <span className="text-white font-bold text-lg px-3 py-1.5 bg-black/70 rounded-lg uppercase"
                    style={{ textShadow: "2px 2px 0 #000, -1px -1px 0 #000" }}>
                    {bottomText}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Viral Score */}
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Viral Potential</span>
              <span className="text-lg font-bold text-purple-400">{viralScore}/100</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  viralScore > 70
                    ? "bg-gradient-to-r from-green-500 to-emerald-500"
                    : viralScore > 40
                    ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                    : "bg-gradient-to-r from-red-500 to-pink-500"
                }`}
                style={{ width: `${viralScore}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {viralScore > 70
                ? "🔥 High viral potential! Share now!"
                : viralScore > 40
                ? "📈 Decent engagement expected"
                : "💤 Might need more spice"}
            </p>
          </div>

          {/* Share Buttons */}
          <div className="flex gap-2">
            <button
              onClick={shareToX}
              className="flex-1 py-2 bg-black hover:bg-gray-900 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2 border border-gray-700"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              X
            </button>
            <button
              onClick={copyMeme}
              disabled={!selectedToken}
              className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2"
            >
              {copySuccess ? (
                <>
                  <span>✓</span> Copied!
                </>
              ) : (
                <>
                  <span>📋</span> Copy
                </>
              )}
            </button>
            <button
              onClick={saveMeme}
              disabled={isSaving || !selectedToken}
              className="flex-1 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <span>💾</span> Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
