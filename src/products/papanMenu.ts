import { Board, ProductCheck, ProductDef, Params } from './types';
import { BOARD_THICK, board, bool, materialParams, memberFactory, num, str } from './common';

/**
 * Papan menu / penanda berdiri. Tiap model = konstruksi rangka berbeda:
 * - a-frame: dua rangka miring bertemu di atas, palang penahan bukaan di bawah
 * - easel: dua kaki depan miring + satu kaki belakang, papan bersandar di atas bibir penahan
 * - ayun: rangka U terbalik di atas dua telapak kaki, panel menu menggantung bebas di dalamnya (ayun kena angin)
 * - gantung: tiang tunggal dengan lengan T di atas, papan nama menggantung di lengan (berkaki silang)
 * - poster: bingkai panel di atas satu tiang tengah dengan alas plat besi
 */
type Tube = [number, number];
const MODELS = ['a-frame', 'easel', 'ayun', 'gantung', 'poster'];
const model = (p: Params) => {
  const m = str(p, 'model', 'a-frame');
  return MODELS.includes(m) ? m : 'a-frame';
};
const DEG = Math.PI / 180;

export const PAPAN_MENU: ProductDef = {
  id: 'papan-menu',
  name: 'Papan menu berdiri',
  tagline: 'A-frame · easel · papan ayun · tiang',
  icon: 'M30 4L14 36M30 4l16 32M20 26h20',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['lebar', 'tinggiMuka', 'tinggi', 'sudut'] },
    { id: 'bentuk', title: 'Bentuk', keys: ['model', 'duaSisi'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Selesai', keys: [] },
  ],
  params: [
    {
      key: 'model',
      label: 'Model rangka',
      type: 'choice',
      options: [
        { value: 'a-frame', label: 'A-frame', desc: 'Dua rangka miring, dilipat' },
        { value: 'easel', label: 'Easel (kaki tiga)', desc: 'Papan bersandar di bibir penahan' },
        { value: 'ayun', label: 'Papan ayun', desc: 'Panel menggantung di rangka U' },
        { value: 'gantung', label: 'Tiang lengan T', desc: 'Papan nama menggantung di lengan' },
        { value: 'poster', label: 'Tiang + alas plat', desc: 'Bingkai di satu tiang, alas plat besi' },
      ],
    },
    { key: 'lebar', label: 'Lebar papan', type: 'number', unit: 'cm', min: 35, max: 90, step: 1, marks: [{ value: 60, label: 'umum' }] },
    { key: 'tinggiMuka', label: 'Tinggi bidang papan', type: 'number', unit: 'cm', min: 30, max: 110, step: 1, marks: [{ value: 75, label: 'kecil' }, { value: 90, label: 'umum' }] },
    { key: 'tinggi', label: 'Tinggi keseluruhan', type: 'number', unit: 'cm', min: 60, max: 200, step: 1, marks: [{ value: 105, label: 'umum' }, { value: 170, label: 'tiang' }] },
    { key: 'sudut', label: 'Sudut miring', type: 'number', unit: '°', min: 8, max: 25, step: 1, help: 'Makin besar makin stabil kena angin, tapi makin makan tempat.', marks: [{ value: 15, label: 'umum' }], showIf: (p) => model(p) === 'a-frame' || model(p) === 'easel' },
    { key: 'duaSisi', label: 'Papan di dua sisi', type: 'toggle', help: 'Menu terlihat dari dua arah jalan.', showIf: (p) => model(p) !== 'easel' },
    ...materialParams(true),
  ],
  defaults: { model: 'a-frame', lebar: 60, tinggiMuka: 90, tinggi: 105, sudut: 15, duaSisi: true, pipa: '20', papan: 'kayu', warna: '#1f2226' },
  groups: [{ id: 'papan', name: 'Papan menu & penanda berdiri', desc: 'Depan toko, trotoar, dan dalam ruangan' }],
  signature: (p) => model(p),
  presets: [
    {
      id: 'a-frame',
      group: 'papan',
      name: 'Papan menu A-frame',
      desc: 'dua rangka miring bertemu di puncak, palang penahan bawah, bisa dilipat',
      params: { model: 'a-frame' },
      sizes: [
        { label: 'Umum 60 × 90', desc: 'tinggi 105 cm', params: { lebar: 60, tinggiMuka: 90, tinggi: 105 } },
        { label: 'Kecil 45 × 75', desc: 'tinggi 90 cm', params: { lebar: 45, tinggiMuka: 75, tinggi: 90 } },
        { label: 'Besar 64 × 110', desc: 'tinggi 125 cm', params: { lebar: 64, tinggiMuka: 110, tinggi: 125, pipa: '20' } },
      ],
    },
    {
      id: 'easel',
      group: 'papan',
      name: 'Papan menu easel (kaki tiga)',
      desc: 'dua kaki depan miring + satu kaki belakang, papan bersandar di bibir penahan',
      params: { model: 'easel', lebar: 60, tinggiMuka: 80, tinggi: 160, sudut: 12, duaSisi: false },
      sizes: [
        { label: 'Menu kasir / pintu masuk', desc: '60 × 80, tinggi 160', params: { lebar: 60, tinggiMuka: 80, tinggi: 160 } },
        { label: 'Papan tulis besar', desc: '80 × 100, tinggi 180', params: { lebar: 80, tinggiMuka: 100, tinggi: 180 } },
        { label: 'Meja (kecil)', desc: '40 × 50, tinggi 75', params: { lebar: 40, tinggiMuka: 50, tinggi: 75 } },
      ],
    },
    {
      id: 'ayun',
      group: 'papan',
      name: 'Papan menu ayun (rangka U)',
      desc: 'rangka U terbalik di dua telapak kaki, panel menggantung bebas di dalamnya',
      params: { model: 'ayun', lebar: 60, tinggiMuka: 80, tinggi: 115, duaSisi: true },
      sizes: [
        { label: 'Trotoar 60 × 80', desc: 'tinggi 115 cm', params: { lebar: 60, tinggiMuka: 80, tinggi: 115 } },
        { label: 'Kecil 45 × 60', desc: 'tinggi 90 cm', params: { lebar: 45, tinggiMuka: 60, tinggi: 90 } },
        { label: 'Besar 75 × 100', desc: 'tinggi 135 cm', params: { lebar: 75, tinggiMuka: 100, tinggi: 135, pipa: '30' } },
      ],
    },
    {
      id: 'gantung',
      group: 'papan',
      name: 'Tiang papan nama gantung (lengan T)',
      desc: 'tiang tunggal berkaki silang, lengan di atas, papan nama menggantung',
      params: { model: 'gantung', lebar: 50, tinggiMuka: 40, tinggi: 180, duaSisi: true, pipa: '30' },
      sizes: [
        { label: 'Papan nama toko', desc: '50 × 40, tinggi 180', params: { lebar: 50, tinggiMuka: 40, tinggi: 180 } },
        { label: 'Petunjuk arah / parkir', desc: '60 × 30, tinggi 170', params: { lebar: 60, tinggiMuka: 30, tinggi: 170 } },
        { label: 'Menu gantung besar', desc: '70 × 60, tinggi 195', params: { lebar: 70, tinggiMuka: 60, tinggi: 195, pipa: '40' } },
      ],
    },
    {
      id: 'poster',
      group: 'papan',
      name: 'Standing poster tiang + alas plat',
      desc: 'bingkai panel di atas satu tiang tengah, alas plat besi di lantai',
      params: { model: 'poster', lebar: 60, tinggiMuka: 85, tinggi: 170, duaSisi: true, pipa: '30' },
      sizes: [
        { label: 'Poster menu 60 × 85', desc: 'tinggi 170 cm', params: { lebar: 60, tinggiMuka: 85, tinggi: 170 } },
        { label: 'Info / promo A2', desc: '45 × 60, tinggi 150', params: { lebar: 45, tinggiMuka: 60, tinggi: 150 } },
        { label: 'Papan selamat datang', desc: '80 × 100, tinggi 180', params: { lebar: 80, tinggiMuka: 100, tinggi: 180, pipa: '40' } },
      ],
    },
  ],
  summary: (p) => `${num(p, 'lebar')} × ${num(p, 'tinggiMuka')} cm, tinggi ${num(p, 'tinggi')} cm`,

  build: (p) => {
    const m = model(p);
    const W = num(p, 'lebar', 60);
    const H = num(p, 'tinggi', 105);
    const fh = Math.min(num(p, 'tinggiMuka', 90), H - 10);
    const sud = num(p, 'sudut', 15);
    const th = sud * DEG;
    const tan = Math.tan(th);
    const L = (parseInt(str(p, 'pipa', '20')) || 20) / 10;
    const bt = BOARD_THICK[str(p, 'papan', 'multiplek')] ? 1.2 : 0;
    const t: Tube = [L * 10, L * 10];
    const thin: Tube = [20, 20];
    const two = bool(p, 'duaSisi');
    const { list, add, line } = memberFactory();
    const boards: Board[] = [];

    /** Panel tegak berbingkai (sisi kiri x0, bawah y0) di bidang z = zc; papan muka di depan / belakang bingkai */
    const framedPanel = (id: string, x0: number, w: number, y0: number, h: number, zc: number, tube: Tube) => {
      const s = tube[0] / 10;
      add(`${id}-atas`, 'x', x0, y0 + h - s / 2, zc, w, 'rail-x', 'Bingkai panel atas', tube);
      add(`${id}-bawah`, 'x', x0, y0 + s / 2, zc, w, 'rail-x', 'Bingkai panel bawah', tube);
      add(`${id}-kiri`, 'y', x0 + s / 2, y0 + s, zc, h - 2 * s, 'post', 'Bingkai panel kiri', tube);
      add(`${id}-kanan`, 'y', x0 + w - s / 2, y0 + s, zc, h - 2 * s, 'post', 'Bingkai panel kanan', tube);
      if (bt > 0) {
        boards.push(board(`${id}-muka-depan`, 'Papan menu depan', x0, x0 + w, y0, y0 + h, zc + s / 2, zc + s / 2 + bt));
        if (two) boards.push(board(`${id}-muka-belakang`, 'Papan menu belakang', x0, x0 + w, y0, y0 + h, zc - s / 2 - bt, zc - s / 2));
      }
    };

    // ---------- A-frame ----------
    if (m === 'a-frame') {
      const half = H * tan + L + bt + 1;
      const zc = half; // garis puncak di tengah kedalaman
      const zAt = (s: 1 | -1, y: number) => zc + s * ((H - y) * tan + L / 2);
      const top = H - L / 2;
      ([1, -1] as const).forEach((s) => {
        const nm = s > 0 ? 'depan' : 'belakang';
        [L / 2, W - L / 2].forEach((x, i) => line(`tiang-${nm}-${i}`, [x, 0, zAt(s, 0)], [x, top, zAt(s, top)], 'post', `Rangka ${nm} ${i ? 'kanan' : 'kiri'}`, t));
        const yRails = [top - L / 2, top - L - fh];
        yRails.forEach((y, k) => add(`palang-${nm}-${k}`, 'x', L, y, zAt(s, y), W - 2 * L, 'rail-x', `Palang ${nm} ${k ? 'bawah' : 'atas'}`, t));
        if (bt > 0 && (s > 0 || two)) {
          const ym = top - L - fh / 2;
          const hgt = fh / Math.cos(th);
          const zFace = zAt(s, ym) + s * (L / 2 + bt / 2);
          boards.push({ ...board(`muka-${nm}`, `Papan menu ${nm}`, L / 2, W - L / 2, ym - hgt / 2, ym + hgt / 2, zFace - bt / 2, zFace + bt / 2), rotX: s > 0 ? -sud : sud });
        }
      });
      // Palang penahan bukaan (depan ↔ belakang) di bawah, kiri & kanan
      const yb = 22;
      [L / 2, W - L / 2].forEach((x, i) => add(`penahan-${i}`, 'z', x, yb, zAt(-1, yb) + L / 2, zAt(1, yb) - zAt(-1, yb) - L, 'rail-z', `Palang penahan bukaan ${i ? 'kanan' : 'kiri'}`, [15, 15]));
      return { members: list, boards, casters: [], W, D: 2 * half, H, boardThick: 0 };
    }

    // ---------- Easel kaki tiga ----------
    if (m === 'easel') {
      const top = H - L / 2;
      const tanR = Math.tan((sud + 8) * DEG); // kaki belakang lebih landai
      const zt = L / 2 + top * tanR; // z puncak
      const zAt = (y: number) => zt + (top - y) * tan; // kaki depan
      const zR = (y: number) => zt - (top - y) * tanR; // kaki belakang
      [L / 2, W - L / 2].forEach((x, i) => line(`kaki-depan-${i}`, [x, 0, zAt(0)], [x, top, zt], 'post', `Kaki depan ${i ? 'kanan' : 'kiri'}`, t));
      add('palang-atas', 'x', L, top - L / 2, zt, W - 2 * L, 'rail-x', 'Palang atas', t);
      line('kaki-belakang', [W / 2, 0, zR(0)], [W / 2, top - L, zt - L], 'post', 'Kaki belakang', t);
      const yl = Math.max(15, top - L - fh - 6); // bibir penahan papan
      add('bibir-penahan', 'x', 0, yl, zAt(yl) + L / 2, W, 'rail-x', 'Bibir penahan papan', t);
      line('rantai-penahan', [W / 2, yl - 3, zR(yl - 3) + L / 2], [W / 2, yl - 3, zAt(yl - 3) - L / 2], 'custom', 'Batang penahan bukaan kaki belakang', [15, 15]);
      if (bt > 0) {
        boards.push(board('bibir', 'Papan bibir penahan', 0, W, yl + L / 2, yl + L / 2 + 1.2, zAt(yl) - L / 2, zAt(yl) + L / 2 + 6));
        const ym = yl + L / 2 + 1.2 + fh / 2;
        const hgt = fh / Math.cos(th);
        const zFace = zAt(ym) + L / 2 + bt / 2 + 0.5;
        boards.push({ ...board('muka', 'Papan menu', 2, W - 2, ym - hgt / 2, ym + hgt / 2, zFace - bt / 2, zFace + bt / 2), rotX: -sud });
      }
      return { members: list, boards, casters: [], W, D: zAt(0) + L / 2 + 6, H, boardThick: 0 };
    }

    // ---------- Papan ayun di rangka U ----------
    if (m === 'ayun') {
      const gap = 3;
      const Wo = W + 2 * (L + gap);
      const Fd = Math.max(45, Math.round(H * 0.45));
      const zc = Fd / 2;
      [L / 2, Wo - L / 2].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        add(`telapak-${i}`, 'z', x, L / 2, 0, Fd, 'rail-z', `Telapak kaki ${nm} (di lantai)`, t);
        add(`tiang-${i}`, 'y', x, L, zc, H - 2 * L, 'post', `Tiang ${nm}`, t);
      });
      add('palang-atas', 'x', 0, H - L / 2, zc, Wo, 'rail-x', 'Palang atas (gantungan)', t);
      const pTop = H - L - 4;
      const x0 = L + gap;
      [x0 + 6, x0 + W - 6].forEach((x, i) => add(`gantungan-${i}`, 'y', x, pTop, zc, 4, 'post', `Ring / pegas gantungan ${i ? 'kanan' : 'kiri'}`, [10, 10]));
      framedPanel('panel', x0, W, pTop - fh, fh, zc, thin);
      return { members: list, boards, casters: [], W: Wo, D: Fd, H, boardThick: 0 };
    }

    // ---------- Tiang lengan T, papan menggantung ----------
    if (m === 'gantung') {
      const xp = 25; // tiang
      const Fz = 55;
      const zc = Fz / 2;
      const armEnd = xp + 8 + W + 6;
      const footEnd = xp + Math.max(30, W * 0.8);
      add('telapak-panjang', 'x', 0, L / 2, zc, footEnd, 'rail-x', 'Kaki silang memanjang (di lantai)', t);
      add('telapak-lintang', 'z', xp, L / 2, 0, Fz, 'rail-z', 'Kaki silang melintang (di lantai)', t);
      add('tiang', 'y', xp, L, zc, H - 2 * L, 'post', 'Tiang utama', t);
      add('lengan', 'x', xp - L / 2, H - L / 2, zc, armEnd - xp + L / 2, 'rail-x', 'Lengan atas', t);
      line('siku-lengan', [xp + L / 2, H - 28, zc], [xp + 22, H - L, zc], 'custom', 'Siku miring lengan', thin);
      const pTop = H - L - 6;
      const x0 = xp + 8;
      [x0 + 5, x0 + W - 5].forEach((x, i) => add(`gantungan-${i}`, 'y', x, pTop, zc, 6, 'post', `Rantai / ring gantungan ${i ? 'kanan' : 'kiri'}`, [10, 10]));
      framedPanel('papan-nama', x0, W, pTop - fh, fh, zc, thin);
      return { members: list, boards, casters: [], W: Math.max(armEnd, footEnd), D: Fz, H, boardThick: 0 };
    }

    // ---------- Poster: tiang tengah + alas plat ----------
    const ps = Math.min(60, Math.max(40, Math.round(W * 0.75)));
    const Wt = Math.max(W, ps);
    const xc = Wt / 2;
    const zc = ps / 2;
    const x0 = xc - W / 2;
    const yb = H - fh;
    boards.push({ ...board('alas', 'Alas plat besi', xc - ps / 2, xc + ps / 2, 0, 0.8, 0, ps), steelMm: 8 });
    add('tiang', 'y', xc, 0.8, zc, yb - 0.8, 'post', 'Tiang tengah', t);
    add('dudukan-tiang', 'x', xc - 10, 0.8 + 1, zc, 20, 'rail-x', 'Penguat kaki tiang (di atas plat)', thin);
    framedPanel('bingkai', x0, W, yb, fh, zc, thin);
    return { members: list, boards, casters: [], W: Wt, D: ps, H, boardThick: 0 };
  },

  checks: (p) => {
    const out: ProductCheck[] = [];
    const m = model(p);
    const H = num(p, 'tinggi');
    const fh = num(p, 'tinggiMuka');
    const W = num(p, 'lebar');
    if ((m === 'a-frame' || m === 'ayun') && fh > H - 10)
      out.push({ level: 'warn', message: 'Bidang papan hampir setinggi rangka: tidak ada ruang kaki bawah.', fix: { label: `Tinggi ${fh + 15} cm`, params: { tinggi: Math.min(200, fh + 15) } } });
    if (m === 'a-frame' && H > 135)
      out.push({ level: 'warn', message: 'A-frame lebih dari 135 cm sulit dilipat dan mudah roboh. Pakai model easel atau tiang.', fix: { label: 'Tinggi 125 cm', params: { tinggi: 125 } } });
    if ((m === 'a-frame' || m === 'easel') && num(p, 'sudut') < 12) out.push({ level: 'info', message: 'Sudut kecil membuat papan mudah roboh tertiup angin di luar ruangan.' });
    if (m === 'easel' && H - fh < 22)
      out.push({ level: 'warn', message: 'Bibir penahan papan terlalu rendah: kaki easel hampir tertutup papan.', fix: { label: `Tinggi ${fh + 60} cm`, params: { tinggi: Math.min(200, fh + 60) } } });
    if (m === 'ayun' && H > 2.6 * Math.max(45, H * 0.45))
      out.push({ level: 'warn', message: 'Rangka ayun terlalu tinggi untuk telapaknya.' });
    if (m === 'gantung' && H - fh < 120)
      out.push({ level: 'warn', message: 'Papan gantung terlalu rendah: kepala orang lewat bisa terbentur.', fix: { label: `Tinggi ${Math.min(200, fh + 130)} cm`, params: { tinggi: Math.min(200, fh + 130) } } });
    if (m === 'gantung' && W > 75)
      out.push({ level: 'warn', message: 'Lengan panjang membuat tiang mudah miring; tambah pemberat di kaki.', fix: { label: 'Lebar 60 cm', params: { lebar: 60 } } });
    if (m === 'poster' && fh > H - 40)
      out.push({ level: 'warn', message: 'Bingkai hampir menyentuh lantai: tiang tengah terlalu pendek.', fix: { label: `Tinggi ${Math.min(200, fh + 60)} cm`, params: { tinggi: Math.min(200, fh + 60) } } });
    if (m === 'poster' && H > 4 * Math.min(60, Math.max(40, Math.round(W * 0.75))))
      out.push({ level: 'warn', message: 'Alas plat terlalu kecil untuk tinggi poster: mudah terguling.', fix: { label: 'Lebar 60 cm', params: { lebar: 60 } } });
    if (m === 'a-frame') out.push({ level: 'info', message: 'Kedua rangka disatukan engsel di puncak (dua engsel kecil) supaya bisa dilipat & disimpan. Papan tulis kapur / spidol atau plat 1 mm untuk magnet.' });
    if (m === 'ayun') out.push({ level: 'info', message: 'Panel digantung dengan dua ring / pegas sehingga berayun saat kena angin, rangka tidak ikut roboh.' });
    if (m === 'gantung') out.push({ level: 'info', message: 'Beri pemberat (pot / plat) di ujung kaki memanjang di bawah papan bila dipasang di luar.' });
    if (m === 'poster') out.push({ level: 'info', message: 'Alas plat besi 8 mm, tiang dilas di tengah plat dengan penguat.' });
    return out;
  },
};
