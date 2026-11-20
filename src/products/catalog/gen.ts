import { Params, Preset, PresetGroup, ProductDef } from '../types';

/** Satu pilihan pada sebuah sumbu variasi; `label` kosong = tidak disebut di nama */
export interface Opt {
  label: string;
  params: Params;
}

/**
 * Sub-kategori (mis. "Meja kerja") yang membangkitkan sejumlah template.
 * `struct` = sumbu STRUKTUR rangka (model kaki, rak, palang, roda): kombinasinya dipakai lebih dulu supaya
 * template dalam satu sub-kategori berbeda rangkanya. `style` = ukuran & tampilan (warna, papan) yang
 * diputar di atasnya; baru dipakai sebagai pembeda nama bila kombinasi struktur sudah habis.
 */
export interface GroupSpec {
  id: string;
  name: string;
  desc: string;
  noun: string; // awal nama template, mis. "Meja kerja"
  base: Params;
  struct: Opt[][];
  style: Opt[][];
  valid?: (p: Params) => boolean; // kombinasi yang tidak masuk akal dibuang
  count?: number; // bawaan 20
}

export const TEMPLATES_PER_GROUP = 20;

/** Warna cat + papan yang umum dipesan (hitam + kayu tetap yang pertama) */
export const FINISH: Opt[] = [
  { label: 'hitam · kayu', params: { warna: '#1f2226', papan: 'kayu' } },
  { label: 'putih · kayu', params: { warna: '#e9e7e1', papan: 'kayu' } },
  { label: 'abu · HPL', params: { warna: '#6b7078', papan: 'hpl' } },
  { label: 'hitam · HPL', params: { warna: '#1f2226', papan: 'hpl' } },
  { label: 'hijau army · kayu', params: { warna: '#2f4a3a', papan: 'kayu' } },
  { label: 'merah bata · kayu', params: { warna: '#7a3b2a', papan: 'kayu' } },
  { label: 'emas · HPL', params: { warna: '#c9a227', papan: 'hpl' } },
  { label: 'putih · multiplek', params: { warna: '#e9e7e1', papan: 'multiplek' } },
];

/** Kombinasi semua sumbu; sumbu pertama berganti paling cepat supaya 20 pertama sudah beragam */
function combos(axes: Opt[][]): Opt[][] {
  let out: Opt[][] = [[]];
  for (const axis of axes) {
    const next: Opt[][] = [];
    for (const o of axis.length ? axis : [{ label: '', params: {} }]) for (const c of out) next.push([...c, o]);
    out = next;
  }
  return out;
}

const merge = (opts: Opt[]): Params => Object.assign({}, ...opts.map((o) => o.params));
const join = (opts: Opt[], sep: string) =>
  opts
    .map((o) => o.label)
    .filter(Boolean)
    .join(sep)
    .replace(/ ,/g, ',');

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
/** Langkah pemutar gaya: sekitar 0,618 × jumlah, tidak berbagi faktor dengan jumlah */
function strideFor(n: number): number {
  if (n <= 2) return 1;
  let s = Math.max(1, Math.round(n * 0.618));
  while (gcd(s, n) !== 1) s++;
  return s;
}

/** Template hanya dipakai bila rangkanya bisa dibangun dan tidak memicu peringatan (tidak kokoh / tidak nyaman) */
function sturdy(def: ProductDef, p: Params): boolean {
  try {
    const b = def.build(p);
    return b.members.length > 0 && !def.checks(p, b).some((c) => c.level === 'warn');
  } catch {
    return false;
  }
}

/** Bangkitkan template sebuah sub-kategori */
export function generateGroup(def: ProductDef, g: GroupSpec): Preset[] {
  const count = g.count ?? TEMPLATES_PER_GROUP;
  const styles = combos(g.style);
  const stride = strideFor(styles.length);
  const firstStyle = merge(styles[0] || []);
  const structs = combos(g.struct).filter((s) => !g.valid || g.valid({ ...def.defaults, ...g.base, ...merge(s), ...firstStyle }));
  if (!structs.length) return [];

  const out: Preset[] = [];
  const names = new Set<string>();
  const limit = structs.length * Math.max(1, styles.length);
  for (let k = 0; out.length < count && k < limit; k++) {
    const s = structs[k % structs.length];
    const t = styles.length ? styles[(k * stride) % styles.length] : [];
    const params: Params = { ...g.base, ...merge(s), ...merge(t) };
    if (g.valid && !g.valid({ ...def.defaults, ...params })) continue;
    if (!sturdy(def, { ...def.defaults, ...params })) continue;
    const head = [g.noun, join(s, ' ')].filter(Boolean).join(' ');
    // struktur sama muncul lagi: bedakan dengan ukuran (sumbu gaya pertama), lalu tampilan
    let name = k < structs.length ? head : `${head} · ${t[0]?.label || ''}`.replace(/ · $/, '');
    if (names.has(name)) name = `${head} · ${join(t, ' · ')}`;
    if (names.has(name)) continue;
    names.add(name);
    const full = { ...def.defaults, ...params };
    out.push({
      id: `${g.id}-${String(out.length + 1).padStart(2, '0')}`,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      desc: [def.summary(full), join(t.slice(1), ' · ')].filter(Boolean).join(' · '),
      params,
      group: g.id,
    });
  }
  return out;
}

/** Tambahkan sub-kategori + template hasil bangkitan ke sebuah produk */
export function withCatalog(def: ProductDef, groups: GroupSpec[]): ProductDef {
  const presetGroups: PresetGroup[] = groups.map((g) => ({ id: g.id, name: g.name, desc: g.desc }));
  const generated = groups.flatMap((g) => generateGroup(def, g));
  return { ...def, groups: presetGroups, presets: [...def.presets, ...generated] };
}

/** Pembantu: sumbu ukuran dari daftar [label, params] */
export const sizes = (list: [string, Params][]): Opt[] => list.map(([label, params]) => ({ label, params }));
