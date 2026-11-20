import { FurnitureDesign, PRODUCTS, PRODUCT_LIST, ParamDef, ParamValue, Params, ProductId, newDesign } from '../products';
import { AiError, Engine, ImageData, buildEngines, callEngine, engineAvailable, extractJson, markFailure } from './providers';
import { AiSettings } from './settings';

/**
 * Desain dari foto, dua tahap supaya pesan ke AI tetap kecil (cukup untuk kuota gratis):
 *   1. Tebak jenis produk + sub-kategori dari foto.
 *   2. Untuk produk itu, isi pilihan (ukuran, model kaki, rak, warna, ...) agar semirip mungkin.
 * Setiap tahap mencoba mesin satu per satu: key Gemini berikutnya bila limit habis, AI lain bila gagal.
 */

export interface LogLine {
  ok: boolean;
  text: string;
}

export interface PhotoResult {
  design: FurnitureDesign;
  productName: string;
  presetName?: string;
  seen: string;
  notes: string;
  confidence: number; // 0–1, perkiraan AI sendiri
  brains: string[]; // otak yang dipakai (untuk "Coba AI lain")
  engineLabel: string;
}

const pct = (n: number) => `${Math.round(n * 100)}%`;

// ---------- Prompt ----------

function productPrompt(note: string) {
  const lines = PRODUCT_LIST.map((d) => {
    const groups = (d.groups || []).map((g) => `${g.id} (${g.name})`).join(', ');
    return `- ${d.id}: ${d.name} — ${d.tagline}${groups ? `. Sub-kategori: ${groups}` : ''}`;
  }).join('\n');
  return `You are an expert in steel hollow-tube frame furniture (rangka besi hollow) made by Indonesian welding workshops.
Look at the photo and pick the product type from our design generator that best matches the object.

Product types:
${lines}

${note ? `User note (trust real sizes given here): ${note}\n` : ''}Rules:
- "product" must be one of the ids above, or null if the photo is not furniture that any type can represent.
- "group" is the closest sub-kategori id of that product, or null.
- "seen": 1–3 sentences in Bahasa Indonesia describing the object precisely: overall shape, legs (model, count, angle), crossbars, shelves, top shape/material, wheels, colour, estimated size.
- "confidence": 0–1, how well this product type can reproduce the photo.

Answer with JSON only:
{"product": "...", "group": "...", "seen": "...", "confidence": 0.0}`;
}

function describeParam(p: ParamDef) {
  const head = `- ${p.key} (${p.label})`;
  const help = p.help ? ` — ${p.help}` : '';
  if (p.type === 'number') return `${head}: number ${p.min ?? ''}–${p.max ?? ''}${p.unit ? ` ${p.unit}` : ''}${help}`;
  if (p.type === 'toggle') return `${head}: true/false${help}`;
  const opts = (p.options || []).map((o) => `"${o.value}" = ${o.label}${o.desc ? ` (${o.desc})` : ''}`).join('; ');
  return `${head}: one of ${opts}${help}`;
}

function paramsPrompt(id: ProductId, group: string | null, seen: string, note: string) {
  const def = PRODUCTS[id];
  const presets = def.presets.filter((p) => !p.group || p.group === group);
  return `You are an expert in steel hollow-tube frame furniture. The photo shows a ${def.name} (${def.tagline}).
Someone already described it as: "${seen}"

Set the generator parameters so the generated design looks as close as possible to the photo.

Parameters:
${def.params.map(describeParam).join('\n')}

Current defaults: ${JSON.stringify(def.defaults)}

Ready templates (pick the closest structure, or null):
${presets.map((p) => `- ${p.id}: ${p.name} — ${p.desc}`).join('\n')}

${note ? `User note (real sizes here override your estimate): ${note}\n` : ''}Rules:
- Sizes are centimetres. Estimate from normal proportions (dining table top ≈ 75 cm high, chair seat ≈ 45 cm, bar ≈ 105 cm) when no size is given.
- Only use the keys and option values listed above. Leave out keys you cannot judge.
- "notes": 1–2 sentences in Bahasa Indonesia: what matches and what part of the photo the generator cannot reproduce exactly.
- "confidence": 0–1, how close the result will look to the photo.

Answer with JSON only:
{"preset": "...", "params": {"key": value}, "notes": "...", "confidence": 0.0}`;
}

// ---------- Validasi jawaban ----------

const toNum = (v: unknown) => (typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.')));
const conf = (v: unknown) => {
  const n = toNum(v);
  if (!Number.isFinite(n)) return 0.5;
  return Math.min(1, Math.max(0, n > 1 ? n / 100 : n));
};

function coerce(def: ParamDef, raw: unknown): ParamValue | undefined {
  if (raw === null || raw === undefined) return undefined;
  if (def.type === 'number') {
    let n = toNum(raw);
    if (!Number.isFinite(n)) return undefined;
    if (def.min !== undefined) n = Math.max(def.min, n);
    if (def.max !== undefined) n = Math.min(def.max, n);
    const step = def.step || 1;
    return Math.round(n / step) * step;
  }
  if (def.type === 'toggle') {
    if (typeof raw === 'boolean') return raw;
    const s = String(raw).toLowerCase();
    if (['true', 'ya', 'yes', '1'].includes(s)) return true;
    if (['false', 'tidak', 'no', '0'].includes(s)) return false;
    return undefined;
  }
  const s = String(raw).toLowerCase().trim();
  const hit = (def.options || []).find((o) => o.value.toLowerCase() === s) || (def.options || []).find((o) => o.label.toLowerCase() === s);
  return hit?.value;
}

function cleanParams(id: ProductId, raw: unknown): Params {
  const out: Params = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const def of PRODUCTS[id].params) {
    const v = coerce(def, (raw as Record<string, unknown>)[def.key]);
    if (v !== undefined) out[def.key] = v;
  }
  return out;
}

// ---------- Menjalankan mesin satu per satu ----------

const FAIL_TEXT: Record<string, string> = {
  quota: 'limit habis, pindah ke key / AI berikutnya',
  auth: 'key salah atau tidak aktif',
  model: 'model tidak tersedia',
  server: 'server sedang sibuk',
  network: 'tidak terhubung',
  'bad-request': 'permintaan ditolak',
};

async function ask<T>(
  stage: string,
  engines: Engine[],
  skip: Set<string>,
  prompt: string,
  image: ImageData,
  validate: (json: any) => T,
  log: (l: LogLine) => void
): Promise<{ value: T; engine: Engine }> {
  for (const e of engines) {
    if (skip.has(e.brain) || !engineAvailable(e)) continue;
    try {
      const text = await callEngine(e, prompt, image);
      const value = validate(extractJson(text));
      log({ ok: true, text: `${stage}: ${e.label} berhasil` });
      return { value, engine: e };
    } catch (err) {
      if (err instanceof AiError) {
        markFailure(e, err.kind);
        log({ ok: false, text: `${stage}: ${e.label} — ${FAIL_TEXT[err.kind]} (${err.message})` });
        // Permintaan ditolak bukan soal key: key lain dengan model yang sama akan ditolak juga
        if (err.kind === 'bad-request') skip.add(e.brain);
      } else {
        // Jawaban tidak bisa dipakai → jangan pakai model ini lagi, coba AI lain
        log({ ok: false, text: `${stage}: ${e.label} — hasil tidak sesuai (${(err as Error).message}), coba AI lain` });
        skip.add(e.brain);
      }
    }
  }
  throw new Error('Semua AI sudah dicoba dan belum berhasil. Tambah key lain di Pengaturan AI, atau coba lagi 1 menit lagi.');
}

async function runOnce(image: ImageData, note: string, settings: AiSettings, skip: Set<string>, log: (l: LogLine) => void): Promise<PhotoResult> {
  const engines = buildEngines(settings);

  const step1 = await ask('Kenali jenis', engines, skip, productPrompt(note), image, (j) => {
    if (!j || j.product === null) throw new Error('foto tidak dikenali sebagai furnitur');
    const id = String(j.product) as ProductId;
    if (!(id in PRODUCTS)) throw new Error(`jenis "${j.product}" tidak ada`);
    const group = PRODUCTS[id].groups?.some((g) => g.id === j.group) ? String(j.group) : null;
    return { id, group, seen: String(j.seen || ''), confidence: conf(j.confidence) };
  }, log);
  const { id, group, seen } = step1.value;
  const def = PRODUCTS[id];
  log({ ok: true, text: `Terlihat: ${def.name}${group ? ` (${def.groups?.find((g) => g.id === group)?.name})` : ''}` });

  // Tahap 2 utamakan otak yang sama dengan tahap 1 supaya penilaiannya konsisten
  const ordered = [...engines.filter((e) => e.brain === step1.engine.brain), ...engines.filter((e) => e.brain !== step1.engine.brain)];
  const step2 = await ask('Atur ukuran & bentuk', ordered, skip, paramsPrompt(id, group, seen, note), image, (j) => {
    const params = cleanParams(id, j?.params);
    if (!Object.keys(params).length) throw new Error('tidak ada ukuran yang terbaca');
    const preset = def.presets.find((p) => p.id === j?.preset);
    const design = newDesign(id, preset?.id);
    design.params = { ...design.params, ...params };
    def.build(design.params); // pastikan rangka bisa dibangun dengan nilai ini
    return { design, preset, notes: String(j?.notes || ''), confidence: conf(j?.confidence) };
  }, log);

  return {
    design: step2.value.design,
    productName: def.name,
    presetName: step2.value.preset?.name,
    seen,
    notes: step2.value.notes,
    confidence: Math.min(step1.value.confidence, step2.value.confidence),
    brains: Array.from(new Set([step1.engine.brain, step2.engine.brain])),
    engineLabel: step2.engine.label,
  };
}

const LOW_CONFIDENCE = 0.45;

/**
 * `avoid` = otak yang dipakai hasil sebelumnya ("Coba AI lain").
 * Bila AI sendiri kurang yakin, otomatis dibandingkan dengan satu AI lain dan dipilih yang lebih yakin.
 */
export async function designFromPhoto(opts: { image: ImageData; note: string; settings: AiSettings; avoid?: string[]; onLog: (l: LogLine) => void }): Promise<PhotoResult> {
  const { image, note, settings, onLog } = opts;
  const skip = new Set(opts.avoid || []);
  const first = await runOnce(image, note, settings, skip, onLog);
  if (first.confidence >= LOW_CONFIDENCE) return first;

  onLog({ ok: true, text: `AI kurang yakin (${pct(first.confidence)}), dibandingkan dengan AI lain…` });
  const skip2 = new Set([...skip, ...first.brains]);
  try {
    const second = await runOnce(image, note, settings, skip2, onLog);
    const best = second.confidence > first.confidence ? second : first;
    onLog({ ok: true, text: `Dipilih hasil ${best.engineLabel} (${pct(best.confidence)})` });
    return best;
  } catch {
    onLog({ ok: false, text: 'Tidak ada AI lain yang tersedia, dipakai hasil pertama' });
    return first;
  }
}

/** Kecilkan foto (maks 1024 px, JPEG) supaya hemat kuota dan cepat dikirim */
export function prepareImage(file: File): Promise<ImageData & { preview: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1024 / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Browser tidak mendukung pengolahan gambar'));
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const preview = canvas.toDataURL('image/jpeg', 0.85);
      resolve({ mime: 'image/jpeg', base64: preview.split(',')[1], preview });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('File ini bukan gambar yang bisa dibuka'));
    };
    img.src = url;
  });
}
