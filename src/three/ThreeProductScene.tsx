import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { KitchenConfig } from '../types/kitchen';
import { ProductBuild } from '../products/types';
import { buildFrameGroup, HingeAnimState, HingePart } from './frameBuilder';
import { createFloorTileTexture } from '../utils/proceduralTextures';
import { getValidHinges } from '../utils/frameHinges';
import { getFrameMembers } from '../utils/frameLayout';

type ViewPreset = 'iso' | 'front' | 'side' | 'top';

interface Props {
  host: KitchenConfig; // konfigurasi inang rangka (lihat products/common.toFrameHost)
  build: ProductBuild;
  paint: string; // warna cat rangka
  boardMaterial: string; // multiplek | hpl | kayu | none
  fitKey: string; // ganti nilai ini (mis. id produk) untuk mengepaskan kamera ulang
  selectedId?: string | null; // batang yang disorot
  onSelect?: (memberId: string | null) => void; // ketuk batang (null = ketuk area kosong)
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
export const ThreeProductScene: React.FC<Props> = ({ host, build, paint, boardMaterial, fitKey, selectedId, onSelect }) => {
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
  const [glError, setGlError] = useState(false);
  const [view, setView] = useState<ViewPreset>('iso');

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
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xeeece7);
    const w = container.clientWidth || 300;
    const h = container.clientHeight || 300;
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.05, 60);
    camera.position.set(2, 1.6, 2.4);
    cameraRef.current = camera;
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // kamera tidak bisa masuk ke bawah lantai
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
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.001;
    floor.receiveShadow = true;
    scene.add(floor);

    const group = new THREE.Group();
    scene.add(group);
    groupRef.current = group;

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
    const onLost = (e: Event) => {
      e.preventDefault();
      setGlError(true);
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

    return () => {
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
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

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

    const W = build.W / 100;
    const D = build.D / 100;
    sizeRef.current = { W: build.W / 100, D: build.D / 100, H: build.H / 100 };
    const leftX = -W / 2;
    const backZ = -D / 2;

    const frameMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(paint), metalness: 0.55, roughness: 0.42 });
    group.add(buildFrameGroup(host, leftX, backZ, 0, frameMat, hingePartsRef.current, hingeAnimRef.current));

    // Papan
    if (build.boards.length) {
      const boardMat =
        boardMaterial === 'kayu'
          ? new THREE.MeshStandardMaterial({ color: 0xa8743f, roughness: 0.55 })
          : boardMaterial === 'hpl'
          ? new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.45 })
          : new THREE.MeshStandardMaterial({ color: 0xd9be92, roughness: 0.75 });
      build.boards.forEach((b) => {
        if (boardMaterial === 'none' && !b.steelMm && !b.color) return; // papan kayu tidak dipakai
        const sx = (b.box.max[0] - b.box.min[0]) / 100;
        const sy = (b.box.max[1] - b.box.min[1]) / 100;
        const sz = (b.box.max[2] - b.box.min[2]) / 100;
        const mat = b.steelMm ? frameMat : b.color ? new THREE.MeshStandardMaterial({ color: new THREE.Color(b.color), roughness: 0.9 }) : boardMat;
        const m =
          b.shape === 'round'
            ? new THREE.Mesh(new THREE.CylinderGeometry(Math.min(sx, sz) / 2, Math.min(sx, sz) / 2, sy, 48), mat)
            : new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
        m.position.set(leftX + (b.box.min[0] / 100 + sx / 2), b.box.min[1] / 100 + sy / 2, backZ + b.box.min[2] / 100 + sz / 2);
        if (b.rotX) m.rotation.x = (b.rotX * Math.PI) / 180;
        if (b.attachTo) m.userData.attachTo = b.attachTo;
        m.castShadow = true;
        m.receiveShadow = true;
        group.add(m);
      });
    }

    // Papan yang menempel ke batang berengsel ikut pivotnya (diukur saat semua engsel posisi diam;
    // loop animasi mengembalikan sudut engsel di frame berikutnya)
    const attachables = group.children.filter((o) => o.userData.attachTo);
    if (attachables.length) {
      hingePartsRef.current.forEach((h) => h.pivot.quaternion.identity());
      group.updateMatrixWorld(true);
      attachables.forEach((boardMesh) => {
        let target: THREE.Object3D | null = null;
        group.traverse((o) => {
          if (!target && o !== boardMesh && o.userData.memberId === boardMesh.userData.attachTo) target = o;
        });
        const parent = (target as THREE.Object3D | null)?.parent;
        if (parent && parent !== group) parent.attach(boardMesh);
      });
    }

    // Tembok di belakang untuk produk yang dibaut ke dinding
    if (build.wall) {
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(Math.max(2.4, W + 1.2), 2.6), new THREE.MeshStandardMaterial({ color: 0xb9ad99, roughness: 0.95 }));
      wall.position.set(0, 1.3, backZ - 0.002);
      wall.receiveShadow = true;
      group.add(wall);
    }

    // Roda
    if (build.casters.length) {
      const metal = new THREE.MeshStandardMaterial({ color: 0xb8bcc2, metalness: 0.85, roughness: 0.3 });
      const rubber = new THREE.MeshStandardMaterial({ color: 0x2b2d31, roughness: 0.8 });
      const brakeMat = new THREE.MeshStandardMaterial({ color: 0xd2452c, roughness: 0.5 });
      build.casters.forEach((c) => {
        const r = (c.sizeInch * 2.54) / 2 / 100;
        const top = c.topY / 100;
        const x = leftX + c.x / 100;
        const z = backZ + c.z / 100;
        const plate = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.005, 0.07), metal);
        plate.position.set(x, top - 0.0025, z);
        group.add(plate);
        const forkH = top - 0.005 - r;
        [-1, 1].forEach((s) => {
          const fork = new THREE.Mesh(new THREE.BoxGeometry(0.004, forkH + r * 0.4, 0.03), metal);
          fork.position.set(x + s * 0.016, r * 0.8 + (forkH + r * 0.4) / 2 - r * 0.2, z);
          group.add(fork);
        });
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.024, 24), rubber);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, r, z);
        wheel.castShadow = true;
        group.add(wheel);
        if (c.brake) {
          const tab = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.006, 0.025), brakeMat);
          tab.position.set(x, r * 1.6, z + r * 0.9);
          group.add(tab);
        }
      });
    }
  }, [host, build, paint, boardMaterial]);

  // ---------- Sorot batang terpilih ----------
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    const hi = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xb45309, emissiveIntensity: 0.45, metalness: 0.3, roughness: 0.45 });
    group.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || !mesh.userData.memberId) return;
      if (!mesh.userData.origMat) mesh.userData.origMat = mesh.material;
      mesh.material = mesh.userData.memberId === selectedId ? hi : (mesh.userData.origMat as THREE.Material);
    });
    return () => hi.dispose();
  }, [selectedId, host, build, paint, boardMaterial]);

  // ---------- Kamera ----------
  const goTo = (v: ViewPreset, instant = false) => {
    const cam = cameraRef.current;
    const ctl = controlsRef.current;
    if (!cam || !ctl) return;
    const { W, D, H } = sizeRef.current;
    // Jarak kamera dari bola pembungkus produk: r / sin(setengah sudut pandang tersempit)
    const r = 0.5 * Math.sqrt(W * W + D * D + H * H);
    const fv = THREE.MathUtils.degToRad(cam.fov);
    const fh = 2 * Math.atan(Math.tan(fv / 2) * cam.aspect);
    const dist = (r / Math.sin(Math.min(fv, fh) / 2)) * 1.08;
    const look = new THREE.Vector3(0, H / 2, 0);
    const dir =
      v === 'front'
        ? new THREE.Vector3(0, 0.12, 1)
        : v === 'side'
        ? new THREE.Vector3(1, 0.12, 0)
        : v === 'top'
        ? new THREE.Vector3(0, 1, 0.0001)
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
  }, [fitKey]);

  const hasHinges = getValidHinges(host, getFrameMembers(host)).length > 0;
  const views: { id: ViewPreset; label: string }[] = [
    { id: 'iso', label: '3D' },
    { id: 'front', label: 'Depan' },
    { id: 'side', label: 'Samping' },
    { id: 'top', label: 'Atas' },
  ];

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#eeece7]">
      <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none" />
      {glError && (
        <div className="absolute inset-0 flex items-center justify-center p-6 bg-[#eeece7] text-center text-sm text-stone-600">
          Tampilan 3D tidak bisa dimuat di browser ini. Pengaturan, tampilan 2D dan potongan besi tetap bisa dipakai.
        </div>
      )}
      <div className="absolute top-2 left-2 flex gap-1 p-1 rounded-xl bg-white/85 backdrop-blur border border-stone-300 shadow-sm">
        {views.map((v) => (
          <button
            key={v.id}
            onClick={() => goTo(v.id)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${view === v.id ? 'bg-stone-800 text-white' : 'text-stone-600 hover:bg-stone-200'}`}
          >
            {v.label}
          </button>
        ))}
      </div>
      {hasHinges && (
        <div className="absolute bottom-2 left-2 px-2.5 py-1.5 rounded-lg bg-amber-100/90 border border-amber-300 text-[11px] font-semibold text-amber-900 pointer-events-none">
          Klik engsel untuk menekuk / meluruskan
        </div>
      )}
      <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-white/80 text-[10px] text-stone-500 pointer-events-none hidden sm:block">
        Seret: putar · Scroll / cubit: zoom · Klik kanan / 2 jari: geser
      </div>
    </div>
  );
};
