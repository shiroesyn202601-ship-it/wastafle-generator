import React, { useEffect, useRef, useState } from 'react';
import { useIsDark } from '../theme';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { KitchenConfig } from '../types/kitchen';
import { ProductBuild } from '../products/types';
import { HingeAnimState, HingePart } from './frameBuilder';
import { buildProductModel } from './productModel';
import { FrameSketch } from './FrameSketch';
import { createFloorTileTexture } from '../utils/proceduralTextures';
import { getValidHinges } from '../utils/frameHinges';
import { getFrameMembers } from '../utils/frameLayout';

type ViewPreset = 'iso' | 'front' | 'side' | 'top' | 'bottom';
type DimAxis = 'x' | 'y' | 'z';

/** Satu ukuran utama yang bisa ditarik langsung di 3D */
export interface DimHandle {
  label: string; // "Panjang"
  value: number;
  min: number;
  max: number;
  step: number;
  marks?: number[];
  onChange: (v: number) => void;
}

interface Props {
  host: KitchenConfig; // konfigurasi inang rangka (lihat products/common.toFrameHost)
  build: ProductBuild;
  paint: string; // warna cat rangka
  boardMaterial: string; // multiplek | hpl | kayu | none
  fitKey: string; // ganti nilai ini (mis. id produk) untuk mengepaskan kamera ulang
  selectedId?: string | null; // batang yang disorot
  onSelect?: (memberId: string | null) => void; // ketuk batang (null = ketuk area kosong)
  hintIds?: string[]; // batang yang terkait pilihan di bawah kursor (sorot lembut)
  flash?: { ids: string[]; at: number }; // batang yang baru berubah: berkedip lalu memudar
  dims?: Partial<Record<DimAxis, DimHandle>>; // panah tarik untuk panjang (x), tinggi (y), lebar (z)
}

const AXES: DimAxis[] = ['x', 'z', 'y'];
const FLASH_MS = 1300;
const LS_DIMS = 'studiorangka_dims';
const LS_HUMAN = 'studiorangka_human';
const lsBool = (k: string, d: boolean) => {
  try {
    const v = localStorage.getItem(k);
    return v === null ? d : v === '1';
  } catch {
    return d;
  }
};
const lsPut = (k: string, v: boolean) => {
  try {
    localStorage.setItem(k, v ? '1' : '0');
  } catch {
    // abaikan
  }
};

/**
 * Garis ukuran satu sumbu (meter, koordinat dunia; model berpusat di x/z dan berdiri di lantai).
 * handle = titik yang ditarik, dir = arah membesar, factor = perubahan ukuran per cm geseran
 * (panjang & lebar bertambah ke dua sisi sehingga ujungnya hanya bergeser setengahnya → factor 2).
 */
function dimSegment(ax: DimAxis, s: { W: number; D: number; H: number }) {
  const o = 0.07;
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  if (ax === 'x') return { a: V(-s.W / 2, 0.003, s.D / 2 + o), b: V(s.W / 2, 0.003, s.D / 2 + o), handle: V(-s.W / 2, 0.003, s.D / 2 + o), dir: V(-1, 0, 0), factor: 2 };
  if (ax === 'z') return { a: V(s.W / 2 + o, 0.003, -s.D / 2), b: V(s.W / 2 + o, 0.003, s.D / 2), handle: V(s.W / 2 + o, 0.003, -s.D / 2), dir: V(0, 0, -1), factor: 2 };
  return { a: V(s.W / 2 + o, 0, s.D / 2 + o), b: V(s.W / 2 + o, s.H, s.D / 2 + o), handle: V(s.W / 2 + o, s.H, s.D / 2 + o), dir: V(0, 1, 0), factor: 1 };
}

/** Figur orang 165 cm sederhana sebagai pembanding skala */
function buildHuman(): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x9aa3ad, roughness: 0.85, transparent: true, opacity: 0.55, depthWrite: false });
  const add = (geo: THREE.BufferGeometry, x: number, y: number) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, 0);
    g.add(m);
  };
  const limb = (r: number, len: number) => new THREE.CapsuleGeometry(r, len, 4, 10);
  add(limb(0.055, 0.68), -0.1, 0.42); // kaki
  add(limb(0.055, 0.68), 0.1, 0.42);
  add(limb(0.15, 0.36), 0, 1.08); // badan
  add(limb(0.04, 0.5), -0.22, 1.05); // lengan
  add(limb(0.04, 0.5), 0.22, 1.05);
  add(new THREE.SphereGeometry(0.1, 16, 12), 0, 1.53); // kepala
  return g;
}

function disposeHierarchy(node: THREE.Object3D) {
  node.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const m = mesh.material as THREE.Material | THREE.Material[] | undefined;
    (Array.isArray(m) ? m : m ? [m] : []).forEach((mat) => {
      const tex = (mat as THREE.MeshStandardMaterial).map;
      if (tex) tex.dispose();
      mat.dispose();
    });
  });
}

/** Scene 3D ringan untuk produk rangka (meja, rak, troli): rangka + engsel, papan, roda */
export const ThreeProductScene: React.FC<Props> = ({ host, build, paint, boardMaterial, fitKey, selectedId, onSelect, hintIds, flash, dims }) => {
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const mountRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const glideRef = useRef({ active: false, pos: new THREE.Vector3(), look: new THREE.Vector3() });
  const hingePartsRef = useRef<HingePart[]>([]);
  const hingeAnimRef = useRef(new Map<string, HingeAnimState>());
  const sizeRef = useRef({ W: 1, D: 1, H: 1 });
  const sceneRef = useRef<THREE.Scene | null>(null);
  const floorMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const isDark = useIsDark();
  const [glError, setGlError] = useState(false);
  // WebGL bisa gagal / hilang (GPU sibuk, driver di-reset): buat ulang renderer otomatis, lalu lewat tombol
  const [attempt, setAttempt] = useState(0);
  const [gen, setGen] = useState(0); // naik tiap renderer baru siap: model & kamera dibangun ulang
  const [view, setView] = useState<ViewPreset>('iso');
  const [showDims, setShowDims] = useState(() => lsBool(LS_DIMS, true));
  const [showHuman, setShowHuman] = useState(() => lsBool(LS_HUMAN, false));
  const [drag, setDrag] = useState<{ axis: DimAxis; value: number } | null>(null);
  const humanRef = useRef<THREE.Group | null>(null);
  const showDimsRef = useRef(showDims);
  showDimsRef.current = showDims;
  const dimsRef = useRef(dims);
  dimsRef.current = dims;
  const overlayRef = useRef<SVGSVGElement>(null);
  const labelRefs = useRef<Partial<Record<DimAxis, HTMLDivElement | null>>>({});
  const handleRefs = useRef<Partial<Record<DimAxis, HTMLButtonElement | null>>>({});
  const projRef = useRef<((p: THREE.Vector3) => { x: number; y: number; ok: boolean }) | null>(null);
  // sorotan: batang terpilih, batang terkait pilihan di bawah kursor, batang yang baru berubah
  const hiRef = useRef({ selected: null as string | null, hint: new Set<string>(), flash: new Set<string>(), flashUntil: 0 });
  const applyHiRef = useRef<() => void>(() => {});
  const flashMatRef = useRef<THREE.MeshStandardMaterial | null>(null);

  // ---------- Setup sekali ----------
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    } catch {
      setGlError(true);
      return;
    }
    setGlError(false)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xeeece7);
    sceneRef.current = scene;
    const w = container.clientWidth || 300;
    const h = container.clientHeight || 300;
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.05, 60);
    camera.position.set(2, 1.6, 2.4);
    cameraRef.current = camera;
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // ringan untuk GPU laptop
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Kanvas absolut supaya ukurannya tidak ikut memperlebar layout (penting di HP)
    Object.assign(renderer.domElement.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block' });
    container.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04).texture;
    scene.environment = env;
    pmrem.dispose();
    room.dispose();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 0.4;
    controls.maxDistance = 9;
    controls.maxPolarAngle = Math.PI - 0.01; // boleh melihat dari bawah lantai (lantai hanya tampak dari atas)
    controlsRef.current = controls;
    controls.addEventListener('start', () => (glideRef.current.active = false));

    const key = new THREE.DirectionalLight(0xfff1e0, 2.2);
    key.position.set(3, 5, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -3;
    key.shadow.camera.right = 3;
    key.shadow.camera.top = 3;
    key.shadow.camera.bottom = -1;
    key.shadow.bias = -0.0005;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xdfe8ff, 0.8);
    fill.position.set(-3, 2.5, 2);
    scene.add(fill);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xcfc6b8, 0.6));

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 14),
      new THREE.MeshStandardMaterial({ map: createFloorTileTexture(), roughness: 0.7, metalness: 0.05 })
    );
    floorMatRef.current = floor.material as THREE.MeshStandardMaterial;
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.001;
    floor.receiveShadow = true;
    scene.add(floor);

    const group = new THREE.Group();
    scene.add(group);
    groupRef.current = group;

    // Proyeksi titik dunia → piksel layar (untuk garis ukuran & panah tarik)
    const tmp = new THREE.Vector3();
    const proj = (p: THREE.Vector3) => {
      tmp.copy(p).project(camera);
      return { x: (tmp.x * 0.5 + 0.5) * container.clientWidth, y: (-tmp.y * 0.5 + 0.5) * container.clientHeight, ok: tmp.z < 1 && tmp.z > -1 };
    };
    projRef.current = proj;
    const updateOverlay = () => {
      const svg = overlayRef.current;
      if (!svg) return;
      const on = showDimsRef.current;
      svg.style.display = on ? '' : 'none';
      AXES.forEach((ax) => {
        const lab = labelRefs.current[ax];
        const hd = handleRefs.current[ax];
        if (!on) {
          if (lab) lab.style.display = 'none';
          if (hd) hd.style.display = 'none';
          return;
        }
        const seg = dimSegment(ax, sizeRef.current);
        const a = proj(seg.a);
        const b = proj(seg.b);
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        const visible = a.ok && b.ok && len > 28; // garis yang tampak sangat pendek (dilihat dari ujungnya) disembunyikan
        const line = svg.querySelector(`[data-ax="${ax}"]`) as SVGLineElement | null;
        if (line) {
          line.setAttribute('x1', String(a.x));
          line.setAttribute('y1', String(a.y));
          line.setAttribute('x2', String(b.x));
          line.setAttribute('y2', String(b.y));
          line.style.display = visible ? '' : 'none';
        }
        if (lab) {
          lab.style.display = visible ? '' : 'none';
          lab.style.transform = `translate(${(a.x + b.x) / 2}px, ${(a.y + b.y) / 2}px) translate(-50%, -50%)`;
        }
        if (hd) {
          const p = proj(seg.handle);
          hd.style.display = visible && dimsRef.current?.[ax] ? '' : 'none';
          hd.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`;
        }
      });
    };

    let raf = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const g = glideRef.current;
      if (g.active) {
        camera.position.lerp(g.pos, 0.12);
        controls.target.lerp(g.look, 0.12);
        if (camera.position.distanceTo(g.pos) < 0.005) g.active = false;
      }
      controls.update();
      const hi = hiRef.current;
      if (hi.flash.size && flashMatRef.current) {
        const left = hi.flashUntil - performance.now();
        if (left <= 0) {
          hi.flash.clear();
          applyHiRef.current();
        } else flashMatRef.current.emissiveIntensity = 0.15 + 0.85 * Math.min(1, left / FLASH_MS);
      }
      hingePartsRef.current.forEach((part) => {
        const st = hingeAnimRef.current.get(part.id);
        if (!st) return;
        st.target = Math.min(Math.max(st.target, 0), part.limit);
        const step = 2.2 * delta;
        const diff = st.target - st.angle;
        st.angle = Math.abs(diff) <= step ? st.target : st.angle + Math.sign(diff) * step;
        part.pivot.quaternion.setFromAxisAngle(part.axis, st.angle);
      });
      renderer.render(scene, camera);
      updateOverlay();
    };
    animate();

    // Klik engsel untuk menekuk / meluruskan
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let downAt: { x: number; y: number } | null = null;
    const hingeAt = (e: PointerEvent) => {
      if (!hingePartsRef.current.length) return null;
      const r = renderer.domElement.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      let o: THREE.Object3D | null = ray.intersectObject(group, true)[0]?.object || null;
      while (o && !o.userData.hingeId) o = o.parent;
      return o ? (o.userData.hingeId as string) : null;
    };
    const onDown = (e: PointerEvent) => (downAt = { x: e.clientX, y: e.clientY });
    const onUp = (e: PointerEvent) => {
      if (!downAt) return;
      const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
      downAt = null;
      if (moved > 6) return;
      const id = hingeAt(e);
      const part = hingePartsRef.current.find((p) => p.id === id);
      const st = id ? hingeAnimRef.current.get(id) : undefined;
      if (part && st) {
        st.target = st.target > 0.0001 ? 0 : part.limit;
        return;
      }
      // Ketuk batang rangka → pilih; ketuk area lain → batal pilih
      const r = renderer.domElement.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      let o: THREE.Object3D | null = ray.intersectObject(group, true)[0]?.object || null;
      while (o && !o.userData.memberId) o = o.parent;
      onSelectRef.current?.(o ? (o.userData.memberId as string) : null);
    };
    const onMove = (e: PointerEvent) => {
      if (e.buttons !== 0) return;
      let pointer = !!hingeAt(e);
      if (!pointer && onSelectRef.current) {
        const r = renderer.domElement.getBoundingClientRect();
        ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        ray.setFromCamera(ndc, camera);
        let o: THREE.Object3D | null = ray.intersectObject(group, true)[0]?.object || null;
        while (o && !o.userData.memberId) o = o.parent;
        pointer = !!o;
      }
      renderer.domElement.style.cursor = pointer ? 'pointer' : '';
    };
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointerup', onUp);
    renderer.domElement.addEventListener('pointermove', onMove);
    let lostTimer: ReturnType<typeof setTimeout> | undefined;
    const onLost = (e: Event) => {
      e.preventDefault();
      setGlError(true);
      // coba buat ulang sendiri dua kali; setelah itu pengguna bisa menekan tombol
      if (attempt < 2) lostTimer = setTimeout(() => setAttempt((a) => a + 1), 1500);
    };
    renderer.domElement.addEventListener('webglcontextlost', onLost);

    const resize = () => {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      if (!cw || !ch) return;
      camera.aspect = cw / ch;
      camera.fov = cw / ch >= 1 ? 40 : 55;
      camera.updateProjectionMatrix();
      renderer.setSize(cw, ch, false);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    setGen((g) => g + 1);

    return () => {
      if (lostTimer) clearTimeout(lostTimer);
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      renderer.domElement.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('webglcontextlost', onLost);
      controls.dispose();
      disposeHierarchy(scene);
      env.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      groupRef.current = null;
      projRef.current = null;
      humanRef.current = null;
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  // Mode gelap: latar & lantai ikut gelap
  useEffect(() => {
    const scene = sceneRef.current;
    if (scene) scene.background = new THREE.Color(isDark ? 0x1d1c1a : 0xeeece7);
    floorMatRef.current?.color.set(isDark ? 0x3a3734 : 0xffffff);
  }, [isDark]);

  // ---------- Bangun ulang model saat desain berubah ----------
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    while (group.children.length) {
      const c = group.children[0];
      group.remove(c);
      disposeHierarchy(c);
    }
    hingePartsRef.current = [];

    sizeRef.current = { W: build.W / 100, D: build.D / 100, H: build.H / 100 };

    buildProductModel(group, host, build, paint, boardMaterial, hingePartsRef.current, hingeAnimRef.current);
  }, [host, build, paint, boardMaterial, gen]);

  // ---------- Figur orang (pembanding skala), berdiri di sebelah kiri produk ----------
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (!humanRef.current) humanRef.current = buildHuman();
    const h = humanRef.current;
    h.position.set(-build.W / 200 - 0.38, 0, 0);
    if (showHuman && !h.parent) scene.add(h);
    if (!showHuman && h.parent) scene.remove(h);
  }, [showHuman, build.W, gen]);

  // ---------- Sorot batang: terpilih (oranye), terkait pilihan (biru muda), baru berubah (biru berkedip) ----------
  useEffect(() => {
    const sel = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xb45309, emissiveIntensity: 0.45, metalness: 0.3, roughness: 0.45 });
    const hint = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0369a1, emissiveIntensity: 0.35, metalness: 0.3, roughness: 0.45 });
    const fl = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, emissive: 0x0284c7, emissiveIntensity: 1, metalness: 0.3, roughness: 0.4 });
    flashMatRef.current = fl;
    applyHiRef.current = () => {
      const group = groupRef.current;
      if (!group) return;
      const h = hiRef.current;
      group.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh || !mesh.userData.memberId) return;
        if (!mesh.userData.origMat) mesh.userData.origMat = mesh.material;
        const id = mesh.userData.memberId as string;
        mesh.material = id === h.selected ? sel : h.hint.has(id) ? hint : h.flash.has(id) ? fl : (mesh.userData.origMat as THREE.Material);
      });
    };
    return () => {
      applyHiRef.current = () => {};
      sel.dispose();
      hint.dispose();
      fl.dispose();
      flashMatRef.current = null;
    };
  }, []);

  useEffect(() => {
    hiRef.current.selected = selectedId || null;
    hiRef.current.hint = new Set(hintIds || []);
    applyHiRef.current();
  }, [selectedId, hintIds, host, build, paint, boardMaterial, gen]);

  useEffect(() => {
    if (!flash || !flash.ids.length || Date.now() - flash.at > 1500) return;
    hiRef.current.flash = new Set(flash.ids);
    hiRef.current.flashUntil = performance.now() + FLASH_MS;
    applyHiRef.current();
  }, [flash]);

  // ---------- Tarik panah ukuran ----------
  const startDrag = (ax: DimAxis, e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dimsRef.current?.[ax];
    const proj = projRef.current;
    if (!d || !proj) return;
    e.preventDefault();
    e.stopPropagation();
    const seg = dimSegment(ax, sizeRef.current);
    const p0 = proj(seg.handle);
    const p1 = proj(seg.handle.clone().addScaledVector(seg.dir, 0.01)); // 1 cm ke arah membesar
    const sx = p1.x - p0.x;
    const sy = p1.y - p0.y;
    const pxPerCm = Math.hypot(sx, sy);
    if (pxPerCm < 0.05) return; // dilihat lurus dari ujungnya: tidak bisa ditarik
    const ux = sx / pxPerCm;
    const uy = sy / pxPerCm;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const start = { x: e.clientX, y: e.clientY, value: d.value };
    const ctl = controlsRef.current;
    if (ctl) ctl.enabled = false;
    setDrag({ axis: ax, value: d.value });
    const move = (ev: PointerEvent) => {
      const cur = dimsRef.current?.[ax];
      if (!cur) return;
      const cm = ((ev.clientX - start.x) * ux + (ev.clientY - start.y) * uy) / pxPerCm;
      let v = start.value + cm * seg.factor;
      v = Math.min(cur.max, Math.max(cur.min, Math.round(v / cur.step) * cur.step));
      // menempel ke ukuran umum (mis. tinggi meja makan 75) bila dekat
      const snap = (cur.marks || []).find((m) => Math.abs(m - v) <= Math.max(2, cur.step));
      if (snap !== undefined) v = snap;
      setDrag({ axis: ax, value: v });
      if (v !== cur.value) cur.onChange(v);
    };
    const up = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      if (ctl) ctl.enabled = true;
      setDrag(null);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  };

  // ---------- Kamera ----------
  const goTo = (v: ViewPreset, instant = false) => {
    const cam = cameraRef.current;
    const ctl = controlsRef.current;
    if (!cam || !ctl) return;
    const sz = sizeRef.current;
    const human = humanRef.current?.parent ? 1 : 0;
    const W = sz.W + human * 0.9;
    const D = sz.D;
    const H = Math.max(sz.H, human * 1.65);
    // Jarak kamera dari bola pembungkus produk: r / sin(setengah sudut pandang tersempit)
    const r = 0.5 * Math.sqrt(W * W + D * D + H * H);
    const fv = THREE.MathUtils.degToRad(cam.fov);
    const fh = 2 * Math.atan(Math.tan(fv / 2) * cam.aspect);
    const dist = (r / Math.sin(Math.min(fv, fh) / 2)) * 1.08;
    const look = new THREE.Vector3(-human * 0.45, H / 2, 0);
    const dir =
      v === 'front'
        ? new THREE.Vector3(0, 0.12, 1)
        : v === 'side'
        ? new THREE.Vector3(1, 0.12, 0)
        : v === 'top'
        ? new THREE.Vector3(0, 1, 0.0001)
        : v === 'bottom'
        ? new THREE.Vector3(0.35, -0.85, 0.4)
        : new THREE.Vector3(0.62, 0.45, 0.78);
    const pos = look.clone().addScaledVector(dir.normalize(), dist);
    if (instant) {
      cam.position.copy(pos);
      ctl.target.copy(look);
      glideRef.current.active = false;
    } else glideRef.current = { active: true, pos, look };
    setView(v);
  };

  useEffect(() => {
    const t = setTimeout(() => goTo('iso', true), 30);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, gen]);

  const toggleHuman = () => {
    const v = !showHuman;
    setShowHuman(v);
    lsPut(LS_HUMAN, v);
    setTimeout(() => goTo(view), 0);
  };
  const toggleDims = () => {
    const v = !showDims;
    setShowDims(v);
    lsPut(LS_DIMS, v);
  };
  const sizeCm: Record<DimAxis, number> = { x: build.W, y: build.H, z: build.D };

  const hasHinges = getValidHinges(host, getFrameMembers(host)).length > 0;
  const views: { id: ViewPreset; label: string }[] = [
    { id: 'iso', label: '3D' },
    { id: 'front', label: 'Depan' },
    { id: 'side', label: 'Samping' },
    { id: 'top', label: 'Atas' },
    { id: 'bottom', label: 'Bawah' },
  ];

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#eeece7]">
      <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none" />
      {glError && (
        <div className="absolute inset-0 z-20 flex flex-col bg-[#eeece7]">
          {/* 3D tidak tersedia: tetap tampilkan rangkanya sebagai gambar biasa */}
          <div className="flex-1 min-h-0 p-6 pt-14">
            <FrameSketch host={host} paint={paint} selectedId={selectedId} />
          </div>
          <div className="shrink-0 m-2 p-3 rounded-xl bg-white/95 border border-amber-300 text-xs text-stone-700 flex flex-wrap items-center gap-2">
            <span className="flex-1 min-w-[220px]">
              <b>Tampilan 3D sedang tidak tersedia di browser ini</b> (grafis/WebGL dimatikan Chrome), jadi rangka ditampilkan sebagai gambar biasa. Semua
              pengaturan tetap bisa dipakai. Untuk 3D lagi: tutup Chrome lewat menu ⋮ → Keluar, lalu buka lagi.
            </span>
            <button onClick={() => setAttempt((a) => a + 1)} className="shrink-0 px-3 py-1.5 rounded-lg bg-sky-600 text-white font-semibold cursor-pointer">
              Coba muat ulang 3D
            </button>
          </div>
        </div>
      )}

      {/* Garis ukuran + panah tarik (posisinya diperbarui tiap frame mengikuti kamera) */}
      <svg ref={overlayRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
        {AXES.map((ax) => (
          <line key={ax} data-ax={ax} stroke="#0284c7" strokeWidth={1.5} strokeDasharray="5 4" style={{ display: 'none' }} />
        ))}
      </svg>
      {AXES.map((ax) => {
        const d = dims?.[ax];
        const dragging = drag?.axis === ax;
        return (
          <React.Fragment key={ax}>
            <div
              ref={(el) => {
                labelRefs.current[ax] = el;
              }}
              className={`absolute left-0 top-0 pointer-events-none rounded-md font-bold tabular-nums whitespace-nowrap shadow-sm ${
                dragging ? 'bg-sky-600 text-white text-sm px-2.5 py-1' : 'bg-white/90 text-sky-800 border border-sky-200 text-[11px] px-1.5 py-0.5'
              }`}
              style={{ display: 'none' }}
            >
              {dragging && d ? `${d.label} ${drag!.value} cm` : `${Math.round(sizeCm[ax])} cm`}
            </div>
            {d && (
              <button
                ref={(el) => {
                  handleRefs.current[ax] = el;
                }}
                type="button"
                onPointerDown={(e) => startDrag(ax, e)}
                title={`Tarik untuk mengubah ${d.label.toLowerCase()}`}
                aria-label={`Tarik untuk mengubah ${d.label.toLowerCase()} (${d.value} cm)`}
                className="absolute left-0 top-0 w-11 h-11 flex items-center justify-center rounded-full touch-none cursor-grab active:cursor-grabbing"
                style={{ display: 'none' }}
              >
                <span
                  className={`w-6 h-6 rounded-full border-[3px] border-white shadow-md flex items-center justify-center text-[11px] leading-none font-black text-white transition-transform ${
                    dragging ? 'bg-sky-700 scale-125' : 'bg-sky-500'
                  }`}
                >
                  {ax === 'y' ? '↕' : '↔'}
                </span>
              </button>
            )}
          </React.Fragment>
        );
      })}

      <div className="absolute top-2 left-2 max-w-[calc(100%-158px)] overflow-x-auto no-scrollbar flex gap-1 p-1 rounded-xl bg-white/85 backdrop-blur border border-stone-300 shadow-sm">
        {views.map((v) => (
          <button
            key={v.id}
            onClick={() => goTo(v.id)}
            className={`shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${view === v.id ? 'bg-stone-800 text-white' : 'text-stone-600 hover:bg-stone-200'}`}
          >
            {v.label}
          </button>
        ))}
      </div>
      <div className="absolute top-2 right-2 flex gap-1 p-1 rounded-xl bg-white/85 backdrop-blur border border-stone-300 shadow-sm">
        <button
          onClick={toggleDims}
          aria-pressed={showDims}
          title="Garis ukuran & titik biru yang bisa ditarik"
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${showDims ? 'bg-sky-600 text-white' : 'text-stone-600 hover:bg-stone-200'}`}
        >
          Ukuran
        </button>
        <button
          onClick={toggleHuman}
          aria-pressed={showHuman}
          title="Orang setinggi 165 cm sebagai pembanding"
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${showHuman ? 'bg-sky-600 text-white' : 'text-stone-600 hover:bg-stone-200'}`}
        >
          Orang
        </button>
      </div>
      {hasHinges && (
        <div className="absolute bottom-2 left-2 px-2.5 py-1.5 rounded-lg bg-amber-100/90 border border-amber-300 text-[11px] font-semibold text-amber-900 pointer-events-none">
          Klik engsel untuk menekuk / meluruskan
        </div>
      )}
      <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-white/80 text-[10px] text-stone-500 pointer-events-none hidden sm:block">
        Seret: putar · Scroll / cubit: zoom · Klik kanan / 2 jari: geser · Tarik titik biru: ubah ukuran
      </div>
    </div>
  );
};
