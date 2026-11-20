/**
 * Pengaturan AI "desain dari foto", dibaca dari file .env saat build (lihat .env.example).
 * Catatan: variabel VITE_* ikut tertanam di file JavaScript hasil build, jadi siapa pun yang membuka
 * situsnya bisa melihat key ini. Pakai key gratis yang boleh dibagikan.
 */
export interface AiSettings {
  geminiKeys: string[]; // beberapa key: bila satu kena limit, dipakai key berikutnya
  geminiModels: string[];
  groqKey: string;
  groqModels: string[];
  openrouterKey: string;
  openrouterModels: string[];
}

export const DEFAULT_AI_SETTINGS: AiSettings = {
  geminiKeys: [],
  geminiModels: ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-flash-lite-latest'],
  groqKey: '',
  groqModels: ['meta-llama/llama-4-scout-17b-16e-instruct', 'meta-llama/llama-4-maverick-17b-128e-instruct'],
  openrouterKey: '',
  openrouterModels: ['google/gemma-3-27b-it:free', 'qwen/qwen2.5-vl-72b-instruct:free', 'meta-llama/llama-4-maverick:free'],
};

/** "a, b\nc" → ['a','b','c'] tanpa duplikat */
const list = (v: unknown) => Array.from(new Set(String(v || '').split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean)));
const orDefault = (v: string[], d: string[]) => (v.length ? v : d);

export function loadAiSettings(): AiSettings {
  const env = import.meta.env;
  return {
    geminiKeys: list(env.VITE_GEMINI_KEYS),
    geminiModels: orDefault(list(env.VITE_GEMINI_MODELS), DEFAULT_AI_SETTINGS.geminiModels),
    groqKey: String(env.VITE_GROQ_KEY || '').trim(),
    groqModels: orDefault(list(env.VITE_GROQ_MODELS), DEFAULT_AI_SETTINGS.groqModels),
    openrouterKey: String(env.VITE_OPENROUTER_KEY || '').trim(),
    openrouterModels: orDefault(list(env.VITE_OPENROUTER_MODELS), DEFAULT_AI_SETTINGS.openrouterModels),
  };
}

export const hasAnyKey = (s: AiSettings) => s.geminiKeys.length > 0 || !!s.groqKey || !!s.openrouterKey;
