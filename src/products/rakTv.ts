import { Board, Params, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, CASTER_OPTIONS, board, bool, casterHeight, casterSet, materialParams, memberFactory, num, r1, str } from './common';

/**
 * Rak TV / bufet. Bentuk rangka (param `model`):
 * - panel: bufet rendah 4 kaki; dua tiang tengah belakang menerus dari lantai naik jadi panel TV berpalang braket
 * - menara: bufet rendah memanjang + satu menara rak tinggi di salah satu ujung (6 tiang, tampak depan bentuk L)
 * - bingkai: dua menara tinggi di kedua ujung disambung rak jembatan di atas, bufet rendah di antaranya; silang X belakang menara
 * - kubus: papan atas panjang bertumpu di dua kotak kubus di ujung (rel lantai), tengah terbuka sampai lantai
 * - standing: tiang tunggal tengah di kaki H beroda, braket TV di pucuk, rak kecil menjulur untuk decoder
 * - sandar: dua batang miring bersandar tembok, braket TV di atas, rak bawah ditopang kaki belakang pendek
 * - dinding: rangka panel TV dibaut tembok + ambalan panjang melayang di lengan kantilever, tanpa kaki lantai
 */
const MODELS = [
  { value: 'panel', label: 'Bufet + tiang panel TV', desc: 'Tiang tengah belakang naik jadi braket TV' },
  { value: 'menara', label: 'Bufet + menara samping', desc: 'Satu ujung naik jadi rak tinggi' },
  { value: 'bingkai', label: 'Bingkai TV (dua menara + jembatan)', desc: 'TV dikelilingi rak kiri, kanan & atas' },
  { value: 'kubus', label: 'Bufet di atas dua kubus', desc: 'Kotak rak di ujung, tengah terbuka' },
  { value: 'standing', label: 'Standing TV beroda', desc: 'Tiang tunggal di kaki H, braket + rak decoder' },
  { value: 'sandar', label: 'Rak TV bersandar tembok', desc: 'Dua batang miring, braket TV, rak bawah' },
  { value: 'dinding', label: 'Panel TV dinding + ambalan', desc: 'Dibaut tembok, ambalan melayang, tanpa kaki' },
];
const MODEL_IDS = MODELS.map((m) => m.value);
const model = (p: Params) => {
  const m = str(p, 'model', 'panel');
  return MODEL_IDS.includes(m) ? m : 'panel';
};
const isM = (p: Params, ...m: string[]) => m.includes(model(p));
/** Lebar & tinggi layar TV 16:9 (cm) dari ukuran inci */
const tvW = (inch: number) => r1(inch * 2.214);
const tvH = (inch: number) => r1(inch * 1.245);
const BUFET = ['panel', 'menara', 'bingkai', 'kubus'];
const PANEL_TINGGI = ['panel', 'menara', 'bingkai', 'standing', 'sandar', 'dinding'];

export const RAK_TV: ProductDef = {
  id: 'rak-tv',
  name: 'Rak TV / bufet',
  tagline: 'bufet · panel TV · standing · dinding',
  icon: 'M4 30h52M6 30v6M54 30v6M4 23h52M26 23V5M34 23V5M22 9h16M22 16h16',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['model', 'inciTV', 'panjang', 'dalam', 'tinggi', 'tinggiPanel'] },
    { id: 'bentuk', title: 'Bentuk', keys: ['lebarMenara', 'sisiMenara', 'tingkat', 'tinggiBawah', 'palang'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Roda', keys: ['roda', 'ukuranRoda', 'remRoda'] },
  ],
  params: [
    { key: 'model', label: 'Bentuk rak TV', type: 'choice', options: MODELS },
    { key: 'inciTV', label: 'Ukuran TV', type: 'number', unit: 'inci', min: 32, max: 75, step: 1, help: 'Ukuran layar TV yang akan dipasang / ditaruh.', marks: [{ value: 43, label: '43"' }, { value: 50, label: '50"' }, { value: 55, label: '55"' }, { value: 65, label: '65"' }] },
    { key: 'panjang', label: 'Panjang', type: 'number', unit: 'cm', min: 60, max: 240, step: 1, help: 'Lebar rak dilihat dari depan. Standing TV: lebar kaki.', marks: [{ value: 120, label: 'TV 43"' }, { value: 140, label: 'TV 50"' }, { value: 160, label: 'TV 55"' }, { value: 180, label: 'TV 65"' }] },
    { key: 'dalam', label: 'Kedalaman', type: 'number', unit: 'cm', min: 25, max: 60, step: 1, help: 'Jarak depan ke belakang. Bersandar: jarak kaki dari tembok.', marks: [{ value: 35, label: 'ramping' }, { value: 40, label: 'umum' }, { value: 45, label: 'TV 65"' }] },
    { key: 'tinggi', label: 'Tinggi bufet', type: 'number', unit: 'cm', min: 30, max: 80, step: 1, help: 'Dari lantai sampai muka papan tempat TV / decoder. Dinding: tinggi ambalan.', marks: [{ value: 45, label: 'lesehan / sofa' }, { value: 55, label: 'umum' }], showIf: (p) => p.model !== 'standing' },
    { key: 'tinggiPanel', label: 'Tinggi panel / menara', type: 'number', unit: 'cm', min: 100, max: 220, step: 1, help: 'Ujung atas tiang panel TV, menara rak, atau braket.', marks: [{ value: 150, label: 'panel' }, { value: 180, label: 'menara' }], showIf: (p) => PANEL_TINGGI.includes(String(p.model)) },
    { key: 'lebarMenara', label: 'Lebar menara / kotak samping', type: 'number', unit: 'cm', min: 30, max: 60, step: 1, help: 'Lebar kolom rak di samping TV.', showIf: (p) => ['menara', 'bingkai', 'kubus'].includes(String(p.model)) },
    { key: 'sisiMenara', label: 'Letak menara', type: 'choice', options: [{ value: 'kiri', label: 'Kiri' }, { value: 'kanan', label: 'Kanan' }], showIf: (p) => p.model === 'menara' },
    { key: 'tingkat', label: 'Jumlah susun bufet', type: 'number', unit: 'susun', min: 1, max: 4, step: 1, help: 'Termasuk papan paling atas. Bufet minimal 2 susun.', showIf: (p) => p.model !== 'standing' },
    { key: 'tinggiBawah', label: 'Tinggi papan terbawah', type: 'number', unit: 'cm', min: 5, max: 25, step: 1, help: 'Jarak dari lantai, supaya mudah disapu.', showIf: (p) => ['panel', 'menara', 'bingkai', 'sandar'].includes(String(p.model)) },
    { key: 'palang', label: 'Pipa penyangga papan', type: 'choice', options: [{ value: '20x20', label: '20×20 mm', desc: 'Ringan, bentang sampai ±100 cm' }, { value: '20x40', label: '20×40 mm', desc: 'Kuat, bentang panjang / TV besar' }], showIf: (p) => p.model !== 'standing' },
    ...materialParams(true),
    { key: 'roda', label: 'Pakai roda', type: 'toggle', help: 'Standing TV bisa didorong antar ruangan.', showIf: (p) => p.model === 'standing' },
    { key: 'ukuranRoda', label: 'Ukuran roda', type: 'choice', options: CASTER_OPTIONS, showIf: (p) => p.model === 'standing' && p.roda === true },
    { key: 'remRoda', label: 'Roda dengan rem', type: 'toggle', showIf: (p) => p.model === 'standing' && p.roda === true },
  ],
  defaults: {
    model: 'panel', inciTV: 50, panjang: 140, dalam: 40, tinggi: 50, tinggiPanel: 150, lebarMenara: 40, sisiMenara: 'kiri',
    tingkat: 2, tinggiBawah: 10, palang: '20x20',
    pipa: '30', papan: 'kayu', warna: '#1f2226', roda: false, ukuranRoda: '3', remRoda: true,
  },
  groups: [
    { id: 'bufet-rendah', name: 'Bufet rendah', desc: 'Rak TV berdiri di lantai, memanjang dengan kotak / menara rak' },
    { id: 'bufet-panel', name: 'Bufet + panel TV', desc: 'TV dipasang di tiang panel atau dikelilingi rak' },
    { id: 'stand-tv', name: 'Standing TV', desc: 'Braket TV berdiri sendiri: beroda atau bersandar tembok' },
  ],
  signature: (p) => `rak-tv:${model(p)}`,
  presets: [
    {
      id: 'kubus',
      group: 'bufet-rendah',
      name: 'Bufet di atas dua kubus',
      desc: 'papan atas panjang bertumpu di dua kotak kubus berrel lantai, bagian tengah terbuka sampai lantai',
      params: { model: 'kubus', panjang: 160, dalam: 40, tinggi: 50, lebarMenara: 40, tingkat: 2, palang: '20x40' },
      sizes: [
        { label: 'TV 43"', desc: '130 × 38 × 45 cm', params: { panjang: 130, dalam: 38, tinggi: 45, inciTV: 43, lebarMenara: 35 } },
        { label: 'TV 55"', desc: '160 × 40 × 50 cm', params: { panjang: 160, dalam: 40, tinggi: 50, inciTV: 55, lebarMenara: 40 } },
        { label: 'TV 65", kubus 3 susun', desc: '200 × 45 × 60 cm', params: { panjang: 200, dalam: 45, tinggi: 60, inciTV: 65, lebarMenara: 45, tingkat: 3 } },
      ],
    },
    {
      id: 'menara',
      group: 'bufet-rendah',
      name: 'Bufet + menara samping',
      desc: 'bufet rendah memanjang, satu ujungnya naik jadi menara rak tinggi (tampak depan bentuk L)',
      params: { model: 'menara', panjang: 170, dalam: 40, tinggi: 50, tinggiPanel: 170, lebarMenara: 40, sisiMenara: 'kiri', tingkat: 2, tinggiBawah: 10 },
      sizes: [
        { label: 'TV 50"', desc: '160 × 38 × 50, menara 160', params: { panjang: 160, dalam: 38, tinggi: 50, tinggiPanel: 160, lebarMenara: 35, inciTV: 50 } },
        { label: 'TV 55"', desc: '180 × 40 × 50, menara 180', params: { panjang: 180, dalam: 40, tinggi: 50, tinggiPanel: 180, lebarMenara: 40, inciTV: 55 } },
        { label: 'Menara kanan, 3 susun', desc: '200 × 40 × 60, menara 180', params: { panjang: 200, dalam: 40, tinggi: 60, tinggiPanel: 180, lebarMenara: 45, inciTV: 65, sisiMenara: 'kanan', tingkat: 3 } },
      ],
    },
    {
      id: 'bingkai',
      group: 'bufet-panel',
      name: 'Bingkai TV (dua menara + jembatan)',
      desc: 'dua menara tinggi di kedua ujung disambung rak jembatan di atas, bufet rendah di antaranya, silang X di punggung menara',
      params: { model: 'bingkai', panjang: 200, dalam: 40, tinggi: 50, tinggiPanel: 190, lebarMenara: 40, tingkat: 2, tinggiBawah: 10, inciTV: 50, pipa: '30', palang: '20x40' },
      sizes: [
        { label: 'TV 43"', desc: '180 × 38 × 180', params: { panjang: 180, dalam: 38, tinggiPanel: 180, lebarMenara: 38, inciTV: 43 } },
        { label: 'TV 50"', desc: '200 × 40 × 190', params: { panjang: 200, dalam: 40, tinggiPanel: 190, lebarMenara: 40, inciTV: 50 } },
        { label: 'TV 65"', desc: '240 × 45 × 210', params: { panjang: 240, dalam: 45, tinggi: 45, tinggiPanel: 210, lebarMenara: 42, inciTV: 65, palang: '20x40' } },
      ],
    },
    {
      id: 'standing',
      group: 'stand-tv',
      name: 'Standing TV beroda',
      desc: 'tiang tunggal tengah di kaki H beroda, braket TV di pucuk, rak kecil menjulur ke depan',
      params: { model: 'standing', panjang: 70, dalam: 60, tinggiPanel: 160, inciTV: 50, pipa: '40', roda: true, ukuranRoda: '3', remRoda: true },
      sizes: [
        { label: 'Ruang rapat / kelas', desc: 'TV 55", tinggi 160, beroda', params: { panjang: 75, dalam: 60, tinggiPanel: 160, inciTV: 55, roda: true } },
        { label: 'Kamar / kos', desc: 'TV 43", tinggi 140, tanpa roda', params: { panjang: 60, dalam: 55, tinggiPanel: 140, inciTV: 43, roda: false } },
        { label: 'Pameran / lobi', desc: 'TV 65", tinggi 180, roda 4"', params: { panjang: 90, dalam: 60, tinggiPanel: 180, inciTV: 65, roda: true, ukuranRoda: '4' } },
      ],
    },
    {
      id: 'sandar',
      group: 'stand-tv',
      name: 'Rak TV bersandar tembok',
      desc: 'dua batang miring bersandar ke tembok, braket TV di atas, rak bawah ditopang kaki belakang pendek',
      params: { model: 'sandar', panjang: 110, dalam: 45, tinggi: 45, tinggiPanel: 160, tingkat: 2, tinggiBawah: 10, inciTV: 50 },
      sizes: [
        { label: 'TV 43"', desc: '100 × 40, tinggi 150', params: { panjang: 100, dalam: 40, tinggiPanel: 150, inciTV: 43 } },
        { label: 'TV 55"', desc: '120 × 45, tinggi 165', params: { panjang: 120, dalam: 45, tinggiPanel: 165, inciTV: 55, palang: '20x40' } },
        { label: 'Satu rak', desc: '110 × 45, rak 50 cm', params: { panjang: 110, dalam: 45, tinggi: 50, tingkat: 1 } },
      ],
    },
  ],
  summary: (p) => {
    const tv = `TV ${num(p, 'inciTV')}"`;
    if (isM(p, 'standing')) return `${tv} · tinggi ${num(p, 'tinggiPanel')} cm${bool(p, 'roda') ? ' · beroda' : ''}`;
    if (isM(p, 'kubus')) return `${num(p, 'panjang')} × ${num(p, 'dalam')} × ${num(p, 'tinggi')} cm · ${tv}`;
    return `${num(p, 'panjang')} × ${num(p, 'dalam')} × ${num(p, 'tinggi')} cm · panel ${num(p, 'tinggiPanel')} cm · ${tv}`;
  },

  build: (p) => {
    const m = model(p);
    const W = num(p, 'panjang', 140);
    const D = num(p, 'dalam', 40);
    const Htot = num(p, 'tinggi', 50);
    const Hp = num(p, 'tinggiPanel', 150);
    const L = (parseInt(str(p, 'pipa', '30')) || 30) / 10;
    const b = BOARD_THICK[str(p, 'papan', 'kayu')] ?? 2.5;
    const inch = num(p, 'inciTV', 50);
    const tw = tvW(inch);
    const th = tvH(inch);
    const pt: [number, number] = [L * 10, L * 10];
    const rail: [number, number] = str(p, 'palang', '20x20') === '20x40' ? [20, 40] : [20, 20];
    const rh = rail[1] / 10;
    const thin: [number, number] = [15, 15];
    const br: [number, number] = [20, 40]; // palang braket TV
    const yb = num(p, 'tinggiBawah', 10);
    // lebar menara / kubus dibatasi supaya ruang tengah tetap ada (min 40 cm, menara tunggal min 50 cm)
    const lmRaw = num(p, 'lebarMenara', 40);
    const lm = r1(Math.max(15, Math.min(lmRaw, m === 'menara' ? W - 50 : (W - 40) / 2)));
    const { list, add, line } = memberFactory();
    const boards: Board[] = [];
    let outW = W;
    let outD = D;
    let outH = Htot;
    let wall = false;
    let mirror = false;
    let casters: ReturnType<typeof casterSet> = [];
    const pushBoard = (bd: Board) => {
      if (b > 0) boards.push(bd);
    };
    /** n tinggi as palang merata dari y0 sampai y1 */
    const levels = (n: number, y0: number, y1: number) => (n <= 1 ? [y1] : Array.from({ length: n }, (_, i) => r1(y0 + ((y1 - y0) * i) / (n - 1))));
    /**
     * Tingkat menara yang terlalu dekat dengan tingkat bufet digeser tepat ke tingkat bufet itu, supaya
     * palang samping di tiang bersama jadi satu batang (tidak dua palang bertumpuk saling tembus).
     */
    const snapLevels = (tl: number[], bl: number[]) => tl.map((y, i) => (i === tl.length - 1 ? y : bl.find((v) => Math.abs(v - y) < rh + 6) ?? y));
    /**
     * Satu tingkat untuk deretan tiang xs (as, urut kiri→kanan): palang depan & belakang di antara tiap pasang tiang,
     * palang samping di setiap tiang. Papan per ruang (di antara muka tiang) atau satu papan menerus (bx).
     */
    const run = (id: string, nm: string, xs: number[], zb: number, zf: number, y: number, boardMode: 'bay' | 'none' | [number, number]) => {
      for (let i = 0; i < xs.length - 1; i++) {
        add(`${id}-depan-${i}`, 'x', xs[i] + L / 2, y, zf, xs[i + 1] - xs[i] - L, 'rail-x', `Palang ${nm} depan${xs.length > 2 ? ` ${i + 1}` : ''}`, rail);
        add(`${id}-belakang-${i}`, 'x', xs[i] + L / 2, y, zb, xs[i + 1] - xs[i] - L, 'rail-x', `Palang ${nm} belakang${xs.length > 2 ? ` ${i + 1}` : ''}`, rail);
      }
      xs.forEach((x, i) => add(`${id}-samping-${i}`, 'z', x, y, zb + L / 2, zf - zb - L, 'rail-z', `Palang ${nm} samping ${i + 1}`, rail));
      if (boardMode === 'none') return;
      if (boardMode === 'bay') {
        for (let i = 0; i < xs.length - 1; i++)
          pushBoard(board(`papan-${id}-${i}`, `Papan ${nm}${xs.length > 2 ? ` ruang ${i + 1}` : ''}`, xs[i] + L / 2, xs[i + 1] - L / 2, y + rh / 2, y + rh / 2 + b, zb - L / 2, zf + L / 2));
      } else pushBoard(board(`papan-${id}`, `Papan ${nm}`, boardMode[0], boardMode[1], y + rh / 2, y + rh / 2 + b, zb - L / 2, zf + L / 2));
    };
    const posts = (id: string, nm: string, xs: number[], zs: number[], y0: number, y1: number) =>
      xs.forEach((x, i) => zs.forEach((z, j) => add(`${id}-${i}-${j}`, 'y', x, y0, z, y1 - y0, 'post', `${nm} ${i + 1} ${j ? 'depan' : 'belakang'}`, pt)));
    /** Palang braket TV (VESA ±30 cm) di antara dua as tiang xa..xb pada bidang z */
    const bracket = (xa: number, xb: number, z: number, yLo: number, yHi: number) => {
      const yC = Math.min(yHi - 12, Math.max(yLo + 18, yLo + 6 + th / 2));
      [yC - 15, yC + 15].forEach((y, k) => {
        if (y + 2 < yHi - L && y - 2 > yLo) add(`braket-${k}`, 'x', xa + L / 2, y, z, xb - xa - L, 'custom', `Palang braket TV ${k ? 'atas' : 'bawah'}`, br);
      });
    };

    const zb = L / 2;
    const zf = D - L / 2;

    if (m === 'panel') {
      // Bufet 4 kaki + 2 tiang tengah belakang setinggi panel; ruang tengah untuk decoder
      const yTop = Htot - b;
      const pw = Math.max(30, Math.min(W - 2 * L - 30, r1(tw * 0.45)));
      const xs = [L / 2, r1(W / 2 - pw / 2), r1(W / 2 + pw / 2), W - L / 2];
      posts('kaki', 'Kaki', [xs[0], xs[3]], [zb, zf], 0, yTop);
      add('kaki-tengah-0', 'y', xs[1], 0, zf, yTop, 'post', 'Kaki tengah kiri depan', pt);
      add('kaki-tengah-1', 'y', xs[2], 0, zf, yTop, 'post', 'Kaki tengah kanan depan', pt);
      add('tiang-panel-0', 'y', xs[1], 0, zb, Hp, 'post', 'Tiang panel TV kiri (dari lantai)', pt);
      add('tiang-panel-1', 'y', xs[2], 0, zb, Hp, 'post', 'Tiang panel TV kanan (dari lantai)', pt);
      const n = Math.max(2, num(p, 'tingkat', 2));
      const ys = levels(n, yb, yTop - rh / 2);
      ys.forEach((y, i) => {
        const top = i === n - 1;
        run(`susun-${i + 1}`, top ? 'atas' : `susun ${i + 1}`, xs, zb, zf, y, 'bay');
      });
      // papan atas: per ruang (tiang panel menembus di belakang), tidak menerus
      add('panel-tutup', 'x', xs[1] + L / 2, Hp - L / 2, zb, xs[2] - xs[1] - L, 'rail-x', 'Palang tutup panel atas', pt);
      bracket(xs[1], xs[2], zb, yTop + b, Hp);
      outH = Math.max(Htot, Hp);
    } else if (m === 'menara') {
      // Menara di kiri (dicerminkan bila kanan): 6 tiang
      mirror = str(p, 'sisiMenara', 'kiri') === 'kanan';
      const yTop = Htot - b;
      const xo = L / 2;
      const xi = lm - L / 2;
      const xe = W - L / 2;
      const span = xe - xi;
      const xMid = span > 105 ? r1((xi + xe) / 2) : null;
      posts('menara', 'Tiang menara', [xo, xi], [zb, zf], 0, Hp - b);
      posts('kaki', 'Kaki bufet', xMid ? [xMid, xe] : [xe], [zb, zf], 0, yTop);
      const n = Math.max(2, num(p, 'tingkat', 2));
      const bx = xMid ? [xi, xMid, xe] : [xi, xe];
      const nT = Math.max(3, Math.round((Hp - b - yb) / 35) + 1);
      const bl = levels(n, yb, yTop - rh / 2);
      const tl = snapLevels(levels(nT, yb, Hp - b - rh / 2), bl);
      const same = (a: number) => (y: number) => Math.abs(a - y) < 0.5;
      bl.forEach((y, i) => {
        const top = i === n - 1;
        // tingkat yang sama tinggi dengan tingkat menara: satu deret palang menerus (palang tiang dalam tidak dobel)
        if (tl.some(same(y))) run(`bawah-${i + 1}`, `susun ${i + 1}`, [xo, ...bx], zb, zf, y, 'bay');
        else run(`bufet-${i + 1}`, top ? 'atas bufet' : `bufet susun ${i + 1}`, bx, zb, zf, y, top ? [xi + L / 2, W] : 'bay');
      });
      tl.forEach((y, i) => {
        const top = i === nT - 1;
        if (bl.some(same(y))) return;
        run(`menara-${i + 1}`, top ? 'atas menara' : `menara ${i + 1}`, [xo, xi], zb, zf, y, top ? [0, lm] : 'bay');
      });
      outH = Math.max(Htot, Hp);
    } else if (m === 'bingkai') {
      // Dua menara di ujung + jembatan atas; bufet rendah di antara menara
      const yTop = Htot - b;
      const Ht = Hp - b;
      const xs = [L / 2, lm - L / 2, W - lm + L / 2, W - L / 2];
      posts('tiang', 'Tiang menara', xs, [zb, zf], 0, Ht);
      const n = Math.max(2, num(p, 'tingkat', 2));
      const nT = Math.max(3, Math.round((Ht - yb) / 35) + 1);
      const bl = levels(n, yb, yTop - rh / 2);
      const tl = snapLevels(levels(nT, yb, Ht - rh / 2), bl);
      const same = (a: number) => (y: number) => Math.abs(a - y) < 0.5;
      bl.forEach((y, i) => {
        if (tl.some(same(y))) run(`bawah-${i + 1}`, `susun ${i + 1}`, xs, zb, zf, y, 'bay');
        else run(`bufet-${i + 1}`, i === n - 1 ? 'atas bufet' : `bufet susun ${i + 1}`, [xs[1], xs[2]], zb, zf, y, 'bay');
      });
      tl.forEach((y, i) => {
        const top = i === nT - 1;
        if (top) run('jembatan', 'atas (jembatan)', xs, zb, zf, y, [0, W]);
        else if (!bl.some(same(y))) {
          run(`menara-kiri-${i + 1}`, `menara kiri ${i + 1}`, [xs[0], xs[1]], zb, zf, y, 'bay');
          run(`menara-kanan-${i + 1}`, `menara kanan ${i + 1}`, [xs[2], xs[3]], zb, zf, y, 'bay');
        }
      });
      // silang X di punggung tiap menara (di belakang tiang); batang kedua ditumpuk di belakang batang pertama
      // setebal pipa (las di titik silang), tidak saling tembus
      const zx = -thin[0] / 20;
      const zx2 = zx - thin[0] / 10;
      [[xs[0], xs[1]], [xs[2], xs[3]]].forEach(([xa, xb], k) => {
        const nm = k ? 'kanan' : 'kiri';
        line(`silang-${nm}-a`, [xa, yb, zx], [xb, Ht - rh, zx], 'custom', `Silang punggung menara ${nm} 1`, thin);
        line(`silang-${nm}-b`, [xb, yb, zx2], [xa, Ht - rh, zx2], 'custom', `Silang punggung menara ${nm} 2`, thin);
      });
      outH = Hp;
    } else if (m === 'kubus') {
      // Dua kotak kubus di ujung (rel lantai), papan atas menerus, tengah terbuka
      const yTop = Htot - b;
      const n = Math.max(2, num(p, 'tingkat', 2));
      const cubes: [number, number, string][] = [
        [L / 2, lm - L / 2, 'kiri'],
        [W - lm + L / 2, W - L / 2, 'kanan'],
      ];
      cubes.forEach(([xa, xb, nm]) => {
        posts(`kubus-${nm}`, `Tiang kubus ${nm}`, [xa, xb], [zb, zf], 0, yTop);
        levels(n, rh / 2, yTop - rh / 2).forEach((y, i) => {
          const top = i === n - 1;
          run(`kubus-${nm}-${i + 1}`, top ? `atas kubus ${nm}` : i === 0 ? `alas kubus ${nm} (rel lantai)` : `kubus ${nm} ${i + 1}`, [xa, xb], zb, zf, y, top ? 'none' : 'bay');
        });
      });
      // palang bentang tengah atas (depan & belakang) menyambung kedua kubus
      const yr = yTop - rh / 2;
      const xa = lm - L / 2;
      const xb = W - lm + L / 2;
      add('bentang-depan', 'x', xa + L / 2, yr, zf, xb - xa - L, 'rail-x', 'Palang bentang tengah depan', rail);
      add('bentang-belakang', 'x', xa + L / 2, yr, zb, xb - xa - L, 'rail-x', 'Palang bentang tengah belakang', rail);
      pushBoard(board('papan-atas', 'Papan atas menerus', 0, W, yTop, yTop + b, 0, D));
      outH = Htot;
    } else if (m === 'standing') {
      // Kaki H (dua tapak depan-belakang + palang), tiang tunggal tengah, braket di pucuk, rak menjulur
      const roda = bool(p, 'roda');
      const ci = parseInt(str(p, 'ukuranRoda', '3')) || 3;
      const c = roda ? casterHeight(ci) : 0;
      const r20: [number, number] = [20, 20];
      const col: [number, number] = [Math.max(40, L * 10), Math.max(40, L * 10)];
      const cw = col[0] / 10;
      const xl = L / 2;
      const xr = W - L / 2;
      const xc = W / 2;
      const zc = D / 2;
      add('tapak-kiri', 'z', xl, c + L / 2, 0, D, 'rail-z', 'Kaki tapak kiri', pt);
      add('tapak-kanan', 'z', xr, c + L / 2, 0, D, 'rail-z', 'Kaki tapak kanan', pt);
      add('palang-kaki', 'x', xl + L / 2, c + L / 2, zc, xr - xl - L, 'rail-x', 'Palang kaki tengah', pt);
      add('tiang', 'y', xc, c + L, zc, Hp - c - L, 'post', 'Tiang tunggal tengah', col);
      // penguat miring tiang ke palang kaki
      // ujung atas dipotong rata dan menempel sisi tiang: as digeser keluar setengah lebar mendatar penguat
      const gx = r1((thin[0] / 20) * (Math.hypot(12, 22) / 22) + 0.05);
      [-1, 1].forEach((s, i) => line(`penguat-${i}`, [xc + s * (cw / 2 + 12 + gx), c + L, zc], [xc + s * (cw / 2 + gx), c + L + 22, zc], 'custom', `Penguat tiang ${i ? 'kanan' : 'kiri'}`, thin));
      // braket TV menempel muka depan tiang
      const zB = zc + cw / 2 + 1;
      const bw = Math.max(30, Math.min(70, r1(tw * 0.5)));
      const yC = Hp - 22;
      [yC - 15, yC + 15].forEach((y, k) => add(`braket-${k}`, 'x', xc - bw / 2, y, zB, bw, 'custom', `Palang braket TV ${k ? 'atas' : 'bawah'}`, br));
      [-1, 1].forEach((s, k) => add(`braket-tegak-${k}`, 'y', xc + (s * (bw / 2 - 1)), yC - 13, zB + 2, 26, 'custom', `Braket TV tegak ${k ? 'kanan' : 'kiri'}`, r20));
      // rak decoder: palang menempel tiang + dua lengan ke depan
      const ys = Math.max(c + 40, r1(yC - th / 2 - 22));
      const aw = 36;
      add('rak-palang', 'x', xc - aw / 2, ys, zB, aw, 'custom', 'Palang rak decoder', r20);
      [-1, 1].forEach((s, k) => add(`rak-lengan-${k}`, 'z', xc + s * (aw / 2 - 2), ys, zB + 1, 28, 'custom', `Lengan rak decoder ${k ? 'kanan' : 'kiri'}`, r20));
      pushBoard(board('papan-rak', 'Papan rak decoder', xc - 22, xc + 22, ys + 1, ys + 1 + b, zB - 1, zB + 29));
      casters = roda ? casterSet([xl, xr], [3, D - 3], ci, bool(p, 'remRoda')) : [];
      outH = Hp;
      outD = Math.max(D, zB + 29);
    } else if (m === 'sandar') {
      // Dua batang miring dari lantai depan ke tembok atas; rak ditopang kaki belakang pendek
      wall = true;
      const zr = (y: number) => r1(D - L / 2 - ((D - L) * y) / Hp);
      // muka belakang batang miring pada ketinggian y (setengah lebar mendatar batang = L/2 / cos sudut)
      const hwB = (L / 2) * (Math.hypot(Hp, D - L) / Hp);
      const zBack = (y: number) => D - L / 2 - ((D - L) * y) / Hp - hwB;
      const xs = [L / 2, W - L / 2];
      xs.forEach((x, i) => line(`batang-${i}`, [x, 0, D - L / 2], [x, Hp, L / 2], 'post', `Batang miring ${i ? 'kanan' : 'kiri'} (bersandar)`, pt));
      const yTop = Htot - b;
      const n = Math.min(2, Math.max(1, num(p, 'tingkat', 2)));
      const ysh = n >= 2 ? [yb, yTop - rh / 2] : [yTop - rh / 2];
      xs.forEach((x, i) => add(`kaki-belakang-${i}`, 'y', x, 0, zb, yTop - rh / 2, 'post', `Kaki belakang ${i ? 'kanan' : 'kiri'}`, pt));
      ysh.forEach((y, k) => {
        const nm = k === ysh.length - 1 ? 'rak atas' : 'rak bawah';
        const zfr = zr(y);
        // lengan dipotong rata, ujungnya menempel muka belakang batang miring (tidak masuk ke dalamnya)
        const zl = r1(zBack(y + rh / 2) - 0.05);
        xs.forEach((x, i) => add(`${k}-lengan-${i}`, 'z', x, y, L, zl - L, 'rail-z', `Lengan ${nm} ${i ? 'kanan' : 'kiri'}`, rail));
        add(`${k}-belakang`, 'x', L, y, zb, W - 2 * L, 'rail-x', `Palang ${nm} belakang`, rail);
        add(`${k}-depan`, 'x', L, y, zfr, W - 2 * L, 'rail-x', `Palang ${nm} depan`, rail);
        pushBoard(board(`papan-${k}`, `Papan ${nm}`, L, W - L, y + rh / 2, y + rh / 2 + b, 0, zfr + 1));
      });
      // braket TV di bidang batang miring + palang pucuk
      const yLo = yTop + b;
      const yC = Math.min(Hp - 20, Math.max(yLo + 25, yLo + 8 + th / 2));
      [yC - 15, yC + 15].forEach((y, k) => add(`braket-${k}`, 'x', L, y, zr(y), W - 2 * L, 'custom', `Palang braket TV ${k ? 'atas' : 'bawah'}`, br));
      add('pucuk', 'x', L, Hp - 6, zr(Hp - 6), W - 2 * L, 'rail-x', 'Palang pucuk (menempel tembok)', rail);
      outH = Hp;
    } else {
      // dinding: dua tiang tembok + palang braket, ambalan melayang di lengan kantilever
      wall = true;
      const yTop = Htot - b;
      const n = Math.min(2, Math.max(1, num(p, 'tingkat', 1)));
      const ysh = n >= 2 ? [yTop - 24, yTop] : [yTop];
      const yLow = ysh[0];
      const fw = Math.max(40, Math.min(W - 20, r1(tw * 0.55)));
      const px = [r1(W / 2 - fw / 2), r1(W / 2 + fw / 2)];
      const yP0 = Math.max(5, yLow - 30);
      px.forEach((x, i) => add(`tiang-tembok-${i}`, 'y', x, yP0, zb, Hp - yP0, 'post', `Tiang tembok ${i ? 'kanan' : 'kiri'}`, pt));
      add('palang-bawah-panel', 'x', px[0] + L / 2, yP0 + L / 2, zb, fw - L, 'rail-x', 'Palang bawah panel', pt);
      add('palang-tutup-panel', 'x', px[0] + L / 2, Hp - L / 2, zb, fw - L, 'rail-x', 'Palang tutup panel atas', pt);
      // lengan ambalan: di tiang tembok + tambahan tiap ±70 cm, menempel rel tembok
      const extra = Math.max(0, Math.ceil((W - fw - 10) / 2 / 70));
      const ax: number[] = [];
      for (let k = extra; k >= 1; k--) ax.push(r1(W / 2 - fw / 2 - ((W / 2 - fw / 2 - 5) * k) / extra));
      ax.push(...px);
      for (let k = 1; k <= extra; k++) ax.push(r1(W / 2 + fw / 2 + ((W / 2 - fw / 2 - 5) * k) / extra));
      const arm: [number, number] = [20, 40];
      ysh.forEach((y, k) => {
        const nm = k === ysh.length - 1 ? 'ambalan atas' : 'ambalan bawah';
        const ya = y - 2; // as lengan 20×40, muka atas = y
        // rel tembok dipotong di tiang tembok (tidak menembus tiang)
        [[2, px[0] - L / 2], [px[0] + L / 2, px[1] - L / 2], [px[1] + L / 2, W - 2]].forEach(([x0, x1], j) => add(`${k}-rel-tembok-${j}`, 'x', x0, y - L / 2, L / 2, x1 - x0, 'rail-x', `Rel tembok ${nm} ${j + 1}`, pt));
        ax.forEach((x, i) => {
          const onPost = px.includes(x);
          add(`${k}-lengan-${i}`, 'z', onPost ? x + L / 2 + 1 : x, ya, L, D - L - 4, 'custom', `Lengan ${nm} ${i + 1}`, arm);
        });
        add(`${k}-depan`, 'x', 2, ya, D - 3, W - 4, 'rail-x', `Palang depan ${nm}`, rail);
        pushBoard(board(`papan-${k}`, `Papan ${nm}`, 0, W, y, y + b, L, D));
      });
      // siku miring di bawah lengan terbawah
      ax.forEach((x, i) => {
        const onPost = px.includes(x);
        const xx = onPost ? x + L / 2 + 1 : x;
        line(`siku-${i}`, [xx, yLow - 26, L / 2 + 1], [xx, yLow - 4, r1(D * 0.6)], 'custom', `Siku miring ${i + 1}`, thin);
      });
      bracket(px[0], px[1], zb, yTop + b, Hp);
      outH = Math.max(Hp, yTop + b);
    }

    if (mirror) {
      list.forEach((mb) => {
        if (mb.end) {
          mb.x = r1(W - mb.x);
          mb.end = { ...mb.end, x: r1(W - mb.end.x) };
        } else mb.x = r1(mb.axis === 'x' ? W - mb.x - mb.length : W - mb.x);
      });
      boards.forEach((bd) => {
        const [x0, x1] = [bd.box.min[0], bd.box.max[0]];
        bd.box = { min: [r1(W - x1), bd.box.min[1], bd.box.min[2]], max: [r1(W - x0), bd.box.max[1], bd.box.max[2]] };
      });
    }
    outW = W;
    return { members: list, boards, casters, W: outW, D: outD, H: outH, boardThick: 0, wall };
  },

  checks: (p, bld) => {
    const out: ProductCheck[] = [];
    const m = model(p);
    const W = num(p, 'panjang');
    const D = num(p, 'dalam');
    const Hp = num(p, 'tinggiPanel');
    const Htot = num(p, 'tinggi');
    const lm = num(p, 'lebarMenara');
    const inch = num(p, 'inciTV');
    const tw = tvW(inch);
    const th = tvH(inch);
    const pipa = str(p, 'pipa', '30');
    const bth = BOARD_THICK[str(p, 'papan', 'kayu')] ?? 2.5;

    // TV muat di atas bufet / di bukaan bingkai
    const ruang = m === 'bingkai' ? W - 2 * lm : m === 'menara' ? W - lm : m === 'kubus' || m === 'panel' ? W : 0;
    if (ruang > 0 && ruang < tw + 4) {
      const need = Math.min(240, Math.ceil(tw + 6 + (m === 'bingkai' ? 2 * lm : m === 'menara' ? lm : 0)));
      out.push({ level: 'warn', message: `TV ${inch}" lebarnya ±${Math.round(tw)} cm, lebih lebar dari ruang rak (${Math.round(ruang)} cm). TV menggantung di luar rak dan mudah tersenggol.`, fix: { label: `Panjang ${need} cm`, params: { panjang: need } } });
    }
    if (m === 'bingkai') {
      const buka = Hp - bth - 2 - Htot;
      if (buka < th + 8) {
        const need = Math.min(220, Math.ceil(Htot + th + 14 + bth));
        out.push({ level: 'warn', message: `Tinggi bukaan di bawah jembatan hanya ±${Math.round(buka)} cm, TV ${inch}" (±${Math.round(th)} cm) tidak muat.`, fix: { label: `Tinggi ${need} cm`, params: { tinggiPanel: need } } });
      }
    }
    if ((m === 'panel' || m === 'dinding' || m === 'sandar') && Hp < Htot + 40)
      out.push({ level: 'warn', message: 'Panel TV terlalu pendek: braket tidak cukup tinggi di atas bufet.', fix: { label: `Panel ${Math.min(220, Htot + 90)} cm`, params: { tinggiPanel: Math.min(220, Htot + 90) } } });

    // Kestabilan menara / panel tinggi
    if ((m === 'menara' || m === 'bingkai') && Hp / D > 5) {
      const need = Math.min(60, Math.ceil(Hp / 4.5));
      out.push({ level: 'warn', message: 'Menara tinggi dengan kedalaman tipis mudah terguling ke depan.', fix: { label: `Kedalaman ${need} cm`, params: { dalam: need } } });
    } else if ((m === 'menara' || m === 'bingkai') && Hp / D > 3.5)
      out.push({ level: 'info', message: 'Ikat puncak menara ke tembok dengan 2 siku + fischer supaya aman dari anak memanjat.' });
    if (pipa === '20' && (Hp > 140 || m === 'standing') && m !== 'kubus')
      out.push({ level: 'warn', message: 'Pipa 20×20 terlalu ramping untuk tiang setinggi ini yang menahan TV.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });

    // Bentang papan
    const bentang = m === 'kubus' ? W - 2 * lm : m === 'panel' ? Math.max(W / 2 - Math.max(30, tw * 0.225), 0) : m === 'bingkai' ? W - 2 * lm : m === 'menara' ? ((W - lm) > 105 ? (W - lm) / 2 : W - lm) : m === 'sandar' ? W : 0;
    if (bentang > 110 && str(p, 'palang') !== '20x40')
      out.push({ level: 'warn', message: `Papan membentang ±${Math.round(bentang)} cm tanpa kaki tengah; palang 20×20 melendut menahan TV dan decoder.`, fix: { label: 'Palang 20×40', params: { palang: '20x40' } } });
    if (m === 'kubus' && bentang > 150)
      out.push({ level: 'warn', message: 'Bentang tengah lebih dari 150 cm: papan atas melendut walau palang 20×40.', fix: { label: 'Kubus lebih lebar', params: { lebarMenara: Math.min(60, Math.ceil((W - 150) / 2)) } } });

    // Jarak antar susun
    if (BUFET.includes(m) || m === 'sandar') {
      const n = Math.max(m === 'sandar' ? 1 : 2, num(p, 'tingkat', 2));
      const y0 = m === 'kubus' ? 1 : num(p, 'tinggiBawah', 10);
      const gap = n > 1 ? (Htot - y0) / (n - 1) : 99;
      if (gap < 18)
        out.push({ level: 'warn', message: `Jarak antar susun hanya ±${Math.round(gap)} cm, decoder / konsol game tidak muat.`, fix: { label: `${n - 1} susun`, params: { tingkat: Math.max(1, n - 1) } } });
    }
    if (BUFET.includes(m) && Htot > 65) out.push({ level: 'info', message: 'Bufet di atas 65 cm: TV terlalu tinggi untuk ditonton dari sofa (tengah layar ideal ±100 cm dari lantai).' });

    // Standing
    if (m === 'standing') {
      if (W < tw * 0.5) {
        const need = Math.min(240, Math.ceil(tw * 0.55));
        out.push({ level: 'warn', message: 'Kaki terlalu sempit untuk TV selebar ini, standing mudah oleng ke samping.', fix: { label: `Lebar kaki ${need} cm`, params: { panjang: need } } });
      }
      if (D < 50) out.push({ level: 'warn', message: 'Tapak kaki kurang dari 50 cm: TV di pucuk tiang mudah terjungkal ke depan.', fix: { label: 'Tapak 60 cm', params: { dalam: 60 } } });
      if (inch > 60 && pipa !== '40') out.push({ level: 'warn', message: `TV ${inch}" berat (±25–35 kg); kaki pipa ${pipa}×${pipa} kurang kaku.`, fix: { label: 'Pakai pipa 40×40', params: { pipa: '40' } } });
      if (bool(p, 'roda') && !bool(p, 'remRoda')) out.push({ level: 'warn', message: 'Standing TV beroda tanpa rem bisa meluncur sendiri di lantai licin.', fix: { label: 'Roda dengan rem', params: { remRoda: true } } });
      out.push({ level: 'info', message: 'Tiang dibuat dari pipa 40×40; lubang braket ikut pola VESA belakang TV (100–400 mm).' });
    }
    if (m === 'dinding') {
      if (num(p, 'tingkat', 1) >= 2 && Htot < 65) out.push({ level: 'warn', message: 'Dua ambalan butuh ambalan atas minimal 65 cm supaya ambalan bawah tidak terlalu dekat lantai.', fix: { label: 'Ambalan atas 75 cm', params: { tinggi: 75 } } });
      if (D > 40) out.push({ level: 'warn', message: 'Ambalan lebih dari 40 cm menjorok terlalu jauh; baut tembok tertarik kuat.', fix: { label: 'Kedalaman 35 cm', params: { dalam: 35 } } });
      out.push({ level: 'info', message: 'Dibaut ke tembok bata / beton dengan fischer 10 mm, minimal 2 titik per tiang dan per lengan. Jangan di dinding gypsum.' });
    }
    if (m === 'sandar') out.push({ level: 'info', message: 'Pucuk batang diikat ke tembok dengan 2 siku kecil supaya rak tidak bergeser.' });
    if (m === 'panel' || m === 'bingkai' || m === 'menara') out.push({ level: 'info', message: `Total tinggi ${Math.round(bld.H)} cm; sisakan lubang kabel di papan belakang untuk listrik & HDMI.` });
    return out;
  },
};
