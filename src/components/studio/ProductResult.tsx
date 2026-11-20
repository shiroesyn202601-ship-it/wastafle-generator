import React from 'react';
import { FileDown, ImageDown, Download, Link2, MessageCircle } from 'lucide-react';
import { KitchenConfig } from '../../types/kitchen';
import { CostReport } from '../../products/common';
import { PriceSettings } from '../../products/pricing';
import { FrameCutListTable, printCutListPdf, downloadCutListPng } from '../FrameCutListTable';
import { CuttingPlan } from './CuttingPlan';
import { openWhatsApp, shareText } from '../../products/share';

interface Props {
  title: string;
  summary: string;
  host: KitchenConfig;
  cut: CostReport; // pola potong, jumlah batang, panjang total, berat
  settings: PriceSettings; // panjang batang & lebar mata potong
  onSettings: (p: PriceSettings) => void;
  url: string; // link desain
  onSaveJson: () => void;
  onToast: (msg: string) => void;
}

/** Potongan besi: ringkasan bahan, pola potong batang, daftar potongan, export */
export const ProductResult: React.FC<Props> = ({ title, summary, host, cut, settings, onSettings, url, onSaveJson, onToast }) => {
  const stats = [
    { label: 'Batang hollow', value: `${cut.bars} batang ${settings.stockCm / 100} m` },
    { label: 'Total panjang potong', value: `${cut.totalLengthM.toLocaleString('id-ID')} m` },
    { label: 'Jumlah potongan', value: `${cut.pieces.reduce((s, p) => s + p.qty, 0)}` },
    { label: 'Titik sambungan las', value: `${cut.weldJoints}` },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      onToast('Link desain disalin.');
    } catch {
      window.prompt('Salin link desain ini:', url);
    }
  };
  const share = () => {
    const text = shareText(title, summary, cut, url);
    if (navigator.share) navigator.share({ title, text, url }).catch(() => undefined);
    else openWhatsApp(text);
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-stone-100">
      <div className="max-w-4xl mx-auto px-4 py-5 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Potongan besi · {title}</h2>
          <p className="text-sm text-stone-500">{summary}</p>
        </div>

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="p-3 rounded-xl bg-white border border-stone-200">
              <div className="text-[11px] text-stone-500">{s.label}</div>
              <div className="text-base font-bold text-stone-900 tabular-nums">{s.value}</div>
            </div>
          ))}
        </section>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => printCutListPdf(host)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-600 text-white text-sm font-semibold cursor-pointer">
            <FileDown className="w-4 h-4" /> Unduh PDF daftar potongan
          </button>
          <button onClick={() => downloadCutListPng(host)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-sm font-semibold text-stone-800 cursor-pointer">
            <ImageDown className="w-4 h-4" /> Unduh gambar PNG
          </button>
          <button onClick={share} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-sm font-semibold text-stone-800 cursor-pointer">
            <MessageCircle className="w-4 h-4" /> Bagikan ke WhatsApp
          </button>
          <button onClick={copyLink} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-sm font-semibold text-stone-800 cursor-pointer">
            <Link2 className="w-4 h-4" /> Salin link
          </button>
          <button onClick={onSaveJson} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-sm font-semibold text-stone-800 cursor-pointer">
            <Download className="w-4 h-4" /> Simpan file
          </button>
        </div>

        <CuttingPlan plan={cut.plan} pieces={cut.pieces} prices={settings} onPrices={onSettings} />
        <FrameCutListTable config={host} />
      </div>
    </div>
  );
};
