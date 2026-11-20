import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { PRODUCTS, Params, ProductBuild, ProductId, newDesign } from '../products';
import { KitchenConfig } from '../types/kitchen';
import { toFrameHost } from '../products/common';
import { buildProductModel } from './productModel';

/**
 * Gambar kecil (thumbnail) produk dari model 3D aslinya: satu renderer tersembunyi dipakai bergantian,
 * gambar dibuat satu per satu (antrean) lalu disimpan di memori.
 */
const TW = 360;
const TH = 270;

type Ctx = { renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera; group: THREE.Group };
let ctx: Ctx | null | false = null; // false = WebGL tidak tersedia (dicoba lagi setelah RETRY_MS)
let failedAt = 0;
const RETRY_MS = 8000;

/**
 * Renderer bersama. Bila konteks WebGL hilang (GPU sibuk / di-reset browser) atau gagal dibuat, jangan menyerah
 * selamanya: buat ulang pada permintaan berikutnya.
 */
function getCtx(): Ctx | false {
  if (ctx && ctx.renderer.getContext().isContextLost()) {
    try {
      ctx.renderer.dispose();
    } catch {
      // abaikan
    }
    ctx = null;
  }
  if (ctx === false && Date.now() - failedAt > RETRY_MS) ctx = null;
  if (ctx === null) {
    ctx = init();
    if (!ctx) failedAt = Date.now();
  }
  return ctx;
}
const cache = new Map<string, string>();
const MAX_PARAM_THUMBS = 150; // gambar pilihan (berubah tiap slider digeser) dibatasi supaya memori tidak terus naik

/** Simpan ke cache; gambar pilihan yang paling lama dibuang bila melewati batas */
function remember(key: string, url: string) {
  cache.delete(key);
  cache.set(key, url);
  if (!key.includes('#')) return;
  let n = 0;
  for (const k of cache.keys()) if (k.includes('#')) n++;
  for (const k of cache.keys()) {
    if (n <= MAX_PARAM_THUMBS) break;
    if (k.includes('#')) {
      cache.delete(k);
      n--;
    }
  }
}

/** WebP jauh lebih kecil daripada PNG (browser lama otomatis memberi PNG) */
const snapshot = (canvas: HTMLCanvasElement) => canvas.toDataURL('image/webp', 0.88);
const pending = new Map<string, Promise<string | null>>();
const wanters = new Map<string, Set<() => boolean>>(); // siapa saja yang masih menunggu gambar ini
let queue: Promise<unknown> = Promise.resolve();

function init(): Ctx | false {
  try {
    const canvas = document.createElement('canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'low-power' });
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      ctx = null; // dibuat ulang saat gambar berikutnya diminta
    });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(TW, TH, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    scene.environment = pmrem.fromScene(room, 0.04).texture;
    pmrem.dispose();
    room.dispose();
    const key = new THREE.DirectionalLight(0xfff1e0, 2.2);
    key.position.set(3, 5, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xdfe8ff, 0.8);
    fill.position.set(-3, 2.5, 2);
    scene.add(fill);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xcfc6b8, 0.6));
    const camera = new THREE.PerspectiveCamera(32, TW / TH, 0.05, 60);
    const group = new THREE.Group();
    scene.add(group);
    return { renderer, scene, camera, group };
  } catch {
    return false;
  }
}

function clear(group: THREE.Group) {
  group.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const m = mesh.material as THREE.Material | THREE.Material[] | undefined;
    (Array.isArray(m) ? m : m ? [m] : []).forEach((x) => x.dispose());
  });
  group.clear();
}

const keyOf = (product: ProductId, preset?: string, size = 0) => `${product}:${preset || ''}:${size}`;

export const cachedThumbnail = (product: ProductId, preset?: string, size = 0) => cache.get(keyOf(product, preset, size)) || null;

function render(product: ProductId, preset: string | undefined, size: number): string | null {
  const def = PRODUCTS[product];
  const design = newDesign(product, preset);
  const pr = def.presets.find((p) => p.id === preset);
  return renderParams(product, { ...design.params, ...(pr?.sizes?.[size]?.params || {}) });
}

function renderParams(product: ProductId, params: Params): string | null {
  const c = getCtx();
  if (!c) return null;
  const { renderer, scene, camera, group } = c;
  const def = PRODUCTS[product];
  const d = { ...newDesign(product), params };
  const build = def.build(params);
  const host = toFrameHost(d, build);
  clear(group);
  buildProductModel(group, host, build, String(params.warna || '#1f2226'), String(params.papan || 'kayu'), [], new Map(), { wall: false });

  // Kamera sudut 3/4 dari depan-kanan, jarak dari bola pembungkus model
  const box = new THREE.Box3().setFromObject(group);
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const fv = THREE.MathUtils.degToRad(camera.fov);
  const fh = 2 * Math.atan(Math.tan(fv / 2) * camera.aspect);
  const dist = (sphere.radius / Math.sin(Math.min(fv, fh) / 2)) * 1.02;
  const dir = new THREE.Vector3(0.62, 0.42, 0.78).normalize();
  camera.position.copy(sphere.center).addScaledVector(dir, dist);
  camera.lookAt(sphere.center);
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
  const url = snapshot(renderer.domElement);
  clear(group);
  return url;
}

/**
 * Gambar kecil sebuah template (dan ukuran umum ke-`size`); null bila WebGL tidak tersedia.
 * `wanted`: dicek saat giliran tiba; bila tidak ada lagi yang menunggu (kartu sudah lewat dari layar)
 * gambar dilewati supaya antrean tidak macet oleh kartu yang tidak terlihat.
 */
export function productThumbnail(product: ProductId, preset?: string, size = 0, wanted?: () => boolean): Promise<string | null> {
  return enqueue(keyOf(product, preset, size), () => render(product, preset, size), wanted);
}

/** Gambar kecil untuk sekumpulan pilihan apa saja (mis. pratinjau satu pilihan model kaki) */
export const paramsThumbKey = (product: ProductId, params: Params) => `${product}#${JSON.stringify(params)}`;
export const cachedParamsThumbnail = (product: ProductId, params: Params) => cache.get(paramsThumbKey(product, params)) || null;
export function paramsThumbnail(product: ProductId, params: Params, wanted?: () => boolean): Promise<string | null> {
  return enqueue(paramsThumbKey(product, params), () => renderParams(product, params), wanted);
}

function enqueue(key: string, make: () => string | null, wanted?: () => boolean): Promise<string | null> {
  const hit = cache.get(key);
  if (hit) return Promise.resolve(hit);
  let set = wanters.get(key);
  if (!set) wanters.set(key, (set = new Set()));
  set.add(wanted || (() => true));
  const wait = pending.get(key);
  if (wait) return wait;
  const job = queue
    .then(() => new Promise((r) => setTimeout(r, 0))) // beri jeda supaya halaman tetap responsif
    .then(() => {
      const who = wanters.get(key);
      wanters.delete(key);
      if (who && ![...who].some((w) => w())) {
        pending.delete(key);
        return null;
      }
      try {
        const url = make();
        if (url) remember(key, url);
        return url;
      } catch {
        return null;
      } finally {
        pending.delete(key);
      }
    });
  queue = job;
  pending.set(key, job);
  return job;
}

export type DesignView = 'iso' | 'front' | 'side' | 'top';
const VIEW_DIR: Record<DesignView, [number, number, number]> = {
  iso: [0.62, 0.42, 0.78],
  front: [0, 0.08, 1],
  side: [1, 0.08, 0],
  top: [0, 1, 0.0001],
};

/**
 * Gambar desain apa adanya (termasuk batang yang diubah sendiri / rangka manual) dari beberapa arah.
 * Dipakai di halaman Potongan besi. Hasil: data URL PNG per tampak, urut sesuai `views`.
 */
export function designImages(
  host: KitchenConfig,
  build: ProductBuild,
  paint: string,
  board: string,
  views: { view: DesignView; w: number; h: number }[]
): Promise<(string | null)[]> {
  const job = queue
    .then(() => new Promise((r) => setTimeout(r, 0)))
    .then(() => {
      const c = getCtx();
      if (!c) return views.map(() => null);
      const { renderer, scene, camera, group } = c;
      const out: (string | null)[] = [];
      const ratio = renderer.getPixelRatio();
      try {
        renderer.setPixelRatio(1); // gambar besar: cukup 1x supaya ringan untuk GPU
        clear(group);
        buildProductModel(group, host, build, paint, board, [], new Map(), { wall: false });
        const sphere = new THREE.Box3().setFromObject(group).getBoundingSphere(new THREE.Sphere());
        for (const v of views) {
          renderer.setSize(v.w, v.h, false);
          camera.aspect = v.w / v.h;
          camera.updateProjectionMatrix();
          const fv = THREE.MathUtils.degToRad(camera.fov);
          const fh = 2 * Math.atan(Math.tan(fv / 2) * camera.aspect);
          const dist = (sphere.radius / Math.sin(Math.min(fv, fh) / 2)) * 1.02;
          camera.position.copy(sphere.center).addScaledVector(new THREE.Vector3(...VIEW_DIR[v.view]).normalize(), dist);
          camera.lookAt(sphere.center);
          renderer.render(scene, camera);
          out.push(snapshot(renderer.domElement));
        }
      } catch {
        while (out.length < views.length) out.push(null);
      } finally {
        clear(group);
        renderer.setPixelRatio(ratio);
        renderer.setSize(TW, TH, false);
        camera.aspect = TW / TH;
        camera.updateProjectionMatrix();
      }
      return out;
    });
  queue = job;
  return job;
}
