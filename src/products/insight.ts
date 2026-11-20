/**
 * Hubungan antara pilihan (params) dan bagian rangka, dicari otomatis dengan mencoba mengubah satu pilihan
 * sedikit lalu melihat batang mana yang ikut berubah. Berlaku untuk semua produk tanpa data tambahan.
 * build() hanya ±1 ms, jadi puluhan percobaan tetap terasa instan.
 */
import { FrameMember } from '../types/kitchen';
import { ParamDef, ParamValue, Params, ProductBuild, ProductDef } from './types';

const near = (a: number | undefined, b: number | undefined) => Math.abs((a || 0) - (b || 0)) < 0.05;

export function memberChanged(a: FrameMember, b: FrameMember) {
  if (!near(a.x, b.x) || !near(a.y, b.y) || !near(a.z, b.z) || !near(a.length, b.length)) return true;
  if ((a.tubeSize || 0) !== (b.tubeSize || 0) || (a.tubeH || 0) !== (b.tubeH || 0)) return true;
  if (!!a.end !== !!b.end) return true;
  return !!a.end && !!b.end && (!near(a.end.x, b.end.x) || !near(a.end.y, b.end.y) || !near(a.end.z, b.end.z));
}

/** Id batang yang berubah atau baru di `next` dibanding `prev` */
export function changedMemberIds(prev: FrameMember[], next: FrameMember[]): string[] {
  const old = new Map(prev.map((m) => [m.id, m]));
  return next.filter((m) => {
    const o = old.get(m.id);
    return !o || memberChanged(o, m);
  }).map((m) => m.id);
}

const safeBuild = (def: ProductDef, p: Params): ProductBuild | null => {
  try {
    return def.build(p);
  } catch {
    return null;
  }
};

export const isVisible = (d: ParamDef, p: Params) => !d.showIf || d.showIf(p);

/** Nilai percobaan untuk satu pilihan: angka digeser ±5% rentang, nyala/mati dibalik, pilihan diganti */
function trialValues(d: ParamDef, v: ParamValue): ParamValue[] {
  if (d.type === 'toggle') return [!(v === true)];
  if (d.type === 'choice') return (d.options || []).map((o) => o.value).filter((o) => o !== v);
  const min = d.min ?? 0;
  const max = d.max ?? 100;
  const step = d.step || 1;
  const n = typeof v === 'number' ? v : min;
  const delta = Math.max(step, Math.round(((max - min) * 0.08) / step) * step);
  const up = Math.min(max, n + delta);
  return [up !== n ? up : Math.max(min, n - delta)];
}

/** Batang yang ikut berubah bila pilihan `key` diubah (ke `value` bila diberikan, atau nilai percobaan) */
export function affectedBy(def: ProductDef, params: Params, key: string, value?: ParamValue): string[] {
  const d = def.params.find((x) => x.key === key);
  const base = safeBuild(def, params);
  if (!d || !base) return [];
  const tries = value !== undefined ? [value] : trialValues(d, params[key]);
  for (const t of tries) {
    if (t === params[key]) continue;
    const b = safeBuild(def, { ...params, [key]: t });
    if (!b) continue;
    const ids = changedMemberIds(base.members, b.members);
    // batang yang hilang juga disorot (dilihat dari desain sekarang)
    const gone = base.members.filter((m) => !b.members.some((x) => x.id === m.id)).map((m) => m.id);
    const all = [...new Set([...ids.filter((id) => base.members.some((m) => m.id === id)), ...gone])];
    if (all.length) return all;
  }
  return [];
}

/**
 * Pilihan yang paling berkaitan dengan satu batang (untuk kartu "atur bagian ini").
 * Skor tinggi = pilihan mengubah batang ini tetapi sedikit batang lain (lebih spesifik).
 */
export function paramsForMember(def: ProductDef, params: Params, memberId: string, limit = 4): string[] {
  const base = safeBuild(def, params);
  if (!base) return [];
  const total = base.members.length || 1;
  const order = def.steps.flatMap((s) => s.keys);
  const scored: { key: string; score: number }[] = [];
  for (const d of def.params) {
    if (d.key === 'warna' || d.key === 'papan' || !isVisible(d, params)) continue;
    const ids = affectedBy(def, params, d.key);
    if (!ids.includes(memberId)) continue;
    const spec = 1 - ids.length / total;
    const bonus = d.type === 'number' ? 0 : 0.15;
    scored.push({ key: d.key, score: spec + bonus - order.indexOf(d.key) * 0.002 });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.key);
}

export type DimAxis = 'x' | 'y' | 'z';

/** Pilihan angka yang mengatur panjang (x), tinggi (y) dan lebar/dalam (z) keseluruhan, bila ada */
export function dimensionParams(def: ProductDef, params: Params): Partial<Record<DimAxis, string>> {
  const base = safeBuild(def, params);
  if (!base) return {};
  const out: Partial<Record<DimAxis, string>> = {};
  const best: Record<DimAxis, number> = { x: Infinity, y: Infinity, z: Infinity };
  for (const d of def.params) {
    if (d.type !== 'number' || d.unit !== 'cm' || !isVisible(d, params)) continue;
    const v = params[d.key];
    if (typeof v !== 'number') continue;
    const [t] = trialValues(d, v) as number[];
    const b = safeBuild(def, { ...params, [d.key]: t });
    if (!b || t === v) continue;
    const dv = t - v;
    const r = { x: (b.W - base.W) / dv, y: (b.H - base.H) / dv, z: (b.D - base.D) / dv };
    (['x', 'y', 'z'] as DimAxis[]).forEach((ax) => {
      if (Math.abs(r[ax] - 1) > 0.12) return;
      // makin sedikit mengubah sumbu lain makin cocok
      const cost = (['x', 'y', 'z'] as DimAxis[]).filter((o) => o !== ax).reduce((s, o) => s + Math.abs(r[o]), 0) + Math.abs(r[ax] - 1);
      if (cost < best[ax]) {
        best[ax] = cost;
        out[ax] = d.key;
      }
    });
  }
  // satu pilihan hanya untuk satu sumbu (mis. diameter meja bundar: pakai untuk panjang saja)
  if (out.z && out.z === out.x) delete out.z;
  if (out.y && (out.y === out.x || out.y === out.z)) delete out.y;
  return out;
}

/**
 * Pilihan yang tersembunyi karena pilihan lain: cari SATU pilihan bentuk (choice) yang bila diganti membuatnya
 * muncul. Bila hanya bisa muncul lewat nyala/mati (sub-pilihan, mis. "Tinggi rak bawah"), kembalikan null.
 */
export function enablingChange(def: ProductDef, params: Params, key: string): { key: string; value: string; text: string } | null {
  const d = def.params.find((x) => x.key === key);
  if (!d || isVisible(d, params)) return null;
  for (const other of def.params) {
    if (other.type !== 'choice' || other.key === key || !isVisible(other, params)) continue;
    for (const o of other.options || []) {
      if (o.value === params[other.key]) continue;
      if (isVisible(d, { ...params, [other.key]: o.value })) return { key: other.key, value: o.value, text: `${other.label}: ${o.label}` };
    }
  }
  return null;
}

export const formatValue = (d: ParamDef, v: ParamValue | undefined): string => {
  if (d.type === 'toggle') return v === true ? 'nyala' : 'mati';
  if (d.type === 'choice') return d.options?.find((o) => o.value === v)?.label || String(v ?? '');
  return `${typeof v === 'number' ? v.toLocaleString('id-ID') : v ?? ''}${d.unit ? ` ${d.unit}` : ''}`;
};

/** Kalimat singkat perubahan, mis. "Tinggi 75 → 85 cm · Rak bawah: nyala" */
export function describeChange(def: ProductDef, prev: Params, next: Params): string {
  const parts: string[] = [];
  for (const d of def.params) {
    if (prev[d.key] === next[d.key]) continue;
    if (d.type === 'toggle') parts.push(`${d.label}: ${formatValue(d, next[d.key])}`);
    else if (d.type === 'choice') parts.push(`${d.label}: ${formatValue(d, next[d.key])}`);
    else parts.push(`${d.label} ${formatValue({ ...d, unit: undefined }, prev[d.key])} → ${formatValue(d, next[d.key])}`);
  }
  if (parts.length > 3) return `${parts.slice(0, 2).join(' · ')} · +${parts.length - 2} lainnya`;
  return parts.join(' · ');
}

/** Nilai bawaan template yang sedang dipakai (untuk tombol "kembali ke contoh") */
export function templateParams(def: ProductDef, presetId: string | undefined, current: Params): Params {
  const preset = def.presets.find((p) => p.id === presetId);
  const base = { ...def.defaults, ...(preset?.params || {}) };
  // ukuran umum yang paling dekat dengan desain sekarang dipakai sebagai acuan
  const sizes = preset?.sizes || [];
  let pick = sizes[0];
  let bestHits = -1;
  for (const s of sizes) {
    const hits = Object.entries(s.params).filter(([k, v]) => current[k] === v).length;
    if (hits > bestHits) {
      bestHits = hits;
      pick = s;
    }
  }
  return { ...base, ...(pick?.params || {}) };
}
