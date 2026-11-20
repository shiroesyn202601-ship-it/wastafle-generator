import { Board, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, board, bool, materialParams, memberFactory, num, str } from './common';

/**
 * Papan menu berdiri model A: dua rangka miring bertemu di atas, papan muka di satu / dua sisi,
 * palang penahan bukaan di bawah.
 */
export const PAPAN_MENU: ProductDef = {
  id: 'papan-menu',
  name: 'Papan menu berdiri',
  tagline: 'A-frame · papan tulis · promo',
  icon: 'M30 4L14 36M30 4l16 32M20 26h20',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['lebar', 'tinggiMuka', 'tinggi', 'sudut'] },
    { id: 'bentuk', title: 'Muka', keys: ['duaSisi'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Selesai', keys: [] },
  ],
  params: [
    { key: 'lebar', label: 'Lebar', type: 'number', unit: 'cm', min: 35, max: 90, step: 1, marks: [{ value: 60, label: 'umum' }] },
    { key: 'tinggiMuka', label: 'Tinggi bidang papan', type: 'number', unit: 'cm', min: 40, max: 110, step: 1, marks: [{ value: 75, label: 'kecil' }, { value: 90, label: 'umum' }] },
    { key: 'tinggi', label: 'Tinggi keseluruhan', type: 'number', unit: 'cm', min: 60, max: 130, step: 1, marks: [{ value: 105, label: 'umum' }] },
    { key: 'sudut', label: 'Sudut bukaan tiap sisi', type: 'number', unit: '°', min: 8, max: 25, step: 1, help: 'Makin besar makin stabil kena angin, tapi makin makan tempat.', marks: [{ value: 15, label: 'umum' }] },
    { key: 'duaSisi', label: 'Papan di dua sisi', type: 'toggle', help: 'Menu terlihat dari dua arah jalan.' },
    ...materialParams(true),
  ],
  defaults: { lebar: 60, tinggiMuka: 90, tinggi: 105, sudut: 15, duaSisi: true, pipa: '20', papan: 'kayu', warna: '#1f2226' },
  presets: [
    {
      id: 'a-frame',
      name: 'Papan menu A-frame',
      desc: 'dua rangka miring, palang penahan bawah',
      params: {},
      sizes: [
        { label: 'Umum 60 × 90', desc: 'tinggi 105 cm', params: { lebar: 60, tinggiMuka: 90, tinggi: 105 } },
        { label: 'Kecil 45 × 75', desc: 'tinggi 90 cm', params: { lebar: 45, tinggiMuka: 75, tinggi: 90 } },
        { label: 'Besar 64 × 110', desc: 'tinggi 125 cm', params: { lebar: 64, tinggiMuka: 110, tinggi: 125, pipa: '20' } },
      ],
    },
  ],
  summary: (p) => `${num(p, 'lebar')} × ${num(p, 'tinggiMuka')} cm, tinggi ${num(p, 'tinggi')} cm`,

  build: (p) => {
    const W = num(p, 'lebar', 60);
    const H = num(p, 'tinggi', 105);
    const fh = Math.min(num(p, 'tinggiMuka', 90), H - 10);
    const th = (num(p, 'sudut', 15) * Math.PI) / 180;
    const tan = Math.tan(th);
    const L = (parseInt(str(p, 'pipa', '20')) || 20) / 10;
    const bt = BOARD_THICK[str(p, 'papan', 'multiplek')] ? 1.2 : 0;
    const t: [number, number] = [L * 10, L * 10];
    const { list, add, line } = memberFactory();
    const boards: Board[] = [];
    const half = H * tan + L + bt + 1;
    const zc = half; // garis puncak di tengah kedalaman
    const zAt = (s: 1 | -1, y: number) => zc + s * ((H - y) * tan + L / 2);
    const top = H - L / 2;

    ([1, -1] as const).forEach((s) => {
      const nm = s > 0 ? 'depan' : 'belakang';
      [L / 2, W - L / 2].forEach((x, i) => line(`tiang-${nm}-${i}`, [x, 0, zAt(s, 0)], [x, top, zAt(s, top)], 'post', `Rangka ${nm} ${i ? 'kanan' : 'kiri'}`, t));
      const yRails = [top - L / 2, top - L - fh];
      yRails.forEach((y, k) => add(`palang-${nm}-${k}`, 'x', L, y, zAt(s, y), W - 2 * L, 'rail-x', `Palang ${nm} ${k ? 'bawah' : 'atas'}`, t));
      if (bt > 0 && (s > 0 || bool(p, 'duaSisi'))) {
        const ym = top - L - fh / 2;
        const hgt = fh / Math.cos(th);
        const zFace = zAt(s, ym) + s * (L / 2 + bt / 2);
        boards.push({ ...board(`muka-${nm}`, `Papan menu ${nm}`, L / 2, W - L / 2, ym - hgt / 2, ym + hgt / 2, zFace - bt / 2, zFace + bt / 2), rotX: s > 0 ? -num(p, 'sudut', 15) : num(p, 'sudut', 15) });
      }
    });
    // Palang penahan bukaan (depan ↔ belakang) di bawah, kiri & kanan
    const yb = 22;
    [L / 2, W - L / 2].forEach((x, i) => add(`penahan-${i}`, 'z', x, yb, zAt(-1, yb) + L / 2, zAt(1, yb) - zAt(-1, yb) - L, 'rail-z', `Palang penahan bukaan ${i ? 'kanan' : 'kiri'}`, [15, 15]));

    return { members: list, boards, casters: [], W, D: 2 * half, H, boardThick: 0 };
  },

  checks: (p) => {
    const out: ProductCheck[] = [];
    if (num(p, 'tinggiMuka') > num(p, 'tinggi') - 10) out.push({ level: 'warn', message: 'Bidang papan hampir setinggi rangka: tidak ada ruang kaki bawah.', fix: { label: `Tinggi ${num(p, 'tinggiMuka') + 15} cm`, params: { tinggi: Math.min(130, num(p, 'tinggiMuka') + 15) } } });
    if (num(p, 'sudut') < 12) out.push({ level: 'info', message: 'Sudut kecil membuat papan mudah roboh tertiup angin di luar ruangan.' });
    out.push({ level: 'info', message: 'Kedua rangka disatukan engsel di puncak (dua engsel kecil) supaya bisa dilipat & disimpan. Papan tulis kapur / spidol atau plat 1 mm untuk magnet.' });
    return out;
  },
};
