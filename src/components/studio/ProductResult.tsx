import React, { useState } from 'react';
import { FileDown, ImageDown, Download, Info, Link2, MessageCircle, Printer, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { KitchenConfig } from '../../types/kitchen';
import { CostReport, rupiah } from '../../products/common';
import { PriceSettings } from '../../products/pricing';
import { FrameCutListTable, printCutListPdf, downloadCutListPng } from '../FrameCutListTable';
import { CuttingPlan } from './CuttingPlan';
import { printHtml } from '../../utils/exportDoc';
import { customerSheetHtml } from './customerSheet';
import { openWhatsApp, shareText } from '../../products/share';

interface Props {
  title: string;
  summary: string;
  host: KitchenConfig;
  cost: CostReport;
  prices: PriceSettings;
  onPrices: (p: PriceSettings | null) => void; // null = kembali ke harga bawaan
  boardMaterial: string;
  image: string | null; // gambar 3D terakhir dari tab Atur
  url: string; // link desain
  onSaveJson: () => void;
  onToast: (msg: string) => void;
  defaultTab?: 'pemesan' | 'bengkel';
}

const PriceField: React.FC<{ label: string; value: number; onChange: (v: number) => void; suffix?: string }> = ({ label, value, onChange, suffix }) => (
  <label className="flex items-center justify-between gap-3 py-1.5 text-sm">
    <span className="text-stone-700">{label}</span>
    <span className="flex items-center gap-1.5">
      <span className="text-xs text-stone-400">Rp</span>
      <input
        type="number"
        min={0}
        step={500}
        value={value}
        onChange={(e) => onChange(Math.max(0, parseFloat(e.target.value) || 0))}
        className="w-28 px-2 py-1 rounded-md border border-stone-300 text-right tabular-nums"
      />
      {suffix && <span className="w-12 text-xs text-stone-400">{suffix}</span>}
    </span>
  </label>
);

/** Hasil: ringkasan untuk pemesan & lembar kerja untuk bengkel */
export const ProductResult: React.FC<Props> = ({
  title,
  summary,
  host,
  cost,
  prices,
  onPrices,
  boardMaterial,
  image,
  url,
  onSaveJson,
  onToast,
  defaultTab = 'pemesan',
}) => {
  const [tab, setTab] = useState<'pemesan' | 'bengkel'>(defaultTab);
  const [editPrices, setEditPrices] = useState(false);
  const groups = ['Pipa', 'Papan', 'Roda & aksesori', 'Cat', 'Ongkos'] as const;
  const stats = [
    { label: 'Berat rangka', value: `± ${cost.weightKg.toLocaleString('id-ID')} kg` },
    { label: 'Total panjang pipa', value: `${cost.totalLengthM.toLocaleString('id-ID')} m` },
    { label: 'Titik sambungan las', value: `${cost.weldJoints}` },
    { label: 'Luas yang dicat', value: `${cost.paintM2.toLocaleString('id-ID')} m²` },
  ];
  const usedProfiles = cost.plan.map((p) => p.profile);
  const casterLine = cost.lines.find((l) => l.label.startsWith('Roda'));
  const casterInch = casterLine?.label.match(/Roda (\d)/)?.[1];
  const set = (p: Partial<PriceSettings>) => onPrices({ ...prices, ...p });

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      onToast('Link desain disalin. Tempel di chat atau browser.');
    } catch {
      window.prompt('Salin link desain ini:', url);
    }
  };
  const share = () => {
    const text = shareText(title, summary, cost, url);
    if (navigator.share) navigator.share({ title, text, url }).catch(() => undefined);
    else openWhatsApp(text);
  };

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

        {/* Bagikan: sama untuk kedua tab */}
        <div className="flex flex-wrap gap-2">
          <button onClick={share} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer">
            <MessageCircle className="w-4 h-4" /> Bagikan ke WhatsApp
          </button>
          <button onClick={copyLink} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-sm font-semibold text-stone-800 cursor-pointer">
            <Link2 className="w-4 h-4" /> Salin link desain
          </button>
          <button onClick={onSaveJson} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-sm font-semibold text-stone-800 cursor-pointer">
            <Download className="w-4 h-4" /> Simpan file
          </button>
        </div>

        {tab === 'pemesan' ? (
          <>
            <section className="p-5 rounded-2xl bg-white border border-stone-200 flex flex-col sm:flex-row gap-4">
              {image && <img src={image} alt={`Gambar 3D ${title}`} className="w-full sm:w-56 rounded-xl bg-stone-100 object-cover aspect-[4/3]" />}
              <div className="space-y-1 min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  {cost.total !== cost.materialTotal ? 'Perkiraan biaya bahan + ongkos las' : 'Perkiraan biaya bahan'}
                </div>
                <div className="text-3xl font-bold text-stone-900 tabular-nums">± {rupiah(cost.total)}</div>
                <p className="text-xs text-stone-500 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  Harga pasar 2024–2025, bisa berbeda per daerah.{cost.total === cost.materialTotal ? ' Belum termasuk ongkos las & ongkos kirim.' : ''}
                </p>
                <button
                  onClick={() => printHtml(customerSheetHtml({ title, summary, image, cost, prices, url }))}
                  className="mt-2 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-sm font-semibold cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Unduh PDF ringkasan
                </button>
              </div>
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
              <div className="px-4 py-3 border-b border-stone-200 flex items-center justify-between gap-2">
                <span className="font-semibold text-stone-800">Daftar belanja</span>
                <button onClick={() => setEditPrices(!editPrices)} className="flex items-center gap-1.5 text-sm font-semibold text-sky-700 hover:underline cursor-pointer">
                  <SlidersHorizontal className="w-4 h-4" /> {editPrices ? 'Tutup harga' : 'Ubah harga & ongkos'}
                </button>
              </div>

              {editPrices && (
                <div className="px-4 py-3 bg-sky-50/60 border-b border-sky-100">
                  <p className="text-xs text-stone-600 pb-2">Harga tersimpan di browser ini dan dipakai untuk semua desain.</p>
                  <div className="grid sm:grid-cols-2 gap-x-6">
                    {usedProfiles.map((pr) => (
                      <PriceField key={pr} label={`Hollow ${pr} (batang)`} value={prices.pipe[pr] ?? 110000} onChange={(v) => set({ pipe: { ...prices.pipe, [pr]: v } })} />
                    ))}
                    {boardMaterial !== 'none' && cost.lines.some((l) => l.group === 'Papan') && (
                      <PriceField label={`Papan ${boardMaterial} (lembar 122×244)`} value={prices.board[boardMaterial] ?? 250000} onChange={(v) => set({ board: { ...prices.board, [boardMaterial]: v } })} />
                    )}
                    {casterInch && <PriceField label={`Roda ${casterInch}" (buah, tanpa rem)`} value={prices.caster[casterInch] ?? 80000} onChange={(v) => set({ caster: { ...prices.caster, [casterInch]: v } })} />}
                    <PriceField label="Karet / dop kaki (buah)" value={prices.feet} onChange={(v) => set({ feet: v })} />
                    <PriceField label="Cat per m²" value={prices.paintPerM2} onChange={(v) => set({ paintPerM2: v })} />
                    <PriceField label="Ongkos las per titik" value={prices.perWeld} onChange={(v) => set({ perWeld: v })} suffix="0 = tidak" />
                  </div>
                  <button onClick={() => onPrices(null)} className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer">
                    <RotateCcw className="w-3.5 h-3.5" /> Kembalikan harga bawaan
                  </button>
                </div>
              )}

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
                        Total
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold tabular-nums">{rupiah(cost.total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="px-4 py-3 text-xs text-stone-500 border-t border-stone-100">
                Jumlah batang pipa dihitung dari pola potong (lihat tab Untuk bengkel). Papan dihitung per m² ditambah sisa potong 30%.
              </p>
            </section>

            <button onClick={() => setTab('bengkel')} className="px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-sm font-semibold text-stone-800 cursor-pointer">
              Lihat pola potong &amp; daftar potongan untuk bengkel →
            </button>
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
            <CuttingPlan plan={cost.plan} pieces={cost.pieces} prices={prices} onPrices={(p) => onPrices(p)} />
            <FrameCutListTable config={host} />
          </>
        )}
      </div>
    </div>
  );
};

