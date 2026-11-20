import { Board, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, board, bool, materialParams, memberFactory, num, str } from './common';

/**
 * Rak dinding / backbar / rak gantung plafon. Bentuk rangka (param `model`):
 * - siku: siku L per tingkat; siku-miring: siku + penguat miring; tiang: tiang tegak di tembok (backbar)
 * - gantung: digantung dari plafon dengan 4 batang
 * - pipa: pipa tegak di depan papan, lepas dari tembok, disambung pipa ke tembok atas & bawah (gaya industrial)
 * - kotak: kotak rangka utuh (4 tiang depan-belakang) menempel tembok, tanpa kaki
 * - kisi: panel kisi-kisi di tembok + rak kecil menempel bergantian kiri–kanan
 * - rel: rel gantung tanpa papan, siku dudukan + kait S (cangkir, alat dapur, apron)
 * Opsi bibir penahan & gantungan gelas untuk model siku / tiang.
 */
export const RAK_DINDING: ProductDef = {
  id: 'rak-dinding',
  name: 'Rak dinding / backbar',
  tagline: 'ambalan · backbar · rak gantung',
  icon: 'M6 4v32M6 12h40M6 24h40M14 12v-4M14 24v-4',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['model', 'panjang', 'dalam', 'tingkat', 'jarak', 'tinggiMulai', 'tinggiPlafon'] },
    { id: 'bentuk', title: 'Tambahan', keys: ['bibir', 'gantunganGelas'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Selesai', keys: [] },
  ],
  params: [
    {
      key: 'model',
      label: 'Penopang',
      type: 'choice',
      options: [
        { value: 'siku', label: 'Siku lurus', desc: 'Sederhana, papan ≤ 30 cm' },
        { value: 'siku-miring', label: 'Siku + penguat miring', desc: 'Kuat untuk botol & papan dalam' },
        { value: 'tiang', label: 'Tiang dinding', desc: 'Rangka tegak sepanjang rak (backbar)' },
        { value: 'gantung', label: 'Gantung dari plafon', desc: 'Di atas meja bar, tanpa tembok' },
        { value: 'pipa', label: 'Pipa tegak depan (industrial)', desc: 'Pipa menembus papan, lepas dari tembok' },
        { value: 'kotak', label: 'Kotak rangka', desc: 'Kotak utuh menempel tembok, tanpa kaki' },
        { value: 'kisi', label: 'Panel kisi + rak kecil', desc: 'Kisi-kisi di tembok, rak menempel bergantian' },
        { value: 'rel', label: 'Rel gantung + kait', desc: 'Tanpa papan, untuk cangkir / alat dapur' },
      ],
    },
    { key: 'panjang', label: 'Panjang', type: 'number', unit: 'cm', min: 40, max: 240, step: 1, marks: [{ value: 80, label: 'ambalan' }, { value: 150, label: 'backbar' }] },
    { key: 'dalam', label: 'Kedalaman papan', type: 'number', unit: 'cm', min: 10, max: 45, step: 1, marks: [{ value: 20, label: 'cangkir' }, { value: 28, label: 'botol' }] },
    { key: 'tingkat', label: 'Jumlah tingkat', type: 'number', unit: 'tingkat', min: 1, max: 6, step: 1 },
    { key: 'jarak', label: 'Jarak antar tingkat', type: 'number', unit: 'cm', min: 18, max: 55, step: 1, marks: [{ value: 25, label: 'cangkir' }, { value: 38, label: 'botol' }] },
    { key: 'tinggiMulai', label: 'Tinggi tingkat terbawah', type: 'number', unit: 'cm', min: 20, max: 200, step: 1, help: 'Dari lantai. Di atas meja 90 cm biasanya mulai 130–140 cm.', marks: [{ value: 135, label: 'di atas meja' }], showIf: (p) => p.model !== 'gantung' },
    { key: 'tinggiPlafon', label: 'Tinggi plafon', type: 'number', unit: 'cm', min: 200, max: 400, step: 1, showIf: (p) => p.model === 'gantung' },
    { key: 'bibir', label: 'Bibir penahan depan', type: 'toggle', help: 'Pipa kecil di tepi depan supaya botol tidak jatuh.', showIf: (p) => ['siku', 'siku-miring', 'tiang'].includes(String(p.model)) },
    { key: 'gantunganGelas', label: 'Gantungan gelas / cangkir', type: 'toggle', help: 'Batang di bawah tingkat terbawah untuk mengaitkan gelas.', showIf: (p) => ['siku', 'siku-miring', 'tiang', 'gantung'].includes(String(p.model)) },
    ...materialParams(true),
  ],
  defaults: { model: 'siku-miring', panjang: 120, dalam: 25, tingkat: 3, jarak: 35, tinggiMulai: 135, tinggiPlafon: 280, bibir: false, gantunganGelas: false, pipa: '20', papan: 'kayu', warna: '#1f2226' },
  groups: [
    { id: 'rumah', name: 'Ambalan & rak dinding rumah', desc: 'Buku, pajangan, dapur, kamar' },
    { id: 'cafe', name: 'Backbar & rak cafe', desc: 'Botol, cangkir, gelas, alat bar' },
  ],
  signature: (p) => `rak-dinding:${str(p, 'model', 'siku-miring')}`,
  presets: [
    {
      id: 'siku',
      group: 'rumah',
      name: 'Ambalan siku lurus',
      desc: 'siku L per tingkat, dibaut ke tembok',
      params: { model: 'siku', bibir: false, gantunganGelas: false, panjang: 80, dalam: 20, tingkat: 2, jarak: 28, tinggiMulai: 140 },
      sizes: [
        { label: 'Ambalan cangkir', desc: '80 × 20 cm, 2 tingkat', params: { panjang: 80, dalam: 20, tingkat: 2, jarak: 28, tinggiMulai: 140 } },
        { label: 'Rak buku dinding', desc: '120 × 25 cm, 3 tingkat', params: { panjang: 120, dalam: 25, tingkat: 3, jarak: 32, tinggiMulai: 100 } },
      ],
    },
    {
      id: 'pipa',
      group: 'rumah',
      name: 'Rak pipa industrial',
      desc: 'pipa tegak di depan menembus papan, disambung ke tembok atas & bawah',
      params: { model: 'pipa', panjang: 100, dalam: 25, tingkat: 3, jarak: 30, tinggiMulai: 100, pipa: '20' },
      sizes: [
        { label: 'Ruang tamu', desc: '100 × 25 cm, 3 tingkat', params: { panjang: 100, dalam: 25, tingkat: 3, jarak: 30, tinggiMulai: 100 } },
        { label: 'Atas meja kerja', desc: '120 × 22 cm, 2 tingkat', params: { panjang: 120, dalam: 22, tingkat: 2, jarak: 30, tinggiMulai: 110 } },
        { label: 'Kamar mandi / handuk', desc: '60 × 25 cm, 3 tingkat', params: { panjang: 60, dalam: 25, tingkat: 3, jarak: 28, tinggiMulai: 100 } },
      ],
    },
    {
      id: 'kotak',
      group: 'rumah',
      name: 'Rak dinding kotak',
      desc: 'kotak rangka utuh 4 tiang menempel tembok, papan atas ikut dipakai',
      params: { model: 'kotak', panjang: 80, dalam: 25, tingkat: 2, jarak: 30, tinggiMulai: 110 },
      sizes: [
        { label: 'Pajangan', desc: '80 × 25 cm, 2 ruang', params: { panjang: 80, dalam: 25, tingkat: 2, jarak: 30, tinggiMulai: 110 } },
        { label: 'Atas kloset / mesin cuci', desc: '60 × 25 cm, 1 ruang tinggi', params: { panjang: 60, dalam: 25, tingkat: 1, jarak: 40, tinggiMulai: 120 } },
        { label: 'Bumbu dapur', desc: '100 × 15 cm, 3 ruang', params: { panjang: 100, dalam: 15, tingkat: 3, jarak: 22, tinggiMulai: 120 } },
      ],
    },
    {
      id: 'kisi',
      group: 'rumah',
      name: 'Panel kisi + rak kecil',
      desc: 'panel kisi-kisi di tembok, rak kecil menempel bergantian kiri–kanan',
      params: { model: 'kisi', panjang: 90, dalam: 18, tingkat: 3, jarak: 30, tinggiMulai: 100 },
      sizes: [
        { label: 'Meja kerja / hobi', desc: '90 cm, 3 rak kecil', params: { panjang: 90, dalam: 18, tingkat: 3, jarak: 30, tinggiMulai: 100 } },
        { label: 'Dapur', desc: '120 cm, 2 rak', params: { panjang: 120, dalam: 20, tingkat: 2, jarak: 32, tinggiMulai: 120 } },
        { label: 'Display toko', desc: '150 cm, 4 rak', params: { panjang: 150, dalam: 20, tingkat: 4, jarak: 30, tinggiMulai: 70 } },
      ],
    },
    {
      id: 'backbar',
      group: 'cafe',
      name: 'Backbar botol (siku miring)',
      desc: 'siku + penguat miring, bibir penahan botol',
      params: { model: 'siku-miring', bibir: true, panjang: 150, dalam: 28, tingkat: 3, jarak: 38, tinggiMulai: 135 },
      sizes: [
        { label: 'Botol sirup', desc: '150 × 28 cm, 3 tingkat jarak 38', params: { panjang: 150, dalam: 28, tingkat: 3, jarak: 38, tinggiMulai: 135, gantunganGelas: false } },
        { label: 'Botol + gantungan gelas', desc: '120 × 28 cm, 2 tingkat', params: { panjang: 120, dalam: 28, tingkat: 2, jarak: 40, tinggiMulai: 140, gantunganGelas: true } },
      ],
    },
    {
      id: 'tiang',
      group: 'cafe',
      name: 'Rak tiang dinding',
      desc: 'tiang tegak di tembok dari tingkat bawah sampai atas',
      params: { model: 'tiang', panjang: 120, dalam: 30, tingkat: 4, jarak: 35, tinggiMulai: 60 },
      sizes: [
        { label: 'Display merchandise', desc: '120 × 30 cm, 4 tingkat', params: { panjang: 120, dalam: 30, tingkat: 4, jarak: 35, tinggiMulai: 60 } },
        { label: 'Backbar penuh', desc: '180 × 28 cm, 4 tingkat, bibir', params: { panjang: 180, dalam: 28, tingkat: 4, jarak: 38, tinggiMulai: 100, bibir: true } },
      ],
    },
    {
      id: 'gantung',
      group: 'cafe',
      name: 'Rak gantung plafon',
      desc: 'digantung di atas meja bar dengan 4 batang',
      params: { model: 'gantung', panjang: 150, dalam: 30, tingkat: 2, jarak: 30, tinggiPlafon: 280, gantunganGelas: true },
      sizes: [
        { label: 'Atas meja bar', desc: '150 × 30 cm, 2 tingkat, gantungan gelas', params: { panjang: 150, dalam: 30, tingkat: 2, jarak: 30, tinggiPlafon: 280, gantunganGelas: true } },
        { label: 'Rak tanaman gantung', desc: '100 × 25 cm, 1 tingkat', params: { panjang: 100, dalam: 25, tingkat: 1, jarak: 30, tinggiPlafon: 280, gantunganGelas: false } },
      ],
    },
    {
      id: 'rel',
      group: 'cafe',
      name: 'Rel gantung + kait',
      desc: 'tanpa papan: rel di siku dudukan, kait S untuk cangkir & alat',
      params: { model: 'rel', panjang: 100, dalam: 10, tingkat: 2, jarak: 25, tinggiMulai: 140, pipa: '20' },
      sizes: [
        { label: 'Cangkir bar kopi', desc: '100 cm, 2 rel', params: { panjang: 100, tingkat: 2, jarak: 25, tinggiMulai: 140 } },
        { label: 'Alat dapur', desc: '150 cm, 1 rel', params: { panjang: 150, tingkat: 1, jarak: 25, tinggiMulai: 150 } },
        { label: 'Apron / jaket staf', desc: '120 cm, 1 rel tinggi', params: { panjang: 120, tingkat: 1, jarak: 25, tinggiMulai: 165 } },
      ],
    },
  ],
  summary: (p) =>
    str(p, 'model') === 'rel' ? `${num(p, 'panjang')} cm · ${num(p, 'tingkat')} rel` : `${num(p, 'panjang')} × ${num(p, 'dalam')} cm · ${num(p, 'tingkat')} ${str(p, 'model') === 'kotak' ? 'ruang' : 'tingkat'}`,

  build: (p) => {
    const W = num(p, 'panjang', 120);
    const Dp = num(p, 'dalam', 25);
    const n = Math.max(1, Math.round(num(p, 'tingkat', 3)));
    const gap = num(p, 'jarak', 35);
    const model = str(p, 'model', 'siku-miring');
    const L = (parseInt(str(p, 'pipa', '20')) || 20) / 10;
    const b = BOARD_THICK[str(p, 'papan', 'kayu')] ?? 2.5;
    const t: [number, number] = [L * 10, L * 10];
    const thin: [number, number] = [15, 15];
    const { list, add, line } = memberFactory();
    const boards: Board[] = [];
    const hang = model === 'gantung';
    const ceil = num(p, 'tinggiPlafon', 280);
    // permukaan papan tingkat i (dari bawah)
    const y0 = hang ? Math.max(60, ceil - 70 - (n - 1) * gap) : num(p, 'tinggiMulai', 135);
    const ys = Array.from({ length: n }, (_, i) => y0 + i * gap);
    const yArm = (y: number) => y - b - L / 2;

    if (model === 'pipa' || model === 'kotak' || model === 'kisi' || model === 'rel') {
      const nb = Math.max(2, Math.ceil((W - 24) / 80) + 1);
      const xs = Array.from({ length: nb }, (_, i) => 12 + ((W - 24) * i) / (nb - 1));
      let top = ys[n - 1] + 10;
      if (model === 'pipa') {
        // Pipa tegak dekat tepi depan menembus papan; ujung atas & bawah disambung ke tembok
        const zv = Dp - 4;
        const yLo = yArm(ys[0]) - 14;
        const yHi = ys[n - 1] + 14;
        xs.forEach((x, i) => {
          add(`pipa-tegak-${i}`, 'y', x, yLo, zv, yHi - yLo, 'post', `Pipa tegak ${i + 1}`, t);
          add(`pipa-tembok-atas-${i}`, 'z', x, yHi - L / 2, 0, zv - L / 2, 'rail-z', `Pipa ke tembok atas ${i + 1}`, t);
          add(`pipa-tembok-bawah-${i}`, 'z', x, yLo + L / 2, 0, zv - L / 2, 'rail-z', `Pipa ke tembok bawah ${i + 1}`, t);
          ys.forEach((y, k) => add(`lengan-${i}-t${k + 1}`, 'z', x, yArm(y), 0, zv - L / 2, 'rail-z', `Lengan papan ${i + 1} tingkat ${k + 1}`, t));
        });
        top = yHi;
        if (b > 0) ys.forEach((y, k) => boards.push(board(`papan-${k + 1}`, `Papan tingkat ${k + 1} (dilubangi pipa)`, 0, W, y - b, y, 0, Dp)));
      } else if (model === 'kotak') {
        // Kotak utuh: n ruang = n + 1 lantai papan (papan atas ikut dipakai)
        const lv = Array.from({ length: n + 1 }, (_, i) => y0 + i * gap);
        const xL = L / 2;
        const xR = W - L / 2;
        const zB = L / 2;
        const zF = Dp - L / 2;
        const yb = yArm(lv[0]) - L / 2;
        const yt = yArm(lv[n]) + L / 2;
        [xL, xR].forEach((x, i) => [zB, zF].forEach((z, j) => add(`tiang-${i}-${j}`, 'y', x, yb, z, yt - yb, 'post', `Tiang kotak ${i ? 'kanan' : 'kiri'} ${j ? 'depan' : 'belakang'}`, t)));
        lv.forEach((y, k) => {
          const ya = yArm(y);
          add(`k${k + 1}-depan`, 'x', L, ya, zF, W - 2 * L, 'rail-x', `Palang lantai ${k + 1} depan`, t);
          add(`k${k + 1}-belakang`, 'x', L, ya, zB, W - 2 * L, 'rail-x', `Palang lantai ${k + 1} belakang (dibaut tembok)`, t);
          add(`k${k + 1}-kiri`, 'z', xL, ya, L, Dp - 2 * L, 'rail-z', `Palang lantai ${k + 1} kiri`, t);
          add(`k${k + 1}-kanan`, 'z', xR, ya, L, Dp - 2 * L, 'rail-z', `Palang lantai ${k + 1} kanan`, t);
          if (b > 0) boards.push(board(`papan-${k + 1}`, `Papan lantai ${k + 1}`, L, W - L, y - b, y, 0, Dp));
        });
        top = lv[n];
      } else if (model === 'kisi') {
        // Panel kisi 3 cm dari tembok; rak kecil selebar separuh panel bergantian kiri / kanan
        const zg = 3;
        const gy0 = Math.max(20, y0 - 30);
        const gy1 = ys[n - 1] + 25;
        add('kisi-kiri', 'y', L / 2, gy0, zg, gy1 - gy0, 'post', 'Rangka kisi kiri', t);
        add('kisi-kanan', 'y', W - L / 2, gy0, zg, gy1 - gy0, 'post', 'Rangka kisi kanan', t);
        add('kisi-atas', 'x', L, gy1 - L / 2, zg, W - 2 * L, 'rail-x', 'Rangka kisi atas', t);
        add('kisi-bawah', 'x', L, gy0 + L / 2, zg, W - 2 * L, 'rail-x', 'Rangka kisi bawah', t);
        const feet: [number, number][] = [[L / 2, gy0 + 6], [W - L / 2, gy0 + 6], [L / 2, gy1 - 6], [W - L / 2, gy1 - 6]];
        feet.forEach(([x, y], i) => add(`kisi-dudukan-${i}`, 'z', x, y, 0, zg - L / 2, 'custom', `Dudukan kisi ke tembok ${i + 1}`, thin));
        const nv = Math.max(1, Math.round((W - 2 * L) / 12) - 1);
        for (let i = 1; i <= nv; i++) add(`kisi-tegak-${i}`, 'y', L + ((W - 2 * L) * i) / (nv + 1), gy0 + L, zg, gy1 - gy0 - 2 * L, 'custom', `Kisi tegak ${i}`, [10, 10]);
        const nh = Math.max(1, Math.round((gy1 - gy0 - 2 * L) / 12) - 1);
        for (let i = 1; i <= nh; i++) add(`kisi-datar-${i}`, 'x', L, gy0 + L + ((gy1 - gy0 - 2 * L) * i) / (nh + 1), zg, W - 2 * L, 'custom', `Kisi datar ${i}`, [10, 10]);
        const sw = Math.max(30, W * 0.5);
        ys.forEach((y, k) => {
          const x0 = k % 2 === 0 ? 6 : W - 6 - sw;
          const ya = y - b - 0.75;
          [x0 + 1, x0 + sw - 1].forEach((x, j) => {
            add(`rak-${k + 1}-lengan-${j}`, 'z', x, ya, zg + 0.5, Dp - zg - 0.5, 'rail-z', `Lengan rak kecil ${k + 1} ${j ? 'kanan' : 'kiri'}`, thin);
            line(`rak-${k + 1}-penguat-${j}`, [x, ya - 12, zg + 0.5], [x, ya - 0.75, Dp * 0.6], 'custom', `Penguat rak kecil ${k + 1} ${j ? 'kanan' : 'kiri'}`, [10, 10]);
            add(`rak-${k + 1}-bibir-tiang-${j}`, 'y', x, ya + 0.75, Dp - 1, b + 3, 'custom', `Tiang bibir rak kecil ${k + 1} ${j ? 'kanan' : 'kiri'}`, [10, 10]);
          });
          add(`rak-${k + 1}-bibir`, 'x', x0, ya + 0.75 + b + 3, Dp - 1, sw, 'rail-x', `Bibir rak kecil ${k + 1}`, [10, 10]);
          if (b > 0) boards.push(board(`papan-${k + 1}`, `Papan rak kecil ${k + 1}`, x0, x0 + sw, y - b, y, zg + 1, Dp));
        });
        top = gy1;
      } else {
        // rel: siku dudukan + rel, kait S tergantung di rel
        const zr = Math.max(7, Math.min(Dp, 12));
        const nk = Math.max(3, Math.round((W - 10) / 14));
        ys.forEach((y, k) => {
          xs.forEach((x, i) => {
            add(`plat-${i}-r${k + 1}`, 'y', x, y - 7, L / 2, 14, 'post', `Plat dudukan ${i + 1} rel ${k + 1}`, t);
            add(`dudukan-${i}-r${k + 1}`, 'z', x, y, L, zr - L, 'rail-z', `Dudukan rel ${i + 1} rel ${k + 1}`, t);
          });
          add(`rel-${k + 1}`, 'x', 4, y, zr, W - 8, 'rail-x', `Rel gantung ${k + 1}`, t);
          for (let i = 0; i < nk; i++) {
            const xk = 8 + ((W - 16) * (i + 0.5)) / nk;
            add(`kait-${k + 1}-${i + 1}`, 'y', xk, y - L / 2 - 9, zr, 9, 'custom', `Kait S rel ${k + 1} no. ${i + 1}`, [8, 8]);
            add(`kait-${k + 1}-${i + 1}-ujung`, 'z', xk, y - L / 2 - 9, zr, 2.5, 'custom', `Ujung kait S rel ${k + 1} no. ${i + 1}`, [8, 8]);
          }
        });
      }
      return { members: list, boards, casters: [], W, D: Dp, H: top + 5, boardThick: 0, wall: true };
    }

    if (hang) {
      // 4 batang gantung di sudut, rangka keliling tiap tingkat
      const xs = [L / 2, W - L / 2];
      const zs = [L / 2, Dp - L / 2];
      xs.forEach((x, i) => zs.forEach((z, j) => add(`gantung-${i}-${j}`, 'y', x, yArm(ys[0]) - L / 2, z, ceil - (yArm(ys[0]) - L / 2), 'post', `Batang gantung ${i ? 'kanan' : 'kiri'} ${j ? 'depan' : 'belakang'}`, t)));
      ys.forEach((y, k) => {
        const ya = yArm(y);
        add(`t${k + 1}-belakang`, 'x', L, ya, zs[0], W - 2 * L, 'rail-x', `Palang tingkat ${k + 1} belakang`, t);
        add(`t${k + 1}-depan`, 'x', L, ya, zs[1], W - 2 * L, 'rail-x', `Palang tingkat ${k + 1} depan`, t);
        add(`t${k + 1}-kiri`, 'z', xs[0], ya, L, Dp - 2 * L, 'rail-z', `Palang tingkat ${k + 1} kiri`, t);
        add(`t${k + 1}-kanan`, 'z', xs[1], ya, L, Dp - 2 * L, 'rail-z', `Palang tingkat ${k + 1} kanan`, t);
      });
    } else {
      // Siku di beberapa titik sepanjang rak (maks. 80 cm antar siku)
      const nb = Math.max(2, Math.ceil((W - 20) / 80) + 1);
      const xs = Array.from({ length: nb }, (_, i) => 10 + ((W - 20) * i) / (nb - 1));
      xs.forEach((x, i) => {
        if (model === 'tiang') add(`tiang-${i}`, 'y', x, yArm(ys[0]) - 12, L / 2, ys[n - 1] + 4 - (yArm(ys[0]) - 12), 'post', `Tiang dinding ${i + 1}`, t);
        ys.forEach((y, k) => {
          const ya = yArm(y);
          if (model !== 'tiang') add(`plat-${i}-t${k + 1}`, 'y', x, ya - (model === 'siku-miring' ? 18 : 12), L / 2, (model === 'siku-miring' ? 18 : 12) + L / 2, 'post', `Siku dinding ${i + 1} tingkat ${k + 1}`, t);
          add(`lengan-${i}-t${k + 1}`, 'z', x, ya, L, Dp - L - 2, 'rail-z', `Lengan siku ${i + 1} tingkat ${k + 1}`, t);
          if (model === 'siku-miring') line(`penguat-${i}-t${k + 1}`, [x, ya - 16, L + 0.6], [x, ya - L / 2 - 0.6, Dp * 0.65], 'custom', `Penguat miring ${i + 1} tingkat ${k + 1}`, thin);
        });
      });
      // Bibir penahan: tiang kecil di ujung lengan + pipa tepi depan
      if (bool(p, 'bibir'))
        ys.forEach((y, k) => {
          const zl = Dp - 2 - L / 2;
          xs.forEach((x, i) => add(`bibir-tiang-${i}-t${k + 1}`, 'y', x, yArm(y) + L / 2, zl, b + 5, 'custom', `Tiang bibir ${i + 1} tingkat ${k + 1}`, thin));
          add(`bibir-t${k + 1}`, 'x', xs[0] - 5, y + 5 + 0.75, zl, xs[nb - 1] - xs[0] + 10, 'rail-x', `Bibir penahan tingkat ${k + 1}`, thin);
        });
      if (bool(p, 'gantunganGelas')) {
        const ya = yArm(ys[0]);
        xs.forEach((x, i) => add(`gelas-tiang-${i}`, 'y', x, ya - L / 2 - 10, Dp * 0.55, 10, 'custom', `Tiang gantungan gelas ${i + 1}`, thin));
        add('gantungan-gelas', 'x', xs[0] - 5, ya - L / 2 - 10 - 0.75, Dp * 0.55, xs[nb - 1] - xs[0] + 10, 'rail-x', 'Batang gantungan gelas', thin);
      }
    }
    if (hang && bool(p, 'gantunganGelas')) {
      const ya = yArm(ys[0]);
      add('gantungan-gelas', 'x', L, ya - L / 2 - 8, Dp / 2, W - 2 * L, 'rail-x', 'Batang gantungan gelas', thin);
      [0, 1].forEach((i) => add(`gelas-tiang-${i}`, 'y', i ? W - L / 2 : L / 2, ya - L / 2 - 8, Dp / 2, 8, 'custom', `Tiang gantungan gelas ${i + 1}`, thin));
    }

    if (b > 0) ys.forEach((y, k) => boards.push(board(`papan-${k + 1}`, `Papan tingkat ${k + 1}`, 0, W, y - b, y, hang ? 0 : L, Dp)));
    return { members: list, boards, casters: [], W, D: Dp, H: hang ? ceil : ys[n - 1] + 10, boardThick: 0, wall: !hang };
  },

  checks: (p) => {
    const out: ProductCheck[] = [];
    const model = str(p, 'model');
    if (model === 'siku' && num(p, 'dalam') > 30) out.push({ level: 'warn', message: 'Papan lebih dalam dari 30 cm di atas siku lurus mudah melendut ke depan.', fix: { label: 'Pakai siku miring', params: { model: 'siku-miring' } } });
    const top = model === 'gantung' ? 0 : num(p, 'tinggiMulai') + (num(p, 'tingkat') - 1) * num(p, 'jarak');
    if (top > 190) out.push({ level: 'info', message: `Tingkat teratas ${top} cm: sulit dijangkau tanpa tangga. Gelas & barang harian sebaiknya di bawah 183 cm.` });
    if (num(p, 'jarak') < 30 && num(p, 'dalam') >= 26) out.push({ level: 'info', message: 'Jarak antar tingkat di bawah 30 cm: botol 750 ml (±30 cm) tidak muat.' });
    if (model === 'kisi' && num(p, 'dalam') > 25) out.push({ level: 'warn', message: 'Rak kecil di panel kisi lebih dalam dari 25 cm mudah menarik kisi lepas dari tembok.', fix: { label: 'Kedalaman 20 cm', params: { dalam: 20 } } });
    if (model === 'pipa' && num(p, 'dalam') > 35) out.push({ level: 'warn', message: 'Lengan pipa lebih dari 35 cm melendut kena beban buku.', fix: { label: 'Kedalaman 28 cm', params: { dalam: 28 } } });
    if (model === 'kotak' && num(p, 'panjang') > 120 && str(p, 'pipa') === '20') out.push({ level: 'warn', message: 'Kotak dinding sepanjang ini berat; pakai pipa 30×30 dan baut ke tembok bata / beton.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
    if (model === 'rel') out.push({ level: 'info', message: `Muat ±${Math.max(3, Math.round((num(p, 'panjang') - 10) / 14)) * num(p, 'tingkat')} kait S.` });
    if (model === 'gantung') out.push({ level: 'info', message: 'Batang gantung dibaut ke balok / plat beton plafon, bukan ke plafon gipsum.' });
    else out.push({ level: 'info', message: 'Siku dibaut ke tembok dengan fischer minimal 2 titik per siku.' });
    return out;
  },
};
