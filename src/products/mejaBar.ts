import { Board, ProductCheck, ProductDef, Params } from './types';
import { BOARD_THICK, board, bool, materialParams, memberFactory, num, str } from './common';

/**
 * Meja bar / kasir / counter barista. z = 0 sisi barista (terbuka), z = D sisi tamu.
 * Model rangka:
 * - counter: tiang barista + tiang tamu tiap ±1 m; bisa meja tamu dua tingkat (ledge), panel depan, pijakan, rak bawah
 * - L: counter dengan sayap samping ke belakang (bentuk L), membentuk area barista
 * - etalase: counter kasir dengan rak pajang kotak-kotak menghadap tamu, punggung tertutup
 * - island: dua rangka ujung bentuk O ditutup papan menerus sampai lantai (waterfall), tanpa kaki tengah
 * - jendela: meja bar panjang sempit di kaki tunggal bentuk T terbalik (menghadap jendela / tembok)
 */
type Tube = [number, number];
const MODELS = ['counter', 'L', 'etalase', 'island', 'jendela'];
const model = (p: Params) => {
  const m = str(p, 'model', 'counter');
  return MODELS.includes(m) ? m : 'counter';
};
const isCounter = (p: Params) => model(p) === 'counter' || model(p) === 'L';
const ledgeOn = (p: Params) => isCounter(p) && bool(p, 'mejaTamu');
/** Potongan batang di antara tiang berurutan (as cs, setengah lebar tiang h): [mulai, panjang] dari sisi ke sisi. */
const gaps = (cs: number[], h: number): [number, number][] => cs.slice(1).map((c, i) => [cs[i] + h, c - cs[i] - 2 * h]);

export const MEJA_BAR: ProductDef = {
  id: 'meja-bar',
  name: 'Meja bar / kasir',
  tagline: 'counter barista · kasir · bar · island',
  icon: 'M4 14h52M6 14v22M54 14v22M4 8h52M6 30h48',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['panjang', 'dalam', 'tinggi'] },
    { id: 'bentuk', title: 'Bentuk', keys: ['model', 'panjangSayap', 'mejaTamu', 'tinggiTamu', 'lebarTamu', 'overhang', 'panelDepan', 'pijakanKaki'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Rak', keys: ['rakBawah'] },
  ],
  params: [
    {
      key: 'model',
      label: 'Model rangka',
      type: 'choice',
      options: [
        { value: 'counter', label: 'Counter lurus', desc: 'Tiang depan-belakang tiap ±1 m' },
        { value: 'L', label: 'Counter L', desc: 'Sayap samping ke belakang' },
        { value: 'etalase', label: 'Kasir rak pajang', desc: 'Kotak-kotak pajang menghadap tamu' },
        { value: 'island', label: 'Island waterfall', desc: 'Papan ujung menerus sampai lantai' },
        { value: 'jendela', label: 'Bar jendela kaki T', desc: 'Kaki tunggal di tengah, ramping' },
      ],
    },
    { key: 'panjang', label: 'Panjang', type: 'number', unit: 'cm', min: 80, max: 300, step: 1, marks: [{ value: 120, label: 'kasir' }, { value: 180, label: 'bar 3 kursi' }, { value: 240, label: 'bar 4 kursi' }] },
    { key: 'dalam', label: 'Kedalaman meja kerja', type: 'number', unit: 'cm', min: 35, max: 90, step: 1, help: 'Dari sisi barista ke sisi tamu.', marks: [{ value: 60, label: 'umum' }] },
    { key: 'tinggi', label: 'Tinggi meja kerja', type: 'number', unit: 'cm', min: 75, max: 110, step: 1, help: 'Permukaan tempat barista bekerja.', marks: [{ value: 90, label: 'kerja / counter' }, { value: 105, label: 'bar' }] },
    { key: 'panjangSayap', label: 'Panjang sayap samping', type: 'number', unit: 'cm', min: 50, max: 200, step: 1, help: 'Sayap kanan ke arah belakang (sisi barista).', showIf: (p) => model(p) === 'L' },
    { key: 'mejaTamu', label: 'Meja tamu dua tingkat', type: 'toggle', help: 'Papan lebih tinggi di sisi tamu, menutupi area kerja barista.', showIf: isCounter },
    { key: 'tinggiTamu', label: 'Tinggi meja tamu', type: 'number', unit: 'cm', min: 95, max: 120, step: 1, marks: [{ value: 110, label: 'umum' }], showIf: ledgeOn },
    { key: 'lebarTamu', label: 'Lebar meja tamu', type: 'number', unit: 'cm', min: 20, max: 45, step: 1, help: 'Bagian yang menjorok ke tamu menjadi ruang lutut.', showIf: ledgeOn },
    { key: 'overhang', label: 'Daun menjorok ke tamu', type: 'number', unit: 'cm', min: 0, max: 35, step: 1, help: 'Untuk duduk di stool: 25–30 cm ruang lutut.', marks: [{ value: 0, label: 'rata' }, { value: 25, label: 'duduk' }], showIf: (p) => (isCounter(p) && !ledgeOn(p)) || model(p) === 'island' },
    { key: 'panelDepan', label: 'Panel penutup depan', type: 'toggle', help: 'Papan menutup sisi tamu (bisa dilapis HPL / kayu).', showIf: isCounter },
    { key: 'pijakanKaki', label: 'Pijakan kaki tamu', type: 'toggle', help: 'Pipa pijakan ±20 cm dari lantai di sisi tamu.', showIf: (p) => model(p) !== 'etalase' },
    { key: 'rakBawah', label: 'Jumlah rak bawah', type: 'number', unit: 'rak', min: 0, max: 3, step: 1, help: 'Model rak pajang: jumlah sekat mendatar kotak pajang.', showIf: (p) => model(p) !== 'jendela' },
    ...materialParams(true),
  ],
  defaults: { model: 'counter', panjang: 180, dalam: 60, tinggi: 90, panjangSayap: 100, mejaTamu: true, tinggiTamu: 110, lebarTamu: 35, overhang: 0, panelDepan: true, pijakanKaki: true, rakBawah: 1, pipa: '40', papan: 'kayu', warna: '#1f2226' },
  groups: [
    { id: 'meja-kasir', name: 'Meja kasir / counter barista', desc: 'Counter kerja dengan sisi barista dan sisi tamu' },
    { id: 'meja-bar', name: 'Meja bar & island', desc: 'Meja tinggi untuk duduk di stool' },
  ],
  signature: (p) => (model(p) === 'counter' ? (bool(p, 'mejaTamu') ? 'counter-dua-tingkat' : 'counter') : model(p)),
  presets: [
    {
      id: 'dua-tingkat',
      group: 'meja-kasir',
      name: 'Counter barista dua tingkat',
      desc: 'meja kerja rendah + meja tamu lebih tinggi di atas lengan, panel depan',
      params: { model: 'counter', mejaTamu: true, panelDepan: true, pijakanKaki: true },
      sizes: [
        { label: 'Coffee bar 3 kursi', desc: '180 × 60, kerja 90 / tamu 110', params: { panjang: 180, dalam: 60, tinggi: 90, tinggiTamu: 110, lebarTamu: 35, rakBawah: 1 } },
        { label: 'Meja kasir', desc: '120 × 55, kerja 90 / tamu 105', params: { panjang: 120, dalam: 55, tinggi: 90, tinggiTamu: 105, lebarTamu: 30, rakBawah: 2, pijakanKaki: false } },
        { label: 'Bar panjang', desc: '240 × 60, kerja 90 / tamu 110', params: { panjang: 240, dalam: 60, tinggi: 90, tinggiTamu: 110, lebarTamu: 35, rakBawah: 1 } },
      ],
    },
    {
      id: 'counter-l',
      group: 'meja-kasir',
      name: 'Counter L (sudut)',
      desc: 'counter depan + sayap samping ke belakang, area barista tertutup dua sisi',
      params: { model: 'L', mejaTamu: false, panelDepan: true, pijakanKaki: false, overhang: 0, panjang: 180, dalam: 60, tinggi: 90, panjangSayap: 100, rakBawah: 1 },
      sizes: [
        { label: 'Kasir sudut toko', desc: '150 + sayap 80, tinggi 90', params: { panjang: 150, panjangSayap: 80 } },
        { label: 'Coffee bar L', desc: '200 + sayap 120, overhang 25 + pijakan', params: { panjang: 200, panjangSayap: 120, tinggi: 105, overhang: 25, pijakanKaki: true } },
        { label: 'L dua tingkat', desc: '180 + sayap 100, meja tamu 110', params: { panjang: 180, panjangSayap: 100, mejaTamu: true, tinggiTamu: 110, lebarTamu: 35 } },
      ],
    },
    {
      id: 'etalase',
      group: 'meja-kasir',
      name: 'Counter kasir rak pajang',
      desc: 'rak kotak-kotak menghadap tamu untuk pajang produk, punggung tertutup papan',
      params: { model: 'etalase', panjang: 150, dalam: 50, tinggi: 95, rakBawah: 2, pijakanKaki: false },
      sizes: [
        { label: 'Kasir toko / butik', desc: '150 × 50 × 95, 3 lajur kotak', params: { panjang: 150, dalam: 50, tinggi: 95, rakBawah: 2 } },
        { label: 'Kasir kecil', desc: '100 × 45 × 95, 2 lajur', params: { panjang: 100, dalam: 45, tinggi: 95, rakBawah: 1 } },
        { label: 'Counter roti / kue', desc: '200 × 55 × 90, 3 lajur', params: { panjang: 200, dalam: 55, tinggi: 90, rakBawah: 2 } },
      ],
    },
    {
      id: 'satu-tingkat',
      group: 'meja-bar',
      name: 'Meja bar satu tingkat',
      desc: 'tiang depan-belakang tiap ±1 m, daun menjorok ke tamu di atas lengan',
      params: { model: 'counter', mejaTamu: false, panelDepan: false, pijakanKaki: true, overhang: 25, tinggi: 105, dalam: 55 },
      sizes: [
        { label: 'Bar 105 (stool 75)', desc: '180 × 55 × 105, overhang 25, rangka terbuka', params: { panjang: 180, dalam: 55, tinggi: 105, overhang: 25, rakBawah: 1 } },
        { label: 'Bar 105 tertutup panel', desc: '180 × 55 × 105, panel depan', params: { panjang: 180, dalam: 55, tinggi: 105, overhang: 25, rakBawah: 1, panelDepan: true } },
        { label: 'Counter 90 (stool 65)', desc: '160 × 55 × 90, overhang 25', params: { panjang: 160, dalam: 55, tinggi: 90, overhang: 25, rakBawah: 1 } },
        { label: 'Meja prep terbuka', desc: '150 × 60 × 90, tanpa panel, 2 rak', params: { panjang: 150, dalam: 60, tinggi: 90, overhang: 0, panelDepan: false, pijakanKaki: false, rakBawah: 2 } },
        { label: 'Meja saji prasmanan', desc: '200 × 60 × 85, tanpa panel', params: { panjang: 200, dalam: 60, tinggi: 85, overhang: 0, panelDepan: false, pijakanKaki: false, rakBawah: 1 } },
      ],
    },
    {
      id: 'island',
      group: 'meja-bar',
      name: 'Island waterfall',
      desc: 'dua rangka ujung bentuk O ditutup papan menerus ke lantai, tanpa kaki tengah',
      params: { model: 'island', panjang: 180, dalam: 65, tinggi: 92, overhang: 25, pijakanKaki: true, rakBawah: 1 },
      sizes: [
        { label: 'Island dapur + stool', desc: '180 × 90 × 92 (overhang 25)', params: { panjang: 180, dalam: 65, tinggi: 92, overhang: 25 } },
        { label: 'Bar island tinggi', desc: '160 × 75 × 105 (overhang 25)', params: { panjang: 160, dalam: 50, tinggi: 105, overhang: 25 } },
        { label: 'Island tanpa duduk', desc: '150 × 70 × 90, 2 rak', params: { panjang: 150, dalam: 70, tinggi: 90, overhang: 0, pijakanKaki: false, rakBawah: 2 } },
      ],
    },
    {
      id: 'jendela',
      group: 'meja-bar',
      name: 'Meja bar jendela kaki T',
      desc: 'daun panjang sempit di atas kaki tunggal bentuk T terbalik, pijakan menerus',
      params: { model: 'jendela', panjang: 200, dalam: 40, tinggi: 105, pijakanKaki: true },
      sizes: [
        { label: 'Menghadap jendela', desc: '200 × 40 × 105, 3 kursi', params: { panjang: 200, dalam: 40, tinggi: 105 } },
        { label: 'Bar panjang 4–5 kursi', desc: '280 × 45 × 105', params: { panjang: 280, dalam: 45, tinggi: 105 } },
        { label: 'Meja makan cepat', desc: '150 × 40 × 90', params: { panjang: 150, dalam: 40, tinggi: 90 } },
      ],
    },
  ],
  summary: (p) => {
    const m = model(p);
    const base = `${num(p, 'panjang')} × ${num(p, 'dalam')} cm`;
    if (m === 'L') return `${base} + sayap ${num(p, 'panjangSayap')} cm, tinggi ${num(p, 'tinggi')} cm`;
    if (m !== 'counter') return `${base}, tinggi ${num(p, 'tinggi')} cm`;
    return `${base}, kerja ${num(p, 'tinggi')} cm${bool(p, 'mejaTamu') ? ` · tamu ${num(p, 'tinggiTamu')} cm` : ''}`;
  },

  build: (p) => {
    const m = model(p);
    const W = num(p, 'panjang', 180);
    const D = num(p, 'dalam', 60);
    const H = num(p, 'tinggi', 90);
    const L = (parseInt(str(p, 'pipa', '40')) || 40) / 10;
    const b = BOARD_THICK[str(p, 'papan', 'kayu')] ?? 2.5;
    const rail: Tube = [20, 40];
    const thin: Tube = [20, 20];
    const post: Tube = [L * 10, L * 10];
    const { list, add } = memberFactory();
    const boards: Board[] = [];
    const yTop = H - b;
    const ya = yTop - 2; // as gelagar atas (20×40)
    const shelves = Math.round(num(p, 'rakBawah', 1));

    // ---------- Bar jendela: kaki tunggal T terbalik ----------
    if (m === 'jendela') {
      const zc = D / 2;
      const n = Math.max(2, Math.ceil((W - 40) / 120) + 1);
      const xs = Array.from({ length: n }, (_, i) => 20 + ((W - 40) * i) / (n - 1));
      xs.forEach((x, i) => {
        add(`kaki-${i}`, 'y', x, L, zc, ya - 2 - L, 'post', `Kaki tunggal ${i + 1}`, post);
        add(`telapak-${i}`, 'z', x, L / 2, 1, D - 2, 'rail-z', `Telapak kaki ${i + 1} (di lantai)`, post);
        add(`lengan-${i}`, 'z', x, ya, 1, D - 2, 'rail-z', `Lengan atas ${i + 1}`, rail);
      });
      // gelagar tengah dipotong di antara kaki, menempel di bawah lengan atas
      gaps(xs, L / 2).forEach(([x0, len], i) => add(`gelagar-atas-${i}`, 'x', x0, ya - 3, zc, len, 'rail-x', `Gelagar atas tengah ${i + 1}`, thin));
      if (bool(p, 'pijakanKaki')) {
        // pijakan dipotong per kaki: ujung luar menjorok dari kaki tepi, potongan tengah di antara kaki
        add('pijakan-kaki-kiri', 'x', 5, 22, zc, xs[0] - L / 2 - 5, 'rail-x', 'Pipa pijakan kaki ujung kiri', [40, 40]);
        gaps(xs, L / 2).forEach(([x0, len], i) => add(`pijakan-kaki-${i}`, 'x', x0, 22, zc, len, 'rail-x', `Pipa pijakan kaki ${i + 1}`, [40, 40]));
        add('pijakan-kaki-kanan', 'x', xs[n - 1] + L / 2, 22, zc, W - 5 - xs[n - 1] - L / 2, 'rail-x', 'Pipa pijakan kaki ujung kanan', [40, 40]);
      } else gaps(xs, L / 2).forEach(([x0, len], i) => add(`palang-bawah-${i}`, 'x', x0, 15, zc, len, 'rail-x', `Palang bawah antar kaki ${i + 1}`, thin));
      if (b > 0) boards.push(board('daun', 'Daun meja bar', 0, W, yTop, H, 0, D));
      return { members: list, boards, casters: [], W, D, H, boardThick: 0 };
    }

    // ---------- Island waterfall ----------
    if (m === 'island') {
      const over = num(p, 'overhang', 0);
      const zb = L / 2;
      const zf = D - L / 2;
      const ins = b + 0.5; // rangka ujung masuk di balik papan samping
      const xe = [ins + L / 2, W - ins - L / 2];
      xe.forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        add(`ujung-${i}-belakang`, 'y', x, 0, zb, ya - 2, 'post', `Rangka ujung ${nm} tiang belakang`, post);
        add(`ujung-${i}-depan`, 'y', x, 0, zf, ya - 2, 'post', `Rangka ujung ${nm} tiang depan`, post);
        add(`ujung-${i}-atas`, 'z', x, ya, L, D - 2 * L, 'rail-z', `Rangka ujung ${nm} atas`, rail);
        add(`ujung-${i}-bawah`, 'z', x, L / 2, L, D - 2 * L, 'rail-z', `Rangka ujung ${nm} bawah (di lantai)`, post);
        // lengan menyambung ujung palang atas (rata), duduk di atas tiang depan
        if (over > 3) add(`lengan-${i}`, 'z', x, ya, D - L, over - 3 + L, 'rail-z', `Lengan daun menjorok ${nm}`, rail);
      });
      const span = xe[1] - xe[0] - L;
      add('gelagar-belakang', 'x', xe[0] + L / 2, ya, zb, span, 'rail-x', 'Gelagar atas belakang', rail);
      add('gelagar-depan', 'x', xe[0] + L / 2, ya, zf, span, 'rail-x', 'Gelagar atas depan', rail);
      // palang bawah tengah di lantai, ujungnya menempel sisi rangka ujung bawah
      add('palang-tengah-bawah', 'x', xe[0] + L / 2, 2, D / 2, span, 'rail-x', 'Palang bawah tengah', rail);
      // lengan tengah menempel sisi gelagar atas depan
      if (over > 3 && W > 150) add('lengan-tengah', 'z', W / 2, ya, zf + 1, D + over - 3 - zf - 1, 'rail-z', 'Lengan daun menjorok tengah', rail);
      for (let k = 0; k < shelves; k++) {
        const y = 20 + k * Math.min(28, (yTop - 45) / Math.max(1, shelves));
        add(`rak-${k + 1}-b`, 'x', xe[0] + L / 2, y, zb, span, 'rail-x', `Palang rak ${k + 1} belakang`, thin);
        add(`rak-${k + 1}-d`, 'x', xe[0] + L / 2, y, zf, span, 'rail-x', `Palang rak ${k + 1} depan`, thin);
        if (b > 0) boards.push(board(`papan-rak-${k + 1}`, `Papan rak ${k + 1}`, xe[0] + L / 2, xe[1] - L / 2, y + 1, y + 1 + b, L, D - L));
      }
      if (bool(p, 'pijakanKaki')) add('pijakan-kaki', 'x', xe[0] + L / 2, 23, zf, span, 'rail-x', 'Pipa pijakan kaki tamu', [40, 40]);
      if (b > 0) {
        boards.push(board('daun', 'Daun island', 0, W, yTop, H, 0, D + over));
        boards.push(board('samping-kiri', 'Papan samping kiri (waterfall)', 0, b, 0, yTop, 0, D + over));
        boards.push(board('samping-kanan', 'Papan samping kanan (waterfall)', W - b, W, 0, yTop, 0, D + over));
      }
      return { members: list, boards, casters: [], W, D: D + over, H, boardThick: 0 };
    }

    // ---------- Counter kasir rak pajang ----------
    if (m === 'etalase') {
      const o = 1.8; // tebal panel samping / punggung di luar rangka
      const zb = o + L / 2;
      const zf = o + D - L / 2;
      const n = Math.max(3, Math.round(W / 50) + 1); // lajur kotak ±50 cm
      const xs = Array.from({ length: n }, (_, i) => o + L / 2 + ((W - L) * i) / (n - 1));
      xs.forEach((x, i) => {
        if (i === 0 || i === n - 1) {
          add(`tiang-b-${i}`, 'y', x, 0, zb, ya - 2, 'post', `Tiang belakang ${i ? 'kanan' : 'kiri'}`, post);
          add(`palang-atas-${i}`, 'z', x, ya, zb + 1, zf - zb - 2, 'rail-z', `Palang atas ${i ? 'kanan' : 'kiri'}`, rail);
        }
        add(`tiang-d-${i}`, 'y', x, 0, zf, ya - 2, 'post', i === 0 || i === n - 1 ? `Tiang depan ${i ? 'kanan' : 'kiri'}` : `Tiang sekat kotak ${i}`, post);
      });
      add('gelagar-atas-b', 'x', o, ya, zb, W, 'rail-x', 'Gelagar atas belakang', rail);
      add('gelagar-atas-d', 'x', o, ya, zf, W, 'rail-x', 'Gelagar atas depan', rail);
      const lv = Math.max(1, shelves);
      const yb = 10;
      const levels = Array.from({ length: lv + 1 }, (_, k) => yb + ((ya - 6 - yb) * k) / (lv + 1));
      levels.forEach((y, k) => {
        const nm = k === 0 ? 'alas' : `sekat ${k}`;
        // palang rak menerus menempel di muka dalam tiang (tidak menembus tiang), papan bertumpu di atasnya
        add(`rak-${k}-b`, 'x', o, y, zb + L / 2 + 1, W, 'rail-x', `Palang ${nm} belakang`, thin);
        add(`rak-${k}-d`, 'x', o, y, zf - L / 2 - 1, W, 'rail-x', `Palang ${nm} depan`, thin);
        if (b > 0) boards.push(board(`papan-rak-${k}`, `Papan ${nm} kotak pajang`, o + L, o + W - L, y + 1, y + 1 + b, o + L, o + D - L));
      });
      // palang lintang bawah di tiap tiang sekat (menahan papan alas)
      xs.slice(1, -1).forEach((x, i) => {
        add(`sekat-lintang-${i}`, 'z', x, levels[0], o + L + 2, D - 2 * L - 4, 'rail-z', `Palang lintang bawah sekat ${i + 1}`, thin);
      });
      if (b > 0) {
        boards.push(board('punggung', 'Panel punggung (sisi kasir)', o, o + W, 6, yTop, 0, o));
        boards.push(board('samping-kiri', 'Panel samping kiri', 0, o, 6, yTop, 0, o + D));
        boards.push(board('samping-kanan', 'Panel samping kanan', o + W, 2 * o + W, 6, yTop, 0, o + D));
        boards.push(board('daun-kerja', 'Daun meja kasir', 0, 2 * o + W, yTop, H, 0, o + D + 4));
      }
      return { members: list, boards, casters: [], W: W + 2 * o, D: D + o + 4, H, boardThick: 0 };
    }

    // ---------- Counter lurus / L ----------
    const ledge = bool(p, 'mejaTamu');
    const Ht = Math.max(H + 10, num(p, 'tinggiTamu', 110));
    const lw = num(p, 'lebarTamu', 35);
    const over = ledge ? 0 : num(p, 'overhang', 0);
    const wing = m === 'L' ? num(p, 'panjangSayap', 100) : 0;
    const zo = wing; // counter utama bergeser ke depan sepanjang sayap
    const zb = zo + L / 2;
    const zf = zo + D - L / 2;
    const zD = zo + D;
    const n = Math.max(2, Math.ceil(W / 100) + 1);
    const xs = Array.from({ length: n }, (_, i) => L / 2 + ((W - L) * i) / (n - 1));
    const yLedgeRail = Ht - b - 2;

    xs.forEach((x, i) => {
      add(`tiang-b-${i}`, 'y', x, 0, zb, yTop - 4, 'post', `Tiang sisi barista ${i + 1}`, post);
      add(`tiang-d-${i}`, 'y', x, 0, zf, ledge ? yLedgeRail - 2 : yTop - 4, 'post', `Tiang sisi tamu ${i + 1}`, post);
      // palang atas di antara gelagar atas (dengan meja tamu: sampai sisi tiang tamu yang menerus ke atas)
      const zEnd = ledge ? zf - L / 2 : zf - 1;
      add(`palang-atas-${i}`, 'z', x, ya, zb + 1, zEnd - zb - 1, 'rail-z', `Palang atas ${i + 1}`, rail);
      if (i === 0 || i === n - 1) add(`palang-bawah-${i}`, 'z', x, 8, zo + L, D - 2 * L, 'rail-z', `Palang bawah ujung ${i ? 'kanan' : 'kiri'}`, thin);
      if (ledge) add(`lengan-tamu-${i}`, 'z', x, yLedgeRail, zD - 8, lw - 2, 'rail-z', `Lengan meja tamu ${i + 1}`, rail);
      else if (over > 3) add(`lengan-overhang-${i}`, 'z', x, ya, zf + 1, zD + over - 3 - zf - 1, 'rail-z', `Lengan daun menjorok ${i + 1}`, rail);
    });
    add('gelagar-atas-b', 'x', 0, ya, zb, W, 'rail-x', 'Gelagar atas sisi barista', rail);
    // dengan meja tamu, tiang tamu menerus ke atas: gelagar atas tamu dipotong di antara tiang
    if (ledge) gaps(xs, L / 2).forEach(([x0, len], i) => add(`gelagar-atas-d-${i}`, 'x', x0, ya, zf, len, 'rail-x', `Gelagar atas sisi tamu ${i + 1}`, rail));
    else add('gelagar-atas-d', 'x', 0, ya, zf, W, 'rail-x', 'Gelagar atas sisi tamu', rail);
    // gelagar bawah sebidang tiang: dipotong di antara tiang
    gaps(xs, L / 2).forEach(([x0, len], i) => {
      add(`gelagar-bawah-b-${i}`, 'x', x0, 8, zb, len, 'rail-x', `Gelagar bawah sisi barista ${i + 1}`, thin);
      add(`gelagar-bawah-d-${i}`, 'x', x0, 8, zf, len, 'rail-x', `Gelagar bawah sisi tamu ${i + 1}`, thin);
    });
    // gelagar meja tamu dipotong di antara lengan (lengan menerus di atas tiang tamu)
    if (ledge) gaps(xs, 1).forEach(([x0, len], i) => add(`gelagar-tamu-${i}`, 'x', x0, yLedgeRail, zf, len, 'rail-x', `Gelagar meja tamu ${i + 1}`, rail));

    // Rak sisi barista
    for (let k = 0; k < shelves; k++) {
      const y = 25 + k * Math.min(30, (yTop - 40) / Math.max(1, shelves));
      // palang rak menerus menempel di muka dalam tiang, papan rak bertumpu di atasnya
      add(`rak-${k + 1}-b`, 'x', 0, y, zb + L / 2 + 1, W, 'rail-x', `Palang rak ${k + 1} barista`, thin);
      add(`rak-${k + 1}-d`, 'x', 0, y, zf - L / 2 - 1, W, 'rail-x', `Palang rak ${k + 1} tamu`, thin);
      if (b > 0) boards.push(board(`papan-rak-${k + 1}`, `Papan rak ${k + 1}`, L, W - L, y + 1, y + 1 + b, zo + L, zD - L));
    }

    // Sayap samping (bentuk L): menempel ujung kanan, memanjang ke belakang
    if (wing > 0) {
      const xi = W - D + L / 2; // tiang sayap dalam
      const xo = W - L / 2; // tiang sayap luar (segaris tiang kanan counter)
      const nw = Math.max(1, Math.ceil(wing / 100));
      const zs: number[] = [];
      for (let k = 0; k < nw; k++) {
        const z = L / 2 + ((zo - L / 2) * k) / nw;
        zs.push(z);
        add(`sayap-tiang-dalam-${k}`, 'y', xi, 0, z, yTop - 4, 'post', `Tiang sayap dalam ${k + 1}`, post);
        add(`sayap-tiang-luar-${k}`, 'y', xo, 0, z, yTop - 4, 'post', `Tiang sayap luar ${k + 1}`, post);
      }
      [xi, xo].forEach((x, i) => {
        const nm = i ? 'luar' : 'dalam';
        // gelagar atas duduk di atas tiang sayap: ujung rata muka luar tiang, ujung lain menempel sisi gelagar atas barista
        add(`sayap-atas-${i}`, 'z', x, ya, 0, zb - 1, 'rail-z', `Gelagar atas sayap ${nm}`, rail);
        // gelagar bawah sebidang tiang: dipotong di antara tiang sayap; potongan terakhir menempel tiang barista / gelagar bawah barista
        const onPost = xs.some((c) => Math.abs(c - x) < L / 2 + 1);
        const zLast = onPost ? zo : zb - 1;
        const cuts: [number, number][] = [...gaps(zs, L / 2), [zs[nw - 1] + L / 2, zLast - zs[nw - 1] - L / 2]];
        cuts.forEach(([z0, len], k) => add(`sayap-bawah-${i}-${k}`, 'z', x, 8, z0, len, 'rail-z', `Gelagar bawah sayap ${nm}${cuts.length > 1 ? ` ${k + 1}` : ''}`, thin));
      });
      add('sayap-ujung-atas', 'x', xi + 1, ya, L / 2, xo - xi - 2, 'rail-x', 'Palang atas ujung sayap', rail);
      add('sayap-ujung-bawah', 'x', xi + L / 2, 8, L / 2, xo - xi - L, 'rail-x', 'Palang bawah ujung sayap', thin);
      if (b > 0) {
        boards.push(board('daun-sayap', 'Daun sayap samping', W - D, W, yTop, H, 0, zo));
        if (shelves > 0) boards.push(board('papan-rak-sayap', 'Papan rak sayap', xi + L / 2, xo - L / 2, 26, 26 + b, L, zo - L / 2));
      }
      if (bool(p, 'panelDepan')) boards.push(board('panel-sayap', 'Panel penutup samping sayap', W, W + 1.8, 6, yTop, 0, zD));
    }

    // Panel depan & pijakan kaki tamu
    const panelTop = ledge ? Ht - b - 4 : yTop;
    if (bool(p, 'panelDepan')) boards.push(board('panel-depan', 'Panel penutup depan', 0, W, 6, panelTop, zD, zD + 1.8));
    if (bool(p, 'pijakanKaki')) {
      const off = (bool(p, 'panelDepan') ? 1.8 : 0) + 20; // ±20 cm keluar dari muka depan
      add('pijakan-kaki', 'x', 0, 20, zD + off, W, 'rail-x', 'Pipa pijakan kaki tamu', [40, 40]);
      xs.forEach((x, i) => {
        if (i % 2 === 0 || i === n - 1) add(`dudukan-pijakan-${i}`, 'z', x, 20, zD, off - 2, 'rail-z', `Dudukan pijakan ${i + 1}`, thin);
      });
    }

    if (b > 0) boards.unshift(board('daun-kerja', 'Daun meja kerja', 0, W, yTop, H, zo, zD + over));
    if (ledge && b > 0) boards.push(board('daun-tamu', 'Daun meja tamu', 0, W, Ht - b, Ht, zD - 8, zD - 8 + lw));

    const depth = Math.max(zD + over, ledge ? zD - 8 + lw : 0, bool(p, 'pijakanKaki') ? zD + 24 : 0);
    return { members: list, boards, casters: [], W: W + (wing && bool(p, 'panelDepan') ? 1.8 : 0), D: depth, H: ledge ? Ht : H, boardThick: 0 };
  },

  checks: (p) => {
    const out: ProductCheck[] = [];
    const m = model(p);
    if (ledgeOn(p)) {
      const knee = num(p, 'lebarTamu') - 8;
      if (knee < 20) out.push({ level: 'warn', message: `Meja tamu hanya menjorok ${knee} cm: lutut tamu menabrak panel.`, fix: { label: 'Lebar tamu 35 cm', params: { lebarTamu: 35 } } });
      if (num(p, 'tinggiTamu') - num(p, 'tinggi') < 12) out.push({ level: 'info', message: 'Beda tinggi meja tamu dan meja kerja kecil: area kerja barista terlihat tamu.' });
    } else if ((isCounter(p) || m === 'island') && num(p, 'overhang') > 30)
      out.push({ level: 'warn', message: 'Daun menjorok lebih dari 30 cm perlu siku penahan tambahan supaya tidak melendut.', fix: { label: 'Overhang 25 cm', params: { overhang: 25 } } });
    if (m === 'L' && num(p, 'panjangSayap') > num(p, 'panjang') + 20)
      out.push({ level: 'warn', message: 'Sayap samping lebih panjang dari counter depan: bentuk L jadi janggal dan ruang barista sempit.', fix: { label: `Sayap ${num(p, 'panjang')} cm`, params: { panjangSayap: Math.min(200, num(p, 'panjang')) } } });
    if (m === 'L' && num(p, 'dalam') > num(p, 'panjang') / 2)
      out.push({ level: 'warn', message: 'Counter terlalu dalam dibanding panjangnya: sayap memakan seluruh area barista.', fix: { label: 'Kedalaman 60 cm', params: { dalam: 60 } } });
    if (m === 'island' && num(p, 'panjang') > 240)
      out.push({ level: 'warn', message: 'Island tanpa kaki tengah lebih dari 240 cm: gelagar atas melendut.', fix: { label: 'Panjang 220 cm', params: { panjang: 220 } } });
    if (m === 'island' && num(p, 'dalam') < 45)
      out.push({ level: 'warn', message: 'Rangka ujung island terlalu sempit, mudah goyang.', fix: { label: 'Kedalaman 50 cm', params: { dalam: 50 } } });
    if (m === 'jendela' && num(p, 'dalam') < 0.36 * num(p, 'tinggi'))
      out.push({ level: 'warn', message: 'Telapak kaki T terlalu pendek untuk meja setinggi ini: mudah goyang ke depan-belakang. Lebarkan meja atau baut telapak ke lantai.', fix: { label: `Kedalaman ${Math.ceil(0.38 * num(p, 'tinggi'))} cm`, params: { dalam: Math.ceil(0.38 * num(p, 'tinggi')) } } });
    if (m === 'jendela' && num(p, 'dalam') > 60)
      out.push({ level: 'info', message: 'Meja bar jendela biasanya 35–50 cm; lebih dalam lebih cocok model counter.' });
    if (m === 'etalase' && num(p, 'rakBawah') < 1) out.push({ level: 'info', message: 'Tanpa sekat mendatar, kotak pajang menjadi satu lubang tinggi.' });
    if (m !== 'etalase') {
      const seat = ledgeOn(p) ? num(p, 'tinggiTamu') : num(p, 'tinggi');
      out.push({ level: 'info', message: `Pasangan stool: dudukan ±${seat - 30} cm (${seat} − 30). Pijakan kaki stool ±${seat - 30 - 43} cm.` });
      if (num(p, 'panjang') / 60 >= 2) out.push({ level: 'info', message: `Muat ±${Math.floor(num(p, 'panjang') / 60)} stool (60 cm per orang).` });
    }
    return out;
  },
};
