import { KitchenConfig, FrameMember, FrameHinge, FrameAxis, HingeType } from '../types/kitchen';
import { memberBox, memberSectionCm, boxesTouch, FRAME_ROLE_LABELS, AXIS_INDEX, Box3 } from './frameLayout';

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
  // Batang miring belum bisa diberi engsel
  const ids = new Set(members.filter((m) => !m.end).map((m) => m.id));
  const used = new Set<string>();
  return (config.frame?.hinges || []).filter((h) => {
    if (!ids.has(h.memberId) || used.has(h.memberId)) return false;
    if (h.mode === 'edge' && (!h.partnerId || !ids.has(h.partnerId))) return false;
    if (h.mode === 'axle' && h.partnerId && !ids.has(h.partnerId)) return false;
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
  axle?: boolean; // engsel poros: batang ini diam, hanya daun (batang tersambung) yang berputar
  partnerPivot?: V3; // titik poros di batang pasangan (kaki seberang), satu garis dengan pivot
}

export interface EdgePartner {
  partner: FrameMember;
  k: FrameAxis; // sumbu tempat kedua batang bersebelahan
  sign: 1 | -1; // arah dari batang ini ke batang sebelah
  fold: FrameAxis; // satu-satunya sumbu tekuk yang mungkin
}

/**
 * Batang sejajar yang menempel di salah satu sisi panjang batang ini (kandidat engsel memanjang).
 * Syarat: sumbu sama, bertumpang-tindih sepanjang batang, menempel (celah ≤ 0,3 cm) di satu sumbu
 * tegak lurus dan saling menutupi di sumbu tegak lurus lainnya.
 */
export function edgePartnerInfo(config: KitchenConfig, member: FrameMember, partner: FrameMember): EdgePartner | null {
  if (partner.id === member.id || partner.axis !== member.axis || member.end || partner.end) return null;
  const A = memberBox(member, memberSectionCm(member, config));
  const B = memberBox(partner, memberSectionCm(partner, config));
  const overlap = (i: number) => Math.min(A.max[i], B.max[i]) - Math.max(A.min[i], B.min[i]);
  if (overlap(AXIS_INDEX[member.axis]) < 1) return null;
  const perp = AXES.filter((x) => x !== member.axis);
  for (const k of perp) {
    const f = perp.find((x) => x !== k)!;
    const ok = overlap(AXIS_INDEX[k]);
    if (ok <= 0.05 && ok >= -0.3 && overlap(AXIS_INDEX[f]) > 0.5) {
      const ki = AXIS_INDEX[k];
      const sign = (B.min[ki] + B.max[ki]) / 2 > (A.min[ki] + A.max[ki]) / 2 ? 1 : -1;
      return { partner, k, sign, fold: f };
    }
  }
  return null;
}

export function getEdgePartners(config: KitchenConfig, members: FrameMember[], member: FrameMember): EdgePartner[] {
  return members.map((m) => edgePartnerInfo(config, member, m)).filter((x): x is EdgePartner => !!x);
}

/** Pilihan sumbu & arah putar engsel poros, dengan nama yang mudah dipahami */
export function axleOptions(m: FrameMember): { axis: FrameAxis; sign: 1 | -1; label: string }[] {
  // Rumus tangan kanan: putar +x membawa +z (depan) ke −y (bawah); putar +z membawa +x (kanan) ke +y
  const names: Record<FrameAxis, [string, string]> = {
    x: ['Depan turun, belakang naik', 'Depan naik, belakang turun'],
    z: ['Kanan naik, kiri turun', 'Kanan turun, kiri naik'],
    y: ['Putar searah jarum jam (dari atas)', 'Putar berlawanan jarum jam (dari atas)'],
  };
  return AXES.filter((a) => a !== m.axis).flatMap((axis) =>
    ([1, -1] as const).map((sign) => ({ axis, sign, label: names[axis][sign === 1 ? 0 : 1] }))
  );
}

/** Batang sejajar yang segaris dengan sumbu poros (mis. kaki kiri ↔ kaki kanan untuk poros sumbu X) */
export function axlePartners(config: KitchenConfig, members: FrameMember[], member: FrameMember, rotAxis: FrameAxis): FrameMember[] {
  const other = AXES.find((a) => a !== member.axis && a !== rotAxis)!;
  return members.filter((m) => m.id !== member.id && !m.end && m.axis === member.axis && Math.abs(m[other] - member[other]) <= 0.5);
}

export function hingeGeometry(config: KitchenConfig, member: FrameMember, hinge: FrameHinge, partner?: FrameMember): HingeGeometry {
  const sec = memberSectionCm(member, config);
  if (hinge.mode === 'axle') {
    // Engsel poros: titik putar di as batang (mis. pucuk kaki), sumbu putar = foldAxis, arah = foldSign
    const pos = Math.min(Math.max(hinge.pos, 0), member.length);
    const e = unitAxis(member.axis);
    const P = add([member.x, member.y, member.z], mul(e, pos));
    const rotAxis = hinge.foldAxis === member.axis ? AXES.find((a) => a !== member.axis)! : hinge.foldAxis;
    const a = unitAxis(rotAxis, hinge.foldSign);
    const ai = AXIS_INDEX[member.axis];
    let partnerPivot: V3 | undefined;
    if (partner) {
      partnerPivot = [partner.x, partner.y, partner.z];
      partnerPivot[ai] = P[ai];
    }
    return {
      hinge,
      member,
      pos,
      P,
      pivot: P,
      u: e,
      n: cross(a, e),
      a,
      movingLen: 1,
      fixedLen: member.length,
      half: [0.5, 0, sec[AXIS_INDEX[rotAxis]] / 2],
      fixedBox: memberBox(member, sec),
      movingBox: { min: [...P] as V3, max: [...P] as V3 },
      axle: true,
      partnerPivot,
    };
  }
  const edge = hinge.mode === 'edge' && partner ? edgePartnerInfo(config, member, partner) : null;
  if (edge) {
    // Engsel memanjang: as putar = garis tepi bersama kedua batang (sejajar batang), di sisi arah tekuk
    const full = memberBox(member, sec);
    const c: V3 = [0, 1, 2].map((i) => (full.min[i] + full.max[i]) / 2) as V3;
    const s = unitAxis(edge.k, edge.sign);
    const n = unitAxis(edge.fold, hinge.foldAxis === edge.fold ? hinge.foldSign : 1);
    const u = mul(s, -1);
    const hs = sec[AXIS_INDEX[edge.k]] / 2;
    const hn = sec[AXIS_INDEX[edge.fold]] / 2;
    const P = add(c, mul(s, hs));
    return {
      hinge,
      member,
      pos: member.length / 2,
      P,
      pivot: add(P, mul(n, hn)),
      u,
      n,
      a: cross(u, n),
      movingLen: hs * 2,
      fixedLen: 0,
      half: [hs, hn, member.length / 2],
      fixedBox: null,
      movingBox: full,
    };
  }
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
  leafIds: string[]; // batang lain yang ikut berputar (daun lipat, bila carry aktif)
  bridges: { id: string; name: string; splittable: boolean }[]; // batang yang melintasi garis engsel
  liftFromFloor?: boolean; // bagian yang dilipat menapak lantai: dihitung dengan meja diangkat
}

const memberName = (m: FrameMember) => m.label || FRAME_ROLE_LABELS[m.role];

/**
 * Bidang engsel: bidang datar yang memisahkan sisi tetap & sisi bergerak.
 * Engsel titik: tegak lurus batang di titik engsel. Engsel sejajar: muka yang menempel antara kedua batang.
 */
export function hingePlane(g: HingeGeometry): { axis: FrameAxis; coord: number; movingSign: 1 | -1 } {
  const ui = g.u.findIndex((v) => Math.abs(v) > 0.5);
  const axis = AXES[ui];
  return { axis, coord: g.P[ui], movingSign: g.u[ui] > 0 ? 1 : -1 };
}

const SIDE_TOL = 0.3;

/**
 * Daun lipat: batang di sisi bergerak bidang engsel yang tersambung (bersentuhan, toleransi 0,3 cm)
 * ke potongan bergerak, dicari dengan penelusuran graf (BFS). Batang yang melintasi bidang engsel
 * dan menyentuh daun = batang penghubung: selama belum dipotong, ia menahan lipatan.
 */
export function computeLeaf(config: KitchenConfig, members: FrameMember[], g: HingeGeometry) {
  const plane = hingePlane(g);
  const pi = AXIS_INDEX[plane.axis];
  const excluded = new Set([g.member.id, g.hinge.partnerId || '']);
  const boxes = new Map(members.map((m) => [m.id, memberBox(m, memberSectionCm(m, config))]));
  const sideOf = (b: Box3): 'moving' | 'fixed' | 'cross' => {
    const lo = (b.min[pi] - plane.coord) * plane.movingSign;
    const hi = (b.max[pi] - plane.coord) * plane.movingSign;
    const near = Math.min(lo, hi);
    const far = Math.max(lo, hi);
    if (near >= -SIDE_TOL) return 'moving';
    if (far <= SIDE_TOL) return 'fixed';
    return 'cross';
  };
  const leaf: FrameMember[] = [];
  const bridges: FrameMember[] = [];
  const seen = new Set<string>();
  if (g.axle) {
    // Engsel poros: semua batang yang tersambung ke batang ini di sekitar titik poros (dan ke
    // kaki pasangan) beserta sambungannya ikut berputar; batang poros & pasangannya tetap diam
    const r = Math.max(...memberSectionCm(g.member, config)) / 2 + SIDE_TOL;
    const around = (p: V3): Box3 => ({ min: [p[0] - r, p[1] - r, p[2] - r], max: [p[0] + r, p[1] + r, p[2] + r] });
    const q: Box3[] = [around(g.pivot), ...(g.partnerPivot ? [around(g.partnerPivot)] : [])];
    while (q.length) {
      const cur = q.shift()!;
      members.forEach((m) => {
        if (seen.has(m.id) || excluded.has(m.id)) return;
        const b = boxes.get(m.id)!;
        if (!boxesTouch(cur, b, SIDE_TOL)) return;
        seen.add(m.id);
        leaf.push(m);
        q.push(b);
      });
    }
    return { plane, leaf, bridges };
  }
  const queue: Box3[] = [g.movingBox];
  while (queue.length) {
    const cur = queue.shift()!;
    members.forEach((m) => {
      if (seen.has(m.id) || excluded.has(m.id)) return;
      const b = boxes.get(m.id)!;
      if (!boxesTouch(cur, b, SIDE_TOL)) return;
      const side = sideOf(b);
      if (side === 'moving') {
        seen.add(m.id);
        leaf.push(m);
        queue.push(b);
      } else if (side === 'cross') {
        seen.add(m.id);
        bridges.push(m);
      }
    });
  }
  return { plane, leaf, bridges };
}

/** Kotak sejajar sumbu (cm) yang ikut berputar θ derajat di sekitar as engsel → OBB */
export function boxObb(g: HingeGeometry, b: Box3, deg: number): Obb {
  const t = (deg * Math.PI) / 180;
  const c: V3 = [(b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2];
  return {
    c: add(g.pivot, rotate(sub(c, g.pivot), g.a, t)),
    axes: [rotate(WORLD[0], g.a, t), rotate(WORLD[1], g.a, t), rotate(WORLD[2], g.a, t)],
    half: [(b.max[0] - b.min[0]) / 2, (b.max[1] - b.min[1]) / 2, (b.max[2] - b.min[2]) / 2],
  };
}

/** Semua kotak yang ikut berputar pada engsel ini (potongan bergerak + daun lipat) */
export function movingBoxes(config: KitchenConfig, members: FrameMember[], lim: HingeLimit): Box3[] {
  const ids = new Set(lim.leafIds);
  const leafBoxes = members.filter((m) => ids.has(m.id)).map((m) => memberBox(m, memberSectionCm(m, config)));
  return lim.geometry.axle ? leafBoxes : [lim.geometry.movingBox, ...leafBoxes];
}

/** Hitung sudut tekuk maksimum sebuah engsel sebelum menabrak besi lain / lantai */
export function computeHingeLimit(config: KitchenConfig, members: FrameMember[], hinge: FrameHinge): HingeLimit | null {
  const member = members.find((m) => m.id === hinge.memberId);
  if (!member) return null;
  const partner = hinge.mode === 'edge' || hinge.mode === 'axle' ? members.find((m) => m.id === hinge.partnerId) : undefined;
  if (hinge.mode === 'edge' && (!partner || !edgePartnerInfo(config, member, partner))) return null;
  const g = hingeGeometry(config, member, hinge, partner);
  const typeMax = HINGE_TYPES[hinge.type]?.maxAngle ?? 180;
  const base = { geometry: g, typeMax, attached: [] as string[], leafIds: [] as string[], bridges: [] as HingeLimit['bridges'] };
  if (g.movingLen < 0.1) return { ...base, limitDeg: 0, blockedBy: null };

  const plane = hingePlane(g);
  const leafInfo = hinge.carry || g.axle ? computeLeaf(config, members, g) : null;
  const leafIds = new Set((leafInfo?.leaf || []).map((m) => m.id));
  const bridges = (leafInfo?.bridges || []).map((m) => ({ id: m.id, name: memberName(m), splittable: m.axis === plane.axis }));

  const all: HingeObstacle[] = members
    .filter((m) => m.id !== member.id && !leafIds.has(m.id))
    .map((m) => ({ id: m.id, name: memberName(m), box: memberBox(m, memberSectionCm(m, config)) }));
  if (g.fixedBox) all.push({ id: member.id, name: g.axle ? memberName(member) : `${memberName(member)} (potongan tetap)`, box: g.fixedBox });
  const leafBoxesForFloor = members.filter((m) => leafIds.has(m.id)).map((m) => memberBox(m, memberSectionCm(m, config)));
  const restOnFloor = [g.axle ? null : g.movingBox, ...leafBoxesForFloor].some((b) => b && b.min[1] <= 0.3);
  if (!restOnFloor) all.push({ id: 'floor', name: 'Lantai', box: { min: [-1e4, -1e4, -1e4], max: [1e4, 0, 1e4] } });

  const leafBoxes = members.filter((m) => leafIds.has(m.id)).map((m) => memberBox(m, memberSectionCm(m, config)));
  const bodies: Box3[] = g.axle ? leafBoxes : [g.movingBox, ...leafBoxes];
  if (bodies.length === 0) return { ...base, limitDeg: 0, blockedBy: null };
  const STEP = 0.5;
  const CONTACT_EPS = 0.0005; // 0,005 mm: tekukan berhenti tepat saat menyentuh

  // Batang yang sudah bertumpuk dengan bagian bergerak sejak awal (dilas di situ) diabaikan
  const rest = bodies.map((b) => boxObb(g, b, 0));
  const attached = all.filter((o) => rest.some((r) => obbHitsBox(r, o.box)));
  const obstacles = all.filter((o) => !attached.includes(o));
  const hitAt = (deg: number) => {
    const obbs = bodies.map((b) => boxObb(g, b, deg));
    return obstacles.find((ob) => obbs.some((o) => obbHitsBox(o, ob.box, CONTACT_EPS))) || null;
  };
  const out = { ...base, attached: attached.map((o) => o.name), leafIds: [...leafIds], bridges, liftFromFloor: restOnFloor };
  // Batang penghubung dilas ke kedua sisi garis engsel: daun terkunci sampai batang itu dipotong
  if (bridges.length > 0) {
    const b = bridges[0];
    const bm = members.find((m) => m.id === b.id)!;
    return { ...out, limitDeg: 0, blockedBy: { id: b.id, name: `${b.name} (melintasi garis engsel)`, box: memberBox(bm, memberSectionCm(bm, config)) } };
  }

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
      return { ...out, limitDeg: Math.floor(lo * 100) / 100, blockedBy: blocker };
    }
    prev = deg;
    if (deg >= typeMax) break;
  }
  return { ...out, limitDeg: typeMax, blockedBy: null };
}

/**
 * Potong batang penghubung tepat di bidang engsel (hanya batang yang searah sumbu bidang),
 * menjadi dua batang terpisah: satu di sisi tetap, satu di sisi daun lipat.
 */
export function splitBridgesAtPlane(
  members: FrameMember[],
  bridgeIds: string[],
  plane: { axis: FrameAxis; coord: number },
  newId: () => string
): FrameMember[] {
  const ids = new Set(bridgeIds);
  const r1 = (v: number) => Math.round(v * 10) / 10;
  return members.flatMap((m) => {
    if (!ids.has(m.id) || m.axis !== plane.axis) return [m];
    const start = m[m.axis];
    const cut = r1(plane.coord - start);
    if (cut <= 0.1 || cut >= m.length - 0.1) return [m];
    const name = memberName(m);
    return [
      { ...m, length: cut, label: `${name} A` },
      { ...m, id: newId(), [m.axis]: r1(plane.coord), length: r1(m.length - cut), label: `${name} B` },
    ];
  });
}

/** Batang setelah dibelah di titik engsel (untuk daftar potongan): potongan tetap + potongan lipat */
export function splitMembersAtHinges(config: KitchenConfig, members: FrameMember[]): FrameMember[] {
  const hinges = new Map(getValidHinges(config, members).map((h) => [h.memberId, h]));
  return members.flatMap((m) => {
    const h = hinges.get(m.id);
    if (!h || h.mode === 'edge' || h.mode === 'axle') return [m];
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
