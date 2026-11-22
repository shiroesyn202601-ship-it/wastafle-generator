import * as THREE from 'three';
import { KitchenConfig } from '../types/kitchen';
import { getFrameMembers, getFootMembers, memberTubeCm, memberSectionCm, memberBox, memberCorners, Box3 as FrameBox } from '../utils/frameLayout';
import { FrameMember } from '../types/kitchen';
import { getValidHinges, computeHingeLimit, HINGE_TYPES, HingeLimit } from '../utils/frameHinges';
import { createFjlTexture } from '../utils/proceduralTextures';
import { getFjlSpecies } from '../utils/finishes';

/** Bagian rangka yang bisa ditekuk (pivot engsel) + status animasinya */
export interface HingePart {
  id: string;
  pivot: THREE.Group;
  axis: THREE.Vector3;
  limit: number; // radian
}
export interface HingeAnimState {
  angle: number;
  target: number;
}

/**
 * Rangka dari daftar batang (cm -> meter), lengkap dengan engsel (titik / sejajar / poros, bertingkat).
 * Dipakai bersama oleh scene 3D meja dapur dan scene 3D produk lain.
 * Kaki stel dipasang di bawah tiang yang menapak di atas zona kaki (plinthH > 0).
 */
export function buildFrameGroup(
  cfg: KitchenConfig,
  leftX: number,
  backZ: number,
  plinthH: number,
  mat: THREE.Material,
  hingeParts: HingePart[],
  hingeAnim: Map<string, HingeAnimState>
): THREE.Group {
  const frameGroup = new THREE.Group();
  const members = getFrameMembers(cfg);
  const hingeByMember = new Map(getValidHinges(cfg, members).map((h) => [h.memberId, h]));
  const toWorld = (p: number[]) => new THREE.Vector3(leftX + p[0] / 100, p[1] / 100, backZ + p[2] / 100);
  const boxMesh = (b: FrameBox, origin?: THREE.Vector3) => {
    const size = [0, 1, 2].map((i) => Math.max(0.002, (b.max[i] - b.min[i]) / 100));
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), mat);
    const c = toWorld([0, 1, 2].map((i) => (b.min[i] + b.max[i]) / 2));
    mesh.position.copy(origin ? c.sub(origin) : c);
    mesh.castShadow = true;
    return mesh;
  };
  /** Papan kayu: motif FJL sesuai pilihan top table, serat searah sisi terpanjang (1 tile tekstur = 100 cm) */
  const woodMesh = (b: FrameBox, origin?: THREE.Vector3) => {
    const sp = getFjlSpecies(cfg.countertopFjl);
    const base = createFjlTexture(cfg.countertopFjl?.species || 'jati', sp.base, sp.light, sp.dark);
    const size = [0, 1, 2].map((i) => Math.max(0.2, b.max[i] - b.min[i]));
    const long = size[0] >= size[2] ? 0 : 2;
    const tex = base.clone();
    tex.needsUpdate = true;
    tex.repeat.set(size[long] / 100, size[long === 0 ? 2 : 0] / 100);
    if (long === 2) {
      tex.center.set(0.5, 0.5);
      tex.rotation = Math.PI / 2;
    }
    const woodMat = new THREE.MeshStandardMaterial({ map: tex, roughness: cfg.countertopFjl?.coat === 'glossy' ? 0.2 : 0.5, metalness: 0.03 });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0] / 100, size[1] / 100, size[2] / 100), woodMat);
    const c = toWorld([0, 1, 2].map((i) => (b.min[i] + b.max[i]) / 2));
    mesh.position.copy(origin ? c.sub(origin) : c);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };
  /** Mesh satu batang utuh (lurus atau miring); origin = titik pivot bila menjadi anak pivot engsel */
  const memberMesh = (m: FrameMember, origin?: THREE.Vector3) => {
    const sec = memberSectionCm(m, cfg);
    if (!m.end && m.material === 'wood') return woodMesh(memberBox(m, sec), origin);
    if (!m.end) return boxMesh(memberBox(m, sec), origin);
    // Prisma 8 sudut (ujung dipotong miring) dalam koordinat dunia relatif ke origin
    const cs = memberCorners(m, sec).map((p) => {
      const w = toWorld(p);
      return origin ? w.sub(origin) : w;
    });
    const center = cs.reduce((acc, v) => acc.add(v), new THREE.Vector3()).multiplyScalar(1 / 8);
    // indeks sudut: i (sepanjang batang) * 4 + j (samping) * 2 + k (bidang miring)
    const faces = [
      [0, 1, 3, 2],
      [4, 6, 7, 5],
      [0, 4, 5, 1],
      [2, 3, 7, 6],
      [0, 2, 6, 4],
      [1, 5, 7, 3],
    ];
    const pos: number[] = [];
    faces.forEach((f) => {
      let [a, b, c, d] = f.map((i) => cs[i]);
      const fc = a.clone().add(b).add(c).add(d).multiplyScalar(0.25);
      const nrm = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
      if (nrm.dot(fc.clone().sub(center)) < 0) [b, d] = [d, b]; // pastikan menghadap keluar
      [a, b, c, a, c, d].forEach((v) => pos.push(v.x, v.y, v.z));
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    return mesh;
  };
  /** Tandai mesh dengan id batang supaya bisa diketuk / disorot di 3D */
  const tag = (mesh: THREE.Mesh, id: string) => {
    mesh.userData.memberId = id;
    return mesh;
  };

  // Sudut batas tiap engsel + batang daun lipat yang ikut berputar
  const limByMember = new Map<string, HingeLimit>();
  hingeByMember.forEach((h, mid) => {
    const l = computeHingeLimit(cfg, members, h);
    if (l && l.geometry.movingLen >= 0.1) limByMember.set(mid, l);
  });
  // Pemilik batang = engsel dengan daun terkecil yang memuatnya (engsel paling dalam).
  // Batang berengsel juga bisa dimiliki engsel lain: seluruh engselnya ikut terbawa (engsel bertingkat).
  const leafOwner = new Map<string, string>();
  members.forEach((m) => {
    let best: { owner: string; size: number } | null = null;
    limByMember.forEach((l, mid) => {
      if (mid === m.id || !l.leafIds.includes(m.id)) return;
      if (!best || l.leafIds.length < best.size) best = { owner: mid, size: l.leafIds.length };
    });
    if (best) leafOwner.set(m.id, (best as { owner: string }).owner);
  });
  const pivots = new Map<string, { pivot: THREE.Group; pivotW: THREE.Vector3; container: THREE.Group }>();

  members.forEach((m) => {
    const hinge = hingeByMember.get(m.id);
    const lim = hinge ? limByMember.get(m.id) || null : null;
    if (hinge && lim) {
      const g = lim.geometry;
      // Semua bagian engsel ini dikumpulkan dalam satu wadah (koordinat dunia) supaya bisa ikut engsel lain
      const container = new THREE.Group();
      frameGroup.add(container);
      if (g.fixedBox) container.add(tag(boxMesh(g.fixedBox), m.id));

      // Pivot di as engsel: bagian bergerak jadi anak pivot, lalu diputar di sekitar sumbu a
      const pivotW = toWorld(g.pivot);
      const pivot = new THREE.Group();
      pivot.position.copy(pivotW);
      pivot.userData.hingeId = hinge.id;
      if (!g.axle) pivot.add(tag(boxMesh(g.movingBox, pivotW), m.id));
      container.add(pivot);
      pivots.set(m.id, { pivot, pivotW, container });

      const axis = new THREE.Vector3(g.a[0], g.a[1], g.a[2]).normalize();
      const u = new THREE.Vector3(g.u[0], g.u[1], g.u[2]);
      const n = new THREE.Vector3(g.n[0], g.n[1], g.n[2]);
      const widthA = (g.half[2] * 2) / 100;
      const type = hinge.type;
      const info = HINGE_TYPES[type];
      const isEdge = hinge.mode === 'edge';
      const hingeMat = new THREE.MeshStandardMaterial({ color: type === 'folding-lock' ? 0x9ca3af : 0xc7ccd4, metalness: 0.9, roughness: 0.25 });
      const accentMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(info.color), metalness: 0.4, roughness: 0.4, emissive: new THREE.Color(info.color), emissiveIntensity: 0.25 });
      const alignToAxis = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis);
      const hitAt = (p: THREE.Vector3) => {
        const hitTarget = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshBasicMaterial({ visible: false }));
        hitTarget.position.copy(p);
        hitTarget.userData.hingeId = hinge.id;
        container.add(hitTarget);
      };

      if (g.axle) {
        // Engsel poros: baut poros menembus kaki di titik putar (kaki diam, daun meja berputar)
        const points = [pivotW, ...(g.partnerPivot ? [toWorld(g.partnerPivot)] : [])];
        points.forEach((p) => {
          const len = widthA + 0.024;
          const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, len, 20), hingeMat);
          bolt.quaternion.copy(alignToAxis);
          bolt.position.copy(p);
          bolt.userData.hingeId = hinge.id;
          container.add(bolt);
          [-1, 1].forEach((sgn) => {
            const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.006, 20), accentMat);
            cap.quaternion.copy(alignToAxis);
            cap.position.copy(p).addScaledVector(axis, (sgn * len) / 2);
            cap.userData.hingeId = hinge.id;
            container.add(cap);
          });
          hitAt(p);
        });
      } else {
        const knR = type === 'barrel-weld' ? 0.009 : type === 'piano' ? 0.0045 : 0.0065;
        // Engsel memanjang: piano selebar batang, jenis lain dipasang sepasang dekat kedua ujung
        const spots = isEdge && type !== 'piano' ? [-0.35 * widthA, 0.35 * widthA] : [0];
        const knL =
          isEdge && type !== 'piano'
            ? Math.min(0.08, widthA * 0.18)
            : widthA * (type === 'piano' ? 1.0 : type === 'barrel-weld' ? 0.7 : 0.85);
        const leafLen = Math.min(type === 'piano' ? 0.03 : 0.045, (g.movingLen / 100) * 0.9);
        const ui = Math.abs(u.x) > 0.5 ? 0 : Math.abs(u.y) > 0.5 ? 1 : 2;
        const ni = Math.abs(n.x) > 0.5 ? 0 : Math.abs(n.y) > 0.5 ? 1 : 2;
        const leafGeo = (len: number) => {
          const dims = [0, 0, 0];
          dims[ui] = len;
          dims[ni] = 0.002;
          dims[3 - ui - ni] = knL;
          return new THREE.BoxGeometry(dims[0], dims[1], dims[2]);
        };

        spots.forEach((off) => {
          const at = pivotW.clone().addScaledVector(axis, off);
          const knuckle = new THREE.Mesh(new THREE.CylinderGeometry(knR, knR, knL, 20), hingeMat);
          knuckle.quaternion.copy(alignToAxis);
          knuckle.position.copy(at).addScaledVector(n, knR * 0.6);
          knuckle.userData.hingeId = hinge.id;
          container.add(knuckle);
          // Cincin warna jenis engsel supaya mudah dicari & diklik
          const ring = new THREE.Mesh(new THREE.CylinderGeometry(knR * 1.25, knR * 1.25, Math.min(0.008, knL * 0.25), 20), accentMat);
          ring.quaternion.copy(alignToAxis);
          ring.position.copy(knuckle.position);
          ring.userData.hingeId = hinge.id;
          container.add(ring);

          if (type !== 'barrel-weld') {
            // Daun engsel: satu di batang tetap, satu ikut berputar bersama potongan lipat
            if (g.fixedLen > 0.5 || isEdge) {
              const fixedLeaf = new THREE.Mesh(leafGeo(leafLen), hingeMat);
              fixedLeaf.position.copy(at).addScaledVector(u, -leafLen / 2).addScaledVector(n, 0.001);
              fixedLeaf.userData.hingeId = hinge.id;
              container.add(fixedLeaf);
            }
            const movingLeaf = new THREE.Mesh(leafGeo(leafLen), hingeMat);
            movingLeaf.position.copy(axis).multiplyScalar(off).addScaledVector(u, leafLen / 2).addScaledVector(n, 0.001);
            pivot.add(movingLeaf);
          } else {
            // Engsel pipa las: dua tabung pendek di kiri-kanan knuckle
            [-1, 1].forEach((sgn) => {
              const stub = new THREE.Mesh(new THREE.CylinderGeometry(knR * 0.55, knR * 0.55, knL * 0.18, 12), hingeMat);
              stub.quaternion.copy(alignToAxis);
              stub.position.copy(knuckle.position).addScaledVector(axis, (sgn * (knL + knL * 0.18)) / 2);
              container.add(stub);
            });
          }
          if (type === 'folding-lock') {
            // Lengan pengunci (ikut potongan lipat)
            const arm = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.004, 0.004), accentMat);
            arm.position.copy(axis).multiplyScalar(off).addScaledVector(u, leafLen * 0.8).addScaledVector(n, 0.004);
            pivot.add(arm);
          }
        });
        hitAt(pivotW);
      }

      const limit = (lim.limitDeg * Math.PI) / 180;
      const st = hingeAnim.get(hinge.id) || { angle: 0, target: 0 };
      st.angle = Math.min(st.angle, limit);
      st.target = Math.min(st.target, limit);
      hingeAnim.set(hinge.id, st);
      pivot.quaternion.setFromAxisAngle(axis, st.angle);
      hingeParts.push({ id: hinge.id, pivot, axis, limit });
      return;
    }
    if (leafOwner.has(m.id)) return; // digambar sebagai anak pivot engselnya (di bawah)

    frameGroup.add(tag(memberMesh(m), m.id));
  });

  // Daun lipat: batang yang ikut berputar bersama engsel pemiliknya
  leafOwner.forEach((owner, id) => {
    const pv = pivots.get(owner);
    const nested = pivots.get(id);
    if (nested) {
      // Engsel bertingkat: seluruh wadah engsel ini menempel ke pivot engsel pemilik
      if (pv && pv.container !== nested.container) {
        frameGroup.remove(nested.container);
        nested.container.position.copy(pv.pivotW).multiplyScalar(-1);
        pv.pivot.add(nested.container);
      }
      return;
    }
    const mm = members.find((x) => x.id === id);
    if (!mm) return;
    if (pv) pv.pivot.add(tag(memberMesh(mm, pv.pivotW), id));
    else frameGroup.add(tag(memberMesh(mm), id));
  });

  const feet = getFootMembers(cfg, members).filter((m) => !leafOwner.has(m.id));
  if (feet.length > 0 && plinthH > 0.005) {
    const footMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.9, roughness: 0.2 });
    feet.forEach((m) => {
      const t = memberTubeCm(m, cfg) / 100;
      const footH = Math.min(plinthH, m.y / 100);
      if (footH <= 0.003) return;
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(t * 0.45, t * 0.6, footH, 16), footMat);
      foot.position.set(leftX + m.x / 100, footH / 2, backZ + m.z / 100);
      frameGroup.add(foot);
    });
  }

  return frameGroup;
}
