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
  // Miter 45°: gelagar & palang atas bertemu ujung-ke-ujung di sudut, tiang sudut berhenti di bawahnya
  const miter = config.frame?.cornerJoint === 'miter';

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
        length: frameH - postBottom - (miter && isCorner ? t : 0),
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
        x: miter && lvl.y === topY ? 0 : t,
        y: lvl.y,
        z: pz,
        length: miter && lvl.y === topY ? W : W - 2 * t,
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
        z: miter && lvl.y === topY ? 0 : t,
        length: miter && lvl.y === topY ? carcaseD : carcaseD - 2 * t,
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

/** Dua batang dianggap tersambung (bisa dilas) bila bersentuhan atau bertumpuk, toleransi 0.3 cm */
export function boxesTouch(a: Box3, b: Box3, tol = 0.3): boolean {
  for (let i = 0; i < 3; i++) {
    if (a.max[i] < b.min[i] - tol || b.max[i] < a.min[i] - tol) return false;
  }
  return true;
}

export type AxisIndex = 0 | 1 | 2;
export const AXIS_INDEX: Record<FrameAxis, AxisIndex> = { x: 0, y: 1, z: 2 };

/** Bentuk potongan satu ujung batang hollow */
export interface EndCut {
  angle: 90 | 45;
  /** Miter: sumbu batang pasangan di sudut (bidang potong = sumbu batang ini + sumbu ini) */
  mateAxis?: FrameAxis;
  /** Miter: arah badan batang pasangan di sepanjang mateAxis (+1/-1) = sisi pendek (dalam) potongan */
  innerSign?: 1 | -1;
}

const AXES: FrameAxis[] = ['x', 'y', 'z'];

/**
 * Deteksi potongan ujung tiap batang dari geometri rangka:
 * dua batang tegak lurus yang ujungnya bertemu tepat di satu sudut (sudut L) → miter 45°,
 * selain itu (menempel ke sisi batang lain / ujung bebas) → potong lurus 90°.
 * Hasil: [ujung awal, ujung akhir] per id batang.
 */
export function getMemberEndCuts(config: KitchenConfig, members: FrameMember[]): Map<string, [EndCut, EndCut]> {
  const tol = 0.3;
  const boxes = members.map((m) => memberBox(m, memberTubeCm(m, config)));
  const out = new Map<string, [EndCut, EndCut]>();
  members.forEach((a, ia) => {
    const i = AXIS_INDEX[a.axis];
    const boxA = boxes[ia];
    const cuts: [EndCut, EndCut] = [{ angle: 90 }, { angle: 90 }];
    ([0, 1] as const).forEach((ka) => {
      const endA = ka === 0 ? boxA.min[i] : boxA.max[i];
      members.forEach((b, ib) => {
        if (ib === ia || b.axis === a.axis || cuts[ka].angle === 45) return;
        const j = AXIS_INDEX[b.axis];
        const boxB = boxes[ib];
        // Ujung A harus rata dengan sisi luar B di sumbu A
        if (Math.abs(endA - (ka === 0 ? boxB.min[i] : boxB.max[i])) > tol) return;
        // Salah satu ujung B harus rata dengan sisi luar A di sumbu B
        const kb = Math.abs(boxB.min[j] - boxA.min[j]) <= tol ? 0 : Math.abs(boxB.max[j] - boxA.max[j]) <= tol ? 1 : -1;
        if (kb < 0) return;
        // Sumbu ketiga harus sebidang (kedua batang menempati pipa yang sama)
        const k = 3 - i - j;
        if (Math.abs(boxA.min[k] - boxB.min[k]) > tol || Math.abs(boxA.max[k] - boxB.max[k]) > tol) return;
        cuts[ka] = { angle: 45, mateAxis: AXES[j], innerSign: kb === 0 ? 1 : -1 };
      });
    });
    out.set(a.id, cuts);
  });
  return out;
}

/** Kode bentuk potongan untuk pengelompokan: dua miter sisi-dalam sama = trapesium, berlawanan = jajaran genjang */
export function endCutShapeKey(cuts: [EndCut, EndCut]): string {
  const [a, b] = cuts;
  if (a.angle === 90 && b.angle === 90) return 'lurus';
  if (a.angle !== b.angle) return 'miter-1';
  if (a.mateAxis !== b.mateAxis) return 'miter-2-silang';
  return a.innerSign === b.innerSign ? 'miter-2-trapesium' : 'miter-2-jajargenjang';
}

export function describeEndCut(c: EndCut, axis: FrameAxis): string {
  if (c.angle === 90) return 'Lurus 90°';
  return `Miter 45° (bidang ${[axis, c.mateAxis].map((s) => s!.toUpperCase()).sort().join('–')})`;
}

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
    const b = memberBox(m, memberTubeCm(m, config));
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
  const boxes = members.map((m) => memberBox(m, memberTubeCm(m, config)));
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
