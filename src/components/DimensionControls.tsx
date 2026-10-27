import React from 'react';
import { KitchenConfig, ColumnConfig, ColumnType } from '../types/kitchen';
import { Plus, Trash2, Sliders, Columns, Maximize2, SplitSquareVertical, Layers } from 'lucide-react';

interface Props {
  config: KitchenConfig;
  onChange: (updated: Partial<KitchenConfig>) => void;
}

export const DimensionControls: React.FC<Props> = ({ config, onChange }) => {
  const {
    totalWidth,
    totalDepth,
    totalHeight,
    countertopThickness,
    plinthHeight,
    backsplashEnabled,
    backsplashHeight,
    columns,
  } = config;

  const usableHeight = totalHeight - countertopThickness - plinthHeight;

  // Update total width and adjust columns proportionately
  const handleTotalWidthChange = (newWidth: number) => {
    const validW = Math.max(90, Math.min(400, newWidth));
    const oldW = totalWidth;
    const ratio = validW / oldW;
    const newCols = columns.map((c) => ({
      ...c,
      width: Math.round(c.width * ratio),
    }));
    onChange({ totalWidth: validW, columns: newCols });
  };

  // Add a new column
  const handleAddColumn = () => {
    if (columns.length >= 6) return;
    const newWidth = Math.round(totalWidth / (columns.length + 1));
    const newCol: ColumnConfig = {
      id: `col-${Date.now()}`,
      width: newWidth,
      type: 'drawers',
      drawerCount: 3,
      drawers: [
        { id: `d-${Date.now()}-1`, height: 16, name: 'Laci Atas' },
        { id: `d-${Date.now()}-2`, height: 26, name: 'Laci Tengah' },
        { id: `d-${Date.now()}-3`, height: Math.max(15, usableHeight - 42), name: 'Laci Bawah' },
      ],
      shelfCount: 1,
    };

    const balancedCols = [...columns, newCol].map((c) => ({
      ...c,
      width: Math.round(totalWidth / (columns.length + 1)),
    }));

    onChange({ columns: balancedCols });
  };

  // Remove column
  const handleRemoveColumn = (colId: string) => {
    if (columns.length <= 1) return;
    const filtered = columns.filter((c) => c.id !== colId);
    const redistributed = filtered.map((c) => ({
      ...c,
      width: Math.round(totalWidth / filtered.length),
    }));
    onChange({ columns: redistributed });
  };

  // Equalize column widths
  const handleEqualizeColumns = () => {
    const equalW = Math.round(totalWidth / columns.length);
    const updated = columns.map((c) => ({ ...c, width: equalW }));
    onChange({ columns: updated });
  };

  // Update specific column
  const handleColumnChange = (index: number, updates: Partial<ColumnConfig>) => {
    const nextCols = [...columns];
    nextCols[index] = { ...nextCols[index], ...updates };
    onChange({ columns: nextCols });
  };

  // Drawer custom height change in a column
  const handleDrawerHeightChange = (colIndex: number, drawerIndex: number, newHeight: number) => {
    const col = columns[colIndex];
    if (!col || !col.drawers) return;
    const nextDrawers = [...col.drawers];
    nextDrawers[drawerIndex] = {
      ...nextDrawers[drawerIndex],
      height: Math.max(10, Math.min(60, newHeight)),
    };
    handleColumnChange(colIndex, { drawers: nextDrawers });
  };

  // Add drawer to a column
  const handleAddDrawerToCol = (colIndex: number) => {
    const col = columns[colIndex];
    if (!col) return;
    const currDrawers = col.drawers || [];
    if (currDrawers.length >= 5) return;
    const newDCount = currDrawers.length + 1;
    const eqH = Math.round(usableHeight / newDCount);
    const newDrawers = Array.from({ length: newDCount }, (_, i) => ({
      id: `d-${col.id}-${i}-${Date.now()}`,
      height: eqH,
      name: `Laci ${i + 1}`,
    }));
    handleColumnChange(colIndex, {
      drawerCount: newDCount,
      drawers: newDrawers,
    });
  };

  // Remove drawer from a column
  const handleRemoveDrawerFromCol = (colIndex: number, dIdx: number) => {
    const col = columns[colIndex];
    if (!col || !col.drawers || col.drawers.length <= 1) return;
    const filtered = col.drawers.filter((_, i) => i !== dIdx);
    const eqH = Math.round(usableHeight / filtered.length);
    const updated = filtered.map((d) => ({ ...d, height: eqH }));
    handleColumnChange(colIndex, {
      drawerCount: updated.length,
      drawers: updated,
    });
  };

  const quickSizePresets = [
    { label: '240 cm (3 Modul)', w: 240, d: 60, h: 85 },
    { label: '270 cm (Standar)', w: 270, d: 60, h: 85 },
    { label: '300 cm (4 Modul)', w: 300, d: 60, h: 85 },
    { label: '330 cm (Island)', w: 330, d: 60, h: 85 },
  ];

  return (
    <div className="space-y-4 text-neutral-200 select-none">
      {/* 1. UKURAN UTAMA MEJA DAPUR */}
      <div className="p-3.5 bg-[#12151c]/90 border border-white/[0.08] rounded-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Maximize2 className="w-4 h-4 text-blue-400" />
            <h3 className="font-semibold text-xs text-white">Dimensi Meja Utama (cm)</h3>
          </div>
          <span className="text-[11px] font-mono text-neutral-400">
            {totalWidth} × {totalDepth} × {totalHeight} cm
          </span>
        </div>

        {/* Quick Size Presets */}
        <div className="grid grid-cols-2 gap-1.5">
          {quickSizePresets.map((preset) => {
            const isMatch = totalWidth === preset.w && totalDepth === preset.d && totalHeight === preset.h;
            return (
              <button
                key={preset.label}
                onClick={() => {
                  handleTotalWidthChange(preset.w);
                  onChange({ totalDepth: preset.d, totalHeight: preset.h });
                }}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-center transition cursor-pointer ${
                  isMatch
                    ? 'bg-blue-950/40 border-blue-500/80 text-white font-bold ring-1 ring-blue-500/30'
                    : 'bg-black/30 border-white/[0.06] text-neutral-400 hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {/* Panjang Meja */}
          <div className="bg-black/20 p-2.5 rounded-lg border border-white/5 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-300 text-[11px]">Panjang Total (P)</span>
              <span className="font-mono font-bold text-blue-400">{totalWidth} cm</span>
            </div>
            <input
              type="range"
              min={120}
              max={380}
              step={5}
              value={totalWidth}
              onChange={(e) => handleTotalWidthChange(parseInt(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer h-1.5 bg-neutral-800 rounded-full"
            />
          </div>

          {/* Kedalaman Meja */}
          <div className="bg-black/20 p-2.5 rounded-lg border border-white/5 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-300 text-[11px]">Kedalaman (L)</span>
              <span className="font-mono font-bold text-blue-400">{totalDepth} cm</span>
            </div>
            <input
              type="range"
              min={50}
              max={80}
              step={2}
              value={totalDepth}
              onChange={(e) => onChange({ totalDepth: parseInt(e.target.value) })}
              className="w-full accent-blue-500 cursor-pointer h-1.5 bg-neutral-800 rounded-full"
            />
          </div>

          {/* Tinggi Meja */}
          <div className="bg-black/20 p-2.5 rounded-lg border border-white/5 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-300 text-[11px]">Tinggi Finish (T)</span>
              <span className="font-mono font-bold text-blue-400">{totalHeight} cm</span>
            </div>
            <input
              type="range"
              min={75}
              max={95}
              step={1}
              value={totalHeight}
              onChange={(e) => onChange({ totalHeight: parseInt(e.target.value) })}
              className="w-full accent-blue-500 cursor-pointer h-1.5 bg-neutral-800 rounded-full"
            />
          </div>

          {/* Tebal Top Table */}
          <div className="bg-black/20 p-2.5 rounded-lg border border-white/5 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-300 text-[11px]">Tebal Marmer</span>
              <span className="font-mono font-bold text-blue-400">{countertopThickness} cm</span>
            </div>
            <input
              type="range"
              min={2}
              max={6}
              step={1}
              value={countertopThickness}
              onChange={(e) => onChange({ countertopThickness: parseInt(e.target.value) })}
              className="w-full accent-blue-500 cursor-pointer h-1.5 bg-neutral-800 rounded-full"
            />
          </div>

          {/* Plinth Kaki */}
          <div className="bg-black/20 p-2.5 rounded-lg border border-white/5 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-300 text-[11px]">Tinggi Plinth Kaki</span>
              <span className="font-mono font-bold text-blue-400">{plinthHeight} cm</span>
            </div>
            <input
              type="range"
              min={6}
              max={15}
              step={1}
              value={plinthHeight}
              onChange={(e) => onChange({ plinthHeight: parseInt(e.target.value) })}
              className="w-full accent-blue-500 cursor-pointer h-1.5 bg-neutral-800 rounded-full"
            />
          </div>

          {/* Backsplash */}
          <div className="bg-black/20 p-2.5 rounded-lg border border-white/5 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-300 text-[11px]">Backsplash Dinding</span>
              <span className="font-mono font-bold text-blue-400">
                {backsplashEnabled ? `${backsplashHeight} cm` : 'OFF'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={backsplashEnabled}
                onChange={(e) => onChange({ backsplashEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 accent-blue-500 cursor-pointer"
              />
              <input
                type="range"
                disabled={!backsplashEnabled}
                min={10}
                max={50}
                step={5}
                value={backsplashHeight}
                onChange={(e) => onChange({ backsplashHeight: parseInt(e.target.value) })}
                className="w-full accent-blue-500 disabled:opacity-30 cursor-pointer h-1.5 bg-neutral-800 rounded-full"
              />
            </div>
          </div>
        </div>

        <div className="p-2 bg-black/40 rounded-lg border border-white/5 text-[11px] text-neutral-400 flex items-center justify-between font-mono">
          <span>Tinggi Efektif Kabinet:</span>
          <span className="text-emerald-400 font-bold">{usableHeight} cm (T - Top - Plinth)</span>
        </div>
      </div>

      {/* 2. PENGATURAN KOLOM KABINET */}
      <div className="p-3.5 bg-[#12151c]/90 border border-white/[0.08] rounded-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Columns className="w-4 h-4 text-emerald-400" />
            <h3 className="font-semibold text-xs text-white">
              Modul Kabinet ({columns.length} Kolom)
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleEqualizeColumns}
              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-neutral-300 text-[11px] rounded-md border border-white/10 transition cursor-pointer"
            >
              Bagi Rata
            </button>
            <button
              onClick={handleAddColumn}
              disabled={columns.length >= 6}
              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold rounded-md disabled:opacity-30 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Modul</span>
            </button>
          </div>
        </div>

        {/* Visual Bar of Columns */}
        <div className="p-2 bg-black/40 rounded-lg border border-white/5 space-y-1">
          <div className="text-[10px] text-neutral-400 flex justify-between font-mono">
            <span>Proporsi Modul:</span>
            <span>Total: {columns.reduce((s, c) => s + c.width, 0)} cm</span>
          </div>
          <div className="flex h-7 w-full rounded-md overflow-hidden gap-0.5 border border-white/10">
            {columns.map((col, idx) => {
              const totalColW = columns.reduce((s, c) => s + c.width, 0);
              const pct = (col.width / (totalColW || 1)) * 100;
              return (
                <div
                  key={col.id || idx}
                  style={{ width: `${pct}%` }}
                  className="bg-white/10 hover:bg-white/15 transition-colors flex items-center justify-center text-[10px] font-mono font-bold text-neutral-200 border-r border-black/40 last:border-none"
                  title={`Kolom ${idx + 1}: ${col.width}cm (${col.type})`}
                >
                  K{idx + 1} ({col.width}cm)
                </div>
              );
            })}
          </div>
        </div>

        {/* List of Individual Columns */}
        <div className="space-y-2.5">
          {columns.map((col, cIdx) => (
            <div
              key={col.id || cIdx}
              className="p-3 bg-black/30 border border-white/[0.06] hover:border-white/20 rounded-lg space-y-2.5 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center font-mono">
                    {cIdx + 1}
                  </span>
                  <span className="text-xs font-semibold text-white">
                    Modul {cIdx + 1}
                  </span>
                </div>

                <button
                  onClick={() => handleRemoveColumn(col.id)}
                  disabled={columns.length <= 1}
                  className="p-1 text-neutral-500 hover:text-rose-400 disabled:opacity-20 transition cursor-pointer"
                  title="Hapus Kolom"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Column Width & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-neutral-400">
                    <span>Lebar Modul</span>
                    <span className="font-mono font-bold text-emerald-400">{col.width} cm</span>
                  </div>
                  <input
                    type="range"
                    min={25}
                    max={120}
                    step={1}
                    value={col.width}
                    onChange={(e) => handleColumnChange(cIdx, { width: parseInt(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-neutral-800 rounded-full"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 block">Tipe Modul Kabinet</label>
                  <select
                    value={col.type}
                    onChange={(e) => {
                      const newType = e.target.value as ColumnType;
                      if (newType === 'drawers' && (!col.drawers || col.drawers.length === 0)) {
                        handleColumnChange(cIdx, {
                          type: newType,
                          drawerCount: 3,
                          drawers: [
                            { id: `d-${col.id}-1`, height: 16, name: 'Laci Atas' },
                            { id: `d-${col.id}-2`, height: 26, name: 'Laci Tengah' },
                            { id: `d-${col.id}-3`, height: Math.max(15, usableHeight - 42), name: 'Laci Bawah' },
                          ],
                        });
                      } else {
                        handleColumnChange(cIdx, { type: newType });
                      }
                    }}
                    className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded-md text-xs text-neutral-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="drawers">Susunan Laci Geser (Drawers)</option>
                    <option value="sink-cabinet">Kabinet Wastafel (Panel Sifon & Pintu)</option>
                    <option value="gas-compartment">Kompartemen Tabung Gas (Ventilasi)</option>
                    <option value="door-single-left">Pintu Single (Buka Kiri)</option>
                    <option value="door-single-right">Pintu Single (Buka Kanan)</option>
                    <option value="door-double">Pintu Ganda (Double Doors)</option>
                    <option value="pullout-spice">Rak Bumbu & Botol Tarik</option>
                    <option value="open-shelf">Rak Terbuka Tanpa Pintu</option>
                  </select>
                </div>
              </div>

              {/* Drawer Heights Customizer */}
              {col.type === 'drawers' && col.drawers && (
                <div className="space-y-1.5 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                    <span className="flex items-center gap-1">
                      <SplitSquareVertical className="w-3.5 h-3.5 text-amber-400" />
                      Tinggi Muka Laci ({col.drawers.length} Laci):
                    </span>
                    <button
                      onClick={() => handleAddDrawerToCol(cIdx)}
                      disabled={col.drawers.length >= 5}
                      className="text-amber-400 hover:text-amber-300 text-[10px] font-semibold disabled:opacity-40 cursor-pointer"
                    >
                      + Tambah Laci
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {col.drawers.map((drawer, dIdx) => (
                      <div key={drawer.id || dIdx} className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-neutral-400 w-12 shrink-0">
                          Laci {dIdx + 1}:
                        </span>
                        <input
                          type="range"
                          min={10}
                          max={45}
                          value={drawer.height}
                          onChange={(e) => handleDrawerHeightChange(cIdx, dIdx, parseInt(e.target.value))}
                          className="flex-1 accent-amber-500 cursor-pointer h-1 bg-neutral-800 rounded-full"
                        />
                        <span className="font-mono text-[10px] font-bold text-amber-400 w-10 text-right">
                          {drawer.height}cm
                        </span>
                        {col.drawers && col.drawers.length > 1 && (
                          <button
                            onClick={() => handleRemoveDrawerFromCol(cIdx, dIdx)}
                            className="text-neutral-500 hover:text-rose-400 p-0.5 cursor-pointer"
                            title="Hapus Laci"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
