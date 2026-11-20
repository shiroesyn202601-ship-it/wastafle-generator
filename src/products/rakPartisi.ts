import { FrameHinge } from '../types/kitchen';
import { Board, Params, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, CASTER_OPTIONS, board, bool, casterHeight, materialParams, memberFactory, num, r1, str } from './common';

/**
 * Rak partisi / sekat ruangan (tinggi, dilihat dari dua sisi). Bentuk rangka (param `model`):
 * - grid: kotak-kotak terbuka, tiang di tiap batas kolom, tiang ujung berdiri di kaki tapak melintang (kolom boleh berundak)
 * - bilah: dua tiang ujung di kaki tapak, bilah tegak rapat di bidang tengah, ambalan dua muka menempel di bilah
 * - segitiga: 4 tiang ujung di kaki tapak, papan penuh tiap tingkat, batang miring zig-zag membentuk segitiga di muka
 * - louver: 4 tiang ujung di kaki tapak, papan-papan sempit dipasang miring berjajar ke atas (kisi jalusi)
 * - plafon-grid: tiang dijepit lantai–plafon (plat atas & bawah), kotak rak di bagian bawah, atas terbuka
 * - plafon-bilah: bilah tegak menerus dari rel lantai ke rel plafon, ambalan dua muka
 * - gantung: panel bilah digantung dari plafon dengan batang, tidak menyentuh lantai
 * - kubus: modul kotak 12 rusuk ditumpuk selang-seling seperti susunan bata, dibaut antar modul
 * - lipat: 2–5 panel bilah disambung engsel, berdiri karena dibuka zig-zag
 * - gapura: dua menara rak di kiri–kanan dihubungkan lintasan atas, ada jalan lewat di tengah
 * - kisi: dua tiang ujung di plat dasar, kisi diagonal (belah ketupat) dua lapis, ambalan dua muka
 * - tiang: tiang berjajar masing-masing di plat dasar, papan di lengan pendek berselang-seling tinggi antar kolom
 */
const MODELS = [
  { value: 'grid', label: 'Kotak-kotak (kaki tapak)', desc: 'Rak kotak terbuka dua muka' },
  { value: 'bilah', label: 'Bilah tegak + ambalan', desc: 'Bilah rapat di tengah, ambalan dua sisi' },
  { value: 'segitiga', label: 'Rangka segitiga', desc: 'Batang miring zig-zag di antara papan' },
  { value: 'louver', label: 'Papan miring (jalusi)', desc: 'Papan sempit miring berjajar, menghalangi pandangan' },
  { value: 'plafon-grid', label: 'Jepit plafon + rak', desc: 'Tiang lantai sampai plafon, rak di bawah' },
  { value: 'plafon-bilah', label: 'Bilah lantai–plafon', desc: 'Bilah tegak menerus sampai plafon' },
  { value: 'gantung', label: 'Gantung dari plafon', desc: 'Panel bilah melayang, tidak menyentuh lantai' },
  { value: 'kubus', label: 'Kubus tumpuk', desc: 'Modul kotak disusun seperti bata' },
  { value: 'lipat', label: 'Panel lipat', desc: 'Panel berengsel, dibuka zig-zag' },
  { value: 'gapura', label: 'Gapura (ada jalan lewat)', desc: 'Dua menara rak + lintasan atas' },
  { value: 'kisi', label: 'Kisi diagonal di plat', desc: 'Belah ketupat, tiang di plat dasar' },
  { value: 'tiang', label: 'Tiang berjajar', desc: 'Tiang di plat dasar, papan selang-seling' },
];
const MODEL_IDS = MODELS.map((m) => m.value);
const modelOf = (p: Params) => {
  const m = str(p, 'model', 'grid');
  return MODEL_IDS.includes(m) ? m : 'grid';
};
const TAPAK = ['grid', 'bilah', 'segitiga', 'louver'];
const PLAT = ['kisi', 'tiang'];
const PLAFON = ['plafon-grid', 'plafon-bilah', 'gantung'];
const AMBALAN = ['bilah', 'plafon-bilah', 'gantung', 'kisi'];
const BILAH = ['bilah', 'plafon-bilah', 'gantung', 'kisi', 'lipat', 'louver'];
const BAWAH = ['grid', 'bilah', 'segitiga', 'louver', 'plafon-grid', 'gapura', 'kisi', 'lipat'];
const has = (list: string[]) => (p: Params) => list.includes(modelOf(p));
const DEG = Math.PI / 180;
const clampInt = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(v)));
const spread = (a: number, b: number, n: number) => (n <= 1 ? [a] : Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1)));

/** Tinggi total sekat (cm) per model, untuk checks & summary */
const heightOf = (p: Params) => {
  const m = modelOf(p);
  if (m === 'plafon-grid' || m === 'plafon-bilah' || m === 'gantung') return num(p, 'tinggiPlafon', 270);
  if (m === 'kubus') return clampInt(num(p, 'tingkat', 5), 2, 8) * num(p, 'sisiKotak', 35);
  return num(p, 'tinggi', 180);
};

export const RAK_PARTISI: ProductDef = {
  id: 'rak-partisi',
  name: 'Rak partisi / sekat ruangan',
  tagline: 'sekat ruang tamu · ruang makan · kamar kos',
  icon: 'M10 4v32M30 4v32M50 4v32M10 14h40M10 25h40M4 36h12M24 36h12M44 36h12',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['model', 'panjang', 'dalam', 'tinggi', 'tinggiPlafon', 'tinggiPanel', 'tinggiGantung'] },
    {
      id: 'bentuk',
      title: 'Bentuk',
      keys: ['kolom', 'tingkat', 'undak', 'jarakBilah', 'ambalan', 'sudutBilah', 'segitiga', 'lebarMenara', 'tinggiLewat', 'sisiKotak', 'jumlahPanel', 'lebarKaki', 'tinggiBawah'],
    },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Roda', keys: ['roda', 'ukuranRoda'] },
  ],
  params: [
    { key: 'model', label: 'Bentuk sekat', type: 'choice', options: MODELS },
    { key: 'panjang', label: 'Lebar sekat', type: 'number', unit: 'cm', min: 60, max: 240, step: 1, help: 'Panjang sekat dilihat dari depan. Panel lipat: lebar semua panel dijumlah.', marks: [{ value: 90, label: 'kecil' }, { value: 120, label: 'umum' }, { value: 150, label: 'lebar' }], showIf: (p) => modelOf(p) !== 'kubus' },
    { key: 'dalam', label: 'Tebal / kedalaman rak', type: 'number', unit: 'cm', min: 20, max: 50, step: 1, help: 'Jarak sisi depan ke sisi belakang. Kubus: dalam tiap kotak.', marks: [{ value: 30, label: 'umum' }, { value: 35, label: 'buku besar' }], showIf: (p) => modelOf(p) !== 'lipat' },
    { key: 'tinggi', label: 'Tinggi sekat', type: 'number', unit: 'cm', min: 120, max: 240, step: 1, help: 'Jepit plafon: tinggi bagian rak saja, di atasnya tiang terbuka sampai plafon.', marks: [{ value: 180, label: 'setinggi orang' }, { value: 200, label: 'umum' }], showIf: (p) => !['plafon-bilah', 'gantung', 'kubus'].includes(modelOf(p)) },
    { key: 'tinggiPlafon', label: 'Tinggi plafon', type: 'number', unit: 'cm', min: 220, max: 350, step: 1, help: 'Ukur dari lantai ke plafon di beberapa titik, ambil yang terpendek.', marks: [{ value: 270, label: 'rumah' }, { value: 300, label: 'ruko' }], showIf: has(PLAFON) },
    { key: 'tinggiPanel', label: 'Tinggi panel gantung', type: 'number', unit: 'cm', min: 40, max: 150, step: 1, showIf: (p) => modelOf(p) === 'gantung' },
    { key: 'tinggiGantung', label: 'Tinggi tepi bawah dari lantai', type: 'number', unit: 'cm', min: 60, max: 220, step: 1, help: 'Di atas meja / konter biasanya 100–120 cm.', marks: [{ value: 110, label: 'atas konter' }], showIf: (p) => modelOf(p) === 'gantung' },
    { key: 'kolom', label: 'Jumlah kolom', type: 'number', unit: 'kolom', min: 1, max: 6, step: 1, help: 'Tiang tengah membagi rak jadi beberapa kolom kotak.', showIf: has(['grid', 'plafon-grid', 'kubus', 'tiang']) },
    { key: 'tingkat', label: 'Jumlah tingkat', type: 'number', unit: 'tingkat', min: 2, max: 8, step: 1, help: 'Kubus: jumlah baris kotak. Tiang berjajar: papan per kolom.', showIf: has(['grid', 'plafon-grid', 'segitiga', 'gapura', 'kubus', 'tiang']) },
    {
      key: 'undak',
      label: 'Tinggi kolom',
      type: 'choice',
      options: [
        { value: 'rata', label: 'Rata', desc: 'Semua kolom sama tinggi' },
        { value: 'naik', label: 'Berundak naik', desc: 'Kolom makin ke kanan makin tinggi' },
        { value: 'puncak', label: 'Puncak di tengah', desc: 'Kolom tengah paling tinggi' },
      ],
      showIf: (p) => modelOf(p) === 'grid',
    },
    { key: 'jarakBilah', label: 'Jarak antar bilah', type: 'number', unit: 'cm', min: 6, max: 30, step: 1, help: 'Makin rapat makin tertutup pandangan. Jalusi: jarak antar papan miring.', marks: [{ value: 10, label: 'rapat' }, { value: 15, label: 'sedang' }], showIf: has(BILAH) },
    { key: 'ambalan', label: 'Jumlah ambalan', type: 'number', unit: 'papan', min: 0, max: 4, step: 1, help: 'Papan kecil di kedua sisi untuk pajangan.', showIf: has(AMBALAN) },
    { key: 'sudutBilah', label: 'Kemiringan papan', type: 'number', unit: '°', min: 15, max: 60, step: 1, help: 'Makin miring makin tertutup dari pandangan lurus.', marks: [{ value: 35, label: 'umum' }], showIf: (p) => modelOf(p) === 'louver' },
    { key: 'segitiga', label: 'Segitiga per tingkat', type: 'number', unit: 'buah', min: 2, max: 6, step: 1, showIf: (p) => modelOf(p) === 'segitiga' },
    { key: 'lebarMenara', label: 'Lebar menara rak', type: 'number', unit: 'cm', min: 30, max: 60, step: 1, showIf: (p) => modelOf(p) === 'gapura' },
    { key: 'tinggiLewat', label: 'Tinggi jalan lewat', type: 'number', unit: 'cm', min: 180, max: 220, step: 1, help: 'Tinggi bukaan di tengah, minimal 190 cm supaya tidak terbentur.', marks: [{ value: 200, label: 'pintu' }], showIf: (p) => modelOf(p) === 'gapura' },
    { key: 'sisiKotak', label: 'Ukuran kotak', type: 'number', unit: 'cm', min: 25, max: 50, step: 1, help: 'Lebar & tinggi tiap modul kotak.', marks: [{ value: 35, label: 'umum' }], showIf: (p) => modelOf(p) === 'kubus' },
    { key: 'jumlahPanel', label: 'Jumlah panel', type: 'number', unit: 'panel', min: 2, max: 5, step: 1, showIf: (p) => modelOf(p) === 'lipat' },
    { key: 'lebarKaki', label: 'Panjang kaki tapak / plat', type: 'number', unit: 'cm', min: 30, max: 80, step: 1, help: 'Kaki melintang di bawah tiang ujung. Makin panjang makin stabil. Plat dasar: sisi plat.', marks: [{ value: 50, label: 'umum' }], showIf: has([...TAPAK, ...PLAT]) },
    { key: 'tinggiBawah', label: 'Tinggi palang terbawah', type: 'number', unit: 'cm', min: 3, max: 40, step: 1, help: 'Jarak dari lantai, supaya mudah disapu.', showIf: has(BAWAH) },
    ...materialParams(true),
    { key: 'roda', label: 'Pakai roda', type: 'toggle', help: 'Sekat bisa digeser untuk mengatur ulang ruang.', showIf: has(TAPAK) },
    { key: 'ukuranRoda', label: 'Ukuran roda', type: 'choice', options: CASTER_OPTIONS, showIf: (p) => p.roda === true && TAPAK.includes(modelOf(p)) },
  ],
  defaults: {
    model: 'grid', panjang: 120, dalam: 30, tinggi: 180, tinggiPlafon: 270, tinggiPanel: 90, tinggiGantung: 110,
    kolom: 3, tingkat: 5, undak: 'rata', jarakBilah: 10, ambalan: 2, sudutBilah: 35, segitiga: 3, lebarMenara: 40, tinggiLewat: 200,
    sisiKotak: 35, jumlahPanel: 3, lebarKaki: 50, tinggiBawah: 8,
    pipa: '30', papan: 'kayu', warna: '#1f2226', roda: false, ukuranRoda: '3',
  },
  groups: [
    { id: 'partisi-rak', name: 'Partisi rak kotak', desc: 'Rak terbuka dua muka untuk pajangan & buku' },
    { id: 'partisi-bilah', name: 'Partisi bilah / kisi', desc: 'Bilah, kisi, atau papan miring dengan sedikit ambalan' },
    { id: 'partisi-plafon', name: 'Partisi lantai–plafon', desc: 'Tiang dijepit plafon atau panel digantung' },
  ],
  signature: (p) => `rak-partisi:${modelOf(p)}`,
  presets: [
    {
      id: 'kotak-tapak',
      group: 'partisi-rak',
      name: 'Partisi kotak-kotak',
      desc: 'tiang di tiap batas kolom, tiang ujung di kaki tapak melintang, kotak terbuka dua muka',
      params: { model: 'grid', panjang: 120, dalam: 30, tinggi: 180, kolom: 3, tingkat: 5, undak: 'rata', lebarKaki: 50 },
      sizes: [
        { label: 'Ruang tamu', desc: '120 × 30 × 180 cm, 3 × 5 kotak', params: { panjang: 120, dalam: 30, tinggi: 180, kolom: 3, tingkat: 5 } },
        { label: 'Kecil', desc: '90 × 30 × 160 cm, 2 × 4 kotak', params: { panjang: 90, dalam: 30, tinggi: 160, kolom: 2, tingkat: 4, lebarKaki: 45 } },
        { label: 'Berundak naik', desc: '150 × 35 × 200 cm, kolom makin tinggi', params: { panjang: 150, dalam: 35, tinggi: 200, kolom: 4, tingkat: 6, undak: 'naik', lebarKaki: 55 } },
        { label: 'Puncak tengah, beroda', desc: '150 × 35 × 170 cm', params: { panjang: 150, dalam: 35, tinggi: 170, kolom: 3, tingkat: 5, undak: 'puncak', lebarKaki: 55, roda: true } },
      ],
    },
    {
      id: 'segitiga',
      group: 'partisi-rak',
      name: 'Partisi rangka segitiga',
      desc: 'papan penuh tiap tingkat, batang miring zig-zag di muka depan & belakang membentuk segitiga',
      params: { model: 'segitiga', panjang: 120, dalam: 30, tinggi: 180, tingkat: 5, segitiga: 3, lebarKaki: 50 },
      sizes: [
        { label: 'Ruang tamu', desc: '120 × 30 × 180 cm, 5 tingkat', params: { panjang: 120, tinggi: 180, tingkat: 5, segitiga: 3 } },
        { label: 'Lebar', desc: '160 × 35 × 200 cm, 6 tingkat', params: { panjang: 160, dalam: 35, tinggi: 200, tingkat: 6, segitiga: 4, lebarKaki: 55 } },
        { label: 'Rendah', desc: '100 × 30 × 140 cm, 4 tingkat', params: { panjang: 100, tinggi: 140, tingkat: 4, segitiga: 2, lebarKaki: 40 } },
      ],
    },
    {
      id: 'kubus-tumpuk',
      group: 'partisi-rak',
      name: 'Partisi kubus tumpuk',
      desc: 'modul kotak berangka ditumpuk selang-seling seperti bata, dibaut antar modul',
      params: { model: 'kubus', dalam: 35, sisiKotak: 35, kolom: 4, tingkat: 5, pipa: '20' },
      sizes: [
        { label: '4 × 5 kotak', desc: 'kotak 35 cm, tinggi 175', params: { sisiKotak: 35, kolom: 4, tingkat: 5, dalam: 35 } },
        { label: '3 × 4 kotak besar', desc: 'kotak 45 cm, tinggi 180', params: { sisiKotak: 45, kolom: 3, tingkat: 4, dalam: 40 } },
        { label: '5 × 6 kotak kecil', desc: 'kotak 30 cm, tinggi 180', params: { sisiKotak: 30, kolom: 5, tingkat: 6, dalam: 30 } },
      ],
    },
    {
      id: 'tiang-berjajar',
      group: 'partisi-rak',
      name: 'Partisi tiang berjajar',
      desc: 'tiang berjajar masing-masing di plat dasar, papan di lengan pendek berselang-seling tinggi antar kolom',
      params: { model: 'tiang', panjang: 150, dalam: 30, tinggi: 200, kolom: 4, tingkat: 4, lebarKaki: 30, tinggiBawah: 10 },
      sizes: [
        { label: 'Ruang tamu', desc: '150 × 30 × 200 cm, 5 tiang', params: { panjang: 150, tinggi: 200, kolom: 4, tingkat: 4 } },
        { label: 'Kecil', desc: '100 × 30 × 180 cm, 4 tiang', params: { panjang: 100, tinggi: 180, kolom: 3, tingkat: 4 } },
        { label: 'Lebar', desc: '200 × 35 × 220 cm, 6 tiang', params: { panjang: 200, dalam: 35, tinggi: 220, kolom: 5, tingkat: 5, lebarKaki: 35 } },
      ],
    },
    {
      id: 'bilah-ambalan',
      group: 'partisi-bilah',
      name: 'Partisi bilah tegak + ambalan',
      desc: 'dua tiang ujung di kaki tapak, bilah tegak rapat di tengah, ambalan dua muka menempel di bilah',
      params: { model: 'bilah', panjang: 120, dalam: 30, tinggi: 180, jarakBilah: 10, ambalan: 2, lebarKaki: 50 },
      sizes: [
        { label: 'Sekat ruang tamu', desc: '120 × 180 cm, 2 ambalan', params: { panjang: 120, tinggi: 180, jarakBilah: 10, ambalan: 2 } },
        { label: 'Bilah jarang', desc: '150 × 200 cm, jarak 15', params: { panjang: 150, tinggi: 200, jarakBilah: 15, ambalan: 3, lebarKaki: 55 } },
        { label: 'Tanpa ambalan', desc: '90 × 170 cm, rapat', params: { panjang: 90, tinggi: 170, jarakBilah: 8, ambalan: 0, lebarKaki: 45 } },
      ],
    },
    {
      id: 'jalusi',
      group: 'partisi-bilah',
      name: 'Partisi papan miring (jalusi)',
      desc: '4 tiang ujung di kaki tapak, papan sempit dipasang miring berjajar ke atas di atas siku miring',
      params: { model: 'louver', panjang: 100, dalam: 25, tinggi: 180, jarakBilah: 12, sudutBilah: 35, lebarKaki: 50 },
      sizes: [
        { label: 'Sekat privasi', desc: '100 × 25 × 180 cm', params: { panjang: 100, dalam: 25, tinggi: 180, jarakBilah: 12 } },
        { label: 'Lebar', desc: '140 × 30 × 200 cm', params: { panjang: 140, dalam: 30, tinggi: 200, jarakBilah: 14, lebarKaki: 55 } },
        { label: 'Rapat & curam', desc: '90 × 25 × 160 cm, 45°', params: { panjang: 90, dalam: 25, tinggi: 160, jarakBilah: 10, sudutBilah: 45, lebarKaki: 45 } },
      ],
    },
    {
      id: 'panel-lipat',
      group: 'partisi-bilah',
      name: 'Partisi panel lipat',
      desc: 'panel bilah berengsel, berdiri karena dibuka zig-zag, tanpa kaki',
      params: { model: 'lipat', panjang: 150, tinggi: 170, jumlahPanel: 3, jarakBilah: 10, tinggiBawah: 8, pipa: '20' },
      sizes: [
        { label: '3 panel', desc: '3 × 50 cm, tinggi 170', params: { panjang: 150, tinggi: 170, jumlahPanel: 3 } },
        { label: '4 panel', desc: '4 × 50 cm, tinggi 180', params: { panjang: 200, tinggi: 180, jumlahPanel: 4 } },
        { label: '2 panel kecil', desc: '2 × 45 cm, tinggi 150', params: { panjang: 90, tinggi: 150, jumlahPanel: 2 } },
      ],
    },
    {
      id: 'jepit-plafon',
      group: 'partisi-plafon',
      name: 'Partisi jepit plafon + rak',
      desc: 'tiang dijepit lantai sampai plafon dengan plat, kotak rak di bawah, atas terbuka',
      params: { model: 'plafon-grid', panjang: 120, dalam: 30, tinggi: 180, tinggiPlafon: 270, kolom: 3, tingkat: 5 },
      sizes: [
        { label: 'Rumah (plafon 270)', desc: '120 × 30, rak 180 cm', params: { panjang: 120, tinggiPlafon: 270, tinggi: 180, kolom: 3, tingkat: 5 } },
        { label: 'Ruko (plafon 300)', desc: '150 × 35, rak 200 cm', params: { panjang: 150, dalam: 35, tinggiPlafon: 300, tinggi: 200, kolom: 3, tingkat: 6 } },
        { label: 'Rak rendah', desc: '90 × 30, rak 120 cm', params: { panjang: 90, tinggiPlafon: 260, tinggi: 120, kolom: 2, tingkat: 3 } },
      ],
    },
    {
      id: 'bilah-plafon',
      group: 'partisi-plafon',
      name: 'Partisi bilah lantai–plafon',
      desc: 'bilah tegak menerus dari rel lantai ke rel plafon, ambalan dua muka',
      params: { model: 'plafon-bilah', panjang: 120, dalam: 25, tinggiPlafon: 270, jarakBilah: 10, ambalan: 2 },
      sizes: [
        { label: 'Rumah (plafon 270)', desc: '120 cm, 2 ambalan', params: { panjang: 120, tinggiPlafon: 270, ambalan: 2 } },
        { label: 'Ruko (plafon 300)', desc: '180 cm, jarak 12', params: { panjang: 180, tinggiPlafon: 300, jarakBilah: 12, ambalan: 3 } },
        { label: 'Polos rapat', desc: '90 cm, tanpa ambalan', params: { panjang: 90, tinggiPlafon: 260, jarakBilah: 8, ambalan: 0 } },
      ],
    },
    {
      id: 'gantung-plafon',
      group: 'partisi-plafon',
      name: 'Partisi gantung plafon',
      desc: 'panel bilah digantung dari plafon dengan batang, melayang di atas lantai / konter',
      params: { model: 'gantung', panjang: 150, dalam: 25, tinggiPlafon: 270, tinggiPanel: 90, tinggiGantung: 110, jarakBilah: 10, ambalan: 1, pipa: '20' },
      sizes: [
        { label: 'Di atas konter', desc: '150 cm, panel 90, bawah 110', params: { panjang: 150, tinggiPanel: 90, tinggiGantung: 110, ambalan: 1 } },
        { label: 'Sekat atas (tetap bisa lewat)', desc: '180 cm, bawah 200', params: { panjang: 180, tinggiPlafon: 300, tinggiPanel: 70, tinggiGantung: 200, ambalan: 0 } },
        { label: 'Panel tinggi', desc: '120 cm, panel 130, bawah 90', params: { panjang: 120, tinggiPanel: 130, tinggiGantung: 90, ambalan: 2 } },
      ],
    },
  ],
  summary: (p) => {
    const m = modelOf(p);
    const H = heightOf(p);
    if (m === 'kubus') {
      const n = clampInt(num(p, 'kolom', 4), 1, 6);
      return `${n * num(p, 'sisiKotak')} × ${num(p, 'dalam')} × ${H} cm · ${clampInt(num(p, 'tingkat'), 2, 8)} baris kotak`;
    }
    if (m === 'lipat') return `${clampInt(num(p, 'jumlahPanel', 3), 2, 5)} panel × ${Math.round(num(p, 'panjang') / clampInt(num(p, 'jumlahPanel', 3), 2, 5))} cm, tinggi ${H} cm`;
    if (m === 'gantung') return `${num(p, 'panjang')} × ${num(p, 'tinggiPanel')} cm, digantung ${num(p, 'tinggiGantung')} cm dari lantai`;
    const plafon = m === 'plafon-grid' || m === 'plafon-bilah' ? ' (sampai plafon)' : '';
    return `${num(p, 'panjang')} × ${num(p, 'dalam')} × ${H} cm${plafon}${bool(p, 'roda') && TAPAK.includes(m) ? ' · beroda' : ''}`;
  },

  build: (p) => {
    const model = modelOf(p);
    const W = num(p, 'panjang', 120);
    const D = num(p, 'dalam', 30);
    const Hin = num(p, 'tinggi', 180);
    const Hp = num(p, 'tinggiPlafon', 270);
    const L = (parseInt(str(p, 'pipa', '30')) || 30) / 10;
    const b = BOARD_THICK[str(p, 'papan', 'kayu')] ?? 2.5;
    const tb = num(p, 'tinggiBawah', 8);
    const roda = bool(p, 'roda') && TAPAK.includes(model);
    const inch = parseInt(str(p, 'ukuranRoda', '3')) || 3;
    const c = roda ? casterHeight(inch) : 0;
    const t: [number, number] = [L * 10, L * 10];
    const rail: [number, number] = [20, 20];
    const thin: [number, number] = [15, 15];
    const bil: [number, number] = [20, 40]; // bilah: 2 cm dilihat dari depan, 4 cm ke samping
    const rh = 2;
    const { list, add, line } = memberFactory();
    const boards: Board[] = [];
    const hinges: FrameHinge[] = [];
    let casterPts: [number, number][] = [];

    // Kedalaman luar: kaki tapak / plat dasar bisa lebih lebar dari rak
    const lk = Math.max(num(p, 'lebarKaki', 50), D);
    const ps = Math.min(50, Math.max(25, num(p, 'lebarKaki', 40))); // sisi plat dasar
    let Dout = TAPAK.includes(model) ? lk : PLAT.includes(model) ? Math.max(D, ps) : D;
    const zc = Dout / 2;
    const zb = zc - D / 2 + L / 2; // as tiang belakang
    const zf = zc + D / 2 - L / 2; // as tiang depan
    const zLo = zc - D / 2;
    const zHi = zc + D / 2;
    let outW = W;
    let outH = Hin;

    /** Satu tingkat kotak di as tiang (x0..x1, z0..z1): 4 palang keliling + papan */
    const tier = (id: string, nm: string, x0: number, x1: number, y: number, withBoard: boolean) => {
      add(`${id}-depan`, 'x', x0 + L / 2, y, zf, x1 - x0 - L, 'rail-x', `Palang ${nm} depan`, rail);
      add(`${id}-belakang`, 'x', x0 + L / 2, y, zb, x1 - x0 - L, 'rail-x', `Palang ${nm} belakang`, rail);
      add(`${id}-kiri`, 'z', x0, y, zb + L / 2, zf - zb - L, 'rail-z', `Palang ${nm} kiri`, rail);
      add(`${id}-kanan`, 'z', x1, y, zb + L / 2, zf - zb - L, 'rail-z', `Palang ${nm} kanan`, rail);
      if (withBoard && b > 0) boards.push(board(`papan-${id}`, `Papan ${nm}`, x0 + L / 2, x1 - L / 2, y + rh / 2, y + rh / 2 + b, zLo, zHi));
    };
    /** Kaki tapak melintang di bawah tiang ujung (x) */
    const tapak = (x: number, nm: string) => {
      add(`tapak-${nm}`, 'z', x, c + L / 2, zc - lk / 2, lk, 'rail-z', `Kaki tapak ${nm}`, t);
      casterPts.push([x, zc - lk / 2 + 3], [x, zc + lk / 2 - 3]);
    };
    /** Plat besi kotak di lantai (y0 = 0) atau di plafon (y1 = Hp) */
    const plate = (id: string, label: string, x: number, z: number, side: number, y0: number, mm = 6) =>
      boards.push({ ...board(id, label, x - side / 2, x + side / 2, y0, y0 + mm / 10, z - side / 2, z + side / 2), steelMm: mm });
    /** Isi layar di bidang tengah antara muka dalam xa..xb dan ya..yb */
    const infill = (pattern: 'bilah' | 'kisi', xa: number, xb: number, ya: number, yb: number, s: number) => {
      if (pattern === 'bilah') {
        const n = Math.max(1, Math.round((xb - xa) / s) - 1);
        for (let i = 1; i <= n; i++) add(`bilah-${i}`, 'y', xa + ((xb - xa) * i) / (n + 1), ya, zc, yb - ya, 'custom', `Bilah tegak ${i}`, bil);
        return 2;
      }
      // kisi diagonal dua lapis: miring kanan di belakang, miring kiri di depan
      const w = xb - xa;
      const h = yb - ya;
      const step = s * Math.SQRT2;
      let k = 0;
      [1, -1].forEach((dir) => {
        const z = zc + (dir > 0 ? -0.75 : 0.75);
        // garis y - ya = dir * (x - xa) + k0, k0 dari -w ke h
        for (let k0 = -w + step / 2; k0 < h + w; k0 += step) {
          const pts: [number, number][] = [];
          const yAt = (x: number) => (dir > 0 ? k0 + (x - xa) : k0 + (xb - x));
          const xAt = (yy: number) => (dir > 0 ? xa + (yy - k0) : xb - (yy - k0));
          [xa, xb].forEach((x) => {
            const yy = yAt(x);
            if (yy >= 0 && yy <= h) pts.push([x, yy]);
          });
          [0, h].forEach((yy) => {
            const x = xAt(yy);
            if (x > xa && x < xb) pts.push([x, yy]);
          });
          if (pts.length < 2) continue;
          pts.sort((a, b2) => a[0] - b2[0]);
          const [a1, a2] = [pts[0], pts[pts.length - 1]];
          if (Math.hypot(a2[0] - a1[0], a2[1] - a1[1]) < 3) continue;
          k++;
          line(`kisi-${k}`, [r1(a1[0]), r1(ya + a1[1]), z], [r1(a2[0]), r1(ya + a2[1]), z], 'custom', `Kisi diagonal ${k}`, thin);
        }
      });
      return 1.5;
    };
    /** Ambalan dua muka: lengan di tiang ujung (x0, x1), rel menempel di muka layar, papan depan & belakang */
    const ambalan = (n: number, y0: number, y1: number, x0: number, x1: number, half: number, postHalf: number) => {
      if (n <= 0) return;
      const m = Math.max(half, postHalf);
      spread(y0, y1, n).forEach((y, i) => {
        const nm = `ambalan ${i + 1}`;
        [x0, x1].forEach((x, j) => {
          const s = j ? 'kanan' : 'kiri';
          add(`amb-${i}-lengan-${s}-b`, 'z', x, y, zLo + 1, zc - postHalf - zLo - 1, 'rail-z', `Lengan ${nm} ${s} belakang`, rail);
          add(`amb-${i}-lengan-${s}-d`, 'z', x, y, zc + postHalf, zHi - 1 - zc - postHalf, 'rail-z', `Lengan ${nm} ${s} depan`, rail);
        });
        const xs = x0 + 1;
        const len = x1 - x0 - 2;
        add(`amb-${i}-depan`, 'x', xs, y, zHi - 2, len, 'rail-x', `Palang ${nm} depan`, rail);
        add(`amb-${i}-belakang`, 'x', xs, y, zLo + 2, len, 'rail-x', `Palang ${nm} belakang`, rail);
        add(`amb-${i}-dalam-d`, 'x', xs, y, zc + m + 1, len, 'rail-x', `Palang ${nm} menempel layar depan`, rail);
        add(`amb-${i}-dalam-b`, 'x', xs, y, zc - m - 1, len, 'rail-x', `Palang ${nm} menempel layar belakang`, rail);
        if (b > 0) {
          boards.push(board(`papan-amb-${i}-d`, `Papan ${nm} depan`, x0 - 1, x1 + 1, y + rh / 2, y + rh / 2 + b, zc + m, zHi));
          boards.push(board(`papan-amb-${i}-b`, `Papan ${nm} belakang`, x0 - 1, x1 + 1, y + rh / 2, y + rh / 2 + b, zLo, zc - m));
        }
      });
    };

    if (model === 'grid' || model === 'plafon-grid') {
      const n = clampInt(num(p, 'kolom', 3), 1, 6);
      const m = clampInt(num(p, 'tingkat', 5), 2, 8);
      const plaf = model === 'plafon-grid';
      const xs = Array.from({ length: n + 1 }, (_, k) => L / 2 + ((W - L) * k) / n);
      const y0 = c + tb;
      const yTop = Math.min(Hin, plaf ? Hp - 25 : Hin) - rh / 2;
      const ys = spread(y0, yTop, m);
      const und = plaf ? 'rata' : str(p, 'undak', 'rata');
      const mk = xs.slice(0, n).map((_, k) => {
        if (und === 'naik') return n === 1 ? m : Math.max(2, Math.round(2 + ((m - 2) * k) / (n - 1)));
        if (und === 'puncak') {
          const dist = n === 1 ? 0 : Math.abs(k - (n - 1) / 2) / ((n - 1) / 2);
          return Math.max(2, Math.round(m - (m - 2) * dist * 0.7));
        }
        return m;
      });
      // tiang di tiap batas kolom
      xs.forEach((x, k) => {
        const lv = Math.max(k > 0 ? mk[k - 1] : 0, k < n ? mk[k] : 0);
        const end = k === 0 || k === n;
        const top = plaf ? Hp - 0.6 : ys[lv - 1] + rh / 2;
        const bot = plaf ? 0.6 : end ? c + L : y0 + rh / 2;
        const nm = k === 0 ? 'kiri' : k === n ? 'kanan' : `tengah ${k}`;
        [zb, zf].forEach((z, j) => {
          add(`tiang-${k}-${j}`, 'y', x, bot, z, top - bot, 'post', `Tiang ${nm} ${j ? 'depan' : 'belakang'}`, t);
          if (plaf) {
            plate(`plat-lantai-${k}-${j}`, `Plat lantai tiang ${nm}`, x, z, L + 4, 0);
            plate(`plat-plafon-${k}-${j}`, `Plat plafon tiang ${nm}`, x, z, L + 4, Hp - 0.6);
          }
        });
        // palang samping di batas kolom
        for (let i = 0; i < lv; i++) add(`samping-${k}-${i}`, 'z', x, ys[i], zb + L / 2, zf - zb - L, 'rail-z', `Palang samping ${nm} tingkat ${i + 1}`, rail);
        if (plaf) add(`samping-${k}-atas`, 'z', x, Hp - 15, zb + L / 2, zf - zb - L, 'rail-z', `Palang samping ${nm} atas`, rail);
      });
      if (!plaf) {
        // tingkat terbawah menerus (tumpuan tiang tengah)
        add('bawah-depan', 'x', L, y0, zf, W - 2 * L, 'rail-x', 'Palang bawah depan (menerus)', rail);
        add('bawah-belakang', 'x', L, y0, zb, W - 2 * L, 'rail-x', 'Palang bawah belakang (menerus)', rail);
        tapak(xs[0], 'kiri');
        tapak(xs[n], 'kanan');
      }
      for (let k = 0; k < n; k++) {
        const xa = xs[k] + L / 2;
        const len = xs[k + 1] - xs[k] - L;
        for (let i = 0; i < mk[k]; i++) {
          if (plaf || i > 0) {
            add(`k${k}-t${i}-depan`, 'x', xa, ys[i], zf, len, 'rail-x', `Palang kolom ${k + 1} tingkat ${i + 1} depan`, rail);
            add(`k${k}-t${i}-belakang`, 'x', xa, ys[i], zb, len, 'rail-x', `Palang kolom ${k + 1} tingkat ${i + 1} belakang`, rail);
          }
          if (b > 0) boards.push(board(`papan-k${k}-t${i}`, `Papan kolom ${k + 1} tingkat ${i + 1}`, xa, xs[k + 1] - L / 2, ys[i] + rh / 2, ys[i] + rh / 2 + b, zLo, zHi));
        }
        if (plaf) {
          add(`k${k}-atas-depan`, 'x', xa, Hp - 15, zf, len, 'rail-x', `Palang atas kolom ${k + 1} depan`, rail);
          add(`k${k}-atas-belakang`, 'x', xa, Hp - 15, zb, len, 'rail-x', `Palang atas kolom ${k + 1} belakang`, rail);
        }
      }
      outH = plaf ? Hp : Math.max(...mk.map((v) => ys[v - 1])) + rh / 2 + b;
    } else if (model === 'bilah' || model === 'plafon-bilah' || model === 'kisi') {
      // Dua tiang ujung di bidang tengah, rel atas & bawah, isi bilah / kisi, ambalan dua muka
      const plaf = model === 'plafon-bilah';
      const x0 = L / 2;
      const x1 = W - L / 2;
      const H = plaf ? Hp : Hin;
      const yPost0 = plaf ? 0.6 : model === 'kisi' ? 0.8 : c + L;
      const yPost1 = plaf ? Hp - 0.6 : H;
      [x0, x1].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        add(`tiang-${nm}`, 'y', x, yPost0, zc, yPost1 - yPost0, 'post', `Tiang ujung ${nm}`, t);
        if (model === 'bilah') tapak(x, nm);
        else if (model === 'kisi') plate(`plat-${nm}`, `Plat dasar ${nm} (dibaut ke lantai)`, x, zc, ps, 0, 8);
        else {
          plate(`plat-lantai-${nm}`, `Plat lantai ${nm}`, x, zc, L + 4, 0);
          plate(`plat-plafon-${nm}`, `Plat plafon ${nm}`, x, zc, L + 4, Hp - 0.6);
        }
      });
      const yBot = plaf ? 0.6 + L / 2 : model === 'kisi' ? tb : c + tb;
      const yTopR = yPost1 - L / 2;
      add('rel-bawah', 'x', L, yBot, zc, W - 2 * L, 'rail-x', plaf ? 'Rel lantai' : 'Rel bawah', t);
      add('rel-atas', 'x', L, yTopR, zc, W - 2 * L, 'rail-x', plaf ? 'Rel plafon' : 'Rel atas', t);
      const half = infill(model === 'kisi' ? 'kisi' : 'bilah', L, W - L, yBot + L / 2, yTopR - L / 2, num(p, 'jarakBilah', 10));
      const na = clampInt(num(p, 'ambalan', 2), 0, 4);
      const ya = plaf ? 70 : yBot + Math.max(35, (H - yBot) * 0.25);
      const yb2 = plaf ? Math.min(190, Hp - 60) : H - 35;
      ambalan(na, ya, na === 1 ? ya : yb2, x0, x1, half, L / 2);
      outH = plaf ? Hp : H;
    } else if (model === 'gantung') {
      const hp = num(p, 'tinggiPanel', 90);
      const yb = Math.min(num(p, 'tinggiGantung', 110), Hp - hp - 10);
      const yt = yb + hp;
      const x0 = L / 2;
      const x1 = W - L / 2;
      [x0, x1].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        add(`tiang-${nm}`, 'y', x, yb, zc, hp, 'post', `Tiang panel ${nm}`, t);
        add(`gantung-${nm}`, 'y', x, yt, zc, Hp - 0.5 - yt, 'custom', `Batang gantung ${nm}`, rail);
        plate(`plat-plafon-${nm}`, `Plat plafon ${nm}`, x, zc, 10, Hp - 0.5, 5);
      });
      add('rel-bawah', 'x', L, yb + L / 2, zc, W - 2 * L, 'rail-x', 'Rel bawah panel', t);
      add('rel-atas', 'x', L, yt - L / 2, zc, W - 2 * L, 'rail-x', 'Rel atas panel', t);
      if (W > 120) {
        add('gantung-tengah', 'y', W / 2, yt, zc, Hp - 0.5 - yt, 'custom', 'Batang gantung tengah', rail);
        plate('plat-plafon-tengah', 'Plat plafon tengah', W / 2, zc, 10, Hp - 0.5, 5);
      }
      const half = infill('bilah', L, W - L, yb + L, yt - L, num(p, 'jarakBilah', 10));
      const na = clampInt(num(p, 'ambalan', 1), 0, 2);
      ambalan(na, yb + Math.min(25, hp * 0.3), yt - Math.min(25, hp * 0.3), x0, x1, half, L / 2);
      outH = Hp;
    } else if (model === 'segitiga') {
      const m = clampInt(num(p, 'tingkat', 5), 2, 8);
      const ns = clampInt(num(p, 'segitiga', 3), 2, 6);
      const x0 = L / 2;
      const x1 = W - L / 2;
      const ys = spread(c + tb, Hin - rh / 2, m);
      [x0, x1].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        [zb, zf].forEach((z, j) => add(`tiang-${nm}-${j}`, 'y', x, c + L, z, Hin - c - L, 'post', `Tiang ${nm} ${j ? 'depan' : 'belakang'}`, t));
        tapak(x, nm);
      });
      const bz0 = zb - 1;
      const bz1 = zf + 1;
      ys.forEach((y, i) => {
        add(`t${i}-depan`, 'x', L, y, zf, W - 2 * L, 'rail-x', `Palang tingkat ${i + 1} depan`, rail);
        add(`t${i}-belakang`, 'x', L, y, zb, W - 2 * L, 'rail-x', `Palang tingkat ${i + 1} belakang`, rail);
        add(`t${i}-kiri`, 'z', x0, y, zb + L / 2, zf - zb - L, 'rail-z', `Palang tingkat ${i + 1} kiri`, rail);
        add(`t${i}-kanan`, 'z', x1, y, zb + L / 2, zf - zb - L, 'rail-z', `Palang tingkat ${i + 1} kanan`, rail);
        if (b > 0) boards.push(board(`papan-t${i}`, `Papan tingkat ${i + 1}`, x0 + L / 2, x1 - L / 2, y + rh / 2, y + rh / 2 + b, bz0, bz1));
      });
      // batang miring zig-zag menempel di muka luar palang depan & belakang
      const xa = L + 1;
      const xb = W - L - 1;
      for (let i = 0; i < m - 1; i++) {
        for (let j = 0; j < ns; j++) {
          const up = (i + j) % 2 === 0;
          const yA = up ? ys[i] : ys[i + 1];
          const yB = up ? ys[i + 1] : ys[i];
          // Ujung dipotong rata mendatar (menempel di palang). Dua batang yang bertemu di satu titik puncak
          // tidak boleh saling tembus: ujung tiap batang digeser menjauh dari titik puncak sejauh setengah
          // lebar tapak potongannya, sehingga kedua potongan duduk bersebelahan dan dilas di sisi masing-masing.
          const dxN = (xb - xa) / ns;
          const dyN = Math.abs(ys[i + 1] - ys[i]);
          const sin = dyN / Math.hypot(dxN, dyN);
          const sh = sin >= 0.35 ? thin[0] / 10 / 2 / sin + 0.1 : 0;
          const xL = xa + dxN * j + sh;
          const xR = xa + dxN * (j + 1) - sh;
          [
            [zf + 1 + 0.75, 'depan'],
            [zb - 1 - 0.75, 'belakang'],
          ].forEach(([z, s]) => line(`miring-${i}-${j}-${s}`, [xL, yA, z as number], [xR, yB, z as number], 'custom', `Batang segitiga tingkat ${i + 1} no. ${j + 1} ${s}`, thin));
        }
      }
      outH = Hin + b;
    } else if (model === 'louver') {
      const x0 = L / 2;
      const x1 = W - L / 2;
      const th = Math.max(15, Math.min(60, num(p, 'sudutBilah', 35))) * DEG;
      const pitch = Math.max(6, num(p, 'jarakBilah', 12));
      [x0, x1].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        [zb, zf].forEach((z, j) => add(`tiang-${nm}-${j}`, 'y', x, c + L, z, Hin - c - L, 'post', `Tiang ${nm} ${j ? 'depan' : 'belakang'}`, t));
        tapak(x, nm);
      });
      const y0 = c + tb;
      const yTop = Hin - rh / 2;
      tier('bawah', 'bawah', x0, x1, y0, false);
      tier('atas', 'atas', x0, x1, yTop, true);
      const span = zf - zb; // jarak as tiang depan–belakang
      const lz = (span - L) / Math.cos(th);
      const rise = lz * Math.sin(th);
      const yStart = y0 + rh / 2 + rise / 2 + 4;
      const yEnd = yTop - rh / 2 - rise / 2 - 4;
      const nl = Math.max(1, Math.floor((yEnd - yStart) / pitch) + 1);
      const ycs = spread(yStart, yEnd, nl);
      const nrm: [number, number] = [-Math.cos(th), Math.sin(th)]; // (y, z) arah bawah papan setelah diputar
      const dir: [number, number] = [Math.sin(th), Math.cos(th)]; // (y, z) arah memanjang papan
      ycs.forEach((yc, i) => {
        const off = b / 2 + 1;
        const cy = yc + nrm[0] * off;
        const cz = zc + nrm[1] * off;
        const hl = span / 2 / Math.cos(th);
        [L + 1, W - L - 1].forEach((x, j) =>
          line(`siku-${i}-${j}`, [x, r1(cy - dir[0] * hl), r1(cz - dir[1] * hl)], [x, r1(cy + dir[0] * hl), r1(cz + dir[1] * hl)], 'custom', `Siku miring papan ${i + 1} ${j ? 'kanan' : 'kiri'}`, rail)
        );
        if (b > 0) boards.push({ ...board(`jalusi-${i}`, `Papan miring ${i + 1}`, L, W - L, yc - b / 2, yc + b / 2, zc - lz / 2, zc + lz / 2), rotX: -th / DEG });
      });
      outH = Hin + b;
    } else if (model === 'kubus') {
      const s = num(p, 'sisiKotak', 35);
      const n = clampInt(num(p, 'kolom', 4), 1, 6);
      const m = clampInt(num(p, 'tingkat', 5), 2, 8);
      let q = 0;
      for (let r = 0; r < m; r++) {
        const odd = r % 2 === 1 && n > 1;
        const cnt = odd ? n - 1 : n;
        const y0 = r * s;
        for (let i = 0; i < cnt; i++) {
          q++;
          const xa = (odd ? s / 2 : 0) + i * s;
          const nm = `kotak ${q}`;
          const px = [xa + L / 2, xa + s - L / 2];
          px.forEach((x, a) => [zb, zf].forEach((z, j) => add(`q${q}-tiang-${a}-${j}`, 'y', x, y0, z, s, 'post', `Tiang ${nm}`, t)));
          [y0 + L / 2, y0 + s - L / 2].forEach((y, h) => {
            const lv = h ? 'atas' : 'bawah';
            add(`q${q}-${lv}-d`, 'x', xa + L, y, zf, s - 2 * L, 'rail-x', `Rusuk ${lv} depan ${nm}`, t);
            add(`q${q}-${lv}-b`, 'x', xa + L, y, zb, s - 2 * L, 'rail-x', `Rusuk ${lv} belakang ${nm}`, t);
            px.forEach((x, a) => add(`q${q}-${lv}-z${a}`, 'z', x, y, zb + L / 2, zf - zb - L, 'rail-z', `Rusuk ${lv} samping ${nm}`, t));
          });
          if (b > 0) boards.push(board(`papan-q${q}`, `Papan ${nm}`, xa + L, xa + s - L, y0 + L, y0 + L + b, zLo, zHi));
        }
      }
      outW = n * s;
      outH = m * s;
    } else if (model === 'lipat') {
      const np = clampInt(num(p, 'jumlahPanel', 3), 2, 5);
      const wp = W / np;
      const a = 30 * DEG;
      const H = Hin;
      const yb = tb;
      const yt = H - L / 2;
      // denah zig-zag: titik awal tiap panel
      let px = 0;
      let pz = 0;
      const panels: { a: [number, number]; d: [number, number] }[] = [];
      for (let i = 0; i < np; i++) {
        const ang = i % 2 ? -a : a;
        const d: [number, number] = [Math.cos(ang), Math.sin(ang)];
        panels.push({ a: [px, pz], d });
        px += d[0] * (wp + L * 0.2);
        pz += d[1] * (wp + L * 0.2);
      }
      const allX = panels.flatMap((q) => [q.a[0], q.a[0] + q.d[0] * wp]);
      const allZ = panels.flatMap((q) => [q.a[1], q.a[1] + q.d[1] * wp]);
      const ox = -Math.min(...allX) + L;
      const oz = -Math.min(...allZ) + L;
      panels.forEach((q, i) => {
        const P = (u: number): [number, number] => [r1(q.a[0] + ox + q.d[0] * u), r1(q.a[1] + oz + q.d[1] * u)];
        const [ax, az] = P(L / 2);
        const [bx, bz] = P(wp - L / 2);
        const nm = `panel ${i + 1}`;
        add(`p${i}-a`, 'y', ax, 0, az, H, 'post', `Tiang ${nm} kiri`, t);
        add(`p${i}-b`, 'y', bx, 0, bz, H, 'post', `Tiang ${nm} kanan`, t);
        const [rx0, rz0] = P(L);
        const [rx1, rz1] = P(wp - L);
        line(`p${i}-bawah`, [rx0, yb, rz0], [rx1, yb, rz1], 'rail-x', `Rel bawah ${nm}`, t);
        line(`p${i}-atas`, [rx0, yt, rz0], [rx1, yt, rz1], 'rail-x', `Rel atas ${nm}`, t);
        const nb = Math.max(1, Math.round((wp - 2 * L) / num(p, 'jarakBilah', 10)) - 1);
        for (let k = 1; k <= nb; k++) {
          const [x, z] = P(L + ((wp - 2 * L) * k) / (nb + 1));
          add(`p${i}-bilah-${k}`, 'y', x, yb + L / 2, z, yt - yb - L, 'custom', `Bilah ${nm} no. ${k}`, rail);
        }
        if (i > 0)
          hinges.push({ id: `engsel-${i}`, memberId: `p${i}-a`, partnerId: `p${i - 1}-b`, mode: 'edge', type: 'butt', pos: 0, side: 'end', foldAxis: 'z', foldSign: i % 2 ? 1 : -1, carry: true, label: `Engsel panel ${i} – ${i + 1}` });
      });
      outW = Math.max(...allX) + ox + L;
      Dout = Math.max(...allZ) + oz + L;
      outH = H;
    } else if (model === 'gapura') {
      const wt = Math.min(num(p, 'lebarMenara', 40), (W - 60) / 2);
      const m = clampInt(num(p, 'tingkat', 6), 2, 8);
      const hl = Math.min(num(p, 'tinggiLewat', 200), Hin - 20);
      const yTop = Hin - rh / 2;
      const towers: [number, number, string][] = [
        [L / 2, wt - L / 2, 'kiri'],
        [W - wt + L / 2, W - L / 2, 'kanan'],
      ];
      const ys = spread(tb, yTop, m);
      towers.forEach(([xa, xb, nm]) => {
        [xa, xb].forEach((x, a) => [zb, zf].forEach((z, j) => add(`tiang-${nm}-${a}-${j}`, 'y', x, 0, z, Hin, 'post', `Tiang menara ${nm} ${a ? 'dalam' : 'luar'} ${j ? 'depan' : 'belakang'}`, t)));
        ys.slice(0, -1).forEach((y, i) => tier(`${nm}-t${i}`, `menara ${nm} tingkat ${i + 1}`, xa, xb, y, true));
      });
      // tingkat teratas menerus di atas jalan lewat
      const segs: [number, number][] = [
        [L / 2, wt - L / 2],
        [wt - L / 2, W - wt + L / 2],
        [W - wt + L / 2, W - L / 2],
      ];
      segs.forEach(([xa, xb], k) => {
        add(`atas-${k}-depan`, 'x', xa + L / 2, yTop, zf, xb - xa - L, 'rail-x', `Palang atas depan ${k + 1}`, rail);
        add(`atas-${k}-belakang`, 'x', xa + L / 2, yTop, zb, xb - xa - L, 'rail-x', `Palang atas belakang ${k + 1}`, rail);
      });
      [L / 2, wt - L / 2, W - wt + L / 2, W - L / 2].forEach((x, k) => add(`atas-samping-${k}`, 'z', x, yTop, zb + L / 2, zf - zb - L, 'rail-z', `Palang atas samping ${k + 1}`, rail));
      if (b > 0) boards.push(board('papan-atas', 'Papan atas menerus', L / 2, W - L / 2, Hin, Hin + b, zLo, zHi));
      // lintasan: palang bawah di atas jalan lewat + papan rak lintasan
      const xi0 = wt - L / 2;
      const xi1 = W - wt + L / 2;
      add('lintas-depan', 'x', xi0 + L / 2, hl, zf, xi1 - xi0 - L, 'rail-x', 'Palang lintasan depan', rail);
      add('lintas-belakang', 'x', xi0 + L / 2, hl, zb, xi1 - xi0 - L, 'rail-x', 'Palang lintasan belakang', rail);
      if (!ys.some((y) => Math.abs(y - hl) < 3))
        [xi0, xi1].forEach((x, k) => add(`lintas-samping-${k}`, 'z', x, hl, zb + L / 2, zf - zb - L, 'rail-z', `Palang lintasan samping ${k ? 'kanan' : 'kiri'}`, rail));
      if (b > 0) boards.push(board('papan-lintas', 'Papan rak lintasan', xi0 + L / 2, xi1 - L / 2, hl + rh / 2, hl + rh / 2 + b, zLo, zHi));
      outH = Hin + b;
    } else {
      // tiang: tiang berjajar di plat dasar, papan selang-seling di lengan pendek
      const n = clampInt(num(p, 'kolom', 4), 2, 6);
      const m = clampInt(num(p, 'tingkat', 4), 2, 8);
      const xs = Array.from({ length: n + 1 }, (_, k) => L / 2 + ((W - L) * k) / n);
      const yBot = Math.max(tb, 8);
      xs.forEach((x, k) => {
        add(`tiang-${k}`, 'y', x, 0.8, zc, Hin - 0.8, 'post', `Tiang ${k + 1}`, t);
        plate(`plat-${k}`, `Plat dasar tiang ${k + 1} (dibaut ke lantai)`, x, zc, Math.min(ps, 35), 0, 8);
      });
      const sp = (Hin - yBot - 40) / m;
      for (let k = 0; k < n; k++) {
        const xa = xs[k] + L / 2;
        const xb2 = xs[k + 1] - L / 2;
        add(`rel-bawah-${k}`, 'x', xa, yBot, zc, xb2 - xa, 'rail-x', `Rel bawah kolom ${k + 1}`, t);
        add(`rel-atas-${k}`, 'x', xa, Hin - L / 2, zc, xb2 - xa, 'rail-x', `Rel atas kolom ${k + 1}`, t);
        const off = k % 2 ? sp / 2 : 0;
        for (let i = 0; i < m; i++) {
          const y = yBot + 22 + off + i * sp;
          if (y > Hin - 22) continue;
          const nm = `kolom ${k + 1} papan ${i + 1}`;
          add(`lengan-${k}-${i}-kiri`, 'z', xa + 1, y, zLo + 1, D - 2, 'rail-z', `Lengan ${nm} kiri`, rail);
          add(`lengan-${k}-${i}-kanan`, 'z', xb2 - 1, y, zLo + 1, D - 2, 'rail-z', `Lengan ${nm} kanan`, rail);
          if (b > 0) boards.push(board(`papan-${k}-${i}`, `Papan ${nm}`, xa, xb2, y + rh / 2, y + rh / 2 + b, zLo, zHi));
        }
      }
      outH = Hin;
    }

    const casters = roda ? casterPts.map(([x, z], i) => ({ id: `roda-${i}`, x, z, topY: c, sizeInch: inch, brake: true })) : [];
    return { members: list, boards, casters, W: r1(outW), D: r1(Dout), H: r1(outH), boardThick: 0, hinges: hinges.length ? hinges : undefined };
  },

  checks: (p) => {
    const out: ProductCheck[] = [];
    const m = modelOf(p);
    const W = num(p, 'panjang');
    const D = num(p, 'dalam');
    const H = heightOf(p);
    const Hp = num(p, 'tinggiPlafon');
    const lk = num(p, 'lebarKaki');
    const pipa = str(p, 'pipa', '30');
    if (TAPAK.includes(m) && H / Math.max(lk, D) > 4)
      out.push({ level: 'warn', message: 'Sekat tinggi dengan kaki tapak pendek mudah terguling bila tersenggol.', fix: { label: `Kaki tapak ${Math.min(80, Math.ceil(H / 3.8))} cm`, params: { lebarKaki: Math.min(80, Math.ceil(H / 3.8)) } } });
    if (PLAT.includes(m)) out.push({ level: 'info', message: 'Plat dasar wajib dibaut ke lantai (dynabolt / fischer) minimal 4 titik per plat.' });
    if (['grid', 'segitiga', 'louver', 'bilah', 'gapura', 'kisi', 'tiang'].includes(m) && H > 190 && pipa === '20')
      out.push({ level: 'warn', message: 'Tiang 20×20 terlalu ramping untuk sekat setinggi ini, terasa goyang.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
    if (m === 'grid' || m === 'plafon-grid') {
      const n = clampInt(num(p, 'kolom', 3), 1, 6);
      if (W / n > 100) out.push({ level: 'warn', message: 'Kotak lebih dari 1 meter: papan melendut kalau diisi buku.', fix: { label: `${Math.min(6, Math.ceil(W / 90))} kolom`, params: { kolom: Math.min(6, Math.ceil(W / 90)) } } });
    }
    if (['grid', 'plafon-grid', 'segitiga', 'gapura'].includes(m)) {
      const t = clampInt(num(p, 'tingkat', 5), 2, 8);
      const top = m === 'plafon-grid' ? Math.min(num(p, 'tinggi'), Hp - 25) : num(p, 'tinggi');
      const gap = (top - num(p, 'tinggiBawah')) / (t - 1);
      if (gap < 24) out.push({ level: 'warn', message: 'Jarak antar tingkat terlalu rapat, barang tidak muat.', fix: { label: `${Math.max(2, t - 1)} tingkat`, params: { tingkat: Math.max(2, t - 1) } } });
    }
    if (m === 'tiang') {
      const n = clampInt(num(p, 'kolom', 4), 2, 6);
      if (W / n > 90) out.push({ level: 'warn', message: 'Jarak antar tiang lebih dari 90 cm: papan melendut.', fix: { label: `${Math.min(6, Math.ceil(W / 80))} kolom`, params: { kolom: Math.min(6, Math.ceil(W / 80)) } } });
    }
    if (m === 'segitiga' && W / clampInt(num(p, 'segitiga', 3), 2, 6) < 20)
      out.push({ level: 'warn', message: 'Segitiga terlalu sempit, batang miring jadi hampir tegak.', fix: { label: '2 segitiga', params: { segitiga: 2 } } });
    if (bool(p, 'roda') && TAPAK.includes(m) && H > 185)
      out.push({ level: 'warn', message: 'Sekat beroda setinggi ini mudah terguling saat didorong.', fix: { label: 'Tanpa roda', params: { roda: false } } });
    if (m === 'plafon-grid' && num(p, 'tinggi') > Hp - 30)
      out.push({ level: 'warn', message: 'Bagian rak hampir menyentuh plafon; sisakan ruang untuk memasang plat atas.', fix: { label: `Rak ${Hp - 50} cm`, params: { tinggi: Math.max(120, Math.min(240, Hp - 50)) } } });
    if (PLAFON.includes(m)) out.push({ level: 'info', message: 'Ukur tinggi plafon di tiap titik tiang, plafon gypsum perlu rangka penguat / dibaut ke dak beton.' });
    if (m === 'gantung' && num(p, 'tinggiGantung') + num(p, 'tinggiPanel') > Hp - 15)
      out.push({ level: 'warn', message: 'Panel terlalu dekat ke plafon, batang gantung jadi terlalu pendek.', fix: { label: 'Turunkan panel', params: { tinggiGantung: Math.max(60, Hp - 30 - num(p, 'tinggiPanel')) } } });
    if (m === 'gantung' && num(p, 'tinggiGantung') < 190 && num(p, 'tinggiGantung') > 130)
      out.push({ level: 'info', message: 'Tepi bawah panel setinggi kepala: pasang di atas meja / konter, bukan di jalur orang lewat.' });
    if (m === 'gapura') {
      const lew = W - 2 * num(p, 'lebarMenara');
      if (lew < 80) out.push({ level: 'warn', message: 'Jalan lewat kurang dari 80 cm, sempit untuk dilewati.', fix: { label: `Lebar ${Math.min(240, 2 * num(p, 'lebarMenara') + 90)} cm`, params: { panjang: Math.min(240, 2 * num(p, 'lebarMenara') + 90) } } });
      if (num(p, 'tinggiLewat') > num(p, 'tinggi') - 20)
        out.push({ level: 'warn', message: 'Lintasan atas terlalu tipis, jalan lewat hampir setinggi sekat.', fix: { label: `Tinggi ${Math.min(240, num(p, 'tinggiLewat') + 30)} cm`, params: { tinggi: Math.min(240, num(p, 'tinggiLewat') + 30) } } });
      out.push({ level: 'info', message: 'Menara sebaiknya dibaut ke lantai atau plafon karena tinggi dan ramping.' });
    }
    if (m === 'kubus') out.push({ level: 'info', message: 'Tiap kotak dilas terpisah lalu dibaut ke kotak sebelahnya; bisa ditambah atau disusun ulang.' });
    if (m === 'lipat') {
      out.push({ level: 'info', message: 'Panel berdiri karena dibuka zig-zag; jangan dibentang lurus. Pasang karet di ujung tiang.' });
      if (num(p, 'panjang') / clampInt(num(p, 'jumlahPanel', 3), 2, 5) > 70)
        out.push({ level: 'warn', message: 'Panel lebih dari 70 cm berat dan mudah melintir di engsel.', fix: { label: `${Math.min(5, Math.ceil(num(p, 'panjang') / 60))} panel`, params: { jumlahPanel: Math.min(5, Math.ceil(num(p, 'panjang') / 60)) } } });
    }
    if (m === 'louver') out.push({ level: 'info', message: 'Papan miring dibaut dari bawah ke siku besi, bisa diganti satu per satu.' });
    if (['bilah', 'plafon-bilah', 'gantung', 'kisi'].includes(m) && clampInt(num(p, 'ambalan', 0), 0, 4) > 0 && D < 22)
      out.push({ level: 'warn', message: 'Rak terlalu tipis: ambalan tiap sisi kurang dari 10 cm.', fix: { label: 'Tebal 25 cm', params: { dalam: 25 } } });
    return out;
  },
};
