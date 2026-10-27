import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { KitchenConfig } from '../types/kitchen';
import {
  createWoodTexture,
  createMarbleTexture,
  createGraniteTexture,
  createTileBacksplashTexture,
  createFloorTileTexture,
  createContactShadowTexture,
} from '../utils/proceduralTextures';

interface Props {
  config: KitchenConfig;
  onSelectElement?: (type: 'counter' | 'column' | 'sink' | 'stove', index?: number) => void;
  selectedElement?: { type: string; index?: number } | null;
}

export const ThreeKitchenScene: React.FC<Props> = ({ config }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const kitchenGroupRef = useRef<THREE.Group | null>(null);

  // References to studio ambient and directional lights
  const lightsRef = useRef<{
    keyLight: THREE.DirectionalLight;
    fillLight: THREE.DirectionalLight;
    hemiLight: THREE.HemisphereLight;
    rimLight: THREE.DirectionalLight;
  } | null>(null);

  // References to animated parts:
  const animatedPartsRef = useRef<{
    drawers: { mesh: THREE.Group; maxOffset: number; baseZ: number }[];
    doors: { mesh: THREE.Group; maxAngle: number; isLeftHinge: boolean }[];
  }>({ drawers: [], doors: [] });

  // Camera preset animation target
  const cameraAnimRef = useRef<{
    active: boolean;
    targetPos: THREE.Vector3;
    targetLook: THREE.Vector3;
    progress: number;
  }>({
    active: false,
    targetPos: new THREE.Vector3(0, 1.2, 2.8),
    targetLook: new THREE.Vector3(0, 0.45, 0),
    progress: 1,
  });

  // Track latest config in a ref so the render tick always has current state
  const configRef = useRef(config);
  configRef.current = config;

  // Initialize Scene once on mount
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL guard
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf6f2ed);
    sceneRef.current = scene;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
    camera.position.set(1.6, 1.7, 3.2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Studio Room Environment for authentic metallic and marble reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.minDistance = 0.8;
    controls.maxDistance = 7.0;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controls.target.set(0, 0.45, 0);
    controlsRef.current = controls;

    // Studio Lighting Rig
    const keyLight = new THREE.DirectionalLight(0xffeed6, 2.4);
    keyLight.position.set(3.5, 4.5, 4.0);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 12;
    keyLight.shadow.camera.left = -2.5;
    keyLight.shadow.camera.right = 2.5;
    keyLight.shadow.camera.top = 2.5;
    keyLight.shadow.camera.bottom = -1;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffd8b0, 1.1);
    fillLight.position.set(-3.5, 2.8, 2.5);
    scene.add(fillLight);

    const hemiLight = new THREE.HemisphereLight(0xfff3e6, 0xc9b097, 0.7);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(0xffebd2, 0.85);
    rimLight.position.set(0, 3.5, -3.5);
    scene.add(rimLight);

    lightsRef.current = { keyLight, fillLight, hemiLight, rimLight };

    // Floor & Contact Shadow
    const floorGeo = new THREE.PlaneGeometry(16, 16);
    const floorMat = new THREE.MeshStandardMaterial({
      map: createFloorTileTexture(),
      roughness: 0.6,
      metalness: 0.1,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -0.001;
    floorMesh.receiveShadow = !isSoftwareGl;
    scene.add(floorMesh);

    // Contact shadow plane beneath counter
    const shadowGeo = new THREE.PlaneGeometry(5, 2.4);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: createContactShadowTexture(),
      transparent: true,
      depthWrite: false,
      opacity: 0.75,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.002;
    scene.add(shadowMesh);

    // Main Group for the Kitchen Counter
    const kitchenGroup = new THREE.Group();
    scene.add(kitchenGroup);
    kitchenGroupRef.current = kitchenGroup;

    // Animation Loop
    let animationFrameId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Camera preset glide transition
      if (cameraAnimRef.current.active) {
        camera.position.lerp(cameraAnimRef.current.targetPos, 0.08);
        controls.target.lerp(cameraAnimRef.current.targetLook, 0.08);
        if (camera.position.distanceTo(cameraAnimRef.current.targetPos) < 0.01) {
          cameraAnimRef.current.active = false;
        }
      }

      controls.update();

      // Animate drawers pull-out based on configRef.current.drawersOpenPercent
      const drawerTargetFraction = configRef.current.drawersOpenPercent / 100;
      animatedPartsRef.current.drawers.forEach((drawer) => {
        const targetZ = drawer.baseZ + drawer.maxOffset * drawerTargetFraction;
        drawer.mesh.position.z = THREE.MathUtils.damp(drawer.mesh.position.z, targetZ, 8, delta);
      });

      // Animate doors swing based on configRef.current.doorsOpenPercent
      const doorTargetFraction = configRef.current.doorsOpenPercent / 100;
      animatedPartsRef.current.doors.forEach((door) => {
        const targetAngle = (door.isLeftHinge ? -1 : 1) * door.maxAngle * doorTargetFraction;
        door.mesh.rotation.y = THREE.MathUtils.damp(door.mesh.rotation.y, targetAngle, 8, delta);
      });

      renderer.render(scene, camera);
    };

    animate();

    // Resize Observer
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Re-build 3D Kitchen meshes whenever config changes
  useEffect(() => {
    const kitchenGroup = kitchenGroupRef.current;
    const scene = sceneRef.current;
    if (!kitchenGroup || !scene) return;

    // Clear previous geometries and materials to avoid memory leaks
    while (kitchenGroup.children.length > 0) {
      const child = kitchenGroup.children[0];
      kitchenGroup.remove(child);
      disposeHierarchy(child);
    }
    animatedPartsRef.current = { drawers: [], doors: [] };

    // Update ambient temperature & intensity in 3D scene
    const lighting = config.lighting || {
      ledStripEnabled: true,
      ledStripColor: '#ffc87a',
      ledStripBrightness: 80,
      ledStripPosition: 'both',
      ambientTemperature: 'warm',
      ambientIntensity: 1.0,
    };

    if (lightsRef.current && sceneRef.current) {
      const { keyLight, fillLight, hemiLight, rimLight } = lightsRef.current;
      const intensity = lighting.ambientIntensity ?? 1.0;
      const temp = lighting.ambientTemperature || 'warm';

      if (temp === 'warm') {
        keyLight.color.setHex(0xffeed6);
        keyLight.intensity = 2.4 * intensity;
        fillLight.color.setHex(0xffd8b0);
        fillLight.intensity = 1.0 * intensity;
        hemiLight.color.setHex(0xfff3e6);
        hemiLight.groundColor.setHex(0xc9b097);
        hemiLight.intensity = 0.7 * intensity;
        rimLight.color.setHex(0xffebd2);
        rimLight.intensity = 0.85 * intensity;
        sceneRef.current.background = new THREE.Color(0xf6f2ed);
      } else if (temp === 'natural') {
        keyLight.color.setHex(0xfff9f2);
        keyLight.intensity = 2.2 * intensity;
        fillLight.color.setHex(0xebf3ff);
        fillLight.intensity = 1.0 * intensity;
        hemiLight.color.setHex(0xffffff);
        hemiLight.groundColor.setHex(0xc8ced6);
        hemiLight.intensity = 0.7 * intensity;
        rimLight.color.setHex(0xffffff);
        rimLight.intensity = 0.8 * intensity;
        sceneRef.current.background = new THREE.Color(0xf3f4f6);
      } else if (temp === 'cool') {
        keyLight.color.setHex(0xe8f2ff);
        keyLight.intensity = 2.3 * intensity;
        fillLight.color.setHex(0xd0e4ff);
        fillLight.intensity = 1.1 * intensity;
        hemiLight.color.setHex(0xeaf4ff);
        hemiLight.groundColor.setHex(0xb2c2d4);
        hemiLight.intensity = 0.75 * intensity;
        rimLight.color.setHex(0xe0eeff);
        rimLight.intensity = 0.85 * intensity;
        sceneRef.current.background = new THREE.Color(0xedf1f5);
      } else if (temp === 'evening-mood') {
        keyLight.color.setHex(0xffa147);
        keyLight.intensity = 1.2 * intensity;
        fillLight.color.setHex(0x354461);
        fillLight.intensity = 0.75 * intensity;
        hemiLight.color.setHex(0x403653);
        hemiLight.groundColor.setHex(0x16141c);
        hemiLight.intensity = 0.45 * intensity;
        rimLight.color.setHex(0x56719e);
        rimLight.intensity = 0.6 * intensity;
        sceneRef.current.background = new THREE.Color(0x15161b);
      }
    }

    // Convert cm to meters (100cm = 1m)
    const W = config.totalWidth / 100;
    const D = config.totalDepth / 100;
    const H = config.totalHeight / 100;
    const topThick = config.countertopThickness / 100;
    const plinthH = config.plinthHeight / 100;
    const overhang = config.countertopOverhangFront / 100;
    const carcaseH = H - topThick - plinthH;
    const carcaseD = D - overhang;
    const panelThick = 0.018;

    // Center kitchen in world space:
    const leftX = -W / 2;
    const backZ = -D / 2;
    const frontFaceZ = backZ + carcaseD;

    // Materials setup
    const isWire = config.showXRayWireframe;
    const isFrameOnly = config.showFrameOnly;

    // Countertop Material
    let countertopMat: THREE.Material;
    if (config.countertopMaterial === 'marble-black') {
      countertopMat = new THREE.MeshStandardMaterial({
        map: createMarbleTexture(true),
        roughness: 0.18,
        metalness: 0.1,
        wireframe: isWire,
      });
    } else if (config.countertopMaterial === 'marble-white') {
      countertopMat = new THREE.MeshStandardMaterial({
        map: createMarbleTexture(false),
        roughness: 0.2,
        metalness: 0.08,
        wireframe: isWire,
      });
    } else if (config.countertopMaterial === 'marble-calacatta') {
      countertopMat = new THREE.MeshStandardMaterial({
        map: createMarbleTexture(false),
        color: 0xfffaee,
        roughness: 0.18,
        metalness: 0.12,
        wireframe: isWire,
      });
    } else if (config.countertopMaterial === 'granite-grey') {
      countertopMat = new THREE.MeshStandardMaterial({
        map: createGraniteTexture(),
        roughness: 0.45,
        metalness: 0.12,
        wireframe: isWire,
      });
    } else if (config.countertopMaterial === 'quartz-black') {
      countertopMat = new THREE.MeshStandardMaterial({
        color: 0x141517,
        roughness: 0.15,
        metalness: 0.2,
        wireframe: isWire,
      });
    } else if (config.countertopMaterial === 'wood-oak') {
      countertopMat = new THREE.MeshStandardMaterial({
        map: createWoodTexture(false),
        roughness: 0.35,
        metalness: 0.05,
        wireframe: isWire,
      });
    } else if (config.countertopMaterial === 'wood-teak') {
      countertopMat = new THREE.MeshStandardMaterial({
        map: createWoodTexture(true),
        color: 0x9e6a38,
        roughness: 0.32,
        metalness: 0.05,
        wireframe: isWire,
      });
    } else if (config.countertopMaterial === 'concrete-grey') {
      countertopMat = new THREE.MeshStandardMaterial({
        color: 0x7a8088,
        roughness: 0.7,
        metalness: 0.05,
        wireframe: isWire,
      });
    } else if (config.countertopMaterial === 'terrazzo-white') {
      countertopMat = new THREE.MeshStandardMaterial({
        map: createFloorTileTexture(),
        roughness: 0.25,
        metalness: 0.1,
        wireframe: isWire,
      });
    } else if (config.countertopMaterial === 'stainless-steel') {
      countertopMat = new THREE.MeshStandardMaterial({
        color: 0xd4d8de,
        roughness: 0.22,
        metalness: 0.88,
        wireframe: isWire,
      });
    } else {
      countertopMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(config.customCountertopColor || '#1a1a1a'),
        roughness: 0.25,
        metalness: 0.15,
        wireframe: isWire,
      });
    }

    // Cabinet Finish Material
    let cabinetFaceMat: THREE.Material;
    let cabinetInternalMat: THREE.Material;

    if (config.cabinetFinish === 'wood-natural') {
      cabinetFaceMat = new THREE.MeshStandardMaterial({
        map: createWoodTexture(false),
        roughness: 0.4,
        metalness: 0.05,
        wireframe: isWire,
      });
    } else if (config.cabinetFinish === 'wood-walnut') {
      cabinetFaceMat = new THREE.MeshStandardMaterial({
        map: createWoodTexture(true),
        roughness: 0.38,
        metalness: 0.05,
        wireframe: isWire,
      });
    } else if (config.cabinetFinish === 'wood-teak') {
      cabinetFaceMat = new THREE.MeshStandardMaterial({
        map: createWoodTexture(true),
        color: 0x825432,
        roughness: 0.35,
        metalness: 0.05,
        wireframe: isWire,
      });
    } else if (config.cabinetFinish === 'white-gloss') {
      cabinetFaceMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.15,
        metalness: 0.05,
        wireframe: isWire,
      });
    } else if (config.cabinetFinish === 'charcoal-matte') {
      cabinetFaceMat = new THREE.MeshStandardMaterial({
        color: 0x272a2e,
        roughness: 0.55,
        metalness: 0.1,
        wireframe: isWire,
      });
    } else if (config.cabinetFinish === 'black-matte') {
      cabinetFaceMat = new THREE.MeshStandardMaterial({
        color: 0x141517,
        roughness: 0.6,
        metalness: 0.15,
        wireframe: isWire,
      });
    } else if (config.cabinetFinish === 'sage-green') {
      cabinetFaceMat = new THREE.MeshStandardMaterial({
        color: 0x6e806c,
        roughness: 0.45,
        metalness: 0.08,
        wireframe: isWire,
      });
    } else if (config.cabinetFinish === 'navy-blue') {
      cabinetFaceMat = new THREE.MeshStandardMaterial({
        color: 0x1b283b,
        roughness: 0.35,
        metalness: 0.12,
        wireframe: isWire,
      });
    } else if (config.cabinetFinish === 'terracotta-warm') {
      cabinetFaceMat = new THREE.MeshStandardMaterial({
        color: 0xb55a3c,
        roughness: 0.45,
        metalness: 0.06,
        wireframe: isWire,
      });
    } else if (config.cabinetFinish === 'sand-beige') {
      cabinetFaceMat = new THREE.MeshStandardMaterial({
        color: 0xd6cbbd,
        roughness: 0.4,
        metalness: 0.05,
        wireframe: isWire,
      });
    } else {
      cabinetFaceMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(config.customCabinetColor || '#c49a6c'),
        roughness: 0.38,
        metalness: 0.08,
        wireframe: isWire,
      });
    }

    cabinetInternalMat = new THREE.MeshStandardMaterial({
      color: 0xedebe8,
      roughness: 0.6,
      metalness: 0.05,
      wireframe: isWire,
    });

    // Frame Material
    const frameConfig = config.frame || {
      material: 'hollow-steel-black',
      tubeSize: 40,
      customColor: '#1e2124',
      customRoughness: 0.35,
      customMetalness: 0.85,
      supports: [],
    };

    let frameMat: THREE.Material;
    if (frameConfig.material === 'hollow-steel-black') {
      frameMat = new THREE.MeshStandardMaterial({ color: 0x1a1c1f, roughness: 0.35, metalness: 0.85, wireframe: isWire });
    } else if (frameConfig.material === 'hollow-steel-stainless') {
      frameMat = new THREE.MeshStandardMaterial({ color: 0xd4d8df, roughness: 0.22, metalness: 0.95, wireframe: isWire });
    } else if (frameConfig.material === 'hollow-steel-gold') {
      frameMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.25, metalness: 0.9, wireframe: isWire });
    } else if (frameConfig.material === 'aluminium-profile') {
      frameMat = new THREE.MeshStandardMaterial({ color: 0xa4abb5, roughness: 0.3, metalness: 0.8, wireframe: isWire });
    } else if (frameConfig.material === 'aluminium-black') {
      frameMat = new THREE.MeshStandardMaterial({ color: 0x22252a, roughness: 0.4, metalness: 0.8, wireframe: isWire });
    } else if (frameConfig.material === 'solid-wood') {
      frameMat = new THREE.MeshStandardMaterial({ map: createWoodTexture(true), color: 0x6e472a, roughness: 0.4, metalness: 0.05, wireframe: isWire });
    } else if (frameConfig.material === 'custom') {
      frameMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(frameConfig.customColor || '#1e2124'),
        roughness: frameConfig.customRoughness ?? 0.35,
        metalness: frameConfig.customMetalness ?? 0.85,
        wireframe: isWire,
      });
    } else {
      frameMat = cabinetInternalMat;
    }

    const handleMat = new THREE.MeshStandardMaterial({
      color: config.handleStyle === 'bar-gold' ? 0xd4af37 : config.handleStyle === 'bar-black' ? 0x1a1a1a : 0x888b91,
      roughness: config.handleStyle === 'bar-gold' ? 0.25 : 0.4,
      metalness: 0.85,
    });

    const isHollowChassis =
      frameConfig.material.startsWith('hollow-steel') ||
      frameConfig.material.startsWith('aluminium') ||
      frameConfig.material === 'solid-wood' ||
      frameConfig.material === 'custom';

    // 1. PLINTH / KICKBOARD
    const plinthRecess = 0.05;
    const plinthMat = new THREE.MeshStandardMaterial({ color: 0x1f2226, roughness: 0.7, metalness: 0.1, wireframe: isWire });
    if (!isFrameOnly) {
      const plinthGeo = new THREE.BoxGeometry(W - 0.02, plinthH, carcaseD - plinthRecess);
      const plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
      plinthMesh.position.set(0, plinthH / 2, backZ + (carcaseD - plinthRecess) / 2);
      plinthMesh.castShadow = true;
      plinthMesh.receiveShadow = true;
      kitchenGroup.add(plinthMesh);
    }

    // 2. COUNTERTOP MAIN SLAB WITH REAL CNC CUTOUT HOLES (SOLVES FLAT SINK ISSUE!)
    const topShape = new THREE.Shape();
    const minX = leftX;
    const maxX = leftX + W;
    const minZ = backZ;
    const maxZ = backZ + D;

    topShape.moveTo(minX, -minZ);
    topShape.lineTo(maxX, -minZ);
    topShape.lineTo(maxX, -maxZ);
    topShape.lineTo(minX, -maxZ);
    topShape.closePath();

    // SINK CUTOUT HOLE
    if (config.sink.enabled) {
      const sinkHole = new THREE.Path();
      const scx = leftX + config.sink.posX / 100;
      const scz = backZ + config.sink.posY / 100;
      const holeW = (config.sink.width - 0.02) / 100;
      const holeL = (config.sink.length - 0.02) / 100;
      const r = 0.015;

      const hMinX = scx - holeW / 2;
      const hMaxX = scx + holeW / 2;
      const hMinZ = scz - holeL / 2;
      const hMaxZ = scz + holeL / 2;

      sinkHole.moveTo(hMinX + r, -hMinZ);
      sinkHole.lineTo(hMaxX - r, -hMinZ);
      sinkHole.quadraticCurveTo(hMaxX, -hMinZ, hMaxX, -(hMinZ + r));
      sinkHole.lineTo(hMaxX, -(hMaxZ - r));
      sinkHole.quadraticCurveTo(hMaxX, -hMaxZ, hMaxX - r, -hMaxZ);
      sinkHole.lineTo(hMinX + r, -hMaxZ);
      sinkHole.quadraticCurveTo(hMinX, -hMaxZ, hMinX, -(hMaxZ - r));
      sinkHole.lineTo(hMinX, -(hMinZ + r));
      sinkHole.quadraticCurveTo(hMinX, -hMinZ, hMinX + r, -hMinZ);
      sinkHole.closePath();
      topShape.holes.push(sinkHole);
    }

    // STOVE CUTOUT HOLE
    if (config.stove.enabled) {
      const stoveHole = new THREE.Path();
      const stcx = leftX + config.stove.posX / 100;
      const stcz = backZ + config.stove.posY / 100;
      const stcutW = (config.stove.width - 0.04) / 100;
      const stcutL = (config.stove.length - 0.04) / 100;
      const r = 0.01;

      const sMinX = stcx - stcutW / 2;
      const sMaxX = stcx + stcutW / 2;
      const sMinZ = stcz - stcutL / 2;
      const sMaxZ = stcz + stcutL / 2;

      stoveHole.moveTo(sMinX + r, -sMinZ);
      stoveHole.lineTo(sMaxX - r, -sMinZ);
      stoveHole.quadraticCurveTo(sMaxX, -sMinZ, sMaxX, -(sMinZ + r));
      stoveHole.lineTo(sMaxX, -(sMaxZ - r));
      stoveHole.quadraticCurveTo(sMaxX, -sMaxZ, sMaxX - r, -sMaxZ);
      stoveHole.lineTo(sMinX + r, -sMaxZ);
      stoveHole.quadraticCurveTo(sMinX, -sMaxZ, sMinX, -(sMaxZ - r));
      stoveHole.lineTo(sMinX, -(sMinZ + r));
      stoveHole.quadraticCurveTo(sMinX, -sMinZ, sMinX + r, -sMinZ);
      stoveHole.closePath();
      topShape.holes.push(stoveHole);
    }

    const extrudeSettings = {
      depth: topThick,
      bevelEnabled: true,
      bevelThickness: 0.002,
      bevelSize: 0.002,
      bevelSegments: 2,
    };
    const topGeo = new THREE.ExtrudeGeometry(topShape, extrudeSettings);
    topGeo.rotateX(Math.PI / 2);
    const topMesh = new THREE.Mesh(topGeo, countertopMat);
    topMesh.position.set(0, H, 0);
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    kitchenGroup.add(topMesh);

    // 3. BACKSPLASH
    if (config.backsplashEnabled && config.backsplashHeight > 0) {
      const bsH = config.backsplashHeight / 100;
      const bsThick = 0.02;
      const bsGeo = new THREE.BoxGeometry(W, bsH, bsThick);
      const bsMat = new THREE.MeshStandardMaterial({
        map: createTileBacksplashTexture(),
        roughness: 0.35,
        metalness: 0.1,
      });
      const bsMesh = new THREE.Mesh(bsGeo, bsMat);
      bsMesh.position.set(0, H + bsH / 2, backZ + bsThick / 2);
      bsMesh.castShadow = true;
      bsMesh.receiveShadow = true;
      kitchenGroup.add(bsMesh);
    }

    // 4. UNDER-CABINET & PLINTH LED STRIP LIGHTING
    if (lighting.ledStripEnabled && lighting.ledStripBrightness > 0) {
      const ledColorHex = lighting.ledStripColor || '#ffc87a';
      const ledThreeColor = new THREE.Color(ledColorHex);
      const brightnessFraction = Math.max(0.05, Math.min(1.0, lighting.ledStripBrightness / 100));

      const ledGlowMat = new THREE.MeshBasicMaterial({ color: ledThreeColor });
      const ledProfileMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5, metalness: 0.8 });

      if (lighting.ledStripPosition === 'under-counter' || lighting.ledStripPosition === 'both') {
        const underTopY = H - topThick - 0.003;
        const stripZ = frontFaceZ + 0.008;

        const channelMesh = new THREE.Mesh(new THREE.BoxGeometry(W - 0.02, 0.006, 0.012), ledProfileMat);
        channelMesh.position.set(0, underTopY, stripZ);
        kitchenGroup.add(channelMesh);

        const lensMesh = new THREE.Mesh(new THREE.BoxGeometry(W - 0.04, 0.003, 0.006), ledGlowMat);
        lensMesh.position.set(0, underTopY - 0.002, stripZ);
        kitchenGroup.add(lensMesh);

        const lightCount = Math.max(2, Math.min(6, Math.round(W / 0.55)));
        for (let i = 0; i < lightCount; i++) {
          const t = lightCount === 1 ? 0.5 : i / (lightCount - 1);
          const px = (leftX + 0.12) + t * (W - 0.24);
          const pLight = new THREE.PointLight(ledThreeColor, brightnessFraction * 2.8, 1.4, 2.0);
          pLight.position.set(px, underTopY - 0.025, stripZ + 0.015);
          kitchenGroup.add(pLight);
        }
      }

      if (lighting.ledStripPosition === 'under-plinth' || lighting.ledStripPosition === 'both') {
        const plinthStripY = plinthH + 0.004;
        const plinthStripZ = frontFaceZ - 0.01;

        const plinthChannelMesh = new THREE.Mesh(new THREE.BoxGeometry(W - 0.04, 0.006, 0.01), ledProfileMat);
        plinthChannelMesh.position.set(0, plinthStripY, plinthStripZ);
        kitchenGroup.add(plinthChannelMesh);

        const plinthLensMesh = new THREE.Mesh(new THREE.BoxGeometry(W - 0.06, 0.003, 0.005), ledGlowMat);
        plinthLensMesh.position.set(0, plinthStripY - 0.002, plinthStripZ);
        kitchenGroup.add(plinthLensMesh);

        const plinthLightCount = Math.max(2, Math.min(5, Math.round(W / 0.6)));
        for (let i = 0; i < plinthLightCount; i++) {
          const t = plinthLightCount === 1 ? 0.5 : i / (plinthLightCount - 1);
          const px = (leftX + 0.15) + t * (W - 0.3);
          const pLight = new THREE.PointLight(ledThreeColor, brightnessFraction * 2.2, 0.9, 2.0);
          pLight.position.set(px, plinthStripY - 0.02, plinthStripZ - 0.02);
          kitchenGroup.add(pLight);
        }
      }
    }

    // 5. BESI HOLLOW CHASSIS FRAME + CUSTOM BESIN PENYANGGA (SINK & STOVE CRADLE)
    const tubeM = (frameConfig.tubeSize || 40) / 1000;
    const columnCount = config.columns.length;

    if (isHollowChassis || isFrameOnly) {
      buildHollowFrameStructure(
        kitchenGroup,
        W,
        D,
        H,
        topThick,
        plinthH,
        leftX,
        backZ,
        carcaseD,
        tubeM,
        frameMat,
        config.columns,
        config.sink,
        config.stove,
        frameConfig.supports || []
      );
    }

    // 6. CARCASE SOLID SIDE ENCLOSURE (FIX FOR PEEK-THROUGH GAP)
    const sidePanelThick = 0.02;
    const sidePanelDepth = carcaseD + panelThick;
    const sideCenterZ = backZ + sidePanelDepth / 2;

    if (!isFrameOnly) {
      const leftSideMesh = new THREE.Mesh(new THREE.BoxGeometry(sidePanelThick, carcaseH, sidePanelDepth), cabinetFaceMat);
      leftSideMesh.position.set(leftX + sidePanelThick / 2, plinthH + carcaseH / 2, sideCenterZ);
      leftSideMesh.castShadow = true;
      leftSideMesh.receiveShadow = true;
      kitchenGroup.add(leftSideMesh);

      const rightSideMesh = new THREE.Mesh(new THREE.BoxGeometry(sidePanelThick, carcaseH, sidePanelDepth), cabinetFaceMat);
      rightSideMesh.position.set(leftX + W - sidePanelThick / 2, plinthH + carcaseH / 2, sideCenterZ);
      rightSideMesh.castShadow = true;
      rightSideMesh.receiveShadow = true;
      kitchenGroup.add(rightSideMesh);

      const bottomW = W - sidePanelThick * 2;
      const carcaseBottomMesh = new THREE.Mesh(new THREE.BoxGeometry(bottomW, panelThick, carcaseD), cabinetInternalMat);
      carcaseBottomMesh.position.set(0, plinthH + panelThick / 2, backZ + carcaseD / 2);
      kitchenGroup.add(carcaseBottomMesh);

      const backPanelMesh = new THREE.Mesh(new THREE.BoxGeometry(bottomW, carcaseH, 0.006), cabinetInternalMat);
      backPanelMesh.position.set(0, plinthH + carcaseH / 2, backZ + 0.003);
      kitchenGroup.add(backPanelMesh);

      // Top stretchers: segment around sink and stove cutouts so panels do not pierce appliance bowls
      const sinkMinX = config.sink.enabled ? (leftX + config.sink.posX / 100) - (config.sink.width / 100) / 2 - 0.02 : -999;
      const sinkMaxX = config.sink.enabled ? (leftX + config.sink.posX / 100) + (config.sink.width / 100) / 2 + 0.02 : -999;
      const stoveMinX = config.stove.enabled ? (leftX + config.stove.posX / 100) - (config.stove.width / 100) / 2 - 0.02 : -999;
      const stoveMaxX = config.stove.enabled ? (leftX + config.stove.posX / 100) + (config.stove.width / 100) / 2 + 0.02 : -999;

      // Calculate clear solid segments along cabinet width
      const cutouts: { min: number; max: number }[] = [];
      if (config.sink.enabled) cutouts.push({ min: sinkMinX, max: sinkMaxX });
      if (config.stove.enabled) cutouts.push({ min: stoveMinX, max: stoveMaxX });
      cutouts.sort((a, b) => a.min - b.min);

      let currentX = leftX + sidePanelThick;
      const endX = leftX + W - sidePanelThick;

      cutouts.forEach((cut) => {
        const segStart = currentX;
        const segEnd = Math.max(segStart, Math.min(cut.min, endX));
        const segLen = segEnd - segStart;
        if (segLen > 0.04) {
          const segCenterX = segStart + segLen / 2;
          const frontMesh = new THREE.Mesh(new THREE.BoxGeometry(segLen, panelThick, 0.08), cabinetInternalMat);
          frontMesh.position.set(segCenterX, H - topThick - panelThick / 2, frontFaceZ - 0.04);
          kitchenGroup.add(frontMesh);

          const backMesh = new THREE.Mesh(new THREE.BoxGeometry(segLen, panelThick, 0.08), cabinetInternalMat);
          backMesh.position.set(segCenterX, H - topThick - panelThick / 2, backZ + 0.04);
          kitchenGroup.add(backMesh);
        }
        currentX = Math.max(currentX, cut.max);
      });

      if (endX - currentX > 0.04) {
        const segLen = endX - currentX;
        const segCenterX = currentX + segLen / 2;
        const frontMesh = new THREE.Mesh(new THREE.BoxGeometry(segLen, panelThick, 0.08), cabinetInternalMat);
        frontMesh.position.set(segCenterX, H - topThick - panelThick / 2, frontFaceZ - 0.04);
        kitchenGroup.add(frontMesh);

        const backMesh = new THREE.Mesh(new THREE.BoxGeometry(segLen, panelThick, 0.08), cabinetInternalMat);
        backMesh.position.set(segCenterX, H - topThick - panelThick / 2, backZ + 0.04);
        kitchenGroup.add(backMesh);
      }

      // 7. COLUMNS, DIVIDERS, DRAWERS & DOORS
      const totalCustomColW = config.columns.reduce((sum, c) => sum + c.width, 0);
      const dividerThick = panelThick;
      const totalDividersW = Math.max(0, columnCount - 1) * dividerThick;
      const availableInteriorW = bottomW - totalDividersW;

      let currentColX = leftX + sidePanelThick;

      config.columns.forEach((col, colIdx) => {
        const colW = (col.width / (totalCustomColW || 1)) * availableInteriorW;
        const colCenterX = currentColX + colW / 2;

        if (colIdx < columnCount - 1) {
          const dividerX = currentColX + colW + dividerThick / 2;
          const divider = new THREE.Mesh(new THREE.BoxGeometry(dividerThick, carcaseH - panelThick, carcaseD - 0.01), cabinetInternalMat);
          divider.position.set(dividerX, plinthH + carcaseH / 2, backZ + carcaseD / 2);
          kitchenGroup.add(divider);
        }

        const innerW = Math.max(0.12, colW - 0.008);
        const innerD = carcaseD - 0.025;
        const frontZ = frontFaceZ;

        if (col.type === 'drawers') {
          const drawers = col.drawers && col.drawers.length > 0
            ? col.drawers
            : Array.from({ length: col.drawerCount || 3 }, (_, i) => ({
                id: `gen-d-${i}`,
                height: (config.totalHeight - config.countertopThickness - config.plinthHeight) / (col.drawerCount || 3),
                name: `Laci ${i + 1}`,
              }));

          const totalDrawerH = drawers.reduce((sum, d) => sum + d.height, 0);
          let currY = plinthH + 0.005;

          drawers.forEach((drawerItem) => {
            const drawerH = (drawerItem.height / totalDrawerH) * (carcaseH - 0.015);
            const drawerGroup = new THREE.Group();

            const faceMesh = new THREE.Mesh(new THREE.BoxGeometry(innerW, drawerH - 0.004, panelThick), cabinetFaceMat);
            faceMesh.position.set(0, 0, panelThick / 2);
            faceMesh.castShadow = true;
            drawerGroup.add(faceMesh);

            addHandleToElement(drawerGroup, innerW, drawerH, config.handleStyle, handleMat);

            const boxD = innerD - 0.02;
            const boxH = Math.max(0.06, drawerH * 0.7);
            const boxW = innerW - 0.04;
            const bottomBoxMesh = new THREE.Mesh(new THREE.BoxGeometry(boxW, 0.01, boxD), cabinetInternalMat);
            bottomBoxMesh.position.set(0, -drawerH / 2 + 0.015, -boxD / 2);
            drawerGroup.add(bottomBoxMesh);

            const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.012, boxH, boxD), cabinetInternalMat);
            leftWall.position.set(-boxW / 2 + 0.006, -drawerH / 2 + boxH / 2 + 0.01, -boxD / 2);
            const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.012, boxH, boxD), cabinetInternalMat);
            rightWall.position.set(boxW / 2 - 0.006, -drawerH / 2 + boxH / 2 + 0.01, -boxD / 2);
            drawerGroup.add(leftWall);
            drawerGroup.add(rightWall);

            const slideMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.9, roughness: 0.2 });
            const slideL = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.025, boxD), slideMat);
            slideL.position.set(-boxW / 2 - 0.006, -drawerH / 2 + 0.02, -boxD / 2);
            const slideR = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.025, boxD), slideMat);
            slideR.position.set(boxW / 2 + 0.006, -drawerH / 2 + 0.02, -boxD / 2);
            drawerGroup.add(slideL);
            drawerGroup.add(slideR);

            drawerGroup.position.set(colCenterX, currY + drawerH / 2, frontZ);
            kitchenGroup.add(drawerGroup);

            animatedPartsRef.current.drawers.push({
              mesh: drawerGroup,
              maxOffset: boxD * 0.75,
              baseZ: frontZ,
            });

            currY += drawerH + 0.004;
          });
        } else if (col.type === 'sink-cabinet') {
          const dummyH = 0.16;
          const dummyMesh = new THREE.Mesh(new THREE.BoxGeometry(innerW, dummyH, panelThick), cabinetFaceMat);
          dummyMesh.position.set(colCenterX, plinthH + carcaseH - dummyH / 2, frontZ + panelThick / 2);
          dummyMesh.castShadow = true;
          kitchenGroup.add(dummyMesh);

          const lowerDoorH = carcaseH - dummyH - 0.008;
          const doorHalfW = innerW / 2 - 0.002;

          const leftHinge = new THREE.Group();
          leftHinge.position.set(colCenterX - innerW / 2, plinthH + lowerDoorH / 2, frontZ);
          const leftDoorMesh = new THREE.Mesh(new THREE.BoxGeometry(doorHalfW, lowerDoorH, panelThick), cabinetFaceMat);
          leftDoorMesh.position.set(doorHalfW / 2, 0, panelThick / 2);
          leftDoorMesh.castShadow = true;
          leftHinge.add(leftDoorMesh);
          addDoorHandle(leftDoorMesh, doorHalfW, lowerDoorH, 'right', config.handleStyle, handleMat);
          kitchenGroup.add(leftHinge);

          const rightHinge = new THREE.Group();
          rightHinge.position.set(colCenterX + innerW / 2, plinthH + lowerDoorH / 2, frontZ);
          const rightDoorMesh = new THREE.Mesh(new THREE.BoxGeometry(doorHalfW, lowerDoorH, panelThick), cabinetFaceMat);
          rightDoorMesh.position.set(-doorHalfW / 2, 0, panelThick / 2);
          rightDoorMesh.castShadow = true;
          rightHinge.add(rightDoorMesh);
          addDoorHandle(rightDoorMesh, doorHalfW, lowerDoorH, 'left', config.handleStyle, handleMat);
          kitchenGroup.add(rightHinge);

          animatedPartsRef.current.doors.push(
            { mesh: leftHinge, maxAngle: Math.PI * 0.55, isLeftHinge: true },
            { mesh: rightHinge, maxAngle: Math.PI * 0.55, isLeftHinge: false }
          );

          const pipeMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.3, metalness: 0.2 });
          const verticalPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.25, 16), pipeMat);
          verticalPipe.position.set(0, 0.1, 0);
          const trapMesh = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.02, 12, 24, Math.PI), pipeMat);
          trapMesh.position.set(0.05, -0.02, 0);
          trapMesh.rotation.z = Math.PI;
          const pipeGroup = new THREE.Group();
          pipeGroup.add(verticalPipe);
          pipeGroup.add(trapMesh);
          const pipeX = config.sink.enabled ? (leftX + config.sink.posX / 100) : colCenterX;
          const pipeZ = config.sink.enabled ? (backZ + config.sink.posY / 100) : (backZ + carcaseD / 2);
          pipeGroup.position.set(pipeX, plinthH + carcaseH - 0.26, pipeZ);
          kitchenGroup.add(pipeGroup);
        } else if (col.type === 'gas-compartment') {
          const doorH = carcaseH - 0.01;
          const hingeGroup = new THREE.Group();
          hingeGroup.position.set(colCenterX - innerW / 2, plinthH + doorH / 2, frontZ);

          const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(innerW, doorH, panelThick), cabinetFaceMat);
          doorMesh.position.set(innerW / 2, 0, panelThick / 2);
          doorMesh.castShadow = true;
          hingeGroup.add(doorMesh);

          const ventMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
          for (let v = 0; v < 4; v++) {
            const ventMesh = new THREE.Mesh(new THREE.BoxGeometry(innerW * 0.6, 0.012, panelThick + 0.002), ventMat);
            ventMesh.position.set(innerW / 2, -doorH * 0.35 + v * 0.03, panelThick / 2);
            hingeGroup.add(ventMesh);
          }

          addDoorHandle(doorMesh, innerW, doorH, 'right', config.handleStyle, handleMat);
          kitchenGroup.add(hingeGroup);

          animatedPartsRef.current.doors.push({ mesh: hingeGroup, maxAngle: Math.PI * 0.55, isLeftHinge: true });

          const tankGroup = new THREE.Group();
          const tankMat = new THREE.MeshStandardMaterial({ color: 0x2e8b57, roughness: 0.35, metalness: 0.4 });
          const tankBody = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.28, 24), tankMat);
          tankGroup.add(tankBody);
          const tankDomeTop = new THREE.Mesh(new THREE.SphereGeometry(0.12, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), tankMat);
          tankDomeTop.position.y = 0.14;
          tankGroup.add(tankDomeTop);
          const tankRing = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.015, 12, 24), tankMat);
          tankRing.rotation.x = Math.PI / 2;
          tankRing.position.y = 0.24;
          tankGroup.add(tankRing);
          const valveMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.04, 12), new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.3 }));
          valveMesh.position.y = 0.22;
          tankGroup.add(valveMesh);
          tankGroup.position.set(colCenterX, plinthH + 0.2, backZ + carcaseD / 2);
          kitchenGroup.add(tankGroup);
        } else if (col.type === 'door-single-left' || col.type === 'door-single-right') {
          const isLeft = col.type === 'door-single-left';
          const doorH = carcaseH - 0.01;
          const hingeGroup = new THREE.Group();
          hingeGroup.position.set(isLeft ? colCenterX - innerW / 2 : colCenterX + innerW / 2, plinthH + doorH / 2, frontZ);

          const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(innerW, doorH, panelThick), cabinetFaceMat);
          doorMesh.position.set(isLeft ? innerW / 2 : -innerW / 2, 0, panelThick / 2);
          doorMesh.castShadow = true;
          hingeGroup.add(doorMesh);

          addDoorHandle(doorMesh, innerW, doorH, isLeft ? 'right' : 'left', config.handleStyle, handleMat);
          kitchenGroup.add(hingeGroup);

          animatedPartsRef.current.doors.push({ mesh: hingeGroup, maxAngle: Math.PI * 0.55, isLeftHinge: isLeft });

          const shelfMesh = new THREE.Mesh(new THREE.BoxGeometry(innerW, panelThick, innerD), cabinetInternalMat);
          shelfMesh.position.set(colCenterX, plinthH + carcaseH / 2, backZ + carcaseD / 2);
          kitchenGroup.add(shelfMesh);
        } else if (col.type === 'door-double') {
          const doorH = carcaseH - 0.01;
          const doorHalfW = innerW / 2 - 0.002;

          const leftHinge = new THREE.Group();
          leftHinge.position.set(colCenterX - innerW / 2, plinthH + doorH / 2, frontZ);
          const leftDoorMesh = new THREE.Mesh(new THREE.BoxGeometry(doorHalfW, doorH, panelThick), cabinetFaceMat);
          leftDoorMesh.position.set(doorHalfW / 2, 0, panelThick / 2);
          leftDoorMesh.castShadow = true;
          leftHinge.add(leftDoorMesh);
          addDoorHandle(leftDoorMesh, doorHalfW, doorH, 'right', config.handleStyle, handleMat);
          kitchenGroup.add(leftHinge);

          const rightHinge = new THREE.Group();
          rightHinge.position.set(colCenterX + innerW / 2, plinthH + doorH / 2, frontZ);
          const rightDoorMesh = new THREE.Mesh(new THREE.BoxGeometry(doorHalfW, doorH, panelThick), cabinetFaceMat);
          rightDoorMesh.position.set(-doorHalfW / 2, 0, panelThick / 2);
          rightDoorMesh.castShadow = true;
          rightHinge.add(rightDoorMesh);
          addDoorHandle(rightDoorMesh, doorHalfW, doorH, 'left', config.handleStyle, handleMat);
          kitchenGroup.add(rightHinge);

          animatedPartsRef.current.doors.push(
            { mesh: leftHinge, maxAngle: Math.PI * 0.55, isLeftHinge: true },
            { mesh: rightHinge, maxAngle: Math.PI * 0.55, isLeftHinge: false }
          );

          const shelfMesh = new THREE.Mesh(new THREE.BoxGeometry(innerW, panelThick, innerD), cabinetInternalMat);
          shelfMesh.position.set(colCenterX, plinthH + carcaseH / 2, backZ + carcaseD / 2);
          kitchenGroup.add(shelfMesh);
        } else if (col.type === 'pullout-spice') {
          const rackH = carcaseH - 0.01;
          const rackGroup = new THREE.Group();
          const frontFace = new THREE.Mesh(new THREE.BoxGeometry(innerW, rackH, panelThick), cabinetFaceMat);
          frontFace.position.set(0, 0, panelThick / 2);
          frontFace.castShadow = true;
          rackGroup.add(frontFace);
          addHandleToElement(rackGroup, innerW, rackH, config.handleStyle, handleMat);

          const wireMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 });
          for (let b = 0; b < 3; b++) {
            const basketY = -rackH / 2 + 0.1 + b * (rackH / 3.2);
            const wireBase = new THREE.Mesh(new THREE.BoxGeometry(innerW * 0.7, 0.008, innerD * 0.85), wireMat);
            wireBase.position.set(0, basketY, -innerD * 0.45);
            rackGroup.add(wireBase);

            for (let j = 0; j < 3; j++) {
              const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.08, 12), new THREE.MeshStandardMaterial({ color: [0x8b4513, 0xdaa520, 0xa0522d][j % 3], roughness: 0.4 }));
              jar.position.set(0, basketY + 0.045, -innerD * 0.25 - j * 0.07);
              rackGroup.add(jar);
            }
          }

          rackGroup.position.set(colCenterX, plinthH + rackH / 2, frontZ);
          kitchenGroup.add(rackGroup);
          animatedPartsRef.current.drawers.push({ mesh: rackGroup, maxOffset: innerD * 0.75, baseZ: frontZ });
        } else {
          const shelfCount = col.shelfCount || 2;
          for (let s = 1; s <= shelfCount; s++) {
            const shelfY = plinthH + (s / (shelfCount + 1)) * carcaseH;
            const shelfMesh = new THREE.Mesh(new THREE.BoxGeometry(innerW, panelThick, innerD), cabinetInternalMat);
            shelfMesh.position.set(colCenterX, shelfY, backZ + carcaseD / 2);
            kitchenGroup.add(shelfMesh);
          }
        }

        currentColX += colW + dividerThick;
      });
    }

    // 8. DEEP CONCAVE SINK MODEL (TRUE CONCAVE BASIN WITH REAL CUTOUT)
    if (config.sink.enabled) {
      const sink = config.sink;
      const sinkW = sink.width / 100;
      const sinkL = sink.length / 100;
      const sinkDepth = sink.bowlDepth / 100; // e.g. 0.20m = 20cm
      const sinkX = leftX + sink.posX / 100;
      const sinkZ = backZ + sink.posY / 100;
      const isUndermount = sink.mounting === 'undermount';
      const sinkTopY = isUndermount ? H - topThick : H;

      const sinkGroup = new THREE.Group();

      let sinkMetalMat: THREE.Material;
      if (sink.finish === 'black-nano') {
        sinkMetalMat = new THREE.MeshStandardMaterial({ color: 0x1f2124, roughness: 0.35, metalness: 0.6 });
      } else if (sink.finish === 'gold-brass') {
        sinkMetalMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.25, metalness: 0.85 });
      } else {
        sinkMetalMat = new THREE.MeshStandardMaterial({ color: 0xdadfe6, roughness: 0.22, metalness: 0.85 });
      }

      // If topmount: build hollow outer flange (NOT a solid plate)
      if (!isUndermount) {
        const rimOuterW = sinkW + 0.03;
        const rimOuterL = sinkL + 0.03;
        const rimThick = 0.02;

        const rimShape = new THREE.Shape();
        rimShape.moveTo(-rimOuterW / 2, -rimOuterL / 2);
        rimShape.lineTo(rimOuterW / 2, -rimOuterL / 2);
        rimShape.lineTo(rimOuterW / 2, rimOuterL / 2);
        rimShape.lineTo(-rimOuterW / 2, rimOuterL / 2);
        rimShape.closePath();

        const rimHole = new THREE.Path();
        const inW = sinkW - rimThick;
        const inL = sinkL - rimThick;
        rimHole.moveTo(-inW / 2, -inL / 2);
        rimHole.lineTo(inW / 2, -inL / 2);
        rimHole.lineTo(inW / 2, inL / 2);
        rimHole.lineTo(-inW / 2, inL / 2);
        rimHole.closePath();
        rimShape.holes.push(rimHole);

        const rimGeo = new THREE.ExtrudeGeometry(rimShape, { depth: 0.005, bevelEnabled: true, bevelThickness: 0.001, bevelSize: 0.001 });
        rimGeo.rotateX(Math.PI / 2);
        const rimMesh = new THREE.Mesh(rimGeo, sinkMetalMat);
        rimMesh.position.set(0, 0.004, 0);
        sinkGroup.add(rimMesh);
      }

      // Build Deep Concave Basin Bowls
      if (sink.model === 'single') {
        createRealisticConcaveBowl(sinkGroup, sinkW - 0.04, sinkL - 0.04, sinkDepth, 0, sinkMetalMat);
      } else if (sink.model === 'double') {
        const bowlW = (sinkW - 0.08) / 2;
        createRealisticConcaveBowl(sinkGroup, bowlW, sinkL - 0.04, sinkDepth, -bowlW / 2 - 0.015, sinkMetalMat);
        createRealisticConcaveBowl(sinkGroup, bowlW, sinkL - 0.04, sinkDepth, bowlW / 2 + 0.015, sinkMetalMat);
      } else {
        // Bowl and Drainer
        const bowlW = (sinkW - 0.06) * 0.58;
        const drainW = (sinkW - 0.06) * 0.40;
        createRealisticConcaveBowl(sinkGroup, bowlW, sinkL - 0.04, sinkDepth, -sinkW / 4, sinkMetalMat);

        // Slanted drainboard
        const drainGeo = new THREE.BoxGeometry(drainW, 0.006, sinkL - 0.04);
        const drainMesh = new THREE.Mesh(drainGeo, sinkMetalMat);
        drainMesh.position.set(sinkW / 4, -0.003, 0);
        drainMesh.rotation.z = -0.02; // slight slope towards bowl
        sinkGroup.add(drainMesh);

        // Water drain grooves
        for (let g = 0; g < 6; g++) {
          const groove = new THREE.Mesh(new THREE.BoxGeometry(drainW * 0.8, 0.002, 0.012), new THREE.MeshBasicMaterial({ color: 0x555555 }));
          groove.position.set(sinkW / 4, 0.002, -(sinkL * 0.3) + g * 0.05);
          sinkGroup.add(groove);
        }
      }

      // Workstation Bamboo Cutting Board & Wire Basket (Accessories)
      if (sink.showAccessories || sink.brandModel === 'kohler-prolific') {
        const boardW = Math.min(0.24, sinkW * 0.4);
        const boardL = sinkL - 0.04;
        const boardGeo = new THREE.BoxGeometry(boardW, 0.018, boardL);
        const boardMat = new THREE.MeshStandardMaterial({ map: createWoodTexture(false), roughness: 0.4 });
        const board = new THREE.Mesh(boardGeo, boardMat);
        board.position.set(sinkW * 0.2, 0.008, 0);
        sinkGroup.add(board);
      }

      // Faucet
      createFaucet(sinkGroup, sink.faucet, sink.finish, sinkL);

      sinkGroup.position.set(sinkX, sinkTopY, sinkZ);
      kitchenGroup.add(sinkGroup);
    }

    // 9. REALISTIC BUILT-IN STOVE / COOKTOP (DROP-IN INTO CUTOUT)
    if (config.stove.enabled) {
      const stove = config.stove;
      const stoveW = stove.width / 100;
      const stoveL = stove.length / 100;
      const recessD = stove.recessDepth / 100;
      const stoveX = leftX + stove.posX / 100;
      const stoveZ = backZ + stove.posY / 100;
      const stoveTopY = H;

      const stoveGroup = new THREE.Group();

      const isInduction = stove.type.startsWith('induction');

      // Beveled Schott Ceran Tempered Glass Cooktop
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: isInduction ? 0x0f1115 : 0x14161a,
        roughness: 0.08,
        metalness: 0.35,
        clearcoat: 1.0,
        clearcoatRoughness: 0.04,
      });

      const glassGeo = new THREE.BoxGeometry(stoveW, 0.008, stoveL);
      const glassMesh = new THREE.Mesh(glassGeo, glassMat);
      glassMesh.position.set(0, 0.004, 0);
      glassMesh.castShadow = true;
      stoveGroup.add(glassMesh);

      // Aluminum / Beveled Front Trim Edge
      const trimGeo = new THREE.BoxGeometry(stoveW, 0.004, 0.006);
      const trimMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.9, roughness: 0.2 });
      const frontTrim = new THREE.Mesh(trimGeo, trimMat);
      frontTrim.position.set(0, 0.004, stoveL / 2);
      stoveGroup.add(frontTrim);

      // Recessed Drop-in Chassis Box (inside the countertop cutout!)
      const boxCutout = new THREE.Mesh(
        new THREE.BoxGeometry(stoveW - 0.04, recessD, stoveL - 0.04),
        new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6, metalness: 0.6 })
      );
      boxCutout.position.set(0, -recessD / 2, 0);
      stoveGroup.add(boxCutout);

      // Burners / Cooking Zones
      const burnerMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.35, metalness: 0.8 });
      const brassMat = new THREE.MeshStandardMaterial({ color: 0xc8961e, roughness: 0.25, metalness: 0.9 });

      if (stove.type === 'gas-2') {
        const burnerDist = stoveW * 0.28;
        createLotusGasBurner(stoveGroup, -burnerDist, 0, 0.085, burnerMat, brassMat);
        createLotusGasBurner(stoveGroup, burnerDist, 0, 0.085, burnerMat, brassMat);
      } else if (stove.type === 'gas-3') {
        createLotusGasBurner(stoveGroup, -stoveW * 0.3, 0, 0.085, burnerMat, brassMat);
        createLotusGasBurner(stoveGroup, 0, 0.03, 0.055, burnerMat, brassMat);
        createLotusGasBurner(stoveGroup, stoveW * 0.3, 0, 0.085, burnerMat, brassMat);
      } else if (stove.type === 'induction-2') {
        createInductionZone(stoveGroup, -stoveW * 0.25, 0, 0.085);
        createInductionZone(stoveGroup, stoveW * 0.25, 0, 0.085);
      } else if (stove.type === 'induction-4') {
        const offsetW = stoveW * 0.25;
        const offsetL = stoveL * 0.22;
        createInductionZone(stoveGroup, -offsetW, -offsetL, 0.08);
        createInductionZone(stoveGroup, offsetW, -offsetL, 0.07);
        createInductionZone(stoveGroup, -offsetW, offsetL, 0.07);
        createInductionZone(stoveGroup, offsetW, offsetL, 0.09);
      } else {
        createLotusGasBurner(stoveGroup, 0, 0, 0.09, burnerMat, brassMat);
      }

      // Ergonomic Rotary Knobs with knurled grip & red indicator
      if (stove.hasKnobs) {
        const knobCount = stove.type === 'gas-3' ? 3 : stove.type === 'gas-1' ? 1 : 2;
        const knobSpacing = 0.08;
        const knobStartZ = stoveL / 2 - 0.045;
        const knobMat = new THREE.MeshStandardMaterial({ color: 0xb0b5bc, metalness: 0.9, roughness: 0.25 });

        for (let k = 0; k < knobCount; k++) {
          const kx = (k - (knobCount - 1) / 2) * knobSpacing;
          const knobMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.019, 0.014, 24), knobMat);
          knobMesh.position.set(kx, 0.015, knobStartZ);
          stoveGroup.add(knobMesh);

          // Red tick mark
          const markMesh = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.003, 0.009), new THREE.MeshBasicMaterial({ color: 0xff3b30 }));
          markMesh.position.set(kx, 0.022, knobStartZ - 0.007);
          stoveGroup.add(markMesh);
        }
      }

      stoveGroup.position.set(stoveX, stoveTopY, stoveZ);
      kitchenGroup.add(stoveGroup);
    }

    // 10. 3D SAFETY CLEARANCE INDICATOR
    if (config.showSafetyClearance && config.sink.enabled && config.stove.enabled) {
      const sinkRight = config.sink.posX + config.sink.width / 2;
      const stoveLeft = config.stove.posX - config.stove.width / 2;
      let gapCm = stoveLeft - sinkRight;

      const isDangerous = gapCm < 40;
      const ribbonColor = gapCm < 0 ? 0xff2222 : isDangerous ? 0xffaa00 : 0x00cc66;

      const midX = (leftX + config.sink.posX / 100 + leftX + config.stove.posX / 100) / 2;
      const gapM = Math.max(0.05, Math.abs(config.stove.posX - config.sink.posX) / 100);
      const safetyLine = new THREE.Mesh(new THREE.PlaneGeometry(gapM, 0.04), new THREE.MeshBasicMaterial({ color: ribbonColor, transparent: true, opacity: 0.6, side: THREE.DoubleSide }));
      safetyLine.rotation.x = -Math.PI / 2;
      safetyLine.position.set(midX, H + 0.003, 0);
      kitchenGroup.add(safetyLine);
    }

    // 11. 3D DIMENSIONS
    if (config.showDimensions3D) {
      add3DDimensions(kitchenGroup, W, D, H, leftX, backZ);
    }
  }, [config]);

  // Procedural Hollow Tube Chassis + SINK & STOVE SUPPORT CRADLES
  function buildHollowFrameStructure(
    parent: THREE.Group,
    W: number,
    D: number,
    H: number,
    topThick: number,
    plinthH: number,
    leftX: number,
    backZ: number,
    carcaseD: number,
    tube: number,
    mat: THREE.Material,
    columns: KitchenConfig['columns'],
    sink: KitchenConfig['sink'],
    stove: KitchenConfig['stove'],
    customSupports: KitchenConfig['frame']['supports']
  ) {
    const frameGroup = new THREE.Group();
    const frameH = H - topThick;
    const frameBottomY = plinthH;
    const postH = frameH - plinthH;
    const frontZ = backZ + carcaseD;

    const postGeo = new THREE.BoxGeometry(tube, postH, tube);
    const footGeo = new THREE.CylinderGeometry(tube * 0.7, tube * 0.8, plinthH * 0.8, 16);
    const footMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.9, roughness: 0.2 });

    const postLocations: { x: number; z: number }[] = [
      { x: leftX + tube / 2, z: frontZ - tube / 2 },
      { x: leftX + W - tube / 2, z: frontZ - tube / 2 },
      { x: leftX + tube / 2, z: backZ + tube / 2 },
      { x: leftX + W - tube / 2, z: backZ + tube / 2 },
    ];

    const totalCustomColW = columns.reduce((s, c) => s + c.width, 0);
    let accumX = leftX;
    columns.forEach((col, idx) => {
      if (idx < columns.length - 1) {
        accumX += (col.width / (totalCustomColW || 1)) * W;
        postLocations.push({ x: accumX, z: frontZ - tube / 2 });
        postLocations.push({ x: accumX, z: backZ + tube / 2 });
      }
    });

    postLocations.forEach((pos) => {
      const postMesh = new THREE.Mesh(postGeo, mat);
      postMesh.position.set(pos.x, frameBottomY + postH / 2, pos.z);
      postMesh.castShadow = true;
      frameGroup.add(postMesh);

      const foot = new THREE.Mesh(footGeo, footMat);
      foot.position.set(pos.x, plinthH * 0.4, pos.z);
      frameGroup.add(foot);
    });

    // Top Perimeter Rails
    const topY = frameH - tube / 2;
    const frontTopRail = new THREE.Mesh(new THREE.BoxGeometry(W, tube, tube), mat);
    frontTopRail.position.set(0, topY, frontZ - tube / 2);
    frameGroup.add(frontTopRail);
    const backTopRail = new THREE.Mesh(new THREE.BoxGeometry(W, tube, tube), mat);
    backTopRail.position.set(0, topY, backZ + tube / 2);
    frameGroup.add(backTopRail);

    const leftTopCross = new THREE.Mesh(new THREE.BoxGeometry(tube, tube, carcaseD - tube * 2), mat);
    leftTopCross.position.set(leftX + tube / 2, topY, backZ + carcaseD / 2);
    frameGroup.add(leftTopCross);
    const rightTopCross = leftTopCross.clone();
    rightTopCross.position.x = leftX + W - tube / 2;
    frameGroup.add(rightTopCross);

    // Bottom Perimeter Rails
    const bottomRailY = frameBottomY + tube / 2;
    const frontBottomRail = new THREE.Mesh(new THREE.BoxGeometry(W, tube, tube), mat);
    frontBottomRail.position.set(0, bottomRailY, frontZ - tube / 2);
    frameGroup.add(frontBottomRail);
    const backBottomRail = new THREE.Mesh(new THREE.BoxGeometry(W, tube, tube), mat);
    backBottomRail.position.set(0, bottomRailY, backZ + tube / 2);
    frameGroup.add(backBottomRail);

    const leftBottomCross = new THREE.Mesh(new THREE.BoxGeometry(tube, tube, carcaseD - tube * 2), mat);
    leftBottomCross.position.set(leftX + tube / 2, bottomRailY, backZ + carcaseD / 2);
    frameGroup.add(leftBottomCross);
    const rightBottomCross = leftBottomCross.clone();
    rightBottomCross.position.x = leftX + W - tube / 2;
    frameGroup.add(rightBottomCross);

    // Appliance Cutout Bounding Boxes in Frame Coordinates
    const sinkMinX = sink.enabled ? (leftX + sink.posX / 100) - (sink.width / 100) / 2 : -999;
    const sinkMaxX = sink.enabled ? (leftX + sink.posX / 100) + (sink.width / 100) / 2 : -999;
    const stoveMinX = stove.enabled ? (leftX + stove.posX / 100) - (stove.width / 100) / 2 : -999;
    const stoveMaxX = stove.enabled ? (leftX + stove.posX / 100) + (stove.width / 100) / 2 : -999;

    // Intermediate Cross Rails (NEVER cross through sink bowl or stove recess)
    let divX = leftX;
    columns.forEach((col, idx) => {
      if (idx < columns.length - 1) {
        divX += (col.width / (totalCustomColW || 1)) * W;
        const inSinkZone = sink.enabled && divX >= sinkMinX - 0.04 && divX <= sinkMaxX + 0.04;
        const inStoveZone = stove.enabled && divX >= stoveMinX - 0.04 && divX <= stoveMaxX + 0.04;

        if (!inSinkZone && !inStoveZone) {
          const topMidCross = new THREE.Mesh(new THREE.BoxGeometry(tube, tube, carcaseD - tube * 2), mat);
          topMidCross.position.set(divX, topY, backZ + carcaseD / 2);
          frameGroup.add(topMidCross);
        }

        const bottomMidCross = new THREE.Mesh(new THREE.BoxGeometry(tube, tube, carcaseD - tube * 2), mat);
        bottomMidCross.position.set(divX, bottomRailY, backZ + carcaseD / 2);
        frameGroup.add(bottomMidCross);
      }
    });

    // BESI PENYANGGA WASTAFEL (SINK CRADLE SUPPORT BARS - STRICTLY CLEAR OF BOWL)
    const sinkSupport = customSupports?.find((s) => s.type === 'sink-cradle');
    if ((sinkSupport?.enabled !== false) && sink.enabled) {
      const sx = leftX + sink.posX / 100;
      const sz = backZ + sink.posY / 100;
      const sw = sink.width / 100;
      const sl = sink.length / 100;
      const sDepth = sink.bowlDepth / 100;
      const isUndermount = sink.mounting === 'undermount';
      // Basin bottom in world Y
      const bowlFloorY = (isUndermount ? (H - topThick) : H) - sDepth;
      // Safety clearance: cradle sits strictly underneath basin floor without penetrating
      const cradleY = bowlFloorY - tube / 2 - 0.012;

      // Front-to-back crossbeams flanking the sink outside bowl walls
      const beamL = new THREE.Mesh(new THREE.BoxGeometry(tube, tube, carcaseD - 0.04), mat);
      beamL.position.set(sx - sw / 2 - tube / 2 - 0.012, cradleY, backZ + carcaseD / 2);
      frameGroup.add(beamL);

      const beamR = new THREE.Mesh(new THREE.BoxGeometry(tube, tube, carcaseD - 0.04), mat);
      beamR.position.set(sx + sw / 2 + tube / 2 + 0.012, cradleY, backZ + carcaseD / 2);
      frameGroup.add(beamR);

      // Two cradle straps supporting front & back of bowl, leaving center drain hole completely free
      const strapW = sw + tube * 2 + 0.024;
      const strapFrontZ = Math.min(frontZ - tube - 0.02, sz + sl * 0.28);
      const strapBackZ = Math.max(backZ + tube + 0.02, sz - sl * 0.28);

      const strapFront = new THREE.Mesh(new THREE.BoxGeometry(strapW, tube * 0.5, tube), mat);
      strapFront.position.set(sx, cradleY, strapFrontZ);
      frameGroup.add(strapFront);

      const strapBack = new THREE.Mesh(new THREE.BoxGeometry(strapW, tube * 0.5, tube), mat);
      strapBack.position.set(sx, cradleY, strapBackZ);
      frameGroup.add(strapBack);
    }

    // BESI PENYANGGA KOMPOR (STOVE SUPPORT CROSSBARS)
    const stoveSupport = customSupports?.find((s) => s.type === 'stove-cradle');
    if ((stoveSupport?.enabled !== false) && stove.enabled) {
      const stx = leftX + stove.posX / 100;
      const stz = backZ + stove.posY / 100;
      const stw = stove.width / 100;
      const stl = stove.length / 100;
      const rDepth = stove.recessDepth / 100;
      const stoveBottomY = H - rDepth;
      const stoveSupportY = stoveBottomY - tube / 2 - 0.012;

      // Heavy crossbars supporting the drop-in stove
      const stBeamL = new THREE.Mesh(new THREE.BoxGeometry(tube, tube, carcaseD - 0.04), mat);
      stBeamL.position.set(stx - stw / 2 - tube / 2 - 0.01, stoveSupportY, backZ + carcaseD / 2);
      frameGroup.add(stBeamL);

      const stBeamR = new THREE.Mesh(new THREE.BoxGeometry(tube, tube, carcaseD - 0.04), mat);
      stBeamR.position.set(stx + stw / 2 + tube / 2 + 0.01, stoveSupportY, backZ + carcaseD / 2);
      frameGroup.add(stBeamR);

      const stTie = new THREE.Mesh(new THREE.BoxGeometry(stw + tube * 2 + 0.02, tube * 0.5, tube), mat);
      stTie.position.set(stx, stoveSupportY, Math.max(backZ + tube + 0.02, stz - stl * 0.25));
      frameGroup.add(stTie);
    }

    // OTHER CUSTOM SUPPORT BARS ADDED BY USER
    customSupports?.forEach((supp) => {
      if (!supp.enabled || supp.type === 'sink-cradle' || supp.type === 'stove-cradle') return;
      const sTube = (supp.tubeSize || 40) / 1000;
      const sX = leftX + supp.posX / 100;
      const sY = supp.posY / 100;
      const sZ = backZ + (supp.posZ || 30) / 100;
      const sLen = (supp.length || 60) / 100;

      if (supp.type === 'crossbeam-x') {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(sLen, sTube, sTube), mat);
        bar.position.set(sX, sY, sZ);
        frameGroup.add(bar);
      } else if (supp.type === 'crossbeam-z') {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(sTube, sTube, sLen), mat);
        bar.position.set(sX, sY, sZ);
        frameGroup.add(bar);
      } else if (supp.type === 'vertical-post') {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(sTube, postH, sTube), mat);
        bar.position.set(sX, plinthH + postH / 2, sZ);
        frameGroup.add(bar);
      }
    });

    parent.add(frameGroup);
  }

  // REALISTIC CONCAVE BASIN GENERATOR (DEEP BOWL WITH TRUE HOLE IN COUNTERTOP)
  function createRealisticConcaveBowl(parent: THREE.Group, w: number, l: number, depth: number, posX: number, mat: THREE.Material) {
    const bowlGroup = new THREE.Group();
    const wallThick = 0.003;

    // Sloped Basin Floor descending to center drain
    const bottomFloor = new THREE.Mesh(new THREE.BoxGeometry(w - 0.02, 0.004, l - 0.02), mat);
    bottomFloor.position.set(0, -depth, 0);
    bowlGroup.add(bottomFloor);

    // 4 Deep Sloping Basin Walls (Concave cavity going down from 0 to -depth)
    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(w, depth, wallThick), mat);
    frontWall.position.set(0, -depth / 2, l / 2);
    frontWall.rotation.x = -0.04;
    bowlGroup.add(frontWall);

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(w, depth, wallThick), mat);
    backWall.position.set(0, -depth / 2, -l / 2);
    backWall.rotation.x = 0.04;
    bowlGroup.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, depth, l), mat);
    leftWall.position.set(-w / 2, -depth / 2, 0);
    leftWall.rotation.z = 0.04;
    bowlGroup.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, depth, l), mat);
    rightWall.position.set(w / 2, -depth / 2, 0);
    rightWall.rotation.z = -0.04;
    bowlGroup.add(rightWall);

    // Stainless Steel 3.5" Basket Strainer (Afur Saringan) with Perforations
    const strainerMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.95, roughness: 0.15 });
    const strainerOuter = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.038, 0.008, 24), strainerMat);
    strainerOuter.position.set(0, -depth + 0.004, 0);
    bowlGroup.add(strainerOuter);

    const strainerPlug = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.02, 16), strainerMat);
    strainerPlug.position.set(0, -depth + 0.014, 0);
    bowlGroup.add(strainerPlug);

    // Slotted Overflow Relief Hole on Back Wall
    const overflowMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.012, 0.002),
      new THREE.MeshBasicMaterial({ color: 0x111111 })
    );
    overflowMesh.position.set(0, -depth * 0.25, -l / 2 + 0.002);
    bowlGroup.add(overflowMesh);

    // Subtle Water Reflection at Bottom
    const waterMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w * 0.75, l * 0.75),
      new THREE.MeshPhysicalMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.25, roughness: 0.05, clearcoat: 1.0 })
    );
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.set(0, -depth + 0.01, 0);
    bowlGroup.add(waterMesh);

    bowlGroup.position.set(posX, 0, 0);
    parent.add(bowlGroup);
  }

  // REALISTIC LOTUS GAS BURNER (HEAVY CAST-IRON TRIVET + BRASS FLAME CAP)
  function createLotusGasBurner(parent: THREE.Group, x: number, z: number, radius: number, ironMat: THREE.Material, brassMat: THREE.Material) {
    const burnerGroup = new THREE.Group();

    // Burner Well
    const well = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.95, 0.006, 24), ironMat);
    well.position.y = 0.007;
    burnerGroup.add(well);

    // Solid Lotus Brass Flame Distributor (Kuningan Rinnai / Modena)
    const brassCap = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.45, radius * 0.45, 0.012, 24), brassMat);
    brassCap.position.y = 0.012;
    burnerGroup.add(brassCap);

    // Center Flame Spreader Ring
    const brassCenter = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.2, radius * 0.2, 0.016, 16), brassMat);
    brassCenter.position.y = 0.014;
    burnerGroup.add(brassCenter);

    // Heavy Serrated Cast Iron Trivet (Wok Support Stand 4 Arms)
    for (let arm = 0; arm < 4; arm++) {
      const armMesh = new THREE.Mesh(new THREE.BoxGeometry(radius * 1.85, 0.018, 0.014), ironMat);
      armMesh.rotation.y = (arm * Math.PI) / 2;
      armMesh.position.y = 0.016;
      burnerGroup.add(armMesh);

      // Serrated pot teeth
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.006, 0.012), ironMat);
      tooth.position.set(radius * 0.7, 0.026, 0);
      tooth.rotation.y = (arm * Math.PI) / 2;
      burnerGroup.add(tooth);
    }

    burnerGroup.position.set(x, 0, z);
    parent.add(burnerGroup);
  }

  function createInductionZone(parent: THREE.Group, x: number, z: number, radius: number) {
    const zoneGroup = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.RingGeometry(radius - 0.004, radius, 32), new THREE.MeshBasicMaterial({ color: 0x999999, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.0085;
    zoneGroup.add(ring);

    const cross1 = new THREE.Mesh(new THREE.PlaneGeometry(radius * 0.5, 0.003), new THREE.MeshBasicMaterial({ color: 0x999999, side: THREE.DoubleSide }));
    cross1.rotation.x = -Math.PI / 2;
    cross1.position.y = 0.0086;
    const cross2 = cross1.clone();
    cross2.rotation.z = Math.PI / 2;
    zoneGroup.add(cross1);
    zoneGroup.add(cross2);

    zoneGroup.position.set(x, 0, z);
    parent.add(zoneGroup);
  }

  function createFaucet(parent: THREE.Group, type: string, finish: string, sinkL: number) {
    const faucetGroup = new THREE.Group();
    const tapColor = finish === 'black-nano' ? 0x1f2124 : finish === 'gold-brass' ? 0xd4af37 : 0xd8dde4;
    const faucetMat = new THREE.MeshStandardMaterial({ color: tapColor, roughness: 0.2, metalness: 0.85 });

    const baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.04, 24), faucetMat);
    baseMesh.position.set(0, 0.02, 0);
    faucetGroup.add(baseMesh);

    const lever = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.08, 12), faucetMat);
    lever.rotation.z = Math.PI / 4;
    lever.position.set(0.04, 0.05, 0);
    faucetGroup.add(lever);

    if (type === 'gooseneck') {
      const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0.04, 0), new THREE.Vector3(0, 0.42, 0), new THREE.Vector3(0, 0.28, 0.16));
      const tubeMesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.012, 16, false), faucetMat);
      faucetGroup.add(tubeMesh);
      const nozMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.012, 0.03, 16), faucetMat);
      nozMesh.position.set(0, 0.26, 0.16);
      faucetGroup.add(nozMesh);
    } else if (type === 'modern-flex') {
      const colMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.2, 16), faucetMat);
      colMesh.position.set(0, 0.14, 0);
      faucetGroup.add(colMesh);
      const springCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.24, 0), new THREE.Vector3(0, 0.45, 0.04), new THREE.Vector3(0, 0.32, 0.18)]);
      const springMesh = new THREE.Mesh(new THREE.TubeGeometry(springCurve, 24, 0.014, 12, false), faucetMat);
      faucetGroup.add(springMesh);
      const sprayMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.015, 0.07, 16), faucetMat);
      sprayMesh.position.set(0, 0.26, 0.18);
      faucetGroup.add(sprayMesh);
    } else {
      const vMesh = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.32, 0.024), faucetMat);
      vMesh.position.set(0, 0.18, 0);
      const hMesh = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.024, 0.18), faucetMat);
      hMesh.position.set(0, 0.33, 0.08);
      faucetGroup.add(vMesh);
      faucetGroup.add(hMesh);
    }

    faucetGroup.position.set(0, 0, -sinkL / 2 - 0.03);
    parent.add(faucetGroup);
  }

  function addHandleToElement(parent: THREE.Group, w: number, h: number, style: string, mat: THREE.Material) {
    if (style === 'profile-j') {
      const grooveMesh = new THREE.Mesh(new THREE.BoxGeometry(w * 0.85, 0.015, 0.012), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 }));
      grooveMesh.position.set(0, h / 2 - 0.01, 0.018);
      parent.add(grooveMesh);
    } else if (style === 'knob-minimal') {
      const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 16), mat);
      knob.rotation.x = Math.PI / 2;
      knob.position.set(0, h * 0.2, 0.025);
      parent.add(knob);
    } else if (style === 'edge-pull') {
      const edge = new THREE.Mesh(new THREE.BoxGeometry(w * 0.4, 0.005, 0.02), mat);
      edge.position.set(0, h / 2 - 0.004, 0.022);
      parent.add(edge);
    } else {
      const barLen = Math.min(0.24, w * 0.6);
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, barLen, 12), mat);
      bar.rotation.z = Math.PI / 2;
      bar.position.set(0, h * 0.2, 0.03);
      const stem1 = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.02, 12), mat);
      stem1.rotation.x = Math.PI / 2;
      stem1.position.set(-barLen * 0.4, h * 0.2, 0.02);
      const stem2 = stem1.clone();
      stem2.position.set(barLen * 0.4, h * 0.2, 0.02);
      parent.add(bar);
      parent.add(stem1);
      parent.add(stem2);
    }
  }

  function addDoorHandle(doorMesh: THREE.Mesh, doorW: number, doorH: number, side: 'left' | 'right', style: string, mat: THREE.Material) {
    const handleX = side === 'left' ? -doorW * 0.38 : doorW * 0.38;
    if (style === 'profile-j') {
      const grooveMesh = new THREE.Mesh(new THREE.BoxGeometry(0.012, doorH * 0.6, 0.012), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 }));
      grooveMesh.position.set(handleX, 0, 0.018);
      doorMesh.add(grooveMesh);
    } else if (style === 'knob-minimal') {
      const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.02, 16), mat);
      knob.rotation.x = Math.PI / 2;
      knob.position.set(handleX, 0, 0.025);
      doorMesh.add(knob);
    } else {
      const barLen = Math.min(0.28, doorH * 0.35);
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, barLen, 12), mat);
      bar.position.set(handleX, 0, 0.03);
      const stem1 = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.02, 12), mat);
      stem1.rotation.x = Math.PI / 2;
      stem1.position.set(handleX, barLen * 0.4, 0.02);
      const stem2 = stem1.clone();
      stem2.position.set(handleX, -barLen * 0.4, 0.02);
      doorMesh.add(bar);
      doorMesh.add(stem1);
      doorMesh.add(stem2);
    }
  }

  function add3DDimensions(parent: THREE.Group, w: number, d: number, h: number, leftX: number, backZ: number) {
    const dimMat = new THREE.LineBasicMaterial({ color: 0x2563eb, linewidth: 2 });
    const markerMat = new THREE.MeshBasicMaterial({ color: 0x2563eb });

    const frontZ = backZ + d + 0.12;
    const widthPts = [new THREE.Vector3(leftX, 0.02, frontZ), new THREE.Vector3(leftX + w, 0.02, frontZ)];
    const widthLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(widthPts), dimMat);
    parent.add(widthLine);

    const t1 = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.015, 0.04), markerMat);
    t1.position.set(leftX, 0.02, frontZ);
    const t2 = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.015, 0.04), markerMat);
    t2.position.set(leftX + w, 0.02, frontZ);
    parent.add(t1);
    parent.add(t2);

    const rightX = leftX + w + 0.1;
    const heightPts = [new THREE.Vector3(rightX, 0, 0), new THREE.Vector3(rightX, h, 0)];
    const heightLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(heightPts), dimMat);
    parent.add(heightLine);

    const ht1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.015, 0.015), markerMat);
    ht1.position.set(rightX, 0, 0);
    const ht2 = ht1.clone();
    ht2.position.set(rightX, h, 0);
    parent.add(ht1);
    parent.add(ht2);
  }

  function disposeHierarchy(node: THREE.Object3D) {
    if ((node as THREE.Mesh).geometry) {
      (node as THREE.Mesh).geometry.dispose();
    }
    if ((node as THREE.Mesh).material) {
      const mat = (node as THREE.Mesh).material;
      if (Array.isArray(mat)) {
        mat.forEach((m) => m.dispose());
      } else {
        mat.dispose();
      }
    }
    node.children.forEach(disposeHierarchy);
  }

  const setCameraPreset = (preset: 'front' | 'iso' | 'top' | 'side' | 'inspect') => {
    const W = config.totalWidth / 100;
    const H = config.totalHeight / 100;
    const anim = cameraAnimRef.current;
    anim.active = true;

    if (preset === 'front') {
      anim.targetPos.set(0, H * 0.7, Math.max(1.8, W * 1.05));
      anim.targetLook.set(0, H * 0.5, 0);
    } else if (preset === 'top') {
      anim.targetPos.set(0, Math.max(2.2, W * 1.1), 0.001);
      anim.targetLook.set(0, H, 0);
    } else if (preset === 'side') {
      anim.targetPos.set(W * 0.8 + 1.2, H * 0.7, 0);
      anim.targetLook.set(0, H * 0.5, 0);
    } else if (preset === 'inspect') {
      anim.targetPos.set(0.6, H + 0.5, 0.9);
      anim.targetLook.set(0, H, 0);
    } else {
      anim.targetPos.set(Math.max(1.5, W * 0.65), H * 1.5, Math.max(2.2, W * 0.85));
      anim.targetLook.set(0, H * 0.45, 0);
    }
  };

  return (
    <div className="relative w-full h-full select-none bg-neutral-900 overflow-hidden">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Camera angle buttons */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5 p-1.5 bg-neutral-900/85 backdrop-blur-md rounded-xl border border-neutral-700/60 shadow-lg text-xs text-neutral-300">
        <span className="px-2 py-1 font-semibold text-neutral-400">Sudut:</span>
        <button
          onClick={() => setCameraPreset('iso')}
          className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 hover:text-white transition-colors"
        >
          Isometrik 3D
        </button>
        <button
          onClick={() => setCameraPreset('front')}
          className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 hover:text-white transition-colors"
        >
          Depan
        </button>
        <button
          onClick={() => setCameraPreset('top')}
          className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 hover:text-white transition-colors"
          title="Tampak Atas: lihat lubang cekung wastafel & kompor tanam"
        >
          Atas (Cekung Bak)
        </button>
        <button
          onClick={() => setCameraPreset('side')}
          className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 hover:text-white transition-colors"
          title="Lihat tampak samping (papan tertutup rapat)"
        >
          Samping
        </button>
        <button
          onClick={() => setCameraPreset('inspect')}
          className="px-2.5 py-1 rounded-lg bg-amber-900/40 text-amber-300 hover:bg-amber-800/60 transition-colors"
        >
          Detail Alat
        </button>
      </div>

      {/* Frame Only Active Badge */}
      {config.showFrameOnly && (
        <div className="absolute top-14 left-3 z-10 flex items-center gap-2 px-3 py-1.5 bg-blue-950/90 border border-blue-500 rounded-xl text-xs font-semibold text-blue-300 shadow-xl backdrop-blur-md">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span>Mode Rangka & Besi Penyangga Saja</span>
        </div>
      )}

      {/* Safety Clearance Status Badge */}
      {config.sink.enabled && config.stove.enabled && (
        <div className="absolute top-3 right-3 z-10 p-2.5 bg-neutral-900/90 backdrop-blur-md rounded-xl border border-neutral-700/60 shadow-lg max-w-xs text-xs">
          {(() => {
            const sinkLeft = config.sink.posX - config.sink.width / 2;
            const sinkRight = config.sink.posX + config.sink.width / 2;
            const stoveLeft = config.stove.posX - config.stove.width / 2;
            const stoveRight = config.stove.posX + config.stove.width / 2;

            let gap = 0;
            if (sinkRight < stoveLeft) gap = stoveLeft - sinkRight;
            else if (stoveRight < sinkLeft) gap = sinkLeft - stoveRight;
            else gap = -1;

            if (gap < 0) {
              return (
                <div className="flex items-center gap-2 text-rose-400 font-medium">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                  <span>PERINGATAN: Wastafel dan kompor bertabrakan (overlapping)!</span>
                </div>
              );
            } else if (gap < 40) {
              return (
                <div className="flex items-center gap-2 text-amber-300 font-medium">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <div>
                    <span>Jarak kompor & wastafel: {Math.round(gap)} cm.</span>
                    <span className="block text-[10px] text-amber-400/80 font-normal">
                      Disarankan min. 40-50 cm agar cipratan air aman dari api.
                    </span>
                  </div>
                </div>
              );
            } else {
              return (
                <div className="flex items-center gap-2 text-emerald-400 font-medium">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Jarak aman ergonomis: {Math.round(gap)} cm.</span>
                </div>
              );
            }
          })()}
        </div>
      )}

      {/* Realtime Size Badge */}
      <div className="absolute bottom-3 left-3 z-10 pointer-events-none px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-xs font-mono text-neutral-300 border border-white/10">
        Dimensi Meja: {config.totalWidth} × {config.totalDepth} × {config.totalHeight} cm | Lubang Cekung: {config.sink.bowlDepth}cm
      </div>
    </div>
  );
};
