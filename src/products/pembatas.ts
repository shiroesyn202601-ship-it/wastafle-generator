import { Board, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, CASTER_OPTIONS, board, bool, casterHeight, casterSet, materialParams, memberFactory, num, str } from './common';

const RODA_OK = ['kotak', 'layar', 'kaki', 'rak'];

/**
 * Pembatas / partisi ruang cafe & taman. Bentuk rangka:
 * - kotak: kotak pot berangka (papan dinding + alas) berdiri di lantai
 * - kaki: kotak pot dangkal di atas kaki tinggi (pot melayang / kebun meja), palang bawah keliling
 * - layar: kotak pot + layar di atasnya (bilah tegak, datar, atau kisi)
 * - rak: rak sekat terbuka beberapa tingkat untuk deretan pot, dilihat dari dua sisi
 * - gantung: rangka gawang berkaki T untuk pot gantung, palang atas berkait
 * - pagar: tiang di atas plat dasar + palang mendatar (pagar / pembatas antrian cafe)
 */
export const PEMBATAS: ProductDef = {
  id: 'pembatas',
  name: 'Pembatas tanaman',
  tagline: 'partisi · pot · sekat ruang cafe',
  icon: 'M6 36h48M6 22h48M6 22v14M54 22v14M12 22V4M20 22V4M28 22V4M36 22V4M44 22V4',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['model', 'panjang', 'lebar', 'tinggiBox', 'dalamPot', 'tinggiLayar'] },
    { id: 'bentuk', title: 'Bentuk', keys: ['polaLayar', 'jarakBilah', 'tingkat'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Roda', keys: ['roda', 'ukuranRoda'] },
  ],
  params: [
    {
      key: 'model',
      label: 'Bentuk rangka',
      type: 'choice',
      options: [
        { value: 'kotak', label: 'Kotak pot', desc: 'Planter box di lantai' },
        { value: 'kaki', label: 'Kotak pot berkaki', desc: 'Pot dangkal di atas kaki tinggi' },
        { value: 'layar', label: 'Kotak pot + layar', desc: 'Layar bilah / kisi di atas pot' },
        { value: 'rak', label: 'Rak sekat bertingkat', desc: 'Rak terbuka untuk deretan pot' },
        { value: 'gantung', label: 'Rangka pot gantung', desc: 'Gawang berkaki T, pot digantung' },
        { value: 'pagar', label: 'Pagar palang', desc: 'Tiang di plat dasar + palang mendatar' },
      ],
    },
    { key: 'panjang', label: 'Panjang', type: 'number', unit: 'cm', min: 50, max: 200, step: 1, marks: [{ value: 100, label: 'umum' }] },
    { key: 'lebar', label: 'Lebar (dalam) / lebar kaki', type: 'number', unit: 'cm', min: 25, max: 60, step: 1, help: 'Untuk pagar: sisi plat dasar tiang. Untuk rangka gantung: panjang kaki T.', marks: [{ value: 35, label: 'umum' }] },
    { key: 'tinggiBox', label: 'Tinggi kotak pot', type: 'number', unit: 'cm', min: 30, max: 90, step: 1, help: 'Untuk pot berkaki: tinggi bibir pot dari lantai.', marks: [{ value: 50, label: 'umum' }], showIf: (p) => p.model === 'kotak' || p.model === 'layar' || p.model === 'kaki' },
    { key: 'dalamPot', label: 'Dalam pot', type: 'number', unit: 'cm', min: 15, max: 40, step: 1, showIf: (p) => p.model === 'kaki' },
    { key: 'tinggiLayar', label: 'Tinggi total', type: 'number', unit: 'cm', min: 80, max: 200, step: 1, marks: [{ value: 90, label: 'pagar' }, { value: 130, label: 'sekat duduk' }, { value: 160, label: 'sekat berdiri' }], showIf: (p) => p.model === 'layar' || p.model === 'rak' || p.model === 'gantung' || p.model === 'pagar' },
    {
      key: 'polaLayar',
      label: 'Pola layar',
      type: 'choice',
      options: [
        { value: 'tegak', label: 'Bilah tegak' },
        { value: 'datar', label: 'Bilah mendatar' },
        { value: 'kisi', label: 'Kisi kotak', desc: 'Rambatan tanaman' },
      ],
      showIf: (p) => p.model === 'layar',
    },
    { key: 'jarakBilah', label: 'Jarak antar bilah / palang', type: 'number', unit: 'cm', min: 5, max: 25, step: 1, showIf: (p) => p.model === 'layar' || p.model === 'pagar' },
    { key: 'tingkat', label: 'Jumlah tingkat', type: 'number', min: 2, max: 5, step: 1, showIf: (p) => p.model === 'rak' },
    ...materialParams(true),
    { key: 'roda', label: 'Pakai roda', type: 'toggle', help: 'Pembatas bisa dipindah untuk mengatur ulang ruang.', showIf: (p) => RODA_OK.includes(String(p.model)) },
    { key: 'ukuranRoda', label: 'Ukuran roda', type: 'choice', options: CASTER_OPTIONS, showIf: (p) => p.roda === true && RODA_OK.includes(String(p.model)) },
  ],
  defaults: { model: 'layar', panjang: 100, lebar: 35, tinggiBox: 50, dalamPot: 25, tinggiLayar: 130, polaLayar: 'tegak', jarakBilah: 10, tingkat: 3, pipa: '20', papan: 'kayu', warna: '#1f2226', roda: false, ukuranRoda: '3' },
  groups: [
    { id: 'pot', name: 'Kotak pot / planter', desc: 'kotak pot di lantai · pot berkaki' },
    { id: 'rangka', name: 'Partisi & pagar', desc: 'pot + layar bilah · pagar palang cafe' },
  ],
  signature: (p) => str(p, 'model', 'layar'),
  presets: [
    {
      id: 'kotak',
      group: 'pot',
      name: 'Kotak pot (planter box)',
      desc: 'kotak berangka berdinding papan, langsung di lantai',
      params: { model: 'kotak', roda: false, panjang: 120, lebar: 35, tinggiBox: 60 },
      sizes: [
        { label: 'Pembatas teras', desc: '120 × 35 × 60 cm', params: { panjang: 120, lebar: 35, tinggiBox: 60 } },
        { label: 'Pot pojok', desc: '50 × 50 × 70 cm', params: { panjang: 50, lebar: 50, tinggiBox: 70 } },
        { label: 'Kotak pot beroda', desc: '100 × 40 × 50 cm', params: { panjang: 100, lebar: 40, tinggiBox: 50, roda: true } },
      ],
    },
    {
      id: 'pot-kaki',
      group: 'pot',
      name: 'Kotak pot berkaki (kebun meja)',
      desc: 'pot dangkal melayang di atas 4 kaki tinggi, palang bawah keliling',
      params: { model: 'kaki', roda: false, panjang: 120, lebar: 45, tinggiBox: 80, dalamPot: 25 },
      sizes: [
        { label: 'Pembatas teras', desc: '120 × 45, tinggi 80 cm', params: { panjang: 120, lebar: 45, tinggiBox: 80 } },
        { label: 'Kebun sayur meja', desc: '150 × 60, tinggi 85 cm', params: { panjang: 150, lebar: 60, tinggiBox: 85, dalamPot: 30, pipa: '30' } },
        { label: 'Pot berkaki beroda', desc: '100 × 40, tinggi 75 cm', params: { panjang: 100, lebar: 40, tinggiBox: 75, roda: true } },
      ],
    },
    {
      id: 'layar',
      group: 'rangka',
      name: 'Pembatas pot + layar bilah',
      desc: 'kotak pot, layar bilah / kisi berdiri di atasnya',
      params: { model: 'layar', roda: false, polaLayar: 'tegak' },
      sizes: [
        { label: 'Sekat area duduk', desc: '100 × 35, tinggi 130 cm', params: { panjang: 100, lebar: 35, tinggiBox: 50, tinggiLayar: 130, jarakBilah: 10 } },
        { label: 'Sekat tinggi', desc: '120 × 40, tinggi 160 cm', params: { panjang: 120, lebar: 40, tinggiBox: 55, tinggiLayar: 160, jarakBilah: 12 } },
        { label: 'Partisi dorong (beroda)', desc: '100 × 40, tinggi 140 cm', params: { panjang: 100, lebar: 40, tinggiBox: 45, tinggiLayar: 140, jarakBilah: 10, roda: true } },
        { label: 'Layar kisi rambatan', desc: '120 × 40, tinggi 150 cm', params: { panjang: 120, lebar: 40, tinggiBox: 50, tinggiLayar: 150, polaLayar: 'kisi', jarakBilah: 15 } },
        { label: 'Layar bilah mendatar', desc: '100 × 35, tinggi 130 cm', params: { panjang: 100, lebar: 35, tinggiLayar: 130, polaLayar: 'datar', jarakBilah: 10 } },
      ],
    },
    {
      id: 'pagar',
      group: 'rangka',
      name: 'Pagar palang (pembatas cafe)',
      desc: 'tiang di atas plat dasar, palang mendatar bersusun',
      params: { model: 'pagar', panjang: 180, lebar: 35, tinggiLayar: 90, jarakBilah: 20 },
      sizes: [
        { label: 'Pembatas area outdoor', desc: '180 cm, tinggi 90', params: { panjang: 180, tinggiLayar: 90 } },
        { label: 'Pembatas antrian', desc: '120 cm, tinggi 100, palang jarang', params: { panjang: 120, tinggiLayar: 100, jarakBilah: 25 } },
        { label: 'Pagar rapat', desc: '200 cm, tinggi 100', params: { panjang: 200, tinggiLayar: 100, jarakBilah: 12, lebar: 40 } },
      ],
    },
  ],
  summary: (p) => {
    const m = str(p, 'model', 'layar');
    const H = m === 'kotak' || m === 'kaki' ? num(p, 'tinggiBox') : num(p, 'tinggiLayar');
    return `${num(p, 'panjang')} × ${num(p, 'lebar')} cm, tinggi ${H} cm${m === 'rak' ? ` · ${num(p, 'tingkat')} tingkat` : ''}`;
  },

  build: (p) => {
    const model = str(p, 'model', 'layar');
    const W = num(p, 'panjang', 100);
    const Dd = num(p, 'lebar', 35);
    const L = (parseInt(str(p, 'pipa', '20')) || 20) / 10;
    const bt = BOARD_THICK[str(p, 'papan', 'kayu')] ? 1.5 : 0;
    const roda = bool(p, 'roda') && RODA_OK.includes(model);
    const inch = parseInt(str(p, 'ukuranRoda', '3')) || 3;
    const c = roda ? casterHeight(inch) : 0;
    const t: [number, number] = [L * 10, L * 10];
    const thin: [number, number] = [20, 20];
    const { list, add, line } = memberFactory();
    const boards: Board[] = [];
    const xl = L / 2;
    const xr = W - L / 2;
    const zb = L / 2;
    const zf = Dd - L / 2;
    const Ht = num(p, 'tinggiLayar', 130);
    const casters = roda ? casterSet([xl, xr], [zb, zf], inch, true) : [];

    /** Rangka keliling (4 batang) pada ketinggian y */
    const ring = (nm: string, y: number, label: string) => {
      add(`${nm}-depan`, 'x', L, y, zf, W - 2 * L, 'rail-x', `${label} depan`, t);
      add(`${nm}-belakang`, 'x', L, y, zb, W - 2 * L, 'rail-x', `${label} belakang`, t);
      add(`${nm}-kiri`, 'z', xl, y, L, Dd - 2 * L, 'rail-z', `${label} kiri`, t);
      add(`${nm}-kanan`, 'z', xr, y, L, Dd - 2 * L, 'rail-z', `${label} kanan`, t);
    };
    const corners: [number, number, string][] = [
      [xl, zb, 'kiri belakang'],
      [xr, zb, 'kanan belakang'],
      [xl, zf, 'kiri depan'],
      [xr, zf, 'kanan depan'],
    ];
    /** Dinding papan + alas kotak pot dari y0 sampai y1 */
    const potWalls = (y0: number, y1: number) => {
      if (bt <= 0) return;
      boards.push(board('dinding-depan', 'Papan dinding depan', 0, W, y0, y1, Dd, Dd + bt));
      boards.push(board('dinding-belakang', 'Papan dinding belakang', 0, W, y0, y1, -bt, 0));
      boards.push(board('dinding-kiri', 'Papan dinding kiri', -bt, 0, y0, y1, 0, Dd));
      boards.push(board('dinding-kanan', 'Papan dinding kanan', W, W + bt, y0, y1, 0, Dd));
    };

    if (model === 'rak') {
      // Rak sekat: 4 tiang penuh, ambalan bertingkat, silang di kedua sisi pendek
      const n = Math.max(2, Math.round(num(p, 'tingkat', 3)));
      const H = Ht;
      corners.forEach(([x, z, nm], i) => add(`tiang-${i}`, 'y', x, c, z, H, 'post', `Tiang ${nm}`, t));
      const y0 = c + 12;
      const y1 = c + H - L / 2;
      for (let i = 0; i < n; i++) {
        const y = y0 + ((y1 - y0) * i) / (n - 1);
        ring(`tingkat-${i + 1}`, y, `Rangka ambalan ${i + 1}`);
        if (bt > 0) boards.push(board(`ambalan-${i + 1}`, `Papan ambalan ${i + 1}`, 0, W, y + L / 2, y + L / 2 + 1.8, 0, Dd));
      }
      const ys = y0 + (y1 - y0) / (n - 1);
      [xl, xr].forEach((x, i) => {
        const s = i ? 'kanan' : 'kiri';
        line(`silang-${s}-1`, [x, y0 + L / 2, zb + L / 2], [x, ys - L / 2, zf - L / 2], 'custom', `Silang sisi ${s} 1`, thin);
        line(`silang-${s}-2`, [x, y0 + L / 2, zf - L / 2], [x, ys - L / 2, zb + L / 2], 'custom', `Silang sisi ${s} 2`, thin);
      });
      return { members: list, boards, casters, W, D: Dd, H: c + H + (bt > 0 ? 1.8 : 0), boardThick: 0 };
    }

    if (model === 'gantung') {
      // Gawang: tiang tegak di tengah kaki T, palang atas & tengah, kait pot di palang atas
      const H = Ht;
      const zm = Dd / 2;
      [xl, xr].forEach((x, i) => {
        const s = i ? 'kanan' : 'kiri';
        add(`kaki-${s}`, 'z', x, L / 2, 0, Dd, 'rail-z', `Kaki T ${s}`, t);
        add(`tiang-${s}`, 'y', x, L, zm, H - L, 'post', `Tiang ${s}`, t);
        const yb = Math.min(35, H * 0.2);
        line(`topang-${s}-b`, [x, yb, zm - L / 2], [x, L, Math.min(zm - L, 5)], 'custom', `Topang kaki ${s} belakang`, thin);
        line(`topang-${s}-d`, [x, yb, zm + L / 2], [x, L, Math.max(zm + L, Dd - 5)], 'custom', `Topang kaki ${s} depan`, thin);
      });
      add('palang-atas', 'x', L, H - L / 2, zm, W - 2 * L, 'rail-x', 'Palang atas (gantungan)', t);
      add('palang-tengah', 'x', L, H * 0.45, zm, W - 2 * L, 'rail-x', 'Palang tengah', t);
      const nk = Math.max(1, Math.floor((W - 2 * L) / 30));
      const pk = (W - 2 * L) / (nk + 1);
      for (let i = 1; i <= nk; i++) add(`kait-${i}`, 'y', L + i * pk, H - L - 10, zm, 10, 'custom', `Batang kait pot ${i}`, thin);
      return { members: list, boards, casters: [], W, D: Dd, H, boardThick: 0 };
    }

    if (model === 'pagar') {
      // Pagar: tiang tiap ±100 cm berdiri di plat dasar, palang mendatar bersusun
      const H = Ht;
      const plate = Math.min(Dd, 45);
      const pt = 0.8; // plat 8 mm
      const zm = plate / 2;
      const nPost = Math.max(2, Math.ceil((W - L) / 100) + 1);
      const xs = Array.from({ length: nPost }, (_, i) => L / 2 + ((W - L) * i) / (nPost - 1));
      xs.forEach((x, i) => {
        add(`tiang-${i + 1}`, 'y', x, pt, zm, H - pt, 'post', `Tiang pagar ${i + 1}`, t);
        boards.push({ ...board(`plat-${i + 1}`, `Plat dasar tiang ${i + 1}`, x - plate / 2, x + plate / 2, 0, pt, 0, plate), steelMm: 8 });
      });
      const gap = num(p, 'jarakBilah', 20);
      const yTopR = H - L / 2;
      const nBar = Math.max(1, Math.floor((yTopR - 20) / gap));
      const ysBar = [yTopR, ...Array.from({ length: nBar }, (_, i) => yTopR - (i + 1) * ((yTopR - 15) / nBar))];
      for (let k = 0; k < xs.length - 1; k++)
        ysBar.forEach((y, j) => add(`palang-${k + 1}-${j + 1}`, 'x', xs[k] + L / 2, y, zm, xs[k + 1] - xs[k] - L, 'rail-x', j === 0 ? `Palang atas bentang ${k + 1}` : `Palang ${j + 1} bentang ${k + 1}`, j === 0 ? t : thin));
      return { members: list, boards, casters: [], W, D: plate, H, boardThick: 0 };
    }

    if (model === 'kaki') {
      // Pot berkaki: kotak dangkal di atas, palang bawah keliling untuk kaki
      const Hb = num(p, 'tinggiBox', 80);
      const dp = Math.min(num(p, 'dalamPot', 25), Hb - 20);
      const yTop = c + Hb;
      corners.forEach(([x, z, nm], i) => add(`kaki-${i}`, 'y', x, c, z, Hb, 'post', `Kaki ${nm}`, t));
      ring('pot-bawah', yTop - dp + L / 2, 'Rangka dasar pot');
      ring('pot-atas', yTop - L / 2, 'Rangka bibir pot');
      ring('palang-bawah', c + 15, 'Palang bawah');
      potWalls(yTop - dp, yTop);
      if (bt > 0) boards.push(board('alas-pot', 'Alas pot (beri lubang air)', L, W - L, yTop - dp + L, yTop - dp + L + 1.5, L, Dd - L));
      return { members: list, boards, casters, W, D: Dd, H: yTop, boardThick: 0 };
    }

    // Kotak pot (+ layar)
    const Hb = num(p, 'tinggiBox', 50);
    const yTop = c + Hb;
    corners.forEach(([x, z, nm], i) => add(`tiang-${i}`, 'y', x, c, z, Hb, 'post', `Tiang ${nm}`, t));
    ring('bawah', c + L / 2, 'Rangka bawah');
    ring('atas', yTop - L / 2, 'Rangka atas');

    const layar = model === 'layar' && Ht > Hb + 20;
    if (layar) {
      const zm = Dd / 2;
      const yS = c + Ht;
      const hs = Ht - Hb;
      add('layar-dasar', 'x', L, yTop - L / 2, zm, W - 2 * L, 'rail-x', 'Dasar layar', t);
      add('layar-kiri', 'y', xl, yTop, zm, hs, 'post', 'Tiang layar kiri', t);
      add('layar-kanan', 'y', xr, yTop, zm, hs, 'post', 'Tiang layar kanan', t);
      add('layar-atas', 'x', L, yS - L / 2, zm, W - 2 * L, 'rail-x', 'Palang atas layar', t);
      const gap = num(p, 'jarakBilah', 10);
      const pola = str(p, 'polaLayar', 'tegak');
      if (pola !== 'datar') {
        const g2 = pola === 'kisi' ? Math.max(gap, 10) : gap;
        const nSl = Math.max(1, Math.floor((W - 2 * L) / g2) - 1);
        const pitch = (W - 2 * L) / (nSl + 1);
        for (let i = 1; i <= nSl; i++) add(`bilah-${i}`, 'y', L + i * pitch, yTop, zm, hs - L, 'custom', `Bilah tegak ${i}`, thin);
      }
      if (pola !== 'tegak') {
        const g2 = pola === 'kisi' ? Math.max(gap, 10) : gap;
        const nH = Math.max(1, Math.floor((hs - L) / g2) - 1);
        const pitch = (hs - L) / (nH + 1);
        for (let i = 1; i <= nH; i++) add(`bilah-datar-${i}`, 'x', L, yTop + i * pitch, zm + (pola === 'kisi' ? 2 : 0), W - 2 * L, 'rail-x', `Bilah mendatar ${i}`, thin);
      }
    }
    potWalls(c + 1, yTop);
    if (bt > 0) boards.push(board('alas-pot', 'Alas pot (beri lubang air)', L, W - L, c + L, c + L + 1.5, L, Dd - L));
    return { members: list, boards, casters, W, D: Dd, H: layar ? c + Ht : yTop, boardThick: 0 };
  },

  checks: (p) => {
    const out: ProductCheck[] = [];
    const model = str(p, 'model', 'layar');
    const roda = bool(p, 'roda') && RODA_OK.includes(model);
    const H = num(p, 'tinggiLayar');
    const Dd = num(p, 'lebar');
    if (model === 'layar' && H / Dd > 4.5 && !roda)
      out.push({ level: 'info', message: 'Layar tinggi di atas kotak sempit: isi pot dengan tanah / batu sebagai pemberat supaya tidak terguling.' });
    if (model === 'layar' && roda && H > 150) out.push({ level: 'warn', message: 'Partisi beroda setinggi ini mudah terguling saat didorong.', fix: { label: 'Tinggi 140 cm', params: { tinggiLayar: 140 } } });
    if (model === 'layar' && H < num(p, 'tinggiBox') + 25) out.push({ level: 'info', message: 'Layar sangat pendek: lebih cocok pakai kotak pot biasa.' });
    if (model === 'rak') {
      if (H / Dd > 4.5) out.push({ level: 'warn', message: 'Rak sekat terlalu tinggi untuk lebarnya: mudah terguling.', fix: { label: `Lebar ${Math.ceil(H / 4.5)} cm`, params: { lebar: Math.min(60, Math.ceil(H / 4.5)) } } });
      if (roda && H > 150) out.push({ level: 'warn', message: 'Rak sekat beroda setinggi ini mudah terguling saat didorong.', fix: { label: 'Tinggi 140 cm', params: { tinggiLayar: 140 } } });
      if ((H - 12) / Math.max(1, num(p, 'tingkat') - 1) < 25) out.push({ level: 'warn', message: 'Jarak antar tingkat kurang dari 25 cm: pot tidak muat.', fix: { label: 'Kurangi 1 tingkat', params: { tingkat: Math.max(2, num(p, 'tingkat') - 1) } } });
    }
    if (model === 'gantung') {
      if (H / Dd > 4) out.push({ level: 'warn', message: 'Kaki T terlalu pendek untuk tinggi rangka: mudah terguling saat pot berayun.', fix: { label: `Kaki ${Math.ceil(H / 4)} cm`, params: { lebar: Math.min(60, Math.ceil(H / 4)) } } });
      if (num(p, 'panjang') > 140 && str(p, 'pipa') === '20') out.push({ level: 'warn', message: 'Palang gantungan panjang dengan pipa 20×20 melendut menahan pot basah.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
      out.push({ level: 'info', message: 'Pot gantung dipasang pakai ring S / rantai di batang kait. Pot basah bisa 5–10 kg per buah.' });
    }
    if (model === 'pagar') {
      if (H / Math.min(Dd, 45) > 3.2) out.push({ level: 'warn', message: 'Plat dasar terlalu kecil untuk tinggi pagar: mudah terguling.', fix: { label: 'Plat 40 cm', params: { lebar: 40 } } });
      out.push({ level: 'info', message: 'Plat dasar 8 mm bisa dibaut ke lantai untuk pagar permanen. Tiang dipasang tiap ±100 cm.' });
    }
    if (model === 'kaki' && num(p, 'dalamPot') > num(p, 'tinggiBox') - 30)
      out.push({ level: 'warn', message: 'Pot terlalu dalam untuk kakinya: lebih cocok pakai kotak pot biasa.', fix: { label: 'Dalam pot 25 cm', params: { dalamPot: 25 } } });
    if (model === 'kotak' || model === 'layar' || model === 'kaki')
      out.push({ level: 'info', message: 'Lapisi bagian dalam dengan plastik / plat galvanis dan beri lubang buang air. Rangka luar ruangan: galvanis atau cat dasar anti karat.' });
    return out;
  },
};
