import { Board, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, board, bool, materialParams, memberFactory, num, str } from './common';

/**
 * Kursi / bangku / stool dengan rangka lurus (tanpa potongan miring):
 * 4 kaki, rangka dudukan, dudukan papan, sandaran tegak (opsional), palang kaki / pijakan kaki.
 */
export const KURSI: ProductDef = {
  id: 'kursi',
  name: 'Kursi',
  tagline: 'kursi · bangku · stool bar',
  icon: 'M18 4v32M42 22v14M18 22h24M18 36',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['jenis', 'lebar', 'dalam', 'tinggiDudukan'] },
    { id: 'bentuk', title: 'Bentuk', keys: ['sandaran', 'tinggiSandaran', 'palangKaki', 'pijakan', 'tinggiPijakan', 'kakiTengah'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Selesai', keys: [] },
  ],
  params: [
    {
      key: 'jenis',
      label: 'Jenis',
      type: 'choice',
      options: [
        { value: 'kursi', label: 'Kursi', desc: 'Untuk 1 orang' },
        { value: 'bangku', label: 'Bangku panjang', desc: 'Untuk 2–4 orang' },
        { value: 'stool', label: 'Stool / kursi bar', desc: 'Tinggi, tanpa sandaran' },
      ],
    },
    { key: 'lebar', label: 'Lebar dudukan', type: 'number', unit: 'cm', min: 28, max: 200, step: 1, marks: [{ value: 35, label: 'stool' }, { value: 45, label: 'kursi' }, { value: 120, label: 'bangku 2–3 org' }] },
    { key: 'dalam', label: 'Kedalaman dudukan', type: 'number', unit: 'cm', min: 25, max: 60, step: 1, marks: [{ value: 35, label: 'stool / bangku' }, { value: 42, label: 'kursi' }] },
    { key: 'tinggiDudukan', label: 'Tinggi dudukan', type: 'number', unit: 'cm', min: 35, max: 85, step: 1, help: 'Dari lantai sampai permukaan dudukan.', marks: [{ value: 45, label: 'meja makan' }, { value: 65, label: 'meja dapur' }, { value: 75, label: 'meja bar' }] },
    { key: 'sandaran', label: 'Sandaran punggung', type: 'toggle', help: 'Sandaran tegak dari papan.', showIf: (p) => p.jenis !== 'stool' },
    { key: 'tinggiSandaran', label: 'Tinggi sandaran dari lantai', type: 'number', unit: 'cm', min: 60, max: 110, step: 1, marks: [{ value: 85, label: 'umum' }], showIf: (p) => p.jenis !== 'stool' && p.sandaran === true },
    { key: 'palangKaki', label: 'Palang penguat kaki', type: 'toggle', help: 'Supaya kaki tidak goyang.', showIf: (p) => p.jenis !== 'stool' },
    { key: 'pijakan', label: 'Pijakan kaki', type: 'toggle', help: 'Tempat menaruh kaki di kursi tinggi.', showIf: (p) => p.jenis === 'stool' },
    { key: 'tinggiPijakan', label: 'Tinggi pijakan dari lantai', type: 'number', unit: 'cm', min: 15, max: 45, step: 1, showIf: (p) => p.jenis === 'stool' && p.pijakan === true },
    { key: 'kakiTengah', label: 'Kaki tengah', type: 'toggle', help: 'Untuk bangku panjang.', showIf: (p) => p.jenis === 'bangku' },
    ...materialParams(true),
  ],
  defaults: {
    jenis: 'kursi', lebar: 45, dalam: 42, tinggiDudukan: 45, sandaran: true, tinggiSandaran: 85, palangKaki: true,
    pijakan: true, tinggiPijakan: 28, kakiTengah: false, pipa: '20', papan: 'kayu', warna: '#1f2226',
  },
  presets: [
    { id: 'makan', name: 'Kursi makan', desc: 'dudukan 45 × 42, tinggi 45 cm', params: { jenis: 'kursi', lebar: 45, dalam: 42, tinggiDudukan: 45, sandaran: true, tinggiSandaran: 85, palangKaki: true, pipa: '20' } },
    { id: 'bangku', name: 'Bangku panjang', desc: '120 × 35 cm, tinggi 45 cm', params: { jenis: 'bangku', lebar: 120, dalam: 35, tinggiDudukan: 45, sandaran: false, palangKaki: true, pipa: '30' } },
    { id: 'bangku-sandar', name: 'Bangku taman bersandaran', desc: '150 × 45 cm, sandaran', params: { jenis: 'bangku', lebar: 150, dalam: 45, tinggiDudukan: 45, sandaran: true, tinggiSandaran: 85, palangKaki: true, kakiTengah: true, pipa: '30', warna: '#2f4a3a' } },
    { id: 'bar', name: 'Stool bar', desc: 'dudukan 35 × 35, tinggi 75 cm', params: { jenis: 'stool', lebar: 35, dalam: 35, tinggiDudukan: 75, pijakan: true, tinggiPijakan: 28, pipa: '20' } },
    { id: 'counter', name: 'Stool meja dapur', desc: 'dudukan 35 × 35, tinggi 65 cm', params: { jenis: 'stool', lebar: 35, dalam: 35, tinggiDudukan: 65, pijakan: true, tinggiPijakan: 25, pipa: '20', papan: 'hpl' } },
  ],
  summary: (p) => `${str(p, 'jenis') === 'bangku' ? 'Bangku' : str(p, 'jenis') === 'stool' ? 'Stool' : 'Kursi'} · dudukan ${num(p, 'lebar')} × ${num(p, 'dalam')} cm, tinggi ${num(p, 'tinggiDudukan')} cm`,

  build: (p) => {
    const jenis = str(p, 'jenis', 'kursi');
    const W = num(p, 'lebar', 45);
    const D = num(p, 'dalam', 42);
    const Hs = num(p, 'tinggiDudukan', 45);
    const L = (parseInt(str(p, 'pipa', '20')) || 20) / 10;
    const b = BOARD_THICK[str(p, 'papan', 'kayu')] ?? 2.5;
    const o = 1; // dudukan lebih 1 cm dari rangka
    const yS = Hs - b; // bidang bawah dudukan
    const rail: [number, number] = [20, 20];
    const leg: [number, number] = [L * 10, L * 10];
    const back = jenis !== 'stool' && bool(p, 'sandaran');
    const Hb = Math.max(yS + 20, num(p, 'tinggiSandaran', 85));

    const { list, add } = memberFactory();
    const xl = o + L / 2;
    const xr = W - o - L / 2;
    const zb = o + L / 2;
    const zf = D - o - L / 2;
    add('kaki-0', 'y', xl, 0, zb, (back ? Hb : yS), 'post', back ? 'Kaki kiri belakang + sandaran' : 'Kaki kiri belakang', leg);
    add('kaki-1', 'y', xr, 0, zb, (back ? Hb : yS), 'post', back ? 'Kaki kanan belakang + sandaran' : 'Kaki kanan belakang', leg);
    add('kaki-2', 'y', xl, 0, zf, yS, 'post', 'Kaki kiri depan', leg);
    add('kaki-3', 'y', xr, 0, zf, yS, 'post', 'Kaki kanan depan', leg);

    // Rangka dudukan
    const yr = yS - 1;
    add('dudukan-depan', 'x', o + L, yr, zf, W - 2 * o - 2 * L, 'rail-x', 'Rangka dudukan depan', rail);
    add('dudukan-belakang', 'x', o + L, yr, zb, W - 2 * o - 2 * L, 'rail-x', 'Rangka dudukan belakang', rail);
    add('dudukan-kiri', 'z', xl, yr, o + L, D - 2 * o - 2 * L, 'rail-z', 'Rangka dudukan kiri', rail);
    add('dudukan-kanan', 'z', xr, yr, o + L, D - 2 * o - 2 * L, 'rail-z', 'Rangka dudukan kanan', rail);

    // Kaki tengah bangku panjang
    if (jenis === 'bangku' && bool(p, 'kakiTengah')) {
      const xm = W / 2;
      add('kaki-tengah-b', 'y', xm, 0, zb + (L / 2 + 1), yr - 1, 'post', 'Kaki tengah belakang', leg);
      add('kaki-tengah-d', 'y', xm, 0, zf - (L / 2 + 1), yr - 1, 'post', 'Kaki tengah depan', leg);
      add('dudukan-tengah', 'z', xm, yr, zb + 1, zf - zb - 2, 'rail-z', 'Rangka dudukan tengah', rail);
    }

    // Palang kaki (kursi/bangku) atau pijakan kaki (stool)
    if (jenis === 'stool') {
      if (bool(p, 'pijakan')) {
        const yp = num(p, 'tinggiPijakan', 28);
        add('pijakan-depan', 'x', o + L, yp, zf, W - 2 * o - 2 * L, 'rail-x', 'Pijakan kaki depan', rail);
        add('pijakan-belakang', 'x', o + L, yp, zb, W - 2 * o - 2 * L, 'rail-x', 'Pijakan kaki belakang', rail);
        add('pijakan-kiri', 'z', xl, yp, o + L, D - 2 * o - 2 * L, 'rail-z', 'Pijakan kaki kiri', rail);
        add('pijakan-kanan', 'z', xr, yp, o + L, D - 2 * o - 2 * L, 'rail-z', 'Pijakan kaki kanan', rail);
      }
    } else if (bool(p, 'palangKaki')) {
      const yp = Math.min(15, yS / 3);
      add('palang-kiri', 'z', xl, yp, o + L, D - 2 * o - 2 * L, 'rail-z', 'Palang kaki kiri', rail);
      add('palang-kanan', 'z', xr, yp, o + L, D - 2 * o - 2 * L, 'rail-z', 'Palang kaki kanan', rail);
      add('palang-tengah', 'x', xl + 1, yp, D / 2, xr - xl - 2, 'rail-x', 'Palang kaki tengah', rail);
    }

    const boards: Board[] = [];
    if (b > 0) boards.push(board('dudukan', 'Papan dudukan', 0, W, yS, Hs, 0, D));

    // Sandaran tegak: dua palang di antara kaki belakang + papan sandaran di depannya
    if (back) {
      const yTopRail = Hb - 1;
      const yLowRail = Math.min(yTopRail - 8, Hs + 12);
      add('sandaran-atas', 'x', o + L, yTopRail, zb, W - 2 * o - 2 * L, 'rail-x', 'Palang sandaran atas', rail);
      add('sandaran-bawah', 'x', o + L, yLowRail, zb, W - 2 * o - 2 * L, 'rail-x', 'Palang sandaran bawah', rail);
      if (b > 0) boards.push(board('sandaran', 'Papan sandaran', o + L, W - o - L, yLowRail - 1, Hb, zb + 1, zb + 1 + Math.min(b, 1.8)));
    }

    return { members: list, boards, casters: [], W, D, H: back ? Hb : Hs, boardThick: b };
  },

  checks: (p) => {
    const out: ProductCheck[] = [];
    const jenis = str(p, 'jenis');
    const W = num(p, 'lebar');
    const Hs = num(p, 'tinggiDudukan');
    if (jenis === 'kursi' && W > 60) out.push({ level: 'warn', message: `Dudukan ${W} cm terlalu lebar untuk kursi 1 orang. Mau dijadikan bangku?`, fix: { label: 'Jadikan bangku', params: { jenis: 'bangku' } } });
    if (jenis === 'bangku' && W > 120 && !bool(p, 'kakiTengah'))
      out.push({ level: 'warn', message: `Bangku ${W} cm tanpa kaki tengah bisa melendut saat diduduki 3 orang.`, fix: { label: 'Tambah kaki tengah', params: { kakiTengah: true } } });
    if (jenis === 'stool' && bool(p, 'pijakan')) {
      const gap = Hs - num(p, 'tinggiPijakan');
      if (gap < 40 || gap > 52)
        out.push({ level: 'info', message: `Jarak pijakan ke dudukan ${gap} cm. Yang nyaman sekitar 45 cm.`, fix: { label: `Pijakan ${Hs - 45} cm`, params: { tinggiPijakan: Math.max(15, Hs - 45) } } });
    }
    if (jenis === 'stool' && Hs > 60 && !bool(p, 'pijakan')) out.push({ level: 'warn', message: 'Stool tinggi tanpa pijakan membuat kaki menggantung dan kursi mudah goyang.', fix: { label: 'Tambah pijakan', params: { pijakan: true } } });
    if (jenis !== 'stool' && bool(p, 'sandaran') && num(p, 'tinggiSandaran') - Hs < 30)
      out.push({ level: 'warn', message: 'Sandaran terlalu pendek untuk menopang punggung.', fix: { label: `Sandaran ${Hs + 40} cm`, params: { tinggiSandaran: Math.min(110, Hs + 40) } } });
    if (jenis === 'kursi' && Hs >= 42 && Hs <= 48) out.push({ level: 'info', message: 'Tinggi dudukan pas untuk meja makan / meja kerja 72–76 cm.' });
    if (str(p, 'papan') === 'none') out.push({ level: 'info', message: 'Tanpa papan: dudukan (busa, anyaman, dll.) disiapkan sendiri.' });
    return out;
  },
};
