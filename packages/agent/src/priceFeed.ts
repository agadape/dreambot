import WebSocket from "ws";

export interface PricePoint {
  price: number;
  timestamp: number;
}

const HISTORY_WINDOW_MS = 30 * 60 * 1000;
const history = new Map<string, PricePoint[]>();
let socket: WebSocket | null = null;

const MAPPING: Record<string, string> = {
  bitcoin: "btc",
  ethereum: "eth"
};

export function startPriceFeed(markets: string[]): void {
  for (const market of markets) history.set(market, []);
  connect(1000);
}

function connect(backoffMs: number): void {
  socket = new WebSocket("wss://ws.coincap.io/prices?assets=bitcoin,ethereum");

  socket.on("open", () => {
    console.log("[priceFeed] connected to coincap");
  });

  socket.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      for (const asset in msg) {
        const market = MAPPING[asset];
        if (market) {
          const price = parseFloat(msg[asset]);
          if (Number.isFinite(price)) {
            pushPrice(market, { price, timestamp: Date.now() });
          }
        }
      }
    } catch {}
  });

  socket.on("close", () => {
    console.warn(`[priceFeed] disconnected, reconnecting in ${backoffMs}ms`);
    setTimeout(() => connect(Math.min(backoffMs * 2, 30_000)), backoffMs);
  });

  socket.on("error", (err) => {
    console.error(`[priceFeed] error:`, err.message);
    if (socket) socket.close();
  });
}

function pushPrice(market: string, point: PricePoint): void {
  const arr = history.get(market) ?? [];
  arr.push(point);
  const cutoff = Date.now() - HISTORY_WINDOW_MS;
  while (arr.length > 0 && arr[0].timestamp < cutoff) arr.shift();
  history.set(market, arr);
}

export function getRecentPrices(market: string, windowMinutes: number): number[] {
  const arr = history.get(market) ?? [];
  const cutoff = Date.now() - windowMinutes * 60 * 1000;
  return arr.filter((p) => p.timestamp >= cutoff).map((p) => p.price);
}

export function stopPriceFeed(): void {
  if (socket) socket.close();
}

