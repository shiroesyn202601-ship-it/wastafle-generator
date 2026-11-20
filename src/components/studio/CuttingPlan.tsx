import React from 'react';
import { CutPiece, ProfilePlan, barsNeeded } from '../../products/cutting';
import { PriceSettings } from '../../products/pricing';

interface Props {
  plan: ProfilePlan[];
  pieces: CutPiece[];
  prices: PriceSettings;
  onPrices: (p: PriceSettings) => void;
}

const COLORS = ['#2f6f9f', '#c2410c', '#15803d', '#7c3aed', '#b45309', '#0e7490', '#be123c', '#4d7c0f'];

/** Pola potong batang 6 m: tiap batang digambar berskala, potongan bernomor sama dengan daftar potongan */
export const CuttingPlan: React.FC<Props> = ({ plan, pieces, prices, onPrices }) => {
  const color = (no: number) => COLORS[(no - 1) % COLORS.length];
  const byNo = new Map(pieces.map((p) => [p.no, p]));
  const totalWaste = plan.reduce((s, p) => s + p.bars.reduce((t, b) => t + b.waste, 0), 0);

  return (
    <section className="rounded-2xl bg-white border border-stone-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-stone-200 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex-1 min-w-[200px]">
          <div className="font-semibold text-stone-800">Pola potong batang</div>
          <div className="text-xs text-stone-500">
            Nomor di batang = nomor di daftar potongan. Sisa total {Math.round(totalWaste)} cm.
          </div>
        </div>
        <label className="flex items-center gap-1.5 text-xs text-stone-600">
          Panjang batang
          <input
            type="number"
            min={100}
            max={1200}
            value={prices.stockCm}
            onChange={(e) => onPrices({ ...prices, stockCm: Math.max(100, parseFloat(e.target.value) || 600) })}
            className="w-16 px-1.5 py-1 rounded-md border border-stone-300 text-right tabular-nums"
          />
          cm
        </label>
        <label className="flex items-center gap-1.5 text-xs text-stone-600" title="Lebar mata gerinda / gergaji potong">
          Lebar mata potong
          <input
            type="number"
            min={0}
            max={10}
            step={0.5}
            value={prices.kerfMm}
            onChange={(e) => onPrices({ ...prices, kerfMm: Math.max(0, parseFloat(e.target.value) || 0) })}
            className="w-14 px-1.5 py-1 rounded-md border border-stone-300 text-right tabular-nums"
          />
          mm
        </label>
      </div>

      <div className="p-4 space-y-5">
        {plan.map((pp) => (
          <div key={pp.profile} className="space-y-2">
            <div className="text-sm font-semibold text-stone-800">
              Hollow {pp.profile} mm · {barsNeeded(pp, prices.stockCm)} batang
            </div>
            {pp.bars.map((bar, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-14 shrink-0 text-[11px] text-stone-500 tabular-nums">Batang {i + 1}</span>
                <div className="relative flex-1 h-8 rounded-md bg-stone-100 border border-stone-300 overflow-hidden flex">
                  {bar.cuts.map((c, j) => (
                    <div
                      key={j}
                      className="h-full flex items-center justify-center text-[10px] font-semibold text-white border-r-2 border-white overflow-hidden whitespace-nowrap"
                      style={{ width: `${(c.len / prices.stockCm) * 100}%`, backgroundColor: color(c.no) }}
                      title={`No. ${c.no} · ${c.len} cm · ${byNo.get(c.no)?.label || ''}`}
                    >
                      {c.len / prices.stockCm > 0.06 ? `${c.no}·${c.len}` : c.no}
                    </div>
                  ))}
                  <div
                    className="h-full flex-1 flex items-center justify-center text-[10px] text-stone-500"
                    style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 5px, rgba(120,113,108,.18) 5px 7px)' }}
                    title="Sisa"
                  >
                    {bar.waste >= 15 ? `sisa ${bar.waste}` : ''}
                  </div>
                </div>
              </div>
            ))}
            {pp.tooLong.length > 0 && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2">
                {pp.tooLong.length} potongan lebih panjang dari batang ({pp.tooLong.map((c) => `No. ${c.no} ${c.len} cm`).join(', ')}): harus
                disambung las atau beli batang lebih panjang.
              </p>
            )}
          </div>
        ))}

        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 border-t border-stone-100">
          {pieces.map((p) => (
            <span key={p.no} className="flex items-center gap-1.5 text-[11px] text-stone-600">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: color(p.no) }} />
              No. {p.no}: {p.lengthCm} cm × {p.qty} ({p.profile})
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
