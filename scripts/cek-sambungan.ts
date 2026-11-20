/**
 * Cek sambungan las: dua batang tidak boleh saling TEMBUS (menempati ruang yang sama).
 * Tukang las memotong batang supaya ujungnya menempel rata di sisi batang lain (butt joint),
 * atau memotong miring rata dengan sisi itu. Batang yang ujungnya masuk ke dalam batang lain,
 * dua batang yang bersilangan di ketinggian sama tanpa salah satunya dipotong, atau sudut potongan
 * miring yang menonjol keluar, semuanya terdeteksi sebagai tumpang tindih volume.
 *
 * Pakai: npx tsx scripts/cek-sambungan.ts [productId] [--detail]
 */
import { PRODUCT_LIST } from '../src/products';
import { newDesign } from '../src/products';
import { toFrameHost } from '../src/products/common';
import { FrameMember } from '../src/types/kitchen';
import { angledFrame, cutAxisIndex, memberSectionCm } from '../src/utils/frameLayout';

type V3 = [number, number, number];
const MARGIN = 0.4; // cm: toleransi (las, pembulatan)

interface Solid {
  m: FrameMember;
  inside: (p: V3) => boolean;
  samples: V3[];
}

function solidOf(m: FrameMember, sec: [number, number, number]): Solid {
  if (!m.end) {
    const i = m.axis === 'x' ? 0 : m.axis === 'y' ? 1 : 2;
    const min: V3 = [m.x - sec[0] / 2, m.y - sec[1] / 2, m.z - sec[2] / 2];
    const max: V3 = [m.x + sec[0] / 2, m.y + sec[1] / 2, m.z + sec[2] / 2];
    min[i] = [m.x, m.y, m.z][i];
    max[i] = min[i] + m.length;
    const inside = (p: V3) => p.every((v, k) => v > min[k] + MARGIN && v < max[k] - MARGIN);
    const samples: V3[] = [];
    const steps = (k: number) => Math.max(2, Math.ceil((max[k] - min[k]) / 1));
    const nx = steps(0), ny = steps(1), nz = steps(2);
    for (let a = 0; a <= nx; a++)
      for (let b = 0; b <= ny; b++)
        for (let c = 0; c <= nz; c++) {
          const onSurface = a === 0 || a === nx || b === 0 || b === ny || c === 0 || c === nz;
          if (!onSurface) continue;
          samples.push([min[0] + ((max[0] - min[0]) * a) / nx, min[1] + ((max[1] - min[1]) * b) / ny, min[2] + ((max[2] - min[2]) * c) / nz]);
        }
    return { m, inside, samples };
  }
  // Batang miring: kedua ujung dipotong rata pada bidang tegak lurus sumbu potong (cutAxisIndex) lewat titik ujung as
  const f = angledFrame(m, sec[0], sec[1]);
  const di = cutAxisIndex(m);
  const un = f.u[di] || 1e-6;
  const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const lo = Math.min(f.c[di] - (f.u[di] * f.len) / 2, f.c[di] + (f.u[di] * f.len) / 2);
  const hi = Math.max(f.c[di] - (f.u[di] * f.len) / 2, f.c[di] + (f.u[di] * f.len) / 2);
  const inside = (p: V3) => {
    const d: V3 = [p[0] - f.c[0], p[1] - f.c[1], p[2] - f.c[2]];
    return p[di] > lo + MARGIN && p[di] < hi - MARGIN && Math.abs(dot(d, f.wd)) < f.a / 2 - MARGIN && Math.abs(dot(d, f.hd)) < f.b / 2 - MARGIN;
  };
  const samples: V3[] = [];
  const n = Math.max(2, Math.ceil(f.len));
  for (const [j, k] of [[-1, -1], [-1, 1], [1, -1], [1, 1], [0, -1], [0, 1], [-1, 0], [1, 0]]) {
    const off = [0, 1, 2].map((q) => (f.wd[q] * j * f.a) / 2 + (f.hd[q] * k * f.b) / 2);
    const t0 = -off[di] / un; // geser supaya titik jatuh di antara kedua bidang potong
    for (let i = 0; i <= n; i++) {
      const t = -f.len / 2 + (f.len * i) / n + t0;
      samples.push([0, 1, 2].map((q) => f.c[q] + f.u[q] * t + off[q]) as V3);
    }
  }
  return { m, inside, samples };
}

export function cekSambungan(members: FrameMember[], secOf: (m: FrameMember) => [number, number, number]) {
  const solids = members.map((m) => solidOf(m, secOf(m)));
  const out: { a: string; b: string; titik: number }[] = [];
  for (let i = 0; i < solids.length; i++)
    for (let j = i + 1; j < solids.length; j++) {
      const A = solids[i], B = solids[j];
      const hits = A.samples.filter(B.inside).length + B.samples.filter(A.inside).length;
      if (hits > 0) out.push({ a: A.m.label || A.m.id, b: B.m.label || B.m.id, titik: hits });
    }
  return out;
}

const only = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : undefined;
const detail = process.argv.includes('--detail');
let total = 0;
for (const def of PRODUCT_LIST) {
  if (only && def.id !== only) continue;
  const bad: string[] = [];
  for (const pr of def.presets) {
    const variants = pr.sizes?.length ? pr.sizes : [{ label: '-', params: {} }];
    const seen = new Set<string>();
    for (const sz of variants) {
      const design = newDesign(def.id, pr.id);
      design.params = { ...def.defaults, ...pr.params, ...sz.params };
      const build = def.build(design.params);
      const host = toFrameHost(design, build);
      const hits = cekSambungan(build.members, (m) => memberSectionCm(m, host));
      for (const h of hits) {
        const key = `${h.a} × ${h.b}`;
        if (seen.has(key)) continue;
        seen.add(key);
        bad.push(`  ${pr.id} [${sz.label}]: ${key}`);
      }
    }
  }
  total += bad.length;
  const presetsBad = new Set(bad.map((b) => b.trim().split(' ')[0])).size;
  console.log(`${def.id}: ${bad.length ? `${presetsBad}/${def.presets.length} template bermasalah, ${bad.length} sambungan tembus` : 'OK'}`);
  if (detail) bad.forEach((b) => console.log(b));
}
console.log(total ? `\nTOTAL ${total} sambungan tembus` : '\nOK, semua sambungan bersih');
process.exitCode = total ? 1 : 0;
