import { KitchenConfig, FrameMember, FrameAxis, FrameMemberRole } from '../types/kitchen';

export interface Box3 {
  min: [number, number, number];
  max: [number, number, number];
}

export const FRAME_ROLE_LABELS: Record<FrameMemberRole, string> = {
  post: 'Tiang Vertikal',
  'rail-x': 'Gelagar Memanjang',
  'rail-z': 'Palang Kedalaman',
  'sink-cradle': 'Penyangga Wastafel',
  'stove-cradle': 'Penyangga Kompor',
  custom: 'Batang Tambahan',
};

export const AXIS_LABELS: Record<FrameAxis, string> = {
  x: 'Memanjang (X)',
  y: 'Vertikal (Y)',
  z: 'Kedalaman (Z)',
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

  // Penyangga wastafel: 2 palang kedalaman di samping bak + 2 strap di bawah dasar bak
  const sinkSupp = supports.find((s) => s.type === 'sink-cradle');
  if (sink.enabled && sinkSupp?.enabled !== false) {
    const bowlFloorY = (sink.mounting === 'undermount' ? H - topT : H) - sink.bowlDepth;
    const cy = bowlFloorY - t / 2 - 1.2;
    const offs = sink.width / 2 + t / 2 + 1.2;
    add({ id: 'auto-sink-l', axis: 'z', role: 'sink-cradle', label: 'Penyangga Wastafel Kiri', x: sink.posX - offs, y: cy, z: 2, length: carcaseD - 4 });
    add({ id: 'auto-sink-r', axis: 'z', role: 'sink-cradle', label: 'Penyangga Wastafel Kanan', x: sink.posX + offs, y: cy, z: 2, length: carcaseD - 4 });
    const strapW = sink.width + 2 * t + 2.4;
    const zF = Math.min(carcaseD - t - 2, sink.posY + sink.length * 0.28);
    const zB = Math.max(t + 2, sink.posY - sink.length * 0.28);
    add({ id: 'auto-sink-sf', axis: 'x', role: 'sink-cradle', label: 'Strap Dasar Bak Depan', x: sink.posX - strapW / 2, y: cy, z: zF, length: strapW });
    add({ id: 'auto-sink-sb', axis: 'x', role: 'sink-cradle', label: 'Strap Dasar Bak Belakang', x: sink.posX - strapW / 2, y: cy, z: zB, length: strapW });
  }

  // Penyangga kompor: 2 palang kedalaman di samping bodi kompor + 1 pengikat
  const stoveSupp = supports.find((s) => s.type === 'stove-cradle');
  if (stove.enabled && stoveSupp?.enabled !== false) {
    const sy = H - stove.recessDepth - t / 2 - 1.2;
    const offs = stove.width / 2 + t / 2 + 1;
    add({ id: 'auto-stove-l', axis: 'z', role: 'stove-cradle', label: 'Penyangga Kompor Kiri', x: stove.posX - offs, y: sy, z: 2, length: carcaseD - 4 });
    add({ id: 'auto-stove-r', axis: 'z', role: 'stove-cradle', label: 'Penyangga Kompor Kanan', x: stove.posX + offs, y: sy, z: 2, length: carcaseD - 4 });
    const tieW = stove.width + 2 * t + 2;
    add({ id: 'auto-stove-tie', axis: 'x', role: 'stove-cradle', label: 'Pengikat Penyangga Kompor', x: stove.posX - tieW / 2, y: sy, z: Math.max(t + 2, stove.posY - stove.length * 0.25), length: tieW });
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
  return generateAutoFrameMembers(config);
}

export function memberTubeCm(m: FrameMember, config: KitchenConfig): number {
  return (m.tubeSize || config.frame?.tubeSize || 40) / 10;
}

/** Kotak 3D (cm) yang ditempati satu batang */
export function memberBox(m: FrameMember, tubeCm: number): Box3 {
  const h = tubeCm / 2;
  const min: [number, number, number] = [m.x - h, m.y - h, m.z - h];
  const max: [number, number, number] = [m.x + h, m.y + h, m.z + h];
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
  members.forEach((m) => {
    const box = memberBox(m, memberTubeCm(m, config));
    const name = m.label || FRAME_ROLE_LABELS[m.role];
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
