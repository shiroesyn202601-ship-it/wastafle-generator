import { FrameMember } from '../types/kitchen';
import { Board, ProductBuild, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, board, bool, materialParams, memberFactory, num, str } from './common';

const JOK_OPTIONS = [
  { value: '#3f4a3c', label: 'Hijau zaitun' },
  { value: '#7a3b2a', label: 'Terakota' },
  { value: '#2b2d31', label: 'Hitam' },
  { value: '#b49a76', label: 'Krem' },
  { value: '#355c7d', label: 'Biru' },
];

/**
 * Rangka booth / sofa cafe: dudukan berbusa, sandaran tinggi miring.
 * Tunggal (menempel tembok) atau ganda punggung-ke-punggung (sandaran saling menempel di atas).
 * Bisa diberi meja bundar kecil yang menyatu dengan rangka: bertiang tegak berkaki rel lantai, atau
 * bertiang lengan L yang keluar dari rangka bawah dudukan (meja melayang, lantai tetap bebas).
 * Sudut L: booth utama + sayap menempel tembok samping, sandaran sayap menyambung ke tiang sandaran utama.
 * Berhadapan: dua booth saling menghadap + meja persegi di tengah, kaki meja berdiri di rel lantai yang
 * menyambung kaki depan kedua booth (satu set kaku, tidak bergeser).
 */
export const BOOTH: ProductDef = {
  id: 'booth',
  name: 'Booth / sofa cafe',
  tagline: 'tunggal · punggung · sudut L · berhadapan',
  icon: 'M6 36V8M6 24h22M28 24v12M54 36V8M54 24H32M32 24v12',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['sisi', 'panjang', 'panjangSudut', 'tinggiDudukan', 'dalamDudukan'] },
    { id: 'bentuk', title: 'Sandaran', keys: ['tinggiSandaran', 'miringSandaran', 'busa', 'warnaJok'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Meja', keys: ['mejaBooth', 'jumlahMejaBooth', 'diameterMejaBooth', 'lebarMejaHadap', 'tinggiMejaBooth'] },
  ],
  params: [
    {
      key: 'sisi',
      label: 'Jenis booth',
      type: 'choice',
      options: [
        { value: 'tunggal', label: 'Tunggal', desc: 'Menempel tembok, satu arah' },
        { value: 'ganda', label: 'Punggung-ke-punggung', desc: 'Dua sisi di tengah ruangan' },
        { value: 'sudut', label: 'Sudut L (pojok)', desc: 'Booth utama + sayap di tembok samping' },
        { value: 'hadap', label: 'Berhadapan + meja', desc: 'Dua booth saling menghadap, meja di tengah, satu set' },
      ],
    },
    { key: 'panjang', label: 'Panjang', type: 'number', unit: 'cm', min: 60, max: 300, step: 1, help: '±60 cm per orang.', marks: [{ value: 120, label: '2 orang' }, { value: 180, label: '3 orang' }] },
    { key: 'panjangSudut', label: 'Panjang sayap (tembok samping)', type: 'number', unit: 'cm', min: 60, max: 240, step: 1, help: 'Diukur dari depan dudukan booth utama.', showIf: (p) => p.sisi === 'sudut' },
    { key: 'tinggiDudukan', label: 'Tinggi dudukan (dengan busa)', type: 'number', unit: 'cm', min: 40, max: 50, step: 1, marks: [{ value: 46, label: 'standar' }] },
    { key: 'dalamDudukan', label: 'Kedalaman dudukan', type: 'number', unit: 'cm', min: 40, max: 60, step: 1, marks: [{ value: 48, label: 'umum' }] },
    { key: 'tinggiSandaran', label: 'Tinggi sandaran dari lantai', type: 'number', unit: 'cm', min: 80, max: 140, step: 1, marks: [{ value: 90, label: 'standar' }, { value: 107, label: 'tinggi' }, { value: 122, label: 'privat' }] },
    { key: 'miringSandaran', label: 'Kemiringan sandaran', type: 'number', unit: '°', min: 0, max: 15, step: 1, marks: [{ value: 10, label: 'nyaman' }], showIf: (p) => p.sisi !== 'sudut' },
    { key: 'busa', label: 'Busa & jok', type: 'toggle', help: 'Gambar busa dudukan & sandaran (dibuat tukang jok).' },
    { key: 'warnaJok', label: 'Warna jok', type: 'choice', options: JOK_OPTIONS, showIf: (p) => p.busa === true },
    ...materialParams(true),
    {
      key: 'mejaBooth',
      label: 'Meja bundar menyatu',
      type: 'choice',
      showIf: (p) => p.sisi !== 'hadap',
      options: [
        { value: 'none', label: 'Tanpa meja' },
        { value: 'tiang', label: 'Tiang tegak', desc: 'Tiang ke lantai, dirangkai rel ke booth' },
        { value: 'lengan', label: 'Tiang lengan L', desc: 'Keluar dari rangka bawah dudukan, meja melayang' },
      ],
    },
    { key: 'jumlahMejaBooth', label: 'Jumlah meja', type: 'number', min: 1, max: 4, step: 1, showIf: (p) => p.sisi !== 'hadap' && (p.mejaBooth === 'tiang' || p.mejaBooth === 'lengan') },
    { key: 'diameterMejaBooth', label: 'Diameter meja', type: 'number', unit: 'cm', min: 35, max: 70, step: 1, marks: [{ value: 50, label: 'umum' }], showIf: (p) => p.sisi !== 'hadap' && (p.mejaBooth === 'tiang' || p.mejaBooth === 'lengan') },
    { key: 'lebarMejaHadap', label: 'Lebar meja tengah', type: 'number', unit: 'cm', min: 50, max: 90, step: 1, marks: [{ value: 70, label: 'umum' }], showIf: (p) => p.sisi === 'hadap' },
    { key: 'tinggiMejaBooth', label: 'Tinggi meja', type: 'number', unit: 'cm', min: 55, max: 80, step: 1, marks: [{ value: 65, label: 'santai' }, { value: 75, label: 'makan' }], showIf: (p) => p.sisi === 'hadap' || p.mejaBooth === 'tiang' || p.mejaBooth === 'lengan' },
  ],
  defaults: { panjangSudut: 120, lebarMejaHadap: 70, mejaBooth: 'none', jumlahMejaBooth: 2, diameterMejaBooth: 50, tinggiMejaBooth: 65, sisi: 'tunggal', panjang: 120, tinggiDudukan: 46, dalamDudukan: 48, tinggiSandaran: 100, miringSandaran: 10, busa: true, warnaJok: '#3f4a3c', pipa: '30', papan: 'kayu', warna: '#1f2226' },
  groups: [
    { id: 'sofa', name: 'Booth / sofa', desc: 'menempel tembok · tengah ruangan · pojok' },
    { id: 'meja', name: 'Booth + meja menyatu', desc: 'meja ikut dirangkai ke rangka booth' },
  ],
  // Struktur: jenis booth + jenis meja menyatu (busa, warna jok, ukuran tidak mengubah rangka)
  signature: (p) => (str(p, 'sisi') === 'hadap' ? 'hadap' : `${str(p, 'sisi', 'tunggal')}|${str(p, 'mejaBooth', 'none')}`),
  presets: [
    {
      id: 'tunggal',
      group: 'sofa',
      name: 'Booth tunggal menempel tembok',
      desc: 'satu dudukan, sandaran miring',
      params: { sisi: 'tunggal', mejaBooth: 'none' },
      sizes: [
        { label: '2 orang', desc: '120 cm, sandaran 100', params: { panjang: 120, tinggiSandaran: 100 } },
        { label: '3 orang', desc: '180 cm, sandaran 107', params: { panjang: 180, tinggiSandaran: 107 } },
        { label: 'Panjang sepanjang tembok', desc: '240 cm, sandaran 90', params: { panjang: 240, tinggiSandaran: 90 } },
        { label: 'Bangku booth kantin (tanpa busa)', desc: '180 cm, dudukan papan', params: { panjang: 180, busa: false, tinggiSandaran: 90, miringSandaran: 8 } },
      ],
    },
    {
      id: 'ganda',
      group: 'sofa',
      name: 'Booth punggung-ke-punggung',
      desc: 'dua dudukan berbagi sandaran tengah',
      params: { sisi: 'ganda', mejaBooth: 'none' },
      sizes: [
        { label: '2 + 2 orang', desc: '120 cm, sandaran 107', params: { panjang: 120, tinggiSandaran: 107 } },
        { label: 'Privat tinggi', desc: '150 cm, sandaran 122', params: { panjang: 150, tinggiSandaran: 122, miringSandaran: 8 } },
        { label: '3 + 3 orang', desc: '180 cm, sandaran 100', params: { panjang: 180, tinggiSandaran: 100 } },
      ],
    },
    {
      id: 'sudut',
      group: 'sofa',
      name: 'Booth sudut L (pojok)',
      desc: 'booth utama + sayap di tembok samping, sandaran tegak bersambung',
      params: { sisi: 'sudut', mejaBooth: 'none', panjang: 180, panjangSudut: 120, tinggiSandaran: 95 },
      sizes: [
        { label: '180 + 120 cm', desc: '±5 orang', params: { panjang: 180, panjangSudut: 120 } },
        { label: '150 + 100 cm', desc: 'pojok kecil, ±4 orang', params: { panjang: 150, panjangSudut: 100 } },
        { label: '240 + 150 cm', desc: 'pojok besar, ±6 orang', params: { panjang: 240, panjangSudut: 150 } },
      ],
    },
    {
      id: 'meja-lengan',
      group: 'meja',
      name: 'Booth + meja bundar lengan L',
      desc: 'meja melayang di tiang lengan L dari rangka bawah dudukan',
      params: { sisi: 'tunggal', mejaBooth: 'lengan', jumlahMejaBooth: 2, diameterMejaBooth: 50, tinggiMejaBooth: 65, panjang: 160 },
      sizes: [
        { label: '2 meja, 160 cm', desc: 'ø50, tinggi 65', params: { panjang: 160, jumlahMejaBooth: 2 } },
        { label: '1 meja, 100 cm', desc: 'ø55, tinggi 70', params: { panjang: 100, jumlahMejaBooth: 1, diameterMejaBooth: 55, tinggiMejaBooth: 70 } },
        { label: '3 meja, 240 cm', desc: 'ø50, tinggi 65', params: { panjang: 240, jumlahMejaBooth: 3 } },
      ],
    },
    {
      id: 'meja-tiang',
      group: 'meja',
      name: 'Booth + meja bundar tiang tegak',
      desc: 'tiang meja ke lantai, kaki silang dirangkai rel ke kaki booth',
      params: { sisi: 'tunggal', mejaBooth: 'tiang', jumlahMejaBooth: 2, diameterMejaBooth: 55, tinggiMejaBooth: 70, panjang: 160 },
      sizes: [
        { label: '2 meja, 160 cm', desc: 'ø55, tinggi 70', params: { panjang: 160, jumlahMejaBooth: 2 } },
        { label: '1 meja makan, 120 cm', desc: 'ø70, tinggi 75', params: { panjang: 120, jumlahMejaBooth: 1, diameterMejaBooth: 70, tinggiMejaBooth: 75 } },
        { label: '3 meja, 240 cm', desc: 'ø55, tinggi 70', params: { panjang: 240, jumlahMejaBooth: 3 } },
      ],
    },
    {
      id: 'hadap',
      group: 'meja',
      name: 'Booth berhadapan + meja tengah (satu set)',
      desc: 'dua booth saling menghadap, kaki meja di rel lantai penyambung',
      params: { sisi: 'hadap', panjang: 120, lebarMejaHadap: 70, tinggiMejaBooth: 72, tinggiSandaran: 107 },
      sizes: [
        { label: '2 + 2 orang', desc: '120 cm, meja 70', params: { panjang: 120 } },
        { label: '3 + 3 orang', desc: '180 cm, meja 75', params: { panjang: 180, lebarMejaHadap: 75 } },
        { label: 'Privat tinggi', desc: '140 cm, sandaran 122', params: { panjang: 140, tinggiSandaran: 122 } },
      ],
    },
  ],
  summary: (p) => {
    const sisi = str(p, 'sisi', 'tunggal');
    const nm = sisi === 'ganda' ? 'Ganda' : sisi === 'sudut' ? `Sudut L ${num(p, 'panjang')} + ${num(p, 'panjangSudut')} cm` : sisi === 'hadap' ? 'Berhadapan + meja' : 'Tunggal';
    const meja = sisi !== 'hadap' && str(p, 'mejaBooth', 'none') !== 'none' ? ` · ${num(p, 'jumlahMejaBooth')} meja ø${num(p, 'diameterMejaBooth')}` : '';
    return `${nm}${sisi === 'sudut' ? '' : ` · ${num(p, 'panjang')} cm`}, sandaran ${num(p, 'tinggiSandaran')} cm${meja}`;
  },

  build: (p) => {
    const W = num(p, 'panjang', 120);
    const D = num(p, 'dalamDudukan', 48);
    const Hs = num(p, 'tinggiDudukan', 46);
    const Hb = num(p, 'tinggiSandaran', 100);
    const sisi = str(p, 'sisi', 'tunggal');
    const tilt = sisi === 'sudut' ? 0 : num(p, 'miringSandaran', 10); // sudut L: sandaran tegak supaya kedua sisi bertemu rapi
    const tanT = Math.tan((tilt * Math.PI) / 180);
    const L = (parseInt(str(p, 'pipa', '30')) || 30) / 10;
    const b = BOARD_THICK[str(p, 'papan', 'multiplek')] ?? 1.8;
    const foam = bool(p, 'busa') ? 10 : 0;
    const jok = str(p, 'warnaJok', '#3f4a3c');
    const deckTop = Hs - foam;
    const yS = deckTop - b; // ujung atas rangka dudukan
    const zs = tanT * (Hb - yS); // geser ke depan supaya sandaran miring tidak keluar ke belakang
    const rail: [number, number] = [20, 20];
    const post: [number, number] = [L * 10, L * 10];
    const tableMode = sisi === 'hadap' ? 'none' : str(p, 'mejaBooth', 'none');
    const nT = tableMode === 'none' ? 0 : Math.max(1, Math.round(num(p, 'jumlahMejaBooth', 2)));
    const dT = num(p, 'diameterMejaBooth', 50);
    const hT = Math.max(Hs + 10, num(p, 'tinggiMejaBooth', 65));
    const ext = nT ? dT * 0.75 : 0; // meja menjorok ke depan dudukan

    /** Satu sisi booth menghadap +z, sandaran di z kecil */
    const side = (prefix: string, W: number, withTables: boolean) => {
      const { list, add, line } = memberFactory();
      const boards: Board[] = [];
      const n = Math.max(2, Math.ceil(W / 80) + 1);
      const xs = Array.from({ length: n }, (_, i) => L / 2 + ((W - L) * i) / (n - 1));
      const zb = zs + L / 2;
      const zf = zs + D - L / 2;
      const zBack = (y: number) => zb - tanT * (y - yS);
      xs.forEach((x, i) => {
        add(`${prefix}kaki-d-${i}`, 'y', x, 0, zf, yS, 'post', `Kaki depan ${i + 1}`, post);
        if (tilt === 0) add(`${prefix}tiang-b-${i}`, 'y', x, 0, zb, Hb, 'post', `Tiang sandaran ${i + 1}`, post);
        else {
          add(`${prefix}kaki-b-${i}`, 'y', x, 0, zb, yS, 'post', `Kaki belakang ${i + 1}`, post);
          line(`${prefix}tiang-b-${i}`, [x, yS, zb], [x, Hb, zBack(Hb)], 'post', `Tiang sandaran ${i + 1}`, post);
        }
        add(`${prefix}palang-dudukan-${i}`, 'z', x, yS - 1, zb + L / 2, zf - zb - L, 'rail-z', `Palang dudukan ${i + 1}`, rail);
      });
      /** Gelagar memanjang dipotong per bentang: tiap potong menempel rata di sisi tiang kiri-kanannya (tidak menembus tiang) */
      const span = (id: string, y: number, z: number, label: string) =>
        xs.slice(1).forEach((x, i) => add(`${id}-${i}`, 'x', xs[i] + L / 2, y, z, x - xs[i] - L, 'rail-x', label, rail));
      span(`${prefix}gelagar-d`, yS - 1, zf, 'Gelagar dudukan depan');
      span(`${prefix}gelagar-b`, yS - 1, zb, 'Gelagar dudukan belakang');
      span(`${prefix}bawah-d`, 8, zf, 'Gelagar bawah depan');
      span(`${prefix}bawah-b`, 8, zb, 'Gelagar bawah belakang');
      const yTopRail = Hb - 1;
      const yMid = (yS + Hb) / 2;
      span(`${prefix}sandaran-atas`, yTopRail, zBack(yTopRail), 'Gelagar sandaran atas');
      span(`${prefix}sandaran-tengah`, yMid, zBack(yMid), 'Gelagar sandaran tengah');

      if (b > 0) boards.push(board(`${prefix}alas`, 'Alas dudukan', 0, W, yS, deckTop, zs, zs + D));
      // Papan sandaran (penutup belakang busa), miring
      const hgt = (Hb - (yS + 4)) / Math.cos((tilt * Math.PI) / 180);
      const ym = (Hb + yS + 4) / 2;
      const zc = zBack(ym) + 1 + 0.9;
      if (b > 0) boards.push({ ...board(`${prefix}papan-sandaran`, 'Papan sandaran', 0, W, ym - hgt / 2, ym + hgt / 2, zc - 0.9, zc + 0.9), rotX: -tilt });
      // Meja bundar menyatu di depan dudukan
      if (nT && withTables) {
        const zc = zs + D + dT * 0.25; // tepi belakang meja sedikit menutupi dudukan
        const tb = Math.max(b, 2.5);
        const yTrail = hT - tb - 1;
        for (let t = 0; t < nT; t++) {
          const xc = (W * (t + 0.5)) / nT;
          const tag = nT > 1 ? ` ${t + 1}` : '';
          if (tableMode === 'tiang') {
            // tiang berdiri di atas rel lantai, berhenti di bawah palang daun meja
            add(`${prefix}meja-tiang-${t}`, 'y', xc, L, zc, yTrail - 1 - L, 'post', `Tiang meja${tag}`, post);
            // rel lantai mulai dari muka depan deret kaki depan booth
            add(`${prefix}meja-rel-${t}`, 'z', xc, L / 2, zf + L / 2, zc - zf - L / 2 + dT * 0.3, 'rail-z', `Rel lantai meja${tag}`, post);
            // kaki silang dipotong dua, dilas di kedua sisi rel
            const kk = dT * 0.3 - L / 2;
            add(`${prefix}meja-kaki-${t}`, 'x', xc - dT * 0.3, L / 2, zc, kk, 'rail-x', `Kaki silang meja${tag}`, post);
            add(`${prefix}meja-kaki-${t}-b`, 'x', xc + L / 2, L / 2, zc, kk, 'rail-x', `Kaki silang meja${tag}`, post);
          } else {
            // lengan L: dari gelagar bawah depan mendatar ke depan, lalu naik ke bawah meja
            const yArm = 8;
            // lengan menempel rata di muka gelagar bawah depan (2 cm), atau di muka kaki depan bila segaris kaki;
            // ujungnya rata sisi luar tiang meja
            const z0 = zf + (xs.some((x) => Math.abs(x - xc) < L) ? L / 2 : 1);
            add(`${prefix}meja-lengan-${t}`, 'z', xc, yArm, z0, zc + L / 2 - z0, 'rail-z', `Lengan meja${tag}`, post);
            add(`${prefix}meja-tiang-${t}`, 'y', xc, yArm + L / 2, zc, yTrail - 1 - yArm - L / 2, 'post', `Tiang meja${tag}`, post);
          }
          add(`${prefix}meja-dudukan-${t}`, 'x', xc - dT * 0.3, yTrail, zc, dT * 0.6, 'rail-x', `Palang bawah meja${tag}`, rail);
          const tbd = board(`${prefix}meja-${t}`, `Daun meja bundar${tag}`, xc - dT / 2, xc + dT / 2, hT - tb, hT, zc - dT / 2, zc + dT / 2);
          tbd.shape = 'round';
          boards.push(tbd);
        }
      }
      if (foam) {
        boards.push({ ...board(`${prefix}busa-dudukan`, 'Busa dudukan', 1, W - 1, deckTop, Hs, zs + 6, zs + D), color: jok });
        const fh = (Hb - 3 - (Hs + 1)) / Math.cos((tilt * Math.PI) / 180);
        const fm = (Hb - 3 + Hs + 1) / 2;
        const fz = zBack(fm) + 1 + 1.8 + 4;
        boards.push({ ...board(`${prefix}busa-sandaran`, 'Busa sandaran', 1, W - 1, fm - fh / 2, fm + fh / 2, fz - 4, fz + 4), rotX: -tilt, color: jok });
      }
      return { list, boards };
    };

    const D0 = zs + D; // depan dudukan
    if (sisi === 'sudut') return buildSudut(side('', W, true), side('s-', Math.max(40, num(p, 'panjangSudut', 120)), false), { W, D0, D1: D0 + ext, Hb, L, foam: foam > 0 });
    if (sisi === 'hadap') {
      const a = side('', W, false);
      const B0 = side('b-', W, false);
      return buildHadap(a, B0, { W, D0, L, Hb, Hs, b, lt: num(p, 'lebarMejaHadap', 70), hT, xEnd: L / 2 });
    }
    const a = side('', W, true);
    const D1 = D0 + ext;
    if (sisi !== 'ganda') return { members: a.list, boards: a.boards, casters: [], W, D: D1, H: Hb, boardThick: 0, wall: true };

    // Ganda: sisi A dicerminkan (menghadap −z), sisi B digeser; sandaran keduanya bertemu di tengah
    const A = a.list.map((m) => ({ ...mirrorZ(m, D1), id: `a-${m.id}` }));
    const Ab = a.boards.map((bd) => mirrorBoard(bd, D1, 'a-'));
    const sB = side('b-', W, true);
    const B = sB.list.map((m) => (m.end ? { ...m, z: m.z + D1, end: { ...m.end, z: m.end.z + D1 } } : { ...m, z: m.z + D1 }));
    const Bb = sB.boards.map((bd) => ({ ...bd, box: { min: [bd.box.min[0], bd.box.min[1], bd.box.min[2] + D1] as [number, number, number], max: [bd.box.max[0], bd.box.max[1], bd.box.max[2] + D1] as [number, number, number] } }));
    return { members: [...A, ...B], boards: [...Ab, ...Bb], casters: [], W, D: 2 * D1, H: Hb, boardThick: 0 };
  },

  checks: (p) => {
    const out: ProductCheck[] = [];
    const sisi = str(p, 'sisi', 'tunggal');
    const nT = sisi === 'hadap' || str(p, 'mejaBooth', 'none') === 'none' ? 0 : num(p, 'jumlahMejaBooth');
    if (nT && sisi === 'sudut' && num(p, 'panjang') / nT / 2 - num(p, 'diameterMejaBooth') / 2 < num(p, 'dalamDudukan') + 10)
      out.push({ level: 'warn', message: 'Meja pertama terlalu dekat ke sayap booth: kaki orang di sayap terhalang.', fix: { label: 'Tanpa meja', params: { mejaBooth: 'none' } } });
    if (sisi === 'sudut' && num(p, 'panjangSudut') > 160 && str(p, 'pipa') === '20')
      out.push({ level: 'warn', message: 'Sayap panjang dengan pipa 20×20 terasa goyang.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
    if (sisi === 'hadap') {
      const g = num(p, 'tinggiMejaBooth') - num(p, 'tinggiDudukan');
      if (g < 22 || g > 32) out.push({ level: 'warn', message: `Selisih meja ke dudukan ${g} cm. Yang nyaman 25–30 cm.`, fix: { label: 'Meja 72 cm', params: { tinggiMejaBooth: 72, tinggiDudukan: 46 } } });
      if (num(p, 'panjang') > 180) out.push({ level: 'warn', message: 'Meja tengah lebih dari 180 cm hanya ditopang di kedua ujung: rawan melendut.', fix: { label: 'Panjang 180 cm', params: { panjang: 180 } } });
    }
    if (nT && num(p, 'panjang') / nT < num(p, 'diameterMejaBooth') + 15)
      out.push({ level: 'warn', message: 'Meja terlalu rapat: daun meja saling bersentuhan.', fix: { label: 'Kurangi 1 meja', params: { jumlahMejaBooth: Math.max(1, nT - 1) } } });
    if (nT && str(p, 'mejaBooth') === 'lengan' && num(p, 'diameterMejaBooth') > 60)
      out.push({ level: 'warn', message: 'Meja lengan selebar ini mudah melendut; pakai tiang tegak atau diameter ≤ 60 cm.', fix: { label: 'Diameter 55 cm', params: { diameterMejaBooth: 55 } } });
    if (num(p, 'panjang') > 160 && str(p, 'pipa') === '20') out.push({ level: 'warn', message: 'Booth panjang dengan pipa 20×20 terasa goyang saat diduduki banyak orang.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
    out.push({ level: 'info', message: `Muat ±${Math.max(1, Math.floor(num(p, 'panjang') / 60))} orang per sisi. Meja di depan booth: tinggi 75 cm, tepi meja menutupi dudukan ±5 cm.` });
    if (sisi === 'hadap') out.push({ level: 'info', message: 'Rel lantai menyambung kaki depan kedua booth dan kaki meja, jadi satu set tidak bergeser. Rel setinggi pipa, aman dilangkahi.' });
    if (sisi === 'ganda') out.push({ level: 'info', message: 'Jarak antar booth berhadapan (dengan meja 70 cm di tengah) sekitar 170–190 cm.' });
    out.push({ level: 'info', message: 'Busa & kain jok dikerjakan tukang jok; rangka besi sebaiknya galvanis / cat dasar anti karat.' });
    return out;
  },
};

type Side = { list: FrameMember[]; boards: Board[] };
type V3 = [number, number, number];

/** Cermin terhadap bidang z = total/2 (sisi booth berbalik arah) */
const mirrorZ = (m: FrameMember, total: number): FrameMember => {
  if (m.end) return { ...m, z: total - m.z, end: { ...m.end, z: total - m.end.z } };
  if (m.axis === 'z') return { ...m, z: total - m.z - m.length };
  return { ...m, z: total - m.z };
};
const mirrorBoard = (bd: Board, total: number, prefix: string): Board => ({
  ...bd,
  id: `${prefix}${bd.id}`,
  rotX: bd.rotX ? -bd.rotX : undefined,
  box: { min: [bd.box.min[0], bd.box.min[1], total - bd.box.max[2]] as V3, max: [bd.box.max[0], bd.box.max[1], total - bd.box.min[2]] as V3 },
});
/** Tukar sumbu x ↔ z (sisi booth menghadap +x, sandaran di tembok kiri), lalu geser dz ke depan */
const swapXZ = (m: FrameMember, dz: number): FrameMember => {
  const axis = m.axis === 'x' ? 'z' : m.axis === 'z' ? 'x' : m.axis;
  const out: FrameMember = { ...m, axis, x: m.z, z: m.x + dz };
  if (m.end) out.end = { x: m.end.z, y: m.end.y, z: m.end.x + dz };
  return out;
};

/** Booth sudut L: booth utama di tembok belakang + sayap di tembok kiri, mulai dari depan dudukan utama */
function buildSudut(main: Side, wing: Side, d: { W: number; D0: number; D1: number; Hb: number; L: number; foam: boolean }): ProductBuild {
  const { W, D0, D1, Hb, L } = d;
  let Ws = 0;
  const wm: FrameMember[] = [];
  wing.list.forEach((m) => {
    const s = swapXZ(m, D0);
    if (m.axis === 'x') Ws = Math.max(Ws, m.x + m.length + L); // potong gelagar terakhir berhenti di sisi dalam tiang ujung
    wm.push({ ...s, label: `${m.label} (sayap)` });
    // sandaran sayap disambung sampai sisi tiang sandaran utama: potongan penyambung dari muka tiang utama
    // (z = L) sampai muka tiang sandaran sayap pertama (z = D0)
    if (m.id === 's-sandaran-atas-0' || m.id === 's-sandaran-tengah-0')
      wm.push({ ...s, id: `${m.id}-sambung`, z: L, length: D0 - L, label: `${m.label} (sayap)` });
  });
  const wb = wing.boards.map((bd): Board => {
    const min: V3 = [bd.box.min[2], bd.box.min[1], bd.box.min[0] + D0];
    const max: V3 = [bd.box.max[2], bd.box.max[1], bd.box.max[0] + D0];
    if (bd.id === 's-papan-sandaran') min[2] = L / 2 + 2.8; // menempel muka papan sandaran utama
    if (bd.id === 's-busa-sandaran') min[2] = L / 2 + 10.8; // menempel muka busa sandaran utama
    return { ...bd, rotX: undefined, box: { min, max } };
  });
  return { members: [...main.list, ...wm], boards: [...main.boards, ...wb], casters: [], W, D: Math.max(D1, D0 + Ws), H: Hb, boardThick: 0, wall: true };
}

/** Dua booth berhadapan + meja persegi di tengah; kaki meja di rel lantai yang menyambung kaki depan kedua booth */
function buildHadap(a: Side, b0: Side, d: { W: number; D0: number; L: number; Hb: number; Hs: number; b: number; lt: number; hT: number; xEnd: number }): ProductBuild {
  const { W, D0, L, Hb, b, lt, hT } = d;
  const zT0 = D0 - 5; // tepi meja menutupi dudukan ±5 cm
  const zT1 = zT0 + lt;
  const Dt = zT1 - 5 + D0;
  const B = b0.list.map((m) => mirrorZ(m, Dt));
  const Bb = b0.boards.map((bd) => mirrorBoard(bd, Dt, ''));
  const { list, add } = memberFactory();
  const post: [number, number] = [L * 10, L * 10];
  const rail: [number, number] = [20, 40];
  const yR = hT - b - 2; // as palang bawah daun meja
  const zf = D0 - L / 2; // as kaki depan booth
  const zc = (zT0 + zT1) / 2;
  [L / 2, W - L / 2].forEach((x, i) => {
    const n = i ? 'kanan' : 'kiri';
    add(`meja-rel-${n}`, 'z', x, L / 2, zf + L / 2, Dt - 2 * zf - L, 'rail-z', `Rel lantai meja ${n}`, post);
    add(`meja-kaki-${n}`, 'y', x, L, zc, yR - 2 - L, 'post', `Kaki meja ${n}`, post);
    add(`meja-palang-${n}`, 'z', x, yR, zT0 + 3, lt - 6, 'rail-z', `Palang ujung meja ${n}`, rail);
  });
  add('meja-gelagar-b', 'x', L / 2 + 1, yR, zT0 + 4, W - L - 2, 'rail-x', 'Gelagar meja belakang', rail);
  add('meja-gelagar-d', 'x', L / 2 + 1, yR, zT1 - 4, W - L - 2, 'rail-x', 'Gelagar meja depan', rail);
  const boards = [...a.boards, ...Bb];
  if (b > 0) boards.push(board('meja-tengah', 'Daun meja tengah', 0, W, hT - b, hT, zT0, zT1));
  return { members: [...a.list, ...B, ...list], boards, casters: [], W, D: Dt, H: Hb, boardThick: 0 };
}
