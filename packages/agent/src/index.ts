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
import { getActiveMarkets, executeTrade, type EventContractMarket } from "./dreamdexClient";
import { sendTelegramAlert } from "./telegram";
import { buildCommitment, commitOnChain } from "./commitOnChain";
import { settlePendingSignals } from "./settlement";

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

      // 1. COMMIT dulu sebelum apa pun ditampilkan ke luar
      const commitment = buildCommitment({
        market: signal.market,
        marketId: signal.marketId,
        direction: signal.direction,
        confidence: signal.confidence,
        strikePrice: signal.strikePriceAtSignal,
      });
      const { txHash: commitTxHash } = await commitOnChain(commitment);

      // 2. REVEAL - baru sekarang narasikan & tampilkan
      const narrative = await narrate(signal);
      const stored = await saveSignal(signal, narrative, { 
        commitTxHash, 
        nonce: commitment.nonce, 
        strikePrice: commitment.strikePrice 
      });

      console.log(`\n[agent] sinyal baru — ${stored.market} ${stored.direction} (confidence ${stored.confidence})`);
      console.log(`  reasoning: ${stored.reasoning.join(" | ")}`);
      console.log(`  narasi: ${stored.narrative}`);
      console.log(`  commitment: ${commitTxHash}`);
      
      // Push ke Telegram
      const telegramMsg = `🚨 *DREAMBOT SIGNAL* 🚨\n\n*${stored.market}* -> *${stored.direction}*\n_Confidence:_ ${Math.round(stored.confidence * 100)}%\n\n*Narrative:*\n${stored.narrative}\n\n🔗 On-chain commitment: \`${commitTxHash}\`\n[Verify](https://shannon-explorer.somnia.network/tx/${commitTxHash})\n[Dashboard](https://dreambot-dexsonia.vercel.app/)`;
      sendTelegramAlert(telegramMsg);

      // 3. Eksekusi otomatis - menghormati DRY_RUN (sudah dihandle di dreamdexClient.ts placeEventContractOrder)
      try {
        await executeTrade(market, signal.direction, signal.confidence);
      } catch (err) {
        console.error(`[agent] executeTrade gagal untuk ${symbol}:`, (err as Error).message);
      }
    } catch (err) {
      // satu market gagal tidak boleh menjatuhkan seluruh loop
      console.error(`[agent] error saat proses ${symbol}:`, (err as Error).message);
    }
  }
}

async function main(): Promise<void> {
  console.log("=== DreamBot Signal — agent loop ===");
  console.log(`Markets: ${UNDERLYING_SYMBOLS.join(", ")} | interval: ${LOOP_INTERVAL_MS / 1000}s\n`);

  startPriceFeed(UNDERLYING_SYMBOLS);

  // beri waktu price feed terisi dulu sebelum tick pertama
  await new Promise((r) => setTimeout(r, 15_000));

  const runTick = async () => {
    const activeMarkets = await getActiveMarkets();
    if (activeMarkets.length === 0) {
      console.warn("[agent] getActiveMarkets() kosong — cek dreamdexClient.ts / jalankan `npm run doctor` dulu");
    }
    await tick(activeMarkets);
    
    // Settlement mandiri di setiap loop
    try {
      await settlePendingSignals();
    } catch (err) {
      console.error("[agent] error settling signals:", (err as Error).message);
    }
  };

  await runTick();
  
  console.log("[agent] tick selesai. Keluar dari proses agar CRON berikutnya bisa berjalan.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[agent] fatal error:", err);
  process.exit(1);
});
