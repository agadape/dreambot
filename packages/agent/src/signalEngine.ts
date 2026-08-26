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
  strikePriceAtSignal: number;
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
  const currentPrice = prices[prices.length - 1]; // get current close price for strike

  // Ambil implied probability (0..1) dari chain
  const odds = await getMarketOdds(market.id);
  const upProbability = odds?.impliedProbabilityUp ?? 0.5;

  const reasoning: string[] = [];
  let score = 0.5;

  if (Math.abs(mom) > MOMENTUM_THRESHOLD) {
    if (mom > 0) {
      reasoning.push(`Realized momentum in ${market.windowMinutes}m is positive (+${(mom * 100).toFixed(2)}%).`);
      score += 0.2;
    } else {
      reasoning.push(`Realized momentum in ${market.windowMinutes}m is negative (${(mom * 100).toFixed(2)}%).`);
      score -= 0.2;
    }
  } else {
    reasoning.push("Momentum is currently flat/neutral.");
  }

  if (vol > 0.005) {
    reasoning.push(`High Realized Volatility (${(vol * 100).toFixed(2)}%), momentum decay is accelerated.`);
    score = score > 0.5 ? score - 0.1 : score + 0.1;
  } else {
    reasoning.push(`Stable volatility (${(vol * 100).toFixed(2)}%), trend continuation expected.`);
  }

  if (upProbability > 0.6 && score > 0.5) {
    reasoning.push(`On-chain odds implied probability indicates UP skew (${(upProbability * 100).toFixed(0)}%). Alignment validated.`);
    score += 0.15;
  } else if (upProbability < 0.4 && score < 0.5) {
    reasoning.push(`On-chain odds implied probability indicates DOWN skew (${(1 - upProbability) * 100}%). Alignment validated.`);
    score -= 0.15;
  }

  // Finalize
  const direction = score > 0.5 ? "UP" : "DOWN";
  let confidence = Math.abs(score - 0.5) * 2;
  confidence = Math.min(Math.max(confidence, 0), 1); // clamp 0-1

  if (confidence < 0.2) return null; // terlalu ragu

  return {
    market: market.symbol,
    marketId: market.id,
    direction,
    confidence,
    reasoning,
    timestamp: Date.now(),
    strikePriceAtSignal: currentPrice,
  };
}
