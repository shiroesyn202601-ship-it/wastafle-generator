import { KitchenConfig, FrameMember, FrameHinge, FrameAxis, HingeType } from '../types/kitchen';
import { memberBox, memberSectionCm, FRAME_ROLE_LABELS, AXIS_INDEX, Box3 } from './frameLayout';

/**
 * Engsel lipat pada batang rangka.
 *
 * Model matematika (semua dalam cm, koordinat rangka: x dari kiri, y dari lantai, z dari belakang):
 *  - Batang dibelah di titik P = awal batang + pos·ê(sumbu batang). Potongan yang bergerak
 *    memanjang dari P searah u (+ê bila side = 'end', −ê bila side = 'start') sepanjang L.
 *  - n = arah tekuk (salah satu sumbu yang tegak lurus batang). As engsel (knuckle) berada di sisi
 *    pipa yang menghadap n, yaitu O = P + n·hn (hn = setengah tebal pipa ke arah n) — persis seperti
 *    engsel sungguhan yang dipasang di permukaan pipa, sehingga potongan bisa terlipat sampai 180°
 *    menempel muka-ke-muka dengan potongan tetap.
 *  - Sumbu putar a = u × n. Rotasi sebesar θ (rumus Rodrigues) memutar u menuju n.
 *  - Potongan bergerak = kotak berorientasi (OBB): pusat O + R(θ)(u·L/2 − n·hn),
 *    sumbu R(θ)u, R(θ)n, a dengan setengah ukuran [L/2, hn, ha].
 *  - Tabrakan diuji dengan Separating Axis Theorem (15 sumbu) terhadap kotak batang lain, potongan
 *    tetap, dan lantai. Sudut berhenti dicari dengan sapuan 0,5° lalu dipersempit dengan bisection
 *    sampai ketelitian < 0,001°, jadi tekukan berhenti tepat saat menyentuh besi di depannya.
 */

export type V3 = [number, number, number];

export interface HingeTypeInfo {
  name: string;
  desc: string;
  maxAngle: number; // derajat, batas putar mekanis engsel
  color: string;
}

export const HINGE_TYPES: Record<HingeType, HingeTypeInfo> = {
  butt: {
    name: 'Engsel Kupu-kupu',
    desc: 'Dua daun plat dibaut/dilas ke muka pipa. Putar sampai 180°.',
    maxAngle: 180,
    color: '#fbbf24',
  },
  'barrel-weld': {
    name: 'Engsel Pipa Las',
    desc: 'Tabung pin las (weld-on) di sudut pipa hollow. Kuat untuk rangka besi, putar sampai 180°.',
    maxAngle: 180,
    color: '#f97316',
  },
  piano: {
    name: 'Engsel Piano',
    desc: 'Engsel panjang menerus selebar muka pipa. Rata & kokoh, putar sampai 180°.',
    maxAngle: 180,
    color: '#38bdf8',
  },
  'folding-lock': {
    name: 'Engsel Lipat Kunci',
    desc: 'Folding bracket dengan pengunci. Berhenti & terkunci di 90° (kaki / meja lipat).',
    maxAngle: 90,
    color: '#34d399',
  },
};

export const FOLD_LABELS: Record<FrameAxis, Record<'1' | '-1', string>> = {
  x: { '1': 'Ke Kanan', '-1': 'Ke Kiri' },
  y: { '1': 'Ke Atas', '-1': 'Ke Bawah' },
  z: { '1': 'Ke Depan', '-1': 'Ke Belakang' },
};

const AXES: FrameAxis[] = ['x', 'y', 'z'];

export const unitAxis = (axis: FrameAxis, sign: number = 1): V3 => {
  const v: V3 = [0, 0, 0];
  v[AXIS_INDEX[axis]] = sign < 0 ? -1 : 1;
  return v;
};

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** Rumus rotasi Rodrigues: putar v di sekitar sumbu satuan k sebesar θ (radian) */
export function rotate(v: V3, k: V3, theta: number): V3 {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return add(add(mul(v, c), mul(cross(k, v), s)), mul(k, dot(k, v) * (1 - c)));
}

/** Arah tekuk yang mungkin untuk sebuah batang (2 sumbu tegak lurus × 2 arah) */
export function foldOptions(m: FrameMember): { axis: FrameAxis; sign: 1 | -1; label: string }[] {
  return AXES.filter((a) => a !== m.axis).flatMap((axis) =>
    ([1, -1] as const).map((sign) => ({ axis, sign, label: FOLD_LABELS[axis][sign === 1 ? '1' : '-1'] }))
  );
}

/** Engsel baru dengan nilai awal yang masuk akal untuk batang ini */
export function defaultHinge(m: FrameMember, id: string): FrameHinge {
  const vertical = m.axis === 'y';
  return {
    id,
    memberId: m.id,
    type: 'butt',
    pos: Math.round(m.length * 5) / 10,
    side: 'end',
    foldAxis: vertical ? 'z' : 'y',
    foldSign: vertical ? 1 : -1,
  };
}

export function newHingeId(): string {
  return `h-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Engsel yang batangnya masih ada (maksimal satu engsel per batang) */
export function getValidHinges(config: KitchenConfig, members: FrameMember[]): FrameHinge[] {
  const ids = new Set(members.map((m) => m.id));
  const used = new Set<string>();
  return (config.frame?.hinges || []).filter((h) => {
    if (!ids.has(h.memberId) || used.has(h.memberId)) return false;
    used.add(h.memberId);
    return true;
  });
}

export interface HingeGeometry {
  hinge: FrameHinge;
  member: FrameMember;
  pos: number; // titik engsel (cm dari awal batang), sudah dibatasi ke panjang batang
  P: V3; // titik engsel di as batang
  pivot: V3; // as putar engsel (di muka pipa sisi tekuk)
  u: V3; // arah potongan bergerak
  n: V3; // arah tekuk
  a: V3; // sumbu putar = u × n
  movingLen: number;
  fixedLen: number;
  half: V3; // setengah ukuran potongan bergerak terhadap [u, n, a]
  fixedBox: Box3 | null;
  movingBox: Box3; // posisi diam (θ = 0)
}

export function hingeGeometry(config: KitchenConfig, member: FrameMember, hinge: FrameHinge): HingeGeometry {
  const sec = memberSectionCm(member, config);
  const ai = AXIS_INDEX[member.axis];
  const pos = Math.min(Math.max(hinge.pos, 0), member.length);
  const start: V3 = [member.x, member.y, member.z];
  const e = unitAxis(member.axis);
  const P = add(start, mul(e, pos));
  const isEnd = hinge.side === 'end';
  const u = mul(e, isEnd ? 1 : -1);
  const foldAxis = hinge.foldAxis === member.axis ? AXES.find((a) => a !== member.axis)! : hinge.foldAxis;
  const n = unitAxis(foldAxis, hinge.foldSign);
  const a = cross(u, n);
  const hn = sec[AXIS_INDEX[foldAxis]] / 2;
  const aAxis = AXES.find((x) => x !== member.axis && x !== foldAxis)!;
  const ha = sec[AXIS_INDEX[aAxis]] / 2;
  const movingLen = isEnd ? member.length - pos : pos;
  const fixedLen = member.length - movingLen;

  const full = memberBox(member, sec);
  const seg = (from: number, to: number): Box3 => {
    const b: Box3 = { min: [...full.min] as V3, max: [...full.max] as V3 };
    b.min[ai] = start[ai] + from;
    b.max[ai] = start[ai] + to;
    return b;
  };
  const movingBox = isEnd ? seg(pos, member.length) : seg(0, pos);
  const fixedBox = fixedLen > 0.05 ? (isEnd ? seg(0, pos) : seg(pos, member.length)) : null;

  return {
    hinge,
    member,
    pos,
    P,
    pivot: add(P, mul(n, hn)),
    u,
    n,
    a,
    movingLen,
    fixedLen,
    half: [movingLen / 2, hn, ha],
    fixedBox,
    movingBox,
  };
}

export interface Obb {
  c: V3;
  axes: [V3, V3, V3];
  half: V3;
}

/** Kotak potongan bergerak setelah ditekuk θ derajat */
export function movingObb(g: HingeGeometry, deg: number): Obb {
  const t = (deg * Math.PI) / 180;
  const rel = sub(mul(g.u, g.movingLen / 2), mul(g.n, g.half[1]));
  return {
    c: add(g.pivot, rotate(rel, g.a, t)),
    axes: [rotate(g.u, g.a, t), rotate(g.n, g.a, t), g.a],
    half: g.half,
  };
}

/** 8 titik sudut kotak bergerak (cm), untuk digambar di tampak 2D */
export function obbCorners(o: Obb): V3[] {
  const out: V3[] = [];
  [-1, 1].forEach((i) =>
    [-1, 1].forEach((j) =>
      [-1, 1].forEach((k) => {
        out.push(add(add(add(o.c, mul(o.axes[0], i * o.half[0])), mul(o.axes[1], j * o.half[1])), mul(o.axes[2], k * o.half[2])));
      })
    )
  );
  return out;
}

const WORLD: [V3, V3, V3] = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

/**
 * Separating Axis Theorem: OBB vs kotak sejajar sumbu.
 * Bersentuhan (jarak ≤ eps) tidak dihitung tabrakan, jadi batang boleh menempel rapat.
 */
export function obbHitsBox(o: Obb, b: Box3, eps = 0.05): boolean {
  const bc: V3 = [(b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2];
  const bh: V3 = [(b.max[0] - b.min[0]) / 2, (b.max[1] - b.min[1]) / 2, (b.max[2] - b.min[2]) / 2];
  const T = sub(bc, o.c);
  const test = (L: V3) => {
    const len = Math.hypot(L[0], L[1], L[2]);
    if (len < 1e-9) return true; // sumbu sejajar: tidak memisahkan
    const ra = o.half[0] * Math.abs(dot(o.axes[0], L)) + o.half[1] * Math.abs(dot(o.axes[1], L)) + o.half[2] * Math.abs(dot(o.axes[2], L));
    const rb = bh[0] * Math.abs(L[0]) + bh[1] * Math.abs(L[1]) + bh[2] * Math.abs(L[2]);
    return Math.abs(dot(T, L)) < ra + rb - eps * len;
  };
  for (const A of o.axes) if (!test(A)) return false;
  for (const B of WORLD) if (!test(B)) return false;
  for (const A of o.axes) for (const B of WORLD) if (!test(cross(A, B))) return false;
  return true;
}

export interface HingeObstacle {
  id: string;
  name: string;
  box: Box3;
}

export interface HingeLimit {
  geometry: HingeGeometry;
  limitDeg: number; // sudut tekuk maksimum yang aman
  typeMax: number;
  blockedBy: HingeObstacle | null; // besi / lantai yang menahan tekukan (null = batas engsel)
  attached: string[]; // batang yang menempel di potongan bergerak (tidak ikut diperhitungkan)
}

const memberName = (m: FrameMember) => m.label || FRAME_ROLE_LABELS[m.role];

/** Hitung sudut tekuk maksimum sebuah engsel sebelum menabrak besi lain / lantai */
export function computeHingeLimit(config: KitchenConfig, members: FrameMember[], hinge: FrameHinge): HingeLimit | null {
  const member = members.find((m) => m.id === hinge.memberId);
  if (!member) return null;
  const g = hingeGeometry(config, member, hinge);
  const typeMax = HINGE_TYPES[hinge.type]?.maxAngle ?? 180;
  if (g.movingLen < 0.1) return { geometry: g, limitDeg: 0, typeMax, blockedBy: null, attached: [] };

  const all: HingeObstacle[] = members
    .filter((m) => m.id !== member.id)
    .map((m) => ({ id: m.id, name: memberName(m), box: memberBox(m, memberSectionCm(m, config)) }));
  if (g.fixedBox) all.push({ id: member.id, name: `${memberName(member)} (potongan tetap)`, box: g.fixedBox });
  all.push({ id: 'floor', name: 'Lantai', box: { min: [-1e4, -1e4, -1e4], max: [1e4, 0, 1e4] } });

  // Batang yang sudah bertumpuk dengan potongan bergerak sejak awal (dilas di potongan itu) diabaikan
  const rest = movingObb(g, 0);
  const attached = all.filter((o) => obbHitsBox(rest, o.box));
  const obstacles = all.filter((o) => !attached.includes(o));
  const hitAt = (deg: number) => {
    const o = movingObb(g, deg);
    return obstacles.find((ob) => obbHitsBox(o, ob.box, CONTACT_EPS)) || null;
  };

  const STEP = 0.5;
  const CONTACT_EPS = 0.0005; // 0,005 mm: tekukan berhenti tepat saat menyentuh
  let prev = 0;
  for (let step = STEP; ; step += STEP) {
    const deg = Math.min(step, typeMax);
    const hit = hitAt(deg);
    if (hit) {
      // Bisection: persempit sudut kontak antara prev (bebas) dan deg (tabrakan)
      let lo = prev;
      let hi = deg;
      let blocker = hit;
      for (let i = 0; i < 20; i++) {
        const mid = (lo + hi) / 2;
        const h = hitAt(mid);
        if (h) {
          hi = mid;
          blocker = h;
        } else lo = mid;
      }
      return { geometry: g, limitDeg: Math.floor(lo * 100) / 100, typeMax, blockedBy: blocker, attached: attached.map((o) => o.name) };
    }
    prev = deg;
    if (deg >= typeMax) break;
  }
  return { geometry: g, limitDeg: typeMax, typeMax, blockedBy: null, attached: attached.map((o) => o.name) };
}

/** Batang setelah dibelah di titik engsel (untuk daftar potongan): potongan tetap + potongan lipat */
export function splitMembersAtHinges(config: KitchenConfig, members: FrameMember[]): FrameMember[] {
  const hinges = new Map(getValidHinges(config, members).map((h) => [h.memberId, h]));
  return members.flatMap((m) => {
    const h = hinges.get(m.id);
    if (!h) return [m];
    const g = hingeGeometry(config, m, h);
    if (g.fixedLen < 0.1 || g.movingLen < 0.1) return [m];
    const r1 = (v: number) => Math.round(v * 10) / 10;
    const name = memberName(m);
    const tag = HINGE_TYPES[h.type].name;
    const first = { ...m, length: r1(g.pos), label: `${name} (${h.side === 'start' ? 'lipat' : 'tetap'}, ${tag})` };
    const second = {
      ...m,
      [m.axis]: r1(m[m.axis] + g.pos),
      length: r1(m.length - g.pos),
      label: `${name} (${h.side === 'end' ? 'lipat' : 'tetap'}, ${tag})`,
    };
    return [first, second];
  });
}
