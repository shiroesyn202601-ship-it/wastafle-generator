import { Board, Caster, Params, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, CASTER_OPTIONS, board, bool, casterHeight, casterSet, materialParams, memberFactory, num, r1, str } from './common';

/**
 * Rak kamar mandi & laundry. Bentuk rangka (param `model`):
 * - empat: 4 kaki tegak mengapit kloset / mesin cuci, siku penguat di sudut kolong, rak hanya di atas kolong, silang X belakang
 * - samping: sisi kiri & kanan berupa bingkai kotak tertutup dengan tapak lantai memanjang, rak di atas kolong
 * - silang: kaki tiap sisi menyilang X di bawah kolong, tiang tegak pendek di atasnya menopang rak
 * - tapak: satu tiang per sisi berdiri di tapak melintang (T terbalik), lengan rak menjulur depan & belakang
 * - konsol: 2 kaki depan sampai lantai, tiang belakang dibaut tembok dan baru mulai di atas kolong
 * - gamma: kolom rak penuh di satu sisi, rak atas menjulur melangkahi mesin, ujung lain dibaut tembok (tampak depan Γ)
 * - plafon: dua tiang dijepit plat lantai & plat plafon, lengan rak menjulur ke depan di atas kolong
 * - sudut: tiga tiang di pojok, palang miring di depan, papan bilah mengisi bidang segitiga
 * - sela: dua tiang belakang di atas tapak beroda, papan menjulur ke depan, pegangan tarik di depan atas
 * - kolong: rak rendah 6 tiang untuk kolong wastafel, papan atas berbentuk U dengan celah pipa di tengah belakang
 * - keranjang: dua tiang dibaut tembok, keranjang berpagar 3 sisi bertingkat, pipa handuk di bawah
 */
const MODELS = [
  { value: 'empat', label: 'Melangkahi, 4 kaki', desc: 'Kaki tegak kiri–kanan benda, siku di sudut kolong' },
  { value: 'samping', label: 'Melangkahi, bingkai samping', desc: 'Sisi kiri–kanan bingkai kotak dengan tapak lantai' },
  { value: 'silang', label: 'Melangkahi, kaki silang X', desc: 'Kaki menyilang di bawah, tiang tegak di atas' },
  { value: 'tapak', label: 'Melangkahi, kaki T', desc: 'Satu tiang per sisi di tapak melintang' },
  { value: 'konsol', label: 'Melangkahi, kaki depan + tembok', desc: 'Kaki hanya di depan, belakang dibaut tembok' },
  { value: 'gamma', label: 'Menara samping (Γ)', desc: 'Kolom rak di satu sisi, rak atas menjulur di atas mesin' },
  { value: 'plafon', label: 'Tiang lantai–plafon', desc: 'Dua tiang dijepit lantai & plafon, tanpa kaki tapak' },
  { value: 'sudut', label: 'Sudut segitiga', desc: 'Tiga tiang di pojok, papan segitiga' },
  { value: 'sela', label: 'Sela sempit beroda', desc: 'Rak tipis di celah samping mesin cuci / kulkas' },
  { value: 'kolong', label: 'Kolong wastafel', desc: 'Rak rendah dengan celah pipa di papan atas' },
  { value: 'keranjang', label: 'Keranjang dinding', desc: 'Keranjang berpagar dibaut tembok + pipa handuk' },
];
const MODEL_IDS = MODELS.map((m) => m.value);
const LANGKAH = ['empat', 'samping', 'silang', 'tapak', 'konsol', 'gamma', 'plafon'];
const HANDUK = ['empat', 'samping', 'silang', 'tapak', 'konsol', 'keranjang'];
const FREE = ['empat', 'samping', 'silang', 'tapak']; // berdiri bebas, tinggi & ramping
const mdl = (p: Params) => {
  const m = str(p, 'model', 'empat');
  return MODEL_IDS.includes(m) ? m : 'empat';
};
const isL = (p: Params) => LANGKAH.includes(mdl(p));
const PG = 7; // tinggi pagar pinggir di atas papan (cm)

export const RAK_KAMAR_MANDI: ProductDef = {
  id: 'rak-kamar-mandi',
  name: 'Rak kamar mandi & laundry',
  tagline: 'atas kloset · atas mesin cuci · sudut · sela',
  icon: 'M10 4v32M50 4v32M10 6h40M10 13h40M10 20h40M22 36v-8h16v8',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['model', 'lebarKolong', 'tinggiKolong', 'panjang', 'dalam', 'tinggi', 'tinggiPlafon', 'tinggiBawah'] },
    { id: 'bentuk', title: 'Bentuk', keys: ['tingkat', 'lebarKolom', 'pagar', 'pipaHanduk'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Roda', keys: ['roda', 'ukuranRoda'] },
  ],
  params: [
    { key: 'model', label: 'Bentuk rangka', type: 'choice', options: MODELS },
    {
      key: 'lebarKolong', label: 'Lebar kolong', type: 'number', unit: 'cm', min: 40, max: 160, step: 1,
      help: 'Lebar benda di bawah rak (kloset, mesin cuci, wastafel) ditambah ±5 cm supaya longgar.',
      marks: [{ value: 55, label: 'kloset' }, { value: 65, label: 'mesin cuci' }, { value: 140, label: '2 mesin' }],
      showIf: isL,
    },
    {
      key: 'tinggiKolong', label: 'Tinggi kolong', type: 'number', unit: 'cm', min: 50, max: 140, step: 1,
      help: 'Ruang kosong di bawah rak terbawah. Mesin cuci bukaan atas butuh ±130 cm supaya tutupnya bisa dibuka.',
      marks: [{ value: 85, label: 'kloset' }, { value: 100, label: 'bukaan depan' }, { value: 130, label: 'bukaan atas' }],
      showIf: isL,
    },
    {
      key: 'panjang', label: 'Lebar rak', type: 'number', unit: 'cm', min: 15, max: 100, step: 1,
      help: 'Lebar rak dilihat dari depan.',
      marks: [{ value: 18, label: 'sela' }, { value: 60, label: 'kolong wastafel' }],
      showIf: (p) => ['sela', 'kolong', 'keranjang'].includes(mdl(p)),
    },
    {
      key: 'dalam', label: 'Kedalaman', type: 'number', unit: 'cm', min: 12, max: 60, step: 1,
      help: 'Jarak depan ke belakang. Rak sudut: panjang sisi yang menempel tembok.',
      marks: [{ value: 25, label: 'atas kloset' }, { value: 35, label: 'atas mesin cuci' }],
    },
    {
      key: 'tinggi', label: 'Tinggi rak', type: 'number', unit: 'cm', min: 30, max: 220, step: 1,
      help: 'Dari lantai sampai papan teratas.',
      marks: [{ value: 170, label: 'atas kloset' }, { value: 185, label: 'atas mesin cuci' }],
    },
    { key: 'tinggiPlafon', label: 'Tinggi plafon', type: 'number', unit: 'cm', min: 220, max: 320, step: 1, help: 'Ukur dari lantai ke plafon di titik tiang.', marks: [{ value: 260, label: 'umum' }], showIf: (p) => mdl(p) === 'plafon' },
    { key: 'tinggiBawah', label: 'Tinggi keranjang terbawah', type: 'number', unit: 'cm', min: 40, max: 150, step: 1, help: 'Dari lantai ke keranjang paling bawah.', marks: [{ value: 100, label: 'umum' }], showIf: (p) => mdl(p) === 'keranjang' },
    { key: 'tingkat', label: 'Jumlah papan', type: 'number', unit: 'tingkat', min: 2, max: 6, step: 1, help: 'Rak melangkahi: jumlah papan di atas kolong.' },
    { key: 'lebarKolom', label: 'Lebar kolom samping', type: 'number', unit: 'cm', min: 25, max: 45, step: 1, help: 'Kolom rak dari lantai di samping mesin cuci.', showIf: (p) => mdl(p) === 'gamma' },
    { key: 'pagar', label: 'Pagar pinggir', type: 'toggle', help: 'Palang kecil di atas papan supaya botol sabun tidak jatuh.', showIf: (p) => mdl(p) !== 'keranjang' },
    { key: 'pipaHanduk', label: 'Pipa handuk', type: 'toggle', help: 'Pipa untuk menjemur handuk / lap di depan bawah rak.', showIf: (p) => HANDUK.includes(mdl(p)) },
    ...materialParams(true),
    { key: 'roda', label: 'Pakai roda', type: 'toggle', help: 'Rak sela bisa ditarik keluar dari celah.', showIf: (p) => mdl(p) === 'sela' },
    { key: 'ukuranRoda', label: 'Ukuran roda', type: 'choice', options: CASTER_OPTIONS, showIf: (p) => mdl(p) === 'sela' && p.roda === true },
  ],
  defaults: {
    model: 'empat', lebarKolong: 55, tinggiKolong: 85, panjang: 40, dalam: 25, tinggi: 170, tinggiPlafon: 260, tinggiBawah: 100,
    tingkat: 3, lebarKolom: 30, pagar: true, pipaHanduk: false,
    pipa: '20', papan: 'kayu', warna: '#1f2226', roda: false, ukuranRoda: '3',
  },
  groups: [
    { id: 'atas-objek', name: 'Rak melangkahi', desc: 'Kaki kiri–kanan kloset, mesin cuci, atau wastafel dengan papan di atas' },
    { id: 'sudut-sela', name: 'Rak sudut, sela & kolong', desc: 'Rak pojok, rak tipis di celah mesin, rak kolong wastafel' },
  ],
  signature: (p) => `rak-kamar-mandi:${mdl(p)}`,
  presets: [
    {
      id: 'atas-kloset',
      group: 'atas-objek',
      name: 'Rak melangkahi 4 kaki',
      desc: '4 kaki tegak mengapit benda, siku penguat di sudut kolong, papan hanya di atas kolong, silang X belakang',
      params: { model: 'empat', lebarKolong: 55, tinggiKolong: 85, dalam: 25, tinggi: 170, tingkat: 3 },
      sizes: [
        { label: 'Atas kloset', desc: 'kolong 55 × 85, 63 × 25 × 170 cm', params: { lebarKolong: 55, tinggiKolong: 85, dalam: 25, tinggi: 170, tingkat: 3 } },
        { label: 'Atas mesin cuci', desc: 'kolong 65 × 100, 73 × 35 × 180 cm', params: { lebarKolong: 65, tinggiKolong: 100, dalam: 35, tinggi: 180, tingkat: 3 } },
        { label: 'Dua mesin cuci', desc: 'kolong 140 × 100, tiang tengah', params: { lebarKolong: 140, tinggiKolong: 100, dalam: 40, tinggi: 185, tingkat: 3, pipa: '30' } },
        { label: 'Atas wastafel', desc: 'kolong 60 × 110, 2 papan', params: { lebarKolong: 60, tinggiKolong: 110, dalam: 22, tinggi: 170, tingkat: 2 } },
      ],
    },
    {
      id: 'bingkai-samping',
      group: 'atas-objek',
      name: 'Rak melangkahi bingkai samping',
      desc: 'sisi kiri & kanan bingkai kotak tertutup dengan tapak lantai memanjang, papan di atas kolong',
      params: { model: 'samping', lebarKolong: 65, tinggiKolong: 100, dalam: 40, tinggi: 180, tingkat: 3, pipa: '30' },
      sizes: [
        { label: 'Mesin cuci bukaan depan', desc: 'kolong 65 × 100, dalam 40', params: { lebarKolong: 65, tinggiKolong: 100, dalam: 40, tinggi: 180, tingkat: 3 } },
        { label: 'Mesin cuci bukaan atas', desc: 'kolong 65 × 130, 2 papan', params: { lebarKolong: 65, tinggiKolong: 130, dalam: 40, tinggi: 190, tingkat: 2 } },
        { label: 'Atas kloset', desc: 'kolong 55 × 85, dalam 25', params: { lebarKolong: 55, tinggiKolong: 85, dalam: 25, tinggi: 170, tingkat: 3, pipa: '20' } },
      ],
    },
    {
      id: 'kaki-silang',
      group: 'atas-objek',
      name: 'Rak melangkahi kaki silang X',
      desc: 'kaki tiap sisi menyilang X di bawah kolong, tiang tegak pendek di atasnya menopang papan',
      params: { model: 'silang', lebarKolong: 55, tinggiKolong: 85, dalam: 25, tinggi: 165, tingkat: 3 },
      sizes: [
        { label: 'Atas kloset', desc: 'kolong 55 × 85, 3 papan', params: { lebarKolong: 55, tinggiKolong: 85, dalam: 25, tinggi: 165, tingkat: 3 } },
        { label: 'Atas mesin cuci', desc: 'kolong 65 × 100, dalam 35', params: { lebarKolong: 65, tinggiKolong: 100, dalam: 35, tinggi: 180, tingkat: 3, pipa: '30' } },
      ],
    },
    {
      id: 'kaki-t',
      group: 'atas-objek',
      name: 'Rak melangkahi kaki T',
      desc: 'satu tiang per sisi berdiri di tapak melintang, lengan papan menjulur depan & belakang tiang',
      params: { model: 'tapak', lebarKolong: 65, tinggiKolong: 100, dalam: 35, tinggi: 180, tingkat: 3, pipa: '30' },
      sizes: [
        { label: 'Atas mesin cuci', desc: 'kolong 65 × 100, dalam 35', params: { lebarKolong: 65, tinggiKolong: 100, dalam: 35, tinggi: 180, tingkat: 3 } },
        { label: 'Atas kloset', desc: 'kolong 55 × 85, dalam 28', params: { lebarKolong: 55, tinggiKolong: 85, dalam: 28, tinggi: 170, tingkat: 3 } },
        { label: 'Dua mesin cuci', desc: 'kolong 140 × 100, tiang tengah', params: { lebarKolong: 140, tinggiKolong: 100, dalam: 40, tinggi: 185, tingkat: 3 } },
      ],
    },
    {
      id: 'kaki-depan',
      group: 'atas-objek',
      name: 'Rak melangkahi kaki depan + tembok',
      desc: 'hanya 2 kaki depan sampai lantai, tiang belakang dibaut tembok mulai di atas kolong',
      params: { model: 'konsol', lebarKolong: 65, tinggiKolong: 100, dalam: 35, tinggi: 180, tingkat: 3 },
      sizes: [
        { label: 'Atas mesin cuci', desc: 'kolong 65 × 100, dalam 35', params: { lebarKolong: 65, tinggiKolong: 100, dalam: 35, tinggi: 180, tingkat: 3 } },
        { label: 'Atas wastafel / bak cuci', desc: 'kolong 80 × 110, dalam 25', params: { lebarKolong: 80, tinggiKolong: 110, dalam: 25, tinggi: 175, tingkat: 2 } },
        { label: 'Atas kloset', desc: 'kolong 55 × 85, dalam 22', params: { lebarKolong: 55, tinggiKolong: 85, dalam: 22, tinggi: 165, tingkat: 3 } },
      ],
    },
    {
      id: 'menara-samping',
      group: 'atas-objek',
      name: 'Rak menara samping (Γ)',
      desc: 'kolom rak penuh di satu sisi, papan atas menjulur melangkahi mesin, ujung lain dibaut tembok',
      params: { model: 'gamma', lebarKolong: 65, tinggiKolong: 100, lebarKolom: 30, dalam: 40, tinggi: 185, tingkat: 2, pipa: '30' },
      sizes: [
        { label: 'Mesin cuci + kolom deterjen', desc: 'kolong 65, kolom 30 cm', params: { lebarKolong: 65, tinggiKolong: 100, lebarKolom: 30, dalam: 40, tinggi: 185, tingkat: 2 } },
        { label: 'Mesin cuci bukaan atas', desc: 'kolong 65 × 130, kolom 35', params: { lebarKolong: 65, tinggiKolong: 130, lebarKolom: 35, dalam: 40, tinggi: 195, tingkat: 2 } },
        { label: 'Kloset + kolom handuk', desc: 'kolong 55 × 85, kolom 25', params: { lebarKolong: 55, tinggiKolong: 85, lebarKolom: 25, dalam: 25, tinggi: 170, tingkat: 3 } },
      ],
    },
    {
      id: 'lantai-plafon',
      group: 'atas-objek',
      name: 'Rak tiang lantai–plafon',
      desc: 'dua tiang dijepit plat lantai & plat plafon, lengan papan menjulur ke depan di atas kolong',
      params: { model: 'plafon', lebarKolong: 60, tinggiKolong: 95, dalam: 28, tinggi: 185, tinggiPlafon: 260, tingkat: 3, pipa: '30' },
      sizes: [
        { label: 'Plafon 260', desc: 'kolong 60 × 95, 3 papan', params: { lebarKolong: 60, tinggiKolong: 95, dalam: 28, tinggi: 185, tinggiPlafon: 260, tingkat: 3 } },
        { label: 'Plafon 300', desc: 'kolong 70 × 105, 4 papan', params: { lebarKolong: 70, tinggiKolong: 105, dalam: 30, tinggi: 220, tinggiPlafon: 300, tingkat: 4 } },
        { label: 'Plafon rendah 240', desc: 'kolong 55 × 85', params: { lebarKolong: 55, tinggiKolong: 85, dalam: 25, tinggi: 175, tinggiPlafon: 240, tingkat: 3 } },
      ],
    },
    {
      id: 'sudut-segitiga',
      group: 'sudut-sela',
      name: 'Rak sudut segitiga 3 kaki',
      desc: 'tiga tiang di pojok, palang miring di depan, papan bilah mengisi bidang segitiga',
      params: { model: 'sudut', dalam: 35, tinggi: 150, tingkat: 4 },
      sizes: [
        { label: 'Pojok kamar mandi', desc: 'sisi 35, tinggi 150, 4 papan', params: { dalam: 35, tinggi: 150, tingkat: 4 } },
        { label: 'Pojok shower', desc: 'sisi 30, tinggi 120, 3 papan', params: { dalam: 30, tinggi: 120, tingkat: 3 } },
        { label: 'Pojok laundry', desc: 'sisi 45, tinggi 170, 5 papan', params: { dalam: 45, tinggi: 170, tingkat: 5, pipa: '30' } },
      ],
    },
    {
      id: 'sela-beroda',
      group: 'sudut-sela',
      name: 'Rak sela sempit beroda',
      desc: 'dua tiang belakang di tapak beroda, papan menjulur ke depan, pegangan tarik di depan atas',
      params: { model: 'sela', panjang: 18, dalam: 45, tinggi: 85, tingkat: 3, roda: true },
      sizes: [
        { label: 'Sela mesin cuci', desc: '18 × 45 × 85 cm, 3 papan', params: { panjang: 18, dalam: 45, tinggi: 85, tingkat: 3 } },
        { label: 'Sela kulkas', desc: '22 × 55 × 120 cm, 4 papan', params: { panjang: 22, dalam: 55, tinggi: 120, tingkat: 4 } },
        { label: 'Sela kamar mandi', desc: '15 × 40 × 75 cm, 3 papan', params: { panjang: 15, dalam: 40, tinggi: 75, tingkat: 3 } },
      ],
    },
  ],
  summary: (p) => {
    const m = mdl(p);
    if (LANGKAH.includes(m))
      return `kolong ${num(p, 'lebarKolong')} × ${num(p, 'tinggiKolong')} cm · dalam ${num(p, 'dalam')} · tinggi ${num(p, 'tinggi')} cm · ${num(p, 'tingkat')} papan`;
    if (m === 'sudut') return `sisi ${num(p, 'dalam')} cm · tinggi ${num(p, 'tinggi')} cm · ${num(p, 'tingkat')} papan`;
    return `${num(p, 'panjang')} × ${num(p, 'dalam')} × ${num(p, 'tinggi')} cm · ${num(p, 'tingkat')} ${m === 'keranjang' ? 'keranjang' : 'papan'}${m === 'sela' && bool(p, 'roda') ? ' · beroda' : ''}`;
  },

  build: (p) => {
    const model = mdl(p);
    const L = (parseInt(str(p, 'pipa', '20')) || 20) / 10;
    const pt: [number, number] = [L * 10, L * 10];
    const rail: [number, number] = [20, 20];
    const thin: [number, number] = [15, 15];
    const rh = 2;
    const b = BOARD_THICK[str(p, 'papan', 'kayu')] ?? 2.5;
    const pagar = model === 'keranjang' ? true : bool(p, 'pagar');
    const handuk = bool(p, 'pipaHanduk') && HANDUK.includes(model);
    const n = Math.max(2, Math.min(6, Math.round(num(p, 'tingkat', 3))));
    const D = num(p, 'dalam', 25);
    const H = num(p, 'tinggi', 170);
    const { list, add, line } = memberFactory();
    const boards: Board[] = [];
    let casters: Caster[] = [];
    let W = 0;
    let outD = D;
    let outH = H;
    let wall = false;
    const zb = L / 2;
    const zf = D - L / 2;
    const h = L / 2; // setengah lebar tiang
    const hw = thin[0] / 20; // setengah lebar pipa pagar / penguat (15 mm)
    const extra = pagar ? b + PG + 1 : 0; // tiang dilebihkan untuk pagar papan teratas
    const yPg = (y: number) => y + rh / 2 + b + PG;
    const levels = (y0: number, y1: number, cnt: number) => Array.from({ length: cnt }, (_, i) => r1(y0 + ((y1 - y0) * i) / Math.max(1, cnt - 1)));
    const plank = (id: string, nm: string, x0: number, x1: number, z0: number, z1: number, y: number) => {
      if (b > 0) boards.push(board(id, nm, x0, x1, y + rh / 2, y + rh / 2 + b, z0, z1));
    };
    /** Tiang pagar tipis di sudut yang tidak punya tiang: berdiri di atas palang/lengan, pagar mendatar dilas di atasnya */
    const fencePost = (id: string, nm: string, x: number, z: number, y: number) => add(id, 'y', x, y + rh / 2, z, yPg(y) - hw - y - rh / 2, 'custom', nm, thin);
    /**
     * Penguat miring di bidang tegak (bidang 'z' = bidang Y–Z pada x = c, bidang 'x' = bidang X–Y pada z = c).
     * a/e = titik sasaran [koordinat mendatar, y]. Flag tiap ujung: 'v' = ujung menempel sisi TEGAK (sisi tiang),
     * 'h' = ujung menempel sisi MENDATAR (bawah palang / atas pagar). Ujung batang dipotong rata lantai bila batang
     * curam, atau tegak bila landai (lihat cutAxisIndex), jadi titik ujung digeser supaya potongannya tidak masuk
     * ke batang yang ditemui.
     */
    const brace = (id: string, nm: string, plane: 'x' | 'z', c: number, a: [number, number], e: [number, number], fa: string, fe: string) => {
      let P = a;
      let Q = e;
      for (let k = 0; k < 5; k++) {
        const ds = Q[0] - P[0];
        const dy = Q[1] - P[1];
        const len = Math.hypot(ds, dy) || 1;
        P = [...a];
        Q = [...e];
        if (Math.abs(dy) / len >= 0.35) {
          const o = (hw * len) / Math.abs(dy) + 0.1;
          if (fa.includes('v')) P[0] += Math.sign(ds) * o;
          if (fe.includes('v')) Q[0] -= Math.sign(ds) * o;
        } else {
          const o = (hw * len) / Math.abs(ds) + 0.1;
          if (fa.includes('h')) P[1] += Math.sign(dy) * o;
          if (fe.includes('h')) Q[1] -= Math.sign(dy) * o;
        }
      }
      const pt3 = (q: [number, number]): [number, number, number] => (plane === 'z' ? [c, q[1], q[0]] : [q[0], q[1], c]);
      line(id, pt3(P), pt3(Q), 'custom', nm, thin);
    };
    /** Pipa handuk: lengan menjulur ke depan, pipa melintang menerus di ujungnya (lengan menempel di belakang pipa) */
    const towelBar = (xl: number, xr: number, yH: number, z0: number, zH: number) => {
      [xl, xr].forEach((x, k) => add(`lengan-handuk-${k}`, 'z', x, yH, z0, zH - rh / 2 - z0, 'custom', `Lengan pipa handuk ${k ? 'kanan' : 'kiri'}`, rail));
      add('pipa-handuk', 'x', xl - rh / 2, yH, zH, xr - xl + rh, 'rail-x', 'Pipa handuk', rail);
    };

    // ---------- Rak melangkahi (kolong di bawah, papan di atas) ----------
    if (LANGKAH.includes(model)) {
      const kol = num(p, 'lebarKolong', 55);
      const y1 = num(p, 'tinggiKolong', 85) + rh / 2; // as palang papan terbawah
      const yTop = Math.max(y1 + 12, H - rh / 2);
      const ys = levels(y1, yTop, n);
      const postTop = yTop + rh / 2 + extra;
      outH = yTop + rh / 2 + b;

      if (model === 'gamma') {
        // Kolom rak di kiri (4 tiang dari lantai) + rak atas menjulur ke kanan, ujung kanan dibaut tembok
        wall = true;
        const kw = num(p, 'lebarKolom', 30);
        W = kw + kol + L;
        const xA = L / 2;
        const xB = kw - L / 2;
        const xR = W - L / 2;
        [xA, xB].forEach((x, i) => [zb, zf].forEach((z, j) => add(`tiang-kolom-${i}-${j}`, 'y', x, 0, z, postTop, 'post', `Tiang kolom ${i ? 'dalam' : 'luar'} ${j ? 'depan' : 'belakang'}`, pt)));
        const nc = Math.max(3, Math.round((yTop - 12) / 32) + 1);
        levels(12, yTop, nc).forEach((y, i) => {
          const nm = `kolom ${i + 1}`;
          add(`kolom-${i}-depan`, 'x', xA + L / 2, y, zf, xB - xA - L, 'rail-x', `Palang ${nm} depan`, rail);
          add(`kolom-${i}-belakang`, 'x', xA + L / 2, y, zb, xB - xA - L, 'rail-x', `Palang ${nm} belakang`, rail);
          add(`kolom-${i}-kiri`, 'z', xA, y, zb + L / 2, zf - zb - L, 'rail-z', `Palang ${nm} kiri`, rail);
          add(`kolom-${i}-kanan`, 'z', xB, y, zb + L / 2, zf - zb - L, 'rail-z', `Palang ${nm} kanan`, rail);
          plank(`papan-kolom-${i}`, `Papan ${nm}`, xA, xB, zb, zf, y);
        });
        const wTop = postTop;
        add('tiang-tembok', 'y', xR, y1 - 20, zb, wTop - (y1 - 20), 'post', 'Tiang ujung dibaut tembok', pt);
        add('tiang-gantung', 'y', xR, y1 - rh / 2, zf, wTop - (y1 - rh / 2), 'post', 'Tiang gantung depan ujung (tidak sampai lantai)', pt);
        ys.forEach((y, i) => {
          const nm = `rak atas ${i + 1}`;
          add(`atas-${i}-depan`, 'x', xB + L / 2, y, zf, xR - xB - L, 'rail-x', `Palang ${nm} depan`, rail);
          add(`atas-${i}-belakang`, 'x', xB + L / 2, y, zb, xR - xB - L, 'rail-x', `Palang ${nm} belakang`, rail);
          add(`atas-${i}-ujung`, 'z', xR, y, zb + L / 2, zf - zb - L, 'rail-z', `Palang ${nm} ujung`, rail);
          plank(`papan-atas-${i}`, `Papan ${nm}`, xB, xR, zb, zf, y);
          if (pagar) {
            // pagar dipotong pas di antara tiang
            add(`atas-${i}-pagar-belakang`, 'x', xB + h, yPg(y), zb, xR - xB - L, 'custom', `Pagar ${nm} belakang`, thin);
            add(`atas-${i}-pagar-ujung`, 'z', xR, yPg(y), zb + h, zf - zb - L, 'custom', `Pagar ${nm} ujung`, thin);
          }
        });
        brace('siku-ujung', 'Penguat siku ujung tembok', 'z', xR, [zb + h, y1 - 18], [zb + (zf - zb) * 0.7, y1 - rh / 2], 'v', 'h');
      } else if (model === 'plafon') {
        // Dua tiang dijepit lantai–plafon di belakang, lengan menjulur ke depan
        const Hc = num(p, 'tinggiPlafon', 260);
        W = kol + 2 * L;
        const xs = [L / 2, W - L / 2];
        xs.forEach((x, i) => {
          const nm = i ? 'kanan' : 'kiri';
          add(`tiang-${nm}`, 'y', x, 0.6, zb, Hc - 1.2, 'post', `Tiang jepit ${nm}`, pt);
          boards.push({ ...board(`plat-lantai-${nm}`, `Plat lantai ${nm}`, x - 6, x + 6, 0, 0.6, 0, 12), steelMm: 6 });
          boards.push({ ...board(`plat-plafon-${nm}`, `Plat plafon ${nm}`, x - 6, x + 6, Hc - 0.6, Hc, 0, 12), steelMm: 6 });
        });
        ys.forEach((y, i) => {
          const nm = `rak ${i + 1}`;
          xs.forEach((x, k) => {
            // lengan dari sisi depan tiang sampai rata sisi luar palang depan
            add(`t${i}-lengan-${k}`, 'z', x, y, zb + L / 2, zf + rh / 2 - zb - L / 2, 'rail-z', `Lengan ${nm} ${k ? 'kanan' : 'kiri'}`, rail);
            brace(`t${i}-siku-${k}`, `Penguat lengan ${nm} ${k ? 'kanan' : 'kiri'}`, 'z', x, [zb + h, y - 14], [zb + (zf - zb) * 0.55, y - rh / 2], 'v', 'h');
          });
          add(`t${i}-depan`, 'x', xs[0] + rh / 2, y, zf, xs[1] - xs[0] - rh, 'rail-x', `Palang ${nm} depan`, rail);
          add(`t${i}-belakang`, 'x', xs[0] + L / 2, y, zb, xs[1] - xs[0] - L, 'rail-x', `Palang ${nm} belakang`, rail);
          plank(`papan-${i}`, `Papan ${nm}`, xs[0], xs[1], zb, zf, y);
          if (pagar) {
            add(`t${i}-pagar-belakang`, 'x', xs[0] + h, yPg(y), zb, xs[1] - xs[0] - L, 'custom', `Pagar ${nm} belakang`, thin);
            xs.forEach((x, k) => {
              add(`t${i}-pagar-sisi-${k}`, 'z', x, yPg(y), zb + h, zf + hw - zb - h, 'custom', `Pagar ${nm} ${k ? 'kanan' : 'kiri'}`, thin);
              fencePost(`t${i}-pagar-tegak-${k}`, `Tiang pagar ${nm} ${k ? 'kanan' : 'kiri'}`, x, zf, y);
            });
          }
        });
        outH = Hc;
      } else {
        W = kol + 2 * L;
        const xs = kol > 100 ? [L / 2, W / 2, W - L / 2] : [L / 2, W - L / 2];
        const xl = xs[0];
        const xr = xs[xs.length - 1];
        const tapak = model === 'tapak';
        const silang = model === 'silang';
        const zc = D / 2;
        if (model === 'konsol') wall = true;
        const yHead = y1 + rh / 2; // kaki silang: permukaan atas kepala kaki = permukaan atas palang papan terbawah

        // Kaki / tiang
        xs.forEach((x, i) => {
          const nm = xs.length > 2 && i === 1 ? 'tengah' : x === xl ? 'kiri' : 'kanan';
          if (model === 'empat') {
            [zb, zf].forEach((z, j) => add(`tiang-${i}-${j}`, 'y', x, 0, z, postTop, 'post', `Kaki ${nm} ${j ? 'depan' : 'belakang'}`, pt));
          } else if (model === 'samping') {
            add(`tapak-${i}`, 'z', x, L / 2, 0, D, 'rail-z', `Tapak lantai ${nm}`, pt);
            [zb, zf].forEach((z, j) => add(`tiang-${i}-${j}`, 'y', x, L, z, postTop - L, 'post', `Tiang ${nm} ${j ? 'depan' : 'belakang'}`, pt));
            add(`bingkai-tengah-${i}`, 'z', x, r1(y1 / 2), zb + L / 2, zf - zb - L, 'rail-z', `Palang tengah bingkai ${nm}`, rail);
          } else if (silang) {
            // Dua kaki miring dipasang BERSEBELAHAN (masing-masing setengah lebar tiang) dan dilas di titik silang,
            // ujung atasnya menempel di bawah kepala kaki menerus depan–belakang; tiang atas berdiri di atas kepala kaki.
            const yk = yHead - L;
            add(`kepala-${i}`, 'z', x, yk + L / 2, 0, D, 'rail-z', `Kepala kaki silang ${nm}`, pt);
            const leg: [number, number] = [h * 10, L * 10];
            const uy = yk / Math.hypot(yk, zf - zb);
            const e = h / uy - h + 0.1; // potongan rata lantai/kepala lebih lebar dari pipa: geser ke dalam
            line(`kaki-${i}-a`, [x - h / 2, 0, zb + e], [x - h / 2, yk, zf - e], 'post', `Kaki silang ${nm} (miring ke depan)`, leg);
            line(`kaki-${i}-b`, [x + h / 2, 0, zf - e], [x + h / 2, yk, zb + e], 'post', `Kaki silang ${nm} (miring ke belakang)`, leg);
            [zb, zf].forEach((z, j) => add(`tiang-${i}-${j}`, 'y', x, yHead, z, postTop - yHead, 'post', `Tiang atas ${nm} ${j ? 'depan' : 'belakang'}`, pt));
          } else if (tapak) {
            add(`tapak-${i}`, 'z', x, L / 2, 0, D, 'rail-z', `Tapak melintang ${nm}`, pt);
            add(`tiang-${i}`, 'y', x, L, zc, yTop + rh / 2 - L, 'post', `Tiang ${nm}`, pt);
            [-1, 1].forEach((s, j) =>
              brace(`siku-${i}-${j}`, `Penguat lengan ${nm} ${j ? 'depan' : 'belakang'}`, 'z', x, [zc + s * h, y1 - 15], [zc + s * (zc - L / 2 - 3), y1 - rh / 2], 'v', 'h')
            );
          } else {
            // konsol: kaki depan ke lantai, tiang belakang dibaut tembok
            add(`kaki-${i}`, 'y', x, 0, zf, postTop, 'post', `Kaki depan ${nm}`, pt);
            add(`tembok-${i}`, 'y', x, y1 - 20, zb, postTop - (y1 - 20), 'post', `Tiang tembok ${nm}`, pt);
            brace(`siku-tembok-${i}`, `Penguat siku tembok ${nm}`, 'z', x, [zb + h, y1 - 18], [zb + (zf - zb) * 0.5, y1 - rh / 2], 'v', 'h');
          }
        });

        // Tingkat papan di atas kolong
        const off = tapak ? rh / 2 : L / 2;
        ys.forEach((y, i) => {
          const nm = `rak ${i + 1}`;
          xs.forEach((x, k) => {
            if (tapak) {
              // lengan dari rata sisi luar palang belakang / depan sampai sisi tiang
              add(`t${i}-lengan-${k}-b`, 'z', x, y, zb - rh / 2, zc - L / 2 - zb + rh / 2, 'rail-z', `Lengan ${nm} belakang ${k + 1}`, rail);
              add(`t${i}-lengan-${k}-d`, 'z', x, y, zc + L / 2, zf + rh / 2 - zc - L / 2, 'rail-z', `Lengan ${nm} depan ${k + 1}`, rail);
            } else if (!(silang && i === 0)) add(`t${i}-samping-${k}`, 'z', x, y, zb + L / 2, zf - zb - L, 'rail-z', `Palang ${nm} samping ${k + 1}`, rail);
          });
          for (let j = 0; j < xs.length - 1; j++) {
            const sfx = xs.length > 2 ? ` ${j + 1}` : '';
            add(`t${i}-depan-${j}`, 'x', xs[j] + off, y, zf, xs[j + 1] - xs[j] - 2 * off, 'rail-x', `Palang ${nm} depan${sfx}`, rail);
            add(`t${i}-belakang-${j}`, 'x', xs[j] + off, y, zb, xs[j + 1] - xs[j] - 2 * off, 'rail-x', `Palang ${nm} belakang${sfx}`, rail);
            plank(`papan-${i}-${j}`, `Papan ${nm}${sfx}`, xs[j], xs[j + 1], zb, zf, y);
          }
          if (pagar) {
            const yp = yPg(y);
            if (tapak) {
              // tiang pagar tipis di tiap ujung lengan, pagar mendatar menerus di atasnya
              add(`t${i}-pagar-belakang`, 'x', xl - hw, yp, zb, xr - xl + 2 * hw, 'custom', `Pagar ${nm} belakang`, thin);
              const above = yp - hw > yTop + rh / 2; // pagar di atas ujung tiang: pagar samping menerus
              [xl, xr].forEach((x, k) => {
                const side = k ? 'kanan' : 'kiri';
                if (above) add(`t${i}-pagar-${side}`, 'z', x, yp, zb + hw, zf - zb, 'custom', `Pagar ${nm} ${side}`, thin);
                else {
                  add(`t${i}-pagar-${side}-b`, 'z', x, yp, zb + hw, zc - L / 2 - zb - hw, 'custom', `Pagar ${nm} ${side} belakang`, thin);
                  add(`t${i}-pagar-${side}-d`, 'z', x, yp, zc + L / 2, zf + hw - zc - L / 2, 'custom', `Pagar ${nm} ${side} depan`, thin);
                }
                fencePost(`t${i}-pagar-tegak-${side}-b`, `Tiang pagar ${nm} ${side} belakang`, x, zb, y);
                fencePost(`t${i}-pagar-tegak-${side}-d`, `Tiang pagar ${nm} ${side} depan`, x, zf, y);
              });
              if (xs.length > 2) fencePost(`t${i}-pagar-tegak-tengah`, `Tiang pagar ${nm} tengah`, xs[1], zb, y);
            } else {
              // semua tiang menerus sampai atas pagar: pagar dipotong pas di antara tiang
              for (let j = 0; j < xs.length - 1; j++) {
                const sfx = xs.length > 2 ? ` ${j + 1}` : '';
                add(`t${i}-pagar-belakang${j ? `-${j}` : ''}`, 'x', xs[j] + h, yp, zb, xs[j + 1] - xs[j] - L, 'custom', `Pagar ${nm} belakang${sfx}`, thin);
              }
              [xl, xr].forEach((x, k) => {
                const side = k ? 'kanan' : 'kiri';
                add(`t${i}-pagar-${side}`, 'z', x, yp, zb + h, zf - zb - L, 'custom', `Pagar ${nm} ${side}`, thin);
              });
            }
          }
        });
        // Penguat kolong
        if (model === 'empat') {
          const kb = Math.min(12, (zf - zb) / 2 - 1);
          xs.forEach((x, i) => {
            brace(`siku-samping-${i}-b`, `Siku kolong samping ${i + 1} belakang`, 'z', x, [zb + h, y1 - 13], [zb + kb, y1 - rh / 2], 'v', 'h');
            brace(`siku-samping-${i}-d`, `Siku kolong samping ${i + 1} depan`, 'z', x, [zf - h, y1 - 13], [zf - kb, y1 - rh / 2], 'v', 'h');
            [-1, 1].forEach((s) => {
              if ((x === xl && s < 0) || (x === xr && s > 0)) return;
              brace(`siku-depan-${i}-${s > 0 ? 'ka' : 'ki'}`, `Siku kolong depan ${i + 1}`, 'x', zf, [x + s * h, y1 - 13], [x + s * 12, y1 - rh / 2], 'v', 'h');
            });
          });
          // Silang X belakang di antara rak 1 & rak 2: dua pipa ditumpuk bersebelahan (depan–belakang) dan dilas di
          // titik silang; ujung bawah di atas pagar / papan rak 1, ujung atas di bawah palang rak 2, sisi menempel tiang.
          const yLo = pagar ? yPg(ys[0]) + hw : ys[0] + rh / 2 + b;
          const yHi = ys[1] - rh / 2;
          const dz = Math.max(0, 2 * hw - h);
          for (let j = 0; j < xs.length - 1; j++) {
            brace(`silang-belakang-${j}-a`, `Silang X belakang ${j + 1}`, 'x', zb - hw + dz, [xs[j] + h, yLo], [xs[j + 1] - h, yHi], 'vh', 'vh');
            brace(`silang-belakang-${j}-b`, `Silang X belakang ${j + 1}`, 'x', zb + hw + dz, [xs[j + 1] - h, yLo], [xs[j] + h, yHi], 'vh', 'vh');
          }
        }
        if (model === 'konsol')
          xs.forEach((x, i) =>
            [-1, 1].forEach((s) => {
              if ((x === xl && s < 0) || (x === xr && s > 0)) return;
              brace(`siku-depan-${i}-${s > 0 ? 'ka' : 'ki'}`, `Siku kolong depan ${i + 1}`, 'x', zf, [x + s * h, y1 - 13], [x + s * 12, y1 - rh / 2], 'v', 'h');
            })
          );

        // Pipa handuk di depan bawah rak terbawah
        if (handuk) {
          const yH = silang || tapak ? y1 : y1 - 6;
          const z0 = tapak ? zf + rh / 2 : zf + L / 2;
          towelBar(xl, xr, yH, z0, D + 5);
          outD = D + 6;
        }
      }
      if (pagar) outH = Math.max(outH, yPg(yTop) + 0.75);
    } else if (model === 'sudut') {
      // ---------- Rak sudut segitiga: 3 tiang, palang miring depan, papan bilah ----------
      wall = true;
      const S = D;
      W = S;
      const yTop = H - rh / 2;
      const ys = levels(12, yTop, n);
      const postTop = yTop + rh / 2 + extra;
      const P: [number, number, string][] = [
        [L / 2, L / 2, 'pojok'],
        [L / 2, S - L / 2, 'kiri depan'],
        [S - L / 2, L / 2, 'kanan belakang'],
      ];
      P.forEach(([x, z, nm], i) => add(`tiang-${i}`, 'y', x, 0, z, postTop, 'post', `Tiang ${nm}`, pt));
      const k = S >= 40 ? 4 : 3;
      const w = (S - L) / k;
      // Palang miring 45° (potongan ujung tegak, rata sisi tiang) dari sisi kanan tiang kiri depan ke sisi kiri tiang
      // kanan belakang. Palang tembok belakang berhenti di sisi belakang palang miring (bukan menembus ke tiang).
      const rw = rail[0] / 10;
      const xBack = S - (L / 2 + rw / 2) - (rw / 2) * Math.SQRT2 - 0.1;
      ys.forEach((y, i) => {
        const nm = `rak ${i + 1}`;
        add(`t${i}-belakang`, 'x', L, y, L / 2, xBack - L, 'rail-x', `Palang ${nm} tembok belakang`, rail);
        add(`t${i}-kiri`, 'z', L / 2, y, L, S - 2 * L, 'rail-z', `Palang ${nm} tembok kiri`, rail);
        line(`t${i}-miring`, [L, y, S - L], [S - L, y, L], 'rail-x', `Palang ${nm} depan (miring)`, rail);
        if (b > 0)
          for (let j = 0; j < k; j++) {
            const za = L / 2 + j * w;
            const ze = za + w - 0.3;
            const xe = S - ze;
            if (xe - L / 2 < 4) continue;
            boards.push(board(`papan-${i}-${j}`, `Bilah papan ${nm} ke-${j + 1}`, L / 2, xe, y + rh / 2, y + rh / 2 + b, za, ze));
          }
        if (pagar) line(`t${i}-pagar`, [L, yPg(y), S - L], [S - L, yPg(y), L], 'custom', `Pagar ${nm} depan`, thin);
      });
      outH = pagar ? yPg(yTop) + 0.75 : yTop + rh / 2 + b;
    } else if (model === 'sela') {
      // ---------- Rak sela: 2 tiang belakang di tapak (beroda), papan menjulur ke depan ----------
      W = num(p, 'panjang', 18);
      const roda = bool(p, 'roda');
      const inch = parseInt(str(p, 'ukuranRoda', '3')) || 3;
      const c = roda ? casterHeight(inch) : 0;
      const x0 = L / 2;
      const x1 = W - L / 2;
      const yTop = Math.max(c + 30, H - rh / 2);
      const ys = levels(c + L + 10, yTop, n);
      const postTop = yTop + rh / 2 + extra;
      const handle = 16;
      [x0, x1].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        add(`tapak-${i}`, 'z', x, c + L / 2, 0, D, 'rail-z', `Tapak ${nm}`, pt);
        add(`tiang-${i}`, 'y', x, c + L, zb, postTop - c - L, 'post', `Tiang belakang ${nm}`, pt);
        add(`penyangga-${i}`, 'y', x, c + L, zf - 3, ys[0] - rh / 2 - c - L, 'custom', `Penyangga depan papan bawah ${nm}`, thin);
      });
      ys.forEach((y, i) => {
        const nm = `rak ${i + 1}`;
        const last = i === ys.length - 1;
        [x0, x1].forEach((x, k) => {
          add(`t${i}-lengan-${k}`, 'z', x, y, zb + L / 2, zf + rh / 2 - zb - L / 2, 'rail-z', `Lengan ${nm} ${k ? 'kanan' : 'kiri'}`, rail);
          if (i > 0) brace(`t${i}-siku-${k}`, `Penguat lengan ${nm} ${k ? 'kanan' : 'kiri'}`, 'z', x, [zb + h, y - 12], [zb + (zf - zb) * 0.5, y - rh / 2], 'v', 'h');
        });
        add(`t${i}-belakang`, 'x', x0 + L / 2, y, zb, x1 - x0 - L, 'rail-x', `Palang ${nm} belakang`, rail);
        add(`t${i}-depan`, 'x', x0 + rh / 2, y, zf, x1 - x0 - rh, 'rail-x', `Palang ${nm} depan`, rail);
        plank(`papan-${i}`, `Papan ${nm}`, x0, x1, zb, zf, y);
        if (pagar) {
          add(`t${i}-pagar-belakang`, 'x', x0 + h, yPg(y), zb, x1 - x0 - L, 'custom', `Pagar ${nm} belakang`, thin);
          // rak teratas: pagar depan di antara tiang pegangan; rak lain: menerus di atas tiang pagar
          if (last) add(`t${i}-pagar-depan`, 'x', x0 + hw, yPg(y), zf, x1 - x0 - 2 * hw, 'custom', `Pagar ${nm} depan`, thin);
          else {
            add(`t${i}-pagar-depan`, 'x', x0 - hw, yPg(y), zf, x1 - x0 + 2 * hw, 'custom', `Pagar ${nm} depan`, thin);
            [x0, x1].forEach((x, k) => fencePost(`t${i}-pagar-tegak-${k}`, `Tiang pagar ${nm} depan ${k ? 'kanan' : 'kiri'}`, x, zf, y));
          }
        }
      });
      const yh = yTop + rh / 2 + handle;
      [x0, x1].forEach((x, k) => add(`pegangan-tegak-${k}`, 'y', x, yTop + rh / 2, zf, handle - hw, 'custom', `Tiang pegangan ${k ? 'kanan' : 'kiri'}`, thin));
      add('pegangan', 'x', x0 - hw, yh, zf, x1 - x0 + 2 * hw, 'custom', 'Pegangan tarik', thin);
      outH = yh + 0.75;
      if (roda) casters = casterSet([x0, x1], [3, D - 3], inch, true);
    } else if (model === 'kolong') {
      // ---------- Rak kolong wastafel: 4 tiang sudut + 2 tiang celah, papan atas bentuk U ----------
      W = num(p, 'panjang', 60);
      const x0 = L / 2;
      const x1 = W - L / 2;
      const yTop = Math.max(25, H - rh / 2);
      const nn = Math.min(3, n);
      const ys = levels(8, yTop, nn);
      const postTop = yTop + rh / 2 + extra;
      const gw = Math.max(14, Math.min(24, W * 0.3));
      const xa = W / 2 - gw / 2;
      const xb = W / 2 + gw / 2;
      const zn = r1(zb + D * 0.5);
      [x0, x1].forEach((x, i) => [zb, zf].forEach((z, j) => add(`tiang-${i}-${j}`, 'y', x, 0, z, postTop, 'post', `Tiang ${i ? 'kanan' : 'kiri'} ${j ? 'depan' : 'belakang'}`, pt)));
      const yBelow = ys[ys.length - 2];
      [xa, xb].forEach((x, i) => add(`tiang-celah-${i}`, 'y', x, yBelow + rh / 2, zb, yTop - yBelow, 'post', `Tiang celah pipa ${i ? 'kanan' : 'kiri'}`, pt));
      ys.forEach((y, i) => {
        const nm = `rak ${i + 1}`;
        const top = i === ys.length - 1;
        add(`t${i}-kiri`, 'z', x0, y, zb + L / 2, zf - zb - L, 'rail-z', `Palang ${nm} kiri`, rail);
        add(`t${i}-kanan`, 'z', x1, y, zb + L / 2, zf - zb - L, 'rail-z', `Palang ${nm} kanan`, rail);
        add(`t${i}-depan`, 'x', x0 + L / 2, y, zf, x1 - x0 - L, 'rail-x', `Palang ${nm} depan`, rail);
        if (!top) {
          add(`t${i}-belakang`, 'x', x0 + L / 2, y, zb, x1 - x0 - L, 'rail-x', `Palang ${nm} belakang`, rail);
          plank(`papan-${i}`, `Papan ${nm}`, x0, x1, zb, zf, y);
        } else {
          add(`t${i}-belakang-ki`, 'x', x0 + L / 2, y, zb, xa - x0 - L, 'rail-x', `Palang ${nm} belakang kiri`, rail);
          add(`t${i}-belakang-ka`, 'x', xb + L / 2, y, zb, x1 - xb - L, 'rail-x', `Palang ${nm} belakang kanan`, rail);
          // palang celah sampai rata sisi luar palang ujung celah, palang ujung celah di antaranya
          add(`t${i}-celah-ki`, 'z', xa, y, zb + L / 2, zn + rh / 2 - zb - L / 2, 'rail-z', `Palang celah pipa kiri`, rail);
          add(`t${i}-celah-ka`, 'z', xb, y, zb + L / 2, zn + rh / 2 - zb - L / 2, 'rail-z', `Palang celah pipa kanan`, rail);
          add(`t${i}-celah-depan`, 'x', xa + rh / 2, y, zn, xb - xa - rh, 'rail-x', `Palang ujung celah pipa`, rail);
          plank(`papan-${i}-ki`, `Papan ${nm} kiri`, x0, xa, zb, zf, y);
          plank(`papan-${i}-ka`, `Papan ${nm} kanan`, xb, x1, zb, zf, y);
          plank(`papan-${i}-tengah`, `Papan ${nm} depan celah`, xa, xb, zn, zf, y);
        }
        if (pagar)
          [x0, x1].forEach((x, k) => add(`t${i}-pagar-${k}`, 'z', x, yPg(y), zb + h, zf - zb - L, 'custom', `Pagar ${nm} ${k ? 'kanan' : 'kiri'}`, thin));
      });
      outH = pagar ? yPg(yTop) + 0.75 : yTop + rh / 2 + b;
    } else {
      // ---------- Keranjang dinding: 2 tiang tembok, keranjang berpagar 3 sisi, pipa handuk ----------
      wall = true;
      W = num(p, 'panjang', 45);
      const x0 = L / 2;
      const x1 = W - L / 2;
      const yb = num(p, 'tinggiBawah', 100) + rh / 2;
      const yTop = Math.max(yb + 15, H - rh / 2);
      const ys = levels(yb, yTop, n);
      const postTop = yTop + rh / 2 + extra;
      const barBot = handuk ? yb - 22 : yb - 14;
      [x0, x1].forEach((x, i) => add(`tiang-tembok-${i}`, 'y', x, barBot, zb, postTop - barBot, 'post', `Tiang dibaut tembok ${i ? 'kanan' : 'kiri'}`, pt));
      ys.forEach((y, i) => {
        const nm = `keranjang ${i + 1}`;
        [x0, x1].forEach((x, k) => {
          add(`t${i}-lengan-${k}`, 'z', x, y, zb + L / 2, zf + rh / 2 - zb - L / 2, 'rail-z', `Lengan ${nm} ${k ? 'kanan' : 'kiri'}`, rail);
          brace(`t${i}-siku-${k}`, `Penguat siku ${nm} ${k ? 'kanan' : 'kiri'}`, 'z', x, [zb + h, y - 12], [zb + (zf - zb) * 0.6, y - rh / 2], 'v', 'h');
          // pagar samping dari sisi tiang sampai menempel di belakang pagar depan
          add(`t${i}-pagar-${k}`, 'z', x, yPg(y), zb + h, zf - hw - zb - h, 'custom', `Pagar ${nm} ${k ? 'kanan' : 'kiri'}`, thin);
          fencePost(`t${i}-pagar-tegak-${k}`, `Tiang pagar ${nm} depan ${k ? 'kanan' : 'kiri'}`, x, zf, y);
        });
        add(`t${i}-belakang`, 'x', x0 + L / 2, y, zb, x1 - x0 - L, 'rail-x', `Palang ${nm} belakang`, rail);
        add(`t${i}-depan`, 'x', x0 + rh / 2, y, zf, x1 - x0 - rh, 'rail-x', `Palang ${nm} depan`, rail);
        add(`t${i}-pagar-depan`, 'x', x0 - hw, yPg(y), zf, x1 - x0 + 2 * hw, 'custom', `Pagar ${nm} depan`, thin);
        plank(`papan-${i}`, `Alas ${nm}`, x0, x1, zb, zf, y);
      });
      if (handuk) {
        const yH = yb - 20;
        const zH = Math.max(zf, D - 3);
        towelBar(x0, x1, yH, zb + L / 2, zH);
      }
      outH = yPg(yTop) + 0.75;
    }

    return { members: list, boards, casters, W: r1(W), D: r1(outD), H: r1(outH), boardThick: 0, wall };
  },

  checks: (p) => {
    const out: ProductCheck[] = [];
    const model = mdl(p);
    const D = num(p, 'dalam');
    const H = num(p, 'tinggi');
    const n = Math.max(2, num(p, 'tingkat', 3));
    const pipa = str(p, 'pipa');
    if (LANGKAH.includes(model)) {
      const kol = num(p, 'lebarKolong');
      const tk = num(p, 'tinggiKolong');
      if (H < tk + 20)
        out.push({ level: 'warn', message: 'Rak hampir tidak ada di atas kolong: tinggi rak terlalu dekat dengan tinggi kolong.', fix: { label: `Tinggi ${Math.min(220, tk + 60)} cm`, params: { tinggi: Math.min(220, tk + 60) } } });
      else {
        const gap = (H - tk) / (n - 1);
        if (gap < 20)
          out.push({ level: 'warn', message: `Jarak antar papan hanya ${Math.round(gap)} cm, botol & deterjen sulit masuk.`, fix: { label: 'Kurangi 1 papan', params: { tingkat: Math.max(2, n - 1) } } });
      }
      if (FREE.includes(model)) {
        const ratio = H / Math.max(1, D);
        if (ratio > 8)
          out.push({ level: 'warn', message: 'Rak tinggi dan sangat tipis mudah terguling ke depan, apalagi saat menarik barang.', fix: { label: `Kedalaman ${Math.ceil(H / 7)} cm`, params: { dalam: Math.min(60, Math.ceil(H / 7)) } } });
        else if (ratio > 4.5) out.push({ level: 'info', message: 'Rak tinggi & ramping: ikat bagian atas ke tembok dengan siku kecil supaya tidak goyang.' });
        if (pipa === '20' && H > 190)
          out.push({ level: 'warn', message: 'Kaki 20×20 terlalu ramping untuk rak setinggi ini.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
      }
      if ((model === 'gamma' || model === 'plafon') && kol > 100)
        out.push({ level: 'warn', message: `Papan sepanjang ${kol} cm tanpa tiang tengah akan melendut.`, fix: { label: 'Kolong 90 cm', params: { lebarKolong: 90 } } });
      if (model === 'gamma' && pipa === '20')
        out.push({ level: 'warn', message: 'Kolom samping menahan rak yang menjulur, pipa 20×20 terlalu lentur.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
      if (kol > 100 && model !== 'gamma' && model !== 'plafon')
        out.push({ level: 'info', message: `Kolong lebar: tiang tengah dipasang otomatis, tiap kolong ±${Math.round((kol - 3) / 2)} cm.` });
      if (model === 'plafon') {
        const hc = num(p, 'tinggiPlafon');
        if (H > hc - 15)
          out.push({ level: 'warn', message: 'Papan teratas terlalu dekat plafon, barang tidak bisa ditaruh.', fix: { label: `Tinggi ${hc - 40} cm`, params: { tinggi: Math.max(30, hc - 40) } } });
        out.push({ level: 'info', message: 'Plat atas dibaut ke balok / beton plafon, bukan ke gypsum.' });
      }
      if (model === 'konsol' || model === 'gamma') out.push({ level: 'info', message: 'Tiang tembok dibaut dengan fischer minimal 2 titik; hindari dinding yang ada pipa air di dalamnya.' });
      if (kol >= 60 && tk < 95) out.push({ level: 'info', message: 'Mesin cuci bukaan depan butuh kolong ±95–100 cm, bukaan atas ±130 cm.' });
    } else if (model === 'sudut') {
      if ((H - 12) / (n - 1) < 20)
        out.push({ level: 'warn', message: 'Jarak antar papan sudut terlalu rapat.', fix: { label: 'Kurangi 1 papan', params: { tingkat: Math.max(2, n - 1) } } });
      if (D < 25)
        out.push({ level: 'warn', message: 'Sisi rak sudut di bawah 25 cm, papan segitiganya terlalu kecil untuk botol.', fix: { label: 'Sisi 30 cm', params: { dalam: 30 } } });
      if (pipa === '20' && H > 160)
        out.push({ level: 'warn', message: 'Tiang 20×20 terlalu ramping untuk rak sudut setinggi ini.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
    } else if (model === 'sela') {
      const Wp = num(p, 'panjang');
      if (H / Math.max(1, Wp) > 6.5)
        out.push({ level: 'warn', message: 'Rak sela terlalu tinggi untuk lebarnya, mudah rebah ke samping saat ditarik.', fix: { label: `Tinggi ${Math.floor(Wp * 6)} cm`, params: { tinggi: Math.max(30, Math.floor(Wp * 6)) } } });
      if ((H - 14) / (n - 1) < 18)
        out.push({ level: 'warn', message: 'Jarak antar papan terlalu rapat untuk botol.', fix: { label: 'Kurangi 1 papan', params: { tingkat: Math.max(2, n - 1) } } });
      if (D < 30) out.push({ level: 'warn', message: 'Rak sela kurang dalam, papan menjulur jadi terlalu pendek.', fix: { label: 'Dalam 40 cm', params: { dalam: 40 } } });
      out.push({ level: 'info', message: 'Ukur celah di samping mesin, kurangi 2 cm supaya rak mudah ditarik.' });
    } else if (model === 'kolong') {
      if (num(p, 'panjang') < 40)
        out.push({ level: 'warn', message: 'Rak kolong terlalu sempit: celah pipa memakan hampir semua papan atas.', fix: { label: 'Lebar 50 cm', params: { panjang: 50 } } });
      if (H > 60 || H < 30)
        out.push({ level: 'warn', message: 'Tinggi rak kolong harus di bawah sifon wastafel (umumnya 35–55 cm).', fix: { label: 'Tinggi 45 cm', params: { tinggi: 45 } } });
      out.push({ level: 'info', message: 'Ukur posisi pipa pembuangan; celah pipa ada di tengah belakang papan atas.' });
    } else {
      const yb = num(p, 'tinggiBawah');
      if (H < yb + 15)
        out.push({ level: 'warn', message: 'Keranjang teratas lebih rendah dari keranjang terbawah.', fix: { label: `Tinggi ${Math.min(220, yb + 50)} cm`, params: { tinggi: Math.min(220, yb + 50) } } });
      else if ((H - yb) / (n - 1) < 18)
        out.push({ level: 'warn', message: 'Jarak antar keranjang terlalu rapat, botol shampoo tidak muat.', fix: { label: 'Kurangi 1 keranjang', params: { tingkat: Math.max(2, n - 1) } } });
      if (D > 30) out.push({ level: 'warn', message: 'Keranjang dinding lebih dari 30 cm menjorok membuat siku tembok bekerja berat.', fix: { label: 'Dalam 22 cm', params: { dalam: 22 } } });
      out.push({ level: 'info', message: 'Dibaut ke tembok dengan fischer di kedua tiang, minimal 2 titik per tiang.' });
    }
    if (str(p, 'papan') === 'kayu' || str(p, 'papan') === 'multiplek')
      out.push({ level: 'info', message: 'Kamar mandi lembap: pakai cat dasar anti karat; papan kayu / multiplek perlu dilapis atau diganti HPL.', fix: { label: 'Pakai multiplek + HPL', params: { papan: 'hpl' } } });
    return out;
  },
};
