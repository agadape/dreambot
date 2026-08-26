// packages/agent/src/store.ts
//
// Persistence sederhana berbasis file JSON — cukup untuk skala hackathon
// (lihat spec §4, tidak perlu infra berat untuk 14 hari). Dashboard Next.js
// membaca file yang sama lewat API route.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Redis } from "@upstash/redis";
import type { Signal } from "./signalEngine";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
const SIGNALS_FILE = join(DATA_DIR, "signals.json");

// Inisialisasi Redis jika ada credential di .env
const redis = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
  ? new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })
  : null;

export interface StoredSignal extends Signal {
  narrative: string;
  outcome?: "WIN" | "LOSS" | "PENDING";
}

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

export async function loadSignals(): Promise<StoredSignal[]> {
  if (redis) {
    try {
      const data = await redis.get<StoredSignal[]>("dreambot:signals");
      return data || [];
    } catch (err) {
      console.error("[store] gagal baca dari Redis:", err);
      return [];
    }
  }

  ensureDataDir();
  if (!existsSync(SIGNALS_FILE)) return [];
  try {
    return JSON.parse(readFileSync(SIGNALS_FILE, "utf-8"));
  } catch (err) {
    console.error("[store] gagal baca signals.json:", err);
    return [];
  }
}

export async function saveSignal(signal: Signal, narrative: string): Promise<StoredSignal> {
  const stored: StoredSignal = { ...signal, narrative, outcome: "PENDING" };
  const all = await loadSignals();
  all.push(stored);

  if (redis) {
    await redis.set("dreambot:signals", all);
  } else {
    ensureDataDir();
    writeFileSync(SIGNALS_FILE, JSON.stringify(all, null, 2));
  }
  return stored;
}

export async function markOutcome(timestamp: number, marketId: string, outcome: "WIN" | "LOSS"): Promise<void> {
  const all = await loadSignals();
  const idx = all.findIndex((s) => s.timestamp === timestamp && s.marketId === marketId);
  if (idx === -1) return;
  all[idx].outcome = outcome;

  if (redis) {
    await redis.set("dreambot:signals", all);
  } else {
    writeFileSync(SIGNALS_FILE, JSON.stringify(all, null, 2));
  }
}

export async function computePerformance(): Promise<{ total: number; wins: number; losses: number; pending: number; winRate: number }> {
  const all = await loadSignals();
  const wins = all.filter((s) => s.outcome === "WIN").length;
  const losses = all.filter((s) => s.outcome === "LOSS").length;
  const pending = all.filter((s) => s.outcome === "PENDING" || !s.outcome).length;
  const decided = wins + losses;
  return { total: all.length, wins, losses, pending, winRate: decided > 0 ? wins / decided : 0 };
}
