import { FrameHinge, FrameMember } from '../types/kitchen';
import { angledFrame, cutAxisIndex, memberCorners, memberFromPoints } from '../utils/frameLayout';
import { Board, Caster, Params, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, CASTER_OPTIONS, board, bool, casterHeight, casterSet, materialParams, memberFactory, num, r1, str } from './common';

// ---------- Sambungan las: potong ujung batang supaya menempel rata, tidak tembus ----------
type V3 = [number, number, number];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot3 = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const AXES: V3[] = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];
interface Hull {
  cs: V3[];
  faces: V3[];
  edges: V3[];
}
/** Bentuk padat batang (8 sudut + arah sisi) — sama dengan potongan yang dipakai daftar potong & cek sambungan */
const hullOf = (m: FrameMember): Hull => {
  const w = (m.tubeSize || 20) / 10;
  const h = m.tubeH ? m.tubeH / 10 : w;
  const sec: V3 = m.end ? [w, h, w] : m.axis === 'y' ? [w, w, h] : [w, h, w];
  const cs = memberCorners(m, sec);
  if (!m.end) return { cs, faces: AXES, edges: AXES };
  const f = angledFrame(m, sec[0], sec[1]);
  const n: V3 = [0, 0, 0];
  n[cutAxisIndex(m)] = 1;
  return { cs, faces: [f.wd, f.hd, n], edges: [f.u, cross(n, f.wd), cross(n, f.hd)] };
};
/** Dua batang saling tembus lebih dari `tol` cm (uji sumbu pemisah) */
const tembus = (A: Hull, B: Hull, tol = 0.15) => {
  const axes: V3[] = [...A.faces, ...B.faces];
  for (const ea of A.edges)
    for (const eb of B.edges) {
      const c = cross(ea, eb);
      const l = Math.hypot(c[0], c[1], c[2]);
      if (l > 1e-6) axes.push([c[0] / l, c[1] / l, c[2] / l]);
    }
  for (const ax of axes) {
    let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
    for (const p of A.cs) {
      const v = dot3(p, ax);
      a0 = Math.min(a0, v);
      a1 = Math.max(a1, v);
    }
    for (const p of B.cs) {
      const v = dot3(p, ax);
      b0 = Math.min(b0, v);
      b1 = Math.max(b1, v);
    }
    if (Math.min(a1, b1) - Math.max(a0, b0) <= tol) return false;
  }
  return true;
};
/**
 * Ujung batang `move` digeser mendekati `fix` (sepanjang as yang sama) sampai batang tidak lagi tembus
 * ke batang-batang `obs`: ujungnya menempel rata di sisi batang itu, seperti dipotong tukang las.
 */
const trimTo = (fix: V3, move: V3, tube: [number, number], obs: FrameMember[]): V3 => {
  if (!obs.length) return move;
  const hulls = obs.map(hullOf);
  const P = (s: number): V3 => [fix[0] + (move[0] - fix[0]) * s, fix[1] + (move[1] - fix[1]) * s, fix[2] + (move[2] - fix[2]) * s];
  const hits = (s: number) => {
    const m = memberFromPoints({ id: '_', role: 'custom', tubeSize: tube[0], tubeH: tube[1] !== tube[0] ? tube[1] : undefined }, fix, P(s));
    const me = hullOf(m);
    return hulls.some((o) => tembus(me, o));
  };
  if (!hits(1)) return move;
  let lo = 0;
  let hi = 1;
  for (let k = 0; k < 30; k++) {
    const mid = (lo + hi) / 2;
    if (hits(mid)) hi = mid;
    else lo = mid;
  }
  return P(lo);
};

/**
 * Kandang hewan. Semua bentuk = ruang TERTUTUP jeruji di semua sisi dinding + atap, dengan pintu berengsel.
 * Bentuk rangka (param `model`):
 * - tingkat: 4 tiang menerus beroda, lantai papan tiap tingkat dengan lubang naik + papan loncat (kucing)
 * - panggung: kotak jeruji di atas 4 kaki miring melebar, atap miring satu arah, lantai kawat + baki tarik (kelinci)
 * - pojok: denah segitiga, 3 tiang di pojok tembok, muka depan diagonal berpintu, bertingkat
 * - baterai: rangka kaki A, baris sel bertangga di dua muka, lantai kawat miring + talang telur (ayam petelur / puyuh)
 * - ark: prisma segitiga di atas rel lantai berpegangan angkat, jeruji di kedua lereng & ujung, loteng papan
 * - tembok: kotak jeruji 3 sisi + atap menempel tembok, bertumpu dua siku miring, tanpa kaki
 * - gantung: sangkar kotak beratap limas, digantung satu batang ke plat plafon
 * - tiang: sangkar kotak di pucuk satu tiang, kaki silang datar di lantai
 * - ternak-panggung: tiang menerus lantai–atap, lantai bilah di kolong tinggi, atap miring, tangga naik
 * - koloni: deret sel bersekat di tiang berplat dibaut lantai, jeruji kepala miring + palung pakan di depan
 * - anjing: 4 panel berbingkai sendiri dibaut (tiang ganda di sudut), atap panel, kaki pendek, baki tarik
 * - walkin: panel-panel modul berdiri tanpa tiang, salah satunya panel pintu orang, atap rangka di atas panel
 */
const MODELS = [
  { value: 'tingkat', label: 'Bertingkat beroda', desc: '4 tiang, lantai tiap tingkat, lubang naik' },
  { value: 'panggung', label: 'Panggung kaki melebar', desc: 'Kaki miring, atap miring, baki tarik' },
  { value: 'pojok', label: 'Pojok segitiga', desc: '3 tiang di sudut tembok, muka diagonal' },
  { value: 'baterai', label: 'Baterai kaki A', desc: 'Sel bertangga dua muka, lantai miring' },
  { value: 'ark', label: 'Rangka A umbaran', desc: 'Prisma segitiga di rel lantai, bisa diangkat' },
  { value: 'tembok', label: 'Tempel tembok (siku)', desc: 'Ditopang dua siku miring, tanpa kaki' },
  { value: 'gantung', label: 'Gantung plafon', desc: 'Sangkar beratap limas, satu batang gantung' },
  { value: 'tiang', label: 'Tiang tunggal', desc: 'Sangkar di pucuk tiang, kaki silang' },
  { value: 'ternak-panggung', label: 'Panggung ternak', desc: 'Lantai bilah di kolong tinggi, tangga naik' },
  { value: 'koloni', label: 'Koloni deret', desc: 'Sel bersekat, jeruji kepala + palung' },
  { value: 'anjing', label: 'Panel bongkar pasang', desc: 'Panel dibaut, tiang ganda, baki tarik' },
  { value: 'walkin', label: 'Umbaran walk-in', desc: 'Panel modul berdiri, pintu orang' },
];
const KEYS = MODELS.map((m) => m.value);
const model = (p: Params) => {
  const m = str(p, 'model', 'tingkat');
  return KEYS.includes(m) ? m : 'tingkat';
};
const has = (...m: string[]) => (p: Params) => m.includes(model(p));
const clampI = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(v)));
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const TINGKAT_MODELS = ['tingkat', 'pojok', 'baterai'];
const SEL_MODELS = ['baterai', 'koloni'];
const KOLONG_MODELS = ['panggung', 'tembok', 'gantung', 'tiang', 'ternak-panggung', 'anjing'];
const LANTAI_MODELS = ['tingkat', 'panggung', 'pojok', 'tembok', 'gantung', 'tiang', 'ternak-panggung', 'anjing'];
const BAKI_MODELS = ['panggung', 'tembok', 'gantung', 'anjing'];
const PINTU_MODELS = ['tingkat', 'panggung', 'tembok', 'gantung', 'tiang', 'ternak-panggung', 'anjing', 'walkin'];
const ATAP_MODELS = ['tingkat', 'panggung', 'tembok', 'tiang', 'ternak-panggung', 'koloni', 'anjing', 'walkin'];
const RODA_MODELS = ['tingkat', 'anjing'];
const KECIL_MODELS = ['tingkat', 'panggung', 'pojok', 'tembok', 'gantung', 'tiang'];
const BESAR_MODELS = ['ternak-panggung', 'koloni', 'walkin'];

type T2 = [number, number];
type Face = { dir: 'x' | 'z'; fixed: number; out: 1 | -1 };

/** Lebar kaki silang sangkar tiang */
const baseTiang = (W: number, D: number) => Math.max(55, Math.max(W, D) * 1.3);
/** Tinggi ruang tiap tingkat kandang bertingkat */
const tierTingkat = (p: Params) => {
  const n = clampI(num(p, 'tingkat', 3), 1, 4);
  const L = (parseInt(str(p, 'pipa', '20')) || 20) / 10;
  const c = bool(p, 'roda') ? casterHeight(parseInt(str(p, 'ukuranRoda', '3')) || 3) : 0;
  const yb = c + (bool(p, 'roda') ? L / 2 : 6 + L / 2);
  return (num(p, 'tinggi', 150) - L / 2 - yb) / n - L;
};
/** Tinggi sel baterai */
const cellBaterai = (p: Params) => {
  const n = clampI(num(p, 'tingkat', 3), 1, 4);
  return (num(p, 'tinggi', 150) - 4 - 25 - (n - 1) * 6) / n;
};

export const KANDANG: ProductDef = {
  id: 'kandang',
  name: 'Kandang hewan',
  tagline: 'kucing · kelinci · ayam · burung · kambing · anjing',
  icon: 'M6 10h48v22H6zM14 10v22M22 10v22M38 10v22M46 10v22M26 14h8v18h-8zM6 10l24-6 24 6M10 32v4M50 32v4',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['model', 'panjang', 'dalam', 'tinggi', 'tingkat', 'sel', 'kolong', 'tali'] },
    { id: 'bentuk', title: 'Jeruji & pintu', keys: ['jeruji', 'pintu', 'lantai', 'baki', 'atap', 'loncat', 'tangga'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Roda', keys: ['roda', 'ukuranRoda', 'remRoda'] },
  ],
  params: [
    { key: 'model', label: 'Bentuk rangka', type: 'choice', options: MODELS },
    {
      key: 'panjang',
      label: 'Panjang (kiri–kanan)',
      type: 'number',
      unit: 'cm',
      min: 30,
      max: 400,
      step: 1,
      help: 'Panjang ruang kandang. Baterai: panjang satu baris sel. Pojok: sisi yang menempel tembok belakang.',
      marks: [{ value: 50, label: 'burung' }, { value: 90, label: 'kucing / anjing M' }, { value: 200, label: 'kambing' }],
    },
    {
      key: 'dalam',
      label: 'Kedalaman (depan–belakang)',
      type: 'number',
      unit: 'cm',
      min: 25,
      max: 250,
      step: 1,
      help: 'Dari muka depan sampai belakang. Baterai: kedalaman satu sel. Pojok: sisi yang menempel tembok samping.',
      marks: [{ value: 40, label: 'sel ayam' }, { value: 60, label: 'kucing / kelinci' }, { value: 150, label: 'kambing' }],
    },
    {
      key: 'tinggi',
      label: 'Tinggi keseluruhan',
      type: 'number',
      unit: 'cm',
      min: 30,
      max: 250,
      step: 1,
      help: 'Dari lantai sampai atap. Gantung plafon: tinggi sangkarnya saja (tanpa atap limas & batang gantung).',
      marks: [{ value: 70, label: 'anjing M' }, { value: 150, label: 'kucing 3 tingkat' }, { value: 200, label: 'walk-in' }],
    },
    { key: 'tingkat', label: 'Jumlah tingkat', type: 'number', min: 1, max: 4, step: 1, help: 'Tiap tingkat punya lantai dan pintu sendiri.', showIf: has(...TINGKAT_MODELS) },
    { key: 'sel', label: 'Jumlah sel per baris', type: 'number', min: 1, max: 6, step: 1, help: 'Ruang bersekat yang berjajar; tiap sel punya pintu sendiri.', showIf: has(...SEL_MODELS) },
    {
      key: 'kolong',
      label: 'Tinggi kolong / lantai kandang',
      type: 'number',
      unit: 'cm',
      min: 10,
      max: 180,
      step: 1,
      help: 'Jarak lantai rumah ke lantai kandang. Kambing: kolong untuk kotoran 50–100 cm. Gantung & tembok: tinggi dasar sangkar dari lantai.',
      marks: [{ value: 25, label: 'anjing' }, { value: 40, label: 'kelinci' }, { value: 80, label: 'kambing' }, { value: 130, label: 'burung' }],
      showIf: has(...KOLONG_MODELS),
    },
    { key: 'tali', label: 'Panjang batang gantung', type: 'number', unit: 'cm', min: 10, max: 100, step: 1, help: 'Dari puncak atap sangkar sampai plafon.', showIf: has('gantung') },
    {
      key: 'jeruji',
      label: 'Jarak jeruji',
      type: 'choice',
      options: [
        { value: '2.5', label: '2,5 cm', desc: 'Kucing, kelinci, burung kecil, anak ayam' },
        { value: '5', label: '5 cm', desc: 'Ayam, anjing kecil–sedang' },
        { value: '8', label: '8 cm', desc: 'Kambing, domba, anjing besar' },
      ],
      help: 'Celah bersih antar jeruji. Makin kecil makin aman dari hewan lolos atau tikus masuk.',
    },
    { key: 'pintu', label: 'Jumlah pintu per tingkat', type: 'number', min: 1, max: 3, step: 1, help: 'Pintu berengsel di muka depan; tambah pintu bila kandang panjang.', showIf: has(...PINTU_MODELS) },
    {
      key: 'lantai',
      label: 'Jenis lantai',
      type: 'choice',
      options: [
        { value: 'papan', label: 'Papan rata', desc: 'Nyaman untuk kucing & anjing' },
        { value: 'kawat', label: 'Jeruji kawat', desc: 'Kotoran jatuh ke baki' },
        { value: 'bilah', label: 'Papan bilah bercelah', desc: 'Kambing & domba, kotoran jatuh ke kolong' },
      ],
      showIf: has(...LANTAI_MODELS),
    },
    { key: 'baki', label: 'Baki kotoran tarik', type: 'toggle', help: 'Plat besi di bawah lantai yang bisa ditarik untuk dibersihkan.', showIf: has(...BAKI_MODELS) },
    {
      key: 'atap',
      label: 'Atap',
      type: 'choice',
      options: [
        { value: 'jeruji', label: 'Jeruji saja', desc: 'Untuk di dalam ruangan / teras' },
        { value: 'papan', label: 'Jeruji + papan penutup', desc: 'Teduh dari hujan & panas' },
      ],
      showIf: has(...ATAP_MODELS),
    },
    { key: 'loncat', label: 'Lubang naik + papan loncat', type: 'toggle', help: 'Tiap lantai atas diberi lubang dan papan pijakan supaya kucing bisa naik-turun.', showIf: (p) => model(p) === 'tingkat' && num(p, 'tingkat') > 1 },
    { key: 'tangga', label: 'Tangga naik (ramp)', type: 'toggle', help: 'Papan miring dari tanah ke pintu kandang.', showIf: has('ternak-panggung') },
    ...materialParams(true),
    { key: 'roda', label: 'Pakai roda', type: 'toggle', help: 'Mudah dipindah saat lantai dibersihkan.', showIf: has(...RODA_MODELS) },
    { key: 'ukuranRoda', label: 'Ukuran roda', type: 'choice', options: CASTER_OPTIONS, showIf: (p) => p.roda === true && RODA_MODELS.includes(model(p)) },
    { key: 'remRoda', label: 'Roda dengan rem', type: 'toggle', showIf: (p) => p.roda === true && RODA_MODELS.includes(model(p)) },
  ],
  defaults: {
    model: 'tingkat',
    panjang: 80,
    dalam: 50,
    tinggi: 150,
    tingkat: 3,
    sel: 4,
    kolong: 40,
    tali: 40,
    jeruji: '2.5',
    pintu: 1,
    lantai: 'papan',
    baki: true,
    atap: 'jeruji',
    loncat: true,
    tangga: true,
    pipa: '20',
    papan: 'kayu',
    warna: '#1f2226',
    roda: true,
    ukuranRoda: '3',
    remRoda: true,
  },
  groups: [
    { id: 'kecil', name: 'Kucing & kelinci', desc: 'Kandang panggung kaki melebar, atap miring, baki tarik' },
    { id: 'unggas', name: 'Ayam & burung', desc: 'Baterai kaki A, rangka A umbaran, tempel tembok, sangkar gantung & tiang' },
    { id: 'ternak', name: 'Kambing & domba', desc: 'Panggung lantai bilah + tangga, koloni deret dengan palung pakan' },
    { id: 'anjing', name: 'Anjing', desc: 'Kotak panel bongkar pasang, umbaran walk-in berpintu orang' },
  ],
  signature: (p) => `kandang:${model(p)}`,
  presets: [
    {
      id: 'kelinci-panggung',
      group: 'kecil',
      name: 'Kandang kelinci panggung',
      desc: 'kotak jeruji di atas 4 kaki miring melebar, atap miring satu arah, lantai kawat dengan baki tarik',
      params: { model: 'panggung', panjang: 100, dalam: 60, tinggi: 100, kolong: 40, jeruji: '2.5', lantai: 'kawat', baki: true, pintu: 1, atap: 'papan' },
      sizes: [
        { label: 'Kelinci 1–2 ekor', desc: '100 × 60 cm, kolong 40', params: { panjang: 100, dalam: 60, tinggi: 100, kolong: 40 } },
        { label: 'Kelinci indukan', desc: '120 × 70 cm, kolong 50', params: { panjang: 120, dalam: 70, tinggi: 120, kolong: 50, pintu: 2 } },
        { label: 'Marmut / hamster', desc: '70 × 45 cm, kolong 30', params: { panjang: 70, dalam: 45, tinggi: 80, kolong: 30 } },
      ],
    },
    {
      id: 'baterai-ayam',
      group: 'unggas',
      name: 'Baterai ayam kaki A (tangga)',
      desc: 'rangka kaki A, baris sel bertangga di dua muka, lantai kawat miring ke luar dengan talang telur, pintu tiap sel',
      params: { model: 'baterai', panjang: 160, dalam: 40, tinggi: 150, tingkat: 3, sel: 4, jeruji: '5', pipa: '30' },
      sizes: [
        { label: '4 sel × 3 tingkat', desc: '24 ekor (dua muka)', params: { panjang: 160, dalam: 40, tinggi: 150, tingkat: 3, sel: 4 } },
        { label: '6 sel × 3 tingkat', desc: '36 ekor (dua muka)', params: { panjang: 210, dalam: 40, tinggi: 150, tingkat: 3, sel: 6 } },
        { label: 'Ayam 2 tingkat', desc: '4 sel, lebih pendek', params: { panjang: 160, dalam: 40, tinggi: 110, tingkat: 2, sel: 4 } },
        { label: 'Pejantan 3 sel', desc: 'sel lebar 50 cm', params: { panjang: 150, dalam: 45, tinggi: 150, tingkat: 3, sel: 3 } },
      ],
    },
    {
      id: 'ayam-ark',
      group: 'unggas',
      name: 'Kandang ayam rangka A umbaran',
      desc: 'prisma segitiga di atas rel lantai berpegangan angkat, jeruji di kedua lereng & ujung, loteng papan di dalam',
      params: { model: 'ark', panjang: 200, dalam: 100, tinggi: 90, jeruji: '5' },
      sizes: [
        { label: 'Ayam kampung 3–4 ekor', desc: '200 × 100 × 90 cm', params: { panjang: 200, dalam: 100, tinggi: 90 } },
        { label: 'Besar 6–8 ekor', desc: '300 × 120 × 110 cm', params: { panjang: 300, dalam: 120, tinggi: 110, pipa: '30' } },
        { label: 'Kelinci umbaran rumput', desc: '150 × 80 × 70 cm', params: { panjang: 150, dalam: 80, tinggi: 70, jeruji: '2.5' } },
      ],
    },
    {
      id: 'tembok-siku',
      group: 'unggas',
      name: 'Kandang tempel tembok',
      desc: 'tanpa kaki: kotak jeruji 3 sisi + atap menempel tembok, bertumpu dua siku miring, lantai kawat + baki',
      params: { model: 'tembok', panjang: 80, dalam: 45, tinggi: 170, kolong: 110, jeruji: '2.5', lantai: 'kawat', baki: true, pintu: 1, atap: 'papan' },
      sizes: [
        { label: 'Burung kicau', desc: '60 × 40 cm, tinggi ruang 50', params: { panjang: 60, dalam: 40, tinggi: 165, kolong: 115 } },
        { label: 'Ayam hias / bekisar', desc: '100 × 50 cm, tinggi ruang 60', params: { panjang: 100, dalam: 50, tinggi: 170, kolong: 110, pintu: 2 } },
        { label: 'Kucing teras', desc: '80 × 55 cm, tinggi ruang 70', params: { panjang: 80, dalam: 55, tinggi: 170, kolong: 100, lantai: 'papan' } },
      ],
    },
    {
      id: 'sangkar-gantung',
      group: 'unggas',
      name: 'Sangkar gantung plafon',
      desc: 'sangkar kotak beratap limas, digantung satu batang dari puncak atap ke plat plafon, tenggeran di dalam',
      params: { model: 'gantung', panjang: 50, dalam: 40, tinggi: 60, kolong: 140, tali: 40, jeruji: '2.5', lantai: 'kawat', baki: true, pintu: 1 },
      sizes: [
        { label: 'Kenari / lovebird', desc: '45 × 35 × 55 cm', params: { panjang: 45, dalam: 35, tinggi: 55, kolong: 145 } },
        { label: 'Murai / kacer', desc: '60 × 45 × 70 cm', params: { panjang: 60, dalam: 45, tinggi: 70, kolong: 135 } },
        { label: 'Besar / beo', desc: '80 × 55 × 80 cm', params: { panjang: 80, dalam: 55, tinggi: 80, kolong: 125, tali: 30 } },
      ],
    },
    {
      id: 'sangkar-tiang',
      group: 'unggas',
      name: 'Sangkar tiang tunggal',
      desc: 'sangkar kotak di pucuk satu tiang di atas plat dudukan, kaki silang datar di lantai',
      params: { model: 'tiang', panjang: 60, dalam: 45, tinggi: 160, kolong: 90, jeruji: '2.5', lantai: 'kawat', pintu: 1, atap: 'papan' },
      sizes: [
        { label: 'Burung kicau', desc: '60 × 45 cm, ruang 70', params: { panjang: 60, dalam: 45, tinggi: 160, kolong: 90 } },
        { label: 'Lovebird / kenari', desc: '45 × 35 cm, ruang 55', params: { panjang: 45, dalam: 35, tinggi: 150, kolong: 95 } },
        { label: 'Kakatua / beo', desc: '80 × 60 cm, ruang 90', params: { panjang: 80, dalam: 60, tinggi: 180, kolong: 90, pipa: '30' } },
      ],
    },
    {
      id: 'kambing-panggung',
      group: 'ternak',
      name: 'Kandang kambing panggung',
      desc: 'tiang menerus dari tanah ke atap, lantai bilah bercelah di kolong tinggi, atap miring, silang X di kolong, tangga naik',
      params: { model: 'ternak-panggung', panjang: 200, dalam: 150, tinggi: 220, kolong: 80, jeruji: '8', lantai: 'bilah', pintu: 1, atap: 'papan', tangga: true, pipa: '40' },
      sizes: [
        { label: '2–3 ekor', desc: '200 × 150 cm, kolong 80', params: { panjang: 200, dalam: 150, tinggi: 220, kolong: 80 } },
        { label: '4–6 ekor', desc: '300 × 200 cm, kolong 90', params: { panjang: 300, dalam: 200, tinggi: 240, kolong: 90, pintu: 2 } },
        { label: 'Domba / anakan', desc: '150 × 120 cm, kolong 60', params: { panjang: 150, dalam: 120, tinggi: 190, kolong: 60, pipa: '30' } },
      ],
    },
    {
      id: 'kambing-koloni',
      group: 'ternak',
      name: 'Kandang kambing koloni deret',
      desc: 'deret sel bersekat di tiang berplat dibaut lantai, jeruji kepala miring dan palung pakan di muka depan, pintu tiap sel',
      params: { model: 'koloni', panjang: 300, dalam: 150, tinggi: 180, sel: 3, jeruji: '8', atap: 'papan', pipa: '40' },
      sizes: [
        { label: '3 sel', desc: '300 × 150 cm, sel 1 m', params: { panjang: 300, dalam: 150, tinggi: 180, sel: 3 } },
        { label: '4 sel penggemukan', desc: '400 × 150 cm', params: { panjang: 400, dalam: 150, tinggi: 180, sel: 4 } },
        { label: '2 sel indukan', desc: '240 × 180 cm, sel 1,2 m', params: { panjang: 240, dalam: 180, tinggi: 190, sel: 2 } },
      ],
    },
    {
      id: 'anjing-panel',
      group: 'anjing',
      name: 'Kandang anjing panel bongkar pasang',
      desc: '4 panel dinding berbingkai sendiri dibaut (tiang ganda di sudut), atap panel, kaki pendek beroda, lantai jeruji + baki tarik',
      params: { model: 'anjing', panjang: 90, dalam: 60, tinggi: 95, kolong: 25, jeruji: '5', lantai: 'kawat', baki: true, pintu: 1, roda: true, ukuranRoda: '4', atap: 'jeruji' },
      sizes: [
        { label: 'Ukuran M', desc: '90 × 60 cm, ruang 70', params: { panjang: 90, dalam: 60, tinggi: 95, kolong: 25 } },
        { label: 'Ukuran L', desc: '120 × 80 cm, ruang 90', params: { panjang: 120, dalam: 80, tinggi: 115, kolong: 25, pipa: '30' } },
        { label: 'Ukuran XL 2 pintu', desc: '150 × 90 cm, ruang 105', params: { panjang: 150, dalam: 90, tinggi: 130, kolong: 25, pipa: '30', pintu: 2 } },
        { label: 'Kucing / anjing kecil', desc: '70 × 50 cm, ruang 55', params: { panjang: 70, dalam: 50, tinggi: 80, kolong: 25, jeruji: '2.5' } },
      ],
    },
    {
      id: 'umbaran-walkin',
      group: 'anjing',
      name: 'Umbaran anjing walk-in',
      desc: 'panel modul berdiri tanpa tiang (tiang ganda di tiap sambungan), satu panel pintu orang, atap rangka di atas panel',
      params: { model: 'walkin', panjang: 300, dalam: 200, tinggi: 180, jeruji: '8', atap: 'papan', pipa: '30' },
      sizes: [
        { label: '3 × 2 m', desc: '1–2 anjing besar', params: { panjang: 300, dalam: 200, tinggi: 180 } },
        { label: '2 × 2 m', desc: '1 anjing sedang', params: { panjang: 200, dalam: 200, tinggi: 180, jeruji: '5' } },
        { label: '4 × 2 m', desc: 'penangkaran', params: { panjang: 400, dalam: 200, tinggi: 200 } },
      ],
    },
  ],
  summary: (p) => {
    const m = model(p);
    const W = num(p, 'panjang');
    const D = num(p, 'dalam');
    const H = num(p, 'tinggi');
    const n = clampI(num(p, 'tingkat', 1), 1, 4);
    const ns = clampI(num(p, 'sel', 1), 1, 6);
    if (m === 'baterai') return `${ns} sel × ${n} tingkat × 2 muka · sel ${r1(W / ns)} × ${D} cm · tinggi ${H} cm`;
    if (m === 'koloni') return `${W} × ${D} × ${H} cm · ${ns} sel`;
    if (m === 'gantung') return `${W} × ${D} × ${H} cm · digantung ${num(p, 'kolong')} cm dari lantai`;
    if (m === 'tingkat' || m === 'pojok') return `${W} × ${D} × ${H} cm · ${n} tingkat${m === 'tingkat' && bool(p, 'roda') ? ' · beroda' : ''}`;
    if (KOLONG_MODELS.includes(m)) return `${W} × ${D} × ${H} cm · kolong ${num(p, 'kolong')} cm`;
    return `${W} × ${D} × ${H} cm`;
  },

  build: (p) => {
    const m = model(p);
    const W = num(p, 'panjang', 80);
    const D = num(p, 'dalam', 50);
    const H = num(p, 'tinggi', 150);
    const L = (parseInt(str(p, 'pipa', '20')) || 20) / 10;
    const pt: T2 = [L * 10, L * 10];
    const rl: T2 = [20, 20];
    const gap = parseFloat(str(p, 'jeruji', '2.5')) || 2.5;
    const bt: T2 = gap >= 8 ? [15, 15] : [10, 10];
    const t = bt[0] / 10;
    const pitch = gap + t;
    const b = BOARD_THICK[str(p, 'papan', 'kayu')] ?? 2.5;
    const lantai = LANTAI_MODELS.includes(m) ? str(p, 'lantai', 'papan') : 'none';
    const atapPapan = ATAP_MODELS.includes(m) && str(p, 'atap', 'jeruji') === 'papan' && b > 0;
    const baki = BAKI_MODELS.includes(m) && bool(p, 'baki');
    const nDoor = clampI(num(p, 'pintu', 1), 1, 3);
    const roda = RODA_MODELS.includes(m) && bool(p, 'roda');
    const inch = parseInt(str(p, 'ukuranRoda', '3')) || 3;
    const c = roda ? casterHeight(inch) : 0;
    const LD = 2; // tebal rangka pintu (cm)
    const dt: T2 = [20, 20];
    const { list, add, line } = memberFactory();
    const byId = (ids: string[]) => list.filter((mm) => ids.includes(mm.id));
    /**
     * Batang a→b yang kedua ujungnya dipotong menempel rata di sisi batang lain (butt joint):
     * ujung a dipotong terhadap batang `obsA`, ujung b terhadap `obsB`. Potongan < minLen dibuang.
     */
    const butt = (id: string, a: V3, b: V3, role: FrameMember['role'], label: string, tube: T2, obsA: string[], obsB: string[], minLen = 0.5) => {
      const pa = trimTo(b, a, tube, byId(obsA));
      const pb = trimTo(pa, b, tube, byId(obsB));
      if (Math.hypot(pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]) < minLen) return false;
      line(id, pa, pb, role, label, tube);
      return true;
    };
    /** Batang a→b yang memotong batang `mid` di tengah: dipotong dua, kedua potongan dilas di sisi batang itu */
    const buttSplit = (id: string, a: V3, b: V3, x: V3, role: FrameMember['role'], label: string, tube: T2, obsA: string[], mid: string[], obsB: string[]) => {
      butt(`${id}a`, a, x, role, `${label} (potongan 1)`, tube, obsA, mid);
      butt(`${id}b`, x, b, role, `${label} (potongan 2)`, tube, mid, obsB);
    };
    const boards: Board[] = [];
    const hinges: FrameHinge[] = [];
    let casters: Caster[] = [];
    let outW = W;
    let outD = D;
    let outH = H;
    let wall = false;

    /** Titik-titik di antara a0..a1 (tidak termasuk ujung) dengan jarak ±step */
    const spreadIn = (a0: number, a1: number, step = pitch) => {
      const n = Math.max(0, Math.round((a1 - a0) / step) - 1);
      return Array.from({ length: n }, (_, k) => a0 + ((a1 - a0) * (k + 1)) / (n + 1));
    };
    const at = (f: Face, a: number): T2 => (f.dir === 'x' ? [a, f.fixed] : [f.fixed, a]);
    const vAt = (id: string, f: Face, a: number, y: number, len: number, label: string, tube: T2) => {
      const [x, z] = at(f, a);
      add(id, 'y', x, y, z, len, 'custom', label, tube);
    };
    const hAt = (id: string, f: Face, a: number, y: number, len: number, label: string, tube: T2) => {
      const [x, z] = at(f, a);
      add(id, f.dir, x, y, z, len, f.dir === 'x' ? 'rail-x' : 'rail-z', label, tube);
    };
    /** Jeruji tegak di satu bidang, celah bersih a0..a1 dan y0..y1 */
    const bars = (id: string, nm: string, f: Face, a0: number, a1: number, y0: number, y1: number) => {
      if (y1 - y0 < 1) return;
      spreadIn(a0, a1).forEach((a, k) => vAt(`${id}-${k + 1}`, f, a, y0, y1 - y0, `${nm} ${k + 1}`, bt));
    };
    /** Jeruji tegak dengan ujung atas mengikuti fungsi (dinding samping beratap miring) */
    const barsTop = (id: string, nm: string, f: Face, a0: number, a1: number, y0: number, top: (a: number) => number) =>
      spreadIn(a0, a1).forEach((a, k) => {
        const y1 = top(a);
        if (y1 - y0 > 1) vAt(`${id}-${k + 1}`, f, a, y0, y1 - y0, `${nm} ${k + 1}`, bt);
      });
    /**
     * Pintu berengsel: rangka 20×20 + jeruji, sisi engsel menempel batang `partner`, sisi lain diberi kusen.
     * Celah 1 cm di atas, bawah & sisi grendel supaya daun pintu lepas dari rangka saat dibuka.
     * Mengembalikan tepi bersih sesudah kusen.
     */
    const door = (id: string, nm: string, f: Face, a0: number, dw: number, y0: number, y1: number, partner?: string, lift = 0) => {
      const yb = y0 + 1 + lift;
      const yt = y1 - 1;
      const h = yt - yb;
      vAt(`${id}-engsel`, f, a0 + LD / 2, yb, h, `${nm}: rangka sisi engsel`, dt);
      vAt(`${id}-grendel`, f, a0 + dw - LD / 2, yb, h, `${nm}: rangka sisi grendel`, dt);
      hAt(`${id}-bawah`, f, a0 + LD, yb + LD / 2, dw - 2 * LD, `${nm}: rangka bawah`, dt);
      hAt(`${id}-atas`, f, a0 + LD, yt - LD / 2, dw - 2 * LD, `${nm}: rangka atas`, dt);
      spreadIn(a0 + LD, a0 + dw - LD).forEach((a, k) => vAt(`${id}-jeruji-${k + 1}`, f, a, yb + LD, h - 2 * LD, `${nm}: jeruji ${k + 1}`, bt));
      vAt(`${id}-kusen`, f, a0 + dw + 1 + LD / 2, y0, y1 - y0, `${nm}: kusen grendel`, dt);
      if (partner)
        hinges.push({
          id: `engsel-${id}`,
          memberId: `${id}-engsel`,
          partnerId: partner,
          mode: 'edge',
          type: 'butt',
          pos: 0,
          side: 'end',
          foldAxis: f.dir === 'x' ? 'z' : 'x',
          foldSign: f.out,
          carry: true,
          label: `Engsel ${nm.toLowerCase()}`,
        });
      return a0 + dw + 1 + LD;
    };
    /** Satu bidang dinding: pintu (bila ada) dari kiri, sisanya jeruji */
    const face = (id: string, nm: string, doorNm: string, f: Face, a0: number, a1: number, y0: number, y1: number, doors = 0, dwMax = 45, partner?: string, lift = 0) => {
      let a = a0;
      if (doors > 0) {
        const dw = Math.min(dwMax, (a1 - a0 - 6) / doors - LD - 1);
        let prt = partner;
        if (dw >= 14)
          for (let k = 0; k < doors; k++) {
            const did = doors > 1 ? `${id}-pintu-${k + 1}` : `${id}-pintu`;
            a = door(did, doors > 1 ? `${doorNm} ${k + 1}` : doorNm, f, a, dw, y0, y1, prt, lift);
            prt = `${did}-kusen`;
          }
      }
      bars(id, nm, f, a, a1, y0, y1);
    };
    /** Rangka keliling di as tiang (x0..x1, z0..z1); sisi: f(depan) b(belakang) l(kiri) r(kanan) */
    const ring = (id: string, nm: string, x0: number, x1: number, z0: number, z1: number, y: number, tube: T2, sides = 'fblr') => {
      if (sides.includes('b')) add(`${id}-belakang`, 'x', x0 + L / 2, y, z0, x1 - x0 - L, 'rail-x', `${nm} belakang`, tube);
      if (sides.includes('f')) add(`${id}-depan`, 'x', x0 + L / 2, y, z1, x1 - x0 - L, 'rail-x', `${nm} depan`, tube);
      if (sides.includes('l')) add(`${id}-kiri`, 'z', x0, y, z0 + L / 2, z1 - z0 - L, 'rail-z', `${nm} kiri`, tube);
      if (sides.includes('r')) add(`${id}-kanan`, 'z', x1, y, z0 + L / 2, z1 - z0 - L, 'rail-z', `${nm} kanan`, tube);
    };
    /**
     * Lantai di dalam rangka: rusuk melintang (atasnya rata dengan yTop) + isi papan / jeruji / bilah.
     * xa..xb, za..zb = tepi bersih di dalam rangka keliling. hole = lubang naik di pojok belakang.
     */
    const floor = (id: string, nm: string, xa: number, xb: number, za: number, zb: number, yTop: number, kind: string, hole?: { side: 'l' | 'r'; s: number }, avoid: number[] = []) => {
      const nx = Math.max(2, Math.ceil((xb - xa) / 45) + 1);
      const xs: number[] = [];
      for (let k = 0; k < nx; k++) {
        const x = xa + 1 + ((xb - xa - 2) * k) / (nx - 1);
        if (k > 0 && k < nx - 1 && avoid.some((v) => Math.abs(v - x) < 6)) continue;
        xs.push(x);
      }
      const hx = hole ? (hole.side === 'l' ? xa + hole.s : xb - hole.s) : 0;
      if (hole) xs.push(hole.side === 'l' ? hx + 1 : hx - 1);
      xs.forEach((x, k) => add(`${id}-rusuk-${k + 1}`, 'z', x, yTop - 1, za, zb - za, 'rail-z', `${nm}: rusuk ${k + 1}`, rl));
      if (kind === 'papan' && b > 0) {
        if (hole) {
          const hz = za + hole.s;
          if (hole.side === 'l') {
            boards.push(board(`${id}-papan`, nm, hx, xb, yTop, yTop + b, za, zb));
            boards.push(board(`${id}-papan-2`, `${nm} (depan lubang naik)`, xa, hx, yTop, yTop + b, hz, zb));
          } else {
            boards.push(board(`${id}-papan`, nm, xa, hx, yTop, yTop + b, za, zb));
            boards.push(board(`${id}-papan-2`, `${nm} (depan lubang naik)`, hx, xb, yTop, yTop + b, hz, zb));
          }
        } else boards.push(board(`${id}-papan`, nm, xa, xb, yTop, yTop + b, za, zb));
      } else if (kind === 'kawat') {
        spreadIn(za, zb).forEach((z, k) => {
          const lbl = `${nm}: jeruji lantai ${k + 1}`;
          if (hole && z < za + hole.s) {
            if (hole.side === 'l') add(`${id}-kawat-${k + 1}`, 'x', hx, yTop + t / 2, z, xb - hx, 'custom', lbl, bt);
            else add(`${id}-kawat-${k + 1}`, 'x', xa, yTop + t / 2, z, hx - xa, 'custom', lbl, bt);
          } else add(`${id}-kawat-${k + 1}`, 'x', xa, yTop + t / 2, z, xb - xa, 'custom', lbl, bt);
        });
      } else if (kind === 'bilah' && b > 0) {
        const sg = 2;
        const ns = Math.max(2, Math.floor((zb - za + sg) / 9));
        const w = (zb - za - sg * (ns - 1)) / ns;
        for (let k = 0; k < ns; k++) boards.push(board(`${id}-bilah-${k + 1}`, `${nm}: bilah ${k + 1}`, xa, xb, yTop, yTop + b, za + k * (w + sg), za + k * (w + sg) + w));
      }
    };
    /** Atap datar: jeruji melintang di dalam rangka atas (as yC), + papan penutup di atas rangka */
    const roof = (id: string, xa: number, xb: number, za: number, zb: number, yC: number, ringT: number) => {
      spreadIn(xa, xb).forEach((x, k) => add(`${id}-jeruji-${k + 1}`, 'z', x, yC, za, zb - za, 'custom', `Jeruji atap ${k + 1}`, bt));
      if (!atapPapan) return 0;
      boards.push(board(`${id}-papan`, 'Papan atap', xa - ringT, xb + ringT, yC + ringT / 2, yC + ringT / 2 + b, za - ringT, zb + ringT));
      return b;
    };
    /** Rel baki di sisi kiri & kanan (sejajar z, di antara tiang) + plat baki di atasnya */
    const bakiAt = (id: string, x0: number, x1: number, z0: number, z1: number, y: number) => {
      [x0, x1].forEach((x, i) => add(`${id}-rel-${i}`, 'z', x, y, z0 + L / 2, z1 - z0 - L, 'rail-z', `Rel baki ${i ? 'kanan' : 'kiri'}`, rl));
      boards.push({ ...board(`${id}-plat`, 'Baki kotoran (plat, bisa ditarik)', x0, x1, y + 1, y + 1.2, z0 + L / 2, z1 - L / 2), steelMm: 1 });
    };
    /** Papan miring dari (ya, za) ke (yb2, zb2), za < zb2; off = jarak as penopang ke muka bawah papan */
    const slopeBoard = (id: string, label: string, x0: number, x1: number, ya: number, za: number, yb2: number, zb2: number, off: number, thick: number, over = 0, steel?: number): Board => {
      const dz = zb2 - za;
      const dy = yb2 - ya;
      const th = Math.atan2(-dy, dz);
      const half = Math.hypot(dz, dy) / 2 + over;
      const cy = (ya + yb2) / 2 + Math.cos(th) * (off + thick / 2);
      const cz = (za + zb2) / 2 + Math.sin(th) * (off + thick / 2);
      const bd: Board = { ...board(id, label, x0, x1, cy - thick / 2, cy + thick / 2, cz - half, cz + half), rotX: r1((th * 180) / Math.PI) };
      return steel ? { ...bd, steelMm: steel } : bd;
    };
    const FRONT = (z: number): Face => ({ dir: 'x', fixed: z, out: 1 });
    const BACK = (z: number): Face => ({ dir: 'x', fixed: z, out: -1 });
    const LEFT = (x: number): Face => ({ dir: 'z', fixed: x, out: -1 });
    const RIGHT = (x: number): Face => ({ dir: 'z', fixed: x, out: 1 });
    /** 4 dinding jeruji sebuah ruang kotak berporos tiang (x0..x1, z0..z1) di antara dua rangka keliling */
    const walls4 = (id: string, nm: string, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, doors: number, partner: string, sides = 'fblr', dwMax = 40) => {
      if (sides.includes('f')) face(`${id}-depan`, `Jeruji depan${nm}`, `Pintu${nm}`, FRONT(z1), x0 + L / 2, x1 - L / 2, y0, y1, doors, dwMax, partner);
      if (sides.includes('b')) bars(`${id}-belakang`, `Jeruji belakang${nm}`, BACK(z0), x0 + L / 2, x1 - L / 2, y0, y1);
      if (sides.includes('l')) bars(`${id}-kiri`, `Jeruji kiri${nm}`, LEFT(x0), z0 + L / 2, z1 - L / 2, y0, y1);
      if (sides.includes('r')) bars(`${id}-kanan`, `Jeruji kanan${nm}`, RIGHT(x1), z0 + L / 2, z1 - L / 2, y0, y1);
    };

    if (m === 'tingkat') {
      // 4 tiang menerus beroda; tiap tingkat berlantai, lantai atas berlubang naik + papan loncat di bawahnya
      const n = clampI(num(p, 'tingkat', 3), 1, 4);
      const x0 = L / 2;
      const x1 = W - L / 2;
      const z0 = L / 2;
      const z1 = D - L / 2;
      [x0, x1].forEach((x, i) => [z0, z1].forEach((z, j) => add(`tiang-${i}-${j}`, 'y', x, c, z, H - c, 'post', `Tiang ${i ? 'kanan' : 'kiri'} ${j ? 'depan' : 'belakang'}`, pt)));
      const yb = c + (roda ? L / 2 : 6 + L / 2);
      const yt = H - L / 2;
      const lv = Array.from({ length: n + 1 }, (_, k) => yb + ((yt - yb) * k) / n);
      lv.forEach((y, k) => ring(`ring-${k}`, k === 0 ? 'Rangka bawah' : k === n ? 'Rangka atas' : `Rangka lantai ${k + 1}`, x0, x1, z0, z1, y, pt));
      const loncat = bool(p, 'loncat') && n > 1;
      const hs = Math.min(28, (W - 2 * L) * 0.4, (D - 2 * L) * 0.6);
      const holeSide = (k: number): 'l' | 'r' => (k % 2 ? 'l' : 'r');
      const xa = x0 + L / 2;
      const xb = x1 - L / 2;
      const za = z0 + L / 2;
      const zb = z1 - L / 2;
      for (let k = 0; k < n; k++) {
        floor(`lantai-${k + 1}`, `Lantai tingkat ${k + 1}`, xa, xb, za, zb, lv[k] + L / 2, lantai, loncat && k >= 1 ? { side: holeSide(k), s: hs } : undefined);
        const y0 = lv[k] + L / 2;
        const y1 = lv[k + 1] - L / 2;
        walls4(`t${k + 1}`, ` tingkat ${k + 1}`, x0, x1, z0, z1, y0, y1, nDoor, 'tiang-0-1');
        if (loncat && k < n - 1) {
          const s = holeSide(k + 1);
          const xs = s === 'l' ? x0 : x1;
          const ym = (y0 + y1) / 2;
          add(`loncat-${k + 1}-rel`, 'z', xs, ym, z0 + L / 2, z1 - z0 - L, 'rail-z', `Palang papan loncat tingkat ${k + 1}`, rl);
          const xl = s === 'l' ? xs + 1 : xs - 1 - hs;
          [za + 1, zb - 1].forEach((z, j) => add(`loncat-${k + 1}-siku-${j}`, 'x', xl, ym, z, hs, 'custom', `Penyangga papan loncat ${k + 1} ${j ? 'depan' : 'belakang'}`, rl));
          if (b > 0) boards.push(board(`loncat-${k + 1}-papan`, `Papan loncat tingkat ${k + 1}`, xl, xl + hs, ym + 1, ym + 1 + b, za, zb));
        }
      }
      outH = H + roof('atap', xa, xb, za, zb, yt, L);
      if (roda) casters = casterSet([x0, x1], [z0, z1], inch, bool(p, 'remRoda'));
    } else if (m === 'panggung') {
      // Kotak jeruji di atas 4 kaki miring melebar, atap miring ke depan, baki tarik di bawah lantai
      const kol = num(p, 'kolong', 40);
      const sp = clamp(kol * 0.2, 6, 18);
      const x0 = sp + L / 2;
      const x1 = W - sp - L / 2;
      const z0 = sp + L / 2;
      const z1 = D - sp - L / 2;
      const yF = kol;
      const yLeg = yF - 10;
      const rise = Math.max(8, (z1 - z0) * 0.25);
      const yTb = H - L / 2;
      const yTf = yTb - rise;
      const feet: [number, number, number][] = [];
      [x0, x1].forEach((x, i) =>
        [z0, z1].forEach((z, j) => {
          const nm = `${i ? 'kanan' : 'kiri'} ${j ? 'depan' : 'belakang'}`;
          add(`tiang-${i}-${j}`, 'y', x, yLeg, z, (j ? yTf : yTb) + L / 2 - yLeg, 'post', `Tiang ${nm}`, pt);
          const foot: [number, number, number] = [i ? W - L / 2 : L / 2, 0, j ? D - L / 2 : L / 2];
          feet.push(foot);
          line(`kaki-${i}-${j}`, foot, [x, yLeg, z], 'post', `Kaki miring ${nm}`, pt);
        })
      );
      // palang keliling di antara kaki miring
      const yB = Math.max(10, yLeg * 0.35);
      const f = yB / yLeg;
      const P = (i: number, j: number): [number, number, number] => {
        const ft = feet[i * 2 + j];
        const tx = i ? x1 : x0;
        const tz = j ? z1 : z0;
        return [r1(ft[0] + (tx - ft[0]) * f), r1(yB), r1(ft[2] + (tz - ft[2]) * f)];
      };
      // ujung palang dipotong menempel di sisi kaki miring (tidak masuk ke as kaki)
      butt('palang-kaki-belakang', P(0, 0), P(1, 0), 'rail-x', 'Palang kaki belakang', rl, ['kaki-0-0'], ['kaki-1-0']);
      butt('palang-kaki-depan', P(0, 1), P(1, 1), 'rail-x', 'Palang kaki depan', rl, ['kaki-0-1'], ['kaki-1-1']);
      butt('palang-kaki-kiri', P(0, 0), P(0, 1), 'rail-z', 'Palang kaki kiri', rl, ['kaki-0-0', 'palang-kaki-belakang'], ['kaki-0-1', 'palang-kaki-depan']);
      butt('palang-kaki-kanan', P(1, 0), P(1, 1), 'rail-z', 'Palang kaki kanan', rl, ['kaki-1-0', 'palang-kaki-belakang'], ['kaki-1-1', 'palang-kaki-depan']);
      ring('ring-lantai', 'Rangka lantai', x0, x1, z0, z1, yF, pt);
      const xa = x0 + L / 2;
      const xb = x1 - L / 2;
      const za = z0 + L / 2;
      const zb = z1 - L / 2;
      floor('lantai', 'Lantai kandang', xa, xb, za, zb, yF + L / 2, lantai);
      if (baki) bakiAt('baki', x0, x1, z0, z1, yF - 7);
      add('atas-belakang', 'x', xa, yTb, z0, x1 - x0 - L, 'rail-x', 'Rangka atap belakang (tinggi)', pt);
      add('atas-depan', 'x', xa, yTf, z1, x1 - x0 - L, 'rail-x', 'Rangka atap depan (rendah)', pt);
      [x0, x1].forEach((x, i) => line(`atas-${i ? 'kanan' : 'kiri'}`, [x, yTb, za], [x, yTf, zb], 'rail-z', `Rangka atap miring ${i ? 'kanan' : 'kiri'}`, pt));
      const y0 = yF + L / 2;
      face('depan', 'Jeruji depan', 'Pintu', FRONT(z1), xa, xb, y0, yTf - L / 2, nDoor, 45, 'tiang-0-1');
      bars('belakang', 'Jeruji belakang', BACK(z0), xa, xb, y0, yTb - L / 2);
      const slopeY = (z: number) => yTb + ((yTf - yTb) * (z - z0)) / (z1 - z0);
      barsTop('kiri', 'Jeruji kiri', LEFT(x0), za, zb, y0, (z) => slopeY(z) - L * 0.7);
      barsTop('kanan', 'Jeruji kanan', RIGHT(x1), za, zb, y0, (z) => slopeY(z) - L * 0.7);
      spreadIn(xa, xb).forEach((x, k) => line(`atap-jeruji-${k + 1}`, [x, yTb, za], [x, yTf, zb], 'custom', `Jeruji atap ${k + 1}`, bt));
      if (atapPapan) {
        boards.push(slopeBoard('atap-papan', 'Papan atap miring', 0, W, yTb, z0, yTf, z1, L / 2, b, sp));
        outH = H + b;
      }
    } else if (m === 'pojok') {
      // Denah segitiga: tiang pojok + tiang di ujung kedua tembok, muka depan diagonal
      wall = true;
      const n = clampI(num(p, 'tingkat', 2), 1, 4);
      const x0 = L / 2;
      const x1 = W - L / 2;
      const z0 = L / 2;
      const z1 = D - L / 2;
      add('tiang-pojok', 'y', x0, 0, z0, H, 'post', 'Tiang pojok', pt);
      add('tiang-kanan', 'y', x1, 0, z0, H, 'post', 'Tiang ujung tembok belakang', pt);
      add('tiang-depan', 'y', x0, 0, z1, H, 'post', 'Tiang ujung tembok samping', pt);
      const yb = 6 + L / 2;
      const yt = H - L / 2;
      const lv = Array.from({ length: n + 1 }, (_, k) => yb + ((yt - yb) * k) / n);
      const xd = (z: number) => x1 - ((x1 - x0) * (z - z0)) / (z1 - z0);
      const dl = Math.hypot(x1 - x0, z1 - z0);
      const pd = (u: number): T2 => [x1 + ((x0 - x1) * u) / dl, z0 + ((z1 - z0) * u) / dl];
      const rodsAt = (id: string, nm: string, y: number) =>
        spreadIn(z0 + L / 2, z1 - L / 2).forEach((z, k) => {
          const len = xd(z) - L * 0.7 - (x0 + L / 2);
          if (len > 2) add(`${id}-${k + 1}`, 'x', x0 + L / 2, y, z, len, 'custom', `${nm} ${k + 1}`, bt);
        });
      lv.forEach((y, k) => {
        const nm = k === 0 ? 'bawah' : k === n ? 'atas' : `lantai ${k + 1}`;
        add(`ring-${k}-belakang`, 'x', x0 + L / 2, y, z0, x1 - x0 - L, 'rail-x', `Rangka ${nm} belakang`, pt);
        add(`ring-${k}-kiri`, 'z', x0, y, z0 + L / 2, z1 - z0 - L, 'rail-z', `Rangka ${nm} samping`, pt);
        line(`ring-${k}-diagonal`, [x1, y, z0], [x0, y, z1], 'custom', `Rangka ${nm} diagonal`, pt);
      });
      const a = (Math.min(W, D) - 2 * L) * 0.42;
      for (let k = 0; k < n; k++) {
        rodsAt(`lantai-${k + 1}-jeruji`, `Jeruji lantai tingkat ${k + 1}`, lv[k]);
        if (lantai === 'papan' && b > 0) boards.push(board(`lantai-${k + 1}-papan`, `Papan tidur tingkat ${k + 1}`, x0 + L / 2, x0 + L / 2 + a, lv[k] + t / 2, lv[k] + t / 2 + b, z0 + L / 2, z0 + L / 2 + a));
        const y0 = lv[k] + L / 2;
        const y1 = lv[k + 1] - L / 2;
        bars(`t${k + 1}-belakang`, `Jeruji belakang tingkat ${k + 1}`, BACK(z0), x0 + L / 2, x1 - L / 2, y0, y1);
        bars(`t${k + 1}-kiri`, `Jeruji samping tingkat ${k + 1}`, LEFT(x0), z0 + L / 2, z1 - L / 2, y0, y1);
        // muka diagonal: kusen engsel, daun pintu di tengah, kusen grendel, sisanya jeruji
        const dw = Math.min(40, dl * 0.4);
        const u0 = dl / 2 - dw / 2;
        const u1 = dl / 2 + dw / 2;
        const tg = `t${k + 1}-pintu`;
        const vd = (id: string, u: number, ya: number, len: number, lbl: string, tube: T2) => {
          const [x, z] = pd(u);
          add(id, 'y', x, ya, z, len, 'custom', lbl, tube);
        };
        vd(`${tg}-kusen-engsel`, u0 - LD / 2, y0, y1 - y0, `Kusen engsel pintu tingkat ${k + 1}`, dt);
        vd(`${tg}-kusen-grendel`, u1 + 1 + LD / 2, y0, y1 - y0, `Kusen grendel pintu tingkat ${k + 1}`, dt);
        const yb2 = y0 + 1;
        const yt2 = y1 - 1;
        vd(`${tg}-engsel`, u0 + LD / 2, yb2, yt2 - yb2, `Pintu tingkat ${k + 1}: rangka sisi engsel`, dt);
        vd(`${tg}-grendel`, u1 - LD / 2, yb2, yt2 - yb2, `Pintu tingkat ${k + 1}: rangka sisi grendel`, dt);
        const pa = pd(u0 + LD);
        const pb = pd(u1 - LD);
        line(`${tg}-bawah`, [pa[0], yb2 + LD / 2, pa[1]], [pb[0], yb2 + LD / 2, pb[1]], 'custom', `Pintu tingkat ${k + 1}: rangka bawah`, dt);
        line(`${tg}-atas`, [pa[0], yt2 - LD / 2, pa[1]], [pb[0], yt2 - LD / 2, pb[1]], 'custom', `Pintu tingkat ${k + 1}: rangka atas`, dt);
        spreadIn(u0 + LD, u1 - LD).forEach((u, q) => vd(`${tg}-jeruji-${q + 1}`, u, yb2 + LD, yt2 - yb2 - 2 * LD, `Pintu tingkat ${k + 1}: jeruji ${q + 1}`, bt));
        spreadIn(L * 0.8, u0 - LD).forEach((u, q) => vd(`t${k + 1}-diagonal-a-${q + 1}`, u, y0, y1 - y0, `Jeruji diagonal tingkat ${k + 1}`, bt));
        spreadIn(u1 + 1 + LD, dl - L * 0.8).forEach((u, q) => vd(`t${k + 1}-diagonal-b-${q + 1}`, u, y0, y1 - y0, `Jeruji diagonal tingkat ${k + 1}`, bt));
      }
      rodsAt('atap-jeruji', 'Jeruji atap', lv[n]);
    } else if (m === 'baterai') {
      // Rangka kaki A di kedua ujung; tiap muka baris sel bertangga, lantai kawat miring ke luar + talang telur
      const n = clampI(num(p, 'tingkat', 3), 1, 4);
      const ns = clampI(num(p, 'sel', 4), 1, 6);
      const cd = D;
      const step = cd * 0.55;
      const yTop = H - 4;
      const gT = 6;
      const ch = cellBaterai(p);
      const zc = (n - 1) * step + cd + 14;
      outW = W + 2 * L;
      outD = 2 * zc;
      const yA = H - L / 2;
      const zFoot = (n - 1) * step + cd * 0.6 + 2;
      // kedua kaki A dipotong rata di puncak dan bertemu tepat di garis tengah (tidak saling tembus)
      let wK = L / 2;
      for (let k = 0; k < 4; k++) wK = (L / 2) / (H / Math.hypot(H, zFoot - wK));
      const zleg = (y: number) => zFoot + ((wK - zFoot) * y) / H;
      const xl = [L / 2, outW - L / 2];
      const kakiId = (i: number, s: number) => `kaki-${i}-${s > 0 ? 'depan' : 'belakang'}`;
      xl.forEach((x, i) =>
        [1, -1].forEach((s) => line(kakiId(i, s), [x, 0, zc + s * zFoot], [x, H, zc + s * wK], 'post', `Kaki A ${i ? 'kanan' : 'kiri'} ${s > 0 ? 'depan' : 'belakang'}`, pt))
      );
      add('bubungan', 'x', L, yA, zc, W, 'rail-x', 'Palang puncak', pt);
      [1, -1].forEach((s) => add(`dasar-${s > 0 ? 'depan' : 'belakang'}`, 'x', L, 12, zc + s * zleg(12), W, 'rail-x', `Palang bawah ${s > 0 ? 'depan' : 'belakang'}`, pt));
      xl.forEach((x, i) =>
        butt(`ikat-kaki-${i}`, [x, 12, zc - zleg(12)], [x, 12, zc + zleg(12)], 'rail-z', `Palang ikat kaki A ${i ? 'kanan' : 'kiri'}`, pt, [kakiId(i, -1)], [kakiId(i, 1)])
      );
      const xbs = Array.from({ length: ns + 1 }, (_, k) => L + 1 + ((W - 2) * k) / ns);
      const cw = W / ns;
      [1, -1].forEach((s) => {
        for (let j = 0; j < n; j++) {
          const yT = yTop - j * (ch + gT);
          const yF = yT - ch;
          const yFi = yF + 3;
          const vi = 1 + j * step;
          const vo = vi + cd;
          const zi = zc + s * vi;
          const zo = zc + s * vo;
          const zmin = Math.min(zi, zo);
          const tag = `${s > 0 ? 'd' : 'b'}${n - j}`;
          const sn = `${s > 0 ? 'depan' : 'belakang'} tingkat ${n - j}`;
          // tiang ujung baris (menempel siku kaki A)
          [0, ns].forEach((k) => {
            const x = xbs[k];
            const e = k ? 'kanan' : 'kiri';
            add(`${tag}-tiang-luar-${e}`, 'y', x, yF - 1, zo, ch + 2, 'post', `Tiang luar ${e} baris ${sn}`, rl);
            add(`${tag}-tiang-dalam-${e}`, 'y', x, yFi - 1, zi, yT + 1 - (yFi - 1), 'post', `Tiang dalam ${e} baris ${sn}`, rl);
          });
          add(`${tag}-rel-lantai-dalam`, 'x', L + 2, yFi, zi, W - 4, 'rail-x', `Rel lantai dalam ${sn}`, rl);
          add(`${tag}-rel-lantai-luar`, 'x', L + 2, yF, zo, W - 4, 'rail-x', `Rel lantai luar ${sn}`, rl);
          add(`${tag}-rel-atas-dalam`, 'x', L + 2, yT, zi, W - 4, 'rail-x', `Rel atas dalam ${sn}`, rl);
          add(`${tag}-rel-atas-luar`, 'x', L + 2, yT, zo, W - 4, 'rail-x', `Rel atas luar ${sn}`, rl);
          // sekat antar sel (termasuk kedua ujung)
          xbs.forEach((x, k) => {
            add(`${tag}-sekat-${k}-atas`, 'z', x, yT, zmin + 1, cd - 2, 'rail-z', `Sekat ${k} atas ${sn}`, rl);
            line(`${tag}-sekat-${k}-bawah`, [x, yFi, zi + s], [x, yF, zo - s], 'rail-z', `Sekat ${k} bawah ${sn}`, rl);
            spreadIn(zmin + 1, zmin + cd - 1, pitch * 1.5).forEach((z, q) => {
              const fr = Math.abs(z - zi) / cd;
              const y0 = yFi + (yF - yFi) * fr + 1;
              add(`${tag}-sekat-${k}-${q + 1}`, 'y', x, y0, z, yT - 1 - y0, 'custom', `Jeruji sekat ${k} ${sn}`, bt);
            });
            if (k > 0 && k < ns) add(`${tag}-kusen-sel-${k}`, 'y', x, yF + 1, zo, ch - 2, 'post', `Tiang sekat depan ${k} ${sn}`, rl);
          });
          for (let k = 0; k < ns; k++) {
            const a0 = xbs[k] + 1;
            const a1 = xbs[k + 1] - 1;
            const partner = k === 0 ? `${tag}-tiang-luar-kiri` : `${tag}-kusen-sel-${k}`;
            // daun pintu diangkat 4 cm supaya lepas dari jeruji lantai miring di bawahnya
            face(`${tag}-sel-${k + 1}`, `Jeruji muka sel ${k + 1} ${sn}`, `Pintu sel ${k + 1} ${sn}`, { dir: 'x', fixed: zo, out: s > 0 ? 1 : -1 }, a0, a1, yF + 1, yT - 1, 1, cw * 0.55, partner, 4);
            // tingkat teratas: kedua muka bertolak punggung, cukup satu bidang jeruji dalam
            if (!(s < 0 && j === 0)) bars(`${tag}-dalam-${k + 1}`, `Jeruji dalam sel ${k + 1} ${sn}`, { dir: 'x', fixed: zi, out: s > 0 ? -1 : 1 }, a0, a1, yFi + 1, yT - 1);
            spreadIn(a0, a1, pitch * 2).forEach((x, q) => add(`${tag}-atap-${k + 1}-${q + 1}`, 'z', x, yT, zmin + 1, cd - 2, 'custom', `Jeruji atap sel ${k + 1} ${sn}`, bt));
            // jeruji lantai menumpang di atas rel lantai, ujungnya menempel di jeruji dalam & di rangka muka
            spreadIn(a0, a1, Math.max(pitch, 6)).forEach((x, q) =>
              line(`${tag}-lantai-${k + 1}-${q + 1}`, [x, yFi + 1 + t / 2, zi + (s * t) / 2], [x, yF + 1 + t / 2, zo - s], 'custom', `Jeruji lantai miring sel ${k + 1} ${sn}`, bt)
            );
          }
          // talang telur: siku keluar dari sisi tiang luar (dipotong tegak, menempel rata) + plat miring + bibir penahan di ujung siku
          [0, ns].forEach((k) => line(`${tag}-siku-telur-${k}`, [xbs[k], yF, zo + s], [xbs[k], yF - 3, zo + s * 10], 'custom', `Siku talang telur ${sn}`, rl));
          add(`${tag}-bibir-telur`, 'x', L + 1, yF - 2, zo + s * 11, W - 2, 'rail-x', `Bibir talang telur ${sn}`, rl);
          const pa: T2 = [yF, zo + s];
          const pb: T2 = [yF - 3, zo + s * 10];
          const [lo, hi] = s > 0 ? [pa, pb] : [pb, pa];
          boards.push(slopeBoard(`${tag}-talang-telur`, `Talang telur ${sn}`, L + 2, L + W - 2, lo[0], lo[1], hi[0], hi[1], 1, 0.2, 0, 1));
          // siku dari kaki A ke tiang ujung baris
          // siku menempel di sisi kaki A; bila kaki A memotong siku di tengah, siku dipotong dua
          xl.forEach((x, i) =>
            [yT, yF].forEach((y, q) => {
              const sid = `${tag}-siku-${i}-${q ? 'bawah' : 'atas'}`;
              const lbl = `Siku kaki A ${i ? 'kanan' : 'kiri'} ${q ? 'bawah' : 'atas'} ${sn}`;
              const kz = zleg(y);
              const kid = kakiId(i, s);
              if (kz > vi + 0.5 && kz < vo - 0.5)
                buttSplit(sid, [x, y, zc + s * vi], [x, y, zo], [x, y, zc + s * kz], 'rail-z', lbl, pt, [], [kid], []);
              else if (kz <= vi + 0.5) butt(sid, [x, y, zc + s * kz], [x, y, zo], 'rail-z', lbl, pt, [kid], []);
              else butt(sid, [x, y, zc + s * vi], [x, y, zo], 'rail-z', lbl, pt, [], [kid]);
            })
          );
        }
      });
    } else if (m === 'ark') {
      // Prisma segitiga di atas rel lantai (diteruskan jadi pegangan angkat), jeruji lereng & ujung, loteng
      const ox = 15;
      outW = W + 2 * ox;
      const zc = D / 2;
      const yR = H - L / 2;
      const y0r = L;
      const zs = (y: number) => L / 2 + ((zc - L / 2) * (y - y0r)) / (yR - y0r);
      const yAt = (z: number) => y0r + ((yR - y0r) * (Math.min(z, D - z) - L / 2)) / (zc - L / 2);
      add('rel-belakang', 'x', 0, L / 2, L / 2, outW, 'rail-x', 'Rel lantai belakang + pegangan angkat', pt);
      add('rel-depan', 'x', 0, L / 2, D - L / 2, outW, 'rail-x', 'Rel lantai depan + pegangan angkat', pt);
      const xg0 = ox + L / 2;
      const xg1 = ox + W - L / 2;
      [xg0, xg1].forEach((x, i) => add(`rel-ujung-${i}`, 'z', x, L / 2, L, D - 2 * L, 'rail-z', `Rel lantai ujung ${i ? 'kanan' : 'kiri'}`, pt));
      const nr = Math.max(1, Math.ceil(W / 90));
      const xr = Array.from({ length: nr + 1 }, (_, i) => xg0 + ((xg1 - xg0) * i) / nr);
      // kaki A berhenti di bawah palang puncak; potongan atas kedua kaki bertemu tepat di garis tengah
      const yK = yR - L / 2;
      let zK = zc - L / 2;
      for (let k = 0; k < 4; k++) zK = zc - (L / 2) / (Math.abs(yK - y0r) / Math.hypot(yK - y0r, zK - L / 2));
      xr.forEach((x, i) => {
        line(`kasau-${i}-b`, [x, y0r, L / 2], [x, yK, zK], 'post', `Kaki A ${i + 1} belakang`, pt);
        line(`kasau-${i}-d`, [x, y0r, D - L / 2], [x, yK, D - zK], 'post', `Kaki A ${i + 1} depan`, pt);
      });
      const kasauIds = xr.flatMap((_, i) => [`kasau-${i}-b`, `kasau-${i}-d`]);
      add('bubungan', 'x', ox, yR, zc, W, 'rail-x', 'Palang puncak', pt);
      // palang tengah lereng: dipotong per bentang di antara kaki A, menempel di balik bidang jeruji lereng
      const ym = (y0r + yR) / 2;
      const sl = Math.hypot(yR - y0r, zc - L / 2);
      const ny = -(zc - L / 2) / sl;
      const nz = (yR - y0r) / sl;
      const gOff = t / 2 + Math.abs(ny) + Math.abs(nz);
      for (let i = 0; i < nr; i++) {
        const gx = xr[i] + L / 2;
        const gl = xr[i + 1] - xr[i] - L;
        const sfx = nr > 1 ? ` ${i + 1}` : '';
        add(`gording-b-${i + 1}`, 'x', gx, ym + ny * gOff, zs(ym) + nz * gOff, gl, 'rail-x', `Palang tengah lereng belakang${sfx}`, rl);
        add(`gording-d-${i + 1}`, 'x', gx, ym + ny * gOff, D - zs(ym) - nz * gOff, gl, 'rail-x', `Palang tengah lereng depan${sfx}`, rl);
      }
      const yEnd = yR - L / 2;
      for (let i = 0; i < nr; i++)
        spreadIn(xr[i] + L / 2, xr[i + 1] - L / 2).forEach((x, k) => {
          line(`lereng-b-${i + 1}-${k + 1}`, [x, y0r, L / 2], [x, yEnd, zs(yEnd)], 'custom', `Jeruji lereng belakang ${i + 1}.${k + 1}`, bt);
          line(`lereng-d-${i + 1}-${k + 1}`, [x, y0r, D - L / 2], [x, yEnd, D - zs(yEnd)], 'custom', `Jeruji lereng depan ${i + 1}.${k + 1}`, bt);
        });
      // ujung kiri: pintu di tengah segitiga
      const fL = LEFT(xg0);
      const dw = Math.min(45, D * 0.4);
      const a0 = zc - dw / 2;
      const aE0 = a0 + dw + 1 + LD;
      const dh = Math.max(20, Math.min(H * 0.6, Math.min(yAt(a0 - LD), yAt(aE0)) - y0r - 6));
      // batang tegak di bidang ujung: ujung atas dipotong menempel di sisi bawah kaki A miring
      const k0 = ['kasau-0-b', 'kasau-0-d', 'bubungan'];
      const kN = [`kasau-${nr}-b`, `kasau-${nr}-d`, 'bubungan'];
      const upTo = (id: string, x: number, z: number, y0: number, lbl: string, tube: T2, obs: string[]) =>
        butt(id, [x, y0, z], [x, yAt(z) + L, z], 'custom', lbl, tube, [], obs, 1);
      upTo('kusen-engsel', xg0, a0 - LD / 2, y0r, 'Kusen engsel pintu ujung', dt, k0);
      // tanpa engsel 3D: daun pintu sebidang dengan kaki A miring, kotak batasnya selalu bersinggungan
      const aE = door('pintu', 'Pintu ujung', fL, a0, dw, y0r, y0r + dh);
      add('ambang-atas', 'z', xg0, y0r + dh + 1, a0, aE - a0, 'rail-z', 'Ambang atas pintu', dt);
      spreadIn(L, D - L).forEach((z, k) => {
        const id = `ujung-kiri-${k + 1}`;
        const lbl = `Jeruji ujung kiri ${k + 1}`;
        if (z + t / 2 > a0 - LD && z - t / 2 < a0) return; // tempat kusen engsel
        if (z > a0 && z < aE + 0.8) upTo(id, xg0, z, y0r + dh + 2, lbl, bt, k0);
        else upTo(id, xg0, z, y0r, lbl, bt, k0);
      });
      spreadIn(L, D - L).forEach((z, k) => upTo(`ujung-kanan-${k + 1}`, xg1, z, y0r, `Jeruji ujung kanan ${k + 1}`, bt, kN));
      // loteng papan di bentang paling kanan
      const yl = Math.max(L + 25, H * 0.42);
      const zl = zs(yl) + L;
      const xla = xr[nr - 1] + L / 2;
      const xlb = xr[nr] - L / 2;
      add('loteng-rel-b', 'x', xla, yl, zl, xlb - xla, 'rail-x', 'Rel loteng belakang', rl);
      add('loteng-rel-d', 'x', xla, yl, D - zl, xlb - xla, 'rail-x', 'Rel loteng depan', rl);
      if (b > 0) boards.push(board('loteng', 'Loteng / tempat bertengger', xla, xlb, yl + 1, yl + 1 + b, zl - 1, D - zl + 1));
    } else if (m === 'tembok') {
      // Kotak jeruji menempel tembok, tanpa kaki: tiang tembok + siku miring ke tiang depan
      wall = true;
      const kol = num(p, 'kolong', 110);
      const x0 = L / 2;
      const x1 = W - L / 2;
      const z0 = L / 2;
      const z1 = D - L / 2;
      const yF = kol;
      const yT = H - L / 2;
      const sikuH = clamp(D * 0.8, 20, 45);
      const yS = yF - 9 - sikuH;
      [x0, x1].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        add(`tiang-${i}-0`, 'y', x, yS, z0, H - yS, 'post', `Tiang tembok ${nm} (dibaut)`, pt);
        add(`tiang-${i}-1`, 'y', x, yF - 9, z1, H - (yF - 9), 'post', `Tiang depan ${nm}`, pt);
        line(`siku-${i}`, [x, yS + 2, z0 + L / 2], [x, yF - 9, z1], 'custom', `Siku miring ${nm}`, pt);
      });
      ring('ring-lantai', 'Rangka lantai', x0, x1, z0, z1, yF, pt);
      ring('ring-atas', 'Rangka atas', x0, x1, z0, z1, yT, pt);
      const xa = x0 + L / 2;
      const xb = x1 - L / 2;
      const za = z0 + L / 2;
      const zb = z1 - L / 2;
      floor('lantai', 'Lantai kandang', xa, xb, za, zb, yF + L / 2, lantai);
      if (baki) bakiAt('baki', x0, x1, z0, z1, yF - 7);
      walls4('d', '', x0, x1, z0, z1, yF + L / 2, yT - L / 2, nDoor, 'tiang-0-1', 'flr', 45);
      outH = H + roof('atap', xa, xb, za, zb, yT, L);
    } else if (m === 'gantung') {
      // Sangkar kotak beratap limas, satu batang gantung ke plat plafon
      const kol = num(p, 'kolong', 140);
      const tali = num(p, 'tali', 40);
      const x0 = L / 2;
      const x1 = W - L / 2;
      const z0 = L / 2;
      const z1 = D - L / 2;
      const yF = kol;
      const yT = kol + H - L / 2;
      [x0, x1].forEach((x, i) => [z0, z1].forEach((z, j) => add(`tiang-${i}-${j}`, 'y', x, yF - 9, z, yT + L / 2 - (yF - 9), 'post', `Tiang ${i ? 'kanan' : 'kiri'} ${j ? 'depan' : 'belakang'}`, pt)));
      ring('ring-lantai', 'Rangka lantai', x0, x1, z0, z1, yF, pt);
      ring('ring-atas', 'Rangka atas', x0, x1, z0, z1, yT, pt);
      const xa = x0 + L / 2;
      const xb = x1 - L / 2;
      const za = z0 + L / 2;
      const zb = z1 - L / 2;
      floor('lantai', 'Lantai sangkar', xa, xb, za, zb, yF + L / 2, lantai);
      if (baki) bakiAt('baki', x0, x1, z0, z1, yF - 7);
      walls4('d', '', x0, x1, z0, z1, yF + L / 2, yT - L / 2, nDoor, 'tiang-0-1', 'fblr', 30);
      const yP = yF + (yT - yF) * 0.45;
      // palang dudukan menempel di balik jeruji samping (tidak sebidang dengan jeruji)
      [x0 + t / 2 + 1, x1 - t / 2 - 1].forEach((x, i) => add(`tenggeran-rel-${i}`, 'z', x, yP, za, z1 - z0 - L, 'rail-z', `Palang dudukan tenggeran ${i ? 'kanan' : 'kiri'}`, rl));
      add('tenggeran', 'x', x0 + t / 2 + 2, yP, D / 2, x1 - x0 - t - 4, 'custom', 'Tenggeran', rl);
      const rise = Math.min(W, D) * 0.35;
      const apex: V3 = [W / 2, yT + rise, D / 2];
      const yC = apex[1] + tali;
      // batang gantung diteruskan sedikit di bawah puncak: rusuk limas dilas menempel di sisinya
      const yG = apex[1] - 3 * L;
      add('batang-gantung', 'y', W / 2, yG, D / 2, yC - yG, 'post', 'Batang gantung', pt);
      // rusuk limas berdiri di atas pucuk tiang sudut (rata permukaan atas rangka atas)
      const yB = yT + L / 2;
      const corners: T2[] = [
        [x0, z0],
        [x1, z0],
        [x1, z1],
        [x0, z1],
      ];
      const rusuk: string[] = [];
      corners.forEach(([x, z], k) => {
        butt(`limas-${k + 1}`, [x, yB, z], apex, 'custom', `Rusuk atap limas ${k + 1}`, pt, [], ['batang-gantung', ...rusuk]);
        rusuk.push(`limas-${k + 1}`);
      });
      // jeruji atap sejajar tiap bidang limas: berdiri di atas rangka atas, ujung atas dipotong menempel di rusuk
      const roofObs = ['batang-gantung', ...rusuk];
      spreadIn(xa, xb, pitch * 1.4).forEach((x, k) => {
        butt(`atap-b-${k + 1}`, [x, yB, z0], [x, apex[1], D / 2], 'custom', `Jeruji atap belakang ${k + 1}`, bt, [], roofObs, 1.5);
        butt(`atap-d-${k + 1}`, [x, yB, z1], [x, apex[1], D / 2], 'custom', `Jeruji atap depan ${k + 1}`, bt, [], roofObs, 1.5);
      });
      spreadIn(za, zb, pitch * 1.4).forEach((z, k) => {
        butt(`atap-l-${k + 1}`, [x0, yB, z], [W / 2, apex[1], z], 'custom', `Jeruji atap kiri ${k + 1}`, bt, [], roofObs, 1.5);
        butt(`atap-r-${k + 1}`, [x1, yB, z], [W / 2, apex[1], z], 'custom', `Jeruji atap kanan ${k + 1}`, bt, [], roofObs, 1.5);
      });
      boards.push({ ...board('plat-plafon', 'Plat plafon (dibaut)', W / 2 - 7, W / 2 + 7, yC, yC + 0.6, D / 2 - 7, D / 2 + 7), steelMm: 6 });
      outH = yC + 0.6;
    } else if (m === 'tiang') {
      // Sangkar di pucuk satu tiang, kaki silang datar
      const kol = num(p, 'kolong', 90);
      const B = baseTiang(W, D);
      outW = Math.max(W, B);
      outD = Math.max(D, B);
      const cx = outW / 2;
      const cz = outD / 2;
      const Pb = Math.max(3, L);
      const pb: T2 = [Pb * 10, Pb * 10];
      add('kaki-silang-1', 'x', cx - B / 2, Pb / 2, cz, B, 'rail-x', 'Kaki silang kiri–kanan', pb);
      add('kaki-silang-2a', 'z', cx, Pb / 2, cz - B / 2, B / 2 - Pb / 2, 'rail-z', 'Kaki silang belakang', pb);
      add('kaki-silang-2b', 'z', cx, Pb / 2, cz + Pb / 2, B / 2 - Pb / 2, 'rail-z', 'Kaki silang depan', pb);
      add('tiang', 'y', cx, Pb, cz, kol - 0.6 - Pb, 'post', 'Tiang tunggal', [40, 40]);
      boards.push({ ...board('plat-dudukan', 'Plat dudukan sangkar', cx - 15, cx + 15, kol - 0.6, kol, cz - 15, cz + 15), steelMm: 6 });
      const x0 = cx - W / 2 + L / 2;
      const x1 = cx + W / 2 - L / 2;
      const z0 = cz - D / 2 + L / 2;
      const z1 = cz + D / 2 - L / 2;
      const yF = kol + L / 2;
      const yT = H - L / 2;
      [x0, x1].forEach((x, i) => [z0, z1].forEach((z, j) => add(`tiang-${i}-${j}`, 'y', x, kol, z, H - kol, 'post', `Tiang sangkar ${i ? 'kanan' : 'kiri'} ${j ? 'depan' : 'belakang'}`, pt)));
      ring('ring-lantai', 'Rangka lantai', x0, x1, z0, z1, yF, pt);
      ring('ring-atas', 'Rangka atas', x0, x1, z0, z1, yT, pt);
      const xa = x0 + L / 2;
      const xb = x1 - L / 2;
      const za = z0 + L / 2;
      const zb = z1 - L / 2;
      add('dudukan', 'z', cx, kol + 1, za, zb - za, 'rail-z', 'Palang dudukan di atas plat', rl);
      floor('lantai', 'Lantai sangkar', xa, xb, za, zb, yF + L / 2, lantai, undefined, [cx]);
      walls4('d', '', x0, x1, z0, z1, yF + L / 2, yT - L / 2, nDoor, 'tiang-0-1', 'fblr', 30);
      const yP = yF + (yT - yF) * 0.45;
      // palang dudukan menempel di balik jeruji samping (tidak sebidang dengan jeruji)
      [x0 + t / 2 + 1, x1 - t / 2 - 1].forEach((x, i) => add(`tenggeran-rel-${i}`, 'z', x, yP, za, z1 - z0 - L, 'rail-z', `Palang dudukan tenggeran ${i ? 'kanan' : 'kiri'}`, rl));
      add('tenggeran', 'x', x0 + t / 2 + 2, yP, cz, x1 - x0 - t - 4, 'custom', 'Tenggeran', rl);
      outH = H + roof('atap', xa, xb, za, zb, yT, L);
    } else if (m === 'ternak-panggung') {
      // Tiang menerus tanah–atap, lantai bilah di kolong tinggi, atap miring, silang X di kolong, tangga naik
      const kol = num(p, 'kolong', 80);
      const nb = Math.max(1, Math.ceil(W / 160));
      const xs = Array.from({ length: nb + 1 }, (_, i) => L / 2 + ((W - L) * i) / nb);
      const z0 = L / 2;
      const z1 = D - L / 2;
      const rise = Math.max(15, D * 0.18);
      const yTb = H - L / 2;
      const yTf = yTb - rise;
      const yF = kol;
      xs.forEach((x, i) => {
        add(`tiang-${i}-0`, 'y', x, 0, z0, yTb + L / 2, 'post', `Tiang belakang ${i + 1}`, pt);
        add(`tiang-${i}-1`, 'y', x, 0, z1, yTf + L / 2, 'post', `Tiang depan ${i + 1}`, pt);
        add(`lantai-balok-${i}`, 'z', x, yF, z0 + L / 2, z1 - z0 - L, 'rail-z', `Balok lantai ${i + 1}`, pt);
        line(`kasau-${i}`, [x, yTb, z0 + L / 2], [x, yTf, z1 - L / 2], 'rail-z', `Kasau atap ${i + 1}`, pt);
      });
      const slopeY = (z: number) => yTb + ((yTf - yTb) * (z - z0)) / (z1 - z0);
      for (let i = 0; i < nb; i++) {
        const xa = xs[i] + L / 2;
        const len = xs[i + 1] - xs[i] - L;
        add(`lantai-belakang-${i + 1}`, 'x', xa, yF, z0, len, 'rail-x', `Rangka lantai belakang ${i + 1}`, pt);
        add(`lantai-depan-${i + 1}`, 'x', xa, yF, z1, len, 'rail-x', `Rangka lantai depan ${i + 1}`, pt);
        add(`atas-belakang-${i + 1}`, 'x', xa, yTb, z0, len, 'rail-x', `Rangka atas belakang ${i + 1}`, pt);
        add(`atas-depan-${i + 1}`, 'x', xa, yTf, z1, len, 'rail-x', `Rangka atas depan ${i + 1}`, pt);
        const y0 = yF + L / 2;
        face(`b${i + 1}-depan`, `Jeruji depan ${i + 1}`, 'Pintu kandang', FRONT(z1), xa, xa + len, y0, yTf - L / 2, i === 0 ? nDoor : 0, 70, `tiang-${i}-1`);
        bars(`b${i + 1}-belakang`, `Jeruji belakang ${i + 1}`, BACK(z0), xa, xa + len, y0, yTb - L / 2);
        spreadIn(xa, xa + len).forEach((x, k) => line(`atap-${i + 1}-${k + 1}`, [x, yTb, z0 + L / 2], [x, yTf, z1 - L / 2], 'custom', `Jeruji atap ${i + 1}.${k + 1}`, bt));
        line(`silang-belakang-${i + 1}`, [xa, 8, z0], [xa + len, yF - L / 2 - 1, z0], 'custom', `Penguat miring kolong ${i + 1}`, rl);
      }
      floor('lantai', 'Lantai kandang', xs[0] + L / 2, xs[nb] - L / 2, z0 + L / 2, z1 - L / 2, yF + L / 2, lantai, undefined, xs.slice(1, -1));
      [xs[0], xs[nb]].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        barsTop(`samping-${nm}`, `Jeruji samping ${nm}`, i ? RIGHT(x) : LEFT(x), z0 + L / 2, z1 - L / 2, yF + L / 2, (z) => slopeY(z) - L * 0.7);
        line(`silang-${nm}-1`, [x, 8, z0 + L / 2], [x, yF - L / 2 - 1, z1 - L / 2], 'custom', `Silang kolong ${nm} 1`, rl);
        line(`silang-${nm}-2`, [x, 8, z1 - L / 2], [x, yF - L / 2 - 1, z0 + L / 2], 'custom', `Silang kolong ${nm} 2`, rl);
      });
      if (atapPapan) {
        boards.push(slopeBoard('atap-papan', 'Atap (papan / seng)', -10, W + 10, yTb, z0, yTf, z1, L / 2, b, 15));
        outH = H + b;
      }
      if (bool(p, 'tangga')) {
        const run = kol * 1.6;
        const tx0 = xs[0] + L / 2 + 2;
        const tx1 = tx0 + Math.min(45, (xs[1] - xs[0]) * 0.4);
        const zs0 = z1 + L / 2 + 1;
        [tx0 + 2, tx1 - 2].forEach((x, j) => line(`tangga-ibu-${j}`, [x, yF, zs0], [x, 1, zs0 + run], 'custom', `Ibu tangga ${j ? 'kanan' : 'kiri'}`, rl));
        if (b > 0) boards.push(slopeBoard('tangga-papan', 'Papan tangga naik', tx0, tx1, yF, zs0, 1, zs0 + run, 1, b));
        outD = D + run + L;
      }
    } else if (m === 'koloni') {
      // Deret sel bersekat, tiang berplat dibaut lantai, jeruji kepala miring + palung pakan di depan
      const ns = clampI(num(p, 'sel', 3), 1, 6);
      const xs = Array.from({ length: ns + 1 }, (_, i) => L / 2 + ((W - L) * i) / ns);
      const z0 = L / 2;
      const z1 = D - L / 2;
      const rise = Math.max(15, D * 0.18);
      const yTf = H - L / 2;
      const yTb = yTf - rise;
      const yB = 12;
      const plat = 0.6;
      const yAt = (z: number) => yTb + ((yTf - yTb) * (z - z0)) / (z1 - z0);
      xs.forEach((x, i) => {
        [z0, z1].forEach((z, j) => {
          boards.push({ ...board(`plat-${i}-${j}`, `Plat kaki tiang ${i + 1} ${j ? 'depan' : 'belakang'}`, x - 7, x + 7, 0, plat, z - 7, z + 7), steelMm: 6 });
          add(`tiang-${i}-${j}`, 'y', x, plat, z, (j ? yTf : yTb) + L / 2 - plat, 'post', `Tiang ${i + 1} ${j ? 'depan' : 'belakang'}`, pt);
        });
        add(`sekat-bawah-${i}`, 'z', x, yB, z0 + L / 2, z1 - z0 - L, 'rail-z', i === 0 || i === ns ? `Rangka bawah ujung ${i ? 'kanan' : 'kiri'}` : `Rangka bawah sekat ${i}`, pt);
        line(`kasau-${i}`, [x, yTb, z0 + L / 2], [x, yTf, z1 - L / 2], 'rail-z', `Kasau atap ${i + 1}`, pt);
        const f = i === ns ? RIGHT(x) : LEFT(x);
        barsTop(`sekat-${i}`, i === 0 || i === ns ? `Jeruji ujung ${i ? 'kanan' : 'kiri'}` : `Jeruji sekat ${i}`, f, z0 + L / 2, z1 - L / 2, yB + L / 2, (z) => yAt(z) - L * 0.7);
        add(`siku-palung-${i}`, 'z', x, 36, z1 + L / 2, 32, 'custom', `Siku palung ${i + 1}`, rl);
      });
      const yN0 = 50;
      const yN1 = Math.min(105, yTf - 25);
      for (let i = 0; i < ns; i++) {
        const xa = xs[i] + L / 2;
        const xb = xs[i + 1] - L / 2;
        const len = xb - xa;
        add(`bawah-belakang-${i + 1}`, 'x', xa, yB, z0, len, 'rail-x', `Rangka bawah belakang sel ${i + 1}`, pt);
        add(`bawah-depan-${i + 1}`, 'x', xa, yB, z1, len, 'rail-x', `Rangka bawah depan sel ${i + 1}`, pt);
        add(`atas-belakang-${i + 1}`, 'x', xa, yTb, z0, len, 'rail-x', `Rangka atas belakang sel ${i + 1}`, pt);
        add(`atas-depan-${i + 1}`, 'x', xa, yTf, z1, len, 'rail-x', `Rangka atas depan sel ${i + 1}`, pt);
        bars(`belakang-${i + 1}`, `Jeruji belakang sel ${i + 1}`, BACK(z0), xa, xb, yB + L / 2, yTb - L / 2);
        const dw = Math.min(55, len * 0.4);
        const fF = FRONT(z1);
        const aK = door(`pintu-${i + 1}`, `Pintu sel ${i + 1}`, fF, xa, dw, yB + L / 2, yTf - L / 2, `tiang-${i}-1`);
        add(`leher-bawah-${i + 1}`, 'x', aK, yN0, z1, xb - aK, 'rail-x', `Palang leher bawah sel ${i + 1}`, rl);
        add(`leher-atas-${i + 1}`, 'x', aK, yN1, z1, xb - aK, 'rail-x', `Palang leher atas sel ${i + 1}`, rl);
        bars(`depan-bawah-${i + 1}`, `Jeruji depan bawah sel ${i + 1}`, fF, aK, xb, yB + L / 2, yN0 - 1);
        spreadIn(aK, xb - 8, pitch * 1.3).forEach((x, k) => line(`leher-${i + 1}-${k + 1}`, [x, yN0 + 1, z1], [x + 8, yN1 - 1, z1], 'custom', `Jeruji kepala miring sel ${i + 1}.${k + 1}`, bt));
        bars(`depan-atas-${i + 1}`, `Jeruji depan atas sel ${i + 1}`, fF, aK, xb, yN1 + 1, yTf - L / 2);
        spreadIn(xa, xb).forEach((x, k) => line(`atap-${i + 1}-${k + 1}`, [x, yTb, z0 + L / 2], [x, yTf, z1 - L / 2], 'custom', `Jeruji atap sel ${i + 1}.${k + 1}`, bt));
      }
      if (b > 0) {
        const zp0 = z1 + L / 2 + 1;
        boards.push(board('palung', 'Palung pakan (dasar)', 0, W, 37, 37 + b, zp0, zp0 + 30));
        boards.push(board('palung-bibir', 'Palung pakan (bibir depan)', 0, W, 37 + b, 37 + b + 12, zp0 + 30 - b, zp0 + 30));
      }
      if (atapPapan) {
        boards.push(slopeBoard('atap-papan', 'Atap (papan / seng)', -10, W + 10, yTb, z0, yTf, z1, L / 2, b, 15));
        outH = H + b;
      }
      outD = D + L / 2 + 33;
    } else if (m === 'anjing') {
      // 4 panel dinding berbingkai sendiri (tiang ganda di sudut), atap panel, kaki pendek, baki tarik
      const kol = Math.max(num(p, 'kolong', 25), c + L + 8);
      const yF = kol;
      const yW = H - 1.5 * L;
      const yR = H - L / 2;
      const y0 = yF + L / 2;
      const y1 = yW - L / 2;
      // panel kiri & kanan (berdiri di kaki)
      [L / 2, W - L / 2].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        [L / 2, D - L / 2].forEach((z, j) => {
          add(`panel-${nm}-tiang-${j}`, 'y', x, yF - L / 2, z, H - L - (yF - L / 2), 'post', `Panel ${nm}: tiang ${j ? 'depan' : 'belakang'}`, pt);
          add(`kaki-${i}-${j}`, 'y', x, c, z, yF - L / 2 - c, 'post', `Kaki ${nm} ${j ? 'depan' : 'belakang'}`, pt);
        });
        add(`panel-${nm}-bawah`, 'z', x, yF, L, D - 2 * L, 'rail-z', `Panel ${nm}: rangka bawah`, pt);
        add(`panel-${nm}-atas`, 'z', x, yW, L, D - 2 * L, 'rail-z', `Panel ${nm}: rangka atas`, pt);
        bars(`panel-${nm}`, `Panel ${nm}: jeruji`, i ? RIGHT(x) : LEFT(x), L, D - L, y0, y1);
      });
      // panel depan & belakang (di antara panel samping)
      [D - L / 2, L / 2].forEach((z, j) => {
        const nm = j ? 'belakang' : 'depan';
        [1.5 * L, W - 1.5 * L].forEach((x, i) => add(`panel-${nm}-tiang-${i}`, 'y', x, yF - L / 2, z, H - L - (yF - L / 2), 'post', `Panel ${nm}: tiang ${i ? 'kanan' : 'kiri'}`, pt));
        add(`panel-${nm}-bawah`, 'x', 2 * L, yF, z, W - 4 * L, 'rail-x', `Panel ${nm}: rangka bawah`, pt);
        add(`panel-${nm}-atas`, 'x', 2 * L, yW, z, W - 4 * L, 'rail-x', `Panel ${nm}: rangka atas`, pt);
        if (j) bars(`panel-${nm}`, `Panel ${nm}: jeruji`, BACK(z), 2 * L, W - 2 * L, y0, y1);
        else face(`panel-${nm}`, `Panel ${nm}: jeruji`, 'Pintu', FRONT(z), 2 * L, W - 2 * L, y0, y1, nDoor, 50, `panel-${nm}-tiang-0`);
      });
      // panel atap menumpang di atas keempat panel dinding
      add('atap-belakang', 'x', 0, yR, L / 2, W, 'rail-x', 'Panel atap: rangka belakang', pt);
      add('atap-depan', 'x', 0, yR, D - L / 2, W, 'rail-x', 'Panel atap: rangka depan', pt);
      add('atap-kiri', 'z', L / 2, yR, L, D - 2 * L, 'rail-z', 'Panel atap: rangka kiri', pt);
      add('atap-kanan', 'z', W - L / 2, yR, L, D - 2 * L, 'rail-z', 'Panel atap: rangka kanan', pt);
      outH = H + roof('atap', L, W - L, L, D - L, yR, L);
      floor('lantai', 'Lantai kandang', L, W - L, L, D - L, yF + L / 2, lantai);
      if (baki) {
        const yk = (c + yF - L / 2) / 2;
        [L / 2, W - L / 2].forEach((x, i) => add(`baki-rel-${i}`, 'z', x, yk, L, D - 2 * L, 'rail-z', `Rel baki ${i ? 'kanan' : 'kiri'}`, rl));
        boards.push({ ...board('baki-plat', 'Baki kotoran (plat, bisa ditarik)', L / 2, W - L / 2, yk + 1, yk + 1.2, L, D - L), steelMm: 1 });
      }
      if (roda) casters = casterSet([L / 2, W - L / 2], [L / 2, D - L / 2], inch, bool(p, 'remRoda'));
    } else {
      // walkin: panel modul berdiri (tiang ganda di tiap sambungan), satu panel pintu orang, atap rangka
      const yb = 8;
      const yW = H - 1.5 * L;
      const yR = H - L / 2;
      const yM = H * 0.5;
      const panelRow = (id: string, nm: string, f: Face, a0: number, a1: number, np: number, doorIdx: number) => {
        const edges = Array.from({ length: np + 1 }, (_, k) => a0 + ((a1 - a0) * k) / np);
        for (let k = 0; k < np; k++) {
          const pa = edges[k];
          const pb2 = edges[k + 1];
          const pid = `${id}-${k + 1}`;
          const pn = `${nm} ${k + 1}`;
          vAt(`${pid}-tiang-a`, f, pa + L / 2, 0, H - L, `${pn}: tiang`, pt);
          vAt(`${pid}-tiang-b`, f, pb2 - L / 2, 0, H - L, `${pn}: tiang`, pt);
          hAt(`${pid}-bawah`, f, pa + L, yb, pb2 - pa - 2 * L, `${pn}: rangka bawah`, pt);
          hAt(`${pid}-atas`, f, pa + L, yW, pb2 - pa - 2 * L, `${pn}: rangka atas`, pt);
          if (k === doorIdx) face(`${pid}`, `${pn}: jeruji`, 'Pintu orang', f, pa + L, pb2 - L, yb + L / 2, yW - L / 2, 1, 80, `${pid}-tiang-a`);
          else {
            hAt(`${pid}-tengah`, f, pa + L, yM, pb2 - pa - 2 * L, `${pn}: rangka tengah`, rl);
            bars(`${pid}`, `${pn}: jeruji`, f, pa + L, pb2 - L, yb + L / 2, yW - L / 2);
          }
        }
        return edges;
      };
      const npx = Math.max(1, Math.round((W - 2 * L) / 100));
      const npz = Math.max(1, Math.round(D / 100));
      const ex = panelRow('depan', 'Panel depan', FRONT(D - L / 2), L, W - L, npx, Math.floor((npx - 1) / 2));
      panelRow('belakang', 'Panel belakang', BACK(L / 2), L, W - L, npx, -1);
      panelRow('kiri', 'Panel kiri', LEFT(L / 2), 0, D, npz, -1);
      panelRow('kanan', 'Panel kanan', RIGHT(W - L / 2), 0, D, npz, -1);
      add('atap-belakang', 'x', 0, yR, L / 2, W, 'rail-x', 'Rangka atap belakang', pt);
      add('atap-depan', 'x', 0, yR, D - L / 2, W, 'rail-x', 'Rangka atap depan', pt);
      const beams = [L / 2, ...ex.slice(1, -1), W - L / 2];
      beams.forEach((x, k) => add(`atap-balok-${k}`, 'z', x, yR, L, D - 2 * L, 'rail-z', k === 0 || k === beams.length - 1 ? `Rangka atap ${k ? 'kanan' : 'kiri'}` : `Balok atap ${k}`, pt));
      for (let k = 0; k < beams.length - 1; k++)
        spreadIn(beams[k] + L / 2, beams[k + 1] - L / 2).forEach((x, q) => add(`atap-jeruji-${k + 1}-${q + 1}`, 'z', x, yR, L, D - 2 * L, 'custom', `Jeruji atap ${k + 1}.${q + 1}`, bt));
      if (atapPapan) {
        boards.push(board('atap-papan', 'Papan atap teduh (setengah belakang)', 0, W, yR + L / 2, yR + L / 2 + b, 0, D * 0.5));
        outH = H + b;
      }
    }

    return { members: list, boards, casters, W: outW, D: outD, H: outH, boardThick: 0, hinges: hinges.length ? hinges : undefined, wall };
  },

  checks: (p, bd) => {
    const out: ProductCheck[] = [];
    const m = model(p);
    const W = num(p, 'panjang');
    const D = num(p, 'dalam');
    const H = num(p, 'tinggi');
    const kol = num(p, 'kolong');
    const pipa = str(p, 'pipa', '20');
    const jer = str(p, 'jeruji', '2.5');
    const n = clampI(num(p, 'tingkat', 1), 1, 4);
    const ns = clampI(num(p, 'sel', 1), 1, 6);
    if (KECIL_MODELS.includes(m) && jer === '8')
      out.push({ level: 'warn', message: 'Jeruji 8 cm terlalu renggang: kucing, kelinci, atau burung bisa lolos.', fix: { label: 'Jeruji 2,5 cm', params: { jeruji: '2.5' } } });
    if (m === 'tingkat') {
      if (tierTingkat(p) < 32)
        out.push({ level: 'warn', message: 'Ruang tiap tingkat terlalu pendek, kucing tidak bisa berdiri.', fix: n > 1 ? { label: `${n - 1} tingkat`, params: { tingkat: n - 1 } } : { label: 'Tinggi 80 cm', params: { tinggi: 80 } } });
      if (bool(p, 'roda') && H > 3.2 * Math.min(W, D))
        out.push({ level: 'warn', message: 'Kandang beroda setinggi ini dengan alas sempit mudah terguling saat didorong.', fix: { label: `Kedalaman ${Math.min(250, Math.ceil(H / 3.2))} cm`, params: { dalam: Math.min(250, Math.ceil(H / 3.2)) } } });
    }
    if (m === 'panggung' && H - kol - Math.max(8, D * 0.25) < 35)
      out.push({ level: 'warn', message: 'Ruang di atas lantai kandang terlalu pendek untuk kelinci.', fix: { label: `Tinggi ${Math.min(250, Math.ceil(kol + 45 + D * 0.25))} cm`, params: { tinggi: Math.min(250, Math.ceil(kol + 45 + D * 0.25)) } } });
    if (m === 'pojok') {
      if ((H - 6) / n < 32) out.push({ level: 'warn', message: 'Ruang tiap tingkat terlalu pendek.', fix: n > 1 ? { label: `${n - 1} tingkat`, params: { tingkat: n - 1 } } : { label: 'Tinggi 60 cm', params: { tinggi: 60 } } });
      if (Math.max(W, D) > 140) out.push({ level: 'warn', message: 'Sisi pojok lebih dari 1,4 m: muka diagonal jadi panjang dan goyang.', fix: { label: 'Sisi 120 cm', params: { panjang: 120, dalam: 120 } } });
      out.push({ level: 'info', message: 'Tiang pojok & kedua ujung tembok dibaut ke dinding supaya tidak bergeser.' });
    }
    if (m === 'baterai') {
      if (cellBaterai(p) < 25) out.push({ level: 'warn', message: 'Tinggi sel terlalu pendek untuk ayam.', fix: n > 1 ? { label: `${n - 1} tingkat`, params: { tingkat: n - 1 } } : { label: 'Tinggi 120 cm', params: { tinggi: 120 } } });
      if (W / ns < 25) out.push({ level: 'warn', message: 'Sel terlalu sempit, ayam berdesakan.', fix: { label: `${Math.max(1, Math.floor(W / 35))} sel`, params: { sel: Math.max(1, Math.floor(W / 35)) } } });
      if (W > 240) out.push({ level: 'warn', message: 'Kaki A hanya di kedua ujung: baris lebih dari 2,4 m melendut di tengah.', fix: { label: 'Panjang 240 cm', params: { panjang: 240 } } });
      out.push({ level: 'info', message: `Muat ±${ns * n * 2 * Math.max(1, Math.floor((W / ns) / 20))} ekor ayam petelur (1–2 ekor per sel). Kotoran jatuh ke tanah, tidak menimpa sel di bawahnya.` });
    }
    if (m === 'ark' && H > D * 1.2)
      out.push({ level: 'warn', message: 'Rangka A terlalu runcing: ruang bawah sempit dan mudah terguling ke samping.', fix: { label: `Lebar ${Math.min(250, Math.ceil(H / 1.1))} cm`, params: { dalam: Math.min(250, Math.ceil(H / 1.1)) } } });
    if (m === 'tembok') {
      if (D > 60) out.push({ level: 'warn', message: 'Kandang tembok lebih dari 60 cm menjorok membuat siku dan baut tembok menanggung beban besar.', fix: { label: 'Kedalaman 55 cm', params: { dalam: 55 } } });
      if (H - kol < 40) out.push({ level: 'warn', message: 'Ruang kandang terlalu pendek.', fix: { label: `Tinggi ${Math.min(250, kol + 50)} cm`, params: { tinggi: Math.min(250, kol + 50) } } });
      out.push({ level: 'info', message: 'Tiang tembok dibaut ke bata / beton dengan fischer, minimal 3 titik tiap tiang.' });
    }
    if (m === 'gantung') {
      if (W * D * H > 400000) out.push({ level: 'warn', message: 'Sangkar sebesar ini terlalu berat untuk digantung satu batang.', fix: { label: '60 × 45 × 70 cm', params: { panjang: 60, dalam: 45, tinggi: 70 } } });
      if (num(p, 'tali') > 80) out.push({ level: 'warn', message: 'Batang gantung panjang membuat sangkar berayun.', fix: { label: 'Batang 50 cm', params: { tali: 50 } } });
      out.push({ level: 'info', message: 'Plat plafon dibaut ke balok / cor, jangan ke gypsum.' });
    }
    if (m === 'tiang') {
      const B = baseTiang(W, D);
      if (H > 2.8 * B) out.push({ level: 'warn', message: 'Tiang terlalu tinggi dibanding kaki silang: sangkar mudah terguling.', fix: { label: `Kolong ${Math.max(10, Math.floor(kol - (H - 2.8 * B)))} cm`, params: { kolong: Math.max(10, Math.floor(kol - (H - 2.8 * B))) } } });
      if (H - kol < 40) out.push({ level: 'warn', message: 'Ruang sangkar terlalu pendek.', fix: { label: `Kolong ${Math.max(10, H - 60)} cm`, params: { kolong: Math.max(10, H - 60) } } });
    }
    if (m === 'ternak-panggung') {
      if (kol > 120) out.push({ level: 'warn', message: 'Kolong lebih dari 1,2 m menyulitkan kambing naik dan membuat kandang goyang.', fix: { label: 'Kolong 90 cm', params: { kolong: 90 } } });
      if (H - kol - Math.max(15, D * 0.18) < 100) out.push({ level: 'warn', message: 'Ruang di atas lantai terlalu pendek untuk kambing dewasa.', fix: { label: `Tinggi ${Math.min(250, Math.ceil(kol + 110 + Math.max(15, D * 0.18)))} cm`, params: { tinggi: Math.min(250, Math.ceil(kol + 110 + Math.max(15, D * 0.18))) } } });
      out.push({ level: 'info', message: `Luas lantai ±${r1((W * D) / 10000)} m², cukup untuk ±${Math.max(1, Math.floor((W * D) / 12000))} ekor kambing dewasa (1–1,5 m² per ekor).` });
    }
    if (m === 'koloni') {
      if (W / ns < 80) out.push({ level: 'warn', message: 'Sel lebih sempit dari 80 cm, kambing sulit berbalik.', fix: { label: `${Math.max(1, Math.floor(W / 100))} sel`, params: { sel: Math.max(1, Math.floor(W / 100)) } } });
      if (H < 150) out.push({ level: 'warn', message: 'Kandang terlalu pendek, kambing bisa melompat ke jeruji kepala.', fix: { label: 'Tinggi 180 cm', params: { tinggi: 180 } } });
      out.push({ level: 'info', message: 'Plat kaki tiap tiang dibaut ke lantai cor dengan dynabolt.' });
    }
    if (m === 'anjing') {
      if (pipa === '20' && W > 110) out.push({ level: 'warn', message: 'Panel lebih dari 110 cm dengan pipa 20×20 mudah penyok didorong anjing besar.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
      if (H - kol < 45) out.push({ level: 'warn', message: 'Ruang kandang terlalu pendek, anjing tidak bisa berdiri.', fix: { label: `Tinggi ${Math.min(250, kol + 60)} cm`, params: { tinggi: Math.min(250, kol + 60) } } });
      out.push({ level: 'info', message: 'Panel disambung baut M8 di tiap tiang ganda, bisa dibongkar untuk dipindah.' });
    }
    if (m === 'walkin' && H < 165)
      out.push({ level: 'warn', message: 'Pintu orang kurang tinggi, harus membungkuk saat masuk.', fix: { label: 'Tinggi 180 cm', params: { tinggi: 180 } } });
    if (BESAR_MODELS.includes(m) && pipa === '20')
      out.push({ level: 'warn', message: 'Pipa 20×20 terlalu ramping untuk kandang ternak / walk-in yang didorong hewan besar.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
    if (BESAR_MODELS.includes(m) && jer === '2.5') out.push({ level: 'info', message: 'Jeruji 2,5 cm di kandang besar sangat berat dan mahal; 5–8 cm biasanya cukup.' });
    if (str(p, 'lantai') === 'kawat' && jer === '8' && LANTAI_MODELS.includes(m))
      out.push({ level: 'info', message: 'Lantai jeruji 8 cm terlalu renggang untuk kaki hewan kecil; pakai papan bilah atau jeruji lebih rapat.' });
    const doorCount = (bd.hinges || []).length;
    if (doorCount) out.push({ level: 'info', message: `${doorCount} pintu berengsel; pasang grendel / kunci gerendel di sisi kusen.` });
    if (['ark', 'koloni', 'walkin', 'ternak-panggung'].includes(m) || (m === 'tembok' && str(p, 'atap') !== 'papan'))
      out.push({ level: 'info', message: 'Untuk luar ruang pakai cat dasar anti karat atau galvanis.' });
    return out;
  },
};
