import { Board, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, board, materialParams, memberFactory, num, str } from './common';

/**
 * Rak tanaman bertingkat (model tangga): tingkat paling depan paling rendah, makin ke belakang makin tinggi.
 * Tiang dipasang di setiap batas antar tingkat dan tingginya mengikuti tingkat di belakangnya.
 */
export const RAK_TANAMAN: ProductDef = {
  id: 'rak-tanaman',
  name: 'Rak tanaman',
  tagline: 'bertingkat · tangga · pot bunga',
  icon: 'M8 34h44M12 34V22h12V12h12V4h12v30',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['panjang', 'tingkat'] },
    { id: 'bentuk', title: 'Bentuk', keys: ['dalamTingkat', 'naikTingkat'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Selesai', keys: [] },
  ],
  params: [
    { key: 'panjang', label: 'Panjang', type: 'number', unit: 'cm', min: 40, max: 200, step: 1, marks: [{ value: 80, label: 'teras' }, { value: 120, label: 'taman' }] },
    { key: 'tingkat', label: 'Jumlah tingkat', type: 'number', unit: 'tingkat', min: 2, max: 5, step: 1 },
    { key: 'dalamTingkat', label: 'Kedalaman tiap tingkat', type: 'number', unit: 'cm', min: 15, max: 45, step: 1, help: 'Sesuaikan dengan diameter pot terbesar.', marks: [{ value: 25, label: 'pot kecil' }, { value: 35, label: 'pot sedang' }] },
    { key: 'naikTingkat', label: 'Selisih tinggi antar tingkat', type: 'number', unit: 'cm', min: 12, max: 45, step: 1, marks: [{ value: 25, label: 'umum' }] },
    ...materialParams(true),
  ],
  defaults: { panjang: 100, tingkat: 3, dalamTingkat: 25, naikTingkat: 25, pipa: '20', papan: 'kayu', warna: '#2f4a3a' },
  presets: [
    {
      id: 'tangga',
      name: 'Rak tanaman tangga',
      desc: 'tingkat makin ke belakang makin tinggi',
      params: {},
      sizes: [
        { label: 'Pot teras', desc: '100 cm, 3 tingkat', params: { panjang: 100, tingkat: 3, dalamTingkat: 25, naikTingkat: 25, pipa: '20', papan: 'kayu', warna: '#2f4a3a' } },
        { label: 'Sukulen', desc: '60 cm, 4 tingkat rapat', params: { panjang: 60, tingkat: 4, dalamTingkat: 18, naikTingkat: 18, pipa: '20', papan: 'multiplek', warna: '#e9e7e1' } },
        { label: 'Pot besar', desc: '150 cm, 3 tingkat dalam', params: { panjang: 150, tingkat: 3, dalamTingkat: 35, naikTingkat: 30, pipa: '30', papan: 'kayu', warna: '#2f4a3a' } },
      ],
    },
  ],
  summary: (p) => `${num(p, 'panjang')} cm · ${num(p, 'tingkat')} tingkat · tinggi ${num(p, 'tingkat') * num(p, 'naikTingkat')} cm`,

  build: (p) => {
    const W = num(p, 'panjang', 100);
    const n = Math.max(2, Math.round(num(p, 'tingkat', 3)));
    const d = num(p, 'dalamTingkat', 25);
    const h = num(p, 'naikTingkat', 25);
    const L = (parseInt(str(p, 'pipa', '20')) || 20) / 10;
    const b = BOARD_THICK[str(p, 'papan', 'kayu')] ?? 2.5;
    const D = n * d;
    const rail: [number, number] = [20, 20];
    const rh = 2;
    const post: [number, number] = [L * 10, L * 10];
    const { list, add } = memberFactory();

    // Batas antar tingkat k = 0 (depan) … n (belakang); as tiang di tepi dalam rangka
    const zAt = (k: number) => (k === 0 ? D - L / 2 : k === n ? L / 2 : D - k * d);
    const postH = (k: number) => (k === 0 ? h : k === n ? n * h : (k + 1) * h);
    const xs = [L / 2, W - L / 2];
    for (let k = 0; k <= n; k++) {
      xs.forEach((x, j) => add(`tiang-${k}-${j}`, 'y', x, 0, zAt(k), postH(k), 'post', `Tiang ${j ? 'kanan' : 'kiri'} batas ${k + 1}`, post));
    }

    const boards: Board[] = [];
    for (let i = 0; i < n; i++) {
      const yTop = (i + 1) * h; // permukaan rangka tingkat i
      const y = yTop - rh / 2;
      const zFront = zAt(i);
      const zBack = zAt(i + 1);
      const t = i + 1;
      add(`t${t}-depan`, 'x', L, y, zFront, W - 2 * L, 'rail-x', `Palang tingkat ${t} depan`, rail);
      add(`t${t}-belakang`, 'x', L, y, zBack, W - 2 * L, 'rail-x', `Palang tingkat ${t} belakang`, rail);
      xs.forEach((x, j) => add(`t${t}-${j ? 'kanan' : 'kiri'}`, 'z', x, y, zBack + L / 2, zFront - zBack - L, 'rail-z', `Palang tingkat ${t} ${j ? 'kanan' : 'kiri'}`, rail));
      // Palang bawah di setiap ruas samping supaya kaki tidak membuka
      xs.forEach((x, j) => add(`bawah-${t}-${j}`, 'z', x, 8, zBack + L / 2, zFront - zBack - L, 'rail-z', `Palang bawah ruas ${t} ${j ? 'kanan' : 'kiri'}`, rail));
      if (b > 0) boards.push(board(`papan-${t}`, `Papan tingkat ${t}`, L, W - L, yTop, yTop + b, zBack - L / 2, zFront + L / 2));
    }

    return { members: list, boards, casters: [], W, D, H: n * h + b, boardThick: 0 };
  },

  checks: (p) => {
    const out: ProductCheck[] = [];
    const W = num(p, 'panjang');
    const d = num(p, 'dalamTingkat');
    const h = num(p, 'naikTingkat');
    if (W > 120 && str(p, 'pipa') === '20') out.push({ level: 'warn', message: 'Pot tanah basah berat. Rak sepanjang ini sebaiknya pakai pipa 30×30.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
    if (h < d * 0.6) out.push({ level: 'info', message: 'Selisih tinggi kecil: daun tanaman depan bisa menutupi pot di belakangnya.' });
    out.push({ level: 'info', message: 'Untuk di luar ruangan, pilih besi galvanis atau cat dasar anti karat 2 lapis.' });
    return out;
  },
};
