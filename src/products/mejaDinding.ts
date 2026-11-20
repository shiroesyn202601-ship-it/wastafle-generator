import { FrameHinge } from '../types/kitchen';
import { Board, ProductCheck, ProductDef, Params } from './types';
import { BOARD_THICK, board, bool, materialParams, memberFactory, num, str } from './common';

/**
 * Meja dinding. Tiap model = cara menahan daun meja yang berbeda:
 * - rel: rel dinding dibaut ke tembok, daun berangka 4 sisi menempel lewat engsel memanjang (bisa dilipat turun)
 * - siku: siku segitiga (tiang tembok + lengan + batang miring) di bawah daun, tetap
 * - kaki-depan: daun lipat di rel tembok + rangka kaki U di depan yang ikut dilipat ke bawah daun
 * - kotak: kotak rangka di tembok; daun dilipat NAIK menutup kotak (meja murphy), ditahan rantai miring
 * - tiang: tiang dari lantai menempel tembok, lengan menjorok tanpa kaki depan (ambalan bar)
 */
type Tube = [number, number];
const MODELS = ['rel', 'siku', 'kaki-depan', 'kotak', 'tiang'];
const model = (p: Params) => {
  const m = str(p, 'model', 'rel');
  return MODELS.includes(m) ? m : 'rel';
};
/** daun bisa dilipat */
const folds = (p: Params) => (model(p) === 'rel' && bool(p, 'lipat')) || model(p) === 'kaki-depan' || model(p) === 'kotak';

export const MEJA_DINDING: ProductDef = {
  id: 'meja-dinding',
  name: 'Meja dinding',
  tagline: 'lipat · hemat tempat · kos & dapur kecil',
  icon: 'M6 4v32M6 14h40M10 14v8M42 14v8',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['panjang', 'dalam', 'tinggi'] },
    { id: 'bentuk', title: 'Bentuk', keys: ['model', 'lipat', 'jumlahEngsel'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Selesai', keys: [] },
  ],
  params: [
    {
      key: 'model',
      label: 'Model penahan daun',
      type: 'choice',
      options: [
        { value: 'rel', label: 'Rel tembok', desc: 'Daun berengsel di rel, tanpa kaki' },
        { value: 'siku', label: 'Siku segitiga', desc: 'Siku miring di bawah daun, tetap' },
        { value: 'kaki-depan', label: 'Kaki depan lipat', desc: 'Kaki U di depan, ikut dilipat' },
        { value: 'kotak', label: 'Kotak lipat naik', desc: 'Daun menutup kotak di tembok' },
        { value: 'tiang', label: 'Tiang dari lantai', desc: 'Tiang menempel tembok, lengan menjorok' },
      ],
    },
    { key: 'panjang', label: 'Panjang', type: 'number', unit: 'cm', min: 40, max: 160, step: 1, marks: [{ value: 60, label: '1 orang' }, { value: 100, label: '2 orang' }] },
    { key: 'dalam', label: 'Kedalaman', type: 'number', unit: 'cm', min: 25, max: 60, step: 1, help: 'Jarak dari dinding ke tepi depan.', marks: [{ value: 40, label: 'umum' }] },
    { key: 'tinggi', label: 'Tinggi dari lantai', type: 'number', unit: 'cm', min: 60, max: 110, step: 1, marks: [{ value: 75, label: 'meja makan' }, { value: 90, label: 'meja dapur' }, { value: 105, label: 'meja bar' }] },
    { key: 'lipat', label: 'Bisa dilipat ke bawah', type: 'toggle', help: 'Daun meja dilipat turun menempel dinding saat tidak dipakai. Klik engselnya di 3D.', showIf: (p) => model(p) === 'rel' },
    {
      key: 'jumlahEngsel',
      label: 'Engsel',
      type: 'choice',
      options: [
        { value: 'piano', label: 'Engsel piano menerus', desc: 'Rata sepanjang meja' },
        { value: 'siku', label: 'Siku lipat kunci', desc: 'Terkunci saat datar, kuat menahan beban' },
      ],
      showIf: folds,
    },
    ...materialParams(true),
  ],
  defaults: { model: 'rel', panjang: 80, dalam: 40, tinggi: 75, lipat: true, jumlahEngsel: 'siku', pipa: '20', papan: 'kayu', warna: '#1f2226' },
  groups: [{ id: 'dinding', name: 'Meja dinding (makan · kerja · bar)', desc: 'Meja yang ditahan tembok: lipat atau tetap' }],
  signature: (p) => model(p),
  presets: [
    {
      id: 'lipat',
      group: 'dinding',
      name: 'Meja dinding lipat (rel)',
      desc: 'rel tembok + daun berangka dengan engsel, dilipat turun, tanpa kaki',
      params: { model: 'rel', lipat: true },
      sizes: [
        { label: 'Makan 1–2 orang', desc: '80 × 40 cm, tinggi 75', params: { panjang: 80, dalam: 40, tinggi: 75 } },
        { label: 'Bar dinding', desc: '120 × 35 cm, tinggi 105', params: { panjang: 120, dalam: 35, tinggi: 105 } },
        { label: 'Kerja', desc: '100 × 45 cm, tinggi 75', params: { panjang: 100, dalam: 45, tinggi: 75 } },
        { label: 'Tetap (tanpa engsel)', desc: '150 × 35 cm, tinggi 105', params: { panjang: 150, dalam: 35, tinggi: 105, lipat: false } },
      ],
    },
    {
      id: 'siku',
      group: 'dinding',
      name: 'Meja dinding siku segitiga',
      desc: 'tiap ujung ditahan siku segitiga (tiang tembok + batang miring), tetap',
      params: { model: 'siku', panjang: 120, dalam: 45, tinggi: 75 },
      sizes: [
        { label: 'Meja kerja / belajar', desc: '120 × 45 cm, tinggi 75', params: { panjang: 120, dalam: 45, tinggi: 75 } },
        { label: 'Ambalan dapur', desc: '100 × 40 cm, tinggi 90', params: { panjang: 100, dalam: 40, tinggi: 90 } },
        { label: 'Bar dinding', desc: '150 × 35 cm, tinggi 105', params: { panjang: 150, dalam: 35, tinggi: 105 } },
      ],
    },
    {
      id: 'kaki-depan',
      group: 'dinding',
      name: 'Meja dinding lipat berkaki depan',
      desc: 'daun berengsel di rel tembok + rangka kaki U di depan yang dilipat ke bawah daun',
      params: { model: 'kaki-depan', panjang: 100, dalam: 55, tinggi: 75, jumlahEngsel: 'siku' },
      sizes: [
        { label: 'Meja kerja kos', desc: '100 × 55 cm, tinggi 75', params: { panjang: 100, dalam: 55, tinggi: 75 } },
        { label: 'Meja makan 4 orang', desc: '120 × 60 cm, tinggi 75', params: { panjang: 120, dalam: 60, tinggi: 75 } },
        { label: 'Meja setrika / lipat baju', desc: '110 × 45 cm, tinggi 85', params: { panjang: 110, dalam: 45, tinggi: 85 } },
      ],
    },
    {
      id: 'kotak',
      group: 'dinding',
      name: 'Meja lipat kotak dinding (murphy)',
      desc: 'kotak rangka di tembok; daun dilipat naik menutup kotak, ditahan batang miring',
      params: { model: 'kotak', panjang: 80, dalam: 45, tinggi: 75, jumlahEngsel: 'piano' },
      sizes: [
        { label: 'Meja kerja / laptop', desc: '80 × 45 cm, tinggi 75', params: { panjang: 80, dalam: 45, tinggi: 75 } },
        { label: 'Meja makan 2 orang', desc: '100 × 45 cm, tinggi 75', params: { panjang: 100, dalam: 45, tinggi: 75 } },
        { label: 'Meja rias berdiri', desc: '60 × 35 cm, tinggi 90', params: { panjang: 60, dalam: 35, tinggi: 90 } },
      ],
    },
    {
      id: 'tiang',
      group: 'dinding',
      name: 'Meja bar dinding tiang lantai',
      desc: 'tiang dari lantai menempel tembok, lengan menjorok tanpa kaki depan',
      params: { model: 'tiang', panjang: 150, dalam: 40, tinggi: 105 },
      sizes: [
        { label: 'Bar menghadap tembok', desc: '150 × 40 cm, tinggi 105', params: { panjang: 150, dalam: 40, tinggi: 105 } },
        { label: 'Meja makan sempit', desc: '120 × 45 cm, tinggi 75', params: { panjang: 120, dalam: 45, tinggi: 75 } },
        { label: 'Meja dapur / saji', desc: '160 × 45 cm, tinggi 90', params: { panjang: 160, dalam: 45, tinggi: 90 } },
      ],
    },
  ],
  summary: (p) => `${num(p, 'panjang')} × ${num(p, 'dalam')} cm, tinggi ${num(p, 'tinggi')} cm${folds(p) ? ' · lipat' : ''}`,

  build: (p) => {
    const m = model(p);
    const W = num(p, 'panjang', 80);
    const D = num(p, 'dalam', 40);
    const H = num(p, 'tinggi', 75);
    const b = BOARD_THICK[str(p, 'papan', 'hpl')] ?? 1.9;
    const L = (parseInt(str(p, 'pipa', '20')) || 20) / 10;
    const t: Tube = [L * 10, L * 10];
    const { list, add, line } = memberFactory();
    const yTop = H - b;
    const y = yTop - L / 2; // as rangka daun & rel dinding
    const hingeType = str(p, 'jumlahEngsel') === 'piano' ? 'piano' : 'folding-lock';
    const hinges: FrameHinge[] = [];
    const boards: Board[] = [];
    let Htot = H;
    let Dtot = D;

    /** Rangka daun: belakang (z0), depan, kiri, kanan, tengah bila panjang */
    const leaf = (z0: number, depth: number) => {
      add('daun-belakang', 'x', 0, y, z0 + L / 2, W, 'rail-x', 'Rangka daun belakang', t);
      add('daun-depan', 'x', 0, y, z0 + depth - L / 2, W, 'rail-x', 'Rangka daun depan', t);
      add('daun-kiri', 'z', L / 2, y, z0 + L, depth - 2 * L, 'rail-z', 'Rangka daun kiri', t);
      add('daun-kanan', 'z', W - L / 2, y, z0 + L, depth - 2 * L, 'rail-z', 'Rangka daun kanan', t);
      if (W > 90) add('daun-tengah', 'z', W / 2, y, z0 + L, depth - 2 * L, 'rail-z', 'Rangka daun tengah', t);
    };
    const wallHinge = (partner: string, sign: 1 | -1, label: string): FrameHinge => ({
      id: 'engsel-dinding',
      memberId: 'daun-belakang',
      partnerId: partner,
      mode: 'edge',
      type: hingeType,
      pos: 0,
      side: 'end',
      foldAxis: 'y',
      foldSign: sign,
      carry: true,
      label,
    });

    if (m === 'rel' || m === 'kaki-depan') {
      // Rel dinding (dibaut ke tembok) + 2 tiang pendek penahan di ujungnya
      add('rel-dinding', 'x', 0, y, L / 2, W, 'rail-x', 'Rel dinding (dibaut ke tembok)', t);
      add('plat-dinding-kiri', 'y', L / 2, y - 25 - L / 2, L / 2, 25, 'post', 'Tiang dinding kiri', t);
      add('plat-dinding-kanan', 'y', W - L / 2, y - 25 - L / 2, L / 2, 25, 'post', 'Tiang dinding kanan', t);
      leaf(L, D - L);
      if (folds(p)) hinges.push(wallHinge('rel-dinding', -1, 'Engsel daun meja dinding'));
      if (m === 'kaki-depan') {
        // Rangka kaki U: dua kaki tepat di bawah rangka daun depan, palang atas (engsel) & palang bawah
        const zl = D - L / 2;
        [L / 2, W - L / 2].forEach((x, i) => add(`kaki-${i}`, 'y', x, 0, zl, y - L / 2, 'post', `Kaki depan ${i ? 'kanan' : 'kiri'}`, t));
        add('kaki-atas', 'x', L, y - L, zl, W - 2 * L, 'rail-x', 'Palang atas kaki (engsel lipat)', t);
        add('kaki-bawah', 'x', L, 10, zl, W - 2 * L, 'rail-x', 'Palang bawah kaki', t);
        hinges.push({
          id: 'engsel-kaki',
          memberId: 'kaki-atas',
          partnerId: 'daun-depan',
          mode: 'edge',
          type: 'folding-lock',
          pos: 0,
          side: 'end',
          foldAxis: 'z',
          foldSign: -1,
          carry: true,
          label: 'Engsel kaki depan (dilipat ke bawah daun)',
        });
      }
      if (b > 0) boards.push({ ...board('daun-meja', 'Daun meja', 0, W, yTop, H, L, D), attachTo: 'daun-depan' });
    } else if (m === 'siku') {
      add('rel-dinding', 'x', 0, y, L / 2, W, 'rail-x', 'Rel dinding (dibaut ke tembok)', t);
      add('daun-depan', 'x', 0, y, D - L / 2, W, 'rail-x', 'Rangka daun depan', t);
      const hs = Math.max(25, Math.round(D * 0.8));
      const n = W > 100 ? 3 : 2;
      const xs = Array.from({ length: n }, (_, i) => L / 2 + ((W - L) * i) / (n - 1));
      xs.forEach((x, i) => {
        const nm = n === 3 && i === 1 ? 'tengah' : i ? 'kanan' : 'kiri';
        add(`siku-tiang-${i}`, 'y', x, y - L / 2 - hs, L / 2, hs, 'post', `Tiang siku ${nm} (dibaut ke tembok)`, t);
        add(`siku-lengan-${i}`, 'z', x, y, L, D - 2 * L, 'rail-z', `Lengan siku ${nm}`, t);
        line(`siku-miring-${i}`, [x, y - L / 2 - hs + L, L], [x, y - L / 2, D * 0.72], 'custom', `Batang miring siku ${nm}`, t);
      });
      if (b > 0) boards.push(board('daun-meja', 'Daun meja', 0, W, yTop, H, 0, D));
    } else if (m === 'tiang') {
      const n = W > 120 ? 3 : 2;
      const xs = Array.from({ length: n }, (_, i) => L / 2 + ((W - L) * i) / (n - 1));
      add('rel-dinding', 'x', 0, y, L / 2, W, 'rail-x', 'Gelagar belakang (menempel tembok)', t);
      add('daun-depan', 'x', 0, y, D - L / 2, W, 'rail-x', 'Rangka daun depan', t);
      xs.forEach((x, i) => {
        const nm = n === 3 && i === 1 ? 'tengah' : i ? 'kanan' : 'kiri';
        add(`tiang-${i}`, 'y', x, 0, L / 2, y - L / 2, 'post', `Tiang lantai ${nm} (dibaut ke tembok)`, t);
        add(`lengan-${i}`, 'z', x, y, L, D - 2 * L, 'rail-z', `Lengan menjorok ${nm}`, t);
      });
      add('palang-bawah', 'x', L, 10, L / 2, W - 2 * L, 'rail-x', 'Palang bawah (menempel tembok)', t);
      add('palang-tengah', 'x', L, y / 2, L / 2, W - 2 * L, 'rail-x', 'Palang tengah (menempel tembok)', t);
      if (b > 0) boards.push(board('daun-meja', 'Daun meja', 0, W, yTop, H, 0, D));
    } else {
      // kotak (murphy): kotak rangka di tembok di atas daun, daun berengsel di palang bawah depan kotak
      const kd = 14;
      const hb = D + 8;
      const y0 = y; // as palang bawah kotak = sejajar rangka daun
      const y1 = y + hb;
      [L / 2, W - L / 2].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        add(`kotak-tiang-b-${i}`, 'y', x, y0 + L / 2, L / 2, hb - L, 'post', `Tiang kotak belakang ${nm}`, t);
        add(`kotak-tiang-d-${i}`, 'y', x, y0 + L / 2, kd - L / 2, hb - L, 'post', `Tiang kotak depan ${nm}`, t);
        add(`kotak-samping-atas-${i}`, 'z', x, y1, L, kd - 2 * L, 'rail-z', `Palang samping atas ${nm}`, t);
        add(`kotak-samping-bawah-${i}`, 'z', x, y0, L, kd - 2 * L, 'rail-z', `Palang samping bawah ${nm}`, t);
      });
      add('kotak-atas-belakang', 'x', 0, y1, L / 2, W, 'rail-x', 'Palang atas belakang (dibaut ke tembok)', t);
      add('kotak-atas-depan', 'x', 0, y1, kd - L / 2, W, 'rail-x', 'Palang atas depan', t);
      add('kotak-bawah-belakang', 'x', 0, y0, L / 2, W, 'rail-x', 'Palang bawah belakang (dibaut ke tembok)', t);
      add('kotak-bawah-depan', 'x', 0, y0, kd - L / 2, W, 'rail-x', 'Palang bawah depan (engsel daun)', t);
      leaf(kd, D);
      [L / 2, W - L / 2].forEach((x, i) =>
        line(`penahan-${i}`, [x, y1 - 8, kd - L / 2], [x, y + L / 2, kd + D * 0.65], 'custom', `Batang penahan miring ${i ? 'kanan' : 'kiri'} (rantai / stay)`, [15, 15])
      );
      hinges.push(wallHinge('kotak-bawah-depan', 1, 'Engsel daun (dilipat naik menutup kotak)'));
      if (b > 0) {
        boards.push({ ...board('daun-meja', 'Daun meja', 0, W, yTop, H, kd, kd + D), attachTo: 'daun-depan' });
        boards.push(board('kotak-tutup-atas', 'Papan atas kotak', 0, W, y1 + L / 2, y1 + L / 2 + b, 0, kd + 1));
        boards.push(board('kotak-rak', 'Rak kecil dalam kotak', L, W - L, y0 + hb / 2, y0 + hb / 2 + b, 1, kd - L));
      }
      Htot = y1 + L / 2 + b;
      Dtot = kd + D;
    }

    return { members: list, boards, casters: [], W, D: Dtot, H: Htot, boardThick: 0, hinges: hinges.length ? hinges : undefined, wall: true };
  },

  checks: (p) => {
    const out: ProductCheck[] = [];
    const m = model(p);
    const D = num(p, 'dalam');
    if (D > 45 && str(p, 'jumlahEngsel') === 'piano' && (m === 'rel' && bool(p, 'lipat')))
      out.push({ level: 'warn', message: 'Daun dalam dengan engsel piano saja mudah melendut di depan. Siku lipat kunci lebih kuat.', fix: { label: 'Pakai siku lipat', params: { jumlahEngsel: 'siku' } } });
    if ((m === 'rel' && bool(p, 'lipat')) || m === 'kaki-depan')
      if (num(p, 'tinggi') - D < 10) out.push({ level: 'warn', message: 'Saat dilipat, daun meja hampir menyentuh lantai.', fix: { label: 'Kedalaman 40 cm', params: { dalam: 40 } } });
    if (m === 'rel' && D > 50)
      out.push({ level: 'warn', message: 'Daun lebih dari 50 cm tanpa kaki / siku mudah melendut saat ditumpu siku.', fix: { label: 'Kedalaman 45 cm', params: { dalam: 45 } } });
    if (m === 'tiang' && D > 50)
      out.push({ level: 'warn', message: 'Lengan menjorok lebih dari 50 cm tanpa kaki depan: daun bisa turun di depan. Pakai model siku atau kaki depan.', fix: { label: 'Kedalaman 45 cm', params: { dalam: 45 } } });
    if (m === 'kotak' && D > 55)
      out.push({ level: 'warn', message: 'Daun dalam membuat kotak dinding tinggi dan berat di tembok.', fix: { label: 'Kedalaman 45 cm', params: { dalam: 45 } } });
    if (m === 'kaki-depan') out.push({ level: 'info', message: 'Kaki depan dilipat dulu ke bawah daun, lalu daun dilipat turun menempel dinding.' });
    if (m === 'kotak') out.push({ level: 'info', message: `Kotak dinding setinggi ±${D + 8} cm di atas daun: daun dilipat naik menjadi pintu kotak.` });
    out.push({ level: 'info', message: m === 'tiang' ? 'Tiang dibaut ke tembok minimal 2 titik per tiang supaya lengan tidak mengungkit.' : 'Rel / siku dibaut ke tembok bata/beton dengan fischer minimal 4 titik.' });
    if (folds(p)) out.push({ level: 'info', message: 'Klik engsel di 3D untuk melipat.' });
    return out;
  },
};
