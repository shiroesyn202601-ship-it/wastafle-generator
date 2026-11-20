import { Board, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, CASTER_LOAD, CASTER_OPTIONS, board, bool, casterHeight, casterSet, materialParams, memberFactory, num, r1, str } from './common';

/**
 * Troli: rak bertingkat di atas 4 roda, pegangan dorong di satu sisi.
 */
export const TROLI: ProductDef = {
  id: 'troli',
  name: 'Troli',
  tagline: 'dorong · saji · bengkel · salon',
  icon: 'M12 10h34M12 24h34M12 10v14M46 4v20M18 28a3 3 0 1 0 .1 0M40 28a3 3 0 1 0 .1 0',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['panjang', 'lebar', 'tinggiRak'] },
    { id: 'bentuk', title: 'Bentuk', keys: ['tingkat', 'pegangan', 'tinggiPegangan', 'palang'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Roda', keys: ['ukuranRoda', 'remRoda'] },
  ],
  params: [
    { key: 'panjang', label: 'Panjang', type: 'number', unit: 'cm', min: 35, max: 140, step: 1, marks: [{ value: 60, label: 'saji' }, { value: 90, label: 'bengkel' }] },
    { key: 'lebar', label: 'Lebar', type: 'number', unit: 'cm', min: 25, max: 80, step: 1, marks: [{ value: 40, label: 'saji' }, { value: 55, label: 'bengkel' }] },
    { key: 'tinggiRak', label: 'Tinggi rak paling atas', type: 'number', unit: 'cm', min: 40, max: 110, step: 1, help: 'Dari lantai sampai permukaan papan teratas.', marks: [{ value: 85, label: 'nyaman berdiri' }] },
    { key: 'tingkat', label: 'Jumlah rak', type: 'number', unit: 'rak', min: 1, max: 5, step: 1 },
    { key: 'pegangan', label: 'Pegangan dorong', type: 'toggle', help: 'Pipa pegangan di sisi kiri.' },
    { key: 'tinggiPegangan', label: 'Tinggi pegangan', type: 'number', unit: 'cm', min: 70, max: 115, step: 1, marks: [{ value: 97, label: 'ergonomis' }], showIf: (p) => p.pegangan === true },
    { key: 'palang', label: 'Pipa penyangga papan', type: 'choice', options: [{ value: '20x20', label: '20×20 mm', desc: 'Beban ringan' }, { value: '20x40', label: '20×40 mm', desc: 'Beban berat / panjang' }] },
    ...materialParams(true),
    { key: 'ukuranRoda', label: 'Ukuran roda', type: 'choice', options: CASTER_OPTIONS },
    { key: 'remRoda', label: 'Roda dengan rem', type: 'toggle', help: 'Troli tidak meluncur sendiri.' },
  ],
  defaults: {
    panjang: 70, lebar: 45, tinggiRak: 85, tingkat: 3, pegangan: true, tinggiPegangan: 97, palang: '20x20',
    pipa: '20', papan: 'multiplek', warna: '#1f2226', ukuranRoda: '3', remRoda: true,
  },
  presets: [
    { id: 'saji', name: 'Troli saji', desc: '70 × 45 cm, 3 rak, roda 3"', params: { panjang: 70, lebar: 45, tinggiRak: 85, tingkat: 3, pegangan: true, pipa: '20', papan: 'hpl', warna: '#e9e7e1', ukuranRoda: '3' } },
    { id: 'bengkel', name: 'Troli bengkel', desc: '90 × 55 cm, 3 rak, roda 4"', params: { panjang: 90, lebar: 55, tinggiRak: 85, tingkat: 3, pegangan: true, palang: '20x40', pipa: '30', papan: 'multiplek', ukuranRoda: '4', warna: '#7a3b2a' } },
    { id: 'dapur', name: 'Troli dapur ramping', desc: '45 × 30 cm, 4 rak', params: { panjang: 45, lebar: 30, tinggiRak: 90, tingkat: 4, pegangan: true, tinggiPegangan: 102, pipa: '20', papan: 'multiplek', ukuranRoda: '3' } },
    { id: 'barang', name: 'Troli barang (platform)', desc: '100 × 60 cm, 1 rak, roda 5"', params: { panjang: 100, lebar: 60, tinggiRak: 25, tingkat: 1, pegangan: true, tinggiPegangan: 95, palang: '20x40', pipa: '40', papan: 'multiplek', ukuranRoda: '5' } },
  ],
  summary: (p) => `${num(p, 'panjang')} × ${num(p, 'lebar')} cm · ${num(p, 'tingkat')} rak`,

  build: (p) => {
    const W = num(p, 'panjang', 70);
    const D = num(p, 'lebar', 45);
    const n = Math.max(1, Math.round(num(p, 'tingkat', 3)));
    const L = (parseInt(str(p, 'pipa', '20')) || 20) / 10;
    const rail: [number, number] = str(p, 'palang') === '20x40' ? [20, 40] : [20, 20];
    const rh = rail[1] / 10;
    const b = BOARD_THICK[str(p, 'papan', 'multiplek')] ?? 1.8;
    const inch = parseInt(str(p, 'ukuranRoda', '3')) || 3;
    const c = casterHeight(inch);
    const post: [number, number] = [L * 10, L * 10];
    const topSurface = Math.max(c + rh + b + 2, num(p, 'tinggiRak', 85));
    const postTop = topSurface - b; // ujung tiang = bidang bawah papan teratas
    const handle = bool(p, 'pegangan');
    const hh = Math.max(postTop + 5, num(p, 'tinggiPegangan', 97));

    const { list, add } = memberFactory();
    const xl = L / 2;
    const xr = W - L / 2;
    const zb = L / 2;
    const zf = D - L / 2;
    [
      [xl, zb, 'Tiang kiri belakang', handle],
      [xr, zb, 'Tiang kanan belakang', false],
      [xl, zf, 'Tiang kiri depan', handle],
      [xr, zf, 'Tiang kanan depan', false],
    ].forEach(([x, z, label, tall], i) => add(`tiang-${i}`, 'y', x as number, c, z as number, (tall ? hh : postTop) - c, 'post', label as string, post));
    if (handle) add('pegangan', 'z', xl, hh - L / 2, L, D - 2 * L, 'rail-z', 'Pegangan dorong', post);

    const yBottom = c + rh / 2;
    const yTopLvl = postTop - rh / 2;
    const boards: Board[] = [];
    for (let i = 0; i < n; i++) {
      const y = n === 1 ? yTopLvl : r1(yBottom + ((yTopLvl - yBottom) * i) / (n - 1));
      const t = i + 1;
      add(`r${t}-depan`, 'x', L, y, zf, W - 2 * L, 'rail-x', `Palang rak ${t} depan`, rail);
      add(`r${t}-belakang`, 'x', L, y, zb, W - 2 * L, 'rail-x', `Palang rak ${t} belakang`, rail);
      add(`r${t}-kiri`, 'z', xl, y, L, D - 2 * L, 'rail-z', `Palang rak ${t} kiri`, rail);
      add(`r${t}-kanan`, 'z', xr, y, L, D - 2 * L, 'rail-z', `Palang rak ${t} kanan`, rail);
      if (b > 0) boards.push(board(`papan-${t}`, `Papan rak ${t}`, L, W - L, y + rh / 2, y + rh / 2 + b, 0, D));
    }

    return {
      members: list,
      boards,
      casters: casterSet([xl, xr], [zb, zf], inch, bool(p, 'remRoda')),
      W,
      D,
      H: Math.max(topSurface, handle ? hh : 0),
      boardThick: 0,
    };
  },

  checks: (p) => {
    const out: ProductCheck[] = [];
    const W = num(p, 'panjang');
    const inch = parseInt(str(p, 'ukuranRoda', '3')) || 3;
    const top = num(p, 'tinggiRak');
    if (bool(p, 'pegangan') && num(p, 'tinggiPegangan') < top + 8)
      out.push({ level: 'warn', message: 'Pegangan hampir sejajar rak atas, tangan bisa terjepit barang.', fix: { label: `Pegangan ${top + 12} cm`, params: { tinggiPegangan: Math.min(115, top + 12) } } });
    if (W > 90 && str(p, 'palang') !== '20x40')
      out.push({ level: 'warn', message: 'Rak troli panjang di atas pipa 20×20 bisa melendut.', fix: { label: 'Pakai pipa 20×40', params: { palang: '20x40' } } });
    if (!bool(p, 'remRoda')) out.push({ level: 'info', message: 'Tanpa rem, troli bisa meluncur di lantai miring.', fix: { label: 'Pakai roda rem', params: { remRoda: true } } });
    out.push({ level: 'info', message: `Perkiraan kapasitas roda: ± ${CASTER_LOAD[inch] * 3} kg total (dihitung 3 roda menapak).` });
    return out;
  },
};
