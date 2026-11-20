import { Board, Params, ProductBuild, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, board, bool, materialParams, memberFactory, num, str } from './common';

type P3 = [number, number, number];

/**
 * Meja + bangku menyatu (meja piknik / taman / cafe outdoor / meja sekolah). Rangka tiap ujung:
 * - a: rangka A, dua kaki miring dari bawah bangku ke bawah daun meja, 2 bangku
 * - kotak: kaki tegak di bawah meja & bangku, berdiri di rel lantai (sled), 2 bangku
 * - satu-sisi: meja + 1 bangku (boleh bersandaran) dirangkai rel lantai, seperti meja sekolah
 * - trapesium: rangka loop miring satu sisi; tiang belakang condong naik ke meja, kaki depan miring ke bangku
 */
export const MEJA_PIKNIK: ProductDef = {
  id: 'meja-piknik',
  name: 'Meja + bangku menyatu',
  tagline: 'piknik · taman · cafe outdoor',
  icon: 'M8 14h44M4 24h14M42 24h14M14 36l12-22M46 36L34 14',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['model', 'panjang', 'lebarMeja', 'tinggiMeja'] },
    { id: 'bentuk', title: 'Bangku', keys: ['tinggiBangku', 'lebarBangku', 'jarakBangku', 'sandaranBangku', 'tinggiSandaranBangku'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Selesai', keys: [] },
  ],
  params: [
    {
      key: 'model',
      label: 'Bentuk rangka',
      type: 'choice',
      options: [
        { value: 'a', label: 'Rangka A, 2 bangku', desc: 'Kaki miring bentuk A' },
        { value: 'kotak', label: 'Rangka kotak, 2 bangku', desc: 'Kaki tegak di atas rel lantai' },
        { value: 'satu-sisi', label: 'Meja + 1 bangku', desc: 'Seperti meja sekolah, boleh bersandaran' },
        { value: 'trapesium', label: 'Rangka miring, 1 bangku', desc: 'Loop trapesium, gaya taman modern' },
      ],
    },
    { key: 'panjang', label: 'Panjang', type: 'number', unit: 'cm', min: 60, max: 300, step: 1, marks: [{ value: 150, label: '4 orang' }, { value: 200, label: '6 orang' }] },
    { key: 'lebarMeja', label: 'Lebar daun meja', type: 'number', unit: 'cm', min: 30, max: 100, step: 1, marks: [{ value: 70, label: 'umum' }] },
    { key: 'tinggiMeja', label: 'Tinggi meja', type: 'number', unit: 'cm', min: 68, max: 80, step: 1, marks: [{ value: 75, label: 'standar' }] },
    { key: 'tinggiBangku', label: 'Tinggi bangku', type: 'number', unit: 'cm', min: 40, max: 50, step: 1, marks: [{ value: 45, label: 'standar' }] },
    { key: 'lebarBangku', label: 'Lebar dudukan bangku', type: 'number', unit: 'cm', min: 22, max: 40, step: 1, marks: [{ value: 30, label: 'umum' }] },
    { key: 'jarakBangku', label: 'Jarak bangku ke tepi meja', type: 'number', unit: 'cm', min: 0, max: 35, step: 1, help: 'Jarak mendatar antara tepi bangku dan tepi meja. Makin kecil makin mudah menjangkau meja, tapi kaki lebih sulit masuk.', marks: [{ value: 15, label: 'umum' }] },
    { key: 'sandaranBangku', label: 'Sandaran bangku', type: 'toggle', showIf: (p) => p.model === 'satu-sisi' },
    { key: 'tinggiSandaranBangku', label: 'Tinggi sandaran dari lantai', type: 'number', unit: 'cm', min: 65, max: 95, step: 1, showIf: (p) => p.model === 'satu-sisi' && p.sandaranBangku === true },
    ...materialParams(true),
  ],
  defaults: { model: 'a', sandaranBangku: false, tinggiSandaranBangku: 80, panjang: 180, lebarMeja: 70, tinggiMeja: 75, tinggiBangku: 45, lebarBangku: 30, jarakBangku: 15, pipa: '40', papan: 'kayu', warna: '#1f2226' },
  presets: [
    {
      id: 'rangka-a',
      name: 'Meja + 2 bangku rangka A',
      desc: 'kaki miring bentuk A di tiap ujung',
      params: {},
      sizes: [
        { label: '4 orang', desc: '150 cm', params: { panjang: 150, lebarMeja: 70 } },
        { label: '6 orang', desc: '200 cm', params: { panjang: 200, lebarMeja: 75 } },
        { label: '8 orang (rangka tengah)', desc: '240 cm', params: { panjang: 240, lebarMeja: 80 } },
      ],
    },
  ],
  summary: (p) => {
    const model = str(p, 'model', 'a');
    const one = model === 'satu-sisi' || model === 'trapesium';
    const back = model === 'satu-sisi' && bool(p, 'sandaranBangku');
    return `${num(p, 'panjang')} cm · meja ${num(p, 'lebarMeja')} cm + ${one ? '1 bangku' : '2 bangku'}${back ? ' bersandaran' : ''}`;
  },

  build: (p) => {
    const W = num(p, 'panjang', 180);
    const lm = num(p, 'lebarMeja', 70);
    const Hm = num(p, 'tinggiMeja', 75);
    const Hb = num(p, 'tinggiBangku', 45);
    const lb = num(p, 'lebarBangku', 30);
    const gap = num(p, 'jarakBangku', 15);
    const L = (parseInt(str(p, 'pipa', '40')) || 40) / 10;
    const b = BOARD_THICK[str(p, 'papan', 'kayu')] ?? 2.5;
    const Dt = 2 * lb + 2 * gap + lm; // kedalaman total
    const zt0 = lb + gap;
    const zt1 = zt0 + lm;
    const rail: [number, number] = [20, 40];
    const leg: [number, number] = [L * 10, L * 10];
    const model = str(p, 'model', 'a');
    if (model !== 'a') return buildOther(p, model, { W, lm, Hm, Hb, lb, gap, L, b });
    const { list, add, line } = memberFactory();

    const yTopRail = Hm - b - 2; // as palang dudukan daun meja (20×40 berdiri)
    const ySeatRail = Hb - b - 2;
    const inset = Math.min(30, W * 0.15);
    const ends = [inset, W - inset];
    if (W > 220) ends.splice(1, 0, W / 2); // rangka tengah untuk meja panjang

    ends.forEach((x, i) => {
      const n = i === 0 ? 'kiri' : i === ends.length - 1 ? 'kanan' : 'tengah';
      add(`palang-meja-${n}`, 'z', x, yTopRail, zt0 + 3, lm - 6, 'rail-z', `Palang daun meja ${n}`, rail);
      add(`palang-bangku-${n}`, 'z', x, ySeatRail, 2, Dt - 4, 'rail-z', `Palang bangku ${n}`, rail);
      // Kaki A: dari lantai di bawah tengah bangku sampai bawah palang daun meja
      const yLegTop = yTopRail - 2;
      line(`kaki-${n}-b`, [x, 0, lb * 0.5], [x, yLegTop, zt0 + lm * 0.25], 'post', `Kaki miring ${n} belakang`, leg);
      line(`kaki-${n}-d`, [x, 0, Dt - lb * 0.5], [x, yLegTop, zt1 - lm * 0.25], 'post', `Kaki miring ${n} depan`, leg);
    });

    // Gelagar memanjang di bawah daun meja & kedua bangku, plus palang pengaku di tengah
    const x0 = 2;
    const len = W - 4;
    add('gelagar-meja-b', 'x', x0, yTopRail, zt0 + 2, len, 'rail-x', 'Gelagar daun meja belakang', [20, 20]);
    add('gelagar-meja-d', 'x', x0, yTopRail, zt1 - 2, len, 'rail-x', 'Gelagar daun meja depan', [20, 20]);
    add('gelagar-bangku-b', 'x', x0, ySeatRail, lb / 2, len, 'rail-x', 'Gelagar bangku belakang', [20, 20]);
    add('gelagar-bangku-d', 'x', x0, ySeatRail, Dt - lb / 2, len, 'rail-x', 'Gelagar bangku depan', [20, 20]);
    add('pengaku', 'x', ends[0] + 1, ySeatRail, Dt / 2, ends[ends.length - 1] - ends[0] - 2, 'rail-x', 'Palang pengaku tengah', [20, 20]);

    const boards: Board[] = [];
    if (b > 0) {
      boards.push(board('daun-meja', 'Daun meja', 0, W, Hm - b, Hm, zt0, zt1));
      boards.push(board('bangku-b', 'Dudukan bangku belakang', 0, W, Hb - b, Hb, 0, lb));
      boards.push(board('bangku-d', 'Dudukan bangku depan', 0, W, Hb - b, Hb, Dt - lb, Dt));
    }
    return { members: list, boards, casters: [], W, D: Dt, H: Hm, boardThick: 0 };
  },

  checks: (p) => {
    const out: ProductCheck[] = [];
    const model = str(p, 'model', 'a');
    const gap = Math.round((num(p, 'tinggiMeja') - num(p, 'tinggiBangku')));
    if (gap < 27 || gap > 33) out.push({ level: 'warn', message: `Selisih tinggi meja ke bangku ${gap} cm. Yang nyaman 28–32 cm.`, fix: { label: 'Meja 75, bangku 45', params: { tinggiMeja: 75, tinggiBangku: 45 } } });
    if (num(p, 'jarakBangku') > 25) out.push({ level: 'info', message: 'Bangku cukup jauh dari meja: orang harus condong untuk menjangkau meja.' });
    if (num(p, 'panjang') > 220) out.push({ level: 'info', message: 'Meja lebih dari 220 cm otomatis diberi rangka A di tengah.' });
    if (model === 'satu-sisi' && bool(p, 'sandaranBangku') && num(p, 'tinggiSandaranBangku') - num(p, 'tinggiBangku') < 25)
      out.push({ level: 'warn', message: 'Sandaran terlalu pendek untuk menopang punggung.', fix: { label: 'Sandaran 80 cm', params: { tinggiSandaranBangku: 80 } } });
    if (model === 'a' || model === 'trapesium') out.push({ level: 'info', message: 'Kaki miring dipotong bersudut di kedua ujung (sudut tertulis di daftar potongan). Untuk luar ruangan pakai cat dasar anti karat.' });
    else out.push({ level: 'info', message: 'Rel lantai menyatukan kaki meja dan bangku, jadi rangka tidak mudah bergeser. Untuk luar ruangan pakai cat dasar anti karat.' });
    return out;
  },
};

interface Dim {
  W: number;
  lm: number;
  Hm: number;
  Hb: number;
  lb: number;
  gap: number;
  L: number;
  b: number;
}

const SLANT = Math.tan((14 * Math.PI) / 180);

/** Rangka kotak (2 bangku), satu sisi / meja sekolah (1 bangku, boleh bersandaran), trapesium miring (1 bangku) */
function buildOther(p: Params, model: string, d: Dim): ProductBuild {
  const { W, lm, Hm, Hb, lb, gap, L, b } = d;
  const { list, add, line } = memberFactory();
  const boards: Board[] = [];
  const leg: [number, number] = [L * 10, L * 10];
  const rail: [number, number] = [20, 40];
  const thin: [number, number] = [20, 20];
  const yTop = Hm - b - 2; // as palang dudukan daun meja
  const ySeat = Hb - b - 2;
  const yFloor = L / 2; // as rel lantai
  const trap = model === 'trapesium';
  const two = model === 'kotak';
  const back = model === 'satu-sisi' && bool(p, 'sandaranBangku');
  const Hback = Math.max(Hb + 15, num(p, 'tinggiSandaranBangku', 80));
  const inset = Math.min(trap ? 12 : 25, W * 0.12);
  const ends = [inset, W - inset];
  if (W > 220) ends.splice(1, 0, W / 2);
  const nm = (i: number) => (i === 0 ? 'kiri' : i === ends.length - 1 ? 'kanan' : 'tengah');
  const x0 = 2;
  const len = W - 4;

  // Letak (z): kotak = bangku | meja | bangku ; satu sisi & trapesium = meja | bangku
  const zbA1 = two ? lb : 0;
  const zt0 = two ? lb + gap : 0;
  const zt1 = zt0 + lm;
  const zb0 = zt1 + gap;
  const zb1 = zb0 + lb;
  const Dt = trap ? zb1 + SLANT * ySeat : zb1;

  ends.forEach((x, i) => {
    const n = nm(i);
    if (trap) {
      // Loop: rel lantai, tiang belakang condong naik ke meja, palang meja, palang bangku, kaki depan miring
      const lean = SLANT * yTop;
      const zRail0 = Math.min(lean, lm * 0.4);
      const backFoot: P3 = [x, yFloor, L / 2];
      const backTop: P3 = [x, yTop - 2, zRail0 + L / 2];
      const frontFoot: P3 = [x, yFloor, Dt - L / 2];
      const frontTop: P3 = [x, ySeat - 2, zb1 - 3];
      add(`rel-${n}`, 'z', x, yFloor, L, Dt - 2 * L, 'rail-z', `Rel lantai ${n}`, leg);
      line(`tiang-${n}`, backFoot, backTop, 'post', `Tiang miring meja ${n}`, leg);
      line(`kaki-${n}`, frontFoot, frontTop, 'post', `Kaki miring bangku ${n}`, leg);
      add(`palang-meja-${n}`, 'z', x, yTop, zRail0, Math.max(10, zt1 - 4 - zRail0), 'rail-z', `Palang daun meja ${n}`, rail);
      const t = (ySeat - yFloor) / (yTop - 2 - yFloor);
      const zBackAtSeat = backFoot[2] + (backTop[2] - backFoot[2]) * t;
      add(`palang-bangku-${n}`, 'z', x, ySeat, zBackAtSeat + L / 2, zb1 - 3 - zBackAtSeat - L / 2, 'rail-z', `Palang bangku ${n}`, rail);
      return;
    }
    add(`rel-${n}`, 'z', x, yFloor, 2, Dt - 4, 'rail-z', `Rel lantai ${n}`, leg);
    add(`kaki-meja-${n}-b`, 'y', x, L, zt0 + 3 + L / 2, yTop - 2 - L, 'post', `Kaki meja ${n} belakang`, leg);
    add(`kaki-meja-${n}-d`, 'y', x, L, zt1 - 3 - L / 2, yTop - 2 - L, 'post', `Kaki meja ${n} depan`, leg);
    add(`palang-meja-${n}`, 'z', x, yTop, zt0 + 3, lm - 6, 'rail-z', `Palang daun meja ${n}`, rail);
    const bench = (k: string, z0: number, z1: number, label: string, tall: boolean) => {
      add(`kaki-bangku-${k}-${n}-a`, 'y', x, L, z0 + 2 + L / 2, ySeat - 2 - L, 'post', `Kaki ${label} ${n}`, leg);
      add(`kaki-bangku-${k}-${n}-b`, 'y', x, L, z1 - 2 - L / 2, (tall ? Hback - 1 : ySeat - 2) - L, 'post', tall ? `Kaki + tiang sandaran ${n}` : `Kaki ${label} ${n}`, leg);
      add(`palang-bangku-${k}-${n}`, 'z', x, ySeat, z0 + 2, z1 - z0 - 4, 'rail-z', `Palang ${label} ${n}`, rail);
    };
    if (two) bench('b', 0, zbA1, 'bangku belakang', false);
    bench('d', zb0, zb1, two ? 'bangku depan' : 'bangku', back);
  });

  // Gelagar memanjang di bawah daun meja & bangku
  add('gelagar-meja-b', 'x', x0, yTop, zt0 + 3, len, 'rail-x', 'Gelagar daun meja belakang', thin);
  add('gelagar-meja-d', 'x', x0, yTop, zt1 - 4, len, 'rail-x', 'Gelagar daun meja depan', thin);
  add('gelagar-bangku-b', 'x', x0, ySeat, zb0 + 3, len, 'rail-x', 'Gelagar bangku belakang', thin);
  add('gelagar-bangku-d', 'x', x0, ySeat, zb1 - 4, len, 'rail-x', 'Gelagar bangku depan', thin);
  if (two) {
    add('gelagar-bangku2-b', 'x', x0, ySeat, 3, len, 'rail-x', 'Gelagar bangku 2 belakang', thin);
    add('gelagar-bangku2-d', 'x', x0, ySeat, zbA1 - 4, len, 'rail-x', 'Gelagar bangku 2 depan', thin);
  }
  const span = ends[ends.length - 1] - ends[0] - 2;
  if (trap) add('pengaku', 'x', ends[0] + 1, ySeat, (zt1 + zb0) / 2, span, 'rail-x', 'Palang pengaku tengah', thin);
  else add('pengaku', 'x', ends[0] + 1, yFloor, Dt / 2, span, 'rail-x', 'Pengaku lantai tengah', thin);
  if (back) add('sandaran-atas', 'x', x0, Hback - 1, zb1 - 2 - L / 2, len, 'rail-x', 'Palang sandaran atas', thin);

  if (b > 0) {
    boards.push(board('daun-meja', 'Daun meja', 0, W, Hm - b, Hm, zt0, zt1));
    boards.push(board('bangku-d', two ? 'Dudukan bangku depan' : 'Dudukan bangku', 0, W, Hb - b, Hb, zb0, zb1));
    if (two) boards.push(board('bangku-b', 'Dudukan bangku belakang', 0, W, Hb - b, Hb, 0, zbA1));
    if (back) boards.push(board('sandaran', 'Papan sandaran', 0, W, Hback - 16, Hback, zb1 - 2 - L - 1.8, zb1 - 2 - L));
  }
  return { members: list, boards, casters: [], W, D: Dt, H: Math.max(Hm, back ? Hback : 0), boardThick: 0 };
}
