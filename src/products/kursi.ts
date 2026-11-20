import { Board, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, board, bool, materialParams, memberFactory, num, str } from './common';

type P3 = [number, number, number];

/**
 * Kursi / bangku / stool: kaki lurus atau melebar, dudukan papan atau bilah besi, sandaran tegak atau miring,
 * palang kaki / pijakan kaki, kaki tengah, meja samping bundar (bangku).
 */
export const KURSI: ProductDef = {
  id: 'kursi',
  name: 'Kursi',
  tagline: 'kursi · bangku · stool bar',
  icon: 'M18 4v32M42 22v14M18 22h24M18 36',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['jenis', 'lebar', 'dalam', 'tinggiDudukan'] },
    { id: 'bentuk', title: 'Bentuk', keys: ['dudukan', 'sandaran', 'tinggiSandaran', 'miringSandaran', 'sudutKaki', 'palangKaki', 'pijakan', 'tinggiPijakan', 'kakiTengah'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Tambahan', keys: ['mejaSamping', 'diameterMeja', 'tinggiMeja'] },
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
    {
      key: 'dudukan',
      label: 'Dudukan',
      type: 'choice',
      options: [
        { value: 'papan', label: 'Papan utuh', desc: 'Kayu / multiplek / HPL' },
        { value: 'bilah', label: 'Bilah besi', desc: 'Pipa 40×20 berjajar, tahan hujan' },
      ],
    },
    { key: 'sandaran', label: 'Sandaran punggung', type: 'toggle', help: 'Stool bar: sandaran rendah ±30 cm di atas dudukan.', showIf: (p) => p.mejaSamping !== true },
    { key: 'tinggiSandaran', label: 'Tinggi sandaran dari lantai', type: 'number', unit: 'cm', min: 60, max: 125, step: 1, marks: [{ value: 85, label: 'kursi' }, { value: 105, label: 'stool bar' }], showIf: (p) => p.sandaran === true && p.mejaSamping !== true },
    { key: 'miringSandaran', label: 'Kemiringan sandaran', type: 'number', unit: '°', min: 0, max: 25, step: 1, help: '0 = tegak. 10–15° nyaman untuk makan & santai.', marks: [{ value: 0, label: 'tegak' }, { value: 12, label: 'nyaman' }], showIf: (p) => p.sandaran === true && p.mejaSamping !== true },
    { key: 'sudutKaki', label: 'Kaki melebar', type: 'number', unit: '°', min: 0, max: 12, step: 1, help: '0 = kaki tegak. Kaki melebar membuat kursi lebih stabil.', marks: [{ value: 0, label: 'tegak' }, { value: 6, label: 'melebar' }] },
    { key: 'palangKaki', label: 'Palang penguat kaki', type: 'toggle', help: 'Supaya kaki tidak goyang.', showIf: (p) => p.jenis !== 'stool' },
    { key: 'pijakan', label: 'Pijakan kaki', type: 'toggle', help: 'Tempat menaruh kaki di kursi tinggi.', showIf: (p) => p.jenis === 'stool' },
    { key: 'tinggiPijakan', label: 'Tinggi pijakan dari lantai', type: 'number', unit: 'cm', min: 15, max: 45, step: 1, showIf: (p) => p.jenis === 'stool' && p.pijakan === true },
    { key: 'kakiTengah', label: 'Kaki tengah', type: 'toggle', help: 'Untuk bangku panjang.', showIf: (p) => p.jenis === 'bangku' },
    ...materialParams(true),
    { key: 'mejaSamping', label: 'Meja samping bundar', type: 'toggle', help: 'Meja kecil di ujung kanan bangku untuk menaruh minuman.', showIf: (p) => p.jenis === 'bangku' },
    { key: 'diameterMeja', label: 'Diameter meja samping', type: 'number', unit: 'cm', min: 30, max: 60, step: 1, showIf: (p) => p.jenis === 'bangku' && p.mejaSamping === true },
    { key: 'tinggiMeja', label: 'Tinggi meja samping', type: 'number', unit: 'cm', min: 50, max: 80, step: 1, showIf: (p) => p.jenis === 'bangku' && p.mejaSamping === true },
  ],
  defaults: {
    jenis: 'kursi', lebar: 45, dalam: 42, tinggiDudukan: 45, dudukan: 'papan', sandaran: true, tinggiSandaran: 85, miringSandaran: 10,
    sudutKaki: 0, palangKaki: true, pijakan: true, tinggiPijakan: 28, kakiTengah: false,
    mejaSamping: false, diameterMeja: 40, tinggiMeja: 60, pipa: '20', papan: 'kayu', warna: '#1f2226',
  },
  presets: [
    { id: 'makan', name: 'Kursi makan', desc: 'sandaran miring 10°', params: { jenis: 'kursi', lebar: 45, dalam: 42, tinggiDudukan: 45, sandaran: true, tinggiSandaran: 85, miringSandaran: 10, palangKaki: true, pipa: '20' } },
    { id: 'cafe', name: 'Kursi cafe kaki melebar', desc: 'kaki melebar 6°, sandaran 12°', params: { jenis: 'kursi', lebar: 44, dalam: 42, tinggiDudukan: 45, sandaran: true, tinggiSandaran: 80, miringSandaran: 12, sudutKaki: 6, palangKaki: true, pipa: '20' } },
    { id: 'bangku', name: 'Bangku panjang', desc: '120 × 35 cm, tinggi 45 cm', params: { jenis: 'bangku', lebar: 120, dalam: 35, tinggiDudukan: 45, sandaran: false, palangKaki: true, pipa: '30' } },
    { id: 'bangku-bilah', name: 'Bangku bilah + meja samping', desc: '150 × 40 cm, meja bundar ø40', params: { jenis: 'bangku', lebar: 150, dalam: 40, tinggiDudukan: 45, dudukan: 'bilah', sandaran: false, mejaSamping: true, diameterMeja: 40, tinggiMeja: 60, palangKaki: false, kakiTengah: true, pipa: '30' } },
    { id: 'bangku-sandar', name: 'Bangku taman bersandaran', desc: '150 × 45 cm, sandaran 12°', params: { jenis: 'bangku', lebar: 150, dalam: 45, tinggiDudukan: 45, sandaran: true, tinggiSandaran: 85, miringSandaran: 12, palangKaki: true, kakiTengah: true, pipa: '30' } },
    {
      id: 'bar',
      name: 'Stool kaki melebar + pijakan',
      desc: 'tanpa sandaran, kaki miring 6°',
      params: { jenis: 'stool', sandaran: false, sudutKaki: 6, pijakan: true, pipa: '20' },
      sizes: [
        { label: 'Bar (meja 105)', desc: 'dudukan 75 cm', params: { lebar: 35, dalam: 35, tinggiDudukan: 75, tinggiPijakan: 32 } },
        { label: 'Counter (meja 90)', desc: 'dudukan 65 cm', params: { lebar: 35, dalam: 35, tinggiDudukan: 65, tinggiPijakan: 23 } },
      ],
    },
    {
      id: 'bar-sandar',
      name: 'Stool bar bersandaran',
      desc: 'sandaran rendah miring, pijakan keliling',
      params: { jenis: 'stool', sandaran: true, miringSandaran: 8, sudutKaki: 4, pijakan: true, pipa: '20' },
      sizes: [
        { label: 'Bar (meja 105)', desc: 'dudukan 75, sandaran 105 cm', params: { lebar: 40, dalam: 38, tinggiDudukan: 75, tinggiSandaran: 105, tinggiPijakan: 32 } },
        { label: 'Counter (meja 90)', desc: 'dudukan 65, sandaran 95 cm', params: { lebar: 40, dalam: 38, tinggiDudukan: 65, tinggiSandaran: 95, tinggiPijakan: 23 } },
      ],
    },
    {
      id: 'counter',
      name: 'Stool kaki tegak + pijakan',
      desc: 'tanpa sandaran, kaki tegak',
      params: { jenis: 'stool', sandaran: false, sudutKaki: 0, pijakan: true, pipa: '20' },
      sizes: [
        { label: 'Counter (meja 90)', desc: 'dudukan 65 cm', params: { lebar: 35, dalam: 35, tinggiDudukan: 65, tinggiPijakan: 23 } },
        { label: 'Bar (meja 105)', desc: 'dudukan 75 cm', params: { lebar: 35, dalam: 35, tinggiDudukan: 75, tinggiPijakan: 32 } },
        { label: 'Stool pendek', desc: 'dudukan 45 cm', params: { lebar: 32, dalam: 32, tinggiDudukan: 45, pijakan: false } },
      ],
    },
  ],
  summary: (p) =>
    `${str(p, 'jenis') === 'bangku' ? 'Bangku' : str(p, 'jenis') === 'stool' ? 'Stool' : 'Kursi'} · dudukan ${num(p, 'lebar')} × ${num(p, 'dalam')} cm, tinggi ${num(p, 'tinggiDudukan')} cm`,

  build: (p) => {
    const jenis = str(p, 'jenis', 'kursi');
    const W = num(p, 'lebar', 45);
    const D = num(p, 'dalam', 42);
    const Hs = num(p, 'tinggiDudukan', 45);
    const L = (parseInt(str(p, 'pipa', '20')) || 20) / 10;
    const slats = str(p, 'dudukan') === 'bilah';
    const papanB = BOARD_THICK[str(p, 'papan', 'kayu')] ?? 2.5;
    const b = slats ? 2 : papanB; // tebal dudukan (bilah besi 40×20 rebah = 2 cm)
    const o = 1;
    const yS = Hs - b; // bidang bawah dudukan = ujung atas kaki
    const rail: [number, number] = [20, 20];
    const leg: [number, number] = [L * 10, L * 10];
    const side = jenis === 'bangku' && bool(p, 'mejaSamping');
    const back = !side && bool(p, 'sandaran');
    const Hb = Math.max(yS + 20, num(p, 'tinggiSandaran', 85));
    const tilt = back ? num(p, 'miringSandaran', 0) : 0;
    const tanT = Math.tan((tilt * Math.PI) / 180);
    const spread = Math.tan((num(p, 'sudutKaki', 0) * Math.PI) / 180) * yS;
    const tableD = side ? num(p, 'diameterMeja', 40) : 0;
    const Ht = side ? Math.max(Hs + 8, num(p, 'tinggiMeja', 60)) : 0;
    const seatW = W - (side ? tableD : 0); // panjang dudukan (meja samping di ujung kanan)

    const { list, add, line } = memberFactory();
    const boards: Board[] = [];
    // sandaran miring condong ke belakang: seluruh kursi digeser ke depan supaya tetap di dalam tapak
    const zs = back ? tanT * (Hb - yS) : 0;
    const ox = o + spread; // kaki melebar: rangka dudukan masuk ke dalam
    const xl = ox + L / 2;
    const xr = W - ox - L / 2;
    const zb = zs + ox + L / 2;
    const zf = zs + D - ox - L / 2;
    const corners: [number, number, number, number, string][] = [
      [xl, zb, -1, -1, 'kiri belakang'],
      [xr, zb, 1, -1, 'kanan belakang'],
      [xl, zf, -1, 1, 'kiri depan'],
      [xr, zf, 1, 1, 'kanan depan'],
    ];
    const at = (i: number, y: number): P3 => {
      const [x, z, sx, sz] = corners[i];
      const t = (yS - y) / Math.max(1, yS);
      return [x + sx * spread * t, y, z + sz * spread * t];
    };
    /** z sandaran pada ketinggian y (miring ke belakang di atas dudukan) */
    const zBack = (y: number) => zb - tanT * (y - yS);

    corners.forEach(([x, z, , , label], i) => {
      const isBack = i < 2;
      const tallRight = side && x === xr; // kaki kanan memanjang jadi kaki meja samping
      if (isBack && back && spread === 0 && tilt === 0) {
        add(`kaki-${i}`, 'y', x, 0, z, Hb, 'post', `Kaki ${label} + sandaran`, leg);
        return;
      }
      if (tallRight && spread === 0) {
        add(`kaki-${i}`, 'y', x, 0, z, Ht - papanB, 'post', `Kaki ${label} + meja samping`, leg);
        return;
      }
      line(`kaki-${i}`, at(i, 0), [x, yS, z], 'post', `Kaki ${label}`, leg);
      if (isBack && back) line(`sandaran-tiang-${i}`, [x, yS, z], [x, Hb, zBack(Hb)], 'post', `Tiang sandaran ${i ? 'kanan' : 'kiri'}`, leg);
      if (tallRight) add(`meja-tiang-${i}`, 'y', x, yS, z, Ht - papanB - yS, 'post', `Tiang meja samping ${label}`, leg);
    });

    // Rangka dudukan
    const yr = yS - 1;
    add('dudukan-depan', 'x', ox + L, yr, zf, W - 2 * ox - 2 * L, 'rail-x', 'Rangka dudukan depan', rail);
    add('dudukan-belakang', 'x', ox + L, yr, zb, W - 2 * ox - 2 * L, 'rail-x', 'Rangka dudukan belakang', rail);
    add('dudukan-kiri', 'z', xl, yr, zb + L / 2, zf - zb - L, 'rail-z', 'Rangka dudukan kiri', rail);
    add('dudukan-kanan', 'z', xr, yr, zb + L / 2, zf - zb - L, 'rail-z', 'Rangka dudukan kanan', rail);

    // Kaki tengah bangku panjang
    if (jenis === 'bangku' && bool(p, 'kakiTengah')) {
      const xm = seatW / 2;
      add('kaki-tengah-b', 'y', xm, 0, zb + (L / 2 + 1), yr - 1, 'post', 'Kaki tengah belakang', leg);
      add('kaki-tengah-d', 'y', xm, 0, zf - (L / 2 + 1), yr - 1, 'post', 'Kaki tengah depan', leg);
      add('dudukan-tengah', 'z', xm, yr, zb + 1, zf - zb - 2, 'rail-z', 'Rangka dudukan tengah', rail);
    }

    // Palang di antara kaki pada ketinggian y (ikut kaki melebar)
    const ring = (prefix: string, name: string, y: number, full: boolean) => {
      const [lb, rb, lf, rf] = [0, 1, 2, 3].map((i) => at(i, y));
      add(`${prefix}-kiri`, 'z', lb[0], y, lb[2] + L / 2, lf[2] - lb[2] - L, 'rail-z', `${name} kiri`, rail);
      add(`${prefix}-kanan`, 'z', rb[0], y, rb[2] + L / 2, rf[2] - rb[2] - L, 'rail-z', `${name} kanan`, rail);
      if (full) {
        add(`${prefix}-depan`, 'x', lf[0] + L / 2, y, lf[2], rf[0] - lf[0] - L, 'rail-x', `${name} depan`, rail);
        add(`${prefix}-belakang`, 'x', lb[0] + L / 2, y, lb[2], rb[0] - lb[0] - L, 'rail-x', `${name} belakang`, rail);
      } else add(`${prefix}-tengah`, 'x', lb[0] + 1, y, zs + D / 2, rb[0] - lb[0] - 2, 'rail-x', `${name} tengah`, rail);
    };
    if (jenis === 'stool') {
      if (bool(p, 'pijakan')) ring('pijakan', 'Pijakan kaki', num(p, 'tinggiPijakan', 28), true);
    } else if (bool(p, 'palangKaki')) ring('palang', 'Palang kaki', Math.min(15, yS / 3), false);

    // Dudukan: papan utuh atau bilah besi berjajar
    if (slats) {
      const n = Math.max(3, Math.round((D - 2) / 6));
      const pitch = (D - 4) / (n - 1);
      for (let i = 0; i < n; i++) add(`bilah-${i + 1}`, 'x', 0, yS + 1, zs + 2 + i * pitch, seatW, 'custom', `Bilah dudukan ${i + 1}`, [40, 20]);
    } else if (papanB > 0) boards.push(board('dudukan', 'Papan dudukan', 0, seatW, yS, Hs, zs, zs + D));

    // Meja samping bundar di ujung kanan
    if (side) {
      const yTr = Ht - papanB - 1;
      const [, rb, , rf] = [0, 1, 2, 3].map((i) => at(i, yS));
      add('meja-palang', 'z', xr, yTr, rb[2] + L / 2, rf[2] - rb[2] - L, 'rail-z', 'Palang dudukan meja samping', rail);
      // dari tengah meja sampai muka palang dudukan meja (palang 20×20: muka di xr − 1)
      add('meja-lengan', 'x', xr - tableD / 2, yTr, zs + D / 2, tableD / 2 - 1, 'rail-x', 'Lengan penyangga meja samping', rail);
      if (papanB > 0) {
        const t = board('meja-samping', 'Daun meja samping bundar', W - tableD, W, Ht - papanB, Ht, zs + D / 2 - tableD / 2, zs + D / 2 + tableD / 2);
        t.shape = 'round';
        boards.push(t);
      }
    }

    // Sandaran: palang atas & bawah mengikuti kemiringan + papan sandaran (diputar)
    if (back) {
      const yTopRail = Hb - 1;
      const yLowRail = Math.min(yTopRail - 8, Hs + 12);
      add('sandaran-atas', 'x', ox + L, yTopRail, zBack(yTopRail), W - 2 * ox - 2 * L, 'rail-x', 'Palang sandaran atas', rail);
      add('sandaran-bawah', 'x', ox + L, yLowRail, zBack(yLowRail), W - 2 * ox - 2 * L, 'rail-x', 'Palang sandaran bawah', rail);
      if (papanB > 0) {
        const bt = Math.min(papanB, 1.8);
        const hgt = (Hb - (yLowRail - 1)) / Math.cos((tilt * Math.PI) / 180);
        const ym = (Hb + yLowRail - 1) / 2;
        const zc = zBack(ym) + 1 + bt / 2;
        const bb = board('sandaran', 'Papan sandaran', ox + L, W - ox - L, ym - hgt / 2, ym + hgt / 2, zc - bt / 2, zc + bt / 2);
        bb.rotX = -tilt;
        boards.push(bb);
      }
    }

    const H = Math.max(back ? Hb : Hs, side ? Ht : 0);
    return { members: list, boards, casters: [], W, D: D + zs, H, boardThick: slats ? 0 : papanB };
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
    if (bool(p, 'sandaran') && !bool(p, 'mejaSamping') && num(p, 'tinggiSandaran') - Hs < (jenis === 'stool' ? 22 : 30))
      out.push({ level: 'warn', message: 'Sandaran terlalu pendek untuk menopang punggung.', fix: { label: `Sandaran ${Hs + 40} cm`, params: { tinggiSandaran: Math.min(110, Hs + 40) } } });
    if (bool(p, 'sandaran') && num(p, 'miringSandaran') > 18)
      out.push({ level: 'warn', message: 'Sandaran sangat miring: kursi bisa terjungkal ke belakang saat bersandar.', fix: { label: 'Miring 12°', params: { miringSandaran: 12 } } });
    if (jenis === 'kursi' && Hs >= 42 && Hs <= 48) out.push({ level: 'info', message: 'Tinggi dudukan pas untuk meja makan / meja kerja 72–76 cm.' });
    if (num(p, 'sudutKaki') > 0 || (bool(p, 'sandaran') && num(p, 'miringSandaran') > 0))
      out.push({ level: 'info', message: 'Batang miring dipotong bersudut. Sudut tiap potongan tertulis di daftar potongan.' });
    if (str(p, 'papan') === 'none' && str(p, 'dudukan') !== 'bilah') out.push({ level: 'info', message: 'Tanpa papan: dudukan (busa, anyaman, dll.) disiapkan sendiri.' });
    return out;
  },
};
