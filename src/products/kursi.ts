import { Board, Params, ProductBuild, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, board, bool, materialParams, memberFactory, num, str } from './common';

type P3 = [number, number, number];

/**
 * Model rangka yang benar-benar dipakai. Beberapa model hanya cocok untuk jenis tertentu:
 * kantilever hanya kursi, tiang tunggal hanya stool, rangka samping + lengan hanya kursi / bangku.
 */
const modelOf = (p: Params) => {
  const jenis = str(p, 'jenis', 'kursi');
  const m = str(p, 'rangka', 'empat');
  if (m === 'tiang') return jenis === 'stool' ? 'tiang' : 'empat';
  if (m === 'kantilever') return jenis === 'kursi' ? 'kantilever' : 'empat';
  if (m === 'lengan') return jenis === 'stool' ? 'kotak' : 'lengan';
  return ['empat', 'sled', 'kotak', 'silang', 'a'].includes(m) ? m : 'empat';
};
const sideTableOf = (p: Params) => str(p, 'jenis') === 'bangku' && modelOf(p) === 'empat' && bool(p, 'mejaSamping');
const frontTablesOf = (p: Params) => (str(p, 'jenis') === 'bangku' && modelOf(p) === 'empat' && !sideTableOf(p) ? Math.round(num(p, 'mejaDepan', 0)) : 0);
const backOf = (p: Params) => modelOf(p) !== 'tiang' && !sideTableOf(p) && bool(p, 'sandaran');
const armsOf = (p: Params) => modelOf(p) === 'empat' && backOf(p) && str(p, 'jenis') !== 'stool' && bool(p, 'sandaranTangan');

/**
 * Kursi / bangku / stool. Model rangka: empat kaki (tegak / melebar), kaki seluncur (sled), rangka kotak samping,
 * kaki silang X, kaki A, kantilever, rangka samping + lengan (kursi santai / bangku taman), tiang tunggal (stool).
 * Tambahan: sandaran papan / jeruji, sandaran tangan, pijakan, kaki tengah, rak bawah, meja samping, meja kecil depan.
 */
export const KURSI: ProductDef = {
  id: 'kursi',
  name: 'Kursi',
  tagline: 'kursi · bangku · stool bar',
  icon: 'M18 4v32M42 22v14M18 22h24M18 36',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['jenis', 'lebar', 'dalam', 'tinggiDudukan'] },
    {
      id: 'bentuk',
      title: 'Bentuk',
      keys: ['rangka', 'dudukan', 'bentukDudukan', 'sandaran', 'modelSandaran', 'tinggiSandaran', 'miringSandaran', 'sandaranTangan', 'sudutKaki', 'palangKaki', 'pijakan', 'tinggiPijakan', 'kakiTengah', 'rakBawah'],
    },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Tambahan', keys: ['mejaSamping', 'diameterMeja', 'tinggiMeja', 'mejaDepan', 'lebarMejaDepan', 'tinggiMejaDepan'] },
  ],
  params: [
    {
      key: 'jenis',
      label: 'Jenis',
      type: 'choice',
      options: [
        { value: 'kursi', label: 'Kursi', desc: 'Untuk 1 orang' },
        { value: 'bangku', label: 'Bangku panjang', desc: 'Untuk 2–4 orang' },
        { value: 'stool', label: 'Stool / kursi bar', desc: 'Tanpa sandaran atau sandaran rendah' },
      ],
    },
    { key: 'lebar', label: 'Lebar dudukan', type: 'number', unit: 'cm', min: 28, max: 200, step: 1, marks: [{ value: 35, label: 'stool' }, { value: 45, label: 'kursi' }, { value: 120, label: 'bangku 2–3 org' }] },
    { key: 'dalam', label: 'Kedalaman dudukan', type: 'number', unit: 'cm', min: 25, max: 60, step: 1, marks: [{ value: 35, label: 'stool / bangku' }, { value: 42, label: 'kursi' }] },
    { key: 'tinggiDudukan', label: 'Tinggi dudukan', type: 'number', unit: 'cm', min: 25, max: 85, step: 1, help: 'Dari lantai sampai permukaan dudukan.', marks: [{ value: 45, label: 'meja makan' }, { value: 65, label: 'meja dapur' }, { value: 75, label: 'meja bar' }] },
    {
      key: 'rangka',
      label: 'Model rangka kaki',
      type: 'choice',
      options: [
        { value: 'empat', label: 'Empat kaki', desc: 'Kaki tegak / melebar di tiap sudut' },
        { value: 'sled', label: 'Kaki seluncur (sled)', desc: 'Rel di lantai + kaki miring, tidak menusuk lantai' },
        { value: 'kotak', label: 'Rangka kotak samping', desc: 'Sisi kiri & kanan berupa bingkai kotak tertutup' },
        { value: 'silang', label: 'Kaki silang X', desc: 'Dua kaki bersilang di tiap sisi' },
        { value: 'a', label: 'Kaki A', desc: 'Dua kaki bertemu di bawah tengah dudukan' },
        { value: 'kantilever', label: 'Kantilever', desc: 'Khusus kursi: tanpa kaki belakang, bertumpu di rel lantai' },
        { value: 'lengan', label: 'Rangka samping + lengan', desc: 'Kursi santai / bangku taman: rel lantai sampai sandaran tangan' },
        { value: 'tiang', label: 'Tiang tunggal', desc: 'Khusus stool: satu tiang tengah di atas kaki silang' },
      ],
    },
    {
      key: 'dudukan',
      label: 'Dudukan',
      type: 'choice',
      options: [
        { value: 'papan', label: 'Papan utuh', desc: 'Kayu / multiplek / HPL' },
        { value: 'bilah', label: 'Bilah besi', desc: 'Pipa 40×20 berjajar, tahan hujan' },
      ],
      showIf: (p) => modelOf(p) !== 'tiang',
    },
    {
      key: 'bentukDudukan',
      label: 'Bentuk dudukan',
      type: 'choice',
      options: [
        { value: 'kotak', label: 'Kotak' },
        { value: 'bulat', label: 'Bundar', desc: 'Diameter = lebar dudukan' },
      ],
      showIf: (p) => p.jenis === 'stool' && (p.dudukan !== 'bilah' || modelOf(p) === 'tiang'),
    },
    { key: 'sandaran', label: 'Sandaran punggung', type: 'toggle', help: 'Stool bar: sandaran rendah ±30 cm di atas dudukan.', showIf: (p) => modelOf(p) !== 'tiang' && !sideTableOf(p) },
    {
      key: 'modelSandaran',
      label: 'Model sandaran',
      type: 'choice',
      options: [
        { value: 'papan', label: 'Papan', desc: 'Satu papan di antara dua palang' },
        { value: 'jeruji', label: 'Jeruji besi tegak', desc: 'Batang-batang tegak berjajar, tanpa papan' },
      ],
      showIf: (p) => backOf(p),
    },
    { key: 'tinggiSandaran', label: 'Tinggi sandaran dari lantai', type: 'number', unit: 'cm', min: 60, max: 125, step: 1, marks: [{ value: 85, label: 'kursi' }, { value: 105, label: 'stool bar' }], showIf: (p) => backOf(p) },
    { key: 'miringSandaran', label: 'Kemiringan sandaran', type: 'number', unit: '°', min: 0, max: 25, step: 1, help: '0 = tegak. 10–15° nyaman untuk makan & santai.', marks: [{ value: 0, label: 'tegak' }, { value: 12, label: 'nyaman' }], showIf: (p) => backOf(p) },
    { key: 'sandaranTangan', label: 'Sandaran tangan', type: 'toggle', help: 'Lengan di kiri & kanan, ±22 cm di atas dudukan.', showIf: (p) => p.jenis !== 'stool' && modelOf(p) === 'empat' && backOf(p) },
    { key: 'sudutKaki', label: 'Kaki melebar', type: 'number', unit: '°', min: 0, max: 12, step: 1, help: '0 = kaki tegak. Kaki melebar membuat kursi lebih stabil.', marks: [{ value: 0, label: 'tegak' }, { value: 6, label: 'melebar' }], showIf: (p) => modelOf(p) === 'empat' },
    { key: 'palangKaki', label: 'Palang penguat kaki', type: 'toggle', help: 'Supaya kaki tidak goyang.', showIf: (p) => p.jenis !== 'stool' && (modelOf(p) === 'empat' || modelOf(p) === 'kotak') },
    { key: 'pijakan', label: 'Pijakan kaki', type: 'toggle', help: 'Tempat menaruh kaki di kursi tinggi.', showIf: (p) => p.jenis === 'stool' },
    { key: 'tinggiPijakan', label: 'Tinggi pijakan dari lantai', type: 'number', unit: 'cm', min: 15, max: 45, step: 1, showIf: (p) => p.jenis === 'stool' && p.pijakan === true },
    { key: 'kakiTengah', label: 'Kaki tengah', type: 'toggle', help: 'Untuk bangku panjang.', showIf: (p) => p.jenis === 'bangku' },
    { key: 'rakBawah', label: 'Rak bawah', type: 'toggle', help: 'Papan di bawah dudukan, mis. untuk sepatu / tas.', showIf: (p) => p.jenis === 'bangku' && !sideTableOf(p) && (modelOf(p) === 'empat' || modelOf(p) === 'kotak') },
    ...materialParams(true),
    { key: 'mejaSamping', label: 'Meja samping bundar', type: 'toggle', help: 'Meja kecil di ujung kanan bangku untuk menaruh minuman.', showIf: (p) => p.jenis === 'bangku' && modelOf(p) === 'empat' },
    { key: 'diameterMeja', label: 'Diameter meja samping', type: 'number', unit: 'cm', min: 30, max: 60, step: 1, showIf: (p) => sideTableOf(p) },
    { key: 'tinggiMeja', label: 'Tinggi meja samping', type: 'number', unit: 'cm', min: 50, max: 80, step: 1, showIf: (p) => sideTableOf(p) },
    { key: 'mejaDepan', label: 'Meja kecil di atas dudukan', type: 'number', min: 0, max: 3, step: 1, help: 'Daun meja kecil bertiang dua yang naik dari depan dudukan, gaya bangku cafe trotoar. 0 = tanpa.', showIf: (p) => p.jenis === 'bangku' && modelOf(p) === 'empat' && !sideTableOf(p) },
    { key: 'lebarMejaDepan', label: 'Lebar meja kecil', type: 'number', unit: 'cm', min: 30, max: 60, step: 1, showIf: (p) => frontTablesOf(p) > 0 },
    { key: 'tinggiMejaDepan', label: 'Tinggi meja kecil', type: 'number', unit: 'cm', min: 62, max: 85, step: 1, showIf: (p) => frontTablesOf(p) > 0 },
  ],
  defaults: {
    jenis: 'kursi', rangka: 'empat', lebar: 45, dalam: 42, tinggiDudukan: 45, dudukan: 'papan', sandaran: true, modelSandaran: 'papan', tinggiSandaran: 85, miringSandaran: 10,
    sudutKaki: 0, palangKaki: true, bentukDudukan: 'kotak', sandaranTangan: false, rakBawah: false, pijakan: true, tinggiPijakan: 28, kakiTengah: false,
    mejaSamping: false, diameterMeja: 40, tinggiMeja: 60, mejaDepan: 0, lebarMejaDepan: 45, tinggiMejaDepan: 72, pipa: '20', papan: 'kayu', warna: '#1f2226',
  },
  groups: [
    { id: 'kursi-makan', name: 'Kursi makan / kerja', desc: 'Kursi 1 orang untuk meja makan, meja kerja dan cafe' },
    { id: 'kursi-santai', name: 'Kursi santai', desc: 'Kursi bersandaran tangan, kursi teras, kursi kantilever' },
    { id: 'stool-bar', name: 'Stool bar / counter', desc: 'Kursi tinggi untuk meja bar 105 cm dan meja dapur 90 cm' },
    { id: 'stool-pendek', name: 'Stool pendek', desc: 'Dingklik / stool rendah tanpa sandaran' },
    { id: 'bangku-panjang', name: 'Bangku panjang', desc: 'Bangku tanpa sandaran: ruang makan, teras, bangku sepatu' },
    { id: 'bangku-taman', name: 'Bangku taman & cafe', desc: 'Bangku bersandaran, bangku dengan meja samping / meja kecil' },
  ],
  signature: (p) => {
    const m = modelOf(p);
    const back = backOf(p) ? `sandaran-${str(p, 'modelSandaran', 'papan') === 'jeruji' ? 'jeruji' : 'papan'}` : 'tanpa-sandaran';
    return [str(p, 'jenis', 'kursi'), m, back, armsOf(p) ? 'tangan' : '', sideTableOf(p) ? 'meja-samping' : '', frontTablesOf(p) > 0 ? 'meja-depan' : ''].filter(Boolean).join('|');
  },
  presets: [
    // ---------- Kursi makan / kerja ----------
    {
      id: 'makan',
      group: 'kursi-makan',
      name: 'Kursi makan empat kaki',
      desc: 'empat kaki + palang H, sandaran papan miring',
      params: { jenis: 'kursi', rangka: 'empat', sandaran: true, modelSandaran: 'papan', miringSandaran: 10, palangKaki: true, pipa: '20' },
      sizes: [
        { label: 'Kursi makan', desc: 'dudukan 45 × 42, tinggi 45', params: { lebar: 45, dalam: 42, tinggiDudukan: 45, tinggiSandaran: 85, sudutKaki: 0 } },
        { label: 'Kursi cafe kaki melebar', desc: 'kaki melebar 6°, sandaran 12°', params: { lebar: 44, dalam: 42, tinggiDudukan: 45, tinggiSandaran: 80, miringSandaran: 12, sudutKaki: 6 } },
        { label: 'Kursi kerja / belajar', desc: 'dudukan 48 × 45, sandaran 90', params: { lebar: 48, dalam: 45, tinggiDudukan: 46, tinggiSandaran: 90, sudutKaki: 0 } },
        { label: 'Kursi anak / TK', desc: 'dudukan 32 × 30, tinggi 32', params: { lebar: 32, dalam: 30, tinggiDudukan: 32, tinggiSandaran: 62, sudutKaki: 0 } },
      ],
    },
    {
      id: 'makan-jeruji',
      group: 'kursi-makan',
      name: 'Kursi sandaran jeruji tinggi',
      desc: 'sandaran tinggi dari batang besi tegak berjajar, tanpa papan',
      params: { jenis: 'kursi', rangka: 'empat', sandaran: true, modelSandaran: 'jeruji', miringSandaran: 8, palangKaki: true, pipa: '20' },
      sizes: [
        { label: 'Kursi makan', desc: 'dudukan 45 × 42, sandaran 95', params: { lebar: 45, dalam: 42, tinggiDudukan: 45, tinggiSandaran: 95 } },
        { label: 'Kursi cafe', desc: 'dudukan 42 × 40, sandaran 85, kaki melebar', params: { lebar: 42, dalam: 40, tinggiDudukan: 45, tinggiSandaran: 85, sudutKaki: 5 } },
      ],
    },
    {
      id: 'kursi-sled',
      group: 'kursi-makan',
      name: 'Kursi kaki seluncur (sled)',
      desc: 'rel lantai kiri & kanan, kaki depan & belakang miring keluar',
      params: { jenis: 'kursi', rangka: 'sled', sandaran: true, modelSandaran: 'papan', miringSandaran: 10, pipa: '20' },
      sizes: [
        { label: 'Kursi makan', desc: 'dudukan 45 × 44, tinggi 45', params: { lebar: 45, dalam: 44, tinggiDudukan: 45, tinggiSandaran: 82 } },
        { label: 'Kursi kerja', desc: 'dudukan 48 × 46, sandaran 88', params: { lebar: 48, dalam: 46, tinggiDudukan: 46, tinggiSandaran: 88 } },
      ],
    },
    {
      id: 'kursi-silang',
      group: 'kursi-makan',
      name: 'Kursi kaki silang X',
      desc: 'kaki bersilang X di sisi kiri & kanan + palang tengah',
      params: { jenis: 'kursi', rangka: 'silang', sandaran: true, modelSandaran: 'papan', miringSandaran: 10, pipa: '20' },
      sizes: [
        { label: 'Kursi makan', desc: 'dudukan 45 × 42, tinggi 45', params: { lebar: 45, dalam: 42, tinggiDudukan: 45, tinggiSandaran: 82 } },
        { label: 'Kursi cafe dudukan bilah', desc: 'dudukan bilah besi, tahan hujan', params: { lebar: 44, dalam: 42, tinggiDudukan: 45, tinggiSandaran: 80, dudukan: 'bilah' } },
      ],
    },
    // ---------- Kursi santai ----------
    {
      id: 'kursi-tangan',
      group: 'kursi-santai',
      name: 'Kursi bersandaran tangan',
      desc: 'empat kaki, tiang depan naik jadi lengan kiri & kanan',
      params: { jenis: 'kursi', rangka: 'empat', sandaran: true, sandaranTangan: true, miringSandaran: 10, palangKaki: true, pipa: '20' },
      sizes: [
        { label: 'Kursi makan / kerja', desc: 'dudukan 50 × 45, tinggi 45', params: { lebar: 50, dalam: 45, tinggiDudukan: 45, tinggiSandaran: 85 } },
        { label: 'Kursi santai', desc: 'dudukan 55 × 50, tinggi 40', params: { lebar: 55, dalam: 50, tinggiDudukan: 40, tinggiSandaran: 80, miringSandaran: 15 } },
      ],
    },
    {
      id: 'kursi-santai',
      group: 'kursi-santai',
      name: 'Kursi santai rangka samping',
      desc: 'bingkai samping menerus: rel lantai, kaki belakang miring, lengan datar',
      params: { jenis: 'kursi', rangka: 'lengan', sandaran: true, modelSandaran: 'papan', miringSandaran: 15, pipa: '30' },
      sizes: [
        { label: 'Kursi teras', desc: 'dudukan 58 × 52, tinggi 38', params: { lebar: 58, dalam: 52, tinggiDudukan: 38, tinggiSandaran: 82 } },
        { label: 'Kursi tamu', desc: 'dudukan 55 × 50, tinggi 42', params: { lebar: 55, dalam: 50, tinggiDudukan: 42, tinggiSandaran: 85, miringSandaran: 12 } },
        { label: 'Kursi taman dudukan bilah', desc: 'bilah besi, tahan hujan', params: { lebar: 58, dalam: 52, tinggiDudukan: 38, tinggiSandaran: 82, dudukan: 'bilah' } },
      ],
    },
    {
      id: 'kursi-kantilever',
      group: 'kursi-santai',
      name: 'Kursi kantilever',
      desc: 'tanpa kaki belakang: rel lantai berbentuk U, kaki depan naik ke dudukan',
      params: { jenis: 'kursi', rangka: 'kantilever', sandaran: true, modelSandaran: 'papan', miringSandaran: 10, pipa: '30' },
      sizes: [
        { label: 'Kursi tamu / kantor', desc: 'dudukan 46 × 44, tinggi 45', params: { lebar: 46, dalam: 44, tinggiDudukan: 45, tinggiSandaran: 82 } },
        { label: 'Kursi santai rendah', desc: 'dudukan 52 × 48, tinggi 40', params: { lebar: 52, dalam: 48, tinggiDudukan: 40, tinggiSandaran: 80, miringSandaran: 14 } },
      ],
    },
    // ---------- Stool bar / counter ----------
    {
      id: 'bar',
      group: 'stool-bar',
      name: 'Stool bar empat kaki + pijakan',
      desc: 'empat kaki, pijakan keliling, tanpa sandaran',
      params: { jenis: 'stool', rangka: 'empat', sandaran: false, sudutKaki: 6, pijakan: true, pipa: '20' },
      sizes: [
        { label: 'Bar (meja 105), kaki melebar', desc: 'dudukan 75 cm', params: { lebar: 35, dalam: 35, tinggiDudukan: 75, tinggiPijakan: 32, sudutKaki: 6, bentukDudukan: 'kotak' } },
        { label: 'Counter (meja 90), kaki melebar', desc: 'dudukan 65 cm', params: { lebar: 35, dalam: 35, tinggiDudukan: 65, tinggiPijakan: 23, sudutKaki: 6, bentukDudukan: 'kotak' } },
        { label: 'Bar kaki tegak', desc: 'dudukan 75 cm, kaki tegak', params: { lebar: 35, dalam: 35, tinggiDudukan: 75, tinggiPijakan: 32, sudutKaki: 0, bentukDudukan: 'kotak' } },
        { label: 'Bar dudukan bundar', desc: 'ø32, dudukan 75 cm', params: { lebar: 32, dalam: 32, tinggiDudukan: 75, tinggiPijakan: 32, sudutKaki: 6, bentukDudukan: 'bulat' } },
        { label: 'Stool pendek', desc: 'dudukan 45 cm, tanpa pijakan', params: { lebar: 32, dalam: 32, tinggiDudukan: 45, pijakan: false, sudutKaki: 0, bentukDudukan: 'kotak' } },
      ],
    },
    {
      id: 'bar-sandar',
      group: 'stool-bar',
      name: 'Stool bar bersandaran',
      desc: 'sandaran rendah miring, pijakan keliling',
      params: { jenis: 'stool', rangka: 'empat', sandaran: true, miringSandaran: 8, sudutKaki: 4, pijakan: true, pipa: '20' },
      sizes: [
        { label: 'Bar (meja 105)', desc: 'dudukan 75, sandaran 105 cm', params: { lebar: 40, dalam: 38, tinggiDudukan: 75, tinggiSandaran: 105, tinggiPijakan: 32 } },
        { label: 'Counter (meja 90)', desc: 'dudukan 65, sandaran 95 cm', params: { lebar: 40, dalam: 38, tinggiDudukan: 65, tinggiSandaran: 95, tinggiPijakan: 23 } },
      ],
    },
    {
      id: 'stool-tiang',
      group: 'stool-bar',
      name: 'Stool tiang tunggal',
      desc: 'satu tiang tengah 40×40 di atas kaki silang lantai, pijakan kotak',
      params: { jenis: 'stool', rangka: 'tiang', sandaran: false, bentukDudukan: 'bulat', pijakan: true, lebar: 36, dalam: 36, tinggiDudukan: 75, tinggiPijakan: 30, pipa: '20' },
      sizes: [
        { label: 'Bar (meja 105)', desc: 'ø36, dudukan 75 cm', params: { lebar: 36, dalam: 36, tinggiDudukan: 75, tinggiPijakan: 30 } },
        { label: 'Counter (meja 90)', desc: 'ø36, dudukan 65 cm', params: { lebar: 36, dalam: 36, tinggiDudukan: 65, tinggiPijakan: 22 } },
        { label: 'Dudukan kotak', desc: '36 × 36, dudukan 75 cm', params: { lebar: 36, dalam: 36, tinggiDudukan: 75, tinggiPijakan: 30, bentukDudukan: 'kotak' } },
      ],
    },
    // ---------- Stool pendek ----------
    {
      id: 'stool-silang',
      group: 'stool-pendek',
      name: 'Stool kaki silang X',
      desc: 'dua kaki bersilang di kiri & kanan + palang tengah',
      params: { jenis: 'stool', rangka: 'silang', sandaran: false, pijakan: false, pipa: '20' },
      sizes: [
        { label: 'Stool duduk', desc: '40 × 32, tinggi 45', params: { lebar: 40, dalam: 32, tinggiDudukan: 45 } },
        { label: 'Dingklik rendah', desc: '36 × 28, tinggi 30', params: { lebar: 36, dalam: 28, tinggiDudukan: 30 } },
        { label: 'Stool ujung ranjang', desc: '80 × 35, tinggi 45', params: { lebar: 80, dalam: 35, tinggiDudukan: 45 } },
      ],
    },
    {
      id: 'stool-a',
      group: 'stool-pendek',
      name: 'Stool kaki A',
      desc: 'kaki depan & belakang bertemu di bawah tengah dudukan, palang mendatar',
      params: { jenis: 'stool', rangka: 'a', sandaran: false, pijakan: false, pipa: '20' },
      sizes: [
        { label: 'Stool duduk', desc: '40 × 34, tinggi 45', params: { lebar: 40, dalam: 34, tinggiDudukan: 45 } },
        { label: 'Dingklik rendah', desc: '36 × 30, tinggi 30', params: { lebar: 36, dalam: 30, tinggiDudukan: 30 } },
      ],
    },
    {
      id: 'stool-kotak',
      group: 'stool-pendek',
      name: 'Stool rangka kotak',
      desc: 'sisi kiri & kanan berupa bingkai kotak tertutup dengan rel lantai',
      params: { jenis: 'stool', rangka: 'kotak', sandaran: false, pijakan: false, pipa: '20' },
      sizes: [
        { label: 'Stool duduk', desc: '38 × 32, tinggi 45', params: { lebar: 38, dalam: 32, tinggiDudukan: 45, pijakan: false } },
        { label: 'Dingklik rendah', desc: '34 × 28, tinggi 30', params: { lebar: 34, dalam: 28, tinggiDudukan: 30, pijakan: false } },
        { label: 'Stool bar + pijakan', desc: '38 × 34, tinggi 75', params: { lebar: 38, dalam: 34, tinggiDudukan: 75, pijakan: true, tinggiPijakan: 30 } },
      ],
    },
    // ---------- Bangku panjang ----------
    {
      id: 'bangku',
      group: 'bangku-panjang',
      name: 'Bangku panjang empat kaki',
      desc: 'empat kaki tegak + palang H',
      params: { jenis: 'bangku', rangka: 'empat', sandaran: false, palangKaki: true, pipa: '30' },
      sizes: [
        { label: '120 cm (2–3 orang)', desc: '120 × 35 × 45 cm', params: { lebar: 120, dalam: 35, tinggiDudukan: 45, kakiTengah: false, dudukan: 'papan' } },
        { label: '150 cm + kaki tengah', desc: '150 × 38 × 45 cm', params: { lebar: 150, dalam: 38, tinggiDudukan: 45, kakiTengah: true, dudukan: 'papan' } },
        { label: '150 cm dudukan bilah', desc: 'bilah besi, tahan hujan', params: { lebar: 150, dalam: 38, tinggiDudukan: 45, kakiTengah: true, dudukan: 'bilah' } },
        { label: 'Bangku pendek 90 cm', desc: '90 × 32 × 45 cm', params: { lebar: 90, dalam: 32, tinggiDudukan: 45, kakiTengah: false, dudukan: 'papan' } },
      ],
    },
    {
      id: 'bangku-rak',
      group: 'bangku-panjang',
      name: 'Bangku rangka kotak + rak',
      desc: 'sisi bingkai kotak tertutup, papan rak di bawah dudukan',
      params: { jenis: 'bangku', rangka: 'kotak', sandaran: false, rakBawah: true, palangKaki: false, kakiTengah: false, pipa: '30' },
      sizes: [
        { label: 'Bangku sepatu', desc: '90 × 35 × 45 cm', params: { lebar: 90, dalam: 35, tinggiDudukan: 45 } },
        { label: 'Bangku teras', desc: '120 × 40 × 45 cm', params: { lebar: 120, dalam: 40, tinggiDudukan: 45 } },
        { label: 'Bangku 150 cm + kaki tengah', desc: '150 × 40 × 45 cm', params: { lebar: 150, dalam: 40, tinggiDudukan: 45, kakiTengah: true } },
        { label: 'Bangku tanpa rak', desc: '120 × 35 × 45 cm', params: { lebar: 120, dalam: 35, tinggiDudukan: 45, rakBawah: false } },
      ],
    },
    {
      id: 'bangku-silang',
      group: 'bangku-panjang',
      name: 'Bangku kaki silang X',
      desc: 'kaki bersilang X di kedua ujung + palang panjang di titik silang',
      params: { jenis: 'bangku', rangka: 'silang', sandaran: false, pipa: '30' },
      sizes: [
        { label: '120 cm', desc: '120 × 38 × 45 cm', params: { lebar: 120, dalam: 38, tinggiDudukan: 45, kakiTengah: false } },
        { label: '150 cm + silang tengah', desc: '150 × 40 × 45 cm', params: { lebar: 150, dalam: 40, tinggiDudukan: 45, kakiTengah: true } },
        { label: 'Bangku ujung ranjang', desc: '100 × 40 × 45 cm', params: { lebar: 100, dalam: 40, tinggiDudukan: 45, kakiTengah: false } },
      ],
    },
    // ---------- Bangku taman & cafe ----------
    {
      id: 'bangku-sandar',
      group: 'bangku-taman',
      name: 'Bangku taman bersandaran',
      desc: 'empat kaki + kaki tengah, sandaran papan miring',
      params: { jenis: 'bangku', rangka: 'empat', sandaran: true, modelSandaran: 'papan', miringSandaran: 12, palangKaki: true, kakiTengah: true, pipa: '30' },
      sizes: [
        { label: '150 cm', desc: '150 × 45 cm, sandaran 85', params: { lebar: 150, dalam: 45, tinggiDudukan: 45, tinggiSandaran: 85 } },
        { label: '120 cm', desc: '120 × 45 cm, sandaran 85', params: { lebar: 120, dalam: 45, tinggiDudukan: 45, tinggiSandaran: 85 } },
        { label: '150 cm dudukan bilah', desc: 'bilah besi, tahan hujan', params: { lebar: 150, dalam: 45, tinggiDudukan: 45, tinggiSandaran: 85, dudukan: 'bilah' } },
      ],
    },
    {
      id: 'bangku-lengan',
      group: 'bangku-taman',
      name: 'Bangku taman rangka samping + lengan',
      desc: 'bingkai samping menerus di tiap ujung: rel lantai, kaki miring, sandaran tangan',
      params: { jenis: 'bangku', rangka: 'lengan', sandaran: true, modelSandaran: 'papan', miringSandaran: 12, dudukan: 'bilah', pipa: '30' },
      sizes: [
        { label: '150 cm + rangka tengah', desc: '150 × 48 × 43 cm', params: { lebar: 150, dalam: 48, tinggiDudukan: 43, tinggiSandaran: 82, kakiTengah: true } },
        { label: '120 cm', desc: '120 × 48 × 43 cm', params: { lebar: 120, dalam: 48, tinggiDudukan: 43, tinggiSandaran: 82, kakiTengah: false } },
        { label: '180 cm dudukan papan', desc: '180 × 50 × 43 cm', params: { lebar: 180, dalam: 50, tinggiDudukan: 43, tinggiSandaran: 82, kakiTengah: true, dudukan: 'papan' } },
      ],
    },
    {
      id: 'bangku-bilah',
      group: 'bangku-taman',
      name: 'Bangku + meja samping bundar',
      desc: 'kaki kanan memanjang jadi tiang meja bundar di ujung bangku',
      params: { jenis: 'bangku', rangka: 'empat', dudukan: 'bilah', sandaran: false, mejaSamping: true, diameterMeja: 40, tinggiMeja: 60, palangKaki: true, kakiTengah: true, pipa: '30' },
      sizes: [
        { label: '150 cm, meja ø40', desc: 'dudukan bilah besi', params: { lebar: 150, dalam: 40, tinggiDudukan: 45, diameterMeja: 40 } },
        { label: '120 cm, meja ø35', desc: 'dudukan bilah besi', params: { lebar: 120, dalam: 40, tinggiDudukan: 45, diameterMeja: 35, kakiTengah: false } },
        { label: '150 cm dudukan papan', desc: 'papan kayu, meja ø45', params: { lebar: 150, dalam: 40, tinggiDudukan: 45, diameterMeja: 45, dudukan: 'papan' } },
      ],
    },
    {
      id: 'bangku-meja',
      group: 'bangku-taman',
      name: 'Bangku cafe + meja kecil depan',
      desc: 'daun meja kecil di atas dua tiang yang naik dari depan dudukan',
      params: { jenis: 'bangku', rangka: 'empat', lebar: 150, dalam: 45, sandaran: false, mejaSamping: false, rakBawah: false, kakiTengah: true, palangKaki: true, mejaDepan: 2, lebarMejaDepan: 45, tinggiMejaDepan: 72, pipa: '30' },
      sizes: [
        { label: '150 cm + 2 meja', desc: '150 × 45 cm', params: { lebar: 150, dalam: 45, tinggiDudukan: 45, mejaDepan: 2 } },
        { label: '120 cm + 1 meja', desc: '120 × 45 cm', params: { lebar: 120, dalam: 45, tinggiDudukan: 45, mejaDepan: 1, kakiTengah: false } },
        { label: '200 cm + 3 meja', desc: '200 × 45 cm', params: { lebar: 200, dalam: 45, tinggiDudukan: 45, mejaDepan: 3, lebarMejaDepan: 42 } },
      ],
    },
  ],
  summary: (p) =>
    `${str(p, 'jenis') === 'bangku' ? 'Bangku' : str(p, 'jenis') === 'stool' ? 'Stool' : 'Kursi'} · dudukan ${num(p, 'lebar')} × ${num(p, 'dalam')} cm, tinggi ${num(p, 'tinggiDudukan')} cm`,

  build: (p) => {
    const model = modelOf(p);
    if (model === 'tiang') return buildTiang(p);
    const jenis = str(p, 'jenis', 'kursi');
    const W = num(p, 'lebar', 45);
    const D = num(p, 'dalam', 42);
    const Hs = num(p, 'tinggiDudukan', 45);
    const L = (parseInt(str(p, 'pipa', '20')) || 20) / 10;
    const slats = str(p, 'dudukan') === 'bilah';
    const papanB = BOARD_THICK[str(p, 'papan', 'kayu')] ?? 2.5;
    const b = slats ? 2 : papanB; // tebal dudukan (bilah besi 40×20 rebah = 2 cm)
    const o = 1;
    const yS = Hs - b; // bidang bawah dudukan = ujung atas kaki
    const rail: [number, number] = [20, 20];
    const leg: [number, number] = [L * 10, L * 10];
    const side = sideTableOf(p);
    const back = backOf(p);
    const jeruji = back && str(p, 'modelSandaran') === 'jeruji';
    const Hb = Math.max(yS + 20, num(p, 'tinggiSandaran', 85));
    const tilt = back ? num(p, 'miringSandaran', 0) : 0;
    const tanT = Math.tan((tilt * Math.PI) / 180);
    const spread = model === 'empat' ? Math.tan((num(p, 'sudutKaki', 0) * Math.PI) / 180) * yS : 0;
    const tableD = side ? num(p, 'diameterMeja', 40) : 0;
    const Ht = side ? Math.max(Hs + 8, num(p, 'tinggiMeja', 60)) : 0;
    const seatW = W - (side ? tableD : 0); // panjang dudukan (meja samping di ujung kanan)
    // kaki seluncur / kantilever / rangka lengan: kaki menjorok keluar dari bawah dudukan sejauh kk
    const kk = model === 'sled' ? Math.min(6, D * 0.14) : model === 'kantilever' ? 4 : model === 'lengan' ? Math.min(8, D * 0.16) : 0;

    const { list, add, line } = memberFactory();
    const boards: Board[] = [];
    // sandaran miring condong ke belakang: seluruh kursi digeser ke depan supaya tetap di dalam tapak
    const zs = back ? tanT * (Hb - yS) : 0;
    const ox = o + spread; // kaki melebar: rangka dudukan masuk ke dalam
    const oz = ox + kk;
    const xl = ox + L / 2;
    const xr = W - ox - L / 2;
    const zb = zs + oz + L / 2;
    const zf = zs + D - oz - L / 2;
    const zm = (zb + zf) / 2;
    const corners: [number, number, number, number, string][] = [
      [xl, zb, -1, -1, 'kiri belakang'],
      [xr, zb, 1, -1, 'kanan belakang'],
      [xl, zf, -1, 1, 'kiri depan'],
      [xr, zf, 1, 1, 'kanan depan'],
    ];
    const at = (i: number, y: number): P3 => {
      const [x, z, sx, sz] = corners[i];
      const t = (yS - y) / Math.max(1, yS);
      return [x + sx * spread * t, y, z + sz * spread * t];
    };
    /** z sandaran pada ketinggian y (miring ke belakang di atas dudukan) */
    const zBack = (y: number) => zb - tanT * (y - yS);
    const ya = Math.min(Hb - 6, Hs + 22); // tinggi lengan sandaran tangan
    const xMid = seatW / 2;
    const midFrame = jenis === 'bangku' && bool(p, 'kakiTengah');

    /** Tiang sandaran dari atas kaki belakang (x, yS, zb) naik miring ke tinggi sandaran */
    const backPost = (x: number, tag: string) => line(`sandaran-tiang-${tag}`, [x, yS, zb], [x, Hb, zBack(Hb)], 'post', `Tiang sandaran ${tag}`, leg);
    /** z muka depan tiang sandaran pada ketinggian y (palang / lengan yang menempel di depannya berakhir di sini) */
    const zBackFace = (y: number) => zBack(y) + L / 2 / Math.cos((tilt * Math.PI) / 180);

    // Sambungan las: setengah lebar palang 20×20, dan tinggi ujung atas kaki yang dilas di BAWAH palang dudukan
    const rh = rail[0] / 20;
    const yUnder = yS - 2 * rh;
    /** Setengah lebar mendatar kaki miring yang naik dy sambil bergeser dz */
    const slantHalf = (dz: number, dy: number) => (L / 2) * Math.hypot(dz, dy) / Math.max(1, dy);
    /**
     * Kaki silang X / kaki A: ujung bawah di (zb, zf), ujung atas dipotong rata di bawah palang dudukan.
     * e = jarak muka luar palang di atasnya dari as kaki sudut; tepi luar potongan atas rata dengan muka itu.
     * Mengembalikan pergeseran z as kaki dari bawah ke atas (dz) dan setengah lebar mendatarnya (hw).
     */
    const slantLegs = (kind: 'silang' | 'a', e: number) => {
      let hw = L / 2;
      let dz = 0;
      for (let k = 0; k < 6; k++) {
        dz = kind === 'silang' ? zf + e - hw - zb : zm - hw - zb;
        hw = slantHalf(dz, yUnder);
      }
      return { dz, hw };
    };
    /** Bingkai samping kiri / kanan: palang dudukan samping menerus di atas ujung kaki (silang & A) */
    const fullSide = model === 'silang' || model === 'a';
    const xGeo = slantLegs('silang', L / 2);
    const aGeo = slantLegs('a', 0);
    /** Tinggi titik silang kaki X (palang tengah dipasang di sini) */
    const yCross = (g: { dz: number }) => (yUnder * (zf - zb)) / (2 * g.dz);

    /**
     * Satu bingkai samping (model selain empat kaki) di posisi x. Bingkai tengah (mid) tidak membawa palang dudukan
     * sendiri di sudutnya: ujung atas kakinya dilas di bawah palang dudukan depan / belakang.
     */
    const sideFrame = (x: number, tag: string, withBack: boolean, mid = false) => {
      const yTop = mid ? yUnder : yS;
      if (model === 'sled') {
        add(`rel-${tag}`, 'z', x, L / 2, zb - kk - L / 2, zf - zb + 2 * kk + L, 'rail-z', `Rel lantai ${tag}`, leg);
        line(`kaki-belakang-${tag}`, [x, L, zb - kk], [x, yTop, zb], 'post', `Kaki belakang miring ${tag}`, leg);
        line(`kaki-depan-${tag}`, [x, L, zf + kk], [x, yTop, zf], 'post', `Kaki depan miring ${tag}`, leg);
        if (withBack) backPost(x, tag);
      } else if (model === 'kotak') {
        if (withBack && tilt === 0) add(`kaki-belakang-${tag}`, 'y', x, 0, zb, Hb, 'post', `Kaki belakang + sandaran ${tag}`, leg);
        else {
          add(`kaki-belakang-${tag}`, 'y', x, 0, zb, yTop, 'post', `Kaki belakang ${tag}`, leg);
          if (withBack) backPost(x, tag);
        }
        add(`kaki-depan-${tag}`, 'y', x, 0, zf, yTop, 'post', `Kaki depan ${tag}`, leg);
        add(`rel-${tag}`, 'z', x, L / 2, zb + L / 2, zf - zb - L, 'rail-z', `Rel lantai ${tag}`, leg);
      } else if (model === 'kantilever') {
        add(`rel-${tag}`, 'z', x, L / 2, zb - kk - L / 2, zf - zb + 2 * kk + L, 'rail-z', `Rel lantai ${tag}`, leg);
        line(`kaki-depan-${tag}`, [x, L, zf + kk], [x, yTop, zf], 'post', `Kaki depan kantilever ${tag}`, leg);
        if (withBack) backPost(x, tag);
      } else if (model === 'lengan') {
        const arm = withBack;
        add(`rel-${tag}`, 'z', x, L / 2, zb - kk - L / 2, zf - zb + kk + L, 'rail-z', `Rel lantai ${tag}`, leg);
        line(`kaki-belakang-${tag}`, [x, L, zb - kk], [x, yTop, zb], 'post', `Kaki belakang miring ${tag}`, leg);
        if (arm) {
          // tiang depan berhenti di bawah lengan; lengan duduk di atasnya dan ujung belakangnya rata di muka tiang sandaran
          const yArm = ya - L / 2;
          add(`kaki-depan-${tag}`, 'y', x, L, zf, yArm - L, 'post', `Kaki depan + tiang lengan ${tag}`, leg);
          const zA = back ? zBackFace(yArm) : zb + L / 2;
          add(`lengan-${tag}`, 'z', x, ya, zA, zf + L / 2 + 3 - zA, 'rail-z', `Lengan sandaran tangan ${tag}`, leg);
          if (back) backPost(x, tag);
          else add(`tiang-lengan-belakang-${tag}`, 'y', x, yS, zb, yArm - yS, 'post', `Tiang lengan belakang ${tag}`, leg);
        } else add(`kaki-depan-${tag}`, 'y', x, L, zf, yTop - L, 'post', `Kaki depan ${tag}`, leg);
      } else if (model === 'silang') {
        // satu kaki menerus, kaki lainnya dipotong dua dan dilas di kedua sisi kaki menerus
        const g = mid ? slantLegs('silang', rh) : xGeo;
        const s = g.dz / yUnder;
        const zA = (y: number) => zb + s * y;
        const zB = (y: number) => zf - s * y;
        const y1 = (yUnder * (zf - zb - 2 * g.hw)) / (2 * g.dz);
        const y2 = (yUnder * (zf - zb + 2 * g.hw)) / (2 * g.dz);
        line(`kaki-silang-a-${tag}`, [x, 0, zA(0)], [x, yUnder, zA(yUnder)], 'post', `Kaki silang ${tag} (belakang ke depan)`, leg);
        line(`kaki-silang-b1-${tag}`, [x, 0, zB(0)], [x, y1, zB(y1)], 'post', `Kaki silang ${tag} (depan ke belakang, bawah)`, leg);
        line(`kaki-silang-b2-${tag}`, [x, y2, zB(y2)], [x, yUnder, zB(yUnder)], 'post', `Kaki silang ${tag} (depan ke belakang, atas)`, leg);
        if (withBack) backPost(x, tag);
      } else if (model === 'a') {
        // dua kaki bertemu di bawah palang dudukan, potongan atasnya saling menempel di tengah
        const g = aGeo;
        const s = g.dz / yUnder;
        line(`kaki-a-belakang-${tag}`, [x, 0, zb], [x, yUnder, zb + g.dz], 'post', `Kaki A belakang ${tag}`, leg);
        line(`kaki-a-depan-${tag}`, [x, 0, zf], [x, yUnder, zf - g.dz], 'post', `Kaki A depan ${tag}`, leg);
        // palang mendatar di antara kedua kaki: ujungnya rata di muka dalam kaki pada sisi atas palang
        const yc = yS * 0.35;
        const z0 = zb + s * (yc + rh) + g.hw;
        add(`palang-a-${tag}`, 'z', x, yc, z0, zf + zb - 2 * z0, 'rail-z', `Palang kaki A ${tag}`, rail);
        if (withBack) backPost(x, tag);
      }
    };

    /** z depan & belakang kaki pada ketinggian y (untuk pijakan / palang) */
    const legZ = (y: number): [number, number] => {
      const t = Math.min(1, Math.max(0, y / Math.max(1, yS)));
      if (model === 'sled') return [zb - kk * (1 - t), zf + kk * (1 - t)];
      if (model === 'silang') {
        const d = Math.abs(zf - zb - (2 * xGeo.dz * Math.min(y, yUnder)) / yUnder);
        return [zm - d / 2, zm + d / 2];
      }
      if (model === 'a') {
        const d = (aGeo.dz * Math.min(y, yUnder)) / yUnder;
        return [zb + d, zf - d];
      }
      return [zb, zf];
    };

    if (model === 'empat') {
      corners.forEach(([x, z, , , label], i) => {
        const isBack = i < 2;
        const tallRight = side && x === xr; // kaki kanan memanjang jadi kaki meja samping
        if (isBack && back && spread === 0 && tilt === 0) {
          add(`kaki-${i}`, 'y', x, 0, z, Hb, 'post', `Kaki ${label} + sandaran`, leg);
          return;
        }
        if (tallRight && spread === 0) {
          add(`kaki-${i}`, 'y', x, 0, z, Ht - papanB, 'post', `Kaki ${label} + meja samping`, leg);
          return;
        }
        line(`kaki-${i}`, at(i, 0), [x, yS, z], 'post', `Kaki ${label}`, leg);
        if (isBack && back) line(`sandaran-tiang-${i}`, [x, yS, z], [x, Hb, zBack(Hb)], 'post', `Tiang sandaran ${i ? 'kanan' : 'kiri'}`, leg);
        if (tallRight) add(`meja-tiang-${i}`, 'y', x, yS, z, Ht - papanB - yS, 'post', `Tiang meja samping ${label}`, leg);
      });
    } else {
      sideFrame(xl, 'kiri', back);
      sideFrame(xr, 'kanan', back);
      if (midFrame) sideFrame(xMid, 'tengah', false, true);
    }

    // Rangka dudukan
    const yr = yS - 1;
    if (fullSide) {
      // kaki silang / A dilas di bawah palang samping yang menerus; palang depan & belakang menempel di sisi dalamnya
      add('dudukan-depan', 'x', xl + rh, yr, zf, xr - xl - 2 * rh, 'rail-x', 'Rangka dudukan depan', rail);
      add('dudukan-belakang', 'x', xl + rh, yr, zb, xr - xl - 2 * rh, 'rail-x', 'Rangka dudukan belakang', rail);
      add('dudukan-kiri', 'z', xl, yr, zb - L / 2, zf - zb + L, 'rail-z', 'Rangka dudukan kiri', rail);
      add('dudukan-kanan', 'z', xr, yr, zb - L / 2, zf - zb + L, 'rail-z', 'Rangka dudukan kanan', rail);
    } else {
      add('dudukan-depan', 'x', ox + L, yr, zf, W - 2 * ox - 2 * L, 'rail-x', 'Rangka dudukan depan', rail);
      add('dudukan-belakang', 'x', ox + L, yr, zb, W - 2 * ox - 2 * L, 'rail-x', 'Rangka dudukan belakang', rail);
      add('dudukan-kiri', 'z', xl, yr, zb + L / 2, zf - zb - L, 'rail-z', 'Rangka dudukan kiri', rail);
      add('dudukan-kanan', 'z', xr, yr, zb + L / 2, zf - zb - L, 'rail-z', 'Rangka dudukan kanan', rail);
    }
    if (midFrame) add('dudukan-tengah', 'z', xMid, yr, zb + rh, zf - zb - 2 * rh, 'rail-z', 'Rangka dudukan tengah', rail);

    // Kaki tengah bangku panjang (empat kaki)
    if (model === 'empat' && midFrame) {
      add('kaki-tengah-b', 'y', xMid, 0, zb + (L / 2 + 1), yr - 1, 'post', 'Kaki tengah belakang', leg);
      add('kaki-tengah-d', 'y', xMid, 0, zf - (L / 2 + 1), yr - 1, 'post', 'Kaki tengah depan', leg);
    }

    // Palang di antara kaki pada ketinggian y (empat kaki, ikut kaki melebar)
    const ring = (prefix: string, name: string, y: number, full: boolean) => {
      const [lb, rb, lf, rf] = [0, 1, 2, 3].map((i) => at(i, y));
      add(`${prefix}-kiri`, 'z', lb[0], y, lb[2] + L / 2, lf[2] - lb[2] - L, 'rail-z', `${name} kiri`, rail);
      add(`${prefix}-kanan`, 'z', rb[0], y, rb[2] + L / 2, rf[2] - rb[2] - L, 'rail-z', `${name} kanan`, rail);
      if (full) {
        add(`${prefix}-depan`, 'x', lf[0] + L / 2, y, lf[2], rf[0] - lf[0] - L, 'rail-x', `${name} depan`, rail);
        add(`${prefix}-belakang`, 'x', lb[0] + L / 2, y, lb[2], rb[0] - lb[0] - L, 'rail-x', `${name} belakang`, rail);
      } else add(`${prefix}-tengah`, 'x', lb[0] + 1, y, zs + D / 2, rb[0] - lb[0] - 2, 'rail-x', `${name} tengah`, rail);
    };
    /**
     * Palang kiri–kanan di antara dua bingkai samping; ujungnya rata di sisi batang yang ditemui (setengah lebar hb).
     * Bila ada bingkai tengah, palang dipotong dua dan dilas di kedua sisi bingkai tengah.
     */
    const crossX = (id: string, label: string, y: number, z: number, hb = L / 2) => {
      if (!midFrame) return add(id, 'x', xl + hb, y, z, xr - xl - 2 * hb, 'rail-x', label, rail);
      add(`${id}-kiri`, 'x', xl + hb, y, z, xMid - xl - 2 * hb, 'rail-x', `${label} (kiri)`, rail);
      add(`${id}-kanan`, 'x', xMid + hb, y, z, xr - xMid - 2 * hb, 'rail-x', `${label} (kanan)`, rail);
    };
    const yLow = Math.min(15, yS / 3);
    const rakOk = jenis === 'bangku' && !side && bool(p, 'rakBawah') && (model === 'empat' || model === 'kotak');

    if (model === 'empat') {
      if (jenis === 'stool') {
        if (bool(p, 'pijakan')) ring('pijakan', 'Pijakan kaki', num(p, 'tinggiPijakan', 28), true);
      } else if (rakOk) {
        ring('rak', 'Palang rak bawah', yLow, true);
      } else if (bool(p, 'palangKaki')) ring('palang', 'Palang kaki', yLow, false);
    } else {
      if (model === 'silang') crossX('palang-silang', 'Palang tengah di titik silang', yCross(xGeo), zm);
      if (model === 'a') crossX('palang-a', 'Palang tengah kaki A', yS * 0.35, zm, rh);
      if (model === 'kantilever') crossX('rel-belakang', 'Rel lantai belakang (penyambung U)', L / 2, zb - kk);
      if (jenis === 'stool' && bool(p, 'pijakan')) {
        const yP = num(p, 'tinggiPijakan', 28);
        const [zB, zF] = legZ(yP);
        crossX('pijakan-depan', 'Pijakan kaki depan', yP, zF);
        if (zF - zB > L + 2) crossX('pijakan-belakang', 'Palang pijakan belakang', yP, zB);
      } else if (rakOk) {
        crossX('rak-depan', 'Palang rak bawah depan', yLow, zf);
        crossX('rak-belakang', 'Palang rak bawah belakang', yLow, zb);
      } else if (model === 'kotak' && jenis !== 'stool' && bool(p, 'palangKaki')) crossX('palang-belakang', 'Palang bawah belakang', yLow, zb);
    }
    if (rakOk && papanB > 0) {
      const [lb, rb, lf] = [0, 1, 2].map((i) => at(i, yLow));
      boards.push(board('papan-rak', 'Papan rak bawah', lb[0] + L / 2, rb[0] - L / 2, yLow + 1, yLow + 1 + papanB, lb[2] - 1, lf[2] + 1));
    }

    // Dudukan: papan utuh atau bilah besi berjajar (bilah dipasang paling akhir, dipotong di tiang yang menembus dudukan)
    if (!slats && papanB > 0) {
      const seat = board('dudukan', 'Papan dudukan', 0, seatW, yS, Hs, zs, zs + D);
      if (jenis === 'stool' && str(p, 'bentukDudukan') === 'bulat') {
        // dudukan bundar: diameter = lebar, dipusatkan di atas rangka
        const dm = Math.max(W, D);
        seat.box.min[0] = W / 2 - dm / 2;
        seat.box.max[0] = W / 2 + dm / 2;
        seat.box.min[2] = zs + D / 2 - dm / 2;
        seat.box.max[2] = zs + D / 2 + dm / 2;
        seat.shape = 'round';
      }
      boards.push(seat);
    }

    // Meja samping bundar di ujung kanan
    if (side) {
      const yTr = Ht - papanB - 1;
      const [, rb, , rf] = [0, 1, 2, 3].map((i) => at(i, yS));
      add('meja-palang', 'z', xr, yTr, rb[2] + L / 2, rf[2] - rb[2] - L, 'rail-z', 'Palang dudukan meja samping', rail);
      // dari tengah meja sampai muka palang dudukan meja (palang 20×20: muka di xr − 1)
      add('meja-lengan', 'x', xr - tableD / 2, yTr, zs + D / 2, tableD / 2 - 1, 'rail-x', 'Lengan penyangga meja samping', rail);
      if (papanB > 0) {
        const t = board('meja-samping', 'Daun meja samping bundar', W - tableD, W, Ht - papanB, Ht, zs + D / 2 - tableD / 2, zs + D / 2 + tableD / 2);
        t.shape = 'round';
        boards.push(t);
      }
    }

    // Meja kecil bertiang dua di atas dudukan (bangku cafe trotoar)
    const nFront = frontTablesOf(p);
    if (nFront > 0) {
      const tw = num(p, 'lebarMejaDepan', 45);
      const Htf = Math.max(Hs + 15, num(p, 'tinggiMejaDepan', 72));
      const tb = Math.max(papanB, 2.5);
      const yT = Htf - tb - 1;
      const td = 34;
      for (let t = 0; t < nFront; t++) {
        const xc = (W * (t + 0.5)) / nFront;
        const tag = nFront > 1 ? ` ${t + 1}` : '';
        const px = [xc - tw / 2 + 5, xc + tw / 2 - 5];
        px.forEach((x, k) => add(`meja-depan-tiang-${t}-${k}`, 'y', x, yS, zf, yT - yS - 1, 'post', `Tiang meja kecil${tag} ${k ? 'kanan' : 'kiri'}`, leg));
        add(`meja-depan-palang-${t}`, 'x', px[0] + L / 2, yT, zf, px[1] - px[0] - L, 'rail-x', `Palang bawah meja kecil${tag}`, rail);
        if (papanB > 0) boards.push(board(`meja-depan-${t}`, `Daun meja kecil${tag}`, xc - tw / 2, xc + tw / 2, Htf - tb, Htf, zf - td * 0.45, zf + td * 0.55));
      }
    }

    // Sandaran: palang atas & bawah mengikuti kemiringan + papan sandaran (diputar) atau jeruji tegak
    if (back) {
      const yTopRail = Hb - 1;
      const yLowRail = Math.min(yTopRail - 8, Hs + 12);
      const x0 = ox + L;
      const len = W - 2 * ox - 2 * L;
      add('sandaran-atas', 'x', x0, yTopRail, zBack(yTopRail), len, 'rail-x', 'Palang sandaran atas', rail);
      add('sandaran-bawah', 'x', x0, yLowRail, zBack(yLowRail), len, 'rail-x', 'Palang sandaran bawah', rail);
      if (jeruji) {
        const n = Math.max(2, Math.round(len / 8) - 1);
        for (let i = 1; i <= n; i++) {
          const x = x0 + (len * i) / (n + 1);
          line(`jeruji-${i}`, [x, yLowRail + 1, zBack(yLowRail + 1)], [x, yTopRail - 1, zBack(yTopRail - 1)], 'custom', `Jeruji sandaran ${i}`, [20, 20]);
        }
      } else if (papanB > 0) {
        const bt = Math.min(papanB, 1.8);
        const hgt = (Hb - (yLowRail - 1)) / Math.cos((tilt * Math.PI) / 180);
        const ym = (Hb + yLowRail - 1) / 2;
        const zc = zBack(ym) + 1 + bt / 2;
        const bb = board('sandaran', 'Papan sandaran', x0, W - ox - L, ym - hgt / 2, ym + hgt / 2, zc - bt / 2, zc + bt / 2);
        bb.rotX = -tilt;
        boards.push(bb);
      }
    }

    if (armsOf(p)) {
      // Tiang depan naik ke tinggi lengan, lengan mendatar ke tiang sandaran
      [0, 1].forEach((i) => {
        const x = i ? xr : xl;
        add(`tiang-tangan-${i}`, 'y', x, yS, zf, ya - rh - yS, 'post', `Tiang sandaran tangan ${i ? 'kanan' : 'kiri'}`, leg);
        const zB = zBackFace(ya - rh);
        add(`lengan-${i}`, 'z', x, ya, zB, zf + L / 2 - zB, 'rail-z', `Lengan sandaran tangan ${i ? 'kanan' : 'kiri'}`, rail);
      });
    }

    if (slats) {
      // Tiang yang naik melewati lapisan bilah (tiang sandaran, tiang lengan): bilah dipotong dan ujungnya dilas
      // menempel di sisi tiang, tidak menembusnya. Potongan sisa yang terlalu pendek (< 3 cm) dibuang.
      const y0 = yS;
      const y1 = yS + 2;
      const posts = list.flatMap((m) => {
        if (m.axis !== 'y' && !m.end) return [];
        const a: P3 = [m.x, m.y, m.z];
        const e: P3 = m.end ? [m.end.x, m.end.y, m.end.z] : [m.x, m.y + m.length, m.z];
        const dy = e[1] - a[1];
        const len = Math.hypot(e[0] - a[0], dy, e[2] - a[2]);
        if (Math.abs(dy) < 0.35 * len) return [];
        const lo = Math.min(a[1], e[1]);
        const hi = Math.max(a[1], e[1]);
        if (hi <= y0 + 0.4 || lo >= y1 - 0.4) return [];
        const pt = (y: number) => {
          const t = Math.min(1, Math.max(0, (y - a[1]) / dy));
          return [a[0] + (e[0] - a[0]) * t, a[2] + (e[2] - a[2]) * t];
        };
        const pa = pt(Math.max(lo, y0));
        const pb = pt(Math.min(hi, y1));
        const half = (m.tubeSize || 20) / 20;
        const hx = (half * Math.hypot(e[0] - a[0], dy)) / Math.abs(dy);
        const hz = (half * Math.hypot(e[2] - a[2], dy)) / Math.abs(dy);
        return [{ x0: Math.min(pa[0], pb[0]) - hx, x1: Math.max(pa[0], pb[0]) + hx, z0: Math.min(pa[1], pb[1]) - hz, z1: Math.max(pa[1], pb[1]) + hz }];
      });
      // rangka yang menjorok (seluncur / kantilever / lengan): bilah hanya selebar rangka dudukan supaya tiap bilah tertumpu
      const zLo = kk > 0 ? zb - L / 2 + 2 : zs + 2;
      const zHi = kk > 0 ? zf + L / 2 - 2 : zs + D - 2;
      const n = Math.max(3, Math.round((zHi - zLo + 2) / 6));
      const pitch = (zHi - zLo) / (n - 1);
      for (let i = 0; i < n; i++) {
        const zc = zLo + i * pitch;
        const cuts = posts.filter((q) => q.z1 > zc - 2 + 0.4 && q.z0 < zc + 2 - 0.4).sort((u, v) => u.x0 - v.x0);
        const pieces: [number, number][] = [];
        let x = 0;
        for (const q of cuts) {
          if (q.x0 > x) pieces.push([x, Math.min(q.x0, seatW)]);
          x = Math.max(x, q.x1);
        }
        if (x < seatW) pieces.push([x, seatW]);
        const keep = pieces.filter(([u, v]) => v - u >= 3);
        keep.forEach(([u, v], k) => {
          const suffix = keep.length > 1 ? String.fromCharCode(97 + k) : '';
          add(`bilah-${i + 1}${suffix}`, 'x', u, yS + 1, zc, v - u, 'custom', `Bilah dudukan ${i + 1}${suffix ? ` (${k + 1})` : ''}`, [40, 20]);
        });
      }
    }

    const H = Math.max(back ? Hb : Hs, side ? Ht : 0, model === 'lengan' && back ? ya : 0);
    return { members: list, boards, casters: [], W, D: D + zs, H, boardThick: slats ? 0 : papanB };
  },

  checks: (p) => {
    const out: ProductCheck[] = [];
    const jenis = str(p, 'jenis');
    const model = modelOf(p);
    const W = num(p, 'lebar');
    const nFront = frontTablesOf(p);
    if (str(p, 'rangka', 'empat') !== model)
      out.push({ level: 'info', message: `Model rangka itu tidak tersedia untuk ${jenis === 'stool' ? 'stool' : jenis === 'bangku' ? 'bangku' : 'kursi'}; dipakai rangka ${model === 'kotak' ? 'kotak samping' : 'empat kaki'}.` });
    if (nFront > 0 && W / nFront < num(p, 'lebarMejaDepan') + 20)
      out.push({ level: 'warn', message: 'Meja kecil terlalu rapat: hampir tidak ada tempat duduk di antaranya.', fix: { label: 'Kurangi 1 meja', params: { mejaDepan: nFront - 1 } } });
    const Hs = num(p, 'tinggiDudukan');
    const back = backOf(p);
    if (jenis === 'kursi' && W > 60) out.push({ level: 'warn', message: `Dudukan ${W} cm terlalu lebar untuk kursi 1 orang. Mau dijadikan bangku?`, fix: { label: 'Jadikan bangku', params: { jenis: 'bangku' } } });
    if (jenis === 'bangku' && W > 120 && !bool(p, 'kakiTengah'))
      out.push({ level: 'warn', message: `Bangku ${W} cm tanpa kaki tengah bisa melendut saat diduduki 3 orang.`, fix: { label: 'Tambah kaki tengah', params: { kakiTengah: true } } });
    if (jenis === 'stool' && bool(p, 'pijakan')) {
      const gap = Hs - num(p, 'tinggiPijakan');
      if (gap < 40 || gap > 52)
        out.push({ level: 'info', message: `Jarak pijakan ke dudukan ${gap} cm. Yang nyaman sekitar 45 cm.`, fix: { label: `Pijakan ${Hs - 45} cm`, params: { tinggiPijakan: Math.max(15, Hs - 45) } } });
    }
    if (jenis === 'stool' && Hs > 60 && !bool(p, 'pijakan')) out.push({ level: 'warn', message: 'Stool tinggi tanpa pijakan membuat kaki menggantung dan kursi mudah goyang.', fix: { label: 'Tambah pijakan', params: { pijakan: true } } });
    if (back && num(p, 'tinggiSandaran') - Hs < (jenis === 'stool' ? 22 : 30))
      out.push({ level: 'warn', message: 'Sandaran terlalu pendek untuk menopang punggung.', fix: { label: `Sandaran ${Hs + 40} cm`, params: { tinggiSandaran: Math.min(110, Hs + 40) } } });
    if (back && num(p, 'miringSandaran') > 18)
      out.push({ level: 'warn', message: 'Sandaran sangat miring: kursi bisa terjungkal ke belakang saat bersandar.', fix: { label: 'Miring 12°', params: { miringSandaran: 12 } } });
    if (model === 'kantilever' && str(p, 'pipa', '20') === '20')
      out.push({ level: 'warn', message: 'Kursi kantilever hanya bertumpu di kaki depan; pipa 20×20 bisa melentur. Pakai pipa minimal 30×30 (tebal 1,6 mm).', fix: { label: 'Pipa 30×30', params: { pipa: '30' } } });
    if (model === 'kantilever') out.push({ level: 'info', message: 'Kantilever: las sambungan rel lantai dan kaki depan harus penuh keliling, karena di situ seluruh beban bertumpu.' });
    if (model === 'kantilever' && Hs > 50)
      out.push({ level: 'warn', message: 'Kantilever setinggi ini makin lentur. Turunkan dudukan atau pilih empat kaki.', fix: { label: 'Dudukan 45 cm', params: { tinggiDudukan: 45 } } });
    if ((model === 'silang' || model === 'a') && jenis !== 'stool' && W > 120 && bool(p, 'kakiTengah') === false)
      out.push({ level: 'info', message: 'Tambahkan kaki tengah supaya bangku panjang tidak melendut.' });
    if (model === 'a' && back) out.push({ level: 'warn', message: 'Kaki A tidak punya kaki di sudut belakang, jadi tiang sandaran hanya menempel di rangka dudukan dan mudah goyang.', fix: { label: 'Pakai kaki silang X', params: { rangka: 'silang' } } });
    if (model === 'tiang') {
      out.push({ level: 'info', message: 'Tiang tengah & kaki silang lantai memakai pipa 40×40 supaya tidak goyang. Pasang karet / dop di ujung kaki.' });
      if (bool(p, 'pijakan') && num(p, 'tinggiPijakan') > Hs - 20) out.push({ level: 'warn', message: 'Pijakan terlalu dekat ke dudukan.', fix: { label: `Pijakan ${Hs - 45} cm`, params: { tinggiPijakan: Math.max(15, Hs - 45) } } });
    }
    if (jenis === 'kursi' && Hs >= 42 && Hs <= 48) out.push({ level: 'info', message: 'Tinggi dudukan pas untuk meja makan / meja kerja 72–76 cm.' });
    if ((model === 'empat' && num(p, 'sudutKaki') > 0) || (back && num(p, 'miringSandaran') > 0) || ['sled', 'silang', 'a', 'kantilever', 'lengan'].includes(model))
      out.push({ level: 'info', message: 'Batang miring dipotong bersudut. Sudut tiap potongan tertulis di daftar potongan.' });
    if (jenis === 'bangku' && bool(p, 'rakBawah') && (model === 'empat' || model === 'kotak') && num(p, 'lebar') > 120 && !bool(p, 'kakiTengah'))
      out.push({ level: 'warn', message: 'Bangku panjang dengan rak bawah butuh kaki tengah supaya papan rak tidak melendut.', fix: { label: 'Tambah kaki tengah', params: { kakiTengah: true } } });
    if (str(p, 'papan') === 'none' && str(p, 'dudukan') !== 'bilah') out.push({ level: 'info', message: 'Tanpa papan: dudukan (busa, anyaman, dll.) disiapkan sendiri.' });
    return out;
  },
};

/**
 * Stool tiang tunggal: kaki silang di lantai (kiri–kanan & depan–belakang), satu tiang tengah 40×40,
 * palang silang di bawah dudukan, pijakan kotak dengan jari-jari ke tiang.
 */
function buildTiang(p: Params): ProductBuild {
  const W = num(p, 'lebar', 36);
  const Hs = num(p, 'tinggiDudukan', 75);
  const L = (parseInt(str(p, 'pipa', '20')) || 20) / 10;
  const papanB = BOARD_THICK[str(p, 'papan', 'kayu')] ?? 2.5;
  const b = Math.max(papanB, 1.8);
  const yS = Hs - b;
  const rail: [number, number] = [20, 20];
  const base: [number, number] = [Math.max(40, L * 10), Math.max(40, L * 10)];
  const P = base[0] / 10;
  const R = Math.max(W / 2 + 6, Hs * 0.32); // jari-jari kaki silang lantai
  const c = R; // titik tengah (x = z)
  const { list, add } = memberFactory();
  const boards: Board[] = [];

  add('alas-x', 'x', 0, P / 2, c, 2 * R, 'rail-x', 'Kaki lantai kiri–kanan', base);
  add('alas-z-belakang', 'z', c, P / 2, 0, R - P / 2, 'rail-z', 'Kaki lantai belakang', base);
  add('alas-z-depan', 'z', c, P / 2, R + P / 2, R - P / 2, 'rail-z', 'Kaki lantai depan', base);
  add('tiang', 'y', c, P, c, yS - 2 - P, 'post', 'Tiang tengah', base);
  // palang silang di bawah dudukan
  const s = W / 2 - 3;
  add('dudukan-x', 'x', c - s, yS - 1, c, 2 * s, 'rail-x', 'Palang dudukan kiri–kanan', rail);
  add('dudukan-z-belakang', 'z', c, yS - 1, c - s, s - 1, 'rail-z', 'Palang dudukan belakang', rail);
  add('dudukan-z-depan', 'z', c, yS - 1, c + 1, s - 1, 'rail-z', 'Palang dudukan depan', rail);

  if (bool(p, 'pijakan')) {
    const yP = num(p, 'tinggiPijakan', 28);
    const h = Math.min(20, R - 4); // setengah sisi pijakan kotak
    add('pijakan-depan', 'x', c - h - 1, yP, c + h, 2 * h + 2, 'rail-x', 'Pijakan kaki depan', rail);
    add('pijakan-belakang', 'x', c - h - 1, yP, c - h, 2 * h + 2, 'rail-x', 'Pijakan kaki belakang', rail);
    add('pijakan-kiri', 'z', c - h, yP, c - h + 1, 2 * h - 2, 'rail-z', 'Pijakan kaki kiri', rail);
    add('pijakan-kanan', 'z', c + h, yP, c - h + 1, 2 * h - 2, 'rail-z', 'Pijakan kaki kanan', rail);
    add('jari-kiri', 'x', c - h + 1, yP, c, h - 1 - P / 2, 'rail-x', 'Jari pijakan kiri', rail);
    add('jari-kanan', 'x', c + P / 2, yP, c, h - 1 - P / 2, 'rail-x', 'Jari pijakan kanan', rail);
  }

  if (papanB > 0) {
    const seat = board('dudukan', 'Papan dudukan', c - W / 2, c + W / 2, yS, Hs, c - W / 2, c + W / 2);
    if (str(p, 'bentukDudukan') === 'bulat') seat.shape = 'round';
    boards.push(seat);
  }
  return { members: list, boards, casters: [], W: 2 * R, D: 2 * R, H: Hs, boardThick: papanB };
}
