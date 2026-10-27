import React, { useState, useEffect } from 'react';
import {
  KitchenConfig,
  DEFAULT_KITCHEN_CONFIG,
  KITCHEN_PRESETS,
  KitchenPreset,
} from './types/kitchen';
import { ThreeKitchenScene } from './components/ThreeKitchenScene';
import { BlueprintView2D } from './components/BlueprintView2D';
import { BillOfMaterials } from './components/BillOfMaterials';
import { DimensionControls } from './components/DimensionControls';
import { ApplianceControls } from './components/ApplianceControls';
import { MaterialControls } from './components/MaterialControls';
import { BottomSimulationDock } from './components/BottomSimulationDock';
import { PresetModal } from './components/PresetModal';
import { ExportDocModal } from './components/ExportDocModal';
import {
  Box,
  Layers,
  Calculator,
  Sliders,
  Droplets,
  Flame,
  Palette,
  RotateCcw,
  Save,
  Download,
  Upload,
  Camera,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  CheckCircle,
  FileText,
} from 'lucide-react';

type ViewMode = '3d' | 'blueprint' | 'rab';
type SidebarTab = 'dimensions' | 'appliances' | 'materials';

export default function App() {
  const [config, setConfig] = useState<KitchenConfig>(() => {
    const saved = localStorage.getItem('kitchencraft_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_KITCHEN_CONFIG,
          ...parsed,
          frame: {
            ...DEFAULT_KITCHEN_CONFIG.frame,
            ...(parsed.frame || {}),
          },
          lighting: {
            ...DEFAULT_KITCHEN_CONFIG.lighting,
            ...(parsed.lighting || {}),
          },
        };
      } catch (e) {
        console.error('Failed to parse saved config', e);
      }
    }
    return DEFAULT_KITCHEN_CONFIG;
  });

  const [viewMode, setViewMode] = useState<ViewMode>('3d');
  const [activeTab, setActiveTab] = useState<SidebarTab>('dimensions');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [currentPresetId, setCurrentPresetId] = useState<string>('family-standard');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-save to LocalStorage
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const updateConfig = (updates: Partial<KitchenConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem('kitchencraft_config', JSON.stringify(next));
      return next;
    });
  };

  const handleSelectPreset = (preset: KitchenPreset) => {
    setCurrentPresetId(preset.id);
    updateConfig({
      ...DEFAULT_KITCHEN_CONFIG,
      ...preset.config,
    });
    showToast(`Preset "${preset.name}" berhasil dimuat!`);
  };

  const handleReset = () => {
    if (window.confirm('Reset seluruh konfigurasi meja dapur ke setelan awal?')) {
      setConfig(DEFAULT_KITCHEN_CONFIG);
      localStorage.setItem('kitchencraft_config', JSON.stringify(DEFAULT_KITCHEN_CONFIG));
      showToast('Desain di-reset ke standar.');
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `desain-meja-dapur-${config.totalWidth}cm.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('File desain .json berhasil diunduh!');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.totalWidth && parsed.columns) {
          setConfig(parsed);
          localStorage.setItem('kitchencraft_config', JSON.stringify(parsed));
          showToast('Desain berhasil diimpor!');
        } else {
          alert('Format file JSON tidak sesuai struktur desain dapur.');
        }
      } catch (err) {
        alert('Gagal membaca file JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset
  };

  const handleCaptureScreenshot = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      showToast('Beralihlah ke mode 3D untuk mengambil tangkapan layar.');
      return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `kitchen-design-3d-${Date.now()}.png`;
    a.click();
    showToast('Gambar foto 3D berhasil disimpan!');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0b0d11] text-neutral-100 overflow-hidden font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-neutral-900/95 border border-emerald-500/40 rounded-xl shadow-2xl text-xs font-medium text-emerald-300 backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP APPLICATION NAVBAR */}
      <header className="h-14 border-b border-white/[0.08] bg-[#0f1218]/90 backdrop-blur-xl px-4 flex items-center justify-between z-20 shrink-0 select-none">
        {/* Left: Branding, Realtime Specs & Preset Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition lg:hidden"
            title="Buka/Tutup Panel Kontrol"
          >
            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center shadow-md shadow-amber-600/20 ring-1 ring-white/20">
              <Box className="w-4.5 h-4.5 text-neutral-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-white">
                  KitchenCraft
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400/90 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                  3D Studio
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 hidden xl:flex items-center gap-1.5">
                <span>{config.totalWidth} × {config.totalDepth} × {config.totalHeight} cm</span>
                <span className="text-neutral-600">·</span>
                <span>{config.columns.length} Modul</span>
                <span className="text-neutral-600">·</span>
                <span className="text-neutral-300">Rangka Hollow</span>
              </p>
            </div>
          </div>

          <div className="h-5 w-px bg-white/10 mx-1 hidden sm:block" />

          {/* Preset Button */}
          <button
            onClick={() => setIsPresetModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-amber-300 hover:text-amber-200 text-xs font-medium rounded-lg border border-amber-500/30 transition shadow-sm cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Preset Desain</span>
          </button>
        </div>

        {/* Center: View Mode Tabs */}
        <div className="flex items-center p-1 bg-black/40 rounded-xl border border-white/5">
          <button
            onClick={() => setViewMode('3d')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              viewMode === '3d'
                ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/10'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Box className="w-3.5 h-3.5 text-amber-400" />
            <span>3D Visual</span>
          </button>
          <button
            onClick={() => setViewMode('blueprint')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              viewMode === 'blueprint'
                ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/10'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Blueprint CAD</span>
          </button>
          <button
            onClick={() => setViewMode('rab')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              viewMode === 'rab'
                ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/10'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Calculator className="w-3.5 h-3.5 text-purple-400" />
            <span>RAB & Bahan</span>
          </button>
        </div>

        {/* Right: File Actions & Screenshot */}
        <div className="flex items-center gap-1.5">
          {/* Export to DOC Button */}
          <button
            onClick={() => setIsDocModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-blue-900/30 ring-1 ring-white/20 transition cursor-pointer mr-1"
            title="Buka Dokumen SPK & Potongan Besi untuk Pembuat Wastafel (Export to .DOC)"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Export to DOC</span>
          </button>

          <button
            onClick={handleCaptureScreenshot}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
            title="Ambil Foto Screenshot 3D"
          >
            <Camera className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportJSON}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
            title="Simpan / Ekspor File Desain (.json)"
          >
            <Download className="w-4 h-4" />
          </button>

          <label
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 cursor-pointer transition"
            title="Buka / Impor File Desain (.json)"
          >
            <Upload className="w-4 h-4" />
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          <button
            onClick={handleReset}
            className="p-2 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-white/5 transition cursor-pointer"
            title="Reset ke Pengaturan Awal"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN WORKSPACE BODY */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT CUSTOMIZATION SIDEBAR */}
        <aside
          className={`${
            isSidebarOpen ? 'w-80 md:w-96' : 'w-0'
          } shrink-0 bg-[#0e1117] border-r border-white/[0.08] flex flex-col transition-all duration-200 ease-in-out overflow-hidden z-20`}
        >
          {/* Sidebar Tab Header */}
          <div className="p-2.5 border-b border-white/[0.08] bg-[#0b0d12]/60 backdrop-blur-md">
            <div className="grid grid-cols-3 gap-1 p-1 bg-black/40 rounded-xl border border-white/5">
              <button
                onClick={() => setActiveTab('dimensions')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeTab === 'dimensions'
                    ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                title="Atur ukuran meja, kolom, dan laci"
              >
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                <span>Dimensi</span>
              </button>
              <button
                onClick={() => setActiveTab('appliances')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeTab === 'appliances'
                    ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                title="Atur posisi dan kedalaman wastafel & kompor"
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Wastafel</span>
              </button>
              <button
                onClick={() => setActiveTab('materials')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeTab === 'materials'
                    ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                title="Pilih marmer granit, warna kabinet & rangka"
              >
                <Palette className="w-3.5 h-3.5 text-purple-400" />
                <span>Material</span>
              </button>
            </div>
          </div>

          {/* Sidebar Tab Content */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
            {activeTab === 'dimensions' && (
              <DimensionControls config={config} onChange={updateConfig} />
            )}
            {activeTab === 'appliances' && (
              <ApplianceControls
                config={config}
                onChange={updateConfig}
                onOpenDocModal={() => setIsDocModalOpen(true)}
              />
            )}
            {activeTab === 'materials' && (
              <MaterialControls config={config} onChange={updateConfig} />
            )}
          </div>
        </aside>

        {/* CENTER VIEWPORT (3D SCENE / BLUEPRINT / RAB) */}
        <main className="flex-1 relative h-full w-full overflow-hidden flex flex-col">
          {viewMode === '3d' && (
            <>
              <ThreeKitchenScene config={config} />
              <BottomSimulationDock config={config} onChange={updateConfig} />
            </>
          )}

          {viewMode === 'blueprint' && (
            <div className="w-full h-full overflow-hidden">
              <BlueprintView2D config={config} />
            </div>
          )}

          {viewMode === 'rab' && (
            <div className="w-full h-full overflow-hidden">
              <BillOfMaterials config={config} onOpenDocModal={() => setIsDocModalOpen(true)} />
            </div>
          )}
        </main>
      </div>

      {/* Preset Modal */}
      <PresetModal
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        onSelectPreset={handleSelectPreset}
        currentPresetId={currentPresetId}
      />

      {/* Export to Word .DOC & Manual Fabrikasi Modal */}
      <ExportDocModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        config={config}
      />
    </div>
  );
}
