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
      <div className="bg-white border border-stone-300 rounded-2xl max-w-2xl w-full max-h-[90dvh] overflow-y-auto p-4 sm:p-6 shadow-2xl relative space-y-5 text-stone-900">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="text-base font-bold text-stone-900">Preset Template Meja Dapur Siap Pakai</h3>
              <p className="text-xs text-stone-500">Pilih tata letak standar yang sudah dioptimalkan untuk ukuran dapur Anda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition"
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
                    ? 'bg-stone-100 border-amber-500 shadow-md shadow-amber-500/10'
                    : 'bg-stone-100 border-stone-200 hover:border-stone-300 hover:bg-stone-100'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-sm text-stone-900 group-hover:text-amber-700 transition-colors">
                    {preset.name}
                  </h4>
                  {isCurrent && <Check className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
                </div>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-amber-600/90 border border-stone-300">
                  {preset.tagline}
                </span>
                <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                  {preset.description}
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] font-mono text-stone-500">
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
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium rounded-xl transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
