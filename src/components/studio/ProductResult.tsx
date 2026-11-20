import React, { useEffect, useState } from 'react';
import { FileDown, ImageDown, Download, Link2, MessageCircle } from 'lucide-react';
import { KitchenConfig } from '../../types/kitchen';
import { CostReport } from '../../products/common';
import { PriceSettings } from '../../products/pricing';
import { FrameCutListTable, printCutListPdf, downloadCutListPng } from '../FrameCutListTable';
import { CuttingPlan } from './CuttingPlan';
import { openWhatsApp, shareText } from '../../products/share';
import { ProductBuild } from '../../products/types';
import { DesignView, designImages } from '../../three/thumbnails';

interface Props {
  title: string;
  summary: string;
  host: KitchenConfig;
  build: ProductBuild; // untuk gambar produk di atas halaman
  paint: string;
  board: string;
  cut: CostReport; // pola potong, jumlah batang, panjang total, berat
  settings: PriceSettings; // panjang batang & lebar mata potong
  onSettings: (p: PriceSettings) => void;
  url: string; // link desain
  onSaveJson: () => void;
  onToast: (msg: string) => void;
}

/** Potongan besi: ringkasan bahan, pola potong batang, daftar potongan, export */
export const ProductResult: React.FC<Props> = ({ title, summary, host, build, paint, board, cut, settings, onSettings, url, onSaveJson, onToast }) => {
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

        <DesignPictures host={host} build={build} paint={paint} board={board} title={title} />

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="p-3 rounded-xl bg-white border border-stone-200">
              <div className="text-[11px] text-stone-500">{s.label}</div>
              <div className="text-base font-bold text-stone-900 tabular-nums">{s.value}</div>
            </div>
          ))}
        </section>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => printCutListPdf(host)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold cursor-pointer">
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

const VIEWS: { view: DesignView; label: string; w: number; h: number }[] = [
  { view: 'iso', label: '3D', w: 1120, h: 700 },
  { view: 'front', label: 'Tampak depan', w: 400, h: 300 },
  { view: 'side', label: 'Tampak samping', w: 400, h: 300 },
  { view: 'top', label: 'Tampak atas', w: 400, h: 300 },
];

/** Gambar produk persis seperti desain sekarang: 3D besar + tampak depan, samping, atas */
const DesignPictures: React.FC<{ host: KitchenConfig; build: ProductBuild; paint: string; board: string; title: string }> = ({ host, build, paint, board, title }) => {
  const [imgs, setImgs] = useState<(string | null)[] | null>(null);
  useEffect(() => {
    let live = true;
    designImages(host, build, paint, board, VIEWS).then((r) => live && setImgs(r));
    return () => {
      live = false;
    };
  }, [host, build, paint, board]);
  if (imgs && imgs.every((x) => !x)) return null; // WebGL tidak tersedia
  const dims = `${Math.round(build.W)} × ${Math.round(build.D)} × ${Math.round(build.H)} cm`;
  const pic = (i: number, cls: string) =>
    imgs?.[i] ? (
      <img src={imgs[i]!} alt={`${title} — ${VIEWS[i].label}`} className={`w-full h-full object-contain ${cls}`} draggable={false} />
    ) : (
      <div className="w-full h-full animate-pulse bg-black/5" />
    );
  return (
    <section className="grid gap-2 sm:grid-cols-[3fr_1fr]" aria-label="Gambar produk">
      <figure className="relative aspect-[16/10] rounded-xl overflow-hidden bg-[#ecebe6] border border-stone-200">
        {pic(0, '')}
        <figcaption className="absolute left-2 bottom-2 px-2 py-1 rounded-lg bg-white/85 text-[11px] font-semibold text-stone-800 tabular-nums">
          P × L × T: {dims}
        </figcaption>
      </figure>
      {/* tampak kecil: sebaris di HP, bertumpuk setinggi gambar besar di PC */}
      <div className="grid grid-cols-3 sm:grid-cols-1 sm:grid-rows-3 gap-2 min-h-0">
        {[1, 2, 3].map((i) => (
          <figure key={i} className="relative aspect-[4/3] sm:aspect-auto sm:min-h-0 rounded-xl overflow-hidden bg-[#ecebe6] border border-stone-200">
            {pic(i, 'p-1 sm:absolute sm:inset-0')}
            <figcaption className="absolute left-1.5 top-1.5 px-1.5 py-0.5 rounded-md bg-white/85 text-[10px] font-semibold text-stone-700">{VIEWS[i].label}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
};
