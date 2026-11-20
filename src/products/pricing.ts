/**
 * Harga satuan yang bisa diubah bengkel (disimpan di browser). Bawaan: harga pasar 2024–2025.
 */
export interface PriceSettings {
  pipe: Record<string, number>; // per batang 6 m, kunci profil mm "20×20"
  board: Record<string, number>; // per lembar 122×244, kunci bahan papan
  caster: Record<string, number>; // per roda, kunci ukuran inci "3"
  feet: number; // karet / dop kaki per buah
  paintPerM2: number; // cat dasar + 2 lapis per m²
  perWeld: number; // ongkos las per titik sambungan (0 = tidak dihitung)
  kerfMm: number; // lebar mata potong
  stockCm: number; // panjang batang hollow
}

export const DEFAULT_PRICES: PriceSettings = {
  pipe: {
    '15×15': 45000,
    '20×20': 84000,
    '20×40': 118000,
    '40×20': 118000,
    '25×25': 95000,
    '30×30': 105000,
    '40×40': 123000,
    '40×60': 156000,
    '60×40': 156000,
  },
  board: { multiplek: 250000, hpl: 420000, kayu: 1100000 },
  caster: { '3': 40000, '4': 80000, '5': 110000 },
  feet: 2500,
  paintPerM2: 20000,
  perWeld: 0,
  kerfMm: 3,
  stockCm: 600,
};

const KEY = 'studiorangka_prices';

export function loadPrices(): PriceSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PRICES;
    const p = JSON.parse(raw);
    return {
      ...DEFAULT_PRICES,
      ...p,
      pipe: { ...DEFAULT_PRICES.pipe, ...(p.pipe || {}) },
      board: { ...DEFAULT_PRICES.board, ...(p.board || {}) },
      caster: { ...DEFAULT_PRICES.caster, ...(p.caster || {}) },
    };
  } catch {
    return DEFAULT_PRICES;
  }
}

export function savePrices(p: PriceSettings | null) {
  try {
    if (p) localStorage.setItem(KEY, JSON.stringify(p));
    else localStorage.removeItem(KEY);
  } catch {
    // penyimpanan browser tidak tersedia
  }
}
