import { Board, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, CASTER_OPTIONS, board, bool, casterHeight, casterSet, materialParams, memberFactory, num, str } from './common';

/**
 * Pembatas / partisi tanaman: kotak pot berangka dengan papan dinding & alas, layar bilah tegak di atasnya,
 * opsional beroda untuk mengatur ulang ruang cafe.
 */
export const PEMBATAS: ProductDef = {
  id: 'pembatas',
  name: 'Pembatas tanaman',
  tagline: 'partisi · pot · sekat ruang cafe',
  icon: 'M6 36h48M6 22h48M6 22v14M54 22v14M12 22V4M20 22V4M28 22V4M36 22V4M44 22V4',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['panjang', 'lebar', 'tinggiBox'] },
    { id: 'bentuk', title: 'Layar', keys: ['layar', 'tinggiLayar', 'jarakBilah'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Roda', keys: ['roda', 'ukuranRoda'] },
  ],
  params: [
    { key: 'panjang', label: 'Panjang', type: 'number', unit: 'cm', min: 50, max: 200, step: 1, marks: [{ value: 100, label: 'umum' }] },
    { key: 'lebar', label: 'Lebar kotak pot', type: 'number', unit: 'cm', min: 25, max: 60, step: 1, marks: [{ value: 35, label: 'umum' }] },
    { key: 'tinggiBox', label: 'Tinggi kotak pot', type: 'number', unit: 'cm', min: 30, max: 90, step: 1, marks: [{ value: 50, label: 'umum' }] },
    { key: 'layar', label: 'Layar bilah di atas', type: 'toggle', help: 'Bilah tegak sebagai sekat pandangan / rambatan tanaman.' },
    { key: 'tinggiLayar', label: 'Tinggi total dengan layar', type: 'number', unit: 'cm', min: 90, max: 180, step: 1, marks: [{ value: 130, label: 'sekat duduk' }, { value: 160, label: 'sekat berdiri' }], showIf: (p) => p.layar === true },
    { key: 'jarakBilah', label: 'Jarak antar bilah', type: 'number', unit: 'cm', min: 5, max: 25, step: 1, showIf: (p) => p.layar === true },
    ...materialParams(true),
    { key: 'roda', label: 'Pakai roda', type: 'toggle', help: 'Pembatas bisa dipindah untuk mengatur ulang ruang.' },
    { key: 'ukuranRoda', label: 'Ukuran roda', type: 'choice', options: CASTER_OPTIONS, showIf: (p) => p.roda === true },
  ],
  defaults: { panjang: 100, lebar: 35, tinggiBox: 50, layar: true, tinggiLayar: 130, jarakBilah: 10, pipa: '20', papan: 'kayu', warna: '#1f2226', roda: false, ukuranRoda: '3' },
  presets: [
    {
      id: 'layar',
      name: 'Pembatas pot + layar bilah',
      desc: 'kotak pot, bilah tegak di atas',
      params: { layar: true, roda: false },
      sizes: [
        { label: 'Sekat area duduk', desc: '100 × 35, tinggi 130 cm', params: { panjang: 100, lebar: 35, tinggiBox: 50, tinggiLayar: 130, jarakBilah: 10 } },
        { label: 'Sekat tinggi', desc: '120 × 40, tinggi 160 cm', params: { panjang: 120, lebar: 40, tinggiBox: 55, tinggiLayar: 160, jarakBilah: 12 } },
      ],
    },
    {
      id: 'beroda',
      name: 'Pembatas pot + layar, beroda',
      desc: 'bisa didorong untuk mengatur ruang',
      params: { layar: true, roda: true },
      sizes: [{ label: 'Partisi dorong', desc: '100 × 40, tinggi 140 cm', params: { panjang: 100, lebar: 40, tinggiBox: 45, tinggiLayar: 140, jarakBilah: 10 } }],
    },
    {
      id: 'kotak',
      name: 'Kotak pot (planter box)',
      desc: 'kotak berangka tanpa layar',
      params: { layar: false, roda: false },
      sizes: [
        { label: 'Pembatas teras', desc: '120 × 35 × 60 cm', params: { panjang: 120, lebar: 35, tinggiBox: 60 } },
        { label: 'Pot pojok', desc: '50 × 50 × 70 cm', params: { panjang: 50, lebar: 50, tinggiBox: 70 } },
      ],
    },
  ],
  summary: (p) => `${num(p, 'panjang')} × ${num(p, 'lebar')} cm, tinggi ${bool(p, 'layar') ? num(p, 'tinggiLayar') : num(p, 'tinggiBox')} cm`,

  build: (p) => {
    const W = num(p, 'panjang', 100);
    const Dd = num(p, 'lebar', 35);
    const Hb = num(p, 'tinggiBox', 50);
    const L = (parseInt(str(p, 'pipa', '20')) || 20) / 10;
    const bt = BOARD_THICK[str(p, 'papan', 'kayu')] ? 1.5 : 0;
    const roda = bool(p, 'roda');
    const inch = parseInt(str(p, 'ukuranRoda', '3')) || 3;
    const c = roda ? casterHeight(inch) : 0;
    const t: [number, number] = [L * 10, L * 10];
    const { list, add } = memberFactory();
    const boards: Board[] = [];
    const xl = L / 2;
    const xr = W - L / 2;
    const zb = L / 2;
    const zf = Dd - L / 2;
    const yTop = c + Hb;
    [
      [xl, zb, 'kiri belakang'],
      [xr, zb, 'kanan belakang'],
      [xl, zf, 'kiri depan'],
      [xr, zf, 'kanan depan'],
    ].forEach(([x, z, nm], i) => add(`tiang-${i}`, 'y', x as number, c, z as number, Hb, 'post', `Tiang ${nm}`, t));
    [
      [c + L / 2, 'bawah'],
      [yTop - L / 2, 'atas'],
    ].forEach(([y, nm]) => {
      add(`${nm}-depan`, 'x', L, y as number, zf, W - 2 * L, 'rail-x', `Rangka ${nm} depan`, t);
      add(`${nm}-belakang`, 'x', L, y as number, zb, W - 2 * L, 'rail-x', `Rangka ${nm} belakang`, t);
      add(`${nm}-kiri`, 'z', xl, y as number, L, Dd - 2 * L, 'rail-z', `Rangka ${nm} kiri`, t);
      add(`${nm}-kanan`, 'z', xr, y as number, L, Dd - 2 * L, 'rail-z', `Rangka ${nm} kanan`, t);
    });

    const Hs = num(p, 'tinggiLayar', 130);
    if (bool(p, 'layar') && Hs > Hb + 20) {
      const zm = Dd / 2;
      const yS = c + Hs;
      add('layar-dasar', 'x', L, yTop - L / 2, zm, W - 2 * L, 'rail-x', 'Dasar layar', t);
      add('layar-kiri', 'y', xl, yTop, zm, Hs - Hb, 'post', 'Tiang layar kiri', t);
      add('layar-kanan', 'y', xr, yTop, zm, Hs - Hb, 'post', 'Tiang layar kanan', t);
      add('layar-atas', 'x', L, yS - L / 2, zm, W - 2 * L, 'rail-x', 'Palang atas layar', t);
      const gap = num(p, 'jarakBilah', 10);
      const nSl = Math.max(1, Math.floor((W - 2 * L) / gap) - 1);
      const pitch = (W - 2 * L) / (nSl + 1);
      for (let i = 1; i <= nSl; i++) add(`bilah-${i}`, 'y', L + i * pitch, yTop, zm, Hs - Hb - L, 'custom', `Bilah layar ${i}`, [20, 20]);
    }

    if (bt > 0) {
      boards.push(board('dinding-depan', 'Papan dinding depan', 0, W, c + 1, yTop, Dd, Dd + bt));
      boards.push(board('dinding-belakang', 'Papan dinding belakang', 0, W, c + 1, yTop, -bt, 0));
      boards.push(board('dinding-kiri', 'Papan dinding kiri', -bt, 0, c + 1, yTop, 0, Dd));
      boards.push(board('dinding-kanan', 'Papan dinding kanan', W, W + bt, c + 1, yTop, 0, Dd));
      boards.push(board('alas-pot', 'Alas pot (beri lubang air)', L, W - L, c + L, c + L + 1.5, L, Dd - L));
    }
    const res = { members: list, boards, casters: roda ? casterSet([xl, xr], [zb, zf], inch, true) : [], W, D: Dd, H: bool(p, 'layar') ? c + Hs : yTop, boardThick: 0 };
    return res;
  },

  checks: (p) => {
    const out: ProductCheck[] = [];
    if (bool(p, 'layar') && num(p, 'tinggiLayar') / num(p, 'lebar') > 4.5 && !bool(p, 'roda'))
      out.push({ level: 'info', message: 'Layar tinggi di atas kotak sempit: isi pot dengan tanah / batu sebagai pemberat supaya tidak terguling.' });
    if (bool(p, 'layar') && bool(p, 'roda') && num(p, 'tinggiLayar') > 150)
      out.push({ level: 'warn', message: 'Partisi beroda setinggi ini mudah terguling saat didorong.', fix: { label: 'Tinggi 140 cm', params: { tinggiLayar: 140 } } });
    out.push({ level: 'info', message: 'Lapisi bagian dalam dengan plastik / plat galvanis dan beri lubang buang air. Rangka luar ruangan: galvanis atau cat dasar anti karat.' });
    return out;
  },
};
