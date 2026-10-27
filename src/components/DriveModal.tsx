import React, { useEffect, useState } from 'react';
import { X, Cloud, CloudUpload, RefreshCw, FolderOpen, Save, Trash2, LogOut, KeyRound, Loader2 } from 'lucide-react';
import { KitchenConfig } from '../types/kitchen';
import {
  DriveFile,
  getClientId,
  isClientIdFromBuild,
  setClientIdOverride,
  loadGoogleIdentity,
  isConnected,
  connectDrive,
  disconnectDrive,
  listDesigns,
  saveNewDesign,
  overwriteDesign,
  loadDesign,
  deleteDesign,
} from '../utils/googleDrive';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: KitchenConfig;
  onLoad: (data: unknown, file: DriveFile) => void;
  currentFile: DriveFile | null;
  onCurrentFileChange: (file: DriveFile | null) => void;
  onToast: (msg: string) => void;
}

export const DriveModal: React.FC<Props> = ({ isOpen, onClose, config, onLoad, currentFile, onCurrentFileChange, onToast }) => {
  const [clientId, setClientId] = useState(getClientId());
  const [clientIdInput, setClientIdInput] = useState('');
  const [connected, setConnected] = useState(isConnected());
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setConnected(isConnected());
    setNewName(`Desain Meja ${config.totalWidth}cm`);
    setError(null);
    // Muat script login lebih awal agar popup login tidak diblokir browser saat tombol diklik
    if (clientId) loadGoogleIdentity().catch((e) => setError(e.message));
    if (isConnected()) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, clientId]);

  if (!isOpen) return null;

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label);
    setError(null);
    try {
      await fn();
    } catch (e: any) {
      setError(e?.message || String(e));
      setConnected(isConnected());
    } finally {
      setBusy(null);
    }
  };

  const refresh = () =>
    run('list', async () => {
      setFiles(await listDesigns());
    });

  const handleConnect = () =>
    run('connect', async () => {
      await connectDrive();
      setConnected(true);
      setFiles(await listDesigns());
    });

  const handleSaveNew = () =>
    run('save-new', async () => {
      const f = await saveNewDesign(newName.trim() || `Desain Meja ${config.totalWidth}cm`, config);
      onCurrentFileChange(f);
      setFiles(await listDesigns());
      onToast(`Tersimpan di Google Drive: ${f.name}`);
    });

  const handleOverwrite = (file: DriveFile) =>
    run(`over-${file.id}`, async () => {
      if (file.id !== currentFile?.id && !window.confirm(`Timpa "${file.name}" dengan desain saat ini?`)) return;
      const f = await overwriteDesign(file.id, config);
      onCurrentFileChange(f);
      setFiles(await listDesigns());
      onToast(`"${f.name}" diperbarui di Google Drive`);
    });

  const handleOpen = (file: DriveFile) =>
    run(`open-${file.id}`, async () => {
      const data = await loadDesign(file.id);
      onLoad(data, file);
      onClose();
    });

  const handleDelete = (file: DriveFile) =>
    run(`del-${file.id}`, async () => {
      if (!window.confirm(`Hapus "${file.name}" dari Google Drive?`)) return;
      await deleteDesign(file.id);
      if (currentFile?.id === file.id) onCurrentFileChange(null);
      setFiles(await listDesigns());
    });

  const handleDisconnect = () => {
    disconnectDrive();
    setConnected(false);
    setFiles([]);
  };

  const saveClientId = () => {
    setClientIdOverride(clientIdInput);
    setClientId(getClientId());
  };

  const fmtTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full sm:max-w-lg max-h-[92vh] flex flex-col bg-[#10131a] border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Cloud className="w-4.5 h-4.5 text-sky-400" />
            <h2 className="text-sm font-bold text-white">Simpan & Buka dari Google Drive</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200">{error}</div>}

          {!clientId ? (
            <div className="space-y-3 text-xs text-neutral-300">
              <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                  <KeyRound className="w-3.5 h-3.5" /> Google Client ID belum diatur
                </div>
                <p className="text-neutral-400 leading-relaxed">
                  Fitur ini butuh OAuth Client ID dari Google Cloud Console (tipe "Web application") dengan Authorized JavaScript origin
                  alamat aplikasi ini: <code className="text-neutral-200">{window.location.origin}</code>
                </p>
              </div>
              <label className="block space-y-1">
                <span className="text-neutral-400">Tempel Client ID (disimpan di browser ini saja):</span>
                <input
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  placeholder="xxxxxxxx.apps.googleusercontent.com"
                  className="w-full px-2.5 py-2 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-neutral-100 focus:outline-none focus:border-sky-500"
                />
              </label>
              <button
                onClick={saveClientId}
                disabled={!clientIdInput.trim()}
                className="w-full py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-semibold cursor-pointer"
              >
                Simpan Client ID
              </button>
            </div>
          ) : !connected ? (
            <div className="space-y-3 text-center">
              <p className="text-xs text-neutral-400 leading-relaxed">
                Hubungkan akun Google untuk menyimpan desain ke folder <strong className="text-neutral-200">"KitchenCraft Desain"</strong> di
                Drive kamu, lalu buka dari HP atau komputer mana pun. Aplikasi hanya bisa mengakses file yang dibuatnya sendiri.
              </p>
              <button
                onClick={handleConnect}
                disabled={busy === 'connect'}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white text-neutral-900 text-sm font-semibold hover:bg-neutral-200 disabled:opacity-60 cursor-pointer"
              >
                {busy === 'connect' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4 text-sky-600" />}
                Hubungkan Google Drive
              </button>
              {!isClientIdFromBuild() && (
                <button
                  onClick={() => {
                    setClientIdOverride('');
                    setClientId('');
                  }}
                  className="block mx-auto text-[11px] text-neutral-500 hover:text-neutral-300 cursor-pointer"
                >
                  Ganti Client ID
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Simpan */}
              <div className="p-3 rounded-xl bg-black/30 border border-white/[0.08] space-y-2">
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <CloudUpload className="w-3.5 h-3.5 text-sky-400" /> Simpan desain saat ini
                </div>
                {currentFile && (
                  <button
                    onClick={() => handleOverwrite(currentFile)}
                    disabled={!!busy}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
                  >
                    {busy === `over-${currentFile.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Simpan perubahan ke "{currentFile.name}"
                  </button>
                )}
                <div className="flex gap-2">
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1 min-w-0 px-2.5 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-neutral-100 focus:outline-none focus:border-sky-500"
                    placeholder="Nama file"
                  />
                  <button
                    onClick={handleSaveNew}
                    disabled={!!busy}
                    className="shrink-0 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 disabled:opacity-50 text-xs font-semibold text-white cursor-pointer"
                  >
                    {busy === 'save-new' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Simpan Baru'}
                  </button>
                </div>
              </div>

              {/* Daftar file */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Desain di Drive ({files.length})</span>
                  <button onClick={refresh} disabled={!!busy} className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-white/5 cursor-pointer" title="Muat ulang">
                    <RefreshCw className={`w-3.5 h-3.5 ${busy === 'list' ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                {files.length === 0 && busy !== 'list' && <p className="text-[11px] text-neutral-500">Belum ada desain tersimpan.</p>}
                {files.map((f) => (
                  <div
                    key={f.id}
                    className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                      currentFile?.id === f.id ? 'bg-sky-950/30 border-sky-500/40' : 'bg-black/30 border-white/[0.06]'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{f.name}</p>
                      <p className="text-[10px] text-neutral-500">{fmtTime(f.modifiedTime)}</p>
                    </div>
                    <button
                      onClick={() => handleOpen(f)}
                      disabled={!!busy}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-[11px] font-semibold text-white cursor-pointer"
                    >
                      {busy === `open-${f.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <FolderOpen className="w-3 h-3" />} Buka
                    </button>
                    <button
                      onClick={() => handleOverwrite(f)}
                      disabled={!!busy}
                      className="p-1.5 rounded-md text-neutral-400 hover:text-sky-300 hover:bg-white/5 cursor-pointer"
                      title="Timpa dengan desain saat ini"
                    >
                      <Save className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(f)}
                      disabled={!!busy}
                      className="p-1.5 rounded-md text-neutral-400 hover:text-rose-400 hover:bg-white/5 cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <button onClick={handleDisconnect} className="flex items-center gap-1.5 text-[11px] text-neutral-500 hover:text-neutral-300 cursor-pointer">
                <LogOut className="w-3 h-3" /> Putuskan Google Drive
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
