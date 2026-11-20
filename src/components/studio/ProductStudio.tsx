import React, { useMemo, useRef, useState } from 'react';
import { ArrowLeft, Undo2, Download, AlertTriangle, Info, ChevronRight, Check, Scissors, Box, Grid2x2 } from 'lucide-react';
import { FurnitureDesign, Params, ParamValue, PRODUCTS } from '../../products';
import { estimateCost, frameFromHost, toFrameHost } from '../../products/common';
import { ThreeProductScene } from '../../three/ThreeProductScene';
import { FrameEditor2D } from '../FrameEditor2D';
import { ParamControl } from './ParamControl';
import { ProductResult } from './ProductResult';
import { KitchenConfig } from '../../types/kitchen';
import { getFrameMembers } from '../../utils/frameLayout';
import { MemberSheet } from './MemberSheet';
import { ThemeToggle } from '../ThemeToggle';
import { PriceSettings, loadPrices, savePrices } from '../../products/pricing';
import { shareUrl } from '../../products/share';

const TIP_KEY = 'studiorangka_tip3d';
const tipSeen = () => {
  try {
    return localStorage.getItem(TIP_KEY) === '1';
  } catch {
    return true;
  }
};

/** Tampilan: 3D (atur + model), 2D (gambar rangka per tampak), potongan besi */
type Tab = '3d' | '2d' | 'potongan';
const VIEWS: { id: Tab; label: string; short: string; icon: React.ReactNode }[] = [
  { id: '3d', label: '3D', short: '3D & atur', icon: <Box className="w-4 h-4" /> },
  { id: '2d', label: '2D', short: 'Gambar 2D', icon: <Grid2x2 className="w-4 h-4" /> },
  { id: 'potongan', label: 'Potongan besi', short: 'Potongan', icon: <Scissors className="w-4 h-4" /> },
];

/** Gaya cafe populer di Indonesia: satu ketuk mengatur pipa, warna cat & bahan papan */
const STYLES: { label: string; desc: string; params: Record<string, string> }[] = [
  { label: 'Industrial', desc: 'pipa 40×40 hitam doff, kayu tebal', params: { pipa: '40', warna: '#1f2226', papan: 'kayu' } },
  { label: 'Japandi', desc: 'pipa 20×20 putih, kayu muda', params: { pipa: '20', warna: '#e9e7e1', papan: 'kayu' } },
  { label: 'Minimalis', desc: 'pipa 30×30 abu, HPL', params: { pipa: '30', warna: '#6b7078', papan: 'hpl' } },
  { label: 'Tropis', desc: 'hijau army / terakota, kayu', params: { pipa: '30', warna: '#2f4a3a', papan: 'kayu' } },
];

interface Props {
  design: FurnitureDesign;
  onChange: (d: FurnitureDesign) => void;
  onHome: () => void;
  onToast: (msg: string) => void;
}

export const ProductStudio: React.FC<Props> = ({ design, onChange, onHome, onToast }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expertSel, setExpertSel] = useState<string | null>(null);
  const [showTip, setShowTip] = useState(() => !tipSeen());
  // pengaturan potong (panjang batang & lebar mata potong), tersimpan di browser
  const [cutSettings, setCutState] = useState<PriceSettings>(loadPrices);
  const setCutSettings = (p: PriceSettings) => {
    setCutState(p);
    savePrices(p);
  };
  const goTab = (t: Tab) => setTab(t);
  const def = PRODUCTS[design.product];
  const [tab, setTab] = useState<Tab>(() => {
    const t = new URLSearchParams(window.location.search).get('tab');
    return t === '2d' || t === 'ahli' ? '2d' : t === 'potongan' || t === 'hasil' || t === 'bengkel' ? 'potongan' : '3d';
  });
  const [stepIdx, setStepIdx] = useState(0);
  const history = useRef<{ stack: FurnitureDesign[]; last: number }>({ stack: [], last: 0 });

  const build = useMemo(() => def.build(design.params), [def, design.params]);
  const host = useMemo(() => ({ ...toFrameHost(design, build), productTitle: def.presets.find((p) => p.id === design.presetId)?.name || def.name }), [design, build, def]);
  const cut = useMemo(() => estimateCost(host, design, build, cutSettings), [host, design, build, cutSettings]);
  const checks = useMemo(() => def.checks(design.params, build), [def, design.params, build]);
  const isCustom = !!design.frame.customLayout;
  const members = useMemo(() => getFrameMembers(host), [host]);
  const selectedMember = members.find((m) => m.id === selectedId) || null;
  const dismissTip = () => {
    setShowTip(false);
    try {
      localStorage.setItem(TIP_KEY, '1');
    } catch {
      // abaikan
    }
  };

  /** Simpan ke riwayat undo (perubahan beruntun < 0,7 dtk, mis. menggeser slider, digabung) */
  const commit = (next: FurnitureDesign) => {
    const h = history.current;
    const now = Date.now();
    if (now - h.last > 700) h.stack = [...h.stack.slice(-39), design];
    h.last = now;
    onChange(next);
  };
  const setParams = (partial: Params) => commit({ ...design, params: { ...design.params, ...partial } });
  const undo = () => {
    const prev = history.current.stack.pop();
    history.current.last = 0;
    if (prev) onChange(prev);
  };

  const applyPreset = (id: string) => {
    const preset = def.presets.find((p) => p.id === id);
    if (!preset) return;
    commit({ ...design, presetId: id, params: { ...def.defaults, ...preset.params, ...(preset.sizes?.[0]?.params || {}) }, frame: { ...design.frame, customLayout: false, members: undefined, hinges: undefined } });
    onToast(`Contoh "${preset.name}" dipakai. Tekan Undo untuk kembali.`);
  };

  const saveJson = () => {
    const blob = new Blob([JSON.stringify({ app: 'studio-rangka', version: 1, design }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `desain-${def.id}-${Math.round(build.W)}x${Math.round(build.D)}x${Math.round(build.H)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    onToast('File desain tersimpan di folder unduhan.');
  };

  const step = def.steps[stepIdx];
  const visibleParams = step.keys
    .map((k) => def.params.find((p) => p.key === k))
    .filter((p): p is NonNullable<typeof p> => !!p && (!p.showIf || p.showIf(design.params)));
  const warnCount = checks.filter((c) => c.level === 'warn').length;
  const preset = def.presets.find((p) => p.id === design.presetId);
  const presetName = preset?.name;
  /** Ukuran umum yang sedang terpakai (semua nilainya sama dengan desain sekarang) */
  const activeSize = preset?.sizes?.find((sz) => Object.entries(sz.params).every(([k, v]) => design.params[k] === v));

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-stone-100 text-stone-900 overflow-hidden">
      {/* Header */}
      <header className="shrink-0 h-14 bg-white border-b border-stone-200 px-2 sm:px-4 flex items-center gap-2 sm:gap-3">
        <button
          onClick={onHome}
          className="flex items-center gap-1.5 p-2 sm:px-3 rounded-lg text-sm font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
          title="Kembali ke Beranda"
          aria-label="Kembali ke Beranda"
        >
          <ArrowLeft className="w-5 h-5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Beranda</span>
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold truncate">
            {def.name}
            {presetName && <span className="font-normal text-stone-500"> · {presetName}</span>}
          </div>
          <div className="text-xs text-stone-500 truncate">{def.summary(design.params)}</div>
        </div>

        {/* Tab tampilan (PC / tablet); di HP pindah ke navigasi bawah */}
        <nav className="hidden md:flex p-1 rounded-xl bg-stone-100" role="tablist" aria-label="Tampilan">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              role="tab"
              aria-selected={tab === v.id}
              onClick={() => goTab(v.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold cursor-pointer transition ${
                tab === v.id ? 'bg-stone-900 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {v.icon}
              {v.label}
              {v.id === 'potongan' && (
                <span className={`text-xs font-normal tabular-nums ${tab === v.id ? 'text-white/70' : 'text-stone-500'}`}>
                  {cut.bars} btg · {cut.totalLengthM.toLocaleString('id-ID')} m
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-0.5 sm:gap-1">
          <ThemeToggle />
          <button
            onClick={undo}
            disabled={!history.current.stack.length}
            className="flex items-center gap-1.5 p-2 lg:px-3 rounded-lg text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
            title="Batalkan perubahan terakhir"
            aria-label="Undo"
          >
            <Undo2 className="w-5 h-5 sm:w-4 sm:h-4" /> <span className="hidden lg:inline">Undo</span>
          </button>
          <button
            onClick={saveJson}
            className="flex items-center gap-1.5 p-2 lg:px-3 rounded-lg text-sm font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
            title="Simpan file desain (.json)"
            aria-label="Simpan file desain"
          >
            <Download className="w-5 h-5 sm:w-4 sm:h-4" /> <span className="hidden lg:inline">Simpan</span>
          </button>
        </div>
      </header>

      {tab === '3d' && (
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
          {/* 3D */}
          <div className="h-[38dvh] md:h-[45dvh] lg:h-auto lg:flex-1 min-h-0 lg:order-2">
            <div className="relative w-full h-full" data-product-scene>
              <ThreeProductScene
                host={host}
                build={build}
                paint={String(design.params.warna)}
                boardMaterial={String(design.params.papan || 'multiplek')}
                fitKey={design.product}
                selectedId={selectedId}
                onSelect={(id) => {
                  setSelectedId(id);
                  if (id && showTip) dismissTip();
                }}
              />
              {showTip && (
                <div className="absolute z-10 left-1/2 -translate-x-1/2 bottom-10 w-[min(92%,340px)] p-3 rounded-2xl bg-stone-900/95 text-white text-xs shadow-xl space-y-2">
                  <p>
                    <b>Seret</b> untuk memutar, <b>cubit / scroll</b> untuk zoom, dan <b>ketuk batang</b> untuk melihat panjang &amp; ukurannya.
                  </p>
                  <button onClick={dismissTip} className="px-3 py-1 rounded-lg bg-white text-stone-900 font-semibold cursor-pointer">
                    Mengerti
                  </button>
                </div>
              )}
              {selectedMember && (
                <MemberSheet
                  member={selectedMember}
                  host={host}
                  onClose={() => setSelectedId(null)}
                  onDelete={() => {
                    commit({ ...design, frame: { ...design.frame, customLayout: true, members: members.filter((m) => m.id !== selectedMember.id) } });
                    setSelectedId(null);
                    onToast('Batang dihapus. Tekan Undo kalau keliru.');
                  }}
                  onOpenExpert={() => {
                    setExpertSel(selectedMember.id);
                    setSelectedId(null);
                    goTab('2d');
                  }}
                />
              )}
            </div>
          </div>

          {/* Panel pengaturan */}
          <aside className="flex-1 lg:flex-none lg:w-[400px] min-h-0 flex flex-col bg-white border-t lg:border-t-0 lg:border-r border-stone-200 lg:order-1">
            <div className="shrink-0 px-4 pt-3 pb-2 border-b border-stone-100 space-y-2.5">
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                {/* hanya template dalam sub-kategori yang sama (satu produk bisa punya ratusan template) */}
                {def.presets.filter((p) => (p.group || '') === (preset?.group || '')).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p.id)}
                    className={`shrink-0 px-2.5 py-1 rounded-full text-xs border cursor-pointer ${
                      design.presetId === p.id ? 'bg-stone-800 text-white border-stone-800' : 'bg-white border-stone-300 text-stone-700 hover:border-stone-500'
                    }`}
                    title={p.desc}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
              <ol className="grid grid-cols-4 gap-1">
                {def.steps.map((s, i) => (
                  <li key={s.id}>
                    <button
                      onClick={() => setStepIdx(i)}
                      aria-current={i === stepIdx ? 'step' : undefined}
                      className={`w-full flex flex-col items-center py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer ${
                        i === stepIdx ? 'bg-sky-600 text-white' : i < stepIdx ? 'bg-sky-50 text-sky-800' : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      <span className="flex items-center gap-1">{i < stepIdx ? <Check className="w-3 h-3" /> : i + 1}</span>
                      {s.title}
                    </button>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 space-y-4">
              {isCustom && (
                <div className="p-3 rounded-xl bg-violet-50 border border-violet-200 text-xs text-violet-900 space-y-2">
                  <p>
                    Rangka sudah diubah sendiri di tampilan <b>2D</b>, jadi ukuran pipa tidak lagi mengikuti pengaturan di sini (papan &amp; roda
                    tetap ikut).
                  </p>
                  <button
                    onClick={() => commit({ ...design, frame: { ...design.frame, customLayout: false, members: undefined } })}
                    className="px-2.5 py-1 rounded-lg bg-violet-600 text-white font-semibold cursor-pointer"
                  >
                    Kembalikan rangka otomatis
                  </button>
                </div>
              )}

              {step.id === 'bahan' && def.params.some((x) => x.key === 'warna') && (
                <div className="space-y-1.5">
                  <div className="text-sm font-semibold text-stone-800">Gaya cepat</div>
                  <div className="grid grid-cols-2 gap-2">
                    {STYLES.map((st) => (
                      <button
                        key={st.label}
                        onClick={() => setParams(def.params.some((x) => x.key === 'papan') ? st.params : { pipa: st.params.pipa, warna: st.params.warna })}
                        className="p-2.5 rounded-xl border border-stone-300 bg-white hover:border-stone-500 text-left cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-stone-800">
                          <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: st.params.warna as string }} />
                          {st.label}
                        </span>
                        <span className="block text-[11px] text-stone-500">{st.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {step.id === 'ukuran' && preset?.sizes && preset.sizes.length > 1 && (
                <div className="space-y-1.5">
                  <div className="text-sm font-semibold text-stone-800">Ukuran umum untuk rangka ini</div>
                  <div className="grid grid-cols-2 gap-2">
                    {preset.sizes.map((sz) => (
                      <button
                        key={sz.label}
                        onClick={() => setParams(sz.params)}
                        aria-pressed={activeSize === sz}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer ${
                          activeSize === sz ? 'border-sky-600 bg-sky-50 ring-1 ring-sky-600' : 'border-stone-300 bg-white hover:border-stone-400'
                        }`}
                      >
                        <span className="block text-sm font-semibold text-stone-800">{sz.label}</span>
                        <span className="block text-[11px] text-stone-500">{sz.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {visibleParams.length === 0 && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-900">
                  Semua pilihan sudah diatur. Periksa catatan di bawah (kalau ada), lalu tekan <b>Lihat potongan besi</b>.
                </div>
              )}
              {visibleParams.map((p) => (
                <ParamControl key={p.key} def={p} value={design.params[p.key] as ParamValue} onChange={(v) => setParams({ [p.key]: v })} />
              ))}

              {checks.length > 0 && (
                <div className="space-y-2 pt-1">
                  {checks.map((c, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl text-xs flex gap-2 ${c.level === 'warn' ? 'bg-amber-50 border border-amber-300 text-amber-950' : 'bg-sky-50 border border-sky-200 text-sky-950'}`}
                    >
                      {c.level === 'warn' ? <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" /> : <Info className="w-4 h-4 shrink-0 text-sky-600" />}
                      <div className="space-y-1.5 min-w-0">
                        <p>{c.message}</p>
                        {c.fix && (
                          <button onClick={() => setParams(c.fix!.params)} className="px-2.5 py-1 rounded-lg bg-white border border-current font-semibold cursor-pointer">
                            {c.fix.label}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => goTab('2d')}
                className="w-full flex items-center gap-2 p-3 rounded-xl border border-dashed border-stone-300 text-left text-xs text-stone-600 hover:bg-stone-50 cursor-pointer"
              >
                <Grid2x2 className="w-4 h-4 shrink-0" />
                <span className="flex-1">
                  <b className="text-stone-800">Tampilan 2D</b>: geser batang satu per satu, tambah palang, pasang engsel lipat.
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="shrink-0 p-3 border-t border-stone-200 bg-white flex gap-2">
              {stepIdx > 0 && (
                <button onClick={() => setStepIdx(stepIdx - 1)} className="px-4 py-3 rounded-xl border border-stone-300 text-sm font-semibold text-stone-700 cursor-pointer">
                  Kembali
                </button>
              )}
              <button
                onClick={() => (stepIdx < def.steps.length - 1 ? setStepIdx(stepIdx + 1) : goTab('potongan'))}
                className="flex-1 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold cursor-pointer"
              >
                {stepIdx < def.steps.length - 1 ? `Lanjut: ${def.steps[stepIdx + 1].title}` : `Lihat potongan besi${warnCount ? ` (${warnCount} peringatan)` : ''}`}
              </button>
            </div>
          </aside>
        </div>
      )}

      {tab === '2d' && (
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="hidden sm:flex shrink-0 px-4 py-2 bg-white border-b border-stone-200 text-stone-600 text-xs items-center gap-2">
            <Grid2x2 className="w-3.5 h-3.5 shrink-0 text-stone-400" />
            <span>
              <b>Tampilan 2D</b>: tampak depan/samping/atas, angka per batang, engsel lipat. Perubahan di sini membuat rangka tidak lagi otomatis.
            </span>
          </div>
          <div className="flex-1 min-h-0">
            <FrameEditor2D
              key={expertSel || 'ahli'}
              initialSelectedId={expertSel}
              config={host}
              onChange={(u: Partial<KitchenConfig>) => {
                if (u.frame) commit({ ...design, frame: frameFromHost(design.frame, u.frame) });
              }}
            />
          </div>
        </div>
      )}

      {tab === 'potongan' && (
        <div className="flex-1 min-h-0">
          <ProductResult
            title={presetName || def.name}
            summary={def.summary(design.params)}
            host={host}
            cut={cut}
            settings={cutSettings}
            onSettings={setCutSettings}
            url={shareUrl(design)}
            onSaveJson={saveJson}
            onToast={onToast}
          />
        </div>
      )}

      {/* Navigasi bawah khusus HP */}
      <nav className="md:hidden shrink-0 grid grid-cols-3 bg-white border-t border-stone-200 pb-[env(safe-area-inset-bottom)]" role="tablist" aria-label="Tampilan">
        {VIEWS.map((v) => {
          const on = tab === v.id;
          return (
            <button
              key={v.id}
              role="tab"
              aria-selected={on}
              onClick={() => goTab(v.id)}
              className={`relative flex flex-col items-center justify-center gap-0.5 h-14 text-[11px] font-semibold cursor-pointer ${on ? 'text-sky-700' : 'text-stone-500'}`}
            >
              {on && <span className="absolute top-0 inset-x-8 h-0.5 rounded-full bg-sky-600" />}
              <span className="[&>svg]:w-5 [&>svg]:h-5">{v.icon}</span>
              {v.id === 'potongan' ? `${v.short} · ${cut.bars} btg` : v.short}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
