import { Board, Params, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, CASTER_OPTIONS, board, bool, casterHeight, casterSet, materialParams, memberFactory, num, r1, str } from './common';

/**
 * Rak berdiri. Bentuk rangka (param `model`):
 * - tegak: 4 tiang (+ tiang sekat), tiap tingkat 4 palang + papan
 * - tangga: tiang depan miring, makin ke atas makin dangkal, bersandar tembok
 * - a: rangka A dua muka, kaki depan & belakang sama-sama miring bertemu di atas
 * - tulang: rak buku tulang tengah, 2 tiang di tengah, papan bergantian kiri–kanan
 * - sudut: rak siku L di pojok ruangan, 6 tiang, papan dua sayap
 * - palet: rak gudang berat, rangka samping berpalang zig-zag, balok 20×40 tanpa palang samping
 * - kantilever: tiang tengah + lengan menjulur ke depan & belakang, untuk pipa / papan panjang
 * - dapur: bawah dalam setinggi meja, atas dangkal (rak dapur / baker's rack)
 * - sepatu: tingkat miring ke depan dengan penahan tumit, atas datar
 * - bangku: bangku duduk + rak sepatu, tiang belakang tinggi dengan kait & rak topi
 */
const MODELS = [
  { value: 'tegak', label: 'Tegak', desc: 'Semua tingkat sama dalam' },
  { value: 'tangga', label: 'Tangga bersandar', desc: 'Makin ke atas makin dangkal, menempel tembok' },
  { value: 'a', label: 'Rangka A dua muka', desc: 'Kaki miring depan & belakang, bisa diambil dari dua sisi' },
  { value: 'tulang', label: 'Tulang tengah', desc: 'Tiang di tengah, papan bergantian kiri–kanan' },
  { value: 'sudut', label: 'Siku L (pojok)', desc: 'Dua sayap mengisi pojok ruangan' },
  { value: 'palet', label: 'Gudang berat (zig-zag)', desc: 'Rangka samping berpalang zig-zag, balok 20×40' },
  { value: 'kantilever', label: 'Kantilever', desc: 'Lengan menjulur dari tiang tengah, untuk barang panjang' },
  { value: 'dapur', label: 'Dapur (bawah dalam, atas dangkal)', desc: 'Meja kerja setinggi pinggang + rak atas' },
  { value: 'sepatu', label: 'Sepatu miring', desc: 'Tingkat miring ke depan + penahan tumit' },
  { value: 'bangku', label: 'Bangku + gantungan', desc: 'Duduk pakai sepatu, kait & rak topi di atas' },
];
const isM = (p: Params, ...m: string[]) => m.includes(str(p, 'model', 'tegak'));
const DEG = Math.PI / 180;

export const RAK: ProductDef = {
  id: 'rak',
  name: 'Rak',
  tagline: 'buku · gudang · sepatu · dapur',
  icon: 'M14 4v32M46 4v32M14 12h32M14 22h32M14 32h32',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['model', 'panjang', 'dalam', 'tinggi', 'panjangSayap'] },
    { id: 'bentuk', title: 'Bentuk', keys: ['dalamAtas', 'tinggiMeja', 'tinggiDuduk', 'tingkat', 'tinggiBawah', 'kolom', 'palang'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Tambahan', keys: ['roda', 'ukuranRoda', 'remRoda'] },
  ],
  params: [
    { key: 'model', label: 'Bentuk rak', type: 'choice', options: MODELS },
    { key: 'panjang', label: 'Panjang', type: 'number', unit: 'cm', min: 30, max: 240, step: 1, help: 'Lebar rak dilihat dari depan.', marks: [{ value: 60, label: 'sepatu' }, { value: 80, label: 'buku' }, { value: 120, label: 'gudang' }] },
    { key: 'dalam', label: 'Kedalaman', type: 'number', unit: 'cm', min: 15, max: 100, step: 1, help: 'Jarak depan ke belakang (rangka A & kantilever: total dua sisi).', marks: [{ value: 30, label: 'buku / sepatu' }, { value: 50, label: 'gudang' }] },
    { key: 'tinggi', label: 'Tinggi rangka', type: 'number', unit: 'cm', min: 30, max: 220, step: 1, help: 'Dari lantai sampai ujung atas tiang.', marks: [{ value: 75, label: 'sepatu' }, { value: 180, label: 'buku' }, { value: 200, label: 'gudang' }] },
    { key: 'panjangSayap', label: 'Panjang sayap samping', type: 'number', unit: 'cm', min: 50, max: 200, step: 1, help: 'Panjang rak di tembok kedua, diukur dari pojok.', showIf: (p) => p.model === 'sudut' },
    { key: 'dalamAtas', label: 'Kedalaman bagian atas', type: 'number', unit: 'cm', min: 12, max: 40, step: 1, showIf: (p) => p.model === 'tangga' || p.model === 'a' || p.model === 'dapur' },
    { key: 'tinggiMeja', label: 'Tinggi meja kerja', type: 'number', unit: 'cm', min: 70, max: 100, step: 1, help: 'Tingkat dalam untuk kompor kecil / microwave / meracik.', marks: [{ value: 85, label: 'standar dapur' }], showIf: (p) => p.model === 'dapur' },
    { key: 'tinggiDuduk', label: 'Tinggi dudukan', type: 'number', unit: 'cm', min: 38, max: 50, step: 1, marks: [{ value: 45, label: 'standar' }], showIf: (p) => p.model === 'bangku' },
    { key: 'kolom', label: 'Jumlah kolom (sekat)', type: 'number', unit: 'kolom', min: 1, max: 4, step: 1, help: 'Tiang tengah membagi rak jadi beberapa kolom; papan tidak terlalu panjang.', showIf: (p) => ['tegak', 'tangga', 'palet', 'kantilever'].includes(String(p.model)) },
    { key: 'tingkat', label: 'Jumlah tingkat', type: 'number', unit: 'tingkat', min: 2, max: 8, step: 1, help: 'Termasuk tingkat paling bawah dan paling atas.', showIf: (p) => p.model !== 'bangku' },
    { key: 'tinggiBawah', label: 'Tinggi tingkat terbawah', type: 'number', unit: 'cm', min: 3, max: 40, step: 1, help: 'Jarak dari lantai, supaya mudah disapu.' },
    { key: 'palang', label: 'Pipa penyangga papan', type: 'choice', options: [{ value: '20x20', label: '20×20 mm', desc: 'Ringan, ±50 kg per tingkat sampai 100 cm' }, { value: '20x40', label: '20×40 mm', desc: 'Kuat, untuk rak panjang / berat' }] },
    ...materialParams(true),
    { key: 'roda', label: 'Pakai roda', type: 'toggle', help: 'Rak bisa dipindah-pindah.', showIf: (p) => p.model === 'tegak' },
    { key: 'ukuranRoda', label: 'Ukuran roda', type: 'choice', options: CASTER_OPTIONS, showIf: (p) => p.model === 'tegak' && p.roda === true },
    { key: 'remRoda', label: 'Roda dengan rem', type: 'toggle', showIf: (p) => p.model === 'tegak' && p.roda === true },
  ],
  defaults: {
    panjang: 80, dalam: 30, tinggi: 180, tingkat: 5, tinggiBawah: 8, palang: '20x20', model: 'tegak', dalamAtas: 20, kolom: 1,
    panjangSayap: 90, tinggiMeja: 85, tinggiDuduk: 45,
    pipa: '30', papan: 'kayu', warna: '#1f2226', roda: false, ukuranRoda: '3', remRoda: true,
  },
  groups: [
    { id: 'rak-buku', name: 'Rak buku & display', desc: 'Ruang tamu, kamar, toko, cafe' },
    { id: 'rak-gudang', name: 'Rak gudang', desc: 'Barang berat, pipa & papan panjang, pojok gudang' },
    { id: 'rak-sepatu', name: 'Rak sepatu & pintu masuk', desc: 'Teras, pintu masuk' },
  ],
  signature: (p) => `rak:${str(p, 'model', 'tegak')}`,
  presets: [
    {
      id: 'susun',
      group: 'rak-buku',
      name: 'Rak susun tegak',
      desc: '4 tiang tegak, papan di setiap tingkat; bisa bersekat & beroda',
      params: { model: 'tegak', kolom: 1, roda: false },
      sizes: [
        { label: 'Buku', desc: '80 × 30 × 180 cm, 5 tingkat', params: { panjang: 80, dalam: 30, tinggi: 180, tingkat: 5, tinggiBawah: 8, palang: '20x20', pipa: '30' } },
        { label: 'Buku besar 2 kolom', desc: '160 × 30 × 180, 5 tingkat', params: { panjang: 160, dalam: 30, tinggi: 180, tingkat: 5, tinggiBawah: 8, kolom: 2, pipa: '30' } },
        { label: 'Gudang 3 kolom', desc: '240 × 50 × 200, 4 tingkat', params: { panjang: 240, dalam: 50, tinggi: 200, tingkat: 4, tinggiBawah: 10, kolom: 3, palang: '20x40', pipa: '40' } },
        { label: 'Display toko', desc: '180 × 40 × 160, 3 kolom', params: { panjang: 180, dalam: 40, tinggi: 160, tingkat: 4, tinggiBawah: 10, kolom: 3, pipa: '30' } },
        { label: 'Dapur / microwave', desc: '60 × 40 × 120 cm, 3 tingkat', params: { panjang: 60, dalam: 40, tinggi: 120, tingkat: 3, tinggiBawah: 10, pipa: '30' } },
        { label: 'Dapur dorong (roda)', desc: '60 × 40 × 90 cm, 3 tingkat', params: { panjang: 60, dalam: 40, tinggi: 90, tingkat: 3, tinggiBawah: 5, pipa: '30', roda: true, ukuranRoda: '3' } },
        { label: 'Gudang dorong (roda)', desc: '100 × 50 × 120 cm', params: { panjang: 100, dalam: 50, tinggi: 120, tingkat: 3, tinggiBawah: 5, palang: '20x40', pipa: '40', roda: true, ukuranRoda: '4' } },
      ],
    },
    {
      id: 'tangga',
      group: 'rak-buku',
      name: 'Rak tangga bersandar tembok',
      desc: 'tiang depan miring, makin ke atas makin dangkal',
      params: { model: 'tangga', kolom: 1, roda: false, panjang: 70, dalam: 40, dalamAtas: 20, tinggi: 180, tingkat: 5, tinggiBawah: 10 },
      sizes: [
        { label: 'Rak buku tangga', desc: '70 × 40 × 180, atas 20 cm', params: { panjang: 70, dalam: 40, dalamAtas: 20, tinggi: 180, tingkat: 5, tinggiBawah: 10, pipa: '30' } },
        { label: 'Rak tanaman tangga', desc: '80 × 45 × 120, atas 20 cm', params: { panjang: 80, dalam: 45, dalamAtas: 20, tinggi: 120, tingkat: 3, tinggiBawah: 15, pipa: '20' } },
      ],
    },
    {
      id: 'rangka-a',
      group: 'rak-buku',
      name: 'Rak rangka A dua muka',
      desc: 'kaki depan & belakang miring bertemu di atas, papan melebar ke bawah',
      params: { model: 'a', panjang: 90, dalam: 60, dalamAtas: 18, tinggi: 150, tingkat: 4, tinggiBawah: 10, pipa: '30' },
      sizes: [
        { label: 'Tengah ruangan / toko', desc: '90 × 60 × 150, 4 tingkat', params: { panjang: 90, dalam: 60, dalamAtas: 18, tinggi: 150, tingkat: 4 } },
        { label: 'Display buah / roti', desc: '120 × 70 × 120, 3 tingkat', params: { panjang: 120, dalam: 70, dalamAtas: 20, tinggi: 120, tingkat: 3, palang: '20x40' } },
        { label: 'Rak tanaman A', desc: '80 × 60 × 110, 3 tingkat', params: { panjang: 80, dalam: 60, dalamAtas: 16, tinggi: 110, tingkat: 3, tinggiBawah: 15, pipa: '20' } },
      ],
    },
    {
      id: 'tulang',
      group: 'rak-buku',
      name: 'Rak buku tulang tengah',
      desc: 'dua tiang di tengah, papan menjulur bergantian kiri & kanan',
      params: { model: 'tulang', panjang: 100, dalam: 28, tinggi: 170, tingkat: 6, tinggiBawah: 6, pipa: '30' },
      sizes: [
        { label: 'Ruang tamu', desc: '100 × 28 × 170, 6 tingkat', params: { panjang: 100, dalam: 28, tinggi: 170, tingkat: 6 } },
        { label: 'Pendek samping sofa', desc: '80 × 25 × 110, 4 tingkat', params: { panjang: 80, dalam: 25, tinggi: 110, tingkat: 4 } },
      ],
    },
    {
      id: 'palet',
      group: 'rak-gudang',
      name: 'Rak gudang berat (rangka zig-zag)',
      desc: 'rangka samping berpalang zig-zag, balok 20×40 depan-belakang',
      params: { model: 'palet', panjang: 150, dalam: 60, tinggi: 200, tingkat: 4, tinggiBawah: 12, kolom: 1, palang: '20x40', pipa: '40' },
      sizes: [
        { label: 'Gudang 150', desc: '150 × 60 × 200, 4 tingkat', params: { panjang: 150, dalam: 60, tinggi: 200, tingkat: 4, kolom: 1 } },
        { label: 'Gudang 2 kolom', desc: '240 × 60 × 200, 4 tingkat', params: { panjang: 240, dalam: 60, tinggi: 200, tingkat: 4, kolom: 2 } },
        { label: 'Toko bangunan / sparepart', desc: '120 × 50 × 180, 5 tingkat', params: { panjang: 120, dalam: 50, tinggi: 180, tingkat: 5, kolom: 1 } },
      ],
    },
    {
      id: 'kantilever',
      group: 'rak-gudang',
      name: 'Rak kantilever (lengan)',
      desc: 'tiang tengah + lengan menjulur depan-belakang, tanpa tiang depan',
      params: { model: 'kantilever', panjang: 200, dalam: 80, tinggi: 200, tingkat: 4, tinggiBawah: 30, kolom: 2, palang: '20x40', pipa: '40', papan: 'none' },
      sizes: [
        { label: 'Pipa / besi batangan', desc: '200 × 80 × 200, 3 tiang', params: { panjang: 200, dalam: 80, tinggi: 200, tingkat: 4, kolom: 2 } },
        { label: 'Papan kayu / triplek', desc: '240 × 100 × 180, 3 tiang', params: { panjang: 240, dalam: 100, tinggi: 180, tingkat: 4, kolom: 2 } },
        { label: 'Bengkel kecil', desc: '120 × 60 × 150, 2 tiang', params: { panjang: 120, dalam: 60, tinggi: 150, tingkat: 3, kolom: 1 } },
      ],
    },
    {
      id: 'sudut',
      group: 'rak-gudang',
      name: 'Rak siku L (pojok)',
      desc: 'dua sayap rak bertemu di pojok, 6 tiang',
      params: { model: 'sudut', panjang: 120, panjangSayap: 100, dalam: 40, tinggi: 180, tingkat: 5, tinggiBawah: 10, palang: '20x40', pipa: '30' },
      sizes: [
        { label: 'Pojok gudang', desc: '120 + 100 × 40 × 180', params: { panjang: 120, panjangSayap: 100, dalam: 40, tinggi: 180, tingkat: 5 } },
        { label: 'Pojok dapur', desc: '90 + 70 × 35 × 150', params: { panjang: 90, panjangSayap: 70, dalam: 35, tinggi: 150, tingkat: 4, palang: '20x20' } },
        { label: 'Pojok toko', desc: '150 + 150 × 40 × 200', params: { panjang: 150, panjangSayap: 150, dalam: 40, tinggi: 200, tingkat: 5 } },
      ],
    },
    {
      id: 'sepatu-miring',
      group: 'rak-sepatu',
      name: 'Rak sepatu miring',
      desc: 'tingkat miring 20° ke depan dari batang + penahan tumit, atas datar',
      params: { model: 'sepatu', panjang: 80, dalam: 32, tinggi: 80, tingkat: 4, tinggiBawah: 6, pipa: '20', papan: 'none' },
      sizes: [
        { label: '4 susun', desc: '80 × 32 × 80 cm', params: { panjang: 80, dalam: 32, tinggi: 80, tingkat: 4 } },
        { label: 'Keluarga besar', desc: '100 × 32 × 110 cm, 5 susun', params: { panjang: 100, dalam: 32, tinggi: 110, tingkat: 5 } },
        { label: 'Pendek 3 susun', desc: '60 × 30 × 60 cm', params: { panjang: 60, dalam: 30, tinggi: 60, tingkat: 3 } },
        { label: 'Dengan papan', desc: '80 × 32 × 80 cm, papan kayu miring', params: { panjang: 80, dalam: 32, tinggi: 80, tingkat: 4, papan: 'kayu' } },
      ],
    },
    {
      id: 'bangku-gantung',
      group: 'rak-sepatu',
      name: 'Bangku sepatu + gantungan',
      desc: 'bangku duduk & rak sepatu, tiang belakang tinggi dengan kait dan rak topi',
      params: { model: 'bangku', panjang: 90, dalam: 35, tinggi: 180, tinggiDuduk: 45, tinggiBawah: 8, pipa: '30' },
      sizes: [
        { label: 'Pintu masuk', desc: '90 × 35 × 180 cm', params: { panjang: 90, dalam: 35, tinggi: 180 } },
        { label: 'Lebar', desc: '120 × 38 × 185 cm', params: { panjang: 120, dalam: 38, tinggi: 185, palang: '20x40' } },
      ],
    },
  ],
  summary: (p) =>
    isM(p, 'bangku')
      ? `${num(p, 'panjang')} × ${num(p, 'dalam')} × ${num(p, 'tinggi')} cm · bangku ${num(p, 'tinggiDuduk')} cm`
      : `${num(p, 'panjang')}${isM(p, 'sudut') ? ` + ${num(p, 'panjangSayap')}` : ''} × ${num(p, 'dalam')} × ${num(p, 'tinggi')} cm · ${num(p, 'tingkat')} tingkat`,

  build: (p) => {
    const model = str(p, 'model', 'tegak');
    const W = num(p, 'panjang', 80);
    const D = num(p, 'dalam', 30);
    const H = num(p, 'tinggi', 180);
    const n = Math.max(2, Math.round(num(p, 'tingkat', 4)));
    const L = (parseInt(str(p, 'pipa', '30')) || 30) / 10;
    const rail: [number, number] = str(p, 'palang') === '20x40' ? [20, 40] : [20, 20];
    const rh = rail[1] / 10;
    const b = BOARD_THICK[str(p, 'papan', 'multiplek')] ?? 1.8;
    const roda = bool(p, 'roda') && model === 'tegak';
    const inch = parseInt(str(p, 'ukuranRoda', '3')) || 3;
    const c = roda ? casterHeight(inch) : 0;
    const pt: [number, number] = [L * 10, L * 10];
    const thin: [number, number] = [20, 20];
    const k = Math.max(1, Math.round(num(p, 'kolom', 1)));
    const zb = L / 2;
    const zfBot = D - L / 2;
    const yBottom = c + Math.max(num(p, 'tinggiBawah', 8), rh / 2);
    const yTopLvl = H - rh / 2;
    const levels = (cnt: number, y0 = yBottom, y1 = yTopLvl) => Array.from({ length: cnt }, (_, i) => r1(cnt === 1 ? y1 : y0 + ((y1 - y0) * i) / (cnt - 1)));
    const xsCol = Array.from({ length: k + 1 }, (_, j) => (j === 0 ? L / 2 : j === k ? W - L / 2 : (W * j) / k));

    const { list, add, line } = memberFactory();
    const boards: Board[] = [];
    const post = (id: string, nm: string, x: number, z: number, y0: number, y1: number) => add(id, 'y', x, y0, z, y1 - y0, 'post', nm, pt);
    /** Satu tingkat kotak: palang keliling di as tiang (x0..x1, z0..z1) + papan di atasnya */
    const tier = (id: string, nm: string, x0: number, x1: number, z0: number, z1: number, y: number, withBoard = true) => {
      add(`${id}-depan`, 'x', x0 + L / 2, y, z1, x1 - x0 - L, 'rail-x', `Palang ${nm} depan`, rail);
      add(`${id}-belakang`, 'x', x0 + L / 2, y, z0, x1 - x0 - L, 'rail-x', `Palang ${nm} belakang`, rail);
      add(`${id}-kiri`, 'z', x0, y, z0 + L / 2, z1 - z0 - L, 'rail-z', `Palang ${nm} kiri`, rail);
      add(`${id}-kanan`, 'z', x1, y, z0 + L / 2, z1 - z0 - L, 'rail-z', `Palang ${nm} kanan`, rail);
      if (b > 0 && withBoard) boards.push(board(`papan-${id}`, `Papan ${nm}`, x0 + L / 2, x1 - L / 2, y + rh / 2, y + rh / 2 + b, z0 - L / 2, z1 + L / 2));
    };
    let outH = H + (b > 0 ? b : 0);
    let outD = D;

    if (model === 'tegak' || model === 'tangga') {
      const tangga = model === 'tangga';
      const zfTop = tangga ? Math.max(L + 4, num(p, 'dalamAtas', 20)) - L / 2 : zfBot;
      /** as tiang depan pada ketinggian y (rak tangga: miring ke belakang) */
      const zfAt = (y: number) => zfBot + ((zfTop - zfBot) * (y - c)) / Math.max(1, H - c);
      xsCol.forEach((x, j) => {
        const nm = j === 0 ? 'kiri' : j === k ? 'kanan' : `sekat ${j}`;
        const id = j === 0 || j === k ? `tiang-${j ? 'kanan' : 'kiri'}` : `sekat-${j}`;
        add(`${id}-b`, 'y', x, c, zb, H - c, 'post', `Tiang ${nm} belakang`, pt);
        line(`${id}-d`, [x, c, zfBot], [x, H, zfTop], 'post', `Tiang ${nm} depan`, pt);
      });
      levels(n).forEach((y, i) => {
        const t = i + 1;
        const zf = zfAt(y);
        add(`t${t}-depan`, 'x', L, y, zf, W - 2 * L, 'rail-x', `Palang tingkat ${t} depan`, rail);
        add(`t${t}-belakang`, 'x', L, y, zb, W - 2 * L, 'rail-x', `Palang tingkat ${t} belakang`, rail);
        xsCol.forEach((x, j) => add(`t${t}-${j === 0 || j === k ? `samping-${j ? 'kanan' : 'kiri'}` : `sekat-${j}`}`, 'z', x, y, L, zf - L / 2 - L, 'rail-z', `Palang tingkat ${t} ${j === 0 ? 'kiri' : j === k ? 'kanan' : `sekat ${j}`}`, rail));
        if (b > 0)
          for (let j = 0; j < k; j++) {
            const x0 = j === 0 ? L : xsCol[j] + L / 2;
            const x1 = j === k - 1 ? W - L : xsCol[j + 1] - L / 2;
            boards.push(board(`papan-${t}-${j + 1}`, `Papan tingkat ${t}${k > 1 ? ` kolom ${j + 1}` : ''}`, x0, x1, y + rh / 2, y + rh / 2 + b, 0, zf + L / 2));
          }
      });
    } else if (model === 'a') {
      // Rangka A: kaki belakang & depan miring simetris, bertemu selebar dalamAtas di puncak
      const top = Math.min(D - 10, Math.max(L + 6, num(p, 'dalamAtas', 18)));
      const zbAt = (y: number) => L / 2 + ((D - top) / 2) * (y / H);
      const zfAt = (y: number) => D - zbAt(y);
      [L / 2, W - L / 2].forEach((x, j) => {
        const nm = j ? 'kanan' : 'kiri';
        line(`kaki-${nm}-b`, [x, 0, zbAt(0)], [x, H, zbAt(H)], 'post', `Kaki ${nm} belakang (miring)`, pt);
        line(`kaki-${nm}-d`, [x, 0, zfAt(0)], [x, H, zfAt(H)], 'post', `Kaki ${nm} depan (miring)`, pt);
      });
      levels(n).forEach((y, i) => tier(`t${i + 1}`, `tingkat ${i + 1}`, L / 2, W - L / 2, zbAt(y), zfAt(y), y));
    } else if (model === 'tulang') {
      // Tulang tengah: 2 tiang di x tengah (belakang & depan), alas rangka lantai, papan bergantian kiri / kanan
      const xc = W / 2;
      const zf = zfBot;
      add('alas-belakang', 'x', 0, L / 2, zb, W, 'rail-x', 'Alas lantai belakang', pt);
      add('alas-depan', 'x', 0, L / 2, zf, W, 'rail-x', 'Alas lantai depan', pt);
      add('alas-kiri', 'z', L / 2, L / 2, L, D - 2 * L, 'rail-z', 'Alas lantai kiri', pt);
      add('alas-kanan', 'z', W - L / 2, L / 2, L, D - 2 * L, 'rail-z', 'Alas lantai kanan', pt);
      post('tulang-b', 'Tiang tulang belakang', xc, zb, L, H);
      post('tulang-d', 'Tiang tulang depan', xc, zf, L, H);
      add('tulang-atas', 'z', xc, H - L / 2, L, D - 2 * L, 'rail-z', 'Palang atas tulang', pt);
      if (b > 0) boards.push(board('papan-dasar', 'Papan dasar', L, W - L, L, L + b, 0, D));
      const ys = levels(n - 1, Math.max(yBottom, L + b + 20), yTopLvl - 1);
      ys.forEach((y, i) => {
        const t = i + 1;
        const left = i % 2 === 0;
        const xe = left ? L / 2 : W - L / 2; // ujung luar
        const x0 = left ? xe : xc + L / 2;
        const len = xc - L / 2 - L / 2;
        const sd = left ? 'kiri' : 'kanan';
        add(`t${t}-belakang`, 'x', x0, y, zb, len, 'rail-x', `Lengan tingkat ${t} ${sd} belakang`, rail);
        add(`t${t}-depan`, 'x', x0, y, zf, len, 'rail-x', `Lengan tingkat ${t} ${sd} depan`, rail);
        add(`t${t}-ujung`, 'z', xe, y, zb + 1, zf - zb - 2, 'rail-z', `Palang ujung tingkat ${t}`, rail);
        // penahan buku di ujung luar
        add(`t${t}-penahan-b`, 'y', xe, y + rh / 2, zb, 14, 'custom', `Penahan buku tingkat ${t} belakang`, thin);
        add(`t${t}-penahan-d`, 'y', xe, y + rh / 2, zf, 14, 'custom', `Penahan buku tingkat ${t} depan`, thin);
        add(`t${t}-penahan-atas`, 'z', xe, y + rh / 2 + 15, zb - 1, zf - zb + 2, 'rail-z', `Penahan buku tingkat ${t} atas`, thin);
        if (b > 0) boards.push(board(`papan-${t}`, `Papan tingkat ${t} ${sd}`, left ? xe + 1 : xc + L / 2, left ? xc - L / 2 : xe - 1, y + rh / 2, y + rh / 2 + b, 0, D));
      });
    } else if (model === 'sudut') {
      // Siku L: sayap A sepanjang x (tembok belakang), sayap B sepanjang z (tembok kiri)
      const Z = Math.max(D + 20, num(p, 'panjangSayap', 90));
      outD = Z;
      const zf = zfBot;
      const xin = D - L / 2;
      post('tiang-pojok', 'Tiang pojok belakang', L / 2, zb, 0, H);
      post('tiang-a-belakang', 'Tiang ujung kanan belakang', W - L / 2, zb, 0, H);
      post('tiang-a-depan', 'Tiang ujung kanan depan', W - L / 2, zf, 0, H);
      post('tiang-dalam', 'Tiang pojok dalam', xin, zf, 0, H);
      post('tiang-b-kiri', 'Tiang ujung sayap kiri', L / 2, Z - L / 2, 0, H);
      post('tiang-b-dalam', 'Tiang ujung sayap dalam', xin, Z - L / 2, 0, H);
      levels(n).forEach((y, i) => {
        const t = i + 1;
        add(`t${t}-a-belakang`, 'x', L, y, zb, W - 2 * L, 'rail-x', `Palang tingkat ${t} belakang`, rail);
        add(`t${t}-a-depan`, 'x', xin + L / 2, y, zf, W - L - xin - L / 2, 'rail-x', `Palang tingkat ${t} depan`, rail);
        add(`t${t}-a-kanan`, 'z', W - L / 2, y, L, zf - L / 2 - L, 'rail-z', `Palang tingkat ${t} kanan`, rail);
        add(`t${t}-b-kiri`, 'z', L / 2, y, L, Z - 2 * L, 'rail-z', `Palang tingkat ${t} sayap kiri`, rail);
        add(`t${t}-b-dalam`, 'z', xin, y, zf + L / 2, Z - L - zf - L / 2, 'rail-z', `Palang tingkat ${t} sayap dalam`, rail);
        add(`t${t}-b-ujung`, 'x', L, y, Z - L / 2, xin - L / 2 - L, 'rail-x', `Palang tingkat ${t} ujung sayap`, rail);
        if (b > 0) {
          boards.push(board(`papan-${t}-a`, `Papan tingkat ${t} sayap belakang`, L, W - L, y + rh / 2, y + rh / 2 + b, 0, D - L));
          boards.push(board(`papan-${t}-b`, `Papan tingkat ${t} sayap kiri`, 0, D - L, y + rh / 2, y + rh / 2 + b, D - L, Z - L));
        }
      });
    } else if (model === 'palet') {
      // Rangka samping (per sekat) dengan palang zig-zag; balok depan-belakang per tingkat
      const zf = zfBot;
      const yLo = 8;
      const yHi = H - 6;
      const seg = Math.max(2, Math.round((yHi - yLo) / Math.max(30, D * 1.1)));
      xsCol.forEach((x, j) => {
        const nm = j === 0 ? 'kiri' : j === k ? 'kanan' : `tengah ${j}`;
        post(`rangka-${j}-b`, `Tiang rangka ${nm} belakang`, x, zb, 0, H);
        post(`rangka-${j}-d`, `Tiang rangka ${nm} depan`, x, zf, 0, H);
        add(`rangka-${j}-bawah`, 'z', x, yLo, zb + L / 2, zf - zb - L, 'rail-z', `Palang rangka ${nm} bawah`, thin);
        add(`rangka-${j}-atas`, 'z', x, yHi, zb + L / 2, zf - zb - L, 'rail-z', `Palang rangka ${nm} atas`, thin);
        for (let s = 0; s < seg; s++) {
          const ya = yLo + ((yHi - yLo) * s) / seg;
          const yb2 = yLo + ((yHi - yLo) * (s + 1)) / seg;
          const a: [number, number, number] = s % 2 ? [x, ya, zf - L / 2] : [x, ya, zb + L / 2];
          const bb: [number, number, number] = s % 2 ? [x, yb2, zb + L / 2] : [x, yb2, zf - L / 2];
          line(`rangka-${j}-zigzag-${s + 1}`, a, bb, 'custom', `Palang zig-zag rangka ${nm} ${s + 1}`, thin);
        }
      });
      levels(n).forEach((y, i) => {
        const t = i + 1;
        for (let j = 0; j < k; j++) {
          const x0 = xsCol[j] + L / 2;
          const len = xsCol[j + 1] - xsCol[j] - L;
          const kk = k > 1 ? ` kolom ${j + 1}` : '';
          add(`t${t}-${j}-balok-d`, 'x', x0, y, zf, len, 'rail-x', `Balok tingkat ${t}${kk} depan`, rail);
          add(`t${t}-${j}-balok-b`, 'x', x0, y, zb, len, 'rail-x', `Balok tingkat ${t}${kk} belakang`, rail);
          add(`t${t}-${j}-penyangga`, 'z', (xsCol[j] + xsCol[j + 1]) / 2, y, zb + 1, zf - zb - 2, 'rail-z', `Penyangga papan tingkat ${t}${kk}`, thin);
          if (b > 0) boards.push(board(`papan-${t}-${j + 1}`, `Papan tingkat ${t}${kk}`, x0, x0 + len, y + rh / 2, y + rh / 2 + b, 0, D));
        }
      });
    } else if (model === 'kantilever') {
      // Menara tiang tengah: kaki dasar sepanjang kedalaman, lengan menjulur depan & belakang
      const zc = D / 2;
      const arm: [number, number] = [20, 40];
      xsCol.forEach((x, j) => {
        const nm = j === 0 ? 'kiri' : j === k ? 'kanan' : `tengah ${j}`;
        add(`kaki-${j}`, 'z', x, L / 2, 0, D, 'rail-z', `Kaki dasar ${nm}`, pt);
        post(`tiang-${j}`, `Tiang ${nm}`, x, zc, L, H);
        levels(n, Math.max(yBottom, L + 10), H - 6).forEach((y, i) => {
          const t = i + 1;
          add(`lengan-${j}-t${t}-d`, 'z', x, y, zc + L / 2, D - zc - L / 2 - 1, 'rail-z', `Lengan ${nm} tingkat ${t} depan`, arm);
          add(`lengan-${j}-t${t}-b`, 'z', x, y, 1, zc - L / 2 - 1, 'rail-z', `Lengan ${nm} tingkat ${t} belakang`, arm);
          add(`stop-${j}-t${t}-d`, 'y', x, y + 2, D - 2, 6, 'custom', `Stopper ujung lengan ${nm} tingkat ${t} depan`, thin);
          add(`stop-${j}-t${t}-b`, 'y', x, y + 2, 2, 6, 'custom', `Stopper ujung lengan ${nm} tingkat ${t} belakang`, thin);
        });
      });
      for (let j = 0; j < k; j++) {
        const x0 = xsCol[j] + L / 2;
        const x1 = xsCol[j + 1] - L / 2;
        add(`ikat-${j}-atas`, 'x', x0, H - L / 2, zc, x1 - x0, 'rail-x', `Palang ikat atas ${j + 1}`, pt);
        add(`ikat-${j}-bawah`, 'x', x0, L + 15, zc, x1 - x0, 'rail-x', `Palang ikat bawah ${j + 1}`, pt);
        line(`silang-${j}-a`, [x0, L + 17, zc], [x1, H - L - 2, zc], 'custom', `Palang silang ${j + 1} a`, thin);
        line(`silang-${j}-b`, [x1, L + 17, zc], [x0, H - L - 2, zc], 'custom', `Palang silang ${j + 1} b`, thin);
      }
      if (b > 0)
        levels(n, Math.max(yBottom, L + 10), H - 6).forEach((y, i) => {
          boards.push(board(`papan-${i + 1}-d`, `Papan tingkat ${i + 1} depan`, 0, W, y + 2, y + 2 + b, zc + L / 2, D - 3));
          boards.push(board(`papan-${i + 1}-b`, `Papan tingkat ${i + 1} belakang`, 0, W, y + 2, y + 2 + b, 3, zc - L / 2));
        });
    } else if (model === 'dapur') {
      // Bawah: kotak penuh setinggi meja. Atas: tiang depan pendek berdiri di palang samping meja.
      const ym = Math.min(H - 40, num(p, 'tinggiMeja', 85)) - b - rh / 2;
      const zu = Math.min(D - 10, Math.max(L + 8, num(p, 'dalamAtas', 28))) - L / 2;
      const zf = zfBot;
      const x0 = L / 2;
      const x1 = W - L / 2;
      [x0, x1].forEach((x, j) => {
        const nm = j ? 'kanan' : 'kiri';
        post(`tiang-${nm}-b`, `Tiang ${nm} belakang`, x, zb, 0, H);
        post(`tiang-${nm}-d`, `Tiang ${nm} depan (bawah)`, x, zf, 0, ym + rh / 2);
        post(`tiang-${nm}-atas`, `Tiang ${nm} depan rak atas`, x, zu, ym + rh / 2, H);
      });
      tier('bawah', 'tingkat bawah', x0, x1, zb, zf, yBottom);
      tier('meja', 'meja kerja', x0, x1, zb, zf, ym);
      const nU = Math.max(1, n - 2);
      const gapU = (yTopLvl - ym) / nU;
      for (let i = 1; i <= nU; i++) tier(`atas-${i}`, `rak atas ${i}`, x0, x1, zb, zu, r1(ym + gapU * i));
    } else if (model === 'sepatu') {
      // Tingkat miring 20° ke depan (depan rendah) + penahan tumit; tingkat paling atas datar.
      // Tanpa papan: 2 batang tambahan di tengah tiap tingkat miring jadi alas sepatu.
      const tilt = 20;
      const zf = zfBot;
      const rise = (zf - zb) * Math.tan(tilt * DEG);
      const x0 = L / 2;
      const x1 = W - L / 2;
      [x0, x1].forEach((x, j) => {
        const nm = j ? 'kanan' : 'kiri';
        post(`tiang-${nm}-b`, `Tiang ${nm} belakang`, x, zb, 0, H);
        post(`tiang-${nm}-d`, `Tiang ${nm} depan`, x, zf, 0, H);
      });
      const ys = levels(n, Math.max(yBottom, rise / 2 + rh), yTopLvl);
      ys.forEach((y, i) => {
        const t = i + 1;
        if (i === n - 1) return tier(`t${t}`, `tingkat ${t} (atas)`, x0, x1, zb, zf, y);
        const yb = y + rise / 2;
        const yf = y - rise / 2;
        add(`t${t}-belakang`, 'x', x0 + L / 2, yb, zb, x1 - x0 - L, 'rail-x', `Palang tingkat ${t} belakang`, rail);
        add(`t${t}-depan`, 'x', x0 + L / 2, yf, zf, x1 - x0 - L, 'rail-x', `Palang tingkat ${t} depan`, rail);
        add(`t${t}-tumit`, 'x', x0 + L / 2, yf + rh + 3, zf, x1 - x0 - L, 'rail-x', `Penahan tumit tingkat ${t}`, thin);
        if (b === 0)
          [1, 2].forEach((q) => {
            const zq = zb + ((zf - zb) * q) / 3;
            add(`t${t}-batang-${q}`, 'x', x0 + L / 2, yb - (rise * q) / 3, zq, x1 - x0 - L, 'rail-x', `Batang alas sepatu tingkat ${t} no. ${q}`, thin);
          });
        [x0, x1].forEach((x, j) => line(`t${t}-miring-${j ? 'kanan' : 'kiri'}`, [x, yb, zb + L / 2], [x, yf, zf - L / 2], 'rail-z', `Palang miring tingkat ${t} ${j ? 'kanan' : 'kiri'}`, rail));
        if (b > 0) {
          const len = (zf - zb + L) / Math.cos(tilt * DEG);
          const yc = y + rh / 2 + b / 2;
          boards.push({ ...board(`papan-${t}`, `Papan miring tingkat ${t}`, x0 + L / 2, x1 - L / 2, yc - b / 2, yc + b / 2, D / 2 - len / 2, D / 2 + len / 2), rotX: tilt });
        }
      });
    } else {
      // bangku: tiang belakang tinggi, tiang depan setinggi dudukan
      const ys = Math.min(H - 60, num(p, 'tinggiDuduk', 45)) - b - rh / 2;
      const zf = zfBot;
      const x0 = L / 2;
      const x1 = W - L / 2;
      const ds = Math.min(D, 28);
      [x0, x1].forEach((x, j) => {
        const nm = j ? 'kanan' : 'kiri';
        post(`tiang-${nm}-b`, `Tiang ${nm} belakang (tinggi)`, x, zb, 0, H);
        post(`tiang-${nm}-d`, `Kaki ${nm} depan`, x, zf, 0, ys + rh / 2);
      });
      tier('sepatu', 'rak sepatu', x0, x1, zb, zf, Math.min(yBottom, ys - 20));
      tier('duduk', 'dudukan', x0, x1, zb, zf, ys);
      add('sandaran', 'x', x0 + L / 2, ys + 28, zb, x1 - x0 - L, 'rail-x', 'Palang sandaran punggung', rail);
      const yk = H - 38;
      add('palang-kait', 'x', x0 + L / 2, yk, zb, x1 - x0 - L, 'rail-x', 'Palang kait gantungan', rail);
      const nk = Math.max(3, Math.round(W / 22));
      for (let i = 0; i < nk; i++) {
        const xk = x0 + ((x1 - x0) * (i + 0.5)) / nk;
        add(`kait-${i + 1}`, 'z', xk, yk, zb + rh / 2, 7, 'custom', `Kait gantungan ${i + 1}`, [15, 15]);
        add(`kait-${i + 1}-ujung`, 'y', xk, yk, zb + rh / 2 + 7, 4, 'custom', `Ujung kait ${i + 1}`, [15, 15]);
      }
      // rak topi di puncak: lengan menjulur dari tiang belakang
      [x0, x1].forEach((x, j) => add(`topi-lengan-${j}`, 'z', x, yTopLvl, zb + L / 2, ds - L - zb, 'rail-z', `Lengan rak topi ${j ? 'kanan' : 'kiri'}`, rail));
      add('topi-depan', 'x', x0 - L / 2, yTopLvl, ds - L / 2, x1 - x0 + L, 'rail-x', 'Palang depan rak topi', rail);
      add('topi-belakang', 'x', x0 + L / 2, yTopLvl, zb, x1 - x0 - L, 'rail-x', 'Palang belakang rak topi', rail);
      if (b > 0) boards.push(board('papan-topi', 'Papan rak topi', x0 + L / 2, x1 - L / 2, yTopLvl + rh / 2, yTopLvl + rh / 2 + b, 0, ds));
      outH = H + b;
    }

    return {
      members: list,
      boards,
      casters: roda ? casterSet([xsCol[0], xsCol[k]], [zb, zfBot], inch, bool(p, 'remRoda')) : [],
      W,
      D: outD,
      H: outH,
      boardThick: 0,
    };
  },

  checks: (p) => {
    const out: ProductCheck[] = [];
    const model = str(p, 'model', 'tegak');
    const W = num(p, 'panjang');
    const D = num(p, 'dalam');
    const H = num(p, 'tinggi');
    const n = num(p, 'tingkat');
    const roda = bool(p, 'roda') && model === 'tegak';
    const kol = ['tegak', 'tangga', 'palet', 'kantilever'].includes(model) ? Math.max(1, num(p, 'kolom')) : 1;
    let gap = (H - num(p, 'tinggiBawah')) / Math.max(1, n - 1);
    if (model === 'dapur') gap = Math.min(num(p, 'tinggiMeja') - num(p, 'tinggiBawah'), (H - num(p, 'tinggiMeja')) / Math.max(1, n - 2));
    if (model === 'tulang') gap = (H - num(p, 'tinggiBawah') - 20) / Math.max(1, n - 2);
    const span = model === 'tulang' ? W / 2 : model === 'sudut' ? Math.max(W, num(p, 'panjangSayap')) : W / kol;
    if (model !== 'kantilever' && model !== 'bangku' && span > 100 && str(p, 'palang') !== '20x40')
      out.push({ level: 'warn', message: `Papan sepanjang ${Math.round(span)} cm di atas pipa 20×20 bisa melendut kalau diberi beban berat.`, fix: { label: 'Pakai penyangga 20×40', params: { palang: '20x40' } } });
    const ratio = H / Math.max(1, D);
    if (ratio > 8 && model !== 'sudut')
      out.push({ level: 'warn', message: 'Rak sangat tinggi dan tipis, mudah terguling walau dipasang angkur.', fix: { label: `Kedalaman ${Math.ceil(H / 6)} cm`, params: { dalam: Math.min(100, Math.ceil(H / 6)) } } });
    else if (ratio > 4 && !roda && model !== 'sudut' && model !== 'tangga')
      out.push({ level: 'info', message: 'Rak tinggi & ramping: pasang angkur / siku ke dinding supaya tidak terguling.' });
    if (ratio > 3 && roda)
      out.push({ level: 'warn', message: 'Rak tinggi beroda mudah terguling saat didorong.', fix: { label: 'Tanpa roda', params: { roda: false } } });
    if (model !== 'bangku' && gap < 18)
      out.push({ level: 'warn', message: `Jarak antar tingkat hanya ${Math.round(gap)} cm, barang sulit masuk.`, fix: { label: 'Kurangi 1 tingkat', params: { tingkat: Math.max(2, n - 1) } } });
    if (model !== 'bangku' && gap >= 25 && gap <= 35) out.push({ level: 'info', message: `Jarak antar tingkat ${Math.round(gap)} cm, pas untuk buku ukuran biasa.` });
    if (str(p, 'pipa') === '20' && H > 120)
      out.push({ level: 'warn', message: 'Tiang 20×20 terlalu ramping untuk rak setinggi ini.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
    if ((model === 'tangga' || model === 'a' || model === 'dapur') && num(p, 'dalamAtas') > D - 10)
      out.push({ level: 'warn', message: 'Bagian atas hampir sedalam bagian bawah, bentuk rak jadi tidak terlihat.', fix: { label: `Atas ${Math.max(12, Math.round(D / 2))} cm`, params: { dalamAtas: Math.max(12, Math.round(D / 2)) } } });
    if (model === 'a' && W > 120 && str(p, 'pipa') === '20')
      out.push({ level: 'warn', message: 'Rangka A sepanjang ini goyang ke samping dengan pipa 20×20.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
    if (model === 'tulang' && D < 22)
      out.push({ level: 'warn', message: 'Rak tulang tengah terlalu tipis: papan menjulur membuat rak oleng.', fix: { label: 'Kedalaman 28 cm', params: { dalam: 28 } } });
    if (model === 'tulang') out.push({ level: 'info', message: 'Papan menjulur dari tiang tengah: susun barang berat di tingkat bawah, angkur ke tembok.' });
    if (model === 'sudut' && num(p, 'panjangSayap') < D + 20)
      out.push({ level: 'warn', message: 'Sayap samping terlalu pendek, hampir tidak ada papan di sayap kiri.', fix: { label: `Sayap ${D + 40} cm`, params: { panjangSayap: Math.min(200, D + 40) } } });
    if (model === 'kantilever') {
      if (D / 2 > 60) out.push({ level: 'warn', message: 'Lengan lebih dari 60 cm per sisi butuh tiang 40×40 dan lengan 40×60.', fix: { label: 'Kedalaman 100 cm', params: { dalam: 100 } } });
      if (str(p, 'pipa') !== '40') out.push({ level: 'warn', message: 'Tiang kantilever menahan beban menjulur, pakai pipa 40×40.', fix: { label: 'Pakai pipa 40×40', params: { pipa: '40' } } });
      out.push({ level: 'info', message: 'Muat barang seimbang di depan & belakang supaya tiang tidak melengkung.' });
    }
    if (model === 'palet' && str(p, 'pipa') === '20')
      out.push({ level: 'warn', message: 'Rak gudang berat sebaiknya bertiang 40×40.', fix: { label: 'Pakai pipa 40×40', params: { pipa: '40' } } });
    if (model === 'sepatu' && D < 26)
      out.push({ level: 'warn', message: 'Kedalaman di bawah 26 cm: sepatu dewasa menjuntai keluar papan miring.', fix: { label: 'Kedalaman 32 cm', params: { dalam: 32 } } });
    if (model === 'bangku' && W > 100 && str(p, 'palang') !== '20x40')
      out.push({ level: 'warn', message: 'Dudukan lebih dari 100 cm di atas pipa 20×20 melendut saat diduduki dua orang.', fix: { label: 'Pakai penyangga 20×40', params: { palang: '20x40' } } });
    return out;
  },
};
