/**
 * Pengaturan AI "desain dari foto". Disimpan hanya di browser ini (localStorage); key tidak pernah
 * dikirim ke mana pun selain langsung ke penyedia AI-nya.
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

const LS_AI = 'studiorangka_ai';

const list = (v: unknown, fallback: string[]) =>
  Array.isArray(v) ? v.map((s) => String(s).trim()).filter(Boolean) : fallback;

export function loadAiSettings(): AiSettings {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_AI) || '{}');
    const models = (v: unknown, d: string[]) => {
      const l = list(v, d);
      return l.length ? l : d;
    };
    return {
      geminiKeys: list(raw.geminiKeys, []),
      geminiModels: models(raw.geminiModels, DEFAULT_AI_SETTINGS.geminiModels),
      groqKey: String(raw.groqKey || '').trim(),
      groqModels: models(raw.groqModels, DEFAULT_AI_SETTINGS.groqModels),
      openrouterKey: String(raw.openrouterKey || '').trim(),
      openrouterModels: models(raw.openrouterModels, DEFAULT_AI_SETTINGS.openrouterModels),
    };
  } catch {
    return { ...DEFAULT_AI_SETTINGS };
  }
}

export function saveAiSettings(s: AiSettings) {
  try {
    localStorage.setItem(LS_AI, JSON.stringify(s));
  } catch {
    // penyimpanan browser tidak tersedia: pengaturan hanya berlaku sampai halaman ditutup
  }
}

export const hasAnyKey = (s: AiSettings) => s.geminiKeys.length > 0 || !!s.groqKey || !!s.openrouterKey;
