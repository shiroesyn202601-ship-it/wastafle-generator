import { FrameHinge } from '../types/kitchen';
import { Board, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, CASTER_OPTIONS, board, bool, casterHeight, materialParams, memberFactory, num, str } from './common';

type P3 = [number, number, number];

/**
 * Meja besi: daun kotak / bundar, kaki lurus / melebar (miring) / X, rangka atas pipa 20×40 berdiri.
 * Pilihan: rak bawah, palang kaki, kaki tengah, kaki lipat (engsel kunci), roda.
 */
export const MEJA: ProductDef = {
  id: 'meja',
  name: 'Meja',
  tagline: 'makan · kerja · kopi · bar · lipat',
  icon: 'M6 12h48M10 12v24M50 12v24M10 28h40',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['bentukDaun', 'panjang', 'lebar', 'tinggi'] },
    { id: 'bentuk', title: 'Kaki', keys: ['modelKaki', 'sudutKaki', 'kakiLipat', 'rakBawah', 'tinggiRakBawah', 'palangKaki', 'kakiTengah'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Tambahan', keys: ['roda', 'ukuranRoda', 'remRoda'] },
  ],
  params: [
    {
      key: 'bentukDaun',
      label: 'Bentuk daun meja',
      type: 'choice',
      options: [
        { value: 'kotak', label: 'Kotak / persegi panjang' },
        { value: 'bulat', label: 'Bundar', desc: 'Panjang = diameter' },
      ],
    },
    { key: 'panjang', label: 'Panjang / diameter', type: 'number', unit: 'cm', min: 40, max: 240, step: 1, help: 'Sisi paling panjang daun meja (atau diameter untuk meja bundar).', marks: [{ value: 80, label: 'kopi' }, { value: 120, label: 'makan 4 org' }, { value: 180, label: 'makan 6 org' }] },
    { key: 'lebar', label: 'Lebar', type: 'number', unit: 'cm', min: 30, max: 120, step: 1, help: 'Jarak depan ke belakang.', marks: [{ value: 50, label: 'kopi' }, { value: 75, label: 'makan' }, { value: 90, label: 'makan 6 org' }], showIf: (p) => p.bentukDaun !== 'bulat' },
    { key: 'tinggi', label: 'Tinggi', type: 'number', unit: 'cm', min: 35, max: 110, step: 1, help: 'Dari lantai sampai permukaan meja.', marks: [{ value: 45, label: 'kopi' }, { value: 75, label: 'makan' }, { value: 85, label: 'kerja' }, { value: 105, label: 'bar' }] },
    {
      key: 'modelKaki',
      label: 'Model kaki',
      type: 'choice',
      options: [
        { value: 'lurus', label: 'Lurus', desc: 'Tegak, paling mudah dibuat' },
        { value: 'melebar', label: 'Melebar', desc: 'Miring keluar, lebih stabil' },
        { value: 'x', label: 'Silang X', desc: 'Kaki menyilang di kedua ujung' },
        { value: 'pedestal', label: 'Kaki tunggal (pedestal)', desc: 'Satu tiang di tengah, khas cafe' },
        { value: 'u', label: 'Kaki U / sled', desc: 'Rangka U di kedua ujung, menapak rata' },
      ],
      showIf: (p) => p.kakiLipat !== true,
    },
    {
      key: 'alas',
      label: 'Alas kaki tunggal',
      type: 'choice',
      options: [
        { value: 'silang', label: 'Silang +', desc: 'Dua pipa menyilang di lantai' },
        { value: 'bintang', label: 'Bintang miring', desc: '4 kaki miring dari tiang' },
        { value: 'plat', label: 'Plat bundar', desc: 'Plat besi 8 mm, rapi & berat' },
      ],
      showIf: (p) => p.modelKaki === 'pedestal' && p.kakiLipat !== true,
    },
    { key: 'bentangAlas', label: 'Lebar alas', type: 'number', unit: 'cm', min: 35, max: 90, step: 1, help: 'Minimal setengah lebar daun meja supaya tidak mudah terguling.', showIf: (p) => p.modelKaki === 'pedestal' && p.kakiLipat !== true },
    { key: 'pijakan', label: 'Pijakan kaki', type: 'toggle', help: 'Ring pijakan untuk meja bar tinggi (±30 cm dari lantai).', showIf: (p) => (p.modelKaki === 'pedestal' || p.modelKaki === 'u') && p.kakiLipat !== true },
    { key: 'sudutKaki', label: 'Sudut kaki melebar', type: 'number', unit: '°', min: 3, max: 15, step: 1, help: 'Kemiringan tiap kaki dari tegak lurus.', showIf: (p) => p.modelKaki === 'melebar' && p.kakiLipat !== true },
    { key: 'kakiLipat', label: 'Kaki bisa dilipat', type: 'toggle', help: 'Kaki dipasang engsel kunci; klik engselnya di 3D untuk melipat.', showIf: (p) => p.bentukDaun !== 'bulat' },
    { key: 'rakBawah', label: 'Rak bawah', type: 'toggle', help: 'Papan tambahan di bawah untuk menaruh barang.', showIf: (p) => p.kakiLipat !== true && p.modelKaki !== 'x' && p.modelKaki !== 'pedestal' && p.modelKaki !== 'u' },
    { key: 'tinggiRakBawah', label: 'Tinggi rak bawah', type: 'number', unit: 'cm', min: 8, max: 60, step: 1, showIf: (p) => p.rakBawah === true && p.kakiLipat !== true && p.modelKaki !== 'x' && p.modelKaki !== 'pedestal' && p.modelKaki !== 'u' },
    { key: 'palangKaki', label: 'Palang penguat kaki', type: 'toggle', help: 'Pipa penghubung kaki di bawah supaya tidak goyang.', showIf: (p) => p.rakBawah !== true && p.modelKaki !== 'x' && p.modelKaki !== 'pedestal' && p.modelKaki !== 'u' && p.kakiLipat !== true },
    { key: 'kakiTengah', label: 'Kaki tengah', type: 'toggle', help: 'Untuk meja panjang supaya tidak melendut.', showIf: (p) => p.modelKaki === 'lurus' && p.bentukDaun !== 'bulat' && p.kakiLipat !== true },
    ...materialParams(true),
    { key: 'roda', label: 'Pakai roda', type: 'toggle', help: 'Meja bisa didorong. Tinggi meja tetap sama.', showIf: (p) => p.kakiLipat !== true && p.modelKaki !== 'x' && p.modelKaki !== 'pedestal' && p.modelKaki !== 'u' },
    { key: 'ukuranRoda', label: 'Ukuran roda', type: 'choice', options: CASTER_OPTIONS, showIf: (p) => p.roda === true && p.kakiLipat !== true && p.modelKaki !== 'x' && p.modelKaki !== 'pedestal' && p.modelKaki !== 'u' && p.modelKaki !== 'pedestal' && p.modelKaki !== 'u' },
    { key: 'remRoda', label: 'Roda dengan rem', type: 'toggle', showIf: (p) => p.roda === true && p.kakiLipat !== true && p.modelKaki !== 'x' && p.modelKaki !== 'pedestal' && p.modelKaki !== 'u' && p.modelKaki !== 'pedestal' && p.modelKaki !== 'u' },
  ],
  defaults: {
    bentukDaun: 'kotak', panjang: 120, lebar: 75, tinggi: 75, modelKaki: 'lurus', sudutKaki: 8, kakiLipat: false,
    rakBawah: false, tinggiRakBawah: 20, palangKaki: true, kakiTengah: false, alas: 'silang', bentangAlas: 56, pijakan: false,
    pipa: '40', papan: 'kayu', warna: '#1f2226', roda: false, ukuranRoda: '3', remRoda: true,
  },
  presets: [
    {
      id: 'lurus',
      name: 'Meja kaki lurus',
      desc: '4 kaki tegak, palang kaki bentuk H',
      params: { modelKaki: 'lurus', palangKaki: true },
      sizes: [
        { label: 'Makan 4 orang', desc: '120 × 75 × 75 cm', params: { panjang: 120, lebar: 75, tinggi: 75, pipa: '40' } },
        { label: 'Cafe 2 orang', desc: '70 × 70 × 75 cm', params: { panjang: 70, lebar: 70, tinggi: 75, pipa: '30' } },
        { label: 'Belajar / kerja', desc: '100 × 55 × 75 cm', params: { panjang: 100, lebar: 55, tinggi: 75, pipa: '30' } },
        { label: 'Bar tinggi', desc: '120 × 50 × 105 cm', params: { panjang: 120, lebar: 50, tinggi: 105, pipa: '40' } },
      ],
    },
    {
      id: 'panjang',
      name: 'Meja panjang + kaki tengah',
      desc: '6 kaki tegak, tidak melendut',
      params: { modelKaki: 'lurus', kakiTengah: true, palangKaki: true },
      sizes: [
        { label: 'Makan 6 orang', desc: '180 × 90 × 75 cm', params: { panjang: 180, lebar: 90, tinggi: 75, pipa: '40' } },
        { label: 'Komunal cafe', desc: '240 × 90 × 75 cm', params: { panjang: 240, lebar: 90, tinggi: 75, pipa: '40' } },
        { label: 'Bar panjang', desc: '200 × 50 × 105 cm', params: { panjang: 200, lebar: 50, tinggi: 105, pipa: '40' } },
      ],
    },
    {
      id: 'bundar',
      name: 'Meja bundar kaki melebar',
      desc: 'daun bulat, 4 kaki miring',
      params: { bentukDaun: 'bulat', modelKaki: 'melebar', sudutKaki: 7, palangKaki: true },
      sizes: [
        { label: 'Makan 4 orang', desc: 'ø100 × 75 cm', params: { panjang: 100, tinggi: 75, pipa: '30' } },
        { label: 'Cafe 2 orang', desc: 'ø70 × 75 cm', params: { panjang: 70, tinggi: 75, pipa: '30' } },
        { label: 'Bar tinggi', desc: 'ø60 × 105 cm', params: { panjang: 60, tinggi: 105, pipa: '30' } },
      ],
    },
    {
      id: 'kaki-x',
      name: 'Meja kaki silang X',
      desc: 'kaki menyilang di kedua ujung',
      params: { modelKaki: 'x' },
      sizes: [
        { label: 'Makan 6 orang', desc: '160 × 80 × 75 cm', params: { panjang: 160, lebar: 80, tinggi: 75, pipa: '40' } },
        { label: 'Kerja', desc: '120 × 60 × 75 cm', params: { panjang: 120, lebar: 60, tinggi: 75, pipa: '40' } },
      ],
    },
    {
      id: 'melebar',
      name: 'Meja kaki melebar',
      desc: '4 kaki miring keluar, palang H',
      params: { modelKaki: 'melebar', sudutKaki: 8, palangKaki: true },
      sizes: [
        { label: 'Cafe 2 orang', desc: '70 × 70 × 75 cm', params: { panjang: 70, lebar: 70, tinggi: 75, pipa: '30' } },
        { label: 'Cafe 4 orang', desc: '80 × 80 × 75 cm', params: { panjang: 80, lebar: 80, tinggi: 75, pipa: '30' } },
        { label: 'Makan', desc: '120 × 70 × 75 cm', params: { panjang: 120, lebar: 70, tinggi: 75, pipa: '30' } },
      ],
    },
    {
      id: 'pedestal-silang',
      name: 'Meja kaki tunggal, alas silang',
      desc: 'satu tiang tengah, alas + di lantai',
      params: { modelKaki: 'pedestal', alas: 'silang' },
      sizes: [
        { label: 'Cafe 2 orang', desc: '60 × 60 × 75 cm', params: { panjang: 60, lebar: 60, tinggi: 75, bentangAlas: 50, pipa: '40', pijakan: false } },
        { label: 'Cafe 4 orang', desc: '80 × 80 × 75 cm', params: { panjang: 80, lebar: 80, tinggi: 75, bentangAlas: 66, pipa: '40', pijakan: false } },
        { label: 'Bar tinggi + pijakan', desc: '70 × 70 × 105 cm', params: { panjang: 70, lebar: 70, tinggi: 105, bentangAlas: 60, pipa: '40', pijakan: true } },
      ],
    },
    {
      id: 'pedestal-plat',
      name: 'Meja bundar kaki tunggal, alas plat',
      desc: 'daun bulat, tiang tengah, plat besi bundar',
      params: { bentukDaun: 'bulat', modelKaki: 'pedestal', alas: 'plat' },
      sizes: [
        { label: 'Cafe 2 orang', desc: 'ø60 × 75 cm, plat ø45', params: { panjang: 60, tinggi: 75, bentangAlas: 45, pipa: '40', pijakan: false } },
        { label: 'Cafe 4 orang', desc: 'ø80 × 75 cm, plat ø50', params: { panjang: 80, tinggi: 75, bentangAlas: 50, pipa: '40', pijakan: false } },
        { label: 'Bar tinggi + pijakan', desc: 'ø60 × 105 cm, plat ø50', params: { panjang: 60, tinggi: 105, bentangAlas: 50, pipa: '40', pijakan: true } },
      ],
    },
    {
      id: 'pedestal-bintang',
      name: 'Meja kaki tunggal, alas bintang',
      desc: 'tiang tengah + 4 kaki miring',
      params: { modelKaki: 'pedestal', alas: 'bintang' },
      sizes: [
        { label: 'Cafe 4 orang', desc: '80 × 80 × 75 cm', params: { panjang: 80, lebar: 80, tinggi: 75, bentangAlas: 70, pipa: '40', pijakan: false } },
        { label: 'Bar tinggi', desc: '70 × 70 × 105 cm', params: { panjang: 70, lebar: 70, tinggi: 105, bentangAlas: 66, pipa: '40', pijakan: true } },
      ],
    },
    {
      id: 'sled',
      name: 'Meja kaki U (sled)',
      desc: 'rangka U di kedua ujung, menapak rata',
      params: { modelKaki: 'u' },
      sizes: [
        { label: 'Makan / kerja', desc: '140 × 75 × 75 cm', params: { panjang: 140, lebar: 75, tinggi: 75, pipa: '40', pijakan: false } },
        { label: 'Komunal cafe', desc: '240 × 90 × 75 cm', params: { panjang: 240, lebar: 90, tinggi: 75, pipa: '40', pijakan: false } },
        { label: 'Bar tinggi + pijakan', desc: '160 × 60 × 105 cm', params: { panjang: 160, lebar: 60, tinggi: 105, pipa: '40', pijakan: true } },
      ],
    },
    {
      id: 'lipat',
      name: 'Meja lipat',
      desc: 'kaki dilipat ke bawah daun (engsel kunci)',
      params: { kakiLipat: true },
      sizes: [
        { label: 'Serbaguna', desc: '120 × 60 × 75 cm', params: { panjang: 120, lebar: 60, tinggi: 75, pipa: '30' } },
        { label: 'Bazar / event', desc: '180 × 75 × 75 cm', params: { panjang: 180, lebar: 75, tinggi: 75, pipa: '30' } },
        { label: 'Lesehan', desc: '80 × 50 × 35 cm', params: { panjang: 80, lebar: 50, tinggi: 35, pipa: '20' } },
      ],
    },
    {
      id: 'rak-bawah',
      name: 'Meja + rak bawah',
      desc: '4 kaki tegak, papan rak di bawah',
      params: { modelKaki: 'lurus', rakBawah: true },
      sizes: [
        { label: 'Meja kopi / tamu', desc: '90 × 50 × 45 cm', params: { panjang: 90, lebar: 50, tinggi: 45, tinggiRakBawah: 12, pipa: '30' } },
        { label: 'Meja TV / console', desc: '120 × 40 × 55 cm', params: { panjang: 120, lebar: 40, tinggi: 55, tinggiRakBawah: 12, pipa: '30' } },
        { label: 'Meja samping', desc: '45 × 45 × 55 cm', params: { panjang: 45, lebar: 45, tinggi: 55, tinggiRakBawah: 15, pipa: '20' } },
        { label: 'Meja kasir kecil', desc: '100 × 50 × 90 cm', params: { panjang: 100, lebar: 50, tinggi: 90, tinggiRakBawah: 20, pipa: '40' } },
      ],
    },
    {
      id: 'kerja',
      name: 'Meja kerja berat',
      desc: '6 kaki, rak bawah, pipa 40×40',
      params: { modelKaki: 'lurus', rakBawah: true, kakiTengah: true },
      sizes: [
        { label: 'Bengkel', desc: '150 × 70 × 85 cm', params: { panjang: 150, lebar: 70, tinggi: 85, tinggiRakBawah: 20, pipa: '40' } },
        { label: 'Dapur / prep cafe', desc: '180 × 60 × 90 cm', params: { panjang: 180, lebar: 60, tinggi: 90, tinggiRakBawah: 20, pipa: '40' } },
      ],
    },
  ],
  summary: (p) =>
    str(p, 'bentukDaun') === 'bulat'
      ? `Bundar ø${num(p, 'panjang')} × tinggi ${num(p, 'tinggi')} cm`
      : `${num(p, 'panjang')} × ${num(p, 'lebar')} × ${num(p, 'tinggi')} cm${bool(p, 'kakiLipat') ? ' · kaki lipat' : ''}`,

  build: (p) => {
    const round = str(p, 'bentukDaun') === 'bulat';
    const W = num(p, 'panjang', 120);
    const D = round ? W : num(p, 'lebar', 75);
    const H = num(p, 'tinggi', 75);
    const L = (parseInt(str(p, 'pipa', '40')) || 40) / 10; // tebal kaki (cm)
    const b = BOARD_THICK[str(p, 'papan', 'multiplek')] ?? 1.8;
    const lipat = !round && bool(p, 'kakiLipat');
    const model = lipat ? 'lurus' : round && str(p, 'modelKaki') === 'x' ? 'lurus' : str(p, 'modelKaki', 'lurus');
    const fourLegs = model === 'lurus' || model === 'melebar';
    const roda = !lipat && fourLegs && bool(p, 'roda');
    const inch = parseInt(str(p, 'ukuranRoda', '3')) || 3;
    const c = roda ? casterHeight(inch) : 0;
    const yTop = H - b; // bidang bawah daun meja
    const apron: [number, number] = L >= 3 ? [20, 40] : [20, 20];
    const ah = apron[1] / 10;
    const ya = yTop - ah / 2; // as rangka atas
    const rail: [number, number] = [20, 20];
    const leg: [number, number] = [L * 10, L * 10];
    const { list, add, line } = memberFactory();
    const boards: Board[] = [];
    const hinges: FrameHinge[] = [];

    // Bidang rangka atas: kotak (daun lebih 2 cm) atau persegi di dalam lingkaran (meja bundar)
    // kaki melebar: rangka atas digeser ke dalam supaya ujung kaki tetap di bawah tepi daun meja
    const spreadPre = model === 'melebar' ? Math.tan((num(p, 'sudutKaki', 8) * Math.PI) / 180) * (yTop - c) : 0;
    const o = 2 + spreadPre;
    // meja bundar: rangka persegi di tengah; ujung kaki (diagonal) harus tetap di dalam lingkaran daun
    const hf = Math.max(W * 0.12, Math.min(W * 0.3, W / (2 * Math.SQRT2) - spreadPre - 1));
    const fx0 = round ? W / 2 - hf : o;
    const fx1 = round ? W / 2 + hf : W - o;
    const fz0 = round ? D / 2 - hf : o;
    const fz1 = round ? D / 2 + hf : D - o;

    if (model === 'pedestal') {
      // Satu tiang di tengah, laba-laba atas (silang 20×40) dan alas silang / bintang / plat
      const cx = W / 2;
      const cz = D / 2;
      const col = Math.max(5, L + 1); // tiang 50×50 / 60×60
      const colT: [number, number] = [col * 10, col * 10];
      const span = Math.min(num(p, 'bentangAlas', 56), Math.min(W, D) - 2);
      const arm = Math.min(W, D) * 0.7;
      const alas = str(p, 'alas', 'silang');
      add('laba-x', 'x', cx - arm / 2, ya, cz, arm, 'rail-x', 'Laba-laba atas kiri–kanan', apron);
      add('laba-z', 'z', cx, ya, cz - arm / 2, arm, 'rail-z', 'Laba-laba atas depan–belakang', apron);
      let colBottom = 0;
      if (alas === 'silang') {
        add('alas-x', 'x', cx - span / 2, L / 2, cz, span, 'rail-x', 'Alas silang kiri–kanan', leg);
        add('alas-z', 'z', cx, L / 2, cz - span / 2, span, 'rail-z', 'Alas silang depan–belakang', leg);
        colBottom = L;
      } else if (alas === 'bintang') {
        const yh = 14;
        const r = span / 2 / Math.SQRT2;
        [
          [-1, -1],
          [1, -1],
          [-1, 1],
          [1, 1],
        ].forEach(([sx, sz], i) => line(`alas-bintang-${i}`, [cx, yh, cz], [cx + sx * r, 0, cz + sz * r], 'post', `Kaki bintang ${i + 1}`, leg));
        colBottom = yh - 4;
      } else {
        const pl = board('alas-plat', 'Plat alas bundar', cx - span / 2, cx + span / 2, 0, 0.8, cz - span / 2, cz + span / 2);
        pl.shape = 'round';
        pl.steelMm = 8;
        boards.push(pl);
        colBottom = 0.8;
      }
      add('tiang', 'y', cx, colBottom, cz, yTop - ah - colBottom, 'post', 'Tiang tengah', colT);
      if (bool(p, 'pijakan')) {
        // Ring pijakan persegi 40 cm di ±30 cm, disambung ke tiang dengan dua lengan
        const yr = 30;
        const h = 20;
        add('pijakan-depan', 'x', cx - h, yr, cz + h, 2 * h, 'rail-x', 'Ring pijakan depan', rail);
        add('pijakan-belakang', 'x', cx - h, yr, cz - h, 2 * h, 'rail-x', 'Ring pijakan belakang', rail);
        add('pijakan-kiri', 'z', cx - h - 1, yr, cz - h - 1, 2 * h + 2, 'rail-z', 'Ring pijakan kiri', rail);
        add('pijakan-kanan', 'z', cx + h + 1, yr, cz - h - 1, 2 * h + 2, 'rail-z', 'Ring pijakan kanan', rail);
        add('pijakan-lengan', 'x', cx - h, yr, cz, 2 * h, 'rail-x', 'Lengan ring pijakan', rail);
      }
    } else if (model === 'u') {
      // Rangka U / sled di kedua ujung: palang lantai + 2 tiang + palang atas, disambung gelagar
      const xs = [fx0 + L / 2, fx1 - L / 2];
      const zb = fz0 + L / 2;
      const zf = fz1 - L / 2;
      xs.forEach((x, i) => {
        const side = i ? 'kanan' : 'kiri';
        add(`sled-${side}`, 'z', x, L / 2, fz0, fz1 - fz0, 'rail-z', `Kaki sled ${side} (lantai)`, leg);
        add(`kaki-${side}-b`, 'y', x, L, zb, yTop - ah - L, 'post', `Kaki ${side} belakang`, leg);
        add(`kaki-${side}-d`, 'y', x, L, zf, yTop - ah - L, 'post', `Kaki ${side} depan`, leg);
        add(`atas-${side}`, 'z', x, ya, fz0, fz1 - fz0, 'rail-z', `Rangka atas ${side}`, apron);
      });
      add('atas-depan', 'x', xs[0] + L / 2, ya, zf, xs[1] - xs[0] - L, 'rail-x', 'Rangka atas depan', apron);
      add('atas-belakang', 'x', xs[0] + L / 2, ya, zb, xs[1] - xs[0] - L, 'rail-x', 'Rangka atas belakang', apron);
      const yb = bool(p, 'pijakan') ? 25 : 12;
      add('palang-bawah', 'x', xs[0] + 1, yb, (zb + zf) / 2, xs[1] - xs[0] - 2, 'rail-x', bool(p, 'pijakan') ? 'Pijakan kaki' : 'Palang bawah', rail);
      add(`palang-ujung-kiri`, 'z', xs[0], yb, zb + L / 2, zf - zb - L, 'rail-z', 'Palang ujung kiri', rail);
      add(`palang-ujung-kanan`, 'z', xs[1], yb, zb + L / 2, zf - zb - L, 'rail-z', 'Palang ujung kanan', rail);
    } else if (model === 'x') {
      // Kaki silang X di kedua ujung (bidang depan–belakang), rangka atas keliling
      const xs = [fx0 + L / 2, fx1 - L / 2];
      const yLeg = yTop - ah;
      xs.forEach((x, i) => {
        const side = i ? 'kanan' : 'kiri';
        line(`kaki-x-${i}-a`, [x, 0, fz0 + L / 2], [x, yLeg, fz1 - L / 2], 'post', `Kaki silang ${side} A`, leg);
        line(`kaki-x-${i}-b`, [x, 0, fz1 - L / 2], [x, yLeg, fz0 + L / 2], 'post', `Kaki silang ${side} B`, leg);
        add(`atas-${side}`, 'z', x, ya, fz0, fz1 - fz0, 'rail-z', `Rangka atas ${side}`, apron);
      });
      add('atas-depan', 'x', xs[0] + L / 2, ya, fz1 - 1, xs[1] - xs[0] - L, 'rail-x', 'Rangka atas depan', apron);
      add('atas-belakang', 'x', xs[0] + L / 2, ya, fz0 + 1, xs[1] - xs[0] - L, 'rail-x', 'Rangka atas belakang', apron);
      add('palang-silang', 'x', xs[0] + L / 2, yLeg / 2, (fz0 + fz1) / 2, xs[1] - xs[0] - L, 'rail-x', 'Palang penghubung kaki silang', rail);
    } else if (lipat) {
      // Rangka atas keliling + batang dudukan engsel; kaki di dalam rangka, dilipat ke tengah
      add('atas-depan', 'x', fx0, ya, fz1 - 1, fx1 - fx0, 'rail-x', 'Rangka atas depan', apron);
      add('atas-belakang', 'x', fx0, ya, fz0 + 1, fx1 - fx0, 'rail-x', 'Rangka atas belakang', apron);
      add('atas-kiri', 'z', fx0 + 1, ya, fz0 + 2, fz1 - fz0 - 4, 'rail-z', 'Rangka atas kiri', apron);
      add('atas-kanan', 'z', fx1 - 1, ya, fz0 + 2, fz1 - fz0 - 4, 'rail-z', 'Rangka atas kanan', apron);
      const yLeg = yTop - ah;
      const zb = fz0 + 2 + L / 2;
      const zf = fz1 - 2 - L / 2;
      [
        { x: fx0 + 2 + 1 + L / 2, side: 'kiri', sign: 1 as const },
        { x: fx1 - 2 - 1 - L / 2, side: 'kanan', sign: -1 as const },
      ].forEach(({ x, side, sign }) => {
        add(`dudukan-${side}`, 'z', x, ya, fz0 + 2, fz1 - fz0 - 4, 'rail-z', `Dudukan engsel kaki ${side}`, apron);
        add(`kaki-${side}-b`, 'y', x, 0, zb, yLeg, 'post', `Kaki lipat ${side} belakang`, leg);
        add(`kaki-${side}-d`, 'y', x, 0, zf, yLeg, 'post', `Kaki lipat ${side} depan`, leg);
        add(`palang-lipat-${side}`, 'z', x, 15, zb + L / 2, zf - zb - L, 'rail-z', `Palang kaki lipat ${side}`, rail);
        hinges.push({
          id: `engsel-kaki-${side}`,
          memberId: `kaki-${side}-d`,
          type: 'folding-lock',
          pos: yLeg,
          side: 'start',
          foldAxis: 'x',
          foldSign: sign,
          carry: true,
          label: `Engsel kaki lipat ${side}`,
        });
      });
    } else {
      // Kaki lurus / melebar di 4 sudut rangka atas
      const xl = fx0 + L / 2;
      const xr = fx1 - L / 2;
      const zb = fz0 + L / 2;
      const zf = fz1 - L / 2;
      const yLeg = yTop;
      const spread = model === 'melebar' ? Math.tan((num(p, 'sudutKaki', 8) * Math.PI) / 180) * (yLeg - c) : 0;
      const corners: [number, number, number, number, string][] = [
        [xl, zb, -1, -1, 'kiri belakang'],
        [xr, zb, 1, -1, 'kanan belakang'],
        [xl, zf, -1, 1, 'kiri depan'],
        [xr, zf, 1, 1, 'kanan depan'],
      ];
      /** Posisi as kaki ke-i pada ketinggian y (kaki melebar makin ke bawah makin keluar) */
      const at = (i: number, y: number): P3 => {
        const [x, z, sx, sz] = corners[i];
        const t = (yLeg - y) / Math.max(1, yLeg - c);
        return [x + sx * spread * t, y, z + sz * spread * t];
      };
      corners.forEach(([x, z, , , label], i) => line(`kaki-${i}`, at(i, c), [x, yLeg, z], 'post', `Kaki ${label}`, leg));

      add('atas-depan', 'x', fx0 + L, ya, zf, fx1 - fx0 - 2 * L, 'rail-x', 'Rangka atas depan', apron);
      add('atas-belakang', 'x', fx0 + L, ya, zb, fx1 - fx0 - 2 * L, 'rail-x', 'Rangka atas belakang', apron);
      add('atas-kiri', 'z', xl, ya, fz0 + L, fz1 - fz0 - 2 * L, 'rail-z', 'Rangka atas kiri', apron);
      add('atas-kanan', 'z', xr, ya, fz0 + L, fz1 - fz0 - 2 * L, 'rail-z', 'Rangka atas kanan', apron);

      if (model === 'lurus' && !round && bool(p, 'kakiTengah')) {
        const xm = W / 2;
        add('kaki-tengah-b', 'y', xm, c, zb + (L / 2 + 1), yTop - ah - c, 'post', 'Kaki tengah belakang', leg);
        add('kaki-tengah-d', 'y', xm, c, zf - (L / 2 + 1), yTop - ah - c, 'post', 'Kaki tengah depan', leg);
        add('atas-tengah', 'z', xm, ya, zb + 1, zf - zb - 2, 'rail-z', 'Rangka atas tengah', apron);
      }

      // Palang di antara kaki pada ketinggian y (ikut posisi kaki melebar)
      const ring = (prefix: string, name: string, y: number, withBoard: boolean) => {
        const [lb, rb, lf, rf] = [0, 1, 2, 3].map((i) => at(i, y));
        add(`${prefix}-depan`, 'x', lf[0] + L / 2, y, lf[2], rf[0] - lf[0] - L, 'rail-x', `${name} depan`, rail);
        add(`${prefix}-belakang`, 'x', lb[0] + L / 2, y, lb[2], rb[0] - lb[0] - L, 'rail-x', `${name} belakang`, rail);
        add(`${prefix}-kiri`, 'z', lb[0], y, lb[2] + L / 2, lf[2] - lb[2] - L, 'rail-z', `${name} kiri`, rail);
        add(`${prefix}-kanan`, 'z', rb[0], y, rb[2] + L / 2, rf[2] - rb[2] - L, 'rail-z', `${name} kanan`, rail);
        if (withBoard && b > 0) boards.push(board(`papan-${prefix}`, 'Papan rak bawah', lb[0] + L / 2, rb[0] - L / 2, y + 1, y + 1 + b, lb[2] - 1, lf[2] + 1));
      };
      if (bool(p, 'rakBawah')) ring('rak', 'Palang rak bawah', c + num(p, 'tinggiRakBawah', 20), true);
      else if (bool(p, 'palangKaki')) {
        const yp = c + 15;
        const [lb, rb, lf] = [0, 1, 2].map((i) => at(i, yp));
        add('palang-kiri', 'z', lb[0], yp, lb[2] + L / 2, lf[2] - lb[2] - L, 'rail-z', 'Palang kaki kiri', rail);
        add('palang-kanan', 'z', rb[0], yp, rb[2] + L / 2, lf[2] - lb[2] - L, 'rail-z', 'Palang kaki kanan', rail);
        add('palang-tengah', 'x', lb[0] + 1, yp, D / 2, rb[0] - lb[0] - 2, 'rail-x', 'Palang kaki tengah', rail);
      }
    }

    if (b > 0) {
      const top = board('daun-meja', round ? 'Daun meja bundar' : 'Daun meja', 0, W, yTop, H, 0, D);
      if (round) top.shape = 'round';
      boards.unshift(top);
    }

    // Roda di bawah ujung kaki
    const casters = roda
      ? list
          .filter((m) => m.role === 'post' && m.y <= c + 0.5 && m.id.startsWith('kaki-') && !m.id.includes('tengah'))
          .map((m, i) => ({ id: `roda-${i}`, x: m.x, z: m.z, topY: c, sizeInch: inch, brake: bool(p, 'remRoda') }))
      : [];

    return { members: list, boards, casters, W, D, H, boardThick: b, hinges: hinges.length ? hinges : undefined };
  },

  checks: (p) => {
    const out: ProductCheck[] = [];
    const round = str(p, 'bentukDaun') === 'bulat';
    const W = num(p, 'panjang');
    const H = num(p, 'tinggi');
    const model = str(p, 'modelKaki');
    if (!round && W > 140 && model === 'lurus' && !bool(p, 'kakiTengah') && !bool(p, 'kakiLipat'))
      out.push({ level: 'warn', message: `Meja ${W} cm tanpa kaki tengah bisa melendut di tengah kalau diberi beban berat.`, fix: { label: 'Tambah kaki tengah', params: { kakiTengah: true } } });
    if (str(p, 'pipa') === '20' && W > 100)
      out.push({ level: 'warn', message: 'Kaki 20×20 kurang kokoh untuk meja sepanjang ini, meja bisa goyang.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
    if (H > 95 && !bool(p, 'palangKaki') && !bool(p, 'rakBawah') && (model === 'lurus' || model === 'melebar') && !bool(p, 'kakiLipat'))
      out.push({ level: 'warn', message: 'Meja tinggi tanpa palang kaki mudah goyang.', fix: { label: 'Tambah palang kaki', params: { palangKaki: true } } });
    if (bool(p, 'rakBawah') && num(p, 'tinggiRakBawah') > H - 30)
      out.push({ level: 'warn', message: 'Rak bawah terlalu dekat ke daun meja, barang susah masuk.', fix: { label: 'Turunkan rak ke 20 cm', params: { tinggiRakBawah: 20 } } });
    if (model === 'melebar' && num(p, 'sudutKaki') > 12) out.push({ level: 'info', message: 'Kaki sangat melebar: ujung kaki keluar dari tepi daun meja, bisa tersandung.' });
    if ((model === 'melebar' || model === 'x') && !bool(p, 'kakiLipat')) out.push({ level: 'info', message: 'Kaki miring dipotong bersudut di kedua ujungnya. Sudutnya tertulis di daftar potongan.' });
    if (bool(p, 'kakiLipat')) out.push({ level: 'info', message: 'Klik engsel di 3D untuk melipat kaki. Engsel kunci menahan kaki tetap tegak saat dipakai.' });
    if (model === 'pedestal') {
      const top = round ? W : Math.max(W, num(p, 'lebar'));
      const span = num(p, 'bentangAlas');
      if (span < top * 0.5)
        out.push({ level: 'warn', message: `Alas ${span} cm terlalu kecil untuk daun ${top} cm: meja mudah terguling saat ditekan di tepi.`, fix: { label: `Alas ${Math.ceil(top * 0.55)} cm`, params: { bentangAlas: Math.min(90, Math.ceil(top * 0.55)) } } });
      if (!round && Math.max(W, num(p, 'lebar')) > 90) out.push({ level: 'warn', message: 'Daun lebih dari 90 cm sebaiknya pakai 2 tiang atau kaki 4.', fix: { label: 'Pakai kaki lurus', params: { modelKaki: 'lurus' } } });
      if (H > 95 && !bool(p, 'pijakan')) out.push({ level: 'info', message: 'Meja bar tinggi enak diberi ring pijakan kaki.', fix: { label: 'Tambah pijakan', params: { pijakan: true } } });
    }
    if (str(p, 'papan') === 'none') out.push({ level: 'info', message: 'Tanpa papan: daun meja (kaca, marmer, dll.) disiapkan sendiri.' });
    return out;
  },
};
