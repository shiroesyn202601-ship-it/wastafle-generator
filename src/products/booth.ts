import { FrameMember } from '../types/kitchen';
import { Board, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, board, bool, materialParams, memberFactory, num, str } from './common';

const JOK_OPTIONS = [
  { value: '#3f4a3c', label: 'Hijau zaitun' },
  { value: '#7a3b2a', label: 'Terakota' },
  { value: '#2b2d31', label: 'Hitam' },
  { value: '#b49a76', label: 'Krem' },
  { value: '#355c7d', label: 'Biru' },
];

/**
 * Rangka booth / sofa cafe: dudukan berbusa, sandaran tinggi miring.
 * Tunggal (menempel tembok) atau ganda punggung-ke-punggung (sandaran saling menempel di atas).
 */
export const BOOTH: ProductDef = {
  id: 'booth',
  name: 'Booth / sofa cafe',
  tagline: 'tunggal · punggung-ke-punggung',
  icon: 'M6 36V8M6 24h22M28 24v12M54 36V8M54 24H32M32 24v12',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['sisi', 'panjang', 'tinggiDudukan', 'dalamDudukan'] },
    { id: 'bentuk', title: 'Sandaran', keys: ['tinggiSandaran', 'miringSandaran', 'busa', 'warnaJok'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Selesai', keys: [] },
  ],
  params: [
    {
      key: 'sisi',
      label: 'Jenis booth',
      type: 'choice',
      options: [
        { value: 'tunggal', label: 'Tunggal', desc: 'Menempel tembok, satu arah' },
        { value: 'ganda', label: 'Punggung-ke-punggung', desc: 'Dua sisi di tengah ruangan' },
      ],
    },
    { key: 'panjang', label: 'Panjang', type: 'number', unit: 'cm', min: 60, max: 300, step: 1, help: '±60 cm per orang.', marks: [{ value: 120, label: '2 orang' }, { value: 180, label: '3 orang' }] },
    { key: 'tinggiDudukan', label: 'Tinggi dudukan (dengan busa)', type: 'number', unit: 'cm', min: 40, max: 50, step: 1, marks: [{ value: 46, label: 'standar' }] },
    { key: 'dalamDudukan', label: 'Kedalaman dudukan', type: 'number', unit: 'cm', min: 40, max: 60, step: 1, marks: [{ value: 48, label: 'umum' }] },
    { key: 'tinggiSandaran', label: 'Tinggi sandaran dari lantai', type: 'number', unit: 'cm', min: 80, max: 140, step: 1, marks: [{ value: 90, label: 'standar' }, { value: 107, label: 'tinggi' }, { value: 122, label: 'privat' }] },
    { key: 'miringSandaran', label: 'Kemiringan sandaran', type: 'number', unit: '°', min: 0, max: 15, step: 1, marks: [{ value: 10, label: 'nyaman' }] },
    { key: 'busa', label: 'Busa & jok', type: 'toggle', help: 'Gambar busa dudukan & sandaran (dibuat tukang jok).' },
    { key: 'warnaJok', label: 'Warna jok', type: 'choice', options: JOK_OPTIONS, showIf: (p) => p.busa === true },
    ...materialParams(true),
  ],
  defaults: { sisi: 'tunggal', panjang: 120, tinggiDudukan: 46, dalamDudukan: 48, tinggiSandaran: 100, miringSandaran: 10, busa: true, warnaJok: '#3f4a3c', pipa: '30', papan: 'kayu', warna: '#1f2226' },
  presets: [
    {
      id: 'tunggal',
      name: 'Booth tunggal menempel tembok',
      desc: 'satu dudukan, sandaran miring',
      params: { sisi: 'tunggal' },
      sizes: [
        { label: '2 orang', desc: '120 cm, sandaran 100', params: { panjang: 120, tinggiSandaran: 100 } },
        { label: '3 orang', desc: '180 cm, sandaran 107', params: { panjang: 180, tinggiSandaran: 107 } },
        { label: 'Panjang sepanjang tembok', desc: '240 cm, sandaran 90', params: { panjang: 240, tinggiSandaran: 90 } },
      ],
    },
    {
      id: 'ganda',
      name: 'Booth punggung-ke-punggung',
      desc: 'dua dudukan berbagi sandaran tengah',
      params: { sisi: 'ganda' },
      sizes: [
        { label: '2 + 2 orang', desc: '120 cm, sandaran 107', params: { panjang: 120, tinggiSandaran: 107 } },
        { label: 'Privat tinggi', desc: '150 cm, sandaran 122', params: { panjang: 150, tinggiSandaran: 122, miringSandaran: 8 } },
      ],
    },
  ],
  summary: (p) => `${str(p, 'sisi') === 'ganda' ? 'Ganda' : 'Tunggal'} · ${num(p, 'panjang')} cm, sandaran ${num(p, 'tinggiSandaran')} cm`,

  build: (p) => {
    const W = num(p, 'panjang', 120);
    const D = num(p, 'dalamDudukan', 48);
    const Hs = num(p, 'tinggiDudukan', 46);
    const Hb = num(p, 'tinggiSandaran', 100);
    const tilt = num(p, 'miringSandaran', 10);
    const tanT = Math.tan((tilt * Math.PI) / 180);
    const L = (parseInt(str(p, 'pipa', '30')) || 30) / 10;
    const b = BOARD_THICK[str(p, 'papan', 'multiplek')] ?? 1.8;
    const foam = bool(p, 'busa') ? 10 : 0;
    const jok = str(p, 'warnaJok', '#3f4a3c');
    const deckTop = Hs - foam;
    const yS = deckTop - b; // ujung atas rangka dudukan
    const zs = tanT * (Hb - yS); // geser ke depan supaya sandaran miring tidak keluar ke belakang
    const rail: [number, number] = [20, 20];
    const post: [number, number] = [L * 10, L * 10];

    /** Satu sisi booth menghadap +z, sandaran di z kecil */
    const side = (prefix: string) => {
      const { list, add, line } = memberFactory();
      const boards: Board[] = [];
      const n = Math.max(2, Math.ceil(W / 80) + 1);
      const xs = Array.from({ length: n }, (_, i) => L / 2 + ((W - L) * i) / (n - 1));
      const zb = zs + L / 2;
      const zf = zs + D - L / 2;
      const zBack = (y: number) => zb - tanT * (y - yS);
      xs.forEach((x, i) => {
        add(`${prefix}kaki-d-${i}`, 'y', x, 0, zf, yS, 'post', `Kaki depan ${i + 1}`, post);
        if (tilt === 0) add(`${prefix}tiang-b-${i}`, 'y', x, 0, zb, Hb, 'post', `Tiang sandaran ${i + 1}`, post);
        else {
          add(`${prefix}kaki-b-${i}`, 'y', x, 0, zb, yS, 'post', `Kaki belakang ${i + 1}`, post);
          line(`${prefix}tiang-b-${i}`, [x, yS, zb], [x, Hb, zBack(Hb)], 'post', `Tiang sandaran ${i + 1}`, post);
        }
        add(`${prefix}palang-dudukan-${i}`, 'z', x, yS - 1, zb + L / 2, zf - zb - L, 'rail-z', `Palang dudukan ${i + 1}`, rail);
      });
      add(`${prefix}gelagar-d`, 'x', 0, yS - 1, zf, W, 'rail-x', 'Gelagar dudukan depan', rail);
      add(`${prefix}gelagar-b`, 'x', 0, yS - 1, zb, W, 'rail-x', 'Gelagar dudukan belakang', rail);
      add(`${prefix}bawah-d`, 'x', 0, 8, zf, W, 'rail-x', 'Gelagar bawah depan', rail);
      add(`${prefix}bawah-b`, 'x', 0, 8, zb, W, 'rail-x', 'Gelagar bawah belakang', rail);
      const yTopRail = Hb - 1;
      const yMid = (yS + Hb) / 2;
      add(`${prefix}sandaran-atas`, 'x', 0, yTopRail, zBack(yTopRail), W, 'rail-x', 'Gelagar sandaran atas', rail);
      add(`${prefix}sandaran-tengah`, 'x', 0, yMid, zBack(yMid), W, 'rail-x', 'Gelagar sandaran tengah', rail);

      if (b > 0) boards.push(board(`${prefix}alas`, 'Alas dudukan', 0, W, yS, deckTop, zs, zs + D));
      // Papan sandaran (penutup belakang busa), miring
      const hgt = (Hb - (yS + 4)) / Math.cos((tilt * Math.PI) / 180);
      const ym = (Hb + yS + 4) / 2;
      const zc = zBack(ym) + 1 + 0.9;
      if (b > 0) boards.push({ ...board(`${prefix}papan-sandaran`, 'Papan sandaran', 0, W, ym - hgt / 2, ym + hgt / 2, zc - 0.9, zc + 0.9), rotX: -tilt });
      if (foam) {
        boards.push({ ...board(`${prefix}busa-dudukan`, 'Busa dudukan', 1, W - 1, deckTop, Hs, zs + 6, zs + D), color: jok });
        const fh = (Hb - 3 - (Hs + 1)) / Math.cos((tilt * Math.PI) / 180);
        const fm = (Hb - 3 + Hs + 1) / 2;
        const fz = zBack(fm) + 1 + 1.8 + 4;
        boards.push({ ...board(`${prefix}busa-sandaran`, 'Busa sandaran', 1, W - 1, fm - fh / 2, fm + fh / 2, fz - 4, fz + 4), rotX: -tilt, color: jok });
      }
      return { list, boards };
    };

    const a = side('');
    const D1 = zs + D;
    if (str(p, 'sisi') !== 'ganda') return { members: a.list, boards: a.boards, casters: [], W, D: D1, H: Hb, boardThick: 0, wall: true };

    // Ganda: sisi A dicerminkan (menghadap −z), sisi B digeser; sandaran keduanya bertemu di tengah
    const mirrorZ = (m: FrameMember, total: number): FrameMember => {
      if (m.end) return { ...m, z: total - m.z, end: { ...m.end, z: total - m.end.z } };
      if (m.axis === 'z') return { ...m, z: total - m.z - m.length };
      return { ...m, z: total - m.z };
    };
    const A = a.list.map((m) => ({ ...mirrorZ(m, D1), id: `a-${m.id}` }));
    const Ab = a.boards.map((bd) => ({ ...bd, id: `a-${bd.id}`, rotX: bd.rotX ? -bd.rotX : undefined, box: { min: [bd.box.min[0], bd.box.min[1], D1 - bd.box.max[2]] as [number, number, number], max: [bd.box.max[0], bd.box.max[1], D1 - bd.box.min[2]] as [number, number, number] } }));
    const sB = side('b-');
    const B = sB.list.map((m) => (m.end ? { ...m, z: m.z + D1, end: { ...m.end, z: m.end.z + D1 } } : { ...m, z: m.z + D1 }));
    const Bb = sB.boards.map((bd) => ({ ...bd, box: { min: [bd.box.min[0], bd.box.min[1], bd.box.min[2] + D1] as [number, number, number], max: [bd.box.max[0], bd.box.max[1], bd.box.max[2] + D1] as [number, number, number] } }));
    return { members: [...A, ...B], boards: [...Ab, ...Bb], casters: [], W, D: 2 * D1, H: Hb, boardThick: 0 };
  },

  checks: (p) => {
    const out: ProductCheck[] = [];
    if (num(p, 'panjang') > 160 && str(p, 'pipa') === '20') out.push({ level: 'warn', message: 'Booth panjang dengan pipa 20×20 terasa goyang saat diduduki banyak orang.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
    out.push({ level: 'info', message: `Muat ±${Math.max(1, Math.floor(num(p, 'panjang') / 60))} orang per sisi. Meja di depan booth: tinggi 75 cm, tepi meja menutupi dudukan ±5 cm.` });
    if (str(p, 'sisi') === 'ganda') out.push({ level: 'info', message: 'Jarak antar booth berhadapan (dengan meja 70 cm di tengah) sekitar 170–190 cm.' });
    out.push({ level: 'info', message: 'Busa & kain jok dikerjakan tukang jok; rangka besi sebaiknya galvanis / cat dasar anti karat.' });
    return out;
  },
};
