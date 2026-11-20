import { FrameHinge } from '../types/kitchen';
import { Board, ProductCheck, ProductDef, Params } from './types';
import { BOARD_THICK, board, bool, materialParams, memberFactory, num, str } from './common';

/**
 * Meja dinding. Tiap model = cara menahan daun meja yang berbeda (struktur rangka berbeda):
 * - rel: rel dinding dibaut ke tembok, daun berangka 4 sisi menempel lewat engsel memanjang (bisa dilipat turun)
 * - siku: siku segitiga (tiang tembok + lengan + batang miring) di bawah daun, tetap
 * - kaki-depan: daun lipat di rel tembok + rangka kaki U di depan yang ikut dilipat ke bawah daun
 * - kotak: kotak rangka di tembok; daun dilipat NAIK menutup kotak (meja murphy), ditahan rantai miring
 * - tiang: tiang dari lantai menempel tembok, lengan menjorok tanpa kaki depan (ambalan bar)
 * - lipat-bangku: dua rel tembok bertingkat, daun meja + daun bangku masing-masing berengsel, dilipat turun
 * - topang: batang miring dari lantai di kaki tembok naik ke sisi depan daun (tanpa tiang tembok)
 * - kaki-v: rel tembok + dua kaki V (dua batang miring bertemu di satu titik lantai) di bawah tepi depan
 * - kaki-tengah: rel tembok + satu kaki di tengah tepi depan, berdiri di tapak melintang
 * - gantung-plafon: rel tembok di belakang, tepi depan digantung dua batang tegak dari plat plafon
 * - tarik: tiang tembok menjulang di atas daun, batang tarik miring dari pucuk tiang ke ujung depan lengan
 * - pojok: daun bentuk L di dua tembok yang bertemu di pojok, satu kaki di siku dalam
 * - tiang-geser: dua rel tegak dari lantai, penjepit geser + siku miring membawa daun naik-turun (meja berdiri/duduk)
 * - rak-atas: tiang lantai menempel tembok menerus ke atas, meja dalam di bawah + rak sempit bertingkat di atas
 * - papan-alat: tiang lantai menempel tembok, meja bersiku miring + panel kisi (jeruji) untuk menggantung alat di atasnya
 */
type Tube = [number, number];
const MODELS = ['rel', 'siku', 'kaki-depan', 'kotak', 'tiang', 'lipat-bangku', 'topang', 'kaki-v', 'kaki-tengah', 'gantung-plafon', 'tarik', 'pojok', 'tiang-geser', 'rak-atas', 'papan-alat'];
const model = (p: Params) => {
  const m = str(p, 'model', 'rel');
  return MODELS.includes(m) ? m : 'rel';
};
/** DNA rangka 7 sumbu (A penopang · B kaki · C penguat · D papan · E gerak · F tembok · G khusus), dipakai untuk sidik */
const DNA: Record<string, string> = {
  rel: 'tempel-rel|tanpa-kaki|tanpa|1-bidang|lipat-turun|tembok|engsel',
  siku: 'tempel-siku|tanpa-kaki|diagonal-bawah|1-bidang|diam|tembok|-',
  'kaki-depan': 'kaki-u-depan+tembok|tegak|palang-kaki-u|1-bidang|lipat|tembok|engsel-ganda',
  kotak: 'tempel-kotak|tanpa-kaki|kotak-tertutup+penahan|1-bidang|lipat-naik|tembok|engsel-piano',
  tiang: 'tiang-lantai-tembok|tegak|palang-tembok|1-bidang|diam|tembok|-',
  'lipat-bangku': 'tempel-rel-ganda|tanpa-kaki|tanpa|meja+bangku|lipat-turun|tembok|bangku-menyatu',
  topang: 'topang-miring-lantai|miring-satu-arah|tanpa|1-bidang|diam|tembok|-',
  'kaki-v': '2-kaki-v+tembok|miring-v|tanpa|1-bidang|diam|tembok|-',
  'kaki-tengah': 'kaki-tunggal+tembok|tegak-tapak|tanpa|1-bidang|diam|tembok|tapak',
  'gantung-plafon': 'gantung-plafon+tembok|tanpa-kaki|tanpa|1-bidang|diam|tembok+plafon|batang-gantung',
  tarik: 'tarik-atas+tembok|tanpa-kaki|tarik-miring-atas|1-bidang|diam|tembok|tiang-menjulang',
  pojok: 'rel-2-tembok+1-kaki|tegak|rangka-l|l-sudut|diam|pojok|kaki-siku',
  'tiang-geser': 'tiang-lantai-tembok|tegak|diagonal-penjepit|1-bidang|naik-turun|tembok|rel-tegak',
  'rak-atas': 'tiang-lantai-tembok|tegak|palang-tembok-bertingkat|meja+rak-atas|diam|tembok|rak-atas',
  'papan-alat': 'tiang-lantai-tembok|tegak|diagonal+kisi|meja+panel-tegak|diam|tembok|kisi-gantung-alat',
};
/**
 * Posisi z as ujung bawah batang miring (bidang y-z, dipotong datar) supaya sudut belakang potongannya
 * tepat menempel di bidang z = face, bukan masuk ke batang tegak di belakangnya.
 * ya/yb: tinggi ujung bawah/atas, ze: z ujung atas, half: setengah tebal pipa.
 * Rumus sama berlaku untuk ujung ATAS batang yang turun ke depan (batang tarik).
 */
const zButtFace = (face: number, ya: number, yb: number, ze: number, half: number) => {
  const dy = Math.abs(yb - ya) || 1;
  let z = face + half;
  for (let k = 0; k < 8; k++) z = face + (half * Math.hypot(dy, ze - z)) / dy;
  return z;
};
/** daun bisa dilipat */
const folds = (p: Params) => (model(p) === 'rel' && bool(p, 'lipat')) || ['kaki-depan', 'kotak', 'lipat-bangku'].includes(model(p));
const uses = (...ms: string[]) => (p: Params) => ms.includes(model(p));
const side = (n: number, i: number) => (n === 3 && i === 1 ? 'tengah' : i ? 'kanan' : 'kiri');

export const MEJA_DINDING: ProductDef = {
  id: 'meja-dinding',
  name: 'Meja dinding',
  tagline: 'lipat · hemat tempat · kos & dapur kecil',
  icon: 'M6 4v32M6 14h40M10 14v8M42 14v8',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['panjang', 'dalam', 'tinggi', 'panjangSayap', 'tinggiBangku', 'dalamBangku', 'tinggiPlafon', 'tinggiAtas', 'dalamAtas'] },
    { id: 'bentuk', title: 'Bentuk', keys: ['model', 'lipat', 'jumlahEngsel', 'tingkatAtas'] },
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
        { value: 'lipat-bangku', label: 'Meja + bangku lipat', desc: 'Dua daun berengsel: meja dan bangku' },
        { value: 'topang', label: 'Kaki miring ke tembok', desc: 'Batang miring dari lantai ke tepi daun' },
        { value: 'kaki-v', label: 'Kaki V depan', desc: 'Dua kaki V ramping di tepi depan' },
        { value: 'kaki-tengah', label: 'Satu kaki tengah', desc: 'Satu kaki bertapak di tengah depan' },
        { value: 'gantung-plafon', label: 'Gantung plafon', desc: 'Tepi depan digantung batang dari plafon' },
        { value: 'tarik', label: 'Batang tarik atas', desc: 'Batang miring dari tiang tinggi ke depan' },
        { value: 'pojok', label: 'Pojok bentuk L', desc: 'Dua tembok, satu kaki di siku' },
        { value: 'tiang-geser', label: 'Rel tegak naik-turun', desc: 'Tinggi meja bisa dipindah' },
        { value: 'rak-atas', label: 'Meja + rak atas', desc: 'Tiang tinggi, rak sempit di atas meja' },
        { value: 'papan-alat', label: 'Meja + panel kisi alat', desc: 'Kisi jeruji di atas meja untuk kait' },
      ],
    },
    { key: 'panjang', label: 'Panjang', type: 'number', unit: 'cm', min: 40, max: 160, step: 1, marks: [{ value: 60, label: '1 orang' }, { value: 100, label: '2 orang' }] },
    { key: 'dalam', label: 'Kedalaman', type: 'number', unit: 'cm', min: 25, max: 60, step: 1, help: 'Jarak dari dinding ke tepi depan.', marks: [{ value: 40, label: 'umum' }] },
    { key: 'tinggi', label: 'Tinggi dari lantai', type: 'number', unit: 'cm', min: 60, max: 110, step: 1, marks: [{ value: 75, label: 'meja makan' }, { value: 90, label: 'meja dapur' }, { value: 105, label: 'meja bar' }] },
    { key: 'panjangSayap', label: 'Panjang sayap samping', type: 'number', unit: 'cm', min: 60, max: 200, step: 1, help: 'Panjang meja di tembok samping, diukur dari pojok.', showIf: uses('pojok') },
    { key: 'tinggiBangku', label: 'Tinggi bangku', type: 'number', unit: 'cm', min: 35, max: 55, step: 1, marks: [{ value: 45, label: 'umum' }], showIf: uses('lipat-bangku') },
    { key: 'dalamBangku', label: 'Lebar dudukan bangku', type: 'number', unit: 'cm', min: 25, max: 40, step: 1, showIf: uses('lipat-bangku') },
    { key: 'tinggiPlafon', label: 'Tinggi plafon', type: 'number', unit: 'cm', min: 220, max: 400, step: 1, help: 'Batang gantung dibaut ke balok atau cor plafon.', showIf: uses('gantung-plafon') },
    { key: 'tinggiAtas', label: 'Tinggi tiang di atas meja', type: 'number', unit: 'cm', min: 30, max: 110, step: 1, help: 'Seberapa tinggi rangka naik di atas daun meja.', showIf: uses('tarik', 'tiang-geser', 'rak-atas', 'papan-alat') },
    { key: 'dalamAtas', label: 'Kedalaman rak atas', type: 'number', unit: 'cm', min: 15, max: 35, step: 1, marks: [{ value: 22, label: 'buku' }], showIf: uses('rak-atas') },
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
    { key: 'tingkatAtas', label: 'Jumlah rak atas', type: 'number', unit: 'tingkat', min: 1, max: 3, step: 1, showIf: uses('rak-atas') },
    ...materialParams(true),
  ],
  defaults: {
    model: 'rel',
    panjang: 80,
    dalam: 40,
    tinggi: 75,
    panjangSayap: 100,
    tinggiBangku: 45,
    dalamBangku: 30,
    tinggiPlafon: 280,
    tinggiAtas: 60,
    dalamAtas: 22,
    tingkatAtas: 2,
    lipat: true,
    jumlahEngsel: 'siku',
    pipa: '20',
    papan: 'kayu',
    warna: '#1f2226',
  },
  groups: [
    { id: 'lipat', name: 'Meja dinding lipat', desc: 'Dilipat menempel tembok saat tidak dipakai' },
    { id: 'tetap', name: 'Meja dinding tetap (makan · belajar)', desc: 'Daun tetap, ditahan siku, kaki, atau pojok' },
    { id: 'bar', name: 'Meja bar & dapur dinding', desc: 'Panjang dan tinggi, tanpa kaki depan yang mengganggu' },
    { id: 'kerja', name: 'Meja kerja dinding', desc: 'Dengan rak, panel alat, atau tinggi yang bisa diatur' },
  ],
  signature: (p) => `${model(p)}|${DNA[model(p)]}`,
  presets: [
    {
      id: 'lipat',
      group: 'lipat',
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
      id: 'kaki-depan',
      group: 'lipat',
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
      group: 'lipat',
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
      id: 'lipat-bangku',
      group: 'lipat',
      name: 'Meja + bangku lipat dinding',
      desc: 'dua rel tembok bertingkat, daun meja di atas dan daun bangku di bawah sama-sama berengsel dan dilipat turun',
      params: { model: 'lipat-bangku', panjang: 100, dalam: 40, tinggi: 75, tinggiBangku: 45, dalamBangku: 30, jumlahEngsel: 'siku' },
      sizes: [
        { label: 'Makan 2 orang (kos)', desc: 'meja 100 × 40, bangku 30 cm', params: { panjang: 100, dalam: 40, tinggi: 75, tinggiBangku: 45, dalamBangku: 30 } },
        { label: 'Warung sempit', desc: 'meja 150 × 35, bangku 30 cm', params: { panjang: 150, dalam: 35, tinggi: 75, tinggiBangku: 45, dalamBangku: 30 } },
        { label: 'Bar + kursi tinggi', desc: 'meja 120 × 35 tinggi 100, bangku 55', params: { panjang: 120, dalam: 35, tinggi: 100, tinggiBangku: 55, dalamBangku: 28 } },
      ],
    },
    {
      id: 'siku',
      group: 'tetap',
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
      id: 'topang',
      group: 'tetap',
      name: 'Meja dinding kaki miring',
      desc: 'batang miring berdiri di lantai dekat kaki tembok, naik menahan sisi depan daun, tanpa tiang tembok',
      params: { model: 'topang', panjang: 100, dalam: 45, tinggi: 75 },
      sizes: [
        { label: 'Meja belajar', desc: '100 × 45 cm, tinggi 75', params: { panjang: 100, dalam: 45, tinggi: 75 } },
        { label: 'Meja makan sempit', desc: '130 × 40 cm, tinggi 75', params: { panjang: 130, dalam: 40, tinggi: 75 } },
        { label: 'Meja rias', desc: '80 × 35 cm, tinggi 75', params: { panjang: 80, dalam: 35, tinggi: 75 } },
      ],
    },
    {
      id: 'kaki-v',
      group: 'tetap',
      name: 'Meja dinding kaki V',
      desc: 'rel tembok di belakang, dua kaki V ramping (dua batang miring bertemu di lantai) di bawah tepi depan, tanpa palang',
      params: { model: 'kaki-v', panjang: 110, dalam: 35, tinggi: 78 },
      sizes: [
        { label: 'Meja konsol ruang tamu', desc: '110 × 35 cm, tinggi 78', params: { panjang: 110, dalam: 35, tinggi: 78 } },
        { label: 'Meja kerja', desc: '120 × 50 cm, tinggi 75', params: { panjang: 120, dalam: 50, tinggi: 75 } },
        { label: 'Meja TV / pajangan', desc: '150 × 40 cm, tinggi 60', params: { panjang: 150, dalam: 40, tinggi: 60 } },
      ],
    },
    {
      id: 'kaki-tengah',
      group: 'tetap',
      name: 'Meja dinding satu kaki',
      desc: 'rel tembok di belakang, satu kaki di tengah tepi depan berdiri di tapak lantai melintang',
      params: { model: 'kaki-tengah', panjang: 90, dalam: 50, tinggi: 75 },
      sizes: [
        { label: 'Meja makan 2 orang', desc: '90 × 50 cm, tinggi 75', params: { panjang: 90, dalam: 50, tinggi: 75 } },
        { label: 'Meja kopi berdiri', desc: '80 × 40 cm, tinggi 105', params: { panjang: 80, dalam: 40, tinggi: 105 } },
        { label: 'Meja belajar anak', desc: '100 × 45 cm, tinggi 65', params: { panjang: 100, dalam: 45, tinggi: 65 } },
      ],
    },
    {
      id: 'pojok',
      group: 'tetap',
      name: 'Meja pojok L dinding',
      desc: 'daun bentuk L dibaut ke dua tembok yang bertemu di pojok, satu kaki di siku dalam',
      params: { model: 'pojok', panjang: 140, dalam: 50, tinggi: 75, panjangSayap: 100 },
      sizes: [
        { label: 'Meja kerja pojok', desc: '140 + 100 cm, dalam 50', params: { panjang: 140, dalam: 50, tinggi: 75, panjangSayap: 100 } },
        { label: 'Meja belajar 2 anak', desc: '160 + 160 cm, dalam 50', params: { panjang: 160, dalam: 50, tinggi: 72, panjangSayap: 160 } },
        { label: 'Bar pojok cafe', desc: '150 + 120 cm, dalam 40, tinggi 105', params: { panjang: 150, dalam: 40, tinggi: 105, panjangSayap: 120 } },
      ],
    },
    {
      id: 'tiang',
      group: 'bar',
      name: 'Meja bar dinding tiang lantai',
      desc: 'tiang dari lantai menempel tembok, lengan menjorok tanpa kaki depan',
      params: { model: 'tiang', panjang: 150, dalam: 40, tinggi: 105 },
      sizes: [
        { label: 'Bar menghadap tembok', desc: '150 × 40 cm, tinggi 105', params: { panjang: 150, dalam: 40, tinggi: 105 } },
        { label: 'Meja makan sempit', desc: '120 × 45 cm, tinggi 75', params: { panjang: 120, dalam: 45, tinggi: 75 } },
        { label: 'Meja dapur / saji', desc: '160 × 45 cm, tinggi 90', params: { panjang: 160, dalam: 45, tinggi: 90 } },
      ],
    },
    {
      id: 'gantung-plafon',
      group: 'bar',
      name: 'Meja bar dinding gantung plafon',
      desc: 'rel tembok di belakang, tepi depan digantung dua batang tegak dari plat plafon, tanpa kaki lantai',
      params: { model: 'gantung-plafon', panjang: 120, dalam: 40, tinggi: 105, tinggiPlafon: 280 },
      sizes: [
        { label: 'Bar jendela cafe', desc: '120 × 40 cm, tinggi 105', params: { panjang: 120, dalam: 40, tinggi: 105, tinggiPlafon: 280 } },
        { label: 'Meja dapur melayang', desc: '100 × 45 cm, tinggi 90', params: { panjang: 100, dalam: 45, tinggi: 90, tinggiPlafon: 270 } },
        { label: 'Meja makan 2 orang', desc: '80 × 45 cm, tinggi 75, plafon 300', params: { panjang: 80, dalam: 45, tinggi: 75, tinggiPlafon: 300 } },
      ],
    },
    {
      id: 'tarik',
      group: 'bar',
      name: 'Meja bar dinding batang tarik',
      desc: 'tiang tembok menjulang di atas daun, batang tarik miring dari pucuk tiang turun ke ujung depan lengan',
      params: { model: 'tarik', panjang: 120, dalam: 40, tinggi: 105, tinggiAtas: 60 },
      sizes: [
        { label: 'Bar menghadap tembok', desc: '120 × 40 cm, tinggi 105', params: { panjang: 120, dalam: 40, tinggi: 105, tinggiAtas: 60 } },
        { label: 'Meja saji dapur', desc: '100 × 45 cm, tinggi 90', params: { panjang: 100, dalam: 45, tinggi: 90, tinggiAtas: 70 } },
        { label: 'Meja kerja industrial', desc: '110 × 50 cm, tinggi 75', params: { panjang: 110, dalam: 50, tinggi: 75, tinggiAtas: 80 } },
      ],
    },
    {
      id: 'rak-atas',
      group: 'kerja',
      name: 'Meja dinding + rak atas',
      desc: 'tiang dari lantai menempel tembok menerus ke atas, meja dalam di bawah dan rak sempit bertingkat di atasnya',
      params: { model: 'rak-atas', panjang: 100, dalam: 50, tinggi: 75, tinggiAtas: 70, dalamAtas: 22, tingkatAtas: 2 },
      sizes: [
        { label: 'Meja belajar + rak buku', desc: '100 × 50 cm, 2 rak atas', params: { panjang: 100, dalam: 50, tinggi: 75, tinggiAtas: 70, dalamAtas: 22, tingkatAtas: 2 } },
        { label: 'Meja rias + ambalan', desc: '80 × 40 cm, 1 rak atas', params: { panjang: 80, dalam: 40, tinggi: 75, tinggiAtas: 50, dalamAtas: 18, tingkatAtas: 1 } },
        { label: 'Meja dapur + rak bumbu', desc: '140 × 50 cm tinggi 90, 3 rak', params: { panjang: 140, dalam: 50, tinggi: 90, tinggiAtas: 90, dalamAtas: 20, tingkatAtas: 3 } },
      ],
    },
    {
      id: 'papan-alat',
      group: 'kerja',
      name: 'Meja kerja dinding + panel kisi alat',
      desc: 'tiang dari lantai menempel tembok, meja bersiku miring, di atasnya panel kisi palang + jeruji untuk menggantung alat',
      params: { model: 'papan-alat', panjang: 120, dalam: 55, tinggi: 85, tinggiAtas: 80, pipa: '30' },
      sizes: [
        { label: 'Meja bengkel / perkakas', desc: '120 × 55 cm, tinggi 85', params: { panjang: 120, dalam: 55, tinggi: 85, tinggiAtas: 80 } },
        { label: 'Meja hobi / jahit', desc: '100 × 50 cm, tinggi 75', params: { panjang: 100, dalam: 50, tinggi: 75, tinggiAtas: 60 } },
        { label: 'Meja dapur gantung panci', desc: '150 × 50 cm, tinggi 90', params: { panjang: 150, dalam: 50, tinggi: 90, tinggiAtas: 70 } },
      ],
    },
    {
      id: 'tiang-geser',
      group: 'kerja',
      name: 'Meja dinding naik-turun (rel tegak)',
      desc: 'dua rel tegak dari lantai menempel tembok, penjepit geser bersiku miring membawa daun naik-turun',
      params: { model: 'tiang-geser', panjang: 110, dalam: 55, tinggi: 75, tinggiAtas: 40 },
      sizes: [
        { label: 'Meja kerja duduk-berdiri', desc: '110 × 55 cm, rel sampai 115', params: { panjang: 110, dalam: 55, tinggi: 75, tinggiAtas: 40 } },
        { label: 'Meja belajar anak (ikut tumbuh)', desc: '90 × 50 cm, mulai tinggi 60', params: { panjang: 90, dalam: 50, tinggi: 60, tinggiAtas: 50 } },
        { label: 'Meja laptop berdiri', desc: '80 × 40 cm, tinggi 105', params: { panjang: 80, dalam: 40, tinggi: 105, tinggiAtas: 30 } },
      ],
    },
  ],
  summary: (p) => {
    const m = model(p);
    const extra =
      m === 'pojok'
        ? ` + sayap ${Math.max(num(p, 'panjangSayap'), num(p, 'dalam') + 30)} cm`
        : m === 'lipat-bangku'
          ? ` · bangku ${num(p, 'tinggiBangku')} cm`
          : m === 'rak-atas'
            ? ` · ${Math.round(num(p, 'tingkatAtas', 2))} rak atas`
            : m === 'gantung-plafon'
              ? ` · plafon ${num(p, 'tinggiPlafon')} cm`
              : '';
    return `${num(p, 'panjang')} × ${num(p, 'dalam')} cm, tinggi ${num(p, 'tinggi')} cm${extra}${folds(p) ? ' · lipat' : ''}${m === 'tiang-geser' ? ' · tinggi bisa diatur' : ''}`;
  },

  build: (p) => {
    const m = model(p);
    const D = num(p, 'dalam', 40);
    const W = m === 'pojok' ? Math.max(num(p, 'panjang', 80), D + 30) : num(p, 'panjang', 80);
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
    const ha = num(p, 'tinggiAtas', 60);
    let Htot = H;
    let Dtot = D;

    /** Rangka daun lipat: belakang (z0), depan, kiri, kanan, tengah bila panjang */
    const leaf = (z0: number, depth: number) => {
      add('daun-belakang', 'x', 0, y, z0 + L / 2, W, 'rail-x', 'Rangka daun belakang', t);
      add('daun-depan', 'x', 0, y, z0 + depth - L / 2, W, 'rail-x', 'Rangka daun depan', t);
      add('daun-kiri', 'z', L / 2, y, z0 + L, depth - 2 * L, 'rail-z', 'Rangka daun kiri', t);
      add('daun-kanan', 'z', W - L / 2, y, z0 + L, depth - 2 * L, 'rail-z', 'Rangka daun kanan', t);
      if (W > 90) add('daun-tengah', 'z', W / 2, y, z0 + L, depth - 2 * L, 'rail-z', 'Rangka daun tengah', t);
    };
    /** Rangka daun tetap: rel tembok jadi sisi belakang rangka daun */
    const fixedLeaf = () => {
      add('rel-dinding', 'x', 0, y, L / 2, W, 'rail-x', 'Rel dinding (dibaut ke tembok)', t);
      add('daun-depan', 'x', 0, y, D - L / 2, W, 'rail-x', 'Rangka daun depan', t);
      add('daun-kiri', 'z', L / 2, y, L, D - 2 * L, 'rail-z', 'Rangka daun kiri', t);
      add('daun-kanan', 'z', W - L / 2, y, L, D - 2 * L, 'rail-z', 'Rangka daun kanan', t);
      if (W > 90) add('daun-tengah', 'z', W / 2, y, L, D - 2 * L, 'rail-z', 'Rangka daun tengah', t);
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
    /** Posisi tiang menempel tembok: 2 tiang, 3 bila panjang */
    const postXs = (n: number) => Array.from({ length: n }, (_, i) => L / 2 + ((W - L) * i) / (n - 1));
    /** Palang tembok dipotong per bentang: ujungnya menempel rata di sisi tiang (tidak menembus tiang tengah) */
    const span = (xs: number[], id: string, yy: number, label: string) =>
      xs.slice(1).forEach((x1, i) => {
        const x0 = xs[i] + L / 2;
        add(xs.length > 2 ? `${id}-${i}` : id, 'x', x0, yy, L / 2, x1 - L / 2 - x0, 'rail-x', xs.length > 2 ? `${label} ${i ? 'kanan' : 'kiri'}` : label, t);
      });
    /** Batang miring siku: dari sisi depan tiang (z = face) naik ke bawah lengan di z = ze */
    const brace = (id: string, x: number, ya: number, face: number, ze: number, label: string) => {
      const yb = y - L / 2;
      line(id, [x, ya, zButtFace(face, ya, yb, ze, L / 2)], [x, yb, ze], 'custom', label, t);
    };

    if (m === 'rel' || m === 'kaki-depan' || m === 'lipat-bangku') {
      // Rel dinding (dibaut ke tembok) + tiang pendek penahan di ujungnya
      add('rel-dinding', 'x', 0, y, L / 2, W, 'rail-x', 'Rel dinding (dibaut ke tembok)', t);
      if (m === 'lipat-bangku') {
        // Rel kedua untuk bangku; tiang dinding menyambung kedua rel
        const Hb = Math.min(num(p, 'tinggiBangku', 45), H - 20);
        const Db = Math.max(3 * L + 5, Math.min(num(p, 'dalamBangku', 30), Hb - 5));
        const yb = Hb - b - L / 2;
        add('rel-bangku', 'x', 0, yb, L / 2, W, 'rail-x', 'Rel bangku (dibaut ke tembok)', t);
        [L / 2, W - L / 2].forEach((x, i) => add(`tiang-dinding-${i}`, 'y', x, yb + L / 2, L / 2, y - yb - L, 'post', `Tiang dinding ${i ? 'kanan' : 'kiri'} (antara rel)`, t));
        add('bangku-belakang', 'x', 0, yb, L + L / 2, W, 'rail-x', 'Rangka bangku belakang', t);
        add('bangku-depan', 'x', 0, yb, Db - L / 2, W, 'rail-x', 'Rangka bangku depan', t);
        add('bangku-kiri', 'z', L / 2, yb, 2 * L, Db - 3 * L, 'rail-z', 'Rangka bangku kiri', t);
        add('bangku-kanan', 'z', W - L / 2, yb, 2 * L, Db - 3 * L, 'rail-z', 'Rangka bangku kanan', t);
        if (W > 90) add('bangku-tengah', 'z', W / 2, yb, 2 * L, Db - 3 * L, 'rail-z', 'Rangka bangku tengah', t);
        hinges.push({
          id: 'engsel-bangku',
          memberId: 'bangku-belakang',
          partnerId: 'rel-bangku',
          mode: 'edge',
          type: hingeType,
          pos: 0,
          side: 'end',
          foldAxis: 'y',
          foldSign: -1,
          carry: true,
          label: 'Engsel bangku (dilipat turun)',
        });
        if (b > 0) boards.push({ ...board('bangku', 'Papan dudukan bangku', 0, W, yb + L / 2, yb + L / 2 + b, L, Db), attachTo: 'bangku-depan' });
      } else {
        add('plat-dinding-kiri', 'y', L / 2, y - 25 - L / 2, L / 2, 25, 'post', 'Tiang dinding kiri', t);
        add('plat-dinding-kanan', 'y', W - L / 2, y - 25 - L / 2, L / 2, 25, 'post', 'Tiang dinding kanan', t);
      }
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
      postXs(n).forEach((x, i) => {
        const nm = side(n, i);
        add(`siku-tiang-${i}`, 'y', x, y - L / 2 - hs, L / 2, hs, 'post', `Tiang siku ${nm} (dibaut ke tembok)`, t);
        add(`siku-lengan-${i}`, 'z', x, y, L, D - 2 * L, 'rail-z', `Lengan siku ${nm}`, t);
        // Ujung bawah dipotong datar: sudut belakangnya pas menempel di sisi depan tiang (tidak masuk ke tiang)
        brace(`siku-miring-${i}`, x, y - L / 2 - hs + L, L, D * 0.72, `Batang miring siku ${nm}`);
      });
      if (b > 0) boards.push(board('daun-meja', 'Daun meja', 0, W, yTop, H, 0, D));
    } else if (m === 'tiang') {
      const n = W > 120 ? 3 : 2;
      const xs = postXs(n);
      add('rel-dinding', 'x', 0, y, L / 2, W, 'rail-x', 'Gelagar belakang (menempel tembok)', t);
      add('daun-depan', 'x', 0, y, D - L / 2, W, 'rail-x', 'Rangka daun depan', t);
      xs.forEach((x, i) => {
        const nm = side(n, i);
        add(`tiang-${i}`, 'y', x, 0, L / 2, y - L / 2, 'post', `Tiang lantai ${nm} (dibaut ke tembok)`, t);
        add(`lengan-${i}`, 'z', x, y, L, D - 2 * L, 'rail-z', `Lengan menjorok ${nm}`, t);
      });
      span(xs, 'palang-bawah', 10, 'Palang bawah (menempel tembok)');
      span(xs, 'palang-tengah', y / 2, 'Palang tengah (menempel tembok)');
      if (b > 0) boards.push(board('daun-meja', 'Daun meja', 0, W, yTop, H, 0, D));
    } else if (m === 'topang') {
      // Batang miring: kaki bawah di lantai dekat tembok (sudut belakang potongan pas di bidang tembok),
      // ujung atas dipotong datar menempel di bawah rangka daun samping / tengah
      fixedLeaf();
      const xs = W > 120 ? [L / 2, W / 2, W - L / 2] : [L / 2, W - L / 2];
      xs.forEach((x, i) => {
        const nm = side(xs.length, i);
        brace(`topang-${i}`, x, 0, 0.3, D * 0.72, `Kaki miring ${nm} (bawah di lantai dekat tembok)`);
      });
      if (b > 0) boards.push(board('daun-meja', 'Daun meja', 0, W, yTop, H, 0, D));
    } else if (m === 'kaki-v') {
      // Tiap kaki V: dua batang miring di bidang depan, bawahnya bersebelahan di satu titik lantai,
      // atasnya dipotong datar menempel di bawah rangka daun depan
      fixedLeaf();
      const yb = y - L / 2;
      const zf = D - L / 2;
      const ins = Math.min(14, W / 4);
      const s = Math.max(2, Math.min(8, ins - L - 0.5));
      const hw = ((L / 2) * Math.hypot(s, yb)) / yb;
      const g = hw + 0.2;
      [ins, W - ins].forEach((x0, i) => {
        const nm = i ? 'kanan' : 'kiri';
        line(`kaki-v-${i}-a`, [x0 - g, 0, zf], [x0 - s, yb, zf], 'custom', `Kaki V ${nm} (batang luar)`, t);
        line(`kaki-v-${i}-b`, [x0 + g, 0, zf], [x0 + s, yb, zf], 'custom', `Kaki V ${nm} (batang dalam)`, t);
      });
      if (b > 0) boards.push(board('daun-meja', 'Daun meja', 0, W, yTop, H, 0, D));
    } else if (m === 'kaki-tengah') {
      fixedLeaf();
      const f = Math.min(60, Math.max(30, W * 0.5));
      add('tapak', 'x', W / 2 - f / 2, L / 2, D - L / 2, f, 'rail-x', 'Tapak lantai kaki tengah', t);
      add('kaki-tengah', 'y', W / 2, L, D - L / 2, y - L / 2 - L, 'post', 'Kaki tengah depan (berdiri di tapak)', t);
      if (b > 0) boards.push(board('daun-meja', 'Daun meja', 0, W, yTop, H, 0, D));
    } else if (m === 'gantung-plafon') {
      // Batang gantung menempel di muka depan rangka daun depan (di luar papan), naik ke plat plafon
      fixedLeaf();
      const Hc = Math.max(num(p, 'tinggiPlafon', 280), H + 40);
      const pt = 0.5;
      const zr = D + L / 2;
      [L / 2 + 6, W - L / 2 - 6].forEach((x, i) => {
        add(`gantung-${i}`, 'y', x, y - L / 2, zr, Hc - pt - (y - L / 2), 'post', `Batang gantung ${i ? 'kanan' : 'kiri'} (ke plafon)`, t);
        boards.push({ ...board(`plat-plafon-${i}`, `Plat plafon ${i ? 'kanan' : 'kiri'}`, x - 5, x + 5, Hc - pt, Hc, zr - 5, zr + 5), steelMm: 5 });
      });
      if (b > 0) boards.push(board('daun-meja', 'Daun meja', 0, W, yTop, H, 0, D));
      Htot = Hc;
      Dtot = D + L;
    } else if (m === 'tarik') {
      // Tiang tembok di kedua ujung naik di atas daun; lengan samping menjorok dari tiang;
      // batang tarik dari pucuk tiang turun ke atas lengan dekat ujung depan (di luar papan)
      const yp0 = y - L / 2 - 15;
      const ypTop = y + L / 2 + ha;
      add('rel-dinding', 'x', L, y, L / 2, W - 2 * L, 'rail-x', 'Rel dinding (dibaut ke tembok)', t);
      add('daun-depan', 'x', L, y, D - L / 2, W - 2 * L, 'rail-x', 'Rangka daun depan', t);
      if (W > 90) add('daun-tengah', 'z', W / 2, y, L, D - 2 * L, 'rail-z', 'Rangka daun tengah', t);
      [L / 2, W - L / 2].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        add(`tiang-tarik-${i}`, 'y', x, yp0, L / 2, ypTop - yp0, 'post', `Tiang tembok ${nm} (dibaut ke tembok)`, t);
        add(`lengan-${i}`, 'z', x, y, L, D - L, 'rail-z', `Lengan daun ${nm}`, t);
        const ya = y + L / 2; // muka atas lengan
        const yb = ypTop - 3;
        const zb = D - L - 0.5;
        line(`tarik-${i}`, [x, ya, zb], [x, yb, zButtFace(L, ya, yb, zb, L / 2)], 'custom', `Batang tarik ${nm}`, t);
      });
      if (b > 0) boards.push(board('daun-meja', 'Daun meja (di antara lengan)', L, W - L, yTop, H, 0, D));
      Htot = Math.max(H, ypTop);
    } else if (m === 'pojok') {
      // Sayap belakang (sepanjang tembok belakang) + sayap samping (sepanjang tembok kiri), satu kaki di siku dalam
      const S = Math.max(num(p, 'panjangSayap', 100), D + 30);
      add('rel-dinding', 'x', 0, y, L / 2, W, 'rail-x', 'Rel tembok belakang (dibaut)', t);
      add('rel-samping', 'z', L / 2, y, L, S - L, 'rail-z', 'Rel tembok samping (dibaut)', t);
      add('daun-depan', 'x', D - L, y, D - L / 2, W - (D - L), 'rail-x', 'Rangka depan sayap belakang', t);
      add('sayap-depan', 'z', D - L / 2, y, D, S - D, 'rail-z', 'Rangka depan sayap samping', t);
      add('daun-kanan', 'z', W - L / 2, y, L, D - 2 * L, 'rail-z', 'Rangka ujung sayap belakang', t);
      add('sayap-ujung', 'x', L, y, S - L / 2, D - 2 * L, 'rail-x', 'Rangka ujung sayap samping', t);
      add('daun-siku', 'z', D - L / 2, y, L, D - 2 * L, 'rail-z', 'Rangka pojok (ke tembok belakang)', t);
      add('sayap-siku', 'x', L, y, D - L / 2, D - 2 * L, 'rail-x', 'Rangka pojok (ke tembok samping)', t);
      if (W - D > 100) add('daun-tengah', 'z', (D + W) / 2, y, L, D - 2 * L, 'rail-z', 'Rangka tengah sayap belakang', t);
      if (S - D > 100) add('sayap-tengah', 'x', L, y, (D + S) / 2, D - 2 * L, 'rail-x', 'Rangka tengah sayap samping', t);
      add('kaki-pojok', 'y', D - L / 2, 0, D - L / 2, y - L / 2, 'post', 'Kaki siku dalam', t);
      add('plat-dinding-kanan', 'y', W - L / 2, y - 25 - L / 2, L / 2, 25, 'post', 'Tiang dinding belakang (ujung)', t);
      add('plat-dinding-samping', 'y', L / 2, y - 25 - L / 2, S - L / 2, 25, 'post', 'Tiang dinding samping (ujung)', t);
      if (b > 0) {
        boards.push(board('daun-meja', 'Daun meja sayap belakang', 0, W, yTop, H, 0, D));
        boards.push(board('daun-sayap', 'Daun meja sayap samping', 0, D, yTop, H, D, S));
      }
      Dtot = S;
    } else if (m === 'tiang-geser') {
      // Rel tegak dari lantai; penjepit geser (dikunci pin) di depan rel membawa lengan + batang miring
      const Hr = y + L / 2 + ha;
      const xs = [L / 2, W - L / 2];
      const hs = Math.max(25, Math.round(D * 0.7));
      const ys0 = y - L / 2 - hs;
      xs.forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        add(`rel-tegak-${i}`, 'y', x, 0, L / 2, Hr, 'post', `Rel tegak ${nm} (dari lantai, dibaut ke tembok)`, t);
        add(`geser-${i}`, 'y', x, ys0, L + L / 2, hs, 'post', `Penjepit geser ${nm} (dikunci pin)`, t);
        add(`lengan-${i}`, 'z', x, y, L, D - 2 * L, 'rail-z', `Lengan daun ${nm}`, t);
        brace(`siku-miring-${i}`, x, ys0 + L, 2 * L, D * 0.72, `Batang miring ${nm}`);
      });
      add('daun-depan', 'x', 0, y, D - L / 2, W, 'rail-x', 'Rangka daun depan', t);
      add('daun-belakang', 'x', L, y, L + L / 2, W - 2 * L, 'rail-x', 'Rangka daun belakang', t);
      if (W > 90) add('daun-tengah', 'z', W / 2, y, 2 * L, D - 3 * L, 'rail-z', 'Rangka daun tengah', t);
      span(xs, 'palang-atas', Hr - L / 2, 'Palang atas rel (menempel tembok)');
      span(xs, 'palang-bawah', 10, 'Palang bawah rel (menempel tembok)');
      if (b > 0) boards.push(board('daun-meja', 'Daun meja', 0, W, yTop, H, L, D));
      Htot = Math.max(H, Hr);
    } else if (m === 'rak-atas') {
      const n = W > 120 ? 3 : 2;
      const xs = postXs(n);
      const nA = Math.min(3, Math.max(1, Math.round(num(p, 'tingkatAtas', 2))));
      const Da = Math.max(2 * L + 8, Math.min(num(p, 'dalamAtas', 22), D));
      const levels = Array.from({ length: nA }, (_, k) => y + (ha * (k + 1)) / nA);
      const yTopLvl = levels[levels.length - 1];
      xs.forEach((x, i) => {
        const nm = side(n, i);
        add(`tiang-${i}`, 'y', x, 0, L / 2, yTopLvl + L / 2, 'post', `Tiang ${nm} (dari lantai, dibaut ke tembok)`, t);
        add(`lengan-${i}`, 'z', x, y, L, D - 2 * L, 'rail-z', `Lengan meja ${nm}`, t);
        levels.forEach((yy, k) => add(`lengan-rak-${k}-${i}`, 'z', x, yy, L, Da - 2 * L, 'rail-z', `Lengan rak ${k + 1} ${nm}`, t));
      });
      add('daun-depan', 'x', 0, y, D - L / 2, W, 'rail-x', 'Rangka meja depan', t);
      span(xs, 'palang-meja', y, 'Palang belakang meja (menempel tembok)');
      span(xs, 'palang-bawah', 10, 'Palang bawah (menempel tembok)');
      levels.forEach((yy, k) => {
        add(`rak-depan-${k}`, 'x', 0, yy, Da - L / 2, W, 'rail-x', `Rangka depan rak ${k + 1}`, t);
        span(xs, `palang-rak-${k}`, yy, `Palang belakang rak ${k + 1}`);
        if (b > 0) boards.push(board(`rak-${k}`, `Papan rak atas ${k + 1}`, 0, W, yy + L / 2, yy + L / 2 + b, L, Da));
      });
      if (b > 0) boards.push(board('daun-meja', 'Daun meja', 0, W, yTop, H, L, D));
      Htot = yTopLvl + L / 2 + b;
    } else if (m === 'papan-alat') {
      const n = W > 120 ? 3 : 2;
      const xs = postXs(n);
      const yTopP = y + ha; // as palang kisi teratas
      const hs = Math.max(25, Math.round(D * 0.8));
      xs.forEach((x, i) => {
        const nm = side(n, i);
        add(`tiang-${i}`, 'y', x, 0, L / 2, yTopP + L / 2, 'post', `Tiang ${nm} (dari lantai, dibaut ke tembok)`, t);
        add(`lengan-${i}`, 'z', x, y, L, D - 2 * L, 'rail-z', `Lengan meja ${nm}`, t);
        brace(`siku-miring-${i}`, x, y - L / 2 - hs + L, L, D * 0.72, `Batang miring ${nm}`);
      });
      add('daun-depan', 'x', 0, y, D - L / 2, W, 'rail-x', 'Rangka meja depan', t);
      span(xs, 'palang-meja', y, 'Palang belakang meja (menempel tembok)');
      span(xs, 'palang-bawah', 10, 'Palang bawah (menempel tembok)');
      // Kisi: palang datar di antara tiang (bidang tembok), jeruji tegak 15×15 ditumpuk di muka depannya
      const yh0 = H + 12;
      const nH = Math.max(2, Math.round((yTopP - yh0) / 15) + 1);
      for (let k = 0; k < nH; k++) span(xs, `kisi-datar-${k}`, yh0 + ((yTopP - yh0) * k) / (nH - 1), `Palang kisi ${k + 1}`);
      const j = 1.5;
      xs.slice(1).forEach((x1, i) => {
        const a = xs[i] + L / 2;
        const bay = x1 - L / 2 - a;
        const nv = Math.max(1, Math.round(bay / 20) - 1);
        for (let v = 1; v <= nv; v++)
          add(`jeruji-${i}-${v}`, 'y', a + (bay * v) / (nv + 1), yh0 - L / 2, L + j / 2, yTopP - yh0 + L, 'post', 'Jeruji kisi (tempat kait)', [15, 15]);
      });
      if (b > 0) boards.push(board('daun-meja', 'Daun meja kerja', 0, W, yTop, H, L, D));
      Htot = yTopP + L / 2;
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
        // dudukan rak kecil dalam kotak: palang samping di antara tiang kotak, papan rak duduk di atasnya
        add(`kotak-samping-rak-${i}`, 'z', x, y0 + hb / 2 - L / 2, L, kd - 2 * L, 'rail-z', `Palang dudukan rak ${nm}`, t);
      });
      add('kotak-atas-belakang', 'x', 0, y1, L / 2, W, 'rail-x', 'Palang atas belakang (dibaut ke tembok)', t);
      add('kotak-atas-depan', 'x', 0, y1, kd - L / 2, W, 'rail-x', 'Palang atas depan', t);
      add('kotak-bawah-belakang', 'x', 0, y0, L / 2, W, 'rail-x', 'Palang bawah belakang (dibaut ke tembok)', t);
      add('kotak-bawah-depan', 'x', 0, y0, kd - L / 2, W, 'rail-x', 'Palang bawah depan (engsel daun)', t);
      leaf(kd, D);
      // Penahan dipasang di sisi DALAM tiang depan & rangka daun samping (bersebelahan, tidak menembus tiang)
      const ps = 1.5;
      [L + ps / 2, W - L - ps / 2].forEach((x, i) =>
        line(`penahan-${i}`, [x, y1 - 8, kd - L / 2], [x, y, kd + D * 0.65], 'custom', `Batang penahan miring ${i ? 'kanan' : 'kiri'} (rantai / stay)`, [15, 15])
      );
      hinges.push(wallHinge('kotak-bawah-depan', 1, 'Engsel daun (dilipat naik menutup kotak)'));
      if (b > 0) {
        boards.push({ ...board('daun-meja', 'Daun meja', 0, W, yTop, H, kd, kd + D), attachTo: 'daun-depan' });
        boards.push(board('kotak-tutup-atas', 'Papan atas kotak', 0, W, y1 + L / 2, y1 + L / 2 + b, 0, kd + 1));
        boards.push(board('kotak-rak', 'Rak kecil dalam kotak', 0, W, y0 + hb / 2, y0 + hb / 2 + b, L, kd - L));
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
    const W = num(p, 'panjang');
    const H = num(p, 'tinggi');
    if (D > 45 && str(p, 'jumlahEngsel') === 'piano' && ((m === 'rel' && bool(p, 'lipat')) || m === 'lipat-bangku'))
      out.push({ level: 'warn', message: 'Daun dalam dengan engsel piano saja mudah melendut di depan. Siku lipat kunci lebih kuat.', fix: { label: 'Pakai siku lipat', params: { jumlahEngsel: 'siku' } } });
    if ((m === 'rel' && bool(p, 'lipat')) || m === 'kaki-depan')
      if (H - D < 10) out.push({ level: 'warn', message: 'Saat dilipat, daun meja hampir menyentuh lantai.', fix: { label: 'Kedalaman 40 cm', params: { dalam: 40 } } });
    if (m === 'rel' && D > 50)
      out.push({ level: 'warn', message: 'Daun lebih dari 50 cm tanpa kaki / siku mudah melendut saat ditumpu siku.', fix: { label: 'Kedalaman 45 cm', params: { dalam: 45 } } });
    if (m === 'tiang' && D > 50)
      out.push({ level: 'warn', message: 'Lengan menjorok lebih dari 50 cm tanpa kaki depan: daun bisa turun di depan. Pakai model siku atau kaki depan.', fix: { label: 'Kedalaman 45 cm', params: { dalam: 45 } } });
    if (m === 'kotak' && D > 55)
      out.push({ level: 'warn', message: 'Daun dalam membuat kotak dinding tinggi dan berat di tembok.', fix: { label: 'Kedalaman 45 cm', params: { dalam: 45 } } });
    if (m === 'lipat-bangku') {
      const Hb = num(p, 'tinggiBangku', 45);
      if (H - Hb < 25) out.push({ level: 'warn', message: 'Meja terlalu dekat dengan bangku: lutut tidak masuk.', fix: { label: `Bangku ${H - 30} cm`, params: { tinggiBangku: Math.max(35, H - 30) } } });
      if (Hb - num(p, 'dalamBangku', 30) < 8) out.push({ level: 'warn', message: 'Saat dilipat turun, bangku hampir menyentuh lantai.', fix: { label: 'Dudukan 30 cm', params: { dalamBangku: 30, tinggiBangku: Math.max(Hb, 45) } } });
      out.push({ level: 'info', message: 'Bangku tanpa kaki: pakai siku lipat kunci dan baut fischer minimal 4 titik di rel bangku.' });
    }
    if (m === 'topang') {
      if (D > 55) out.push({ level: 'warn', message: 'Daun dalam membuat kaki miring sangat landai dan mudah bergeser di lantai.', fix: { label: 'Kedalaman 45 cm', params: { dalam: 45 } } });
      out.push({ level: 'info', message: 'Ujung bawah kaki miring diberi plat kecil dan dibaut ke lantai atau kaki tembok supaya tidak tergelincir.' });
    }
    if (m === 'kaki-tengah' && W > 120)
      out.push({ level: 'warn', message: 'Satu kaki di tengah untuk meja lebih dari 120 cm: ujung kiri dan kanan depan bisa melendut.', fix: { label: 'Panjang 100 cm', params: { panjang: 100 } } });
    if (m === 'kaki-v' && D > 50)
      out.push({ level: 'warn', message: 'Kaki V hanya di tepi depan: daun lebih dari 50 cm terasa goyang di tengah.', fix: { label: 'Kedalaman 45 cm', params: { dalam: 45 } } });
    if (m === 'gantung-plafon') {
      if (W > 140) out.push({ level: 'warn', message: 'Hanya dua batang gantung di depan: meja lebih dari 140 cm melendut di tengah.', fix: { label: 'Panjang 120 cm', params: { panjang: 120 } } });
      out.push({ level: 'info', message: 'Plat plafon dibaut ke balok kayu / cor beton, bukan ke gypsum.' });
    }
    if (m === 'tarik') {
      if (D > 50) out.push({ level: 'warn', message: 'Lengan lebih dari 50 cm membuat batang tarik sangat landai dan kurang kuat.', fix: { label: 'Kedalaman 45 cm', params: { dalam: 45 } } });
      if (W > 140) out.push({ level: 'warn', message: 'Batang tarik hanya di kedua ujung: meja lebih dari 140 cm melendut di tengah.', fix: { label: 'Panjang 120 cm', params: { panjang: 120 } } });
      if (num(p, 'tinggiAtas', 60) < 45) out.push({ level: 'warn', message: 'Tiang terlalu pendek di atas daun: batang tarik jadi landai dan lemah.', fix: { label: 'Tiang 60 cm', params: { tinggiAtas: 60 } } });
    }
    if (m === 'pojok' && num(p, 'panjangSayap', 100) < D + 30)
      out.push({ level: 'warn', message: 'Sayap samping terlalu pendek dibanding kedalaman meja.', fix: { label: `Sayap ${D + 50} cm`, params: { panjangSayap: D + 50 } } });
    if (m === 'pojok' && W < D + 30)
      out.push({ level: 'warn', message: 'Sayap belakang terlalu pendek dibanding kedalaman meja.', fix: { label: `Panjang ${D + 60} cm`, params: { panjang: D + 60 } } });
    if (m === 'rak-atas') {
      if (num(p, 'dalamAtas', 22) > D) out.push({ level: 'warn', message: 'Rak atas lebih dalam dari meja: kepala bisa terbentur.', fix: { label: 'Rak 22 cm', params: { dalamAtas: Math.min(22, D) } } });
      if (num(p, 'tinggiAtas', 60) / Math.max(1, Math.round(num(p, 'tingkatAtas', 2))) < 25)
        out.push({ level: 'warn', message: 'Jarak antar rak atas kurang dari 25 cm: buku / toples tidak muat.', fix: { label: 'Kurangi 1 rak', params: { tingkatAtas: Math.max(1, Math.round(num(p, 'tingkatAtas', 2)) - 1) } } });
    }
    if (m === 'papan-alat') out.push({ level: 'info', message: 'Kait S / kait alat dipasang di palang kisi; jeruji tegak menahan supaya kait tidak bergeser.' });
    if (m === 'tiang-geser') {
      if (D > 60) out.push({ level: 'warn', message: 'Daun sangat dalam membebani penjepit geser.', fix: { label: 'Kedalaman 55 cm', params: { dalam: 55 } } });
      out.push({ level: 'info', message: `Rel tegak setinggi ±${Math.round(H + num(p, 'tinggiAtas', 60))} cm. Lubangi rel tiap 5 cm; daun dipindah dengan mencabut pin penjepit.` });
    }
    if (m === 'kaki-depan') out.push({ level: 'info', message: 'Kaki depan dilipat dulu ke bawah daun, lalu daun dilipat turun menempel dinding.' });
    if (m === 'kotak') out.push({ level: 'info', message: `Kotak dinding setinggi ±${D + 8} cm di atas daun: daun dilipat naik menjadi pintu kotak.` });
    const floorPost = ['tiang', 'tiang-geser', 'rak-atas', 'papan-alat'].includes(m);
    out.push({ level: 'info', message: floorPost ? 'Tiang dibaut ke tembok minimal 2 titik per tiang supaya lengan tidak mengungkit.' : 'Rel / siku dibaut ke tembok bata/beton dengan fischer minimal 4 titik.' });
    if (folds(p)) out.push({ level: 'info', message: 'Klik engsel di 3D untuk melipat.' });
    return out;
  },
};
