import { AiSettings } from './settings';

/**
 * Penyedia AI gratis yang bisa membaca gambar. Satu "mesin" = penyedia + model + key.
 * Mesin dengan penyedia + model yang sama disebut satu "otak": bila hasil otak itu tidak bisa dipakai,
 * semua key-nya dilewati dan dicoba otak lain (penyedia / model berbeda).
 */
export type ProviderId = 'gemini' | 'groq' | 'openrouter';

export interface Engine {
  provider: ProviderId;
  model: string;
  key: string;
  keyIndex: number; // urutan key Gemini (0 = key pertama)
  brain: string; // provider:model
  label: string; // untuk ditampilkan, tanpa membuka key
}

export const PROVIDER_NAME: Record<ProviderId, string> = { gemini: 'Gemini', groq: 'Groq', openrouter: 'OpenRouter' };

/** Urutan coba: semua key Gemini per model, lalu Groq, lalu OpenRouter */
export function buildEngines(s: AiSettings): Engine[] {
  const out: Engine[] = [];
  for (const model of s.geminiModels)
    s.geminiKeys.forEach((key, i) =>
      out.push({ provider: 'gemini', model, key, keyIndex: i, brain: `gemini:${model}`, label: `Gemini key #${i + 1} · ${model}` })
    );
  if (s.groqKey) for (const model of s.groqModels) out.push({ provider: 'groq', model, key: s.groqKey, keyIndex: 0, brain: `groq:${model}`, label: `Groq · ${model}` });
  if (s.openrouterKey)
    for (const model of s.openrouterModels) out.push({ provider: 'openrouter', model, key: s.openrouterKey, keyIndex: 0, brain: `openrouter:${model}`, label: `OpenRouter · ${model}` });
  return out;
}

/** Jenis kegagalan menentukan apa yang dilewati berikutnya */
export type FailKind = 'quota' | 'auth' | 'model' | 'server' | 'network' | 'bad-request';

export class AiError extends Error {
  constructor(public kind: FailKind, message: string) {
    super(message);
  }
}

// Key yang kena limit diistirahatkan sebentar; key yang salah dilewati sampai halaman dimuat ulang
const cooldown = new Map<string, number>();
const badKeys = new Set<string>();
const badBrains = new Set<string>();

const keyId = (e: Engine) => `${e.provider}:${e.key}`;
const limitId = (e: Engine) => `${e.provider}:${e.model}:${e.key}`;

export function engineAvailable(e: Engine) {
  if (badKeys.has(keyId(e)) || badBrains.has(e.brain)) return false;
  return (cooldown.get(limitId(e)) || 0) < Date.now();
}

export function markFailure(e: Engine, kind: FailKind) {
  if (kind === 'quota') cooldown.set(limitId(e), Date.now() + 60_000);
  else if (kind === 'auth') badKeys.add(keyId(e));
  else if (kind === 'model') badBrains.add(e.brain);
}

function classify(status: number, body: string): FailKind {
  const b = body.toLowerCase();
  if (status === 429 || b.includes('resource_exhausted') || b.includes('quota') || b.includes('rate limit')) return 'quota';
  if (status === 401 || status === 403 || b.includes('api key not valid') || b.includes('api_key_invalid') || b.includes('invalid api key')) return 'auth';
  if (status === 404 || b.includes('not found') || b.includes('does not exist') || b.includes('decommissioned')) return 'model';
  if (status >= 500) return 'server';
  return 'bad-request';
}

const shortMsg = (body: string) => {
  try {
    const j = JSON.parse(body);
    return String(j?.error?.message || j?.message || body).slice(0, 160);
  } catch {
    return body.slice(0, 160);
  }
};

async function post(url: string, headers: Record<string, string>, body: unknown): Promise<any> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 90_000);
  let res: Response;
  try {
    res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body), signal: ctrl.signal });
  } catch (err: any) {
    throw new AiError('network', err?.name === 'AbortError' ? 'Terlalu lama tidak menjawab' : 'Tidak bisa terhubung (cek internet)');
  } finally {
    clearTimeout(timer);
  }
  const text = await res.text();
  if (!res.ok) throw new AiError(classify(res.status, text), `${res.status}: ${shortMsg(text)}`);
  try {
    return JSON.parse(text);
  } catch {
    throw new AiError('server', 'Jawaban server tidak terbaca');
  }
}

export interface ImageData {
  mime: string;
  base64: string;
}

/** Kirim teks + gambar, kembalikan teks jawaban mentah */
export async function callEngine(e: Engine, prompt: string, image: ImageData): Promise<string> {
  if (e.provider === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(e.model)}:generateContent?key=${encodeURIComponent(e.key)}`;
    const data = await post(url, {}, {
      contents: [{ role: 'user', parts: [{ text: prompt }, { inline_data: { mime_type: image.mime, data: image.base64 } }] }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
    });
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const text = parts.map((p: any) => p?.text || '').join('');
    if (!text) throw new AiError('bad-request', data?.promptFeedback?.blockReason ? `Ditolak: ${data.promptFeedback.blockReason}` : 'Jawaban kosong');
    return text;
  }

  const url = e.provider === 'groq' ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions';
  const headers: Record<string, string> = { Authorization: `Bearer ${e.key}` };
  if (e.provider === 'openrouter') {
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'Studio Rangka';
  }
  const data = await post(url, headers, {
    model: e.model,
    temperature: 0.2,
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:${image.mime};base64,${image.base64}` } },
        ],
      },
    ],
  });
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new AiError(data?.error ? classify(Number(data.error.code) || 400, JSON.stringify(data)) : 'bad-request', 'Jawaban kosong');
  return typeof text === 'string' ? text : JSON.stringify(text);
}

/** Ambil objek JSON pertama dari jawaban (model kadang membungkusnya dengan ```json atau kalimat) */
export function extractJson(text: string): any {
  const clean = text.replace(/```(?:json)?/gi, '').trim();
  try {
    return JSON.parse(clean);
  } catch {
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(clean.slice(start, end + 1));
      } catch {
        // lanjut ke error di bawah
      }
    }
  }
  throw new Error('Jawaban AI bukan JSON');
}
