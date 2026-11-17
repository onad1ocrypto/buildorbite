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
}

export function createRangerRueModel(): RueRig {
  const group = new THREE.Group();
  group.add(createContactShadow(0.9));

  // Canonical palette from hero-ranger-rue.png
  const coatGreenMat = new THREE.MeshStandardMaterial({
    color: 0x2d5a36,
    roughness: 0.78,
    metalness: 0.06,
    flatShading: true,
  });
  const vestLeatherMat = new THREE.MeshStandardMaterial({
    color: 0x784421,
    roughness: 0.76,
    metalness: 0.1,
    flatShading: true,
  });
  const bootBrownMat = new THREE.MeshStandardMaterial({
    color: 0x5c381e,
    roughness: 0.82,
    metalness: 0.08,
    flatShading: true,
  });
  const hatTanMat = new THREE.MeshStandardMaterial({
    color: 0x6b583f,
    roughness: 0.8,
    metalness: 0.06,
    flatShading: true,
  });
  const darkBandMat = new THREE.MeshStandardMaterial({
    color: 0x3d291a,
    roughness: 0.85,
    flatShading: true,
  });
  const gingerHairMat = new THREE.MeshStandardMaterial({
    color: 0xc2410c,
    roughness: 0.68,
    metalness: 0.05,
    flatShading: true,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xf4c29f,
    roughness: 0.62,
    metalness: 0.04,
    flatShading: true,
  });
  const silverBadgeMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.28,
    metalness: 0.85,
    flatShading: true,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.3,
    metalness: 0.82,
    flatShading: true,
  });
  const bedrollMat = new THREE.MeshStandardMaterial({
    color: 0xd6ccb8,
    roughness: 0.82,
    flatShading: true,
  });
  const lanternGlowMat = new THREE.MeshStandardMaterial({
    color: 0xffedd5,
    emissive: 0xff8c1a,
    emissiveIntensity: 2.5,
    roughness: 0.18,
  });

  // 1. Sturdy Laced Brown Hiking Boots & Stocky Green Trousers
  const bootGeo = new THREE.BoxGeometry(0.3, 0.26, 0.42);
  const leftBoot = new THREE.Mesh(bootGeo, bootBrownMat);
  leftBoot.position.set(-0.21, 0.13, 0.04);
  leftBoot.castShadow = true;
  const rightBoot = new THREE.Mesh(bootGeo, bootBrownMat);
  rightBoot.position.set(0.21, 0.13, 0.04);
  rightBoot.castShadow = true;

  const legGeo = new THREE.CylinderGeometry(0.14, 0.15, 0.26, 7);
  const leftLeg = new THREE.Mesh(legGeo, coatGreenMat);
  leftLeg.position.set(-0.21, 0.32, 0);
  const rightLeg = new THREE.Mesh(legGeo, coatGreenMat);
  rightLeg.position.set(0.21, 0.32, 0);
  group.add(leftBoot, rightBoot, leftLeg, rightLeg);

  // 2. Stocky Forest-Green Ranger Coat + Brown Multi-Buckle Leather Utility Vest
  const coatHem = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.54, 0.42, 8), coatGreenMat);
  coatHem.position.y = 0.52;
  coatHem.castShadow = true;

  const vestTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.48, 0.56, 8), vestLeatherMat);
  vestTorso.position.y = 0.8;
  vestTorso.castShadow = true;

  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.42, 0.16, 8), coatGreenMat);
  collar.position.y = 1.06;
  group.add(coatHem, vestTorso, collar);

  // 3 Horizontal Chest Straps + Brass Buckles + Utility Belt + Pocket Compass on Left Hip
  for (let s = 0; s < 3; s++) {
    const sy = 0.66 + s * 0.13;
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.045, 0.06), darkBandMat);
    strap.position.set(0, sy, 0.45);
    const tinyBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.07), silverBadgeMat);
    tinyBuckle.position.set(0, sy, 0.46);
    group.add(strap, tinyBuckle);
  }

  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.49, 0.5, 0.13, 8), darkBandMat);
  belt.position.y = 0.52;
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.15, 0.08), silverBadgeMat);
  buckle.position.set(0, 0.52, 0.48);
  const pouchL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.14), vestLeatherMat);
  pouchL.position.set(-0.34, 0.52, 0.36);
  const pouchR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.14), vestLeatherMat);
  pouchR.position.set(0.34, 0.52, 0.36);

  // Hanging Round Pocket Compass (signature prop from hero-ranger-rue.png)
  const compassCase = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.05, 10), brassMat);
  compassCase.rotation.x = Math.PI / 2;
  compassCase.position.set(0.18, 0.39, 0.49);
  const compassDial = new THREE.Mesh(
    new THREE.CircleGeometry(0.085, 10),
    new THREE.MeshBasicMaterial({ color: 0xf8fafc })
  );
  compassDial.position.set(0.18, 0.39, 0.52);
  const compassNeedle = new THREE.Mesh(
    new THREE.BoxGeometry(0.025, 0.09, 0.01),
    new THREE.MeshBasicMaterial({ color: 0xdc2626 })
  );
  compassNeedle.position.set(0.18, 0.39, 0.525);
  compassNeedle.rotation.z = -0.4;
  group.add(belt, buckle, pouchL, pouchR, compassCase, compassDial, compassNeedle);

  // 4. Expedition Backpack + Rolled Cream-Beige Sleeping Mat on Top
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.58, 0.36), bootBrownMat);
  pack.position.set(0, 0.74, -0.42);
  pack.castShadow = true;
  const bedroll = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.64, 10), bedrollMat);
  bedroll.rotation.z = Math.PI / 2;
  bedroll.position.set(0, 1.12, -0.4);
  bedroll.castShadow = true;
  const bedrollSpiralL = new THREE.Mesh(new THREE.CircleGeometry(0.11, 8), darkBandMat);
  bedrollSpiralL.rotation.y = -Math.PI / 2;
  bedrollSpiralL.position.set(-0.325, 1.12, -0.4);
  const bedrollSpiralR = new THREE.Mesh(new THREE.CircleGeometry(0.11, 8), darkBandMat);
  bedrollSpiralR.rotation.y = Math.PI / 2;
  bedrollSpiralR.position.set(0.325, 1.12, -0.4);
  group.add(pack, bedroll, bedrollSpiralL, bedrollSpiralR);

  // 5. Expressive Head + Spiky Ginger-Red Hair + Tan Pinched-Crown Ranger Hat with Shield Badge
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.32, 0);

  const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4, 1), skinMat);
  head.castShadow = true;
  headGroup.add(head);

  // Big dark-brown expressive eyes with white sclera & cheerful smile
  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const irisBrownMat = new THREE.MeshBasicMaterial({ color: 0x291811 });
  const eyeGeo = new THREE.SphereGeometry(0.115, 8, 8);
  const pupilGeo = new THREE.SphereGeometry(0.068, 8, 8);

  const leftEye = new THREE.Mesh(eyeGeo, eyeWhiteMat);
  leftEye.position.set(-0.14, 0.03, 0.32);
  const rightEye = new THREE.Mesh(eyeGeo, eyeWhiteMat);
  rightEye.position.set(0.14, 0.03, 0.32);

  const leftPupil = new THREE.Mesh(pupilGeo, irisBrownMat);
  leftPupil.position.set(-0.14, 0.03, 0.39);
  const rightPupil = new THREE.Mesh(pupilGeo, irisBrownMat);
  rightPupil.position.set(0.14, 0.03, 0.39);

  const smileMouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.045, 0.04),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  smileMouth.position.set(0, -0.14, 0.36);

  // Thick auburn eyebrows
  const browGeo = new THREE.BoxGeometry(0.16, 0.05, 0.06);
  const leftBrow = new THREE.Mesh(browGeo, gingerHairMat);
  leftBrow.position.set(-0.15, 0.18, 0.35);
  leftBrow.rotation.z = 0.12;
  const rightBrow = new THREE.Mesh(browGeo, gingerHairMat);
  rightBrow.position.set(0.15, 0.18, 0.35);
  rightBrow.rotation.z = -0.12;

  // Spiky Ginger-Red / Auburn Hair framing temples, cheeks, and back
  const hairSpikeGeo = new THREE.ConeGeometry(0.15, 0.34, 5);
  const hairOffsets: [number, number, number, number, number][] = [
    [-0.36, 0.08, 0.12, 0.2, 0.65],
    [-0.38, -0.06, 0.02, 0.1, 0.85],
    [0.36, 0.08, 0.12, 0.2, -0.65],
    [0.38, -0.06, 0.02, 0.1, -0.85],
    [-0.1, 0.22, 0.32, 0.6, 0.25],
    [0.08, 0.22, 0.32, 0.6, -0.2],
    [0, 0.05, -0.36, -0.5, 0],
  ];
  hairOffsets.forEach(([hx, hy, hz, rx, rz]) => {
    const spike = new THREE.Mesh(hairSpikeGeo, gingerHairMat);
    spike.position.set(hx, hy, hz);
    spike.rotation.set(rx, 0, rz);
    headGroup.add(spike);
  });

  // Tan-Olive Ranger Campaign Hat + Dark Brown Band + Silver Ranger Shield Badge
  const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.74, 0.76, 0.06, 12), hatTanMat);
  hatBrim.position.y = 0.26;
  hatBrim.castShadow = true;
  const hatBand = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.44, 0.09, 10), darkBandMat);
  hatBand.position.y = 0.32;
  const hatCrown = new THREE.Mesh(new THREE.ConeGeometry(0.44, 0.46, 6), hatTanMat);
  hatCrown.position.y = 0.53;
  hatCrown.castShadow = true;
  const hatBadge = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.16, 0.05), silverBadgeMat);
  hatBadge.position.set(0, 0.45, 0.36);
  hatBadge.rotation.x = -0.45;

  headGroup.add(
    leftEye,
    rightEye,
    leftPupil,
    rightPupil,
    smileMouth,
    leftBrow,
    rightBrow,
    hatBrim,
    hatBand,
    hatCrown,
    hatBadge
  );
  group.add(headGroup);

  // 6. Left Arm (+X side) + Faceted Wooden Mallet / Hammer
  const leftArm = new THREE.Group();
  leftArm.position.set(0.54, 0.94, 0);
  const leftSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.44, 0.24), coatGreenMat);
  leftSleeve.position.set(0, -0.15, 0.1);
  leftSleeve.rotation.x = -Math.PI / 5;

  const hammerShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.74, 7), darkBandMat);
  hammerShaft.position.set(0, -0.18, 0.32);
  hammerShaft.rotation.x = Math.PI / 2.6;

  // Faceted Wooden Mallet Head matching hero-ranger-rue.png
  const malletGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.44, 6);
  malletGeo.rotateZ(Math.PI / 2);
  const hammerHead = new THREE.Mesh(malletGeo, bootBrownMat);
  hammerHead.position.set(0, 0.02, 0.62);
  hammerHead.castShadow = true;
  leftArm.add(leftSleeve, hammerShaft, hammerHead);
  group.add(leftArm);

  // 7. Right Arm (-X side) + Oversized Warm Brass Hurricane Lantern
  const rightArm = new THREE.Group();
  rightArm.position.set(-0.54, 0.94, 0);
  const rightSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.44, 0.24), coatGreenMat);
  rightSleeve.position.set(0, -0.12, 0.18);
  rightSleeve.rotation.x = -Math.PI / 3.2;

  const lanternGroup = new THREE.Group();
  lanternGroup.position.set(0, -0.34, 0.44);
  const lanternHandle = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.02, 6, 10, Math.PI), brassMat);
  lanternHandle.position.y = 0.22;
  const lanternCap = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.18, 8), brassMat);
  lanternCap.position.y = 0.18;
  const lanternCore = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.3, 8), lanternGlowMat);
  const lanternBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.21, 0.09, 8), brassMat);
  lanternBase.position.y = -0.18;
  lanternGroup.add(lanternHandle, lanternCap, lanternCore, lanternBase);
  rightArm.add(rightSleeve, lanternGroup);
  group.add(rightArm);

  return {
    group,
    leftArm,
    rightArm,
    headGroup,
    lanternMesh: lanternCore,
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
  const baseMat = new THREE.MeshStandardMaterial({
    color: ring === 'inner' ? 0x334155 : 0x3f3f46,
    roughness: 0.85,
    metalness: 0.15,
    flatShading: true,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.4,
    metalness: 0.5,
    flatShading: true,
  });

  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.5, 0.16, 8), baseMat);
  disc.position.y = 0.08;
  disc.receiveShadow = true;
  group.add(disc);

  const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(1.22, 0.06, 6, 8), rimMat);
  ringMesh.rotation.x = Math.PI / 2;
  ringMesh.position.y = 0.17;
  group.add(ringMesh);

  // Corner pegs
  const pegGeo = new THREE.BoxGeometry(0.16, 0.28, 0.16);
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const peg = new THREE.Mesh(pegGeo, baseMat);
    peg.position.set(Math.cos(angle) * 1.25, 0.18, Math.sin(angle) * 1.25);
    group.add(peg);
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
    color: 0x475569,
    roughness: 0.88,
    metalness: 0.14,
    flatShading: true,
  });
  const woodMat = new THREE.MeshStandardMaterial({
    color: segment.level === 2 ? 0x6b2f14 : 0x7c4a27,
    roughness: 0.8,
    metalness: 0.1,
    flatShading: true,
  });
  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x4a2c16,
    roughness: 0.85,
    metalness: 0.1,
    flatShading: true,
  });
  const metalMat = new THREE.MeshStandardMaterial({
    color: segment.level === 2 ? 0xf59e0b : 0x64748b,
    roughness: 0.35,
    metalness: 0.82,
    flatShading: true,
  });
  const guideMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xd97706,
    emissiveIntensity: 0.65,
    roughness: 0.4,
    flatShading: true,
  });

  // Clickable foundation base strip along segment span
  const basePlate = new THREE.Mesh(new THREE.BoxGeometry(len - 0.18, 0.14, 0.72), stoneMat);
  basePlate.position.y = 0.07;
  basePlate.receiveShadow = true;
  group.add(basePlate);

  if (segment.level === 0) {
    // Stage 0: Foundation stakes + amber guideline + partial progressive logs according to buildProgress
    const stakeGeo = new THREE.CylinderGeometry(0.11, 0.14, 0.52, 6);
    const numStakes = 11;
    const builtCount = Math.floor(segment.buildProgress * numStakes);

    const logGeo = new THREE.CylinderGeometry(0.16, 0.19, 1.5, 6);
    const tipGeo = new THREE.ConeGeometry(0.17, 0.34, 6);

    for (let i = 0; i < numStakes; i++) {
      const lx = -len * 0.44 + (i / (numStakes - 1)) * (len * 0.88);
      if (i < builtCount) {
        // Assembled log!
        const log = new THREE.Mesh(logGeo, woodMat);
        log.position.set(lx, 0.78, 0);
        log.castShadow = true;
        const tip = new THREE.Mesh(tipGeo, woodMat);
        tip.position.set(lx, 1.68, 0);
        group.add(log, tip);
      } else {
        // Unbuilt short foundation peg
        const stake = new THREE.Mesh(stakeGeo, darkWoodMat);
        stake.position.set(lx, 0.28, 0);
        group.add(stake);
      }
    }

    // Amber survey rope / build marker bar connecting the stakes
    const rope = new THREE.Mesh(new THREE.BoxGeometry(len - 0.4, 0.07, 0.08), guideMat);
    rope.position.set(0, 0.46, 0);
    group.add(rope);
    return group;
  }

  // Level 1 or Level 2 Built Fence / Gate
  if (segment.isGate) {
    // Fortified Trail Gate across the road (center span has double gate doors + overhead arch beam)
    const gatePostGeo = new THREE.BoxGeometry(0.46, 2.35, 0.46);
    const leftPost = new THREE.Mesh(gatePostGeo, darkWoodMat);
    leftPost.position.set(-1.55, 1.18, 0);
    leftPost.castShadow = true;
    const rightPost = new THREE.Mesh(gatePostGeo, darkWoodMat);
    rightPost.position.set(1.55, 1.18, 0);
    rightPost.castShadow = true;

    const topBeam = new THREE.Mesh(new THREE.BoxGeometry(3.75, 0.32, 0.54), darkWoodMat);
    topBeam.position.set(0, 2.38, 0);
    topBeam.castShadow = true;
    group.add(leftPost, rightPost, topBeam);

    // Double wooden gate doors in center
    const doorHalfGeo = new THREE.BoxGeometry(1.38, 1.38, 0.2);
    const doorL = new THREE.Mesh(doorHalfGeo, woodMat);
    doorL.position.set(-0.74, 0.78, 0);
    doorL.castShadow = true;
    const doorR = new THREE.Mesh(doorHalfGeo, woodMat);
    doorR.position.set(0.74, 0.78, 0);
    doorR.castShadow = true;
    const crossBrace = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.16, 0.26), metalMat);
    crossBrace.position.set(0, 0.85, 0);
    group.add(doorL, doorR, crossBrace);

    // Flanking palisade logs on both sides of the gate posts
    const logGeo = new THREE.CylinderGeometry(0.17, 0.2, 1.65, 6);
    const tipGeo = new THREE.ConeGeometry(0.18, 0.38, 6);
    [-2.78, -2.38, -1.98, 1.98, 2.38, 2.78].forEach((lx) => {
      const log = new THREE.Mesh(logGeo, woodMat);
      log.position.set(lx, 0.85, 0);
      log.castShadow = true;
      const tip = new THREE.Mesh(tipGeo, segment.level === 2 ? metalMat : woodMat);
      tip.position.set(lx, 1.84, 0);
      group.add(log, tip);
    });
  } else {
    // Solid Square Perimeter Palisade Wall Segment (13 sharpened vertical timber logs + 2 crossbeams)
    const logGeo = new THREE.CylinderGeometry(0.17, 0.21, 1.68, 6);
    const tipGeo = new THREE.ConeGeometry(0.18, 0.38, 6);
    const numLogs = 13;
    for (let i = 0; i < numLogs; i++) {
      const lx = -len * 0.45 + (i / (numLogs - 1)) * (len * 0.9);
      const zJitter = (i % 2 === 0 ? 1 : -1) * 0.04;
      const hScale = 0.94 + ((i * 7) % 3) * 0.05;
      const log = new THREE.Mesh(logGeo, woodMat);
      log.position.set(lx, 0.84 * hScale, zJitter);
      log.scale.set(1, hScale, 1);
      log.castShadow = true;
      const tip = new THREE.Mesh(tipGeo, segment.level === 2 ? metalMat : woodMat);
      tip.position.set(lx, 1.82 * hScale, zJitter);
      group.add(log, tip);
    }

    const railLow = new THREE.Mesh(new THREE.BoxGeometry(len - 0.24, 0.18, 0.38), darkWoodMat);
    railLow.position.set(0, 0.58, 0);
    const railHigh = new THREE.Mesh(new THREE.BoxGeometry(len - 0.24, 0.18, 0.38), darkWoodMat);
    railHigh.position.set(0, 1.24, 0);
    group.add(railLow, railHigh);
  }

  // Level 2 Upgrade: Outward-pointing Ironbark Spikes on both faces
  if (segment.level === 2) {
    const spikeGeo = new THREE.ConeGeometry(0.11, 0.58, 5);
    for (let i = -3; i <= 3; i++) {
      const sx = i * 0.78;
      const spFront = new THREE.Mesh(spikeGeo, metalMat);
      spFront.position.set(sx, 0.72, 0.38);
      spFront.rotation.x = Math.PI / 3;
      const spBack = new THREE.Mesh(spikeGeo, metalMat);
      spBack.position.set(sx, 0.72, -0.38);
      spBack.rotation.x = -Math.PI / 3;
      group.add(spFront, spBack);
    }
  }

  return group;
}

export function createCornfieldPatch(x = 17, z = -15): THREE.Group {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const soil = new THREE.Mesh(
    new THREE.PlaneGeometry(7.2, 5.8),
    new THREE.MeshStandardMaterial({ color: 0x49351f, roughness: 0.98, flatShading: true })
  );
  soil.rotation.x = -Math.PI / 2;
  soil.position.y = 0.035;
  soil.receiveShadow = true;
  group.add(soil);

  const furrowMat = new THREE.MeshStandardMaterial({ color: 0x302519, roughness: 1, flatShading: true });
  for (let row = 0; row < 6; row++) {
    const furrow = new THREE.Mesh(new THREE.BoxGeometry(6.65, 0.025, 0.11), furrowMat);
    furrow.position.set(0, 0.052, -2.25 + row * 0.9);
    group.add(furrow);
  }

  const stalkMat = new THREE.MeshStandardMaterial({ color: 0x607b2d, roughness: 0.82, flatShading: true });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x78983a, roughness: 0.78, flatShading: true });
  const cobMat = new THREE.MeshStandardMaterial({ color: 0xe8b943, roughness: 0.72, flatShading: true });
  const stalkGeometry = new THREE.CylinderGeometry(0.055, 0.095, 1.45, 5);
  const stalks = new THREE.InstancedMesh(stalkGeometry, stalkMat, 36);
  const leafGeometry = new THREE.ConeGeometry(0.105, 0.86, 4);
  const leaves = new THREE.InstancedMesh(leafGeometry, leafMat, 72);
  const cobGeometry = new THREE.CylinderGeometry(0.055, 0.075, 0.28, 5);
  const cobs = new THREE.InstancedMesh(cobGeometry, cobMat, 36);
  const dummy = new THREE.Object3D();
  let plantIndex = 0;
  let leafIndex = 0;
  let cobIndex = 0;

  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      const px = -2.65 + col * 1.06;
      const pz = -2.25 + row * 0.9;
      const height = 0.9 + ((row * 7 + col * 11) % 5) * 0.055;

      dummy.position.set(px, 0.73 * height, pz);
      dummy.rotation.set(0, ((row * 3 + col) % 8) * 0.42, 0);
      dummy.scale.set(1, height, 1);
      dummy.updateMatrix();
      stalks.setMatrixAt(plantIndex++, dummy.matrix);

      for (const side of [-1, 1]) {
        dummy.position.set(px + side * 0.22, 0.78 * height, pz);
        dummy.rotation.set(0, ((row + col) % 4) * 0.5, -side * 1.12);
        dummy.scale.set(1, height, 1);
        dummy.updateMatrix();
        leaves.setMatrixAt(leafIndex++, dummy.matrix);
      }

      dummy.position.set(px + 0.12, 0.86 * height, pz + 0.04);
      dummy.rotation.set(0, 0, 0.38);
      dummy.scale.set(1, height, 1);
      dummy.updateMatrix();
      cobs.setMatrixAt(cobIndex++, dummy.matrix);
    }
  }
  stalks.castShadow = true;
  leaves.castShadow = true;
  cobs.castShadow = true;
  stalks.instanceMatrix.needsUpdate = true;
  leaves.instanceMatrix.needsUpdate = true;
  cobs.instanceMatrix.needsUpdate = true;
  stalks.computeBoundingSphere();
  leaves.computeBoundingSphere();
  cobs.computeBoundingSphere();
  group.add(stalks, leaves, cobs);

  const borderMat = new THREE.MeshStandardMaterial({ color: 0x63452a, roughness: 0.9, flatShading: true });
  const longBorder = new THREE.BoxGeometry(7.35, 0.18, 0.14);
  const shortBorder = new THREE.BoxGeometry(0.14, 0.18, 5.95);
  for (const edgeZ of [-2.96, 2.96]) {
    const edge = new THREE.Mesh(longBorder, borderMat);
    edge.position.set(0, 0.09, edgeZ);
    group.add(edge);
  }
  for (const edgeX of [-3.66, 3.66]) {
    const edge = new THREE.Mesh(shortBorder, borderMat);
    edge.position.set(edgeX, 0.09, 0);
    group.add(edge);
  }

  group.traverse((child) => {
    if ((child as THREE.Mesh).isMesh || (child as THREE.InstancedMesh).isInstancedMesh) {
      child.userData = { kind: 'cornfield' };
    }
  });
  return group;
}

export function createBuildingModel(
  type: BuildingType,
  upgradePath: UpgradePathId
): THREE.Group {
  const group = new THREE.Group();
  group.add(createContactShadow(1.35));

  const woodMat = new THREE.MeshStandardMaterial({
    color: upgradePath === 'pathA' ? 0x7c2d12 : upgradePath === 'pathB' ? 0x365314 : 0x78472a,
    roughness: 0.8,
    metalness: 0.12,
    flatShading: true,
  });
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.85,
    metalness: 0.15,
    flatShading: true,
  });
  const metalMat = new THREE.MeshStandardMaterial({
    color: upgradePath === 'pathA' ? 0xf59e0b : upgradePath === 'pathB' ? 0x38bdf8 : 0x94a3b8,
    roughness: 0.3,
    metalness: 0.82,
    flatShading: true,
  });
  const greenMat = new THREE.MeshStandardMaterial({
    color: 0x2d6a4f,
    roughness: 0.72,
    metalness: 0.1,
    flatShading: true,
  });

  if (type === 'palisade') {
    // Long palisade wall segment: 9 sharpened stakes + crossbar + iron spikes
    const logGeo = new THREE.CylinderGeometry(0.16, 0.2, 1.55, 6);
    const tipGeo = new THREE.ConeGeometry(0.17, 0.38, 6);
    for (let i = -4; i <= 4; i++) {
      const log = new THREE.Mesh(logGeo, woodMat);
      log.position.set(i * 0.33, 0.78, (i % 2) * 0.08);
      log.castShadow = true;
      const tip = new THREE.Mesh(tipGeo, upgradePath ? metalMat : woodMat);
      tip.position.set(i * 0.33, 1.72, (i % 2) * 0.08);
      group.add(log, tip);
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.22, 0.45), stoneMat);
    beam.position.set(0, 0.65, 0);
    group.add(beam);
  } else if (type === 'watchtower') {
    // 4 stilts + elevated platform + roof + crossbow turret
    const legGeo = new THREE.CylinderGeometry(0.1, 0.14, 2.1, 6);
    [
      [-0.6, 1.05, -0.6],
      [0.6, 1.05, -0.6],
      [-0.6, 1.05, 0.6],
      [0.6, 1.05, 0.6],
    ].forEach(([lx, ly, lz]) => {
      const leg = new THREE.Mesh(legGeo, woodMat);
      leg.position.set(lx, ly, lz);
      leg.castShadow = true;
      group.add(leg);
    });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.24, 1.65), woodMat);
    deck.position.y = 2.1;
    deck.castShadow = true;
    const rail = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.45, 1.75), greenMat);
    rail.position.y = 2.4;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.35, 1.0, 4), metalMat);
    roof.position.y = 3.35;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    group.add(deck, rail, roof);
  } else if (type === 'spiketrap') {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.18, 1.85), woodMat);
    frame.position.y = 0.12;
    group.add(frame);
    const spikeGeo = new THREE.ConeGeometry(0.14, 0.68, 5);
    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
        const sp = new THREE.Mesh(spikeGeo, metalMat);
        sp.position.set(x * 0.52, 0.48, z * 0.52);
        group.add(sp);
      }
    }
  } else if (type === 'campfire') {
    // Circle of stones + crisscrossed logs + glowing multi-layered flame
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 0), stoneMat);
      rock.position.set(Math.cos(a) * 0.85, 0.18, Math.sin(a) * 0.85);
      group.add(rock);
    }
    for (let i = 0; i < 4; i++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 1.3, 6), woodMat);
      log.position.y = 0.26;
      log.rotation.z = Math.PI / 2.4;
      log.rotation.y = (i * Math.PI) / 4;
      group.add(log);
    }
    const flameMat = new THREE.MeshStandardMaterial({
      color: 0xffedd5,
      emissive: upgradePath === 'pathB' ? 0xf97316 : 0xf59e0b,
      emissiveIntensity: 2.5,
      roughness: 0.2,
      flatShading: true,
    });
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.52, 1.25, 6), flameMat);
    flame.position.y = 0.82;
    group.add(flame);
  } else if (type === 'catapult') {
    const baseFrame = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.32, 1.9), woodMat);
    baseFrame.position.y = 0.22;
    baseFrame.castShadow = true;
    const uprightL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.25, 0.28), woodMat);
    uprightL.position.set(-0.58, 0.85, 0);
    const uprightR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.25, 0.28), woodMat);
    uprightR.position.set(0.58, 0.85, 0);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 1.75), metalMat);
    arm.position.set(0, 1.15, -0.2);
    arm.rotation.x = 0.38;
    const boulder = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.36, 0),
      upgradePath === 'pathA'
        ? new THREE.MeshStandardMaterial({
            color: 0xfef08a,
            emissive: 0xea580c,
            emissiveIntensity: 1.8,
            flatShading: true,
          })
        : stoneMat
    );
    boulder.position.set(0, 1.48, -0.82);
    group.add(baseFrame, uprightL, uprightR, arm, boulder);
  } else if (type === 'guardtent') {
    // A-frame ranger tent + wooden totem + banner
    const tentGeo = new THREE.ConeGeometry(1.25, 1.75, 4);
    const tent = new THREE.Mesh(tentGeo, greenMat);
    tent.position.y = 0.9;
    tent.rotation.y = Math.PI / 4;
    tent.castShadow = true;
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.95, 0.2), woodMat);
    ridge.position.set(0, 0.98, 0.85);
    const crest = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.35, 0.12), metalMat);
    crest.position.set(0, 1.65, 0.92);
    group.add(tent, ridge, crest);
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

export function createResourceNodeModel(type: ResourceType): THREE.Group {
  const group = new THREE.Group();
  group.add(createContactShadow(1.15));

  if (type === 'wood') {
    const barkMat = new THREE.MeshStandardMaterial({
      color: 0x7c5338,
      roughness: 0.9,
      envMapIntensity: 0.18,
    });
    const heartwoodMat = new THREE.MeshStandardMaterial({
      color: 0xe6c280,
      roughness: 0.72,
      envMapIntensity: 0.15,
    });
    const pineNeedlesMat = new THREE.MeshStandardMaterial({
      color: 0x134e3f,
      roughness: 0.85,
      envMapIntensity: 0.18,
    });
    const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.72, 0.62, 8), barkMat);
    stump.position.set(-0.22, 0.31, -0.1);
    stump.castShadow = true;
    const ringTop = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.05, 8), heartwoodMat);
    ringTop.position.set(-0.22, 0.63, -0.1);
    const log1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 1.35, 8), barkMat);
    log1.position.set(0.32, 0.22, 0.32);
    log1.rotation.z = Math.PI / 2;
    log1.rotation.y = 0.5;
    log1.castShadow = true;
    // Young pine sapling sprouting beside the timber stump
    const saplingTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 1.15, 7), barkMat);
    saplingTrunk.position.set(0.38, 0.56, -0.28);
    const saplingCone1 = new THREE.Mesh(new THREE.ConeGeometry(0.68, 1.1, 8), pineNeedlesMat);
    saplingCone1.position.set(0.38, 1.15, -0.28);
    saplingCone1.castShadow = true;
    const saplingCone2 = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.85, 8), pineNeedlesMat);
    saplingCone2.position.set(0.38, 1.68, -0.28);
    saplingCone2.castShadow = true;
    group.add(stump, ringTop, log1, saplingTrunk, saplingCone1, saplingCone2);
  } else if (type === 'stone') {
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.86,
      metalness: 0.12,
      envMapIntensity: 0.2,
      flatShading: true,
    });
    const darkRockMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.9,
      metalness: 0.1,
      envMapIntensity: 0.18,
      flatShading: true,
    });
    const r1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.72, 0), rockMat);
    r1.position.set(-0.15, 0.45, 0);
    r1.scale.set(1.15, 0.85, 1.05);
    r1.castShadow = true;
    const r2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5, 0), darkRockMat);
    r2.position.set(0.46, 0.32, 0.26);
    r2.castShadow = true;
    const r3 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38, 0), rockMat);
    r3.position.set(0.18, 0.26, -0.42);
    r3.castShadow = true;
    group.add(r1, r2, r3);
  } else {
    // Food: Lush Woodland Berry Bush
    const bushMat = new THREE.MeshStandardMaterial({
      color: 0x245e32,
      roughness: 0.86,
      envMapIntensity: 0.16,
      flatShading: true,
    });
    const berryMat = new THREE.MeshStandardMaterial({
      color: 0xe11d48,
      emissive: 0x9f1239,
      emissiveIntensity: 0.35,
      roughness: 0.35,
    });
    const b1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.62, 1), bushMat);
    b1.position.set(0, 0.46, 0);
    b1.castShadow = true;
    const b2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.46, 1), bushMat);
    b2.position.set(0.44, 0.35, 0.22);
    const b3 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4, 1), bushMat);
    b3.position.set(-0.38, 0.32, 0.24);
    group.add(b1, b2, b3);

    const berryOffsets = [
      [-0.25, 0.72, 0.35],
      [0.18, 0.82, 0.22],
      [0.35, 0.58, -0.25],
      [-0.32, 0.55, -0.28],
      [0.52, 0.52, 0.38],
    ];
    berryOffsets.forEach(([bx, by, bz]) => {
      const berry = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), berryMat);
      berry.position.set(bx, by, bz);
      group.add(berry);
    });
  }

  return group;
}
