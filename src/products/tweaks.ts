/**
 * Penyesuaian ringan per batang (geser, ganti pipa, buang) yang ditumpuk di atas rangka otomatis.
 * Berbeda dengan edit di Mode bengkel (2D), rangka tetap mengikuti slider ukuran: penyesuaian dicatat per id batang.
 */
import { FrameMember, MemberTweak } from '../types/kitchen';
import { boxesTouch, memberBox } from '../utils/frameLayout';

export type Tweaks = Record<string, MemberTweak>;

const isEmpty = (t: MemberTweak) => !t.dx && !t.dy && !t.dz && !t.tubeSize && !t.tubeH && !t.removed;

export function applyTweaks(members: FrameMember[], tweaks?: Tweaks): FrameMember[] {
  if (!tweaks || !Object.keys(tweaks).length) return members;
  return members
    .filter((m) => !tweaks[m.id]?.removed)
    .map((m) => {
      const t = tweaks[m.id];
      if (!t) return m;
      const dx = t.dx || 0;
      const dy = t.dy || 0;
      const dz = t.dz || 0;
      return {
        ...m,
        x: m.x + dx,
        y: m.y + dy,
        z: m.z + dz,
        end: m.end ? { x: m.end.x + dx, y: m.end.y + dy, z: m.end.z + dz } : undefined,
        tubeSize: t.tubeSize ?? m.tubeSize,
        tubeH: t.tubeSize ? t.tubeH : m.tubeH,
      };
    });
}

/** Gabungkan perubahan ke satu batang; entri kosong dihapus */
export function setTweak(tweaks: Tweaks | undefined, id: string, patch: Partial<MemberTweak>): Tweaks {
  const next = { ...(tweaks || {}) };
  const t = { ...(next[id] || {}), ...patch };
  if (isEmpty(t)) delete next[id];
  else next[id] = t;
  return next;
}

const center = (m: FrameMember): [number, number, number] => {
  if (m.end) return [(m.x + m.end.x) / 2, (m.y + m.end.y) / 2, (m.z + m.end.z) / 2];
  const h = m.length / 2;
  return [m.x + (m.axis === 'x' ? h : 0), m.y + (m.axis === 'y' ? h : 0), m.z + (m.axis === 'z' ? h : 0)];
};

/**
 * Batang kembaran di sisi lain (dicerminkan kiri↔kanan dan/atau depan↔belakang).
 * flipX/flipZ: apakah geseran kiri-kanan / depan-belakang perlu dibalik untuk kembaran itu.
 */
export function mirrorPartners(members: FrameMember[], m: FrameMember, W: number, D: number): { id: string; flipX: boolean; flipZ: boolean }[] {
  const c = center(m);
  const out: { id: string; flipX: boolean; flipZ: boolean }[] = [];
  const combos: [boolean, boolean][] = [
    [true, false],
    [false, true],
    [true, true],
  ];
  for (const [fx, fz] of combos) {
    const want: [number, number, number] = [fx ? W - c[0] : c[0], c[1], fz ? D - c[2] : c[2]];
    if (Math.abs(want[0] - c[0]) < 0.5 && Math.abs(want[2] - c[2]) < 0.5) continue; // batang di tengah: kembarannya dirinya sendiri
    const hit = members.find((o) => {
      if (o.id === m.id || o.axis !== m.axis || Math.abs(o.length - m.length) > 0.6 || !!o.end !== !!m.end) return false;
      const oc = center(o);
      return Math.abs(oc[0] - want[0]) < 1 && Math.abs(oc[1] - want[1]) < 1 && Math.abs(oc[2] - want[2]) < 1;
    });
    if (hit && !out.some((x) => x.id === hit.id)) out.push({ id: hit.id, flipX: fx, flipZ: fz });
  }
  return out;
}

/** Batang ini masih menempel ke batang lain? (setelah digeser) */
export function isConnected(members: FrameMember[], id: string, section: (m: FrameMember) => [number, number, number]): boolean {
  const m = members.find((x) => x.id === id);
  if (!m || members.length < 2) return true;
  const box = memberBox(m, section(m));
  return members.some((o) => o.id !== id && boxesTouch(box, memberBox(o, section(o))));
}
