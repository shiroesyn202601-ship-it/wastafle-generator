import React from 'react';
import { KitchenPreset, KITCHEN_PRESETS, KitchenConfig } from '../types/kitchen';
import { LayoutGrid, Sparkles, X, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: KitchenPreset) => void;
  currentPresetId?: string;
}

export const PresetModal: React.FC<Props> = ({ isOpen, onClose, onSelectPreset, currentPresetId }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl max-w-2xl w-full max-h-[90dvh] overflow-y-auto p-4 sm:p-6 shadow-2xl relative space-y-5 text-neutral-100">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white">Preset Template Meja Dapur Siap Pakai</h3>
              <p className="text-xs text-neutral-400">Pilih tata letak standar yang sudah dioptimalkan untuk ukuran dapur Anda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {KITCHEN_PRESETS.map((preset) => {
            const isCurrent = currentPresetId === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => {
                  onSelectPreset(preset);
                  onClose();
                }}
                className={`p-4 rounded-xl border text-left cursor-pointer transition relative group ${
                  isCurrent
                    ? 'bg-neutral-800 border-amber-500 shadow-md shadow-amber-500/10'
                    : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-600 hover:bg-neutral-800/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
                    {preset.name}
                  </h4>
                  {isCurrent && <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                </div>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-800 text-amber-400/90 border border-neutral-700/60">
                  {preset.tagline}
                </span>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                  {preset.description}
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] font-mono text-neutral-400">
                  <span>Panjang: {preset.config.totalWidth} cm</span>
                  <span>•</span>
                  <span>{preset.config.columns?.length} Kolom</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-xl transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
