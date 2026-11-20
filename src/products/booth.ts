import { FrameHinge, FrameMember } from '../types/kitchen';
import { Board, Params, ProductBuild, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, board, bool, materialParams, memberFactory, num, str } from './common';
import { memberFromPoints } from '../utils/frameLayout';

/** Bentuk lama yang memakai rangka dudukan bawaan (sandaran miring + pilihan meja bundar menyatu) */
const OLD_TABLE = ['tunggal', 'ganda', 'sudut'];
const sisiOf = (p: Params) => str(p, 'sisi', 'tunggal');
const isSisi = (...v: string[]) => (p: Params) => v.includes(sisiOf(p));
/** Bentuk yang punya meja tengah persegi menyatu */
const SQUARE_TABLE = ['hadap', 'u-meja', 'kabin', 'panggung'];

const JOK_OPTIONS = [
  { value: '#3f4a3c', label: 'Hijau zaitun' },
  { value: '#7a3b2a', label: 'Terakota' },
  { value: '#2b2d31', label: 'Hitam' },
  { value: '#b49a76', label: 'Krem' },
  { value: '#355c7d', label: 'Biru' },
];

/**
 * Rangka booth / sofa cafe: dudukan berbusa, sandaran tinggi miring.
 * Tunggal (menempel tembok) atau ganda punggung-ke-punggung (sandaran saling menempel di atas).
 * Bisa diberi meja bundar kecil yang menyatu dengan rangka: bertiang tegak berkaki rel lantai, atau
 * bertiang lengan L yang keluar dari rangka bawah dudukan (meja melayang, lantai tetap bebas).
 * Sudut L: booth utama + sayap menempel tembok samping, sandaran sayap menyambung ke tiang sandaran utama.
 * Berhadapan: dua booth saling menghadap + meja persegi di tengah, kaki meja berdiri di rel lantai yang
 * menyambung kaki depan kedua booth (satu set kaku, tidak bergeser).
 */
export const BOOTH: ProductDef = {
  id: 'booth',
  name: 'Booth / sofa cafe',
  tagline: 'tunggal · punggung · sudut L · berhadapan · kabin · ayun',
  icon: 'M6 36V8M6 24h22M28 24v12M54 36V8M54 24H32M32 24v12',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['sisi', 'panjang', 'panjangSudut', 'tinggiDudukan', 'dalamDudukan', 'tinggiPanggung', 'tinggiAtap', 'tinggiPlafon'] },
    { id: 'bentuk', title: 'Sandaran', keys: ['tinggiSandaran', 'miringSandaran', 'tinggiPanel', 'busa', 'warnaJok'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Meja', keys: ['mejaBooth', 'jumlahMejaBooth', 'diameterMejaBooth', 'lebarMejaHadap', 'tinggiMejaBooth'] },
  ],
  params: [
    {
      key: 'sisi',
      label: 'Bentuk rangka booth',
      type: 'choice',
      options: [
        { value: 'tunggal', label: 'Tunggal', desc: 'Menempel tembok, satu arah' },
        { value: 'ganda', label: 'Punggung-ke-punggung', desc: 'Dua sisi di tengah ruangan' },
        { value: 'sudut', label: 'Sudut L (pojok)', desc: 'Booth utama + sayap di tembok samping' },
        { value: 'hadap', label: 'Berhadapan + meja', desc: 'Dua booth saling menghadap, meja di tengah, satu set' },
        { value: 'panel-samping', label: 'Panel samping', desc: 'Ujung kiri-kanan bingkai tertutup papan (sayap / lengan)' },
        { value: 'sled', label: 'Kaki seluncur', desc: 'Tiap pasang kaki berdiri di rel lantai' },
        { value: 'kantilever', label: 'Kaki C menjulur', desc: 'Tanpa kaki depan, dudukan menjulur dari tiang belakang' },
        { value: 'dinding', label: 'Melayang di tembok', desc: 'Tiang dibaut tembok, siku miring, tanpa kaki lantai' },
        { value: 'kotak-simpan', label: 'Kotak simpan', desc: 'Kolong tertutup papan, tutup dudukan dibuka ke atas' },
        { value: 'kaki-v', label: 'Kaki V ramping', desc: 'Kaki pipa berbentuk V di bawah rangka dudukan' },
        { value: 'u-meja', label: 'U tiga sisi + meja', desc: 'Tiga booth beralas kotak tersembunyi, meja tengah' },
        { value: 'panggung', label: 'Di atas panggung', desc: 'Lantai panggung rendah, booth dan meja di atasnya' },
        { value: 'kabin', label: 'Kabin beratap', desc: 'Dua booth berhadapan, 4 tiang sampai rangka atap' },
        { value: 'ayun-plafon', label: 'Sofa ayun plafon', desc: 'Dudukan digantung batang V dari kait plafon' },
      ],
    },
    { key: 'panjang', label: 'Panjang', type: 'number', unit: 'cm', min: 60, max: 300, step: 1, help: '±60 cm per orang. Bentuk U: panjang booth belakang.', marks: [{ value: 120, label: '2 orang' }, { value: 180, label: '3 orang' }] },
    { key: 'panjangSudut', label: 'Panjang sayap (tembok samping)', type: 'number', unit: 'cm', min: 60, max: 240, step: 1, help: 'Diukur dari depan dudukan booth utama.', showIf: isSisi('sudut', 'u-meja') },
    { key: 'tinggiDudukan', label: 'Tinggi dudukan (dengan busa)', type: 'number', unit: 'cm', min: 40, max: 50, step: 1, marks: [{ value: 46, label: 'standar' }] },
    { key: 'dalamDudukan', label: 'Kedalaman dudukan', type: 'number', unit: 'cm', min: 40, max: 60, step: 1, marks: [{ value: 48, label: 'umum' }] },
    { key: 'tinggiPanggung', label: 'Tinggi panggung', type: 'number', unit: 'cm', min: 12, max: 45, step: 1, help: 'Satu anak tangga ±18 cm.', marks: [{ value: 18, label: '1 undak' }, { value: 30, label: 'tinggi' }], showIf: isSisi('panggung') },
    { key: 'tinggiAtap', label: 'Tinggi rangka atap', type: 'number', unit: 'cm', min: 190, max: 260, step: 1, help: 'Dari lantai ke atas rangka atap kabin.', marks: [{ value: 210, label: 'pintu' }], showIf: isSisi('kabin') },
    { key: 'tinggiPlafon', label: 'Tinggi plafon', type: 'number', unit: 'cm', min: 240, max: 350, step: 1, help: 'Dari lantai ke plafon / balok tempat kait digantung.', marks: [{ value: 280, label: 'rumah' }, { value: 320, label: 'cafe' }], showIf: isSisi('ayun-plafon') },
    { key: 'tinggiSandaran', label: 'Tinggi sandaran dari lantai', type: 'number', unit: 'cm', min: 80, max: 140, step: 1, help: 'Booth di atas panggung: diukur dari lantai panggung.', marks: [{ value: 90, label: 'standar' }, { value: 107, label: 'tinggi' }, { value: 122, label: 'privat' }] },
    { key: 'miringSandaran', label: 'Kemiringan sandaran', type: 'number', unit: '°', min: 0, max: 15, step: 1, marks: [{ value: 10, label: 'nyaman' }], showIf: isSisi('tunggal', 'ganda', 'hadap') },
    { key: 'tinggiPanel', label: 'Tinggi panel samping', type: 'number', unit: 'cm', min: 55, max: 140, step: 1, help: 'Setinggi sandaran = sayap privat. Rendah ±65 cm = lengan sofa.', marks: [{ value: 65, label: 'lengan' }], showIf: isSisi('panel-samping') },
    { key: 'busa', label: 'Busa & jok', type: 'toggle', help: 'Gambar busa dudukan & sandaran (dibuat tukang jok).' },
    { key: 'warnaJok', label: 'Warna jok', type: 'choice', options: JOK_OPTIONS, showIf: (p) => p.busa === true },
    ...materialParams(true),
    {
      key: 'mejaBooth',
      label: 'Meja bundar menyatu',
      type: 'choice',
      showIf: isSisi(...OLD_TABLE),
      options: [
        { value: 'none', label: 'Tanpa meja' },
        { value: 'tiang', label: 'Tiang tegak', desc: 'Tiang ke lantai, dirangkai rel ke booth' },
        { value: 'lengan', label: 'Tiang lengan L', desc: 'Keluar dari rangka bawah dudukan, meja melayang' },
      ],
    },
    { key: 'jumlahMejaBooth', label: 'Jumlah meja', type: 'number', min: 1, max: 4, step: 1, showIf: (p) => OLD_TABLE.includes(sisiOf(p)) && (p.mejaBooth === 'tiang' || p.mejaBooth === 'lengan') },
    { key: 'diameterMejaBooth', label: 'Diameter meja', type: 'number', unit: 'cm', min: 35, max: 70, step: 1, marks: [{ value: 50, label: 'umum' }], showIf: (p) => OLD_TABLE.includes(sisiOf(p)) && (p.mejaBooth === 'tiang' || p.mejaBooth === 'lengan') },
    { key: 'lebarMejaHadap', label: 'Lebar meja tengah', type: 'number', unit: 'cm', min: 50, max: 90, step: 1, marks: [{ value: 70, label: 'umum' }], showIf: isSisi(...SQUARE_TABLE) },
    { key: 'tinggiMejaBooth', label: 'Tinggi meja', type: 'number', unit: 'cm', min: 55, max: 80, step: 1, marks: [{ value: 65, label: 'santai' }, { value: 75, label: 'makan' }], showIf: (p) => SQUARE_TABLE.includes(sisiOf(p)) || (OLD_TABLE.includes(sisiOf(p)) && (p.mejaBooth === 'tiang' || p.mejaBooth === 'lengan')) },
  ],
  defaults: { panjangSudut: 120, lebarMejaHadap: 70, mejaBooth: 'none', jumlahMejaBooth: 2, diameterMejaBooth: 50, tinggiMejaBooth: 65, sisi: 'tunggal', panjang: 120, tinggiDudukan: 46, dalamDudukan: 48, tinggiSandaran: 100, miringSandaran: 10, tinggiPanel: 100, tinggiPanggung: 18, tinggiAtap: 220, tinggiPlafon: 280, busa: true, warnaJok: '#3f4a3c', pipa: '30', papan: 'kayu', warna: '#1f2226' },
  groups: [
    { id: 'sofa', name: 'Booth / sofa', desc: 'menempel tembok · tengah ruangan · pojok' },
    { id: 'meja', name: 'Booth + meja menyatu', desc: 'meja ikut dirangkai ke rangka booth' },
    { id: 'lantai-bebas', name: 'Lantai bebas & gantung', desc: 'tanpa kaki depan, melayang di tembok, atau digantung di plafon' },
  ],
  // Struktur: bentuk rangka (+ jenis meja menyatu untuk bentuk lama). Busa, warna jok, ukuran tidak mengubah rangka
  signature: (p) => {
    const s = sisiOf(p);
    return OLD_TABLE.includes(s) ? `${s}|${str(p, 'mejaBooth', 'none')}` : s;
  },
  presets: [
    {
      id: 'tunggal',
      group: 'sofa',
      name: 'Booth tunggal menempel tembok',
      desc: 'satu dudukan, sandaran miring',
      params: { sisi: 'tunggal', mejaBooth: 'none' },
      sizes: [
        { label: '2 orang', desc: '120 cm, sandaran 100', params: { panjang: 120, tinggiSandaran: 100 } },
        { label: '3 orang', desc: '180 cm, sandaran 107', params: { panjang: 180, tinggiSandaran: 107 } },
        { label: 'Panjang sepanjang tembok', desc: '240 cm, sandaran 90', params: { panjang: 240, tinggiSandaran: 90 } },
        { label: 'Bangku booth kantin (tanpa busa)', desc: '180 cm, dudukan papan', params: { panjang: 180, busa: false, tinggiSandaran: 90, miringSandaran: 8 } },
      ],
    },
    {
      id: 'ganda',
      group: 'sofa',
      name: 'Booth punggung-ke-punggung',
      desc: 'dua dudukan berbagi sandaran tengah',
      params: { sisi: 'ganda', mejaBooth: 'none' },
      sizes: [
        { label: '2 + 2 orang', desc: '120 cm, sandaran 107', params: { panjang: 120, tinggiSandaran: 107 } },
        { label: 'Privat tinggi', desc: '150 cm, sandaran 122', params: { panjang: 150, tinggiSandaran: 122, miringSandaran: 8 } },
        { label: '3 + 3 orang', desc: '180 cm, sandaran 100', params: { panjang: 180, tinggiSandaran: 100 } },
      ],
    },
    {
      id: 'sudut',
      group: 'sofa',
      name: 'Booth sudut L (pojok)',
      desc: 'booth utama + sayap di tembok samping, sandaran tegak bersambung',
      params: { sisi: 'sudut', mejaBooth: 'none', panjang: 180, panjangSudut: 120, tinggiSandaran: 95 },
      sizes: [
        { label: '180 + 120 cm', desc: '±5 orang', params: { panjang: 180, panjangSudut: 120 } },
        { label: '150 + 100 cm', desc: 'pojok kecil, ±4 orang', params: { panjang: 150, panjangSudut: 100 } },
        { label: '240 + 150 cm', desc: 'pojok besar, ±6 orang', params: { panjang: 240, panjangSudut: 150 } },
      ],
    },
    {
      id: 'meja-lengan',
      group: 'meja',
      name: 'Booth + meja bundar lengan L',
      desc: 'meja melayang di tiang lengan L dari rangka bawah dudukan',
      params: { sisi: 'tunggal', mejaBooth: 'lengan', jumlahMejaBooth: 2, diameterMejaBooth: 50, tinggiMejaBooth: 65, panjang: 160 },
      sizes: [
        { label: '2 meja, 160 cm', desc: 'ø50, tinggi 65', params: { panjang: 160, jumlahMejaBooth: 2 } },
        { label: '1 meja, 100 cm', desc: 'ø55, tinggi 70', params: { panjang: 100, jumlahMejaBooth: 1, diameterMejaBooth: 55, tinggiMejaBooth: 70 } },
        { label: '3 meja, 240 cm', desc: 'ø50, tinggi 65', params: { panjang: 240, jumlahMejaBooth: 3 } },
      ],
    },
    {
      id: 'meja-tiang',
      group: 'meja',
      name: 'Booth + meja bundar tiang tegak',
      desc: 'tiang meja ke lantai, kaki silang dirangkai rel ke kaki booth',
      params: { sisi: 'tunggal', mejaBooth: 'tiang', jumlahMejaBooth: 2, diameterMejaBooth: 55, tinggiMejaBooth: 70, panjang: 160 },
      sizes: [
        { label: '2 meja, 160 cm', desc: 'ø55, tinggi 70', params: { panjang: 160, jumlahMejaBooth: 2 } },
        { label: '1 meja makan, 120 cm', desc: 'ø70, tinggi 75', params: { panjang: 120, jumlahMejaBooth: 1, diameterMejaBooth: 70, tinggiMejaBooth: 75 } },
        { label: '3 meja, 240 cm', desc: 'ø55, tinggi 70', params: { panjang: 240, jumlahMejaBooth: 3 } },
      ],
    },
    {
      id: 'hadap',
      group: 'meja',
      name: 'Booth berhadapan + meja tengah (satu set)',
      desc: 'dua booth saling menghadap, kaki meja di rel lantai penyambung',
      params: { sisi: 'hadap', panjang: 120, lebarMejaHadap: 70, tinggiMejaBooth: 72, tinggiSandaran: 107 },
      sizes: [
        { label: '2 + 2 orang', desc: '120 cm, meja 70', params: { panjang: 120 } },
        { label: '3 + 3 orang', desc: '180 cm, meja 75', params: { panjang: 180, lebarMejaHadap: 75 } },
        { label: 'Privat tinggi', desc: '140 cm, sandaran 122', params: { panjang: 140, tinggiSandaran: 122 } },
      ],
    },
    {
      id: 'panel-samping',
      group: 'sofa',
      name: 'Booth panel samping',
      desc: 'ujung kiri-kanan berupa bingkai kotak tertutup papan dari lantai, jadi sayap atau lengan',
      params: { sisi: 'panel-samping', panjang: 130, tinggiSandaran: 115, tinggiPanel: 115 },
      sizes: [
        { label: 'Kabin privat 2 orang', desc: '130 cm, sayap setinggi sandaran 115', params: { panjang: 130, tinggiSandaran: 115, tinggiPanel: 115 } },
        { label: 'Kabin privat 3 orang', desc: '180 cm, sayap 122', params: { panjang: 180, tinggiSandaran: 122, tinggiPanel: 122 } },
        { label: 'Sofa lengan 3 orang', desc: '190 cm, lengan 65, sandaran 85', params: { panjang: 190, tinggiSandaran: 85, tinggiPanel: 65 } },
      ],
    },
    {
      id: 'sled',
      group: 'sofa',
      name: 'Booth kaki seluncur',
      desc: 'tiap pasang kaki depan dan tiang sandaran berdiri di rel lantai depan-belakang',
      params: { sisi: 'sled', panjang: 160, tinggiSandaran: 95 },
      sizes: [
        { label: '2 orang', desc: '120 cm, sandaran 95', params: { panjang: 120 } },
        { label: '3 orang', desc: '180 cm, sandaran 100', params: { panjang: 180, tinggiSandaran: 100 } },
        { label: 'Bangku kantin tanpa busa', desc: '240 cm, dudukan papan', params: { panjang: 240, busa: false, tinggiSandaran: 85 } },
      ],
    },
    {
      id: 'kantilever',
      group: 'lantai-bebas',
      name: 'Booth kaki C menjulur',
      desc: 'tanpa kaki depan: tiap rangka C (tapak lantai, tiang belakang, lengan dudukan) menahan dudukan menjulur',
      params: { sisi: 'kantilever', panjang: 150, pipa: '40', tinggiSandaran: 100 },
      sizes: [
        { label: '2 orang', desc: '120 cm, pipa 40', params: { panjang: 120 } },
        { label: '3 orang', desc: '180 cm, pipa 40', params: { panjang: 180 } },
        { label: 'Panjang sepanjang tembok', desc: '240 cm, sandaran 90', params: { panjang: 240, tinggiSandaran: 90 } },
      ],
    },
    {
      id: 'dinding',
      group: 'lantai-bebas',
      name: 'Booth melayang di tembok',
      desc: 'tiang dibaut ke tembok, lengan dudukan ditopang siku miring, tidak ada kaki ke lantai',
      params: { sisi: 'dinding', panjang: 160, pipa: '40', tinggiSandaran: 95 },
      sizes: [
        { label: '2 orang', desc: '120 cm', params: { panjang: 120 } },
        { label: '3 orang', desc: '180 cm', params: { panjang: 180 } },
        { label: 'Lorong / jendela', desc: '240 cm, dudukan 42 cm', params: { panjang: 240, dalamDudukan: 42, tinggiSandaran: 90 } },
      ],
    },
    {
      id: 'kotak-simpan',
      group: 'sofa',
      name: 'Booth kotak simpan',
      desc: 'kolong dudukan berupa kotak rangka tertutup papan, tutup dudukan per ruang dibuka ke atas dengan engsel',
      params: { sisi: 'kotak-simpan', panjang: 160, tinggiSandaran: 95 },
      sizes: [
        { label: '2 ruang, 120 cm', desc: 'rumah / kos', params: { panjang: 120 } },
        { label: '2 ruang, 160 cm', desc: 'cafe kecil', params: { panjang: 160 } },
        { label: '3 ruang, 220 cm', desc: 'dapur makan / pantry', params: { panjang: 220, tinggiSandaran: 90 } },
      ],
    },
    {
      id: 'kaki-v',
      group: 'sofa',
      name: 'Booth kaki V ramping',
      desc: 'rangka dudukan kotak di atas pasangan kaki pipa berbentuk V, tanpa palang bawah',
      params: { sisi: 'kaki-v', panjang: 150, tinggiSandaran: 90 },
      sizes: [
        { label: '2 orang', desc: '120 cm', params: { panjang: 120 } },
        { label: '3 orang', desc: '180 cm', params: { panjang: 180 } },
        { label: 'Sandaran rendah lounge', desc: '160 cm, sandaran 80', params: { panjang: 160, tinggiSandaran: 80, tinggiDudukan: 42 } },
      ],
    },
    {
      id: 'u-meja',
      group: 'meja',
      name: 'Booth U tiga sisi + meja tengah',
      desc: 'booth belakang dan dua sayap beralas kotak yang masuk ke dalam, meja tengah bertiang di plat bundar',
      params: { sisi: 'u-meja', panjang: 220, panjangSudut: 110, lebarMejaHadap: 80, tinggiMejaBooth: 72, tinggiSandaran: 105 },
      sizes: [
        { label: 'U kecil, 6 orang', desc: '200 + 2 × 100 cm', params: { panjang: 200, panjangSudut: 100, lebarMejaHadap: 75 } },
        { label: 'U sedang, 8 orang', desc: '240 + 2 × 120 cm', params: { panjang: 240, panjangSudut: 120, lebarMejaHadap: 90 } },
      ],
    },
    {
      id: 'panggung',
      group: 'meja',
      name: 'Booth di atas panggung',
      desc: 'lantai panggung rendah berangka kaki pendek, booth dan meja bertiang berdiri di rangka panggung',
      params: { sisi: 'panggung', panjang: 180, tinggiPanggung: 18, lebarMejaHadap: 70, tinggiMejaBooth: 72, tinggiSandaran: 100 },
      sizes: [
        { label: '1 undak, 180 cm', desc: 'panggung 18 cm, 1 meja', params: { panjang: 180, tinggiPanggung: 18 } },
        { label: '1 undak, 260 cm', desc: 'panggung 18 cm, 2 meja', params: { panjang: 260, tinggiPanggung: 18 } },
        { label: 'Panggung tinggi', desc: '200 cm, panggung 30 cm', params: { panjang: 200, tinggiPanggung: 30 } },
      ],
    },
    {
      id: 'kabin',
      group: 'meja',
      name: 'Booth kabin beratap',
      desc: 'dua booth berhadapan, 4 tiang sudut menerus sampai rangka atap, meja tengah bertumpu di palang samping',
      params: { sisi: 'kabin', panjang: 140, lebarMejaHadap: 70, tinggiMejaBooth: 72, tinggiSandaran: 107, tinggiAtap: 220 },
      sizes: [
        { label: '2 + 2 orang', desc: '140 cm, atap 220', params: { panjang: 140 } },
        { label: '3 + 3 orang', desc: '180 cm, meja 75', params: { panjang: 180, lebarMejaHadap: 75 } },
        { label: 'Saung rendah', desc: '140 cm, atap 200', params: { panjang: 140, tinggiAtap: 200, tinggiSandaran: 95 } },
      ],
    },
    {
      id: 'ayun-plafon',
      group: 'lantai-bebas',
      name: 'Sofa ayun gantung plafon',
      desc: 'rangka dudukan bersandaran digantung dua pasang batang V ke kait di plafon, tanpa kaki',
      params: { sisi: 'ayun-plafon', panjang: 120, tinggiSandaran: 95, tinggiPlafon: 280 },
      sizes: [
        { label: '1 orang', desc: '70 cm', params: { panjang: 70 } },
        { label: '2 orang', desc: '120 cm, plafon 280', params: { panjang: 120 } },
        { label: '3 orang, plafon tinggi', desc: '170 cm, plafon 320', params: { panjang: 170, tinggiPlafon: 320 } },
      ],
    },
  ],
  summary: (p) => {
    const sisi = str(p, 'sisi', 'tunggal');
    if (!OLD_TABLE.includes(sisi) && sisi !== 'hadap') {
      const label: Record<string, string> = {
        'panel-samping': `Panel samping ${num(p, 'tinggiPanel')} cm`,
        sled: 'Kaki seluncur',
        kantilever: 'Kaki C menjulur',
        dinding: 'Melayang di tembok',
        'kotak-simpan': 'Kotak simpan',
        'kaki-v': 'Kaki V',
        'u-meja': `U ${num(p, 'panjang')} + 2 × ${num(p, 'panjangSudut')} cm`,
        panggung: `Panggung ${num(p, 'tinggiPanggung')} cm`,
        kabin: `Kabin, atap ${num(p, 'tinggiAtap')} cm`,
        'ayun-plafon': `Ayun, plafon ${num(p, 'tinggiPlafon')} cm`,
      };
      return `${label[sisi] ?? sisi}${sisi === 'u-meja' ? '' : ` · ${num(p, 'panjang')} cm`}, sandaran ${num(p, 'tinggiSandaran')} cm`;
    }
    const nm = sisi === 'ganda' ? 'Ganda' : sisi === 'sudut' ? `Sudut L ${num(p, 'panjang')} + ${num(p, 'panjangSudut')} cm` : sisi === 'hadap' ? 'Berhadapan + meja' : 'Tunggal';
    const meja = sisi !== 'hadap' && str(p, 'mejaBooth', 'none') !== 'none' ? ` · ${num(p, 'jumlahMejaBooth')} meja ø${num(p, 'diameterMejaBooth')}` : '';
    return `${nm}${sisi === 'sudut' ? '' : ` · ${num(p, 'panjang')} cm`}, sandaran ${num(p, 'tinggiSandaran')} cm${meja}`;
  },

  build: (p) => {
    const NEW: Record<string, (c: Ctx, p: Params) => ProductBuild> = {
      'panel-samping': buildPanel,
      sled: buildSled,
      kantilever: buildKantilever,
      dinding: buildDinding,
      'kotak-simpan': buildKotak,
      'kaki-v': buildKakiV,
      'u-meja': buildU,
      panggung: buildPanggung,
      kabin: buildKabin,
      'ayun-plafon': buildAyun,
    };
    const nb = NEW[sisiOf(p)];
    if (nb) return nb(ctxOf(p), p);
    const W = num(p, 'panjang', 120);
    const D = num(p, 'dalamDudukan', 48);
    const Hs = num(p, 'tinggiDudukan', 46);
    const Hb = num(p, 'tinggiSandaran', 100);
    const sisi = str(p, 'sisi', 'tunggal');
    const tilt = sisi === 'sudut' ? 0 : num(p, 'miringSandaran', 10); // sudut L: sandaran tegak supaya kedua sisi bertemu rapi
    const tanT = Math.tan((tilt * Math.PI) / 180);
    const L = (parseInt(str(p, 'pipa', '30')) || 30) / 10;
    const b = BOARD_THICK[str(p, 'papan', 'multiplek')] ?? 1.8;
    const foam = bool(p, 'busa') ? 10 : 0;
    const jok = str(p, 'warnaJok', '#3f4a3c');
    const deckTop = Hs - foam;
    const yS = deckTop - b; // ujung atas rangka dudukan
    const zs = tanT * (Hb - yS); // geser ke depan supaya sandaran miring tidak keluar ke belakang
    const rail: [number, number] = [20, 20];
    const post: [number, number] = [L * 10, L * 10];
    const tableMode = sisi === 'hadap' ? 'none' : str(p, 'mejaBooth', 'none');
    const nT = tableMode === 'none' ? 0 : Math.max(1, Math.round(num(p, 'jumlahMejaBooth', 2)));
    const dT = num(p, 'diameterMejaBooth', 50);
    const hT = Math.max(Hs + 10, num(p, 'tinggiMejaBooth', 65));
    const ext = nT ? dT * 0.75 : 0; // meja menjorok ke depan dudukan

    /** Satu sisi booth menghadap +z, sandaran di z kecil */
    const side = (prefix: string, W: number, withTables: boolean) => {
      const { list, add, line } = memberFactory();
      const boards: Board[] = [];
      const n = Math.max(2, Math.ceil(W / 80) + 1);
      const xs = Array.from({ length: n }, (_, i) => L / 2 + ((W - L) * i) / (n - 1));
      const zb = zs + L / 2;
      const zf = zs + D - L / 2;
      const zBack = (y: number) => zb - tanT * (y - yS);
      xs.forEach((x, i) => {
        add(`${prefix}kaki-d-${i}`, 'y', x, 0, zf, yS, 'post', `Kaki depan ${i + 1}`, post);
        if (tilt === 0) add(`${prefix}tiang-b-${i}`, 'y', x, 0, zb, Hb, 'post', `Tiang sandaran ${i + 1}`, post);
        else {
          add(`${prefix}kaki-b-${i}`, 'y', x, 0, zb, yS, 'post', `Kaki belakang ${i + 1}`, post);
          line(`${prefix}tiang-b-${i}`, [x, yS, zb], [x, Hb, zBack(Hb)], 'post', `Tiang sandaran ${i + 1}`, post);
        }
        add(`${prefix}palang-dudukan-${i}`, 'z', x, yS - 1, zb + L / 2, zf - zb - L, 'rail-z', `Palang dudukan ${i + 1}`, rail);
      });
      /** Gelagar memanjang dipotong per bentang: tiap potong menempel rata di sisi tiang kiri-kanannya (tidak menembus tiang) */
      const span = (id: string, y: number, z: number, label: string) =>
        xs.slice(1).forEach((x, i) => add(`${id}-${i}`, 'x', xs[i] + L / 2, y, z, x - xs[i] - L, 'rail-x', label, rail));
      span(`${prefix}gelagar-d`, yS - 1, zf, 'Gelagar dudukan depan');
      span(`${prefix}gelagar-b`, yS - 1, zb, 'Gelagar dudukan belakang');
      span(`${prefix}bawah-d`, 8, zf, 'Gelagar bawah depan');
      span(`${prefix}bawah-b`, 8, zb, 'Gelagar bawah belakang');
      const yTopRail = Hb - 1;
      const yMid = (yS + Hb) / 2;
      span(`${prefix}sandaran-atas`, yTopRail, zBack(yTopRail), 'Gelagar sandaran atas');
      span(`${prefix}sandaran-tengah`, yMid, zBack(yMid), 'Gelagar sandaran tengah');

      if (b > 0) boards.push(board(`${prefix}alas`, 'Alas dudukan', 0, W, yS, deckTop, zs, zs + D));
      // Papan sandaran (penutup belakang busa), miring
      const hgt = (Hb - (yS + 4)) / Math.cos((tilt * Math.PI) / 180);
      const ym = (Hb + yS + 4) / 2;
      const zc = zBack(ym) + 1 + 0.9;
      if (b > 0) boards.push({ ...board(`${prefix}papan-sandaran`, 'Papan sandaran', 0, W, ym - hgt / 2, ym + hgt / 2, zc - 0.9, zc + 0.9), rotX: -tilt });
      // Meja bundar menyatu di depan dudukan
      if (nT && withTables) {
        const zc = zs + D + dT * 0.25; // tepi belakang meja sedikit menutupi dudukan
        const tb = Math.max(b, 2.5);
        const yTrail = hT - tb - 1;
        for (let t = 0; t < nT; t++) {
          const xc = (W * (t + 0.5)) / nT;
          const tag = nT > 1 ? ` ${t + 1}` : '';
          if (tableMode === 'tiang') {
            // tiang berdiri di atas rel lantai, berhenti di bawah palang daun meja
            add(`${prefix}meja-tiang-${t}`, 'y', xc, L, zc, yTrail - 1 - L, 'post', `Tiang meja${tag}`, post);
            // rel lantai mulai dari muka depan deret kaki depan booth
            add(`${prefix}meja-rel-${t}`, 'z', xc, L / 2, zf + L / 2, zc - zf - L / 2 + dT * 0.3, 'rail-z', `Rel lantai meja${tag}`, post);
            // kaki silang dipotong dua, dilas di kedua sisi rel
            const kk = dT * 0.3 - L / 2;
            add(`${prefix}meja-kaki-${t}`, 'x', xc - dT * 0.3, L / 2, zc, kk, 'rail-x', `Kaki silang meja${tag}`, post);
            add(`${prefix}meja-kaki-${t}-b`, 'x', xc + L / 2, L / 2, zc, kk, 'rail-x', `Kaki silang meja${tag}`, post);
          } else {
            // lengan L: dari gelagar bawah depan mendatar ke depan, lalu naik ke bawah meja
            const yArm = 8;
            // lengan menempel rata di muka gelagar bawah depan (2 cm), atau di muka kaki depan bila segaris kaki;
            // ujungnya rata sisi luar tiang meja
            const z0 = zf + (xs.some((x) => Math.abs(x - xc) < L) ? L / 2 : 1);
            add(`${prefix}meja-lengan-${t}`, 'z', xc, yArm, z0, zc + L / 2 - z0, 'rail-z', `Lengan meja${tag}`, post);
            add(`${prefix}meja-tiang-${t}`, 'y', xc, yArm + L / 2, zc, yTrail - 1 - yArm - L / 2, 'post', `Tiang meja${tag}`, post);
          }
          add(`${prefix}meja-dudukan-${t}`, 'x', xc - dT * 0.3, yTrail, zc, dT * 0.6, 'rail-x', `Palang bawah meja${tag}`, rail);
          const tbd = board(`${prefix}meja-${t}`, `Daun meja bundar${tag}`, xc - dT / 2, xc + dT / 2, hT - tb, hT, zc - dT / 2, zc + dT / 2);
          tbd.shape = 'round';
          boards.push(tbd);
        }
      }
      if (foam) {
        boards.push({ ...board(`${prefix}busa-dudukan`, 'Busa dudukan', 1, W - 1, deckTop, Hs, zs + 6, zs + D), color: jok });
        const fh = (Hb - 3 - (Hs + 1)) / Math.cos((tilt * Math.PI) / 180);
        const fm = (Hb - 3 + Hs + 1) / 2;
        const fz = zBack(fm) + 1 + 1.8 + 4;
        boards.push({ ...board(`${prefix}busa-sandaran`, 'Busa sandaran', 1, W - 1, fm - fh / 2, fm + fh / 2, fz - 4, fz + 4), rotX: -tilt, color: jok });
      }
      return { list, boards };
    };

    const D0 = zs + D; // depan dudukan
    if (sisi === 'sudut') return buildSudut(side('', W, true), side('s-', Math.max(40, num(p, 'panjangSudut', 120)), false), { W, D0, D1: D0 + ext, Hb, L, foam: foam > 0 });
    if (sisi === 'hadap') {
      const a = side('', W, false);
      const B0 = side('b-', W, false);
      return buildHadap(a, B0, { W, D0, L, Hb, Hs, b, lt: num(p, 'lebarMejaHadap', 70), hT, xEnd: L / 2 });
    }
    const a = side('', W, true);
    const D1 = D0 + ext;
    if (sisi !== 'ganda') return { members: a.list, boards: a.boards, casters: [], W, D: D1, H: Hb, boardThick: 0, wall: true };

    // Ganda: sisi A dicerminkan (menghadap −z), sisi B digeser; sandaran keduanya bertemu di tengah
    const A = a.list.map((m) => ({ ...mirrorZ(m, D1), id: `a-${m.id}` }));
    const Ab = a.boards.map((bd) => mirrorBoard(bd, D1, 'a-'));
    const sB = side('b-', W, true);
    const B = sB.list.map((m) => (m.end ? { ...m, z: m.z + D1, end: { ...m.end, z: m.end.z + D1 } } : { ...m, z: m.z + D1 }));
    const Bb = sB.boards.map((bd) => ({ ...bd, box: { min: [bd.box.min[0], bd.box.min[1], bd.box.min[2] + D1] as [number, number, number], max: [bd.box.max[0], bd.box.max[1], bd.box.max[2] + D1] as [number, number, number] } }));
    return { members: [...A, ...B], boards: [...Ab, ...Bb], casters: [], W, D: 2 * D1, H: Hb, boardThick: 0 };
  },

  checks: (p) => {
    const out: ProductCheck[] = [];
    const sisi = str(p, 'sisi', 'tunggal');
    const nT = !OLD_TABLE.includes(sisi) || str(p, 'mejaBooth', 'none') === 'none' ? 0 : num(p, 'jumlahMejaBooth');
    out.push(...newChecks(p));
    if (nT && sisi === 'sudut' && num(p, 'panjang') / nT / 2 - num(p, 'diameterMejaBooth') / 2 < num(p, 'dalamDudukan') + 10)
      out.push({ level: 'warn', message: 'Meja pertama terlalu dekat ke sayap booth: kaki orang di sayap terhalang.', fix: { label: 'Tanpa meja', params: { mejaBooth: 'none' } } });
    if (sisi === 'sudut' && num(p, 'panjangSudut') > 160 && str(p, 'pipa') === '20')
      out.push({ level: 'warn', message: 'Sayap panjang dengan pipa 20×20 terasa goyang.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
    if (SQUARE_TABLE.includes(sisi)) {
      const g = num(p, 'tinggiMejaBooth') - num(p, 'tinggiDudukan');
      if (g < 22 || g > 32) out.push({ level: 'warn', message: `Selisih meja ke dudukan ${g} cm. Yang nyaman 25–30 cm.`, fix: { label: 'Meja 72 cm', params: { tinggiMejaBooth: 72, tinggiDudukan: 46 } } });
    }
    if (sisi === 'hadap') {
      if (num(p, 'panjang') > 180) out.push({ level: 'warn', message: 'Meja tengah lebih dari 180 cm hanya ditopang di kedua ujung: rawan melendut.', fix: { label: 'Panjang 180 cm', params: { panjang: 180 } } });
    }
    if (nT && num(p, 'panjang') / nT < num(p, 'diameterMejaBooth') + 15)
      out.push({ level: 'warn', message: 'Meja terlalu rapat: daun meja saling bersentuhan.', fix: { label: 'Kurangi 1 meja', params: { jumlahMejaBooth: Math.max(1, nT - 1) } } });
    if (nT && str(p, 'mejaBooth') === 'lengan' && num(p, 'diameterMejaBooth') > 60)
      out.push({ level: 'warn', message: 'Meja lengan selebar ini mudah melendut; pakai tiang tegak atau diameter ≤ 60 cm.', fix: { label: 'Diameter 55 cm', params: { diameterMejaBooth: 55 } } });
    if (num(p, 'panjang') > 160 && str(p, 'pipa') === '20') out.push({ level: 'warn', message: 'Booth panjang dengan pipa 20×20 terasa goyang saat diduduki banyak orang.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
    out.push({ level: 'info', message: `Muat ±${Math.max(1, Math.floor(num(p, 'panjang') / 60))} orang per sisi. Meja di depan booth: tinggi 75 cm, tepi meja menutupi dudukan ±5 cm.` });
    if (sisi === 'hadap') out.push({ level: 'info', message: 'Rel lantai menyambung kaki depan kedua booth dan kaki meja, jadi satu set tidak bergeser. Rel setinggi pipa, aman dilangkahi.' });
    if (sisi === 'ganda') out.push({ level: 'info', message: 'Jarak antar booth berhadapan (dengan meja 70 cm di tengah) sekitar 170–190 cm.' });
    out.push({ level: 'info', message: 'Busa & kain jok dikerjakan tukang jok; rangka besi sebaiknya galvanis / cat dasar anti karat.' });
    return out;
  },
};

type Side = { list: FrameMember[]; boards: Board[] };
type V3 = [number, number, number];

/** Cermin terhadap bidang z = total/2 (sisi booth berbalik arah) */
const mirrorZ = (m: FrameMember, total: number): FrameMember => {
  if (m.end) return { ...m, z: total - m.z, end: { ...m.end, z: total - m.end.z } };
  if (m.axis === 'z') return { ...m, z: total - m.z - m.length };
  return { ...m, z: total - m.z };
};
const mirrorBoard = (bd: Board, total: number, prefix: string): Board => ({
  ...bd,
  id: `${prefix}${bd.id}`,
  rotX: bd.rotX ? -bd.rotX : undefined,
  box: { min: [bd.box.min[0], bd.box.min[1], total - bd.box.max[2]] as V3, max: [bd.box.max[0], bd.box.max[1], total - bd.box.min[2]] as V3 },
});
/** Tukar sumbu x ↔ z (sisi booth menghadap +x, sandaran di tembok kiri), lalu geser dz ke depan */
const swapXZ = (m: FrameMember, dz: number): FrameMember => {
  const axis = m.axis === 'x' ? 'z' : m.axis === 'z' ? 'x' : m.axis;
  const out: FrameMember = { ...m, axis, x: m.z, z: m.x + dz };
  if (m.end) out.end = { x: m.end.z, y: m.end.y, z: m.end.x + dz };
  return out;
};

/** Booth sudut L: booth utama di tembok belakang + sayap di tembok kiri, mulai dari depan dudukan utama */
function buildSudut(main: Side, wing: Side, d: { W: number; D0: number; D1: number; Hb: number; L: number; foam: boolean }): ProductBuild {
  const { W, D0, D1, Hb, L } = d;
  let Ws = 0;
  const wm: FrameMember[] = [];
  wing.list.forEach((m) => {
    const s = swapXZ(m, D0);
    if (m.axis === 'x') Ws = Math.max(Ws, m.x + m.length + L); // potong gelagar terakhir berhenti di sisi dalam tiang ujung
    wm.push({ ...s, label: `${m.label} (sayap)` });
    // sandaran sayap disambung sampai sisi tiang sandaran utama: potongan penyambung dari muka tiang utama
    // (z = L) sampai muka tiang sandaran sayap pertama (z = D0)
    if (m.id === 's-sandaran-atas-0' || m.id === 's-sandaran-tengah-0')
      wm.push({ ...s, id: `${m.id}-sambung`, z: L, length: D0 - L, label: `${m.label} (sayap)` });
  });
  const wb = wing.boards.map((bd): Board => {
    const min: V3 = [bd.box.min[2], bd.box.min[1], bd.box.min[0] + D0];
    const max: V3 = [bd.box.max[2], bd.box.max[1], bd.box.max[0] + D0];
    if (bd.id === 's-papan-sandaran') min[2] = L / 2 + 2.8; // menempel muka papan sandaran utama
    if (bd.id === 's-busa-sandaran') min[2] = L / 2 + 10.8; // menempel muka busa sandaran utama
    return { ...bd, rotX: undefined, box: { min, max } };
  });
  return { members: [...main.list, ...wm], boards: [...main.boards, ...wb], casters: [], W, D: Math.max(D1, D0 + Ws), H: Hb, boardThick: 0, wall: true };
}

/** Dua booth berhadapan + meja persegi di tengah; kaki meja di rel lantai yang menyambung kaki depan kedua booth */
function buildHadap(a: Side, b0: Side, d: { W: number; D0: number; L: number; Hb: number; Hs: number; b: number; lt: number; hT: number; xEnd: number }): ProductBuild {
  const { W, D0, L, Hb, b, lt, hT } = d;
  const zT0 = D0 - 5; // tepi meja menutupi dudukan ±5 cm
  const zT1 = zT0 + lt;
  const Dt = zT1 - 5 + D0;
  const B = b0.list.map((m) => mirrorZ(m, Dt));
  const Bb = b0.boards.map((bd) => mirrorBoard(bd, Dt, ''));
  const { list, add } = memberFactory();
  const post: [number, number] = [L * 10, L * 10];
  const rail: [number, number] = [20, 40];
  const yR = hT - b - 2; // as palang bawah daun meja
  const zf = D0 - L / 2; // as kaki depan booth
  const zc = (zT0 + zT1) / 2;
  [L / 2, W - L / 2].forEach((x, i) => {
    const n = i ? 'kanan' : 'kiri';
    add(`meja-rel-${n}`, 'z', x, L / 2, zf + L / 2, Dt - 2 * zf - L, 'rail-z', `Rel lantai meja ${n}`, post);
    add(`meja-kaki-${n}`, 'y', x, L, zc, yR - 2 - L, 'post', `Kaki meja ${n}`, post);
    add(`meja-palang-${n}`, 'z', x, yR, zT0 + 3, lt - 6, 'rail-z', `Palang ujung meja ${n}`, rail);
  });
  add('meja-gelagar-b', 'x', L / 2 + 1, yR, zT0 + 4, W - L - 2, 'rail-x', 'Gelagar meja belakang', rail);
  add('meja-gelagar-d', 'x', L / 2 + 1, yR, zT1 - 4, W - L - 2, 'rail-x', 'Gelagar meja depan', rail);
  const boards = [...a.boards, ...Bb];
  if (b > 0) boards.push(board('meja-tengah', 'Daun meja tengah', 0, W, hT - b, hT, zT0, zT1));
  return { members: [...a.list, ...B, ...list], boards, casters: [], W, D: Dt, H: Hb, boardThick: 0 };
}

// =====================================================================================================
// Bentuk booth baru (sandaran tegak). Koordinat cm: x = panjang, y = atas, z = kedalaman (tembok di z = 0).
// =====================================================================================================

type Tube = [number, number];

/** Nilai bersama semua bentuk baru */
type Ctx = {
  W: number; // panjang booth
  D: number; // kedalaman dudukan
  Hs: number; // tinggi dudukan dengan busa
  Hb: number; // tinggi sandaran (dari lantai / lantai panggung)
  L: number; // tebal pipa rangka (cm)
  b: number; // tebal papan (0 = tanpa papan)
  foam: number; // tebal busa
  jok: string;
  deckTop: number; // permukaan atas papan alas dudukan
  yS: number; // ujung atas rangka dudukan (bidang bawah papan alas)
  post: Tube;
  rail: Tube;
  lt: number; // lebar meja tengah
  hT: number; // tinggi meja
  tb: number; // tebal daun meja
};

function ctxOf(p: Params): Ctx {
  const L = (parseInt(str(p, 'pipa', '30')) || 30) / 10;
  const b = BOARD_THICK[str(p, 'papan', 'multiplek')] ?? 1.8;
  const foam = bool(p, 'busa') ? 10 : 0;
  const Hs = num(p, 'tinggiDudukan', 46);
  const deckTop = Hs - foam;
  const yS = deckTop - b;
  return {
    W: num(p, 'panjang', 120),
    D: num(p, 'dalamDudukan', 48),
    Hs,
    Hb: Math.max(Hs + 30, num(p, 'tinggiSandaran', 100)),
    L,
    b,
    foam,
    jok: str(p, 'warnaJok', '#3f4a3c'),
    deckTop,
    yS,
    post: [L * 10, L * 10],
    rail: [20, 20],
    lt: num(p, 'lebarMejaHadap', 70),
    hT: Math.max(Hs + 10, num(p, 'tinggiMejaBooth', 72)),
    tb: Math.max(b, 2.5),
  };
}

/** Alat bantu satu rakitan: daftar batang + papan, posisi tiang, gelagar per bentang */
function kit(c: Ctx) {
  const { list, add, line } = memberFactory();
  const boards: Board[] = [];
  /** Posisi as tiang sepanjang x: ujung rata x0 dan x0 + len, tiap bentang ≤ ±80 cm */
  const supports = (x0: number, len: number) => {
    const n = Math.max(2, Math.ceil(len / 80) + 1);
    return Array.from({ length: n }, (_, i) => x0 + c.L / 2 + ((len - c.L) * i) / (n - 1));
  };
  /** Gelagar memanjang dipotong per bentang: tiap potong menempel rata di sisi tiang kiri-kanannya */
  const span = (id: string, xs: number[], y: number, z: number, label: string, tube: Tube = c.rail) =>
    xs.slice(1).forEach((x, i) => add(`${id}-${i}`, 'x', xs[i] + c.L / 2, y, z, x - xs[i] - c.L, 'rail-x', label, tube));
  return { list, add, line, boards, supports, span };
}
type Kit = ReturnType<typeof kit>;

/** Papan alas dudukan, papan sandaran tegak (menempel muka depan tiang sandaran), busa dudukan & sandaran */
function upholster(c: Ctx, boards: Board[], id: string, x0: number, x1: number, zBack: number, zFront: number, y0 = 0, deck = true) {
  if (c.b > 0 && deck) boards.push(board(`${id}alas`, 'Alas dudukan', x0, x1, y0 + c.yS, y0 + c.deckTop, zBack, zFront));
  if (c.b > 0) boards.push(board(`${id}papan-sandaran`, 'Papan sandaran', x0, x1, y0 + c.deckTop, y0 + c.Hb, zBack, zBack + 1.8));
  if (c.foam) {
    boards.push({ ...board(`${id}busa-dudukan`, 'Busa dudukan', x0 + 1, x1 - 1, y0 + c.deckTop, y0 + c.Hs, zBack + 1.8, zFront), color: c.jok });
    boards.push({ ...board(`${id}busa-sandaran`, 'Busa sandaran', x0 + 1, x1 - 1, y0 + c.Hs, y0 + c.Hb - 3, zBack + 1.8, zBack + 9.8), color: c.jok });
  }
}

/** Tiang sandaran di z = zb + gelagar sandaran atas & tengah. tops: tinggi ujung tiang per posisi (default Hb) */
function backrest(c: Ctx, k: Kit, pre: string, xs: number[], zb: number, yBase: number, y0 = 0, tops?: (i: number) => number) {
  xs.forEach((x, i) => {
    const top = tops ? tops(i) : y0 + c.Hb;
    k.add(`${pre}tiang-b-${i}`, 'y', x, yBase, zb, top - yBase, 'post', `Tiang sandaran ${i + 1}`, c.post);
  });
  k.span(`${pre}sandaran-atas`, xs, y0 + c.Hb - 1, zb, 'Gelagar sandaran atas');
  k.span(`${pre}sandaran-tengah`, xs, y0 + (c.yS + c.Hb) / 2, zb, 'Gelagar sandaran tengah');
}

/** Rangka dudukan di antara kaki depan (zf) & tiang sandaran (zb): palang melintang + gelagar depan & belakang */
function seatFrame(c: Ctx, k: Kit, pre: string, xs: number[], zb: number, zf: number, y0 = 0) {
  const y = y0 + c.yS - 1;
  xs.forEach((x, i) => k.add(`${pre}palang-dudukan-${i}`, 'z', x, y, zb + c.L / 2, zf - zb - c.L, 'rail-z', `Palang dudukan ${i + 1}`, c.rail));
  k.span(`${pre}gelagar-d`, xs, y, zf, 'Gelagar dudukan depan');
  k.span(`${pre}gelagar-b`, xs, y, zb, 'Gelagar dudukan belakang');
}

/**
 * Booth berkaki biasa menghadap +z (kaki depan + tiang sandaran sampai lantai, gelagar bawah), dipakai kabin & panggung.
 * y0 = tinggi lantai tempat berdiri; tops = tinggi ujung tiang sandaran per posisi.
 */
function legBench(c: Ctx, k: Kit, pre: string, x0: number, len: number, y0 = 0, tops?: (i: number, n: number) => number) {
  const xs = k.supports(x0, len);
  const zb = c.L / 2;
  const zf = c.D - c.L / 2;
  xs.forEach((x, i) => k.add(`${pre}kaki-d-${i}`, 'y', x, y0, zf, c.yS, 'post', `Kaki depan ${i + 1}`, c.post));
  backrest(c, k, pre, xs, zb, y0, y0, tops ? (i) => tops(i, xs.length) : undefined);
  seatFrame(c, k, pre, xs, zb, zf, y0);
  k.span(`${pre}bawah-d`, xs, y0 + 8, zf, 'Gelagar bawah depan');
  k.span(`${pre}bawah-b`, xs, y0 + 8, zb, 'Gelagar bawah belakang');
  return { xs, zb, zf };
}

/** Meja persegi bertiang tunggal di plat bundar: laba-laba silang di bawah daun (kiri–kanan menerus, depan–belakang dipotong dua) */
function pedestalTable(c: Ctx, k: Kit, id: string, label: string, xc: number, zc: number, wx: number, wz: number, y0 = 0) {
  const col: Tube = [50, 50];
  const yR = y0 + c.hT - c.tb - 1; // as palang 20×20 di bawah daun
  const s = Math.min(wx, wz) / 2 - 6;
  const R = Math.max(22, Math.min(wx, wz) * 0.32);
  k.add(`${id}-tiang`, 'y', xc, y0 + 0.8, zc, yR - 1 - y0 - 0.8, 'post', `Tiang ${label}`, col);
  k.add(`${id}-palang-x`, 'x', xc - s, yR, zc, 2 * s, 'rail-x', `Palang ${label} kiri–kanan`, c.rail);
  k.add(`${id}-palang-z1`, 'z', xc, yR, zc - s, s - 1, 'rail-z', `Palang ${label} belakang`, c.rail);
  k.add(`${id}-palang-z2`, 'z', xc, yR, zc + 1, s - 1, 'rail-z', `Palang ${label} depan`, c.rail);
  k.boards.push({ ...board(`${id}-plat`, `Plat dasar ${label}`, xc - R, xc + R, y0, y0 + 0.8, zc - R, zc + R), shape: 'round', steelMm: 8 });
  if (c.b > 0) k.boards.push(board(`${id}-daun`, `Daun ${label}`, xc - wx / 2, xc + wx / 2, y0 + c.hT - c.tb, y0 + c.hT, zc - wz / 2, zc + wz / 2));
}

/** Pindahkan rakitan dengan fungsi titik T (hanya tukar / cermin / geser sumbu) */
function place(members: FrameMember[], boards: Board[], T: (v: V3) => V3, pre: string): Side {
  const AXI = { x: 0, y: 1, z: 2 } as const;
  const list = members.map((m) => {
    const s: V3 = [m.x, m.y, m.z];
    const e: V3 = m.end ? [m.end.x, m.end.y, m.end.z] : (s.map((v, i) => (i === AXI[m.axis] ? v + m.length : v)) as V3);
    return memberFromPoints({ id: `${pre}${m.id}`, role: m.role, label: m.label, tubeSize: m.tubeSize, tubeH: m.tubeH }, T(s), T(e));
  });
  const bds = boards.map((bd): Board => {
    const a = T(bd.box.min as V3);
    const z = T(bd.box.max as V3);
    return { ...bd, id: `${pre}${bd.id}`, box: { min: [0, 1, 2].map((i) => Math.min(a[i], z[i])) as V3, max: [0, 1, 2].map((i) => Math.max(a[i], z[i])) as V3 } };
  });
  return { list, boards: bds };
}

const done = (k: Kit, W: number, D: number, H: number): ProductBuild => ({ members: k.list, boards: k.boards, casters: [], W, D, H, boardThick: 0, wall: true });

/** Panel samping: ujung kiri & kanan bingkai kotak dari lantai (tiang depan naik setinggi panel) ditutup papan di sisi luar */
function buildPanel(c: Ctx, p: Params): ProductBuild {
  const k = kit(c);
  const t = 1.8; // papan panel
  const Hp = Math.max(c.yS + 15, num(p, 'tinggiPanel', 100));
  const xs = k.supports(t, c.W - 2 * t);
  const zb = c.L / 2;
  const zf = c.D - c.L / 2;
  const end = (i: number) => i === 0 || i === xs.length - 1;
  xs.forEach((x, i) => k.add(`kaki-d-${i}`, 'y', x, 0, zf, end(i) ? Hp : c.yS, 'post', end(i) ? `Tiang panel depan ${i ? 'kanan' : 'kiri'}` : `Kaki depan ${i + 1}`, c.post));
  backrest(c, k, '', xs, zb, 0, 0, (i) => (end(i) ? Math.max(c.Hb, Hp) : c.Hb));
  seatFrame(c, k, '', xs, zb, zf);
  k.span('bawah-d', xs, 8, zf, 'Gelagar bawah depan');
  k.span('bawah-b', xs, 8, zb, 'Gelagar bawah belakang');
  [xs[0], xs[xs.length - 1]].forEach((x, i) => {
    const nm = i ? 'kanan' : 'kiri';
    k.add(`panel-atas-${nm}`, 'z', x, Hp - 1, zb + c.L / 2, zf - zb - c.L, 'rail-z', `Palang atas panel ${nm}`, c.rail);
    k.add(`panel-bawah-${nm}`, 'z', x, 8, zb + c.L / 2, zf - zb - c.L, 'rail-z', `Palang bawah panel ${nm}`, c.rail);
    k.boards.push(board(`panel-${nm}`, `Papan panel ${nm}`, i ? c.W - t : 0, i ? c.W : t, 0, Hp, 0, c.D));
  });
  upholster(c, k.boards, '', t, c.W - t, zb + c.L / 2, c.D);
  return done(k, c.W, c.D, Math.max(c.Hb, Hp));
}

/** Kaki seluncur: tiap pasang kaki depan + tiang sandaran berdiri di rel lantai depan-belakang */
function buildSled(c: Ctx): ProductBuild {
  const k = kit(c);
  const xs = k.supports(0, c.W);
  const zb = c.L / 2;
  const zf = c.D - c.L / 2;
  xs.forEach((x, i) => {
    k.add(`rel-${i}`, 'z', x, c.L / 2, 0, c.D, 'rail-z', `Rel lantai ${i + 1}`, c.post);
    k.add(`kaki-d-${i}`, 'y', x, c.L, zf, c.yS - c.L, 'post', `Kaki depan ${i + 1}`, c.post);
  });
  backrest(c, k, '', xs, zb, c.L);
  seatFrame(c, k, '', xs, zb, zf);
  upholster(c, k.boards, '', 0, c.W, zb + c.L / 2, c.D);
  return done(k, c.W, c.D, c.Hb);
}

/** Kaki C menjulur: tiap rangka C = tapak lantai + tiang belakang + lengan dudukan, tanpa kaki depan */
function buildKantilever(c: Ctx): ProductBuild {
  const k = kit(c);
  const xs = k.supports(0, c.W);
  const zb = c.L / 2;
  xs.forEach((x, i) => {
    k.add(`tapak-${i}`, 'z', x, c.L / 2, 0, c.D, 'rail-z', `Tapak lantai C ${i + 1}`, c.post);
    k.add(`lengan-${i}`, 'z', x, c.yS - c.L / 2, zb + c.L / 2, c.D - zb - c.L / 2, 'rail-z', `Lengan dudukan C ${i + 1}`, c.post);
  });
  backrest(c, k, '', xs, zb, c.L);
  k.span('gelagar-d', xs, c.yS - 1, c.D - 1, 'Gelagar dudukan depan');
  k.span('gelagar-b', xs, c.yS - 1, zb, 'Gelagar dudukan belakang');
  upholster(c, k.boards, '', 0, c.W, zb + c.L / 2, c.D);
  return done(k, c.W, c.D, c.Hb);
}

/** Melayang di tembok: tiang dibaut ke tembok, lengan dudukan ditopang siku miring, tanpa kaki lantai */
function buildDinding(c: Ctx): ProductBuild {
  const k = kit(c);
  const xs = k.supports(0, c.W);
  const zb = c.L / 2; // tiang menempel tembok
  const yP = Math.max(8, c.yS - 34); // ujung bawah tiang
  const t = 2; // siku 20×20
  const zTop = c.D - 6; // ujung atas siku di bawah lengan
  const dz = zTop - c.L;
  // ujung atas siku dipotong tegak; tepi atas potongan harus tetap di bawah lengan
  let yTop = c.yS - c.L - 1.2;
  let yLow = yTop;
  for (let it = 0; it < 5; it++) {
    yLow = Math.max(yP + 4, yTop - 0.33 * dz); // landai (< 0,35) supaya ujung dipotong tegak, rata muka tiang
    const cos = dz / Math.hypot(dz, yTop - yLow);
    yTop = c.yS - c.L - t / 2 / cos - 0.3;
  }
  xs.forEach((x, i) => {
    k.add(`lengan-${i}`, 'z', x, c.yS - c.L / 2, c.L, c.D - c.L, 'rail-z', `Lengan dudukan ${i + 1}`, c.post);
    // siku miring: ujung bawah menempel rata muka depan tiang (z = L), ujung atas di bawah lengan
    k.line(`siku-${i}`, [x, yLow, c.L], [x, yTop, zTop], 'custom', `Siku miring ${i + 1}`, c.rail);
  });
  backrest(c, k, '', xs, zb, yP);
  k.span('gelagar-d', xs, c.yS - 1, c.D - 1, 'Gelagar dudukan depan');
  k.span('gelagar-b', xs, c.yS - 1, zb, 'Gelagar dudukan belakang');
  k.span('rel-tembok', xs, yP + 2, zb, 'Gelagar bawah (dibaut ke tembok)');
  upholster(c, k.boards, '', 0, c.W, zb + c.L / 2, c.D);
  return done(k, c.W, c.D, c.Hb);
}

/** Kotak simpan: kolong = kotak rangka tertutup papan, tutup dudukan per ruang (engsel piano di belakang) */
function buildKotak(c: Ctx): ProductBuild {
  const k = kit(c);
  const t = 1.2; // papan penutup kotak
  const xs = k.supports(t, c.W - 2 * t);
  const zb = c.L / 2;
  const zf = c.D - c.L / 2;
  xs.forEach((x, i) => {
    k.add(`kaki-d-${i}`, 'y', x, 0, zf, c.yS, 'post', `Tiang depan ${i + 1}`, c.post);
    k.add(`palang-lantai-${i}`, 'z', x, 1, zb + c.L / 2, zf - zb - c.L, 'rail-z', `Palang lantai ${i + 1}`, c.rail);
  });
  backrest(c, k, '', xs, zb, 0);
  seatFrame(c, k, '', xs, zb, zf);
  k.span('lantai-d', xs, 1, zf, 'Gelagar lantai depan');
  k.span('lantai-b', xs, 1, zb, 'Gelagar lantai belakang');
  if (c.b > 0) {
    k.boards.push(board('kotak-depan', 'Papan muka kotak', 0, c.W, 0, c.yS, c.D, c.D + t));
    k.boards.push(board('kotak-kiri', 'Papan samping kotak kiri', 0, t, 0, c.yS, 0, c.D));
    k.boards.push(board('kotak-kanan', 'Papan samping kotak kanan', c.W - t, c.W, 0, c.yS, 0, c.D));
    k.boards.push(board('kotak-dasar', 'Papan dasar kotak', t, c.W - t, 2, 3.2, zb + c.L / 2, zf - c.L / 2));
    // tutup dudukan per ruang, celah 0,4 cm
    xs.slice(1).forEach((x, i) => {
      const a = (i === 0 ? xs[0] - c.L / 2 : xs[i]) + 0.2;
      const z = (i === xs.length - 2 ? x + c.L / 2 : x) - 0.2;
      k.boards.push(board(`tutup-${i}`, `Tutup dudukan ruang ${i + 1} (engsel)`, a, z, c.yS, c.deckTop, zb + c.L / 2, c.D));
    });
  }
  upholster(c, k.boards, '', t, c.W - t, zb + c.L / 2, c.D, 0, false);
  return done(k, c.W, c.D + t, c.Hb);
}

/** Kaki V ramping: rangka dudukan kotak di atas pasangan kaki V (bertemu di lantai), tanpa palang bawah */
function buildKakiV(c: Ctx): ProductBuild {
  const k = kit(c);
  const xs = k.supports(0, c.W);
  const zb = c.L / 2;
  const zf = c.D - c.L / 2;
  const yF = c.yS - c.L / 2; // as rangka dudukan (pipa rangka)
  k.add('rangka-d', 'x', 0, yF, zf, c.W, 'rail-x', 'Rangka dudukan depan', c.post);
  k.add('rangka-b', 'x', 0, yF, zb, c.W, 'rail-x', 'Rangka dudukan belakang', c.post);
  xs.forEach((x, i) => k.add(`palang-dudukan-${i}`, 'z', x, c.yS - 1, zb + c.L / 2, zf - zb - c.L, 'rail-z', `Palang dudukan ${i + 1}`, c.rail));
  backrest(c, k, '', xs, zb, c.yS);
  // kaki V: dua kaki dari lantai (berdekatan di tengah) ke bawah rangka depan & belakang
  const zc = c.D / 2;
  const top = c.yS - c.L;
  const cos = top / Math.hypot(top, zf - zc);
  const g = c.L / 2 / cos + 0.4;
  xs.forEach((x, i) => {
    k.line(`kaki-v-b-${i}`, [x, 0, zc - g], [x, top, zb], 'post', `Kaki V belakang ${i + 1}`, c.post);
    k.line(`kaki-v-d-${i}`, [x, 0, zc + g], [x, top, zf], 'post', `Kaki V depan ${i + 1}`, c.post);
  });
  upholster(c, k.boards, '', 0, c.W, zb + c.L / 2, c.D);
  return done(k, c.W, c.D, c.Hb);
}

/**
 * Satu sisi booth beralas kotak yang masuk ke dalam (menghadap +z, panjang len): tiang sandaran sampai lantai,
 * dudukan menjorok tanpa kaki depan, kaki alas tersembunyi 8 cm di belakang tepi dudukan + papan penutup alas.
 */
function boxBench(c: Ctx, pre: string, len: number): Side {
  const k = kit(c);
  const xs = k.supports(0, len);
  const zb = c.L / 2;
  const r = 8; // alas masuk ke dalam
  const za = c.D - r - c.L / 2; // as kaki alas
  backrest(c, k, pre, xs, zb, 0);
  k.add(`${pre}gelagar-d`, 'x', 0, c.yS - 1, c.D - 1, len, 'rail-x', 'Gelagar dudukan depan', c.rail);
  k.span(`${pre}gelagar-b`, xs, c.yS - 1, zb, 'Gelagar dudukan belakang');
  xs.forEach((x, i) => {
    k.add(`${pre}palang-dudukan-${i}`, 'z', x, c.yS - 1, zb + c.L / 2, c.D - 2 - zb - c.L / 2, 'rail-z', `Palang dudukan ${i + 1}`, c.rail);
    k.add(`${pre}kaki-alas-${i}`, 'y', x, 0, za, c.yS - 2, 'post', `Kaki alas ${i + 1}`, c.post);
    k.add(`${pre}palang-alas-${i}`, 'z', x, 1, zb + c.L / 2, za - zb - c.L, 'rail-z', `Palang alas ${i + 1}`, c.rail);
  });
  k.span(`${pre}alas-d`, xs, 1, za, 'Gelagar alas depan');
  k.span(`${pre}alas-b`, xs, 1, zb, 'Gelagar alas belakang');
  if (c.b > 0) k.boards.push(board(`${pre}penutup-alas`, 'Papan penutup alas', 0, len, 0, c.yS - 2, za + c.L / 2, za + c.L / 2 + 1.2));
  upholster(c, k.boards, pre, 0, len, zb + c.L / 2, c.D);
  return { list: k.list, boards: k.boards };
}

/** U tiga sisi: booth belakang + sayap kiri & kanan (beralas kotak), meja tengah bertiang di plat bundar */
function buildU(c: Ctx, p: Params): ProductBuild {
  const Ls = Math.max(60, num(p, 'panjangSudut', 110));
  const W = Math.max(c.W, 2 * c.D + 40);
  const main = boxBench(c, 'b-', W);
  const lw = boxBench(c, '', Ls);
  const left = place(lw.list, lw.boards, ([x, y, z]) => [z, y, c.D + x], 'kiri-');
  const right = place(lw.list, lw.boards, ([x, y, z]) => [W - z, y, c.D + x], 'kanan-');
  const k = kit(c);
  const wx = Math.min(W - 2 * c.D - 10, c.lt * 1.4);
  pedestalTable(c, k, 'meja', 'meja tengah', W / 2, c.D - 5 + c.lt / 2, Math.max(50, wx), c.lt);
  return {
    members: [...main.list, ...left.list, ...right.list, ...k.list],
    boards: [...main.boards, ...left.boards, ...right.boards, ...k.boards],
    casters: [],
    W,
    D: c.D + Ls,
    H: c.Hb,
    boardThick: 0,
    wall: true,
  };
}

/** Di atas panggung: lantai panggung berangka kaki pendek, booth + meja bertiang berdiri di atasnya */
function buildPanggung(c: Ctx, p: Params): ProductBuild {
  const k = kit(c);
  const Hp = num(p, 'tinggiPanggung', 18);
  const bp = Math.max(c.b, 1.8); // papan lantai panggung
  const Dp = c.D + c.lt + 45; // booth + meja + ruang kursi lepas
  const yF = Hp - bp; // atas rangka panggung
  const yR = yF - c.L / 2;
  const xsP = k.supports(0, c.W);
  k.add('panggung-belakang', 'x', 0, yR, c.L / 2, c.W, 'rail-x', 'Rangka panggung belakang', c.post);
  k.add('panggung-depan', 'x', 0, yR, Dp - c.L / 2, c.W, 'rail-x', 'Rangka panggung depan', c.post);
  const legZ = [c.L / 2, Dp - c.L / 2, ...(Dp > 120 ? [Dp / 2] : [])];
  xsP.forEach((x, i) => {
    k.add(`panggung-balok-${i}`, 'z', x, yR, c.L, Dp - 2 * c.L, 'rail-z', `Balok panggung ${i + 1}`, c.post);
    legZ.forEach((z, j) => k.add(`panggung-kaki-${i}-${j}`, 'y', x, 0, z, yF - c.L, 'post', `Kaki panggung ${i + 1}.${j + 1}`, c.post));
  });
  k.boards.push(board('lantai-panggung', 'Papan lantai panggung', 0, c.W, yF, Hp, 0, Dp));
  // booth berdiri di lantai panggung
  legBench(c, k, '', 0, c.W, Hp);
  upholster(c, k.boards, '', 0, c.W, c.L, c.D, Hp);
  const n = c.W >= 230 ? 2 : 1;
  for (let t = 0; t < n; t++)
    pedestalTable(c, k, `meja-${t}`, n > 1 ? `meja ${t + 1}` : 'meja', (c.W * (t + 0.5)) / n, c.D - 5 + c.lt / 2, Math.min(c.lt + 10, c.W / n - 10), c.lt, Hp);
  return done(k, c.W, Dp, Hp + c.Hb);
}

/** Kabin beratap: dua booth berhadapan, 4 tiang sudut menerus ke rangka atap, meja di palang samping */
function buildKabin(c: Ctx, p: Params): ProductBuild {
  const Ha = Math.max(c.Hb + 60, num(p, 'tinggiAtap', 220));
  const k = kit(c);
  const corner = (i: number, n: number) => i === 0 || i === n - 1;
  const A = legBench(c, k, '', 0, c.W, 0, (i, n) => (corner(i, n) ? Ha : c.Hb));
  const Dt = 2 * c.D + c.lt - 10;
  // papan & busa sisi A (di antara palang samping), sisi B = cermin sisi A
  upholster(c, k.boards, '', c.L, c.W - c.L, A.zb + c.L / 2, c.D);
  const B = place(k.list, k.boards, ([x, y, z]) => [x, y, Dt - z], 'b-');
  const zbB = Dt - A.zb;
  const m = kit(c);
  const yR = c.hT - c.tb - c.L / 2; // as palang samping (menumpu meja)
  const zT0 = c.D - 5;
  const zT1 = zT0 + c.lt;
  const inner = zbB - A.zb - c.L;
  [c.L / 2, c.W - c.L / 2].forEach((x, i) => {
    const nm = i ? 'kanan' : 'kiri';
    m.add(`palang-samping-${nm}`, 'z', x, yR, A.zb + c.L / 2, inner, 'rail-z', `Palang samping ${nm} (tumpuan meja)`, c.post);
    m.add(`atap-${nm}`, 'z', x, Ha - c.L / 2, A.zb + c.L / 2, inner, 'rail-z', `Rangka atap ${nm}`, c.post);
  });
  [zT0 + 4, zT1 - 4].forEach((z, i) => m.add(`gelagar-meja-${i}`, 'x', c.L, c.hT - c.tb - 1, z, c.W - 2 * c.L, 'rail-x', `Gelagar meja ${i ? 'depan' : 'belakang'}`, c.rail));
  [A.zb, zbB].forEach((z, i) => m.add(`atap-${i ? 'depan' : 'belakang'}`, 'x', c.L, Ha - c.L / 2, z, c.W - 2 * c.L, 'rail-x', `Rangka atap ${i ? 'depan' : 'belakang'}`, c.post));
  const nP = Math.max(0, Math.ceil(c.W / 70) - 1);
  for (let i = 1; i <= nP; i++) m.add(`atap-reng-${i}`, 'z', (c.W * i) / (nP + 1), Ha - c.L / 2, A.zb + c.L / 2, inner, 'rail-z', `Reng atap ${i}`, c.rail);
  if (c.b > 0) {
    m.boards.push(board('meja-tengah', 'Daun meja tengah', 0, c.W, c.hT - c.tb, c.hT, zT0, zT1));
    m.boards.push(board('atap', 'Papan atap', 0, c.W, Ha, Ha + 1.2, 0, Dt));
  }
  return { members: [...k.list, ...B.list, ...m.list], boards: [...k.boards, ...B.boards, ...m.boards], casters: [], W: c.W, D: Dt, H: Ha + 1.2, boardThick: 0 };
}

/** Sofa ayun plafon: rangka dudukan bersandaran tanpa kaki, digantung dua pasang batang V ke kait plafon */
function buildAyun(c: Ctx, p: Params): ProductBuild {
  const k = kit(c);
  const Hc = Math.max(c.Hb + 60, num(p, 'tinggiPlafon', 280));
  const ox = 2; // ruang batang gantung di luar ujung rangka
  const xs = k.supports(ox, c.W);
  const zb = c.L / 2;
  const zf = c.D - c.L / 2;
  const zc = c.D / 2;
  k.add('rangka-d', 'x', ox, c.yS - c.L / 2, zf, c.W, 'rail-x', 'Rangka dudukan depan', c.post);
  k.add('rangka-b', 'x', ox, c.yS - c.L / 2, zb, c.W, 'rail-x', 'Rangka dudukan belakang', c.post);
  xs.forEach((x, i) => k.add(`palang-dudukan-${i}`, 'z', x, c.yS - 1, zb + c.L / 2, zf - zb - c.L, 'rail-z', `Palang dudukan ${i + 1}`, c.rail));
  backrest(c, k, '', xs, zb, c.yS);
  const yBar = Hc - 15;
  [ox - 1, ox + c.W + 1].forEach((x, i) => {
    const nm = i ? 'kanan' : 'kiri';
    k.add(`gantung-palang-${nm}`, 'z', x, yBar, zc - 6, 12, 'rail-z', `Palang kait ${nm}`, c.rail);
    k.add(`gantung-kait-${nm}`, 'y', x, yBar + 1, zc, Hc - yBar - 1, 'custom', `Batang ke kait plafon ${nm}`, c.rail);
    k.line(`gantung-v-b-${nm}`, [x, c.yS - c.L, zb], [x, yBar - 1, zc - 4], 'custom', `Batang gantung V ${nm} belakang`, c.rail);
    k.line(`gantung-v-d-${nm}`, [x, c.yS - c.L, zf], [x, yBar - 1, zc + 4], 'custom', `Batang gantung V ${nm} depan`, c.rail);
    k.boards.push({ ...board(`kait-${nm}`, `Plat kait plafon ${nm}`, x - 5, x + 5, Hc, Hc + 0.5, zc - 5, zc + 5), steelMm: 5 });
  });
  upholster(c, k.boards, '', ox, ox + c.W, zb + c.L / 2, c.D);
  return { members: k.list, boards: k.boards, casters: [], W: c.W + 2 * ox, D: c.D, H: Hc + 0.5, boardThick: 0 };
}

/** Peringatan & catatan untuk bentuk baru (bentuk lama: kosong, sudah ditangani di checks) */
function newChecks(p: Params): ProductCheck[] {
  const s = sisiOf(p);
  const out: ProductCheck[] = [];
  const pipa = str(p, 'pipa', '30');
  const W = num(p, 'panjang');
  const D = num(p, 'dalamDudukan');
  switch (s) {
    case 'panel-samping':
      if (num(p, 'tinggiPanel') > num(p, 'tinggiSandaran') + 10)
        out.push({ level: 'warn', message: 'Panel samping jauh lebih tinggi dari sandaran: terlihat seperti lemari.', fix: { label: 'Setinggi sandaran', params: { tinggiPanel: num(p, 'tinggiSandaran') } } });
      out.push({ level: 'info', message: 'Panel samping dari papan dibaut ke bingkai besi dari sisi dalam; sisi luar bisa dilapis HPL.' });
      break;
    case 'sled':
      out.push({ level: 'info', message: 'Rel lantai depan-belakang membuat booth tidak goyang ke depan. Beri karet di bawah rel supaya lantai tidak tergores.' });
      break;
    case 'kantilever':
      if (pipa !== '40') out.push({ level: 'warn', message: 'Dudukan menjulur tanpa kaki depan: pakai pipa 40×40 supaya tidak melendut saat diduduki.', fix: { label: 'Pakai pipa 40×40', params: { pipa: '40' } } });
      if (D > 52) out.push({ level: 'warn', message: `Dudukan sedalam ${D} cm terlalu jauh menjulur dari tiang belakang.`, fix: { label: 'Dalam 48 cm', params: { dalamDudukan: 48 } } });
      out.push({ level: 'info', message: 'Tapak lantai sepanjang dudukan menahan booth tidak terjungkit ke depan.' });
      break;
    case 'dinding':
      if (pipa === '20') out.push({ level: 'warn', message: 'Booth melayang menahan beban di tembok: pipa 20×20 terlalu kecil.', fix: { label: 'Pakai pipa 40×40', params: { pipa: '40' } } });
      out.push({ level: 'warn', message: 'Tiang WAJIB dibaut ke tembok bata / beton (fischer 10 + baut 8 mm, minimal 3 titik per tiang). Tembok gipsum / partisi tidak kuat.' });
      break;
    case 'kotak-simpan':
      out.push({ level: 'info', message: 'Tiap tutup dudukan dipasang engsel piano di sisi belakang + penahan (stay) supaya tidak jatuh saat dibuka.' });
      break;
    case 'kaki-v':
      if (pipa === '20') out.push({ level: 'warn', message: 'Kaki V dari pipa 20×20 terlalu lentur untuk booth.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
      out.push({ level: 'info', message: 'Kedua kaki V bertemu di lantai: las kedua ujung bawahnya jadi satu dan beri dop karet.' });
      break;
    case 'u-meja': {
      const gap = W - 2 * D;
      if (gap < 60) out.push({ level: 'warn', message: `Celah di antara kedua sayap hanya ${gap} cm: meja tengah dan kaki orang tidak muat.`, fix: { label: `Panjang ${2 * D + 100} cm`, params: { panjang: Math.min(300, 2 * D + 100) } } });
      out.push({ level: 'info', message: `Muat ±${Math.max(2, Math.floor(W / 60) + 2 * Math.floor(num(p, 'panjangSudut') / 60))} orang. Meja tengah bertiang tunggal di plat besi 8 mm.` });
      break;
    }
    case 'panggung':
      if (num(p, 'tinggiPanggung') > 25) out.push({ level: 'info', message: 'Panggung lebih dari 25 cm: sediakan satu anak tangga ±18 cm supaya mudah naik.' });
      out.push({ level: 'info', message: 'Tinggi sandaran & meja diukur dari lantai panggung. Booth dan meja dibaut ke rangka panggung lewat papan lantai.' });
      break;
    case 'kabin':
      if (num(p, 'tinggiAtap') < 200) out.push({ level: 'warn', message: 'Atap kabin lebih rendah dari 200 cm: orang dewasa harus menunduk saat masuk.', fix: { label: 'Atap 210 cm', params: { tinggiAtap: 210 } } });
      out.push({ level: 'info', message: 'Palang samping setinggi meja sekaligus jadi sandaran tangan di kedua ujung.' });
      break;
    case 'ayun-plafon':
      out.push({ level: 'warn', message: `Kait plafon WAJIB dibaut ke balok beton / besi, bukan ke rangka gipsum. Beban ±${Math.max(1, Math.floor(W / 60)) * 100 + 30} kg per sofa, pakai kait & baut tanam ≥ 10 mm.` });
      if (num(p, 'tinggiPlafon') - num(p, 'tinggiSandaran') < 90)
        out.push({ level: 'warn', message: 'Plafon terlalu dekat dengan sandaran: batang gantung terlalu pendek, sofa mudah berputar.', fix: { label: 'Plafon 280 cm', params: { tinggiPlafon: 280 } } });
      if (W > 150 && pipa === '20') out.push({ level: 'warn', message: 'Sofa ayun panjang dengan pipa 20×20 melendut di tengah.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
      break;
  }
  return out;
}
