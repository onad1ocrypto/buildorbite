import * as THREE from 'three';
import {
  BuildingType,
  FenceSegment,
  ResourceType,
  UpgradePathId,
  ZombieArchetype,
} from './types';

// Shared procedural bump texture for organic relief
export function createProceduralBumpTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 2400; i++) {
    const x = (i * 73) % 256;
    const y = (i * 41) % 256;
    const r = 1 + (i % 4);
    const v = 90 + ((i * 29) % 75);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(18, 18);
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

// Realistic multi-layered grass & clover meadow texture (warm sunlit olive-lime meadow tones)
export function createGrassTerrainTexture(
  maxAnisotropy: number,
  isOuterForest = false
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Base warm olive-meadow turf undertone (distinct from cool dark evergreen tree leaves)
  ctx.fillStyle = isOuterForest ? '#384d1b' : '#4d6b22';
  ctx.fillRect(0, 0, 256, 256);

  // Dappled warm moss, golden turf & loamy soil patches
  for (let i = 0; i < 180; i++) {
    const x = (i * 97) % 256;
    const y = (i * 61) % 256;
    const r = 8 + (i % 18);
    ctx.fillStyle =
      i % 3 === 0
        ? isOuterForest
          ? 'rgba(48, 68, 22, 0.45)'
          : 'rgba(96, 132, 42, 0.42)'
        : i % 3 === 1
        ? 'rgba(68, 94, 28, 0.38)'
        : 'rgba(84, 68, 38, 0.25)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Thousands of fine individual warm meadow grass blades
  const bladeColors = isOuterForest
    ? ['#314516', '#3f591d', '#4d6b24', '#5a7a2b', '#384f1a']
    : ['#46631f', '#587a28', '#6a9131', '#7ca63a', '#8eb844', '#527024'];

  ctx.lineWidth = 1.2;
  for (let i = 0; i < 4200; i++) {
    const bx = (i * 53 + (i % 7) * 19) % 256;
    const by = (i * 89 + (i % 11) * 13) % 256;
    const tilt = ((i % 9) - 4) * 0.45;
    const len = 3 + (i % 5);
    ctx.strokeStyle = bladeColors[i % bladeColors.length];
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + tilt, by - len);
    ctx.stroke();
  }

  // Subtle wildflower & golden clover speckles on the inner meadow
  if (!isOuterForest) {
    for (let i = 0; i < 110; i++) {
      const fx = (i * 113 + 17) % 256;
      const fy = (i * 79 + 31) % 256;
      ctx.fillStyle = i % 4 === 0 ? '#fde047' : i % 3 === 0 ? '#d9f99d' : '#a3e635';
      ctx.beginPath();
      ctx.arc(fx, fy, 1.15, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(isOuterForest ? 28 : 14, isOuterForest ? 28 : 14);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

// Realistic dirt, pebble & wagon-rut road texture with feathered grassy edges
export function createDirtRoadTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 256, 256);

  // Draw road body with soft alpha falloff at left/right edges so it blends into grass
  for (let x = 14; x < 242; x++) {
    let alpha = 1.0;
    if (x < 42) alpha = (x - 14) / 28;
    else if (x > 214) alpha = (242 - x) / 28;

    // Slight wagon wheel rut darkening around x=78 and x=178
    const rutDist = Math.min(Math.abs(x - 78), Math.abs(x - 178));
    const rutShade = rutDist < 18 ? -12 : 0;
    const r = 104 + rutShade;
    const g = 81 + rutShade;
    const b = 58 + rutShade;
    ctx.fillStyle = `rgba(${r},${g},${b},${(alpha * 0.96).toFixed(2)})`;
    ctx.fillRect(x, 0, 1, 256);
  }

  // Organic soil grain, pebbles & small stones along the trail
  for (let i = 0; i < 1800; i++) {
    const px = 26 + ((i * 67 + (i % 13) * 7) % 204);
    const py = (i * 43 + (i % 17) * 11) % 256;
    const rad = 0.8 + (i % 3) * 0.7;
    const tone = i % 5;
    ctx.fillStyle =
      tone === 0
        ? 'rgba(72, 54, 38, 0.65)'
        : tone === 1
        ? 'rgba(132, 112, 92, 0.55)'
        : tone === 2
        ? 'rgba(148, 138, 126, 0.6)'
        : tone === 3
        ? 'rgba(88, 68, 48, 0.55)'
        : 'rgba(58, 44, 30, 0.5)';
    ctx.beginPath();
    ctx.arc(px, py, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Larger embedded trail flagstones / cobbles
  for (let i = 0; i < 52; i++) {
    const sx = 46 + ((i * 83) % 164);
    const sy = (i * 59) % 256;
    const rx = 3 + (i % 5);
    const ry = 2 + (i % 4);
    ctx.fillStyle = i % 2 === 0 ? 'rgba(125, 118, 108, 0.55)' : 'rgba(102, 92, 82, 0.55)';
    ctx.beginPath();
    ctx.ellipse(sx, sy, rx, ry, (i % 3) * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 14);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

// Realistic tree bark texture
export function createBarkTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#4a301d';
  ctx.fillRect(0, 0, 128, 128);

  for (let x = 0; x < 128; x += 3) {
    ctx.fillStyle = x % 6 === 0 ? '#362112' : '#5c3c24';
    ctx.fillRect(x, 0, 2, 128);
  }
  for (let i = 0; i < 260; i++) {
    const x = (i * 37) % 128;
    const y = (i * 53) % 128;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(30, 18, 9, 0.55)' : 'rgba(105, 72, 45, 0.4)';
    ctx.fillRect(x, y, 2, 10 + (i % 12));
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

// Realistic deep evergreen-teal spruce & pine needle canopy texture (contrasts with warm grass)
export function createPineFoliageTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0f3d32';
  ctx.fillRect(0, 0, 128, 128);

  for (let i = 0; i < 1600; i++) {
    const x = (i * 47) % 128;
    const y = (i * 31) % 128;
    ctx.strokeStyle =
      i % 4 === 0
        ? '#092922'
        : i % 4 === 1
        ? '#165243'
        : i % 4 === 2
        ? '#206b58'
        : '#113f34';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + ((i % 5) - 2) * 2.2, y + 4.5);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

// Shimmering forest-canal / moat water texture with flowing current streaks
export function createWaterCanalTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, '#0c3b4c');
  grad.addColorStop(0.25, '#135e75');
  grad.addColorStop(0.5, '#197994');
  grad.addColorStop(0.75, '#135e75');
  grad.addColorStop(1, '#0c3b4c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 128);

  // Flowing wave ripples & bright specular current lines
  for (let i = 0; i < 160; i++) {
    const x = (i * 43) % 256;
    const y = 12 + ((i * 29) % 104);
    const len = 14 + (i % 24);
    ctx.strokeStyle =
      i % 4 === 0
        ? 'rgba(186, 230, 253, 0.55)'
        : i % 2 === 0
        ? 'rgba(103, 232, 249, 0.38)'
        : 'rgba(8, 47, 73, 0.45)';
    ctx.lineWidth = i % 4 === 0 ? 1.8 : 1.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + len * 0.5, y + ((i % 3) - 1) * 3, x + len, y);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(22, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

// Tilled dark loam soil furrow texture for the Cornfield (Ladang Jagung)
export function createSoilFurrowTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#3e2716';
  ctx.fillRect(0, 0, 256, 256);

  const rowCount = 8;
  const rowH = 256 / rowCount;
  for (let r = 0; r < rowCount; r++) {
    const y0 = r * rowH;
    const g = ctx.createLinearGradient(0, y0, 0, y0 + rowH);
    g.addColorStop(0, '#27170b');
    g.addColorStop(0.35, '#593922');
    g.addColorStop(0.55, '#6a462b');
    g.addColorStop(0.85, '#472d19');
    g.addColorStop(1, '#24150a');
    ctx.fillStyle = g;
    ctx.fillRect(0, y0, 256, rowH);
  }

  for (let i = 0; i < 1400; i++) {
    const px = (i * 59) % 256;
    const py = (i * 37) % 256;
    ctx.fillStyle = i % 3 === 0 ? 'rgba(28, 16, 8, 0.55)' : 'rgba(118, 82, 52, 0.42)';
    ctx.fillRect(px, py, 2, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createStoneMasonryTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#334155';
  ctx.fillRect(0, 0, 128, 128);

  const rowH = 16;
  for (let y = 0; y < 128; y += rowH) {
    const offset = ((y / rowH) % 2) * 14;
    for (let x = -16; x < 128; x += 28) {
      const shade = 95 + ((x * 13 + y * 7) % 45);
      ctx.fillStyle = `rgb(${shade},${shade + 4},${shade + 10})`;
      ctx.fillRect(x + offset + 2, y + 2, 24, rowH - 3);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createLogCabinWallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#3b2313';
  ctx.fillRect(0, 0, 128, 128);

  const logH = 16;
  for (let y = 0; y < 128; y += logH) {
    const grad = ctx.createLinearGradient(0, y, 0, y + logH);
    grad.addColorStop(0, '#432816');
    grad.addColorStop(0.25, '#7c4d2b');
    grad.addColorStop(0.55, '#8c5832');
    grad.addColorStop(0.85, '#5e391f');
    grad.addColorStop(1, '#2b180c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, y + 1, 128, logH - 2);

    // Subtle mortar chinking line between logs
    ctx.fillStyle = '#cbbba0';
    ctx.fillRect(0, y, 128, 1.2);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createRoofShingleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 128, 128);

  const rowH = 14;
  for (let y = 0; y < 128; y += rowH) {
    const offset = ((y / rowH) % 2) * 10;
    for (let x = -12; x < 128; x += 20) {
      const v = 38 + ((x * 17 + y * 11) % 26);
      ctx.fillStyle = `rgb(${v},${v + 8},${v + 18})`;
      ctx.fillRect(x + offset + 1, y + 1, 18, rowH - 2);
    }
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(0, y + rowH - 2, 128, 2);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createStripedPajamaTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  // Vertical cream-and-slate-blue stripes matching Old Grumble's canonical pajama reference art
  for (let x = 0; x < 64; x += 8) {
    ctx.fillStyle = (x / 8) % 2 === 0 ? '#d8d2c5' : '#3b596b';
    ctx.fillRect(x, 0, 8, 64);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

const shadowGeo = new THREE.CircleGeometry(1, 20);
shadowGeo.rotateX(-Math.PI / 2);
const shadowMat = new THREE.MeshBasicMaterial({
  color: 0x030609,
  transparent: true,
  opacity: 0.44,
  depthWrite: false,
});

export function createContactShadow(radius: number): THREE.Mesh {
  const m = new THREE.Mesh(shadowGeo, shadowMat);
  m.scale.set(radius, 1, radius);
  m.position.y = 0.018;
  return m;
}

export interface RueRig {
  group: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  headGroup: THREE.Group;
  lanternMesh: THREE.Mesh;
  lanternFlameMesh: THREE.Mesh;
  lanternHaloMesh: THREE.Mesh;
}

export function createRangerRueModel(): RueRig {
  const group = new THREE.Group();
  group.add(createContactShadow(0.95));

  // Hat Palette: Sharp Vivid Crimson Red + Jet Black Accents ("ubah warna topi merah tajam")
  const hatRedMat = new THREE.MeshStandardMaterial({
    color: 0xc80018,
    emissive: 0x6e000e,
    emissiveIntensity: 0.22,
    roughness: 0.48,
    metalness: 0.05,
  });
  const hatBlackMat = new THREE.MeshStandardMaterial({
    color: 0x111318,
    roughness: 0.65,
    metalness: 0.18,
  });

  // Outfit Palette: Blue, Orange & Yellow ("pakaian warna kombinasi = biru, oren dan kuning")
  const outfitBlueMat = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8,
    emissive: 0x1e3a8a,
    emissiveIntensity: 0.1,
    roughness: 0.58,
    metalness: 0.08,
  });
  const outfitOrangeMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    emissive: 0xc2410c,
    emissiveIntensity: 0.1,
    roughness: 0.54,
    metalness: 0.08,
  });
  const outfitYellowMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xca8a04,
    emissiveIntensity: 0.12,
    roughness: 0.48,
    metalness: 0.12,
  });

  const bootBrownMat = new THREE.MeshStandardMaterial({
    color: 0x3b2313,
    roughness: 0.72,
    metalness: 0.1,
  });
  const darkBandMat = new THREE.MeshStandardMaterial({
    color: 0x1e1b18,
    roughness: 0.8,
  });
  const gingerHairMat = new THREE.MeshStandardMaterial({
    color: 0xc2410c,
    roughness: 0.6,
    metalness: 0.05,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xf6c6a4,
    roughness: 0.55,
    metalness: 0.04,
  });
  const silverBadgeMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.22,
    metalness: 0.88,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.28,
    metalness: 0.82,
  });
  const lanternGlowMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    emissive: 0xff8c1a,
    emissiveIntensity: 0.0,
    roughness: 0.22,
    transparent: true,
    opacity: 0.65,
  });

  // 1. Detailed Laced Ranger Boots (Sole + Heel + Rounded Toe Cap + Cuff) & Articulated Legs
  [-0.21, 0.21].forEach((lx) => {
    const bootSole = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.44), hatBlackMat);
    bootSole.position.set(lx, 0.03, 0.04);
    const bootShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.14, 0.22, 12), bootBrownMat);
    bootShaft.position.set(lx, 0.15, 0.01);
    bootShaft.castShadow = true;
    const bootToe = new THREE.Mesh(new THREE.SphereGeometry(0.135, 12, 10), bootBrownMat);
    bootToe.scale.set(1.0, 0.75, 1.35);
    bootToe.position.set(lx, 0.1, 0.11);
    bootToe.castShadow = true;
    const bootCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.14, 0.05, 12), outfitYellowMat);
    bootCuff.position.set(lx, 0.25, 0.01);

    const legTrouser = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.13, 0.24, 12), outfitBlueMat);
    legTrouser.position.set(lx, 0.36, 0);
    const kneePad = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), outfitOrangeMat);
    kneePad.scale.set(1.1, 0.9, 0.6);
    kneePad.position.set(lx, 0.34, 0.11);

    group.add(bootSole, bootShaft, bootToe, bootCuff, legTrouser, kneePad);
  });

  // 2. Sculpted Ranger Coat Skirt, Tunic Torso, Shoulder Pauldrons & Flowing Scarf
  const coatHem = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.54, 0.36, 16), outfitBlueMat);
  coatHem.position.y = 0.54;
  coatHem.castShadow = true;

  const coatYellowTrim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.53, 0.56, 0.07, 16),
    outfitYellowMat
  );
  coatYellowTrim.position.y = 0.37;

  // Sculpted upper torso (wider chest, tapered waist)
  const vestTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.41, 0.54, 16), outfitOrangeMat);
  vestTorso.scale.set(1.08, 1.0, 0.88);
  vestTorso.position.y = 0.84;
  vestTorso.castShadow = true;

  // Blue inner lapel V-panel on chest
  const chestLapel = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.38, 0.05), outfitBlueMat);
  chestLapel.position.set(0, 0.88, 0.36);

  // Distinct Shoulder Pauldrons / Capelet
  const shoulderCape = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46, 0.56, 0.18, 16),
    outfitOrangeMat
  );
  shoulderCape.scale.set(1.1, 1.0, 0.92);
  shoulderCape.position.y = 1.04;
  shoulderCape.castShadow = true;

  [-0.48, 0.48].forEach((sx) => {
    const pauldron = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), outfitBlueMat);
    pauldron.scale.set(1.1, 0.72, 1.0);
    pauldron.position.set(sx, 1.03, 0);
    pauldron.castShadow = true;
    const pauldronTrim = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 8, 14), outfitYellowMat);
    pauldronTrim.rotation.x = Math.PI / 2;
    pauldronTrim.rotation.y = sx < 0 ? 0.3 : -0.3;
    pauldronTrim.position.set(sx, 1.01, 0);
    group.add(pauldron, pauldronTrim);
  });

  // Yellow Collar Scarf + Twin Fluttering Scarf Tails at the Back
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.085, 10, 18), outfitYellowMat);
  collar.rotation.x = Math.PI / 2;
  collar.scale.set(1.05, 0.95, 1.0);
  collar.position.y = 1.13;

  const scarfTailL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.36, 0.04), outfitYellowMat);
  scarfTailL.position.set(-0.14, 0.96, -0.42);
  scarfTailL.rotation.set(0.28, 0, 0.15);
  const scarfTailR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.32, 0.04), outfitOrangeMat);
  scarfTailR.position.set(0.12, 0.98, -0.43);
  scarfTailR.rotation.set(0.32, 0, -0.18);
  group.add(coatHem, coatYellowTrim, vestTorso, chestLapel, shoulderCape, collar, scarfTailL, scarfTailR);

  // 3. Cross-Body Baldric Strap, Utility Belt, Pouches & Pocket Compass
  const baldricStrap = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.58, 0.82), outfitYellowMat);
  baldricStrap.position.set(0, 0.84, 0);
  baldricStrap.rotation.z = 0.52;
  group.add(baldricStrap);

  for (let s = 0; s < 2; s++) {
    const sy = 0.74 + s * 0.16;
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.04, 0.06), outfitYellowMat);
    strap.position.set(0, sy, 0.38);
    const tinyBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.055, 0.07), silverBadgeMat);
    tinyBuckle.position.set(0, sy, 0.39);
    group.add(strap, tinyBuckle);
  }

  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.47, 0.12, 16), hatBlackMat);
  belt.scale.set(1.06, 1.0, 0.9);
  belt.position.y = 0.56;
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.15, 0.08), brassMat);
  buckle.position.set(0, 0.56, 0.42);
  const buckleInner = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.09), hatBlackMat);
  buckleInner.position.set(0, 0.56, 0.42);

  const pouchL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.14), outfitOrangeMat);
  pouchL.position.set(-0.36, 0.55, 0.3);
  const pouchR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.14), outfitOrangeMat);
  pouchR.position.set(0.36, 0.55, 0.3);

  // Hanging Round Pocket Compass
  const compassCase = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.045, 12), brassMat);
  compassCase.rotation.x = Math.PI / 2;
  compassCase.position.set(0.19, 0.42, 0.44);
  const compassDial = new THREE.Mesh(
    new THREE.CircleGeometry(0.078, 12),
    new THREE.MeshBasicMaterial({ color: 0xf8fafc })
  );
  compassDial.position.set(0.19, 0.42, 0.465);
  group.add(belt, buckle, buckleInner, pouchL, pouchR, compassCase, compassDial);

  // 4. Detailed Expedition Backpack + Top Rolled Sleeping Mat
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.54, 0.32), outfitBlueMat);
  pack.position.set(0, 0.78, -0.38);
  pack.castShadow = true;
  const packFlap = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.16, 0.34), outfitOrangeMat);
  packFlap.position.set(0, 0.98, -0.38);
  const bedroll = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.62, 12), hatRedMat);
  bedroll.rotation.z = Math.PI / 2;
  bedroll.position.set(0, 1.14, -0.38);
  bedroll.castShadow = true;
  const bedrollStrapL = new THREE.Mesh(new THREE.CylinderGeometry(0.148, 0.148, 0.06, 12), outfitYellowMat);
  bedrollStrapL.rotation.z = Math.PI / 2;
  bedrollStrapL.position.set(-0.18, 1.14, -0.38);
  const bedrollStrapR = new THREE.Mesh(new THREE.CylinderGeometry(0.148, 0.148, 0.06, 12), outfitYellowMat);
  bedrollStrapR.rotation.z = Math.PI / 2;
  bedrollStrapR.position.set(0.18, 1.14, -0.38);
  group.add(pack, packFlap, bedroll, bedrollStrapL, bedrollStrapR);

  // 5. Sculpted Head, Facial Features, Ginger Hair & Sharp Vivid Crimson-Scarlet Ranger Hat
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.35, 0);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 18, 16), skinMat);
  head.scale.set(1.0, 1.02, 0.96);
  head.castShadow = true;
  headGroup.add(head);

  // Sculpted Ears & Nose
  [-0.37, 0.37].forEach((ex) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), skinMat);
    ear.scale.set(0.55, 1.1, 0.8);
    ear.position.set(ex, 0.0, 0.02);
    headGroup.add(ear);
  });
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.12, 8), skinMat);
  nose.rotation.x = Math.PI / 2 - 0.15;
  nose.position.set(0, -0.02, 0.39);
  headGroup.add(nose);

  // Expressive Eyes with White Catchlight Sparkles + Cheerful Smile
  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const irisBrownMat = new THREE.MeshBasicMaterial({ color: 0x1e120d });
  const eyeGeo = new THREE.SphereGeometry(0.105, 12, 10);
  const pupilGeo = new THREE.SphereGeometry(0.062, 10, 10);
  const catchlightGeo = new THREE.SphereGeometry(0.022, 6, 6);

  const leftEye = new THREE.Mesh(eyeGeo, eyeWhiteMat);
  leftEye.position.set(-0.14, 0.04, 0.31);
  const rightEye = new THREE.Mesh(eyeGeo, eyeWhiteMat);
  rightEye.position.set(0.14, 0.04, 0.31);

  const leftPupil = new THREE.Mesh(pupilGeo, irisBrownMat);
  leftPupil.position.set(-0.14, 0.04, 0.375);
  const rightPupil = new THREE.Mesh(pupilGeo, irisBrownMat);
  rightPupil.position.set(0.14, 0.04, 0.375);

  const leftSparkle = new THREE.Mesh(catchlightGeo, eyeWhiteMat);
  leftSparkle.position.set(-0.115, 0.068, 0.425);
  const rightSparkle = new THREE.Mesh(catchlightGeo, eyeWhiteMat);
  rightSparkle.position.set(0.165, 0.068, 0.425);

  const smileMouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.04, 0.04),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  smileMouth.position.set(0, -0.14, 0.35);

  // Eyebrows
  const browGeo = new THREE.BoxGeometry(0.15, 0.045, 0.05);
  const leftBrow = new THREE.Mesh(browGeo, gingerHairMat);
  leftBrow.position.set(-0.15, 0.17, 0.34);
  leftBrow.rotation.z = 0.1;
  const rightBrow = new THREE.Mesh(browGeo, gingerHairMat);
  rightBrow.position.set(0.15, 0.17, 0.34);
  rightBrow.rotation.z = -0.1;

  // Ginger-Red Hair Locks framing temples, cheeks, and back
  const hairSpikeGeo = new THREE.ConeGeometry(0.14, 0.32, 7);
  const hairOffsets: [number, number, number, number, number][] = [
    [-0.34, 0.06, 0.12, 0.2, 0.62],
    [-0.36, -0.07, 0.02, 0.1, 0.82],
    [0.34, 0.06, 0.12, 0.2, -0.62],
    [0.36, -0.07, 0.02, 0.1, -0.82],
    [-0.1, 0.2, 0.31, 0.55, 0.22],
    [0.08, 0.2, 0.31, 0.55, -0.18],
    [0, 0.04, -0.35, -0.45, 0],
    [-0.2, 0.02, -0.32, -0.4, 0.3],
    [0.2, 0.02, -0.32, -0.4, -0.3],
  ];
  hairOffsets.forEach(([hx, hy, hz, rx, rz]) => {
    const spike = new THREE.Mesh(hairSpikeGeo, gingerHairMat);
    spike.position.set(hx, hy, hz);
    spike.rotation.set(rx, 0, rz);
    headGroup.add(spike);
  });

  // VIVID SHARP RED RANGER HAT ("ubah warna topi merah tajam"):
  // Wide Vivid Scarlet Brim + Sleek Black Outer Trim Ring + Black Hatband + Tall Vivid Red Montana-Peak Crown
  const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.80, 0.065, 24), hatRedMat);
  hatBrim.position.y = 0.25;
  hatBrim.castShadow = true;

  const hatBrimOuterTrim = new THREE.Mesh(
    new THREE.TorusGeometry(0.79, 0.032, 10, 28),
    hatBlackMat
  );
  hatBrimOuterTrim.rotation.x = Math.PI / 2;
  hatBrimOuterTrim.position.y = 0.25;

  const hatBand = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.48, 0.1, 18), hatBlackMat);
  hatBand.position.y = 0.32;

  const hatBandGoldStripe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.47, 0.475, 0.03, 18),
    outfitYellowMat
  );
  hatBandGoldStripe.position.y = 0.29;

  // Tall, Bold Vivid Red Ranger Crown
  const hatCrownBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.46, 0.36, 16),
    hatRedMat
  );
  hatCrownBase.position.y = 0.52;
  hatCrownBase.castShadow = true;

  const hatCrownDome = new THREE.Mesh(
    new THREE.ConeGeometry(0.33, 0.26, 8),
    hatRedMat
  );
  hatCrownDome.position.y = 0.78;
  hatCrownDome.castShadow = true;

  // Front Ranger Shield Badge in Gold & Silver
  const hatBadgeGold = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.19, 0.05), outfitYellowMat);
  hatBadgeGold.position.set(0, 0.45, 0.42);
  hatBadgeGold.rotation.x = -0.25;
  const hatBadgeCore = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.14, 0.06), silverBadgeMat);
  hatBadgeCore.position.set(0, 0.45, 0.425);
  hatBadgeCore.rotation.x = -0.25;

  headGroup.add(
    leftEye,
    rightEye,
    leftPupil,
    rightPupil,
    leftSparkle,
    rightSparkle,
    smileMouth,
    leftBrow,
    rightBrow,
    hatBrim,
    hatBrimOuterTrim,
    hatBand,
    hatBandGoldStripe,
    hatCrownBase,
    hatCrownDome,
    hatBadgeGold,
    hatBadgeCore
  );
  group.add(headGroup);

  // 6. Left Arm (+X side, Blue Sleeve + Yellow Cuff + Gloved Hand) + Iron-Bound Ranger War-Mallet
  const leftArm = new THREE.Group();
  leftArm.position.set(0.55, 0.96, 0);
  const leftSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.42, 12), outfitBlueMat);
  leftSleeve.position.set(0, -0.15, 0.1);
  leftSleeve.rotation.x = -Math.PI / 5;
  const leftCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.125, 0.09, 12), outfitYellowMat);
  leftCuff.position.set(0, -0.3, 0.2);
  leftCuff.rotation.x = -Math.PI / 5;
  const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.105, 10, 10), bootBrownMat);
  leftHand.position.set(0, -0.36, 0.25);

  const hammerShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.052, 0.78, 10), darkBandMat);
  hammerShaft.position.set(0, -0.18, 0.34);
  hammerShaft.rotation.x = Math.PI / 2.6;

  // Iron-Banded Wooden Mallet Head with Steel Striking Faces
  const malletGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.46, 12);
  malletGeo.rotateZ(Math.PI / 2);
  const hammerHead = new THREE.Mesh(malletGeo, bootBrownMat);
  hammerHead.position.set(0, 0.02, 0.64);
  hammerHead.castShadow = true;

  [-0.17, 0.17].forEach((mx) => {
    const steelBand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.19, 0.19, 0.055, 12),
      silverBadgeMat
    );
    steelBand.rotation.z = Math.PI / 2;
    steelBand.position.set(mx, 0.02, 0.64);
    leftArm.add(steelBand);
  });

  leftArm.add(leftSleeve, leftCuff, leftHand, hammerShaft, hammerHead);
  group.add(leftArm);

  // 7. Right Arm (-X side, Blue Sleeve + Yellow Cuff + Gloved Hand) + Caged Brass Hurricane Lantern
  const rightArm = new THREE.Group();
  rightArm.position.set(-0.55, 0.96, 0);
  const rightSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.42, 12), outfitBlueMat);
  rightSleeve.position.set(0, -0.12, 0.18);
  rightSleeve.rotation.x = -Math.PI / 3.2;
  const rightCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.125, 0.09, 12), outfitYellowMat);
  rightCuff.position.set(0, -0.26, 0.29);
  rightCuff.rotation.x = -Math.PI / 3.2;
  const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.105, 10, 10), bootBrownMat);
  rightHand.position.set(0, -0.31, 0.35);

  const lanternGroup = new THREE.Group();
  lanternGroup.position.set(0, -0.35, 0.45);
  const lanternHandle = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.022, 8, 14, Math.PI), brassMat);
  lanternHandle.position.y = 0.22;
  const lanternCap = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.18, 12), brassMat);
  lanternCap.position.y = 0.18;
  const lanternCore = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.3, 12), lanternGlowMat);

  // 4 Vertical Brass Cage Guard Bars around Lantern Glass
  for (let c = 0; c < 4; c++) {
    const ca = (c / 4) * Math.PI * 2;
    const cageBar = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.32, 6), brassMat);
    cageBar.position.set(Math.cos(ca) * 0.155, 0, Math.sin(ca) * 0.155);
    lanternGroup.add(cageBar);
  }

  const lanternFlameMesh = new THREE.Mesh(
    new THREE.ConeGeometry(0.085, 0.22, 8),
    new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
  );
  lanternFlameMesh.position.y = -0.02;
  const lanternHaloMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 12, 10),
    new THREE.MeshBasicMaterial({
      color: 0xff9e1b,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  const lanternBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.21, 0.09, 12), brassMat);
  lanternBase.position.y = -0.18;
  lanternGroup.add(
    lanternHandle,
    lanternCap,
    lanternCore,
    lanternFlameMesh,
    lanternHaloMesh,
    lanternBase
  );
  rightArm.add(rightSleeve, rightCuff, rightHand, lanternGroup);
  group.add(rightArm);

  return {
    group,
    leftArm,
    rightArm,
    headGroup,
    lanternMesh: lanternCore,
    lanternFlameMesh,
    lanternHaloMesh,
  };
}

export function createCentralFortModel(): THREE.Group {
  const fort = new THREE.Group();
  fort.add(createContactShadow(3.9));

  const stoneTex = createStoneMasonryTexture();
  const logWallTex = createLogCabinWallTexture();
  const shingleTex = createRoofShingleTexture();

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    map: stoneTex,
    roughness: 0.88,
    metalness: 0.1,
  });
  const darkStoneMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.85,
    metalness: 0.15,
    flatShading: true,
  });
  const logWallMat = new THREE.MeshStandardMaterial({
    color: 0xd9a074,
    map: logWallTex,
    roughness: 0.78,
    metalness: 0.06,
  });
  const roundLogMat = new THREE.MeshStandardMaterial({
    color: 0x6b4226,
    roughness: 0.8,
    metalness: 0.08,
  });
  const logEndMat = new THREE.MeshStandardMaterial({
    color: 0xd6b07c,
    roughness: 0.7,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    map: shingleTex,
    roughness: 0.68,
    metalness: 0.2,
  });
  const timberTrimMat = new THREE.MeshStandardMaterial({
    color: 0x3e2413,
    roughness: 0.78,
    metalness: 0.1,
  });
  const shutterMat = new THREE.MeshStandardMaterial({
    color: 0x1e4d3b,
    roughness: 0.72,
    metalness: 0.12,
  });
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    emissive: 0xf59e0b,
    emissiveIntensity: 2.1,
    roughness: 0.18,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.28,
    metalness: 0.85,
  });

  // 1. Circular Cobblestone Courtyard Patio & Stone Foundation
  const courtyard = new THREE.Mesh(new THREE.CylinderGeometry(3.35, 3.5, 0.14, 24), stoneMat);
  courtyard.position.y = 0.07;
  courtyard.receiveShadow = true;
  fort.add(courtyard);

  const foundation = new THREE.Mesh(new THREE.BoxGeometry(3.75, 0.76, 3.25), stoneMat);
  foundation.position.y = 0.42;
  foundation.receiveShadow = true;
  foundation.castShadow = true;
  fort.add(foundation);

  const foundationLedge = new THREE.Mesh(new THREE.BoxGeometry(3.88, 0.12, 3.38), darkStoneMat);
  foundationLedge.position.y = 0.82;
  fort.add(foundationLedge);

  // 2. Main Timber Log Cabin Walls + Authentic Cross-Notched Corner Logs
  const cabinBody = new THREE.Mesh(new THREE.BoxGeometry(3.55, 2.25, 3.05), logWallMat);
  cabinBody.position.y = 1.92;
  cabinBody.castShadow = true;
  cabinBody.receiveShadow = true;
  fort.add(cabinBody);

  // Projecting horizontal round logs at the 4 corners for realistic log-cabin construction
  const hLogFrontBackGeo = new THREE.CylinderGeometry(0.15, 0.15, 3.95, 8);
  hLogFrontBackGeo.rotateZ(Math.PI / 2);
  const hLogSideGeo = new THREE.CylinderGeometry(0.15, 0.15, 3.45, 8);
  hLogSideGeo.rotateX(Math.PI / 2);

  for (let row = 0; row < 6; row++) {
    const ly = 1.02 + row * 0.34;
    const fb1 = new THREE.Mesh(hLogFrontBackGeo, roundLogMat);
    fb1.position.set(0, ly, 1.48);
    fb1.castShadow = true;
    const fb2 = new THREE.Mesh(hLogFrontBackGeo, roundLogMat);
    fb2.position.set(0, ly, -1.48);
    fb2.castShadow = true;

    const s1 = new THREE.Mesh(hLogSideGeo, roundLogMat);
    s1.position.set(-1.74, ly + 0.16, 0);
    s1.castShadow = true;
    const s2 = new THREE.Mesh(hLogSideGeo, roundLogMat);
    s2.position.set(1.74, ly + 0.16, 0);
    s2.castShadow = true;

    fort.add(fb1, fb2, s1, s2);
  }

  // Heartwood log-end discs on the protruding front corners
  const capGeo = new THREE.CircleGeometry(0.11, 8);
  [-1.74, 1.74].forEach((cx) => {
    for (let row = 0; row < 6; row++) {
      const cap = new THREE.Mesh(capGeo, logEndMat);
      cap.position.set(cx, 1.18 + row * 0.34, 1.73);
      fort.add(cap);
    }
  });

  // 3. Realistic Dual-Pitched Gabled Shingle Roof + Gable End Walls + Overhanging Eaves & Ridge Beam
  const roofSlopeGeo = new THREE.BoxGeometry(4.25, 0.18, 2.48);
  const frontRoofSlope = new THREE.Mesh(roofSlopeGeo, roofMat);
  frontRoofSlope.position.set(0, 3.72, 0.88);
  frontRoofSlope.rotation.x = Math.PI / 4.6;
  frontRoofSlope.castShadow = true;
  frontRoofSlope.receiveShadow = true;

  const backRoofSlope = new THREE.Mesh(roofSlopeGeo, roofMat);
  backRoofSlope.position.set(0, 3.72, -0.88);
  backRoofSlope.rotation.x = -Math.PI / 4.6;
  backRoofSlope.castShadow = true;
  backRoofSlope.receiveShadow = true;

  const ridgeBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 4.35, 8), timberTrimMat);
  ridgeBeam.rotation.z = Math.PI / 2;
  ridgeBeam.position.set(0, 4.46, 0);
  fort.add(frontRoofSlope, backRoofSlope, ridgeBeam);

  // Stepped timber gable attic walls flush under the front & back roof slopes
  const atticLower = new THREE.Mesh(new THREE.BoxGeometry(3.54, 0.72, 1.95), logWallMat);
  atticLower.position.set(0, 3.36, 0);
  atticLower.castShadow = true;
  const atticUpper = new THREE.Mesh(new THREE.BoxGeometry(3.54, 0.56, 0.96), logWallMat);
  atticUpper.position.set(0, 3.94, 0);
  atticUpper.castShadow = true;
  fort.add(atticLower, atticUpper);

  // Exposed wooden rafter tails along front & back eaves
  const rafterGeo = new THREE.BoxGeometry(0.1, 0.12, 0.38);
  for (let rx = -1.8; rx <= 1.81; rx += 0.6) {
    const rfFront = new THREE.Mesh(rafterGeo, timberTrimMat);
    rfFront.position.set(rx, 2.95, 1.88);
    rfFront.rotation.x = 0.45;
    const rfBack = new THREE.Mesh(rafterGeo, timberTrimMat);
    rfBack.position.set(rx, 2.95, -1.88);
    rfBack.rotation.x = -0.45;
    fort.add(rfFront, rfBack);
  }

  // 4. Second-Story Watch-Loft Dormer Window on Front Roof Slope (+Z)
  const dormerBody = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.15, 1.35), logWallMat);
  dormerBody.position.set(0, 4.15, 0.72);
  dormerBody.castShadow = true;
  const dormerRoofL = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.12, 1.65), roofMat);
  dormerRoofL.position.set(-0.42, 4.86, 0.74);
  dormerRoofL.rotation.z = Math.PI / 5;
  const dormerRoofR = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.12, 1.65), roofMat);
  dormerRoofR.position.set(0.42, 4.86, 0.74);
  dormerRoofR.rotation.z = -Math.PI / 5;
  fort.add(dormerBody, dormerRoofL, dormerRoofR);

  // 5. Welcoming Front Wooden Porch, Steps, Posts & Hanging Lantern (+Z Entrance)
  const porchDeck = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.22, 1.15), timberTrimMat);
  porchDeck.position.set(0, 0.72, 2.02);
  porchDeck.receiveShadow = true;
  fort.add(porchDeck);

  // 3 Front Steps leading down to the courtyard trail
  for (let s = 0; s < 3; s++) {
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(1.35, 0.18, 0.28),
      s === 0 ? stoneMat : timberTrimMat
    );
    step.position.set(0, 0.16 + (2 - s) * 0.2, 2.68 + s * 0.24);
    step.receiveShadow = true;
    fort.add(step);
  }

  // Porch pillars, railings & sloped porch overhang roof
  const postGeo = new THREE.CylinderGeometry(0.09, 0.1, 1.75, 8);
  [-1.18, -0.58, 0.58, 1.18].forEach((px) => {
    const post = new THREE.Mesh(postGeo, timberTrimMat);
    post.position.set(px, 1.65, 2.48);
    post.castShadow = true;
    fort.add(post);
  });

  const railL = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.38, 0.08), shutterMat);
  railL.position.set(-0.88, 1.02, 2.48);
  const railR = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.38, 0.08), shutterMat);
  railR.position.set(0.88, 1.02, 2.48);
  const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.14, 1.38), roofMat);
  porchRoof.position.set(0, 2.62, 2.06);
  porchRoof.rotation.x = 0.32;
  porchRoof.castShadow = true;
  fort.add(railL, railR, porchRoof);

  // Hanging Brass Porch Lantern
  const porchLantern = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.28, 6), windowMat);
  porchLantern.position.set(0.38, 2.24, 2.42);
  fort.add(porchLantern);

  // 6. Tall Mortared Cobblestone Fireplace Chimney on Left Wall (-X)
  const chimneyBase = new THREE.Mesh(new THREE.BoxGeometry(0.78, 2.4, 0.95), stoneMat);
  chimneyBase.position.set(-1.95, 1.6, -0.35);
  chimneyBase.castShadow = true;
  const chimneyShaft = new THREE.Mesh(new THREE.BoxGeometry(0.58, 2.65, 0.68), stoneMat);
  chimneyShaft.position.set(-1.82, 3.85, -0.35);
  chimneyShaft.castShadow = true;
  const chimneyCap = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.16, 0.82), darkStoneMat);
  chimneyCap.position.set(-1.82, 5.2, -0.35);
  const chimneyPot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.42, 8), roundLogMat);
  chimneyPot.position.set(-1.82, 5.45, -0.35);
  fort.add(chimneyBase, chimneyShaft, chimneyCap, chimneyPot);

  // 7. Arched Oak Plank Front Door + Iron Hinges & Brass Handle
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.08, 1.56, 0.16), timberTrimMat);
  doorFrame.position.set(0, 1.56, 1.54);
  const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(0.88, 1.42, 0.18), roundLogMat);
  doorPanel.position.set(0, 1.52, 1.56);
  const doorHandle = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.02, 6, 10), brassMat);
  doorHandle.position.set(0.26, 1.48, 1.67);
  fort.add(doorFrame, doorPanel, doorHandle);

  // 8. Mullioned Glowing Windows with Forest-Green Shutters & Window Sills
  const winConfigurations: [number, number, number, number][] = [
    [-1.12, 1.88, 1.54, 0], // Front Left
    [1.12, 1.88, 1.54, 0], // Front Right
    [0, 4.16, 1.41, 0], // Upper Dormer Watch-Loft
    [1.79, 1.92, 0.15, Math.PI / 2], // East Gable Wall
    [-1.12, 1.88, -1.54, Math.PI], // Back Left
    [1.12, 1.88, -1.54, Math.PI], // Back Right
  ];

  winConfigurations.forEach(([wx, wy, wz, rotY]) => {
    const winGroup = new THREE.Group();
    winGroup.position.set(wx, wy, wz);
    winGroup.rotation.y = rotY;

    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.64, 0.08), windowMat);
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.08, 0.14), timberTrimMat);
    frameTop.position.y = 0.34;
    const sill = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.1, 0.2), darkStoneMat);
    sill.position.set(0, -0.35, 0.04);

    // Mullion crossbars
    const mullionV = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.62, 0.11), timberTrimMat);
    const mullionH = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.05, 0.11), timberTrimMat);

    // Left & Right Wooden Shutters
    const shutterGeo = new THREE.BoxGeometry(0.22, 0.64, 0.08);
    const shutL = new THREE.Mesh(shutterGeo, shutterMat);
    shutL.position.set(-0.42, 0, 0.02);
    const shutR = new THREE.Mesh(shutterGeo, shutterMat);
    shutR.position.set(0.42, 0, 0.02);

    winGroup.add(glass, frameTop, sill, mullionV, mullionH, shutL, shutR);
    fort.add(winGroup);
  });

  // 9. Roof Peak Weathervane & Ranger Banner Flag
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 1.35, 6), darkStoneMat);
  pole.position.set(0, 5.1, 0);
  const flag = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 0.42, 0.05),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5, flatShading: true })
  );
  flag.position.set(0.42, 5.5, 0);
  fort.add(pole, flag);

  return fort;
}

export function createPlacementPadMesh(ring: 'inner' | 'outer'): THREE.Group {
  const group = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({
    color: ring === 'inner' ? 0x475569 : 0x52525b,
    roughness: 0.86,
    metalness: 0.14,
    flatShading: true,
  });
  const woodDeckMat = new THREE.MeshStandardMaterial({
    color: 0x6b4226,
    roughness: 0.8,
    metalness: 0.08,
    flatShading: true,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xb45309,
    emissiveIntensity: 0.25,
    roughness: 0.35,
    metalness: 0.55,
    flatShading: true,
  });
  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.4,
    metalness: 0.78,
    flatShading: true,
  });

  // Stepped octagonal masonry foundation plinth
  const baseCurb = new THREE.Mesh(new THREE.CylinderGeometry(1.48, 1.58, 0.14, 8), stoneMat);
  baseCurb.position.y = 0.07;
  baseCurb.receiveShadow = true;
  group.add(baseCurb);

  // Recessed timber decking platform
  const woodDeck = new THREE.Mesh(new THREE.CylinderGeometry(1.26, 1.3, 0.08, 8), woodDeckMat);
  woodDeck.position.y = 0.15;
  woodDeck.receiveShadow = true;
  group.add(woodDeck);

  // Plank joinery seams across the deck
  const plankBeamGeo = new THREE.BoxGeometry(2.15, 0.03, 0.09);
  for (let i = -2; i <= 2; i++) {
    const seam = new THREE.Mesh(plankBeamGeo, stoneMat);
    seam.position.set(0, 0.185, i * 0.38);
    group.add(seam);
  }

  // Glowing brass construction survey ring
  const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.055, 6, 16), rimMat);
  ringMesh.rotation.x = Math.PI / 2;
  ringMesh.position.y = 0.18;
  group.add(ringMesh);

  // 8 Corner masonry bolsters with iron tie-down cleats
  const pegGeo = new THREE.BoxGeometry(0.22, 0.26, 0.22);
  const cleatGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.12, 6);
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4 + Math.PI / 8;
    const peg = new THREE.Mesh(pegGeo, stoneMat);
    peg.position.set(Math.cos(angle) * 1.38, 0.14, Math.sin(angle) * 1.38);
    peg.rotation.y = -angle;
    const cleat = new THREE.Mesh(cleatGeo, ironMat);
    cleat.position.set(Math.cos(angle) * 1.38, 0.31, Math.sin(angle) * 1.38);
    group.add(peg, cleat);
  }

  return group;
}

/**
 * Creates the 4 Square Compound Corner Bastion Pillars at (±halfExtent, ±halfExtent)
 * and the square stone foundation border that frames the 19.2m x 19.2m outer fence perimeter.
 */
export function createSquareCornerBastionPosts(halfExtent: number): THREE.Group {
  const group = new THREE.Group();

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.88,
    metalness: 0.12,
    flatShading: true,
  });
  const timberMat = new THREE.MeshStandardMaterial({
    color: 0x5c3a21,
    roughness: 0.82,
    metalness: 0.1,
    flatShading: true,
  });
  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.42,
    metalness: 0.78,
    flatShading: true,
  });
  const lanternGlowMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf59e0b,
    emissiveIntensity: 2.1,
    roughness: 0.25,
    flatShading: true,
  });

  // Subtle square stone border strips along all 4 sides of the perimeter
  const fullSpan = halfExtent * 2;
  const nsStripGeo = new THREE.BoxGeometry(fullSpan + 0.7, 0.07, 0.68);
  const ewStripGeo = new THREE.BoxGeometry(0.68, 0.07, fullSpan + 0.7);
  const northBase = new THREE.Mesh(nsStripGeo, stoneMat);
  northBase.position.set(0, 0.035, -halfExtent);
  northBase.receiveShadow = true;
  const southBase = new THREE.Mesh(nsStripGeo, stoneMat);
  southBase.position.set(0, 0.035, halfExtent);
  southBase.receiveShadow = true;
  const eastBase = new THREE.Mesh(ewStripGeo, stoneMat);
  eastBase.position.set(halfExtent, 0.035, 0);
  eastBase.receiveShadow = true;
  const westBase = new THREE.Mesh(ewStripGeo, stoneMat);
  westBase.position.set(-halfExtent, 0.035, 0);
  westBase.receiveShadow = true;
  group.add(northBase, southBase, eastBase, westBase);

  // 4 Corner Bastion Posts with iron bands & warm perimeter lanterns
  const corners: [number, number][] = [
    [-halfExtent, -halfExtent],
    [halfExtent, -halfExtent],
    [-halfExtent, halfExtent],
    [halfExtent, halfExtent],
  ];

  const plinthGeo = new THREE.BoxGeometry(0.95, 0.45, 0.95);
  const pillarGeo = new THREE.BoxGeometry(0.62, 2.25, 0.62);
  const capGeo = new THREE.ConeGeometry(0.56, 0.52, 4);
  const bandGeo = new THREE.BoxGeometry(0.68, 0.14, 0.68);
  const lanternGeo = new THREE.CylinderGeometry(0.15, 0.12, 0.32, 6);

  corners.forEach(([cx, cz]) => {
    const cGroup = new THREE.Group();
    cGroup.position.set(cx, 0, cz);

    const plinth = new THREE.Mesh(plinthGeo, stoneMat);
    plinth.position.y = 0.22;
    plinth.receiveShadow = true;
    const pillar = new THREE.Mesh(pillarGeo, timberMat);
    pillar.position.y = 1.35;
    pillar.castShadow = true;
    const bandLow = new THREE.Mesh(bandGeo, ironMat);
    bandLow.position.y = 0.65;
    const bandHigh = new THREE.Mesh(bandGeo, ironMat);
    bandHigh.position.y = 2.05;
    const cap = new THREE.Mesh(capGeo, ironMat);
    cap.position.y = 2.72;
    cap.rotation.y = Math.PI / 4;
    const lantern = new THREE.Mesh(lanternGeo, lanternGlowMat);
    lantern.position.y = 3.12;

    cGroup.add(plinth, pillar, bandLow, bandHigh, cap, lantern);
    group.add(cGroup);
  });

  return group;
}

/**
 * Creates a 3D Square Perimeter Fence Segment for Level 0 (unbuilt/in-progress stakes),
 * Level 1 (Timber Palisade / Trail Gate), or Level 2 (Ironbark Spiked Fence).
 */
export function createFenceSegmentModel(segment: FenceSegment): THREE.Group {
  const group = new THREE.Group();
  group.position.set(segment.x, 0, segment.z);
  group.rotation.y = segment.rotationY;
  const len = segment.length;

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.86,
    metalness: 0.14,
    flatShading: true,
  });
  const woodMat = new THREE.MeshStandardMaterial({
    color: segment.level === 2 ? 0x6e3219 : 0x8b542f,
    roughness: 0.78,
    metalness: 0.08,
    flatShading: true,
  });
  const barkMat = new THREE.MeshStandardMaterial({
    color: 0x4a2c16,
    roughness: 0.88,
    metalness: 0.08,
    flatShading: true,
  });
  const cutWoodMat = new THREE.MeshStandardMaterial({
    color: 0xd99b66,
    roughness: 0.7,
    metalness: 0.05,
    flatShading: true,
  });
  const ironMat = new THREE.MeshStandardMaterial({
    color: segment.level === 2 ? 0xf59e0b : 0x334155,
    roughness: 0.34,
    metalness: 0.84,
    flatShading: true,
  });
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.28,
    metalness: 0.88,
    flatShading: true,
  });
  const guideMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xd97706,
    emissiveIntensity: 0.7,
    roughness: 0.35,
    flatShading: true,
  });

  // Sculpted masonry foundation curb along segment span with stone bolsters
  const basePlate = new THREE.Mesh(new THREE.BoxGeometry(len - 0.14, 0.18, 0.82), stoneMat);
  basePlate.position.y = 0.09;
  basePlate.receiveShadow = true;
  group.add(basePlate);

  const curbBlockGeo = new THREE.BoxGeometry(0.48, 0.24, 0.92);
  for (let i = -2; i <= 2; i++) {
    const bolster = new THREE.Mesh(curbBlockGeo, stoneMat);
    bolster.position.set(i * (len * 0.21), 0.12, 0);
    bolster.receiveShadow = true;
    group.add(bolster);
  }

  if (segment.level === 0) {
    // Stage 0: Foundation stakes + amber carpenter's guideline + progressive logs
    const stakeGeo = new THREE.CylinderGeometry(0.11, 0.14, 0.56, 8);
    const stakeTipGeo = new THREE.ConeGeometry(0.11, 0.18, 8);
    const numStakes = 13;
    const builtCount = Math.floor(segment.buildProgress * numStakes);

    const logGeo = new THREE.CylinderGeometry(0.16, 0.19, 1.55, 8);
    const tipGeo = new THREE.ConeGeometry(0.165, 0.38, 8);

    for (let i = 0; i < numStakes; i++) {
      const lx = -len * 0.44 + (i / (numStakes - 1)) * (len * 0.88);
      if (i < builtCount) {
        const log = new THREE.Mesh(logGeo, woodMat);
        log.position.set(lx, 0.82, 0);
        log.castShadow = true;
        const tip = new THREE.Mesh(tipGeo, cutWoodMat);
        tip.position.set(lx, 1.78, 0);
        group.add(log, tip);
      } else {
        const stake = new THREE.Mesh(stakeGeo, barkMat);
        stake.position.set(lx, 0.3, 0);
        const stakeTip = new THREE.Mesh(stakeTipGeo, cutWoodMat);
        stakeTip.position.set(lx, 0.66, 0);
        group.add(stake, stakeTip);
      }
    }

    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, len - 0.36, 6), guideMat);
    rope.rotation.z = Math.PI / 2;
    rope.position.set(0, 0.48, 0);
    group.add(rope);
    return group;
  }

  // Level 1 or Level 2 Built Fence / Fortified Gatehouse
  if (segment.isGate) {
    // Twin stone-and-timber gatehouse pillars with iron caps & lanterns
    const pillarPlinthGeo = new THREE.BoxGeometry(0.66, 0.45, 0.76);
    const gatePostGeo = new THREE.CylinderGeometry(0.24, 0.28, 2.55, 8);
    const capGeo = new THREE.ConeGeometry(0.36, 0.42, 4);

    [-1.58, 1.58].forEach((px) => {
      const plinth = new THREE.Mesh(pillarPlinthGeo, stoneMat);
      plinth.position.set(px, 0.22, 0);
      const post = new THREE.Mesh(gatePostGeo, barkMat);
      post.position.set(px, 1.38, 0);
      post.castShadow = true;
      const cap = new THREE.Mesh(capGeo, ironMat);
      cap.position.set(px, 2.82, 0);
      cap.rotation.y = Math.PI / 4;
      group.add(plinth, post, cap);
    });

    // Overhead fortified lintel beam with iron gussets & diagonal knee braces
    const topBeam = new THREE.Mesh(new THREE.BoxGeometry(3.95, 0.34, 0.58), barkMat);
    topBeam.position.set(0, 2.48, 0);
    topBeam.castShadow = true;
    const subBeam = new THREE.Mesh(new THREE.BoxGeometry(3.55, 0.18, 0.44), woodMat);
    subBeam.position.set(0, 2.16, 0);
    group.add(topBeam, subBeam);

    [-1.18, 1.18].forEach((bx, idx) => {
      const knee = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.28), barkMat);
      knee.position.set(bx, 2.02, 0);
      knee.rotation.z = idx === 0 ? -Math.PI / 4 : Math.PI / 4;
      group.add(knee);
    });

    // Heavy arched double oak gate doors with iron hinge straps, drop-bar & ring handles
    const doorHalfGeo = new THREE.BoxGeometry(1.42, 1.62, 0.22);
    const doorL = new THREE.Mesh(doorHalfGeo, woodMat);
    doorL.position.set(-0.75, 0.92, 0);
    doorL.castShadow = true;
    const doorR = new THREE.Mesh(doorHalfGeo, woodMat);
    doorR.position.set(0.75, 0.92, 0);
    doorR.castShadow = true;
    group.add(doorL, doorR);

    // Iron hinge straps & central locking bar
    [0.48, 0.95, 1.42].forEach((hy) => {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(2.96, 0.09, 0.27), ironMat);
      strap.position.set(0, hy, 0);
      group.add(strap);
    });
    const ringGeo = new THREE.TorusGeometry(0.12, 0.03, 6, 10);
    [-0.24, 0.24].forEach((rx) => {
      const ringF = new THREE.Mesh(ringGeo, steelMat);
      ringF.position.set(rx, 0.92, 0.14);
      const ringB = new THREE.Mesh(ringGeo, steelMat);
      ringB.position.set(rx, 0.92, -0.14);
      group.add(ringF, ringB);
    });

    // Flanking sharpened palisade logs on both sides of the gatehouse
    const logGeo = new THREE.CylinderGeometry(0.16, 0.19, 1.75, 8);
    const tipGeo = new THREE.ConeGeometry(0.165, 0.42, 8);
    [-2.82, -2.46, -2.1, 2.1, 2.46, 2.82].forEach((lx, idx) => {
      const hScale = 0.96 + (idx % 2) * 0.08;
      const log = new THREE.Mesh(logGeo, woodMat);
      log.position.set(lx, 0.92 * hScale, 0);
      log.scale.set(1, hScale, 1);
      log.castShadow = true;
      const tip = new THREE.Mesh(tipGeo, segment.level === 2 ? steelMat : cutWoodMat);
      tip.position.set(lx, 1.98 * hScale, 0);
      group.add(log, tip);
    });
  } else {
    // Realistic Timber Palisade Wall: 15 staggered round logs, bark collars, sharpened tips,
    // iron-riveted horizontal waling beams, and rear diagonal timber buttresses
    const logGeo = new THREE.CylinderGeometry(0.155, 0.19, 1.76, 8);
    const collarGeo = new THREE.CylinderGeometry(0.17, 0.175, 0.14, 8);
    const tipGeo = new THREE.ConeGeometry(0.16, 0.42, 8);
    const numLogs = 15;
    for (let i = 0; i < numLogs; i++) {
      const lx = -len * 0.46 + (i / (numLogs - 1)) * (len * 0.92);
      const zJitter = (i % 2 === 0 ? 1 : -1) * 0.035;
      const hScale = 0.92 + ((i * 5) % 4) * 0.055;
      const log = new THREE.Mesh(logGeo, i % 3 === 0 ? barkMat : woodMat);
      log.position.set(lx, 0.92 * hScale, zJitter);
      log.scale.set(1, hScale, 1);
      log.castShadow = true;

      const collar = new THREE.Mesh(collarGeo, barkMat);
      collar.position.set(lx, 1.72 * hScale, zJitter);

      const tip = new THREE.Mesh(tipGeo, segment.level === 2 ? steelMat : cutWoodMat);
      tip.position.set(lx, 1.98 * hScale, zJitter);
      group.add(log, collar, tip);
    }

    // Twin horizontal timber waling beams with iron bolts
    const railGeo = new THREE.BoxGeometry(len - 0.2, 0.18, 0.44);
    const railLow = new THREE.Mesh(railGeo, barkMat);
    railLow.position.set(0, 0.62, 0);
    const railHigh = new THREE.Mesh(railGeo, barkMat);
    railHigh.position.set(0, 1.34, 0);
    group.add(railLow, railHigh);

    const rivetGeo = new THREE.BoxGeometry(0.09, 0.12, 0.5);
    for (let r = -3; r <= 3; r++) {
      const rx = r * (len * 0.13);
      const riv1 = new THREE.Mesh(rivetGeo, ironMat);
      riv1.position.set(rx, 0.62, 0);
      const riv2 = new THREE.Mesh(rivetGeo, ironMat);
      riv2.position.set(rx, 1.34, 0);
      group.add(riv1, riv2);
    }

    // Diagonal rear structural buttress struts
    const strutGeo = new THREE.CylinderGeometry(0.09, 0.11, 1.45, 6);
    [-len * 0.3, 0, len * 0.3].forEach((sx) => {
      const strutF = new THREE.Mesh(strutGeo, barkMat);
      strutF.position.set(sx, 0.68, -0.36);
      strutF.rotation.x = Math.PI / 5.5;
      const strutB = new THREE.Mesh(strutGeo, barkMat);
      strutB.position.set(sx, 0.68, 0.36);
      strutB.rotation.x = -Math.PI / 5.5;
      group.add(strutF, strutB);
    });
  }

  // Level 2 Upgrade: Outward-pointing Ironbark & Steel Chevaux-de-Frise Pikes
  if (segment.level === 2) {
    const pikeShaftGeo = new THREE.CylinderGeometry(0.055, 0.075, 0.78, 6);
    const pikeHeadGeo = new THREE.ConeGeometry(0.095, 0.34, 5);
    const bracketBar = new THREE.Mesh(new THREE.BoxGeometry(len - 0.3, 0.14, 0.54), ironMat);
    bracketBar.position.set(0, 0.75, 0);
    group.add(bracketBar);

    for (let i = -4; i <= 4; i++) {
      const sx = i * 0.64;
      // Front pike
      const pFront = new THREE.Group();
      pFront.position.set(sx, 0.76, 0.32);
      pFront.rotation.x = Math.PI / 3.1;
      const shaftF = new THREE.Mesh(pikeShaftGeo, barkMat);
      const headF = new THREE.Mesh(pikeHeadGeo, steelMat);
      headF.position.y = 0.52;
      pFront.add(shaftF, headF);

      // Rear pike
      const pBack = new THREE.Group();
      pBack.position.set(sx, 0.76, -0.32);
      pBack.rotation.x = -Math.PI / 3.1;
      const shaftB = new THREE.Mesh(pikeShaftGeo, barkMat);
      const headB = new THREE.Mesh(pikeHeadGeo, steelMat);
      headB.position.y = 0.52;
      pBack.add(shaftB, headB);

      group.add(pFront, pBack);
    }
  }

  return group;
}

export function createBuildingModel(
  type: BuildingType,
  upgradePath: UpgradePathId
): THREE.Group {
  const group = new THREE.Group();
  group.add(createContactShadow(1.48));

  const woodMat = new THREE.MeshStandardMaterial({
    color: upgradePath === 'pathA' ? 0x7c2d12 : upgradePath === 'pathB' ? 0x3f6212 : 0x8b542f,
    roughness: 0.78,
    metalness: 0.1,
    flatShading: true,
  });
  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x4a2c16,
    roughness: 0.86,
    metalness: 0.08,
    flatShading: true,
  });
  const cutWoodMat = new THREE.MeshStandardMaterial({
    color: 0xd99b66,
    roughness: 0.68,
    metalness: 0.05,
    flatShading: true,
  });
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.85,
    metalness: 0.15,
    flatShading: true,
  });
  const darkStoneMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.88,
    metalness: 0.2,
    flatShading: true,
  });
  const metalMat = new THREE.MeshStandardMaterial({
    color: upgradePath === 'pathA' ? 0xf59e0b : upgradePath === 'pathB' ? 0x38bdf8 : 0x475569,
    roughness: 0.32,
    metalness: 0.84,
    flatShading: true,
  });
  const steelMat = new THREE.MeshStandardMaterial({
    color: upgradePath === 'pathA' ? 0xfde047 : upgradePath === 'pathB' ? 0x7dd3fc : 0xe2e8f0,
    roughness: 0.24,
    metalness: 0.9,
    flatShading: true,
  });
  const greenMat = new THREE.MeshStandardMaterial({
    color: upgradePath === 'pathA' ? 0x991b1b : upgradePath === 'pathB' ? 0x0f766e : 0x1e4d3b,
    roughness: 0.72,
    metalness: 0.1,
    flatShading: true,
  });
  const canvasMat = new THREE.MeshStandardMaterial({
    color: upgradePath === 'pathA' ? 0xfef3c7 : 0xe2dacb,
    roughness: 0.82,
    metalness: 0.04,
    flatShading: true,
  });

  if (type === 'palisade') {
    // Realistic Fortified Palisade Barricade:
    // Stone curb + 11 staggered round timber logs with bark collars & sharpened tips +
    // twin iron-strapped horizontal crossbeams + rear timber buttresses + front chevaux-de-frise spike rack
    const baseCurb = new THREE.Mesh(new THREE.BoxGeometry(3.15, 0.22, 0.86), stoneMat);
    baseCurb.position.y = 0.11;
    baseCurb.receiveShadow = true;
    group.add(baseCurb);

    const logGeo = new THREE.CylinderGeometry(0.15, 0.185, 1.72, 8);
    const tipGeo = new THREE.ConeGeometry(0.155, 0.42, 8);
    const collarGeo = new THREE.CylinderGeometry(0.165, 0.17, 0.12, 8);
    for (let i = -5; i <= 5; i++) {
      const lx = i * 0.265;
      const lz = (i % 2 === 0 ? 1 : -1) * 0.05;
      const hScale = 0.92 + ((Math.abs(i) * 3) % 4) * 0.06;
      const log = new THREE.Mesh(logGeo, i % 2 === 0 ? woodMat : darkWoodMat);
      log.position.set(lx, 0.92 * hScale, lz);
      log.scale.set(1, hScale, 1);
      log.castShadow = true;

      const collar = new THREE.Mesh(collarGeo, darkWoodMat);
      collar.position.set(lx, 1.7 * hScale, lz);

      const tip = new THREE.Mesh(tipGeo, upgradePath ? steelMat : cutWoodMat);
      tip.position.set(lx, 1.96 * hScale, lz);
      group.add(log, collar, tip);
    }

    // Twin horizontal waling beams + iron brackets
    const beamLow = new THREE.Mesh(new THREE.BoxGeometry(3.05, 0.18, 0.42), darkWoodMat);
    beamLow.position.set(0, 0.62, 0);
    const beamHigh = new THREE.Mesh(new THREE.BoxGeometry(3.05, 0.18, 0.42), darkWoodMat);
    beamHigh.position.set(0, 1.32, 0);
    const ironBandLow = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.08, 0.46), metalMat);
    ironBandLow.position.set(0, 0.62, 0);
    const ironBandHigh = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.08, 0.46), metalMat);
    ironBandHigh.position.set(0, 1.32, 0);
    group.add(beamLow, beamHigh, ironBandLow, ironBandHigh);

    // Rear angled support buttresses
    const strutGeo = new THREE.CylinderGeometry(0.085, 0.11, 1.45, 6);
    [-1.05, 0, 1.05].forEach((sx) => {
      const strut = new THREE.Mesh(strutGeo, darkWoodMat);
      strut.position.set(sx, 0.68, -0.38);
      strut.rotation.x = Math.PI / 5;
      group.add(strut);
    });

    // Forward-angled defensive chevaux-de-frise pikes
    const pikeShaftGeo = new THREE.CylinderGeometry(0.05, 0.07, 0.88, 6);
    const pikeTipGeo = new THREE.ConeGeometry(0.085, 0.32, 5);
    for (let i = -3; i <= 3; i++) {
      const pikeGroup = new THREE.Group();
      pikeGroup.position.set(i * 0.42, 0.56, 0.34);
      pikeGroup.rotation.x = Math.PI / 3.1;
      const shaft = new THREE.Mesh(pikeShaftGeo, darkWoodMat);
      const head = new THREE.Mesh(pikeTipGeo, steelMat);
      head.position.y = 0.56;
      pikeGroup.add(shaft, head);
      group.add(pikeGroup);
    }
  } else if (type === 'watchtower') {
    // Realistic Timber Guard Watchtower & Mounted Roof Ballista:
    // 4 stone foundation piers + 4 heavy timber corner posts + diagonal X-bracing on all 4 sides +
    // rear climbing ladder + crenellated wooden parapet battlements with shields +
    // roof-mounted heavy crossbow/ballista weapon + 4-pillar shingled roof canopy
    const pierGeo = new THREE.BoxGeometry(0.42, 0.36, 0.42);
    const legGeo = new THREE.CylinderGeometry(0.13, 0.16, 2.25, 8);
    const corners: [number, number][] = [
      [-0.68, -0.68],
      [0.68, -0.68],
      [-0.68, 0.68],
      [0.68, 0.68],
    ];
    corners.forEach(([lx, lz]) => {
      const pier = new THREE.Mesh(pierGeo, stoneMat);
      pier.position.set(lx, 0.18, lz);
      pier.receiveShadow = true;
      const leg = new THREE.Mesh(legGeo, darkWoodMat);
      leg.position.set(lx, 1.25, lz);
      leg.castShadow = true;
      group.add(pier, leg);
    });

    // Diagonal X-braces on all 4 tower faces
    const braceGeo = new THREE.BoxGeometry(1.55, 0.1, 0.1);
    [-0.68, 0.68].forEach((zPos) => {
      const b1 = new THREE.Mesh(braceGeo, woodMat);
      b1.position.set(0, 1.15, zPos);
      b1.rotation.z = Math.PI / 4.2;
      const b2 = new THREE.Mesh(braceGeo, woodMat);
      b2.position.set(0, 1.15, zPos);
      b2.rotation.z = -Math.PI / 4.2;
      group.add(b1, b2);
    });
    [-0.68, 0.68].forEach((xPos) => {
      const b1 = new THREE.Mesh(braceGeo, woodMat);
      b1.position.set(xPos, 1.15, 0);
      b1.rotation.y = Math.PI / 2;
      b1.rotation.z = Math.PI / 4.2;
      const b2 = new THREE.Mesh(braceGeo, woodMat);
      b2.position.set(xPos, 1.15, 0);
      b2.rotation.y = Math.PI / 2;
      b2.rotation.z = -Math.PI / 4.2;
      group.add(b1, b2);
    });

    // Climbing ladder on rear face
    const railGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.15, 6);
    [-0.22, 0.22].forEach((rx) => {
      const r = new THREE.Mesh(railGeo, cutWoodMat);
      r.position.set(rx, 1.1, -0.78);
      r.rotation.x = -0.08;
      group.add(r);
    });
    const rungGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.46, 6);
    for (let r = 0; r < 6; r++) {
      const rung = new THREE.Mesh(rungGeo, cutWoodMat);
      rung.rotation.z = Math.PI / 2;
      rung.position.set(0, 0.35 + r * 0.32, -0.79);
      group.add(rung);
    }

    // Elevated floor deck & support joists
    const deck = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.22, 1.88), woodMat);
    deck.position.y = 2.22;
    deck.castShadow = true;
    group.add(deck);

    // Crenellated wooden parapet walls + merlons + round iron boss shields
    const wallNSGeo = new THREE.BoxGeometry(1.94, 0.42, 0.14);
    const wallEWGeo = new THREE.BoxGeometry(0.14, 0.42, 1.94);
    [-0.88, 0.88].forEach((pos) => {
      const wNS = new THREE.Mesh(wallNSGeo, darkWoodMat);
      wNS.position.set(0, 2.52, pos);
      const wEW = new THREE.Mesh(wallEWGeo, darkWoodMat);
      wEW.position.set(pos, 2.52, 0);
      group.add(wNS, wEW);
    });
    const merlonGeo = new THREE.BoxGeometry(0.34, 0.22, 0.18);
    [-0.68, 0, 0.68].forEach((mx) => {
      const mF = new THREE.Mesh(merlonGeo, woodMat);
      mF.position.set(mx, 2.82, 0.88);
      const mB = new THREE.Mesh(merlonGeo, woodMat);
      mB.position.set(mx, 2.82, -0.88);
      group.add(mF, mB);
    });

    // Mounted Rotating Heavy Ballista / Crossbow Turret on the Watchtower Deck
    const ballistaGroup = new THREE.Group();
    ballistaGroup.position.set(0, 2.35, 0);
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.42, 8), metalMat);
    pedestal.position.y = 0.2;
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 1.35), darkWoodMat);
    stock.position.set(0, 0.46, 0.12);
    // Curved steel bow limbs
    const limbGeo = new THREE.BoxGeometry(0.78, 0.1, 0.14);
    const limbL = new THREE.Mesh(limbGeo, steelMat);
    limbL.position.set(-0.42, 0.48, 0.62);
    limbL.rotation.y = 0.32;
    const limbR = new THREE.Mesh(limbGeo, steelMat);
    limbR.position.set(0.42, 0.48, 0.62);
    limbR.rotation.y = -0.32;
    // Loaded iron-tipped ballista bolt
    const boltShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.15, 6), cutWoodMat);
    boltShaft.rotation.x = Math.PI / 2;
    boltShaft.position.set(0, 0.56, 0.35);
    const boltHead = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.26, 5), steelMat);
    boltHead.rotation.x = Math.PI / 2;
    boltHead.position.set(0, 0.56, 0.98);
    ballistaGroup.add(pedestal, stock, limbL, limbR, boltShaft, boltHead);
    group.add(ballistaGroup);

    // 4-Pillar Open Canopy Roof so the Ballista is clearly visible inside
    const roofPostGeo = new THREE.CylinderGeometry(0.075, 0.085, 1.15, 6);
    corners.forEach(([lx, lz]) => {
      const rp = new THREE.Mesh(roofPostGeo, darkWoodMat);
      rp.position.set(lx * 1.12, 3.25, lz * 1.12);
      group.add(rp);
    });
    const roofLower = new THREE.Mesh(new THREE.ConeGeometry(1.58, 0.68, 4), greenMat);
    roofLower.position.y = 3.98;
    roofLower.rotation.y = Math.PI / 4;
    roofLower.castShadow = true;
    const roofPeak = new THREE.Mesh(new THREE.ConeGeometry(1.02, 0.62, 4), metalMat);
    roofPeak.position.y = 4.38;
    roofPeak.rotation.y = Math.PI / 4;
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.48, 6), steelMat);
    spire.position.y = 4.78;
    group.add(roofLower, roofPeak, spire);
  } else if (type === 'spiketrap') {
    // Realistic Mechanical Ground Spike Trap:
    // Bevelled timber & bolted iron hazard frame + recessed pit floor +
    // crisscrossed iron grate bars + 9 spring-loaded barbed steel spikes with piston collars
    const outerFrame = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.18, 2.05), darkWoodMat);
    outerFrame.position.y = 0.09;
    outerFrame.receiveShadow = true;
    const innerPit = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.19, 1.68), darkStoneMat);
    innerPit.position.y = 0.095;
    group.add(outerFrame, innerPit);

    // Corner iron hazard brackets & rivets
    const cornerPlateGeo = new THREE.BoxGeometry(0.38, 0.21, 0.38);
    [
      [-0.86, -0.86],
      [0.86, -0.86],
      [-0.86, 0.86],
      [0.86, 0.86],
    ].forEach(([cx, cz]) => {
      const cp = new THREE.Mesh(cornerPlateGeo, metalMat);
      cp.position.set(cx, 0.105, cz);
      group.add(cp);
    });

    // Wrought-iron grate bars across the pit
    const barGeo = new THREE.BoxGeometry(1.74, 0.05, 0.08);
    [-0.54, 0, 0.54].forEach((offset) => {
      const bX = new THREE.Mesh(barGeo, metalMat);
      bX.position.set(0, 0.19, offset);
      const bZ = new THREE.Mesh(barGeo, metalMat);
      bZ.rotation.y = Math.PI / 2;
      bZ.position.set(offset, 0.19, 0);
      group.add(bX, bZ);
    });

    // 3x3 array of mechanical spring-loaded steel spikes with serrated barbs
    const springBaseGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.16, 8);
    const spikeShaftGeo = new THREE.CylinderGeometry(0.05, 0.11, 0.48, 6);
    const spikeTipGeo = new THREE.ConeGeometry(0.11, 0.38, 6);
    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
        const sx = x * 0.54;
        const sz = z * 0.54;
        const collar = new THREE.Mesh(springBaseGeo, metalMat);
        collar.position.set(sx, 0.22, sz);
        const shaft = new THREE.Mesh(spikeShaftGeo, darkStoneMat);
        shaft.position.set(sx, 0.46, sz);
        const tip = new THREE.Mesh(spikeTipGeo, steelMat);
        tip.position.set(sx, 0.82, sz);
        tip.castShadow = true;
        group.add(collar, shaft, tip);
      }
    }
  } else if (type === 'campfire') {
    // Realistic Ranger Hearth & Cooking Tripod Cauldron:
    // Paved flagstone circle + 12 sculpted river boulders + glowing red-hot ember bed +
    // 6 split oak firewood logs + multi-layered flickering flame + wrought-iron tripod & hanging stew pot
    const hearthSlab = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.25, 0.1, 12), darkStoneMat);
    hearthSlab.position.y = 0.05;
    hearthSlab.receiveShadow = true;
    group.add(hearthSlab);

    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const rScale = 0.88 + (i % 3) * 0.14;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 0), stoneMat);
      rock.position.set(Math.cos(a) * 0.92, 0.18, Math.sin(a) * 0.92);
      rock.scale.set(rScale, 0.78, rScale);
      rock.rotation.set(i * 0.5, a, 0);
      rock.castShadow = true;
      group.add(rock);
    }

    // Glowing coal & ember bed
    const emberMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xea580c,
      emissiveIntensity: 2.2,
      roughness: 0.3,
      flatShading: true,
    });
    const emberBed = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.76, 0.14, 10), emberMat);
    emberBed.position.y = 0.12;
    group.add(emberBed);

    // 6 radial split oak logs with cut ends
    const fireLogGeo = new THREE.CylinderGeometry(0.1, 0.12, 1.38, 7);
    for (let i = 0; i < 6; i++) {
      const log = new THREE.Mesh(fireLogGeo, i % 2 === 0 ? woodMat : darkWoodMat);
      log.position.y = 0.28;
      log.rotation.z = Math.PI / 2.45;
      log.rotation.y = (i * Math.PI) / 3;
      log.castShadow = true;
      group.add(log);
    }

    // Multi-layered outer & inner flames
    const outerFlameMat = new THREE.MeshStandardMaterial({
      color: 0xffedd5,
      emissive: upgradePath === 'pathB' ? 0xea580c : 0xf59e0b,
      emissiveIntensity: 2.8,
      roughness: 0.18,
      flatShading: true,
    });
    const innerFlameMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfef08a,
      emissiveIntensity: 3.4,
      roughness: 0.1,
      flatShading: true,
    });
    const flameMain = new THREE.Mesh(new THREE.ConeGeometry(0.46, 1.05, 7), outerFlameMat);
    flameMain.position.y = 0.68;
    const flameCore = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.72, 6), innerFlameMat);
    flameCore.position.y = 0.62;
    group.add(flameMain, flameCore);
    for (let f = 0; f < 3; f++) {
      const fa = (f * Math.PI * 2) / 3 + 0.4;
      const tongue = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.65, 5), outerFlameMat);
      tongue.position.set(Math.cos(fa) * 0.26, 0.52, Math.sin(fa) * 0.26);
      tongue.rotation.z = -Math.cos(fa) * 0.22;
      tongue.rotation.x = Math.sin(fa) * 0.22;
      group.add(tongue);
    }

    // Wrought-iron cooking tripod & suspended stew cauldron over the fire
    const tripodPoleGeo = new THREE.CylinderGeometry(0.035, 0.045, 2.25, 6);
    for (let t = 0; t < 3; t++) {
      const ta = (t * Math.PI * 2) / 3;
      const pole = new THREE.Mesh(tripodPoleGeo, darkStoneMat);
      pole.position.set(Math.cos(ta) * 0.52, 0.98, Math.sin(ta) * 0.52);
      pole.lookAt(0, 1.98, 0);
      pole.rotateX(Math.PI / 2);
      group.add(pole);
    }
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.58, 6), steelMat);
    chain.position.y = 1.62;
    const potBody = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), darkStoneMat);
    potBody.position.y = 1.26;
    potBody.scale.set(1, 0.82, 1);
    const potRim = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.04, 6, 12), metalMat);
    potRim.rotation.x = Math.PI / 2;
    potRim.position.y = 1.42;
    group.add(chain, potBody, potRim);
  } else if (type === 'catapult') {
    // Realistic Wheeled Siege Onager / Catapult:
    // Heavy timber chassis + 4 iron-rimmed spoked siege wheels + twin A-frame uprights +
    // twisted rope torsion bundle + rear ratcheted winch drum + heavy throwing arm with cupped iron spoon & boulder
    const beamGeo = new THREE.BoxGeometry(0.24, 0.28, 2.25);
    [-0.64, 0.64].forEach((bx) => {
      const beam = new THREE.Mesh(beamGeo, darkWoodMat);
      beam.position.set(bx, 0.38, 0);
      beam.castShadow = true;
      group.add(beam);
    });
    const crossBeamGeo = new THREE.BoxGeometry(1.56, 0.24, 0.26);
    [-0.85, 0, 0.85].forEach((bz) => {
      const cb = new THREE.Mesh(crossBeamGeo, woodMat);
      cb.position.set(0, 0.38, bz);
      group.add(cb);
    });

    // 4 Iron-rimmed spoked siege wheels + axles
    const axleGeo = new THREE.CylinderGeometry(0.07, 0.07, 1.88, 8);
    [-0.68, 0.68].forEach((az) => {
      const axle = new THREE.Mesh(axleGeo, darkWoodMat);
      axle.rotation.z = Math.PI / 2;
      axle.position.set(0, 0.34, az);
      group.add(axle);

      [-0.86, 0.86].forEach((wx) => {
        const wGroup = new THREE.Group();
        wGroup.position.set(wx, 0.34, az);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.06, 6, 12), metalMat);
        rim.rotation.y = Math.PI / 2;
        const disk = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.09, 10), woodMat);
        disk.rotation.z = Math.PI / 2;
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.16, 8), steelMat);
        hub.rotation.z = Math.PI / 2;
        const spoke1 = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.56, 0.06), darkWoodMat);
        const spoke2 = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.06, 0.56), darkWoodMat);
        wGroup.add(rim, disk, hub, spoke1, spoke2);
        group.add(wGroup);
      });
    });

    // Twin A-frame stanchions & padded crossbar stop
    const stanchionGeo = new THREE.BoxGeometry(0.2, 1.35, 0.24);
    [-0.58, 0.58].forEach((sx) => {
      const stF = new THREE.Mesh(stanchionGeo, woodMat);
      stF.position.set(sx, 0.96, 0.28);
      stF.rotation.x = -0.22;
      stF.castShadow = true;
      const stB = new THREE.Mesh(stanchionGeo, woodMat);
      stB.position.set(sx, 0.96, -0.18);
      stB.rotation.x = 0.24;
      stB.castShadow = true;
      group.add(stF, stB);
    });
    const stopBar = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.26, 0.3), metalMat);
    stopBar.position.set(0, 1.48, 0.18);
    group.add(stopBar);

    // Torsion rope bundle & rear winch drum
    const torsion = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.38, 8), canvasMat);
    torsion.rotation.z = Math.PI / 2;
    torsion.position.set(0, 0.62, 0.12);
    const winch = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.25, 8), darkWoodMat);
    winch.rotation.z = Math.PI / 2;
    winch.position.set(0, 0.56, -0.82);
    group.add(torsion, winch);

    // Throwing arm + cupped iron spoon + loaded boulder / brimstone fire-pot
    const armGroup = new THREE.Group();
    armGroup.position.set(0, 0.64, 0.12);
    armGroup.rotation.x = -0.58;
    const armBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 1.85, 8), woodMat);
    armBeam.position.set(0, 0.85, 0);
    armBeam.castShadow = true;
    const spoonRim = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.22, 0.22, 10), metalMat);
    spoonRim.position.set(0, 1.78, -0.08);
    spoonRim.rotation.x = Math.PI / 2;
    const payloadMat =
      upgradePath === 'pathA'
        ? new THREE.MeshStandardMaterial({
            color: 0xfef08a,
            emissive: 0xea580c,
            emissiveIntensity: 2.0,
            flatShading: true,
          })
        : stoneMat;
    const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32, 0), payloadMat);
    boulder.position.set(0, 1.78, 0.14);
    boulder.castShadow = true;
    armGroup.add(armBeam, spoonRim, boulder);
    group.add(armGroup);
  } else if (type === 'guardtent') {
    // Realistic Ranger Command Ridge Tent & Tripod Crossbow Post ("perbaiki bentuk tenda penjaga"):
    // 1. Timber Deck Platform with 4 Corner Stone Bolsters
    const deck = new THREE.Mesh(new THREE.BoxGeometry(2.16, 0.16, 2.16), darkWoodMat);
    deck.position.y = 0.08;
    deck.receiveShadow = true;
    group.add(deck);

    for (const [cx, cz] of [
      [-1.02, -1.02],
      [1.02, -1.02],
      [-1.02, 1.02],
      [1.02, 1.02],
    ]) {
      const bolster = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.24), stoneMat);
      bolster.position.set(cx, 0.11, cz);
      group.add(bolster);
    }

    // Canvas Materials: Warm Cream/Sand Canvas + Bold Crimson/Gold Heraldic Trim (contrasts sharply with grass)
    const canvasCreamMat = new THREE.MeshStandardMaterial({
      color: 0xf4ead2,
      roughness: 0.72,
      metalness: 0.04,
    });
    const canvasTrimMat = new THREE.MeshStandardMaterial({
      color: upgradePath === 'pathA' ? 0xdc2626 : upgradePath === 'pathB' ? 0x2563eb : 0xb91c1c,
      emissive: upgradePath === 'pathA' ? 0x991b1b : upgradePath === 'pathB' ? 0x1e40af : 0x7f1d1d,
      emissiveIntensity: 0.18,
      roughness: 0.58,
      metalness: 0.08,
    });
    const tentInteriorMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });

    const tentGroup = new THREE.Group();
    tentGroup.position.set(-0.08, 0.16, -0.06);

    // 100% Seamless Pentagon Ridge-Tent Body via ExtrudeGeometry (Vertical Side Walls + Pitched A-Frame Roof)
    const tentShape = new THREE.Shape();
    tentShape.moveTo(-0.84, 0);
    tentShape.lineTo(0.84, 0);
    tentShape.lineTo(0.84, 0.54);
    tentShape.lineTo(0, 1.36);
    tentShape.lineTo(-0.84, 0.54);
    tentShape.closePath();

    const tentExtrudeGeo = new THREE.ExtrudeGeometry(tentShape, {
      depth: 1.64,
      bevelEnabled: false,
    });
    tentExtrudeGeo.translate(0, 0, -0.82);
    const tentBody = new THREE.Mesh(tentExtrudeGeo, canvasCreamMat);
    tentBody.castShadow = true;
    tentBody.receiveShadow = true;
    tentGroup.add(tentBody);

    // Overhanging Pitched Roof Eave Slopes (Left & Right angled roof panels meeting cleanly at top ridge y = 1.38)
    const leftRoofSlope = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.06, 1.78), canvasCreamMat);
    leftRoofSlope.position.set(-0.44, 0.96, 0);
    leftRoofSlope.rotation.z = 0.77;
    leftRoofSlope.castShadow = true;

    const rightRoofSlope = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.06, 1.78), canvasCreamMat);
    rightRoofSlope.position.set(0.44, 0.96, 0);
    rightRoofSlope.rotation.z = -0.77;
    rightRoofSlope.castShadow = true;
    tentGroup.add(leftRoofSlope, rightRoofSlope);

    // Heraldic Decorative Stripes on Both Roof Slopes
    for (const zOff of [-0.52, 0, 0.52]) {
      const stripeL = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.075, 0.22), canvasTrimMat);
      stripeL.position.set(-0.44, 0.97, zOff);
      stripeL.rotation.z = 0.77;
      const stripeR = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.075, 0.22), canvasTrimMat);
      stripeR.position.set(0.44, 0.97, zOff);
      stripeR.rotation.z = -0.77;
      tentGroup.add(stripeL, stripeR);
    }

    // Dark Front Doorway Opening + Swept-Back Open Front Entrance Curtains
    const doorOpening = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.78, 0.05), tentInteriorMat);
    doorOpening.position.set(0, 0.39, 0.81);
    const flapL = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.86, 0.07), canvasTrimMat);
    flapL.position.set(-0.52, 0.44, 0.84);
    flapL.rotation.y = 0.28;
    flapL.rotation.z = -0.18;
    const flapR = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.86, 0.07), canvasTrimMat);
    flapR.position.set(0.52, 0.44, 0.84);
    flapR.rotation.y = -0.28;
    flapR.rotation.z = 0.18;
    tentGroup.add(doorOpening, flapL, flapR);

    // Wooden Ridgepole & Front/Rear Upright Poles + Hanging Warm Camp Lantern at Tent Entrance
    const ridgePole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.06, 8), cutWoodMat);
    ridgePole.rotation.x = Math.PI / 2;
    ridgePole.position.set(0, 1.38, 0.04);
    const frontPost = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.4, 8), darkWoodMat);
    frontPost.position.set(0, 0.7, 0.86);
    const backPost = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.4, 8), darkWoodMat);
    backPost.position.set(0, 0.7, -0.86);

    const entranceLantern = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.08, 0.18, 8),
      new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xf59e0b,
        emissiveIntensity: 1.6,
        roughness: 0.2,
      })
    );
    entranceLantern.position.set(0, 1.16, 0.94);
    tentGroup.add(ridgePole, frontPost, backPost, entranceLantern);

    // 4 Tension Guy-Ropes & Wooden Ground Stakes on Left & Right Sides
    for (const sideSign of [-1, 1]) {
      for (const zRope of [-0.55, 0.55]) {
        const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.65, 6), cutWoodMat);
        rope.position.set(sideSign * 0.96, 0.32, zRope);
        rope.rotation.z = sideSign * 0.52;
        const stake = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.22, 6), darkWoodMat);
        stake.position.set(sideSign * 1.1, 0.1, zRope);
        stake.rotation.z = -sideSign * 0.25;
        tentGroup.add(rope, stake);
      }
    }

    group.add(tentGroup);

    // Forward-mounted Ranger Tripod Crossbow Turret guarding the tent entrance
    const turret = new THREE.Group();
    turret.position.set(0.62, 0.16, 0.78);
    const stand = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.58, 4), darkWoodMat);
    stand.position.y = 0.29;
    const xbowBody = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.76), woodMat);
    xbowBody.position.set(0, 0.6, 0.08);
    const xbowArc = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.08, 0.12), steelMat);
    xbowArc.position.set(0, 0.62, 0.38);
    const boltShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.56, 6), cutWoodMat);
    boltShaft.rotation.x = Math.PI / 2;
    boltShaft.position.set(0, 0.66, 0.2);
    turret.add(stand, xbowBody, xbowArc, boltShaft);
    group.add(turret);

    // Tall Heraldic Ranger Flagpole & Vivid Pennant Banner
    const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.55, 8), cutWoodMat);
    flagPole.position.set(-0.82, 1.32, 0.72);
    const flagFinial = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), metalMat);
    flagFinial.position.set(-0.82, 2.62, 0.72);
    const flagCloth = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.38, 0.05), canvasTrimMat);
    flagCloth.position.set(-0.46, 2.32, 0.72);
    const flagGoldEdge = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.07, 0.06), metalMat);
    flagGoldEdge.position.set(-0.46, 2.14, 0.72);
    group.add(flagPole, flagFinial, flagCloth, flagGoldEdge);
  }

  return group;
}

export function createZombieModel(
  type: ZombieArchetype,
  pajamaTex: THREE.CanvasTexture
): THREE.Group {
  const group = new THREE.Group();

  const specScale =
    type === 'baron'
      ? 1.52
      : type === 'armored_undead'
      ? 1.22
      : type === 'gawp'
      ? 1.15
      : type === 'grinner'
      ? 1.14
      : type === 'brine'
      ? 1.1
      : type === 'bone_howler'
      ? 1.1
      : type === 'grumble'
      ? 1.05
      : type === 'swift_stumbler'
      ? 0.94
      : 1.0;
  group.add(createContactShadow(0.75 * specScale));

  // Canonical skin colors matched to the 7 attached reference PNGs
  const zombieSkinColors: Record<ZombieArchetype, number> = {
    shamble: 0x7c9a63, // Mossy olive-sage (zombie-shamble.png)
    grinner: 0x689f82, // Pale blue-green undead (zombie-the-grinner.png)
    grumble: 0x7a9960, // Olive-green (zombie-old-grumble.png)
    gawp: 0x789c60, // Olive-sage (zombie-gawp.png)
    brine: 0x738c54, // Bog olive-green (zombie-brine.png)
    baron: 0x748c52, // Warlord undead olive (zombie-baron-blight.png)
    swift_stumbler: 0xfdba74,
    armored_undead: 0x64748b,
    bone_howler: 0x5eead4,
  };

  const skinMat = new THREE.MeshStandardMaterial({
    color: zombieSkinColors[type],
    roughness: type === 'brine' ? 0.35 : 0.72,
    metalness: type === 'brine' ? 0.2 : 0.06,
    flatShading: true,
  });

  // Canonical outfit/coat colors matched to reference PNGs
  const coatMat =
    type === 'grumble'
      ? new THREE.MeshStandardMaterial({
          color: 0xffffff,
          map: pajamaTex,
          roughness: 0.82,
          flatShading: true,
        })
      : new THREE.MeshStandardMaterial({
          color:
            type === 'shamble'
              ? 0x5c432d // Muddy tattered brown tunic
              : type === 'grinner'
              ? 0x1f474d // Dark slate-teal Victorian tailcoat
              : type === 'gawp'
              ? 0x784932 // Patched rust-brown & olive rag shirt
              : type === 'brine'
              ? 0x264732 // Dark swamp-green bog shirt
              : type === 'baron'
              ? 0x2d3748 // Dark gunmetal plate armor
              : type === 'armored_undead'
              ? 0x1e293b
              : type === 'swift_stumbler'
              ? 0xc2410c
              : 0x0f766e,
          roughness: type === 'baron' || type === 'armored_undead' ? 0.42 : 0.78,
          metalness: type === 'baron' || type === 'armored_undead' ? 0.6 : 0.12,
          flatShading: true,
        });

  const pantsMat =
    type === 'grumble'
      ? coatMat
      : new THREE.MeshStandardMaterial({
          color:
            type === 'shamble'
              ? 0x4a5538
              : type === 'grinner'
              ? 0x3b4a42
              : type === 'gawp'
              ? 0x2f472e
              : type === 'brine'
              ? 0x4d3826
              : 0x1e293b,
          roughness: 0.85,
          flatShading: true,
        });

  // 1. Legs & Boots/Feet
  const isLanky = type === 'grinner';
  const legGeo = new THREE.BoxGeometry(isLanky ? 0.18 : 0.22, isLanky ? 0.54 : 0.45, 0.22);
  const leftLeg = new THREE.Mesh(legGeo, pantsMat);
  leftLeg.position.set(-0.16, 0.24, 0);
  const rightLeg = new THREE.Mesh(legGeo, pantsMat);
  rightLeg.position.set(0.16, 0.24, 0);
  group.add(leftLeg, rightLeg);

  // 2. Torso (proportioned per reference silhouette)
  const torsoWidth =
    type === 'baron' ? 0.76 : type === 'brine' ? 0.68 : type === 'grinner' ? 0.46 : 0.58;
  const torsoHeight = type === 'grinner' ? 0.78 : type === 'baron' ? 0.78 : 0.68;
  const torso = new THREE.Mesh(new THREE.BoxGeometry(torsoWidth, torsoHeight, 0.38), coatMat);
  torso.position.y = 0.76;
  if (type === 'shamble' || type === 'brine') {
    torso.rotation.x = 0.18;
    torso.position.z = 0.05;
  } else if (type === 'swift_stumbler') {
    torso.rotation.x = 0.26;
    torso.position.z = 0.06;
  }
  torso.castShadow = true;
  group.add(torso);

  // 3. Head
  const headY = type === 'grinner' ? 1.44 : type === 'baron' ? 1.42 : 1.34;
  const headZOffset =
    type === 'swift_stumbler' ? 0.12 : type === 'shamble' || type === 'brine' ? 0.08 : 0;
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(type === 'grinner' ? 0.44 : 0.5, 0.5, 0.48),
    skinMat
  );
  head.position.set(0, headY, headZOffset);
  head.castShadow = true;
  group.add(head);

  // 4. Eyes & Signature Facial Expression
  const eyeYellowMat = new THREE.MeshBasicMaterial({
    color:
      type === 'baron'
        ? 0xfacc15
        : type === 'grinner'
        ? 0xfef08a
        : type === 'swift_stumbler'
        ? 0xfb923c
        : type === 'armored_undead'
        ? 0x38bdf8
        : 0xfef9c3,
  });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x090d16 });
  const darkMouthMat = new THREE.MeshBasicMaterial({ color: 0x1e1312 });

  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), eyeYellowMat);
  leftEye.position.set(-0.13, headY + 0.04, 0.23 + headZOffset);
  const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), eyeYellowMat);
  rightEye.position.set(0.13, headY + 0.03, 0.23 + headZOffset);
  group.add(leftEye, rightEye);

  if (type !== 'baron' && type !== 'grinner') {
    const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.042, 6, 6), pupilMat);
    leftPupil.position.set(-0.13, headY + 0.04, 0.31 + headZOffset);
    const rightPupil = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), pupilMat);
    rightPupil.position.set(0.13, headY + 0.03, 0.3 + headZOffset);
    group.add(leftPupil, rightPupil);
  }

  // 5. Arms & Archetype-Specific Canonical Props from the 7 Reference Images
  const armGeo = new THREE.BoxGeometry(0.18, 0.18, 0.56);
  const leftArm = new THREE.Mesh(armGeo, type === 'grinner' || type === 'grumble' ? coatMat : skinMat);
  leftArm.position.set(-0.38, 0.92, 0.22);
  const rightArm = new THREE.Mesh(armGeo, type === 'grinner' || type === 'grumble' ? coatMat : skinMat);
  rightArm.position.set(0.38, 0.92, 0.22);

  if (type === 'shamble') {
    // SHAMBLE (zombie-shamble.png):
    // - Right arm (-X) outstretched pointing forward
    // - Left arm (+X) bent holding a crumpled beige trail map in front of chest
    // - Cross-body canvas satchel bag + belt wooden mug + moss & shoulder twig + dazed open mouth
    leftArm.position.set(-0.36, 0.98, 0.32); // Pointing forward (-X is right side of character facing +Z)
    rightArm.position.set(0.32, 0.86, 0.26);
    rightArm.rotation.y = -0.45;

    // Crumpled parchment trail map held in hand
    const mapSheet = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.26, 0.03),
      new THREE.MeshStandardMaterial({ color: 0xd6c7a9, roughness: 0.85, flatShading: true })
    );
    mapSheet.position.set(0.16, 0.88, 0.48);
    mapSheet.rotation.set(-0.45, -0.25, 0.15);

    // Cross-body satchel bag + wooden mug on belt
    const satchelMat = new THREE.MeshStandardMaterial({
      color: 0x8c7d65,
      roughness: 0.85,
      flatShading: true,
    });
    const satchelBag = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.28), satchelMat);
    satchelBag.position.set(0.34, 0.54, -0.02);
    const mug = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.18, 7),
      new THREE.MeshStandardMaterial({ color: 0x785233, roughness: 0.8 })
    );
    mug.position.set(0.18, 0.52, 0.24);
    mug.rotation.z = 0.35;

    // Moss clumps on head & shoulder + small twig sticking out of shoulder
    const mossMat = new THREE.MeshStandardMaterial({ color: 0x4d7c2b, roughness: 0.9 });
    const headMoss = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.34), mossMat);
    headMoss.position.set(0.04, headY + 0.26, headZOffset);
    const shoulderTwig = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.025, 0.32, 5),
      new THREE.MeshStandardMaterial({ color: 0x4a3525 })
    );
    shoulderTwig.position.set(0.28, 1.18, 0.04);
    shoulderTwig.rotation.z = -0.45;

    // Dazed open mouth
    const dazedMouth = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.05), darkMouthMat);
    dazedMouth.position.set(0, headY - 0.14, 0.24 + headZOffset);

    group.add(leftArm, rightArm, mapSheet, satchelBag, mug, headMoss, shoulderTwig, dazedMouth);
  } else if (type === 'grinner') {
    // THE GRINNER (zombie-the-grinner.png):
    // - Tall lanky silhouette in dark slate-teal Victorian tailcoat + sage waistcoat + bow tie
    // - Tall Stove-Pipe Top Hat with rust-brown band
    // - Right arm raised high waving hello + huge ear-to-ear toothy smile
    leftArm.position.set(-0.36, 1.38, 0.14);
    leftArm.rotation.x = -Math.PI / 2.3;
    leftArm.rotation.z = 0.22;
    rightArm.position.set(0.34, 0.85, 0.08);
    rightArm.rotation.x = 0.25;

    // Open waving hand at tip of raised arm
    const waveHand = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.08), skinMat);
    waveHand.position.set(-0.42, 1.66, 0.24);

    // Waistcoat + Bow tie + Long split tailcoat flaps
    const vest = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.56, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x5c6e64, roughness: 0.8, flatShading: true })
    );
    vest.position.set(0, 0.78, 0.01);
    const bowTie = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.06), coatMat);
    bowTie.position.set(0, 1.08, 0.22);
    const coattailL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.45, 0.12), coatMat);
    coattailL.position.set(-0.16, 0.36, -0.14);
    coattailL.rotation.x = 0.18;
    const coattailR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.45, 0.12), coatMat);
    coattailR.position.set(0.16, 0.36, -0.14);
    coattailR.rotation.x = 0.18;

    // Huge Toothy Smile (signature expression)
    const smileBg = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.15, 0.05), darkMouthMat);
    smileBg.position.set(0, headY - 0.12, 0.24);
    const teethTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.05, 0.06),
      new THREE.MeshBasicMaterial({ color: 0xfef3c7 })
    );
    teethTop.position.set(0, headY - 0.09, 0.245);
    const teethBot = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.045, 0.06),
      new THREE.MeshBasicMaterial({ color: 0xfef3c7 })
    );
    teethBot.position.set(0, headY - 0.15, 0.245);

    // Tall Slate-Teal Stove-Pipe Top Hat + Rust Ribbon Band
    const topHatMat = new THREE.MeshStandardMaterial({
      color: 0x223c40,
      roughness: 0.65,
      flatShading: true,
    });
    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 10), topHatMat);
    hatBrim.position.set(0, headY + 0.25, 0);
    const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 0.56, 10), topHatMat);
    hatCrown.position.set(0, headY + 0.54, 0);
    const hatBand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.27, 0.26, 0.1, 10),
      new THREE.MeshStandardMaterial({ color: 0x5c3d2e, roughness: 0.8 })
    );
    hatBand.position.set(0, headY + 0.32, 0);

    group.add(
      leftArm,
      rightArm,
      waveHand,
      vest,
      bowTie,
      coattailL,
      coattailR,
      smileBg,
      teethTop,
      teethBot,
      hatBrim,
      hatCrown,
      hatBand
    );
  } else if (type === 'grumble') {
    // OLD GRUMBLE (zombie-old-grumble.png):
    // - Cream & slate-blue vertical striped pajamas
    // - Arms folded tightly across chest shivering in the cold
    // - Full bushy white-grey beard, heavy scowling eyebrows, downturned frown
    // - Long drooping striped nightcap with dangling white pom-pom ball
    leftArm.scale.set(1, 1, 0.85);
    leftArm.position.set(-0.04, 0.82, 0.25);
    leftArm.rotation.y = Math.PI / 2;
    rightArm.scale.set(1, 1, 0.85);
    rightArm.position.set(0.04, 0.76, 0.27);
    rightArm.rotation.y = Math.PI / 2;

    const beardMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.85,
      flatShading: true,
    });
    // Bushy white-grey beard & scowling V-brows
    const beard = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.36, 6), beardMat);
    beard.rotation.x = Math.PI;
    beard.position.set(0, headY - 0.22, 0.18);
    const browL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.055, 0.06), beardMat);
    browL.position.set(-0.12, headY + 0.14, 0.25);
    browL.rotation.z = -0.32;
    const browR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.055, 0.06), beardMat);
    browR.position.set(0.12, headY + 0.14, 0.25);
    browR.rotation.z = 0.32;
    const frown = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.045, 0.06), darkMouthMat);
    frown.position.set(0, headY - 0.12, 0.26);

    // Drooping Striped Nightcap + White Pom-Pom Ball
    const capBase = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.28, 0.22, 8), coatMat);
    capBase.position.set(0, headY + 0.3, 0);
    const capCone = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.56, 8), coatMat);
    capCone.position.set(-0.18, headY + 0.52, -0.04);
    capCone.rotation.z = 0.85;
    const pomPom = new THREE.Mesh(new THREE.DodecahedronGeometry(0.11, 0), beardMat);
    pomPom.position.set(-0.42, headY + 0.38, -0.04);

    group.add(leftArm, rightArm, beard, browL, browR, frown, capBase, capCone, pomPom);
  } else if (type === 'gawp') {
    // GAWP (zombie-gawp.png):
    // - Stuck straddling a wide two-rail wooden fence (2 tall vertical posts with iron bands + 2 wide horizontal split rails)
    // - Arms draped loosely over the top wooden fence rail
    // - Messy dark-green leafy hair + wide goofy buck-toothed grin
    const fenceWoodMat = new THREE.MeshStandardMaterial({
      color: 0x784421,
      roughness: 0.86,
      flatShading: true,
    });
    const ironBandMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.4,
      metalness: 0.75,
    });

    // 2 Tall Vertical Fence Posts on Left & Right
    const postGeo = new THREE.BoxGeometry(0.22, 1.38, 0.22);
    const postL = new THREE.Mesh(postGeo, fenceWoodMat);
    postL.position.set(-0.82, 0.69, 0.22);
    postL.castShadow = true;
    const postR = new THREE.Mesh(postGeo, fenceWoodMat);
    postR.position.set(0.82, 0.69, 0.22);
    postR.castShadow = true;

    // Iron bands on fence posts
    const bandGeo = new THREE.BoxGeometry(0.25, 0.08, 0.25);
    const bandL = new THREE.Mesh(bandGeo, ironBandMat);
    bandL.position.set(-0.82, 1.15, 0.22);
    const bandR = new THREE.Mesh(bandGeo, ironBandMat);
    bandR.position.set(0.82, 1.15, 0.22);

    // 2 Wide Horizontal Split Wooden Fence Rails
    const topRail = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.16, 0.1), fenceWoodMat);
    topRail.position.set(0, 0.96, 0.28);
    topRail.castShadow = true;
    const botRail = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.16, 0.1), fenceWoodMat);
    botRail.position.set(0, 0.52, 0.28);
    botRail.castShadow = true;

    // Gawp's arms draped forward over the top wooden fence rail with dangling hands
    leftArm.position.set(-0.38, 1.02, 0.28);
    leftArm.rotation.x = 0.65;
    rightArm.position.set(0.38, 1.02, 0.28);
    rightArm.rotation.x = 0.65;

    // Leafy green hair tufts + goofy buck-toothed grin
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x2d4f32,
      roughness: 0.85,
      flatShading: true,
    });
    const hairCrown = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.28, 6), hairMat);
    hairCrown.position.set(0, headY + 0.28, 0);
    const goofyMouth = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.11, 0.05), darkMouthMat);
    goofyMouth.position.set(0, headY - 0.13, 0.24);
    const buckTeeth = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.05, 0.06),
      new THREE.MeshBasicMaterial({ color: 0xfef3c7 })
    );
    buckTeeth.position.set(0, headY - 0.1, 0.245);

    group.add(
      postL,
      postR,
      bandL,
      bandR,
      topRail,
      botRail,
      leftArm,
      rightArm,
      hairCrown,
      goofyMouth,
      buckTeeth
    );
  } else if (type === 'brine') {
    // BRINE (zombie-brine.png):
    // - Heavy swamp-logged hulk with leather suspenders, wet seaweed hair, coiled hip rope, and cattail reeds on back
    // - Glowing neon-green toxic slime dripping from mouth, chin, shoulders, and hands
    group.add(leftArm, rightArm);

    const slimeMat = new THREE.MeshStandardMaterial({
      color: 0x4ade80,
      emissive: 0x22c55e,
      emissiveIntensity: 1.4,
      roughness: 0.18,
    });
    // Glowing green slime drool strands from mouth & shoulders
    const mouthSlime1 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.045, 0.34, 6), slimeMat);
    mouthSlime1.position.set(-0.06, headY - 0.26, 0.26 + headZOffset);
    const mouthSlime2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.04, 0.26, 6), slimeMat);
    mouthSlime2.position.set(0.07, headY - 0.22, 0.26 + headZOffset);
    const shoulderSlimeL = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 6), slimeMat);
    shoulderSlimeL.position.set(-0.34, 1.08, 0.06);
    const shoulderSlimeR = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 6), slimeMat);
    shoulderSlimeR.position.set(0.32, 1.06, 0.08);

    // Swamp cattail reeds sticking up from Brine's back
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x3f6212, roughness: 0.85 });
    const cattailMat = new THREE.MeshStandardMaterial({ color: 0x5c381e, roughness: 0.9 });
    [-0.18, 0.14].forEach((rx, idx) => {
      const reedStem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.75, 5), stemMat);
      reedStem.position.set(rx, 1.32, -0.22);
      reedStem.rotation.z = idx === 0 ? 0.22 : -0.15;
      const cattailHead = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, 0.24, 6),
        cattailMat
      );
      cattailHead.position.set(rx + (idx === 0 ? -0.06 : 0.04), 1.62, -0.22);
      cattailHead.rotation.z = reedStem.rotation.z;
      group.add(reedStem, cattailHead);
    });

    // Coiled rope loop on right hip
    const ropeCoil = new THREE.Mesh(
      new THREE.TorusGeometry(0.14, 0.035, 6, 10),
      new THREE.MeshStandardMaterial({ color: 0xa18052, roughness: 0.88 })
    );
    ropeCoil.rotation.y = Math.PI / 2;
    ropeCoil.position.set(-0.36, 0.56, 0.08);

    // Wet seaweed hair cap
    const kelpCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.54, 0.14, 0.52),
      new THREE.MeshStandardMaterial({ color: 0x365928, roughness: 0.8, flatShading: true })
    );
    kelpCap.position.set(0, headY + 0.24, headZOffset);

    group.add(mouthSlime1, mouthSlime2, shoulderSlimeL, shoulderSlimeR, ropeCoil, kelpCap);
  } else if (type === 'baron') {
    // BARON BLIGHT — BOSS (zombie-baron-blight.png):
    // - Jagged Golden Crown over grey hair
    // - Massive dark iron plate armor + huge shoulder pauldrons sprouting Glowing Orange & Cyan-Blue Mushrooms
    // - Flowing tattered crimson-burgundy royal cape & waist tabard
    // - Gnarled Wooden Staff topped with a Spiked White Skull in left hand + raised right claw
    leftArm.position.set(-0.48, 1.26, 0.24);
    leftArm.rotation.x = -Math.PI / 3;
    leftArm.rotation.z = 0.25;
    rightArm.position.set(0.48, 0.96, 0.22);
    group.add(leftArm, rightArm);

    const armorMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.38,
      metalness: 0.72,
      flatShading: true,
    });
    const capeMat = new THREE.MeshStandardMaterial({
      color: 0x6b1d2f,
      roughness: 0.75,
      flatShading: true,
    });
    const goldCrownMat = new THREE.MeshStandardMaterial({
      color: 0xeab308,
      roughness: 0.28,
      metalness: 0.88,
      flatShading: true,
    });
    const orangeMushMat = new THREE.MeshStandardMaterial({
      color: 0xfb923c,
      emissive: 0xea580c,
      emissiveIntensity: 1.5,
      roughness: 0.25,
    });
    const cyanMushMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.6,
      roughness: 0.25,
    });

    // Jagged Golden Crown + Grey Mane
    const crownBand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.26, 0.18, 8),
      goldCrownMat
    );
    crownBand.position.set(0, headY + 0.3, 0);
    for (let p = 0; p < 5; p++) {
      const ca = (p / 5) * Math.PI * 2;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.22, 4), goldCrownMat);
      spike.position.set(Math.cos(ca) * 0.22, headY + 0.46, Math.sin(ca) * 0.22);
      group.add(spike);
    }

    // Massive Armored Pauldrons + Breastplate (tagged isArmorPiece for visual feedback when armor breaks)
    const breastplate = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.62, 0.48), armorMat);
    breastplate.position.set(0, 0.84, 0.02);
    breastplate.userData.isArmorPiece = true;

    const pauldronL = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32, 0), armorMat);
    pauldronL.position.set(-0.54, 1.14, 0.02);
    pauldronL.userData.isArmorPiece = true;
    const pauldronR = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32, 0), armorMat);
    pauldronR.position.set(0.54, 1.14, 0.02);
    pauldronR.userData.isArmorPiece = true;

    // Glowing Orange Toadstools & Cyan-Blue Mushrooms on Pauldrons (canonical signature detail!)
    const mushO1 = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.16, 7), orangeMushMat);
    mushO1.position.set(-0.54, 1.48, 0.04);
    const mushO2 = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.14, 7), orangeMushMat);
    mushO2.position.set(0.52, 1.46, -0.04);
    const mushC1 = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.14, 6), cyanMushMat);
    mushC1.position.set(0.62, 1.36, 0.14);
    const mushC2 = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.12, 6), cyanMushMat);
    mushC2.position.set(-0.64, 1.34, 0.14);

    // Flowing Tattered Crimson-Burgundy Cape & Front Tabard
    const cape = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.12, 0.1), capeMat);
    cape.position.set(-0.08, 0.72, -0.28);
    cape.rotation.x = 0.22;
    cape.rotation.z = 0.12;
    const tabard = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.44, 0.06), capeMat);
    tabard.position.set(0, 0.42, 0.22);

    // Gnarled Wooden Staff + Spiked White Skull in Left Hand (+X side)
    const staffShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.035, 1.65, 6),
      new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.9 })
    );
    staffShaft.position.set(0.58, 0.85, 0.38);
    staffShaft.rotation.z = -0.14;
    const staffSkull = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.18, 0),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.65, flatShading: true })
    );
    staffSkull.position.set(0.68, 1.68, 0.38);
    const skullSpikeTop = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.22, 4), armorMat);
    skullSpikeTop.position.set(0.68, 1.92, 0.38);

    group.add(
      crownBand,
      breastplate,
      pauldronL,
      pauldronR,
      mushO1,
      mushO2,
      mushC1,
      mushC2,
      cape,
      tabard,
      staffShaft,
      staffSkull,
      skullSpikeTop
    );
  } else if (type === 'swift_stumbler') {
    leftArm.rotation.x = 0.45;
    rightArm.rotation.x = -0.35;
    group.add(leftArm, rightArm);

    const bandanaMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xea580c,
      emissiveIntensity: 0.45,
      roughness: 0.5,
      flatShading: true,
    });
    const headband = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.11, 0.54), bandanaMat);
    headband.position.set(0, 1.51, headZOffset);
    const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.48), bandanaMat);
    tailL.position.set(-0.1, 1.48, -0.36 + headZOffset);
    tailL.rotation.x = 0.25;
    tailL.rotation.y = -0.2;
    const tailR = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.48), bandanaMat);
    tailR.position.set(0.1, 1.48, -0.36 + headZOffset);
    tailR.rotation.x = 0.2;
    tailR.rotation.y = 0.2;
    group.add(headband, tailL, tailR);
  } else if (type === 'armored_undead') {
    group.add(leftArm, rightArm);
    const ironPlateMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.28,
      metalness: 0.85,
      flatShading: true,
    });
    const brassTrimMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.3,
      metalness: 0.85,
      flatShading: true,
    });

    const helmBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.52, 0.1, 8), ironPlateMat);
    helmBrim.position.y = 1.56;
    helmBrim.userData.isArmorPiece = true;
    const helmDome = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 0.38, 8), ironPlateMat);
    helmDome.position.y = 1.76;
    helmDome.userData.isArmorPiece = true;
    const helmSpike = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.28, 6), brassTrimMat);
    helmSpike.position.y = 2.04;
    helmSpike.userData.isArmorPiece = true;
    const breastplate = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.58, 0.46), ironPlateMat);
    breastplate.position.y = 0.78;
    breastplate.userData.isArmorPiece = true;
    const pauldronL = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 0), ironPlateMat);
    pauldronL.position.set(-0.44, 1.05, 0.04);
    pauldronL.userData.isArmorPiece = true;
    const pauldronR = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 0), ironPlateMat);
    pauldronR.position.set(0.44, 1.05, 0.04);
    pauldronR.userData.isArmorPiece = true;
    const shieldRim = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.1, 8), ironPlateMat);
    shieldRim.rotation.z = Math.PI / 2;
    shieldRim.position.set(-0.52, 0.86, 0.32);
    shieldRim.userData.isArmorPiece = true;
    const shieldBoss = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.22, 6), brassTrimMat);
    shieldBoss.rotation.z = Math.PI / 2;
    shieldBoss.position.set(-0.62, 0.86, 0.32);
    shieldBoss.userData.isArmorPiece = true;

    group.add(
      helmBrim,
      helmDome,
      helmSpike,
      breastplate,
      pauldronL,
      pauldronR,
      shieldRim,
      shieldBoss
    );
  } else if (type === 'bone_howler') {
    group.add(leftArm, rightArm);
    const hornMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      emissive: 0x14b8a6,
      emissiveIntensity: 0.35,
      roughness: 0.4,
      flatShading: true,
    });
    const hornCone = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.62, 8), hornMat);
    hornCone.rotation.x = -Math.PI / 2;
    hornCone.position.set(0, 1.24, 0.56);
    const hoodCrest = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.45, 6), coatMat);
    hoodCrest.position.set(0, 1.72, -0.04);
    group.add(hornCone, hoodCrest);
  }

  group.scale.setScalar(specScale);
  return group;
}

export function createWoodBridgeModel(): THREE.Group {
  const group = new THREE.Group();
  const beamMat = new THREE.MeshStandardMaterial({
    color: 0x5c3a21,
    roughness: 0.9,
    envMapIntensity: 0.16,
  });
  const plankMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    roughness: 0.86,
    envMapIntensity: 0.18,
  });
  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.45,
    metalness: 0.72,
  });

  // Two longitudinal side support stringers spanning the ditch (along Z)
  const stringerL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 2.75), beamMat);
  stringerL.position.set(-1.55, 0.08, 0);
  stringerL.receiveShadow = true;
  const stringerR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 2.75), beamMat);
  stringerR.position.set(1.55, 0.08, 0);
  stringerR.receiveShadow = true;
  group.add(stringerL, stringerR);

  // 9 weathered horizontal deck planks spanning across the road width
  for (let i = 0; i < 9; i++) {
    const pz = -1.2 + i * 0.3;
    const plank = new THREE.Mesh(new THREE.BoxGeometry(3.35, 0.09, 0.24), plankMat);
    plank.position.set(0, 0.14, pz);
    plank.rotation.y = ((i % 3) - 1) * 0.012;
    plank.castShadow = true;
    plank.receiveShadow = true;
    group.add(plank);
  }

  // 4 corner railing posts & side timber rails
  const postCoords = [
    [-1.62, -1.18],
    [1.62, -1.18],
    [-1.62, 1.18],
    [1.62, 1.18],
  ];
  postCoords.forEach(([px, pz]) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.82, 6), beamMat);
    post.position.set(px, 0.46, pz);
    post.castShadow = true;
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.26), ironMat);
    cap.position.set(px, 0.88, pz);
    group.add(post, cap);
  });

  const railL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.09, 2.5), plankMat);
  railL.position.set(-1.62, 0.72, 0);
  railL.castShadow = true;
  const railR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.09, 2.5), plankMat);
  railR.position.set(1.62, 0.72, 0);
  railR.castShadow = true;
  group.add(railL, railR);

  return group;
}

export function createCornfieldDecorModel(soilTex: THREE.CanvasTexture): THREE.Group {
  const group = new THREE.Group();

  // Raised dark tilled furrow soil bed (8.8m wide x 6.6m deep)
  const bedBase = new THREE.Mesh(
    new THREE.BoxGeometry(9.1, 0.14, 6.9),
    new THREE.MeshStandardMaterial({ color: 0x4b301b, roughness: 0.94, envMapIntensity: 0.14 })
  );
  bedBase.position.y = 0.05;
  bedBase.receiveShadow = true;
  group.add(bedBase);

  const soilTop = new THREE.Mesh(
    new THREE.PlaneGeometry(8.8, 6.6),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: soilTex,
      roughness: 0.92,
      envMapIntensity: 0.12,
    })
  );
  soilTop.rotation.x = -Math.PI / 2;
  soilTop.position.y = 0.125;
  soilTop.receiveShadow = true;
  group.add(soilTop);

  // Raised soil ridges (6 long agricultural rows)
  const ridgeMat = new THREE.MeshStandardMaterial({ color: 0x4f321c, roughness: 0.94 });
  for (let r = 0; r < 6; r++) {
    const rz = -2.35 + r * 0.94;
    const ridge = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.28, 8.2, 6), ridgeMat);
    ridge.rotation.z = Math.PI / 2;
    ridge.scale.set(0.6, 1, 1.3);
    ridge.position.set(0, 0.14, rz);
    ridge.receiveShadow = true;
    group.add(ridge);
  }

  // Rustic wooden split-rail border fencing along back & side edges (leaving front open toward fort)
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.9 });
  const postPositions: [number, number][] = [
    [-4.55, -3.45],
    [-2.28, -3.45],
    [0, -3.45],
    [2.28, -3.45],
    [4.55, -3.45],
    [-4.55, -1.15],
    [-4.55, 1.15],
    [-4.55, 3.45],
    [4.55, -1.15],
    [4.55, 1.15],
    [4.55, 3.45],
  ];
  postPositions.forEach(([px, pz]) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.95, 6), woodMat);
    post.position.set(px, 0.48, pz);
    post.castShadow = true;
    group.add(post);
  });

  // Back top & bottom rails
  [0.74, 0.4].forEach((ry) => {
    const backRail = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.08, 0.09), woodMat);
    backRail.position.set(0, ry, -3.45);
    backRail.castShadow = true;
    const leftRail = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 7.0), woodMat);
    leftRail.position.set(-4.55, ry, 0);
    leftRail.castShadow = true;
    const rightRail = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 7.0), woodMat);
    rightRail.position.set(4.55, ry, 0);
    rightRail.castShadow = true;
    group.add(backRail, leftRail, rightRail);
  });

  // Spooky-Cute Scarecrow in the center-back of the cornfield
  const scarecrow = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.35, 6), woodMat);
  pole.position.y = 1.18;
  pole.castShadow = true;
  const crossArm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.65, 6), woodMat);
  crossArm.rotation.z = Math.PI / 2;
  crossArm.position.y = 1.65;
  crossArm.castShadow = true;
  const coat = new THREE.Mesh(
    new THREE.ConeGeometry(0.45, 0.98, 7),
    new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.85, flatShading: true })
  );
  coat.position.y = 1.38;
  coat.castShadow = true;
  const pumpkinHead = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.28, 1),
    new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xea580c,
      emissiveIntensity: 0.35,
      roughness: 0.55,
    })
  );
  pumpkinHead.position.y = 2.08;
  pumpkinHead.castShadow = true;
  const strawHatBrim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.54, 0.06, 10),
    new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.82 })
  );
  strawHatBrim.position.y = 2.3;
  const strawHatTop = new THREE.Mesh(
    new THREE.ConeGeometry(0.3, 0.42, 10),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.82 })
  );
  strawHatTop.position.y = 2.52;
  scarecrow.add(pole, crossArm, coat, pumpkinHead, strawHatBrim, strawHatTop);
  scarecrow.position.set(0.2, 0.1, -0.4);
  group.add(scarecrow);

  // Two overflow corn crates near the front edge of the cornfield
  const crateMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.86 });
  const cobMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xca8a04,
    emissiveIntensity: 0.25,
    roughness: 0.48,
  });
  [-2.8, 2.9].forEach((cx) => {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.52, 0.65), crateMat);
    crate.position.set(cx, 0.36, 3.05);
    crate.castShadow = true;
    group.add(crate);
    for (let c = 0; c < 4; c++) {
      const cob = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.42, 7), cobMat);
      cob.rotation.z = Math.PI / 2 + (c % 2 === 0 ? 0.2 : -0.2);
      cob.rotation.y = c * 0.6;
      cob.position.set(cx + (c - 1.5) * 0.14, 0.65, 3.05 + ((c % 2) - 0.5) * 0.14);
      group.add(cob);
    }
  });

  return group;
}

export function createResourceNodeModel(type: ResourceType): THREE.Group {
  const group = new THREE.Group();
  group.add(createContactShadow(1.25));

  // Unmistakable subtle glowing ground ring to distinguish interactive nodes from decorative forest props
  const ringColor =
    type === 'wood' ? 0xf59e0b : type === 'stone' ? 0x93c5fd : 0xfacc15;
  const beaconRing = new THREE.Mesh(
    new THREE.RingGeometry(1.02, 1.2, 24).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      color: ringColor,
      transparent: true,
      opacity: 0.68,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  beaconRing.position.y = 0.045;
  group.add(beaconRing);

  if (type === 'wood') {
    // Unmistakable Woodcutter's Stacked Timber Pile + Chopping Stump with Embedded Axe (no pine tree camouflage)
    const barkMat = new THREE.MeshStandardMaterial({
      color: 0x7c4a26,
      roughness: 0.88,
      envMapIntensity: 0.18,
    });
    const heartwoodMat = new THREE.MeshStandardMaterial({
      color: 0xfde68a,
      emissive: 0xd97706,
      emissiveIntensity: 0.16,
      roughness: 0.62,
      envMapIntensity: 0.2,
    });
    const ironMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.28,
      metalness: 0.85,
    });

    // Pyramid stack of 3 horizontal cut logs with bright golden cut ends
    const logCoords: [number, number, number][] = [
      [-0.2, 0.22, 0.12],
      [0.24, 0.22, 0.16],
      [0.02, 0.55, 0.14],
    ];
    logCoords.forEach(([lx, ly, lz]) => {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.23, 1.38, 8), barkMat);
      log.rotation.x = Math.PI / 2;
      log.rotation.z = 0.18;
      log.position.set(lx, ly, lz);
      log.castShadow = true;
      group.add(log);

      const capFront = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.04, 8), heartwoodMat);
      capFront.rotation.x = Math.PI / 2;
      capFront.rotation.z = 0.18;
      capFront.position.set(lx - Math.sin(0.18) * 0.68, ly, lz + Math.cos(0.18) * 0.68);
      group.add(capFront);

      const capBack = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.04, 8), heartwoodMat);
      capBack.rotation.x = Math.PI / 2;
      capBack.rotation.z = 0.18;
      capBack.position.set(lx + Math.sin(0.18) * 0.68, ly, lz - Math.cos(0.18) * 0.68);
      group.add(capBack);
    });

    // Thick chopping stump + embedded woodcutter axe
    const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.6, 0.66, 9), barkMat);
    stump.position.set(-0.56, 0.33, -0.34);
    stump.castShadow = true;
    const stumpTop = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.05, 9), heartwoodMat);
    stumpTop.position.set(-0.56, 0.67, -0.34);
    const axeHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.06, 0.78, 6),
      new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.75 })
    );
    axeHandle.position.set(-0.48, 1.0, -0.26);
    axeHandle.rotation.z = -0.36;
    axeHandle.rotation.x = 0.2;
    const axeBlade = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.07), ironMat);
    axeBlade.position.set(-0.56, 0.76, -0.32);
    axeBlade.rotation.z = -0.36;
    group.add(stump, stumpTop, axeHandle, axeBlade);
  } else if (type === 'stone') {
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.84,
      metalness: 0.14,
      envMapIntensity: 0.24,
      flatShading: true,
    });
    const darkRockMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.9,
      metalness: 0.1,
      envMapIntensity: 0.18,
      flatShading: true,
    });
    const quartzMat = new THREE.MeshStandardMaterial({
      color: 0xbae6fd,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.25,
      roughness: 0.25,
      metalness: 0.2,
    });
    const r1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.72, 0), rockMat);
    r1.position.set(-0.15, 0.46, 0);
    r1.scale.set(1.18, 0.88, 1.05);
    r1.castShadow = true;
    const r2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.52, 0), darkRockMat);
    r2.position.set(0.48, 0.34, 0.28);
    r2.castShadow = true;
    const r3 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4, 0), rockMat);
    r3.position.set(0.18, 0.28, -0.44);
    r3.castShadow = true;
    const shard1 = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.56, 5), quartzMat);
    shard1.position.set(-0.18, 0.98, 0.08);
    shard1.rotation.z = 0.22;
    const shard2 = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.42, 5), quartzMat);
    shard2.position.set(0.16, 0.78, -0.15);
    shard2.rotation.z = -0.28;
    group.add(r1, r2, r3, shard1, shard2);
  } else {
    // Food: Unmistakable Golden Corn & Crimson Apple Harvest Stand (high contrast against green turf)
    const crateWoodMat = new THREE.MeshStandardMaterial({
      color: 0x92400e,
      roughness: 0.85,
      envMapIntensity: 0.16,
    });
    const goldenCornMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xca8a04,
      emissiveIntensity: 0.28,
      roughness: 0.45,
    });
    const huskMat = new THREE.MeshStandardMaterial({
      color: 0x65a30d,
      roughness: 0.72,
    });
    const appleMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xb91c1c,
      emissiveIntensity: 0.3,
      roughness: 0.32,
    });

    // Rustic wooden harvest crate filled with bright red apples
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.52, 0.74), crateWoodMat);
    crate.position.set(-0.18, 0.28, 0.16);
    crate.rotation.y = 0.25;
    crate.castShadow = true;
    group.add(crate);

    const appleCoords: [number, number, number][] = [
      [-0.36, 0.62, 0.04],
      [-0.14, 0.65, 0.24],
      [0.06, 0.61, 0.08],
      [-0.24, 0.74, 0.14],
      [-0.04, 0.73, 0.22],
      [-0.32, 0.61, 0.32],
    ];
    appleCoords.forEach(([ax, ay, az]) => {
      const apple = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), appleMat);
      apple.position.set(ax, ay, az);
      apple.castShadow = true;
      group.add(apple);
    });

    // Tall bright golden Corn Stalks & Golden Ears of Corn standing beside the crate
    const cobCoords: [number, number, number, number][] = [
      [0.44, 0.64, -0.18, 0.12],
      [0.62, 0.56, 0.14, -0.18],
      [0.24, 0.72, -0.34, 0.06],
    ];
    cobCoords.forEach(([cx, cy, cz, tilt]) => {
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.35, 6), huskMat);
      stalk.position.set(cx, 0.68, cz);
      stalk.rotation.z = tilt;
      stalk.castShadow = true;

      const cob = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.48, 8), goldenCornMat);
      cob.position.set(cx + tilt * 0.25, cy + 0.15, cz + 0.08);
      cob.rotation.z = tilt - 0.35;
      cob.castShadow = true;

      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.52, 4), huskMat);
      leaf.position.set(cx - 0.12, cy + 0.08, cz);
      leaf.rotation.z = 0.75;
      group.add(stalk, cob, leaf);
    });
  }

  return group;
}

