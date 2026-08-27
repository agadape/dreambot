<div align="center">
  <img src="https://raw.githubusercontent.com/agadape/dreambot/main/apps/dashboard/public/favicon.ico" alt="Logo" width="80" height="80">
  <h1 align="center">DreamBot Signal</h1>
  <p align="center">
    <strong>Autonomous AI-driven Momentum & Volatility Indexing Agent on Somnia</strong>
    <br />
    <a href="https://dreambot-dexsonia.vercel.app">View Live Dashboard</a>
    ·
    <a href="https://github.com/agadape/dreambot/issues">Report Bug</a>
  </p>
</div>

---

> 🏆 **Built for the Somnia DreamDEX Event Contracts Hackathon (2026)**

DreamBot Signal is a fully autonomous, serverless AI trading agent designed to monitor real-time market conditions for the **DreamDEX Event Contracts (Somnia Shannon Testnet)**. It generates directional signals (UP/DOWN) based on *sub-second momentum*, *historical volatility*, and *on-chain odds skew*, then narrates its reasoning using a Large Language Model (Groq).

Instead of being a "black-box" trading bot, DreamBot is **100% transparent**. Every generated signal comes with an auditable **Execution Trace** and a human-readable narrative, pushing live alerts directly to a **Telegram Bot** and updating a breathtaking Awwwards-tier public dashboard.

## 🚀 Core Innovations & Hackathon Judging Criteria

### 1. The X-Factor: Zero-Trust "Commit-Reveal" Architecture (Innovation & Technical)
Instead of just asking users to *trust* that the bot is profitable, DreamBot uses a **cryptographic Commit-Reveal scheme** natively on Somnia Shannon Testnet. 
- **COMMIT**: When a signal is generated, the bot creates a `keccak256` hash of its prediction + a cryptographic nonce. It sends this hash as a payload in a 0-value transaction to the Somnia chain **before** the 15-minute window closes.
- **REVEAL**: Once the Event Contract settles, the bot reveals the raw data on the public dashboard. 
- **VERIFY**: Anyone (including hackathon judges) can click **"VERIFY COMMITMENT"** on the dashboard to view the transaction on the Somnia Block Explorer, mathematically proving the bot predicted the future, not the past.

### 2. DreamBot Oracle as a Public Good (Business & Ecosystem Impact)
DreamBot is not just a personal trading bot; it is **Micro-Hedging Infrastructure**. By surfacing its verified win-rate and public signals, it acts as a "Social Trading Oracle". 
- **Attracting Users**: The dashboard includes a "Share to X (Twitter)" button for winning trades, instantly generating viral proof-of-performance marketing for the Somnia ecosystem.
- **Ecosystem Expansion**: Other developers in the Somnia ecosystem can query the DreamBot API to trigger automated hedges for their own liquidity providers when short-term volatility spikes.

### 3. Awwwards-Tier 3D Brutalist Dashboard (UX & Design)
Built with Next.js, Framer Motion, and React Three Fiber, the public dashboard provides a visually striking, highly technical "Quant Terminal" aesthetic. It translates pure mathematical data into neural narratives via Groq (Llama 3.1) so retail users can understand *why* the market is moving.

## 🏗 Architecture

```text
┌────────────────┐      (1) Price Data       ┌─────────────────┐
│  Binance REST  ├──────────────────────────►│   Signal Engine │
└────────────────┘                           │   (GitHub Actions)│
                                             │    CRON (5 min)   │
┌────────────────┐      (2) Odds / Markets   │                   │
│ Somnia Testnet ├──────────────────────────►│                   │
└────────────────┘                           └───────┬─────────┬─┘
                                                     │         │ 
┌────────────────┐      (3) NLP Narrative    ◄───────┘         │ (4) Alerts
│   Groq LLM     ├──────────────────────────►                  │ 
└────────────────┘                           ┌───────────────┐ │ ┌────────────┐
                                             │ Upstash Redis │ └►│  Telegram  │
                                             └───────┬───────┘   └────────────┘
┌────────────────┐      (5) Global Win Rate          │
│ Vercel Next.js │◄──────────────────────────────────┘
└────────────────┘
```

## 🚀 Quick Start (Deployment Guide)

Want to run your own instance of DreamBot? You don't need a server.

### 1. Fork & Clone
Fork this repository to your GitHub account.

### 2. Set Up Upstash Redis
Create a free database on [Upstash](https://upstash.com). Get your `KV_REST_API_URL` and `KV_REST_API_TOKEN`.

### 3. Set Up Telegram Bot
Talk to [@BotFather](https://t.me/botfather) on Telegram, create a new bot, and get your `TELEGRAM_BOT_TOKEN`.
Send a message to your bot, then visit `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` to get your `TELEGRAM_CHAT_ID`.

### 4. Set Up Groq LLM
Get a free API key from [Groq Cloud](https://console.groq.com/keys).

### 5. Add GitHub Secrets
Go to your forked repository's **Settings > Secrets and variables > Actions**. Add the following Repository Secrets:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `LLM_API_URL` (Set to `https://api.groq.com/openai/v1/chat/completions`)
- `LLM_API_KEY`

### 6. Enable GitHub Actions
Go to the **Actions** tab in your repo and enable the workflows. The bot will now run autonomously every 5 minutes!

### 7. Deploy Dashboard to Vercel
Connect your repo to Vercel, and ensure you add the same `KV_REST_API_URL` and `KV_REST_API_TOKEN` to your Vercel Environment Variables.

---
*Disclaimer: This is an experimental hackathon project built for a testnet. Trading crypto involves extreme risk.*