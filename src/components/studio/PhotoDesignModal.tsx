import React, { useRef, useState } from 'react';
import { ArrowRight, Camera, CheckCircle2, ImagePlus, Loader2, RefreshCw, Settings, Sparkles, X, XCircle } from 'lucide-react';
import { FurnitureDesign, PRODUCTS } from '../../products';
import { LogLine, PhotoResult, designFromPhoto, prepareImage } from '../../ai/photoDesign';
import { ImageData } from '../../ai/providers';
import { AiSettings, DEFAULT_AI_SETTINGS, hasAnyKey, loadAiSettings, saveAiSettings } from '../../ai/settings';

interface Props {
  onClose: () => void;
  onOpen: (design: FurnitureDesign, message: string) => void;
}

const lines = (s: string) => s.split(/[\n,]+/).map((x) => x.trim()).filter(Boolean);

/** Upload foto furnitur → AI memilih produk + mengisi ukuran → buka di studio */
export const PhotoDesignModal: React.FC<Props> = ({ onClose, onOpen }) => {
  const [settings, setSettings] = useState<AiSettings>(loadAiSettings);
  const [showSettings, setShowSettings] = useState(() => !hasAnyKey(loadAiSettings()));
  const [draft, setDraft] = useState(() => {
    const s = loadAiSettings();
    return {
      gemini: s.geminiKeys.join('\n'),
      groq: s.groqKey,
      openrouter: s.openrouterKey,
      geminiModels: s.geminiModels.join(', '),
      groqModels: s.groqModels.join(', '),
      openrouterModels: s.openrouterModels.join(', '),
    };
  });
  const [image, setImage] = useState<(ImageData & { preview: string }) | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<LogLine[]>([]);
  const [result, setResult] = useState<PhotoResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tried, setTried] = useState<string[]>([]); // otak yang hasilnya sudah ditolak pengguna
  const fileRef = useRef<HTMLInputElement>(null);

  const saveSettings = () => {
    const s: AiSettings = {
      geminiKeys: Array.from(new Set(lines(draft.gemini))),
      groqKey: draft.groq.trim(),
      openrouterKey: draft.openrouter.trim(),
      geminiModels: lines(draft.geminiModels).length ? lines(draft.geminiModels) : DEFAULT_AI_SETTINGS.geminiModels,
      groqModels: lines(draft.groqModels).length ? lines(draft.groqModels) : DEFAULT_AI_SETTINGS.groqModels,
      openrouterModels: lines(draft.openrouterModels).length ? lines(draft.openrouterModels) : DEFAULT_AI_SETTINGS.openrouterModels,
    };
    saveAiSettings(s);
    setSettings(s);
    setShowSettings(false);
  };

  const pickFile = async (file?: File) => {
    if (!file) return;
    setError(null);
    setResult(null);
    setLog([]);
    setTried([]);
    try {
      setImage(await prepareImage(file));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const run = async (avoid: string[]) => {
    if (!image) return;
    if (!hasAnyKey(settings)) {
      setShowSettings(true);
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    setLog([]);
    try {
      const r = await designFromPhoto({ image, note: note.trim(), settings, avoid, onLog: (l) => setLog((prev) => [...prev, l]) });
      setResult(r);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const tryOther = () => {
    if (!result) return;
    const avoid = Array.from(new Set([...tried, ...result.brains]));
    setTried(avoid);
    run(avoid);
  };

  const geminiCount = settings.geminiKeys.length;
  const keySummary = [geminiCount ? `${geminiCount} key Gemini` : '', settings.groqKey ? 'Groq' : '', settings.openrouterKey ? 'OpenRouter' : ''].filter(Boolean).join(' · ');
  const input = 'w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-300';

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="photo-title">
      <div className="w-full sm:max-w-xl max-h-[95dvh] overflow-y-auto bg-stone-50 text-stone-900 rounded-t-2xl sm:rounded-2xl shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-3 bg-white border-b border-stone-200">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <div className="flex-1 min-w-0">
            <h2 id="photo-title" className="font-bold leading-tight">Desain dari foto</h2>
            <p className="text-xs text-stone-500">Upload foto furnitur, AI membuatkan desain yang mirip</p>
          </div>
          <button onClick={() => setShowSettings((v) => !v)} className={`p-2 rounded-lg cursor-pointer ${showSettings ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'}`} aria-label="Pengaturan AI" title="Pengaturan AI">
            <Settings className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-2 rounded-lg text-stone-600 hover:bg-stone-100 cursor-pointer" aria-label="Tutup">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {showSettings && (
            <section className="p-4 rounded-xl bg-white border border-stone-200 space-y-3">
              <div>
                <h3 className="font-bold">Pengaturan AI (gratis)</h3>
                <p className="text-xs text-stone-500">Key disimpan hanya di browser ini dan dikirim langsung ke penyedia AI-nya.</p>
              </div>
              <label className="block space-y-1">
                <span className="text-sm font-semibold">Key Gemini — satu per baris</span>
                <textarea value={draft.gemini} onChange={(e) => setDraft({ ...draft, gemini: e.target.value })} rows={3} spellCheck={false} placeholder={'AIza...\nAIza...'} className={`${input} font-mono text-xs`} />
                <span className="block text-xs text-stone-500">
                  Buat gratis di{' '}
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-sky-700 underline">aistudio.google.com</a>. Bisa beberapa key (akun Google berbeda): kalau limit satu key habis, otomatis pakai key berikutnya.
                </span>
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-semibold">Key Groq <span className="font-normal text-stone-500">(cadangan, opsional)</span></span>
                <input type="password" value={draft.groq} onChange={(e) => setDraft({ ...draft, groq: e.target.value })} spellCheck={false} placeholder="gsk_..." className={`${input} font-mono text-xs`} />
                <span className="block text-xs text-stone-500">
                  Gratis di <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-sky-700 underline">console.groq.com</a>
                </span>
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-semibold">Key OpenRouter <span className="font-normal text-stone-500">(cadangan, opsional)</span></span>
                <input type="password" value={draft.openrouter} onChange={(e) => setDraft({ ...draft, openrouter: e.target.value })} spellCheck={false} placeholder="sk-or-..." className={`${input} font-mono text-xs`} />
                <span className="block text-xs text-stone-500">
                  Gratis di <a href="https://openrouter.ai/settings/keys" target="_blank" rel="noreferrer" className="text-sky-700 underline">openrouter.ai</a> (model berakhiran :free)
                </span>
              </label>
              <details className="text-sm">
                <summary className="cursor-pointer font-semibold text-stone-600">Model (lanjutan)</summary>
                <p className="text-xs text-stone-500 mt-1">Dicoba berurutan, pisahkan dengan koma. Ganti bila penyedia mengganti nama modelnya.</p>
                <div className="mt-2 space-y-2">
                  {(['geminiModels', 'groqModels', 'openrouterModels'] as const).map((k) => (
                    <label key={k} className="block space-y-1">
                      <span className="text-xs font-semibold">{k === 'geminiModels' ? 'Gemini' : k === 'groqModels' ? 'Groq' : 'OpenRouter'}</span>
                      <input value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} spellCheck={false} className={`${input} font-mono text-xs`} />
                    </label>
                  ))}
                </div>
              </details>
              <div className="flex justify-end gap-2">
                {hasAnyKey(settings) && (
                  <button onClick={() => setShowSettings(false)} className="px-3 py-2 rounded-lg text-sm font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer">
                    Batal
                  </button>
                )}
                <button onClick={saveSettings} disabled={!lines(draft.gemini).length && !draft.groq.trim() && !draft.openrouter.trim()} className="px-4 py-2 rounded-lg bg-stone-900 text-white text-sm font-semibold disabled:opacity-40 cursor-pointer">
                  Simpan
                </button>
              </div>
            </section>
          )}

          {!showSettings && keySummary && (
            <p className="text-xs text-stone-500">
              AI siap: {keySummary}.{' '}
              <button onClick={() => setShowSettings(true)} className="text-sky-700 underline cursor-pointer">Ubah</button>
            </p>
          )}

          {/* Foto */}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ''; }} />
          {image ? (
            <div className="relative rounded-xl overflow-hidden bg-stone-200 border border-stone-200">
              <img src={image.preview} alt="Foto yang diupload" className="w-full max-h-72 object-contain" />
              <button onClick={() => fileRef.current?.click()} disabled={busy} className="absolute bottom-2 right-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 text-sm font-semibold shadow cursor-pointer disabled:opacity-50">
                <ImagePlus className="w-4 h-4" /> Ganti foto
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); pickFile(e.dataTransfer.files?.[0]); }}
              className="w-full flex flex-col items-center gap-2 py-10 rounded-xl border-2 border-dashed border-stone-300 bg-white hover:border-sky-500 text-stone-600 cursor-pointer"
            >
              <Camera className="w-8 h-8 text-stone-400" />
              <span className="font-semibold">Pilih / ambil foto furnitur</span>
              <span className="text-xs text-stone-500">Foto dari samping agak serong paling mudah dikenali</span>
            </button>
          )}

          <label className="block space-y-1">
            <span className="text-sm font-semibold">Keterangan <span className="font-normal text-stone-500">(opsional, bikin hasil lebih pas)</span></span>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="mis. ukuran asli 120 × 60 × 75 cm, kaki pakai roda" className={input} />
          </label>

          <button onClick={() => { setTried([]); run([]); }} disabled={!image || busy} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold disabled:opacity-40 cursor-pointer">
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {busy ? 'AI sedang melihat foto…' : result ? 'Buat ulang' : 'Buat desain dari foto'}
          </button>

          {log.length > 0 && (
            <ul className="space-y-1 text-xs" aria-live="polite">
              {log.map((l, i) => (
                <li key={i} className={`flex gap-1.5 ${l.ok ? 'text-stone-600' : 'text-amber-700'}`}>
                  {l.ok ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-px text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 shrink-0 mt-px" />}
                  <span>{l.text}</span>
                </li>
              ))}
            </ul>
          )}

          {error && <p className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">{error}</p>}

          {result && (
            <section className="p-4 rounded-xl bg-white border border-sky-300 space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-bold">
                  {result.productName}
                  {result.presetName && <span className="font-normal text-stone-500"> · {result.presetName}</span>}
                </h3>
                <span className={`text-xs font-semibold ${result.confidence >= 0.6 ? 'text-emerald-700' : 'text-amber-700'}`}>mirip ±{Math.round(result.confidence * 100)}%</span>
              </div>
              <p className="text-sm text-stone-700">{PRODUCTS[result.design.product].summary(result.design.params)}</p>
              {result.seen && <p className="text-sm text-stone-600"><span className="font-semibold">Di foto:</span> {result.seen}</p>}
              {result.notes && <p className="text-sm text-stone-600"><span className="font-semibold">Catatan AI:</span> {result.notes}</p>}
              <p className="text-xs text-stone-400">oleh {result.engineLabel}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => onOpen(result.design, `Desain ${result.productName.toLowerCase()} dari foto dibuka. Cek lagi ukurannya ya.`)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-stone-900 text-white font-semibold cursor-pointer"
                >
                  Buka desain <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={tryOther} disabled={busy} className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-stone-300 bg-white font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer disabled:opacity-40" title="Hasil kurang mirip? Minta AI lain mencoba">
                  <RefreshCw className="w-4 h-4" /> Kurang mirip, coba AI lain
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
