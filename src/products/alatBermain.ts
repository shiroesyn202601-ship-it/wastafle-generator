import { FrameHinge } from '../types/kitchen';
import { Board, Params, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, board, materialParams, memberFactory, num, r1, str } from './common';
import { angledFrame, cutAxisIndex, memberFromPoints } from '../utils/frameLayout';

type P3 = [number, number, number];
const INF = 1e9;
/** Batang miring a→b sesudah dibulatkan seperti `line()`, beserta rangka penampangnya */
function slanted(a: P3, b: P3, tube: [number, number]) {
  const mm = memberFromPoints({ id: '_', role: 'custom', label: '', tubeSize: tube[0], tubeH: tube[1] }, a, b);
  const f = angledFrame(mm, tube[0] / 10, tube[1] / 10);
  return { f, di: cutAxisIndex(mm), s: [mm.x, mm.y, mm.z] as P3, e: (mm.end ? [mm.end.x, mm.end.y, mm.end.z] : b) as P3 };
}
/**
 * Setengah lebar tapak potongan ujung batang miring a→b (bidang potong rata lantai / tegak lurus sumbu dominan),
 * diukur sepanjang sumbu dunia `ax` dari as batang. Dipakai supaya ujung batang miring menempel rata di sisi
 * batang lain, tidak masuk ke dalamnya.
 */
function footHalf(a: P3, b: P3, tube: [number, number], ax: number) {
  const { f, di } = slanted(a, b, tube);
  const g = (v: P3) => v[ax] - (v[di] / f.u[di]) * f.u[ax];
  return (f.a / 2) * Math.abs(g(f.wd)) + (f.b / 2) * Math.abs(g(f.hd));
}
/**
 * Sisi batang miring a→b yang ditemui ujung batang lurus: koordinat terjauh (sumbu `ax`, arah `dir`) dari bagian
 * batang miring yang ada di dalam kotak `box` (rentang [min, max] per sumbu x, y, z). Batang lurus dipotong rata
 * di koordinat ini supaya ujungnya menempel di muka batang miring tanpa menembusnya.
 */
function faceOf(a: P3, b: P3, tube: [number, number], ax: number, dir: 1 | -1, box: [number, number][]) {
  const { f, di, s, e } = slanted(a, b, tube);
  const lo = Math.min(s[di], e[di]);
  const hi = Math.max(s[di], e[di]);
  const ext = Math.max(f.a, f.b) * 3;
  const n = Math.ceil((f.len + 2 * ext) / 0.2);
  const G = 8;
  let best = dir > 0 ? -INF : INF;
  for (let i = 0; i <= n; i++) {
    const tt = -f.len / 2 - ext + ((f.len + 2 * ext) * i) / n;
    for (let j = 0; j <= G; j++)
      for (let k = 0; k <= G; k++) {
        const al = (f.a * (j / G - 0.5));
        const be = (f.b * (k / G - 0.5));
        const p = [0, 1, 2].map((q) => f.c[q] + f.u[q] * tt + f.wd[q] * al + f.hd[q] * be);
        if (p[di] < lo || p[di] > hi) continue;
        if (!p.every((v, q) => v >= box[q][0] && v <= box[q][1])) continue;
        best = dir > 0 ? Math.max(best, p[ax]) : Math.min(best, p[ax]);
      }
  }
  return Math.abs(best) >= INF ? NaN : best;
}

/**
 * Alat bermain anak (rumah, PAUD, taman). Bentuk rangka (param `model`):
 * - pikler: dua muka tangga miring bertemu di puncak (segitiga), anak tangga di kedua muka, engsel lipat di puncak
 * - dinding-panjat: rangka A tetap bertapak lantai, satu muka papan panjat, muka lain anak tangga
 * - piramida: 4 kaki miring dari sudut bertemu di satu puncak, cincin palang persegi mengecil ke atas
 * - jungle-gym: 4 tiang tegak, palang panjat bertingkat di keempat sisi, lantai setengah di tengah, kisi gantung di atas
 * - monkey-a: tangga mendatar di atas kepala, ditopang rangka A terpancung di kedua ujung yang berpalang panjat
 * - busur: dua rel tangga menekuk naik-datar-turun (busur segi), anak tangga di sepanjang rel, tapak melintang di ujung
 * - swedia: tangga tegak dibaut tembok, tangga mendatar menjulur dari pucuknya ke dua kaki depan
 * - perosotan: tangga miring di belakang, panggung kecil di dua tiang depan, papan luncur berpagar turun ke depan
 * - rumah-panggung: 4 tiang menerus sampai atap pelana, lantai panggung berpagar jeruji, tangga + perosotan
 * - playset: menara panggung tanpa atap + balok ayunan menjulur ke samping, ujungnya kaki A, perosotan di depan
 * - jungkit: balok panjang di atas poros, poros di dua kaki A pendek bertapak, dudukan & pegangan di kedua ujung
 * - titian: bingkai rel lantai, titian rendah di tengah, dua pegangan sejajar di tiang (parallel bar)
 * - komidi: satu poros di plat bundar, lantai bundar berputar di atas lengan + cincin, pegangan jari-jari di atas
 */
const MODELS = [
  { value: 'pikler', label: 'Segitiga pikler lipat', desc: 'Dua muka tangga bertemu di puncak, bisa dilipat' },
  { value: 'dinding-panjat', label: 'Dinding panjat rangka A', desc: 'Satu muka papan panjat, muka lain tangga' },
  { value: 'piramida', label: 'Piramida panjat', desc: '4 kaki bertemu di puncak, cincin palang' },
  { value: 'jungle-gym', label: 'Jungle gym kubus', desc: 'Palang panjat di 4 sisi + lantai tengah' },
  { value: 'monkey-a', label: 'Monkey bar kaki A', desc: 'Tangga gantung mendatar di atas kepala' },
  { value: 'busur', label: 'Busur panjat', desc: 'Tangga naik-datar-turun, dari balita sampai monkey bar' },
  { value: 'swedia', label: 'Tangga Swedia + monkey bar', desc: 'Tangga tembok + tangga gantung ke kaki depan' },
  { value: 'perosotan', label: 'Perosotan mandiri', desc: 'Tangga, panggung kecil, papan luncur' },
  { value: 'rumah-panggung', label: 'Rumah panggung + perosotan', desc: 'Panggung berpagar, atap pelana' },
  { value: 'playset', label: 'Menara + ayunan + perosotan', desc: 'Balok ayunan menjulur dari menara' },
  { value: 'jungkit', label: 'Jungkat-jungkit', desc: 'Balok berporos, dudukan di kedua ujung' },
  { value: 'titian', label: 'Titian berpegangan', desc: 'Titian rendah diapit dua pegangan' },
  { value: 'komidi', label: 'Komidi putar', desc: 'Lantai bundar berputar di satu poros' },
];
const KEYS = MODELS.map((m) => m.value);
const model = (p: Params) => {
  const m = str(p, 'model', 'pikler');
  return KEYS.includes(m) ? m : 'pikler';
};
const has = (...m: string[]) => (p: Params) => m.includes(model(p));

const LADDER = ['pikler', 'dinding-panjat', 'piramida', 'jungle-gym', 'monkey-a', 'busur', 'swedia', 'perosotan', 'rumah-panggung', 'playset'];
const CLIMB = ['pikler', 'dinding-panjat', 'piramida', 'jungle-gym', 'monkey-a', 'busur', 'swedia'];
const DECK = ['perosotan', 'rumah-panggung', 'playset'];
const USIA = [
  { value: '1-3', label: '1–3 tahun', desc: 'Balita, rumah / daycare' },
  { value: '3-6', label: '3–6 tahun', desc: 'TK / PAUD' },
  { value: '6-12', label: '6–12 tahun', desc: 'SD, taman umum' },
];
/** Batas tinggi aman (cm) per usia */
const CLIMB_MAX: Record<string, number> = { '1-3': 100, '3-6': 170, '6-12': 220 };
const DECK_MAX: Record<string, number> = { '1-3': 70, '3-6': 120, '6-12': 160 };
const PIVOT_MAX: Record<string, number> = { '1-3': 35, '3-6': 50, '6-12': 65 };
const RUNG_MAX: Record<string, number> = { '1-3': 25, '3-6': 30, '6-12': 30 };
const usia = (p: Params) => {
  const u = str(p, 'usia', '3-6');
  return u in CLIMB_MAX ? u : '3-6';
};
const DEG = Math.PI / 180;

export const ALAT_BERMAIN: ProductDef = {
  id: 'alat-bermain',
  name: 'Alat bermain anak',
  tagline: 'perosotan · monkey bar · pikler · jungkat-jungkit',
  icon: 'M6 36L14 8M22 36L14 8M8 28h10M10 20h7M14 8h12v6M26 14L50 34M48 36h8',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['model', 'panjang', 'lebar', 'dalam', 'tinggi'] },
    { id: 'bentuk', title: 'Tangga & luncur', keys: ['jarak', 'pagar', 'sudut', 'tinggiAyunan'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Pemakai', keys: ['usia'] },
  ],
  params: [
    { key: 'model', label: 'Bentuk rangka', type: 'choice', options: MODELS },
    {
      key: 'panjang',
      label: 'Panjang bentang',
      type: 'number',
      unit: 'cm',
      min: 60,
      max: 400,
      step: 1,
      help: 'Monkey bar & busur: panjang dari ujung ke ujung. Jungkat-jungkit: panjang balok. Titian: panjang pegangan. Ayunan: panjang balok ayunan dari menara.',
      marks: [{ value: 180, label: 'balita' }, { value: 240, label: 'umum' }, { value: 300, label: 'sekolah' }],
      showIf: has('monkey-a', 'busur', 'jungkit', 'titian', 'playset'),
    },
    {
      key: 'lebar',
      label: 'Lebar',
      type: 'number',
      unit: 'cm',
      min: 30,
      max: 220,
      step: 1,
      help: 'Lebar tangga / panggung / papan luncur. Piramida & komidi: lebar alas. Monkey bar: jarak dua rel tangga gantung.',
      marks: [{ value: 50, label: 'luncur' }, { value: 80, label: 'pikler' }, { value: 120, label: 'panggung' }],
      showIf: (p) => model(p) !== 'jungkit',
    },
    {
      key: 'dalam',
      label: 'Kedalaman',
      type: 'number',
      unit: 'cm',
      min: 30,
      max: 260,
      step: 1,
      help: 'Rangka A: lebar kaki di lantai. Panggung: dalam lantai panggung. Tangga Swedia: seberapa jauh tangga gantung menjorok dari tembok. Jungkit: panjang tapak.',
      marks: [{ value: 60, label: 'kecil' }, { value: 120, label: 'panggung' }],
      showIf: has('pikler', 'dinding-panjat', 'jungle-gym', 'monkey-a', 'swedia', 'perosotan', 'rumah-panggung', 'playset', 'jungkit'),
    },
    {
      key: 'tinggi',
      label: 'Tinggi',
      type: 'number',
      unit: 'cm',
      min: 25,
      max: 250,
      step: 1,
      help: 'Panjat: tinggi puncak (= tinggi jatuh). Perosotan & panggung: tinggi lantai panggung. Jungkit: tinggi poros. Titian: tinggi pegangan. Komidi: tinggi lantai putar.',
      marks: [{ value: 75, label: 'balita' }, { value: 120, label: 'TK' }, { value: 180, label: 'SD' }],
    },
    {
      key: 'jarak',
      label: 'Jarak anak tangga',
      type: 'number',
      unit: 'cm',
      min: 15,
      max: 35,
      step: 1,
      help: 'Jarak antar palang panjat. Balita 20–25 cm, anak besar 25–30 cm.',
      marks: [{ value: 22, label: 'balita' }, { value: 28, label: 'anak' }],
      showIf: has(...LADDER),
    },
    {
      key: 'pagar',
      label: 'Tinggi pagar panggung',
      type: 'number',
      unit: 'cm',
      min: 30,
      max: 100,
      step: 1,
      help: 'Pagar keliling lantai panggung supaya anak tidak jatuh.',
      marks: [{ value: 70, label: 'aman' }],
      showIf: has(...DECK),
    },
    {
      key: 'sudut',
      label: 'Kemiringan papan luncur',
      type: 'number',
      unit: '°',
      min: 20,
      max: 45,
      step: 1,
      help: 'Makin miring makin kencang. Aman untuk anak: 25–35°.',
      marks: [{ value: 30, label: 'aman' }],
      showIf: has(...DECK),
    },
    {
      key: 'tinggiAyunan',
      label: 'Tinggi balok ayunan',
      type: 'number',
      unit: 'cm',
      min: 150,
      max: 260,
      step: 1,
      marks: [{ value: 200, label: 'TK' }, { value: 240, label: 'SD' }],
      showIf: has('playset'),
    },
    ...materialParams(true),
    { key: 'usia', label: 'Usia anak', type: 'choice', options: USIA, help: 'Menentukan batas tinggi aman dan jarak anak tangga.' },
  ],
  defaults: {
    model: 'pikler',
    usia: '1-3',
    panjang: 240,
    lebar: 80,
    dalam: 70,
    tinggi: 75,
    jarak: 22,
    pagar: 70,
    sudut: 30,
    tinggiAyunan: 200,
    pipa: '30',
    papan: 'kayu',
    warna: '#1f2226',
  },
  groups: [
    { id: 'panjat', name: 'Panjat & gantung', desc: 'Piramida panjat, monkey bar, busur panjat, tangga Swedia' },
    { id: 'luncur', name: 'Perosotan', desc: 'Perosotan mandiri, rumah panggung, menara + ayunan' },
    { id: 'jungkit', name: 'Jungkit & keseimbangan', desc: 'Jungkat-jungkit, titian berpegangan, komidi putar' },
  ],
  signature: (p) => `alat-bermain:${model(p)}`,
  presets: [
    {
      id: 'piramida',
      group: 'panjat',
      name: 'Piramida panjat',
      desc: '4 kaki miring dari sudut bertemu di satu puncak, cincin palang persegi mengecil ke atas',
      params: { model: 'piramida', usia: '3-6', lebar: 150, tinggi: 150, jarak: 28 },
      sizes: [
        { label: 'Kecil', desc: 'alas 120, tinggi 110 cm', params: { lebar: 120, tinggi: 110 } },
        { label: 'TK', desc: 'alas 150, tinggi 150 cm', params: { lebar: 150, tinggi: 150 } },
        { label: 'Taman', desc: 'alas 200, tinggi 200 cm', params: { usia: '6-12', lebar: 200, tinggi: 200, jarak: 30 } },
      ],
    },
    {
      id: 'monkey-a',
      group: 'panjat',
      name: 'Monkey bar kaki A',
      desc: 'tangga mendatar di atas kepala, ditopang rangka A terpancung berpalang panjat di kedua ujung',
      params: { model: 'monkey-a', usia: '6-12', panjang: 240, lebar: 45, dalam: 140, tinggi: 190, jarak: 30 },
      sizes: [
        { label: 'TK', desc: 'bentang 200, tinggi 165 cm', params: { usia: '3-6', panjang: 200, lebar: 40, dalam: 120, tinggi: 165, jarak: 28 } },
        { label: 'Rumah', desc: 'bentang 240, tinggi 190 cm', params: { panjang: 240, tinggi: 190 } },
        { label: 'Sekolah', desc: 'bentang 300, tinggi 200 cm', params: { panjang: 300, lebar: 50, dalam: 160, tinggi: 200 } },
      ],
    },
    {
      id: 'busur',
      group: 'panjat',
      name: 'Busur panjat',
      desc: 'dua rel tangga menekuk naik-datar-turun, anak tangga di sepanjang rel, tapak melintang di ujung',
      params: { model: 'busur', usia: '3-6', panjang: 180, lebar: 60, tinggi: 120, jarak: 28 },
      sizes: [
        { label: 'Busur balita', desc: '90 × 45, tinggi 45 cm', params: { usia: '1-3', panjang: 90, lebar: 45, tinggi: 45, jarak: 20 } },
        { label: 'TK', desc: '180 × 60, tinggi 120 cm', params: { panjang: 180, lebar: 60, tinggi: 120 } },
        { label: 'Monkey busur', desc: '300 × 60, tinggi 180 cm', params: { usia: '6-12', panjang: 300, lebar: 60, tinggi: 180, jarak: 30 } },
      ],
    },
    {
      id: 'swedia',
      group: 'panjat',
      name: 'Tangga Swedia + monkey bar',
      desc: 'tangga tegak dibaut tembok, tangga mendatar menjulur dari pucuknya ke dua kaki depan',
      params: { model: 'swedia', usia: '6-12', lebar: 80, dalam: 150, tinggi: 210, jarak: 25 },
      sizes: [
        { label: 'Kamar anak', desc: '70 × 120, tinggi 170 cm', params: { usia: '3-6', lebar: 70, dalam: 120, tinggi: 170, jarak: 25 } },
        { label: 'Rumah', desc: '80 × 150, tinggi 210 cm', params: { lebar: 80, dalam: 150, tinggi: 210 } },
        { label: 'Ruang senam', desc: '90 × 200, tinggi 220 cm', params: { lebar: 90, dalam: 200, tinggi: 220, jarak: 28 } },
      ],
    },
    {
      id: 'perosotan',
      group: 'luncur',
      name: 'Perosotan mandiri',
      desc: 'tangga miring di belakang, panggung kecil di dua tiang depan, papan luncur berpagar turun ke depan',
      params: { model: 'perosotan', usia: '3-6', lebar: 50, dalam: 50, tinggi: 100, sudut: 30, pagar: 70, jarak: 25 },
      sizes: [
        { label: 'Balita', desc: 'panggung 60 cm', params: { usia: '1-3', lebar: 45, dalam: 40, tinggi: 60, pagar: 60, jarak: 22 } },
        { label: 'TK', desc: 'panggung 100 cm', params: { lebar: 50, tinggi: 100 } },
        { label: 'SD', desc: 'panggung 150 cm', params: { usia: '6-12', lebar: 60, dalam: 60, tinggi: 150, sudut: 32, jarak: 28 } },
      ],
    },
    {
      id: 'rumah-panggung',
      group: 'luncur',
      name: 'Rumah panggung + perosotan',
      desc: '4 tiang menerus sampai atap pelana, lantai panggung berpagar jeruji, tangga di belakang, perosotan di depan',
      params: { model: 'rumah-panggung', usia: '3-6', lebar: 120, dalam: 120, tinggi: 100, pagar: 70, sudut: 30, jarak: 25 },
      sizes: [
        { label: 'Balita', desc: '100 × 100, panggung 70 cm', params: { usia: '1-3', lebar: 100, dalam: 100, tinggi: 70, pagar: 60, jarak: 22 } },
        { label: 'Halaman rumah', desc: '120 × 120, panggung 100 cm', params: { lebar: 120, dalam: 120, tinggi: 100 } },
        { label: 'PAUD', desc: '150 × 150, panggung 120 cm', params: { lebar: 150, dalam: 150, tinggi: 120 } },
      ],
    },
    {
      id: 'playset',
      group: 'luncur',
      name: 'Menara + ayunan + perosotan',
      desc: 'menara panggung tanpa atap, balok ayunan menjulur ke samping dengan kaki A di ujung, perosotan di depan',
      params: { model: 'playset', usia: '3-6', lebar: 100, dalam: 100, tinggi: 100, pagar: 70, sudut: 30, panjang: 200, tinggiAyunan: 210, jarak: 25 },
      sizes: [
        { label: '1 ayunan', desc: 'balok 140 cm', params: { panjang: 140 } },
        { label: '2 ayunan', desc: 'balok 220 cm', params: { panjang: 220 } },
        { label: 'Taman SD', desc: 'panggung 140, balok 260 cm', params: { usia: '6-12', lebar: 120, dalam: 120, tinggi: 140, panjang: 260, tinggiAyunan: 240, jarak: 28 } },
      ],
    },
    {
      id: 'jungkit',
      group: 'jungkit',
      name: 'Jungkat-jungkit',
      desc: 'balok panjang di atas poros, poros di dua kaki A pendek bertapak, dudukan & pegangan di kedua ujung',
      params: { model: 'jungkit', usia: '3-6', panjang: 240, dalam: 60, tinggi: 45 },
      sizes: [
        { label: 'Balita', desc: 'balok 180, poros 35 cm', params: { usia: '1-3', panjang: 180, dalam: 50, tinggi: 35 } },
        { label: 'TK', desc: 'balok 240, poros 45 cm', params: { panjang: 240, tinggi: 45 } },
        { label: 'SD', desc: 'balok 300, poros 60 cm', params: { usia: '6-12', panjang: 300, dalam: 70, tinggi: 60 } },
      ],
    },
    {
      id: 'titian',
      group: 'jungkit',
      name: 'Titian berpegangan',
      desc: 'bingkai rel lantai, titian rendah di tengah, dua pegangan sejajar di atas tiang',
      params: { model: 'titian', usia: '3-6', panjang: 200, lebar: 60, tinggi: 70 },
      sizes: [
        { label: 'Balita / terapi', desc: '150 × 50, pegangan 55 cm', params: { usia: '1-3', panjang: 150, lebar: 50, tinggi: 55 } },
        { label: 'TK', desc: '200 × 60, pegangan 70 cm', params: { panjang: 200, lebar: 60, tinggi: 70 } },
        { label: 'SD', desc: '300 × 70, pegangan 90 cm', params: { usia: '6-12', panjang: 300, lebar: 70, tinggi: 90 } },
      ],
    },
    {
      id: 'komidi',
      group: 'jungkit',
      name: 'Komidi putar',
      desc: 'satu poros di plat bundar, lantai bundar berputar di atas lengan + cincin, pegangan jari-jari di atas',
      params: { model: 'komidi', usia: '3-6', lebar: 140, tinggi: 30 },
      sizes: [
        { label: 'Kecil', desc: 'diameter 100 cm', params: { lebar: 100, tinggi: 25 } },
        { label: 'TK', desc: 'diameter 140 cm', params: { lebar: 140, tinggi: 30 } },
        { label: 'Taman', desc: 'diameter 180 cm', params: { usia: '6-12', lebar: 180, tinggi: 40 } },
      ],
    },
  ],
  summary: (p) => {
    const m = model(p);
    const u = `usia ${usia(p)} th`;
    if (m === 'jungkit') return `balok ${num(p, 'panjang')} cm · poros ${num(p, 'tinggi')} cm · ${u}`;
    if (m === 'komidi') return `Ø ${num(p, 'lebar')} cm · ${u}`;
    if (DECK.includes(m)) return `panggung ${num(p, 'tinggi')} cm · luncur ${num(p, 'sudut')}° · ${u}`;
    if (['monkey-a', 'busur', 'titian'].includes(m)) return `${num(p, 'panjang')} × ${num(p, 'tinggi')} cm · ${u}`;
    return `${num(p, 'lebar')} × ${num(p, 'tinggi')} cm · ${u}`;
  },

  build: (p) => {
    const m = model(p);
    const L = (parseInt(str(p, 'pipa', '30')) || 30) / 10;
    const b = BOARD_THICK[str(p, 'papan', 'kayu')] ?? 2.5;
    const t: [number, number] = [L * 10, L * 10];
    const rail: [number, number] = [20, 20];
    const thin: [number, number] = [15, 15];
    const J = Math.max(15, Math.min(35, num(p, 'jarak', 25)));
    const { list, add, line } = memberFactory();
    const boards: Board[] = [];
    const hinges: FrameHinge[] = [];
    let W = num(p, 'lebar', 80);
    let D = num(p, 'dalam', 70);
    let H = num(p, 'tinggi', 75);
    let wall = false;

    /** Tinggi anak tangga dari y0 sampai y1 dengan jarak J */
    const levels = (y0: number, y1: number) => {
      const out: number[] = [];
      for (let y = y0; y <= y1 + 0.01; y += J) out.push(r1(y));
      return out;
    };
    /** Papan miring di atas batang dari (za, ya) ke (zb, yb), za < zb */
    const slopeBoard = (id: string, label: string, x0: number, x1: number, za: number, ya: number, zb: number, yb: number, lift = L) => {
      if (b <= 0) return;
      const ang = Math.atan2(ya - yb, zb - za);
      const len = Math.hypot(zb - za, yb - ya);
      const zm = (za + zb) / 2;
      const off = lift / 2 + b / 2; // tegak lurus papan
      const yc = (ya + yb) / 2 + off * Math.cos(ang);
      const zc = zm + off * Math.sin(ang);
      boards.push({ ...board(id, label, x0, x1, yc - b / 2, yc + b / 2, zc - len / 2, zc + len / 2), rotX: r1(ang / DEG) });
    };
    /**
     * Papan luncur dari panggung turun ke depan, rel samping di xa & xb. `z0` = as rangka panggung / tiang depan:
     * rel miring dipotong rata dan menempel di muka depannya (z0 + L/2), ujung bawahnya duduk di atas rel datar,
     * pagar luncur menempel di muka depan tiang dan berakhir di atas tiang pagar ujung.
     */
    const slide = (xa: number, xb: number, z0: number, yTop: number, yPagar: number) => {
      const ang = Math.max(20, Math.min(45, num(p, 'sudut', 30))) * DEG;
      const yE = 25;
      const run = (yTop - yE) / Math.tan(ang);
      const z1 = z0 + run;
      const out = 35;
      const zf = z0 + L / 2; // muka depan rangka panggung / tiang depan
      const yLow = yE + L / 2; // ujung bawah rel miring = sisi atas rel datar
      const zLow = z1 - L / 2 / Math.tan(ang);
      let zs = zf + L;
      for (let k = 0; k < 3; k++) zs = zf + footHalf([xa, yTop, zs], [xa, yLow, zLow], t, 2);
      const fl = footHalf([xa, yTop, zs], [xa, yLow, zLow], t, 2);
      const zd0 = zLow - fl; // rel datar mulai tepat di tumit rel miring
      const zt = zLow + fl + rail[0] / 20; // tiang pagar ujung di depan kaki rel miring
      const yPe = yE + 25;
      let zps = zf + 1;
      for (let k = 0; k < 3; k++) zps = zf + footHalf([xa, yPagar, zps], [xa, yPe, zt], rail, 2);
      [xa, xb].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        line(`luncur-rel-${nm}`, [x, yTop, zs], [x, yLow, zLow], 'rail-z', `Rel papan luncur ${nm} (miring)`, t);
        add(`luncur-datar-${nm}`, 'z', x, yE, zd0, z1 + out - zd0, 'rail-z', `Rel ujung luncur ${nm} (datar)`, t);
        add(`luncur-kaki-${nm}`, 'y', x, 0, z1 + out - L / 2, yE - L / 2, 'post', `Kaki ujung luncur ${nm}`, t);
        line(`luncur-pagar-${nm}`, [x, yPagar, zps], [x, yPe, zt], 'custom', `Pagar papan luncur ${nm}`, rail);
        add(`luncur-pagar-ujung-${nm}`, 'y', x, yE + L / 2, zt, 25 - L / 2, 'custom', `Tiang pagar ujung luncur ${nm}`, rail);
      });
      [0.35, 0.7].forEach((f, k) => {
        add(`luncur-silang-${k + 1}`, 'x', xa + L / 2, yTop - (yTop - yLow) * f, zs + (zLow - zs) * f, xb - xa - L, 'rail-x', `Palang bawah papan luncur ${k + 1}`, rail);
      });
      add('luncur-silang-ujung', 'x', xa + L / 2, yE, z1 + out - L / 2, xb - xa - L, 'rail-x', 'Palang ujung luncur', rail);
      slopeBoard('papan-luncur', 'Papan luncur', xa - L / 2, xb + L / 2, zs, yTop, zLow, yLow);
      if (b > 0) boards.push(board('papan-luncur-ujung', 'Papan ujung luncur (datar)', xa - L / 2, xb + L / 2, yE + L / 2, yE + L / 2 + b, zLow, z1 + out));
      return z1 + out;
    };
    /**
     * Tangga miring dari lantai (zBot) naik ke (zTop, yTop), rel di xa & xb. Bila `faceZ` diisi, ujung atas rel
     * dipotong rata dan menempel di muka belakang rangka panggung (z = faceZ), tidak masuk ke dalamnya.
     */
    const ladder = (id: string, nm: string, xa: number, xb: number, zBot: number, zTop: number, yTop: number, faceZ?: number) => {
      if (faceZ !== undefined) {
        zTop = faceZ - L / 2;
        for (let k = 0; k < 3; k++) zTop = faceZ - footHalf([xa, 0, zBot], [xa, yTop, zTop], t, 2);
      }
      [xa, xb].forEach((x, i) => line(`${id}-rel-${i ? 'kanan' : 'kiri'}`, [x, 0, zBot], [x, yTop, zTop], 'post', `Ibu ${nm} ${i ? 'kanan' : 'kiri'} (miring)`, t));
      levels(J, yTop - J * 0.5).forEach((y, k) => add(`${id}-anak-${k + 1}`, 'x', xa + L / 2, y, zBot + ((zTop - zBot) * y) / yTop, xb - xa - L, 'rail-x', `Anak ${nm} ${k + 1}`, t));
    };
    /** Cincin palang mendatar di as tiang (sudut diisi tiang: keempat palang berhenti di sisi tiang) */
    const ring = (id: string, nm: string, x0: number, x1: number, z0: number, z1: number, y: number, tube: [number, number]) => {
      add(`${id}-depan`, 'x', x0 + L / 2, y, z1, x1 - x0 - L, 'rail-x', `${nm} depan`, tube);
      add(`${id}-belakang`, 'x', x0 + L / 2, y, z0, x1 - x0 - L, 'rail-x', `${nm} belakang`, tube);
      add(`${id}-kiri`, 'z', x0, y, z0 + L / 2, z1 - z0 - L, 'rail-z', `${nm} kiri`, tube);
      add(`${id}-kanan`, 'z', x1, y, z0 + L / 2, z1 - z0 - L, 'rail-z', `${nm} kanan`, tube);
    };
    /** Cincin tertutup tanpa tiang sudut: palang depan & belakang menerus, palang kiri & kanan di antaranya */
    const closedRing = (id: string, nm: string, x0: number, x1: number, z0: number, z1: number, y: number, tube: [number, number]) => {
      const h = tube[0] / 20;
      add(`${id}-depan`, 'x', x0 - h, y, z1, x1 - x0 + 2 * h, 'rail-x', `${nm} depan`, tube);
      add(`${id}-belakang`, 'x', x0 - h, y, z0, x1 - x0 + 2 * h, 'rail-x', `${nm} belakang`, tube);
      add(`${id}-kiri`, 'z', x0, y, z0 + h, z1 - z0 - 2 * h, 'rail-z', `${nm} kiri`, tube);
      add(`${id}-kanan`, 'z', x1, y, z0 + h, z1 - z0 - 2 * h, 'rail-z', `${nm} kanan`, tube);
    };

    if (m === 'pikler' || m === 'dinding-panjat') {
      const zc = D / 2;
      const yA = H - L / 2;
      const zb = (y: number) => L / 2 + ((zc - L / 2) * y) / yA;
      const xs = [L / 2, W - L / 2];
      xs.forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        line(`kaki-${nm}-b`, [x, 0, L / 2], [x, yA, zc], 'post', `Ibu tangga ${nm} belakang (miring)`, t);
        line(`kaki-${nm}-d`, [x, yA, zc], [x, 0, D - L / 2], 'post', `Ibu ${m === 'pikler' ? 'tangga' : 'papan panjat'} ${nm} depan (miring)`, t);
      });
      add('puncak', 'x', 0, yA, zc, W, 'rail-x', 'Palang puncak (pegangan)', t);
      levels(m === 'pikler' ? J * 0.8 : J, yA - J * 0.6).forEach((y, k) => {
        add(`anak-b-${k + 1}`, 'x', L, y, zb(y), W - 2 * L, 'rail-x', `Anak tangga belakang ${k + 1}`, t);
        if (m === 'pikler') add(`anak-d-${k + 1}`, 'x', L, y, D - zb(y), W - 2 * L, 'rail-x', `Anak tangga depan ${k + 1}`, t);
      });
      if (m === 'pikler') {
        xs.forEach((_, i) => {
          const nm = i ? 'kanan' : 'kiri';
          hinges.push({ id: `engsel-puncak-${nm}`, memberId: `kaki-${nm}-d`, type: 'folding-lock', pos: 0, side: 'end', foldAxis: 'z', foldSign: -1, carry: true, label: `Engsel puncak ${nm} (dilipat rapat)` });
        });
      } else {
        // muka depan: palang penguat papan panjat + tapak lantai kiri-kanan (rangka tetap)
        const ys = [0.12, 0.45, 0.78].map((f) => r1(yA * f));
        ys.forEach((y, k) => add(`penguat-papan-${k + 1}`, 'x', L, y, D - zb(y), W - 2 * L, 'rail-x', `Palang penguat papan panjat ${k + 1}`, t));
        xs.forEach((x, i) => add(`tapak-${i ? 'kanan' : 'kiri'}`, 'z', x, L / 2, 0, D, 'rail-z', `Tapak lantai ${i ? 'kanan' : 'kiri'}`, t));
        const y0 = yA * 0.06;
        const y1 = yA * 0.94;
        slopeBoard('papan-panjat', 'Papan panjat (pegangan panjat dibaut)', L / 2, W - L / 2, D - zb(y1), y1, D - zb(y0), y0);
      }
    } else if (m === 'piramida') {
      // Kaki miring berdiri di atas sudut tapak lantai dan berhenti di bawah sudut cincin puncak kecil
      // (bukan bertemu di satu titik). Palang cincin panjat dipotong per sisi, ujungnya rata di muka kaki miring.
      const S = W;
      D = S;
      const g = Math.max(1.5 * L, 5); // setengah bentang as cincin puncak
      const yBot = L;
      const yTop = H - L / 2;
      const cT = S / 2 - g;
      const c = (y: number) => L / 2 + ((cT - L / 2) * (y - yBot)) / (yTop - yBot);
      const legs: [P3, P3][] = [[L / 2, L / 2], [S - L / 2, L / 2], [L / 2, S - L / 2], [S - L / 2, S - L / 2]].map(([x, z]) => [
        [x, yBot, z],
        [x < S / 2 ? cT : S - cT, yTop, z < S / 2 ? cT : S - cT],
      ]);
      legs.forEach(([a0, a1], k) => line(`kaki-${k + 1}`, a0, a1, 'post', `Kaki miring ${k + 1}`, t));
      closedRing('tapak', 'Tapak lantai', L / 2, S - L / 2, L / 2, S - L / 2, L / 2, t);
      closedRing('puncak', 'Cincin puncak', cT, S - cT, cT, S - cT, H, t);
      levels(J, H - 25).forEach((y, k) => {
        const cy = c(y);
        if (S - 2 * cy < 20) return;
        const yb: [number, number] = [y - L / 2, y + L / 2];
        const sides: [string, 'x' | 'z', number, number, number][] = [
          ['belakang', 'x', cy, 0, 1],
          ['depan', 'x', S - cy, 2, 3],
          ['kiri', 'z', cy, 0, 2],
          ['kanan', 'z', S - cy, 1, 3],
        ];
        sides.forEach(([nm, ax, fix, i0, i1]) => {
          const ai = ax === 'x' ? 0 : 2;
          const band: [number, number] = [fix - L / 2, fix + L / 2];
          const box = (lo: number, hi: number) => (ai === 0 ? [[lo, hi], yb, band] : [band, yb, [lo, hi]]) as [number, number][];
          const s0 = faceOf(legs[i0][0], legs[i0][1], t, ai, 1, box(-INF, S / 2));
          const s1 = faceOf(legs[i1][0], legs[i1][1], t, ai, -1, box(S / 2, INF));
          if (!(s1 - s0 > 1)) return;
          if (ax === 'x') add(`cincin-${k + 1}-${nm}`, 'x', s0, y, fix, s1 - s0, 'rail-x', `Cincin panjat ${k + 1} ${nm}`, t);
          else add(`cincin-${k + 1}-${nm}`, 'z', fix, y, s0, s1 - s0, 'rail-z', `Cincin panjat ${k + 1} ${nm}`, t);
        });
      });
      H = H + L / 2;
    } else if (m === 'jungle-gym') {
      const xs = [L / 2, W - L / 2];
      const zs = [L / 2, D - L / 2];
      xs.forEach((x, i) => zs.forEach((z, j) => add(`tiang-${i}-${j}`, 'y', x, 0, z, H, 'post', `Tiang ${i ? 'kanan' : 'kiri'} ${j ? 'depan' : 'belakang'}`, t)));
      const yT = H - L / 2;
      const ys = levels(J, yT - J * 0.6);
      ys.forEach((y, k) => ring(`palang-${k + 1}`, `Palang panjat ${k + 1}`, xs[0], xs[1], zs[0], zs[1], y, t));
      ring('atas', 'Palang atas', xs[0], xs[1], zs[0], zs[1], yT, t);
      const nk = Math.max(1, Math.floor((D - 2 * L) / 30));
      for (let k = 1; k <= nk; k++) {
        const z = L / 2 + ((D - L) * k) / (nk + 1);
        add(`kisi-${k}`, 'x', L, yT, z, W - 2 * L, 'custom', `Palang gantung atas ${k}`, t);
      }
      // lantai setengah di tingkat palang yang paling dekat setengah tinggi
      const yl = ys.length ? ys.reduce((a, y) => (Math.abs(y - H / 2) < Math.abs(a - H / 2) ? y : a), ys[0]) : H / 2;
      add('lantai-dudukan', 'x', L, yl, D * 0.55, W - 2 * L, 'rail-x', 'Palang dudukan lantai tengah', t);
      if (b > 0) boards.push(board('lantai-tengah', 'Lantai tengah (setengah)', L, W - L, yl + L / 2, yl + L / 2 + b, L, D * 0.55 + L / 2));
    } else if (m === 'monkey-a') {
      // Kaki A berhenti di sisi bawah kepala; rel gantung duduk di atas kepala. Palang panjat dipotong rata
      // di muka dalam kedua kaki; siku penguat dilas di samping kaki dan ujung atasnya rata di bawah rel.
      W = num(p, 'panjang', 240);
      const lw = Math.max(30, Math.min(80, num(p, 'lebar', 45)));
      const zc = D / 2;
      const yT = H - L * 1.5;
      const yR = H - L / 2;
      const yLeg = yT - L / 2;
      const zk = (y: number) => L / 2 + ((zc - lw / 2 - L / 2) * y) / yLeg;
      [L / 2, W - L / 2].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        const s = i ? -1 : 1;
        const kb: [P3, P3] = [[x, 0, L / 2], [x, yLeg, zc - lw / 2]];
        const kd: [P3, P3] = [[x, 0, D - L / 2], [x, yLeg, zc + lw / 2]];
        line(`kaki-${nm}-b`, kb[0], kb[1], 'post', `Kaki ${nm} belakang (miring)`, t);
        line(`kaki-${nm}-d`, kd[0], kd[1], 'post', `Kaki ${nm} depan (miring)`, t);
        add(`kepala-${nm}`, 'z', x, yT, zc - lw / 2 - L / 2, lw + L, 'rail-z', `Kepala rangka A ${nm}`, t);
        levels(J, yT - J * 0.7).forEach((y, k) => {
          const bx: [number, number] = [x - L / 2, x + L / 2];
          const yb: [number, number] = [y - L / 2, y + L / 2];
          const z0 = faceOf(kb[0], kb[1], t, 2, 1, [bx, yb, [-INF, zc]]);
          const z1 = faceOf(kd[0], kd[1], t, 2, -1, [bx, yb, [zc, INF]]);
          add(`panjat-${nm}-${k + 1}`, 'z', x, y, z0, z1 - z0, 'rail-z', `Palang panjat ujung ${nm} ${k + 1}`, t);
        });
        [-1, 1].forEach((sz, j) => {
          const yb = yT - 40;
          const zl = sz < 0 ? zk(yb) : D - zk(yb);
          const top: P3 = [x + s * 40, yR - L / 2, zc + (sz * lw) / 2];
          let xs0 = x + s * L;
          for (let q = 0; q < 3; q++) xs0 = x + s * (L / 2 + footHalf([xs0, yb, zl], top, rail, 0));
          line(`siku-${nm}-${j}`, [xs0, yb, zl], top, 'custom', `Siku penguat ${nm} ${j ? 'depan' : 'belakang'}`, rail);
        });
      });
      [-1, 1].forEach((sz, j) => add(`rel-gantung-${j ? 'depan' : 'belakang'}`, 'x', 0, yR, zc + (sz * lw) / 2, W, 'rail-x', `Rel tangga gantung ${j ? 'depan' : 'belakang'}`, t));
      for (let x = L + J * 0.6, k = 1; x <= W - L - J * 0.3; x += J, k++)
        add(`gantung-${k}`, 'z', r1(x), yR, zc - lw / 2 + L / 2, lw - L, 'rail-z', `Anak tangga gantung ${k}`, t);
    } else if (m === 'busur') {
      W = num(p, 'panjang', 180);
      const lw = num(p, 'lebar', 60);
      const ext = H > 100 ? 15 : 0;
      D = lw + 2 * ext;
      const a = W * 0.3;
      // Rel naik berdiri di atas tapak melintang dan berhenti rata di sisi bawah rel datar atas;
      // rel datar menerus sampai menutup tapak potongan kedua rel naik.
      const pts: [number, number][] = [[L / 2, L], [a, H - L / 2], [W - a, H - L / 2], [W - L / 2, L]];
      const zs = [ext + L / 2, ext + lw - L / 2];
      const fr = (H - L - pts[0][1]) / (pts[1][1] - pts[0][1]);
      const xk = pts[0][0] + (pts[1][0] - pts[0][0]) * fr; // as rel naik di sisi bawah rel datar
      zs.forEach((z, i) => {
        const nm = i ? 'depan' : 'belakang';
        const fh = footHalf([pts[0][0], pts[0][1], z], [xk, H - L, z], t, 0);
        line(`rel-${nm}-1`, [pts[0][0], pts[0][1], z], [xk, H - L, z], 'post', `Rel busur ${nm} ruas 1`, t);
        add(`rel-${nm}-2`, 'x', xk - fh, H - L / 2, z, W - 2 * xk + 2 * fh, 'rail-x', `Rel busur ${nm} ruas 2`, t);
        line(`rel-${nm}-3`, [W - xk, H - L, z], [pts[3][0], pts[3][1], z], 'post', `Rel busur ${nm} ruas 3`, t);
      });
      const segs = [0, 1, 2].map((k) => Math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1]));
      const total = segs.reduce((s, v) => s + v, 0);
      let k = 0;
      for (let s = J * 0.8; s <= total - J * 0.5; s += J) {
        let rest = s;
        let i = 0;
        while (i < 2 && rest > segs[i]) rest -= segs[i++];
        const f = rest / segs[i];
        const x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f;
        const y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f;
        if (y < 12) continue;
        k++;
        add(`anak-${k}`, 'z', x, y, zs[0] + L / 2, lw - 2 * L, 'rail-z', `Anak tangga busur ${k}`, t);
      }
      [L / 2, W - L / 2].forEach((x, i) => add(`tapak-${i ? 'kanan' : 'kiri'}`, 'z', x, L / 2, 0, D, 'rail-z', `Tapak melintang ${i ? 'kanan' : 'kiri'}`, t));
    } else if (m === 'swedia') {
      wall = true;
      const xs = [L / 2, W - L / 2];
      const yT = H - L / 2;
      xs.forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        add(`ibu-tembok-${nm}`, 'y', x, 0, L / 2, H - L, 'post', `Ibu tangga tembok ${nm} (dibaut)`, t);
        add(`rel-gantung-${nm}`, 'z', x, yT, 0, D, 'rail-z', `Rel tangga gantung ${nm}`, t);
        add(`kaki-depan-${nm}`, 'y', x, 0, D - L / 2, H - L, 'post', `Kaki depan ${nm}`, t);
        // siku: ujung bawah menempel di muka tiang, ujung atas rata di sisi bawah rel gantung
        let zw = L * 1.5;
        let zd = D - L * 1.5;
        for (let q = 0; q < 3; q++) {
          zw = L + footHalf([x, yT - 45, zw], [x, yT - L / 2, 45], rail, 2);
          zd = D - L - footHalf([x, yT - 45, zd], [x, yT - L / 2, D - 45], rail, 2);
        }
        line(`siku-tembok-${nm}`, [x, yT - 45, zw], [x, yT - L / 2, 45], 'custom', `Siku tembok ${nm}`, rail);
        line(`siku-depan-${nm}`, [x, yT - 45, zd], [x, yT - L / 2, D - 45], 'custom', `Siku kaki depan ${nm}`, rail);
      });
      levels(J * 0.6, yT - J * 0.6).forEach((y, k) => add(`anak-tembok-${k + 1}`, 'x', L, y, L / 2, W - 2 * L, 'rail-x', `Anak tangga tembok ${k + 1}`, t));
      for (let z = L + J * 0.6, k = 1; z <= D - L - J * 0.3; z += J, k++) add(`anak-gantung-${k}`, 'x', L, yT, r1(z), W - 2 * L, 'rail-x', `Anak tangga gantung ${k}`, t);
      add('palang-depan-bawah', 'x', L, 25, D - L / 2, W - 2 * L, 'rail-x', 'Palang kaki depan bawah', t);
    } else if (m === 'perosotan') {
      const Hp = H;
      const P = D;
      const pg = num(p, 'pagar', 70);
      const r = Hp * 0.36;
      const z0 = L / 2;
      const zp0 = z0 + r;
      const zp1 = zp0 + P;
      const xs = [L / 2, W - L / 2];
      const yR = Hp - L / 2;
      ladder('tangga', 'tangga', xs[0], xs[1], z0, zp0, yR);
      xs.forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        add(`pegangan-tangga-${nm}`, 'y', x, yR, zp0, pg + L / 2, 'post', `Pegangan tangga ${nm}`, t);
        add(`tiang-depan-${nm}`, 'y', x, 0, zp1, Hp + pg, 'post', `Tiang depan ${nm}`, t);
        add(`pagar-atas-${nm}`, 'z', x, Hp + pg - L / 2, zp0 + L / 2, P - L, 'rail-z', `Pagar panggung atas ${nm}`, t);
        add(`pagar-tengah-${nm}`, 'z', x, Hp + pg / 2, zp0 + L / 2, P - L, 'rail-z', `Pagar panggung tengah ${nm}`, rail);
      });
      ring('panggung', 'Rangka panggung', xs[0], xs[1], zp0, zp1, yR, t);
      if (b > 0) boards.push(board('lantai-panggung', 'Lantai panggung', L, W - L, Hp, Hp + b, zp0 - L / 2, zp1 - L / 2));
      D = slide(xs[0], xs[1], zp1, yR, Hp + pg * 0.6) + L / 2;
      H = Hp + pg;
    } else if (m === 'rumah-panggung' || m === 'playset') {
      const S = W;
      const P = D;
      const Hp = H;
      const pg = num(p, 'pagar', 70);
      const r = Hp * 0.36;
      const yB = Math.max(Hp + pg + 30, num(p, 'tinggiAyunan', 200));
      const sp = Math.max(60, yB * 0.4);
      const off = m === 'playset' ? Math.max(0, sp + L / 2 - (L / 2 + r + P / 2)) : 0;
      const z0 = off + L / 2;
      const zp0 = z0 + r;
      const zp1 = zp0 + P;
      const zc = (zp0 + zp1) / 2;
      const xs = [L / 2, S - L / 2];
      const lw = Math.min(55, S - 2 * L - 20);
      const xl = [S / 2 - lw / 2, S / 2 + lw / 2];
      const yR = Hp - L / 2;
      const yP = Hp + pg - L / 2;
      const yE = Hp + 110;
      const rise = P * 0.35;
      const bh = Math.max(40, L * 10) / 10; // tebal balok ayunan
      // tiang sudut
      xs.forEach((x, i) =>
        [zp0, zp1].forEach((z, j) => {
          const top = m === 'rumah-panggung' ? yE : i === 1 ? yB - bh / 2 - L : Hp + pg;
          add(`tiang-${i}-${j}`, 'y', x, 0, z, top, 'post', `Tiang ${i ? 'kanan' : 'kiri'} ${j ? 'depan' : 'belakang'}`, t);
        })
      );
      ring('panggung', 'Rangka panggung', xs[0], xs[1], zp0, zp1, yR, t);
      add('panggung-tengah', 'z', S / 2, yR, zp0 + L / 2, P - L, 'rail-z', 'Balok tengah lantai panggung', t);
      if (b > 0) boards.push(board('lantai-panggung', 'Lantai panggung', L, S - L, Hp, Hp + b, zp0 + L / 2, zp1 - L / 2));
      // pagar jeruji: sisi kiri & kanan penuh, depan & belakang menyisakan bukaan tangga / luncur
      const jeruji = (id: string, axis: 'x' | 'z', fixed: number, a0: number, a1: number) => {
        if (a1 - a0 < 4) return;
        if (axis === 'z') add(`${id}-atas`, 'z', fixed, yP, a0, a1 - a0, 'rail-z', `Pagar atas ${id}`, t);
        else add(`${id}-atas`, 'x', a0, yP, fixed, a1 - a0, 'rail-x', `Pagar atas ${id}`, t);
        const n = Math.floor((a1 - a0) / 11);
        for (let k = 1; k <= n; k++) {
          const v = a0 + ((a1 - a0) * k) / (n + 1);
          if (axis === 'z') add(`${id}-jeruji-${k}`, 'y', fixed, Hp, v, yP - L / 2 - Hp, 'custom', `Jeruji pagar ${id} ${k}`, rail);
          else add(`${id}-jeruji-${k}`, 'y', v, Hp, fixed, yP - L / 2 - Hp, 'custom', `Jeruji pagar ${id} ${k}`, rail);
        }
      };
      jeruji('kiri', 'z', xs[0], zp0 + L / 2, zp1 - L / 2);
      jeruji('kanan', 'z', xs[1], zp0 + L / 2, zp1 - L / 2);
      [zp0, zp1].forEach((z, j) => {
        const nm = j ? 'depan' : 'belakang';
        jeruji(`${nm}-kiri`, 'x', z, L, xl[0] - L / 2);
        jeruji(`${nm}-kanan`, 'x', z, xl[1] + L / 2, S - L);
        xl.forEach((x, i) => add(`bukaan-${nm}-${i ? 'kanan' : 'kiri'}`, 'y', x, Hp, z, pg, 'post', `Tiang bukaan ${nm} ${i ? 'kanan' : 'kiri'}`, t));
      });
      ladder('tangga', 'tangga', xl[0], xl[1], z0, zp0, yR, zp0 - L / 2);
      let Dout = slide(xl[0], xl[1], zp1, yR, Hp + pg * 0.6) + L / 2;
      let Htot = Hp + pg;
      if (m === 'rumah-panggung') {
        ring('lisplang', 'Ring atap', xs[0], xs[1], zp0, zp1, yE - L / 2, t);
        const yRidge = yE + rise;
        // kuda-kuda: ujung atas dipotong rata di sisi bawah bubungan, kedua kuda-kuda bertemu rata di tengah
        const yKt = yRidge - L / 2;
        let zKt = zc - L;
        for (let q = 0; q < 4; q++) zKt = zc - footHalf([xs[0], yE, zp0], [xs[0], yKt, zKt], t, 2);
        xs.forEach((x, i) => {
          const nm = i ? 'kanan' : 'kiri';
          line(`kuda-${nm}-b`, [x, yE, zp0], [x, yKt, zKt], 'custom', `Kuda-kuda ${nm} belakang`, t);
          line(`kuda-${nm}-d`, [x, yE, zp1], [x, yKt, 2 * zc - zKt], 'custom', `Kuda-kuda ${nm} depan`, t);
        });
        add('bubungan', 'x', 0, yRidge, zc, S, 'rail-x', 'Balok bubungan', t);
        const k = rise / (P / 2);
        const ov = 12;
        slopeBoard('atap-belakang', 'Atap belakang', -4, S + 4, zp0 - ov, yE - ov * k, zc, yRidge);
        slopeBoard('atap-depan', 'Atap depan', -4, S + 4, zc, yRidge, zp1 + ov, yE - ov * k);
        Htot = yRidge + L + b;
      } else {
        // balok ayunan menjulur ke kanan, kaki A di ujung
        const B = num(p, 'panjang', 200);
        const xe = S - L / 2 + B;
        // balok ayunan duduk di atas palang dudukan (di atas tiang kanan menara); kaki A berhenti di sisi bawah
        // balok dan kedua kakinya bertemu rata di tengah; palang kaki A dipotong rata di muka dalam kaki
        add('dudukan-balok', 'z', S - L / 2, yB - bh / 2 - L / 2, zp0 - L / 2, P + L, 'rail-z', 'Palang dudukan balok ayunan', t);
        add('balok-ayunan', 'x', S - L, yB, zc, B + L * 1.5, 'rail-x', 'Balok ayunan', [bh * 10, bh * 10]);
        const yA = yB - bh / 2;
        let zA = zc - L;
        for (let q = 0; q < 4; q++) zA = zc - footHalf([xe, 0, zc - sp], [xe, yA, zA], t, 2);
        const ka: [P3, P3][] = [-1, 1].map((s) => [[xe, 0, zc + s * sp], [xe, yA, s < 0 ? zA : 2 * zc - zA]]);
        ka.forEach(([a0, a1], j) => line(`kaki-a-${j ? 'depan' : 'belakang'}`, a0, a1, 'post', `Kaki A ayunan ${j ? 'depan' : 'belakang'}`, t));
        const yt = yA * 0.3;
        const kb: [number, number][] = [[xe - L / 2, xe + L / 2], [yt - L / 2, yt + L / 2]];
        const za0 = faceOf(ka[0][0], ka[0][1], t, 2, 1, [...kb, [-INF, zc]]);
        const za1 = faceOf(ka[1][0], ka[1][1], t, 2, -1, [...kb, [zc, INF]]);
        add('kaki-a-palang', 'z', xe, yt, za0, za1 - za0, 'rail-z', 'Palang kaki A ayunan', t);
        const n = B >= 170 ? 2 : 1;
        for (let k = 1; k <= n; k++) {
          const xs2 = S + ((B - 10) * k) / (n + 1);
          const yBot = yB - Math.max(40, L * 10) / 20; // sisi bawah balok
          [-1, 1].forEach((s, j) => add(`rantai-${k}-${j}`, 'y', xs2 + s * 20, 40, zc, yBot - 40, 'custom', `Gantungan ayunan ${k} ${j ? 'kanan' : 'kiri'} (rantai)`, thin));
          add(`dudukan-ayunan-${k}`, 'x', xs2 - 22, 39, zc, 44, 'custom', `Rangka dudukan ayunan ${k}`, rail);
          if (b > 0) boards.push(board(`papan-ayunan-${k}`, `Dudukan ayunan ${k}`, xs2 - 24, xs2 + 24, 40, 40 + b, zc - 10, zc + 10));
        }
        W = xe + L / 2;
        Dout = Math.max(Dout, zc + sp + L / 2);
        Htot = Math.max(Htot, yB + Math.max(2, L / 2));
      }
      D = Dout;
      H = Htot;
    } else if (m === 'jungkit') {
      W = num(p, 'panjang', 240);
      const Hp = H;
      const xc = W / 2;
      const zc = D / 2;
      const sx = Math.max(20, Hp * 0.55);
      const bal = Math.max(40, L * 10) / 10;
      [-1, 1].forEach((s, i) => add(`tapak-${i ? 'kanan' : 'kiri'}`, 'z', xc + s * sx, L / 2, 0, D, 'rail-z', `Tapak lantai ${i ? 'kanan' : 'kiri'}`, t));
      const yp = Hp - L / 2;
      // kaki A berhenti di sisi bawah poros, kedua kakinya bertemu rata di tengah; palang kaki dipotong rata
      // di muka dalam kaki
      const yk = yp - L / 2;
      let xk = xc - L;
      for (let q = 0; q < 4; q++) xk = xc - footHalf([xc - sx, L, zc], [xk, yk, zc], t, 0);
      [zc - 12, zc + 12].forEach((z, j) => {
        const nm = j ? 'depan' : 'belakang';
        const kl: [P3, P3] = [[xc - sx, L, z], [xk, yk, z]];
        const kr: [P3, P3] = [[xc + sx, L, z], [2 * xc - xk, yk, z]];
        line(`kaki-${nm}-kiri`, kl[0], kl[1], 'post', `Kaki poros ${nm} kiri (miring)`, t);
        line(`kaki-${nm}-kanan`, kr[0], kr[1], 'post', `Kaki poros ${nm} kanan (miring)`, t);
        const yt = L + (yp - L) * 0.35;
        const rh = rail[0] / 20;
        const bb: [number, number][] = [[yt - rh, yt + rh], [z - rh, z + rh]];
        const x0 = faceOf(kl[0], kl[1], t, 0, 1, [[-INF, xc], ...bb]);
        const x1 = faceOf(kr[0], kr[1], t, 0, -1, [[xc, INF], ...bb]);
        add(`palang-kaki-${nm}`, 'x', x0, yt, z, x1 - x0, 'rail-x', `Palang kaki poros ${nm}`, rail);
      });
      add('poros', 'z', xc, yp, zc - 12 - L / 2, 24 + L, 'rail-z', 'Poros jungkit (pakai bos / bearing)', t);
      const yb = yp + L / 2 + bal / 2;
      add('balok', 'x', 0, yb, zc, W, 'rail-x', 'Balok jungkit', [bal * 10, bal * 10]);
      [0, 1].forEach((i) => {
        const nm = i ? 'kanan' : 'kiri';
        const xd = i ? W - 26 : 26;
        const xh = i ? W - 56 : 56;
        if (b > 0) boards.push(board(`dudukan-${nm}`, `Dudukan ${nm}`, xd - 20, xd + 20, yb + bal / 2, yb + bal / 2 + b, zc - 14, zc + 14));
        add(`pegangan-tiang-${nm}`, 'y', xh, yb + bal / 2, zc, 35, 'custom', `Tiang pegangan ${nm}`, t);
        add(`pegangan-${nm}`, 'z', xh, yb + bal / 2 + 35 + L / 2, zc - 15, 30, 'custom', `Pegangan ${nm}`, t);
      });
      H = yb + bal / 2 + 35 + L;
    } else if (m === 'titian') {
      W = num(p, 'panjang', 200);
      const lw = num(p, 'lebar', 60);
      D = lw;
      const zs = [L / 2, D - L / 2];
      const zc = D / 2;
      zs.forEach((z, j) => add(`rel-lantai-${j ? 'depan' : 'belakang'}`, 'x', 0, L / 2, z, W, 'rail-x', `Rel lantai ${j ? 'depan' : 'belakang'}`, t));
      const px = W > 200 ? [L / 2, W / 2, W - L / 2] : [L / 2, W - L / 2];
      px.forEach((x, i) => {
        add(`palang-lantai-${i + 1}`, 'z', x, L / 2, L, D - 2 * L, 'rail-z', `Palang lantai ${i + 1}`, t);
        zs.forEach((z, j) => add(`tiang-${i + 1}-${j}`, 'y', x, L, z, H - L * 2, 'post', `Tiang pegangan ${i + 1} ${j ? 'depan' : 'belakang'}`, t));
      });
      zs.forEach((z, j) => add(`pegangan-${j ? 'depan' : 'belakang'}`, 'x', 0, H - L / 2, z, W, 'rail-x', `Pegangan ${j ? 'depan' : 'belakang'}`, t));
      add('balok-titian', 'x', L, L * 1.5, zc, W - 2 * L, 'rail-x', 'Balok titian', t);
      if (b > 0) boards.push(board('papan-titian', 'Papan titian', L, W - L, L * 2, L * 2 + b, zc - 6, zc + 6));
    } else {
      // komidi putar
      const R = W;
      D = R;
      const c = R / 2;
      const Hd = H;
      const Hh = Hd + 60;
      boards.push({ ...board('plat-dasar', 'Plat dasar bundar', c - 30, c + 30, 0, 0.8, c - 30, c + 30), shape: 'round', steelMm: 8 });
      add('poros', 'y', c, 0.8, c, Hh + L / 2 - 0.8, 'post', 'Poros putar (pakai bearing)', t);
      // Cincin segi delapan cara tukang las: sisi kiri-kanan menerus, sisi depan-belakang di antaranya pendek,
      // sisi serong dipotong tegak lurus X: satu ujung rata di ujung sisi depan/belakang, ujung lain rata di
      // muka dalam sisi kiri/kanan. Lengan lurus dari muka poros ke muka dalam cincin.
      const yA = Hd - L / 2;
      const rr = R / 2 - L / 2; // as sisi lurus cincin
      const e = rr * Math.tan(22.5 * DEG); // setengah sisi lurus depan/belakang
      const dx = rr - L / 2 - e;
      const dz = dx - 0.5; // sedikit lebih landai dari 45° supaya potongannya pasti tegak lurus X
      const zE = rr - dz; // jarak as ujung serong dari pusat (sumbu Z)
      const fz = footHalf([c + e, yA, c + rr], [c + e + dx, yA, c + zE], t, 2);
      const hz = zE + fz; // setengah panjang sisi kiri/kanan
      let k = 0;
      const seg = (a0: P3, a1: P3) => {
        k++;
        line(`cincin-${k}`, a0, a1, 'rail-x', `Cincin lantai ruas ${k}`, t);
      };
      [-1, 1].forEach((s) => add(`cincin-${++k}`, 'z', c + s * rr, yA, c - hz, 2 * hz, 'rail-z', `Cincin lantai ruas ${k}`, t));
      [-1, 1].forEach((s) => add(`cincin-${++k}`, 'x', c - e, yA, c + s * rr, 2 * e, 'rail-x', `Cincin lantai ruas ${k}`, t));
      [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => seg([c + sx * e, yA, c + sz * rr], [c + sx * (e + dx), yA, c + sz * zE])));
      const rp = R / 2 - 18;
      [0, 2, 4, 6].forEach((q, i) => {
        const a = q * 45 * DEG;
        const ca = Math.round(Math.cos(a));
        const sa = Math.round(Math.sin(a));
        line(`lengan-${i + 1}`, [c + (L / 2) * ca, yA, c + (L / 2) * sa], [c + (rr - L / 2) * ca, yA, c + (rr - L / 2) * sa], 'rail-z', `Lengan lantai ${i + 1}`, t);
        // tiang pegangan berhenti di sisi bawah jari-jari; jari-jari dari muka poros sampai muka luar tiang
        add(`pegangan-tiang-${i + 1}`, 'y', r1(c + rp * ca), Hd, r1(c + rp * sa), Hh - L / 2 - Hd, 'custom', `Tiang pegangan ${i + 1}`, t);
        line(`pegangan-${i + 1}`, [c + (L / 2) * ca, Hh, c + (L / 2) * sa], [c + (rp + L / 2) * ca, Hh, c + (rp + L / 2) * sa], 'custom', `Jari-jari pegangan ${i + 1}`, t);
      });
      if (b > 0) boards.push({ ...board('lantai-putar', 'Lantai putar bundar', c - R / 2, c + R / 2, Hd, Hd + b, c - R / 2, c + R / 2), shape: 'round' });
      H = Hh + L;
    }

    return { members: list, boards, casters: [], W: r1(W), D: r1(D), H: r1(H), boardThick: 0, hinges: hinges.length ? hinges : undefined, wall };
  },

  checks: (p) => {
    const out: ProductCheck[] = [];
    const m = model(p);
    const u = usia(p);
    const H = num(p, 'tinggi');
    if (CLIMB.includes(m) && H > CLIMB_MAX[u])
      out.push({ level: 'warn', message: `Terlalu tinggi untuk anak ${u} tahun: kalau jatuh dari ${H} cm bisa cedera.`, fix: { label: `Tinggi ${CLIMB_MAX[u]} cm`, params: { tinggi: CLIMB_MAX[u] } } });
    if (DECK.includes(m) && H > DECK_MAX[u])
      out.push({ level: 'warn', message: `Panggung ${H} cm terlalu tinggi untuk anak ${u} tahun.`, fix: { label: `Panggung ${DECK_MAX[u]} cm`, params: { tinggi: DECK_MAX[u] } } });
    if (m === 'jungkit' && H > PIVOT_MAX[u])
      out.push({ level: 'warn', message: `Poros terlalu tinggi untuk anak ${u} tahun: kaki tidak sampai lantai saat di atas.`, fix: { label: `Poros ${PIVOT_MAX[u]} cm`, params: { tinggi: PIVOT_MAX[u] } } });
    if (LADDER.includes(m) && num(p, 'jarak') > RUNG_MAX[u])
      out.push({ level: 'warn', message: `Jarak anak tangga ${num(p, 'jarak')} cm terlalu jauh untuk langkah anak ${u} tahun.`, fix: { label: `Jarak ${RUNG_MAX[u]} cm`, params: { jarak: RUNG_MAX[u] } } });
    if (DECK.includes(m) && num(p, 'sudut') > 35)
      out.push({ level: 'warn', message: 'Papan luncur lebih miring dari 35° terlalu kencang, anak bisa terpental di ujung.', fix: { label: 'Miring 30°', params: { sudut: 30 } } });
    if (DECK.includes(m) && H > 50 && num(p, 'pagar') < 60)
      out.push({ level: 'warn', message: 'Pagar panggung terlalu pendek, anak bisa jatuh dari atas.', fix: { label: 'Pagar 70 cm', params: { pagar: 70 } } });
    if (m === 'playset' && num(p, 'tinggiAyunan') < H + num(p, 'pagar') + 30)
      out.push({ level: 'warn', message: 'Balok ayunan lebih rendah dari pagar menara.', fix: { label: `Balok ${Math.min(260, H + num(p, 'pagar') + 40)} cm`, params: { tinggiAyunan: Math.min(260, H + num(p, 'pagar') + 40) } } });
    if (m === 'monkey-a' && num(p, 'lebar') < 35)
      out.push({ level: 'warn', message: 'Tangga gantung terlalu sempit, badan anak menyenggol rel.', fix: { label: 'Lebar 45 cm', params: { lebar: 45 } } });
    if (m === 'busur' && H > 100 && num(p, 'lebar') < 50)
      out.push({ level: 'warn', message: 'Busur tinggi dengan rel sempit mudah terguling ke samping.', fix: { label: 'Lebar 60 cm', params: { lebar: 60 } } });
    if (['monkey-a', 'jungle-gym', 'rumah-panggung', 'playset', 'swedia'].includes(m) && str(p, 'pipa') === '20')
      out.push({ level: 'warn', message: 'Pipa 20×20 terlalu tipis untuk menahan anak bergelantungan.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
    if (m === 'swedia') out.push({ level: 'info', message: 'Ibu tangga tembok dibaut ke bata / beton dengan fischer minimal 3 titik per sisi.' });
    if (m === 'dinding-panjat') out.push({ level: 'info', message: 'Pasang pegangan panjat (batu panjat) di papan dengan baut tembus, jarak ±25 cm.' });
    if (m === 'playset') out.push({ level: 'info', message: 'Dudukan ayunan digantung rantai berlapis karet; batang tipis di gambar hanya penanda rantai.' });
    if (m === 'jungkit') out.push({ level: 'info', message: 'Pasang ban bekas di bawah kedua ujung balok sebagai peredam.' });
    if (m === 'komidi') out.push({ level: 'info', message: 'Poros pakai bearing duduk; tanam plat dasar ke cor beton supaya tidak bergeser.' });
    if (m === 'pikler') out.push({ level: 'info', message: 'Kunci engsel puncak dan pasang tali pengaman di kaki sebelum dipakai.' });
    out.push({ level: 'info', message: 'Pasang di atas rumput, matras, atau karet tebal 5–10 cm, dan sisakan ruang kosong ±180 cm di sekeliling.' });
    return out;
  },
};
