import { FrameHinge } from '../types/kitchen';
import { Board, Params, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, board, bool, materialParams, memberFactory, num, r1, str } from './common';

/**
 * Rak sepeda & parkir. Bentuk rangka (param `model`):
 * - sisir: dua rel lantai memanjang, tiap sisi celah roda berupa segitiga tegak (tiang + batang miring), satu muka
 * - dua-sisi: bingkai lantai + dua tiang ujung + balok atas, batang celah miring dari rel depan & belakang bergantian
 * - gelombang: satu batang zig-zag naik-turun di bidang tegak, tiap lembah menapak di kaki melintang
 * - gawang-u: deret gawang U terbalik melintang (dua tiang + palang atas + palang tengah) dirangkai dua rel lantai
 * - bintang: tiang pendek di tengah kaki silang, cincin atas kecil + cincin lantai, celah roda memancar melingkar
 * - dua-tingkat: 4 tiang + balok atas, talang roda lantai dan talang roda atas bergantian (sepeda susun 2 lantai)
 * - tiang-dinding: dua tiang tembok dari lantai, palang atas berkait tegak + palang penahan ban bawah
 * - lengan-dinding: dua tiang tembok pendek (tidak sampai lantai), pasangan lengan miring naik bertopang siku per tingkat
 * - kait-lipat: rel tembok atas & bawah tanpa tiang lantai, kait berengsel yang bisa dilipat rapat ke tembok
 * - plafon: dua balok plafon, batang turun berkait per sepeda, sepeda tergantung terbalik
 * - bersandar: dua tiang miring bersandar ke tembok, tapak lantai, lengan mendatar per tingkat + papan helm
 * - lantai-plafon: dua tiang tegak dijepit plat lantai & plat plafon, lengan dua muka per tingkat
 * - gravitasi: bingkai tapak lantai, dua tiang condong ke belakang, kait roda depan di atas + talang ban bawah
 */
const MODELS = [
  { value: 'sisir', label: 'Slot sisir lantai', desc: 'Celah roda segitiga berjajar, satu muka' },
  { value: 'dua-sisi', label: 'Slot dua sisi', desc: 'Celah miring bergantian depan & belakang' },
  { value: 'gelombang', label: 'Gelombang zig-zag', desc: 'Batang naik-turun, sepeda di kedua sisi' },
  { value: 'gawang-u', label: 'Gawang U berjajar', desc: 'Sepeda bersandar di tiap gawang' },
  { value: 'bintang', label: 'Bintang melingkar', desc: 'Celah roda memancar dari tiang tengah' },
  { value: 'dua-tingkat', label: 'Parkir dua tingkat', desc: 'Talang roda bawah & atas bergantian' },
  { value: 'tiang-dinding', label: 'Tiang dinding + kait tegak', desc: 'Sepeda digantung tegak, ban belakang ditahan' },
  { value: 'lengan-dinding', label: 'Lengan dinding mendatar', desc: 'Sepeda digantung mendatar per tingkat' },
  { value: 'kait-lipat', label: 'Kait dinding lipat', desc: 'Kait dilipat rapat ke tembok saat kosong' },
  { value: 'plafon', label: 'Gantung plafon', desc: 'Sepeda tergantung terbalik di plafon' },
  { value: 'bersandar', label: 'Rak bersandar tembok', desc: 'Tiang miring, lengan sepeda + papan helm' },
  { value: 'lantai-plafon', label: 'Tiang lantai–plafon', desc: 'Dua tiang dijepit lantai & plafon, lengan dua muka' },
  { value: 'gravitasi', label: 'Stand tegak (gravitasi)', desc: 'Berdiri sendiri, sepeda tegak di roda belakang' },
];
const KEYS = MODELS.map((m) => m.value);
const model = (p: Params) => {
  const m = str(p, 'model', 'sisir');
  return KEYS.includes(m) ? m : 'sisir';
};
const isM = (p: Params, ...m: string[]) => m.includes(model(p));

const ARM_MODELS = ['lengan-dinding', 'bersandar', 'lantai-plafon'];
const SLOT_MODELS = ['sisir', 'dua-sisi', 'bintang', 'dua-tingkat', 'tiang-dinding', 'gravitasi'];
const HANG_MODELS = ['tiang-dinding', 'kait-lipat', 'gravitasi'];

/** Celah bersih antar batang (cm) per jenis ban */
const GAP: Record<string, number> = { tipis: 4.5, mtb: 7, fat: 12 };
/**
 * Setengah lebar jejak potongan rata lantai dari batang miring berpenampang t (cm) yang
 * menempuh (dh mendatar, dy tegak): ujung yang dipotong datar melebar menjadi (t/2)/|cos|.
 */
const flatHalf = (t: number, dh: number, dy: number) => (t / 2) * (Math.hypot(dh, dy) / Math.max(1e-6, Math.abs(dy)));

/** Diameter roda luar (cm) */
const wheelDia = (p: Params) => num(p, 'ban', 26) * 2.54 + (str(p, 'lebarBan', 'mtb') === 'fat' ? 10 : 5);
/** Jarak sumbu roda (cm), perkiraan */
const wheelBase = (p: Params) => wheelDia(p) * 1.5;
/** Tinggi kait minimal agar sepeda tegak tidak menyentuh lantai dengan ban depan */
const needHang = (p: Params) => Math.round(wheelBase(p) + wheelDia(p) / 2 + 10);

export const RAK_SEPEDA: ProductDef = {
  id: 'rak-sepeda',
  name: 'Rak sepeda & parkir',
  tagline: 'parkir rumah · sekolah · kantor · garasi',
  icon: 'M6 34h48M12 34l0-14l8 14M24 34l0-14l8 14M36 34l0-14l8 14M48 34l0-14',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['model', 'jumlah', 'tingkat', 'jarak', 'tinggi', 'plafon', 'turun', 'dalam'] },
    { id: 'bentuk', title: 'Ban & helm', keys: ['ban', 'lebarBan', 'papanHelm'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Selesai', keys: [] },
  ],
  params: [
    { key: 'model', label: 'Bentuk rangka', type: 'choice', options: MODELS },
    {
      key: 'jumlah',
      label: 'Jumlah sepeda',
      type: 'number',
      min: 1,
      max: 12,
      step: 1,
      help: 'Berapa sepeda yang diparkir sekaligus.',
      marks: [{ value: 3, label: 'rumah' }, { value: 5, label: 'kos' }, { value: 8, label: 'sekolah' }],
      showIf: (p) => !ARM_MODELS.includes(String(p.model)),
    },
    {
      key: 'tingkat',
      label: 'Jumlah tingkat lengan',
      type: 'number',
      min: 1,
      max: 3,
      step: 1,
      help: 'Satu tingkat = satu sepeda digantung mendatar (lantai–plafon: dua sepeda, kiri & kanan).',
      showIf: (p) => ARM_MODELS.includes(String(p.model)),
    },
    {
      key: 'jarak',
      label: 'Jarak antar sepeda',
      type: 'number',
      unit: 'cm',
      min: 25,
      max: 80,
      step: 1,
      help: 'Jarak tengah ke tengah. Stang sepeda dewasa ±60 cm, jadi di bawah 35 cm stang harus selang-seling.',
      marks: [{ value: 35, label: 'rapat' }, { value: 45, label: 'umum' }, { value: 60, label: 'lega' }],
      showIf: (p) => !ARM_MODELS.includes(String(p.model)),
    },
    {
      key: 'tinggi',
      label: 'Tinggi rak',
      type: 'number',
      unit: 'cm',
      min: 30,
      max: 220,
      step: 1,
      help: 'Slot lantai ±35–45 cm, gawang ±80 cm, dua tingkat: tinggi talang atas, kait tegak ±180 cm, lengan: tinggi lengan teratas.',
      marks: [{ value: 40, label: 'slot' }, { value: 80, label: 'gawang' }, { value: 180, label: 'kait tegak' }],
      showIf: (p) => p.model !== 'plafon',
    },
    {
      key: 'plafon',
      label: 'Tinggi plafon',
      type: 'number',
      unit: 'cm',
      min: 220,
      max: 350,
      step: 1,
      help: 'Ukur dari lantai ke plafon / balok garasi.',
      marks: [{ value: 270, label: 'rumah' }, { value: 300, label: 'garasi' }],
      showIf: (p) => p.model === 'plafon' || p.model === 'lantai-plafon',
    },
    {
      key: 'turun',
      label: 'Panjang batang gantung',
      type: 'number',
      unit: 'cm',
      min: 20,
      max: 100,
      step: 1,
      help: 'Jarak dari plafon ke kait. Makin pendek makin tinggi sepeda tergantung.',
      showIf: (p) => p.model === 'plafon',
    },
    {
      key: 'dalam',
      label: 'Kedalaman / panjang tapak',
      type: 'number',
      unit: 'cm',
      min: 25,
      max: 200,
      step: 1,
      help: 'Slot lantai: panjang celah roda. Dua tingkat: panjang talang (±180 cm). Bersandar: jarak kaki dari tembok.',
      marks: [{ value: 40, label: 'slot' }, { value: 180, label: 'talang' }],
      showIf: (p) => ['sisir', 'dua-sisi', 'gelombang', 'gawang-u', 'dua-tingkat', 'bersandar', 'gravitasi'].includes(String(p.model)),
    },
    {
      key: 'ban',
      label: 'Ukuran ban',
      type: 'number',
      unit: 'inci',
      min: 12,
      max: 29,
      step: 1,
      help: 'Angka di dinding ban. Sepeda anak 12–20, dewasa 26–29.',
      marks: [{ value: 16, label: 'anak' }, { value: 20, label: 'BMX / lipat' }, { value: 26, label: 'MTB' }, { value: 29, label: '29er' }],
    },
    {
      key: 'lebarBan',
      label: 'Jenis ban',
      type: 'choice',
      options: [
        { value: 'tipis', label: 'Ban tipis', desc: 'Sepeda balap / jalan raya' },
        { value: 'mtb', label: 'Ban sedang', desc: 'MTB, BMX, sepeda lipat' },
        { value: 'fat', label: 'Ban gendut', desc: 'Fat bike, sepeda listrik' },
      ],
      help: 'Menentukan lebar celah roda.',
      showIf: (p) => SLOT_MODELS.includes(String(p.model)),
    },
    {
      key: 'papanHelm',
      label: 'Papan helm / perkakas',
      type: 'toggle',
      help: 'Papan menyatu di atas rangka untuk helm, pompa, dan kunci.',
      showIf: (p) => ['tiang-dinding', 'bersandar', 'gravitasi'].includes(String(p.model)),
    },
    ...materialParams(true),
  ],
  defaults: {
    model: 'sisir',
    jumlah: 5,
    tingkat: 2,
    jarak: 40,
    tinggi: 40,
    plafon: 270,
    turun: 40,
    dalam: 40,
    ban: 26,
    lebarBan: 'mtb',
    papanHelm: true,
    pipa: '30',
    papan: 'kayu',
    warna: '#1f2226',
  },
  groups: [
    { id: 'parkir-lantai', name: 'Parkir lantai', desc: 'Slot roda berjajar untuk rumah, sekolah, kantor, kos' },
    { id: 'sepeda-dinding', name: 'Gantung dinding & plafon', desc: 'Sepeda digantung tegak / mendatar di tembok atau plafon' },
    { id: 'rak-garasi', name: 'Rak garasi', desc: 'Rak sepeda berdiri / bersandar, bisa dengan papan helm' },
  ],
  signature: (p) => `rak-sepeda:${model(p)}`,
  presets: [
    {
      id: 'sisir',
      group: 'parkir-lantai',
      name: 'Slot sisir lantai',
      desc: 'dua rel lantai, tiap celah roda diapit segitiga tegak, sepeda masuk dari satu sisi',
      params: { model: 'sisir', jumlah: 5, jarak: 40, tinggi: 40, dalam: 40 },
      sizes: [
        { label: '3 sepeda (rumah)', desc: '120 × 40 × 40 cm', params: { jumlah: 3, jarak: 40, tinggi: 40, dalam: 40 } },
        { label: '5 sepeda (kos)', desc: '200 × 40 × 40 cm', params: { jumlah: 5, jarak: 40, tinggi: 40, dalam: 40 } },
        { label: '8 sepeda (sekolah)', desc: '280 × 45 × 45 cm', params: { jumlah: 8, jarak: 35, tinggi: 45, dalam: 45 } },
        { label: 'Sepeda anak 4', desc: '120 × 35 × 30 cm', params: { jumlah: 4, jarak: 30, tinggi: 30, dalam: 35, ban: 16 } },
      ],
    },
    {
      id: 'dua-sisi',
      group: 'parkir-lantai',
      name: 'Slot dua sisi',
      desc: 'bingkai lantai + balok atas di dua tiang ujung, batang celah miring bergantian dari depan & belakang',
      params: { model: 'dua-sisi', jumlah: 6, jarak: 50, tinggi: 70, dalam: 60 },
      sizes: [
        { label: '6 sepeda', desc: '175 × 60 × 70 cm', params: { jumlah: 6, jarak: 50, tinggi: 70, dalam: 60 } },
        { label: '10 sepeda (sekolah)', desc: '275 × 65 × 75 cm', params: { jumlah: 10, jarak: 50, tinggi: 75, dalam: 65 } },
        { label: '4 sepeda', desc: '125 × 60 × 70 cm', params: { jumlah: 4, jarak: 50, tinggi: 70, dalam: 60 } },
      ],
    },
    {
      id: 'gelombang',
      group: 'parkir-lantai',
      name: 'Rak gelombang zig-zag',
      desc: 'satu batang zig-zag naik-turun, tiap lembah menapak di kaki melintang, sepeda di kedua sisi',
      params: { model: 'gelombang', jumlah: 6, jarak: 45, tinggi: 80, dalam: 50 },
      sizes: [
        { label: '6 sepeda', desc: '216 × 50 × 80 cm', params: { jumlah: 6, jarak: 45, tinggi: 80, dalam: 50 } },
        { label: '4 sepeda', desc: '144 × 50 × 80 cm', params: { jumlah: 4, jarak: 45, tinggi: 80, dalam: 50 } },
        { label: '10 sepeda (kantor)', desc: '400 × 55 × 85 cm', params: { jumlah: 10, jarak: 50, tinggi: 85, dalam: 55 } },
      ],
    },
    {
      id: 'gawang-u',
      group: 'parkir-lantai',
      name: 'Gawang U berjajar',
      desc: 'deret gawang U terbalik melintang dirangkai dua rel lantai, sepeda bersandar di kedua sisi gawang',
      params: { model: 'gawang-u', jumlah: 6, jarak: 45, tinggi: 80, dalam: 70 },
      sizes: [
        { label: '6 sepeda (3 gawang)', desc: '270 × 70 × 80 cm', params: { jumlah: 6, jarak: 45, tinggi: 80, dalam: 70 } },
        { label: '4 sepeda (2 gawang)', desc: '180 × 70 × 80 cm', params: { jumlah: 4, jarak: 45, tinggi: 80, dalam: 70 } },
        { label: '10 sepeda (5 gawang)', desc: '500 × 75 × 85 cm', params: { jumlah: 10, jarak: 50, tinggi: 85, dalam: 75 } },
      ],
    },
    {
      id: 'bintang',
      group: 'parkir-lantai',
      name: 'Rak bintang melingkar',
      desc: 'tiang pendek di tengah, celah roda memancar dari cincin atas ke cincin lantai',
      params: { model: 'bintang', jumlah: 6, jarak: 35, tinggi: 50 },
      sizes: [
        { label: '6 sepeda', desc: 'Ø 90 × 50 cm', params: { jumlah: 6, jarak: 35, tinggi: 50 } },
        { label: '8 sepeda (taman)', desc: 'Ø 120 × 55 cm', params: { jumlah: 8, jarak: 35, tinggi: 55 } },
        { label: '5 sepeda anak', desc: 'Ø 90 × 40 cm', params: { jumlah: 5, jarak: 30, tinggi: 40, ban: 16 } },
      ],
    },
    {
      id: 'dua-tingkat',
      group: 'parkir-lantai',
      name: 'Parkir dua tingkat',
      desc: '4 tiang + balok atas, talang roda lantai dan talang roda atas bergantian',
      params: { model: 'dua-tingkat', jumlah: 4, jarak: 40, tinggi: 150, dalam: 180, lebarBan: 'mtb' },
      sizes: [
        { label: '4 sepeda', desc: '160 × 180 × 150 cm', params: { jumlah: 4, jarak: 40, tinggi: 150, dalam: 180 } },
        { label: '6 sepeda', desc: '240 × 180 × 150 cm', params: { jumlah: 6, jarak: 40, tinggi: 150, dalam: 180 } },
        { label: '8 sepeda (stasiun)', desc: '360 × 190 × 160 cm', params: { jumlah: 8, jarak: 45, tinggi: 160, dalam: 190 } },
      ],
    },
    {
      id: 'tiang-dinding',
      group: 'sepeda-dinding',
      name: 'Tiang dinding + kait tegak',
      desc: 'dua tiang tembok dari lantai, palang atas berkait tegak + palang penahan ban belakang',
      params: { model: 'tiang-dinding', jumlah: 4, jarak: 40, tinggi: 195, papanHelm: true },
      sizes: [
        { label: '4 sepeda', desc: '160 × 195 cm + papan helm', params: { jumlah: 4, jarak: 40, tinggi: 195 } },
        { label: '3 sepeda', desc: '120 × 195 cm', params: { jumlah: 3, jarak: 40, tinggi: 195 } },
        { label: '6 sepeda (rapat)', desc: '210 × 200 cm', params: { jumlah: 6, jarak: 35, tinggi: 200 } },
        { label: 'Sepeda anak 3', desc: '105 × 150 cm', params: { jumlah: 3, jarak: 35, tinggi: 150, ban: 16 } },
      ],
    },
    {
      id: 'lengan-dinding',
      group: 'sepeda-dinding',
      name: 'Lengan dinding mendatar',
      desc: 'dua tiang tembok pendek, pasangan lengan miring naik bertopang siku tiap tingkat',
      params: { model: 'lengan-dinding', tingkat: 2, tinggi: 170 },
      sizes: [
        { label: '2 sepeda', desc: 'lengan atas 170 cm', params: { tingkat: 2, tinggi: 170 } },
        { label: '1 sepeda', desc: 'lengan 150 cm', params: { tingkat: 1, tinggi: 150 } },
        { label: '3 sepeda (garasi tinggi)', desc: 'lengan atas 200 cm', params: { tingkat: 3, tinggi: 200 } },
      ],
    },
    {
      id: 'plafon',
      group: 'sepeda-dinding',
      name: 'Gantung plafon',
      desc: 'dua balok plafon, batang turun berkait per sepeda, sepeda tergantung terbalik',
      params: { model: 'plafon', jumlah: 2, jarak: 50, plafon: 270, turun: 40 },
      sizes: [
        { label: '2 sepeda (garasi rumah)', desc: 'plafon 270, turun 40', params: { jumlah: 2, jarak: 50, plafon: 270, turun: 40 } },
        { label: '3 sepeda (garasi tinggi)', desc: 'plafon 300, turun 60', params: { jumlah: 3, jarak: 50, plafon: 300, turun: 60 } },
        { label: '1 sepeda', desc: 'plafon 260, turun 30', params: { jumlah: 1, jarak: 50, plafon: 260, turun: 30 } },
      ],
    },
    {
      id: 'lantai-plafon',
      group: 'rak-garasi',
      name: 'Tiang lantai–plafon',
      desc: 'dua tiang tegak dijepit plat lantai & plat plafon, lengan dua muka tiap tingkat',
      params: { model: 'lantai-plafon', tingkat: 2, tinggi: 170, plafon: 270 },
      sizes: [
        { label: '4 sepeda', desc: '2 tingkat, plafon 270', params: { tingkat: 2, tinggi: 170, plafon: 270 } },
        { label: '2 sepeda', desc: '1 tingkat, plafon 250', params: { tingkat: 1, tinggi: 150, plafon: 250 } },
        { label: '6 sepeda', desc: '3 tingkat, plafon 300', params: { tingkat: 3, tinggi: 200, plafon: 300 } },
      ],
    },
    {
      id: 'gravitasi',
      group: 'rak-garasi',
      name: 'Stand tegak (gravitasi)',
      desc: 'bingkai tapak lantai, dua tiang condong ke belakang, kait roda depan di atas + talang ban bawah',
      params: { model: 'gravitasi', jumlah: 2, jarak: 40, tinggi: 185, dalam: 60, papanHelm: true },
      sizes: [
        { label: '2 sepeda + helm', desc: '90 × 60 × 185 cm', params: { jumlah: 2, jarak: 40, tinggi: 185, dalam: 60 } },
        { label: '1 sepeda', desc: '55 × 55 × 185 cm', params: { jumlah: 1, jarak: 45, tinggi: 185, dalam: 55 } },
        { label: '3 sepeda (rapat)', desc: '115 × 60 × 190 cm', params: { jumlah: 3, jarak: 35, tinggi: 190, dalam: 60 } },
      ],
    },
  ],
  summary: (p) => {
    const m = model(p);
    if (m === 'plafon') return `${num(p, 'jumlah')} sepeda · plafon ${num(p, 'plafon')} cm`;
    if (ARM_MODELS.includes(m)) return `${num(p, 'tingkat') * (m === 'lantai-plafon' ? 2 : 1)} sepeda · lengan atas ${num(p, 'tinggi')} cm`;
    return `${num(p, 'jumlah')} sepeda · jarak ${num(p, 'jarak')} cm · tinggi ${num(p, 'tinggi')} cm`;
  },

  build: (p) => {
    const m = model(p);
    const L = (parseInt(str(p, 'pipa', '30')) || 30) / 10;
    const b = BOARD_THICK[str(p, 'papan', 'kayu')] ?? 2.5;
    const pt: [number, number] = [L * 10, L * 10];
    const rail: [number, number] = [20, 20];
    const thin: [number, number] = [15, 15];
    const { list, add, line } = memberFactory();
    const boards: Board[] = [];
    const hinges: FrameHinge[] = [];
    const n = Math.max(1, Math.round(num(p, 'jumlah', 5)));
    const s = Math.max(25, num(p, 'jarak', 40));
    const Hp = Math.max(30, num(p, 'tinggi', 40));
    const Dp = Math.max(25, num(p, 'dalam', 40));
    const tiers = Math.max(1, Math.min(3, Math.round(num(p, 'tingkat', 2))));
    const off = (GAP[str(p, 'lebarBan', 'mtb')] ?? 7) / 2 + 1; // as batang celah dari tengah celah (batang 20×20)
    const helm = bool(p, 'papanHelm');
    let W = 0;
    let D = 0;
    let H = 0;
    let wall = false;

    if (m === 'sisir') {
      W = n * s;
      D = Dp;
      H = Hp;
      const zu = Math.max(L + 4, D * 0.35);
      [L / 2, D - L / 2].forEach((z, j) => add(`rel-${j}`, 'x', 0, L / 2, z, W, 'rail-x', `Rel lantai ${j ? 'depan' : 'belakang'}`, pt));
      for (let i = 0; i < n; i++) {
        const xc = s / 2 + i * s;
        [-1, 1].forEach((sg, k) => {
          const x = xc + sg * off;
          const nm = `celah ${i + 1} ${k ? 'kanan' : 'kiri'}`;
          const yb = L + 1;
          // alas menumpang di atas kedua rel; tegak berdiri di atas alas; miring dipotong datar,
          // ujung atasnya menempel di muka depan tegak (rata atas), ujung bawah duduk di atas alas
          add(`alas-${i}-${k}`, 'z', x, yb, 0, D, 'rail-z', `Alas ${nm}`, rail);
          add(`tegak-${i}-${k}`, 'y', x, yb + 1, zu, H - yb - 1, 'custom', `Batang tegak ${nm}`, rail);
          const zb = D - L - 2;
          let ez = 1;
          for (let it = 0; it < 4; it++) ez = flatHalf(2, zb - (zu + 1 + ez), H - yb - 1);
          line(`miring-${i}-${k}`, [x, H, zu + 1 + ez + 0.05], [x, yb + 1, zb], 'custom', `Batang miring ${nm}`, rail);
        });
      }
    } else if (m === 'dua-sisi') {
      W = ((n + 1) * s) / 2;
      D = Dp;
      H = Hp;
      const zc = D / 2;
      [L / 2, D - L / 2].forEach((z, j) => add(`rel-${j}`, 'x', 0, L / 2, z, W, 'rail-x', `Rel lantai ${j ? 'depan' : 'belakang'}`, pt));
      [L / 2, W - L / 2].forEach((x, j) => {
        const nm = j ? 'kanan' : 'kiri';
        add(`rel-ujung-${j}`, 'z', x, L / 2, L, D - 2 * L, 'rail-z', `Rel lantai ujung ${nm}`, pt);
        add(`tiang-${j}`, 'y', x, L, zc, H - L, 'post', `Tiang ujung ${nm}`, pt);
      });
      add('balok-atas', 'x', L, H - L / 2, zc, W - 2 * L, 'rail-x', 'Balok atas', pt);
      for (let i = 0; i < n; i++) {
        const xc = s / 2 + (i * s) / 2;
        const front = i % 2 === 0;
        const zf = front ? D - L / 2 : L / 2;
        const zt = zc + (front ? 1 : -1) * (L / 2 + 1);
        [-1, 1].forEach((sg, k) => {
          const x = xc + sg * off;
          line(`celah-${i}-${k}`, [x, L, zf], [x, H - L - 1, zt], 'custom', `Batang celah ${i + 1} ${front ? 'depan' : 'belakang'} ${k ? 'kanan' : 'kiri'}`, rail);
        });
      }
    } else if (m === 'gelombang') {
      const humps = Math.max(2, Math.ceil(n / 2));
      const hw = s * 1.6;
      W = humps * hw;
      D = Dp;
      H = Hp;
      const zc = D / 2;
      for (let i = 0; i <= humps; i++) {
        const x = Math.min(W - L / 2, Math.max(L / 2, i * hw));
        add(`kaki-${i}`, 'z', x, L / 2, 0, D, 'rail-z', `Kaki melintang ${i + 1}`, pt);
      }
      // Tiap lembah: batang pendek mendatar menumpang di atas kaki melintang; tiap puncak: batang pendek
      // mendatar. Batang naik & turun dipotong datar dan dilas di atas lembah / di bawah puncak,
      // berdampingan (tidak saling tembus di satu titik).
      const dy = H - 3 * L;
      let ex = L / 2;
      for (let it = 0; it < 6; it++) ex = flatHalf(L, hw / 2 - 2 * ex, dy);
      for (let i = 0; i <= humps; i++) {
        const x0 = i === 0 ? 0 : i === humps ? W - 2 * ex : i * hw - 2 * ex;
        const len = i === 0 || i === humps ? 2 * ex : 4 * ex;
        add(`lembah-${i}`, 'x', x0, L + L / 2, zc, len, 'rail-x', `Lembah gelombang ${i + 1}`, pt);
      }
      for (let i = 0; i < humps; i++) {
        const xa = i * hw + ex;
        const xb = (i + 1) * hw - ex;
        const xm = i * hw + hw / 2;
        add(`puncak-${i}`, 'x', xm - 2 * ex, H - L / 2, zc, 4 * ex, 'post', `Puncak gelombang ${i + 1}`, pt);
        line(`naik-${i}`, [xa, 2 * L, zc], [xm - ex, H - L, zc], 'post', `Gelombang ${i + 1} naik`, pt);
        line(`turun-${i}`, [xm + ex, H - L, zc], [xb, 2 * L, zc], 'post', `Gelombang ${i + 1} turun`, pt);
      }
    } else if (m === 'gawang-u') {
      const hoops = Math.max(1, Math.ceil(n / 2));
      const pitch = s * 2;
      W = hoops * pitch;
      D = Dp;
      H = Hp;
      const z0 = L / 2;
      const z1 = D - L / 2;
      [z0, z1].forEach((z, j) => add(`rel-${j}`, 'x', 0, L / 2, z, W, 'rail-x', `Rel lantai ${j ? 'depan' : 'belakang'}`, pt));
      for (let i = 0; i < hoops; i++) {
        const x = pitch / 2 + i * pitch;
        [z0, z1].forEach((z, j) => add(`tiang-${i}-${j}`, 'y', x, L, z, H - 2 * L, 'post', `Tiang gawang ${i + 1} ${j ? 'depan' : 'belakang'}`, pt));
        add(`atas-${i}`, 'z', x, H - L / 2, 0, D, 'rail-z', `Palang atas gawang ${i + 1}`, pt);
        add(`tengah-${i}`, 'z', x, Math.round(H * 0.45), L, D - 2 * L, 'rail-z', `Palang tengah gawang ${i + 1}`, rail);
      }
    } else if (m === 'bintang') {
      const k = Math.max(4, n);
      const R = Math.max(45, r1((k * s) / (2 * Math.PI * 0.75)));
      W = 2 * R;
      D = 2 * R;
      H = Hp;
      const c = R;
      const rr = R - L / 2;
      const C8 = Math.cos(Math.PI / 8);
      const S8 = Math.sin(Math.PI / 8);
      // Cincin segi delapan cara tukang las: ruas depan & belakang (sejajar X) menerus, ruas kiri & kanan
      // (sejajar Z) pendek; ruas serong dipotong rata (bidang Z) — satu ujung menempel di sisi dalam ruas
      // depan/belakang, ujung lain di muka ujung ruas kiri/kanan. Tidak ada ruas yang saling tembus.
      const ring = (id: string, nm: string, rad: number, y: number, tube: [number, number]) => {
        const t = tube[0] / 10;
        const ap = rad * C8;
        const h = rad * S8;
        const hx = h + t / 2;
        const hz = h - t;
        [-1, 1].forEach((sz, j) => add(`${id}-x${j}`, 'x', c - hx, y, c + sz * ap, 2 * hx, 'rail-x', `${nm} ruas ${sz < 0 ? 'belakang' : 'depan'}`, tube));
        [-1, 1].forEach((sx, j) => add(`${id}-z${j}`, 'z', c + sx * ap, y, c - hz, 2 * hz, 'rail-z', `${nm} ruas ${sx < 0 ? 'kiri' : 'kanan'}`, tube));
        const dxs = ap - h;
        const dzs = ap - h + t / 2;
        const ex = (t / 2) * (Math.hypot(dxs, dzs) / dzs);
        let q = 0;
        [-1, 1].forEach((sx) =>
          [-1, 1].forEach((sz) => {
            q++;
            line(`${id}-s${q}`, [c + sx * (ap - ex + t / 2), y, c + sz * hz], [c + sx * (hx - ex), y, c + sz * (ap - t / 2)], 'rail-x', `${nm} ruas serong ${q}`, tube);
          })
        );
        return { ap, t };
      };
      /** Jarak dari titik (c+ox, c+oz) searah (ux, uz) sampai garis as segi delapan berjari-jari rad */
      const hitRing = (rad: number, ox: number, oz: number, ux: number, uz: number) => {
        let best = Infinity;
        for (let q = 0; q < 8; q++) {
          const a0 = ((q * 45 + 22.5) * Math.PI) / 180;
          const a1 = (((q + 1) * 45 + 22.5) * Math.PI) / 180;
          const px = rad * Math.cos(a0), pz = rad * Math.sin(a0);
          const ex = rad * Math.cos(a1) - px, ez = rad * Math.sin(a1) - pz;
          const den = ux * ez - uz * ex;
          if (Math.abs(den) < 1e-9) continue;
          const tt = ((px - ox) * ez - (pz - oz) * ex) / den;
          const ss = ((px - ox) * uz - (pz - oz) * ux) / den;
          if (tt > 0 && ss >= -1e-6 && ss <= 1 + 1e-6) best = Math.min(best, tt);
        }
        return best;
      };
      // kaki silang lantai: kiri–kanan menerus, belakang & depan dipotong menempel di sisinya;
      // ujung kaki menempel di sisi dalam cincin lantai
      const fl = ring('cincin-lantai', 'Cincin lantai', rr, L / 2, pt);
      const kin = fl.ap - L / 2;
      add('kaki-x', 'x', c - kin, L / 2, c, 2 * kin, 'rail-x', 'Kaki silang kiri–kanan', pt);
      add('kaki-z-b', 'z', c, L / 2, c - kin, kin - L / 2, 'rail-z', 'Kaki silang belakang', pt);
      add('kaki-z-d', 'z', c, L / 2, c + L / 2, kin - L / 2, 'rail-z', 'Kaki silang depan', pt);
      add('tiang', 'y', c, L, c, H - L, 'post', 'Tiang tengah', pt);
      // cincin atas: cukup besar supaya batang celah yang bersebelahan tidak beradu
      const r0 = Math.max(14, r1((k * (2 * off + 4)) / (2 * Math.PI * C8)));
      const yTop = H - 1;
      const tr = ring('cincin-atas', 'Cincin atas', r0, yTop, rail);
      // jari-jari: dari sisi tiang ke sisi dalam ruas cincin atas (lurus, sejajar sumbu)
      const jin = tr.ap - tr.t / 2 - L / 2;
      add('jari-1', 'x', c + L / 2, yTop, c, jin, 'custom', 'Jari-jari cincin atas 1', rail);
      add('jari-2', 'z', c, yTop, c + L / 2, jin, 'custom', 'Jari-jari cincin atas 2', rail);
      add('jari-3', 'x', c - L / 2 - jin, yTop, c, jin, 'custom', 'Jari-jari cincin atas 3', rail);
      add('jari-4', 'z', c, yTop, c - L / 2 - jin, jin, 'custom', 'Jari-jari cincin atas 4', rail);
      // batang celah: dipotong datar, ujung atas di bawah cincin atas, ujung bawah berdiri di atas cincin lantai
      for (let i = 0; i < k; i++) {
        const a = (2 * Math.PI * i) / k + Math.PI / k;
        const u = [Math.cos(a), Math.sin(a)];
        const pv = [-Math.sin(a), Math.cos(a)];
        [-1, 1].forEach((sg, q) => {
          const ox = sg * off * pv[0];
          const oz = sg * off * pv[1];
          const tT = hitRing(r0, ox, oz, u[0], u[1]);
          const tB = hitRing(rr, ox, oz, u[0], u[1]);
          const top: [number, number, number] = [c + ox + tT * u[0], yTop - tr.t / 2, c + oz + tT * u[1]];
          const bot: [number, number, number] = [c + ox + tB * u[0], L, c + oz + tB * u[1]];
          line(`celah-${i}-${q}`, top, bot, 'custom', `Batang celah ${i + 1} ${q ? 'kanan' : 'kiri'}`, rail);
        });
      }
    } else if (m === 'dua-tingkat') {
      const nn = Math.max(2, n);
      W = Math.max(80, nn * s);
      D = Math.max(120, Dp);
      H = Hp;
      const zp = [r1(D * 0.3), r1(D * 0.7)];
      const xs = [L / 2, W - L / 2];
      // rel lantai melintang di bawah tiang
      zp.forEach((z, j) => add(`rel-lantai-${j}`, 'x', 0, L / 2, z, W, 'rail-x', `Rel lantai ${j ? 'depan' : 'belakang'}`, pt));
      xs.forEach((x, i) =>
        zp.forEach((z, j) => add(`tiang-${i}-${j}`, 'y', x, L, z, H - L, 'post', `Tiang ${i ? 'kanan' : 'kiri'} ${j ? 'depan' : 'belakang'}`, pt))
      );
      zp.forEach((z, j) => add(`balok-${j}`, 'x', 0, H + L / 2, z, W, 'rail-x', `Balok atas ${j ? 'depan' : 'belakang'}`, pt));
      xs.forEach((x, i) => add(`ujung-${i}`, 'z', x, H - L / 2, zp[0] + L / 2, zp[1] - zp[0] - L, 'rail-z', `Palang ujung ${i ? 'kanan' : 'kiri'}`, rail));
      for (let i = 0; i < nn; i++) {
        const xc = s / 2 + i * s;
        const up = i % 2 === 1;
        const y = up ? H + L + 1 : L + 1;
        [-1, 1].forEach((sg, q) => {
          const x = Math.min(W - L - 1, Math.max(L + 1, xc + sg * off));
          add(`talang-${i}-${q}`, 'z', x, y, 0, D, 'rail-z', `Talang roda ${up ? 'atas' : 'bawah'} ${i + 1} ${q ? 'kanan' : 'kiri'}`, rail);
        });
        add(`penahan-${i}`, 'x', xc - off, y + 2, 1, 2 * off, 'custom', `Penahan ban ${up ? 'atas' : 'bawah'} ${i + 1}`, rail);
      }
      H = H + L + 2;
    } else if (m === 'tiang-dinding') {
      wall = true;
      W = Math.max(60, n * s);
      H = Hp;
      const yTop = helm ? H - 18 : H - L / 2;
      const yLow = 28;
      const hook = 16;
      [L / 2, W - L / 2].forEach((x, j) => add(`tiang-${j}`, 'y', x, 0, L / 2, H, 'post', `Tiang dinding ${j ? 'kanan' : 'kiri'}`, pt));
      add('palang-kait', 'x', L, yTop, L / 2, W - 2 * L, 'rail-x', 'Palang kait atas', pt);
      add('palang-ban', 'x', L, yLow, L / 2, W - 2 * L, 'rail-x', 'Palang penahan ban', pt);
      for (let i = 0; i < n; i++) {
        const xc = W / 2 + (i - (n - 1) / 2) * s;
        const len = i % 2 ? hook + 10 : hook;
        add(`kait-${i}`, 'z', xc, yTop, L, len, 'custom', `Kait sepeda ${i + 1}`, rail);
        add(`ujung-kait-${i}`, 'y', xc, yTop + 1, L + len - 1, 7, 'custom', `Ujung kait ${i + 1}`, thin);
        [-1, 1].forEach((sg, q) => add(`slot-${i}-${q}`, 'z', xc + sg * off, yLow, L, 14, 'custom', `Penahan ban ${i + 1} ${q ? 'kanan' : 'kiri'}`, rail));
      }
      D = L + hook + 12;
      if (helm) {
        const dh = 28;
        [L / 2, W - L / 2].forEach((x, j) => add(`lengan-helm-${j}`, 'z', x, H - L / 2, L, dh - L, 'rail-z', `Lengan papan helm ${j ? 'kanan' : 'kiri'}`, pt));
        if (b > 0) boards.push(board('papan-helm', 'Papan helm / perkakas', 0, W, H, H + b, L, dh));
        H += b;
        D = Math.max(D, dh);
      }
    } else if (m === 'lengan-dinding') {
      wall = true;
      W = 50;
      const top = Hp;
      const ys = Array.from({ length: tiers }, (_, i) => top - i * 50);
      const yLo = Math.max(10, ys[ys.length - 1] - 25);
      const yHi = top + 12;
      const A = 32;
      const rise = A * Math.tan((10 * Math.PI) / 180);
      [L / 2, W - L / 2].forEach((x, j) => add(`tiang-${j}`, 'y', x, yLo, L / 2, yHi - yLo, 'post', `Tiang dinding ${j ? 'kanan' : 'kiri'}`, pt));
      [yLo + L / 2, yHi - L / 2].forEach((y, j) => add(`palang-${j}`, 'x', L, y, L / 2, W - 2 * L, 'rail-x', `Palang dinding ${j ? 'atas' : 'bawah'}`, rail));
      ys.forEach((y, t) =>
        [L / 2, W - L / 2].forEach((x, j) => {
          const nm = `tingkat ${t + 1} ${j ? 'kanan' : 'kiri'}`;
          line(`lengan-${t}-${j}`, [x, y, L], [x, y + rise, L + A], 'custom', `Lengan ${nm}`, pt);
          add(`ujung-${t}-${j}`, 'y', x, y + rise + L / 2, L + A - 1, 6, 'custom', `Penahan ujung lengan ${nm}`, thin);
          // siku dipotong datar: ujung bawah menempel di muka tiang (tidak masuk ke dalam tiang)
          const yS1 = y + rise * 0.6 - L / 2 - 0.6;
          let ez = 0.75;
          for (let it = 0; it < 4; it++) ez = flatHalf(1.5, A * 0.6 - ez, yS1 - (y - 16));
          line(`siku-${t}-${j}`, [x, y - 16, L + ez + 0.05], [x, yS1, L + A * 0.6], 'custom', `Siku penguat ${nm}`, thin);
        })
      );
      D = L + A + 1;
      H = Math.max(yHi, top + rise + L / 2 + 6);
    } else if (m === 'kait-lipat') {
      wall = true;
      W = Math.max(50, n * s);
      H = Hp;
      const yLow = Math.max(20, H - wheelBase(p) - 10);
      const hook = 30;
      [L / 2, W - L / 2].forEach((x, j) => {
        add(`plat-atas-${j}`, 'y', x, H - 10, L / 2, 20, 'post', `Plat dinding atas ${j ? 'kanan' : 'kiri'}`, pt);
        add(`plat-bawah-${j}`, 'y', x, yLow - 10, L / 2, 20, 'post', `Plat dinding bawah ${j ? 'kanan' : 'kiri'}`, pt);
      });
      add('rel-atas', 'x', L, H, L / 2, W - 2 * L, 'rail-x', 'Rel dinding atas (kait)', pt);
      add('rel-bawah', 'x', L, yLow, L / 2, W - 2 * L, 'rail-x', 'Rel dinding bawah (sandaran ban belakang)', pt);
      for (let i = 0; i < n; i++) {
        const xc = W / 2 + (i - (n - 1) / 2) * s;
        const id = `kait-${i}`;
        add(id, 'z', xc, H, L, hook, 'custom', `Kait lipat ${i + 1}`, rail);
        add(`ujung-kait-${i}`, 'y', xc, H + 1, L + hook - 1, 7, 'custom', `Ujung kait ${i + 1}`, thin);
        hinges.push({ id: `engsel-kait-${i}`, memberId: id, type: 'barrel-weld', pos: 0, side: 'end', foldAxis: 'x', foldSign: 1, carry: true, label: `Engsel kait ${i + 1} (dilipat ke tembok)` });
      }
      D = L + hook + 1;
      H = H + 10;
    } else if (m === 'plafon') {
      const Hc = Math.max(220, num(p, 'plafon', 270));
      const drop = Math.max(20, num(p, 'turun', 40));
      const wb = wheelBase(p);
      const xa = 10;
      const xb = r1(10 + wb);
      W = xb + 10;
      D = Math.max(40, n * s);
      H = Hc;
      const yb = Hc - L / 2;
      [xa, xb].forEach((x, j) => add(`balok-${j}`, 'z', x, yb, 0, D, 'rail-z', `Balok plafon ${j ? 'kanan' : 'kiri'}`, pt));
      [L / 2, D - L / 2].forEach((z, j) => add(`ikat-${j}`, 'x', xa + L / 2, yb, z, xb - xa - L, 'rail-x', `Palang ikat plafon ${j ? 'depan' : 'belakang'}`, pt));
      const yk = Hc - L - drop;
      for (let i = 0; i < n; i++) {
        const z = D / 2 + (i - (n - 1) / 2) * s;
        [xa, xb].forEach((x, j) => {
          const sg = j ? -1 : 1;
          const nm = `sepeda ${i + 1} ${j ? 'belakang' : 'depan'}`;
          add(`turun-${i}-${j}`, 'y', x, yk, z, drop, 'post', `Batang gantung ${nm}`, rail);
          line(`kait-${i}-${j}`, [x, yk - 1, z], [x + sg * 10, yk - 1, z], 'custom', `Kait roda ${nm}`, rail);
          add(`ujung-${i}-${j}`, 'y', x + sg * 10, yk, z, 6, 'custom', `Ujung kait ${nm}`, thin);
        });
      }
    } else if (m === 'bersandar') {
      wall = true;
      W = 60;
      H = Hp;
      const zb = Math.max(25, Dp - L / 2);
      const zAt = (y: number) => zb + ((L / 2 - zb) * y) / H; // as tiang pada tinggi y
      const xs = [L / 2, W - L / 2];
      xs.forEach((x, j) => line(`tiang-${j}`, [x, L, zb], [x, H - L, L / 2], 'post', `Tiang bersandar ${j ? 'kanan' : 'kiri'}`, pt));
      add('tapak', 'x', 0, L / 2, zb, W, 'rail-x', 'Tapak lantai', pt);
      add('sandaran', 'x', 0, H - L / 2, L / 2, W, 'rail-x', 'Palang sandar tembok', pt);
      const A = 35;
      const yTop = helm ? H - 40 : H - 20;
      let zMax = zb + L / 2;
      for (let t = 0; t < tiers; t++) {
        const y = yTop - t * 48;
        if (y < 40) break;
        const z0 = zAt(y);
        xs.forEach((x, j) => {
          const nm = `tingkat ${t + 1} ${j ? 'kanan' : 'kiri'}`;
          add(`lengan-${t}-${j}`, 'z', x, y, z0 + L / 2, A, 'custom', `Lengan sepeda ${nm}`, pt);
          add(`ujung-${t}-${j}`, 'y', x, y + L / 2, z0 + L / 2 + A - 1, 6, 'custom', `Penahan ujung ${nm}`, thin);
          line(`siku-${t}-${j}`, [x, y - 15, zAt(y - 15) + L / 2 + 0.6], [x, y - L / 2 - 0.6, z0 + L / 2 + A * 0.6], 'custom', `Siku penguat ${nm}`, thin);
        });
        zMax = Math.max(zMax, z0 + L / 2 + A);
      }
      if (helm) {
        const y = H - 14;
        const z0 = zAt(y);
        const dh = 26;
        xs.forEach((x, j) => add(`lengan-helm-${j}`, 'z', x, y, z0 + L / 2, dh, 'rail-z', `Lengan papan helm ${j ? 'kanan' : 'kiri'}`, pt));
        add('bibir-helm', 'x', L, y, z0 + L / 2 + dh - 1, W - 2 * L, 'rail-x', 'Palang depan papan helm', rail);
        if (b > 0) boards.push(board('papan-helm', 'Papan helm / perkakas', 0, W, y + L / 2, y + L / 2 + b, z0, z0 + L / 2 + dh));
        zMax = Math.max(zMax, z0 + L / 2 + dh);
      }
      D = zMax;
    } else if (m === 'lantai-plafon') {
      const Hc = Math.max(220, num(p, 'plafon', 270));
      W = 55;
      const A = 32;
      D = 2 * A + L;
      H = Hc;
      const zc = D / 2;
      const pl = 0.6;
      const xs = [L / 2, W - L / 2];
      xs.forEach((x, j) => {
        add(`tiang-${j}`, 'y', x, pl, zc, Hc - 2 * pl, 'post', `Tiang ${j ? 'kanan' : 'kiri'} (dijepit lantai–plafon)`, pt);
        boards.push({ ...board(`plat-lantai-${j}`, `Plat lantai ${j ? 'kanan' : 'kiri'}`, x - 7, x + 7, 0, pl, zc - 7, zc + 7), steelMm: 6 });
        boards.push({ ...board(`plat-plafon-${j}`, `Plat plafon ${j ? 'kanan' : 'kiri'}`, x - 7, x + 7, Hc - pl, Hc, zc - 7, zc + 7), steelMm: 6 });
      });
      [25, Hc - 25].forEach((y, j) => add(`ikat-${j}`, 'x', L, y, zc, W - 2 * L, 'rail-x', `Palang ikat ${j ? 'atas' : 'bawah'}`, rail));
      const top = Math.min(Hp, Hc - 40);
      for (let t = 0; t < tiers; t++) {
        const y = top - t * 50;
        if (y < 40) break;
        add(`ikat-lengan-${t}`, 'x', L, y - 20, zc, W - 2 * L, 'rail-x', `Palang ikat tingkat ${t + 1}`, rail);
        xs.forEach((x, j) =>
          [-1, 1].forEach((sg, q) => {
            const nm = `tingkat ${t + 1} ${j ? 'kanan' : 'kiri'} ${q ? 'depan' : 'belakang'}`;
            const z0 = zc + sg * (L / 2);
            line(`lengan-${t}-${j}-${q}`, [x, y, z0], [x, y, z0 + sg * A], 'custom', `Lengan ${nm}`, pt);
            add(`ujung-${t}-${j}-${q}`, 'y', x, y + L / 2, z0 + sg * (A - 1), 6, 'custom', `Penahan ujung ${nm}`, thin);
            // siku dipotong datar: ujung bawah menempel di muka tiang (tidak masuk ke dalam tiang)
            let ez = 0.75;
            for (let it = 0; it < 4; it++) ez = flatHalf(1.5, A * 0.6 - ez, 15 - L / 2 - 0.6);
            line(`siku-${t}-${j}-${q}`, [x, y - 15, z0 + sg * (ez + 0.05)], [x, y - L / 2 - 0.6, z0 + sg * A * 0.6], 'custom', `Siku penguat ${nm}`, thin);
          })
        );
      }
    } else {
      // gravitasi
      W = Math.max(45, n * s + 10);
      D = Dp;
      H = Hp;
      const zp0 = Math.min(D - L, Math.max(L + 10, D * 0.45));
      const xs = [L / 2, W - L / 2];
      [L / 2, D - L / 2].forEach((z, j) => add(`tapak-x-${j}`, 'x', 0, L / 2, z, W, 'rail-x', `Tapak ${j ? 'depan' : 'belakang'}`, pt));
      xs.forEach((x, j) => add(`tapak-z-${j}`, 'z', x, L / 2, L, D - 2 * L, 'rail-z', `Tapak ${j ? 'kanan' : 'kiri'}`, pt));
      const yTopRail = H - L / 2;
      const zt = L / 2;
      xs.forEach((x, j) => line(`tiang-${j}`, [x, L, zp0], [x, yTopRail - L / 2, zt], 'post', `Tiang condong ${j ? 'kanan' : 'kiri'}`, pt));
      add('palang-kait', 'x', 0, yTopRail, zt, W, 'rail-x', 'Palang kait atas', pt);
      const yMid = H * 0.5;
      const zMid = zp0 + ((zt - zp0) * (yMid - L)) / (yTopRail - L / 2 - L);
      add('palang-tengah', 'x', L, yMid, zMid, W - 2 * L, 'rail-x', 'Palang tengah', rail);
      for (let i = 0; i < n; i++) {
        const xc = W / 2 + (i - (n - 1) / 2) * s;
        const len = i % 2 ? 26 : 18;
        add(`kait-${i}`, 'z', xc, yTopRail, zt + L / 2, len, 'custom', `Kait roda depan ${i + 1}`, rail);
        add(`ujung-kait-${i}`, 'y', xc, yTopRail + 1, zt + L / 2 + len - 1, 7, 'custom', `Ujung kait ${i + 1}`, thin);
        [-1, 1].forEach((sg, q) => add(`talang-${i}-${q}`, 'z', xc + sg * off, L + 1, L, D - 2 * L, 'custom', `Talang ban belakang ${i + 1} ${q ? 'kanan' : 'kiri'}`, rail));
      }
      if (helm) {
        const dh = 28;
        xs.forEach((x, j) => add(`lengan-helm-${j}`, 'z', x, H + L / 2, 0, dh, 'rail-z', `Lengan papan helm ${j ? 'kanan' : 'kiri'}`, pt));
        if (b > 0) boards.push(board('papan-helm', 'Papan helm / perkakas', 0, W, H + L, H + L + b, 0, dh));
        H = H + L + b;
      } else H = H + 8;
    }

    return { members: list, boards, casters: [], W: r1(W), D: r1(D), H: r1(H), boardThick: 0, hinges: hinges.length ? hinges : undefined, wall: wall || undefined };
  },

  checks: (p, bld) => {
    const out: ProductCheck[] = [];
    const m = model(p);
    const s = num(p, 'jarak');
    const H = num(p, 'tinggi');
    const pipa = str(p, 'pipa');
    const jenis = str(p, 'lebarBan', 'mtb');
    if (['sisir', 'gawang-u', 'tiang-dinding', 'kait-lipat', 'gravitasi', 'plafon'].includes(m) && s < 30)
      out.push({ level: 'warn', message: 'Jarak antar sepeda di bawah 30 cm: stang dan pedal saling tersangkut.', fix: { label: 'Jarak 35 cm', params: { jarak: 35 } } });
    if (m === 'dua-sisi' && s < 40)
      out.push({ level: 'warn', message: 'Slot bergantian butuh jarak minimal 40 cm per sisi supaya stang tidak beradu.', fix: { label: 'Jarak 45 cm', params: { jarak: 45 } } });
    if (m === 'sisir' && (H < 28 || H > 55))
      out.push({ level: 'warn', message: 'Slot lantai yang baik setinggi 30–50 cm: terlalu rendah roda lepas, terlalu tinggi sulit memasukkan roda.', fix: { label: 'Tinggi 40 cm', params: { tinggi: 40 } } });
    if (m === 'bintang' && (H < 30 || H > 65))
      out.push({ level: 'warn', message: 'Tiang tengah rak bintang sebaiknya 35–60 cm agar roda tertahan tanpa menekan jari-jari.', fix: { label: 'Tinggi 50 cm', params: { tinggi: 50 } } });
    if (['dua-sisi', 'gelombang', 'gawang-u'].includes(m) && (H < 60 || H > 100))
      out.push({ level: 'warn', message: 'Rak sandaran sepeda paling pas setinggi 65–90 cm (setinggi sadel/rangka sepeda).', fix: { label: 'Tinggi 80 cm', params: { tinggi: 80 } } });
    if (m === 'dua-tingkat' && H < 140)
      out.push({ level: 'warn', message: 'Talang atas terlalu rendah: stang sepeda bawah menabrak sepeda atas.', fix: { label: 'Tinggi 150 cm', params: { tinggi: 150 } } });
    if (m === 'dua-tingkat' && num(p, 'dalam') < 160)
      out.push({ level: 'warn', message: 'Talang roda lebih pendek dari sepeda dewasa (±170 cm).', fix: { label: 'Panjang 180 cm', params: { dalam: 180 } } });
    if (m === 'dua-tingkat') out.push({ level: 'info', message: 'Sepeda atas dinaikkan dengan diangkat; untuk pemakai umum tambahkan talang turun (rel tarik) dari bengkel.' });
    if (HANG_MODELS.includes(m) && H < needHang(p))
      out.push({ level: 'warn', message: `Kait terlalu rendah untuk ban ${num(p, 'ban')}": sepeda yang digantung tegak masih menyentuh lantai.`, fix: { label: `Tinggi ${Math.min(220, needHang(p) + 5)} cm`, params: { tinggi: Math.min(220, needHang(p) + 5) } } });
    if (ARM_MODELS.includes(m) && H - (num(p, 'tingkat') - 1) * 50 < 60)
      out.push({ level: 'warn', message: 'Lengan paling bawah terlalu dekat lantai: roda sepeda menyentuh lantai.', fix: { label: `Tinggi ${Math.min(220, 60 + (num(p, 'tingkat') - 1) * 50 + 40)} cm`, params: { tinggi: Math.min(220, 60 + (num(p, 'tingkat') - 1) * 50 + 40) } } });
    if (m === 'lantai-plafon' && H > num(p, 'plafon') - 40)
      out.push({ level: 'warn', message: 'Lengan teratas terlalu dekat plafon, sepeda tidak bisa dinaikkan.', fix: { label: `Tinggi ${num(p, 'plafon') - 60} cm`, params: { tinggi: Math.max(30, num(p, 'plafon') - 60) } } });
    if (m === 'plafon') {
      const bebas = Math.round(num(p, 'plafon') - num(p, 'turun') - 3 - (wheelDia(p) + 30));
      if (bebas < 110)
        out.push({ level: 'warn', message: 'Sepeda tergantung terlalu rendah: menabrak kap mobil / barang di bawahnya.', fix: { label: 'Batang gantung 20 cm', params: { turun: 20 } } });
      else out.push({ level: 'info', message: `Ruang bebas di bawah sepeda ±${bebas} cm: pasang di atas kap mobil atau pojok, bukan di jalur orang lewat.` });
      out.push({ level: 'info', message: 'Balok plafon dibaut ke cor beton / balok kayu utama, bukan ke plafon gipsum.' });
    }
    if (['gravitasi', 'bersandar', 'dua-tingkat'].includes(m) && pipa === '20')
      out.push({ level: 'warn', message: 'Pipa 20×20 terlalu ramping untuk menahan sepeda setinggi ini.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
    if (m === 'gravitasi' && num(p, 'dalam') < 45)
      out.push({ level: 'warn', message: 'Tapak terlalu pendek: stand mudah terjungkal ke depan saat sepeda digantung.', fix: { label: 'Tapak 60 cm', params: { dalam: 60 } } });
    if (m === 'bersandar' && H / Math.max(1, num(p, 'dalam')) > 5)
      out.push({ level: 'warn', message: 'Kaki terlalu dekat tembok: rak hampir tegak dan bisa terguling ke depan.', fix: { label: `Kaki ${Math.ceil(H / 4)} cm`, params: { dalam: Math.min(200, Math.ceil(H / 4)) } } });
    if (m === 'bersandar') out.push({ level: 'info', message: 'Pasang karet di palang sandar supaya tembok tidak lecet, dan 1 baut pengaman ke tembok.' });
    if (m === 'lantai-plafon') out.push({ level: 'info', message: 'Tiang dijepit dengan baut penyetel di plat plafon; pastikan plafon cor / balok, bukan gipsum.' });
    if (['tiang-dinding', 'lengan-dinding', 'kait-lipat'].includes(m)) out.push({ level: 'info', message: 'Dibaut ke tembok bata / beton dengan fischer minimal 2 titik per plat.' });
    if (jenis === 'fat' && !SLOT_MODELS.includes(m)) out.push({ level: 'info', message: 'Fat bike / sepeda listrik berat: lapisi kait dengan karet tebal.' });
    if (SLOT_MODELS.includes(m)) out.push({ level: 'info', message: `Celah roda ${GAP[jenis] ?? 7} cm untuk ${jenis === 'tipis' ? 'ban tipis' : jenis === 'fat' ? 'ban gendut' : 'ban sedang'}.` });
    if (['sisir', 'dua-sisi', 'gelombang', 'gawang-u', 'bintang', 'dua-tingkat'].includes(m))
      out.push({ level: 'info', message: 'Untuk parkir di luar ruang pakai cat dasar anti karat / galvanis, dan baut tapak ke lantai bila perlu.' });
    void bld;
    return out;
  },
};
