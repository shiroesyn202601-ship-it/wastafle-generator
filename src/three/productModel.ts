import * as THREE from 'three';
import { KitchenConfig } from '../types/kitchen';
import { ProductBuild } from '../products/types';
import { buildFrameGroup, HingeAnimState, HingePart } from './frameBuilder';

/**
 * Model 3D lengkap sebuah produk (rangka + engsel, papan, tembok, roda) dalam satu grup.
 * Dipakai scene 3D interaktif dan pembuat gambar kecil (thumbnail) di Beranda.
 */
export function buildProductModel(
  group: THREE.Group,
  host: KitchenConfig,
  build: ProductBuild,
  paint: string,
  boardMaterial: string,
  hingeParts: HingePart[],
  hingeAnim: Map<string, HingeAnimState>,
  opts: { wall?: boolean } = {}
): void {
  const W = build.W / 100;
  const D = build.D / 100;
  const leftX = -W / 2;
  const backZ = -D / 2;

  const frameMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(paint), metalness: 0.55, roughness: 0.42 });
  group.add(buildFrameGroup(host, leftX, backZ, 0, frameMat, hingeParts, hingeAnim));

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
    hingeParts.forEach((h) => h.pivot.quaternion.identity());
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
  if (build.wall && opts.wall !== false) {
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
}
