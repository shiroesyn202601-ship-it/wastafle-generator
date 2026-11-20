import { Board, Params, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, board, materialParams, memberFactory, num, r1, str } from './common';
import { FrameMember } from '../types/kitchen';
import { angledFrame, cutAxisIndex, memberFromPoints } from '../utils/frameLayout';

/**
 * Gantungan berdiri (standing hanger / hall tree): mantel, tas, topi, helm. Berbasis KAIT / PASAK, tanpa rel
 * pipa gantungan baju (rel hanger = rak-baju). Bentuk rangka (param `model`):
 * - plat: satu tiang tegak di atas plat besi bundar, kait di pucuk
 * - tripod: tiga kaki miring bertemu di atas, kepala pendek berkait, cincin segitiga penguat
 * - pohon: tiang tengah di atas 4 kaki miring (bintang), cabang miring naik di beberapa tingkat
 * - helm: tiang tengah di atas 3 kaki datar (Y), pasak mendatar bertingkat + dudukan bundar di pucuk
 * - payung: tiang di sisi belakang kotak wadah payung (2 cincin + plat tetes), kait menghadap depan
 * - plafon: tiang dijepit lantai–plafon (plat di kedua ujung), kait bertingkat
 * - panel: dua tiang di kaki melintang, papan punggung tegak, deret palang berkait, ambalan topi
 * - kisi: dua tiang di kaki melintang, kisi palang & jeruji tanpa papan, kait di dua muka
 * - sudut: tiga tiang membentuk siku L di pojok ruangan, dua sayap palang berkait, ambalan pojok
 * - menara: menara 4 tiang ramping, cincin palang bertingkat dengan kait di keempat muka
 * - dinding: bingkai dibaut tembok di depan papan punggung, deret palang berkait, ambalan atas
 * - pasak: jeruji tegak dibaut tembok, pasak panjang mendatar bertingkat (helm / topi / tas), tanpa papan
 * - tangga: dua ibu tangga bersandar miring ke tembok, anak tangga berkait, papan di pucuk
 * - kantilever: tiang dari lantai menempel tembok, lengan menjulur menyebar ke depan di beberapa tingkat
 */
const MODELS = [
  { value: 'plat', label: 'Tiang plat bundar', desc: 'Satu tiang di plat besi, kait di pucuk' },
  { value: 'tripod', label: 'Tripod', desc: 'Tiga kaki miring bertemu di atas' },
  { value: 'pohon', label: 'Pohon bercabang', desc: 'Kaki bintang miring, cabang naik' },
  { value: 'helm', label: 'Tiang pasak helm', desc: 'Kaki Y datar, pasak mendatar bertingkat' },
  { value: 'payung', label: 'Tiang + wadah payung', desc: 'Kotak payung di bawah, kait di atas' },
  { value: 'plafon', label: 'Tiang jepit plafon', desc: 'Dijepit lantai sampai plafon' },
  { value: 'panel', label: 'Panel kait (hall tree)', desc: 'Papan punggung, palang kait, ambalan topi' },
  { value: 'kisi', label: 'Kisi kait dua muka', desc: 'Kisi tanpa papan, kait depan & belakang' },
  { value: 'sudut', label: 'Siku pojok', desc: 'Tiga tiang L di pojok ruangan' },
  { value: 'menara', label: 'Menara 4 muka', desc: 'Kait di keempat sisi menara' },
  { value: 'dinding', label: 'Panel tempel dinding', desc: 'Bingkai + papan punggung dibaut tembok' },
  { value: 'pasak', label: 'Pasak dinding', desc: 'Pasak panjang di jeruji tembok' },
  { value: 'tangga', label: 'Tangga bersandar', desc: 'Ibu tangga miring ke tembok, anak tangga berkait' },
  { value: 'kantilever', label: 'Tiang tembok lengan', desc: 'Lengan menyebar dari tiang tembok' },
];
const MODEL_IDS = MODELS.map((m) => m.value);
const model = (p: Params) => {
  const m = str(p, 'model', 'plat');
  return MODEL_IDS.includes(m) ? m : 'plat';
};
const isM = (p: Params, ...m: string[]) => m.includes(model(p));
const POLE = ['plat', 'tripod', 'pohon', 'helm', 'payung'];
const WITH_LEBAR = ['panel', 'kisi', 'sudut', 'dinding', 'pasak', 'tangga'];
const WITH_ALAS = [...POLE, 'menara'];
const WITH_DALAM = ['panel', 'kisi', 'sudut', 'pasak', 'tangga', 'kantilever'];
const WITH_AMBALAN = ['panel', 'sudut', 'menara', 'dinding', 'tangga', 'helm'];
const deg = (d: number) => (d * Math.PI) / 180;
type V3 = [number, number, number];

/** Volume batang (cm) seperti cara cek sambungan las: inside(p) dengan toleransi tol + titik sampel di permukaannya */
function memberSolid(m: FrameMember, tol: number) {
  const w = (m.tubeSize ?? 30) / 10;
  const h = m.tubeH ? m.tubeH / 10 : w;
  const samples: V3[] = [];
  if (!m.end) {
    const i = ['x', 'y', 'z'].indexOf(m.axis);
    const sec: V3 = m.axis === 'y' ? [w, w, h] : [w, h, w];
    const o: V3 = [m.x, m.y, m.z];
    const min = o.map((v, k) => v - sec[k] / 2) as V3;
    const max = o.map((v, k) => v + sec[k] / 2) as V3;
    min[i] = o[i];
    max[i] = o[i] + m.length;
    const n = [0, 1, 2].map((k) => Math.max(2, Math.ceil(max[k] - min[k])));
    for (let a = 0; a <= n[0]; a++)
      for (let b = 0; b <= n[1]; b++)
        for (let c = 0; c <= n[2]; c++)
          if (a === 0 || a === n[0] || b === 0 || b === n[1] || c === 0 || c === n[2])
            samples.push([min[0] + ((max[0] - min[0]) * a) / n[0], min[1] + ((max[1] - min[1]) * b) / n[1], min[2] + ((max[2] - min[2]) * c) / n[2]]);
    return { samples, inside: (p: V3) => p.every((v, k) => v > min[k] + tol && v < max[k] - tol) };
  }
  const f = angledFrame(m, w, h);
  const di = cutAxisIndex(m);
  const un = f.u[di] || 1e-6;
  const e0 = f.c[di] - (f.u[di] * f.len) / 2;
  const e1 = f.c[di] + (f.u[di] * f.len) / 2;
  const lo = Math.min(e0, e1);
  const hi = Math.max(e0, e1);
  const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const n = Math.max(2, Math.ceil(f.len));
  for (const [j, k] of [[-1, -1], [-1, 1], [1, -1], [1, 1], [0, -1], [0, 1], [-1, 0], [1, 0]]) {
    const off = [0, 1, 2].map((q) => (f.wd[q] * j * f.a) / 2 + (f.hd[q] * k * f.b) / 2);
    const t0 = -off[di] / un;
    for (let i = 0; i <= n; i++) {
      const tq = -f.len / 2 + (f.len * i) / n + t0;
      samples.push([0, 1, 2].map((q) => f.c[q] + f.u[q] * tq + off[q]) as V3);
    }
  }
  const inside = (p: V3) => {
    const d: V3 = [p[0] - f.c[0], p[1] - f.c[1], p[2] - f.c[2]];
    return p[di] > lo + tol && p[di] < hi - tol && Math.abs(dot(d, f.wd)) < f.a / 2 - tol && Math.abs(dot(d, f.hd)) < f.b / 2 - tol;
  };
  return { samples, inside };
}
const overlaps = (a: FrameMember, b: FrameMember, tol = 0.15) => {
  const A = memberSolid(a, tol);
  const B = memberSolid(b, tol);
  return A.samples.some(B.inside) || B.samples.some(A.inside);
};
/**
 * Palang di antara dua batang miring (titik as P di batang a, Q di batang b): kedua ujung dipotong mundur
 * sampai menempel rata di sisi batang (tidak masuk ke dalamnya). Hasil: titik as ujung palang yang baru.
 */
function fitBetween(P: V3, Q: V3, a: FrameMember, b: FrameMember, tube: [number, number]): [V3, V3] {
  const len = Math.hypot(Q[0] - P[0], Q[1] - P[1], Q[2] - P[2]);
  const v = [0, 1, 2].map((k) => (Q[k] - P[k]) / len);
  const pt = (s: number) => [0, 1, 2].map((k) => P[k] + v[k] * s) as V3;
  const bar = (s0: number, s1: number) => memberFromPoints({ id: 'fit', role: 'custom', label: '', tubeSize: tube[0], tubeH: tube[1] !== tube[0] ? tube[1] : undefined }, pt(s0), pt(s1));
  const search = (hit: (s: number) => boolean) => {
    let lo = 0;
    let hi = len / 2 - 1;
    if (!hit(lo)) return lo;
    for (let it = 0; it < 18; it++) {
      const mid = (lo + hi) / 2;
      if (hit(mid)) lo = mid;
      else hi = mid;
    }
    return hi;
  };
  const s0 = search((s) => overlaps(bar(s, len / 2), a));
  const s1 = len - search((s) => overlaps(bar(len / 2, len - s), b));
  return [pt(s0), pt(s1)];
}

export const GANTUNGAN_BERDIRI: ProductDef = {
  id: 'gantungan-berdiri',
  name: 'Gantungan berdiri',
  tagline: 'mantel · tas · topi · helm',
  icon: 'M30 6v28M22 34h16M30 9l-7 5M30 9l7 5M30 18l-6 4M30 18l6 4M22 14v-3M38 14v-3',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['model', 'tinggi', 'lebar', 'alas', 'dalam', 'tinggiPanel'] },
    { id: 'bentuk', title: 'Kait', keys: ['kait', 'baris', 'ambalan'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Selesai', keys: [] },
  ],
  params: [
    { key: 'model', label: 'Bentuk rangka', type: 'choice', options: MODELS },
    {
      key: 'tinggi',
      label: 'Tinggi',
      type: 'number',
      unit: 'cm',
      min: 120,
      max: 320,
      step: 1,
      help: 'Tinggi gantungan dari lantai. Jepit plafon: tinggi plafon. Tempel dinding: tinggi sisi atas panel.',
      marks: [
        { value: 130, label: 'anak' },
        { value: 175, label: 'dewasa' },
        { value: 280, label: 'plafon' },
      ],
    },
    {
      key: 'lebar',
      label: 'Lebar panel',
      type: 'number',
      unit: 'cm',
      min: 30,
      max: 200,
      step: 1,
      help: 'Lebar bidang kait. Siku pojok: panjang sayap yang menempel tembok belakang.',
      marks: [
        { value: 60, label: 'sempit' },
        { value: 80, label: 'umum' },
        { value: 120, label: 'keluarga' },
      ],
      showIf: (p) => WITH_LEBAR.includes(String(p.model)),
    },
    {
      key: 'alas',
      label: 'Lebar alas / kaki',
      type: 'number',
      unit: 'cm',
      min: 30,
      max: 70,
      step: 1,
      help: 'Makin lebar alas makin tidak mudah terguling. Menara: lebar sisi menara.',
      marks: [
        { value: 40, label: 'umum' },
        { value: 55, label: 'stabil' },
      ],
      showIf: (p) => WITH_ALAS.includes(String(p.model)),
    },
    {
      key: 'dalam',
      label: 'Kedalaman',
      type: 'number',
      unit: 'cm',
      min: 15,
      max: 100,
      step: 1,
      help: 'Panel/kisi: panjang kaki melintang. Siku pojok: sayap samping. Pasak/lengan: panjang pasak. Tangga: jarak kaki dari tembok.',
      marks: [
        { value: 25, label: 'pasak helm' },
        { value: 45, label: 'kaki panel' },
      ],
      showIf: (p) => WITH_DALAM.includes(String(p.model)),
    },
    {
      key: 'tinggiPanel',
      label: 'Tinggi panel dinding',
      type: 'number',
      unit: 'cm',
      min: 30,
      max: 100,
      step: 1,
      help: 'Tinggi bidang yang dibaut ke tembok.',
      marks: [{ value: 50, label: 'umum' }],
      showIf: (p) => p.model === 'dinding' || p.model === 'pasak',
    },
    {
      key: 'kait',
      label: 'Kait per baris',
      type: 'number',
      unit: 'buah',
      min: 1,
      max: 12,
      step: 1,
      help: 'Tiang: kait di sekeliling tiang (maks 8). Panel: kait berjajar tiap ±12 cm.',
      marks: [
        { value: 4, label: 'umum' },
        { value: 8, label: 'banyak' },
      ],
      showIf: (p) => p.model !== 'pasak',
    },
    {
      key: 'baris',
      label: 'Jumlah baris / tingkat kait',
      type: 'number',
      unit: 'baris',
      min: 1,
      max: 4,
      step: 1,
      help: 'Baris bawah cocok untuk tas, payung kecil, atau anak-anak.',
    },
    {
      key: 'ambalan',
      label: 'Ambalan / papan atas',
      type: 'toggle',
      help: 'Papan di pucuk untuk topi, kunci, atau helm.',
      showIf: (p) => WITH_AMBALAN.includes(String(p.model)),
    },
    ...materialParams(true),
  ],
  defaults: {
    model: 'plat',
    tinggi: 175,
    lebar: 80,
    alas: 40,
    dalam: 45,
    tinggiPanel: 50,
    kait: 4,
    baris: 2,
    ambalan: true,
    pipa: '30',
    papan: 'kayu',
    warna: '#1f2226',
  },
  groups: [
    { id: 'tiang-tunggal', name: 'Tiang tunggal', desc: 'Satu tiang atau tripod dengan kait di pucuk, termasuk gantungan helm berdiri' },
    { id: 'hall-tree', name: 'Panel kait (hall tree)', desc: 'Panel tegak berkait dengan ambalan topi, kisi dua muka, siku pojok, menara' },
    { id: 'dinding-bersandar', name: 'Dinding & bersandar', desc: 'Panel kait dibaut tembok, pasak dinding, tangga bersandar, tiang tembok' },
  ],
  signature: (p) => `gantungan-berdiri:${model(p)}`,
  presets: [
    {
      id: 'tiang-plat',
      group: 'tiang-tunggal',
      name: 'Tiang plat bundar',
      desc: 'satu tiang tegak di atas plat besi bundar, kait menyebar di pucuk',
      params: { model: 'plat', tinggi: 175, alas: 40, kait: 4, baris: 2 },
      sizes: [
        { label: 'Standar', desc: 'tinggi 175, plat Ø40, 8 kait', params: { tinggi: 175, alas: 40, kait: 4, baris: 2 } },
        { label: 'Kantor / lobi', desc: 'tinggi 180, plat Ø45, 12 kait', params: { tinggi: 180, alas: 45, kait: 6, baris: 2 } },
        { label: 'Anak', desc: 'tinggi 130, plat Ø35, 4 kait', params: { tinggi: 130, alas: 35, kait: 4, baris: 1 } },
      ],
    },
    {
      id: 'tripod',
      group: 'tiang-tunggal',
      name: 'Gantungan tripod',
      desc: 'tiga kaki miring bertemu di atas, kepala pendek berkait, cincin segitiga penguat',
      params: { model: 'tripod', tinggi: 170, alas: 55, kait: 4, baris: 1 },
      sizes: [
        { label: 'Standar', desc: 'tinggi 170, kaki 55 cm', params: { tinggi: 170, alas: 55, kait: 4, baris: 1 } },
        { label: 'Tinggi', desc: 'tinggi 185, kaki 60 cm, 2 baris', params: { tinggi: 185, alas: 60, kait: 4, baris: 2 } },
        { label: 'Anak', desc: 'tinggi 130, kaki 45 cm', params: { tinggi: 130, alas: 45, kait: 3, baris: 1 } },
      ],
    },
    {
      id: 'pohon',
      group: 'tiang-tunggal',
      name: 'Gantungan pohon bercabang',
      desc: 'tiang tengah di atas 4 kaki miring, cabang miring naik di beberapa tingkat',
      params: { model: 'pohon', tinggi: 175, alas: 50, kait: 4, baris: 2 },
      sizes: [
        { label: 'Standar', desc: 'tinggi 175, 8 cabang', params: { tinggi: 175, alas: 50, kait: 4, baris: 2 } },
        { label: 'Keluarga', desc: 'tinggi 185, 18 cabang', params: { tinggi: 185, alas: 55, kait: 6, baris: 3 } },
        { label: 'Kamar anak', desc: 'tinggi 140, 6 cabang', params: { tinggi: 140, alas: 45, kait: 3, baris: 2 } },
      ],
    },
    {
      id: 'tiang-helm',
      group: 'tiang-tunggal',
      name: 'Tiang pasak helm',
      desc: 'tiang di atas 3 kaki datar bentuk Y, pasak mendatar bertingkat, dudukan bundar di pucuk',
      params: { model: 'helm', tinggi: 150, alas: 50, kait: 4, baris: 3, ambalan: true },
      sizes: [
        { label: 'Rumah', desc: '4 helm, tinggi 120', params: { tinggi: 120, alas: 45, kait: 2, baris: 2 } },
        { label: 'Kos / kantor', desc: '12 helm, tinggi 150', params: { tinggi: 150, alas: 50, kait: 4, baris: 3 } },
        { label: 'Parkiran / bengkel', desc: '16 helm, tinggi 170', params: { tinggi: 170, alas: 55, kait: 4, baris: 4 } },
      ],
    },
    {
      id: 'tiang-payung',
      group: 'tiang-tunggal',
      name: 'Tiang + wadah payung',
      desc: 'tiang di sisi belakang kotak wadah payung berplat tetes, kait menghadap depan',
      params: { model: 'payung', tinggi: 175, alas: 40, kait: 5, baris: 1 },
      sizes: [
        { label: 'Teras rumah', desc: 'tinggi 175, kotak 40 cm', params: { tinggi: 175, alas: 40, kait: 5, baris: 1 } },
        { label: 'Kantor / toko', desc: 'tinggi 180, kotak 45 cm, 2 baris', params: { tinggi: 180, alas: 45, kait: 5, baris: 2 } },
        { label: 'Ringkas', desc: 'tinggi 160, kotak 38 cm', params: { tinggi: 160, alas: 38, kait: 3, baris: 1 } },
      ],
    },
    {
      id: 'jepit-plafon',
      group: 'tiang-tunggal',
      name: 'Tiang jepit plafon',
      desc: 'tiang dijepit plat di lantai dan plafon, tanpa kaki, kait bertingkat',
      params: { model: 'plafon', tinggi: 280, kait: 4, baris: 2 },
      sizes: [
        { label: 'Plafon 260', desc: '8 kait', params: { tinggi: 260, kait: 4, baris: 2 } },
        { label: 'Plafon 280', desc: '12 kait', params: { tinggi: 280, kait: 4, baris: 3 } },
        { label: 'Plafon 300', desc: '12 kait rapat', params: { tinggi: 300, kait: 6, baris: 2 } },
      ],
    },
    {
      id: 'panel-kait',
      group: 'hall-tree',
      name: 'Panel kait hall tree',
      desc: 'dua tiang di kaki melintang, papan punggung tegak, palang berkait, ambalan topi',
      params: { model: 'panel', lebar: 80, dalam: 45, tinggi: 180, kait: 5, baris: 2, ambalan: true },
      sizes: [
        { label: 'Sempit', desc: '60 × 40 × 170 cm', params: { lebar: 60, dalam: 40, tinggi: 170, kait: 4, baris: 2 } },
        { label: 'Umum', desc: '80 × 45 × 180 cm', params: { lebar: 80, dalam: 45, tinggi: 180, kait: 5, baris: 2 } },
        { label: 'Keluarga', desc: '100 × 45 × 185 cm', params: { lebar: 100, dalam: 45, tinggi: 185, kait: 7, baris: 2 } },
      ],
    },
    {
      id: 'kisi-dua-muka',
      group: 'hall-tree',
      name: 'Kisi kait dua muka',
      desc: 'dua tiang di kaki melintang, kisi palang dan jeruji tanpa papan, kait di depan dan belakang',
      params: { model: 'kisi', lebar: 90, dalam: 45, tinggi: 170, kait: 6, baris: 3 },
      sizes: [
        { label: 'Toko topi / tas', desc: '90 × 45 × 170 cm', params: { lebar: 90, dalam: 45, tinggi: 170, kait: 6, baris: 3 } },
        { label: 'Kecil', desc: '60 × 40 × 150 cm', params: { lebar: 60, dalam: 40, tinggi: 150, kait: 4, baris: 3 } },
        { label: 'Lebar', desc: '120 × 50 × 180 cm', params: { lebar: 120, dalam: 50, tinggi: 180, kait: 8, baris: 4 } },
      ],
    },
    {
      id: 'siku-pojok',
      group: 'hall-tree',
      name: 'Gantungan siku pojok',
      desc: 'tiga tiang membentuk siku L di pojok ruangan, dua sayap palang berkait, ambalan pojok',
      params: { model: 'sudut', lebar: 70, dalam: 70, tinggi: 175, kait: 4, baris: 2, ambalan: true },
      sizes: [
        { label: 'Pojok kecil', desc: 'sayap 60 × 60, tinggi 170', params: { lebar: 60, dalam: 60, tinggi: 170, kait: 4 } },
        { label: 'Pojok umum', desc: 'sayap 80 × 80, tinggi 180', params: { lebar: 80, dalam: 80, tinggi: 180, kait: 5 } },
        { label: 'Sayap panjang', desc: 'sayap 100 × 60, tinggi 180', params: { lebar: 100, dalam: 60, tinggi: 180, kait: 6 } },
      ],
    },
    {
      id: 'menara-4-muka',
      group: 'hall-tree',
      name: 'Menara kait 4 muka',
      desc: 'menara 4 tiang ramping, cincin palang bertingkat dengan kait di keempat sisi',
      params: { model: 'menara', alas: 40, tinggi: 160, kait: 8, baris: 3, ambalan: true },
      sizes: [
        { label: 'Kecil', desc: 'sisi 35, tinggi 140', params: { alas: 35, tinggi: 140, kait: 4, baris: 2 } },
        { label: 'Umum', desc: 'sisi 40, tinggi 160', params: { alas: 40, tinggi: 160, kait: 8, baris: 3 } },
        { label: 'Display toko', desc: 'sisi 45, tinggi 180', params: { alas: 45, tinggi: 180, kait: 12, baris: 4 } },
      ],
    },
    {
      id: 'panel-dinding',
      group: 'dinding-bersandar',
      name: 'Panel kait tempel dinding',
      desc: 'bingkai dibaut tembok di depan papan punggung, palang berkait, ambalan atas',
      params: { model: 'dinding', lebar: 80, tinggi: 180, tinggiPanel: 50, kait: 5, baris: 1, ambalan: true },
      sizes: [
        { label: 'Kecil', desc: '60 × 40 cm', params: { lebar: 60, tinggi: 170, tinggiPanel: 40, kait: 4, baris: 1 } },
        { label: 'Umum', desc: '80 × 50 cm', params: { lebar: 80, tinggi: 180, tinggiPanel: 50, kait: 5, baris: 1 } },
        { label: 'Keluarga', desc: '120 × 60 cm, 2 baris', params: { lebar: 120, tinggi: 180, tinggiPanel: 60, kait: 8, baris: 2 } },
      ],
    },
    {
      id: 'tangga-bersandar',
      group: 'dinding-bersandar',
      name: 'Tangga kait bersandar',
      desc: 'dua ibu tangga bersandar miring ke tembok, anak tangga berkait, papan di pucuk',
      params: { model: 'tangga', lebar: 50, tinggi: 170, dalam: 35, kait: 3, baris: 3, ambalan: true },
      sizes: [
        { label: 'Ramping', desc: '45 × 150 cm', params: { lebar: 45, tinggi: 150, dalam: 30, kait: 3, baris: 3 } },
        { label: 'Umum', desc: '50 × 170 cm', params: { lebar: 50, tinggi: 170, dalam: 35, kait: 3, baris: 3 } },
        { label: 'Lebar', desc: '70 × 190 cm', params: { lebar: 70, tinggi: 190, dalam: 40, kait: 4, baris: 4 } },
      ],
    },
    {
      id: 'tiang-tembok',
      group: 'dinding-bersandar',
      name: 'Tiang tembok lengan menyebar',
      desc: 'tiang dari lantai menempel tembok, lengan menjulur menyebar ke depan di beberapa tingkat',
      params: { model: 'kantilever', tinggi: 180, dalam: 35, kait: 3, baris: 3 },
      sizes: [
        { label: 'Ringkas', desc: 'lengan 30 cm, 4 lengan', params: { tinggi: 170, dalam: 30, kait: 2, baris: 2 } },
        { label: 'Umum', desc: 'lengan 35 cm, 9 lengan', params: { tinggi: 180, dalam: 35, kait: 3, baris: 3 } },
        { label: 'Tinggi', desc: 'lengan 40 cm, 12 lengan', params: { tinggi: 190, dalam: 40, kait: 3, baris: 4 } },
      ],
    },
  ],
  summary: (p) => {
    const m = model(p);
    const H = num(p, 'tinggi');
    const k = num(p, 'kait');
    const n = num(p, 'baris');
    if (POLE.includes(m)) return `tinggi ${H} cm · alas ${num(p, 'alas')} cm · ${n} × ${Math.min(k, 8)} kait`;
    if (m === 'plafon') return `plafon ${H} cm · ${n} × ${Math.min(k, 6)} kait`;
    if (m === 'menara') return `${num(p, 'alas')} × ${num(p, 'alas')} × ${H} cm · ${n} tingkat kait`;
    if (m === 'dinding') return `${num(p, 'lebar')} × ${num(p, 'tinggiPanel')} cm · pasang ${H} cm · ${n} × ${k} kait`;
    if (m === 'pasak') return `${num(p, 'lebar')} × ${num(p, 'tinggiPanel')} cm · pasak ${num(p, 'dalam')} cm · ${n} tingkat`;
    if (m === 'kantilever') return `tinggi ${H} cm · lengan ${num(p, 'dalam')} cm · ${n} tingkat`;
    if (m === 'sudut') return `sayap ${num(p, 'lebar')} × ${num(p, 'dalam')} cm · tinggi ${H} cm · ${n} baris`;
    return `${num(p, 'lebar')} × ${num(p, 'dalam')} × ${H} cm · ${n} × ${k} kait`;
  },

  build: (p) => {
    const m = model(p);
    const H = num(p, 'tinggi', 175);
    const Wp = num(p, 'lebar', 80);
    const A = num(p, 'alas', 40);
    const Dp = num(p, 'dalam', 45);
    const HP = Math.min(num(p, 'tinggiPanel', 50), H - 20);
    const kait = Math.max(1, Math.round(num(p, 'kait', 4)));
    const baris = Math.max(1, Math.min(4, Math.round(num(p, 'baris', 2))));
    const ambalan = p.ambalan === true;
    const L = (parseInt(str(p, 'pipa', '30')) || 30) / 10;
    const b = BOARD_THICK[str(p, 'papan', 'kayu')] ?? 2.5;
    const t: [number, number] = [L * 10, L * 10];
    const rail: [number, number] = [20, 20];
    const thin: [number, number] = [15, 15];
    const { list, add, line } = memberFactory();
    const boards: Board[] = [];
    let W = A;
    let D = A;
    let outH = H;
    let wall = false;

    /**
     * Lengan / kait / pasak / cabang yang dilas RATA di muka batang. base = titik as di permukaan muka batang,
     * a = arah mendatar (rad). Naiknya landai (rise ≤ 0,3 × reach) sehingga pangkalnya dipotong tegak, rata
     * menempel muka batang (tidak masuk ke dalam). Ujung tegak (tip) dilas di depan potongan ujung lengan:
     * muka belakangnya rata dengan potongan itu, mulai dari sisi bawah lengan.
     */
    const arm = (id: string, label: string, base: V3, a: number, reach: number, rise: number, tube: [number, number], tip?: { len: number; label: string; tube: [number, number] }) => {
      const dx = Math.cos(a);
      const dz = Math.sin(a);
      const e: V3 = [r1(base[0] + dx * reach), r1(base[1] + rise), r1(base[2] + dz * reach)];
      line(id, base, e, 'custom', label, tube);
      if (!tip) return;
      const w = tip.tube[0] / 20;
      const h = tube[1] / 20;
      const alongX = Math.abs(dx) >= Math.abs(dz);
      const tx = alongX ? e[0] + Math.sign(dx) * w : e[0];
      const tz = alongX ? e[2] : e[2] + Math.sign(dz) * w;
      add(`${id}-ujung`, 'y', tx, e[1] - h, tz, tip.len + h, 'custom', tip.label, tip.tube);
    };
    /** Kait: keluar tegak lurus dari muka batang (base di permukaan muka) ke arah (dx, dz), naik landai, ujung tegak pendek */
    const hook = (id: string, label: string, base: V3, dx: number, dz: number, len = 8) =>
      arm(id, label, base, Math.atan2(dz, dx), len, len * 0.3, thin, { len: 3, label: `${label} (ujung)`, tube: thin });
    /**
     * Lengan menyebar di sekeliling tiang persegi (cx, cz) lebar L pada tinggi y: tiap lengan dilas di muka tiang
     * yang paling dekat arahnya (pangkal di tengah muka, arah dibatasi ±42° dari tegak lurus muka supaya
     * potongannya tetap rata muka). Lengan yang berbagi satu muka ditumpuk bergantian ke atas/bawah setebal pipa.
     */
    const postArms = (cx: number, cz: number, y: number, angles: number[], tube: [number, number], fn: (k: number, base: V3, a: number) => void) => {
      const TAU = 2 * Math.PI;
      const maxRel = deg(42);
      const items = angles.map((a0, k) => {
        const an = ((a0 % TAU) + TAU) % TAU;
        const f = Math.floor((an + Math.PI / 4 - 1e-6) / (Math.PI / 2)) % 4;
        let rel = an - (f * Math.PI) / 2;
        if (rel > Math.PI) rel -= TAU;
        if (rel < -Math.PI) rel += TAU;
        return { k, f, rel: Math.max(-maxRel, Math.min(maxRel, rel)) };
      });
      const s = tube[1] / 10 + 0.8;
      [0, 1, 2, 3].forEach((f) => {
        const on = items.filter((it) => it.f === f).sort((p1, p2) => p1.rel - p2.rel);
        on.forEach((it, j) => {
          const fa = (f * Math.PI) / 2;
          const base: V3 = [cx + (Math.cos(fa) * L) / 2, y + (j - (on.length - 1) / 2) * s, cz + (Math.sin(fa) * L) / 2];
          fn(it.k, base, fa + it.rel);
        });
      });
    };
    /** Kait melingkar di sekeliling tiang (cx, cz) pada tinggi y */
    const radialHooks = (pre: string, nm: string, cx: number, cz: number, y: number, n: number, off: number, len = 8) =>
      postArms(cx, cz, y, Array.from({ length: n }, (_, k) => off + (2 * Math.PI * k) / n), thin, (k, base, a) =>
        arm(`${pre}-${k + 1}`, `Kait ${nm} ${k + 1}`, base, a, len, len * 0.3, thin, { len: 3, label: `Kait ${nm} ${k + 1} (ujung)`, tube: thin }),
      );
    /** Posisi kait berjajar di antara x0..x1 */
    const spread = (x0: number, x1: number, n: number) => Array.from({ length: n }, (_, j) => x0 + ((x1 - x0) * (j + 0.5)) / n);

    if (m === 'plat') {
      const cx = A / 2;
      const cz = A / 2;
      boards.push({ ...board('alas-plat', 'Alas plat besi bundar', 0, A, 0, 0.8, 0, A), shape: 'round', steelMm: 8 });
      add('tiang', 'y', cx, 0.8, cz, H - 0.8, 'post', 'Tiang tengah', t);
      const n = Math.min(kait, 8);
      for (let i = 0; i < baris; i++) radialHooks(`kait-${i + 1}`, `tingkat ${i + 1}`, cx, cz, H - 8 - i * 22, n, i % 2 ? Math.PI / n : 0);
      outH = H + 1;
    } else if (m === 'tripod') {
      const cx = A / 2;
      const cz = A / 2;
      const R = A / 2 - L / 2;
      const yA = H - 28;
      // Ketiga kaki tidak bertemu di satu titik (saling tembus): ujung atasnya dipotong rata dan dilas di bawah
      // plat kepala, kepala gantungan berdiri di atas plat. Kaki dipotong rata lantai.
      const r0 = L + 0.5;
      const angsK = [-90, 30, 150].map(deg);
      const tops = angsK.map((a) => [cx + r0 * Math.cos(a), yA, cz + r0 * Math.sin(a)] as V3);
      const feet = angsK.map((a) => [cx + R * Math.cos(a), 0, cz + R * Math.sin(a)] as V3);
      const names = ['belakang', 'kanan depan', 'kiri depan'];
      feet.forEach((f, i) => line(`kaki-${i + 1}`, f, tops[i], 'post', `Kaki miring ${names[i]}`, t));
      boards.push({ ...board('plat-kepala', 'Plat kepala tripod', cx - 6, cx + 6, yA, yA + 0.6, cz - 6, cz + 6), steelMm: 6 });
      add('kepala', 'y', cx, yA + 0.6, cz, H - yA - 0.6, 'post', 'Kepala gantungan', t);
      // cincin segitiga penguat: tiap palang dipotong pendek, kedua ujungnya menempel rata di sisi kaki
      // (tidak menembus kaki); ketiga palang beda tinggi setebal palang supaya tidak saling tembus di pojok.
      const legs = [1, 2, 3].map((k) => list.find((mm) => mm.id === `kaki-${k}`)!);
      const yr0 = r1(H * 0.3);
      [0, 1, 2].forEach((i) => {
        const j = (i + 1) % 3;
        const yr = yr0 + (i - 1) * (rail[1] / 10 + 0.2);
        const at = (k: number) => {
          const tt = yr / yA;
          return [feet[k][0] + (tops[k][0] - feet[k][0]) * tt, yr, feet[k][2] + (tops[k][2] - feet[k][2]) * tt] as V3;
        };
        const [P, Q] = fitBetween(at(i), at(j), legs[i], legs[j], rail);
        line(`cincin-${i + 1}`, P, Q, 'custom', `Palang penguat segitiga ${i + 1}`, rail);
      });
      const n = Math.min(kait, 8);
      const lv = Math.max(1, Math.min(baris, Math.floor((H - yA - 6) / 10)));
      for (let i = 0; i < lv; i++) radialHooks(`kait-${i + 1}`, `tingkat ${i + 1}`, cx, cz, H - 6 - i * 10, n, deg(90) + (i % 2 ? Math.PI / n : 0));
      outH = H + 1;
    } else if (m === 'pohon') {
      const cx = A / 2;
      const cz = A / 2;
      const R = A / 2 - 2;
      const hj = 24;
      // Kaki bintang: ujung atas keempat kaki dipotong rata dan dilas di bawah plat dudukan, tiang berdiri di atas plat
      // (kaki tidak bertemu di dalam tiang / saling tembus).
      const r0 = L + 1;
      boards.push({ ...board('plat-dudukan', 'Plat dudukan tiang', cx - 6, cx + 6, hj, hj + 0.6, cz - 6, cz + 6), steelMm: 6 });
      add('tiang', 'y', cx, hj + 0.6, cz, H - hj - 0.6, 'post', 'Tiang tengah', t);
      [45, 135, 225, 315].forEach((d, i) => {
        const dx = Math.cos(deg(d));
        const dz = Math.sin(deg(d));
        line(`kaki-${i + 1}`, [cx + dx * r0, hj, cz + dz * r0], [cx + dx * R, 0, cz + dz * R], 'post', `Kaki miring ${i + 1}`, t);
      });
      const n = Math.min(kait, 6);
      for (let i = 0; i < baris; i++) {
        const y = H - 16 - i * 28;
        const off = i % 2 ? Math.PI / n : 0;
        const angs = Array.from({ length: n }, (_, k) => off + (2 * Math.PI * k) / n);
        postArms(cx, cz, y, angs, rail, (k, base, a) =>
          arm(`cabang-${i + 1}-${k + 1}`, `Cabang tingkat ${i + 1} no. ${k + 1}`, base, a, 15 - L / 2, 4.5, rail, {
            len: 6,
            label: `Ujung cabang ${i + 1}-${k + 1}`,
            tube: thin,
          }),
        );
      }
    } else if (m === 'helm') {
      const cx = A / 2;
      const cz = A / 2;
      const R = A / 2 - 2;
      add('tiang', 'y', cx, 0, cz, H, 'post', 'Tiang tengah', t);
      [90, 210, 330].forEach((d, i) => {
        const dx = Math.cos(deg(d));
        const dz = Math.sin(deg(d));
        line(`kaki-${i + 1}`, [cx + (dx * L) / 2, L / 2, cz + (dz * L) / 2], [cx + dx * R, L / 2, cz + dz * R], 'post', `Kaki datar ${i + 1}`, t);
      });
      const n = Math.min(kait, 4);
      for (let i = 0; i < baris; i++) {
        const y = H - 12 - i * 30;
        const off = deg(45) + (i % 2 ? Math.PI / n : 0);
        const angs = Array.from({ length: n }, (_, k) => off + (2 * Math.PI * k) / n);
        postArms(cx, cz, y, angs, rail, (k, base, a) =>
          arm(`pasak-${i + 1}-${k + 1}`, `Pasak helm tingkat ${i + 1} no. ${k + 1}`, base, a, 16, 3, rail, {
            len: 4,
            label: `Penahan ujung pasak ${i + 1}-${k + 1}`,
            tube: thin,
          }),
        );
      }
      if (ambalan && b > 0) {
        boards.push({ ...board('dudukan-atas', 'Dudukan helm bundar di pucuk', cx - 11, cx + 11, H, H + b, cz - 11, cz + 11), shape: 'round' });
        outH = H + b;
      }
    } else if (m === 'payung') {
      const hb = 30;
      const xs = [L / 2, A - L / 2];
      const zs = [L / 2, A - L / 2];
      xs.forEach((x, i) => zs.forEach((z, j) => add(`tiang-kotak-${i}-${j}`, 'y', x, 0, z, hb, 'post', `Tiang kotak payung ${i ? 'kanan' : 'kiri'} ${j ? 'depan' : 'belakang'}`, t)));
      const xm = A / 2;
      add('tiang', 'y', xm, 0, L / 2, H, 'post', 'Tiang gantungan', t);
      [1, hb - 1].forEach((y, k) => {
        const nm = k ? 'atas' : 'bawah';
        add(`cincin-${nm}-depan`, 'x', L, y, A - L / 2, A - 2 * L, 'rail-x', `Cincin ${nm} depan`, rail);
        add(`cincin-${nm}-kiri`, 'z', L / 2, y, L, A - 2 * L, 'rail-z', `Cincin ${nm} kiri`, rail);
        add(`cincin-${nm}-kanan`, 'z', A - L / 2, y, L, A - 2 * L, 'rail-z', `Cincin ${nm} kanan`, rail);
        add(`cincin-${nm}-bk`, 'x', L, y, L / 2, xm - L / 2 - L, 'rail-x', `Cincin ${nm} belakang kiri`, rail);
        add(`cincin-${nm}-bn`, 'x', xm + L / 2, y, L / 2, A - L - xm - L / 2, 'rail-x', `Cincin ${nm} belakang kanan`, rail);
      });
      boards.push({ ...board('plat-tetes', 'Plat tetes air payung', L / 2, A - L / 2, 0, 0.2, L / 2, A - L / 2), steelMm: 2 });
      const n = Math.min(kait, 8);
      for (let i = 0; i < baris; i++) {
        const y = H - 8 - i * 20;
        const angs = Array.from({ length: n }, (_, k) => (n === 1 ? Math.PI / 2 : (Math.PI * k) / (n - 1)));
        postArms(xm, L / 2, y, angs, thin, (k, base, a) =>
          arm(`kait-${i + 1}-${k + 1}`, `Kait tingkat ${i + 1} no. ${k + 1}`, base, a, 8, 2.4, thin, {
            len: 3,
            label: `Kait tingkat ${i + 1} no. ${k + 1} (ujung)`,
            tube: thin,
          }),
        );
      }
      outH = H + 1;
    } else if (m === 'plafon') {
      W = 30;
      D = 30;
      const c = 15;
      boards.push({ ...board('plat-lantai', 'Plat jepit lantai', c - 6, c + 6, 0, 0.6, c - 6, c + 6), steelMm: 6 });
      boards.push({ ...board('plat-plafon', 'Plat jepit plafon', c - 6, c + 6, H - 0.6, H, c - 6, c + 6), steelMm: 6 });
      add('tiang', 'y', c, 0.6, c, H - 1.2, 'post', 'Tiang jepit lantai–plafon', t);
      const n = Math.min(kait, 6);
      for (let i = 0; i < baris; i++) radialHooks(`kait-${i + 1}`, `tingkat ${i + 1}`, c, c, 175 - i * 22, n, i % 2 ? Math.PI / n : 0);
    } else if (m === 'panel' || m === 'kisi') {
      W = Wp;
      D = Dp;
      const zc = Dp / 2;
      const xs = [L / 2, Wp - L / 2];
      xs.forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        add(`kaki-${nm}`, 'z', x, L / 2, 0, Dp, 'rail-z', `Kaki melintang ${nm}`, t);
        add(`tiang-${nm}`, 'y', x, L, zc, H - L, 'post', `Tiang ${nm}`, t);
      });
      const yB = m === 'panel' ? 30 : 25;
      add('palang-atas', 'x', L, H - 1, zc, Wp - 2 * L, 'rail-x', 'Palang atas', rail);
      add('palang-bawah', 'x', L, yB, zc, Wp - 2 * L, 'rail-x', 'Palang bawah', rail);
      const rows = Array.from({ length: baris }, (_, i) => H - 15 - i * 25).filter((y) => y > yB + 12);
      if (m === 'panel') {
        if (b > 0) boards.push(board('papan-punggung', 'Papan punggung', L, Wp - L, yB + 1, H - 2, zc - L / 2 - b, zc - L / 2));
        rows.forEach((y, i) => {
          add(`palang-kait-${i + 1}`, 'x', L, y, zc, Wp - 2 * L, 'rail-x', `Palang kait baris ${i + 1}`, rail);
          spread(L, Wp - L, kait).forEach((x, j) => hook(`kait-${i + 1}-${j + 1}`, `Kait baris ${i + 1} no. ${j + 1}`, [x, y, zc + 1], 0, 1));
        });
        if (ambalan) {
          const zb = zc - L / 2 - Math.max(b, 0);
          if (b > 0) boards.push(board('ambalan', 'Ambalan topi', 0, Wp, H, H + b, zb, zc + 22));
          // siku ambalan: lengan mendatar dilas rata di muka depan tiang, sisi atasnya rata dengan bawah ambalan
          xs.forEach((x, i) => add(`siku-ambalan-${i}`, 'z', x, H - thin[1] / 20, zc + L / 2, 16 - L / 2, 'rail-z', `Siku ambalan ${i ? 'kanan' : 'kiri'}`, thin));
          outH = H + b;
          D = Math.max(Dp, zc + 22);
        }
      } else {
        // jeruji tegak di bidang yang sama, palang kait dipotong di antara jeruji
        const nv = Math.max(1, Math.round((Wp - 2 * L) / 30) - 1);
        const vx = Array.from({ length: nv }, (_, k) => L / 2 + ((Wp - L) * (k + 1)) / (nv + 1));
        vx.forEach((x, k) => add(`jeruji-${k + 1}`, 'y', x, yB + 1, zc, H - 2 - (yB + 1), 'custom', `Jeruji tegak ${k + 1}`, rail));
        const edges = [L / 2, ...vx, Wp - L / 2];
        rows.forEach((y, i) => {
          for (let s = 0; s < edges.length - 1; s++) {
            const x0 = edges[s] + (s === 0 ? L / 2 : 1);
            const x1 = edges[s + 1] - (s === edges.length - 2 ? L / 2 : 1);
            add(`palang-kait-${i + 1}-${s + 1}`, 'x', x0, y, zc, x1 - x0, 'rail-x', `Palang kait baris ${i + 1} ruas ${s + 1}`, rail);
          }
          spread(L, Wp - L, kait)
            .filter((x) => vx.every((v) => Math.abs(v - x) > 3))
            .forEach((x, j) => {
              hook(`kait-d-${i + 1}-${j + 1}`, `Kait depan baris ${i + 1} no. ${j + 1}`, [x, y, zc + 1], 0, 1);
              hook(`kait-b-${i + 1}-${j + 1}`, `Kait belakang baris ${i + 1} no. ${j + 1}`, [x, y, zc - 1], 0, -1);
            });
        });
      }
    } else if (m === 'sudut') {
      wall = true;
      W = Wp;
      D = Dp;
      add('tiang-pojok', 'y', L / 2, 0, L / 2, H, 'post', 'Tiang pojok', t);
      add('tiang-belakang', 'y', Wp - L / 2, 0, L / 2, H, 'post', 'Tiang ujung sayap belakang', t);
      add('tiang-samping', 'y', L / 2, 0, Dp - L / 2, H, 'post', 'Tiang ujung sayap samping', t);
      const rows = Array.from({ length: baris }, (_, i) => H - 15 - i * 25).filter((y) => y > 40);
      [
        { y: H - 1, nm: 'atas' },
        { y: 20, nm: 'bawah' },
        ...rows.map((y, i) => ({ y, nm: `kait baris ${i + 1}` })),
      ].forEach(({ y, nm }, k) => {
        add(`sayap-b-${k}`, 'x', L, y, L / 2, Wp - 2 * L, 'rail-x', `Palang ${nm} sayap belakang`, rail);
        add(`sayap-s-${k}`, 'z', L / 2, y, L, Dp - 2 * L, 'rail-z', `Palang ${nm} sayap samping`, rail);
      });
      rows.forEach((y, i) => {
        spread(L + 8, Wp - L, kait).forEach((x, j) => hook(`kait-b-${i + 1}-${j + 1}`, `Kait sayap belakang ${i + 1}-${j + 1}`, [x, y, L / 2 + 1], 0, 1));
        spread(L + 8, Dp - L, kait).forEach((z, j) => hook(`kait-s-${i + 1}-${j + 1}`, `Kait sayap samping ${i + 1}-${j + 1}`, [L / 2 + 1, y, z], 1, 0));
      });
      if (ambalan && b > 0) {
        const s = Math.min(35, Wp, Dp);
        boards.push(board('ambalan-pojok', 'Ambalan pojok', 0, s, H, H + b, 0, s));
        outH = H + b;
      }
    } else if (m === 'menara') {
      const mg = 10;
      W = A + 2 * mg;
      D = A + 2 * mg;
      const x0 = mg + L / 2;
      const x1 = mg + A - L / 2;
      [x0, x1].forEach((x, i) => [x0, x1].forEach((z, j) => add(`tiang-${i}-${j}`, 'y', x, 0, z, H, 'post', `Tiang ${i ? 'kanan' : 'kiri'} ${j ? 'depan' : 'belakang'}`, t)));
      const ring = (id: string, nm: string, y: number) => {
        add(`${id}-depan`, 'x', x0 + L / 2, y, x1, x1 - x0 - L, 'rail-x', `Palang ${nm} depan`, rail);
        add(`${id}-belakang`, 'x', x0 + L / 2, y, x0, x1 - x0 - L, 'rail-x', `Palang ${nm} belakang`, rail);
        add(`${id}-kiri`, 'z', x0, y, x0 + L / 2, x1 - x0 - L, 'rail-z', `Palang ${nm} kiri`, rail);
        add(`${id}-kanan`, 'z', x1, y, x0 + L / 2, x1 - x0 - L, 'rail-z', `Palang ${nm} kanan`, rail);
      };
      ring('bawah', 'bawah', 12);
      ring('atas', 'atas', H - 1);
      const per = Math.max(1, Math.min(3, Math.ceil(kait / 4)));
      const rows = Array.from({ length: baris }, (_, i) => H - 15 - i * 25).filter((y) => y > 30);
      rows.forEach((y, i) => {
        ring(`baris-${i + 1}`, `kait baris ${i + 1}`, y);
        const pos = spread(x0 + L / 2, x1 - L / 2, per);
        pos.forEach((q, j) => {
          hook(`kait-d-${i + 1}-${j + 1}`, `Kait depan ${i + 1}-${j + 1}`, [q, y, x1 + 1], 0, 1);
          hook(`kait-b-${i + 1}-${j + 1}`, `Kait belakang ${i + 1}-${j + 1}`, [q, y, x0 - 1], 0, -1);
          hook(`kait-ki-${i + 1}-${j + 1}`, `Kait kiri ${i + 1}-${j + 1}`, [x0 - 1, y, q], -1, 0);
          hook(`kait-ka-${i + 1}-${j + 1}`, `Kait kanan ${i + 1}-${j + 1}`, [x1 + 1, y, q], 1, 0);
        });
      });
      if (ambalan && b > 0) {
        boards.push(board('papan-atas', 'Papan atas menara', mg, mg + A, H, H + b, mg, mg + A));
        outH = H + b;
      }
    } else if (m === 'dinding') {
      wall = true;
      W = Wp;
      const y1 = H;
      const y0 = H - HP;
      const zf = b + L / 2;
      if (b > 0) boards.push(board('papan-punggung', 'Papan punggung (menempel tembok)', 0, Wp, y0, y1, 0, b));
      [L / 2, Wp - L / 2].forEach((x, i) => add(`bingkai-${i ? 'kanan' : 'kiri'}`, 'y', x, y0, zf, HP, 'post', `Bingkai ${i ? 'kanan' : 'kiri'}`, t));
      add('bingkai-atas', 'x', L, y1 - 1, zf, Wp - 2 * L, 'rail-x', 'Bingkai atas', rail);
      add('bingkai-bawah', 'x', L, y0 + 1, zf, Wp - 2 * L, 'rail-x', 'Bingkai bawah', rail);
      for (let i = 0; i < baris; i++) {
        const y = r1(y0 + (HP * (i + 1)) / (baris + 1));
        add(`palang-kait-${i + 1}`, 'x', L, y, zf, Wp - 2 * L, 'rail-x', `Palang kait baris ${i + 1}`, rail);
        spread(L, Wp - L, kait).forEach((x, j) => hook(`kait-${i + 1}-${j + 1}`, `Kait baris ${i + 1} no. ${j + 1}`, [x, y, zf + 1], 0, 1));
      }
      D = zf + L / 2 + 10;
      if (ambalan && b > 0) {
        boards.push(board('ambalan', 'Ambalan atas', 0, Wp, y1, y1 + b, 0, 22));
        // siku ambalan: lengan mendatar dilas rata di muka depan bingkai, sisi atasnya rata dengan bawah ambalan
        [L / 2, Wp - L / 2].forEach((x, i) => add(`siku-ambalan-${i}`, 'z', x, y1 - thin[1] / 20, zf + L / 2, 18 - zf - L / 2, 'rail-z', `Siku ambalan ${i ? 'kanan' : 'kiri'}`, thin));
        outH = y1 + b;
        D = Math.max(D, 22);
      }
    } else if (m === 'pasak') {
      wall = true;
      W = Wp;
      const y1 = H;
      const y0 = H - HP;
      const nc = Math.max(1, Math.min(5, Math.round(Wp / 35)));
      const xs = nc === 1 ? [Wp / 2] : Array.from({ length: nc }, (_, c) => L / 2 + ((Wp - L) * c) / (nc - 1));
      xs.forEach((x, c) => add(`jeruji-${c + 1}`, 'y', x, y0, L / 2, HP, 'post', `Jeruji tembok ${c + 1}`, t));
      if (nc > 1)
        [y1 - 1, y0 + 1].forEach((y, k) => {
          for (let c = 0; c < nc - 1; c++) add(`palang-${k ? 'bawah' : 'atas'}-${c + 1}`, 'x', xs[c] + L / 2, y, L / 2, xs[c + 1] - xs[c] - L, 'rail-x', `Palang ${k ? 'bawah' : 'atas'} ${c + 1}`, rail);
        });
      const sp = baris > 1 ? (HP - 16) / (baris - 1) : 0;
      xs.forEach((x, c) => {
        for (let i = 0; i < baris; i++) {
          const y = r1(y1 - 8 - i * sp - (c % 2 ? sp / 2 : 0) * (baris > 1 ? 1 : 0));
          const yy = Math.max(y0 + 6, y);
          const e: [number, number, number] = [x, yy + 3, L + Dp];
          line(`pasak-${c + 1}-${i + 1}`, [x, yy, L], e, 'custom', `Pasak jeruji ${c + 1} no. ${i + 1}`, rail);
          line(`pasak-${c + 1}-${i + 1}-ujung`, e, [x, yy + 7, L + Dp], 'custom', `Penahan ujung pasak ${c + 1}-${i + 1}`, thin);
        }
      });
      D = L + Dp + 1;
    } else if (m === 'tangga') {
      wall = true;
      W = Wp;
      const zf = Dp;
      const zAt = (y: number) => zf + ((L / 2 - zf) * y) / H;
      [L / 2, Wp - L / 2].forEach((x, i) => line(`ibu-${i ? 'kanan' : 'kiri'}`, [x, 0, zf], [x, H, L / 2], 'post', `Ibu tangga ${i ? 'kanan' : 'kiri'} (miring)`, t));
      add('anak-bawah', 'x', L, 20, r1(zAt(20)), Wp - 2 * L, 'rail-x', 'Anak tangga bawah', rail);
      const rows = Array.from({ length: baris }, (_, i) => H - 20 - i * 30).filter((y) => y > 40);
      rows.forEach((y, i) => {
        const z = r1(zAt(y));
        add(`anak-${i + 1}`, 'x', L, y, z, Wp - 2 * L, 'rail-x', `Anak tangga berkait ${i + 1}`, rail);
        spread(L, Wp - L, kait).forEach((x, j) => hook(`kait-${i + 1}-${j + 1}`, `Kait anak tangga ${i + 1} no. ${j + 1}`, [x, y, z + 1], 0, 1));
      });
      D = zf + L / 2;
      if (ambalan && b > 0) {
        boards.push(board('papan-pucuk', 'Papan di pucuk tangga', 0, Wp, H, H + b, 0, 20));
        outH = H + b;
        D = Math.max(D, 20);
      }
    } else {
      // kantilever: tiang menempel tembok, lengan menyebar
      wall = true;
      const R = Dp;
      W = Math.max(30, r1(2 * (R * Math.sin(deg(40)) + 4) + L));
      D = r1(L / 2 + R + 2);
      const cx = W / 2;
      const z0 = L / 2;
      boards.push({ ...board('plat-kaki', 'Plat kaki tiang', cx - 6, cx + 6, 0, 0.6, 0, 12), steelMm: 6 });
      add('tiang', 'y', cx, 0.6, z0, H - 0.6, 'post', 'Tiang tembok', t);
      const n = Math.min(kait, 3);
      const angs = n === 1 ? [0] : n === 2 ? [-30, 30] : [-40, 0, 40];
      for (let i = 0; i < baris; i++) {
        const y = H - 8 - i * 28;
        // lengan diukur dari arah depan (sumbu z): sudut mendatar = 90° − ad
        postArms(cx, z0, y, angs.map((ad) => deg(90 - ad)), rail, (k, base, a) =>
          arm(`lengan-${i + 1}-${k + 1}`, `Lengan tingkat ${i + 1} no. ${k + 1}`, base, a, R - L / 2, 4, rail, {
            len: 5,
            label: `Ujung lengan ${i + 1}-${k + 1}`,
            tube: thin,
          }),
        );
      }
    }

    return { members: list, boards, casters: [], W: r1(W), D: r1(D), H: r1(outH), boardThick: 0, wall };
  },

  checks: (p) => {
    const out: ProductCheck[] = [];
    const m = model(p);
    const H = num(p, 'tinggi');
    const A = num(p, 'alas');
    const Wp = num(p, 'lebar');
    const Dp = num(p, 'dalam');
    const kait = num(p, 'kait');
    const baris = num(p, 'baris');
    const pipa = str(p, 'pipa', '30');
    if (POLE.includes(m) && H / A > 4.6) {
      const a = Math.min(70, Math.ceil(H / 4.2));
      out.push({ level: 'warn', message: 'Alas terlalu kecil untuk tiang setinggi ini: mudah terguling saat mantel digantung di satu sisi.', fix: { label: `Alas ${a} cm`, params: { alas: a } } });
    }
    if ((POLE.includes(m) || m === 'kantilever' || m === 'plafon') && pipa === '20' && H > 150)
      out.push({ level: 'warn', message: 'Tiang 20×20 terlalu ramping untuk tinggi ini, bisa melentur kalau penuh mantel.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
    if ((m === 'panel' || m === 'kisi') && H / Dp > 4.5) {
      const d = Math.min(100, Math.ceil(H / 4));
      out.push({ level: 'warn', message: 'Kaki melintang terlalu pendek: panel tinggi mudah jatuh ke depan saat tas berat digantung.', fix: { label: `Kaki ${d} cm`, params: { dalam: d } } });
    }
    if (m === 'menara' && H / A > 5) {
      const a = Math.min(70, Math.ceil(H / 4.5));
      out.push({ level: 'warn', message: 'Menara terlalu ramping untuk tingginya, mudah oleng.', fix: { label: `Sisi ${a} cm`, params: { alas: a } } });
    }
    if (['panel', 'kisi', 'dinding', 'tangga'].includes(m) && (Wp - 6) / kait < 9) {
      const k = Math.max(1, Math.floor((Wp - 6) / 12));
      out.push({ level: 'warn', message: 'Kait terlalu rapat: mantel saling tumpuk dan sulit diambil.', fix: { label: `${k} kait per baris`, params: { kait: k } } });
    }
    if (m === 'helm' && H - 12 - (baris - 1) * 30 < 40) {
      const n = Math.max(1, Math.floor((H - 52) / 30) + 1);
      out.push({ level: 'warn', message: 'Pasak paling bawah terlalu dekat lantai, helm menyentuh kaki.', fix: { label: `${n} tingkat pasak`, params: { baris: n } } });
    }
    if (m === 'tangga') {
      if (Dp < H * 0.12) {
        const d = Math.min(100, Math.ceil(H * 0.2));
        out.push({ level: 'warn', message: 'Tangga terlalu tegak, bisa jatuh ke depan saat tas digantung.', fix: { label: `Kaki ${d} cm dari tembok`, params: { dalam: d } } });
      } else if (Dp > H * 0.4) {
        const d = Math.max(15, Math.ceil(H * 0.2));
        out.push({ level: 'warn', message: 'Tangga terlalu landai, kaki bisa tergelincir di lantai licin.', fix: { label: `Kaki ${d} cm dari tembok`, params: { dalam: d } } });
      }
      out.push({ level: 'info', message: 'Pasang karet anti-selip di kaki dan ganjal karet di pucuk yang menyentuh tembok.' });
    }
    if (m === 'kantilever' && Dp > 40 && pipa === '20')
      out.push({ level: 'warn', message: 'Lengan panjang dengan pipa 20×20 bisa melendut.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
    if (m === 'pasak' && Dp > 30)
      out.push({ level: 'info', message: 'Pasak panjang menahan beban besar di baut tembok: pakai fischer 8 mm minimal 2 titik per jeruji.' });
    if (m === 'plafon') out.push({ level: 'info', message: 'Plafon gipsum tidak kuat menahan jepitan: plat atas harus mengenai rangka plafon atau beton.' });
    if (['dinding', 'pasak', 'kantilever'].includes(m)) out.push({ level: 'info', message: 'Dibaut ke tembok bata / beton dengan fischer, minimal 2 titik di tiap sisi.' });
    if (m === 'sudut') out.push({ level: 'info', message: 'Rapatkan ke pojok ruangan; ikat tiang pojok ke tembok dengan 1 baut supaya tidak goyang.' });
    const n =
      m === 'pasak'
        ? Math.max(1, Math.min(5, Math.round(Wp / 35))) * baris
        : m === 'menara'
          ? 4 * Math.max(1, Math.min(3, Math.ceil(kait / 4))) * baris
          : m === 'kisi'
            ? 2 * kait * baris
            : m === 'sudut'
              ? 2 * kait * baris
              : m === 'kantilever'
                ? Math.min(kait, 3) * baris
                : POLE.includes(m)
                  ? Math.min(kait, m === 'helm' ? 4 : m === 'pohon' ? 6 : 8) * baris
                  : m === 'plafon'
                    ? Math.min(kait, 6) * baris
                    : kait * baris;
    out.push({ level: 'info', message: `Muat ±${n} ${m === 'helm' || m === 'pasak' ? 'helm / topi' : 'mantel / tas'}.` });
    return out;
  },
};
