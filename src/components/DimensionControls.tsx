import React from 'react';
import { KitchenConfig, ColumnConfig, ColumnType, LegType, SectionKind, SECTION_KIND_LABELS } from '../types/kitchen';
import { ColumnOrderStrip } from './ColumnOrderStrip';
import { reorderColumns } from '../utils/layoutOps';
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
  const legType: LegType = config.legType ?? 'plinth';

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

  // Segmen (baris) dalam kolom susunan bebas: laci / pintu / rak / kosong. Urutan = atas ke bawah.
  const MAX_SECTIONS = 6;

  const setSections = (colIndex: number, sections: NonNullable<ColumnConfig['drawers']>) => {
    handleColumnChange(colIndex, {
      drawers: sections,
      drawerCount: sections.filter((s) => (s.kind || 'drawer') === 'drawer').length,
    });
  };

  const handleSectionChange = (colIndex: number, sIdx: number, updates: Partial<NonNullable<ColumnConfig['drawers']>[number]>) => {
    const col = columns[colIndex];
    if (!col || !col.drawers) return;
    const next = [...col.drawers];
    next[sIdx] = { ...next[sIdx], ...updates };
    setSections(colIndex, next);
  };

  const handleAddSection = (colIndex: number, kind: SectionKind) => {
    const col = columns[colIndex];
    if (!col) return;
    const curr = col.drawers || [];
    if (curr.length >= MAX_SECTIONS) return;
    const used = curr.reduce((s, d) => s + d.height, 0);
    const remaining = Math.round(usableHeight - used);
    let next = [...curr];
    let newH: number;
    if (remaining >= 8) {
      newH = remaining;
    } else {
      // Tidak ada sisa tinggi: bagi dua segmen tertinggi
      const tallestIdx = next.reduce((best, d, i) => (d.height > next[best].height ? i : best), 0);
      newH = Math.max(8, Math.round(next[tallestIdx]?.height / 2 || usableHeight));
      if (next[tallestIdx]) next[tallestIdx] = { ...next[tallestIdx], height: Math.max(8, next[tallestIdx].height - newH) };
    }
    next.push({
      id: `s-${col.id}-${Date.now()}`,
      height: newH,
      kind,
      name: kind === 'drawer' ? `Laci ${next.filter((d) => (d.kind || 'drawer') === 'drawer').length + 1}` : SECTION_KIND_LABELS[kind],
    });
    setSections(colIndex, next);
  };

  const handleRemoveSection = (colIndex: number, sIdx: number) => {
    const col = columns[colIndex];
    if (!col || !col.drawers || col.drawers.length <= 1) return;
    const removed = col.drawers[sIdx];
    const filtered = col.drawers.filter((_, i) => i !== sIdx);
    // Tinggi segmen yang dihapus diberikan ke tetangganya agar total tetap pas
    const neighbor = Math.min(sIdx, filtered.length - 1);
    filtered[neighbor] = { ...filtered[neighbor], height: filtered[neighbor].height + removed.height };
    setSections(colIndex, filtered);
  };

  const handleMoveSection = (colIndex: number, sIdx: number, dir: -1 | 1) => {
    const col = columns[colIndex];
    if (!col || !col.drawers) return;
    const target = sIdx + dir;
    if (target < 0 || target >= col.drawers.length) return;
    const next = [...col.drawers];
    [next[sIdx], next[target]] = [next[target], next[sIdx]];
    setSections(colIndex, next);
  };

  // Skala ulang tinggi segmen agar totalnya = tinggi efektif kabinet
  const handleFitSections = (colIndex: number) => {
    const col = columns[colIndex];
    if (!col || !col.drawers || col.drawers.length === 0) return;
    const total = col.drawers.reduce((s, d) => s + d.height, 0) || 1;
    const scaled = col.drawers.map((d) => ({ ...d, height: Math.max(5, Math.round((d.height / total) * usableHeight)) }));
    const diff = Math.round(usableHeight) - scaled.reduce((s, d) => s + d.height, 0);
    scaled[scaled.length - 1].height += diff;
    setSections(colIndex, scaled);
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

          {/* Kaki / Plinth */}
          <div className="col-span-2 bg-black/20 p-2.5 rounded-lg border border-white/5 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-300 text-[11px]">Tinggi Kaki / Plinth</span>
              <span className="font-mono font-bold text-blue-400">
                {plinthHeight > 0 ? `${plinthHeight} cm` : 'TANPA KAKI'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={30}
                step={1}
                value={plinthHeight}
                onChange={(e) => onChange({ plinthHeight: parseInt(e.target.value) })}
                className="flex-1 accent-blue-500 cursor-pointer h-1.5 bg-neutral-800 rounded-full"
              />
              <button
                onClick={() => onChange({ plinthHeight: 0 })}
                className="px-2 py-0.5 text-[10px] rounded bg-white/5 border border-white/10 text-neutral-300 hover:text-white cursor-pointer"
                title="Hilangkan kaki (kabinet langsung di lantai)"
              >
                0 cm
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {([
                { id: 'plinth', label: 'Plinth Tertutup', hint: 'Kaki stel ditutup papan kickboard' },
                { id: 'feet', label: 'Kaki Stel Terbuka', hint: 'Kaki adjuster terlihat, tanpa papan plinth' },
                { id: 'frame', label: 'Kaki dari Rangka', hint: 'Tiang rangka sampai lantai, tanpa kaki stel' },
              ] as { id: LegType; label: string; hint: string }[]).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onChange({ legType: opt.id })}
                  title={opt.hint}
                  className={`py-1.5 px-1 rounded-md text-[10px] font-medium border transition cursor-pointer ${
                    legType === opt.id
                      ? 'bg-blue-950/50 border-blue-500/80 text-white'
                      : 'bg-black/30 border-white/[0.06] text-neutral-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-neutral-500 leading-snug">
              {plinthHeight === 0
                ? 'Kabinet & rangka langsung menapak di lantai.'
                : legType === 'frame'
                ? `Tiang rangka diteruskan sampai lantai sebagai kaki (${plinthHeight} cm ruang bebas di bawah kabinet).`
                : legType === 'feet'
                ? `Kaki adjuster ${plinthHeight} cm terlihat, tanpa papan penutup.`
                : `Kaki adjuster ${plinthHeight} cm ditutup papan plinth.`}
            </p>
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

        {/* Urutan kolom: drag & drop */}
        <ColumnOrderStrip config={config} onChange={onChange} />

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

                <div className="flex items-center gap-0.5 ml-auto mr-1">
                  <button
                    onClick={() => onChange(reorderColumns(config, cIdx, cIdx - 1))}
                    disabled={cIdx === 0}
                    className="px-1.5 py-0.5 rounded text-[11px] text-neutral-400 hover:text-white hover:bg-white/10 disabled:opacity-20 cursor-pointer"
                    title="Pindah ke kiri"
                  >
                    ◀
                  </button>
                  <button
                    onClick={() => onChange(reorderColumns(config, cIdx, cIdx + 1))}
                    disabled={cIdx === columns.length - 1}
                    className="px-1.5 py-0.5 rounded text-[11px] text-neutral-400 hover:text-white hover:bg-white/10 disabled:opacity-20 cursor-pointer"
                    title="Pindah ke kanan"
                  >
                    ▶
                  </button>
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
                    <option value="drawers">Susunan Bebas (Laci / Pintu / Kosong)</option>
                    <option value="sink-cabinet">Kabinet Wastafel (Panel Sifon & Pintu)</option>
                    <option value="gas-compartment">Kompartemen Tabung Gas (Ventilasi)</option>
                    <option value="door-single-left">Pintu Single (Buka Kiri)</option>
                    <option value="door-single-right">Pintu Single (Buka Kanan)</option>
                    <option value="door-double">Pintu Ganda (Double Doors)</option>
                    <option value="pullout-spice">Rak Bumbu & Botol Tarik</option>
                    <option value="open-shelves">Rak Terbuka Tanpa Pintu</option>
                  </select>
                </div>
              </div>

              {/* Susunan Bebas: Laci / Pintu / Rak / Kosong per baris */}
              {col.type === 'drawers' && col.drawers && (() => {
                const sumH = col.drawers.reduce((s, d) => s + d.height, 0);
                const mismatch = Math.round(sumH - usableHeight);
                return (
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span className="flex items-center gap-1">
                        <SplitSquareVertical className="w-3.5 h-3.5 text-amber-400" />
                        Susunan dari atas ke bawah ({col.drawers.length} baris)
                      </span>
                      <span className={`font-mono text-[10px] ${mismatch === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {Math.round(sumH)} / {Math.round(usableHeight)} cm
                      </span>
                    </div>

                    {/* Mini preview tampak depan kolom */}
                    <div className="flex gap-2">
                      <div className="w-10 shrink-0 flex flex-col gap-px rounded overflow-hidden border border-white/10 bg-black/40" style={{ height: 84 }}>
                        {col.drawers.map((s, i) => {
                          const k = s.kind || 'drawer';
                          return (
                            <div
                              key={s.id || i}
                              style={{ flexGrow: s.height }}
                              className={`flex items-center justify-center text-[7px] font-bold ${
                                k === 'drawer'
                                  ? 'bg-amber-500/30 text-amber-200'
                                  : k.startsWith('door')
                                  ? 'bg-sky-500/25 text-sky-200'
                                  : k === 'false-panel'
                                  ? 'bg-neutral-500/30 text-neutral-200'
                                  : 'bg-transparent text-neutral-500 border border-dashed border-white/15'
                              }`}
                            >
                              {k === 'drawer' ? 'L' : k === 'door-double' ? 'P2' : k.startsWith('door') ? 'P' : k === 'open' ? 'R' : k === 'empty' ? '—' : 'M'}
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex-1 space-y-1.5">
                        {col.drawers.map((section, sIdx) => (
                          <div key={section.id || sIdx} className="p-1.5 bg-black/30 rounded-md border border-white/5 space-y-1">
                            <div className="flex items-center gap-1">
                              <select
                                value={section.kind || 'drawer'}
                                onChange={(e) => handleSectionChange(cIdx, sIdx, { kind: e.target.value as SectionKind })}
                                className="flex-1 min-w-0 px-1 py-0.5 bg-black/40 border border-white/10 rounded text-[10px] text-neutral-200 cursor-pointer"
                              >
                                {(Object.keys(SECTION_KIND_LABELS) as SectionKind[]).map((k) => (
                                  <option key={k} value={k}>
                                    {SECTION_KIND_LABELS[k]}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleMoveSection(cIdx, sIdx, -1)}
                                disabled={sIdx === 0}
                                className="px-1 text-neutral-500 hover:text-white disabled:opacity-20 text-[10px] cursor-pointer"
                                title="Pindah ke atas"
                              >
                                ▲
                              </button>
                              <button
                                onClick={() => handleMoveSection(cIdx, sIdx, 1)}
                                disabled={sIdx === col.drawers!.length - 1}
                                className="px-1 text-neutral-500 hover:text-white disabled:opacity-20 text-[10px] cursor-pointer"
                                title="Pindah ke bawah"
                              >
                                ▼
                              </button>
                              {col.drawers!.length > 1 && (
                                <button
                                  onClick={() => handleRemoveSection(cIdx, sIdx)}
                                  className="text-neutral-500 hover:text-rose-400 p-0.5 cursor-pointer"
                                  title="Hapus baris"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="range"
                                min={5}
                                max={Math.max(10, Math.round(usableHeight))}
                                value={section.height}
                                onChange={(e) => handleSectionChange(cIdx, sIdx, { height: parseInt(e.target.value) })}
                                className="flex-1 accent-amber-500 cursor-pointer h-1 bg-neutral-800 rounded-full"
                              />
                              <input
                                type="number"
                                min={5}
                                max={Math.round(usableHeight)}
                                value={section.height}
                                onChange={(e) => handleSectionChange(cIdx, sIdx, { height: Math.max(5, parseInt(e.target.value) || 5) })}
                                className="w-11 px-1 py-0.5 bg-black/40 border border-white/10 rounded text-[10px] font-mono text-amber-300 text-right"
                              />
                              <span className="text-[9px] text-neutral-500">cm</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1">
                      {([
                        ['drawer', '+ Laci'],
                        ['door-double', '+ Pintu'],
                        ['open', '+ Rak'],
                        ['empty', '+ Kosong'],
                      ] as [SectionKind, string][]).map(([kind, label]) => (
                        <button
                          key={kind}
                          onClick={() => handleAddSection(cIdx, kind)}
                          disabled={col.drawers!.length >= MAX_SECTIONS}
                          className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-amber-300 hover:text-amber-200 text-[10px] font-semibold disabled:opacity-30 cursor-pointer"
                        >
                          {label}
                        </button>
                      ))}
                      {mismatch !== 0 && (
                        <button
                          onClick={() => handleFitSections(cIdx)}
                          className="ml-auto px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-200 text-[10px] font-semibold cursor-pointer"
                          title="Skala ulang tinggi tiap baris agar total pas dengan tinggi kabinet"
                        >
                          Pas-kan ({mismatch > 0 ? '+' : ''}{mismatch} cm)
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
