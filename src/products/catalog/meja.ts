import { Params } from '../types';
import { FINISH, GroupSpec, Opt, sizes } from './gen';

/**
 * Sub-kategori meja dari riset desain rangka besi (Pinterest / katalog industrial):
 * kaki lurus + palang H, kaki melebar (splayed), kaki X, kaki U (sled), kaki A (trestle), hairpin,
 * kaki tunggal (pedestal) alas silang / bintang / plat, rak bawah / atas, kaki tengah, roda.
 */
const K = {
  lurus: { label: 'kaki lurus', params: { modelKaki: 'lurus', palangKaki: true } },
  lurusPolos: { label: 'kaki lurus tanpa palang', params: { modelKaki: 'lurus', palangKaki: false } },
  melebar: { label: 'kaki melebar', params: { modelKaki: 'melebar', sudutKaki: 8, palangKaki: true } },
  melebarTipis: { label: 'kaki agak melebar', params: { modelKaki: 'melebar', sudutKaki: 5, palangKaki: true } },
  x: { label: 'kaki X', params: { modelKaki: 'x' } },
  u: { label: 'kaki U', params: { modelKaki: 'u' } },
  trestle: { label: 'kaki A', params: { modelKaki: 'trestle' } },
  hairpin: { label: 'kaki hairpin', params: { modelKaki: 'hairpin' } },
  silang: { label: 'kaki tunggal alas silang', params: { modelKaki: 'pedestal', alas: 'silang' } },
  bintang: { label: 'kaki tunggal alas bintang', params: { modelKaki: 'pedestal', alas: 'bintang' } },
  plat: { label: 'kaki tunggal alas plat', params: { modelKaki: 'pedestal', alas: 'plat' } },
} satisfies Record<string, Opt>;

const none: Opt = { label: '', params: {} };
const rakBawah = (h = 20): Opt => ({ label: '+ rak bawah', params: { rakBawah: true, tinggiRakBawah: h } });
const kakiTengah: Opt = { label: '+ kaki tengah', params: { kakiTengah: true } };
const roda: Opt = { label: 'beroda', params: { roda: true, remRoda: true } };
const rakAtas = (tingkat: number, tinggi: number, dalam: number): Opt => ({
  label: tingkat > 1 ? `+ rak atas ${tingkat} susun` : '+ rak atas',
  params: { rakAtas: true, tingkatAtas: tingkat, tinggiRakAtas: tinggi, dalamRakAtas: dalam },
});
const kotak: Opt = { label: '', params: { bentukDaun: 'kotak' } };
const bulat: Opt = { label: ', daun bundar', params: { bentukDaun: 'bulat' } };

/** Aturan rangka meja (sama dengan pilihan yang muncul di editor) + batas kokoh */
export function mejaValid(p: Params): boolean {
  const m = p.modelKaki;
  const round = p.bentukDaun === 'bulat';
  const tegak = m === 'lurus' || m === 'melebar';
  const W = Number(p.panjang);
  const D = round ? W : Number(p.lebar);
  const H = Number(p.tinggi);
  if (p.kakiLipat) return !round && !p.rakBawah && !p.rakAtas && !p.roda && !p.kakiTengah;
  if ((p.rakBawah || p.roda) && !tegak) return false;
  if (p.rakAtas && (!tegak || round)) return false;
  if (p.kakiTengah && (m !== 'lurus' || round)) return false;
  if (p.rakBawah && p.palangKaki === false) return false;
  if (round && (m === 'u' || m === 'trestle' || m === 'hairpin' || m === 'x')) return false;
  if (m === 'pedestal') {
    if (Math.max(W, D) > 90) return false;
    if (Number(p.bentangAlas) < Math.max(W, D) * 0.5) return false;
  }
  if (!round && W > 140 && m === 'lurus' && !p.kakiTengah) return false;
  if (p.pipa === '20' && W > 100) return false;
  if (H > 95 && tegak && !p.palangKaki && !p.rakBawah) return false;
  if (p.rakBawah && Number(p.tinggiRakBawah) > H - 30) return false;
  if (p.roda && H > 95) return false;
  return true;
}

export const MEJA_CATALOG: GroupSpec[] = [
  {
    id: 'makan',
    name: 'Meja makan',
    desc: '2 – 8 orang · kotak / bundar',
    noun: 'Meja makan',
    base: { tinggi: 75, pipa: '40' },
    struct: [[K.lurus, K.melebar, K.x, K.u, K.trestle, K.hairpin, K.lurusPolos], [kotak, bulat], [none, kakiTengah, rakBawah(18)]],
    style: [
      sizes([
        ['4 orang', { panjang: 120, lebar: 75 }],
        ['6 orang', { panjang: 160, lebar: 85 }],
        ['2 orang', { panjang: 80, lebar: 75 }],
        ['8 orang', { panjang: 200, lebar: 90 }],
        ['persegi 100', { panjang: 100, lebar: 100 }],
      ]),
      FINISH,
    ],
    valid: (p) => mejaValid(p) && !(p.bentukDaun === 'bulat' && Number(p.panjang) > 120),
  },
  {
    id: 'kerja',
    name: 'Meja kerja / belajar',
    desc: 'kantor · kamar · laptop · rak buku',
    noun: 'Meja kerja',
    base: { tinggi: 75, pipa: '30', bentukDaun: 'kotak' },
    struct: [
      [K.lurus, K.hairpin, K.melebarTipis, K.x, K.u, K.trestle, K.lurusPolos],
      [none, rakAtas(2, 50, 22), rakBawah(15), rakAtas(1, 40, 28), roda],
    ],
    style: [
      sizes([
        ['120 × 60', { panjang: 120, lebar: 60 }],
        ['100 × 55', { panjang: 100, lebar: 55, pipa: '30' }],
        ['140 × 70', { panjang: 140, lebar: 70, pipa: '40' }],
        ['80 × 50 kecil', { panjang: 80, lebar: 50, pipa: '20' }],
      ]),
      FINISH,
    ],
    valid: mejaValid,
  },
  {
    id: 'akuarium',
    name: 'Meja akuarium',
    desc: 'kuat menahan tangki air · rak filter di bawah',
    noun: 'Meja akuarium',
    base: { pipa: '40', bentukDaun: 'kotak' },
    struct: [
      [K.lurus, K.melebarTipis, K.u, K.x, K.lurusPolos],
      [rakBawah(15), none, { label: '+ rak bawah tinggi', params: { rakBawah: true, tinggiRakBawah: 30 } }, kakiTengah],
    ],
    style: [
      sizes([
        ['tangki 60 cm', { panjang: 62, lebar: 32, tinggi: 75 }],
        ['tangki 80 cm', { panjang: 82, lebar: 42, tinggi: 75 }],
        ['tangki 100 cm', { panjang: 102, lebar: 47, tinggi: 75 }],
        ['tangki 120 cm', { panjang: 122, lebar: 52, tinggi: 80 }],
        ['tangki 150 cm', { panjang: 152, lebar: 55, tinggi: 80 }],
        ['rendah tangki 90 cm', { panjang: 92, lebar: 45, tinggi: 60 }],
      ]),
      [FINISH[3], FINISH[2], FINISH[0], FINISH[7], FINISH[1]],
    ],
    valid: (p) => mejaValid(p) && !(p.kakiTengah && Number(p.panjang) < 100),
  },
  {
    id: 'kopi',
    name: 'Meja kopi / tamu',
    desc: 'rendah, depan sofa · bundar / kotak',
    noun: 'Meja kopi',
    base: { pipa: '30' },
    struct: [[K.hairpin, K.lurus, K.x, K.u, K.melebar, K.plat, K.silang, K.trestle], [kotak, bulat], [none, rakBawah(12)]],
    style: [
      sizes([
        ['100 × 55', { panjang: 100, lebar: 55, tinggi: 45, bentangAlas: 60 }],
        ['90 × 50', { panjang: 90, lebar: 50, tinggi: 42, bentangAlas: 50 }],
        ['ø70', { panjang: 70, lebar: 70, tinggi: 45, bentangAlas: 45 }],
        ['120 × 60', { panjang: 120, lebar: 60, tinggi: 45, pipa: '40', bentangAlas: 60 }],
        ['60 × 60 kecil', { panjang: 60, lebar: 60, tinggi: 40, bentangAlas: 40, pipa: '20' }],
      ]),
      FINISH,
    ],
    valid: mejaValid,
  },
  {
    id: 'cafe',
    name: 'Meja cafe',
    desc: '2 – 4 orang · kaki tunggal / 4 kaki',
    noun: 'Meja cafe',
    base: { tinggi: 75, pipa: '40' },
    struct: [[K.silang, K.bintang, K.plat, K.melebar, K.lurus, K.hairpin, K.x, K.lurusPolos], [kotak, bulat]],
    style: [
      sizes([
        ['2 orang', { panjang: 60, lebar: 60, bentangAlas: 50 }],
        ['4 orang', { panjang: 80, lebar: 80, bentangAlas: 66 }],
        ['70 × 70', { panjang: 70, lebar: 70, bentangAlas: 56 }],
        ['2 orang memanjang', { panjang: 70, lebar: 50, bentangAlas: 50, pipa: '30' }],
      ]),
      FINISH,
    ],
    valid: mejaValid,
  },
  {
    id: 'bar',
    name: 'Meja bar tinggi',
    desc: 'tinggi 90 – 105 · berdiri / stool',
    noun: 'Meja bar',
    base: { pipa: '40' },
    struct: [
      [K.silang, K.bintang, K.plat, K.lurus, K.melebarTipis, K.u, K.trestle],
      [kotak, bulat],
      [none, { label: '+ pijakan', params: { pijakan: true } }, rakBawah(25)],
    ],
    style: [
      sizes([
        ['tinggi 105', { panjang: 70, lebar: 70, tinggi: 105, bentangAlas: 60 }],
        ['tinggi 90', { panjang: 80, lebar: 60, tinggi: 90, bentangAlas: 56 }],
        ['panjang 160', { panjang: 160, lebar: 50, tinggi: 105, kakiTengah: true, bentangAlas: 60 }],
        ['ø60', { panjang: 60, lebar: 60, tinggi: 105, bentangAlas: 50 }],
      ]),
      FINISH,
    ],
    valid: (p) => mejaValid(p) && !(p.pijakan && p.modelKaki !== 'pedestal' && p.modelKaki !== 'u'),
  },
  {
    id: 'komunal',
    name: 'Meja komunal panjang',
    desc: '200 – 240 cm · cafe · coworking',
    noun: 'Meja komunal',
    base: { tinggi: 75, pipa: '40', bentukDaun: 'kotak' },
    struct: [[K.u, K.trestle, K.x, K.lurus, K.hairpin, K.melebarTipis], [none, kakiTengah, rakBawah(20)]],
    style: [
      sizes([
        ['240 × 90', { panjang: 240, lebar: 90 }],
        ['200 × 80', { panjang: 200, lebar: 80 }],
        ['220 × 100', { panjang: 220, lebar: 100 }],
        ['bar 220 × 60', { panjang: 220, lebar: 60, tinggi: 105 }],
      ]),
      FINISH,
    ],
    valid: mejaValid,
  },
  {
    id: 'samping',
    name: 'Meja samping / nakas',
    desc: 'samping sofa · samping ranjang',
    noun: 'Meja samping',
    base: { pipa: '20' },
    struct: [[K.lurus, K.hairpin, K.plat, K.melebar, K.silang, K.x, K.u], [kotak, bulat], [none, rakBawah(15), { label: '+ rak tengah', params: { rakBawah: true, tinggiRakBawah: 28 } }]],
    style: [
      sizes([
        ['45 × 45', { panjang: 45, lebar: 45, tinggi: 55, bentangAlas: 36 }],
        ['ø40', { panjang: 40, lebar: 40, tinggi: 55, bentangAlas: 35 }],
        ['50 × 40', { panjang: 50, lebar: 40, tinggi: 60, bentangAlas: 36 }],
        ['60 × 35 panjang', { panjang: 60, lebar: 35, tinggi: 60, bentangAlas: 35 }],
      ]),
      FINISH,
    ],
    valid: mejaValid,
  },
  {
    id: 'tv',
    name: 'Meja TV / konsol',
    desc: 'rendah memanjang · rak bawah',
    noun: 'Meja TV',
    base: { pipa: '30', bentukDaun: 'kotak' },
    struct: [[K.lurus, K.hairpin, K.u, K.x, K.melebarTipis, K.trestle, K.lurusPolos], [rakBawah(12), none, kakiTengah, { label: '+ rak bawah tinggi', params: { rakBawah: true, tinggiRakBawah: 25 } }]],
    style: [
      sizes([
        ['TV 120', { panjang: 120, lebar: 40, tinggi: 50, pipa: '30' }],
        ['TV 150', { panjang: 150, lebar: 40, tinggi: 50, pipa: '40' }],
        ['konsol 100 × 35', { panjang: 100, lebar: 35, tinggi: 78 }],
        ['TV 180', { panjang: 180, lebar: 45, tinggi: 50, pipa: '40' }],
      ]),
      FINISH,
    ],
    valid: (p) => mejaValid(p) && !(p.kakiTengah && Number(p.panjang) <= 140),
  },
  {
    id: 'workshop',
    name: 'Meja workshop / bengkel',
    desc: 'kuat · rak perkakas · beroda',
    noun: 'Meja workshop',
    base: { pipa: '40', bentukDaun: 'kotak', papan: 'multiplek', warna: '#6b7078' },
    struct: [
      [K.lurus, K.melebarTipis, K.u, K.trestle, K.lurusPolos],
      [rakBawah(20), none, roda, rakAtas(1, 45, 30), rakAtas(2, 60, 25)],
      [none, kakiTengah],
    ],
    style: [
      sizes([
        ['150 × 70', { panjang: 150, lebar: 70, tinggi: 85 }],
        ['120 × 60', { panjang: 120, lebar: 60, tinggi: 85 }],
        ['180 × 75', { panjang: 180, lebar: 75, tinggi: 90 }],
        ['100 × 60', { panjang: 100, lebar: 60, tinggi: 90 }],
      ]),
      [FINISH[2], FINISH[0], FINISH[3], { label: 'abu · multiplek', params: { warna: '#6b7078', papan: 'multiplek' } }],
    ],
    valid: (p) => mejaValid(p) && !(p.kakiTengah && Number(p.panjang) <= 140) && !(p.roda && p.rakAtas),
  },
  {
    id: 'lipat',
    name: 'Meja lipat / serbaguna',
    desc: 'bazar · lesehan · event · kemah',
    noun: 'Meja lipat',
    base: { kakiLipat: true, bentukDaun: 'kotak', pipa: '30' },
    struct: [[none]],
    style: [
      sizes([
        ['120 × 60', { panjang: 120, lebar: 60, tinggi: 75 }],
        ['180 × 75 bazar', { panjang: 180, lebar: 75, tinggi: 75 }],
        ['lesehan 80 × 50', { panjang: 80, lebar: 50, tinggi: 35, pipa: '20' }],
        ['lesehan 100 × 60', { panjang: 100, lebar: 60, tinggi: 33, pipa: '20' }],
        ['150 × 70', { panjang: 150, lebar: 70, tinggi: 75 }],
        ['kemah 90 × 60', { panjang: 90, lebar: 60, tinggi: 70, pipa: '20' }],
        ['bar 120 × 50', { panjang: 120, lebar: 50, tinggi: 100 }],
        ['anak 70 × 50', { panjang: 70, lebar: 50, tinggi: 52, pipa: '20' }],
        ['160 × 80', { panjang: 160, lebar: 80, tinggi: 75 }],
        ['jualan 200 × 75', { panjang: 200, lebar: 75, tinggi: 80, pipa: '40' }],
      ]),
      [FINISH[0], FINISH[7], FINISH[2], FINISH[3]],
    ],
    valid: mejaValid,
  },
];
