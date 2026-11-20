/**
 * "Ketik perubahan": kalimat bebas → usulan perubahan pilihan, mis. "tinggikan 10 cm, pakai roda, warna putih".
 * Teks menentukan PILIHAN MANA yang berubah; angkanya ditampilkan dulu sebagai usulan untuk dicek pengguna
 * (pendekatan ParSEL: bahasa untuk maksud, angka untuk besaran). Memakai AI bila key tersedia,
 * dan pembaca kalimat sederhana di perangkat sebagai cadangan.
 */
import { PRODUCTS, ParamDef, Params, ProductId } from '../products';
import { AiError, buildEngines, callEngine, engineAvailable, extractJson, markFailure } from './providers';
import { hasAnyKey, loadAiSettings } from './settings';
import { cleanParams, describeParam } from './photoDesign';

export interface EditProposal {
  params: Params; // hanya pilihan yang berubah
  notes: string;
  source: 'ai' | 'lokal';
}

/** huruf kecil, tanda baca jadi spasi; isi kurung dibuang (nama pilihan) atau dipertahankan (nama opsi) */
const norm = (s: string, keepParen = false) => {
  let t = s.toLowerCase();
  t = keepParen ? t.replace(/[()]/g, ' ') : t.replace(/\(.*?\)/g, ' ');
  return t.replace(/[^a-z0-9+\-.,/ ]/g, ' ').replace(/\s+/g, ' ').trim();
};
const STOP = new Set(['jumlah', 'ukuran', 'model', 'pakai', 'dengan', 'bisa', 'yang', 'untuk', 'dari', 'atau', 'dan', 'tampilkan', 'contoh']);
const words = (label: string, keepParen = false) => norm(label, keepParen).split(' ').filter((w) => w.length > 2 && !STOP.has(w));
const esc = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const has = (part: string, w: string) => new RegExp('\\b' + esc(w)).test(part);
const num = (s: string) => parseFloat(s.replace(',', '.'));

/** Kata kerja / sifat → (kata pertama nama pilihan, arah) */
const RELATIVE: { re: RegExp; kw: string; sign: 1 | -1 }[] = [
  { re: /(tinggikan|lebih tinggi|naikkan)/, kw: 'tinggi', sign: 1 },
  { re: /(rendahkan|lebih rendah|lebih pendek|pendekkan|turunkan)/, kw: 'tinggi', sign: -1 },
  { re: /(panjangkan|lebih panjang)/, kw: 'panjang', sign: 1 },
  { re: /(lebarkan|lebih lebar)/, kw: 'lebar', sign: 1 },
  { re: /(sempitkan|lebih sempit)/, kw: 'lebar', sign: -1 },
  { re: /(dalamkan|lebih dalam)/, kw: 'dalam', sign: 1 },
];

function clampStep(d: ParamDef, v: number) {
  const step = d.step || 1;
  return Math.min(d.max ?? Infinity, Math.max(d.min ?? -Infinity, Math.round(v / step) * step));
}

function parseNumber(part: string, visible: ParamDef[], params: Params, out: Params): boolean {
  const n = part.match(/([+-]?\d+(?:[.,]\d+)?)/);
  const rel = RELATIVE.find((r) => r.re.test(part));
  let pick: { d: ParamDef; hits: number } | null = null;
  for (const d of visible) {
    if (d.type !== 'number') continue;
    const kws = words(d.label);
    if (rel && kws[0] === rel.kw) {
      pick = { d, hits: 99 };
      break;
    }
    if (!n) continue;
    const unit = d.unit && d.unit !== 'cm' && d.unit !== '°' ? [d.unit] : [];
    const hits = [...kws, ...unit].filter((w) => has(part, w)).length;
    if (hits && (!pick || hits > pick.hits)) pick = { d, hits };
  }
  if (!pick) return false;
  const d = pick.d;
  const cur = typeof params[d.key] === 'number' ? (params[d.key] as number) : d.min ?? 0;
  if (pick.hits === 99 && rel) {
    const amount = n ? Math.abs(num(n[1])) : (d.step || 1) * 5;
    out[d.key] = clampStep(d, cur + rel.sign * amount);
    return true;
  }
  if (!n) return false;
  const raw = n[1];
  const val = num(raw);
  const plus = raw.startsWith('+') || /\b(tambah|tambahkan|naik)\b/.test(part);
  const minus = raw.startsWith('-') || /\b(kurangi|kurang|turun)\b/.test(part);
  out[d.key] = clampStep(d, plus ? cur + Math.abs(val) : minus ? cur - Math.abs(val) : val);
  return true;
}

function parseToggle(part: string, visible: ParamDef[], out: Params): boolean {
  const off = /\b(tanpa|hapus|buang|lepas|matikan|hilangkan|jangan|tidak pakai|tak pakai|ga pakai|gak pakai|nggak pakai)\b/.test(part);
  let best: { d: ParamDef; hits: number } | null = null;
  for (const d of visible) {
    if (d.type !== 'toggle') continue;
    const kws = words(d.label);
    const hits = kws.filter((w) => has(part, w)).length;
    if (hits && hits >= Math.min(2, kws.length) && (!best || hits > best.hits)) best = { d, hits };
  }
  if (!best) return false;
  out[best.d.key] = !off;
  return true;
}

function parseChoice(part: string, visible: ParamDef[], out: Params): boolean {
  let best: { d: ParamDef; value: string; score: number } | null = null;
  for (const d of visible) {
    if (d.type !== 'choice') continue;
    const lw = words(d.label);
    const labelHit = lw.some((w) => has(part, w)) ? 1 : 0;
    for (const o of d.options || []) {
      // kata yang juga ada di nama pilihan (mis. "kaki" di "Model kaki") tidak membedakan opsi
      const ow = words(o.label, true).filter((w) => !lw.includes(w));
      const valueHit = labelHit && new RegExp('\\b' + esc(o.value.toLowerCase()) + '\\b').test(part) ? 1 : 0;
      const hits = ow.filter((w) => has(part, w)).length;
      if (!hits && !valueHit) continue;
      const score = (ow.length ? hits / ow.length : 0) + labelHit + valueHit;
      if (score >= 1 && (!best || score > best.score)) best = { d, value: o.value, score };
    }
  }
  if (!best) return false;
  out[best.d.key] = best.value;
  return true;
}

/** Pembaca kalimat sederhana (tanpa internet). Kalimat dibagi per koma / "dan". */
export function parseLocally(id: ProductId, params: Params, text: string): Params {
  const def = PRODUCTS[id];
  const out: Params = {};
  const parts = norm(text).split(/,|;|\bdan\b|\bserta\b|\blalu\b/).map((s) => s.trim()).filter(Boolean);
  for (const part of parts) {
    const visible = def.params.filter((d) => !d.showIf || d.showIf({ ...params, ...out }));
    if (parseNumber(part, visible, params, out)) continue;
    if (parseToggle(part, visible, out)) continue;
    parseChoice(part, visible, out);
  }
  Object.keys(out).forEach((k) => out[k] === params[k] && delete out[k]);
  return out;
}

function editPrompt(id: ProductId, params: Params, text: string) {
  const def = PRODUCTS[id];
  return `You edit a steel hollow-tube furniture design (${def.name}: ${def.tagline}) made by Indonesian welding workshops.
The user wrote (Bahasa Indonesia, may be informal): "${text}"

Parameters you may change:
${def.params.map(describeParam).join('\n')}

Current values: ${JSON.stringify(params)}

Rules:
- Return ONLY the parameters that must change to do what the user asked. Keep everything else.
- Sizes are centimetres. "tinggikan 10 cm" means current value + 10. Respect min/max.
- Only use the keys and option values listed above.
- "notes": one short sentence in Bahasa Indonesia; mention anything the user asked that cannot be done with these parameters.

Answer with JSON only:
{"params": {"key": value}, "notes": "..."}`;
}

export const aiReady = () => hasAnyKey(loadAiSettings());

/** Usulan perubahan dari kalimat: AI dulu (bila ada key), lalu pembaca lokal. */
export async function proposeEdit(id: ProductId, params: Params, text: string): Promise<EditProposal> {
  const settings = loadAiSettings();
  if (hasAnyKey(settings)) {
    for (const e of buildEngines(settings)) {
      if (!engineAvailable(e)) continue;
      try {
        const json = extractJson(await callEngine(e, editPrompt(id, params, text)));
        const changed = cleanParams(id, json?.params);
        Object.keys(changed).forEach((k) => changed[k] === params[k] && delete changed[k]);
        if (Object.keys(changed).length) return { params: changed, notes: String(json?.notes || ''), source: 'ai' };
        break; // AI menjawab tapi tidak ada yang berubah: coba pembaca lokal
      } catch (err) {
        if (err instanceof AiError) markFailure(e, err.kind);
      }
    }
  }
  const local = parseLocally(id, params, text);
  return {
    params: local,
    notes: Object.keys(local).length ? '' : 'Belum ada yang bisa dipahami. Coba tulis seperti: "tinggi 85", "tambah rak bawah", "warna putih".',
    source: 'lokal',
  };
}
