// packages/agent/src/priceFeed.ts
//
// Feed harga fallback (Binance WebSocket) untuk BTC/ETH underlying.
// Dipakai HANYA untuk menghitung momentum & volatility di signal engine.
// Odds on-chain dan eksekusi/settlement tetap dari DreamDEX (lihat dreamdexClient.ts) —
// lihat spec §3 "Data resilience" untuk alasan kenapa dua sumber ini dipisah.

import WebSocket from "ws";

export interface PricePoint {
  price: number;
  timestamp: number;
}

const HISTORY_WINDOW_MS = 30 * 60 * 1000; // simpan 30 menit terakhir, cukup untuk window 15m/1h
const history = new Map<string, PricePoint[]>();
const sockets = new Map<string, WebSocket>();

/**
 * Mulai stream harga untuk daftar market (simbol Binance lower-case tanpa "usdt", mis. ["btc","eth"]).
 * Reconnect otomatis dengan backoff kalau koneksi putus — lihat spec §13 troubleshooting.
 */
export function startPriceFeed(markets: string[]): void {
  for (const market of markets) {
    history.set(market, []);
    connect(market, 1000);
  }
}

function connect(market: string, backoffMs: number): void {
  const symbol = `${market}usdt`;
  const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@trade`);

  ws.on("open", () => {
    console.log(`[priceFeed] connected: ${symbol}`);
  });

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      const price = parseFloat(msg.p);
      if (!Number.isFinite(price)) return;
      pushPrice(market, { price, timestamp: Date.now() });
    } catch {
      // abaikan pesan yang tidak bisa di-parse, jangan crash agent loop
    }
  });

  ws.on("close", () => {
    console.warn(`[priceFeed] disconnected: ${symbol}, reconnecting in ${backoffMs}ms`);
    setTimeout(() => connect(market, Math.min(backoffMs * 2, 30_000)), backoffMs);
  });

  ws.on("error", (err) => {
    console.error(`[priceFeed] error on ${symbol}:`, err.message);
    ws.close();
  });

  sockets.set(market, ws);
}

function pushPrice(market: string, point: PricePoint): void {
  const arr = history.get(market) ?? [];
  arr.push(point);
  const cutoff = Date.now() - HISTORY_WINDOW_MS;
  while (arr.length > 0 && arr[0].timestamp < cutoff) arr.shift();
  history.set(market, arr);
}

/** Ambil harga N menit terakhir untuk sebuah market. Kosong kalau belum cukup data. */
export function getRecentPrices(market: string, windowMinutes: number): number[] {
  const arr = history.get(market) ?? [];
  const cutoff = Date.now() - windowMinutes * 60 * 1000;
  return arr.filter((p) => p.timestamp >= cutoff).map((p) => p.price);
}

export function stopPriceFeed(): void {
  for (const ws of sockets.values()) ws.close();
  sockets.clear();
}
