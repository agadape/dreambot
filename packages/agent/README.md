# @dreambot/agent

Backend agent untuk DreamBot Signal. Lihat spec lengkap di `dreambot-signal-spec.md` (root repo).

## Setup

```bash
npm install
cp .env.example .env
# isi RPC_URL, DREAMDEX_API_URL sesuai docs.dreamdex.io, dan MARKETS
```

## Langkah wajib sebelum menjalankan agent (Hari 1)

1. Buka `docs.dreamdex.io/developers/event-contracts` manual.
2. Cocokkan/ganti `EVENT_CONTRACTS_MARKETS_PATH` dan `EVENT_CONTRACTS_ODDS_PATH` di `src/dreamdexClient.ts` dengan path asli.
3. Sesuaikan `parseMarket()` / `parseOdds()` dengan bentuk response asli.
4. Jalankan:

```bash
npm run doctor
```

Selama `doctor` masih bilang "DreamDEX API: PERLU DICEK MANUAL", jangan lanjut ke `npm run dev` — itu tandanya endpoint di `dreamdexClient.ts` belum benar.

## Menjalankan agent

```bash
npm run dev
```

Sinyal akan muncul di console dan tersimpan di `data/signals.json` — file ini yang dibaca dashboard Next.js.

## Struktur

| File | Isi |
|---|---|
| `priceFeed.ts` | Koneksi Binance WS (fallback feed untuk momentum/volatility) |
| `indicators.ts` | Fungsi momentum & volatility |
| `dreamdexClient.ts` | Klien REST DreamDEX Event Contracts (⚠️ endpoint belum terkonfirmasi, lihat komentar di file) |
| `signalEngine.ts` | Logika rule-based + reasoning trace |
| `narrator.ts` | Layer NLG opsional + fallback template wajib |
| `store.ts` | Persistence sinyal + performa (JSON file) |
| `doctor.ts` | Verifikasi setup read-only |
| `index.ts` | Agent loop utama |

## Catatan keamanan

- `DRY_RUN=true` di `.env` — order tidak pernah benar-benar dikirim sampai kamu sengaja set `false`, dan itu pun `placeEventContractOrder()` masih perlu diimplementasikan (lihat `TODO(hari-9)`).
- `SESSION_PRIVATE_KEY` harus session key yang di-scope tanpa hak withdraw, bukan private key wallet utama.
