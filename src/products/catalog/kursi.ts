import { Params } from '../types';
import { FINISH, GroupSpec, Opt, sizes } from './gen';

/**
 * Kursi, stool & bangku rangka las: kaki tegak / melebar, sandaran tegak / miring, sandaran tangan,
 * dudukan papan / bilah, stool bundar / kotak + ring pijakan, bangku dengan kaki tengah / rak / meja samping.
 */
const none: Opt = { label: '', params: {} };
const tegak: Opt = { label: '', params: { sudutKaki: 0 } };
const melebar: Opt = { label: 'kaki melebar', params: { sudutKaki: 6 } };
const melebarTipis: Opt = { label: 'kaki agak melebar', params: { sudutKaki: 3 } };
const sandar = (label: string, tinggi: number, miring: number): Opt => ({ label, params: { sandaran: true, tinggiSandaran: tinggi, miringSandaran: miring } });
const papan: Opt = { label: '', params: { dudukan: 'papan' } };
const bilah: Opt = { label: 'dudukan bilah', params: { dudukan: 'bilah' } };
const tangan: Opt = { label: '+ sandaran tangan', params: { sandaranTangan: true } };
const tanpaPalang: Opt = { label: 'tanpa palang', params: { palangKaki: false } };

/** Batas kokoh & nyaman (sama dengan peringatan di editor) */
export function kursiValid(p: Params): boolean {
  const j = p.jenis;
  const Hs = Number(p.tinggiDudukan);
  const W = Number(p.lebar);
  if (j === 'kursi' && W > 60) return false;
  if (j === 'bangku' && W > 120 && !p.kakiTengah) return false;
  if (j === 'stool' && Hs > 60 && !p.pijakan) return false;
  if (j === 'stool' && p.pijakan) {
    const gap = Hs - Number(p.tinggiPijakan);
    if (gap < 40 || gap > 52) return false;
  }
  if (p.sandaran && !p.mejaSamping && Number(p.tinggiSandaran) - Hs < (j === 'stool' ? 22 : 30)) return false;
  if (p.sandaran && Number(p.miringSandaran) > 18) return false;
  if (p.sandaranTangan && (j === 'stool' || !p.sandaran)) return false;
  if (p.bentukDudukan === 'bulat' && (j !== 'stool' || p.dudukan === 'bilah' || p.sandaran)) return false;
  if (p.mejaSamping && (j !== 'bangku' || p.sandaran || p.rakBawah)) return false;
  if (p.rakBawah && j !== 'bangku') return false;
  return true;
}

const stool = (Hs: number, pijakan: number) => ({ jenis: 'stool', tinggiDudukan: Hs, pijakan: true, tinggiPijakan: pijakan });

export const KURSI_CATALOG: GroupSpec[] = [
  {
    id: 'kursi-makan',
    name: 'Kursi makan',
    desc: 'sandaran tegak / miring · papan / bilah',
    noun: 'Kursi makan',
    base: { jenis: 'kursi', lebar: 45, dalam: 42, tinggiDudukan: 45, sandaran: true, sandaranTangan: false, pipa: '20', palangKaki: true },
    struct: [
      [tegak, melebarTipis, melebar],
      [sandar('sandaran tegak', 85, 0), sandar('sandaran miring', 85, 10), sandar('sandaran rendah', 78, 8), sandar('sandaran tinggi', 95, 12)],
      [papan, bilah],
    ],
    style: [sizes([['standar', {}], ['lebar 48', { lebar: 48, dalam: 45 }], ['ramping 42', { lebar: 42, dalam: 40 }]]), FINISH],
    valid: kursiValid,
  },
  {
    id: 'kursi-cafe',
    name: 'Kursi cafe',
    desc: 'ramping · tumpuk · indoor / teras',
    noun: 'Kursi cafe',
    base: { jenis: 'kursi', lebar: 44, dalam: 42, tinggiDudukan: 45, sandaran: true, pipa: '20' },
    struct: [
      [melebar, tegak, melebarTipis, { label: 'kaki sangat melebar', params: { sudutKaki: 9 } }],
      [sandar('sandaran pendek', 75, 10), sandar('sandaran miring', 80, 14), sandar('sandaran tegak', 80, 0)],
      [papan, bilah],
      [none, tanpaPalang],
    ],
    style: [sizes([['standar', {}], ['kecil 40', { lebar: 40, dalam: 40 }], ['lebar 47', { lebar: 47, dalam: 44 }]]), FINISH],
    valid: kursiValid,
  },
  {
    id: 'kursi-tangan',
    name: 'Kursi bersandaran tangan',
    desc: 'kerja · teras · santai',
    noun: 'Kursi',
    base: { jenis: 'kursi', sandaran: true, sandaranTangan: true, pipa: '20', palangKaki: true },
    struct: [
      [sandar('kerja sandaran tinggi', 100, 8), sandar('santai sandaran miring', 85, 15), sandar('makan sandaran tegak', 85, 0), sandar('teras', 80, 12)],
      [tegak, melebarTipis, melebar],
      [papan, bilah],
    ],
    style: [
      sizes([
        ['standar', { lebar: 50, dalam: 45, tinggiDudukan: 45 }],
        ['santai rendah', { lebar: 55, dalam: 50, tinggiDudukan: 40 }],
        ['ramping', { lebar: 47, dalam: 43, tinggiDudukan: 46 }],
      ]),
      FINISH,
    ],
    valid: kursiValid,
  },
  {
    id: 'stool-bar',
    name: 'Stool bar (tinggi 75)',
    desc: 'meja bar 100 – 110 cm · ring pijakan',
    noun: 'Stool bar',
    base: { ...stool(75, 30), pipa: '20', dudukan: 'papan', sandaranTangan: false },
    struct: [
      [melebar, tegak, melebarTipis, { label: 'kaki sangat melebar', params: { sudutKaki: 9 } }],
      [{ label: 'dudukan bundar', params: { bentukDudukan: 'bulat', sandaran: false } }, { label: 'dudukan kotak', params: { bentukDudukan: 'kotak', sandaran: false } }, { label: 'bersandaran', params: { bentukDudukan: 'kotak', ...sandar('', 102, 6).params } }, { label: 'sandaran rendah', params: { bentukDudukan: 'kotak', ...sandar('', 97, 4).params } }],
      [none, { label: 'dudukan bilah', params: { dudukan: 'bilah' } }],
    ],
    style: [sizes([['ø/sisi 35', { lebar: 35, dalam: 35 }], ['sisi 40', { lebar: 40, dalam: 38 }], ['pijakan rendah', { lebar: 36, dalam: 36, tinggiPijakan: 25 }]]), FINISH],
    valid: kursiValid,
  },
  {
    id: 'stool-counter',
    name: 'Stool counter (tinggi 65)',
    desc: 'meja dapur / counter 90 cm',
    noun: 'Stool counter',
    base: { ...stool(65, 20), pipa: '20', dudukan: 'papan', sandaranTangan: false },
    struct: [
      [tegak, melebar, melebarTipis],
      [{ label: 'dudukan bundar', params: { bentukDudukan: 'bulat', sandaran: false } }, { label: 'dudukan kotak', params: { bentukDudukan: 'kotak', sandaran: false } }, { label: 'bersandaran', params: { bentukDudukan: 'kotak', ...sandar('', 92, 6).params } }, { label: 'sandaran tegak', params: { bentukDudukan: 'kotak', ...sandar('', 90, 0).params } }],
      [none, { label: 'dudukan bilah', params: { dudukan: 'bilah' } }],
    ],
    style: [sizes([['sisi 35', { lebar: 35, dalam: 35 }], ['sisi 40', { lebar: 40, dalam: 38 }], ['pijakan tinggi', { lebar: 36, dalam: 36, tinggiPijakan: 23 }]]), FINISH],
    valid: kursiValid,
  },
  {
    id: 'stool-pendek',
    name: 'Stool pendek / dingklik',
    desc: 'rias · dapur · teras · anak',
    noun: 'Stool pendek',
    base: { jenis: 'stool', pijakan: false, sandaran: false, pipa: '20', dudukan: 'papan' },
    struct: [
      [tegak, melebar, melebarTipis, { label: 'kaki sangat melebar', params: { sudutKaki: 10 } }],
      [{ label: 'bundar', params: { bentukDudukan: 'bulat' } }, { label: 'kotak', params: { bentukDudukan: 'kotak' } }, { label: 'bilah', params: { bentukDudukan: 'kotak', dudukan: 'bilah' } }],
    ],
    style: [
      sizes([
        ['tinggi 45', { tinggiDudukan: 45, lebar: 35, dalam: 35 }],
        ['tinggi 30', { tinggiDudukan: 30, lebar: 30, dalam: 30 }],
        ['tinggi 55', { tinggiDudukan: 55, lebar: 35, dalam: 35 }],
        ['dingklik 25', { tinggiDudukan: 25, lebar: 32, dalam: 28 }],
      ]),
      FINISH,
    ],
    valid: kursiValid,
  },
  {
    id: 'bangku-panjang',
    name: 'Bangku panjang',
    desc: 'ruang makan · lorong · ruang tunggu',
    noun: 'Bangku',
    base: { jenis: 'bangku', sandaran: false, mejaSamping: false, rakBawah: false, pipa: '30', dalam: 35, tinggiDudukan: 45 },
    struct: [
      [tegak, melebarTipis, melebar],
      [papan, bilah],
      [{ label: '', params: { palangKaki: true } }, tanpaPalang],
      [none, { label: '+ kaki tengah', params: { kakiTengah: true } }],
    ],
    style: [
      sizes([
        ['120 cm', { lebar: 120 }],
        ['150 cm', { lebar: 150, kakiTengah: true }],
        ['90 cm', { lebar: 90, pipa: '20' }],
        ['180 cm', { lebar: 180, kakiTengah: true, pipa: '40' }],
        ['meja makan 140', { lebar: 140, dalam: 32, kakiTengah: true }],
      ]),
      FINISH,
    ],
    valid: kursiValid,
  },
  {
    id: 'bangku-taman',
    name: 'Bangku taman / teras',
    desc: 'bersandaran · bilah · outdoor',
    noun: 'Bangku taman',
    base: { jenis: 'bangku', mejaSamping: false, rakBawah: false, pipa: '30', dalam: 45, tinggiDudukan: 45, kakiTengah: true, palangKaki: true },
    struct: [
      [tegak, melebarTipis, melebar],
      [bilah, papan],
      [sandar('bersandaran', 85, 12), sandar('sandaran tegak', 85, 0), sandar('sandaran tinggi', 95, 15), { label: 'tanpa sandaran', params: { sandaran: false } }],
      [none, tangan],
    ],
    style: [sizes([['150 cm', { lebar: 150 }], ['120 cm', { lebar: 120 }], ['180 cm', { lebar: 180, pipa: '40' }]]), [FINISH[4], FINISH[0], FINISH[5], FINISH[1], FINISH[2]]],
    valid: kursiValid,
  },
  {
    id: 'bangku-sepatu',
    name: 'Bangku sepatu / rak duduk',
    desc: 'teras · pintu masuk · rak di bawah',
    noun: 'Bangku sepatu',
    base: { jenis: 'bangku', sandaran: false, mejaSamping: false, rakBawah: true, palangKaki: false, pipa: '30', dalam: 35, tinggiDudukan: 45 },
    struct: [[tegak, melebarTipis], [papan, bilah], [none, { label: '+ kaki tengah', params: { kakiTengah: true } }], [none, sandar('bersandaran', 80, 8)]],
    style: [
      sizes([
        ['80 cm', { lebar: 80 }],
        ['100 cm', { lebar: 100 }],
        ['120 cm', { lebar: 120 }],
        ['150 cm', { lebar: 150, kakiTengah: true }],
        ['60 cm anak', { lebar: 60, tinggiDudukan: 38, dalam: 30, pipa: '20' }],
      ]),
      FINISH,
    ],
    valid: (p) => kursiValid(p) && !(p.kakiTengah && Number(p.lebar) < 100),
  },
  {
    id: 'bangku-trotoar',
    name: 'Bangku cafe + meja kecil',
    desc: 'bersandaran · meja kecil bertiang di atas dudukan · depan toko',
    noun: 'Bangku cafe',
    base: { jenis: 'bangku', mejaSamping: false, rakBawah: false, pipa: '30', dalam: 45, tinggiDudukan: 45, kakiTengah: true, palangKaki: true, lebarMejaDepan: 45, tinggiMejaDepan: 72 },
    struct: [
      [{ label: '+ 2 meja kecil', params: { mejaDepan: 2 } }, { label: '+ 1 meja kecil', params: { mejaDepan: 1 } }, { label: '+ 3 meja kecil', params: { mejaDepan: 3 } }],
      [sandar('bersandaran', 90, 10), sandar('sandaran tegak', 88, 0), { label: 'tanpa sandaran', params: { sandaran: false } }],
      [papan, bilah],
    ],
    style: [
      sizes([
        ['180 cm', { lebar: 180, pipa: '40' }],
        ['150 cm', { lebar: 150 }],
        ['200 cm', { lebar: 200, pipa: '40' }],
        ['120 cm', { lebar: 120, lebarMejaDepan: 40 }],
      ]),
      FINISH,
    ],
    valid: (p) => kursiValid(p) && Number(p.lebar) / Number(p.mejaDepan) >= Number(p.lebarMejaDepan) + 20,
  },
  {
    id: 'bangku-meja',
    name: 'Bangku + meja samping',
    desc: 'tempat duduk + taruh minum · lobi · taman',
    noun: 'Bangku + meja samping',
    base: { jenis: 'bangku', sandaran: false, rakBawah: false, mejaSamping: true, pipa: '30', dalam: 40, tinggiDudukan: 45, kakiTengah: true, palangKaki: true },
    struct: [[tegak, melebarTipis, melebar], [bilah, papan]],
    style: [
      sizes([
        ['150 cm, meja ø40', { lebar: 150, diameterMeja: 40, tinggiMeja: 60 }],
        ['120 cm, meja ø35', { lebar: 120, diameterMeja: 35, tinggiMeja: 58 }],
        ['180 cm, meja ø50', { lebar: 180, diameterMeja: 50, tinggiMeja: 62, pipa: '40' }],
        ['100 cm, meja ø30', { lebar: 100, diameterMeja: 30, tinggiMeja: 55, kakiTengah: false }],
      ]),
      FINISH,
    ],
    valid: kursiValid,
  },
];
