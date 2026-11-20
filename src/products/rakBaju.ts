import { Board, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, CASTER_OPTIONS, board, bool, casterHeight, materialParams, memberFactory, num, str } from './common';

/**
 * Rak gantungan baju: dua tiang di atas kaki melintang, pipa gantungan di atas,
 * rak bawah (sepatu / tas) atau palang bawah, opsional beroda.
 */
export const RAK_BAJU: ProductDef = {
  id: 'rak-baju',
  name: 'Rak gantungan baju',
  tagline: 'butik · kamar · laundry',
  icon: 'M8 6h44M10 6v28M50 6v28M4 34h12M44 34h12M10 26h40',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['panjang', 'tinggi', 'dalam'] },
    { id: 'bentuk', title: 'Bawah', keys: ['rakBawah', 'tinggiRak'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Roda', keys: ['roda', 'ukuranRoda'] },
  ],
  params: [
    { key: 'panjang', label: 'Panjang', type: 'number', unit: 'cm', min: 60, max: 200, step: 1, help: '±2 cm per gantungan baju.', marks: [{ value: 100, label: 'kamar' }, { value: 150, label: 'butik' }] },
    { key: 'tinggi', label: 'Tinggi pipa gantungan', type: 'number', unit: 'cm', min: 120, max: 200, step: 1, marks: [{ value: 160, label: 'kemeja' }, { value: 180, label: 'gaun / mantel' }] },
    { key: 'dalam', label: 'Lebar kaki', type: 'number', unit: 'cm', min: 35, max: 65, step: 1, help: 'Makin lebar makin stabil.', marks: [{ value: 50, label: 'umum' }] },
    { key: 'rakBawah', label: 'Rak bawah', type: 'toggle', help: 'Papan untuk sepatu / tas / kotak.' },
    { key: 'tinggiRak', label: 'Tinggi rak bawah', type: 'number', unit: 'cm', min: 12, max: 45, step: 1, showIf: (p) => p.rakBawah === true },
    ...materialParams(true),
    { key: 'roda', label: 'Pakai roda', type: 'toggle', help: 'Mudah dipindah saat bersih-bersih.' },
    { key: 'ukuranRoda', label: 'Ukuran roda', type: 'choice', options: CASTER_OPTIONS, showIf: (p) => p.roda === true },
  ],
  defaults: { panjang: 120, tinggi: 165, dalam: 50, rakBawah: true, tinggiRak: 20, pipa: '30', papan: 'kayu', warna: '#1f2226', roda: true, ukuranRoda: '3' },
  presets: [
    {
      id: 'rak-bawah',
      name: 'Rak baju + rak bawah',
      desc: 'pipa gantungan + papan bawah, beroda',
      params: { rakBawah: true, roda: true },
      sizes: [
        { label: 'Kamar', desc: '100 × 160 cm', params: { panjang: 100, tinggi: 160, dalam: 45 } },
        { label: 'Butik / toko', desc: '150 × 175 cm', params: { panjang: 150, tinggi: 175, dalam: 55 } },
      ],
    },
    {
      id: 'polos',
      name: 'Rak baju polos',
      desc: 'pipa gantungan + palang bawah, tanpa roda',
      params: { rakBawah: false, roda: false },
      sizes: [
        { label: 'Display butik', desc: '120 × 170 cm', params: { panjang: 120, tinggi: 170, dalam: 50, pipa: '30' } },
        { label: 'Jemuran / laundry', desc: '160 × 150 cm', params: { panjang: 160, tinggi: 150, dalam: 55, pipa: '30' } },
      ],
    },
  ],
  summary: (p) => `${num(p, 'panjang')} × ${num(p, 'tinggi')} cm${bool(p, 'roda') ? ' · beroda' : ''}`,

  build: (p) => {
    const W = num(p, 'panjang', 120);
    const H = num(p, 'tinggi', 165);
    const D = num(p, 'dalam', 50);
    const L = (parseInt(str(p, 'pipa', '30')) || 30) / 10;
    const b = BOARD_THICK[str(p, 'papan', 'kayu')] ?? 2.5;
    const roda = bool(p, 'roda');
    const inch = parseInt(str(p, 'ukuranRoda', '3')) || 3;
    const c = roda ? casterHeight(inch) : 0;
    const t: [number, number] = [L * 10, L * 10];
    const rail: [number, number] = [20, 20];
    const { list, add } = memberFactory();
    const boards: Board[] = [];
    const zc = D / 2;
    const xs = [L / 2, W - L / 2];
    xs.forEach((x, i) => {
      const nm = i ? 'kanan' : 'kiri';
      add(`kaki-${nm}`, 'z', x, c + L / 2, 0, D, 'rail-z', `Kaki melintang ${nm}`, t);
      add(`tiang-${nm}`, 'y', x, c + L, zc, H - c - L, 'post', `Tiang ${nm}`, t);
    });
    add('pipa-gantungan', 'x', L, H - L / 2, zc, W - 2 * L, 'rail-x', 'Pipa gantungan baju', t);
    if (bool(p, 'rakBawah')) {
      const y = c + num(p, 'tinggiRak', 20);
      xs.forEach((x, i) => add(`rak-samping-${i}`, 'z', x, y, 3, D - 6, 'rail-z', `Palang rak bawah ${i ? 'kanan' : 'kiri'}`, rail));
      // menempel ke muka palang samping (20×20, muka di x = L/2 ± 1)
      add('rak-depan', 'x', L / 2 + 1, y, D - 4, W - L - 2, 'rail-x', 'Palang rak bawah depan', rail);
      add('rak-belakang', 'x', L / 2 + 1, y, 4, W - L - 2, 'rail-x', 'Palang rak bawah belakang', rail);
      if (b > 0) boards.push(board('papan-rak', 'Papan rak bawah', L, W - L, y + 1, y + 1 + b, 3, D - 3));
    } else add('palang-bawah', 'x', L, c + 18, zc, W - 2 * L, 'rail-x', 'Palang bawah', rail);

    const casters = roda
      ? xs.flatMap((x, i) => [3, D - 3].map((z, j) => ({ id: `roda-${i}-${j}`, x, z, topY: c, sizeInch: inch, brake: true })))
      : [];
    return { members: list, boards, casters, W, D, H, boardThick: 0 };
  },

  checks: (p) => {
    const out: ProductCheck[] = [];
    if (num(p, 'tinggi') / num(p, 'dalam') > 3.8) out.push({ level: 'warn', message: 'Rak tinggi dengan kaki sempit mudah terguling saat baju menumpuk di satu sisi.', fix: { label: `Kaki ${Math.ceil(num(p, 'tinggi') / 3.5)} cm`, params: { dalam: Math.min(65, Math.ceil(num(p, 'tinggi') / 3.5)) } } });
    if (num(p, 'panjang') > 150 && str(p, 'pipa') === '20') out.push({ level: 'warn', message: 'Pipa gantungan 20×20 sepanjang ini melendut kalau penuh baju.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
    out.push({ level: 'info', message: `Muat ±${Math.floor(num(p, 'panjang') / 2.5)} gantungan baju.` });
    return out;
  },
};
