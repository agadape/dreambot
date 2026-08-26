export interface PricePoint {
  price: number;
  timestamp: number;
}

const HISTORY_WINDOW_MS = 30 * 60 * 1000;
const history = new Map<string, PricePoint[]>();
let pollInterval: any = null;

export function startPriceFeed(markets: string[]): void {
  for (const market of markets) {
    history.set(market, []);
  }
  
  console.log("[priceFeed] Memulai REST API Polling (Real Data dari Binance.US)");
  
  // Ambil harga saat ini langsung
  fetchPrices(markets);
  
  // Polling setiap 10 detik
  pollInterval = setInterval(() => {
    fetchPrices(markets);
  }, 10000);
}

async function fetchPrices(markets: string[]) {
  try {
    for (const market of markets) {
      const symbol = `${market.toUpperCase()}USDT`;
      const res = await fetch(`https://api.binance.us/api/v3/ticker/price?symbol=${symbol}`);
      
      if (!res.ok) continue;
      
      const data = await res.json();
      const price = parseFloat(data.price);
      
      if (Number.isFinite(price)) {
        pushPrice(market, { price, timestamp: Date.now() });
      }
    }
  } catch (err) {
    console.error("[priceFeed] REST fetch error:", (err as Error).message);
  }
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
  if (pollInterval) clearInterval(pollInterval);
}

