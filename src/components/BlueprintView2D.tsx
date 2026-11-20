import React, { useRef } from 'react';
import { KitchenConfig, SECTION_KIND_LABELS } from '../types/kitchen';
import { describeCountertop } from '../utils/finishes';
import { getSinkStoveGap } from '../utils/layoutOps';
import { FrameCutListTable } from './FrameCutListTable';
import { Printer, Download, Eye, Layers } from 'lucide-react';

interface Props {
  config: KitchenConfig;
  onChange?: (updates: Partial<KitchenConfig>) => void;
}

export const BlueprintView2D: React.FC<Props> = ({ config, onChange }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const {
    totalWidth: W,
    totalDepth: D,
    totalHeight: H,
    countertopThickness: topT,
    plinthHeight: plinthH,
    columns,
    sink,
    stove,
  } = config;

  const carcaseH = H - topT - plinthH;
  const legType = config.legType ?? 'plinth';
  const panelThick = 1.8; // 18mm standard in cm

  // SVG Scaling and Coordinates
  const scale = 2.2; // px per cm
  const svgPadX = 60;
  const svgPadY = 50;

  const frontSvgW = W * scale + svgPadX * 2;
  const frontSvgH = H * scale + svgPadY * 2;

  const topSvgW = W * scale + svgPadX * 2;
  const topSvgH = D * scale + svgPadY * 2;

  const handlePrint = () => {
    window.print();
  };

  const exportSvg = () => {
    const svgEl = document.getElementById('blueprint-front-svg');
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgEl);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blueprint-dapur-${W}x${H}cm.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-stone-100 text-stone-900 p-3 sm:p-6 flex flex-col items-center">
      {/* Blueprint Header & Actions */}
      <div className="w-full max-w-5xl flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-500/20 text-blue-600 border border-blue-500/30">
              CAD BLUEPRINT 2D
            </span>
            <h2 className="text-xl font-bold tracking-tight text-stone-900">Gambar Kerja Teknik & Dimensi Potongan</h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Skala presisi 1:{Math.round(100 / scale)} • Dimensi dalam satuan Centimeter (cm) • Standar Fabrikasi Interior Kitchen Set
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportSvg}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium rounded-lg border border-stone-300 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Ekspor SVG
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg shadow-md transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak Gambar Kerja (Print)
          </button>
        </div>
      </div>

      <div ref={printRef} className="w-full max-w-5xl space-y-8 print:p-0 print:m-0">
        {/* 1. TAMPAK DEPAN (FRONT ELEVATION) */}
        <div className="bg-white border border-stone-200 rounded-2xl p-3 sm:p-6 shadow-xl relative overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-sm text-stone-800 uppercase tracking-wider">
                1. Tampak Depan (Front Elevation) & Pembagian Laci
              </h3>
            </div>
            <span className="text-xs font-mono text-stone-500">
              P: {W} cm × T: {H} cm (Plinth: {plinthH}cm | Kabinet: {carcaseH}cm | Top: {topT}cm)
            </span>
          </div>

          <div className="flex justify-center bg-stone-100 p-3 sm:p-6 rounded-xl border border-stone-200 min-w-[700px]">
            <svg
              id="blueprint-front-svg"
              width={frontSvgW}
              height={frontSvgH}
              viewBox={`0 0 ${frontSvgW} ${frontSvgH}`}
              className="font-mono text-[10px]"
            >
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
                </marker>
                <pattern id="grid" width="22" height="22" patternUnits="userSpaceOnUse">
                  <path d="M 22 0 L 0 0 0 22" fill="none" stroke="#e7e5e4" strokeWidth="0.5" />
                </pattern>
                <pattern id="hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="8" stroke="#d6d3d1" strokeWidth="1" />
                </pattern>
              </defs>

              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* DRAW FRONT VIEW */}
              {(() => {
                const originX = svgPadX;
                const originY = svgPadY + topT * scale;

                const topY = svgPadY;
                const plinthY = originY + carcaseH * scale;

                return (
                  <g>
                    {/* Overall Width Dimension Line (Above Countertop) */}
                    <line
                      x1={originX}
                      y1={svgPadY - 25}
                      x2={originX + W * scale}
                      y2={svgPadY - 25}
                      stroke="#3b82f6"
                      strokeWidth="1.5"
                      markerStart="url(#arrow)"
                      markerEnd="url(#arrow)"
                    />
                    <line x1={originX} y1={svgPadY - 35} x2={originX} y2={svgPadY} stroke="#3b82f6" strokeWidth="0.7" strokeDasharray="3,3" />
                    <line x1={originX + W * scale} y1={svgPadY - 35} x2={originX + W * scale} y2={svgPadY} stroke="#3b82f6" strokeWidth="0.7" strokeDasharray="3,3" />
                    <text x={originX + (W * scale) / 2} y={svgPadY - 32} fill="#2563eb" textAnchor="middle" fontWeight="bold">
                      Panjang Total: {W} cm
                    </text>

                    {/* Overall Height Dimension Line (Right Flank) */}
                    <line
                      x1={originX + W * scale + 30}
                      y1={topY}
                      x2={originX + W * scale + 30}
                      y2={plinthY + plinthH * scale}
                      stroke="#3b82f6"
                      strokeWidth="1.5"
                      markerStart="url(#arrow)"
                      markerEnd="url(#arrow)"
                    />
                    <line x1={originX + W * scale} y1={topY} x2={originX + W * scale + 40} y2={topY} stroke="#3b82f6" strokeWidth="0.7" strokeDasharray="3,3" />
                    <line x1={originX + W * scale} y1={plinthY + plinthH * scale} x2={originX + W * scale + 40} y2={plinthY + plinthH * scale} stroke="#3b82f6" strokeWidth="0.7" strokeDasharray="3,3" />
                    <text
                      x={originX + W * scale + 45}
                      y={originY + (carcaseH * scale) / 2}
                      fill="#2563eb"
                      textAnchor="middle"
                      transform={`rotate(90, ${originX + W * scale + 45}, ${originY + (carcaseH * scale) / 2})`}
                      fontWeight="bold"
                    >
                      Tinggi: {H} cm
                    </text>

                    {/* Countertop Top Slab */}
                    <rect
                      x={originX}
                      y={topY}
                      width={W * scale}
                      height={topT * scale}
                      fill="#d6d3d1"
                      stroke="#2563eb"
                      strokeWidth="1.5"
                    />
                    <text x={originX + 10} y={topY + (topT * scale) / 2 + 3} fill="#292524" fontSize="9">
                      Top Table {topT}cm ({describeCountertop(config)})
                    </text>

                    {/* Plinth / Kaki */}
                    {plinthH > 0 && (
                      <>
                        <rect
                          x={originX + 5 * scale}
                          y={plinthY}
                          width={(W - 10) * scale}
                          height={plinthH * scale}
                          fill={legType === 'plinth' ? '#e7e5e4' : 'none'}
                          stroke="#a8a29e"
                          strokeWidth="1.2"
                          strokeDasharray={legType === 'plinth' ? undefined : '4,3'}
                        />
                        <text x={originX + (W * scale) / 2} y={plinthY + (plinthH * scale) / 2 + 4} fill="#57534e" textAnchor="middle" fontSize="9">
                          {legType === 'frame' ? 'Kaki dari Rangka' : legType === 'feet' ? 'Kaki Stel Terbuka' : 'Plinth Kaki'} ({plinthH} cm)
                        </text>
                      </>
                    )}

                    {/* Carcase Outer Box */}
                    <rect
                      x={originX}
                      y={originY}
                      width={W * scale}
                      height={carcaseH * scale}
                      fill="none"
                      stroke="#57534e"
                      strokeWidth="2"
                    />

                    {/* Columns & Drawers Breakdown */}
                    {(() => {
                      let colX = originX;
                      const totalCustomColW = columns.reduce((sum, c) => sum + c.width, 0);

                      return columns.map((col, idx) => {
                        const colW = (col.width / (totalCustomColW || 1)) * W;
                        const colWpx = colW * scale;
                        const thisX = colX;
                        colX += colWpx;

                        return (
                          <g key={col.id || idx}>
                            {/* Column outline */}
                            <rect
                              x={thisX}
                              y={originY}
                              width={colWpx}
                              height={carcaseH * scale}
                              fill="#fafaf9"
                              stroke="#a8a29e"
                              strokeWidth="1"
                            />

                            {/* Column Width Dimension Indicator */}
                            <line
                              x1={thisX + 4}
                              y1={originY + carcaseH * scale + 15}
                              x2={thisX + colWpx - 4}
                              y2={originY + carcaseH * scale + 15}
                              stroke="#2563eb"
                              strokeWidth="1"
                              markerStart="url(#arrow)"
                              markerEnd="url(#arrow)"
                            />
                            <text
                              x={thisX + colWpx / 2}
                              y={originY + carcaseH * scale + 28}
                              fill="#2563eb"
                              textAnchor="middle"
                              fontSize="9"
                            >
                              K{idx + 1}: {Math.round(colW)} cm
                            </text>

                            {/* Draw Column Contents */}
                            {col.type === 'drawers' ? (
                              (() => {
                                const drawers = col.drawers && col.drawers.length > 0 ? col.drawers : [];
                                const totalDH = drawers.reduce((sum, d) => sum + d.height, 0);
                                let dY = originY;

                                return drawers.map((d, dIdx) => {
                                  const dH = (d.height / (totalDH || 1)) * carcaseH;
                                  const dHpx = dH * scale;
                                  const thisDY = dY;
                                  dY += dHpx;
                                  const kind = d.kind || 'drawer';
                                  const isVoid = kind === 'open' || kind === 'empty';
                                  const bx = thisX + 3;
                                  const by = thisDY + 3;
                                  const bw = colWpx - 6;
                                  const bh = dHpx - 6;

                                  return (
                                    <g key={d.id || dIdx}>
                                      <rect
                                        x={bx}
                                        y={by}
                                        width={bw}
                                        height={bh}
                                        fill={isVoid ? 'none' : kind === 'drawer' ? '#e7e5e4' : '#f5f5f4'}
                                        stroke="#78716c"
                                        strokeWidth="1"
                                        strokeDasharray={isVoid ? '4,3' : undefined}
                                        rx="2"
                                      />
                                      {kind === 'drawer' && (
                                        <line
                                          x1={thisX + colWpx / 2 - 20}
                                          y1={thisDY + 10}
                                          x2={thisX + colWpx / 2 + 20}
                                          y2={thisDY + 10}
                                          stroke="#d97706"
                                          strokeWidth="2.5"
                                          strokeLinecap="round"
                                        />
                                      )}
                                      {kind === 'door-double' && (
                                        <line x1={bx + bw / 2} y1={by} x2={bx + bw / 2} y2={by + bh} stroke="#78716c" strokeWidth="1" />
                                      )}
                                      {/* Garis arah bukaan pintu (segitiga menuju sisi engsel) */}
                                      {(kind === 'door-left' || kind === 'door-right') && (
                                        <polyline
                                          points={
                                            kind === 'door-left'
                                              ? `${bx + bw},${by} ${bx},${by + bh / 2} ${bx + bw},${by + bh}`
                                              : `${bx},${by} ${bx + bw},${by + bh / 2} ${bx},${by + bh}`
                                          }
                                          fill="none"
                                          stroke="#0284c7"
                                          strokeWidth="0.8"
                                          strokeDasharray="5,3"
                                        />
                                      )}
                                      {kind === 'open' && (
                                        <line x1={bx} y1={by + bh / 2} x2={bx + bw} y2={by + bh / 2} stroke="#a8a29e" strokeWidth="1.5" />
                                      )}
                                      <text
                                        x={thisX + colWpx / 2}
                                        y={thisDY + dHpx / 2 + 4}
                                        fill={kind === 'drawer' ? '#44403c' : '#2563eb'}
                                        textAnchor="middle"
                                        fontSize="9"
                                      >
                                        {kind === 'drawer' ? d.name || `Laci ${dIdx + 1}` : SECTION_KIND_LABELS[kind]} ({Math.round(d.height)} cm)
                                      </text>
                                    </g>
                                  );
                                });
                              })()
                            ) : col.type === 'sink-cabinet' ? (
                              <g>
                                {/* Top dummy false panel */}
                                <rect
                                  x={thisX + 3}
                                  y={originY + 3}
                                  width={colWpx - 6}
                                  height={16 * scale}
                                  fill="#e7e5e4"
                                  stroke="#78716c"
                                  strokeWidth="1"
                                />
                                <text x={thisX + colWpx / 2} y={originY + 8 * scale + 4} fill="#57534e" textAnchor="middle" fontSize="9">
                                  Panel Palsu / Pipa (16cm)
                                </text>
                                {/* Lower door pair */}
                                <rect
                                  x={thisX + 3}
                                  y={originY + 16 * scale + 5}
                                  width={colWpx / 2 - 5}
                                  height={carcaseH * scale - 16 * scale - 8}
                                  fill="#fafaf9"
                                  stroke="#78716c"
                                  strokeWidth="1"
                                />
                                <rect
                                  x={thisX + colWpx / 2 + 2}
                                  y={originY + 16 * scale + 5}
                                  width={colWpx / 2 - 5}
                                  height={carcaseH * scale - 16 * scale - 8}
                                  fill="#fafaf9"
                                  stroke="#78716c"
                                  strokeWidth="1"
                                />
                                <text
                                  x={thisX + colWpx / 2}
                                  y={originY + (carcaseH * scale) * 0.65}
                                  fill="#0284c7"
                                  textAnchor="middle"
                                  fontSize="9"
                                >
                                  Pintu Bawah Wastafel (Sifon Pipa)
                                </text>
                              </g>
                            ) : col.type === 'gas-compartment' ? (
                              <g>
                                <rect
                                  x={thisX + 3}
                                  y={originY + 3}
                                  width={colWpx - 6}
                                  height={carcaseH * scale - 6}
                                  fill="#fafaf9"
                                  stroke="#78716c"
                                  strokeWidth="1"
                                />
                                {/* Louver vents */}
                                {[0, 1, 2, 3].map((v) => (
                                  <line
                                    key={v}
                                    x1={thisX + colWpx * 0.25}
                                    y1={originY + carcaseH * scale - 35 - v * 7}
                                    x2={thisX + colWpx * 0.75}
                                    y2={originY + carcaseH * scale - 35 - v * 7}
                                    stroke="#22c55e"
                                    strokeWidth="2"
                                  />
                                ))}
                                <text
                                  x={thisX + colWpx / 2}
                                  y={originY + (carcaseH * scale) / 2}
                                  fill="#16a34a"
                                  textAnchor="middle"
                                  fontSize="9"
                                >
                                  Kompartemen Gas LPG (Ventilasi)
                                </text>
                              </g>
                            ) : (
                              <g>
                                <rect
                                  x={thisX + 3}
                                  y={originY + 3}
                                  width={colWpx - 6}
                                  height={carcaseH * scale - 6}
                                  fill="#e7e5e4"
                                  stroke="#78716c"
                                  strokeWidth="1"
                                />
                                <text
                                  x={thisX + colWpx / 2}
                                  y={originY + (carcaseH * scale) / 2}
                                  fill="#44403c"
                                  textAnchor="middle"
                                  fontSize="9"
                                >
                                  {col.type === 'door-double'
                                    ? 'Pintu Kupu-Kupu'
                                    : col.type === 'pullout-spice'
                                    ? 'Rak Bumbu Tarik'
                                    : col.type === 'open-shelves'
                                    ? 'Rak Terbuka'
                                    : 'Pintu Tunggal'}
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      });
                    })()}
                  </g>
                );
              })()}
            </svg>
          </div>
        </div>

        {/* 2. TAMPAK ATAS (TOP PLAN & CUTOUTS) */}
        <div className="bg-white border border-stone-200 rounded-2xl p-3 sm:p-6 shadow-xl relative overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold text-sm text-stone-800 uppercase tracking-wider">
                2. Tampak Atas (Top Plan) & Lubang Potongan (Cutout Tanam)
              </h3>
            </div>
            <span className="text-xs font-mono text-stone-500">
              P: {W} cm × L: {D} cm • Posisi Tanam Wastafel & Kompor
            </span>
          </div>

          <div className="flex justify-center bg-stone-100 p-3 sm:p-6 rounded-xl border border-stone-200 min-w-[700px]">
            <svg
              width={topSvgW}
              height={topSvgH}
              viewBox={`0 0 ${topSvgW} ${topSvgH}`}
              className="font-mono text-[10px]"
            >
              <defs>
                <pattern id="grid-top" width="22" height="22" patternUnits="userSpaceOnUse">
                  <path d="M 22 0 L 0 0 0 22" fill="none" stroke="#e7e5e4" strokeWidth="0.5" />
                </pattern>
              </defs>

              <rect width="100%" height="100%" fill="url(#grid-top)" />

              {/* Main Countertop Outline */}
              <rect
                x={svgPadX}
                y={svgPadY}
                width={W * scale}
                height={D * scale}
                fill="#e7e5e4"
                stroke="#2563eb"
                strokeWidth="2"
              />

              {/* SINK CUTOUT */}
              {sink.enabled && (
                <g>
                  {(() => {
                    const cutX = svgPadX + (sink.posX - sink.width / 2) * scale;
                    const cutY = svgPadY + (sink.posY - sink.length / 2) * scale;
                    const cutW = sink.width * scale;
                    const cutL = sink.length * scale;

                    return (
                      <g>
                        <rect
                          x={cutX}
                          y={cutY}
                          width={cutW}
                          height={cutL}
                          fill="#dbeafe"
                          stroke="#0284c7"
                          strokeWidth="1.5"
                          strokeDasharray="4,2"
                          rx="4"
                        />
                        <text
                          x={cutX + cutW / 2}
                          y={cutY + cutL / 2 - 6}
                          fill="#1e3a8a"
                          textAnchor="middle"
                          fontWeight="bold"
                          fontSize="10"
                        >
                          LUBANG WASTAFEL ({sink.model})
                        </text>
                        <text
                          x={cutX + cutW / 2}
                          y={cutY + cutL / 2 + 8}
                          fill="#2563eb"
                          textAnchor="middle"
                          fontSize="9"
                        >
                          {sink.width} × {sink.length} cm (Kedalaman: {sink.bowlDepth} cm)
                        </text>

                        {/* Faucet circle indicator */}
                        <circle cx={cutX + cutW / 2} cy={cutY - 8} r="6" fill="#0284c7" />
                        <text x={cutX + cutW / 2 + 10} y={cutY - 5} fill="#0284c7" fontSize="8">
                          Keran
                        </text>
                      </g>
                    );
                  })()}
                </g>
              )}

              {/* STOVE CUTOUT */}
              {stove.enabled && (
                <g>
                  {(() => {
                    const cutX = svgPadX + (stove.posX - stove.width / 2) * scale;
                    const cutY = svgPadY + (stove.posY - stove.length / 2) * scale;
                    const cutW = stove.width * scale;
                    const cutL = stove.length * scale;

                    return (
                      <g>
                        <rect
                          x={cutX}
                          y={cutY}
                          width={cutW}
                          height={cutL}
                          fill="#ffedd5"
                          stroke="#f97316"
                          strokeWidth="1.5"
                          strokeDasharray="4,2"
                          rx="4"
                        />
                        <text
                          x={cutX + cutW / 2}
                          y={cutY + cutL / 2 - 6}
                          fill="#7c2d12"
                          textAnchor="middle"
                          fontWeight="bold"
                          fontSize="10"
                        >
                          LUBANG KOMPOR ({stove.type})
                        </text>
                        <text
                          x={cutX + cutW / 2}
                          y={cutY + cutL / 2 + 8}
                          fill="#c2410c"
                          textAnchor="middle"
                          fontSize="9"
                        >
                          {stove.width} × {stove.length} cm (Tebal Tanam: {stove.recessDepth} cm)
                        </text>
                      </g>
                    );
                  })()}
                </g>
              )}

              {/* Clearance Arrow between Sink and Stove */}
              {sink.enabled && stove.enabled && (
                (() => {
                  const gap = getSinkStoveGap(config);
                  const sinkIsLeft = sink.posX <= stove.posX;
                  const leftEdge = sinkIsLeft ? sink.posX + sink.width / 2 : stove.posX + stove.width / 2;
                  const rightEdge = sinkIsLeft ? stove.posX - stove.width / 2 : sink.posX - sink.width / 2;

                  if (gap > 0) {
                    const startX = svgPadX + leftEdge * scale;
                    const endX = svgPadX + rightEdge * scale;
                    const lineY = svgPadY + (D / 2) * scale;

                    return (
                      <g>
                        <line
                          x1={startX}
                          y1={lineY}
                          x2={endX}
                          y2={lineY}
                          stroke="#10b981"
                          strokeWidth="2"
                          markerStart="url(#arrow)"
                          markerEnd="url(#arrow)"
                        />
                        <rect
                          x={(startX + endX) / 2 - 40}
                          y={lineY - 18}
                          width="80"
                          height="14"
                          fill="#d1fae5"
                          rx="3"
                        />
                        <text
                          x={(startX + endX) / 2}
                          y={lineY - 8}
                          fill="#047857"
                          textAnchor="middle"
                          fontSize="8.5"
                          fontWeight="bold"
                        >
                          Jarak: {Math.round(gap)} cm
                        </text>
                      </g>
                    );
                  }
                  return null;
                })()
              )}

              {/* Depth dimension on left */}
              <line
                x1={svgPadX - 20}
                y1={svgPadY}
                x2={svgPadX - 20}
                y2={svgPadY + D * scale}
                stroke="#3b82f6"
                strokeWidth="1.5"
                markerStart="url(#arrow)"
                markerEnd="url(#arrow)"
              />
              <text
                x={svgPadX - 30}
                y={svgPadY + (D * scale) / 2}
                fill="#2563eb"
                textAnchor="middle"
                transform={`rotate(-90, ${svgPadX - 30}, ${svgPadY + (D * scale) / 2})`}
                fontWeight="bold"
              >
                Kedalaman: {D} cm
              </text>
            </svg>
          </div>
        </div>

        {/* 3. TECHNICAL SPECIFICATION TABLE */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xl">
          <h3 className="font-semibold text-sm text-stone-800 uppercase tracking-wider mb-4">
            3. Ringkasan Ukuran Potongan & Spesifikasi
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3 bg-stone-100 rounded-xl border border-stone-200">
              <span className="text-stone-500 block mb-1">UKURAN KABINET MEJA</span>
              <p className="text-stone-800 font-bold">Panjang Total: {W} cm</p>
              <p className="text-stone-800">Kedalaman: {D} cm</p>
              <p className="text-stone-800">Tinggi Finish: {H} cm</p>
              <p className="text-stone-500">Tinggi Kaki: {plinthH > 0 ? `${plinthH} cm` : 'tanpa kaki'}</p>
              <p className="text-stone-500">Tebal Top Table: {topT} cm</p>
            </div>

            <div className="p-3 bg-stone-100 rounded-xl border border-stone-200">
              <span className="text-blue-600 block mb-1">LUBANG TANAM WASTAFEL</span>
              <p className="text-stone-800 font-bold">Panjang × Lebar: {sink.width} × {sink.length} cm</p>
              <p className="text-stone-800">Kedalaman Bak: {sink.bowlDepth} cm</p>
              <p className="text-stone-800">Posisi Titik Tengah: X={sink.posX} cm, Y={sink.posY} cm</p>
              <p className="text-stone-500">Tipe Pasang: {sink.mounting === 'undermount' ? 'Undermount (Di bawah granit)' : 'Topmount (Drop-in bibir atas)'}</p>
              <p className="text-stone-500">Model: {sink.model} ({sink.finish})</p>
            </div>

            <div className="p-3 bg-stone-100 rounded-xl border border-stone-200">
              <span className="text-amber-600 block mb-1">LUBANG TANAM KOMPOR</span>
              <p className="text-stone-800 font-bold">Panjang × Lebar: {stove.width} × {stove.length} cm</p>
              <p className="text-stone-800">Kedalaman Tanam: {stove.recessDepth} cm</p>
              <p className="text-stone-800">Posisi Titik Tengah: X={stove.posX} cm, Y={stove.posY} cm</p>
              <p className="text-stone-500">Tipe: {stove.type}</p>
              <p className="text-stone-500">Jarak ke Wastafel: {Math.round(Math.abs(stove.posX - sink.posX) - (stove.width + sink.width) / 2)} cm</p>
            </div>
          </div>
        </div>

        {/* 4. DAFTAR POTONGAN BESI RANGKA */}
        <FrameCutListTable config={config} />
      </div>
    </div>
  );
};
