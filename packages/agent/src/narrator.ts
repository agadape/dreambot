// packages/agent/src/narrator.ts
//
// Layer NLG opsional (spec §5.1). Rule-based engine sudah menentukan angka &
// arah — narrator HANYA menerjemahkan reasoning jadi kalimat manusiawi.
// Wajib fallback lokal: jangan sampai demo bergantung pada satu API call.

import type { Signal } from "./signalEngine";

const LLM_TIMEOUT_MS = 2000;

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
  return `DreamBot menyarankan ${signal.direction} untuk ${signal.market} (confidence ${Math.round(signal.confidence * 100)}%). ${signal.reasoning.join(". ")}.`;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("LLM timeout")), ms)),
  ]);
}

async function callLlmSummarizer(signal: Signal, apiUrl: string): Promise<string> {
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.LLM_API_KEY ? { Authorization: `Bearer ${process.env.LLM_API_KEY}` } : {}),
    },
    body: JSON.stringify({ prompt: buildPrompt(signal) }),
  });
  if (!res.ok) throw new Error(`LLM API HTTP ${res.status}`);
  const data = await res.json();
  const text = data.text ?? data.content?.[0]?.text;
  if (!text) throw new Error("LLM API response tidak punya field teks yang dikenali");
  return text;
}

function buildPrompt(signal: Signal): string {
  return [
    "Ubah reasoning trading berikut jadi 1-2 kalimat bahasa Indonesia yang natural.",
    "Jangan menambah klaim, angka, atau keyakinan baru di luar yang diberikan.",
    `Market: ${signal.market}`,
    `Arah: ${signal.direction}`,
    `Confidence: ${signal.confidence}`,
    `Reasoning: ${signal.reasoning.join("; ")}`,
  ].join("\n");
}
