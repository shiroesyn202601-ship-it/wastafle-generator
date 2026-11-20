import { Board, Caster, ProductCheck, ProductDef, Params } from './types';
import { BOARD_THICK, CASTER_LOAD, CASTER_OPTIONS, board, bool, casterHeight, casterSet, materialParams, memberFactory, num, r1, str } from './common';
import { angledFrame, cutAxisIndex, memberFromPoints } from '../utils/frameLayout';

/**
 * Troli. Tiap model = konstruksi rangka berbeda:
 * - rak: rak bertingkat di atas 4 roda, pegangan dorong di satu sisi (bibir / tanpa pegangan = variasi ukuran)
 * - buku: rak miring dua sisi (bentuk V) dengan sekat tengah, untuk buku / pajangan
 * - perkakas: rak bawah + tiang belakang diteruskan tinggi dengan papan pegboard untuk gantung alat
 * - saji-lipat: rak saji dengan dua sayap daun lipat di kiri-kanan, ditahan lengan + siku miring
 * - platform: lantai rendah di atas 4 roda + pegangan U tegak dengan siku miring
 * - angkong: troli 2 roda (hand truck): rangka tegak, lidah plat di bawah, roda besar di belakang
 * - kandang: lantai beroda dengan pagar jeruji tinggi di 3 sisi (roll container)
 * - saji-sepeda: gerobak saji cafe 3 ruas: baki tengah di kiri, kotak kabinet + baki bawah di kanan, roda sepeda di kiri
 * - saji-bak: gerobak saji 4 tiang: bak dalam setinggi rangka, kotak laci menggantung, baki bawah, roda sepeda di kiri
 * - tiang: satu tiang tengah di kaki silang beroda, nampan bundar bertingkat di lengan silang
 * - nampan: rak loyang (bakery): bingkai samping kiri-kanan dengan rel nampan rapat, muka depan terbuka
 * - rangka-a: lantai beroda dengan rangka A di tengah, panel kaca / papan disandarkan di kedua sisi
 * - silang: kaki silang X di kedua ujung, bak papan menggantung di bawah rangka atas
 * - sorong: gerobak sorong 1 roda: dua balok gagang memikul bak, roda di depan, dua kaki di belakang
 * - gerobak-2: gerobak barang: lantai berpagar rendah di 2 roda besar, gagang panjang + kaki penyangga
 */
type Tube = [number, number];
type P3 = [number, number, number];
const MODELS = ['rak', 'buku', 'perkakas', 'saji-lipat', 'platform', 'angkong', 'kandang', 'saji-sepeda', 'saji-bak', 'tiang', 'nampan', 'rangka-a', 'silang', 'sorong', 'gerobak-2'];
/** Gerobak dorong beroda besar tanpa roda putar (sorong & 2 roda) */
const barrow = (p: Params) => ['sorong', 'gerobak-2'].includes(model(p));
/**
 * Setengah lebar tapak potongan ujung batang miring a ke b (penampang t cm), diukur di sumbu dunia k.
 * Dipakai supaya ujung batang miring menempel rata di sisi batang lain, tidak masuk ke dalamnya.
 */
function cutHalf(a: P3, b: P3, t: number, k: number): number {
  const m = memberFromPoints({ id: 'tmp', role: 'custom', label: '' }, a, b);
  if (!m.end) return t / 2;
  const f = angledFrame(m, t, t);
  const di = cutAxisIndex(m);
  let e = 0;
  for (const s of [-1, 1])
    for (const q of [-1, 1]) {
      const off = [0, 1, 2].map((i) => (f.wd[i] * s * t) / 2 + (f.hd[i] * q * t) / 2);
      const lam = -off[di] / f.u[di];
      e = Math.max(e, Math.abs(off[k] + lam * f.u[k]));
    }
  return e;
}
/** Gerobak saji beroda sepeda (pegangan & roda sepeda selalu terpasang) */
const bikeCart = (p: Params) => ['saji-sepeda', 'saji-bak'].includes(model(p));
const model = (p: Params) => {
  const m = str(p, 'model', 'rak');
  return MODELS.includes(m) ? m : 'rak';
};
/** Model yang memakai pegangan dorong (toggle) di sisi kiri */
const handleToggle = (p: Params) => ['rak', 'buku', 'perkakas', 'tiang'].includes(model(p));
/**
 * Batang miring yang ujungnya dipotong rata lantai (horizontal) lalu dilas ke SISI tegak batang lain:
 * as ujungnya harus mundur dari sisi itu sejauh setengah lebar potongan horizontal, supaya sudut potongan
 * menempel rata di sisi batang dan tidak masuk ke dalamnya. dh0 = jarak datar as-ke-sisi, dv = beda tinggi,
 * t = tebal batang. Hasil: jarak mundur (cm).
 */
const flushBack = (dh0: number, dv: number, t: number) => {
  let off = 0;
  for (let i = 0; i < 6; i++) off = ((t / 2) * Math.hypot(dh0 - off, dv)) / Math.abs(dv);
  return off;
};
const handleOn = (p: Params) => (handleToggle(p) && bool(p, 'pegangan')) || model(p) === 'platform';
const shelved = (p: Params) => ['rak', 'buku', 'perkakas', 'saji-lipat'].includes(model(p));
const tiered = (p: Params) => shelved(p) || bikeCart(p);

export const TROLI: ProductDef = {
  id: 'troli',
  name: 'Troli',
  tagline: 'dorong · saji · bengkel · angkut barang',
  icon: 'M12 10h34M12 24h34M12 10v14M46 4v20M18 28a3 3 0 1 0 .1 0M40 28a3 3 0 1 0 .1 0',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['panjang', 'lebar', 'tinggiRak', 'tinggiRangka'] },
    { id: 'bentuk', title: 'Bentuk', keys: ['model', 'tingkat', 'pegangan', 'tinggiPegangan', 'bibir', 'tinggiPapan', 'lebarDaun', 'tinggiPagar', 'jarakRel', 'dalamBak', 'palang'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Roda', keys: ['rodaSepeda', 'rodaGerobak', 'ukuranRoda', 'rodaBesar', 'remRoda'] },
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
        { value: 'saji-sepeda', label: 'Gerobak saji + kabinet', desc: 'Roda sepeda, baki selang-seling, kotak kabinet' },
        { value: 'saji-bak', label: 'Gerobak saji bak + laci', desc: 'Roda sepeda, bak dalam, 2 laci, baki bawah' },
        { value: 'tiang', label: 'Nampan tiang tengah', desc: 'Satu tiang, nampan bundar bertingkat' },
        { value: 'nampan', label: 'Rak loyang (rel nampan)', desc: 'Bingkai samping dengan rel rapat, loyang digeser masuk' },
        { value: 'rangka-a', label: 'Rangka A (kaca / papan)', desc: 'Panel bersandar miring di dua sisi' },
        { value: 'silang', label: 'Kaki silang + bak', desc: 'Kaki X di kedua ujung, bak menggantung' },
        { value: 'sorong', label: 'Gerobak sorong 1 roda', desc: 'Bak di atas balok gagang, roda depan' },
        { value: 'gerobak-2', label: 'Gerobak barang 2 roda', desc: 'Lantai berpagar di 2 roda besar' },
      ],
    },
    { key: 'panjang', label: 'Panjang', type: 'number', unit: 'cm', min: 35, max: 140, step: 1, help: 'Untuk angkong: lebar rangka tegak. Nampan tiang tengah: garis tengah nampan. Gerobak: panjang bak / lantai.', marks: [{ value: 60, label: 'saji' }, { value: 90, label: 'bengkel' }] },
    { key: 'lebar', label: 'Lebar', type: 'number', unit: 'cm', min: 25, max: 90, step: 1, marks: [{ value: 40, label: 'saji' }, { value: 55, label: 'bengkel' }], showIf: (p) => model(p) !== 'angkong' && model(p) !== 'tiang' },
    { key: 'tinggiRak', label: 'Tinggi rak paling atas', type: 'number', unit: 'cm', min: 40, max: 110, step: 1, help: 'Dari lantai sampai permukaan papan teratas (gerobak bak / troli bak: sampai bibir bak).', marks: [{ value: 85, label: 'nyaman berdiri' }], showIf: (p) => tiered(p) || ['tiang', 'silang'].includes(model(p)) },
    { key: 'tinggiRangka', label: 'Tinggi rangka', type: 'number', unit: 'cm', min: 60, max: 190, step: 1, help: 'Dari lantai sampai pipa paling atas.', marks: [{ value: 170, label: 'rak loyang' }], showIf: (p) => ['nampan', 'rangka-a'].includes(model(p)) },
    { key: 'tingkat', label: 'Jumlah rak', type: 'number', unit: 'rak', min: 1, max: 5, step: 1, showIf: (p) => shelved(p) || model(p) === 'tiang' },
    { key: 'pegangan', label: 'Pegangan dorong', type: 'toggle', help: 'Pipa pegangan di sisi kiri.', showIf: handleToggle },
    { key: 'tinggiPegangan', label: 'Tinggi pegangan', type: 'number', unit: 'cm', min: 70, max: 115, step: 1, marks: [{ value: 97, label: 'ergonomis' }], help: 'Untuk angkong: tinggi keseluruhan.', showIf: (p) => handleOn(p) || model(p) === 'angkong' },
    { key: 'bibir', label: 'Bibir penahan barang', type: 'toggle', help: 'Pagar rendah ±5 cm di keliling tiap rak supaya barang tidak jatuh saat didorong.', showIf: (p) => model(p) === 'rak' || model(p) === 'saji-lipat' },
    { key: 'tinggiPapan', label: 'Tinggi papan pegboard', type: 'number', unit: 'cm', min: 110, max: 180, step: 1, help: 'Ujung atas papan gantung alat dari lantai.', showIf: (p) => model(p) === 'perkakas' },
    { key: 'lebarDaun', label: 'Lebar sayap lipat', type: 'number', unit: 'cm', min: 15, max: 40, step: 1, help: 'Tiap sisi kiri & kanan.', showIf: (p) => model(p) === 'saji-lipat' },
    { key: 'tinggiPagar', label: 'Tinggi pagar jeruji', type: 'number', unit: 'cm', min: 60, max: 170, step: 1, help: 'Dari lantai sampai pipa atas pagar.', showIf: (p) => model(p) === 'kandang' },
    { key: 'jarakRel', label: 'Jarak antar rel nampan', type: 'number', unit: 'cm', min: 6, max: 20, step: 1, help: 'Makin rapat makin banyak loyang, tapi isi loyang harus lebih pendek.', marks: [{ value: 10, label: 'roti' }], showIf: (p) => model(p) === 'nampan' },
    { key: 'dalamBak', label: 'Tinggi dinding bak / pagar', type: 'number', unit: 'cm', min: 10, max: 60, step: 1, help: 'Dari alas sampai bibir atas bak (gerobak 2 roda: tinggi pagar).', showIf: (p) => ['silang', 'sorong', 'gerobak-2'].includes(model(p)) },
    { key: 'palang', label: 'Pipa penyangga papan', type: 'choice', options: [{ value: '20x20', label: '20×20 mm', desc: 'Beban ringan' }, { value: '20x40', label: '20×40 mm', desc: 'Beban berat / panjang' }], showIf: (p) => ['rak', 'buku', 'perkakas', 'saji-lipat', 'platform', 'kandang', 'rangka-a'].includes(model(p)) },
    ...materialParams(true),
    { key: 'ukuranRoda', label: 'Ukuran roda', type: 'choice', options: CASTER_OPTIONS, showIf: (p) => model(p) !== 'angkong' && !barrow(p) },
    { key: 'rodaSepeda', label: 'Roda sepeda (sisi pegangan)', type: 'choice', options: [{ value: '12', label: 'Roda 12"', desc: 'Troli kecil' }, { value: '16', label: 'Roda 16"', desc: 'Paling umum' }, { value: '20', label: 'Roda 20"', desc: 'Gerobak besar, jalan kasar' }], showIf: bikeCart },
    { key: 'rodaBesar', label: 'Roda angkong', type: 'choice', options: [{ value: '8', label: 'Roda 8"', desc: 'Lantai rata' }, { value: '10', label: 'Roda 10"', desc: 'Jalan kasar / tangga' }], showIf: (p) => model(p) === 'angkong' },
    { key: 'rodaGerobak', label: 'Roda gerobak', type: 'choice', options: [{ value: '12', label: 'Roda 12"', desc: 'Gerobak kecil' }, { value: '14', label: 'Roda 14"', desc: 'Gerobak sorong biasa' }, { value: '16', label: 'Roda 16"', desc: 'Paling umum' }, { value: '20', label: 'Roda 20"', desc: 'Muatan berat, jalan kasar' }], showIf: barrow },
    { key: 'remRoda', label: 'Roda dengan rem', type: 'toggle', help: 'Troli tidak meluncur sendiri.', showIf: (p) => model(p) !== 'angkong' && !barrow(p) },
  ],
  defaults: {
    model: 'rak', panjang: 70, lebar: 45, tinggiRak: 85, tingkat: 3, pegangan: true, tinggiPegangan: 97, palang: '20x20', bibir: false,
    tinggiPapan: 150, lebarDaun: 25, tinggiPagar: 130, rodaBesar: '8', rodaSepeda: '16', tinggiRangka: 170, jarakRel: 10, dalamBak: 30, rodaGerobak: '16',
    pipa: '20', papan: 'kayu', warna: '#1f2226', ukuranRoda: '3', remRoda: true,
  },
  groups: [
    { id: 'rak', name: 'Troli rak (saji · salon · bengkel · roti)', desc: 'Troli bertingkat untuk menyajikan, menyimpan dan membawa alat' },
    { id: 'angkut', name: 'Troli angkut barang', desc: 'Untuk memindah barang berat: dus, galon, karung, kaca, cucian' },
    { id: 'gerobak-saji', name: 'Gerobak saji roda sepeda', desc: 'Bar cart cafe / kopi keliling: 2 roda sepeda di sisi pegangan, roda putar di ujung lain' },
    { id: 'gerobak', name: 'Gerobak dorong barang', desc: 'Gerobak beroda besar untuk kebun, proyek dan pasar' },
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
    {
      id: 'gerobak-saji-kabinet',
      group: 'gerobak-saji',
      name: 'Gerobak saji + kotak kabinet',
      desc: 'rangka 3 ruas: baki tengah di ruas kiri di atas roda sepeda, kotak kabinet + baki bawah di ruas kanan, baki atas penuh',
      params: { model: 'saji-sepeda', panjang: 90, lebar: 45, tinggiRak: 88, rodaSepeda: '16', pipa: '20', ukuranRoda: '3' },
      sizes: [
        { label: 'Bar cart cafe', desc: '90 × 45 cm, roda sepeda 16"', params: { panjang: 90, lebar: 45, tinggiRak: 88, rodaSepeda: '16', pipa: '20', ukuranRoda: '3' } },
        { label: 'Kopi keliling', desc: '110 × 55 cm, roda 20", pipa 30', params: { panjang: 110, lebar: 55, tinggiRak: 92, rodaSepeda: '20', pipa: '30', ukuranRoda: '4' } },
        { label: 'Mini (dalam ruangan)', desc: '75 × 40 cm, roda 12"', params: { panjang: 75, lebar: 40, tinggiRak: 82, rodaSepeda: '12', pipa: '20', ukuranRoda: '3' } },
      ],
    },
    {
      id: 'gerobak-saji-bak',
      group: 'gerobak-saji',
      name: 'Gerobak saji bak dalam + laci',
      desc: '4 tiang dengan rangka atas berbibir: bak papan dalam di atas, kotak 2 laci menggantung di bawah bak, baki bawah, tiang kiri berdiri di as roda sepeda',
      params: { model: 'saji-bak', panjang: 100, lebar: 50, tinggiRak: 90, rodaSepeda: '16', pipa: '30', ukuranRoda: '3' },
      sizes: [
        { label: 'Troli bar / minuman', desc: '100 × 50 cm, roda sepeda 16"', params: { panjang: 100, lebar: 50, tinggiRak: 90, rodaSepeda: '16', pipa: '30', ukuranRoda: '3' } },
        { label: 'Gerobak es / buah', desc: '120 × 60 cm, roda 20"', params: { panjang: 120, lebar: 60, tinggiRak: 92, rodaSepeda: '20', pipa: '40', ukuranRoda: '4' } },
        { label: 'Mini (dalam ruangan)', desc: '80 × 45 cm, roda 12"', params: { panjang: 80, lebar: 45, tinggiRak: 85, rodaSepeda: '12', pipa: '30', ukuranRoda: '3' } },
      ],
    },
    {
      id: 'nampan-tiang',
      group: 'rak',
      name: 'Troli nampan tiang tengah',
      desc: 'satu tiang di tengah kaki silang beroda, nampan bundar bertingkat ditopang lengan silang di tiang',
      params: { model: 'tiang', panjang: 45, tinggiRak: 80, tingkat: 3, pegangan: false, pipa: '20', ukuranRoda: '3' },
      sizes: [
        { label: 'Salon / barbershop', desc: 'nampan Ø 40 cm, 3 susun', params: { panjang: 40, tinggiRak: 80, tingkat: 3, pegangan: false } },
        { label: 'Saji kue / hampers', desc: 'nampan Ø 50 cm, 2 susun', params: { panjang: 50, tinggiRak: 75, tingkat: 2, pegangan: false } },
        { label: 'Dengan gagang dorong', desc: 'nampan Ø 45 cm, 3 susun, gagang di pucuk tiang', params: { panjang: 45, tinggiRak: 80, tingkat: 3, pegangan: true, tinggiPegangan: 100 } },
      ],
    },
    {
      id: 'rak-nampan',
      group: 'rak',
      name: 'Troli rak loyang (rel nampan)',
      desc: 'bingkai samping kiri-kanan dengan rel nampan rapat di sisi dalam, muka depan terbuka untuk menggeser loyang',
      params: { model: 'nampan', panjang: 48, lebar: 66, tinggiRangka: 170, jarakRel: 10, pipa: '20', ukuranRoda: '4' },
      sizes: [
        { label: 'Loyang 40 × 60 (roti)', desc: '48 × 66 cm, tinggi 170, rel tiap 10 cm', params: { panjang: 48, lebar: 66, tinggiRangka: 170, jarakRel: 10, ukuranRoda: '4' } },
        { label: 'Nampan 60 × 80 (katering)', desc: '68 × 86 cm, tinggi 175, rel tiap 12 cm', params: { panjang: 68, lebar: 86, tinggiRangka: 175, jarakRel: 12, pipa: '30', ukuranRoda: '4' } },
        { label: 'Pendek (bawah meja)', desc: '48 × 66 cm, tinggi 85', params: { panjang: 48, lebar: 66, tinggiRangka: 85, jarakRel: 10, ukuranRoda: '3' } },
      ],
    },
    {
      id: 'rangka-a',
      group: 'angkut',
      name: 'Troli rangka A (kaca / papan)',
      desc: 'rangka A di tengah lantai beroda, panel disandarkan miring di kedua sisi dengan penahan kaki di tepi lantai',
      params: { model: 'rangka-a', panjang: 100, lebar: 70, tinggiRangka: 140, palang: '20x40', pipa: '30', ukuranRoda: '4' },
      sizes: [
        { label: 'Kaca / cermin', desc: '100 × 70 cm, tinggi 140', params: { panjang: 100, lebar: 70, tinggiRangka: 140, ukuranRoda: '4' } },
        { label: 'Triplek / gipsum', desc: '130 × 80 cm, tinggi 120, roda 5"', params: { panjang: 130, lebar: 80, tinggiRangka: 120, pipa: '40', ukuranRoda: '5' } },
        { label: 'Lukisan / pameran', desc: '80 × 60 cm, tinggi 120', params: { panjang: 80, lebar: 60, tinggiRangka: 120, pipa: '20', palang: '20x20', ukuranRoda: '3' } },
      ],
    },
    {
      id: 'kaki-silang',
      group: 'angkut',
      name: 'Troli kaki silang + bak',
      desc: 'kaki silang X di kedua ujung, bak papan menggantung di bawah rangka atas',
      params: { model: 'silang', panjang: 75, lebar: 50, tinggiRak: 85, dalamBak: 50, pipa: '20', ukuranRoda: '3' },
      sizes: [
        { label: 'Laundry / linen hotel', desc: '75 × 50 cm, bak 50 cm', params: { panjang: 75, lebar: 50, tinggiRak: 85, dalamBak: 50 } },
        { label: 'Mainan / barang kecil', desc: '60 × 40 cm, bak 35 cm', params: { panjang: 60, lebar: 40, tinggiRak: 70, dalamBak: 35 } },
        { label: 'Besar (gudang)', desc: '90 × 60 cm, bak 50 cm, roda 4"', params: { panjang: 90, lebar: 60, tinggiRak: 90, dalamBak: 50, pipa: '30', ukuranRoda: '4' } },
      ],
    },
    {
      id: 'gerobak-sorong',
      group: 'gerobak',
      name: 'Gerobak sorong 1 roda',
      desc: 'dua balok gagang memikul bak papan, satu roda di depan dan dua kaki di belakang',
      params: { model: 'sorong', panjang: 70, lebar: 50, dalamBak: 25, rodaGerobak: '14', pipa: '30' },
      sizes: [
        { label: 'Taman / kebun', desc: 'bak 70 × 50 cm, roda 14"', params: { panjang: 70, lebar: 50, dalamBak: 25, rodaGerobak: '14', pipa: '30' } },
        { label: 'Proyek / pasir', desc: 'bak 80 × 60 cm, roda 16"', params: { panjang: 80, lebar: 60, dalamBak: 30, rodaGerobak: '16', pipa: '40' } },
        { label: 'Kecil (pot / anak)', desc: 'bak 50 × 38 cm, roda 12"', params: { panjang: 50, lebar: 38, dalamBak: 18, rodaGerobak: '12', pipa: '20' } },
      ],
    },
    {
      id: 'gerobak-dua-roda',
      group: 'gerobak',
      name: 'Gerobak barang 2 roda',
      desc: 'lantai berpagar jeruji rendah di atas dua roda besar, gagang panjang dan kaki penyangga di sisi gagang',
      params: { model: 'gerobak-2', panjang: 120, lebar: 70, dalamBak: 30, rodaGerobak: '16', pipa: '30' },
      sizes: [
        { label: 'Pasar / sayur', desc: '120 × 70 cm, pagar 30 cm, roda 16"', params: { panjang: 120, lebar: 70, dalamBak: 30, rodaGerobak: '16', pipa: '30' } },
        { label: 'Galon / dus', desc: '90 × 60 cm, pagar 40 cm, roda 14"', params: { panjang: 90, lebar: 60, dalamBak: 40, rodaGerobak: '14', pipa: '30' } },
        { label: 'Besar (bahan bangunan)', desc: '140 × 80 cm, pagar 25 cm, roda 20"', params: { panjang: 140, lebar: 80, dalamBak: 25, rodaGerobak: '20', pipa: '40' } },
      ],
    },
  ],
  summary: (p) => {
    const m = model(p);
    if (bikeCart(p)) return `${num(p, 'panjang')} × ${num(p, 'lebar')} cm · tinggi ${num(p, 'tinggiRak')} cm · roda sepeda ${str(p, 'rodaSepeda', '16')}"`;
    if (m === 'angkong') return `lebar ${num(p, 'panjang')} cm · tinggi ${num(p, 'tinggiPegangan')} cm · roda ${str(p, 'rodaBesar', '8')}"`;
    if (m === 'platform') return `${num(p, 'panjang')} × ${num(p, 'lebar')} cm · platform`;
    if (m === 'kandang') return `${num(p, 'panjang')} × ${num(p, 'lebar')} cm · pagar ${num(p, 'tinggiPagar')} cm`;
    if (m === 'tiang') return `nampan Ø ${num(p, 'panjang')} cm · ${num(p, 'tingkat')} susun · tinggi ${num(p, 'tinggiRak')} cm`;
    if (m === 'nampan') return `${num(p, 'panjang')} × ${num(p, 'lebar')} cm · tinggi ${num(p, 'tinggiRangka')} cm · rel tiap ${num(p, 'jarakRel')} cm`;
    if (m === 'rangka-a') return `${num(p, 'panjang')} × ${num(p, 'lebar')} cm · rangka A ${num(p, 'tinggiRangka')} cm`;
    if (m === 'silang') return `${num(p, 'panjang')} × ${num(p, 'lebar')} cm · bak ${num(p, 'dalamBak')} cm`;
    if (barrow(p)) return `${num(p, 'panjang')} × ${num(p, 'lebar')} cm · ${m === 'sorong' ? 'bak' : 'pagar'} ${num(p, 'dalamBak')} cm · roda ${str(p, 'rodaGerobak', '16')}"`;
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
        // gagang: dari ujung atas rangka tegak, dipotong rata di bawah pipa pegangan
        line(`gagang-${i}`, [x, hh - 10, zu], [x, hh - L, zu - 10], 'post', `Gagang miring ${nm}`, post);
        // dudukan as: berdiri di atas as roda, ujung atas menempel di sisi depan rangka tegak
        const yAs = r + 1; // permukaan atas as Ø20
        const back = flushBack(zu - L / 2 - zw, r + 16 - yAs, 2);
        line(`dudukan-as-${i}`, [x, yAs, zw], [x, r + 16, zu - L / 2 - back], 'custom', `Dudukan as roda ${nm}`, [20, 20]);
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

    // ---------- Gerobak saji roda sepeda (bar cart cafe) ----------
    // Ujung kiri: pegangan + 2 roda sepeda besar di as melintang (roda menggelinding ke arah panjang troli);
    // ujung kanan: 2 roda putar. Rangka hitam, baki & kotak dari papan kayu.
    if (m === 'saji-sepeda' || m === 'saji-bak') {
      const big = parseInt(str(p, 'rodaSepeda', '16')) || 16;
      const r = (big * 2.54) / 2; // jari-jari roda sepeda (cm)
      const oz = 7; // ruang ban di luar rangka (depan & belakang)
      const t = 1.8; // tebal papan dinding baki / kotak
      const lipH = 6; // tinggi bibir baki
      const grip = 14; // panjang lengan pegangan keluar dari tiang kiri
      const ox = Math.max(grip + L + 3, r + 3 - L / 2);
      const xl = ox + L / 2;
      const xr = ox + W - L / 2;
      const zb = oz + L / 2;
      const zf = oz + D - L / 2;
      const z0 = oz; // muka belakang rangka
      const z1 = oz + D; // muka depan rangka
      const topSurface = Math.max(2 * r + 30, num(p, 'tinggiRak', 85));
      const yc = c + L / 2; // as rangka bawah (di atas roda putar)
      const wheels: Caster[] = [];

      /** baki papan: alas + bibir di sisi yang diminta */
      const tray = (id: string, label: string, x0: number, x1: number, y: number, sides: ('kiri' | 'kanan' | 'depan' | 'belakang')[]) => {
        if (b <= 0) return;
        boards.push(board(`${id}-alas`, `${label} (alas)`, x0, x1, y, y + b, z0, z1));
        const yt = y + b + lipH;
        if (sides.includes('depan')) boards.push(board(`${id}-bibir-depan`, `${label} (bibir depan)`, x0, x1, y + b, yt, z1 - t, z1));
        if (sides.includes('belakang')) boards.push(board(`${id}-bibir-belakang`, `${label} (bibir belakang)`, x0, x1, y + b, yt, z0, z0 + t));
        if (sides.includes('kiri')) boards.push(board(`${id}-bibir-kiri`, `${label} (bibir kiri)`, x0, x0 + t, y + b, yt, z0 + t, z1 - t));
        if (sides.includes('kanan')) boards.push(board(`${id}-bibir-kanan`, `${label} (bibir kanan)`, x1 - t, x1, y + b, yt, z0 + t, z1 - t));
      };
      /** rangka persegi datar: depan & belakang dari x0 sampai x1 (ujung rata muka luar tiang), kiri-kanan di antaranya */
      const ring = (id: string, label: string, y: number, xa: number, xb: number, ends: [boolean, boolean], tube: Tube) => {
        add(`${id}-depan`, 'x', xa, y, zf, xb - xa, 'rail-x', `${label} depan`, tube);
        add(`${id}-belakang`, 'x', xa, y, zb, xb - xa, 'rail-x', `${label} belakang`, tube);
        if (ends[0]) add(`${id}-kiri`, 'z', xa + L / 2, y, zb + L / 2, zf - zb - L, 'rail-z', `${label} kiri`, tube);
        if (ends[1]) add(`${id}-kanan`, 'z', xb - L / 2, y, zb + L / 2, zf - zb - L, 'rail-z', `${label} kanan`, tube);
      };
      /** pegangan dorong: 2 lengan keluar dari sisi luar tiang kiri + pipa genggam melintang */
      const handleAt = (yh: number) => {
        const xg = xl - L / 2 - grip; // as pipa genggam
        [zb, zf].forEach((z, i) => add(`lengan-pegangan-${i}`, 'x', xg + L / 2, yh, z, xl - L / 2 - xg - L / 2, 'rail-x', `Lengan pegangan ${i ? 'depan' : 'belakang'}`, post));
        add('pegangan', 'z', xg, yh, zb - L / 2, zf - zb + L, 'rail-z', 'Pipa genggam pegangan', post);
      };
      /** as roda sepeda melintang + 2 roda di luar muka depan & belakang */
      const axleAt = (xw: number) => {
        add('as-roda', 'z', xw, r, 0, z1 + oz, 'rail-z', 'As roda sepeda (besi as Ø20)', [20, 20]);
        [z0 - 3.5, z1 + 3.5].forEach((z, i) => wheels.push({ id: `roda-sepeda-${i}`, x: xw, z, topY: 2 * r + 1, sizeInch: big, brake: false, axle: 'z' }));
      };

      let H = topSurface;
      if (m === 'saji-sepeda') {
        // Rangka 3 ruas: kiri (baki tengah, roda sepeda di bawah), kanan (kotak kabinet + baki bawah), baki atas penuh
        const xs = ox + Math.round(W * 0.5) - L / 2; // as tiang tengah
        const yT = topSurface - b - L / 2; // as rangka atas
        const yM = Math.max(2 * r + 6 + L / 2, Math.round(topSurface * 0.48)); // as rangka baki tengah (kiri) & alas kabinet (kanan)
        ring('atas', 'Rangka atas', yT, xl - L / 2, xr + L / 2, [true, true], post);
        // ruas kiri: rangka baki tengah, tiang kiri berdiri di atasnya
        ring('tengah', 'Rangka baki tengah', yM, xl - L / 2, xs - L / 2, [true, false], post);
        [zb, zf].forEach((z, i) => add(`tiang-kiri-${i}`, 'y', xl, yM + L / 2, z, yT - yM - L, 'post', `Tiang kiri ${i ? 'depan' : 'belakang'}`, post));
        // ruas kanan: rangka bawah di atas roda putar, tiang tengah & kanan dari rangka bawah ke rangka atas
        ring('bawah', 'Rangka baki bawah', yc, xs - L / 2, xr + L / 2, [true, true], post);
        [xs, xr].forEach((x, k) =>
          [zb, zf].forEach((z, i) => add(`tiang-${k ? 'kanan' : 'tengah'}-${i}`, 'y', x, yc + L / 2, z, yT - yc - L, 'post', `Tiang ${k ? 'kanan' : 'tengah'} ${i ? 'depan' : 'belakang'}`, post))
        );
        // alas kabinet: palang depan & belakang di antara tiang tengah dan kanan
        [zb, zf].forEach((z, i) => add(`alas-kabinet-${i}`, 'x', xs + L / 2, yM, z, xr - xs - L, 'rail-x', `Palang alas kabinet ${i ? 'depan' : 'belakang'}`, post));
        // rel pengaman ruas kiri (depan & belakang) di tengah tinggi
        const ySafe = (yM + yT) / 2;
        [zb, zf].forEach((z, i) => add(`rel-kiri-${i}`, 'x', xl + L / 2, ySafe, z, xs - xl - L, 'rail-x', `Rel pengaman ${i ? 'depan' : 'belakang'}`, bar));
        // roda sepeda di tengah ruas kiri: dudukan as turun dari rangka baki tengah
        const xw = (xl + xs) / 2;
        axleAt(xw);
        [zb, zf].forEach((z, i) => add(`dudukan-as-${i}`, 'y', xw, r + 1, z, yM - L / 2 - r - 1, 'custom', `Dudukan as roda ${i ? 'depan' : 'belakang'}`, post));
        handleAt(yT - L - 4);
        // papan: baki atas penuh, baki tengah (kiri), baki bawah (kanan), kotak kabinet (kanan); baki di antara tiang
        tray('baki-atas', 'Baki atas', xl - L / 2, xr + L / 2, yT + L / 2, ['kiri', 'kanan', 'depan', 'belakang']);
        tray('baki-tengah', 'Baki tengah', xl + L / 2, xs - L / 2, yM + L / 2, ['kiri', 'depan', 'belakang']);
        tray('baki-bawah', 'Baki bawah', xs + L / 2, xr - L / 2, yc + L / 2, ['kiri', 'kanan', 'depan', 'belakang']);
        if (b > 0) {
          const y0 = yM - L / 2;
          const y1 = yT - L / 2;
          boards.push(board('kabinet-alas', 'Kotak kabinet (alas)', xs + L / 2, xr - L / 2, yM + L / 2, yM + L / 2 + b, z0, z1));
          boards.push(board('kabinet-depan', 'Kotak kabinet (muka depan)', xs - L / 2, xr + L / 2, y0, y1, z1, z1 + 1.2));
          boards.push(board('kabinet-belakang', 'Kotak kabinet (muka belakang)', xs - L / 2, xr + L / 2, y0, y1, z0 - 1.2, z0));
          boards.push(board('kabinet-kanan', 'Kotak kabinet (samping kanan)', xr + L / 2, xr + L / 2 + 1.2, y0, y1, z0 - 1.2, z1 + 1.2));
          boards.push(board('kabinet-kiri', 'Kotak kabinet (sekat kiri)', xs + L / 2, xs + L / 2 + 1.2, yM + L / 2 + b, y1, zb + L / 2, zf - L / 2));
        }
        H = topSurface + lipH;
      } else {
        // Rangka 4 tiang: bak dalam di atas (dinding papan setinggi rangka), kotak laci menggantung di bawah bak,
        // baki bawah berbibir; tiang kiri berdiri di atas as roda sepeda
        const yT = topSurface - L / 2; // as rangka atas (bibir bak rata dengan atas rangka)
        const depth = Math.min(22, Math.max(14, Math.round(topSurface * 0.2)));
        const yB = yT - depth; // as rangka alas bak
        const y1 = Math.max(yc, r + 1 + L / 2 + 2); // as rangka baki bawah
        ring('atas', 'Rangka atas', yT, xl - L / 2, xr + L / 2, [true, true], post);
        // tiang kiri berdiri di atas as roda; tiang kanan di atas roda putar
        [zb, zf].forEach((z, i) => add(`tiang-kiri-${i}`, 'y', xl, r + 1, z, yT - L / 2 - r - 1, 'post', `Tiang kiri ${i ? 'depan' : 'belakang'} (di atas as roda)`, post));
        [zb, zf].forEach((z, i) => add(`tiang-kanan-${i}`, 'y', xr, c, z, yT - L / 2 - c, 'post', `Tiang kanan ${i ? 'depan' : 'belakang'}`, post));
        // rangka alas bak & rangka baki bawah: dilas di sisi dalam tiang
        const inner = (id: string, label: string, y: number) => {
          [zb, zf].forEach((z, i) => add(`${id}-${i ? 'depan' : 'belakang'}`, 'x', xl + L / 2, y, z, xr - xl - L, 'rail-x', `${label} ${i ? 'depan' : 'belakang'}`, post));
          [xl, xr].forEach((x, i) => add(`${id}-${i ? 'kanan' : 'kiri'}`, 'z', x, y, zb + L / 2, zf - zb - L, 'rail-z', `${label} ${i ? 'kanan' : 'kiri'}`, post));
        };
        inner('alas-bak', 'Rangka alas bak', yB);
        inner('bawah', 'Rangka baki bawah', y1);
        axleAt(xl);
        handleAt(yT - L - 3);
        if (b > 0) {
          // bak dalam: alas di atas rangka alas bak, dinding papan di dalam rangka setinggi bibir rangka atas
          const ya = yB + L / 2;
          const xa = xl + L / 2;
          const xb = xr - L / 2;
          const za = zb + L / 2;
          const zc = zf - L / 2;
          const yw = yT + L / 2;
          boards.push(board('bak-alas', 'Bak atas (alas)', xa, xb, ya, ya + b, z0, z1));
          boards.push(board('bak-depan', 'Bak atas (dinding depan)', xa, xb, ya + b, yw, zc - t, zc));
          boards.push(board('bak-belakang', 'Bak atas (dinding belakang)', xa, xb, ya + b, yw, za, za + t));
          boards.push(board('bak-kiri', 'Bak atas (dinding kiri)', xa, xa + t, ya + b, yw, za + t, zc - t));
          boards.push(board('bak-kanan', 'Bak atas (dinding kanan)', xb - t, xb, ya + b, yw, za + t, zc - t));
          // kotak laci menggantung di bawah alas bak (dibaut ke rangka alas bak), 2 muka laci di depan
          const hl = Math.min(16, yB - L / 2 - (y1 + L / 2) - 20);
          if (hl >= 8) {
            const lx0 = xl + L / 2 + Math.round((xr - xl) * 0.4);
            const ly1 = yB - L / 2;
            const ly0 = ly1 - hl;
            boards.push(board('laci-alas', 'Kotak laci (alas)', lx0, xb, ly0, ly0 + 1.2, za, zc - t));
            boards.push(board('laci-belakang', 'Kotak laci (belakang)', lx0, xb, ly0 + 1.2, ly1, za, za + 1.2));
            boards.push(board('laci-kiri', 'Kotak laci (samping kiri)', lx0, lx0 + 1.2, ly0 + 1.2, ly1, za + 1.2, zc - t));
            const mid = (lx0 + xb) / 2;
            boards.push(board('laci-muka-1', 'Muka laci 1', lx0, mid - 0.3, ly0, ly1, zc - t, zc));
            boards.push(board('laci-muka-2', 'Muka laci 2', mid + 0.3, xb, ly0, ly1, zc - t, zc));
          }
          // baki bawah berbibir 10 cm
          const yb = y1 + L / 2;
          const yr = yb + b + 10;
          boards.push(board('baki-bawah-alas', 'Baki bawah (alas)', xa, xb, yb, yb + b, z0, z1));
          boards.push(board('baki-bawah-depan', 'Baki bawah (bibir depan)', xa, xb, yb + b, yr, z1 - t, z1));
          boards.push(board('baki-bawah-belakang', 'Baki bawah (bibir belakang)', xa, xb, yb + b, yr, z0, z0 + t));
          boards.push(board('baki-bawah-kiri', 'Baki bawah (bibir kiri)', xa, xa + t, yb + b, yr, z0 + t, z1 - t));
          boards.push(board('baki-bawah-kanan', 'Baki bawah (bibir kanan)', xb - t, xb, yb + b, yr, z0 + t, z1 - t));
        }
      }
      const casters = [...wheels, ...casterSet([xr], [zb, zf], inch, brake)];
      return { members: list, boards, casters, W: ox + W, D: D + 2 * oz, H, boardThick: 0 };
    }

    // ---------- Nampan bundar di satu tiang tengah (kaki silang beroda) ----------
    if (m === 'tiang') {
      const col = Math.max(4, L); // tiang tengah minimal 40×40
      const colT: Tube = [col * 10, col * 10];
      const arm: Tube = [20, 20];
      const R = W / 2;
      const span = Math.max(48, Math.round(W * 0.95));
      const S = Math.max(W, span);
      const cx = S / 2;
      const cz = S / 2;
      // kaki silang: kiri-kanan menerus, depan-belakang dipotong dua dan dilas di kedua sisinya
      const yBase = c + col / 2;
      add('alas-x', 'x', cx - span / 2, yBase, cz, span, 'rail-x', 'Kaki silang kiri-kanan', colT);
      add('alas-z-0', 'z', cx, yBase, cz - span / 2, span / 2 - col / 2, 'rail-z', 'Kaki silang belakang', colT);
      add('alas-z-1', 'z', cx, yBase, cz + col / 2, span / 2 - col / 2, 'rail-z', 'Kaki silang depan', colT);
      const topSurface = Math.max(c + col + 30, num(p, 'tinggiRak', 80));
      const handle = bool(p, 'pegangan');
      const hh = handle ? Math.max(topSurface + 12, num(p, 'tinggiPegangan', 97)) : 0;
      const yArmTop = topSurface - b - 1; // as lengan nampan teratas
      const yArmLow = Math.min(yArmTop, c + col + 18);
      const colTop = handle ? hh - 2 : yArmTop + 1;
      add('tiang', 'y', cx, c + col, cz, colTop - c - col, 'post', 'Tiang tengah', colT);
      const a = Math.max(8, R - 4 - col / 2); // panjang lengan dari sisi tiang
      for (let i = 0; i < n; i++) {
        const y = n === 1 ? yArmTop : r1(yArmLow + ((yArmTop - yArmLow) * i) / (n - 1));
        const t = i + 1;
        add(`n${t}-kanan`, 'x', cx + col / 2, y, cz, a, 'rail-x', `Lengan nampan ${t} kanan`, arm);
        add(`n${t}-kiri`, 'x', cx - col / 2 - a, y, cz, a, 'rail-x', `Lengan nampan ${t} kiri`, arm);
        add(`n${t}-depan`, 'z', cx, y, cz + col / 2, a, 'rail-z', `Lengan nampan ${t} depan`, arm);
        add(`n${t}-belakang`, 'z', cx, y, cz - col / 2 - a, a, 'rail-z', `Lengan nampan ${t} belakang`, arm);
        if (b > 0) boards.push({ ...board(`nampan-${t}`, `Nampan bundar ${t}`, cx - R, cx + R, y + 1, y + 1 + b, cz - R, cz + R), shape: 'round' });
      }
      if (handle) add('gagang', 'x', cx - 9, hh - 1, cz, 18, 'rail-x', 'Gagang dorong (pucuk tiang)', arm);
      const e = span / 2 - col / 2;
      const casters: Caster[] = ([[cx - e, cz], [cx + e, cz], [cx, cz - e], [cx, cz + e]] as [number, number][]).map(([x, z], i) => ({ id: `roda-${i}`, x, z, topY: c, sizeInch: inch, brake }));
      return { members: list, boards, casters, W: S, D: S, H: handle ? hh : topSurface, boardThick: 0 };
    }

    // ---------- Rak loyang: bingkai samping + rel nampan rapat (bakery rack) ----------
    if (m === 'nampan') {
      const Ht = Math.max(60, num(p, 'tinggiRangka', 170));
      const xl = L / 2;
      const xr = W - L / 2;
      const zb = L / 2;
      const zf = D - L / 2;
      ([
        [xl, zb, 'kiri belakang'],
        [xr, zb, 'kanan belakang'],
        [xl, zf, 'kiri depan'],
        [xr, zf, 'kanan depan'],
      ] as [number, number, string][]).forEach(([x, z, nm], i) => add(`tiang-${i}`, 'y', x, c, z, Ht - c, 'post', `Tiang ${nm}`, post));
      const yTopR = Ht - L / 2;
      const yBotR = c + L / 2 + 3;
      // bingkai samping kiri & kanan: rel atas & bawah di antara tiang depan dan belakang
      [xl, xr].forEach((x, k) => {
        const nm = k ? 'kanan' : 'kiri';
        add(`samping-${nm}-atas`, 'z', x, yTopR, zb + L / 2, zf - zb - L, 'rail-z', `Bingkai ${nm} atas`, post);
        add(`samping-${nm}-bawah`, 'z', x, yBotR, zb + L / 2, zf - zb - L, 'rail-z', `Bingkai ${nm} bawah`, post);
      });
      // pengikat kiri-kanan: atas depan & belakang, bawah depan & belakang (muka depan tetap terbuka)
      ([
        ['atas-belakang', yTopR, zb, 'Pengikat atas belakang'],
        ['atas-depan', yTopR, zf, 'Pengikat atas depan'],
        ['bawah-belakang', yBotR, zb, 'Pengikat bawah belakang'],
        ['bawah-depan', yBotR, zf, 'Pengikat bawah depan'],
      ] as [string, number, number, string][]).forEach(([id, y, z, label]) => add(id, 'x', xl + L / 2, y, z, xr - xl - L, 'rail-x', label, post));
      // rel nampan: pipa 20×20 dilas di sisi dalam tiang depan & belakang, sepanjang kedalaman
      const gap = Math.min(20, Math.max(6, num(p, 'jarakRel', 10)));
      const yR0 = yBotR + L / 2 + 10;
      const yR1 = yTopR - L / 2 - 6;
      const nr = Math.max(1, Math.floor((yR1 - yR0) / gap) + 1);
      for (let k = 0; k < nr; k++) {
        const y = r1(yR0 + k * gap);
        add(`rel-kiri-${k + 1}`, 'z', xl + L / 2 + 1, y, zb - L / 2, zf - zb + L, 'rail-z', `Rel nampan kiri ${k + 1}`, [20, 20]);
        add(`rel-kanan-${k + 1}`, 'z', xr - L / 2 - 1, y, zb - L / 2, zf - zb + L, 'rail-z', `Rel nampan kanan ${k + 1}`, [20, 20]);
        boards.push({ ...board(`loyang-${k + 1}`, `Loyang / nampan ${k + 1} (lepas)`, xl + L / 2 + 1, xr - L / 2 - 1, y + 1, y + 1.2, zb - L / 2 + 1, zf + L / 2 - 1), steelMm: 1 });
      }
      return { members: list, boards, casters: casterSet([xl, xr], [zb, zf], inch, brake), W, D, H: Ht, boardThick: 0 };
    }

    // ---------- Lantai beroda + rangka A di tengah (troli kaca / papan) ----------
    if (m === 'rangka-a') {
      const xl = L / 2;
      const xr = W - L / 2;
      const zb = L / 2;
      const zf = D - L / 2;
      const zc = D / 2;
      const yd = c + rh / 2;
      const y0 = yd + rh / 2; // atas rangka lantai
      add('lantai-belakang', 'x', 0, yd, zb, W, 'rail-x', 'Rangka lantai belakang', rail);
      add('lantai-depan', 'x', 0, yd, zf, W, 'rail-x', 'Rangka lantai depan', rail);
      const nz = Math.max(2, Math.ceil(W / 45) + 1);
      const xsL: number[] = [];
      for (let k = 0; k < nz; k++) {
        const x = xl + ((xr - xl) * k) / (nz - 1);
        xsL.push(x);
        add(`lantai-lintang-${k + 1}`, 'z', x, yd, zb + rail[0] / 20, zf - zb - rail[0] / 10, 'rail-z', k === 0 || k === nz - 1 ? `Rangka lantai ${k ? 'kanan' : 'kiri'}` : `Palang lantai ${k}`, rail);
      }
      const hA = Math.max(y0 + 60, num(p, 'tinggiRangka', 140));
      const yTopLeg = hA - L; // ujung atas kaki A = bawah pipa bubungan
      const sp = Math.max(8, Math.min(D / 2 - L - 12, (yTopLeg - y0) * Math.tan((8 * Math.PI) / 180)));
      let hz = L / 2;
      for (let k = 0; k < 4; k++) hz = cutHalf([0, y0, zc + sp], [0, yTopLeg, zc + hz], L, 2);
      // rangka A di kedua ujung (+ tengah bila panjang), berdiri di atas palang lantai
      const stations = W > 100 && nz >= 3 ? [xsL[0], xsL[Math.floor((nz - 1) / 2)], xsL[nz - 1]] : [xsL[0], xsL[nz - 1]];
      stations.forEach((x, i) => {
        const nm = i === 0 ? 'kiri' : i === stations.length - 1 ? 'kanan' : 'tengah';
        ([1, -1] as const).forEach((s) => {
          const sn = s > 0 ? 'depan' : 'belakang';
          line(`kaki-a-${nm}-${sn}`, [x, y0, zc + s * sp], [x, yTopLeg, zc + s * hz], 'post', `Kaki A ${nm} sisi ${sn}`, post);
        });
      });
      add('bubungan', 'x', 0, hA - L / 2, zc, W, 'rail-x', 'Pipa bubungan (puncak rangka A)', post);
      // penahan kaki panel di tepi lantai depan & belakang (dilas di atas rangka lantai)
      const lipT: Tube = [20, 40];
      add('penahan-depan', 'x', 0, y0 + 2, zf, W, 'rail-x', 'Penahan kaki panel depan', lipT);
      add('penahan-belakang', 'x', 0, y0 + 2, zb, W, 'rail-x', 'Penahan kaki panel belakang', lipT);
      if (b > 0) {
        boards.push(board('alas-belakang', 'Alas tumpuan panel belakang', 0, W, y0, y0 + b, zb + 1, zc - sp - hz));
        boards.push(board('alas-depan', 'Alas tumpuan panel depan', 0, W, y0, y0 + b, zc + sp + hz, zf - 1));
      }
      return { members: list, boards, casters: casterSet([xl, xr], [zb, zf], inch, brake), W, D, H: hA, boardThick: 0 };
    }

    // ---------- Kaki silang X di kedua ujung + bak menggantung (troli cucian) ----------
    if (m === 'silang') {
      const H = Math.max(c + 50, num(p, 'tinggiRak', 85)); // bibir atas bak = atas rangka
      const yR = H - L / 2;
      const yLeg = H - L;
      let hz = L / 2;
      for (let k = 0; k < 4; k++) hz = cutHalf([0, c, hz], [0, yLeg, D - hz], L, 2);
      const casters: Caster[] = [];
      // tiap ujung: kaki luar & kaki dalam bersebelahan (geser setebal pipa), dilas di titik silang; masing-masing
      // memikul pipa rangka atas sendiri (dua pipa rangka atas berdampingan)
      ([
        [L / 2, 1.5 * L, 'kiri'],
        [W - L / 2, W - 1.5 * L, 'kanan'],
      ] as [number, number, string][]).forEach(([xo, xi, nm], i) => {
        line(`kaki-${nm}-luar`, [xo, c, hz], [xo, yLeg, D - hz], 'post', `Kaki silang ${nm} luar`, post);
        line(`kaki-${nm}-dalam`, [xi, c, D - hz], [xi, yLeg, hz], 'post', `Kaki silang ${nm} dalam`, post);
        add(`atas-${nm}-luar`, 'z', xo, yR, 0, D, 'rail-z', `Rangka atas ${nm} luar`, post);
        add(`atas-${nm}-dalam`, 'z', xi, yR, 0, D, 'rail-z', `Rangka atas ${nm} dalam`, post);
        casters.push({ id: `roda-${i}-0`, x: xo, z: hz, topY: c, sizeInch: inch, brake });
        casters.push({ id: `roda-${i}-1`, x: xi, z: D - hz, topY: c, sizeInch: inch, brake });
      });
      add('atas-depan', 'x', 2 * L, yR, D - L / 2, W - 4 * L, 'rail-x', 'Rangka atas depan', post);
      add('atas-belakang', 'x', 2 * L, yR, L / 2, W - 4 * L, 'rail-x', 'Rangka atas belakang', post);
      // bak: rangka alas digantung 4 batang tegak dari rangka atas depan & belakang
      const depth = Math.min(Math.max(15, num(p, 'dalamBak', 50)), yLeg - c - 20);
      const yB = yR - depth; // as rangka alas bak
      const xe = [2.5 * L, W - 2.5 * L];
      xe.forEach((x, k) => add(`alas-bak-${k ? 'kanan' : 'kiri'}`, 'z', x, yB, 0, D, 'rail-z', `Rangka alas bak ${k ? 'kanan' : 'kiri'}`, post));
      [L / 2, D - L / 2].forEach((z, k) => add(`alas-bak-${k ? 'depan' : 'belakang'}`, 'x', 3 * L, yB, z, W - 6 * L, 'rail-x', `Rangka alas bak ${k ? 'depan' : 'belakang'}`, post));
      xe.forEach((x, i) =>
        [L / 2, D - L / 2].forEach((z, k) => add(`penggantung-${i}-${k}`, 'y', x, yB + L / 2, z, yR - yB - L, 'post', `Batang gantung bak ${i ? 'kanan' : 'kiri'} ${k ? 'depan' : 'belakang'}`, post))
      );
      // palang pengikat kedua kaki dalam, di bawah bak (kaki dalam kiri & kanan sejajar)
      const yp = (c + yB - L / 2) / 2;
      if (yB - L / 2 - c > 14) {
        const zp = D - hz + ((2 * hz - D) * (yp - c)) / (yLeg - c);
        add('palang-kaki', 'x', 2 * L, yp, zp, W - 4 * L, 'rail-x', 'Palang pengikat kaki dalam', [20, 20]);
      }
      if (b > 0) {
        const t = 1.8;
        const yb = yB + L / 2;
        boards.push(board('bak-alas', 'Bak (alas)', 3 * L, W - 3 * L, yb, yb + b, 0, D));
        boards.push(board('bak-depan', 'Bak (dinding depan)', 2 * L, W - 2 * L, yB - L / 2, H, D, D + t));
        boards.push(board('bak-belakang', 'Bak (dinding belakang)', 2 * L, W - 2 * L, yB - L / 2, H, -t, 0));
        boards.push(board('bak-kiri', 'Bak (dinding kiri)', 3 * L, 3 * L + t, yb + b, yR - L / 2, 0, D));
        boards.push(board('bak-kanan', 'Bak (dinding kanan)', W - 3 * L - t, W - 3 * L, yb + b, yR - L / 2, 0, D));
      }
      return { members: list, boards, casters, W, D, H, boardThick: 0 };
    }

    // ---------- Gerobak sorong 1 roda ----------
    if (m === 'sorong') {
      const big = parseInt(str(p, 'rodaGerobak', '14')) || 14;
      const r = (big * 2.54) / 2;
      const grip = 40; // panjang gagang di belakang bak
      const x0 = grip;
      const x1 = grip + W;
      const zb = L / 2;
      const zf = D - L / 2;
      const zc = D / 2;
      const yBm = 2 * r + 5 + L / 2; // as balok gagang
      add('balok-belakang', 'x', 0, yBm, zb, x1, 'rail-x', 'Balok + gagang belakang', post);
      add('balok-depan', 'x', 0, yBm, zf, x1, 'rail-x', 'Balok + gagang depan', post);
      const xw = x1 - Math.max(10, r * 0.5); // as roda
      [x0 + L / 2, (x0 + xw) / 2, xw, x1 - L / 2].forEach((x, k) =>
        add(`lintang-${k + 1}`, 'z', x, yBm, zb + L / 2, zf - zb - L, 'rail-z', k === 2 ? 'Palang dudukan roda' : `Palang alas bak ${k + 1}`, post)
      );
      // garpu roda: dua batang tegak berdiri di atas as, ujung atas dilas di bawah palang dudukan roda
      [zc - 6, zc + 6].forEach((z, k) => add(`garpu-${k}`, 'y', xw, r + 1, z, yBm - L / 2 - r - 1, 'custom', `Garpu roda ${k ? 'depan' : 'belakang'}`, [20, 20]));
      add('as-roda', 'z', xw, r, zc - 9, 18, 'rail-z', 'As roda (besi as Ø20)', [20, 20]);
      // dua kaki belakang + palang
      const xk = x0 + 6;
      [zb, zf].forEach((z, k) => add(`kaki-${k}`, 'y', xk, 0, z, yBm - L / 2, 'post', `Kaki belakang ${k ? 'depan' : 'belakang'}`, post));
      add('palang-kaki', 'z', xk, 14, zb + L / 2, zf - zb - L, 'rail-z', 'Palang kaki belakang', [20, 20]);
      // bak: tiang sudut di atas balok, bibir atas keliling
      const depth = Math.max(10, num(p, 'dalamBak', 25));
      const yb = yBm + L / 2;
      const rim = yb + b + depth;
      const cxs = [x0 + L / 2, x1 - L / 2];
      cxs.forEach((x, i) => [zb, zf].forEach((z, k) => add(`tiang-bak-${i}-${k}`, 'y', x, yb, z, rim - yb, 'post', `Tiang sudut bak ${i ? 'depan' : 'belakang'} ${k ? 'kanan' : 'kiri'}`, post)));
      [zb, zf].forEach((z, k) => add(`bibir-${k ? 'kanan' : 'kiri'}`, 'x', x0 + L, rim - L / 2, z, W - 2 * L, 'rail-x', `Bibir bak ${k ? 'kanan' : 'kiri'}`, post));
      cxs.forEach((x, i) => add(`bibir-${i ? 'depan' : 'belakang'}`, 'z', x, rim - L / 2, zb + L / 2, zf - zb - L, 'rail-z', `Bibir bak ${i ? 'depan' : 'belakang'}`, post));
      if (b > 0) {
        const t = 1.8;
        boards.push(board('bak-alas', 'Bak (alas)', x0 + L, x1 - L, yb, yb + b, 0, D));
        boards.push(board('bak-kiri', 'Bak (dinding kiri)', x0 - t, x1 + t, yb, rim, -t, 0));
        boards.push(board('bak-kanan', 'Bak (dinding kanan)', x0 - t, x1 + t, yb, rim, D, D + t));
        boards.push(board('bak-belakang', 'Bak (dinding belakang)', x0 - t, x0, yb, rim, 0, D));
        boards.push(board('bak-depan', 'Bak (dinding depan)', x1, x1 + t, yb, rim, 0, D));
      }
      const wheel: Caster = { id: 'roda-gerobak', x: xw, z: zc, topY: 2 * r + 1, sizeInch: big, brake: false, axle: 'z' };
      return { members: list, boards, casters: [wheel], W: Math.max(x1 + 2, xw + r), D, H: rim, boardThick: 0 };
    }

    // ---------- Gerobak barang 2 roda (lantai berpagar) ----------
    if (m === 'gerobak-2') {
      const big = parseInt(str(p, 'rodaGerobak', '16')) || 16;
      const r = (big * 2.54) / 2;
      const grip = 35;
      const xa = grip;
      const xb = grip + W;
      const zb = L / 2;
      const zf = D - L / 2;
      const yd = 2 * r + 5 + L / 2; // as balok lantai
      add('balok-belakang', 'x', 0, yd, zb, xb, 'rail-x', 'Balok lantai + gagang belakang', post);
      add('balok-depan', 'x', 0, yd, zf, xb, 'rail-x', 'Balok lantai + gagang depan', post);
      add('pegangan', 'z', L / 2, yd, zb + L / 2, zf - zb - L, 'rail-z', 'Pipa genggam gagang', post);
      const nl = Math.max(3, Math.ceil(W / 40) + 1);
      for (let k = 0; k < nl; k++) {
        const x = xa + L / 2 + ((W - L) * k) / (nl - 1);
        add(`lintang-${k + 1}`, 'z', x, yd, zb + L / 2, zf - zb - L, 'rail-z', `Palang lantai ${k + 1}`, post);
      }
      // roda: as melintang di bawah lantai, dudukan as tegak di bawah balok kiri & kanan, roda di sisi dalam
      const xw = xa + W * 0.62;
      add('as-roda', 'z', xw, r, 0, D, 'rail-z', 'As roda (besi as Ø20)', [20, 20]);
      [zb, zf].forEach((z, k) => add(`dudukan-as-${k}`, 'y', xw, r + 1, z, yd - L / 2 - r - 1, 'custom', `Dudukan as roda ${k ? 'depan' : 'belakang'}`, post));
      const wheels: Caster[] = [L + 4, D - L - 4].map((z, i) => ({ id: `roda-gerobak-${i}`, x: xw, z, topY: 2 * r + 1, sizeInch: big, brake: false, axle: 'z' }));
      // kaki penyangga di sisi gagang
      const xk = xa + 4 + L / 2;
      [zb, zf].forEach((z, k) => add(`kaki-${k}`, 'y', xk, 0, z, yd - L / 2, 'post', `Kaki penyangga ${k ? 'depan' : 'belakang'}`, post));
      add('palang-kaki', 'z', xk, 14, zb + L / 2, zf - zb - L, 'rail-z', 'Palang kaki penyangga', [20, 20]);
      // pagar jeruji rendah di kedua sisi panjang, pipa atas keliling
      const yl = yd + L / 2;
      const hp = Math.max(10, num(p, 'dalamBak', 30));
      const yTop = yl + hp; // bawah pipa atas pagar
      const np = Math.max(2, Math.round(W / 30) + 1);
      [zb, zf].forEach((z, k) => {
        const sn = k ? 'depan' : 'belakang';
        for (let j = 0; j < np; j++) {
          const x = xa + L / 2 + ((W - L) * j) / (np - 1);
          const corner = j === 0 || j === np - 1;
          add(`jeruji-${sn}-${j + 1}`, 'y', x, yl, z, hp, 'post', corner ? `Tiang pagar ${sn} ${j ? 'ujung' : 'pangkal'}` : `Jeruji pagar ${sn} ${j}`, corner ? post : [20, 20]);
        }
        add(`pagar-${sn}`, 'x', xa, yTop + 1, z, W, 'rail-x', `Pipa atas pagar ${sn}`, [20, 20]);
      });
      [xa + L / 2, xb - L / 2].forEach((x, k) => add(`pagar-${k ? 'ujung' : 'pangkal'}`, 'z', x, yTop + 1, zb + 1, zf - zb - 2, 'rail-z', `Pipa atas pagar ${k ? 'ujung' : 'pangkal'}`, [20, 20]));
      if (b > 0) boards.push(board('lantai', 'Papan lantai gerobak', xa, xb, yl, yl + b, zb + L / 2, zf - L / 2));
      return { members: list, boards, casters: wheels, W: xb, D, H: yTop + 2, boardThick: 0 };
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
        // lintang dilas rata di sisi dalam rangka lantai depan & belakang (lebar pipa rangka = rail[0])
        add(`lantai-lintang-${k + 1}`, 'z', x, yd, zb + rail[0] / 20, zf - zb - rail[0] / 10, 'rail-z', k === 0 || k === nz - 1 ? `Rangka lantai ${k ? 'kanan' : 'kiri'}` : `Palang lantai ${k}`, rail);
      }
      if (b > 0) boards.push(board('lantai', 'Papan lantai troli', 0, W, yd + rh / 2, deckTop, L, D - L));
      let H = deckTop;

      if (m === 'platform') {
        const hh = Math.max(deckTop + 40, num(p, 'tinggiPegangan', 90));
        const y0 = yd + rh / 2;
        [zb, zf].forEach((z, i) => {
          const nm = i ? 'depan' : 'belakang';
          add(`pegangan-tegak-${i}`, 'y', xl, y0, z, hh - y0, 'post', `Tiang pegangan ${nm}`, post);
          // siku: ujung atas menempel di sisi tiang, ujung bawah berdiri di atas rangka lantai
          const back = flushBack(30 - L / 2, 32, 2);
          line(`siku-pegangan-${i}`, [xl + L / 2 + back, y0 + 32, z], [xl + 30, y0, z], 'custom', `Siku miring pegangan ${nm}`, [20, 20]);
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
        // Jeruji sebidang dengan pipa pagar: dipotong pendek di antara pipa (bawah → pipa tengah → pipa atas),
        // tiap potong dilas rata di permukaan pipa pagar. Jeruji belakang berdiri di rangka lantai belakang,
        // jeruji samping berdiri di atas papan lantai.
        const hr = 1; // setengah tinggi pipa pagar 20×20
        const jeruji = (id: string, label: string, x: number, z: number, yStart: number) => {
          add(`${id}-bawah`, 'y', x, yStart, z, yMid - hr - yStart, 'post', `${label} bawah`, bar);
          add(`${id}-atas`, 'y', x, yMid + hr, z, yTop - hr - (yMid + hr), 'post', `${label} atas`, bar);
        };
        const gap = 15;
        const nb = Math.max(1, Math.round((W - 2 * L) / gap) - 1);
        for (let k = 1; k <= nb; k++) jeruji(`jeruji-belakang-${k}`, `Jeruji belakang ${k}`, L + ((W - 2 * L) * k) / (nb + 1), zb, y0);
        const ns = Math.max(1, Math.round((D - 2 * L) / gap) - 1);
        for (let k = 1; k <= ns; k++) {
          const z = L + ((D - 2 * L) * k) / (ns + 1);
          jeruji(`jeruji-kiri-${k}`, `Jeruji kiri ${k}`, xl, z, deckTop);
          jeruji(`jeruji-kanan-${k}`, `Jeruji kanan ${k}`, xr, z, deckTop);
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
      // tiang sekat kiri berada tepat di bawah pipa pegangan: bila ada pegangan, sekat dipendekkan
      // supaya ujung tiang sekat menempel rata di sisi bawah pegangan (tidak menembusnya)
      const ht = handle ? Math.min(topSurface + 12, hh - L) : topSurface + 12;
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
          // siku: ujung bawah menempel di sisi luar tiang, ujung atas rata di bawah lengan sayap
          const yS = yArm - Math.max(15, ld * 0.8);
          const back = flushBack(ld * 0.7, yArm - 1 - yS, 2);
          line(`siku-sayap-${nm}-${k}`, [xs + s * back, yS, z], [xs + s * ld * 0.7, yArm - 1, z], 'custom', `Siku sayap ${nm} ${zn}`, [20, 20]);
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
    if (m === 'tiang') {
      const n = Math.max(1, Math.round(num(p, 'tingkat', 3)));
      const top = num(p, 'tinggiRak', 80);
      const low = casterHeight(inch) + 22;
      if (n > 1 && (top - low) / (n - 1) < 18)
        out.push({ level: 'warn', message: 'Jarak antar nampan terlalu rapat, barang tidak muat di nampan bawah.', fix: { label: `${Math.max(1, Math.floor((top - low) / 18) + 1)} susun`, params: { tingkat: Math.max(1, Math.floor((top - low) / 18) + 1) } } });
      if (W > 60) out.push({ level: 'warn', message: 'Nampan lebar di satu tiang: tepi nampan bisa melendut dan troli mudah oleng.', fix: { label: 'Nampan Ø 50 cm', params: { panjang: 50 } } });
      if (top > 2 * Math.max(48, W * 0.95)) out.push({ level: 'warn', message: 'Troli tinggi di atas kaki silang yang kecil: mudah terguling saat didorong.', fix: { label: 'Nampan Ø 50 cm', params: { panjang: 50 } } });
      out.push({ level: 'info', message: 'Tiang tengah pipa 40×40 menembus lubang di tengah tiap nampan; nampan dibaut ke 4 lengan di bawahnya.' });
      if (!bool(p, 'remRoda')) out.push({ level: 'info', message: 'Tanpa rem, troli bisa meluncur di lantai miring.', fix: { label: 'Pakai roda rem', params: { remRoda: true } } });
      return out;
    }
    if (m === 'nampan') {
      const Ht = num(p, 'tinggiRangka', 170);
      if (Ht > 3.6 * Math.min(W, D)) out.push({ level: 'warn', message: 'Rak loyang tinggi tapi alasnya sempit: mudah terguling saat didorong.', fix: { label: `Tinggi ${Math.round(3.4 * Math.min(W, D))} cm`, params: { tinggiRangka: Math.max(60, Math.round(3.4 * Math.min(W, D))) } } });
      if (num(p, 'jarakRel', 10) < 8) out.push({ level: 'info', message: 'Rel rapat (di bawah 8 cm) hanya muat loyang berisi adonan pipih / kue kering.' });
      out.push({ level: 'info', message: 'Rel nampan dari pipa 20×20 dilas di sisi dalam tiang depan & belakang; loyang dimasukkan dari muka depan yang terbuka. Lebar dalam = panjang dikurangi 2 tebal pipa dan 2 rel.' });
      if (!bool(p, 'remRoda')) out.push({ level: 'warn', message: 'Rak loyang tinggi tanpa rem mudah meluncur.', fix: { label: 'Pakai roda rem', params: { remRoda: true } } });
      return out;
    }
    if (m === 'rangka-a') {
      if (D < 55) out.push({ level: 'warn', message: 'Lantai terlalu sempit: kaki panel mudah tergelincir dan troli oleng ke samping.', fix: { label: 'Lebar 70 cm', params: { lebar: 70 } } });
      if (W > 90 && str(p, 'palang') !== '20x40') out.push({ level: 'warn', message: 'Rangka lantai panjang dengan pipa 20×20 bisa melendut di bawah kaca.', fix: { label: 'Pakai pipa 20×40', params: { palang: '20x40' } } });
      out.push({ level: 'info', message: 'Lapisi kaki A dan penahan kaki panel dengan karet. Panel disandarkan bergantian di dua sisi supaya seimbang, lalu diikat tali.' });
      if (!bool(p, 'remRoda')) out.push({ level: 'warn', message: 'Troli kaca tanpa rem berbahaya di lantai miring.', fix: { label: 'Pakai roda rem', params: { remRoda: true } } });
      return out;
    }
    if (m === 'silang') {
      const top = num(p, 'tinggiRak', 85);
      const maxBak = Math.floor(top - casterHeight(inch) - 25);
      if (num(p, 'dalamBak', 50) > maxBak) out.push({ level: 'warn', message: 'Bak terlalu dalam, alasnya hampir menyentuh palang kaki.', fix: { label: `Bak ${maxBak} cm`, params: { dalamBak: Math.max(15, maxBak) } } });
      if (W > 80 && str(p, 'pipa') === '20') out.push({ level: 'warn', message: 'Troli panjang dengan kaki silang 20×20 terasa goyang saat penuh.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
      out.push({ level: 'info', message: 'Kaki luar & dalam dipasang bersebelahan dan dilas di titik silangnya (tidak dilipat). Papan bak bisa diganti kantong kanvas.' });
      if (!bool(p, 'remRoda')) out.push({ level: 'info', message: 'Tanpa rem, troli bisa meluncur di lantai miring.', fix: { label: 'Pakai roda rem', params: { remRoda: true } } });
      return out;
    }
    if (barrow(p)) {
      const big = parseInt(str(p, 'rodaGerobak', '16')) || 16;
      if (m === 'sorong' && W > 75 && str(p, 'pipa') === '20') out.push({ level: 'warn', message: 'Bak besar di atas balok 20×20 bisa melendut saat diisi pasir / tanah.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
      if (m === 'gerobak-2' && W > 110 && big < 16) out.push({ level: 'warn', message: 'Gerobak panjang dengan roda kecil berat didorong di jalan tidak rata.', fix: { label: 'Roda 16"', params: { rodaGerobak: '16' } } });
      if (m === 'gerobak-2' && W > 120 && str(p, 'pipa') === '20') out.push({ level: 'warn', message: 'Balok lantai 20×20 terlalu kecil untuk gerobak sepanjang ini.', fix: { label: 'Pakai pipa 40×40', params: { pipa: '40' } } });
      out.push({
        level: 'info',
        message:
          m === 'sorong'
            ? `Roda ${big}" dipasang di as besi Ø20 di antara dua garpu; saat berhenti gerobak bertumpu di roda dan dua kaki belakang. Ujung balok jadi gagang, beri karet pegangan.`
            : `Dua roda ${big}" di as besi Ø20 di bawah lantai. Roda sedikit di depan tengah lantai supaya gagang terasa ringan saat diangkat; saat berhenti gerobak bertumpu di kaki penyangga.`,
      });
      return out;
    }
    if (bikeCart(p)) {
      const big = parseInt(str(p, 'rodaSepeda', '16')) || 16;
      const dia = Math.round(big * 2.54);
      if (m === 'saji-sepeda' && W < dia * 1.9)
        out.push({ level: 'warn', message: `Ruas kiri terlalu pendek untuk roda ${big}" (Ø ${dia} cm): ban mengenai tiang tengah / kabinet.`, fix: { label: `Panjang ${Math.ceil(dia * 2)} cm`, params: { panjang: Math.min(140, Math.ceil(dia * 2)) } } });
      if (num(p, 'tinggiRak') < dia + 35)
        out.push({ level: 'warn', message: `Rak atas terlalu rendah untuk roda ${big}": baki bawah / laci tidak muat di atas roda.`, fix: { label: `Tinggi ${dia + 40} cm`, params: { tinggiRak: Math.min(110, dia + 40) } } });
      if (W > 110 && str(p, 'pipa') === '20')
        out.push({ level: 'warn', message: 'Gerobak panjang dengan pipa 20×20 mudah goyang saat didorong.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
      out.push({ level: 'info', message: `Roda sepeda ${big}" dipasang di as besi Ø20 dengan ring & pen pengunci; ban menonjol ±7 cm di depan & belakang rangka. Untuk berhenti, roda putar di ujung kanan memakai rem.` });
      if (!bool(p, 'remRoda')) out.push({ level: 'warn', message: 'Tanpa rem, gerobak beroda sepeda mudah meluncur.', fix: { label: 'Pakai roda rem', params: { remRoda: true } } });
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
