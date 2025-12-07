"use client";

import { useState, useRef, useCallback } from "react";

interface ScreenshotToMemeProps {
  onMemeCreated?: (memeData: MemeData) => void;
}

interface MemeData {
  imageUrl: string;
  topText: string;
  bottomText: string;
  timestamp: Date;
}

// Meme overlay styles
const OVERLAY_STYLES = [
  { id: "classic", name: "Classic", topColor: "white", bottomColor: "white", stroke: "black" },
  { id: "neon", name: "Neon", topColor: "#00ff00", bottomColor: "#ff00ff", stroke: "black" },
  { id: "fire", name: "Fire", topColor: "#ff6b00", bottomColor: "#ff0000", stroke: "black" },
  { id: "ice", name: "Ice", topColor: "#00ffff", bottomColor: "#0080ff", stroke: "white" },
  { id: "gold", name: "Gold", topColor: "#ffd700", bottomColor: "#ffaa00", stroke: "black" },
];

// Pre-made crypto meme captions
const CRYPTO_CAPTIONS = {
  pump: [
    { top: "WHEN THE CHART", bottom: "GOES VERTICAL" },
    { top: "ME WATCHING", bottom: "MY 10X BAG" },
    { top: "PAPER HANDS:", bottom: "SOLD TOO EARLY" },
    { top: "DIAMOND HANDS", bottom: "WINNING AGAIN" },
  ],
  dump: [
    { top: "THIS IS FINE", bottom: "(IT'S NOT FINE)" },
    { top: "MY PORTFOLIO", bottom: "AFTER THE DIP" },
    { top: "BOUGHT THE DIP", bottom: "IT KEEPS DIPPING" },
    { top: "ZOOM OUT", bottom: "STILL DOWN 90%" },
  ],
  sideways: [
    { top: "CRAB MARKET", bottom: "DAY 47" },
    { top: "ANY MINUTE NOW", bottom: "THE PUMP WILL COME" },
    { top: "CONSOLIDATION", bottom: "OR DISTRIBUTION?" },
    { top: "WAITING FOR", bottom: "SOMETHING TO HAPPEN" },
  ],
};

export function ScreenshotToMeme({ onMemeCreated }: ScreenshotToMemeProps) {
  const [image, setImage] = useState<string | null>(null);
  const [topText, setTopText] = useState("");
  const [bottomText, setBottomText] = useState("");
  const [selectedStyle, setSelectedStyle] = useState(OVERLAY_STYLES[0]);
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
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
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle paste from clipboard
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              setImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    }
  }, []);

  // Add paste listener
  useState(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("paste", handlePaste);
      return () => window.removeEventListener("paste", handlePaste);
    }
  });

  // Apply random caption
  const applyRandomCaption = (type: "pump" | "dump" | "sideways") => {
    const captions = CRYPTO_CAPTIONS[type];
    const random = captions[Math.floor(Math.random() * captions.length)];
    setTopText(random.top);
    setBottomText(random.bottom);
  };

  // Generate AI caption for the screenshot
  const generateAICaption = async () => {
    if (!image) return;

    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Generate a funny crypto meme caption for a chart screenshot. The caption should be in two parts: TOP TEXT (short, 3-5 words) and BOTTOM TEXT (short, 3-5 words). Make it relatable to crypto traders. Format your response exactly like this:
TOP: [top text here]
BOTTOM: [bottom text here]`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.content) {
          const lines = data.content.split("\n");
          for (const line of lines) {
            if (line.startsWith("TOP:")) {
              setTopText(line.replace("TOP:", "").trim());
            } else if (line.startsWith("BOTTOM:")) {
              setBottomText(line.replace("BOTTOM:", "").trim());
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to generate caption:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Download meme
  const downloadMeme = () => {
    if (!canvasRef.current || !image) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw image
      ctx.drawImage(img, 0, 0);

      // Text settings
      const fontSize = Math.max(24, img.width / 15);
      ctx.font = `bold ${fontSize}px Impact, sans-serif`;
      ctx.textAlign = "center";
      ctx.lineWidth = fontSize / 8;

      // Draw top text
      if (topText) {
        ctx.strokeStyle = selectedStyle.stroke;
        ctx.fillStyle = selectedStyle.topColor;
        ctx.strokeText(topText.toUpperCase(), img.width / 2, fontSize + 10);
        ctx.fillText(topText.toUpperCase(), img.width / 2, fontSize + 10);
      }

      // Draw bottom text
      if (bottomText) {
        ctx.strokeStyle = selectedStyle.stroke;
        ctx.fillStyle = selectedStyle.bottomColor;
        ctx.strokeText(bottomText.toUpperCase(), img.width / 2, img.height - 20);
        ctx.fillText(bottomText.toUpperCase(), img.width / 2, img.height - 20);
      }

      // Download
      const link = document.createElement("a");
      link.download = `crypto-meme-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      // Callback
      if (onMemeCreated) {
        onMemeCreated({
          imageUrl: canvas.toDataURL("image/png"),
          topText,
          bottomText,
          timestamp: new Date(),
        });
      }
    };
    img.src = image;
  };

  // Copy to clipboard
  const copyToClipboard = async () => {
    if (!canvasRef.current || !image) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = async () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const fontSize = Math.max(24, img.width / 15);
      ctx.font = `bold ${fontSize}px Impact, sans-serif`;
      ctx.textAlign = "center";
      ctx.lineWidth = fontSize / 8;

      if (topText) {
        ctx.strokeStyle = selectedStyle.stroke;
        ctx.fillStyle = selectedStyle.topColor;
        ctx.strokeText(topText.toUpperCase(), img.width / 2, fontSize + 10);
        ctx.fillText(topText.toUpperCase(), img.width / 2, fontSize + 10);
      }

      if (bottomText) {
        ctx.strokeStyle = selectedStyle.stroke;
        ctx.fillStyle = selectedStyle.bottomColor;
        ctx.strokeText(bottomText.toUpperCase(), img.width / 2, img.height - 20);
        ctx.fillText(bottomText.toUpperCase(), img.width / 2, img.height - 20);
      }

      try {
        canvas.toBlob(async (blob) => {
          if (blob) {
            await navigator.clipboard.write([
              new ClipboardItem({ "image/png": blob }),
            ]);
            alert("Meme copied to clipboard!");
          }
        });
      } catch (error) {
        console.error("Failed to copy:", error);
      }
    };
    img.src = image;
  };

  return (
    <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 rounded-xl p-5 border border-cyan-700/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📸</span>
          <h3 className="text-lg font-bold text-white">Screenshot to Meme</h3>
        </div>
        <span className="text-xs bg-cyan-600/30 text-cyan-400 px-2 py-1 rounded-full">
          Paste or Drop
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Upload & Controls */}
        <div className="space-y-4">
          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? "border-cyan-400 bg-cyan-900/30"
                : "border-gray-600 hover:border-cyan-500 hover:bg-gray-800/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="text-4xl mb-2">📷</div>
            <p className="text-gray-400 text-sm">
              Drop chart screenshot here, click to upload,
              <br />
              or <span className="text-cyan-400">Ctrl+V</span> to paste
            </p>
          </div>

          {/* Quick captions */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">
              Quick Captions
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => applyRandomCaption("pump")}
                className="py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg text-xs font-medium border border-green-700/50"
              >
                Pump
              </button>
              <button
                onClick={() => applyRandomCaption("dump")}
                className="py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-xs font-medium border border-red-700/50"
              >
                Dump
              </button>
              <button
                onClick={() => applyRandomCaption("sideways")}
                className="py-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded-lg text-xs font-medium border border-yellow-700/50"
              >
                Crab
              </button>
            </div>
          </div>

          {/* Text inputs */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">Top Text</label>
            <input
              type="text"
              value={topText}
              onChange={(e) => setTopText(e.target.value)}
              placeholder="WHEN THE CHART..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white uppercase focus:border-cyan-500 focus:outline-none"
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
              placeholder="GOES VERTICAL"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white uppercase focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Style selection */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">
              Text Style
            </label>
            <div className="flex gap-2">
              {OVERLAY_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                    selectedStyle.id === style.id
                      ? "bg-cyan-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {style.name}
                </button>
              ))}
            </div>
          </div>

          {/* AI Generate */}
          <button
            onClick={generateAICaption}
            disabled={!image || isGenerating}
            className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-medium text-white hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                AI Generate Caption
              </>
            )}
          </button>
        </div>

        {/* Right: Preview */}
        <div className="space-y-4">
          {/* Preview */}
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <div className="aspect-video bg-gray-800 rounded-lg flex flex-col items-center justify-center relative overflow-hidden">
              {image ? (
                <>
                  <img
                    src={image}
                    alt="Screenshot"
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                  {/* Top text overlay */}
                  {topText && (
                    <div className="absolute top-2 left-0 right-0 text-center z-10">
                      <span
                        className="font-bold text-lg px-2"
                        style={{
                          color: selectedStyle.topColor,
                          textShadow: `2px 2px 0 ${selectedStyle.stroke}, -2px -2px 0 ${selectedStyle.stroke}, 2px -2px 0 ${selectedStyle.stroke}, -2px 2px 0 ${selectedStyle.stroke}`,
                          fontFamily: "Impact, sans-serif",
                        }}
                      >
                        {topText.toUpperCase()}
                      </span>
                    </div>
                  )}
                  {/* Bottom text overlay */}
                  {bottomText && (
                    <div className="absolute bottom-2 left-0 right-0 text-center z-10">
                      <span
                        className="font-bold text-lg px-2"
                        style={{
                          color: selectedStyle.bottomColor,
                          textShadow: `2px 2px 0 ${selectedStyle.stroke}, -2px -2px 0 ${selectedStyle.stroke}, 2px -2px 0 ${selectedStyle.stroke}, -2px 2px 0 ${selectedStyle.stroke}`,
                          fontFamily: "Impact, sans-serif",
                        }}
                      >
                        {bottomText.toUpperCase()}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-2">📊</div>
                  <p className="text-sm">Upload a chart screenshot</p>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={downloadMeme}
              disabled={!image}
              className="flex-1 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2"
            >
              <span>💾</span> Download
            </button>
            <button
              onClick={copyToClipboard}
              disabled={!image}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2"
            >
              <span>📋</span> Copy
            </button>
            <button
              onClick={() => {
                setImage(null);
                setTopText("");
                setBottomText("");
              }}
              disabled={!image}
              className="py-2 px-4 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white"
            >
              Clear
            </button>
          </div>

          {/* Tips */}
          <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
            <p className="text-xs text-gray-500">
              <span className="text-cyan-400">Pro tip:</span> Take a screenshot of any trading chart,
              paste it here with Ctrl+V, add some text, and share your trading journey!
            </p>
          </div>
        </div>
      </div>

      {/* Hidden canvas for export */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
