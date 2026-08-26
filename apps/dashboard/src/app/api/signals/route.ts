import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { Redis } from "@upstash/redis";

const redis = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
  ? new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })
  : null;

export async function GET() {
  let signals: any[] = [];
  
  if (redis) {
    try {
      signals = (await redis.get("dreambot:signals")) || [];
    } catch (err) {
      console.error("Failed to read from Redis", err);
    }
  } else {
    const file = join(process.cwd(), "../../packages/agent/data/signals.json");
    if (existsSync(file)) {
      try {
        const raw = readFileSync(file, "utf8");
        signals = JSON.parse(raw);
      } catch (err) {
        return NextResponse.json({ error: "Failed to parse local JSON" }, { status: 500 });
      }
    }
  }

  const wins = signals.filter((s: any) => s.outcome === "WIN").length;
  const losses = signals.filter((s: any) => s.outcome === "LOSS").length;
  const pending = signals.filter(
    (s: any) => s.outcome === "PENDING" || !s.outcome
  ).length;
  const decided = wins + losses;
  const winRate = decided > 0 ? wins / decided : 0;

  return NextResponse.json({
    signals: signals.reverse(), // Terbaru di atas
    performance: { total: signals.length, wins, losses, pending, winRate },
  });
}
