import React, { useRef, useState } from 'react';
import { Droplets, Flame, GripVertical } from 'lucide-react';
import { KitchenConfig, ColumnType } from '../types/kitchen';
import { getColumnSpans, reorderColumns } from '../utils/layoutOps';

interface Props {
  config: KitchenConfig;
  onChange: (updated: Partial<KitchenConfig>) => void;
}

const TYPE_SHORT: Record<ColumnType, string> = {
  drawers: 'Susun',
  'door-single-left': 'Pintu',
  'door-single-right': 'Pintu',
  'door-double': 'Pintu 2',
  'open-shelves': 'Rak',
  'gas-compartment': 'Gas',
  'pullout-spice': 'Bumbu',
  'sink-cabinet': 'Wastafel',
};

/** Strip tampak depan meja: seret kolom ke kiri/kanan untuk mengatur urutan (mouse & sentuh) */
export const ColumnOrderStrip: React.FC<Props> = ({ config, onChange }) => {
  const stripRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ from: number; over: number } | null>(null);
  const { columns, sink, stove } = config;
  const total = columns.reduce((s, c) => s + c.width, 0) || 1;

  // Kolom tempat wastafel & kompor berada (indeks asli)
  const spans = getColumnSpans(config);
  const colAt = (x: number) => spans.findIndex((s) => x >= s.start && x < s.end);
  const sinkCol = sink.enabled ? colAt(sink.posX) : -1;
  const stoveCol = stove.enabled ? colAt(stove.posX) : -1;

  // Urutan pratinjau selama menyeret
  const order = columns.map((_, i) => i);
  if (drag && drag.from !== drag.over) {
    const [m] = order.splice(drag.from, 1);
    order.splice(drag.over, 0, m);
  }

  const indexAtPointer = (clientX: number) => {
    const rect = stripRef.current!.getBoundingClientRect();
    const p = Math.min(0.9999, Math.max(0, (clientX - rect.left) / rect.width)) * total;
    let acc = 0;
    for (let i = 0; i < order.length; i++) {
      acc += columns[order[i]].width;
      if (p < acc) return i;
    }
    return order.length - 1;
  };

  const onPointerDown = (e: React.PointerEvent, idx: number) => {
    if (columns.length < 2) return;
    stripRef.current?.setPointerCapture(e.pointerId);
    setDrag({ from: idx, over: idx });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const over = indexAtPointer(e.clientX);
    if (over !== drag.over) setDrag({ ...drag, over });
  };

  const onPointerUp = () => {
    if (drag && drag.from !== drag.over) onChange(reorderColumns(config, drag.from, drag.over));
    setDrag(null);
  };

  return (
    <div className="p-2 bg-black/40 rounded-lg border border-white/5 space-y-1.5">
      <div className="text-[10px] text-neutral-400 flex justify-between font-mono">
        <span>Urutan modul (seret untuk pindah):</span>
        <span>Total: {total} cm</span>
      </div>
      <div
        ref={stripRef}
        className="flex h-14 w-full rounded-md overflow-hidden gap-0.5 border border-white/10 touch-none select-none"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => setDrag(null)}
      >
        {order.map((colIdx) => {
          const col = columns[colIdx];
          const isDragged = drag?.from === colIdx;
          return (
            <div
              key={col.id || colIdx}
              style={{ width: `${(col.width / total) * 100}%` }}
              onPointerDown={(e) => onPointerDown(e, colIdx)}
              className={`relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-mono transition-colors ${
                columns.length > 1 ? 'cursor-grab active:cursor-grabbing' : ''
              } ${
                isDragged
                  ? 'bg-amber-500/40 text-white ring-2 ring-inset ring-amber-400'
                  : 'bg-white/10 hover:bg-white/15 text-neutral-200'
              }`}
              title={`Kolom ${colIdx + 1}: ${col.width}cm (${col.type}) — seret untuk memindah`}
            >
              <GripVertical className="absolute left-0.5 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-500" />
              <span className="flex items-center gap-0.5">
                {colIdx === sinkCol && <Droplets className="w-3 h-3 text-sky-300" />}
                {colIdx === stoveCol && <Flame className="w-3 h-3 text-orange-300" />}
                <span className="font-bold truncate">{TYPE_SHORT[col.type] || col.type}</span>
              </span>
              <span className="text-neutral-400">{col.width}cm</span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-neutral-500">
        Wastafel <Droplets className="inline w-3 h-3 text-sky-300" /> & kompor <Flame className="inline w-3 h-3 text-orange-300" /> ikut pindah
        bersama kolomnya, rangka penyangganya ikut menyesuaikan.
      </p>
    </div>
  );
};
