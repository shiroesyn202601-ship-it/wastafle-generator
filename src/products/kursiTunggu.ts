import { FrameHinge, FrameMemberRole } from '../types/kitchen';
import { Board, Params, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, bool, materialParams, memberFactory, num, r1, str } from './common';

/**
 * Kursi tunggu deret: dudukan per orang yang TERPISAH (ada celah) dipasang di satu BALOK mendatar bersama.
 * Kaki hanya menopang balok (di ujung atau tiap 2 dudukan), tidak pernah 4 kaki per dudukan.
 * Bentuk rangka (param `model`):
 * - kaki-t: tiap penopang satu tiang di tapak melintang (T terbalik)
 * - kaki-u: tiap penopang rangka U tertutup: rel lantai, dua tiang, palang atas di bawah balok
 * - kaki-x: tiap penopang dua kaki bersilang X dilihat dari samping, palang atas di bawah balok
 * - kaki-a: tiap penopang dua kaki miring dari balok melebar ke depan & belakang, palang perenggang
 * - kantilever: balok di belakang, tiang belakang di tapak yang menjorok ke depan, dudukan menjulur ke depan
 * - tiang-plat: tiang tunggal di plat besi yang dibaut lantai (ruang tunggu stasiun / terminal)
 * - kaki-tengah: 2–3 dudukan di satu tiang tengah dengan 4 kaki miring menyebar (berdiri bebas)
 * - tembok-kantilever: balok & rel atas dibaut tembok di tiang tembok, dudukan menjulur, tanpa kaki lantai
 * - tembok-lipat: balok tembok, tiap dudukan berengsel bisa dilipat naik, sandaran papan menempel tembok
 * - aula-lipat: rangka samping (rel lantai + tiang + sandaran tangan) tiap 2 dudukan, dudukan berengsel naik
 * - punggung: satu balok tengah, dudukan dua muka saling membelakangi, kaki T panjang
 * - sudut-l: dua deret bertemu siku di meja sudut berkaki 4
 * - pulau: 4 deret mengelilingi inti persegi (menghadap keluar), papan ambalan di atas sandaran
 */
const MODELS = [
  { value: 'kaki-t', label: 'Kaki T terbalik', desc: 'Tiang di tapak melintang' },
  { value: 'kaki-u', label: 'Kaki U tertutup', desc: 'Rel lantai + 2 tiang + palang atas' },
  { value: 'kaki-x', label: 'Kaki silang X', desc: 'Dua kaki bersilang di tiap penopang' },
  { value: 'kaki-a', label: 'Kaki A', desc: 'Dua kaki miring melebar ke lantai' },
  { value: 'kantilever', label: 'Kantilever belakang', desc: 'Tiang di belakang, dudukan menjulur' },
  { value: 'tiang-plat', label: 'Tiang plat dibaut lantai', desc: 'Tiang tunggal di plat besi' },
  { value: 'kaki-tengah', label: 'Kaki tengah menyebar', desc: '2–3 dudukan di satu tiang tengah' },
  { value: 'tembok-kantilever', label: 'Tempel tembok', desc: 'Dibaut tembok, tanpa kaki lantai' },
  { value: 'tembok-lipat', label: 'Tembok dudukan lipat', desc: 'Dudukan dilipat naik ke tembok' },
  { value: 'aula-lipat', label: 'Aula dudukan lipat', desc: 'Rangka samping + sandaran tangan, dudukan lipat' },
  { value: 'punggung', label: 'Punggung-ke-punggung', desc: 'Dua muka di satu balok tengah' },
  { value: 'sudut-l', label: 'Sudut L + meja', desc: 'Dua deret bertemu di meja sudut' },
  { value: 'pulau', label: 'Pulau 4 muka', desc: 'Empat deret mengelilingi ambalan tengah' },
];
const KEYS = MODELS.map((m) => m.value);
const model = (p: Params) => {
  const m = str(p, 'model', 'kaki-t');
  return KEYS.includes(m) ? m : 'kaki-t';
};
const has = (...m: string[]) => (p: Params) => m.includes(model(p));
const clampI = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(v)));

/** Model yang sandarannya boleh dilepas (varian tanpa sandaran = ukuran, bukan template) */
const BACK_OPT = ['kaki-t', 'kaki-u', 'kaki-x', 'kaki-a', 'kantilever', 'tiang-plat', 'kaki-tengah', 'tembok-kantilever', 'sudut-l'];
/** Model yang kemiringan sandarannya bisa diatur (sandaran deret menghadap depan / belakang) */
const TILT_MODELS = ['kaki-t', 'kaki-u', 'kaki-x', 'kaki-a', 'kantilever', 'tiang-plat', 'kaki-tengah', 'aula-lipat', 'punggung'];
/** Model yang jarak kakinya bisa dipilih (ujung saja / tiap 2 dudukan) */
const SPAN_MODELS = ['kaki-t', 'kaki-u', 'kaki-x', 'kaki-a', 'kantilever', 'tiang-plat', 'tembok-kantilever', 'tembok-lipat', 'punggung', 'sudut-l'];
/** Satu deret lurus: boleh diberi meja kecil di sela */
const MEJA_MODELS = ['kaki-t', 'kaki-u', 'kaki-x', 'kaki-a', 'kantilever', 'tiang-plat', 'tembok-kantilever'];
const LENGAN_MODELS = KEYS.filter((k) => k !== 'aula-lipat' && k !== 'tembok-lipat');
const WALL_MODELS = ['tembok-kantilever', 'tembok-lipat'];
const LIPAT_MODELS = ['tembok-lipat', 'aula-lipat'];

const maxSeats = (m: string) => (m === 'kaki-tengah' ? 3 : m === 'pulau' ? 4 : 5);
const seatsOf = (p: Params) => clampI(num(p, 'dudukan', 3), 2, maxSeats(model(p)));
const backOf = (p: Params) => (BACK_OPT.includes(model(p)) ? bool(p, 'sandaran') : true);
const lenganOf = (p: Params) => LENGAN_MODELS.includes(model(p)) && bool(p, 'lengan');
const mejaOf = (p: Params) => (MEJA_MODELS.includes(model(p)) ? str(p, 'meja', 'tanpa') : 'tanpa');
const spanOf = (p: Params) => (model(p) === 'aula-lipat' ? 'dua' : SPAN_MODELS.includes(model(p)) ? str(p, 'jarakKaki', 'ujung') : 'ujung');

const JOK_OPTIONS = [
  { value: 'papan', label: 'Papan (ikut bahan papan)', desc: 'Kayu / multiplek, paling murah' },
  { value: 'plat', label: 'Plat besi berlubang 3 mm', desc: 'Tahan cuaca & coretan, ruang publik' },
  { value: 'busa', label: 'Busa + kain jok', desc: 'Empuk, klinik / kantor / bank' },
];
const JOK_COLOR = '#2d3446';

type Face = 'S' | 'N' | 'E' | 'W';
type V3 = [number, number, number];
interface Item {
  kind: 'seat' | 'meja';
  w: number;
}

export const KURSI_TUNGGU: ProductDef = {
  id: 'kursi-tunggu',
  name: 'Kursi tunggu deret',
  tagline: 'klinik · bank · sekolah · bengkel · terminal',
  icon: 'M6 24h48M8 20h12M24 20h12M40 20h12M10 20l-2-13M26 20l-2-13M42 20l-2-13M14 24v10M46 24v10M8 34h12M40 34h12',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['model', 'dudukan', 'dudukanSamping', 'lebarDudukan', 'celah', 'dalamDudukan', 'tinggiDudukan'] },
    { id: 'bentuk', title: 'Sandaran & kaki', keys: ['sandaran', 'tinggiSandaran', 'miringSandaran', 'jarakKaki'] },
    { id: 'bahan', title: 'Bahan', keys: ['jok', 'pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Tambahan', keys: ['lengan', 'meja'] },
  ],
  params: [
    { key: 'model', label: 'Bentuk rangka', type: 'choice', options: MODELS },
    {
      key: 'dudukan',
      label: 'Jumlah dudukan',
      type: 'number',
      min: 2,
      max: 5,
      step: 1,
      help: 'Jumlah orang dalam satu deret. Punggung-ke-punggung: per muka. Pulau: per sisi. Sudut L: deret panjang.',
      marks: [{ value: 3, label: 'umum' }, { value: 5, label: 'lobi' }],
    },
    {
      key: 'dudukanSamping',
      label: 'Dudukan deret samping',
      type: 'number',
      min: 1,
      max: 4,
      step: 1,
      help: 'Jumlah dudukan di sayap samping yang menempel tembok kiri.',
      showIf: has('sudut-l'),
    },
    {
      key: 'lebarDudukan',
      label: 'Lebar per dudukan',
      type: 'number',
      unit: 'cm',
      min: 42,
      max: 65,
      step: 1,
      help: 'Lebar satu dudukan. 50 cm cukup untuk orang dewasa, 45 cm untuk anak sekolah.',
      marks: [{ value: 45, label: 'anak' }, { value: 50, label: 'umum' }, { value: 58, label: 'lega' }],
    },
    {
      key: 'celah',
      label: 'Celah antar dudukan',
      type: 'number',
      unit: 'cm',
      min: 2,
      max: 15,
      step: 1,
      help: 'Jarak kosong di antara dua dudukan. Pakai sandaran tangan: minimal 4 cm.',
      marks: [{ value: 4, label: 'rapat' }, { value: 8, label: 'lega' }],
    },
    {
      key: 'dalamDudukan',
      label: 'Kedalaman dudukan',
      type: 'number',
      unit: 'cm',
      min: 38,
      max: 56,
      step: 1,
      help: 'Dari belakang dudukan sampai bibir depan.',
      marks: [{ value: 45, label: 'umum' }, { value: 50, label: 'tembok' }],
    },
    {
      key: 'tinggiDudukan',
      label: 'Tinggi dudukan',
      type: 'number',
      unit: 'cm',
      min: 36,
      max: 50,
      step: 1,
      help: 'Dari lantai ke atas dudukan. Dewasa 42–45 cm, anak SD ±35–38 cm.',
      marks: [{ value: 38, label: 'anak' }, { value: 43, label: 'dewasa' }],
    },
    { key: 'sandaran', label: 'Pakai sandaran punggung', type: 'toggle', help: 'Tanpa sandaran cocok untuk lorong sempit atau ruang ganti.', showIf: has(...BACK_OPT) },
    {
      key: 'tinggiSandaran',
      label: 'Tinggi sandaran dari dudukan',
      type: 'number',
      unit: 'cm',
      min: 25,
      max: 55,
      step: 1,
      help: 'Sandaran pinggang ±30 cm, punggung penuh ±40–45 cm.',
      marks: [{ value: 30, label: 'pinggang' }, { value: 42, label: 'punggung' }],
      showIf: (p) => backOf(p),
    },
    {
      key: 'miringSandaran',
      label: 'Kemiringan sandaran',
      type: 'number',
      unit: '°',
      min: 0,
      max: 20,
      step: 1,
      help: 'Condong ke belakang supaya nyaman menunggu lama. 10–15° paling umum.',
      showIf: (p) => backOf(p) && TILT_MODELS.includes(model(p)),
    },
    {
      key: 'jarakKaki',
      label: 'Letak kaki',
      type: 'choice',
      options: [
        { value: 'ujung', label: 'Di kedua ujung saja', desc: 'Kolong lega, untuk 2–3 dudukan' },
        { value: 'dua', label: 'Tiap 2 dudukan', desc: 'Balok tidak melendut, untuk 4–5 dudukan' },
      ],
      help: 'Makin panjang deret, makin perlu kaki tambahan di tengah.',
      showIf: has(...SPAN_MODELS),
    },
    { key: 'jok', label: 'Bahan dudukan & sandaran', type: 'choice', options: JOK_OPTIONS },
    ...materialParams(true),
    { key: 'lengan', label: 'Sandaran tangan', type: 'toggle', help: 'Tiang pendek berlengan di tiap celah dan kedua ujung deret.', showIf: has(...LENGAN_MODELS) },
    {
      key: 'meja',
      label: 'Meja kecil di sela',
      type: 'choice',
      options: [
        { value: 'tanpa', label: 'Tanpa meja' },
        { value: 'ujung', label: 'Di ujung kanan', desc: 'Tempat tas / majalah / gelas' },
        { value: 'tengah', label: 'Di tengah deret', desc: 'Membagi deret jadi dua kelompok' },
      ],
      help: 'Meja kecil menempel di balok yang sama, tanpa sandaran.',
      showIf: has(...MEJA_MODELS),
    },
  ],
  defaults: {
    model: 'kaki-t',
    dudukan: 3,
    dudukanSamping: 2,
    lebarDudukan: 50,
    celah: 5,
    dalamDudukan: 45,
    tinggiDudukan: 43,
    sandaran: true,
    tinggiSandaran: 40,
    miringSandaran: 12,
    jarakKaki: 'ujung',
    jok: 'papan',
    pipa: '40',
    papan: 'kayu',
    warna: '#1f2226',
    lengan: false,
    meja: 'tanpa',
  },
  groups: [
    { id: 'deret-balok', name: 'Deret di balok', desc: 'Satu deret di balok bersama: kaki T, kaki U, silang X, kaki A, kantilever, tiang plat, kaki tengah' },
    { id: 'deret-tembok', name: 'Deret tempel tembok', desc: 'Balok dibaut ke tembok, tanpa kaki lantai: dudukan tetap atau dilipat naik' },
    { id: 'deret-set', name: 'Set khusus', desc: 'Punggung-ke-punggung, sudut L dengan meja, pulau 4 muka, kursi aula lipat' },
  ],
  signature: (p) => `kursi-tunggu:${model(p)}`,
  presets: [
    {
      id: 'kaki-t',
      group: 'deret-balok',
      name: 'Kursi tunggu kaki T',
      desc: 'balok bersama di atas tiang tunggal bertapak melintang (T terbalik), dudukan & sandaran per orang',
      params: { model: 'kaki-t', dudukan: 3, lebarDudukan: 50, celah: 5, jarakKaki: 'ujung' },
      sizes: [
        { label: '3 dudukan', desc: '±165 × 45 × 83 cm, kaki di ujung', params: { dudukan: 3, jarakKaki: 'ujung' } },
        { label: '4 dudukan + lengan', desc: '±220 cm, kaki tiap 2 dudukan', params: { dudukan: 4, jarakKaki: 'dua', lengan: true } },
        { label: '5 dudukan jok busa', desc: '±275 cm, klinik / bank', params: { dudukan: 5, jarakKaki: 'dua', jok: 'busa', lengan: true } },
        { label: '3 dudukan + meja', desc: 'meja kecil di ujung kanan', params: { dudukan: 3, meja: 'ujung' } },
      ],
    },
    {
      id: 'kaki-u',
      group: 'deret-balok',
      name: 'Kursi tunggu kaki U tertutup',
      desc: 'tiap penopang rangka U tertutup (rel lantai, dua tiang, palang atas) memikul balok bersama',
      params: { model: 'kaki-u', dudukan: 3, lebarDudukan: 50, celah: 5 },
      sizes: [
        { label: '3 dudukan', desc: '±165 cm, kaki di ujung', params: { dudukan: 3, jarakKaki: 'ujung' } },
        { label: '4 dudukan', desc: '±220 cm, kaki tiap 2 dudukan', params: { dudukan: 4, jarakKaki: 'dua' } },
        { label: '2 dudukan sekolah', desc: 'lebar 45, tinggi 38 cm', params: { dudukan: 2, lebarDudukan: 45, tinggiDudukan: 38, tinggiSandaran: 32 } },
      ],
    },
    {
      id: 'kaki-x',
      group: 'deret-balok',
      name: 'Kursi tunggu kaki silang X',
      desc: 'tiap penopang dua kaki bersilang X dilihat dari samping, palang atas di bawah balok bersama',
      params: { model: 'kaki-x', dudukan: 3, lebarDudukan: 50, celah: 5 },
      sizes: [
        { label: '3 dudukan', desc: '±165 cm', params: { dudukan: 3 } },
        { label: '4 dudukan', desc: '±220 cm, kaki tiap 2 dudukan', params: { dudukan: 4, jarakKaki: 'dua' } },
        { label: '2 dudukan', desc: '±105 cm, teras / bengkel', params: { dudukan: 2 } },
      ],
    },
    {
      id: 'kaki-a',
      group: 'deret-balok',
      name: 'Kursi tunggu kaki A',
      desc: 'dari balok bersama turun dua kaki miring melebar ke depan & belakang, palang perenggang dekat lantai',
      params: { model: 'kaki-a', dudukan: 3, lebarDudukan: 50, celah: 5 },
      sizes: [
        { label: '3 dudukan', desc: '±165 cm', params: { dudukan: 3 } },
        { label: '4 dudukan', desc: '±220 cm, kaki tiap 2 dudukan', params: { dudukan: 4, jarakKaki: 'dua' } },
        { label: '3 dudukan pinggang', desc: 'sandaran rendah 30 cm', params: { dudukan: 3, tinggiSandaran: 30 } },
      ],
    },
    {
      id: 'kantilever',
      group: 'deret-balok',
      name: 'Kursi tunggu kantilever belakang',
      desc: 'balok di belakang, tiang hanya di belakang dengan tapak menjorok ke depan, dudukan menjulur tanpa kaki depan',
      params: { model: 'kantilever', dudukan: 3, lebarDudukan: 50, celah: 5 },
      sizes: [
        { label: '3 dudukan', desc: '±165 cm', params: { dudukan: 3 } },
        { label: '4 dudukan', desc: '±220 cm, kaki tiap 2 dudukan', params: { dudukan: 4, jarakKaki: 'dua' } },
        { label: '3 dudukan tanpa sandaran', desc: 'lorong / ruang ganti', params: { dudukan: 3, sandaran: false } },
      ],
    },
    {
      id: 'tiang-plat',
      group: 'deret-balok',
      name: 'Kursi tunggu tiang plat (stasiun)',
      desc: 'balok bersama di atas tiang tunggal yang berdiri di plat besi dibaut ke lantai',
      params: { model: 'tiang-plat', dudukan: 4, lebarDudukan: 50, celah: 6, jarakKaki: 'dua', jok: 'plat' },
      sizes: [
        { label: '4 dudukan', desc: '±225 cm, tiang tiap 2 dudukan', params: { dudukan: 4, jarakKaki: 'dua' } },
        { label: '5 dudukan', desc: '±285 cm, terminal', params: { dudukan: 5, jarakKaki: 'dua' } },
        { label: '3 dudukan', desc: '±165 cm, halte / taman', params: { dudukan: 3, jarakKaki: 'ujung' } },
      ],
    },
    {
      id: 'kaki-tengah',
      group: 'deret-balok',
      name: 'Kursi tunggu kaki tengah',
      desc: 'balok pendek di satu tiang tengah, 4 kaki miring menyebar di lantai, berdiri bebas tanpa baut',
      params: { model: 'kaki-tengah', dudukan: 2, lebarDudukan: 50, celah: 5 },
      sizes: [
        { label: '2 dudukan', desc: '±105 cm', params: { dudukan: 2 } },
        { label: '3 dudukan', desc: '±160 cm, lebar 48', params: { dudukan: 3, lebarDudukan: 48, celah: 4 } },
        { label: '2 dudukan jok busa', desc: 'ruang praktik dokter', params: { dudukan: 2, jok: 'busa' } },
      ],
    },
    {
      id: 'tembok-kantilever',
      group: 'deret-tembok',
      name: 'Kursi tunggu tempel tembok',
      desc: 'balok & rel atas dibaut ke tiang tembok, dudukan menjulur dari balok, tanpa kaki lantai',
      params: { model: 'tembok-kantilever', dudukan: 3, lebarDudukan: 50, celah: 5, dalamDudukan: 50 },
      sizes: [
        { label: '3 dudukan', desc: '±165 cm', params: { dudukan: 3 } },
        { label: '4 dudukan', desc: '±220 cm, tiang tembok tiap 2', params: { dudukan: 4, jarakKaki: 'dua' } },
        { label: '5 dudukan koridor', desc: '±275 cm, rumah sakit / sekolah', params: { dudukan: 5, jarakKaki: 'dua' } },
      ],
    },
    {
      id: 'tembok-lipat',
      group: 'deret-tembok',
      name: 'Kursi tembok dudukan lipat',
      desc: 'balok dibaut tembok, tiap dudukan berengsel di balok dan dilipat naik, sandaran papan menempel tembok',
      params: { model: 'tembok-lipat', dudukan: 3, lebarDudukan: 48, celah: 5, dalamDudukan: 46 },
      sizes: [
        { label: '3 dudukan', desc: '±155 cm', params: { dudukan: 3 } },
        { label: '4 dudukan koridor', desc: '±205 cm', params: { dudukan: 4, jarakKaki: 'dua' } },
        { label: '2 dudukan', desc: '±100 cm, lorong sempit', params: { dudukan: 2 } },
      ],
    },
    {
      id: 'punggung',
      group: 'deret-set',
      name: 'Kursi tunggu punggung-ke-punggung',
      desc: 'satu balok tengah, dudukan dua muka saling membelakangi, kaki T panjang memikul kedua deret',
      params: { model: 'punggung', dudukan: 3, lebarDudukan: 50, celah: 5 },
      sizes: [
        { label: '2 × 3 dudukan', desc: '±165 cm, 6 orang', params: { dudukan: 3 } },
        { label: '2 × 4 dudukan', desc: '±220 cm, 8 orang', params: { dudukan: 4, jarakKaki: 'dua' } },
        { label: '2 × 2 dudukan', desc: '±105 cm, 4 orang', params: { dudukan: 2 } },
      ],
    },
    {
      id: 'sudut-l',
      group: 'deret-set',
      name: 'Kursi tunggu sudut L + meja',
      desc: 'dua deret bertemu siku di meja sudut berkaki 4, ujung lain tiap deret di kaki T',
      params: { model: 'sudut-l', dudukan: 3, dudukanSamping: 2, lebarDudukan: 50, celah: 5 },
      sizes: [
        { label: '3 + 2 dudukan', desc: 'pojok ruang tunggu', params: { dudukan: 3, dudukanSamping: 2 } },
        { label: '4 + 3 dudukan', desc: 'lobi', params: { dudukan: 4, dudukanSamping: 3, jarakKaki: 'dua' } },
        { label: '2 + 2 dudukan', desc: 'pojok sempit', params: { dudukan: 2, dudukanSamping: 2 } },
      ],
    },
    {
      id: 'pulau',
      group: 'deret-set',
      name: 'Kursi tunggu pulau 4 muka',
      desc: 'empat deret mengelilingi inti persegi menghadap keluar, papan ambalan di atas sandaran',
      params: { model: 'pulau', dudukan: 2, lebarDudukan: 50, celah: 5, tinggiSandaran: 38 },
      sizes: [
        { label: '4 × 2 dudukan', desc: '±150 × 150 cm, 8 orang', params: { dudukan: 2 } },
        { label: '4 × 3 dudukan', desc: '±205 × 205 cm, 12 orang', params: { dudukan: 3 } },
        { label: '4 × 2 jok busa', desc: 'lobi kantor / bank', params: { dudukan: 2, jok: 'busa' } },
      ],
    },
    {
      id: 'aula-lipat',
      group: 'deret-set',
      name: 'Kursi aula dudukan lipat',
      desc: 'rangka samping (rel lantai, tiang, sandaran tangan) tiap 2 dudukan, dudukan berengsel dilipat naik',
      params: { model: 'aula-lipat', dudukan: 4, lebarDudukan: 48, celah: 4, jok: 'busa' },
      sizes: [
        { label: '4 dudukan', desc: '±215 cm, aula sekolah / masjid', params: { dudukan: 4 } },
        { label: '2 dudukan', desc: '±115 cm', params: { dudukan: 2 } },
        { label: '5 dudukan papan', desc: '±265 cm, auditorium', params: { dudukan: 5, jok: 'papan' } },
      ],
    },
  ],
  summary: (p) => {
    const m = model(p);
    const n = seatsOf(p);
    const total = m === 'punggung' ? 2 * n : m === 'pulau' ? 4 * n : m === 'sudut-l' ? n + clampI(num(p, 'dudukanSamping', 2), 1, 4) : n;
    const b = KURSI_TUNGGU.build(p);
    return `${total} dudukan · ${Math.round(b.W)} × ${Math.round(b.D)} × ${Math.round(b.H)} cm${lenganOf(p) ? ' · sandaran tangan' : ''}`;
  },

  build: (p) => {
    const m = model(p);
    const n = seatsOf(p);
    const w = num(p, 'lebarDudukan', 50);
    const g = Math.max(2, num(p, 'celah', 5));
    const D = num(p, 'dalamDudukan', 45);
    const Hs = num(p, 'tinggiDudukan', 43);
    const back = backOf(p);
    const hB = num(p, 'tinggiSandaran', 40);
    const lengan = lenganOf(p);
    const meja = mejaOf(p);
    const span = spanOf(p);
    const L = (parseInt(str(p, 'pipa', '40')) || 40) / 10;
    const b = BOARD_THICK[str(p, 'papan', 'kayu')] ?? 2.5;
    const jok = str(p, 'jok', 'papan');
    const tb = jok === 'busa' ? 6 : jok === 'plat' ? 0.3 : b; // tebal dudukan
    const bt = jok === 'busa' ? 5 : jok === 'plat' ? 0.3 : Math.min(b, 1.8); // tebal sandaran
    const tiltDeg = TILT_MODELS.includes(m) ? Math.max(0, Math.min(20, num(p, 'miringSandaran', 12))) : 0;
    const pt: [number, number] = [L * 10, L * 10];
    const beamT: [number, number] = [40, 40];
    const armT: [number, number] = [20, 40];
    const rail: [number, number] = [20, 20];
    const yS0 = Hs - tb; // bawah dudukan = atas lengan dudukan
    const beamC = yS0 - 6; // as balok 40×40
    const beamBot = yS0 - 8;
    const hTop = Hs + hB;
    const { list, add, line } = memberFactory();
    const boards: Board[] = [];
    const hinges: FrameHinge[] = [];
    const lipat = LIPAT_MODELS.includes(m);
    const wall = WALL_MODELS.includes(m);

    const seatBoard = (bd: Board): Board => (jok === 'plat' ? { ...bd, steelMm: 3 } : jok === 'busa' ? { ...bd, color: JOK_COLOR } : bd);
    const hasSeatBoard = jok !== 'papan' || b > 0;

    /** Pemetaan koordinat deret (u = sepanjang deret, v = 0 belakang dudukan → D depan) ke dunia */
    const mapper = (face: Face, ox: number, oz: number) => {
      const P = (u: number, y: number, v: number): V3 => {
        if (face === 'S') return [ox + u, y, oz + v];
        if (face === 'N') return [ox + u, y, oz - v];
        if (face === 'E') return [ox + v, y, oz + u];
        return [ox - v, y, oz + u];
      };
      const along = face === 'S' || face === 'N';
      const roleU: FrameMemberRole = along ? 'rail-x' : 'rail-z';
      const roleV: FrameMemberRole = along ? 'rail-z' : 'rail-x';
      const ln = (id: string, a: V3, c: V3, role: FrameMemberRole, label: string, tube: [number, number]) => line(id, P(...a), P(...c), role, label, tube);
      /**
       * Palang sepanjang u (u0→u1) yang memotong batang tegak lurus di uc (lebar 2·half): dipotong dua,
       * kedua potongan menempel rata di sisi batang itu (tidak saling tembus).
       */
      const lnSplitU = (id: string, u0: number, u1: number, uc: number, half: number, y: number, v: number, role: FrameMemberRole, label: string, tube: [number, number]) => {
        ln(`${id}-1`, [u0, y, v], [uc - half, y, v], role, `${label} (kiri)`, tube);
        ln(`${id}-2`, [uc + half, y, v], [u1, y, v], role, `${label} (kanan)`, tube);
      };
      const bx = (id: string, label: string, u0: number, u1: number, y0: number, y1: number, v0: number, v1: number): Board => {
        const a = P(u0, y0, v0);
        const c = P(u1, y1, v1);
        return {
          id,
          label,
          box: {
            min: [r1(Math.min(a[0], c[0])), r1(y0), r1(Math.min(a[2], c[2]))],
            max: [r1(Math.max(a[0], c[0])), r1(y1), r1(Math.max(a[2], c[2]))],
          },
        };
      };
      return { P, ln, lnSplitU, bx, roleU, roleV };
    };

    /** Susunan dudukan + meja kecil dalam satu deret */
    const layout = (cnt: number, mj: string) => {
      const items: Item[] = Array.from({ length: cnt }, () => ({ kind: 'seat' as const, w }));
      if (mj === 'ujung') items.push({ kind: 'meja', w: 45 });
      if (mj === 'tengah') items.splice(Math.ceil(cnt / 2), 0, { kind: 'meja', w: 45 });
      return items;
    };

    interface RowSpec {
      pre: string;
      nm: string;
      face: Face;
      ox: number;
      oz: number;
      items: Item[];
      gaps: number[]; // celah setelah tiap item (panjang items - 1)
      vB: number; // letak as balok (v)
      beam: boolean;
      beamU0: number;
      beamU1: number | null; // null = R + e
      armV0: number;
      postV: number;
      seatV0: number;
      tiltDeg: number;
      lenganEnds: boolean;
      lipat: boolean;
    }

    /** Bangun dudukan, sandaran, balok & sandaran tangan satu deret; kembalikan posisi u tiap item & celah */
    const buildRow = (s: RowSpec) => {
      const { ln, lnSplitU, bx, roleU, roleV } = mapper(s.face, s.ox, s.oz);
      const armHalf = armT[0] / 20; // setengah lebar lengan 20×40 searah u
      // Tiang sandaran tegak lurus (tanpa miring) selalu berprofil 20 searah x, 40 searah z:
      // di deret sepanjang z (muka E/W) sisi 40-nya yang searah u.
      const postHalf = s.tiltDeg === 0 && (s.face === 'E' || s.face === 'W') ? armT[1] / 20 : armT[0] / 20;
      const t = (s.tiltDeg * Math.PI) / 180;
      const vAt = (y: number) => s.postV - (y - yS0) * Math.tan(t);
      const starts: number[] = [];
      let u = 0;
      s.items.forEach((it, k) => {
        starts.push(u);
        u += it.w + (k < s.gaps.length ? s.gaps[k] : 0);
      });
      const R = starts[starts.length - 1] + s.items[s.items.length - 1].w;
      const e = lengan && s.lenganEnds ? 4 : 1.5;
      const bu1 = s.beamU1 ?? R + e;
      if (s.beam) ln(`${s.pre}balok`, [s.beamU0, beamC, s.vB], [bu1, beamC, s.vB], roleU, `Balok bersama${s.nm}`, beamT);
      let seatNo = 0;
      s.items.forEach((it, k) => {
        const u0 = starts[k];
        const uc = u0 + it.w / 2;
        const tag = it.kind === 'seat' ? `${s.nm} dudukan ${++seatNo}` : `${s.nm} meja kecil`;
        const id = it.kind === 'seat' ? `${s.pre}d${seatNo}` : `${s.pre}meja`;
        const armId = `${id}-lengan`;
        ln(armId, [uc, yS0 - 2, s.armV0], [uc, yS0 - 2, D - 2], roleV, `Lengan dudukan${tag}`, armT);
        if (s.lipat && it.kind === 'seat') {
          hinges.push({ id: `${id}-engsel`, memberId: armId, mode: 'point', type: 'barrel-weld', pos: 0, side: 'end', foldAxis: 'y', foldSign: 1, label: `Engsel lipat${tag}` });
        } else {
          // Rangka dudukan sejajar lengan: dipotong dua, dilas menempel di kedua sisi lengan
          lnSplitU(`${id}-rangka-b`, u0 + 2, u0 + it.w - 2, uc, armHalf, yS0 - 1, s.seatV0 + 2, roleU, `Rangka belakang${tag}`, rail);
          lnSplitU(`${id}-rangka-d`, u0 + 2, u0 + it.w - 2, uc, armHalf, yS0 - 1, D - 3, roleU, `Rangka depan${tag}`, rail);
        }
        if (it.kind === 'meja') {
          const tt = b > 0 ? b : 0.3;
          const mb = bx(`${id}-papan`, `Daun${tag}`, u0, u0 + it.w, yS0, yS0 + tt, s.seatV0, D);
          boards.push(b > 0 ? mb : { ...mb, steelMm: 3 });
          return;
        }
        if (hasSeatBoard) {
          const sb = seatBoard(bx(`${id}-papan`, `Papan${tag}`, u0, u0 + it.w, yS0, yS0 + tb, s.seatV0, D));
          if (s.lipat) sb.attachTo = armId;
          boards.push(sb);
        }
        if (back && m !== 'tembok-lipat') {
          ln(`${id}-tiang-sandaran`, [uc, yS0, s.postV], [uc, hTop - 1, vAt(hTop - 1)], 'post', `Tiang sandaran${tag}`, armT);
          const yT = hTop - 2;
          const yL = Math.min(yT - 10, Hs + 12);
          // Palang sandaran dipotong dua, dilas di kedua sisi tiang sandaran
          lnSplitU(`${id}-sandaran-atas`, u0 + 3, u0 + it.w - 3, uc, postHalf, yT, vAt(yT), roleU, `Palang sandaran atas${tag}`, rail);
          lnSplitU(`${id}-sandaran-bawah`, u0 + 3, u0 + it.w - 3, uc, postHalf, yL, vAt(yL), roleU, `Palang sandaran bawah${tag}`, rail);
          if (hasSeatBoard) {
            const y0 = yL - 3;
            const hgt = (hTop - y0) / Math.cos(t);
            const ym = (hTop + y0) / 2;
            const vc = vAt(ym) + 1 + bt / 2;
            const bb = seatBoard(bx(`${id}-papan-sandaran`, `Sandaran${tag}`, u0 + 1, u0 + it.w - 1, ym - hgt / 2, ym + hgt / 2, vc - bt / 2, vc + bt / 2));
            if (s.tiltDeg > 0) bb.rotX = s.face === 'N' ? s.tiltDeg : -s.tiltDeg;
            boards.push(bb);
          }
        }
      });
      // Sandaran tangan: tiang pendek dari balok di tiap celah (+ kedua ujung)
      if (lengan) {
        const yA = Hs + 20;
        const us: number[] = [];
        if (s.lenganEnds) us.push(-e + 1);
        for (let k = 0; k < s.items.length - 1; k++) us.push(starts[k] + s.items[k].w + s.gaps[k] / 2);
        if (s.lenganEnds) us.push(R + e - 1);
        const vArm0 = s.vB < 1 ? s.vB - 1 : Math.max(1, Math.min(s.vB - 1, 8));
        us.forEach((ua, k) => {
          ln(`${s.pre}lengan-tangan-tiang-${k + 1}`, [ua, beamC + 2, s.vB], [ua, yA - 1, s.vB], 'post', `Tiang sandaran tangan${s.nm} ${k + 1}`, rail);
          ln(`${s.pre}lengan-tangan-${k + 1}`, [ua, yA, vArm0], [ua, yA, D - 4], roleV, `Sandaran tangan${s.nm} ${k + 1}`, rail);
        });
      }
      /** u titik penopang: kedua ujung (+ tiap 2 dudukan) */
      const supports = (mode: string, endsIn = true) => {
        const out: number[] = [];
        if (endsIn) out.push(Math.min(5, R / 4));
        if (mode === 'dua') {
          let seats = 0;
          for (let k = 0; k < s.items.length - 1; k++) {
            if (s.items[k].kind === 'seat') seats++;
            if (seats === 2) {
              out.push(starts[k] + s.items[k].w + s.gaps[k] / 2);
              seats = 0;
            }
          }
        }
        if (endsIn) out.push(R - Math.min(5, R / 4));
        return out;
      };
      return { R, e, starts, supports, vAt };
    };

    /** Satu penopang lantai di posisi u (koordinat deret) */
    const support = (face: Face, ox: number, oz: number, id: string, nm: string, kind: string, us: number, vB: number, f0: number, f1: number) => {
      const { ln, bx, roleV } = mapper(face, ox, oz);
      if (kind === 'kaki-t') {
        ln(`${id}-tapak`, [us, L / 2, f0], [us, L / 2, f1], roleV, `Tapak melintang ${nm}`, pt);
        ln(`${id}-tiang`, [us, L, vB], [us, beamBot, vB], 'post', `Tiang ${nm}`, pt);
      } else if (kind === 'kaki-u') {
        ln(`${id}-rel`, [us, L / 2, f0], [us, L / 2, f1], roleV, `Rel lantai ${nm}`, pt);
        ln(`${id}-tiang-b`, [us, L, f0 + L / 2], [us, beamBot - L, f0 + L / 2], 'post', `Tiang belakang ${nm}`, pt);
        ln(`${id}-tiang-d`, [us, L, f1 - L / 2], [us, beamBot - L, f1 - L / 2], 'post', `Tiang depan ${nm}`, pt);
        ln(`${id}-atas`, [us, beamBot - L / 2, f0], [us, beamBot - L / 2, f1], roleV, `Palang atas ${nm}`, pt);
      } else if (kind === 'kaki-x') {
        ln(`${id}-atas`, [us, beamBot - L / 2, f0], [us, beamBot - L / 2, f1], roleV, `Palang atas ${nm}`, pt);
        // Dua kaki silang bersebelahan (geser setengah pipa ke kiri & kanan), saling menempel di persilangan,
        // bukan saling tembus di bidang yang sama; keduanya tetap menumpu palang atas.
        ln(`${id}-silang-1`, [us - L / 2, 0, f0 + L / 2], [us - L / 2, beamBot - L, f1 - L / 2], 'post', `Kaki silang ${nm} 1`, pt);
        ln(`${id}-silang-2`, [us + L / 2, 0, f1 - L / 2], [us + L / 2, beamBot - L, f0 + L / 2], 'post', `Kaki silang ${nm} 2`, pt);
      } else if (kind === 'kaki-a') {
        // Puncak A: kedua kaki dipotong rata di bawah balok dan saling menempel di as balok (tidak tumpang tindih).
        // hw(top, bot) = setengah lebar mendatar kaki miring (dipotong rata lantai).
        const hw = (vTop: number, vBot: number) => (L / 2) * (Math.hypot(beamBot, vTop - vBot) / beamBot);
        const vb0 = f0 + L / 2;
        const vf0 = f1 - L / 2;
        const tb0 = vB - hw(vB, vb0);
        const tf0 = vB + hw(vB, vf0);
        ln(`${id}-kaki-b`, [us, beamBot, tb0], [us, 0, vb0], 'post', `Kaki miring belakang ${nm}`, pt);
        ln(`${id}-kaki-d`, [us, beamBot, tf0], [us, 0, vf0], 'post', `Kaki miring depan ${nm}`, pt);
        // Perenggang: ujung dipotong rata menempel di sisi dalam kaki (dihitung di sisi atas palang)
        const yp = 14;
        const yq = yp + rail[1] / 20;
        const at = (vTop: number, vBot: number, y: number) => vBot + (vTop - vBot) * (y / beamBot);
        ln(`${id}-perenggang`, [us, yp, at(tb0, vb0, yq) + hw(tb0, vb0)], [us, yp, at(tf0, vf0, yq) - hw(tf0, vf0)], roleV, `Palang perenggang ${nm}`, rail);
      } else if (kind === 'kantilever') {
        ln(`${id}-tapak`, [us, L / 2, f0], [us, L / 2, f1], roleV, `Tapak menjorok ke depan ${nm}`, pt);
        ln(`${id}-tiang`, [us, L, vB], [us, beamBot, vB], 'post', `Tiang belakang ${nm}`, pt);
      } else if (kind === 'plat') {
        boards.push({ ...bx(`${id}-plat`, `Plat dasar ${nm}`, us - 9, us + 9, 0, 0.8, vB - 9, vB + 9), steelMm: 8 });
        ln(`${id}-tiang`, [us, 0.8, vB], [us, beamBot, vB], 'post', `Tiang ${nm}`, pt);
      } else if (kind === 'tengah') {
        // Kaki menyebar dilas di sisi kiri / kanan tiang tengah (ujung dipotong rata sisi tiang),
        // pasangan depan–belakang dipisah sedikit supaya tidak saling tembus di pangkal.
        const y0 = 10;
        ln(`${id}-tiang`, [us, y0 - L / 2, vB], [us, beamBot, vB], 'post', `Tiang tengah ${nm}`, pt);
        const sx = Math.min(32, us - 4);
        const sz = Math.min(vB - 2, D - 2 - vB);
        const hz = L * 0.7;
        [
          [-1, -1],
          [1, -1],
          [-1, 1],
          [1, 1],
        ].forEach(([a, c], k) => ln(`${id}-kaki-${k + 1}`, [us + (a * L) / 2, y0, vB + c * hz], [us + a * sx, 0, vB + c * sz], 'post', `Kaki menyebar ${k + 1}`, pt));
      } else if (kind === 'standar') {
        const yA = Hs + 20;
        const vf = D - 8;
        ln(`${id}-rel`, [us, L / 2, 1], [us, L / 2, D - 4], roleV, `Rel lantai ${nm}`, pt);
        ln(`${id}-tiang-b`, [us, L, vB], [us, yA - L / 2, vB], 'post', `Tiang belakang ${nm}`, pt);
        ln(`${id}-tiang-d`, [us, L, vf], [us, yA - L / 2, vf], 'post', `Tiang depan ${nm}`, pt);
        ln(`${id}-tangan`, [us, yA, vB - L / 2 - 2], [us, yA, D - 3], roleV, `Sandaran tangan ${nm}`, pt);
      }
    };

    const gapsFor = (items: Item[], gg = g) => items.slice(0, -1).map(() => gg);
    const footF0 = 2;
    const footF1 = D - 2;

    /** Geser deret ke depan bila sandaran miring melewati garis belakang (z < 0) */
    const zOffFor = (postV: number) => (back ? Math.max(0, Math.ceil((hTop - yS0) * Math.tan((tiltDeg * Math.PI) / 180) - postV + 2)) : 0);

    if (['kaki-t', 'kaki-u', 'kaki-x', 'kaki-a', 'kantilever', 'tiang-plat', 'kaki-tengah'].includes(m)) {
      const items = layout(n, meja);
      const oz = zOffFor(m === 'kantilever' ? 6 : 4);
      const vB = m === 'kantilever' ? 4 : D * 0.45;
      const e0 = lengan ? 4 : 1.5;
      const row = buildRow({
        pre: '',
        nm: '',
        face: 'S',
        ox: e0,
        oz,
        items,
        gaps: gapsFor(items),
        vB,
        beam: true,
        beamU0: -e0,
        beamU1: null,
        armV0: m === 'kantilever' ? 2 : 3,
        postV: m === 'kantilever' ? 6 : 4,
        seatV0: m === 'kantilever' ? 8 : 6,
        tiltDeg,
        lenganEnds: true,
        lipat: false,
      });
      const kind = m === 'tiang-plat' ? 'plat' : m === 'kaki-tengah' ? 'tengah' : m;
      const us = m === 'kaki-tengah' ? [row.R / 2] : row.supports(span);
      const f0 = m === 'kantilever' ? 0.5 : footF0;
      const f1 = m === 'kantilever' ? D - 6 : footF1;
      us.forEach((u, k) => support('S', e0, oz, `kaki-${k + 1}`, us.length > 1 ? `kaki ${k + 1}` : 'kaki', kind, u, vB, f0, f1));
    } else if (wall) {
      // Tiang tembok (z ≈ 0–2), balok di depannya, rel atas untuk sandaran
      const items = layout(n, meja);
      const e0 = lengan ? 4 : 1.5;
      const vB = 4;
      const rowTop = m === 'tembok-lipat' ? Hs + Math.max(18, hB - 6) : hTop - 3;
      const postV = 9;
      // Tiang sandaran condong ke tembok dan berhenti menempel di MUKA rel atas (rel di v 2–4), tidak menembusnya:
      // as ujung atas = muka rel + setengah tebal tiang (40 mm) searah miring.
      const vTopPost = 4 + armT[1] / 20 + 0.2;
      const tilt = m === 'tembok-kantilever' ? (Math.atan((postV - vTopPost) / Math.max(10, hTop - 1 - yS0)) * 180) / Math.PI : 0;
      const row = buildRow({
        pre: '',
        nm: '',
        face: 'S',
        ox: e0,
        oz: 0,
        items,
        gaps: gapsFor(items),
        vB,
        beam: true,
        beamU0: -e0,
        beamU1: null,
        armV0: 6,
        postV,
        seatV0: m === 'tembok-lipat' ? 7 : 11,
        tiltDeg: tilt,
        lenganEnds: true,
        lipat: m === 'tembok-lipat',
      });
      const { ln } = mapper('S', e0, 0);
      const showUpper = back || m === 'tembok-lipat';
      const yBot = beamBot - 8;
      const yTopPost = showUpper ? rowTop + 1 : beamC + 6;
      const us = row.supports(span);
      us.forEach((u, k) => ln(`tiang-tembok-${k + 1}`, [u, yBot, 1], [u, yTopPost, 1], 'post', `Tiang tembok ${k + 1} (dibaut)`, [40, 20]));
      if (showUpper) ln('rel-atas', [-e0, rowTop, 3], [row.R + row.e, rowTop, 3], 'rail-x', 'Rel tembok atas (sandaran)', rail);
      if (m === 'tembok-lipat') {
        // Sandaran papan menempel di dua rel tembok
        const yLow = Hs + 10;
        ln('rel-sandaran-bawah', [-e0, yLow, 3], [row.R + row.e, yLow, 3], 'rail-x', 'Rel tembok sandaran bawah', rail);
        if (hasSeatBoard) {
          let seatNo = 0;
          items.forEach((it, k) => {
            if (it.kind !== 'seat') return;
            seatNo++;
            const u0 = row.starts[k];
            boards.push(seatBoard(mapper('S', e0, 0).bx(`d${seatNo}-papan-sandaran`, `Sandaran tembok dudukan ${seatNo}`, u0 + 1, u0 + it.w - 1, yLow - 4, rowTop + 4, 4, 4 + bt)));
          });
        }
      }
    } else if (m === 'aula-lipat') {
      // Rangka samping di kedua ujung & tiap 2 dudukan; celah di rangka samping dilebarkan
      const gs = Math.max(g, L + 4);
      const items = layout(n, 'tanpa');
      const gaps = items.slice(0, -1).map((_, k) => ((k + 1) % 2 === 0 ? gs : g));
      const vB = 8;
      const e0 = gs;
      const oz = zOffFor(vB);
      const row = buildRow({
        pre: '',
        nm: '',
        face: 'S',
        ox: e0,
        oz,
        items,
        gaps,
        vB,
        beam: false,
        beamU0: 0,
        beamU1: null,
        armV0: vB,
        postV: vB,
        seatV0: vB + 3,
        tiltDeg,
        lenganEnds: false,
        lipat: true,
      });
      const { ln } = mapper('S', e0, oz);
      const us = [-gs / 2];
      for (let k = 1; k < items.length - 1; k += 2) us.push(row.starts[k] + items[k].w + gaps[k] / 2);
      us.push(row.R + gs / 2);
      // Balok bersama dipotong per bentang: ujungnya dilas rata di sisi tiang belakang rangka samping (tiang menerus)
      for (let k = 0; k < us.length - 1; k++)
        ln(us.length > 2 ? `balok-${k + 1}` : 'balok', [us[k] + L / 2, beamC, vB], [us[k + 1] - L / 2, beamC, vB], 'rail-x', us.length > 2 ? `Balok bersama ${k + 1}` : 'Balok bersama', beamT);
      us.forEach((u, k) => support('S', e0, oz, `rangka-samping-${k + 1}`, `rangka samping ${k + 1}`, 'standar', u, vB, 1, D - 4));
    } else if (m === 'punggung') {
      // Satu balok tengah, dua deret saling membelakangi
      const t = (tiltDeg * Math.PI) / 180;
      const sp = Math.max(10, Math.ceil(2 * (hB * Math.tan(t)) + 4));
      const zc = D + sp / 2;
      const items = layout(n, 'tanpa');
      const e0 = lengan ? 4 : 1.5;
      const common = {
        items,
        gaps: gapsFor(items),
        vB: -sp / 2,
        beam: false,
        beamU0: 0,
        beamU1: null,
        armV0: -sp / 2,
        postV: 4,
        seatV0: 6,
        tiltDeg,
        lenganEnds: true,
        lipat: false,
      };
      const rowN = buildRow({ ...common, pre: 'b-', nm: ' muka belakang', face: 'N', ox: e0, oz: D });
      buildRow({ ...common, pre: 'd-', nm: ' muka depan', face: 'S', ox: e0, oz: D + sp });
      add('balok', 'x', 0, beamC, zc, rowN.R + 2 * e0, 'rail-x', 'Balok tengah bersama', beamT);
      const us = rowN.supports(span);
      const { ln } = mapper('S', e0, 0);
      us.forEach((u, k) => {
        ln(`kaki-${k + 1}-tapak`, [u, L / 2, footF0], [u, L / 2, 2 * D + sp - 2], 'rail-z', `Tapak melintang kaki ${k + 1}`, pt);
        ln(`kaki-${k + 1}-tiang`, [u, L, zc], [u, beamBot, zc], 'post', `Tiang kaki ${k + 1}`, pt);
      });
    } else if (m === 'sudut-l') {
      // Meja sudut berkaki 4 di pojok; deret depan (sepanjang x) & deret samping (sepanjang z)
      const T = Math.max(45, D);
      const n2 = clampI(num(p, 'dudukanSamping', 2), 1, 4);
      const vB = D * 0.45;
      const e0 = lengan ? 4 : 1.5;
      const mk = (pre: string, nm: string, face: Face, ox: number, oz: number, cnt: number) => {
        const items = layout(cnt, 'tanpa');
        return buildRow({ pre, nm, face, ox, oz, items, gaps: gapsFor(items), vB, beam: true, beamU0: 0, beamU1: null, armV0: 3, postV: 4, seatV0: 6, tiltDeg: 0, lenganEnds: true, lipat: false });
      };
      // ruang ujung dekat meja: geser deret sedikit menjauh supaya sandaran tangan muat
      const off = lengan ? 5 : 1;
      const rowA = mk('a-', ' deret depan', 'S', T + off, 0, n);
      const rowB = mk('s-', ' deret samping', 'E', 0, T + off, n2);
      // balok menyambung sampai rangka meja
      add('a-balok-sambung', 'x', T, beamC, vB, off, 'rail-x', 'Sambungan balok deret depan ke meja', beamT);
      add('s-balok-sambung', 'z', vB, beamC, T, off, 'rail-z', 'Sambungan balok deret samping ke meja', beamT);
      const sa = rowA.supports(span).filter((u) => u > rowA.R / 2 || span === 'dua');
      const sb = rowB.supports(span).filter((u) => u > rowB.R / 2 || span === 'dua');
      sa.filter((u) => u > 6).forEach((u, k) => support('S', T + off, 0, `a-kaki-${k + 1}`, `deret depan ${k + 1}`, 'kaki-t', u, vB, footF0, footF1));
      sb.filter((u) => u > 6).forEach((u, k) => support('E', 0, T + off, `s-kaki-${k + 1}`, `deret samping ${k + 1}`, 'kaki-t', u, vB, footF0, footF1));
      // Meja sudut
      const tt = b > 0 ? b : 0.3;
      const yTopRing = Hs - tt - L / 2;
      const c0 = L / 2;
      const c1 = T - L / 2;
      [c0, c1].forEach((x, i) => [c0, c1].forEach((z, j) => add(`meja-kaki-${i}-${j}`, 'y', x, 0, z, yTopRing + L / 2, 'post', `Kaki meja sudut ${i + 1}-${j + 1}`, pt)));
      [beamC, yTopRing].forEach((y, k) => {
        const nm = k ? 'atas' : 'bawah';
        [c0, c1].forEach((z, j) => add(`meja-ring-${nm}-x${j}`, 'x', L, y, z, T - 2 * L, 'rail-x', `Palang meja ${nm} ${j ? 'depan' : 'belakang'}`, pt));
        [c0, c1].forEach((x, i) => add(`meja-ring-${nm}-z${i}`, 'z', x, y, L, T - 2 * L, 'rail-z', `Palang meja ${nm} ${i ? 'kanan' : 'kiri'}`, pt));
      });
      const mb: Board = { id: 'meja-sudut', label: 'Daun meja sudut', box: { min: [0, r1(Hs - tt), 0], max: [r1(T), r1(Hs), r1(T)] } };
      boards.push(b > 0 ? mb : { ...mb, steelMm: 3 });
    } else {
      // pulau: 4 deret berputar (pinwheel) mengelilingi inti persegi, menghadap keluar
      const items = layout(n, 'tanpa');
      const gaps = gapsFor(items);
      const R = items.reduce((s2, it) => s2 + it.w, 0) + gaps.reduce((s2, x) => s2 + x, 0);
      const S = R + D;
      const vB = D * 0.45;
      const rows: [string, string, Face, number, number][] = [
        ['a-', ' sisi depan', 'S', 0, S - D],
        ['b-', ' sisi kanan', 'E', S - D, D],
        ['c-', ' sisi belakang', 'N', D, D],
        ['d-', ' sisi kiri', 'W', D, 0],
      ];
      rows.forEach(([pre, nm, face, ox, oz]) => {
        const r = buildRow({ pre, nm, face, ox, oz, items, gaps, vB, beam: true, beamU0: 0, beamU1: R, armV0: 3, postV: 4, seatV0: 6, tiltDeg: 0, lenganEnds: false, lipat: false });
        r.supports('ujung').forEach((u, k) => support(face, ox, oz, `${pre}kaki-${k + 1}`, `${nm.trim()} ${k + 1}`, 'kaki-t', u, vB, footF0, footF1));
      });
      // Papan ambalan di atas palang sandaran atas (inti persegi)
      const yT = hTop - 2;
      const a0 = D - 5;
      const a1 = S - D + 5;
      const tt = b > 0 ? b : 0.3;
      const amb: Board = { id: 'ambalan-tengah', label: 'Ambalan tengah (tas / tanaman)', box: { min: [r1(a0), r1(yT + 1), r1(a0)], max: [r1(a1), r1(yT + 1 + tt), r1(a1)] } };
      boards.push(b > 0 ? amb : { ...amb, steelMm: 3 });
    }

    // Ukuran keseluruhan dari batang & papan
    let maxX = 0;
    let maxZ = 0;
    let maxY = 0;
    list.forEach((mb) => {
      const len = mb.length;
      const ex = mb.end ? mb.end.x : mb.x + (mb.axis === 'x' ? len : 0);
      const ey = mb.end ? mb.end.y : mb.y + (mb.axis === 'y' ? len : 0);
      const ez = mb.end ? mb.end.z : mb.z + (mb.axis === 'z' ? len : 0);
      maxX = Math.max(maxX, mb.x, ex);
      maxY = Math.max(maxY, mb.y, ey);
      maxZ = Math.max(maxZ, mb.z, ez);
    });
    boards.forEach((bd) => {
      maxX = Math.max(maxX, bd.box.max[0]);
      maxY = Math.max(maxY, bd.box.max[1]);
      maxZ = Math.max(maxZ, bd.box.max[2]);
    });
    return {
      members: list,
      boards,
      casters: [],
      W: r1(maxX + 1),
      D: r1(maxZ + 1),
      H: r1(maxY + 1),
      boardThick: 0,
      hinges: hinges.length ? hinges : undefined,
      wall,
    };
  },

  checks: (p, bd) => {
    const out: ProductCheck[] = [];
    const m = model(p);
    const n = seatsOf(p);
    const w = num(p, 'lebarDudukan', 50);
    const g = num(p, 'celah', 5);
    const D = num(p, 'dalamDudukan', 45);
    const Hs = num(p, 'tinggiDudukan', 43);
    const pipa = str(p, 'pipa', '40');
    const span = spanOf(p);
    if (num(p, 'dudukan', 3) > maxSeats(m))
      out.push({ level: 'info', message: `Bentuk ini paling banyak ${maxSeats(m)} dudukan per deret; dipakai ${maxSeats(m)}.` });
    // Bentang balok tanpa kaki
    const freeSpan = span === 'dua' ? 2 * (w + g) : n * (w + g);
    if (SPAN_MODELS.includes(m) && m !== 'sudut-l' && span === 'ujung' && freeSpan > 175)
      out.push({ level: 'warn', message: 'Balok terlalu panjang tanpa kaki di tengah: melendut kalau semua dudukan terisi orang dewasa.', fix: { label: 'Kaki tiap 2 dudukan', params: { jarakKaki: 'dua' } } });
    if (m === 'sudut-l' && span === 'ujung' && Math.max(n, clampI(num(p, 'dudukanSamping', 2), 1, 4)) * (w + g) > 175)
      out.push({ level: 'warn', message: 'Deret sudut terlalu panjang tanpa kaki di tengah, balok bisa melendut.', fix: { label: 'Kaki tiap 2 dudukan', params: { jarakKaki: 'dua' } } });
    if (m === 'kaki-tengah' && n * (w + g) > 165)
      out.push({ level: 'warn', message: 'Kursi kaki tengah sepanjang ini mudah terjungkit kalau orang duduk di ujung saja.', fix: { label: '2 dudukan', params: { dudukan: 2 } } });
    if (lenganOf(p) && g < 4) out.push({ level: 'warn', message: 'Celah terlalu sempit untuk tiang sandaran tangan.', fix: { label: 'Celah 5 cm', params: { celah: 5 } } });
    if (m === 'aula-lipat' && g < 3) out.push({ level: 'warn', message: 'Celah dudukan lipat terlalu rapat: dudukan bisa bergesekan saat dilipat.', fix: { label: 'Celah 4 cm', params: { celah: 4 } } });
    if (pipa === '20' && !WALL_MODELS.includes(m))
      out.push({ level: 'warn', message: 'Pipa kaki 20×20 terlalu kecil untuk memikul beberapa orang dewasa sekaligus.', fix: { label: 'Pakai pipa 40×40', params: { pipa: '40' } } });
    if ((m === 'kantilever' || m === 'tembok-kantilever') && D > 52)
      out.push({ level: 'warn', message: 'Dudukan menjulur terlalu dalam tanpa kaki depan: ujung depan melendut dan las lengan cepat retak.', fix: { label: 'Dalam 48 cm', params: { dalamDudukan: 48 } } });
    if (m === 'kantilever' && pipa === '30')
      out.push({ level: 'warn', message: 'Tiang belakang menahan seluruh beban dudukan yang menjulur; pipa 30×30 kurang kaku.', fix: { label: 'Pakai pipa 40×40', params: { pipa: '40' } } });
    if (Hs < 40) out.push({ level: 'info', message: 'Dudukan di bawah 40 cm cocok untuk anak-anak; orang dewasa / lansia lebih nyaman 43–45 cm.' });
    if (m === 'tiang-plat') out.push({ level: 'info', message: 'Plat dasar tiap tiang dibaut ke lantai cor dengan 4 dynabolt supaya kursi tidak bergeser atau terguling.' });
    if (WALL_MODELS.includes(m)) out.push({ level: 'info', message: 'Tiang tembok dibaut ke dinding bata / beton (bukan gypsum) minimal 3 dynabolt per tiang.' });
    if (m === 'tembok-lipat' || m === 'aula-lipat') out.push({ level: 'info', message: 'Pasang engsel per dudukan dan karet peredam di balok supaya dudukan tidak berbunyi saat dilipat.' });
    if (str(p, 'jok', 'papan') === 'plat') out.push({ level: 'info', message: 'Plat besi 3 mm dilubangi (perforasi) supaya air hujan tidak menggenang dan tidak panas.' });
    if (str(p, 'jok', 'papan') === 'busa') out.push({ level: 'info', message: 'Busa + kain jok dibuat di tukang jok, dibaut dari bawah ke papan alas.' });
    if (str(p, 'jok', 'papan') === 'papan' && str(p, 'papan', 'kayu') === 'none')
      out.push({ level: 'info', message: 'Tanpa papan, dudukan & sandaran belum ada: pilih bahan papan atau dudukan plat besi.', fix: { label: 'Dudukan plat besi', params: { jok: 'plat' } } });
    out.push({ level: 'info', message: `Panjang keseluruhan ±${Math.round(bd.W)} cm. Sisakan ±60 cm di depan dudukan untuk lutut dan lalu-lalang.` });
    return out;
  },
};
