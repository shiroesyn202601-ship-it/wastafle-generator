import { FrameHinge } from '../types/kitchen';
import { memberBox } from '../utils/frameLayout';
import { Board, Caster, Params, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, CASTER_LOAD, CASTER_OPTIONS, board, bool, casterHeight, casterSet, materialParams, memberFactory, num, r1, str } from './common';

/**
 * Alat & rak gym. Bentuk rangka (param `model`) dengan DNA 7 sumbu (A penopang | B geometri kaki | C penguat |
 * D susunan papan | E mobilitas | F tumpuan tembok | G elemen khusus):
 * - power-rack: sangkar 4 tiang, tapak & ring atas keliling, papan lantai angkat, J-hook, bar pengaman dalam, palang pull-up menjorok
 * - half-rack: 2 tiang tegak di tapak memanjang, topang miring ke belakang, lengan pengaman menjulur ke depan, pull-up atas
 * - power-tower: 2 tiang di tapak memanjang bertopang miring depan & belakang, sandaran punggung busa tegak, lengan busa + dip, pull-up
 * - squat-stand: sepasang tiang lepas, tiap tiang di ring tapak persegi dengan 4 siku miring, J-hook
 * - rack-lipat: bingkai samping (tiang tembok + tiang depan) berengsel di tembok, dilipat rapat; J-hook + pull-up
 * - pullup-dinding: tiang tembok tanpa kaki lantai, lengan atas menjorok bertopang miring, palang pull-up di ujung, pegangan dip lipat
 * - dip-paralel: sepasang bingkai trapesium lepas (rel lantai + tapak H + kaki miring), pegangan memanjang di puncak
 * - bench-datar: balok tengah tunggal, kaki T di ujung kaki, kaki V di tapak lebar ujung kepala, jok datar, roller penahan kaki
 * - bench-incline: seperti rangka bench datar tetapi sandaran berengsel di balok, sudut diatur batang penyangga
 * - bench-situp: balok tengah MIRING tetap, jok miring, roller penahan kaki di atas ujung tinggi
 * - bench-press: bench di balok tengah menyatu dengan dua tiang ber-J-hook di tapak H ujung kepala
 * - rak-dumbel: rangka samping trapesium (tiang belakang tinggi, depan pendek, topang miring), rel pelana bertangga tanpa papan
 * - troli-plat: tapak persegi beroda, dua tiang tengah, pasak plat bertingkat dua muka, pegangan dorong
 */
const MODELS = [
  { value: 'power-rack', label: 'Power rack (sangkar)', desc: '4 tiang, J-hook, bar pengaman, pull-up' },
  { value: 'half-rack', label: 'Half rack', desc: '2 tiang bertopang, lengan pengaman ke depan' },
  { value: 'power-tower', label: 'Power tower (pull-up + dip)', desc: 'Sandaran busa, lengan dip, palang pull-up' },
  { value: 'squat-stand', label: 'Squat stand sepasang', desc: 'Dua tiang lepas berlubang J-hook' },
  { value: 'rack-lipat', label: 'Rack lipat dinding', desc: 'Dibaut tembok, dilipat rapat saat kosong' },
  { value: 'pullup-dinding', label: 'Pull-up dinding + dip', desc: 'Lengan tembok, palang di ujung, dip lipat' },
  { value: 'dip-paralel', label: 'Dip paralel sepasang', desc: 'Dua bingkai trapesium lepas, pegangan sejajar' },
  { value: 'bench-datar', label: 'Bench datar', desc: 'Balok tengah, kaki T + kaki V, jok datar' },
  { value: 'bench-incline', label: 'Bench incline (atur sudut)', desc: 'Sandaran berengsel 0–80°' },
  { value: 'bench-situp', label: 'Bench sit-up miring', desc: 'Balok miring tetap, roller kaki di atas' },
  { value: 'bench-press', label: 'Bench press + tiang', desc: 'Bench menyatu dengan 2 tiang J-hook' },
  { value: 'rak-dumbel', label: 'Rak dumbel rel pelana', desc: 'Rel sejajar bertangga tanpa papan' },
  { value: 'troli-plat', label: 'Troli plat beroda', desc: 'Pasak plat dua muka, pegangan dorong' },
];
const KEYS = MODELS.map((m) => m.value);
const model = (p: Params) => {
  const m = str(p, 'model', 'power-rack');
  return KEYS.includes(m) ? m : 'power-rack';
};
const has = (...m: string[]) => (p: Params) => m.includes(model(p));

/** DNA rangka per bentuk: A | B | C | D | E | F | G — dipakai sebagai sidik rangka */
const DNA: Record<string, string[]> = {
  'power-rack': ['sangkar-4-tiang', 'tegak', 'ring-atas-bawah', 'papan-lantai', 'diam', 'bebas', 'jhook+pengaman+pullup'],
  'half-rack': ['2-tiang-tapak-panjang', 'tegak+topang-belakang', 'diagonal-belakang', 'tanpa-papan', 'diam', 'bebas', 'jhook+lengan-pengaman+pullup'],
  'power-tower': ['2-tiang-tapak-panjang', 'tegak+topang-depan-belakang', 'diagonal-ganda', 'busa-tegak+lengan', 'diam', 'bebas', 'pullup+dip+sandaran'],
  'squat-stand': ['tiang-tunggal-sepasang', 'tegak', 'siku-ring-lantai', 'tanpa-papan', 'lepas', 'bebas', 'jhook'],
  'rack-lipat': ['tempel-dinding+lantai', 'tegak', 'bingkai-samping', 'tanpa-papan', 'lipat', 'dibaut', 'jhook+pullup'],
  'pullup-dinding': ['tempel-dinding', 'lengan-menjorok', 'siku-miring', 'tanpa-papan', 'dip-lipat', 'dibaut', 'pullup+dip'],
  'dip-paralel': ['bingkai-trapesium-sepasang', 'melebar', 'palang-tengah', 'tanpa-papan', 'lepas', 'bebas', 'pegangan'],
  'bench-datar': ['balok-tengah', 'kaki-t+v', 'tanpa', 'jok-datar', 'diam', 'bebas', 'roller-bawah'],
  'bench-incline': ['balok-tengah', 'kaki-t+v', 'tanpa', 'jok+sandaran-engsel', 'engsel', 'bebas', 'penyangga-sudut+roller'],
  'bench-situp': ['balok-tengah-miring', 'miring-satu-arah', 'tanpa', 'jok-miring', 'diam', 'bebas', 'roller-atas'],
  'bench-press': ['balok-tengah+2-tiang', 'kaki-t+tapak-h', 'ikat-atas', 'jok-datar', 'diam', 'bebas', 'jhook+roller'],
  'rak-dumbel': ['rangka-samping-trapesium', 'beda-tinggi', 'diagonal-depan', 'rel-pelana-bertangga', 'diam', 'bebas', 'pelana'],
  'troli-plat': ['2-tiang-tapak-beroda', 'tegak', 'ring-bawah', 'tanpa-papan', 'roda', 'bebas', 'pasak+pegangan-dorong'],
};

const RACKS = ['power-rack', 'half-rack', 'squat-stand', 'rack-lipat'];
const JHOOK = [...RACKS, 'bench-press'];
const BENCH = ['bench-datar', 'bench-incline', 'bench-situp', 'bench-press'];
const DIP = ['power-tower', 'pullup-dinding', 'dip-paralel'];
const PASAK = ['power-rack', 'half-rack', 'squat-stand', 'bench-press'];
const PENGAMAN = ['power-rack', 'half-rack', 'bench-press'];

/** Lebar pegangan barbel di antara kerah dalam (cm) dan panjang total */
const BAR_GRIP: Record<string, number> = { '150': 95, '220': 131 };
const BAR_LEN: Record<string, number> = { '150': 150, '220': 220 };
/** Beban aman kasar (kg) per ukuran pipa tiang */
const PIPE_LOAD: Record<string, number> = { '30': 80, '40': 160, '50': 300, '60': 450 };

const PIPE_GYM = [
  { value: '30', label: '30×30 mm', desc: 'Ringan · rak dumbel kecil, beban < 80 kg' },
  { value: '40', label: '40×40 mm', desc: 'Sedang · bench, dip, beban < 160 kg' },
  { value: '50', label: '50×50 mm', desc: 'Kuat · rack rumahan, beban < 300 kg' },
  { value: '60', label: '60×60 mm', desc: 'Sangat kuat · gym komersial, beban < 450 kg' },
];
const JOK_OPTIONS = [
  { value: '#2b2e33', label: 'Jok hitam' },
  { value: '#8c2323', label: 'Jok merah' },
  { value: '#24407a', label: 'Jok biru' },
];

type V3 = [number, number, number];

/** Geser semua koordinat supaya mulai dari 0 (tembok tetap di z = 0), lalu ukur kotak luar */
function normalize(list: ReturnType<typeof memberFactory>['list'], boards: Board[], casters: Caster[], wall: boolean) {
  let minX = Infinity,
    minZ = Infinity,
    maxX = -Infinity,
    maxY = 0,
    maxZ = -Infinity;
  const grow = (x: number, y: number, z: number, h: number) => {
    minX = Math.min(minX, x - h);
    maxX = Math.max(maxX, x + h);
    minZ = Math.min(minZ, z - h);
    maxZ = Math.max(maxZ, z + h);
    maxY = Math.max(maxY, y + h);
  };
  for (const m of list) {
    const w = (m.tubeSize || 30) / 10;
    const h = m.tubeH ? m.tubeH / 10 : w;
    const bx = memberBox(m, m.end ? [w, h, w] : m.axis === 'y' ? [w, w, h] : [w, h, w]);
    grow(bx.min[0], bx.min[1], bx.min[2], 0);
    grow(bx.max[0], bx.max[1], bx.max[2], 0);
  }
  for (const bd of boards) {
    const [x0, y0, z0] = bd.box.min;
    const [x1, y1, z1] = bd.box.max;
    const t = ((bd.rotX || 0) * Math.PI) / 180;
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
  }
  for (const c of casters) {
    const r = (c.sizeInch * 2.54) / 2;
    grow(c.x - r, c.topY, c.z - r, 0);
    grow(c.x + r, c.topY, c.z + r, 0);
  }
  const dx = -minX;
  const dz = wall ? 0 : -minZ;
  for (const m of list) {
    m.x = r1(m.x + dx);
    m.z = r1(m.z + dz);
    if (m.end) m.end = { x: r1(m.end.x + dx), y: m.end.y, z: r1(m.end.z + dz) };
  }
  for (const bd of boards)
    bd.box = { min: [r1(bd.box.min[0] + dx), bd.box.min[1], r1(bd.box.min[2] + dz)], max: [r1(bd.box.max[0] + dx), bd.box.max[1], r1(bd.box.max[2] + dz)] };
  for (const c of casters) {
    c.x = r1(c.x + dx);
    c.z = r1(c.z + dz);
  }
  return { W: r1(maxX - minX), D: r1(wall ? maxZ : maxZ - minZ), H: r1(maxY) };
}

export const ALAT_GYM: ProductDef = {
  id: 'alat-gym',
  name: 'Alat & rak gym',
  tagline: 'Rack squat, bench, pull-up & rak beban untuk home gym dan gym kecil',
  icon: 'M16 36V6M44 36V6M12 6h36M10 36h40M8 16h44M6 13v6M54 13v6M16 26h-4M44 26h4',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['model', 'tinggi', 'lebar', 'dalam', 'tinggiJ', 'tinggiDip', 'panjangJok', 'tinggiJok', 'lebarJok', 'sudut', 'tingkat'] },
    { id: 'bentuk', title: 'Beban & aksesori', keys: ['barbel', 'beban', 'pengaman', 'pasak', 'roda', 'jok'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Selesai', keys: [] },
  ],
  params: [
    { key: 'model', label: 'Bentuk rangka', type: 'choice', options: MODELS },
    {
      key: 'tinggi',
      label: 'Tinggi rangka',
      type: 'number',
      unit: 'cm',
      min: 60,
      max: 240,
      step: 1,
      help: 'Rack & pull-up: tinggi palang atas (sisakan ±15 cm di bawah plafon). Rak dumbel: tinggi tingkat teratas. Troli: tinggi pegangan.',
      marks: [{ value: 90, label: 'rak beban' }, { value: 170, label: 'squat stand' }, { value: 215, label: 'rack' }, { value: 230, label: 'rack tinggi' }],
      showIf: (p) => !BENCH.includes(model(p)) && model(p) !== 'dip-paralel',
    },
    {
      key: 'lebar',
      label: 'Lebar',
      type: 'number',
      unit: 'cm',
      min: 45,
      max: 200,
      step: 1,
      help: 'Rack: lebar bersih di antara tiang. Squat stand & bench press: jarak tiang ke tiang. Dip: jarak dua pegangan. Pull-up dinding: panjang palang.',
      marks: [{ value: 60, label: 'dip' }, { value: 110, label: 'rack' }, { value: 120, label: 'rak dumbel' }],
      showIf: (p) => !['bench-datar', 'bench-incline', 'bench-situp'].includes(model(p)),
    },
    {
      key: 'dalam',
      label: 'Kedalaman / panjang tapak',
      type: 'number',
      unit: 'cm',
      min: 40,
      max: 150,
      step: 1,
      help: 'Rack: jarak tiang depan ke belakang. Dinding: seberapa jauh menjorok dari tembok. Dip & tower: panjang kaki di lantai.',
      marks: [{ value: 55, label: 'dinding' }, { value: 90, label: 'half rack' }, { value: 120, label: 'power rack' }],
      showIf: (p) => !BENCH.includes(model(p)) && model(p) !== 'squat-stand',
    },
    {
      key: 'tinggiJ',
      label: 'Tinggi J-hook (sandaran barbel)',
      type: 'number',
      unit: 'cm',
      min: 60,
      max: 180,
      step: 1,
      help: 'Setinggi pundak dikurangi ±5 cm untuk squat; bench press ±25 cm di atas jok. Tiang berlubang tiap 5 cm jadi bisa dipindah.',
      marks: [{ value: 75, label: 'bench press' }, { value: 135, label: 'squat' }],
      showIf: has(...JHOOK),
    },
    {
      key: 'tinggiDip',
      label: 'Tinggi pegangan dip',
      type: 'number',
      unit: 'cm',
      min: 80,
      max: 140,
      step: 1,
      help: 'Dip yang pas: setinggi pinggang, kaki masih bisa ditekuk tanpa menyentuh lantai (±100–120 cm).',
      marks: [{ value: 100, label: 'pendek' }, { value: 115, label: 'umum' }, { value: 125, label: 'tinggi' }],
      showIf: has(...DIP),
    },
    {
      key: 'panjangJok',
      label: 'Panjang jok',
      type: 'number',
      unit: 'cm',
      min: 90,
      max: 140,
      step: 1,
      help: 'Bench standar 110–125 cm: kepala sampai pinggul tertopang.',
      marks: [{ value: 110, label: 'ringkas' }, { value: 120, label: 'standar' }],
      showIf: has(...BENCH),
    },
    {
      key: 'tinggiJok',
      label: 'Tinggi jok dari lantai',
      type: 'number',
      unit: 'cm',
      min: 30,
      max: 55,
      step: 1,
      help: 'Standar kompetisi 42–45 cm: kaki menapak rata saat bench press. Sit-up: tinggi ujung kepala (rendah).',
      marks: [{ value: 43, label: 'standar' }],
      showIf: has(...BENCH),
    },
    {
      key: 'lebarJok',
      label: 'Lebar jok',
      type: 'number',
      unit: 'cm',
      min: 22,
      max: 40,
      step: 1,
      help: 'Jok 26–30 cm: bahu bebas bergerak saat menekan.',
      marks: [{ value: 28, label: 'standar' }],
      showIf: has(...BENCH),
    },
    {
      key: 'sudut',
      label: 'Sudut miring',
      type: 'number',
      unit: '°',
      min: 0,
      max: 80,
      step: 1,
      help: 'Incline: sudut sandaran (0 = datar, 30–45 = incline, 80 = hampir tegak). Sit-up: kemiringan jok (15–30°).',
      marks: [{ value: 0, label: 'datar' }, { value: 25, label: 'sit-up' }, { value: 45, label: 'incline' }],
      showIf: has('bench-incline', 'bench-situp'),
    },
    {
      key: 'tingkat',
      label: 'Jumlah tingkat',
      type: 'number',
      min: 1,
      max: 3,
      step: 1,
      help: 'Rak dumbel: jumlah baris rel (minimal 2). Troli plat: jumlah tingkat pasak.',
      showIf: has('rak-dumbel', 'troli-plat'),
    },
    {
      key: 'barbel',
      label: 'Jenis barbel',
      type: 'choice',
      options: [
        { value: '220', label: 'Barbel olimpik 220 cm', desc: 'Lubang plat 5 cm, pegangan 131 cm' },
        { value: '150', label: 'Barbel standar 150 cm', desc: 'Lubang plat 2,5 cm, pegangan ±95 cm' },
      ],
      help: 'Menentukan lebar maksimal di antara tiang supaya barbel bisa bersandar.',
      showIf: has(...JHOOK),
    },
    {
      key: 'beban',
      label: 'Beban maksimal',
      type: 'number',
      unit: 'kg',
      min: 20,
      max: 450,
      step: 5,
      help: 'Total barbel + plat + badan (pull-up / dip) yang akan ditahan.',
      marks: [{ value: 100, label: 'pemula' }, { value: 200, label: 'rumahan' }, { value: 350, label: 'gym' }],
    },
    {
      key: 'pengaman',
      label: 'Bar / lengan pengaman',
      type: 'toggle',
      help: 'Menangkap barbel bila Anda gagal mengangkat. Sangat dianjurkan bila latihan sendirian.',
      showIf: has(...PENGAMAN),
    },
    {
      key: 'pasak',
      label: 'Pasak penyimpan plat',
      type: 'toggle',
      help: 'Batang pendek untuk menggantung plat beban, sekaligus pemberat supaya rangka tidak terangkat.',
      showIf: has(...PASAK),
    },
    { key: 'roda', label: 'Ukuran roda', type: 'choice', options: CASTER_OPTIONS, showIf: has('troli-plat') },
    { key: 'jok', label: 'Warna jok busa', type: 'choice', options: JOK_OPTIONS, showIf: has(...BENCH, 'power-tower') },
    { key: 'pipa', label: 'Ukuran pipa tiang', type: 'choice', options: PIPE_GYM, help: 'Rack & bench untuk beban berat: minimal 50×50 mm tebal 2–3 mm.' },
    ...materialParams(true).filter((d) => d.key !== 'pipa'),
  ],
  defaults: {
    model: 'power-rack',
    tinggi: 215,
    lebar: 110,
    dalam: 120,
    tinggiJ: 135,
    tinggiDip: 115,
    panjangJok: 120,
    tinggiJok: 43,
    lebarJok: 28,
    sudut: 45,
    tingkat: 2,
    barbel: '220',
    beban: 200,
    pengaman: true,
    pasak: true,
    roda: '4',
    jok: '#2b2e33',
    pipa: '50',
    papan: 'kayu',
    warna: '#1f2226',
  },
  groups: [
    { id: 'rangka-latihan', name: 'Rack & palang latihan', desc: 'Half rack, power tower, squat stand, rack lipat, pull-up dinding, dip station' },
    { id: 'bangku-latihan', name: 'Bench latihan', desc: 'Bench datar kaki T, incline/decline berengsel, sit-up miring' },
    { id: 'rak-beban', name: 'Troli beban', desc: 'Troli plat berpasak beroda' },
  ],
  signature: (p) => `alat-gym:${DNA[model(p)].join('|')}`,
  presets: [
    {
      id: 'half-rack',
      group: 'rangka-latihan',
      name: 'Half rack',
      desc: '2 tiang tegak di tapak memanjang dengan topang miring ke belakang, lengan pengaman menjulur ke depan, palang pull-up di pucuk',
      params: { model: 'half-rack', tinggi: 215, lebar: 110, dalam: 110, tinggiJ: 135, barbel: '220', beban: 200 },
      sizes: [
        { label: 'Standar', desc: '122 × 110 × 215 cm', params: { tinggi: 215, lebar: 110, dalam: 110 } },
        { label: 'Ringkas', desc: '122 × 90 × 200 cm', params: { tinggi: 200, lebar: 110, dalam: 90, tinggiJ: 125 } },
        { label: 'Gym', desc: '127 × 130 × 230 cm, pipa 60', params: { tinggi: 230, lebar: 115, dalam: 130, pipa: '60', beban: 350 } },
      ],
    },
    {
      id: 'power-tower',
      group: 'rangka-latihan',
      name: 'Power tower (pull-up + dip)',
      desc: '2 tiang di tapak memanjang bertopang miring depan & belakang, sandaran punggung busa tegak, lengan busa + pegangan dip, pull-up di atas',
      params: { model: 'power-tower', tinggi: 220, lebar: 60, dalam: 100, tinggiDip: 115, beban: 150, pipa: '40' },
      sizes: [
        { label: 'Standar', desc: '110 × 100 × 220 cm', params: { tinggi: 220, lebar: 60, dalam: 100, tinggiDip: 115 } },
        { label: 'Plafon rendah', desc: '110 × 95 × 205 cm', params: { tinggi: 205, lebar: 58, dalam: 95, tinggiDip: 110 } },
        { label: 'Badan besar', desc: '120 × 110 × 230 cm, pipa 50', params: { tinggi: 230, lebar: 66, dalam: 110, tinggiDip: 120, pipa: '50', beban: 200 } },
      ],
    },
    {
      id: 'squat-stand',
      group: 'rangka-latihan',
      name: 'Squat stand sepasang',
      desc: 'sepasang tiang lepas, tiap tiang di ring tapak persegi dengan 4 siku miring, J-hook di muka tiang',
      params: { model: 'squat-stand', tinggi: 170, lebar: 115, tinggiJ: 130, barbel: '220', beban: 150 },
      sizes: [
        { label: 'Barbel olimpik', desc: '2 × 55 × 55 × 170 cm', params: { tinggi: 170, lebar: 115, tinggiJ: 130 } },
        { label: 'Barbel standar', desc: 'jarak tiang 80 cm', params: { tinggi: 165, lebar: 80, tinggiJ: 125, barbel: '150', beban: 100, pipa: '40' } },
        { label: 'Tinggi 190', desc: 'untuk orang tinggi', params: { tinggi: 190, lebar: 115, tinggiJ: 145 } },
      ],
    },
    {
      id: 'rack-lipat',
      group: 'rangka-latihan',
      name: 'Rack lipat dinding',
      desc: 'dua bingkai samping (tiang tembok + tiang depan) berengsel di tembok, dilipat rapat saat kosong; J-hook dan pull-up di depan',
      params: { model: 'rack-lipat', tinggi: 215, lebar: 110, dalam: 55, tinggiJ: 135, barbel: '220', beban: 200 },
      sizes: [
        { label: 'Standar', desc: '122 × 60 × 215 cm', params: { tinggi: 215, lebar: 110, dalam: 55 } },
        { label: 'Menjorok 75', desc: 'ruang gerak lebih lega', params: { tinggi: 215, lebar: 110, dalam: 75 } },
        { label: 'Plafon rendah', desc: '122 × 55 × 200 cm', params: { tinggi: 200, lebar: 110, dalam: 50, tinggiJ: 125 } },
      ],
    },
    {
      id: 'pullup-dinding',
      group: 'rangka-latihan',
      name: 'Pull-up dinding + dip',
      desc: 'tiang tembok tanpa kaki lantai, lengan atas menjorok bertopang miring, palang pull-up di ujung, pegangan dip berengsel dilipat naik',
      params: { model: 'pullup-dinding', tinggi: 220, lebar: 120, dalam: 60, tinggiDip: 115, beban: 150, pipa: '40' },
      sizes: [
        { label: 'Standar', desc: 'palang 120 cm, menjorok 60', params: { tinggi: 220, lebar: 120, dalam: 60 } },
        { label: 'Ringkas', desc: 'palang 100 cm, menjorok 50', params: { tinggi: 210, lebar: 100, dalam: 50, tinggiDip: 110 } },
        { label: 'Lebar', desc: 'palang 130 cm, menjorok 70', params: { tinggi: 230, lebar: 130, dalam: 70, tinggiDip: 120 } },
      ],
    },
    {
      id: 'dip-paralel',
      group: 'rangka-latihan',
      name: 'Dip paralel sepasang',
      desc: 'sepasang bingkai trapesium lepas: rel lantai + tapak H, kaki miring naik ke pegangan memanjang di puncak',
      params: { model: 'dip-paralel', lebar: 60, dalam: 90, tinggiDip: 110, beban: 120, pipa: '40' },
      sizes: [
        { label: 'Standar', desc: 'pegangan 60 cm, tinggi 110', params: { lebar: 60, dalam: 90, tinggiDip: 110 } },
        { label: 'Rendah', desc: 'tinggi 90, latihan push-up dalam', params: { lebar: 55, dalam: 80, tinggiDip: 90 } },
        { label: 'Tinggi', desc: 'tinggi 125, tapak 105', params: { lebar: 65, dalam: 105, tinggiDip: 125 } },
      ],
    },
    {
      id: 'bench-datar',
      group: 'bangku-latihan',
      name: 'Bench datar',
      desc: 'balok tengah tunggal, kaki T di ujung kaki, kaki V di tapak lebar ujung kepala, jok datar, roller penahan kaki',
      params: { model: 'bench-datar', panjangJok: 120, tinggiJok: 43, lebarJok: 28, beban: 250, pipa: '50' },
      sizes: [
        { label: 'Standar', desc: '120 × 28 × 43 cm', params: { panjangJok: 120, tinggiJok: 43, lebarJok: 28 } },
        { label: 'Ringkas', desc: '110 × 26 × 42 cm', params: { panjangJok: 110, tinggiJok: 42, lebarJok: 26 } },
        { label: 'Lebar', desc: '125 × 32 × 45 cm', params: { panjangJok: 125, tinggiJok: 45, lebarJok: 32 } },
      ],
    },
    {
      id: 'bench-incline',
      group: 'bangku-latihan',
      name: 'Bench incline (atur sudut)',
      desc: 'balok tengah dengan jok duduk tetap dan sandaran berengsel, sudut ditahan batang penyangga, kaki T + kaki V',
      params: { model: 'bench-incline', panjangJok: 125, tinggiJok: 45, lebarJok: 28, sudut: 45, beban: 200, pipa: '50' },
      sizes: [
        { label: 'Incline 45°', desc: '125 × 28 × 45 cm', params: { sudut: 45 } },
        { label: 'Incline 30°', desc: 'dada atas', params: { sudut: 30 } },
        { label: 'Hampir tegak 80°', desc: 'shoulder press duduk', params: { sudut: 80 } },
        { label: 'Datar 0°', desc: 'dipakai sebagai bench datar', params: { sudut: 0 } },
      ],
    },
    {
      id: 'bench-situp',
      group: 'bangku-latihan',
      name: 'Bench sit-up miring',
      desc: 'balok tengah miring tetap dari kepala rendah ke kaki tinggi, jok miring, roller penahan kaki di atas ujung tinggi',
      params: { model: 'bench-situp', panjangJok: 120, tinggiJok: 35, lebarJok: 28, sudut: 25, beban: 150, pipa: '40' },
      sizes: [
        { label: 'Miring 25°', desc: '120 × 28 cm', params: { sudut: 25 } },
        { label: 'Pemula 15°', desc: 'lebih landai', params: { sudut: 15 } },
        { label: 'Berat 30°', desc: 'jok 130 cm', params: { sudut: 30, panjangJok: 130 } },
      ],
    },
    {
      id: 'bench-press',
      group: 'bangku-latihan',
      name: 'Bench press + tiang',
      desc: 'bench di balok tengah menyatu dengan dua tiang ber-J-hook di tapak H ujung kepala, palang ikat atas',
      params: { model: 'bench-press', panjangJok: 115, tinggiJok: 43, lebarJok: 28, lebar: 115, tinggiJ: 75, barbel: '220', beban: 150 },
      sizes: [
        { label: 'Barbel olimpik', desc: 'jarak tiang 115 cm', params: { lebar: 115, tinggiJ: 75 } },
        { label: 'Barbel standar', desc: 'jarak tiang 85 cm', params: { lebar: 85, tinggiJ: 75, barbel: '150', beban: 100, pipa: '40' } },
        { label: 'Jok tinggi 45', desc: 'J-hook 80 cm', params: { tinggiJok: 45, tinggiJ: 80 } },
      ],
    },
    {
      id: 'troli-plat',
      group: 'rak-beban',
      name: 'Troli plat beroda',
      desc: 'tapak persegi beroda, dua tiang tengah, pasak plat bertingkat menjulur ke depan & belakang, pegangan dorong di pucuk',
      params: { model: 'troli-plat', lebar: 60, dalam: 50, tinggi: 120, tingkat: 2, beban: 150, pipa: '40', roda: '4' },
      sizes: [
        { label: '2 tingkat', desc: '76 × 50 × 120 cm', params: { tingkat: 2, tinggi: 120 } },
        { label: '3 tingkat', desc: '76 × 55 × 140 cm', params: { tingkat: 3, tinggi: 140, dalam: 55, beban: 250, roda: '5', pipa: '50' } },
        { label: '1 tingkat', desc: '70 × 45 × 100 cm', params: { tingkat: 1, tinggi: 100, lebar: 55, dalam: 45, beban: 100 } },
      ],
    },
  ],
  summary: (p) => {
    const m = model(p);
    if (BENCH.includes(m)) return `jok ${num(p, 'panjangJok')} × ${num(p, 'lebarJok')} cm · tinggi ${num(p, 'tinggiJok')} cm${m === 'bench-incline' || m === 'bench-situp' ? ` · ${num(p, 'sudut')}°` : ''}`;
    if (m === 'dip-paralel') return `pegangan ${num(p, 'lebar')} cm · tinggi ${num(p, 'tinggiDip')} cm`;
    if (m === 'rak-dumbel' || m === 'troli-plat') return `${num(p, 'lebar')} × ${num(p, 'dalam')} × ${num(p, 'tinggi')} cm · ${num(p, 'tingkat')} tingkat`;
    if (m === 'squat-stand') return `2 tiang × ${num(p, 'tinggi')} cm · jarak ${num(p, 'lebar')} cm`;
    return `${num(p, 'lebar')} × ${num(p, 'dalam')} × ${num(p, 'tinggi')} cm · beban ${num(p, 'beban')} kg`;
  },

  build: (p) => {
    const m = model(p);
    const P = (parseInt(str(p, 'pipa', '50')) || 50) / 10;
    const b = BOARD_THICK[str(p, 'papan', 'kayu')] ?? 2.5;
    const pt: [number, number] = [P * 10, P * 10];
    const mid: [number, number] = [40, 40];
    const bar: [number, number] = [30, 30];
    const thin: [number, number] = [20, 20];
    const beam: [number, number] = [50, 100];
    const jokC = str(p, 'jok', '#2b2e33');
    const { list, add, line } = memberFactory();
    const boards: Board[] = [];
    const hinges: FrameHinge[] = [];
    let casters: Caster[] = [];
    let wall = false;
    const Hh = Math.max(60, num(p, 'tinggi', 215));
    const Wi = Math.max(45, num(p, 'lebar', 110));
    const Dd = Math.max(40, num(p, 'dalam', 120));
    const yJ = Math.max(40, num(p, 'tinggiJ', 135));
    const Hd = Math.max(80, num(p, 'tinggiDip', 115));
    const safeOn = bool(p, 'pengaman');
    const pasakOn = bool(p, 'pasak');
    const ySafe = Math.max(35, yJ - 50);

    /**
     * Ujung batang miring dipotong DATAR (rata lantai / rata bawah palang) dan menempel di muka tegak batang lain.
     * Jejak potongan datar melebar s/2/|uy| dari as, jadi as ujung digeser sejauh itu dari muka supaya sudut
     * potongan tepat menyentuh muka (tidak masuk ke dalam batang). idx = sumbu datar yang digeser (0 = x, 2 = z),
     * side = di sisi mana batang miring berada terhadap muka (+1 = koordinat lebih besar).
     */
    const touch = (fixed: V3, moving: V3, idx: 0 | 2, face: number, side: number, s: number): V3 => {
      const e: V3 = [...moving];
      e[idx] = face;
      for (let k = 0; k < 10; k++) {
        const uy = Math.abs(e[1] - fixed[1]) / Math.hypot(e[0] - fixed[0], e[1] - fixed[1], e[2] - fixed[2]);
        e[idx] = face + (side * s) / 2 / uy;
      }
      return e;
    };

    /** J-hook: lidah menjulur ke depan dari muka tiang + bibir penahan */
    const jhook = (id: string, x: number, y: number, zFace: number, nm: string) => {
      add(id, 'z', x, y, zFace, 9, 'custom', `J-hook ${nm}`, bar);
      add(`${id}-bibir`, 'y', x, y + 1.5, zFace + 7.5, 5, 'custom', `Bibir J-hook ${nm}`, thin);
    };
    /** Pasak plat menjulur ke samping luar (dir -1 kiri, +1 kanan) dari muka tiang */
    const pasakX = (id: string, xFace: number, dir: number, y: number, z: number, nm: string) => {
      add(id, 'x', dir > 0 ? xFace : xFace - 25, y, z, 25, 'custom', `Pasak plat ${nm}`, mid);
      add(`${id}-bibir`, 'y', dir > 0 ? xFace + 23.5 : xFace - 23.5, y + 2, z, 4, 'custom', `Bibir pasak ${nm}`, thin);
    };
    /** Roller penahan kaki: pipa melintang + dua busa gulung */
    const roller = (id: string, y: number, z: number) => {
      add(id, 'x', -17, y, z, 34, 'custom', 'Pipa roller penahan kaki', bar);
      [-1, 1].forEach((s, k) =>
        boards.push({ ...board(`${id}-busa-${k}`, `Busa roller ${k ? 'kanan' : 'kiri'}`, s > 0 ? 3 : -16, s > 0 ? 16 : -3, y - 5, y + 5, z - 5, z + 5), color: jokC })
      );
    };

    if (m === 'power-rack') {
      const W0 = Wi + 2 * P;
      const xs = [P / 2, W0 - P / 2];
      const zs = [P / 2, Dd - P / 2];
      zs.forEach((z, j) => add(`tapak-x-${j}`, 'x', 0, P / 2, z, W0, 'rail-x', `Tapak ${j ? 'depan' : 'belakang'}`, pt));
      xs.forEach((x, i) => add(`tapak-z-${i}`, 'z', x, P / 2, P, Dd - 2 * P, 'rail-z', `Tapak ${i ? 'kanan' : 'kiri'}`, pt));
      add('tapak-tengah', 'x', P, P / 2, Dd / 2, W0 - 2 * P, 'rail-x', 'Palang lantai tengah (tumpuan papan)', pt);
      xs.forEach((x, i) => zs.forEach((z, j) => add(`tiang-${i}-${j}`, 'y', x, P, z, Hh - 2 * P, 'post', `Tiang berlubang ${i ? 'kanan' : 'kiri'} ${j ? 'depan' : 'belakang'}`, pt)));
      zs.forEach((z, j) => add(`atas-x-${j}`, 'x', 0, Hh - P / 2, z, W0, 'rail-x', `Palang atas ${j ? 'depan' : 'belakang'}`, pt));
      xs.forEach((x, i) => add(`atas-z-${i}`, 'z', x, Hh - P / 2, P, Dd - 2 * P, 'rail-z', `Palang atas ${i ? 'kanan' : 'kiri'}`, pt));
      xs.forEach((x, i) => add(`lengan-pullup-${i}`, 'z', x, Hh - P / 2, Dd, 15 - mid[0] / 20, 'custom', `Lengan pull-up ${i ? 'kanan' : 'kiri'}`, pt));
      add('pullup', 'x', -10, Hh - P / 2, Dd + 15, W0 + 20, 'custom', 'Palang pull-up (pegangan)', mid);
      xs.forEach((x, i) => jhook(`jhook-${i}`, x, yJ, Dd, i ? 'kanan' : 'kiri'));
      if (safeOn) xs.forEach((x, i) => add(`pengaman-${i}`, 'z', x, ySafe, P, Dd - 2 * P, 'custom', `Bar pengaman ${i ? 'kanan' : 'kiri'}`, [50, 50]));
      if (pasakOn)
        xs.forEach((x, i) => [45, 85].forEach((y, k) => pasakX(`pasak-${i}-${k}`, i ? W0 : 0, i ? 1 : -1, y, P / 2, `belakang ${i ? 'kanan' : 'kiri'} ${k + 1}`)));
      if (b > 0) boards.push(board('lantai', 'Papan lantai angkat beban', P, W0 - P, P, P + b, P, Dd - P));
    } else if (m === 'half-rack') {
      const W0 = Wi + 2 * P;
      const xs = [P / 2, W0 - P / 2];
      const zp = r1(Dd * 0.42);
      const yTop = r1(Hh * 0.55);
      // topang: kaki dipotong rata di atas tapak, ujung atas dipotong datar menempel di muka belakang tiang
      const tA: V3 = [0, P, P * 1.5];
      const tB = touch(tA, [0, yTop, 0], 2, zp - P / 2, -1, P);
      xs.forEach((x, i) => add(`tapak-${i}`, 'z', x, P / 2, 0, Dd, 'rail-z', `Tapak memanjang ${i ? 'kanan' : 'kiri'}`, pt));
      add('tapak-belakang', 'x', P, P / 2, P / 2, W0 - 2 * P, 'rail-x', 'Tapak belakang', pt);
      xs.forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        add(`tiang-${i}`, 'y', x, P, zp, Hh - 2 * P, 'post', `Tiang berlubang ${nm}`, pt);
        line(`topang-${i}`, [x, tA[1], tA[2]], [x, tB[1], tB[2]], 'post', `Topang miring belakang ${nm}`, pt);
        jhook(`jhook-${i}`, x, yJ, zp + P / 2, nm);
        if (safeOn) {
          add(`lengan-pengaman-${i}`, 'z', x, ySafe, zp + P / 2, 60, 'custom', `Lengan pengaman ${nm}`, [50, 50]);
          add(`lengan-pengaman-${i}-bibir`, 'y', x, ySafe + 2.5, zp + P / 2 + 57, 6, 'custom', `Bibir lengan pengaman ${nm}`, thin);
        }
        if (pasakOn) [45, 85].forEach((y, k) => pasakX(`pasak-${i}-${k}`, i ? W0 : 0, i ? 1 : -1, y, zp, `${nm} ${k + 1}`));
      });
      const my = (P + yTop) / 2;
      const mz = (tA[2] + tB[2]) / 2;
      add('ikat-topang', 'x', P, my, mz, W0 - 2 * P, 'rail-x', 'Palang ikat topang', pt);
      add('pullup', 'x', -15, Hh - P / 2, zp, W0 + 30, 'rail-x', 'Palang pull-up atas', pt);
    } else if (m === 'power-tower') {
      const xs = [0, Wi];
      const zt = r1(Dd * 0.3);
      const yb = Math.min(Hd - 20, 95);
      xs.forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        add(`tapak-${i}`, 'z', x, P / 2, 0, Dd, 'rail-z', `Tapak memanjang ${nm}`, pt);
        add(`tiang-${i}`, 'y', x, P, zt, Hh - 2 * P, 'post', `Tiang ${nm}`, pt);
        // kaki topang belakang rata dengan ujung tapak (tidak menonjol), ujung atas menempel di muka tiang
        let bA: V3 = [x, P, P * 0.5];
        let bB: V3 = [x, 55, 0];
        for (let k = 0; k < 4; k++) {
          bB = touch(bA, bB, 2, zt - P / 2, -1, P);
          bA = touch(bB, bA, 2, 0, 1, P);
        }
        const dA: V3 = [x, P, Dd - P];
        line(`topang-belakang-${i}`, bA, bB, 'post', `Topang miring belakang ${nm}`, pt);
        line(`topang-depan-${i}`, dA, touch(dA, [x, yb, 0], 2, zt + P / 2, 1, P), 'post', `Topang miring depan ${nm}`, pt);
        add(`lengan-dip-${i}`, 'z', x, Hd, zt + P / 2, 50, 'custom', `Lengan sandaran + pegangan dip ${nm}`, pt);
        boards.push({ ...board(`busa-lengan-${i}`, `Busa lengan ${nm}`, x - 6, x + 6, Hd + P / 2, Hd + P / 2 + 6, zt + P / 2, zt + P / 2 + 30), color: jokC });
        // lengan duduk di atas tiang, ujungnya berhenti di muka palang pull-up
        add(`lengan-atas-${i}`, 'z', x, Hh - P / 2, zt - P / 2, 30 + P - mid[0] / 20, 'custom', `Lengan pull-up ${nm}`, pt);
      });
      [P / 2, Dd - P / 2].forEach((z, j) => add(`tapak-x-${j}`, 'x', P / 2, P / 2, z, Wi - P, 'rail-x', `Tapak ${j ? 'depan' : 'belakang'}`, pt));
      add('ikat-atas', 'x', P / 2, Hh - P / 2, zt, Wi - P, 'rail-x', 'Palang ikat atas', pt);
      const yp0 = Hd - 20;
      const yp1 = Hd + 35;
      [yp0, yp1].forEach((y, j) => add(`rel-sandaran-${j}`, 'x', P / 2, y, zt, Wi - P, 'rail-x', `Palang sandaran ${j ? 'atas' : 'bawah'}`, pt));
      const zf = zt + P / 2;
      if (b > 0) boards.push(board('papan-sandaran', 'Papan sandaran punggung', Wi / 2 - 16, Wi / 2 + 16, yp0 - 5, yp1 + 5, zf, zf + b));
      boards.push({ ...board('busa-sandaran', 'Busa sandaran punggung', Wi / 2 - 16, Wi / 2 + 16, yp0 - 5, yp1 + 5, zf + b, zf + b + 6), color: jokC });
      add('pullup', 'x', -25, Hh - P / 2, zt + P / 2 + 30, Wi + 50, 'custom', 'Palang pull-up (pegangan lebar)', mid);
    } else if (m === 'squat-stand') {
      const B = 55;
      [0, Wi].forEach((xc, i) => {
        const nm = i ? 'kanan' : 'kiri';
        [P / 2, B - P / 2].forEach((z, j) => add(`ring-x-${i}-${j}`, 'x', xc - B / 2, P / 2, z, B, 'rail-x', `Tapak ${nm} ${j ? 'depan' : 'belakang'}`, pt));
        [-1, 1].forEach((s, j) => add(`ring-z-${i}-${j}`, 'z', xc + s * (B / 2 - P / 2), P / 2, P, B - 2 * P, 'rail-z', `Tapak ${nm} sisi ${j ? 'kanan' : 'kiri'}`, pt));
        add(`tapak-tengah-${i}`, 'z', xc, P / 2, P, B - 2 * P, 'rail-z', `Tapak tengah ${nm}`, pt);
        add(`tiang-${i}`, 'y', xc, P, B / 2, Hh - P, 'post', `Tiang berlubang ${nm}`, pt);
        // siku: kaki duduk di as tapak, ujung atas dipotong datar menempel di muka tiang
        const sm = mid[0] / 10;
        [-1, 1].forEach((s, j) => {
          // kaki siku rata dengan tepi luar tapak (tidak menonjol keluar ring)
          let a: V3 = [xc + s * (B / 2 - P / 2), P, B / 2];
          let e: V3 = [0, 35, B / 2];
          for (let k = 0; k < 4; k++) {
            e = touch(a, e, 0, xc + s * (P / 2), s, sm);
            a = touch(e, a, 0, xc + s * (B / 2), -s, sm);
          }
          line(`siku-x-${i}-${j}`, a, e, 'custom', `Siku samping ${nm} ${j + 1}`, mid);
        });
        const sb: V3 = [xc, P, P * 1.5];
        const sd: V3 = [xc, P, B - P * 1.5];
        line(`siku-b-${i}`, sb, touch(sb, [xc, 35, 0], 2, B / 2 - P / 2, -1, sm), 'custom', `Siku belakang ${nm}`, mid);
        line(`siku-d-${i}`, sd, touch(sd, [xc, 35, 0], 2, B / 2 + P / 2, 1, sm), 'custom', `Siku depan ${nm}`, mid);
        jhook(`jhook-${i}`, xc, yJ, B / 2 + P / 2, nm);
        if (pasakOn) {
          add(`pasak-${i}`, 'z', xc, 55, B / 2 - P / 2 - 22, 22, 'custom', `Pasak plat ${nm}`, mid);
          add(`pasak-${i}-bibir`, 'y', xc, 57, B / 2 - P / 2 - 20.5, 4, 'custom', `Bibir pasak ${nm}`, thin);
        }
      });
    } else if (m === 'rack-lipat') {
      wall = true;
      const W0 = Wi + 2 * P;
      const xs = [P / 2, W0 - P / 2];
      const yLo = 20;
      xs.forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        add(`tiang-tembok-${i}`, 'y', x, 0, P / 2, Hh, 'post', `Tiang tembok ${nm} (dibaut)`, pt);
        add(`tiang-depan-${i}`, 'y', x, 0, Dd, Hh - P, 'post', `Tiang depan berlubang ${nm}`, pt);
        add(`atas-${i}`, 'z', x, Hh - P / 2, P, Dd - P / 2, 'rail-z', `Palang atas ${nm} (berengsel)`, pt);
        add(`bawah-${i}`, 'z', x, yLo, P, Dd - P * 1.5, 'rail-z', `Palang bawah ${nm} (berengsel)`, pt);
        const mA: V3 = [x, yLo + P / 2, P * 1.5];
        line(`miring-${i}`, mA, touch(mA, [x, r1(Hh * 0.5), 0], 2, Dd - P / 2, -1, mid[0] / 10), 'custom', `Penguat miring ${nm}`, mid);
        jhook(`jhook-${i}`, x, yJ, Dd + P / 2, nm);
        const sg = i ? -1 : 1;
        hinges.push({ id: `engsel-atas-${i}`, memberId: `atas-${i}`, type: 'barrel-weld', mode: 'point', pos: 0, side: 'end', foldAxis: 'x', foldSign: sg as 1 | -1, carry: true, label: `Engsel atas ${nm} (dilipat ke tembok)` });
        hinges.push({ id: `engsel-bawah-${i}`, memberId: `bawah-${i}`, type: 'barrel-weld', mode: 'point', pos: 0, side: 'end', foldAxis: 'x', foldSign: sg as 1 | -1, label: `Engsel bawah ${nm}` });
      });
      add('ikat-tembok-atas', 'x', P, Hh - P / 2, P / 2, W0 - 2 * P, 'rail-x', 'Rel tembok atas', pt);
      add('ikat-tembok-bawah', 'x', P, yLo, P / 2, W0 - 2 * P, 'rail-x', 'Rel tembok bawah', pt);
      add('pullup', 'x', -10, Hh - P * 1.5, Dd + P / 2 + 2, W0 + 20, 'custom', 'Palang pull-up (dilepas saat dilipat)', mid);
    } else if (m === 'pullup-dinding') {
      wall = true;
      const xs = [-30, 30];
      const yLo = Hd - 15;
      xs.forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        add(`tiang-tembok-${i}`, 'y', x, yLo, P / 2, Hh - yLo, 'post', `Tiang tembok ${nm} (dibaut)`, pt);
        add(`lengan-${i}`, 'z', x, Hh - P / 2, P, Dd - P - mid[0] / 20, 'custom', `Lengan pull-up ${nm}`, pt);
        // topang: ujung atas dipotong datar rata bawah lengan, ujung bawah datar menempel di muka tiang tembok
        const tB: V3 = [x, Hh - P, r1(Dd * 0.6)];
        line(`topang-${i}`, touch(tB, [x, Hh - 55, 0], 2, P, 1, P), tB, 'custom', `Topang miring ${nm}`, pt);
        const id = `dip-${i}`;
        add(id, 'z', x, Hd, P, 45, 'custom', `Pegangan dip ${nm} (lipat)`, pt);
        hinges.push({ id: `engsel-dip-${i}`, memberId: id, type: 'barrel-weld', mode: 'point', pos: 0, side: 'end', foldAxis: 'y', foldSign: 1, label: `Engsel pegangan dip ${nm} (dilipat naik)` });
      });
      add('ikat-atas', 'x', -30 + P / 2, Hh - P / 2, P / 2, 60 - P, 'rail-x', 'Palang ikat tembok atas', pt);
      add('ikat-bawah', 'x', -30 + P / 2, yLo + P / 2, P / 2, 60 - P, 'rail-x', 'Palang ikat tembok bawah', pt);
      add('pullup', 'x', -Wi / 2, Hh - P / 2, Dd, Wi, 'custom', 'Palang pull-up', mid);
    } else if (m === 'dip-paralel') {
      [0, Wi].forEach((xu, i) => {
        const nm = i ? 'kanan' : 'kiri';
        // tapak H: tapak melintang menerus, rel lantai dipotong di antara keduanya
        add(`rel-${i}`, 'z', xu, P / 2, P, Dd - 2 * P, 'rail-z', `Rel lantai ${nm}`, pt);
        [P / 2, Dd - P / 2].forEach((z, j) => add(`tapak-${i}-${j}`, 'x', xu - 18, P / 2, z, 36, 'rail-x', `Tapak ${nm} ${j ? 'depan' : 'belakang'}`, pt));
        const z0 = Dd / 2 - 25;
        const z1 = Dd / 2 + 25;
        add(`pegangan-${i}`, 'z', xu, Hd, z0 - 5, 60, 'custom', `Pegangan dip ${nm}`, mid);
        const a: V3 = [xu, P, P + 3];
        const c: V3 = [xu, P, Dd - P - 3];
        const yK = Hd - mid[0] / 20;
        line(`kaki-b-${i}`, a, [xu, yK, z0], 'post', `Kaki miring belakang ${nm}`, pt);
        line(`kaki-d-${i}`, c, [xu, yK, z1], 'post', `Kaki miring depan ${nm}`, pt);
        // palang tengah dipotong lurus, kedua ujung menempel di muka dalam kaki miring (titik terluar muka miring)
        const f = 0.4;
        const ym = P + (yK - P) * f;
        const face = (s: V3, zt: number, y: number, side: number) => {
          const dy = yK - s[1];
          const dz = zt - s[2];
          return s[2] + (dz * (y - s[1])) / dy + (side * P) / 2 / (Math.abs(dy) / Math.hypot(dy, dz));
        };
        const yHi = ym + mid[1] / 20;
        const zA = face(a, z0, yHi, 1);
        const zB = face(c, z1, yHi, -1);
        add(`tengah-${i}`, 'z', xu, ym, zA, zB - zA, 'rail-z', `Palang tengah ${nm}`, mid);
      });
    } else if (BENCH.includes(m)) {
      const Lj = Math.max(90, num(p, 'panjangJok', 120));
      const Hj = Math.max(30, num(p, 'tinggiJok', 43));
      const Wj = Math.max(22, num(p, 'lebarJok', 28));
      const Wt = 45;
      const busa = 6;
      const yTopRail = Hj - busa - b;
      const yr = yTopRail - 5;
      /** Kaki T: tapak melintang + tiang ke bawah balok */
      const kakiT = (id: string, z: number, yTo: number, nm: string) => {
        add(`tapak-${id}`, 'x', -Wt / 2, P / 2, z, Wt, 'rail-x', `Tapak ${nm}`, pt);
        add(`kaki-${id}`, 'y', 0, P, z, yTo - P, 'post', `Kaki ${nm}`, pt);
      };
      /** Kaki V: dua kaki miring dari tapak lebar ke bawah balok */
      const kakiV = (id: string, z: number, yTo: number, nm: string) => {
        add(`tapak-${id}`, 'x', -Wt / 2 - 5, P / 2, z, Wt + 10, 'rail-x', `Tapak lebar ${nm}`, pt);
        // kedua kaki bertemu di bawah balok: ujung atas dipotong datar, sudutnya saling bertemu di as (tidak tumpang)
        [-1, 1].forEach((s, k) => {
          const a: V3 = [s * (Wt / 2 + 5 - P), P, z];
          line(`kaki-${id}-${k}`, a, touch(a, [0, yTo, z], 0, 0, s, P), 'post', `Kaki miring ${nm} ${k ? 'kanan' : 'kiri'}`, pt);
        });
      };
      const jok = (id: string, z0: number, z1: number, nm: string) => {
        if (b > 0) boards.push(board(`papan-${id}`, `Papan ${nm}`, -Wj / 2, Wj / 2, yTopRail, yTopRail + b, z0, z1));
        boards.push({ ...board(`busa-${id}`, `Busa ${nm}`, -Wj / 2, Wj / 2, yTopRail + b, yTopRail + b + busa, z0, z1), color: jokC });
      };
      /** Penahan kaki rendah di ujung kaki balok */
      const penahanBawah = (zEnd: number) => {
        // ujung bawah dipotong datar, duduk di atas pipa roller
        const yE = 14 + bar[0] / 20;
        const zE = zEnd + 15 - (18 * (yE - 14)) / (yr - 5 - 14);
        line('batang-penahan', [0, yr - 5, zEnd - 3], [0, yE, zE], 'custom', 'Batang penahan kaki', pt);
        roller('roller', 14, zEnd + 15);
      };

      if (m === 'bench-datar') {
        add('balok', 'z', 0, yr, 0, Lj, 'rail-z', 'Balok tengah 50×100', beam);
        kakiT('depan', Lj - 15, yr - 5, 'ujung kaki');
        kakiV('belakang', 15, yr - 5, 'ujung kepala');
        jok('jok', 0, Lj, 'jok');
        penahanBawah(Lj);
      } else if (m === 'bench-incline') {
        const a = (Math.max(0, Math.min(80, num(p, 'sudut', 45))) * Math.PI) / 180;
        add('balok', 'z', 0, yr, 0, Lj, 'rail-z', 'Balok tengah 50×100', beam);
        kakiT('depan', Lj - 15, yr - 5, 'ujung kaki');
        kakiV('belakang', 15, yr - 5, 'ujung kepala');
        const zH = Lj - 36;
        jok('duduk', zH + 1, Lj, 'jok duduk');
        const Ls = zH - 2;
        const h0: V3 = [0, yTopRail + 2.5, zH];
        const u: V3 = [0, Math.sin(a), -Math.cos(a)];
        const n: V3 = [0, Math.cos(a), Math.sin(a)];
        const top: V3 = [0, h0[1] + u[1] * Ls, h0[2] + u[2] * Ls];
        line('rangka-sandaran', h0, top, 'custom', 'Rangka sandaran (berengsel di balok)', [50, 50]);
        const mid3: V3 = [0, (h0[1] + top[1]) / 2, (h0[2] + top[2]) / 2];
        const deg = r1((a * 180) / Math.PI);
        const at = (off: number, th: number, id: string, nm: string, color?: string) => {
          const cy = mid3[1] + n[1] * (off + th / 2);
          const cz = mid3[2] + n[2] * (off + th / 2);
          const bd: Board = { ...board(id, nm, -Wj / 2, Wj / 2, cy - th / 2, cy + th / 2, cz - Ls / 2, cz + Ls / 2), rotX: deg || undefined };
          boards.push(color ? { ...bd, color } : bd);
        };
        if (b > 0) at(2.5, b, 'papan-sandaran', 'Papan sandaran');
        at(2.5 + b, busa, 'busa-sandaran', 'Busa sandaran', jokC);
        // batang penyangga sudut: dari bawah rangka sandaran tegak turun ke balok
        const S: V3 = [0, h0[1] + u[1] * Ls * 0.55, h0[2] + u[2] * Ls * 0.55];
        // ujung atas berhenti di titik terendah muka bawah rangka sandaran yang miring (tidak masuk ke rangka)
        const yS = S[1] - 2.5 / Math.max(0.05, Math.cos(a)) - (mid[0] / 20) * Math.tan(a);
        if (yS - yTopRail > 3) line('penyangga', [0, yTopRail, S[2]], [0, yS, S[2]], 'custom', 'Batang penyangga sudut (pin penyetel)', mid);
        penahanBawah(Lj);
      } else if (m === 'bench-situp') {
        const a = (Math.max(5, Math.min(40, num(p, 'sudut', 25))) * Math.PI) / 180;
        const Lh = Lj * Math.cos(a);
        const rise = Lj * Math.sin(a);
        const zLow = Lh + 5;
        const zHigh = 5;
        const yLow = Math.max(20, Hj - busa - b - 5);
        const yAt = (z: number) => yLow + (rise * (zLow - z)) / Lh;
        line('balok', [0, yLow, zLow], [0, yLow + rise, zHigh], 'rail-z', 'Balok tengah miring 50×100', beam);
        const dyB = 5 / Math.cos(a);
        // kaki berhenti di titik terendah muka bawah balok miring selebar kaki
        kakiT('kepala', zLow - 12, yAt(zLow - 12 + P / 2) - dyB, 'ujung kepala');
        kakiV('kaki', 20, yAt(20 + P / 2) - dyB, 'ujung kaki (tinggi)');
        const deg = r1((a * 180) / Math.PI);
        const n: V3 = [0, Math.cos(a), Math.sin(a)];
        const mz = (zLow + zHigh) / 2;
        const my = yAt(mz);
        const put = (off: number, th: number, id: string, nm: string, color?: string) => {
          const cy = my + n[1] * (off + th / 2);
          const cz = mz + n[2] * (off + th / 2);
          const bd: Board = { ...board(id, nm, -Wj / 2, Wj / 2, cy - th / 2, cy + th / 2, cz - Lj / 2, cz + Lj / 2), rotX: deg };
          boards.push(color ? { ...bd, color } : bd);
        };
        if (b > 0) put(5, b, 'papan-jok', 'Papan jok miring');
        put(5 + b, busa, 'busa-jok', 'Busa jok miring', jokC);
        const zr = zHigh + 4;
        // tiang duduk di titik tertinggi muka atas balok (atau di potongan datar ujung balok bila lebih rendah)
        const cutFlat = rise / Lj >= 0.35;
        const y0 = Math.min(yAt(zr - P / 2) + dyB, cutFlat ? yLow + rise : Infinity);
        const yRc = yAt(zr) + dyB - 1 + b + busa + 20; // as pipa roller (tinggi tetap)
        add('tiang-roller', 'y', 0, y0, zr, yRc - bar[0] / 20 - y0, 'custom', 'Tiang roller penahan kaki', pt);
        roller('roller', yRc, zr);
      } else {
        // bench-press: bench di balok tengah + dua tiang J-hook di tapak H ujung kepala
        const Wr = Wi;
        const zr = 8;
        const Hr = Math.max(yJ + 20, Hj + 40);
        [-1, 1].forEach((s, i) => {
          const x = (s * Wr) / 2;
          const nm = i ? 'kanan' : 'kiri';
          add(`tapak-z-${i}`, 'z', x, P / 2, zr - 25, 60, 'rail-z', `Tapak tiang ${nm}`, pt);
          add(`tiang-${i}`, 'y', x, P, zr, Hr - 2 * P, 'post', `Tiang berlubang ${nm}`, pt);
          jhook(`jhook-${i}`, x, yJ, zr + P / 2, nm);
          if (safeOn) {
            add(`lengan-pengaman-${i}`, 'z', x, Hj + 15, zr + P / 2, 40, 'custom', `Lengan pengaman ${nm}`, [50, 50]);
            add(`lengan-pengaman-${i}-bibir`, 'y', x, Hj + 17.5, zr + P / 2 + 37, 6, 'custom', `Bibir lengan pengaman ${nm}`, thin);
          }
          if (pasakOn) pasakX(`pasak-${i}`, x + s * (P / 2), s, 40, zr, nm);
        });
        add('tapak-x', 'x', -Wr / 2 + P / 2, P / 2, zr, Wr - P, 'rail-x', 'Tapak melintang kepala', pt);
        add('ikat-atas', 'x', -Wr / 2 + P / 2, Hr - P / 2, zr, Wr - P, 'rail-x', 'Palang ikat atas', pt);
        const z0 = zr + P / 2 + 4;
        add('balok', 'z', 0, yr, zr - 2.5, Lj + z0 - zr + 2.5, 'rail-z', 'Balok tengah 50×100', beam);
        add('kaki-kepala', 'y', 0, P, zr + 2.5 + P / 2, yr - 5 - P, 'post', 'Kaki kepala (di tapak melintang)', pt);
        kakiT('depan', z0 + Lj - 15, yr - 5, 'ujung kaki');
        jok('jok', z0, z0 + Lj, 'jok');
        penahanBawah(z0 + Lj);
      }
    } else if (m === 'rak-dumbel') {
      const Wr = Wi;
      const t = Math.max(2, Math.min(3, Math.round(num(p, 'tingkat', 2))));
      const yT = Math.max(60, Hh);
      const y0 = Math.max(30, Math.min(yT - 20 * (t - 1), 35 + (t === 3 ? 0 : 5)));
      const dy = (yT - y0) / (t - 1);
      const dz = (Dd - P - 24) / (t - 1);
      const frames = Wr > 140 ? [P / 2, Wr / 2, Wr - P / 2] : [P / 2, Wr - P / 2];
      const tiers = Array.from({ length: t }, (_, i) => ({ y: y0 + i * dy, z: Dd - i * dz }));
      frames.forEach((x, f) => {
        const nm = f === 0 ? 'kiri' : f === frames.length - 1 ? 'kanan' : 'tengah';
        add(`tapak-${f}`, 'z', x, P / 2, 0, Dd, 'rail-z', `Tapak ${nm}`, pt);
        add(`tiang-b-${f}`, 'y', x, P, P / 2, yT + P / 2 - P, 'post', `Tiang belakang ${nm}`, pt);
        add(`tiang-d-${f}`, 'y', x, P, Dd - P / 2, y0 - P / 2 - P, 'post', `Tiang depan ${nm}`, pt);
        tiers.forEach((tr, i) => add(`lengan-${f}-${i}`, 'z', x, tr.y, P, tr.z - P, 'rail-z', `Lengan tingkat ${i + 1} ${nm}`, pt));
        const last = tiers[t - 1];
        line(`topang-${f}`, [x, y0 - P / 2, Dd - P / 2], [x, last.y - P / 2, last.z - P / 2], 'custom', `Topang miring depan ${nm}`, pt);
      });
      tiers.forEach((tr, i) =>
        [4, 17].forEach((o, k) => add(`pelana-${i}-${k}`, 'x', 0, tr.y + P / 2 + 1.5, tr.z - o, Wr, 'rail-x', `Rel pelana tingkat ${i + 1} ${k ? 'belakang' : 'depan'}`, bar))
      );
      add('ikat-bawah', 'x', P / 2, P / 2, P / 2, Wr - P, 'rail-x', 'Palang ikat lantai belakang', pt);
    } else {
      // troli-plat
      const Wd = Wi;
      const inch = parseInt(str(p, 'roda', '4')) || 4;
      const ch = casterHeight(inch);
      const yF = ch + P / 2;
      const t = Math.max(1, Math.min(3, Math.round(num(p, 'tingkat', 2))));
      [P / 2, Dd - P / 2].forEach((z, j) => add(`tapak-x-${j}`, 'x', 0, yF, z, Wd, 'rail-x', `Tapak ${j ? 'depan' : 'belakang'}`, pt));
      [P / 2, Wd - P / 2].forEach((x, i) => add(`tapak-z-${i}`, 'z', x, yF, P, Dd - 2 * P, 'rail-z', `Tapak ${i ? 'kanan' : 'kiri'}`, pt));
      add('tapak-tengah', 'x', P, yF, Dd / 2, Wd - 2 * P, 'rail-x', 'Palang tengah (dudukan tiang)', pt);
      const xs = [Wd / 2 - 12, Wd / 2 + 12];
      xs.forEach((x, i) => add(`tiang-${i}`, 'y', x, ch + P, Dd / 2, Hh - ch - 2 * P, 'post', `Tiang ${i ? 'kanan' : 'kiri'}`, pt));
      add('pegangan', 'x', -8, Hh - P / 2, Dd / 2, Wd + 16, 'custom', 'Pegangan dorong', mid);
      const base = ch + P + 28;
      for (let k = 0; k < t; k++) {
        const y = base + k * 30;
        if (y > Hh - 15) break;
        add(`ikat-${k}`, 'x', xs[0] + P / 2, y, Dd / 2, 24 - P, 'rail-x', `Palang pasak tingkat ${k + 1}`, pt);
        [-1, 1].forEach((s, q) => {
          const nm = `tingkat ${k + 1} ${q ? 'depan' : 'belakang'}`;
          add(`pasak-${k}-${q}`, 'z', Wd / 2, y, s > 0 ? Dd / 2 + P / 2 : Dd / 2 - P / 2 - 22, 22, 'custom', `Pasak plat ${nm}`, mid);
          add(`pasak-${k}-${q}-bibir`, 'y', Wd / 2, y + 2, s > 0 ? Dd / 2 + P / 2 + 20.5 : Dd / 2 - P / 2 - 20.5, 4, 'custom', `Bibir pasak ${nm}`, thin);
        });
      }
      casters = casterSet([P / 2, Wd - P / 2], [P / 2, Dd - P / 2], inch, true);
    }

    const dim = normalize(list, boards, casters, wall);
    return { members: list, boards, casters, W: dim.W, D: dim.D, H: dim.H, boardThick: 0, hinges: hinges.length ? hinges : undefined, wall: wall || undefined };
  },

  checks: (p, bld) => {
    const out: ProductCheck[] = [];
    const m = model(p);
    const P = parseInt(str(p, 'pipa', '50')) || 50;
    const pipa = str(p, 'pipa', '50');
    const beban = num(p, 'beban', 200);
    const Hh = num(p, 'tinggi');
    const Wi = num(p, 'lebar');
    const Dd = num(p, 'dalam');
    const yJ = num(p, 'tinggiJ');
    const Hd = num(p, 'tinggiDip');
    const bar = str(p, 'barbel', '220');

    // kekuatan pipa vs beban
    const cap = PIPE_LOAD[pipa] ?? 160;
    if (beban > cap) {
      const next = ['30', '40', '50', '60'].find((v) => PIPE_LOAD[v] >= beban);
      out.push({
        level: 'warn',
        message: `Pipa ${pipa}×${pipa} hanya aman untuk ±${cap} kg; rencana beban ${beban} kg bisa membuat tiang melendut atau las retak.`,
        fix: next ? { label: `Pakai pipa ${next}×${next}`, params: { pipa: next } } : { label: `Beban ${cap} kg`, params: { beban: cap } },
      });
    }

    // lebar tiang vs barbel
    if (JHOOK.includes(m)) {
      const outer = m === 'squat-stand' || m === 'bench-press' ? Wi + P / 10 : Wi + (2 * P) / 10;
      const grip = BAR_GRIP[bar] ?? 131;
      const len = BAR_LEN[bar] ?? 220;
      if (outer > grip - 3) {
        const fit = Math.floor(m === 'squat-stand' || m === 'bench-press' ? grip - 3 - P / 10 : grip - 3 - (2 * P) / 10);
        out.push({ level: 'warn', message: `Tiang terlalu lebar untuk barbel ${len} cm: kerah plat menabrak J-hook sehingga barbel tidak bisa bersandar.`, fix: { label: `Lebar ${fit} cm`, params: { lebar: fit } } });
      } else if (outer + 25 > len) out.push({ level: 'warn', message: 'Barbel lebih pendek dari jarak tiang: ujungnya tidak menumpang di J-hook.', fix: { label: 'Barbel olimpik 220', params: { barbel: '220' } } });
    }
    // J-hook di bawah palang atas
    if (RACKS.includes(m) && yJ > Hh - 25)
      out.push({ level: 'warn', message: 'J-hook terlalu dekat palang atas: barbel tidak bisa diangkat keluar.', fix: { label: `J-hook ${Math.round(Hh - 40)} cm`, params: { tinggiJ: Math.round(Hh - 40) } } });
    if (['power-rack', 'half-rack', 'rack-lipat', 'power-tower', 'pullup-dinding'].includes(m) && Hh < 200)
      out.push({ level: 'info', message: 'Palang pull-up di bawah 200 cm: pull-up harus dengan lutut ditekuk.' });
    if (['power-rack', 'half-rack', 'rack-lipat', 'power-tower', 'pullup-dinding'].includes(m))
      out.push({ level: 'info', message: `Pastikan plafon minimal ${Math.round(Hh + 20)} cm supaya kepala tidak terbentur saat pull-up.` });
    if (m === 'power-rack' && Dd < 90)
      out.push({ level: 'warn', message: 'Sangkar terlalu dangkal: Anda tidak bisa mundur selangkah saat squat di dalam rack.', fix: { label: 'Kedalaman 110 cm', params: { dalam: 110 } } });
    if (m === 'half-rack' && Dd < 85)
      out.push({ level: 'warn', message: 'Tapak terlalu pendek: rack bisa terjungkal ke depan saat barbel diletakkan di lengan pengaman.', fix: { label: 'Tapak 100 cm', params: { dalam: 100 } } });
    if (m === 'squat-stand' && yJ > Hh - 15)
      out.push({ level: 'warn', message: 'J-hook di pucuk tiang: tiang mudah terguling saat barbel dikembalikan.', fix: { label: `Tinggi ${Math.min(240, Math.round(yJ + 30))} cm`, params: { tinggi: Math.min(240, Math.round(yJ + 30)) } } });
    if (m === 'squat-stand' && Hh > 150)
      out.push({ level: 'info', message: 'Squat stand lepas: isi pasak dengan plat sebagai pemberat dan kembalikan barbel pelan-pelan.' });
    if (m === 'rack-lipat' && (Dd < 45 || Dd > 80))
      out.push({ level: 'warn', message: Dd < 45 ? 'Menjorok kurang dari 45 cm: barbel di J-hook terlalu dekat tembok untuk squat.' : 'Bingkai lipat lebih dari 80 cm menjorok jadi goyang di engsel.', fix: { label: 'Menjorok 55 cm', params: { dalam: 55 } } });
    if (m === 'rack-lipat' || m === 'pullup-dinding')
      out.push({ level: 'info', message: 'Dibaut ke tembok bata penuh / beton dengan dynabolt M10 minimal 4 titik per tiang, bukan ke tembok hebel / partisi.' });
    if (m === 'pullup-dinding' && Dd < 45)
      out.push({ level: 'warn', message: 'Palang terlalu dekat tembok: kepala dan lutut terbentur saat pull-up.', fix: { label: 'Menjorok 60 cm', params: { dalam: 60 } } });
    if (m === 'pullup-dinding' && Hh - Hd < 70)
      out.push({ level: 'warn', message: 'Pegangan dip terlalu dekat palang pull-up: kepala terbentur lengan atas saat dip.', fix: { label: `Dip ${Math.round(Hh - 90)} cm`, params: { tinggiDip: Math.max(80, Math.round(Hh - 90)) } } });
    if ((m === 'power-tower' || m === 'dip-paralel') && (Wi < 50 || Wi > 75))
      out.push({ level: 'warn', message: 'Jarak pegangan dip yang nyaman 55–65 cm (selebar bahu).', fix: { label: 'Lebar 60 cm', params: { lebar: 60 } } });
    if (m === 'pullup-dinding' && (Wi < 80 || Wi > 140))
      out.push({ level: 'warn', message: 'Palang pull-up yang pas 100–130 cm: cukup untuk pegangan lebar.', fix: { label: 'Palang 120 cm', params: { lebar: 120 } } });
    if (m === 'power-tower' && Dd < 85)
      out.push({ level: 'warn', message: 'Tapak tower terlalu pendek: tower bisa terjungkal saat Anda mengayun kaki.', fix: { label: 'Tapak 100 cm', params: { dalam: 100 } } });
    if (m === 'dip-paralel' && Dd < Hd * 0.65)
      out.push({ level: 'warn', message: 'Rel lantai terlalu pendek untuk setinggi ini: dip goyang ke depan-belakang.', fix: { label: `Tapak ${Math.min(150, Math.ceil(Hd * 0.8))} cm`, params: { dalam: Math.min(150, Math.ceil(Hd * 0.8)) } } });
    if (m === 'dip-paralel') out.push({ level: 'info', message: 'Dua bingkai lepas: atur jarak pegangan sesuai bahu, lalu ganjal karet supaya tidak bergeser.' });

    // bench
    if (BENCH.includes(m)) {
      const hj = num(p, 'tinggiJok');
      if (m !== 'bench-situp' && (hj < 40 || hj > 48))
        out.push({ level: 'warn', message: 'Jok ideal 42–45 cm dari lantai: kaki menapak rata dan punggung stabil saat menekan.', fix: { label: 'Jok 43 cm', params: { tinggiJok: 43 } } });
      if (num(p, 'lebarJok') > 34) out.push({ level: 'warn', message: 'Jok lebih dari 34 cm mengganjal bahu saat bench press.', fix: { label: 'Lebar 28 cm', params: { lebarJok: 28 } } });
    }
    if (m === 'bench-situp' && num(p, 'sudut') > 35)
      out.push({ level: 'warn', message: 'Kemiringan lebih dari 35° membuat darah turun ke kepala dan susah bangun.', fix: { label: 'Miring 25°', params: { sudut: 25 } } });
    if (m === 'bench-situp' && num(p, 'sudut') < 10)
      out.push({ level: 'warn', message: 'Kurang dari 10° hampir datar; pakai bench datar saja atau miringkan.', fix: { label: 'Miring 20°', params: { sudut: 20 } } });
    if (m === 'bench-incline') out.push({ level: 'info', message: 'Batang penyangga sudut dikunci pin baja Ø12 mm di pelat berlubang; jangan pakai baut biasa.' });
    if (m === 'bench-press') {
      const hj = num(p, 'tinggiJok');
      if (yJ < hj + 20 || yJ > hj + 45)
        out.push({ level: 'warn', message: 'J-hook bench press sebaiknya 25–35 cm di atas jok: lengan hampir lurus saat mengambil barbel.', fix: { label: `J-hook ${Math.round(hj + 30)} cm`, params: { tinggiJ: Math.round(hj + 30) } } });
    }

    // rak beban
    if (m === 'rak-dumbel' && num(p, 'tingkat') < 2) out.push({ level: 'info', message: 'Rak dumbel minimal 2 tingkat; 1 tingkat dibuat sebagai 2 tingkat.' });
    if (m === 'rak-dumbel' && Wi > 140) out.push({ level: 'info', message: 'Lebih dari 140 cm: ditambah rangka samping di tengah supaya rel pelana tidak melendut.' });
    if (m === 'rak-dumbel' && Hh < 30 + 25 * (num(p, 'tingkat') - 1))
      out.push({ level: 'warn', message: 'Tingkat terlalu rapat: dumbel besar tidak muat di bawah rel di atasnya.', fix: { label: `Tinggi ${30 + 30 * (num(p, 'tingkat') - 1)} cm`, params: { tinggi: 30 + 30 * (num(p, 'tingkat') - 1) } } });
    if (m === 'troli-plat') {
      const inch = parseInt(str(p, 'roda', '4')) || 4;
      const load = (CASTER_LOAD[inch] ?? 70) * 4;
      if (beban > load) {
        const nx = [3, 4, 5].find((v) => CASTER_LOAD[v] * 4 >= beban);
        out.push({ level: 'warn', message: `4 roda ${inch}" hanya kuat ±${load} kg; troli bisa macet atau roda pecah.`, fix: nx ? { label: `Roda ${nx}"`, params: { roda: String(nx) } } : { label: `Beban ${load} kg`, params: { beban: load } } });
      }
      const ch = casterHeight(inch);
      const t = num(p, 'tingkat');
      if (ch + P / 10 + 28 + (t - 1) * 30 > Hh - 15)
        out.push({ level: 'warn', message: 'Troli terlalu pendek untuk jumlah tingkat pasak ini.', fix: { label: `Tinggi ${Math.ceil(ch + P / 10 + 28 + (t - 1) * 30 + 25)} cm`, params: { tinggi: Math.ceil(ch + P / 10 + 28 + (t - 1) * 30 + 25) } } });
      out.push({ level: 'info', message: 'Plat besar di pasak bawah, plat kecil di atas, dan isi depan-belakang seimbang supaya troli tidak terguling.' });
    }
    if (['power-rack', 'half-rack', 'squat-stand'].includes(m))
      out.push({ level: 'info', message: 'Tiang dibor lubang Ø16–25 mm tiap 5 cm di muka depan untuk J-hook dan pengaman; beri nomor lubang supaya kiri-kanan sama tinggi.' });
    void bld;
    return out;
  },
};
