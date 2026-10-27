import React, { useState } from 'react';
import {
  KitchenConfig,
  CountertopMaterial,
  CabinetFinish,
  FrameMaterial,
  FrameSupport,
  FrameSupportType,
  HandleStyle,
  AmbientTemperature,
  MATERIAL_LABELS,
  CABINET_FINISH_LABELS,
  FRAME_MATERIAL_LABELS,
  FjlSpecies,
} from '../types/kitchen';
import { FRAME_PAINT_COLORS, FJL_SPECIES } from '../utils/finishes';
import { HplPicker } from './HplPicker';
import {
  Palette,
  Check,
  Layers,
  Sparkles,
  Eye,
  Sliders,
  Flame,
  Droplets,
  Shield,
  Lightbulb,
  Plus,
  Trash2,
  Wrench,
  Sun,
  Moon,
} from 'lucide-react';

interface Props {
  config: KitchenConfig;
  onChange: (updated: Partial<KitchenConfig>) => void;
  onOpenFrameEditor?: () => void;
}

export const MaterialControls: React.FC<Props> = ({ config, onChange, onOpenFrameEditor }) => {
  const {
    countertopMaterial,
    customCountertopColor,
    cabinetFinish,
    customCabinetColor,
    frame = {
      material: 'hollow-steel-black',
      tubeSize: 40,
      customColor: '#1e2124',
      customRoughness: 0.35,
      customMetalness: 0.85,
      supports: [],
    },
    handleStyle,
    lighting = {
      ledStripEnabled: true,
      ledStripColor: '#ffc87a',
      ledStripBrightness: 85,
      ledStripPosition: 'both',
      ambientTemperature: 'warm',
      ambientIntensity: 1.0,
    },
    showFrameOnly,
  } = config;

  const handleStyles: { id: HandleStyle; name: string; desc: string }[] = [
    { id: 'profile-j', name: 'Profil J Tersembunyi', desc: 'Minimalis modern tanpa tonjolan pegangan' },
    { id: 'bar-black', name: 'Batang Hitam Matte', desc: 'Aksen kontras modern industrial' },
    { id: 'bar-gold', name: 'Batang Kuningan Emas', desc: 'Mewah elegan aksen gold brass' },
    { id: 'edge-pull', name: 'Edge Pull Aluminium', desc: 'Tipis menjepit tepi atas laci' },
    { id: 'knob-minimal', name: 'Knob Bulat Minimalis', desc: 'Simpel kontemporer' },
  ];

  const ledColorPresets = [
    { name: 'Warm Amber 3000K', hex: '#ffc87a' },
    { name: 'Natural White 4000K', hex: '#ffffff' },
    { name: 'Cool Ice 6500K', hex: '#d0e4ff' },
    { name: 'Sunset Golden', hex: '#ff9e3b' },
    { name: 'Modern Cyan', hex: '#38bdf8' },
  ];

  const ambientPresets: { id: AmbientTemperature; name: string; desc: string; icon: string }[] = [
    { id: 'warm', name: 'Warm White (3000K)', desc: 'Nuansa hangat nyaman & elegan', icon: '☀️' },
    { id: 'natural', name: 'Natural Daylight (4000K)', desc: 'Terang netral, warna material akurat', icon: '🌤️' },
    { id: 'cool', name: 'Cool White (6500K)', desc: 'Modern kontemporer benderang', icon: '❄️' },
    { id: 'evening-mood', name: 'Showroom Malam (Mood)', desc: 'Latar gelap dramatis dengan kilau LED mewah', icon: '🌙' },
  ];

  const { totalWidth, totalDepth, totalHeight } = config;

  // Frame supports state
  const supports: FrameSupport[] = frame.supports || [];
  const sinkSupport = supports.find((s: FrameSupport) => s.type === 'sink-cradle');
  const stoveSupport = supports.find((s: FrameSupport) => s.type === 'stove-cradle');
  const customSupportsList = supports.filter((s: FrameSupport) => s.type !== 'sink-cradle' && s.type !== 'stove-cradle');

  const [isAddingCustomSupport, setIsAddingCustomSupport] = useState(false);
  const [newSuppType, setNewSuppType] = useState<FrameSupportType>('crossbeam-x');
  const [newSuppName, setNewSuppName] = useState('Besi Palang Tambahan');
  const [newSuppX, setNewSuppX] = useState(Math.round(totalWidth / 2));
  const [newSuppY, setNewSuppY] = useState(Math.round(totalHeight / 2));
  const [newSuppZ, setNewSuppZ] = useState(Math.round(totalDepth / 2));
  const [newSuppLen, setNewSuppLen] = useState(60);

  const handleToggleSinkCradle = (enabled: boolean) => {
    let next: FrameSupport[];
    if (sinkSupport) {
      next = supports.map((s: FrameSupport) => (s.type === 'sink-cradle' ? { ...s, enabled } : s));
    } else {
      next = [
        ...supports,
        {
          id: `supp-sink-${Date.now()}`,
          name: 'Besi Penyangga Wastafel',
          type: 'sink-cradle',
          posX: config.sink.posX,
          posY: Math.round(totalHeight - config.sink.bowlDepth - (frame.tubeSize || 40) / 10),
          posZ: config.sink.posY,
          length: config.sink.width + 8,
          tubeSize: frame.tubeSize || 40,
          enabled,
        },
      ];
    }
    onChange({ frame: { ...frame, supports: next } });
  };

  const handleToggleStoveCradle = (enabled: boolean) => {
    let next: FrameSupport[];
    if (stoveSupport) {
      next = supports.map((s: FrameSupport) => (s.type === 'stove-cradle' ? { ...s, enabled } : s));
    } else {
      next = [
        ...supports,
        {
          id: `supp-stove-${Date.now()}`,
          name: 'Besi Penyangga Kompor',
          type: 'stove-cradle',
          posX: config.stove.posX,
          posY: Math.round(totalHeight - config.stove.recessDepth - (frame.tubeSize || 40) / 10),
          posZ: config.stove.posY,
          length: config.stove.width + 8,
          tubeSize: frame.tubeSize || 40,
          enabled,
        },
      ];
    }
    onChange({ frame: { ...frame, supports: next } });
  };

  const handleAddCustomSupport = () => {
    const newSupportItem: FrameSupport = {
      id: `supp-custom-${Date.now()}`,
      name: newSuppName.trim() || `Batang Penyangga ${newSuppType}`,
      type: newSuppType,
      posX: newSuppX,
      posY: newSuppY,
      posZ: newSuppZ,
      length: newSuppLen,
      tubeSize: frame.tubeSize || 40,
      enabled: true,
    };

    onChange({ frame: { ...frame, supports: [...supports, newSupportItem] } });
    setIsAddingCustomSupport(false);
    setNewSuppName('Besi Palang Tambahan');
  };

  const handleDeleteCustomSupport = (id: string) => {
    onChange({ frame: { ...frame, supports: supports.filter((s: FrameSupport) => s.id !== id) } });
  };

  const handleToggleCustomSupport = (id: string) => {
    onChange({
      frame: {
        ...frame,
        supports: supports.map((s: FrameSupport) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
      },
    });
  };

  return (
    <div className="space-y-4 text-neutral-200 select-none">
      {/* 1. SKELETON INSPECTION VIEW BANNER */}
      <div className="p-3.5 bg-gradient-to-r from-amber-950/40 via-neutral-900 to-neutral-900 border border-amber-500/30 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-xs text-white">Inspeksi Rangka Struktur (Skeleton)</h3>
              <p className="text-[10px] text-neutral-400">Lihat rangka hollow tanpa laci & pintu kabinet</p>
            </div>
          </div>
          <button
            onClick={() => onChange({ showFrameOnly: !showFrameOnly })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              showFrameOnly
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20 font-bold'
                : 'bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10'
            }`}
          >
            {showFrameOnly ? 'RANGKA AKTIF' : 'LIHAT RANGKA'}
          </button>
        </div>
      </div>

      {/* 2. JENIS MATERIAL RANGKA MEJA */}
      <div className="p-3.5 bg-[#12151c]/90 border border-white/[0.08] rounded-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <h3 className="font-semibold text-xs text-white">Material Rangka Utama</h3>
          </div>
          <span className="text-[11px] font-mono text-amber-400 font-semibold">
            {frame.material.startsWith('hollow') ? `${frame.tubeSize}×${frame.tubeSize} mm` : 'Struktur Kayu'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(Object.keys(FRAME_MATERIAL_LABELS) as FrameMaterial[]).map((matKey) => {
            const item = FRAME_MATERIAL_LABELS[matKey];
            const isSelected = frame.material === matKey;

            return (
              <button
                key={matKey}
                onClick={() => onChange({ frame: { ...frame, material: matKey } })}
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition cursor-pointer ${
                  isSelected
                    ? 'bg-amber-950/30 border-amber-500/80 text-white shadow-sm ring-1 ring-amber-500/30'
                    : 'bg-black/30 border-white/[0.06] hover:border-white/20 text-neutral-300'
                }`}
              >
                <div
                  className="w-7 h-7 rounded-lg shrink-0 border border-white/20 shadow-inner flex items-center justify-center font-bold text-xs"
                  style={{ backgroundColor: item.color }}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <div>
                  <p className="font-semibold text-xs text-white">{item.name}</p>
                  <p className="text-[10px] text-neutral-400 line-clamp-1">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Hollow Tube Size Selector */}
        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
          <span className="text-xs text-neutral-300">Dimensi Profil Pipa Hollow:</span>
          <div className="flex items-center gap-1.5">
            {[30, 40, 50].map((size) => (
              <button
                key={size}
                onClick={() => onChange({ frame: { ...frame, tubeSize: size } })}
                className={`px-2.5 py-1 rounded-md text-xs font-mono transition cursor-pointer ${
                  frame.tubeSize === size
                    ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                    : 'bg-white/5 text-neutral-400 hover:text-white border border-white/10'
                }`}
              >
                {size}×{size} mm
              </button>
            ))}
          </div>
        </div>

        {/* Warna Cat / Powder Coating Rangka */}
        <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-300">Warna Cat Rangka (Powder Coating):</span>
            <span className="text-[10px] font-mono text-neutral-400">
              {frame.paintColor
                ? FRAME_PAINT_COLORS.find((c) => c.hex.toLowerCase() === frame.paintColor!.toLowerCase())?.name || frame.paintColor
                : 'Bawaan material'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => onChange({ frame: { ...frame, paintColor: null } })}
              className={`h-6 px-2 rounded-md text-[10px] border transition cursor-pointer ${
                !frame.paintColor ? 'border-amber-400 text-white bg-white/10' : 'border-white/15 text-neutral-400 hover:text-white'
              }`}
              title="Pakai warna asli material (tanpa cat)"
            >
              Bawaan
            </button>
            {FRAME_PAINT_COLORS.map((c) => {
              const isSel = frame.paintColor?.toLowerCase() === c.hex.toLowerCase();
              return (
                <button
                  key={c.hex}
                  onClick={() => onChange({ frame: { ...frame, paintColor: c.hex } })}
                  title={c.name}
                  className={`w-6 h-6 rounded-md border transition cursor-pointer flex items-center justify-center ${
                    isSel ? 'border-white ring-2 ring-amber-400/70' : 'border-white/20 hover:border-white/60'
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {isSel && <Check className="w-3 h-3 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]" />}
                </button>
              );
            })}
            <label
              className="h-6 px-1.5 rounded-md border border-white/15 flex items-center gap-1 text-[10px] text-neutral-400 hover:text-white cursor-pointer"
              title="Warna bebas"
            >
              <input
                type="color"
                value={frame.paintColor || '#1b1c1f'}
                onChange={(e) => onChange({ frame: { ...frame, paintColor: e.target.value } })}
                className="w-4 h-4 bg-transparent border-0 cursor-pointer"
              />
              Lainnya
            </label>
          </div>
        </div>

        {/* Custom Frame Color Picker */}
        {frame.material === 'custom' && (
          <div className="p-2.5 bg-black/40 rounded-lg border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-300">Warna Rangka Kustom:</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={frame.customColor || '#1e2124'}
                  onChange={(e) => onChange({ frame: { ...frame, customColor: e.target.value } })}
                  className="w-6 h-6 rounded border border-white/20 bg-transparent cursor-pointer"
                />
                <span className="font-mono text-neutral-400 text-xs">{frame.customColor}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-neutral-400">
                <span>Kilau Logam (Metalness)</span>
                <span className="font-mono">{Math.round((frame.customMetalness ?? 0.8) * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={frame.customMetalness ?? 0.8}
                onChange={(e) => onChange({ frame: { ...frame, customMetalness: parseFloat(e.target.value) } })}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-800 rounded-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. BESI PENYANGGA WASTAFEL, KOMPOR & RANGKA KUSTOM */}
      <div className="p-3.5 bg-[#12151c]/90 border border-white/[0.08] rounded-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-400" />
            <div>
              <h3 className="font-semibold text-xs text-white">Besi Penyangga Khusus (Cradle)</h3>
              <p className="text-[10px] text-neutral-400">Palang penahan beban kompor & bak wastafel</p>
            </div>
          </div>
          <button
            onClick={() => setIsAddingCustomSupport(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-white/10 text-amber-300 text-[11px] font-medium rounded-lg border border-amber-500/30 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Rangka</span>
          </button>
        </div>

        {/* Editor rangka 2D */}
        <div
          className={`p-2.5 rounded-lg border text-[11px] flex items-center justify-between gap-2 ${
            frame.customLayout ? 'bg-amber-950/30 border-amber-500/40 text-amber-200' : 'bg-black/30 border-white/5 text-neutral-400'
          }`}
        >
          <span>
            {frame.customLayout
              ? 'Rangka sedang diedit manual di Editor Rangka 2D. Pengaturan penyangga di bawah tidak berlaku sampai rangka di-reset ke otomatis.'
              : 'Rangka dibuat otomatis mengikuti modul. Buka editor untuk menambah, mengurangi, atau memindah batang.'}
          </span>
          {onOpenFrameEditor && (
            <button
              onClick={onOpenFrameEditor}
              className="shrink-0 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-[11px] font-bold rounded-md cursor-pointer"
            >
              Editor Rangka 2D
            </button>
          )}
        </div>

        {/* Toggle Besi Penyangga Wastafel */}
        <div className="p-2.5 bg-black/30 border border-white/5 rounded-lg space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="w-3.5 h-3.5 text-blue-400" />
              <div>
                <p className="font-semibold text-xs text-white">Besi Penyangga Wastafel (Sink Cradle)</p>
                <p className="text-[10px] text-neutral-400">
                  Palang samping kiri-kanan & strap bawah menopang dasar bak tanpa menembus
                </p>
              </div>
            </div>
            <label className="flex items-center gap-1.5 text-xs text-neutral-300 cursor-pointer">
              <input
                type="checkbox"
                checked={sinkSupport ? sinkSupport.enabled : true}
                onChange={(e) => handleToggleSinkCradle(e.target.checked)}
                className="w-4 h-4 rounded text-blue-500 accent-blue-500 cursor-pointer"
              />
              <span className="text-[11px] font-medium">Aktif</span>
            </label>
          </div>
          {config.sink.enabled && (
            <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1 border-t border-white/5 font-mono">
              <span>Titik As Wastafel: X = {config.sink.posX} cm</span>
              <span className="text-emerald-400">Kedalaman Bak: {config.sink.bowlDepth} cm</span>
            </div>
          )}
        </div>

        {/* Toggle Besi Penyangga Kompor */}
        <div className="p-2.5 bg-black/30 border border-white/5 rounded-lg space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <div>
                <p className="font-semibold text-xs text-white">Besi Penyangga Kompor (Stove Crossbars)</p>
                <p className="text-[10px] text-neutral-400">
                  Gelagar heavy-duty penahan beban kompor & wajan masak
                </p>
              </div>
            </div>
            <label className="flex items-center gap-1.5 text-xs text-neutral-300 cursor-pointer">
              <input
                type="checkbox"
                checked={stoveSupport ? stoveSupport.enabled : true}
                onChange={(e) => handleToggleStoveCradle(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
              />
              <span className="text-[11px] font-medium">Aktif</span>
            </label>
          </div>
          {config.stove.enabled && (
            <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1 border-t border-white/5 font-mono">
              <span>Titik As Kompor: X = {config.stove.posX} cm</span>
              <span className="text-amber-400">Tebal Mesin: {config.stove.recessDepth} cm</span>
            </div>
          )}
        </div>

        {/* Form Tambah Batang Kustom */}
        {isAddingCustomSupport && (
          <div className="p-3 bg-neutral-900 border border-amber-500/50 rounded-lg space-y-2.5 animate-in fade-in">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Tambah Batang Penyangga Kustom
              </span>
              <button
                onClick={() => setIsAddingCustomSupport(false)}
                className="text-neutral-400 hover:text-white text-xs cursor-pointer"
              >
                Batal
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Nama / Label Batang</label>
                <input
                  type="text"
                  value={newSuppName}
                  onChange={(e) => setNewSuppName(e.target.value)}
                  placeholder="Misal: Penahan Rak Bawah, Palang Tengah"
                  className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded-lg text-neutral-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-neutral-400 block mb-1">Tipe Orientasi</label>
                  <select
                    value={newSuppType}
                    onChange={(e) => setNewSuppType(e.target.value as FrameSupportType)}
                    className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded-lg text-neutral-100 text-xs"
                  >
                    <option value="crossbeam-x">Palang Horisontal X (Panjang)</option>
                    <option value="crossbeam-z">Palang Horisontal Z (Dalam)</option>
                    <option value="vertical-post">Tiang Vertikal Y</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-neutral-400 block mb-1">Panjang Batang (cm)</label>
                  <input
                    type="number"
                    min={10}
                    max={totalWidth}
                    value={newSuppLen}
                    onChange={(e) => setNewSuppLen(parseInt(e.target.value) || 10)}
                    className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded-lg text-neutral-100 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <div>
                  <div className="flex justify-between text-[10px] text-neutral-400 mb-0.5">
                    <span>Pos X</span>
                    <span className="font-mono text-amber-300">{newSuppX}cm</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={totalWidth}
                    value={newSuppX}
                    onChange={(e) => setNewSuppX(parseInt(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-1 bg-neutral-800 rounded-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-neutral-400 mb-0.5">
                    <span>Pos Y (Tinggi)</span>
                    <span className="font-mono text-amber-300">{newSuppY}cm</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={totalHeight}
                    value={newSuppY}
                    onChange={(e) => setNewSuppY(parseInt(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-1 bg-neutral-800 rounded-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-neutral-400 mb-0.5">
                    <span>Pos Z (Dalam)</span>
                    <span className="font-mono text-amber-300">{newSuppZ}cm</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={totalDepth}
                    value={newSuppZ}
                    onChange={(e) => setNewSuppZ(parseInt(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-1 bg-neutral-800 rounded-full"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsAddingCustomSupport(false)}
                  className="px-3 py-1 rounded-md bg-white/5 text-neutral-400 hover:text-white cursor-pointer text-xs"
                >
                  Batal
                </button>
                <button
                  onClick={handleAddCustomSupport}
                  className="px-3.5 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold transition shadow cursor-pointer text-xs"
                >
                  Tambahkan ke Rangka
                </button>
              </div>
            </div>
          </div>
        )}

        {/* List of Custom Supports Added */}
        {customSupportsList.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] text-neutral-400 font-semibold block">
              Daftar Batang Kustom ({customSupportsList.length}):
            </span>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {customSupportsList.map((item: FrameSupport) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 bg-black/30 rounded-lg border border-white/5 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={() => handleToggleCustomSupport(item.id)}
                      className="w-3.5 h-3.5 rounded accent-amber-500 cursor-pointer"
                    />
                    <div>
                      <p className="font-medium text-white text-xs">{item.name}</p>
                      <p className="text-[10px] text-neutral-400 font-mono">
                        L: {item.length || 60} cm · X:{item.posX} Y:{item.posY} Z:{item.posZ ?? 30}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteCustomSupport(item.id)}
                    className="p-1 text-neutral-500 hover:text-rose-400 transition cursor-pointer"
                    title="Hapus Batang Penyangga"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. MATERIAL TOP TABLE MEJA */}
      <div className="p-3.5 bg-[#12151c]/90 border border-white/[0.08] rounded-xl space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-white/[0.08]">
          <Layers className="w-4 h-4 text-purple-400" />
          <h3 className="font-semibold text-xs text-white">Material Top Table (Meja Atas)</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(Object.keys(MATERIAL_LABELS) as CountertopMaterial[]).map((matKey) => {
            const item = MATERIAL_LABELS[matKey];
            const isSelected = countertopMaterial === matKey;

            return (
              <button
                key={matKey}
                onClick={() => onChange({ countertopMaterial: matKey })}
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition cursor-pointer ${
                  isSelected
                    ? 'bg-purple-950/30 border-purple-500/80 text-white shadow-sm ring-1 ring-purple-500/30'
                    : 'bg-black/30 border-white/[0.06] hover:border-white/20 text-neutral-300'
                }`}
              >
                <div
                  className="w-7 h-7 rounded-lg shrink-0 border border-white/20 shadow-inner flex items-center justify-center"
                  style={{
                    backgroundColor: matKey === 'custom' ? (customCountertopColor || '#8b5cf6') : item.color,
                  }}
                >
                  {isSelected && (
                    <Check
                      className={`w-3.5 h-3.5 ${
                        matKey === 'marble-white' || matKey === 'terrazzo-white'
                          ? 'text-neutral-900 font-bold'
                          : 'text-white'
                      }`}
                    />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-xs text-white">{item.name}</p>
                  <p className="text-[10px] text-neutral-400 line-clamp-1">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {countertopMaterial === 'custom' && (
          <div className="p-2.5 bg-black/40 rounded-lg border border-white/10 flex items-center justify-between text-xs">
            <span className="text-neutral-300">Warna Hex Kustom:</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={customCountertopColor || '#1c1d21'}
                onChange={(e) => onChange({ customCountertopColor: e.target.value })}
                className="w-6 h-6 rounded border border-white/20 bg-transparent cursor-pointer"
              />
              <span className="font-mono text-neutral-400">{customCountertopColor || '#1c1d21'}</span>
            </div>
          </div>
        )}

        {countertopMaterial === 'hpl' && (
          <HplPicker
            title="Pilih HPL Top Table"
            value={config.countertopHpl}
            onChange={(sel) => onChange({ countertopHpl: sel })}
          />
        )}

        {countertopMaterial === 'wood-fjl' && (
          <div className="p-2.5 bg-black/40 rounded-lg border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-neutral-200">Jenis Kayu FJL</span>
              <span className="text-[10px] text-neutral-500">Papan sambung jari (finger joint) laminasi</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(FJL_SPECIES) as FjlSpecies[]).map((sp) => {
                const item = FJL_SPECIES[sp];
                const isSel = (config.countertopFjl?.species || 'jati') === sp;
                return (
                  <button
                    key={sp}
                    onClick={() => onChange({ countertopFjl: { species: sp, coat: config.countertopFjl?.coat || 'doff' } })}
                    className={`flex items-center gap-2 p-1.5 rounded-md border text-left transition cursor-pointer ${
                      isSel ? 'bg-purple-950/30 border-purple-500/80' : 'bg-black/30 border-white/[0.06] hover:border-white/20'
                    }`}
                  >
                    <span
                      className="w-6 h-6 rounded shrink-0 border border-white/20"
                      style={{
                        background: `repeating-linear-gradient(0deg, ${item.base} 0 5px, ${item.light} 5px 9px, ${item.dark} 9px 11px)`,
                      }}
                    />
                    <span>
                      <span className="block text-[11px] font-semibold text-white">{item.name}</span>
                      <span className="block text-[9px] text-neutral-400 line-clamp-1">{item.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-white/5">
              <span className="text-[10px] text-neutral-400">Finishing coating:</span>
              <div className="flex gap-1">
                {(['doff', 'glossy'] as const).map((coat) => (
                  <button
                    key={coat}
                    onClick={() => onChange({ countertopFjl: { species: config.countertopFjl?.species || 'jati', coat } })}
                    className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${
                      (config.countertopFjl?.coat || 'doff') === coat ? 'bg-amber-500 text-neutral-950 font-bold' : 'bg-white/5 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {coat === 'doff' ? 'Doff (Natural)' : 'Glossy'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. FINISHING KABINET & MUKA LACI */}
      <div className="p-3.5 bg-[#12151c]/90 border border-white/[0.08] rounded-xl space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-white/[0.08]">
          <Palette className="w-4 h-4 text-emerald-400" />
          <h3 className="font-semibold text-xs text-white">Finishing Kabinet & Muka Laci (HPL / Duco)</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(Object.keys(CABINET_FINISH_LABELS) as CabinetFinish[]).map((finishKey) => {
            const item = CABINET_FINISH_LABELS[finishKey];
            const isSelected = cabinetFinish === finishKey;

            return (
              <button
                key={finishKey}
                onClick={() => onChange({ cabinetFinish: finishKey })}
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-950/30 border-emerald-500/80 text-white shadow-sm ring-1 ring-emerald-500/30'
                    : 'bg-black/30 border-white/[0.06] hover:border-white/20 text-neutral-300'
                }`}
              >
                <div
                  className="w-7 h-7 rounded-lg shrink-0 border border-white/20 shadow-inner flex items-center justify-center"
                  style={{
                    backgroundColor: finishKey === 'custom' ? (customCabinetColor || '#10b981') : item.color,
                  }}
                >
                  {isSelected && (
                    <Check
                      className={`w-3.5 h-3.5 ${
                        finishKey === 'white-gloss' ? 'text-neutral-900 font-bold' : 'text-white'
                      }`}
                    />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-xs text-white">{item.name}</p>
                  <p className="text-[10px] text-neutral-400 line-clamp-1">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {cabinetFinish === 'custom' && (
          <div className="p-2.5 bg-black/40 rounded-lg border border-white/10 flex items-center justify-between text-xs">
            <span className="text-neutral-300">Warna Kabinet Kustom:</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={customCabinetColor || '#c49a6c'}
                onChange={(e) => onChange({ customCabinetColor: e.target.value })}
                className="w-6 h-6 rounded border border-white/20 bg-transparent cursor-pointer"
              />
              <span className="font-mono text-neutral-400">{customCabinetColor || '#c49a6c'}</span>
            </div>
          </div>
        )}

        {cabinetFinish === 'hpl' && (
          <HplPicker
            title="Pilih HPL Muka Laci, Pintu & Panel Samping"
            value={config.cabinetHpl}
            onChange={(sel) => onChange({ cabinetHpl: sel })}
          />
        )}
      </div>

      {/* 6. LIGHTING & SUHU AMBIENT CAHAYA */}
      <div className="p-3.5 bg-[#12151c]/90 border border-white/[0.08] rounded-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <h3 className="font-semibold text-xs text-white">Pencahayaan & Suasana Ruangan (Lighting)</h3>
          </div>
          <label className="flex items-center gap-1.5 text-xs text-neutral-300 cursor-pointer">
            <input
              type="checkbox"
              checked={lighting.ledStripEnabled}
              onChange={(e) =>
                onChange({
                  lighting: { ...lighting, ledStripEnabled: e.target.checked },
                })
              }
              className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
            />
            <span className="text-[11px] font-medium">LED Strip</span>
          </label>
        </div>

        {/* Ambient Temperature Presets */}
        <div className="space-y-1.5">
          <span className="text-[11px] text-neutral-300 font-medium block">Suhu Cahaya Ruangan Dapur:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ambientPresets.map((amb) => {
              const isSelected = lighting.ambientTemperature === amb.id;
              return (
                <button
                  key={amb.id}
                  onClick={() =>
                    onChange({
                      lighting: { ...lighting, ambientTemperature: amb.id },
                    })
                  }
                  className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                    isSelected
                      ? 'bg-amber-950/30 border-amber-500/80 text-white shadow-sm ring-1 ring-amber-500/30'
                      : 'bg-black/30 border-white/[0.06] hover:border-white/20 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <span>{amb.icon}</span> {amb.name}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-0.5 line-clamp-1">{amb.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* LED Strip Configuration */}
        {lighting.ledStripEnabled && (
          <div className="p-2.5 bg-black/40 rounded-lg border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] text-neutral-300 font-semibold">Posisi Lampu LED:</span>
              <div className="flex items-center gap-1">
                {[
                  { id: 'under-counter', label: 'Bawah Meja' },
                  { id: 'under-plinth', label: 'Kaki (Plinth)' },
                  { id: 'both', label: 'Keduanya' },
                ].map((pos) => (
                  <button
                    key={pos.id}
                    onClick={() =>
                      onChange({
                        lighting: {
                          ...lighting,
                          ledStripPosition: pos.id as 'under-counter' | 'under-plinth' | 'both',
                        },
                      })
                    }
                    className={`px-2 py-1 rounded text-[11px] transition cursor-pointer ${
                      lighting.ledStripPosition === pos.id
                        ? 'bg-amber-500 text-neutral-950 font-bold'
                        : 'bg-white/5 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* LED Color Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {ledColorPresets.map((preset) => (
                <button
                  key={preset.hex}
                  onClick={() =>
                    onChange({
                      lighting: { ...lighting, ledStripColor: preset.hex },
                    })
                  }
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] border transition cursor-pointer ${
                    lighting.ledStripColor === preset.hex
                      ? 'border-amber-400 bg-white/10 text-white font-medium'
                      : 'border-white/10 bg-black/30 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-white/30"
                    style={{ backgroundColor: preset.hex }}
                  />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 7. MODEL HANDLE HARDWARE */}
      <div className="p-3.5 bg-[#12151c]/90 border border-white/[0.08] rounded-xl space-y-2.5">
        <div className="flex items-center gap-2 pb-2 border-b border-white/[0.08]">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="font-semibold text-xs text-white">Model Pegangan / Handle Hardware</h3>
        </div>

        <div className="space-y-1.5">
          {handleStyles.map((item) => {
            const isSelected = handleStyle === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onChange({ handleStyle: item.id })}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition cursor-pointer ${
                  isSelected
                    ? 'bg-amber-950/30 border-amber-500/80 text-white shadow-sm ring-1 ring-amber-500/30'
                    : 'bg-black/30 border-white/[0.06] hover:border-white/20 text-neutral-300'
                }`}
              >
                <div>
                  <p className="font-semibold text-xs text-white">{item.name}</p>
                  <p className="text-[10px] text-neutral-400">{item.desc}</p>
                </div>
                {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
