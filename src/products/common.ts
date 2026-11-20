import { DEFAULT_KITCHEN_CONFIG, FrameAxis, FrameConfig, FrameMember, FrameMemberRole, KitchenConfig } from '../types/kitchen';
import { boxesTouch, memberBox, memberSectionCm, getFrameMembers } from '../utils/frameLayout';
import { Board, Caster, FurnitureDesign, ParamDef, Params, ProductBuild } from './types';
import { DEFAULT_PRICES, PriceSettings } from './pricing';
import { CutPiece, ProfilePlan, barsNeeded, planCuts } from './cutting';
import { calculateFabricationCutList } from '../utils/exportDoc';

export const r1 = (v: number) => Math.round(v * 10) / 10;
export const num = (p: Params, k: string, d = 0) => (typeof p[k] === 'number' ? (p[k] as number) : d);
export const bool = (p: Params, k: string) => p[k] === true;
export const str = (p: Params, k: string, d = '') => (typeof p[k] === 'string' ? (p[k] as string) : d);

/** Pembuat batang: titik awal as (cm), memanjang searah sumbu. tube = [lebar, tinggi] mm */
export function memberFactory() {
  const list: FrameMember[] = [];
  const add = (
    id: string,
    axis: FrameAxis,
    x: number,
    y: number,
    z: number,
    length: number,
    role: FrameMemberRole,
    label: string,
    tube: [number, number]
  ) => {
    if (length < 0.5) return;
    list.push({
      id,
      axis,
      x: r1(x),
      y: r1(y),
      z: r1(z),
      length: r1(length),
      role,
      label,
      tubeSize: tube[0],
      tubeH: tube[1] !== tube[0] ? tube[1] : undefined,
    });
  };
  return { list, add };
}

export const board = (id: string, label: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): Board => ({
  id,
  label,
  box: { min: [r1(x0), r1(y0), r1(z0)], max: [r1(x1), r1(y1), r1(z1)] },
});

// ---------- Bahan ----------

export const PIPE_OPTIONS = [
  { value: '20', label: '20×20 mm', desc: 'Ringan · rak kecil, kursi' },
  { value: '30', label: '30×30 mm', desc: 'Sedang · rak, troli' },
  { value: '40', label: '40×40 mm', desc: 'Kuat · meja kerja, rak gudang' },
];

export const BOARD_OPTIONS = [
  { value: 'multiplek', label: 'Multiplek 18 mm', desc: 'Murah, dicat / dilapis' },
  { value: 'hpl', label: 'Multiplek + HPL', desc: 'Rapi, tahan gores' },
  { value: 'kayu', label: 'Papan kayu solid', desc: 'Tampilan kayu asli' },
  { value: 'none', label: 'Tanpa papan', desc: 'Rangka saja' },
];

export const BOARD_THICK: Record<string, number> = { multiplek: 1.8, hpl: 1.9, kayu: 2.5, none: 0 };

export const PAINT_OPTIONS = [
  { value: '#1f2226', label: 'Hitam doff' },
  { value: '#e9e7e1', label: 'Putih' },
  { value: '#6b7078', label: 'Abu-abu' },
  { value: '#2f4a3a', label: 'Hijau army' },
  { value: '#7a3b2a', label: 'Merah bata' },
  { value: '#c9a227', label: 'Emas' },
];

/** Pilihan bahan yang sama untuk semua produk */
export const materialParams = (withBoard: boolean): ParamDef[] => [
  { key: 'pipa', label: 'Ukuran pipa kaki / tiang', type: 'choice', options: PIPE_OPTIONS, help: 'Makin besar makin kuat, makin mahal.' },
  ...(withBoard
    ? [{ key: 'papan', label: 'Bahan papan', type: 'choice' as const, options: BOARD_OPTIONS }]
    : []),
  { key: 'warna', label: 'Warna cat rangka', type: 'choice', options: PAINT_OPTIONS },
];

/** Tinggi roda total (cm) termasuk pelat dudukan, per ukuran roda */
export const casterHeight = (inch: number) => (inch <= 3 ? 10 : inch <= 4 ? 12.5 : 15);
export const CASTER_OPTIONS = [
  { value: '3', label: 'Roda 3"', desc: '± 30 kg per roda' },
  { value: '4', label: 'Roda 4"', desc: '± 70 kg per roda' },
  { value: '5', label: 'Roda 5"', desc: '± 120 kg per roda' },
];
export const CASTER_LOAD: Record<number, number> = { 3: 30, 4: 70, 5: 120 };

export function casterSet(xs: number[], zs: number[], inch: number, brake: boolean): Caster[] {
  const out: Caster[] = [];
  xs.forEach((x, i) => zs.forEach((z, j) => out.push({ id: `roda-${i}-${j}`, x, z, topY: casterHeight(inch), sizeInch: inch, brake })));
  return out;
}

// ---------- Adapter ke mesin rangka yang sudah ada ----------

/**
 * Konfigurasi "inang" berbentuk KitchenConfig supaya editor rangka 2D, engsel, daftar potongan dan export
 * bisa dipakai apa adanya untuk produk lain. Rangka otomatis dari produk masuk lewat frame.autoMembers.
 */
export function toFrameHost(design: FurnitureDesign, build: ProductBuild): KitchenConfig {
  const pipe = parseInt(String(design.params.pipa || '40')) || 40;
  return {
    ...DEFAULT_KITCHEN_CONFIG,
    totalWidth: Math.max(1, Math.round(build.W)),
    totalDepth: Math.max(1, Math.round(build.D)),
    totalHeight: Math.max(1, Math.round(build.H)),
    countertopThickness: build.boardThick,
    plinthHeight: 0,
    legType: 'frame',
    countertopOverhangFront: 0,
    backsplashEnabled: false,
    columns: [{ ...DEFAULT_KITCHEN_CONFIG.columns[0], width: Math.round(build.W) }],
    sink: { ...DEFAULT_KITCHEN_CONFIG.sink, enabled: false },
    stove: { ...DEFAULT_KITCHEN_CONFIG.stove, enabled: false },
    showFrameOnly: true,
    hideTopTable: true,
    frame: {
      ...DEFAULT_KITCHEN_CONFIG.frame,
      ...design.frame,
      tubeSize: pipe,
      paintColor: String(design.params.warna || '#1f2226'),
      autoMembers: build.members,
      supports: [],
    },
  };
}

/** Ambil kembali bagian rangka dari editor (Mode Ahli) ke desain produk */
export function frameFromHost(prev: FrameConfig, updated: FrameConfig): FrameConfig {
  const { autoMembers, ...rest } = updated as FrameConfig & { autoMembers?: FrameMember[] };
  void autoMembers;
  return { ...prev, ...rest, members: rest.customLayout ? rest.members : undefined };
}

// ---------- Estimasi biaya (harga pasar 2024–2025, bisa beda per daerah) ----------

export interface CostLine {
  group: 'Pipa' | 'Papan' | 'Roda & aksesori' | 'Cat' | 'Ongkos';
  label: string;
  qty: number;
  unit: string;
  price: number;
  subtotal: number;
}

export interface CostReport {
  lines: CostLine[];
  total: number;
  bars: number;
  weightKg: number;
  paintM2: number;
  weldJoints: number;
  totalLengthM: number;
  materialTotal: number; // total tanpa ongkos
  plan: ProfilePlan[]; // pola potong per profil
  pieces: CutPiece[]; // potongan bernomor (sama dengan daftar potongan)
}

const profileOf = (m: FrameMember, defMm: number) => {
  const w = m.tubeSize || defMm;
  return `${w}×${m.tubeH || w}`;
};

export function estimateCost(host: KitchenConfig, design: FurnitureDesign, build: ProductBuild, prices: PriceSettings = DEFAULT_PRICES): CostReport {
  const members = getFrameMembers(host);
  const defMm = host.frame?.tubeSize || 40;
  const lines: CostLine[] = [];

  // Pipa: jumlah batang dari pola potong (First-Fit Decreasing + lebar mata potong)
  let weight = 0;
  let paint = 0;
  members.forEach((m) => {
    const [w, h] = profileOf(m, defMm).split('×').map((v) => parseInt(v));
    const t = 1.2;
    weight += (((2 * (w + h) - 4 * t) * t * 7.85) / 1000) * (m.length / 100);
    paint += ((2 * (w + h)) / 1000) * (m.length / 100);
  });
  const pieces: CutPiece[] = calculateFabricationCutList(host).hollowPieces.map((hp, i) => ({
    no: i + 1,
    profile: hp.profile,
    lengthCm: hp.lengthCm,
    qty: hp.qty,
    label: hp.label,
  }));
  const plan = planCuts(pieces, prices.stockCm, prices.kerfMm / 10);
  let bars = 0;
  plan.forEach((pp) => {
    const qty = barsNeeded(pp, prices.stockCm);
    bars += qty;
    const price = prices.pipe[pp.profile] ?? 110000;
    lines.push({ group: 'Pipa', label: `Hollow ${pp.profile} mm, batang ${prices.stockCm / 100} m`, qty, unit: 'batang', price, subtotal: qty * price });
  });

  // Papan: dihitung per m² (+30% sisa potong); lembar penuh 122×244 disebut untuk patokan belanja
  const papan = String(design.params.papan || 'multiplek');
  if (build.boards.length && papan !== 'none') {
    const area = build.boards.reduce((s, b) => {
      const d = [0, 1, 2].map((i) => b.box.max[i] - b.box.min[i]).sort((a, c) => c - a);
      return s + (d[0] * d[1]) / 10000; // dua sisi terbesar = muka papan
    }, 0);
    const m2 = Math.round(area * 1.3 * 100) / 100;
    const sheets = Math.ceil(m2 / 2.9768);
    const perM2 = Math.round((prices.board[papan] ?? 250000) / 2.9768 / 100) * 100;
    const name = papan === 'hpl' ? 'Multiplek 18 mm + HPL' : papan === 'kayu' ? 'Papan kayu solid' : 'Multiplek 18 mm';
    lines.push({
      group: 'Papan',
      label: `${name} (≈ ${sheets} lembar 122×244 bila beli utuh)`,
      qty: Math.max(0.05, m2),
      unit: 'm²',
      price: perM2,
      subtotal: Math.round(Math.max(0.05, m2) * perM2),
    });
  }

  // Roda / karet kaki
  if (build.casters.length) {
    const inch = build.casters[0].sizeInch;
    const price = Math.round((prices.caster[String(inch)] ?? 80000) * (build.casters[0].brake ? 1.15 : 1));
    lines.push({ group: 'Roda & aksesori', label: `Roda ${inch}"${build.casters[0].brake ? ' dengan rem' : ''}`, qty: build.casters.length, unit: 'buah', price, subtotal: build.casters.length * price });
  } else {
    const feet = members.filter((m) => m.axis === 'y' && m.y <= 0.5).length;
    if (feet) lines.push({ group: 'Roda & aksesori', label: 'Karet / dop kaki', qty: feet, unit: 'buah', price: prices.feet, subtotal: feet * prices.feet });
  }

  // Cat
  const paintM2 = Math.round(paint * 100) / 100;
  if (paintM2 > 0) lines.push({ group: 'Cat', label: 'Cat dasar + cat besi 2 lapis', qty: Math.max(0.1, paintM2), unit: 'm²', price: prices.paintPerM2, subtotal: Math.round(paintM2 * prices.paintPerM2) });

  // Titik las: pasangan batang yang bersentuhan
  const boxes = members.map((m) => memberBox(m, memberSectionCm(m, host)));
  let joints = 0;
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) if (boxesTouch(boxes[i], boxes[j])) joints++;

  const materialTotal = lines.reduce((s, l) => s + l.subtotal, 0);
  if (prices.perWeld > 0 && joints > 0)
    lines.push({ group: 'Ongkos', label: `Ongkos las ${joints} titik sambungan`, qty: joints, unit: 'titik', price: prices.perWeld, subtotal: joints * prices.perWeld });

  return {
    lines,
    materialTotal,
    plan,
    pieces,
    total: lines.reduce((s, l) => s + l.subtotal, 0),
    bars,
    weightKg: Math.round(weight * 10) / 10,
    paintM2,
    weldJoints: joints,
    totalLengthM: Math.round(members.reduce((s, m) => s + m.length, 0)) / 100,
  };
}

export const rupiah = (v: number) => 'Rp ' + Math.round(v).toLocaleString('id-ID');
export const rupiahShort = (v: number) =>
  v >= 1_000_000 ? `Rp ${(v / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt` : `Rp ${Math.round(v / 1000)} rb`;
