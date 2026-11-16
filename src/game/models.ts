import * as THREE from 'three';
import { BuildingType, ResourceType, UpgradePathId, ZombieArchetype } from './types';

// Shared procedural bump texture for organic low-poly relief
export function createProceduralBumpTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 128, 128);

  for (let i = 0; i < 900; i++) {
    const x = (i * 73) % 128;
    const y = (i * 41) % 128;
    const r = 2 + (i % 6);
    const v = 100 + ((i * 29) % 55);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(16, 16);
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createStripedPajamaTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  for (let y = 0; y < 64; y += 8) {
    ctx.fillStyle = (y / 8) % 2 === 0 ? '#bae6fd' : '#0284c7';
    ctx.fillRect(0, y, 64, 8);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
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
  group.add(createContactShadow(0.85));

  const greenMat = new THREE.MeshStandardMaterial({
    color: 0x2d6a4f,
    roughness: 0.78,
    metalness: 0.08,
    flatShading: true,
  });
  const barkMat = new THREE.MeshStandardMaterial({
    color: 0x5c3a21,
    roughness: 0.85,
    metalness: 0.1,
    flatShading: true,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xf4c29f,
    roughness: 0.65,
    metalness: 0.05,
    flatShading: true,
  });
  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.32,
    metalness: 0.82,
    flatShading: true,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.28,
    metalness: 0.85,
    flatShading: true,
  });
  const lanternGlowMat = new THREE.MeshStandardMaterial({
    color: 0xffedd5,
    emissive: 0xff8c1a,
    emissiveIntensity: 2.4,
    roughness: 0.2,
  });

  // 1. Boots
  const bootGeo = new THREE.BoxGeometry(0.28, 0.26, 0.38);
  const leftBoot = new THREE.Mesh(bootGeo, barkMat);
  leftBoot.position.set(-0.2, 0.13, 0.03);
  leftBoot.castShadow = true;
  const rightBoot = new THREE.Mesh(bootGeo, barkMat);
  rightBoot.position.set(0.2, 0.13, 0.03);
  rightBoot.castShadow = true;
  group.add(leftBoot, rightBoot);

  // 2. Stocky Ranger Tunic / Torso
  const torsoGeo = new THREE.CylinderGeometry(0.42, 0.5, 0.82, 8);
  const torso = new THREE.Mesh(torsoGeo, greenMat);
  torso.position.y = 0.64;
  torso.castShadow = true;
  group.add(torso);

  // 3. Belt + Brass Buckle
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.48, 0.14, 8), barkMat);
  belt.position.y = 0.46;
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.1), brassMat);
  buckle.position.set(0, 0.46, 0.46);
  group.add(belt, buckle);

  // 4. Backpack + Bedroll
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.58, 0.34), barkMat);
  pack.position.set(0, 0.72, -0.42);
  pack.castShadow = true;
  const bedroll = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.62, 8),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8, flatShading: true })
  );
  bedroll.rotation.z = Math.PI / 2;
  bedroll.position.set(0, 1.06, -0.42);
  group.add(pack, bedroll);

  // 5. Expressive Head + Slightly Scared Big Eyes + Ranger Hat
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.25, 0);

  const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38, 1), skinMat);
  head.castShadow = true;
  headGroup.add(head);

  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
  const eyeGeo = new THREE.SphereGeometry(0.11, 8, 8);
  const pupilGeo = new THREE.SphereGeometry(0.055, 6, 6);

  const leftEye = new THREE.Mesh(eyeGeo, eyeWhiteMat);
  leftEye.position.set(-0.14, 0.05, 0.31);
  const rightEye = new THREE.Mesh(eyeGeo, eyeWhiteMat);
  rightEye.position.set(0.14, 0.05, 0.31);

  const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
  leftPupil.position.set(-0.14, 0.05, 0.39);
  const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
  rightPupil.position.set(0.14, 0.05, 0.39);

  // Worried eyebrows (tilted up in center so Rue looks nervously brave)
  const browGeo = new THREE.BoxGeometry(0.16, 0.045, 0.06);
  const leftBrow = new THREE.Mesh(browGeo, barkMat);
  leftBrow.position.set(-0.15, 0.2, 0.34);
  leftBrow.rotation.z = 0.28;
  const rightBrow = new THREE.Mesh(browGeo, barkMat);
  rightBrow.position.set(0.15, 0.2, 0.34);
  rightBrow.rotation.z = -0.28;

  // Wide Ranger Hat
  const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.06, 10), barkMat);
  hatBrim.position.y = 0.28;
  hatBrim.castShadow = true;
  const hatBand = new THREE.Mesh(new THREE.CylinderGeometry(0.41, 0.42, 0.09, 8), brassMat);
  hatBand.position.y = 0.33;
  const hatCrown = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.44, 8), greenMat);
  hatCrown.position.y = 0.54;
  hatCrown.castShadow = true;

  headGroup.add(
    leftEye,
    rightEye,
    leftPupil,
    rightPupil,
    leftBrow,
    rightBrow,
    hatBrim,
    hatBand,
    hatCrown
  );
  group.add(headGroup);

  // 6. Left Arm + Warm Lantern in Left Hand (In Three.js +X is character's left when facing +Z)
  const leftArm = new THREE.Group();
  leftArm.position.set(0.52, 0.92, 0);
  const leftSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.45, 0.22), greenMat);
  leftSleeve.position.set(0, -0.15, 0.12);
  leftSleeve.rotation.x = -Math.PI / 4;

  const lanternGroup = new THREE.Group();
  lanternGroup.position.set(0, -0.35, 0.36);
  const lanternCap = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.16, 6), ironMat);
  lanternCap.position.y = 0.16;
  const lanternCore = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.26, 6), lanternGlowMat);
  const lanternBase = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.07, 6), ironMat);
  lanternBase.position.y = -0.16;
  lanternGroup.add(lanternCap, lanternCore, lanternBase);
  leftArm.add(leftSleeve, lanternGroup);
  group.add(leftArm);

  // 7. Right Arm + Heavy Builder's Hammer in Right Hand (-X side)
  const rightArm = new THREE.Group();
  rightArm.position.set(-0.52, 0.92, 0);
  const rightSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.45, 0.22), greenMat);
  rightSleeve.position.set(0, -0.15, 0.1);
  rightSleeve.rotation.x = -Math.PI / 5;

  const hammerShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.72, 6), barkMat);
  hammerShaft.position.set(0, -0.1, 0.34);
  hammerShaft.rotation.x = Math.PI / 3;

  const hammerHead = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.24, 0.26), ironMat);
  hammerHead.position.set(0, 0.14, 0.58);
  hammerHead.castShadow = true;

  rightArm.add(rightSleeve, hammerShaft, hammerHead);
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
  fort.add(createContactShadow(3.6));

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.88,
    metalness: 0.12,
    flatShading: true,
  });
  const logMat = new THREE.MeshStandardMaterial({
    color: 0x6b4226,
    roughness: 0.82,
    metalness: 0.08,
    flatShading: true,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.65,
    metalness: 0.28,
    flatShading: true,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x2d6a4f,
    roughness: 0.7,
    metalness: 0.15,
    flatShading: true,
  });
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.9,
    roughness: 0.2,
  });

  // 1. Octagonal Stone Foundation
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.65, 2.95, 0.7, 8), stoneMat);
  base.position.y = 0.35;
  base.receiveShadow = true;
  base.castShadow = true;
  fort.add(base);

  // 2. Main Timber Lodge Body
  const lodge = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.1, 3.4), logMat);
  lodge.position.y = 1.7;
  lodge.castShadow = true;
  lodge.receiveShadow = true;
  fort.add(lodge);

  // 3. Corner Log Buttresses (4)
  const cornerGeo = new THREE.CylinderGeometry(0.32, 0.36, 2.3, 6);
  const corners = [
    [-1.7, 1.75, -1.7],
    [1.7, 1.75, -1.7],
    [-1.7, 1.75, 1.7],
    [1.7, 1.75, 1.7],
  ];
  corners.forEach(([cx, cy, cz]) => {
    const post = new THREE.Mesh(cornerGeo, trimMat);
    post.position.set(cx, cy, cz);
    post.castShadow = true;
    fort.add(post);
  });

  // 4. Pitched Roof
  const mainRoof = new THREE.Mesh(new THREE.ConeGeometry(3.15, 1.65, 4), roofMat);
  mainRoof.position.y = 3.55;
  mainRoof.rotation.y = Math.PI / 4;
  mainRoof.castShadow = true;
  fort.add(mainRoof);

  // 5. Upper Lookout Cupola + Roof
  const cupola = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.1, 1.5), logMat);
  cupola.position.y = 4.2;
  cupola.castShadow = true;
  const cupolaRoof = new THREE.Mesh(new THREE.ConeGeometry(1.45, 1.1, 4), trimMat);
  cupolaRoof.position.y = 5.25;
  cupolaRoof.rotation.y = Math.PI / 4;
  cupolaRoof.castShadow = true;
  fort.add(cupola, cupolaRoof);

  // 6. Stone Chimney
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.65, 2.6, 0.65), stoneMat);
  chimney.position.set(-1.25, 3.6, -0.9);
  chimney.castShadow = true;
  fort.add(chimney);

  // 7. Reinforced Front Door + Warm Glowing Windows
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.35, 0.18), trimMat);
  door.position.set(0, 1.35, 1.72);
  fort.add(door);

  const winGeo = new THREE.BoxGeometry(0.55, 0.55, 0.12);
  const winPositions: [number, number, number, number][] = [
    [-1.0, 1.9, 1.71, 0],
    [1.0, 1.9, 1.71, 0],
    [1.71, 1.9, 0, Math.PI / 2],
    [-1.71, 1.9, 0, Math.PI / 2],
    [0, 4.3, 0.76, 0],
  ];
  winPositions.forEach(([wx, wy, wz, rotY]) => {
    const w = new THREE.Mesh(winGeo, windowMat);
    w.position.set(wx, wy, wz);
    w.rotation.y = rotY;
    fort.add(w);
  });

  // 8. Banner Flagpole on Peak
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.4, 6), stoneMat);
  pole.position.set(0, 6.1, 0);
  const flag = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 0.42, 0.05),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5, flatShading: true })
  );
  flag.position.set(0.42, 6.45, 0);
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
    // 7 sharpened timber stakes + crossbar + iron spikes
    const logGeo = new THREE.CylinderGeometry(0.16, 0.2, 1.55, 6);
    const tipGeo = new THREE.ConeGeometry(0.17, 0.38, 6);
    for (let i = -2; i <= 2; i++) {
      const log = new THREE.Mesh(logGeo, woodMat);
      log.position.set(i * 0.36, 0.78, (i % 2) * 0.08);
      log.castShadow = true;
      const tip = new THREE.Mesh(tipGeo, upgradePath ? metalMat : woodMat);
      tip.position.set(i * 0.36, 1.72, (i % 2) * 0.08);
      group.add(log, tip);
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.22, 0.45), stoneMat);
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
      ? 1.48
      : type === 'armored_undead'
      ? 1.22
      : type === 'gawp'
      ? 1.14
      : type === 'bone_howler'
      ? 1.1
      : type === 'brine'
      ? 1.08
      : type === 'swift_stumbler'
      ? 0.94
      : 1.0;
  group.add(createContactShadow(0.75 * specScale));

  const zombieSkinColors: Record<ZombieArchetype, number> = {
    shamble: 0x84a98c,
    swift_stumbler: 0xfdba74,
    armored_undead: 0x64748b,
    bone_howler: 0x5eead4,
    grinner: 0xa3e635,
    grumble: 0x94a3b8,
    gawp: 0x65a30d,
    brine: 0x14b8a6,
    baron: 0xc084fc,
  };

  const skinMat = new THREE.MeshStandardMaterial({
    color: zombieSkinColors[type],
    roughness: type === 'brine' ? 0.22 : 0.72,
    metalness: type === 'brine' ? 0.35 : 0.08,
    flatShading: true,
  });

  const coatMat =
    type === 'grumble'
      ? new THREE.MeshStandardMaterial({
          color: 0xffffff,
          map: pajamaTex,
          roughness: 0.8,
          flatShading: true,
        })
      : new THREE.MeshStandardMaterial({
          color:
            type === 'baron'
              ? 0x3b0764
              : type === 'armored_undead'
              ? 0x1e293b
              : type === 'swift_stumbler'
              ? 0xc2410c
              : type === 'bone_howler'
              ? 0x0f766e
              : type === 'brine'
              ? 0x115e59
              : type === 'grinner'
              ? 0xb45309
              : 0x3f3f46,
          roughness: type === 'armored_undead' ? 0.42 : 0.78,
          metalness: type === 'armored_undead' ? 0.55 : 0.15,
          flatShading: true,
        });

  // Legs
  const legGeo = new THREE.BoxGeometry(0.22, 0.45, 0.24);
  const leftLeg = new THREE.Mesh(legGeo, coatMat);
  leftLeg.position.set(-0.16, 0.22, 0);
  const rightLeg = new THREE.Mesh(legGeo, coatMat);
  rightLeg.position.set(0.16, 0.22, 0);
  group.add(leftLeg, rightLeg);

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.68, 0.38), coatMat);
  torso.position.y = 0.74;
  if (type === 'swift_stumbler') {
    torso.rotation.x = 0.26;
    torso.position.z = 0.06;
  }
  torso.castShadow = true;
  group.add(torso);

  // Head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), skinMat);
  head.position.y = 1.34;
  if (type === 'swift_stumbler') {
    head.position.z = 0.12;
  }
  head.castShadow = true;
  group.add(head);

  // Expressive Goofy Eyes (asymmetric sizes for scary-funny charm)
  const eyeYellowMat = new THREE.MeshBasicMaterial({
    color:
      type === 'baron'
        ? 0xfbbf24
        : type === 'swift_stumbler'
        ? 0xfb923c
        : type === 'armored_undead'
        ? 0x38bdf8
        : type === 'bone_howler'
        ? 0x2dd4bf
        : 0xfef08a,
  });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x090d16 });

  const headZOffset = type === 'swift_stumbler' ? 0.12 : 0;
  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), eyeYellowMat);
  leftEye.position.set(-0.13, 1.38, 0.24 + headZOffset);
  const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), eyeYellowMat);
  rightEye.position.set(0.13, 1.36, 0.24 + headZOffset);

  const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), pupilMat);
  leftPupil.position.set(-0.13, 1.38, 0.33 + headZOffset);
  const rightPupil = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), pupilMat);
  rightPupil.position.set(0.13, 1.36, 0.31 + headZOffset);
  group.add(leftEye, rightEye, leftPupil, rightPupil);

  // Outstretched zombie arms
  const armGeo = new THREE.BoxGeometry(0.18, 0.18, 0.56);
  const leftArm = new THREE.Mesh(armGeo, skinMat);
  leftArm.position.set(-0.38, 0.9, 0.22);
  const rightArm = new THREE.Mesh(armGeo, skinMat);
  rightArm.position.set(0.38, 0.9, 0.22);
  if (type === 'grinner') {
    // Friendly waving right arm + huge toothy smile
    rightArm.position.set(0.42, 1.24, 0.15);
    rightArm.rotation.x = -Math.PI / 3;
    const smile = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.12, 0.08),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    smile.position.set(0, 1.2, 0.25);
    group.add(smile);
  } else if (type === 'swift_stumbler') {
    // Aerodynamic sprinter arm swing
    leftArm.rotation.x = 0.45;
    rightArm.rotation.x = -0.35;
  }
  group.add(leftArm, rightArm);

  // Archetype-specific signature props
  if (type === 'swift_stumbler') {
    // Crimson-orange trail-runner bandana + trailing ribbon tails + speed boots
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
    // Cast-Iron Kettle Knight: riveted pot helmet, breastplate, pauldrons & buckler shield
    // Tagged with userData.isArmorPiece = true so shattering armor visually strips it!
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
    // Megaphone Trail-Leader: bone-and-brass war horn + ranger hood crest
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
  } else if (type === 'gawp') {
    // Wooden fence stuck around Gawp's waist!
    const fenceMat = new THREE.MeshStandardMaterial({
      color: 0x92400e,
      roughness: 0.85,
      flatShading: true,
    });
    const rail1 = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.12, 0.72), fenceMat);
    rail1.position.y = 0.86;
    const rail2 = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.12, 0.72), fenceMat);
    rail2.position.y = 0.62;
    const picketL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.85, 0.08), fenceMat);
    picketL.position.set(-0.48, 0.8, 0.38);
    const picketR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.85, 0.08), fenceMat);
    picketR.position.set(0.48, 0.8, 0.38);
    group.add(rail1, rail2, picketL, picketR);
  } else if (type === 'grumble') {
    // Droopy striped nightcap
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.55, 6), coatMat);
    cap.position.set(0, 1.76, -0.05);
    cap.rotation.x = -0.35;
    group.add(cap);
  } else if (type === 'brine') {
    // Swamp kelp crown & glowing slime shoulder blobs
    const slimeMat = new THREE.MeshStandardMaterial({
      color: 0x4ade80,
      emissive: 0x16a34a,
      emissiveIntensity: 0.9,
      roughness: 0.2,
    });
    const blob1 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), slimeMat);
    blob1.position.set(-0.26, 1.08, 0);
    const blob2 = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), slimeMat);
    blob2.position.set(0.12, 1.62, 0);
    group.add(blob1, blob2);
  } else if (type === 'baron') {
    // Baron Blight: Tall silk top hat, crimson cape, golden cane
    const hatMat = new THREE.MeshStandardMaterial({
      color: 0x1e1b4b,
      roughness: 0.35,
      metalness: 0.4,
      flatShading: true,
    });
    const capeMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      roughness: 0.65,
      flatShading: true,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.25,
      metalness: 0.88,
    });

    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.07, 10), hatMat);
    brim.position.y = 1.62;
    const topHat = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.3, 0.65, 10), hatMat);
    topHat.position.y = 1.96;
    const cape = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.95, 0.12), capeMat);
    cape.position.set(0, 0.72, -0.26);
    cape.rotation.x = 0.18;
    const cane = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 1.1, 6), goldMat);
    cane.position.set(0.44, 0.55, 0.44);
    group.add(brim, topHat, cape, cane);
  }

  group.scale.setScalar(specScale);
  return group;
}

export function createResourceNodeModel(type: ResourceType): THREE.Group {
  const group = new THREE.Group();
  group.add(createContactShadow(1.15));

  if (type === 'wood') {
    const barkMat = new THREE.MeshStandardMaterial({
      color: 0x713f12,
      roughness: 0.85,
      flatShading: true,
    });
    const heartwoodMat = new THREE.MeshStandardMaterial({
      color: 0xfde68a,
      roughness: 0.65,
      flatShading: true,
    });
    const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.72, 0.65, 7), barkMat);
    stump.position.y = 0.32;
    stump.castShadow = true;
    const ringTop = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.05, 7), heartwoodMat);
    ringTop.position.y = 0.65;
    const log1 = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 1.35, 6), barkMat);
    log1.position.set(0.35, 0.24, 0.35);
    log1.rotation.z = Math.PI / 2;
    log1.rotation.y = 0.5;
    log1.castShadow = true;
    group.add(stump, ringTop, log1);
  } else if (type === 'stone') {
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.78,
      metalness: 0.2,
      flatShading: true,
    });
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x7dd3fc,
      emissive: 0x0284c7,
      emissiveIntensity: 0.55,
      roughness: 0.25,
      metalness: 0.5,
      flatShading: true,
    });
    const r1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.68, 0), rockMat);
    r1.position.set(-0.15, 0.48, 0);
    r1.castShadow = true;
    const r2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.46, 0), rockMat);
    r2.position.set(0.45, 0.34, 0.25);
    r2.castShadow = true;
    const shard = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.85, 5), crystalMat);
    shard.position.set(0.1, 0.75, -0.15);
    shard.rotation.z = -0.25;
    group.add(r1, r2, shard);
  } else {
    // Food: Spooky Berry Bush + Glowing Toadstools
    const bushMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.75,
      flatShading: true,
    });
    const berryMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 0.65,
      roughness: 0.3,
    });
    const b1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.58, 1), bushMat);
    b1.position.set(0, 0.48, 0);
    b1.castShadow = true;
    const b2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42, 1), bushMat);
    b2.position.set(0.42, 0.36, 0.22);
    group.add(b1, b2);

    const berryOffsets = [
      [-0.25, 0.72, 0.35],
      [0.18, 0.82, 0.22],
      [0.35, 0.58, -0.25],
      [-0.32, 0.55, -0.28],
      [0.52, 0.52, 0.38],
    ];
    berryOffsets.forEach(([bx, by, bz]) => {
      const berry = new THREE.Mesh(new THREE.SphereGeometry(0.13, 6, 6), berryMat);
      berry.position.set(bx, by, bz);
      group.add(berry);
    });
  }

  return group;
}
