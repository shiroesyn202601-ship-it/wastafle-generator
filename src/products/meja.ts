import { ProductCheck, ProductDef } from './types';
import { BOARD_THICK, CASTER_OPTIONS, board, bool, casterHeight, casterSet, materialParams, memberFactory, num, str } from './common';

/**
 * Meja besi: 4 kaki, rangka atas (pipa 20×40 berdiri), daun meja di atas.
 * Pilihan: rak bawah, palang kaki, kaki tengah, roda.
 */
export const MEJA: ProductDef = {
  id: 'meja',
  name: 'Meja',
  tagline: 'makan · kerja · kopi · bar',
  icon: 'M6 12h48M10 12v24M50 12v24M10 28h40',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['panjang', 'lebar', 'tinggi'] },
    { id: 'bentuk', title: 'Bentuk', keys: ['rakBawah', 'tinggiRakBawah', 'palangKaki', 'kakiTengah'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Tambahan', keys: ['roda', 'ukuranRoda', 'remRoda'] },
  ],
  params: [
    { key: 'panjang', label: 'Panjang', type: 'number', unit: 'cm', min: 40, max: 240, step: 1, help: 'Sisi paling panjang daun meja.', marks: [{ value: 80, label: 'kopi' }, { value: 120, label: 'makan 4 org' }, { value: 160, label: 'makan 6 org' }] },
    { key: 'lebar', label: 'Lebar', type: 'number', unit: 'cm', min: 30, max: 120, step: 1, help: 'Jarak depan ke belakang.', marks: [{ value: 50, label: 'kopi' }, { value: 75, label: 'makan' }, { value: 90, label: 'kerja lebar' }] },
    { key: 'tinggi', label: 'Tinggi', type: 'number', unit: 'cm', min: 35, max: 110, step: 1, help: 'Dari lantai sampai permukaan meja.', marks: [{ value: 45, label: 'kopi' }, { value: 75, label: 'makan' }, { value: 85, label: 'kerja' }, { value: 105, label: 'bar' }] },
    { key: 'rakBawah', label: 'Rak bawah', type: 'toggle', help: 'Papan tambahan di bawah untuk menaruh barang.' },
    { key: 'tinggiRakBawah', label: 'Tinggi rak bawah', type: 'number', unit: 'cm', min: 8, max: 60, step: 1, showIf: (p) => p.rakBawah === true },
    { key: 'palangKaki', label: 'Palang penguat kaki', type: 'toggle', help: 'Pipa penghubung kaki di bawah supaya tidak goyang.', showIf: (p) => p.rakBawah !== true },
    { key: 'kakiTengah', label: 'Kaki tengah', type: 'toggle', help: 'Untuk meja panjang supaya tidak melendut.' },
    ...materialParams(true),
    { key: 'roda', label: 'Pakai roda', type: 'toggle', help: 'Meja bisa didorong. Tinggi meja tetap sama.' },
    { key: 'ukuranRoda', label: 'Ukuran roda', type: 'choice', options: CASTER_OPTIONS, showIf: (p) => p.roda === true },
    { key: 'remRoda', label: 'Roda dengan rem', type: 'toggle', showIf: (p) => p.roda === true },
  ],
  defaults: {
    panjang: 120, lebar: 75, tinggi: 75, rakBawah: false, tinggiRakBawah: 20, palangKaki: true, kakiTengah: false,
    pipa: '40', papan: 'multiplek', warna: '#1f2226', roda: false, ukuranRoda: '3', remRoda: true,
  },
  presets: [
    { id: 'makan-4', name: 'Meja makan 4 orang', desc: '120 × 75 × 75 cm', params: { panjang: 120, lebar: 75, tinggi: 75, papan: 'kayu', pipa: '40' } },
    { id: 'kerja', name: 'Meja kerja bengkel', desc: '150 × 70 × 85 cm, rak bawah', params: { panjang: 150, lebar: 70, tinggi: 85, rakBawah: true, tinggiRakBawah: 20, kakiTengah: true, pipa: '40', papan: 'multiplek' } },
    { id: 'kopi', name: 'Meja kopi / tamu', desc: '90 × 50 × 45 cm, rak bawah', params: { panjang: 90, lebar: 50, tinggi: 45, rakBawah: true, tinggiRakBawah: 12, pipa: '30', papan: 'kayu' } },
    { id: 'bar', name: 'Meja bar cafe', desc: '120 × 50 × 105 cm', params: { panjang: 120, lebar: 50, tinggi: 105, palangKaki: true, pipa: '40', papan: 'hpl' } },
    { id: 'laptop', name: 'Meja belajar', desc: '100 × 55 × 75 cm', params: { panjang: 100, lebar: 55, tinggi: 75, pipa: '30', papan: 'hpl', warna: '#e9e7e1' } },
  ],
  summary: (p) => `${num(p, 'panjang')} × ${num(p, 'lebar')} × ${num(p, 'tinggi')} cm`,

  build: (p) => {
    const W = num(p, 'panjang', 120);
    const D = num(p, 'lebar', 75);
    const H = num(p, 'tinggi', 75);
    const L = (parseInt(str(p, 'pipa', '40')) || 40) / 10; // tebal kaki (cm)
    const b = BOARD_THICK[str(p, 'papan', 'multiplek')] ?? 1.8;
    const o = 2; // daun meja lebih 2 cm dari rangka di semua sisi
    const roda = bool(p, 'roda');
    const inch = parseInt(str(p, 'ukuranRoda', '3')) || 3;
    const c = roda ? casterHeight(inch) : 0;
    const yTop = H - b; // bidang bawah daun meja
    const apron: [number, number] = L >= 3 ? [20, 40] : [20, 20];
    const ah = apron[1] / 10;
    const rail: [number, number] = [20, 20];
    const leg: [number, number] = [L * 10, L * 10];

    const { list, add } = memberFactory();
    const xl = o + L / 2;
    const xr = W - o - L / 2;
    const zb = o + L / 2;
    const zf = D - o - L / 2;

    // Kaki
    [
      [xl, zb, 'Kaki kiri belakang'],
      [xr, zb, 'Kaki kanan belakang'],
      [xl, zf, 'Kaki kiri depan'],
      [xr, zf, 'Kaki kanan depan'],
    ].forEach(([x, z, label], i) => add(`kaki-${i}`, 'y', x as number, c, z as number, yTop - c, 'post', label as string, leg));

    // Rangka atas (di bawah daun meja)
    const ya = yTop - ah / 2;
    add('atas-depan', 'x', o + L, ya, zf, W - 2 * o - 2 * L, 'rail-x', 'Rangka atas depan', apron);
    add('atas-belakang', 'x', o + L, ya, zb, W - 2 * o - 2 * L, 'rail-x', 'Rangka atas belakang', apron);
    add('atas-kiri', 'z', xl, ya, o + L, D - 2 * o - 2 * L, 'rail-z', 'Rangka atas kiri', apron);
    add('atas-kanan', 'z', xr, ya, o + L, D - 2 * o - 2 * L, 'rail-z', 'Rangka atas kanan', apron);

    // Kaki tengah (meja panjang)
    if (bool(p, 'kakiTengah')) {
      const xm = W / 2;
      add('kaki-tengah-b', 'y', xm, c, zb + (L / 2 + 1), yTop - ah - c, 'post', 'Kaki tengah belakang', leg);
      add('kaki-tengah-d', 'y', xm, c, zf - (L / 2 + 1), yTop - ah - c, 'post', 'Kaki tengah depan', leg);
      add('atas-tengah', 'z', xm, ya, zb + 1, zf - zb - 2, 'rail-z', 'Rangka atas tengah', apron);
    }

    const boards = [];
    // Rak bawah
    if (bool(p, 'rakBawah')) {
      const yr = c + num(p, 'tinggiRakBawah', 20);
      add('rak-depan', 'x', o + L, yr, zf, W - 2 * o - 2 * L, 'rail-x', 'Palang rak bawah depan', rail);
      add('rak-belakang', 'x', o + L, yr, zb, W - 2 * o - 2 * L, 'rail-x', 'Palang rak bawah belakang', rail);
      add('rak-kiri', 'z', xl, yr, o + L, D - 2 * o - 2 * L, 'rail-z', 'Palang rak bawah kiri', rail);
      add('rak-kanan', 'z', xr, yr, o + L, D - 2 * o - 2 * L, 'rail-z', 'Palang rak bawah kanan', rail);
      if (b > 0) boards.push(board('papan-rak', 'Papan rak bawah', o + L, W - o - L, yr + 1, yr + 1 + b, zb - 1, zf + 1));
    } else if (bool(p, 'palangKaki')) {
      // Palang kaki bentuk H: dua sisi + satu tengah
      const yp = c + 15;
      add('palang-kiri', 'z', xl, yp, o + L, D - 2 * o - 2 * L, 'rail-z', 'Palang kaki kiri', rail);
      add('palang-kanan', 'z', xr, yp, o + L, D - 2 * o - 2 * L, 'rail-z', 'Palang kaki kanan', rail);
      add('palang-tengah', 'x', xl + 1, yp, D / 2, xr - xl - 2, 'rail-x', 'Palang kaki tengah', rail); // menempel ke muka palang samping (lebar 2 cm)
    }

    if (b > 0) boards.unshift(board('daun-meja', 'Daun meja', 0, W, yTop, H, 0, D));

    return {
      members: list,
      boards,
      casters: roda ? casterSet([xl, xr], [zb, zf], inch, bool(p, 'remRoda')) : [],
      W,
      D,
      H,
      boardThick: b,
    };
  },

  checks: (p, b) => {
    const out: ProductCheck[] = [];
    const W = num(p, 'panjang');
    const H = num(p, 'tinggi');
    if (W > 140 && !bool(p, 'kakiTengah'))
      out.push({ level: 'warn', message: `Meja ${W} cm tanpa kaki tengah bisa melendut di tengah kalau diberi beban berat.`, fix: { label: 'Tambah kaki tengah', params: { kakiTengah: true } } });
    if (str(p, 'pipa') === '20' && W > 100)
      out.push({ level: 'warn', message: 'Kaki 20×20 kurang kokoh untuk meja sepanjang ini, meja bisa goyang.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
    if (H > 95 && !bool(p, 'palangKaki') && !bool(p, 'rakBawah'))
      out.push({ level: 'warn', message: 'Meja tinggi tanpa palang kaki mudah goyang.', fix: { label: 'Tambah palang kaki', params: { palangKaki: true } } });
    if (bool(p, 'rakBawah') && num(p, 'tinggiRakBawah') > H - 30)
      out.push({ level: 'warn', message: 'Rak bawah terlalu dekat ke daun meja, barang susah masuk.', fix: { label: 'Turunkan rak ke 20 cm', params: { tinggiRakBawah: 20 } } });
    if (str(p, 'papan') === 'none') out.push({ level: 'info', message: 'Tanpa papan: daun meja (kaca, marmer, dll.) disiapkan sendiri.' });
    void b;
    return out;
  },
};
