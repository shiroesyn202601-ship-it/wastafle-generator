import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Undo2,
  Download,
  AlertTriangle,
  Info,
  ChevronRight,
  ChevronDown,
  Check,
  Scissors,
  Box,
  Wrench,
  Eye,
  Sparkles,
  Loader2,
  X,
  Maximize2,
  Minimize2,
  MousePointerClick,
} from 'lucide-react';
import { FurnitureDesign, ParamDef, Params, ParamValue, PRODUCTS } from '../../products';
import { estimateCost, frameFromHost, toFrameHost } from '../../products/common';
import { ThreeProductScene, DimHandle } from '../../three/ThreeProductScene';
import { FrameEditor2D } from '../FrameEditor2D';
import { ParamControl } from './ParamControl';
import { ProductResult } from './ProductResult';
import { KitchenConfig, MemberTweak } from '../../types/kitchen';
import { getFrameMembers, memberSectionCm } from '../../utils/frameLayout';
import { MemberSheet } from './MemberSheet';
import { ThemeToggle } from '../ThemeToggle';
import { PriceSettings, loadPrices, savePrices } from '../../products/pricing';
import { shareUrl } from '../../products/share';
import { affectedBy, changedMemberIds, describeChange, dimensionParams, enablingChange, formatValue, isVisible, paramsForMember, templateParams } from '../../products/insight';
import { isConnected, mirrorPartners, setTweak } from '../../products/tweaks';
import { EditProposal, aiReady, proposeEdit } from '../../ai/editText';

const TIP_KEY = 'studiorangka_tip3d_v2';
const tipSeen = () => {
  try {
    return localStorage.getItem(TIP_KEY) === '1';
  } catch {
    return true;
  }
};

/** Tampilan: 3D (atur + model), Mode bengkel 2D (gambar rangka per tampak), potongan besi */
type Tab = '3d' | '2d' | 'potongan';
const VIEWS: { id: Tab; label: string; short: string; icon: React.ReactNode }[] = [
  { id: '3d', label: '3D & atur', short: '3D & atur', icon: <Box className="w-4 h-4" /> },
  { id: '2d', label: 'Bengkel 2D', short: 'Bengkel 2D', icon: <Wrench className="w-4 h-4" /> },
  { id: 'potongan', label: 'Potongan besi', short: 'Potongan', icon: <Scissors className="w-4 h-4" /> },
];

/** Gaya cafe populer di Indonesia: satu ketuk mengatur pipa, warna cat & bahan papan */
const STYLES: { label: string; desc: string; params: Record<string, string> }[] = [
  { label: 'Industrial', desc: 'pipa 40×40 hitam doff, kayu tebal', params: { pipa: '40', warna: '#1f2226', papan: 'kayu' } },
  { label: 'Japandi', desc: 'pipa 20×20 putih, kayu muda', params: { pipa: '20', warna: '#e9e7e1', papan: 'kayu' } },
  { label: 'Minimalis', desc: 'pipa 30×30 abu, HPL', params: { pipa: '30', warna: '#6b7078', papan: 'hpl' } },
  { label: 'Tropis', desc: 'hijau army / terakota, kayu', params: { pipa: '30', warna: '#2f4a3a', papan: 'kayu' } },
];

/** Pilihan bentuk yang diberi gambar kecil (warna, papan & pipa terlalu halus bedanya untuk gambar kecil) */
const NO_PICTURE = new Set(['warna', 'papan', 'pipa', 'ukuranRoda']);
/** Lebih dari ini, sisanya dilipat ke "Pilihan lainnya" */
const MAIN_LIMIT = 6;

interface Props {
  design: FurnitureDesign;
  onChange: (d: FurnitureDesign) => void;
  onHome: () => void;
  onToast: (msg: string) => void;
}

type HistoryItem = { design: FurnitureDesign; label: string };

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
  const def = PRODUCTS[design.product];
  const [tab, setTab] = useState<Tab>(() => {
    const t = new URLSearchParams(window.location.search).get('tab');
    return t === '2d' || t === 'ahli' ? '2d' : t === 'potongan' || t === 'hasil' || t === 'bengkel' ? 'potongan' : '3d';
  });
  const [stepIdx, setStepIdx] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const [lockedOpen, setLockedOpen] = useState(false);
  const [hover, setHover] = useState<{ key: string; value?: ParamValue } | null>(null);
  const [comparing, setComparing] = useState(false);
  const [big3d, setBig3d] = useState(false); // HP: perbesar 3D, panel dikecilkan
  const [ask, setAsk] = useState('');
  const [asking, setAsking] = useState(false);
  const [proposal, setProposal] = useState<EditProposal | null>(null);
  const [flash, setFlash] = useState<{ ids: string[]; at: number } | undefined>();
  const history = useRef<{ stack: HistoryItem[]; last: number; lastLabel: string }>({ stack: [], last: 0, lastLabel: '' });
  const [, forceRender] = useState(0);

  const build = useMemo(() => def.build(design.params), [def, design.params]);
  const host = useMemo(() => ({ ...toFrameHost(design, build), productTitle: def.presets.find((p) => p.id === design.presetId)?.name || def.name }), [design, build, def]);
  const cut = useMemo(() => estimateCost(host, design, build, cutSettings), [host, design, build, cutSettings]);
  const checks = useMemo(() => def.checks(design.params, build), [def, design.params, build]);
  const isCustom = !!design.frame.customLayout;
  const members = useMemo(() => getFrameMembers(host), [host]);
  const selectedMember = members.find((m) => m.id === selectedId) || null;
  const preset = def.presets.find((p) => p.id === design.presetId);
  const presetName = preset?.name;
  const base = useMemo(() => templateParams(def, design.presetId, design.params), [def, design.presetId, design.params]);

  const dismissTip = () => {
    setShowTip(false);
    try {
      localStorage.setItem(TIP_KEY, '1');
    } catch {
      // abaikan
    }
  };

  // ---------- Riwayat (undo) dengan nama perubahan ----------
  /** Simpan ke riwayat undo (perubahan beruntun < 1,2 dtk dengan nama sama, mis. menggeser slider, digabung) */
  const commit = (next: FurnitureDesign, label: string) => {
    const h = history.current;
    const now = Date.now();
    const kind = label.split(/ \d| → |:/)[0];
    if (now - h.last > 1200 || kind !== h.lastLabel) h.stack = [...h.stack.slice(-39), { design, label }];
    else {
      // geseran slider beruntun: simpan satu langkah "Tinggi 75 → 92 cm" (nilai awal, nilai akhir)
      const top = h.stack[h.stack.length - 1];
      const [from] = top.label.split(' → ');
      const to = label.split(' → ')[1];
      top.label = to && top.label.includes(' → ') ? `${from} → ${to}` : label;
    }
    h.last = now;
    h.lastLabel = kind;
    onChange(next);
  };
  const setParams = (partial: Params, label?: string) => {
    const next = { ...design.params, ...partial };
    commit({ ...design, params: next }, label || describeChange(def, design.params, next) || 'Ubah pilihan');
  };
  const undo = () => {
    const h = history.current;
    const prev = h.stack.pop();
    h.last = 0;
    h.lastLabel = '';
    if (prev) {
      onChange(prev.design);
      onToast(`Dibatalkan: ${prev.label}`);
      forceRender((n) => n + 1);
    }
  };
  const lastLabel = history.current.stack[history.current.stack.length - 1]?.label;

  // ---------- Sorot batang yang baru berubah ----------
  const prevMembers = useRef(members);
  useEffect(() => {
    const before = prevMembers.current;
    prevMembers.current = members;
    if (before === members) return;
    const ids = changedMemberIds(before, members);
    // ganti template / produk mengubah hampir semua batang: tidak perlu berkedip
    if (ids.length && ids.length < members.length * 0.75) setFlash({ ids, at: Date.now() });
  }, [members]);

  // ---------- Batang yang terkait pilihan di bawah kursor ----------
  const hintIds = useMemo(() => (hover ? affectedBy(def, design.params, hover.key, hover.value) : undefined), [hover, def, design.params]);
  const onHover = (key: string) => (v: ParamValue | undefined | null) => setHover(v === null ? null : { key, value: v });

  // ---------- Panah tarik ukuran di 3D ----------
  const structureKey = def.params
    .filter((p) => p.type !== 'number')
    .map((p) => `${p.key}=${design.params[p.key]}`)
    .join('|');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const dimKeys = useMemo(() => dimensionParams(def, design.params), [def, structureKey]);
  const dims = useMemo(() => {
    if (isCustom) return undefined; // rangka manual tidak mengikuti ukuran
    const out: Partial<Record<'x' | 'y' | 'z', DimHandle>> = {};
    (['x', 'y', 'z'] as const).forEach((ax) => {
      const k = dimKeys[ax];
      const p = k ? def.params.find((x) => x.key === k) : undefined;
      if (!p || !isVisible(p, design.params)) return;
      out[ax] = {
        label: p.label.split(' / ')[0],
        value: design.params[p.key] as number,
        min: p.min ?? 0,
        max: p.max ?? 300,
        step: p.step || 1,
        marks: p.marks?.map((m) => m.value),
        onChange: (v) => setParams({ [p.key]: v }),
      };
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimKeys, design, isCustom]);

  // ---------- Bandingkan dengan contoh awal (tekan & tahan) / pratinjau usulan "ketik perubahan" ----------
  const previewParams = useMemo(
    () => (comparing ? base : proposal && Object.keys(proposal.params).length ? { ...design.params, ...proposal.params } : null),
    [comparing, base, proposal, design.params]
  );
  const baseBuild = useMemo(() => {
    try {
      return previewParams ? def.build(previewParams) : null;
    } catch {
      return null;
    }
  }, [previewParams, def]);
  const baseHost = useMemo(
    () =>
      baseBuild && previewParams
        ? toFrameHost({ ...design, params: previewParams, frame: comparing ? { ...design.frame, tweaks: undefined, customLayout: false, members: undefined } : design.frame }, baseBuild)
        : null,
    [baseBuild, previewParams, design, comparing]
  );
  const previewing = !!baseBuild;
  const differsFromTemplate = useMemo(() => Object.keys(base).some((k) => base[k] !== design.params[k]) || !!design.frame.tweaks || isCustom, [base, design, isCustom]);

  // ---------- Template ----------
  const applyPreset = (id: string) => {
    const p = def.presets.find((x) => x.id === id);
    if (!p) return;
    commit(
      { ...design, presetId: id, params: { ...def.defaults, ...p.params, ...(p.sizes?.[0]?.params || {}) }, frame: { ...design.frame, customLayout: false, members: undefined, hinges: undefined, tweaks: undefined } },
      `Contoh "${p.name}"`
    );
    setSelectedId(null);
    onToast(`Contoh "${p.name}" dipakai. Tekan Undo untuk kembali.`);
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

  // ---------- Batang yang diketuk: pilihan terkait + penyesuaian batang ini saja ----------
  const original = selectedMember ? build.members.find((m) => m.id === selectedMember.id) || null : null;
  const partners = useMemo(() => (original ? mirrorPartners(build.members, original, build.W, build.D) : []), [original, build]);
  const related = useMemo(() => {
    if (!selectedMember) return [] as ParamDef[];
    return paramsForMember(def, design.params, selectedMember.id)
      .map((k) => def.params.find((p) => p.key === k)!)
      .filter(Boolean);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMember?.id, def, design.params]);
  const connected = useMemo(
    () => (selectedMember ? isConnected(members, selectedMember.id, (m) => memberSectionCm(m, host)) : true),
    [selectedMember, members, host]
  );
  const tweakMember = (patch: Partial<MemberTweak>, mirror: boolean, label: string) => {
    if (!selectedMember) return;
    let tweaks = setTweak(design.frame.tweaks, selectedMember.id, patch);
    if (mirror)
      partners.forEach((pt) => {
        const pp: Partial<MemberTweak> = { ...patch };
        if (pt.flipX && pp.dx !== undefined) pp.dx = -pp.dx;
        if (pt.flipZ && pp.dz !== undefined) pp.dz = -pp.dz;
        tweaks = setTweak(tweaks, pt.id, pp);
      });
    commit({ ...design, frame: { ...design.frame, tweaks: Object.keys(tweaks).length ? tweaks : undefined } }, label);
  };
  const resetMember = (mirror: boolean) => {
    if (!selectedMember) return;
    const tweaks = { ...(design.frame.tweaks || {}) };
    delete tweaks[selectedMember.id];
    if (mirror) partners.forEach((pt) => delete tweaks[pt.id]);
    commit({ ...design, frame: { ...design.frame, tweaks: Object.keys(tweaks).length ? tweaks : undefined } }, `Kembalikan ${selectedMember.label || 'batang'}`);
  };
  const deleteMember = (mirror: boolean) => {
    if (!selectedMember) return;
    const name = selectedMember.label || 'batang';
    if (isCustom) {
      commit({ ...design, frame: { ...design.frame, members: members.filter((m) => m.id !== selectedMember.id) } }, `Hapus ${name}`);
    } else tweakMember({ removed: true }, mirror, `Hapus ${name}`);
    setSelectedId(null);
    onToast(`${name} dihapus. Tekan Undo kalau keliru.`);
  };

  // Tombol Kembali di HP menutup panel bagian, bukan meninggalkan studio
  const sheetOpen = !!selectedId;
  useEffect(() => {
    if (!sheetOpen) return;
    window.history.pushState({ studioSheet: true }, '');
    const onPop = () => setSelectedId(null);
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      if (window.history.state?.studioSheet) window.history.back();
    };
  }, [sheetOpen]);

  // ---------- Ketik perubahan ----------
  const runAsk = async () => {
    const text = ask.trim();
    if (!text || asking) return;
    setAsking(true);
    setProposal(null);
    try {
      setProposal(await proposeEdit(def.id, design.params, text));
    } finally {
      setAsking(false);
    }
  };
  const applyProposal = () => {
    if (!proposal) return;
    setParams(proposal.params);
    setProposal(null);
    setAsk('');
  };

  // ---------- Isi langkah ----------
  const step = def.steps[stepIdx];
  const stepDefs = step.keys.map((k) => def.params.find((p) => p.key === k)).filter((p): p is ParamDef => !!p);
  const visibleParams = stepDefs.filter((p) => isVisible(p, design.params));
  const lockedParams = stepDefs
    .filter((p) => !isVisible(p, design.params))
    .map((p) => ({ p, en: enablingChange(def, design.params, p.key) }))
    .filter((x): x is { p: ParamDef; en: NonNullable<ReturnType<typeof enablingChange>> } => !!x.en);
  const mainParams = visibleParams.length > MAIN_LIMIT ? visibleParams.slice(0, MAIN_LIMIT - 1) : visibleParams;
  const moreParams = visibleParams.length > MAIN_LIMIT ? visibleParams.slice(MAIN_LIMIT - 1) : [];
  const warnCount = checks.filter((c) => c.level === 'warn').length;
  /** Ukuran umum yang sedang terpakai (semua nilainya sama dengan desain sekarang) */
  const activeSize = preset?.sizes?.find((sz) => Object.entries(sz.params).every(([k, v]) => design.params[k] === v));

  // pilihan bentuk yang benar-benar mengubah rangka diberi gambar kecil
  const pictureKeys = useMemo(() => {
    const out = new Set<string>();
    for (const p of visibleParams) {
      if (p.type !== 'choice' || NO_PICTURE.has(p.key) || (p.options?.length || 0) > 24) continue;
      const alt = p.options!.find((o) => o.value !== design.params[p.key]);
      if (alt && affectedBy(def, design.params, p.key, alt.value).length) out.add(p.key);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def, stepIdx, structureKey]);

  // dasar gambar pilihan: angka dari contoh, bentuk dari desain sekarang (geser slider tidak memicu render ulang)
  const previewBase = useMemo(() => {
    const out: Params = { ...base };
    def.params.forEach((p) => {
      if (p.type !== 'number') out[p.key] = design.params[p.key];
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, def, structureKey]);

  const renderParam = (p: ParamDef) => (
    <ParamControl
      key={p.key}
      def={p}
      value={design.params[p.key] as ParamValue}
      base={base[p.key]}
      onChange={(v) => setParams({ [p.key]: v })}
      onHover={onHover(p.key)}
      preview={pictureKeys.has(p.key) ? { product: def.id, params: (v) => ({ ...previewBase, [p.key]: v }) } : undefined}
    />
  );

  const goStep = (i: number) => {
    setStepIdx(i);
    setMoreOpen(false);
    setLockedOpen(false);
    setHover(null);
  };

  const sceneBuild = baseBuild || build;
  const sceneHost = baseHost || host;
  const sceneParams = previewParams && baseBuild ? previewParams : design.params;

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
              onClick={() => setTab(v.id)}
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
            className="flex items-center gap-1.5 p-2 lg:px-3 rounded-lg text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-30 cursor-pointer max-w-[220px]"
            title={lastLabel ? `Batalkan: ${lastLabel}` : 'Belum ada yang bisa dibatalkan'}
            aria-label={lastLabel ? `Undo: ${lastLabel}` : 'Undo'}
          >
            <Undo2 className="w-5 h-5 sm:w-4 sm:h-4 shrink-0" /> <span className="hidden lg:inline">Undo</span>
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
          <div className={`${big3d ? 'h-[68dvh]' : 'h-[48dvh]'} md:h-[50dvh] lg:h-auto lg:flex-1 min-h-0 lg:order-2 transition-[height]`}>
            <div className="relative w-full h-full" data-product-scene>
              <ThreeProductScene
                host={sceneHost}
                build={sceneBuild}
                paint={String(sceneParams.warna)}
                boardMaterial={String(sceneParams.papan || 'multiplek')}
                fitKey={design.product}
                selectedId={previewing ? null : selectedId}
                hintIds={previewing ? undefined : hintIds}
                flash={previewing ? undefined : flash}
                dims={previewing ? undefined : dims}
                onSelect={(id) => {
                  setSelectedId(id);
                  if (id) setProposal(null);
                  if (id && showTip) dismissTip();
                }}
              />
              {previewing && (
                <div className={`absolute left-1/2 -translate-x-1/2 top-14 px-3 py-1.5 rounded-full text-white text-xs font-bold shadow pointer-events-none ${comparing ? 'bg-amber-500' : 'bg-sky-600'}`}>
                  {comparing ? `Contoh awal${presetName ? `: ${presetName}` : ''}` : 'Pratinjau usulan — belum diterapkan'}
                </div>
              )}
              {differsFromTemplate && (
                <button
                  onPointerDown={() => setComparing(true)}
                  onPointerUp={() => setComparing(false)}
                  onPointerLeave={() => setComparing(false)}
                  onPointerCancel={() => setComparing(false)}
                  onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && setComparing(true)}
                  onKeyUp={() => setComparing(false)}
                  onContextMenu={(e) => e.preventDefault()}
                  className="absolute left-2 bottom-2 sm:bottom-10 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/90 backdrop-blur border border-stone-300 shadow-sm text-xs font-semibold text-stone-700 select-none touch-none cursor-pointer"
                  title="Tekan dan tahan untuk melihat contoh awal"
                >
                  <Eye className="w-4 h-4" /> Tahan: lihat contoh awal
                </button>
              )}
              {showTip && (
                <div className="absolute z-10 left-1/2 -translate-x-1/2 bottom-12 w-[min(92%,360px)] p-3 rounded-2xl bg-stone-900/95 text-white text-xs shadow-xl space-y-2">
                  <p>
                    <b>Ketuk bagian</b> (kaki, palang, rak) untuk mengubahnya. <b>Tarik titik biru</b> untuk mengubah panjang, lebar &amp; tinggi. Seret area kosong untuk memutar.
                  </p>
                  <button onClick={dismissTip} className="px-3 py-1 rounded-lg bg-white text-stone-900 font-semibold cursor-pointer">
                    Mengerti
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Panel pengaturan */}
          <aside className="flex-1 lg:flex-none lg:w-[400px] min-h-0 flex flex-col bg-white border-t lg:border-t-0 lg:border-r border-stone-200 lg:order-1">
            {selectedMember ? (
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3">
                <MemberSheet
                  member={selectedMember}
                  host={host}
                  related={related}
                  params={design.params}
                  base={base}
                  onParam={(k, v) => setParams({ [k]: v })}
                  onHover={(k, v) => setHover(v === null ? null : { key: k, value: v })}
                  tweak={isCustom ? null : design.frame.tweaks?.[selectedMember.id] || {}}
                  partners={partners.length}
                  connected={connected}
                  onTweak={(patch, mirror) => tweakMember(patch, mirror, `Ubah ${selectedMember.label || 'batang'}`)}
                  onResetTweak={resetMember}
                  onClose={() => setSelectedId(null)}
                  onDelete={deleteMember}
                  onOpenExpert={() => {
                    setExpertSel(selectedMember.id);
                    setSelectedId(null);
                    setTab('2d');
                  }}
                />
              </div>
            ) : (
              <>
                <div className="shrink-0 px-4 pt-3 pb-2 border-b border-stone-100 space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 min-w-0 flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
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
                    <button
                      onClick={() => setBig3d(!big3d)}
                      className="md:hidden shrink-0 p-1.5 rounded-lg border border-stone-300 text-stone-600 cursor-pointer"
                      aria-label={big3d ? 'Kecilkan 3D' : 'Perbesar 3D'}
                      title={big3d ? 'Kecilkan 3D' : 'Perbesar 3D'}
                    >
                      {big3d ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Ketik perubahan */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      runAsk();
                    }}
                    className="flex gap-1.5"
                  >
                    <div className="relative flex-1 min-w-0">
                      <Sparkles className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-600" />
                      <input
                        value={ask}
                        onChange={(e) => setAsk(e.target.value)}
                        placeholder="Mau diubah apa? mis. tinggi 85, pakai roda"
                        aria-label="Ketik perubahan yang diinginkan"
                        className="w-full h-9 pl-8 pr-2 rounded-xl border border-stone-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                      />
                    </div>
                    <button type="submit" disabled={!ask.trim() || asking} className="shrink-0 h-9 px-3 rounded-xl bg-sky-600 text-white text-sm font-semibold disabled:opacity-40 cursor-pointer flex items-center gap-1">
                      {asking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ubah'}
                    </button>
                  </form>
                  {proposal && (
                    <div className="p-3 rounded-xl border border-sky-300 bg-sky-50 text-sm space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-xs font-bold text-sky-900">
                          {Object.keys(proposal.params).length ? 'Usulan perubahan (pratinjau di 3D)' : 'Belum bisa diubah'}
                        </div>
                        <button onClick={() => setProposal(null)} className="p-0.5 text-sky-800 cursor-pointer" aria-label="Tutup usulan">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {Object.keys(proposal.params).length > 0 && (
                        <ul className="space-y-1 text-xs text-stone-800">
                          {Object.entries(proposal.params).map(([k, v]) => {
                            const p = def.params.find((x) => x.key === k)!;
                            return (
                              <li key={k} className="flex justify-between gap-2">
                                <span>{p.label}</span>
                                <span className="font-semibold tabular-nums text-right">
                                  <span className="text-stone-400 font-normal">{formatValue(p, design.params[k])} → </span>
                                  {formatValue(p, v)}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                      {proposal.notes && <p className="text-xs text-stone-600">{proposal.notes}</p>}
                      {Object.keys(proposal.params).length > 0 && (
                        <div className="flex gap-1.5">
                          <button onClick={applyProposal} className="flex-1 py-2 rounded-lg bg-sky-600 text-white text-xs font-bold cursor-pointer">
                            Terapkan
                          </button>
                          <button onClick={() => setProposal(null)} className="px-3 py-2 rounded-lg border border-stone-300 bg-white text-xs font-semibold text-stone-700 cursor-pointer">
                            Batal
                          </button>
                        </div>
                      )}
                      <p className="text-[10px] text-stone-400">{proposal.source === 'ai' ? 'Dibaca oleh AI' : aiReady() ? 'AI tidak menjawab, dibaca di perangkat' : 'Dibaca di perangkat (tanpa AI)'}</p>
                    </div>
                  )}

                  <ol className="grid grid-cols-4 gap-1">
                    {def.steps.map((s, i) => (
                      <li key={s.id}>
                        <button
                          onClick={() => goStep(i)}
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

                <div className={`flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 space-y-4 ${big3d ? 'max-md:hidden' : ''}`}>
                  {isCustom && (
                    <div className="p-3 rounded-xl bg-violet-50 border border-violet-200 text-xs text-violet-900 space-y-2">
                      <p>
                        Rangka sudah diubah sendiri di <b>Mode bengkel 2D</b>, jadi ukuran pipa & posisi batang tidak lagi mengikuti pengaturan di sini (papan &amp; roda
                        tetap ikut).
                      </p>
                      <button
                        onClick={() => commit({ ...design, frame: { ...design.frame, customLayout: false, members: undefined } }, 'Kembalikan rangka otomatis')}
                        className="px-2.5 py-1 rounded-lg bg-violet-600 text-white font-semibold cursor-pointer"
                      >
                        Kembalikan rangka otomatis
                      </button>
                    </div>
                  )}
                  {!isCustom && design.frame.tweaks && (
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600 flex items-center gap-2">
                      <span className="flex-1">{Object.keys(design.frame.tweaks).length} batang diubah sendiri (digeser / ganti pipa / dihapus).</span>
                      <button
                        onClick={() => commit({ ...design, frame: { ...design.frame, tweaks: undefined } }, 'Kembalikan semua batang')}
                        className="shrink-0 px-2 py-1 rounded-lg border border-stone-300 bg-white font-semibold text-stone-700 cursor-pointer"
                      >
                        Kembalikan semua
                      </button>
                    </div>
                  )}

                  {stepIdx === 0 && (
                    <div className="flex items-start gap-2 text-xs text-stone-500">
                      <MousePointerClick className="w-4 h-4 shrink-0 text-sky-600" />
                      <span>
                        Bisa juga langsung di 3D: <b className="text-stone-700">ketuk bagian</b> untuk mengubahnya, atau <b className="text-stone-700">tarik titik biru</b> untuk ukuran.
                      </span>
                    </div>
                  )}

                  {step.id === 'bahan' && def.params.some((x) => x.key === 'warna') && (
                    <div className="space-y-1.5">
                      <div className="text-sm font-semibold text-stone-800">Gaya cepat</div>
                      <div className="grid grid-cols-2 gap-2">
                        {STYLES.map((st) => (
                          <button
                            key={st.label}
                            onClick={() => setParams(def.params.some((x) => x.key === 'papan') ? st.params : { pipa: st.params.pipa, warna: st.params.warna }, `Gaya ${st.label}`)}
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
                            onClick={() => setParams(sz.params, `Ukuran ${sz.label}`)}
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
                  {mainParams.map(renderParam)}

                  {moreParams.length > 0 && (
                    <div className="rounded-xl border border-stone-200">
                      <button onClick={() => setMoreOpen(!moreOpen)} aria-expanded={moreOpen} className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-stone-700 cursor-pointer">
                        Pilihan lainnya ({moreParams.length})
                        <ChevronDown className={`w-4 h-4 transition ${moreOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {moreOpen && <div className="px-3 pb-3 space-y-4">{moreParams.map(renderParam)}</div>}
                    </div>
                  )}

                  {lockedParams.length > 0 && (
                    <div className="rounded-xl border border-dashed border-stone-300">
                      <button onClick={() => setLockedOpen(!lockedOpen)} aria-expanded={lockedOpen} className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-stone-500 cursor-pointer">
                        Tidak tersedia untuk pilihan sekarang ({lockedParams.length})
                        <ChevronDown className={`w-4 h-4 transition ${lockedOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {lockedOpen && (
                        <div className="px-3 pb-3 space-y-2">
                          {lockedParams.map(({ p, en }) => (
                            <ParamControl
                              key={p.key}
                              def={p}
                              value={design.params[p.key] as ParamValue}
                              onChange={() => {}}
                              disabled={{
                                reason: `hanya bisa dipakai bila ${en.text}.`,
                                fixLabel: `Ganti ke ${en.text.split(': ')[1]}`,
                                onFix: () => setParams({ [en.key]: en.value }),
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

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
                              <button onClick={() => setParams(c.fix!.params, c.fix!.label)} className="px-2.5 py-1 rounded-lg bg-white border border-current font-semibold cursor-pointer">
                                {c.fix.label}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => setTab('2d')}
                    className="w-full flex items-center gap-2 p-3 rounded-xl border border-dashed border-stone-300 text-left text-xs text-stone-600 hover:bg-stone-50 cursor-pointer"
                  >
                    <Wrench className="w-4 h-4 shrink-0" />
                    <span className="flex-1">
                      <b className="text-stone-800">Mode bengkel 2D</b>: gambar tampak depan/samping/atas, tambah batang baru, pasang engsel lipat.
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="shrink-0 p-3 border-t border-stone-200 bg-white flex gap-2">
                  {stepIdx > 0 && (
                    <button onClick={() => goStep(stepIdx - 1)} className="px-4 py-3 rounded-xl border border-stone-300 text-sm font-semibold text-stone-700 cursor-pointer">
                      Kembali
                    </button>
                  )}
                  <button
                    onClick={() => (stepIdx < def.steps.length - 1 ? goStep(stepIdx + 1) : setTab('potongan'))}
                    className="flex-1 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold cursor-pointer"
                  >
                    {stepIdx < def.steps.length - 1 ? `Lanjut: ${def.steps[stepIdx + 1].title}` : `Lihat potongan besi${warnCount ? ` (${warnCount} peringatan)` : ''}`}
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {tab === '2d' && (
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="hidden sm:flex shrink-0 px-4 py-2 bg-white border-b border-stone-200 text-stone-600 text-xs items-center gap-2">
            <Wrench className="w-3.5 h-3.5 shrink-0 text-stone-400" />
            <span>
              <b>Mode bengkel 2D</b>: gambar tampak depan/samping/atas dengan angka tiap batang. Untuk menggeser atau mengganti pipa satu batang, lebih mudah
              ketuk batangnya di tampilan 3D. Mengubah batang di sini membuat rangka tidak lagi mengikuti slider ukuran.
            </span>
          </div>
          <div className="flex-1 min-h-0">
            <FrameEditor2D
              key={expertSel || 'ahli'}
              initialSelectedId={expertSel}
              config={host}
              onChange={(u: Partial<KitchenConfig>) => {
                if (u.frame) commit({ ...design, frame: frameFromHost(design.frame, u.frame) }, 'Ubah di Mode bengkel');
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
            build={build}
            paint={String(design.params.warna || '#1f2226')}
            board={String(design.params.papan || 'multiplek')}
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
              onClick={() => setTab(v.id)}
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
