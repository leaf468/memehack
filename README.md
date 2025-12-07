# MISP - Meme Intelligence Social Platform

> **"The Bloomberg Terminal for Meme Coins + Meme Factory"**

A decentralized platform that combines real-time market intelligence, AI-powered meme generation, and on-chain prediction markets for meme coin traders.

**Built for Memekathon Seoul 2025**

![MISP Dashboard](https://img.shields.io/badge/Status-Live-brightgreen) ![Next.js](https://img.shields.io/badge/Next.js-16-black) ![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue)

## Key Features

### 1. Cultural Impact Score
Unlike traditional price-only dashboards, MISP quantifies the **viral power** of meme coins:
- AI-generated score (0-100) based on social momentum
- Community engagement metrics
- Meme activity tracking
- Real-time sentiment analysis

### 2. AI Meme Generator
Create viral memes directly from market data:
- **Live Chart Background**: TradingView charts as meme backgrounds
- **AI Captions**: GPT-4o-mini generates context-aware meme text
- **Template Gallery**: Drake, Stonks, Doge, Pepe, Wojak, Giga Chad
- **One-Click Share**: Export to X (Twitter), copy to clipboard, or download PNG

### 3. On-Chain Prediction Markets
Bet on meme coin performance with smart contracts:
- Predict: Score Up, Viral Moment, Price Target
- Stake tokens and earn rewards
- Transparent on-chain settlement

### 4. Real-Time Analytics Dashboard
- **14+ Meme Coins** tracked across Ethereum, Solana, Base
- **Market Sentiment Gauge**: Visual fear/greed indicator
- **Meme Timeline**: Real-time viral events and price pumps
- **Token Correlation**: Identify correlated meme coins
- **Watchlist**: Personal token tracking with alerts

## Demo Highlights

| Feature | Description |
|---------|-------------|
| Cultural Score | See meme viral potential, not just price |
| Meme Generator | AI creates captions, share to X in one click |
| Prediction Market | On-chain betting on meme performance |
| Timeline | Real-time feed of viral moments |

## Deployed Contracts (MemeCore Formicarium Testnet)

| Contract | Address |
|----------|---------|
| MemeToken | `0x744dDd826A5B265cc9A7bf706F6bdB71bfc0Fd84` |
| MemeAnalytics | `0x53c681883942D76013942999046e7E0a22cC0fFD` |
| MemePrediction | `0x079D7afDACf922fED385fCBEC74596670Db24F07` |
| MemeReward | `0x11405e9533A7F38ccAB91023806E3ae2914b005D` |

**Network:** MemeCore Formicarium Testnet (Chain ID: 43521)
**Explorer:** https://formicarium.memecorescan.io

## Tech Stack

### Smart Contracts (Solidity)
- **MemeToken**: ERC20 governance token with minting/burning
- **MemeAnalytics**: On-chain cultural score tracking
- **MemePrediction**: Prediction market with staking
- **MemeReward**: Reward distribution system

### Frontend (Next.js 16)
- React 19 + TypeScript
- Tailwind CSS
- wagmi v2 + viem for Web3
- ConnectKit for wallet connection
- TradingView widget integration

### AI & Data
- **OpenAI GPT-4o-mini**: Meme caption generation, market insights
- **DexScreener API**: Real-time DEX prices
- **CoinGecko API**: Social & sentiment data
- **CoinPaprika API**: Additional price feeds

## Dashboard Components

| Component | Description |
|-----------|-------------|
| `TokenGrid` | Main token cards with price, sentiment, cultural score |
| `MemeGenerator` | AI-powered meme creation with chart backgrounds |
| `MemeTimeline` | Real-time viral events feed |
| `MemeVoting` | Community meme voting (Hot/New/Top) |
| `MarketSentimentGauge` | Visual market fear/greed indicator |
| `PriceAlerts` | Custom price movement alerts |
| `Watchlist` | Personal token tracking |
| `PriceComparisonChart` | Multi-token price comparison |
| `TokenCorrelation` | Correlation matrix between tokens |
| `ResponsivenessScore` | Token reactivity to market changes |

## Supported Tokens

| Token | Chain | Description |
|-------|-------|-------------|
| PEPE | Ethereum | The original Pepe meme coin |
| SHIB | Ethereum | Shiba Inu ecosystem |
| DOGE | Multi-chain | The OG meme coin |
| WIF | Solana | Dogwifhat |
| BONK | Solana | Solana's dog coin |
| FLOKI | Ethereum | Viking-themed meme |
| MOG | Ethereum | Mog Coin |
| BRETT | Base | Base chain meme |
| POPCAT | Solana | Pop Cat meme |
| NEIRO | Ethereum | New Doge tribute |
| MEME | Ethereum | Memecoin token |
| TURBO | Ethereum | AI-created meme coin |
| LADYS | Ethereum | Milady meme |
| SPX | Ethereum | SPX6900 |

## Getting Started

### Prerequisites
- Node.js 18+
- Foundry (for smart contracts)
- OpenAI API key (for AI features)

### Smart Contracts

```bash
# Install dependencies
forge install

# Build contracts
forge build

# Run tests
forge test

# Deploy to MemeCore Testnet
forge script script/Deploy.s.sol:DeployMemeCore \
  --rpc-url https://rpc.formicarium.memecore.net \
  --broadcast \
  --priority-gas-price 1000000000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local
# Add your OPENAI_API_KEY

# Run development server
npm run dev
```

Open http://localhost:3000

## Environment Variables

### Frontend (.env.local)
```
OPENAI_API_KEY=your_openai_api_key
```

### Smart Contracts (.env)
```
PRIVATE_KEY=your_wallet_private_key
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    MISP Frontend                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Dashboard   │  │ Meme Gen    │  │ Predictions │     │
│  │ + Analytics │  │ + AI Caption│  │ + Staking   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└────────────────────────┬────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ DexScreener │  │   OpenAI    │  │  CoinGecko  │
│  (Prices)   │  │ (AI/Memes)  │  │ (Sentiment) │
└─────────────┘  └─────────────┘  └─────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                 MemeCore Blockchain                      │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────┐ │
│  │ MemeToken │ │ Analytics │ │Prediction │ │ Reward  │ │
│  │  (ERC20)  │ │  (Score)  │ │ (Market)  │ │(Staking)│ │
│  └───────────┘ └───────────┘ └───────────┘ └─────────┘ │
└─────────────────────────────────────────────────────────┘
```

## One-Line Pitch

> **MISP transforms meme coin trading from price speculation to cultural intelligence, letting traders create, share, and profit from meme virality.**

## Team

Built with AI assistance at Memekathon Seoul 2025

## License

MIT
