import { FrameHinge } from '../types/kitchen';
import { Board, Caster, Params, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, board, bool, casterHeight, materialParams, memberFactory, num, r1, str } from './common';

/**
 * Paddock & stand motor. Bentuk rangka (param `model`):
 * - paddock-belakang: tuas U beroda, dua lengan samping, tiang pendek di depan dengan kait swing arm, gagang miring ke belakang
 * - paddock-depan: tuas U beroda, dua tiang tinggi ditutup palang atas (bingkai), pin komstir di tengah palang atas
 * - dolly: talang panjang untuk dua roda di atas dua palang melintang beroda putar, penahan roda di kedua ujung
 * - meja-lift: platform panjang setinggi lutut di 6 kaki tegak + palang bawah, ramp berengsel, penjepit roda depan
 * - lift-gunting: platform di atas sepasang kaki gunting (X) berporos di rangka lantai, tuas pompa, ramp lepas
 * - ramp-cuci: jembatan lantai jeruji di 4 tiang, tanjakan rel miring naik & turun di kedua ujung (motor tembus)
 * - ramp-pikap: talang miring bersandar di bak mobil, kait di ujung atas, engsel lipat + kaki penopang di tengah
 * - penjepit-roda: tapak lantai berplat, buaian roda berporos (jungkit) di depan lingkar penahan ban
 * - stand-mesin: tapak T beroda, tiang tegak bertopang miring, lengan mendatar berporos dengan plat putar 4 lengan
 * - stand-velg: satu tiang di plat lantai, garpu U terbuka ke atas, takik V di ujung garpu tempat as roda berputar
 * - stand-body: kaki A di dua ujung, palang bertingkat di kedua muka miring dengan pasak menjulur untuk body / fairing
 */
const MODELS = [
  { value: 'paddock-belakang', label: 'Paddock belakang', desc: 'Tuas beroda, kait swing arm' },
  { value: 'paddock-depan', label: 'Paddock depan (pin komstir)', desc: 'Bingkai tinggi, pin masuk ke komstir' },
  { value: 'dolly', label: 'Dolly geser', desc: 'Talang beroda putar untuk menggeser motor' },
  { value: 'meja-lift', label: 'Meja lift + ramp', desc: 'Platform tetap, ramp lipat, penjepit roda' },
  { value: 'lift-gunting', label: 'Meja lift gunting', desc: 'Kaki gunting naik-turun dengan tuas pompa' },
  { value: 'ramp-cuci', label: 'Ramp cuci tembus', desc: 'Naik, datar, turun; lantai jeruji' },
  { value: 'ramp-pikap', label: 'Ramp naik pikap lipat', desc: 'Bersandar di bak mobil, lipat di tengah' },
  { value: 'penjepit-roda', label: 'Penjepit roda depan', desc: 'Buaian jungkit mengunci ban depan' },
  { value: 'stand-mesin', label: 'Stand mesin putar', desc: 'Tapak T, lengan berporos 360°' },
  { value: 'stand-velg', label: 'Stand velg garpu', desc: 'Velg berputar di garpu untuk setel jari-jari' },
  { value: 'stand-body', label: 'Stand body (fairing)', desc: 'Kaki A, pasak bertingkat dua muka' },
];
const KEYS = MODELS.map((m) => m.value);
const model = (p: Params) => {
  const m = str(p, 'model', 'paddock-belakang');
  return KEYS.includes(m) ? m : 'paddock-belakang';
};
const isM = (p: Params, ...m: string[]) => m.includes(model(p));

const PADDOCK = ['paddock-belakang', 'paddock-depan'];
const LIFT = ['meja-lift', 'lift-gunting'];
const RAMP = ['meja-lift', 'lift-gunting', 'ramp-cuci'];
const LOADED = ['paddock-belakang', 'paddock-depan', 'dolly', 'meja-lift', 'lift-gunting', 'ramp-cuci', 'ramp-pikap', 'penjepit-roda'];
const TIRE = ['dolly', 'meja-lift', 'lift-gunting', 'penjepit-roda'];

/** Lebar swing arm / garpu yang umum per jenis motor (cm) */
const ARM_BY_TYPE: Record<string, [number, number]> = { bebek: [24, 30], matic: [24, 32], sport: [28, 38], moge: [34, 45] };
/** Beban yang umum per jenis motor */
const LOAD_BY_TYPE: Record<string, string> = { bebek: '150', matic: '150', sport: '250', moge: '400' };
const LOAD_RANK: Record<string, number> = { '150': 1, '250': 2, '400': 3 };

/** Kemiringan ramp (derajat) dari tinggi & panjang miring */
const slopeDeg = (h: number, len: number) => (len <= h ? 90 : (Math.asin(h / len) * 180) / Math.PI);
/** Tinggi platform lift gunting saat turun penuh (cm) */
const lowDeck = (p: Params) => Math.round(2 * ((parseInt(str(p, 'pipa', '40')) || 40) / 10) + (BOARD_THICK[str(p, 'papan', 'kayu')] ?? 2.5) + 8);
const rampFor = (h: number, deg = 22) => Math.ceil(h / Math.sin((deg * Math.PI) / 180));

export const STAND_MOTOR: ProductDef = {
  id: 'stand-motor',
  name: 'Paddock & stand motor',
  tagline: 'garasi · bengkel · cuci motor',
  icon: 'M8 8L20 32H44V20H50M20 32L44 32M44 20L36 32M18 35a2 2 0 1 0 4 0a2 2 0 1 0-4 0M42 35a2 2 0 1 0 4 0a2 2 0 1 0-4 0',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['model', 'jenis', 'lebarArm', 'angkat', 'panjang', 'lebar', 'tinggi', 'ramp', 'hub', 'velg', 'tingkat'] },
    { id: 'bentuk', title: 'Beban & ban', keys: ['beban', 'ban'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Roda', keys: ['roda'] },
  ],
  params: [
    { key: 'model', label: 'Bentuk rangka', type: 'choice', options: MODELS },
    {
      key: 'jenis',
      label: 'Jenis motor',
      type: 'choice',
      help: 'Dipakai untuk mengecek lebar, tinggi angkat, dan beban.',
      options: [
        { value: 'bebek', label: 'Bebek', desc: '± 100 kg' },
        { value: 'matic', label: 'Matic', desc: '± 100–130 kg' },
        { value: 'sport', label: 'Sport 150–250 cc', desc: '± 140–170 kg' },
        { value: 'moge', label: 'Moge', desc: '± 200–330 kg' },
      ],
      showIf: (p) => LOADED.includes(String(p.model)),
    },
    {
      key: 'lebarArm',
      label: 'Lebar swing arm / garpu',
      type: 'number',
      unit: 'cm',
      min: 24,
      max: 46,
      step: 1,
      help: 'Ukur jarak luar ke luar swing arm (paddock belakang) atau lebar ban + ruang (paddock depan).',
      marks: [{ value: 28, label: 'bebek' }, { value: 33, label: 'sport' }, { value: 42, label: 'moge' }],
      showIf: (p) => PADDOCK.includes(String(p.model)),
    },
    {
      key: 'angkat',
      label: 'Tinggi kait (saat terangkat)',
      type: 'number',
      unit: 'cm',
      min: 15,
      max: 36,
      step: 1,
      help: 'Tinggi dudukan swing arm dari lantai. Ban naik ± 3–5 cm dari lantai.',
      marks: [{ value: 20, label: 'bebek' }, { value: 25, label: 'sport' }, { value: 30, label: 'moge' }],
      showIf: (p) => p.model === 'paddock-belakang',
    },
    {
      key: 'panjang',
      label: 'Panjang',
      type: 'number',
      unit: 'cm',
      min: 40,
      max: 240,
      step: 1,
      help: 'Paddock & penjepit: panjang tapak. Meja lift & dolly: panjang platform (motor ± 190–210 cm). Ramp cuci: panjang bagian datar. Ramp pikap: panjang miring. Stand body: panjang rangka.',
      marks: [{ value: 60, label: 'paddock' }, { value: 120, label: 'jembatan' }, { value: 200, label: 'meja lift' }],
      showIf: (p) => p.model !== 'stand-velg',
    },
    {
      key: 'lebar',
      label: 'Lebar',
      type: 'number',
      unit: 'cm',
      min: 20,
      max: 80,
      step: 1,
      help: 'Lebar platform / talang / tapak. Makin lebar makin stabil.',
      marks: [{ value: 30, label: 'talang' }, { value: 60, label: 'meja lift' }],
      showIf: (p) => !PADDOCK.includes(String(p.model)),
    },
    {
      key: 'tinggi',
      label: 'Tinggi',
      type: 'number',
      unit: 'cm',
      min: 30,
      max: 170,
      step: 1,
      help: 'Paddock depan: tinggi pin. Meja lift: tinggi platform (setinggi lutut ± 50). Ramp: tinggi jembatan / bak mobil. Stand: tinggi dudukan.',
      marks: [{ value: 50, label: 'lutut' }, { value: 90, label: 'bak pikap' }],
      showIf: (p) => p.model !== 'paddock-belakang' && p.model !== 'dolly',
    },
    {
      key: 'ramp',
      label: 'Panjang ramp',
      type: 'number',
      unit: 'cm',
      min: 60,
      max: 220,
      step: 1,
      help: 'Ramp makin panjang makin landai dan mudah didorong naik. Lift gunting: ramp lepas, dipasang saat meja turun.',
      marks: [{ value: 120, label: 'pendek' }, { value: 160, label: 'landai' }],
      showIf: (p) => RAMP.includes(String(p.model)),
    },
    {
      key: 'hub',
      label: 'Lebar as / tromol',
      type: 'number',
      unit: 'cm',
      min: 10,
      max: 26,
      step: 1,
      help: 'Jarak dalam garpu, sedikit lebih lebar dari tromol / hub roda.',
      showIf: (p) => p.model === 'stand-velg',
    },
    {
      key: 'velg',
      label: 'Ukuran velg',
      type: 'number',
      unit: 'inci',
      min: 12,
      max: 21,
      step: 1,
      marks: [{ value: 14, label: 'matic' }, { value: 17, label: 'bebek / sport' }],
      showIf: (p) => p.model === 'stand-velg',
    },
    {
      key: 'tingkat',
      label: 'Jumlah tingkat pasak',
      type: 'number',
      min: 2,
      max: 5,
      step: 1,
      help: 'Tiap tingkat di kedua muka menahan satu deret body / fairing.',
      showIf: (p) => p.model === 'stand-body',
    },
    {
      key: 'beban',
      label: 'Beban maksimal',
      type: 'choice',
      options: [
        { value: '150', label: '150 kg', desc: 'Bebek / matic' },
        { value: '250', label: '250 kg', desc: 'Sport' },
        { value: '400', label: '400 kg', desc: 'Moge' },
      ],
      showIf: (p) => LOADED.includes(String(p.model)),
    },
    {
      key: 'ban',
      label: 'Lebar ban',
      type: 'number',
      unit: 'mm',
      min: 60,
      max: 200,
      step: 5,
      help: 'Lihat tulisan di ban, mis. 110/70-17 = lebar 110 mm.',
      marks: [{ value: 80, label: 'bebek' }, { value: 110, label: 'sport' }, { value: 150, label: 'moge' }],
      showIf: (p) => TIRE.includes(String(p.model)),
    },
    ...materialParams(true),
    { key: 'roda', label: 'Pakai roda', type: 'toggle', help: 'Stand mesin bisa didorong ke tempat kerja.', showIf: (p) => p.model === 'stand-mesin' },
  ],
  defaults: {
    model: 'paddock-belakang',
    jenis: 'sport',
    lebarArm: 33,
    angkat: 25,
    panjang: 60,
    lebar: 50,
    tinggi: 50,
    ramp: 140,
    hub: 16,
    velg: 17,
    tingkat: 3,
    beban: '250',
    ban: 110,
    pipa: '30',
    papan: 'kayu',
    warna: '#1f2226',
    roda: true,
  },
  groups: [
    { id: 'paddock', name: 'Paddock & dolly', desc: 'Paddock belakang pengait swing arm, paddock depan pin komstir, dolly geser' },
    { id: 'servis-cuci', name: 'Meja servis & ramp', desc: 'Meja lift + ramp, lift gunting, ramp cuci, ramp pikap, penjepit roda depan' },
    { id: 'stand-komponen', name: 'Stand komponen', desc: 'Stand mesin putar' },
  ],
  signature: (p) => `stand-motor:${model(p)}`,
  presets: [
    {
      id: 'paddock-belakang',
      group: 'paddock',
      name: 'Paddock belakang',
      desc: 'tuas U beroda: tiang pendek berkait di depan, siku penguat, gagang miring ke belakang',
      params: { model: 'paddock-belakang', jenis: 'sport', lebarArm: 33, angkat: 25, panjang: 60, beban: '250', pipa: '30' },
      sizes: [
        { label: 'Sport 150–250 cc', desc: 'lebar 33 cm, kait 25 cm', params: { jenis: 'sport', lebarArm: 33, angkat: 25, panjang: 60, beban: '250' } },
        { label: 'Bebek / trail kecil', desc: 'lebar 27 cm, kait 20 cm', params: { jenis: 'bebek', lebarArm: 27, angkat: 20, panjang: 55, beban: '150' } },
        { label: 'Moge', desc: 'lebar 42 cm, kait 30 cm', params: { jenis: 'moge', lebarArm: 42, angkat: 30, panjang: 70, beban: '400', pipa: '40' } },
      ],
    },
    {
      id: 'paddock-depan',
      group: 'paddock',
      name: 'Paddock depan pin komstir',
      desc: 'tuas U beroda dengan dua tiang tinggi ditutup palang atas, pin tegak di tengah masuk ke komstir',
      params: { model: 'paddock-depan', jenis: 'sport', lebarArm: 36, tinggi: 80, panjang: 65, beban: '250', pipa: '30' },
      sizes: [
        { label: 'Sport', desc: 'pin 80 cm, lebar 36 cm', params: { jenis: 'sport', lebarArm: 36, tinggi: 80, panjang: 65, beban: '250' } },
        { label: 'Moge / sport fairing', desc: 'pin 90 cm, lebar 42 cm', params: { jenis: 'moge', lebarArm: 42, tinggi: 90, panjang: 75, beban: '400', pipa: '40' } },
        { label: 'Naked kecil', desc: 'pin 70 cm, lebar 32 cm', params: { jenis: 'sport', lebarArm: 32, tinggi: 70, panjang: 60, beban: '250' } },
      ],
    },
    {
      id: 'dolly',
      group: 'paddock',
      name: 'Dolly geser parkir',
      desc: 'talang panjang dua roda di atas dua palang melintang beroda putar, penahan ban di kedua ujung',
      params: { model: 'dolly', jenis: 'matic', panjang: 190, lebar: 50, ban: 100, beban: '150', pipa: '30' },
      sizes: [
        { label: 'Matic / bebek', desc: '190 cm, ban 100 mm', params: { jenis: 'matic', panjang: 190, lebar: 50, ban: 100, beban: '150' } },
        { label: 'Sport', desc: '205 cm, ban 140 mm', params: { jenis: 'sport', panjang: 205, lebar: 55, ban: 140, beban: '250' } },
        { label: 'Moge', desc: '220 cm, ban 180 mm', params: { jenis: 'moge', panjang: 220, lebar: 60, ban: 180, beban: '400', pipa: '40' } },
      ],
    },
    {
      id: 'meja-lift',
      group: 'servis-cuci',
      name: 'Meja lift + ramp lipat',
      desc: 'platform setinggi lutut di 6 kaki tegak + palang bawah, ramp berengsel di belakang, penjepit roda di depan',
      params: { model: 'meja-lift', jenis: 'sport', panjang: 200, lebar: 60, tinggi: 50, ramp: 140, ban: 110, beban: '250', pipa: '40' },
      sizes: [
        { label: 'Bengkel umum', desc: '200 × 60 × 50 cm, ramp 140', params: { panjang: 200, lebar: 60, tinggi: 50, ramp: 140, jenis: 'sport', beban: '250' } },
        { label: 'Garasi rumah (bebek/matic)', desc: '190 × 50 × 40 cm, ramp 110', params: { panjang: 190, lebar: 50, tinggi: 40, ramp: 110, jenis: 'matic', beban: '150', ban: 90 } },
        { label: 'Moge', desc: '220 × 70 × 55 cm, ramp 160', params: { panjang: 220, lebar: 70, tinggi: 55, ramp: 160, jenis: 'moge', beban: '400', ban: 160 } },
      ],
    },
    {
      id: 'lift-gunting',
      group: 'servis-cuci',
      name: 'Meja lift gunting',
      desc: 'platform di atas sepasang kaki gunting X berporos di rangka lantai, batang pendorong + tuas pompa',
      params: { model: 'lift-gunting', jenis: 'sport', panjang: 200, lebar: 60, tinggi: 70, ramp: 120, ban: 110, beban: '250', pipa: '40' },
      sizes: [
        { label: 'Bengkel (terangkat 70 cm)', desc: '200 × 60 cm', params: { panjang: 200, lebar: 60, tinggi: 70, ramp: 120 } },
        { label: 'Garasi (terangkat 55 cm)', desc: '190 × 55 cm', params: { panjang: 190, lebar: 55, tinggi: 55, ramp: 100, jenis: 'matic', beban: '150', ban: 90 } },
        { label: 'Moge (terangkat 80 cm)', desc: '220 × 70 cm', params: { panjang: 220, lebar: 70, tinggi: 80, ramp: 120, jenis: 'moge', beban: '400', ban: 160 } },
      ],
    },
    {
      id: 'ramp-cuci',
      group: 'servis-cuci',
      name: 'Ramp cuci tembus',
      desc: 'jembatan lantai jeruji di 4 tiang, tanjakan rel miring naik di belakang dan turun di depan',
      params: { model: 'ramp-cuci', jenis: 'matic', panjang: 120, lebar: 35, tinggi: 40, ramp: 120, beban: '250', pipa: '40' },
      sizes: [
        { label: 'Cuci motor rumahan', desc: 'tinggi 40 cm, jembatan 120 cm', params: { panjang: 120, lebar: 35, tinggi: 40, ramp: 120 } },
        { label: 'Usaha cuci motor', desc: 'tinggi 50 cm, jembatan 150 cm', params: { panjang: 150, lebar: 40, tinggi: 50, ramp: 140 } },
        { label: 'Rendah', desc: 'tinggi 30 cm, jembatan 100 cm', params: { panjang: 100, lebar: 32, tinggi: 30, ramp: 90 } },
      ],
    },
    {
      id: 'ramp-pikap',
      group: 'servis-cuci',
      name: 'Ramp naik pikap lipat',
      desc: 'talang miring bersandar di bak mobil dengan kait di ujung atas, engsel lipat + kaki penopang di tengah',
      params: { model: 'ramp-pikap', jenis: 'sport', panjang: 220, lebar: 30, tinggi: 85, beban: '250', pipa: '40' },
      sizes: [
        { label: 'Pikap (bak 85 cm)', desc: 'panjang 220 cm', params: { panjang: 220, lebar: 30, tinggi: 85 } },
        { label: 'Truk engkel (bak 100 cm)', desc: 'panjang 240 cm', params: { panjang: 240, lebar: 32, tinggi: 100 } },
        { label: 'Bak rendah / trailer', desc: 'panjang 180 cm', params: { panjang: 180, lebar: 28, tinggi: 60 } },
      ],
    },
    {
      id: 'penjepit-roda',
      group: 'servis-cuci',
      name: 'Penjepit roda depan',
      desc: 'tapak lantai berplat, buaian ban berporos (jungkit) di depan lingkar penahan bertopang miring',
      params: { model: 'penjepit-roda', jenis: 'sport', panjang: 60, lebar: 45, tinggi: 45, ban: 110, beban: '250', pipa: '30' },
      sizes: [
        { label: 'Ban 90–120 mm', desc: 'tapak 60 × 45 cm', params: { panjang: 60, lebar: 45, tinggi: 45, ban: 110 } },
        { label: 'Ban 70–90 mm (bebek)', desc: 'tapak 50 × 40 cm', params: { panjang: 50, lebar: 40, tinggi: 40, ban: 80, jenis: 'bebek', beban: '150' } },
        { label: 'Ban 120–150 mm (moge)', desc: 'tapak 70 × 55 cm', params: { panjang: 70, lebar: 55, tinggi: 50, ban: 140, jenis: 'moge', beban: '400', pipa: '40' } },
      ],
    },
    {
      id: 'stand-mesin',
      group: 'stand-komponen',
      name: 'Stand mesin putar',
      desc: 'tapak T beroda, tiang tegak bertopang miring, lengan mendatar berporos dengan plat putar 4 lengan',
      params: { model: 'stand-mesin', panjang: 70, lebar: 55, tinggi: 80, roda: true, pipa: '40' },
      sizes: [
        { label: 'Mesin bebek / matic', desc: 'dudukan 75 cm', params: { panjang: 65, lebar: 50, tinggi: 75 } },
        { label: 'Mesin sport / moge', desc: 'dudukan 85 cm', params: { panjang: 80, lebar: 60, tinggi: 85 } },
        { label: 'Diam (tanpa roda)', desc: 'dudukan 80 cm', params: { panjang: 70, lebar: 55, tinggi: 80, roda: false } },
      ],
    },
  ],
  summary: (p) => {
    const m = model(p);
    const mm = MODELS.find((x) => x.value === m)!.label;
    if (m === 'paddock-belakang') return `${mm} · lebar ${num(p, 'lebarArm')} cm · kait ${num(p, 'angkat')} cm · ${str(p, 'beban')} kg`;
    if (m === 'paddock-depan') return `${mm} · lebar ${num(p, 'lebarArm')} cm · pin ${num(p, 'tinggi')} cm · ${str(p, 'beban')} kg`;
    if (m === 'dolly') return `${mm} · ${num(p, 'panjang')} × ${num(p, 'lebar')} cm · ban ${num(p, 'ban')} mm`;
    if (m === 'stand-velg') return `${mm} · velg ${num(p, 'velg')}" · as ${num(p, 'tinggi')} cm`;
    if (m === 'stand-body') return `${mm} · ${num(p, 'panjang')} × ${num(p, 'tinggi')} cm · ${num(p, 'tingkat')} tingkat`;
    if (m === 'stand-mesin') return `${mm} · dudukan ${num(p, 'tinggi')} cm${bool(p, 'roda') ? ' · beroda' : ''}`;
    if (m === 'ramp-pikap') return `${mm} · ${num(p, 'panjang')} cm ke bak ${num(p, 'tinggi')} cm`;
    const extra = RAMP.includes(m) ? ` · ramp ${num(p, 'ramp')} cm` : '';
    return `${mm} · ${num(p, 'panjang')} × ${num(p, 'lebar')} × ${num(p, 'tinggi')} cm${extra}`;
  },

  build: (p) => {
    const m = model(p);
    const L = (parseInt(str(p, 'pipa', '30')) || 30) / 10;
    const b = BOARD_THICK[str(p, 'papan', 'kayu')] ?? 2.5;
    const t: [number, number] = [L * 10, L * 10];
    const rail: [number, number] = [20, 20];
    const flat: [number, number] = [20, 40];
    const thin: [number, number] = [15, 15];
    const { list, add, line } = memberFactory();
    const boards: Board[] = [];
    const hinges: FrameHinge[] = [];
    let casters: Caster[] = [];
    let W = 50;
    let D = 50;
    let H = 50;
    let wall = false;

    type V3 = [number, number, number];
    /** Batas muka batang yang ditemui ujung batang miring: ujung tidak boleh melewati bidang ini */
    type Lim = { yMin?: number; yMax?: number; zMin?: number; zMax?: number };
    /**
     * Batang miring di bidang y-z. Ujungnya dipotong datar (bila curam) atau tegak (bila landai), jadi
     * potongan itu punya lebar; titik as ujung digeser supaya bidang potong menempel RATA di muka batang
     * yang ditemui (la untuk ujung a, lb untuk ujung b), tidak masuk ke dalamnya.
     */
    const lineYZ = (id: string, a: V3, bp: V3, role: Parameters<typeof line>[3], label: string, tube: [number, number], la: Lim = {}, lb: Lim = {}): [V3, V3] => {
      const th = tube[1] / 10;
      const A: V3 = [...a];
      const B: V3 = [...bp];
      for (let it = 0; it < 8; it++) {
        const dy = B[1] - A[1];
        const dz = B[2] - A[2];
        const len = Math.hypot(B[0] - A[0], dy, dz) || 1;
        const yCut = Math.abs(dy) / len >= 0.35;
        const ey = yCut ? 0 : th / 2 / (Math.abs(dz) / len);
        const ez = yCut ? th / 2 / (Math.abs(dy) / len) : 0;
        const fit = (P: V3, l: Lim) => {
          if (l.yMin != null) P[1] = l.yMin + ey;
          if (l.yMax != null) P[1] = l.yMax - ey;
          if (l.zMin != null) P[2] = l.zMin + ez;
          if (l.zMax != null) P[2] = l.zMax - ez;
        };
        fit(A, la);
        fit(B, lb);
      }
      line(id, A, B, role, label, tube);
      return [A, B];
    };
    /** z muka samping batang miring a→b (tebal th) di rentang tinggi [y0, y1]; dir +1 = muka ke arah z besar */
    const sideZ = (a: V3, bp: V3, th: number, y0: number, y1: number, dir: 1 | -1) => {
      const dy = bp[1] - a[1];
      const dz = bp[2] - a[2];
      const uy = Math.abs(dy) / Math.hypot(dy, dz);
      const zs = [y0, y1].map((y) => a[2] + ((y - a[1]) * dz) / dy + (dir * th) / 2 / uy);
      return dir > 0 ? Math.max(...zs) : Math.min(...zs);
    };

    /** Penjepit roda di atas platform: lingkar penahan depan + topang miring + bibir samping. y0 = muka atas rangka */
    const wheelStop = (id: string, xc: number, zFront: number, y0: number, zBar: number) => {
      const cw = num(p, 'ban', 110) / 10 + 3;
      const xs = [xc - cw / 2 - 1, xc + cw / 2 + 1];
      const hh = 34;
      xs.forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        add(`${id}-tiang-${i}`, 'y', x, y0, zFront, hh, 'post', `Penjepit roda: tiang ${nm}`, rail);
        // topang: ujung atas rata di muka belakang tiang, kaki rata di muka atas rangka
        const [ta, tb] = lineYZ(`${id}-topang-${i}`, [x, y0 + hh - 4, zFront - 1], [x, y0, zBar], 'custom', `Penjepit roda: topang miring ${nm}`, rail, { zMax: zFront - 1 }, { yMin: y0 });
        // bibir: dari muka depan topang sampai muka belakang tiang
        const zs = sideZ(ta, tb, 2, y0 + 6 - 0.75, y0 + 6 + 0.75, 1);
        add(`${id}-bibir-${i}`, 'z', x, y0 + 6, zs, zFront - 1 - zs, 'custom', `Penjepit roda: bibir samping ${nm}`, thin);
      });
      add(`${id}-atas`, 'x', xs[0] - 1, y0 + hh + 1, zFront, xs[1] - xs[0] + 2, 'custom', 'Penjepit roda: lingkar atas', rail);
      return hh;
    };

    /** Ramp dari platform (zTop, yTop) turun ke lantai di z kecil; rangka miring + anak tangga + papan */
    const rampDown = (id: string, x0: number, x1: number, zTop: number, yTop: number, len: number, hinged: boolean, withBoard: boolean) => {
      const run = Math.sqrt(Math.max(1, len * len - yTop * yTop));
      const z0 = zTop - run;
      [x0, x1].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        line(`${id}-${i}`, [x, yTop, zTop], [x, L / 2, z0], 'rail-z', `Ramp: rel ${nm}`, t);
        if (hinged)
          hinges.push({ id: `${id}-engsel-${i}`, memberId: `${id}-${i}`, type: 'barrel-weld', mode: 'point', pos: 0, side: 'end', foldAxis: 'y', foldSign: 1, carry: true, label: `Engsel ramp ${nm} (dilipat naik ke platform)` });
      });
      const nr = Math.max(2, Math.round(len / 30));
      for (let k = 0; k <= nr; k++) {
        // palang di antara kedua rel; yang paling atas mundur dari muka belakang rangka platform, yang paling bawah di dalam ujung rel
        const z = zTop - 1 - ((run - 2) * k) / nr;
        const y = yTop - ((yTop - L / 2) * (zTop - z)) / run;
        add(`${id}-anak-${k}`, 'x', x0 + L / 2, y, z, x1 - x0 - L, 'rail-x', `Ramp: palang ${k + 1}`, rail);
      }
      if (withBoard && b > 0) {
        const ang = (Math.atan2(yTop - L / 2, run) * 180) / Math.PI;
        const yc = (yTop + L / 2) / 2 + L / 2 + b / 2;
        const zc = (zTop + z0) / 2;
        const bd: Board = { ...board(`${id}-papan`, 'Papan ramp', x0 - L / 2, x1 + L / 2, yc - b / 2, yc + b / 2, zc - len / 2, zc + len / 2), rotX: r1(-ang) };
        if (hinged) bd.attachTo = `${id}-0`;
        boards.push(bd);
      }
      return run;
    };

    if (m === 'paddock-belakang' || m === 'paddock-depan') {
      const front = m === 'paddock-depan';
      const arm = num(p, 'lebarArm', 33);
      const len = num(p, 'panjang', 60);
      const c = casterHeight(3);
      W = arm + 2 * L;
      const xs = [L / 2, W - L / 2];
      const zr = 45; // jangkauan gagang ke belakang
      const zf = zr + len - L / 2;
      const yA = c + L / 2;
      const top = front ? num(p, 'tinggi', 80) : num(p, 'angkat', 25);
      xs.forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        add(`lengan-${i}`, 'z', x, yA, zr, len, 'rail-z', `Lengan tuas ${nm}`, t);
        // tiang berdiri di atas lengan; paddock depan: berhenti di bawah palang atas yang menutup kedua tiang
        add(`tiang-${i}`, 'y', x, c + L, zf, top - c - L - (front ? L : 0), 'post', `Tiang ${nm}`, t);
        // siku: kaki rata di atas lengan, ujung atas rata di muka belakang tiang
        lineYZ(`siku-${i}`, [x, c + L, zf - Math.min(18, len / 3)], [x, Math.min(top - 4, c + L + 18), zf - L / 2], 'custom', `Siku penguat ${nm}`, rail, { yMin: c + L }, { zMax: zf - L / 2 });
        // gagang: kaki rata di atas ujung lengan, ujung atas rata di bawah pegangan
        lineYZ(`gagang-${i}`, [x, c + L, zr + L / 2], [x, front ? 90 : 75, 2], 'custom', `Gagang tuas ${nm}`, t, { yMin: c + L }, { yMax: (front ? 90 : 75) - L / 2 });
        if (!front) {
          // kait L: plat dudukan swing arm duduk di atas tiang, bibir penahan berdiri di ujung plat
          add(`kait-${i}`, 'z', x, top + 2, zf - L / 2, 7 + L / 2, 'custom', `Kait swing arm ${nm}`, flat);
          add(`bibir-${i}`, 'y', x, top + 4, zf + 7 - 0.75, 4, 'custom', `Bibir kait ${nm}`, thin);
        }
      });
      add('palang-belakang', 'x', L, yA, zr + L / 2, W - 2 * L, 'rail-x', 'Palang belakang tuas', t);
      add('pegangan', 'x', 0, front ? 90 : 75, 2, W, 'rail-x', 'Pegangan tuas', t);
      if (front) {
        add('palang-atas', 'x', 0, top - L / 2, zf, W, 'rail-x', 'Palang atas (bingkai)', t);
        add('pin-komstir', 'y', W / 2, top, zf, 9, 'custom', 'Pin komstir (masuk ke lubang komstir)', rail);
        add('palang-tengah', 'x', L, c + L + (top - c) * 0.45, zf, W - 2 * L, 'rail-x', 'Palang tengah bingkai', rail);
      }
      casters = xs.map((x, i) => ({ id: `roda-${i}`, x, z: zf, topY: c, sizeInch: 3, brake: false }));
      D = zf + L / 2 + (front ? 0 : 7);
      H = Math.max(front ? 90 : 75, top + (front ? 9 : 6)) + L / 2;
    } else if (m === 'dolly') {
      const len = num(p, 'panjang', 190);
      const tw = num(p, 'ban', 100) / 10 + 4;
      W = Math.max(num(p, 'lebar', 50), tw + 2 * L + 10);
      D = len;
      const c = casterHeight(3);
      const xc = W / 2;
      const zs = [Math.min(25, len * 0.15), len - Math.min(25, len * 0.15)];
      zs.forEach((z, i) => add(`palang-roda-${i}`, 'x', 0, c + L / 2, z, W, 'rail-x', `Palang roda ${i ? 'depan' : 'belakang'}`, t));
      const yR = c + L + L / 2;
      const xr = [xc - tw / 2 - L / 2, xc + tw / 2 + L / 2];
      xr.forEach((x, i) => add(`talang-${i}`, 'z', x, yR, 0, len, 'rail-z', `Bibir talang ${i ? 'kanan' : 'kiri'}`, t));
      if (b > 0) boards.push(board('alas-talang', 'Alas talang', xc - tw / 2, xc + tw / 2, c + L, c + L + b, 2, len - 2));
      // penahan ban di kedua ujung
      [
        { z: 1, nm: 'belakang', h: 12 },
        { z: len - 1, nm: 'depan', h: 22 },
      ].forEach((e, i) => {
        xr.forEach((x, j) => add(`penahan-${i}-${j}`, 'y', x, yR + L / 2, e.z, e.h, 'post', `Penahan ban ${e.nm} ${j ? 'kanan' : 'kiri'}`, rail));
        add(`penahan-${i}-atas`, 'x', xr[0] - 1, yR + L / 2 + e.h + 1, e.z, xr[1] - xr[0] + 2, 'custom', `Penahan ban ${e.nm}: palang atas`, rail);
      });
      casters = [0, W].flatMap((xe, i) => zs.map((z, j) => ({ id: `roda-${i}-${j}`, x: xe === 0 ? L : W - L, z, topY: c, sizeInch: 3, brake: j === 0 })));
      H = yR + L / 2 + 22 + 2;
    } else if (m === 'meja-lift' || m === 'lift-gunting') {
      const len = num(p, 'panjang', 200);
      W = num(p, 'lebar', 60);
      const Hd = num(p, 'tinggi', 50);
      const yF = Hd - b - L / 2;
      const rw = Math.min(W - 2 * L, 34);
      const rx0 = W / 2 - rw / 2;
      const rx1 = W / 2 + rw / 2;
      const rl = num(p, 'ramp', 140);
      const run = m === 'meja-lift' ? Math.sqrt(Math.max(1, rl * rl - yF * yF)) : rl;
      const z0 = run + 2; // awal platform
      const z1 = z0 + len;
      // rangka platform
      [L / 2, W - L / 2].forEach((x, i) => add(`platform-${i}`, 'z', x, yF, z0, len, 'rail-z', `Rangka platform ${i ? 'kanan' : 'kiri'}`, t));
      const nj = Math.max(3, Math.round(len / 50) + 1);
      for (let k = 0; k < nj; k++) {
        const z = k === 0 ? z0 + L / 2 : k === nj - 1 ? z1 - L / 2 : z0 + (len * k) / (nj - 1);
        add(`gelagar-${k}`, 'x', L, yF, z, W - 2 * L, 'rail-x', `Gelagar platform ${k + 1}`, k === 0 || k === nj - 1 ? t : rail);
      }
      if (b > 0) boards.push(board('papan-platform', 'Papan platform', 0, W, yF + L / 2, yF + L / 2 + b, z0, z1));
      if (m === 'meja-lift') {
        const zp = [z0 + L / 2, z0 + len / 2, z1 - L / 2];
        [L / 2, W - L / 2].forEach((x, i) =>
          zp.forEach((z, j) => add(`kaki-${i}-${j}`, 'y', x, 0, z, yF - L / 2, 'post', `Kaki ${i ? 'kanan' : 'kiri'} ${['belakang', 'tengah', 'depan'][j]}`, t))
        );
        const yb = Math.min(15, yF / 3);
        // palang bawah memanjang dipotong di kaki tengah: tiap potong menempel di sisi kaki
        [L / 2, W - L / 2].forEach((x, i) =>
          [0, 1].forEach((s) => {
            const za = s ? zp[1] + L / 2 : zp[0] + L / 2;
            const zb = s ? zp[2] - L / 2 : zp[1] - L / 2;
            add(`palang-bawah-${i}-${s}`, 'z', x, yb, za, zb - za, 'rail-z', `Palang bawah ${i ? 'kanan' : 'kiri'} ${s ? 'depan' : 'belakang'}`, rail);
          })
        );
        zp.forEach((z, j) => add(`palang-lintang-${j}`, 'x', L, yb, z, W - 2 * L, 'rail-x', `Palang bawah melintang ${j + 1}`, rail));
      } else {
        // rangka lantai + kaki gunting X di kiri & kanan
        [L / 2, W - L / 2].forEach((x, i) => add(`lantai-${i}`, 'z', x, L / 2, z0, len, 'rail-z', `Rangka lantai ${i ? 'kanan' : 'kiri'}`, t));
        [z0 + L / 2, z1 - L / 2].forEach((z, j) => add(`lantai-lintang-${j}`, 'x', L, L / 2, z, W - 2 * L, 'rail-x', `Rangka lantai melintang ${j ? 'depan' : 'belakang'}`, t));
        const za = z0 + 12;
        const zb = z1 - 12;
        const ym = (L + yF - L / 2) / 2;
        const zm = (za + zb) / 2;
        // kaki gunting luar (a) & dalam (b) bersebelahan, bukan di bidang yang sama: bersilang di poros tengah
        [
          { xa: 1.5 * L, xb: 2.5 * L },
          { xa: W - 1.5 * L, xb: W - 2.5 * L },
        ].forEach(({ xa, xb }, i) => {
          const nm = i ? 'kanan' : 'kiri';
          lineYZ(`gunting-a-${i}`, [xa, L, za], [xa, yF - L / 2, zb], 'post', `Kaki gunting ${nm} (poros belakang → rel geser depan)`, t, {}, { yMax: yF - L / 2 });
          lineYZ(`gunting-b-${i}`, [xb, L, zb], [xb, yF - L / 2, za], 'post', `Kaki gunting ${nm} (rel geser depan → poros belakang)`, t, {}, { yMax: yF - L / 2 });
        });
        // poros tengah di antara kedua kaki dalam (menempel di sisi dalamnya)
        add('poros-tengah', 'x', 3 * L, ym, zm, W - 6 * L, 'custom', 'Poros tengah gunting', rail);
        add('poros-bawah', 'x', 2 * L, L + 1, za, W - 4 * L, 'custom', 'Poros bawah (engsel tetap)', rail);
        add('poros-atas', 'x', 3 * L, yF - L / 2 - 1, za, W - 6 * L, 'custom', 'Poros atas (engsel tetap)', rail);
        add('dudukan-dongkrak', 'x', L, L / 2, zb - 25, W - 2 * L, 'rail-x', 'Dudukan dongkrak', t);
        // pendorong: kaki rata di atas dudukan, ujung atas rata di bawah poros tengah
        lineYZ('pendorong', [W / 2, L, zb - 25], [W / 2, ym - 1, zm], 'custom', 'Batang pendorong (dongkrak hidrolik)', t, { yMin: L }, { yMax: ym - 1 });
        line('tuas-pompa', [W / 2, L, z1 - L], [W / 2, 28, z1 + 30], 'custom', 'Tuas pompa (diinjak)', rail);
        hinges.push({ id: 'engsel-gunting', memberId: 'poros-tengah', type: 'barrel-weld', mode: 'axle', pos: 0, side: 'end', foldAxis: 'x', foldSign: 1, label: 'Poros tengah gunting' });
      }
      if (m === 'meja-lift') rampDown('ramp', rx0, rx1, z0, yF, rl, true, true);
      else {
        // ramp lepas: saat meja diangkat, ramp diletakkan rata di lantai di belakang meja
        [rx0, rx1].forEach((x, i) => add(`ramp-${i}`, 'z', x, L / 2, z0 - rl, rl, 'rail-z', `Ramp lepas: rel ${i ? 'kanan' : 'kiri'}`, t));
        const nr = Math.max(2, Math.round(rl / 30));
        for (let k = 0; k <= nr; k++) add(`ramp-anak-${k}`, 'x', rx0 + L / 2, L / 2, z0 - rl + L / 2 + ((rl - L) * k) / nr, rx1 - rx0 - L, 'rail-x', `Ramp lepas: palang ${k + 1}`, rail);
        if (b > 0) boards.push(board('ramp-papan', 'Papan ramp lepas', rx0 - L / 2, rx1 + L / 2, L, L + b, z0 - rl, z0 - 1));
      }
      const hh = wheelStop('jepit', W / 2, z1 - L / 2, yF + L / 2, z1 - 32);
      D = z1 + (m === 'lift-gunting' ? 30 : 0);
      H = yF + L / 2 + hh + 2;
    } else if (m === 'ramp-cuci') {
      const len = num(p, 'panjang', 120);
      W = num(p, 'lebar', 35);
      const Hd = num(p, 'tinggi', 40);
      const yT = Hd - L / 2;
      const rl = num(p, 'ramp', 120);
      const run = Math.sqrt(Math.max(1, rl * rl - yT * yT));
      const z0 = run;
      const z1 = run + len;
      [L / 2, W - L / 2].forEach((x, i) => add(`jembatan-${i}`, 'z', x, yT, z0, len, 'rail-z', `Rel jembatan ${i ? 'kanan' : 'kiri'}`, t));
      [z0 + L / 2, z1 - L / 2].forEach((z, j) => {
        [L / 2, W - L / 2].forEach((x, i) => add(`tiang-${i}-${j}`, 'y', x, 0, z, yT - L / 2, 'post', `Tiang ${i ? 'kanan' : 'kiri'} ${j ? 'depan' : 'belakang'}`, t));
        add(`palang-bawah-x-${j}`, 'x', L, 10, z, W - 2 * L, 'rail-x', `Palang bawah ${j ? 'depan' : 'belakang'}`, rail);
      });
      [L / 2, W - L / 2].forEach((x, i) => {
        add(`palang-bawah-z-${i}`, 'z', x, 10, z0 + L, len - 2 * L, 'rail-z', `Palang bawah ${i ? 'kanan' : 'kiri'}`, rail);
        // silang: kaki rata di atas palang bawah & di muka tiang belakang, ujung atas rata di bawah rel jembatan & di muka tiang depan
        lineYZ(`silang-${i}`, [x, 10 + L / 2, z0 + L], [x, yT - L / 2, z1 - L], 'custom', `Silang samping ${i ? 'kanan' : 'kiri'}`, rail, { yMin: 10 + rail[1] / 20, zMin: z0 + L }, { yMax: yT - L / 2, zMax: z1 - L });
      });
      // lantai jeruji melintang (air & busa lolos ke bawah)
      const nj = Math.max(4, Math.round(len / 10));
      for (let k = 0; k <= nj; k++) add(`jeruji-${k}`, 'x', L, yT + L / 2 - 1, z0 + 1 + ((len - 2) * k) / nj, W - 2 * L, 'custom', `Jeruji lantai ${k + 1}`, rail);
      // tanjakan naik (belakang) & turun (depan)
      [
        { id: 'naik', zTop: z0, zEnd: 0 },
        { id: 'turun', zTop: z1, zEnd: z1 + run },
      ].forEach((r) => {
        [L / 2, W - L / 2].forEach((x, i) => line(`${r.id}-${i}`, [x, yT, r.zTop], [x, L / 2, r.zEnd], 'rail-z', `Tanjakan ${r.id}: rel ${i ? 'kanan' : 'kiri'}`, t));
        const nr = Math.max(3, Math.round(rl / 15));
        for (let k = 1; k < nr; k++) {
          const f = k / nr;
          add(`${r.id}-anak-${k}`, 'x', L, yT - (yT - L / 2) * f + L / 2, r.zTop + (r.zEnd - r.zTop) * f, W - 2 * L, 'custom', `Tanjakan ${r.id}: jeruji ${k}`, thin);
        }
        add(`${r.id}-kaki`, 'x', L, L / 2, r.zEnd + (r.zEnd > r.zTop ? -L / 2 : L / 2), W - 2 * L, 'rail-x', `Tanjakan ${r.id}: palang lantai`, t);
      });
      D = z1 + run;
      H = Hd;
    } else if (m === 'ramp-pikap') {
      wall = true;
      const len = num(p, 'panjang', 220);
      W = num(p, 'lebar', 30);
      const hb = num(p, 'tinggi', 85);
      const yTop = hb + 1;
      const run = Math.sqrt(Math.max(1, len * len - yTop * yTop));
      const zt = 8;
      const zb = zt + run;
      const mid = (f: number): [number, number] => [yTop - (yTop - L / 2) * f, zt + run * f];
      const [ym, zm] = mid(0.5);
      [L / 2, W - L / 2].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        line(`atas-${i}`, [x, yTop, zt], [x, ym, zm], 'rail-z', `Rel ${nm} bagian atas`, t);
        line(`bawah-${i}`, [x, ym, zm], [x, L / 2, zb], 'rail-z', `Rel ${nm} bagian bawah`, t);
        hinges.push({ id: `engsel-${i}`, memberId: `bawah-${i}`, type: 'folding-lock', mode: 'point', pos: 0, side: 'end', foldAxis: 'y', foldSign: 1, carry: true, label: `Engsel lipat tengah ${nm}` });
        // kait ujung atas ke bibir bak
        // plat kait duduk di atas ujung rel, bibir kait turun dari bawah ujung plat
        add(`kait-${i}`, 'z', x, yTop + 2, 0, zt, 'custom', `Kait bak ${nm}`, flat);
        add(`kait-turun-${i}`, 'y', x, yTop - 5 - L / 2, 0.75, 5 + L / 2, 'custom', `Bibir kait ${nm}`, thin);
        // kaki penopang di engsel: ujung atas rata di muka bawah rel (rel miring, jadi diukur di sisi kaki yang lebih rendah)
        add(`kaki-${i}`, 'y', x, 0, zm, ym - ((yTop - L / 2) / run) * (rail[0] / 20) - (L / 2) * (len / run), 'post', `Kaki penopang tengah ${nm}`, rail);
      });
      add('kaki-palang', 'x', L / 2 + rail[0] / 20, 8, zm, W - L - rail[0] / 10, 'rail-x', 'Palang kaki penopang', rail);
      const nr = Math.max(6, Math.round(len / 18));
      for (let k = 0; k <= nr; k++) {
        const [y, z] = mid(k / nr);
        add(`anak-${k}`, 'x', L, y + L / 2 - 1, z, W - 2 * L, k === 0 || k === nr ? 'rail-x' : 'custom', `Palang pijak ${k + 1}`, rail);
      }
      add('engsel-palang', 'x', L, ym - L / 2 - 1, zm, W - 2 * L, 'rail-x', 'Palang engsel tengah', rail);
      D = zb + L / 2;
      H = yTop + L / 2 + 2;
    } else if (m === 'penjepit-roda') {
      const len = num(p, 'panjang', 60);
      W = num(p, 'lebar', 45);
      const cw = num(p, 'ban', 110) / 10 + 2;
      const hh = num(p, 'tinggi', 45);
      const xc = W / 2;
      [L / 2, W - L / 2].forEach((x, i) => add(`tapak-${i}`, 'z', x, L / 2, 0, len, 'rail-z', `Tapak ${i ? 'kanan' : 'kiri'}`, t));
      [L / 2, len - L / 2].forEach((z, j) => add(`tapak-lintang-${j}`, 'x', L, L / 2, z, W - 2 * L, 'rail-x', `Tapak melintang ${j ? 'depan' : 'belakang'}`, t));
      boards.push({ ...board('plat-lantai', 'Plat lantai', 0, W, L, L + 0.3, 0, len), steelMm: 3 });
      // lingkar penahan ban
      const zh = len * 0.78;
      const xs = [xc - cw / 2 - 2, xc + cw / 2 + 2];
      xs.forEach((x, i) => {
        add(`lingkar-tiang-${i}`, 'y', x, L + 0.3, zh, hh, 'post', `Penahan ban: tiang ${i ? 'kanan' : 'kiri'}`, t);
        lineYZ(`lingkar-topang-${i}`, [x, L + 0.3 + hh * 0.6, zh + L / 2], [x, L + 0.3, len - 2], 'custom', `Penahan ban: topang ${i ? 'kanan' : 'kiri'}`, rail, { zMin: zh + L / 2 }, { yMin: L + 0.3 });
      });
      add('lingkar-atas', 'x', xs[0] - L / 2, L + 0.3 + hh + L / 2, zh, xs[1] - xs[0] + L, 'rail-x', 'Penahan ban: palang atas', t);
      // buaian berporos: telinga poros, poros, dua rel buaian, bibir belakang
      const za = len * 0.42;
      const ya = L + 0.3 + 6;
      [xc - cw / 2 - 5, xc + cw / 2 + 5].forEach((x, i) => add(`telinga-${i}`, 'y', x, L + 0.3, za, 5, 'custom', `Telinga poros ${i ? 'kanan' : 'kiri'}`, flat));
      add('poros', 'x', xc - cw / 2 - 6, ya, za, cw + 12, 'custom', 'Poros buaian', rail);
      const rz0 = za - 16;
      const rz1 = Math.min(zh - L / 2 - 1, za + 18);
      [xc - cw / 2, xc + cw / 2].forEach((x, i) => line(`buaian-${i}`, [x, ya + 2 - 3, rz0], [x, ya + 2 + 3, rz1], 'custom', `Rel buaian ${i ? 'kanan' : 'kiri'}`, rail));
      // palang belakang di antara kedua rel buaian, bibir berdiri di atas palang
      add('buaian-belakang', 'x', xc - cw / 2 + 1, ya - 1, rz0, cw - 2, 'custom', 'Buaian: palang belakang', rail);
      add('buaian-bibir', 'y', xc, ya, rz0, 8, 'custom', 'Buaian: bibir pengunci ban', thin);
      hinges.push({ id: 'engsel-buaian', memberId: 'poros', type: 'barrel-weld', mode: 'axle', pos: 0, side: 'end', foldAxis: 'x', foldSign: 1, label: 'Poros buaian (jungkit saat ban masuk)' });
      D = len;
      H = L + 0.3 + hh + L;
    } else if (m === 'stand-mesin') {
      const len = num(p, 'panjang', 70);
      W = num(p, 'lebar', 55);
      const hh = num(p, 'tinggi', 80);
      const roda = bool(p, 'roda');
      const c = roda ? casterHeight(3) : 0;
      const xc = W / 2;
      const yB = c + L / 2;
      add('tapak-lintang', 'x', 0, yB, L / 2, W, 'rail-x', 'Tapak T: palang belakang', t);
      add('tapak-tulang', 'z', xc, yB, L, len - L, 'rail-z', 'Tapak T: tulang depan', t);
      const zp = 14;
      add('tiang', 'y', xc, c + L, zp, hh - c - L - L / 2, 'post', 'Tiang tegak', t);
      lineYZ('topang', [xc, c + L, Math.min(len - 6, zp + 32)], [xc, c + L + 30, zp + L / 2], 'custom', 'Topang miring tiang', t, { yMin: c + L }, { zMin: zp + L / 2 });
      const yH = hh - L / 2;
      const armL = 26;
      add('lengan-poros', 'z', xc, yH, zp + L / 2, armL, 'custom', 'Lengan berporos (putar 360°)', t);
      const zP = zp + L / 2 + armL;
      boards.push({ ...board('plat-putar', 'Plat putar dudukan mesin', xc - 11, xc + 11, yH - 11, yH + 11, zP, zP + 0.8), steelMm: 8 });
      [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sx, sy], k) => {
        const a: [number, number, number] = [xc + sx * 6, yH + sy * 6, zP + 1.8];
        const e: [number, number, number] = [xc + sx * 22, yH + sy * 18, zP + 1.8];
        line(`lengan-mesin-${k}`, a, e, 'custom', `Lengan baut mesin ${k + 1}`, rail);
        add(`jari-${k}`, 'z', e[0], e[1], zP + 2.8, 8, 'custom', `Jari dudukan baut ${k + 1}`, thin);
      });
      add('pegangan-putar', 'y', xc, yH + L / 2, zp + L / 2 + 6, 14, 'custom', 'Pen pengunci putaran', thin);
      hinges.push({ id: 'engsel-putar', memberId: 'lengan-poros', type: 'barrel-weld', mode: 'axle', pos: 0, side: 'end', foldAxis: 'y', foldSign: 1, label: 'Poros putar dudukan mesin' });
      if (roda)
        casters = [
          { id: 'roda-kiri', x: L, z: L / 2, topY: c, sizeInch: 3, brake: true },
          { id: 'roda-kanan', x: W - L, z: L / 2, topY: c, sizeInch: 3, brake: true },
          { id: 'roda-depan', x: xc, z: len - L, topY: c, sizeInch: 3, brake: false },
        ];
      D = Math.max(len, zP + 11);
      H = hh + 18;
    } else if (m === 'stand-velg') {
      const base = num(p, 'lebar', 45);
      const ax = num(p, 'tinggi', 75);
      const hub = num(p, 'hub', 16);
      const rad = (num(p, 'velg', 17) * 2.54) / 2 + 6;
      W = Math.max(base, hub + 2 * L + 8);
      D = base;
      const xc = W / 2;
      const zc = D / 2;
      const plate = 0.6;
      boards.push({ ...board('plat-dasar', 'Plat dasar', xc - base / 2, xc + base / 2, 0, plate, 0, base), steelMm: 6 });
      const yF = Math.max(25, ax - rad);
      add('tiang', 'y', xc, plate, zc, yF - L / 2 - plate, 'post', 'Tiang tunggal', t);
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([sx, sz], k) =>
        line(`siku-${k}`, [xc + sx * (base / 2 - 4), plate + 1, zc + sz * (base / 2 - 4)], [xc + (sx * L) / 2, plate + 16, zc + (sz * L) / 2], 'custom', `Siku plat ${k + 1}`, rail)
      );
      const xs = [xc - hub / 2 - L / 2, xc + hub / 2 + L / 2];
      add('garpu-bawah', 'x', xs[0] - L / 2, yF, zc, xs[1] - xs[0] + L, 'rail-x', 'Palang garpu', t);
      xs.forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        add(`garpu-${i}`, 'y', x, yF + L / 2, zc, ax - yF - L / 2 - 1, 'post', `Kaki garpu ${nm}`, t);
        line(`takik-${i}-a`, [x, ax - 1, zc - 1], [x, ax + 4, zc - 5], 'custom', `Takik V ${nm} (belakang)`, thin);
        line(`takik-${i}-b`, [x, ax - 1, zc + 1], [x, ax + 4, zc + 5], 'custom', `Takik V ${nm} (depan)`, thin);
      });
      add('as-roda', 'x', xs[0] - 4, ax + 1, zc, xs[1] - xs[0] + 8, 'custom', 'As roda (lepas)', [12, 12]);
      add('lengan-jarum', 'z', xs[1], (yF + ax) / 2, zc + L / 2, 12, 'custom', 'Lengan jarum ukur', rail);
      add('jarum', 'y', xs[1], (yF + ax) / 2 + 1, zc + L / 2 + 11, 8, 'custom', 'Jarum ukur oleng velg', thin);
      H = ax + 5;
    } else {
      // stand-body: kaki A + palang bertingkat dua muka berpasak
      W = num(p, 'panjang', 100);
      D = num(p, 'lebar', 70);
      const hh = num(p, 'tinggi', 140);
      const nt = Math.max(2, Math.min(5, Math.round(num(p, 'tingkat', 3))));
      const zc = D / 2;
      const yA = hh - L;
      const zb = (y: number) => L / 2 + ((zc - L / 2) * y) / yA;
      const zf = (y: number) => D - zb(y);
      [L / 2, W - L / 2].forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        line(`kaki-${i}-b`, [x, L, L / 2], [x, yA, zc], 'post', `Kaki A ${nm} belakang`, t);
        line(`kaki-${i}-d`, [x, L, D - L / 2], [x, yA, zc], 'post', `Kaki A ${nm} depan`, t);
        add(`tapak-${i}`, 'z', x, L / 2, 0, D, 'rail-z', `Tapak ${nm}`, t);
      });
      add('bubungan', 'x', 0, hh - L / 2, zc, W, 'rail-x', 'Palang puncak', t);
      const yTray = 22;
      [zb(yTray), zf(yTray)].forEach((z, k) => add(`palang-nampan-${k}`, 'x', L, yTray, z, W - 2 * L, 'rail-x', `Palang nampan ${k ? 'depan' : 'belakang'}`, rail));
      if (b > 0) boards.push(board('nampan', 'Nampan baut & sekrup', L, W - L, yTray + 1, yTray + 1 + b, zb(yTray), zf(yTray)));
      const y0 = yTray + 25;
      const y1 = yA - 12;
      const np = Math.max(2, Math.round((W - 2 * L) / 25));
      for (let k = 0; k < nt; k++) {
        const y = nt === 1 ? y0 : y0 + ((y1 - y0) * k) / (nt - 1);
        [
          { nm: 'belakang', z: zb(y), s: -1 },
          { nm: 'depan', z: zf(y), s: 1 },
        ].forEach((f) => {
          add(`palang-${f.nm}-${k}`, 'x', L, y, f.z, W - 2 * L, 'rail-x', `Palang pasak ${f.nm} tingkat ${k + 1}`, rail);
          for (let j = 0; j < np; j++) {
            const x = L + 6 + ((W - 2 * L - 12) * j) / Math.max(1, np - 1);
            line(`pasak-${f.nm}-${k}-${j}`, [x, y, f.z + f.s], [x, y + 8, f.z + f.s * 20], 'custom', `Pasak ${f.nm} tingkat ${k + 1} no. ${j + 1}`, thin);
          }
        });
      }
      H = hh;
    }

    return { members: list, boards, casters, W: r1(W), D: r1(D), H: r1(H), boardThick: 0, hinges: hinges.length ? hinges : undefined, wall: wall || undefined };
  },

  checks: (p) => {
    const out: ProductCheck[] = [];
    const m = model(p);
    const jenis = str(p, 'jenis', 'sport');
    const pipa = str(p, 'pipa', '30');
    const beban = str(p, 'beban', '250');
    if (LOADED.includes(m)) {
      const need = LOAD_BY_TYPE[jenis] ?? '250';
      if ((LOAD_RANK[beban] ?? 2) < (LOAD_RANK[need] ?? 2))
        out.push({ level: 'warn', message: `Motor ${jenis} lebih berat dari beban ${beban} kg yang dipilih.`, fix: { label: `Beban ${need} kg`, params: { beban: need } } });
      if (beban === '400' && pipa !== '40')
        out.push({ level: 'warn', message: 'Untuk beban 400 kg pipa harus 40×40 supaya tidak melendut atau patah di sambungan las.', fix: { label: 'Pakai pipa 40×40', params: { pipa: '40' } } });
      else if (pipa === '20')
        out.push({ level: 'warn', message: 'Pipa 20×20 terlalu tipis untuk menahan berat motor.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
      if ((LIFT.includes(m) || m === 'ramp-cuci' || m === 'ramp-pikap') && beban !== '150' && pipa !== '40')
        out.push({ level: 'warn', message: 'Platform dan ramp yang dinaiki motor sebaiknya pipa 40×40.', fix: { label: 'Pakai pipa 40×40', params: { pipa: '40' } } });
    }
    if (PADDOCK.includes(m)) {
      const [lo, hi] = ARM_BY_TYPE[jenis] ?? [28, 38];
      const arm = num(p, 'lebarArm');
      if (arm < lo || arm > hi)
        out.push({ level: 'warn', message: `Lebar ${arm} cm kurang cocok untuk motor ${jenis} (umumnya ${lo}–${hi} cm). Ukur dulu swing arm / garpu motor Anda.`, fix: { label: `Lebar ${Math.round((lo + hi) / 2)} cm`, params: { lebarArm: Math.round((lo + hi) / 2) } } });
      if (m === 'paddock-belakang' && jenis === 'matic')
        out.push({ level: 'warn', message: 'Kebanyakan matic tidak punya swing arm terpisah, jadi paddock belakang sulit dipasang. Lebih aman pakai meja lift.', fix: { label: 'Ganti ke meja lift', params: { model: 'meja-lift', panjang: 190, lebar: 50, tinggi: 40, ramp: 110, ban: 90, beban: '150', pipa: '40' } } });
      if (m === 'paddock-belakang') out.push({ level: 'info', message: 'Pasang dudukan spool (jamur) di swing arm, atau pakai kait L berlapis karet supaya cat tidak lecet.' });
      if (m === 'paddock-depan') out.push({ level: 'info', message: 'Angkat roda belakang dulu dengan paddock belakang, baru pasang paddock depan.' });
    }
    if (RAMP.includes(m)) {
      // lift gunting: ramp dipakai saat meja turun (± rangka lantai + rangka platform + papan)
      const h = m === 'lift-gunting' ? lowDeck(p) : num(p, 'tinggi');
      const deg = slopeDeg(h, num(p, 'ramp'));
      if (deg > 25)
        out.push({ level: 'warn', message: `Ramp terlalu curam (± ${Math.round(deg)}°): motor sulit didorong naik dan bisa merosot.`, fix: { label: `Ramp ${Math.min(220, rampFor(h))} cm`, params: { ramp: Math.min(220, rampFor(h)) } } });
      else out.push({ level: 'info', message: `Kemiringan ramp ± ${Math.round(deg)}°.` });
    }
    if (m === 'ramp-pikap') {
      const h = num(p, 'tinggi');
      const deg = slopeDeg(h, num(p, 'panjang'));
      if (deg > 25)
        out.push({ level: 'warn', message: `Ramp terlalu curam (± ${Math.round(deg)}°) untuk bak setinggi ${h} cm. Motor bisa merosot saat dinaikkan.`, fix: { label: `Panjang ${Math.min(240, rampFor(h))} cm`, params: { panjang: Math.min(240, rampFor(h)) } } });
      out.push({ level: 'info', message: 'Ikat ramp ke bak dengan tali / rantai sebelum motor dinaikkan, dan selalu ada orang kedua.' });
    }
    if (LIFT.includes(m) && num(p, 'lebar') < 45)
      out.push({ level: 'warn', message: 'Platform kurang dari 45 cm: kaki penyetel dan standar samping motor bisa keluar dari papan.', fix: { label: 'Lebar 55 cm', params: { lebar: 55 } } });
    if (LIFT.includes(m) && num(p, 'panjang') < 190)
      out.push({ level: 'warn', message: 'Platform lebih pendek dari motor (± 190–210 cm), roda belakang menggantung.', fix: { label: 'Panjang 200 cm', params: { panjang: 200 } } });
    if (m === 'lift-gunting' && num(p, 'tinggi') > num(p, 'panjang') * 0.45)
      out.push({ level: 'warn', message: 'Gunting diangkat terlalu tinggi dibanding panjangnya, platform jadi goyang.', fix: { label: `Tinggi ${Math.floor(num(p, 'panjang') * 0.4)} cm`, params: { tinggi: Math.floor(num(p, 'panjang') * 0.4) } } });
    if (m === 'lift-gunting') out.push({ level: 'info', message: 'Pasang pengunci pengaman (pin) di rel geser setiap kali platform sudah naik.' });
    if (m === 'dolly' && num(p, 'lebar') < 45)
      out.push({ level: 'warn', message: 'Dolly terlalu sempit: motor yang bersandar di standar samping bisa membuat dolly terguling.', fix: { label: 'Lebar 50 cm', params: { lebar: 50 } } });
    if (m === 'ramp-cuci' && num(p, 'lebar') < 30)
      out.push({ level: 'warn', message: 'Jembatan kurang dari 30 cm: ban mudah meleset saat motor didorong.', fix: { label: 'Lebar 35 cm', params: { lebar: 35 } } });
    if (TIRE.includes(m)) out.push({ level: 'info', message: `Celah penjepit untuk ban ± ${num(p, 'ban')} mm.` });
    if (m === 'penjepit-roda' && num(p, 'tinggi') < num(p, 'ban') / 3)
      out.push({ level: 'warn', message: 'Penahan terlalu pendek untuk ban selebar ini, motor bisa terdorong melewatinya.', fix: { label: 'Tinggi 45 cm', params: { tinggi: 45 } } });
    if (m === 'stand-mesin' && num(p, 'tinggi') > num(p, 'panjang') * 1.4)
      out.push({ level: 'warn', message: 'Tapak terlalu pendek untuk dudukan setinggi ini, stand bisa terjungkal ke depan saat mesin dipasang.', fix: { label: `Tapak ${Math.min(240, Math.ceil(num(p, 'tinggi') / 1.2))} cm`, params: { panjang: Math.min(240, Math.ceil(num(p, 'tinggi') / 1.2)) } } });
    if (m === 'stand-mesin') out.push({ level: 'info', message: 'Kunci roda dan pasang pen pengunci putaran sebelum membongkar mesin.' });
    if (m === 'stand-velg') {
      const rad = (num(p, 'velg') * 2.54) / 2 + 6;
      if (num(p, 'tinggi') - rad < 25)
        out.push({ level: 'warn', message: 'As terlalu rendah: velg menyentuh tiang atau plat dasar.', fix: { label: `Tinggi as ${Math.ceil(rad + 30)} cm`, params: { tinggi: Math.min(170, Math.ceil(rad + 30)) } } });
      if (num(p, 'lebar') < 35)
        out.push({ level: 'warn', message: 'Plat dasar terlalu kecil, stand oleng saat velg diputar.', fix: { label: 'Plat 45 cm', params: { lebar: 45 } } });
    }
    if (m === 'stand-body' && num(p, 'tinggi') / num(p, 'lebar') > 2.6)
      out.push({ level: 'warn', message: 'Stand terlalu ramping, mudah roboh saat body ditaruh di satu muka saja.', fix: { label: `Lebar kaki ${Math.min(80, Math.ceil(num(p, 'tinggi') / 2.2))} cm`, params: { lebar: Math.min(80, Math.ceil(num(p, 'tinggi') / 2.2)) } } });
    if (m === 'stand-body') out.push({ level: 'info', message: 'Bungkus ujung pasak dengan selang karet supaya cat body tidak tergores.' });
    return out;
  },
};
