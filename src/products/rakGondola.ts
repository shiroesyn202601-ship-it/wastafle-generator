import { Board, Params, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, board, bool, materialParams, memberFactory, num, r1, str } from './common';
import { memberBox } from '../utils/frameLayout';

/**
 * Rak display toko / gondola. Bentuk rangka (param `model`):
 * - tengah: tiang tengah di atas kaki tapak yang menjorok ke depan & belakang, punggung papan tegak di
 *   tengah, papan dasar di atas kaki, lengan rak menjulur ke dua muka, bibir penahan barang
 * - dinding: tiang belakang di atas kaki tapak yang menjorok ke depan, punggung papan, lengan rak satu muka,
 *   bersandar tembok
 * - sudut: dua sayap gondola satu muka bertemu di satu tiang pojok, punggung di dua tembok
 * - segitiga: rangka samping segitiga (tiang belakang tegak + batang miring ke lantai depan), nampan miring
 *   berbibir bertingkat mengikuti batang miring
 * - bak: bak / keranjang promo di atas kaki seluncur (rel lantai), dinding kisi batang tegak 4 sisi
 * - rokok: kotak rangka dibaut tembok di atas meja kasir, papan miring bersekat dengan bibir
 * - putar: satu tiang di atas alas plat bundar + dudukan putar, nampan kotak 4 muka mengelilingi tiang
 */
const MODELS = [
  { value: 'tengah', label: 'Gondola tengah (dua muka)', desc: 'Punggung di tengah, rak di depan & belakang' },
  { value: 'dinding', label: 'Gondola dinding (satu muka)', desc: 'Tiang belakang + kaki tapak, bersandar tembok' },
  { value: 'sudut', label: 'Gondola sudut (pojok)', desc: 'Dua sayap bertemu di tiang pojok' },
  { value: 'segitiga', label: 'Display miring bertingkat', desc: 'Rangka samping segitiga, nampan miring berbibir' },
  { value: 'bak', label: 'Bak promo (keranjang)', desc: 'Bak berdinding kisi di atas kaki seluncur' },
  { value: 'rokok', label: 'Rak rokok dinding', desc: 'Kotak dibaut tembok, papan miring bersekat' },
  { value: 'putar', label: 'Rak putar kasir', desc: 'Tiang di alas plat, nampan kotak 4 muka berputar' },
];
const MODEL_IDS = MODELS.map((m) => m.value);
const model = (p: Params) => {
  const m = str(p, 'model', 'tengah');
  return MODEL_IDS.includes(m) ? m : 'tengah';
};
const GONDOLA = ['tengah', 'dinding', 'sudut'];
const DEG = Math.PI / 180;

type V3 = [number, number, number];
type MapFn = (u: number, y: number, v: number) => V3;
/** sayap sepanjang x (punggung/tembok di z) */
const mapX: MapFn = (u, y, v) => [u, y, v];
/** sayap sepanjang z (punggung/tembok di x) */
const mapZ: MapFn = (u, y, v) => [v, y, u];

/** posisi as tiang / sekat: ujung di L/2 dan W - L/2, sekat merata di antaranya */
const columns = (W: number, k: number, L: number) => Array.from({ length: k + 1 }, (_, j) => (j === 0 ? L / 2 : j === k ? W - L / 2 : (W * j) / k));
/** jarak antar tingkat gondola (dari papan dasar ke tingkat teratas) */
const gondolaGap = (p: Params) => {
  const L = (parseInt(str(p, 'pipa', '30')) || 30) / 10;
  const b = BOARD_THICK[str(p, 'papan', 'kayu')] ?? 2.5;
  const n = Math.max(2, Math.round(num(p, 'tingkat', 5)));
  return (num(p, 'tinggi', 150) - 8 - (L + 2 + b)) / (n - 1);
};

export const RAK_GONDOLA: ProductDef = {
  id: 'rak-gondola',
  name: 'Rak display toko / gondola',
  tagline: 'minimarket · warung · toko oleh-oleh · kasir',
  icon: 'M30 4v30M8 34h44M12 24h36M12 14h36M12 24v-4M48 24v-4M12 14v-4M48 14v-4M8 34v-3M52 34v-3',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['model', 'panjang', 'dalam', 'tinggi', 'panjangSayap', 'tinggiPasang'] },
    { id: 'bentuk', title: 'Bentuk', keys: ['dalamDasar', 'tingkat', 'kolom', 'miring', 'tinggiBak'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Bibir rak', keys: ['bibir', 'tinggiBibir'] },
  ],
  params: [
    { key: 'model', label: 'Bentuk rak', type: 'choice', options: MODELS },
    {
      key: 'panjang',
      label: 'Panjang',
      type: 'number',
      unit: 'cm',
      min: 25,
      max: 240,
      step: 1,
      help: 'Lebar rak dilihat dari depan. Rak putar: lebar nampan kotak.',
      marks: [
        { value: 60, label: 'kasir' },
        { value: 90, label: '1 modul' },
        { value: 120, label: 'modul besar' },
      ],
    },
    {
      key: 'dalam',
      label: 'Dalam papan rak',
      type: 'number',
      unit: 'cm',
      min: 12,
      max: 80,
      step: 1,
      help: 'Gondola: dalam satu papan rak (per muka). Display miring & bak: dalam keseluruhan.',
      marks: [
        { value: 30, label: 'snack' },
        { value: 40, label: 'sembako' },
      ],
      showIf: (p) => p.model !== 'putar',
    },
    {
      key: 'tinggi',
      label: 'Tinggi',
      type: 'number',
      unit: 'cm',
      min: 40,
      max: 220,
      step: 1,
      help: 'Dari lantai sampai ujung tiang. Rak rokok: tinggi kotak raknya saja.',
      marks: [
        { value: 120, label: 'kasir' },
        { value: 150, label: 'minimarket' },
        { value: 180, label: 'dinding' },
      ],
    },
    { key: 'panjangSayap', label: 'Panjang sayap samping', type: 'number', unit: 'cm', min: 60, max: 180, step: 1, help: 'Panjang rak di tembok kedua, diukur dari pojok.', showIf: (p) => p.model === 'sudut' },
    {
      key: 'tinggiPasang',
      label: 'Tinggi pasang dari lantai',
      type: 'number',
      unit: 'cm',
      min: 60,
      max: 160,
      step: 1,
      help: 'Jarak lantai ke dasar rak; di atas meja kasir biasanya 100–120 cm.',
      marks: [{ value: 110, label: 'atas meja kasir' }],
      showIf: (p) => p.model === 'rokok',
    },
    {
      key: 'dalamDasar',
      label: 'Panjang kaki tapak',
      type: 'number',
      unit: 'cm',
      min: 25,
      max: 70,
      step: 1,
      help: 'Kaki di lantai yang menjorok ke depan (per muka). Harus lebih panjang dari papan rak supaya tidak terjungkal.',
      marks: [{ value: 45, label: 'umum' }],
      showIf: (p) => GONDOLA.includes(String(p.model)),
    },
    { key: 'tingkat', label: 'Jumlah tingkat', type: 'number', unit: 'tingkat', min: 2, max: 8, step: 1, help: 'Gondola: termasuk papan dasar di atas kaki.', showIf: (p) => p.model !== 'bak' },
    {
      key: 'kolom',
      label: 'Jumlah modul / sekat',
      type: 'number',
      unit: 'modul',
      min: 1,
      max: 4,
      step: 1,
      help: 'Tiang tambahan membagi rak supaya papan tidak melendut. Rak rokok: jumlah kolom bersekat.',
      showIf: (p) => ['tengah', 'dinding', 'sudut', 'segitiga', 'rokok'].includes(String(p.model)),
    },
    {
      key: 'miring',
      label: 'Kemiringan papan',
      type: 'number',
      unit: '°',
      min: 0,
      max: 20,
      step: 1,
      help: 'Papan miring ke depan supaya barang terlihat pembeli. 0 = datar.',
      marks: [
        { value: 0, label: 'datar' },
        { value: 15, label: 'display' },
      ],
      showIf: (p) => ['tengah', 'dinding', 'segitiga', 'rokok'].includes(String(p.model)),
    },
    { key: 'tinggiBak', label: 'Dalam bak', type: 'number', unit: 'cm', min: 10, max: 60, step: 1, help: 'Tinggi dinding kisi di atas alas bak.', marks: [{ value: 30, label: 'umum' }], showIf: (p) => p.model === 'bak' },
    ...materialParams(true),
    { key: 'bibir', label: 'Bibir penahan barang', type: 'toggle', help: 'Batang kecil di tepi depan papan supaya barang tidak jatuh.', showIf: (p) => p.model !== 'bak' },
    { key: 'tinggiBibir', label: 'Tinggi bibir', type: 'number', unit: 'cm', min: 3, max: 10, step: 1, showIf: (p) => p.bibir === true && p.model !== 'bak' },
  ],
  defaults: {
    model: 'tengah',
    panjang: 90,
    dalam: 35,
    tinggi: 150,
    panjangSayap: 90,
    tinggiPasang: 110,
    dalamDasar: 45,
    tingkat: 5,
    kolom: 1,
    miring: 0,
    tinggiBak: 30,
    bibir: true,
    tinggiBibir: 5,
    pipa: '30',
    papan: 'kayu',
    warna: '#1f2226',
  },
  groups: [
    { id: 'gondola-tengah', name: 'Gondola tengah', desc: 'Rak dua muka dengan punggung tengah, untuk lorong toko' },
    { id: 'gondola-dinding', name: 'Gondola dinding', desc: 'Rak satu muka bersandar tembok, lurus atau di pojok' },
    { id: 'display-miring', name: 'Display miring & bak promo', desc: 'Nampan miring berbibir untuk snack, sayur, buah; bak keranjang promo' },
    { id: 'rak-kasir', name: 'Rak kasir', desc: 'Rak kecil dekat kasir untuk permen, rokok, pulsa' },
  ],
  signature: (p) => `rak-gondola:${model(p)}`,
  presets: [
    {
      id: 'gondola-tengah',
      group: 'gondola-tengah',
      name: 'Gondola tengah dua muka',
      desc: 'tiang tengah di atas kaki tapak dua arah, punggung papan, lengan rak ke depan & belakang',
      params: { model: 'tengah', panjang: 90, dalam: 35, dalamDasar: 45, tinggi: 150, tingkat: 5, kolom: 1, miring: 0, bibir: true },
      sizes: [
        { label: 'Minimarket 1 modul', desc: '90 × 90 × 150 cm, 5 tingkat', params: { panjang: 90, dalam: 35, dalamDasar: 45, tinggi: 150, tingkat: 5, kolom: 1 } },
        { label: 'Lorong 2 modul', desc: '180 × 90 × 150 cm, 5 tingkat', params: { panjang: 180, dalam: 35, dalamDasar: 45, tinggi: 150, tingkat: 5, kolom: 2 } },
        { label: 'Sembako tinggi', desc: '120 × 100 × 180 cm, 6 tingkat', params: { panjang: 120, dalam: 40, dalamDasar: 50, tinggi: 180, tingkat: 6, kolom: 1 } },
        { label: 'Rendah papan miring', desc: '90 × 80 × 120 cm, 4 tingkat miring 10°', params: { panjang: 90, dalam: 30, dalamDasar: 40, tinggi: 120, tingkat: 4, kolom: 1, miring: 10 } },
      ],
    },
    {
      id: 'gondola-dinding',
      group: 'gondola-dinding',
      name: 'Gondola dinding satu muka',
      desc: 'tiang belakang di atas kaki tapak yang menjorok ke depan, punggung papan, lengan rak satu muka',
      params: { model: 'dinding', panjang: 90, dalam: 35, dalamDasar: 45, tinggi: 180, tingkat: 6, kolom: 1, miring: 0, bibir: true },
      sizes: [
        { label: 'Dinding toko', desc: '90 × 45 × 180 cm, 6 tingkat', params: { panjang: 90, dalam: 35, dalamDasar: 45, tinggi: 180, tingkat: 6, kolom: 1 } },
        { label: 'Dinding 2 modul', desc: '180 × 45 × 180 cm, 6 tingkat', params: { panjang: 180, dalam: 35, dalamDasar: 45, tinggi: 180, tingkat: 6, kolom: 2 } },
        { label: 'Sembako berat', desc: '120 × 50 × 180 cm, 5 tingkat', params: { panjang: 120, dalam: 40, dalamDasar: 50, tinggi: 180, tingkat: 5, kolom: 1 } },
        { label: 'Warung rendah', desc: '90 × 40 × 150 cm, 5 tingkat', params: { panjang: 90, dalam: 30, dalamDasar: 40, tinggi: 150, tingkat: 5, kolom: 1 } },
      ],
    },
    {
      id: 'gondola-sudut',
      group: 'gondola-dinding',
      name: 'Gondola sudut (pojok)',
      desc: 'dua sayap gondola satu muka bertemu di satu tiang pojok, punggung di dua tembok',
      params: { model: 'sudut', panjang: 120, panjangSayap: 90, dalam: 35, dalamDasar: 45, tinggi: 180, tingkat: 6, kolom: 1, miring: 0, bibir: true },
      sizes: [
        { label: 'Pojok minimarket', desc: '120 + 90 × 45 × 180 cm', params: { panjang: 120, panjangSayap: 90, dalam: 35, dalamDasar: 45, tinggi: 180, tingkat: 6 } },
        { label: 'Pojok warung', desc: '90 + 90 × 40 × 150 cm', params: { panjang: 90, panjangSayap: 90, dalam: 30, dalamDasar: 40, tinggi: 150, tingkat: 5 } },
        { label: 'Pojok besar', desc: '180 + 120 × 50 × 180 cm', params: { panjang: 180, panjangSayap: 120, dalam: 40, dalamDasar: 50, tinggi: 180, tingkat: 5, kolom: 2 } },
      ],
    },
    {
      id: 'display-miring',
      group: 'display-miring',
      name: 'Display miring bertingkat',
      desc: 'rangka samping segitiga, nampan miring berbibir bertingkat mengikuti batang miring',
      params: { model: 'segitiga', panjang: 90, dalam: 60, tinggi: 110, tingkat: 4, kolom: 1, miring: 15, bibir: true },
      sizes: [
        { label: 'Snack / roti', desc: '90 × 60 × 110 cm, 4 nampan', params: { panjang: 90, dalam: 60, tinggi: 110, tingkat: 4, kolom: 1 } },
        { label: 'Sayur & buah', desc: '120 × 75 × 100 cm, 3 nampan', params: { panjang: 120, dalam: 75, tinggi: 100, tingkat: 3, kolom: 1, tinggiBibir: 8 } },
        { label: 'Majalah / brosur', desc: '60 × 45 × 130 cm, 5 nampan', params: { panjang: 60, dalam: 45, tinggi: 130, tingkat: 5, kolom: 1, miring: 20 } },
        { label: 'Lapak panjang 2 modul', desc: '180 × 70 × 100 cm, 3 nampan', params: { panjang: 180, dalam: 70, tinggi: 100, tingkat: 3, kolom: 2 } },
      ],
    },
    {
      id: 'bak-promo',
      group: 'display-miring',
      name: 'Bak promo (keranjang)',
      desc: 'bak berdinding kisi batang tegak 4 sisi di atas kaki seluncur (rel lantai)',
      params: { model: 'bak', panjang: 100, dalam: 60, tinggi: 75, tinggiBak: 30 },
      sizes: [
        { label: 'Bak promo', desc: '100 × 60 × 75 cm, dalam 30', params: { panjang: 100, dalam: 60, tinggi: 75, tinggiBak: 30 } },
        { label: 'Bak besar', desc: '120 × 80 × 80 cm, dalam 35', params: { panjang: 120, dalam: 80, tinggi: 80, tinggiBak: 35 } },
        { label: 'Bak kecil', desc: '60 × 60 × 70 cm, dalam 25', params: { panjang: 60, dalam: 60, tinggi: 70, tinggiBak: 25 } },
      ],
    },
    {
      id: 'rak-rokok',
      group: 'rak-kasir',
      name: 'Rak rokok dinding',
      desc: 'kotak rangka dibaut tembok, papan miring bersekat dengan bibir, atas datar',
      params: { model: 'rokok', panjang: 60, dalam: 18, tinggi: 60, tinggiPasang: 110, tingkat: 5, kolom: 3, miring: 15, bibir: true, tinggiBibir: 4, pipa: '20' },
      sizes: [
        { label: 'Rokok 3 kolom', desc: '60 × 18 × 60 cm, 5 susun', params: { panjang: 60, dalam: 18, tinggi: 60, tinggiPasang: 110, tingkat: 5, kolom: 3 } },
        { label: 'Rokok lebar 4 kolom', desc: '90 × 18 × 70 cm, 6 susun', params: { panjang: 90, dalam: 18, tinggi: 70, tinggiPasang: 110, tingkat: 6, kolom: 4 } },
        { label: 'Obat / pulsa', desc: '50 × 15 × 50 cm, 4 susun', params: { panjang: 50, dalam: 15, tinggi: 50, tinggiPasang: 120, tingkat: 4, kolom: 2 } },
      ],
    },
    {
      id: 'rak-putar',
      group: 'rak-kasir',
      name: 'Rak putar kasir',
      desc: 'satu tiang di alas plat bundar dengan dudukan putar, nampan kotak 4 muka mengelilingi tiang',
      params: { model: 'putar', panjang: 35, tinggi: 150, tingkat: 5, bibir: true, tinggiBibir: 5 },
      sizes: [
        { label: 'Permen / snack', desc: '35 × 35 × 150 cm, 5 nampan', params: { panjang: 35, tinggi: 150, tingkat: 5 } },
        { label: 'Atas meja', desc: '30 × 30 × 60 cm, 3 nampan', params: { panjang: 30, tinggi: 60, tingkat: 3 } },
        { label: 'Aksesoris HP', desc: '45 × 45 × 170 cm, 6 nampan', params: { panjang: 45, tinggi: 170, tingkat: 6 } },
      ],
    },
  ],
  summary: (p) => {
    const m = model(p);
    const W = num(p, 'panjang');
    const H = num(p, 'tinggi');
    if (m === 'tengah') return `${W} × ${2 * num(p, 'dalamDasar')} × ${H} cm · dua muka · ${num(p, 'tingkat')} tingkat`;
    if (m === 'dinding') return `${W} × ${num(p, 'dalamDasar')} × ${H} cm · ${num(p, 'tingkat')} tingkat`;
    if (m === 'sudut') return `${W} + ${num(p, 'panjangSayap')} × ${num(p, 'dalamDasar')} × ${H} cm · ${num(p, 'tingkat')} tingkat`;
    if (m === 'segitiga') return `${W} × ${num(p, 'dalam')} × ${H} cm · ${num(p, 'tingkat')} nampan miring ${num(p, 'miring')}°`;
    if (m === 'bak') return `${W} × ${num(p, 'dalam')} × ${H} cm · bak dalam ${num(p, 'tinggiBak')} cm`;
    if (m === 'rokok') return `${W} × ${num(p, 'dalam')} × ${H} cm · ${num(p, 'kolom')} kolom × ${num(p, 'tingkat')} susun · pasang ${num(p, 'tinggiPasang')} cm`;
    return `${W} × ${W} × ${H} cm · ${num(p, 'tingkat')} nampan putar`;
  },

  build: (p) => {
    const m = model(p);
    const L = (parseInt(str(p, 'pipa', '30')) || 30) / 10;
    const pt: [number, number] = [L * 10, L * 10];
    const arm: [number, number] = [20, 40];
    const ah = 4; // tinggi penampang lengan 20×40 (cm)
    const rail: [number, number] = [20, 20];
    const rh = 2;
    const thin: [number, number] = [15, 15];
    const tn = 1.5; // penampang batang tipis 15×15 (cm)
    const b = BOARD_THICK[str(p, 'papan', 'kayu')] ?? 2.5;
    const lip = bool(p, 'bibir');
    const lipH = num(p, 'tinggiBibir', 5);
    const W = num(p, 'panjang', 90);
    const Dr = num(p, 'dalam', 35);
    const H = num(p, 'tinggi', 150);
    const n = Math.max(2, Math.round(num(p, 'tingkat', 5)));
    const k = Math.max(1, Math.round(num(p, 'kolom', 1)));
    const tilt = Math.max(0, Math.min(20, num(p, 'miring', 0)));
    const { list, add, line } = memberFactory();
    const boards: Board[] = [];
    let wall = false;

    /** papan dari kotak (u, y, v) lewat pemetaan sayap */
    const bx = (id: string, label: string, mp: MapFn, u0: number, u1: number, y0: number, y1: number, v0: number, v1: number): Board => {
      const a = mp(u0, y0, v0);
      const c = mp(u1, y1, v1);
      return board(id, label, Math.min(a[0], c[0]), Math.max(a[0], c[0]), Math.min(a[1], c[1]), Math.max(a[1], c[1]), Math.min(a[2], c[2]), Math.max(a[2], c[2]));
    };
    /** papan rak: datar, atau miring (turun ke arah v1) bila tilt > 0 — hanya untuk sayap sepanjang x */
    const shelf = (id: string, label: string, mp: MapFn, u0: number, u1: number, yTop: number, v0: number, v1: number, tl: number) => {
      if (tl <= 0) return bx(id, label, mp, u0, u1, yTop, yTop + b, v0, v1);
      const d = Math.abs(v1 - v0);
      const len = d / Math.cos(tl * DEG);
      const rise = d * Math.tan(tl * DEG);
      const vc = (v0 + v1) / 2;
      const yc = yTop - rise / 2 + b / 2;
      const rot = v1 > v0 ? tl : -tl; // turun ke depan (z besar) = rotX positif
      return { ...bx(id, label, mp, u0, u1, yc - b / 2, yc + b / 2, vc - len / 2, vc + len / 2), rotX: rot };
    };

    if (GONDOLA.includes(m)) {
      // ---------- Gondola: tiang + kaki tapak, papan dasar, lengan rak menjulur, punggung papan ----------
      const Dd = Math.max(Dr + 2, num(p, 'dalamDasar', 45));
      const baseY = L + rh / 2; // as palang dasar, duduk di atas kaki tapak
      const baseTop = L + rh + b;
      const gap = (H - 8 - baseTop) / (n - 1);
      const ys = Array.from({ length: n - 1 }, (_, i) => r1(baseTop + gap * (i + 1)));
      const tl = m === 'sudut' ? 0 : tilt;
      const rise = Dr * Math.tan(tl * DEG);

      const post = (id: string, nm: string, mp: MapFn, u: number, vPost: number) => line(id, mp(u, L, vPost), mp(u, H, vPost), 'post', nm, pt);
      const foot = (id: string, nm: string, mp: MapFn, u: number, v0: number, v1: number) =>
        line(id, mp(u, L / 2, v0), mp(u, L / 2, v1), mp === mapX ? 'rail-z' : 'rail-x', nm, pt);
      /** punggung: palang atas & bawah di antara tiang + papan tegak per modul */
      const panel = (key: string, nm: string, mp: MapFn, us: number[], vPost: number, bottomFrom: number, boardFrom: number) => {
        const roleU = mp === mapX ? 'rail-x' : 'rail-z';
        for (let j = 0; j < us.length - 1; j++) {
          const a = us[j] + L / 2;
          const c = us[j + 1] - L / 2;
          line(`${key}-punggung-atas-${j + 1}`, mp(a, H - rh / 2, vPost), mp(c, H - rh / 2, vPost), roleU, `Palang punggung atas ${nm} ${j + 1}`, rail);
          const a2 = Math.max(a, bottomFrom);
          if (c - a2 > 1) line(`${key}-punggung-bawah-${j + 1}`, mp(a2, L + rh / 2, vPost), mp(c, L + rh / 2, vPost), roleU, `Palang punggung bawah ${nm} ${j + 1}`, rail);
          const a3 = Math.max(a, boardFrom);
          if (b > 0 && c - a3 > 1) boards.push(bx(`papan-${key}-punggung-${j + 1}`, `Papan punggung ${nm} ${j + 1}`, mp, a3, c, L + rh, H - rh, vPost - b / 2, vPost + b / 2));
        }
      };
      interface Wing {
        key: string;
        nm: string;
        mp: MapFn;
        us: number[]; // as tiang sepanjang u
        brackets: boolean[]; // tiang yang diberi lengan rak
        vPost: number;
        dir: 1 | -1;
        uFrom: number; // awal papan & palang rak
        uTo: number;
        baseFrom: number; // awal papan dasar
        lipFrom: number;
        tilt: number;
        rearRail?: boolean;
      }
      const wing = (w: Wing) => {
        const { key, nm, mp, dir } = w;
        const roleU = mp === mapX ? 'rail-x' : 'rail-z';
        const roleV = mp === mapX ? 'rail-z' : 'rail-x';
        const vFace = w.vPost + (dir * L) / 2;
        const vTip = vFace + dir * Dr;
        const vEnd = w.vPost + dir * Dd;
        // papan dasar di atas kaki tapak
        line(`${key}-dasar-belakang`, mp(w.baseFrom, baseY, vFace + dir), mp(w.uTo, baseY, vFace + dir), roleU, `Palang dasar ${nm} belakang`, rail);
        line(`${key}-dasar-depan`, mp(w.baseFrom, baseY, vEnd - dir), mp(w.uTo, baseY, vEnd - dir), roleU, `Palang dasar ${nm} depan`, rail);
        if (b > 0) boards.push(bx(`papan-${key}-dasar`, `Papan dasar ${nm}`, mp, w.baseFrom, w.uTo, L + rh, L + rh + b, vFace, vEnd));
        const inner = w.us.filter((u, i) => w.brackets[i] && u > w.uFrom + 5 && u < w.uTo - 5);
        const cuts = [w.uFrom, ...inner, w.uTo];
        const bks = w.us.filter((_, i) => w.brackets[i]);
        ys.forEach((y, i) => {
          const t = i + 2; // tingkat 1 = papan dasar
          const yt = y - rise * (w.tilt > 0 ? 1 : 0);
          w.us.forEach((u, j) => {
            if (w.brackets[j]) line(`${key}-t${t}-lengan-${j + 1}`, mp(u, y, vFace), mp(u, yt, vTip), roleV, `Lengan rak ${nm} tingkat ${t} no. ${j + 1}`, arm);
          });
          line(`${key}-t${t}-depan`, mp(w.uFrom, yt, vTip + dir), mp(w.uTo, yt, vTip + dir), roleU, `Palang depan rak ${nm} tingkat ${t}`, rail);
          if (w.rearRail) {
            // palang belakang dipotong di tiap lengan
            const stops = [w.uFrom, ...bks.filter((u) => u > w.uFrom && u < w.uTo), w.uTo];
            for (let s = 0; s < stops.length - 1; s++) {
              const a = s === 0 ? stops[s] : stops[s] + 1;
              const c = s === stops.length - 2 ? stops[s + 1] : stops[s + 1] - 1;
              if (c - a > 1) line(`${key}-t${t}-belakang-${s + 1}`, mp(a, y, vFace + dir), mp(c, y, vFace + dir), roleU, `Palang belakang rak ${nm} tingkat ${t}`, rail);
            }
          }
          if (b > 0)
            for (let s = 0; s < cuts.length - 1; s++)
              boards.push(shelf(`papan-${key}-t${t}-${s + 1}`, `Papan rak ${nm} tingkat ${t}${cuts.length > 2 ? ` modul ${s + 1}` : ''}`, mp, cuts[s], cuts[s + 1], y + ah / 2, vFace, vTip + dir, w.tilt));
          if (lip) {
            const lu = [w.lipFrom, ...inner.filter((u) => u > w.lipFrom + 3), w.uTo];
            const vl = vTip + dir * 1.8;
            const ylo = yt + rh / 2;
            const yhi = yt + ah / 2 + b + lipH;
            // tiang bibir berdiri di atas palang depan, ujung atasnya rata dengan sisi bawah batang bibir
            lu.forEach((u, j) => {
              const uu = Math.min(w.uTo - 0.8, Math.max(w.lipFrom + 0.8, u));
              line(`${key}-t${t}-bibir-tiang-${j + 1}`, mp(uu, ylo, vl), mp(uu, yhi - tn / 2, vl), 'custom', `Tiang bibir ${nm} tingkat ${t} no. ${j + 1}`, thin);
            });
            line(`${key}-t${t}-bibir`, mp(w.lipFrom, yhi, vl), mp(w.uTo, yhi, vl), roleU, `Bibir penahan barang ${nm} tingkat ${t}`, thin);
          }
        });
      };

      const xs = columns(W, k, L);
      if (m === 'tengah') {
        const zc = Dd;
        xs.forEach((x, j) => {
          const nm = j === 0 ? 'kiri' : j === k ? 'kanan' : `tengah ${j}`;
          foot(`kaki-${j}`, `Kaki tapak ${nm} (depan–belakang)`, mapX, x, 0, 2 * Dd);
          post(`tiang-${j}`, `Tiang ${nm}`, mapX, x, zc);
        });
        panel('tengah', 'tengah', mapX, xs, zc, -1e9, -1e9);
        const all = xs.map(() => true);
        wing({ key: 'depan', nm: 'muka depan', mp: mapX, us: xs, brackets: all, vPost: zc, dir: 1, uFrom: 0, uTo: W, baseFrom: 0, lipFrom: 0, tilt: tl });
        wing({ key: 'belakang', nm: 'muka belakang', mp: mapX, us: xs, brackets: all, vPost: zc, dir: -1, uFrom: 0, uTo: W, baseFrom: 0, lipFrom: 0, tilt: tl });
      } else if (m === 'dinding') {
        const zb = L / 2;
        xs.forEach((x, j) => {
          const nm = j === 0 ? 'kiri' : j === k ? 'kanan' : `tengah ${j}`;
          foot(`kaki-${j}`, `Kaki tapak ${nm}`, mapX, x, 0, Dd);
          post(`tiang-${j}`, `Tiang ${nm} belakang`, mapX, x, zb);
        });
        panel('dinding', 'belakang', mapX, xs, zb, -1e9, -1e9);
        wing({ key: 'rak', nm: '', mp: mapX, us: xs, brackets: xs.map(() => true), vPost: zb, dir: 1, uFrom: 0, uTo: W, baseFrom: 0, lipFrom: 0, tilt: tl });
        wall = true;
      } else {
        // sudut: sayap A sepanjang x (tembok belakang), sayap B sepanjang z (tembok kiri), tiang pojok bersama
        const Z = Math.max(Dd + 30, num(p, 'panjangSayap', 90));
        const kB = Z > 130 ? 2 : 1;
        const zs = columns(Z, kB, L);
        const v0 = L / 2;
        xs.forEach((x, j) => {
          const nm = j === 0 ? 'pojok' : j === k ? 'ujung kanan' : `tengah ${j}`;
          foot(`kaki-a-${j}`, `Kaki tapak ${nm}`, mapX, x, 0, Dd);
          post(`tiang-a-${j}`, `Tiang ${nm}`, mapX, x, v0);
        });
        zs.forEach((z, j) => {
          if (j === 0) return; // tiang pojok sudah ada
          const nm = j === kB ? 'ujung sayap' : `sayap tengah ${j}`;
          foot(`kaki-b-${j}`, `Kaki tapak ${nm}`, mapZ, z, 0, Dd);
          post(`tiang-b-${j}`, `Tiang ${nm}`, mapZ, z, v0);
        });
        const uB = L + Dr + 2; // sayap B dimulai di depan papan sayap A (rata sisi palang depan rak A)
        const baseB = v0 + Dd; // sisi luar palang dasar depan sayap A: palang dasar & punggung bawah B menempel di sini
        const lipB = L + Dr + 1.8 + tn / 2; // sisi luar bibir sayap A
        panel('a', 'belakang', mapX, xs, v0, -1e9, -1e9);
        panel('b', 'samping', mapZ, zs, v0, baseB, Math.max(baseB, uB));
        wing({ key: 'a', nm: 'sayap belakang', mp: mapX, us: xs, brackets: xs.map(() => true), vPost: v0, dir: 1, uFrom: 0, uTo: W, baseFrom: 0, lipFrom: L + 1.5, tilt: 0 });
        wing({ key: 'b', nm: 'sayap samping', mp: mapZ, us: zs, brackets: zs.map((_, j) => j > 0), vPost: v0, dir: 1, uFrom: uB, uTo: Z, baseFrom: baseB, lipFrom: lipB, tilt: 0, rearRail: true });
        wall = true;
      }
    } else if (m === 'segitiga') {
      // ---------- Display miring: rangka samping segitiga, nampan miring bertingkat ----------
      const D = Dr;
      const xs = columns(W, k, L);
      const zb = L / 2;
      const zf0 = D - L / 2;
      const yS = H - L; // ujung atas batang miring (menempel tiang belakang)
      // Batang miring dipotong rata lantai & rata atas; sisi belakangnya menempel muka depan tiang di ujung atas,
      // jadi as ujung atasnya berada setengah lebar-datar batang di depan muka tiang (z = L).
      let zTop = L;
      let off = L / 2; // setengah lebar batang miring diukur mendatar (arah z)
      for (let it = 0; it < 4; it++) {
        off = ((L / 2) * Math.hypot(zf0 - zTop, yS)) / yS;
        zTop = L + off;
      }
      const zs = (y: number) => zf0 + ((zTop - zf0) * y) / yS;
      /** z sisi belakang batang miring pada ketinggian y */
      const zBack = (y: number) => zs(y) - off;
      /** palang dari muka tiang (z = L) ke depan, ujung depannya menempel sisi belakang batang miring.
       *  y0 = tinggi as di z0 (as kaki miring), naik `slope` per cm ke belakang; hh = setengah tinggi penampang */
      const toLeg = (z0: number, y0: number, slope: number, hh: number) => {
        let z = z0;
        for (let it = 0; it < 6; it++) z = zBack(y0 + (z0 - z) * slope + hh);
        return z;
      };
      const y0 = Math.max(14, L + 10);
      const yMax = (yS * (zf0 - zb - 14)) / (zf0 - L);
      const yN = Math.max(y0 + 10, Math.min(H - 14, yMax));
      const lv = Array.from({ length: n }, (_, i) => r1(y0 + ((yN - y0) * i) / (n - 1)));
      const tan = Math.tan(tilt * DEG);
      xs.forEach((x, j) => {
        const nm = j === 0 ? 'kiri' : j === k ? 'kanan' : `tengah ${j}`;
        add(`tiang-${j}`, 'y', x, 0, zb, H, 'post', `Tiang ${nm} belakang`, pt);
        line(`miring-${j}`, [x, 0, zf0], [x, yS, zTop], 'post', `Kaki miring ${nm}`, pt);
        line(`lantai-${j}`, [x, L / 2, L], [x, L / 2, toLeg(L, L / 2, 0, rh / 2)], 'rail-z', `Palang lantai ${nm}`, rail);
        lv.forEach((y, i) => {
          const zf = zs(y);
          const ze = toLeg(zf, y, tan, rh / 2 / Math.cos(tilt * DEG));
          line(`t${i + 1}-samping-${j}`, [x, y + (zf - ze) * tan, ze], [x, y + (zf - L) * tan, L], 'rail-z', `Palang nampan ${i + 1} ${nm}`, rail);
        });
      });
      for (let j = 0; j < k; j++) {
        const a = xs[j] + L / 2;
        const c = xs[j + 1] - L / 2;
        const kk = k > 1 ? ` modul ${j + 1}` : '';
        add(`atas-${j}`, 'x', a, H - rh / 2, zb, c - a, 'rail-x', `Palang atas belakang${kk}`, rail);
        add(`lantai-belakang-${j}`, 'x', a, L / 2, zb, c - a, 'rail-x', `Palang lantai belakang${kk}`, rail);
        add(`lantai-depan-${j}`, 'x', a, L / 2, zs(L / 2), c - a, 'rail-x', `Palang lantai depan${kk}`, rail);
        lv.forEach((y, i) => {
          const zf = zs(y);
          const rise = (zf - L) * tan;
          add(`t${i + 1}-depan-${j}`, 'x', a, y, zf, c - a, 'rail-x', `Palang depan nampan ${i + 1}${kk}`, rail);
          add(`t${i + 1}-belakang-${j}`, 'x', a, y + rise, zb, c - a, 'rail-x', `Palang belakang nampan ${i + 1}${kk}`, rail);
          if (b > 0) {
            const d = zf - zb;
            const len = d / Math.cos(tilt * DEG);
            const yc = y + rise / 2 + rh / 2 + b / 2;
            const bd = board(`papan-${i + 1}-${j + 1}`, `Papan nampan ${i + 1}${kk}`, a, c, yc - b / 2, yc + b / 2, (zb + zf) / 2 - len / 2, (zb + zf) / 2 + len / 2);
            boards.push(tilt > 0 ? { ...bd, rotX: tilt } : bd);
          }
        });
      }
      if (lip)
        lv.forEach((y, i) => {
          const zl = zs(y) + 0.8;
          const yhi = y + rh / 2 + b + lipH;
          // tiang bibir berdiri di atas palang depan nampan, di samping kaki miring (tidak menembus kaki);
          // ujung atasnya rata dengan sisi bawah batang bibir
          xs.forEach((x, j) => {
            const xx = j === k ? x - L / 2 - tn / 2 : x + L / 2 + tn / 2;
            add(`t${i + 1}-bibir-tiang-${j}`, 'y', xx, y + rh / 2, zl, yhi - tn / 2 - y - rh / 2, 'custom', `Tiang bibir nampan ${i + 1} no. ${j + 1}`, thin);
          });
          add(`t${i + 1}-bibir`, 'x', xs[0] + L / 2, yhi, zl, xs[k] - xs[0] - L, 'rail-x', `Bibir penahan nampan ${i + 1}`, thin);
        });
    } else if (m === 'bak') {
      // ---------- Bak promo: kaki seluncur + bak dinding kisi ----------
      const D = Dr;
      const zb = L / 2;
      const zf = D - L / 2;
      const yb = Math.max(L + 12, H - num(p, 'tinggiBak', 30));
      const ends = [L / 2, W - L / 2];
      ends.forEach((x, j) => {
        const nm = j ? 'kanan' : 'kiri';
        add(`seluncur-${nm}`, 'z', x, L / 2, 0, D, 'rail-z', `Kaki seluncur ${nm}`, pt);
        add(`tiang-${nm}-b`, 'y', x, L, zb, H - L, 'post', `Tiang ${nm} belakang`, pt);
        add(`tiang-${nm}-d`, 'y', x, L, zf, H - L, 'post', `Tiang ${nm} depan`, pt);
      });
      const ring = (id: string, nm: string, y: number) => {
        add(`${id}-depan`, 'x', L, y, zf, W - 2 * L, 'rail-x', `Palang ${nm} depan`, rail);
        add(`${id}-belakang`, 'x', L, y, zb, W - 2 * L, 'rail-x', `Palang ${nm} belakang`, rail);
        add(`${id}-kiri`, 'z', L / 2, y, L, D - 2 * L, 'rail-z', `Palang ${nm} kiri`, rail);
        add(`${id}-kanan`, 'z', W - L / 2, y, L, D - 2 * L, 'rail-z', `Palang ${nm} kanan`, rail);
      };
      ring('alas', 'alas bak', yb);
      ring('atas', 'bibir atas bak', H - rh / 2);
      if (W > 80) add('alas-tengah', 'z', W / 2, yb, zb + 1, zf - zb - 2, 'rail-z', 'Penyangga alas bak tengah', rail);
      if (b > 0) boards.push(board('papan-alas', 'Papan alas bak', L, W - L, yb + rh / 2, yb + rh / 2 + b, zb + 0.8, zf - 0.8));
      const y1 = yb + rh / 2;
      const hk = H - rh - y1;
      const nf = Math.max(1, Math.round((W - 2 * L) / 10) - 1);
      for (let i = 1; i <= nf; i++) {
        const x = L + ((W - 2 * L) * i) / (nf + 1);
        add(`kisi-depan-${i}`, 'y', x, y1, zf, hk, 'custom', `Kisi depan ${i}`, thin);
        add(`kisi-belakang-${i}`, 'y', x, y1, zb, hk, 'custom', `Kisi belakang ${i}`, thin);
      }
      const ns = Math.max(1, Math.round((D - 2 * L) / 10) - 1);
      for (let i = 1; i <= ns; i++) {
        const z = L + ((D - 2 * L) * i) / (ns + 1);
        add(`kisi-kiri-${i}`, 'y', L / 2, y1, z, hk, 'custom', `Kisi kiri ${i}`, thin);
        add(`kisi-kanan-${i}`, 'y', W - L / 2, y1, z, hk, 'custom', `Kisi kanan ${i}`, thin);
      }
    } else if (m === 'rokok') {
      // ---------- Rak rokok dinding: kotak dibaut tembok, papan miring bersekat ----------
      const D = Dr;
      const yb = num(p, 'tinggiPasang', 110);
      const yTop = yb + H;
      const zb = L / 2;
      const zf = D - L / 2;
      const xs = columns(W, k, L);
      const tan = Math.tan(tilt * DEG);
      const rise = (zf - zb) * tan;
      [0, k].forEach((j) => {
        const nm = j ? 'kanan' : 'kiri';
        add(`tiang-${nm}-b`, 'y', xs[j], yb, zb, H, 'post', `Tiang ${nm} belakang (dibaut tembok)`, pt);
        add(`tiang-${nm}-d`, 'y', xs[j], yb, zf, H, 'post', `Tiang ${nm} depan`, pt);
      });
      const zIn = zb + rh / 2 + 0.75; // tiang sekat di depan palang belakang
      for (let j = 1; j < k; j++) add(`sekat-${j}-b`, 'y', xs[j], yb, zIn, H, 'custom', `Tiang sekat ${j} belakang`, thin);
      // atas datar
      const yt = yTop - rh / 2;
      add('atas-depan', 'x', L, yt, zf, W - 2 * L, 'rail-x', 'Palang atas depan', rail);
      add('atas-belakang', 'x', L, yt, zb, W - 2 * L, 'rail-x', 'Palang atas belakang (dibaut tembok)', rail);
      add('atas-kiri', 'z', xs[0], yt, L, D - 2 * L, 'rail-z', 'Palang atas kiri', rail);
      add('atas-kanan', 'z', xs[k], yt, L, D - 2 * L, 'rail-z', 'Palang atas kanan', rail);
      if (b > 0) boards.push(board('papan-atas', 'Papan atas', 0, W, yTop, yTop + b, 0, D));
      const yLo = yb + rise / 2 + rh / 2;
      const gap = (yt - 8 - yLo) / Math.max(1, n - 1);
      const lv = Array.from({ length: n }, (_, i) => r1(yLo + gap * i));
      lv.forEach((y, i) => {
        const t = i + 1;
        const yB = y + rise / 2;
        const yF = y - rise / 2;
        add(`t${t}-belakang`, 'x', L, yB, zb, W - 2 * L, 'rail-x', `Palang susun ${t} belakang (dibaut tembok)`, rail);
        add(`t${t}-depan`, 'x', L, yF, zf, W - 2 * L, 'rail-x', `Palang susun ${t} depan`, rail);
        xs.forEach((x, j) => {
          const end = j === 0 || j === k;
          const z0 = end ? zb + L / 2 : zIn + 0.75;
          const z1 = end ? zf - L / 2 : zf - rh / 2;
          const yy0 = yB - (z0 - zb) * tan;
          const yy1 = yF + (zf - z1) * tan;
          line(`t${t}-miring-${j}`, [x, yy0, z0], [x, yy1, z1], 'rail-z', `Palang miring susun ${t} ${end ? (j ? 'kanan' : 'kiri') : `sekat ${j}`}`, end ? rail : thin);
        });
        const yhi = yF + rh / 2 + b + lipH;
        if (lip) add(`t${t}-bibir`, 'x', L, yhi, zf, W - 2 * L, 'rail-x', `Bibir penahan susun ${t}`, thin);
        for (let j = 1; j < k; j++) add(`t${t}-sekat-${j}`, 'y', xs[j], yF + rh / 2, zf, (lip ? yhi - tn / 2 : yF + rh / 2 + b + 6) - yF - rh / 2, 'custom', `Sekat depan susun ${t} no. ${j}`, thin);
        if (b > 0)
          for (let j = 0; j < k; j++) {
            const a = j === 0 ? L : xs[j] + 0.8;
            const c = j === k - 1 ? W - L : xs[j + 1] - 0.8;
            const d = zf - zb;
            const len = d / Math.cos(tilt * DEG);
            const yc = y + rh / 2 + b / 2;
            const bd = board(`papan-${t}-${j + 1}`, `Papan miring susun ${t}${k > 1 ? ` kolom ${j + 1}` : ''}`, a, c, yc - b / 2, yc + b / 2, (zb + zf) / 2 - len / 2, (zb + zf) / 2 + len / 2);
            boards.push(tilt > 0 ? { ...bd, rotX: tilt } : bd);
          }
      });
      wall = true;
    } else {
      // ---------- Rak putar: alas plat bundar, dudukan putar, tiang, nampan kotak 4 muka ----------
      const S = W;
      const Lp = Math.max(L, 4);
      const pp: [number, number] = [Lp * 10, Lp * 10];
      const P = Math.max(S + 10, 40, H / 3.5);
      const Wo = Math.max(S, P);
      const c = Wo / 2;
      const hp = Lp / 2;
      boards.push({ ...board('alas-plat', 'Alas plat bundar 6 mm', c - P / 2, c + P / 2, 0, 0.6, c - P / 2, c + P / 2), shape: 'round', steelMm: 6 });
      add('dudukan-putar', 'y', c, 0.6, c, 5, 'custom', 'Dudukan putar (bearing)', [60, 60]);
      add('tiang', 'y', c, 5.6, c, H - 5.6, 'post', 'Tiang putar', pp);
      const s = S / 2 - 1;
      const y0 = Math.min(25, H * 0.3);
      const yN = H - 6;
      const lv = Array.from({ length: n }, (_, i) => r1(y0 + ((yN - y0) * i) / (n - 1)));
      lv.forEach((y, i) => {
        const t = i + 1;
        add(`t${t}-lengan-kanan`, 'x', c + hp, y, c, s - 1 - hp, 'rail-x', `Lengan nampan ${t} kanan`, rail);
        add(`t${t}-lengan-kiri`, 'x', c - s + 1, y, c, s - 1 - hp, 'rail-x', `Lengan nampan ${t} kiri`, rail);
        add(`t${t}-lengan-depan`, 'z', c, y, c + hp, s - 1 - hp, 'rail-z', `Lengan nampan ${t} depan`, rail);
        add(`t${t}-lengan-belakang`, 'z', c, y, c - s + 1, s - 1 - hp, 'rail-z', `Lengan nampan ${t} belakang`, rail);
        add(`t${t}-depan`, 'x', c - s - 1, y, c + s, 2 * s + 2, 'rail-x', `Palang nampan ${t} depan`, rail);
        add(`t${t}-belakang`, 'x', c - s - 1, y, c - s, 2 * s + 2, 'rail-x', `Palang nampan ${t} belakang`, rail);
        add(`t${t}-kiri`, 'z', c - s, y, c - s + 1, 2 * s - 2, 'rail-z', `Palang nampan ${t} kiri`, rail);
        add(`t${t}-kanan`, 'z', c + s, y, c - s + 1, 2 * s - 2, 'rail-z', `Palang nampan ${t} kanan`, rail);
        if (b > 0) {
          const y1 = y + rh / 2;
          const y2 = y1 + b;
          boards.push(board(`papan-${t}-a`, `Papan nampan ${t} belakang`, c - s, c + hp, y1, y2, c - s, c - hp));
          boards.push(board(`papan-${t}-b`, `Papan nampan ${t} kanan`, c + hp, c + s, y1, y2, c - s, c + hp));
          boards.push(board(`papan-${t}-c`, `Papan nampan ${t} depan`, c - hp, c + s, y1, y2, c + hp, c + s));
          boards.push(board(`papan-${t}-d`, `Papan nampan ${t} kiri`, c - s, c - hp, y1, y2, c - hp, c + s));
        }
        if (lip) {
          const o = s + 0.8;
          const yl = y + rh / 2;
          const yh = yl + b + lipH;
          [
            [-1, -1],
            [1, -1],
            [1, 1],
            [-1, 1],
          ].forEach(([sx, sz], q) => add(`t${t}-bibir-tiang-${q + 1}`, 'y', c + sx * o, yl, c + sz * o, yh - yl, 'custom', `Tiang bibir nampan ${t} no. ${q + 1}`, thin));
          add(`t${t}-bibir-depan`, 'x', c - o + 0.75, yh, c + o, 2 * o - 1.5, 'rail-x', `Bibir nampan ${t} depan`, thin);
          add(`t${t}-bibir-belakang`, 'x', c - o + 0.75, yh, c - o, 2 * o - 1.5, 'rail-x', `Bibir nampan ${t} belakang`, thin);
          add(`t${t}-bibir-kiri`, 'z', c - o, yh, c - o + 0.75, 2 * o - 1.5, 'rail-z', `Bibir nampan ${t} kiri`, thin);
          add(`t${t}-bibir-kanan`, 'z', c + o, yh, c - o + 0.75, 2 * o - 1.5, 'rail-z', `Bibir nampan ${t} kanan`, thin);
        }
      });
    }

    // kotak luar dari semua batang & papan
    let maxX = 0;
    let maxY = 0;
    let maxZ = 0;
    list.forEach((mb) => {
      const t = Math.max(mb.tubeSize || 30, mb.tubeH || 0) / 10;
      const bb = memberBox(mb, [t, t, t]);
      maxX = Math.max(maxX, bb.max[0]);
      maxY = Math.max(maxY, bb.max[1]);
      maxZ = Math.max(maxZ, bb.max[2]);
    });
    boards.forEach((bd) => {
      maxX = Math.max(maxX, bd.box.max[0]);
      maxY = Math.max(maxY, bd.box.max[1]);
      maxZ = Math.max(maxZ, bd.box.max[2]);
    });

    return { members: list, boards, casters: [], W: r1(maxX), D: r1(maxZ), H: r1(maxY), boardThick: 0, wall: wall || undefined };
  },

  checks: (p) => {
    const out: ProductCheck[] = [];
    const m = model(p);
    const W = num(p, 'panjang');
    const Dr = num(p, 'dalam');
    const H = num(p, 'tinggi');
    const n = num(p, 'tingkat');
    const k = Math.max(1, num(p, 'kolom', 1));
    const pipa = str(p, 'pipa', '30');
    if (GONDOLA.includes(m)) {
      const Dd = num(p, 'dalamDasar');
      const span = W / k;
      if (span > 120)
        out.push({ level: 'warn', message: `Papan sepanjang ${Math.round(span)} cm tanpa tiang tengah bisa melendut kalau diisi barang berat.`, fix: { label: 'Tambah 1 modul', params: { kolom: Math.min(4, k + 1) } } });
      if (m === 'sudut' && num(p, 'panjangSayap') < Dd + 30)
        out.push({ level: 'warn', message: 'Sayap samping terlalu pendek, hampir tidak ada papan di sayap kedua.', fix: { label: `Sayap ${Math.min(180, Dd + 50)} cm`, params: { panjangSayap: Math.min(180, Dd + 50) } } });
      if (Dd < Dr + 5)
        out.push({ level: 'warn', message: 'Kaki tapak lebih pendek dari papan rak: rak bisa terjungkal ke depan saat papan atas penuh.', fix: { label: `Kaki ${Math.min(70, Dr + 10)} cm`, params: { dalamDasar: Math.min(70, Dr + 10) } } });
      const base = m === 'tengah' ? 2 * Dd : Dd;
      const ratio = H / Math.max(1, base);
      if (ratio > 5)
        out.push({ level: 'warn', message: 'Rak terlalu tinggi dibanding kaki tapaknya, mudah terguling.', fix: { label: `Kaki ${Math.min(70, Math.ceil(H / (m === 'tengah' ? 9 : 4.5)))} cm`, params: { dalamDasar: Math.min(70, Math.ceil(H / (m === 'tengah' ? 9 : 4.5))) } } });
      else if (m !== 'tengah' && ratio > 3) out.push({ level: 'info', message: 'Gondola satu muka: sandarkan ke tembok dan ikat tiang atas dengan siku / angkur.' });
      const gap = gondolaGap(p);
      if (gap < 22) out.push({ level: 'warn', message: `Jarak antar tingkat hanya ${Math.round(gap)} cm, barang sulit masuk.`, fix: { label: 'Kurangi 1 tingkat', params: { tingkat: Math.max(2, n - 1) } } });
      if (Dr > 45) out.push({ level: 'info', message: 'Lengan rak lebih dari 45 cm: pakai lengan 20×40 tebal 1,6 mm supaya ujungnya tidak turun.' });
    }
    if (m === 'segitiga') {
      const L = (parseInt(pipa) || 30) / 10;
      const yS = H - L;
      const zf0 = Dr - L / 2;
      const yMax = (yS * (zf0 - L / 2 - 14)) / (zf0 - L);
      const y0 = Math.max(14, L + 10);
      const gap = (Math.min(H - 14, yMax) - y0) / Math.max(1, n - 1);
      if (Dr < 35) out.push({ level: 'warn', message: 'Display terlalu dangkal: nampan atas hampir tidak ada tempatnya.', fix: { label: 'Dalam 45 cm', params: { dalam: 45 } } });
      else if (gap < 18) out.push({ level: 'warn', message: `Nampan terlalu rapat (${Math.round(gap)} cm), barang di bawah tertutup nampan atas.`, fix: { label: 'Kurangi 1 nampan', params: { tingkat: Math.max(2, n - 1) } } });
      if (num(p, 'miring') < 5) out.push({ level: 'info', message: 'Papan hampir datar: barang kurang terlihat dari depan. Kemiringan 10–20° umum untuk display.' });
      if (W / k > 120) out.push({ level: 'warn', message: 'Nampan lebih dari 120 cm tanpa rangka tengah bisa melendut.', fix: { label: 'Tambah 1 modul', params: { kolom: Math.min(4, k + 1) } } });
    }
    if (m === 'bak') {
      const hb = num(p, 'tinggiBak');
      if (hb > H - 25) out.push({ level: 'warn', message: 'Bak terlalu dalam untuk tingginya: alas bak hampir menyentuh lantai.', fix: { label: `Dalam bak ${Math.max(10, H - 35)} cm`, params: { tinggiBak: Math.max(10, H - 35) } } });
      if (W > 100 && Dr > 70) out.push({ level: 'info', message: 'Bak besar: barang di tengah sulit dijangkau, isi dengan barang ringan.' });
    }
    if (m === 'rokok') {
      if (Dr < 12) out.push({ level: 'warn', message: 'Rak terlalu dangkal untuk bungkus rokok berdiri.', fix: { label: 'Dalam 18 cm', params: { dalam: 18 } } });
      const L = (parseInt(pipa) || 30) / 10;
      const gap = (H - 8 - L) / Math.max(1, n - 1);
      if (gap < 9) out.push({ level: 'warn', message: `Susun terlalu rapat (${Math.round(gap)} cm), bungkus rokok tidak muat.`, fix: { label: 'Kurangi 1 susun', params: { tingkat: Math.max(2, n - 1) } } });
      out.push({ level: 'info', message: 'Dibaut ke tembok: pakai fischer 8 mm + sekrup di tiap palang belakang.' });
    }
    if (m === 'putar') {
      if (H / Math.max(1, W) > 5) out.push({ level: 'warn', message: 'Rak putar terlalu ramping, goyang saat diputar.', fix: { label: `Lebar ${Math.min(60, Math.ceil(H / 4.5))} cm`, params: { panjang: Math.min(60, Math.ceil(H / 4.5)) } } });
      if (W > 60) out.push({ level: 'warn', message: 'Nampan lebih dari 60 cm terlalu berat untuk satu tiang putar.', fix: { label: 'Lebar 45 cm', params: { panjang: 45 } } });
      out.push({ level: 'info', message: 'Dudukan putar memakai bearing piring (lazy susan) di atas plat; isi nampan merata supaya tidak oleng.' });
    }
    if (pipa === '20' && H > 120 && m !== 'rokok')
      out.push({ level: 'warn', message: 'Tiang 20×20 terlalu ramping untuk rak setinggi ini.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
    if (num(p, 'miring') > 0 && !bool(p, 'bibir') && ['tengah', 'dinding', 'segitiga', 'rokok'].includes(m))
      out.push({ level: 'warn', message: 'Papan miring tanpa bibir: barang meluncur jatuh ke lantai.', fix: { label: 'Pasang bibir', params: { bibir: true } } });
    return out;
  },
};
