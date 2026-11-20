import { FINISH, GroupSpec, Opt, sizes } from './gen';

/**
 * Meja + bangku menyatu, meja dinding, meja bar / kasir, booth / sofa, papan menu, pembatas tanaman, dipan.
 * Beberapa sub-kategori diambil dari contoh desain pengguna (Pinterest): meja taman rangka trapesium,
 * meja sekolah bersandaran, piknik rangka kotak, sofa + meja bundar tiang / lengan L.
 */
const none: Opt = { label: '', params: {} };
const n = (key: string, values: [string, number | string | boolean][]): Opt[] => values.map(([label, v]) => ({ label, params: { [key]: v } }));
const JOK: Opt[] = [
  { label: 'jok hijau zaitun', params: { warnaJok: '#3f4a3c' } },
  { label: 'jok terakota', params: { warnaJok: '#7a3b2a' } },
  { label: 'jok hitam', params: { warnaJok: '#2b2d31' } },
  { label: 'jok krem', params: { warnaJok: '#b49a76' } },
  { label: 'jok biru', params: { warnaJok: '#355c7d' } },
];

export const MEJA_PIKNIK_CATALOG: GroupSpec[] = [
  {
    id: 'piknik-taman',
    name: 'Meja piknik 2 bangku',
    desc: 'taman · villa · cafe outdoor',
    noun: 'Meja piknik',
    base: { tinggiMeja: 75, tinggiBangku: 45 },
    struct: [
      [{ label: 'rangka A', params: { model: 'a' } }, { label: 'rangka kotak', params: { model: 'kotak' } }],
      n('jarakBangku', [['', 15], ['bangku rapat', 8], ['bangku lega', 22]]),
      n('lebarBangku', [['', 30], ['bangku lebar', 36], ['bangku ramping', 25]]),
    ],
    style: [
      sizes([
        ['4 orang', { panjang: 150, lebarMeja: 70, pipa: '40' }],
        ['6 orang', { panjang: 200, lebarMeja: 75, pipa: '40' }],
        ['8 orang', { panjang: 240, lebarMeja: 80, pipa: '40' }],
        ['2 orang', { panjang: 110, lebarMeja: 60, pipa: '30' }],
      ]),
      [FINISH[0], FINISH[4], FINISH[5], FINISH[1], FINISH[2]],
    ],
  },
  {
    id: 'meja-sekolah',
    name: 'Meja sekolah / bangku menyatu',
    desc: 'meja + bangku bersandaran · sekolah · kursus · kantin',
    noun: 'Meja sekolah',
    base: { model: 'satu-sisi', tinggiMeja: 72, tinggiBangku: 43, jarakBangku: 6, lebarBangku: 28 },
    struct: [
      [{ label: 'bersandaran', params: { sandaranBangku: true, tinggiSandaranBangku: 78 } }, { label: 'tanpa sandaran', params: { sandaranBangku: false } }, { label: 'sandaran tinggi', params: { sandaranBangku: true, tinggiSandaranBangku: 85 } }],
      n('lebarMeja', [['', 40], ['meja lebar', 50], ['meja sempit', 35]]),
      n('jarakBangku', [['', 6], ['bangku lebih jauh', 14]]),
    ],
    style: [
      sizes([
        ['2 siswa 110', { panjang: 110, pipa: '30' }],
        ['1 siswa 70', { panjang: 70, pipa: '30' }],
        ['3 siswa 150', { panjang: 150, pipa: '30' }],
        ['SMP/SMA 120', { panjang: 120, tinggiMeja: 75, tinggiBangku: 45, pipa: '30' }],
      ]),
      [{ label: 'hijau toska · multiplek', params: { warna: '#2f4a3a', papan: 'multiplek' } }, FINISH[0], FINISH[2], FINISH[7], { label: 'hitam · multiplek', params: { warna: '#1f2226', papan: 'multiplek' } }],
    ],
  },
  {
    id: 'meja-taman-modern',
    name: 'Meja taman rangka miring',
    desc: 'rangka trapesium satu sisi · rooftop · teras',
    noun: 'Meja taman',
    base: { model: 'trapesium', tinggiMeja: 75, tinggiBangku: 45 },
    struct: [
      n('lebarMeja', [['', 45], ['meja lebar', 60], ['meja sempit', 35]]),
      n('jarakBangku', [['', 8], ['bangku rapat', 3], ['bangku lega', 15]]),
      n('lebarBangku', [['', 35], ['bangku lebar', 40], ['bangku ramping', 30]]),
    ],
    style: [
      sizes([
        ['180 cm', { panjang: 180, pipa: '40' }],
        ['150 cm', { panjang: 150, pipa: '40' }],
        ['240 cm', { panjang: 240, pipa: '40' }],
        ['120 cm', { panjang: 120, pipa: '30' }],
      ]),
      [{ label: 'putih · kayu', params: { warna: '#e9e7e1', papan: 'kayu' } }, FINISH[0], FINISH[2], FINISH[4]],
    ],
  },
];

export const MEJA_DINDING_CATALOG: GroupSpec[] = [
  {
    id: 'dinding-lipat',
    name: 'Meja dinding lipat',
    desc: 'dapur sempit · kamar kost · balkon',
    noun: 'Meja dinding lipat',
    base: { lipat: true },
    struct: [n('jumlahEngsel', [['siku lipat', 'siku'], ['engsel piano', 'piano']]), n('pipa', [['', '20'], ['pipa 30', '30']])],
    style: [
      sizes([
        ['80 × 40', { panjang: 80, dalam: 40, tinggi: 75 }],
        ['60 × 35', { panjang: 60, dalam: 35, tinggi: 75 }],
        ['100 × 45', { panjang: 100, dalam: 45, tinggi: 75 }],
        ['120 × 40', { panjang: 120, dalam: 40, tinggi: 75 }],
        ['bar 100 × 35', { panjang: 100, dalam: 35, tinggi: 105 }],
      ]),
      FINISH,
    ],
  },
  {
    id: 'dinding-bar',
    name: 'Meja bar dinding / jendela',
    desc: 'menghadap jendela · cafe · tinggi 100 – 105',
    noun: 'Meja bar dinding',
    base: { tinggi: 105 },
    struct: [[{ label: 'tetap', params: { lipat: false } }, { label: 'lipat', params: { lipat: true, jumlahEngsel: 'siku' } }], n('pipa', [['', '20'], ['pipa 30', '30']])],
    style: [
      sizes([
        ['150 × 40', { panjang: 150, dalam: 40 }],
        ['120 × 35', { panjang: 120, dalam: 35 }],
        ['160 × 45', { panjang: 160, dalam: 45 }],
        ['90 × 35', { panjang: 90, dalam: 35 }],
        ['meja 75, 140 × 45', { panjang: 140, dalam: 45, tinggi: 75 }],
      ]),
      FINISH,
    ],
  },
  {
    id: 'dinding-belajar',
    name: 'Meja belajar dinding',
    desc: 'hemat tempat · kamar anak · laptop',
    noun: 'Meja belajar dinding',
    base: { tinggi: 75 },
    struct: [[{ label: 'lipat', params: { lipat: true, jumlahEngsel: 'siku' } }, { label: 'tetap', params: { lipat: false } }, { label: 'lipat engsel piano', params: { lipat: true, jumlahEngsel: 'piano' } }], n('pipa', [['', '20'], ['pipa 30', '30']])],
    style: [
      sizes([
        ['100 × 45', { panjang: 100, dalam: 45 }],
        ['80 × 40', { panjang: 80, dalam: 40 }],
        ['120 × 50', { panjang: 120, dalam: 50 }],
        ['anak 80 × 40', { panjang: 80, dalam: 40, tinggi: 62 }],
      ]),
      FINISH,
    ],
  },
];

export const MEJA_BAR_CATALOG: GroupSpec[] = [
  {
    id: 'counter-barista',
    name: 'Counter barista',
    desc: 'dua tingkat · meja tamu di depan',
    noun: 'Counter barista',
    base: { mejaTamu: true, tinggi: 90, tinggiTamu: 110, lebarTamu: 35, pipa: '40' },
    struct: [
      [{ label: '', params: { panelDepan: true } }, { label: 'tanpa panel', params: { panelDepan: false } }],
      [{ label: '+ pijakan', params: { pijakanKaki: true } }, { label: '', params: { pijakanKaki: false } }],
      n('rakBawah', [['', 1], ['2 rak bawah', 2], ['tanpa rak', 0], ['3 rak bawah', 3]]),
    ],
    style: [sizes([['180 cm', { panjang: 180 }], ['240 cm', { panjang: 240, dalam: 65 }], ['120 cm', { panjang: 120 }], ['300 cm', { panjang: 300, dalam: 70 }]]), FINISH],
  },
  {
    id: 'meja-kasir',
    name: 'Meja kasir',
    desc: 'toko · warung · minimarket',
    noun: 'Meja kasir',
    base: { mejaTamu: false, overhang: 0, tinggi: 90, pipa: '40' },
    struct: [
      [{ label: '', params: { panelDepan: true } }, { label: 'terbuka', params: { panelDepan: false } }],
      n('rakBawah', [['', 1], ['2 rak', 2], ['3 rak', 3], ['tanpa rak', 0]]),
      [none, { label: 'dua tingkat', params: { mejaTamu: true, tinggiTamu: 105, lebarTamu: 30 } }],
    ],
    style: [
      sizes([
        ['120 × 55', { panjang: 120, dalam: 55 }],
        ['150 × 60', { panjang: 150, dalam: 60 }],
        ['100 × 50', { panjang: 100, dalam: 50 }],
        ['180 × 60', { panjang: 180, dalam: 60 }],
      ]),
      FINISH,
    ],
  },
  {
    id: 'bar-dapur',
    name: 'Meja bar dapur / island',
    desc: 'satu tingkat · daun menjorok untuk stool',
    noun: 'Meja bar dapur',
    base: { mejaTamu: false, tinggi: 90, pipa: '40' },
    struct: [
      n('overhang', [['menjorok 25', 25], ['menjorok 15', 15], ['menjorok 30', 30], ['tanpa menjorok', 0]]),
      [{ label: '', params: { panelDepan: true } }, { label: 'tanpa panel', params: { panelDepan: false } }],
      [{ label: '+ pijakan', params: { pijakanKaki: true } }, { label: '', params: { pijakanKaki: false } }],
    ],
    style: [
      sizes([
        ['150 × 60', { panjang: 150, dalam: 60, rakBawah: 1 }],
        ['tinggi 105, 180 × 55', { panjang: 180, dalam: 55, tinggi: 105, rakBawah: 1 }],
        ['120 × 60', { panjang: 120, dalam: 60, rakBawah: 2 }],
        ['200 × 70', { panjang: 200, dalam: 70, rakBawah: 1 }],
      ]),
      FINISH,
    ],
  },
  {
    id: 'meja-workstation',
    name: 'Meja kerja dapur / workstation',
    desc: 'terbuka · rak bawah bertingkat',
    noun: 'Workstation',
    base: { mejaTamu: false, panelDepan: false, pijakanKaki: false, overhang: 0, pipa: '40', papan: 'hpl' },
    struct: [n('rakBawah', [['1 rak', 1], ['2 rak', 2], ['3 rak', 3], ['tanpa rak', 0]]), n('tinggi', [['', 85], ['tinggi 90', 90], ['rendah 80', 80]])],
    style: [
      sizes([
        ['150 × 60', { panjang: 150, dalam: 60 }],
        ['120 × 60', { panjang: 120, dalam: 60 }],
        ['180 × 70', { panjang: 180, dalam: 70 }],
        ['100 × 50', { panjang: 100, dalam: 50 }],
      ]),
      [FINISH[2], FINISH[3], FINISH[0], { label: 'putih · HPL', params: { warna: '#e9e7e1', papan: 'hpl' } }],
    ],
  },
];

export const BOOTH_CATALOG: GroupSpec[] = [
  {
    id: 'booth-tunggal',
    name: 'Booth tunggal',
    desc: 'menempel tembok · sofa cafe',
    noun: 'Booth tunggal',
    base: { sisi: 'tunggal', busa: true, mejaBooth: 'none' },
    struct: [
      n('miringSandaran', [['', 10], ['sandaran tegak', 0], ['sandaran santai', 14]]),
      n('tinggiSandaran', [['', 100], ['sandaran rendah', 88], ['sandaran tinggi', 115], ['privat', 125]]),
    ],
    style: [
      sizes([
        ['2 orang', { panjang: 120, pipa: '30' }],
        ['3 orang', { panjang: 180, pipa: '30' }],
        ['sepanjang tembok 240', { panjang: 240, pipa: '30' }],
        ['1 orang', { panjang: 70, pipa: '30' }],
      ]),
      JOK,
    ],
  },
  {
    id: 'booth-ganda',
    name: 'Booth punggung-ke-punggung',
    desc: 'tengah ruangan · dua sisi',
    noun: 'Booth ganda',
    base: { sisi: 'ganda', busa: true, mejaBooth: 'none' },
    struct: [
      n('tinggiSandaran', [['', 107], ['privat tinggi', 122], ['sandaran rendah', 92], ['sangat tinggi', 135]]),
      n('miringSandaran', [['', 10], ['sandaran tegak', 0], ['sandaran santai', 13]]),
    ],
    style: [sizes([['2 + 2 orang', { panjang: 120, pipa: '30' }], ['3 + 3 orang', { panjang: 180, pipa: '30' }], ['150 cm', { panjang: 150, pipa: '30' }]]), JOK],
  },
  {
    id: 'sofa-meja',
    name: 'Sofa + meja bundar menyatu',
    desc: 'meja bertiang tegak / lengan L menempel sofa',
    noun: 'Sofa',
    base: { sisi: 'tunggal', busa: true, miringSandaran: 8, tinggiSandaran: 90 },
    struct: [
      [{ label: '+ meja lengan L', params: { mejaBooth: 'lengan' } }, { label: '+ meja tiang tegak', params: { mejaBooth: 'tiang' } }],
      n('tinggiMejaBooth', [['santai', 65], ['makan', 75], ['rendah', 58]]),
      n('diameterMejaBooth', [['', 50], ['meja ø40', 40], ['meja ø60', 60]]),
    ],
    style: [
      sizes([
        ['240 cm, 3 meja', { panjang: 240, jumlahMejaBooth: 3, pipa: '30' }],
        ['180 cm, 2 meja', { panjang: 180, jumlahMejaBooth: 2, pipa: '30' }],
        ['120 cm, 1 meja', { panjang: 120, jumlahMejaBooth: 1, pipa: '30' }],
        ['300 cm, 4 meja', { panjang: 300, jumlahMejaBooth: 4, pipa: '30' }],
      ]),
      [{ label: 'jok cokelat karamel', params: { warnaJok: '#b49a76' } }, { label: 'jok hitam', params: { warnaJok: '#2b2d31' } }, ...JOK.slice(0, 2), JOK[4]],
    ],
  },
  {
    id: 'bangku-sofa',
    name: 'Bangku panjang tanpa busa',
    desc: 'rangka booth, dudukan papan · kantin · food court',
    noun: 'Bangku booth',
    base: { sisi: 'tunggal', busa: false, mejaBooth: 'none' },
    struct: [
      [{ label: '', params: { sisi: 'tunggal' } }, { label: 'dua sisi', params: { sisi: 'ganda' } }],
      n('miringSandaran', [['', 8], ['sandaran tegak', 0], ['sandaran santai', 13]]),
      n('tinggiSandaran', [['', 90], ['sandaran tinggi', 110]]),
    ],
    style: [sizes([['150 cm', { panjang: 150, pipa: '30' }], ['200 cm', { panjang: 200, pipa: '30' }], ['120 cm', { panjang: 120, pipa: '30' }]]), FINISH],
  },
];

export const PAPAN_MENU_CATALOG: GroupSpec[] = [
  {
    id: 'menu-cafe',
    name: 'Papan menu cafe',
    desc: 'A-frame · depan pintu · kapur / poster',
    noun: 'Papan menu',
    base: {},
    struct: [[{ label: 'dua sisi', params: { duaSisi: true } }, { label: 'satu sisi', params: { duaSisi: false } }], n('sudut', [['', 15], ['lebih tegak', 12], ['lebih lebar', 20]])],
    style: [
      sizes([
        ['60 × 90', { lebar: 60, tinggiMuka: 90, tinggi: 105 }],
        ['50 × 70', { lebar: 50, tinggiMuka: 70, tinggi: 85 }],
        ['70 × 100', { lebar: 70, tinggiMuka: 100, tinggi: 118 }],
        ['45 × 60 meja', { lebar: 45, tinggiMuka: 60, tinggi: 75 }],
      ]),
      FINISH,
    ],
  },
  {
    id: 'menu-promo',
    name: 'Papan promo / penunjuk',
    desc: 'toko · event · parkir · arah jalan',
    noun: 'Papan promo',
    base: {},
    struct: [[{ label: 'dua sisi', params: { duaSisi: true } }, { label: 'satu sisi', params: { duaSisi: false } }], n('sudut', [['', 14], ['sangat stabil', 22], ['ramping', 12]])],
    style: [
      sizes([
        ['80 × 100', { lebar: 80, tinggiMuka: 100, tinggi: 120 }],
        ['90 × 60 lebar', { lebar: 90, tinggiMuka: 60, tinggi: 90 }],
        ['40 × 50 kecil', { lebar: 40, tinggiMuka: 50, tinggi: 65 }],
        ['60 × 80', { lebar: 60, tinggiMuka: 80, tinggi: 100 }],
      ]),
      FINISH,
    ],
  },
];

export const PEMBATAS_CATALOG: GroupSpec[] = [
  {
    id: 'partisi-tanaman',
    name: 'Partisi tanaman',
    desc: 'pot + layar bilah · pembatas area cafe',
    noun: 'Partisi tanaman',
    base: { layar: true, roda: false },
    struct: [n('jarakBilah', [['', 10], ['bilah rapat', 6], ['bilah renggang', 16]]), n('tinggiLayar', [['', 130], ['tinggi 150', 150], ['rendah 110', 110], ['tinggi 170', 170]])],
    style: [
      sizes([
        ['100 cm', { panjang: 100, lebar: 35, tinggiBox: 50 }],
        ['150 cm', { panjang: 150, lebar: 40, tinggiBox: 50 }],
        ['80 cm', { panjang: 80, lebar: 35, tinggiBox: 45 }],
        ['200 cm', { panjang: 200, lebar: 45, tinggiBox: 55 }],
      ]),
      [FINISH[0], FINISH[4], FINISH[1], FINISH[5], FINISH[6]],
    ],
  },
  {
    id: 'partisi-beroda',
    name: 'Partisi beroda',
    desc: 'bisa digeser · event · ruang serbaguna',
    noun: 'Partisi beroda',
    base: { layar: true, roda: true },
    struct: [n('jarakBilah', [['', 10], ['bilah rapat', 6], ['bilah renggang', 15]]), n('tinggiLayar', [['', 130], ['rendah 100', 100], ['tinggi 145', 145]]), n('ukuranRoda', [['', '3'], ['roda 4"', '4']])],
    style: [sizes([['100 cm', { panjang: 100, lebar: 40, tinggiBox: 45 }], ['120 cm', { panjang: 120, lebar: 45, tinggiBox: 45 }], ['80 cm', { panjang: 80, lebar: 40, tinggiBox: 40 }]]), FINISH],
  },
  {
    id: 'planter-box',
    name: 'Kotak pot (planter box)',
    desc: 'tanpa layar · teras · trotoar · rooftop',
    noun: 'Planter box',
    base: { layar: false },
    struct: [[{ label: '', params: { roda: false } }, { label: 'beroda', params: { roda: true, ukuranRoda: '4' } }], n('tinggiBox', [['', 50], ['tinggi 75', 75], ['rendah 35', 35], ['tinggi 90', 90]])],
    style: [
      sizes([
        ['100 × 35', { panjang: 100, lebar: 35 }],
        ['60 × 60 kotak', { panjang: 60, lebar: 60 }],
        ['150 × 40', { panjang: 150, lebar: 40 }],
        ['200 × 50', { panjang: 200, lebar: 50 }],
        ['50 × 30 kecil', { panjang: 50, lebar: 30 }],
      ]),
      FINISH,
    ],
  },
];

export const DIPAN_CATALOG: GroupSpec[] = [
  {
    id: 'dipan-single',
    name: 'Dipan single / anak',
    desc: '90 – 120 cm · kamar anak · kost',
    noun: 'Dipan single',
    base: { pipa: '30', kasur: true },
    struct: [
      [{ label: '+ sandaran kepala', params: { sandaranKepala: true, sandaranKaki: false } }, { label: 'sandaran kepala + kaki', params: { sandaranKepala: true, sandaranKaki: true } }, { label: 'polos', params: { sandaranKepala: false, sandaranKaki: false } }],
      n('tinggi', [['', 38], ['rendah', 25], ['tinggi', 48]]),
    ],
    style: [
      sizes([
        ['90 × 200', { lebar: 90, panjang: 200, tinggiSandaran: 95, tinggiKaki: 60 }],
        ['120 × 200', { lebar: 120, panjang: 200, tinggiSandaran: 100, tinggiKaki: 60 }],
        ['100 × 200', { lebar: 100, panjang: 200, tinggiSandaran: 95, tinggiKaki: 60 }],
        ['anak 80 × 180', { lebar: 80, panjang: 180, tinggiSandaran: 85, tinggiKaki: 55, pipa: '20' }],
      ]),
      FINISH,
    ],
  },
  {
    id: 'dipan-queen',
    name: 'Dipan queen / king',
    desc: '160 – 200 cm · kamar utama',
    noun: 'Dipan',
    base: { pipa: '40', kasur: true },
    struct: [
      [{ label: '+ sandaran kepala', params: { sandaranKepala: true, sandaranKaki: false } }, { label: 'sandaran kepala + kaki', params: { sandaranKepala: true, sandaranKaki: true } }, { label: 'polos', params: { sandaranKepala: false, sandaranKaki: false } }],
      n('tinggi', [['', 38], ['rendah', 25], ['tinggi', 48]]),
      [none, { label: 'sandaran tinggi', params: { tinggiSandaran: 125 } }],
    ],
    style: [
      sizes([
        ['queen 160 × 200', { lebar: 160, panjang: 200, tinggiSandaran: 105, tinggiKaki: 60 }],
        ['king 180 × 200', { lebar: 180, panjang: 200, tinggiSandaran: 110, tinggiKaki: 60 }],
        ['super king 200 × 200', { lebar: 200, panjang: 200, tinggiSandaran: 115, tinggiKaki: 60 }],
      ]),
      FINISH,
    ],
    valid: (p) => !(p.sandaranKepala === false && Number(p.tinggiSandaran) === 125),
  },
  {
    id: 'dipan-platform',
    name: 'Dipan platform / lesehan',
    desc: 'rendah minimalis · kost · Jepang',
    noun: 'Dipan platform',
    base: { pipa: '40', sandaranKaki: false, kasur: true },
    struct: [
      [{ label: '', params: { sandaranKepala: false } }, { label: '+ sandaran kepala rendah', params: { sandaranKepala: true, tinggiSandaran: 75 } }],
      n('tinggi', [['', 25], ['sangat rendah', 20], ['sedang', 32]]),
    ],
    style: [
      sizes([
        ['160 × 200', { lebar: 160, panjang: 200 }],
        ['120 × 200', { lebar: 120, panjang: 200, pipa: '30' }],
        ['180 × 200', { lebar: 180, panjang: 200 }],
        ['90 × 200', { lebar: 90, panjang: 200, pipa: '30' }],
        ['200 × 200', { lebar: 200, panjang: 200 }],
      ]),
      FINISH,
    ],
  },
];
