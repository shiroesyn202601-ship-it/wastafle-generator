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
    { id: 'bentuk', title: 'Bentuk', keys: ['tingkat', 'tinggiBawah', 'palang'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Tambahan', keys: ['roda', 'ukuranRoda', 'remRoda'] },
  ],
  params: [
    { key: 'panjang', label: 'Panjang', type: 'number', unit: 'cm', min: 30, max: 200, step: 1, help: 'Lebar rak dilihat dari depan.', marks: [{ value: 60, label: 'sepatu' }, { value: 80, label: 'buku' }, { value: 120, label: 'gudang' }] },
    { key: 'dalam', label: 'Kedalaman', type: 'number', unit: 'cm', min: 15, max: 80, step: 1, help: 'Jarak depan ke belakang.', marks: [{ value: 30, label: 'buku / sepatu' }, { value: 50, label: 'gudang' }] },
    { key: 'tinggi', label: 'Tinggi rangka', type: 'number', unit: 'cm', min: 30, max: 220, step: 1, help: 'Dari lantai sampai ujung atas tiang.', marks: [{ value: 75, label: 'sepatu' }, { value: 180, label: 'buku' }, { value: 200, label: 'gudang' }] },
    { key: 'tingkat', label: 'Jumlah tingkat', type: 'number', unit: 'tingkat', min: 2, max: 8, step: 1, help: 'Termasuk tingkat paling bawah dan paling atas.' },
    { key: 'tinggiBawah', label: 'Tinggi tingkat terbawah', type: 'number', unit: 'cm', min: 3, max: 40, step: 1, help: 'Jarak dari lantai, supaya mudah disapu.' },
    { key: 'palang', label: 'Pipa penyangga papan', type: 'choice', options: [{ value: '20x20', label: '20×20 mm', desc: 'Ringan, ±50 kg per tingkat sampai 100 cm' }, { value: '20x40', label: '20×40 mm', desc: 'Kuat, untuk rak panjang / berat' }] },
    ...materialParams(true),
    { key: 'roda', label: 'Pakai roda', type: 'toggle', help: 'Rak bisa dipindah-pindah.' },
    { key: 'ukuranRoda', label: 'Ukuran roda', type: 'choice', options: CASTER_OPTIONS, showIf: (p) => p.roda === true },
    { key: 'remRoda', label: 'Roda dengan rem', type: 'toggle', showIf: (p) => p.roda === true },
  ],
  defaults: {
    panjang: 80, dalam: 30, tinggi: 180, tingkat: 5, tinggiBawah: 8, palang: '20x20',
    pipa: '30', papan: 'multiplek', warna: '#1f2226', roda: false, ukuranRoda: '3', remRoda: true,
  },
  presets: [
    {
      id: 'susun',
      name: 'Rak susun',
      desc: '4 tiang, papan di setiap tingkat',
      params: { roda: false },
      sizes: [
        { label: 'Buku', desc: '80 × 30 × 180 cm, 5 tingkat', params: { panjang: 80, dalam: 30, tinggi: 180, tingkat: 5, tinggiBawah: 8, palang: '20x20', pipa: '30', papan: 'kayu' } },
        { label: 'Gudang', desc: '120 × 50 × 200 cm, 4 tingkat', params: { panjang: 120, dalam: 50, tinggi: 200, tingkat: 4, tinggiBawah: 10, palang: '20x40', pipa: '40', papan: 'multiplek', warna: '#6b7078' } },
        { label: 'Sepatu', desc: '80 × 32 × 75 cm, 4 tingkat', params: { panjang: 80, dalam: 32, tinggi: 75, tingkat: 4, tinggiBawah: 5, palang: '20x20', pipa: '20', papan: 'multiplek' } },
        { label: 'Dapur / microwave', desc: '60 × 40 × 120 cm, 3 tingkat', params: { panjang: 60, dalam: 40, tinggi: 120, tingkat: 3, tinggiBawah: 10, palang: '20x20', pipa: '30', papan: 'hpl', warna: '#e9e7e1' } },
        { label: 'Display cafe', desc: '100 × 35 × 160 cm, 4 tingkat', params: { panjang: 100, dalam: 35, tinggi: 160, tingkat: 4, tinggiBawah: 10, palang: '20x20', pipa: '30', papan: 'kayu' } },
      ],
    },
    {
      id: 'beroda',
      name: 'Rak susun beroda',
      desc: 'rak pendek dengan 4 roda rem',
      params: { roda: true, remRoda: true },
      sizes: [
        { label: 'Rak dapur dorong', desc: '60 × 40 × 90 cm, 3 tingkat', params: { panjang: 60, dalam: 40, tinggi: 90, tingkat: 3, tinggiBawah: 5, palang: '20x20', pipa: '30', papan: 'hpl', ukuranRoda: '3' } },
        { label: 'Rak gudang dorong', desc: '100 × 50 × 120 cm, 3 tingkat', params: { panjang: 100, dalam: 50, tinggi: 120, tingkat: 3, tinggiBawah: 5, palang: '20x40', pipa: '40', papan: 'multiplek', ukuranRoda: '4' } },
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

    const { list, add } = memberFactory();
    const xl = L / 2;
    const xr = W - L / 2;
    const zb = L / 2;
    const zf = D - L / 2;
    [
      [xl, zb, 'Tiang kiri belakang'],
      [xr, zb, 'Tiang kanan belakang'],
      [xl, zf, 'Tiang kiri depan'],
      [xr, zf, 'Tiang kanan depan'],
    ].forEach(([x, z, label], i) => add(`tiang-${i}`, 'y', x as number, c, z as number, H - c, 'post', label as string, post));

    const yBottom = c + Math.max(num(p, 'tinggiBawah', 8), rh / 2);
    const yTopLvl = H - rh / 2;
    const boards: Board[] = [];
    for (let i = 0; i < n; i++) {
      const y = r1(yBottom + ((yTopLvl - yBottom) * i) / (n - 1));
      const t = i + 1;
      add(`t${t}-depan`, 'x', L, y, zf, W - 2 * L, 'rail-x', `Palang tingkat ${t} depan`, rail);
      add(`t${t}-belakang`, 'x', L, y, zb, W - 2 * L, 'rail-x', `Palang tingkat ${t} belakang`, rail);
      add(`t${t}-kiri`, 'z', xl, y, L, D - 2 * L, 'rail-z', `Palang tingkat ${t} kiri`, rail);
      add(`t${t}-kanan`, 'z', xr, y, L, D - 2 * L, 'rail-z', `Palang tingkat ${t} kanan`, rail);
      if (b > 0) boards.push(board(`papan-${t}`, `Papan tingkat ${t}`, L, W - L, y + rh / 2, y + rh / 2 + b, 0, D));
    }

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
    if (W > 100 && str(p, 'palang') !== '20x40')
      out.push({ level: 'warn', message: `Papan sepanjang ${W} cm di atas pipa 20×20 bisa melendut kalau diberi beban berat.`, fix: { label: 'Pakai pipa 20×40', params: { palang: '20x40' } } });
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
