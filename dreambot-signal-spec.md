# DreamBot Signal — Spesifikasi Proyek
**Somnia × DreamDEX Event Contracts Hackathon** · Prize pool $5,000 USDso · Deadline **2026-09-08** (treated as hard deadline)

> ⚠️ Catatan: halaman hackathon aslinya kontradiktif — field "Deadline" tertulis `2026/09/09 01:00` tapi teks timeline bilang "25th Aug - 8th Sep". Untuk aman, anggap **8 September malam** sebagai batas kerja sebenarnya; 9 September 01:00 dianggap buffer darurat saja, bukan hari kerja.

---

## 1. Ringkasan Satu Paragraf

DreamBot Signal adalah AI trading agent yang membaca kondisi pasar real-time (order book + volatilitas historis) di **DreamDEX Event Contracts** (BTC/ETH, window 15m/1h, Up/Down dengan payout tetap), menghasilkan sinyal arah dengan **reasoning yang transparan dan bisa diaudit**, lalu (opsional, jika waktu cukup) mengeksekusi taruhan otomatis via session key — dengan dashboard performa publik (win rate, PnL) sebagai bukti, bukan klaim.

Konfirmasi dari situs resmi dreamDEX soal mekanik Event Contracts: <cite index="42-1">pengguna menebak arah pasar selama window waktu tetap — benar membayar payout tetap, salah hanya kehilangan taruhan, tanpa fee, dengan odds on-chain langsung, diselesaikan dalam USDso</cite>.

---

## 2. Kenapa Ini Cocok (Judge Fit Recap)

| Kriteria judging (bobot) | Bagaimana proyek ini menjawab |
|---|---|
| Technical Implementation (25%) | Integrasi nyata ke REST/WebSocket dreamDEX, bukan mock data; strategi engine yang bisa diverifikasi |
| Innovation (20%) | Belum ada submission lain di lane "AI trading agent" untuk Event Contracts (baru Market Dungeon = gamifikasi read-only, QDS = analytics generik) |
| UX (20%) | Transparansi reasoning + dashboard performa = kepercayaan, bukan "black box" |
| Business/Ecosystem Impact (20%) | Selaras persis dengan narasi resmi Somnia soal dreamBots & Agentic L1, dan track prompt eksplisit "AI-powered trading agents" |
| Presentation (15%) | Demo live: sinyal muncul → alasan tampil → (opsional) posisi terbuka → hasil settle |

---

## 3. Arsitektur

```
┌─────────────────────┐      REST (poll live odds/markets)  ┌──────────────────────┐
│  Data Layer          │ ───────────────────────────────▶  │  DreamDEX API         │
│  (ingest + cache)     │      WebSocket (fills/settlement)  │  api.dreamdex.io/v0   │
└─────────┬────────────┘ ◀───────────────────────────────  └──────────────────────┘
          │  WebSocket (BTC/ETH price, fallback feed)
          ▼ ◀──────────────────────────────── Binance/CoinGecko WS (untuk momentum & volatility saja)
          │
┌─────────────────────┐
│  Signal Engine        │  ← rule-based v1 (momentum + volatility skew)
│  (explainable)         │     tiap sinyal punya "reasoning trace"
└─────────┬────────────┘
          │
          ▼
┌─────────────────────┐      session key (scoped, no withdraw)     ┌───────────────────────┐
│  Execution Agent      │ ─────────────────────────────────────▶  │  DreamDEX Event         │
│  (opsional, v2)        │                                          │  Contract order placement │
└─────────┬────────────┘                                          └───────────────────────┘
          │
          ▼
┌─────────────────────┐
│  Performance Store    │  → win rate, PnL, per-market breakdown
└─────────┬────────────┘
          │
          ▼
┌─────────────────────┐
│  Web Dashboard (UI)   │  ← live signal feed + reasoning + performance
└─────────────────────┘
```

**Prinsip desain**: agent boleh "AI-assisted" tapi **setiap sinyal harus menunjukkan alasan tertulis yang bisa diperiksa** (indikator apa yang dipakai, nilai-nilainya, threshold yang terpenuhi). Ini menghindari kesan "AI palsu" dan justru cocok dengan nilai "transparent, verifiable" yang dipromosikan dreamDEX sendiri.

**Data resilience**: likuiditas Shannon testnet kemungkinan tipis/choppy, jadi momentum & volatility dihitung dari **feed harga eksternal (Binance/CoinGecko WebSocket)** untuk BTC/ETH underlying — lebih stabil untuk analisis. **Odds on-chain dan eksekusi/settlement tetap 100% dari DreamDEX Event Contracts** — bagian ini wajib ditegaskan eksplisit di pitch (lihat Demo Script §10), karena kalau tidak dijelaskan bisa disalahartikan sebagai "blockchain-nya dekoratif".

---

## 4. Tech Stack

| Layer | Pilihan | Alasan |
|---|---|---|
| Client library dasar | `packages/core` dari [dreamdex-bot-kit](https://github.com/somnia-chain/dreamdex-bot-kit) (TS) | Sudah menyediakan auth, REST client, WebSocket, nonce manager — tak perlu reinvent |
| Backend/agent runtime | Node.js + TypeScript | Sama dengan bahasa Bot Kit, minim friction integrasi |
| Signal engine | TypeScript, rule-based + statistik sederhana (bisa dibungkus sebagai "AI-assisted scoring") | Cepat dibangun, transparan, mudah dijelaskan ke judge |
| NLG layer (opsional) | Claude Haiku / Groq Llama-3 API, dengan fallback template lokal | Klaim "AI-powered" yang genuinely didukung teknis, tanpa jadi titik gagal demo |
| Price feed fallback | Binance/CoinGecko WebSocket (BTC/ETH underlying) | Antisipasi likuiditas testnet Shannon yang tipis/choppy untuk perhitungan momentum & volatility |
| Frontend dashboard | Next.js + Tailwind | Familiar, cepat deploy, cocok untuk demo publik (Vercel) |
| Data persistence | SQLite/Postgres ringan (atau bahkan file JSON untuk skala hackathon) untuk log sinyal + performa | Tidak perlu infra berat untuk 14 hari |
| Network | **Shannon testnet** dulu (`chain 50312`, RPC `dream-rpc.somnia.network`) sesuai rekomendasi resmi Bot Kit, baru pertimbangkan mainnet kalau stabil | Aman untuk demo, sesuai submission requirement "working prototype on testnet" |
| Wallet/keys | Session key (bukan private key utama) — Bot Kit sudah punya dokumentasi `docs/session-keys.md` untuk pola ini | Keamanan + selaras dengan best practice yang didorong dreamDEX sendiri |

> Catatan penting: Bot Kit publik saat ini punya strategi contoh untuk **spot CLOB** (market-making, grid, momentum, mean-reversion, twap) via `placeOrder`. **Endpoint spesifik untuk Event Contracts belum dikonfirmasi di sini** — halaman resminya ada di `docs.dreamdex.io/developers/event-contracts` tapi tidak bisa diakses otomatis dari sini (robots-disallowed). **Langkah pertama saat mulai coding: buka dokumentasi itu manual dan konfirmasi endpoint sebenarnya** — dua kandidat path yang masuk akal untuk dicek duluan (bukan fakta terkonfirmasi, hanya pola penamaan REST DreamDEX yang umum): `GET /v0/event-contracts/markets` (daftar market aktif) dan `GET /v0/event-contracts/markets/:id/odds` (live odds per market) — arsitektur di atas tetap valid, hanya detail endpoint yang perlu disesuaikan begitu dokumen dibaca.

---

## 5. Signal Engine — Spesifikasi v1

Untuk 15 menit / 1 jam window Up/Down, gunakan kombinasi indikator sederhana dan **transparan**:

1. **Momentum jangka pendek** — perubahan harga N menit terakhir (dari WebSocket price feed) dibanding rata-rata bergerak.
2. **Skew odds on-chain** — dreamDEX menampilkan "live onchain odds"; bandingkan implied probability pasar vs momentum untuk mendeteksi potensi mispricing.
3. **Volatilitas realized** — standar deviasi harga window terakhir; dipakai untuk confidence score, bukan arah.

Output tiap sinyal (disimpan & ditampilkan apa adanya, bukan diringkas):
```json
{
  "market": "BTC-15m",
  "direction": "UP",
  "confidence": 0.68,
  "reasoning": [
    "Momentum 5m: +0.42% (di atas threshold +0.2%)",
    "Odds on-chain implied 54% UP — sinyal momentum lebih kuat dari harga pasar",
    "Volatility realized rendah (0.31%) → confidence sedang"
  ],
  "timestamp": "..."
}
```

**Roadmap kejujuran**: sebut di README/pitch bahwa engine intinya adalah "rule-based, AI-assisted scoring" — bukan LLM black-box — dengan roadmap eksplisit untuk melatih model berbasis histori setelah cukup data terkumpul pasca-hackathon (ini justru memperkuat skor Business/Ecosystem Impact karena ada jalur pertumbuhan nyata).

### 5.1 Layer NLG (LLM Summarizer) — opsional tapi disarankan

Rule-based engine tetap yang menghitung angka & menentukan arah/confidence — **layer terpisah** (LLM ringan, mis. Claude Haiku/Groq Llama-3) hanya menerjemahkan array `reasoning` di atas menjadi 1-2 kalimat bahasa manusia:

> 🤖 "DreamBot menyarankan UP. Momentum 5 menit terakhir positif (+0.42%), dan odds on-chain saat ini (54%) belum sepenuhnya menghargai momentum ini. Volatilitas rendah membuat sinyal ini cukup terpercaya."

Ini memberi hak klaim "AI-powered"/"Agentic" secara jujur (bukan cuma marketing), karena narasi ini genuinely dihasilkan model, dari data yang genuinely dihitung sistem.

**Wajib ada fallback** — jangan buat demo live bergantung pada satu API call eksternal: kalau LLM call gagal/lambat (>2 detik), sistem otomatis pakai template lokal (`"DreamBot menyarankan {direction}. {reasoning.join(". ")}"`) tanpa memblok UI. Precompute & cache narasi untuk sinyal-sinyal yang akan ditunjukkan saat demo, jangan andalkan live call di depan judges.

---

## 6. Fitur (Prioritas untuk 14 Hari)

**Harus ada (MVP inti demo):**
- Live feed sinyal untuk minimal 1 market (BTC, window 15m) dengan reasoning trace
- Dashboard performa: win rate, jumlah sinyal, PnL simulasi/nyata
- Integrasi read-only nyata ke DreamDEX API (bukan data statis)

**Bagus jika sempat (menaikkan Technical Implementation & Demo Power):**
- Eksekusi otomatis via session key di testnet (posisi kecil, benar-benar terbuka & settle saat demo)
- Multi-market (BTC + ETH) dan multi-window (15m + 1h)
- Halaman "audit trail" — histori sinyal lama vs hasil aktual, bisa difilter

**Jangan dikerjakan dulu (potensi molor):**
- Model ML custom (latih sendiri) — cukup rule-based untuk hackathon ini
- Copy-trading multi-user / social layer (itu Idea 3, beda proyek)
- Mainnet deployment — testnet cukup dan lebih aman untuk demo

---

## 7. Model Bisnis (1 kalimat, sesuai syarat skill)

**Sinyal & reasoning gratis untuk semua** (bangun adopsi & ecosystem impact dreamDEX), **auto-execution + multi-market scanning berbayar** (langganan flat atau potongan kecil dari profit), dengan opsi jangka panjang **menjual widget sinyal ini untuk di-embed** komunitas/protokol lain — tidak butuh likuiditas awal besar karena user membawa modal masing-masing.

---

## 8. Keamanan & Batasan (untuk disebut eksplisit ke judge)

- Gunakan **session key** yang di-scope tanpa hak withdraw (pola sudah didokumentasikan Bot Kit) — bukan private key utama pengguna.
- Mulai di **testnet**; kalaupun demo di mainnet, batasi ukuran posisi sangat kecil.
- Semua eksekusi otomatis punya **kill switch** manual di dashboard.
- Cantumkan disclaimer standar (mengikuti pola disclaimer resmi Bot Kit): bukan nasihat finansial, belum diaudit, risiko kehilangan dana ada.

---

## 9. Rencana Waktu (14 hari kalender, 26 Agustus – 8 September)

> Koreksi dari draf sebelumnya: kalau Hari 1 = 26 Agustus, maka 26 Agt→8 Sep itu **14 hari kalender inklusif**, bukan 13 — Hari 13 jatuh di 7 September, Hari 14 di 8 September. Detail step-by-step per hari ada di §12.

| Hari | Tanggal | Fokus |
|---|---|---|
| 1 | 26 Agt | Setup monorepo, wallet testnet, baca dokumentasi Event Contracts, mulai catat feedback SDK |
| 2 | 27 Agt | Price feed proxy (Binance WS) + technical indicators (momentum, volatility) |
| 3–5 | 28–30 Agt | DreamDEX API client (Event Contracts) + signal engine core + agent loop + persistence |
| 6–8 | 31 Agt–2 Sep | Dashboard Next.js: live signal feed + reasoning trace + performance store; integrasi NLG layer (dengan fallback template) |
| 9–10 | 3–4 Sep | (Jika waktu cukup) eksekusi otomatis via session key di testnet |
| 11 | 5 Sep | Seed data historis biar dashboard tidak kosong saat demo, tulis README |
| 12 | 6 Sep | Rekam demo video 2–3 menit, finalisasi `DEX_SDK_FEEDBACK.md` |
| 13 | 7 Sep | **Buffer & final testing** — setup ulang dengan wallet baru/bersih, perbaiki apa pun yang masih bug, siapkan submission assets |
| 14 | 8 Sep | **SUBMISSION DAY** — submit repo, video, form DoraHacks, feedback report; jangan tunda sampai malam |

Hari 9 September dini hari (batas versi "01:00" di halaman hackathon) diperlakukan sebagai darurat murni — kalau submission sudah selesai di Hari 14, tidak perlu dipakai sama sekali.

---

## 10. Demo Script (3 menit)

**0:00–0:30 — Hook**
"Trader di DreamDEX Event Contracts cuma punya 15 menit untuk memutuskan arah pasar — selama ini itu tebakan buta. DreamBot Signal tidak cuma kasih sinyal Up/Down, tapi menjelaskan alasannya, dalam bahasa manusia, transparan dan bisa diaudit." → tunjukkan dashboard live dengan sinyal baru muncul + narasi NLG-nya.

**0:30–1:30 — Core Demo**
Tunjukkan reasoning trace di balik satu sinyal aktual (momentum, odds skew, volatility) → tegaskan eksplisit: "analisis momentum kami pakai feed harga eksternal yang robust, tapi odds dan settlement akhir 100% on-chain di DreamDEX" → klik ke market BTC-15m di dreamDEX untuk membuktikan datanya real → (jika ada eksekusi otomatis) tunjukkan posisi terbuka via session key dan settle live.

**1:30–2:30 — Kredibilitas Teknis**
Tunjukkan kode signal engine sekilas + arsitektur (REST/WS dreamDEX + Bot Kit core + fallback feed) + halaman performa historis (win rate).

**2:30–3:00 — Close**
"Ini baseline rule-based yang transparan — roadmap kami adalah melatih model dari data yang sudah terkumpul, dan membuka akses sinyal untuk komunitas dreamDEX." → ajak judges coba dashboard sendiri.

---

## 11. Submission Checklist

- [ ] Prototype berjalan di Shannon testnet (chain 50312)
- [ ] Repo GitHub publik dengan README (setup + demo walkthrough)
- [ ] Demo video 2–3 menit
- [ ] Form submission DoraHacks terisi
- [ ] **Feedback report `DEX_SDK_FEEDBACK.md`** di root repo — formal opsional di aturan, tapi diperlakukan sebagai wajib strategis (tie-breaker Business/Ecosystem Impact). Isi 3-5 poin konstruktif spesifik dari pengalaman nyata Hari 1-2 (bukan generik), contoh format: "1. [bagian docs] kurang contoh payload untuk [kasus spesifik]. 2. [endpoint/tool] sempat membingungkan karena [alasan]. 3. [hal yang justru sangat membantu]."
- [ ] Test ulang dengan wallet baru/bersih sebelum submit (judges akan mencoba)

---

## 12. Implementasi Teknis — Struktur & Kode Inti

### 12.1 Struktur Monorepo

```
dreambot-signal/
├── packages/
│   └── agent/                    # backend: data layer + signal engine + agent loop
│       ├── src/
│       │   ├── priceFeed.ts      # koneksi Binance WS (fallback feed)
│       │   ├── dreamdexClient.ts # koneksi DreamDEX REST/WS (odds, markets, execution)
│       │   ├── indicators.ts     # momentum, volatility
│       │   ├── signalEngine.ts   # logika rule-based + reasoning trace
│       │   ├── narrator.ts       # NLG layer + fallback template
│       │   ├── executor.ts       # (opsional) session key + place order
│       │   ├── store.ts          # persistence sinyal + performa
│       │   └── index.ts          # agent loop utama
│       ├── data/                 # signals.json, performance.json (gitignored isinya, bukan foldernya)
│       └── .env.example
├── apps/
│   └── dashboard/                # Next.js frontend
│       ├── app/
│       │   ├── page.tsx          # live signal feed
│       │   ├── api/signals/route.ts  # baca dari packages/agent/data
│       │   └── components/
│       │       ├── SignalCard.tsx
│       │       └── PerformanceChart.tsx
│       └── package.json
├── DEX_SDK_FEEDBACK.md
├── README.md
└── package.json                  # workspace root
```

### 12.2 Kode Inti — Signal Engine (contoh nyata, bukan pseudocode)

```typescript
// packages/agent/src/signalEngine.ts
import { getRecentPrices, momentum, volatility } from "./indicators";

export interface Signal {
  market: string;
  direction: "UP" | "DOWN";
  confidence: number;
  reasoning: string[];
  timestamp: number;
}

const MOMENTUM_THRESHOLD = 0.002; // 0.2%

export function generateSignal(market: string, windowMinutes = 5): Signal | null {
  const prices = getRecentPrices(market, windowMinutes);
  if (prices.length < 10) return null; // belum cukup data

  const mom = momentum(prices);
  const vol = volatility(prices);
  const direction = mom >= 0 ? "UP" : "DOWN";
  const reasoning: string[] = [
    `Momentum ${windowMinutes}m: ${(mom * 100).toFixed(2)}% (threshold ±${MOMENTUM_THRESHOLD * 100}%)`,
  ];

  // confidence: makin besar momentum relatif ke volatilitas, makin tinggi
  const rawConfidence = Math.min(Math.abs(mom) / (vol || 0.0001), 1);
  const confidence = Math.round(rawConfidence * 100) / 100;
  reasoning.push(`Volatility realized: ${(vol * 100).toFixed(2)}% → confidence ${confidence}`);

  if (Math.abs(mom) < MOMENTUM_THRESHOLD) return null; // sinyal terlalu lemah, jangan publish

  return { market, direction, confidence, reasoning, timestamp: Date.now() };
}
```

```typescript
// packages/agent/src/narrator.ts
import type { Signal } from "./signalEngine";

const LLM_TIMEOUT_MS = 2000;

export async function narrate(signal: Signal): Promise<string> {
  try {
    const narrative = await Promise.race([
      callLlmSummarizer(signal),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error("timeout")), LLM_TIMEOUT_MS)),
    ]);
    if (narrative) return narrative as string;
  } catch {
    // fall through ke template lokal — JANGAN blok agent loop
  }
  return fallbackTemplate(signal);
}

function fallbackTemplate(signal: Signal): string {
  return `DreamBot menyarankan ${signal.direction}. ${signal.reasoning.join(". ")}.`;
}

async function callLlmSummarizer(signal: Signal): Promise<string> {
  // panggil Claude Haiku / Groq API di sini; contoh struktur, ganti dengan client SDK asli
  const res = await fetch(process.env.LLM_API_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.LLM_API_KEY}` },
    body: JSON.stringify({ prompt: buildPrompt(signal) }),
  });
  const data = await res.json();
  return data.text;
}

function buildPrompt(signal: Signal): string {
  return `Ubah reasoning trading berikut jadi 1-2 kalimat natural bahasa Indonesia, jangan tambah klaim baru:\n${signal.reasoning.join("\n")}\nArah: ${signal.direction}`;
}
```

**Catatan desain**: `narrate()` punya timeout 2 detik dan try/catch — kalau LLM gagal/lambat, otomatis fallback ke template lokal tanpa melempar error ke agent loop. Ini implementasi konkret dari prinsip "jangan andalkan live call di depan judges" di §5.1.

### 12.3 Yang Perlu Dikonfirmasi Manual di Hari 1 (bukan bisa ditebak)

- Endpoint asli `dreamdexClient.ts` (baseUrl, path, auth signing) — dari `docs.dreamdex.io/developers/event-contracts`, dua kandidat di §4 hanya starting guess.
- Struktur response market/odds DreamDEX (field names) — sesuaikan parsing setelah baca docs.
- Apakah session key untuk Event Contracts punya alur berbeda dari spot CLOB (`docs/session-keys.md` di Bot Kit) — dokumen ini fokus spot, belum tentu sama persis untuk Event Contracts.

### 12.4 Success Criteria per Fase (ringkas, bukan checklist harian mendetail)

| Fase | Kriteria selesai |
|---|---|
| Data layer (Hari 1-2) | `npm run doctor` sukses; price feed Binance mengalir & tersimpan; wallet testnet punya saldo STT |
| Signal engine (Hari 3-5) | Sinyal ter-generate dengan reasoning masuk akal; DreamDEX client bisa fetch market/odds (atau error jelas kalau endpoint belum cocok) |
| Dashboard (Hari 6-8) | `localhost:3000` menampilkan live feed + reasoning + narasi + performa, update otomatis |
| Eksekusi opsional (Hari 9-10) | Order via session key berhasil terbuka & settle di testnet, kill switch berfungsi |
| Submission (Hari 13-14) | Fresh install dari wallet baru berhasil; repo, video, form, feedback report semua terkirim sebelum 8 Sep malam |

---

## 13. Troubleshooting Cepat

| Masalah | Cek |
|---|---|
| RPC tidak konek | `.env` punya `RPC_URL` benar untuk chain 50312 |
| Saldo testnet 0 | Faucet butuh 5-10 menit, retry; pastikan alamat wallet benar |
| Binance WS putus | Implementasikan reconnect otomatis dengan backoff, jangan biarkan agent loop mati diam-diam |
| Endpoint DreamDEX 404 | Path di §4/§12.3 hanya tebakan — cek ulang dokumentasi resmi, sesuaikan `dreamdexClient.ts` |
| Dashboard kosong saat demo | Selalu seed beberapa sinyal historis (Hari 11) sebagai fallback tampilan, jangan andalkan live data 100% saat presentasi |

---

## 14. Roadmap Pasca-Hackathon (untuk pitch, bukan target 14 hari)

- **Minggu 1-2**: tambah indikator, dukung ETH, deploy dashboard ke Vercel + agent ke Railway/Render
- **Bulan 1**: latih model dari data sinyal yang terkumpul, fitur sosial (leaderboard), bot Discord
- **Bulan 2-3**: mainnet, widget B2B untuk protokol lain, langganan premium — ini yang mengubah model bisnis §7 dari niat jadi eksekusi nyata
