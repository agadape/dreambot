// packages/agent/src/doctor.ts
//
// Verifikasi read-only: cek .env, koneksi RPC, dan koneksi DreamDEX API.
// Tidak mengirim transaksi apa pun. Jalankan ini duluan sebelum `npm run dev`.

import "dotenv/config";
import { getActiveMarkets } from "./dreamdexClient";

async function checkEnv(): Promise<boolean> {
  const required = ["RPC_URL", "DREAMDEX_API_URL", "MARKETS"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(`❌ .env belum lengkap, kurang: ${missing.join(", ")}`);
    return false;
  }
  console.log("✅ .env lengkap");
  return true;
}

async function checkRpc(): Promise<boolean> {
  try {
    const res = await fetch(process.env.RPC_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] }),
    });
    const data = await res.json();
    const chainId = parseInt(data.result, 16);
    const expected = Number(process.env.CHAIN_ID ?? 50312);
    if (chainId !== expected) {
      console.error(`❌ RPC menjawab chainId ${chainId}, diharapkan ${expected}`);
      return false;
    }
    console.log(`✅ RPC terhubung (chain ${chainId})`);
    return true;
  } catch (err) {
    console.error("❌ Tidak bisa konek ke RPC_URL:", (err as Error).message);
    return false;
  }
}

async function checkDreamdex(): Promise<boolean> {
  const markets = await getActiveMarkets();
  if (markets.length === 0) {
    console.warn(
      "⚠️  getActiveMarkets() balik kosong — kemungkinan besar EVENT_CONTRACTS_MARKETS_PATH " +
        "di dreamdexClient.ts belum benar. Ini yang WAJIB dicek manual di dokumentasi Hari 1 (lihat spec §12.3)."
    );
    return false;
  }
  console.log(`✅ DreamDEX API terhubung, ${markets.length} market aktif ditemukan`);
  return true;
}

async function main() {
  console.log("=== DreamBot Signal — doctor ===\n");
  const envOk = await checkEnv();
  if (!envOk) process.exit(1);
  const rpcOk = await checkRpc();
  const dreamdexOk = await checkDreamdex();
  console.log("\n=== Ringkasan ===");
  console.log(`RPC: ${rpcOk ? "OK" : "GAGAL"}`);
  console.log(`DreamDEX API: ${dreamdexOk ? "OK" : "PERLU DICEK MANUAL"}`);
  if (!dreamdexOk) {
    console.log(
      "\n→ Ini NORMAL di Hari 1 sebelum endpoint dikonfirmasi. Jangan lanjut ke signal engine sampai ini hijau."
    );
  }
}

main();
