// packages/agent/src/narrator.ts
//
// Layer NLG opsional (spec §5.1). Rule-based engine sudah menentukan angka &
// arah — narrator HANYA menerjemahkan reasoning jadi kalimat manusiawi.
// Wajib fallback lokal: jangan sampai demo bergantung pada satu API call.

import type { Signal } from "./signalEngine";

const LLM_TIMEOUT_MS = 5000;

export async function narrate(signal: Signal): Promise<string> {
  const apiUrl = process.env.LLM_API_URL;
  if (!apiUrl) return fallbackTemplate(signal); // LLM tidak dikonfigurasi — langsung fallback, bukan error

  try {
    const narrative = await withTimeout(callLlmSummarizer(signal, apiUrl), LLM_TIMEOUT_MS);
    return narrative ?? fallbackTemplate(signal);
  } catch (err) {
    console.warn("[narrator] LLM summarizer gagal/timeout, pakai fallback template:", (err as Error).message);
    return fallbackTemplate(signal);
  }
}

function fallbackTemplate(signal: Signal): string {
  return `System detected a potential ${signal.direction} movement for ${signal.market.toUpperCase()} (confidence ${Math.round(signal.confidence * 100)}%). ${signal.reasoning.join(". ")}.`;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("LLM timeout")), ms)),
  ]);
}

async function callLlmSummarizer(signal: Signal, apiUrl: string): Promise<string> {
  const isChatAPI = apiUrl.includes("chat/completions");
  const body = isChatAPI 
    ? {
        model: process.env.LLM_MODEL || "llama3-8b-8192", // Default Groq model
        messages: [{ role: "user", content: buildPrompt(signal) }],
        temperature: 0.3
      }
    : { prompt: buildPrompt(signal) }; // Legacy custom endpoint fallback

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.LLM_API_KEY ? { Authorization: `Bearer ${process.env.LLM_API_KEY}` } : {}),
    },
    body: JSON.stringify(body),
  });
  
  if (!res.ok) throw new Error(`LLM API HTTP ${res.status}`);
  const data = await res.json();
  
  const text = isChatAPI 
    ? data.choices?.[0]?.message?.content 
    : (data.text ?? data.content?.[0]?.text);
    
  if (!text) throw new Error("LLM API response did not contain valid text");
  return text.trim();
}

function buildPrompt(signal: Signal): string {
  return [
    "You are a highly analytical quantitative trading AI.",
    "Convert the following technical reasoning logs into 1-2 concise, professional English sentences explaining the trading signal.",
    "DO NOT hallucinate or add new metrics outside of the provided data.",
    `Asset: ${signal.market.toUpperCase()}`,
    `Predicted Direction: ${signal.direction}`,
    `Confidence: ${Math.round(signal.confidence * 100)}%`,
    `Technical Reasoning: ${signal.reasoning.join("; ")}`,
  ].join("\n");
}
