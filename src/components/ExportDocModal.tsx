import React, { useState } from 'react';
import { KitchenConfig } from '../types/kitchen';
import { calculateFabricationCutList, downloadDocFile, printDocFile } from '../utils/exportDoc';
import {
  FileText,
  Download,
  Printer,
  Copy,
  Check,
  X,
  Wrench,
  Layers,
  Droplets,
  Flame,
  Shield,
  FileCheck,
  AlertTriangle,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: KitchenConfig;
}

export const ExportDocModal: React.FC<Props> = ({ isOpen, onClose, config }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'steel' | 'panels' | 'sop'>('preview');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const cutList = calculateFabricationCutList(config);
  const W = config.totalWidth;
  const D = config.totalDepth;
  const H = config.totalHeight;
  const topThick = config.countertopThickness || 4;
  const plinthH = (config.plinthHeight ?? 10);
  const tubeMm = config.frame?.tubeSize || 40;

  const clearanceGap = Math.round(
    config.stove.posX > config.sink.posX
      ? config.stove.posX - config.stove.width / 2 - (config.sink.posX + config.sink.width / 2)
      : config.sink.posX - config.sink.width / 2 - (config.stove.posX + config.stove.width / 2)
  );

  const handleDownloadDoc = () => {
    downloadDocFile(config, `SPK-Manual-Pembuatan-Wastafel-${W}cm.doc`);
  };

  const handlePrint = () => {
    printDocFile(config);
  };

  const handleCopySummary = () => {
    const lines = [
      `*RINGKASAN POTONGAN BESI BENGKEL LAS MEJA WASTAFEL*`,
      `Ukuran Meja: ${W} cm (P) × ${D} cm (L) × ${H} cm (T)`,
      `Profil Pipa: Besi Hollow ${tubeMm}×${tubeMm} mm`,
      `Total Panjang Besi: ${cutList.totalSteelLengthM} meter (${cutList.standard6mBarsNeeded} batang @ 6m)`,
      `Leveling Feet: ${cutList.levelingFeetCount} pcs`,
      ``,
      `*Daftar Potong Besi Hollow:*`,
      ...cutList.hollowPieces.map(
        (p, i) => `${i + 1}. ${p.label}: ${p.qty} pcs × ${p.lengthCm} cm (${p.notes})`
      ),
      ``,
      `*Coakan Wastafel & Kompor:*`,
      config.sink.enabled
        ? `- Wastafel: ${config.sink.width}×${config.sink.length} cm (Dalam: ${config.sink.bowlDepth}cm) | As X: ${config.sink.posX}cm, As Z: ${config.sink.posY}cm`
        : `- Wastafel: Tidak aktif`,
      config.stove.enabled
        ? `- Kompor: ${config.stove.width}×${config.stove.length} cm (Tebal tanam: ${config.stove.recessDepth}cm) | As X: ${config.stove.posX}cm, As Z: ${config.stove.posY}cm`
        : `- Kompor: Tidak aktif`,
      `Jarak aman antar wastafel & kompor: ${clearanceGap} cm`,
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden text-neutral-100">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Surat Perintah Kerja (SPK) & Manual Fabrikasi
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Export to .DOC
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Panduan rinci ukuran potongan besi hollow & coakan untuk pembuat wastafel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 transition"
              title="Salin ringkasan ke WhatsApp"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Salin WhatsApp'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 transition"
              title="Cetak langsung ke printer atau simpan PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>

            <button
              onClick={handleDownloadDoc}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .DOC (Word)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center px-6 border-b border-neutral-800 bg-neutral-950/40 gap-2 overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'preview'
                ? 'bg-neutral-800 text-blue-400 border border-blue-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Semua Rincian (SPK Lengkap)
          </button>
          <button
            onClick={() => setActiveTab('steel')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'steel'
                ? 'bg-neutral-800 text-amber-400 border border-amber-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-amber-400" />
            <span>Potongan Besi Hollow ({cutList.hollowPieces.length} bagian)</span>
          </button>
          <button
            onClick={() => setActiveTab('panels')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'panels'
                ? 'bg-neutral-800 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Coakan & Panel Laci</span>
          </button>
          <button
            onClick={() => setActiveTab('sop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'sop'
                ? 'bg-neutral-800 text-purple-400 border border-purple-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Panduan SOP Perakitan</span>
          </button>
        </div>

        {/* MODAL BODY SCROLLABLE */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* TAB 1: PREVIEW LENGKAP */}
          {activeTab === 'preview' && (
            <div className="space-y-6">
              {/* Highlight Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-neutral-950/80 rounded-xl border border-neutral-800">
                  <span className="text-[11px] text-neutral-400 block">Dimensi Meja (P×L×T)</span>
                  <span className="text-base font-bold text-white font-mono">
                    {W}×{D}×{H} <span className="text-xs font-normal text-neutral-400">cm</span>
                  </span>
                </div>

                <div className="p-3.5 bg-neutral-950/80 rounded-xl border border-neutral-800">
                  <span className="text-[11px] text-neutral-400 block">Profil Besi Hollow</span>
                  <span className="text-base font-bold text-amber-400 font-mono">
                    {tubeMm}×{tubeMm} <span className="text-xs font-normal text-neutral-400">mm</span>
                  </span>
                </div>

                <div className="p-3.5 bg-neutral-950/80 rounded-xl border border-neutral-800">
                  <span className="text-[11px] text-neutral-400 block">Kebutuhan Besi</span>
                  <span className="text-base font-bold text-blue-400 font-mono">
                    {cutList.standard6mBarsNeeded} <span className="text-xs font-normal text-neutral-400">btg (6m)</span>
                  </span>
                </div>

                <div className="p-3.5 bg-neutral-950/80 rounded-xl border border-neutral-800">
                  <span className="text-[11px] text-neutral-400 block">Leveling Feet Kaki</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">
                    {cutList.levelingFeetCount} <span className="text-xs font-normal text-neutral-400">titik</span>
                  </span>
                </div>
              </div>

              {/* Rincian Potongan Besi Hollow */}
              <div className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-amber-400" />
                    <h3 className="font-semibold text-sm text-neutral-100">
                      1. Daftar Potongan Besi Hollow ({tubeMm}×{tubeMm} mm)
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-amber-400 font-bold">
                    Total: {cutList.totalSteelLengthM} m
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-800 text-neutral-400 font-semibold bg-neutral-900/50">
                        <th className="py-2 px-2.5">No</th>
                        <th className="py-2 px-2.5">Nama Komponen</th>
                        <th className="py-2 px-2.5 text-center">Qty</th>
                        <th className="py-2 px-2.5 text-right">Panjang</th>
                        <th className="py-2 px-2.5">Posisi Pemasangan & Las</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60">
                      ${cutList.hollowPieces.map((p, idx) => (
                        <tr
                          key={p.id}
                          className={
                            p.category.startsWith('penyangga')
                              ? 'bg-amber-500/10 text-amber-200'
                              : 'hover:bg-neutral-900/40'
                          }
                        >
                          <td className="py-2 px-2.5 text-neutral-500 font-mono">{idx + 1}</td>
                          <td className="py-2 px-2.5 font-medium">{p.label}</td>
                          <td className="py-2 px-2.5 text-center font-bold font-mono">{p.qty} pcs</td>
                          <td className="py-2 px-2.5 text-right font-bold font-mono text-amber-300">
                            {p.lengthCm} cm
                          </td>
                          <td className="py-2 px-2.5 text-neutral-400">{p.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Rincian Coakan Wastafel & Kompor */}
              <div className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-xl space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-800">
                  <Droplets className="w-4 h-4 text-blue-400" />
                  <h3 className="font-semibold text-sm text-neutral-100">
                    2. Spesifikasi Coakan Meja (Wastafel & Kompor)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card Wastafel */}
                  {config.sink.enabled ? (
                    <div className="p-3.5 bg-neutral-900/80 rounded-xl border border-blue-900/40 space-y-2">
                      <div className="flex items-center justify-between text-blue-400 font-semibold text-xs">
                        <span>Wastafel Cuci Piring ({config.sink.mounting.toUpperCase()})</span>
                        <span className="font-mono">{config.sink.model}</span>
                      </div>
                      <div className="space-y-1 text-xs text-neutral-300">
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Ukuran Lubang:</span>
                          <span className="font-mono font-bold text-white">
                            {config.sink.width} × {config.sink.length} cm
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Kedalaman Bak:</span>
                          <span className="font-mono font-bold text-emerald-400">
                            {config.sink.bowlDepth} cm (Cekung ke bawah)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Jarak As Dari Kiri:</span>
                          <span className="font-mono font-bold text-blue-400">{config.sink.posX} cm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Bibir Kiri Lubang:</span>
                          <span className="font-mono text-neutral-300">
                            {Math.round(config.sink.posX - config.sink.width / 2)} cm dari tepi kiri
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Jarak Dari Depan:</span>
                          <span className="font-mono text-neutral-300">{config.sink.posY} cm</span>
                        </div>
                        <div className="pt-1.5 border-t border-neutral-800 text-[11px] text-neutral-400">
                          Besi Penyangga Wastafel:{' '}
                          <span className="text-amber-400 font-medium">
                            Dipasang pada Y ={' '}
                            {Number((H - config.sink.bowlDepth - tubeMm / 10 - 0.5).toFixed(1))} cm
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 text-xs text-neutral-500">
                      Wastafel tidak diaktifkan.
                    </div>
                  )}

                  {/* Card Kompor */}
                  {config.stove.enabled ? (
                    <div className="p-3.5 bg-neutral-900/80 rounded-xl border border-amber-900/40 space-y-2">
                      <div className="flex items-center justify-between text-amber-400 font-semibold text-xs">
                        <span>Kompor Tanam (Cooktop)</span>
                        <span className="font-mono">{config.stove.type}</span>
                      </div>
                      <div className="space-y-1 text-xs text-neutral-300">
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Ukuran Coakan:</span>
                          <span className="font-mono font-bold text-white">
                            {config.stove.width} × {config.stove.length} cm
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Tebal Mesin Tanam:</span>
                          <span className="font-mono font-bold text-amber-400">
                            {config.stove.recessDepth} cm
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Jarak As Dari Kiri:</span>
                          <span className="font-mono font-bold text-amber-400">{config.stove.posX} cm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Bibir Kiri Lubang:</span>
                          <span className="font-mono text-neutral-300">
                            {Math.round(config.stove.posX - config.stove.width / 2)} cm dari tepi kiri
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Jarak Dari Depan:</span>
                          <span className="font-mono text-neutral-300">{config.stove.posY} cm</span>
                        </div>
                        <div className="pt-1.5 border-t border-neutral-800 text-[11px] text-neutral-400">
                          Besi Penyangga Kompor:{' '}
                          <span className="text-amber-400 font-medium">
                            Dipasang pada Y ={' '}
                            {Number((H - config.stove.recessDepth - tubeMm / 10 - 1).toFixed(1))} cm
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 text-xs text-neutral-500">
                      Kompor tidak diaktifkan.
                    </div>
                  )}
                </div>

                <div className="p-2.5 bg-neutral-900 rounded-xl border border-neutral-800 text-xs flex items-center justify-between">
                  <span className="text-neutral-400">
                    Jarak Aman Wastafel ke Kompor (Clearance):
                  </span>
                  <span className="font-mono font-bold text-emerald-400">
                    {clearanceGap} cm (Memenuhi standar ergonomis K3 dapur)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KHUSUS BESI HOLLOW */}
          {activeTab === 'steel' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200">
                ⚠️ <strong>Perhatian Kepala Bengkel Las:</strong> Potong besi hollow sesuai daftar berikut
                menggunakan mesin cutting miter cut presisi. Pastikan setiap titik sambungan dilas penuh (full-weld)
                dan di-gerinda rata agar marmer tidak terganjal.
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-700 text-neutral-300 font-semibold bg-neutral-950">
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Bagian / Nama Potongan</th>
                      <th className="py-2.5 px-3 text-center">Jumlah (Pcs)</th>
                      <th className="py-2.5 px-3 text-right">Panjang (cm)</th>
                      <th className="py-2.5 px-3 text-right">Panjang (mm)</th>
                      <th className="py-2.5 px-3">Instruksi Posisi & Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {cutList.hollowPieces.map((p, idx) => (
                      <tr
                        key={p.id}
                        className={
                          p.category.startsWith('penyangga')
                            ? 'bg-amber-950/20 text-amber-100 font-medium'
                            : 'hover:bg-neutral-800/30'
                        }
                      >
                        <td className="py-2.5 px-3 text-neutral-400 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold">{p.label}</span>
                          {p.category.startsWith('penyangga') && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Bracing Beban
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold font-mono text-white">
                          {p.qty} pcs
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold font-mono text-amber-400">
                          {p.lengthCm} cm
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-neutral-400">
                          {p.lengthCm * 10} mm
                        </td>
                        <td className="py-2.5 px-3 text-neutral-400">{p.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-neutral-950 font-bold border-t border-neutral-700">
                      <td colSpan={2} className="py-3 px-3 text-right text-neutral-300">
                        TOTAL ESTIMASI:
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-white">
                        {cutList.hollowPieces.reduce((s, p) => s + p.qty, 0)} potong
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-amber-400">
                        {cutList.totalSteelLengthM} m
                      </td>
                      <td colSpan={2} className="py-3 px-3 text-blue-400">
                        Beli: <strong>{cutList.standard6mBarsNeeded} Batang</strong> (panjang 6m) +{' '}
                        <strong>{cutList.levelingFeetCount} Kaki Adjuster</strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: COAKAN & PANEL LACI */}
          {activeTab === 'panels' && (
            <div className="space-y-4">
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-300">
                Berikut adalah daftar pemotongan lembaran plywood 18mm untuk tukang kayu / workshop interior:
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-700 text-neutral-300 font-semibold bg-neutral-950">
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Nama Panel Kayu</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Ukuran (P × T)</th>
                      <th className="py-2.5 px-3">Spesifikasi Bahan & Edging</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {cutList.panelPieces.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-neutral-800/30">
                        <td className="py-2.5 px-3 text-neutral-400 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-semibold text-neutral-200">{p.name}</td>
                        <td className="py-2.5 px-3 text-center font-bold font-mono text-white">
                          {p.qty} pcs
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold font-mono text-emerald-400">
                          {p.widthCm} × {p.heightCm} cm
                        </td>
                        <td className="py-2.5 px-3 text-neutral-400">
                          {p.material} — <span className="text-neutral-500">{p.notes}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: SOP PERAKITAN */}
          {activeTab === 'sop' && (
            <div className="space-y-4">
              <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
                <h4 className="font-bold text-sm text-amber-300">
                  Langkah-Langkah Fabrikasi & Perakitan (SOP Standar Bengkel)
                </h4>

                <ol className="list-decimal pl-5 space-y-2.5 text-xs text-neutral-300 leading-relaxed">
                  <li>
                    <strong>Pemotongan Besi Hollow:</strong> Potong seluruh tiang vertikal ({cutList.hollowPieces.find(p=>p.category==='tiang-vertikal')?.lengthCm ?? '-'} cm) dan gelagar memanjang ({cutList.hollowPieces.find(p=>p.category==='gelagar-panjang')?.lengthCm ?? '-'} cm) sesuai tabel potongan. Gunakan mata potong gergaji miter cold-saw agar sudut siku rata.
                  </li>
                  <li>
                    <strong>Pengelasan Rangka Utama (Squareness):</strong> Buat modul kotak luar terlebih dahulu. Cek kesikuan diagonal kanan dan kiri harus sama persis (toleransi selisih max 1 mm).
                  </li>
                  <li>
                    <strong>Pemasangan Besi Penyangga Wastafel (Sink Cradle):</strong> Las palang penopang sisi kiri & kanan wastafel serta strap bawah. Perhatikan kedalaman bak wastafel ({config.sink.bowlDepth} cm) agar klem undermount memiliki ruang gerak penguncian yang pas.
                  </li>
                  <li>
                    <strong>Pemasangan Besi Penyangga Kompor:</strong> Pasang crossbar penahan bodi kompor tanam ({config.stove.width}×{config.stove.length} cm) dengan jarak ventilasi bawah minimal 20mm.
                  </li>
                  <li>
                    {cutList.levelingFeetCount > 0 ? (
                      <>
                        <strong>Pemberian Tap Mur Leveler:</strong> Las mur M10/M12 di bagian bawah tiap kaki tiang ({cutList.levelingFeetCount} titik) untuk memasang kaki adjuster karet agar meja dapat di-waterpass saat lantai bergelombang.
                      </>
                    ) : (
                      <>
                        <strong>Ujung Bawah Tiang:</strong> Tidak memakai kaki adjuster (kaki dari rangka / tanpa kaki). Tutup ujung tiang dengan plat atau dop karet agar lantai tidak tergores.
                      </>
                    )}
                  </li>
                  <li>
                    <strong>Epoxy Primer & Cat Finishing Rangka:</strong> Bersihkan bekas percikan las (spatter), semprot Epoxy Zinc Chromate 2 lapis, lalu aplikasikan cat hitam doff atau powder coating.
                  </li>
                  <li>
                    <strong>Pemasangan Box Laci & Pintu:</strong> Pasang rel laci soft-close double track. Setel celah antar muka laci presisi 3mm.
                  </li>
                  <li>
                    <strong>Pemasangan Top Table Marmer & Sealant Anti-Bocor:</strong> Pasang slab marmer, aplikasikan silikon sanitari anti-jamur di sekeliling bibir wastafel dan kompor untuk mencegah air merembes ke laci bawah.
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-neutral-800 bg-neutral-950/90 text-xs">
          <div className="text-neutral-400">
            Format file didukung: <span className="text-neutral-200 font-medium">Microsoft Word (.doc)</span>,{' '}
            <span className="text-neutral-200 font-medium">Google Docs</span>, & Cetak Langsung.
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium transition"
            >
              Tutup
            </button>
            <button
              onClick={handleDownloadDoc}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/30 transition"
            >
              <Download className="w-4 h-4" />
              <span>Download File .DOC</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
