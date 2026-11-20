import React, { useState } from 'react';
import { ArrowRight, FolderOpen, History } from 'lucide-react';
import { PRODUCT_LIST, ProductId } from '../../products';

interface Props {
  onPick: (id: ProductId, presetId?: string) => void;
  onKitchen: () => void;
  resume: { title: string; subtitle: string; onClick: () => void } | null;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const KITCHEN_ICON = 'M4 10h52M8 10v26M52 10v26M24 14a6 4 0 1 0 12 0';

const Icon: React.FC<{ d: string }> = ({ d }) => (
  <svg viewBox="0 0 60 40" className="w-full h-full" aria-hidden="true">
    <path d={d} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Beranda: "Mau bikin apa?" → pilih produk → pilih contoh jadi */
export const HomeScreen: React.FC<Props> = ({ onPick, onKitchen, resume, onImport }) => {
  const [open, setOpen] = useState<ProductId | null>(null);
  const picked = PRODUCT_LIST.find((p) => p.id === open);

  return (
    <div className="min-h-[100dvh] w-full overflow-y-auto bg-stone-100 text-stone-900">
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-stone-900 text-amber-400 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path d="M4 20V6h16v14M4 11h16M9 6v14M15 6v14" fill="none" stroke="currentColor" strokeWidth={2} />
            </svg>
          </div>
          <div>
            <div className="font-bold leading-tight">Studio Rangka</div>
            <div className="text-xs text-stone-500">Rancang furnitur rangka besi, langsung dapat daftar potong &amp; biaya</div>
          </div>
          <label className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-sm font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer">
            <FolderOpen className="w-4 h-4" /> <span className="hidden sm:inline">Buka file</span>
            <input type="file" accept=".json,application/json" onChange={onImport} className="hidden" />
          </label>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold">Mau bikin apa?</h1>
          <p className="text-stone-600">Pilih jenis barang, lalu mulai dari contoh yang paling mirip. Semua ukuran bisa diubah nanti.</p>
        </div>

        {resume && (
          <button onClick={resume.onClick} className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white border border-stone-200 hover:border-sky-500 text-left cursor-pointer">
            <History className="w-5 h-5 text-sky-600 shrink-0" />
            <span className="flex-1 min-w-0">
              <span className="block font-semibold">Lanjutkan: {resume.title}</span>
              <span className="block text-sm text-stone-500 truncate">{resume.subtitle}</span>
            </span>
            <ArrowRight className="w-5 h-5 text-stone-400" />
          </button>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PRODUCT_LIST.map((p) => (
            <button
              key={p.id}
              onClick={() => setOpen(open === p.id ? null : p.id)}
              aria-expanded={open === p.id}
              className={`p-3 rounded-2xl border text-left cursor-pointer transition ${
                open === p.id ? 'bg-sky-50 border-sky-600 ring-1 ring-sky-600' : 'bg-white border-stone-200 hover:border-stone-400'
              }`}
            >
              <div className="h-20 rounded-xl bg-stone-100 text-stone-700 p-3 mb-2">
                <Icon d={p.icon} />
              </div>
              <div className="font-bold">{p.name}</div>
              <div className="text-xs text-stone-500">{p.tagline}</div>
            </button>
          ))}
          <button onClick={onKitchen} className="p-3 rounded-2xl border bg-white border-stone-200 hover:border-stone-400 text-left cursor-pointer">
            <div className="h-20 rounded-xl bg-stone-100 text-stone-700 p-3 mb-2">
              <Icon d={KITCHEN_ICON} />
            </div>
            <div className="font-bold">Meja dapur</div>
            <div className="text-xs text-stone-500">wastafel · kompor · laci</div>
          </button>
        </div>

        {picked && (
          <section className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-lg font-bold">Contoh {picked.name.toLowerCase()}</h2>
              <button onClick={() => onPick(picked.id)} className="text-sm font-semibold text-sky-700 hover:underline cursor-pointer">
                Mulai dari ukuran standar →
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {picked.presets.map((pr) => (
                <button
                  key={pr.id}
                  onClick={() => onPick(picked.id, pr.id)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 hover:border-sky-600 hover:bg-sky-50 text-left cursor-pointer"
                >
                  <span className="w-12 h-9 shrink-0 text-stone-600">
                    <Icon d={picked.icon} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-sm">{pr.name}</span>
                    <span className="block text-xs text-stone-500">{pr.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        <p className="text-xs text-stone-500">
          Segera hadir: kursi &amp; bangku, stool, rak tanaman bertingkat. Desain tersimpan otomatis di browser ini.
        </p>
      </main>
    </div>
  );
};
