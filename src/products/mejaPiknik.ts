import { Board, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, board, materialParams, memberFactory, num, str } from './common';

/**
 * Meja + 2 bangku menyatu (meja piknik / taman / cafe outdoor).
 * Tiap ujung punya rangka A: dua kaki miring dari lantai di bawah bangku sampai bawah daun meja,
 * palang dudukan bangku selebar meja + bangku, palang dudukan daun meja.
 */
export const MEJA_PIKNIK: ProductDef = {
  id: 'meja-piknik',
  name: 'Meja + bangku menyatu',
  tagline: 'piknik · taman · cafe outdoor',
  icon: 'M8 14h44M4 24h14M42 24h14M14 36l12-22M46 36L34 14',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['panjang', 'lebarMeja', 'tinggiMeja'] },
    { id: 'bentuk', title: 'Bangku', keys: ['tinggiBangku', 'lebarBangku', 'jarakBangku'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Selesai', keys: [] },
  ],
  params: [
    { key: 'panjang', label: 'Panjang', type: 'number', unit: 'cm', min: 100, max: 300, step: 1, marks: [{ value: 150, label: '4 orang' }, { value: 200, label: '6 orang' }] },
    { key: 'lebarMeja', label: 'Lebar daun meja', type: 'number', unit: 'cm', min: 50, max: 100, step: 1, marks: [{ value: 70, label: 'umum' }] },
    { key: 'tinggiMeja', label: 'Tinggi meja', type: 'number', unit: 'cm', min: 68, max: 80, step: 1, marks: [{ value: 75, label: 'standar' }] },
    { key: 'tinggiBangku', label: 'Tinggi bangku', type: 'number', unit: 'cm', min: 40, max: 50, step: 1, marks: [{ value: 45, label: 'standar' }] },
    { key: 'lebarBangku', label: 'Lebar dudukan bangku', type: 'number', unit: 'cm', min: 22, max: 40, step: 1, marks: [{ value: 30, label: 'umum' }] },
    { key: 'jarakBangku', label: 'Jarak bangku ke tepi meja', type: 'number', unit: 'cm', min: 5, max: 35, step: 1, help: 'Jarak mendatar antara tepi bangku dan tepi meja. Makin kecil makin mudah menjangkau meja, tapi kaki lebih sulit masuk.', marks: [{ value: 15, label: 'umum' }] },
    ...materialParams(true),
  ],
  defaults: { panjang: 180, lebarMeja: 70, tinggiMeja: 75, tinggiBangku: 45, lebarBangku: 30, jarakBangku: 15, pipa: '40', papan: 'kayu', warna: '#1f2226' },
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
  summary: (p) => `${num(p, 'panjang')} cm · meja ${num(p, 'lebarMeja')} cm + 2 bangku`,

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
    const gap = Math.round((num(p, 'tinggiMeja') - num(p, 'tinggiBangku')));
    if (gap < 27 || gap > 33) out.push({ level: 'warn', message: `Selisih tinggi meja ke bangku ${gap} cm. Yang nyaman 28–32 cm.`, fix: { label: 'Meja 75, bangku 45', params: { tinggiMeja: 75, tinggiBangku: 45 } } });
    if (num(p, 'jarakBangku') > 25) out.push({ level: 'info', message: 'Bangku cukup jauh dari meja: orang harus condong untuk menjangkau meja.' });
    if (num(p, 'panjang') > 220) out.push({ level: 'info', message: 'Meja lebih dari 220 cm otomatis diberi rangka A di tengah.' });
    out.push({ level: 'info', message: 'Kaki rangka A dipotong miring di kedua ujung (sudut tertulis di daftar potongan). Untuk luar ruangan pakai cat dasar anti karat.' });
    return out;
  },
};
