# MISP - Meme Intelligence Social Platform

A decentralized platform for tracking, analyzing, and predicting meme coin cultural impact using AI-powered insights and on-chain analytics.

**Built for Memekathon Seoul 2025**

## Overview

MISP combines real-time market data, social sentiment analysis, and AI-powered insights to help users understand the cultural momentum behind meme coins. The platform features on-chain prediction markets and a reward system for accurate predictions.

## Deployed Contracts (MemeCore Formicarium Testnet)

| Contract | Address |
|----------|---------|
| MemeToken | `0x744dDd826A5B265cc9A7bf706F6bdB71bfc0Fd84` |
| MemeAnalytics | `0x53c681883942D76013942999046e7E0a22cC0fFD` |
| MemePrediction | `0x079D7afDACf922fED385fCBEC74596670Db24F07` |
| MemeReward | `0x11405e9533A7F38ccAB91023806E3ae2914b005D` |

**Network:** MemeCore Formicarium Testnet (Chain ID: 43521)
**Explorer:** https://formicarium.memecorescan.io

## Features

### Real-time Token Analysis
- Track 14+ meme coins across Ethereum, Solana, and Base chains
- Live price data from DexScreener and CoinPaprika APIs
- Social sentiment from CoinGecko community data

### Cultural Impact Score
AI-generated score (0-100) based on:
- Viral momentum and meme activity
- Community engagement metrics
- Price action and volume trends
- Social media sentiment

### On-chain Prediction Markets
- Predict meme coin performance (Score Up, Viral, Price Target)
- Stake tokens on predictions
- Earn rewards for accurate predictions

### AI Market Analysis
- GPT-4o-mini powered market insights
- Real-time sentiment analysis
- Trend identification and alerts

## Tech Stack

### Smart Contracts (Solidity)
- **MemeToken**: ERC20 governance token with minting/burning
- **MemeAnalytics**: On-chain cultural score tracking with oracle updates
- **MemePrediction**: Prediction market for meme coin performance
- **MemeReward**: Staking and reward distribution system

### Frontend (Next.js 14)
- React with TypeScript
- Tailwind CSS for styling
- wagmi + viem for Web3 integration
- ConnectKit for wallet connection

### Data Sources
- **DexScreener API**: Real-time DEX price data (free, no API key)
- **CoinPaprika API**: DOGE price data (free, no API key)
- **CoinGecko API**: Social & sentiment data
- **OpenAI API**: AI market analysis (GPT-4o-mini)

## Supported Tokens

| Token | Chain | Contract |
|-------|-------|----------|
| PEPE | Ethereum | 0x6982508145454Ce325dDbE47a25d4ec3d2311933 |
| SHIB | Ethereum | 0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE |
| DOGE | Multi-chain | - |
| WIF | Solana | EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm |
| BONK | Solana | DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263 |
| FLOKI | Ethereum | 0xcf0C122c6b73ff809C693DB761e7BaeBe62b6a2E |
| MOG | Ethereum | 0xaaeE1A9723aaDB7afA2810263653A34bA2C21C7a |
| BRETT | Base | 0x532f27101965dd16442E59d40670FaF5eBB142E4 |
| POPCAT | Solana | 7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr |
| NEIRO | Ethereum | 0x812Ba41e071C7b7fA4EBcFB62dF5F45f6fA853Ee |
| MEME | Ethereum | 0xb131f4A55907B10d1F0A50d8ab8FA09EC342cd74 |
| TURBO | Ethereum | 0xA35923162C49cF95e6BF26623385eb431ad920D3 |
| LADYS | Ethereum | 0x12970E6868f88f6557B76120662c1B3E50A646bf |
| SPX | Ethereum | 0xE0f63A424a4439cBE457D80E4f4b51aD25b2c56C |

## Getting Started

### Prerequisites
- Node.js 18+
- Foundry (for smart contracts)

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
┌─────────────────┐     ┌──────────────────┐
│   Frontend      │────▶│  DexScreener API │
│   (Next.js)     │     └──────────────────┘
│                 │     ┌──────────────────┐
│                 │────▶│  CoinPaprika API │
│                 │     └──────────────────┘
│                 │     ┌──────────────────┐
│                 │────▶│  OpenAI API      │
│                 │     └──────────────────┘
│                 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MemeCore Chain │
│  ┌───────────┐  │
│  │MemeToken  │  │
│  ├───────────┤  │
│  │Analytics  │  │
│  ├───────────┤  │
│  │Prediction │  │
│  ├───────────┤  │
│  │MemeReward │  │
│  └───────────┘  │
└─────────────────┘
```

## License

MIT
