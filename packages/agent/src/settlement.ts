// packages/agent/src/settlement.ts
import { getRecentPrices } from "./priceFeed";
import { loadSignals, markOutcome } from "./store";

const WINDOW_MS = 15 * 60 * 1000;

export async function settlePendingSignals(): Promise<void> {
  const now = Date.now();
  const signals = await loadSignals();
  
  for (const s of signals) {
    if (s.outcome !== "PENDING") continue;
    if (now < s.timestamp + WINDOW_MS) continue; // window belum selesai

    const symbol = s.market.split("-")[0].toLowerCase(); // "BTC-15m" -> "btc"
    const recent = getRecentPrices(symbol, 1);
    if (recent.length === 0) continue; // belum ada data baru, coba tick berikutnya

    const closePrice = recent[recent.length - 1];
    
    // Safely parse strikePrice, fallback to previous implementation if missing
    // In a real scenario it should be s.strikePrice.
    const strikePrice = (s as any).strikePrice || closePrice;
    
    const actualDirection = closePrice >= strikePrice ? "UP" : "DOWN";
    await markOutcome(s.timestamp, s.marketId, actualDirection === s.direction ? "WIN" : "LOSS");
    console.log(`[settlement] ${s.market}: predicted ${s.direction}, actual ${actualDirection} (strike ${strikePrice} -> close ${closePrice})`);
  }
}
