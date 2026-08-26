# DreamDEX Event Contracts — SDK & Docs Feedback

_Disusun dari pengalaman nyata building "DreamBot Signal" selama masa Hackathon._

## Dokumentasi

1. [x] **URL GraphQL Indexer untuk Testnet Shannon tersembunyi**. Di halaman dokumentasi SDK (misal *Quick Start*), parameter `indexerUrl` disebutkan sebagai argumen yang wajib, namun nilainya tidak pernah ditulis secara eksplisit. Sebagai developer yang baru masuk, saya harus menebak URL API REST (`stg.api.dreamdex.io/v0`) sebelum menyadari itu salah (REST API tidak melayani event contracts via SDK). Akhirnya saya harus menginspeksi Network Tab di `tvlr.tech` untuk mendapatkan URL `https://tvlr.tech/v1/graphql`. Sangat disarankan untuk menulis endpoint publik `indexerUrl` secara jelas di dokumentasi "Quick Start".
2. [x] Endpoint fallback di SDK config. Jika `indexerUrl` memang wajib, idealnya `@somnia-chain/markets-sdk` menyediakan konstanta/URL default untuk Testnet Shannon atau setidaknya mengeksposnya di enum/config yang mudah diakses.

## Infrastruktur & Endpoint Event Contracts

1. [x] **Sertifikat SSL / TLS Mismatch**. URL `https://tvlr.tech/v1/graphql` ternyata memiliki sertifikat SSL untuk domain `markets.stg.somnia.host`. Akibatnya, Node.js versi modern (seperti Node 22 yang menggunakan Undici native `fetch`) melempar error `ERR_TLS_CERT_ALTNAME_INVALID` saat memanggil SDK, yang kemudian dibungkus menjadi `connection error` oleh SDK. Solusi kami adalah menggunakan `NODE_TLS_REJECT_UNAUTHORIZED=0` atau langsung memanggil `https://markets.stg.somnia.host/v1/graphql`. Harap sertifikatnya disesuaikan untuk kelancaran integrasi server-to-server bot.
2. [x] **Error Handling dari Indexer**. Saat staging database Somnia/DreamDEX down (kami mendapati error internal `postgres-error`), HTTP response tetap bernilai 200 OK dengan payload JSON berformat GraphQL Errors. SDK (file `graphqlBoundary.js`) dengan benar melempar error ini, namun terbungkus menjadi pesan `connection error` yang generik, membuat developer bingung apakah koneksi internetnya yang mati, atau DNS-nya yang mati, padahal itu error database di sisi server DreamDEX. Error handling ini bisa diperjelas di sisi Indexer / Envio.

## SDK / Bot Kit

1. [x] **Membuat Order**. Instruksi membuat order sangat mudah digunakan. Metode *mint-a-pair* tanpa perlu penjual (cukup *Buy Up x Buy Down*) merupakan arsitektur AMM collateral-swap yang brilian dan sangat mempermudah pembuatan bot tanpa risiko *inventory*.
2. [x] `EventContractMarket` (atau tipe turunannya dari `listLiveBinaryMarkets`) sudah rapi dan mudah digabungkan dengan `fetchOrderBook`. Namun, alangkah baiknya jika `outcomes` selalu digaransi eksis di tipe dasar jika itu memang *Binary Market* (tanpa perlu opsional chaining `?.symbol`), karena ini memotong banyak asumsi tipe di sisi TypeScript.

## Yang sudah bagus (jangan cuma keluhan)

1. [x] Penggunaan `@somnia-chain/markets-sdk` sangat menolong ketimbang memanggil kontrak pintar langsung (raw viem). Layer abstraksinya pas.
2. [x] Dokumentasi mengenai *Session Keys* sangat solutif untuk hackathon. Mendorong best practice security di mana kami tidak perlu menaruh private key wallet utama ke dalam `.env` server.
3. [x] Fitur Unified Indexer (satu titik query untuk spot, perps, event contracts) sangat futuristik dan mempermudah query data ketimbang mendengarkan theGraph yang lambat.
