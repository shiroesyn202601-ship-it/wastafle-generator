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
          add('meja-tengah', 'x', xl + L / 2, yt, gl / 2, gw - L, 'rail-x', 'Palang tengah meja', rail);
          add('lantai-tengah', 'x', xl + L / 2, yd, gl / 2, gw - L, 'rail-x', 'Palang tengah lantai', rail);
          add('atap-tengah', 'x', xl + L / 2, yr, gl / 2, gw - L, 'rail-x', 'Palang tengah atap', rail);
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
          line(`siku-atap-${i}`, [x, yr - 45, zb + L / 2], [x, yr - rh / 2, zb + 45], 'custom', `Siku atap ${nm}`, thin);
        });
        add('atap-belakang', 'x', xl + L / 2, yr, zb, gw - L, 'rail-x', 'Palang atap belakang', rail);
        add('atap-depan', 'x', xl + 1, yr, L + rl - 1, gw - L - 2, 'rail-x', 'Palang atap depan', rail);
        add('atap-tengah', 'x', xl + 1, yr, L + rl / 2, gw - L - 2, 'rail-x', 'Palang atap tengah', rail);
        flat('atap', 'Papan atap', -5, gw + 5, 0, L + rl, yr);
      }
      // as roda, dudukan, pegangan
      add('as-roda', 'x', -6, r, zw, gw + 12, 'rail-x', 'As roda (besi as Ø20)', [20, 20]);
      xs.forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        add(`dudukan-as-${i}`, 'y', x, r, zw, yd - r, 'custom', `Dudukan as roda ${nm}`, [20, 20]);
      });
      const yh = ht - 10;
      xs.forEach((x, i) => add(`gagang-${i}`, 'z', x, yh, -40, 40, 'rail-z', `Gagang dorong ${i ? 'kanan' : 'kiri'}`, pt));
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
      add('display-depan', 'x', xl + L / 2, ylo, zf, W - L, 'rail-x', 'Palang display depan', rail);
      add('display-belakang', 'x', xl + L / 2, yhi, zb, W - L, 'rail-x', 'Palang display belakang', rail);
      [xl, xr].forEach((x, i) => line(`display-miring-${i}`, [x, yhi, zb + L / 2], [x, ylo, zf - L / 2], 'rail-z', `Palang display miring ${i ? 'kanan' : 'kiri'}`, rail));
      if (W > 120) line('display-tengah', [W / 2, yhi, zb + 1], [W / 2, ylo, zf - 1], 'custom', 'Penyangga tengah display', thin);
      slopeBoard('display', 'Papan display miring', 0, W, zb, yhi, zf, ylo);
      add('bibir', 'x', xl + L / 2, ylo + rh / 2 + b + 4, zf, W - L, 'rail-x', 'Bibir penahan barang', [15, 15]);
      if (bool(p, 'rakBawah')) flat('lantai', 'Papan rak bawah', 0, W, 0, D, yd);
      [xl, xr].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        line(`kuda-b-${i}`, [x, yE, zb], [x, yR, D / 2], 'custom', `Kuda-kuda ${nm} belakang`, rail);
        line(`kuda-d-${i}`, [x, yE, zf], [x, yR, D / 2], 'custom', `Kuda-kuda ${nm} depan`, rail);
      });
      add('bubungan', 'x', xl, yR, D / 2, xr - xl, 'rail-x', 'Bubungan atap', rail);
      slopeBoard('atap-belakang', 'Papan atap belakang', -5, W + 5, zb - tr, yE - tr * ta, D / 2, yR);
      slopeBoard('atap-depan', 'Papan atap depan', -5, W + 5, D / 2, yR, zf + tr, yE - tr * ta);
      const yh = Math.min(ht + 12, yE - 10);
      [zb, zf].forEach((z, k) => add(`gagang-${k}`, 'x', -28, yh, z, 28, 'rail-x', `Gagang dorong ${k ? 'depan' : 'belakang'}`, pt));
      add('pegangan', 'z', -28, yh, zb, zf - zb, 'rail-z', 'Pegangan dorong', pt);
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
      [xl, xr].forEach((x, i) => post(`kaki-counter-${i}`, `Kaki belakang counter ${i ? 'kanan' : 'kiri'}`, x, zc, 0, yt + rh / 2));
      ring('counter', 'Rangka counter', xl, xr, zc, zf, yt);
      flat('counter', 'Papan counter', 0, W, zc - L / 2, D + 3, yt);
      if (b > 0) boards.push(board('panel-depan', 'Papan penutup depan counter', 0, W, 8, yt + rh / 2, D, D + b));
      ring('bawah', 'Palang bawah', xl, xr, zb, zf, 10);
      if (bool(p, 'rakBawah')) flat('rak-bawah', 'Papan rak bawah counter', 0, W, zc - L / 2, zf - L / 2, 10);
      ring('atap', 'Rangka atap', xl, xr, zb, zf, yr);
      flat('atap', 'Papan atap', -5, W + 5, -5, D + tr, yr);
      if (bool(p, 'papanNama')) {
        add('papan-nama-bawah', 'x', xl + L / 2, yr - 32, zf, W - L, 'rail-x', 'Palang bawah papan nama', rail);
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
        add(`backdrop-${k}`, 'x', xl + L / 2, y, zb, W - L, 'rail-x', `Palang backdrop ${['bawah', 'tengah', 'atas'][k]}`, rail)
      );
      if (b > 0) boards.push(board('backdrop', 'Papan backdrop / promosi', xl + L / 2, xr - L / 2, 15 - rh / 2, hb, zb + 1, zb + 1 + b));
      const arm = Math.max(30, tr);
      [xl, xr].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        add(`lengan-tritisan-${i}`, 'z', x, yTop, L, arm, 'rail-z', `Lengan tritisan ${nm}`, rail);
        line(`siku-tritisan-${i}`, [x, hb - 35, zb + L / 2], [x, yTop - rh / 2, L + arm * 0.7], 'custom', `Siku tritisan ${nm}`, thin);
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
      ring('meja', 'Rangka meja', xl, xr, zb, zf, yt);
      [xl, xr].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        line(`kaki-x-${i}-a`, [x, 1, zb], [x, yt - rh / 2, zf], 'post', `Kaki silang ${nm} 1`, pt);
        line(`kaki-x-${i}-b`, [x, 1, zf], [x, yt - rh / 2, zb], 'post', `Kaki silang ${nm} 2`, pt);
      });
      add('palang-silang', 'x', xl + L / 2, (1 + yt - rh / 2) / 2, D / 2, W - L, 'rail-x', 'Palang tengah kaki silang', rail);
      flat('meja', 'Papan meja', 0, W, 0, D, yt);
      const hp = hr - b;
      const zs = zb - L / 2 - 1;
      [xl, xr].forEach((x, i) => post(`tiang-spanduk-${i}`, `Tiang spanduk ${i ? 'kanan' : 'kiri'}`, x, zs, 0, hp));
      add('spanduk-atas', 'x', xl + L / 2, hp - rh / 2, zs, W - L, 'rail-x', 'Palang atas spanduk', rail);
      add('spanduk-bawah', 'x', xl + L / 2, hp - 60, zs, W - L, 'rail-x', 'Palang bawah spanduk', rail);
      if (b > 0) boards.push(board('spanduk', 'Papan nama / spanduk', xl + L / 2, xr - L / 2, hp - 60 - rh / 2, hp, zs + 1, zs + 1 + b));
      const arm = Math.max(25, tr);
      [xl, xr].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        add(`lengan-tritisan-${i}`, 'z', x, hp - rh / 2, zs + L / 2, arm, 'rail-z', `Lengan tritisan ${nm}`, rail);
        line(`siku-tritisan-${i}`, [x, hp - 30, zs + L / 2], [x, hp - rh, zs + L / 2 + arm * 0.7], 'custom', `Siku tritisan ${nm}`, thin);
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
      [xl, xr].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        post(`tiang-belakang-${i}`, `Tiang belakang ${nm}`, x, zb, 0, yP);
        post(`kaki-depan-${i}`, `Kaki depan ${nm}`, x, zf, 0, ylo + rh / 2);
        line(`display-miring-${i}`, [x, yhi, zb + L / 2], [x, ylo, zf - L / 2], 'rail-z', `Palang display miring ${nm}`, rail);
        add(`palang-bawah-${i}`, 'z', x, 15, L, D - L, 'rail-z', `Palang bawah ${nm}`, rail);
      });
      add('palang-bawah-tengah', 'x', xl + 1, 15, D / 2, W - L - 2, 'rail-x', 'Palang bawah tengah (H)', rail);
      add('display-depan', 'x', xl + L / 2, ylo, zf, W - L, 'rail-x', 'Palang display depan', rail);
      add('display-belakang', 'x', xl + L / 2, yhi, zb, W - L, 'rail-x', 'Palang display belakang', rail);
      if (W > 120) line('display-tengah', [W / 2, yhi, zb + 1], [W / 2, ylo, zf - 1], 'custom', 'Penyangga tengah display', thin);
      slopeBoard('display', 'Papan display miring', 0, W, zb, yhi, zf, ylo);
      add('bibir', 'x', xl + L / 2, ylo + rh / 2 + b + 4, zf, W - L, 'rail-x', 'Bibir penahan barang', [15, 15]);
      const zEnd = D + tr;
      const z0 = zb + L / 2;
      const yEnd = yA - (zEnd - z0) * ta;
      [xl, xr].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        line(`kasau-${i}`, [x, yA, z0], [x, yEnd, zEnd], 'rail-z', `Kasau atap ${nm}`, rail);
        const zq = z0 + 0.4 * (zEnd - z0);
        line(`siku-atap-${i}`, [x, yA - 45, z0], [x, yA - 0.4 * (yA - yEnd) - rh / 2, zq], 'custom', `Siku atap ${nm}`, thin);
      });
      add('atap-belakang', 'x', xl + L / 2, yA, zb, W - L, 'rail-x', 'Palang atap belakang', rail);
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
        line(`siku-meja-${i}`, [x, y0 + 3, L], [x, yt - rh / 2, L + (D - L) * 0.7], 'custom', `Siku meja ${nm}`, thin);
        line(`kasau-${i}`, [x, yA, L], [x, yEnd, zEnd], 'rail-z', `Kasau tritisan ${nm}`, rail);
        const zq = L + 0.5 * (zEnd - L);
        line(`siku-atap-${i}`, [x, yA - 40, L], [x, yA - 0.5 * (yA - yEnd) - rh / 2, zq], 'custom', `Siku tritisan ${nm}`, thin);
      });
      add('meja-depan', 'x', xl + 1, yt, D - 1, xr - xl - 2, 'rail-x', 'Palang meja depan', rail);
      add('rel-tembok-meja', 'x', xl + L / 2, yt, zw, W - L, 'rail-x', 'Rel tembok meja', rail);
      add('rel-tembok-atas', 'x', xl + L / 2, yA, zw, W - L, 'rail-x', 'Rel tembok atas', rail);
      add('atap-depan', 'x', xl + 1, yEnd, zEnd - 1, xr - xl - 2, 'rail-x', 'Palang tritisan depan', rail);
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
        add('papan-nama-bawah', 'x', xl + L / 2, yr - 32, zf, W - L, 'rail-x', 'Palang bawah papan nama', rail);
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
      const level = (id: string, nm: string, y: number, side: number, braceDrop: number) => {
        add(`${id}-lengan-x`, 'x', -side / 2, y, 0, side, 'rail-x', `Lengan ${nm} kiri-kanan`, rail);
        add(`${id}-lengan-z`, 'z', 0, y, -side / 2, side, 'rail-z', `Lengan ${nm} depan-belakang`, rail);
        ring(id, `Bingkai ${nm}`, -side / 2, side / 2, -side / 2, side / 2, y, rail, 1);
        ([[1, 0], [-1, 0], [0, 1], [0, -1]] as [number, number][]).forEach(([sx, sz], k) =>
          line(`${id}-siku-${k}`, [sx * 2, y - braceDrop, sz * 2], [sx * side * 0.35, y - rh / 2, sz * side * 0.35], 'custom', `Siku ${nm} ${k + 1}`, thin)
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
        line(`kasau-${i}`, [x, yBa, zb + L / 2], [x, yFa, zf - L / 2], 'rail-z', `Kasau miring ${nm}`, rail);
        line(`siku-d-${i}`, [x, yFa - 40, zf - L / 2], [x, yAt(zf - 35) - rh / 2, zf - 35], 'custom', `Siku depan ${nm}`, thin);
        line(`siku-b-${i}`, [x, yBa - 40, zb + L / 2], [x, yAt(zb + 35) - rh / 2, zb + 35], 'custom', `Siku belakang ${nm}`, thin);
      });
      add('palang-depan', 'x', xl + L / 2, yFa, zf, W - L, 'rail-x', 'Palang atap depan', rail);
      add('palang-belakang', 'x', xl + L / 2, yBa, zb, W - L, 'rail-x', 'Palang atap belakang', rail);
      const zm = (zb + zf) / 2;
      add('gording', 'x', xl + 1, yAt(zm), zm, W - L - 2, 'rail-x', 'Gording tengah', rail);
      ([[L / 2, 1], [W - L / 2, -1]] as [number, number][]).forEach(([x, s], k) => {
        line(`siku-samping-d-${k}`, [x, yFa - 40, zf], [x + s * 35, yFa - rh / 2, zf], 'custom', `Siku samping depan ${k ? 'kanan' : 'kiri'}`, thin);
        line(`siku-samping-b-${k}`, [x, yBa - 40, zb], [x + s * 35, yBa - rh / 2, zb], 'custom', `Siku samping belakang ${k ? 'kanan' : 'kiri'}`, thin);
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
      xs.forEach((x, i) => {
        const nm = colName(i, xs.length);
        plate(`plat-b-${i}`, x, zb);
        plate(`plat-d-${i}`, x, zf);
        post(`tiang-belakang-${i}`, `Tiang belakang ${nm}`, x, zb, 0.6, yE + rh / 2);
        post(`tiang-depan-${i}`, `Tiang depan ${nm}`, x, zf, 0.6, yE + rh / 2);
        add(`balok-${i}`, 'z', x, yE, zb + L / 2, zf - zb - L, 'rail-z', `Balok ikat ${nm}`, rail);
        line(`kuda-b-${i}`, [x, yE, zb], [x, yR, D / 2], 'custom', `Kuda-kuda ${nm} belakang`, rail);
        line(`kuda-d-${i}`, [x, yE, zf], [x, yR, D / 2], 'custom', `Kuda-kuda ${nm} depan`, rail);
        add(`lengan-meja-${i}`, 'z', x, yt, zt, dc, 'rail-z', `Lengan meja ${nm}`, rail);
        line(`siku-meja-${i}`, [x, yt - 30, zf - L / 2], [x, yt - rh / 2, zf - L / 2 - dc * 0.8], 'custom', `Siku meja ${nm}`, thin);
      });
      add('tepi-depan', 'x', xl + L / 2, yE, zf, W - L, 'rail-x', 'Palang tepi atap depan', rail);
      add('tepi-belakang', 'x', xl + L / 2, yE, zb, W - L, 'rail-x', 'Palang tepi atap belakang', rail);
      add('bubungan', 'x', xl, yR, D / 2, xr - xl, 'rail-x', 'Bubungan atap', rail);
      ([[xl, 1], [xr, -1]] as [number, number][]).forEach(([x, s], k) =>
        [zb, zf].forEach((z, j) =>
          line(`siku-${k}-${j}`, [x, yE - 40, z], [x + s * 35, yE - rh / 2, z], 'custom', `Siku tiang ${k ? 'kanan' : 'kiri'} ${j ? 'depan' : 'belakang'}`, thin)
        )
      );
      add('meja-depan', 'x', xl + L / 2, yt, zf, W - L, 'rail-x', 'Palang meja depan', rail);
      add('meja-belakang', 'x', xl + 1, yt, zt + 1, xr - xl - 2, 'rail-x', 'Palang meja belakang', rail);
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
        line(`siku-tapak-d-${i}`, [x, 55, z0], [x, L, zp + 50], 'custom', `Siku tapak depan ${nm}`, thin);
        line(`siku-tapak-b-${i}`, [x, 55, zp - L / 2], [x, L, 3], 'custom', `Siku tapak belakang ${nm}`, thin);
        line(`kasau-${i}`, [x, yA, z0], [x, yEnd, zEnd], 'rail-z', `Kasau menjorok ${nm}`, rail);
        const zq = z0 + 0.45 * (zEnd - z0);
        line(`siku-atap-${i}`, [x, yA - 60, z0], [x, yA - 0.45 * (yA - yEnd) - rh / 2, zq], 'custom', `Siku kasau ${nm}`, thin);
      });
      add('palang-atas', 'x', xl + L / 2, yA, zp, W - L, 'rail-x', 'Palang atas tiang', rail);
      add('palang-ujung', 'x', xl + 1, yEnd, zEnd - 1, W - L - 2, 'rail-x', 'Palang ujung atap', rail);
      const zm = (z0 + zEnd) / 2;
      add('gording', 'x', xl + 1, (yA + yEnd) / 2, zm, W - L - 2, 'rail-x', 'Gording tengah', rail);
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
