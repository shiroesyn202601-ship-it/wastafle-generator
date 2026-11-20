import { Board, Params, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, CASTER_OPTIONS, board, bool, casterHeight, materialParams, memberFactory, num, r1, str } from './common';

/**
 * Rak gantungan baju. Bentuk rangka (param `model`):
 * - gawang: dua tiang di atas kaki melintang, pipa gantungan di atas, rak / palang bawah, boleh beroda
 * - a: tiap ujung rangka A (dua kaki miring bertemu di puncak), pipa gantungan di puncak
 * - t: satu tiang tengah di kaki silang, lengan T di atas (gantungan dua sisi)
 * - lingkar: tiang tengah + cincin segi delapan, gantungan memutar (butik)
 * - dinding: siku tembok + papan atas, pipa gantungan tergantung di bawah papan
 * - kanopi: 4 tiang, rak atas penuh (kanopi) + pipa gantungan di bawahnya
 * - lemari: lemari terbuka, kolom rak di kiri + pipa gantungan ke tiang kanan
 */
const MODELS = [
  { value: 'gawang', label: 'Gawang 2 tiang', desc: 'Tiang di atas kaki melintang' },
  { value: 'a', label: 'Rangka A', desc: 'Kaki miring bertemu di puncak' },
  { value: 't', label: 'Tiang tunggal T', desc: 'Satu tiang, lengan dua sisi' },
  { value: 'lingkar', label: 'Cincin putar', desc: 'Gantungan melingkar, untuk butik' },
  { value: 'dinding', label: 'Tempel dinding', desc: 'Papan atas + pipa gantungan di bawahnya' },
  { value: 'kanopi', label: 'Rak atas (kanopi)', desc: '4 tiang, rak penuh di atas pipa gantungan' },
  { value: 'lemari', label: 'Lemari terbuka', desc: 'Kolom rak di samping + pipa gantungan' },
];
const isM = (p: Params, ...m: string[]) => m.includes(str(p, 'model', 'gawang'));

export const RAK_BAJU: ProductDef = {
  id: 'rak-baju',
  name: 'Rak gantungan baju',
  tagline: 'butik · kamar · laundry',
  icon: 'M8 6h44M10 6v28M50 6v28M4 34h12M44 34h12M10 26h40',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['model', 'panjang', 'tinggi', 'dalam', 'lebarKolom'] },
    { id: 'bentuk', title: 'Bawah', keys: ['rakBawah', 'tinggiRak'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Roda', keys: ['roda', 'ukuranRoda'] },
  ],
  params: [
    { key: 'model', label: 'Bentuk rangka', type: 'choice', options: MODELS },
    { key: 'panjang', label: 'Panjang', type: 'number', unit: 'cm', min: 60, max: 200, step: 1, help: '±2 cm per gantungan baju. Cincin putar: diameter cincin.', marks: [{ value: 100, label: 'kamar' }, { value: 150, label: 'butik' }] },
    { key: 'tinggi', label: 'Tinggi pipa gantungan', type: 'number', unit: 'cm', min: 120, max: 200, step: 1, marks: [{ value: 160, label: 'kemeja' }, { value: 180, label: 'gaun / mantel' }] },
    { key: 'dalam', label: 'Lebar kaki / kedalaman', type: 'number', unit: 'cm', min: 35, max: 65, step: 1, help: 'Makin lebar makin stabil. Tempel dinding: kedalaman papan atas.', marks: [{ value: 50, label: 'umum' }] },
    { key: 'lebarKolom', label: 'Lebar kolom rak', type: 'number', unit: 'cm', min: 30, max: 60, step: 1, help: 'Kolom rak lipatan baju di sisi kiri.', showIf: (p) => p.model === 'lemari' },
    { key: 'rakBawah', label: 'Rak bawah', type: 'toggle', help: 'Papan untuk sepatu / tas / kotak.', showIf: (p) => ['gawang', 'a', 'kanopi', 'lemari'].includes(String(p.model)) },
    { key: 'tinggiRak', label: 'Tinggi rak bawah', type: 'number', unit: 'cm', min: 12, max: 45, step: 1, showIf: (p) => p.rakBawah === true && ['gawang', 'a', 'kanopi', 'lemari'].includes(String(p.model)) },
    ...materialParams(true),
    { key: 'roda', label: 'Pakai roda', type: 'toggle', help: 'Mudah dipindah saat bersih-bersih.', showIf: (p) => ['gawang', 'kanopi', 'lemari'].includes(String(p.model)) },
    { key: 'ukuranRoda', label: 'Ukuran roda', type: 'choice', options: CASTER_OPTIONS, showIf: (p) => p.roda === true && ['gawang', 'kanopi', 'lemari'].includes(String(p.model)) },
  ],
  defaults: { model: 'gawang', panjang: 120, tinggi: 165, dalam: 50, lebarKolom: 40, rakBawah: true, tinggiRak: 20, pipa: '30', papan: 'kayu', warna: '#1f2226', roda: true, ukuranRoda: '3' },
  groups: [
    { id: 'berdiri', name: 'Rak baju berdiri', desc: 'Butik, laundry, kamar, acara' },
    { id: 'kamar', name: 'Rak baju kamar & lemari terbuka', desc: 'Pengganti lemari, tempel dinding, walk-in closet' },
  ],
  signature: (p) => `rak-baju:${str(p, 'model', 'gawang')}`,
  presets: [
    {
      id: 'rak-bawah',
      group: 'berdiri',
      name: 'Rak baju gawang',
      desc: 'dua tiang di kaki melintang, pipa gantungan di atas',
      params: { model: 'gawang', rakBawah: true, roda: true },
      sizes: [
        { label: 'Kamar + rak bawah', desc: '100 × 160 cm, beroda', params: { panjang: 100, tinggi: 160, dalam: 45, rakBawah: true, roda: true } },
        { label: 'Butik / toko', desc: '150 × 175 cm, rak bawah', params: { panjang: 150, tinggi: 175, dalam: 55, rakBawah: true, roda: true } },
        { label: 'Polos display butik', desc: '120 × 170 cm, palang bawah', params: { panjang: 120, tinggi: 170, dalam: 50, rakBawah: false, roda: false, pipa: '30' } },
        { label: 'Jemuran / laundry', desc: '160 × 150 cm, palang bawah', params: { panjang: 160, tinggi: 150, dalam: 55, rakBawah: false, roda: false, pipa: '30' } },
      ],
    },
    {
      id: 'rangka-a',
      group: 'berdiri',
      name: 'Rak baju rangka A',
      desc: 'tiap ujung dua kaki miring bertemu di puncak pipa gantungan',
      params: { model: 'a', panjang: 120, tinggi: 165, dalam: 60, rakBawah: true, tinggiRak: 25, roda: false },
      sizes: [
        { label: 'Kamar', desc: '120 × 165 cm, rak bawah', params: { panjang: 120, tinggi: 165, dalam: 60, rakBawah: true } },
        { label: 'Butik minimalis', desc: '150 × 175 cm, tanpa rak', params: { panjang: 150, tinggi: 175, dalam: 65, rakBawah: false } },
        { label: 'Anak', desc: '90 × 130 cm', params: { panjang: 90, tinggi: 130, dalam: 50, rakBawah: true, tinggiRak: 20 } },
      ],
    },
    {
      id: 'tiang-t',
      group: 'berdiri',
      name: 'Rak baju tiang T',
      desc: 'satu tiang tengah di kaki silang, lengan T dua sisi dengan penguat',
      params: { model: 't', panjang: 110, tinggi: 165, dalam: 55, roda: false, rakBawah: false },
      sizes: [
        { label: 'Butik', desc: 'lengan 110 cm, tinggi 165', params: { panjang: 110, tinggi: 165, dalam: 55 } },
        { label: 'Pojok kamar', desc: 'lengan 80 cm, tinggi 160', params: { panjang: 80, tinggi: 160, dalam: 45 } },
        { label: 'Gaun panjang', desc: 'lengan 120 cm, tinggi 185', params: { panjang: 120, tinggi: 185, dalam: 60 } },
      ],
    },
    {
      id: 'lingkar',
      group: 'berdiri',
      name: 'Rak baju cincin putar',
      desc: 'tiang tengah, cincin segi delapan dengan 4 jari-jari',
      params: { model: 'lingkar', panjang: 90, tinggi: 150, dalam: 60, roda: false, rakBawah: false },
      sizes: [
        { label: 'Butik', desc: 'cincin 90 cm, tinggi 150', params: { panjang: 90, tinggi: 150 } },
        { label: 'Obral / bazar', desc: 'cincin 120 cm, tinggi 135', params: { panjang: 120, tinggi: 135 } },
        { label: 'Kecil', desc: 'cincin 70 cm, tinggi 140', params: { panjang: 70, tinggi: 140 } },
      ],
    },
    {
      id: 'dinding',
      group: 'kamar',
      name: 'Rak baju tempel dinding',
      desc: 'siku tembok + papan atas, pipa gantungan tergantung di bawah papan',
      params: { model: 'dinding', panjang: 100, tinggi: 165, dalam: 35, roda: false, rakBawah: false },
      sizes: [
        { label: 'Kamar kos', desc: '100 cm, papan 35', params: { panjang: 100, tinggi: 165, dalam: 35 } },
        { label: 'Laundry / jemuran dalam', desc: '150 cm, papan 40', params: { panjang: 150, tinggi: 170, dalam: 40 } },
        { label: 'Anak', desc: '80 cm, rendah', params: { panjang: 80, tinggi: 125, dalam: 35 } },
      ],
    },
    {
      id: 'kanopi',
      group: 'kamar',
      name: 'Rak baju rak atas (kanopi)',
      desc: '4 tiang, rak penuh di atas pipa gantungan + rak bawah',
      params: { model: 'kanopi', panjang: 120, tinggi: 160, dalam: 45, rakBawah: true, tinggiRak: 15, roda: false },
      sizes: [
        { label: 'Kamar', desc: '120 × 45 cm', params: { panjang: 120, tinggi: 160, dalam: 45 } },
        { label: 'Pengganti lemari', desc: '160 × 50 cm, beroda', params: { panjang: 160, tinggi: 170, dalam: 50, roda: true, ukuranRoda: '3' } },
        { label: 'Sempit', desc: '80 × 40 cm', params: { panjang: 80, tinggi: 150, dalam: 40 } },
      ],
    },
    {
      id: 'lemari',
      group: 'kamar',
      name: 'Lemari terbuka (kolom rak + gantungan)',
      desc: 'kolom rak lipatan di kiri, pipa gantungan ke tiang kanan',
      params: { model: 'lemari', panjang: 150, tinggi: 165, dalam: 45, lebarKolom: 40, rakBawah: true, tinggiRak: 12, roda: false },
      sizes: [
        { label: 'Kamar', desc: '150 cm, kolom 40', params: { panjang: 150, lebarKolom: 40, tinggi: 165 } },
        { label: 'Walk-in closet', desc: '200 cm, kolom 50', params: { panjang: 200, lebarKolom: 50, tinggi: 180, dalam: 50 } },
        { label: 'Kos kecil', desc: '110 cm, kolom 35', params: { panjang: 110, lebarKolom: 35, tinggi: 160, dalam: 40 } },
      ],
    },
  ],
  summary: (p) =>
    isM(p, 'lingkar')
      ? `cincin ${num(p, 'panjang')} cm · tinggi ${num(p, 'tinggi')} cm`
      : `${num(p, 'panjang')} × ${num(p, 'tinggi')} cm${bool(p, 'roda') && isM(p, 'gawang', 'kanopi', 'lemari') ? ' · beroda' : ''}`,

  build: (p) => {
    const model = str(p, 'model', 'gawang');
    const W = num(p, 'panjang', 120);
    const H = num(p, 'tinggi', 165);
    const D = num(p, 'dalam', 50);
    const L = (parseInt(str(p, 'pipa', '30')) || 30) / 10;
    const b = BOARD_THICK[str(p, 'papan', 'kayu')] ?? 2.5;
    const roda = bool(p, 'roda') && ['gawang', 'kanopi', 'lemari'].includes(model);
    const rakB = bool(p, 'rakBawah') && ['gawang', 'a', 'kanopi', 'lemari'].includes(model);
    const inch = parseInt(str(p, 'ukuranRoda', '3')) || 3;
    const c = roda ? casterHeight(inch) : 0;
    const t: [number, number] = [L * 10, L * 10];
    const rail: [number, number] = [20, 20];
    const thin: [number, number] = [15, 15];
    const rh = 2;
    const { list, add, line } = memberFactory();
    const boards: Board[] = [];
    const outW = W;
    let outD = D;
    let outH = H;
    let wall = false;
    let casterPts: [number, number][] = [];
    /** Satu tingkat kotak di as tiang (x0..x1, z0..z1) */
    const tier = (id: string, nm: string, x0: number, x1: number, z0: number, z1: number, y: number, withBoard: boolean) => {
      add(`${id}-depan`, 'x', x0 + L / 2, y, z1, x1 - x0 - L, 'rail-x', `Palang ${nm} depan`, rail);
      add(`${id}-belakang`, 'x', x0 + L / 2, y, z0, x1 - x0 - L, 'rail-x', `Palang ${nm} belakang`, rail);
      add(`${id}-kiri`, 'z', x0, y, z0 + L / 2, z1 - z0 - L, 'rail-z', `Palang ${nm} kiri`, rail);
      add(`${id}-kanan`, 'z', x1, y, z0 + L / 2, z1 - z0 - L, 'rail-z', `Palang ${nm} kanan`, rail);
      if (withBoard && b > 0) boards.push(board(`papan-${id}`, `Papan ${nm}`, x0 + L / 2, x1 - L / 2, y + rh / 2, y + rh / 2 + b, z0 - L / 2, z1 + L / 2));
    };

    if (model === 'gawang') {
      const zc = D / 2;
      const xs = [L / 2, W - L / 2];
      xs.forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        add(`kaki-${nm}`, 'z', x, c + L / 2, 0, D, 'rail-z', `Kaki melintang ${nm}`, t);
        add(`tiang-${nm}`, 'y', x, c + L, zc, H - c - L, 'post', `Tiang ${nm}`, t);
      });
      add('pipa-gantungan', 'x', L, H - L / 2, zc, W - 2 * L, 'rail-x', 'Pipa gantungan baju', t);
      if (rakB) {
        const y = c + num(p, 'tinggiRak', 20);
        xs.forEach((x, i) => add(`rak-samping-${i}`, 'z', x, y, 3, D - 6, 'rail-z', `Palang rak bawah ${i ? 'kanan' : 'kiri'}`, rail));
        // menempel ke muka palang samping (20×20, muka di x = L/2 ± 1)
        add('rak-depan', 'x', L / 2 + 1, y, D - 4, W - L - 2, 'rail-x', 'Palang rak bawah depan', rail);
        add('rak-belakang', 'x', L / 2 + 1, y, 4, W - L - 2, 'rail-x', 'Palang rak bawah belakang', rail);
        if (b > 0) boards.push(board('papan-rak', 'Papan rak bawah', L, W - L, y + 1, y + 1 + b, 3, D - 3));
      } else add('palang-bawah', 'x', L, c + 18, zc, W - 2 * L, 'rail-x', 'Palang bawah', rail);
      casterPts = xs.flatMap((x) => [3, D - 3].map((z) => [x, z] as [number, number]));
    } else if (model === 'a') {
      // Ujung rangka A: kaki depan & belakang miring bertemu di puncak, pipa gantungan duduk di puncak
      const zc = D / 2;
      const yA = H - L;
      const zl = (y: number) => L / 2 + ((zc - L / 2) * y) / yA; // as kaki belakang pada tinggi y
      [L / 2, W - L / 2].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        line(`kaki-${nm}-b`, [x, 0, L / 2], [x, yA, zc], 'post', `Kaki ${nm} belakang (miring)`, t);
        line(`kaki-${nm}-d`, [x, 0, D - L / 2], [x, yA, zc], 'post', `Kaki ${nm} depan (miring)`, t);
      });
      add('pipa-gantungan', 'x', 0, H - L / 2, zc, W, 'rail-x', 'Pipa gantungan baju (di puncak)', t);
      const y = rakB ? num(p, 'tinggiRak', 25) : 25;
      tier('bawah', rakB ? 'rak bawah' : 'bawah', L / 2, W - L / 2, zl(y), D - zl(y), y, rakB);
    } else if (model === 't') {
      // Tiang tunggal: kaki silang, lengan T selebar panjang, penguat miring
      const xc = W / 2;
      const zc = D / 2;
      const fw = Math.min(W, Math.max(D, 60));
      add('kaki-x', 'x', xc - fw / 2, L / 2, zc, fw, 'rail-x', 'Kaki silang kiri–kanan', t);
      add('kaki-z-b', 'z', xc, L / 2, 0, zc - L / 2, 'rail-z', 'Kaki silang belakang', t);
      add('kaki-z-d', 'z', xc, L / 2, zc + L / 2, D - zc - L / 2, 'rail-z', 'Kaki silang depan', t);
      add('tiang', 'y', xc, L, zc, H - 2 * L, 'post', 'Tiang tengah', t);
      add('lengan', 'x', 0, H - L / 2, zc, W, 'rail-x', 'Lengan gantungan (T)', t);
      [-1, 1].forEach((s, i) => {
        line(`penguat-${i}`, [xc + (s * L) / 2, H - 32, zc], [xc + s * Math.min(28, W / 2 - 8), H - L, zc], 'custom', `Penguat lengan ${i ? 'kanan' : 'kiri'}`, rail);
        add(`stop-${i}`, 'y', i ? W - 1 : 1, H, zc, 5, 'custom', `Penahan ujung lengan ${i ? 'kanan' : 'kiri'}`, thin);
      });
      outH = H + 5;
    } else if (model === 'lingkar') {
      // Cincin segi delapan di puncak tiang, 4 jari-jari, kaki silang
      const R = W / 2;
      const cc = R;
      const f = Math.max(D / 2, R * 0.8);
      outD = W;
      const yR = H - L / 2;
      add('kaki-x', 'x', cc - f, L / 2, cc, 2 * f, 'rail-x', 'Kaki silang kiri–kanan', t);
      add('kaki-z-b', 'z', cc, L / 2, cc - f, f - L / 2, 'rail-z', 'Kaki silang belakang', t);
      add('kaki-z-d', 'z', cc, L / 2, cc + L / 2, f - L / 2, 'rail-z', 'Kaki silang depan', t);
      add('tiang', 'y', cc, L, cc, H - 2 * L, 'post', 'Tiang tengah', t);
      const rr = R - L / 2;
      const v = Array.from({ length: 8 }, (_, k) => {
        const a = ((k * 45 + 22.5) * Math.PI) / 180;
        return [r1(cc + rr * Math.cos(a)), yR, r1(cc + rr * Math.sin(a))] as [number, number, number];
      });
      v.forEach((pt, k) => line(`cincin-${k + 1}`, pt, v[(k + 1) % 8], 'rail-x', `Cincin gantungan ruas ${k + 1}`, t));
      const rm = rr * Math.cos((22.5 * Math.PI) / 180);
      [0, 90, 180, 270].forEach((deg, k) => {
        const a = (deg * Math.PI) / 180;
        line(`jari-${k + 1}`, [cc + (L / 2) * Math.cos(a), yR, cc + (L / 2) * Math.sin(a)], [cc + rm * Math.cos(a), yR, cc + rm * Math.sin(a)], 'rail-z', `Jari-jari cincin ${k + 1}`, rail);
      });
    } else if (model === 'dinding') {
      // Siku tembok tiap ±80 cm: plat dinding + lengan papan + batang turun ke pipa gantungan
      wall = true;
      const yTop = H + 28;
      const ya = yTop - b - L / 2;
      const zr = Math.min(D - 5, Math.max(25, D * 0.6));
      const nb = Math.max(2, Math.ceil((W - 20) / 80) + 1);
      const xs = Array.from({ length: nb }, (_, i) => 10 + ((W - 20) * i) / (nb - 1));
      xs.forEach((x, i) => {
        add(`plat-${i}`, 'y', x, H - 28, L / 2, ya + L / 2 - (H - 28), 'post', `Plat siku dinding ${i + 1}`, t);
        add(`lengan-${i}`, 'z', x, ya, L, D - L - 2, 'rail-z', `Lengan papan ${i + 1}`, t);
        add(`turun-${i}`, 'y', x, H + L / 2, zr, ya - L / 2 - H - L / 2, 'custom', `Batang turun pipa gantungan ${i + 1}`, rail);
        line(`penguat-${i}`, [x, H - 26, L], [x, ya - L / 2, zr * 0.6], 'custom', `Penguat siku ${i + 1}`, rail);
      });
      add('pipa-gantungan', 'x', 4, H, zr, W - 8, 'rail-x', 'Pipa gantungan baju', t);
      if (b > 0) boards.push(board('papan-atas', 'Papan atas', 0, W, yTop - b, yTop, L, D));
      outH = yTop;
    } else if (model === 'kanopi') {
      // 4 tiang; rak atas penuh 25 cm di atas pipa gantungan; rak bawah
      const Ht = H + 25;
      const x0 = L / 2;
      const x1 = W - L / 2;
      const zb = L / 2;
      const zf = D - L / 2;
      [x0, x1].forEach((x, i) => [zb, zf].forEach((z, j) => add(`tiang-${i}-${j}`, 'y', x, c, z, Ht - c, 'post', `Tiang ${i ? 'kanan' : 'kiri'} ${j ? 'depan' : 'belakang'}`, t)));
      tier('atas', 'rak atas', x0, x1, zb, zf, Ht - rh / 2, true);
      [x0, x1].forEach((x, i) => add(`gantungan-samping-${i}`, 'z', x, H, L, D - 2 * L, 'rail-z', `Palang dudukan pipa gantungan ${i ? 'kanan' : 'kiri'}`, rail));
      add('pipa-gantungan', 'x', L / 2 + 1, H, D / 2, W - L - 2, 'rail-x', 'Pipa gantungan baju', t);
      tier('bawah', rakB ? 'rak bawah' : 'bawah', x0, x1, zb, zf, c + (rakB ? num(p, 'tinggiRak', 15) : 12), rakB);
      outH = Ht + b;
      casterPts = [[x0, zb], [x0, zf], [x1, zb], [x1, zf]];
    } else {
      // lemari: kolom rak di kiri (4 tiang), 2 tiang di kanan, pipa gantungan di antaranya
      const lw = Math.min(W - 40, num(p, 'lebarKolom', 40));
      const Ht = H + 20;
      const x0 = L / 2;
      const x1 = lw - L / 2;
      const xr = W - L / 2;
      const zb = L / 2;
      const zf = D - L / 2;
      [x0, x1, xr].forEach((x, i) => [zb, zf].forEach((z, j) => add(`tiang-${i}-${j}`, 'y', x, c, z, Ht - c, 'post', `Tiang ${i === 0 ? 'kolom kiri' : i === 1 ? 'kolom kanan' : 'ujung kanan'} ${j ? 'depan' : 'belakang'}`, t)));
      const ns = Math.max(3, Math.round((Ht - c - 15) / 35) + 1);
      for (let i = 0; i < ns; i++) tier(`kolom-${i + 1}`, `kolom rak ${i + 1}`, x0, x1, zb, zf, r1(c + 12 + ((Ht - c - 12 - rh / 2) * i) / (ns - 1)), true);
      const yLo = c + (rakB ? num(p, 'tinggiRak', 12) : 12);
      [yLo, Ht - rh / 2].forEach((y, k) => {
        const nm = k ? 'atas' : 'bawah';
        add(`ruang-${nm}-depan`, 'x', x1 + L / 2, y, zf, xr - x1 - L, 'rail-x', `Palang ${nm} ruang gantung depan`, rail);
        add(`ruang-${nm}-belakang`, 'x', x1 + L / 2, y, zb, xr - x1 - L, 'rail-x', `Palang ${nm} ruang gantung belakang`, rail);
        add(`ruang-${nm}-kanan`, 'z', xr, y, L, D - 2 * L, 'rail-z', `Palang ${nm} ujung kanan`, rail);
      });
      if (rakB) {
        add('ruang-bawah-kiri', 'z', x1, yLo, L, D - 2 * L, 'rail-z', 'Palang rak bawah kiri', rail);
        if (b > 0) boards.push(board('papan-rak-bawah', 'Papan rak bawah ruang gantung', x1 + L / 2, xr - L / 2, yLo + rh / 2, yLo + rh / 2 + b, 0, D));
      }
      [x1, xr].forEach((x, i) => add(`gantungan-samping-${i}`, 'z', x, H, L, D - 2 * L, 'rail-z', `Palang dudukan pipa gantungan ${i ? 'kanan' : 'kiri'}`, rail));
      add('pipa-gantungan', 'x', x1 + 1, H, D / 2, xr - x1 - 2, 'rail-x', 'Pipa gantungan baju', t);
      outH = Ht + b;
      casterPts = [[x0, zb], [x0, zf], [xr, zb], [xr, zf]];
    }

    const casters = roda ? casterPts.map(([x, z], i) => ({ id: `roda-${i}`, x, z, topY: c, sizeInch: inch, brake: true })) : [];
    return { members: list, boards, casters, W: outW, D: outD, H: outH, boardThick: 0, wall };
  },

  checks: (p) => {
    const out: ProductCheck[] = [];
    const model = str(p, 'model', 'gawang');
    const W = num(p, 'panjang');
    const H = num(p, 'tinggi');
    const D = num(p, 'dalam');
    if (['gawang', 'a', 't'].includes(model) && H / D > 3.8)
      out.push({ level: 'warn', message: 'Rak tinggi dengan kaki sempit mudah terguling saat baju menumpuk di satu sisi.', fix: { label: `Kaki ${Math.ceil(H / 3.5)} cm`, params: { dalam: Math.min(65, Math.ceil(H / 3.5)) } } });
    if (W > 150 && str(p, 'pipa') === '20' && model !== 'lingkar')
      out.push({ level: 'warn', message: 'Pipa gantungan 20×20 sepanjang ini melendut kalau penuh baju.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
    if (model === 't' && W > 130)
      out.push({ level: 'warn', message: 'Lengan T lebih dari 130 cm mudah membuat rak terguling bila baju hanya di satu sisi.', fix: { label: 'Lengan 110 cm', params: { panjang: 110 } } });
    if (model === 't') out.push({ level: 'info', message: 'Gantung baju seimbang di kedua lengan.' });
    if (model === 'lingkar' && W > 130)
      out.push({ level: 'warn', message: 'Cincin lebih dari 130 cm butuh kaki tambahan supaya tidak oleng.', fix: { label: 'Cincin 120 cm', params: { panjang: 120 } } });
    if (model === 'lingkar' && H > 170)
      out.push({ level: 'warn', message: 'Cincin putar terlalu tinggi: baju sulit dijangkau dan rak jadi oleng.', fix: { label: 'Tinggi 150 cm', params: { tinggi: 150 } } });
    if (model === 'lemari' && W - num(p, 'lebarKolom') < 50)
      out.push({ level: 'warn', message: 'Ruang gantung kurang dari 50 cm, hanya muat sedikit baju.', fix: { label: `Panjang ${Math.min(200, num(p, 'lebarKolom') + 90)} cm`, params: { panjang: Math.min(200, num(p, 'lebarKolom') + 90) } } });
    if (model === 'dinding') out.push({ level: 'info', message: 'Siku dibaut ke tembok bata / beton dengan fischer minimal 2 titik per siku.' });
    if ((model === 'kanopi' || model === 'lemari') && D < 40)
      out.push({ level: 'warn', message: 'Kedalaman di bawah 40 cm: gantungan baju (±45 cm) menabrak tiang.', fix: { label: 'Kedalaman 45 cm', params: { dalam: 45 } } });
    const n = model === 'lingkar' ? Math.floor((Math.PI * W) / 2.5) : model === 'lemari' ? Math.floor((W - num(p, 'lebarKolom')) / 2.5) : Math.floor(W / 2.5);
    out.push({ level: 'info', message: `Muat ±${n} gantungan baju.` });
    return out;
  },
};
