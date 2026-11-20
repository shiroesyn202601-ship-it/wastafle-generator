import { FrameHinge } from '../types/kitchen';
import { Board, Params, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, CASTER_OPTIONS, board, bool, casterHeight, materialParams, memberFactory, num, str } from './common';
import { angledFrame, cutAxisIndex, memberFromPoints } from '../utils/frameLayout';

type P3 = [number, number, number];

/**
 * Setengah lebar tapak ujung batang miring a→b (penampang t cm), diukur sepanjang sumbu dunia k (0 x, 1 y, 2 z).
 * Ujung batang miring dipotong rata pada bidang potongnya (lantai / sisi batang); tapak potongan itu lebih lebar
 * dari pipanya. Dipakai supaya ujung batang menempel di SISI batang lain, tidak masuk ke dalamnya.
 */
function cutHalf(a: P3, b: P3, t: number, k: number): number {
  const m = memberFromPoints({ id: 'tmp', role: 'custom', label: '' }, a, b);
  if (!m.end) return t / 2;
  const f = angledFrame(m, t, t);
  const di = cutAxisIndex(m);
  let e = 0;
  for (const s of [-1, 1])
    for (const q of [-1, 1]) {
      const off = [0, 1, 2].map((i) => (f.wd[i] * s * t) / 2 + (f.hd[i] * q * t) / 2);
      const lam = -off[di] / f.u[di];
      e = Math.max(e, Math.abs(off[k] + lam * f.u[k]));
    }
  return e;
}

/** Model kaki yang memakai 4 kaki di sudut (boleh rak bawah, palang, roda, rak atas) */
const isFour = (p: Params) => p.modelKaki === 'lurus' || p.modelKaki === 'melebar';
/** Model rangka akuarium (rangka kotak berat) */
const isBox = (p: Params) => p.modelKaki === 'kotak' || p.modelKaki === 'silang';
const noFold = (p: Params) => p.kakiLipat !== true;

/**
 * Meja besi: daun kotak / bundar. Tiap model kaki = satu struktur rangka yang berbeda:
 * lurus, melebar, silang X, pedestal (alas silang / bintang / plat), sled U, kaki A, hairpin,
 * tiang ganda T, kaki Z, trapesium terbalik, rangka C (samping sofa), konsol 2 kaki menempel tembok,
 * rangka kotak akuarium (ring lantai), rangka akuarium silang. Ditambah kaki lipat dan rak atas.
 * Rak bawah, kaki tengah, palang, roda, daun bundar = pilihan tambahan (bukan desain baru).
 */
export const MEJA: ProductDef = {
  id: 'meja',
  name: 'Meja',
  tagline: 'makan · kerja · kopi · bar · akuarium',
  icon: 'M6 12h48M10 12v24M50 12v24M10 28h40',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['bentukDaun', 'panjang', 'lebar', 'tinggi'] },
    { id: 'bentuk', title: 'Kaki', keys: ['modelKaki', 'sudutKaki', 'sudutPapan','alas', 'bentangAlas', 'pijakan', 'kakiLipat', 'rakBawah', 'tinggiRakBawah', 'palangKaki', 'kakiTengah', 'rakAtas', 'tinggiRakAtas', 'tingkatAtas', 'dalamRakAtas'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Tambahan', keys: ['roda', 'ukuranRoda', 'remRoda'] },
  ],
  params: [
    {
      key: 'bentukDaun',
      label: 'Bentuk daun meja',
      type: 'choice',
      options: [
        { value: 'kotak', label: 'Kotak / persegi panjang' },
        { value: 'bulat', label: 'Bundar', desc: 'Panjang = diameter' },
      ],
    },
    { key: 'panjang', label: 'Panjang / diameter', type: 'number', unit: 'cm', min: 40, max: 240, step: 1, help: 'Sisi paling panjang daun meja (atau diameter untuk meja bundar).', marks: [{ value: 80, label: 'kopi' }, { value: 120, label: 'makan 4 org' }, { value: 180, label: 'makan 6 org' }] },
    { key: 'lebar', label: 'Lebar', type: 'number', unit: 'cm', min: 30, max: 120, step: 1, help: 'Jarak depan ke belakang.', marks: [{ value: 50, label: 'kopi' }, { value: 75, label: 'makan' }, { value: 90, label: 'makan 6 org' }], showIf: (p) => p.bentukDaun !== 'bulat' },
    { key: 'tinggi', label: 'Tinggi', type: 'number', unit: 'cm', min: 30, max: 110, step: 1, help: 'Dari lantai sampai permukaan meja.', marks: [{ value: 45, label: 'kopi' }, { value: 75, label: 'makan' }, { value: 85, label: 'kerja' }, { value: 105, label: 'bar' }] },
    {
      key: 'modelKaki',
      label: 'Model kaki',
      type: 'choice',
      options: [
        { value: 'lurus', label: 'Lurus', desc: 'Tegak, paling mudah dibuat' },
        { value: 'melebar', label: 'Melebar', desc: 'Miring keluar, lebih stabil' },
        { value: 'x', label: 'Silang X', desc: 'Kaki menyilang di kedua ujung' },
        { value: 'pedestal', label: 'Kaki tunggal (pedestal)', desc: 'Satu tiang di tengah, khas cafe' },
        { value: 'tiang-ganda', label: 'Tiang ganda (T)', desc: 'Dua tiang tengah ber-tapak T, untuk meja panjang' },
        { value: 'u', label: 'Kaki U / sled', desc: 'Rangka U di kedua ujung, menapak rata' },
        { value: 'trestle', label: 'Kaki A (trestle)', desc: 'Dua kaki miring bentuk A di tiap ujung' },
        { value: 'trapesium', label: 'Trapesium terbalik', desc: 'Rangka tertutup, lebar di atas, sempit di lantai' },
        { value: 'z', label: 'Kaki Z', desc: 'Tapak lantai + kaki miring + rangka atas, bentuk Z' },
        { value: 'hairpin', label: 'Kaki V (hairpin)', desc: 'Kaki ramping bentuk V di tiap sudut' },
        { value: 'c', label: 'Rangka C (samping sofa)', desc: 'Tiang hanya di belakang, tapak masuk ke bawah sofa' },
        { value: 'diagonal', label: 'Rangka melayang (2 tiang diagonal)', desc: 'Rangka atas & lantai membingkai papan, 2 tiang di sudut berseberangan' },
        { value: 'konsol', label: 'Konsol 2 kaki (menempel tembok)', desc: 'Kaki hanya di depan, belakang dibaut ke tembok' },
        { value: 'kotak', label: 'Rangka kotak akuarium', desc: 'Ring atas + ring lantai, tiang tambahan di tengah' },
        { value: 'silang', label: 'Rangka akuarium bersilang', desc: 'Panel samping & belakang diberi silang X' },
        { value: 'tiga', label: 'Kaki 3', desc: '3 kaki tegak di sudut segitiga, lengan Y di bawah daun' },
        { value: 'y', label: 'Kaki Y (tiang bercabang)', desc: 'Tiang pendek di tiap ujung bercabang dua ke depan & belakang' },
        { value: 'gambar', label: 'Meja gambar (papan miring)', desc: 'Kaki A, papan miring ke depan dengan bibir penahan' },
      ],
      showIf: noFold,
    },
    { key: 'sudutPapan', label: 'Kemiringan papan', type: 'number', unit: '°', min: 5, max: 30, step: 1, help: 'Papan turun ke arah orang yang duduk. 10° untuk menulis, 15° – 20° untuk menggambar.', showIf: (p) => p.modelKaki === 'gambar' && noFold(p) },
    {
      key: 'alas',
      label: 'Alas kaki tunggal',
      type: 'choice',
      options: [
        { value: 'silang', label: 'Silang +', desc: 'Dua pipa menyilang di lantai' },
        { value: 'bintang', label: 'Bintang miring', desc: '4 kaki miring dari tiang' },
        { value: 'plat', label: 'Plat bundar', desc: 'Plat besi 8 mm, rapi & berat' },
      ],
      showIf: (p) => p.modelKaki === 'pedestal' && noFold(p),
    },
    { key: 'bentangAlas', label: 'Lebar alas', type: 'number', unit: 'cm', min: 35, max: 90, step: 1, help: 'Minimal setengah lebar daun meja supaya tidak mudah terguling.', showIf: (p) => p.modelKaki === 'pedestal' && noFold(p) },
    { key: 'rakAtas', label: 'Rak di atas meja', type: 'toggle', help: 'Tiang belakang diteruskan ke atas dengan papan rak (meja kerja / belajar).', showIf: (p) => isFour(p) && noFold(p) && p.bentukDaun !== 'bulat' },
    { key: 'tinggiRakAtas', label: 'Tinggi rak atas dari daun meja', type: 'number', unit: 'cm', min: 25, max: 90, step: 1, showIf: (p) => p.rakAtas === true && isFour(p) && noFold(p) },
    { key: 'tingkatAtas', label: 'Jumlah papan rak atas', type: 'number', unit: 'papan', min: 1, max: 3, step: 1, showIf: (p) => p.rakAtas === true && isFour(p) && noFold(p) },
    { key: 'dalamRakAtas', label: 'Kedalaman rak atas', type: 'number', unit: 'cm', min: 15, max: 40, step: 1, showIf: (p) => p.rakAtas === true && isFour(p) && noFold(p) },
    { key: 'pijakan', label: 'Pijakan kaki', type: 'toggle', help: 'Pijakan kaki untuk meja bar tinggi (±30 cm dari lantai).', showIf: (p) => (p.modelKaki === 'pedestal' || p.modelKaki === 'u' || p.modelKaki === 'tiang-ganda') && noFold(p) },
    { key: 'sudutKaki', label: 'Sudut kaki melebar', type: 'number', unit: '°', min: 3, max: 15, step: 1, help: 'Kemiringan tiap kaki dari tegak lurus.', showIf: (p) => p.modelKaki === 'melebar' && noFold(p) },
    { key: 'kakiLipat', label: 'Kaki bisa dilipat', type: 'toggle', help: 'Kaki dipasang engsel kunci; klik engselnya di 3D untuk melipat.', showIf: (p) => p.bentukDaun !== 'bulat' },
    { key: 'rakBawah', label: 'Rak bawah', type: 'toggle', help: 'Papan tambahan di bawah untuk menaruh barang (akuarium: tempat filter).', showIf: (p) => noFold(p) && (isFour(p) || isBox(p)) },
    { key: 'tinggiRakBawah', label: 'Tinggi rak bawah', type: 'number', unit: 'cm', min: 8, max: 60, step: 1, showIf: (p) => p.rakBawah === true && noFold(p) && isFour(p) },
    { key: 'palangKaki', label: 'Palang penguat kaki', type: 'toggle', help: 'Pipa penghubung kaki di bawah supaya tidak goyang.', showIf: (p) => p.rakBawah !== true && isFour(p) && noFold(p) },
    { key: 'kakiTengah', label: 'Kaki tengah', type: 'toggle', help: 'Untuk meja panjang supaya tidak melendut.', showIf: (p) => p.modelKaki === 'lurus' && p.bentukDaun !== 'bulat' && noFold(p) },
    ...materialParams(true),
    { key: 'roda', label: 'Pakai roda', type: 'toggle', help: 'Meja bisa didorong. Tinggi meja tetap sama.', showIf: (p) => noFold(p) && isFour(p) },
    { key: 'ukuranRoda', label: 'Ukuran roda', type: 'choice', options: CASTER_OPTIONS, showIf: (p) => p.roda === true && noFold(p) && isFour(p) },
    { key: 'remRoda', label: 'Roda dengan rem', type: 'toggle', showIf: (p) => p.roda === true && noFold(p) && isFour(p) },
  ],
  defaults: {
    bentukDaun: 'kotak', panjang: 120, lebar: 75, tinggi: 75, modelKaki: 'lurus', sudutKaki: 8, sudutPapan: 15, kakiLipat: false,
    rakBawah: false, tinggiRakBawah: 20, palangKaki: true, kakiTengah: false, alas: 'silang', bentangAlas: 56, pijakan: false, rakAtas: false, tinggiRakAtas: 50, tingkatAtas: 2, dalamRakAtas: 25,
    pipa: '40', papan: 'kayu', warna: '#1f2226', roda: false, ukuranRoda: '3', remRoda: true,
  },
  groups: [
    { id: 'makan', name: 'Meja makan', desc: '2 – 10 orang, rumah & komunal' },
    { id: 'kerja', name: 'Meja kerja / belajar', desc: 'rak atas · kaki Z · trapesium · papan gambar miring' },
    { id: 'kopi', name: 'Meja kopi, samping & konsol', desc: 'depan sofa · samping sofa · lorong / TV' },
    { id: 'cafe', name: 'Meja cafe & bar', desc: 'kaki tunggal · kaki 3 · komunal · bar tinggi' },
    { id: 'akuarium', name: 'Meja akuarium', desc: 'tangki 60 – 150 cm, rangka beban berat' },
  ],
  signature: (p) => {
    const round = p.bentukDaun === 'bulat' && p.modelKaki !== 'gambar';
    if (p.kakiLipat === true && !round) return 'lipat';
    let m = str(p, 'modelKaki', 'lurus');
    if (m === 'silang') return 'kotak'; // akuarium bersilang = rangka kotak akuarium yang sama, hanya penguatnya X (masuk sizes)
    if (m === 'x' && round) m = 'lurus';
    if (m === 'pedestal') return `pedestal-${str(p, 'alas', 'silang')}`;
    if (m === 'melebar') m = 'lurus'; // kaki melebar = rangka 4 kaki yang sama, hanya miring
    if (m === 'lurus' && p.rakAtas === true && !round) return 'lurus+rak-atas';
    return m;
  },
  presets: [
    // ---------- Meja makan ----------
    {
      id: 'lurus',
      group: 'makan',
      name: 'Meja kaki 4 (lurus / melebar)',
      desc: '4 kaki tegak / melebar + palang H; bisa 6 kaki, rak bawah, roda',
      params: { modelKaki: 'lurus', palangKaki: true },
      sizes: [
        { label: 'Makan 4 orang', desc: '120 × 75 × 75 cm', params: { panjang: 120, lebar: 75, tinggi: 75, pipa: '40' } },
        { label: 'Makan 6 orang + kaki tengah', desc: '180 × 90 × 75 cm, 6 kaki', params: { panjang: 180, lebar: 90, tinggi: 75, pipa: '40', kakiTengah: true } },
        { label: 'Komunal 240 + kaki tengah', desc: '240 × 90 × 75 cm, 6 kaki', params: { panjang: 240, lebar: 90, tinggi: 75, pipa: '40', kakiTengah: true } },
        { label: 'Meja bundar', desc: 'ø100 × 75 cm', params: { bentukDaun: 'bulat', panjang: 100, tinggi: 75, pipa: '30' } },
        { label: 'Kaki melebar 8°', desc: '120 × 70 × 75 cm, kaki miring keluar', params: { modelKaki: 'melebar', sudutKaki: 8, panjang: 120, lebar: 70, tinggi: 75, pipa: '30' } },
        { label: 'Cafe kaki melebar', desc: '80 × 80 × 75 cm, kaki miring 8°', params: { modelKaki: 'melebar', sudutKaki: 8, panjang: 80, lebar: 80, tinggi: 75, pipa: '30' } },
        { label: 'Bar bundar kaki melebar', desc: 'ø60 × 105 cm, kaki miring 7°', params: { modelKaki: 'melebar', sudutKaki: 7, bentukDaun: 'bulat', panjang: 60, tinggi: 105, pipa: '30' } },
        { label: 'Bar tinggi', desc: '120 × 50 × 105 cm', params: { panjang: 120, lebar: 50, tinggi: 105, pipa: '40' } },
        { label: 'Meja kerja berat + rak bawah', desc: '150 × 70 × 85 cm, 6 kaki', params: { panjang: 150, lebar: 70, tinggi: 85, pipa: '40', rakBawah: true, tinggiRakBawah: 20, kakiTengah: true } },
        { label: 'Meja dapur / prep beroda', desc: '120 × 60 × 85 cm, rak bawah + roda', params: { panjang: 120, lebar: 60, tinggi: 85, pipa: '40', rakBawah: true, tinggiRakBawah: 20, roda: true, ukuranRoda: '4' } },
        { label: 'Meja kopi + rak bawah', desc: '90 × 50 × 45 cm', params: { panjang: 90, lebar: 50, tinggi: 45, pipa: '30', rakBawah: true, tinggiRakBawah: 12 } },
        { label: 'Meja TV + rak bawah', desc: '120 × 40 × 55 cm', params: { panjang: 120, lebar: 40, tinggi: 55, pipa: '30', rakBawah: true, tinggiRakBawah: 12 } },
      ],
    },
    {
      id: 'trestle',
      group: 'makan',
      name: 'Meja kaki A (trestle)',
      desc: 'dua kaki miring bertemu di atas, bentuk A di tiap ujung',
      params: { modelKaki: 'trestle' },
      sizes: [
        { label: 'Makan 6 orang', desc: '180 × 85 × 75 cm', params: { panjang: 180, lebar: 85, tinggi: 75, pipa: '40' } },
        { label: 'Komunal cafe', desc: '240 × 90 × 75 cm', params: { panjang: 240, lebar: 90, tinggi: 75, pipa: '40' } },
        { label: 'Kerja', desc: '140 × 70 × 75 cm', params: { panjang: 140, lebar: 70, tinggi: 75, pipa: '40' } },
      ],
    },
    {
      id: 'tiang-ganda',
      group: 'makan',
      name: 'Meja tiang ganda (kaki T)',
      desc: 'dua tiang di tengah, tapak T di lantai + lengan T di atas',
      params: { modelKaki: 'tiang-ganda', panjang: 180, lebar: 90 },
      sizes: [
        { label: 'Makan 6 orang', desc: '180 × 90 × 75 cm', params: { panjang: 180, lebar: 90, tinggi: 75, pipa: '40', pijakan: false } },
        { label: 'Makan 8 orang / rapat', desc: '220 × 100 × 75 cm', params: { panjang: 220, lebar: 100, tinggi: 75, pipa: '40', pijakan: false } },
        { label: 'Meja kerja / rapat kecil', desc: '150 × 75 × 75 cm', params: { panjang: 150, lebar: 75, tinggi: 75, pipa: '40', pijakan: false } },
        { label: 'Bar panjang + pijakan', desc: '200 × 60 × 105 cm', params: { panjang: 200, lebar: 60, tinggi: 105, pipa: '40', pijakan: true } },
      ],
    },
    {
      id: 'lipat',
      group: 'makan',
      name: 'Meja lipat',
      desc: 'kaki dilipat ke bawah daun (engsel kunci)',
      params: { kakiLipat: true },
      sizes: [
        { label: 'Serbaguna', desc: '120 × 60 × 75 cm', params: { panjang: 120, lebar: 60, tinggi: 75, pipa: '30' } },
        { label: 'Bazar / event', desc: '180 × 75 × 75 cm', params: { panjang: 180, lebar: 75, tinggi: 75, pipa: '30' } },
        { label: 'Lesehan', desc: '80 × 50 × 35 cm', params: { panjang: 80, lebar: 50, tinggi: 35, pipa: '20' } },
      ],
    },

    // ---------- Meja kerja / belajar ----------
    {
      id: 'rak-atas',
      group: 'kerja',
      name: 'Meja + rak atas',
      desc: 'tiang belakang naik, 1–3 papan rak di atas meja',
      params: { modelKaki: 'lurus', rakAtas: true, palangKaki: true },
      sizes: [
        { label: 'Meja belajar', desc: '100 × 55 × 75, rak 2 papan', params: { panjang: 100, lebar: 55, tinggi: 75, tinggiRakAtas: 50, tingkatAtas: 2, dalamRakAtas: 22, pipa: '30' } },
        { label: 'Meja kerja / workshop', desc: '140 × 65 × 85, rak 1 papan', params: { panjang: 140, lebar: 65, tinggi: 85, tinggiRakAtas: 45, tingkatAtas: 1, dalamRakAtas: 30, pipa: '40' } },
        { label: 'Meja kasir + rak', desc: '120 × 55 × 90, rak 2 papan', params: { panjang: 120, lebar: 55, tinggi: 90, tinggiRakAtas: 60, tingkatAtas: 2, dalamRakAtas: 25, pipa: '30' } },
        { label: 'Meja bengkel + rak bawah', desc: '150 × 70 × 85, rak atas & bawah', params: { panjang: 150, lebar: 70, tinggi: 85, tinggiRakAtas: 50, tingkatAtas: 1, dalamRakAtas: 30, pipa: '40', rakBawah: true, tinggiRakBawah: 20, kakiTengah: true } },
      ],
    },
    {
      id: 'kaki-z',
      group: 'kerja',
      name: 'Meja kaki Z',
      desc: 'tiap ujung: tapak lantai, kaki miring, rangka atas — bentuk Z',
      params: { modelKaki: 'z' },
      sizes: [
        { label: 'Meja kerja', desc: '120 × 60 × 75 cm', params: { panjang: 120, lebar: 60, tinggi: 75, pipa: '40' } },
        { label: 'Meja belajar', desc: '100 × 55 × 75 cm', params: { panjang: 100, lebar: 55, tinggi: 75, pipa: '40' } },
        { label: 'Meja makan', desc: '160 × 80 × 75 cm', params: { panjang: 160, lebar: 80, tinggi: 75, pipa: '40' } },
        { label: 'Meja kopi', desc: '100 × 55 × 45 cm', params: { panjang: 100, lebar: 55, tinggi: 45, pipa: '40' } },
      ],
    },
    {
      id: 'trapesium',
      group: 'kerja',
      name: 'Meja kaki trapesium terbalik',
      desc: 'rangka tertutup di tiap ujung, lebar di atas, sempit di lantai',
      params: { modelKaki: 'trapesium' },
      sizes: [
        { label: 'Meja kerja', desc: '140 × 70 × 75 cm', params: { panjang: 140, lebar: 70, tinggi: 75, pipa: '40' } },
        { label: 'Meja belajar', desc: '110 × 60 × 75 cm', params: { panjang: 110, lebar: 60, tinggi: 75, pipa: '30' } },
        { label: 'Meja makan', desc: '180 × 85 × 75 cm', params: { panjang: 180, lebar: 85, tinggi: 75, pipa: '40' } },
        { label: 'Meja kopi', desc: '110 × 60 × 45 cm', params: { panjang: 110, lebar: 60, tinggi: 45, pipa: '30' } },
      ],
    },

    // ---------- Meja kopi, samping & konsol ----------
    {
      id: 'kaki-x',
      group: 'kopi',
      name: 'Meja kaki silang X',
      desc: 'kaki menyilang X di kedua ujung',
      params: { modelKaki: 'x' },
      sizes: [
        { label: 'Meja kopi', desc: '100 × 60 × 45 cm', params: { panjang: 100, lebar: 60, tinggi: 45, pipa: '40' } },
        { label: 'Meja makan 6 orang', desc: '160 × 80 × 75 cm', params: { panjang: 160, lebar: 80, tinggi: 75, pipa: '40' } },
        { label: 'Meja kerja', desc: '120 × 60 × 75 cm', params: { panjang: 120, lebar: 60, tinggi: 75, pipa: '40' } },
      ],
    },
    {
      id: 'hairpin',
      group: 'kopi',
      name: 'Meja kaki V (hairpin)',
      desc: 'kaki ramping V di tiap sudut, gaya retro',
      params: { modelKaki: 'hairpin' },
      sizes: [
        { label: 'Meja kopi', desc: '100 × 55 × 45 cm', params: { panjang: 100, lebar: 55, tinggi: 45, pipa: '30' } },
        { label: 'Meja kerja', desc: '120 × 60 × 75 cm', params: { panjang: 120, lebar: 60, tinggi: 75, pipa: '30' } },
        { label: 'Meja makan', desc: '150 × 80 × 75 cm', params: { panjang: 150, lebar: 80, tinggi: 75, pipa: '30' } },
      ],
    },
    {
      id: 'samping-c',
      group: 'kopi',
      name: 'Meja samping rangka C',
      desc: 'tiang hanya di belakang, tapak bawah masuk ke kolong sofa',
      params: { modelKaki: 'c', panjang: 50, lebar: 35, tinggi: 60, pipa: '20' },
      sizes: [
        { label: 'Samping sofa', desc: '50 × 35 × 60 cm', params: { panjang: 50, lebar: 35, tinggi: 60, pipa: '20' } },
        { label: 'Meja laptop sofa', desc: '60 × 40 × 65 cm', params: { panjang: 60, lebar: 40, tinggi: 65, pipa: '20' } },
        { label: 'Samping ranjang', desc: '45 × 35 × 55 cm', params: { panjang: 45, lebar: 35, tinggi: 55, pipa: '20' } },
      ],
    },
    {
      id: 'kopi-melayang',
      group: 'kopi',
      name: 'Meja kopi rangka melayang (2 tiang diagonal)',
      desc: 'rangka atas & rangka lantai membingkai papan, disambung hanya 2 tiang di sudut kiri-depan dan kanan-belakang',
      params: { modelKaki: 'diagonal', bentukDaun: 'kotak', panjang: 80, lebar: 60, tinggi: 45, pipa: '40' },
      sizes: [
        { label: 'Meja kopi', desc: '80 × 60 × 45 cm', params: { panjang: 80, lebar: 60, tinggi: 45, pipa: '40' } },
        { label: 'Meja kopi panjang', desc: '110 × 60 × 40 cm', params: { panjang: 110, lebar: 60, tinggi: 40, pipa: '40' } },
        { label: 'Meja samping kotak', desc: '50 × 50 × 50 cm', params: { panjang: 50, lebar: 50, tinggi: 50, pipa: '40' } },
      ],
    },
    {
      id: 'konsol',
      group: 'kopi',
      name: 'Meja konsol 2 kaki (menempel tembok)',
      desc: 'kaki hanya di depan, rangka belakang dibaut ke tembok',
      params: { modelKaki: 'konsol', panjang: 120, lebar: 35, tinggi: 80, pipa: '30' },
      sizes: [
        { label: 'Konsol lorong', desc: '120 × 35 × 80 cm', params: { panjang: 120, lebar: 35, tinggi: 80, pipa: '30' } },
        { label: 'Meja TV', desc: '150 × 40 × 55 cm', params: { panjang: 150, lebar: 40, tinggi: 55, pipa: '30' } },
        { label: 'Meja kerja / rias dinding', desc: '100 × 45 × 75 cm', params: { panjang: 100, lebar: 45, tinggi: 75, pipa: '30' } },
      ],
    },

    // ---------- Meja cafe & bar ----------
    {
      id: 'pedestal-silang',
      group: 'cafe',
      name: 'Meja kaki tunggal, alas silang',
      desc: 'satu tiang tengah, alas + di lantai',
      params: { modelKaki: 'pedestal', alas: 'silang', panjang: 60, lebar: 60, bentangAlas: 50 },
      sizes: [
        { label: 'Cafe 2 orang', desc: '60 × 60 × 75 cm', params: { panjang: 60, lebar: 60, tinggi: 75, bentangAlas: 50, pipa: '40', pijakan: false } },
        { label: 'Cafe 4 orang', desc: '80 × 80 × 75 cm', params: { panjang: 80, lebar: 80, tinggi: 75, bentangAlas: 66, pipa: '40', pijakan: false } },
        { label: 'Bundar cafe', desc: 'ø70 × 75 cm', params: { bentukDaun: 'bulat', panjang: 70, tinggi: 75, bentangAlas: 56, pipa: '40', pijakan: false } },
        { label: 'Bar tinggi + pijakan', desc: '70 × 70 × 105 cm', params: { panjang: 70, lebar: 70, tinggi: 105, bentangAlas: 60, pipa: '40', pijakan: true } },
      ],
    },
    {
      id: 'pedestal-bintang',
      group: 'cafe',
      name: 'Meja kaki tunggal, alas bintang',
      desc: 'tiang tengah + 4 kaki miring ke lantai',
      params: { modelKaki: 'pedestal', alas: 'bintang', panjang: 80, lebar: 80, bentangAlas: 70 },
      sizes: [
        { label: 'Cafe 4 orang', desc: '80 × 80 × 75 cm', params: { panjang: 80, lebar: 80, tinggi: 75, bentangAlas: 70, pipa: '40', pijakan: false } },
        { label: 'Bundar cafe', desc: 'ø80 × 75 cm', params: { bentukDaun: 'bulat', panjang: 80, tinggi: 75, bentangAlas: 66, pipa: '40', pijakan: false } },
        { label: 'Bar tinggi + pijakan', desc: '70 × 70 × 105 cm', params: { panjang: 70, lebar: 70, tinggi: 105, bentangAlas: 66, pipa: '40', pijakan: true } },
      ],
    },
    {
      id: 'bundar',
      group: 'cafe',
      name: 'Meja bundar kaki tunggal, alas plat',
      desc: 'tiang tengah berdiri di plat besi bundar',
      params: { bentukDaun: 'bulat', modelKaki: 'pedestal', alas: 'plat', panjang: 60, bentangAlas: 45 },
      sizes: [
        { label: 'Cafe 2 orang', desc: 'ø60 × 75 cm, plat ø45', params: { panjang: 60, tinggi: 75, bentangAlas: 45, pipa: '40', pijakan: false } },
        { label: 'Cafe 4 orang', desc: 'ø80 × 75 cm, plat ø50', params: { panjang: 80, tinggi: 75, bentangAlas: 50, pipa: '40', pijakan: false } },
        { label: 'Daun kotak', desc: '60 × 60 × 75 cm, plat ø45', params: { bentukDaun: 'kotak', panjang: 60, lebar: 60, tinggi: 75, bentangAlas: 45, pipa: '40', pijakan: false } },
        { label: 'Bar tinggi + pijakan', desc: 'ø60 × 105 cm, plat ø50', params: { panjang: 60, tinggi: 105, bentangAlas: 50, pipa: '40', pijakan: true } },
      ],
    },
    {
      id: 'sled',
      group: 'cafe',
      name: 'Meja kaki U (sled)',
      desc: 'rangka U tertutup di kedua ujung, menapak rata',
      params: { modelKaki: 'u', panjang: 240, lebar: 90 },
      sizes: [
        { label: 'Komunal cafe', desc: '240 × 90 × 75 cm', params: { panjang: 240, lebar: 90, tinggi: 75, pipa: '40', pijakan: false } },
        { label: 'Makan / kerja', desc: '140 × 75 × 75 cm', params: { panjang: 140, lebar: 75, tinggi: 75, pipa: '40', pijakan: false } },
        { label: 'Bar tinggi + pijakan', desc: '160 × 60 × 105 cm', params: { panjang: 160, lebar: 60, tinggi: 105, pipa: '40', pijakan: true } },
      ],
    },

    // ---------- Meja akuarium ----------
    {
      id: 'akuarium-kotak',
      group: 'akuarium',
      name: 'Meja akuarium rangka kotak',
      desc: 'tiang di sudut dan tengah bentang, ring atas + ring bawah (opsi silang X di samping & belakang)',
      params: { modelKaki: 'kotak', pipa: '40', papan: 'multiplek', panjang: 80, lebar: 40 },
      sizes: [
        { label: 'Akuarium 80 cm', desc: '80 × 40 × 75 cm', params: { modelKaki: 'kotak', panjang: 80, lebar: 40, tinggi: 75, rakBawah: false } },
        { label: 'Akuarium 60 cm', desc: '60 × 35 × 75 cm', params: { modelKaki: 'kotak', panjang: 60, lebar: 35, tinggi: 75, rakBawah: false } },
        { label: 'Akuarium 100 cm + rak filter', desc: '100 × 45 × 75 cm, papan bawah', params: { modelKaki: 'kotak', panjang: 100, lebar: 45, tinggi: 75, rakBawah: true } },
        { label: 'Akuarium 120 cm + rak filter', desc: '120 × 50 × 75 cm, 6 tiang', params: { modelKaki: 'kotak', panjang: 120, lebar: 50, tinggi: 75, rakBawah: true } },
        { label: 'Akuarium 150 cm + rak filter', desc: '150 × 55 × 75 cm, 8 tiang', params: { modelKaki: 'kotak', panjang: 150, lebar: 55, tinggi: 75, rakBawah: true } },
        { label: 'Bersilang X 100 cm', desc: '100 × 45 × 75 cm, silang di samping & belakang', params: { modelKaki: 'silang', panjang: 100, lebar: 45, tinggi: 75, rakBawah: false } },
        { label: 'Bersilang X 150 cm + rak filter', desc: '150 × 55 × 75 cm, 6 kaki', params: { modelKaki: 'silang', panjang: 150, lebar: 55, tinggi: 75, rakBawah: true } },
      ],
    },

    // ---------- Template tambahan (struktur rangka baru) ----------
    {
      id: 'kaki-y',
      group: 'makan',
      name: 'Meja kaki Y (tiang bercabang)',
      desc: 'tiap ujung satu tiang pendek di tapak lantai, di atasnya bercabang dua batang miring ke depan dan ke belakang daun',
      params: { modelKaki: 'y', bentukDaun: 'kotak', panjang: 180, lebar: 90, tinggi: 75, pipa: '40' },
      sizes: [
        { label: 'Makan 6 orang', desc: '180 × 90 × 75 cm', params: { panjang: 180, lebar: 90, tinggi: 75, pipa: '40' } },
        { label: 'Makan 4 orang', desc: '140 × 80 × 75 cm', params: { panjang: 140, lebar: 80, tinggi: 75, pipa: '40' } },
        { label: 'Rapat 8 orang', desc: '220 × 100 × 75 cm', params: { panjang: 220, lebar: 100, tinggi: 75, pipa: '40' } },
        { label: 'Bar panjang', desc: '200 × 60 × 105 cm', params: { panjang: 200, lebar: 60, tinggi: 105, pipa: '40' } },
      ],
    },
    {
      id: 'meja-gambar',
      group: 'kerja',
      name: 'Meja gambar (papan miring)',
      desc: 'kaki A di tiap ujung, papan miring turun ke depan di atas rel miring dan tiang penyangga belakang, bibir penahan di tepi bawah',
      params: { modelKaki: 'gambar', bentukDaun: 'kotak', sudutPapan: 15, panjang: 100, lebar: 70, tinggi: 80, pipa: '30' },
      sizes: [
        { label: 'Meja gambar A1', desc: '100 × 70 cm, tepi depan 80 cm, miring 15°', params: { panjang: 100, lebar: 70, tinggi: 80, sudutPapan: 15, pipa: '30' } },
        { label: 'Meja gambar A0', desc: '130 × 90 cm, tepi depan 80 cm, miring 15°', params: { panjang: 130, lebar: 90, tinggi: 80, sudutPapan: 15, pipa: '40' } },
        { label: 'Meja tulis / baca', desc: '80 × 55 cm, tepi depan 72 cm, miring 10°', params: { panjang: 80, lebar: 55, tinggi: 72, sudutPapan: 10, pipa: '30' } },
        { label: 'Meja lukis anak', desc: '70 × 50 cm, tepi depan 55 cm, miring 20°', params: { panjang: 70, lebar: 50, tinggi: 55, sudutPapan: 20, pipa: '30' } },
      ],
    },
    {
      id: 'tiga-kaki',
      group: 'cafe',
      name: 'Meja bundar kaki 3',
      desc: 'tiga kaki tegak di sudut segitiga, disatukan lengan Y di bawah daun dan lengan Y dekat lantai',
      params: { modelKaki: 'tiga', bentukDaun: 'bulat', panjang: 70, tinggi: 75, pipa: '30' },
      sizes: [
        { label: 'Cafe 2 orang', desc: 'ø60 × 75 cm', params: { bentukDaun: 'bulat', panjang: 60, tinggi: 75, pipa: '30' } },
        { label: 'Cafe 3 – 4 orang', desc: 'ø80 × 75 cm', params: { bentukDaun: 'bulat', panjang: 80, tinggi: 75, pipa: '40' } },
        { label: 'Meja kopi bundar', desc: 'ø70 × 45 cm', params: { bentukDaun: 'bulat', panjang: 70, tinggi: 45, pipa: '30' } },
        { label: 'Bar tinggi', desc: 'ø60 × 105 cm', params: { bentukDaun: 'bulat', panjang: 60, tinggi: 105, pipa: '40' } },
      ],
    },
  ],
  summary: (p) =>
    str(p, 'modelKaki') === 'gambar' && !bool(p, 'kakiLipat')
      ? `${num(p, 'panjang')} × ${num(p, 'lebar')} cm · tepi depan ${num(p, 'tinggi')} cm · miring ${num(p, 'sudutPapan', 15)}°`
      : str(p, 'bentukDaun') === 'bulat'
      ? `Bundar ø${num(p, 'panjang')} × tinggi ${num(p, 'tinggi')} cm`
      : `${num(p, 'panjang')} × ${num(p, 'lebar')} × ${num(p, 'tinggi')} cm${bool(p, 'kakiLipat') ? ' · kaki lipat' : ''}`,

  build: (p) => {
    const round = str(p, 'bentukDaun') === 'bulat' && str(p, 'modelKaki') !== 'gambar';
    const W = num(p, 'panjang', 120);
    const D = round ? W : num(p, 'lebar', 75);
    const H = num(p, 'tinggi', 75);
    const L = (parseInt(str(p, 'pipa', '40')) || 40) / 10; // tebal kaki (cm)
    const b = BOARD_THICK[str(p, 'papan', 'multiplek')] ?? 1.8;
    const lipat = !round && bool(p, 'kakiLipat');
    const model = lipat ? 'lurus' : round && str(p, 'modelKaki') === 'x' ? 'lurus' : str(p, 'modelKaki', 'lurus');
    const fourLegs = model === 'lurus' || model === 'melebar';
    const roda = !lipat && fourLegs && bool(p, 'roda');
    const inch = parseInt(str(p, 'ukuranRoda', '3')) || 3;
    const c = roda ? casterHeight(inch) : 0;
    const yTop = H - b; // bidang bawah daun meja
    const apron: [number, number] = L >= 3 ? [20, 40] : [20, 20];
    const ah = apron[1] / 10;
    const ya = yTop - ah / 2; // as rangka atas
    const rail: [number, number] = [20, 20];
    const leg: [number, number] = [L * 10, L * 10];
    const aw = apron[0] / 20; // setengah lebar (mendatar) pipa rangka atas
    const rw = rail[0] / 20; // setengah lebar pipa palang
    const { list, add, line } = memberFactory();
    const boards: Board[] = [];
    const hinges: FrameHinge[] = [];

    // Bidang rangka atas: kotak (daun lebih 2 cm) atau persegi di dalam lingkaran (meja bundar)
    // kaki melebar: rangka atas digeser ke dalam supaya ujung kaki tetap di bawah tepi daun meja
    const spreadPre = model === 'melebar' ? Math.tan((num(p, 'sudutKaki', 8) * Math.PI) / 180) * (yTop - c) : 0;
    const o = 2 + spreadPre;
    // meja bundar: rangka persegi di tengah; ujung kaki (diagonal) harus tetap di dalam lingkaran daun
    const hf = Math.max(W * 0.12, Math.min(W * 0.3, W / (2 * Math.SQRT2) - spreadPre - 1));
    const fx0 = round ? W / 2 - hf : o;
    const fx1 = round ? W / 2 + hf : W - o;
    const fz0 = round ? D / 2 - hf : o;
    const fz1 = round ? D / 2 + hf : D - o;

    if (model === 'pedestal') {
      // Satu tiang di tengah, laba-laba atas (silang 20×40) dan alas silang / bintang / plat
      const cx = W / 2;
      const cz = D / 2;
      const col = Math.max(5, L + 1); // tiang 50×50 / 60×60
      const colT: [number, number] = [col * 10, col * 10];
      const span = Math.min(num(p, 'bentangAlas', 56), Math.min(W, D) - 2);
      const arm = Math.min(W, D) * 0.7;
      const alas = str(p, 'alas', 'silang');
      // laba-laba silang: kiri–kanan menerus, depan–belakang dipotong dua dan dilas di kedua sisinya
      add('laba-x', 'x', cx - arm / 2, ya, cz, arm, 'rail-x', 'Laba-laba atas kiri–kanan', apron);
      add('laba-z', 'z', cx, ya, cz - arm / 2, arm / 2 - aw, 'rail-z', 'Laba-laba atas depan–belakang', apron);
      add('laba-z2', 'z', cx, ya, cz + aw, arm / 2 - aw, 'rail-z', 'Laba-laba atas depan–belakang (2)', apron);
      let colBottom = 0;
      if (alas === 'silang') {
        add('alas-x', 'x', cx - span / 2, L / 2, cz, span, 'rail-x', 'Alas silang kiri–kanan', leg);
        add('alas-z', 'z', cx, L / 2, cz - span / 2, span / 2 - L / 2, 'rail-z', 'Alas silang depan–belakang', leg);
        add('alas-z2', 'z', cx, L / 2, cz + L / 2, span / 2 - L / 2, 'rail-z', 'Alas silang depan–belakang (2)', leg);
        colBottom = L;
      } else if (alas === 'bintang') {
        // Kaki bintang dilas di bawah plat dudukan; tiang berdiri di atas plat (ujung atas kaki dipotong rata plat,
        // keempat kaki bertemu sisi-ke-sisi di tengah, tidak saling tembus). Pola sama dengan alas plat.
        const tp = 0.8; // tebal plat dudukan (8 mm)
        const rEnd = span / 2; // jarak ujung kaki di lantai dari as tiang (arah diagonal)
        let t0 = L; // jarak ujung atas as kaki dari as tiang (arah diagonal)
        let ext = L / 2;
        let yh = 14;
        for (let k = 0; k < 4; k++) {
          yh = Math.max(14, 0.45 * (rEnd - t0)); // alas lebar: kaki tetap cukup curam supaya ujungnya dipotong rata lantai
          ext = cutHalf([t0, yh, 0], [rEnd, 0, 0], L, 0);
          t0 = L / 2 + ext + 0.1; // ujung dalam keempat kaki bertemu sisi-ke-sisi di tengah
        }
        const d0 = t0 / Math.SQRT2;
        const r = rEnd / Math.SQRT2;
        [
          [-1, -1],
          [1, -1],
          [-1, 1],
          [1, 1],
        ].forEach(([sx, sz], i) => line(`alas-bintang-${i}`, [cx + sx * d0, yh, cz + sz * d0], [cx + sx * r, 0, cz + sz * r], 'post', `Kaki bintang ${i + 1}`, leg));
        const ph = Math.ceil((t0 + ext + L / 2) / Math.SQRT2);
        const pl = board('plat-bintang', 'Plat dudukan tiang', cx - ph, cx + ph, yh, yh + tp, cz - ph, cz + ph);
        pl.steelMm = 8;
        boards.push(pl);
        colBottom = yh + tp;
      } else {
        const pl = board('alas-plat', 'Plat alas bundar', cx - span / 2, cx + span / 2, 0, 0.8, cz - span / 2, cz + span / 2);
        pl.shape = 'round';
        pl.steelMm = 8;
        boards.push(pl);
        colBottom = 0.8;
      }
      add('tiang', 'y', cx, colBottom, cz, yTop - ah - colBottom, 'post', 'Tiang tengah', colT);
      if (bool(p, 'pijakan')) {
        // Ring pijakan persegi 40 cm di ±30 cm, disambung ke tiang dengan dua lengan
        const yr = 30;
        const h = 20;
        add('pijakan-depan', 'x', cx - h, yr, cz + h, 2 * h, 'rail-x', 'Ring pijakan depan', rail);
        add('pijakan-belakang', 'x', cx - h, yr, cz - h, 2 * h, 'rail-x', 'Ring pijakan belakang', rail);
        add('pijakan-kiri', 'z', cx - h - 1, yr, cz - h - 1, 2 * h + 2, 'rail-z', 'Ring pijakan kiri', rail);
        add('pijakan-kanan', 'z', cx + h + 1, yr, cz - h - 1, 2 * h + 2, 'rail-z', 'Ring pijakan kanan', rail);
        // lengan dipotong dua, dilas di kedua sisi tiang
        add('pijakan-lengan', 'x', cx - h, yr, cz, h - col / 2, 'rail-x', 'Lengan ring pijakan', rail);
        add('pijakan-lengan-2', 'x', cx + col / 2, yr, cz, h - col / 2, 'rail-x', 'Lengan ring pijakan (2)', rail);
      }
    } else if (model === 'u') {
      // Rangka U / sled di kedua ujung: palang lantai + 2 tiang + palang atas, disambung gelagar
      const xs = [fx0 + L / 2, fx1 - L / 2];
      const zb = fz0 + L / 2;
      const zf = fz1 - L / 2;
      xs.forEach((x, i) => {
        const side = i ? 'kanan' : 'kiri';
        add(`sled-${side}`, 'z', x, L / 2, fz0, fz1 - fz0, 'rail-z', `Kaki sled ${side} (lantai)`, leg);
        add(`kaki-${side}-b`, 'y', x, L, zb, yTop - ah - L, 'post', `Kaki ${side} belakang`, leg);
        add(`kaki-${side}-d`, 'y', x, L, zf, yTop - ah - L, 'post', `Kaki ${side} depan`, leg);
        add(`atas-${side}`, 'z', x, ya, fz0, fz1 - fz0, 'rail-z', `Rangka atas ${side}`, apron);
      });
      add('atas-depan', 'x', xs[0] + L / 2, ya, zf, xs[1] - xs[0] - L, 'rail-x', 'Rangka atas depan', apron);
      add('atas-belakang', 'x', xs[0] + L / 2, ya, zb, xs[1] - xs[0] - L, 'rail-x', 'Rangka atas belakang', apron);
      const yb = bool(p, 'pijakan') ? 25 : 12;
      add('palang-bawah', 'x', xs[0] + 1, yb, (zb + zf) / 2, xs[1] - xs[0] - 2, 'rail-x', bool(p, 'pijakan') ? 'Pijakan kaki' : 'Palang bawah', rail);
      add(`palang-ujung-kiri`, 'z', xs[0], yb, zb + L / 2, zf - zb - L, 'rail-z', 'Palang ujung kiri', rail);
      add(`palang-ujung-kanan`, 'z', xs[1], yb, zb + L / 2, zf - zb - L, 'rail-z', 'Palang ujung kanan', rail);
    } else if (model === 'trestle') {
      // Kaki A di tiap ujung: dua kaki miring dari lantai (depan & belakang) bertemu dekat tengah di bawah daun
      const xs = [fx0 + L / 2, fx1 - L / 2];
      const yLeg = yTop - ah;
      const zc = (fz0 + fz1) / 2;
      const topHalf = Math.max(L + 2, (fz1 - fz0) * 0.15);
      const yc = 25;
      xs.forEach((x, i) => {
        const side = i ? 'kanan' : 'kiri';
        const kb: P3 = [x, 0, fz0 + L / 2];
        const kd: P3 = [x, 0, fz1 - L / 2];
        const tb: P3 = [x, yLeg, zc - topHalf];
        const td: P3 = [x, yLeg, zc + topHalf];
        line(`kaki-a-${i}-b`, kb, tb, 'post', `Kaki A ${side} belakang`, leg);
        line(`kaki-a-${i}-d`, kd, td, 'post', `Kaki A ${side} depan`, leg);
        add(`atas-${side}`, 'z', x, ya, fz0, fz1 - fz0, 'rail-z', `Rangka atas ${side}`, apron);
        // palang datar kaki A: ujungnya menempel rata di sisi dalam kedua kaki (diukur di tepi atas palang,
        // karena kaki makin ke atas makin masuk ke tengah)
        const yt = yc + rw;
        const zbIn = kb[2] + (tb[2] - kb[2]) * (yt / yLeg) + cutHalf(kb, tb, L, 2);
        const zfIn = kd[2] + (td[2] - kd[2]) * (yt / yLeg) - cutHalf(kd, td, L, 2);
        add(`palang-a-${side}`, 'z', x, yc, zbIn, zfIn - zbIn, 'rail-z', `Palang kaki A ${side}`, rail);
      });
      add('atas-depan', 'x', xs[0] + aw, ya, fz1 - 1, xs[1] - xs[0] - 2 * aw, 'rail-x', 'Rangka atas depan', apron);
      add('atas-belakang', 'x', xs[0] + aw, ya, fz0 + 1, xs[1] - xs[0] - 2 * aw, 'rail-x', 'Rangka atas belakang', apron);
      add('palang-panjang', 'x', xs[0] + 1, yc, zc, xs[1] - xs[0] - 2, 'rail-x', 'Palang penghubung kaki A', rail);
    } else if (model === 'hairpin') {
      // Kaki V ramping di tiap sudut: dua batang dari bawah rangka atas bertemu di satu titik lantai
      const yLeg = yTop - ah;
      const rod: [number, number] = [15, 15];
      add('atas-depan', 'x', fx0, ya, fz1 - 1, fx1 - fx0, 'rail-x', 'Rangka atas depan', apron);
      add('atas-belakang', 'x', fx0, ya, fz0 + 1, fx1 - fx0, 'rail-x', 'Rangka atas belakang', apron);
      add('atas-kiri', 'z', fx0 + 1, ya, fz0 + 2, fz1 - fz0 - 4, 'rail-z', 'Rangka atas kiri', apron);
      add('atas-kanan', 'z', fx1 - 1, ya, fz0 + 2, fz1 - fz0 - 4, 'rail-z', 'Rangka atas kanan', apron);
      const spread = 7;
      // kedua batang V dipotong rata lantai dan bertemu sisi-ke-sisi di ujung bawah (tidak saling tembus)
      let hx = 0.75;
      for (let k = 0; k < 3; k++) hx = cutHalf([-spread, yLeg, 0], [-hx, 0, 0], 1.5, 0);
      [
        [fx0 + 3 + spread, fz0 + 1, 'kiri belakang'],
        [fx1 - 3 - spread, fz0 + 1, 'kanan belakang'],
        [fx0 + 3 + spread, fz1 - 1, 'kiri depan'],
        [fx1 - 3 - spread, fz1 - 1, 'kanan depan'],
      ].forEach(([x, z, nm], i) => {
        const fx = x as number;
        const fz = z as number;
        line(`hairpin-${i}-a`, [fx - spread, yLeg, fz], [fx - hx, 0, fz], 'post', `Kaki V ${nm} (1)`, rod);
        line(`hairpin-${i}-b`, [fx + spread, yLeg, fz], [fx + hx, 0, fz], 'post', `Kaki V ${nm} (2)`, rod);
      });
    } else if (model === 'x') {
      // Kaki silang X di kedua ujung (bidang depan–belakang), rangka atas keliling.
      // Kedua kaki X dipasang bersebelahan (geser setebal pipa) dan dilas di titik silangnya, tidak saling tembus;
      // rangka atas samping berada di atas sambungan kedua kaki.
      const xs = [fx0 + L, fx1 - L];
      const yLeg = yTop - ah;
      let hz = L / 2;
      for (let k = 0; k < 3; k++) hz = cutHalf([0, 0, fz0 + hz], [0, yLeg, fz1 - hz], L, 2);
      xs.forEach((x, i) => {
        const side = i ? 'kanan' : 'kiri';
        const out = i ? 1 : -1; // arah keluar meja
        line(`kaki-x-${i}-a`, [x + (out * L) / 2, 0, fz0 + hz], [x + (out * L) / 2, yLeg, fz1 - hz], 'post', `Kaki silang ${side} A`, leg);
        line(`kaki-x-${i}-b`, [x - (out * L) / 2, 0, fz1 - hz], [x - (out * L) / 2, yLeg, fz0 + hz], 'post', `Kaki silang ${side} B`, leg);
        add(`atas-${side}`, 'z', x, ya, fz0, fz1 - fz0, 'rail-z', `Rangka atas ${side}`, apron);
      });
      add('atas-depan', 'x', xs[0] + aw, ya, fz1 - 1, xs[1] - xs[0] - 2 * aw, 'rail-x', 'Rangka atas depan', apron);
      add('atas-belakang', 'x', xs[0] + aw, ya, fz0 + 1, xs[1] - xs[0] - 2 * aw, 'rail-x', 'Rangka atas belakang', apron);
      add('palang-silang', 'x', xs[0] + L, yLeg / 2, (fz0 + fz1) / 2, xs[1] - xs[0] - 2 * L, 'rail-x', 'Palang penghubung kaki silang', rail);
    } else if (model === 'tiang-ganda') {
      // Dua tiang di tengah lebar meja, masing-masing tapak T di lantai + lengan T di bawah daun, disambung balok
      const col = Math.max(5, L + 1);
      const colT: [number, number] = [col * 10, col * 10];
      const inset = Math.max(col / 2 + 10, Math.min(W * 0.2, 45));
      const xs = [inset, W - inset];
      const zc = D / 2;
      const footL = Math.min(D - 4, Math.max(40, D * 0.85));
      xs.forEach((x, i) => {
        const side = i ? 'kanan' : 'kiri';
        add(`tapak-${side}`, 'z', x, L / 2, zc - footL / 2, footL, 'rail-z', `Tapak T ${side} (lantai)`, leg);
        add(`tiang-${side}`, 'y', x, L, zc, yTop - ah - L, 'post', `Tiang ${side}`, colT);
        // lengan T dipotong di antara rangka atas depan & belakang (yang menerus)
        add(`lengan-${side}`, 'z', x, ya, fz0 + 2 * aw, fz1 - fz0 - 4 * aw, 'rail-z', `Lengan atas T ${side}`, apron);
      });
      add('atas-depan', 'x', fx0, ya, fz1 - 1, fx1 - fx0, 'rail-x', 'Rangka atas depan', apron);
      add('atas-belakang', 'x', fx0, ya, fz0 + 1, fx1 - fx0, 'rail-x', 'Rangka atas belakang', apron);
      add('balok-tengah', 'x', xs[0] + 1, ya, zc, xs[1] - xs[0] - 2, 'rail-x', 'Balok tengah atas', apron);
      const pij = bool(p, 'pijakan');
      add('palang-bawah', 'x', xs[0] + col / 2, pij ? 28 : 18, zc, xs[1] - xs[0] - col, 'rail-x', pij ? 'Pijakan kaki' : 'Palang bawah antar tiang', apron);
    } else if (model === 'z') {
      // Kaki Z di tiap ujung: tapak lantai (depan–belakang), kaki miring dari tapak belakang ke rangka atas depan
      const xs = [fx0 + L / 2, fx1 - L / 2];
      const yLeg = yTop - ah;
      const zb = fz0 + L / 2;
      const zf = fz1 - L / 2;
      xs.forEach((x, i) => {
        const side = i ? 'kanan' : 'kiri';
        add(`tapak-${side}`, 'z', x, L / 2, fz0, fz1 - fz0, 'rail-z', `Kaki Z ${side} bawah (lantai)`, leg);
        line(`kaki-z-${i}`, [x, L, zb], [x, yLeg, zf], 'post', `Kaki Z ${side} miring`, leg);
        add(`atas-${side}`, 'z', x, ya, fz0, fz1 - fz0, 'rail-z', `Rangka atas ${side} (kaki Z atas)`, apron);
      });
      add('atas-depan', 'x', xs[0] + L / 2, ya, fz1 - 1, xs[1] - xs[0] - L, 'rail-x', 'Rangka atas depan', apron);
      add('atas-belakang', 'x', xs[0] + L / 2, ya, fz0 + 1, xs[1] - xs[0] - L, 'rail-x', 'Rangka atas belakang', apron);
      // palang panjang menyambung kedua kaki miring di tengah tinggi
      const ym = (L + yLeg) / 2;
      add('palang-z', 'x', xs[0] + L / 2, ym, (zb + zf) / 2, xs[1] - xs[0] - L, 'rail-x', 'Palang penghubung kaki Z', rail);
    } else if (model === 'trapesium') {
      // Rangka trapesium terbalik di tiap ujung: rangka atas lebar, tapak lantai lebih pendek, dua tiang miring
      const xs = [fx0 + L / 2, fx1 - L / 2];
      const yLeg = yTop - ah;
      const zc = (fz0 + fz1) / 2;
      const zb = fz0 + L / 2;
      const zf = fz1 - L / 2;
      const footHalf = Math.max(12, (fz1 - fz0) * 0.33);
      const zbF = zc - footHalf + L / 2; // as tiang belakang di lantai
      const zfF = zc + footHalf - L / 2;
      const yc = Math.max(12, yLeg * 0.35);
      const tc = (yc - L) / (yLeg - L);
      xs.forEach((x, i) => {
        const side = i ? 'kanan' : 'kiri';
        add(`tapak-${side}`, 'z', x, L / 2, zc - footHalf, 2 * footHalf, 'rail-z', `Tapak trapesium ${side} (lantai)`, leg);
        line(`kaki-tr-${i}-b`, [x, L, zbF], [x, yLeg, zb], 'post', `Tiang trapesium ${side} belakang`, leg);
        line(`kaki-tr-${i}-d`, [x, L, zfF], [x, yLeg, zf], 'post', `Tiang trapesium ${side} depan`, leg);
        add(`atas-${side}`, 'z', x, ya, fz0, fz1 - fz0, 'rail-z', `Rangka atas ${side}`, apron);
        const zb1 = zbF + (zb - zbF) * tc;
        const zf1 = zfF + (zf - zfF) * tc;
        add(`palang-tr-${side}`, 'z', x, yc, zb1 + L / 2, zf1 - zb1 - L, 'rail-z', `Palang trapesium ${side}`, rail);
      });
      add('atas-depan', 'x', xs[0] + L / 2, ya, fz1 - 1, xs[1] - xs[0] - L, 'rail-x', 'Rangka atas depan', apron);
      add('atas-belakang', 'x', xs[0] + L / 2, ya, fz0 + 1, xs[1] - xs[0] - L, 'rail-x', 'Rangka atas belakang', apron);
      add('palang-panjang', 'x', xs[0] + 1, yc, zc, xs[1] - xs[0] - 2, 'rail-x', 'Palang penghubung kaki trapesium', rail);
    } else if (model === 'diagonal') {
      // Rangka melayang: rangka kotak atas + rangka kotak lantai (sama besar) membingkai papan,
      // disambung hanya 2 tiang di sudut berseberangan (kiri-depan & kanan-belakang)
      const ring = (prefix: string, name: string, y: number) => {
        add(`${prefix}-depan`, 'x', 0, y, D - L / 2, W, 'rail-x', `${name} depan`, leg);
        add(`${prefix}-belakang`, 'x', 0, y, L / 2, W, 'rail-x', `${name} belakang`, leg);
        add(`${prefix}-kiri`, 'z', L / 2, y, L, D - 2 * L, 'rail-z', `${name} kiri`, leg);
        add(`${prefix}-kanan`, 'z', W - L / 2, y, L, D - 2 * L, 'rail-z', `${name} kanan`, leg);
      };
      ring('ring-atas', 'Rangka atas', H - L / 2);
      ring('ring-bawah', 'Rangka lantai', L / 2);
      add('tiang-kiri-depan', 'y', L / 2, L, D - L / 2, H - 2 * L, 'post', 'Tiang kiri depan', leg);
      add('tiang-kanan-belakang', 'y', W - L / 2, L, L / 2, H - 2 * L, 'post', 'Tiang kanan belakang', leg);
      // papan masuk ke dalam bingkai, permukaannya rata dengan atas rangka; ditahan siku 20×20 di sisi dalam rangka kiri & kanan
      const inset = (id: string, label: string, surface: number) => {
        const yl = Math.max(1, surface - b - 1); // as siku penahan
        const y0 = Math.max(yl + 1, surface - b);
        add(`${id}-siku-kiri`, 'z', L + 1, yl, L, D - 2 * L, 'rail-z', `Siku penahan ${label.toLowerCase()} kiri`, rail);
        add(`${id}-siku-kanan`, 'z', W - L - 1, yl, L, D - 2 * L, 'rail-z', `Siku penahan ${label.toLowerCase()} kanan`, rail);
        if (b > 0) boards.push(board(id, label, L, W - L, y0, y0 + b, L, D - L));
      };
      inset('papan-atas', 'Papan atas', H);
      inset('papan-bawah', 'Papan bawah', L);
    } else if (model === 'c') {
      // Rangka C di tiap ujung: tapak lantai, tiang tegak hanya di belakang, rangka atas menjorok ke depan
      const xs = [fx0 + L / 2, fx1 - L / 2];
      const zb = fz0 + L / 2;
      xs.forEach((x, i) => {
        const side = i ? 'kanan' : 'kiri';
        add(`tapak-${side}`, 'z', x, L / 2, fz0, fz1 - fz0, 'rail-z', `Tapak C ${side} (lantai)`, leg);
        add(`tiang-${side}`, 'y', x, L, zb, yTop - ah - L, 'post', `Tiang C ${side} (belakang)`, leg);
        add(`atas-${side}`, 'z', x, ya, fz0, fz1 - fz0, 'rail-z', `Rangka atas ${side}`, apron);
      });
      add('atas-depan', 'x', xs[0] + L / 2, ya, fz1 - 1, xs[1] - xs[0] - L, 'rail-x', 'Rangka atas depan', apron);
      add('atas-belakang', 'x', xs[0] + L / 2, ya, fz0 + 1, xs[1] - xs[0] - L, 'rail-x', 'Rangka atas belakang', apron);
      add('palang-bawah', 'x', xs[0] + L / 2, Math.max(1, rail[1] / 20), zb, xs[1] - xs[0] - L, 'rail-x', 'Palang bawah belakang', rail);
      add('palang-tengah', 'x', xs[0] + L / 2, (yTop - ah) / 2, zb, xs[1] - xs[0] - L, 'rail-x', 'Palang tengah belakang', rail);
    } else if (model === 'konsol') {
      // Konsol menempel tembok (z = 0): dua kaki depan saja, rangka belakang & palang samping dibaut ke tembok
      const xl = fx0 + L / 2;
      const xr = fx1 - L / 2;
      const zf = fz1 - L / 2;
      const zw = 1; // as rangka belakang, 1 cm dari tembok (pipa 20 mm)
      add('kaki-kiri-depan', 'y', xl, 0, zf, yTop, 'post', 'Kaki kiri depan', leg);
      add('kaki-kanan-depan', 'y', xr, 0, zf, yTop, 'post', 'Kaki kanan depan', leg);
      add('atas-depan', 'x', xl + L / 2, ya, zf, xr - xl - L, 'rail-x', 'Rangka atas depan', apron);
      add('atas-belakang', 'x', fx0, ya, zw, fx1 - fx0, 'rail-x', 'Rangka atas belakang (dibaut ke tembok)', apron);
      add('atas-kiri', 'z', xl, ya, zw + 1, zf - zw - 1 - L / 2, 'rail-z', 'Rangka atas kiri', apron);
      add('atas-kanan', 'z', xr, ya, zw + 1, zf - zw - 1 - L / 2, 'rail-z', 'Rangka atas kanan', apron);
      const yp = Math.min(15, (yTop - ah) / 3);
      add('palang-depan', 'x', xl + L / 2, yp, zf, xr - xl - L, 'rail-x', 'Palang bawah depan', rail);
      add('palang-kiri', 'z', xl, yp, 0, zf - L / 2, 'rail-z', 'Palang bawah kiri (ujung dibaut ke tembok)', rail);
      add('palang-kanan', 'z', xr, yp, 0, zf - L / 2, 'rail-z', 'Palang bawah kanan (ujung dibaut ke tembok)', rail);
    } else if (model === 'kotak') {
      // Rangka kotak akuarium: ring lantai + ring atas dari pipa kaki, tiang di sudut + tiang tengah tiap ±60 cm
      const xl = fx0 + L / 2;
      const xr = fx1 - L / 2;
      const zb = fz0 + L / 2;
      const zf = fz1 - L / 2;
      const yr = yTop - L / 2; // as ring atas
      const nBay = Math.max(1, Math.ceil((xr - xl) / 65));
      const pxs = Array.from({ length: nBay + 1 }, (_, i) => xl + ((xr - xl) * i) / nBay);
      const ringBox = (prefix: string, name: string, y: number) => {
        add(`${prefix}-depan`, 'x', fx0, y, zf, fx1 - fx0, 'rail-x', `${name} depan`, leg);
        add(`${prefix}-belakang`, 'x', fx0, y, zb, fx1 - fx0, 'rail-x', `${name} belakang`, leg);
        add(`${prefix}-kiri`, 'z', xl, y, zb + L / 2, zf - zb - L, 'rail-z', `${name} kiri`, leg);
        add(`${prefix}-kanan`, 'z', xr, y, zb + L / 2, zf - zb - L, 'rail-z', `${name} kanan`, leg);
      };
      ringBox('ring-bawah', 'Ring lantai', L / 2);
      ringBox('ring-atas', 'Ring atas', yr);
      pxs.forEach((x, i) => {
        const nm = i === 0 ? 'kiri' : i === nBay ? 'kanan' : `tengah ${i}`;
        add(`tiang-${i}-b`, 'y', x, L, zb, yTop - 2 * L, 'post', `Tiang ${nm} belakang`, leg);
        add(`tiang-${i}-d`, 'y', x, L, zf, yTop - 2 * L, 'post', `Tiang ${nm} depan`, leg);
        if (i > 0 && i < nBay) {
          add(`dudukan-${i}`, 'z', x, yr, zb + L / 2, zf - zb - L, 'rail-z', `Palang dudukan tangki ${i}`, leg);
          add(`palang-lantai-${i}`, 'z', x, L / 2, zb + L / 2, zf - zb - L, 'rail-z', `Palang lantai tengah ${i}`, leg);
        }
      });
      if (nBay === 1) add('dudukan-1', 'z', W / 2, yr, zb + L / 2, zf - zb - L, 'rail-z', 'Palang dudukan tangki', rail);
      if (bool(p, 'rakBawah') && b > 0) boards.push(board('papan-bawah', 'Papan bawah (filter / sump)', xl + L / 2, xr - L / 2, L, L + b, zb - L / 2, zf + L / 2));
    } else if (model === 'silang') {
      // Rangka akuarium bersilang: 4 tiang sudut, ring atas & ring bawah, silang X di panel kiri, kanan, belakang
      const xl = fx0 + L / 2;
      const xr = fx1 - L / 2;
      const zb = fz0 + L / 2;
      const zf = fz1 - L / 2;
      const yr = yTop - L / 2;
      const yb = 12;
      const twoBay = xr - xl > 100;
      const pxs = twoBay ? [xl, W / 2, xr] : [xl, xr];
      pxs.forEach((x, i) => {
        const nm = i === 0 ? 'kiri' : i === pxs.length - 1 ? 'kanan' : 'tengah';
        add(`kaki-${i}-b`, 'y', x, 0, zb, yTop - L, 'post', `Kaki ${nm} belakang`, leg);
        add(`kaki-${i}-d`, 'y', x, 0, zf, yTop - L, 'post', `Kaki ${nm} depan`, leg);
      });
      const ringBox = (prefix: string, name: string, y: number, t: [number, number]) => {
        add(`${prefix}-depan`, 'x', fx0, y, zf, fx1 - fx0, 'rail-x', `${name} depan`, t);
        add(`${prefix}-belakang`, 'x', fx0, y, zb, fx1 - fx0, 'rail-x', `${name} belakang`, t);
        add(`${prefix}-kiri`, 'z', xl, y, zb + L / 2, zf - zb - L, 'rail-z', `${name} kiri`, t);
        add(`${prefix}-kanan`, 'z', xr, y, zb + L / 2, zf - zb - L, 'rail-z', `${name} kanan`, t);
      };
      ringBox('ring-atas', 'Ring atas', yr, leg);
      // ring bawah dari pipa kecil di tengah tinggi kaki: dipotong per bentang, ujungnya menempel di sisi kaki
      for (let i = 0; i < pxs.length - 1; i++) {
        const sfx = i ? `-${i + 1}` : '';
        const nm = i ? ` (${i + 1})` : '';
        add(`ring-bawah-depan${sfx}`, 'x', pxs[i] + L / 2, yb, zf, pxs[i + 1] - pxs[i] - L, 'rail-x', `Ring bawah depan${nm}`, rail);
        add(`ring-bawah-belakang${sfx}`, 'x', pxs[i] + L / 2, yb, zb, pxs[i + 1] - pxs[i] - L, 'rail-x', `Ring bawah belakang${nm}`, rail);
      }
      add('ring-bawah-kiri', 'z', xl, yb, zb + L / 2, zf - zb - L, 'rail-z', 'Ring bawah kiri', rail);
      add('ring-bawah-kanan', 'z', xr, yb, zb + L / 2, zf - zb - L, 'rail-z', 'Ring bawah kanan', rail);
      if (twoBay) add('dudukan-tengah', 'z', W / 2, yr, zb + L / 2, zf - zb - L, 'rail-z', 'Palang dudukan tangki', leg);
      // Silang X: kedua batang bersebelahan (geser setebal pipa, masih di dalam lebar kaki) dan dilas di titik silang;
      // ujung bawah duduk di atas ring bawah, ujung atas menempel di bawah ring atas, sisi tapaknya rata dengan sisi kaki.
      const yLo = yb + rw;
      const yHi = yr - L / 2;
      const t = rail[0] / 10;
      // silang di panel samping (bidang depan–belakang)
      let hz = rw;
      for (let k = 0; k < 3; k++) hz = cutHalf([0, yLo, zb + L / 2 + hz], [0, yHi, zf - L / 2 - hz], t, 2);
      [xl, xr].forEach((x, i) => {
        const side = i ? 'kanan' : 'kiri';
        line(`silang-${side}-a`, [x - rw, yLo, zb + L / 2 + hz], [x - rw, yHi, zf - L / 2 - hz], 'custom', `Silang samping ${side} A`, rail);
        line(`silang-${side}-b`, [x + rw, yLo, zf - L / 2 - hz], [x + rw, yHi, zb + L / 2 + hz], 'custom', `Silang samping ${side} B`, rail);
      });
      // silang di panel belakang (tiap bentang)
      for (let i = 0; i < pxs.length - 1; i++) {
        let hx = rw;
        for (let k = 0; k < 3; k++) hx = cutHalf([pxs[i] + L / 2 + hx, yLo, 0], [pxs[i + 1] - L / 2 - hx, yHi, 0], t, 0);
        const a = pxs[i] + L / 2 + hx;
        const c2 = pxs[i + 1] - L / 2 - hx;
        line(`silang-belakang-${i}-a`, [a, yLo, zb - rw], [c2, yHi, zb - rw], 'custom', `Silang belakang ${i + 1} A`, rail);
        line(`silang-belakang-${i}-b`, [c2, yLo, zb + rw], [a, yHi, zb + rw], 'custom', `Silang belakang ${i + 1} B`, rail);
      }
      if (bool(p, 'rakBawah') && b > 0) boards.push(board('papan-bawah', 'Papan bawah (filter / sump)', xl + L / 2, xr - L / 2, yb + 1, yb + 1 + b, zb + 1.5, zf + L / 2));
    } else if (model === 'tiga') {
      // Kaki 3: kaki tegak di sudut segitiga (1 belakang, 2 depan). Di bawah daun dan dekat lantai disatukan
      // lengan Y: lengan belakang lurus depan–belakang, dua lengan depan miring menempel di sisinya
      // dan ujung luarnya dipotong rata dengan sisi dalam kaki depan.
      const cx = W / 2;
      const cz = D / 2;
      const R = Math.min(W, D) / 2;
      const r = Math.max(12, R - L / 2 - 6);
      const s60 = Math.sin(Math.PI / 3);
      const pts: [number, number][] = [
        [cx, cz - r],
        [cx - r * s60, cz + r / 2],
        [cx + r * s60, cz + r / 2],
      ];
      const names = ['belakang', 'kiri depan', 'kanan depan'];
      pts.forEach(([x, z], i) => add(`kaki-${i}`, 'y', x, 0, z, yTop, 'post', `Kaki ${names[i]}`, leg));
      const armT: [number, number] = L >= 3 ? [30, 30] : [20, 20];
      const spider = (prefix: string, name: string, y: number, t: [number, number]) => {
        const tc = t[0] / 10;
        let h = tc / 2;
        [1, 2].forEach((j) => {
          const sx = j === 1 ? -1 : 1;
          const a: P3 = [cx + (sx * tc) / 2, y, cz];
          const e: P3 = [pts[j][0] - (sx * L) / 2, y, pts[j][1]];
          h = Math.max(h, cutHalf(a, e, tc, 2));
          line(`${prefix}-${j === 1 ? 'kiri' : 'kanan'}`, a, e, 'custom', `${name} kiri-kanan ${j === 1 ? 'kiri' : 'kanan'} (miring)`, t);
        });
        // lengan belakang menerus dari sisi depan kaki belakang sampai melewati tapak kedua lengan miring
        const z0 = pts[0][1] + L / 2;
        add(`${prefix}-belakang`, 'z', cx, y, z0, cz + h + 0.3 - z0, 'rail-z', `${name} belakang`, t);
      };
      spider('lengan-atas', 'Lengan atas', yTop - armT[1] / 20, armT);
      spider('lengan-bawah', 'Lengan bawah', Math.max(10, Math.min(18, yTop * 0.2)), rail);
    } else if (model === 'y') {
      // Kaki Y: tiap ujung tapak lantai melintang + tiang pendek + plat dudukan, dari plat bercabang dua batang
      // miring ke lengan atas (depan & belakang). Kedua cabang bertemu sisi-ke-sisi di atas plat, tidak saling tembus.
      const col = Math.max(5, L + 1);
      const colT: [number, number] = [col * 10, col * 10];
      const inset = Math.max(col / 2 + 10, Math.min(W * 0.2, 45));
      const xs = [inset, W - inset];
      const zc = D / 2;
      const footL = Math.min(D - 4, Math.max(40, D * 0.85));
      const tp = 0.8;
      const yL = yTop - L; // bawah lengan atas
      const halfIn = fz1 - 2 - zc; // setengah panjang lengan atas
      let t0 = L / 2 + 0.1;
      let ext = L / 2;
      let zT = halfIn - ext - 0.3;
      let yb = L + 8;
      for (let k = 0; k < 6; k++) {
        zT = halfIn - ext - 0.3;
        yb = Math.max(L + 8, yL - tp - 1.3 * (zT - t0));
        ext = cutHalf([0, yb + tp, t0], [0, yL, zT], L, 2);
        t0 = ext + 0.1;
      }
      const yp = yb + tp;
      const ph = t0 + ext + 0.5;
      xs.forEach((x, i) => {
        const side = i ? 'kanan' : 'kiri';
        add(`tapak-${side}`, 'z', x, L / 2, zc - footL / 2, footL, 'rail-z', `Tapak ${side} (lantai)`, leg);
        add(`tiang-${side}`, 'y', x, L, zc, yb - L, 'post', `Tiang ${side}`, colT);
        const pl = board(`plat-y-${side}`, `Plat dudukan cabang ${side}`, x - col / 2, x + col / 2, yb, yp, zc - ph, zc + ph);
        pl.steelMm = 8;
        boards.push(pl);
        line(`cabang-${side}-b`, [x, yp, zc - t0], [x, yL, zc - zT], 'post', `Cabang miring ${side} belakang`, leg);
        line(`cabang-${side}-d`, [x, yp, zc + t0], [x, yL, zc + zT], 'post', `Cabang miring ${side} depan`, leg);
        add(`lengan-${side}`, 'z', x, yTop - L / 2, fz0 + 2 * aw, fz1 - fz0 - 4 * aw, 'rail-z', `Lengan atas ${side}`, leg);
      });
      add('atas-depan', 'x', fx0, ya, fz1 - 1, fx1 - fx0, 'rail-x', 'Rangka atas depan', apron);
      add('atas-belakang', 'x', fx0, ya, fz0 + 1, fx1 - fx0, 'rail-x', 'Rangka atas belakang', apron);
      add('balok-tengah', 'x', xs[0] + L / 2, ya, zc, xs[1] - xs[0] - L, 'rail-x', 'Balok tengah atas', apron);
      add('palang-bawah', 'x', xs[0] + col / 2, L + (yb - L) / 2, zc, xs[1] - xs[0] - col, 'rail-x', 'Palang bawah antar tiang', apron);
    } else if (model === 'gambar') {
      // Meja gambar: kaki A di tiap ujung + rangka atas datar; di atasnya rel miring (turun ke depan) yang depannya
      // duduk di rangka atas dan belakangnya ditopang tiang penyangga pendek. Papan miring di atas rel,
      // bibir penahan di tepi bawah supaya pensil / kertas tidak jatuh.
      const th = (Math.min(30, Math.max(5, num(p, 'sudutPapan', 15))) * Math.PI) / 180;
      const cs = Math.cos(th);
      const tn = Math.tan(th);
      const zF = fz1;
      const zB = fz0;
      const yAx = (z: number) => H - (1 + b) / cs + (zF - 2 - z) * tn; // as rel miring: tinggi = tepi depan papan, naik ke belakang
      const yS = yAx(zF) - 1 / cs; // atas rangka datar = bawah ujung depan rel miring
      const yaG = yS - ah / 2;
      const xs = [fx0 + L / 2, fx1 - L / 2];
      const yLeg = yaG - ah / 2;
      const zc = (fz0 + fz1) / 2;
      const topHalf = Math.max(L + 2, (fz1 - fz0) * 0.15);
      const yc = Math.min(25, yLeg * 0.35);
      xs.forEach((x, i) => {
        const side = i ? 'kanan' : 'kiri';
        const kb: P3 = [x, 0, fz0 + L / 2];
        const kd: P3 = [x, 0, fz1 - L / 2];
        const tb: P3 = [x, yLeg, zc - topHalf];
        const td: P3 = [x, yLeg, zc + topHalf];
        line(`kaki-a-${i}-b`, kb, tb, 'post', `Kaki A ${side} belakang`, leg);
        line(`kaki-a-${i}-d`, kd, td, 'post', `Kaki A ${side} depan`, leg);
        add(`atas-${side}`, 'z', x, yaG, fz0, fz1 - fz0, 'rail-z', `Rangka atas ${side}`, apron);
        const yt = yc + rw;
        const zbIn = kb[2] + (tb[2] - kb[2]) * (yt / yLeg) + cutHalf(kb, tb, L, 2);
        const zfIn = kd[2] + (td[2] - kd[2]) * (yt / yLeg) - cutHalf(kd, td, L, 2);
        add(`palang-a-${side}`, 'z', x, yc, zbIn, zfIn - zbIn, 'rail-z', `Palang kaki A ${side}`, rail);
      });
      add('atas-depan', 'x', xs[0] + aw, yaG, fz1 - 1, xs[1] - xs[0] - 2 * aw, 'rail-x', 'Rangka atas depan', apron);
      add('atas-belakang', 'x', xs[0] + aw, yaG, fz0 + 1, xs[1] - xs[0] - 2 * aw, 'rail-x', 'Rangka atas belakang', apron);
      add('palang-panjang', 'x', xs[0] + 1, yc, zc, xs[1] - xs[0] - 2, 'rail-x', 'Palang penghubung kaki A', rail);
      // rel miring kiri, kanan (+ tengah untuk papan lebar); tiang penyangga di ujung belakang tiap rel
      const relXs = [xs[0], xs[1], ...(W > 100 ? [W / 2] : [])];
      relXs.forEach((x, i) => {
        const nm = i === 0 ? 'kiri' : i === 1 ? 'kanan' : 'tengah';
        line(`rel-miring-${nm}`, [x, yAx(zF), zF], [x, yAx(zB), zB], 'custom', `Rel miring papan ${nm}`, rail);
        const top = yAx(zB + 2) - 1 / cs; // bawah rel miring di sisi depan tiang
        add(`tiang-penyangga-${nm}`, 'y', x, yS, zB + 1, top - yS, 'post', `Tiang penyangga papan ${nm}${i === 2 ? ' (di rangka atas belakang)' : ''}`, rail);
      });
      // bibir penahan 20×40 duduk di atas ujung depan rel miring
      add('bibir-penahan', 'x', 0, yAx(zF - 2) + 1 / cs + 2, zF - 1, W, 'rail-x', 'Bibir penahan pensil (tepi bawah papan)', [20, 40]);
      if (b > 0) {
        const zFront = zF - 3; // tepi depan papan sedikit di belakang bibir penahan
        const zm = (zFront + zB) / 2;
        const ls = (zFront - zB) / cs;
        const off = 1 + b / 2;
        const cy = yAx(zm) + cs * off;
        const czB = zm + Math.sin(th) * off;
        boards.push({ ...board('papan-gambar', 'Papan gambar miring', 0, W, cy - b / 2, cy + b / 2, czB - ls / 2, czB + ls / 2), rotX: Math.round((th * 1800) / Math.PI) / 10 });
      }
    } else if (lipat) {
      // Rangka atas keliling + batang dudukan engsel; kaki di dalam rangka, dilipat ke tengah
      add('atas-depan', 'x', fx0, ya, fz1 - 1, fx1 - fx0, 'rail-x', 'Rangka atas depan', apron);
      add('atas-belakang', 'x', fx0, ya, fz0 + 1, fx1 - fx0, 'rail-x', 'Rangka atas belakang', apron);
      add('atas-kiri', 'z', fx0 + 1, ya, fz0 + 2, fz1 - fz0 - 4, 'rail-z', 'Rangka atas kiri', apron);
      add('atas-kanan', 'z', fx1 - 1, ya, fz0 + 2, fz1 - fz0 - 4, 'rail-z', 'Rangka atas kanan', apron);
      const yLeg = yTop - ah;
      const zb = fz0 + 2 + L / 2;
      const zf = fz1 - 2 - L / 2;
      [
        { x: fx0 + 2 + 1 + L / 2, side: 'kiri', sign: 1 as const },
        { x: fx1 - 2 - 1 - L / 2, side: 'kanan', sign: -1 as const },
      ].forEach(({ x, side, sign }) => {
        add(`dudukan-${side}`, 'z', x, ya, fz0 + 2, fz1 - fz0 - 4, 'rail-z', `Dudukan engsel kaki ${side}`, apron);
        add(`kaki-${side}-b`, 'y', x, 0, zb, yLeg, 'post', `Kaki lipat ${side} belakang`, leg);
        add(`kaki-${side}-d`, 'y', x, 0, zf, yLeg, 'post', `Kaki lipat ${side} depan`, leg);
        // pasangan kaki bentuk U: dua kaki disambung palang bawah dekat lantai (tanpa palang H)
        add(`palang-lipat-${side}`, 'z', x, Math.max(4, L + 2), zb + L / 2, zf - zb - L, 'rail-z', `Palang bawah kaki lipat ${side} (bentuk U)`, rail);
        // penyangga lipat miring: dari tiap kaki ke dudukan di bawah daun, ke arah tengah meja
        const run = Math.max(8, Math.min(yLeg * 0.5, Math.abs(W / 2 - x) - 5));
        const xs = x + sign * run;
        const yS = yLeg * 0.5;
        const zc = (zb + zf) / 2;
        add(`dudukan-penyangga-${side}`, 'z', xs, ya, fz0 + 2, fz1 - fz0 - 4, 'rail-z', `Dudukan penyangga lipat ${side}`, rail);
        // ujung bawah penyangga menempel rata di sisi dalam kaki (tapak potongannya di luar kaki)
        const yE = ya - rw; // menempel di bawah dudukan penyangga
        let hb = rw;
        let hd = rw;
        for (let k = 0; k < 3; k++) {
          hb = cutHalf([x, yS, zb + L / 2 + hb], [xs, yE, zc - 3], rail[0] / 10, 2);
          hd = cutHalf([x, yS, zf - L / 2 - hd], [xs, yE, zc + 3], rail[0] / 10, 2);
        }
        line(`penyangga-${side}-b`, [x, yS, zb + L / 2 + hb], [xs, yE, zc - 3], 'custom', `Penyangga lipat ${side} belakang`, rail);
        line(`penyangga-${side}-d`, [x, yS, zf - L / 2 - hd], [xs, yE, zc + 3], 'custom', `Penyangga lipat ${side} depan`, rail);
        hinges.push({
          id: `engsel-kaki-${side}`,
          memberId: `kaki-${side}-d`,
          type: 'folding-lock',
          pos: yLeg,
          side: 'start',
          foldAxis: 'x',
          foldSign: sign,
          carry: true,
          label: `Engsel kaki lipat ${side}`,
        });
      });
    } else {
      // Kaki lurus / melebar di 4 sudut rangka atas
      const xl = fx0 + L / 2;
      const xr = fx1 - L / 2;
      const zb = fz0 + L / 2;
      const zf = fz1 - L / 2;
      const yLeg = yTop;
      const spread = model === 'melebar' ? Math.tan((num(p, 'sudutKaki', 8) * Math.PI) / 180) * (yLeg - c) : 0;
      const corners: [number, number, number, number, string][] = [
        [xl, zb, -1, -1, 'kiri belakang'],
        [xr, zb, 1, -1, 'kanan belakang'],
        [xl, zf, -1, 1, 'kiri depan'],
        [xr, zf, 1, 1, 'kanan depan'],
      ];
      /** Posisi as kaki ke-i pada ketinggian y (kaki melebar makin ke bawah makin keluar) */
      const at = (i: number, y: number): P3 => {
        const [x, z, sx, sz] = corners[i];
        const t = (yLeg - y) / Math.max(1, yLeg - c);
        return [x + sx * spread * t, y, z + sz * spread * t];
      };
      corners.forEach(([x, z, , , label], i) => line(`kaki-${i}`, at(i, c), [x, yLeg, z], 'post', `Kaki ${label}`, leg));

      add('atas-depan', 'x', fx0 + L, ya, zf, fx1 - fx0 - 2 * L, 'rail-x', 'Rangka atas depan', apron);
      add('atas-belakang', 'x', fx0 + L, ya, zb, fx1 - fx0 - 2 * L, 'rail-x', 'Rangka atas belakang', apron);
      add('atas-kiri', 'z', xl, ya, fz0 + L, fz1 - fz0 - 2 * L, 'rail-z', 'Rangka atas kiri', apron);
      add('atas-kanan', 'z', xr, ya, fz0 + L, fz1 - fz0 - 2 * L, 'rail-z', 'Rangka atas kanan', apron);

      if (model === 'lurus' && !round && bool(p, 'kakiTengah')) {
        const xm = W / 2;
        add('kaki-tengah-b', 'y', xm, c, zb + (L / 2 + 1), yTop - ah - c, 'post', 'Kaki tengah belakang', leg);
        add('kaki-tengah-d', 'y', xm, c, zf - (L / 2 + 1), yTop - ah - c, 'post', 'Kaki tengah depan', leg);
        add('atas-tengah', 'z', xm, ya, zb + 1, zf - zb - 2, 'rail-z', 'Rangka atas tengah', apron);
      }

      // Palang di antara kaki pada ketinggian y (ikut posisi kaki melebar)
      const ring = (prefix: string, name: string, y: number, withBoard: boolean) => {
        const [lb, rb, lf, rf] = [0, 1, 2, 3].map((i) => at(i, y));
        add(`${prefix}-depan`, 'x', lf[0] + L / 2, y, lf[2], rf[0] - lf[0] - L, 'rail-x', `${name} depan`, rail);
        add(`${prefix}-belakang`, 'x', lb[0] + L / 2, y, lb[2], rb[0] - lb[0] - L, 'rail-x', `${name} belakang`, rail);
        add(`${prefix}-kiri`, 'z', lb[0], y, lb[2] + L / 2, lf[2] - lb[2] - L, 'rail-z', `${name} kiri`, rail);
        add(`${prefix}-kanan`, 'z', rb[0], y, rb[2] + L / 2, rf[2] - rb[2] - L, 'rail-z', `${name} kanan`, rail);
        if (withBoard && b > 0) boards.push(board(`papan-${prefix}`, 'Papan rak bawah', lb[0] + L / 2, rb[0] - L / 2, y + 1, y + 1 + b, lb[2] - 1, lf[2] + 1));
      };
      if (bool(p, 'rakAtas') && !round) {
        // Tiang belakang diteruskan ke atas, lengan rak di tiap tingkat + papan
        const hTop = num(p, 'tinggiRakAtas', 50);
        const nT = Math.max(1, Math.round(num(p, 'tingkatAtas', 2)));
        const dR = num(p, 'dalamRakAtas', 25);
        const backXs = [xl, xr, ...(W > 140 ? [W / 2] : [])];
        backXs.forEach((x, i) => add(`tiang-atas-${i}`, 'y', x, yTop, zb, hTop + L, 'post', `Tiang rak atas ${i + 1}`, leg));
        for (let k = 0; k < nT; k++) {
          const yk = H + (hTop * (k + 1)) / nT - 1;
          backXs.forEach((x, i) => add(`lengan-atas-${i}-${k + 1}`, 'z', x, yk, zb + L / 2, dR - L, 'rail-z', `Lengan rak atas ${k + 1}`, rail));
          // palang belakang dipotong di tiap tiang rak atas (ujungnya menempel di sisi tiang)
          const bx = [...backXs].sort((u, v) => u - v);
          for (let j = 0; j < bx.length - 1; j++)
            add(`rak-atas-belakang-${k + 1}${j ? `-${j + 1}` : ''}`, 'x', bx[j] + L / 2, yk, zb, bx[j + 1] - bx[j] - L, 'rail-x', `Palang rak atas ${k + 1}${j ? ` (${j + 1})` : ''}`, rail);
          if (b > 0) boards.push(board(`papan-atas-${k + 1}`, `Papan rak atas ${k + 1}`, fx0, fx1, yk + 1, yk + 1 + b, zb - L / 2, zb - L / 2 + dR));
        }
      }
      if (bool(p, 'rakBawah')) ring('rak', 'Palang rak bawah', c + num(p, 'tinggiRakBawah', 20), true);
      else if (bool(p, 'palangKaki')) {
        const yp = c + 15;
        const [lb, rb, lf] = [0, 1, 2].map((i) => at(i, yp));
        add('palang-kiri', 'z', lb[0], yp, lb[2] + L / 2, lf[2] - lb[2] - L, 'rail-z', 'Palang kaki kiri', rail);
        add('palang-kanan', 'z', rb[0], yp, rb[2] + L / 2, lf[2] - lb[2] - L, 'rail-z', 'Palang kaki kanan', rail);
        const hTengah = model === 'lurus' && !round && bool(p, 'kakiTengah');
        if (!hTengah) add('palang-tengah', 'x', lb[0] + rw, yp, D / 2, rb[0] - lb[0] - 2 * rw, 'rail-x', 'Palang kaki tengah', rail);
        else {
          // palang panjang dipotong dua di palang melintang kaki tengah (yang menerus)
          add('palang-tengah', 'x', lb[0] + rw, yp, D / 2, W / 2 - lb[0] - 2 * rw, 'rail-x', 'Palang kaki tengah', rail);
          add('palang-tengah-2', 'x', W / 2 + rw, yp, D / 2, rb[0] - W / 2 - 2 * rw, 'rail-x', 'Palang kaki tengah (2)', rail);
        }
        if (hTengah) {
          // kaki tengah ikut diperkuat: palang melintang menyambung ke palang panjang (bentuk H ganda)
          const zbm = zb + (L / 2 + 1); // as kaki tengah belakang (sama dengan posisi kaki tengah)
          const zfm = zf - (L / 2 + 1); // as kaki tengah depan
          add('palang-kaki-tengah', 'z', W / 2, yp, zbm + L / 2, zfm - zbm - L, 'rail-z', 'Palang kaki tengah melintang', rail);
        }
      }
    }

    if (b > 0 && model !== 'diagonal' && model !== 'gambar') {
      const top = board('daun-meja', round ? 'Daun meja bundar' : 'Daun meja', 0, W, yTop, H, 0, D);
      if (round) top.shape = 'round';
      boards.unshift(top);
    }

    // Roda di bawah ujung kaki
    const casters = roda
      ? list
          .filter((m) => m.role === 'post' && m.y <= c + 0.5 && m.id.startsWith('kaki-') && !m.id.includes('tengah'))
          .map((m, i) => ({ id: `roda-${i}`, x: m.x, z: m.z, topY: c, sizeInch: inch, brake: bool(p, 'remRoda') }))
      : [];

    const thG = (Math.min(30, Math.max(5, num(p, 'sudutPapan', 15))) * Math.PI) / 180;
    const Htot =
      bool(p, 'rakAtas') && (model === 'lurus' || model === 'melebar') && !round && !lipat
        ? H + num(p, 'tinggiRakAtas', 50) + L + b
        : model === 'gambar'
          ? Math.round((H + (fz1 - 2 - fz0) * Math.tan(thG) + 2) * 10) / 10
          : H;
    return { members: list, boards, casters, W, D, H: Htot, boardThick: b, hinges: hinges.length ? hinges : undefined, wall: model === 'konsol' ? true : undefined };
  },

  checks: (p) => {
    const out: ProductCheck[] = [];
    const round = str(p, 'bentukDaun') === 'bulat';
    const W = num(p, 'panjang');
    const H = num(p, 'tinggi');
    const model = str(p, 'modelKaki');
    if (!round && W > 140 && model === 'lurus' && !bool(p, 'kakiTengah') && !bool(p, 'kakiLipat'))
      out.push({ level: 'warn', message: `Meja ${W} cm tanpa kaki tengah bisa melendut di tengah kalau diberi beban berat.`, fix: { label: 'Tambah kaki tengah', params: { kakiTengah: true } } });
    if (str(p, 'pipa') === '20' && W > 100)
      out.push({ level: 'warn', message: 'Kaki 20×20 kurang kokoh untuk meja sepanjang ini, meja bisa goyang.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
    if (H > 95 && !bool(p, 'palangKaki') && !bool(p, 'rakBawah') && (model === 'lurus' || model === 'melebar') && !bool(p, 'kakiLipat'))
      out.push({ level: 'warn', message: 'Meja tinggi tanpa palang kaki mudah goyang.', fix: { label: 'Tambah palang kaki', params: { palangKaki: true } } });
    if (bool(p, 'rakBawah') && isFour(p) && num(p, 'tinggiRakBawah') > H - 30)
      out.push({ level: 'warn', message: 'Rak bawah terlalu dekat ke daun meja, barang susah masuk.', fix: { label: 'Turunkan rak ke 20 cm', params: { tinggiRakBawah: 20 } } });
    if (model === 'melebar' && num(p, 'sudutKaki') > 12) out.push({ level: 'info', message: 'Kaki sangat melebar: ujung kaki keluar dari tepi daun meja, bisa tersandung.' });
    if (['melebar', 'x', 'trestle', 'hairpin', 'z', 'trapesium', 'silang', 'y', 'gambar', 'tiga'].includes(model) && !bool(p, 'kakiLipat')) out.push({ level: 'info', message: 'Kaki miring dipotong bersudut di kedua ujungnya. Sudutnya tertulis di daftar potongan.' });
    if (bool(p, 'kakiLipat')) out.push({ level: 'info', message: 'Klik engsel di 3D untuk melipat kaki. Engsel kunci menahan kaki tetap tegak saat dipakai.' });
    if (model === 'pedestal') {
      const top = round ? W : Math.max(W, num(p, 'lebar'));
      const span = num(p, 'bentangAlas');
      if (span < top * 0.5)
        out.push({ level: 'warn', message: `Alas ${span} cm terlalu kecil untuk daun ${top} cm: meja mudah terguling saat ditekan di tepi.`, fix: { label: `Alas ${Math.ceil(top * 0.55)} cm`, params: { bentangAlas: Math.min(90, Math.ceil(top * 0.55)) } } });
      if (!round && Math.max(W, num(p, 'lebar')) > 90) out.push({ level: 'warn', message: 'Daun lebih dari 90 cm sebaiknya pakai 2 tiang atau kaki 4.', fix: { label: 'Pakai tiang ganda', params: { modelKaki: 'tiang-ganda', pijakan: false } } });
      if (H > 95 && !bool(p, 'pijakan')) out.push({ level: 'info', message: 'Meja bar tinggi enak diberi ring pijakan kaki.', fix: { label: 'Tambah pijakan', params: { pijakan: true } } });
    }
    const D = round ? W : num(p, 'lebar');
    if (!bool(p, 'kakiLipat')) {
      if (model === 'tiang-ganda') {
        if (W < 110) out.push({ level: 'warn', message: `Meja ${W} cm terlalu pendek untuk dua tiang; cukup satu tiang (pedestal) atau kaki 4.`, fix: { label: 'Panjang 150 cm', params: { panjang: 150 } } });
        if (D > 80 && str(p, 'pipa') === '20') out.push({ level: 'warn', message: 'Tiang ganda dengan pipa 20×20 terlalu lemah untuk daun selebar ini.', fix: { label: 'Pakai pipa 40×40', params: { pipa: '40' } } });
        if (H > 95 && !bool(p, 'pijakan')) out.push({ level: 'info', message: 'Meja bar tinggi enak diberi pijakan kaki.', fix: { label: 'Tambah pijakan', params: { pijakan: true } } });
      }
      if (model === 'z' && str(p, 'pipa') === '20')
        out.push({ level: 'warn', message: 'Kaki Z memikul beban lewat batang miring; pipa 20×20 bisa melentur.', fix: { label: 'Pakai pipa 40×40', params: { pipa: '40' } } });
      if (model === 'trapesium' && H > 95)
        out.push({ level: 'warn', message: 'Kaki trapesium terbalik makin sempit di lantai; untuk meja setinggi bar mudah goyang ke depan.', fix: { label: 'Pakai kaki U', params: { modelKaki: 'u' } } });
      if (model === 'diagonal') {
        if (str(p, 'pipa') !== '40') out.push({ level: 'warn', message: 'Rangka melayang hanya ditopang 2 tiang: pakai pipa 40×40 supaya tidak goyang dan papan bisa dibingkai.', fix: { label: 'Pakai pipa 40×40', params: { pipa: '40' } } });
        if (H > 60) out.push({ level: 'warn', message: 'Rangka 2 tiang diagonal paling kokoh untuk meja rendah (meja kopi / samping), maksimal ±60 cm.', fix: { label: 'Tinggi 45 cm', params: { tinggi: 45 } } });
        if (round) out.push({ level: 'warn', message: 'Rangka melayang membingkai papan kotak; daun bundar tidak bisa dipakai.', fix: { label: 'Daun kotak', params: { bentukDaun: 'kotak' } } });
        out.push({ level: 'info', message: 'Papan atas & bawah masuk ke dalam bingkai rangka, ditahan siku 20×20 di sisi dalam rangka kiri & kanan.' });
      }
      if (model === 'c') {
        if (D > 55) out.push({ level: 'warn', message: `Rangka C hanya bertiang di belakang; daun sedalam ${D} cm mudah melentur di depan.`, fix: { label: 'Lebar 40 cm', params: { lebar: 40 } } });
        if (W > 100) out.push({ level: 'warn', message: 'Meja samping rangka C sebaiknya tidak lebih dari 100 cm.', fix: { label: 'Panjang 60 cm', params: { panjang: 60 } } });
        out.push({ level: 'info', message: 'Tapak bawah masuk ke kolong sofa / ranjang; cek tinggi kolong minimal 5 cm.' });
      }
      if (model === 'konsol') {
        if (D > 50) out.push({ level: 'warn', message: `Konsol 2 kaki sedalam ${D} cm terlalu berat di depan; pakai kaki 4.`, fix: { label: 'Lebar 40 cm', params: { lebar: 40 } } });
        out.push({ level: 'info', message: 'Rangka belakang dan ujung palang bawah WAJIB dibaut ke tembok (fischer + baut 8 mm).' });
      }
      if (model === 'tiga') {
        const top = round ? W : Math.max(W, D);
        if (top > 90) out.push({ level: 'warn', message: `Daun ${top} cm terlalu lebar untuk 3 kaki: tepi di antara dua kaki mudah terjungkit kalau ditekan.`, fix: { label: 'Diameter 80 cm', params: { panjang: 80, bentukDaun: 'bulat' } } });
        if (!round) out.push({ level: 'info', message: 'Kaki 3 paling pas untuk daun bundar; pada daun kotak sudut depan dan belakang tidak tertopang.', fix: { label: 'Daun bundar', params: { bentukDaun: 'bulat' } } });
        if (H > 95 && str(p, 'pipa') !== '40') out.push({ level: 'warn', message: 'Meja bar 3 kaki sebaiknya pakai pipa 40×40 supaya tidak goyang.', fix: { label: 'Pakai pipa 40×40', params: { pipa: '40' } } });
        out.push({ level: 'info', message: 'Meja 3 kaki tidak pernah goyang walau lantai tidak rata. Lengan miring dipotong bersudut, sudutnya ada di daftar potongan.' });
      }
      if (model === 'y') {
        const need = Math.round(1.1 * (D / 2 - 8) + 19);
        if (H < need) out.push({ level: 'warn', message: `Meja ${H} cm terlalu pendek untuk daun selebar ${D} cm: cabang Y jadi landai dan tiangnya hampir hilang.`, fix: { label: `Lebar ${Math.max(40, Math.floor(2 * ((H - 19) / 1.1 + 8)))} cm`, params: { lebar: Math.max(40, Math.floor(2 * ((H - 19) / 1.1 + 8))) } } });
        if (W < 110) out.push({ level: 'warn', message: `Meja ${W} cm terlalu pendek untuk dua kaki Y; pakai kaki tunggal atau kaki 4.`, fix: { label: 'Panjang 140 cm', params: { panjang: 140 } } });
        if (str(p, 'pipa') === '20') out.push({ level: 'warn', message: 'Cabang Y memikul daun lewat batang miring; pipa 20×20 bisa melentur.', fix: { label: 'Pakai pipa 40×40', params: { pipa: '40' } } });
        out.push({ level: 'info', message: 'Kedua cabang dilas di atas plat besi 8 mm di pucuk tiang, ujung bawahnya dipotong rata dengan plat.' });
      }
      if (model === 'gambar') {
        const sud = num(p, 'sudutPapan', 15);
        if (str(p, 'bentukDaun') === 'bulat') out.push({ level: 'warn', message: 'Papan gambar miring selalu kotak; daun bundar tidak dipakai.', fix: { label: 'Daun kotak', params: { bentukDaun: 'kotak' } } });
        if (sud > 22) out.push({ level: 'info', message: `Papan miring ${sud}°: kertas dan pensil mudah melorot, pakai penjepit kertas.`, fix: { label: 'Miring 15°', params: { sudutPapan: 15 } } });
        if (D > 80 && sud >= 15) out.push({ level: 'info', message: `Tepi belakang papan naik sekitar ${Math.round(D * Math.tan((sud * Math.PI) / 180))} cm dari tepi depan; pastikan masih terjangkau tangan.` });
        if (H > 95) out.push({ level: 'warn', message: 'Meja gambar setinggi ini dipakai berdiri; kaki A perlu pipa 40×40.', fix: { label: 'Pakai pipa 40×40', params: { pipa: '40' } } });
        out.push({ level: 'info', message: 'Tinggi meja diukur di tepi depan papan (dekat bibir penahan). Tepi belakang lebih tinggi sesuai kemiringan.' });
      }
      if (model === 'kotak' || model === 'silang') {
        if (str(p, 'pipa') === '20') out.push({ level: 'warn', message: 'Akuarium sangat berat (±1 kg per liter air + kaca + batu). Pipa 20×20 tidak cukup.', fix: { label: 'Pakai pipa 40×40', params: { pipa: '40' } } });
        if (str(p, 'papan') === 'none') out.push({ level: 'warn', message: 'Tangki akuarium wajib dialasi papan rata (multiplek 18 mm), jangan langsung di atas besi.', fix: { label: 'Pakai multiplek', params: { papan: 'multiplek' } } });
        if (H > 95) out.push({ level: 'warn', message: 'Rangka akuarium lebih dari 95 cm berisiko terguling saat tangki penuh.', fix: { label: 'Tinggi 75 cm', params: { tinggi: 75 } } });
        const liter = Math.round((W * D * 45) / 1000);
        out.push({ level: 'info', message: `Tangki ${W}×${D} cm tinggi 45 cm ≈ ${liter} liter ≈ ${Math.round(liter * 1.2)} kg. Lantai harus rata; ganjal karet di bawah rangka.` });
      }
    }
    if (str(p, 'papan') === 'none') out.push({ level: 'info', message: 'Tanpa papan: daun meja (kaca, marmer, dll.) disiapkan sendiri.' });
    return out;
  },
};
