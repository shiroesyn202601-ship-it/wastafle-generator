import { Board, Caster, Params, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, CASTER_OPTIONS, board, bool, casterHeight, casterSet, materialParams, memberFactory, num, r1, str } from './common';

/**
 * Podium & mimbar. Semua template punya PAPAN BACA MIRING berbibir penahan di pucuk (sisi rendah menghadap
 * pembicara, sisi tinggi menghadap hadirin di depan / z besar). Bentuk rangka (param `model`):
 * - panel-kotak: 4 tiang tegak (belakang pendek, depan tinggi), rangka kotak, panel depan & samping untuk logo
 * - meruncing: 4 kaki miring menyempit ke atas (piramida terpancung), ring bawah, rangka terbuka
 * - tiang-plat: satu tiang tegak di plat besi persegi, kepala papan baca di pucuk
 * - kantilever: tiang miring condong ke depan dari tapak T di lantai, kepala papan baca menjorok
 * - kaki-a: kaki A di sisi kiri & kanan, papan baca di atas puncak A, rak di palang bawah
 * - beroda: dua tiang di tapak H beroda, rak tengah, pegangan dorong di belakang
 * - meja: rangka baji kecil (samping segitiga) ditaruh di atas meja, tanpa kaki
 * - mimbar-tangga: anak tangga dari belakang naik ke lantai pijak depan, pagar jeruji miring, dudukan khatib
 * - mimbar-atap: mimbar bertangga + 4 tiang naik ke atap datar di atas lantai pijak
 * - mimbar-kotak: mimbar bertangga tertutup panel di kedua sisi, beroda
 * - panggung: lantai pijak rendah berkaki pendek + podium dua tiang berdiri di depan tepi panggung
 * - tripod: stand partitur, tiang tegak tunggal di kaki tripod pendek
 * - rehal-x: rehal berdiri, kaki silang X berporos di kiri & kanan (bisa dilipat)
 */
const MODELS = [
  { value: 'panel-kotak', label: 'Podium panel kotak', desc: '4 tiang, ditutup panel depan & samping' },
  { value: 'meruncing', label: 'Podium kaki meruncing', desc: '4 kaki miring menyempit ke atas' },
  { value: 'tiang-plat', label: 'Podium tiang plat', desc: 'Satu tiang di plat besi lantai' },
  { value: 'kantilever', label: 'Podium tiang miring', desc: 'Tiang condong dari tapak T' },
  { value: 'kaki-a', label: 'Podium kaki A', desc: 'Kaki A di kiri & kanan, rak bawah' },
  { value: 'beroda', label: 'Podium beroda', desc: 'Dua tiang di tapak H beroda' },
  { value: 'meja', label: 'Podium meja', desc: 'Kotak baji kecil di atas meja' },
  { value: 'mimbar-tangga', label: 'Mimbar bertangga', desc: 'Tangga, pagar jeruji, dudukan khatib' },
  { value: 'mimbar-atap', label: 'Mimbar beratap', desc: 'Mimbar bertangga + atap 4 tiang' },
  { value: 'mimbar-kotak', label: 'Mimbar kotak beroda', desc: 'Sisi tertutup panel, bisa didorong' },
  { value: 'panggung', label: 'Panggung + podium', desc: 'Lantai pijak rendah, podium di depan' },
  { value: 'tripod', label: 'Stand partitur tripod', desc: 'Tiang tunggal di kaki tiga pendek' },
  { value: 'rehal-x', label: 'Rehal berdiri lipat', desc: 'Kaki silang X berporos' },
];
const KEYS = MODELS.map((m) => m.value);
const model = (p: Params) => {
  const m = str(p, 'model', 'panel-kotak');
  return KEYS.includes(m) ? m : 'panel-kotak';
};
const has = (...m: string[]) => (p: Params) => m.includes(model(p));
const clampI = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(v)));
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const DEG = Math.PI / 180;

/** Ukuran papan baca untuk model stand (lebar × kedalaman miring, cm) */
const BIDANG: Record<string, { w: number; d: number }> = { a4: { w: 45, d: 35 }, folio: { w: 55, d: 40 }, besar: { w: 70, d: 50 } };
const BIDANG_OPTIONS = [
  { value: 'a4', label: 'A4 / partitur', desc: '45 × 35 cm' },
  { value: 'folio', label: 'Folio / Al-Quran', desc: '55 × 40 cm' },
  { value: 'besar', label: 'Besar / laptop', desc: '70 × 50 cm' },
];

const MIMBAR = ['mimbar-tangga', 'mimbar-atap', 'mimbar-kotak'];
const STAND = ['tiang-plat', 'kantilever', 'tripod', 'rehal-x']; // lebar ikut ukuran papan baca
const PANEL_MODELS = ['panel-kotak', 'beroda', 'meja', 'mimbar-tangga', 'mimbar-atap', 'panggung'];
const RAK_MODELS = ['panel-kotak', 'meruncing', 'kaki-a', 'beroda', 'panggung'];
const RODA_MODELS = ['beroda', 'mimbar-kotak'];
const TANGGA_MODELS = [...MIMBAR, 'panggung'];
const RISE = 20; // tinggi satu anak tangga mimbar (cm)
const RISE_PANGGUNG = 18;
const PAGAR = 90; // tinggi pagar mimbar dari lantai pijak

export const PODIUM: ProductDef = {
  id: 'podium',
  name: 'Podium & mimbar',
  tagline: 'podium pidato · mimbar masjid · stand partitur · rehal',
  icon: 'M14 10l32-4M14 10v4M46 6v4M18 12v22M42 10v24M12 34h36M18 22h24',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['model', 'lebar', 'dalam', 'tinggi', 'bidang', 'sudut'] },
    { id: 'bentuk', title: 'Bentuk', keys: ['anakTangga', 'panel', 'rak', 'dudukan'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Roda', keys: ['ukuranRoda', 'remRoda'] },
  ],
  params: [
    { key: 'model', label: 'Bentuk rangka', type: 'choice', options: MODELS },
    {
      key: 'lebar',
      label: 'Lebar',
      type: 'number',
      unit: 'cm',
      min: 30,
      max: 200,
      step: 1,
      help: 'Lebar podium dari kiri ke kanan. Mimbar: lebar tangga & lantai pijak. Panggung: lebar panggung.',
      marks: [{ value: 60, label: 'podium' }, { value: 90, label: 'mimbar' }, { value: 120, label: 'panggung' }],
      showIf: (p) => !STAND.includes(model(p)),
    },
    {
      key: 'dalam',
      label: 'Kedalaman',
      type: 'number',
      unit: 'cm',
      min: 25,
      max: 220,
      step: 1,
      help: 'Ukuran depan ke belakang. Mimbar: panjang tangga + lantai pijak. Tiang miring: panjang tapak lantai.',
      marks: [{ value: 45, label: 'podium' }, { value: 160, label: 'mimbar' }],
      showIf: (p) => !['tiang-plat', 'tripod', 'rehal-x'].includes(model(p)),
    },
    {
      key: 'tinggi',
      label: 'Tinggi papan baca',
      type: 'number',
      unit: 'cm',
      min: 15,
      max: 160,
      step: 1,
      help: 'Tinggi tepi atas papan baca. Podium dari lantai (umum 110–120), mimbar & panggung dari lantai pijak, podium meja dari permukaan meja.',
      marks: [{ value: 25, label: 'meja' }, { value: 75, label: 'duduk' }, { value: 115, label: 'berdiri' }],
    },
    {
      key: 'bidang',
      label: 'Ukuran papan baca',
      type: 'choice',
      options: BIDANG_OPTIONS,
      help: 'Pilih sesuai kertas atau kitab yang paling sering dibaca.',
      showIf: (p) => STAND.includes(model(p)),
    },
    {
      key: 'sudut',
      label: 'Kemiringan papan baca',
      type: 'number',
      unit: '°',
      min: 5,
      max: 40,
      step: 1,
      help: 'Makin miring makin mudah dibaca, tapi kertas lebih gampang melorot. Umumnya 15–25°.',
      marks: [{ value: 15, label: 'landai' }, { value: 20, label: 'umum' }, { value: 30, label: 'curam' }],
    },
    {
      key: 'anakTangga',
      label: 'Jumlah anak tangga',
      type: 'number',
      min: 1,
      max: 5,
      step: 1,
      help: 'Tiap anak tangga ±20 cm (panggung ±18 cm). Anak tangga teratas = lantai pijak.',
      marks: [{ value: 2, label: 'musala' }, { value: 3, label: 'masjid' }, { value: 5, label: 'besar' }],
      showIf: has(...TANGGA_MODELS),
    },
    { key: 'panel', label: 'Panel depan (logo)', type: 'toggle', help: 'Papan penutup di muka depan untuk logo atau nama instansi.', showIf: has(...PANEL_MODELS) },
    { key: 'rak', label: 'Rak dalam', type: 'toggle', help: 'Papan rak di bawah papan baca untuk air minum, map, atau mikrofon.', showIf: has(...RAK_MODELS) },
    { key: 'dudukan', label: 'Dudukan khatib', type: 'toggle', help: 'Tempat duduk di sisi lantai pijak, untuk duduk di antara dua khutbah.', showIf: has('mimbar-tangga', 'mimbar-atap') },
    ...materialParams(true),
    { key: 'ukuranRoda', label: 'Ukuran roda', type: 'choice', options: CASTER_OPTIONS, showIf: has(...RODA_MODELS) },
    { key: 'remRoda', label: 'Roda dengan rem', type: 'toggle', showIf: has(...RODA_MODELS) },
  ],
  defaults: {
    model: 'panel-kotak',
    lebar: 60,
    dalam: 45,
    tinggi: 115,
    bidang: 'folio',
    sudut: 20,
    anakTangga: 3,
    panel: true,
    rak: true,
    dudukan: true,
    pipa: '30',
    papan: 'kayu',
    warna: '#1f2226',
    ukuranRoda: '3',
    remRoda: true,
  },
  groups: [
    { id: 'podium-pidato', name: 'Podium pidato', desc: 'Panel kotak, tiang miring, beroda, podium meja' },
    { id: 'mimbar', name: 'Mimbar masjid', desc: 'Mimbar bertangga berpagar, beratap, kotak beroda, dan panggung + podium' },
  ],
  signature: (p) => `podium:${model(p)}`,
  presets: [
    {
      id: 'panel-kotak',
      group: 'podium-pidato',
      name: 'Podium panel kotak',
      desc: '4 tiang tegak (depan lebih tinggi), rangka kotak, panel menutup muka depan & samping',
      params: { model: 'panel-kotak', lebar: 60, dalam: 45, tinggi: 115, sudut: 20, panel: true, rak: true },
      sizes: [
        { label: 'Aula / kantor', desc: '60 × 45 × 115 cm', params: { lebar: 60, dalam: 45, tinggi: 115 } },
        { label: 'Sekolah', desc: '55 × 40 × 110 cm', params: { lebar: 55, dalam: 40, tinggi: 110 } },
        { label: 'Hotel / gedung', desc: '75 × 50 × 120 cm', params: { lebar: 75, dalam: 50, tinggi: 120 } },
      ],
    },
    {
      id: 'tiang-miring',
      group: 'podium-pidato',
      name: 'Podium tiang miring',
      desc: 'tiang condong ke depan dari tapak T di lantai, kepala papan baca menjorok di ujung tiang',
      params: { model: 'kantilever', bidang: 'folio', dalam: 55, tinggi: 115, sudut: 20, pipa: '40' },
      sizes: [
        { label: 'Folio', desc: 'tapak 55 cm, tinggi 115 cm', params: { bidang: 'folio', dalam: 55, tinggi: 115 } },
        { label: 'A4', desc: 'tapak 50 cm, tinggi 110 cm', params: { bidang: 'a4', dalam: 50, tinggi: 110 } },
        { label: 'Laptop', desc: 'tapak 65 cm, papan 70 × 50', params: { bidang: 'besar', dalam: 65, tinggi: 115 } },
      ],
    },
    {
      id: 'beroda',
      group: 'podium-pidato',
      name: 'Podium beroda',
      desc: 'dua tiang di tapak H beroda, rak di antara tiang, pegangan dorong di belakang',
      params: { model: 'beroda', lebar: 60, dalam: 50, tinggi: 115, sudut: 20, panel: true, rak: true },
      sizes: [
        { label: 'Aula', desc: '60 × 50 × 115 cm', params: { lebar: 60, dalam: 50, tinggi: 115 } },
        { label: 'Kelas', desc: '55 × 45 × 110 cm', params: { lebar: 55, dalam: 45, tinggi: 110 } },
        { label: 'Lebar', desc: '75 × 55 × 120 cm', params: { lebar: 75, dalam: 55, tinggi: 120, ukuranRoda: '4' } },
      ],
    },
    {
      id: 'podium-meja',
      group: 'podium-pidato',
      name: 'Podium meja',
      desc: 'rangka baji kecil bersisi segitiga tanpa kaki, ditaruh di atas meja',
      params: { model: 'meja', lebar: 50, dalam: 35, tinggi: 25, sudut: 20, panel: true, pipa: '20' },
      sizes: [
        { label: 'Meja rapat', desc: '50 × 35 × 25 cm', params: { lebar: 50, dalam: 35, tinggi: 25 } },
        { label: 'Kecil', desc: '40 × 30 × 22 cm', params: { lebar: 40, dalam: 30, tinggi: 22 } },
        { label: 'Laptop', desc: '60 × 40 × 28 cm', params: { lebar: 60, dalam: 40, tinggi: 28 } },
      ],
    },
    {
      id: 'mimbar-tangga',
      group: 'mimbar',
      name: 'Mimbar bertangga',
      desc: 'anak tangga dari belakang naik ke lantai pijak depan, pagar jeruji miring, dudukan khatib di sisi',
      params: { model: 'mimbar-tangga', lebar: 90, dalam: 160, tinggi: 115, sudut: 20, anakTangga: 3, panel: true, dudukan: true, pipa: '40' },
      sizes: [
        { label: 'Masjid', desc: '3 anak tangga, 90 × 160 cm', params: { lebar: 90, dalam: 160, anakTangga: 3 } },
        { label: 'Musala', desc: '2 anak tangga, 80 × 130 cm', params: { lebar: 80, dalam: 130, anakTangga: 2 } },
        { label: 'Masjid besar', desc: '5 anak tangga, 100 × 220 cm', params: { lebar: 100, dalam: 220, anakTangga: 5 } },
      ],
    },
    {
      id: 'mimbar-atap',
      group: 'mimbar',
      name: 'Mimbar beratap',
      desc: 'mimbar bertangga berpagar, 4 tiang di sudut lantai pijak naik ke rangka atap datar',
      params: { model: 'mimbar-atap', lebar: 90, dalam: 160, tinggi: 115, sudut: 20, anakTangga: 3, panel: true, dudukan: true, pipa: '40' },
      sizes: [
        { label: 'Masjid', desc: '3 anak tangga, 90 × 160 cm', params: { lebar: 90, dalam: 160, anakTangga: 3 } },
        { label: 'Masjid besar', desc: '4 anak tangga, 100 × 190 cm', params: { lebar: 100, dalam: 190, anakTangga: 4 } },
      ],
    },
    {
      id: 'mimbar-kotak',
      group: 'mimbar',
      name: 'Mimbar kotak beroda',
      desc: 'mimbar bertangga yang kedua sisinya tertutup panel, berdiri di roda',
      params: { model: 'mimbar-kotak', lebar: 80, dalam: 120, tinggi: 115, sudut: 20, anakTangga: 2, pipa: '40' },
      sizes: [
        { label: 'Musala', desc: '2 anak tangga, 80 × 120 cm', params: { lebar: 80, dalam: 120, anakTangga: 2 } },
        { label: 'Masjid', desc: '3 anak tangga, 90 × 150 cm', params: { lebar: 90, dalam: 150, anakTangga: 3, ukuranRoda: '4' } },
      ],
    },
    {
      id: 'panggung-podium',
      group: 'mimbar',
      name: 'Panggung pijak + podium',
      desc: 'lantai pijak rendah berkaki pendek, podium dua tiang berdiri di depan tepi panggung',
      params: { model: 'panggung', lebar: 120, dalam: 90, tinggi: 115, sudut: 20, anakTangga: 1, panel: true, rak: true, pipa: '40' },
      sizes: [
        { label: 'Musala / kelas', desc: '120 × 90 cm, tinggi 18 cm', params: { lebar: 120, dalam: 90, anakTangga: 1 } },
        { label: 'Aula', desc: '160 × 100 cm, tinggi 36 cm', params: { lebar: 160, dalam: 100, anakTangga: 2 } },
        { label: 'Kecil', desc: '90 × 80 cm, tinggi 18 cm', params: { lebar: 90, dalam: 80, anakTangga: 1 } },
      ],
    },
  ],
  summary: (p) => {
    const m = model(p);
    const H = num(p, 'tinggi');
    const s = num(p, 'sudut');
    if (STAND.includes(m)) {
      const bd = BIDANG[str(p, 'bidang', 'folio')] ?? BIDANG.folio;
      return `papan ${bd.w} × ${bd.d} cm · tinggi ${H} cm · miring ${s}°`;
    }
    if (MIMBAR.includes(m)) {
      const n = clampI(num(p, 'anakTangga', 3), 1, 5);
      return `${num(p, 'lebar')} × ${num(p, 'dalam')} cm · ${n} anak tangga (${n * RISE} cm) · papan baca ${H} cm dari pijakan`;
    }
    if (m === 'panggung') {
      const n = clampI(num(p, 'anakTangga', 1), 1, 5);
      return `panggung ${num(p, 'lebar')} × ${num(p, 'dalam')} × ${n * RISE_PANGGUNG} cm · papan baca ${H} cm dari pijakan`;
    }
    return `${num(p, 'lebar')} × ${num(p, 'dalam')} × ${H} cm · miring ${s}°${m === 'beroda' ? ' · beroda' : ''}`;
  },

  build: (p) => {
    const m = model(p);
    const W = num(p, 'lebar', 60);
    const D = num(p, 'dalam', 45);
    const H = num(p, 'tinggi', 115);
    const th = clamp(num(p, 'sudut', 20), 5, 40) * DEG;
    const L = (parseInt(str(p, 'pipa', '30')) || 30) / 10;
    const b = BOARD_THICK[str(p, 'papan', 'kayu')] ?? 2.5;
    const bd = BIDANG[str(p, 'bidang', 'folio')] ?? BIDANG.folio;
    const panel = bool(p, 'panel') && PANEL_MODELS.includes(m);
    const rak = bool(p, 'rak') && RAK_MODELS.includes(m);
    const inch = parseInt(str(p, 'ukuranRoda', '3')) || 3;
    const roda = RODA_MODELS.includes(m);
    const c = roda ? casterHeight(inch) : 0;
    const pt: [number, number] = [L * 10, L * 10];
    const rail: [number, number] = [20, 20];
    const thin: [number, number] = [15, 15];
    const hr = 2; // tebal rel kepala 20×20 (cm)
    const side = L / 2 + hr / 2; // rel miring kepala dilas di sisi DALAM tiang, bukan menembus pucuk tiang
    const { list, add, line } = memberFactory();
    const boards: Board[] = [];
    let casters: Caster[] = [];
    let outW = W;
    let outD = D;
    let outH = H;

    /**
     * Kepala papan baca: dua rel miring (x0r, x1r) dari belakang-bawah ke depan-atas, palang depan & belakang,
     * papan miring di atas rel, bibir penahan di tepi bawah. yTop = tinggi tepi atas papan.
     */
    const head = (x0r: number, x1r: number, bx0: number, bx1: number, zF: number, dh: number, yTop: number, ang = th) => {
      const yHi = yTop - b - hr / 2;
      const yLo = yHi - dh * Math.tan(ang);
      const zB = zF - dh;
      [x0r, x1r].forEach((x, i) => line(`kepala-rel-${i}`, [x, yLo, zB], [x, yHi, zF], 'rail-z', `Rel miring papan baca ${i ? 'kanan' : 'kiri'}`, rail));
      add('kepala-belakang', 'x', x0r + hr / 2, yLo, zB, x1r - x0r - hr, 'rail-x', 'Palang papan baca bawah (sisi pembicara)', rail);
      add('kepala-depan', 'x', x0r + hr / 2, yHi, zF, x1r - x0r - hr, 'rail-x', 'Palang papan baca atas', rail);
      const ls = dh / Math.cos(ang) + 2;
      const ny = Math.cos(ang);
      const nz = -Math.sin(ang);
      const ty = Math.sin(ang);
      const tz = Math.cos(ang);
      const off = hr / 2 + b / 2;
      const cy = (yLo + yHi) / 2 + ny * off;
      const cz = zB + dh / 2 + nz * off;
      if (b > 0) boards.push({ ...board('papan-baca', 'Papan baca miring', bx0, bx1, cy - b / 2, cy + b / 2, cz - ls / 2, cz + ls / 2), rotX: r1(-ang / DEG) });
      // bibir penahan di tepi bawah (sisi pembicara), menempel di atas papan
      const lo = b / 2 + 1;
      const ly = cy - ty * (ls / 2 - 1) + ny * lo;
      const lz = cz - tz * (ls / 2 - 1) + nz * lo;
      add('bibir', 'x', bx0, ly, lz, bx1 - bx0, 'custom', 'Bibir penahan kertas / kitab', rail);
      outH = Math.max(outH, r1(yHi + hr / 2 + b + 1));
      return { yLo, yHi, zB, yMid: (yLo + yHi) / 2, zMid: zB + dh / 2 };
    };
    /** 4 palang keliling di as tiang */
    const ring = (id: string, nm: string, x0: number, x1: number, z0: number, z1: number, y: number, tube: [number, number]) => {
      add(`${id}-depan`, 'x', x0 + L / 2, y, z1, x1 - x0 - L, 'rail-x', `Palang ${nm} depan`, tube);
      add(`${id}-belakang`, 'x', x0 + L / 2, y, z0, x1 - x0 - L, 'rail-x', `Palang ${nm} belakang`, tube);
      add(`${id}-kiri`, 'z', x0, y, z0 + L / 2, z1 - z0 - L, 'rail-z', `Palang ${nm} kiri`, tube);
      add(`${id}-kanan`, 'z', x1, y, z0 + L / 2, z1 - z0 - L, 'rail-z', `Palang ${nm} kanan`, tube);
    };

    if (m === 'panel-kotak') {
      const x0 = L / 2;
      const x1 = W - L / 2;
      const z0 = L / 2;
      const z1 = D - L / 2;
      const h = head(x0 + side, x1 - side, 0, W, z1, z1 - z0, H);
      [x0, x1].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        add(`tiang-${i}-b`, 'y', x, 0, z0, h.yLo - hr / 2, 'post', `Tiang ${nm} belakang`, pt);
        add(`tiang-${i}-d`, 'y', x, 0, z1, h.yHi - hr / 2, 'post', `Tiang ${nm} depan`, pt);
      });
      ring('ring-bawah', 'bawah', x0, x1, z0, z1, 6 + L / 2, pt);
      ring('ring-atas', 'atas', x0, x1, z0, z1, h.yLo - 12, rail);
      if (rak) {
        const yR = Math.round(h.yLo * 0.45);
        ring('ring-rak', 'rak', x0, x1, z0, z1, yR, rail);
        if (b > 0) boards.push(board('papan-rak', 'Papan rak dalam', L, W - L, yR + 1, yR + 1 + b, z0, z1));
      }
      if (panel && b > 0) {
        boards.push(board('panel-depan', 'Panel depan (logo)', 0, W, 2, h.yHi - hr / 2, D, D + b));
        boards.push(board('panel-kiri', 'Panel samping kiri', -b, 0, 2, h.yLo - hr / 2, 0, D));
        boards.push(board('panel-kanan', 'Panel samping kanan', W, W + b, 2, h.yLo - hr / 2, 0, D));
      }
    } else if (m === 'meruncing') {
      const k = clamp(Math.min(W, D) * 0.14, 5, 12);
      const x0 = L / 2;
      const x1 = W - L / 2;
      const z0 = L / 2;
      const z1 = D - L / 2;
      const h = head(x0 + k, x1 - k, k - 2, W - k + 2, z1 - k, z1 - z0 - 2 * k, H);
      type P3 = [number, number, number];
      const legs: { id: string; nm: string; a: P3; t: P3 }[] = [
        { id: 'kb', nm: 'kiri belakang', a: [x0, 0, z0], t: [x0 + k, h.yLo - hr / 2 - L / 2, z0 + k] },
        { id: 'nb', nm: 'kanan belakang', a: [x1, 0, z0], t: [x1 - k, h.yLo - hr / 2 - L / 2, z0 + k] },
        { id: 'kd', nm: 'kiri depan', a: [x0, 0, z1], t: [x0 + k, h.yHi - hr / 2 - L / 2, z1 - k] },
        { id: 'nd', nm: 'kanan depan', a: [x1, 0, z1], t: [x1 - k, h.yHi - hr / 2 - L / 2, z1 - k] },
      ];
      legs.forEach((lg) => line(`kaki-${lg.id}`, lg.a, lg.t, 'post', `Kaki ${lg.nm} (miring ke dalam)`, pt));
      const at = (i: number, y: number): P3 => {
        const lg = legs[i];
        const f = y / lg.t[1];
        return [r1(lg.a[0] + (lg.t[0] - lg.a[0]) * f), y, r1(lg.a[2] + (lg.t[2] - lg.a[2]) * f)];
      };
      const ringAt = (id: string, nm: string, y: number, tube: [number, number]) => {
        const [kb, nb, kd, nd] = [0, 1, 2, 3].map((i) => at(i, y));
        line(`${id}-belakang`, kb, nb, 'rail-x', `Palang ${nm} belakang`, tube);
        line(`${id}-depan`, kd, nd, 'rail-x', `Palang ${nm} depan`, tube);
        line(`${id}-kiri`, kb, kd, 'rail-z', `Palang ${nm} kiri`, tube);
        line(`${id}-kanan`, nb, nd, 'rail-z', `Palang ${nm} kanan`, tube);
        return { kb, nb, kd, nd };
      };
      ringAt('ring-bawah', 'bawah', 8, pt);
      ringAt('ring-atas', 'atas', Math.round(h.yLo - 14), rail);
      if (rak) {
        const yR = Math.round(h.yLo * 0.4);
        const r = ringAt('ring-rak', 'rak', yR, rail);
        if (b > 0) boards.push(board('papan-rak', 'Papan rak', Math.max(r.kb[0], r.kd[0]) + 1, Math.min(r.nb[0], r.nd[0]) - 1, yR + 1, yR + 1 + b, r.kb[2], r.kd[2]));
      }
    } else if (m === 'tiang-plat') {
      const ps = clamp(Math.round(H * 0.38), 36, 50);
      const dh = bd.d * Math.cos(th);
      outW = Math.max(bd.w, ps);
      const xc = outW / 2;
      const zc = Math.max(ps / 2, dh / 2 + 1);
      outD = Math.max(zc + ps / 2, zc + dh / 2 + 1);
      const plat = 0.8;
      boards.push({ ...board('plat-dasar', 'Plat dasar persegi', xc - ps / 2, xc + ps / 2, 0, plat, zc - ps / 2, zc + ps / 2), steelMm: 8 });
      const xr0 = xc - bd.w / 2 + 5;
      const xr1 = xc + bd.w / 2 - 5;
      const h = head(xr0, xr1, xc - bd.w / 2, xc + bd.w / 2, zc + dh / 2, dh, H);
      add('kepala-tengah', 'x', xr0 + hr / 2, h.yMid - hr, zc, xr1 - xr0 - hr, 'rail-x', 'Palang dudukan kepala (di atas tiang)', rail);
      add('tiang', 'y', xc, plat, zc, h.yMid - hr - hr / 2 - plat, 'post', 'Tiang tengah', pt);
      add('rak-kecil', 'x', xc - 12, h.yMid - 32, zc - L / 2 - 0.7, 24, 'custom', 'Palang kait (tas / mikrofon)', thin);
    } else if (m === 'kantilever') {
      const dh = bd.d * Math.cos(th);
      const Wb = 45;
      outW = Math.max(bd.w, Wb);
      const xc = outW / 2;
      const zc = Math.max(D * 0.62, dh / 2 + L);
      outD = Math.max(D, zc + dh / 2 + 1);
      add('tapak-belakang', 'x', xc - Wb / 2, L / 2, L / 2, Wb, 'rail-x', 'Tapak melintang belakang', pt);
      add('tapak-panjang', 'z', xc, L / 2, L, D - L, 'rail-z', 'Tapak memanjang ke depan', pt);
      const xr0 = xc - bd.w / 2 + 5;
      const xr1 = xc + bd.w / 2 - 5;
      const h = head(xr0, xr1, xc - bd.w / 2, xc + bd.w / 2, zc + dh / 2, dh, H);
      add('kepala-tengah', 'x', xr0 + hr / 2, h.yMid - hr, zc, xr1 - xr0 - hr, 'rail-x', 'Palang dudukan kepala (di ujung tiang)', rail);
      const yT = h.yMid - hr - hr / 2 - L / 2;
      const z0c = L / 2;
      line('tiang', [xc, L, z0c], [xc, yT, zc], 'post', 'Tiang miring (condong ke depan)', pt);
      const yP = 40;
      const zP = z0c + ((zc - z0c) * (yP - L)) / (yT - L);
      // penguat: muka atasnya (potong datar) menempel di sisi depan tiang miring, tidak masuk ke dalamnya
      const zBot = Math.min(D - 4, zP + 22);
      const wt = (L / 2) * (Math.hypot(yT - L, zc - z0c) / (yT - L)); // setengah lebar tiang diukur mendatar
      let zPt = zP + wt + hr / 2;
      for (let k = 0; k < 3; k++) zPt = zP + wt + (hr / 2) * (Math.hypot(yP - L, zBot - zPt) / (yP - L)) - 0.1;
      line('penguat', [xc, L, zBot], [xc, yP, zPt], 'custom', 'Penguat miring tiang ke tapak', rail);
    } else if (m === 'kaki-a') {
      const xs = [L / 2, W - L / 2];
      const zc = D / 2;
      const dh = Math.min(D * 0.8, 50);
      const h = head(xs[0], xs[1], 0, W, zc + dh / 2, dh, H);
      const yA = h.yMid - hr / 2 - L / 2;
      const zl = (y: number) => L / 2 + ((zc - L / 2) * y) / yA;
      xs.forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        line(`kaki-${i}-b`, [x, 0, L / 2], [x, yA, zc], 'post', `Kaki ${nm} belakang (miring)`, pt);
        line(`kaki-${i}-d`, [x, 0, D - L / 2], [x, yA, zc], 'post', `Kaki ${nm} depan (miring)`, pt);
        const yp = 10;
        add(`penahan-${i}`, 'z', x, yp, zl(yp) + L / 2, D - 2 * zl(yp) - L, 'rail-z', `Palang penahan kaki ${nm}`, rail);
      });
      const yS = 30;
      const zb = zl(yS);
      add('palang-b', 'x', L, yS, zb, W - 2 * L, 'rail-x', 'Palang penghubung belakang', rail);
      add('palang-d', 'x', L, yS, D - zb, W - 2 * L, 'rail-x', 'Palang penghubung depan', rail);
      if (rak && b > 0) boards.push(board('papan-rak', 'Papan rak bawah', L, W - L, yS + hr / 2, yS + hr / 2 + b, zb, D - zb));
    } else if (m === 'beroda') {
      const xs = [L / 2, W - L / 2];
      const zc = D / 2;
      const dh = Math.min(D * 0.8, 45);
      xs.forEach((x, i) => add(`tapak-${i}`, 'z', x, c + L / 2, 0, D, 'rail-z', `Tapak ${i ? 'kanan' : 'kiri'} (dudukan roda)`, pt));
      add('tapak-tengah', 'x', L, c + L / 2, zc, W - 2 * L, 'rail-x', 'Palang tapak tengah', pt);
      const h = head(xs[0] + side, xs[1] - side, 0, W, zc + dh / 2, dh, H);
      xs.forEach((x, i) => add(`tiang-${i}`, 'y', x, c + L, zc, h.yMid - hr / 2 - c - L, 'post', `Tiang ${i ? 'kanan' : 'kiri'}`, pt));
      if (rak) {
        const yR = Math.round(c + (h.yLo - c) * 0.45);
        xs.forEach((x, i) => {
          // dipotong dua: menempel di sisi belakang & depan tiang
          add(`lengan-rak-${i}`, 'z', x, yR, zc - 14, 14 - L / 2, 'rail-z', `Lengan rak ${i ? 'kanan' : 'kiri'} belakang`, rail);
          add(`lengan-rak-${i}-d`, 'z', x, yR, zc + L / 2, 14 - L / 2, 'rail-z', `Lengan rak ${i ? 'kanan' : 'kiri'} depan`, rail);
        });
        [zc - 13, zc + 13].forEach((z, j) => add(`palang-rak-${j}`, 'x', xs[0] + hr / 2, yR, z, xs[1] - xs[0] - hr, 'rail-x', `Palang rak ${j ? 'depan' : 'belakang'}`, rail));
        if (b > 0) boards.push(board('papan-rak', 'Papan rak', L, W - L, yR + 1, yR + 1 + b, zc - 14, zc + 14));
      }
      // pegangan dorong di belakang kepala
      const yH = h.yLo - 18;
      const zH = h.zB - 4;
      xs.forEach((x, i) => add(`lengan-pegangan-${i}`, 'z', x, yH, zH, zc - L / 2 - zH, 'rail-z', `Lengan pegangan ${i ? 'kanan' : 'kiri'}`, rail));
      add('pegangan', 'x', 0, yH, zH - 1, W, 'custom', 'Pegangan dorong', rail);
      if (panel && b > 0) boards.push(board('panel-depan', 'Panel depan (logo)', 0, W, c + L + 4, h.yLo - 2, zc + L / 2, zc + L / 2 + b));
      casters = casterSet(xs, [L / 2 + 2, D - L / 2 - 2], inch, bool(p, 'remRoda'));
    } else if (m === 'meja') {
      const x0 = L / 2;
      const x1 = W - L / 2;
      const z0 = L / 2;
      const z1 = D - L / 2;
      const dh = z1 - z0;
      const yHi = H - b - hr / 2;
      const yLoMin = L + hr / 2 + 2;
      const ang = Math.atan(Math.max(0.05, Math.min(Math.tan(th), (yHi - yLoMin) / dh)));
      const h = head(x0 + side, x1 - side, 0, W, z1, dh, H, ang);
      [x0, x1].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        add(`alas-${i}`, 'z', x, L / 2, 0, D, 'rail-z', `Alas samping ${nm}`, pt);
        add(`tiang-${i}-b`, 'y', x, L, z0, h.yLo - hr / 2 - L, 'post', `Tiang ${nm} belakang (pendek)`, pt);
        add(`tiang-${i}-d`, 'y', x, L, z1, h.yHi - hr / 2 - L, 'post', `Tiang ${nm} depan`, pt);
      });
      add('alas-belakang', 'x', L, L / 2, z0, W - 2 * L, 'rail-x', 'Alas belakang', pt);
      add('alas-depan', 'x', L, L / 2, z1, W - 2 * L, 'rail-x', 'Alas depan', pt);
      if (panel && b > 0) boards.push(board('panel-depan', 'Panel depan (logo)', 0, W, 0, h.yHi - hr / 2, D, D + b));
    } else if (MIMBAR.includes(m)) {
      // Tangga dari belakang (z = 0) naik ke lantai pijak di depan; kepala papan baca di tepi depan lantai pijak
      const n = clampI(num(p, 'anakTangga', 3), 1, 5);
      const ns = Math.max(1, n - 1);
      const hP = n * RISE;
      const Dh = 40;
      const Dp = clamp(D * 0.45, Dh + 30, 100);
      const S = Math.max(25, D - Dp);
      const t = S / ns;
      const xs = [L / 2, W - L / 2];
      const zPB = S + L / 2;
      const zPF = D - L / 2;
      const zHB = D - Dh + L / 2;
      const yPf = c + hP; // muka lantai pijak
      const jeruji = m !== 'mimbar-kotak';
      const atap = m === 'mimbar-atap';
      const yPagar = yPf + PAGAR;
      const seat = bool(p, 'dudukan') && jeruji;
      const ys = yPf + 45 - b - hr / 2;
      const zk = Array.from({ length: ns }, (_, k) => k * t + L / 2);
      const yh = (z: number) => c + RISE + PAGAR + ((hP - RISE) * (z - L / 2)) / (zPB - L / 2);
      // kepala papan baca: rel di sisi dalam tiang depan
      const h = head(L + hr / 2, W - L - hr / 2, 0, W, zPF, zPF - zHB, yPf + H);
      const yRoof = yPf + 210;
      // Pegangan tangga miring di bidang tiang: tiang & jeruji di bawahnya dipotong rata di muka bawah pegangan
      // (tidak menembus). Ujung atas pegangan masuk di bawah pagar lantai pijak (potong datar) atau menempel
      // di sisi belakang tiang lantai pijak (potong tegak) — ikut arah potong batang miring.
      const zk0 = zk[0];
      const kR = (hP - RISE) / (zPB - zk0);
      const phi = Math.atan(kR);
      const cutY = Math.sin(phi) >= 0.35;
      const wR = L / 2 / Math.sin(phi); // setengah lebar muka potong datar pegangan
      const hcR = L / 2 / Math.cos(phi); // setengah tebal pegangan diukur tegak
      const ze1 = cutY ? zPB - L / 2 - wR : zPB - L / 2;
      const ye1 = cutY ? yPagar - L / 2 : yPagar - L / 2 - hcR;
      const ze0 = cutY ? Math.max(zk0, wR) : zk0 - L / 2;
      const yr = (z: number) => ye1 - (ze1 - z) * kR;
      const ye0 = yr(ze0);
      const zStub = cutY ? zPB - L / 2 - 2 * wR : zPB - L / 2; // pagar lantai pijak menjorok ke belakang menutup ujung pegangan
      /** pucuk batang (setengah lebar hw) yang berdiri di bawah pegangan */
      const underRail = (z: number, hw: number) => Math.min(yPagar - L / 2, Math.max(cutY ? ye0 : -1e9, yr(Math.max(z - hw, ze0)) - hcR));
      xs.forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        // tiang anak tangga
        zk.forEach((z, k) => add(`tiang-tangga-${i}-${k + 1}`, 'y', x, c, z, underRail(z, L / 2) - c, 'post', `Tiang tangga ${nm} ${k + 1}`, pt));
        add(`tiang-pijak-b-${i}`, 'y', x, c, zPB, (atap ? yRoof - L / 2 : yPagar - L / 2) - c, 'post', `Tiang lantai pijak ${nm} belakang${atap ? ' (naik ke atap)' : ''}`, pt);
        add(`tiang-kepala-${i}`, 'y', x, c, zHB, Math.max(yPagar + L / 2, h.yLo) - c, 'post', `Tiang ${nm} di bawah papan baca`, pt);
        add(`tiang-pijak-d-${i}`, 'y', x, c, zPF, (atap ? yRoof - L / 2 : h.yHi + hr / 2) - c, 'post', `Tiang ${nm} depan${atap ? ' (naik ke atap)' : ''}`, pt);
        // pegangan tangga miring + pagar lantai pijak
        line(`pegangan-${i}`, [x, ye0, ze0], [x, ye1, ze1], 'rail-z', `Pegangan tangga ${nm} (miring)`, pt);
        if (atap) {
          // tiang belakang menerus ke atap: pagar dipotong dua di tiang
          if (zPB - L / 2 - zStub > 0.5) add(`pagar-pijak-${i}-b`, 'z', x, yPagar, zStub, zPB - L / 2 - zStub, 'rail-z', `Pagar lantai pijak ${nm} (ujung belakang)`, pt);
          add(`pagar-pijak-${i}`, 'z', x, yPagar, zPB + L / 2, zHB - zPB - L, 'rail-z', `Pagar lantai pijak ${nm}`, pt);
        } else add(`pagar-pijak-${i}`, 'z', x, yPagar, zStub, zHB - L / 2 - zStub, 'rail-z', `Pagar lantai pijak ${nm}`, pt);
        add(`pagar-kepala-${i}`, 'z', x, yPagar, zHB + L / 2, zPF - zHB - L, 'rail-z', `Pagar depan ${nm}`, pt);
        // rel lantai di antara tiang
        const zl = [...zk, zPB, zHB, zPF];
        for (let k = 0; k < zl.length - 1; k++) add(`rel-lantai-${i}-${k + 1}`, 'z', x, c + L / 2, zl[k] + L / 2, zl[k + 1] - zl[k] - L, 'rail-z', `Rel lantai ${nm} ${k + 1}`, pt);
        // rangka samping lantai pijak
        add(`samping-pijak-${i}-1`, 'z', x, yPf - b - L / 2, zPB + L / 2, zHB - zPB - L, 'rail-z', `Rangka lantai pijak ${nm} 1`, pt);
        add(`samping-pijak-${i}-2`, 'z', x, yPf - b - L / 2, zHB + L / 2, zPF - zHB - L, 'rail-z', `Rangka lantai pijak ${nm} 2`, pt);
        if (jeruji) {
          // jeruji tegak di bawah pegangan tangga & pagar lantai pijak
          const zj: number[] = [];
          for (let k = 0; k < zl.length - 1; k++) {
            const gap = zl[k + 1] - zl[k];
            const cnt = Math.max(0, Math.floor(gap / 14) - 1);
            for (let j = 1; j <= cnt; j++) zj.push(zl[k] + (gap * j) / (cnt + 1));
          }
          zj.forEach((z, j) => {
            const top = z < zPB ? underRail(z, thin[0] / 20) : yPagar - L / 2;
            const bot = z < zPB ? c + L : i === 0 && seat && z < zHB ? ys + hr / 2 + b : yPf;
            add(`jeruji-${i}-${j + 1}`, 'y', x, bot, z, top - bot, 'custom', `Jeruji pagar ${nm} ${j + 1}`, thin);
          });
        }
      });
      // anak tangga
      for (let k = 1; k <= ns; k++) {
        const yk = c + k * RISE;
        const zf = zk[k - 1];
        const zb = k < ns ? zk[k] : zPB;
        const y = yk - b - hr / 2;
        add(`tangga-${k}-a`, 'x', L, y, zf, W - 2 * L, 'rail-x', `Palang anak tangga ${k} belakang`, rail);
        add(`tangga-${k}-b`, 'x', L, y, zb, W - 2 * L, 'rail-x', `Palang anak tangga ${k} depan`, rail);
        if (b > 0) boards.push(board(`papan-tangga-${k}`, `Papan anak tangga ${k}`, L, W - L, yk - b, yk, zf - L / 2, zb + L / 2));
      }
      // lantai pijak
      [zPB, zHB, zPF].forEach((z, j) => add(`rangka-pijak-${j}`, 'x', L, yPf - b - L / 2, z, W - 2 * L, 'rail-x', `Rangka lantai pijak ${j + 1}`, pt));
      if (b > 0) boards.push(board('lantai-pijak', 'Lantai pijak khatib', L, W - L, yPf - b, yPf, zPB - L / 2, zPF + L / 2));
      add('rel-lantai-belakang', 'x', L, c + L / 2, zk[0], W - 2 * L, 'rail-x', 'Rel lantai belakang', pt);
      add('rel-lantai-depan', 'x', L, c + L / 2, zPF, W - 2 * L, 'rail-x', 'Rel lantai depan', pt);
      if (seat) {
        const sw = Math.min(35, W * 0.4);
        add('dudukan-luar', 'z', L / 2, ys, zPB + L / 2, zHB - zPB - L, 'rail-z', 'Palang dudukan (di tiang kiri)', rail);
        add('dudukan-lengan-b', 'x', L, ys, zPB, sw - L, 'rail-x', 'Lengan dudukan belakang', rail);
        add('dudukan-lengan-d', 'x', L, ys, zHB, sw - L, 'rail-x', 'Lengan dudukan depan', rail);
        add('dudukan-dalam', 'z', sw, ys, zPB + hr / 2, zHB - zPB - hr, 'rail-z', 'Palang dudukan dalam', rail);
        if (b > 0) boards.push(board('papan-dudukan', 'Dudukan khatib', L / 2, sw + 1, ys + hr / 2, ys + hr / 2 + b, zPB + L / 2, zHB - L / 2));
      }
      if (atap) {
        const yr = yRoof - L / 2;
        ring('ring-atap', 'atap', xs[0], xs[1], zPB, zPF, yr, pt);
        if (b > 0) boards.push(board('atap', 'Papan atap', -6, W + 6, yr + L / 2, yr + L / 2 + b, zPB - 6, zPF + 6));
        outH = Math.max(outH, r1(yr + L / 2 + b));
      }
      if ((panel || m === 'mimbar-kotak') && b > 0) boards.push(board('panel-depan', 'Panel depan (logo)', 0, W, c + 2, h.yHi - hr / 2, D, D + b));
      if (m === 'mimbar-kotak' && b > 0) {
        // panel samping: bertangga mengikuti pegangan, penuh di lantai pijak
        [
          { id: 'kiri', x0: -b, x1: 0 },
          { id: 'kanan', x0: W, x1: W + b },
        ].forEach((s) => {
          zk.forEach((z, k) => {
            const zn = k < ns - 1 ? zk[k + 1] : zPB;
            boards.push(board(`panel-${s.id}-${k + 1}`, `Panel samping ${s.id} ${k + 1}`, s.x0, s.x1, c + 2, yh(z) - L / 2, z - L / 2, zn - L / 2));
          });
          boards.push(board(`panel-${s.id}-pijak`, `Panel samping ${s.id} lantai pijak`, s.x0, s.x1, c + 2, yPagar - L / 2, zPB - L / 2, D));
        });
        outW = W + 2 * b;
      }
      if (roda) casters = casterSet(xs, [L / 2, zPF], inch, bool(p, 'remRoda'));
    } else if (m === 'panggung') {
      const n = clampI(num(p, 'anakTangga', 1), 1, 5);
      const hP = n * RISE_PANGGUNG;
      const Ds = n > 1 ? 30 : 0; // anak tangga di belakang
      const z0 = Ds + L / 2;
      const z1 = Ds + D - L / 2;
      const xsP = W > 100 ? [L / 2, W / 2, W - L / 2] : [L / 2, W - L / 2];
      const yR = hP - b - L / 2;
      xsP.forEach((x, i) => [z0, z1].forEach((z, j) => add(`kaki-${i}-${j}`, 'y', x, 0, z, hP - b - L, 'post', `Kaki panggung ${i + 1} ${j ? 'depan' : 'belakang'}`, pt)));
      [z0, z1].forEach((z, j) =>
        xsP.slice(0, -1).forEach((x, i) => add(`rangka-x-${j}-${i}`, 'x', x + L / 2, yR, z, xsP[i + 1] - x - L, 'rail-x', `Rangka panggung ${j ? 'depan' : 'belakang'} ${i + 1}`, pt))
      );
      xsP.forEach((x, i) => add(`rangka-z-${i}`, 'z', x, yR, z0 + L / 2, z1 - z0 - L, 'rail-z', `Rangka panggung melintang ${i + 1}`, pt));
      if (b > 0) boards.push(board('lantai-panggung', 'Lantai panggung', 0, W, hP - b, hP, Ds, Ds + D));
      if (n > 1) {
        const Wst = Math.min(W - 10, 70);
        const xa = W / 2 - Wst / 2;
        const xb = W / 2 + Wst / 2;
        const yS = hP / 2 - b - L / 2;
        const zs2 = z0 - L; // kaki tangga belakang menempel rangka belakang panggung
        [xa, xb].forEach((x, i) => {
          const nm = i ? 'kanan' : 'kiri';
          add(`kaki-tangga-${i}-a`, 'y', x, 0, L / 2, hP / 2 - b - L, 'post', `Kaki anak tangga ${nm} luar`, pt);
          add(`kaki-tangga-${i}-b`, 'y', x, 0, zs2, hP / 2 - b - L, 'post', `Kaki anak tangga ${nm} dalam`, pt);
          add(`rangka-tangga-${i}`, 'z', x, yS, L, zs2 - L, 'rail-z', `Rangka anak tangga ${nm}`, pt);
        });
        add('rangka-tangga-x', 'x', xa + L / 2, yS, L / 2, xb - xa - L, 'rail-x', 'Rangka anak tangga belakang', pt);
        if (b > 0) boards.push(board('papan-tangga', 'Papan anak tangga', xa - L / 2, xb + L / 2, hP / 2 - b, hP / 2, 0, z0 - L / 2));
      }
      // podium dua tiang di depan tepi panggung
      const Wp = Math.min(60, W - 10);
      const xa = W / 2 - Wp / 2 + L / 2;
      const xb = W / 2 + Wp / 2 - L / 2;
      const zT = z1 + L;
      const dh = 38;
      const h = head(xa + side, xb - side, W / 2 - Wp / 2, W / 2 + Wp / 2, zT, dh, hP + H);
      [xa, xb].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        add(`tiang-podium-${i}`, 'y', x, 0, zT, h.yHi - hr / 2, 'post', `Tiang podium ${nm}`, pt);
        // siku di bidang rel kepala (menempel sisi dalam tiang), pucuknya dipotong datar menempel di bawah rel
        const xr = i ? x - side : x + side;
        const zE = h.zB + 2;
        const yS = h.yLo - 25;
        let yE = h.yLo - hr / 2;
        for (let k = 0; k < 3; k++) {
          const ws = (hr / 2) * (Math.hypot(yE - yS, zT - L / 2 - zE) / (yE - yS));
          yE = h.yLo + (zE - ws - h.zB) * Math.tan(th) - hr / 2 / Math.cos(th) - 0.1;
        }
        line(`siku-podium-${i}`, [xr, yS, zT - L / 2], [xr, yE, zE], 'custom', `Siku penahan papan baca ${nm}`, rail);
      });
      add('palang-podium-bawah', 'x', xa + L / 2, hP + 8, zT, xb - xa - L, 'rail-x', 'Palang podium bawah', rail);
      if (rak) {
        const yK = Math.round(hP + H * 0.5);
        [xa, xb].forEach((x, i) => add(`lengan-rak-${i}`, 'z', x, yK, zT - 24, 24 - L / 2, 'rail-z', `Lengan rak ${i ? 'kanan' : 'kiri'}`, rail));
        add('palang-rak-b', 'x', xa + hr / 2, yK, zT - 23, xb - xa - hr, 'rail-x', 'Palang rak belakang', rail);
        add('palang-rak-d', 'x', xa + L / 2, yK, zT, xb - xa - L, 'rail-x', 'Palang rak depan', rail);
        if (b > 0) boards.push(board('papan-rak', 'Papan rak podium', xa + L / 2, xb - L / 2, yK + 1, yK + 1 + b, zT - 24, zT + 1));
      }
      if (panel && b > 0) boards.push(board('panel-depan', 'Panel depan podium (logo)', W / 2 - Wp / 2, W / 2 + Wp / 2, 2, h.yHi - hr / 2, zT + L / 2, zT + L / 2 + b));
      outD = r1(zT + L / 2 + (panel ? b : 0));
    } else if (m === 'tripod') {
      const R = clamp(Math.round(H * 0.24), 25, 35);
      const dh = bd.d * Math.cos(th);
      const xc = Math.max(bd.w / 2, R);
      const zc = Math.max(R, dh / 2 + 1);
      outW = 2 * xc;
      outD = Math.max(2 * zc, zc + R);
      const xr0 = xc - bd.w / 2 + 4;
      const xr1 = xc + bd.w / 2 - 4;
      const h = head(xr0, xr1, xc - bd.w / 2, xc + bd.w / 2, zc + dh / 2, dh, H);
      add('kepala-tengah', 'x', xr0 + hr / 2, h.yMid - hr, zc, xr1 - xr0 - hr, 'rail-x', 'Palang dudukan kepala', rail);
      const yBot = 10;
      add('tiang', 'y', xc, yBot, zc, h.yMid - hr - hr / 2 - yBot, 'post', 'Tiang tegak (bisa disetel tinggi)', pt);
      const yHub = 30;
      [-90, 30, 150].forEach((deg, k) => {
        const a = deg * DEG;
        const foot: [number, number, number] = [r1(xc + R * Math.cos(a)), 0, r1(zc + R * Math.sin(a))];
        const top: [number, number, number] = [r1(xc + (L / 2) * Math.cos(a)), yHub, r1(zc + (L / 2) * Math.sin(a))];
        line(`kaki-${k + 1}`, foot, top, 'post', `Kaki tripod ${k + 1}`, pt);
        const mid: [number, number, number] = [r1((foot[0] + top[0]) / 2), r1(yHub / 2), r1((foot[2] + top[2]) / 2)];
        line(`penguat-${k + 1}`, top.map((v, i) => (i === 1 ? yBot + 1 : v)) as [number, number, number], mid, 'custom', `Penguat kaki ${k + 1}`, thin);
      });
    } else {
      // rehal-x: kaki silang X berporos di kiri & kanan
      const dh = bd.d * Math.cos(th);
      const Df = Math.max(dh + 4, Math.round(H * 0.45));
      const zc = Df / 2;
      outW = bd.w;
      outD = Df;
      const xs = [L / 2 + 2, bd.w - L / 2 - 2];
      const zF = zc + dh / 2;
      const h = head(xs[0], xs[1], 0, bd.w, zF, dh, H);
      const tb: [number, number] = [h.yLo - hr / 2 - L / 2, h.zB + L / 2]; // ujung atas kaki ke belakang (y, z)
      const tf: [number, number] = [h.yHi - hr / 2 - L / 2, zF - L / 2];
      const fb = L / 2;
      const ff = Df - L / 2;
      // titik silang (poros) di bidang z-y
      const s1 = (tb[0] - 0) / (tb[1] - ff);
      const s2 = (tf[0] - 0) / (tf[1] - fb);
      const zp = (s1 * ff - s2 * fb) / (s1 - s2);
      const yp = s1 * (zp - ff);
      xs.forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        line(`kaki-${i}-a`, [x, 0, ff], [x, tb[0], tb[1]], 'post', `Kaki silang ${nm} 1 (depan bawah ke belakang atas)`, pt);
        line(`kaki-${i}-b`, [x, 0, fb], [x, tf[0], tf[1]], 'post', `Kaki silang ${nm} 2 (belakang bawah ke depan atas)`, pt);
      });
      add('poros', 'x', xs[0] - L / 2, r1(yp), r1(zp), xs[1] - xs[0] + L, 'custom', 'Poros baut (titik lipat)', thin);
      add('rel-lantai-b', 'x', xs[0] + L / 2, L / 2, fb, xs[1] - xs[0] - L, 'rail-x', 'Rel lantai belakang', rail);
      add('rel-lantai-d', 'x', xs[0] + L / 2, L / 2, ff, xs[1] - xs[0] - L, 'rail-x', 'Rel lantai depan', rail);
    }

    return { members: list, boards, casters, W: r1(outW), D: r1(outD), H: r1(outH), boardThick: 0 };
  },

  checks: (p) => {
    const out: ProductCheck[] = [];
    const m = model(p);
    const W = num(p, 'lebar');
    const D = num(p, 'dalam');
    const H = num(p, 'tinggi');
    const s = num(p, 'sudut');
    const pipa = str(p, 'pipa', '30');
    const n = clampI(num(p, 'anakTangga', 3), 1, 5);
    if (s > 30) out.push({ level: 'warn', message: 'Papan baca terlalu curam: kertas dan kitab mudah melorot walau ada bibir penahan.', fix: { label: 'Miring 20°', params: { sudut: 20 } } });
    if (s < 10) out.push({ level: 'info', message: 'Papan hampir datar: nyaman untuk laptop, tapi naskah agak sulit dibaca dari posisi berdiri.' });
    const standing = !['meja', 'tripod', 'rehal-x'].includes(m);
    if (standing && (H < 95 || H > 130))
      out.push({ level: 'warn', message: 'Tinggi papan baca podium berdiri umumnya 110–120 cm (setinggi siku). Terlalu rendah membuat pembicara membungkuk.', fix: { label: 'Tinggi 115 cm', params: { tinggi: 115 } } });
    if (m === 'meja' && H > 40) out.push({ level: 'warn', message: 'Podium meja setinggi ini menutupi wajah pembicara yang duduk.', fix: { label: 'Tinggi 25 cm', params: { tinggi: 25 } } });
    if (m === 'meja' && H < 18) out.push({ level: 'warn', message: 'Podium meja terlalu pendek: kemiringan papan jadi sangat landai.', fix: { label: 'Tinggi 22 cm', params: { tinggi: 22 } } });
    if ((m === 'tripod' || m === 'rehal-x') && (H < 65 || H > 135))
      out.push({ level: 'warn', message: 'Stand baca umumnya 75 cm (sambil duduk) sampai 125 cm (berdiri).', fix: { label: 'Tinggi 110 cm', params: { tinggi: 110 } } });
    if (m === 'tripod' && str(p, 'bidang') === 'besar') out.push({ level: 'warn', message: 'Papan besar di tripod mudah terguling saat buku ditaruh di tepi papan.', fix: { label: 'Papan folio', params: { bidang: 'folio' } } });
    if (['panel-kotak', 'meruncing', 'kaki-a', 'beroda'].includes(m) && H / D > 3)
      out.push({ level: 'warn', message: 'Kaki podium terlalu sempit untuk tingginya: mudah terguling saat disandari.', fix: { label: `Kedalaman ${Math.ceil(H / 2.6)} cm`, params: { dalam: Math.ceil(H / 2.6) } } });
    if (m === 'kantilever' && D < 45) out.push({ level: 'warn', message: 'Tapak terlalu pendek: kepala podium yang menjorok bisa membuat podium terjungkal ke depan.', fix: { label: 'Tapak 55 cm', params: { dalam: 55 } } });
    if (MIMBAR.includes(m)) {
      if (n < 2) out.push({ level: 'warn', message: 'Mimbar bertangga minimal 2 anak tangga. Untuk 1 pijakan pakai model panggung.', fix: { label: '2 anak tangga', params: { anakTangga: 2 } } });
      const tread = (D - Math.min(100, Math.max(70, D * 0.45))) / Math.max(1, n - 1);
      if (tread < 24) out.push({ level: 'warn', message: 'Anak tangga terlalu sempit untuk dipijak dengan aman (minimal ±25 cm).', fix: { label: `Kedalaman ${Math.ceil(Math.max(70, D * 0.45) + 28 * Math.max(1, n - 1))} cm`, params: { dalam: Math.min(220, Math.ceil(Math.max(70, D * 0.45) + 28 * Math.max(1, n - 1))) } } });
      if (W < 70) out.push({ level: 'warn', message: 'Lantai pijak kurang dari 70 cm terasa sempit untuk khatib berdiri.', fix: { label: 'Lebar 90 cm', params: { lebar: 90 } } });
      if (pipa === '20') out.push({ level: 'warn', message: 'Mimbar menahan berat orang: pipa 20×20 terlalu kecil.', fix: { label: 'Pakai pipa 40×40', params: { pipa: '40' } } });
      out.push({ level: 'info', message: `Lantai pijak setinggi ${n * RISE} cm dari lantai masjid; pagar ${PAGAR} cm dari lantai pijak.` });
    }
    if (m === 'panggung') {
      if (n > 2) out.push({ level: 'warn', message: 'Panggung lebih dari 36 cm tanpa pagar berisiko orang terjatuh.', fix: { label: '2 anak tangga', params: { anakTangga: 2 } } });
      if (pipa === '20') out.push({ level: 'warn', message: 'Panggung menahan berat orang: pipa 20×20 terlalu kecil.', fix: { label: 'Pakai pipa 40×40', params: { pipa: '40' } } });
    }
    if (m === 'mimbar-kotak' || m === 'beroda') out.push({ level: 'info', message: 'Kunci rem roda sebelum dipakai supaya tidak bergeser.' });
    if (m === 'tiang-plat') out.push({ level: 'info', message: 'Plat dasar 8 mm cukup berat untuk menahan podium; bisa dibaut ke lantai bila dipakai tetap.' });
    if (m === 'rehal-x') out.push({ level: 'info', message: 'Kedua kaki silang dibaut di titik poros sehingga rehal bisa dilipat pipih untuk disimpan.' });
    if (m === 'tripod') out.push({ level: 'info', message: 'Tiang bisa dibuat dua lapis (pipa masuk pipa + baut kupu) supaya tingginya bisa disetel.' });
    return out;
  },
};
