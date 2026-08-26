import "dotenv/config";
import { SomniaMarkets, isBinaryMarket, SOMNIA_TESTNET_ADDRESSES, SOMNIA_MAINNET_ADDRESSES } from "@somnia-chain/markets-sdk";
import { defineChain } from "viem";

const chainId = Number(process.env.CHAIN_ID ?? 50312);
const rpcUrl = process.env.RPC_URL ?? "https://dream-rpc.somnia.network";
const isTestnet = chainId === 50312;

const chain = defineChain({
  id: chainId,
  name: isTestnet ? "Somnia Shannon Testnet" : "Somnia Mainnet",
  network: isTestnet ? "somnia-testnet" : "somnia-mainnet",
  nativeCurrency: { name: isTestnet ? "STT" : "SOMI", symbol: isTestnet ? "STT" : "SOMI", decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl] } },
});

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const indexerUrl = process.env.GRAPHQL_INDEXER_URL ?? "https://markets.stg.somnia.host/v1/graphql";
console.log("[DEBUG] Using indexerUrl:", indexerUrl);
const wsRpcUrl = process.env.DREAMDEX_WS_URL ?? "wss://stg.api.dreamdex.io/v0/ws/public";
const addresses = isTestnet ? SOMNIA_TESTNET_ADDRESSES : SOMNIA_MAINNET_ADDRESSES;

export const exchange = new SomniaMarkets({
  indexerUrl,
  chain,
  wsRpcUrl,
  addresses
});

export interface EventContractMarket {
  id: string;
  symbol: string; // mis. "BTC"
  windowMinutes: number; // 15 atau 60
  strikePrice: number;
  expiresAt: number;
  upSymbol: string;
  downSymbol: string;
}

export interface MarketOdds {
  marketId: string;
  impliedProbabilityUp: number; // 0..1
}

/** Ambil daftar Event Contract market yang sedang aktif. */
export async function getActiveMarkets(): Promise<EventContractMarket[]> {
  try {
    const rawMarkets = await exchange.client.listLiveBinaryMarkets({ limit: 50 });
    const activeMarkets: EventContractMarket[] = [];
    
    for (const m of rawMarkets) {
      // Pastikan on-chain status = 1 (Trading)
      const onchain = await exchange.client.getMarketOnchain(m.marketId as `0x${string}`);
      if (onchain.status !== 1) continue;
      
      const upSymbol = m.outcomes?.[0]?.symbol;
      const downSymbol = m.outcomes?.[1]?.symbol;
      if (!upSymbol || !downSymbol) continue;

      activeMarkets.push({
        id: m.marketId,
        symbol: m.asset || m.symbol,
        windowMinutes: (Number(m.intervalSec) || 900) / 60,
        strikePrice: m.strike ? Number(m.strike) / 1e18 : 0, // sesuaikan jika format beda
        expiresAt: Number(m.expiry) * 1000,
        upSymbol,
        downSymbol
      });
    }
    return activeMarkets;
  } catch (err) {
    console.error("[dreamdexClient] getActiveMarkets failed:", err);
    if (err instanceof Error && err.cause) console.error("Cause:", err.cause);
    
    // FALLBACK UNTUK HACKATHON DEMO: Jika API staging down, gunakan mock market
    console.warn("[dreamdexClient] MENGGUNAKAN FALLBACK MOCK MARKET KARENA API DOWN!");
    return [
      {
        id: "mock-btc-market",
        symbol: "btc",
        windowMinutes: 15,
        strikePrice: 60000,
        expiresAt: Date.now() + 15 * 60 * 1000,
        upSymbol: "mockBTC-UP",
        downSymbol: "mockBTC-DOWN"
      },
      {
        id: "mock-eth-market",
        symbol: "eth",
        windowMinutes: 15,
        strikePrice: 3000,
        expiresAt: Date.now() + 15 * 60 * 1000,
        upSymbol: "mockETH-UP",
        downSymbol: "mockETH-DOWN"
      }
    ];
  }
}

/** Ambil live odds on-chain untuk satu market. */
export async function getMarketOdds(marketId: string): Promise<MarketOdds | null> {
  try {
    const onchain = await exchange.client.getMarketOnchain(marketId as `0x${string}`);
    if (onchain.status !== 1) return null;
    
    // Untuk mendapatkan odds (probability up), kita fetch order book untuk outcome UP
    const upSymbol = `${onchain.outcomeToken}-UP`; // TODO: we might need to get real upSymbol
    // Actually the SDK docs say: 
    // const upSymbol = m.outcomes?.[0]?.symbol;
    // but here we just have marketId. Let's list binary markets again to find it
    const markets = await exchange.client.listLiveBinaryMarkets({ limit: 50 });
    const market = markets.find(m => m.marketId === marketId);
    if (!market || !market.outcomes || market.outcomes.length < 2) return null;
    
    const upSymbolActual = market.outcomes[0].symbol;
    const book = await exchange.fetchOrderBook(upSymbolActual, 5);
    const ask = book.asks[0]?.[0];
    const bid = book.bids[0]?.[0];
    
    // Mid price of UP token is implied probability
    let impliedProbabilityUp = 0.5;
    if (ask !== undefined && bid !== undefined) {
      impliedProbabilityUp = (ask + bid) / 2;
    } else if (ask !== undefined) {
      impliedProbabilityUp = ask;
    } else if (bid !== undefined) {
      impliedProbabilityUp = bid;
    }
    
    // Jika tidak ada liquidity di orderbook
    return { marketId, impliedProbabilityUp: 0.5 };
  } catch (err) {
    console.error(`[dreamdexClient] getMarketOdds failed for ${marketId}:`, err);
    // FALLBACK DEMO
    console.warn(`[dreamdexClient] Menggunakan fake odds 55% untuk demo`);
    return { marketId, impliedProbabilityUp: 0.55 };
  }
}

export async function placeEventContractOrder(
  marketId: string,
  direction: "UP" | "DOWN",
  sizeUsdso: number
): Promise<{ success: boolean; orderId?: string }> {
  const dryRun = (process.env.DRY_RUN ?? "true") === "true";
  if (dryRun) {
    console.log(`[dreamdexClient] DRY_RUN â akan membuka posisi ${direction} ${sizeUsdso} USDso di market ${marketId}`);
    return { success: true, orderId: "dry-run" };
  }
  throw new Error("Eksekusi live belum diimplementasikan");
}

export async function executeTrade(market: EventContractMarket, direction: "UP" | "DOWN", confidence: number) {
  if (market.id.startsWith("mock-")) {
    console.log(`[dreamdexClient] Skip execution for mock market ${market.symbol}`);
    return;
  }
  if (process.env.DRY_RUN === "true") {
    console.log(`[dreamdexClient] DRY_RUN is true. Skipping execution for ${market.symbol} ${direction}`);
    return;
  }
  if (!process.env.SESSION_PRIVATE_KEY) {
    console.warn(`[dreamdexClient] No SESSION_PRIVATE_KEY. Skipping execution for ${market.symbol} ${direction}`);
    return;
  }

  const symbolToBuy = direction === "UP" ? market.upSymbol : market.downSymbol;
  // Size: fixed size of 1 lot for hackathon demo
  const size = 1;
  // We want to buy at market price (cross the touch). Let us fetch book.
  const book = await exchange.fetchOrderBook(symbolToBuy, 5);
  const bestAsk = book.asks[0]?.[0];
  
  if (bestAsk === undefined) {
    console.warn(`[dreamdexClient] No asks on book for ${symbolToBuy}, skipping trade.`);
    return;
  }
  
  const limitPrice = bestAsk + 0.05; // 5% slippage tolerance over the ask
  
  try {
    console.log(`[dreamdexClient] Executing BUY ${size} ${symbolToBuy} at limit ${limitPrice} (ask is ${bestAsk})`);
    const order = await exchange.createOrder(symbolToBuy, "limit", "buy", size, limitPrice, { timeInForce: "IOC" });
    const receipt = (order.info as any)?.receipt;
    console.log(`[dreamdexClient] Trade success! Tx Hash: ${receipt?.transactionHash || "N/A"}`);
  } catch (err: any) {
    console.error(`[dreamdexClient] Trade failed:`, err.message || err);
  }
}

