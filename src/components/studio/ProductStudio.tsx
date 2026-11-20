import React, { useMemo, useRef, useState } from 'react';
import { ArrowLeft, Undo2, Download, AlertTriangle, Info, Wrench, ChevronRight, Check } from 'lucide-react';
import { FurnitureDesign, Params, ParamValue, PRODUCTS } from '../../products';
import { estimateCost, frameFromHost, rupiahShort, toFrameHost } from '../../products/common';
import { ThreeProductScene } from '../../three/ThreeProductScene';
import { FrameEditor2D } from '../FrameEditor2D';
import { ParamControl } from './ParamControl';
import { ProductResult } from './ProductResult';
import { KitchenConfig } from '../../types/kitchen';

type Tab = 'atur' | 'ahli' | 'hasil';

interface Props {
  design: FurnitureDesign;
  onChange: (d: FurnitureDesign) => void;
  onHome: () => void;
  onToast: (msg: string) => void;
}

export const ProductStudio: React.FC<Props> = ({ design, onChange, onHome, onToast }) => {
  const def = PRODUCTS[design.product];
  const [tab, setTab] = useState<Tab>(() => {
    const t = new URLSearchParams(window.location.search).get('tab');
    return t === 'ahli' || t === 'hasil' ? t : 'atur';
  });
  const [stepIdx, setStepIdx] = useState(0);
  const history = useRef<{ stack: FurnitureDesign[]; last: number }>({ stack: [], last: 0 });

  const build = useMemo(() => def.build(design.params), [def, design.params]);
  const host = useMemo(() => toFrameHost(design, build), [design, build]);
  const cost = useMemo(() => estimateCost(host, design, build), [host, design, build]);
  const checks = useMemo(() => def.checks(design.params, build), [def, design.params, build]);
  const isCustom = !!design.frame.customLayout;

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
    commit({ ...design, presetId: id, params: { ...def.defaults, ...preset.params }, frame: { ...design.frame, customLayout: false, members: undefined, hinges: [] } });
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
  const tabs: { id: Tab; label: string }[] = [
    { id: 'atur', label: 'Atur' },
    { id: 'ahli', label: 'Mode Ahli' },
    { id: 'hasil', label: 'Hasil' },
  ];
  const presetName = def.presets.find((p) => p.id === design.presetId)?.name;

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-stone-100 text-stone-900 overflow-hidden">
      {/* Header */}
      <header className="shrink-0 bg-white border-b border-stone-200 px-3 sm:px-4 py-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        <button onClick={onHome} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Beranda</span>
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold truncate">
            {def.name}
            {presetName && <span className="font-normal text-stone-500"> · {presetName}</span>}
          </div>
          <div className="text-xs text-stone-500 truncate">{def.summary(design.params)}</div>
        </div>
        <button
          onClick={() => setTab('hasil')}
          className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold tabular-nums cursor-pointer hover:bg-amber-200"
          title="Perkiraan biaya bahan, lihat rinciannya di Hasil"
        >
          ± {rupiahShort(cost.total)} · {cost.bars} batang
        </button>
        <div className="flex items-center gap-1 order-last sm:order-none w-full sm:w-auto">
          <nav className="flex flex-1 sm:flex-none p-1 rounded-xl bg-stone-100" role="tablist">
            {tabs.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-sm font-semibold cursor-pointer ${tab === t.id ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-800'}`}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <button onClick={undo} disabled={!history.current.stack.length} className="p-2 rounded-lg text-stone-600 hover:bg-stone-100 disabled:opacity-30 cursor-pointer" title="Batalkan perubahan terakhir">
            <Undo2 className="w-4 h-4" />
          </button>
          <button onClick={saveJson} className="p-2 rounded-lg text-stone-600 hover:bg-stone-100 cursor-pointer" title="Simpan file desain (.json)">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </header>

      {tab === 'atur' && (
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
          {/* 3D */}
          <div className="h-[42dvh] lg:h-auto lg:flex-1 min-h-0 lg:order-2">
            <ThreeProductScene host={host} build={build} paint={String(design.params.warna)} boardMaterial={String(design.params.papan || 'multiplek')} fitKey={design.product} />
          </div>

          {/* Panel pengaturan */}
          <aside className="flex-1 lg:flex-none lg:w-[400px] min-h-0 flex flex-col bg-white border-t lg:border-t-0 lg:border-r border-stone-200 lg:order-1">
            <div className="shrink-0 px-4 pt-3 pb-2 border-b border-stone-100 space-y-2.5">
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                {def.presets.map((p) => (
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
                    Rangka sudah diubah sendiri di <b>Mode Ahli</b>, jadi ukuran pipa tidak lagi mengikuti pengaturan di sini (papan &amp; roda tetap
                    ikut).
                  </p>
                  <button
                    onClick={() => commit({ ...design, frame: { ...design.frame, customLayout: false, members: undefined } })}
                    className="px-2.5 py-1 rounded-lg bg-violet-600 text-white font-semibold cursor-pointer"
                  >
                    Kembalikan rangka otomatis
                  </button>
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
                onClick={() => setTab('ahli')}
                className="w-full flex items-center gap-2 p-3 rounded-xl border border-dashed border-stone-300 text-left text-xs text-stone-600 hover:bg-stone-50 cursor-pointer"
              >
                <Wrench className="w-4 h-4 shrink-0" />
                <span className="flex-1">
                  <b className="text-stone-800">Mode Ahli</b>: geser batang satu per satu, tambah palang, pasang engsel lipat.
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
                onClick={() => (stepIdx < def.steps.length - 1 ? setStepIdx(stepIdx + 1) : setTab('hasil'))}
                className="flex-1 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold cursor-pointer"
              >
                {stepIdx < def.steps.length - 1 ? `Lanjut: ${def.steps[stepIdx + 1].title}` : `Lihat hasil${warnCount ? ` (${warnCount} peringatan)` : ''}`}
              </button>
            </div>
          </aside>
        </div>
      )}

      {tab === 'ahli' && (
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="shrink-0 px-4 py-2 bg-stone-800 text-stone-100 text-xs flex flex-wrap items-center gap-x-3 gap-y-1">
            <Wrench className="w-3.5 h-3.5" />
            <span>
              <b>Mode Ahli</b>: tampak depan/samping/atas, angka per batang, engsel lipat. Perubahan di sini membuat rangka tidak lagi otomatis.
            </span>
          </div>
          <div className="flex-1 min-h-0">
            <FrameEditor2D
              config={host}
              onChange={(u: Partial<KitchenConfig>) => {
                if (u.frame) commit({ ...design, frame: frameFromHost(design.frame, u.frame) });
              }}
            />
          </div>
        </div>
      )}

      {tab === 'hasil' && (
        <div className="flex-1 min-h-0">
          <ProductResult title={presetName || def.name} summary={def.summary(design.params)} host={host} cost={cost} onSaveJson={saveJson} />
        </div>
      )}
    </div>
  );
};
