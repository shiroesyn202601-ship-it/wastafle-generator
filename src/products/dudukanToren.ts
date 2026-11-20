import { Board, Params, ProductCheck, ProductDef } from './types';
import { BOARD_OPTIONS, BOARD_THICK, PAINT_OPTIONS, board, bool, memberFactory, num, r1, str } from './common';
import { FrameMember, FrameMemberRole } from '../types/kitchen';
import { angledFrame, cutAxisIndex, memberFromPoints } from '../utils/frameLayout';

/**
 * Dudukan toren & tangki air: menara berbeban statis berat (500–2000 kg) dengan plat lantai di puncak.
 * Bentuk rangka (param `model`):
 * - kaki-4: 4 kaki di plat kaki (tegak atau melebar ke bawah), ring tiap tingkat, silang X di keempat sisi, plat atas
 * - kaki-3: 3 kaki melebar, ring segitiga bertingkat, silang X di tiga sisi, plat bundar di puncak
 * - ganda: 6 kaki dengan sepasang tiang tengah bersama, dua plat terpisah (boleh beda tinggi)
 * - atap-miring: dua rel tapak mengikuti kemiringan atap, kaki belakang lebih pendek, plat datar
 * - tiang: satu tiang besar di plat cor, empat topang miring dari tiang ke sudut plat atas
 * - rel-dak: 4 kaki di dua rel tapak panjang yang menjulur depan-belakang + topang miring dari ujung rel
 */
const MODELS = [
  { value: 'kaki-4', label: 'Tower 4 kaki', desc: 'Kaki tegak / melebar, silang X 4 sisi' },
  { value: 'kaki-3', label: 'Tower 3 kaki', desc: 'Kaki melebar, plat bundar' },
  { value: 'ganda', label: 'Tower ganda 6 kaki', desc: 'Dua toren, tiang tengah bersama' },
  { value: 'atap-miring', label: 'Dudukan atap miring', desc: 'Rel ikut atap, kaki beda panjang' },
  { value: 'tiang', label: 'Tiang tunggal', desc: 'Satu tiang besar di plat cor' },
  { value: 'rel-dak', label: 'Rel tapak dak', desc: 'Kaki di rel panjang, beban menyebar' },
];
const KEYS = MODELS.map((m) => m.value);
const model = (p: Params) => {
  const m = str(p, 'model', 'kaki-4');
  return KEYS.includes(m) ? m : 'kaki-4';
};
const has = (...m: string[]) => (p: Params) => m.includes(model(p));

/** Ukuran toren umum (perkiraan, beda sedikit per merek): diameter & tinggi cm */
const TOREN: Record<string, { d: number; h: number }> = {
  '520': { d: 85, h: 110 },
  '550': { d: 90, h: 100 },
  '1000': { d: 105, h: 135 },
  '1050': { d: 110, h: 125 },
  '2000': { d: 135, h: 160 },
};
const KAP_OPTIONS = Object.entries(TOREN).map(([v, t]) => ({ value: v, label: `${v} liter`, desc: `± Ø ${t.d} cm, tinggi ${t.h} cm` }));
const toren = (p: Params) => TOREN[str(p, 'kapasitas', '1000')] ?? TOREN['1000'];
const kapL = (p: Params) => parseInt(str(p, 'kapasitas', '1000')) || 1000;
/** Sisi plat yang disarankan untuk diameter toren */
const recPlat = (d: number) => [80, 100, 120, 150, 180, 200].find((v) => v >= d + 10) ?? 200;

const PIPA_OPTIONS = [
  { value: '30', label: '30×30 mm', desc: 'Dudukan rendah, toren kecil' },
  { value: '40', label: '40×40 mm', desc: 'Toren 520–1050 L, tower s/d 3,5 m' },
  { value: '50', label: '50×50 mm', desc: 'Toren 2000 L / 2 toren / tower 4 m' },
  { value: '60', label: '60×60 mm', desc: 'Beban sangat berat' },
];
const ALAS_OPTIONS = [
  { value: 'plat', label: 'Plat besi bordes 5 mm', desc: 'Paling kuat, tahan cuaca' },
  { value: 'papan', label: 'Papan (bahan di bawah)', desc: 'Murah, perlu dicat / dilapis' },
  { value: 'kisi', label: 'Kisi pipa rapat', desc: 'Tanpa plat, air hujan langsung turun' },
];

const LADDER_MODELS = ['kaki-4', 'kaki-3', 'ganda', 'tiang'];
const POMPA_MODELS = ['kaki-4', 'ganda'];
const SPREAD_MODELS = ['kaki-4', 'kaki-3', 'ganda'];
const JUMLAH_MODELS = ['kaki-4', 'atap-miring', 'rel-dak'];
const TIER_MODELS = ['kaki-4', 'kaki-3', 'ganda', 'atap-miring', 'rel-dak'];

type V = [number, number, number];
interface Leg {
  a: V; // bawah (as pipa)
  b: V; // atas (as pipa)
}
const lerp = (a: V, b: V, t: number): V => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
/** Titik as kaki pada tinggi y (boleh di luar ujung: diperpanjang lurus) */
const at = (leg: Leg, y: number): V => lerp(leg.a, leg.b, (y - leg.a[1]) / (leg.b[1] - leg.a[1] || 1));
const mid = (a: V, b: V): V => lerp(a, b, 0.5);
const levelsOf = (y0: number, y1: number, n: number) => Array.from({ length: n + 1 }, (_, k) => y0 + ((y1 - y0) * k) / n);
const plus = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const times = (a: V, k: number): V => [a[0] * k, a[1] * k, a[2] * k];
const dist = (a: V, b: V) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
const unit = (a: V, b: V): V => times([b[0] - a[0], b[1] - a[1], b[2] - a[2]], 1 / (dist(a, b) || 1));

// ---------- Cek sambungan las (sama dengan geometri batang di frameLayout) ----------
// Batang tidak boleh saling tembus: ujung batang dipotong / digeser sampai menempel rata di sisi batang lain.
const TOL = 0.1; // cm: boleh "masuk" sedikit (las) supaya tetap bersentuhan
interface Solid {
  inside: (p: V) => boolean;
  lo: V;
  hi: V;
  /** Ada titik permukaan (grid 1 cm, sama dengan cek-sambungan) di dalam kotak lo..hi yang memenuhi `pred` */
  some: (lo: V, hi: V, pred: (p: V) => boolean) => boolean;
}
const solidCache = new WeakMap<FrameMember, Solid>();
function solidOf(m: FrameMember): Solid {
  const hit = solidCache.get(m);
  if (hit) return hit;
  const w = (m.tubeSize ?? 40) / 10;
  const h = m.tubeH ? m.tubeH / 10 : w;
  const inBox = (p: V, lo: V, hi: V) => p[0] > lo[0] && p[0] < hi[0] && p[1] > lo[1] && p[1] < hi[1] && p[2] > lo[2] && p[2] < hi[2];
  let s: Solid;
  if (!m.end) {
    const sec: V = m.axis === 'y' ? [w, w, h] : [w, h, w];
    const i = m.axis === 'x' ? 0 : m.axis === 'y' ? 1 : 2;
    const min: V = [m.x - sec[0] / 2, m.y - sec[1] / 2, m.z - sec[2] / 2];
    const max: V = [m.x + sec[0] / 2, m.y + sec[1] / 2, m.z + sec[2] / 2];
    min[i] = [m.x, m.y, m.z][i];
    max[i] = min[i] + m.length;
    const n = [0, 1, 2].map((k) => Math.max(2, Math.ceil(max[k] - min[k])));
    const val = (k: number, a: number) => min[k] + ((max[k] - min[k]) * a) / n[k];
    // rentang indeks grid yang jatuh di dalam kotak
    const rng = (k: number, lo: V, hi: V): [number, number] => {
      const d = (max[k] - min[k]) / n[k];
      return [Math.max(0, Math.floor((lo[k] - min[k]) / d)), Math.min(n[k], Math.ceil((hi[k] - min[k]) / d))];
    };
    s = {
      lo: min,
      hi: max,
      inside: (p) => p.every((v, k) => v > min[k] + TOL && v < max[k] - TOL),
      some: (lo, hi, pred) => {
        const [a0, a1] = rng(0, lo, hi);
        const [b0, b1] = rng(1, lo, hi);
        const [c0, c1] = rng(2, lo, hi);
        for (let a = a0; a <= a1; a++)
          for (let b = b0; b <= b1; b++)
            for (let c = c0; c <= c1; c++) {
              if (!(a === 0 || a === n[0] || b === 0 || b === n[1] || c === 0 || c === n[2])) continue;
              const p: V = [val(0, a), val(1, b), val(2, c)];
              if (inBox(p, lo, hi) && pred(p)) return true;
            }
        return false;
      },
    };
  } else {
    const f = angledFrame(m, w, h);
    const di = cutAxisIndex(m);
    const un = f.u[di] || 1e-6;
    const e0 = f.c[di] - (f.u[di] * f.len) / 2;
    const e1 = f.c[di] + (f.u[di] * f.len) / 2;
    const clo = Math.min(e0, e1);
    const chi = Math.max(e0, e1);
    const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const n = Math.max(2, Math.ceil(f.len));
    // 8 garis rusuk/tengah sisi, masing-masing digeser supaya ujungnya jatuh di bidang potong
    const edges = [[-1, -1], [-1, 1], [1, -1], [1, 1], [0, -1], [0, 1], [-1, 0], [1, 0]].map(([j, k]) => {
      const off = [0, 1, 2].map((q) => (f.wd[q] * j * f.a) / 2 + (f.hd[q] * k * f.b) / 2);
      const t0 = -off[di] / un;
      const base: V = [0, 1, 2].map((q) => f.c[q] + f.u[q] * t0 + off[q]) as V;
      return base;
    });
    const pt = (base: V, i: number): V => {
      const tq = -f.len / 2 + (f.len * i) / n;
      return [base[0] + f.u[0] * tq, base[1] + f.u[1] * tq, base[2] + f.u[2] * tq];
    };
    const lo: V = [Infinity, Infinity, Infinity];
    const hi: V = [-Infinity, -Infinity, -Infinity];
    edges.forEach((e) => [pt(e, 0), pt(e, n)].forEach((p) => p.forEach((v, k) => ((lo[k] = Math.min(lo[k], v)), (hi[k] = Math.max(hi[k], v))))));
    s = {
      lo,
      hi,
      inside: (p) => {
        const d: V = [p[0] - f.c[0], p[1] - f.c[1], p[2] - f.c[2]];
        return p[di] > clo + TOL && p[di] < chi - TOL && Math.abs(dot(d, f.wd)) < f.a / 2 - TOL && Math.abs(dot(d, f.hd)) < f.b / 2 - TOL;
      },
      some: (blo, bhi, pred) => {
        for (const e of edges) {
          // potong garis dengan kotak (slab) supaya hanya titik di dalam kotak yang diperiksa
          let t0 = 0;
          let t1 = n;
          for (let q = 0; q < 3 && t0 <= t1; q++) {
            const sp = (f.u[q] * f.len) / n; // perubahan koordinat per langkah
            const s0 = e[q] - (f.u[q] * f.len) / 2; // koordinat di i = 0
            if (Math.abs(sp) < 1e-9) {
              if (s0 <= blo[q] || s0 >= bhi[q]) t1 = -1;
              continue;
            }
            const ia = (blo[q] - s0) / sp;
            const ib = (bhi[q] - s0) / sp;
            t0 = Math.max(t0, Math.floor(Math.min(ia, ib)));
            t1 = Math.min(t1, Math.ceil(Math.max(ia, ib)));
          }
          for (let i = t0; i <= t1; i++) {
            const p = pt(e, i);
            if (inBox(p, blo, bhi) && pred(p)) return true;
          }
        }
        return false;
      },
    };
  }
  solidCache.set(m, s);
  return s;
}
/** Dua batang saling tembus (menempati ruang yang sama), bukan sekadar bersentuhan */
function overlaps(a: FrameMember, b: FrameMember) {
  const A = solidOf(a);
  const B = solidOf(b);
  const lo: V = [0, 0, 0];
  const hi: V = [0, 0, 0];
  for (let k = 0; k < 3; k++) {
    lo[k] = Math.max(A.lo[k], B.lo[k]) + TOL;
    hi[k] = Math.min(A.hi[k], B.hi[k]) - TOL;
    if (hi[k] <= lo[k]) return false;
  }
  // hanya titik di dalam irisan kotak pembatas yang mungkin tembus
  return A.some(lo, hi, B.inside) || B.some(lo, hi, A.inside);
}
/**
 * Cari t terdekat ke `bad` (masih tembus) yang sudah tidak tembus terhadap `obs`, di antara bad..good.
 * Hasilnya batang yang tepat menempel di sisi batang lain.
 */
function boundary(f: (t: number) => FrameMember, obs: FrameMember[], bad: number, good: number) {
  const clear = (t: number) => {
    const m = f(t);
    return !obs.some((o) => overlaps(m, o));
  };
  if (!obs.length || clear(bad)) return bad;
  if (!clear(good)) return good;
  for (let it = 0; it < 12; it++) {
    const md = (bad + good) / 2;
    if (clear(md)) good = md;
    else bad = md;
  }
  return good;
}
/** Parameter (0..1) titik pada as P→Q yang paling dekat dengan as A→B (tempat dua batang bersilangan) */
function crossParam(P: V, Q: V, A: V, B: V) {
  const d1 = [Q[0] - P[0], Q[1] - P[1], Q[2] - P[2]];
  const d2 = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
  const r = [P[0] - A[0], P[1] - A[1], P[2] - A[2]];
  const dt = (u: number[], v: number[]) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
  const a = dt(d1, d1);
  const e = dt(d2, d2);
  const b = dt(d1, d2);
  const c = dt(d1, r);
  const f = dt(d2, r);
  const den = a * e - b * b;
  const s = den > 1e-9 ? (b * f - c * e) / den : 0.5;
  return Math.max(0.05, Math.min(0.95, s));
}

/** Kebutuhan pipa minimum (mm) dari beban per kaki, tinggi, dan bentang plat */
const needPipa = (p: Params) => {
  const m = model(p);
  const jml = m === 'ganda' ? 2 : JUMLAH_MODELS.includes(m) ? Math.max(1, Math.min(2, Math.round(num(p, 'jumlah', 1)))) : 1;
  const kg = kapL(p) * jml;
  const H = num(p, 'tinggi', 200);
  if (m === 'tiang') return kg > 600 ? 50 : 40;
  const legs = m === 'ganda' ? 6 : m === 'kaki-3' ? 3 : 4;
  const per = kg / legs;
  let need = per <= 150 && H <= 150 ? 30 : per <= 300 && H <= 350 ? 40 : per <= 550 && H <= 450 ? 50 : 60;
  const span = JUMLAH_MODELS.includes(m) ? jml * num(p, 'lebar', 120) : num(p, 'lebar', 120);
  if (span > 160) need = Math.max(need, 50);
  return need;
};

export const DUDUKAN_TOREN: ProductDef = {
  id: 'dudukan-toren',
  name: 'Dudukan toren & tangki air',
  tagline: 'tower toren · tangki air · atap · dak',
  icon: 'M24 14V5h12v9M18 38l4-24M42 38l-4-24M21 14h18M20 26h20M21 14l18 12M39 14L21 26M20 26l22 12M40 26L18 38',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['model', 'kapasitas', 'jumlah', 'tinggi', 'lebar'] },
    { id: 'bentuk', title: 'Rangka', keys: ['lebarKaki', 'selisih', 'kemiringan', 'tapak', 'tingkat', 'alasAtas'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Tangga & pagar', keys: ['tangga', 'pagar', 'pompa'] },
  ],
  params: [
    { key: 'model', label: 'Bentuk dudukan', type: 'choice', options: MODELS },
    { key: 'kapasitas', label: 'Kapasitas toren', type: 'choice', options: KAP_OPTIONS, help: '1 liter air = 1 kg. Toren 1000 L penuh beratnya ± 1 ton.' },
    {
      key: 'jumlah',
      label: 'Jumlah toren',
      type: 'number',
      min: 1,
      max: 2,
      step: 1,
      help: 'Dua toren berdampingan di satu plat memanjang.',
      showIf: has(...JUMLAH_MODELS),
    },
    {
      key: 'tinggi',
      label: 'Tinggi tower',
      type: 'number',
      unit: 'cm',
      min: 100,
      max: 500,
      step: 10,
      help: 'Dari lantai sampai atas plat dudukan toren. Makin tinggi makin deras air di kran. Atap miring: diukur dari sisi atap yang rendah.',
      marks: [{ value: 100, label: '1 m' }, { value: 200, label: '2 m' }, { value: 300, label: '3 m' }, { value: 400, label: '4 m' }],
    },
    {
      key: 'lebar',
      label: 'Sisi plat atas (per toren)',
      type: 'number',
      unit: 'cm',
      min: 70,
      max: 200,
      step: 5,
      help: 'Plat harus sedikit lebih lebar dari diameter toren. Tower 3 kaki: diameter plat bundar.',
      marks: [{ value: 100, label: '520 L' }, { value: 120, label: '1000 L' }, { value: 150, label: '2000 L' }],
    },
    {
      key: 'lebarKaki',
      label: 'Kaki melebar ke bawah',
      type: 'number',
      unit: 'cm',
      min: 0,
      max: 80,
      step: 5,
      help: '0 = kaki tegak lurus. Makin lebar di bawah makin kokoh terhadap angin.',
      marks: [{ value: 0, label: 'tegak' }, { value: 30, label: 'melebar' }],
      showIf: has(...SPREAD_MODELS),
    },
    {
      key: 'selisih',
      label: 'Selisih tinggi toren kedua',
      type: 'number',
      unit: 'cm',
      min: 0,
      max: 200,
      step: 10,
      help: '0 = kedua toren sama tinggi. Toren kedua lebih rendah cocok untuk tandon filter / air bersih.',
      marks: [{ value: 0, label: 'rata' }, { value: 100, label: 'bertingkat' }],
      showIf: has('ganda'),
    },
    {
      key: 'kemiringan',
      label: 'Kemiringan atap',
      type: 'number',
      unit: '°',
      min: 5,
      max: 35,
      step: 1,
      help: 'Sudut atap genteng / spandek tempat rel tapak dipasang.',
      marks: [{ value: 15, label: 'spandek' }, { value: 30, label: 'genteng' }],
      showIf: has('atap-miring'),
    },
    {
      key: 'tapak',
      label: 'Rel tapak menjulur',
      type: 'number',
      unit: 'cm',
      min: 20,
      max: 60,
      step: 5,
      help: 'Rel lantai diperpanjang di depan & belakang kaki supaya beban menyebar di dak.',
      showIf: has('rel-dak'),
    },
    {
      key: 'tingkat',
      label: 'Jumlah tingkat silang',
      type: 'number',
      min: 1,
      max: 6,
      step: 1,
      help: 'Tiap tingkat diberi ring keliling dan silang X. Idealnya satu tingkat tiap ± 1 m.',
      showIf: has(...TIER_MODELS),
    },
    { key: 'alasAtas', label: 'Alas plat atas', type: 'choice', options: ALAS_OPTIONS, showIf: (p) => model(p) !== 'kaki-3' },
    { key: 'pipa', label: 'Ukuran pipa kaki', type: 'choice', options: PIPA_OPTIONS, help: 'Makin berat toren dan makin tinggi tower, makin besar pipanya.' },
    { key: 'papan', label: 'Bahan papan', type: 'choice', options: BOARD_OPTIONS, help: 'Dipakai untuk rak pompa dan alas atas bila memilih papan.' },
    { key: 'warna', label: 'Warna cat rangka', type: 'choice', options: PAINT_OPTIONS },
    {
      key: 'tangga',
      label: 'Tangga naik',
      type: 'toggle',
      help: 'Tangga monyet di satu sisi untuk membersihkan toren. Tiang tunggal: pasak panjat di tiang.',
      showIf: has(...LADDER_MODELS),
    },
    { key: 'pagar', label: 'Pagar keliling atas', type: 'toggle', help: 'Pagar setinggi pinggang di tepi plat, aman saat perawatan.' },
    { key: 'pompa', label: 'Rak pompa / filter di bawah', type: 'toggle', help: 'Papan di tingkat bawah untuk pompa air atau tabung filter.', showIf: has(...POMPA_MODELS) },
  ],
  defaults: {
    model: 'kaki-4',
    kapasitas: '1000',
    jumlah: 1,
    tinggi: 300,
    lebar: 120,
    lebarKaki: 0,
    selisih: 100,
    kemiringan: 20,
    tapak: 30,
    tingkat: 3,
    alasAtas: 'plat',
    pipa: '40',
    papan: 'kayu',
    warna: '#1f2226',
    tangga: true,
    pagar: false,
    pompa: false,
  },
  groups: [
    { id: 'tower-tinggi', name: 'Tower tinggi', desc: 'Tower 3 kaki melebar, bisa diberi tangga monyet + pagar' },
    { id: 'dudukan-khusus', name: 'Dudukan atap & tiang', desc: 'Dudukan di atap miring, tower tiang tunggal di plat cor' },
  ],
  signature: (p) => `dudukan-toren:${model(p)}`,
  presets: [
    {
      id: 'tower-3-kaki',
      group: 'tower-tinggi',
      name: 'Tower toren 3 kaki',
      desc: 'tiga kaki melebar ke bawah, ring segitiga bertingkat dengan silang X di tiga sisi, plat bundar di puncak',
      params: { model: 'kaki-3', kapasitas: '520', tinggi: 200, lebar: 100, lebarKaki: 30, tingkat: 2, tangga: false, pagar: false, pipa: '40' },
      sizes: [
        { label: '520 L, 2 m', desc: 'plat bundar Ø 100', params: { kapasitas: '520', tinggi: 200, lebar: 100, lebarKaki: 30, tingkat: 2, tangga: false, pipa: '40' } },
        { label: '1000 L, 3 m', desc: 'plat Ø 120, tangga monyet', params: { kapasitas: '1000', tinggi: 300, lebar: 120, lebarKaki: 40, tingkat: 3, tangga: true, pipa: '50' } },
        { label: '520 L, 1 m', desc: 'di atas dak / kamar mandi', params: { kapasitas: '520', tinggi: 100, lebar: 100, lebarKaki: 20, tingkat: 1, tangga: false, pipa: '40' } },
      ],
    },
    {
      id: 'atap-miring',
      group: 'dudukan-khusus',
      name: 'Dudukan toren atap miring',
      desc: 'dua rel tapak mengikuti kemiringan atap, kaki belakang lebih pendek dari kaki depan, plat datar di atas',
      params: { model: 'atap-miring', kapasitas: '520', jumlah: 1, tinggi: 120, lebar: 100, kemiringan: 20, tingkat: 1, pagar: false, pipa: '40' },
      sizes: [
        { label: '520 L, atap 20°', desc: 'plat 100 × 100, tinggi depan 1,2 m', params: { kapasitas: '520', jumlah: 1, tinggi: 120, lebar: 100, kemiringan: 20, tingkat: 1, pipa: '40' } },
        { label: '1000 L, atap 25°', desc: 'plat 120 × 120, tinggi depan 1,5 m', params: { kapasitas: '1000', jumlah: 1, tinggi: 150, lebar: 120, kemiringan: 25, tingkat: 1, pipa: '40' } },
        { label: '2 × 520 L, spandek 15°', desc: 'plat 200 × 100', params: { kapasitas: '520', jumlah: 2, tinggi: 110, lebar: 100, kemiringan: 15, tingkat: 1, pipa: '50' } },
      ],
    },
    {
      id: 'tiang-tunggal',
      group: 'dudukan-khusus',
      name: 'Tower tiang tunggal',
      desc: 'satu tiang besar di plat cor, empat topang miring dari tiang ke sudut plat atas, pasak panjat di tiang',
      params: { model: 'tiang', kapasitas: '520', tinggi: 250, lebar: 100, tangga: true, pagar: true, pipa: '40' },
      sizes: [
        { label: '520 L, 2,5 m', desc: 'plat 100 × 100, pagar keliling', params: { kapasitas: '520', tinggi: 250, lebar: 100, pagar: true, pipa: '40' } },
        { label: '1000 L, 3 m', desc: 'plat 120 × 120, tiang 125 mm', params: { kapasitas: '1000', tinggi: 300, lebar: 120, pagar: true, pipa: '50' } },
        { label: '550 L, 2 m', desc: 'halaman sempit, tanpa pagar', params: { kapasitas: '550', tinggi: 200, lebar: 100, pagar: false, pipa: '40' } },
      ],
    },
  ],
  summary: (p) => {
    const m = model(p);
    const jml = m === 'ganda' ? 2 : JUMLAH_MODELS.includes(m) ? Math.max(1, Math.min(2, Math.round(num(p, 'jumlah', 1)))) : 1;
    const H = num(p, 'tinggi');
    const lb = num(p, 'lebar');
    const tor = `${jml > 1 ? `${jml} × ` : ''}${kapL(p)} L`;
    const plat = m === 'kaki-3' ? `plat Ø ${lb}` : `plat ${JUMLAH_MODELS.includes(m) ? jml * lb : m === 'ganda' ? 2 * lb : lb} × ${lb}`;
    const tinggi = m === 'ganda' && num(p, 'selisih') > 0 ? `tinggi ${H} / ${Math.max(100, H - num(p, 'selisih'))} cm` : `tinggi ${H} cm`;
    const extra = [bool(p, 'tangga') && LADDER_MODELS.includes(m) ? (m === 'tiang' ? 'pasak panjat' : 'tangga') : '', bool(p, 'pagar') ? 'pagar' : ''].filter(Boolean).join(' + ');
    return `${tor} · ${tinggi} · ${plat} cm${extra ? ` · ${extra}` : ''}`;
  },

  build: (p) => {
    const m = model(p);
    const L = (parseInt(str(p, 'pipa', '40')) || 40) / 10;
    const pt: [number, number] = [L * 10, L * 10];
    const bs = Math.min(40, L * 10 - 10);
    const br: [number, number] = [bs, bs]; // silang X & penguat
    const thin: [number, number] = [20, 20];
    const lb = Math.max(70, num(p, 'lebar', 120));
    const jml = JUMLAH_MODELS.includes(m) ? Math.max(1, Math.min(2, Math.round(num(p, 'jumlah', 1)))) : 1;
    const nT = Math.max(1, Math.min(6, Math.round(num(p, 'tingkat', 2))));
    const s = SPREAD_MODELS.includes(m) ? Math.max(0, num(p, 'lebarKaki', 0)) : 0;
    const papanB = BOARD_THICK[str(p, 'papan', 'kayu')] ?? 2.5;
    let alas = m === 'kaki-3' ? 'plat' : str(p, 'alasAtas', 'plat');
    if (alas === 'papan' && papanB <= 0) alas = 'plat';
    const t = alas === 'plat' ? 0.5 : alas === 'papan' ? papanB : 0; // tebal alas di atas ring
    const tangga = bool(p, 'tangga') && LADDER_MODELS.includes(m);
    const pagar = bool(p, 'pagar');
    const pompa = bool(p, 'pompa') && POMPA_MODELS.includes(m);
    const pf = 0.8; // plat kaki 8 mm
    const { list, add, line } = memberFactory();
    const boards: Board[] = [];
    let H = Math.max(100, num(p, 'tinggi', 200));
    if (m === 'rel-dak') H = Math.min(H, 200);
    let outW = 0;
    let outD = 0;
    let outH = H;

    // ---------- helper ----------
    const mk = (id: string, a: V, b: V, role: FrameMemberRole, label: string, tube: [number, number]) =>
      memberFromPoints({ id, role, label, tubeSize: tube[0], tubeH: tube[1] !== tube[0] ? tube[1] : undefined }, a, b);
    const push = (m: FrameMember) => {
      if (m.length >= 0.5) list.push(m);
      return m;
    };
    /**
     * Ujung batang P→Q dimundurkan (P searah dS, Q searah dE; bawaan: sepanjang as batang) sampai menempel
     * rata di sisi batang yang ditemui di ujung itu (butt joint), tidak masuk ke dalamnya.
     */
    const trimEnds = (P: V, Q: V, tube: [number, number], startObs: FrameMember[], endObs: FrameMember[], dS?: V, dE?: V, startV: FrameMember[] = [], endV: FrameMember[] = []): [V, V] => {
      const u = unit(P, Q);
      const sDir = dS ?? u;
      const eDir = dE ?? times(u, -1);
      // ujung batang silang yang landai (dipotong tegak) juga digeser naik/turun supaya tidak masuk ke ring
      const sUp: V = [0, Q[1] >= P[1] ? 1 : -1, 0];
      const eUp = times(sUp, -1);
      const mx = Math.min(dist(P, Q) * 0.45, 4 * L + 10);
      let tS = 0;
      let tE = 0;
      let vS = 0;
      let vE = 0;
      const ps = () => plus(plus(P, times(sDir, tS)), times(sUp, vS));
      const pe = () => plus(plus(Q, times(eDir, tE)), times(eUp, vE));
      const cand = (a: V, b: V) => mk('_', a, b, 'custom', '', tube);
      for (let pass = 0; pass < 2; pass++) {
        if (startV.length) vS = boundary((t) => cand(plus(plus(P, times(sDir, tS)), times(sUp, t)), pe()), startV, 0, 2 * L);
        tS = boundary((t) => cand(plus(plus(P, times(sDir, t)), times(sUp, vS)), pe()), startObs, 0, mx);
        if (endV.length) vE = boundary((t) => cand(ps(), plus(plus(Q, times(eDir, tE)), times(eUp, t))), endV, 0, 2 * L);
        tE = boundary((t) => cand(ps(), plus(plus(Q, times(eDir, t)), times(eUp, vE))), endObs, 0, mx);
      }
      return [ps(), pe()];
    };
    const bar = (id: string, P: V, Q: V, role: FrameMemberRole, label: string, tube: [number, number], startObs: FrameMember[], endObs: FrameMember[], dS?: V, dE?: V) => {
      const [a, b] = trimEnds(P, Q, tube, startObs, endObs, dS, dE);
      return push(mk(id, a, b, role, label, tube));
    };
    /** Batang P→Q yang bersilangan dengan batang menerus `cross`: dipotong dua, kedua potongan dilas di sisi `cross` */
    const splitBar = (id: string, P: V, Q: V, role: FrameMemberRole, label: string, tube: [number, number], cross: FrameMember) => {
      const A: V = [cross.x, cross.y, cross.z];
      const B: V = cross.end ? [cross.end.x, cross.end.y, cross.end.z] : plus(A, cross.axis === 'x' ? [cross.length, 0, 0] : cross.axis === 'y' ? [0, cross.length, 0] : [0, 0, cross.length]);
      const s = crossParam(P, Q, A, B);
      const C = lerp(P, Q, s);
      const u = unit(P, Q);
      const l1 = dist(P, C);
      const l2 = dist(C, Q);
      const t1 = boundary((t) => mk('_', P, plus(C, times(u, -t)), role, '', tube), [cross], 0, l1 - 1);
      push(mk(`${id}-1`, P, plus(C, times(u, -t1)), role, `${label} (potongan 1)`, tube));
      const t2 = boundary((t) => mk('_', plus(C, times(u, t)), Q, role, '', tube), [cross], 0, l2 - 1);
      push(mk(`${id}-2`, plus(C, times(u, t2)), Q, role, `${label} (potongan 2)`, tube));
    };
    /**
     * Ring tiap level + silang X tiap tingkat pada sisi-sisi (pasangan kaki).
     * Ring dipotong menempel rata di sisi kaki. Silang X duduk di atas ring bawah & di bawah ring atas, ujungnya
     * digeser menjauhi kaki; satu batang silang menerus, yang lain dipotong dua dan dilas di sisinya.
     * `ringOut`: sisi miring (denah segitiga) digeser keluar sedikit supaya dua ring yang bertemu di satu muka kaki
     * hanya bersentuhan, tidak saling tembus.
     */
    const frame = (pre: string, nm: string, legs: Leg[], legM: FrameMember[], faces: [number, number][], lv: number[], ringOnly: [number, number][] = [], ringOut = false) => {
      const rings = new Map<string, FrameMember>();
      const geo = (i: number, j: number, y: number) => {
        const d = unit([at(legs[i], y)[0], 0, at(legs[i], y)[2]], [at(legs[j], y)[0], 0, at(legs[j], y)[2]]);
        let off: V = [0, 0, 0];
        if (ringOut && Math.abs(d[0]) > 0.01 && Math.abs(d[2]) > 0.01) {
          const pts = legs.map((lg) => at(lg, y));
          const c: V = times(pts.reduce((s, p) => plus(s, p), [0, 0, 0] as V), 1 / pts.length);
          const mp = mid(at(legs[i], y), at(legs[j], y));
          let n: V = [d[2], 0, -d[0]];
          if (n[0] * (mp[0] - c[0]) + n[2] * (mp[2] - c[2]) < 0) n = times(n, -1);
          off = times(n, (L / 2) * (1 - Math.min(Math.abs(d[0]), Math.abs(d[2]))));
        }
        return { d, P: (yy: number) => plus(at(legs[i], yy), off), Q: (yy: number) => plus(at(legs[j], yy), off) };
      };
      lv.forEach((y, k) => {
        [...faces, ...(k === lv.length - 1 ? ringOnly : [])].forEach(([i, j]) => {
          const g = geo(i, j, y);
          rings.set(`${k}-${i}${j}`, bar(`${pre}ring-${k}-${i}${j}`, g.P(y), g.Q(y), 'custom', `${nm}ring tingkat ${k + 1} (kaki ${i + 1}–${j + 1})`, pt, [legM[i]], [legM[j]]));
        });
      });
      for (let k = 0; k < lv.length - 1; k++) {
        const yl = lv[k] + L / 2;
        const yh = lv[k + 1] - L / 2;
        faces.forEach(([i, j]) => {
          const g = geo(i, j, lv[k]);
          const back = times(g.d, -1);
          const rLo = rings.get(`${k}-${i}${j}`);
          const rHi = rings.get(`${k + 1}-${i}${j}`);
          const lo = rLo ? [rLo] : [];
          const hi = rHi ? [rHi] : [];
          const [a0, a1] = trimEnds(g.P(yl), g.Q(yh), br, [legM[i]], [legM[j]], g.d, back, lo, hi);
          const A = push(mk(`${pre}x-${k}-${i}${j}-a`, a0, a1, 'custom', `${nm}silang X tingkat ${k + 1} (kaki ${i + 1}–${j + 1})`, br));
          const [b0, b1] = trimEnds(g.Q(yl), g.P(yh), br, [legM[j]], [legM[i]], back, g.d, lo, hi);
          splitBar(`${pre}x-${k}-${i}${j}-b`, b0, b1, 'custom', `${nm}silang X tingkat ${k + 1} (kaki ${j + 1}–${i + 1})`, br, A);
        });
      }
      return (k: number, i: number, j: number) => rings.get(`${k}-${i}${j}`) ?? rings.get(`${k}-${j}${i}`);
    };
    const legLines = (pre: string, nm: string, legs: Leg[]) => legs.map((lg, i) => push(mk(`${pre}kaki-${i + 1}`, lg.a, lg.b, 'post', `${nm}kaki ${i + 1}`, pt)));
    const footPlates = (pre: string, legs: Leg[]) =>
      legs.forEach((lg, i) => boards.push({ ...board(`${pre}plat-kaki-${i + 1}`, `Plat kaki ${i + 1} (dibaut ke cor)`, lg.a[0] - 8, lg.a[0] + 8, 0, pf, lg.a[2] - 8, lg.a[2] + 8), steelMm: 8 }));
    /** Plat / kisi atas kotak: ring sudah ada di yR; balok alas sejajar z di antara ring belakang & depan */
    const deckRect = (pre: string, x0: number, x1: number, z0: number, z1: number, yTop: number) => {
      const yR = yTop - t - L / 2;
      const za = z0 + L;
      const zb = z1 - L;
      if (alas === 'kisi') {
        const n = Math.max(3, Math.round((x1 - x0 - 2 * L) / 12));
        for (let k = 1; k < n; k++) add(`${pre}kisi-${k}`, 'z', x0 + L / 2 + ((x1 - x0 - L) * k) / n, yTop - 2, za, zb - za, 'custom', `Kisi alas ${k}`, [20, 40]);
      } else {
        const n = Math.max(1, Math.ceil((x1 - x0) / 45) - 1);
        for (let k = 1; k <= n; k++) add(`${pre}balok-${k}`, 'z', x0 + ((x1 - x0) * k) / (n + 1), yR, za, zb - za, 'custom', `Balok alas ${k}`, pt);
        const bd = board(`${pre}alas`, alas === 'plat' ? 'Plat alas toren' : 'Papan alas toren', x0, x1, yTop - t, yTop, z0, z1);
        boards.push(alas === 'plat' ? { ...bd, steelMm: 5 } : bd);
      }
    };
    /** Pagar pinggang di sepanjang tepi a→b (x,z), dengan celah opsional di tengah tepi. Palang dipotong di antara tiang. */
    const posts = new Map<string, FrameMember>();
    let edgeNo = 0;
    const pagarEdge = (pre: string, a: [number, number], b: [number, number], y: number, gap = 0) => {
      const post = (q: [number, number]) => {
        const k = `${r1(q[0])},${r1(q[1])}`;
        const old = posts.get(k);
        if (old) return old;
        const m = push(mk(`${pre}tiang-pagar-${posts.size + 1}`, [q[0], y, q[1]], [q[0], y + 90, q[1]], 'custom', `Tiang pagar ${posts.size + 1}`, [30, 30]));
        posts.set(k, m);
        return m;
      };
      edgeNo++;
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const P = (f: number): [number, number] => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
      const segs: [number, number][] = gap > 0 ? [[0, 0.5 - gap / 2 / len], [0.5 + gap / 2 / len, 1]] : [[0, 1]];
      segs.forEach(([f0, f1], si) => {
        const fr = gap === 0 && len > 130 ? [f0, 0.5, f1] : [f0, f1];
        const ps = fr.map((f) => post(P(f)));
        for (let q = 0; q + 1 < fr.length; q++) {
          const A = P(fr[q]);
          const B = P(fr[q + 1]);
          [90, 45].forEach((hh) =>
            bar(`${pre}pagar-${edgeNo}-${si}-${q}-${hh}`, [A[0], y + hh - 1, A[1]], [B[0], y + hh - 1, B[1]], 'custom', `Palang pagar ${hh === 90 ? 'atas' : 'tengah'}`, thin, [ps[q]], [ps[q + 1]])
          );
        }
      });
    };
    /** Tangga monyet di sisi (kaki i–j), sejajar muka sisi, ditahan batang penyangga di tiap ring */
    const LADDER_HALF = 22;
    const ladder = (legs: Leg[], i: number, j: number, center: [number, number], yTop: number, lv: number[], ringAt: (k: number, i: number, j: number) => FrameMember | undefined) => {
      const fm = (y: number) => mid(at(legs[i], y), at(legs[j], y));
      const pi = at(legs[i], yTop);
      const pj = at(legs[j], yTop);
      const tl = Math.hypot(pj[0] - pi[0], pj[2] - pi[2]) || 1;
      const tx = (pj[0] - pi[0]) / tl;
      const tz = (pj[2] - pi[2]) / tl;
      let nx = tz;
      let nz = -tx;
      const c = fm(yTop);
      if (nx * (c[0] - center[0]) + nz * (c[2] - center[1]) < 0) {
        nx = -nx;
        nz = -nz;
      }
      const off = 18;
      const rail = (y: number, sg: number): V => {
        const f = fm(y);
        return [f[0] + nx * off + tx * LADDER_HALF * sg, y, f[2] + nz * off + tz * LADDER_HALF * sg];
      };
      const ibu = [-1, 1].map((sg, k) => push(mk(`tangga-ibu-${k}`, rail(0, sg), rail(yTop + 100, sg), 'post', `Ibu tangga ${k ? 'kanan' : 'kiri'}`, br)));
      // anak tangga dipotong di antara kedua ibu tangga
      for (let y = 30, k = 1; y <= yTop + 1; y += 30, k++) bar(`tangga-anak-${k}`, rail(y, -1), rail(y, 1), 'custom', `Anak tangga ${k}`, thin, [ibu[0]], [ibu[1]]);
      // penyangga: dari sisi luar ring sampai sisi dalam ibu tangga
      lv.forEach((y, k) =>
        [-1, 1].forEach((sg, q) => {
          const f = fm(y);
          const ring = ringAt(k, i, j);
          bar(`tangga-penyangga-${k}-${q}`, [f[0] + tx * LADDER_HALF * sg, y, f[2] + tz * LADDER_HALF * sg], rail(y, sg), 'custom', `Penyangga tangga ${k + 1}`, thin, ring ? [ring] : [], [ibu[q]]);
        })
      );
      return { nx, nz };
    };
    const gapW = 2 * LADDER_HALF + 10;
    const in_ = 1.5; // tiang pagar masuk dari tepi plat

    if (m === 'kaki-4') {
      const Wd = jml * lb;
      const Dd = lb;
      const yTop = H;
      const yR = yTop - t - L / 2;
      const x0 = s + L / 2;
      const x1 = s + Wd - L / 2;
      const z0 = s + L / 2;
      const z1 = s + Dd - L / 2;
      const Wb = Wd + 2 * s;
      const Db = Dd + 2 * s;
      const top: [number, number][] = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
      const bot: [number, number][] = [[L / 2, L / 2], [Wb - L / 2, L / 2], [Wb - L / 2, Db - L / 2], [L / 2, Db - L / 2]];
      const legs: Leg[] = top.map((tp, i) => ({ a: [bot[i][0], pf, bot[i][1]], b: [tp[0], yTop - t, tp[1]] }));
      const legM = legLines('', '', legs);
      footPlates('', legs);
      const y0 = 30;
      const lv = levelsOf(y0, yR, nT);
      const faces: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 0]];
      const ringAt = frame('', '', legs, legM, faces, lv);
      deckRect('', s, s + Wd, s, s + Dd, yTop);
      if (pompa && papanB > 0) {
        const a0 = at(legs[0], y0);
        const a2 = at(legs[2], y0);
        add('pompa-balok', 'z', (a0[0] + a2[0]) / 2, y0, a0[2] + L / 2, a2[2] - a0[2] - L, 'custom', 'Balok rak pompa', pt);
        boards.push(board('papan-pompa', 'Papan rak pompa / filter', a0[0], a2[0], y0 + L / 2, y0 + L / 2 + papanB, a0[2], a2[2]));
      }
      if (tangga) ladder(legs, 2, 3, [Wb / 2, Db / 2], yTop, lv, ringAt);
      if (pagar) {
        const c: [number, number][] = [[s + in_, s + in_], [s + Wd - in_, s + in_], [s + Wd - in_, s + Dd - in_], [s + in_, s + Dd - in_]];
        pagarEdge('', c[0], c[1], yTop);
        pagarEdge('', c[1], c[2], yTop);
        pagarEdge('', c[2], c[3], yTop, tangga ? gapW : 0);
        pagarEdge('', c[3], c[0], yTop);
      }
      outW = Wb;
      outD = Db + (tangga ? 30 : 0);
    } else if (m === 'kaki-3') {
      const P = lb;
      const R = P / 2 - in_;
      const Rb = R + s;
      const cx = Rb + L;
      const cz = Rb + L;
      const yTop = H;
      const yR = yTop - t - L / 2;
      const angs = [-90, 30, 150].map((d) => (d * Math.PI) / 180);
      const legs: Leg[] = angs.map((a) => ({
        a: [cx + Rb * Math.cos(a), pf, cz + Rb * Math.sin(a)],
        b: [cx + R * Math.cos(a), yTop - t, cz + R * Math.sin(a)],
      }));
      const legM = legLines('', '', legs);
      footPlates('', legs);
      // ring teratas tepat di bawah balok laba-laba (balok di puncak kaki menopang plat)
      const lv = levelsOf(30, yR, nT).map((y, k, a) => (k === a.length - 1 ? yR - L : y));
      const faces: [number, number][] = [[0, 1], [1, 2], [2, 0]];
      const ringAt = frame('', '', legs, legM, faces, lv, [], true);
      // laba-laba: balok 1 menerus dari kaki 1 melewati titik tengah, balok 2 & 3 dilas di sisinya; plat bundar di atasnya
      const s0 = at(legs[0], yR);
      const sp0 = bar('balok-tengah-1', s0, [s0[0], yR, cz + L], 'custom', 'Balok alas ke tengah 1 (menerus)', pt, [legM[0]], []);
      [1, 2].forEach((i) => bar(`balok-tengah-${i + 1}`, at(legs[i], yR), [cx, yR, cz], 'custom', `Balok alas ke tengah ${i + 1}`, pt, [legM[i]], [sp0]));
      boards.push({ ...board('alas', 'Plat alas toren (bundar)', cx - P / 2, cx + P / 2, yTop - t, yTop, cz - P / 2, cz + P / 2), shape: 'round', steelMm: 5 });
      if (tangga) ladder(legs, 1, 2, [cx, cz], yTop, lv, ringAt);
      if (pagar) {
        const c = legs.map((lg) => [lg.b[0], lg.b[2]] as [number, number]);
        pagarEdge('', c[0], c[1], yTop);
        pagarEdge('', c[1], c[2], yTop, tangga ? gapW : 0);
        pagarEdge('', c[2], c[0], yTop);
      }
      outW = 2 * cx;
      outD = Math.max(2 * cz, cz + Rb + (tangga ? 30 : 0));
    } else if (m === 'ganda') {
      const sel = Math.max(0, Math.min(H - 100, num(p, 'selisih', 0)));
      const HA = H;
      const HB = H - sel;
      const D = lb;
      const xL = s + L / 2;
      const xM = s + lb;
      const xR = s + 2 * lb - L / 2;
      const zT0 = s + L / 2;
      const zT1 = s + D - L / 2;
      const Wb = 2 * lb + 2 * s;
      const Db = D + 2 * s;
      const zB0 = L / 2;
      const zB1 = Db - L / 2;
      const yA = HA - t;
      const yB = HB - t;
      // 0 kiri-belakang, 1 tengah-belakang, 2 tengah-depan, 3 kiri-depan, 4 kanan-belakang, 5 kanan-depan
      const legs: Leg[] = [
        { a: [L / 2, pf, zB0], b: [xL, yA, zT0] },
        { a: [xM, pf, zB0], b: [xM, yA, zT0] },
        { a: [xM, pf, zB1], b: [xM, yA, zT1] },
        { a: [L / 2, pf, zB1], b: [xL, yA, zT1] },
        { a: [Wb - L / 2, pf, zB0], b: [xR, yB, zT0] },
        { a: [Wb - L / 2, pf, zB1], b: [xR, yB, zT1] },
      ];
      const legM = legs.map((lg, i) => push(mk(`kaki-${i + 1}`, lg.a, lg.b, 'post', i === 1 || i === 2 ? `Tiang tengah bersama ${i}` : `Kaki ${i + 1}`, pt)));
      footPlates('', legs);
      const y0 = 30;
      const yRA = yA - L / 2;
      const yRB = yB - L / 2;
      const lvA = levelsOf(y0, yRA, nT);
      const nB = Math.max(1, Math.round((nT * (yRB - y0)) / (yRA - y0)));
      const lvB = levelsOf(y0, yRB, nB);
      const ringA = frame('a-', 'Toren 1: ', legs, legM, [[0, 1], [1, 2], [2, 3], [3, 0]], lvA);
      frame('b-', 'Toren 2: ', legs, legM, [[1, 4], [4, 5], [5, 2]], lvB, sel > 0 ? [[2, 1]] : []);
      deckRect('a-', s, s + lb, s, s + D, HA);
      deckRect('b-', s + lb, s + 2 * lb, s, s + D, HB);
      if (pompa && papanB > 0) {
        const a0 = at(legs[0], y0);
        const a2 = at(legs[2], y0);
        add('pompa-balok', 'z', (a0[0] + a2[0]) / 2, y0, a0[2] + L / 2, a2[2] - a0[2] - L, 'custom', 'Balok rak pompa', pt);
        boards.push(board('papan-pompa', 'Papan rak pompa / filter', a0[0], a2[0], y0 + L / 2, y0 + L / 2 + papanB, a0[2], a2[2]));
      }
      if (tangga) ladder(legs, 3, 0, [Wb / 2, Db / 2], HA, lvA, ringA);
      if (pagar) {
        const zb = s + in_;
        const zf = s + D - in_;
        const xa = s + in_;
        const xm = s + lb;
        const xb = s + 2 * lb - in_;
        pagarEdge('a-', [xa, zb], [xm, zb], HA);
        pagarEdge('a-', [xa, zf], [xm, zf], HA);
        pagarEdge('a-', [xa, zf], [xa, zb], HA, tangga ? gapW : 0);
        if (sel > 0) pagarEdge('a-', [xm, zb], [xm, zf], HA);
        pagarEdge('b-', [xm, zb], [xb, zb], HB);
        pagarEdge('b-', [xm, zf], [xb, zf], HB);
        pagarEdge('b-', [xb, zb], [xb, zf], HB);
      }
      outW = Wb + (tangga ? 30 : 0);
      outD = Db;
      if (tangga) {
        // tangga di sisi kiri: geser semua ke kanan supaya tidak minus
        const dx = 30;
        list.forEach((mb) => {
          mb.x = r1(mb.x + dx);
          if (mb.end) mb.end = { ...mb.end, x: r1(mb.end.x + dx) };
        });
        boards.forEach((bd) => {
          bd.box.min[0] = r1(bd.box.min[0] + dx);
          bd.box.max[0] = r1(bd.box.max[0] + dx);
        });
      }
    } else if (m === 'atap-miring') {
      const Wd = jml * lb;
      const D = lb;
      const tanA = Math.tan((Math.max(5, Math.min(35, num(p, 'kemiringan', 20))) * Math.PI) / 180);
      const yr = (z: number) => (D - z) * tanA; // permukaan atap: depan (z = D) rendah
      H = Math.max(H, Math.ceil(D * tanA + 60));
      const yTop = H;
      const yR = yTop - t - L / 2;
      const xs = [L / 2, Wd - L / 2];
      const z0 = L / 2;
      const z1 = D - L / 2;
      const railM = xs.map((x, i) => push(mk(`rel-atap-${i}`, [x, yr(0) + L / 2, 0], [x, yr(D) + L / 2, D], 'rail-z', `Rel tapak atap ${i ? 'kanan' : 'kiri'} (ikut miring)`, pt)));
      // palang melintang menumpang di atas kedua rel (dilas di garis sentuh), kaki berdiri rata di atas palang
      const palang = (id: string, zc: number, label: string) => {
        const y0r = yr(zc) + L / 2;
        const dy = boundary((v) => mk('_', [0, y0r + v, zc], [Wd, y0r + v, zc], 'rail-x', '', pt), railM, 0, 2 * L);
        return push(mk(id, [0, y0r + dy, zc], [Wd, y0r + dy, zc], 'rail-x', label, pt));
      };
      const palB = palang('rel-silang-belakang', z0, 'Palang rel belakang (di atas rel)');
      const palD = palang('rel-silang-depan', z1, 'Palang rel depan (di atas rel)');
      // 0 kiri-belakang, 1 kanan-belakang, 2 kanan-depan, 3 kiri-depan
      const corners: [number, number][] = [[xs[0], z0], [xs[1], z0], [xs[1], z1], [xs[0], z1]];
      const legs: Leg[] = corners.map(([x, z], i) => ({ a: [x, (i < 2 ? palB : palD).y + L / 2, z], b: [x, yTop - t, z] }));
      const legM = legs.map((lg, i) => push(mk(`kaki-${i + 1}`, lg.a, lg.b, 'post', `Kaki ${i + 1} (${i < 2 ? 'belakang, pendek' : 'depan, panjang'})`, pt)));
      const yLow = legs[0].a[1] + 15;
      const lv = levelsOf(yLow, yR, nT);
      const ringAt = frame('', '', legs, legM, [[0, 1], [1, 2], [2, 3], [3, 0]], lv);
      // bawah ring terendah: silang di muka depan & segitiga di sisi samping
      const ybf = legs[2].a[1];
      if (yLow - ybf > 25) {
        // silang X depan: duduk di atas palang rel depan, ujung atas di bawah ring terendah
        const ex: V = [1, 0, 0];
        const wx: V = [-1, 0, 0];
        const rF = ringAt(0, 2, 3);
        const up = rF ? [rF] : [];
        const [a0, a1] = trimEnds([xs[0], ybf, z1], [xs[1], yLow - L / 2, z1], br, [legM[3]], [legM[2]], ex, wx, [palD], up);
        const XA = push(mk('x-bawah-depan-a', a0, a1, 'custom', 'Silang X bawah depan', br));
        const [b0, b1] = trimEnds([xs[1], ybf, z1], [xs[0], yLow - L / 2, z1], br, [legM[2]], [legM[3]], wx, ex, [palD], up);
        splitBar('x-bawah-depan-b', b0, b1, 'custom', 'Silang X bawah depan', br, XA);
        // topang samping: kaki bawah duduk di rel tepat di belakang kaki depan, ujung atas di bawah ring samping
        xs.forEach((x, i) => {
          const legF = legM[i ? 2 : 3];
          const legB = legM[i ? 1 : 0];
          let top: V = [x, yLow - L / 2, z0];
          let bot: V = [x, ybf, z1];
          const onRail = (zS: number, tp: V): V => {
            const y0r = yr(zS) + L / 2;
            const dy = boundary((v) => mk('_', [x, y0r + v, zS], tp, 'custom', '', br), [railM[i]], 0, 3 * L);
            return [x, y0r + dy, zS];
          };
          for (let pass = 0; pass < 2; pass++) {
            const tz = boundary((v) => mk('_', bot, [x, top[1], z0 + v], 'custom', '', br), [legB], 0, 4 * L);
            top = [x, top[1], z0 + tz];
            const tp = top;
            const bz = boundary((v) => mk('_', onRail(z1 - v, tp), tp, 'custom', '', br), [legF, palD], 0, 5 * L);
            bot = onRail(z1 - bz, top);
          }
          push(mk(`topang-samping-${i}`, bot, top, 'custom', `Topang samping ${i ? 'kanan' : 'kiri'}`, br));
        });
      }
      deckRect('', 0, Wd, 0, D, yTop);
      if (pagar) {
        const c: [number, number][] = [[in_, in_], [Wd - in_, in_], [Wd - in_, D - in_], [in_, D - in_]];
        pagarEdge('', c[0], c[1], yTop);
        pagarEdge('', c[1], c[2], yTop);
        pagarEdge('', c[2], c[3], yTop);
        pagarEdge('', c[3], c[0], yTop);
      }
      outW = Wd;
      outD = D;
    } else if (m === 'tiang') {
      const W = lb;
      const cx = W / 2;
      const cz = W / 2;
      const C = L * 2.5; // tiang utama, cm
      const yTop = H;
      const yR = yTop - t - L / 2;
      const sp = Math.max(40, C + 30);
      boards.push({ ...board('plat-cor', 'Plat dasar tiang 12 mm (angkur ke cor)', cx - sp / 2, cx + sp / 2, 0, 1.2, cz - sp / 2, cz + sp / 2), steelMm: 12 });
      const tiangM = push(mk('tiang', [cx, 1.2, cz], [cx, yR - L / 2, cz], 'post', `Tiang utama ${r1(C * 10)}×${r1(C * 10)} mm`, [C * 10, C * 10]));
      // sirip: duduk di plat dasar, ujung atas menempel di sisi tiang
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dz], k) =>
        bar(`sirip-${k + 1}`, [cx + dx * (sp / 2 - 3), 1.2, cz + dz * (sp / 2 - 3)], [cx + (dx * C) / 2, 22, cz + (dz * C) / 2], 'custom', `Sirip penguat dasar ${k + 1}`, thin, [], [tiangM])
      );
      // kepala: ring keliling (belakang & depan menerus, kiri & kanan di antaranya) + balok silang di atas tiang
      const a = L / 2;
      const b = W - L / 2;
      const cor: V[] = [[a, yR, a], [b, yR, a], [b, yR, b], [a, yR, b]];
      add('ring-1', 'x', 0, yR, a, W, 'custom', 'Ring atas 1 (belakang, menerus)', pt);
      add('ring-2', 'z', b, yR, L, W - 2 * L, 'custom', 'Ring atas 2 (kanan)', pt);
      add('ring-3', 'x', 0, yR, b, W, 'custom', 'Ring atas 3 (depan, menerus)', pt);
      add('ring-4', 'z', a, yR, L, W - 2 * L, 'custom', 'Ring atas 4 (kiri)', pt);
      add('balok-x', 'x', L, yR, cz, W - 2 * L, 'custom', 'Balok kepala kiri-kanan', pt);
      add('balok-z-1', 'z', cx, yR, L, W / 2 - L - L / 2, 'custom', 'Balok kepala belakang', pt);
      add('balok-z-2', 'z', cx, yR, W / 2 + L / 2, W / 2 - L - L / 2, 'custom', 'Balok kepala depan', pt);
      const yS = Math.max(40, yR - Math.max(60, W * 0.7));
      // topang: ujung bawah menempel di sudut tiang, ujung atas rata di bawah pojok ring
      cor.forEach((pnt, k) => {
        const sx = Math.sign(pnt[0] - cx);
        const sz = Math.sign(pnt[2] - cz);
        bar(`topang-${k + 1}`, [cx + (sx * C) / 2, yS, cz + (sz * C) / 2], [pnt[0], yR - L / 2, pnt[2]], 'custom', `Topang miring ${k + 1}`, pt, [tiangM], []);
      });
      if (alas === 'kisi') {
        const n = Math.max(3, Math.round((W - 2 * L) / 12));
        for (let k = 1; k < n; k++) {
          const x = L / 2 + ((W - L) * k) / n;
          if (Math.abs(x - cx) < L) continue;
          // kisi dipotong di balok kepala kiri-kanan
          add(`kisi-${k}`, 'z', x, yTop - 2, L, cz - L / 2 - L, 'custom', `Kisi alas ${k}`, [20, 40]);
          add(`kisi-${k}b`, 'z', x, yTop - 2, cz + L / 2, W - L - cz - L / 2, 'custom', `Kisi alas ${k}`, [20, 40]);
        }
      } else {
        const bd = board('alas', alas === 'plat' ? 'Plat alas toren' : 'Papan alas toren', 0, W, yTop - t, yTop, 0, W);
        boards.push(alas === 'plat' ? { ...bd, steelMm: 5 } : bd);
      }
      if (tangga) {
        for (let y = 40, k = 1; y < yS - 8; y += 35, k++) {
          const sg = k % 2 ? 1 : -1;
          add(`pasak-${k}`, 'x', sg > 0 ? cx + C / 2 : cx - C / 2 - 15, y, cz + C / 2 - 2, 15, 'custom', `Pasak panjat ${k} (${sg > 0 ? 'kanan' : 'kiri'})`, thin);
        }
      }
      if (pagar) {
        const c: [number, number][] = [[in_, in_], [W - in_, in_], [W - in_, W - in_], [in_, W - in_]];
        c.forEach((pnt, k) => pagarEdge('', pnt, c[(k + 1) % 4], yTop));
      }
      outW = W;
      outD = W;
    } else {
      // rel-dak: 4 kaki di dua rel tapak panjang
      const Wd = jml * lb;
      const D = lb;
      const E = Math.max(20, num(p, 'tapak', 30));
      const yTop = H;
      const yR = yTop - t - L / 2;
      const xs = [L / 2, Wd - L / 2];
      const zr = D + 2 * E;
      xs.forEach((x, i) => add(`rel-${i}`, 'z', x, L / 2, 0, zr, 'rail-z', `Rel tapak ${i ? 'kanan' : 'kiri'}`, pt));
      add('rel-ujung-belakang', 'x', L, L / 2, L / 2, Wd - 2 * L, 'rail-x', 'Palang ujung rel belakang', pt);
      add('rel-ujung-depan', 'x', L, L / 2, zr - L / 2, Wd - 2 * L, 'rail-x', 'Palang ujung rel depan', pt);
      const z0 = E + L / 2;
      const z1 = E + D - L / 2;
      const corners: [number, number][] = [[xs[0], z0], [xs[1], z0], [xs[1], z1], [xs[0], z1]];
      const legs: Leg[] = corners.map(([x, z]) => ({ a: [x, L, z], b: [x, yTop - t, z] }));
      const legM = legs.map((lg, i) => push(mk(`kaki-${i + 1}`, lg.a, lg.b, 'post', `Kaki ${i + 1}`, pt)));
      const lv = levelsOf(L + 12, yR, nT);
      frame('', '', legs, legM, [[0, 1], [1, 2], [2, 3], [3, 0]], lv);
      const yK = Math.min(60, (yR - L) * 0.5);
      xs.forEach((x, i) => {
        line(`topang-${i}-b`, [x, L, 2], [x, yK, z0], 'custom', `Topang ujung rel belakang ${i ? 'kanan' : 'kiri'}`, br);
        line(`topang-${i}-d`, [x, L, zr - 2], [x, yK, z1], 'custom', `Topang ujung rel depan ${i ? 'kanan' : 'kiri'}`, br);
      });
      deckRect('', 0, Wd, E, E + D, yTop);
      if (pagar) {
        const c: [number, number][] = [[in_, E + in_], [Wd - in_, E + in_], [Wd - in_, E + D - in_], [in_, E + D - in_]];
        c.forEach((pnt, k) => pagarEdge('', pnt, c[(k + 1) % 4], yTop));
      }
      outW = Wd;
      outD = zr;
    }

    if (pagar) outH = H + 90;
    if (tangga && m !== 'tiang') outH = Math.max(outH, H + 100);
    return { members: list, boards, casters: [], W: r1(outW), D: r1(outD), H: r1(outH), boardThick: 0 };
  },

  checks: (p) => {
    const out: ProductCheck[] = [];
    const m = model(p);
    const tor = toren(p);
    const lb = num(p, 'lebar');
    const H = num(p, 'tinggi');
    const L = (parseInt(str(p, 'pipa', '40')) || 40) / 10;
    const s = SPREAD_MODELS.includes(m) ? num(p, 'lebarKaki') : 0;
    const jml = m === 'ganda' ? 2 : JUMLAH_MODELS.includes(m) ? Math.max(1, Math.min(2, Math.round(num(p, 'jumlah', 1)))) : 1;
    const nT = Math.max(1, Math.round(num(p, 'tingkat', 1)));
    const kg = kapL(p) * jml;

    if (lb < tor.d + 5) {
      const v = Math.min(200, recPlat(tor.d));
      out.push({ level: 'warn', message: `Plat ${lb} cm lebih kecil dari toren ${kapL(p)} L (Ø ± ${tor.d} cm): dasar toren menggantung dan bisa retak.`, fix: { label: `Plat ${v} cm`, params: { lebar: v } } });
    }
    const need = needPipa(p);
    if (L * 10 < need) out.push({ level: 'warn', message: `Pipa ${L * 10}×${L * 10} kurang kuat untuk ${kg} kg air${H > 300 ? ` setinggi ${H} cm` : ''}.`, fix: { label: `Pakai pipa ${need}×${need}`, params: { pipa: String(need) } } });

    if (m === 'tiang') {
      if (kapL(p) > 1050) out.push({ level: 'warn', message: 'Toren 2000 L terlalu berat untuk satu tiang: rawan melengkung dan miring.', fix: { label: 'Toren 1050 L', params: { kapasitas: '1050', lebar: Math.max(lb, 120) } } });
      if (H > 350) out.push({ level: 'warn', message: 'Tiang tunggal lebih dari 3,5 m mudah bergoyang saat angin kencang dengan toren penuh.', fix: { label: 'Tinggi 300 cm', params: { tinggi: 300 } } });
      out.push({ level: 'info', message: 'Plat dasar tiang diangkur ke pondasi cor minimal 60 × 60 × 60 cm dengan 4 baut angkur.' });
    } else {
      // tinggi tiap tingkat silang
      let span = H - 30;
      if (m === 'atap-miring') span = H - (lb * Math.tan((num(p, 'kemiringan') * Math.PI) / 180) + 20);
      if (m === 'rel-dak') span = Math.min(H, 200) - 15;
      if (span / nT > 120) {
        const v = Math.min(6, Math.ceil(span / 110));
        out.push({ level: 'warn', message: `Jarak antar ring ${Math.round(span / nT)} cm terlalu jauh: kaki bisa melengkung karena beban toren.`, fix: { label: `${v} tingkat silang`, params: { tingkat: v } } });
      }
      // ramping terhadap tinggi
      const base = m === 'kaki-3' ? 1.5 * (lb / 2 - 1.5 + s) : m === 'ganda' ? lb + 2 * s : m === 'kaki-4' ? Math.min(jml * lb, lb) + 2 * s : lb;
      if (SPREAD_MODELS.includes(m) && H / base > 3) {
        const v = m === 'kaki-3' ? Math.ceil((H / 3 / 1.5 - (lb / 2 - 1.5)) / 5) * 5 : Math.ceil((H / 3 - lb) / 2 / 5) * 5;
        out.push({ level: 'warn', message: 'Tower terlalu ramping dibanding tingginya: bisa terguling saat angin kencang dan toren penuh.', fix: { label: `Kaki melebar ${Math.min(80, v)} cm`, params: { lebarKaki: Math.min(80, v) } } });
      }
    }
    if (m === 'atap-miring') {
      const k = num(p, 'kemiringan');
      const hMin = Math.ceil(lb * Math.tan((k * Math.PI) / 180) + 60);
      if (k > 30) out.push({ level: 'warn', message: 'Atap lebih curam dari 30° sulit dipasangi rel: dudukan bisa merosot.', fix: { label: 'Kemiringan 25°', params: { kemiringan: 25 } } });
      if (H < hMin) out.push({ level: 'warn', message: `Kaki belakang terlalu pendek untuk atap ${k}°: tinggi dinaikkan otomatis.`, fix: { label: `Tinggi ${Math.ceil(hMin / 10) * 10} cm`, params: { tinggi: Math.ceil(hMin / 10) * 10 } } });
      out.push({ level: 'info', message: 'Rel tapak dibaut ke kuda-kuda / gording, bukan ke genteng. Tutup lubang baut dengan sealant.' });
    }
    if (m === 'rel-dak') {
      if (H > 200) out.push({ level: 'warn', message: 'Dudukan rel dak dibuat maksimal 2 m. Untuk lebih tinggi pakai tower 4 kaki dengan plat kaki dibaut.', fix: { label: 'Tinggi 200 cm', params: { tinggi: 200 } } });
      out.push({ level: 'info', message: 'Rel tapak dialasi karet atau balok kayu supaya lapisan anti bocor dak tidak rusak.' });
    }
    if (m === 'ganda' && num(p, 'selisih') > H - 100) out.push({ level: 'warn', message: 'Toren kedua terlalu rendah (di bawah 1 m), tidak cukup tekanan air.', fix: { label: `Selisih ${Math.max(0, H - 100)} cm`, params: { selisih: Math.max(0, H - 100) } } });
    if (H >= 200 && LADDER_MODELS.includes(m) && !bool(p, 'tangga')) out.push({ level: 'info', message: 'Tanpa tangga, toren hanya bisa dibersihkan dengan tangga lipat. Tambah tangga naik bila sering dikuras.', fix: { label: 'Tambah tangga', params: { tangga: true } } });
    if (H >= 300 && !bool(p, 'pagar')) out.push({ level: 'info', message: 'Tower 3 m ke atas sebaiknya diberi pagar keliling supaya aman saat perawatan.', fix: { label: 'Tambah pagar', params: { pagar: true } } });
    out.push({ level: 'info', message: `Beban penuh ± ${Math.round(kg * 1.1)} kg (air + toren). Tiap kaki dibaut ke cor dengan dynabolt / angkur, cat dasar anti karat 2 lapis.` });
    return out;
  },
};
