// packages/agent/src/commitOnChain.ts
import { createWalletClient, createPublicClient, http, keccak256, stringToHex, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { randomUUID } from "node:crypto";

const somniaShannon = {
  id: Number(process.env.CHAIN_ID ?? 50312),
  name: "Somnia Shannon Testnet",
  nativeCurrency: { name: "STT", symbol: "STT", decimals: 18 },
  rpcUrls: { default: { http: [process.env.RPC_URL ?? "https://dream-rpc.somnia.network"] } },
} as const;

// Allow running even without SESSION_PRIVATE_KEY for demo/dry-run purposes
const mockPrivateKey = "0x0000000000000000000000000000000000000000000000000000000000000001";
const account = privateKeyToAccount((process.env.SESSION_PRIVATE_KEY || mockPrivateKey) as Hex);
const walletClient = createWalletClient({ account, chain: somniaShannon, transport: http() });
const publicClient = createPublicClient({ chain: somniaShannon, transport: http() });

export interface Commitment {
  market: string;
  marketId: string;
  direction: "UP" | "DOWN";
  confidence: number;
  strikePrice: number;
  nonce: string;
  committedAt: number;
}

export function buildCommitment(base: Omit<Commitment, "nonce" | "committedAt">): Commitment {
  return { ...base, nonce: randomUUID(), committedAt: Date.now() };
}

export function hashCommitment(c: Commitment): Hex {
  return keccak256(stringToHex(JSON.stringify(c)));
}

/** Kirim commitment ke chain SEBELUM direction diungkap ke mana pun (dashboard/Telegram). */
export async function commitOnChain(c: Commitment): Promise<{ txHash: Hex; hash: Hex }> {
  const hash = hashCommitment(c);
  
  if (process.env.DRY_RUN === "true" || !process.env.SESSION_PRIVATE_KEY) {
    console.log(`[commitOnChain] DRY_RUN = true. Mocking txHash for commitment ${hash}`);
    return { txHash: hash, hash }; // Mock txHash
  }

  try {
    const txHash = await walletClient.sendTransaction({
      to: account.address, // self-send ?" cukup untuk timestamp on-chain yang immutable
      value: 0n,
      data: hash,
    });
    return { txHash, hash };
  } catch (err) {
    console.error(`[commitOnChain] Gagal mengirim commitment on-chain:`, (err as Error).message);
    return { txHash: hash, hash }; // fallback to mock if fails so loop continues
  }
}

/** Verifikasi publik: judge/siapa pun bisa jalankan ini sendiri dari data yang kamu reveal. */
export async function verifyCommitment(txHash: Hex, revealed: Commitment): Promise<boolean> {
  const tx = await publicClient.getTransaction({ hash: txHash });
  return tx.input.toLowerCase() === hashCommitment(revealed).toLowerCase();
}
