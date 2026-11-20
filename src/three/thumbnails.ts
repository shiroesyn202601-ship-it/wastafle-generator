import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { PRODUCTS, Params, ProductId, newDesign } from '../products';
import { toFrameHost } from '../products/common';
import { buildProductModel } from './productModel';

/**
 * Gambar kecil (thumbnail) produk dari model 3D aslinya: satu renderer tersembunyi dipakai bergantian,
 * gambar dibuat satu per satu (antrean) lalu disimpan di memori.
 */
const TW = 360;
const TH = 270;

type Ctx = { renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera; group: THREE.Group };
let ctx: Ctx | null | false = null; // false = WebGL tidak tersedia
const cache = new Map<string, string>();
const pending = new Map<string, Promise<string | null>>();
const wanters = new Map<string, Set<() => boolean>>(); // siapa saja yang masih menunggu gambar ini
let queue: Promise<unknown> = Promise.resolve();

function init(): Ctx | false {
  try {
    const canvas = document.createElement('canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
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
  if (ctx === null) ctx = init();
  if (!ctx) return null;
  const { renderer, scene, camera, group } = ctx;
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
  const url = renderer.domElement.toDataURL('image/png');
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
        if (url) cache.set(key, url);
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
