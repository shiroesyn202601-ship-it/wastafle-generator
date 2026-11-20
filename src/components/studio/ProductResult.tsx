import React, { useState } from 'react';
import { FileDown, ImageDown, Download, Info } from 'lucide-react';
import { KitchenConfig } from '../../types/kitchen';
import { CostReport, rupiah } from '../../products/common';
import { FrameCutListTable, printCutListPdf, downloadCutListPng } from '../FrameCutListTable';

interface Props {
  title: string;
  summary: string;
  host: KitchenConfig;
  cost: CostReport;
  onSaveJson: () => void;
}

/** Hasil: ringkasan untuk pemesan & lembar kerja untuk bengkel */
export const ProductResult: React.FC<Props> = ({ title, summary, host, cost, onSaveJson }) => {
  const [tab, setTab] = useState<'pemesan' | 'bengkel'>('pemesan');
  const groups = ['Pipa', 'Papan', 'Roda & aksesori', 'Cat'] as const;
  const stats = [
    { label: 'Berat rangka', value: `± ${cost.weightKg.toLocaleString('id-ID')} kg` },
    { label: 'Total panjang pipa', value: `${cost.totalLengthM.toLocaleString('id-ID')} m` },
    { label: 'Titik sambungan las', value: `${cost.weldJoints}` },
    { label: 'Luas yang dicat', value: `${cost.paintM2.toLocaleString('id-ID')} m²` },
  ];

  return (
    <div className="w-full h-full overflow-y-auto bg-stone-100">
      <div className="max-w-4xl mx-auto px-4 py-5 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-stone-900">{title}</h2>
            <p className="text-sm text-stone-500">{summary}</p>
          </div>
          <div className="flex p-1 rounded-xl bg-stone-200" role="tablist">
            {(['pemesan', 'bengkel'] as const).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold cursor-pointer ${tab === t ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600'}`}
              >
                {t === 'pemesan' ? 'Untuk pemesan' : 'Untuk bengkel'}
              </button>
            ))}
          </div>
        </div>

        {tab === 'pemesan' ? (
          <>
            <section className="p-5 rounded-2xl bg-white border border-stone-200 space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">Perkiraan biaya bahan</div>
              <div className="text-3xl font-bold text-stone-900 tabular-nums">± {rupiah(cost.total)}</div>
              <p className="text-xs text-stone-500 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                Harga pasar 2024–2025, bisa berbeda per daerah. Belum termasuk ongkos las &amp; ongkos kirim.
              </p>
            </section>

            <section className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {stats.map((s) => (
                <div key={s.label} className="p-3 rounded-xl bg-white border border-stone-200">
                  <div className="text-[11px] text-stone-500">{s.label}</div>
                  <div className="text-base font-bold text-stone-900 tabular-nums">{s.value}</div>
                </div>
              ))}
            </section>

            <section className="rounded-2xl bg-white border border-stone-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-stone-200 font-semibold text-stone-800">Daftar belanja</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[520px]">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-stone-500 bg-stone-50">
                      <th className="px-4 py-2 font-medium">Barang</th>
                      <th className="px-4 py-2 font-medium text-right">Jumlah</th>
                      <th className="px-4 py-2 font-medium text-right">Harga satuan</th>
                      <th className="px-4 py-2 font-medium text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((g) =>
                      cost.lines
                        .filter((l) => l.group === g)
                        .map((l, i) => (
                          <tr key={`${g}-${i}`} className="border-t border-stone-100">
                            <td className="px-4 py-2.5">
                              <span className="block text-stone-800">{l.label}</span>
                              <span className="block text-[11px] text-stone-400">{g}</span>
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">
                              {l.qty.toLocaleString('id-ID')} {l.unit}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap text-stone-500">{rupiah(l.price)}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap font-semibold">{rupiah(l.subtotal)}</td>
                          </tr>
                        ))
                    )}
                    <tr className="border-t-2 border-stone-200 bg-stone-50">
                      <td className="px-4 py-2.5 font-bold" colSpan={3}>
                        Total bahan
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold tabular-nums">{rupiah(cost.total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="px-4 py-3 text-xs text-stone-500 border-t border-stone-100">
                Pipa dihitung per batang 6 m termasuk sisa potong ±10%. Papan dihitung per lembar 122×244 cm.
              </p>
            </section>

            <div className="flex flex-wrap gap-2">
              <button onClick={onSaveJson} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-sm font-semibold cursor-pointer">
                <Download className="w-4 h-4" /> Simpan file desain
              </button>
              <button onClick={() => setTab('bengkel')} className="px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-sm font-semibold text-stone-800 cursor-pointer">
                Lihat daftar potongan untuk bengkel →
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => printCutListPdf(host)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-600 text-white text-sm font-semibold cursor-pointer">
                <FileDown className="w-4 h-4" /> Unduh PDF daftar potongan
              </button>
              <button onClick={() => downloadCutListPng(host)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-sm font-semibold text-stone-800 cursor-pointer">
                <ImageDown className="w-4 h-4" /> Unduh gambar PNG
              </button>
            </div>
            <FrameCutListTable config={host} />
          </>
        )}
      </div>
    </div>
  );
};
