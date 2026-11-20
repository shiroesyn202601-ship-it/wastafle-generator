import { Board, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, board, bool, materialParams, memberFactory, num, str } from './common';

const SANDARAN_OK = (p: Record<string, unknown>) => p.model === 'kotak' || p.model === 'kanopi';

/**
 * Dipan / ranjang besi. Kepala di z = 0. Bentuk rangka:
 * - kotak: rangka keliling + bilah alas, kaki sudut & kaki tengah; sandaran kepala / kaki opsional
 * - melayang: platform rendah, alas bertumpu di rangka dasar yang masuk ke dalam (kaki tidak terlihat)
 * - kanopi: empat tiang tinggi di sudut dengan rangka atas keliling (four-poster)
 * - kaki-v: kaki miring bentuk V (gaya hairpin) di sisi panjang, dekat sudut & di tengah
 * - tingkat: dua alas bertumpuk di empat tiang tinggi, tangga di sisi kaki, pagar pengaman atas
 * - daybed: dipan duduk dengan pagar jeruji di tiga sisi (kepala, kaki, belakang)
 */
export const DIPAN: ProductDef = {
  id: 'dipan',
  name: 'Dipan / ranjang',
  tagline: 'single · queen · king · kos · tingkat',
  icon: 'M6 10v26M54 22v14M6 22h48M6 30h48M6 14h10',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['model', 'lebar', 'panjang', 'tinggi', 'tinggiAtas', 'tinggiKanopi'] },
    { id: 'bentuk', title: 'Sandaran', keys: ['ranjangBawah', 'sandaranKepala', 'tinggiSandaran', 'sandaranKaki', 'tinggiKaki', 'kasur'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Selesai', keys: [] },
  ],
  params: [
    {
      key: 'model',
      label: 'Bentuk rangka',
      type: 'choice',
      options: [
        { value: 'kotak', label: 'Rangka kotak', desc: 'Kaki tegak, sandaran opsional' },
        { value: 'melayang', label: 'Platform melayang', desc: 'Kaki masuk ke dalam, terlihat mengambang' },
        { value: 'kanopi', label: 'Kanopi 4 tiang', desc: 'Tiang tinggi + rangka atas' },
        { value: 'kaki-v', label: 'Kaki V miring', desc: 'Kaki bentuk V gaya hairpin' },
        { value: 'tingkat', label: 'Ranjang tingkat', desc: 'Dua alas bertumpuk + tangga' },
        { value: 'daybed', label: 'Daybed', desc: 'Pagar jeruji 3 sisi, untuk duduk & tidur' },
      ],
    },
    { key: 'lebar', label: 'Lebar kasur', type: 'number', unit: 'cm', min: 80, max: 200, step: 10, marks: [{ value: 90, label: 'single' }, { value: 120, label: 'kos' }, { value: 160, label: 'queen' }, { value: 180, label: 'king' }] },
    { key: 'panjang', label: 'Panjang kasur', type: 'number', unit: 'cm', min: 180, max: 220, step: 5, marks: [{ value: 200, label: 'standar' }] },
    { key: 'tinggi', label: 'Tinggi alas kasur', type: 'number', unit: 'cm', min: 20, max: 55, step: 1, help: 'Dari lantai sampai bilah alas (ranjang tingkat: alas bawah). Tambah tebal kasur ±20 cm untuk tinggi duduk.', marks: [{ value: 30, label: 'rendah' }, { value: 40, label: 'umum' }] },
    { key: 'tinggiAtas', label: 'Tinggi alas ranjang atas', type: 'number', unit: 'cm', min: 110, max: 170, step: 1, marks: [{ value: 130, label: 'umum' }], showIf: (p) => p.model === 'tingkat' },
    { key: 'tinggiKanopi', label: 'Tinggi tiang kanopi', type: 'number', unit: 'cm', min: 170, max: 240, step: 1, marks: [{ value: 210, label: 'umum' }], showIf: (p) => p.model === 'kanopi' },
    { key: 'ranjangBawah', label: 'Ranjang bawah', type: 'toggle', help: 'Matikan untuk ranjang loteng: bawahnya kosong untuk meja / lemari.', showIf: (p) => p.model === 'tingkat' },
    { key: 'sandaranKepala', label: 'Sandaran kepala', type: 'toggle', showIf: SANDARAN_OK },
    { key: 'tinggiSandaran', label: 'Tinggi sandaran', type: 'number', unit: 'cm', min: 70, max: 140, step: 1, marks: [{ value: 100, label: 'umum' }], showIf: (p) => p.model === 'daybed' || (SANDARAN_OK(p) && p.sandaranKepala === true) },
    { key: 'sandaranKaki', label: 'Sandaran kaki', type: 'toggle', showIf: SANDARAN_OK },
    { key: 'tinggiKaki', label: 'Tinggi sandaran kaki', type: 'number', unit: 'cm', min: 40, max: 80, step: 1, showIf: (p) => SANDARAN_OK(p) && p.sandaranKaki === true },
    { key: 'kasur', label: 'Tampilkan kasur (contoh)', type: 'toggle', help: 'Hanya gambar, tidak masuk potongan besi.' },
    ...materialParams(true),
  ],
  defaults: { model: 'kotak', lebar: 160, panjang: 200, tinggi: 38, tinggiAtas: 130, tinggiKanopi: 210, ranjangBawah: true, sandaranKepala: true, tinggiSandaran: 100, sandaranKaki: false, tinggiKaki: 55, kasur: true, pipa: '40', papan: 'kayu', warna: '#1f2226' },
  groups: [
    { id: 'utama', name: 'Dipan kamar tidur', desc: 'single · queen · king' },
    { id: 'hemat', name: 'Minimalis, kos & anak', desc: 'platform · tingkat · daybed' },
  ],
  signature: (p) => str(p, 'model', 'kotak'),
  presets: [
    {
      id: 'kepala',
      group: 'utama',
      name: 'Dipan rangka kotak + sandaran kepala',
      desc: 'kaki tegak di sudut & tengah, panel kepala, bilah alas',
      params: { model: 'kotak', sandaranKepala: true, sandaranKaki: false },
      sizes: [
        { label: 'Queen 160', desc: '160 × 200 cm', params: { lebar: 160, panjang: 200, tinggiSandaran: 100 } },
        { label: 'King 180', desc: '180 × 200 cm', params: { lebar: 180, panjang: 200, tinggiSandaran: 110 } },
        { label: 'Kos 120', desc: '120 × 200 cm', params: { lebar: 120, panjang: 200, tinggiSandaran: 95 } },
        { label: 'Single 90 + sandaran kaki', desc: '90 × 200 cm', params: { lebar: 90, panjang: 200, tinggiSandaran: 95, sandaranKaki: true, tinggiKaki: 55 } },
        { label: 'Tanpa sandaran (polos)', desc: '160 × 200, tinggi 30', params: { lebar: 160, tinggi: 30, sandaranKepala: false } },
      ],
    },
    {
      id: 'kanopi',
      group: 'utama',
      name: 'Dipan kanopi 4 tiang',
      desc: 'tiang sudut setinggi 2 m, rangka atas keliling untuk kelambu / tirai',
      params: { model: 'kanopi', sandaranKepala: true, tinggiSandaran: 100, tinggiKanopi: 210, sandaranKaki: false },
      sizes: [
        { label: 'Queen 160', desc: '160 × 200, tiang 210', params: { lebar: 160, tinggiKanopi: 210 } },
        { label: 'King 180', desc: '180 × 200, tiang 220', params: { lebar: 180, tinggiKanopi: 220, tinggiSandaran: 110 } },
        { label: 'Single 90 kelambu', desc: '90 × 200, tiang 190, tanpa panel', params: { lebar: 90, tinggiKanopi: 190, sandaranKepala: false, pipa: '30' } },
      ],
    },
    {
      id: 'kaki-v',
      group: 'utama',
      name: 'Dipan kaki V miring (hairpin)',
      desc: 'tanpa kaki tegak: pasangan pipa miring bentuk V di sisi panjang',
      params: { model: 'kaki-v', tinggi: 35 },
      sizes: [
        { label: 'Queen 160', desc: '160 × 200 cm', params: { lebar: 160 } },
        { label: 'King 180', desc: '180 × 200 cm', params: { lebar: 180 } },
        { label: 'Single 90', desc: '90 × 200 cm, pipa 30', params: { lebar: 90, pipa: '30' } },
      ],
    },
    {
      id: 'polos',
      group: 'hemat',
      name: 'Dipan platform melayang',
      desc: 'rangka dasar masuk ke dalam, alas terlihat mengambang',
      params: { model: 'melayang', tinggi: 30 },
      sizes: [
        { label: 'Single 90', desc: '90 × 200, tinggi 30', params: { lebar: 90, tinggi: 30 } },
        { label: 'Kos 120', desc: '120 × 200, tinggi 30', params: { lebar: 120, tinggi: 30 } },
        { label: 'Queen 160', desc: '160 × 200, tinggi 30', params: { lebar: 160, tinggi: 30 } },
        { label: 'King 180 rendah', desc: '180 × 200, tinggi 25', params: { lebar: 180, tinggi: 25 } },
      ],
    },
    {
      id: 'tingkat',
      group: 'hemat',
      name: 'Ranjang tingkat (susun)',
      desc: 'dua alas di empat tiang tinggi, tangga di sisi kaki, pagar atas',
      params: { model: 'tingkat', lebar: 90, tinggi: 30, tinggiAtas: 130, ranjangBawah: true },
      sizes: [
        { label: 'Single 90 susun', desc: 'anak / asrama', params: { lebar: 90, tinggiAtas: 130 } },
        { label: 'Kos 120 susun', desc: 'alas atas 135', params: { lebar: 120, tinggiAtas: 135 } },
        { label: 'Loteng (tanpa ranjang bawah)', desc: 'bawah kosong untuk meja, alas 150', params: { lebar: 90, tinggiAtas: 150, ranjangBawah: false } },
      ],
    },
    {
      id: 'daybed',
      group: 'hemat',
      name: 'Daybed pagar jeruji 3 sisi',
      desc: 'sofa-tidur: pagar jeruji di kepala, kaki, dan sisi belakang',
      params: { model: 'daybed', lebar: 90, tinggi: 40, tinggiSandaran: 80, pipa: '30' },
      sizes: [
        { label: 'Single 90', desc: '90 × 200, pagar 80', params: { lebar: 90, panjang: 200 } },
        { label: 'Ruang tamu 120', desc: '120 × 200, pagar 85', params: { lebar: 120, tinggiSandaran: 85, pipa: '40' } },
        { label: 'Anak 80', desc: '80 × 190, pagar 75', params: { lebar: 80, panjang: 190, tinggi: 35, tinggiSandaran: 75 } },
      ],
    },
  ],
  summary: (p) => {
    const m = str(p, 'model', 'kotak');
    const base = `Kasur ${num(p, 'lebar')} × ${num(p, 'panjang')} cm`;
    if (m === 'tingkat') return `${base} · ${bool(p, 'ranjangBawah') ? `susun, alas ${num(p, 'tinggi')} & ${num(p, 'tinggiAtas')} cm` : `loteng, alas ${num(p, 'tinggiAtas')} cm`}`;
    return `${base}, tinggi ${num(p, 'tinggi')} cm${m === 'kanopi' ? ` · tiang ${num(p, 'tinggiKanopi')} cm` : ''}`;
  },

  build: (p) => {
    const model = str(p, 'model', 'kotak');
    const W = num(p, 'lebar', 160) + 2; // ruang 1 cm tiap sisi kasur
    const D = num(p, 'panjang', 200) + 2;
    const Hb = num(p, 'tinggi', 38);
    const L = (parseInt(str(p, 'pipa', '40')) || 40) / 10;
    const b = BOARD_THICK[str(p, 'papan', 'kayu')] ?? 2.5;
    const t: [number, number] = [L * 10, L * 10];
    const thin: [number, number] = [20, 20];
    const slatT: [number, number] = [40, 20];
    const { list, add, line } = memberFactory();
    const boards: Board[] = [];
    const xl = L / 2;
    const xr = W - L / 2;
    const zh = L / 2;
    const zf = D - L / 2;
    const showKasur = bool(p, 'kasur');
    const kasur = (id: string, y: number) => {
      if (showKasur) boards.push({ ...board(id, 'Kasur (contoh)', 1, W - 1, y, y + 20, 1, D - 1), color: '#ece6da' });
    };

    /** Alas kasur: rangka keliling + balok tengah (dipan lebar) + bilah 40×20 jarak ±12 cm. Kembalikan as rangka. */
    const deck = (pre: string, h: number, lab: string) => {
      const yr = h - 2 - L / 2; // as rangka keliling (bilah 2 cm di atasnya)
      add(`${pre}rangka-kepala`, 'x', L, yr, zh, W - 2 * L, 'rail-x', `${lab}Rangka sisi kepala`, t);
      add(`${pre}rangka-kaki`, 'x', L, yr, zf, W - 2 * L, 'rail-x', `${lab}Rangka sisi kaki`, t);
      add(`${pre}rangka-kiri`, 'z', xl, yr, L, D - 2 * L, 'rail-z', `${lab}Rangka samping kiri`, t);
      add(`${pre}rangka-kanan`, 'z', xr, yr, L, D - 2 * L, 'rail-z', `${lab}Rangka samping kanan`, t);
      if (W >= 120) add(`${pre}balok-tengah`, 'z', W / 2, yr, L, D - 2 * L, 'rail-z', `${lab}Balok tengah`, t);
      const n = Math.max(8, Math.floor((D - 2 * L) / 12));
      const pitch = (D - 2 * L - 4) / (n - 1);
      for (let i = 0; i < n; i++) add(`${pre}bilah-${i + 1}`, 'x', 1, yr + L / 2 + 1, L + 2 + i * pitch, W - 2, 'custom', `${lab}Bilah alas ${i + 1}`, slatT);
      kasur(`${pre}kasur`, h);
      return yr;
    };
    /** Panel sandaran kepala (palang atas + tengah + papan) di z = zh, antara yLow dan top */
    const headPanel = (top: number, yr: number) => {
      add('kepala-atas', 'x', L, top - L / 2, zh, W - 2 * L, 'rail-x', 'Palang sandaran kepala atas', t);
      add('kepala-tengah', 'x', L, yr + 22, zh, W - 2 * L, 'rail-x', 'Palang sandaran kepala tengah', thin);
      if (b > 0) boards.push(board('panel-kepala', 'Panel sandaran kepala', L, W - L, yr + 23, top - L, zh + 1, zh + 1 + Math.min(b, 1.8)));
    };

    if (model === 'melayang') {
      // Platform melayang: rangka dasar di lantai masuk ±22 cm, tiang pendek ke balok lintang di bawah rangka alas
      const yr = deck('', Hb, '');
      const ins = Math.min(22, W * 0.18);
      const insZ = Math.min(30, D * 0.15);
      const x0 = ins;
      const x1 = W - ins;
      const z0 = insZ;
      const z1 = D - insZ;
      const yBeam = yr - L; // balok lintang tepat di bawah rangka samping
      add('dasar-kepala', 'x', x0 - L / 2, L / 2, z0, x1 - x0 + L, 'rail-x', 'Rangka dasar sisi kepala', t);
      add('dasar-kaki', 'x', x0 - L / 2, L / 2, z1, x1 - x0 + L, 'rail-x', 'Rangka dasar sisi kaki', t);
      add('dasar-kiri', 'z', x0, L / 2, z0 + L / 2, z1 - z0 - L, 'rail-z', 'Rangka dasar kiri', t);
      add('dasar-kanan', 'z', x1, L / 2, z0 + L / 2, z1 - z0 - L, 'rail-z', 'Rangka dasar kanan', t);
      const zs = [z0, D / 2, z1];
      zs.forEach((z, i) => {
        const nm = ['kepala', 'tengah', 'kaki'][i];
        add(`balok-lintang-${nm}`, 'x', 0, yBeam, z, W, 'rail-x', `Balok lintang ${nm}`, t);
        [x0, x1].forEach((x, j) => {
          const yStart = i === 1 ? L / 2 + L / 2 : L;
          // tiang tengah berdiri di rangka dasar kiri / kanan; tiang sudut di sambungan rangka dasar
          add(`tiang-${nm}-${j ? 'kanan' : 'kiri'}`, 'y', x, yStart, z, yBeam - L / 2 - yStart, 'post', `Tiang pendek ${nm} ${j ? 'kanan' : 'kiri'}`, t);
        });
      });
      return { members: list, boards, casters: [], W, D, H: Hb + (showKasur ? 20 : 0), boardThick: 0 };
    }

    if (model === 'kaki-v') {
      // Kaki V: dua pipa miring dari satu titik lantai ke rangka samping (dekat sudut & di tengah)
      const yr = deck('', Hb, '');
      const yT = yr - L / 2;
      const legs: [number, number, string][] = [
        [zh + 30, 1, 'kepala'],
        [D / 2, 0, 'tengah'],
        [zf - 30, -1, 'kaki'],
      ];
      const xs: [number, string][] = [
        [xl, 'kiri'],
        [xr, 'kanan'],
      ];
      if (W >= 120) xs.push([W / 2, 'tengah']); // V di bawah balok tengah
      xs.forEach(([x, sx]) =>
        legs.forEach(([zF, dir, nm]) => {
          if (sx === 'tengah' && nm !== 'tengah') return;
          const a = dir === 0 ? 22 : 25;
          const z1 = dir === 0 ? zF - a : zF - dir * a;
          const z2 = dir === 0 ? zF + a : zF + dir * a;
          line(`kaki-v-${sx}-${nm}-1`, [x, 0, zF], [x, yT, Math.max(L, Math.min(D - L, z1))], 'post', `Kaki V ${sx} ${nm} 1`, t);
          line(`kaki-v-${sx}-${nm}-2`, [x, 0, zF], [x, yT, z2], 'post', `Kaki V ${sx} ${nm} 2`, t);
        })
      );
      return { members: list, boards, casters: [], W, D, H: Hb + (showKasur ? 20 : 0), boardThick: 0 };
    }

    if (model === 'tingkat') {
      // Ranjang tingkat: 4 tiang tinggi, alas bawah (opsional) & atas, pagar pengaman, tangga di sisi kaki
      const lower = bool(p, 'ranjangBawah');
      const Ha = Math.max(Hb + 70, num(p, 'tinggiAtas', 130));
      const top = Ha + 35; // pagar pengaman ±30 cm di atas alas (kasur 15–20 cm)
      [
        [xl, zh, 'kiri kepala'],
        [xr, zh, 'kanan kepala'],
        [xl, zf, 'kiri kaki'],
        [xr, zf, 'kanan kaki'],
      ].forEach(([x, z, nm], i) => add(`tiang-${i}`, 'y', x as number, 0, z as number, top, 'post', `Tiang ${nm}`, t));
      let yLow = 15;
      if (lower) {
        const yr = deck('bawah-', Hb, 'Bawah: ');
        yLow = yr;
        [xl, xr].forEach((x, i) => add(`kaki-samping-${i}`, 'y', x, 0, D / 2, yr - L / 2, 'post', `Kaki tengah bawah ${i ? 'kanan' : 'kiri'}`, t));
        if (W >= 120) add('kaki-tengah', 'y', W / 2, 0, D / 2, yr - L / 2, 'post', 'Kaki tengah bawah', t);
      } else {
        // Loteng: rangka keliling bawah sebagai pengaku tiang
        add('pengaku-kepala', 'x', L, 15, zh, W - 2 * L, 'rail-x', 'Pengaku bawah sisi kepala', t);
        add('pengaku-kaki', 'x', L, 15, zf, W - 2 * L, 'rail-x', 'Pengaku bawah sisi kaki', t);
        add('pengaku-kiri', 'z', xl, 15, L, D - 2 * L, 'rail-z', 'Pengaku bawah kiri', t);
      }
      const yrA = deck('atas-', Ha, 'Atas: ');
      // Pagar: palang atas di kepala, kaki, sisi kiri penuh, sisi kanan terbuka di atas tangga
      const yG = top - L / 2;
      const zL = zf - 45; // tiang tangga, 45 cm dari tiang kaki
      add('pagar-kepala', 'x', L, yG, zh, W - 2 * L, 'rail-x', 'Pagar atas sisi kepala', t);
      add('pagar-kaki', 'x', L, yG, zf, W - 2 * L, 'rail-x', 'Pagar atas sisi kaki', t);
      add('pagar-kiri', 'z', xl, yG, L, D - 2 * L, 'rail-z', 'Pagar atas samping kiri', t);
      add('pagar-kanan', 'z', xr, yG, L, zL - L / 2 - L, 'rail-z', 'Pagar atas samping kanan', t);
      add('tangga-tiang', 'y', xr, 0, zL, top, 'post', 'Tiang tangga (sampai pagar)', t);
      // Tangga di sisi kanan dekat kaki: anak tangga di antara tiang tangga dan tiang kaki, jarak ±28 cm
      const yStart = lower ? yLow + 28 : 30;
      const nR = Math.max(2, Math.floor((yrA - 14 - yStart) / 28) + 1);
      const rp = (yrA - 14 - yStart) / (nR - 1);
      for (let i = 0; i < nR; i++) add(`anak-tangga-${i + 1}`, 'z', xr, yStart + i * rp, zL + L / 2, zf - zL - L, 'rail-z', `Anak tangga ${i + 1}`, t);
      void yLow;
      return { members: list, boards, casters: [], W, D, H: top, boardThick: 0 };
    }

    if (model === 'daybed') {
      // Daybed: pagar jeruji di kepala, kaki, dan sisi belakang (kiri, menempel tembok)
      const yr = deck('', Hb, '');
      const H = Math.max(Hb + 25, num(p, 'tinggiSandaran', 80));
      const yG = H - L / 2;
      [
        [xl, zh, H, 'kiri kepala'],
        [xr, zh, H, 'kanan kepala'],
        [xl, zf, H, 'kiri kaki'],
        [xr, zf, H, 'kanan kaki'],
        [xl, D / 2, H, 'tengah belakang'],
        [xr, D / 2, yr - L / 2, 'tengah depan'],
      ].forEach(([x, z, h, nm], i) => add(`tiang-${i}`, 'y', x as number, 0, z as number, h as number, 'post', `Tiang ${nm}`, t));
      add('pagar-kepala', 'x', L, yG, zh, W - 2 * L, 'rail-x', 'Palang atas pagar kepala', t);
      add('pagar-kaki', 'x', L, yG, zf, W - 2 * L, 'rail-x', 'Palang atas pagar kaki', t);
      add('pagar-belakang-1', 'z', xl, yG, L, D / 2 - 1.5 * L, 'rail-z', 'Palang atas pagar belakang 1', t);
      add('pagar-belakang-2', 'z', xl, yG, D / 2 + L / 2, D / 2 - 1.5 * L, 'rail-z', 'Palang atas pagar belakang 2', t);
      const y0 = yr + L / 2;
      const hj = yG - L / 2 - y0;
      const jer = (id: string, x: number, z: number, label: string) => add(id, 'y', x, y0, z, hj, 'custom', label, thin);
      const nE = Math.max(2, Math.floor((W - 2 * L) / 12) - 1);
      for (let i = 1; i <= nE; i++) {
        const x = L + (i * (W - 2 * L)) / (nE + 1);
        jer(`jeruji-kepala-${i}`, x, zh, `Jeruji kepala ${i}`);
        jer(`jeruji-kaki-${i}`, x, zf, `Jeruji kaki ${i}`);
      }
      const nB = Math.max(2, Math.floor((D / 2 - 2 * L) / 12) - 1);
      [0, 1].forEach((h) => {
        for (let i = 1; i <= nB; i++) {
          const z = (h ? D / 2 : L) + (i * (D / 2 - 1.5 * L)) / (nB + 1);
          jer(`jeruji-belakang-${h + 1}-${i}`, xl, z, `Jeruji belakang ${h * nB + i}`);
        }
      });
      return { members: list, boards, casters: [], W, D, H, boardThick: 0 };
    }

    // Rangka kotak & kanopi
    const canopy = model === 'kanopi';
    const yr = deck('', Hb, '');
    const head = bool(p, 'sandaranKepala');
    const foot = bool(p, 'sandaranKaki');
    const Hh = Math.max(Hb + 30, num(p, 'tinggiSandaran', 100));
    const Hf = Math.max(Hb + 15, num(p, 'tinggiKaki', 55));
    const Hc = Math.max(Hh + 30, num(p, 'tinggiKanopi', 210));
    const post = (isHead: boolean) => (canopy ? Hc : isHead ? (head ? Hh : yr + L / 2) : foot ? Hf : yr + L / 2);
    [
      [xl, zh, post(true), 'kiri kepala'],
      [xr, zh, post(true), 'kanan kepala'],
      [xl, zf, post(false), 'kiri kaki'],
      [xr, zf, post(false), 'kanan kaki'],
    ].forEach(([x, z, top, nm], i) => add(`kaki-${i}`, 'y', x as number, 0, z as number, top as number, 'post', canopy ? `Tiang kanopi ${nm}` : `Kaki ${nm}`, t));
    [xl, xr].forEach((x, i) => add(`kaki-samping-${i}`, 'y', x, 0, D / 2, yr - L / 2, 'post', `Kaki tengah ${i ? 'kanan' : 'kiri'}`, t));
    if (W >= 120) add('kaki-tengah', 'y', W / 2, 0, D / 2, yr - L / 2, 'post', 'Kaki tengah', t);
    if (head) headPanel(Hh, yr);
    if (foot) add('kaki-atas', 'x', L, Hf - L / 2, zf, W - 2 * L, 'rail-x', 'Palang sandaran kaki', t);
    if (canopy) {
      const yc = Hc - L / 2;
      add('kanopi-kepala', 'x', L, yc, zh, W - 2 * L, 'rail-x', 'Rangka kanopi sisi kepala', t);
      add('kanopi-kaki', 'x', L, yc, zf, W - 2 * L, 'rail-x', 'Rangka kanopi sisi kaki', t);
      add('kanopi-kiri', 'z', xl, yc, L, D - 2 * L, 'rail-z', 'Rangka kanopi samping kiri', t);
      add('kanopi-kanan', 'z', xr, yc, L, D - 2 * L, 'rail-z', 'Rangka kanopi samping kanan', t);
    }
    return { members: list, boards, casters: [], W, D, H: Math.max(canopy ? Hc : 0, head ? Hh : 0, foot ? Hf : 0, Hb + 20), boardThick: 0 };
  },

  checks: (p) => {
    const out: ProductCheck[] = [];
    const m = str(p, 'model', 'kotak');
    const pipa = str(p, 'pipa');
    if (num(p, 'lebar') >= 160 && pipa === '20') out.push({ level: 'warn', message: 'Dipan lebar dengan pipa 20×20 terlalu lemah untuk 2 orang.', fix: { label: 'Pakai pipa 40×40', params: { pipa: '40' } } });
    if ((m === 'tingkat' || m === 'kanopi') && pipa === '20') out.push({ level: 'warn', message: 'Tiang setinggi ini dengan pipa 20×20 goyang.', fix: { label: 'Pakai pipa 40×40', params: { pipa: '40' } } });
    if (SANDARAN_OK(p) && bool(p, 'sandaranKaki') && num(p, 'tinggiKaki') < num(p, 'tinggi') + 20) out.push({ level: 'info', message: 'Sandaran kaki lebih rendah dari permukaan kasur: hanya terlihat sebagai pinggiran.' });
    if (m === 'tingkat') {
      if (bool(p, 'ranjangBawah') && num(p, 'tinggiAtas') - num(p, 'tinggi') < 90)
        out.push({ level: 'warn', message: 'Ruang di ranjang bawah kurang dari 90 cm: tidak bisa duduk tegak.', fix: { label: 'Alas atas 130, bawah 30', params: { tinggiAtas: 130, tinggi: 30 } } });
      if (num(p, 'lebar') > 140) out.push({ level: 'warn', message: 'Ranjang tingkat selebar ini sangat berat dan sulit dirakit di kamar.', fix: { label: 'Lebar 120 cm', params: { lebar: 120 } } });
      out.push({ level: 'info', message: 'Pagar atas ±30 cm di atas alas: pakai kasur atas maksimal 15 cm. Baut tiang ke tembok untuk anak-anak.' });
    }
    if (m === 'kanopi' && num(p, 'tinggiKanopi') > 230) out.push({ level: 'info', message: 'Cek tinggi plafon kamar: sisakan minimal 30 cm di atas rangka kanopi.' });
    if (m === 'daybed' && num(p, 'tinggiSandaran') - num(p, 'tinggi') < 30)
      out.push({ level: 'warn', message: 'Pagar daybed terlalu rendah untuk sandaran duduk.', fix: { label: 'Pagar 80 cm', params: { tinggiSandaran: 80 } } });
    if (m === 'melayang' && num(p, 'tinggi') > 40) out.push({ level: 'info', message: 'Platform melayang lebih terlihat mengambang bila rendah (25–35 cm).' });
    out.push({ level: 'info', message: `Tinggi duduk di tepi kasur ±${num(p, 'tinggi') + 20} cm (kasur 20 cm). Yang nyaman 45–55 cm.` });
    return out;
  },
};
