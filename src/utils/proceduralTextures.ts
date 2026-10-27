import * as THREE from 'three';

// Cache generated textures to avoid recreating canvas unnecessarily
const textureCache = new Map<string, THREE.CanvasTexture>();

export function createWoodTexture(isDark: boolean = false): THREE.CanvasTexture {
  const cacheKey = `wood-${isDark ? 'dark' : 'light'}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const baseHue = isDark ? 28 : 34;
  const baseSat = isDark ? 35 : 45;
  const baseLight = isDark ? 22 : 68;

  // Background
  ctx.fillStyle = `hsl(${baseHue}, ${baseSat}%, ${baseLight}%)`;
  ctx.fillRect(0, 0, 512, 512);

  // Grain lines
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * 512;
    const width = 1 + Math.random() * 3;
    const lDiff = (Math.random() - 0.5) * (isDark ? 14 : 18);
    ctx.fillStyle = `hsla(${baseHue}, ${baseSat}%, ${baseLight + lDiff}%, 0.4)`;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    const wobble1 = x + (Math.random() - 0.5) * 20;
    const wobble2 = x + (Math.random() - 0.5) * 35;
    const wobble3 = x + (Math.random() - 0.5) * 20;
    ctx.bezierCurveTo(wobble1, 150, wobble2, 350, wobble3, 512);
    ctx.lineWidth = width;
    ctx.stroke();
  }

  // Subtle wood pores
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    if (Math.random() < 0.15) {
      const noise = (Math.random() - 0.5) * 20;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

export function createMarbleTexture(isBlack: boolean = true): THREE.CanvasTexture {
  const cacheKey = `marble-${isBlack ? 'black' : 'white'}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  if (isBlack) {
    ctx.fillStyle = '#18191c';
    ctx.fillRect(0, 0, 1024, 1024);

    // Subtle cloudiness
    for (let i = 0; i < 40; i++) {
      const cx = Math.random() * 1024;
      const cy = Math.random() * 1024;
      const r = 100 + Math.random() * 300;
      const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, r);
      grad.addColorStop(0, 'rgba(45, 48, 55, 0.35)');
      grad.addColorStop(1, 'rgba(24, 25, 28, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // High contrast white/grey lightning veins
    for (let v = 0; v < 8; v++) {
      let x = Math.random() * 1024;
      let y = 0;
      ctx.beginPath();
      ctx.moveTo(x, y);
      while (y < 1024) {
        y += 10 + Math.random() * 25;
        x += (Math.random() - 0.48) * 35;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(240, 245, 255, 0.65)';
      ctx.lineWidth = 1.8 + Math.random() * 3;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
      ctx.shadowBlur = 4;
      ctx.stroke();

      // Branch veins
      if (Math.random() > 0.4) {
        let bx = x;
        let by = y - 300;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        for (let b = 0; b < 10; b++) {
          by += 15 + Math.random() * 20;
          bx += (Math.random() - 0.3) * 30;
          ctx.lineTo(bx, by);
        }
        ctx.strokeStyle = 'rgba(200, 210, 225, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  } else {
    // White Carrara marble
    ctx.fillStyle = '#f6f7f9';
    ctx.fillRect(0, 0, 1024, 1024);

    // Soft grey cloudiness
    for (let i = 0; i < 50; i++) {
      const cx = Math.random() * 1024;
      const cy = Math.random() * 1024;
      const r = 120 + Math.random() * 250;
      const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, r);
      grad.addColorStop(0, 'rgba(215, 220, 228, 0.4)');
      grad.addColorStop(1, 'rgba(246, 247, 249, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Soft grey veins
    for (let v = 0; v < 10; v++) {
      let x = Math.random() * 1024;
      let y = 0;
      ctx.beginPath();
      ctx.moveTo(x, y);
      while (y < 1024) {
        y += 15 + Math.random() * 30;
        x += (Math.random() - 0.52) * 40;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(160, 168, 178, 0.45)';
      ctx.lineWidth = 1.5 + Math.random() * 3.5;
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

export function createGraniteTexture(): THREE.CanvasTexture {
  const cacheKey = 'granite-grey';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#5c6166';
  ctx.fillRect(0, 0, 512, 512);

  // Speckles
  const speckles = 12000;
  for (let i = 0; i < speckles; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const size = 1 + Math.random() * 2.5;
    const rand = Math.random();
    if (rand < 0.35) {
      ctx.fillStyle = 'rgba(25, 27, 30, 0.7)'; // dark speck
    } else if (rand < 0.7) {
      ctx.fillStyle = 'rgba(230, 235, 240, 0.6)'; // light speck
    } else {
      ctx.fillStyle = 'rgba(140, 145, 150, 0.5)'; // mid speck
    }
    ctx.fillRect(x, y, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

export function createTileBacksplashTexture(): THREE.CanvasTexture {
  const cacheKey = 'tile-backsplash';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#3a3e45'; // Grout color
  ctx.fillRect(0, 0, 512, 256);

  const tileW = 124;
  const tileH = 60;
  const gap = 4;

  for (let row = 0; row < 5; row++) {
    const offsetX = (row % 2 === 0) ? 0 : -(tileW / 2);
    for (let col = -1; col < 6; col++) {
      const x = offsetX + col * (tileW + gap);
      const y = row * (tileH + gap);

      // Tile face
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(x + 1, y + 1, tileW - 2, tileH - 2);

      // Subtle bevel highlight & shadow
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 2, y + tileH - 2);
      ctx.lineTo(x + 2, y + 2);
      ctx.lineTo(x + tileW - 2, y + 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.beginPath();
      ctx.moveTo(x + tileW - 2, y + 2);
      ctx.lineTo(x + tileW - 2, y + tileH - 2);
      ctx.lineTo(x + 2, y + tileH - 2);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

export function createFloorTileTexture(): THREE.CanvasTexture {
  const cacheKey = 'floor-tile';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Light modern terrazzo or ceramic floor
  ctx.fillStyle = '#e2e6ea';
  ctx.fillRect(0, 0, 512, 512);

  // Grid grout
  ctx.strokeStyle = '#c4c9d0';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, 512, 512);

  // Subtle noise
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.4)' : 'rgba(160,170,180,0.3)';
    ctx.fillRect(x, y, 2, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const cacheKey = 'contact-shadow';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(128, 128, 20, 128, 128, 120);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.25)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set(cacheKey, texture);
  return texture;
}
