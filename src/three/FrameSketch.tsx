import React, { useMemo } from 'react';
import { KitchenConfig } from '../types/kitchen';
import { getFrameMembers, memberEndPoint, memberTubeCm } from '../utils/frameLayout';

/**
 * Gambar rangka sederhana tanpa WebGL (SVG isometrik), dipakai bila tampilan 3D tidak tersedia di browser.
 * Koordinat cm: x kiri→kanan, y lantai→atas, z belakang→depan. Dilihat dari depan-kanan-atas.
 */
const C = Math.cos(Math.PI / 6);
const S = Math.sin(Math.PI / 6);
const iso = (x: number, y: number, z: number): [number, number] => [(x + z) * C, (z - x) * S - y];
/**
 * Urutan gambar (pelukis): dilihat dari atas, bagian yang puncaknya lebih tinggi menutupi yang lebih rendah;
 * pada ketinggian sama, yang lebih dekat ke pengamat digambar belakangan.
 */
const order = (topY: number, x: number, z: number) => Math.round(topY) * 1000 + x + z;

interface Props {
  host: KitchenConfig;
  paint: string;
  selectedId?: string | null;
}

type Shape =
  | { kind: 'line'; d: number; a: [number, number]; b: [number, number]; w: number; id: string }
  | { kind: 'poly'; d: number; pts: [number, number][]; fill: string };

export const FrameSketch: React.FC<Props> = ({ host, paint, selectedId }) => {
  const { shapes, box } = useMemo(() => {
    const out: Shape[] = [];
    for (const m of getFrameMembers(host)) {
      const e = memberEndPoint(m);
      const a = iso(m.x, m.y, m.z);
      const b = iso(e[0], e[1], e[2]);
      out.push({ kind: 'line', d: order(Math.max(m.y, e[1]), (m.x + e[0]) / 2, (m.z + e[2]) / 2), a, b, w: memberTubeCm(m, host), id: m.id });
    }
    for (const pb of host.productBoards || []) {
      const [x0, y0, z0] = pb.box.min;
      const [x1, y1, z1] = pb.box.max;
      // sisi atas papan + sisi depan & kanan supaya tebalnya terlihat
      const top: [number, number][] = [iso(x0, y1, z0), iso(x1, y1, z0), iso(x1, y1, z1), iso(x0, y1, z1)];
      const front: [number, number][] = [iso(x0, y0, z1), iso(x1, y0, z1), iso(x1, y1, z1), iso(x0, y1, z1)];
      const right: [number, number][] = [iso(x1, y0, z0), iso(x1, y0, z1), iso(x1, y1, z1), iso(x1, y1, z0)];
      const d = order(y1 + 0.6, (x0 + x1) / 2, (z0 + z1) / 2);
      out.push({ kind: 'poly', d, pts: front, fill: pb.color });
      out.push({ kind: 'poly', d, pts: right, fill: pb.color });
      out.push({ kind: 'poly', d: d + 0.01, pts: top, fill: pb.color });
    }
    out.sort((p, q) => p.d - q.d);
    const xs: number[] = [];
    const ys: number[] = [];
    out.forEach((s) => (s.kind === 'line' ? [s.a, s.b] : s.pts).forEach(([x, y]) => (xs.push(x), ys.push(y))));
    const pad = 12;
    const box = xs.length
      ? { x: Math.min(...xs) - pad, y: Math.min(...ys) - pad, w: Math.max(...xs) - Math.min(...xs) + pad * 2, h: Math.max(...ys) - Math.min(...ys) + pad * 2 }
      : { x: 0, y: 0, w: 100, h: 100 };
    return { shapes: out, box };
  }, [host]);

  return (
    <svg viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`} className="w-full h-full" role="img" aria-label="Gambar rangka (tanpa 3D)">
      {shapes.map((s, i) =>
        s.kind === 'poly' ? (
          <polygon key={i} points={s.pts.map((p) => p.join(',')).join(' ')} fill={s.fill} stroke="#00000033" strokeWidth={0.4} />
        ) : (
          <line
            key={i}
            x1={s.a[0]}
            y1={s.a[1]}
            x2={s.b[0]}
            y2={s.b[1]}
            stroke={s.id === selectedId ? '#f59e0b' : paint}
            strokeWidth={Math.max(1.2, s.w)}
            strokeLinecap="square"
          />
        )
      )}
    </svg>
  );
};
