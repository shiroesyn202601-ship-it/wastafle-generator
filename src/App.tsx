import React, { useState } from 'react';
import { KitchenConfig, DEFAULT_KITCHEN_CONFIG, KitchenPreset } from './types/kitchen';
import { ThreeKitchenScene } from './components/ThreeKitchenScene';
import { BlueprintView2D } from './components/BlueprintView2D';
import { BillOfMaterials } from './components/BillOfMaterials';
import { DimensionControls } from './components/DimensionControls';
import { ApplianceControls } from './components/ApplianceControls';
import { MaterialControls } from './components/MaterialControls';
import { BottomSimulationDock } from './components/BottomSimulationDock';
import { PresetModal } from './components/PresetModal';
import { ExportDocModal } from './components/ExportDocModal';
import { FrameEditor2D } from './components/FrameEditor2D';
import { DriveModal } from './components/DriveModal';
import { DriveFile } from './utils/googleDrive';
import {
  Box,
  Layers,
  Calculator,
  Sliders,
  Flame,
  Palette,
  RotateCcw,
  Download,
  Upload,
  Camera,
  Sparkles,
  CheckCircle,
  FileText,
  Grid3x3,
  Cloud,
  MoreVertical,
  X,
  SlidersHorizontal,
} from 'lucide-react';

type ViewMode = '3d' | 'frame' | 'blueprint' | 'rab';
type SidebarTab = 'dimensions' | 'appliances' | 'materials';

const LS_CONFIG = 'kitchencraft_config';
const LS_DRIVE_FILE = 'kitchencraft_drive_file';

/** Lengkapi desain hasil simpan/impor dengan nilai default untuk field yang belum ada */
function normalizeConfig(parsed: any): KitchenConfig {
  return {
    ...DEFAULT_KITCHEN_CONFIG,
    ...parsed,
    frame: { ...DEFAULT_KITCHEN_CONFIG.frame, ...(parsed.frame || {}) },
    lighting: { ...DEFAULT_KITCHEN_CONFIG.lighting, ...(parsed.lighting || {}) },
  };
}

const isKitchenConfig = (data: any) => !!data && typeof data === 'object' && !!data.totalWidth && Array.isArray(data.columns);

const safeSet = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // penyimpanan browser tidak tersedia
  }
};

const VIEW_TABS: { id: ViewMode; label: string; short: string; icon: React.ReactNode }[] = [
  { id: '3d', label: '3D Visual', short: '3D', icon: <Box className="w-4 h-4 text-amber-400" /> },
  { id: 'frame', label: 'Editor Rangka 2D', short: 'Rangka', icon: <Grid3x3 className="w-4 h-4 text-orange-400" /> },
  { id: 'blueprint', label: 'Blueprint CAD', short: 'Blueprint', icon: <Layers className="w-4 h-4 text-emerald-400" /> },
  { id: 'rab', label: 'RAB & Bahan', short: 'RAB', icon: <Calculator className="w-4 h-4 text-purple-400" /> },
];

const SIDEBAR_TABS: { id: SidebarTab; label: string; title: string; icon: React.ReactNode }[] = [
  { id: 'dimensions', label: 'Dimensi', title: 'Atur ukuran meja, kolom, dan laci', icon: <Sliders className="w-3.5 h-3.5 text-blue-400" /> },
  { id: 'appliances', label: 'Wastafel', title: 'Atur posisi dan kedalaman wastafel & kompor', icon: <Flame className="w-3.5 h-3.5 text-amber-400" /> },
  { id: 'materials', label: 'Material', title: 'Pilih top table, warna kabinet & rangka', icon: <Palette className="w-3.5 h-3.5 text-purple-400" /> },
];

export default function App() {
  const [config, setConfig] = useState<KitchenConfig>(() => {
    try {
      const saved = localStorage.getItem(LS_CONFIG);
      if (saved) return normalizeConfig(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to parse saved config', e);
    }
    return DEFAULT_KITCHEN_CONFIG;
  });

  // ?view=frame|blueprint|rab membuka tampilan tertentu langsung
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const v = new URLSearchParams(window.location.search).get('view');
    return VIEW_TABS.some((t) => t.id === v) ? (v as ViewMode) : '3d';
  });
  const [activeTab, setActiveTab] = useState<SidebarTab>('dimensions');
  const [isPanelOpen, setIsPanelOpen] = useState(false); // panel kontrol di layar kecil (bottom sheet)
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [currentPresetId, setCurrentPresetId] = useState<string>('family-standard');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [driveFile, setDriveFile] = useState<DriveFile | null>(() => {
    try {
      const raw = localStorage.getItem(LS_DRIVE_FILE);
      return raw ? (JSON.parse(raw) as DriveFile) : null;
    } catch {
      return null;
    }
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Simpan otomatis ke localStorage
  const updateConfig = (updates: Partial<KitchenConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...updates };
      safeSet(LS_CONFIG, JSON.stringify(next));
      return next;
    });
  };

  const replaceConfig = (next: KitchenConfig) => {
    setConfig(next);
    safeSet(LS_CONFIG, JSON.stringify(next));
  };

  const handleDriveFileChange = (file: DriveFile | null) => {
    setDriveFile(file);
    safeSet(LS_DRIVE_FILE, file ? JSON.stringify(file) : null);
  };

  const handleSelectPreset = (preset: KitchenPreset) => {
    setCurrentPresetId(preset.id);
    updateConfig({ ...DEFAULT_KITCHEN_CONFIG, ...preset.config });
    showToast(`Preset "${preset.name}" berhasil dimuat!`);
  };

  const handleReset = () => {
    if (window.confirm('Reset seluruh konfigurasi meja dapur ke setelan awal?')) {
      replaceConfig(DEFAULT_KITCHEN_CONFIG);
      showToast('Desain di-reset ke standar.');
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(config, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `desain-meja-dapur-${config.totalWidth}cm.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('File desain .json berhasil diunduh!');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (isKitchenConfig(parsed)) {
          replaceConfig(normalizeConfig(parsed));
          handleDriveFileChange(null);
          showToast('Desain berhasil diimpor!');
        } else {
          alert('Format file JSON tidak sesuai struktur desain dapur.');
        }
      } catch {
        alert('Gagal membaca file JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDriveLoad = (data: unknown, file: DriveFile) => {
    if (!isKitchenConfig(data)) {
      alert(`File "${file.name}" bukan desain meja dapur yang valid.`);
      return;
    }
    replaceConfig(normalizeConfig(data));
    handleDriveFileChange(file);
    showToast(`Desain "${file.name}" dibuka dari Google Drive`);
  };

  const handleCaptureScreenshot = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      showToast('Beralihlah ke mode 3D untuk mengambil tangkapan layar.');
      return;
    }
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `kitchen-design-3d-${Date.now()}.png`;
    a.click();
    showToast('Gambar foto 3D berhasil disimpan!');
  };

  const fileActions = [
    { label: 'Foto Screenshot 3D', icon: <Camera className="w-4 h-4" />, onClick: handleCaptureScreenshot },
    { label: 'Unduh File .json', icon: <Download className="w-4 h-4" />, onClick: handleExportJSON },
  ];

  const openPanel = (tab?: SidebarTab) => {
    if (tab) setActiveTab(tab);
    setIsPanelOpen(true);
  };

  return (
    <div className="flex flex-col h-[100dvh] w-screen bg-[#0b0d11] text-neutral-100 overflow-hidden font-sans">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-16 left-3 right-3 sm:left-auto sm:right-6 z-[60] flex items-center gap-2.5 px-4 py-2.5 bg-neutral-900/95 border border-emerald-500/40 rounded-xl shadow-2xl text-xs font-medium text-emerald-300 backdrop-blur-xl">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* NAVBAR ATAS */}
      <header className="h-14 border-b border-white/[0.08] bg-[#0f1218]/90 backdrop-blur-xl px-3 sm:px-4 flex items-center justify-between gap-2 z-30 shrink-0 select-none">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center shadow-md shadow-amber-600/20 ring-1 ring-white/20">
            <Box className="w-4.5 h-4.5 text-neutral-950" />
          </div>
          <div className="min-w-0 hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-white">KitchenCraft</span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400/90 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                3D Studio
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 hidden xl:flex items-center gap-1.5">
              <span>
                {config.totalWidth} × {config.totalDepth} × {config.totalHeight} cm
              </span>
              <span className="text-neutral-600">·</span>
              <span>{config.columns.length} Modul</span>
              <span className="text-neutral-600">·</span>
              <span className="text-neutral-300">{config.frame?.customLayout ? 'Rangka Manual' : 'Rangka Otomatis'}</span>
            </p>
          </div>

          <button
            onClick={() => setIsPresetModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white/5 hover:bg-white/10 text-amber-300 text-xs font-medium rounded-lg border border-amber-500/30 transition cursor-pointer shrink-0"
            title="Preset Desain"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Preset</span>
          </button>
        </div>

        {/* Tab tampilan (layar lebar) */}
        <nav className="hidden lg:flex items-center p-1 bg-black/40 rounded-xl border border-white/5">
          {VIEW_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setViewMode(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                viewMode === t.id ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/10' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        {/* Aksi file */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            onClick={() => setIsDriveModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white/5 hover:bg-white/10 text-sky-300 text-xs font-semibold rounded-lg border border-sky-500/30 transition cursor-pointer"
            title={driveFile ? `Google Drive (file aktif: ${driveFile.name})` : 'Simpan & buka dari Google Drive'}
          >
            <Cloud className="w-4 h-4" />
            <span className="hidden md:inline">Drive</span>
          </button>

          <button
            onClick={() => setIsDocModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-blue-900/30 ring-1 ring-white/20 transition cursor-pointer"
            title="Dokumen SPK & potongan besi (Export .DOC)"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden md:inline">Export DOC</span>
          </button>

          <div className="hidden md:flex items-center gap-1">
            {fileActions.map((a) => (
              <button key={a.label} onClick={a.onClick} className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition cursor-pointer" title={a.label}>
                {a.icon}
              </button>
            ))}
            <label className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 cursor-pointer transition" title="Buka / Impor File Desain (.json)">
              <Upload className="w-4 h-4" />
              <input type="file" accept=".json,application/json" onChange={handleImportJSON} className="hidden" />
            </label>
            <button onClick={handleReset} className="p-2 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-white/5 transition cursor-pointer" title="Reset ke Pengaturan Awal">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Menu lainnya (layar kecil) */}
          <div className="relative md:hidden">
            <button onClick={() => setIsMoreOpen(!isMoreOpen)} className="p-2 rounded-lg text-neutral-300 hover:bg-white/5 cursor-pointer" title="Menu lainnya">
              <MoreVertical className="w-4.5 h-4.5" />
            </button>
            {isMoreOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsMoreOpen(false)} />
                <div className="absolute right-0 top-11 z-50 w-56 p-1.5 bg-[#151922] border border-white/10 rounded-xl shadow-2xl">
                  {fileActions.map((a) => (
                    <button
                      key={a.label}
                      onClick={() => {
                        setIsMoreOpen(false);
                        a.onClick();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-neutral-200 hover:bg-white/5 cursor-pointer"
                    >
                      {a.icon} {a.label}
                    </button>
                  ))}
                  <label className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-neutral-200 hover:bg-white/5 cursor-pointer">
                    <Upload className="w-4 h-4" /> Buka File .json
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={(e) => {
                        setIsMoreOpen(false);
                        handleImportJSON(e);
                      }}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={() => {
                      setIsMoreOpen(false);
                      handleReset();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-rose-300 hover:bg-white/5 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" /> Reset ke Awal
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* AREA KERJA */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Latar gelap saat panel terbuka di layar kecil */}
        {isPanelOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setIsPanelOpen(false)} />}

        {/* PANEL KONTROL: sidebar di layar lebar, bottom sheet di HP */}
        <aside
          className={`fixed lg:static inset-x-0 bottom-14 lg:bottom-auto z-40 lg:z-20 h-[72dvh] lg:h-auto w-full lg:w-96 shrink-0 bg-[#0e1117] border-t lg:border-t-0 lg:border-r border-white/[0.08] rounded-t-2xl lg:rounded-none flex flex-col shadow-2xl lg:shadow-none transition-transform duration-200 ease-out ${
            isPanelOpen ? 'translate-y-0' : 'translate-y-[110%] lg:translate-y-0'
          }`}
        >
          <div className="lg:hidden flex justify-center pt-2">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>
          <div className="p-2.5 border-b border-white/[0.08] bg-[#0b0d12]/60 flex items-center gap-2">
            <div className="flex-1 grid grid-cols-3 gap-1 p-1 bg-black/40 rounded-xl border border-white/5">
              {SIDEBAR_TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                    activeTab === t.id ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10' : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                  title={t.title}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setIsPanelOpen(false)} className="lg:hidden p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 cursor-pointer" title="Tutup panel">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-3.5 space-y-4">
            {activeTab === 'dimensions' && <DimensionControls config={config} onChange={updateConfig} />}
            {activeTab === 'appliances' && (
              <ApplianceControls config={config} onChange={updateConfig} onOpenDocModal={() => setIsDocModalOpen(true)} />
            )}
            {activeTab === 'materials' && (
              <MaterialControls
                config={config}
                onChange={updateConfig}
                onOpenFrameEditor={() => {
                  setViewMode('frame');
                  setIsPanelOpen(false);
                }}
              />
            )}
          </div>
        </aside>

        {/* VIEWPORT */}
        <main className="flex-1 relative h-full w-full overflow-hidden flex flex-col pb-14 lg:pb-0">
          {viewMode === '3d' && (
            <>
              <ThreeKitchenScene config={config} />
              <BottomSimulationDock config={config} onChange={updateConfig} />
            </>
          )}
          {viewMode === 'frame' && (
            <div className="w-full h-full overflow-hidden">
              <FrameEditor2D config={config} onChange={updateConfig} />
            </div>
          )}
          {viewMode === 'blueprint' && (
            <div className="w-full h-full overflow-hidden">
              <BlueprintView2D config={config} onChange={updateConfig} />
            </div>
          )}
          {viewMode === 'rab' && (
            <div className="w-full h-full overflow-hidden">
              <BillOfMaterials config={config} onOpenDocModal={() => setIsDocModalOpen(true)} />
            </div>
          )}
        </main>
      </div>

      {/* NAVIGASI BAWAH (HP & tablet) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 h-14 grid grid-cols-5 bg-[#0f1218]/95 backdrop-blur-xl border-t border-white/[0.08] select-none">
        <button
          onClick={() => (isPanelOpen ? setIsPanelOpen(false) : openPanel())}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium cursor-pointer ${isPanelOpen ? 'text-amber-300' : 'text-neutral-400'}`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Atur
        </button>
        {VIEW_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setViewMode(t.id);
              setIsPanelOpen(false);
            }}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium cursor-pointer ${
              viewMode === t.id && !isPanelOpen ? 'text-white' : 'text-neutral-500'
            }`}
          >
            {t.icon}
            {t.short}
          </button>
        ))}
      </nav>

      <PresetModal
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        onSelectPreset={handleSelectPreset}
        currentPresetId={currentPresetId}
      />

      <ExportDocModal isOpen={isDocModalOpen} onClose={() => setIsDocModalOpen(false)} config={config} />

      <DriveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        config={config}
        onLoad={handleDriveLoad}
        currentFile={driveFile}
        onCurrentFileChange={handleDriveFileChange}
        onToast={showToast}
      />
    </div>
  );
}
