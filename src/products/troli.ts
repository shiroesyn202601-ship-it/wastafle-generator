import { Board, Caster, ProductCheck, ProductDef, Params } from './types';
import { BOARD_THICK, CASTER_LOAD, CASTER_OPTIONS, board, bool, casterHeight, casterSet, materialParams, memberFactory, num, r1, str } from './common';

/**
 * Troli. Tiap model = konstruksi rangka berbeda:
 * - rak: rak bertingkat di atas 4 roda, pegangan dorong di satu sisi (bibir / tanpa pegangan = variasi ukuran)
 * - buku: rak miring dua sisi (bentuk V) dengan sekat tengah, untuk buku / pajangan
 * - perkakas: rak bawah + tiang belakang diteruskan tinggi dengan papan pegboard untuk gantung alat
 * - saji-lipat: rak saji dengan dua sayap daun lipat di kiri-kanan, ditahan lengan + siku miring
 * - platform: lantai rendah di atas 4 roda + pegangan U tegak dengan siku miring
 * - angkong: troli 2 roda (hand truck): rangka tegak, lidah plat di bawah, roda besar di belakang
 * - kandang: lantai beroda dengan pagar jeruji tinggi di 3 sisi (roll container)
 */
type Tube = [number, number];
const MODELS = ['rak', 'buku', 'perkakas', 'saji-lipat', 'platform', 'angkong', 'kandang'];
const model = (p: Params) => {
  const m = str(p, 'model', 'rak');
  return MODELS.includes(m) ? m : 'rak';
};
/** Model yang memakai pegangan dorong (toggle) di sisi kiri */
const handleToggle = (p: Params) => ['rak', 'buku', 'perkakas'].includes(model(p));
const handleOn = (p: Params) => (handleToggle(p) && bool(p, 'pegangan')) || model(p) === 'platform';
const shelved = (p: Params) => ['rak', 'buku', 'perkakas', 'saji-lipat'].includes(model(p));

export const TROLI: ProductDef = {
  id: 'troli',
  name: 'Troli',
  tagline: 'dorong · saji · bengkel · angkut barang',
  icon: 'M12 10h34M12 24h34M12 10v14M46 4v20M18 28a3 3 0 1 0 .1 0M40 28a3 3 0 1 0 .1 0',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['panjang', 'lebar', 'tinggiRak'] },
    { id: 'bentuk', title: 'Bentuk', keys: ['model', 'tingkat', 'pegangan', 'tinggiPegangan', 'bibir', 'tinggiPapan', 'lebarDaun', 'tinggiPagar', 'palang'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Roda', keys: ['ukuranRoda', 'rodaBesar', 'remRoda'] },
  ],
  params: [
    {
      key: 'model',
      label: 'Model troli',
      type: 'choice',
      options: [
        { value: 'rak', label: 'Rak bertingkat', desc: 'Rak datar di atas 4 roda' },
        { value: 'buku', label: 'Rak miring (V)', desc: 'Rak miring dua sisi, sekat tengah' },
        { value: 'perkakas', label: 'Rak + pegboard', desc: 'Papan gantung alat di belakang' },
        { value: 'saji-lipat', label: 'Saji bersayap', desc: 'Daun lipat kiri-kanan' },
        { value: 'platform', label: 'Platform', desc: 'Lantai rendah + pegangan U' },
        { value: 'angkong', label: 'Angkong 2 roda', desc: 'Rangka tegak, lidah bawah, roda besar' },
        { value: 'kandang', label: 'Kandang / jeruji', desc: 'Pagar jeruji tinggi 3 sisi' },
      ],
    },
    { key: 'panjang', label: 'Panjang', type: 'number', unit: 'cm', min: 35, max: 140, step: 1, help: 'Untuk angkong: lebar rangka tegak.', marks: [{ value: 60, label: 'saji' }, { value: 90, label: 'bengkel' }] },
    { key: 'lebar', label: 'Lebar', type: 'number', unit: 'cm', min: 25, max: 80, step: 1, marks: [{ value: 40, label: 'saji' }, { value: 55, label: 'bengkel' }], showIf: (p) => model(p) !== 'angkong' },
    { key: 'tinggiRak', label: 'Tinggi rak paling atas', type: 'number', unit: 'cm', min: 40, max: 110, step: 1, help: 'Dari lantai sampai permukaan papan teratas.', marks: [{ value: 85, label: 'nyaman berdiri' }], showIf: shelved },
    { key: 'tingkat', label: 'Jumlah rak', type: 'number', unit: 'rak', min: 1, max: 5, step: 1, showIf: shelved },
    { key: 'pegangan', label: 'Pegangan dorong', type: 'toggle', help: 'Pipa pegangan di sisi kiri.', showIf: handleToggle },
    { key: 'tinggiPegangan', label: 'Tinggi pegangan', type: 'number', unit: 'cm', min: 70, max: 115, step: 1, marks: [{ value: 97, label: 'ergonomis' }], help: 'Untuk angkong: tinggi keseluruhan.', showIf: (p) => handleOn(p) || model(p) === 'angkong' },
    { key: 'bibir', label: 'Bibir penahan barang', type: 'toggle', help: 'Pagar rendah ±5 cm di keliling tiap rak supaya barang tidak jatuh saat didorong.', showIf: (p) => model(p) === 'rak' || model(p) === 'saji-lipat' },
    { key: 'tinggiPapan', label: 'Tinggi papan pegboard', type: 'number', unit: 'cm', min: 110, max: 180, step: 1, help: 'Ujung atas papan gantung alat dari lantai.', showIf: (p) => model(p) === 'perkakas' },
    { key: 'lebarDaun', label: 'Lebar sayap lipat', type: 'number', unit: 'cm', min: 15, max: 40, step: 1, help: 'Tiap sisi kiri & kanan.', showIf: (p) => model(p) === 'saji-lipat' },
    { key: 'tinggiPagar', label: 'Tinggi pagar jeruji', type: 'number', unit: 'cm', min: 60, max: 170, step: 1, help: 'Dari lantai sampai pipa atas pagar.', showIf: (p) => model(p) === 'kandang' },
    { key: 'palang', label: 'Pipa penyangga papan', type: 'choice', options: [{ value: '20x20', label: '20×20 mm', desc: 'Beban ringan' }, { value: '20x40', label: '20×40 mm', desc: 'Beban berat / panjang' }], showIf: (p) => model(p) !== 'angkong' },
    ...materialParams(true),
    { key: 'ukuranRoda', label: 'Ukuran roda', type: 'choice', options: CASTER_OPTIONS, showIf: (p) => model(p) !== 'angkong' },
    { key: 'rodaBesar', label: 'Roda angkong', type: 'choice', options: [{ value: '8', label: 'Roda 8"', desc: 'Lantai rata' }, { value: '10', label: 'Roda 10"', desc: 'Jalan kasar / tangga' }], showIf: (p) => model(p) === 'angkong' },
    { key: 'remRoda', label: 'Roda dengan rem', type: 'toggle', help: 'Troli tidak meluncur sendiri.', showIf: (p) => model(p) !== 'angkong' },
  ],
  defaults: {
    model: 'rak', panjang: 70, lebar: 45, tinggiRak: 85, tingkat: 3, pegangan: true, tinggiPegangan: 97, palang: '20x20', bibir: false,
    tinggiPapan: 150, lebarDaun: 25, tinggiPagar: 130, rodaBesar: '8',
    pipa: '20', papan: 'kayu', warna: '#1f2226', ukuranRoda: '3', remRoda: true,
  },
  groups: [
    { id: 'rak', name: 'Troli rak (saji · salon · bengkel)', desc: 'Troli bertingkat untuk menyajikan, menyimpan dan membawa alat' },
    { id: 'angkut', name: 'Troli angkut barang', desc: 'Untuk memindah barang berat: dus, galon, karung' },
  ],
  signature: (p) => model(p),
  presets: [
    {
      id: 'dorong',
      group: 'rak',
      name: 'Troli rak + pegangan',
      desc: 'rak datar bertingkat di 4 tiang beroda, pegangan dorong di satu sisi',
      params: { model: 'rak', pegangan: true },
      sizes: [
        { label: 'Saji cafe', desc: '70 × 45 cm, 3 rak, roda 3"', params: { panjang: 70, lebar: 45, tinggiRak: 85, tingkat: 3, tinggiPegangan: 97, pipa: '20', palang: '20x20', ukuranRoda: '3' } },
        { label: 'Bengkel', desc: '90 × 55 cm, 3 rak, roda 4"', params: { panjang: 90, lebar: 55, tinggiRak: 85, tingkat: 3, tinggiPegangan: 97, palang: '20x40', pipa: '30', ukuranRoda: '4' } },
        { label: 'Dapur ramping', desc: '45 × 30 cm, 4 rak', params: { panjang: 45, lebar: 30, tinggiRak: 90, tingkat: 4, tinggiPegangan: 102, pipa: '20', palang: '20x20', ukuranRoda: '3' } },
        { label: 'Berbibir (piring / alat)', desc: '75 × 45 cm, 3 rak dengan bibir penahan', params: { panjang: 75, lebar: 45, tinggiRak: 85, tingkat: 3, tinggiPegangan: 100, bibir: true, pipa: '20', palang: '20x20', ukuranRoda: '3' } },
        { label: 'Tanpa pegangan', desc: '60 × 40 cm, 3 rak, didorong dari rangka', params: { panjang: 60, lebar: 40, tinggiRak: 80, tingkat: 3, pegangan: false, pipa: '20', palang: '20x20', ukuranRoda: '3' } },
        { label: 'Meja samping beroda', desc: '45 × 45 cm, 2 rak, tanpa pegangan', params: { panjang: 45, lebar: 45, tinggiRak: 60, tingkat: 2, pegangan: false, pipa: '20', palang: '20x20', ukuranRoda: '3' } },
      ],
    },
    {
      id: 'buku',
      group: 'rak',
      name: 'Troli rak miring (buku / pajang)',
      desc: 'rak miring dua sisi berbentuk V dengan sekat tengah tinggi',
      params: { model: 'buku', panjang: 80, lebar: 45, tinggiRak: 90, tingkat: 3, pegangan: false, pipa: '20', palang: '20x20' },
      sizes: [
        { label: 'Troli buku perpustakaan', desc: '80 × 45 cm, 3 rak miring', params: { panjang: 80, lebar: 45, tinggiRak: 90, tingkat: 3 } },
        { label: 'Pajang produk toko', desc: '60 × 40 cm, 2 rak miring', params: { panjang: 60, lebar: 40, tinggiRak: 75, tingkat: 2 } },
        { label: 'Buku + pegangan', desc: '90 × 50 cm, 3 rak, pegangan dorong', params: { panjang: 90, lebar: 50, tinggiRak: 95, tingkat: 3, pegangan: true, tinggiPegangan: 108 } },
      ],
    },
    {
      id: 'perkakas',
      group: 'rak',
      name: 'Troli bengkel + papan pegboard',
      desc: 'tiang belakang diteruskan tinggi, papan berlubang untuk gantung alat',
      params: { model: 'perkakas', panjang: 80, lebar: 45, tinggiRak: 80, tingkat: 2, pegangan: true, tinggiPegangan: 95, tinggiPapan: 150, pipa: '30', palang: '20x40', ukuranRoda: '4' },
      sizes: [
        { label: 'Bengkel motor', desc: '80 × 45 cm, pegboard 150', params: { panjang: 80, lebar: 45, tinggiPapan: 150, tingkat: 2 } },
        { label: 'Salon / barbershop', desc: '50 × 40 cm, 3 rak, pegboard 130', params: { panjang: 50, lebar: 40, tinggiRak: 85, tingkat: 3, tinggiPegangan: 100, tinggiPapan: 130, pipa: '20', palang: '20x20', ukuranRoda: '3' } },
        { label: 'Bengkel besar', desc: '100 × 55 cm, pegboard 165', params: { panjang: 100, lebar: 55, tinggiPapan: 165, tingkat: 2, ukuranRoda: '5' } },
      ],
    },
    {
      id: 'saji-lipat',
      group: 'rak',
      name: 'Troli saji bersayap lipat',
      desc: 'rak atas melebar dengan dua daun lipat kiri-kanan di atas lengan siku',
      params: { model: 'saji-lipat', panjang: 60, lebar: 40, tinggiRak: 78, tingkat: 2, lebarDaun: 25, pipa: '20', palang: '20x20' },
      sizes: [
        { label: 'Troli teh / saji', desc: '60 × 40 cm, sayap 25 cm', params: { panjang: 60, lebar: 40, lebarDaun: 25 } },
        { label: 'Meja saji prasmanan', desc: '80 × 45 cm, sayap 35 cm, 3 rak', params: { panjang: 80, lebar: 45, lebarDaun: 35, tingkat: 3 } },
      ],
    },
    {
      id: 'platform',
      group: 'angkut',
      name: 'Troli platform',
      desc: 'lantai rendah di atas 4 roda, pegangan U tegak dengan siku miring',
      params: { model: 'platform', panjang: 90, lebar: 60, tinggiPegangan: 90, palang: '20x40', pipa: '30', ukuranRoda: '4' },
      sizes: [
        { label: 'Gudang / toko', desc: '90 × 60 cm, roda 4"', params: { panjang: 90, lebar: 60, ukuranRoda: '4' } },
        { label: 'Barang berat', desc: '120 × 70 cm, roda 5"', params: { panjang: 120, lebar: 70, pipa: '40', ukuranRoda: '5', tinggiPegangan: 95 } },
        { label: 'Kecil (galon / dus)', desc: '60 × 45 cm, roda 3"', params: { panjang: 60, lebar: 45, pipa: '20', ukuranRoda: '3', tinggiPegangan: 85 } },
      ],
    },
    {
      id: 'angkong',
      group: 'angkut',
      name: 'Troli angkong 2 roda',
      desc: 'rangka tegak dengan lidah plat di bawah, dua roda besar di belakang',
      params: { model: 'angkong', panjang: 45, tinggiPegangan: 110, pipa: '20', rodaBesar: '8' },
      sizes: [
        { label: 'Galon / dus', desc: 'lebar 45, tinggi 110, roda 8"', params: { panjang: 45, tinggiPegangan: 110, rodaBesar: '8' } },
        { label: 'Karung / beras', desc: 'lebar 50, tinggi 115, roda 10"', params: { panjang: 50, tinggiPegangan: 115, rodaBesar: '10', pipa: '30' } },
        { label: 'Tabung gas', desc: 'lebar 38, tinggi 100, roda 8"', params: { panjang: 38, tinggiPegangan: 100, rodaBesar: '8' } },
      ],
    },
    {
      id: 'kandang',
      group: 'angkut',
      name: 'Troli kandang (jeruji 3 sisi)',
      desc: 'lantai beroda dengan pagar jeruji tinggi di belakang, kiri dan kanan',
      params: { model: 'kandang', panjang: 80, lebar: 60, tinggiPagar: 130, palang: '20x20', pipa: '30', ukuranRoda: '4' },
      sizes: [
        { label: 'Laundry / linen', desc: '80 × 60 cm, pagar 130', params: { panjang: 80, lebar: 60, tinggiPagar: 130 } },
        { label: 'Gudang / ekspedisi', desc: '100 × 70 cm, pagar 160, roda 5"', params: { panjang: 100, lebar: 70, tinggiPagar: 160, palang: '20x40', pipa: '40', ukuranRoda: '5' } },
        { label: 'Pajang buah / sayur', desc: '70 × 50 cm, pagar 80', params: { panjang: 70, lebar: 50, tinggiPagar: 80, ukuranRoda: '3' } },
      ],
    },
  ],
  summary: (p) => {
    const m = model(p);
    if (m === 'angkong') return `lebar ${num(p, 'panjang')} cm · tinggi ${num(p, 'tinggiPegangan')} cm · roda ${str(p, 'rodaBesar', '8')}"`;
    if (m === 'platform') return `${num(p, 'panjang')} × ${num(p, 'lebar')} cm · platform`;
    if (m === 'kandang') return `${num(p, 'panjang')} × ${num(p, 'lebar')} cm · pagar ${num(p, 'tinggiPagar')} cm`;
    return `${num(p, 'panjang')} × ${num(p, 'lebar')} cm · ${num(p, 'tingkat')} rak`;
  },

  build: (p) => {
    const m = model(p);
    const W = num(p, 'panjang', 70);
    const D = num(p, 'lebar', 45);
    const n = Math.max(1, Math.round(num(p, 'tingkat', 3)));
    const L = (parseInt(str(p, 'pipa', '20')) || 20) / 10;
    const rail: Tube = str(p, 'palang') === '20x40' ? [20, 40] : [20, 20];
    const rh = rail[1] / 10;
    const b = BOARD_THICK[str(p, 'papan', 'multiplek')] ?? 1.8;
    const inch = parseInt(str(p, 'ukuranRoda', '3')) || 3;
    const c = casterHeight(inch);
    const post: Tube = [L * 10, L * 10];
    const bar: Tube = [15, 15];
    const brake = bool(p, 'remRoda');
    const { list, add, line } = memberFactory();
    const boards: Board[] = [];

    // ---------- Angkong 2 roda ----------
    if (m === 'angkong') {
      const big = parseInt(str(p, 'rodaBesar', '8')) || 8;
      const r = (big * 2.54) / 2;
      const ox = 7; // ruang roda di luar rangka
      const hh = num(p, 'tinggiPegangan', 110);
      const zw = r + 1; // as roda
      const zu = zw + 9; // as rangka tegak
      const nose = 25;
      const xs = [ox + L / 2, ox + W - L / 2];
      xs.forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        add(`tegak-${i}`, 'y', x, 0, zu, hh - 10, 'post', `Rangka tegak ${nm}`, post);
        line(`gagang-${i}`, [x, hh - 10, zu], [x, hh - L / 2, zu - 10], 'post', `Gagang miring ${nm}`, post);
        line(`dudukan-as-${i}`, [x, r, zw], [x, r + 16, zu - L / 2], 'custom', `Dudukan as roda ${nm}`, [20, 20]);
      });
      add('pegangan', 'x', ox, hh - L / 2, zu - 10, W, 'rail-x', 'Pegangan atas', post);
      const rungs = Math.max(3, Math.round((hh - 20) / 28));
      for (let k = 0; k < rungs; k++) {
        const y = 12 + ((hh - 30) * k) / (rungs - 1);
        add(`palang-${k + 1}`, 'x', ox + L, y, zu, W - 2 * L, 'rail-x', `Palang rangka ${k + 1}`, [20, 20]);
      }
      add('as-roda', 'x', ox - 5, r, zw, W + 10, 'rail-x', 'As roda (besi as Ø20)', [20, 20]);
      add('penguat-lidah', 'x', ox + L, 1.5, zu + nose - 2, W - 2 * L, 'rail-x', 'Penguat ujung lidah', [20, 20]);
      boards.push({ ...board('lidah', 'Lidah plat bawah', ox, ox + W, 0, 0.6, zu - L / 2, zu + nose), steelMm: 5 });
      const wheels: Caster[] = [ox - 4, ox + W + 4].map((x, i) => ({ id: `roda-besar-${i}`, x, z: zw, topY: 2 * r + 1, sizeInch: big, brake: false }));
      return { members: list, boards, casters: wheels, W: W + 2 * ox, D: zu + nose, H: hh, boardThick: 0 };
    }

    // ---------- Lantai beroda (platform & kandang) ----------
    if (m === 'platform' || m === 'kandang') {
      const xl = L / 2;
      const xr = W - L / 2;
      const zb = L / 2;
      const zf = D - L / 2;
      const yd = c + rh / 2; // as rangka lantai
      const deckTop = yd + rh / 2 + b;
      add('lantai-belakang', 'x', 0, yd, zb, W, 'rail-x', 'Rangka lantai belakang', rail);
      add('lantai-depan', 'x', 0, yd, zf, W, 'rail-x', 'Rangka lantai depan', rail);
      const nz = Math.max(2, Math.ceil(W / 45) + 1);
      for (let k = 0; k < nz; k++) {
        const x = xl + ((xr - xl) * k) / (nz - 1);
        add(`lantai-lintang-${k + 1}`, 'z', x, yd, L, D - 2 * L, 'rail-z', k === 0 || k === nz - 1 ? `Rangka lantai ${k ? 'kanan' : 'kiri'}` : `Palang lantai ${k}`, rail);
      }
      if (b > 0) boards.push(board('lantai', 'Papan lantai troli', 0, W, yd + rh / 2, deckTop, L, D - L));
      let H = deckTop;

      if (m === 'platform') {
        const hh = Math.max(deckTop + 40, num(p, 'tinggiPegangan', 90));
        const y0 = yd + rh / 2;
        [zb, zf].forEach((z, i) => {
          const nm = i ? 'depan' : 'belakang';
          add(`pegangan-tegak-${i}`, 'y', xl, y0, z, hh - y0, 'post', `Tiang pegangan ${nm}`, post);
          line(`siku-pegangan-${i}`, [xl + L / 2, y0 + 32, z], [xl + 30, y0 + 1, z], 'custom', `Siku miring pegangan ${nm}`, [20, 20]);
        });
        add('pegangan', 'z', xl, hh - L / 2, L, D - 2 * L, 'rail-z', 'Pegangan dorong', post);
        add('pegangan-tengah', 'z', xl, (y0 + hh) / 2 + 5, L, D - 2 * L, 'rail-z', 'Palang tengah pegangan', [20, 20]);
        H = hh;
      } else {
        const hp = Math.max(deckTop + 30, num(p, 'tinggiPagar', 130));
        const y0 = yd + rh / 2;
        const corners: [number, number, string][] = [
          [xl, zb, 'kiri belakang'],
          [xr, zb, 'kanan belakang'],
          [xl, zf, 'kiri depan'],
          [xr, zf, 'kanan depan'],
        ];
        corners.forEach(([x, z, nm], i) => add(`tiang-${i}`, 'y', x, y0, z, hp - y0, 'post', `Tiang pagar ${nm}`, post));
        const yTop = hp - L / 2;
        const yMid = (y0 + yTop) / 2;
        [yTop, yMid].forEach((y, k) => {
          const nm = k ? 'tengah' : 'atas';
          add(`pagar-belakang-${k}`, 'x', L, y, zb, W - 2 * L, 'rail-x', `Pipa pagar ${nm} belakang`, [20, 20]);
          add(`pagar-kiri-${k}`, 'z', xl, y, L, D - 2 * L, 'rail-z', `Pipa pagar ${nm} kiri`, [20, 20]);
          add(`pagar-kanan-${k}`, 'z', xr, y, L, D - 2 * L, 'rail-z', `Pipa pagar ${nm} kanan`, [20, 20]);
        });
        const gap = 15;
        const nb = Math.max(1, Math.round((W - 2 * L) / gap) - 1);
        for (let k = 1; k <= nb; k++) add(`jeruji-belakang-${k}`, 'y', L + ((W - 2 * L) * k) / (nb + 1), deckTop, zb, yTop - deckTop, 'post', `Jeruji belakang ${k}`, bar);
        const ns = Math.max(1, Math.round((D - 2 * L) / gap) - 1);
        for (let k = 1; k <= ns; k++) {
          const z = L + ((D - 2 * L) * k) / (ns + 1);
          add(`jeruji-kiri-${k}`, 'y', xl, deckTop, z, yTop - deckTop, 'post', `Jeruji kiri ${k}`, bar);
          add(`jeruji-kanan-${k}`, 'y', xr, deckTop, z, yTop - deckTop, 'post', `Jeruji kanan ${k}`, bar);
        }
        H = hp;
      }
      return { members: list, boards, casters: casterSet([xl, xr], [zb, zf], inch, brake), W, D, H, boardThick: 0 };
    }

    // ---------- Troli rak (rak, buku, perkakas, saji-lipat) ----------
    const ld = m === 'saji-lipat' ? num(p, 'lebarDaun', 25) : 0;
    const ox = ld; // rangka troli bergeser ke kanan sebesar sayap kiri
    const topSurface = Math.max(c + rh + b + 2, num(p, 'tinggiRak', 85));
    const postTop = topSurface - b; // ujung tiang = bidang bawah papan teratas
    const handle = handleOn(p);
    const lip = (m === 'rak' || m === 'saji-lipat') && bool(p, 'bibir') ? 6 : 0;
    const hh = Math.max(postTop + 5 + lip, num(p, 'tinggiPegangan', 97));
    const hp = m === 'perkakas' ? Math.max(topSurface + 30, num(p, 'tinggiPapan', 150)) : 0;
    const xl = ox + L / 2;
    const xr = ox + W - L / 2;
    const zb = L / 2;
    const zf = D - L / 2;
    const zc = D / 2;
    const slope = 15;
    const drop = m === 'buku' ? r1((D / 2 - L) * Math.tan((slope * Math.PI) / 180)) : 0;
    let H = topSurface;

    // Tiang sudut
    ([
      [xl, zb, 'Tiang kiri belakang', true, true],
      [xr, zb, 'Tiang kanan belakang', false, true],
      [xl, zf, 'Tiang kiri depan', true, false],
      [xr, zf, 'Tiang kanan depan', false, false],
    ] as [number, number, string, boolean, boolean][]).forEach(([x, z, label, left, back], i) => {
      let top = postTop + lip;
      if (handle && left) top = Math.max(top, hh);
      if (hp && back) top = Math.max(top, hp);
      add(`tiang-${i}`, 'y', x, c, z, top - c, 'post', label, post);
      H = Math.max(H, top);
    });
    if (handle) add('pegangan', 'z', xl, hh - L / 2, L, D - 2 * L, 'rail-z', 'Pegangan dorong', post);

    const yBottom = c + rh / 2 + drop;
    const yTopLvl = postTop - rh / 2;
    for (let i = 0; i < n; i++) {
      const y = n === 1 ? yTopLvl : r1(yBottom + ((yTopLvl - yBottom) * i) / (n - 1));
      const t = i + 1;
      add(`r${t}-depan`, 'x', ox + L, y, zf, W - 2 * L, 'rail-x', `Palang rak ${t} depan`, rail);
      add(`r${t}-belakang`, 'x', ox + L, y, zb, W - 2 * L, 'rail-x', `Palang rak ${t} belakang`, rail);
      if (m === 'buku') {
        // rak miring: dari tepi luar turun ke palang tengah
        const yi = y - drop;
        add(`r${t}-tengah`, 'x', ox + L, yi, zc, W - 2 * L, 'rail-x', `Palang rak ${t} tengah (bawah)`, rail);
        [xl, xr].forEach((x, k) => {
          const nm = k ? 'kanan' : 'kiri';
          line(`r${t}-miring-b-${k}`, [x, y, zb + L / 2], [x, yi, zc - L / 2], 'rail-z', `Palang miring rak ${t} ${nm} belakang`, rail);
          line(`r${t}-miring-d-${k}`, [x, y, zf - L / 2], [x, yi, zc + L / 2], 'rail-z', `Palang miring rak ${t} ${nm} depan`, rail);
        });
        if (b > 0) {
          const len = (D / 2 - L) / Math.cos((slope * Math.PI) / 180);
          const yc = (y + yi) / 2 + rh / 2 + b / 2;
          ([1, -1] as const).forEach((s) => {
            const zm = zc + (s * D) / 4;
            boards.push({ ...board(`papan-${t}-${s > 0 ? 'depan' : 'belakang'}`, `Papan rak ${t} miring ${s > 0 ? 'depan' : 'belakang'}`, ox + L, ox + W - L, yc - b / 2, yc + b / 2, zm - len / 2, zm + len / 2), rotX: s > 0 ? -slope : slope });
          });
        }
      } else {
        add(`r${t}-kiri`, 'z', xl, y, L, D - 2 * L, 'rail-z', `Palang rak ${t} kiri`, rail);
        add(`r${t}-kanan`, 'z', xr, y, L, D - 2 * L, 'rail-z', `Palang rak ${t} kanan`, rail);
        if (b > 0) boards.push(board(`papan-${t}`, `Papan rak ${t}`, ox + L, ox + W - L, y + rh / 2, y + rh / 2 + b, 0, D));
      }
      if (lip) {
        const yl = y + rh / 2 + b + 4;
        const lt: Tube = [15, 15];
        add(`bibir-${t}-depan`, 'x', ox + L, yl, zf, W - 2 * L, 'rail-x', `Bibir rak ${t} depan`, lt);
        add(`bibir-${t}-belakang`, 'x', ox + L, yl, zb, W - 2 * L, 'rail-x', `Bibir rak ${t} belakang`, lt);
        add(`bibir-${t}-kiri`, 'z', xl, yl, L, D - 2 * L, 'rail-z', `Bibir rak ${t} kiri`, lt);
        add(`bibir-${t}-kanan`, 'z', xr, yl, L, D - 2 * L, 'rail-z', `Bibir rak ${t} kanan`, lt);
      }
    }

    if (m === 'buku') {
      // tiang tengah di kedua ujung + sekat tengah
      const ht = topSurface + 12;
      [xl, xr].forEach((x, k) => add(`tiang-tengah-${k}`, 'y', x, c + rh, zc, ht - c - rh, 'post', `Tiang sekat ${k ? 'kanan' : 'kiri'}`, post));
      add('sekat-atas', 'x', ox + L, ht - 1, zc, W - 2 * L, 'rail-x', 'Palang atas sekat', [20, 20]);
      if (b > 0) boards.push(board('sekat', 'Papan sekat tengah', ox + L, ox + W - L, yBottom - drop + rh / 2, ht - 2, zc - 0.6, zc + 0.6));
      H = Math.max(H, ht);
    }

    if (m === 'perkakas') {
      const yTop = hp - L / 2;
      add('pegboard-atas', 'x', ox + L, yTop, zb, W - 2 * L, 'rail-x', 'Palang atas pegboard', [20, 20]);
      add('pegboard-tengah', 'x', ox + L, (topSurface + yTop) / 2 + 4, zb, W - 2 * L, 'rail-x', 'Palang tengah pegboard', [20, 20]);
      boards.push(board('pegboard', 'Papan pegboard (berlubang)', ox + L, ox + W - L, topSurface + 3, yTop + 1, L, L + 0.6));
    }

    if (m === 'saji-lipat') {
      const yArm = postTop - 1;
      ([
        [-1, xl - L / 2, 'kiri'],
        [1, xr + L / 2, 'kanan'],
      ] as [number, number, string][]).forEach(([s, xs, nm]) => {
        [zb, zf].forEach((z, k) => {
          const zn = k ? 'depan' : 'belakang';
          const xEnd = xs + s * (ld - 2);
          add(`lengan-${nm}-${k}`, 'x', Math.min(xs, xEnd), yArm, z, ld - 2, 'rail-x', `Lengan sayap ${nm} ${zn}`, [20, 20]);
          line(`siku-sayap-${nm}-${k}`, [xs, yArm - Math.max(15, ld * 0.8), z], [xs + s * ld * 0.7, yArm - 1, z], 'custom', `Siku sayap ${nm} ${zn}`, [20, 20]);
        });
        if (b > 0) boards.push(board(`sayap-${nm}`, `Daun sayap ${nm}`, s < 0 ? 0 : ox + W, s < 0 ? ox : ox + W + ld, postTop, postTop + b, 0, D));
      });
    }

    return {
      members: list,
      boards,
      casters: casterSet([xl, xr], [zb, zf], inch, brake),
      W: W + 2 * ld,
      D,
      H,
      boardThick: 0,
    };
  },

  checks: (p) => {
    const out: ProductCheck[] = [];
    const m = model(p);
    const W = num(p, 'panjang');
    const D = num(p, 'lebar');
    const inch = parseInt(str(p, 'ukuranRoda', '3')) || 3;
    if (m === 'angkong') {
      if (W < 35) out.push({ level: 'warn', message: 'Rangka angkong terlalu sempit, barang mudah jatuh ke samping.', fix: { label: 'Lebar 45 cm', params: { panjang: 45 } } });
      out.push({ level: 'info', message: 'Lidah bawah dari plat 5 mm. Roda besar dipasang di as besi Ø20 dengan ring & pen pengunci.' });
      return out;
    }
    const top = m === 'platform' ? casterHeight(inch) + 6 : num(p, 'tinggiRak');
    if (handleOn(p) && num(p, 'tinggiPegangan') < top + 8)
      out.push({ level: 'warn', message: 'Pegangan hampir sejajar rak atas, tangan bisa terjepit barang.', fix: { label: `Pegangan ${top + 12} cm`, params: { tinggiPegangan: Math.min(115, top + 12) } } });
    if (W > 90 && str(p, 'palang') !== '20x40')
      out.push({ level: 'warn', message: 'Rak troli panjang di atas pipa 20×20 bisa melendut.', fix: { label: 'Pakai pipa 20×40', params: { palang: '20x40' } } });
    if (m === 'kandang' && num(p, 'tinggiPagar') > 2.5 * Math.min(W, D))
      out.push({ level: 'warn', message: 'Pagar terlalu tinggi dibanding alas: troli mudah terguling saat belok.', fix: { label: `Pagar ${Math.round(2.3 * Math.min(W, D))} cm`, params: { tinggiPagar: Math.round(2.3 * Math.min(W, D)) } } });
    if (m === 'perkakas' && num(p, 'tinggiPapan') > 3.5 * D)
      out.push({ level: 'warn', message: 'Papan pegboard tinggi di atas troli sempit: mudah terguling bila alat digantung.', fix: { label: 'Lebar 50 cm', params: { lebar: Math.min(80, Math.ceil(num(p, 'tinggiPapan') / 3.3)) } } });
    if (m === 'saji-lipat' && num(p, 'lebarDaun') > W / 2)
      out.push({ level: 'warn', message: 'Sayap lipat lebih dari setengah panjang troli: troli bisa terjungkit bila sayap dibebani.', fix: { label: `Sayap ${Math.floor(W / 2)} cm`, params: { lebarDaun: Math.max(15, Math.floor(W / 2)) } } });
    if (m === 'buku') out.push({ level: 'info', message: 'Rak miring 15°: buku / barang bersandar ke sekat tengah dan tidak jatuh saat didorong.' });
    if (!bool(p, 'remRoda')) out.push({ level: 'info', message: 'Tanpa rem, troli bisa meluncur di lantai miring.', fix: { label: 'Pakai roda rem', params: { remRoda: true } } });
    out.push({ level: 'info', message: `Perkiraan kapasitas roda: ± ${CASTER_LOAD[inch] * 3} kg total (dihitung 3 roda menapak).` });
    return out;
  },
};
