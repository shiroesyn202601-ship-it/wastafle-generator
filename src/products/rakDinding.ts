import { Board, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, board, bool, materialParams, memberFactory, num, str } from './common';

/**
 * Rak dinding / backbar / rak gantung plafon. Papan di setiap tingkat, ditopang siku lurus, siku miring,
 * tiang dinding (rangka tangga), atau batang gantung dari plafon. Opsi bibir penahan & gantungan gelas.
 */
export const RAK_DINDING: ProductDef = {
  id: 'rak-dinding',
  name: 'Rak dinding / backbar',
  tagline: 'ambalan · backbar · rak gantung',
  icon: 'M6 4v32M6 12h40M6 24h40M14 12v-4M14 24v-4',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['model', 'panjang', 'dalam', 'tingkat', 'jarak', 'tinggiMulai', 'tinggiPlafon'] },
    { id: 'bentuk', title: 'Tambahan', keys: ['bibir', 'gantunganGelas'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Selesai', keys: [] },
  ],
  params: [
    {
      key: 'model',
      label: 'Penopang',
      type: 'choice',
      options: [
        { value: 'siku', label: 'Siku lurus', desc: 'Sederhana, papan ≤ 30 cm' },
        { value: 'siku-miring', label: 'Siku + penguat miring', desc: 'Kuat untuk botol & papan dalam' },
        { value: 'tiang', label: 'Tiang dinding', desc: 'Rangka tegak sepanjang rak (backbar)' },
        { value: 'gantung', label: 'Gantung dari plafon', desc: 'Di atas meja bar, tanpa tembok' },
      ],
    },
    { key: 'panjang', label: 'Panjang', type: 'number', unit: 'cm', min: 40, max: 240, step: 1, marks: [{ value: 80, label: 'ambalan' }, { value: 150, label: 'backbar' }] },
    { key: 'dalam', label: 'Kedalaman papan', type: 'number', unit: 'cm', min: 12, max: 45, step: 1, marks: [{ value: 20, label: 'cangkir' }, { value: 28, label: 'botol' }] },
    { key: 'tingkat', label: 'Jumlah tingkat', type: 'number', unit: 'tingkat', min: 1, max: 6, step: 1 },
    { key: 'jarak', label: 'Jarak antar tingkat', type: 'number', unit: 'cm', min: 18, max: 55, step: 1, marks: [{ value: 25, label: 'cangkir' }, { value: 38, label: 'botol' }] },
    { key: 'tinggiMulai', label: 'Tinggi tingkat terbawah', type: 'number', unit: 'cm', min: 20, max: 200, step: 1, help: 'Dari lantai. Di atas meja 90 cm biasanya mulai 130–140 cm.', marks: [{ value: 135, label: 'di atas meja' }], showIf: (p) => p.model !== 'gantung' },
    { key: 'tinggiPlafon', label: 'Tinggi plafon', type: 'number', unit: 'cm', min: 200, max: 400, step: 1, showIf: (p) => p.model === 'gantung' },
    { key: 'bibir', label: 'Bibir penahan depan', type: 'toggle', help: 'Pipa kecil di tepi depan supaya botol tidak jatuh.' },
    { key: 'gantunganGelas', label: 'Gantungan gelas / cangkir', type: 'toggle', help: 'Batang di bawah tingkat terbawah untuk mengaitkan gelas.' },
    ...materialParams(true),
  ],
  defaults: { model: 'siku-miring', panjang: 120, dalam: 25, tingkat: 3, jarak: 35, tinggiMulai: 135, tinggiPlafon: 280, bibir: false, gantunganGelas: false, pipa: '20', papan: 'kayu', warna: '#1f2226' },
  presets: [
    {
      id: 'siku',
      name: 'Ambalan siku lurus',
      desc: 'siku L per tingkat, dibaut ke tembok',
      params: { model: 'siku', bibir: false, gantunganGelas: false },
      sizes: [
        { label: 'Ambalan cangkir', desc: '80 × 20 cm, 2 tingkat', params: { panjang: 80, dalam: 20, tingkat: 2, jarak: 28, tinggiMulai: 140 } },
        { label: 'Rak buku dinding', desc: '120 × 25 cm, 3 tingkat', params: { panjang: 120, dalam: 25, tingkat: 3, jarak: 32, tinggiMulai: 100 } },
      ],
    },
    {
      id: 'backbar',
      name: 'Backbar botol (siku miring)',
      desc: 'siku + penguat miring, bibir penahan botol',
      params: { model: 'siku-miring', bibir: true },
      sizes: [
        { label: 'Botol sirup', desc: '150 × 28 cm, 3 tingkat jarak 38', params: { panjang: 150, dalam: 28, tingkat: 3, jarak: 38, tinggiMulai: 135, gantunganGelas: false } },
        { label: 'Botol + gantungan gelas', desc: '120 × 28 cm, 2 tingkat', params: { panjang: 120, dalam: 28, tingkat: 2, jarak: 40, tinggiMulai: 140, gantunganGelas: true } },
      ],
    },
    {
      id: 'tiang',
      name: 'Rak tiang dinding',
      desc: 'tiang tegak dari tingkat bawah sampai atas',
      params: { model: 'tiang' },
      sizes: [
        { label: 'Display merchandise', desc: '120 × 30 cm, 4 tingkat', params: { panjang: 120, dalam: 30, tingkat: 4, jarak: 35, tinggiMulai: 60, papan: 'kayu' } },
        { label: 'Backbar penuh', desc: '180 × 28 cm, 4 tingkat, bibir', params: { panjang: 180, dalam: 28, tingkat: 4, jarak: 38, tinggiMulai: 100, bibir: true } },
      ],
    },
    {
      id: 'gantung',
      name: 'Rak gantung plafon',
      desc: 'digantung di atas meja bar dengan 4 batang',
      params: { model: 'gantung' },
      sizes: [
        { label: 'Atas meja bar', desc: '150 × 30 cm, 2 tingkat, gantungan gelas', params: { panjang: 150, dalam: 30, tingkat: 2, jarak: 30, tinggiPlafon: 280, gantunganGelas: true } },
        { label: 'Rak tanaman gantung', desc: '100 × 25 cm, 1 tingkat', params: { panjang: 100, dalam: 25, tingkat: 1, jarak: 30, tinggiPlafon: 280, gantunganGelas: false, warna: '#2f4a3a' } },
      ],
    },
  ],
  summary: (p) => `${num(p, 'panjang')} × ${num(p, 'dalam')} cm · ${num(p, 'tingkat')} tingkat`,

  build: (p) => {
    const W = num(p, 'panjang', 120);
    const Dp = num(p, 'dalam', 25);
    const n = Math.max(1, Math.round(num(p, 'tingkat', 3)));
    const gap = num(p, 'jarak', 35);
    const model = str(p, 'model', 'siku-miring');
    const L = (parseInt(str(p, 'pipa', '20')) || 20) / 10;
    const b = BOARD_THICK[str(p, 'papan', 'kayu')] ?? 2.5;
    const t: [number, number] = [L * 10, L * 10];
    const thin: [number, number] = [15, 15];
    const { list, add, line } = memberFactory();
    const boards: Board[] = [];
    const hang = model === 'gantung';
    const ceil = num(p, 'tinggiPlafon', 280);
    // permukaan papan tingkat i (dari bawah)
    const y0 = hang ? Math.max(60, ceil - 70 - (n - 1) * gap) : num(p, 'tinggiMulai', 135);
    const ys = Array.from({ length: n }, (_, i) => y0 + i * gap);
    const yArm = (y: number) => y - b - L / 2;

    if (hang) {
      // 4 batang gantung di sudut, rangka keliling tiap tingkat
      const xs = [L / 2, W - L / 2];
      const zs = [L / 2, Dp - L / 2];
      xs.forEach((x, i) => zs.forEach((z, j) => add(`gantung-${i}-${j}`, 'y', x, yArm(ys[0]) - L / 2, z, ceil - (yArm(ys[0]) - L / 2), 'post', `Batang gantung ${i ? 'kanan' : 'kiri'} ${j ? 'depan' : 'belakang'}`, t)));
      ys.forEach((y, k) => {
        const ya = yArm(y);
        add(`t${k + 1}-belakang`, 'x', L, ya, zs[0], W - 2 * L, 'rail-x', `Palang tingkat ${k + 1} belakang`, t);
        add(`t${k + 1}-depan`, 'x', L, ya, zs[1], W - 2 * L, 'rail-x', `Palang tingkat ${k + 1} depan`, t);
        add(`t${k + 1}-kiri`, 'z', xs[0], ya, L, Dp - 2 * L, 'rail-z', `Palang tingkat ${k + 1} kiri`, t);
        add(`t${k + 1}-kanan`, 'z', xs[1], ya, L, Dp - 2 * L, 'rail-z', `Palang tingkat ${k + 1} kanan`, t);
      });
    } else {
      // Siku di beberapa titik sepanjang rak (maks. 80 cm antar siku)
      const nb = Math.max(2, Math.ceil((W - 20) / 80) + 1);
      const xs = Array.from({ length: nb }, (_, i) => 10 + ((W - 20) * i) / (nb - 1));
      xs.forEach((x, i) => {
        if (model === 'tiang') add(`tiang-${i}`, 'y', x, yArm(ys[0]) - 12, L / 2, ys[n - 1] + 4 - (yArm(ys[0]) - 12), 'post', `Tiang dinding ${i + 1}`, t);
        ys.forEach((y, k) => {
          const ya = yArm(y);
          if (model !== 'tiang') add(`plat-${i}-t${k + 1}`, 'y', x, ya - (model === 'siku-miring' ? 18 : 12), L / 2, (model === 'siku-miring' ? 18 : 12) + L / 2, 'post', `Siku dinding ${i + 1} tingkat ${k + 1}`, t);
          add(`lengan-${i}-t${k + 1}`, 'z', x, ya, L, Dp - L - 2, 'rail-z', `Lengan siku ${i + 1} tingkat ${k + 1}`, t);
          if (model === 'siku-miring') line(`penguat-${i}-t${k + 1}`, [x, ya - 16, L + 0.6], [x, ya - L / 2 - 0.6, Dp * 0.65], 'custom', `Penguat miring ${i + 1} tingkat ${k + 1}`, thin);
        });
      });
      // Bibir penahan: tiang kecil di ujung lengan + pipa tepi depan
      if (bool(p, 'bibir'))
        ys.forEach((y, k) => {
          const zl = Dp - 2 - L / 2;
          xs.forEach((x, i) => add(`bibir-tiang-${i}-t${k + 1}`, 'y', x, yArm(y) + L / 2, zl, b + 5, 'custom', `Tiang bibir ${i + 1} tingkat ${k + 1}`, thin));
          add(`bibir-t${k + 1}`, 'x', xs[0] - 5, y + 5 + 0.75, zl, xs[nb - 1] - xs[0] + 10, 'rail-x', `Bibir penahan tingkat ${k + 1}`, thin);
        });
      if (bool(p, 'gantunganGelas')) {
        const ya = yArm(ys[0]);
        xs.forEach((x, i) => add(`gelas-tiang-${i}`, 'y', x, ya - L / 2 - 10, Dp * 0.55, 10, 'custom', `Tiang gantungan gelas ${i + 1}`, thin));
        add('gantungan-gelas', 'x', xs[0] - 5, ya - L / 2 - 10 - 0.75, Dp * 0.55, xs[nb - 1] - xs[0] + 10, 'rail-x', 'Batang gantungan gelas', thin);
      }
    }
    if (hang && bool(p, 'gantunganGelas')) {
      const ya = yArm(ys[0]);
      add('gantungan-gelas', 'x', L, ya - L / 2 - 8, Dp / 2, W - 2 * L, 'rail-x', 'Batang gantungan gelas', thin);
      [0, 1].forEach((i) => add(`gelas-tiang-${i}`, 'y', i ? W - L / 2 : L / 2, ya - L / 2 - 8, Dp / 2, 8, 'custom', `Tiang gantungan gelas ${i + 1}`, thin));
    }

    if (b > 0) ys.forEach((y, k) => boards.push(board(`papan-${k + 1}`, `Papan tingkat ${k + 1}`, 0, W, y - b, y, hang ? 0 : L, Dp)));
    return { members: list, boards, casters: [], W, D: Dp, H: hang ? ceil : ys[n - 1] + 10, boardThick: 0, wall: !hang };
  },

  checks: (p) => {
    const out: ProductCheck[] = [];
    const model = str(p, 'model');
    if (model === 'siku' && num(p, 'dalam') > 30) out.push({ level: 'warn', message: 'Papan lebih dalam dari 30 cm di atas siku lurus mudah melendut ke depan.', fix: { label: 'Pakai siku miring', params: { model: 'siku-miring' } } });
    const top = model === 'gantung' ? 0 : num(p, 'tinggiMulai') + (num(p, 'tingkat') - 1) * num(p, 'jarak');
    if (top > 190) out.push({ level: 'info', message: `Tingkat teratas ${top} cm: sulit dijangkau tanpa tangga. Gelas & barang harian sebaiknya di bawah 183 cm.` });
    if (num(p, 'jarak') < 30 && num(p, 'dalam') >= 26) out.push({ level: 'info', message: 'Jarak antar tingkat di bawah 30 cm: botol 750 ml (±30 cm) tidak muat.' });
    if (model === 'gantung') out.push({ level: 'info', message: 'Batang gantung dibaut ke balok / plat beton plafon, bukan ke plafon gipsum.' });
    else out.push({ level: 'info', message: 'Siku dibaut ke tembok dengan fischer minimal 2 titik per siku.' });
    return out;
  },
};
