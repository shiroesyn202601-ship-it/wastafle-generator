import { Board, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, board, bool, materialParams, memberFactory, num, str } from './common';

/**
 * Meja bar / kasir / counter barista. z = 0 sisi barista (terbuka), z = D sisi tamu.
 * Pilihan: meja tamu dua tingkat (ledge), panel depan, pijakan kaki tamu, rak bawah sisi barista, overhang.
 */
export const MEJA_BAR: ProductDef = {
  id: 'meja-bar',
  name: 'Meja bar / kasir',
  tagline: 'counter barista · kasir · bar',
  icon: 'M4 14h52M6 14v22M54 14v22M4 8h52M6 30h48',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['panjang', 'dalam', 'tinggi'] },
    { id: 'bentuk', title: 'Sisi tamu', keys: ['mejaTamu', 'tinggiTamu', 'lebarTamu', 'overhang', 'panelDepan', 'pijakanKaki'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Sisi barista', keys: ['rakBawah'] },
  ],
  params: [
    { key: 'panjang', label: 'Panjang', type: 'number', unit: 'cm', min: 80, max: 300, step: 1, marks: [{ value: 120, label: 'kasir' }, { value: 180, label: 'bar 3 kursi' }, { value: 240, label: 'bar 4 kursi' }] },
    { key: 'dalam', label: 'Kedalaman meja kerja', type: 'number', unit: 'cm', min: 40, max: 75, step: 1, help: 'Dari sisi barista ke sisi tamu.', marks: [{ value: 60, label: 'umum' }] },
    { key: 'tinggi', label: 'Tinggi meja kerja', type: 'number', unit: 'cm', min: 75, max: 110, step: 1, help: 'Permukaan tempat barista bekerja.', marks: [{ value: 90, label: 'kerja / counter' }, { value: 105, label: 'bar' }] },
    { key: 'mejaTamu', label: 'Meja tamu dua tingkat', type: 'toggle', help: 'Papan lebih tinggi di sisi tamu, menutupi area kerja barista.' },
    { key: 'tinggiTamu', label: 'Tinggi meja tamu', type: 'number', unit: 'cm', min: 95, max: 120, step: 1, marks: [{ value: 110, label: 'umum' }], showIf: (p) => p.mejaTamu === true },
    { key: 'lebarTamu', label: 'Lebar meja tamu', type: 'number', unit: 'cm', min: 20, max: 45, step: 1, help: 'Bagian yang menjorok ke tamu menjadi ruang lutut.', showIf: (p) => p.mejaTamu === true },
    { key: 'overhang', label: 'Daun menjorok ke tamu', type: 'number', unit: 'cm', min: 0, max: 35, step: 1, help: 'Untuk duduk di stool: 25–30 cm ruang lutut.', marks: [{ value: 0, label: 'rata' }, { value: 25, label: 'duduk' }], showIf: (p) => p.mejaTamu !== true },
    { key: 'panelDepan', label: 'Panel penutup depan', type: 'toggle', help: 'Papan menutup sisi tamu (bisa dilapis HPL / kayu).' },
    { key: 'pijakanKaki', label: 'Pijakan kaki tamu', type: 'toggle', help: 'Pipa pijakan ±20 cm dari lantai di sisi tamu.' },
    { key: 'rakBawah', label: 'Rak di sisi barista', type: 'number', unit: 'rak', min: 0, max: 3, step: 1 },
    ...materialParams(true),
  ],
  defaults: { panjang: 180, dalam: 60, tinggi: 90, mejaTamu: true, tinggiTamu: 110, lebarTamu: 35, overhang: 0, panelDepan: true, pijakanKaki: true, rakBawah: 1, pipa: '40', papan: 'kayu', warna: '#1f2226' },
  presets: [
    {
      id: 'dua-tingkat',
      name: 'Counter barista dua tingkat',
      desc: 'meja kerja 90 + meja tamu 110, panel depan',
      params: { mejaTamu: true, panelDepan: true, pijakanKaki: true },
      sizes: [
        { label: 'Coffee bar 3 kursi', desc: '180 × 60, kerja 90 / tamu 110', params: { panjang: 180, dalam: 60, tinggi: 90, tinggiTamu: 110, lebarTamu: 35, rakBawah: 1 } },
        { label: 'Meja kasir', desc: '120 × 55, kerja 90 / tamu 105', params: { panjang: 120, dalam: 55, tinggi: 90, tinggiTamu: 105, lebarTamu: 30, rakBawah: 2, pijakanKaki: false } },
        { label: 'Bar panjang', desc: '240 × 60, kerja 90 / tamu 110', params: { panjang: 240, dalam: 60, tinggi: 90, tinggiTamu: 110, lebarTamu: 35, rakBawah: 1 } },
      ],
    },
    {
      id: 'satu-tingkat',
      name: 'Meja bar satu tingkat + overhang',
      desc: 'daun menjorok ke tamu untuk stool',
      params: { mejaTamu: false, panelDepan: true, pijakanKaki: true },
      sizes: [
        { label: 'Bar 105 (stool 75)', desc: '180 × 55 × 105, overhang 25', params: { panjang: 180, dalam: 55, tinggi: 105, overhang: 25, rakBawah: 1 } },
        { label: 'Counter 90 (stool 65)', desc: '160 × 55 × 90, overhang 25', params: { panjang: 160, dalam: 55, tinggi: 90, overhang: 25, rakBawah: 1 } },
      ],
    },
    {
      id: 'terbuka',
      name: 'Meja kerja terbuka (tanpa panel)',
      desc: 'rangka terbuka, rak bawah, untuk dapur / prep',
      params: { mejaTamu: false, panelDepan: false, pijakanKaki: false, overhang: 0 },
      sizes: [
        { label: 'Prep station', desc: '150 × 60 × 90, 2 rak', params: { panjang: 150, dalam: 60, tinggi: 90, rakBawah: 2 } },
        { label: 'Meja saji prasmanan', desc: '200 × 60 × 85, 1 rak', params: { panjang: 200, dalam: 60, tinggi: 85, rakBawah: 1 } },
      ],
    },
  ],
  summary: (p) => `${num(p, 'panjang')} × ${num(p, 'dalam')} cm, kerja ${num(p, 'tinggi')} cm${bool(p, 'mejaTamu') ? ` · tamu ${num(p, 'tinggiTamu')} cm` : ''}`,

  build: (p) => {
    const W = num(p, 'panjang', 180);
    const D = num(p, 'dalam', 60);
    const H = num(p, 'tinggi', 90);
    const L = (parseInt(str(p, 'pipa', '40')) || 40) / 10;
    const b = BOARD_THICK[str(p, 'papan', 'kayu')] ?? 2.5;
    const ledge = bool(p, 'mejaTamu');
    const Ht = Math.max(H + 10, num(p, 'tinggiTamu', 110));
    const lw = num(p, 'lebarTamu', 35);
    const over = ledge ? 0 : num(p, 'overhang', 0);
    const rail: [number, number] = [20, 40];
    const thin: [number, number] = [20, 20];
    const post: [number, number] = [L * 10, L * 10];
    const { list, add } = memberFactory();
    const boards: Board[] = [];

    const yTop = H - b;
    const ya = yTop - 2;
    const zb = L / 2;
    const zf = D - L / 2;
    const n = Math.max(2, Math.ceil(W / 100) + 1);
    const xs = Array.from({ length: n }, (_, i) => L / 2 + ((W - L) * i) / (n - 1));
    const yLedgeRail = Ht - b - 2;

    xs.forEach((x, i) => {
      add(`tiang-b-${i}`, 'y', x, 0, zb, yTop - 4, 'post', `Tiang sisi barista ${i + 1}`, post);
      add(`tiang-d-${i}`, 'y', x, 0, zf, (ledge ? yLedgeRail - 2 : yTop - 4), 'post', `Tiang sisi tamu ${i + 1}`, post);
      add(`palang-atas-${i}`, 'z', x, ya, L, D - 2 * L, 'rail-z', `Palang atas ${i + 1}`, rail);
      if (i === 0 || i === n - 1) add(`palang-bawah-${i}`, 'z', x, 8, L, D - 2 * L, 'rail-z', `Palang bawah ujung ${i ? 'kanan' : 'kiri'}`, thin);
      if (ledge) add(`lengan-tamu-${i}`, 'z', x, yLedgeRail, D - 8, lw - 2, 'rail-z', `Lengan meja tamu ${i + 1}`, rail);
      else if (over > 3) add(`lengan-overhang-${i}`, 'z', x, ya, D, over - 3, 'rail-z', `Lengan daun menjorok ${i + 1}`, rail);
    });
    add('gelagar-atas-b', 'x', 0, ya, zb, W, 'rail-x', 'Gelagar atas sisi barista', rail);
    add('gelagar-atas-d', 'x', 0, ya, zf, W, 'rail-x', 'Gelagar atas sisi tamu', rail);
    add('gelagar-bawah-b', 'x', 0, 8, zb, W, 'rail-x', 'Gelagar bawah sisi barista', thin);
    add('gelagar-bawah-d', 'x', 0, 8, zf, W, 'rail-x', 'Gelagar bawah sisi tamu', thin);
    if (ledge) add('gelagar-tamu', 'x', 0, yLedgeRail, zf, W, 'rail-x', 'Gelagar meja tamu', rail);

    // Rak sisi barista
    const shelves = Math.round(num(p, 'rakBawah', 1));
    for (let k = 0; k < shelves; k++) {
      const y = 25 + k * Math.min(30, (yTop - 40) / Math.max(1, shelves));
      add(`rak-${k + 1}-b`, 'x', 0, y, zb, W, 'rail-x', `Palang rak ${k + 1} barista`, thin);
      add(`rak-${k + 1}-d`, 'x', 0, y, zf, W, 'rail-x', `Palang rak ${k + 1} tamu`, thin);
      if (b > 0) boards.push(board(`papan-rak-${k + 1}`, `Papan rak ${k + 1}`, L, W - L, y + 1, y + 1 + b, L, D - L));
    }

    // Panel depan & pijakan kaki tamu
    const panelTop = ledge ? Ht - b - 4 : yTop;
    if (bool(p, 'panelDepan')) boards.push(board('panel-depan', 'Panel penutup depan', 0, W, 6, panelTop, D, D + 1.8));
    if (bool(p, 'pijakanKaki')) {
      const off = (bool(p, 'panelDepan') ? 1.8 : 0) + 20; // ±20 cm keluar dari muka depan
      add('pijakan-kaki', 'x', 0, 20, D + off, W, 'rail-x', 'Pipa pijakan kaki tamu', [40, 40]);
      xs.forEach((x, i) => {
        if (i % 2 === 0 || i === n - 1) add(`dudukan-pijakan-${i}`, 'z', x, 20, D, off - 2, 'rail-z', `Dudukan pijakan ${i + 1}`, thin);
      });
    }

    if (b > 0) boards.unshift(board('daun-kerja', 'Daun meja kerja', 0, W, yTop, H, 0, D + over));
    if (ledge && b > 0) boards.push(board('daun-tamu', 'Daun meja tamu', 0, W, Ht - b, Ht, D - 8, D - 8 + lw));

    const depth = Math.max(D + over, ledge ? D - 8 + lw : 0, bool(p, 'pijakanKaki') ? D + 24 : 0);
    return { members: list, boards, casters: [], W, D: depth, H: ledge ? Ht : H, boardThick: 0 };
  },

  checks: (p) => {
    const out: ProductCheck[] = [];
    if (bool(p, 'mejaTamu')) {
      const knee = num(p, 'lebarTamu') - 8;
      if (knee < 20) out.push({ level: 'warn', message: `Meja tamu hanya menjorok ${knee} cm: lutut tamu menabrak panel.`, fix: { label: 'Lebar tamu 35 cm', params: { lebarTamu: 35 } } });
      if (num(p, 'tinggiTamu') - num(p, 'tinggi') < 12) out.push({ level: 'info', message: 'Beda tinggi meja tamu dan meja kerja kecil: area kerja barista terlihat tamu.' });
    } else if (num(p, 'overhang') > 30) out.push({ level: 'warn', message: 'Daun menjorok lebih dari 30 cm perlu siku penahan tambahan supaya tidak melendut.', fix: { label: 'Overhang 25 cm', params: { overhang: 25 } } });
    const seat = bool(p, 'mejaTamu') ? num(p, 'tinggiTamu') : num(p, 'tinggi');
    out.push({ level: 'info', message: `Pasangan stool: dudukan ±${seat - 30} cm (${seat} − 30). Pijakan kaki stool ±${seat - 30 - 43} cm.` });
    if (num(p, 'panjang') / 60 >= 2) out.push({ level: 'info', message: `Muat ±${Math.floor(num(p, 'panjang') / 60)} stool (60 cm per orang).` });
    return out;
  },
};
