import { FrameHinge } from '../types/kitchen';
import { Board, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, board, bool, materialParams, memberFactory, num, str } from './common';

/**
 * Meja dinding lipat: rel dinding dibaut ke tembok, daun meja dengan rangka 4 sisi menempel pada rel lewat
 * engsel memanjang. Engsel kunci (siku lipat) menahan daun tetap datar; dilipat turun 90° menempel dinding.
 */
export const MEJA_DINDING: ProductDef = {
  id: 'meja-dinding',
  name: 'Meja dinding',
  tagline: 'lipat · hemat tempat · kos & dapur kecil',
  icon: 'M6 4v32M6 14h40M10 14v8M42 14v8',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['panjang', 'dalam', 'tinggi'] },
    { id: 'bentuk', title: 'Lipat', keys: ['lipat', 'jumlahEngsel'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Selesai', keys: [] },
  ],
  params: [
    { key: 'panjang', label: 'Panjang', type: 'number', unit: 'cm', min: 40, max: 160, step: 1, marks: [{ value: 60, label: '1 orang' }, { value: 100, label: '2 orang' }] },
    { key: 'dalam', label: 'Kedalaman', type: 'number', unit: 'cm', min: 25, max: 60, step: 1, help: 'Jarak dari dinding ke tepi depan.', marks: [{ value: 40, label: 'umum' }] },
    { key: 'tinggi', label: 'Tinggi dari lantai', type: 'number', unit: 'cm', min: 60, max: 110, step: 1, marks: [{ value: 75, label: 'meja makan' }, { value: 90, label: 'meja dapur' }, { value: 105, label: 'meja bar' }] },
    { key: 'lipat', label: 'Bisa dilipat ke bawah', type: 'toggle', help: 'Daun meja dilipat turun menempel dinding saat tidak dipakai. Klik engselnya di 3D.' },
    {
      key: 'jumlahEngsel',
      label: 'Engsel',
      type: 'choice',
      options: [
        { value: 'piano', label: 'Engsel piano menerus', desc: 'Rata sepanjang meja' },
        { value: 'siku', label: 'Siku lipat kunci', desc: 'Terkunci saat datar, kuat menahan beban' },
      ],
      showIf: (p) => p.lipat === true,
    },
    ...materialParams(true),
  ],
  defaults: { panjang: 80, dalam: 40, tinggi: 75, lipat: true, jumlahEngsel: 'siku', pipa: '20', papan: 'kayu', warna: '#1f2226' },
  presets: [
    {
      id: 'lipat',
      name: 'Meja dinding lipat',
      desc: 'rel tembok + daun meja dilipat turun',
      params: { lipat: true },
      sizes: [
        { label: 'Makan 1–2 orang', desc: '80 × 40 cm, tinggi 75', params: { panjang: 80, dalam: 40, tinggi: 75 } },
        { label: 'Bar dinding', desc: '120 × 35 cm, tinggi 105', params: { panjang: 120, dalam: 35, tinggi: 105 } },
        { label: 'Kerja', desc: '100 × 50 cm, tinggi 75', params: { panjang: 100, dalam: 50, tinggi: 75 } },
      ],
    },
    {
      id: 'tetap',
      name: 'Meja dinding tetap (ambalan)',
      desc: 'rel tembok, daun tidak dilipat',
      params: { lipat: false },
      sizes: [
        { label: 'Bar menghadap tembok', desc: '150 × 35 cm, tinggi 105', params: { panjang: 150, dalam: 35, tinggi: 105 } },
        { label: 'Meja kerja dinding', desc: '120 × 50 cm, tinggi 75', params: { panjang: 120, dalam: 50, tinggi: 75 } },
      ],
    },
  ],
  summary: (p) => `${num(p, 'panjang')} × ${num(p, 'dalam')} cm, tinggi ${num(p, 'tinggi')} cm${bool(p, 'lipat') ? ' · lipat' : ''}`,

  build: (p) => {
    const W = num(p, 'panjang', 80);
    const D = num(p, 'dalam', 40);
    const H = num(p, 'tinggi', 75);
    const b = BOARD_THICK[str(p, 'papan', 'hpl')] ?? 1.9;
    const L = (parseInt(str(p, 'pipa', '20')) || 20) / 10;
    const t: [number, number] = [L * 10, L * 10];
    const { list, add } = memberFactory();
    const yTop = H - b;
    const y = yTop - L / 2; // as rangka daun & rel dinding

    // Rel dinding (dibaut ke tembok) + 2 plat tegak penahan di ujungnya
    add('rel-dinding', 'x', 0, y, L / 2, W, 'rail-x', 'Rel dinding (dibaut ke tembok)', t);
    add('plat-dinding-kiri', 'y', L / 2, y - 25 - L / 2, L / 2, 25, 'post', 'Tiang dinding kiri', t);
    add('plat-dinding-kanan', 'y', W - L / 2, y - 25 - L / 2, L / 2, 25, 'post', 'Tiang dinding kanan', t);

    // Rangka daun meja: belakang menempel rel dinding (engsel memanjang), depan, kiri, kanan
    add('daun-belakang', 'x', 0, y, L + L / 2, W, 'rail-x', 'Rangka daun belakang (engsel)', t);
    add('daun-depan', 'x', 0, y, D - L / 2, W, 'rail-x', 'Rangka daun depan', t);
    add('daun-kiri', 'z', L / 2, y, 2 * L, D - 3 * L, 'rail-z', 'Rangka daun kiri', t);
    add('daun-kanan', 'z', W - L / 2, y, 2 * L, D - 3 * L, 'rail-z', 'Rangka daun kanan', t);
    if (W > 90) add('daun-tengah', 'z', W / 2, y, 2 * L, D - 3 * L, 'rail-z', 'Rangka daun tengah', t);

    const hinges: FrameHinge[] = bool(p, 'lipat')
      ? [
          {
            id: 'engsel-dinding',
            memberId: 'daun-belakang',
            partnerId: 'rel-dinding',
            mode: 'edge',
            type: str(p, 'jumlahEngsel') === 'piano' ? 'piano' : 'folding-lock',
            pos: 0,
            side: 'end',
            foldAxis: 'y',
            foldSign: -1,
            carry: true,
            label: 'Engsel daun meja dinding',
          },
        ]
      : [];

    const boards: Board[] = b > 0 ? [{ ...board('daun-meja', 'Daun meja', 0, W, yTop, H, L, D), attachTo: 'daun-depan' }] : [];
    return { members: list, boards, casters: [], W, D, H, boardThick: 0, hinges: hinges.length ? hinges : undefined, wall: true };
  },

  checks: (p) => {
    const out: ProductCheck[] = [];
    if (num(p, 'dalam') > 45 && str(p, 'jumlahEngsel') === 'piano' && bool(p, 'lipat'))
      out.push({ level: 'warn', message: 'Daun dalam dengan engsel piano saja mudah melendut di depan. Siku lipat kunci lebih kuat.', fix: { label: 'Pakai siku lipat', params: { jumlahEngsel: 'siku' } } });
    if (num(p, 'tinggi') - num(p, 'dalam') < 10 && bool(p, 'lipat'))
      out.push({ level: 'warn', message: 'Saat dilipat, daun meja hampir menyentuh lantai.', fix: { label: 'Kedalaman 40 cm', params: { dalam: 40 } } });
    out.push({ level: 'info', message: 'Rel dinding dibaut ke tembok bata/beton dengan fischer minimal 4 titik.' });
    if (bool(p, 'lipat')) out.push({ level: 'info', message: 'Klik engsel di 3D untuk melipat daun meja turun menempel dinding.' });
    return out;
  },
};
