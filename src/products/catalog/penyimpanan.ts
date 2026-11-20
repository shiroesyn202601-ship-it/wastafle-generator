import { FINISH, GroupSpec, Opt, sizes } from './gen';

/** Rak susun pipa, rak tangga, rak tanaman, troli, rak dinding / backbar, rak gantungan baju */
const none: Opt = { label: '', params: {} };
const n = (label: string, key: string, values: [string, number | string | boolean][]): Opt[] =>
  values.map(([l, v]) => ({ label: l ? `${l}` : '', params: { [key]: v } }));
const roda: Opt = { label: 'beroda', params: { roda: true, remRoda: true, ukuranRoda: '3' } };
const tanpaRoda: Opt = { label: '', params: { roda: false } };

export const RAK_CATALOG: GroupSpec[] = [
  {
    id: 'rak-buku',
    name: 'Rak buku',
    desc: 'ruang kerja · kamar · perpustakaan',
    noun: 'Rak buku',
    base: { model: 'tegak', dalam: 30, pipa: '30', papan: 'kayu', palang: '20x20', tinggiBawah: 8, roda: false },
    struct: [
      n('', 'kolom', [['', 1], ['2 kolom', 2], ['3 kolom', 3]]),
      n('', 'tingkat', [['5 susun', 5], ['4 susun', 4], ['6 susun', 6], ['3 susun', 3]]),
      [none, { label: 'kaki tinggi', params: { tinggiBawah: 20 } }],
    ],
    style: [
      sizes([
        ['tinggi 180', { tinggi: 180, panjang: 80 }],
        ['tinggi 150', { tinggi: 150, panjang: 100 }],
        ['tinggi 200', { tinggi: 200, panjang: 120, dalam: 35 }],
        ['pendek 100', { tinggi: 100, panjang: 120 }],
      ]),
      FINISH,
    ],
  },
  {
    id: 'rak-gudang',
    name: 'Rak gudang / besi berat',
    desc: 'stok barang · garasi · palang 20×40',
    noun: 'Rak gudang',
    base: { model: 'tegak', pipa: '40', palang: '20x40', papan: 'multiplek', warna: '#6b7078', tinggiBawah: 10, roda: false },
    struct: [
      n('', 'tingkat', [['4 susun', 4], ['5 susun', 5], ['3 susun', 3], ['6 susun', 6]]),
      n('', 'kolom', [['', 1], ['2 kolom', 2], ['3 kolom', 3]]),
    ],
    style: [
      sizes([
        ['150 × 50 × 200', { panjang: 150, dalam: 50, tinggi: 200 }],
        ['120 × 60 × 180', { panjang: 120, dalam: 60, tinggi: 180 }],
        ['200 × 60 × 200', { panjang: 200, dalam: 60, tinggi: 200 }],
        ['100 × 45 × 150', { panjang: 100, dalam: 45, tinggi: 150 }],
      ]),
      [{ label: 'abu · multiplek', params: { warna: '#6b7078', papan: 'multiplek' } }, FINISH[0], FINISH[3], { label: 'hijau army · multiplek', params: { warna: '#2f4a3a', papan: 'multiplek' } }],
    ],
  },
  {
    id: 'rak-sepatu',
    name: 'Rak sepatu',
    desc: 'pintu masuk · teras · 3 – 5 susun',
    noun: 'Rak sepatu',
    base: { model: 'tegak', dalam: 32, pipa: '20', palang: '20x20', tinggiBawah: 6, roda: false },
    struct: [
      n('', 'tingkat', [['3 susun', 3], ['4 susun', 4], ['5 susun', 5], ['2 susun', 2]]),
      n('', 'kolom', [['', 1], ['2 kolom', 2]]),
      [none, { label: 'kaki tinggi', params: { tinggiBawah: 15 } }],
    ],
    style: [
      sizes([
        ['panjang 80', { panjang: 80, tinggi: 80 }],
        ['panjang 100', { panjang: 100, tinggi: 100 }],
        ['panjang 60', { panjang: 60, tinggi: 70 }],
        ['panjang 120', { panjang: 120, tinggi: 110, pipa: '30' }],
      ]),
      FINISH,
    ],
  },
  {
    id: 'rak-dapur',
    name: 'Rak dapur',
    desc: 'bumbu · microwave · panci · beroda',
    noun: 'Rak dapur',
    base: { model: 'tegak', dalam: 40, pipa: '30', palang: '20x20', tinggiBawah: 10 },
    struct: [
      n('', 'tingkat', [['3 susun', 3], ['4 susun', 4], ['5 susun', 5]]),
      [tanpaRoda, roda],
      n('', 'kolom', [['', 1], ['2 kolom', 2]]),
    ],
    style: [
      sizes([
        ['60 × 40 × 120', { panjang: 60, tinggi: 120 }],
        ['80 × 40 × 150', { panjang: 80, tinggi: 150 }],
        ['50 × 35 × 100', { panjang: 50, dalam: 35, tinggi: 100 }],
        ['100 × 45 × 120', { panjang: 100, dalam: 45, tinggi: 120 }],
      ]),
      [FINISH[1], FINISH[0], FINISH[3], FINISH[2], FINISH[7]],
    ],
  },
  {
    id: 'rak-display',
    name: 'Rak display toko',
    desc: 'minimarket · butik · etalase terbuka',
    noun: 'Rak display',
    base: { model: 'tegak', dalam: 40, pipa: '30', palang: '20x40', tinggiBawah: 12 },
    struct: [
      n('', 'kolom', [['', 1], ['2 kolom', 2], ['3 kolom', 3]]),
      n('', 'tingkat', [['4 susun', 4], ['3 susun', 3], ['5 susun', 5]]),
      [tanpaRoda, roda],
    ],
    style: [
      sizes([
        ['tinggi 160', { panjang: 120, tinggi: 160 }],
        ['pendek 90', { panjang: 120, tinggi: 90, dalam: 45 }],
        ['tinggi 180', { panjang: 150, tinggi: 180, dalam: 45 }],
        ['meja display 75', { panjang: 100, tinggi: 75, dalam: 50 }],
      ]),
      FINISH,
    ],
  },
  {
    id: 'rak-tangga',
    name: 'Rak tangga',
    desc: 'bersandar tembok · makin ke atas makin dangkal',
    noun: 'Rak tangga',
    base: { model: 'tangga', pipa: '30', palang: '20x20', tinggiBawah: 5, roda: false },
    struct: [
      n('', 'tingkat', [['5 susun', 5], ['4 susun', 4], ['3 susun', 3], ['6 susun', 6]]),
      n('', 'kolom', [['', 1], ['2 kolom', 2]]),
    ],
    style: [
      sizes([
        ['tinggi 180', { panjang: 60, dalam: 40, dalamAtas: 20, tinggi: 180 }],
        ['tinggi 150', { panjang: 70, dalam: 38, dalamAtas: 18, tinggi: 150 }],
        ['tinggi 120', { panjang: 60, dalam: 35, dalamAtas: 18, tinggi: 120 }],
        ['lebar 120', { panjang: 120, dalam: 45, dalamAtas: 22, tinggi: 180 }],
      ]),
      FINISH,
    ],
  },
];

export const RAK_TANAMAN_CATALOG: GroupSpec[] = [
  {
    id: 'tanaman-teras',
    name: 'Rak tanaman teras',
    desc: 'tangga bertingkat · pot sedang',
    noun: 'Rak tanaman',
    base: { pipa: '30' },
    struct: [
      n('', 'tingkat', [['3 tingkat', 3], ['4 tingkat', 4], ['2 tingkat', 2], ['5 tingkat', 5]]),
      n('', 'naikTingkat', [['', 25], ['naik tinggi', 35], ['landai', 18]]),
    ],
    style: [
      sizes([
        ['panjang 100', { panjang: 100, dalamTingkat: 25 }],
        ['panjang 150', { panjang: 150, dalamTingkat: 30 }],
        ['panjang 80', { panjang: 80, dalamTingkat: 25, pipa: '20' }],
        ['panjang 200', { panjang: 200, dalamTingkat: 30, pipa: '40' }],
      ]),
      [FINISH[0], FINISH[4], FINISH[1], FINISH[5], FINISH[2]],
    ],
  },
  {
    id: 'tanaman-kecil',
    name: 'Rak tanaman kecil / balkon',
    desc: 'sudut sempit · pot kecil · sukulen',
    noun: 'Rak tanaman kecil',
    base: { pipa: '20' },
    struct: [
      n('', 'tingkat', [['3 tingkat', 3], ['2 tingkat', 2], ['4 tingkat', 4], ['5 tingkat', 5]]),
      n('', 'dalamTingkat', [['', 18], ['pijakan lebar', 25], ['ramping', 15]]),
    ],
    style: [
      sizes([
        ['panjang 60', { panjang: 60, naikTingkat: 20 }],
        ['panjang 45', { panjang: 45, naikTingkat: 18 }],
        ['panjang 80', { panjang: 80, naikTingkat: 22 }],
      ]),
      FINISH,
    ],
  },
  {
    id: 'tanaman-anggrek',
    name: 'Rak anggrek / bonsai',
    desc: 'tinggi · pot berjarak · kebun',
    noun: 'Rak anggrek',
    base: { pipa: '30' },
    struct: [
      n('', 'tingkat', [['4 tingkat', 4], ['5 tingkat', 5], ['3 tingkat', 3]]),
      n('', 'naikTingkat', [['', 35], ['naik tinggi', 45], ['naik sedang', 30]]),
      n('', 'dalamTingkat', [['', 30], ['pijakan lebar', 40]]),
    ],
    style: [sizes([['panjang 120', { panjang: 120 }], ['panjang 100', { panjang: 100 }], ['panjang 180', { panjang: 180, pipa: '40' }]]), [FINISH[4], FINISH[0], FINISH[2], FINISH[1]]],
  },
];

export const TROLI_CATALOG: GroupSpec[] = [
  {
    id: 'troli-saji',
    name: 'Troli saji / dapur',
    desc: 'hotel · restoran · rumah',
    noun: 'Troli saji',
    base: { pipa: '20', palang: '20x20', remRoda: true, ukuranRoda: '3' },
    struct: [
      n('', 'tingkat', [['3 susun', 3], ['2 susun', 2], ['4 susun', 4]]),
      [{ label: '', params: { pegangan: true } }, { label: 'tanpa pegangan', params: { pegangan: false } }],
      [none, { label: 'berbibir', params: { bibir: true } }],
    ],
    style: [
      sizes([
        ['70 × 45', { panjang: 70, lebar: 45, tinggiRak: 85, tinggiPegangan: 97 }],
        ['60 × 40', { panjang: 60, lebar: 40, tinggiRak: 80, tinggiPegangan: 92 }],
        ['80 × 50', { panjang: 80, lebar: 50, tinggiRak: 85, tinggiPegangan: 97 }],
        ['50 × 35 kecil', { panjang: 50, lebar: 35, tinggiRak: 75, tinggiPegangan: 88 }],
      ]),
      [FINISH[0], FINISH[1], FINISH[6], FINISH[3], FINISH[4]],
    ],
  },
  {
    id: 'troli-bengkel',
    name: 'Troli bengkel / perkakas',
    desc: 'kunci · sparepart · berbibir',
    noun: 'Troli bengkel',
    base: { pipa: '30', palang: '20x40', bibir: true, remRoda: true, papan: 'multiplek' },
    struct: [
      n('', 'tingkat', [['3 susun', 3], ['2 susun', 2], ['4 susun', 4]]),
      [{ label: '', params: { pegangan: true } }, { label: 'tanpa pegangan', params: { pegangan: false } }],
      n('', 'ukuranRoda', [['', '4'], ['roda 5"', '5'], ['roda 3"', '3']]),
    ],
    style: [
      sizes([
        ['75 × 45', { panjang: 75, lebar: 45, tinggiRak: 85, tinggiPegangan: 98 }],
        ['90 × 50', { panjang: 90, lebar: 50, tinggiRak: 85, tinggiPegangan: 98 }],
        ['60 × 40', { panjang: 60, lebar: 40, tinggiRak: 80, tinggiPegangan: 95 }],
      ]),
      [{ label: 'abu · multiplek', params: { warna: '#6b7078', papan: 'multiplek' } }, { label: 'merah bata · multiplek', params: { warna: '#7a3b2a', papan: 'multiplek' } }, FINISH[0], FINISH[3]],
    ],
  },
  {
    id: 'troli-barang',
    name: 'Troli barang / gudang',
    desc: 'angkut stok · rak lebar · roda besar',
    noun: 'Troli barang',
    base: { pipa: '40', palang: '20x40', remRoda: true, ukuranRoda: '5', papan: 'multiplek', warna: '#6b7078' },
    struct: [
      n('', 'tingkat', [['2 susun', 2], ['1 alas', 1], ['3 susun', 3]]),
      [{ label: '', params: { pegangan: true } }, { label: 'tanpa pegangan', params: { pegangan: false } }],
      [none, { label: 'berbibir', params: { bibir: true } }],
    ],
    style: [
      sizes([
        ['100 × 60', { panjang: 100, lebar: 60, tinggiRak: 70, tinggiPegangan: 95 }],
        ['120 × 70', { panjang: 120, lebar: 70, tinggiRak: 70, tinggiPegangan: 95 }],
        ['80 × 50', { panjang: 80, lebar: 50, tinggiRak: 60, tinggiPegangan: 92 }],
        ['140 × 80', { panjang: 140, lebar: 80, tinggiRak: 75, tinggiPegangan: 98 }],
      ]),
      [{ label: 'abu · multiplek', params: { warna: '#6b7078', papan: 'multiplek' } }, FINISH[0], FINISH[4], FINISH[3]],
    ],
  },
  {
    id: 'troli-jualan',
    name: 'Troli jualan / display',
    desc: 'bazar · kopi keliling · rak dorong',
    noun: 'Troli jualan',
    base: { pipa: '30', palang: '20x20', remRoda: true, ukuranRoda: '4', pegangan: true },
    struct: [
      n('', 'tingkat', [['2 susun', 2], ['3 susun', 3], ['4 susun', 4]]),
      [none, { label: 'berbibir', params: { bibir: true } }],
      [{ label: '', params: { tinggiRak: 90 } }, { label: 'rendah', params: { tinggiRak: 75 } }],
    ],
    style: [
      sizes([
        ['80 × 50', { panjang: 80, lebar: 50, tinggiPegangan: 105 }],
        ['90 × 55', { panjang: 90, lebar: 55, tinggiPegangan: 105 }],
        ['60 × 45', { panjang: 60, lebar: 45, tinggiPegangan: 102 }],
      ]),
      FINISH,
    ],
  },
];

export const RAK_DINDING_CATALOG: GroupSpec[] = [
  {
    id: 'backbar',
    name: 'Backbar / rak botol',
    desc: 'bar · cafe · siku miring berbibir',
    noun: 'Backbar',
    base: { model: 'siku-miring', bibir: true, dalam: 25, jarak: 35, tinggiMulai: 120, pipa: '20' },
    struct: [
      n('', 'tingkat', [['3 susun', 3], ['2 susun', 2], ['4 susun', 4], ['1 susun', 1]]),
      [none, { label: '+ gantungan gelas', params: { gantunganGelas: true } }],
      [none, { label: 'rak tiang', params: { model: 'tiang' } }],
    ],
    style: [
      sizes([
        ['panjang 150', { panjang: 150 }],
        ['panjang 120', { panjang: 120 }],
        ['panjang 200', { panjang: 200, pipa: '30' }],
        ['panjang 90', { panjang: 90 }],
      ]),
      FINISH,
    ],
  },
  {
    id: 'rak-dinding-dapur',
    name: 'Rak dinding dapur',
    desc: 'piring · bumbu · cangkir gantung',
    noun: 'Rak dinding dapur',
    base: { model: 'siku', dalam: 22, jarak: 30, tinggiMulai: 140, pipa: '20', bibir: false },
    struct: [
      n('', 'tingkat', [['2 susun', 2], ['1 susun', 1], ['3 susun', 3]]),
      [none, { label: '+ gantungan gelas', params: { gantunganGelas: true } }],
      [none, { label: 'berbibir', params: { bibir: true } }],
      [none, { label: 'siku miring', params: { model: 'siku-miring' } }],
    ],
    style: [
      sizes([
        ['panjang 80', { panjang: 80 }],
        ['panjang 100', { panjang: 100 }],
        ['panjang 60', { panjang: 60 }],
        ['panjang 120', { panjang: 120 }],
      ]),
      [FINISH[1], FINISH[0], FINISH[7], FINISH[3]],
    ],
  },
  {
    id: 'rak-plafon',
    name: 'Rak gantung plafon',
    desc: 'atas meja bar / island · gelas · tanaman',
    noun: 'Rak gantung',
    base: { model: 'gantung', dalam: 25, jarak: 30, tinggiPlafon: 280, pipa: '20' },
    struct: [
      n('', 'tingkat', [['2 susun', 2], ['1 susun', 1], ['3 susun', 3]]),
      [none, { label: '+ gantungan gelas', params: { gantunganGelas: true } }],
      [none, { label: 'berbibir', params: { bibir: true } }],
    ],
    style: [
      sizes([
        ['panjang 120, plafon 280', { panjang: 120 }],
        ['panjang 150, plafon 300', { panjang: 150, tinggiPlafon: 300 }],
        ['panjang 90, plafon 260', { panjang: 90, tinggiPlafon: 260 }],
        ['panjang 180, plafon 320', { panjang: 180, tinggiPlafon: 320, pipa: '30' }],
      ]),
      FINISH,
    ],
  },
  {
    id: 'ambalan',
    name: 'Ambalan buku / dekor',
    desc: 'ruang tamu · kamar · rak tiang',
    noun: 'Ambalan',
    base: { dalam: 22, jarak: 35, tinggiMulai: 100, pipa: '20', bibir: false, gantunganGelas: false },
    struct: [
      [{ label: 'siku', params: { model: 'siku' } }, { label: 'tiang', params: { model: 'tiang' } }, { label: 'siku miring', params: { model: 'siku-miring' } }],
      n('', 'tingkat', [['3 susun', 3], ['1 susun', 1], ['2 susun', 2], ['4 susun', 4], ['5 susun', 5]]),
    ],
    style: [
      sizes([
        ['panjang 100', { panjang: 100 }],
        ['panjang 60', { panjang: 60 }],
        ['panjang 150', { panjang: 150 }],
        ['panjang 80', { panjang: 80, jarak: 30 }],
      ]),
      FINISH,
    ],
  },
];

export const RAK_BAJU_CATALOG: GroupSpec[] = [
  {
    id: 'baju-kamar',
    name: 'Rak baju kamar',
    desc: 'gantungan + rak sepatu / tas',
    noun: 'Rak baju',
    base: { pipa: '30', papan: 'kayu' },
    struct: [
      [{ label: '+ rak bawah', params: { rakBawah: true, tinggiRak: 20 } }, { label: 'polos', params: { rakBawah: false } }, { label: '+ rak bawah tinggi', params: { rakBawah: true, tinggiRak: 35 } }],
      [{ label: '', params: { roda: false } }, { label: 'beroda', params: { roda: true, ukuranRoda: '3' } }],
    ],
    style: [
      sizes([
        ['120 cm', { panjang: 120, tinggi: 165, dalam: 50 }],
        ['90 cm', { panjang: 90, tinggi: 160, dalam: 45 }],
        ['150 cm', { panjang: 150, tinggi: 170, dalam: 50 }],
        ['60 cm anak', { panjang: 60, tinggi: 130, dalam: 40, pipa: '20' }],
      ]),
      FINISH,
    ],
  },
  {
    id: 'baju-butik',
    name: 'Rak baju butik / display',
    desc: 'toko · distro · pameran',
    noun: 'Rak butik',
    base: { pipa: '30', papan: 'kayu' },
    struct: [
      [{ label: 'polos', params: { rakBawah: false } }, { label: '+ rak display bawah', params: { rakBawah: true, tinggiRak: 25 } }, { label: '+ rak bawah tinggi', params: { rakBawah: true, tinggiRak: 40 } }],
      [{ label: 'beroda', params: { roda: true, ukuranRoda: '4' } }, { label: '', params: { roda: false } }],
    ],
    style: [
      sizes([
        ['150 cm', { panjang: 150, tinggi: 170, dalam: 50 }],
        ['120 cm', { panjang: 120, tinggi: 165, dalam: 50 }],
        ['180 cm', { panjang: 180, tinggi: 175, dalam: 55, pipa: '40' }],
        ['100 cm', { panjang: 100, tinggi: 160, dalam: 45 }],
      ]),
      [FINISH[0], FINISH[6], FINISH[1], FINISH[3], FINISH[2]],
    ],
  },
  {
    id: 'baju-laundry',
    name: 'Rak jemuran / laundry',
    desc: 'gantung baju basah · beroda · kuat',
    noun: 'Rak laundry',
    base: { pipa: '30', papan: 'multiplek', warna: '#e9e7e1' },
    struct: [
      [{ label: 'beroda', params: { roda: true, ukuranRoda: '4' } }, { label: '', params: { roda: false } }],
      [{ label: '+ rak keranjang', params: { rakBawah: true, tinggiRak: 25 } }, { label: 'polos', params: { rakBawah: false } }],
    ],
    style: [
      sizes([
        ['150 cm', { panjang: 150, tinggi: 170, dalam: 55 }],
        ['120 cm', { panjang: 120, tinggi: 160, dalam: 50 }],
        ['180 cm', { panjang: 180, tinggi: 175, dalam: 60, pipa: '40' }],
        ['90 cm', { panjang: 90, tinggi: 150, dalam: 45 }],
        ['200 cm', { panjang: 200, tinggi: 180, dalam: 60, pipa: '40' }],
      ]),
      [{ label: 'putih · multiplek', params: { warna: '#e9e7e1', papan: 'multiplek' } }, FINISH[2], FINISH[0], FINISH[3]],
    ],
  },
];
