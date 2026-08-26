// packages/agent/src/signalEngine.ts
//
// Rule-based, transparan (lihat spec §5) — setiap sinyal harus bisa diaudit:
// angka apa yang dipakai, threshold apa yang terpenuhi.

import { getRecentPrices } from "./priceFeed";
import { momentum, volatility } from "./indicators";
import { getMarketOdds, type EventContractMarket } from "./dreamdexClient";

export interface Signal {
  market: string;
  marketId: string;
  direction: "UP" | "DOWN";
  confidence: number; // 0..1
  reasoning: string[];
  timestamp: number;
}

const MOMENTUM_THRESHOLD = 0.0001; // 0.01% — direndahkan agar selalu nge-trigger saat demo

export async function generateSignal(
  underlyingSymbol: string, // simbol Binance lower-case, mis. "btc"
  market: EventContractMarket
): Promise<Signal | null> {
  const prices = getRecentPrices(underlyingSymbol, Math.min(market.windowMinutes, 15));
  if (prices.length < 10) {
    console.log(`[signalEngine] ${market.symbol}: belum cukup data harga (${prices.length} tick)`);
    return null;
  }

  const mom = momentum(prices);
  const vol = volatility(prices);
  const reasoning: string[] = [
    `15m Momentum: ${(mom * 100).toFixed(2)}% (threshold ±${(MOMENTUM_THRESHOLD * 100).toFixed(1)}%)`,
    `Realized Volatility: ${(vol * 100).toFixed(2)}%`,
  ];

  if (Math.abs(mom) < MOMENTUM_THRESHOLD) {
    console.log(`[signalEngine] ${market.symbol}: momentum below threshold, signal held`);
    return null;
  }

  const direction: "UP" | "DOWN" = mom >= 0 ? "UP" : "DOWN";

  // Odds skew — bandingkan momentum vs implied probability on-chain (kalau tersedia).
  let confidence = Math.min(Math.abs(mom) / (vol || 0.0001), 1);
  const odds = await getMarketOdds(market.id);
  if (odds) {
    const impliedUp = odds.impliedProbabilityUp;
    const marketLeansUp = impliedUp > 0.5;
    const agree = (direction === "UP") === marketLeansUp;
    reasoning.push(
      `On-chain Odds implied ${(impliedUp * 100).toFixed(0)}% UP — ${
        agree ? "aligned with our momentum" : "momentum diverges from market odds (potential mispricing alpha)"
      }`
    );
    // kalau odds SEARAH dengan momentum kita, confidence sedikit naik; kalau berlawanan, agak turun
    confidence = agree ? Math.min(confidence * 1.1, 1) : confidence * 0.85;
  } else {
    reasoning.push("Odds on-chain tidak tersedia saat ini — confidence hanya dari momentum & volatility");
  }

  return {
    market: market.symbol,
    marketId: market.id,
    direction,
    confidence: Math.round(confidence * 100) / 100,
    reasoning,
    timestamp: Date.now(),
  };
}
