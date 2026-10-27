import React, { useState } from 'react';
import { KitchenConfig } from '../types/kitchen';
import { Calculator, Download, Printer, CheckCircle, Info, FileText } from 'lucide-react';
import { downloadDocFile, calculateFabricationCutList } from '../utils/exportDoc';
import { describeCountertop, describeCabinetFinish, describeFrame } from '../utils/finishes';

interface Props {
  config: KitchenConfig;
  onOpenDocModal?: () => void;
}

interface CostItem {
  id: string;
  category: 'Kayu & Panel' | 'Finishing & Top Table' | 'Hardware & Aksesoris' | 'Perangkat / Sanitari' | 'Jasa & Instalasi';
  name: string;
  specs: string;
  qty: number;
  unit: string;
  unitPrice: number;
}

export const BillOfMaterials: React.FC<Props> = ({ config, onOpenDocModal }) => {
  const { totalWidth: W, totalDepth: D, totalHeight: H, columns, sink, stove } = config;

  // Calculate material quantities dynamically based on kitchen dimensions:
  // 1. Countertop area in m2
  const topAreaM2 = Number(((W * D) / 10000).toFixed(2));

  // 2. Total drawer count (kolom susunan bebas dihitung per baris berjenis laci)
  const sectionsOf = (col: (typeof columns)[number]) => col.drawers || [];
  const totalDrawers = columns.reduce((acc, col) => {
    if (col.type === 'drawers') return acc + sectionsOf(col).filter((s) => (s.kind || 'drawer') === 'drawer').length;
    if (col.type === 'pullout-spice') return acc + 1;
    return acc;
  }, 0);

  // 3. Total doors count
  const totalDoors = columns.reduce((acc, col) => {
    if (col.type === 'drawers') {
      return acc + sectionsOf(col).reduce((s, d) => s + (d.kind === 'door-double' ? 2 : d.kind === 'door-left' || d.kind === 'door-right' ? 1 : 0), 0);
    }
    if (col.type === 'door-double' || col.type === 'sink-cabinet') return acc + 2;
    if (col.type === 'door-single-left' || col.type === 'door-single-right' || col.type === 'gas-compartment') return acc + 1;
    return acc;
  }, 0);

  // 4. Multiplex 18mm area calculation:
  // Carcase outer (2 sides, bottom), dividers (columns.length - 1), shelves, drawer boxes, doors
  // Approx area:
  const carcaseSidesM2 = 2 * (D * H) / 10000;
  const dividersM2 = Math.max(0, columns.length - 1) * (D * H) / 10000;
  const bottomM2 = (W * D) / 10000;
  const doorsAndDrawersM2 = (W * H) / 10000;
  const drawerBoxesM2 = totalDrawers * (0.15 * (W / columns.length) * 2 + 0.15 * D * 2) / 10000;
  const totalPanelM2 = carcaseSidesM2 + dividersM2 + bottomM2 + doorsAndDrawersM2 + drawerBoxesM2;
  // Standard sheet size: 1.22m x 2.44m = 2.97 m2 (factoring 15% cutting waste)
  const multiplex18Sheets = Math.max(1, Math.ceil((totalPanelM2 * 1.18) / 2.97));
  const multiplex9Sheets = Math.max(1, Math.ceil((((W * H) / 10000) * 1.2) / 2.97)); // back panel & drawer bottoms

  // 5. HPL Sheets (1.22m x 2.44m = 2.97m2)
  const hplAreaM2 = doorsAndDrawersM2 * 1.35; // outer faces + edges
  const hplSheets = Math.max(1, Math.ceil(hplAreaM2 / 2.97));

  // 6. Frame Steel Hollow calculation (6m standard bar length)
  const isHollow = config.frame?.material.startsWith('hollow-steel') || config.frame?.material.startsWith('aluminium') || config.frame?.material === 'custom';
  const tubeSize = config.frame?.tubeSize || 40;
  // Dihitung dari batang rangka sebenarnya (otomatis / hasil Editor Rangka 2D)
  const frameCut = calculateFabricationCutList(config);
  const postCount = frameCut.levelingFeetCount;
  const hollowBars = Math.max(1, frameCut.standard6mBarsNeeded);

  // Default Unit Prices in IDR (Rp)
  const [prices, setPrices] = useState<Record<string, number>>({
    'hollow-bar': 185000, // Batang Besi Hollow 40x40 6m
    'adjuster-feet': 18000, // Kaki adjuster leveler per buah
    'ply-18': 265000, // Multiplex Palm 18mm
    'ply-9': 155000, // Multiplex 9mm
    'hpl': 195000, // HPL Taco / Carta motif
    'top-stone': 1650000, // Granit / Marmer per m2
    'drawer-rails': 85000, // Rel laci double track soft-close per pasang
    'hinges': 35000, // Engsel sendok slow-motion per pasang
    'handles': 25000, // Handle per pcs
    'led-strip': 165000, // Roll LED COB Strip 12V 5m + Trafo
    'sink-unit': sink.finish === 'black-nano' ? 1450000 : 950000,
    'faucet-unit': sink.faucet === 'modern-flex' ? 550000 : 380000,
    'siphon-pipe': 120000, // Afur & selang pembuangan
    'stove-unit': stove.type.startsWith('induction') ? 2200000 : stove.type === 'gas-3' ? 1950000 : 1350000,
    'labor': 650000, // Ongkos tukang & perakitan per meter lari
  });

  const handlePriceChange = (id: string, val: number) => {
    setPrices((prev) => ({ ...prev, [id]: isNaN(val) ? 0 : val }));
  };

  const costItems: CostItem[] = [
    ...(isHollow
      ? [
          {
            id: 'hollow-bar',
            category: 'Kayu & Panel' as const,
            name: `Besi Hollow Kotak ${tubeSize}×${tubeSize} mm (Batang 6m)`,
            specs: `${frameCut.totalSteelLengthM} m total potongan, ${describeFrame(config)}`,
            qty: hollowBars,
            unit: 'batang (6m)',
            unitPrice: prices['hollow-bar'],
          },
        ]
      : []),
    ...(isHollow && postCount > 0
      ? [
          {
            id: 'adjuster-feet',
            category: 'Hardware & Aksesoris' as const,
            name: 'Kaki Adjuster Leveling Feet Stainless/Karet',
            specs: 'Pengatur kerataan kaki lantai anti gores & anti air',
            qty: postCount,
            unit: 'buah',
            unitPrice: prices['adjuster-feet'],
          },
        ]
      : []),
    {
      id: 'ply-18',
      category: 'Kayu & Panel',
      name: 'Plywood / Multiplex Semi Meranti 18mm',
      specs: 'Bodi kabinet, sekat kolom, pintu & rangka laci (122 × 244 cm)',
      qty: multiplex18Sheets,
      unit: 'lembar',
      unitPrice: prices['ply-18'],
    },
    {
      id: 'ply-9',
      category: 'Kayu & Panel',
      name: 'Plywood 9mm (Backing & Dasar Laci)',
      specs: 'Tutup punggung belakang & alas dasar kotak laci',
      qty: multiplex9Sheets,
      unit: 'lembar',
      unitPrice: prices['ply-9'],
    },
    {
      id: 'hpl',
      category: 'Finishing & Top Table',
      name: `Finishing Muka Kabinet (${describeCabinetFinish(config)})`,
      specs: 'Laminasi pelindung anti-air & anti-gores (122 × 244 cm)',
      qty: hplSheets,
      unit: 'lembar',
      unitPrice: prices['hpl'],
    },
    {
      id: 'top-stone',
      category: 'Finishing & Top Table',
      name: `Top Table Meja (${describeCountertop(config)})`,
      specs: `Tebal ${config.countertopThickness}cm, bevel tepi, lubang tanam sink & kompor`,
      qty: topAreaM2,
      unit: 'm²',
      unitPrice: prices['top-stone'],
    },
    {
      id: 'drawer-rails',
      category: 'Hardware & Aksesoris',
      name: 'Rel Laci Double Track Ball-Bearing Slow-Motion',
      specs: `Kapasitas 35kg, soft closing, panjang ${Math.max(35, Math.min(50, D - 10))} cm`,
      qty: totalDrawers,
      unit: 'pasang',
      unitPrice: prices['drawer-rails'],
    },
    {
      id: 'hinges',
      category: 'Hardware & Aksesoris',
      name: 'Engsel Sendok Slow-Motion Hidrolik Stainless',
      specs: 'Soft closing clip-on 35mm (2 pcs per pintu)',
      qty: totalDoors,
      unit: 'pasang',
      unitPrice: prices['hinges'],
    },
    {
      id: 'handles',
      category: 'Hardware & Aksesoris',
      name: `Tarikan / Handle (${config.handleStyle})`,
      specs: 'Hardware tarikan laci dan kabinet',
      qty: totalDrawers + totalDoors,
      unit: 'buah',
      unitPrice: prices['handles'],
    },
    ...(sink.enabled
      ? [
          {
            id: 'sink-unit',
            category: 'Perangkat / Sanitari' as const,
            name: `Wastafel Cuci Piring (${sink.model} - ${sink.finish})`,
            specs: `${sink.width} × ${sink.length} cm, kedalaman bak ${sink.bowlDepth} cm, peredam suara`,
            qty: 1,
            unit: 'set',
            unitPrice: prices['sink-unit'],
          },
          {
            id: 'faucet-unit',
            category: 'Perangkat / Sanitari' as const,
            name: `Keran Air Dapur (${sink.faucet})`,
            specs: 'Kuningan / SUS 304 anti karat, sistem cartridge keramik',
            qty: 1,
            unit: 'unit',
            unitPrice: prices['faucet-unit'],
          },
          {
            id: 'siphon-pipe',
            category: 'Perangkat / Sanitari' as const,
            name: 'Afur Keranjang + Sifon Botol Pipa Pembuangan',
            specs: 'Perangkap bau U-trap & selang fleksibel anti bocor',
            qty: 1,
            unit: 'set',
            unitPrice: prices['siphon-pipe'],
          },
        ]
      : []),
    ...(stove.enabled
      ? [
          {
            id: 'stove-unit',
            category: 'Perangkat / Sanitari' as const,
            name: `Kompor Tanam Built-In (${stove.type})`,
            specs: `${stove.width} × ${stove.length} cm, kedalaman tanam ${stove.recessDepth} cm, pemantik otomatis`,
            qty: 1,
            unit: 'unit',
            unitPrice: prices['stove-unit'],
          },
        ]
      : []),
    {
      id: 'labor',
      category: 'Jasa & Instalasi',
      name: 'Jasa Perakitan, Finishing & Pemasangan Lapangan',
      specs: `Dihitung berdasarkan panjang ${W / 100} meter lari`,
      qty: Number((W / 100).toFixed(2)),
      unit: 'm lari',
      unitPrice: prices['labor'],
    },
  ];

  const grandTotal = costItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-neutral-950 text-neutral-100 p-6 flex flex-col items-center">
      {/* RAB Header */}
      <div className="w-full max-w-5xl flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              RAB & CUTTING LIST
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white">Rancangan Anggaran Biaya & Kebutuhan Bahan</h2>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Kalkulasi otomatis jumlah bahan lembaran, hardware laci slow-motion, sanitari, dan estimasi biaya pembuatan.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="text-right mr-1">
            <span className="text-[11px] text-neutral-400 block">Total Perkiraan Biaya:</span>
            <span className="text-xl font-extrabold text-emerald-400">{formatRupiah(grandTotal)}</span>
          </div>

          <button
            onClick={() => onOpenDocModal ? onOpenDocModal() : downloadDocFile(config)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow transition"
            title="Download Dokumen SPK & Ukuran Potongan Besi untuk Pembuat Wastafel"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export to .DOC</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg border border-neutral-700 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak</span>
          </button>
        </div>
      </div>

      <div className="w-full max-w-5xl space-y-6">
        {/* Quick Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-xl">
            <span className="text-[11px] text-neutral-400">Dimensi Meja Dapur</span>
            <p className="text-base font-bold text-neutral-100 mt-0.5">{W} × {D} × {H} cm</p>
            <span className="text-[10px] text-neutral-500">Panjang × Lebar × Tinggi</span>
          </div>
          <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-xl">
            <span className="text-[11px] text-neutral-400">Total Laci & Pintu</span>
            <p className="text-base font-bold text-amber-400 mt-0.5">{totalDrawers} Laci • {totalDoors} Pintu</p>
            <span className="text-[10px] text-neutral-500">{columns.length} Kolom Partisi</span>
          </div>
          <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-xl">
            <span className="text-[11px] text-neutral-400">Bahan Triplek 18mm</span>
            <p className="text-base font-bold text-blue-400 mt-0.5">{multiplex18Sheets} Lembar</p>
            <span className="text-[10px] text-neutral-500">Termasuk toleransi potong</span>
          </div>
          <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-xl">
            <span className="text-[11px] text-neutral-400">Luas Top Table Marmer</span>
            <p className="text-base font-bold text-purple-400 mt-0.5">{topAreaM2} m²</p>
            <span className="text-[10px] text-neutral-500">{describeCountertop(config)}</span>
          </div>
        </div>

        {/* Detailed Itemized Table */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-neutral-850 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-sm text-neutral-200">Tabel Rincian Material & Harga Satuan</h3>
            </div>
            <span className="text-xs text-neutral-400">💡 Anda dapat mengedit harga satuan sesuai harga pasar lokal Anda</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 font-medium">
                <tr>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Deskripsi Material / Komponen</th>
                  <th className="py-3 px-4 text-center">Vol</th>
                  <th className="py-3 px-4 text-center">Satuan</th>
                  <th className="py-3 px-4 text-right">Harga Satuan (Rp)</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-mono">
                {costItems.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3 px-4 text-neutral-400 text-[11px] font-sans">
                      <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <p className="font-medium text-neutral-200 text-xs">{item.name}</p>
                      <p className="text-[10px] text-neutral-400">{item.specs}</p>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-neutral-200">
                      {item.qty}
                    </td>
                    <td className="py-3 px-4 text-center text-neutral-400 text-[11px] font-sans">
                      {item.unit}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handlePriceChange(item.id, parseFloat(e.target.value))}
                        className="w-28 px-2 py-1 bg-neutral-950 border border-neutral-700 rounded text-right text-xs text-neutral-200 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400 text-xs">
                      {formatRupiah(item.qty * item.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-neutral-950 border-t-2 border-neutral-800 font-mono">
                <tr>
                  <td colSpan={5} className="py-4 px-4 text-right font-bold text-sm text-neutral-200 font-sans">
                    TOTAL ESTIMASI ANGGARAN:
                  </td>
                  <td className="py-4 px-4 text-right font-extrabold text-base text-emerald-400">
                    {formatRupiah(grandTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Practical Fabrication Tips */}
        <div className="p-4 bg-blue-950/30 border border-blue-900/50 rounded-xl text-xs text-blue-200/90 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-blue-300">Tips Fabrikasi dari Tim Kitchen Specialist:</p>
            <ul className="list-disc list-inside space-y-0.5 text-blue-200/80">
              <li>Untuk kabinet bawah wastafel, selalu gunakan triplek tahan air (PVC foam board / marine plywood) atau lapisi bagian dasar dengan aluminium sheet anti-rembes.</li>
              <li>Kompartemen tabung gas wajib memiliki lubang ventilasi di bagian bawah pintu agar gas LPG tidak mengendap bila terjadi kebocoran regulator.</li>
              <li>Pastikan jarak kedalaman bak wastafel ({sink.bowlDepth} cm) tidak mentok ke laci atas kabinet; gunakan false front atau laci potong U-shape untuk jalur sifon.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
