import { FrameHinge } from '../types/kitchen';
import { Board, Params, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, CASTER_OPTIONS, board, bool, casterHeight, casterSet, materialParams, memberFactory, num, r1, str } from './common';

/**
 * Jemuran & rak handuk. Semua berbasis BANYAK palang jemur sejajar tanpa papan (papan hanya alas keranjang).
 * Bentuk rangka (param `model`):
 * - kotak: 4 tiang tegak, ring atas penuh palang jemur sejajar, ring bawah; bisa 2 lapis palang, alas keranjang, roda
 * - para-para: tiang belakang tinggi & depan pendek, bidang jeruji miring menghadap matahari (jemur kerupuk / ikan)
 * - tiang-t: deret tiang di atas plat besi dibaut lantai, lengan T melintang di pucuk, palang panjang di atas lengan
 * - payung: satu tiang di plat bundar, 4 lengan miring naik bertopang, cincin palang persegi berlapis (bisa diputar)
 * - tenda: tiap ujung dua kaki miring bertemu di puncak, palang jemur berjajar di kedua lereng (lipat)
 * - sayap: kaki silang X di kedua ujung, bidang palang di atas + dua sayap berengsel di depan & belakang
 * - lengan-dinding: bingkai tembok, lengan-lengan tegak lurus tembok, tiap lengan berengsel dilipat turun
 * - gunting: rel tembok, rangka gunting (silang berderet) menjulur dari tembok, palang di tiap simpul atas
 * - plafon: dua rel plafon, 4 batang turun, bingkai palang jemur menggantung mendatar
 * - handuk-trapesium: dua rangka samping trapesium (bawah lebar, atas sempit), palang zig-zag depan-belakang
 * - handuk-kantilever: satu tiang di kaki T, palang menjulur ke satu sisi saja (sisir), untuk samping kasur / sofa
 */
const MODELS = [
  { value: 'kotak', label: 'Rangka kotak', desc: '4 tiang, palang sejajar di atas' },
  { value: 'para-para', label: 'Para-para miring', desc: 'Bidang jeruji miring, jemur kerupuk / ikan' },
  { value: 'tiang-t', label: 'Tiang T rooftop', desc: 'Deret tiang T dibaut lantai, palang panjang' },
  { value: 'payung', label: 'Payung putar', desc: 'Tiang tengah, cincin palang berlapis' },
  { value: 'tenda', label: 'Tenda kaki A', desc: 'Palang di kedua lereng, bisa dilipat' },
  { value: 'sayap', label: 'Sayap kaki X', desc: 'Kaki silang + dua sayap lipat' },
  { value: 'lengan-dinding', label: 'Lengan dinding lipat', desc: 'Lengan tegak lurus tembok, dilipat turun' },
  { value: 'gunting', label: 'Gunting dinding', desc: 'Rangka silang berderet, ditarik dari tembok' },
  { value: 'plafon', label: 'Gantung plafon', desc: 'Bingkai palang menggantung di 4 batang' },
  { value: 'handuk-trapesium', label: 'Handuk trapesium', desc: 'Samping trapesium, palang zig-zag' },
  { value: 'handuk-kantilever', label: 'Handuk kantilever', desc: 'Satu tiang, palang menjulur satu sisi' },
];
const KEYS = MODELS.map((m) => m.value);
const model = (p: Params) => {
  const m = str(p, 'model', 'kotak');
  return KEYS.includes(m) ? m : 'kotak';
};
const isM = (p: Params, ...m: string[]) => m.includes(model(p));
const has = (...m: string[]) => (p: Params) => m.includes(model(p));
const clampI = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(v)));

const RODA_MODELS = ['kotak', 'handuk-trapesium'];
const ALAS_MODELS = ['kotak', 'handuk-trapesium'];

export const JEMURAN: ProductDef = {
  id: 'jemuran',
  name: 'Jemuran & rak handuk',
  tagline: 'jemur baju · handuk · rooftop · kerupuk',
  icon: 'M4 12h52M8 18h44M12 24h36M14 12l16 22M46 12L30 34M10 34h40',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['model', 'panjang', 'dalam', 'tinggi'] },
    { id: 'bentuk', title: 'Palang', keys: ['palang', 'sayap', 'turun', 'tiang', 'lapis', 'alas'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Roda', keys: ['roda', 'ukuranRoda', 'remRoda'] },
  ],
  params: [
    { key: 'model', label: 'Bentuk rangka', type: 'choice', options: MODELS },
    {
      key: 'panjang',
      label: 'Panjang bentang',
      type: 'number',
      unit: 'cm',
      min: 40,
      max: 400,
      step: 1,
      help: 'Panjang palang jemur. Payung: lebar sisi cincin terluar.',
      marks: [{ value: 60, label: 'handuk' }, { value: 150, label: 'rumah' }, { value: 300, label: 'rooftop' }],
    },
    {
      key: 'dalam',
      label: 'Lebar / kedalaman',
      type: 'number',
      unit: 'cm',
      min: 20,
      max: 120,
      step: 1,
      help: 'Lebar kaki dari depan ke belakang. Dinding: seberapa jauh menjorok dari tembok.',
      marks: [{ value: 40, label: 'handuk' }, { value: 60, label: 'umum' }],
      showIf: (p) => p.model !== 'payung',
    },
    {
      key: 'tinggi',
      label: 'Tinggi palang jemur',
      type: 'number',
      unit: 'cm',
      min: 60,
      max: 250,
      step: 1,
      help: 'Tinggi palang paling atas dari lantai. Plafon & dinding: tinggi bingkai jemuran.',
      marks: [{ value: 90, label: 'handuk' }, { value: 120, label: 'jemuran' }, { value: 170, label: 'rooftop' }],
    },
    {
      key: 'palang',
      label: 'Jumlah palang',
      type: 'number',
      min: 2,
      max: 14,
      step: 1,
      help: 'Makin banyak makin muat cucian. Payung: jumlah cincin. Lengan dinding: jumlah lengan. Gunting: jumlah ruas.',
      marks: [{ value: 4, label: 'sedikit' }, { value: 8, label: 'keluarga' }],
    },
    { key: 'sayap', label: 'Lebar sayap', type: 'number', unit: 'cm', min: 20, max: 60, step: 1, help: 'Sayap dibuka mendatar di depan & belakang, dilipat turun saat tidak dipakai.', showIf: has('sayap') },
    { key: 'turun', label: 'Panjang batang gantung', type: 'number', unit: 'cm', min: 20, max: 100, step: 1, help: 'Jarak plafon ke bingkai jemuran.', showIf: has('plafon') },
    { key: 'tiang', label: 'Jumlah tiang', type: 'number', min: 2, max: 4, step: 1, help: 'Tambah tiang tengah untuk bentang panjang.', showIf: has('tiang-t') },
    { key: 'lapis', label: 'Dua lapis palang', type: 'toggle', help: 'Lapis kedua di bawah untuk baju pendek & kaos kaki.', showIf: has('kotak') },
    { key: 'alas', label: 'Alas keranjang', type: 'toggle', help: 'Papan di bawah untuk menaruh keranjang cucian.', showIf: has(...ALAS_MODELS) },
    ...materialParams(true),
    { key: 'roda', label: 'Pakai roda', type: 'toggle', help: 'Mudah digeser keluar-masuk saat hujan.', showIf: has(...RODA_MODELS) },
    { key: 'ukuranRoda', label: 'Ukuran roda', type: 'choice', options: CASTER_OPTIONS, showIf: (p) => p.roda === true && RODA_MODELS.includes(model(p)) },
    { key: 'remRoda', label: 'Roda dengan rem', type: 'toggle', showIf: (p) => p.roda === true && RODA_MODELS.includes(model(p)) },
  ],
  defaults: {
    model: 'kotak',
    panjang: 150,
    dalam: 60,
    tinggi: 120,
    palang: 6,
    sayap: 40,
    turun: 50,
    tiang: 2,
    lapis: false,
    alas: false,
    pipa: '20',
    papan: 'kayu',
    warna: '#1f2226',
    roda: false,
    ukuranRoda: '3',
    remRoda: true,
  },
  groups: [
    { id: 'jemuran-berdiri', name: 'Jemuran berdiri', desc: 'Jemuran lantai: rangka kotak, para-para, tiang rooftop, payung putar' },
    { id: 'jemuran-lipat', name: 'Jemuran lipat', desc: 'Jemuran tenda kaki A atau bersayap engsel yang bisa dilipat' },
    { id: 'jemuran-dinding', name: 'Dinding & plafon', desc: 'Lengan atau gunting menempel tembok, bingkai gantung plafon' },
    { id: 'rak-handuk', name: 'Rak handuk', desc: 'Palang handuk berdiri untuk kamar mandi & kamar tidur' },
  ],
  signature: (p) => `jemuran:${model(p)}`,
  presets: [
    {
      id: 'rangka-kotak',
      group: 'jemuran-berdiri',
      name: 'Jemuran rangka kotak',
      desc: '4 tiang tegak, ring atas penuh palang sejajar, ring bawah',
      params: { model: 'kotak', panjang: 150, dalam: 60, tinggi: 120, palang: 6 },
      sizes: [
        { label: 'Teras rumah', desc: '150 × 60 × 120 cm, 6 palang', params: { panjang: 150, dalam: 60, tinggi: 120, palang: 6 } },
        { label: 'Kamar kos', desc: '100 × 50 × 110 cm, alas keranjang', params: { panjang: 100, dalam: 50, tinggi: 110, palang: 5, alas: true } },
        { label: 'Rooftop 2 lapis', desc: '200 × 70 × 160 cm', params: { panjang: 200, dalam: 70, tinggi: 160, palang: 8, lapis: true, pipa: '30' } },
        { label: 'Laundry beroda', desc: '150 × 60 × 150 cm, 2 lapis', params: { panjang: 150, dalam: 60, tinggi: 150, palang: 7, lapis: true, roda: true } },
      ],
    },
    {
      id: 'tiang-t',
      group: 'jemuran-berdiri',
      name: 'Jemuran tiang T rooftop',
      desc: 'deret tiang di plat besi dibaut lantai, lengan T melintang, palang panjang di atas lengan',
      params: { model: 'tiang-t', panjang: 250, dalam: 60, tinggi: 170, palang: 5, tiang: 2, pipa: '30' },
      sizes: [
        { label: 'Rooftop rumah', desc: '250 cm, 2 tiang, 5 palang', params: { panjang: 250, dalam: 60, tinggi: 170, palang: 5, tiang: 2 } },
        { label: 'Laundry kiloan', desc: '400 cm, 3 tiang, 6 palang', params: { panjang: 400, dalam: 80, tinggi: 180, palang: 6, tiang: 3 } },
        { label: 'Halaman sempit', desc: '180 cm, 2 tiang, 4 palang', params: { panjang: 180, dalam: 50, tinggi: 165, palang: 4, tiang: 2 } },
      ],
    },
    {
      id: 'payung-putar',
      group: 'jemuran-berdiri',
      name: 'Jemuran payung putar',
      desc: 'satu tiang di plat bundar, 4 lengan miring naik bertopang, cincin palang persegi berlapis',
      params: { model: 'payung', panjang: 180, tinggi: 170, palang: 4, pipa: '30' },
      sizes: [
        { label: 'Halaman rumah', desc: 'lebar 180 cm, 4 cincin', params: { panjang: 180, tinggi: 170, palang: 4 } },
        { label: 'Besar', desc: 'lebar 240 cm, 5 cincin', params: { panjang: 240, tinggi: 180, palang: 5 } },
        { label: 'Balkon', desc: 'lebar 120 cm, 3 cincin', params: { panjang: 120, tinggi: 160, palang: 3 } },
      ],
    },
    {
      id: 'sayap-x',
      group: 'jemuran-lipat',
      name: 'Jemuran sayap kaki X',
      desc: 'kaki silang X di kedua ujung, bidang palang di atas, dua sayap berengsel depan & belakang',
      params: { model: 'sayap', panjang: 120, dalam: 50, tinggi: 100, palang: 5, sayap: 40 },
      sizes: [
        { label: 'Rumah', desc: '120 × 50 cm, sayap 40', params: { panjang: 120, dalam: 50, tinggi: 100, palang: 5, sayap: 40 } },
        { label: 'Besar', desc: '160 × 60 cm, sayap 45', params: { panjang: 160, dalam: 60, tinggi: 105, palang: 6, sayap: 45 } },
        { label: 'Apartemen', desc: '90 × 40 cm, sayap 30', params: { panjang: 90, dalam: 40, tinggi: 95, palang: 4, sayap: 30 } },
      ],
    },
    {
      id: 'lengan-dinding',
      group: 'jemuran-dinding',
      name: 'Jemuran lengan dinding lipat',
      desc: 'bingkai dibaut tembok, lengan-lengan tegak lurus tembok, tiap lengan berengsel dilipat turun',
      params: { model: 'lengan-dinding', panjang: 100, dalam: 50, tinggi: 170, palang: 5 },
      sizes: [
        { label: 'Kamar mandi / dapur', desc: '100 cm, 5 lengan 50 cm', params: { panjang: 100, dalam: 50, tinggi: 170, palang: 5 } },
        { label: 'Lorong jemur', desc: '150 cm, 7 lengan 60 cm', params: { panjang: 150, dalam: 60, tinggi: 180, palang: 7 } },
        { label: 'Handuk', desc: '60 cm, 3 lengan 40 cm', params: { panjang: 60, dalam: 40, tinggi: 150, palang: 3 } },
      ],
    },
    {
      id: 'gunting-dinding',
      group: 'jemuran-dinding',
      name: 'Jemuran gunting dinding',
      desc: 'rangka gunting silang berderet menjulur dari rel tembok, palang di tiap simpul atas',
      params: { model: 'gunting', panjang: 80, dalam: 60, tinggi: 170, palang: 4 },
      sizes: [
        { label: 'Balkon', desc: '80 cm, tarik 60 cm, 4 ruas', params: { panjang: 80, dalam: 60, tinggi: 170, palang: 4 } },
        { label: 'Lebar', desc: '120 cm, tarik 80 cm, 5 ruas', params: { panjang: 120, dalam: 80, tinggi: 175, palang: 5 } },
        { label: 'Kecil', desc: '60 cm, tarik 45 cm, 3 ruas', params: { panjang: 60, dalam: 45, tinggi: 160, palang: 3 } },
      ],
    },
    {
      id: 'gantung-plafon',
      group: 'jemuran-dinding',
      name: 'Jemuran gantung plafon',
      desc: 'dua rel plafon, 4 batang turun, bingkai palang jemur menggantung mendatar',
      params: { model: 'plafon', panjang: 150, dalam: 50, tinggi: 200, palang: 6, turun: 50 },
      sizes: [
        { label: 'Teras / balkon', desc: '150 × 50 cm, 6 palang', params: { panjang: 150, dalam: 50, tinggi: 200, palang: 6, turun: 50 } },
        { label: 'Ruang cuci', desc: '200 × 60 cm, 8 palang', params: { panjang: 200, dalam: 60, tinggi: 210, palang: 8, turun: 60 } },
        { label: 'Kamar mandi', desc: '90 × 40 cm, 4 palang', params: { panjang: 90, dalam: 40, tinggi: 190, palang: 4, turun: 40 } },
      ],
    },
    {
      id: 'handuk-trapesium',
      group: 'rak-handuk',
      name: 'Rak handuk trapesium',
      desc: 'dua rangka samping trapesium (bawah lebar, atas sempit), palang zig-zag depan-belakang',
      params: { model: 'handuk-trapesium', panjang: 70, dalam: 40, tinggi: 90, palang: 4 },
      sizes: [
        { label: 'Kamar mandi', desc: '70 × 40 × 90 cm, 4 palang', params: { panjang: 70, dalam: 40, tinggi: 90, palang: 4 } },
        { label: 'Keluarga + keranjang', desc: '90 × 45 × 110 cm, 6 palang', params: { panjang: 90, dalam: 45, tinggi: 110, palang: 6, alas: true } },
        { label: 'Sempit', desc: '50 × 35 × 80 cm, 3 palang', params: { panjang: 50, dalam: 35, tinggi: 80, palang: 3 } },
      ],
    },
    {
      id: 'handuk-kantilever',
      group: 'rak-handuk',
      name: 'Rak handuk kantilever',
      desc: 'satu tiang di kaki T, palang menjulur ke satu sisi saja seperti sisir',
      params: { model: 'handuk-kantilever', panjang: 60, dalam: 40, tinggi: 90, palang: 4 },
      sizes: [
        { label: 'Samping bak / kasur', desc: 'lengan 60 cm, 4 palang', params: { panjang: 60, dalam: 40, tinggi: 90, palang: 4 } },
        { label: 'Hotel / spa', desc: 'lengan 70 cm, 5 palang', params: { panjang: 70, dalam: 40, tinggi: 110, palang: 5 } },
        { label: 'Mini', desc: 'lengan 45 cm, 3 palang', params: { panjang: 45, dalam: 30, tinggi: 75, palang: 3 } },
      ],
    },
  ],
  summary: (p) => {
    const n = num(p, 'palang');
    if (isM(p, 'payung')) return `lebar ${num(p, 'panjang')} cm · tinggi ${num(p, 'tinggi')} cm · ${clampI(n, 2, 6)} cincin`;
    if (isM(p, 'lengan-dinding')) return `${num(p, 'panjang')} cm · ${clampI(n, 2, 12)} lengan ${num(p, 'dalam')} cm`;
    if (isM(p, 'gunting')) return `${num(p, 'panjang')} cm · tarik ${num(p, 'dalam')} cm · ${clampI(n, 2, 6)} ruas`;
    return `${num(p, 'panjang')} × ${num(p, 'dalam')} × ${num(p, 'tinggi')} cm · ${n} palang${isM(p, 'tenda') ? ' per sisi' : ''}${bool(p, 'roda') && isM(p, ...RODA_MODELS) ? ' · beroda' : ''}`;
  },

  build: (p) => {
    const m = model(p);
    const W = num(p, 'panjang', 150);
    const D = num(p, 'dalam', 60);
    const H = num(p, 'tinggi', 120);
    const n = Math.max(2, Math.round(num(p, 'palang', 6)));
    const L = (parseInt(str(p, 'pipa', '20')) || 20) / 10;
    const b = BOARD_THICK[str(p, 'papan', 'kayu')] ?? 2.5;
    const roda = bool(p, 'roda') && RODA_MODELS.includes(m);
    const alas = bool(p, 'alas') && ALAS_MODELS.includes(m);
    const inch = parseInt(str(p, 'ukuranRoda', '3')) || 3;
    const c = roda ? casterHeight(inch) : 0;
    const pt: [number, number] = [L * 10, L * 10];
    const rail: [number, number] = [20, 20];
    const thin: [number, number] = [15, 15];
    /** Palang jemur: 20×20, jadi 20×40 bila bentang bebasnya > 150 cm */
    const jem = (span: number): [number, number] => (span > 150 ? [20, 40] : [20, 20]);
    const { list, add, line } = memberFactory();
    const boards: Board[] = [];
    const hinges: FrameHinge[] = [];
    let outW = W;
    let outD = D;
    let outH = H;
    let wall = false;
    let casterXs: number[] = [];
    let casterZs: number[] = [];
    /** 4 palang keliling di as tiang (x0..x1, z0..z1) */
    const ring = (id: string, nm: string, x0: number, x1: number, z0: number, z1: number, y: number, tube: [number, number]) => {
      add(`${id}-depan`, 'x', x0 + L / 2, y, z1, x1 - x0 - L, 'rail-x', `Palang ${nm} depan`, tube);
      add(`${id}-belakang`, 'x', x0 + L / 2, y, z0, x1 - x0 - L, 'rail-x', `Palang ${nm} belakang`, tube);
      add(`${id}-kiri`, 'z', x0, y, z0 + L / 2, z1 - z0 - L, 'rail-z', `Palang ${nm} kiri`, tube);
      add(`${id}-kanan`, 'z', x1, y, z0 + L / 2, z1 - z0 - L, 'rail-z', `Palang ${nm} kanan`, tube);
    };
    type P3 = [number, number, number];
    /**
     * Setengah lebar jejak potongan rata lantai (horizontal) batang miring dari a ke b, diukur mendatar searah batang.
     * Batang miring yang cukup tegak dipotong rata lantai di kedua ujung, jadi jejaknya melebar (h/2)/sin(sudut).
     */
    const footHalf = (a: P3, b: P3, tube: [number, number]) => {
      const hl = Math.hypot(b[0] - a[0], b[2] - a[2]);
      const dy = Math.abs(b[1] - a[1]) || 1e-6;
      return (tube[1] / 20) * (Math.hypot(hl, dy) / dy);
    };
    /**
     * Penguat miring cara tukang las: a = titik di sisi batang tegak tempat tepi bawah potongan menempel
     * (bukan as batang), b = tengah potongan atas yang menempel rata di bawah palang/lengan. Titik awal as
     * digeser mendatar searah batang setengah lebar jejaknya, jadi ujung bawah tidak masuk ke dalam tiang.
     */
    const strut = (id: string, a: P3, b: P3, label: string, tube: [number, number]) => {
      let s: P3 = [...a];
      for (let i = 0; i < 4; i++) {
        const hl = Math.hypot(b[0] - s[0], b[2] - s[2]) || 1e-6;
        const off = footHalf(s, b, tube) + 0.1;
        s = [a[0] + ((b[0] - s[0]) / hl) * off, a[1], a[2] + ((b[2] - s[2]) / hl) * off];
      }
      line(id, s, b, 'custom', label, tube);
    };
    /** z merata di antara za..zb (tidak termasuk ujung) */
    const spread = (cnt: number, za: number, zb: number) => Array.from({ length: cnt }, (_, k) => za + ((zb - za) * (k + 1)) / (cnt + 1));

    if (m === 'kotak') {
      const x0 = L / 2;
      const x1 = W - L / 2;
      const z0 = L / 2;
      const z1 = D - L / 2;
      [x0, x1].forEach((x, i) => [z0, z1].forEach((z, j) => add(`tiang-${i}-${j}`, 'y', x, c, z, H - c, 'post', `Tiang ${i ? 'kanan' : 'kiri'} ${j ? 'depan' : 'belakang'}`, pt)));
      const tube = jem(W - 2 * L);
      const levels: { id: string; nm: string; y: number; shift: number }[] = [{ id: 'atas', nm: 'atas', y: H - L / 2, shift: 0 }];
      if (bool(p, 'lapis')) levels.push({ id: 'tengah', nm: 'lapis bawah', y: Math.max(c + 50, H - 40), shift: 0.5 });
      levels.forEach((lv) => {
        ring(`ring-${lv.id}`, lv.nm, x0, x1, z0, z1, lv.y, pt);
        // lapis bawah: satu palang lebih sedikit sehingga posisinya selang-seling dengan lapis atas
        const zs = lv.shift ? spread(Math.max(1, n - 1), z0, z1) : spread(n, z0, z1);
        zs.forEach((z, k) => add(`jemur-${lv.id}-${k + 1}`, 'x', x0 + L / 2, lv.y, z, x1 - x0 - L, 'custom', `Palang jemur ${lv.nm} ${k + 1}`, tube));
      });
      const yB = c + 15;
      ring('ring-bawah', 'bawah', x0, x1, z0, z1, yB, rail);
      if (alas && b > 0) boards.push(board('papan-alas', 'Alas keranjang', L, W - L, yB + 1, yB + 1 + b, z0, z1));
      casterXs = [x0, x1];
      casterZs = [z0, z1];
    } else if (m === 'para-para') {
      // Bidang jeruji miring: tiang belakang setinggi H, depan lebih pendek
      const Hb = H;
      const Hf = Math.max(40, Math.round(H - D * 0.6));
      const x0 = L / 2;
      const x1 = W - L / 2;
      const z0 = L / 2;
      const z1 = D - L / 2;
      [x0, x1].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        add(`tiang-${i}-b`, 'y', x, 0, z0, Hb, 'post', `Tiang ${nm} belakang`, pt);
        add(`tiang-${i}-d`, 'y', x, 0, z1, Hf, 'post', `Tiang ${nm} depan`, pt);
        line(`miring-${i}`, [x, Hf - L / 2, z1], [x, Hb - L / 2, z0], 'rail-z', `Rangka miring ${nm}`, pt);
      });
      add('tepi-belakang', 'x', L, Hb - L / 2, z0, W - 2 * L, 'rail-x', 'Palang tepi atas belakang', pt);
      add('tepi-depan', 'x', L, Hf - L / 2, z1, W - 2 * L, 'rail-x', 'Palang tepi bawah depan', pt);
      const tube = jem(W - 2 * L);
      for (let k = 1; k <= n; k++) {
        const t = k / (n + 1);
        const z = z1 - (z1 - z0) * t;
        const y = Hf - L / 2 + (Hb - Hf) * t + L / 2 + 1;
        add(`jemur-${k}`, 'x', 0, y, z, W, 'custom', `Jeruji alas jemur ${k}`, tube);
      }
      ring('ring-bawah', 'bawah', x0, x1, z0, z1, 20, rail);
      outH = Hb + 2;
    } else if (m === 'tiang-t') {
      // Tiang di plat besi dibaut lantai, lengan T melintang, palang panjang di atas lengan
      const nT = clampI(num(p, 'tiang', 2), 2, 4);
      const zc = D / 2;
      const xs = Array.from({ length: nT }, (_, i) => L / 2 + ((W - L) * i) / (nT - 1));
      const plat = 0.8;
      xs.forEach((x, i) => {
        boards.push({ ...board(`plat-${i}`, `Plat dasar tiang ${i + 1}`, x - 10, x + 10, 0, plat, zc - 10, zc + 10), steelMm: 8 });
        add(`tiang-${i}`, 'y', x, plat, zc, H - plat - L, 'post', `Tiang ${i + 1}`, pt);
        add(`lengan-${i}`, 'z', x, H - L / 2, 0, D, 'rail-z', `Lengan T tiang ${i + 1}`, pt);
        // penguat: ujung bawah menempel di sisi tiang, ujung atas rata di bawah lengan T
        [-1, 1].forEach((s, j) =>
          strut(`penguat-${i}-${j}`, [x, H - 35, zc + (s * L) / 2], [x, H - L, zc + s * Math.min(D / 2 - 4, D * 0.35)], `Penguat lengan tiang ${i + 1} ${j ? 'depan' : 'belakang'}`, thin)
        );
      });
      const tube = jem((W - L) / (nT - 1));
      const yJ = H + tube[1] / 20;
      spread(n, 0, D).forEach((z, k) => add(`jemur-${k + 1}`, 'x', 0, yJ, z, W, 'custom', `Palang jemur ${k + 1}`, tube));
      outH = H + tube[1] / 10;
    } else if (m === 'payung') {
      // Tiang tengah di plat bundar, 4 lengan miring naik, cincin persegi berlapis
      const R = W / 2;
      const cc = R;
      const plat = 0.8;
      const pr = Math.min(30, Math.max(22, R * 0.25));
      boards.push({ ...board('plat-dasar', 'Plat dasar bundar', cc - pr, cc + pr, 0, plat, cc - pr, cc + pr), shape: 'round', steelMm: 8 });
      const Hp = H - 15 - L;
      add('tiang', 'y', cc, plat, cc, Hp - plat, 'post', 'Tiang tengah (bisa diputar)', pt);
      // Cara tukang las: 4 lengan dilas tegak lurus di keempat sisi pucuk tiang (ujung lengan dipotong rata
      // menempel di sisi tiang), naik sedikit ke luar. Cincin palang persegi DITUMPUK di atas lengan, bukan
      // menembus lengan: sisi depan/belakang menerus, sisi kiri/kanan dipotong rata di antaranya.
      const nR = clampI(n, 2, 6);
      const ra = rail[1] / 20; // setengah tebal lengan
      const rh = thin[0] / 20; // setengah tebal palang cincin
      const s0 = L / 2; // lengan mulai di sisi tiang
      const dOut = R - rh; // as sisi cincin terluar (tepi luarnya di R)
      let k = 0.2;
      let yS = Hp - ra;
      for (let i = 0; i < 4; i++) {
        const sec = Math.sqrt(1 + k * k); // 1/cos kemiringan lengan
        yS = Hp - ra * sec - 0.05; // jejak ujung lengan masih di dalam sisi tiang
        k = (H - 2 * rh - ra * sec - yS) / (dOut - s0);
      }
      const sec = Math.sqrt(1 + k * k);
      const armY = (s: number) => yS + k * (s - s0); // as lengan pada jarak s dari as tiang
      const dirs: [number, number][] = [[1, 0], [0, 1], [-1, 0], [0, -1]];
      dirs.forEach(([dx, dz], j) => {
        line(`lengan-${j + 1}`, [cc + dx * s0, yS, cc + dz * s0], [cc + dx * R, armY(R), cc + dz * R], 'custom', `Lengan miring ${j + 1}`, rail);
        const st = R * 0.45;
        strut(`topang-${j + 1}`, [cc + dx * s0, Hp - 40, cc + dz * s0], [cc + dx * st, armY(st) - ra * sec, cc + dz * st], `Topang lengan ${j + 1}`, thin);
      });
      for (let r = 1; r <= nR; r++) {
        const d = (0.25 + (0.75 * r) / nR) * dOut;
        const y = armY(d) + ra * sec + rh; // duduk di atas lengan
        add(`jemur-${r}-1`, 'x', cc - d - rh, y, cc + d, 2 * d + 2 * rh, 'custom', `Cincin palang ${r} sisi 1`, thin);
        add(`jemur-${r}-2`, 'z', cc - d, y, cc - d + rh, 2 * d - 2 * rh, 'custom', `Cincin palang ${r} sisi 2`, thin);
        add(`jemur-${r}-3`, 'x', cc - d - rh, y, cc - d, 2 * d + 2 * rh, 'custom', `Cincin palang ${r} sisi 3`, thin);
        add(`jemur-${r}-4`, 'z', cc + d, y, cc - d + rh, 2 * d - 2 * rh, 'custom', `Cincin palang ${r} sisi 4`, thin);
      }
      outD = W;
    } else if (m === 'tenda') {
      // Tiap ujung rangka A; palang jemur di lereng belakang & depan
      const zc = D / 2;
      const yA = H - L / 2;
      const zl = (y: number) => L / 2 + ((zc - L / 2) * y) / yA; // as kaki belakang pada tinggi y
      [L / 2, W - L / 2].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        line(`kaki-${i}-b`, [x, 0, L / 2], [x, yA, zc], 'post', `Kaki ${nm} belakang (miring)`, pt);
        line(`kaki-${i}-d`, [x, 0, D - L / 2], [x, yA, zc], 'post', `Kaki ${nm} depan (miring)`, pt);
        const yp = 14;
        add(`penahan-${i}`, 'z', x, yp, zl(yp) + L / 2, D - 2 * zl(yp) - L, 'rail-z', `Palang penahan buka ${nm}`, thin);
      });
      add('puncak', 'x', 0, yA, zc, W, 'rail-x', 'Palang puncak (engsel lipat)', pt);
      const tube = jem(W - L);
      const off = L / 2 + 1;
      for (let k = 0; k < n; k++) {
        const y = 28 + ((yA - 18 - 28) * k) / Math.max(1, n - 1);
        const zb = zl(y);
        add(`jemur-b-${k + 1}`, 'x', 0, y, zb - off, W, 'custom', `Palang jemur belakang ${k + 1}`, tube);
        add(`jemur-d-${k + 1}`, 'x', 0, y, D - zb + off, W, 'custom', `Palang jemur depan ${k + 1}`, tube);
      }
      outH = H;
    } else if (m === 'sayap') {
      // Kaki silang X di kedua ujung, bidang palang di atas, sayap engsel depan & belakang
      const S = Math.max(20, num(p, 'sayap', 40));
      const zo = S; // bidang utama digeser supaya sayap belakang tidak minus
      const yT = H - L / 2;
      const zb = zo + L / 2;
      const zf = zo + D - L / 2;
      // Kaki silang seperti engsel gunting: dua kaki bersebelahan (kaki 2 digeser ke dalam setebal pipa),
      // dibaut di titik silang, bukan saling tembus. Ujung atas rata di bawah rangka atas.
      const yK = yT - L / 2;
      [L / 2, W - L / 2].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        const xi = x + (i ? -L : L);
        line(`kaki-${i}-a`, [x, 0, zb], [x, yK, zf], 'post', `Kaki silang ${nm} 1`, pt);
        line(`kaki-${i}-b`, [xi, 0, zf], [xi, yK, zb], 'post', `Kaki silang ${nm} 2`, pt);
      });
      add('rangka-belakang', 'x', 0, yT, zb, W, 'rail-x', 'Rangka atas belakang', pt);
      add('rangka-depan', 'x', 0, yT, zf, W, 'rail-x', 'Rangka atas depan', pt);
      add('rangka-kiri', 'z', L / 2, yT, zb + L / 2, D - 2 * L, 'rail-z', 'Rangka atas kiri', pt);
      add('rangka-kanan', 'z', W - L / 2, yT, zb + L / 2, D - 2 * L, 'rail-z', 'Rangka atas kanan', pt);
      // palang silang dipotong rata di antara kedua kaki dalam
      add('palang-silang', 'x', 2 * L, yK / 2, zo + D / 2, W - 4 * L, 'rail-x', 'Palang di titik silang', rail);
      const tube = jem(W - 2 * L);
      spread(n, zb, zf).forEach((z, k) => add(`jemur-${k + 1}`, 'x', L, yT, z, W - 2 * L, 'custom', `Palang jemur tengah ${k + 1}`, tube));
      const ns = Math.max(1, Math.round(S / 15));
      // Sayap: rangka 20×20 menempel di luar rangka depan / belakang
      [
        { id: 'depan', zi: zo + D + 1, zo2: zo + D + S - 1, sign: 1 },
        { id: 'belakang', zi: zo - 1, zo2: 1, sign: -1 },
      ].forEach((w) => {
        const zMin = Math.min(w.zi, w.zo2);
        add(`sayap-${w.id}-dalam`, 'x', 0, yT, w.zi, W, 'rail-x', `Sayap ${w.id}: rangka dalam (engsel)`, rail);
        add(`sayap-${w.id}-luar`, 'x', 0, yT, w.zo2, W, 'rail-x', `Sayap ${w.id}: rangka luar`, rail);
        add(`sayap-${w.id}-kiri`, 'z', 1, yT, zMin + 1, S - 4, 'rail-z', `Sayap ${w.id}: rangka kiri`, rail);
        add(`sayap-${w.id}-kanan`, 'z', W - 1, yT, zMin + 1, S - 4, 'rail-z', `Sayap ${w.id}: rangka kanan`, rail);
        spread(ns, w.zi, w.zo2).forEach((z, k) => add(`jemur-${w.id}-${k + 1}`, 'x', 2, yT, z, W - 4, 'custom', `Palang jemur sayap ${w.id} ${k + 1}`, tube));
        hinges.push({
          id: `engsel-sayap-${w.id}`,
          memberId: `sayap-${w.id}-dalam`,
          partnerId: w.sign > 0 ? 'rangka-depan' : 'rangka-belakang',
          mode: 'edge',
          type: 'folding-lock',
          pos: 0,
          side: 'end',
          foldAxis: 'y',
          foldSign: -1,
          carry: true,
          label: `Engsel sayap ${w.id} (dilipat turun)`,
        });
      });
      outD = D + 2 * S;
    } else if (m === 'lengan-dinding') {
      // Bingkai tembok + lengan tegak lurus tembok, tiap lengan berengsel
      wall = true;
      const yT = H;
      const yB = H - 25;
      [L / 2, W - L / 2].forEach((x, i) => add(`plat-${i}`, 'y', x, yB - L / 2, L / 2, yT - yB + L, 'post', `Tiang tembok ${i ? 'kanan' : 'kiri'}`, pt));
      add('rel-atas', 'x', L, yT, L / 2, W - 2 * L, 'rail-x', 'Rel tembok atas (dudukan engsel)', pt);
      add('rel-bawah', 'x', L, yB, L / 2, W - 2 * L, 'rail-x', 'Rel tembok bawah', pt);
      const na = clampI(n, 2, 12);
      const xs = Array.from({ length: na }, (_, k) => (na === 1 ? W / 2 : L + 3 + ((W - 2 * L - 6) * k) / (na - 1)));
      xs.forEach((x, k) => {
        add(`jemur-lengan-${k + 1}`, 'z', x, yT, L, D - L, 'custom', `Lengan jemur ${k + 1}`, rail);
        add(`ujung-${k + 1}`, 'y', x, yT + 1, D - 1, 4, 'custom', `Penahan ujung lengan ${k + 1}`, thin);
        hinges.push({ id: `engsel-lengan-${k + 1}`, memberId: `jemur-lengan-${k + 1}`, mode: 'point', type: 'barrel-weld', pos: 0, side: 'end', foldAxis: 'y', foldSign: -1, label: `Engsel lengan ${k + 1} (dilipat turun)` });
      });
      outH = yT + 5;
    } else if (m === 'gunting') {
      // Rangka gunting di kiri & kanan, ruas silang berderet dari tembok
      wall = true;
      const nc = clampI(n, 2, 6);
      const hs = 18;
      const yHi = H;
      const yLo = H - hs;
      // Gunting asli: batang naik & turun di dua bidang bersebelahan (turun digeser ke dalam setebal pipa),
      // dibaut di titik silang & di tiap simpul, bukan saling tembus. Simpul pertama mundur dari rel tembok
      // setengah jejak potongan, jadi ujung batang menempel rata di sisi rel.
      let z0 = L + 1;
      let cz = (D - 1 - z0) / nc;
      for (let it = 0; it < 4; it++) {
        z0 = L + footHalf([0, yLo, 0], [0, yHi, cz], rail) + 0.1;
        cz = (D - 1 - z0) / nc;
      }
      const rw = rail[0] / 10;
      [L / 2, W - L / 2].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        const xt = x + (i ? -rw : rw);
        add(`rel-tembok-${i}`, 'y', x, yLo - 6, L / 2, hs + 12, 'post', `Rel tembok ${nm} (dudukan gunting)`, pt);
        for (let k = 0; k < nc; k++) {
          const za = z0 + k * cz;
          const zb = za + cz;
          line(`gunting-${i}-${k + 1}-a`, [x, yLo, za], [x, yHi, zb], 'custom', `Gunting ${nm} ruas ${k + 1} (naik)`, rail);
          line(`gunting-${i}-${k + 1}-b`, [xt, yHi, za], [xt, yLo, zb], 'custom', `Gunting ${nm} ruas ${k + 1} (turun)`, rail);
        }
      });
      [yLo - 6 + L / 2, yHi + 6 - L / 2].forEach((y, k) => add(`rel-tembok-${k ? 'atas' : 'bawah'}`, 'x', L, y, L / 2, W - 2 * L, 'rail-x', `Rel tembok ${k ? 'atas' : 'bawah'}`, pt));
      const tube = jem(W - L);
      // palang jemur duduk di atas simpul atas, pengikat menempel di bawah simpul ujung
      for (let k = 1; k <= nc; k++) add(`jemur-${k}`, 'x', 0, yHi + tube[1] / 20, z0 + k * cz, W, 'custom', `Palang jemur ruas ${k}`, tube);
      add('pengikat-ujung', 'x', 0, yLo - rail[1] / 20, z0 + nc * cz, W, 'rail-x', 'Palang pengikat ujung bawah', rail);
      outH = yHi + 6;
    } else if (m === 'plafon') {
      // Rel plafon, batang turun, bingkai palang menggantung
      const yC = H + num(p, 'turun', 50);
      const xe = Math.min(10, W * 0.08);
      const zd = 2;
      [zd, D - zd].forEach((z, j) => add(`rel-plafon-${j}`, 'x', 0, yC - L / 2, z, W, 'rail-x', `Rel plafon ${j ? 'depan' : 'belakang'}`, pt));
      [xe, W - xe].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        add(`bingkai-${i}`, 'z', x, H, 0, D, 'rail-z', `Bingkai ${nm}`, pt);
        [zd, D - zd].forEach((z, j) => add(`turun-${i}-${j}`, 'y', x, H + L / 2, z, yC - L - H - L / 2, 'post', `Batang gantung ${nm} ${j ? 'depan' : 'belakang'}`, rail));
      });
      const tube = jem(W - 2 * xe);
      spread(n, zd + 2, D - zd - 2).forEach((z, k) => add(`jemur-${k + 1}`, 'x', 0, H + L / 2 + tube[1] / 20, z, W, 'custom', `Palang jemur ${k + 1}`, tube));
      outH = yC;
    } else if (m === 'handuk-trapesium') {
      // Rangka samping trapesium, palang zig-zag depan-belakang
      const zc = D / 2;
      const tw = Math.max(12, D * 0.4);
      const yTop = H - L / 2;
      const zBack = (y: number) => L / 2 + (zc - tw / 2 - L / 2) * ((y - L) / (yTop - L));
      const zFront = (y: number) => D - zBack(y);
      [L / 2, W - L / 2].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        add(`tapak-${i}`, 'z', x, L / 2, 0, D, 'rail-z', `Tapak lantai ${nm}`, pt);
        // kaki miring: ujung atas dipotong rata di bawah palang atas (bukan masuk ke as palang)
        const yK = yTop - L / 2;
        line(`kaki-${i}-b`, [x, L, L / 2], [x, yK, zBack(yK)], 'post', `Kaki ${nm} belakang (miring)`, pt);
        line(`kaki-${i}-d`, [x, L, D - L / 2], [x, yK, zFront(yK)], 'post', `Kaki ${nm} depan (miring)`, pt);
        add(`atas-${i}`, 'z', x, yTop, zc - tw / 2 - L / 2, tw + L, 'rail-z', `Palang atas ${nm}`, pt);
      });
      const tube = jem(W - 2 * L);
      const y0 = alas ? 40 : 25;
      for (let k = 0; k < n; k++) {
        const y = y0 + ((yTop - 12 - y0) * k) / Math.max(1, n - 1);
        const z = k % 2 ? zFront(y) : zBack(y);
        add(`jemur-${k + 1}`, 'x', L, y, z, W - 2 * L, 'custom', `Palang handuk ${k + 1} (${k % 2 ? 'depan' : 'belakang'})`, tube);
      }
      add('puncak', 'x', L, yTop, zc, W - 2 * L, 'rail-x', 'Palang puncak', rail);
      if (alas) {
        const ya = 15;
        add('alas-b', 'x', L, ya, zBack(ya), W - 2 * L, 'rail-x', 'Palang alas belakang', rail);
        add('alas-d', 'x', L, ya, zFront(ya), W - 2 * L, 'rail-x', 'Palang alas depan', rail);
        if (b > 0) boards.push(board('papan-alas', 'Alas keranjang', L, W - L, ya + 1, ya + 1 + b, zBack(ya), zFront(ya)));
      }
      casterXs = [L / 2, W - L / 2];
      casterZs = [L / 2 + 2, D - L / 2 - 2];
      if (roda) {
        // roda di bawah tapak: geser semua batang & papan naik setinggi roda
        list.forEach((mb) => {
          mb.y = r1(mb.y + c);
          if (mb.end) mb.end = { ...mb.end, y: r1(mb.end.y + c) };
        });
        boards.forEach((bd) => {
          bd.box.min[1] = r1(bd.box.min[1] + c);
          bd.box.max[1] = r1(bd.box.max[1] + c);
        });
        outH = H + c;
      }
    } else {
      // handuk-kantilever: satu tiang di kaki T, palang menjulur ke kanan
      const zc = D / 2;
      add('kaki-melintang', 'z', L / 2, L / 2, 0, D, 'rail-z', 'Kaki melintang (bawah tiang)', pt);
      add('kaki-panjang', 'x', L, L / 2, zc, Math.max(20, W * 0.85 - L), 'rail-x', 'Kaki memanjang (di bawah palang)', pt);
      add('tiang', 'y', L / 2, L, zc, H - L, 'post', 'Tiang', pt);
      const yTop = H - L / 2;
      const gap = Math.min(18, (H - 35) / n);
      const tube = jem(W - L);
      let yLow = yTop;
      for (let k = 0; k < n; k++) {
        const y = yTop - k * gap;
        yLow = y;
        add(`jemur-${k + 1}`, 'x', L, y, zc, W - L, 'custom', `Palang handuk ${k + 1}`, tube);
      }
      // penguat: tepi bawah potongan menempel di sisi tiang, ujung atas rata di bawah palang terbawah
      strut('penguat', [L, yLow - 22, zc], [Math.min(W * 0.35, 22), yLow - tube[1] / 20, zc], 'Penguat miring palang bawah', thin);
    }

    const casters = roda ? casterSet(casterXs, casterZs, inch, bool(p, 'remRoda')) : [];
    return { members: list, boards, casters, W: outW, D: outD, H: outH, boardThick: 0, hinges: hinges.length ? hinges : undefined, wall };
  },

  checks: (p, bd) => {
    const out: ProductCheck[] = [];
    const m = model(p);
    const W = num(p, 'panjang');
    const D = num(p, 'dalam');
    const H = num(p, 'tinggi');
    const pipa = str(p, 'pipa', '20');
    if (m === 'kotak' && H / D > 3)
      out.push({ level: 'warn', message: 'Jemuran tinggi dengan kaki sempit mudah terguling saat cucian basah menumpuk atau tertiup angin.', fix: { label: `Lebar ${Math.min(120, Math.ceil(H / 3))} cm`, params: { dalam: Math.min(120, Math.ceil(H / 3)) } } });
    if (m === 'handuk-trapesium' && H / D > 3)
      out.push({ level: 'warn', message: 'Rak handuk ini terlalu ramping, mudah oleng saat handuk basah digantung di satu sisi.', fix: { label: `Lebar bawah ${Math.min(120, Math.ceil(H / 2.6))} cm`, params: { dalam: Math.min(120, Math.ceil(H / 2.6)) } } });
    if (m === 'tenda' && D < H * 0.5)
      out.push({ level: 'warn', message: 'Kaki tenda terlalu rapat: jemuran mudah roboh ke depan atau belakang.', fix: { label: `Lebar kaki ${Math.min(120, Math.ceil(H * 0.6))} cm`, params: { dalam: Math.min(120, Math.ceil(H * 0.6)) } } });
    if (m === 'handuk-kantilever' && W > D * 2)
      out.push({ level: 'warn', message: 'Palang menjulur jauh dari tiang: rak bisa miring ke arah palang saat handuk basah.', fix: { label: `Palang ${Math.max(40, D * 2)} cm`, params: { panjang: Math.max(40, D * 2) } } });
    if (m === 'sayap' && num(p, 'sayap') > D)
      out.push({ level: 'warn', message: 'Sayap lebih lebar dari kaki: jemuran bisa terjungkit kalau satu sayap penuh cucian.', fix: { label: `Sayap ${Math.max(20, Math.floor(D * 0.8))} cm`, params: { sayap: Math.max(20, Math.floor(D * 0.8)) } } });
    if (m === 'tiang-t') {
      const nT = clampI(num(p, 'tiang', 2), 2, 4);
      if (W / (nT - 1) > 260)
        out.push({ level: 'warn', message: 'Jarak antar tiang lebih dari 2,6 m: palang melendut saat penuh cucian basah.', fix: nT < 4 ? { label: `${nT + 1} tiang`, params: { tiang: nT + 1 } } : { label: 'Panjang 400 cm', params: { panjang: 400 } } });
      if (pipa === '20') out.push({ level: 'warn', message: 'Tiang 20×20 terlalu ramping untuk jemuran rooftop yang kena angin.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
      out.push({ level: 'info', message: 'Plat dasar tiap tiang dibaut ke lantai cor dengan 4 baut fischer / dynabolt.' });
    }
    if (m === 'payung') {
      if (W > 200 && pipa === '20') out.push({ level: 'warn', message: 'Lengan payung selebar ini terlalu berat untuk tiang 20×20.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
      out.push({ level: 'info', message: 'Plat dasar dibaut ke lantai cor; tiang bisa dibuat berputar dengan pipa selongsong di bawah lengan.' });
    }
    if (m === 'kotak' && H > 150 && pipa === '20')
      out.push({ level: 'warn', message: 'Tiang 20×20 setinggi ini goyang saat penuh cucian.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
    if (m === 'lengan-dinding' && D > 70)
      out.push({ level: 'warn', message: 'Lengan lebih dari 70 cm mudah melendut dan engselnya cepat longgar.', fix: { label: 'Lengan 60 cm', params: { dalam: 60 } } });
    if (m === 'gunting' && D > 100)
      out.push({ level: 'warn', message: 'Gunting ditarik lebih dari 1 m jadi goyang dan turun di ujung.', fix: { label: 'Tarik 80 cm', params: { dalam: 80 } } });
    if (m === 'plafon' && num(p, 'turun') > 80)
      out.push({ level: 'warn', message: 'Batang gantung yang panjang membuat jemuran berayun saat cucian dijemur.', fix: { label: 'Batang 60 cm', params: { turun: 60 } } });
    if (bool(p, 'roda') && RODA_MODELS.includes(m) && H > 170)
      out.push({ level: 'warn', message: 'Jemuran beroda setinggi ini mudah terguling saat didorong.', fix: { label: 'Tanpa roda', params: { roda: false } } });
    if (m === 'lengan-dinding' || m === 'gunting') out.push({ level: 'info', message: 'Rel tembok dibaut ke bata / beton dengan fischer minimal 2 titik tiap sisi.' });
    if (m === 'plafon') out.push({ level: 'info', message: 'Rel plafon dibaut ke balok / cor plafon, jangan ke gypsum.' });
    if (m === 'para-para') out.push({ level: 'info', message: 'Taruh jaring atau anyaman bambu di atas jeruji untuk kerupuk / ikan.' });
    if (m !== 'para-para') {
      const len = bd.members.filter((mb) => mb.id.startsWith('jemur-')).reduce((s, mb) => s + mb.length, 0) / 100;
      out.push({ level: 'info', message: `Panjang jemur ±${r1(len)} m (±${Math.max(1, Math.round(len / 1.5))} kg cucian basah).` });
    }
    if (['kotak', 'tiang-t', 'payung', 'para-para'].includes(m)) out.push({ level: 'info', message: 'Untuk luar ruang pakai cat dasar anti karat atau galvanis.' });
    return out;
  },
};
