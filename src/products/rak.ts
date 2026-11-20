import { Board, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, CASTER_OPTIONS, board, bool, casterHeight, casterSet, materialParams, memberFactory, num, r1, str } from './common';

/**
 * Rak bertingkat: 4 tiang, tiap tingkat 4 palang + papan.
 * Dipakai untuk rak buku, rak gudang, rak sepatu, rak tanaman datar.
 */
export const RAK: ProductDef = {
  id: 'rak',
  name: 'Rak',
  tagline: 'buku · gudang · sepatu · dapur',
  icon: 'M14 4v32M46 4v32M14 12h32M14 22h32M14 32h32',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['panjang', 'dalam', 'tinggi'] },
    { id: 'bentuk', title: 'Bentuk', keys: ['model', 'dalamAtas', 'tingkat', 'tinggiBawah', 'kolom', 'palang'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Tambahan', keys: ['roda', 'ukuranRoda', 'remRoda'] },
  ],
  params: [
    { key: 'panjang', label: 'Panjang', type: 'number', unit: 'cm', min: 30, max: 200, step: 1, help: 'Lebar rak dilihat dari depan.', marks: [{ value: 60, label: 'sepatu' }, { value: 80, label: 'buku' }, { value: 120, label: 'gudang' }] },
    { key: 'dalam', label: 'Kedalaman', type: 'number', unit: 'cm', min: 15, max: 80, step: 1, help: 'Jarak depan ke belakang.', marks: [{ value: 30, label: 'buku / sepatu' }, { value: 50, label: 'gudang' }] },
    { key: 'tinggi', label: 'Tinggi rangka', type: 'number', unit: 'cm', min: 30, max: 220, step: 1, help: 'Dari lantai sampai ujung atas tiang.', marks: [{ value: 75, label: 'sepatu' }, { value: 180, label: 'buku' }, { value: 200, label: 'gudang' }] },
    {
      key: 'model',
      label: 'Bentuk rak',
      type: 'choice',
      options: [
        { value: 'tegak', label: 'Tegak', desc: 'Semua tingkat sama dalam' },
        { value: 'tangga', label: 'Tangga bersandar', desc: 'Makin ke atas makin dangkal, menempel tembok' },
      ],
    },
    { key: 'dalamAtas', label: 'Kedalaman tingkat teratas', type: 'number', unit: 'cm', min: 12, max: 40, step: 1, showIf: (p) => p.model === 'tangga' },
    { key: 'kolom', label: 'Jumlah kolom (sekat)', type: 'number', unit: 'kolom', min: 1, max: 4, step: 1, help: 'Tiang tengah membagi rak jadi beberapa kolom; papan tidak terlalu panjang.' },
    { key: 'tingkat', label: 'Jumlah tingkat', type: 'number', unit: 'tingkat', min: 2, max: 8, step: 1, help: 'Termasuk tingkat paling bawah dan paling atas.' },
    { key: 'tinggiBawah', label: 'Tinggi tingkat terbawah', type: 'number', unit: 'cm', min: 3, max: 40, step: 1, help: 'Jarak dari lantai, supaya mudah disapu.' },
    { key: 'palang', label: 'Pipa penyangga papan', type: 'choice', options: [{ value: '20x20', label: '20×20 mm', desc: 'Ringan, ±50 kg per tingkat sampai 100 cm' }, { value: '20x40', label: '20×40 mm', desc: 'Kuat, untuk rak panjang / berat' }] },
    ...materialParams(true),
    { key: 'roda', label: 'Pakai roda', type: 'toggle', help: 'Rak bisa dipindah-pindah.' },
    { key: 'ukuranRoda', label: 'Ukuran roda', type: 'choice', options: CASTER_OPTIONS, showIf: (p) => p.roda === true },
    { key: 'remRoda', label: 'Roda dengan rem', type: 'toggle', showIf: (p) => p.roda === true },
  ],
  defaults: {
    panjang: 80, dalam: 30, tinggi: 180, tingkat: 5, tinggiBawah: 8, palang: '20x20', model: 'tegak', dalamAtas: 20, kolom: 1,
    pipa: '30', papan: 'kayu', warna: '#1f2226', roda: false, ukuranRoda: '3', remRoda: true,
  },
  presets: [
    {
      id: 'susun',
      name: 'Rak susun',
      desc: '4 tiang, papan di setiap tingkat',
      params: { roda: false },
      sizes: [
        { label: 'Buku', desc: '80 × 30 × 180 cm, 5 tingkat', params: { panjang: 80, dalam: 30, tinggi: 180, tingkat: 5, tinggiBawah: 8, palang: '20x20', pipa: '30' } },
        { label: 'Gudang', desc: '120 × 50 × 200 cm, 4 tingkat', params: { panjang: 120, dalam: 50, tinggi: 200, tingkat: 4, tinggiBawah: 10, palang: '20x40', pipa: '40' } },
        { label: 'Sepatu', desc: '80 × 32 × 75 cm, 4 tingkat', params: { panjang: 80, dalam: 32, tinggi: 75, tingkat: 4, tinggiBawah: 5, palang: '20x20', pipa: '20' } },
        { label: 'Dapur / microwave', desc: '60 × 40 × 120 cm, 3 tingkat', params: { panjang: 60, dalam: 40, tinggi: 120, tingkat: 3, tinggiBawah: 10, palang: '20x20', pipa: '30' } },
        { label: 'Display cafe', desc: '100 × 35 × 160 cm, 4 tingkat', params: { panjang: 100, dalam: 35, tinggi: 160, tingkat: 4, tinggiBawah: 10, palang: '20x20', pipa: '30' } },
      ],
    },
    {
      id: 'kolom',
      name: 'Rak susun bersekat',
      desc: 'tiang tengah membagi rak jadi 2–3 kolom',
      params: { model: 'tegak', kolom: 2, roda: false },
      sizes: [
        { label: 'Rak buku besar', desc: '160 × 30 × 180, 2 kolom, 5 tingkat', params: { panjang: 160, dalam: 30, tinggi: 180, tingkat: 5, tinggiBawah: 8, kolom: 2, pipa: '30' } },
        { label: 'Rak gudang 3 kolom', desc: '240 × 50 × 200, 4 tingkat', params: { panjang: 240, dalam: 50, tinggi: 200, tingkat: 4, tinggiBawah: 10, kolom: 3, palang: '20x40', pipa: '40' } },
        { label: 'Rak display toko', desc: '180 × 40 × 160, 3 kolom', params: { panjang: 180, dalam: 40, tinggi: 160, tingkat: 4, tinggiBawah: 10, kolom: 3, pipa: '30' } },
      ],
    },
    {
      id: 'tangga',
      name: 'Rak tangga bersandar tembok',
      desc: 'makin ke atas makin dangkal',
      params: { model: 'tangga', kolom: 1, roda: false },
      sizes: [
        { label: 'Rak buku tangga', desc: '70 × 40 × 180, atas 20 cm', params: { panjang: 70, dalam: 40, dalamAtas: 20, tinggi: 180, tingkat: 5, tinggiBawah: 10, pipa: '30' } },
        { label: 'Rak tanaman tangga', desc: '80 × 45 × 120, atas 20 cm', params: { panjang: 80, dalam: 45, dalamAtas: 20, tinggi: 120, tingkat: 3, tinggiBawah: 15, pipa: '20' } },
      ],
    },
    {
      id: 'beroda',
      name: 'Rak susun beroda',
      desc: 'rak pendek dengan 4 roda rem',
      params: { roda: true, remRoda: true },
      sizes: [
        { label: 'Rak dapur dorong', desc: '60 × 40 × 90 cm, 3 tingkat', params: { panjang: 60, dalam: 40, tinggi: 90, tingkat: 3, tinggiBawah: 5, palang: '20x20', pipa: '30', ukuranRoda: '3' } },
        { label: 'Rak gudang dorong', desc: '100 × 50 × 120 cm, 3 tingkat', params: { panjang: 100, dalam: 50, tinggi: 120, tingkat: 3, tinggiBawah: 5, palang: '20x40', pipa: '40', ukuranRoda: '4' } },
      ],
    },
  ],
  summary: (p) => `${num(p, 'panjang')} × ${num(p, 'dalam')} × ${num(p, 'tinggi')} cm · ${num(p, 'tingkat')} tingkat`,

  build: (p) => {
    const W = num(p, 'panjang', 80);
    const D = num(p, 'dalam', 30);
    const H = num(p, 'tinggi', 180);
    const n = Math.max(2, Math.round(num(p, 'tingkat', 4)));
    const L = (parseInt(str(p, 'pipa', '30')) || 30) / 10;
    const rail: [number, number] = str(p, 'palang') === '20x40' ? [20, 40] : [20, 20];
    const rh = rail[1] / 10;
    const b = BOARD_THICK[str(p, 'papan', 'multiplek')] ?? 1.8;
    const roda = bool(p, 'roda');
    const inch = parseInt(str(p, 'ukuranRoda', '3')) || 3;
    const c = roda ? casterHeight(inch) : 0;
    const post: [number, number] = [L * 10, L * 10];

    const { list, add, line } = memberFactory();
    const tangga = str(p, 'model') === 'tangga';
    const k = Math.max(1, Math.round(num(p, 'kolom', 1)));
    const zb = L / 2;
    const zfBot = D - L / 2;
    const zfTop = tangga ? Math.max(L + 4, num(p, 'dalamAtas', 20)) - L / 2 : zfBot;
    /** as tiang depan pada ketinggian y (rak tangga: miring ke belakang) */
    const zfAt = (y: number) => zfBot + ((zfTop - zfBot) * (y - c)) / Math.max(1, H - c);
    // tiang di ujung kiri, ujung kanan, dan di setiap sekat kolom
    const xs = Array.from({ length: k + 1 }, (_, j) => (j === 0 ? L / 2 : j === k ? W - L / 2 : (W * j) / k));
    xs.forEach((x, j) => {
      const nm = j === 0 ? 'kiri' : j === k ? 'kanan' : `sekat ${j}`;
      const id = j === 0 || j === k ? `tiang-${j ? 'kanan' : 'kiri'}` : `sekat-${j}`; // tiang sekat = struktur berbeda
      add(`${id}-b`, 'y', x, c, zb, H - c, 'post', `Tiang ${nm} belakang`, post);
      line(`${id}-d`, [x, c, zfBot], [x, H, zfTop], 'post', `Tiang ${nm} depan`, post);
    });

    const yBottom = c + Math.max(num(p, 'tinggiBawah', 8), rh / 2);
    const yTopLvl = H - rh / 2;
    const boards: Board[] = [];
    for (let i = 0; i < n; i++) {
      const y = r1(yBottom + ((yTopLvl - yBottom) * i) / (n - 1));
      const t = i + 1;
      const zf = zfAt(y);
      add(`t${t}-depan`, 'x', L, y, zf, W - 2 * L, 'rail-x', `Palang tingkat ${t} depan`, rail);
      add(`t${t}-belakang`, 'x', L, y, zb, W - 2 * L, 'rail-x', `Palang tingkat ${t} belakang`, rail);
      xs.forEach((x, j) => add(`t${t}-${j === 0 || j === k ? `samping-${j ? 'kanan' : 'kiri'}` : `sekat-${j}`}`, 'z', x, y, L, zf - L / 2 - L, 'rail-z', `Palang tingkat ${t} ${j === 0 ? 'kiri' : j === k ? 'kanan' : `sekat ${j}`}`, rail));
      if (b > 0)
        for (let j = 0; j < k; j++) {
          const x0 = j === 0 ? L : xs[j] + L / 2;
          const x1 = j === k - 1 ? W - L : xs[j + 1] - L / 2;
          boards.push(board(`papan-${t}-${j + 1}`, `Papan tingkat ${t}${k > 1 ? ` kolom ${j + 1}` : ''}`, x0, x1, y + rh / 2, y + rh / 2 + b, 0, zf + L / 2));
        }
    }
    const xl = xs[0];
    const xr = xs[k];
    const zf = zfBot;

    return {
      members: list,
      boards,
      casters: roda ? casterSet([xl, xr], [zb, zf], inch, bool(p, 'remRoda')) : [],
      W,
      D,
      H: H + (b > 0 ? b : 0),
      boardThick: 0,
    };
  },

  checks: (p) => {
    const out: ProductCheck[] = [];
    const W = num(p, 'panjang');
    const D = num(p, 'dalam');
    const H = num(p, 'tinggi');
    const n = num(p, 'tingkat');
    const gap = (H - num(p, 'tinggiBawah')) / Math.max(1, n - 1);
    const span = W / Math.max(1, num(p, 'kolom'));
    if (span > 100 && str(p, 'palang') !== '20x40')
      out.push({ level: 'warn', message: `Papan sepanjang ${Math.round(span)} cm di atas pipa 20×20 bisa melendut kalau diberi beban berat.`, fix: { label: 'Tambah 1 kolom', params: { kolom: Math.min(4, num(p, 'kolom') + 1) } } });
    const ratio = H / Math.max(1, D);
    if (ratio > 8)
      out.push({ level: 'warn', message: 'Rak sangat tinggi dan tipis, mudah terguling walau dipasang angkur.', fix: { label: `Kedalaman ${Math.ceil(H / 6)} cm`, params: { dalam: Math.min(80, Math.ceil(H / 6)) } } });
    else if (ratio > 4 && !bool(p, 'roda'))
      out.push({ level: 'info', message: 'Rak tinggi & ramping: pasang angkur / siku ke dinding supaya tidak terguling.' });
    if (ratio > 3 && bool(p, 'roda'))
      out.push({ level: 'warn', message: 'Rak tinggi beroda mudah terguling saat didorong.', fix: { label: 'Tanpa roda', params: { roda: false } } });
    if (gap < 18)
      out.push({ level: 'warn', message: `Jarak antar tingkat hanya ${Math.round(gap)} cm, barang sulit masuk.`, fix: { label: 'Kurangi 1 tingkat', params: { tingkat: Math.max(2, n - 1) } } });
    if (gap >= 25 && gap <= 35) out.push({ level: 'info', message: `Jarak antar tingkat ${Math.round(gap)} cm, pas untuk buku ukuran biasa.` });
    if (str(p, 'pipa') === '20' && H > 120)
      out.push({ level: 'warn', message: 'Tiang 20×20 terlalu ramping untuk rak setinggi ini.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
    return out;
  },
};
