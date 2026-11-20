import { Board, Caster, Params, ProductBuild, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, board, bool, casterHeight, materialParams, memberFactory, num, str } from './common';

type P3 = [number, number, number];

/**
 * Model rangka baru yang punya fungsi build sendiri (tidak memakai parameter `jenis`):
 * putar = stool tiang di plat bundar + bantalan putar, bintang = kursi kerja kaki bintang beroda,
 * tiga = stool tiga kaki, malas = kursi malas rebah di rel lantai, lesehan = kursi lantai tanpa kaki,
 * ayun-a = ayunan bangku di rangka A, gantung = kursi sangkar digantung di tiang Γ,
 * pohon = bangku keliling pohon (cincin berlubang), bayi = kursi makan anak dengan baki.
 */
const NEW_MODELS = ['putar', 'bintang', 'tiga', 'malas', 'lesehan', 'ayun-a', 'gantung', 'pohon', 'bayi'];

/**
 * Model rangka yang benar-benar dipakai. Beberapa model hanya cocok untuk jenis tertentu:
 * kantilever hanya kursi, tiang tunggal hanya stool, rangka samping + lengan hanya kursi / bangku.
 */
const modelOf = (p: Params) => {
  const jenis = str(p, 'jenis', 'kursi');
  const m = str(p, 'rangka', 'empat');
  if (NEW_MODELS.includes(m)) return m;
  if (m === 'tiang') return jenis === 'stool' ? 'tiang' : 'empat';
  if (m === 'kantilever') return jenis === 'kursi' ? 'kantilever' : 'empat';
  if (m === 'lengan') return jenis === 'stool' ? 'kotak' : 'lengan';
  return ['empat', 'sled', 'kotak', 'silang', 'a'].includes(m) ? m : 'empat';
};
const sideTableOf = (p: Params) => str(p, 'jenis') === 'bangku' && modelOf(p) === 'empat' && bool(p, 'mejaSamping');
const frontTablesOf = (p: Params) => (str(p, 'jenis') === 'bangku' && modelOf(p) === 'empat' && !sideTableOf(p) ? Math.round(num(p, 'mejaDepan', 0)) : 0);
const isNew = (p: Params) => NEW_MODELS.includes(modelOf(p));
/** Model baru yang punya sandaran miring (putar: bisa dimatikan) */
const newBackOf = (p: Params) => {
  const m = modelOf(p);
  if (m === 'putar') return bool(p, 'sandaran');
  return ['bintang', 'bayi', 'lesehan', 'ayun-a'].includes(m);
};
const backOf = (p: Params) => (isNew(p) ? newBackOf(p) : modelOf(p) !== 'tiang' && !sideTableOf(p) && bool(p, 'sandaran'));
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
    { id: 'ukuran', title: 'Ukuran', keys: ['jenis', 'lebar', 'dalam', 'panjang', 'tinggiDudukan'] },
    {
      id: 'bentuk',
      title: 'Bentuk',
      keys: ['rangka', 'dudukan', 'bentukDudukan', 'sandaran', 'modelSandaran', 'tinggiSandaran', 'miringSandaran', 'sudutSandaran', 'tinggiRangka', 'sandaranTangan', 'sudutKaki', 'palangKaki', 'pijakan', 'tinggiPijakan', 'kakiTengah', 'rakBawah'],
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
      showIf: (p) => !isNew(p),
    },
    {
      key: 'lebar',
      label: 'Lebar dudukan',
      type: 'number',
      unit: 'cm',
      min: 28,
      max: 200,
      step: 1,
      help: 'Bangku keliling pohon: panjang sisi luar.',
      marks: [{ value: 35, label: 'stool' }, { value: 45, label: 'kursi' }, { value: 120, label: 'bangku 2–3 org' }],
    },
    { key: 'dalam', label: 'Kedalaman dudukan', type: 'number', unit: 'cm', min: 25, max: 60, step: 1, marks: [{ value: 35, label: 'stool / bangku' }, { value: 42, label: 'kursi' }], showIf: (p) => !['tiga', 'putar'].includes(modelOf(p)) },
    { key: 'panjang', label: 'Panjang kursi malas', type: 'number', unit: 'cm', min: 150, max: 210, step: 1, marks: [{ value: 190, label: 'dewasa' }], showIf: (p) => modelOf(p) === 'malas' },
    {
      key: 'tinggiDudukan',
      label: 'Tinggi dudukan',
      type: 'number',
      unit: 'cm',
      min: 25,
      max: 85,
      step: 1,
      help: 'Dari lantai sampai permukaan dudukan.',
      marks: [{ value: 45, label: 'meja makan' }, { value: 65, label: 'meja dapur' }, { value: 75, label: 'meja bar' }],
      showIf: (p) => modelOf(p) !== 'lesehan',
    },
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
        { value: 'putar', label: 'Tiang di plat bundar, dudukan putar', desc: 'Stool: satu tiang di plat besi, dudukan bisa diputar' },
        { value: 'bintang', label: 'Kaki bintang beroda', desc: 'Kursi kerja: 5 lengan kaki beroda, dudukan putar' },
        { value: 'tiga', label: 'Tiga kaki', desc: 'Stool: tiga kaki melebar, palang segitiga' },
        { value: 'malas', label: 'Kursi malas (rebah)', desc: 'Rangka panjang di rel lantai, sandaran bisa disetel' },
        { value: 'lesehan', label: 'Kursi lesehan', desc: 'Tanpa kaki: rangka lantai + sandaran bertopang' },
        { value: 'ayun-a', label: 'Ayunan rangka A', desc: 'Bangku digantung di balok atas, kaki A di kedua ujung' },
        { value: 'gantung', label: 'Kursi gantung tiang', desc: 'Sangkar kursi digantung di lengan tiang Γ' },
        { value: 'pohon', label: 'Keliling pohon', desc: 'Bangku persegi berlubang di tengah, 4 sisi menghadap keluar' },
        { value: 'bayi', label: 'Kursi makan bayi', desc: 'Kaki tinggi melebar, baki depan, pijakan kaki' },
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
      showIf: (p) => !isNew(p) && modelOf(p) !== 'tiang',
    },
    {
      key: 'bentukDudukan',
      label: 'Bentuk dudukan',
      type: 'choice',
      options: [
        { value: 'kotak', label: 'Kotak' },
        { value: 'bulat', label: 'Bundar', desc: 'Diameter = lebar dudukan' },
      ],
      showIf: (p) => ['putar', 'tiga'].includes(modelOf(p)) || (!isNew(p) && p.jenis === 'stool' && (p.dudukan !== 'bilah' || modelOf(p) === 'tiang')),
    },
    {
      key: 'sandaran',
      label: 'Sandaran punggung',
      type: 'toggle',
      help: 'Stool bar: sandaran rendah ±30 cm di atas dudukan.',
      showIf: (p) => modelOf(p) === 'putar' || (!isNew(p) && modelOf(p) !== 'tiang' && !sideTableOf(p)),
    },
    {
      key: 'modelSandaran',
      label: 'Model sandaran',
      type: 'choice',
      options: [
        { value: 'papan', label: 'Papan', desc: 'Satu papan di antara dua palang' },
        { value: 'jeruji', label: 'Jeruji besi tegak', desc: 'Batang-batang tegak berjajar, tanpa papan' },
      ],
      showIf: (p) => backOf(p) && !isNew(p),
    },
    {
      key: 'tinggiSandaran',
      label: 'Tinggi sandaran dari lantai',
      type: 'number',
      unit: 'cm',
      min: 60,
      max: 125,
      step: 1,
      help: 'Kursi gantung: tinggi atap sangkar dari lantai.',
      marks: [{ value: 85, label: 'kursi' }, { value: 105, label: 'stool bar' }],
      showIf: (p) => backOf(p) || modelOf(p) === 'gantung',
    },
    { key: 'miringSandaran', label: 'Kemiringan sandaran', type: 'number', unit: '°', min: 0, max: 25, step: 1, help: '0 = tegak. 10–15° nyaman untuk makan & santai.', marks: [{ value: 0, label: 'tegak' }, { value: 12, label: 'nyaman' }], showIf: (p) => backOf(p) },
    {
      key: 'sudutSandaran',
      label: 'Sudut sandaran dari datar',
      type: 'number',
      unit: '°',
      min: 15,
      max: 75,
      step: 5,
      help: 'Pindahkan kaki penyangga ke palang takik lain untuk mengubahnya. 15 = hampir rebah, 70 = duduk.',
      marks: [{ value: 15, label: 'rebah' }, { value: 45, label: 'santai' }, { value: 70, label: 'duduk' }],
      showIf: (p) => modelOf(p) === 'malas',
    },
    {
      key: 'tinggiRangka',
      label: 'Tinggi rangka gantungan',
      type: 'number',
      unit: 'cm',
      min: 170,
      max: 240,
      step: 1,
      help: 'Dari lantai sampai balok / lengan atas tempat batang gantung.',
      marks: [{ value: 200, label: 'umum' }],
      showIf: (p) => ['ayun-a', 'gantung'].includes(modelOf(p)),
    },
    { key: 'sandaranTangan', label: 'Sandaran tangan', type: 'toggle', help: 'Lengan di kiri & kanan, ±22 cm di atas dudukan.', showIf: (p) => p.jenis !== 'stool' && modelOf(p) === 'empat' && backOf(p) },
    { key: 'sudutKaki', label: 'Kaki melebar', type: 'number', unit: '°', min: 0, max: 12, step: 1, help: '0 = kaki tegak. Kaki melebar membuat kursi lebih stabil.', marks: [{ value: 0, label: 'tegak' }, { value: 6, label: 'melebar' }], showIf: (p) => ['empat', 'tiga', 'bayi'].includes(modelOf(p)) },
    { key: 'palangKaki', label: 'Palang penguat kaki', type: 'toggle', help: 'Supaya kaki tidak goyang.', showIf: (p) => !isNew(p) && p.jenis !== 'stool' && (modelOf(p) === 'empat' || modelOf(p) === 'kotak') },
    { key: 'pijakan', label: 'Pijakan kaki', type: 'toggle', help: 'Tempat menaruh kaki di kursi tinggi.', showIf: (p) => ['putar', 'tiga'].includes(modelOf(p)) || (!isNew(p) && p.jenis === 'stool') },
    {
      key: 'tinggiPijakan',
      label: 'Tinggi pijakan dari lantai',
      type: 'number',
      unit: 'cm',
      min: 15,
      max: 45,
      step: 1,
      showIf: (p) => modelOf(p) === 'bayi' || ((['putar', 'tiga'].includes(modelOf(p)) || (!isNew(p) && p.jenis === 'stool')) && p.pijakan === true),
    },
    { key: 'kakiTengah', label: 'Kaki tengah', type: 'toggle', help: 'Untuk bangku panjang.', showIf: (p) => !isNew(p) && p.jenis === 'bangku' },
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
    mejaSamping: false, diameterMeja: 40, tinggiMeja: 60, mejaDepan: 0, lebarMejaDepan: 45, tinggiMejaDepan: 72, panjang: 190, sudutSandaran: 45, tinggiRangka: 200,
    pipa: '20', papan: 'kayu', warna: '#1f2226',
  },
  groups: [
    { id: 'kursi', name: 'Kursi makan, kerja & anak', desc: 'Kursi 1 orang untuk meja makan, meja kerja, cafe dan anak' },
    { id: 'bangku', name: 'Bangku panjang', desc: 'Bangku teras, bangku sepatu, bangku cafe bermeja, bangku keliling pohon' },
    { id: 'stool', name: 'Stool & kursi bar', desc: 'Kursi tinggi untuk meja bar 105 cm / dapur 90 cm, dan dingklik' },
    { id: 'santai', name: 'Kursi santai & ayunan', desc: 'Kursi teras berlengan, kantilever, kursi malas, lesehan, ayunan, kursi gantung' },
  ],
  signature: (p) => {
    const m = modelOf(p);
    if (m === 'empat') {
      if (str(p, 'jenis') === 'stool') return 'empat-kaki|melebar|pijakan-keliling';
      return sideTableOf(p) || frontTablesOf(p) > 0 ? 'empat-kaki|palang-h|meja-menyatu' : 'empat-kaki|palang-h';
    }
    const sig: Record<string, string> = {
      sled: 'kaki-sled|rel-samping|kaki-miring',
      kotak: 'panel-samping|bingkai-kotak',
      silang: 'kaki-x|palang-tengah',
      a: 'kaki-a|palang-mendatar',
      kantilever: 'kantilever|rel-u',
      lengan: 'panel-samping|miring|lengan',
      tiang: 'tiang-tunggal|alas-silang|pijakan',
      putar: 'tiang-tunggal|plat-bundar|putar',
      bintang: 'tiang-tunggal|kaki-bintang|roda|putar',
      tiga: 'tiga-kaki|melebar|palang-segitiga',
      malas: 'kaki-sled|rebah|sandaran-setel',
      lesehan: 'rangka-lantai|topang-miring|sandaran',
      'ayun-a': 'kaki-a|balok-atas|dudukan-gantung',
      gantung: 'kantilever-tiang|sangkar-gantung',
      pohon: 'cincin-keliling|empat-muka|lubang',
      bayi: 'empat-kaki|melebar|baki|pijakan',
    };
    return sig[m] || m;
  },
  presets: [
    // ---------- Kursi makan, kerja & anak ----------
    {
      id: 'makan',
      group: 'kursi',
      name: 'Kursi & bangku empat kaki',
      desc: 'empat kaki tegak + palang H, kaki belakang naik jadi tiang sandaran',
      params: { jenis: 'kursi', rangka: 'empat', sandaran: true, modelSandaran: 'papan', miringSandaran: 10, palangKaki: true, pipa: '20' },
      sizes: [
        { label: 'Kursi makan', desc: 'dudukan 45 × 42, sandaran papan', params: { jenis: 'kursi', lebar: 45, dalam: 42, tinggiDudukan: 45, sandaran: true, modelSandaran: 'papan', tinggiSandaran: 85, miringSandaran: 10, sandaranTangan: false, sudutKaki: 0, kakiTengah: false, dudukan: 'papan', pipa: '20' } },
        { label: 'Sandaran jeruji tinggi', desc: 'batang tegak berjajar, sandaran 95', params: { jenis: 'kursi', lebar: 45, dalam: 42, tinggiDudukan: 45, sandaran: true, modelSandaran: 'jeruji', tinggiSandaran: 95, miringSandaran: 8, sandaranTangan: false, sudutKaki: 5, kakiTengah: false, dudukan: 'papan', pipa: '20' } },
        { label: 'Kursi bersandaran tangan', desc: 'tiang depan naik jadi lengan', params: { jenis: 'kursi', lebar: 50, dalam: 45, tinggiDudukan: 45, sandaran: true, modelSandaran: 'papan', tinggiSandaran: 85, miringSandaran: 10, sandaranTangan: true, sudutKaki: 0, kakiTengah: false, dudukan: 'papan', pipa: '20' } },
        { label: 'Bangku panjang 150', desc: 'tanpa sandaran, kaki tengah', params: { jenis: 'bangku', lebar: 150, dalam: 38, tinggiDudukan: 45, sandaran: false, modelSandaran: 'papan', tinggiSandaran: 85, miringSandaran: 10, sandaranTangan: false, sudutKaki: 0, kakiTengah: true, dudukan: 'papan', pipa: '30' } },
        { label: 'Bangku taman bersandaran', desc: '150 × 45, dudukan bilah besi', params: { jenis: 'bangku', lebar: 150, dalam: 45, tinggiDudukan: 45, sandaran: true, modelSandaran: 'papan', tinggiSandaran: 85, miringSandaran: 12, sandaranTangan: false, sudutKaki: 0, kakiTengah: true, dudukan: 'bilah', pipa: '30' } },
      ],
    },
    {
      id: 'kursi-sled',
      group: 'kursi',
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
      group: 'kursi',
      name: 'Kursi, stool & bangku kaki silang X',
      desc: 'kaki bersilang X di tiap sisi + palang tengah di titik silang',
      params: { jenis: 'kursi', rangka: 'silang', sandaran: true, modelSandaran: 'papan', miringSandaran: 10, pipa: '20' },
      sizes: [
        { label: 'Kursi makan', desc: 'dudukan 45 × 42, sandaran papan', params: { jenis: 'kursi', lebar: 45, dalam: 42, tinggiDudukan: 45, sandaran: true, tinggiSandaran: 82, dudukan: 'papan', kakiTengah: false, pijakan: false, pipa: '20' } },
        { label: 'Kursi cafe dudukan bilah', desc: 'bilah besi, tahan hujan', params: { jenis: 'kursi', lebar: 44, dalam: 42, tinggiDudukan: 45, sandaran: true, tinggiSandaran: 80, dudukan: 'bilah', kakiTengah: false, pijakan: false, pipa: '20' } },
        { label: 'Stool / dingklik', desc: '40 × 32, tanpa sandaran', params: { jenis: 'stool', lebar: 40, dalam: 32, tinggiDudukan: 45, sandaran: false, dudukan: 'papan', kakiTengah: false, pijakan: false, pipa: '20' } },
        { label: 'Bangku 120', desc: '120 × 38, tanpa sandaran', params: { jenis: 'bangku', lebar: 120, dalam: 38, tinggiDudukan: 45, sandaran: false, dudukan: 'papan', kakiTengah: false, pijakan: false, pipa: '30' } },
        { label: 'Bangku 150 + silang tengah', desc: '150 × 40, tanpa sandaran', params: { jenis: 'bangku', lebar: 150, dalam: 40, tinggiDudukan: 45, sandaran: false, dudukan: 'papan', kakiTengah: true, pijakan: false, pipa: '30' } },
      ],
    },
    {
      id: 'kursi-kerja',
      group: 'kursi',
      name: 'Kursi kerja kaki bintang beroda',
      desc: 'satu tiang di atas 5 lengan kaki beroda, dudukan putar, sandaran satu tiang di belakang',
      params: { rangka: 'bintang', jenis: 'kursi', lebar: 46, dalam: 44, tinggiDudukan: 46, tinggiSandaran: 92, miringSandaran: 10, pipa: '30' },
      sizes: [
        { label: 'Kursi kerja / kantor', desc: 'dudukan 46 × 44, tinggi 46', params: { lebar: 46, dalam: 44, tinggiDudukan: 46, tinggiSandaran: 92 } },
        { label: 'Kursi bengkel / kasir rendah', desc: 'dudukan 42 × 40, sandaran pendek', params: { lebar: 42, dalam: 40, tinggiDudukan: 50, tinggiSandaran: 82 } },
      ],
    },
    {
      id: 'kursi-bayi',
      group: 'kursi',
      name: 'Kursi makan bayi (high chair)',
      desc: 'empat kaki tinggi melebar, sandaran + lengan, baki di ujung lengan, papan pijakan',
      params: { rangka: 'bayi', jenis: 'kursi', lebar: 34, dalam: 32, tinggiDudukan: 58, tinggiSandaran: 95, miringSandaran: 8, sudutKaki: 8, tinggiPijakan: 32, pipa: '20' },
      sizes: [
        { label: 'Bayi 6 bln – 3 th', desc: 'dudukan 34 × 32, tinggi 58', params: { lebar: 34, dalam: 32, tinggiDudukan: 58, tinggiSandaran: 95, tinggiPijakan: 32 } },
        { label: 'Anak 3 – 6 th (meja bar)', desc: 'dudukan 38 × 34, tinggi 62', params: { lebar: 38, dalam: 34, tinggiDudukan: 62, tinggiSandaran: 100, tinggiPijakan: 30 } },
      ],
    },
    // ---------- Bangku panjang ----------
    {
      id: 'bangku-rak',
      group: 'bangku',
      name: 'Bangku & stool rangka kotak samping',
      desc: 'sisi kiri & kanan bingkai kotak tertutup dengan rel lantai, opsi papan rak di bawah',
      params: { jenis: 'bangku', rangka: 'kotak', sandaran: false, rakBawah: true, palangKaki: false, kakiTengah: false, pipa: '30' },
      sizes: [
        { label: 'Bangku sepatu + rak', desc: '90 × 35 × 45 cm', params: { jenis: 'bangku', lebar: 90, dalam: 35, tinggiDudukan: 45, rakBawah: true, kakiTengah: false, pijakan: false, pipa: '30' } },
        { label: 'Bangku teras + rak', desc: '120 × 40 × 45 cm', params: { jenis: 'bangku', lebar: 120, dalam: 40, tinggiDudukan: 45, rakBawah: true, kakiTengah: false, pijakan: false, pipa: '30' } },
        { label: 'Bangku 150 + kaki tengah', desc: '150 × 40 × 45 cm', params: { jenis: 'bangku', lebar: 150, dalam: 40, tinggiDudukan: 45, rakBawah: true, kakiTengah: true, pijakan: false, pipa: '30' } },
        { label: 'Stool kotak', desc: '38 × 32, tinggi 45', params: { jenis: 'stool', lebar: 38, dalam: 32, tinggiDudukan: 45, rakBawah: false, kakiTengah: false, pijakan: false, pipa: '20' } },
        { label: 'Stool bar kotak + pijakan', desc: '38 × 34, tinggi 75', params: { jenis: 'stool', lebar: 38, dalam: 34, tinggiDudukan: 75, rakBawah: false, kakiTengah: false, pijakan: true, tinggiPijakan: 30, pipa: '20' } },
      ],
    },
    {
      id: 'bangku-meja',
      group: 'bangku',
      name: 'Bangku + meja menyatu',
      desc: 'bangku empat kaki dengan daun meja kecil bertiang yang naik dari rangka bangku',
      params: { jenis: 'bangku', rangka: 'empat', lebar: 150, dalam: 45, sandaran: false, mejaSamping: false, rakBawah: false, kakiTengah: true, palangKaki: true, mejaDepan: 2, lebarMejaDepan: 45, tinggiMejaDepan: 72, pipa: '30' },
      sizes: [
        { label: '150 cm + 2 meja depan', desc: 'bangku cafe trotoar', params: { lebar: 150, dalam: 45, tinggiDudukan: 45, mejaSamping: false, mejaDepan: 2, lebarMejaDepan: 45, kakiTengah: true, dudukan: 'papan' } },
        { label: '120 cm + 1 meja depan', desc: '120 × 45 cm', params: { lebar: 120, dalam: 45, tinggiDudukan: 45, mejaSamping: false, mejaDepan: 1, lebarMejaDepan: 45, kakiTengah: false, dudukan: 'papan' } },
        { label: '150 cm + meja samping bundar', desc: 'kaki kanan jadi tiang meja ø40, bilah besi', params: { lebar: 150, dalam: 40, tinggiDudukan: 45, mejaSamping: true, diameterMeja: 40, tinggiMeja: 60, mejaDepan: 0, kakiTengah: true, dudukan: 'bilah' } },
        { label: '120 cm + meja samping bundar', desc: 'meja ø35, papan kayu', params: { lebar: 120, dalam: 40, tinggiDudukan: 45, mejaSamping: true, diameterMeja: 35, tinggiMeja: 60, mejaDepan: 0, kakiTengah: false, dudukan: 'papan' } },
      ],
    },
    {
      id: 'bangku-pohon',
      group: 'bangku',
      name: 'Bangku keliling pohon',
      desc: 'rangka cincin persegi berlubang di tengah, empat papan dudukan berputar menghadap keluar',
      params: { rangka: 'pohon', jenis: 'bangku', lebar: 170, dalam: 42, tinggiDudukan: 45, pipa: '30' },
      sizes: [
        { label: 'Pohon sedang', desc: 'sisi 170, lubang 86 cm', params: { lebar: 170, dalam: 42, tinggiDudukan: 45 } },
        { label: 'Pohon kecil / tiang', desc: 'sisi 140, lubang 56 cm', params: { lebar: 140, dalam: 42, tinggiDudukan: 45 } },
        { label: 'Pohon besar', desc: 'sisi 200, lubang 110 cm', params: { lebar: 200, dalam: 45, tinggiDudukan: 45 } },
      ],
    },
    // ---------- Stool & kursi bar ----------
    {
      id: 'bar',
      group: 'stool',
      name: 'Stool bar empat kaki + pijakan',
      desc: 'empat kaki melebar, pijakan keliling, opsi sandaran rendah',
      params: { jenis: 'stool', rangka: 'empat', sandaran: false, sudutKaki: 6, pijakan: true, pipa: '20' },
      sizes: [
        { label: 'Bar (meja 105)', desc: 'dudukan 75 cm, kaki melebar', params: { lebar: 35, dalam: 35, tinggiDudukan: 75, tinggiPijakan: 32, sudutKaki: 6, bentukDudukan: 'kotak', sandaran: false, pijakan: true } },
        { label: 'Counter (meja 90)', desc: 'dudukan 65 cm', params: { lebar: 35, dalam: 35, tinggiDudukan: 65, tinggiPijakan: 23, sudutKaki: 6, bentukDudukan: 'kotak', sandaran: false, pijakan: true } },
        { label: 'Bar bersandaran', desc: 'dudukan 75, sandaran 105 cm', params: { lebar: 40, dalam: 38, tinggiDudukan: 75, tinggiPijakan: 32, sudutKaki: 4, bentukDudukan: 'kotak', sandaran: true, tinggiSandaran: 105, miringSandaran: 8, pijakan: true } },
        { label: 'Bar dudukan bundar', desc: 'ø32, dudukan 75 cm', params: { lebar: 32, dalam: 32, tinggiDudukan: 75, tinggiPijakan: 32, sudutKaki: 6, bentukDudukan: 'bulat', sandaran: false, pijakan: true } },
        { label: 'Stool pendek', desc: 'dudukan 45 cm, tanpa pijakan', params: { lebar: 32, dalam: 32, tinggiDudukan: 45, sudutKaki: 0, bentukDudukan: 'kotak', sandaran: false, pijakan: false } },
      ],
    },
    {
      id: 'stool-tiang',
      group: 'stool',
      name: 'Stool tiang tunggal kaki silang',
      desc: 'satu tiang tengah 40×40 di atas kaki silang lantai, pijakan kotak',
      params: { jenis: 'stool', rangka: 'tiang', sandaran: false, bentukDudukan: 'bulat', pijakan: true, lebar: 36, dalam: 36, tinggiDudukan: 75, tinggiPijakan: 30, pipa: '20' },
      sizes: [
        { label: 'Bar (meja 105)', desc: 'ø36, dudukan 75 cm', params: { lebar: 36, dalam: 36, tinggiDudukan: 75, tinggiPijakan: 30 } },
        { label: 'Counter (meja 90)', desc: 'ø36, dudukan 65 cm', params: { lebar: 36, dalam: 36, tinggiDudukan: 65, tinggiPijakan: 22 } },
        { label: 'Dudukan kotak', desc: '36 × 36, dudukan 75 cm', params: { lebar: 36, dalam: 36, tinggiDudukan: 75, tinggiPijakan: 30, bentukDudukan: 'kotak' } },
      ],
    },
    {
      id: 'stool-putar',
      group: 'stool',
      name: 'Stool putar plat bundar',
      desc: 'satu tiang di plat besi bundar, dudukan di atas bantalan putar, sandaran satu tiang',
      params: { rangka: 'putar', jenis: 'stool', lebar: 38, dalam: 38, tinggiDudukan: 75, sandaran: true, tinggiSandaran: 102, miringSandaran: 8, bentukDudukan: 'bulat', pijakan: true, tinggiPijakan: 30, pipa: '40' },
      sizes: [
        { label: 'Bar bersandaran', desc: 'ø38, dudukan 75 cm', params: { lebar: 38, tinggiDudukan: 75, sandaran: true, tinggiSandaran: 102, pijakan: true, tinggiPijakan: 30 } },
        { label: 'Counter tanpa sandaran', desc: 'ø36, dudukan 65 cm', params: { lebar: 36, tinggiDudukan: 65, sandaran: false, pijakan: true, tinggiPijakan: 22 } },
        { label: 'Stool kerja rendah', desc: 'ø36, dudukan 48 cm', params: { lebar: 36, tinggiDudukan: 48, sandaran: false, pijakan: false } },
      ],
    },
    {
      id: 'stool-tiga',
      group: 'stool',
      name: 'Stool tiga kaki',
      desc: 'tiga kaki melebar ke lantai, palang segitiga di bawah dudukan dan di pijakan',
      params: { rangka: 'tiga', jenis: 'stool', lebar: 36, tinggiDudukan: 75, sudutKaki: 7, bentukDudukan: 'bulat', pijakan: true, tinggiPijakan: 30, pipa: '30' },
      sizes: [
        { label: 'Bar (meja 105)', desc: 'ø36, dudukan 75 cm', params: { lebar: 36, tinggiDudukan: 75, pijakan: true, tinggiPijakan: 30 } },
        { label: 'Counter (meja 90)', desc: 'ø36, dudukan 65 cm', params: { lebar: 36, tinggiDudukan: 65, pijakan: true, tinggiPijakan: 22 } },
        { label: 'Stool duduk / dingklik', desc: 'ø34, dudukan 45 cm', params: { lebar: 34, tinggiDudukan: 45, pijakan: false } },
      ],
    },
    {
      id: 'stool-a',
      group: 'stool',
      name: 'Stool kaki A',
      desc: 'kaki depan & belakang bertemu di bawah tengah dudukan, palang mendatar',
      params: { jenis: 'stool', rangka: 'a', sandaran: false, pijakan: false, pipa: '20' },
      sizes: [
        { label: 'Stool duduk', desc: '40 × 34, tinggi 45', params: { lebar: 40, dalam: 34, tinggiDudukan: 45 } },
        { label: 'Dingklik rendah', desc: '36 × 30, tinggi 30', params: { lebar: 36, dalam: 30, tinggiDudukan: 30 } },
      ],
    },
    // ---------- Kursi santai & ayunan ----------
    {
      id: 'kursi-santai',
      group: 'santai',
      name: 'Kursi & bangku rangka samping + lengan',
      desc: 'bingkai samping menerus: rel lantai, kaki belakang miring, lengan datar',
      params: { jenis: 'kursi', rangka: 'lengan', sandaran: true, modelSandaran: 'papan', miringSandaran: 15, pipa: '30' },
      sizes: [
        { label: 'Kursi teras', desc: 'dudukan 58 × 52, tinggi 38', params: { jenis: 'kursi', lebar: 58, dalam: 52, tinggiDudukan: 38, tinggiSandaran: 82, miringSandaran: 15, dudukan: 'papan', kakiTengah: false } },
        { label: 'Kursi taman dudukan bilah', desc: 'bilah besi, tahan hujan', params: { jenis: 'kursi', lebar: 58, dalam: 52, tinggiDudukan: 38, tinggiSandaran: 82, miringSandaran: 15, dudukan: 'bilah', kakiTengah: false } },
        { label: 'Bangku taman 150', desc: '150 × 48, rangka tengah, bilah', params: { jenis: 'bangku', lebar: 150, dalam: 48, tinggiDudukan: 43, tinggiSandaran: 82, miringSandaran: 12, dudukan: 'bilah', kakiTengah: true } },
        { label: 'Bangku taman 120', desc: '120 × 48, dudukan papan', params: { jenis: 'bangku', lebar: 120, dalam: 48, tinggiDudukan: 43, tinggiSandaran: 82, miringSandaran: 12, dudukan: 'papan', kakiTengah: false } },
      ],
    },
    {
      id: 'kursi-kantilever',
      group: 'santai',
      name: 'Kursi kantilever',
      desc: 'tanpa kaki belakang: rel lantai berbentuk U, kaki depan naik ke dudukan',
      params: { jenis: 'kursi', rangka: 'kantilever', sandaran: true, modelSandaran: 'papan', miringSandaran: 10, pipa: '30' },
      sizes: [
        { label: 'Kursi tamu / kantor', desc: 'dudukan 46 × 44, tinggi 45', params: { lebar: 46, dalam: 44, tinggiDudukan: 45, tinggiSandaran: 82, miringSandaran: 10 } },
        { label: 'Kursi santai rendah', desc: 'dudukan 52 × 48, tinggi 40', params: { lebar: 52, dalam: 48, tinggiDudukan: 40, tinggiSandaran: 80, miringSandaran: 14 } },
      ],
    },
    {
      id: 'kursi-malas',
      group: 'santai',
      name: 'Kursi malas (rebahan)',
      desc: 'rangka panjang di rel lantai, sandaran berporos yang ditahan kaki penyangga di palang takik',
      params: { rangka: 'malas', jenis: 'kursi', lebar: 65, panjang: 190, tinggiDudukan: 35, sudutSandaran: 45, pipa: '30' },
      sizes: [
        { label: 'Kursi kolam / pantai', desc: '190 × 65, dudukan 35', params: { lebar: 65, panjang: 190, tinggiDudukan: 35, sudutSandaran: 45 } },
        { label: 'Kursi jemur rendah', desc: '180 × 60, dudukan 28, sandaran 30°', params: { lebar: 60, panjang: 180, tinggiDudukan: 28, sudutSandaran: 30 } },
        { label: 'Daybed teras', desc: '200 × 75, dudukan 40', params: { lebar: 75, panjang: 200, tinggiDudukan: 40, sudutSandaran: 60 } },
      ],
    },
    {
      id: 'kursi-lesehan',
      group: 'santai',
      name: 'Kursi lesehan (tanpa kaki)',
      desc: 'rangka kotak menapak di lantai, tiang sandaran miring ditopang batang miring ke rel lantai belakang',
      params: { rangka: 'lesehan', jenis: 'kursi', lebar: 48, dalam: 45, tinggiSandaran: 62, miringSandaran: 18, pipa: '30' },
      sizes: [
        { label: 'Kursi lesehan', desc: '48 × 45, sandaran 62', params: { lebar: 48, dalam: 45, tinggiSandaran: 62, miringSandaran: 18 } },
        { label: 'Lesehan lebar (2 orang)', desc: '100 × 48, sandaran 65', params: { lebar: 100, dalam: 48, tinggiSandaran: 65, miringSandaran: 18 } },
      ],
    },
    {
      id: 'ayunan-a',
      group: 'santai',
      name: 'Ayunan bangku rangka A',
      desc: 'kaki A di kedua ujung disambung balok atas, bangku bersandaran digantung empat batang',
      params: { rangka: 'ayun-a', jenis: 'bangku', lebar: 120, dalam: 50, tinggiDudukan: 45, tinggiSandaran: 88, miringSandaran: 12, tinggiRangka: 200, pipa: '40' },
      sizes: [
        { label: 'Ayunan 2 orang', desc: 'bangku 120 × 50, rangka 200', params: { lebar: 120, dalam: 50, tinggiDudukan: 45, tinggiSandaran: 88, tinggiRangka: 200 } },
        { label: 'Ayunan 3 orang', desc: 'bangku 150 × 52, rangka 210', params: { lebar: 150, dalam: 52, tinggiDudukan: 45, tinggiSandaran: 90, tinggiRangka: 210 } },
        { label: 'Ayunan anak', desc: 'bangku 80 × 42, rangka 170', params: { lebar: 80, dalam: 42, tinggiDudukan: 38, tinggiSandaran: 72, tinggiRangka: 170 } },
      ],
    },
    {
      id: 'kursi-gantung',
      group: 'santai',
      name: 'Kursi gantung tiang',
      desc: 'tiang Γ di kaki silang lantai, siku di pojok lengan, sangkar kursi digantung satu batang di ujung lengan',
      params: { rangka: 'gantung', jenis: 'kursi', lebar: 60, dalam: 55, tinggiDudukan: 45, tinggiSandaran: 112, tinggiRangka: 200, pipa: '40' },
      sizes: [
        { label: 'Kursi gantung 1 orang', desc: 'sangkar 60 × 55, tiang 200', params: { lebar: 60, dalam: 55, tinggiDudukan: 45, tinggiSandaran: 112, tinggiRangka: 200 } },
        { label: 'Kursi gantung lebar', desc: 'sangkar 75 × 60, tiang 210', params: { lebar: 75, dalam: 60, tinggiDudukan: 45, tinggiSandaran: 115, tinggiRangka: 210 } },
      ],
    },
  ],
  summary: (p) => {
    const m = modelOf(p);
    const W = num(p, 'lebar');
    if (m === 'pohon') return `Bangku keliling pohon · sisi luar ${W} cm, lubang ${W - 2 * num(p, 'dalam')} cm, tinggi ${num(p, 'tinggiDudukan')} cm`;
    if (m === 'malas') return `Kursi malas · ${num(p, 'panjang')} × ${W} cm, dudukan ${num(p, 'tinggiDudukan')} cm, sandaran ${num(p, 'sudutSandaran')}°`;
    if (m === 'lesehan') return `Kursi lesehan · ${W} × ${num(p, 'dalam')} cm, sandaran ${num(p, 'tinggiSandaran')} cm`;
    if (m === 'ayun-a') return `Ayunan · bangku ${W} × ${num(p, 'dalam')} cm, rangka ${num(p, 'tinggiRangka')} cm`;
    if (m === 'gantung') return `Kursi gantung · sangkar ${W} × ${num(p, 'dalam')} cm, tiang ${num(p, 'tinggiRangka')} cm`;
    if (m === 'putar' || m === 'tiga') return `Stool · dudukan ø${W} cm, tinggi ${num(p, 'tinggiDudukan')} cm`;
    if (m === 'bintang') return `Kursi kerja · dudukan ${W} × ${num(p, 'dalam')} cm, tinggi ${num(p, 'tinggiDudukan')} cm`;
    if (m === 'bayi') return `Kursi bayi · dudukan ${W} × ${num(p, 'dalam')} cm, tinggi ${num(p, 'tinggiDudukan')} cm`;
    return `${str(p, 'jenis') === 'bangku' ? 'Bangku' : str(p, 'jenis') === 'stool' ? 'Stool' : 'Kursi'} · dudukan ${W} × ${num(p, 'dalam')} cm, tinggi ${num(p, 'tinggiDudukan')} cm`;
  },

  build: (p) => {
    const model = modelOf(p);
    if (model === 'tiang') return buildTiang(p);
    const special: Record<string, (q: Params) => ProductBuild> = {
      putar: buildPutar,
      bintang: buildBintang,
      tiga: buildTiga,
      malas: buildMalas,
      lesehan: buildLesehan,
      'ayun-a': buildAyunA,
      gantung: buildGantung,
      pohon: buildPohon,
      bayi: buildBayi,
    };
    if (special[model]) return special[model](p);
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
    if (isNew(p)) return newChecks(p);
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

// ======================================================================
// Model rangka baru (NEW_MODELS): tiap fungsi = satu struktur rangka
// Koordinat cm: x = kiri→kanan, y = lantai→atas, z = belakang→depan.
// ======================================================================

type Tube = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;
const R20: Tube = [20, 20];

/** Ukuran dasar yang dipakai semua model baru */
function dims(p: Params) {
  const L = (parseInt(str(p, 'pipa', '20')) || 20) / 10;
  const papanB = BOARD_THICK[str(p, 'papan', 'kayu')] ?? 2.5;
  return {
    W: num(p, 'lebar', 45),
    D: num(p, 'dalam', 42),
    Hs: num(p, 'tinggiDudukan', 45),
    L,
    papanB,
    b: Math.max(papanB, 1.8), // dudukan tetap digambar walau "tanpa papan" (dudukan wajib ada)
    leg: [L * 10, L * 10] as Tube,
  };
}

/**
 * Batang miring yang ujungnya dipotong rata (mendatar) lalu dilas ke SISI tegak batang lain: as ujungnya mundur
 * dari sisi itu supaya sudut potongan menempel rata, tidak masuk ke dalam batang. dh0 = jarak datar as-ke-sisi,
 * dv = beda tinggi, t = tebal batang (cm).
 */
const flushBack = (dh0: number, dv: number, t: number) => {
  let off = 0;
  for (let i = 0; i < 6; i++) off = ((t / 2) * Math.hypot(dh0 - off, dv)) / Math.abs(dv);
  return off;
};

/** Titik sepanjang garis a→b pada ketinggian y */
const atY = (a: P3, b: P3, y: number): P3 => {
  const t = (y - a[1]) / (b[1] - a[1]);
  return [a[0] + (b[0] - a[0]) * t, y, a[2] + (b[2] - a[2]) * t];
};

/**
 * Palang mendatar di antara dua batang miring pada ketinggian y: ujungnya berhenti sebelum sisi batang
 * (celah las kecil), jadi tidak ada sambungan yang tembus.
 */
function railBetween(line: ReturnType<typeof memberFactory>['line'], id: string, label: string, p1: P3, p2: P3, gap: number, tube: Tube) {
  const dx = p2[0] - p1[0];
  const dz = p2[2] - p1[2];
  const len = Math.hypot(dx, dz);
  if (len < 2 * gap + 1) return;
  const ux = dx / len;
  const uz = dz / len;
  line(id, [p1[0] + ux * gap, p1[1], p1[2] + uz * gap], [p2[0] - ux * gap, p2[1], p2[2] - uz * gap], 'custom', label, tube);
}

/**
 * Sandaran satu tiang untuk dudukan putar: lengan 20×20 dibaut di bawah dudukan menuju belakang,
 * tiang sandaran (miring ke belakang) berdiri di ujung lengan, papan sandaran di depan tiang.
 */
function singlePostBack(
  f: ReturnType<typeof memberFactory>,
  boards: Board[],
  o: { cx: number; cz: number; yS: number; Hb: number; seatBack: number; plateR: number; tilt: number; bw: number }
) {
  const T = 3; // tiang sandaran 30×30
  const tanT = Math.tan(rad(o.tilt));
  const zp = o.cz - o.seatBack - T / 2; // as tiang: tepat di belakang tepi dudukan
  const y0 = o.yS - 2; // bawah lengan
  f.add('lengan-sandaran', 'z', o.cx, o.yS - 1, zp + T / 2, o.cz - o.plateR - (zp + T / 2), 'rail-z', 'Lengan sandaran (di bawah dudukan)', R20);
  f.line('tiang-sandaran', [o.cx, y0, zp], [o.cx, o.Hb, zp - tanT * (o.Hb - y0)], 'post', 'Tiang sandaran', [30, 30]);
  const hb = Math.min(20, Math.max(10, (o.Hb - o.yS) * 0.45));
  const ym = o.Hb - hb / 2 - 2;
  const zc = zp - tanT * (ym - y0) + T / 2 + 0.9;
  boards.push({ ...board('papan-sandaran', 'Papan sandaran', o.cx - o.bw / 2, o.cx + o.bw / 2, ym - hb / 2, ym + hb / 2, zc - 0.9, zc + 0.9), rotX: -o.tilt });
}

/** Pijakan kotak keliling tiang tengah + jari ke sisi tiang (kiri & kanan) */
function ringFootrest(f: ReturnType<typeof memberFactory>, cx: number, cz: number, yP: number, h: number, P: number) {
  f.add('pijakan-depan', 'x', cx - h - 1, yP, cz + h, 2 * h + 2, 'rail-x', 'Pijakan kaki depan', R20);
  f.add('pijakan-belakang', 'x', cx - h - 1, yP, cz - h, 2 * h + 2, 'rail-x', 'Pijakan kaki belakang', R20);
  f.add('pijakan-kiri', 'z', cx - h, yP, cz - h + 1, 2 * h - 2, 'rail-z', 'Pijakan kaki kiri', R20);
  f.add('pijakan-kanan', 'z', cx + h, yP, cz - h + 1, 2 * h - 2, 'rail-z', 'Pijakan kaki kanan', R20);
  f.add('jari-kiri', 'x', cx - h + 1, yP, cz, h - 1 - P / 2, 'rail-x', 'Jari pijakan kiri', R20);
  f.add('jari-kanan', 'x', cx + P / 2, yP, cz, h - 1 - P / 2, 'rail-x', 'Jari pijakan kanan', R20);
}

/** Stool putar: plat dasar bundar 8 mm, satu tiang, plat bantalan putar di bawah dudukan, sandaran satu tiang */
function buildPutar(p: Params): ProductBuild {
  const { W, Hs, L, papanB, b } = dims(p);
  const yS = Hs - b;
  const P = Math.max(4, L); // tiang min 40×40
  const Db = Math.max(W + 4, Math.round(Hs * 0.55)); // diameter plat dasar
  const c = Math.max(Db / 2, W / 2 + 6);
  const plateR = 10;
  const f = memberFactory();
  const boards: Board[] = [];
  boards.push({ ...board('plat-dasar', 'Plat dasar bundar', c - Db / 2, c + Db / 2, 0, 0.8, c - Db / 2, c + Db / 2), shape: 'round', steelMm: 8 });
  f.add('tiang', 'y', c, 0.8, c, yS - 0.6 - 0.8, 'post', 'Tiang tengah', [P * 10, P * 10]);
  boards.push({ ...board('plat-putar', 'Plat bantalan putar (swivel)', c - plateR, c + plateR, yS - 0.6, yS, c - plateR, c + plateR), shape: 'round', steelMm: 6 });
  if (bool(p, 'pijakan')) ringFootrest(f, c, c, num(p, 'tinggiPijakan', 28), Math.min(18, Db / 2 - 2), P);
  const back = bool(p, 'sandaran');
  const Hb = Math.max(Hs + 18, num(p, 'tinggiSandaran', 102));
  if (back) singlePostBack(f, boards, { cx: c, cz: c, yS, Hb, seatBack: W / 2, plateR, tilt: num(p, 'miringSandaran', 8), bw: Math.min(W, 36) });
  const seat = board('dudukan', 'Papan dudukan', c - W / 2, c + W / 2, yS, Hs, c - W / 2, c + W / 2);
  if (str(p, 'bentukDudukan') === 'bulat') seat.shape = 'round';
  boards.push(seat);
  return { members: f.list, boards, casters: [], W: 2 * c, D: 2 * c, H: back ? Hb : Hs, boardThick: papanB };
}

/** Kursi kerja: 5 lengan kaki beroda dari hub tengah, tiang, plat putar, dudukan kotak, sandaran satu tiang */
function buildBintang(p: Params): ProductBuild {
  const { W, D, Hs, papanB, b } = dims(p);
  const yS = Hs - b;
  const inch = 3;
  const c0 = casterHeight(inch);
  const R = Math.max(W, D) / 2 + 6; // jari-jari kaki bintang
  const c = R + 3;
  const arm: Tube = [30, 30];
  const ya = c0 + 1.5; // as lengan kaki
  const f = memberFactory();
  const boards: Board[] = [];
  f.add('hub', 'y', c, c0, c, 3, 'custom', 'Hub kaki bintang', [60, 60]);
  const casters: Caster[] = [];
  for (let k = 0; k < 5; k++) {
    const a = rad(-90 + 72 * k);
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    // lengan mulai sedikit di luar hub (dilas lewat plat pengaku), ujung di atas roda
    f.line(`kaki-${k + 1}`, [c + 6 * ca, ya, c + 6 * sa], [c + R * ca, ya, c + R * sa], 'rail-x', `Lengan kaki bintang ${k + 1}`, arm);
    casters.push({ id: `roda-${k + 1}`, x: c + (R - 2) * ca, z: c + (R - 2) * sa, topY: c0, sizeInch: inch, brake: false });
  }
  f.add('tiang', 'y', c, c0 + 3, c, yS - 0.6 - (c0 + 3), 'post', 'Tiang dudukan', [50, 50]);
  boards.push({ ...board('plat-putar', 'Plat bantalan putar (swivel)', c - 10, c + 10, yS - 0.6, yS, c - 10, c + 10), shape: 'round', steelMm: 6 });
  const Hb = Math.max(Hs + 25, num(p, 'tinggiSandaran', 92));
  singlePostBack(f, boards, { cx: c, cz: c, yS, Hb, seatBack: D / 2, plateR: 10, tilt: num(p, 'miringSandaran', 10), bw: Math.min(W - 4, 44) });
  boards.push(board('dudukan', 'Papan dudukan', c - W / 2, c + W / 2, yS, Hs, c - D / 2, c + D / 2));
  return { members: f.list, boards, casters, W: 2 * c, D: 2 * c, H: Hb, boardThick: papanB };
}

/** Stool tiga kaki melebar, palang segitiga di bawah dudukan dan di pijakan */
function buildTiga(p: Params): ProductBuild {
  const { W, Hs, L, papanB, b, leg } = dims(p);
  const yS = Hs - b;
  const yT = yS - 0.5; // bawah plat dudukan
  const rt = W / 2 - 3 - L / 2;
  const rb = rt + Math.tan(rad(num(p, 'sudutKaki', 7))) * yT;
  const c = rb + L + 1;
  const angles = [-90, 30, 150].map(rad);
  const f = memberFactory();
  const boards: Board[] = [];
  const legs = angles.map((a): [P3, P3] => [
    [c + rb * Math.cos(a), 0, c + rb * Math.sin(a)],
    [c + rt * Math.cos(a), yT, c + rt * Math.sin(a)],
  ]);
  legs.forEach(([a, t], i) => f.line(`kaki-${i + 1}`, a, t, 'post', `Kaki ${i + 1}`, leg));
  const gap = (L / 2) * 1.05 + 1.3;
  const ring = (id: string, label: string, y: number) =>
    [0, 1, 2].forEach((i) => {
      const j = (i + 1) % 3;
      railBetween(f.line, `${id}-${i + 1}`, `${label} ${i + 1}`, atY(legs[i][0], legs[i][1], y), atY(legs[j][0], legs[j][1], y), gap, R20);
    });
  ring('palang-atas', 'Palang segitiga bawah dudukan', yT - 1);
  if (bool(p, 'pijakan')) ring('pijakan', 'Pijakan segitiga', num(p, 'tinggiPijakan', 28));
  const pr = rt + L / 2 + 2;
  boards.push({ ...board('plat-dudukan', 'Plat dudukan 5 mm', c - pr, c + pr, yT, yS, c - pr, c + pr), shape: 'round', steelMm: 5 });
  const seat = board('dudukan', 'Papan dudukan', c - W / 2, c + W / 2, yS, Hs, c - W / 2, c + W / 2);
  if (str(p, 'bentukDudukan') !== 'kotak') seat.shape = 'round';
  boards.push(seat);
  return { members: f.list, boards, casters: [], W: 2 * c, D: 2 * c, H: Hs, boardThick: papanB };
}

/**
 * Kursi malas: rel lantai sepanjang kursi, rangka dudukan di atas 4 tiang, sandaran berporos di ujung kepala,
 * ditahan dua kaki penyangga yang bertumpu di palang takik lantai (pindah takik = ubah sudut).
 */
function buildMalas(p: Params): ProductBuild {
  const { W, Hs, L, papanB, b, leg } = dims(p);
  const P = num(p, 'panjang', 190);
  const th = rad(Math.min(75, Math.max(15, num(p, 'sudutSandaran', 45))));
  const yF = Hs - b - L / 2; // as rangka dudukan
  const zh = Math.round(P * 0.4); // poros sandaran
  const Lb = zh - 4; // panjang sandaran
  const xl = L / 2;
  const xr = W - L / 2;
  const f = memberFactory();
  const boards: Board[] = [];
  [xl, xr].forEach((x, i) => {
    const nm = i ? 'kanan' : 'kiri';
    f.add(`rel-${nm}`, 'z', x, L / 2, 0, P, 'rail-z', `Rel lantai ${nm}`, leg);
    f.add(`tiang-poros-${nm}`, 'y', x, L, zh + L / 2, yF - L / 2 - L, 'post', `Tiang dudukan ${nm} (poros)`, leg);
    f.add(`tiang-kaki-${nm}`, 'y', x, L, P - L / 2, yF - L / 2 - L, 'post', `Tiang dudukan ${nm} (kaki)`, leg);
    f.add(`dudukan-${nm}`, 'z', x, yF, zh, P - zh, 'rail-z', `Rangka dudukan ${nm}`, leg);
  });
  [zh + L / 2, (zh + P) / 2, P - L / 2].forEach((z, i) => f.add(`palang-dudukan-${i + 1}`, 'x', L, yF, z, W - 2 * L, 'rail-x', `Palang dudukan ${i + 1}`, R20));
  // sandaran: dua batang miring dari poros ke arah kepala, ujung bawah tidak menyentuh rangka dudukan
  const zA = zh - L / 2 / Math.sin(th) - 0.5; // ujung bawah sandaran mundur dari rangka dudukan (celah poros)
  const dir: P3 = [0, Math.sin(th), -Math.cos(th)];
  const at = (x: number, s: number): P3 => [x, yF + s * dir[1], zA + s * dir[2]];
  [xl, xr].forEach((x, i) => f.line(`sandaran-${i ? 'kanan' : 'kiri'}`, at(x, 0), at(x, Lb), 'post', `Rangka sandaran ${i ? 'kanan' : 'kiri'}`, leg));
  [L * 1.5, Lb - L].forEach((s, i) => {
    const q = at(0, s);
    f.add(`palang-sandaran-${i + 1}`, 'x', xl + L / 2 + 0.3, q[1], q[2], W - 2 * L - 0.6, 'rail-x', `Palang sandaran ${i + 1}`, R20);
  });
  // kaki penyangga di sisi dalam rangka sandaran, bertumpu di palang takik lantai
  const S = at(0, Lb * 0.55);
  const zt = Math.min(zh - L, Math.max(L * 1.5, S[2] + 12));
  [xl + L, xr - L].forEach((x, i) => f.line(`penyangga-${i ? 'kanan' : 'kiri'}`, [x, S[1], S[2]], [x, L, zt], 'custom', `Kaki penyangga sandaran ${i ? 'kanan' : 'kiri'}`, R20));
  [zt - 14, zt, zt + 14]
    .filter((z) => z > L && z < zh - L)
    .forEach((z, i) => f.add(`takik-${i + 1}`, 'x', L, L / 2, z, W - 2 * L, 'rail-x', `Palang takik lantai ${i + 1}`, R20));
  boards.push(board('dudukan', 'Papan dudukan', 0, W, yF + L / 2, yF + L / 2 + b, zh, P));
  const n: P3 = [0, Math.cos(th), Math.sin(th)];
  const C = at(W / 2, Lb / 2).map((v, k) => v + n[k] * (L / 2 + b / 2)) as P3;
  boards.push({ ...board('sandaran', 'Papan sandaran', 0, W, C[1] - b / 2, C[1] + b / 2, C[2] - Lb / 2, C[2] + Lb / 2), rotX: (th * 180) / Math.PI });
  const H = Math.max(Hs, at(0, Lb)[1] + L);
  return { members: f.list, boards, casters: [], W, D: P, H, boardThick: papanB };
}

/** Kursi lesehan: rangka kotak menapak lantai, tiang sandaran miring, batang topang miring ke rel lantai belakang */
function buildLesehan(p: Params): ProductBuild {
  const { W, D, L, papanB, b, leg } = dims(p);
  const Hb = num(p, 'tinggiSandaran', 62);
  const tilt = num(p, 'miringSandaran', 18);
  const tanT = Math.tan(rad(tilt));
  const zs = Math.max(20, tanT * (Hb - L) + 2 * L); // as palang belakang dudukan
  const zF = zs + D - L / 2; // as rel depan
  const f = memberFactory();
  const boards: Board[] = [];
  f.add('rel-belakang', 'x', 0, L / 2, L / 2, W, 'rail-x', 'Rel lantai belakang (tumpuan topang)', leg);
  f.add('rel-depan', 'x', 0, L / 2, zF, W, 'rail-x', 'Rel lantai depan', leg);
  [L / 2, W - L / 2].forEach((x, i) => f.add(`rel-${i ? 'kanan' : 'kiri'}`, 'z', x, L / 2, L, zF - L / 2 - L, 'rail-z', `Rel lantai ${i ? 'kanan' : 'kiri'}`, leg));
  f.add('palang-dudukan-belakang', 'x', L, L / 2, zs, W - 2 * L, 'rail-x', 'Palang dudukan belakang', leg);
  if (W > 70) f.add('palang-dudukan-tengah', 'z', W / 2, L / 2, zs + L / 2, zF - zs - L, 'rail-z', 'Palang dudukan tengah', leg);
  const zPost = (y: number) => zs - tanT * (y - L);
  [L / 2, W - L / 2].forEach((x, i) => {
    const nm = i ? 'kanan' : 'kiri';
    f.line(`tiang-sandaran-${nm}`, [x, L, zs], [x, Hb, zPost(Hb)], 'post', `Tiang sandaran ${nm}`, leg);
    // topang: di sisi dalam tiang, dari 55% tinggi sandaran turun ke atas rel lantai belakang
    const xp = i ? x - L : x + L;
    const y1 = L + 0.55 * (Hb - L);
    f.line(`topang-${nm}`, [xp, y1, zPost(y1)], [xp, L, L / 2], 'custom', `Batang topang ${nm}`, R20);
  });
  const yTop = Hb - L / 2 - 0.5;
  f.add('palang-sandaran-atas', 'x', L, yTop, zPost(yTop), W - 2 * L, 'rail-x', 'Palang sandaran atas', R20);
  boards.push(board('dudukan', 'Papan dudukan', 0, W, L, L + b, zs + L / 2, zF + L / 2));
  const y0 = L + b + 3;
  const y1 = Hb - L - 1;
  const hgt = (y1 - y0) / Math.cos(rad(tilt));
  const ym = (y0 + y1) / 2;
  const zc = zPost(ym) + L / 2 + 0.9;
  boards.push({ ...board('sandaran', 'Papan sandaran', L, W - L, ym - hgt / 2, ym + hgt / 2, zc - 0.9, zc + 0.9), rotX: -tilt });
  return { members: f.list, boards, casters: [], W, D: zF + L / 2, H: Hb, boardThick: papanB };
}

/** Ayunan: kaki A + tapak lantai di kedua ujung, balok atas, bangku bersandaran digantung 4 batang */
function buildAyunA(p: Params): ProductBuild {
  const { W, D, Hs, L, papanB, b, leg } = dims(p);
  const Hr = num(p, 'tinggiRangka', 200);
  const Hb = Math.min(num(p, 'tinggiSandaran', 88), Hr - L - 25);
  const tilt = num(p, 'miringSandaran', 12);
  const tanT = Math.tan(rad(tilt));
  const s = Math.max(D * 0.8, Hr * 0.3); // setengah bentang kaki A di lantai
  const gapX = 30; // ruang ayun bangku ke kaki A
  const Wf = W + 2 * gapX;
  const zc = s + L;
  const f = memberFactory();
  const boards: Board[] = [];
  // kaki A: dua batang miring bertemu di bawah balok atas, berdiri di tapak lantai
  const hA = Hr - 2 * L;
  let ct = L / 2 + 0.3;
  for (let i = 0; i < 3; i++) ct = (L / 2) / Math.cos(Math.atan((s - ct) / hA)) + 0.3;
  const cw = ct; // celah palang terhadap sisi kaki miring
  [L / 2, Wf - L / 2].forEach((x, i) => {
    const nm = i ? 'kanan' : 'kiri';
    f.add(`tapak-${nm}`, 'z', x, L / 2, zc - s - L / 2, 2 * s + L, 'rail-z', `Tapak lantai ${nm}`, leg);
    const legs: [P3, P3][] = [-1, 1].map((g) => [
      [x, L, zc + g * s],
      [x, Hr - L, zc + g * ct],
    ]);
    legs.forEach(([a, t], k) => f.line(`kaki-${nm}-${k ? 'depan' : 'belakang'}`, a, t, 'post', `Kaki A ${nm} ${k ? 'depan' : 'belakang'}`, leg));
    const yb = Hr * 0.38;
    const za = atY(legs[0][0], legs[0][1], yb)[2];
    const zb = atY(legs[1][0], legs[1][1], yb)[2];
    f.add(`palang-a-${nm}`, 'z', x, yb, za + cw, zb - za - 2 * cw, 'rail-z', `Palang kaki A ${nm}`, leg);
  });
  f.add('balok-atas', 'x', 0, Hr - L / 2, zc, Wf, 'rail-x', 'Balok atas', leg);
  // bangku (pipa 20×20): rangka dudukan + sandaran miring
  const x0 = gapX;
  const x1 = gapX + W;
  const z0 = zc - D / 2;
  const z1 = zc + D / 2;
  const yF = Hs - b - 1;
  f.add('bangku-belakang', 'x', x0, yF, z0 + 1, W, 'rail-x', 'Rangka bangku belakang', R20);
  f.add('bangku-depan', 'x', x0, yF, z1 - 1, W, 'rail-x', 'Rangka bangku depan', R20);
  [x0 + 1, x1 - 1].forEach((x, i) => f.add(`bangku-${i ? 'kanan' : 'kiri'}`, 'z', x, yF, z0 + 2, D - 4, 'rail-z', `Rangka bangku ${i ? 'kanan' : 'kiri'}`, R20));
  if (W > 90) f.add('bangku-tengah', 'z', (x0 + x1) / 2, yF, z0 + 2, D - 4, 'rail-z', 'Rangka bangku tengah', R20);
  const zPost = (y: number) => z0 + 1 - tanT * (y - (yF + 1));
  [x0 + 4, x1 - 4].forEach((x, i) => f.line(`tiang-sandaran-${i ? 'kanan' : 'kiri'}`, [x, yF + 1, z0 + 1], [x, Hb, zPost(Hb)], 'post', `Tiang sandaran ${i ? 'kanan' : 'kiri'}`, R20));
  f.add('palang-sandaran-atas', 'x', x0 + 5, Hb - 1.5, zPost(Hb - 1.5), W - 10, 'rail-x', 'Palang sandaran atas', R20);
  // 4 batang gantung: dari bawah balok atas ke ujung rangka depan & belakang bangku
  const g = (1 / Math.cos(Math.atan((D / 2) / (Hr - L - yF)))) + 0.3;
  [x0 + 1, x1 - 1].forEach((x, i) =>
    ([
      [z0 + 1, -1],
      [z1 - 1, 1],
    ] as [number, number][]).forEach(([z, sg]) =>
      f.line(`gantung-${i ? 'kanan' : 'kiri'}-${sg > 0 ? 'depan' : 'belakang'}`, [x, yF + 1, z], [x, Hr - L, zc + sg * g], 'custom', `Batang gantung ${i ? 'kanan' : 'kiri'} ${sg > 0 ? 'depan' : 'belakang'}`, R20)
    )
  );
  boards.push(board('dudukan', 'Papan dudukan', x0 + 2, x1 - 2, yF + 1, yF + 1 + b, z0 + 2, z1));
  const y0 = yF + 1 + b + 3;
  const y1 = Hb - 3;
  const hgt = (y1 - y0) / Math.cos(rad(tilt));
  const ym = (y0 + y1) / 2;
  const zcb = zPost(ym) + 1 + 0.9;
  boards.push({ ...board('sandaran', 'Papan sandaran', x0 + 5, x1 - 5, ym - hgt / 2, ym + hgt / 2, zcb - 0.9, zcb + 0.9), rotX: -tilt });
  return { members: f.list, boards, casters: [], W: Wf, D: 2 * zc, H: Hr, boardThick: papanB };
}

/** Kursi gantung: kaki silang lantai, tiang Γ dengan siku di pojok lengan, sangkar digantung satu batang */
function buildGantung(p: Params): ProductBuild {
  const { W, D, Hs, L, papanB, b, leg } = dims(p);
  const Hr = num(p, 'tinggiRangka', 200);
  const Hk = Math.min(num(p, 'tinggiSandaran', 112), Hr - L - 15); // atap sangkar
  const Rb = Math.max(45, W / 2 + 6);
  const off = D / 2 + 18; // jarak tiang ke tengah sangkar
  const cx = Rb;
  const cz = Rb * 0.8;
  const zg = cz + off;
  const f = memberFactory();
  const boards: Board[] = [];
  // kaki silang: depan-belakang menerus (menjorok ke bawah sangkar), kiri-kanan dipotong dua
  const zA = cz - Rb * 0.8;
  const zB = zg + D * 0.35;
  f.add('kaki-depan-belakang', 'z', cx, L / 2, zA, zB - zA, 'rail-z', 'Kaki lantai depan–belakang', leg);
  f.add('kaki-kiri', 'x', cx - Rb, L / 2, cz, Rb - L / 2, 'rail-x', 'Kaki lantai kiri', leg);
  f.add('kaki-kanan', 'x', cx + L / 2, L / 2, cz, Rb - L / 2, 'rail-x', 'Kaki lantai kanan', leg);
  f.add('tiang', 'y', cx, L, cz, Hr - L, 'post', 'Tiang', leg);
  f.add('lengan', 'z', cx, Hr - L / 2, cz + L / 2, off, 'rail-z', 'Lengan atas', leg);
  const k = 28;
  const back = flushBack(k - L / 2, k, 2);
  f.line('siku-lengan', [cx, Hr - L - k, cz + L / 2 + back], [cx, Hr - L, cz + k], 'custom', 'Siku lengan', R20);
  f.add('batang-gantung', 'y', cx, Hk, zg, Hr - L - Hk, 'custom', 'Batang gantung (mata ayun di atas)', R20);
  // sangkar pipa 20×20
  const x0 = cx - W / 2;
  const x1 = cx + W / 2;
  const z0 = zg - D / 2;
  const z1 = zg + D / 2;
  const yB = Hs - b - 1; // as rangka dudukan sangkar
  ([
    [x0 + 1, z0 + 1, 'kiri belakang'],
    [x1 - 1, z0 + 1, 'kanan belakang'],
    [x0 + 1, z1 - 1, 'kiri depan'],
    [x1 - 1, z1 - 1, 'kanan depan'],
  ] as [number, number, string][]).forEach(([x, z, nm], i) => f.add(`sangkar-tiang-${i}`, 'y', x, yB - 1, z, Hk - (yB - 1), 'post', `Tiang sangkar ${nm}`, R20));
  const ringAt = (id: string, label: string, y: number) => {
    f.add(`${id}-belakang`, 'x', x0 + 2, y, z0 + 1, W - 4, 'rail-x', `${label} belakang`, R20);
    f.add(`${id}-depan`, 'x', x0 + 2, y, z1 - 1, W - 4, 'rail-x', `${label} depan`, R20);
    f.add(`${id}-kiri`, 'z', x0 + 1, y, z0 + 2, D - 4, 'rail-z', `${label} kiri`, R20);
    f.add(`${id}-kanan`, 'z', x1 - 1, y, z0 + 2, D - 4, 'rail-z', `${label} kanan`, R20);
  };
  ringAt('dudukan', 'Rangka dudukan sangkar', yB);
  ringAt('atap', 'Rangka atap sangkar', Hk - 1);
  f.add('atap-tengah', 'x', x0 + 2, Hk - 1, zg, W - 4, 'rail-x', 'Palang gantung atap sangkar', R20);
  [x0 + 1, x1 - 1].forEach((x, i) => f.add(`lengan-sangkar-${i ? 'kanan' : 'kiri'}`, 'z', x, yB + 22, z0 + 2, D - 4, 'rail-z', `Lengan sangkar ${i ? 'kanan' : 'kiri'}`, R20));
  boards.push(board('dudukan', 'Papan dudukan', x0 + 2, x1 - 2, yB + 1, yB + 1 + b, z0 + 2, z1));
  boards.push(board('sandaran', 'Papan sandaran', x0 + 2, x1 - 2, yB + 1 + b, Hk - 2, z0 + 2, z0 + 3.8));
  return { members: f.list, boards, casters: [], W: Math.max(2 * Rb, x1 + 1), D: Math.max(zB, z1) + 1, H: Hr, boardThick: papanB };
}

/** Bangku keliling pohon: cincin persegi luar & dalam, penghubung di tengah tiap sisi, 4 papan dudukan berputar */
function buildPohon(p: Params): ProductBuild {
  const { W: S, D: d, Hs, L, papanB, b, leg } = dims(p);
  const yF = Hs - b - L / 2;
  const f = memberFactory();
  const boards: Board[] = [];
  const ring = (id: string, label: string, a: number, e: number) => {
    // a..e = muka luar cincin
    f.add(`${id}-belakang`, 'x', a, yF, a + L / 2, e - a, 'rail-x', `${label} belakang`, leg);
    f.add(`${id}-depan`, 'x', a, yF, e - L / 2, e - a, 'rail-x', `${label} depan`, leg);
    f.add(`${id}-kiri`, 'z', a + L / 2, yF, a + L, e - a - 2 * L, 'rail-z', `${label} kiri`, leg);
    f.add(`${id}-kanan`, 'z', e - L / 2, yF, a + L, e - a - 2 * L, 'rail-z', `${label} kanan`, leg);
  };
  ring('luar', 'Rangka luar', 0, S);
  ring('dalam', 'Rangka dalam (sisi pohon)', d, S - d);
  // penghubung luar–dalam di tengah tiap sisi
  f.add('penghubung-belakang', 'z', S / 2, yF, L, d - L, 'rail-z', 'Penghubung belakang', leg);
  f.add('penghubung-depan', 'z', S / 2, yF, S - d, d - L, 'rail-z', 'Penghubung depan', leg);
  f.add('penghubung-kiri', 'x', L, yF, S / 2, d - L, 'rail-x', 'Penghubung kiri', leg);
  f.add('penghubung-kanan', 'x', S - d, yF, S / 2, d - L, 'rail-x', 'Penghubung kanan', leg);
  // kaki di sudut luar & dalam (+ tengah sisi luar untuk bangku besar)
  const hl = yF - L / 2;
  const pts: [number, number, string][] = [
    [L / 2, L / 2, 'luar kiri belakang'],
    [S - L / 2, L / 2, 'luar kanan belakang'],
    [L / 2, S - L / 2, 'luar kiri depan'],
    [S - L / 2, S - L / 2, 'luar kanan depan'],
    [d + L / 2, d + L / 2, 'dalam kiri belakang'],
    [S - d - L / 2, d + L / 2, 'dalam kanan belakang'],
    [d + L / 2, S - d - L / 2, 'dalam kiri depan'],
    [S - d - L / 2, S - d - L / 2, 'dalam kanan depan'],
  ];
  if (S > 150)
    pts.push([S / 2, L / 2, 'luar tengah belakang'], [S / 2, S - L / 2, 'luar tengah depan'], [L / 2, S / 2, 'luar tengah kiri'], [S - L / 2, S / 2, 'luar tengah kanan']);
  pts.forEach(([x, z, nm], i) => f.add(`kaki-${i + 1}`, 'y', x, 0, z, hl, 'post', `Kaki ${nm}`, leg));
  // 4 papan dudukan berputar (pinwheel), tiap sisi menghadap keluar
  const y0 = yF + L / 2;
  boards.push(board('dudukan-belakang', 'Papan dudukan belakang', 0, S - d, y0, y0 + b, 0, d));
  boards.push(board('dudukan-kanan', 'Papan dudukan kanan', S - d, S, y0, y0 + b, 0, S - d));
  boards.push(board('dudukan-depan', 'Papan dudukan depan', d, S, y0, y0 + b, S - d, S));
  boards.push(board('dudukan-kiri', 'Papan dudukan kiri', 0, d, y0, y0 + b, d, S));
  return { members: f.list, boards, casters: [], W: S, D: S, H: Hs, boardThick: papanB };
}

/** Kursi makan bayi: 4 kaki tinggi melebar, sandaran miring, lengan dengan baki di depan, papan pijakan */
function buildBayi(p: Params): ProductBuild {
  const { W, D, Hs, L, papanB, b, leg } = dims(p);
  const yF = Hs - b - L / 2; // as rangka dudukan
  const Hb = Math.max(Hs + 20, num(p, 'tinggiSandaran', 95));
  const tilt = num(p, 'miringSandaran', 8);
  const tanT = Math.tan(rad(tilt));
  const sp = Math.tan(rad(num(p, 'sudutKaki', 8))) * (yF - L / 2); // kaki melebar
  const x0 = sp + 2;
  const x1 = x0 + W;
  const z0 = Math.max(sp, tanT * (Hb - yF)) + 3;
  const z1 = z0 + D;
  const f = memberFactory();
  const boards: Board[] = [];
  // rangka dudukan
  f.add('dudukan-belakang', 'x', x0, yF, z0 + L / 2, W, 'rail-x', 'Rangka dudukan belakang', leg);
  f.add('dudukan-depan', 'x', x0, yF, z1 - L / 2, W, 'rail-x', 'Rangka dudukan depan', leg);
  [x0 + L / 2, x1 - L / 2].forEach((x, i) => f.add(`dudukan-${i ? 'kanan' : 'kiri'}`, 'z', x, yF, z0 + L, D - 2 * L, 'rail-z', `Rangka dudukan ${i ? 'kanan' : 'kiri'}`, leg));
  // kaki melebar ke 4 arah
  const top = yF - L / 2;
  const legs: Record<string, [P3, P3]> = {};
  ([
    [x0 + L / 2, z0 + L / 2, -1, -1, 'kiri belakang'],
    [x1 - L / 2, z0 + L / 2, 1, -1, 'kanan belakang'],
    [x0 + L / 2, z1 - L / 2, -1, 1, 'kiri depan'],
    [x1 - L / 2, z1 - L / 2, 1, 1, 'kanan depan'],
  ] as [number, number, number, number, string][]).forEach(([x, z, gx, gz, nm]) => {
    legs[nm] = [
      [x + gx * sp, 0, z + gz * sp],
      [x, top, z],
    ];
    f.line(`kaki-${nm.replace(' ', '-')}`, legs[nm][0], legs[nm][1], 'post', `Kaki ${nm}`, leg);
  });
  const gap = (L / 2) * 1.05 + 1.3;
  const yP = num(p, 'tinggiPijakan', 30);
  let ym = Math.round(yF * 0.45);
  if (Math.abs(ym - yP) < 6) ym = yP + 8;
  const rail = (id: string, label: string, a: string, c: string, y: number) =>
    railBetween(f.line, id, label, atY(legs[a][0], legs[a][1], y), atY(legs[c][0], legs[c][1], y), gap, R20);
  rail('palang-belakang', 'Palang kaki belakang', 'kiri belakang', 'kanan belakang', ym);
  rail('palang-kiri', 'Palang kaki kiri', 'kiri belakang', 'kiri depan', ym + 5);
  rail('palang-kanan', 'Palang kaki kanan', 'kanan belakang', 'kanan depan', ym + 5);
  // pijakan: palang depan + papan menjorok ke depan
  rail('palang-pijakan', 'Palang pijakan', 'kiri depan', 'kanan depan', yP);
  const pk = atY(legs['kiri depan'][0], legs['kiri depan'][1], yP);
  const pn = atY(legs['kanan depan'][0], legs['kanan depan'][1], yP);
  boards.push(board('pijakan', 'Papan pijakan kaki', pk[0] + gap, pn[0] - gap, yP + 1, yP + 1 + 1.8, pk[2] - 1, pk[2] + 12));
  // sandaran miring di sudut belakang, berdiri di atas rangka dudukan
  const yb = yF + L / 2;
  const zPost = (y: number) => z0 + L / 2 - tanT * (y - yb);
  [x0 + L / 2, x1 - L / 2].forEach((x, i) => f.line(`tiang-sandaran-${i ? 'kanan' : 'kiri'}`, [x, yb, z0 + L / 2], [x, Hb, zPost(Hb)], 'post', `Tiang sandaran ${i ? 'kanan' : 'kiri'}`, leg));
  f.add('palang-sandaran-atas', 'x', x0 + L, Hb - L / 2 - 0.5, zPost(Hb - L / 2 - 0.5), W - 2 * L, 'rail-x', 'Palang sandaran atas', R20);
  // lengan dari tiang sandaran ke depan, ditopang tiang pendek di sudut depan; ujungnya memikul baki
  const yA = Hs + 18;
  [x0 + L / 2, x1 - L / 2].forEach((x, i) => {
    const nm = i ? 'kanan' : 'kiri';
    const zs = zPost(yA) + L / 2;
    f.add(`lengan-${nm}`, 'z', x, yA, zs, z1 + 22 - zs, 'rail-z', `Lengan ${nm} (penahan baki)`, R20);
    f.add(`tiang-lengan-${nm}`, 'y', x, yb, z1 - L / 2, yA - 1 - yb, 'post', `Tiang lengan ${nm}`, R20);
  });
  // papan
  boards.push(board('dudukan', 'Papan dudukan', x0 + L, x1 - L, yb, yb + b, z0 + L, z1));
  const y0 = yb + b + 2;
  const y1 = Hb - L - 1;
  const hgt = (y1 - y0) / Math.cos(rad(tilt));
  const ymb = (y0 + y1) / 2;
  const zc = zPost(ymb);
  boards.push({ ...board('sandaran', 'Papan sandaran', x0 + L, x1 - L, ymb - hgt / 2, ymb + hgt / 2, zc - 0.9, zc + 0.9), rotX: -tilt });
  boards.push(board('baki', 'Baki makan', x0 - 3, x1 + 3, yA + 1, yA + 1 + 1.8, z1 + 2, z1 + 22));
  return { members: f.list, boards, casters: [], W: x1 + sp + 2, D: z1 + Math.max(sp, 22) + 2, H: Hb, boardThick: papanB };
}

/** Peringatan & saran untuk model rangka baru (bahasa awam, perbaikan satu ketuk) */
function newChecks(p: Params): ProductCheck[] {
  const out: ProductCheck[] = [];
  const m = modelOf(p);
  const W = num(p, 'lebar');
  const D = num(p, 'dalam');
  const Hs = num(p, 'tinggiDudukan');
  const pipa = str(p, 'pipa');
  if (m === 'putar') {
    if (Hs > 70 && pipa === '20') out.push({ level: 'warn', message: 'Stool tinggi bertiang tunggal 20×20 terasa goyang.', fix: { label: 'Pakai pipa 40×40', params: { pipa: '40' } } });
    out.push({ level: 'info', message: 'Bantalan putar (swivel plate Ø20) dibaut ke plat atas tiang dan ke bawah papan dudukan; sandaran ikut berputar bersama dudukan.' });
    out.push({ level: 'info', message: 'Plat dasar 8 mm cukup berat supaya stool tidak terguling; beri karet di bawahnya supaya lantai tidak tergores.' });
  }
  if (m === 'bintang') {
    out.push({ level: 'info', message: 'Lima lengan kaki dilas ke hub tengah dengan plat pengaku. Roda 3" tanpa rem; dudukan berputar lewat bantalan putar (tanpa naik-turun hidrolik).' });
    if (Hs > 55) out.push({ level: 'warn', message: 'Kursi kerja setinggi ini sulit diduduki dan kaki tidak menapak.', fix: { label: 'Tinggi 46 cm', params: { tinggiDudukan: 46 } } });
  }
  if (m === 'tiga') {
    if (Hs > 60 && num(p, 'sudutKaki') < 5) out.push({ level: 'warn', message: 'Stool tinggi tiga kaki yang hampir tegak mudah terguling.', fix: { label: 'Kaki melebar 7°', params: { sudutKaki: 7 } } });
    out.push({ level: 'info', message: 'Kaki miring dipotong bersudut di kedua ujung (rata lantai & rata plat dudukan). Sudutnya tertulis di daftar potongan.' });
  }
  if (m === 'malas') {
    out.push({ level: 'info', message: 'Sandaran berporos di ujung rangka dudukan (baut + mur pengunci). Pindahkan kaki penyangga ke palang takik lain untuk mengubah kemiringan.' });
    if (num(p, 'tinggiDudukan') > 45) out.push({ level: 'warn', message: 'Kursi malas setinggi ini terasa seperti ranjang, sulit untuk bangun.', fix: { label: 'Dudukan 35 cm', params: { tinggiDudukan: 35 } } });
  }
  if (m === 'lesehan') out.push({ level: 'info', message: 'Rangka menapak rata di lantai: pasang karet di bawah rel supaya tidak licin dan lantai tidak tergores.' });
  if (m === 'ayun-a') {
    if (pipa !== '40') out.push({ level: 'warn', message: 'Rangka ayunan menahan beban bergoyang: pakai pipa 40×40.', fix: { label: 'Pakai pipa 40×40', params: { pipa: '40' } } });
    if (num(p, 'tinggiRangka') - num(p, 'tinggiSandaran') < 50)
      out.push({ level: 'warn', message: 'Sandaran terlalu dekat ke balok atas: kepala bisa terbentur saat berayun.', fix: { label: `Rangka ${num(p, 'tinggiSandaran') + 60} cm`, params: { tinggiRangka: Math.min(240, num(p, 'tinggiSandaran') + 60) } } });
    out.push({ level: 'info', message: 'Batang gantung disambung ke balok atas dengan mata ayun / bearing (baut), bukan dilas mati, supaya bangku bisa berayun.' });
  }
  if (m === 'gantung') {
    if (num(p, 'tinggiRangka') < num(p, 'tinggiSandaran') + 30)
      out.push({ level: 'warn', message: 'Tiang terlalu pendek untuk sangkar setinggi ini.', fix: { label: `Tiang ${num(p, 'tinggiSandaran') + 85} cm`, params: { tinggiRangka: Math.min(240, num(p, 'tinggiSandaran') + 85) } } });
    if (pipa !== '40') out.push({ level: 'warn', message: 'Tiang Γ memikul beban di ujung lengan: pakai pipa 40×40.', fix: { label: 'Pakai pipa 40×40', params: { pipa: '40' } } });
    out.push({ level: 'info', message: 'Kaki silang menjorok ke bawah sangkar supaya tiang tidak terguling. Batang gantung memakai mata ayun (baut) di bawah lengan.' });
  }
  if (m === 'pohon') {
    const hole = W - 2 * D;
    if (hole < 40) out.push({ level: 'warn', message: `Lubang tengah hanya ${hole} cm, terlalu sempit untuk batang pohon yang terus membesar.`, fix: { label: `Sisi ${2 * D + 60} cm`, params: { lebar: Math.min(200, 2 * D + 60) } } });
    out.push({ level: 'info', message: `Lubang tengah ${hole} cm. Sisakan ±10 cm dari batang pohon supaya akar & batang tetap bisa tumbuh.` });
  }
  if (m === 'bayi') {
    if (num(p, 'sudutKaki') < 5) out.push({ level: 'warn', message: 'Kursi bayi yang tinggi wajib berkaki melebar supaya tidak terguling.', fix: { label: 'Kaki melebar 8°', params: { sudutKaki: 8 } } });
    out.push({ level: 'info', message: 'Pasang sabuk pengaman di dudukan, bulatkan semua ujung pipa & tepi baki, dan pakai cat yang aman untuk anak.' });
  }
  return out;
}
