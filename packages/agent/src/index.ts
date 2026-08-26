// packages/agent/src/index.ts
//
// Agent loop utama: setiap LOOP_INTERVAL_MS, untuk tiap market aktif â
// generate sinyal â narasikan â simpan. Dashboard Next.js membaca hasilnya
// dari packages/agent/data/signals.json (lihat store.ts).

import "dotenv/config";
import { startPriceFeed } from "./priceFeed";
import { generateSignal } from "./signalEngine";
import { narrate } from "./narrator";
import { saveSignal } from "./store";
import { getActiveMarkets, type EventContractMarket } from "./dreamdexClient";

const LOOP_INTERVAL_MS = 15 * 1000; // 15 detik (dipercepat untuk demo)
const UNDERLYING_SYMBOLS = (process.env.MARKETS ?? "btc,eth").split(",").map((s) => s.trim().toLowerCase());

async function tick(activeMarkets: EventContractMarket[]): Promise<void> {
  for (const symbol of UNDERLYING_SYMBOLS) {
    const market = activeMarkets.find((m) => m.symbol.toLowerCase() === symbol);
    if (!market) {
      console.log(`[agent] tidak ada Event Contract market aktif untuk ${symbol}, skip`);
      continue;
    }

    try {
      const signal = await generateSignal(symbol, market);
      if (!signal) continue; // sinyal ditahan (momentum terlalu lemah / data belum cukup)

      const narrative = await narrate(signal);
      const stored = await saveSignal(signal, narrative);
      console.log(`\n[agent] sinyal baru â ${stored.market} ${stored.direction} (confidence ${stored.confidence})`);
      console.log(`  reasoning: ${stored.reasoning.join(" | ")}`);
      console.log(`  narasi: ${stored.narrative}`);
      
      // Hari 9-10: Eksekusi otomatis
      import("./dreamdexClient").then((mod) => {
        mod.executeTrade(market, signal.direction, signal.confidence);
      });
    } catch (err) {
      // satu market gagal tidak boleh menjatuhkan seluruh loop
      console.error(`[agent] error saat proses ${symbol}:`, (err as Error).message);
    }
  }
}

async function main(): Promise<void> {
  console.log("=== DreamBot Signal â agent loop ===");
  console.log(`Markets: ${UNDERLYING_SYMBOLS.join(", ")} | interval: ${LOOP_INTERVAL_MS / 1000}s\n`);

  startPriceFeed(UNDERLYING_SYMBOLS);

  // beri waktu price feed terisi dulu sebelum tick pertama
  await new Promise((r) => setTimeout(r, 15_000));

  const runTick = async () => {
    const activeMarkets = await getActiveMarkets();
    if (activeMarkets.length === 0) {
      console.warn("[agent] getActiveMarkets() kosong â cek dreamdexClient.ts / jalankan `npm run doctor` dulu");
    }
    await tick(activeMarkets);
  };

  await runTick();
  setInterval(runTick, LOOP_INTERVAL_MS);
}

main().catch((err) => {
  console.error("[agent] fatal error:", err);
  process.exit(1);
});
