import { Board, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, board, bool, materialParams, memberFactory, num, str } from './common';

/**
 * Dipan / ranjang besi: rangka keliling + bilah alas kasur, balok tengah & kaki tengah untuk dipan lebar,
 * sandaran kepala (panel) dan sandaran kaki opsional. Kepala di z = 0.
 */
export const DIPAN: ProductDef = {
  id: 'dipan',
  name: 'Dipan / ranjang',
  tagline: 'single · queen · king · kos',
  icon: 'M6 10v26M54 22v14M6 22h48M6 30h48M6 14h10',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['lebar', 'panjang', 'tinggi'] },
    { id: 'bentuk', title: 'Sandaran', keys: ['sandaranKepala', 'tinggiSandaran', 'sandaranKaki', 'tinggiKaki', 'kasur'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Selesai', keys: [] },
  ],
  params: [
    { key: 'lebar', label: 'Lebar kasur', type: 'number', unit: 'cm', min: 80, max: 200, step: 10, marks: [{ value: 90, label: 'single' }, { value: 120, label: 'kos' }, { value: 160, label: 'queen' }, { value: 180, label: 'king' }] },
    { key: 'panjang', label: 'Panjang kasur', type: 'number', unit: 'cm', min: 180, max: 220, step: 5, marks: [{ value: 200, label: 'standar' }] },
    { key: 'tinggi', label: 'Tinggi alas kasur', type: 'number', unit: 'cm', min: 20, max: 55, step: 1, help: 'Dari lantai sampai bilah alas. Tambah tebal kasur ±20 cm untuk tinggi duduk.', marks: [{ value: 30, label: 'rendah' }, { value: 40, label: 'umum' }] },
    { key: 'sandaranKepala', label: 'Sandaran kepala', type: 'toggle' },
    { key: 'tinggiSandaran', label: 'Tinggi sandaran kepala', type: 'number', unit: 'cm', min: 70, max: 140, step: 1, marks: [{ value: 100, label: 'umum' }], showIf: (p) => p.sandaranKepala === true },
    { key: 'sandaranKaki', label: 'Sandaran kaki', type: 'toggle' },
    { key: 'tinggiKaki', label: 'Tinggi sandaran kaki', type: 'number', unit: 'cm', min: 40, max: 80, step: 1, showIf: (p) => p.sandaranKaki === true },
    { key: 'kasur', label: 'Tampilkan kasur (contoh)', type: 'toggle', help: 'Hanya gambar, tidak masuk potongan besi.' },
    ...materialParams(true),
  ],
  defaults: { lebar: 160, panjang: 200, tinggi: 38, sandaranKepala: true, tinggiSandaran: 100, sandaranKaki: false, tinggiKaki: 55, kasur: true, pipa: '40', papan: 'kayu', warna: '#1f2226' },
  presets: [
    {
      id: 'kepala',
      name: 'Dipan + sandaran kepala',
      desc: 'panel kepala, bilah alas, kaki tengah otomatis',
      params: { sandaranKepala: true, sandaranKaki: false },
      sizes: [
        { label: 'Queen 160', desc: '160 × 200 cm', params: { lebar: 160, panjang: 200, tinggiSandaran: 100 } },
        { label: 'King 180', desc: '180 × 200 cm', params: { lebar: 180, panjang: 200, tinggiSandaran: 110 } },
        { label: 'Kos 120', desc: '120 × 200 cm', params: { lebar: 120, panjang: 200, tinggiSandaran: 95 } },
      ],
    },
    {
      id: 'kepala-kaki',
      name: 'Dipan sandaran kepala + kaki',
      desc: 'panel kepala dan pagar kaki rendah',
      params: { sandaranKepala: true, sandaranKaki: true },
      sizes: [
        { label: 'Single 90', desc: '90 × 200 cm', params: { lebar: 90, panjang: 200, tinggiSandaran: 95, tinggiKaki: 55 } },
        { label: 'Queen 160', desc: '160 × 200 cm', params: { lebar: 160, panjang: 200, tinggiSandaran: 105, tinggiKaki: 60 } },
      ],
    },
    {
      id: 'polos',
      name: 'Dipan polos (platform)',
      desc: 'tanpa sandaran, rendah',
      params: { sandaranKepala: false, sandaranKaki: false },
      sizes: [
        { label: 'Single 90', desc: '90 × 200, tinggi 30', params: { lebar: 90, panjang: 200, tinggi: 30 } },
        { label: 'Queen 160', desc: '160 × 200, tinggi 30', params: { lebar: 160, panjang: 200, tinggi: 30 } },
      ],
    },
  ],
  summary: (p) => `Kasur ${num(p, 'lebar')} × ${num(p, 'panjang')} cm, tinggi ${num(p, 'tinggi')} cm`,

  build: (p) => {
    const W = num(p, 'lebar', 160) + 2; // ruang 1 cm tiap sisi kasur
    const D = num(p, 'panjang', 200) + 2;
    const Hb = num(p, 'tinggi', 38);
    const L = (parseInt(str(p, 'pipa', '40')) || 40) / 10;
    const b = BOARD_THICK[str(p, 'papan', 'kayu')] ?? 2.5;
    const t: [number, number] = [L * 10, L * 10];
    const slatT: [number, number] = [40, 20];
    const { list, add } = memberFactory();
    const boards: Board[] = [];
    const yr = Hb - 2 - L / 2; // as rangka keliling (bilah 2 cm di atasnya)
    const head = bool(p, 'sandaranKepala');
    const foot = bool(p, 'sandaranKaki');
    const Hh = Math.max(Hb + 30, num(p, 'tinggiSandaran', 100));
    const Hf = Math.max(Hb + 15, num(p, 'tinggiKaki', 55));
    const xl = L / 2;
    const xr = W - L / 2;
    const zh = L / 2;
    const zf = D - L / 2;

    // Kaki sudut (yang di kepala / kaki memanjang jadi tiang sandaran)
    [
      [xl, zh, head ? Hh : yr + L / 2, 'kiri kepala'],
      [xr, zh, head ? Hh : yr + L / 2, 'kanan kepala'],
      [xl, zf, foot ? Hf : yr + L / 2, 'kiri kaki'],
      [xr, zf, foot ? Hf : yr + L / 2, 'kanan kaki'],
    ].forEach(([x, z, top, nm], i) => add(`kaki-${i}`, 'y', x as number, 0, z as number, top as number, 'post', `Kaki ${nm}`, t));
    // Kaki samping tengah (panjang ±200 cm)
    [xl, xr].forEach((x, i) => add(`kaki-samping-${i}`, 'y', x, 0, D / 2, yr - L / 2, 'post', `Kaki tengah ${i ? 'kanan' : 'kiri'}`, t));

    add('rangka-kepala', 'x', L, yr, zh, W - 2 * L, 'rail-x', 'Rangka sisi kepala', t);
    add('rangka-kaki', 'x', L, yr, zf, W - 2 * L, 'rail-x', 'Rangka sisi kaki', t);
    add('rangka-kiri', 'z', xl, yr, L, D - 2 * L, 'rail-z', 'Rangka samping kiri', t);
    add('rangka-kanan', 'z', xr, yr, L, D - 2 * L, 'rail-z', 'Rangka samping kanan', t);
    if (W >= 120) {
      add('balok-tengah', 'z', W / 2, yr, L, D - 2 * L, 'rail-z', 'Balok tengah', t);
      add('kaki-tengah', 'y', W / 2, 0, D / 2, yr - L / 2, 'post', 'Kaki tengah', t);
    }
    // Bilah alas kasur (pipa 40×20 rebah) jarak ±12 cm
    const n = Math.max(8, Math.floor((D - 2 * L) / 12));
    const pitch = (D - 2 * L - 4) / (n - 1);
    for (let i = 0; i < n; i++) add(`bilah-${i + 1}`, 'x', 1, yr + L / 2 + 1, L + 2 + i * pitch, W - 2, 'custom', `Bilah alas ${i + 1}`, slatT); // bertumpu di atas rangka samping

    if (head) {
      add('kepala-atas', 'x', L, Hh - L / 2, zh, W - 2 * L, 'rail-x', 'Palang sandaran kepala atas', t);
      add('kepala-tengah', 'x', L, yr + 22, zh, W - 2 * L, 'rail-x', 'Palang sandaran kepala tengah', [20, 20]);
      if (b > 0) boards.push(board('panel-kepala', 'Panel sandaran kepala', L, W - L, yr + 23, Hh - L, zh + 1, zh + 1 + Math.min(b, 1.8)));
    }
    if (foot) add('kaki-atas', 'x', L, Hf - L / 2, zf, W - 2 * L, 'rail-x', 'Palang sandaran kaki', t);
    if (bool(p, 'kasur')) boards.push({ ...board('kasur', 'Kasur (contoh)', 1, W - 1, Hb, Hb + 20, 1, D - 1), color: '#ece6da' });

    return { members: list, boards, casters: [], W, D, H: Math.max(head ? Hh : 0, foot ? Hf : 0, Hb + 20), boardThick: 0 };
  },

  checks: (p) => {
    const out: ProductCheck[] = [];
    if (num(p, 'lebar') >= 160 && str(p, 'pipa') === '20') out.push({ level: 'warn', message: 'Dipan lebar dengan pipa 20×20 terlalu lemah untuk 2 orang.', fix: { label: 'Pakai pipa 40×40', params: { pipa: '40' } } });
    if (bool(p, 'sandaranKaki') && num(p, 'tinggiKaki') < num(p, 'tinggi') + 20) out.push({ level: 'info', message: 'Sandaran kaki lebih rendah dari permukaan kasur: hanya terlihat sebagai pinggiran.' });
    out.push({ level: 'info', message: `Tinggi duduk di tepi kasur ±${num(p, 'tinggi') + 20} cm (kasur 20 cm). Yang nyaman 45–55 cm.` });
    return out;
  },
};
