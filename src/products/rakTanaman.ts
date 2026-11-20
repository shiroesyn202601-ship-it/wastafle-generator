import { Board, Params, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, board, materialParams, memberFactory, num, r1, str } from './common';

/**
 * Rak tanaman. Bentuk rangka (param `model`):
 * - tangga: tingkat paling depan paling rendah, makin ke belakang makin tinggi (satu muka)
 * - piramida: tangga dua muka, tingkat tertinggi di tengah, bisa dilihat dari depan & belakang
 * - pohon: satu tiang tengah di atas kaki silang, nampan pot bundar di ujung lengan berputar naik
 * - menara: menara ramping 4 tiang, nampan pot menjulur bergantian kiri-kanan dengan penguat miring
 * - teralis: rak pot rendah + teralis kisi di belakang untuk tanaman merambat
 * - tiga-kaki: 3 tiang tegak berdenah segitiga, nampan bundar bertumpuk di atas cincin segitiga
 * - miring: kaki depan & belakang miring sejajar (jajar genjang) di rel lantai, tingkat makin ke atas makin mundur
 * - keliling: lapisan cincin tiang mengelilingi tiang rumah / pohon, makin ke dalam makin tinggi, lubang di tengah
 * - gapura: dua panel samping berkisi disatukan batang atap datar, bisa dilewati orang
 * - plafon: satu batang tengah dari plat plafon, nampan bundar bertingkat di lengan silang
 * - ring-dinding: tiang & rel dibaut tembok, dudukan pot kotak menjorok selang-seling (tanpa papan)
 * - balkon: pelana dikaitkan di atas pagar balkon, nampan berbibir di kedua sisi pagar
 * - tancap: tiang tunggal ditancap ke tanah, lengan atas dengan kait pot gantung
 * - rak-lubang: rangka samping tertutup di rel lantai, atas berupa kisi lubang pot, papan rak bawah
 * - rumah-kaca: rak susun 4 tiang dengan rangka atap pelana untuk ditutup plastik
 * (- gantung: gawang 2 tiang + rak pot bawah. Tidak ditawarkan lagi karena rangkanya sama dengan rak baju
 *   "rak-bawah"; tetap dibangun supaya desain lama yang tersimpan masih terbuka.)
 */
const MODELS = [
  { value: 'tangga', label: 'Tangga satu muka', desc: 'Makin ke belakang makin tinggi' },
  { value: 'piramida', label: 'Piramida dua muka', desc: 'Tertinggi di tengah, dilihat dari dua sisi' },
  { value: 'pohon', label: 'Tiang pohon', desc: 'Nampan bundar di lengan berputar naik' },
  { value: 'tiga-kaki', label: 'Tiga kaki', desc: 'Nampan bundar bertumpuk di 3 tiang' },
  { value: 'miring', label: 'Kaki miring', desc: 'Rangka jajar genjang di rel lantai' },
  { value: 'keliling', label: 'Keliling tiang / pohon', desc: 'Mengelilingi tiang, lubang di tengah' },
  { value: 'menara', label: 'Menara vertikal', desc: 'Nampan menjulur kiri-kanan dari menara ramping' },
  { value: 'teralis', label: 'Rak + teralis rambat', desc: 'Rak pot rendah, kisi tinggi di belakang' },
  { value: 'gapura', label: 'Gapura rambat', desc: 'Dua panel kisi + atap, bisa dilewati' },
  { value: 'plafon', label: 'Gantung plafon', desc: 'Satu batang dari plafon, nampan bertingkat' },
  { value: 'ring-dinding', label: 'Dudukan pot dinding', desc: 'Kotak dudukan pot dibaut ke tembok' },
  { value: 'balkon', label: 'Pelana pagar balkon', desc: 'Dikaitkan di atas pagar, tanpa bor' },
  { value: 'tancap', label: 'Tiang tancap taman', desc: 'Ditancap ke tanah, kait pot gantung' },
  { value: 'rak-lubang', label: 'Meja pot berlubang', desc: 'Pot masuk ke kisi lubang di atas' },
  { value: 'rumah-kaca', label: 'Rak rumah kaca', desc: 'Rak susun beratap pelana' },
];
const isM = (p: Params, ...m: string[]) => m.includes(str(p, 'model', 'tangga'));

/**
 * DNA rangka per model (A penopang · B kaki · C penguat · D susunan papan · E mobilitas · F tumpuan · G khusus).
 * Dipakai untuk `signature`, supaya tiap template di produk ini berbeda sidik rangkanya.
 */
const DNA: Record<string, string> = {
  tangga: '4kaki-berundak|tegak|palang-bawah|tangga-1muka|diam|bebas|-',
  piramida: '4kaki-berundak|tegak|palang-bawah|tangga-2muka|diam|bebas|-',
  pohon: 'tiang-tunggal|alas-silang|-|spiral-bundar|diam|bebas|lengan-putar',
  menara: 'menara-4tiang|tegak|diagonal-lengan|zigzag|diam|bebas|kantilever',
  teralis: '4kaki-belakang-tinggi|tegak|kisi|rata-rendah|diam|bebas|kisi',
  gantung: '2tiang-kaki-melintang|tegak|palang|gantung+1papan|diam|bebas|pipa-gantung',
  'tiga-kaki': '3kaki|tegak|cincin-segitiga|rata-bundar|diam|bebas|-',
  miring: 'kaki-jajar-genjang|miring|rel-lantai|tangga-mundur|diam|bebas|-',
  keliling: 'cincin-tiang-berlapis|tegak|cincin+ikat|tangga-4muka|diam|bebas|lubang-tengah',
  gapura: '2panel-kisi|tegak|kisi|atap-batang|diam|bebas|lintasan',
  plafon: 'gantung-plafon-1batang|-|lengan-silang|rata-bundar|diam|plafon|plat',
  'ring-dinding': 'tempel-dinding|-|rel|slot-selang-seling|diam|tembok|ring-pot',
  balkon: 'kait-pagar|-|palang-ikat|2muka|lepas|pagar|bibir',
  tancap: 'tiang-tancap|tegak|siku-miring|gantungan|diam|tanah|kait',
  'rak-lubang': 'panel-samping|tegak|rel-lantai|slot+rak-bawah|diam|bebas|kisi-lubang',
  'rumah-kaca': '4kaki|tegak|palang-keliling+kuda-kuda|rata|diam|bebas|atap-pelana',
};

/**
 * Batang datar miring (dilihat dari atas) yang ujungnya dilas ke tiang tegak berpenampang kotak (setengah sisi `half`):
 * jarak dari as tiang sepanjang arah (ux, uz) sampai ujung batang (lebar `w`, dipotong tegak lurus sumbu dominannya)
 * tidak lagi masuk ke dalam tiang.
 */
function clearFromPost(cx: number, cz: number, half: number, ux: number, uz: number, w: number) {
  const domX = Math.abs(ux) >= Math.abs(uz);
  const nx = -uz;
  const nz = ux;
  const ud = domX ? ux : uz;
  const nd = domX ? nx : nz;
  const inside = (x: number, z: number) => Math.abs(x - cx) < half - 0.02 && Math.abs(z - cz) < half - 0.02;
  for (let t = 0; t < 100; t += 0.05) {
    const ex = cx + ux * t;
    const ez = cz + uz * t;
    let ok = true;
    for (const j of [-1, -0.5, 0, 0.5, 1]) {
      const k = (j * w) / 2;
      const sx = ex + k * nx - (ux * (k * nd)) / ud;
      const sz = ez + k * nz - (uz * (k * nd)) / ud;
      for (const fwd of [0, 0.5, 1, 2, 3]) if (inside(sx + ux * fwd, sz + uz * fwd)) ok = false;
    }
    if (ok) return t + 0.05;
  }
  return half * 1.5;
}

const NO_W = ['menara', 'tiga-kaki', 'keliling', 'plafon'];
const FLAT = ['gapura', 'rak-lubang', 'balkon', 'tancap', 'gantung'];

export const RAK_TANAMAN: ProductDef = {
  id: 'rak-tanaman',
  name: 'Rak tanaman',
  tagline: 'bertingkat · tangga · pot bunga',
  icon: 'M8 34h44M12 34V22h12V12h12V4h12v30',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['model', 'panjang', 'tinggi', 'dalam', 'tingkat', 'baris', 'lubang', 'tinggiPlafon', 'tinggiPagar', 'tinggiMulai'] },
    { id: 'bentuk', title: 'Bentuk', keys: ['dalamTingkat', 'naikTingkat', 'jarakPlafon', 'lebarPagar'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Selesai', keys: [] },
  ],
  params: [
    { key: 'model', label: 'Bentuk rak', type: 'choice', options: MODELS },
    {
      key: 'panjang',
      label: 'Panjang',
      type: 'number',
      unit: 'cm',
      min: 40,
      max: 200,
      step: 1,
      help: 'Tiang pohon: lebar kaki silang. Gapura: lebar atap (lintasan ± 25 cm lebih sempit). Tiang tancap: lebar lengan atas.',
      marks: [{ value: 80, label: 'teras' }, { value: 120, label: 'taman' }],
      showIf: (p) => !NO_W.includes(String(p.model)),
    },
    { key: 'tinggi', label: 'Tinggi rangka', type: 'number', unit: 'cm', min: 50, max: 260, step: 1, help: 'Tiang tancap: tinggi di atas tanah.', showIf: (p) => ['gantung', 'teralis', 'gapura', 'rak-lubang', 'tancap'].includes(String(p.model)) },
    { key: 'dalam', label: 'Kedalaman gapura', type: 'number', unit: 'cm', min: 25, max: 80, step: 1, marks: [{ value: 40, label: 'umum' }], showIf: (p) => p.model === 'gapura' },
    { key: 'tingkat', label: 'Jumlah tingkat / nampan / baris', type: 'number', unit: 'tingkat', min: 1, max: 6, step: 1, help: 'Keliling tiang: paling banyak 3 lapis.', showIf: (p) => !FLAT.includes(String(p.model)) },
    { key: 'baris', label: 'Jumlah baris lubang', type: 'number', unit: 'baris', min: 1, max: 4, step: 1, showIf: (p) => p.model === 'rak-lubang' },
    { key: 'lubang', label: 'Lebar lubang tengah', type: 'number', unit: 'cm', min: 20, max: 80, step: 1, help: 'Ukur tiang / batang pohon yang dikelilingi, tambah 5 cm.', showIf: (p) => p.model === 'keliling' },
    { key: 'tinggiPlafon', label: 'Tinggi plafon', type: 'number', unit: 'cm', min: 220, max: 400, step: 1, showIf: (p) => p.model === 'plafon' },
    { key: 'tinggiPagar', label: 'Tinggi pagar balkon', type: 'number', unit: 'cm', min: 70, max: 130, step: 1, marks: [{ value: 100, label: 'umum' }], showIf: (p) => p.model === 'balkon' },
    { key: 'tinggiMulai', label: 'Tinggi baris terbawah', type: 'number', unit: 'cm', min: 30, max: 180, step: 1, help: 'Dari lantai.', showIf: (p) => p.model === 'ring-dinding' },
    {
      key: 'dalamTingkat',
      label: 'Kedalaman tingkat / ukuran pot',
      type: 'number',
      unit: 'cm',
      min: 15,
      max: 45,
      step: 1,
      help: 'Sesuaikan dengan diameter pot terbesar. Dudukan / lubang pot: isi diameter pot sedikit di bawah bibirnya.',
      marks: [{ value: 25, label: 'pot kecil' }, { value: 35, label: 'pot sedang' }],
      showIf: (p) => p.model !== 'gapura' && p.model !== 'tancap',
    },
    { key: 'naikTingkat', label: 'Selisih tinggi antar tingkat', type: 'number', unit: 'cm', min: 12, max: 45, step: 1, marks: [{ value: 25, label: 'umum' }], showIf: (p) => !FLAT.includes(String(p.model)) },
    { key: 'jarakPlafon', label: 'Jarak plafon ke nampan teratas', type: 'number', unit: 'cm', min: 20, max: 150, step: 1, showIf: (p) => p.model === 'plafon' },
    { key: 'lebarPagar', label: 'Tebal atas pagar balkon', type: 'number', unit: 'cm', min: 3, max: 15, step: 1, help: 'Ukur lebar pegangan / bibir atas pagar.', showIf: (p) => p.model === 'balkon' },
    ...materialParams(true),
  ],
  defaults: {
    model: 'tangga',
    panjang: 100,
    tinggi: 160,
    dalam: 40,
    tingkat: 3,
    baris: 2,
    lubang: 40,
    tinggiPlafon: 280,
    tinggiPagar: 100,
    tinggiMulai: 90,
    dalamTingkat: 25,
    naikTingkat: 25,
    jarakPlafon: 60,
    lebarPagar: 6,
    pipa: '20',
    papan: 'kayu',
    warna: '#1f2226',
  },
  groups: [
    { id: 'bertingkat', name: 'Rak tanaman bertingkat', desc: 'Teras, taman, pojok ruangan' },
    { id: 'vertikal', name: 'Rak tanaman vertikal & rambat', desc: 'Lahan sempit, tanaman rambat' },
    { id: 'gantung', name: 'Rak pot gantung & tempel', desc: 'Tembok, plafon, pagar balkon, tanah taman' },
    { id: 'semai', name: 'Rak semai & nursery', desc: 'Bibit, polybag, kebun rumahan' },
  ],
  signature: (p) => {
    const m = str(p, 'model', 'tangga');
    return `rak-tanaman:${m}:${DNA[m] ?? DNA.tangga}`;
  },
  presets: [
    {
      id: 'tangga',
      group: 'bertingkat',
      name: 'Rak tanaman tangga',
      desc: 'satu muka, tingkat makin ke belakang makin tinggi',
      params: { model: 'tangga' },
      sizes: [
        { label: 'Pot teras', desc: '100 cm, 3 tingkat', params: { panjang: 100, tingkat: 3, dalamTingkat: 25, naikTingkat: 25, pipa: '20' } },
        { label: 'Sukulen', desc: '60 cm, 4 tingkat rapat', params: { panjang: 60, tingkat: 4, dalamTingkat: 18, naikTingkat: 18, pipa: '20' } },
        { label: 'Pot besar', desc: '150 cm, 3 tingkat dalam', params: { panjang: 150, tingkat: 3, dalamTingkat: 35, naikTingkat: 30, pipa: '30' } },
      ],
    },
    {
      id: 'piramida',
      group: 'bertingkat',
      name: 'Rak tanaman piramida',
      desc: 'tangga dua muka, puncak di tengah, untuk tengah taman',
      params: { model: 'piramida', panjang: 100, tingkat: 3, dalamTingkat: 25, naikTingkat: 25 },
      sizes: [
        { label: 'Tengah taman', desc: '100 cm, 3 tingkat (5 baris pot)', params: { panjang: 100, tingkat: 3, dalamTingkat: 25, naikTingkat: 25, pipa: '20' } },
        { label: 'Pameran / nursery', desc: '150 cm, 3 tingkat dalam', params: { panjang: 150, tingkat: 3, dalamTingkat: 30, naikTingkat: 25, pipa: '30' } },
        { label: 'Anggrek / sukulen', desc: '80 cm, 4 tingkat rapat', params: { panjang: 80, tingkat: 4, dalamTingkat: 18, naikTingkat: 18, pipa: '20' } },
      ],
    },
    {
      id: 'pohon',
      group: 'bertingkat',
      name: 'Rak tanaman tiang pohon',
      desc: 'satu tiang tengah, nampan bundar di lengan yang berputar naik',
      params: { model: 'pohon', panjang: 80, tingkat: 5, dalamTingkat: 26, naikTingkat: 22, papan: 'kayu' },
      sizes: [
        { label: '5 pot', desc: 'jangkauan 80 cm, nampan 26 cm', params: { panjang: 80, tingkat: 5, dalamTingkat: 26, naikTingkat: 22 } },
        { label: 'Pojok ruangan', desc: 'jangkauan 60 cm, 4 nampan', params: { panjang: 60, tingkat: 4, dalamTingkat: 22, naikTingkat: 25 } },
        { label: 'Pot sedang', desc: 'jangkauan 100 cm, 6 nampan 32 cm', params: { panjang: 100, tingkat: 6, dalamTingkat: 32, naikTingkat: 22, pipa: '30' } },
      ],
    },
    {
      id: 'menara',
      group: 'vertikal',
      name: 'Menara pot vertikal',
      desc: 'menara 4 tiang ramping, nampan menjulur kiri-kanan dengan penguat miring',
      params: { model: 'menara', tingkat: 5, dalamTingkat: 25, naikTingkat: 28, pipa: '20' },
      sizes: [
        { label: 'Balkon', desc: '5 nampan 25 cm', params: { tingkat: 5, dalamTingkat: 25, naikTingkat: 28 } },
        { label: 'Pot kecil rapat', desc: '5 nampan 18 cm', params: { tingkat: 5, dalamTingkat: 18, naikTingkat: 22 } },
        { label: 'Pot sedang', desc: '4 nampan 32 cm', params: { tingkat: 4, dalamTingkat: 32, naikTingkat: 35, pipa: '30' } },
      ],
    },
    {
      id: 'teralis',
      group: 'vertikal',
      name: 'Rak pot + teralis rambat',
      desc: 'rak pot rendah, tiang belakang naik jadi kisi untuk tanaman merambat',
      params: { model: 'teralis', panjang: 100, tinggi: 170, tingkat: 2, dalamTingkat: 30, naikTingkat: 30, pipa: '20' },
      sizes: [
        { label: 'Pagar hidup teras', desc: '100 × 170 cm, 2 tingkat', params: { panjang: 100, tinggi: 170, tingkat: 2 } },
        { label: 'Panjang', desc: '150 × 180 cm, 1 tingkat', params: { panjang: 150, tinggi: 180, tingkat: 1, dalamTingkat: 35, naikTingkat: 40, pipa: '30' } },
        { label: 'Sempit', desc: '70 × 150 cm, 2 tingkat', params: { panjang: 70, tinggi: 150, tingkat: 2, dalamTingkat: 25, naikTingkat: 28 } },
      ],
    },
    {
      id: 'tiga-kaki',
      group: 'bertingkat',
      name: 'Rak pot tiga kaki',
      desc: 'tiga tiang tegak berdenah segitiga, nampan bundar bertumpuk di atas cincin segitiga',
      params: { model: 'tiga-kaki', tingkat: 3, dalamTingkat: 35, naikTingkat: 28 },
      sizes: [
        { label: 'Pot sedang', desc: '3 nampan 35 cm', params: { tingkat: 3, dalamTingkat: 35, naikTingkat: 28, pipa: '20' } },
        { label: 'Pot kecil', desc: '4 nampan 28 cm rapat', params: { tingkat: 4, dalamTingkat: 28, naikTingkat: 22, pipa: '20' } },
        { label: 'Pot besar', desc: '2 nampan 45 cm', params: { tingkat: 2, dalamTingkat: 45, naikTingkat: 35, pipa: '30' } },
      ],
    },
    {
      id: 'miring',
      group: 'bertingkat',
      name: 'Rak tanaman kaki miring',
      desc: 'kaki depan dan belakang miring sejajar di atas rel lantai, tiap tingkat bergeser mundur',
      params: { model: 'miring', panjang: 100, tingkat: 3, dalamTingkat: 25, naikTingkat: 30 },
      sizes: [
        { label: 'Teras', desc: '100 cm, 3 tingkat', params: { panjang: 100, tingkat: 3, dalamTingkat: 25, naikTingkat: 30, pipa: '20' } },
        { label: 'Sukulen', desc: '60 cm, 4 tingkat rapat', params: { panjang: 60, tingkat: 4, dalamTingkat: 18, naikTingkat: 22, pipa: '20' } },
        { label: 'Panjang', desc: '150 cm, 3 tingkat dalam', params: { panjang: 150, tingkat: 3, dalamTingkat: 30, naikTingkat: 32, pipa: '30' } },
      ],
    },
    {
      id: 'keliling',
      group: 'bertingkat',
      name: 'Rak pot keliling tiang',
      desc: 'lapisan tiang berbentuk cincin mengelilingi tiang rumah atau pohon, makin ke dalam makin tinggi',
      params: { model: 'keliling', lubang: 35, tingkat: 2, dalamTingkat: 25, naikTingkat: 25 },
      sizes: [
        { label: 'Tiang teras', desc: 'lubang 35 cm, 2 tingkat', params: { lubang: 35, tingkat: 2, dalamTingkat: 25, naikTingkat: 25, pipa: '20' } },
        { label: 'Batang pohon', desc: 'lubang 60 cm, 1 tingkat lebar', params: { lubang: 60, tingkat: 1, dalamTingkat: 30, naikTingkat: 30, pipa: '20' } },
        { label: 'Pot kecil 3 lapis', desc: 'lubang 30 cm, 3 tingkat', params: { lubang: 30, tingkat: 3, dalamTingkat: 20, naikTingkat: 22, pipa: '30' } },
      ],
    },
    {
      id: 'gapura',
      group: 'vertikal',
      name: 'Gapura tanaman rambat',
      desc: 'dua panel samping berkisi disatukan batang atap datar, jalan bisa lewat di bawahnya',
      params: { model: 'gapura', panjang: 130, tinggi: 220, dalam: 40, pipa: '30' },
      sizes: [
        { label: 'Pintu taman', desc: 'lebar 130 cm, tinggi 220 cm', params: { panjang: 130, tinggi: 220, dalam: 40, pipa: '30' } },
        { label: 'Lorong lebar', desc: 'lebar 180 cm, dalam 60 cm', params: { panjang: 180, tinggi: 235, dalam: 60, pipa: '40' } },
        { label: 'Jalan setapak', desc: 'lebar 100 cm, tinggi 210 cm', params: { panjang: 100, tinggi: 210, dalam: 30, pipa: '30' } },
      ],
    },
    {
      id: 'plafon',
      group: 'gantung',
      name: 'Rak pot gantung plafon',
      desc: 'satu batang tengah dari plat plafon, nampan bundar bertingkat di atas lengan silang',
      params: { model: 'plafon', tingkat: 3, dalamTingkat: 30, naikTingkat: 35, tinggiPlafon: 280, jarakPlafon: 60 },
      sizes: [
        { label: '3 nampan', desc: 'nampan 30 cm, jarak 35 cm', params: { tingkat: 3, dalamTingkat: 30, naikTingkat: 35, jarakPlafon: 60 } },
        { label: 'Pot besar', desc: '2 nampan 40 cm', params: { tingkat: 2, dalamTingkat: 40, naikTingkat: 45, jarakPlafon: 70, pipa: '30' } },
        { label: 'Tanaman juntai', desc: '4 nampan 22 cm', params: { tingkat: 4, dalamTingkat: 22, naikTingkat: 28, jarakPlafon: 40 } },
      ],
    },
    {
      id: 'ring-dinding',
      group: 'gantung',
      name: 'Dudukan pot dinding',
      desc: 'dua tiang dan rel dibaut ke tembok, dudukan pot kotak menjorok selang-seling tanpa papan',
      params: { model: 'ring-dinding', panjang: 100, tingkat: 3, dalamTingkat: 15, naikTingkat: 30, tinggiMulai: 90 },
      sizes: [
        { label: 'Pot 15 cm', desc: '100 cm, 3 baris', params: { panjang: 100, tingkat: 3, dalamTingkat: 15, naikTingkat: 30, tinggiMulai: 90 } },
        { label: 'Pot 20 cm', desc: '120 cm, 3 baris', params: { panjang: 120, tingkat: 3, dalamTingkat: 20, naikTingkat: 35, tinggiMulai: 80 } },
        { label: 'Tembok sempit', desc: '60 cm, 4 baris', params: { panjang: 60, tingkat: 4, dalamTingkat: 15, naikTingkat: 28, tinggiMulai: 70 } },
      ],
    },
    {
      id: 'balkon',
      group: 'gantung',
      name: 'Rak pot pagar balkon',
      desc: 'pelana dikaitkan di atas pagar, nampan berbibir di sisi luar dan dalam pagar',
      params: { model: 'balkon', panjang: 80, dalamTingkat: 20, tinggiPagar: 100, lebarPagar: 6 },
      sizes: [
        { label: 'Pagar besi', desc: '80 cm, nampan 20 cm', params: { panjang: 80, dalamTingkat: 20, tinggiPagar: 100, lebarPagar: 6 } },
        { label: 'Panjang', desc: '120 cm, nampan 25 cm', params: { panjang: 120, dalamTingkat: 25, tinggiPagar: 100, lebarPagar: 6 } },
        { label: 'Pagar tembok', desc: '100 cm, atas pagar 15 cm', params: { panjang: 100, dalamTingkat: 20, tinggiPagar: 90, lebarPagar: 15 } },
      ],
    },
    {
      id: 'tancap',
      group: 'gantung',
      name: 'Tiang pot gantung taman',
      desc: 'tiang tunggal ditancap ke tanah, lengan atas bersiku miring dengan kait pot di kedua ujung',
      params: { model: 'tancap', panjang: 60, tinggi: 180 },
      sizes: [
        { label: 'Dua pot', desc: 'lengan 60 cm, tinggi 180 cm', params: { panjang: 60, tinggi: 180, pipa: '20' } },
        { label: 'Lengan lebar', desc: 'lengan 90 cm, tinggi 200 cm', params: { panjang: 90, tinggi: 200, pipa: '30' } },
        { label: 'Pendek', desc: 'lengan 50 cm, tinggi 140 cm', params: { panjang: 50, tinggi: 140, pipa: '20' } },
      ],
    },
    {
      id: 'rak-lubang',
      group: 'semai',
      name: 'Meja pot berlubang',
      desc: 'rangka samping tertutup di rel lantai, atas kisi lubang tempat pot masuk, papan rak di bawah',
      params: { model: 'rak-lubang', panjang: 100, tinggi: 75, baris: 2, dalamTingkat: 18 },
      sizes: [
        { label: 'Pot 18 cm', desc: '100 cm, 2 baris', params: { panjang: 100, tinggi: 75, baris: 2, dalamTingkat: 18, pipa: '20' } },
        { label: 'Pot 25 cm', desc: '120 cm, 2 baris', params: { panjang: 120, tinggi: 80, baris: 2, dalamTingkat: 25, pipa: '30' } },
        { label: 'Polybag kecil', desc: '80 cm, 3 baris', params: { panjang: 80, tinggi: 70, baris: 3, dalamTingkat: 15, pipa: '20' } },
      ],
    },
    {
      id: 'rumah-kaca',
      group: 'semai',
      name: 'Rak rumah kaca mini',
      desc: 'rak susun 4 tiang dengan rangka atap pelana di atasnya untuk ditutup plastik',
      params: { model: 'rumah-kaca', panjang: 80, tingkat: 3, dalamTingkat: 40, naikTingkat: 35 },
      sizes: [
        { label: '3 rak', desc: '80 × 40 cm', params: { panjang: 80, tingkat: 3, dalamTingkat: 40, naikTingkat: 35, pipa: '20' } },
        { label: 'Semai 4 rak', desc: '100 × 45 cm, rak rapat', params: { panjang: 100, tingkat: 4, dalamTingkat: 45, naikTingkat: 30, pipa: '30' } },
        { label: 'Kecil', desc: '60 × 30 cm, 2 rak', params: { panjang: 60, tingkat: 2, dalamTingkat: 30, naikTingkat: 35, pipa: '20' } },
      ],
    },
  ],
  summary: (p) => {
    const n = num(p, 'tingkat');
    const d = num(p, 'dalamTingkat');
    if (isM(p, 'gantung')) return `${num(p, 'panjang')} × ${num(p, 'tinggi')} cm · pot gantung`;
    if (isM(p, 'teralis')) return `${num(p, 'panjang')} × ${num(p, 'tinggi')} cm · ${n} tingkat + teralis`;
    if (isM(p, 'pohon', 'menara')) return `${n} nampan ${d} cm · tinggi ${(n - 1) * num(p, 'naikTingkat') + 20} cm`;
    if (isM(p, 'tiga-kaki')) return `${n} nampan ${d} cm · tinggi ${15 + (n - 1) * num(p, 'naikTingkat')} cm`;
    if (isM(p, 'plafon')) return `${n} nampan ${d} cm · gantung dari plafon ${num(p, 'tinggiPlafon')} cm`;
    if (isM(p, 'keliling')) return `lubang ${num(p, 'lubang')} cm · ${Math.min(3, n)} tingkat keliling`;
    if (isM(p, 'gapura')) return `${num(p, 'panjang')} × ${num(p, 'dalam')} × ${num(p, 'tinggi')} cm · gapura rambat`;
    if (isM(p, 'ring-dinding')) return `${num(p, 'panjang')} cm · ${n} baris dudukan pot ${d} cm`;
    if (isM(p, 'balkon')) return `${num(p, 'panjang')} cm · 2 nampan ${d} cm di pagar`;
    if (isM(p, 'tancap')) return `lengan ${num(p, 'panjang')} cm · tinggi ${num(p, 'tinggi')} cm dari tanah`;
    if (isM(p, 'rak-lubang')) return `${num(p, 'panjang')} × ${num(p, 'tinggi')} cm · ${num(p, 'baris')} baris lubang pot ${d} cm`;
    if (isM(p, 'rumah-kaca')) return `${num(p, 'panjang')} × ${d} cm · ${n} rak + atap pelana`;
    if (isM(p, 'miring')) return `${num(p, 'panjang')} cm · ${Math.max(2, n)} tingkat miring`;
    return `${num(p, 'panjang')} cm · ${n} tingkat · tinggi ${n * num(p, 'naikTingkat')} cm`;
  },

  build: (p) => {
    const model = str(p, 'model', 'tangga');
    const W0 = num(p, 'panjang', 100);
    const n = Math.max(1, Math.round(num(p, 'tingkat', 3)));
    const d = num(p, 'dalamTingkat', 25);
    const h = num(p, 'naikTingkat', 25);
    const Ht = num(p, 'tinggi', 160);
    const L = (parseInt(str(p, 'pipa', '20')) || 20) / 10;
    const b = BOARD_THICK[str(p, 'papan', 'kayu')] ?? 2.5;
    const rail: [number, number] = [20, 20];
    const thin: [number, number] = [15, 15];
    const rh = 2;
    const pt: [number, number] = [L * 10, L * 10];
    const { list, add, line } = memberFactory();
    const boards: Board[] = [];
    let W = W0;
    let D = 0;
    let H = 0;

    if (model === 'tangga' || model === 'piramida') {
      // Ruas z: tiap ruas punya tingkat (1 = paling rendah). Tiang di setiap batas ruas, setinggi ruas tertinggi di sebelahnya.
      const nn = Math.max(2, n);
      const lv = model === 'tangga' ? Array.from({ length: nn }, (_, i) => nn - i) : Array.from({ length: 2 * nn - 1 }, (_, i) => nn - Math.abs(nn - 1 - i));
      // lv[j] = tingkat ruas ke-j dari belakang (z = 0) ke depan
      const m = lv.length;
      D = m * d;
      const zAt = (k: number) => (k === 0 ? L / 2 : k === m ? D - L / 2 : k * d);
      const xs = [L / 2, W - L / 2];
      for (let k = 0; k <= m; k++) {
        const hk = Math.max(lv[k - 1] ?? 0, lv[k] ?? 0) * h;
        xs.forEach((x, j) => add(`tiang-${k}-${j}`, 'y', x, 0, zAt(k), hk, 'post', `Tiang ${j ? 'kanan' : 'kiri'} batas ${k + 1}`, pt));
      }
      for (let j = 0; j < m; j++) {
        const yTop = lv[j] * h;
        const y = yTop - rh / 2;
        const zB = zAt(j);
        const zF = zAt(j + 1);
        const t = j + 1;
        add(`r${t}-depan`, 'x', L, y, zF, W - 2 * L, 'rail-x', `Palang ruas ${t} depan`, rail);
        add(`r${t}-belakang`, 'x', L, y, zB, W - 2 * L, 'rail-x', `Palang ruas ${t} belakang`, rail);
        xs.forEach((x, s) => add(`r${t}-${s ? 'kanan' : 'kiri'}`, 'z', x, y, zB + L / 2, zF - zB - L, 'rail-z', `Palang ruas ${t} ${s ? 'kanan' : 'kiri'}`, rail));
        // palang bawah supaya kaki tidak membuka
        xs.forEach((x, s) => add(`bawah-${t}-${s}`, 'z', x, 8, zB + L / 2, zF - zB - L, 'rail-z', `Palang bawah ruas ${t} ${s ? 'kanan' : 'kiri'}`, rail));
        if (b > 0) boards.push(board(`papan-${t}`, `Papan ruas ${t}`, L, W - L, yTop, yTop + b, zB - L / 2, zF + L / 2));
      }
      H = Math.max(...lv) * h + b;
    } else if (model === 'pohon') {
      // Kaki silang, tiang tengah, nampan bundar di ujung lengan berputar mengelilingi tiang; nampan teratas di puncak tiang
      D = W;
      const c = W / 2;
      const r = Math.max(d / 2 + 4, W / 2 - d / 2);
      add('kaki-x', 'x', 0, L / 2, c, W, 'rail-x', 'Kaki silang kiri-kanan', pt);
      add('kaki-z-b', 'z', c, L / 2, 0, c - L / 2, 'rail-z', 'Kaki silang belakang', pt);
      add('kaki-z-d', 'z', c, L / 2, c + L / 2, W - c - L / 2, 'rail-z', 'Kaki silang depan', pt);
      const ys = Array.from({ length: n }, (_, i) => r1(18 + i * h));
      const yTop = ys[n - 1];
      // tiang naik sampai bawah dudukan nampan puncak (dudukan puncak duduk di ujung tiang, tidak melayang)
      add('tiang', 'y', c, L, c, yTop + rh - thin[0] / 20 - L, 'post', 'Tiang tengah', pt);
      ys.forEach((y, i) => {
        const t = i + 1;
        const top = i === n - 1;
        const ang = ((i * (360 / Math.max(1, Math.min(n - 1, 4))) + (i >= 4 ? 45 : 0)) * Math.PI) / 180;
        const tx = top ? c : c + r * Math.cos(ang);
        const tz = top ? c : c + r * Math.sin(ang);
        // lengan dilas rata di sisi tiang: pada sudut diagonal, titik awal mundur ke bidang sisi tiang (bukan ke dalam sudutnya)
        const r0 = L / 2 / Math.max(Math.abs(Math.cos(ang)), Math.abs(Math.sin(ang)));
        if (!top) line(`lengan-${t}`, [c + r0 * Math.cos(ang), y, c + r0 * Math.sin(ang)], [tx, y, tz], 'custom', `Lengan nampan ${t}`, rail);
        // dudukan silang: batang x menerus, batang z dipotong dua dan dilas di kedua sisi batang x
        const hd = d * 0.4;
        const tw = thin[0] / 20;
        add(`dudukan-${t}-x`, 'x', tx - hd, y + rh, tz, 2 * hd, 'rail-x', `Dudukan nampan ${t} (x)`, thin);
        add(`dudukan-${t}-z`, 'z', tx, y + rh, tz - hd, hd - tw, 'rail-z', `Dudukan nampan ${t} (z) belakang`, thin);
        add(`dudukan-${t}-z2`, 'z', tx, y + rh, tz + tw, hd - tw, 'rail-z', `Dudukan nampan ${t} (z) depan`, thin);
        if (b > 0) boards.push({ ...board(`nampan-${t}`, `Nampan pot ${t}`, tx - d / 2, tx + d / 2, y + rh + 0.75, y + rh + 0.75 + b, tz - d / 2, tz + d / 2), shape: 'round' });
      });
      H = yTop + rh + 1 + b;
    } else if (model === 'menara') {
      // Menara 20 cm di tengah, nampan d×d menjulur bergantian kiri / kanan, kaki lantai selebar rak
      const s = 20;
      W = s + 2 * d;
      D = Math.max(d, 25);
      const x0 = d + L / 2;
      const x1 = d + s - L / 2;
      const zb = L / 2;
      const zf = D - L / 2;
      const ys = Array.from({ length: n }, (_, i) => r1(25 + i * h));
      H = ys[n - 1] + 15;
      add('kaki-b', 'x', 0, L / 2, zb, W, 'rail-x', 'Kaki lantai belakang', pt);
      add('kaki-d', 'x', 0, L / 2, zf, W, 'rail-x', 'Kaki lantai depan', pt);
      [0, 1].forEach((j) => add(`kaki-ujung-${j}`, 'z', j ? W - L / 2 : L / 2, L / 2, L, D - 2 * L, 'rail-z', `Kaki lantai ujung ${j ? 'kanan' : 'kiri'}`, pt));
      [x0, x1].forEach((x, i) => [zb, zf].forEach((z, j) => add(`menara-${i}-${j}`, 'y', x, L, z, H - L, 'post', `Tiang menara ${i ? 'kanan' : 'kiri'} ${j ? 'depan' : 'belakang'}`, pt)));
      add('menara-atas-b', 'x', x0 + L / 2, H - 1, zb, x1 - x0 - L, 'rail-x', 'Palang atas menara belakang', rail);
      add('menara-atas-d', 'x', x0 + L / 2, H - 1, zf, x1 - x0 - L, 'rail-x', 'Palang atas menara depan', rail);
      ys.forEach((y, i) => {
        const t = i + 1;
        const left = i % 2 === 0;
        const xp = left ? x0 : x1; // tiang menara tempat nampan menempel
        const xe = left ? L / 2 + 0.5 : W - L / 2 - 0.5; // ujung luar
        const xa = left ? xe : xp + L / 2;
        const len = left ? xp - L / 2 - xe : xe - xa;
        const sd = left ? 'kiri' : 'kanan';
        add(`n${t}-b`, 'x', xa, y, zb, len, 'rail-x', `Lengan nampan ${t} ${sd} belakang`, rail);
        add(`n${t}-d`, 'x', xa, y, zf, len, 'rail-x', `Lengan nampan ${t} ${sd} depan`, rail);
        add(`n${t}-ujung`, 'z', xe, y, zb + 1, zf - zb - 2, 'rail-z', `Palang ujung nampan ${t}`, rail);
        // palang menara di antara tiang (belakang & depan), palang ikat dilas di antara keduanya
        add(`n${t}-menara-b`, 'x', x0 + L / 2, y, zb, x1 - x0 - L, 'rail-x', `Palang menara ${t} belakang`, rail);
        add(`n${t}-menara-d`, 'x', x0 + L / 2, y, zf, x1 - x0 - L, 'rail-x', `Palang menara ${t} depan`, rail);
        add(`n${t}-ikat`, 'z', (x0 + x1) / 2, y, zb + 1, zf - zb - 2, 'rail-z', `Palang ikat menara ${t}`, rail);
        const dir = left ? -1 : 1;
        // penguat miring: kedua ujung dipotong datar (rata lengan di atas); ujung bawah digeser keluar supaya
        // sudut potongannya menempel di sisi tiang, tidak masuk ke dalam tiang
        const yb = y - d * 0.6;
        const yu = y - rh / 2;
        const xu = xp + dir * d * 0.6;
        let xb = xp + dir * (L / 2);
        for (let k = 0; k < 3; k++) {
          const uy = (yu - yb) / Math.hypot(xu - xb, yu - yb);
          xb = xp + dir * (L / 2 + thin[0] / 20 / uy);
        }
        [zb, zf].forEach((z, j) => line(`n${t}-penguat-${j}`, [xb, yb, z], [xu, yu, z], 'custom', `Penguat miring nampan ${t} ${j ? 'depan' : 'belakang'}`, thin));
        if (b > 0) boards.push(board(`nampan-${t}`, `Papan nampan ${t} ${sd}`, left ? 0 : xp + L / 2, left ? xp - L / 2 : W, y + rh / 2, y + rh / 2 + b, 0, D));
      });
      if (b > 0) boards.push(board('papan-puncak', 'Papan puncak menara', x0 - L / 2, x1 + L / 2, H, H + b, 0, D));
      H += b;
    } else if (model === 'tiga-kaki') {
      // 3 tiang tegak (denah segitiga), cincin segitiga di bawah tiap nampan bundar; papan menyentuh sisi dalam tiang
      const r = d / 2;
      const s = L / 2;
      const angs = [270, 30, 150].map((a) => (a * Math.PI) / 180); // belakang, depan kanan, depan kiri
      const gapTo = (R: number) =>
        Math.min(...angs.map((a) => Math.hypot(Math.max(0, Math.abs(R * Math.cos(a)) - s), Math.max(0, Math.abs(R * Math.sin(a)) - s))));
      let R = r;
      while (gapTo(R) < r + 0.2 && R < r + 10) R += 0.1;
      R = r1(R);
      const c = r1(R * Math.cos(Math.PI / 6) + s);
      const cz = R + s;
      W = 2 * c;
      D = Math.max(cz + R / 2 + s, cz + r);
      const legs = angs.map((a) => [c + R * Math.cos(a), cz + R * Math.sin(a)] as [number, number]);
      const ys = Array.from({ length: n }, (_, i) => r1(15 + i * h)); // atas cincin = bawah nampan
      const yTop = ys[n - 1];
      const nm = ['belakang', 'depan kanan', 'depan kiri'];
      legs.forEach(([x, z], i) => add(`tiang-${i}`, 'y', x, 0, z, yTop, 'post', `Tiang ${nm[i]}`, pt));
      ys.forEach((y, i) => {
        const t = i + 1;
        const yc = y - rh / 2;
        // cincin depan sejajar sumbu: dilas rata di sisi kedua tiang depan
        add(`cincin-${t}-depan`, 'x', legs[2][0] + s, yc, legs[2][1], legs[1][0] - legs[2][0] - L, 'rail-x', `Cincin nampan ${t} depan`, rail);
        // cincin miring (dilihat dari atas): ujung dipotong berhenti tepat di muka tiang
        [1, 2].forEach((k) => {
          const [ax, az] = legs[0];
          const [bx, bz] = legs[k];
          const ln = Math.hypot(bx - ax, bz - az);
          const ux = (bx - ax) / ln;
          const uz = (bz - az) / ln;
          const ta = clearFromPost(ax, az, s, ux, uz, rail[0] / 10);
          const tb = clearFromPost(bx, bz, s, -ux, -uz, rail[0] / 10);
          line(`cincin-${t}-${k === 1 ? 'kanan' : 'kiri'}`, [ax + ux * ta, yc, az + uz * ta], [bx - ux * tb, yc, bz - uz * tb], 'custom', `Cincin nampan ${t} ${k === 1 ? 'kanan' : 'kiri'}`, rail);
        });
        if (b > 0) boards.push({ ...board(`nampan-${t}`, `Nampan pot ${t}`, c - r, c + r, y, y + b, cz - r, cz + r), shape: 'round' });
      });
      H = yTop + b;
    } else if (model === 'miring') {
      // Kaki depan & belakang miring sejajar (jajar genjang dari samping) berdiri di rel lantai; tingkat makin ke atas makin mundur
      const tn = Math.tan((20 * Math.PI) / 180);
      const ex = L / 2 / Math.cos((20 * Math.PI) / 180); // setengah lebar kaki miring pada potongan datar
      const nn = Math.max(2, n);
      const ys = Array.from({ length: nn }, (_, i) => r1(20 + i * h));
      const yTop = ys[nn - 1];
      const zbAt = (y: number) => ex + (yTop - y) * tn;
      const zfAt = (y: number) => zbAt(y) + d - 2 * ex;
      D = r1(zfAt(L) + ex);
      const xs = [L / 2, W - L / 2];
      xs.forEach((x, i) => {
        const sd = i ? 'kanan' : 'kiri';
        add(`rel-lantai-${sd}`, 'z', x, L / 2, 0, D, 'rail-z', `Rel lantai ${sd}`, pt);
        line(`kaki-depan-${sd}`, [x, L, zfAt(L)], [x, yTop, zfAt(yTop)], 'post', `Kaki miring depan ${sd}`, pt);
        line(`kaki-belakang-${sd}`, [x, L, zbAt(L)], [x, yTop, zbAt(yTop)], 'post', `Kaki miring belakang ${sd}`, pt);
      });
      ys.forEach((y, i) => {
        const t = i + 1;
        const yc = y - rh / 2;
        add(`t${t}-depan`, 'x', L, yc, zfAt(yc), W - 2 * L, 'rail-x', `Palang tingkat ${t} depan`, rail);
        add(`t${t}-belakang`, 'x', L, yc, zbAt(yc), W - 2 * L, 'rail-x', `Palang tingkat ${t} belakang`, rail);
        // palang samping di antara kedua kaki: berhenti di muka kaki miring (bagian yang paling menjorok)
        const zs = zbAt(y - rh) + ex;
        const ze = zfAt(y) - ex;
        xs.forEach((x, j) => add(`t${t}-${j ? 'kanan' : 'kiri'}`, 'z', x, yc, zs, ze - zs, 'rail-z', `Palang tingkat ${t} ${j ? 'kanan' : 'kiri'}`, rail));
        if (b > 0) boards.push(board(`papan-${t}`, `Papan tingkat ${t}`, L, W - L, y, y + b, zbAt(yc) - 1, zfAt(yc) + 1));
      });
      H = yTop + b;
    } else if (model === 'keliling') {
      // Rak keliling tiang / pohon: lapisan cincin tiang, tingkat makin ke dalam makin tinggi, lubang di tengah
      const lub = num(p, 'lubang', 40);
      const nn = Math.min(3, n);
      const pk = (k: number) => lub / 2 + L / 2 + (nn - k) * d; // jarak as tiang batas k dari pusat
      const c = r1(pk(0) + L / 2);
      W = 2 * c;
      D = W;
      const corner = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
      // cincin biasa: palang di antara tiang sudut (dilas rata di sisi tiang)
      const ringBetween = (id: string, k: number, yc: number, label: string) => {
        const q = pk(k);
        add(`${id}-depan`, 'x', c - q + L / 2, yc, c + q, 2 * q - L, 'rail-x', `${label} depan`, rail);
        add(`${id}-belakang`, 'x', c - q + L / 2, yc, c - q, 2 * q - L, 'rail-x', `${label} belakang`, rail);
        add(`${id}-kiri`, 'z', c - q, yc, c - q + L / 2, 2 * q - L, 'rail-z', `${label} kiri`, rail);
        add(`${id}-kanan`, 'z', c + q, yc, c - q + L / 2, 2 * q - L, 'rail-z', `${label} kanan`, rail);
      };
      // palang penghubung antar cincin di tengah tiap sisi (a = jarak dalam, b2 = jarak luar dari pusat)
      const radial = (id: string, a: number, b2: number, yc: number, label: string) => {
        add(`${id}-depan`, 'z', c, yc, c + a, b2 - a, 'rail-z', `${label} depan`, rail);
        add(`${id}-belakang`, 'z', c, yc, c - b2, b2 - a, 'rail-z', `${label} belakang`, rail);
        add(`${id}-kiri`, 'x', c - b2, yc, c, b2 - a, 'rail-x', `${label} kiri`, rail);
        add(`${id}-kanan`, 'x', c + a, yc, c, b2 - a, 'rail-x', `${label} kanan`, rail);
      };
      for (let k = 0; k <= nn; k++) {
        const q = pk(k);
        const hk = Math.min(k + 1, nn) * h;
        corner.forEach(([sx, sz], j) => add(`tiang-${k}-${j}`, 'y', c + sx * q, 0, c + sz * q, hk, 'post', `Tiang lapis ${k + 1} sudut ${j + 1}`, pt));
        ringBetween(`bawah-${k}`, k, 8, `Palang bawah lapis ${k + 1}`);
        if (k < nn) radial(`bawah-ikat-${k}`, pk(k + 1) + rh / 2, pk(k) - rh / 2, 8, `Palang bawah penghubung lapis ${k + 1}`);
      }
      for (let t = 1; t <= nn; t++) {
        const yTop = t * h;
        const yc = yTop - rh / 2;
        ringBetween(`t${t}-luar`, t - 1, yc, `Cincin luar tingkat ${t}`);
        // cincin dalam ditempel di muka luar tiang lapis dalam (tiang itu terus naik ke tingkat berikutnya)
        const q = pk(t) + L / 2;
        add(`t${t}-dalam-depan`, 'x', c - q, yc, c + q + rh / 2, 2 * q, 'rail-x', `Cincin dalam tingkat ${t} depan`, rail);
        add(`t${t}-dalam-belakang`, 'x', c - q, yc, c - q - rh / 2, 2 * q, 'rail-x', `Cincin dalam tingkat ${t} belakang`, rail);
        add(`t${t}-dalam-kiri`, 'z', c - q - rh / 2, yc, c - q, 2 * q, 'rail-z', `Cincin dalam tingkat ${t} kiri`, rail);
        add(`t${t}-dalam-kanan`, 'z', c + q + rh / 2, yc, c - q, 2 * q, 'rail-z', `Cincin dalam tingkat ${t} kanan`, rail);
        radial(`t${t}-ikat`, q + rh, pk(t - 1) - rh / 2, yc, `Palang ikat tingkat ${t}`);
        if (b > 0) {
          const Q = pk(t - 1) + L / 2;
          boards.push(board(`papan-${t}-depan`, `Papan tingkat ${t} depan`, c - Q, c + Q, yTop, yTop + b, c + q, c + Q));
          boards.push(board(`papan-${t}-belakang`, `Papan tingkat ${t} belakang`, c - Q, c + Q, yTop, yTop + b, c - Q, c - q));
          boards.push(board(`papan-${t}-kiri`, `Papan tingkat ${t} kiri`, c - Q, c - q, yTop, yTop + b, c - q, c + q));
          boards.push(board(`papan-${t}-kanan`, `Papan tingkat ${t} kanan`, c + q, c + Q, yTop, yTop + b, c - q, c + q));
        }
      }
      H = nn * h + b;
    } else if (model === 'gapura') {
      // Dua panel samping berkisi (tanaman rambat), disatukan batang atap datar di atas; bisa dilewati orang
      const Dg = num(p, 'dalam', 40);
      D = Dg;
      H = Ht + rh;
      const xs = [10 + L / 2, W - 10 - L / 2];
      const zs = [L / 2, D - L / 2];
      const tw = thin[0] / 20;
      xs.forEach((x, i) => {
        const sd = i ? 'kanan' : 'kiri';
        zs.forEach((z, j) => add(`tiang-${sd}-${j}`, 'y', x, 0, z, Ht - L, 'post', `Tiang ${sd} ${j ? 'depan' : 'belakang'}`, pt));
        add(`balok-${sd}`, 'z', x, Ht - L / 2, 0, D, 'rail-z', `Balok atas panel ${sd}`, pt);
        add(`bawah-${sd}`, 'z', x, 15, L, D - 2 * L, 'rail-z', `Palang bawah panel ${sd}`, rail);
        // kisi: batang tegak menerus, batang datar dipotong di antara tiang & batang tegak
        const y0 = 15 + rh / 2;
        const y1 = Ht - L;
        const nv = Math.max(1, Math.round((D - 2 * L) / 15) - 1);
        const zv = Array.from({ length: nv }, (_, k) => L + ((D - 2 * L) * (k + 1)) / (nv + 1));
        zv.forEach((z, k) => add(`kisi-${sd}-tegak-${k + 1}`, 'y', x, y0, z, y1 - y0, 'custom', `Kisi ${sd} tegak ${k + 1}`, thin));
        const edges = [L, ...zv.flatMap((z) => [z - tw, z + tw]), D - L];
        const nh = Math.max(1, Math.round((y1 - y0) / 25) - 1);
        for (let k = 1; k <= nh; k++) {
          const yk = y0 + ((y1 - y0) * k) / (nh + 1);
          for (let e = 0; e + 1 < edges.length; e += 2)
            add(`kisi-${sd}-datar-${k}-${e / 2 + 1}`, 'z', x, yk, edges[e], edges[e + 1] - edges[e], 'custom', `Kisi ${sd} datar ${k} ruas ${e / 2 + 1}`, thin);
        }
      });
      // batang atap ditumpuk di atas kedua balok, menjorok 10 cm di kiri & kanan
      const nr = Math.max(3, Math.round(D / 15) + 1);
      for (let k = 0; k < nr; k++) {
        const z = rh / 2 + ((D - rh) * k) / (nr - 1);
        add(`atap-${k + 1}`, 'x', 0, Ht + rh / 2, z, W, 'rail-x', `Batang atap ${k + 1}`, rail);
      }
    } else if (model === 'plafon') {
      // Satu batang tengah dari plat plafon, nampan bundar bertingkat di atas lengan silang (nampan berlubang tengah)
      const Hc = num(p, 'tinggiPlafon', 280);
      const jp = num(p, 'jarakPlafon', 60);
      W = d;
      D = d;
      H = Hc;
      const c = d / 2;
      const arm = Math.max(L / 2 + 3, d * 0.42);
      const ys = Array.from({ length: n }, (_, i) => r1(Hc - jp - i * h)); // i = 0 nampan teratas
      const yLow = ys[n - 1] - rh;
      add('batang-gantung', 'y', c, yLow, c, Hc - 0.5 - yLow, 'post', 'Batang gantung tengah (menembus nampan)', pt);
      boards.push({ ...board('plat-plafon', 'Plat dudukan plafon (dibaut ke balok)', c - 6, c + 6, Hc - 0.5, Hc, c - 6, c + 6), steelMm: 5 });
      ys.forEach((y, i) => {
        const t = i + 1;
        const yc = y - rh / 2;
        add(`lengan-${t}-kiri`, 'x', c - arm, yc, c, arm - L / 2, 'rail-x', `Lengan nampan ${t} kiri`, rail);
        add(`lengan-${t}-kanan`, 'x', c + L / 2, yc, c, arm - L / 2, 'rail-x', `Lengan nampan ${t} kanan`, rail);
        add(`lengan-${t}-belakang`, 'z', c, yc, c - arm, arm - L / 2, 'rail-z', `Lengan nampan ${t} belakang`, rail);
        add(`lengan-${t}-depan`, 'z', c, yc, c + L / 2, arm - L / 2, 'rail-z', `Lengan nampan ${t} depan`, rail);
        if (b > 0) boards.push({ ...board(`nampan-${t}`, `Nampan pot ${t}`, 0, d, y, y + b, 0, d), shape: 'round' });
      });
    } else if (model === 'ring-dinding') {
      // 2 tiang dibaut tembok, rel datar per baris, dudukan pot kotak (ring) menjorok selang-seling; pot masuk sampai bibirnya
      const y0 = num(p, 'tinggiMulai', 90);
      const ys = Array.from({ length: n }, (_, i) => r1(y0 + i * h));
      const zr = L + rh / 2;
      const z0 = L + rh;
      const pitch = d + 2 * rh + 6;
      const m = Math.max(1, Math.floor((W - 4) / pitch));
      const yb = ys[0] - 12;
      const yt = ys[n - 1] + 12;
      D = z0 + d + rh;
      H = yt;
      [L / 2, W - L / 2].forEach((x, i) => add(`tiang-${i ? 'kanan' : 'kiri'}`, 'y', x, yb, L / 2, yt - yb, 'post', `Tiang tembok ${i ? 'kanan' : 'kiri'} (dibaut)`, pt));
      ys.forEach((y, i) => {
        const t = i + 1;
        add(`rel-${t}`, 'x', 0, y, zr, W, 'rail-x', `Rel baris ${t}`, rail);
        const shift = i % 2 === 1 && m > 1;
        const cnt = shift ? m - 1 : m;
        const x0 = (W - m * pitch) / 2 + pitch / 2 + (shift ? pitch / 2 : 0);
        for (let k = 0; k < cnt; k++) {
          const xs = x0 + k * pitch;
          const id = `ring-${t}-${k + 1}`;
          add(`${id}-kiri`, 'z', xs - d / 2 - rh / 2, y, z0, d, 'rail-z', `Dudukan pot ${t}.${k + 1} kiri`, rail);
          add(`${id}-kanan`, 'z', xs + d / 2 + rh / 2, y, z0, d, 'rail-z', `Dudukan pot ${t}.${k + 1} kanan`, rail);
          add(`${id}-depan`, 'x', xs - d / 2 - rh, y, z0 + d + rh / 2, d + 2 * rh, 'rail-x', `Dudukan pot ${t}.${k + 1} depan`, rail);
        }
      });
    } else if (model === 'balkon') {
      // Pelana di atas pagar balkon: kait mengangkangi pagar, nampan berbibir di sisi luar & dalam pagar
      const Hp = num(p, 'tinggiPagar', 100);
      const g = num(p, 'lebarPagar', 6) + 1; // celah kait (sedikit lebih lebar dari pagar)
      const t = rh;
      D = 4 * t + g + 2 * d;
      H = Hp + t;
      const ya = r1(Hp - 22);
      const zD = [t + d + t / 2, t + d + t + g + t / 2];
      const nH = W > 90 ? 3 : 2;
      const xh = Array.from({ length: nH }, (_, i) => t / 2 + ((W - t) * i) / (nH - 1));
      const yLip = ya + t / 2 + 8;
      xh.forEach((x, i) => {
        const k = i + 1;
        add(`kait-${k}`, 'z', x, Hp + t / 2, t + d, 2 * t + g, 'rail-z', `Kait atas pagar ${k}`, rail);
        zD.forEach((z, j) => add(`turun-${k}-${j ? 'dalam' : 'luar'}`, 'y', x, ya - t / 2, z, Hp - (ya - t / 2), 'post', `Batang turun ${k} sisi ${j ? 'dalam' : 'luar'}`, rail));
        add(`lengan-${k}-luar`, 'z', x, ya, t, d, 'rail-z', `Lengan nampan ${k} luar`, rail);
        add(`lengan-${k}-dalam`, 'z', x, ya, t + d + 2 * t + g, d, 'rail-z', `Lengan nampan ${k} dalam`, rail);
        add(`bibir-${k}-luar`, 'y', x, ya - t / 2, t / 2, yLip - (ya - t / 2), 'post', `Tiang bibir ${k} luar`, rail);
        add(`bibir-${k}-dalam`, 'y', x, ya - t / 2, D - t / 2, yLip - (ya - t / 2), 'post', `Tiang bibir ${k} dalam`, rail);
        if (i + 1 < nH)
          zD.forEach((z, j) => add(`ikat-${k}-${j ? 'dalam' : 'luar'}`, 'x', x + t / 2, ya, z, xh[i + 1] - x - t, 'rail-x', `Palang ikat ${k} sisi ${j ? 'dalam' : 'luar'}`, rail));
      });
      add('bibir-luar', 'x', 0, yLip + t / 2, t / 2, W, 'rail-x', 'Bibir penahan pot luar', rail);
      add('bibir-dalam', 'x', 0, yLip + t / 2, D - t / 2, W, 'rail-x', 'Bibir penahan pot dalam', rail);
      if (b > 0) {
        boards.push(board('nampan-luar', 'Nampan sisi luar pagar', 0, W, ya + t / 2, ya + t / 2 + b, t, t + d));
        boards.push(board('nampan-dalam', 'Nampan sisi dalam pagar', 0, W, ya + t / 2, ya + t / 2 + b, D - t - d, D - t));
      }
    } else if (model === 'tancap') {
      // Tiang tunggal ditancap ke tanah (30 cm bawah), lengan datar di pucuk dengan kait pot gantung di kedua ujung
      const tanam = 30;
      const xc = W / 2;
      const zc = L / 2;
      const yArm = tanam + Ht - L / 2; // as lengan
      H = tanam + Ht;
      D = L + 4;
      add('tiang', 'y', xc, 0, zc, tanam + Ht - L, 'post', 'Tiang (30 cm bawah ditancap ke tanah, ujung dipotong runcing)', pt);
      add('lengan', 'x', 0, yArm, zc, W, 'rail-x', 'Lengan atas', pt);
      add('pijakan-kiri', 'x', xc - L / 2 - 10, tanam + rh / 2, zc, 10, 'rail-x', 'Pijakan kiri (untuk menekan tiang ke tanah)', rail);
      add('pijakan-kanan', 'x', xc + L / 2, tanam + rh / 2, zc, 10, 'rail-x', 'Pijakan kanan', rail);
      const tw = thin[0] / 20;
      [2, W - 2].forEach((x, i) => {
        const sd = i ? 'kanan' : 'kiri';
        const yk = yArm - L / 2 - 10;
        add(`kait-${sd}`, 'y', x, yk, zc, 10, 'custom', `Kait pot ${sd}`, thin);
        add(`kait-${sd}-ujung`, 'z', x, yk + tw, zc + tw, 4, 'custom', `Ujung kait ${sd}`, thin);
        // siku miring: atas rata di bawah lengan, bawah menempel di sisi tiang
        const dir = i ? 1 : -1;
        const yu = yArm - L / 2;
        const yb2 = yu - 22;
        const xu = xc + dir * Math.min(18, W / 2 - 6);
        let xb = xc + dir * (L / 2);
        for (let k = 0; k < 3; k++) {
          const uy = (yu - yb2) / Math.hypot(xu - xb, yu - yb2);
          xb = xc + dir * (L / 2 + tw / uy);
        }
        line(`siku-${sd}`, [xb, yb2, zc], [xu, yu, zc], 'custom', `Siku miring ${sd}`, thin);
      });
    } else if (model === 'rak-lubang') {
      // Rangka samping tertutup di rel lantai, atas berupa kisi kotak (pot masuk sampai bibirnya), papan rak bawah
      const rows = Math.min(4, Math.max(1, Math.round(num(p, 'baris', 2))));
      const pz = d + rh;
      D = rows * pz + rh;
      H = Ht;
      const m = Math.max(1, Math.floor((W - rh) / (d + rh)));
      const px = (W - rh) / m;
      const yg = Ht - rh / 2;
      [L / 2, W - L / 2].forEach((x, i) => {
        const sd = i ? 'kanan' : 'kiri';
        add(`rel-lantai-${sd}`, 'z', x, L / 2, 0, D, 'rail-z', `Rel lantai ${sd}`, pt);
        [L / 2, D - L / 2].forEach((z, j) => add(`tiang-${sd}-${j}`, 'y', x, L, z, Ht - rh - L, 'post', `Tiang ${sd} ${j ? 'depan' : 'belakang'}`, pt));
      });
      [L / 2, D - L / 2].forEach((z, j) => add(`rak-bawah-${j ? 'depan' : 'belakang'}`, 'x', L, 15, z, W - 2 * L, 'rail-x', `Palang rak bawah ${j ? 'depan' : 'belakang'}`, rail));
      if (b > 0) boards.push(board('papan-bawah', 'Papan rak bawah', L, W - L, 15 + rh / 2, 15 + rh / 2 + b, 0, D));
      for (let k = 0; k <= rows; k++) add(`kisi-x-${k + 1}`, 'x', 0, yg, rh / 2 + k * pz, W, 'rail-x', `Kisi atas memanjang ${k + 1}`, rail);
      for (let k = 0; k < rows; k++)
        for (let j = 0; j <= m; j++) add(`kisi-z-${k + 1}-${j + 1}`, 'z', rh / 2 + j * px, yg, rh + k * pz, pz - rh, 'rail-z', `Kisi atas sekat baris ${k + 1} no ${j + 1}`, rail);
    } else if (model === 'rumah-kaca') {
      // Rak susun 4 tiang dengan rangka atap pelana di atasnya (untuk ditutup plastik UV)
      D = d;
      const Hw = r1(15 + n * h);
      const rise = r1(D * 0.35);
      H = Hw + rise + rh;
      const xs = [L / 2, W - L / 2];
      const zs = [L / 2, D - L / 2];
      xs.forEach((x, i) => zs.forEach((z, j) => add(`tiang-${i}-${j}`, 'y', x, 0, z, Hw - rh, 'post', `Tiang ${i ? 'kanan' : 'kiri'} ${j ? 'depan' : 'belakang'}`, pt)));
      for (let i = 0; i < n; i++) {
        const t = i + 1;
        const y = 15 + i * h;
        const yc = y - rh / 2;
        zs.forEach((z, j) => add(`t${t}-${j ? 'depan' : 'belakang'}`, 'x', L, yc, z, W - 2 * L, 'rail-x', `Palang tingkat ${t} ${j ? 'depan' : 'belakang'}`, rail));
        xs.forEach((x, j) => add(`t${t}-${j ? 'kanan' : 'kiri'}`, 'z', x, yc, L, D - 2 * L, 'rail-z', `Palang tingkat ${t} ${j ? 'kanan' : 'kiri'}`, rail));
        if (b > 0) boards.push(board(`papan-${t}`, `Papan tingkat ${t}`, L, W - L, y, y + b, 0, D));
      }
      // ring atap di pucuk tiang
      zs.forEach((z, j) => add(`atap-ring-${j ? 'depan' : 'belakang'}`, 'x', 0, Hw - rh / 2, z, W, 'rail-x', `Ring atap ${j ? 'depan' : 'belakang'}`, rail));
      xs.forEach((x, j) => add(`atap-ring-${j ? 'kanan' : 'kiri'}`, 'z', x, Hw - rh / 2, L / 2 + rh / 2, D - L - rh, 'rail-z', `Ring atap ${j ? 'kanan' : 'kiri'}`, rail));
      // kuda-kuda: kasau miring dari ring atap ke bubungan, kedua ujung dipotong datar
      const zr = D / 2;
      const yR = Hw + rise;
      let e = 1;
      let zLow = L / 2;
      for (let k = 0; k < 5; k++) {
        zLow = Math.max(L / 2, e);
        const uy = rise / Math.hypot(zr - e - zLow, rise);
        e = rail[0] / 20 / uy;
      }
      const rx = W > 90 ? [...xs, W / 2] : xs;
      rx.forEach((x, i) => {
        const nm2 = i === 2 ? 'tengah' : i ? 'kanan' : 'kiri';
        line(`kasau-${nm2}-depan`, [x, Hw, D - zLow], [x, yR, zr + e], 'custom', `Kasau ${nm2} depan`, rail);
        line(`kasau-${nm2}-belakang`, [x, Hw, zLow], [x, yR, zr - e], 'custom', `Kasau ${nm2} belakang`, rail);
      });
      add('bubungan', 'x', 0, yR + rh / 2, zr, W, 'rail-x', 'Bubungan', [40, 20]);
    } else if (model === 'gantung') {
      // Gawang: kaki melintang, 2 tiang, palang atas dengan kait; rak pot di bawah di antara tiang
      D = Math.max(40, Math.round(d * 1.5));
      H = Ht;
      const zc = D / 2;
      const xs = [L / 2, W - L / 2];
      xs.forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        add(`kaki-${nm}`, 'z', x, L / 2, 0, D, 'rail-z', `Kaki melintang ${nm}`, pt);
        add(`tiang-${nm}`, 'y', x, L, zc, H - L, 'post', `Tiang ${nm}`, pt);
        add(`rak-${nm}`, 'z', x, 22, zc - d / 2, d, 'rail-z', `Palang rak pot ${nm}`, rail);
      });
      add('palang-atas', 'x', L, H - L / 2, zc, W - 2 * L, 'rail-x', 'Palang atas gantungan pot', pt);
      add('palang-tengah', 'x', L, H * 0.55, zc, W - 2 * L, 'rail-x', 'Palang tengah', rail);
      add('rak-depan', 'x', L / 2 - 1, 22, zc + d / 2 - 1, W - L + 2, 'rail-x', 'Palang rak pot depan', rail);
      add('rak-belakang', 'x', L / 2 - 1, 22, zc - d / 2 + 1, W - L + 2, 'rail-x', 'Palang rak pot belakang', rail);
      if (b > 0) boards.push(board('papan-rak', 'Papan rak pot', L, W - L, 23, 23 + b, zc - d / 2, zc + d / 2));
      const nk = Math.max(2, Math.round((W - 2 * L) / 30));
      for (let i = 0; i < nk; i++) {
        const xk = L + ((W - 2 * L) * (i + 0.5)) / nk;
        add(`kait-${i + 1}`, 'y', xk, H - L - 8, zc, 8, 'custom', `Kait pot gantung ${i + 1}`, thin);
        add(`kait-${i + 1}-ujung`, 'z', xk, H - L - 8, zc, 4, 'custom', `Ujung kait ${i + 1}`, thin);
      }
    } else {
      // teralis: rak pot rendah (tiang depan pendek) + tiang belakang tinggi dengan kisi
      D = d;
      H = Ht;
      const zb = L / 2;
      const zf = D - L / 2;
      const xs = [L / 2, W - L / 2];
      const ytop = n * h;
      xs.forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        add(`tiang-${nm}-b`, 'y', x, 0, zb, H, 'post', `Tiang ${nm} belakang (teralis)`, pt);
        add(`tiang-${nm}-d`, 'y', x, 0, zf, ytop, 'post', `Tiang ${nm} depan`, pt);
        add(`bawah-${nm}`, 'z', x, 8, L, D - 2 * L, 'rail-z', `Palang bawah ${nm}`, rail);
      });
      for (let i = 1; i <= n; i++) {
        const y = i * h - rh / 2;
        add(`t${i}-depan`, 'x', L, y, zf, W - 2 * L, 'rail-x', `Palang tingkat ${i} depan`, rail);
        add(`t${i}-belakang`, 'x', L, y, zb, W - 2 * L, 'rail-x', `Palang tingkat ${i} belakang`, rail);
        xs.forEach((x, j) => add(`t${i}-${j ? 'kanan' : 'kiri'}`, 'z', x, y, L, D - 2 * L, 'rail-z', `Palang tingkat ${i} ${j ? 'kanan' : 'kiri'}`, rail));
        if (b > 0) boards.push(board(`papan-${i}`, `Papan tingkat ${i}`, L, W - L, i * h, i * h + b, 0, D));
      }
      add('teralis-atas', 'x', L, H - L / 2, zb, W - 2 * L, 'rail-x', 'Palang atas teralis', pt);
      // Kisi sebidang: kisi tegak menerus dari atas palang tingkat teratas sampai bawah palang atas teralis;
      // kisi datar dipotong pendek di antara tiang & kisi tegak, dilas rata di kedua sisinya.
      const y0 = ytop;
      const y1 = H - L;
      const tw = thin[0] / 20;
      const nv = Math.max(1, Math.round((W - 2 * L) / 20) - 1);
      const xv = Array.from({ length: nv }, (_, i) => L + ((W - 2 * L) * (i + 1)) / (nv + 1));
      xv.forEach((x, i) => add(`kisi-tegak-${i + 1}`, 'y', x, y0, zb, y1 - y0, 'custom', `Kisi tegak ${i + 1}`, thin));
      const edges = [L, ...xv.flatMap((x) => [x - tw, x + tw]), W - L];
      const nh = Math.max(1, Math.round((y1 - y0) / 20) - 1);
      for (let i = 1; i <= nh; i++) {
        const yk = y0 + ((y1 - y0) * i) / (nh + 1);
        for (let k = 0; k + 1 < edges.length; k += 2)
          add(`kisi-datar-${i}-${k / 2 + 1}`, 'x', edges[k], yk, zb, edges[k + 1] - edges[k], 'custom', `Kisi datar ${i} ruas ${k / 2 + 1}`, thin);
      }
    }

    return { members: list, boards, casters: [], W, D, H, boardThick: 0 };
  },

  checks: (p, bld) => {
    const out: ProductCheck[] = [];
    const model = str(p, 'model', 'tangga');
    const W = num(p, 'panjang');
    const d = num(p, 'dalamTingkat');
    const h = num(p, 'naikTingkat');
    const n = num(p, 'tingkat');
    const pipa = str(p, 'pipa');
    if (W > 120 && pipa === '20' && ['tangga', 'piramida', 'teralis', 'miring', 'rak-lubang', 'rumah-kaca', 'gantung'].includes(model))
      out.push({ level: 'warn', message: 'Pot tanah basah berat. Rak sepanjang ini sebaiknya pakai pipa 30×30.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
    if ((model === 'tangga' || model === 'piramida' || model === 'keliling') && h < d * 0.6) out.push({ level: 'info', message: 'Selisih tinggi kecil: daun tanaman depan bisa menutupi pot di belakangnya.' });
    if ((model === 'tangga' || model === 'piramida' || model === 'miring') && n < 2)
      out.push({ level: 'warn', message: 'Rak bertingkat ini butuh minimal 2 tingkat.', fix: { label: '3 tingkat', params: { tingkat: 3 } } });
    if (model === 'pohon') {
      const reach = W / 2;
      if (reach - d / 2 < d * 0.6) out.push({ level: 'warn', message: 'Jangkauan terlalu kecil: nampan saling bertumpuk di sekeliling tiang.', fix: { label: `Lebar ${Math.min(200, Math.ceil(d * 3.2))} cm`, params: { panjang: Math.min(200, Math.ceil(d * 3.2)) } } });
      if (reach > 60) out.push({ level: 'warn', message: 'Lengan lebih dari 60 cm melendut kena pot basah.', fix: { label: 'Lebar 100 cm', params: { panjang: 100 } } });
      if (h < 18) out.push({ level: 'warn', message: 'Nampan terlalu rapat, tanaman tidak punya ruang tumbuh.', fix: { label: 'Selisih 22 cm', params: { naikTingkat: 22 } } });
      if ((n - 1) * h + 20 > 180 && pipa === '20') out.push({ level: 'warn', message: 'Tiang tunggal 20×20 terlalu ramping untuk setinggi ini.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
    }
    if (model === 'menara') {
      const H = 25 + (n - 1) * h + 15;
      const Wm = 20 + 2 * d;
      if (H / Wm > 2.6) out.push({ level: 'warn', message: 'Menara tinggi dengan kaki sempit mudah terguling saat pot di satu sisi lebih berat.', fix: { label: 'Kurangi 1 nampan', params: { tingkat: Math.max(1, n - 1) } } });
      if (d > 30 && pipa === '20') out.push({ level: 'warn', message: 'Nampan menjulur sedalam ini butuh pipa 30×30.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
    }
    if (model === 'gantung' && num(p, 'tinggi') / Math.max(40, d * 1.5) > 4.5)
      out.push({ level: 'warn', message: 'Gawang tinggi dengan kaki pendek mudah terguling kena angin.', fix: { label: 'Rak pot 35 cm', params: { dalamTingkat: 35 } } });
    if (model === 'teralis') {
      if (num(p, 'tinggi') < n * h + 40) out.push({ level: 'warn', message: 'Teralis hampir tidak terlihat: rangka kurang tinggi dari rak potnya.', fix: { label: `Tinggi ${Math.min(220, n * h + 100)} cm`, params: { tinggi: Math.min(220, n * h + 100) } } });
      if (num(p, 'tinggi') / d > 6) out.push({ level: 'warn', message: 'Teralis tinggi dengan alas sempit: angkur ke tembok atau perdalam rak.', fix: { label: 'Kedalaman 35 cm', params: { dalamTingkat: 35 } } });
    }
    if (model === 'tiga-kaki') {
      if (bld.H / Math.max(1, bld.D) > 3.2) out.push({ level: 'warn', message: 'Rak tiga kaki setinggi ini mudah goyang. Kurangi nampan atau perbesar nampan.', fix: { label: 'Kurangi 1 nampan', params: { tingkat: Math.max(1, n - 1) } } });
      if (h < d * 0.6) out.push({ level: 'info', message: 'Jarak antar nampan rapat: tanaman di nampan bawah tertutup nampan atas.' });
      if (d >= 40 && pipa === '20') out.push({ level: 'warn', message: 'Nampan selebar ini menampung pot berat, pakai pipa 30×30.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
    }
    if (model === 'miring') out.push({ level: 'info', message: 'Rel lantai jangan dipotong pendek: rel itulah yang menahan rak supaya tidak terjengkang ke belakang.' });
    if (model === 'keliling') {
      if (bld.W > 160 && pipa === '20') out.push({ level: 'warn', message: 'Rak keliling selebar ini sebaiknya pakai pipa 30×30.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
      if (n > 3) out.push({ level: 'info', message: 'Rak keliling dibuat paling banyak 3 lapis.' });
      out.push({ level: 'info', message: 'Rak dibuat dua belahan (kiri dan kanan) lalu dibaut di tempat, supaya bisa dipasang mengelilingi tiang atau pohon.' });
    }
    if (model === 'gapura') {
      if (num(p, 'tinggi') < 205) out.push({ level: 'warn', message: 'Gapura kurang tinggi: kepala orang dewasa bisa terbentur batang atap.', fix: { label: 'Tinggi 215 cm', params: { tinggi: 215 } } });
      if (num(p, 'tinggi') > 220 && pipa === '20') out.push({ level: 'warn', message: 'Tiang 20×20 terlalu ramping untuk gapura setinggi ini.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
      if (W - 20 < 80) out.push({ level: 'warn', message: 'Jalan di bawah gapura terlalu sempit untuk dilewati orang.', fix: { label: 'Lebar 120 cm', params: { panjang: 120 } } });
      out.push({ level: 'info', message: 'Tanam kaki tiang 30 cm ke cor beton atau baut ke lantai, gapura tinggi mudah roboh kena angin.' });
    }
    if (model === 'plafon') {
      const low = num(p, 'tinggiPlafon') - num(p, 'jarakPlafon') - (n - 1) * h;
      if (low < 30) out.push({ level: 'warn', message: 'Nampan terbawah hampir menyentuh lantai. Kurangi nampan atau jarak.', fix: { label: 'Kurangi 1 nampan', params: { tingkat: Math.max(1, n - 1) } } });
      else if (low < 160) out.push({ level: 'info', message: 'Nampan terbawah di bawah tinggi kepala. Gantung di pojok atau di atas meja supaya tidak terbentur.' });
      out.push({ level: 'info', message: 'Plat plafon dibaut ke balok beton atau kayu, jangan hanya ke gypsum.' });
    }
    if (model === 'ring-dinding') {
      if (h < d * 1.2) out.push({ level: 'warn', message: 'Jarak baris terlalu rapat: pot di atas menekan tanaman di bawahnya.', fix: { label: `Jarak ${Math.min(45, Math.ceil(d * 1.6))} cm`, params: { naikTingkat: Math.min(45, Math.ceil(d * 1.6)) } } });
      out.push({ level: 'info', message: 'Ukur diameter pot tepat di bawah bibirnya; bibir pot yang menahan pot di dudukan. Tiang dibaut fisher ke tembok bata.' });
    }
    if (model === 'balkon') {
      if (W > 100 && d > 22 && pipa === '20') out.push({ level: 'warn', message: 'Dua nampan sepanjang ini berat. Pakai pipa 30×30 atau pendekkan.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
      out.push({ level: 'info', message: 'Ukur tebal atas pagar sebelum dilas. Lapisi kait dengan karet supaya cat pagar tidak tergores.' });
    }
    if (model === 'tancap') {
      if (W > 80 && pipa === '20') out.push({ level: 'warn', message: 'Lengan selebar ini dengan pot gantung basah membuat tiang 20×20 melengkung.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
      out.push({ level: 'info', message: 'Bagian bawah tiang 30 cm dipotong runcing dan ditancap ke tanah; untuk tanah gembur, cor dengan semen.' });
    }
    if (model === 'rak-lubang') {
      if (W > 120) out.push({ level: 'warn', message: 'Tanpa kaki tengah, kisi atas sepanjang ini melendut kena pot basah.', fix: { label: 'Panjang 120 cm', params: { panjang: 120 } } });
      out.push({ level: 'info', message: 'Isi ukuran lubang sedikit lebih kecil dari bibir pot supaya pot menggantung di kisi dan air menetes ke rak bawah.' });
    }
    if (model === 'rumah-kaca') {
      if (W > 100 && pipa === '20') out.push({ level: 'warn', message: 'Rak rumah kaca sepanjang ini sebaiknya pakai pipa 30×30.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
      out.push({ level: 'info', message: 'Plastik UV dan resleting pintu dipasang sendiri mengikuti rangka.' });
    }
    out.push({ level: 'info', message: 'Untuk di luar ruangan, pilih besi galvanis atau cat dasar anti karat 2 lapis.' });
    return out;
  },
};
