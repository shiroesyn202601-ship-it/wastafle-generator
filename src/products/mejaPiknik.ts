import { Board, Params, ProductBuild, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, board, bool, materialParams, memberFactory, num, str } from './common';

type P3 = [number, number, number];

/**
 * Meja + bangku menyatu (meja piknik / taman / cafe outdoor / meja sekolah). Rangka tiap ujung:
 * - a: rangka A, dua kaki miring dari bawah bangku ke bawah daun meja, 2 bangku
 * - kotak: kaki tegak di bawah meja & bangku, berdiri di rel lantai (sled), 2 bangku
 * - satu-sisi: meja + 1 bangku (boleh bersandaran) dirangkai rel lantai, seperti meja sekolah
 * - trapesium: rangka loop miring satu sisi; tiang belakang condong naik ke meja, kaki depan miring ke bangku
 * - silang: kaki menyilang bentuk X di tiap ujung (kaki dari bawah bangku belakang naik ke tepi meja depan)
 * - tiang: satu tiang tengah per ujung di atas kaki lantai panjang, lengan dudukan bertopang miring (meja kantin)
 * - bundar: daun meja bundar bertiang tengah, kaki lantai bercabang ke tiap kursi bulat yang menyatu
 */
export const MEJA_PIKNIK: ProductDef = {
  id: 'meja-piknik',
  name: 'Meja + bangku menyatu',
  tagline: 'piknik · taman · cafe outdoor',
  icon: 'M8 14h44M4 24h14M42 24h14M14 36l12-22M46 36L34 14',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['model', 'panjang', 'lebarMeja', 'diameterMeja', 'tinggiMeja'] },
    { id: 'bentuk', title: 'Bangku', keys: ['tinggiBangku', 'lebarBangku', 'jarakBangku', 'jumlahKursi', 'sandaranBangku', 'tinggiSandaranBangku'] },
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
        { value: 'silang', label: 'Kaki silang X, 2 bangku', desc: 'Kaki menyilang di tiap ujung' },
        { value: 'tiang', label: 'Tiang tengah, 2 bangku', desc: 'Satu tiang per ujung, gaya meja kantin' },
        { value: 'bundar', label: 'Meja bundar + kursi bulat', desc: 'Tiang tengah, kaki bercabang ke tiap kursi' },
      ],
    },
    { key: 'panjang', label: 'Panjang', type: 'number', unit: 'cm', min: 60, max: 300, step: 1, marks: [{ value: 150, label: '4 orang' }, { value: 200, label: '6 orang' }], showIf: (p) => p.model !== 'bundar' },
    { key: 'lebarMeja', label: 'Lebar daun meja', type: 'number', unit: 'cm', min: 30, max: 100, step: 1, marks: [{ value: 70, label: 'umum' }], showIf: (p) => p.model !== 'bundar' },
    { key: 'diameterMeja', label: 'Diameter meja bundar', type: 'number', unit: 'cm', min: 60, max: 140, step: 1, marks: [{ value: 90, label: '4 orang' }, { value: 120, label: '6 orang' }], showIf: (p) => p.model === 'bundar' },
    { key: 'tinggiMeja', label: 'Tinggi meja', type: 'number', unit: 'cm', min: 68, max: 80, step: 1, marks: [{ value: 75, label: 'standar' }] },
    { key: 'tinggiBangku', label: 'Tinggi bangku', type: 'number', unit: 'cm', min: 40, max: 50, step: 1, marks: [{ value: 45, label: 'standar' }] },
    { key: 'lebarBangku', label: 'Lebar dudukan bangku', help: 'Untuk kursi bulat: diameter dudukan.', type: 'number', unit: 'cm', min: 22, max: 40, step: 1, marks: [{ value: 30, label: 'umum' }] },
    { key: 'jarakBangku', label: 'Jarak bangku ke tepi meja', type: 'number', unit: 'cm', min: 0, max: 35, step: 1, help: 'Jarak mendatar antara tepi bangku dan tepi meja. Makin kecil makin mudah menjangkau meja, tapi kaki lebih sulit masuk.', marks: [{ value: 15, label: 'umum' }] },
    { key: 'jumlahKursi', label: 'Jumlah kursi bulat', type: 'number', min: 2, max: 6, step: 1, showIf: (p) => p.model === 'bundar' },
    { key: 'sandaranBangku', label: 'Sandaran bangku', type: 'toggle', showIf: (p) => p.model === 'satu-sisi' },
    { key: 'tinggiSandaranBangku', label: 'Tinggi sandaran dari lantai', type: 'number', unit: 'cm', min: 65, max: 95, step: 1, showIf: (p) => p.model === 'satu-sisi' && p.sandaranBangku === true },
    ...materialParams(true),
  ],
  defaults: { model: 'a', diameterMeja: 90, jumlahKursi: 4, sandaranBangku: false, tinggiSandaranBangku: 80, panjang: 180, lebarMeja: 70, tinggiMeja: 75, tinggiBangku: 45, lebarBangku: 30, jarakBangku: 15, pipa: '40', papan: 'kayu', warna: '#1f2226' },
  groups: [
    { id: 'taman', name: 'Piknik & taman', desc: 'luar ruang · villa · rooftop · teras' },
    { id: 'kantin', name: 'Kantin, cafe & sekolah', desc: 'food court · kantin · ruang kelas' },
  ],
  signature: (p) => str(p, 'model', 'a'),
  presets: [
    {
      id: 'rangka-a',
      group: 'taman',
      name: 'Meja + 2 bangku rangka A',
      desc: 'kaki miring bentuk A di tiap ujung, menopang meja & kedua bangku',
      params: { model: 'a' },
      sizes: [
        { label: '4 orang', desc: '150 cm', params: { panjang: 150, lebarMeja: 70 } },
        { label: '6 orang', desc: '200 cm', params: { panjang: 200, lebarMeja: 75 } },
        { label: '8 orang (rangka tengah)', desc: '240 cm', params: { panjang: 240, lebarMeja: 80 } },
        { label: '2 orang', desc: '110 cm, pipa 30', params: { panjang: 110, lebarMeja: 60, pipa: '30' } },
      ],
    },
    {
      id: 'silang',
      group: 'taman',
      name: 'Meja + 2 bangku kaki silang X',
      desc: 'kaki menyilang X di tiap ujung, bertemu di palang bangku',
      params: { model: 'silang', jarakBangku: 12 },
      sizes: [
        { label: '4 orang', desc: '150 cm', params: { panjang: 150, lebarMeja: 70 } },
        { label: '6 orang', desc: '200 cm', params: { panjang: 200, lebarMeja: 75 } },
        { label: '8 orang (rangka tengah)', desc: '240 cm', params: { panjang: 240, lebarMeja: 80 } },
      ],
    },
    {
      id: 'kotak',
      group: 'taman',
      name: 'Meja + 2 bangku rangka kotak (rel lantai)',
      desc: 'kaki tegak meja & bangku berdiri di rel lantai (sled)',
      params: { model: 'kotak' },
      sizes: [
        { label: '4 orang', desc: '150 cm', params: { panjang: 150, lebarMeja: 70 } },
        { label: '6 orang', desc: '200 cm', params: { panjang: 200, lebarMeja: 75 } },
        { label: 'Bangku rapat', desc: '180 cm, bangku 8 cm dari meja', params: { panjang: 180, jarakBangku: 8 } },
      ],
    },
    {
      id: 'trapesium',
      group: 'taman',
      name: 'Meja taman rangka miring (1 bangku)',
      desc: 'loop trapesium: tiang condong ke meja, kaki miring ke bangku',
      params: { model: 'trapesium', lebarMeja: 45, jarakBangku: 8, lebarBangku: 35 },
      sizes: [
        { label: '180 cm', desc: '3 orang', params: { panjang: 180 } },
        { label: '120 cm', desc: '2 orang, pipa 30', params: { panjang: 120, pipa: '30' } },
        { label: '240 cm', desc: '4 orang, rangka tengah', params: { panjang: 240 } },
      ],
    },
    {
      id: 'tiang',
      group: 'kantin',
      name: 'Meja kantin tiang tengah + 2 bangku',
      desc: 'satu tiang per ujung, lengan bangku bertopang miring, lantai bebas',
      params: { model: 'tiang', jarakBangku: 10 },
      sizes: [
        { label: '4 orang', desc: '150 cm', params: { panjang: 150, lebarMeja: 65 } },
        { label: '6 orang', desc: '200 cm', params: { panjang: 200, lebarMeja: 70 } },
        { label: '8 orang (tiang tengah)', desc: '240 cm', params: { panjang: 240, lebarMeja: 75 } },
      ],
    },
    {
      id: 'bundar',
      group: 'kantin',
      name: 'Meja bundar + kursi bulat menyatu',
      desc: 'tiang tengah, kaki lantai bercabang ke tiap kursi bulat',
      params: { model: 'bundar', diameterMeja: 90, jumlahKursi: 4, lebarBangku: 34, jarakBangku: 8 },
      sizes: [
        { label: '4 kursi ø90', desc: 'food court', params: { diameterMeja: 90, jumlahKursi: 4 } },
        { label: '2 kursi ø70', desc: 'cafe kecil', params: { diameterMeja: 70, jumlahKursi: 2, pipa: '30' } },
        { label: '3 kursi ø80', desc: 'pojok', params: { diameterMeja: 80, jumlahKursi: 3 } },
        { label: '6 kursi ø120', desc: 'keluarga', params: { diameterMeja: 120, jumlahKursi: 6, lebarBangku: 32 } },
      ],
    },
    {
      id: 'satu-sisi',
      group: 'kantin',
      name: 'Meja sekolah + bangku bersandaran',
      desc: 'meja + 1 bangku dirangkai rel lantai, tiang belakang jadi sandaran',
      params: { model: 'satu-sisi', sandaranBangku: true, tinggiSandaranBangku: 78, lebarMeja: 40, tinggiMeja: 72, tinggiBangku: 43, jarakBangku: 6, lebarBangku: 28, pipa: '30', papan: 'multiplek' },
      sizes: [
        { label: '2 siswa 110', desc: 'bersandaran', params: { panjang: 110 } },
        { label: '1 siswa 70', desc: 'bersandaran', params: { panjang: 70 } },
        { label: 'Tanpa sandaran 120', desc: 'kantin / kursus', params: { panjang: 120, sandaranBangku: false } },
        { label: 'SMP/SMA 120', desc: 'meja 75, bangku 45', params: { panjang: 120, tinggiMeja: 75, tinggiBangku: 45, tinggiSandaranBangku: 82 } },
      ],
    },
  ],
  summary: (p) => {
    const model = str(p, 'model', 'a');
    if (model === 'bundar') return `Meja bundar ø${num(p, 'diameterMeja')} cm + ${num(p, 'jumlahKursi')} kursi bulat`;
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
    if (model === 'silang' || model === 'tiang' || model === 'bundar') return buildExtra(p, model, { W, lm, Hm, Hb, lb, gap, L, b });
    if (model !== 'a') return buildOther(p, model, { W, lm, Hm, Hb, lb, gap, L, b });
    const { list, add, line } = memberFactory();

    const yTopRail = Hm - b - 2; // as palang dudukan daun meja (20×40 berdiri)
    const ySeatRail = Hb - b - 2;
    const inset = Math.min(30, W * 0.15);
    const ends = [inset, W - inset];
    if (W > 220) ends.splice(1, 0, W / 2); // rangka tengah untuk meja panjang

    // Palang bangku dilas menempel di SISI DALAM kedua kaki A (bukan menembus kaki)
    const seatX = ends.map((x, i) => x + (i === ends.length - 1 ? -1 : 1) * (L / 2 + 1));
    ends.forEach((x, i) => {
      const n = i === 0 ? 'kiri' : i === ends.length - 1 ? 'kanan' : 'tengah';
      add(`palang-meja-${n}`, 'z', x, yTopRail, zt0 + 3, lm - 6, 'rail-z', `Palang daun meja ${n}`, rail);
      add(`palang-bangku-${n}`, 'z', seatX[i], ySeatRail, 2, Dt - 4, 'rail-z', `Palang bangku ${n}`, rail);
      // Kaki A: dari lantai di bawah tengah bangku sampai bawah palang daun meja
      const yLegTop = yTopRail - 2;
      line(`kaki-${n}-b`, [x, 0, lb * 0.5], [x, yLegTop, zt0 + lm * 0.25], 'post', `Kaki miring ${n} belakang`, leg);
      line(`kaki-${n}-d`, [x, 0, Dt - lb * 0.5], [x, yLegTop, zt1 - lm * 0.25], 'post', `Kaki miring ${n} depan`, leg);
    });

    // Gelagar memanjang di bawah daun meja & kedua bangku, plus palang pengaku di tengah.
    // Gelagar meja menerus, palang meja menempel di sisinya; gelagar bangku & pengaku dipotong di tiap palang bangku.
    const x0 = 2;
    const len = W - 4;
    const seatCuts = seatX.map((x): [number, number] => [x - 1, x + 1]);
    add('gelagar-meja-b', 'x', x0, yTopRail, zt0 + 2, len, 'rail-x', 'Gelagar daun meja belakang', [20, 20]);
    add('gelagar-meja-d', 'x', x0, yTopRail, zt1 - 2, len, 'rail-x', 'Gelagar daun meja depan', [20, 20]);
    runX(add, 'gelagar-bangku-b', x0, W - 2, ySeatRail, lb / 2, 'Gelagar bangku belakang', [20, 20], seatCuts);
    runX(add, 'gelagar-bangku-d', x0, W - 2, ySeatRail, Dt - lb / 2, 'Gelagar bangku depan', [20, 20], seatCuts);
    runX(add, 'pengaku', seatX[0], seatX[seatX.length - 1], ySeatRail, Dt / 2, 'Palang pengaku tengah', [20, 20], seatCuts);

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
    if (model !== 'bundar' && num(p, 'panjang') > 220) out.push({ level: 'info', message: 'Meja lebih dari 220 cm otomatis diberi rangka tengah.' });
    if (model === 'bundar') {
      const dm = num(p, 'diameterMeja', 90);
      const n = Math.round(num(p, 'jumlahKursi', 4));
      const R = dm / 2 + num(p, 'jarakBangku');
      const lb = num(p, 'lebarBangku');
      if (R - lb / 2 < dm / 2 - 15)
        out.push({ level: 'warn', message: 'Kursi bulat terlalu masuk ke bawah meja: lutut tidak muat.', fix: { label: 'Jarak kursi 8 cm', params: { jarakBangku: 8 } } });
      if (n > 2 && 2 * R * Math.sin(Math.PI / n) < lb + 15)
        out.push({ level: 'warn', message: 'Kursi bulat terlalu rapat satu sama lain.', fix: { label: 'Kurangi 1 kursi', params: { jumlahKursi: Math.max(2, n - 1) } } });
      if (dm > 110 && str(p, 'pipa') !== '40') out.push({ level: 'warn', message: 'Meja bundar besar bertiang tunggal butuh tiang lebih kuat.', fix: { label: 'Pakai pipa 40×40', params: { pipa: '40' } } });
    }
    if (model === 'tiang' && num(p, 'jarakBangku') + num(p, 'lebarBangku') > 50)
      out.push({ level: 'warn', message: 'Lengan bangku terlalu panjang dari tiang tengah: rawan melendut.', fix: { label: 'Jarak bangku 10 cm', params: { jarakBangku: 10 } } });
    if (model === 'satu-sisi' && bool(p, 'sandaranBangku') && num(p, 'tinggiSandaranBangku') - num(p, 'tinggiBangku') < 25)
      out.push({ level: 'warn', message: 'Sandaran terlalu pendek untuk menopang punggung.', fix: { label: 'Sandaran 80 cm', params: { tinggiSandaranBangku: 80 } } });
    if (model === 'tiang' || model === 'bundar') out.push({ level: 'info', message: 'Kaki lantai panjang menahan meja supaya tidak terjungkit saat satu sisi saja yang diduduki. Untuk luar ruangan pakai cat dasar anti karat.' });
    else if (model === 'a' || model === 'trapesium' || model === 'silang') out.push({ level: 'info', message: 'Kaki miring dipotong bersudut di kedua ujung (sudut tertulis di daftar potongan). Untuk luar ruangan pakai cat dasar anti karat.' });
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

type AddFn = ReturnType<typeof memberFactory>['add'];

/**
 * Batang memanjang (sumbu x) dari xa ke xb yang dipotong di tiap batang melintang (blockers = rentang x
 * batang itu): tiap ruas dilas rata di sisi batang melintang, tidak menembusnya.
 */
function runX(add: AddFn, id: string, xa: number, xb: number, y: number, z: number, label: string, tube: [number, number], blockers: [number, number][]) {
  const segs: [number, number][] = [];
  let cur = xa;
  for (const [lo, hi] of [...blockers].sort((a, b) => a[0] - b[0])) {
    if (hi <= cur) continue;
    if (lo >= xb) break;
    if (lo > cur) segs.push([cur, lo]);
    cur = Math.max(cur, hi);
  }
  if (cur < xb) segs.push([cur, xb]);
  const many = segs.length > 1;
  segs.forEach(([a, b], k) => add(many ? `${id}-${k + 1}` : id, 'x', a, y, z, b - a, 'rail-x', many ? `${label} (ruas ${k + 1})` : label, tube));
}

/** Setengah lebar mendatar penampang batang miring (bidang y-z) yang dipotong rata lantai: half / cos(sudut dari tegak) */
const halfFlat = (dy: number, dz: number, half: number) => (half * Math.hypot(dy, dz)) / Math.abs(dy);

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
  const zRail0 = Math.min(SLANT * yTop, lm * 0.4); // trapesium: awal palang daun meja (ujung atas tiang miring)
  const zSeatEnd = zb1 - 2; // trapesium: ujung palang bangku, rata sisi gelagar bangku depan

  ends.forEach((x, i) => {
    const n = nm(i);
    if (trap) {
      // Loop: rel lantai, tiang belakang condong naik ke meja, palang meja, palang bangku, kaki depan miring
      // Tiang & kaki berdiri DI ATAS rel lantai (dipotong rata), sisi luarnya rata dengan ujung rel;
      // ujung atasnya rata di bawah palang, sisi luarnya rata dengan ujung palang.
      const yT = yTop - 2;
      const yK = ySeat - 2;
      const hwT = halfFlat(yT - L, zRail0, L / 2);
      const hwK = halfFlat(yK - L, Dt - zSeatEnd, L / 2);
      const backFoot: P3 = [x, L, hwT];
      const backTop: P3 = [x, yT, zRail0 + hwT];
      const frontFoot: P3 = [x, L, Dt - hwK];
      const frontTop: P3 = [x, yK, zSeatEnd - hwK];
      add(`rel-${n}`, 'z', x, yFloor, 0, Dt, 'rail-z', `Rel lantai ${n}`, leg);
      line(`tiang-${n}`, backFoot, backTop, 'post', `Tiang miring meja ${n}`, leg);
      line(`kaki-${n}`, frontFoot, frontTop, 'post', `Kaki miring bangku ${n}`, leg);
      add(`palang-meja-${n}`, 'z', x, yTop, zRail0, Math.max(10, zt1 - 3 - zRail0), 'rail-z', `Palang daun meja ${n}`, rail);
      // palang bangku menempel di muka depan tiang miring (diukur di tepi atas palang, jadi tidak masuk ke tiang)
      const zFace = hwT + (zRail0 * (ySeat + 2 - L)) / (yT - L) + hwT;
      add(`palang-bangku-${n}`, 'z', x, ySeat, zFace, zSeatEnd - zFace, 'rail-z', `Palang bangku ${n}`, rail);
      return;
    }
    add(`rel-${n}`, 'z', x, yFloor, 2, Dt - 4, 'rail-z', `Rel lantai ${n}`, leg);
    add(`kaki-meja-${n}-b`, 'y', x, L, zt0 + 3 + L / 2, yTop - 2 - L, 'post', `Kaki meja ${n} belakang`, leg);
    add(`kaki-meja-${n}-d`, 'y', x, L, zt1 - 3 - L / 2, yTop - 2 - L, 'post', `Kaki meja ${n} depan`, leg);
    add(`palang-meja-${n}`, 'z', x, yTop, zt0 + 3, lm - 6, 'rail-z', `Palang daun meja ${n}`, rail);
    const bench = (k: string, z0: number, z1: number, label: string, tall: boolean) => {
      add(`kaki-bangku-${k}-${n}-a`, 'y', x, L, z0 + 2 + L / 2, ySeat - 2 - L, 'post', `Kaki ${label} ${n}`, leg);
      // tiang sandaran menerus sampai bawah palang sandaran atas; palang bangku dilas rata di sisi belakangnya
      add(`kaki-bangku-${k}-${n}-b`, 'y', x, L, z1 - 2 - L / 2, (tall ? Hback - 2 : ySeat - 2) - L, 'post', tall ? `Kaki + tiang sandaran ${n}` : `Kaki ${label} ${n}`, leg);
      add(`palang-bangku-${k}-${n}`, 'z', x, ySeat, z0 + 2, z1 - z0 - 4 - (tall ? L : 0), 'rail-z', `Palang ${label} ${n}`, rail);
    };
    if (two) bench('b', 0, zbA1, 'bangku belakang', false);
    bench('d', zb0, zb1, two ? 'bangku depan' : 'bangku', back);
  });

  // Gelagar memanjang di bawah daun meja & bangku: menerus, ujung palang dilas rata di sisinya.
  // Trapesium: palang bangku melintasi gelagar bangku belakang & pengaku, jadi keduanya dipotong di tiap palang.
  const railCuts = ends.map((x): [number, number] => [x - 1, x + 1]);
  add('gelagar-meja-b', 'x', x0, yTop, trap ? zRail0 - 1 : zt0 + 2, len, 'rail-x', 'Gelagar daun meja belakang', thin);
  add('gelagar-meja-d', 'x', x0, yTop, zt1 - 2, len, 'rail-x', 'Gelagar daun meja depan', thin);
  if (trap) runX(add, 'gelagar-bangku-b', x0, W - 2, ySeat, zb0 + 1, 'Gelagar bangku belakang', thin, railCuts);
  else add('gelagar-bangku-b', 'x', x0, ySeat, zb0 + 1, len, 'rail-x', 'Gelagar bangku belakang', thin);
  add('gelagar-bangku-d', 'x', x0, ySeat, zb1 - 1, len, 'rail-x', 'Gelagar bangku depan', thin);
  if (two) {
    add('gelagar-bangku2-b', 'x', x0, ySeat, 1, len, 'rail-x', 'Gelagar bangku 2 belakang', thin);
    add('gelagar-bangku2-d', 'x', x0, ySeat, zbA1 - 1, len, 'rail-x', 'Gelagar bangku 2 depan', thin);
  }
  const last = ends[ends.length - 1];
  if (trap) runX(add, 'pengaku', ends[0], last, ySeat, (zt1 + zb0) / 2, 'Palang pengaku tengah', thin, railCuts);
  else runX(add, 'pengaku', ends[0], last, yFloor, Dt / 2, 'Pengaku lantai tengah', thin, ends.map((x): [number, number] => [x - L / 2, x + L / 2]));
  if (back) add('sandaran-atas', 'x', x0, Hback - 1, zb1 - 2 - L / 2, len, 'rail-x', 'Palang sandaran atas', thin);

  if (b > 0) {
    boards.push(board('daun-meja', 'Daun meja', 0, W, Hm - b, Hm, zt0, zt1));
    boards.push(board('bangku-d', two ? 'Dudukan bangku depan' : 'Dudukan bangku', 0, W, Hb - b, Hb, zb0, zb1));
    if (two) boards.push(board('bangku-b', 'Dudukan bangku belakang', 0, W, Hb - b, Hb, 0, zbA1));
    if (back) boards.push(board('sandaran', 'Papan sandaran', 0, W, Hback - 16, Hback, zb1 - 2 - L - 1.8, zb1 - 2 - L));
  }
  return { members: list, boards, casters: [], W, D: Dt, H: Math.max(Hm, back ? Hback : 0), boardThick: 0 };
}

/** Kaki silang X (2 bangku), tiang tengah gaya meja kantin (2 bangku), meja bundar + kursi bulat menyatu */
function buildExtra(p: Params, model: string, d: Dim): ProductBuild {
  const { W, lm, Hm, Hb, lb, gap, L, b } = d;
  const { list, add, line } = memberFactory();
  const boards: Board[] = [];
  const leg: [number, number] = [L * 10, L * 10];
  const rail: [number, number] = [20, 40];
  const thin: [number, number] = [20, 20];
  const yTop = Hm - b - 2; // as palang dudukan daun meja
  const ySeat = Hb - b - 2; // as palang dudukan bangku

  if (model === 'bundar') {
    const dm = num(p, 'diameterMeja', 90);
    const n = Math.max(2, Math.round(num(p, 'jumlahKursi', 4)));
    const R = dm / 2 + gap; // jarak titik tengah kursi ke tiang
    const S = 2 * R + lb;
    const c = S / 2;
    const yF = L / 2;
    const h = L / 2; // setengah lebar pipa kaki
    add('tiang', 'y', c, L, c, yTop - 2 - L, 'post', 'Tiang tengah meja', leg);
    add('dudukan-meja-x', 'x', c - dm * 0.35, yTop, c, dm * 0.7, 'rail-x', 'Palang bawah meja 1', rail);
    add('dudukan-meja-z1', 'z', c, yTop, c - dm * 0.35, dm * 0.35 - 1, 'rail-z', 'Palang bawah meja 2a', rail);
    add('dudukan-meja-z2', 'z', c, yTop, c + 1, dm * 0.35 - 1, 'rail-z', 'Palang bawah meja 2b', rail);
    // Kaki lantai cara tukang las: satu batang lurus menerus kiri–kanan lewat bawah tiang tengah,
    // lengan depan/belakang dipotong lurus dan dilas menempel di sisi batang itu. Tidak ada potongan miring.
    // Kursi: 2 = berhadapan, 3 = bentuk T, 4 = silang, 5–6 = dua lengan sejajar (posisi segi enam).
    const r3 = R * Math.sqrt(3) / 2;
    const seats: [number, number][] =
      n === 2 ? [[-R, 0], [R, 0]]
      : n === 3 ? [[-R, 0], [R, 0], [0, R]]
      : n === 4 ? [[-R, 0], [R, 0], [0, -R], [0, R]]
      : n === 5 ? [[-R, 0], [R, 0], [-R / 2, r3], [R / 2, r3], [0, -R]]
      : [[-R, 0], [R, 0], [-R / 2, -r3], [-R / 2, r3], [R / 2, -r3], [R / 2, r3]];
    add('kaki-lantai-utama', 'x', c - R - h, yF, c, 2 * R + L, 'rail-x', 'Kaki lantai utama (menerus)', leg);
    seats.forEach(([dx, dz], i) => {
      const k = i + 1;
      const sx = c + dx;
      const sz = c + dz;
      if (dz > 0) add(`kaki-lantai-${k}`, 'z', sx, yF, c + h, dz, 'rail-z', `Lengan lantai ke kursi ${k}`, leg);
      if (dz < 0) add(`kaki-lantai-${k}`, 'z', sx, yF, sz - h, -dz, 'rail-z', `Lengan lantai ke kursi ${k}`, leg);
      add(`kursi-tiang-${k}`, 'y', sx, L, sz, ySeat - 2 - L, 'post', `Tiang kursi ${k}`, leg);
      add(`kursi-palang-${k}`, 'x', sx - lb * 0.3, ySeat, sz, lb * 0.6, 'rail-x', `Palang dudukan kursi ${k} (1)`, rail);
      add(`kursi-palang-${k}a`, 'z', sx, ySeat, sz - lb * 0.3, lb * 0.3 - 1, 'rail-z', `Palang dudukan kursi ${k} (2a)`, rail);
      add(`kursi-palang-${k}b`, 'z', sx, ySeat, sz + 1, lb * 0.3 - 1, 'rail-z', `Palang dudukan kursi ${k} (2b)`, rail);
      if (b > 0) boards.push({ ...board(`kursi-${k}`, `Dudukan kursi bulat ${k}`, sx - lb / 2, sx + lb / 2, Hb - b, Hb, sz - lb / 2, sz + lb / 2), shape: 'round' });
    });
    if (b > 0) boards.push({ ...board('daun-meja', 'Daun meja bundar', c - dm / 2, c + dm / 2, Hm - b, Hm, c - dm / 2, c + dm / 2), shape: 'round' });
    return { members: list, boards, casters: [], W: S, D: S, H: Hm, boardThick: 0 };
  }

  const Dt = 2 * lb + 2 * gap + lm;
  const zt0 = lb + gap;
  const zt1 = zt0 + lm;
  const zc = Dt / 2;
  const inset = Math.min(30, W * 0.15);
  const ends = [inset, W - inset];
  if (W > 220) ends.splice(1, 0, W / 2);
  let yCross = 0;

  const silang = model === 'silang';
  // Kaki silang: dua kaki bersebelahan (digeser setengah pipa ke kiri & kanan as rangka) supaya tidak saling tembus;
  // palang bangku dilas di sisi dalam pasangan kaki itu.
  const seatX = ends.map((x, i) => (silang ? x + (i === ends.length - 1 ? -1 : 1) * (L + 1) : x));
  const seatCuts = seatX.map((x): [number, number] => [x - 1, x + 1]);
  // Topang miring dari sisi tiang (zFace, menjauh ke arah dir) naik ke bawah palang (yU, zU).
  // Curam: dipotong rata mendatar, ujung bawah digeser supaya potongannya tidak masuk tiang.
  // Landai: dipotong tegak rata di muka tiang, ujung atas diturunkan supaya tidak masuk palang.
  const strut = (id: string, x: number, y0: number, zFace: number, dir: number, yU: number, zU: number, label: string) => {
    let ya = y0;
    let za = zFace;
    let yb = yU;
    for (let k = 0; k < 5; k++) {
      const dy = yb - ya;
      const dz = zU - za;
      const len = Math.hypot(dy, dz);
      if (Math.abs(dy) / len >= 0.35) {
        ya = y0;
        yb = yU;
        za = zFace + dir * (len / Math.abs(dy));
      } else {
        const hv = len / Math.abs(dz);
        za = zFace;
        ya = y0 - hv;
        yb = yU - hv;
      }
    }
    line(id, [x, ya, za], [x, yb, zU], 'custom', label, thin);
  };

  ends.forEach((x, i) => {
    const n = i === 0 ? 'kiri' : i === ends.length - 1 ? 'kanan' : 'tengah';
    add(`palang-meja-${n}`, 'z', x, yTop, zt0 + 3, lm - 6, 'rail-z', `Palang daun meja ${n}`, rail);
    add(`palang-bangku-${n}`, 'z', seatX[i], ySeat, 2, Dt - 4, 'rail-z', `Palang bangku ${n}`, rail);
    if (silang) {
      // X: kaki dari bawah bangku belakang naik ke tepi depan meja, dan sebaliknya; ujung atas dipotong rata
      // di bawah palang meja, sisi luarnya rata dengan ujung palang
      const yT = yTop - 2;
      const zA = lb * 0.5;
      let zB = zt1 - 3;
      for (let k = 0; k < 5; k++) zB = zt1 - 3 - halfFlat(yT, zB - zA, L / 2);
      line(`kaki-${n}-1`, [x - L / 2, 0, zA], [x - L / 2, yT, zB], 'post', `Kaki silang ${n} 1`, leg);
      line(`kaki-${n}-2`, [x + L / 2, 0, Dt - zA], [x + L / 2, yT, Dt - zB], 'post', `Kaki silang ${n} 2`, leg);
      yCross = (yT * (zc - zA)) / (zB - zA);
      return;
    }
    // Tiang tengah: kaki lantai panjang, tiang terbelah palang bangku, topang miring ke ujung bangku & meja
    add(`kaki-lantai-${n}`, 'z', x, L / 2, lb * 0.4, Dt - lb * 0.8, 'rail-z', `Kaki lantai ${n}`, leg);
    add(`tiang-bawah-${n}`, 'y', x, L, zc, ySeat - 2 - L, 'post', `Tiang tengah bawah ${n}`, leg);
    add(`tiang-atas-${n}`, 'y', x, ySeat + 2, zc, yTop - 2 - (ySeat + 2), 'post', `Tiang tengah atas ${n}`, leg);
    const yb = ySeat * 0.35;
    strut(`topang-bangku-${n}-b`, x, yb, zc - L / 2, -1, ySeat - 2, lb * 0.5, `Topang bangku belakang ${n}`);
    strut(`topang-bangku-${n}-d`, x, yb, zc + L / 2, 1, ySeat - 2, Dt - lb * 0.5, `Topang bangku depan ${n}`);
    const ym = yTop - Math.min(18, (yTop - ySeat) * 0.6);
    strut(`topang-meja-${n}-b`, x, ym, zc - L / 2, -1, yTop - 2, zt0 + 6, `Topang meja belakang ${n}`);
    strut(`topang-meja-${n}-d`, x, ym, zc + L / 2, 1, yTop - 2, zt1 - 6, `Topang meja depan ${n}`);
  });

  const x0 = 2;
  const len = W - 4;
  // Gelagar meja menerus, palang meja dilas di sisinya; gelagar bangku dipotong di tiap palang bangku
  add('gelagar-meja-b', 'x', x0, yTop, zt0 + 2, len, 'rail-x', 'Gelagar daun meja belakang', thin);
  add('gelagar-meja-d', 'x', x0, yTop, zt1 - 2, len, 'rail-x', 'Gelagar daun meja depan', thin);
  runX(add, 'gelagar-bangku-b', x0, W - 2, ySeat, lb / 2, 'Gelagar bangku belakang', thin, seatCuts);
  runX(add, 'gelagar-bangku-d', x0, W - 2, ySeat, Dt - lb / 2, 'Gelagar bangku depan', thin, seatCuts);
  const last = ends[ends.length - 1];
  // pengaku dipotong di tiap rangka, dilas rata di sisi kaki silang / tiang tengah
  if (silang) runX(add, 'pengaku', ends[0], last, yCross, zc, 'Palang pengaku di titik silang', thin, ends.map((x): [number, number] => [x - L, x + L]));
  else runX(add, 'pengaku', ends[0], last, ySeat * 0.6, zc, 'Balok tulang tengah antar tiang', leg, ends.map((x): [number, number] => [x - L / 2, x + L / 2]));

  if (b > 0) {
    boards.push(board('daun-meja', 'Daun meja', 0, W, Hm - b, Hm, zt0, zt1));
    boards.push(board('bangku-b', 'Dudukan bangku belakang', 0, W, Hb - b, Hb, 0, lb));
    boards.push(board('bangku-d', 'Dudukan bangku depan', 0, W, Hb - b, Hb, Dt - lb, Dt));
  }
  return { members: list, boards, casters: [], W, D: Dt, H: Hm, boardThick: 0 };
}
