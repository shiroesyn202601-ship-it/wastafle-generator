import React, { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { ParamDef, ParamValue } from '../../products/types';

interface Props {
  def: ParamDef;
  value: ParamValue;
  onChange: (v: ParamValue) => void;
}

const clamp = (v: number, min = -Infinity, max = Infinity) => Math.min(max, Math.max(min, v));

/** Satu pilihan: angka (slider + isian + −/+ + tanda ukuran standar), nyala/mati, atau kartu pilihan */
export const ParamControl: React.FC<Props> = ({ def, value, onChange }) => {
  if (def.type === 'toggle') {
    const on = value === true;
    return (
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left cursor-pointer transition ${
          on ? 'border-sky-600 bg-sky-50' : 'border-stone-300 bg-white hover:border-stone-400'
        }`}
      >
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold text-stone-800">{def.label}</span>
          {def.help && <span className="block text-xs text-stone-500 mt-0.5">{def.help}</span>}
        </span>
        <span className={`relative w-11 h-6 rounded-full shrink-0 transition ${on ? 'bg-sky-600' : 'bg-stone-300'}`}>
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
        </span>
      </button>
    );
  }

  if (def.type === 'choice') {
    const isColor = def.key === 'warna';
    return (
      <div className="space-y-1.5">
        <div className="text-sm font-semibold text-stone-800">{def.label}</div>
        {def.help && <p className="text-xs text-stone-500 -mt-1">{def.help}</p>}
        <div className={isColor ? 'flex flex-wrap gap-2' : 'grid grid-cols-2 gap-2'}>
          {def.options!.map((o) => {
            const sel = value === o.value;
            return isColor ? (
              <button
                key={o.value}
                type="button"
                onClick={() => onChange(o.value)}
                title={o.label}
                aria-label={o.label}
                aria-pressed={sel}
                className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border text-xs cursor-pointer ${
                  sel ? 'border-sky-600 ring-2 ring-sky-200 bg-white' : 'border-stone-300 bg-white hover:border-stone-400'
                }`}
              >
                <span className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: o.value }} />
                {o.label}
              </button>
            ) : (
              <button
                key={o.value}
                type="button"
                onClick={() => onChange(o.value)}
                aria-pressed={sel}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                  sel ? 'border-sky-600 bg-sky-50 ring-1 ring-sky-600' : 'border-stone-300 bg-white hover:border-stone-400'
                }`}
              >
                <span className="block text-sm font-semibold text-stone-800">{o.label}</span>
                {o.desc && <span className="block text-[11px] leading-snug text-stone-500 mt-0.5">{o.desc}</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return <NumberParam def={def} value={value} onChange={onChange} />;
};

const NumberParam: React.FC<Props> = ({ def, value, onChange }) => {
  const v = typeof value === 'number' ? value : def.min ?? 0;
  const min = def.min ?? 0;
  const max = def.max ?? 100;
  const step = def.step ?? 1;
  const [text, setText] = useState(String(v));
  useEffect(() => setText(String(v)), [v]);
  const commit = (n: number) => {
    if (!isNaN(n)) onChange(clamp(Math.round(n / step) * step, min, max));
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-end justify-between gap-2">
        <label htmlFor={`p-${def.key}`} className="text-sm font-semibold text-stone-800">
          {def.label}
        </label>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => commit(v - step)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 cursor-pointer" aria-label={`Kurangi ${def.label}`}>
            <Minus className="w-3.5 h-3.5" />
          </button>
          <input
            id={`p-${def.key}`}
            inputMode="numeric"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={() => commit(parseFloat(text.replace(',', '.')))}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            className="w-16 h-8 px-2 rounded-lg border border-stone-300 bg-white text-right text-sm font-semibold tabular-nums text-stone-900 focus:outline-none focus:ring-2 focus:ring-sky-300"
          />
          <button type="button" onClick={() => commit(v + step)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 cursor-pointer" aria-label={`Tambah ${def.label}`}>
            <Plus className="w-3.5 h-3.5" />
          </button>
          <span className="w-10 text-xs text-stone-500">{def.unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={v}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-sky-600 cursor-pointer"
        aria-label={def.label}
      />
      {def.marks && (
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[10px] text-stone-400 mr-0.5">Ukuran umum:</span>
          {def.marks.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => onChange(m.value)}
              title={`Pakai ${m.value} ${def.unit || ''}`}
              aria-pressed={v === m.value}
              className={`px-2 py-0.5 rounded-full border text-[11px] whitespace-nowrap cursor-pointer ${
                v === m.value ? 'bg-amber-100 border-amber-400 text-amber-900 font-semibold' : 'border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
            >
              {m.label} <span className="tabular-nums">{m.value}</span>
            </button>
          ))}
        </div>
      )}
      {def.help && <p className="text-xs text-stone-500">{def.help}</p>}
    </div>
  );
};
