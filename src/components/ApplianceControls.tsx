import React from 'react';
import {
  KitchenConfig,
  SinkConfig,
  StoveConfig,
  SinkModel,
  SinkMounting,
  FaucetType,
  SinkFinish,
  StoveType,
  SinkBrandModel,
  StoveBrandModel,
  SINK_PRODUCER_PRESETS,
  STOVE_PRODUCER_PRESETS,
} from '../types/kitchen';
import {
  Flame,
  Droplets,
  ShieldAlert,
  Sparkles,
  MoveHorizontal,
  ArrowUpDown,
  FileText,
  Check,
  Building,
  Layers,
  Sliders,
} from 'lucide-react';

interface Props {
  config: KitchenConfig;
  onChange: (updated: Partial<KitchenConfig>) => void;
  onOpenDocModal?: () => void;
}

export const ApplianceControls: React.FC<Props> = ({ config, onChange, onOpenDocModal }) => {
  const { totalWidth, totalDepth, totalHeight, sink, stove } = config;

  const handleSinkChange = (updates: Partial<SinkConfig>) => {
    onChange({ sink: { ...sink, ...updates } });
  };

  const handleStoveChange = (updates: Partial<StoveConfig>) => {
    onChange({ stove: { ...stove, ...updates } });
  };

  const handleSelectSinkPreset = (presetKey: SinkBrandModel) => {
    if (presetKey === 'custom') {
      handleSinkChange({ brandModel: 'custom' });
      return;
    }
    const preset = SINK_PRODUCER_PRESETS[presetKey];
    if (preset) {
      handleSinkChange({
        brandModel: presetKey,
        width: preset.width,
        length: preset.length,
        bowlDepth: preset.bowlDepth,
        model: preset.model,
        mounting: preset.mounting,
        finish: preset.finish,
        faucet: preset.faucet,
      });
    }
  };

  const handleSelectStovePreset = (presetKey: StoveBrandModel) => {
    if (presetKey === 'custom') {
      handleStoveChange({ brandModel: 'custom' });
      return;
    }
    const preset = STOVE_PRODUCER_PRESETS[presetKey];
    if (preset) {
      handleStoveChange({
        brandModel: presetKey,
        width: preset.width,
        length: preset.length,
        recessDepth: preset.recessDepth,
        type: preset.type,
        hasKnobs: preset.hasKnobs,
      });
    }
  };

  // Calculate clearance gap
  const sinkLeft = sink.posX - sink.width / 2;
  const sinkRight = sink.posX + sink.width / 2;
  const stoveLeft = stove.posX - stove.width / 2;
  const stoveRight = stove.posX + stove.width / 2;

  let gap = 0;
  if (sinkRight < stoveLeft) gap = stoveLeft - sinkRight;
  else if (stoveRight < sinkLeft) gap = sinkLeft - stoveRight;
  else gap = -1;

  // Auto layout helper
  const handleAutoIdealLayout = () => {
    const idealGap = 50;
    const sinkW = sink.width;
    const stoveW = stove.width;
    const totalOccupied = sinkW + idealGap + stoveW;

    if (totalOccupied <= totalWidth - 20) {
      const margin = (totalWidth - totalOccupied) / 2;
      const newSinkX = Math.round(margin + sinkW / 2);
      const newStoveX = Math.round(margin + sinkW + idealGap + stoveW / 2);
      onChange({
        sink: { ...sink, posX: newSinkX, posY: Math.round(totalDepth / 2) },
        stove: { ...stove, posX: newStoveX, posY: Math.round(totalDepth / 2) },
      });
    } else {
      onChange({
        sink: { ...sink, posX: Math.round(totalWidth * 0.25), posY: Math.round(totalDepth / 2) },
        stove: { ...stove, posX: Math.round(totalWidth * 0.75), posY: Math.round(totalDepth / 2) },
      });
    }
  };

  return (
    <div className="space-y-4 text-neutral-200 select-none">
      {/* 0. DOKUMEN SPK & MANUAL FABRIKASI BANNER */}
      {onOpenDocModal && (
        <div className="relative overflow-hidden p-3.5 bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-neutral-900/80 border border-blue-500/30 rounded-xl shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white tracking-tight">Manual & Ukuran Potongan Besi</p>
                <p className="text-[11px] text-blue-200/70">
                  Ekspor format Word (.DOC) untuk diserahkan ke tukang las & wastafel
                </p>
              </div>
            </div>
            <button
              onClick={onOpenDocModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-blue-900/40 transition shrink-0 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Ekspor .DOC</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. ERGONOMIC CLEARANCE METER */}
      <div className="p-3.5 bg-[#12151c]/90 border border-white/[0.08] rounded-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-white">Jarak Kerja Ergonomis</span>
          </div>
          <button
            onClick={handleAutoIdealLayout}
            className="flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-white/10 text-amber-300 text-[11px] font-medium rounded-lg border border-amber-500/30 transition cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Atur Posisi Ideal</span>
          </button>
        </div>

        {/* Clearance Metric Bar */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[11px] text-neutral-400">Jarak Bersih Wastafel ↔ Kompor:</span>
            <span className={`font-mono font-bold ${
              gap < 0 ? 'text-rose-400' : gap < 40 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {gap < 0 ? 'Bertabrakan!' : `${Math.round(gap)} cm`}
            </span>
          </div>
          <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                gap < 0
                  ? 'bg-rose-500 w-full'
                  : gap < 40
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: gap < 0 ? '100%' : `${Math.min(100, (gap / 80) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-neutral-400 leading-relaxed pt-0.5">
            {gap < 0
              ? 'Peringatan: Posisi lubang wastafel dan kompor bertabrakan. Geser salah satu perangkat.'
              : gap < 40
              ? `Jarak ${Math.round(gap)} cm terlalu sempit. Rekomendasi minimal 40–50 cm agar cipratan air tidak menyentuh kompor.`
              : `Jarak ${Math.round(gap)} cm sangat ideal untuk area persiapan bumbu dan masakan (food preparation zone).`}
          </p>
        </div>
      </div>

      {/* 2. PENGATURAN WASTAFEL CUCI PIRING */}
      <div className="p-3.5 bg-[#12151c]/90 border border-white/[0.08] rounded-xl space-y-3.5">
        <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-xs text-white">Wastafel Cuci Piring (Kitchen Sink)</h3>
              <p className="text-[10px] text-neutral-400">Cekung ke bawah dengan mangkuk dalam & saringan afur</p>
            </div>
          </div>
          <label className="flex items-center gap-1.5 text-xs text-neutral-300 cursor-pointer">
            <input
              type="checkbox"
              checked={sink.enabled}
              onChange={(e) => handleSinkChange({ enabled: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 accent-blue-500 cursor-pointer"
            />
            <span className="text-[11px] font-medium">{sink.enabled ? 'Aktif' : 'Nonaktif'}</span>
          </label>
        </div>

        {sink.enabled && (
          <div className="space-y-3.5">
            {/* Pilihan Model Resmi Produsen */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-neutral-300 font-semibold flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-400" />
                Pilihan Model Resmi Produsen
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(Object.keys(SINK_PRODUCER_PRESETS) as Exclude<SinkBrandModel, 'custom'>[]).map((key) => {
                  const item = SINK_PRODUCER_PRESETS[key];
                  const isSelected = sink.brandModel === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleSelectSinkPreset(key)}
                      className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                        isSelected
                          ? 'bg-blue-950/40 border-blue-500/80 text-white shadow-sm ring-1 ring-blue-500/40'
                          : 'bg-black/30 border-white/[0.06] hover:border-white/20 text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-white">{item.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-neutral-400 mt-0.5">
                        <span className="text-blue-300 font-medium">{item.brand} ({item.origin})</span>
                        <span>·</span>
                        <span className="font-mono">{item.width}×{item.length} cm</span>
                        <span>·</span>
                        <span className="font-mono text-emerald-400">Bak {item.bowlDepth}cm</span>
                      </div>
                    </button>
                  );
                })}

                <button
                  onClick={() => handleSelectSinkPreset('custom')}
                  className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                    sink.brandModel === 'custom' || !sink.brandModel
                      ? 'bg-blue-950/40 border-blue-500/80 text-white shadow-sm ring-1 ring-blue-500/40'
                      : 'bg-black/30 border-white/[0.06] hover:border-white/20 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-white">Kustom Bebas (Custom Sink)</span>
                    {(sink.brandModel === 'custom' || !sink.brandModel) && (
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    Atur dimensi lebar, panjang, dan kedalaman bak secara mandiri.
                  </p>
                </button>
              </div>
            </div>

            {/* Slider Posisi Horizontal (X) */}
            <div className="bg-black/20 p-2.5 rounded-lg border border-white/5 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 text-neutral-300 text-[11px]">
                  <MoveHorizontal className="w-3.5 h-3.5 text-blue-400" />
                  Posisi Horizontal (X)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleSinkChange({ posX: Math.max(Math.round(sink.width / 2 + 5), sink.posX - 5) })}
                    className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-neutral-300 text-[10px] font-mono cursor-pointer"
                  >
                    -5
                  </button>
                  <span className="font-mono font-bold text-blue-400 px-1">{sink.posX} cm</span>
                  <button
                    onClick={() => handleSinkChange({ posX: Math.min(Math.round(totalWidth - sink.width / 2 - 5), sink.posX + 5) })}
                    className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-neutral-300 text-[10px] font-mono cursor-pointer"
                  >
                    +5
                  </button>
                </div>
              </div>
              <input
                type="range"
                min={Math.round(sink.width / 2 + 5)}
                max={Math.round(totalWidth - sink.width / 2 - 5)}
                step={1}
                value={sink.posX}
                onChange={(e) => handleSinkChange({ posX: parseInt(e.target.value) })}
                className="w-full accent-blue-500 cursor-pointer h-1.5 bg-neutral-800 rounded-full"
              />
            </div>

            {/* Slider Posisi Kedalaman (Y) */}
            <div className="bg-black/20 p-2.5 rounded-lg border border-white/5 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 text-neutral-300 text-[11px]">
                  <ArrowUpDown className="w-3.5 h-3.5 text-blue-400" />
                  Posisi Kedalaman (Y)
                </span>
                <span className="font-mono font-bold text-blue-400">{sink.posY} cm</span>
              </div>
              <input
                type="range"
                min={Math.round(sink.length / 2 + 5)}
                max={Math.round(totalDepth - sink.length / 2 - 5)}
                step={1}
                value={sink.posY}
                onChange={(e) => handleSinkChange({ posY: parseInt(e.target.value) })}
                className="w-full accent-blue-500 cursor-pointer h-1.5 bg-neutral-800 rounded-full"
              />
            </div>

            {/* Dimensi: Lebar, Panjang, Kedalaman Bak */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-black/20 p-2 rounded-lg border border-white/5 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-neutral-400">Lebar (P)</span>
                  <span className="font-mono font-bold text-blue-400">{sink.width}cm</span>
                </div>
                <input
                  type="range"
                  min={35}
                  max={110}
                  step={1}
                  value={sink.width}
                  onChange={(e) => handleSinkChange({ width: parseInt(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer h-1 bg-neutral-800 rounded-full"
                />
              </div>

              <div className="bg-black/20 p-2 rounded-lg border border-white/5 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-neutral-400">Panjang (L)</span>
                  <span className="font-mono font-bold text-blue-400">{sink.length}cm</span>
                </div>
                <input
                  type="range"
                  min={35}
                  max={55}
                  step={1}
                  value={sink.length}
                  onChange={(e) => handleSinkChange({ length: parseInt(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer h-1 bg-neutral-800 rounded-full"
                />
              </div>

              <div className="bg-black/20 p-2 rounded-lg border border-white/5 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-neutral-400">Kedalaman Bak</span>
                  <span className="font-mono font-bold text-emerald-400">{sink.bowlDepth}cm</span>
                </div>
                <input
                  type="range"
                  min={14}
                  max={28}
                  step={1}
                  value={sink.bowlDepth}
                  onChange={(e) => handleSinkChange({ bowlDepth: parseInt(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer h-1 bg-neutral-800 rounded-full"
                />
              </div>
            </div>

            {/* Model & Pemasangan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Model Bak</label>
                <select
                  value={sink.model}
                  onChange={(e) => handleSinkChange({ model: e.target.value as SinkModel })}
                  className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="single">Single Bowl (1 Bak)</option>
                  <option value="double">Double Bowl (2 Bak Kembar)</option>
                  <option value="bowl-and-drainer">1 Bak + Sayap Tirisan</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Tipe Pemasangan</label>
                <select
                  value={sink.mounting}
                  onChange={(e) => handleSinkChange({ mounting: e.target.value as SinkMounting })}
                  className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="undermount">Undermount (Di bawah marmer)</option>
                  <option value="topmount">Topmount (Bibir marmer atas)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Tipe Keran Air</label>
                <select
                  value={sink.faucet}
                  onChange={(e) => handleSinkChange({ faucet: e.target.value as FaucetType })}
                  className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="gooseneck">Leher Angsa (Gooseneck)</option>
                  <option value="modern-flex">Modern Pull-Down Spring Chef</option>
                  <option value="square-black">Kotak Hitam Minimalis</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Finishing Material</label>
                <select
                  value={sink.finish}
                  onChange={(e) => handleSinkChange({ finish: e.target.value as SinkFinish })}
                  className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="stainless">Stainless Steel SUS304 Brushed</option>
                  <option value="black-nano">Black Nano Doff Anti-Gores</option>
                  <option value="gold-brass">Gold Brass Kuningan Mewah</option>
                </select>
              </div>
            </div>

            {/* Workstation Accessories */}
            <label className="flex items-center gap-2 p-2 bg-black/30 border border-white/5 rounded-lg text-xs text-neutral-300 hover:text-white cursor-pointer transition">
              <input
                type="checkbox"
                checked={sink.showAccessories ?? false}
                onChange={(e) => handleSinkChange({ showAccessories: e.target.checked })}
                className="w-4 h-4 rounded text-blue-500 accent-blue-500 cursor-pointer"
              />
              <span className="text-[11px]">Talenan Kayu Geser & Keranjang Tirisan (Workstation Sink)</span>
            </label>
          </div>
        )}
      </div>

      {/* 3. PENGATURAN KOMPOR TANAM */}
      <div className="p-3.5 bg-[#12151c]/90 border border-white/[0.08] rounded-xl space-y-3.5">
        <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-xs text-white">Kompor Tanam (Built-in Cooktop)</h3>
              <p className="text-[10px] text-neutral-400">Gas tungku kuningan atau induksi kaca keramik</p>
            </div>
          </div>
          <label className="flex items-center gap-1.5 text-xs text-neutral-300 cursor-pointer">
            <input
              type="checkbox"
              checked={stove.enabled}
              onChange={(e) => handleStoveChange({ enabled: e.target.checked })}
              className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
            />
            <span className="text-[11px] font-medium">{stove.enabled ? 'Aktif' : 'Nonaktif'}</span>
          </label>
        </div>

        {stove.enabled && (
          <div className="space-y-3.5">
            {/* Pilihan Model Resmi Produsen Kompor */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-neutral-300 font-semibold flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-amber-400" />
                Pilihan Model Resmi Produsen Kompor
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(Object.keys(STOVE_PRODUCER_PRESETS) as Exclude<StoveBrandModel, 'custom'>[]).map((key) => {
                  const item = STOVE_PRODUCER_PRESETS[key];
                  const isSelected = stove.brandModel === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleSelectStovePreset(key)}
                      className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                        isSelected
                          ? 'bg-amber-950/40 border-amber-500/80 text-white shadow-sm ring-1 ring-amber-500/40'
                          : 'bg-black/30 border-white/[0.06] hover:border-white/20 text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-white">{item.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-neutral-400 mt-0.5">
                        <span className="text-amber-300 font-medium">{item.brand} ({item.origin})</span>
                        <span>·</span>
                        <span className="font-mono">{item.width}×{item.length} cm</span>
                        <span>·</span>
                        <span className="font-mono text-emerald-400">Tanam {item.recessDepth}cm</span>
                      </div>
                    </button>
                  );
                })}

                <button
                  onClick={() => handleSelectStovePreset('custom')}
                  className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                    stove.brandModel === 'custom' || !stove.brandModel
                      ? 'bg-amber-950/40 border-amber-500/80 text-white shadow-sm ring-1 ring-amber-500/40'
                      : 'bg-black/30 border-white/[0.06] hover:border-white/20 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-white">Kustom Bebas (Custom Cooktop)</span>
                    {(stove.brandModel === 'custom' || !stove.brandModel) && (
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    Atur dimensi lebar, panjang, dan kedalaman ceruk tanam secara bebas.
                  </p>
                </button>
              </div>
            </div>

            {/* Slider Posisi Horizontal (X) */}
            <div className="bg-black/20 p-2.5 rounded-lg border border-white/5 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 text-neutral-300 text-[11px]">
                  <MoveHorizontal className="w-3.5 h-3.5 text-amber-400" />
                  Posisi Horizontal (X)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStoveChange({ posX: Math.max(Math.round(stove.width / 2 + 5), stove.posX - 5) })}
                    className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-neutral-300 text-[10px] font-mono cursor-pointer"
                  >
                    -5
                  </button>
                  <span className="font-mono font-bold text-amber-400 px-1">{stove.posX} cm</span>
                  <button
                    onClick={() => handleStoveChange({ posX: Math.min(Math.round(totalWidth - stove.width / 2 - 5), stove.posX + 5) })}
                    className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-neutral-300 text-[10px] font-mono cursor-pointer"
                  >
                    +5
                  </button>
                </div>
              </div>
              <input
                type="range"
                min={Math.round(stove.width / 2 + 5)}
                max={Math.round(totalWidth - stove.width / 2 - 5)}
                step={1}
                value={stove.posX}
                onChange={(e) => handleStoveChange({ posX: parseInt(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-800 rounded-full"
              />
            </div>

            {/* Slider Posisi Kedalaman (Y) */}
            <div className="bg-black/20 p-2.5 rounded-lg border border-white/5 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 text-neutral-300 text-[11px]">
                  <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
                  Posisi Kedalaman (Y)
                </span>
                <span className="font-mono font-bold text-amber-400">{stove.posY} cm</span>
              </div>
              <input
                type="range"
                min={Math.round(stove.length / 2 + 5)}
                max={Math.round(totalDepth - stove.length / 2 - 5)}
                step={1}
                value={stove.posY}
                onChange={(e) => handleStoveChange({ posY: parseInt(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-800 rounded-full"
              />
            </div>

            {/* Dimensi: Lebar, Panjang, Tebal Tanam */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-black/20 p-2 rounded-lg border border-white/5 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-neutral-400">Lebar (P)</span>
                  <span className="font-mono font-bold text-amber-400">{stove.width}cm</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={95}
                  step={1}
                  value={stove.width}
                  onChange={(e) => handleStoveChange({ width: parseInt(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer h-1 bg-neutral-800 rounded-full"
                />
              </div>

              <div className="bg-black/20 p-2 rounded-lg border border-white/5 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-neutral-400">Panjang (L)</span>
                  <span className="font-mono font-bold text-amber-400">{stove.length}cm</span>
                </div>
                <input
                  type="range"
                  min={32}
                  max={55}
                  step={1}
                  value={stove.length}
                  onChange={(e) => handleStoveChange({ length: parseInt(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer h-1 bg-neutral-800 rounded-full"
                />
              </div>

              <div className="bg-black/20 p-2 rounded-lg border border-white/5 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-neutral-400">Tebal Tanam</span>
                  <span className="font-mono font-bold text-emerald-400">{stove.recessDepth}cm</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={14}
                  step={1}
                  value={stove.recessDepth}
                  onChange={(e) => handleStoveChange({ recessDepth: parseInt(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer h-1 bg-neutral-800 rounded-full"
                />
              </div>
            </div>

            {/* Tipe Kompor & Kenop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Tipe Kompor Tanam</label>
                <select
                  value={stove.type}
                  onChange={(e) => handleStoveChange({ type: e.target.value as StoveType })}
                  className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="gas-2">Kompor Gas 2 Tungku (Populer)</option>
                  <option value="gas-3">Kompor Gas 3 Tungku (Chef)</option>
                  <option value="induction-2">Kompor Induksi 2 Zona Sentuh</option>
                  <option value="induction-4">Kompor Induksi 4 Zona Modern</option>
                  <option value="gas-1">Kompor 1 Tungku Ringkas</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Kontrol Fisik</label>
                <label className="flex items-center gap-2 px-2.5 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-neutral-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stove.hasKnobs}
                    onChange={(e) => handleStoveChange({ hasKnobs: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                  />
                  <span className="text-[11px]">Kenop Putar Logam (Knobs)</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
