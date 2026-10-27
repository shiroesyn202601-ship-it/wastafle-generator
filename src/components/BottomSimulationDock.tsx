import React, { useState } from 'react';
import { KitchenConfig } from '../types/kitchen';
import {
  ChevronDown,
  ChevronUp,
  Eye,
  Ruler,
  ShieldCheck,
  DoorOpen,
  Sparkles,
  Layers,
  Box,
} from 'lucide-react';

interface Props {
  config: KitchenConfig;
  onChange: (updated: Partial<KitchenConfig>) => void;
}

export const BottomSimulationDock: React.FC<Props> = ({ config, onChange }) => {
  // Di layar kecil dock tertutup dulu agar tampilan 3D tidak tertutup
  const [collapsed, setCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);

  const {
    drawersOpenPercent,
    doorsOpenPercent,
    showXRayWireframe,
    showDimensions3D,
    showSafetyClearance,
    showFrameOnly,
  } = config;

  const isAnyOpen = drawersOpenPercent > 0 || doorsOpenPercent > 0;

  return (
    <div
      className={`fixed z-30 transition-all duration-300 ease-out left-1/2 -translate-x-1/2 ${
        collapsed ? 'bottom-16 lg:bottom-2' : 'bottom-16 lg:bottom-4'
      } max-w-4xl w-[96vw] lg:w-[94vw] select-none`}
    >
      {/* Sleek Collapse / Expand Trigger */}
      <div className="flex justify-center">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-1.5 px-3.5 py-1 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white text-[11px] font-medium rounded-t-xl border-t border-x border-white/10 shadow-lg backdrop-blur-md transition-all cursor-pointer"
        >
          {collapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulasi Animasi & Tampilan 3D</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              <span>Sembunyikan Dock</span>
            </>
          )}
        </button>
      </div>

      {/* Main Dock Body */}
      {!collapsed && (
        <div className="bg-neutral-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 sm:p-3.5 shadow-2xl text-neutral-200 max-h-[45dvh] overflow-y-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 items-center">
            {/* 1. Tarik Laci Keluar */}
            <div className="bg-neutral-950/70 p-2.5 rounded-xl border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-neutral-300 font-medium text-[11px]">
                  <DoorOpen className="w-3.5 h-3.5 text-amber-400" />
                  Buka Laci
                </span>
                <span className="font-mono text-xs font-semibold text-amber-400">
                  {drawersOpenPercent}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={drawersOpenPercent}
                onChange={(e) => onChange({ drawersOpenPercent: parseInt(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-800 rounded-full"
              />
              <div className="flex justify-between text-[10px] text-neutral-500 pt-0.5">
                <button
                  onClick={() => onChange({ drawersOpenPercent: 0 })}
                  className="hover:text-neutral-300 transition-colors"
                >
                  Tutup
                </button>
                <button
                  onClick={() => onChange({ drawersOpenPercent: 50 })}
                  className="hover:text-neutral-300 transition-colors"
                >
                  50%
                </button>
                <button
                  onClick={() => onChange({ drawersOpenPercent: 100 })}
                  className="hover:text-amber-400 transition-colors"
                >
                  Penuh
                </button>
              </div>
            </div>

            {/* 2. Buka Pintu Kabinet */}
            <div className="bg-neutral-950/70 p-2.5 rounded-xl border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-neutral-300 font-medium text-[11px]">
                  <DoorOpen className="w-3.5 h-3.5 text-emerald-400" />
                  Buka Pintu
                </span>
                <span className="font-mono text-xs font-semibold text-emerald-400">
                  {doorsOpenPercent}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={doorsOpenPercent}
                onChange={(e) => onChange({ doorsOpenPercent: parseInt(e.target.value) })}
                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-neutral-800 rounded-full"
              />
              <div className="flex justify-between text-[10px] text-neutral-500 pt-0.5">
                <button
                  onClick={() => onChange({ doorsOpenPercent: 0 })}
                  className="hover:text-neutral-300 transition-colors"
                >
                  Rapat
                </button>
                <button
                  onClick={() => onChange({ doorsOpenPercent: 50 })}
                  className="hover:text-neutral-300 transition-colors"
                >
                  50%
                </button>
                <button
                  onClick={() => onChange({ doorsOpenPercent: 100 })}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Terbuka
                </button>
              </div>
            </div>

            {/* 3. Toggles: Rangka Saja & Garis Ukuran 3D */}
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => onChange({ showFrameOnly: !showFrameOnly })}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  showFrameOnly
                    ? 'bg-amber-500/20 border border-amber-500/60 text-amber-300 shadow-sm shadow-amber-500/10'
                    : 'bg-neutral-950/70 border border-white/5 text-neutral-300 hover:border-white/20 hover:text-white'
                }`}
                title="Tampilkan hanya struktur rangka besi hollow (sembunyikan panel & laci)"
              >
                <span className="flex items-center gap-2 text-[11px]">
                  <Box className="w-3.5 h-3.5 text-amber-400" />
                  Hanya Rangka
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5">
                  {showFrameOnly ? 'ON' : 'OFF'}
                </span>
              </button>

              <button
                onClick={() => onChange({ showDimensions3D: !showDimensions3D })}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  showDimensions3D
                    ? 'bg-blue-500/20 border border-blue-500/60 text-blue-300 shadow-sm shadow-blue-500/10'
                    : 'bg-neutral-950/70 border border-white/5 text-neutral-300 hover:border-white/20 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2 text-[11px]">
                  <Ruler className="w-3.5 h-3.5 text-blue-400" />
                  Garis Ukuran 3D
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5">
                  {showDimensions3D ? 'AKTIF' : 'OFF'}
                </span>
              </button>
            </div>

            {/* 4. Toggles: X-Ray & Buka/Tutup Serentak */}
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => onChange({ showXRayWireframe: !showXRayWireframe })}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  showXRayWireframe
                    ? 'bg-purple-500/20 border border-purple-500/60 text-purple-300 shadow-sm shadow-purple-500/10'
                    : 'bg-neutral-950/70 border border-white/5 text-neutral-300 hover:border-white/20 hover:text-white'
                }`}
                title="Mode transparansi rontgen untuk melihat susunan sekat kabinet"
              >
                <span className="flex items-center gap-2 text-[11px]">
                  <Eye className="w-3.5 h-3.5 text-purple-400" />
                  Mode X-Ray
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5">
                  {showXRayWireframe ? 'AKTIF' : 'OFF'}
                </span>
              </button>

              <button
                onClick={() => {
                  onChange({
                    drawersOpenPercent: isAnyOpen ? 0 : 85,
                    doorsOpenPercent: isAnyOpen ? 0 : 90,
                  });
                }}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isAnyOpen
                    ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-white/10'
                    : 'bg-gradient-to-r from-amber-600/80 to-amber-700/80 hover:from-amber-500 hover:to-amber-600 text-white shadow-md shadow-amber-900/30'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-[11px] font-semibold">
                  {isAnyOpen ? 'Tutup Semua' : 'Buka Semua Laci'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
