import React, { useMemo, useState } from 'react';
import { ArrowRight, Camera, FolderOpen, History, LayoutGrid, List, Layers, Search, X } from 'lucide-react';
import { CATEGORIES, PRODUCTS, PRODUCT_LIST, ProductId } from '../../products';
import { ProductThumb } from './ProductThumb';

interface Props {
  onPick: (id: ProductId, presetId?: string) => void;
  onKitchen: () => void;
  resume: { title: string; subtitle: string; onClick: () => void } | null;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhoto: () => void;
}

const KITCHEN_ICON = 'M4 10h52M8 10v26M52 10v26M24 14a6 4 0 1 0 12 0';
const VIEW_KEY = 'studiorangka_home_view';

type Layout = 'besar' | 'daftar';
interface ViewPref {
  group: boolean;
  layout: Layout;
}

const loadView = (): ViewPref => {
  try {
    const v = JSON.parse(localStorage.getItem(VIEW_KEY) || '{}');
    return { group: v.group !== false, layout: v.layout === 'daftar' ? 'daftar' : 'besar' };
  } catch {
    return { group: true, layout: 'besar' };
  }
};

/** Satu kartu desain (template) yang bisa diklik */
interface Card {
  key: string;
  product: ProductId;
  preset?: string;
  title: string;
  subtitle: string;
  sizes?: string[];
  icon: string;
  group?: string; // id sub-kategori template
  expandable?: boolean; // kartu produk tanpa template tertentu: buka daftar contoh
}

const BASIC = ''; // "sub-kategori" untuk desain dasar (template tanpa group)

const groupName = (id: ProductId, group?: string) => PRODUCTS[id].groups?.find((g) => g.id === group)?.name;

const allDesigns = (): Card[] =>
  PRODUCT_LIST.flatMap((def) =>
    def.presets.map((pr) => ({
      key: `${def.id}:${pr.id}`,
      product: def.id,
      preset: pr.id,
      title: pr.name,
      subtitle: [def.name, groupName(def.id, pr.group), pr.desc].filter(Boolean).join(' · '),
      sizes: pr.sizes?.map((s) => s.label),
      icon: def.icon,
      group: pr.group || BASIC,
    }))
  );

const matches = (c: Card, q: string) => {
  const t = `${c.title} ${c.subtitle} ${(c.sizes || []).join(' ')}`.toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => t.includes(w));
};

/** Beranda: pilih desain (dikelompokkan / semua), tampilan gambar besar / daftar, cari */
export const HomeScreen: React.FC<Props> = ({ onPick, onKitchen, resume, onImport, onPhoto }) => {
  const [view, setViewState] = useState<ViewPref>(loadView);
  const [open, setOpen] = useState<{ cat: number; id: ProductId; key: string; group: string } | null>(null);
  const [q, setQ] = useState('');
  const setView = (v: Partial<ViewPref>) => {
    const next = { ...view, ...v };
    setViewState(next);
    try {
      localStorage.setItem(VIEW_KEY, JSON.stringify(next));
    } catch {
      // abaikan
    }
  };
  const designs = useMemo(allDesigns, []);
  const searching = q.trim().length > 0;
  const found = searching ? designs.filter((c) => matches(c, q)) : [];

  const kitchenCard = (
    <button
      key="kitchen"
      onClick={onKitchen}
      className={
        view.layout === 'besar'
          ? 'p-3 rounded-2xl border bg-white border-stone-200 hover:border-stone-400 text-left cursor-pointer'
          : 'w-full flex items-center gap-3 p-2.5 rounded-xl border bg-white border-stone-200 hover:border-stone-400 text-left cursor-pointer'
      }
    >
      <div className={view.layout === 'besar' ? 'aspect-[4/3] rounded-xl bg-stone-100 text-stone-500 p-6 mb-2' : 'w-24 h-18 shrink-0 rounded-lg bg-stone-100 text-stone-500 p-3'}>
        <svg viewBox="0 0 60 40" className="w-full h-full" aria-hidden="true">
          <path d={KITCHEN_ICON} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
        </svg>
      </div>
      <div className="min-w-0">
        <div className="font-bold">Meja dapur</div>
        <div className="text-xs text-stone-500">wastafel · kompor · laci</div>
      </div>
    </button>
  );

  const renderCard = (c: Card, onClick: () => void, active = false) =>
    view.layout === 'besar' ? (
      <button
        key={c.key}
        onClick={onClick}
        aria-expanded={c.expandable ? active : undefined}
        className={`p-3 rounded-2xl border text-left cursor-pointer transition ${active ? 'bg-sky-50 border-sky-600 ring-1 ring-sky-600' : 'bg-white border-stone-200 hover:border-stone-400'}`}
      >
        <div className="aspect-[4/3] rounded-xl bg-stone-100 mb-2 overflow-hidden">
          <ProductThumb product={c.product} preset={c.preset} fallbackIcon={c.icon} alt={c.title} />
        </div>
        <div className="font-bold leading-tight">{c.title}</div>
        <div className="text-xs text-stone-500 mt-0.5">{c.subtitle}</div>
      </button>
    ) : (
      <button
        key={c.key}
        onClick={onClick}
        aria-expanded={c.expandable ? active : undefined}
        className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left cursor-pointer transition ${active ? 'bg-sky-50 border-sky-600 ring-1 ring-sky-600' : 'bg-white border-stone-200 hover:border-stone-400'}`}
      >
        <div className="w-24 h-[72px] shrink-0 rounded-lg bg-stone-100 overflow-hidden">
          <ProductThumb product={c.product} preset={c.preset} fallbackIcon={c.icon} alt={c.title} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold leading-tight">{c.title}</div>
          <div className="text-xs text-stone-500">{c.subtitle}</div>
          {c.sizes && c.sizes.length > 1 && <div className="text-[11px] text-sky-700 mt-0.5 truncate">{c.sizes.join(' · ')}</div>}
        </div>
        <ArrowRight className="w-4 h-4 text-stone-300 shrink-0" />
      </button>
    );

  const wrap = (children: React.ReactNode) =>
    view.layout === 'besar' ? (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">{children}</div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">{children}</div>
    );

  /** Sub-kategori satu produk: desain dasar + tiap sub-kategori (masing-masing 20 template) */
  const groupsOf = (id: ProductId) => {
    const def = PRODUCTS[id];
    const basic = def.presets.filter((p) => !p.group).length;
    return [
      ...(basic ? [{ id: BASIC, name: 'Desain dasar', desc: 'satu contoh per bentuk rangka', count: basic }] : []),
      ...(def.groups || []).map((g) => ({ ...g, count: def.presets.filter((p) => p.group === g.id).length })),
    ];
  };

  /** Daftar contoh (template) satu produk, dipilah per sub-kategori */
  const presetPanel = (id: ProductId, group: string, setGroup: (g: string) => void) => {
    const def = PRODUCTS[id];
    const groups = groupsOf(id);
    const sel = groups.find((g) => g.id === group) || groups[0];
    return (
      <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-lg font-bold">Pilih desain {def.name.toLowerCase()}</h3>
          <button onClick={() => onPick(id)} className="text-sm font-semibold text-sky-700 hover:underline cursor-pointer">
            Mulai dari ukuran standar →
          </button>
        </div>
        {groups.length > 1 && (
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={`Jenis ${def.name.toLowerCase()}`}>
            {groups.map((g) => {
              const on = g.id === sel.id;
              return (
                <button
                  key={g.id || 'dasar'}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setGroup(g.id)}
                  className={`px-3 py-1.5 rounded-full border text-sm font-semibold cursor-pointer transition ${on ? 'bg-stone-900 border-stone-900 text-white' : 'bg-white border-stone-300 text-stone-700 hover:border-stone-500'}`}
                >
                  {g.name} <span className={on ? 'text-stone-300' : 'text-stone-400'}>{g.count}</span>
                </button>
              );
            })}
          </div>
        )}
        {sel && <p className="text-sm text-stone-500">{sel.desc}</p>}
        {wrap(
          designs
            .filter((c) => c.product === id && c.group === sel?.id)
            .map((c) => renderCard({ ...c, subtitle: def.presets.find((p) => p.id === c.preset)?.desc || '' }, () => onPick(c.product, c.preset)))
        )}
      </div>
    );
  };

  const seg = (on: boolean) => `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold cursor-pointer ${on ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'}`;

  return (
    <div className="min-h-[100dvh] w-full bg-stone-100 text-stone-900">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-stone-900 text-amber-400 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path d="M4 20V6h16v14M4 11h16M9 6v14M15 6v14" fill="none" stroke="currentColor" strokeWidth={2} />
            </svg>
          </div>
          <div>
            <div className="font-bold leading-tight">Studio Rangka</div>
            <div className="hidden sm:block text-xs text-stone-500">Rancang furnitur rangka besi, langsung dapat daftar potongan besi</div>
          </div>
          <label className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-sm font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer">
            <FolderOpen className="w-4 h-4" /> <span className="hidden sm:inline">Buka file</span>
            <input type="file" accept=".json,application/json" onChange={onImport} className="hidden" />
          </label>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-5 sm:py-8 space-y-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold">Mau bikin apa?</h1>
          <p className="text-stone-600">
            {designs.length} desain siap pakai. Pilih yang paling mirip, semua ukuran bisa diubah nanti.
          </p>
        </div>

        <button onClick={onPhoto} className="w-full flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-sky-600 to-sky-500 text-white text-left cursor-pointer hover:from-sky-700 hover:to-sky-600 shadow-sm">
          <span className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Camera className="w-5 h-5" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block font-bold">Punya foto furnitur? Buat desain dari foto</span>
            <span className="block text-sm text-sky-100">Upload gambar meja / kursi / rak, AI membuatkan desain yang mirip</span>
          </span>
          <ArrowRight className="w-5 h-5 shrink-0" />
        </button>

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

        {/* Cari + pengaturan tampilan */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari desain, mis. stool bar, rak buku, meja lipat"
              className="w-full pl-9 pr-9 py-2 rounded-xl border border-stone-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
              aria-label="Cari desain"
            />
            {searching && (
              <button onClick={() => setQ('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 cursor-pointer" aria-label="Hapus pencarian">
                <X className="w-4 h-4" />
              </button>
            )}
          </label>
          <div className="flex p-1 rounded-xl bg-stone-200" role="radiogroup" aria-label="Kelompokkan">
            <button role="radio" aria-checked={view.group} onClick={() => setView({ group: true })} className={seg(view.group)}>
              <Layers className="w-4 h-4" /> Per kategori
            </button>
            <button role="radio" aria-checked={!view.group} onClick={() => setView({ group: false })} className={seg(!view.group)}>
              Semua desain
            </button>
          </div>
          <div className="flex p-1 rounded-xl bg-stone-200" role="radiogroup" aria-label="Tampilan">
            <button role="radio" aria-checked={view.layout === 'besar'} onClick={() => setView({ layout: 'besar' })} className={seg(view.layout === 'besar')} title="Gambar besar">
              <LayoutGrid className="w-4 h-4" /> <span className="hidden sm:inline">Gambar besar</span>
            </button>
            <button role="radio" aria-checked={view.layout === 'daftar'} onClick={() => setView({ layout: 'daftar' })} className={seg(view.layout === 'daftar')} title="Daftar dengan keterangan">
              <List className="w-4 h-4" /> <span className="hidden sm:inline">Daftar</span>
            </button>
          </div>
        </div>

        {searching ? (
          <section className="space-y-2.5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500">{found.length} hasil untuk “{q.trim()}”</h2>
            {found.length ? wrap(found.map((c) => renderCard(c, () => onPick(c.product, c.preset)))) : <p className="text-sm text-stone-500">Belum ada desain yang cocok. Coba kata lain.</p>}
          </section>
        ) : view.group ? (
          CATEGORIES.map((cat, ci) => {
            const openHere = open && open.cat === ci ? open : null;
            return (
              <section key={cat.title} className="space-y-2.5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500">{cat.title}</h2>
                {wrap([
                  ...cat.items.map((it) => {
                    const def = PRODUCTS[it.product];
                    const key = `${it.product}-${it.preset || ''}-${it.group || ''}`;
                    const inGroup = it.group ? def.presets.filter((p) => p.group === it.group) : [];
                    const card: Card = {
                      key,
                      product: it.product,
                      preset: it.preset || inGroup[0]?.id || def.presets[0]?.id,
                      title: it.title,
                      subtitle: it.preset ? it.subtitle : `${it.subtitle} · ${it.group ? inGroup.length : def.presets.length} desain`,
                      icon: it.icon || def.icon,
                      expandable: !it.preset,
                    };
                    const active = !it.preset && openHere?.key === key;
                    const firstGroup = groupsOf(it.product)[0]?.id ?? BASIC;
                    return renderCard(
                      card,
                      () => (it.preset ? onPick(it.product, it.preset) : setOpen(active ? null : { cat: ci, id: it.product, key, group: it.group ?? firstGroup })),
                      active
                    );
                  }),
                  ...(ci === CATEGORIES.length - 1 ? [kitchenCard] : []),
                ])}
                {openHere && presetPanel(openHere.id, openHere.group, (g) => setOpen({ ...openHere, group: g }))}
              </section>
            );
          })
        ) : (
          <>
            {PRODUCT_LIST.map((def) => (
              <section key={def.id} className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500">
                  {def.name} <span className="font-semibold normal-case tracking-normal">· {def.presets.length} desain</span>
                </h2>
                {groupsOf(def.id).map((g) => (
                  <div key={g.id || 'dasar'} className="space-y-2">
                    <h3 className="font-bold text-stone-800">
                      {g.name} <span className="text-sm font-normal text-stone-500">· {g.desc}</span>
                    </h3>
                    {wrap(designs.filter((c) => c.product === def.id && c.group === g.id).map((c) => renderCard(c, () => onPick(c.product, c.preset))))}
                  </div>
                ))}
              </section>
            ))}
            <section className="space-y-2.5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500">Dapur</h2>
              {wrap([kitchenCard])}
            </section>
          </>
        )}

        <p className="text-xs text-stone-500">Desain tersimpan otomatis di browser ini. Simpan file desain untuk dipindah ke HP / komputer lain.</p>
      </main>
    </div>
  );
};
