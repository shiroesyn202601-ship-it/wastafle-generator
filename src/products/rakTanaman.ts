import { Board, Params, ProductCheck, ProductDef } from './types';
import { BOARD_THICK, board, materialParams, memberFactory, num, r1, str } from './common';

/**
 * Rak tanaman. Bentuk rangka (param `model`):
 * - tangga: tingkat paling depan paling rendah, makin ke belakang makin tinggi (satu muka)
 * - piramida: tangga dua muka, tingkat tertinggi di tengah, bisa dilihat dari depan & belakang
 * - pohon: satu tiang tengah di atas kaki silang, nampan pot bundar di ujung lengan berputar naik
 * - menara: menara ramping 4 tiang, nampan pot menjulur bergantian kiri–kanan dengan penguat miring
 * - gantung: gawang 2 tiang + palang atas berkait untuk pot gantung, rak pot di bawah
 * - teralis: rak pot rendah + teralis kisi di belakang untuk tanaman merambat
 */
const MODELS = [
  { value: 'tangga', label: 'Tangga satu muka', desc: 'Makin ke belakang makin tinggi' },
  { value: 'piramida', label: 'Piramida dua muka', desc: 'Tertinggi di tengah, dilihat dari dua sisi' },
  { value: 'pohon', label: 'Tiang pohon', desc: 'Nampan bundar di lengan berputar naik' },
  { value: 'menara', label: 'Menara vertikal', desc: 'Nampan menjulur kiri–kanan dari menara ramping' },
  { value: 'gantung', label: 'Gawang pot gantung', desc: 'Palang atas berkait + rak pot bawah' },
  { value: 'teralis', label: 'Rak + teralis rambat', desc: 'Rak pot rendah, kisi tinggi di belakang' },
];
const isM = (p: Params, ...m: string[]) => m.includes(str(p, 'model', 'tangga'));

export const RAK_TANAMAN: ProductDef = {
  id: 'rak-tanaman',
  name: 'Rak tanaman',
  tagline: 'bertingkat · tangga · pot bunga',
  icon: 'M8 34h44M12 34V22h12V12h12V4h12v30',
  steps: [
    { id: 'ukuran', title: 'Ukuran', keys: ['model', 'panjang', 'tinggi', 'tingkat'] },
    { id: 'bentuk', title: 'Bentuk', keys: ['dalamTingkat', 'naikTingkat'] },
    { id: 'bahan', title: 'Bahan', keys: ['pipa', 'papan', 'warna'] },
    { id: 'tambahan', title: 'Selesai', keys: [] },
  ],
  params: [
    { key: 'model', label: 'Bentuk rak', type: 'choice', options: MODELS },
    { key: 'panjang', label: 'Panjang', type: 'number', unit: 'cm', min: 40, max: 200, step: 1, help: 'Tiang pohon: lebar kaki silang (diameter jangkauan nampan).', marks: [{ value: 80, label: 'teras' }, { value: 120, label: 'taman' }], showIf: (p) => p.model !== 'menara' },
    { key: 'tinggi', label: 'Tinggi rangka', type: 'number', unit: 'cm', min: 80, max: 220, step: 1, showIf: (p) => p.model === 'gantung' || p.model === 'teralis' },
    { key: 'tingkat', label: 'Jumlah tingkat / nampan', type: 'number', unit: 'tingkat', min: 1, max: 6, step: 1, showIf: (p) => p.model !== 'gantung' },
    { key: 'dalamTingkat', label: 'Kedalaman tiap tingkat / nampan', type: 'number', unit: 'cm', min: 15, max: 45, step: 1, help: 'Sesuaikan dengan diameter pot terbesar.', marks: [{ value: 25, label: 'pot kecil' }, { value: 35, label: 'pot sedang' }] },
    { key: 'naikTingkat', label: 'Selisih tinggi antar tingkat', type: 'number', unit: 'cm', min: 12, max: 45, step: 1, marks: [{ value: 25, label: 'umum' }], showIf: (p) => p.model !== 'gantung' },
    ...materialParams(true),
  ],
  defaults: { model: 'tangga', panjang: 100, tinggi: 160, tingkat: 3, dalamTingkat: 25, naikTingkat: 25, pipa: '20', papan: 'kayu', warna: '#1f2226' },
  groups: [
    { id: 'bertingkat', name: 'Rak tanaman bertingkat', desc: 'Teras, taman, pojok ruangan' },
    { id: 'vertikal', name: 'Rak tanaman vertikal', desc: 'Lahan sempit, tanaman rambat' },
  ],
  signature: (p) => `rak-tanaman:${str(p, 'model', 'tangga')}`,
  presets: [
    {
      id: 'tangga',
      group: 'bertingkat',
      name: 'Rak tanaman tangga',
      desc: 'satu muka, tingkat makin ke belakang makin tinggi',
      params: { model: 'tangga' },
      sizes: [
        { label: 'Pot teras', desc: '100 cm, 3 tingkat', params: { panjang: 100, tingkat: 3, dalamTingkat: 25, naikTingkat: 25, pipa: '20' } },
        { label: 'Sukulen', desc: '60 cm, 4 tingkat rapat', params: { panjang: 60, tingkat: 4, dalamTingkat: 18, naikTingkat: 18, pipa: '20' } },
        { label: 'Pot besar', desc: '150 cm, 3 tingkat dalam', params: { panjang: 150, tingkat: 3, dalamTingkat: 35, naikTingkat: 30, pipa: '30' } },
      ],
    },
    {
      id: 'piramida',
      group: 'bertingkat',
      name: 'Rak tanaman piramida',
      desc: 'tangga dua muka, puncak di tengah, untuk tengah taman',
      params: { model: 'piramida', panjang: 100, tingkat: 3, dalamTingkat: 25, naikTingkat: 25 },
      sizes: [
        { label: 'Tengah taman', desc: '100 cm, 3 tingkat (5 baris pot)', params: { panjang: 100, tingkat: 3, dalamTingkat: 25, naikTingkat: 25, pipa: '20' } },
        { label: 'Pameran / nursery', desc: '150 cm, 3 tingkat dalam', params: { panjang: 150, tingkat: 3, dalamTingkat: 30, naikTingkat: 25, pipa: '30' } },
        { label: 'Anggrek / sukulen', desc: '80 cm, 4 tingkat rapat', params: { panjang: 80, tingkat: 4, dalamTingkat: 18, naikTingkat: 18, pipa: '20' } },
      ],
    },
    {
      id: 'pohon',
      group: 'bertingkat',
      name: 'Rak tanaman tiang pohon',
      desc: 'satu tiang tengah, nampan bundar di lengan yang berputar naik',
      params: { model: 'pohon', panjang: 80, tingkat: 5, dalamTingkat: 26, naikTingkat: 22, papan: 'kayu' },
      sizes: [
        { label: '5 pot', desc: 'jangkauan 80 cm, nampan 26 cm', params: { panjang: 80, tingkat: 5, dalamTingkat: 26, naikTingkat: 22 } },
        { label: 'Pojok ruangan', desc: 'jangkauan 60 cm, 4 nampan', params: { panjang: 60, tingkat: 4, dalamTingkat: 22, naikTingkat: 25 } },
        { label: 'Pot sedang', desc: 'jangkauan 100 cm, 6 nampan 32 cm', params: { panjang: 100, tingkat: 6, dalamTingkat: 32, naikTingkat: 22, pipa: '30' } },
      ],
    },
    {
      id: 'menara',
      group: 'vertikal',
      name: 'Menara pot vertikal',
      desc: 'menara 4 tiang ramping, nampan menjulur kiri–kanan dengan penguat miring',
      params: { model: 'menara', tingkat: 5, dalamTingkat: 25, naikTingkat: 28, pipa: '20' },
      sizes: [
        { label: 'Balkon', desc: '5 nampan 25 cm', params: { tingkat: 5, dalamTingkat: 25, naikTingkat: 28 } },
        { label: 'Pot kecil rapat', desc: '5 nampan 18 cm', params: { tingkat: 5, dalamTingkat: 18, naikTingkat: 22 } },
        { label: 'Pot sedang', desc: '4 nampan 32 cm', params: { tingkat: 4, dalamTingkat: 32, naikTingkat: 35, pipa: '30' } },
      ],
    },
    {
      id: 'teralis',
      group: 'vertikal',
      name: 'Rak pot + teralis rambat',
      desc: 'rak pot rendah, tiang belakang naik jadi kisi untuk tanaman merambat',
      params: { model: 'teralis', panjang: 100, tinggi: 170, tingkat: 2, dalamTingkat: 30, naikTingkat: 30, pipa: '20' },
      sizes: [
        { label: 'Pagar hidup teras', desc: '100 × 170 cm, 2 tingkat', params: { panjang: 100, tinggi: 170, tingkat: 2 } },
        { label: 'Panjang', desc: '150 × 180 cm, 1 tingkat', params: { panjang: 150, tinggi: 180, tingkat: 1, dalamTingkat: 35, naikTingkat: 40, pipa: '30' } },
        { label: 'Sempit', desc: '70 × 150 cm, 2 tingkat', params: { panjang: 70, tinggi: 150, tingkat: 2, dalamTingkat: 25, naikTingkat: 28 } },
      ],
    },
  ],
  summary: (p) => {
    const n = num(p, 'tingkat');
    if (isM(p, 'gantung')) return `${num(p, 'panjang')} × ${num(p, 'tinggi')} cm · pot gantung`;
    if (isM(p, 'teralis')) return `${num(p, 'panjang')} × ${num(p, 'tinggi')} cm · ${n} tingkat + teralis`;
    if (isM(p, 'pohon', 'menara')) return `${n} nampan ${num(p, 'dalamTingkat')} cm · tinggi ${(n - 1) * num(p, 'naikTingkat') + 20} cm`;
    return `${num(p, 'panjang')} cm · ${n} tingkat · tinggi ${n * num(p, 'naikTingkat')} cm`;
  },

  build: (p) => {
    const model = str(p, 'model', 'tangga');
    const W0 = num(p, 'panjang', 100);
    const n = Math.max(1, Math.round(num(p, 'tingkat', 3)));
    const d = num(p, 'dalamTingkat', 25);
    const h = num(p, 'naikTingkat', 25);
    const Ht = num(p, 'tinggi', 160);
    const L = (parseInt(str(p, 'pipa', '20')) || 20) / 10;
    const b = BOARD_THICK[str(p, 'papan', 'kayu')] ?? 2.5;
    const rail: [number, number] = [20, 20];
    const thin: [number, number] = [15, 15];
    const rh = 2;
    const pt: [number, number] = [L * 10, L * 10];
    const { list, add, line } = memberFactory();
    const boards: Board[] = [];
    let W = W0;
    let D = 0;
    let H = 0;

    if (model === 'tangga' || model === 'piramida') {
      // Ruas z: tiap ruas punya tingkat (1 = paling rendah). Tiang di setiap batas ruas, setinggi ruas tertinggi di sebelahnya.
      const nn = Math.max(2, n);
      const lv = model === 'tangga' ? Array.from({ length: nn }, (_, i) => nn - i) : Array.from({ length: 2 * nn - 1 }, (_, i) => nn - Math.abs(nn - 1 - i));
      // lv[j] = tingkat ruas ke-j dari belakang (z = 0) ke depan
      const m = lv.length;
      D = m * d;
      const zAt = (k: number) => (k === 0 ? L / 2 : k === m ? D - L / 2 : k * d);
      const xs = [L / 2, W - L / 2];
      for (let k = 0; k <= m; k++) {
        const hk = Math.max(lv[k - 1] ?? 0, lv[k] ?? 0) * h;
        xs.forEach((x, j) => add(`tiang-${k}-${j}`, 'y', x, 0, zAt(k), hk, 'post', `Tiang ${j ? 'kanan' : 'kiri'} batas ${k + 1}`, pt));
      }
      for (let j = 0; j < m; j++) {
        const yTop = lv[j] * h;
        const y = yTop - rh / 2;
        const zB = zAt(j);
        const zF = zAt(j + 1);
        const t = j + 1;
        add(`r${t}-depan`, 'x', L, y, zF, W - 2 * L, 'rail-x', `Palang ruas ${t} depan`, rail);
        add(`r${t}-belakang`, 'x', L, y, zB, W - 2 * L, 'rail-x', `Palang ruas ${t} belakang`, rail);
        xs.forEach((x, s) => add(`r${t}-${s ? 'kanan' : 'kiri'}`, 'z', x, y, zB + L / 2, zF - zB - L, 'rail-z', `Palang ruas ${t} ${s ? 'kanan' : 'kiri'}`, rail));
        // palang bawah supaya kaki tidak membuka
        xs.forEach((x, s) => add(`bawah-${t}-${s}`, 'z', x, 8, zB + L / 2, zF - zB - L, 'rail-z', `Palang bawah ruas ${t} ${s ? 'kanan' : 'kiri'}`, rail));
        if (b > 0) boards.push(board(`papan-${t}`, `Papan ruas ${t}`, L, W - L, yTop, yTop + b, zB - L / 2, zF + L / 2));
      }
      H = Math.max(...lv) * h + b;
    } else if (model === 'pohon') {
      // Kaki silang, tiang tengah, nampan bundar di ujung lengan berputar mengelilingi tiang; nampan teratas di puncak tiang
      D = W;
      const c = W / 2;
      const r = Math.max(d / 2 + 4, W / 2 - d / 2);
      add('kaki-x', 'x', 0, L / 2, c, W, 'rail-x', 'Kaki silang kiri–kanan', pt);
      add('kaki-z-b', 'z', c, L / 2, 0, c - L / 2, 'rail-z', 'Kaki silang belakang', pt);
      add('kaki-z-d', 'z', c, L / 2, c + L / 2, W - c - L / 2, 'rail-z', 'Kaki silang depan', pt);
      const ys = Array.from({ length: n }, (_, i) => r1(18 + i * h));
      const yTop = ys[n - 1];
      add('tiang', 'y', c, L, c, yTop - L, 'post', 'Tiang tengah', pt);
      ys.forEach((y, i) => {
        const t = i + 1;
        const top = i === n - 1;
        const ang = ((i * (360 / Math.max(1, Math.min(n - 1, 4))) + (i >= 4 ? 45 : 0)) * Math.PI) / 180;
        const tx = top ? c : c + r * Math.cos(ang);
        const tz = top ? c : c + r * Math.sin(ang);
        // lengan dilas rata di sisi tiang: pada sudut diagonal, titik awal mundur ke bidang sisi tiang (bukan ke dalam sudutnya)
        const r0 = L / 2 / Math.max(Math.abs(Math.cos(ang)), Math.abs(Math.sin(ang)));
        if (!top) line(`lengan-${t}`, [c + r0 * Math.cos(ang), y, c + r0 * Math.sin(ang)], [tx, y, tz], 'custom', `Lengan nampan ${t}`, rail);
        // dudukan silang: batang x menerus, batang z dipotong dua dan dilas di kedua sisi batang x
        const hd = d * 0.4;
        const tw = thin[0] / 20;
        add(`dudukan-${t}-x`, 'x', tx - hd, y + rh, tz, 2 * hd, 'rail-x', `Dudukan nampan ${t} (x)`, thin);
        add(`dudukan-${t}-z`, 'z', tx, y + rh, tz - hd, hd - tw, 'rail-z', `Dudukan nampan ${t} (z) belakang`, thin);
        add(`dudukan-${t}-z2`, 'z', tx, y + rh, tz + tw, hd - tw, 'rail-z', `Dudukan nampan ${t} (z) depan`, thin);
        if (b > 0) boards.push({ ...board(`nampan-${t}`, `Nampan pot ${t}`, tx - d / 2, tx + d / 2, y + rh + 0.75, y + rh + 0.75 + b, tz - d / 2, tz + d / 2), shape: 'round' });
      });
      H = yTop + rh + 1 + b;
    } else if (model === 'menara') {
      // Menara 20 cm di tengah, nampan d×d menjulur bergantian kiri / kanan, kaki lantai selebar rak
      const s = 20;
      W = s + 2 * d;
      D = Math.max(d, 25);
      const x0 = d + L / 2;
      const x1 = d + s - L / 2;
      const zb = L / 2;
      const zf = D - L / 2;
      const ys = Array.from({ length: n }, (_, i) => r1(25 + i * h));
      H = ys[n - 1] + 15;
      add('kaki-b', 'x', 0, L / 2, zb, W, 'rail-x', 'Kaki lantai belakang', pt);
      add('kaki-d', 'x', 0, L / 2, zf, W, 'rail-x', 'Kaki lantai depan', pt);
      [0, 1].forEach((j) => add(`kaki-ujung-${j}`, 'z', j ? W - L / 2 : L / 2, L / 2, L, D - 2 * L, 'rail-z', `Kaki lantai ujung ${j ? 'kanan' : 'kiri'}`, pt));
      [x0, x1].forEach((x, i) => [zb, zf].forEach((z, j) => add(`menara-${i}-${j}`, 'y', x, L, z, H - L, 'post', `Tiang menara ${i ? 'kanan' : 'kiri'} ${j ? 'depan' : 'belakang'}`, pt)));
      add('menara-atas-b', 'x', x0 + L / 2, H - 1, zb, x1 - x0 - L, 'rail-x', 'Palang atas menara belakang', rail);
      add('menara-atas-d', 'x', x0 + L / 2, H - 1, zf, x1 - x0 - L, 'rail-x', 'Palang atas menara depan', rail);
      ys.forEach((y, i) => {
        const t = i + 1;
        const left = i % 2 === 0;
        const xp = left ? x0 : x1; // tiang menara tempat nampan menempel
        const xe = left ? L / 2 + 0.5 : W - L / 2 - 0.5; // ujung luar
        const xa = left ? xe : xp + L / 2;
        const len = left ? xp - L / 2 - xe : xe - xa;
        const sd = left ? 'kiri' : 'kanan';
        add(`n${t}-b`, 'x', xa, y, zb, len, 'rail-x', `Lengan nampan ${t} ${sd} belakang`, rail);
        add(`n${t}-d`, 'x', xa, y, zf, len, 'rail-x', `Lengan nampan ${t} ${sd} depan`, rail);
        add(`n${t}-ujung`, 'z', xe, y, zb + 1, zf - zb - 2, 'rail-z', `Palang ujung nampan ${t}`, rail);
        add(`n${t}-ikat`, 'z', (x0 + x1) / 2, y, zb + 1, zf - zb - 2, 'rail-z', `Palang ikat menara ${t}`, rail);
        const dir = left ? -1 : 1;
        // penguat miring: kedua ujung dipotong datar (rata lengan di atas); ujung bawah digeser keluar supaya
        // sudut potongannya menempel di sisi tiang, tidak masuk ke dalam tiang
        const yb = y - d * 0.6;
        const yu = y - rh / 2;
        const xu = xp + dir * d * 0.6;
        let xb = xp + dir * (L / 2);
        for (let k = 0; k < 3; k++) {
          const uy = (yu - yb) / Math.hypot(xu - xb, yu - yb);
          xb = xp + dir * (L / 2 + thin[0] / 20 / uy);
        }
        [zb, zf].forEach((z, j) => line(`n${t}-penguat-${j}`, [xb, yb, z], [xu, yu, z], 'custom', `Penguat miring nampan ${t} ${j ? 'depan' : 'belakang'}`, thin));
        if (b > 0) boards.push(board(`nampan-${t}`, `Papan nampan ${t} ${sd}`, left ? 0 : xp + L / 2, left ? xp - L / 2 : W, y + rh / 2, y + rh / 2 + b, 0, D));
      });
      if (b > 0) boards.push(board('papan-puncak', 'Papan puncak menara', x0 - L / 2, x1 + L / 2, H, H + b, 0, D));
      H += b;
    } else if (model === 'gantung') {
      // Gawang: kaki melintang, 2 tiang, palang atas dengan kait; rak pot di bawah di antara tiang
      D = Math.max(40, Math.round(d * 1.5));
      H = Ht;
      const zc = D / 2;
      const xs = [L / 2, W - L / 2];
      xs.forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        add(`kaki-${nm}`, 'z', x, L / 2, 0, D, 'rail-z', `Kaki melintang ${nm}`, pt);
        add(`tiang-${nm}`, 'y', x, L, zc, H - L, 'post', `Tiang ${nm}`, pt);
        add(`rak-${nm}`, 'z', x, 22, zc - d / 2, d, 'rail-z', `Palang rak pot ${nm}`, rail);
      });
      add('palang-atas', 'x', L, H - L / 2, zc, W - 2 * L, 'rail-x', 'Palang atas gantungan pot', pt);
      add('palang-tengah', 'x', L, H * 0.55, zc, W - 2 * L, 'rail-x', 'Palang tengah', rail);
      add('rak-depan', 'x', L / 2 - 1, 22, zc + d / 2 - 1, W - L + 2, 'rail-x', 'Palang rak pot depan', rail);
      add('rak-belakang', 'x', L / 2 - 1, 22, zc - d / 2 + 1, W - L + 2, 'rail-x', 'Palang rak pot belakang', rail);
      if (b > 0) boards.push(board('papan-rak', 'Papan rak pot', L, W - L, 23, 23 + b, zc - d / 2, zc + d / 2));
      const nk = Math.max(2, Math.round((W - 2 * L) / 30));
      for (let i = 0; i < nk; i++) {
        const xk = L + ((W - 2 * L) * (i + 0.5)) / nk;
        add(`kait-${i + 1}`, 'y', xk, H - L - 8, zc, 8, 'custom', `Kait pot gantung ${i + 1}`, thin);
        add(`kait-${i + 1}-ujung`, 'z', xk, H - L - 8, zc, 4, 'custom', `Ujung kait ${i + 1}`, thin);
      }
    } else {
      // teralis: rak pot rendah (tiang depan pendek) + tiang belakang tinggi dengan kisi
      D = d;
      H = Ht;
      const zb = L / 2;
      const zf = D - L / 2;
      const xs = [L / 2, W - L / 2];
      const ytop = n * h;
      xs.forEach((x, i) => {
        const nm = i ? 'kanan' : 'kiri';
        add(`tiang-${nm}-b`, 'y', x, 0, zb, H, 'post', `Tiang ${nm} belakang (teralis)`, pt);
        add(`tiang-${nm}-d`, 'y', x, 0, zf, ytop, 'post', `Tiang ${nm} depan`, pt);
        add(`bawah-${nm}`, 'z', x, 8, L, D - 2 * L, 'rail-z', `Palang bawah ${nm}`, rail);
      });
      for (let i = 1; i <= n; i++) {
        const y = i * h - rh / 2;
        add(`t${i}-depan`, 'x', L, y, zf, W - 2 * L, 'rail-x', `Palang tingkat ${i} depan`, rail);
        add(`t${i}-belakang`, 'x', L, y, zb, W - 2 * L, 'rail-x', `Palang tingkat ${i} belakang`, rail);
        xs.forEach((x, j) => add(`t${i}-${j ? 'kanan' : 'kiri'}`, 'z', x, y, L, D - 2 * L, 'rail-z', `Palang tingkat ${i} ${j ? 'kanan' : 'kiri'}`, rail));
        if (b > 0) boards.push(board(`papan-${i}`, `Papan tingkat ${i}`, L, W - L, i * h, i * h + b, 0, D));
      }
      add('teralis-atas', 'x', L, H - L / 2, zb, W - 2 * L, 'rail-x', 'Palang atas teralis', pt);
      // Kisi sebidang: kisi tegak menerus dari atas palang tingkat teratas sampai bawah palang atas teralis;
      // kisi datar dipotong pendek di antara tiang & kisi tegak, dilas rata di kedua sisinya.
      const y0 = ytop;
      const y1 = H - L;
      const tw = thin[0] / 20;
      const nv = Math.max(1, Math.round((W - 2 * L) / 20) - 1);
      const xv = Array.from({ length: nv }, (_, i) => L + ((W - 2 * L) * (i + 1)) / (nv + 1));
      xv.forEach((x, i) => add(`kisi-tegak-${i + 1}`, 'y', x, y0, zb, y1 - y0, 'custom', `Kisi tegak ${i + 1}`, thin));
      const edges = [L, ...xv.flatMap((x) => [x - tw, x + tw]), W - L];
      const nh = Math.max(1, Math.round((y1 - y0) / 20) - 1);
      for (let i = 1; i <= nh; i++) {
        const yk = y0 + ((y1 - y0) * i) / (nh + 1);
        for (let k = 0; k + 1 < edges.length; k += 2)
          add(`kisi-datar-${i}-${k / 2 + 1}`, 'x', edges[k], yk, zb, edges[k + 1] - edges[k], 'custom', `Kisi datar ${i} ruas ${k / 2 + 1}`, thin);
      }
    }

    return { members: list, boards, casters: [], W, D, H, boardThick: 0 };
  },

  checks: (p) => {
    const out: ProductCheck[] = [];
    const model = str(p, 'model', 'tangga');
    const W = num(p, 'panjang');
    const d = num(p, 'dalamTingkat');
    const h = num(p, 'naikTingkat');
    const n = num(p, 'tingkat');
    if (W > 120 && str(p, 'pipa') === '20' && model !== 'pohon' && model !== 'menara')
      out.push({ level: 'warn', message: 'Pot tanah basah berat. Rak sepanjang ini sebaiknya pakai pipa 30×30.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
    if ((model === 'tangga' || model === 'piramida') && h < d * 0.6) out.push({ level: 'info', message: 'Selisih tinggi kecil: daun tanaman depan bisa menutupi pot di belakangnya.' });
    if ((model === 'tangga' || model === 'piramida') && n < 2)
      out.push({ level: 'warn', message: 'Rak tangga butuh minimal 2 tingkat.', fix: { label: '3 tingkat', params: { tingkat: 3 } } });
    if (model === 'pohon') {
      const reach = W / 2;
      if (reach - d / 2 < d * 0.6) out.push({ level: 'warn', message: 'Jangkauan terlalu kecil: nampan saling bertumpuk di sekeliling tiang.', fix: { label: `Lebar ${Math.min(200, Math.ceil(d * 3.2))} cm`, params: { panjang: Math.min(200, Math.ceil(d * 3.2)) } } });
      if (reach > 60) out.push({ level: 'warn', message: 'Lengan lebih dari 60 cm melendut kena pot basah.', fix: { label: 'Lebar 100 cm', params: { panjang: 100 } } });
      if (h < 18) out.push({ level: 'warn', message: 'Nampan terlalu rapat, tanaman tidak punya ruang tumbuh.', fix: { label: 'Selisih 22 cm', params: { naikTingkat: 22 } } });
      if ((n - 1) * h + 20 > 180 && str(p, 'pipa') === '20') out.push({ level: 'warn', message: 'Tiang tunggal 20×20 terlalu ramping untuk setinggi ini.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
    }
    if (model === 'menara') {
      const H = 25 + (n - 1) * h + 15;
      const Wm = 20 + 2 * d;
      if (H / Wm > 2.6) out.push({ level: 'warn', message: 'Menara tinggi dengan kaki sempit mudah terguling saat pot di satu sisi lebih berat.', fix: { label: 'Kurangi 1 nampan', params: { tingkat: Math.max(1, n - 1) } } });
      if (d > 30 && str(p, 'pipa') === '20') out.push({ level: 'warn', message: 'Nampan menjulur sedalam ini butuh pipa 30×30.', fix: { label: 'Pakai pipa 30×30', params: { pipa: '30' } } });
    }
    if (model === 'gantung' && num(p, 'tinggi') / Math.max(40, d * 1.5) > 4.5)
      out.push({ level: 'warn', message: 'Gawang tinggi dengan kaki pendek mudah terguling kena angin.', fix: { label: 'Rak pot 35 cm', params: { dalamTingkat: 35 } } });
    if (model === 'teralis') {
      if (num(p, 'tinggi') < n * h + 40) out.push({ level: 'warn', message: 'Teralis hampir tidak terlihat: rangka kurang tinggi dari rak potnya.', fix: { label: `Tinggi ${Math.min(220, n * h + 100)} cm`, params: { tinggi: Math.min(220, n * h + 100) } } });
      if (num(p, 'tinggi') / d > 6) out.push({ level: 'warn', message: 'Teralis tinggi dengan alas sempit: angkur ke tembok atau perdalam rak.', fix: { label: 'Kedalaman 35 cm', params: { dalamTingkat: 35 } } });
    }
    out.push({ level: 'info', message: 'Untuk di luar ruangan, pilih besi galvanis atau cat dasar anti karat 2 lapis.' });
    return out;
  },
};
