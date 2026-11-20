import { Board, Caster, Params, ProductBuild, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, CASTER_OPTIONS, board, bool, casterHeight, casterSet, materialParams, memberFactory, num, r1, str } from './common';

/**
 * Gerobak & meja lapak. Tiap template wajib punya ciri jualan (atap / tiang atap, roda besar + pegangan dorong,
 * papan display miring ke pembeli, atau tritisan). Bentuk rangka (param `model`):
 * - angkringan: 2 roda besar + 2 kaki di ujung pegangan, 4 tiang menerus dari lantai gerobak ke atap datar
 * - etalase: 2 roda besar, badan kotak tertutup berdinding papan, kotak pajang di atas meja, atap menjorok dari 2 tiang belakang
 * - gerobak-pelana: 4 tiang di atas 4 roda putar, papan display miring ke depan, atap pelana, pegangan dorong samping
 * - booth-kotak: 4 tiang setinggi atap, counter hanya di sisi depan (penjual berdiri di dalam), papan nama depan
 * - booth-backdrop: 2 tiang belakang dengan papan promosi tegak + tritisan, counter depan dirangkai rel lantai
 * - bazar-lipat: meja kaki silang X, 2 tiang spanduk di belakang meja dengan tritisan kecil
 * - lapak-miring: kaki depan pendek, tiang belakang tinggi; papan display miring + atap miring menjorok dari tiang belakang
 * - lapak-tembok: tanpa kaki lantai: tiang dibaut ke tembok, meja di siku miring, tritisan miring di atas
 * - lapak-sled: rel lantai (kaki U) di tiap ujung, 2 tiang per ujung menerus ke atap datar, meja + rak di tengah
 * - lapak-payung: satu tiang tengah di plat bundar, meja kotak di tengah tiang, atap kotak di pucuk dengan siku
 * - kanopi-miring: 4 tiang tanpa meja, tiang depan lebih tinggi, atap miring satu arah, siku di pucuk
 * - tenda-pelana: 4 tiang di plat kaki, atap pelana dengan kuda-kuda, meja menempel di tiang depan
 * - kanopi-kantilever: 2 tiang belakang di tapak lantai, kasau menjorok ke depan tanpa tiang depan
 */
type Tube = [number, number];
type V3 = [number, number, number];
/** Jenis permukaan yang ditemui ujung batang miring (lihat brace() di build) */
type End = 'v' | 'h' | 'bebas';

const MODELS = [
  { value: 'angkringan', label: 'Gerobak angkringan', desc: '2 roda besar, 4 tiang ke atap datar' },
  { value: 'etalase', label: 'Gerobak etalase', desc: 'Badan kotak tertutup, atap dari tiang belakang' },
  { value: 'gerobak-pelana', label: 'Gerobak display pelana', desc: '4 roda, papan miring, atap pelana' },
  { value: 'booth-kotak', label: 'Booth kotak', desc: '4 tiang, counter depan, papan nama' },
  { value: 'booth-backdrop', label: 'Booth backdrop', desc: 'Papan promosi tegak + counter depan' },
  { value: 'bazar-lipat', label: 'Meja bazar kaki X', desc: 'Kaki silang + tiang spanduk' },
  { value: 'lapak-miring', label: 'Lapak display miring', desc: 'Papan miring, atap dari tiang belakang' },
  { value: 'lapak-tembok', label: 'Lapak tempel tembok', desc: 'Meja siku + tritisan, dibaut tembok' },
  { value: 'lapak-sled', label: 'Lapak kaki U', desc: 'Rel lantai, tiang ke atap datar' },
  { value: 'lapak-payung', label: 'Lapak tiang tengah', desc: 'Satu tiang, meja + atap kotak' },
  { value: 'kanopi-miring', label: 'Kanopi atap miring', desc: '4 tiang, atap miring satu arah' },
  { value: 'tenda-pelana', label: 'Tenda pelana + meja', desc: 'Atap pelana, meja di tiang depan' },
  { value: 'kanopi-kantilever', label: 'Kanopi menjorok', desc: '2 tiang belakang, tanpa tiang depan' },
];
const IDS = MODELS.map((m) => m.value);
const model = (p: Params) => {
  const m = str(p, 'model', 'angkringan');
  return IDS.includes(m) ? m : 'angkringan';
};
const isM = (p: Params, ...ms: string[]) => ms.includes(model(p));
const ROLL2 = ['angkringan', 'etalase'];
const NO_TABLE = ['kanopi-miring', 'kanopi-kantilever'];
const TRIT = ['angkringan', 'etalase', 'gerobak-pelana', 'booth-kotak', 'booth-backdrop', 'bazar-lipat', 'lapak-miring', 'lapak-tembok', 'lapak-sled', 'kanopi-miring', 'tenda-pelana'];
const SLOPED = ['gerobak-pelana', 'lapak-miring', 'lapak-tembok', 'kanopi-miring', 'tenda-pelana', 'kanopi-kantilever'];
const DISPLAY = ['gerobak-pelana', 'lapak-miring'];
const RAK = ['angkringan', 'gerobak-pelana', 'booth-kotak', 'lapak-sled'];
const NAMA = ['booth-kotak', 'lapak-sled'];
/** Model yang orang berdiri di bawah atapnya: tepi atap terendah wajib cukup tinggi */
const UNDER = ['booth-kotak', 'booth-backdrop', 'bazar-lipat', 'lapak-miring', 'lapak-tembok', 'lapak-sled', 'kanopi-miring', 'tenda-pelana', 'kanopi-kantilever'];
const rad = (d: number) => (d * Math.PI) / 180;

/** Tinggi tepi atap terendah (cm), dihitung dari parameter */
function lowestEdge(p: Params): number {
  const hr = num(p, 'tinggiAtap', 210);
  const D = num(p, 'dalam', 70);
  const tr = TRIT.includes(model(p)) ? num(p, 'tritisan', 0) : 0;
  const t = Math.tan(rad(num(p, 'miringAtap', 15)));
  switch (model(p)) {
    case 'lapak-miring':
    case 'lapak-tembok':
      return hr - 3 - (D + tr) * t;
    case 'kanopi-miring':
      return hr - 3 - (D + tr) * t;
    case 'kanopi-kantilever':
      return hr - 3 - D * t;
    case 'tenda-pelana':
      return hr - 3 - (D / 2 + tr) * t;
    default:
      return hr - 3;
  }
}

export const GEROBAK_LAPAK: ProductDef = {
  id: 'gerobak-lapak',
  name: 'Gerobak & meja lapak',
  tagline: 'angkringan · booth bazar · lapak pasar · tenda warung',
  icon: 'M6 8h48M10 8v24M50 8v24M10 20h40M10 30h40M2 22h8M30 30a4 4 0 1 0 .1 0',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['model', 'panjang', 'dalam', 'tinggiMeja', 'tinggiAtap'] },
    { id: 'bentuk', title: 'Bentuk', keys: ['tritisan', 'miringAtap', 'miringDisplay', 'rakBawah', 'papanNama', 'palang'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Roda', keys: ['rodaBesar', 'ukuranRoda', 'remRoda'] },
  ],
  params: [
    { key: 'model', label: 'Bentuk rangka', type: 'choice', options: MODELS },
    {
      key: 'panjang',
      label: 'Panjang',
      type: 'number',
      unit: 'cm',
      min: 60,
      max: 400,
      step: 1,
      help: 'Gerobak: panjang searah didorong. Lapak tiang tengah: lebar atap. Kanopi & tenda: lebar atap.',
      marks: [{ value: 120, label: 'gerobak' }, { value: 150, label: 'lapak' }, { value: 200, label: 'kanopi' }, { value: 300, label: 'tenda 3 m' }],
    },
    {
      key: 'dalam',
      label: 'Dalam / lebar',
      type: 'number',
      unit: 'cm',
      min: 40,
      max: 300,
      step: 1,
      help: 'Dari belakang ke depan. Booth: termasuk tempat penjual berdiri. Kanopi menjorok: panjang atap ke depan.',
      marks: [{ value: 60, label: 'gerobak' }, { value: 80, label: 'lapak' }, { value: 200, label: 'kanopi' }],
      showIf: (p) => !isM(p, 'lapak-payung'),
    },
    {
      key: 'tinggiMeja',
      label: 'Tinggi meja jualan',
      type: 'number',
      unit: 'cm',
      min: 60,
      max: 110,
      step: 1,
      help: 'Dari lantai sampai permukaan meja / counter.',
      marks: [{ value: 75, label: 'meja lipat' }, { value: 85, label: 'gerobak' }, { value: 100, label: 'counter' }],
      showIf: (p) => !NO_TABLE.includes(model(p)),
    },
    {
      key: 'tinggiAtap',
      label: 'Tinggi atap',
      type: 'number',
      unit: 'cm',
      min: 160,
      max: 260,
      step: 1,
      help: 'Titik atap tertinggi dari lantai. Orang berdiri di bawahnya butuh minimal 185 cm.',
      marks: [{ value: 200, label: 'gerobak' }, { value: 220, label: 'booth' }, { value: 240, label: 'kanopi' }],
    },
    { key: 'tritisan', label: 'Tritisan (atap menjorok)', type: 'number', unit: 'cm', min: 0, max: 60, step: 1, help: 'Atap menjorok melewati rangka supaya pembeli & dagangan teduh.', showIf: (p) => TRIT.includes(model(p)) },
    { key: 'miringAtap', label: 'Kemiringan atap', type: 'number', unit: '°', min: 5, max: 30, step: 1, help: 'Supaya air hujan mengalir. 10–20° sudah cukup.', showIf: (p) => SLOPED.includes(model(p)) },
    { key: 'miringDisplay', label: 'Kemiringan papan display', type: 'number', unit: '°', min: 10, max: 30, step: 1, help: 'Papan dagangan miring ke arah pembeli; lebih dari 25° barang mudah merosot.', showIf: (p) => DISPLAY.includes(model(p)) },
    { key: 'rakBawah', label: 'Rak bawah', type: 'toggle', help: 'Papan di bawah untuk stok, kompor, atau ember.', showIf: (p) => RAK.includes(model(p)) },
    { key: 'papanNama', label: 'Papan nama depan', type: 'toggle', help: 'Papan nama usaha di bawah atap, menghadap pembeli.', showIf: (p) => NAMA.includes(model(p)) },
    { key: 'palang', label: 'Pipa penyangga papan', type: 'choice', options: [{ value: '20x20', label: '20×20 mm', desc: 'Bentang pendek' }, { value: '20x40', label: '20×40 mm', desc: 'Bentang panjang / beban berat' }] },
    ...materialParams(true),
    {
      key: 'rodaBesar',
      label: 'Roda gerobak',
      type: 'choice',
      options: [
        { value: '16', label: 'Roda 16"', desc: 'Gerobak kecil, jalan rata' },
        { value: '20', label: 'Roda 20"', desc: 'Angkringan, jalan kampung' },
        { value: '24', label: 'Roda 24"', desc: 'Gerobak besar, jalan kasar' },
      ],
      showIf: (p) => ROLL2.includes(model(p)),
    },
    { key: 'ukuranRoda', label: 'Ukuran roda putar', type: 'choice', options: CASTER_OPTIONS, showIf: (p) => isM(p, 'gerobak-pelana') },
    { key: 'remRoda', label: 'Roda dengan rem', type: 'toggle', help: 'Gerobak tidak meluncur sendiri saat berjualan.', showIf: (p) => isM(p, 'gerobak-pelana') },
  ],
  defaults: {
    model: 'angkringan',
    panjang: 150,
    dalam: 70,
    tinggiMeja: 85,
    tinggiAtap: 200,
    tritisan: 20,
    miringAtap: 15,
    miringDisplay: 20,
    rakBawah: true,
    papanNama: true,
    palang: '20x20',
    rodaBesar: '20',
    ukuranRoda: '4',
    remRoda: true,
    pipa: '30',
    papan: 'kayu',
    warna: '#1f2226',
  },
  groups: [
    { id: 'gerobak-dorong', name: 'Gerobak dorong', desc: 'Angkringan, bakso, kopi keliling: roda + pegangan + atap' },
    { id: 'booth-bazar', name: 'Booth bazar', desc: 'Booth bongkar pasang tanpa roda untuk event dan bazar' },
    { id: 'meja-lapak', name: 'Meja lapak', desc: 'Meja jualan pasar dengan display miring atau atap' },
    { id: 'warung-tenda', name: 'Warung tenda', desc: 'Rangka kanopi papan di tiang, dengan atau tanpa meja' },
  ],
  signature: (p) => `gerobak-lapak:${model(p)}`,
  presets: [
    {
      id: 'angkringan',
      group: 'gerobak-dorong',
      name: 'Gerobak angkringan',
      desc: '2 roda besar + 2 kaki di ujung pegangan, 4 tiang menerus dari lantai gerobak ke atap datar',
      params: { model: 'angkringan', panjang: 150, dalam: 70, tinggiMeja: 85, tinggiAtap: 200, tritisan: 20, rakBawah: true, rodaBesar: '20', palang: '20x20', pipa: '30' },
      sizes: [
        { label: 'Angkringan', desc: '150 × 70 cm, meja 85, atap 200, roda 20"', params: { panjang: 150, dalam: 70, tinggiMeja: 85, tinggiAtap: 200, rodaBesar: '20' } },
        { label: 'Bakso / mie ayam', desc: '120 × 60 cm, meja 90, atap 195, roda 16"', params: { panjang: 120, dalam: 60, tinggiMeja: 90, tinggiAtap: 195, rodaBesar: '16', tritisan: 15 } },
        { label: 'Gorengan', desc: '100 × 55 cm, meja 85, atap 190, roda 16"', params: { panjang: 100, dalam: 55, tinggiMeja: 85, tinggiAtap: 190, rodaBesar: '16', tritisan: 15 } },
      ],
    },
    {
      id: 'etalase',
      group: 'gerobak-dorong',
      name: 'Gerobak etalase',
      desc: 'badan kotak tertutup berdinding papan, kotak pajang di atas meja, atap menjorok dari 2 tiang belakang',
      params: { model: 'etalase', panjang: 130, dalam: 60, tinggiMeja: 85, tinggiAtap: 195, tritisan: 15, rodaBesar: '16', palang: '20x20', pipa: '30' },
      sizes: [
        { label: 'Bakso / soto', desc: '130 × 60 cm, roda 16"', params: { panjang: 130, dalam: 60, tinggiAtap: 195, rodaBesar: '16' } },
        { label: 'Kopi / es', desc: '110 × 55 cm, roda 16"', params: { panjang: 110, dalam: 55, tinggiAtap: 190, rodaBesar: '16' } },
        { label: 'Martabak / nasi goreng', desc: '150 × 70 cm, roda 20"', params: { panjang: 150, dalam: 70, tinggiAtap: 200, rodaBesar: '20', tritisan: 20 } },
      ],
    },
    {
      id: 'gerobak-pelana',
      group: 'gerobak-dorong',
      name: 'Gerobak display pelana',
      desc: '4 tiang di atas 4 roda putar, papan display miring ke depan, atap pelana, pegangan dorong di samping',
      params: { model: 'gerobak-pelana', panjang: 120, dalam: 70, tinggiMeja: 85, tinggiAtap: 200, tritisan: 10, miringAtap: 20, miringDisplay: 20, rakBawah: true, ukuranRoda: '5', palang: '20x20', pipa: '30' },
      sizes: [
        { label: 'Buah', desc: '120 × 70 cm, roda 5"', params: { panjang: 120, dalam: 70, ukuranRoda: '5' } },
        { label: 'Sayur', desc: '150 × 80 cm, roda 5"', params: { panjang: 150, dalam: 80, palang: '20x40', ukuranRoda: '5', tinggiAtap: 205 } },
        { label: 'Kue / jajan pasar', desc: '100 × 60 cm, roda 4"', params: { panjang: 100, dalam: 60, ukuranRoda: '4', miringDisplay: 15, tinggiAtap: 195 } },
      ],
    },
    {
      id: 'booth-kotak',
      group: 'booth-bazar',
      name: 'Booth kotak',
      desc: '4 tiang setinggi atap, counter hanya di sisi depan sehingga penjual berdiri di dalam, papan nama depan',
      params: { model: 'booth-kotak', panjang: 100, dalam: 100, tinggiMeja: 100, tinggiAtap: 210, tritisan: 15, rakBawah: true, papanNama: true, palang: '20x20', pipa: '30' },
      sizes: [
        { label: 'Booth 1 m', desc: '100 × 100 cm, atap 210', params: { panjang: 100, dalam: 100 } },
        { label: 'Booth 1,5 m', desc: '150 × 100 cm, atap 210', params: { panjang: 150, dalam: 100, palang: '20x40' } },
        { label: 'Booth 2 m', desc: '200 × 120 cm, atap 220', params: { panjang: 200, dalam: 120, tinggiAtap: 220, palang: '20x40', pipa: '40' } },
        { label: 'Booth mini', desc: '80 × 80 cm, atap 205', params: { panjang: 80, dalam: 80, tinggiAtap: 205, tritisan: 10 } },
      ],
    },
    {
      id: 'booth-backdrop',
      group: 'booth-bazar',
      name: 'Booth backdrop',
      desc: '2 tiang belakang dengan papan promosi tegak + tritisan, counter depan dirangkai rel lantai',
      params: { model: 'booth-backdrop', panjang: 120, dalam: 110, tinggiMeja: 100, tinggiAtap: 220, tritisan: 35, palang: '20x20', pipa: '30' },
      sizes: [
        { label: 'Booth 1,2 m', desc: '120 × 110 cm, backdrop 220', params: { panjang: 120, dalam: 110 } },
        { label: 'Booth 1,8 m', desc: '180 × 120 cm, backdrop 230', params: { panjang: 180, dalam: 120, tinggiAtap: 230, palang: '20x40', pipa: '40' } },
        { label: 'Booth 90 cm', desc: '90 × 100 cm, backdrop 210', params: { panjang: 90, dalam: 100, tinggiAtap: 210, tritisan: 30 } },
      ],
    },
    {
      id: 'bazar-lipat',
      group: 'booth-bazar',
      name: 'Meja bazar kaki X + spanduk',
      desc: 'meja kaki silang X, 2 tiang spanduk di belakang meja dengan tritisan kecil di pucuk',
      params: { model: 'bazar-lipat', panjang: 150, dalam: 70, tinggiMeja: 75, tinggiAtap: 200, tritisan: 30, palang: '20x40', pipa: '30' },
      sizes: [
        { label: 'Meja 150', desc: '150 × 70 cm, spanduk 200', params: { panjang: 150, dalam: 70 } },
        { label: 'Meja 180', desc: '180 × 75 cm, spanduk 210', params: { panjang: 180, dalam: 75, tinggiAtap: 210 } },
        { label: 'Meja 120', desc: '120 × 60 cm, spanduk 195', params: { panjang: 120, dalam: 60, tinggiAtap: 195, tritisan: 25, palang: '20x20' } },
      ],
    },
    {
      id: 'lapak-miring',
      group: 'meja-lapak',
      name: 'Lapak display miring',
      desc: 'kaki depan pendek & tiang belakang tinggi: papan display miring ke pembeli, atap miring menjorok dari tiang belakang',
      params: { model: 'lapak-miring', panjang: 150, dalam: 80, tinggiMeja: 80, tinggiAtap: 220, tritisan: 30, miringAtap: 10, miringDisplay: 20, palang: '20x40', pipa: '30' },
      sizes: [
        { label: 'Lapak pasar', desc: '150 × 80 cm, atap 220', params: { panjang: 150, dalam: 80 } },
        { label: 'Lapak besar', desc: '200 × 90 cm, atap 230', params: { panjang: 200, dalam: 90, tinggiAtap: 230, pipa: '40' } },
        { label: 'Lapak kecil', desc: '100 × 70 cm, atap 215', params: { panjang: 100, dalam: 70, tinggiAtap: 215, tritisan: 25, palang: '20x20' } },
      ],
    },
    {
      id: 'lapak-tembok',
      group: 'meja-lapak',
      name: 'Lapak tempel tembok',
      desc: 'tanpa kaki lantai: tiang dibaut ke tembok, meja di atas siku miring, tritisan miring di atasnya',
      params: { model: 'lapak-tembok', panjang: 150, dalam: 50, tinggiMeja: 90, tinggiAtap: 220, tritisan: 30, miringAtap: 10, palang: '20x40', pipa: '30' },
      sizes: [
        { label: 'Depan ruko', desc: '150 × 50 cm, atap 220', params: { panjang: 150, dalam: 50 } },
        { label: 'Jendela warung', desc: '100 × 45 cm, atap 210', params: { panjang: 100, dalam: 45, tinggiAtap: 210, tritisan: 25 } },
        { label: 'Lapak panjang', desc: '200 × 60 cm, atap 230', params: { panjang: 200, dalam: 60, tinggiAtap: 230 } },
      ],
    },
    {
      id: 'lapak-sled',
      group: 'meja-lapak',
      name: 'Lapak kaki U beratap',
      desc: 'rel lantai (kaki U) di tiap ujung, 2 tiang per ujung menerus ke atap datar, meja + rak di tengah',
      params: { model: 'lapak-sled', panjang: 150, dalam: 70, tinggiMeja: 85, tinggiAtap: 210, tritisan: 20, rakBawah: true, papanNama: false, palang: '20x40', pipa: '30' },
      sizes: [
        { label: 'Lapak 150', desc: '150 × 70 cm, atap 210', params: { panjang: 150, dalam: 70 } },
        { label: 'Lapak 120', desc: '120 × 60 cm, atap 205', params: { panjang: 120, dalam: 60, tinggiAtap: 205, palang: '20x20' } },
        { label: 'Lapak 180 + papan nama', desc: '180 × 80 cm, atap 215', params: { panjang: 180, dalam: 80, tinggiAtap: 215, papanNama: true } },
      ],
    },
    {
      id: 'lapak-payung',
      group: 'meja-lapak',
      name: 'Lapak tiang tengah beratap',
      desc: 'satu tiang tengah di plat bundar, meja kotak di tengah tiang, atap kotak di pucuk ditahan siku',
      params: { model: 'lapak-payung', panjang: 150, tinggiMeja: 90, tinggiAtap: 220, palang: '20x20', pipa: '30' },
      sizes: [
        { label: 'Atap 150', desc: 'atap 150 × 150, meja 90 × 90', params: { panjang: 150 } },
        { label: 'Atap 120', desc: 'atap 120 × 120, meja 72 × 72', params: { panjang: 120, tinggiAtap: 210 } },
        { label: 'Atap 180', desc: 'atap 180 × 180, meja 90 × 90', params: { panjang: 180, tinggiAtap: 230 } },
      ],
    },
    {
      id: 'kanopi-miring',
      group: 'warung-tenda',
      name: 'Kanopi atap miring',
      desc: '4 tiang tanpa meja, tiang depan lebih tinggi dari belakang, atap miring satu arah, siku di pucuk tiang',
      params: { model: 'kanopi-miring', panjang: 200, dalam: 200, tinggiAtap: 240, tritisan: 20, miringAtap: 10, palang: '20x40', pipa: '40' },
      sizes: [
        { label: '2 × 2 m', desc: '200 × 200 cm, depan 240', params: { panjang: 200, dalam: 200 } },
        { label: '3 × 2 m', desc: '300 × 200 cm, 6 tiang', params: { panjang: 300, dalam: 200 } },
        { label: '3 × 3 m', desc: '300 × 300 cm, depan 250', params: { panjang: 300, dalam: 300, tinggiAtap: 250 } },
      ],
    },
    {
      id: 'tenda-pelana',
      group: 'warung-tenda',
      name: 'Tenda pelana + meja',
      desc: '4 tiang di plat kaki, atap pelana dengan kuda-kuda, meja jualan menempel di tiang depan',
      params: { model: 'tenda-pelana', panjang: 300, dalam: 200, tinggiMeja: 85, tinggiAtap: 250, tritisan: 20, miringAtap: 20, palang: '20x40', pipa: '40' },
      sizes: [
        { label: '3 × 2 m', desc: '300 × 200 cm, puncak 250', params: { panjang: 300, dalam: 200 } },
        { label: '2 × 2 m', desc: '200 × 200 cm, puncak 245', params: { panjang: 200, dalam: 200, tinggiAtap: 245 } },
        { label: '4 × 3 m', desc: '400 × 300 cm, puncak 255', params: { panjang: 400, dalam: 300, tinggiAtap: 255 } },
      ],
    },
    {
      id: 'kanopi-kantilever',
      group: 'warung-tenda',
      name: 'Kanopi menjorok (tanpa tiang depan)',
      desc: '2 tiang belakang berdiri di tapak lantai, kasau miring menjorok ke depan, depan bebas tanpa tiang',
      params: { model: 'kanopi-kantilever', panjang: 200, dalam: 150, tinggiAtap: 240, miringAtap: 10, palang: '20x40', pipa: '40' },
      sizes: [
        { label: '2 m × 1,5 m', desc: 'lebar 200, menjorok 150', params: { panjang: 200, dalam: 150 } },
        { label: '3 m × 2 m', desc: 'lebar 300, menjorok 200, 3 tiang', params: { panjang: 300, dalam: 200 } },
        { label: '1,5 m × 1,2 m', desc: 'lebar 150, menjorok 120', params: { panjang: 150, dalam: 120, tinggiAtap: 230 } },
      ],
    },
  ],
  summary: (p) => {
    const m = model(p);
    const hr = num(p, 'tinggiAtap');
    if (m === 'lapak-payung') return `atap ${num(p, 'panjang')} × ${num(p, 'panjang')} cm · meja ${num(p, 'tinggiMeja')} · tinggi ${hr} cm`;
    if (NO_TABLE.includes(m)) return `${num(p, 'panjang')} × ${num(p, 'dalam')} cm · atap ${hr} cm`;
    return `${num(p, 'panjang')} × ${num(p, 'dalam')} cm · meja ${num(p, 'tinggiMeja')} · atap ${hr} cm`;
  },

  build: (p) => {
    const m = model(p);
    const L = (parseInt(str(p, 'pipa', '30')) || 30) / 10;
    const pt: Tube = [L * 10, L * 10];
    const rail: Tube = str(p, 'palang') === '20x40' ? [20, 40] : [20, 20];
    const rh = rail[1] / 10;
    const thin: Tube = [20, 20];
    const b = BOARD_THICK[str(p, 'papan', 'kayu')] ?? 2.5;
    const W0 = num(p, 'panjang', 150);
    const D0 = num(p, 'dalam', 70);
    const ht = num(p, 'tinggiMeja', 85);
    const hr = num(p, 'tinggiAtap', 200);
    const tr = num(p, 'tritisan', 0);
    const ta = Math.tan(rad(num(p, 'miringAtap', 15)));
    const td = Math.tan(rad(num(p, 'miringDisplay', 20)));
    const yt = ht - b - rh / 2; // as palang di bawah papan meja
    const ru = (rh / 2) * Math.hypot(1, ta); // jarak tegak as kasau miring ke sisi bawahnya
    const { list, add, line } = memberFactory();
    const boards: Board[] = [];
    const casters: Caster[] = [];
    let wall = false;

    const post = (id: string, label: string, x: number, z: number, y0: number, y1: number, tube: Tube = pt) => add(id, 'y', x, y0, z, y1 - y0, 'post', label, tube);
    /** 4 palang keliling di antara tiang sudut (as tiang di x0/x1, z0/z1) */
    const ring = (id: string, nm: string, x0: number, x1: number, z0: number, z1: number, y: number, tube: Tube = rail, hw = L / 2) => {
      add(`${id}-depan`, 'x', x0 + hw, y, z1, x1 - x0 - 2 * hw, 'rail-x', `${nm} depan`, tube);
      add(`${id}-belakang`, 'x', x0 + hw, y, z0, x1 - x0 - 2 * hw, 'rail-x', `${nm} belakang`, tube);
      add(`${id}-kiri`, 'z', x0, y, z0 + hw, z1 - z0 - 2 * hw, 'rail-z', `${nm} kiri`, tube);
      add(`${id}-kanan`, 'z', x1, y, z0 + hw, z1 - z0 - 2 * hw, 'rail-z', `${nm} kanan`, tube);
    };
    /** Papan datar di atas palang ber-as y */
    const flat = (id: string, label: string, x0: number, x1: number, z0: number, z1: number, y: number, h = rh) => {
      if (b > 0) boards.push(board(id, label, x0, x1, y + h / 2, y + h / 2 + b, z0, z1));
    };
    /** Papan miring di atas batang dari (za, ya) ke (zb, yb), za < zb */
    const slopeBoard = (id: string, label: string, x0: number, x1: number, za: number, ya: number, zb: number, yb: number) => {
      if (b <= 0) return;
      const ang = Math.atan2(ya - yb, zb - za);
      const len = Math.hypot(zb - za, yb - ya);
      const zm = (za + zb) / 2;
      const yc = (ya + yb) / 2 + rh / 2 / Math.cos(ang) + b / 2;
      boards.push({ ...board(id, label, x0, x1, yc - b / 2, yc + b / 2, zm - len / 2, zm + len / 2), rotX: r1((ang * 180) / Math.PI) });
    };
    const plate = (id: string, x: number, z: number) => boards.push({ ...board(id, 'Plat kaki', x - 8, x + 8, 0, 0.6, z - 8, z + 8), steelMm: 6 });
    /** Posisi kolom tiang: tiang tengah otomatis bila bentang > 250 cm */
    const columns = (W: number) => (W > 250 ? [L / 2, W / 2, W - L / 2] : [L / 2, W - L / 2]);
    const colName = (i: number, n: number) => (i === 0 ? 'kiri' : i === n - 1 ? 'kanan' : 'tengah');
    /** Setengah lebar palang (cm): sisi palang yang ditemui ujung batang lain */
    const rw = rail[0] / 20;
    /**
     * Palang sumbu x di antara deretan tiang/batang (as di xs, setengah lebar hw): dipotong per bentang,
     * ujungnya menempel rata di sisi tiang, tidak menembus tiang di tengah.
     */
    const between = (id: string, label: string, xs: number[], y: number, z: number, hw: number, tube: Tube = rail) => {
      const n = xs.length - 1;
      for (let i = 0; i < n; i++)
        add(n > 1 ? `${id}-${i}` : id, 'x', xs[i] + hw, y, z, xs[i + 1] - xs[i] - 2 * hw, 'rail-x', n > 1 ? `${label} (${i + 1})` : label, tube);
    };
    /** Bingkai tanpa tiang sudut: depan/belakang menerus, kiri/kanan dipotong di antaranya (as di x0/x1, z0/z1) */
    const frame = (id: string, nm: string, x0: number, x1: number, z0: number, z1: number, y: number, tube: Tube = rail) => {
      const tw = tube[0] / 20;
      add(`${id}-depan`, 'x', x0 - tw, y, z1, x1 - x0 + 2 * tw, 'rail-x', `${nm} depan`, tube);
      add(`${id}-belakang`, 'x', x0 - tw, y, z0, x1 - x0 + 2 * tw, 'rail-x', `${nm} belakang`, tube);
      add(`${id}-kiri`, 'z', x0, y, z0 + tw, z1 - z0 - 2 * tw, 'rail-z', `${nm} kiri`, tube);
      add(`${id}-kanan`, 'z', x1, y, z0 + tw, z1 - z0 - 2 * tw, 'rail-z', `${nm} kanan`, tube);
    };
    /**
     * Batang miring (siku / kasau / palang display) dari titik a ke b di bidang tegak. Titik a/b = titik singgung
     * di permukaan yang ditemui: 'v' = sisi tegak tiang/palang, 'h' = permukaan datar (atas/bawah batang, lantai);
     * 'bebas' = ujung lepas (tidak menempel apa pun); sa/sb = kemiringan permukaan datar itu (dy/d-run). Batang yang cukup tegak dipotong rata datar, jadi ujung
     * yang menempel di sisi tegak digeser menjauh setebal potongan miringnya supaya sudut potongan tidak masuk ke
     * tiang; batang landai dipotong tegak, jadi ujung di permukaan datar digeser naik/turun. Hasilnya ujung batang
     * menempel rata di permukaan yang ditemui, tidak menembus.
     */
    const brace = (id: string, label: string, a: V3, b: V3, tube: Tube, ea: End, eb: End, role: 'custom' | 'rail-z' | 'rail-x' | 'post' = 'custom', sa = 0, sb = 0) => {
      const half = tube[1] / 20;
      const ri = Math.abs(b[0] - a[0]) > Math.abs(b[2] - a[2]) ? 0 : 2;
      const k0 = (b[1] - a[1]) / (b[ri] - a[ri] || 1); // kemiringan as semula
      const r1v = (v: number) => Math.round(v * 10) / 10; // pembulatan sama seperti memberFromPoints
      const isSteep = (p: V3, q: V3) => {
        const dr = r1v(q[ri]) - r1v(p[ri]);
        const dy = r1v(q[1]) - r1v(p[1]);
        return Math.abs(dy) / (Math.hypot(dr, dy) || 1) >= 0.35;
      };
      /** posisi ujung bila batang dianggap dipotong datar (steep) atau tegak */
      const solve = (steep: boolean): [V3, V3] => {
        const p: V3 = [...a];
        const q: V3 = [...b];
        for (let k = 0; k < 8; k++) {
          const dr = q[ri] - p[ri];
          const dy = q[1] - p[1];
          const len = Math.hypot(dr, dy) || 1;
          const uy = Math.abs(dy) / len || 1e-6;
          const ur = Math.abs(dr) / len || 1e-6;
          const sr = Math.sign(dr);
          const sy = Math.sign(dy);
          // ujung di sisi tegak digeser menyusur garis as semula (kemiringan batang tetap)
          if (ea === 'v') {
            const d = steep ? (sr * half) / uy : 0;
            p[ri] = a[ri] + d;
            p[1] = a[1] + d * k0;
          } else if (ea === 'h') p[1] = a[1] + sy * (steep ? (half / uy) * Math.abs(sa) : half / ur);
          if (eb === 'v') {
            const d = steep ? (sr * half) / uy : 0;
            q[ri] = b[ri] - d;
            q[1] = b[1] - d * k0;
          } else if (eb === 'h') q[1] = b[1] - sy * (steep ? (half / uy) * Math.abs(sb) : half / ur);
        }
        return [p, q];
      };
      // pakai anggapan potongan yang cocok dengan potongan akhir batang (di sekitar batas 0,35 bisa berbalik)
      const guess = isSteep(a, b);
      let [p, q] = solve(guess);
      if (isSteep(p, q) !== guess) {
        const alt = solve(!guess);
        if (isSteep(alt[0], alt[1]) === !guess) [p, q] = alt;
      }
      line(id, p, q, role, label, tube);
    };

    // ---------- Gerobak 2 roda besar (panjang searah dorong = sumbu z) ----------
    if (m === 'angkringan' || m === 'etalase') {
      const gw = D0;
      const gl = W0;
      const inch = parseInt(str(p, 'rodaBesar', '20')) || 20;
      const r = (inch * 2.54) / 2;
      const xl = L / 2;
      const xr = gw - L / 2;
      const zb = L / 2;
      const zf = gl - L / 2;
      const yd = r + 6; // as rangka lantai gerobak
      const yr = hr - b - rh / 2; // as rangka atap
      const zw = gl * 0.62; // as roda
      const xs = [xl, xr];
      if (m === 'angkringan') {
        xs.forEach((x, i) => {
          const nm = i ? 'kanan' : 'kiri';
          post(`tiang-belakang-${i}`, `Tiang ${nm} belakang (kaki)`, x, zb, 0, yr + rh / 2);
          post(`tiang-depan-${i}`, `Tiang ${nm} depan`, x, zf, yd - rh / 2, yr + rh / 2);
        });
        ring('lantai', 'Rangka lantai gerobak', xl, xr, zb, zf, yd);
        ring('meja', 'Rangka meja', xl, xr, zb, zf, yt);
        ring('atap', 'Rangka atap', xl, xr, zb, zf, yr);
        if (gl > 100) {
          // di antara rangka kiri & kanan: ujung menempel di sisi palang samping
          add('meja-tengah', 'x', xl + rw, yt, gl / 2, xr - xl - 2 * rw, 'rail-x', 'Palang tengah meja', rail);
          add('lantai-tengah', 'x', xl + rw, yd, gl / 2, xr - xl - 2 * rw, 'rail-x', 'Palang tengah lantai', rail);
          add('atap-tengah', 'x', xl + rw, yr, gl / 2, xr - xl - 2 * rw, 'rail-x', 'Palang tengah atap', rail);
        }
        flat('meja', 'Papan meja jualan', 0, gw, 0, gl, yt);
        if (bool(p, 'rakBawah')) flat('lantai', 'Papan rak bawah', 0, gw, 0, gl, yd);
        flat('atap', 'Papan atap', -5, gw + 5, -5, gl + tr, yr);
      } else {
        // badan kotak tertutup
        xs.forEach((x, i) => {
          const nm = i ? 'kanan' : 'kiri';
          post(`tiang-belakang-${i}`, `Tiang atap ${nm} belakang (kaki)`, x, zb, 0, yr + rh / 2);
          post(`tiang-depan-${i}`, `Tiang badan ${nm} depan`, x, zf, yd - rh / 2, yt + rh / 2);
          post(`tiang-tengah-${i}`, `Tiang tengah dinding ${nm}`, x, gl / 2, yd + rh / 2, yt - rh / 2, thin);
        });
        ring('lantai', 'Rangka lantai gerobak', xl, xr, zb, zf, yd);
        ring('meja', 'Rangka meja', xl, xr, zb, zf, yt);
        flat('meja', 'Papan meja jualan', 0, gw, 0, gl, yt);
        flat('lantai', 'Papan lantai badan', 0, gw, 0, gl, yd);
        if (b > 0) {
          boards.push(board('dinding-kiri', 'Papan dinding kiri', -b, 0, yd - rh / 2, yt + rh / 2, 0, gl));
          boards.push(board('dinding-kanan', 'Papan dinding kanan', gw, gw + b, yd - rh / 2, yt + rh / 2, 0, gl));
          boards.push(board('dinding-depan', 'Papan dinding depan', 0, gw, yd - rh / 2, yt + rh / 2, gl, gl + b));
        }
        // kotak pajang (etalase) di atas meja
        const ex0 = 3;
        const ex1 = gw - 3;
        const ez0 = gl * 0.4;
        const ez1 = gl - 3;
        const top = ht + 40;
        ([[ex0, ez0], [ex1, ez0], [ex0, ez1], [ex1, ez1]] as [number, number][]).forEach(([x, z], k) =>
          post(`etalase-tiang-${k}`, `Tiang kotak pajang ${k + 1}`, x, z, ht, top, thin)
        );
        ring('etalase', 'Bingkai atas kotak pajang', ex0, ex1, ez0, ez1, top - 1, thin, 1);
        if (b > 0) boards.push(board('etalase-atas', 'Papan atas kotak pajang', ex0 - 1, ex1 + 1, top, top + b, ez0 - 1, ez1 + 1));
        // atap menjorok dari 2 tiang belakang
        const rl = gl * 0.8 + tr;
        xs.forEach((x, i) => {
          const nm = i ? 'kanan' : 'kiri';
          add(`kasau-${i}`, 'z', x, yr, L, rl, 'rail-z', `Kasau atap ${nm}`, rail);
          brace(`siku-atap-${i}`, `Siku atap ${nm}`, [x, yr - 45, zb + L / 2], [x, yr - rh / 2, zb + 45], thin, 'v', 'h');
        });
        between('atap-belakang', 'Palang atap belakang', xs, yr, zb, L / 2);
        add('atap-depan', 'x', xl + 1, yr, L + rl - 1, gw - L - 2, 'rail-x', 'Palang atap depan', rail);
        add('atap-tengah', 'x', xl + 1, yr, L + rl / 2, gw - L - 2, 'rail-x', 'Palang atap tengah', rail);
        flat('atap', 'Papan atap', -5, gw + 5, 0, L + rl, yr);
      }
      // as roda, dudukan, pegangan
      add('as-roda', 'x', -6, r, zw, gw + 12, 'rail-x', 'As roda (besi as Ø20)', [20, 20]);
      xs.forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        // duduk di atas as roda, ujung atas menempel di bawah rangka lantai
        add(`dudukan-as-${i}`, 'y', x, r + 1, zw, yd - rh / 2 - r - 1, 'custom', `Dudukan as roda ${nm}`, [20, 20]);
      });
      const yh = ht - 10;
      // gagang dari sisi tiang belakang ke sisi pegangan (tidak masuk ke pegangan)
      xs.forEach((x, i) => add(`gagang-${i}`, 'z', x, yh, -40 + L / 2, 40 - L / 2, 'rail-z', `Gagang dorong ${i ? 'kanan' : 'kiri'}`, pt));
      add('pegangan', 'x', 0, yh, -40, gw, 'rail-x', 'Pegangan dorong', pt);
      [-5, gw + 5].forEach((x, i) => casters.push({ id: `roda-besar-${i}`, x, z: zw, topY: 2 * r + 1, sizeInch: inch, brake: false }));
    }

    // ---------- Gerobak display pelana (4 roda putar) ----------
    else if (m === 'gerobak-pelana') {
      const W = W0;
      const D = D0;
      const inch = parseInt(str(p, 'ukuranRoda', '4')) || 4;
      const c = casterHeight(inch);
      const xl = L / 2;
      const xr = W - L / 2;
      const zb = L / 2;
      const zf = D - L / 2;
      const yd = c + rh / 2;
      const yR = hr - b - rh / 2;
      const yE = yR - (D / 2 - zb) * ta;
      [xl, xr].forEach((x, i) =>
        [zb, zf].forEach((z, k) => post(`tiang-${i}-${k}`, `Tiang ${i ? 'kanan' : 'kiri'} ${k ? 'depan' : 'belakang'}`, x, z, c, yE + rh / 2))
      );
      ring('lantai', 'Rangka lantai', xl, xr, zb, zf, yd);
      ring('tepi-atap', 'Rangka tepi atap', xl, xr, zb, zf, yE);
      const ylo = yt;
      const yhi = Math.min(ylo + (zf - zb) * td, yE - 20);
      /** tinggi as bidang display di titik z (garis lurus dari palang belakang ke palang depan) */
      const yDs = (z: number) => ylo + ((zf - z) / (zf - zb)) * (yhi - ylo);
      between('display-depan', 'Palang display depan', [xl, xr], ylo, zf, L / 2);
      between('display-belakang', 'Palang display belakang', [xl, xr], yhi, zb, L / 2);
      [xl, xr].forEach((x, i) =>
        brace(`display-miring-${i}`, `Palang display miring ${i ? 'kanan' : 'kiri'}`, [x, yDs(zb + L / 2), zb + L / 2], [x, yDs(zf - L / 2), zf - L / 2], rail, 'v', 'v', 'rail-z')
      );
      if (W > 120) brace('display-tengah', 'Penyangga tengah display', [W / 2, yDs(zb + rw), zb + rw], [W / 2, yDs(zf - rw), zf - rw], thin, 'v', 'v');
      slopeBoard('display', 'Papan display miring', 0, W, zb, yhi, zf, ylo);
      between('bibir', 'Bibir penahan barang', [xl, xr], ylo + rh / 2 + b + 4, zf, L / 2, [15, 15]);
      if (bool(p, 'rakBawah')) flat('lantai', 'Papan rak bawah', 0, W, 0, D, yd);
      // Kuda-kuda dilas menempel di sisi dalam tiang (geser setebal pipa dari as tiang supaya tidak bersilang
      // dengan rangka tepi atap samping): ujung bawah rata di muka palang tepi depan/belakang, ujung atas rata
      // di muka bubungan. Bubungan di antara sisi luar kuda-kuda.
      const yK = (z: number) => yE + (Math.min(z, D - z) - zb) * ta;
      [xl + L / 2 + rw, xr - L / 2 - rw].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        brace(`kuda-b-${i}`, `Kuda-kuda ${nm} belakang`, [x, yK(zb + rw), zb + rw], [x, yK(D / 2 - rw), D / 2 - rw], rail, 'v', 'v');
        brace(`kuda-d-${i}`, `Kuda-kuda ${nm} depan`, [x, yK(zf - rw), zf - rw], [x, yK(D / 2 + rw), D / 2 + rw], rail, 'v', 'v');
      });
      add('bubungan', 'x', xl + L / 2, yR, D / 2, xr - xl - L, 'rail-x', 'Bubungan atap', rail);
      slopeBoard('atap-belakang', 'Papan atap belakang', -5, W + 5, zb - tr, yE - tr * ta, D / 2, yR);
      slopeBoard('atap-depan', 'Papan atap depan', -5, W + 5, D / 2, yR, zf + tr, yE - tr * ta);
      const yh = Math.min(ht + 12, yE - 10);
      // gagang dari sisi tiang ke sisi pegangan; pegangan menerus menutup kedua ujung gagang
      [zb, zf].forEach((z, k) => add(`gagang-${k}`, 'x', -28 + L / 2, yh, z, 28 - L / 2, 'rail-x', `Gagang dorong ${k ? 'depan' : 'belakang'}`, pt));
      add('pegangan', 'z', -28, yh, zb - L / 2, zf - zb + L, 'rail-z', 'Pegangan dorong', pt);
      casters.push(...casterSet([xl, xr], [zb, zf], inch, bool(p, 'remRoda')));
    }

    // ---------- Booth kotak ----------
    else if (m === 'booth-kotak') {
      const W = W0;
      const D = D0;
      const xl = L / 2;
      const xr = W - L / 2;
      const zb = L / 2;
      const zf = D - L / 2;
      const yr = hr - b - rh / 2;
      [xl, xr].forEach((x, i) =>
        [zb, zf].forEach((z, k) => post(`tiang-${i}-${k}`, `Tiang ${i ? 'kanan' : 'kiri'} ${k ? 'depan' : 'belakang'}`, x, z, 0, yr + rh / 2))
      );
      const zc = D - Math.min(55, D * 0.5);
      // kaki belakang counter berdiri di atas palang bawah samping (bukan menembusnya)
      [xl, xr].forEach((x, i) => post(`kaki-counter-${i}`, `Kaki belakang counter ${i ? 'kanan' : 'kiri'}`, x, zc, 10 + rh / 2, yt + rh / 2));
      ring('counter', 'Rangka counter', xl, xr, zc, zf, yt);
      flat('counter', 'Papan counter', 0, W, zc - L / 2, D + 3, yt);
      if (b > 0) boards.push(board('panel-depan', 'Papan penutup depan counter', 0, W, 8, yt + rh / 2, D, D + b));
      ring('bawah', 'Palang bawah', xl, xr, zb, zf, 10);
      if (bool(p, 'rakBawah')) flat('rak-bawah', 'Papan rak bawah counter', 0, W, zc - L / 2, zf - L / 2, 10);
      ring('atap', 'Rangka atap', xl, xr, zb, zf, yr);
      flat('atap', 'Papan atap', -5, W + 5, -5, D + tr, yr);
      if (bool(p, 'papanNama')) {
        between('papan-nama-bawah', 'Palang bawah papan nama', [xl, xr], yr - 32, zf, L / 2);
        if (b > 0) boards.push(board('papan-nama', 'Papan nama usaha', 0, W, yr - 32 - rh / 2, yr + rh / 2, D, D + b));
      }
    }

    // ---------- Booth backdrop ----------
    else if (m === 'booth-backdrop') {
      const W = W0;
      const D = D0;
      const xl = L / 2;
      const xr = W - L / 2;
      const zb = L / 2;
      const zf = D - L / 2;
      const hb = hr - b;
      const zc = D - Math.min(50, D * 0.45);
      [xl, xr].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        post(`tiang-backdrop-${i}`, `Tiang backdrop ${nm}`, x, zb, 0, hb);
        add(`rel-lantai-${i}`, 'z', x, rh / 2, L, D - L, 'rail-z', `Rel lantai ${nm}`, rail);
        post(`kaki-counter-depan-${i}`, `Kaki counter ${nm} depan`, x, zf, rh, yt + rh / 2);
        post(`kaki-counter-belakang-${i}`, `Kaki counter ${nm} belakang`, x, zc, rh, yt + rh / 2);
      });
      add('rel-depan', 'x', xl + 1, rh / 2, zf, W - L - 2, 'rail-x', 'Rel lantai depan', rail);
      ring('counter', 'Rangka counter', xl, xr, zc, zf, yt);
      flat('counter', 'Papan counter', 0, W, zc - L / 2, D + 3, yt);
      if (b > 0) boards.push(board('panel-depan', 'Papan penutup depan counter', 0, W, rh, yt + rh / 2, D, D + b));
      const yTop = hb - rh / 2;
      [15, (15 + yTop) / 2, yTop].forEach((y, k) =>
        between(`backdrop-${k}`, `Palang backdrop ${['bawah', 'tengah', 'atas'][k]}`, [xl, xr], y, zb, L / 2)
      );
      if (b > 0) boards.push(board('backdrop', 'Papan backdrop / promosi', xl + L / 2, xr - L / 2, 15 - rh / 2, hb, zb + 1, zb + 1 + b));
      const arm = Math.max(30, tr);
      [xl, xr].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        add(`lengan-tritisan-${i}`, 'z', x, yTop, L, arm, 'rail-z', `Lengan tritisan ${nm}`, rail);
        brace(`siku-tritisan-${i}`, `Siku tritisan ${nm}`, [x, hb - 35, zb + L / 2], [x, yTop - rh / 2, L + arm * 0.7], thin, 'v', 'h');
      });
      add('tritisan-depan', 'x', xl + 1, yTop, L + arm - 1, xr - xl - 2, 'rail-x', 'Palang depan tritisan', rail);
      if (b > 0) boards.push(board('tritisan', 'Papan tritisan', -3, W + 3, hb, hb + b, 0, L + arm));
    }

    // ---------- Meja bazar kaki X + tiang spanduk ----------
    else if (m === 'bazar-lipat') {
      const W = W0;
      const D = D0;
      const xl = L / 2;
      const xr = W - L / 2;
      const zb = L / 2;
      const zf = D - L / 2;
      frame('meja', 'Rangka meja', xl, xr, zb, zf, yt);
      // Kaki X lipat: kedua kaki bersebelahan (kaki 2 di sisi dalam kaki 1, dibaut di tengah), tidak bersilang
      // di bidang yang sama. Ujung bawah rata lantai, ujung atas rata di bawah rangka meja, tidak menonjol
      // keluar dari muka depan / belakang rangka.
      const zlo = zb - rw;
      const zhi = zf + rw;
      [xl, xr].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        const xi = i ? x - L : x + L;
        brace(`kaki-x-${i}-a`, `Kaki silang ${nm} 1`, [x, 1, zlo], [x, yt - rh / 2, zhi], pt, 'v', 'v', 'post');
        brace(`kaki-x-${i}-b`, `Kaki silang ${nm} 2`, [xi, 1, zhi], [xi, yt - rh / 2, zlo], pt, 'v', 'v', 'post');
      });
      // palang tengah di antara kaki dalam, ujungnya menempel di sisi kaki 2 tepat di titik silang
      add('palang-silang', 'x', xl + 1.5 * L, (1 + yt - rh / 2) / 2, D / 2, xr - xl - 3 * L, 'rail-x', 'Palang tengah kaki silang', rail);
      flat('meja', 'Papan meja', 0, W, 0, D, yt);
      const hp = hr - b;
      const zs = zb - L / 2 - 1;
      [xl, xr].forEach((x, i) => post(`tiang-spanduk-${i}`, `Tiang spanduk ${i ? 'kanan' : 'kiri'}`, x, zs, 0, hp));
      between('spanduk-atas', 'Palang atas spanduk', [xl, xr], hp - rh / 2, zs, L / 2);
      between('spanduk-bawah', 'Palang bawah spanduk', [xl, xr], hp - 60, zs, L / 2);
      if (b > 0) boards.push(board('spanduk', 'Papan nama / spanduk', xl + L / 2, xr - L / 2, hp - 60 - rh / 2, hp, zs + 1, zs + 1 + b));
      const arm = Math.max(25, tr);
      [xl, xr].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        add(`lengan-tritisan-${i}`, 'z', x, hp - rh / 2, zs + L / 2, arm, 'rail-z', `Lengan tritisan ${nm}`, rail);
        brace(`siku-tritisan-${i}`, `Siku tritisan ${nm}`, [x, hp - 30, zs + L / 2], [x, hp - rh, zs + L / 2 + arm * 0.7], thin, 'v', 'h');
      });
      add('tritisan-depan', 'x', xl + 1, hp - rh / 2, zs + L / 2 + arm - 1, xr - xl - 2, 'rail-x', 'Palang depan tritisan', rail);
      if (b > 0) boards.push(board('tritisan', 'Papan tritisan', -3, W + 3, hp, hp + b, zs - L / 2, zs + L / 2 + arm));
    }

    // ---------- Lapak display miring ----------
    else if (m === 'lapak-miring') {
      const W = W0;
      const D = D0;
      const xl = L / 2;
      const xr = W - L / 2;
      const zb = L / 2;
      const zf = D - L / 2;
      const ylo = yt;
      const yhi = ylo + (zf - zb) * td;
      const yP = hr - b;
      const yA = yP - rh / 2;
      /** tinggi as bidang display di titik z */
      const yDs = (z: number) => ylo + ((zf - z) / (zf - zb)) * (yhi - ylo);
      [xl, xr].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        post(`tiang-belakang-${i}`, `Tiang belakang ${nm}`, x, zb, 0, yP);
        // kaki depan naik sampai bibir penahan supaya bibir dilas di antara kedua kaki (tidak melayang)
        post(`kaki-depan-${i}`, `Kaki depan ${nm}`, x, zf, 0, ylo + rh / 2 + b + 4 + 0.75);
        brace(`display-miring-${i}`, `Palang display miring ${nm}`, [x, yDs(zb + L / 2), zb + L / 2], [x, yDs(zf - L / 2), zf - L / 2], rail, 'v', 'v', 'rail-z');
        add(`palang-bawah-${i}`, 'z', x, 15, zb + L / 2, zf - zb - L, 'rail-z', `Palang bawah ${nm}`, rail);
      });
      add('palang-bawah-tengah', 'x', xl + rw, 15, D / 2, xr - xl - 2 * rw, 'rail-x', 'Palang bawah tengah (H)', rail);
      between('display-depan', 'Palang display depan', [xl, xr], ylo, zf, L / 2);
      between('display-belakang', 'Palang display belakang', [xl, xr], yhi, zb, L / 2);
      if (W > 120) brace('display-tengah', 'Penyangga tengah display', [W / 2, yDs(zb + rw), zb + rw], [W / 2, yDs(zf - rw), zf - rw], thin, 'v', 'v');
      slopeBoard('display', 'Papan display miring', 0, W, zb, yhi, zf, ylo);
      between('bibir', 'Bibir penahan barang', [xl, xr], ylo + rh / 2 + b + 4, zf, L / 2, [15, 15]);
      const zEnd = D + tr;
      const z0 = zb + L / 2;
      const yEnd = yA - (zEnd - z0) * ta;
      [xl, xr].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        brace(`kasau-${i}`, `Kasau atap ${nm}`, [x, yA, z0], [x, yEnd, zEnd], rail, 'v', 'bebas', 'rail-z');
        const zq = z0 + 0.4 * (zEnd - z0);
        brace(`siku-atap-${i}`, `Siku atap ${nm}`, [x, yA - 45, z0], [x, yA - 0.4 * (yA - yEnd) - ru, zq], thin, 'v', 'h', 'custom', 0, ta);
      });
      between('atap-belakang', 'Palang atap belakang', [xl, xr], yA, zb, L / 2);
      add('atap-depan', 'x', xl + 1, yEnd, zEnd - 1, W - L - 2, 'rail-x', 'Palang atap depan', rail);
      slopeBoard('atap', 'Papan atap', -5, W + 5, zb, yA, zEnd, yEnd);
    }

    // ---------- Lapak tempel tembok ----------
    else if (m === 'lapak-tembok') {
      const W = W0;
      const D = D0;
      wall = true;
      const xl = L / 2;
      const xr = W - L / 2;
      const zw = L / 2;
      const yP = hr - b;
      const yA = yP - rh / 2;
      const y0 = yt - 45;
      const xs = W > 130 ? [xl, W / 2, xr] : [xl, xr];
      const zEnd = D + tr;
      const yEnd = yA - (zEnd - L) * ta;
      xs.forEach((x, i) => {
        const nm = colName(i, xs.length);
        post(`tiang-tembok-${i}`, `Tiang tembok ${nm} (dibaut)`, x, zw, y0, yP);
        add(`lengan-meja-${i}`, 'z', x, yt, L, D - L, 'rail-z', `Lengan meja ${nm}`, rail);
        brace(`siku-meja-${i}`, `Siku meja ${nm}`, [x, y0 + 3, L], [x, yt - rh / 2, L + (D - L) * 0.7], thin, 'v', 'h');
        brace(`kasau-${i}`, `Kasau tritisan ${nm}`, [x, yA, L], [x, yEnd, zEnd], rail, 'v', 'bebas', 'rail-z');
        const zq = L + 0.5 * (zEnd - L);
        brace(`siku-atap-${i}`, `Siku tritisan ${nm}`, [x, yA - 40, L], [x, yA - 0.5 * (yA - yEnd) - ru, zq], thin, 'v', 'h', 'custom', 0, ta);
      });
      // palang memanjang dipotong per bentang di antara tiang / lengan / kasau
      between('meja-depan', 'Palang meja depan', xs, yt, D - rw, rw);
      between('rel-tembok-meja', 'Rel tembok meja', xs, yt, zw, L / 2);
      between('rel-tembok-atas', 'Rel tembok atas', xs, yA, zw, L / 2);
      between('atap-depan', 'Palang tritisan depan', xs, yEnd, zEnd - rw, rw);
      flat('meja', 'Papan meja', 0, W, L, D, yt);
      slopeBoard('atap', 'Papan tritisan', -5, W + 5, 0, yA, zEnd, yEnd);
    }

    // ---------- Lapak kaki U (rel lantai) beratap ----------
    else if (m === 'lapak-sled') {
      const W = W0;
      const D = D0;
      const xl = L / 2;
      const xr = W - L / 2;
      const zb = L / 2;
      const zf = D - L / 2;
      const yr = hr - b - rh / 2;
      [xl, xr].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        add(`rel-lantai-${i}`, 'z', x, L / 2, -10, D + 20, 'rail-z', `Rel lantai ${nm} (kaki U)`, pt);
        post(`tiang-${i}-0`, `Tiang ${nm} belakang`, x, zb, L, yr + rh / 2);
        post(`tiang-${i}-1`, `Tiang ${nm} depan`, x, zf, L, yr + rh / 2);
      });
      ring('meja', 'Rangka meja', xl, xr, zb, zf, yt);
      flat('meja', 'Papan meja', 0, W, 0, D, yt);
      if (bool(p, 'rakBawah')) {
        ring('rak', 'Rangka rak bawah', xl, xr, zb, zf, 30);
        flat('rak', 'Papan rak bawah', 0, W, 0, D, 30);
      }
      ring('atap', 'Rangka atap', xl, xr, zb, zf, yr);
      flat('atap', 'Papan atap', -5, W + 5, -tr, D + tr, yr);
      if (bool(p, 'papanNama')) {
        between('papan-nama-bawah', 'Palang bawah papan nama', [xl, xr], yr - 32, zf, L / 2);
        if (b > 0) boards.push(board('papan-nama', 'Papan nama usaha', 0, W, yr - 32 - rh / 2, yr + rh / 2, D, D + b));
      }
    }

    // ---------- Lapak tiang tengah ----------
    else if (m === 'lapak-payung') {
      const S = W0;
      const T = Math.min(90, Math.round(S * 0.6));
      const R = S - 4;
      const yR = hr - b - rh / 2;
      boards.push({ ...board('plat-dasar', 'Plat dasar bundar', -35, 35, 0, 0.8, -35, 35), shape: 'round', steelMm: 8 });
      add('tiang', 'y', 0, 0.8, 0, yR + rh / 2 - 0.8, 'post', 'Tiang tengah 40×40', [40, 40]);
      const tp = 2; // setengah lebar tiang 40×40
      const level = (id: string, nm: string, y: number, side: number, braceDrop: number) => {
        // Lengan dipotong di tiang: tiap potong dari sisi tiang ke sisi dalam bingkai (tidak menembus tiang,
        // tidak bersilang satu sama lain). Bingkai: depan/belakang menerus, kiri/kanan di antaranya.
        const h = side / 2;
        add(`${id}-lengan-x`, 'x', -h + rw, y, 0, h - rw - tp, 'rail-x', `Lengan ${nm} kiri`, rail);
        add(`${id}-lengan-x2`, 'x', tp, y, 0, h - rw - tp, 'rail-x', `Lengan ${nm} kanan`, rail);
        add(`${id}-lengan-z`, 'z', 0, y, -h + rw, h - rw - tp, 'rail-z', `Lengan ${nm} belakang`, rail);
        add(`${id}-lengan-z2`, 'z', 0, y, tp, h - rw - tp, 'rail-z', `Lengan ${nm} depan`, rail);
        frame(id, `Bingkai ${nm}`, -h, h, -h, h, y);
        ([[1, 0], [-1, 0], [0, 1], [0, -1]] as [number, number][]).forEach(([sx, sz], k) =>
          brace(`${id}-siku-${k}`, `Siku ${nm} ${k + 1}`, [sx * tp, y - braceDrop, sz * tp], [sx * side * 0.35, y - rh / 2, sz * side * 0.35], thin, 'v', 'h')
        );
      };
      level('meja', 'meja', yt, T, 30);
      flat('meja', 'Papan meja', -T / 2, T / 2, -T / 2, T / 2, yt);
      level('atap', 'atap', yR, R, 50);
      flat('atap', 'Papan atap', -S / 2, S / 2, -S / 2, S / 2, yR);
    }

    // ---------- Kanopi atap miring satu arah ----------
    else if (m === 'kanopi-miring') {
      const W = W0;
      const D = D0;
      const xs = columns(W);
      const xl = xs[0];
      const zb = L / 2;
      const zf = D - L / 2;
      const yFa = hr - b - rh / 2;
      const yBa = yFa - (zf - zb) * ta;
      const yAt = (z: number) => yBa + ((z - zb) / (zf - zb)) * (yFa - yBa);
      xs.forEach((x, i) => {
        const nm = colName(i, xs.length);
        plate(`plat-b-${i}`, x, zb);
        plate(`plat-d-${i}`, x, zf);
        post(`tiang-belakang-${i}`, `Tiang belakang ${nm}`, x, zb, 0.6, yBa + rh / 2);
        post(`tiang-depan-${i}`, `Tiang depan ${nm} (lebih tinggi)`, x, zf, 0.6, yFa + rh / 2);
        brace(`kasau-${i}`, `Kasau miring ${nm}`, [x, yAt(zb + L / 2), zb + L / 2], [x, yAt(zf - L / 2), zf - L / 2], rail, 'v', 'v', 'rail-z');
        brace(`siku-d-${i}`, `Siku depan ${nm}`, [x, yFa - 40, zf - L / 2], [x, yAt(zf - 35) - ru, zf - 35], thin, 'v', 'h', 'custom', 0, ta);
        brace(`siku-b-${i}`, `Siku belakang ${nm}`, [x, yBa - 40, zb + L / 2], [x, yAt(zb + 35) - ru, zb + 35], thin, 'v', 'h', 'custom', 0, ta);
      });
      between('palang-depan', 'Palang atap depan', xs, yFa, zf, L / 2);
      between('palang-belakang', 'Palang atap belakang', xs, yBa, zb, L / 2);
      const zm = (zb + zf) / 2;
      between('gording', 'Gording tengah', xs, yAt(zm), zm, rw);
      ([[L / 2, 1], [W - L / 2, -1]] as [number, number][]).forEach(([x, s], k) => {
        brace(`siku-samping-d-${k}`, `Siku samping depan ${k ? 'kanan' : 'kiri'}`, [x + (s * L) / 2, yFa - 40, zf], [x + s * 35, yFa - rh / 2, zf], thin, 'v', 'h');
        brace(`siku-samping-b-${k}`, `Siku samping belakang ${k ? 'kanan' : 'kiri'}`, [x + (s * L) / 2, yBa - 40, zb], [x + s * 35, yBa - rh / 2, zb], thin, 'v', 'h');
      });
      slopeBoard('atap', 'Papan atap', -5, W + 5, zb - 5, yBa - 5 * ta, zf + tr, yFa + tr * ta);
    }

    // ---------- Tenda pelana + meja ----------
    else if (m === 'tenda-pelana') {
      const W = W0;
      const D = D0;
      const xs = columns(W);
      const xl = xs[0];
      const xr = xs[xs.length - 1];
      const zb = L / 2;
      const zf = D - L / 2;
      const yR = hr - b - rh / 2;
      const yE = yR - (D / 2 - zb) * ta;
      const dc = 50;
      const zt = zf - L / 2 - dc;
      /** tinggi as kuda-kuda di titik z */
      const yK = (z: number) => yE + (Math.min(z, D - z) - zb) * ta;
      xs.forEach((x, i) => {
        const nm = colName(i, xs.length);
        plate(`plat-b-${i}`, x, zb);
        plate(`plat-d-${i}`, x, zf);
        post(`tiang-belakang-${i}`, `Tiang belakang ${nm}`, x, zb, 0.6, yE + rh / 2);
        post(`tiang-depan-${i}`, `Tiang depan ${nm}`, x, zf, 0.6, yE + rh / 2);
        add(`balok-${i}`, 'z', x, yE, zb + L / 2, zf - zb - L, 'rail-z', `Balok ikat ${nm}`, rail);
        // kuda-kuda dilas di sisi tiang (geser setebal pipa dari as, ke arah dalam tenda) supaya tidak bersilang
        // dengan balok ikat: ujung bawah rata di muka palang tepi, ujung atas rata di muka bubungan
        const xk = i === xs.length - 1 ? x - L / 2 - rw : x + L / 2 + rw;
        brace(`kuda-b-${i}`, `Kuda-kuda ${nm} belakang`, [xk, yK(zb + rw), zb + rw], [xk, yK(D / 2 - rw), D / 2 - rw], rail, 'v', 'v');
        brace(`kuda-d-${i}`, `Kuda-kuda ${nm} depan`, [xk, yK(zf - rw), zf - rw], [xk, yK(D / 2 + rw), D / 2 + rw], rail, 'v', 'v');
        add(`lengan-meja-${i}`, 'z', x, yt, zt, dc, 'rail-z', `Lengan meja ${nm}`, rail);
        brace(`siku-meja-${i}`, `Siku meja ${nm}`, [x, yt - 30, zf - L / 2], [x, yt - rh / 2, zf - L / 2 - dc * 0.8], thin, 'v', 'h');
      });
      between('tepi-depan', 'Palang tepi atap depan', xs, yE, zf, L / 2);
      between('tepi-belakang', 'Palang tepi atap belakang', xs, yE, zb, L / 2);
      add('bubungan', 'x', xl + L / 2, yR, D / 2, xr - xl - L, 'rail-x', 'Bubungan atap', rail);
      ([[xl, 1], [xr, -1]] as [number, number][]).forEach(([x, s], k) =>
        [zb, zf].forEach((z, j) =>
          brace(`siku-${k}-${j}`, `Siku tiang ${k ? 'kanan' : 'kiri'} ${j ? 'depan' : 'belakang'}`, [x + (s * L) / 2, yE - 40, z], [x + s * 35, yE - rh / 2, z], thin, 'v', 'h')
        )
      );
      between('meja-depan', 'Palang meja depan', xs, yt, zf, L / 2);
      between('meja-belakang', 'Palang meja belakang', xs, yt, zt + rw, rw);
      flat('meja', 'Papan meja jualan', 0, W, zt, D, yt);
      slopeBoard('atap-belakang', 'Papan atap belakang', -5, W + 5, zb - tr, yE - tr * ta, D / 2, yR);
      slopeBoard('atap-depan', 'Papan atap depan', -5, W + 5, D / 2, yR, zf + tr, yE - tr * ta);
    }

    // ---------- Kanopi menjorok (kantilever) ----------
    else {
      const W = W0;
      const D = D0;
      const xs = columns(W);
      const xl = xs[0];
      const zp = 40;
      const yP = hr - b;
      const yA = yP - rh / 2;
      const z0 = zp + L / 2;
      const zEnd = zp + D;
      const yEnd = yA - (zEnd - z0) * ta;
      xs.forEach((x, i) => {
        const nm = colName(i, xs.length);
        add(`tapak-${i}`, 'z', x, L / 2, 0, zp + D * 0.55, 'rail-z', `Tapak lantai ${nm}`, pt);
        post(`tiang-${i}`, `Tiang ${nm}`, x, zp, L, yP);
        brace(`siku-tapak-d-${i}`, `Siku tapak depan ${nm}`, [x, 55, z0], [x, L, zp + 50], thin, 'v', 'h');
        brace(`siku-tapak-b-${i}`, `Siku tapak belakang ${nm}`, [x, 55, zp - L / 2], [x, L, 3], thin, 'v', 'h');
        brace(`kasau-${i}`, `Kasau menjorok ${nm}`, [x, yA, z0], [x, yEnd, zEnd], rail, 'v', 'bebas', 'rail-z');
        const zq = z0 + 0.45 * (zEnd - z0);
        brace(`siku-atap-${i}`, `Siku kasau ${nm}`, [x, yA - 60, z0], [x, yA - 0.45 * (yA - yEnd) - ru, zq], thin, 'v', 'h', 'custom', 0, ta);
      });
      // palang memanjang dipotong per bentang di antara tiang / kasau
      between('palang-atas', 'Palang atas tiang', xs, yA, zp, L / 2);
      between('palang-ujung', 'Palang ujung atap', xs, yEnd, zEnd - rw, rw);
      const zm = (z0 + zEnd) / 2;
      between('gording', 'Gording tengah', xs, (yA + yEnd) / 2, zm, rw);
      slopeBoard('atap', 'Papan atap', -5, W + 5, zp - 3, yA + 3 * ta, zEnd, yEnd);
    }

    return finalize(list, boards, casters, wall);
  },

  checks: (p) => {
    const out: ProductCheck[] = [];
    const m = model(p);
    const W = num(p, 'panjang');
    const D = num(p, 'dalam');
    const ht = num(p, 'tinggiMeja');
    const hr = num(p, 'tinggiAtap');
    const sa = num(p, 'miringAtap', 15);
    if (UNDER.includes(m)) {
      const low = lowestEdge(p);
      if (low < 180) {
        const s2 = SLOPED.includes(m) ? Math.min(sa, 10) : sa;
        const fixP = { ...p, miringAtap: s2 };
        const need = Math.min(260, Math.ceil(hr + (183 - lowestEdge(fixP))));
        out.push({
          level: 'warn',
          message: `Tepi atap terendah hanya ± ${Math.round(low)} cm: kepala penjual / pembeli bisa terbentur.`,
          fix: { label: `Atap ${need} cm`, params: SLOPED.includes(m) ? { tinggiAtap: need, miringAtap: s2 } : { tinggiAtap: need } },
        });
      }
    }
    if (!NO_TABLE.includes(m) && hr - ht < 90)
      out.push({ level: 'warn', message: 'Atap terlalu dekat dengan meja: dagangan & kepala tidak muat di bawahnya.', fix: { label: `Atap ${Math.min(260, ht + 100)} cm`, params: { tinggiAtap: Math.min(260, ht + 100) } } });
    if (str(p, 'pipa') === '20' && hr > 180)
      out.push({ level: 'warn', message: 'Pipa 20×20 terlalu ramping untuk tiang setinggi ini, rangka goyang kena angin.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
    if (!ROLL2.includes(m) && m !== 'lapak-payung' && W > 120 && str(p, 'palang') !== '20x40')
      out.push({ level: 'warn', message: 'Bentang lebih dari 120 cm di atas pipa 20×20 bisa melendut saat dibebani.', fix: { label: 'Pakai pipa 20×40', params: { palang: '20x40' } } });
    if (ROLL2.includes(m) && D > 90)
      out.push({ level: 'warn', message: 'Gerobak lebih dari 90 cm sulit lewat gang dan pintu.', fix: { label: 'Lebar 75 cm', params: { dalam: 75 } } });
    if (m === 'lapak-tembok' && D > 70)
      out.push({ level: 'warn', message: 'Meja tempel tembok terlalu dalam: siku dan baut tembok menahan beban terlalu besar.', fix: { label: 'Dalam 50 cm', params: { dalam: 50 } } });
    if (m === 'lapak-payung' && W > 180)
      out.push({ level: 'warn', message: 'Atap lebih dari 180 cm di satu tiang mudah terguling kena angin.', fix: { label: 'Atap 160 cm', params: { panjang: 160 } } });
    if (DISPLAY.includes(m) && num(p, 'miringDisplay') > 25)
      out.push({ level: 'info', message: 'Papan display lebih dari 25°: barang bulat bisa menggelinding, pakai keranjang / tampah.' });
    if (ROLL2.includes(m)) out.push({ level: 'info', message: 'Roda besar dipasang di as besi Ø20 dengan bantalan & pen pengunci. Saat berjualan, gerobak bertumpu pada roda + 2 kaki di ujung pegangan.' });
    if (m === 'lapak-tembok') out.push({ level: 'info', message: 'Tiang tembok dibaut dengan fischer M10 minimal 3 titik per tiang, ke tembok bata penuh / beton.' });
    if (m === 'kanopi-kantilever') out.push({ level: 'info', message: 'Tanpa tiang depan: tapak lantai wajib diangkur ke lantai atau diberi pemberat (± 25 kg per tapak).' });
    if (m === 'lapak-payung') out.push({ level: 'info', message: 'Plat dasar 8 mm Ø70 cm. Untuk luar ruang, plat diangkur ke lantai atau ditambah pemberat.' });
    if ((m === 'kanopi-miring' || m === 'tenda-pelana' || m === 'kanopi-kantilever') && W > 250) out.push({ level: 'info', message: 'Bentang lebih dari 250 cm: tiang tengah ditambahkan otomatis.' });
    if (['kanopi-miring', 'tenda-pelana', 'kanopi-kantilever', 'lapak-tembok', 'lapak-payung'].includes(m))
      out.push({ level: 'info', message: 'Untuk luar ruang pakai cat dasar anti karat (atau galvanis) dan papan atap dilapis seng / atap UPVC.' });
    if (m === 'booth-kotak' || m === 'booth-backdrop' || m === 'bazar-lipat') out.push({ level: 'info', message: 'Sambungan tiang dibuat baut + plat supaya booth bisa dibongkar dan dibawa ke lokasi event.' });
    return out;
  },
};

/** Geser semua koordinat supaya rangka mulai di x = 0, z = 0 (kecuali tembok di z = 0), lalu hitung kotak luar */
function finalize(list: ProductBuild['members'], boards: Board[], casters: Caster[], wall: boolean): ProductBuild {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  let maxY = 0;
  const grow = (x: number, y: number, z: number, h: number) => {
    minX = Math.min(minX, x - h);
    maxX = Math.max(maxX, x + h);
    minZ = Math.min(minZ, z - h);
    maxZ = Math.max(maxZ, z + h);
    maxY = Math.max(maxY, y + h);
  };
  for (const mb of list) {
    const h = Math.max(mb.tubeSize || 30, mb.tubeH || 0) / 20;
    const a: V3 = [mb.x, mb.y, mb.z];
    let e: V3;
    if (mb.end) e = [mb.end.x, mb.end.y, mb.end.z];
    else {
      e = [...a] as V3;
      e[mb.axis === 'x' ? 0 : mb.axis === 'y' ? 1 : 2] += mb.length;
    }
    grow(a[0], a[1], a[2], h);
    grow(e[0], e[1], e[2], h);
  }
  for (const bd of boards) {
    const [x0, y0, z0] = bd.box.min;
    const [x1, y1, z1] = bd.box.max;
    if (bd.rotX) {
      const t = rad(bd.rotX);
      const yc = (y0 + y1) / 2;
      const zc = (z0 + z1) / 2;
      for (const y of [y0, y1])
        for (const z of [z0, z1]) {
          const dy = y - yc;
          const dz = z - zc;
          const yr = yc + dy * Math.cos(t) - dz * Math.sin(t);
          const zr = zc + dy * Math.sin(t) + dz * Math.cos(t);
          grow(x0, yr, zr, 0);
          grow(x1, yr, zr, 0);
        }
    } else {
      grow(x0, y1, z0, 0);
      grow(x1, y1, z1, 0);
    }
  }
  for (const c of casters) {
    const r = (c.sizeInch * 2.54) / 2;
    grow(c.x, c.topY, c.z - r, 1.2);
    grow(c.x, c.topY, c.z + r, 1.2);
  }
  const dx = -minX;
  const dz = wall ? 0 : -minZ;
  for (const mb of list) {
    mb.x = r1(mb.x + dx);
    mb.z = r1(mb.z + dz);
    if (mb.end) mb.end = { x: r1(mb.end.x + dx), y: mb.end.y, z: r1(mb.end.z + dz) };
  }
  for (const bd of boards) {
    bd.box = {
      min: [r1(bd.box.min[0] + dx), bd.box.min[1], r1(bd.box.min[2] + dz)],
      max: [r1(bd.box.max[0] + dx), bd.box.max[1], r1(bd.box.max[2] + dz)],
    };
  }
  for (const c of casters) {
    c.x = r1(c.x + dx);
    c.z = r1(c.z + dz);
  }
  return {
    members: list,
    boards,
    casters,
    W: r1(maxX - minX),
    D: r1(wall ? maxZ : maxZ - minZ),
    H: r1(maxY),
    boardThick: 0,
    wall: wall || undefined,
  };
}
