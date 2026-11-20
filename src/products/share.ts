import { FurnitureDesign } from './types';
import { normalizeDesign } from './index';
import { CostReport, rupiah } from './common';

/** JSON → base64url (aman untuk URL, mendukung huruf non-ASCII) */
const toB64Url = (s: string) => {
  let bin = '';
  new TextEncoder().encode(s).forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromB64Url = (s: string) => {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(b, (c) => c.charCodeAt(0)));
};

/** Link yang membuka desain ini persis (ukuran, bahan, rangka Mode Ahli, engsel) */
export function shareUrl(design: FurnitureDesign): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}?d=${toB64Url(JSON.stringify({ v: 1, design }))}`;
}

export function designFromShare(param: string | null): FurnitureDesign | null {
  if (!param) return null;
  try {
    const data = JSON.parse(fromB64Url(param));
    return normalizeDesign(data?.design);
  } catch {
    return null;
  }
}

export function shareText(title: string, summary: string, cost: CostReport, url: string) {
  return `${title}\n${summary}\nPerkiraan bahan ± ${rupiah(cost.materialTotal)} (${cost.bars} batang hollow)\nLihat 3D & daftar potongan: ${url}`;
}

/** Buka WhatsApp (aplikasi / web) dengan pesan berisi ringkasan + link desain */
export function openWhatsApp(text: string) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
}
