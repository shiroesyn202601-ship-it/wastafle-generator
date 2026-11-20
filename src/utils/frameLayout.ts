import { KitchenConfig, FrameMember, FrameAxis, FrameMemberRole } from '../types/kitchen';

export interface Box3 {
  min: [number, number, number];
  max: [number, number, number];
}

/** Nama fungsi batang dalam bahasa sehari-hari (istilah bengkel ada di FRAME_ROLE_TRADE) */
export const FRAME_ROLE_LABELS: Record<FrameMemberRole, string> = {
  post: 'Kaki / tiang',
  'rail-x': 'Palang kiri–kanan',
  'rail-z': 'Palang depan–belakang',
  'sink-cradle': 'Penyangga bak cuci',
  'stove-cradle': 'Penyangga kompor',
  custom: 'Batang tambahan',
};

/** Istilah bengkel untuk tiap fungsi batang (ditampilkan kecil di samping nama awam) */
export const FRAME_ROLE_TRADE: Record<FrameMemberRole, string> = {
  post: 'tiang · post',
  'rail-x': 'gelagar memanjang',
  'rail-z': 'palang kedalaman',
  'sink-cradle': 'cradle wastafel',
  'stove-cradle': 'gelagar kompor',
  custom: 'batang kustom',
};

export const AXIS_LABELS: Record<FrameAxis, string> = {
  x: 'Kiri–kanan (X)',
  y: 'Tegak (Y)',
  z: 'Depan–belakang (Z)',
};

/** Ukuran-ukuran dasar meja dalam cm yang dipakai rangka */
export function getFrameDims(config: KitchenConfig) {
  const W = config.totalWidth;
  const D = config.totalDepth;
  const H = config.totalHeight;
  const topT = config.countertopThickness ?? 4;
  const plinthH = config.plinthHeight ?? 10;
  const overhang = config.countertopOverhangFront ?? 2;
  const carcaseD = D - overhang;
  const tube = (config.frame?.tubeSize || 40) / 10;
  const legType = config.legType ?? 'plinth';
  const frameH = H - topT; // bidang bawah top table
  const postBottom = legType === 'frame' ? 0 : plinthH;
  return { W, D, H, topT, plinthH, carcaseD, tube, legType, frameH, postBottom };
}

/** Posisi X batas antar kolom (cm dari kiri), tanpa sisi luar */
export function getColumnBoundaries(config: KitchenConfig): number[] {
  const W = config.totalWidth;
  const total = config.columns.reduce((s, c) => s + c.width, 0) || 1;
  const xs: number[] = [];
  let acc = 0;
  config.columns.forEach((col, idx) => {
    if (idx < config.columns.length - 1) {
      acc += (col.width / total) * W;
      xs.push(acc);
    }
  });
  return xs;
}

const r1 = (v: number) => Math.round(v * 10) / 10;

/** Rangka otomatis: mengikuti ukuran meja, pembagian modul, posisi wastafel & kompor */
export function generateAutoFrameMembers(config: KitchenConfig): FrameMember[] {
  const { W, H, topT, plinthH, carcaseD, tube: t, frameH, postBottom } = getFrameDims(config);
  const members: FrameMember[] = [];
  const add = (m: Omit<FrameMember, 'x' | 'y' | 'z' | 'length'> & { x: number; y: number; z: number; length: number }) =>
    members.push({ ...m, x: r1(m.x), y: r1(m.y), z: r1(m.z), length: r1(m.length) });

  const zFront = carcaseD - t / 2;
  const zBack = t / 2;
  const topY = frameH - t / 2;
  const bottomY = plinthH + t / 2;
  const boundaries = getColumnBoundaries(config);

  // Tiang vertikal: 4 sudut + sekat antar kolom (depan & belakang)
  const postXs = [t / 2, ...boundaries, W - t / 2];
  postXs.forEach((px, i) => {
    const isCorner = i === 0 || i === postXs.length - 1;
    [zFront, zBack].forEach((pz) => {
      add({
        id: `auto-post-${i}-${pz === zFront ? 'f' : 'b'}`,
        axis: 'y',
        role: 'post',
        label: isCorner
          ? `Tiang Sudut ${i === 0 ? 'Kiri' : 'Kanan'} ${pz === zFront ? 'Depan' : 'Belakang'}`
          : `Tiang Sekat K${i}-K${i + 1} ${pz === zFront ? 'Depan' : 'Belakang'}`,
        x: px,
        y: postBottom,
        z: pz,
        length: frameH - postBottom,
      });
    });
  });

  // Gelagar memanjang atas & bawah (depan & belakang)
  [
    { y: topY, name: 'Atas' },
    { y: bottomY, name: 'Bawah' },
  ].forEach((lvl) => {
    [zFront, zBack].forEach((pz) => {
      add({
        id: `auto-railx-${lvl.name}-${pz === zFront ? 'f' : 'b'}`,
        axis: 'x',
        role: 'rail-x',
        label: `Gelagar ${lvl.name} ${pz === zFront ? 'Depan' : 'Belakang'}`,
        x: t,
        y: lvl.y,
        z: pz,
        length: W - 2 * t,
      });
    });
  });

  // Palang kedalaman sisi kiri & kanan (atas & bawah)
  [
    { x: t / 2, name: 'Kiri' },
    { x: W - t / 2, name: 'Kanan' },
  ].forEach((side) => {
    [
      { y: topY, name: 'Atas' },
      { y: bottomY, name: 'Bawah' },
    ].forEach((lvl) => {
      add({
        id: `auto-railz-${side.name}-${lvl.name}`,
        axis: 'z',
        role: 'rail-z',
        label: `Palang Samping ${side.name} ${lvl.name}`,
        x: side.x,
        y: lvl.y,
        z: t,
        length: carcaseD - 2 * t,
      });
    });
  });

  // Palang kedalaman pada sekat kolom (atas dilewati jika berada di zona wastafel/kompor)
  const { sink, stove } = config;
  const inZone = (x: number, enabled: boolean, cx: number, w: number) =>
    enabled && x >= cx - w / 2 - 4 && x <= cx + w / 2 + 4;
  boundaries.forEach((bx, i) => {
    const blocked = inZone(bx, sink.enabled, sink.posX, sink.width) || inZone(bx, stove.enabled, stove.posX, stove.width);
    if (!blocked) {
      add({ id: `auto-midz-top-${i}`, axis: 'z', role: 'rail-z', label: `Palang Sekat K${i + 1}-K${i + 2} Atas`, x: bx, y: topY, z: t, length: carcaseD - 2 * t });
    }
    add({ id: `auto-midz-bot-${i}`, axis: 'z', role: 'rail-z', label: `Palang Sekat K${i + 1}-K${i + 2} Bawah`, x: bx, y: bottomY, z: t, length: carcaseD - 2 * t });
  });

  const supports = config.frame?.supports || [];

  /**
   * Penyangga alat (wastafel/kompor) yang tersambung ke rangka utama:
   * - Palang kedalaman (Z) di kiri & kanan alat, dari tiang belakang ke tiang depan.
   * - Jika di posisi palang sudah ada tiang rangka (sekat kolom / sudut), palang menempel ke tiang itu.
   *   Jika tidak, dipasang tiang gantung depan & belakang yang menggantung dari gelagar atas.
   * - Strap / pengikat memanjang (X) dari as palang kiri ke as palang kanan.
   */
  const addCradle = (
    prefix: string,
    role: 'sink-cradle' | 'stove-cradle',
    name: string,
    cx: number,
    halfW: number,
    cy: number,
    straps: { z: number; label: string }[]
  ) => {
    const appMinX = cx - halfW;
    const appMaxX = cx + halfW;
    const sides = [
      { key: 'l', label: 'Kiri', x: appMinX - t / 2 - 1.2, dir: -1 },
      { key: 'r', label: 'Kanan', x: appMaxX + t / 2 + 1.2, dir: 1 },
    ].map((side) => {
      // Alat terlalu mepet tepi meja: palang ditahan di tiang sudut
      if (side.x < t / 2 || side.x > W - t / 2) {
        return { ...side, x: side.x < t / 2 ? t / 2 : W - t / 2, onPost: true };
      }
      // Tempelkan ke tiang terdekat bila jaraknya < 1.25× pipa dan tiang itu tidak masuk ke area alat
      const near = postXs.find((px) => Math.abs(px - side.x) <= t * 1.25);
      const clear = near !== undefined && (side.dir < 0 ? near + t / 2 <= appMinX : near - t / 2 >= appMaxX);
      return { ...side, x: clear ? near! : side.x, onPost: clear };
    });

    sides.forEach((side) => {
      add({ id: `${prefix}-${side.key}`, axis: 'z', role, label: `${name} ${side.label}`, x: side.x, y: cy, z: t, length: carcaseD - 2 * t });
      // Tiang gantung hanya perlu bila palang tidak menempel tiang dan berada di bawah gelagar atas
      if (!side.onPost && topY - cy >= t) {
        [
          { z: zFront, label: 'Depan' },
          { z: zBack, label: 'Belakang' },
        ].forEach((h) => {
          add({
            id: `${prefix}-${side.key}-hang-${h.label === 'Depan' ? 'f' : 'b'}`,
            axis: 'y',
            role,
            label: `Tiang Gantung ${name} ${side.label} ${h.label}`,
            x: side.x,
            y: cy - t / 2,
            z: h.z,
            length: topY - cy,
          });
        });
      }
    });

    const xL = sides[0].x;
    const xR = sides[1].x;
    straps.forEach((s, i) => {
      add({ id: `${prefix}-strap-${i}`, axis: 'x', role, label: s.label, x: xL, y: cy, z: s.z, length: xR - xL });
    });
  };

  // Penyangga wastafel: palang di samping bak + 2 strap di bawah dasar bak
  const sinkSupp = supports.find((s) => s.type === 'sink-cradle');
  if (sink.enabled && sinkSupp?.enabled !== false) {
    const bowlFloorY = (sink.mounting === 'undermount' ? H - topT : H) - sink.bowlDepth;
    const cy = bowlFloorY - t / 2 - 1.2;
    addCradle('auto-sink', 'sink-cradle', 'Penyangga Wastafel', sink.posX, sink.width / 2, cy, [
      { z: Math.min(carcaseD - t - 2, sink.posY + sink.length * 0.28), label: 'Strap Dasar Bak Depan' },
      { z: Math.max(t + 2, sink.posY - sink.length * 0.28), label: 'Strap Dasar Bak Belakang' },
    ]);
  }

  // Penyangga kompor: palang di samping bodi kompor + 1 pengikat
  const stoveSupp = supports.find((s) => s.type === 'stove-cradle');
  if (stove.enabled && stoveSupp?.enabled !== false) {
    const sy = H - stove.recessDepth - t / 2 - 1.2;
    addCradle('auto-stove', 'stove-cradle', 'Penyangga Kompor', stove.posX, stove.width / 2 - 0.2, sy, [
      { z: Math.max(t + 2, stove.posY - stove.length * 0.25), label: 'Pengikat Penyangga Kompor' },
    ]);
  }

  // Batang kustom lama (dari panel Material)
  supports.forEach((s) => {
    if (!s.enabled || s.type === 'sink-cradle' || s.type === 'stove-cradle') return;
    const len = s.length || 60;
    const base = { id: `auto-supp-${s.id}`, role: 'custom' as const, label: s.name, tubeSize: s.tubeSize };
    if (s.type === 'crossbeam-x') add({ ...base, axis: 'x', x: s.posX - len / 2, y: s.posY, z: s.posZ ?? 30, length: len });
    else if (s.type === 'crossbeam-z') add({ ...base, axis: 'z', x: s.posX, y: s.posY, z: (s.posZ ?? 30) - len / 2, length: len });
    else if (s.type === 'vertical-post') add({ ...base, axis: 'y', x: s.posX, y: postBottom, z: s.posZ ?? 30, length: frameH - postBottom });
  });

  return members;
}

/** Daftar batang rangka yang berlaku (manual jika sudah diedit, otomatis jika belum) */
export function getFrameMembers(config: KitchenConfig): FrameMember[] {
  if (config.frame?.customLayout && config.frame.members) return config.frame.members;
  if (config.frame?.autoMembers) return config.frame.autoMembers;
  return generateAutoFrameMembers(config);
}

export function memberTubeCm(m: FrameMember, config: KitchenConfig): number {
  return (m.tubeSize || config.frame?.tubeSize || 40) / 10;
}

/**
 * Penampang batang (cm) per sumbu [x, y, z]; sumbu batang sendiri tidak dipakai.
 * Batang mendatar: tubeH = tinggi (Y), tubeSize = lebar. Tiang: tubeSize = lebar (X), tubeH = tebal (Z).
 */
export function memberSectionCm(m: FrameMember, config: KitchenConfig): [number, number, number] {
  const w = memberTubeCm(m, config);
  const h = m.tubeH ? m.tubeH / 10 : w;
  if (m.end) return [w, h, w]; // batang miring: [sisi samping, sisi di bidang miring, -]
  return m.axis === 'y' ? [w, w, h] : [w, h, w];
}

/** Label profil pipa dalam mm, mis. "40×40" atau "20×40" (lebar × tinggi/tebal) */
export function memberProfileLabel(m: FrameMember, config: KitchenConfig): string {
  const w = m.tubeSize || config.frame?.tubeSize || 40;
  return `${w}×${m.tubeH || w}`;
}

// ---------- Batang miring ----------

export type V3 = [number, number, number];
const AX: FrameAxis[] = ['x', 'y', 'z'];

export const isAngled = (m: FrameMember) => !!m.end;
export const memberStart = (m: FrameMember): V3 => [m.x, m.y, m.z];
export function memberEndPoint(m: FrameMember): V3 {
  if (m.end) return [m.end.x, m.end.y, m.end.z];
  const e: V3 = [m.x, m.y, m.z];
  e[AX.indexOf(m.axis)] += m.length;
  return e;
}

/**
 * Sumbu normal bidang potong ujung batang miring: batang yang cukup tegak (kaki, tiang sandaran) dipotong
 * rata lantai (horizontal); batang lain dipotong tegak lurus sumbu dominannya.
 */
export function cutAxisIndex(m: FrameMember): number {
  if (!m.end) return AX.indexOf(m.axis);
  const a = memberStart(m);
  const b = memberEndPoint(m);
  const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) || 1;
  return Math.abs(b[1] - a[1]) / len >= 0.35 ? 1 : AX.indexOf(m.axis);
}

/** Sudut potong ujung batang miring (derajat dari potongan lurus 90°); 0 = batang lurus */
export function memberTiltDeg(m: FrameMember): number {
  if (!m.end) return 0;
  const a = memberStart(m);
  const b = memberEndPoint(m);
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const len = Math.hypot(d[0], d[1], d[2]) || 1;
  const dom = Math.abs(d[cutAxisIndex(m)]) / len;
  return Math.round(((Math.acos(Math.min(1, dom)) * 180) / Math.PI) * 10) / 10;
}

/**
 * Batang dari dua titik as (cm). Bila kedua titik segaris sumbu → batang lurus biasa (tanpa `end`),
 * selain itu batang miring dengan sumbu dominan & panjang dihitung otomatis.
 */
export function memberFromPoints(base: Omit<FrameMember, 'axis' | 'x' | 'y' | 'z' | 'length' | 'end'>, a: V3, b: V3): FrameMember {
  const r = (v: number) => Math.round(v * 10) / 10;
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const nonZero = d.map((v) => Math.abs(v) > 0.05);
  const domI = [0, 1, 2].reduce((best, i) => (Math.abs(d[i]) > Math.abs(d[best]) ? i : best), 0);
  const len = r(Math.hypot(d[0], d[1], d[2]));
  if (nonZero.filter(Boolean).length <= 1) {
    const lo = d[domI] >= 0 ? a : b;
    return { ...base, axis: AX[domI], x: r(lo[0]), y: r(lo[1]), z: r(lo[2]), length: len };
  }
  return { ...base, axis: AX[domI], x: r(a[0]), y: r(a[1]), z: r(a[2]), length: len, end: { x: r(b[0]), y: r(b[1]), z: r(b[2]) } };
}

/** Arah & penampang batang miring: u = arah batang, wd = arah sisi `a` (samping), hd = arah sisi `b` */
export function angledFrame(m: FrameMember, a: number, b: number) {
  const s = memberStart(m);
  const e = memberEndPoint(m);
  const d = [e[0] - s[0], e[1] - s[1], e[2] - s[2]];
  const len = Math.hypot(d[0], d[1], d[2]) || 1;
  const u: V3 = [d[0] / len, d[1] / len, d[2] / len];
  // sisi samping: sumbu dunia yang paling tegak lurus terhadap batang, diproyeksikan ke bidang penampang
  const k = [0, 1, 2].filter((i) => i !== AX.indexOf(m.axis)).reduce((best, i) => (Math.abs(u[i]) < Math.abs(u[best]) ? i : best));
  const ek: V3 = [0, 0, 0];
  ek[k] = 1;
  const dot = u[k];
  const w0: V3 = [ek[0] - dot * u[0], ek[1] - dot * u[1], ek[2] - dot * u[2]];
  const wl = Math.hypot(w0[0], w0[1], w0[2]) || 1;
  const wd: V3 = [w0[0] / wl, w0[1] / wl, w0[2] / wl];
  const hd: V3 = [u[1] * wd[2] - u[2] * wd[1], u[2] * wd[0] - u[0] * wd[2], u[0] * wd[1] - u[1] * wd[0]];
  const c: V3 = [(s[0] + e[0]) / 2, (s[1] + e[1]) / 2, (s[2] + e[2]) / 2];
  return { c, u, wd, hd, len, a, b };
}

/** 8 titik sudut batang (cm), untuk batang lurus maupun miring */
export function memberCorners(m: FrameMember, section: [number, number, number]): V3[] {
  if (!m.end) {
    const bx = memberBox(m, section);
    const out: V3[] = [];
    [0, 1].forEach((i) => [0, 1].forEach((j) => [0, 1].forEach((k) => out.push([i ? bx.max[0] : bx.min[0], j ? bx.max[1] : bx.min[1], k ? bx.max[2] : bx.min[2]]))));
    return out;
  }
  // Ujung dipotong miring: sudut-sudut ujung berada di bidang yang tegak lurus sumbu dominan lewat titik ujung
  // (kaki rata lantai, ujung atas rata dengan palang), sesuai catatan potong di daftar potongan.
  const f = angledFrame(m, section[0], section[1]);
  const di = cutAxisIndex(m);
  const un = f.u[di] || 1e-6; // komponen arah batang pada sumbu dominan
  const out: V3[] = [];
  [-1, 1].forEach((i) =>
    [-1, 1].forEach((j) =>
      [-1, 1].forEach((k) => {
        const off: V3 = [0, 0, 0];
        for (let q = 0; q < 3; q++) off[q] = f.wd[q] * (j * f.a) / 2 + f.hd[q] * (k * f.b) / 2;
        const t = -off[di] / un; // geser sepanjang batang supaya sudut jatuh di bidang potong
        const p: V3 = [0, 0, 0];
        for (let q = 0; q < 3; q++) p[q] = f.c[q] + f.u[q] * ((i * f.len) / 2 + t) + off[q];
        out.push(p);
      })
    )
  );
  return out;
}

/** Kotak 3D (cm) yang ditempati satu batang (batang miring: kotak pembungkus 8 sudutnya) */
export function memberBox(m: FrameMember, section: number | [number, number, number]): Box3 {
  const s = typeof section === 'number' ? [section, section, section] : section;
  if (m.end) {
    const cs = memberCorners(m, s as [number, number, number]);
    const min: [number, number, number] = [Infinity, Infinity, Infinity];
    const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
    cs.forEach((p) => p.forEach((v, i) => ((min[i] = Math.min(min[i], v)), (max[i] = Math.max(max[i], v)))));
    return { min, max };
  }
  const min: [number, number, number] = [m.x - s[0] / 2, m.y - s[1] / 2, m.z - s[2] / 2];
  const max: [number, number, number] = [m.x + s[0] / 2, m.y + s[1] / 2, m.z + s[2] / 2];
  const i = m.axis === 'x' ? 0 : m.axis === 'y' ? 1 : 2;
  min[i] = (m.axis === 'x' ? m.x : m.axis === 'y' ? m.y : m.z);
  max[i] = min[i] + m.length;
  return { min, max };
}

export function boxesIntersect(a: Box3, b: Box3, eps = 0.1): boolean {
  for (let i = 0; i < 3; i++) {
    if (a.max[i] <= b.min[i] + eps || b.max[i] <= a.min[i] + eps) return false;
  }
  return true;
}

/** Dua batang dianggap tersambung (bisa dilas) bila bersentuhan atau bertumpuk, toleransi 0.3 cm */
export function boxesTouch(a: Box3, b: Box3, tol = 0.3): boolean {
  for (let i = 0; i < 3; i++) {
    if (a.max[i] < b.min[i] - tol || b.max[i] < a.min[i] - tol) return false;
  }
  return true;
}

export type AxisIndex = 0 | 1 | 2;
export const AXIS_INDEX: Record<FrameAxis, AxisIndex> = { x: 0, y: 1, z: 2 };

/**
 * Titik magnet per sumbu (cm) dari batang lain: sisi min, as tengah, sisi max.
 * Dipakai editor 2D supaya batang yang digeser/ditarik otomatis menempel ke batang terdekat.
 */
export function getSnapTargets(config: KitchenConfig, members: FrameMember[], excludeId: string): number[][] {
  const { W, H, D, plinthH, frameH } = getFrameDims(config);
  const targets: number[][] = [
    [0, W],
    [0, plinthH, frameH, H],
    [0, D],
  ];
  members.forEach((m) => {
    if (m.id === excludeId) return;
    const b = memberBox(m, memberSectionCm(m, config));
    for (let i = 0; i < 3; i++) {
      targets[i].push(b.min[i], (b.min[i] + b.max[i]) / 2, b.max[i]);
    }
  });
  return targets;
}

/** Cari geseran terkecil agar salah satu `anchors` jatuh tepat di salah satu `targets` (dalam batas `threshold`) */
export function findSnap(anchors: number[], targets: number[], threshold: number): { delta: number; target: number } | null {
  let best: { delta: number; target: number } | null = null;
  anchors.forEach((a) => {
    targets.forEach((t) => {
      const d = t - a;
      if (Math.abs(d) <= threshold && (!best || Math.abs(d) < Math.abs(best.delta))) best = { delta: d, target: t };
    });
  });
  return best;
}

/** Ruang yang dipakai bak wastafel & bodi kompor tanam (cm) */
export function getApplianceBoxes(config: KitchenConfig): { kind: 'sink' | 'stove'; label: string; box: Box3 }[] {
  const { H, topT } = getFrameDims(config);
  const out: { kind: 'sink' | 'stove'; label: string; box: Box3 }[] = [];
  const { sink, stove } = config;
  if (sink.enabled) {
    const top = sink.mounting === 'undermount' ? H - topT : H;
    out.push({
      kind: 'sink',
      label: 'Bak Wastafel',
      box: {
        min: [sink.posX - sink.width / 2 + 0.5, top - sink.bowlDepth, sink.posY - sink.length / 2 + 0.5],
        max: [sink.posX + sink.width / 2 - 0.5, top, sink.posY + sink.length / 2 - 0.5],
      },
    });
  }
  if (stove.enabled) {
    out.push({
      kind: 'stove',
      label: 'Bodi Kompor Tanam',
      box: {
        min: [stove.posX - (stove.width - 4) / 2, H - stove.recessDepth, stove.posY - (stove.length - 4) / 2],
        max: [stove.posX + (stove.width - 4) / 2, H, stove.posY + (stove.length - 4) / 2],
      },
    });
  }
  return out;
}

export interface FrameWarning {
  memberId: string;
  message: string;
}

/** Peringatan: batang menembus bak/kompor atau keluar dari batas meja */
export function getFrameWarnings(config: KitchenConfig, members: FrameMember[]): FrameWarning[] {
  const { W, H, D } = getFrameDims(config);
  const appliances = getApplianceBoxes(config);
  const warnings: FrameWarning[] = [];
  const boxes = members.map((m) => memberBox(m, memberSectionCm(m, config)));
  members.forEach((m, i) => {
    const box = boxes[i];
    const name = m.label || FRAME_ROLE_LABELS[m.role];
    if (members.length > 1 && !boxes.some((b, j) => j !== i && boxesTouch(box, b))) {
      warnings.push({ memberId: m.id, message: `${name} tidak tersambung ke rangka` });
    }
    appliances.forEach((a) => {
      if (boxesIntersect(box, a.box)) warnings.push({ memberId: m.id, message: `${name} menembus ${a.label}` });
    });
    if (box.min[0] < -0.5 || box.max[0] > W + 0.5 || box.min[1] < -0.5 || box.max[1] > H + 0.5 || box.min[2] < -0.5 || box.max[2] > D + 0.5) {
      warnings.push({ memberId: m.id, message: `${name} keluar dari batas meja` });
    }
  });
  return warnings;
}

/** Tiang yang menapak di bawah dan memerlukan kaki stel (leveling feet) */
export function getFootMembers(config: KitchenConfig, members: FrameMember[]): FrameMember[] {
  const { plinthH, legType } = getFrameDims(config);
  if (legType === 'frame' || plinthH <= 0) return [];
  return members.filter((m) => m.axis === 'y' && m.y <= plinthH + 0.5);
}

export function newMemberId(): string {
  return `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

// ---------- Tampak ortogonal (dipakai Editor Rangka 2D & lembar export) ----------

export type FrameView = 'front' | 'back' | 'left' | 'right' | 'top';

export const VIEW_LABELS: Record<FrameView, string> = {
  front: 'Depan',
  back: 'Belakang',
  left: 'Kiri',
  right: 'Kanan',
  top: 'Atas',
};

/**
 * Definisi proyeksi tiap tampak:
 * h = sumbu 3D yang jadi horizontal layar, v = sumbu yang jadi vertikal layar (ke atas),
 * d = sumbu kedalaman (arah pandang). *Flip = dibalik (span - nilai).
 */
export interface ViewDef {
  h: FrameAxis;
  hFlip: boolean;
  v: FrameAxis;
  vFlip: boolean;
  d: FrameAxis;
  dFlip: boolean; // true: makin besar nilai sumbu d makin dekat ke penonton
  sideL: string;
  sideR: string;
  sideT?: string;
  sideB?: string;
}

export const VIEW_DEFS: Record<FrameView, ViewDef> = {
  front: { h: 'x', hFlip: false, v: 'y', vFlip: false, d: 'z', dFlip: true, sideL: 'KIRI', sideR: 'KANAN' },
  back: { h: 'x', hFlip: true, v: 'y', vFlip: false, d: 'z', dFlip: false, sideL: 'KANAN', sideR: 'KIRI' },
  left: { h: 'z', hFlip: false, v: 'y', vFlip: false, d: 'x', dFlip: false, sideL: 'BELAKANG (dinding)', sideR: 'DEPAN' },
  right: { h: 'z', hFlip: true, v: 'y', vFlip: false, d: 'x', dFlip: true, sideL: 'DEPAN', sideR: 'BELAKANG (dinding)' },
  top: { h: 'x', hFlip: false, v: 'z', vFlip: true, d: 'y', dFlip: true, sideL: 'KIRI', sideR: 'KANAN', sideT: 'BELAKANG (dinding)', sideB: 'DEPAN' },
};
