// packages/agent/src/indicators.ts
//
// Indikator sederhana & transparan — sengaja bukan black-box, supaya reasoning
// trace di signal engine bisa menyebut angka konkret (lihat spec §5).

/** Perubahan relatif dari harga pertama ke harga terakhir dalam window, mis. 0.0042 = +0.42%. */
export function momentum(prices: number[]): number {
  if (prices.length < 2) return 0;
  const first = prices[0];
  const last = prices[prices.length - 1];
  if (first === 0) return 0;
  return (last - first) / first;
}

/** Volatilitas realized: standar deviasi dari return antar-tick, dalam skala relatif harga. */
export function volatility(prices: number[]): number {
  if (prices.length < 3) return 0;
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const prev = prices[i - 1];
    if (prev === 0) continue;
    returns.push((prices[i] - prev) / prev);
  }
  if (returns.length === 0) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length;
  return Math.sqrt(variance);
}
