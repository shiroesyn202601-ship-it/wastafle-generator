import React, { useEffect, useState } from 'react';
import { Minus, Plus, RotateCcw, Lock } from 'lucide-react';
import { ParamDef, ParamValue, Params, ProductId } from '../../products/types';
import { cachedParamsThumbnail, paramsThumbnail } from '../../three/thumbnails';
import { formatValue } from '../../products/insight';

interface Props {
  def: ParamDef;
  value: ParamValue;
  onChange: (v: ParamValue) => void;
  /** nilai pada contoh (template) yang dipakai; bila beda dengan `value` muncul tombol ↺ */
  base?: ParamValue;
  /** gambar kecil tiap pilihan bentuk: produk + params lengkap untuk satu nilai */
  preview?: { product: ProductId; params: (v: string) => Params };
  /** kursor di atas pilihan (PC): undefined = pilihan ini secara umum, string = satu opsi; null = keluar */
  onHover?: (v: ParamValue | undefined | null) => void;
  /** pilihan tidak berlaku untuk desain sekarang: alasan + tombol ganti */
  disabled?: { reason: string; fixLabel: string; onFix: () => void };
}

const clamp = (v: number, min = -Infinity, max = Infinity) => Math.min(max, Math.max(min, v));

/** Tombol kecil ↺ kembali ke nilai contoh */
const ResetBtn: React.FC<{ def: ParamDef; base: ParamValue; onChange: (v: ParamValue) => void }> = ({ def, base, onChange }) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onChange(base);
    }}
    title={`Kembali ke nilai contoh: ${formatValue(def, base)}`}
    aria-label={`Kembalikan ${def.label} ke ${formatValue(def, base)}`}
    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-semibold text-sky-700 hover:bg-sky-50 cursor-pointer"
  >
    <RotateCcw className="w-3 h-3" /> {formatValue(def, base)}
  </button>
);

/** Satu pilihan: angka (slider + isian + −/+ + tanda ukuran standar), nyala/mati, atau kartu pilihan */
export const ParamControl: React.FC<Props> = (props) => {
  const { def, value, onChange, base, onHover, disabled } = props;
  const changed = base !== undefined && base !== value;
  const hover = onHover
    ? { onMouseEnter: () => onHover(undefined), onMouseLeave: () => onHover(null) }
    : {};

  if (disabled) {
    return (
      <div className="p-3 rounded-xl border border-dashed border-stone-300 bg-stone-50 text-xs text-stone-500 flex items-start gap-2">
        <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0 space-y-1.5">
          <p>
            <b className="text-stone-700">{def.label}</b> — {disabled.reason}
          </p>
          <button type="button" onClick={disabled.onFix} className="px-2.5 py-1 rounded-lg bg-white border border-stone-300 font-semibold text-stone-700 hover:border-stone-500 cursor-pointer">
            {disabled.fixLabel}
          </button>
        </div>
      </div>
    );
  }

  if (def.type === 'toggle') {
    const on = value === true;
    return (
      <div {...hover} className="relative">
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
        {changed && (
          <div className="flex justify-end mt-0.5">
            <ResetBtn def={def} base={base!} onChange={onChange} />
          </div>
        )}
      </div>
    );
  }

  if (def.type === 'choice') {
    const isColor = def.key === 'warna';
    const withPics = !!props.preview;
    return (
      <div className="space-y-1.5" onMouseLeave={onHover ? () => onHover(null) : undefined}>
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold text-stone-800">{def.label}</div>
          {changed && <ResetBtn def={def} base={base!} onChange={onChange} />}
        </div>
        {def.help && <p className="text-xs text-stone-500 -mt-1">{def.help}</p>}
        <div className={isColor ? 'flex flex-wrap gap-2' : withPics ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2' : 'grid grid-cols-2 gap-2'}>
          {def.options!.map((o) => {
            const sel = value === o.value;
            const enter = onHover ? () => onHover(o.value) : undefined;
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
                onMouseEnter={enter}
                aria-pressed={sel}
                className={`rounded-xl border text-left cursor-pointer transition overflow-hidden ${withPics ? 'p-1.5' : 'p-2.5'} ${
                  sel ? 'border-sky-600 bg-sky-50 ring-1 ring-sky-600' : 'border-stone-300 bg-white hover:border-stone-400'
                }`}
              >
                {withPics && <OptionPic product={props.preview!.product} params={props.preview!.params(o.value)} alt={o.label} />}
                <span className={`block text-sm font-semibold text-stone-800 ${withPics ? 'px-1 pt-1' : ''}`}>{o.label}</span>
                {o.desc && <span className={`block text-[11px] leading-snug text-stone-500 mt-0.5 ${withPics ? 'px-1 pb-0.5' : ''}`}>{o.desc}</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return <NumberParam {...props} changed={changed} hover={hover} />;
};

/** Gambar kecil satu pilihan; dibuat setelah pilihan lain berhenti berubah sebentar supaya tidak berat */
const OptionPic: React.FC<{ product: ProductId; params: Params; alt: string }> = ({ product, params, alt }) => {
  const [url, setUrl] = useState<string | null>(() => cachedParamsThumbnail(product, params));
  const key = JSON.stringify(params);
  useEffect(() => {
    let live = true; // per permintaan: gambar untuk pilihan yang sudah usang dilewati
    const hit = cachedParamsThumbnail(product, params);
    if (hit) {
      setUrl(hit);
      return;
    }
    const t = setTimeout(() => {
      paramsThumbnail(product, params, () => live).then((u) => live && u && setUrl(u));
    }, 350);
    return () => {
      live = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, key]);
  return (
    <span className="block aspect-[4/3] rounded-lg bg-stone-100 overflow-hidden">
      {url ? <img src={url} alt={alt} className="w-full h-full object-contain" draggable={false} /> : <span className="block w-full h-full animate-pulse bg-stone-200/60" />}
    </span>
  );
};

const NumberParam: React.FC<Props & { changed: boolean; hover: React.HTMLAttributes<HTMLDivElement> }> = ({ def, value, onChange, base, changed, hover }) => {
  const v = typeof value === 'number' ? value : def.min ?? 0;
  const min = def.min ?? 0;
  const max = def.max ?? 100;
  const step = def.step ?? 1;
  const [text, setText] = useState(String(v));
  useEffect(() => setText(String(v)), [v]);
  const commit = (n: number) => {
    if (!isNaN(n)) onChange(clamp(Math.round(n / step) * step, min, max));
  };

  // Jumlah kecil (mis. jumlah tingkat 1–6): tombol angka lebih mudah daripada slider
  const count = Math.round((max - min) / step) + 1;
  if (def.unit !== 'cm' && step >= 1 && count <= 8) {
    const vals = Array.from({ length: count }, (_, i) => min + i * step);
    return (
      <div className="space-y-1.5" {...hover}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-stone-800">{def.label}</span>
          {changed && <ResetBtn def={def} base={base!} onChange={onChange} />}
        </div>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={def.label}>
          {vals.map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={v === n}
              onClick={() => onChange(n)}
              className={`min-w-11 h-10 px-2 rounded-xl border text-sm font-semibold tabular-nums cursor-pointer ${
                v === n ? 'border-sky-600 bg-sky-600 text-white' : 'border-stone-300 bg-white text-stone-700 hover:border-stone-500'
              }`}
            >
              {n}
            </button>
          ))}
          {def.unit && <span className="self-center text-xs text-stone-500 ml-1">{def.unit}</span>}
        </div>
        {def.help && <p className="text-xs text-stone-500">{def.help}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-1.5" {...hover}>
      <div className="flex items-end justify-between gap-2">
        <span className="flex flex-col items-start min-w-0">
          <label htmlFor={`p-${def.key}`} className="text-sm font-semibold text-stone-800">
            {def.label}
          </label>
          {changed && <ResetBtn def={def} base={base!} onChange={onChange} />}
        </span>
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
