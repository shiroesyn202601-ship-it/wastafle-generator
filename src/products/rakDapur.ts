import { Board, Params, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, CASTER_LOAD, CASTER_OPTIONS, board, bool, casterHeight, casterSet, materialParams, memberFactory, num, r1, str } from './common';

/**
 * Rak dapur: piring, microwave, bumbu & galon. Bentuk rangka (param `model`):
 * - piring-jeruji: dua rangka samping di rel lantai (sled), tingkat atas berupa deret jeruji tegak untuk piring, nampan tetes di bawah
 * - piring-dinding: dua tiang tembok + lengan per tingkat tanpa kaki, jeruji piring di atas, nampan tetes di bawah
 * - piring-lipat-x: kaki silang X di kedua ujung dengan poros baut, jeruji di palang atas, nampan di palang bawah silang
 * - microwave-susun: 4 tiang, papan rata tiap susun, silang X di bidang belakang, pagar rendah belakang & samping, kait samping
 * - bumbu-rel: rel dibaut tembok, keranjang kotak berpagar digantung di rel dengan kait (bisa dilepas)
 * - bumbu-pintu: dua tiang ramping dengan kait di pucuk yang dikaitkan di atas daun pintu, nampan berpagar bertingkat
 * - galon-tidur: 4 tiang (+ tiang sekat), tiap susun sepasang palang tidur per galon + penahan belakang, papan dispenser di atas
 * - galon-x: dua bingkai silang X depan & belakang, galon tidur di lekuk V atas silang di atas dua palang buaian (untuk kran)
 */
const MODELS = [
  { value: 'piring-jeruji', label: 'Rak piring rel lantai', desc: 'Jeruji piring di atas, nampan tetes di bawah' },
  { value: 'piring-dinding', label: 'Rak piring dinding', desc: 'Dibaut tembok di atas bak cuci, tanpa kaki' },
  { value: 'piring-lipat-x', label: 'Rak piring kaki silang', desc: 'Kaki X berporos baut, bisa dilipat' },
  { value: 'microwave-susun', label: 'Rak microwave susun', desc: 'Papan rata, silang belakang, pagar & kait' },
  { value: 'bumbu-rel', label: 'Rel + keranjang bumbu', desc: 'Keranjang berpagar digantung di rel tembok' },
  { value: 'bumbu-pintu', label: 'Rak bumbu gantung pintu', desc: 'Dikaitkan di atas daun pintu, tanpa bor' },
  { value: 'galon-tidur', label: 'Rak galon tidur + dispenser', desc: 'Galon berbaring di palang, dispenser di atas' },
  { value: 'galon-x', label: 'Dudukan galon kran (silang)', desc: 'Satu–dua galon tidur di silang X, untuk kran' },
];
const MODEL_IDS = MODELS.map((m) => m.value);
const model = (p: Params) => {
  const m = str(p, 'model', 'piring-jeruji');
  return MODEL_IDS.includes(m) ? m : 'piring-jeruji';
};
const isM = (p: Params, ...m: string[]) => m.includes(model(p));
const WALL = ['piring-dinding', 'bumbu-rel', 'bumbu-pintu'];
const RODA = ['microwave-susun', 'galon-tidur'];
const GALON = ['galon-tidur', 'galon-x'];
const PIRING = ['piring-jeruji', 'piring-dinding', 'piring-lipat-x'];
const CELL_TIDUR = 34; // lebar satu kolom galon tidur (galon Ø 27 + kelonggaran)
const CELL_X = 36; // lebar satu dudukan silang X
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const pipeCm = (p: Params) => (parseInt(str(p, 'pipa', '20')) || 20) / 10;
const galonCount = (p: Params) => clamp(Math.round(num(p, 'galon', 2)), 1, isM(p, 'galon-x') ? 2 : 4);
/** Lebar luar yang dipakai tiap model (galon: dihitung dari jumlah galon) */
const widthOf = (p: Params) =>
  isM(p, 'galon-tidur') ? r1(galonCount(p) * CELL_TIDUR + pipeCm(p)) : isM(p, 'galon-x') ? galonCount(p) * CELL_X : num(p, 'panjang', 60);

export const RAK_DAPUR: ProductDef = {
  id: 'rak-dapur',
  name: 'Rak dapur: piring, microwave & galon',
  tagline: 'rak piring · microwave · bumbu · galon',
  icon: 'M10 36V14M50 36V14M6 36h12M42 36h12M10 30h40M10 14h40M16 14V5M22 14V5M28 14V5M34 14V5M40 14V5M46 14V5',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['model', 'galon', 'panjang', 'dalam', 'tinggi', 'tinggiPasang'] },
    { id: 'bentuk', title: 'Bentuk', keys: ['tingkat', 'kolom', 'tinggiBawah', 'jarakJeruji', 'kait', 'palang'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Roda', keys: ['roda', 'ukuranRoda', 'remRoda'] },
  ],
  params: [
    { key: 'model', label: 'Bentuk rak', type: 'choice', options: MODELS },
    {
      key: 'galon',
      label: 'Jumlah galon per susun',
      type: 'number',
      unit: 'galon',
      min: 1,
      max: 4,
      step: 1,
      help: 'Galon 19 liter (Ø 27 cm). Lebar rak dihitung otomatis. Dudukan silang paling banyak 2.',
      showIf: (p) => GALON.includes(String(p.model)),
    },
    {
      key: 'panjang',
      label: 'Lebar',
      type: 'number',
      unit: 'cm',
      min: 25,
      max: 150,
      step: 1,
      help: 'Lebar rak dilihat dari depan.',
      marks: [
        { value: 45, label: 'kecil' },
        { value: 60, label: 'microwave / piring' },
        { value: 80, label: 'lebar' },
      ],
      showIf: (p) => !GALON.includes(String(p.model)),
    },
    {
      key: 'dalam',
      label: 'Kedalaman',
      type: 'number',
      unit: 'cm',
      min: 8,
      max: 60,
      step: 1,
      help: 'Jarak depan ke belakang. Microwave butuh ±45 cm, rak piring ±30 cm, rak bumbu ±10 cm.',
      marks: [
        { value: 12, label: 'bumbu' },
        { value: 30, label: 'piring' },
        { value: 42, label: 'galon' },
        { value: 45, label: 'microwave' },
      ],
    },
    {
      key: 'tinggi',
      label: 'Tinggi',
      type: 'number',
      unit: 'cm',
      min: 20,
      max: 200,
      step: 1,
      help: 'Rak piring: sampai palang jeruji. Galon tidur: sampai papan dispenser. Silang: sampai pucuk silang.',
      marks: [
        { value: 45, label: 'atas meja' },
        { value: 80, label: 'dispenser' },
        { value: 120, label: 'microwave' },
      ],
    },
    {
      key: 'tinggiPasang',
      label: 'Tinggi pasang',
      type: 'number',
      unit: 'cm',
      min: 50,
      max: 220,
      step: 1,
      help: 'Dari lantai. Dinding: ke bawah rak (di atas bak cuci ±120 cm). Gantung pintu: ke atas daun pintu.',
      marks: [
        { value: 120, label: 'atas bak cuci' },
        { value: 200, label: 'atas pintu' },
      ],
      showIf: (p) => WALL.includes(String(p.model)),
    },
    {
      key: 'tingkat',
      label: 'Jumlah susun / baris',
      type: 'number',
      unit: 'susun',
      min: 1,
      max: 6,
      step: 1,
      help: 'Rak piring: termasuk nampan tetes. Galon tidur: susun galon (papan dispenser tidak dihitung).',
      showIf: (p) => p.model !== 'galon-x',
    },
    {
      key: 'kolom',
      label: 'Keranjang per baris',
      type: 'number',
      unit: 'keranjang',
      min: 1,
      max: 4,
      step: 1,
      help: 'Keranjang bisa diangkat dari rel untuk dicuci.',
      showIf: (p) => p.model === 'bumbu-rel',
    },
    {
      key: 'tinggiBawah',
      label: 'Tinggi susun terbawah',
      type: 'number',
      unit: 'cm',
      min: 3,
      max: 30,
      step: 1,
      help: 'Jarak dari lantai / meja supaya mudah dibersihkan.',
      showIf: (p) => ['piring-jeruji', 'microwave-susun', 'galon-tidur'].includes(String(p.model)),
    },
    {
      key: 'jarakJeruji',
      label: 'Jarak jeruji piring',
      type: 'number',
      unit: 'cm',
      min: 4,
      max: 12,
      step: 1,
      help: 'Celah antar jeruji. 5–6 cm untuk piring, 8–10 cm untuk mangkok / talenan.',
      marks: [
        { value: 6, label: 'piring' },
        { value: 9, label: 'mangkok' },
      ],
      showIf: (p) => PIRING.includes(String(p.model)),
    },
    { key: 'kait', label: 'Kait samping', type: 'toggle', help: 'Kait di sisi kanan untuk lap, sarung tangan oven, sendok sayur.', showIf: (p) => p.model === 'microwave-susun' },
    {
      key: 'palang',
      label: 'Pipa penyangga papan',
      type: 'choice',
      options: [
        { value: '20x20', label: '20×20 mm', desc: 'Ringan, bentang sampai ±90 cm' },
        { value: '20x40', label: '20×40 mm', desc: 'Kuat, untuk beban berat / bentang panjang' },
      ],
      showIf: (p) => ['piring-jeruji', 'piring-dinding', 'microwave-susun', 'galon-tidur'].includes(String(p.model)),
    },
    ...materialParams(true).map((pd) => (pd.key === 'papan' ? { ...pd, showIf: (p: Params) => p.model !== 'galon-x' } : pd)),
    { key: 'roda', label: 'Pakai roda', type: 'toggle', help: 'Rak bisa digeser untuk menyapu kolong.', showIf: (p) => RODA.includes(String(p.model)) },
    { key: 'ukuranRoda', label: 'Ukuran roda', type: 'choice', options: CASTER_OPTIONS, showIf: (p) => RODA.includes(String(p.model)) && p.roda === true },
    { key: 'remRoda', label: 'Roda dengan rem', type: 'toggle', showIf: (p) => RODA.includes(String(p.model)) && p.roda === true },
  ],
  defaults: {
    model: 'piring-jeruji',
    galon: 2,
    panjang: 60,
    dalam: 30,
    tinggi: 45,
    tinggiPasang: 120,
    tingkat: 2,
    kolom: 3,
    tinggiBawah: 8,
    jarakJeruji: 6,
    kait: false,
    palang: '20x20',
    pipa: '20',
    papan: 'kayu',
    warna: '#1f2226',
    roda: false,
    ukuranRoda: '3',
    remRoda: true,
  },
  groups: [
    { id: 'rak-piring', name: 'Rak piring & tirisan', desc: 'Jeruji piring tegak dengan nampan tetes: di meja, di dinding, atau lipat' },
    { id: 'rak-microwave', name: 'Rak microwave & oven', desc: 'Rak susun untuk microwave, oven, rice cooker' },
    { id: 'rak-bumbu', name: 'Rak bumbu', desc: 'Rak bumbu kecil berpagar: keranjang di rel tembok atau digantung di pintu' },
    { id: 'rak-galon', name: 'Rak galon & dispenser', desc: 'Galon tidur bersusun dengan dispenser, dudukan galon berkran' },
  ],
  signature: (p) => `rak-dapur:${model(p)}`,
  presets: [
    {
      id: 'piring-jeruji',
      group: 'rak-piring',
      name: 'Rak piring rel lantai',
      desc: 'dua rangka samping berdiri di rel lantai; susun atas berupa deret jeruji tegak untuk piring, papan nampan tetes di bawah',
      params: { model: 'piring-jeruji', panjang: 60, dalam: 30, tinggi: 45, tingkat: 2, tinggiBawah: 8, jarakJeruji: 6, pipa: '20' },
      sizes: [
        { label: '2 susun atas meja', desc: '60 × 30 × 45 cm', params: { panjang: 60, dalam: 30, tinggi: 45, tingkat: 2 } },
        { label: 'Kecil', desc: '45 × 28 × 35 cm', params: { panjang: 45, dalam: 28, tinggi: 35, tingkat: 2 } },
        { label: '3 susun lebar', desc: '80 × 35 × 75 cm', params: { panjang: 80, dalam: 35, tinggi: 75, tingkat: 3 } },
      ],
    },
    {
      id: 'piring-lipat-x',
      group: 'rak-piring',
      name: 'Rak piring kaki silang (lipat)',
      desc: 'kaki silang X di kedua ujung dengan poros baut; jeruji di palang atas depan-belakang, nampan di palang bawah silang',
      params: { model: 'piring-lipat-x', panjang: 55, dalam: 30, tinggi: 40, jarakJeruji: 6, pipa: '20' },
      sizes: [
        { label: 'Atas meja', desc: '55 × 30 × 40 cm', params: { panjang: 55, dalam: 30, tinggi: 40 } },
        { label: 'Lebar', desc: '75 × 32 × 45 cm', params: { panjang: 75, dalam: 32, tinggi: 45 } },
      ],
    },
    {
      id: 'microwave-susun',
      group: 'rak-microwave',
      name: 'Rak microwave susun',
      desc: '4 tiang dengan papan rata tiap susun, silang X di bidang belakang, pagar rendah di belakang & samping, kait di sisi',
      params: { model: 'microwave-susun', panjang: 60, dalam: 45, tinggi: 120, tingkat: 3, tinggiBawah: 10, kait: true, pipa: '30' },
      sizes: [
        { label: 'Rice cooker 2 susun', desc: '50 × 35 × 80 cm', params: { panjang: 50, dalam: 35, tinggi: 80, tingkat: 2 } },
        { label: 'Microwave 3 susun', desc: '60 × 45 × 120 cm', params: { panjang: 60, dalam: 45, tinggi: 120, tingkat: 3 } },
        { label: 'Oven + microwave 4 susun', desc: '65 × 45 × 150 cm', params: { panjang: 65, dalam: 45, tinggi: 150, tingkat: 4 } },
      ],
    },
    {
      id: 'bumbu-rel',
      group: 'rak-bumbu',
      name: 'Rel + keranjang bumbu',
      desc: 'rel dibaut tembok; keranjang kotak berpagar digantung di rel dengan kait sehingga bisa diangkat',
      params: { model: 'bumbu-rel', panjang: 60, dalam: 12, tinggi: 40, tingkat: 2, kolom: 3, tinggiPasang: 110, pipa: '20' },
      sizes: [
        { label: '2 baris × 3 keranjang', desc: '60 × 12 × 40 cm', params: { panjang: 60, dalam: 12, tinggi: 40, tingkat: 2, kolom: 3 } },
        { label: '1 baris panjang', desc: '80 × 12 × 20 cm, 4 keranjang', params: { panjang: 80, dalam: 12, tinggi: 20, tingkat: 1, kolom: 4, tinggiPasang: 130 } },
        { label: '3 baris', desc: '50 × 14 × 60 cm, 2 keranjang', params: { panjang: 50, dalam: 14, tinggi: 60, tingkat: 3, kolom: 2 } },
      ],
    },
    {
      id: 'bumbu-pintu',
      group: 'rak-bumbu',
      name: 'Rak bumbu gantung pintu',
      desc: 'dua tiang ramping dengan kait di pucuk yang menggantung di atas daun pintu, nampan berpagar bertingkat',
      params: { model: 'bumbu-pintu', panjang: 40, dalam: 10, tinggi: 100, tingkat: 5, tinggiPasang: 200, pipa: '20' },
      sizes: [
        { label: 'Pintu dapur', desc: '40 × 10 × 100 cm, 5 nampan', params: { panjang: 40, dalam: 10, tinggi: 100, tingkat: 5, tinggiPasang: 200 } },
        { label: 'Pintu lemari', desc: '30 × 9 × 50 cm, 3 nampan', params: { panjang: 30, dalam: 9, tinggi: 50, tingkat: 3, tinggiPasang: 75 } },
      ],
    },
    {
      id: 'galon-tidur',
      group: 'rak-galon',
      name: 'Rak galon tidur + dispenser',
      desc: '4 tiang (+ tiang sekat), tiap susun sepasang palang tidur per galon dengan penahan belakang, papan dispenser di atas',
      params: { model: 'galon-tidur', galon: 2, dalam: 42, tinggi: 80, tingkat: 2, tinggiBawah: 8, pipa: '30' },
      sizes: [
        { label: 'Rumah: 2 galon + dispenser', desc: '1 kolom, 37 × 42 × 80 cm', params: { galon: 1, dalam: 42, tinggi: 80, tingkat: 2 } },
        { label: '4 galon + dispenser', desc: '2 kolom, 71 × 42 × 80 cm', params: { galon: 2, dalam: 42, tinggi: 80, tingkat: 2 } },
        { label: 'Depot 9 galon', desc: '3 kolom × 3 susun, 105 × 45 × 150 cm', params: { galon: 3, dalam: 45, tinggi: 150, tingkat: 3 } },
      ],
    },
    {
      id: 'galon-x',
      group: 'rak-galon',
      name: 'Dudukan galon kran (silang)',
      desc: 'dua bingkai silang X depan & belakang; galon berbaring di lekuk V atas silang, ditopang dua palang buaian',
      params: { model: 'galon-x', galon: 1, dalam: 32, tinggi: 35, pipa: '20' },
      sizes: [
        { label: 'Atas meja', desc: '1 galon, 36 × 32 × 35 cm', params: { galon: 1, dalam: 32, tinggi: 35 } },
        { label: 'Lantai', desc: '1 galon, 36 × 32 × 60 cm', params: { galon: 1, dalam: 32, tinggi: 60 } },
        { label: '2 galon', desc: '72 × 32 × 40 cm', params: { galon: 2, dalam: 32, tinggi: 40 } },
      ],
    },
  ],
  summary: (p) => {
    const m = model(p);
    const W = widthOf(p);
    const D = num(p, 'dalam');
    const H = num(p, 'tinggi');
    const n = num(p, 'tingkat');
    if (m === 'galon-tidur') return `${W} × ${D} × ${H} cm · ${galonCount(p)} galon × ${n} susun + papan dispenser`;
    if (m === 'galon-x') return `${W} × ${D} × ${H} cm · ${galonCount(p)} galon tidur`;
    if (m === 'bumbu-rel') return `${W} × ${D} × ${H} cm · ${n} baris × ${num(p, 'kolom')} keranjang`;
    if (m === 'piring-lipat-x') return `${W} × ${D} × ${H} cm · kaki silang lipat`;
    if (m === 'bumbu-pintu') return `${W} × ${D} × ${H} cm · ${n} nampan`;
    return `${W} × ${D} × ${H} cm · ${n} susun`;
  },

  build: (p) => {
    const m = model(p);
    const L = pipeCm(p);
    const pt: [number, number] = [L * 10, L * 10];
    const rail: [number, number] = str(p, 'palang') === '20x40' ? [20, 40] : [20, 20];
    const rh = rail[1] / 10;
    const rw = rail[0] / 10;
    const r2: [number, number] = [20, 20];
    const thin: [number, number] = [15, 15];
    const tt = 1.5;
    const jer: [number, number] = [10, 10];
    const b = BOARD_THICK[str(p, 'papan', 'kayu')] ?? 2.5;
    const roda = bool(p, 'roda') && RODA.includes(m);
    const inch = parseInt(str(p, 'ukuranRoda', '3')) || 3;
    const c = roda ? casterHeight(inch) : 0;
    const n = clamp(Math.round(num(p, 'tingkat', 2)), 1, 6);
    const s = clamp(num(p, 'jarakJeruji', 6), 4, 12);
    const { list, add, line } = memberFactory();
    const boards: Board[] = [];
    const pushBoard = (bd: Board) => {
      if (b > 0) boards.push(bd);
    };
    const levels = (cnt: number, y0: number, y1: number) => Array.from({ length: cnt }, (_, i) => r1(cnt === 1 ? y0 : y0 + ((y1 - y0) * i) / (cnt - 1)));
    /** Deret jeruji tegak di atas sebuah palang (x0..x1), mulai di muka atas palang */
    const jeruji = (id: string, nm: string, x0: number, x1: number, y: number, z: number, h: number) => {
      const cnt = Math.max(2, Math.round((x1 - x0) / s));
      const step = (x1 - x0) / cnt;
      for (let i = 0; i < cnt; i++) add(`${id}-${i + 1}`, 'y', x0 + step * (i + 0.5), y, z, h, 'custom', `${nm} ${i + 1}`, jer);
    };

    let W = num(p, 'panjang', 60);
    let D = num(p, 'dalam', 30);
    let H = num(p, 'tinggi', 45);
    let outW = W;
    let outD = D;
    let outH = H;
    let wall = false;

    if (m === 'piring-jeruji') {
      W = clamp(W, 30, 120);
      D = clamp(D, 20, 45);
      H = clamp(H, 30, 120);
      const nn = Math.max(2, n);
      const xl = L / 2;
      const xr = W - L / 2;
      const zb = 3 + L / 2;
      const zf = D - 3 - L / 2;
      [xl, xr].forEach((x, j) => {
        const nm = j ? 'kanan' : 'kiri';
        add(`rel-${nm}`, 'z', x, L / 2, 0, D, 'rail-z', `Rel lantai ${nm}`, pt);
        add(`tiang-${nm}-b`, 'y', x, L, zb, H - L, 'post', `Tiang ${nm} belakang`, pt);
        add(`tiang-${nm}-d`, 'y', x, L, zf, H - L, 'post', `Tiang ${nm} depan`, pt);
      });
      const yB = Math.max(num(p, 'tinggiBawah', 8), L + rh / 2 + 1);
      levels(nn, yB, H - rh / 2).forEach((y, i, ys) => {
        const t = i + 1;
        add(`t${t}-depan`, 'x', L, y, zf, W - 2 * L, 'rail-x', `Palang susun ${t} depan`, rail);
        add(`t${t}-belakang`, 'x', L, y, zb, W - 2 * L, 'rail-x', `Palang susun ${t} belakang`, rail);
        add(`t${t}-kiri`, 'z', xl, y, zb + L / 2, zf - zb - L, 'rail-z', `Palang susun ${t} kiri`, rail);
        add(`t${t}-kanan`, 'z', xr, y, zb + L / 2, zf - zb - L, 'rail-z', `Palang susun ${t} kanan`, rail);
        if (i === ys.length - 1) {
          const zi = r1(zb + (zf - zb) * 0.55);
          add(`t${t}-dudukan`, 'x', xl + rw / 2, y, zi, W - L - rw, 'rail-x', 'Palang dudukan jeruji depan', rail);
          jeruji('jeruji-b', 'Jeruji piring belakang', L, W - L, y + rh / 2, zb, 15);
          jeruji('jeruji-d', 'Jeruji piring depan', L, W - L, y + rh / 2, zi, 7);
        } else {
          pushBoard(board(`papan-${t}`, i === 0 ? 'Nampan tetes' : `Papan susun ${t} (gelas / mangkok)`, 0, W, y + rh / 2, y + rh / 2 + b, zb + L / 2, zf - L / 2));
        }
      });
      outW = W;
      outD = D;
      outH = H + 15;
    } else if (m === 'piring-dinding') {
      W = clamp(W, 30, 150);
      D = clamp(D, 18, 40);
      H = clamp(H, 30, 120);
      const nn = Math.max(2, n);
      const y0 = num(p, 'tinggiPasang', 120);
      const xl = L / 2;
      const xr = W - L / 2;
      [xl, xr].forEach((x, j) => add(`tiang-tembok-${j ? 'kanan' : 'kiri'}`, 'y', x, y0, L / 2, H, 'post', `Tiang tembok ${j ? 'kanan' : 'kiri'}`, pt));
      levels(nn, y0 + rh / 2, y0 + H - rh / 2).forEach((y, i, ys) => {
        const t = i + 1;
        add(`t${t}-tembok`, 'x', L, y, L / 2, W - 2 * L, 'rail-x', `Palang tembok susun ${t}`, rail);
        add(`t${t}-lengan-kiri`, 'z', xl, y, L, D - L, 'rail-z', `Lengan susun ${t} kiri`, rail);
        add(`t${t}-lengan-kanan`, 'z', xr, y, L, D - L, 'rail-z', `Lengan susun ${t} kanan`, rail);
        add(`t${t}-depan`, 'x', xl + rw / 2, y, D - rw / 2, W - L - rw, 'rail-x', `Palang susun ${t} depan`, rail);
        if (i === ys.length - 1) {
          const zi = r1(L + (D - L) * 0.5);
          add(`t${t}-dudukan`, 'x', xl + rw / 2, y, zi, W - L - rw, 'rail-x', 'Palang dudukan jeruji depan', rail);
          jeruji('jeruji-b', 'Jeruji piring belakang', L, W - L, y + rh / 2, L / 2, 15);
          jeruji('jeruji-d', 'Jeruji piring depan', L, W - L, y + rh / 2, zi, 7);
        } else {
          pushBoard(board(`papan-${t}`, i === 0 ? 'Nampan tetes' : `Papan susun ${t} (gelas / mangkok)`, 0, W, y + rh / 2, y + rh / 2 + b, L, D));
        }
      });
      outW = W;
      outD = D;
      outH = y0 + H + 15;
      wall = true;
    } else if (m === 'piring-lipat-x') {
      W = clamp(W, 35, 100);
      D = clamp(D, 22, 40);
      H = clamp(H, 30, 60);
      const xl = L / 2;
      const xr = W - L / 2;
      const zb = L / 2;
      const zf = D - L / 2;
      [xl, xr].forEach((x, j) => {
        const nm = j ? 'kanan' : 'kiri';
        line(`kaki-${nm}-1`, [x, 0, zb], [x, H, zf], 'post', `Kaki silang ${nm} 1`, pt);
        line(`kaki-${nm}-2`, [x, 0, zf], [x, H, zb], 'post', `Kaki silang ${nm} 2`, pt);
      });
      add('poros', 'x', xl, H / 2, D / 2, W - L, 'rail-x', 'Poros silang (dibaut)', r2);
      add('atas-belakang', 'x', xl, H, zb, W - L, 'rail-x', 'Palang atas belakang', r2);
      add('atas-depan', 'x', xl, H, zf, W - L, 'rail-x', 'Palang atas depan', r2);
      const ya = r1(H * 0.3);
      const dz = zf - zb;
      const z1 = r1(zb + dz * 0.3);
      const z2 = r1(zf - dz * 0.3);
      add('nampan-belakang', 'x', xl, ya, z1, W - L, 'rail-x', 'Palang nampan belakang', r2);
      add('nampan-depan', 'x', xl, ya, z2, W - L, 'rail-x', 'Palang nampan depan', r2);
      pushBoard(board('papan-nampan', 'Nampan tetes', L, W - L, ya + 1, ya + 1 + b, z1 - 1, z2 + 1));
      jeruji('jeruji-b', 'Jeruji piring belakang', L, W - L, H + 1, zb, 15);
      jeruji('jeruji-d', 'Jeruji piring depan', L, W - L, H + 1, zf, 7);
      outW = W;
      outD = D;
      outH = H + 16;
    } else if (m === 'microwave-susun') {
      W = clamp(W, 35, 120);
      D = clamp(D, 25, 60);
      H = clamp(H, 50, 200);
      const nn = Math.max(2, n);
      const xl = L / 2;
      const xr = W - L / 2;
      const zb = L / 2;
      const zf = D - L / 2;
      const extra = b + 8;
      [xl, xr].forEach((x, j) =>
        [zb, zf].forEach((z, k) => add(`tiang-${j ? 'kanan' : 'kiri'}-${k ? 'd' : 'b'}`, 'y', x, c, z, H + extra - c, 'post', `Tiang ${j ? 'kanan' : 'kiri'} ${k ? 'depan' : 'belakang'}`, pt))
      );
      const yB = c + Math.max(num(p, 'tinggiBawah', 10), rh / 2);
      const ys = levels(nn, yB, H - rh / 2);
      ys.forEach((y, i) => {
        const t = i + 1;
        add(`t${t}-depan`, 'x', L, y, zf, W - 2 * L, 'rail-x', `Palang susun ${t} depan`, rail);
        add(`t${t}-belakang`, 'x', L, y, zb, W - 2 * L, 'rail-x', `Palang susun ${t} belakang`, rail);
        add(`t${t}-kiri`, 'z', xl, y, zb + L / 2, zf - zb - L, 'rail-z', `Palang susun ${t} kiri`, rail);
        add(`t${t}-kanan`, 'z', xr, y, zb + L / 2, zf - zb - L, 'rail-z', `Palang susun ${t} kanan`, rail);
        pushBoard(board(`papan-${t}`, `Papan susun ${t}`, L, W - L, y + rh / 2, y + rh / 2 + b, L, D));
        const yp = y + rh / 2 + b + 6;
        add(`t${t}-pagar-belakang`, 'x', L, yp, zb, W - 2 * L, 'custom', `Pagar susun ${t} belakang`, thin);
        add(`t${t}-pagar-kiri`, 'z', xl, yp, zb + L / 2, zf - zb - L, 'custom', `Pagar susun ${t} kiri`, thin);
        add(`t${t}-pagar-kanan`, 'z', xr, yp, zb + L / 2, zf - zb - L, 'custom', `Pagar susun ${t} kanan`, thin);
      });
      line('silang-belakang-1', [xl, ys[0], zb], [xr, ys[ys.length - 1], zb], 'custom', 'Silang belakang 1', thin);
      line('silang-belakang-2', [xr, ys[0], zb], [xl, ys[ys.length - 1], zb], 'custom', 'Silang belakang 2', thin);
      outW = W;
      if (bool(p, 'kait')) {
        const yk = ys[Math.floor((ys.length - 1) / 2)];
        [0.3, 0.55, 0.8].forEach((f, i) => {
          const z = r1(zb + (zf - zb) * f);
          add(`kait-${i + 1}`, 'x', xr + rw / 2, yk, z, 5, 'custom', `Kait samping ${i + 1}`, thin);
          add(`kait-${i + 1}-ujung`, 'y', xr + rw / 2 + 5 - tt / 2, yk + tt / 2, z, 3, 'custom', `Ujung kait samping ${i + 1}`, thin);
        });
        outW = W + rw / 2 - L / 2 + 5;
      }
      outD = D;
      outH = H + extra;
    } else if (m === 'bumbu-rel') {
      W = clamp(W, 30, 120);
      D = clamp(D, 8, 25);
      H = clamp(H, 18, 90);
      const nr = clamp(n, 1, 3);
      const k = clamp(Math.round(num(p, 'kolom', 3)), 1, 4);
      const y0 = num(p, 'tinggiPasang', 110);
      const rowH = H / nr;
      const zr = 3.5;
      const gap = 3;
      const bw = (W - (k + 1) * gap) / k;
      const hb = Math.max(6, Math.min(14, rowH - 6));
      const zB0 = zr + 1 + tt / 2;
      const zB1 = zB0 + D - tt;
      for (let r = 0; r < nr; r++) {
        const R = r + 1;
        const yR = y0 + H - r * rowH - 1;
        add(`rel-${R}`, 'x', 0, yR, zr, W, 'rail-x', `Rel tembok ${R}`, r2);
        [4, W - 4].forEach((x, j) => add(`dudukan-rel-${R}-${j + 1}`, 'z', x, yR, 0, zr - 1, 'custom', `Dudukan rel ${R} ${j ? 'kanan' : 'kiri'}`, r2));
        const yt = yR - 3;
        const yb = yt - hb;
        const yh = yR + 1 + tt / 2;
        for (let j = 0; j < k; j++) {
          const K = `${R}-${j + 1}`;
          const nm = `baris ${R} keranjang ${j + 1}`;
          const x0 = gap + j * (bw + gap) + tt / 2;
          const x1 = x0 + bw - tt;
          [x0, x1].forEach((x, q) => {
            const sd = q ? 'kanan' : 'kiri';
            add(`k${K}-tiang-b-${sd}`, 'y', x, yb, zB0, yh - yb, 'custom', `Tiang belakang ${sd} ${nm}`, thin);
            add(`k${K}-tiang-d-${sd}`, 'y', x, yb, zB1, hb, 'custom', `Tiang depan ${sd} ${nm}`, thin);
            add(`k${K}-kait-${sd}`, 'z', x, yh, zr - 1, zB0 - (zr - 1), 'custom', `Kait gantung ${sd} ${nm}`, thin);
          });
          [yb, yt].forEach((y, q) => {
            const lv = q ? 'pagar' : 'bawah';
            add(`k${K}-${lv}-b`, 'x', x0 + tt / 2, y, zB0, x1 - x0 - tt, 'custom', `Rangka ${lv} belakang ${nm}`, thin);
            add(`k${K}-${lv}-d`, 'x', x0 + tt / 2, y, zB1, x1 - x0 - tt, 'custom', `Rangka ${lv} depan ${nm}`, thin);
            add(`k${K}-${lv}-kiri`, 'z', x0, y, zB0 + tt / 2, zB1 - zB0 - tt, 'custom', `Rangka ${lv} kiri ${nm}`, thin);
            add(`k${K}-${lv}-kanan`, 'z', x1, y, zB0 + tt / 2, zB1 - zB0 - tt, 'custom', `Rangka ${lv} kanan ${nm}`, thin);
          });
          add(`k${K}-alas`, 'x', x0 + tt / 2, yb, (zB0 + zB1) / 2, x1 - x0 - tt, 'custom', `Penyangga alas ${nm}`, thin);
          pushBoard(board(`papan-${K}`, `Alas ${nm}`, x0 + tt / 2, x1 - tt / 2, yb + tt / 2, yb + tt / 2 + b, zB0 + tt / 2, zB1 - tt / 2));
        }
      }
      outW = W;
      outD = r1(zB1 + tt / 2);
      outH = y0 + H + 1;
      wall = true;
    } else if (m === 'bumbu-pintu') {
      W = clamp(W, 25, 70);
      D = clamp(D, 8, 15);
      H = clamp(H, 35, 150);
      const yt = num(p, 'tinggiPasang', 200);
      const yb = Math.max(0, yt - H);
      const dT = 4; // tebal daun pintu
      const zU = 1.5 + dT + 1;
      const xs = [1, W - 1];
      xs.forEach((x, j) => {
        const sd = j ? 'kanan' : 'kiri';
        add(`tiang-${sd}`, 'y', x, yb, zU, yt - yb, 'post', `Tiang ${sd}`, r2);
        add(`kait-${sd}`, 'z', x, yt - 1, 0, zU, 'custom', `Kait atas pintu ${sd}`, r2);
        add(`kait-${sd}-ujung`, 'y', x, yt - 8, tt / 2, 6, 'custom', `Ujung kait ${sd} (di balik pintu)`, thin);
      });
      const ys = levels(clamp(n, 1, 8), yb + 1, Math.max(yb + 1, yt - 16));
      ys.forEach((y, i) => {
        const t = i + 1;
        add(`n${t}-belakang`, 'x', 2, y, zU, W - 4, 'rail-x', `Palang nampan ${t} belakang`, r2);
        add(`n${t}-kiri`, 'z', 1, y, zU + 1, D - 1, 'rail-z', `Lengan nampan ${t} kiri`, r2);
        add(`n${t}-kanan`, 'z', W - 1, y, zU + 1, D - 1, 'rail-z', `Lengan nampan ${t} kanan`, r2);
        add(`n${t}-depan`, 'x', 2, y, zU + D - 1, W - 4, 'rail-x', `Palang nampan ${t} depan`, r2);
        xs.forEach((x, j) => add(`n${t}-pagar-tiang-${j ? 'kanan' : 'kiri'}`, 'y', x, y + 1, zU + D - 1, 6, 'custom', `Tiang pagar nampan ${t} ${j ? 'kanan' : 'kiri'}`, thin));
        add(`n${t}-pagar`, 'x', 1 + tt / 2, y + 7 - tt / 2, zU + D - 1, W - 2 - tt, 'custom', `Pagar nampan ${t}`, thin);
        pushBoard(board(`papan-${t}`, `Nampan ${t}`, 2, W - 2, y + 1, y + 1 + b, zU + 1, zU + D - 1));
      });
      outW = W;
      outD = zU + D;
      outH = yt;
      wall = true;
    } else if (m === 'galon-tidur') {
      const g = galonCount(p);
      W = r1(g * CELL_TIDUR + L);
      D = clamp(D, 32, 55);
      H = clamp(H, 50, 200);
      const zb = L / 2;
      const zf = D - L / 2;
      const xsPost = g >= 3 ? Array.from({ length: g + 1 }, (_, j) => L / 2 + j * CELL_TIDUR) : [L / 2, W - L / 2];
      xsPost.forEach((x, j) => {
        const nm = j === 0 ? 'kiri' : j === xsPost.length - 1 ? 'kanan' : `sekat ${j}`;
        add(`tiang-${j}-b`, 'y', x, c, zb, H - c, 'post', `Tiang ${nm} belakang`, pt);
        add(`tiang-${j}-d`, 'y', x, c, zf, H - c, 'post', `Tiang ${nm} depan`, pt);
      });
      const bays = xsPost.slice(0, -1).map((x, j) => [x, xsPost[j + 1]] as [number, number]);
      const ring = (id: string, nm: string, y: number) => {
        bays.forEach(([xa, xb], j) => {
          add(`${id}-depan-${j + 1}`, 'x', xa + L / 2, y, zf, xb - xa - L, 'rail-x', `Palang ${nm} depan${bays.length > 1 ? ` ${j + 1}` : ''}`, rail);
          add(`${id}-belakang-${j + 1}`, 'x', xa + L / 2, y, zb, xb - xa - L, 'rail-x', `Palang ${nm} belakang${bays.length > 1 ? ` ${j + 1}` : ''}`, rail);
        });
        xsPost.forEach((x, j) => add(`${id}-samping-${j}`, 'z', x, y, zb + L / 2, zf - zb - L, 'rail-z', `Palang ${nm} samping ${j + 1}`, rail));
      };
      const yB = c + Math.max(num(p, 'tinggiBawah', 8), rh / 2);
      const yTopG = Math.max(yB, H - rh - 33);
      levels(n, yB, yTopG).forEach((y, i) => {
        const t = i + 1;
        ring(`g${t}`, `susun galon ${t}`, y);
        for (let q = 0; q < g; q++) {
          const cx = L / 2 + (q + 0.5) * CELL_TIDUR;
          [-1, 1].forEach((sg) =>
            add(`g${t}-tidur-${q + 1}-${sg < 0 ? 'kiri' : 'kanan'}`, 'z', cx + sg * 8, y, zb + rw / 2, zf - zb - rw, 'rail-z', `Palang tidur galon ${q + 1} susun ${t} ${sg < 0 ? 'kiri' : 'kanan'}`, rail)
          );
        }
        bays.forEach(([xa, xb], j) => add(`g${t}-penahan-${j + 1}`, 'x', xa + L / 2, y + rh / 2 + 6, zb, xb - xa - L, 'custom', `Penahan belakang susun ${t}${bays.length > 1 ? ` ${j + 1}` : ''}`, thin));
      });
      ring('atas', 'atas (dispenser)', H - rh / 2);
      pushBoard(board('papan-atas', 'Papan dispenser', 0, W, H, H + b, 0, D));
      outW = W;
      outD = D;
      outH = H + b;
    } else {
      // galon-x
      const g = galonCount(p);
      W = g * CELL_X;
      D = clamp(D, 22, 40);
      H = clamp(H, 25, 80);
      const zb = L / 2;
      const zf = D - L / 2;
      const xcs: number[] = [];
      for (let i = 0; i < g; i++) {
        const I = i + 1;
        const xl = i * CELL_X + L / 2;
        const xr = (i + 1) * CELL_X - L / 2;
        const xc = (xl + xr) / 2;
        const half = (xr - xl) / 2;
        xcs.push(xc);
        [zb, zf].forEach((z, k) => {
          const zn = k ? 'depan' : 'belakang';
          line(`silang-${I}-${zn}-1`, [xl, 0, z], [xr, H, z], 'post', `Kaki silang ${I} ${zn} 1`, pt);
          line(`silang-${I}-${zn}-2`, [xr, 0, z], [xl, H, z], 'post', `Kaki silang ${I} ${zn} 2`, pt);
        });
        add(`poros-${I}`, 'z', xc, H / 2, zb, zf - zb, 'rail-z', `Poros silang ${I}`, r2);
        const yc = r1(H / 2 + (H / 2) * 0.55);
        const off = half * 0.55;
        [-1, 1].forEach((sg) => add(`buaian-${I}-${sg < 0 ? 'kiri' : 'kanan'}`, 'z', xc + sg * off, yc, zb, zf - zb, 'rail-z', `Palang buaian galon ${I} ${sg < 0 ? 'kiri' : 'kanan'}`, r2));
      }
      if (g > 1)
        [zb, zf].forEach((z, k) => add(`sambung-${k ? 'depan' : 'belakang'}`, 'x', xcs[0], H / 2, z, xcs[g - 1] - xcs[0], 'rail-x', `Palang sambung ${k ? 'depan' : 'belakang'}`, r2));
      outW = W;
      outD = D;
      outH = H + L / 2;
    }

    return {
      members: list,
      boards,
      casters: roda ? casterSet([L / 2, W - L / 2], [L / 2, D - L / 2], inch, bool(p, 'remRoda')) : [],
      W: r1(outW),
      D: r1(outD),
      H: r1(outH),
      boardThick: 0,
      ...(wall ? { wall: true } : {}),
    };
  },

  checks: (p, bd) => {
    const out: ProductCheck[] = [];
    const m = model(p);
    const D = num(p, 'dalam');
    const H = num(p, 'tinggi');
    const W = widthOf(p);
    const n = Math.round(num(p, 'tingkat', 2));
    const pipa = str(p, 'pipa', '20');
    const inch = parseInt(str(p, 'ukuranRoda', '3')) || 3;

    if (PIRING.includes(m)) {
      if (num(p, 'jarakJeruji') < 5) out.push({ level: 'info', message: 'Celah jeruji di bawah 5 cm: piring tebal atau mangkok tidak bisa masuk.' });
      if (m !== 'piring-lipat-x' && W > 90 && str(p, 'palang') !== '20x40')
        out.push({ level: 'warn', message: `Rak piring selebar ${W} cm di atas palang 20×20 melendut kalau penuh piring basah.`, fix: { label: 'Pakai penyangga 20×40', params: { palang: '20x40' } } });
      out.push({ level: 'info', message: 'Pakai cat dasar anti karat + cat besi (atau galvanis), karena rak selalu terkena air.' });
    }
    if (m === 'piring-lipat-x') out.push({ level: 'info', message: 'Poros silang dibaut (bukan dilas) supaya kaki bisa dilipat rata saat disimpan.' });

    if (m === 'piring-dinding' || m === 'bumbu-rel')
      out.push({ level: 'info', message: 'Dibaut ke tembok bata/beton dengan fischer + sekrup minimal 6 mm di tiap titik dudukan; jangan ke dinding gipsum.' });
    if (m === 'piring-dinding' && num(p, 'tinggiPasang') < 100) out.push({ level: 'info', message: 'Rak dipasang rendah: pastikan tidak terbentur kepala saat mencuci di bawahnya.' });

    if (m === 'bumbu-rel') {
      const k = Math.round(num(p, 'kolom', 3));
      const bw = (W - (k + 1) * 3) / k;
      if (bw < 12)
        out.push({ level: 'warn', message: `Keranjang hanya ${Math.round(bw)} cm lebarnya, botol bumbu sulit masuk.`, fix: { label: 'Kurangi 1 keranjang', params: { kolom: Math.max(1, k - 1) } } });
      if (H / Math.max(1, n) < 18)
        out.push({ level: 'warn', message: 'Jarak antar rel terlalu rapat, keranjang bawah menabrak keranjang atas.', fix: { label: 'Kurangi 1 baris', params: { tingkat: Math.max(1, n - 1) } } });
    }
    if (m === 'bumbu-pintu') {
      out.push({ level: 'info', message: 'Kait dibuat untuk daun pintu tebal ±4 cm; pastikan ada celah di atas pintu supaya pintu masih bisa ditutup.' });
      if (num(p, 'tinggiPasang') - H < 0)
        out.push({ level: 'warn', message: 'Rak lebih panjang dari tinggi pintu, ujung bawah menyentuh lantai.', fix: { label: `Tinggi ${Math.max(35, num(p, 'tinggiPasang') - 10)} cm`, params: { tinggi: Math.max(35, num(p, 'tinggiPasang') - 10) } } });
      if (H / Math.max(1, n) < 15)
        out.push({ level: 'warn', message: 'Nampan terlalu rapat, botol bumbu tidak muat.', fix: { label: 'Kurangi 1 nampan', params: { tingkat: Math.max(1, n - 1) } } });
    }

    if (m === 'microwave-susun') {
      const nn = Math.max(2, n);
      const gap = (H - num(p, 'tinggiBawah', 10)) / (nn - 1);
      if (gap < 22) out.push({ level: 'warn', message: `Jarak antar susun hanya ${Math.round(gap)} cm, barang sulit masuk.`, fix: { label: 'Kurangi 1 susun', params: { tingkat: Math.max(2, nn - 1) } } });
      else if (gap < 35) out.push({ level: 'info', message: `Jarak antar susun ${Math.round(gap)} cm: microwave / oven butuh minimal ±35 cm, cukup untuk rice cooker & toples.` });
      if (pipa === '20' && H > 120) out.push({ level: 'warn', message: 'Tiang 20×20 terlalu ramping untuk rak setinggi ini dengan microwave.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
      if (D < 40) out.push({ level: 'info', message: 'Kedalaman di bawah 40 cm: microwave ukuran biasa (±40 cm) menonjol keluar papan.' });
      if (H / Math.max(1, D) > 3.5) out.push({ level: 'info', message: 'Rak tinggi & ramping: taruh microwave di susun tengah/bawah dan pasang siku ke tembok.' });
      if (W > 90 && str(p, 'palang') !== '20x40')
        out.push({ level: 'warn', message: `Papan ${W} cm di atas palang 20×20 melendut menahan microwave.`, fix: { label: 'Pakai penyangga 20×40', params: { palang: '20x40' } } });
      out.push({ level: 'info', message: 'Sisakan celah ±10 cm di belakang & atas microwave untuk sirkulasi panas.' });
    }

    if (m === 'galon-tidur') {
      const g = galonCount(p);
      const yB = num(p, 'tinggiBawah', 8);
      const rh = str(p, 'palang') === '20x40' ? 4 : 2;
      const free = H - rh - 33 - yB;
      if (n > 1 && free / (n - 1) < 32) {
        const need = Math.ceil(yB + rh + 33 + 32 * (n - 1));
        out.push(
          need <= 200
            ? { level: 'warn', message: `Jarak antar susun galon kurang dari 32 cm, galon (Ø 27 cm) tidak muat.`, fix: { label: `Tinggi ${need} cm`, params: { tinggi: need } } }
            : { level: 'warn', message: 'Terlalu banyak susun galon untuk tinggi rak ini.', fix: { label: 'Kurangi 1 susun', params: { tingkat: Math.max(1, n - 1) } } }
        );
      }
      const kg = g * n * 19;
      if (pipa === '20' && kg > 60) out.push({ level: 'warn', message: `Beban galon ±${kg} kg terlalu berat untuk tiang 20×20.`, fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
      if (bool(p, 'roda')) {
        const per = (kg + 20) / 4;
        if (per > CASTER_LOAD[inch]) {
          const up = inch < 4 ? '4' : '5';
          out.push(
            inch < 5
              ? { level: 'warn', message: `Tiap roda menahan ±${Math.round(per)} kg, melebihi kemampuan roda ${inch}".`, fix: { label: `Roda ${up}"`, params: { ukuranRoda: up } } }
              : { level: 'warn', message: 'Beban galon terlalu berat untuk rak beroda.', fix: { label: 'Tanpa roda', params: { roda: false } } }
          );
        }
      }
      out.push({ level: 'info', message: 'Galon penuh ±19 kg: taruh di susun bawah, mulut galon menghadap depan.' });
    }

    if (m === 'galon-x') {
      if (galonCount(p) !== Math.round(num(p, 'galon', 1))) out.push({ level: 'info', message: 'Dudukan silang paling banyak 2 galon berjajar.' });
      if (H < 30) out.push({ level: 'info', message: 'Silang rendah: kran galon dekat alas, pakai gelas pendek atau taruh dudukan di tepi meja.' });
      if (H > 60 && str(p, 'pipa') === '20') out.push({ level: 'warn', message: 'Silang tinggi dengan pipa 20×20 goyang menahan galon 19 kg.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
    }

    if (bd.H > 160 && !WALL.includes(m) && bool(p, 'roda')) out.push({ level: 'warn', message: 'Rak tinggi beroda mudah terguling saat didorong.', fix: { label: 'Tanpa roda', params: { roda: false } } });
    return out;
  },
};
