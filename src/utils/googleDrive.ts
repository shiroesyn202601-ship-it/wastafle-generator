/**
 * Simpan / buka desain di Google Drive pengguna (Google Identity Services + Drive REST v3).
 * Scope `drive.file`: aplikasi hanya bisa melihat file yang dibuat oleh aplikasi ini sendiri.
 */

declare global {
  interface Window {
    google?: any;
  }
}

const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const FOLDER_NAME = 'KitchenCraft Desain';
const LS_CLIENT_ID = 'kitchencraft_google_client_id';
const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
// OAuth Client ID (publik, bukan rahasia). Bisa ditimpa lewat VITE_GOOGLE_CLIENT_ID saat build.
const DEFAULT_CLIENT_ID = '806194820597-6gbqotlg286a1r24lk68nelbfvqr6vd3.apps.googleusercontent.com';

export interface DriveFile {
  id: string;
  name: string;
  modifiedTime: string;
}

/** Client ID OAuth: dari build (VITE_GOOGLE_CLIENT_ID) atau diisi manual di aplikasi */
export function getClientId(): string {
  const fromEnv = ((import.meta as any).env?.VITE_GOOGLE_CLIENT_ID as string) || '';
  if (fromEnv) return fromEnv;
  try {
    return localStorage.getItem(LS_CLIENT_ID) || DEFAULT_CLIENT_ID;
  } catch {
    return DEFAULT_CLIENT_ID;
  }
}

export function isClientIdFromBuild(): boolean {
  return !!(import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || !!DEFAULT_CLIENT_ID;
}

export function setClientIdOverride(id: string) {
  try {
    if (id) localStorage.setItem(LS_CLIENT_ID, id.trim());
    else localStorage.removeItem(LS_CLIENT_ID);
  } catch {
    // abaikan: penyimpanan browser tidak tersedia
  }
}

let gisPromise: Promise<void> | null = null;

/** Muat script Google Identity Services (sekali saja) */
export function loadGoogleIdentity(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      gisPromise = null;
      reject(new Error('Gagal memuat layanan login Google. Periksa koneksi internet.'));
    };
    document.head.appendChild(s);
  });
  return gisPromise;
}

let accessToken: { value: string; expiresAt: number } | null = null;

export function isConnected(): boolean {
  return !!accessToken && accessToken.expiresAt > Date.now() + 30_000;
}

/**
 * Minta izin akses Drive. Harus dipanggil langsung dari klik pengguna (popup login Google),
 * dan script GIS sebaiknya sudah dimuat lebih dulu dengan loadGoogleIdentity().
 */
export function connectDrive(): Promise<void> {
  const clientId = getClientId();
  if (!clientId) return Promise.reject(new Error('Client ID Google belum diatur.'));
  if (!window.google?.accounts?.oauth2) return Promise.reject(new Error('Layanan login Google belum siap, coba lagi sebentar.'));
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (resp: any) => {
        if (resp.error) {
          reject(new Error(resp.error_description || resp.error));
          return;
        }
        accessToken = { value: resp.access_token, expiresAt: Date.now() + (Number(resp.expires_in) || 3600) * 1000 };
        resolve();
      },
      error_callback: (err: any) => reject(new Error(err?.message || 'Login Google dibatalkan.')),
    });
    client.requestAccessToken({ prompt: accessToken ? '' : 'consent' });
  });
}

export function disconnectDrive() {
  if (accessToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(accessToken.value, () => undefined);
  }
  accessToken = null;
  folderId = null;
}

async function request(url: string, init: RequestInit = {}): Promise<Response> {
  if (!isConnected()) throw new Error('Sesi Google Drive berakhir. Hubungkan ulang.');
  const res = await fetch(url, {
    ...init,
    headers: { ...(init.headers || {}), Authorization: `Bearer ${accessToken!.value}` },
  });
  if (res.status === 401) {
    accessToken = null;
    throw new Error('Sesi Google Drive berakhir. Hubungkan ulang.');
  }
  if (!res.ok) {
    let msg = `Google Drive error ${res.status}`;
    try {
      const body = await res.json();
      msg = body?.error?.message || msg;
    } catch {
      // body bukan JSON
    }
    throw new Error(msg);
  }
  return res;
}

let folderId: string | null = null;

async function ensureFolder(): Promise<string> {
  if (folderId) return folderId;
  const q = encodeURIComponent(`name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const found = await (await request(`${API}/files?q=${q}&fields=files(id)&spaces=drive`)).json();
  if (found.files?.length) {
    folderId = found.files[0].id as string;
    return folderId;
  }
  const created = await (
    await request(`${API}/files?fields=id`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
    })
  ).json();
  folderId = created.id as string;
  return folderId!;
}

export async function listDesigns(): Promise<DriveFile[]> {
  const folder = await ensureFolder();
  const q = encodeURIComponent(`'${folder}' in parents and trashed=false`);
  const res = await (await request(`${API}/files?q=${q}&orderBy=modifiedTime desc&fields=files(id,name,modifiedTime)&pageSize=100`)).json();
  return (res.files || []) as DriveFile[];
}

const ensureJsonName = (name: string) => (name.toLowerCase().endsWith('.json') ? name : `${name}.json`);

export async function saveNewDesign(name: string, data: unknown): Promise<DriveFile> {
  const folder = await ensureFolder();
  const boundary = `kc${Date.now()}`;
  const meta = { name: ensureJsonName(name), mimeType: 'application/json', parents: [folder] };
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n` +
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(data, null, 2)}\r\n--${boundary}--`;
  const res = await request(`${UPLOAD}/files?uploadType=multipart&fields=id,name,modifiedTime`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  });
  return (await res.json()) as DriveFile;
}

export async function overwriteDesign(id: string, data: unknown): Promise<DriveFile> {
  const res = await request(`${UPLOAD}/files/${id}?uploadType=media&fields=id,name,modifiedTime`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data, null, 2),
  });
  return (await res.json()) as DriveFile;
}

export async function loadDesign(id: string): Promise<unknown> {
  return (await request(`${API}/files/${id}?alt=media`)).json();
}

export async function deleteDesign(id: string): Promise<void> {
  await request(`${API}/files/${id}`, { method: 'DELETE' });
}
