import { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES } from "@somnia-chain/markets-sdk";
import { defineChain } from "viem";

const chain = defineChain({
  id: 50312,
  name: "Somnia Shannon Testnet",
  network: "somnia-testnet",
  nativeCurrency: { name: "STT", symbol: "STT", decimals: 18 },
  rpcUrls: { default: { http: ["https://dream-rpc.somnia.network"] } },
});

const exchange = new SomniaMarkets({
  indexerUrl: "https://markets.stg.somnia.host/v1/graphql",
  chain,
  wsRpcUrl: "wss://stg.api.dreamdex.io/v0/ws/public",
  addresses: SOMNIA_TESTNET_ADDRESSES
});

async function main() {
  try {
    const markets = await exchange.client.listLiveBinaryMarkets({ limit: 50 });
    console.log("Markets:", markets.length);
  } catch (err) {
    console.error("Error:", err);
    if (err.cause) console.error("Cause:", err.cause);
  }
}
main();
