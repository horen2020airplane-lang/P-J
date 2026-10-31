/**
 * Procedural Texture Generator for Poria Jam FPS
 * Generates all textures in code via HTML5 2D Canvas & THREE.CanvasTexture.
 * Zero external file dependencies (Zero 404s).
 */

import * as THREE from 'three';

// Cache generated textures so we don't recreate identical ones
const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Procedural Street-Spray Graffiti Texture Generator:
 * Features prominent "پوریا جم" (Poria Jam) & "poria_jam", realistic dripping paint runs,
 * stencil bridges, street spray flecks, and weathered edges.
 */
export function createPoriaJamGraffitiTexture(colorScheme: 'neonCyan' | 'fireOrange' | 'bloodRed' = 'neonCyan'): THREE.CanvasTexture {
  const cacheKey = `graffiti_${colorScheme}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Transparent background
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const mainColor = colorScheme === 'neonCyan' ? '#00f0ff' : colorScheme === 'fireOrange' ? '#ff7700' : '#ff2244';
  const glowColor = colorScheme === 'neonCyan' ? 'rgba(0, 240, 255, 0.4)' : colorScheme === 'fireOrange' ? 'rgba(255, 120, 0, 0.4)' : 'rgba(255, 34, 68, 0.4)';
  const darkDrip = colorScheme === 'neonCyan' ? '#007799' : colorScheme === 'fireOrange' ? '#993300' : '#880011';

  // 1. Street Art Overspray Mist / Aura
  ctx.save();
  ctx.filter = 'blur(12px)';
  ctx.fillStyle = glowColor;
  ctx.font = '900 130px "Vazirmatn", "Tahoma", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('پوریا جم', 512, 190);
  ctx.restore();

  // 2. Drop Shadow / Depth Backing (Stencil depth effect)
  ctx.save();
  ctx.fillStyle = 'rgba(10, 10, 15, 0.85)';
  ctx.font = '900 128px "Vazirmatn", "Tahoma", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('پوریا جم', 516, 196);
  ctx.restore();

  // 3. Main Persian Stencil Lettering: "پوریا جم"
  ctx.save();
  ctx.fillStyle = mainColor;
  ctx.font = '900 128px "Vazirmatn", "Tahoma", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('پوریا جم', 512, 190);

  // Inner highlight for 3D spray pop
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 124px "Vazirmatn", "Tahoma", sans-serif';
  ctx.globalAlpha = 0.55;
  ctx.fillText('پوریا جم', 510, 187);
  ctx.globalAlpha = 1.0;
  ctx.restore();

  // 4. Secondary English Stencil: "PORIA_JAM // TACTICAL OPS"
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(240, 275, 544, 46);

  ctx.fillStyle = mainColor;
  ctx.font = '700 32px "Chakra Petch", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★  PORIA_JAM // TACTICAL  ★', 512, 298);

  // Stencil border lines with hazard cuts
  ctx.strokeStyle = mainColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(238, 273, 548, 50);

  // Stencil connector bridges (creates authentic cut-out stencil appearance)
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.clearRect(320, 270, 8, 56);
  ctx.clearRect(450, 270, 8, 56);
  ctx.clearRect(580, 270, 8, 56);
  ctx.clearRect(700, 270, 8, 56);
  ctx.restore();

  // 5. Realistic Street Paint Drips!
  // Drips trailing down from the Persian typography and stencil box
  const dripPositions = [
    { x: 300, len: 140, w: 7 },
    { x: 340, len: 90,  w: 5 },
    { x: 395, len: 180, w: 9 },
    { x: 440, len: 110, w: 6 },
    { x: 485, len: 210, w: 10 },
    { x: 535, len: 160, w: 8 },
    { x: 590, len: 230, w: 11 },
    { x: 640, len: 120, w: 6 },
    { x: 685, len: 190, w: 9 },
    { x: 730, len: 80,  w: 5 },
    { x: 770, len: 150, w: 8 },
  ];

  dripPositions.forEach(drip => {
    const startY = 320;
    const endY = startY + drip.len;

    // Drip streak
    const grad = ctx.createLinearGradient(drip.x, startY, drip.x, endY);
    grad.addColorStop(0, mainColor);
    grad.addColorStop(0.7, darkDrip);
    grad.addColorStop(1, mainColor);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(drip.x - drip.w / 2, startY);
    // slightly wavy drip line
    ctx.quadraticCurveTo(drip.x + (Math.sin(drip.x) * 4), startY + drip.len * 0.5, drip.x - drip.w * 0.3, endY);
    // rounded droplet at bottom
    ctx.arc(drip.x, endY, drip.w * 0.9, 0, Math.PI);
    ctx.quadraticCurveTo(drip.x + (Math.sin(drip.x) * 4), startY + drip.len * 0.5, drip.x + drip.w / 2, startY);
    ctx.closePath();
    ctx.fill();

    // Tiny highlight reflection on bottom droplet
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(drip.x - drip.w * 0.25, endY - drip.w * 0.2, drip.w * 0.35, 0, Math.PI * 2);
    ctx.fill();
  });

  // 6. Street Spray Splatter Dots & Flecks (aerosol can overspray)
  ctx.fillStyle = mainColor;
  for (let i = 0; i < 450; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 260 + 50;
    const cx = 512 + Math.cos(angle) * radius * 1.5;
    const cy = 240 + Math.sin(angle) * radius * 0.8;
    const r = Math.random() < 0.85 ? Math.random() * 2.5 + 0.5 : Math.random() * 5.5 + 2.0;
    ctx.globalAlpha = Math.random() * 0.7 + 0.2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;

  // 7. Weathered Edges / Grunge Scratches
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 35; i++) {
    const sx = 200 + Math.random() * 624;
    const sy = 120 + Math.random() * 240;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (Math.random() - 0.5) * 60, sy + (Math.random() - 0.5) * 20);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Sandstone Wall Texture for de_dust2:
 * Beige mortar blocks with weathered limestone grain.
 */
export function createSandstoneTexture(): THREE.CanvasTexture {
  const cacheKey = 'sandstone';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base sandstone beige
  ctx.fillStyle = '#c8b18a';
  ctx.fillRect(0, 0, 512, 512);

  // Brick grid layout
  const rows = 8;
  const rowH = 512 / rows;
  for (let r = 0; r < rows; r++) {
    const cols = 4;
    const colW = 512 / cols;
    const offset = (r % 2) * (colW / 2);
    for (let c = -1; c <= cols; c++) {
      const x = c * colW + offset;
      const y = r * rowH;

      // Slight color variance per brick
      const shade = 180 + Math.floor(Math.random() * 30);
      ctx.fillStyle = `rgb(${shade + 20}, ${shade}, ${shade - 30})`;
      ctx.fillRect(x + 3, y + 3, colW - 6, rowH - 6);

      // Brick mortar border
      ctx.strokeStyle = '#857257';
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 2, y + 2, colW - 4, rowH - 4);
    }
  }

  // Weathering noise & plaster cracks
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 35;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise * 0.9));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.7));
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Corrugated Industrial Metal Sheet Texture:
 * Alternating ribs, rivets, and dark steel patina.
 */
export function createCorrugatedMetalTexture(): THREE.CanvasTexture {
  const cacheKey = 'corrugated_metal';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Dark industrial metal base
  ctx.fillStyle = '#2d333b';
  ctx.fillRect(0, 0, 512, 512);

  // Corrugated vertical wave bands
  const bandW = 32;
  for (let x = 0; x < 512; x += bandW) {
    const grad = ctx.createLinearGradient(x, 0, x + bandW, 0);
    grad.addColorStop(0, '#1c2128');
    grad.addColorStop(0.45, '#545d68');
    grad.addColorStop(0.55, '#6a7482');
    grad.addColorStop(1, '#1c2128');

    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, bandW, 512);

    // Rivet dots on seams
    ctx.fillStyle = '#9aa5b5';
    for (let y = 30; y < 512; y += 80) {
      ctx.beginPath();
      ctx.arc(x + 2, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Rust patches
  for (let p = 0; p < 8; p++) {
    const rx = Math.random() * 450;
    const ry = Math.random() * 450;
    const rrad = 30 + Math.random() * 40;
    const rgrad = ctx.createRadialGradient(rx, ry, 5, rx, ry, rrad);
    rgrad.addColorStop(0, 'rgba(145, 65, 25, 0.6)');
    rgrad.addColorStop(0.7, 'rgba(110, 45, 15, 0.3)');
    rgrad.addColorStop(1, 'rgba(110, 45, 15, 0)');
    ctx.fillStyle = rgrad;
    ctx.beginPath();
    ctx.arc(rx, ry, rrad, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Wooden Tactical Crate Texture:
 * Planks with metal corners, screws, and military stencils.
 */
export function createWoodCrateTexture(): THREE.CanvasTexture {
  const cacheKey = 'wood_crate';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base wood
  ctx.fillStyle = '#8a623a';
  ctx.fillRect(0, 0, 512, 512);

  // Planks
  const plankH = 512 / 6;
  for (let i = 0; i < 6; i++) {
    const y = i * plankH;
    ctx.fillStyle = i % 2 === 0 ? '#966d43' : '#805932';
    ctx.fillRect(0, y, 512, plankH);

    ctx.strokeStyle = '#473019';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, y, 512, plankH);
  }

  // Metal corner brackets
  ctx.fillStyle = '#3a3e45';
  ctx.fillRect(0, 0, 80, 80);
  ctx.fillRect(432, 0, 80, 80);
  ctx.fillRect(0, 432, 80, 80);
  ctx.fillRect(432, 432, 80, 80);

  // Diagonal support cross
  ctx.strokeStyle = '#6e4c27';
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(30, 30);
  ctx.lineTo(482, 482);
  ctx.moveTo(482, 30);
  ctx.lineTo(30, 482);
  ctx.stroke();

  // Military Crate Stencil
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.font = '900 36px "Chakra Petch", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('7.62 x 39MM', 256, 230);
  ctx.font = '700 24px "Chakra Petch", monospace';
  ctx.fillText('TACTICAL LOGISTICS', 256, 280);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Desert Sand Dunes Texture:
 * Warm arid sand with fine ripples.
 */
export function createDesertSandTexture(): THREE.CanvasTexture {
  const cacheKey = 'desert_sand';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#dfbe88';
  ctx.fillRect(0, 0, 512, 512);

  // Sand ripples
  ctx.strokeStyle = '#c6a26a';
  ctx.lineWidth = 2;
  for (let y = 0; y < 512; y += 12) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= 512; x += 32) {
      const cy = y + Math.sin(x * 0.05 + y * 0.02) * 5;
      ctx.lineTo(x, cy);
    }
    ctx.stroke();
  }

  // Subtle grain
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 20;
    d[i] = Math.min(255, Math.max(0, d[i] + n));
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n * 0.85));
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n * 0.6));
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Bullet Hole Decal Texture:
 * Pierced metal/concrete hole with shattered rim and spark burns.
 */
export function createBulletHoleTexture(): THREE.CanvasTexture {
  const cacheKey = 'bullet_hole';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Black crater center
  ctx.fillStyle = '#050508';
  ctx.beginPath();
  ctx.arc(64, 64, 18, 0, Math.PI * 2);
  ctx.fill();

  // Fractured outer rim
  ctx.strokeStyle = '#404550';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Radial crack lines
  ctx.strokeStyle = '#22252a';
  ctx.lineWidth = 2;
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
    ctx.beginPath();
    ctx.moveTo(64 + Math.cos(a) * 18, 64 + Math.sin(a) * 18);
    ctx.lineTo(64 + Math.cos(a) * (36 + Math.random() * 15), 64 + Math.sin(a) * (36 + Math.random() * 15));
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Blood Splatter Texture:
 * Dynamic crimson blood splatter for combat impacts.
 */
export function createBloodSplatterTexture(): THREE.CanvasTexture {
  const cacheKey = 'blood_splatter';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#8b0000';
  ctx.beginPath();
  ctx.arc(64, 64, 20, 0, Math.PI * 2);
  ctx.fill();

  // Radiating droplets
  for (let i = 0; i < 18; i++) {
    const ang = Math.random() * Math.PI * 2;
    const dist = 18 + Math.random() * 38;
    const r = Math.random() * 5 + 2;
    ctx.fillStyle = i % 2 === 0 ? '#b22222' : '#660000';
    ctx.beginPath();
    ctx.arc(64 + Math.cos(ang) * dist, 64 + Math.sin(ang) * dist, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}
