import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { soundFX } from '../game/audio';
import { LanguageCode, TRANSLATIONS } from '../game/i18n';
import {
  createBarkTexture,
  createBuildingModel,
  createCentralFortModel,
  createCornfieldDecorModel,
  createDirtRoadTexture,
  createFenceSegmentModel,
  createGrassTerrainTexture,
  createPineFoliageTexture,
  createPlacementPadMesh,
  createProceduralBumpTexture,
  createRangerRueModel,
  createResourceNodeModel,
  createSoilFurrowTexture,
  createSquareCornerBastionPosts,
  createStripedPajamaTexture,
  createWaterCanalTexture,
  createWoodBridgeModel,
  createZombieModel,
} from '../game/models';
import {
  applyBoneHowlerRally,
  applyDamageToZombie,
  applyLanternFlareToZombies,
  BUILDING_CATALOG,
  buildOrUpgradeFenceSegment,
  buildStructureOnPad,
  calculateRunScore,
  canAfford,
  canPerformConstructionInPhase,
  canTriggerLanternFlare,
  computeZombieEffectiveSpeed,
  createInitialFenceSegments,
  createInitialPads,
  DAY_DURATION_SECONDS,
  deductCost,
  evaluateGameOutcome,
  FENCE_HALF_EXTENT,
  findBlockingFenceSegment,
  findNextFenceSegmentForHero,
  FLARE_NIGHT_LOCKED_MESSAGE,
  FORT_MAX_HP,
  getEffectiveBuildingStats,
  getWaveComposition,
  INITIAL_RESOURCES,
  LANTERN_FLARE_COOLDOWN,
  LANTERN_FLARE_RADIUS,
  MAX_DAYS,
  NIGHT_BUILD_LOCKED_MESSAGE,
  startFenceConstructionTask,
  startPadConstructionTask,
  stepConstructionTask,
  upgradeStructureOnPad,
  ZOMBIE_CATALOG,
} from '../game/rules';
import {
  checkAndApplyDailyReset,
  completeRunProgression,
  consumeTicketForRun,
  grantReviewTickets,
  LANTERN_COSMETICS,
  loadDailyStateFromStorage,
  recordTaskProgress,
  saveDailyStateToStorage,
} from '../game/dailySystem';
import {
  BuildingType,
  DailyPersistenceState,
  DayNightPhase,
  FenceSegment,
  FloatingCallout,
  GameScreenState,
  HeroAnimState,
  HudSnapshot,
  PendingConstructionTask,
  PlacementPad,
  ProjectileEntity,
  ResourceNodeEntity,
  Resources,
  RunCompletionSummary,
  SlimePatch,
  ZombieArchetype,
  ZombieEntity,
} from '../game/types';

export interface GameControllerApi {
  startGame: () => void;
  restartGame: () => void;
  returnToTitle: () => void;
  togglePause: () => void;
  finishRunEarly: () => void;
  equipLantern: (lanternId: string) => void;
  equipTitle: (title: string) => void;
  refillTicketWithCoins: () => void;
  selectPad: (padId: number | null) => void;
  selectFence: (fenceId: number | null) => void;
  buildNextFence: () => void;
  buildOnSelectedPad: (type: BuildingType) => void;
  upgradeSelectedPad: (pathId: 'pathA' | 'pathB') => void;
  repairSelectedPad: () => void;
  demolishSelectedPad: () => void;
  triggerLanternFlare: () => void;
  startNightEarly: () => void;
  toggleDock: () => void;
  adjustZoom: (delta: number) => void;
}

interface GameCanvasProps {
  onHudUpdate: (snapshot: HudSnapshot) => void;
  controllerRef: React.MutableRefObject<GameControllerApi | null>;
  lang?: LanguageCode;
}

// Pre-allocated module-scope math objects for Zero-GC inside the render loop
const _vec3 = new THREE.Vector3();
const _projVec = new THREE.Vector3();
const _dummyObj = new THREE.Object3D();
const _color = new THREE.Color();
const _daySkyColor = new THREE.Color(0x1b2e2b);
const _nightSkyColor = new THREE.Color(0x2d1424);
const _daySunColor = new THREE.Color(0xffdfa8);
const _nightMoonColor = new THREE.Color(0xff9eb5);
const _dayHemiSky = new THREE.Color(0x8ecae6);
const _nightHemiSky = new THREE.Color(0xb5536b);
const _dayHemiGround = new THREE.Color(0x263c28);
const _nightHemiGround = new THREE.Color(0x423038);
const _dayRimColor = new THREE.Color(0x60a5fa);
const _nightRimColor = new THREE.Color(0xfb7185);

const MAX_PARTICLES = 220;
interface ParticleSlot {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  scale: number;
  colorHex: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  onHudUpdate,
  controllerRef,
  lang = 'en',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const calloutContainerRef = useRef<HTMLDivElement | null>(null);
  const onHudUpdateRef = useRef(onHudUpdate);
  onHudUpdateRef.current = onHudUpdate;
  const langRef = useRef<LanguageCode>(lang);
  langRef.current = lang;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Software-WebGL Guard (SwiftShader / llvmpipe detection)
    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    renderer.domElement.setAttribute('data-testid', 'game-canvas');
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = _daySkyColor.clone();
    scene.fog = new THREE.FogExp2(0x1b2e2b, 0.016);

    // Studio Environment Reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const bumpTex = createProceduralBumpTexture(maxAnisotropy);
    const pajamaTex = createStripedPajamaTexture(maxAnisotropy);
    const outerGrassTex = createGrassTerrainTexture(maxAnisotropy, true);
    const clearingGrassTex = createGrassTerrainTexture(maxAnisotropy, false);
    const dirtRoadTex = createDirtRoadTexture(maxAnisotropy);
    const barkTex = createBarkTexture(maxAnisotropy);
    const foliageTex = createPineFoliageTexture(maxAnisotropy);
    const waterCanalTex = createWaterCanalTexture(maxAnisotropy);
    const soilFurrowTex = createSoilFurrowTexture(maxAnisotropy);

    // Fixed ~45° Isometric / Top-Down 3/4 Camera (NOT a follow camera; keeps whole fort readable)
    const camera = new THREE.PerspectiveCamera(
      38,
      (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight),
      0.5,
      140
    );
    camera.position.set(0, 26, 26);
    camera.lookAt(0, 0, 0);

    // 3-Point + Warm/Cool Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x8ecae6, 0x263c28, 0.85);
    hemiLight.position.set(0, 40, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffdfa8, 1.65);
    keyLight.position.set(16, 28, 14);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    const d = 22;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 65;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x60a5fa, 0.55);
    rimLight.position.set(-18, 15, -16);
    scene.add(rimLight);

    // Warm Fort & Rue Lantern Point Lights (within 4-6 PointLight budget)
    const fortWarmLight = new THREE.PointLight(0xff9e2c, 2.2, 16, 1.8);
    fortWarmLight.position.set(0, 3.4, 0);
    scene.add(fortWarmLight);

    const rueLanternLight = new THREE.PointLight(0xff8c1a, 2.5, 13, 1.7);
    scene.add(rueLanternLight);

    // 2. Realistic Outdoor Forest Floor, Meadow Clearing, Dirt & Cobblestone Roads, 3D Grass & Multi-Tiered Woodland
    const outerGround = new THREE.Mesh(
      new THREE.CircleGeometry(85, 56),
      new THREE.MeshStandardMaterial({
        color: 0xd4e4a8,
        map: outerGrassTex,
        roughness: 0.92,
        metalness: 0.03,
        bumpMap: bumpTex,
        bumpScale: 0.11,
      })
    );
    outerGround.rotation.x = -Math.PI / 2;
    outerGround.receiveShadow = true;
    scene.add(outerGround);

    const clearingDisc = new THREE.Mesh(
      new THREE.CircleGeometry(17.9, 64),
      new THREE.MeshStandardMaterial({
        color: 0xeef6c4,
        map: clearingGrassTex,
        roughness: 0.86,
        metalness: 0.04,
        bumpMap: bumpTex,
        bumpScale: 0.07,
      })
    );
    clearingDisc.rotation.x = -Math.PI / 2;
    clearingDisc.position.y = 0.02;
    clearingDisc.receiveShadow = true;
    scene.add(clearingDisc);

    // Water Ditch / Moat Canal ("Got / Pembatas Air") surrounding the clearing + 4 Wooden Bridges
    const ditchMudMat = new THREE.MeshStandardMaterial({
      color: 0x3b3127,
      roughness: 0.94,
      metalness: 0.03,
      bumpMap: bumpTex,
      bumpScale: 0.09,
    });
    const innerBankRing = new THREE.Mesh(new THREE.RingGeometry(17.58, 18.08, 64), ditchMudMat);
    innerBankRing.rotation.x = -Math.PI / 2;
    innerBankRing.position.y = 0.028;
    innerBankRing.receiveShadow = true;

    const outerBankRing = new THREE.Mesh(new THREE.RingGeometry(19.52, 20.02, 64), ditchMudMat);
    outerBankRing.rotation.x = -Math.PI / 2;
    outerBankRing.position.y = 0.028;
    outerBankRing.receiveShadow = true;

    const ditchBedRing = new THREE.Mesh(
      new THREE.RingGeometry(18.0, 19.6, 64),
      new THREE.MeshStandardMaterial({ color: 0x092029, roughness: 0.96, metalness: 0.02 })
    );
    ditchBedRing.rotation.x = -Math.PI / 2;
    ditchBedRing.position.y = 0.024;
    ditchBedRing.receiveShadow = true;

    const waterMoatMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x075985,
      emissiveIntensity: 0.35,
      map: waterCanalTex,
      roughness: 0.45,
      metalness: 0.05,
      transparent: true,
      opacity: 0.92,
      envMapIntensity: 0.08,
    });
    const waterMoatRing = new THREE.Mesh(new THREE.RingGeometry(18.04, 19.56, 64), waterMoatMat);
    waterMoatRing.rotation.x = -Math.PI / 2;
    waterMoatRing.position.y = 0.042;
    waterMoatRing.receiveShadow = true;
    scene.add(innerBankRing, outerBankRing, ditchBedRing, waterMoatRing);

    // Ditch Stone Curb Stones lining inner & outer banks (skipping bridge corridors)
    const ditchCurbCount = 96;
    const ditchCurbInst = new THREE.InstancedMesh(
      new THREE.DodecahedronGeometry(0.24, 0),
      new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9, flatShading: true }),
      ditchCurbCount
    );
    ditchCurbInst.receiveShadow = true;
    let curbIdx = 0;
    for (let i = 0; i < 64 && curbIdx < ditchCurbCount; i++) {
      const a = (i / 64) * Math.PI * 2;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      if (Math.abs(ca) < 0.12 || Math.abs(sa) < 0.12) continue;
      const rBank = i % 2 === 0 ? 17.88 : 19.72;
      _dummyObj.position.set(ca * rBank, 0.08, sa * rBank);
      _dummyObj.rotation.set(0.2 * (i % 3), a, 0.15);
      _dummyObj.scale.set(1.15, 0.55, 0.9);
      _dummyObj.updateMatrix();
      ditchCurbInst.setMatrixAt(curbIdx++, _dummyObj.matrix);
    }
    ditchCurbInst.count = curbIdx;
    ditchCurbInst.instanceMatrix.needsUpdate = true;
    ditchCurbInst.computeBoundingSphere();
    scene.add(ditchCurbInst);

    // 4 Wooden Plank Bridges where N/S/E/W trails cross the Water Ditch
    [
      { x: 0, z: -18.8, rotY: 0 },
      { x: 0, z: 18.8, rotY: 0 },
      { x: 18.8, z: 0, rotY: Math.PI / 2 },
      { x: -18.8, z: 0, rotY: Math.PI / 2 },
    ].forEach((b) => {
      const bridge = createWoodBridgeModel();
      bridge.position.set(b.x, 0.045, b.z);
      bridge.rotation.y = b.rotY;
      scene.add(bridge);
    });

    // 4 Realistic Dirt & Pebble Roads OUTSIDE the Fort Perimeter ONLY (±9.6m), split cleanly at the Water Ditch
    const innerApproachTex = dirtRoadTex.clone();
    innerApproachTex.needsUpdate = true;
    innerApproachTex.repeat.set(1, 2.5);
    const outerTrailTex = dirtRoadTex.clone();
    outerTrailTex.needsUpdate = true;
    outerTrailTex.repeat.set(1, 3.0);

    const innerTrailMat = new THREE.MeshStandardMaterial({
      color: 0xd6c2a8,
      map: innerApproachTex,
      transparent: true,
      roughness: 0.92,
      metalness: 0.04,
      bumpMap: bumpTex,
      bumpScale: 0.08,
      depthWrite: false,
    });
    const outerTrailMat = new THREE.MeshStandardMaterial({
      color: 0xd6c2a8,
      map: outerTrailTex,
      transparent: true,
      roughness: 0.92,
      metalness: 0.04,
      bumpMap: bumpTex,
      bumpScale: 0.08,
      depthWrite: false,
    });

    // North & South Exterior Roads (10.0m..18.0m and 19.6m..29.6m)
    [-1, 1].forEach((dirZ) => {
      const innerSeg = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 8.0), innerTrailMat);
      innerSeg.rotation.x = -Math.PI / 2;
      innerSeg.position.set(0, 0.032, dirZ * 14.0);
      innerSeg.receiveShadow = true;

      const outerSeg = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 10.0), outerTrailMat);
      outerSeg.rotation.x = -Math.PI / 2;
      outerSeg.position.set(0, 0.032, dirZ * 24.6);
      outerSeg.receiveShadow = true;
      scene.add(innerSeg, outerSeg);
    });
    // East & West Exterior Roads (10.0m..18.0m and 19.6m..29.6m)
    [-1, 1].forEach((dirX) => {
      const innerSeg = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 8.0), innerTrailMat);
      innerSeg.rotation.x = -Math.PI / 2;
      innerSeg.rotation.z = Math.PI / 2;
      innerSeg.position.set(dirX * 14.0, 0.035, 0);
      innerSeg.receiveShadow = true;

      const outerSeg = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 10.0), outerTrailMat);
      outerSeg.rotation.x = -Math.PI / 2;
      outerSeg.rotation.z = Math.PI / 2;
      outerSeg.position.set(dirX * 24.6, 0.035, 0);
      outerSeg.receiveShadow = true;
      scene.add(innerSeg, outerSeg);
    });

    // Instanced 3D Roadside Cobblestones & Stepping Stones along the 4 EXTERIOR roads only
    const roadStoneCount = 136;
    const roadStoneInst = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.26, 0.34, 0.08, 7),
      new THREE.MeshStandardMaterial({
        color: 0x8d8273,
        roughness: 0.94,
        metalness: 0.03,
        envMapIntensity: 0.18,
        bumpMap: bumpTex,
        bumpScale: 0.06,
      }),
      roadStoneCount
    );
    roadStoneInst.receiveShadow = true;
    let stoneIdx = 0;
    const dirs = [
      { dx: 0, dz: 1 },
      { dx: 0, dz: -1 },
      { dx: 1, dz: 0 },
      { dx: -1, dz: 0 },
    ];
    for (let dIdx = 0; dIdx < dirs.length; dIdx++) {
      const dir = dirs[dIdx];
      for (let step = 0; step < 36 && stoneIdx < roadStoneCount; step++) {
        const dist = 10.2 + step * 0.44 + ((step * 13) % 5) * 0.04;
        // Skip cobblestones across the water ditch & wooden bridge span
        if (dist >= 17.5 && dist <= 20.1) continue;
        const laneMode = step % 3;
        const lateral =
          laneMode === 0
            ? -1.26 + ((step * 7) % 5) * 0.05
            : laneMode === 1
            ? 1.26 - ((step * 11) % 5) * 0.05
            : ((step * 17) % 9 - 4) * 0.15;

        const sx = dir.dx !== 0 ? dir.dx * dist : lateral;
        const sz = dir.dz !== 0 ? dir.dz * dist : lateral;
        const sScale = 0.72 + ((step * 19 + dIdx * 7) % 45) / 100;

        _dummyObj.position.set(sx, 0.034, sz);
        _dummyObj.rotation.set(0, ((step * 23 + dIdx) % 12) * 0.52, 0);
        _dummyObj.scale.set(
          sScale * (1 + ((step * 3) % 3) * 0.12),
          0.55 + (step % 3) * 0.14,
          sScale * (1 + ((step * 5) % 3) * 0.1)
        );
        _dummyObj.updateMatrix();
        roadStoneInst.setMatrixAt(stoneIdx, _dummyObj.matrix);

        const greyTone = 0.36 + ((step * 11 + dIdx * 5) % 18) / 100;
        _color.setHSL(0.08 + (step % 3) * 0.02, 0.12, greyTone);
        roadStoneInst.setColorAt(stoneIdx, _color);
        stoneIdx++;
      }
    }
    roadStoneInst.count = stoneIdx;
    roadStoneInst.instanceMatrix.needsUpdate = true;
    if (roadStoneInst.instanceColor) roadStoneInst.instanceColor.needsUpdate = true;
    roadStoneInst.computeBoundingSphere();
    scene.add(roadStoneInst);

    // Pre-define cornfield location (Upper-Right Forest Space) and Resource Node coordinates so props never overlap them
    const cornCenterX = 18.0;
    const cornCenterZ = -14.8;
    const cornRotY = -0.68;
    const plannedPadCoords = createInitialPads().map((p) => ({ x: p.x, z: p.z }));
    const resourceNodes: ResourceNodeEntity[] = [
      { id: 101, type: 'wood', name: 'Timber Log Stack', x: -12.4, z: -9.8, amount: 60, maxAmount: 60, hitFlashTimer: 0, respawnTimer: 0 },
      { id: 102, type: 'wood', name: 'Lumber Chopping Block', x: 12.6, z: 4.4, amount: 60, maxAmount: 60, hitFlashTimer: 0, respawnTimer: 0 },
      { id: 103, type: 'wood', name: 'Split Firewood Pile', x: -12.8, z: 4.6, amount: 60, maxAmount: 60, hitFlashTimer: 0, respawnTimer: 0 },
      { id: 104, type: 'stone', name: 'Granite Outcrop', x: -8.2, z: -12.4, amount: 55, maxAmount: 55, hitFlashTimer: 0, respawnTimer: 0 },
      { id: 105, type: 'stone', name: 'Quartz Quarry', x: 8.2, z: -12.4, amount: 55, maxAmount: 55, hitFlashTimer: 0, respawnTimer: 0 },
      { id: 106, type: 'stone', name: 'Mossy Boulder', x: 13.0, z: -4.2, amount: 55, maxAmount: 55, hitFlashTimer: 0, respawnTimer: 0 },
      { id: 107, type: 'food', name: 'Corn Harvest Stand', x: 12.2, z: -10.0, amount: 50, maxAmount: 50, hitFlashTimer: 0, respawnTimer: 0 },
      { id: 108, type: 'food', name: 'Orchard Harvest Crate', x: -12.2, z: -4.2, amount: 50, maxAmount: 50, hitFlashTimer: 0, respawnTimer: 0 },
    ];
    const isNearCornfield = (x: number, z: number, pad = 6.2) =>
      Math.hypot(x - cornCenterX, z - cornCenterZ) < pad;
    const isNearResourceNode = (x: number, z: number, pad = 2.8) =>
      resourceNodes.some((n) => Math.hypot(x - n.x, z - n.z) < pad);

    // Instanced 3D Grass Blade Clusters (inside the fort yard + outer meadow, keeping off exterior roads & water moat)
    const grassCount = 460;
    const grassBladeGeo = new THREE.ConeGeometry(0.15, 0.44, 4);
    grassBladeGeo.translate(0, 0.21, 0);
    const grassTuftInst = new THREE.InstancedMesh(
      grassBladeGeo,
      new THREE.MeshStandardMaterial({
        color: 0x769c36,
        roughness: 0.88,
        metalness: 0.02,
        envMapIntensity: 0.12,
      }),
      grassCount
    );
    const grassWindData: {
      gx: number;
      gz: number;
      rotY: number;
      tiltX: number;
      tiltZ: number;
      sx: number;
      sy: number;
      sz: number;
    }[] = [];
    let grassIdx = 0;
    for (let i = 0; i < 1050 && grassIdx < grassCount; i++) {
      const rNorm = Math.sqrt(((i * 73) % 1050) / 1050);
      const radius = 3.85 + rNorm * 19.5;
      const angle = i * 2.39996 + (i % 5) * 0.08;
      const gx = Math.cos(angle) * radius;
      const gz = Math.sin(angle) * radius;

      // Keep off the water moat & exterior dirt roads (inside the fort yard, grass grows freely!)
      if (radius >= 17.3 && radius <= 20.3) continue;
      const outsideFort = Math.abs(gx) >= 9.6 || Math.abs(gz) >= 9.6;
      if (outsideFort && (Math.abs(gx) < 2.0 || Math.abs(gz) < 2.0)) continue;
      if (plannedPadCoords.some((p) => Math.hypot(gx - p.x, gz - p.z) < 1.8)) continue;
      if (isNearCornfield(gx, gz, 5.8)) continue;

      const bladeScale = 0.65 + ((i * 29) % 60) / 100;
      const tiltX = (((i * 13) % 11) - 5) * 0.05;
      const tiltZ = (((i * 17) % 11) - 5) * 0.05;
      const rotY = (i * 1.7) % (Math.PI * 2);
      const sx = bladeScale * 1.1;
      const sy = bladeScale * (0.8 + (i % 4) * 0.16);
      const sz = bladeScale * 0.7;

      _dummyObj.position.set(gx, 0.015, gz);
      _dummyObj.rotation.set(tiltX, rotY, tiltZ);
      _dummyObj.scale.set(sx, sy, sz);
      _dummyObj.updateMatrix();
      grassTuftInst.setMatrixAt(grassIdx, _dummyObj.matrix);

      const hue = 0.21 + ((i * 7) % 8) * 0.005;
      const sat = 0.56 + ((i * 11) % 16) * 0.01;
      const light = radius > 16.5 ? 0.28 + ((i * 5) % 10) * 0.01 : 0.36 + ((i * 9) % 14) * 0.01;
      _color.setHSL(hue, sat, light);
      grassTuftInst.setColorAt(grassIdx, _color);
      grassWindData.push({ gx, gz, rotY, tiltX, tiltZ, sx, sy, sz });
      grassIdx++;
    }
    grassTuftInst.count = grassIdx;
    grassTuftInst.instanceMatrix.needsUpdate = true;
    if (grassTuftInst.instanceColor) grassTuftInst.instanceColor.needsUpdate = true;
    grassTuftInst.computeBoundingSphere();
    scene.add(grassTuftInst);

    // Instanced Multi-Tiered Woodland Pine & Spruce Trees around the ENTIRE perimeter (leaving the Upper-Right Cornfield clear!)
    const treeCount = 176;
    const trunkInst = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.22, 0.44, 2.3, 8),
      new THREE.MeshStandardMaterial({
        color: 0x7c5338,
        map: barkTex,
        roughness: 0.92,
        envMapIntensity: 0.18,
        bumpMap: bumpTex,
        bumpScale: 0.08,
      }),
      treeCount
    );
    const tier1Inst = new THREE.InstancedMesh(
      new THREE.ConeGeometry(1.78, 2.55, 9),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: foliageTex,
        roughness: 0.82,
        envMapIntensity: 0.22,
        bumpMap: bumpTex,
        bumpScale: 0.05,
      }),
      treeCount
    );
    const tier2Inst = new THREE.InstancedMesh(
      new THREE.ConeGeometry(1.4, 2.25, 9),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: foliageTex,
        roughness: 0.78,
        envMapIntensity: 0.24,
        bumpMap: bumpTex,
        bumpScale: 0.05,
      }),
      treeCount
    );
    const tier3Inst = new THREE.InstancedMesh(
      new THREE.ConeGeometry(0.96, 1.9, 9),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: foliageTex,
        roughness: 0.74,
        envMapIntensity: 0.26,
        bumpMap: bumpTex,
        bumpScale: 0.04,
      }),
      treeCount
    );
    trunkInst.castShadow = !isSoftwareGl;
    tier1Inst.castShadow = !isSoftwareGl;
    tier2Inst.castShadow = !isSoftwareGl;
    tier3Inst.castShadow = !isSoftwareGl;
    tier1Inst.receiveShadow = true;
    tier2Inst.receiveShadow = true;
    tier3Inst.receiveShadow = true;

    const treeWindData: {
      tx: number;
      tz: number;
      scale: number;
      leanX: number;
      leanZ: number;
      rotY1: number;
      rotY2: number;
      rotY3: number;
      phase: number;
    }[] = [];

    let treeIdx = 0;
    for (let i = 0; i < 230 && treeIdx < treeCount; i++) {
      const angle = (i / 230) * Math.PI * 2 + (i % 4) * 0.045;
      const cosA = Math.abs(Math.cos(angle));
      const sinA = Math.abs(Math.sin(angle));
      if (cosA < 0.12 || sinA < 0.12) continue;

      const ringBand = i % 3;
      // Place trees outside the Water Ditch (r >= 20.9) so the moat & clearing remain completely crisp
      const radius = 21.0 + ringBand * 2.55 + ((i * 37) % 10) * 0.42;
      const tx = Math.cos(angle) * radius;
      const tz = Math.sin(angle) * radius;

      // Reserve Upper-Right forest clearing for the Ladang Jagung (Cornfield)
      if (isNearCornfield(tx, tz, 6.7)) continue;

      const scale = 0.84 + ((i * 19) % 44) / 100;
      const leanX = (((i * 7) % 5) - 2) * 0.018;
      const leanZ = (((i * 11) % 5) - 2) * 0.018;
      const rotY1 = (i * 1.7) % (Math.PI * 2);
      const rotY2 = (i * 2.3) % (Math.PI * 2);
      const rotY3 = (i * 2.9) % (Math.PI * 2);

      _dummyObj.position.set(tx, 1.1 * scale, tz);
      _dummyObj.rotation.set(leanX, (i * 1.1) % (Math.PI * 2), leanZ);
      _dummyObj.scale.setScalar(scale);
      _dummyObj.updateMatrix();
      trunkInst.setMatrixAt(treeIdx, _dummyObj.matrix);

      _dummyObj.position.set(tx, 2.35 * scale, tz);
      _dummyObj.rotation.set(leanX, rotY1, leanZ);
      _dummyObj.updateMatrix();
      tier1Inst.setMatrixAt(treeIdx, _dummyObj.matrix);

      _dummyObj.position.set(tx, 3.65 * scale, tz);
      _dummyObj.rotation.set(leanX, rotY2, leanZ);
      _dummyObj.updateMatrix();
      tier2Inst.setMatrixAt(treeIdx, _dummyObj.matrix);

      _dummyObj.position.set(tx, 4.8 * scale, tz);
      _dummyObj.rotation.set(leanX, rotY3, leanZ);
      _dummyObj.updateMatrix();
      tier3Inst.setMatrixAt(treeIdx, _dummyObj.matrix);

      const isBlueSpruce = i % 5 === 0;
      const hue = isBlueSpruce ? 0.47 + ((i * 3) % 4) * 0.006 : 0.42 + ((i * 5) % 6) * 0.007;
      const sat = isBlueSpruce ? 0.62 : 0.68 + ((i * 9) % 12) * 0.01;
      const shade = 0.16 + ((i * 13) % 10) / 100;
      _color.setHSL(hue, sat, shade);
      tier1Inst.setColorAt(treeIdx, _color);
      _color.setHSL(hue - 0.01, sat + 0.04, shade + 0.055);
      tier2Inst.setColorAt(treeIdx, _color);
      _color.setHSL(hue - 0.015, sat + 0.06, shade + 0.115);
      tier3Inst.setColorAt(treeIdx, _color);

      treeWindData.push({
        tx,
        tz,
        scale,
        leanX,
        leanZ,
        rotY1,
        rotY2,
        rotY3,
        phase: (i * 0.83) % (Math.PI * 2),
      });

      treeIdx++;
    }
    trunkInst.count = treeIdx;
    tier1Inst.count = treeIdx;
    tier2Inst.count = treeIdx;
    tier3Inst.count = treeIdx;
    trunkInst.instanceMatrix.needsUpdate = true;
    tier1Inst.instanceMatrix.needsUpdate = true;
    tier2Inst.instanceMatrix.needsUpdate = true;
    tier3Inst.instanceMatrix.needsUpdate = true;
    if (tier1Inst.instanceColor) tier1Inst.instanceColor.needsUpdate = true;
    if (tier2Inst.instanceColor) tier2Inst.instanceColor.needsUpdate = true;
    if (tier3Inst.instanceColor) tier3Inst.instanceColor.needsUpdate = true;
    trunkInst.computeBoundingSphere();
    tier1Inst.computeBoundingSphere();
    tier2Inst.computeBoundingSphere();
    tier3Inst.computeBoundingSphere();
    scene.add(trunkInst, tier1Inst, tier2Inst, tier3Inst);

    // 2A-Cornfield. Ladang Jagung (Upper-Right Forest Cornfield Plot + 72 Swaying Golden Corn Stalks)
    const cornDecor = createCornfieldDecorModel(soilFurrowTex);
    cornDecor.position.set(cornCenterX, 0, cornCenterZ);
    cornDecor.rotation.y = cornRotY;
    scene.add(cornDecor);

    const cornRows = 6;
    const cornCols = 12;
    const cornStalkCount = cornRows * cornCols;
    const cornStalkGeo = new THREE.CylinderGeometry(0.045, 0.075, 1.55, 6);
    cornStalkGeo.translate(0, 0.78, 0);
    const cornStalkInst = new THREE.InstancedMesh(
      cornStalkGeo,
      new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.76, envMapIntensity: 0.18 }),
      cornStalkCount
    );
    const cornCobGeo = new THREE.CylinderGeometry(0.085, 0.1, 0.42, 7);
    const cornCobInst = new THREE.InstancedMesh(
      cornCobGeo,
      new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: 0xca8a04,
        emissiveIntensity: 0.25,
        roughness: 0.44,
      }),
      cornStalkCount
    );
    const cornTasselGeo = new THREE.ConeGeometry(0.12, 0.34, 5);
    const cornTasselInst = new THREE.InstancedMesh(
      cornTasselGeo,
      new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.72 }),
      cornStalkCount
    );
    cornStalkInst.castShadow = !isSoftwareGl;
    cornCobInst.castShadow = !isSoftwareGl;

    const cornWindData: {
      wx: number;
      wz: number;
      rotY: number;
      scaleY: number;
      phase: number;
    }[] = [];
    const cosCorn = Math.cos(cornRotY);
    const sinCorn = Math.sin(cornRotY);
    let cornIdx = 0;
    for (let r = 0; r < cornRows; r++) {
      for (let c = 0; c < cornCols; c++) {
        const localX = -3.7 + c * 0.67 + ((r % 2) * 0.12 - 0.06);
        const localZ = -2.35 + r * 0.94 + (((c * 3) % 5) - 2) * 0.03;
        // Leave a small clearing around the Scarecrow near (0.2, -0.4)
        if (Math.hypot(localX - 0.2, localZ + 0.4) < 0.95) continue;

        const wx = cornCenterX + localX * cosCorn + localZ * sinCorn;
        const wz = cornCenterZ - localX * sinCorn + localZ * cosCorn;
        const scaleY = 0.86 + ((r * 7 + c * 11) % 30) / 100;
        const rotY = (r * 1.1 + c * 0.7) % (Math.PI * 2);

        _dummyObj.position.set(wx, 0.12, wz);
        _dummyObj.rotation.set(0, rotY, 0);
        _dummyObj.scale.set(1, scaleY, 1);
        _dummyObj.updateMatrix();
        cornStalkInst.setMatrixAt(cornIdx, _dummyObj.matrix);

        _dummyObj.position.set(wx + Math.cos(rotY) * 0.08, 0.12 + 0.92 * scaleY, wz + Math.sin(rotY) * 0.08);
        _dummyObj.rotation.set(0.24, rotY, 0.3);
        _dummyObj.scale.setScalar(1);
        _dummyObj.updateMatrix();
        cornCobInst.setMatrixAt(cornIdx, _dummyObj.matrix);

        _dummyObj.position.set(wx, 0.12 + 1.62 * scaleY, wz);
        _dummyObj.rotation.set(0, rotY, 0);
        _dummyObj.scale.setScalar(1);
        _dummyObj.updateMatrix();
        cornTasselInst.setMatrixAt(cornIdx, _dummyObj.matrix);

        cornWindData.push({
          wx,
          wz,
          rotY,
          scaleY,
          phase: (r * 0.6 + c * 0.35) % (Math.PI * 2),
        });
        cornIdx++;
      }
    }
    cornStalkInst.count = cornIdx;
    cornCobInst.count = cornIdx;
    cornTasselInst.count = cornIdx;
    cornStalkInst.instanceMatrix.needsUpdate = true;
    cornCobInst.instanceMatrix.needsUpdate = true;
    cornTasselInst.instanceMatrix.needsUpdate = true;
    cornStalkInst.computeBoundingSphere();
    cornCobInst.computeBoundingSphere();
    cornTasselInst.computeBoundingSphere();
    scene.add(cornStalkInst, cornCobInst, cornTasselInst);

    // 2B. Fallen Trees / Mossy Hollow Logs (Pohon Tumbang) outside clearing moat & away from Cornfield/Nodes
    const fallenLogCount = 24;
    const fallenLogGeo = new THREE.CylinderGeometry(0.26, 0.35, 3.4, 8);
    fallenLogGeo.rotateZ(Math.PI / 2);
    const fallenLogInst = new THREE.InstancedMesh(
      fallenLogGeo,
      new THREE.MeshStandardMaterial({
        color: 0x6e472b,
        map: barkTex,
        roughness: 0.92,
        envMapIntensity: 0.15,
        bumpMap: bumpTex,
        bumpScale: 0.09,
      }),
      fallenLogCount
    );
    const fallenMossGeo = new THREE.BoxGeometry(2.55, 0.14, 0.36);
    const fallenMossInst = new THREE.InstancedMesh(
      fallenMossGeo,
      new THREE.MeshStandardMaterial({
        color: 0x4d8a32,
        roughness: 0.88,
        envMapIntensity: 0.14,
      }),
      fallenLogCount
    );
    const fallenBranchGeo = new THREE.CylinderGeometry(0.07, 0.13, 1.05, 6);
    const fallenBranchInst = new THREE.InstancedMesh(
      fallenBranchGeo,
      new THREE.MeshStandardMaterial({
        color: 0x5c3a21,
        map: barkTex,
        roughness: 0.9,
      }),
      fallenLogCount
    );
    fallenLogInst.castShadow = !isSoftwareGl;
    fallenLogInst.receiveShadow = true;
    fallenMossInst.receiveShadow = true;

    const fallenLogPositions: { x: number; z: number; yaw: number; scale: number }[] = [];
    let fLogIdx = 0;
    for (let i = 0; i < 64 && fLogIdx < fallenLogCount; i++) {
      const angle = (i / 64) * Math.PI * 2 + 0.21;
      if (Math.abs(Math.cos(angle)) < 0.2 || Math.abs(Math.sin(angle)) < 0.2) continue;

      const radius = 21.6 + (i % 2) * 2.4 + ((i * 19) % 7) * 0.22;
      const lx = Math.cos(angle) * radius;
      const lz = Math.sin(angle) * radius;
      if (isNearCornfield(lx, lz, 6.8) || isNearResourceNode(lx, lz, 3.2)) continue;

      const lScale = 0.78 + ((i * 13) % 36) / 100;
      const yaw = angle + Math.PI / 2 + (((i * 7) % 5) - 2) * 0.28;

      _dummyObj.position.set(lx, 0.25 * lScale, lz);
      _dummyObj.rotation.set(0.03, yaw, -0.04);
      _dummyObj.scale.setScalar(lScale);
      _dummyObj.updateMatrix();
      fallenLogInst.setMatrixAt(fLogIdx, _dummyObj.matrix);

      _dummyObj.position.set(lx, 0.51 * lScale, lz);
      _dummyObj.rotation.set(0.03, yaw, -0.04);
      _dummyObj.scale.setScalar(lScale);
      _dummyObj.updateMatrix();
      fallenMossInst.setMatrixAt(fLogIdx, _dummyObj.matrix);

      _dummyObj.position.set(
        lx + Math.cos(yaw) * 0.65 * lScale,
        0.66 * lScale,
        lz - Math.sin(yaw) * 0.65 * lScale
      );
      _dummyObj.rotation.set(0.35, yaw + 0.4, -0.28);
      _dummyObj.scale.setScalar(lScale);
      _dummyObj.updateMatrix();
      fallenBranchInst.setMatrixAt(fLogIdx, _dummyObj.matrix);

      fallenLogPositions.push({ x: lx, z: lz, yaw, scale: lScale });
      fLogIdx++;
    }
    fallenLogInst.count = fLogIdx;
    fallenMossInst.count = fLogIdx;
    fallenBranchInst.count = fLogIdx;
    fallenLogInst.instanceMatrix.needsUpdate = true;
    fallenMossInst.instanceMatrix.needsUpdate = true;
    fallenBranchInst.instanceMatrix.needsUpdate = true;
    fallenLogInst.computeBoundingSphere();
    fallenMossInst.computeBoundingSphere();
    fallenBranchInst.computeBoundingSphere();
    scene.add(fallenLogInst, fallenMossInst, fallenBranchInst);

    // 2C. Lush Forest Ferns (Pakis Hutan) clustered around fallen logs
    const fernCount = 120;
    const fernBladeGeo = new THREE.ConeGeometry(0.28, 1.18, 4);
    fernBladeGeo.translate(0, 0.55, 0);
    const fernInst = new THREE.InstancedMesh(
      fernBladeGeo,
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.78,
        metalness: 0.04,
        envMapIntensity: 0.18,
      }),
      fernCount
    );
    fernInst.castShadow = !isSoftwareGl;
    const fernWindData: {
      fx: number;
      fz: number;
      rotY: number;
      tiltX: number;
      scale: number;
      phase: number;
    }[] = [];
    let fernIdx = 0;
    for (let i = 0; i < fallenLogPositions.length && fernIdx < fernCount; i++) {
      const log = fallenLogPositions[i];
      for (let frond = 0; frond < 5 && fernIdx < fernCount; frond++) {
        const frondYaw = (frond / 5) * Math.PI * 2 + (i % 3) * 0.3;
        const offsetDist = 0.65 + (i % 2) * 0.25;
        const fx = log.x + Math.cos(log.yaw + 1.3) * offsetDist;
        const fz = log.z + Math.sin(log.yaw + 1.3) * offsetDist;
        const fScale = 0.68 + ((i * 11 + frond * 7) % 35) / 100;
        const tiltX = 0.58 + (frond % 2) * 0.14;

        _dummyObj.position.set(fx, 0.05, fz);
        _dummyObj.rotation.set(tiltX, frondYaw, 0);
        _dummyObj.scale.set(fScale * 1.15, fScale, fScale * 0.32);
        _dummyObj.updateMatrix();
        fernInst.setMatrixAt(fernIdx, _dummyObj.matrix);

        _color.setHSL(0.36 + (frond % 3) * 0.01, 0.66, 0.26 + (frond % 3) * 0.03);
        fernInst.setColorAt(fernIdx, _color);

        fernWindData.push({
          fx,
          fz,
          rotY: frondYaw,
          tiltX,
          scale: fScale,
          phase: i * 0.7 + frond * 0.5,
        });
        fernIdx++;
      }
    }
    fernInst.count = fernIdx;
    fernInst.instanceMatrix.needsUpdate = true;
    if (fernInst.instanceColor) fernInst.instanceColor.needsUpdate = true;
    fernInst.computeBoundingSphere();
    scene.add(fernInst);

    // 2D. Woodland Toadstool Mushroom Clusters beside fallen logs
    const mushroomCount = 56;
    const mushStemInst = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.06, 0.09, 0.28, 7),
      new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.82 }),
      mushroomCount
    );
    const mushCapInst = new THREE.InstancedMesh(
      new THREE.ConeGeometry(0.24, 0.22, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.65 }),
      mushroomCount
    );
    let mIdx = 0;
    for (let i = 0; i < fallenLogPositions.length && mIdx < mushroomCount; i++) {
      const log = fallenLogPositions[i];
      for (let c = 0; c < 2 && mIdx < mushroomCount; c++) {
        const mx = log.x - Math.cos(log.yaw + 0.8) * (0.55 + c * 0.35);
        const mz = log.z - Math.sin(log.yaw + 0.8) * (0.55 + c * 0.35);
        const mScale = 0.75 + ((i * 7 + c * 13) % 45) / 100;

        _dummyObj.position.set(mx, 0.14 * mScale, mz);
        _dummyObj.rotation.set(0, i + c, 0);
        _dummyObj.scale.setScalar(mScale);
        _dummyObj.updateMatrix();
        mushStemInst.setMatrixAt(mIdx, _dummyObj.matrix);

        _dummyObj.position.set(mx, 0.31 * mScale, mz);
        _dummyObj.updateMatrix();
        mushCapInst.setMatrixAt(mIdx, _dummyObj.matrix);

        if ((i + c) % 3 === 0) {
          _color.setHex(0xf59e0b);
        } else {
          _color.setHex(0xdc2626);
        }
        mushCapInst.setColorAt(mIdx, _color);
        mIdx++;
      }
    }
    mushStemInst.count = mIdx;
    mushCapInst.count = mIdx;
    mushStemInst.instanceMatrix.needsUpdate = true;
    mushCapInst.instanceMatrix.needsUpdate = true;
    if (mushCapInst.instanceColor) mushCapInst.instanceColor.needsUpdate = true;
    mushStemInst.computeBoundingSphere();
    mushCapInst.computeBoundingSphere();
    scene.add(mushStemInst, mushCapInst);

    // Instanced Forest Edge Boulders & Undergrowth Shrubs outside the water moat
    const boulderCount = 44;
    const boulderInst = new THREE.InstancedMesh(
      new THREE.DodecahedronGeometry(0.62, 1),
      new THREE.MeshStandardMaterial({
        color: 0x6b7864,
        roughness: 0.92,
        metalness: 0.04,
        envMapIntensity: 0.16,
        bumpMap: bumpTex,
        bumpScale: 0.09,
      }),
      boulderCount
    );
    boulderInst.castShadow = !isSoftwareGl;
    boulderInst.receiveShadow = true;
    let bIdx = 0;
    for (let i = 0; i < 84 && bIdx < boulderCount; i++) {
      const angle = (i / 84) * Math.PI * 2 + 0.04;
      if (Math.abs(Math.cos(angle)) < 0.14 || Math.abs(Math.sin(angle)) < 0.14) continue;
      const radius = 20.5 + ((i * 23) % 10) * 0.38;
      const bx = Math.cos(angle) * radius;
      const bz = Math.sin(angle) * radius;
      if (isNearCornfield(bx, bz, 6.4) || isNearResourceNode(bx, bz, 3.0)) continue;
      const bScale = 0.52 + ((i * 17) % 50) / 100;

      _dummyObj.position.set(bx, 0.2 * bScale, bz);
      _dummyObj.rotation.set((i * 0.7) % 3, (i * 1.3) % 6, (i * 0.5) % 3);
      _dummyObj.scale.set(bScale * 1.25, bScale * 0.75, bScale);
      _dummyObj.updateMatrix();
      boulderInst.setMatrixAt(bIdx, _dummyObj.matrix);

      if (i % 2 === 0) {
        _color.setHSL(0.28, 0.16, 0.34 + ((i * 7) % 10) / 100);
      } else {
        _color.setHSL(0.43, 0.55, 0.22 + ((i * 9) % 10) / 100);
      }
      boulderInst.setColorAt(bIdx, _color);
      bIdx++;
    }
    boulderInst.count = bIdx;
    boulderInst.instanceMatrix.needsUpdate = true;
    if (boulderInst.instanceColor) boulderInst.instanceColor.needsUpdate = true;
    boulderInst.computeBoundingSphere();
    scene.add(boulderInst);

    // Central Woodland Timber & Cobblestone House (Rumah) at (0, 0) + Outer Square Fence Corner Bastions
    const fortGroup = createCentralFortModel();
    scene.add(fortGroup);

    const cornerBastions = createSquareCornerBastionPosts(FENCE_HALF_EXTENT);
    scene.add(cornerBastions);

    // Ranger Rue Rig
    const rueRig = createRangerRueModel();
    rueRig.group.position.set(0, 0, 4.0);
    scene.add(rueRig.group);

    // Lantern Flare Expanding Fiery Shockwave Rings & 3D Flame Pillars
    const flareRingGeo = new THREE.RingGeometry(0.6, 1.0, 32);
    flareRingGeo.rotateX(-Math.PI / 2);
    const flareRingMat = new THREE.MeshBasicMaterial({
      color: 0xff5a1f,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const flareRingMesh = new THREE.Mesh(flareRingGeo, flareRingMat);
    flareRingMesh.position.y = 0.18;
    scene.add(flareRingMesh);

    const flareCoreRingMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const flareCoreRingMesh = new THREE.Mesh(
      new THREE.RingGeometry(0.38, 0.72, 28).rotateX(-Math.PI / 2),
      flareCoreRingMat
    );
    flareCoreRingMesh.position.y = 0.24;
    scene.add(flareCoreRingMesh);

    // Pre-allocated 3D Fire Plumes & Flame Tongues Group (Zero-GC)
    const flareOuterFlameMat = new THREE.MeshBasicMaterial({
      color: 0xff4500,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const flareInnerFlameMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const flareFireGroup = new THREE.Group();
    flareFireGroup.visible = false;
    const outerFlameGeo = new THREE.ConeGeometry(0.68, 2.9, 8);
    const innerFlameGeo = new THREE.ConeGeometry(0.36, 1.9, 7);
    const flareFlameTongues: {
      holder: THREE.Group;
      angle: number;
      isCenter: boolean;
      phase: number;
    }[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const holder = new THREE.Group();
      const outer = new THREE.Mesh(outerFlameGeo, flareOuterFlameMat);
      outer.position.y = 1.45;
      const inner = new THREE.Mesh(innerFlameGeo, flareInnerFlameMat);
      inner.position.y = 0.95;
      holder.add(outer, inner);
      flareFireGroup.add(holder);
      flareFlameTongues.push({ holder, angle, isCenter: false, phase: i * 0.9 });
    }
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + 0.3;
      const holder = new THREE.Group();
      const outer = new THREE.Mesh(outerFlameGeo, flareOuterFlameMat);
      outer.position.y = 1.5;
      const inner = new THREE.Mesh(innerFlameGeo, flareInnerFlameMat);
      inner.position.y = 1.02;
      holder.add(outer, inner);
      flareFireGroup.add(holder);
      flareFlameTongues.push({ holder, angle, isCenter: true, phase: i * 1.4 });
    }
    scene.add(flareFireGroup);

    // Selected Pad Highlight Ring + Move Target Ring
    const selectRingGeo = new THREE.RingGeometry(1.42, 1.62, 24);
    selectRingGeo.rotateX(-Math.PI / 2);
    const selectRingMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const selectRingMesh = new THREE.Mesh(selectRingGeo, selectRingMat);
    selectRingMesh.position.y = 0.08;
    selectRingMesh.visible = false;
    scene.add(selectRingMesh);

    const moveTargetRing = new THREE.Mesh(
      new THREE.RingGeometry(0.32, 0.46, 16).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({
        color: 0x4ade80,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      })
    );
    moveTargetRing.position.y = 0.06;
    scene.add(moveTargetRing);

    // Boss Windup Telegraph Ring
    const bossTelegraphRing = new THREE.Mesh(
      new THREE.RingGeometry(0.4, 3.2, 24).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({
        color: 0xef4444,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    bossTelegraphRing.position.y = 0.09;
    scene.add(bossTelegraphRing);

    // Pooled Particle InstancedMesh
    const particleMesh = new THREE.InstancedMesh(
      new THREE.OctahedronGeometry(0.16, 0),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
      MAX_PARTICLES
    );
    particleMesh.frustumCulled = false;
    const particlePool: ParticleSlot[] = [];
    for (let i = 0; i < MAX_PARTICLES; i++) {
      particlePool.push({
        active: false,
        x: 0,
        y: -10,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 0.5,
        scale: 1,
        colorHex: 0xffffff,
      });
      _dummyObj.position.set(0, -10, 0);
      _dummyObj.scale.setScalar(0);
      _dummyObj.updateMatrix();
      particleMesh.setMatrixAt(i, _dummyObj.matrix);
      particleMesh.setColorAt(i, _color.setHex(0xffffff));
    }
    particleMesh.instanceMatrix.needsUpdate = true;
    if (particleMesh.instanceColor) particleMesh.instanceColor.needsUpdate = true;
    scene.add(particleMesh);

    let nextParticleCursor = 0;
    function spawnParticles(
      x: number,
      y: number,
      z: number,
      count: number,
      colorHex: number,
      speed = 4.2
    ) {
      for (let i = 0; i < count; i++) {
        const slot = particlePool[nextParticleCursor];
        nextParticleCursor = (nextParticleCursor + 1) % MAX_PARTICLES;
        const angle = Math.random() * Math.PI * 2;
        const spd = (0.4 + Math.random() * 0.8) * speed;
        slot.active = true;
        slot.x = x;
        slot.y = y;
        slot.z = z;
        slot.vx = Math.cos(angle) * spd;
        slot.vy = 2.2 + Math.random() * 3.2;
        slot.vz = Math.sin(angle) * spd;
        slot.maxLife = 0.32 + Math.random() * 0.25;
        slot.life = slot.maxLife;
        slot.scale = 0.7 + Math.random() * 0.7;
        slot.colorHex = colorHex;
      }
    }

    // 3. Mutable Simulation & Daily Persistence State
    let dailyState: DailyPersistenceState = loadDailyStateFromStorage();
    let lastRunSummary: RunCompletionSummary | null = null;
    let nightsSurvivedThisRun = 0;

    function applyEquippedLanternVisuals() {
      const spec =
        LANTERN_COSMETICS[dailyState.equippedLanternId] ?? LANTERN_COSMETICS.amber_default;
      rueLanternLight.color.setHex(spec.threeColor);
      flareRingMat.color.setHex(
        dailyState.equippedLanternId === 'amber_default' ? 0xff5a1f : spec.threeColor
      );
      const lMat = rueRig.lanternMesh.material as THREE.MeshStandardMaterial;
      lMat.emissive.setHex(spec.threeColor);
      const haloMat = rueRig.lanternHaloMesh.material as THREE.MeshBasicMaterial;
      haloMat.color.setHex(spec.threeColor);
    }
    applyEquippedLanternVisuals();

    function applyTaskEvent(event: {
      woodCollectedDelta?: number;
      flaresUsedDelta?: number;
      buildingsBuiltDelta?: number;
      consecutiveNightsSurvived?: number;
      runScore?: number;
    }) {
      const res = recordTaskProgress(dailyState, event);
      dailyState = res.updatedState;
      saveDailyStateToStorage(dailyState);
      for (const title of res.newlyCompletedTaskTitles) {
        addCallout(`Task Done: ${title}!`, rueX, 2.7, rueZ, '#4ade80', 1.8);
      }
      if (res.allThreeJustCompleted) {
        addCallout('All 3 Daily Tasks Done! +100 Coins & +1 Ticket Tomorrow!', rueX, 3.2, rueZ, '#fbbf24', 2.4);
      }
    }

    const autostart = new URLSearchParams(window.location.search).get('autostart') === '1';
    let screenState: GameScreenState = 'title';
    if (autostart) {
      const ticketRes = consumeTicketForRun(dailyState);
      if (ticketRes.allowed) {
        dailyState = ticketRes.updatedState;
        saveDailyStateToStorage(dailyState);
        screenState = 'playing';
      }
    }
    document.body.dataset.state = screenState;

    let phase: DayNightPhase = 'day';
    let dayNumber = 1;
    let phaseTimeRemaining = DAY_DURATION_SECONDS;
    let fortHp = FORT_MAX_HP;
    let fortGhostHp = FORT_MAX_HP;
    let resources: Resources = { ...INITIAL_RESOURCES };
    let score = 0;
    let bestScore = 0;
    let zombiesDefeated = 0;
    let flareCooldown = 0;
    let flareWaveTimer = 0;
    let flareOriginX = 0;
    let flareOriginZ = 0;
    let selectedPadId: number | null = null;
    let selectedFenceId: number | null = null;
    let runOutcome: 'victory' | 'defeat' | null = null;
    let elapsedRunSeconds = 0;
    let statusBanner: string | null = 'Day 1: Gather resources & fortify the fort before nightfall!';
    let statusBannerTimer = 4.5;
    let cameraZoom = 1.0;
    let dockCollapsed = false;
    let cameraTrauma = 0;
    let hitstopTimer = 0;
    let nightBlend = 0; // 0 = Day, 1 = Night

    // Rue kinematics & construction animation state
    let rueX = 0;
    let rueZ = 4.0;
    let rueRotationY = 0;
    let rueWalkPhase = 0;
    let rueHammerSwingTimer = 0;
    let rueGatherCooldown = 0;
    let rueAttackCooldown = 0;
    let moveTarget: { x: number; z: number } | null = null;
    let moveTargetAlpha = 0;
    let heroAnimState: HeroAnimState = 'idle';
    let pendingConstruction: PendingConstructionTask | null = null;
    let constructionSparkTimer = 0;
    document.body.dataset.heroAnim = heroAnimState;

    // Placement Pads (8 Inner Weapon Pads) & Outer 12-Segment Square Fence
    let pads: PlacementPad[] = createInitialPads();
    let fenceSegments: FenceSegment[] = createInitialFenceSegments();
    const padMeshesMap = new Map<number, THREE.Group>();
    const buildingMeshesMap = new Map<number, THREE.Group>();
    const fenceMeshesMap = new Map<number, THREE.Group>();
    const interactableTargets: THREE.Object3D[] = [outerGround, clearingDisc];

    function rebuildFenceVisuals() {
      fenceSegments.forEach((seg) => {
        const existing = fenceMeshesMap.get(seg.id);
        if (existing) {
          scene.remove(existing);
          const idx = interactableTargets.indexOf(existing);
          if (idx !== -1) interactableTargets.splice(idx, 1);
          fenceMeshesMap.delete(seg.id);
        }
        const fMesh = createFenceSegmentModel(seg);
        fMesh.userData = { kind: 'fence', fenceId: seg.id };
        fMesh.traverse((c) => {
          c.userData = { kind: 'fence', fenceId: seg.id };
        });
        scene.add(fMesh);
        fenceMeshesMap.set(seg.id, fMesh);
        interactableTargets.push(fMesh);
      });
    }
    rebuildFenceVisuals();

    function rebuildPadVisuals() {
      pads.forEach((pad) => {
        if (!padMeshesMap.has(pad.id)) {
          const padMesh = createPlacementPadMesh(pad.ring);
          padMesh.position.set(pad.x, 0, pad.z);
          if (pad.rotationY) padMesh.rotation.y = pad.rotationY;
          padMesh.userData = { kind: 'pad', padId: pad.id };
          padMesh.traverse((c) => {
            c.userData = { kind: 'pad', padId: pad.id };
          });
          scene.add(padMesh);
          padMeshesMap.set(pad.id, padMesh);
          interactableTargets.push(padMesh);
        }

        const existingBld = buildingMeshesMap.get(pad.id);
        if (existingBld) {
          scene.remove(existingBld);
          const idx = interactableTargets.indexOf(existingBld);
          if (idx !== -1) interactableTargets.splice(idx, 1);
          buildingMeshesMap.delete(pad.id);
        }
        if (pad.building) {
          const bldMesh = createBuildingModel(pad.building.type, pad.building.upgradePath);
          bldMesh.position.set(pad.x, 0.14, pad.z);
          if (pad.rotationY) bldMesh.rotation.y = pad.rotationY;
          bldMesh.userData = { kind: 'pad', padId: pad.id };
          bldMesh.traverse((c) => {
            c.userData = { kind: 'pad', padId: pad.id };
          });
          scene.add(bldMesh);
          buildingMeshesMap.set(pad.id, bldMesh);
          interactableTargets.push(bldMesh);
        }
      });
    }
    rebuildPadVisuals();

    // Forest Resource Nodes (Wood, Stone, Food) positioned in clear visible zones outside the ±9.6m Square Fence
    const nodeMeshesMap = new Map<number, THREE.Group>();
    resourceNodes.forEach((node) => {
      const m = createResourceNodeModel(node.type);
      m.position.set(node.x, 0, node.z);
      m.userData = { kind: 'node', nodeId: node.id };
      m.traverse((c) => {
        c.userData = { kind: 'node', nodeId: node.id };
      });
      scene.add(m);
      nodeMeshesMap.set(node.id, m);
      interactableTargets.push(m);
    });

    // Zombies, Projectiles, Slime Patches & Floating Callouts
    let zombies: ZombieEntity[] = [];
    const zombieMeshesMap = new Map<number, THREE.Group>();
    let pendingWaveQueue: ZombieArchetype[] = [];
    let waveSpawnTimer = 0;
    let totalWaveZombies = 0;
    let nextEntityId = 1000;

    let projectiles: ProjectileEntity[] = [];
    const projectileMeshesMap = new Map<number, THREE.Mesh>();
    const projectileGeo = new THREE.DodecahedronGeometry(0.22, 0);

    let slimePatches: SlimePatch[] = [];
    const slimeMeshesMap = new Map<number, THREE.Mesh>();
    const slimeGeo = new THREE.CircleGeometry(1, 14);
    slimeGeo.rotateX(-Math.PI / 2);
    const slimeMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });

    let callouts: FloatingCallout[] = [];

    function addCallout(text: string, x: number, y: number, z: number, color = '#fef08a', ttl = 1.3) {
      // Push any existing nearby callouts upward so they never overlap in screen space
      for (const existing of callouts) {
        if (Math.hypot(existing.x - x, existing.z - z) < 2.5) {
          existing.y += 0.65;
        }
      }
      callouts.push({
        id: nextEntityId++,
        text,
        x,
        y,
        z,
        color,
        ttl,
        maxTtl: ttl,
      });
      if (callouts.length > 12) {
        callouts.shift();
      }
    }

    let lastNightLockedNoticeTime = 0;

    function setBanner(msg: string, duration = 3.5) {
      statusBanner = msg;
      statusBannerTimer = duration;
    }

    function notifyNightBuildLocked() {
      const now = performance.now();
      if (now - lastNightLockedNoticeTime < 450) return;
      lastNightLockedNoticeTime = now;
      setBanner(NIGHT_BUILD_LOCKED_MESSAGE, 2.8);
      addCallout(NIGHT_BUILD_LOCKED_MESSAGE, rueX, 2.3, rueZ, '#f87171', 1.4);
      syncHud(true);
    }

    function stripZombieArmorVisuals(z: ZombieEntity) {
      const zMesh = zombieMeshesMap.get(z.id);
      if (zMesh) {
        zMesh.traverse((child) => {
          if (child.userData?.isArmorPiece) {
            child.visible = false;
          }
        });
      }
      spawnParticles(z.x, 1.3, z.z, 18, 0x38bdf8, 5.4);
      addCallout('ARMOR SHATTERED!', z.x, 2.5, z.z, '#38bdf8', 1.5);
    }

    function spawnZombie(type: ZombieArchetype, spawnDist = 15.2, edgeOverride?: number) {
      const spec = ZOMBIE_CATALOG[type];
      // Spawn along one of the 4 forest edge trails (N, E, S, W)
      const edge = edgeOverride !== undefined ? edgeOverride % 4 : Math.floor(Math.random() * 4);
      const jitter = (Math.random() - 0.5) * 2.4;
      let sx = 0;
      let sz = 0;
      if (edge === 0) {
        sx = jitter;
        sz = -spawnDist;
      } else if (edge === 1) {
        sx = spawnDist;
        sz = jitter;
      } else if (edge === 2) {
        sx = jitter;
        sz = spawnDist;
      } else {
        sx = -spawnDist;
        sz = jitter;
      }

      const quip = spec.quips[Math.floor(Math.random() * spec.quips.length)];
      const initialArmor = spec.armorHp ?? 0;
      const zEntity: ZombieEntity = {
        id: nextEntityId++,
        type,
        name: spec.name,
        x: sx,
        z: sz,
        vx: 0,
        vz: 0,
        rotationY: Math.atan2(-sx, -sz),
        hp: spec.maxHp,
        maxHp: spec.maxHp,
        armorHp: initialArmor,
        maxArmorHp: initialArmor,
        baseSpeed: spec.speed,
        damage: spec.damage,
        attackCooldown: 0.6,
        slowTimer: 0,
        poisonTimer: 0,
        hitFlashTimer: 0,
        windupTimer: 0,
        isWindingUp: false,
        dashTimer: 0,
        frenzyTimer: 0,
        howlCooldown: type === 'bone_howler' ? 2.4 : 0,
        koTimer: 0,
        isDead: false,
        quipText: quip,
        quipTimer: 4.2,
        walkPhase: Math.random() * Math.PI * 2,
        slimeDropTimer: type === 'swift_stumbler' ? 0 : 1.5,
      };
      zombies.push(zEntity);

      const zMesh = createZombieModel(type, pajamaTex);
      zMesh.position.set(sx, 0, sz);
      zMesh.rotation.y = zEntity.rotationY;
      scene.add(zMesh);
      zombieMeshesMap.set(zEntity.id, zMesh);

      if (type === 'baron') {
        cameraTrauma = Math.min(1.0, cameraTrauma + 0.75);
        soundFX.playBossEntrance();
        setBanner(`Baron Blight enters the clearing: "${quip}"`, 5.0);
      }
    }

    function beginNightPhase(earlyBonus = false) {
      if (phase === 'night') return;
      phase = 'night';
      if (pendingConstruction) {
        pendingConstruction = null;
        heroAnimState = 'idle';
        document.body.dataset.heroAnim = heroAnimState;
      }
      if (earlyBonus) {
        resources = { ...resources, tickets: resources.tickets + 1 };
        addCallout('+1 Early Night Ticket!', rueX, 2.2, rueZ, '#fbbf24', 1.8);
      }
      pendingWaveQueue = getWaveComposition(dayNumber);
      totalWaveZombies = pendingWaveQueue.length;
      // Immediately spawn 3 vanguard zombies (Swift Stumbler, Armored Undead, etc.) on East, West & South trails
      const vanguardTrails = [1, 3, 2, 0];
      for (let i = 0; i < 3 && pendingWaveQueue.length > 0; i++) {
        const vanguard = pendingWaveQueue.shift()!;
        spawnZombie(vanguard, 10.6 + i * 1.1, vanguardTrails[i]);
      }
      waveSpawnTimer = 0.85;
      soundFX.playNightHorn();
      setBanner(
        dayNumber === MAX_DAYS
          ? `Night ${dayNumber} (Final Wave): Baron Blight, Swift Stumblers & Armored Undead attack!`
          : `Night ${dayNumber}: Watch out for Swift Stumblers (Fast) & Armored Undead (Plated)!`,
        4.2
      );
      syncHud(true);
    }

    function advanceToNextDay() {
      nightsSurvivedThisRun++;
      applyTaskEvent({ consecutiveNightsSurvived: nightsSurvivedThisRun });
      dayNumber++;
      phase = 'day';
      phaseTimeRemaining = DAY_DURATION_SECONDS;

      // Replenish resource nodes & grant Guard Tent Path B bounty
      resourceNodes.forEach((n) => {
        n.amount = n.maxAmount;
        n.respawnTimer = 0;
        const m = nodeMeshesMap.get(n.id);
        if (m) m.visible = true;
      });

      let bonusWood = 20;
      let bonusFood = 15;
      pads.forEach((p) => {
        if (p.building?.type === 'guardtent' && p.building.upgradePath === 'pathB') {
          bonusWood += 20;
          bonusFood += 20;
        }
        if (p.building) {
          p.building.hp = Math.min(p.building.maxHp, p.building.hp + 45);
        }
      });
      fenceSegments.forEach((f) => {
        if (f.level > 0 && f.hp > 0) {
          f.hp = Math.min(f.maxHp, f.hp + 55);
        }
      });
      rebuildFenceVisuals();
      resources = {
        wood: resources.wood + bonusWood,
        stone: resources.stone + 15,
        food: resources.food + bonusFood,
        tickets: dailyState.tickets,
      };
      setBanner(
        `Dawn of Day ${dayNumber}: +${bonusWood}W +15S +${bonusFood}F! Build before nightfall!`,
        4.5
      );
      syncHud(true);
    }

    function finalizeRunOutcome(outcome: 'victory' | 'defeat') {
      runOutcome = outcome;
      if (outcome === 'victory') {
        nightsSurvivedThisRun = MAX_DAYS;
      }
      score = calculateRunScore({
        zombiesDefeated,
        fortHp,
        resources,
        victory: outcome === 'victory',
        dayNumber,
      });
      bestScore = Math.max(bestScore, score);

      const completion = completeRunProgression(dailyState, {
        score,
        victory: outcome === 'victory',
        nightsSurvived: nightsSurvivedThisRun,
      });
      dailyState = completion.updatedState;
      lastRunSummary = completion.summary;
      saveDailyStateToStorage(dailyState);

      screenState = 'gameover';
      document.body.dataset.state = 'gameover';
      soundFX.playOutcome(outcome === 'victory');
      syncHud(true);
    }

    function resetRunState(targetScreen: GameScreenState) {
      dailyState = checkAndApplyDailyReset(dailyState);
      if (targetScreen === 'playing') {
        const ticketCheck = consumeTicketForRun(dailyState);
        if (!ticketCheck.allowed) {
          screenState = 'title';
          document.body.dataset.state = 'title';
          setBanner('No Daily Tickets remaining today! Wait for 00:00 UTC reset or exchange 50 Coins.', 4.0);
          syncHud(true);
          return;
        }
        dailyState = ticketCheck.updatedState;
        saveDailyStateToStorage(dailyState);
      }

      screenState = targetScreen;
      document.body.dataset.state = screenState;
      phase = 'day';
      dayNumber = 1;
      nightsSurvivedThisRun = 0;
      lastRunSummary = null;
      phaseTimeRemaining = DAY_DURATION_SECONDS;
      fortHp = FORT_MAX_HP;
      fortGhostHp = FORT_MAX_HP;
      resources = { ...INITIAL_RESOURCES, tickets: dailyState.tickets };
      score = 0;
      zombiesDefeated = 0;
      flareCooldown = 0;
      flareWaveTimer = 0;
      selectedPadId = null;
      selectedFenceId = null;
      runOutcome = null;
      elapsedRunSeconds = 0;
      cameraTrauma = 0;
      hitstopTimer = 0;
      rueX = 0;
      rueZ = 4.0;
      rueRotationY = 0;
      moveTarget = null;
      pendingConstruction = null;
      heroAnimState = 'idle';
      document.body.dataset.heroAnim = heroAnimState;
      keysPressed.clear();

      // Clear zombies, projectiles, slime
      zombieMeshesMap.forEach((m) => scene.remove(m));
      zombieMeshesMap.clear();
      zombies = [];
      pendingWaveQueue = [];

      projectileMeshesMap.forEach((m) => scene.remove(m));
      projectileMeshesMap.clear();
      projectiles = [];

      slimeMeshesMap.forEach((m) => scene.remove(m));
      slimeMeshesMap.clear();
      slimePatches = [];

      callouts = [];

      pads = createInitialPads();
      rebuildPadVisuals();

      fenceSegments = createInitialFenceSegments();
      rebuildFenceVisuals();

      resourceNodes.forEach((n) => {
        n.amount = n.maxAmount;
        n.respawnTimer = 0;
        const m = nodeMeshesMap.get(n.id);
        if (m) m.visible = true;
      });

      setBanner('Day 1 (-1 Ticket): Gather Wood, Stone & Food, or click a Pad to build!', 4.5);
      syncHud(true);
    }

    // 4. Controller Actions Exposed to React HUD & Keyboard
    const api: GameControllerApi = {
      startGame: () => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        resetRunState('playing');
      },
      restartGame: () => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        resetRunState('playing');
      },
      returnToTitle: () => {
        resetRunState('title');
      },
      togglePause: () => {
        if (screenState === 'playing') {
          screenState = 'paused';
          document.body.dataset.state = 'paused';
          keysPressed.clear();
          syncHud(true);
        } else if (screenState === 'paused') {
          screenState = 'playing';
          document.body.dataset.state = 'playing';
          keysPressed.clear();
          syncHud(true);
        }
      },
      finishRunEarly: () => {
        if (screenState === 'playing' || screenState === 'paused') {
          finalizeRunOutcome(fortHp > 0 && dayNumber >= MAX_DAYS ? 'victory' : 'defeat');
        }
      },
      equipLantern: (lanternId: string) => {
        if (!dailyState.cosmetics.includes(lanternId)) return;
        dailyState = { ...dailyState, equippedLanternId: lanternId };
        saveDailyStateToStorage(dailyState);
        applyEquippedLanternVisuals();
        syncHud(true);
      },
      equipTitle: (title: string) => {
        if (!dailyState.unlockedTitles.includes(title)) return;
        dailyState = { ...dailyState, equippedTitle: title };
        saveDailyStateToStorage(dailyState);
        syncHud(true);
      },
      refillTicketWithCoins: () => {
        dailyState = grantReviewTickets(dailyState, 10);
        resources = { ...resources, tickets: dailyState.tickets };
        saveDailyStateToStorage(dailyState);
        setBanner(`+10 Review Tickets Added! (${dailyState.tickets} Tickets Available)`, 2.6);
        if (screenState === 'playing') {
          addCallout('+10 Tickets!', rueX, 2.3, rueZ, '#fbbf24', 1.4);
        }
        syncHud(true);
      },
      selectPad: (padId) => {
        selectedPadId = padId;
        if (padId !== null) {
          selectedFenceId = null;
          dockCollapsed = false;
          const pad = pads.find((p) => p.id === padId);
          if (pad) {
            selectRingMesh.position.set(pad.x, 0.08, pad.z);
            selectRingMesh.visible = true;
            moveTarget = { x: pad.x * 0.82, z: pad.z * 0.82 };
            moveTargetRing.position.set(pad.x * 0.82, 0.06, pad.z * 0.82);
            moveTargetAlpha = 0.85;
          }
        } else if (selectedFenceId === null) {
          selectRingMesh.visible = false;
        }
        syncHud(true);
      },
      selectFence: (fenceId) => {
        selectedFenceId = fenceId;
        if (fenceId !== null) {
          selectedPadId = null;
          dockCollapsed = false;
          const seg = fenceSegments.find((f) => f.id === fenceId);
          if (seg) {
            selectRingMesh.position.set(seg.x, 0.08, seg.z);
            selectRingMesh.visible = true;
          }
        } else if (selectedPadId === null) {
          selectRingMesh.visible = false;
        }
        syncHud(true);
      },
      buildNextFence: () => {
        if (screenState !== 'playing') return;
        if (!canPerformConstructionInPhase(phase)) {
          notifyNightBuildLocked();
          return;
        }
        const selectedSeg =
          selectedFenceId !== null
            ? fenceSegments.find(
                (f) =>
                  f.id === selectedFenceId &&
                  (f.level === 0 || f.hp < f.maxHp || f.level === 1)
              ) ?? null
            : null;
        const targetSeg = selectedSeg ?? findNextFenceSegmentForHero(rueX, rueZ, fenceSegments);

        if (!targetSeg) {
          setBanner('All 12 Square Fence segments are already at maximum level!', 2.5);
          syncHud(true);
          return;
        }

        const startRes = startFenceConstructionTask({
          segment: targetSeg,
          resources,
          phase,
          currentTask: pendingConstruction,
        });

        if (!startRes.started) {
          if (startRes.reason === 'busy_constructing') {
            setBanner(
              `Ranger Rue is constructing ${pendingConstruction?.label ?? 'a structure'} — wait for the animation to finish!`,
              2.2
            );
          } else if (startRes.reason === 'insufficient_resources') {
            setBanner('Not enough Wood or Stone to build or upgrade that fence segment!', 2.5);
          } else if (startRes.reason === 'max_level') {
            setBanner('That fence segment is already at maximum level!', 2.2);
          }
          syncHud(true);
          return;
        }

        selectedFenceId = targetSeg.id;
        selectedPadId = null;
        selectRingMesh.position.set(targetSeg.x, 0.08, targetSeg.z);
        selectRingMesh.visible = true;
        moveTarget = { x: targetSeg.x * 0.84, z: targetSeg.z * 0.84 };
        moveTargetRing.position.set(targetSeg.x * 0.84, 0.06, targetSeg.z * 0.84);
        moveTargetAlpha = 0.85;
        rueRotationY = Math.atan2(targetSeg.x - rueX, targetSeg.z - rueZ);
        pendingConstruction = startRes.task;
        heroAnimState = startRes.heroAnimState;
        document.body.dataset.heroAnim = heroAnimState;
        constructionSparkTimer = 0.12;
        soundFX.playGatherHit('wood');
        setBanner(`Constructing ${targetSeg.label}...`, 1.4);
        syncHud(true);
      },
      buildOnSelectedPad: (type) => {
        if (screenState !== 'playing') return;
        if (!canPerformConstructionInPhase(phase)) {
          notifyNightBuildLocked();
          return;
        }
        let targetPad = pads.find((p) => p.id === selectedPadId);
        if (!targetPad || targetPad.building !== null) {
          targetPad = pads.find((p) => p.building === null);
          if (targetPad) selectedPadId = targetPad.id;
        }
        if (!targetPad) return;

        const startRes = startPadConstructionTask({
          pad: targetPad,
          resources,
          phase,
          currentTask: pendingConstruction,
          action: 'build_pad',
          buildingType: type,
        });

        if (!startRes.started) {
          const tr = TRANSLATIONS[langRef.current];
          if (startRes.reason === 'busy_constructing') {
            setBanner(
              tr.busyConstructingBanner(pendingConstruction?.label ?? 'a structure'),
              2.2
            );
          } else if (startRes.reason === 'insufficient_resources') {
            setBanner(tr.notEnoughResourcesBanner, 2.5);
          }
          syncHud(true);
          return;
        }

        const tr = TRANSLATIONS[langRef.current];
        const bName = tr.buildings[type]?.name ?? BUILDING_CATALOG[type].name;
        selectedPadId = null;
        selectedFenceId = null;
        selectRingMesh.visible = false;
        moveTarget = { x: targetPad.x * 0.82, z: targetPad.z * 0.82 };
        moveTargetRing.position.set(targetPad.x * 0.82, 0.06, targetPad.z * 0.82);
        moveTargetAlpha = 0.85;
        rueRotationY = Math.atan2(targetPad.x - rueX, targetPad.z - rueZ);
        pendingConstruction = startRes.task;
        heroAnimState = startRes.heroAnimState;
        document.body.dataset.heroAnim = heroAnimState;
        constructionSparkTimer = 0.12;
        soundFX.playGatherHit('wood');
        setBanner(tr.constructingStructureBanner(bName, targetPad.id), 1.4);
        syncHud(true);
      },
      upgradeSelectedPad: (pathId) => {
        if (screenState !== 'playing') return;
        if (!canPerformConstructionInPhase(phase)) {
          notifyNightBuildLocked();
          return;
        }
        if (selectedPadId === null) return;
        const targetPad = pads.find((p) => p.id === selectedPadId);
        if (!targetPad || !targetPad.building) return;

        const startRes = startPadConstructionTask({
          pad: targetPad,
          resources,
          phase,
          currentTask: pendingConstruction,
          action: 'upgrade_pad',
          upgradePath: pathId,
        });

        if (!startRes.started) {
          const tr = TRANSLATIONS[langRef.current];
          if (startRes.reason === 'busy_constructing') {
            setBanner(
              tr.busyConstructingBanner(pendingConstruction?.label ?? 'a structure'),
              2.2
            );
          } else if (startRes.reason === 'insufficient_resources') {
            setBanner(tr.notEnoughResourcesBanner, 2.5);
          }
          syncHud(true);
          return;
        }

        const tr = TRANSLATIONS[langRef.current];
        const upName =
          tr.buildings[targetPad.building.type]?.paths[pathId].name ??
          BUILDING_CATALOG[targetPad.building.type].paths[pathId].name;
        selectedPadId = null;
        selectRingMesh.visible = false;
        moveTarget = { x: targetPad.x * 0.82, z: targetPad.z * 0.82 };
        moveTargetRing.position.set(targetPad.x * 0.82, 0.06, targetPad.z * 0.82);
        moveTargetAlpha = 0.85;
        rueRotationY = Math.atan2(targetPad.x - rueX, targetPad.z - rueZ);
        pendingConstruction = startRes.task;
        heroAnimState = startRes.heroAnimState;
        document.body.dataset.heroAnim = heroAnimState;
        constructionSparkTimer = 0.12;
        soundFX.playGatherHit('stone');
        setBanner(tr.upgradingStructureBanner(upName, targetPad.id), 1.4);
        syncHud(true);
      },
      repairSelectedPad: () => {
        if (screenState !== 'playing') return;
        if (!canPerformConstructionInPhase(phase)) {
          notifyNightBuildLocked();
          return;
        }
        if (selectedPadId === null) return;
        const targetPad = pads.find((p) => p.id === selectedPadId);
        if (!targetPad || !targetPad.building) return;
        if (targetPad.building.hp >= targetPad.building.maxHp) return;

        const startRes = startPadConstructionTask({
          pad: targetPad,
          resources,
          phase,
          currentTask: pendingConstruction,
          action: 'repair_pad',
        });

        if (!startRes.started) {
          if (startRes.reason === 'busy_constructing') {
            setBanner(
              `Ranger Rue is constructing ${pendingConstruction?.label ?? 'a structure'} — wait for the animation to finish!`,
              2.2
            );
          } else if (startRes.reason === 'insufficient_resources') {
            setBanner('Need 10 Wood & 5 Stone to repair!', 2.0);
          }
          syncHud(true);
          return;
        }

        selectRingMesh.position.set(targetPad.x, 0.08, targetPad.z);
        selectRingMesh.visible = true;
        moveTarget = { x: targetPad.x * 0.82, z: targetPad.z * 0.82 };
        moveTargetRing.position.set(targetPad.x * 0.82, 0.06, targetPad.z * 0.82);
        moveTargetAlpha = 0.85;
        rueRotationY = Math.atan2(targetPad.x - rueX, targetPad.z - rueZ);
        pendingConstruction = startRes.task;
        heroAnimState = startRes.heroAnimState;
        document.body.dataset.heroAnim = heroAnimState;
        constructionSparkTimer = 0.12;
        soundFX.playGatherHit('wood');
        setBanner(`Repairing Pad #${targetPad.id}...`, 1.4);
        syncHud(true);
      },
      demolishSelectedPad: () => {
        if (screenState !== 'playing') return;
        if (!canPerformConstructionInPhase(phase)) {
          notifyNightBuildLocked();
          return;
        }
        if (selectedPadId === null) return;
        const targetPad = pads.find((p) => p.id === selectedPadId);
        if (!targetPad || !targetPad.building) return;
        const spec = BUILDING_CATALOG[targetPad.building.type];
        resources = {
          ...resources,
          wood: resources.wood + Math.round(spec.cost.wood * 0.5),
          stone: resources.stone + Math.round(spec.cost.stone * 0.5),
        };
        targetPad.building = null;
        rebuildPadVisuals();
        addCallout('Salvaged!', targetPad.x, 1.8, targetPad.z, '#f87171');
        syncHud(true);
      },
      triggerLanternFlare: () => {
        if (screenState !== 'playing') return;
        const flareCheck = canTriggerLanternFlare(phase, flareCooldown);
        if (!flareCheck.allowed) {
          if (flareCheck.reason === 'day_locked') {
            setBanner(FLARE_NIGHT_LOCKED_MESSAGE, 2.2);
            addCallout('Flare: Night Only!', rueX, 2.3, rueZ, '#f87171', 1.2);
            syncHud(true);
          }
          return;
        }
        flareCooldown = LANTERN_FLARE_COOLDOWN;
        flareWaveTimer = 1.15;
        flareOriginX = rueX;
        flareOriginZ = rueZ;
        soundFX.playLanternFlare();
        cameraTrauma = Math.min(1.0, cameraTrauma + 0.42);
        // Layered fire & ember burst (yellow sparks, blazing orange fire, crimson embers)
        spawnParticles(rueX, 1.0, rueZ, 22, 0xfef08a, 5.6);
        spawnParticles(rueX, 0.8, rueZ, 28, 0xff5a1f, 7.6);
        spawnParticles(rueX, 0.6, rueZ, 20, 0xef4444, 9.2);
        applyTaskEvent({ flaresUsedDelta: 1 });

        const { affectedCount, shatteredCount } = applyLanternFlareToZombies(rueX, rueZ, zombies);
        if (shatteredCount > 0) {
          for (const z of zombies) {
            if (z.maxArmorHp > 0 && z.armorHp <= 0) {
              stripZombieArmorVisuals(z);
            }
          }
        }
        addCallout(
          shatteredCount > 0
            ? `Fire Flare! (${shatteredCount} Armor Shattered!)`
            : affectedCount > 0
            ? `Fire Flare! (${affectedCount} scorched)`
            : 'Fire Flare!',
          rueX,
          2.4,
          rueZ,
          '#fb923c'
        );
        syncHud(true);
      },
      startNightEarly: () => {
        if (screenState === 'playing' && phase === 'day') {
          beginNightPhase(true);
        }
      },
      toggleDock: () => {
        dockCollapsed = !dockCollapsed;
        syncHud(true);
      },
      adjustZoom: (delta) => {
        cameraZoom = THREE.MathUtils.clamp(cameraZoom + delta, 0.62, 1.45);
        syncHud(true);
      },
    };
    controllerRef.current = api;

    // 5. Unified Input Hygiene (Keyboard + Pointer Raycasting + Blur Cleanup)
    const keysPressed = new Set<string>();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const code = e.code;

      if (screenState === 'title') {
        if (code === 'Enter' || code === 'Space') {
          e.preventDefault();
          api.startGame();
        }
        return;
      }

      if (code === 'KeyP' || code === 'Escape') {
        e.preventDefault();
        api.togglePause();
        return;
      }

      if (screenState !== 'playing') return;

      keysPressed.add(code);

      if (code === 'Space') {
        e.preventDefault();
        api.triggerLanternFlare();
      } else if (code === 'KeyF') {
        e.preventDefault();
        api.buildNextFence();
      } else if (code === 'Enter' || code === 'KeyN') {
        e.preventDefault();
        api.startNightEarly();
      } else if (code === 'KeyH') {
        api.toggleDock();
      } else if (code === 'KeyR') {
        api.repairSelectedPad();
      } else if (code === 'KeyX') {
        api.demolishSelectedPad();
      } else if (code.startsWith('Digit')) {
        const num = parseInt(code.replace('Digit', ''), 10);
        const selPad = pads.find((p) => p.id === selectedPadId);
        if (selPad && selPad.building && selPad.building.upgradePath === null) {
          if (num === 1) api.upgradeSelectedPad('pathA');
          if (num === 2) api.upgradeSelectedPad('pathB');
        } else {
          const buildOrder: BuildingType[] = [
            'palisade',
            'watchtower',
            'spiketrap',
            'campfire',
            'catapult',
            'guardtent',
          ];
          if (num >= 1 && num <= 6) {
            api.buildOnSelectedPad(buildOrder[num - 1]);
          }
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysPressed.delete(e.code);
    };

    const onWindowBlur = () => {
      keysPressed.clear();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onWindowBlur);

    // Raycasting for Click-to-Move, Node Gathering, Pad Choice Menu & Zoom (Mouse Wheel + Mobile Pinch)
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    renderer.domElement.style.touchAction = 'none';

    let isDraggingGround = false;
    let activePinchDist: number | null = null;
    let lastPinchTimestamp = 0;

    const onWheel = (e: WheelEvent) => {
      if (screenState !== 'playing') return;
      e.preventDefault();
      const zoomStep = e.deltaY > 0 ? 0.08 : -0.08;
      cameraZoom = THREE.MathUtils.clamp(cameraZoom + zoomStep, 0.62, 1.45);
      syncHud(true);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        isDraggingGround = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        activePinchDist = Math.hypot(dx, dy);
        lastPinchTimestamp = performance.now();
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (screenState !== 'playing') return;
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        if (activePinchDist !== null && activePinchDist > 8) {
          const deltaScale = (activePinchDist - dist) * 0.0035;
          cameraZoom = THREE.MathUtils.clamp(cameraZoom + deltaScale, 0.62, 1.45);
          syncHud(false);
        }
        activePinchDist = dist;
        lastPinchTimestamp = performance.now();
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        activePinchDist = null;
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (screenState !== 'playing') return;
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      if (activePinchDist !== null || performance.now() - lastPinchTimestamp < 180) return;

      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(interactableTargets, true);
      if (hits.length === 0) return;

      // 1. Clicking a Build Pad selects that pad and opens the Build Choice Menu (never auto-builds a fence/palisade!)
      const padHit = hits.find((h) => h.object.userData?.kind === 'pad');
      if (padHit) {
        isDraggingGround = false;
        const padId = padHit.object.userData.padId as number;
        api.selectPad(padId);
        const pad = pads.find((p) => p.id === padId);
        if (pad) {
          const tr = TRANSLATIONS[langRef.current];
          const padLabelLoc = tr.translatePadLabel(pad.id, pad.label);
          if (phase === 'night') {
            notifyNightBuildLocked();
          } else if (pad.building === null) {
            setBanner(
              tr.padSelectedEmptyBanner(pad.id, padLabelLoc),
              3.5
            );
            addCallout(tr.chooseBuildingCallout(pad.id), pad.x, 1.9, pad.z, '#fbbf24', 1.4);
          } else {
            const bName = tr.buildings[pad.building.type]?.name ?? BUILDING_CATALOG[pad.building.type].name;
            setBanner(
              tr.padSelectedBuiltBanner(pad.id, bName),
              3.5
            );
          }
          syncHud(true);
        }
        return;
      }

      // 2. Clicking a Resource Node walks Rue to gather that resource
      const nodeHit = hits.find((h) => h.object.userData?.kind === 'node');
      if (nodeHit) {
        isDraggingGround = false;
        const nodeId = nodeHit.object.userData.nodeId as number;
        const node = resourceNodes.find((n) => n.id === nodeId);
        if (node) {
          moveTarget = { x: node.x, z: node.z };
          moveTargetRing.position.set(node.x, 0.06, node.z);
          moveTargetAlpha = 0.9;
        }
        return;
      }

      // 3. Clicking an Outer Fence Segment selects that fence and shows the Fence action in the dock (no silent auto-build)
      const fenceHit = hits.find((h) => h.object.userData?.kind === 'fence');
      if (fenceHit) {
        isDraggingGround = false;
        const fenceId = fenceHit.object.userData.fenceId as number;
        api.selectFence(fenceId);
        const seg = fenceSegments.find((f) => f.id === fenceId);
        if (seg) {
          moveTarget = { x: seg.x * 0.84, z: seg.z * 0.84 };
          moveTargetRing.position.set(seg.x * 0.84, 0.06, seg.z * 0.84);
          moveTargetAlpha = 0.85;
          if (phase === 'night') {
            notifyNightBuildLocked();
          } else {
            const tr = TRANSLATIONS[langRef.current];
            setBanner(
              tr.fenceSelectedBanner(seg.label),
              3.2
            );
          }
          syncHud(true);
        }
        return;
      }

      // 4. Ground click / touch -> Click-to-Move & Continuous Touch Drag-to-Move
      isDraggingGround = true;
      const groundPoint = hits[0].point;
      const clampedR = Math.min(16.8, Math.hypot(groundPoint.x, groundPoint.z));
      const angle = Math.atan2(groundPoint.z, groundPoint.x);
      const gx = Math.cos(angle) * clampedR;
      const gz = Math.sin(angle) * clampedR;
      moveTarget = { x: gx, z: gz };
      moveTargetRing.position.set(gx, 0.06, gz);
      moveTargetAlpha = 0.85;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingGround || screenState !== 'playing') return;
      if (activePinchDist !== null) return;
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects([outerGround, clearingDisc], false);
      if (hits.length > 0) {
        const groundPoint = hits[0].point;
        const clampedR = Math.min(16.8, Math.hypot(groundPoint.x, groundPoint.z));
        const angle = Math.atan2(groundPoint.z, groundPoint.x);
        const gx = Math.cos(angle) * clampedR;
        const gz = Math.sin(angle) * clampedR;
        moveTarget = { x: gx, z: gz };
        moveTargetRing.position.set(gx, 0.06, gz);
        moveTargetAlpha = 0.65;
      }
    };

    const onPointerUp = () => {
      isDraggingGround = false;
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: true });
    renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
    renderer.domElement.addEventListener('touchend', onTouchEnd, { passive: true });

    // ResizeObserver for Responsive Viewport
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    window.addEventListener('resize', handleResize);

    // Pre-warm shaders on hardware GPUs
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // 6. HUD Throttle Sync Helper (<= 10Hz unless forced on discrete state change)
    let lastHudSyncTime = 0;
    function syncHud(force = false) {
      const now = performance.now();
      if (!force && now - lastHudSyncTime < 110) return;
      lastHudSyncTime = now;

      const bossEntity = zombies.find((z) => z.type === 'baron' && !z.isDead);
      const activeZombiesCount = zombies.filter((z) => !z.isDead).length + pendingWaveQueue.length;

      onHudUpdateRef.current({
        screen: screenState,
        phase,
        dayNumber,
        maxDays: MAX_DAYS,
        phaseTimeRemaining,
        fortHp,
        fortMaxHp: FORT_MAX_HP,
        fortGhostHp,
        resources: { ...resources },
        score,
        bestScore,
        zombiesRemaining: activeZombiesCount,
        totalWaveZombies,
        zombiesDefeated,
        flareCooldown,
        flareMaxCooldown: LANTERN_FLARE_COOLDOWN,
        selectedPadId,
        selectedFenceId,
        pads: pads.map((p) => ({
          ...p,
          building: p.building ? { ...p.building } : null,
        })),
        fenceSegments: fenceSegments.map((f) => ({ ...f })),
        bossActive: Boolean(bossEntity),
        bossName: bossEntity ? bossEntity.name : 'Baron Blight',
        bossHp: bossEntity ? bossEntity.hp : 0,
        bossMaxHp: bossEntity ? bossEntity.maxHp : ZOMBIE_CATALOG.baron.maxHp,
        bossSpeech: bossEntity ? bossEntity.quipText : null,
        statusBanner: statusBannerTimer > 0 ? statusBanner : null,
        runOutcome,
        elapsedRunSeconds,
        cameraZoom,
        dockCollapsed,
        heroAnimState,
        pendingConstruction: pendingConstruction ? { ...pendingConstruction } : null,
        daily: {
          ...dailyState,
          tasks: dailyState.tasks.map((t) => ({ ...t })),
          taskProgress: { ...dailyState.taskProgress },
          cosmetics: [...dailyState.cosmetics],
          unlockedTitles: [...dailyState.unlockedTitles],
          claimedStreakMilestones: [...dailyState.claimedStreakMilestones],
        },
        lastRunSummary,
      });
    }
    syncHud(true);

    // 7. Main Simulation & Render Loop (with Software-WebGL afterDraw Pacing)
    let frameId = 0;
    let isUnmounted = false;
    let lastFrameTime = performance.now();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      const poll = () => {
        if (isUnmounted) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (sync && state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    let windTime = 0;

    function stepSimulation(rawDt: number) {
      const dt = Math.min(rawDt, 0.16);
      windTime += dt;

      // Update status banner & ghost HP bar
      if (statusBannerTimer > 0) {
        statusBannerTimer = Math.max(0, statusBannerTimer - dt);
      }
      fortGhostHp = THREE.MathUtils.damp(fortGhostHp, fortHp, 3.2, dt);

      // Blood Moon Day <-> Night Lighting, Forest Darkening & Handheld Lantern Glow
      const targetNightBlend = phase === 'night' ? 1.0 : 0.0;
      nightBlend = THREE.MathUtils.damp(nightBlend, targetNightBlend, 2.2, dt);

      _color.copy(_daySkyColor).lerp(_nightSkyColor, nightBlend);
      scene.background = _color.clone();
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.copy(_color);
        scene.fog.density = THREE.MathUtils.lerp(0.014, 0.015, nightBlend);
      }
      scene.environmentIntensity = THREE.MathUtils.lerp(1.0, 0.72, nightBlend);
      keyLight.color.copy(_daySunColor).lerp(_nightMoonColor, nightBlend);
      keyLight.intensity = THREE.MathUtils.lerp(1.65, 1.25, nightBlend);
      hemiLight.color.copy(_dayHemiSky).lerp(_nightHemiSky, nightBlend);
      hemiLight.groundColor.copy(_dayHemiGround).lerp(_nightHemiGround, nightBlend);
      hemiLight.intensity = THREE.MathUtils.lerp(0.85, 0.74, nightBlend);
      rimLight.color.copy(_dayRimColor).lerp(_nightRimColor, nightBlend);
      rimLight.intensity = THREE.MathUtils.lerp(0.55, 0.82, nightBlend);
      fortWarmLight.intensity = THREE.MathUtils.lerp(0.9, 3.8, nightBlend);

      const flameFlicker =
        0.92 + Math.sin(windTime * 11.5) * 0.08 + Math.cos(windTime * 17.3) * 0.05;
      const lanternGlassMat = rueRig.lanternMesh.material as THREE.MeshStandardMaterial;
      lanternGlassMat.color.setHex(nightBlend > 0.25 ? 0xfef3c7 : 0x94a3b8);
      lanternGlassMat.emissiveIntensity = THREE.MathUtils.lerp(0.0, 4.2 * flameFlicker, nightBlend);
      (rueRig.lanternFlameMesh.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.clamp(
        nightBlend * 1.2,
        0,
        1
      );
      rueRig.lanternFlameMesh.scale.set(
        0.85 + nightBlend * 0.3,
        (0.35 + nightBlend * 0.95) * flameFlicker,
        0.85 + nightBlend * 0.3
      );
      (rueRig.lanternHaloMesh.material as THREE.MeshBasicMaterial).opacity =
        nightBlend * (0.48 + Math.sin(windTime * 7.5) * 0.08);
      rueRig.lanternHaloMesh.scale.setScalar(0.75 + nightBlend * 0.65 * flameFlicker);

      if (flareWaveTimer > 0) {
        const flareFade = flareWaveTimer / 1.15;
        rueLanternLight.color.setHex(0xff5a1f);
        rueLanternLight.intensity = 5.8 + flareFade * 7.5;
        rueLanternLight.distance = 24;
      } else {
        const spec =
          LANTERN_COSMETICS[dailyState.equippedLanternId] ?? LANTERN_COSMETICS.amber_default;
        rueLanternLight.color.setHex(spec.threeColor);
        rueLanternLight.intensity = THREE.MathUtils.lerp(0.0, 5.8 * flameFlicker, nightBlend);
        rueLanternLight.distance = THREE.MathUtils.lerp(6, 17, nightBlend);
      }

      // Real-Time Forest Wind Sway Animation for Tree Leaves (tier1-3), Ferns, and Grass Tufts
      const windSpeed = phase === 'night' ? 2.6 : 1.95;
      const windPower = phase === 'night' ? 1.35 : 1.0;
      for (let i = 0; i < treeWindData.length; i++) {
        const t = treeWindData[i];
        const gust1 =
          (Math.sin(windTime * windSpeed + t.tx * 0.16 + t.tz * 0.12 + t.phase) +
            0.45 * Math.sin(windTime * (windSpeed * 1.65) + t.tx * 0.28 - t.tz * 0.19)) *
          windPower;
        const gustZ =
          Math.cos(windTime * (windSpeed * 0.85) + t.tz * 0.18 + t.phase) * 0.65 * windPower;

        // Tier 1 (lower pine canopy)
        _dummyObj.position.set(
          t.tx + gust1 * 0.08 * t.scale,
          2.35 * t.scale,
          t.tz + gustZ * 0.05 * t.scale
        );
        _dummyObj.rotation.set(
          t.leanX + gustZ * 0.04,
          t.rotY1 + gust1 * 0.035,
          t.leanZ - gust1 * 0.045
        );
        _dummyObj.scale.setScalar(t.scale);
        _dummyObj.updateMatrix();
        tier1Inst.setMatrixAt(i, _dummyObj.matrix);

        // Tier 2 (middle pine canopy - delayed phase & wider sway)
        const gust2 =
          (Math.sin(windTime * windSpeed - 0.35 + t.tx * 0.16 + t.tz * 0.12 + t.phase) +
            0.5 * Math.sin(windTime * (windSpeed * 1.65) - 0.35 + t.tx * 0.28 - t.tz * 0.19)) *
          windPower;
        _dummyObj.position.set(
          t.tx + gust2 * 0.18 * t.scale,
          3.65 * t.scale,
          t.tz + gustZ * 0.11 * t.scale
        );
        _dummyObj.rotation.set(
          t.leanX + gustZ * 0.075,
          t.rotY2 + gust2 * 0.06,
          t.leanZ - gust2 * 0.085
        );
        _dummyObj.updateMatrix();
        tier2Inst.setMatrixAt(i, _dummyObj.matrix);

        // Tier 3 (upper crown - largest wind bend & rustle)
        const gust3 =
          (Math.sin(windTime * windSpeed - 0.7 + t.tx * 0.16 + t.tz * 0.12 + t.phase) +
            0.55 * Math.sin(windTime * (windSpeed * 1.65) - 0.7 + t.tx * 0.28 - t.tz * 0.19)) *
          windPower;
        _dummyObj.position.set(
          t.tx + gust3 * 0.3 * t.scale,
          4.8 * t.scale,
          t.tz + gustZ * 0.18 * t.scale
        );
        _dummyObj.rotation.set(
          t.leanX + gustZ * 0.11,
          t.rotY3 + gust3 * 0.09,
          t.leanZ - gust3 * 0.13
        );
        _dummyObj.updateMatrix();
        tier3Inst.setMatrixAt(i, _dummyObj.matrix);
      }
      tier1Inst.instanceMatrix.needsUpdate = true;
      tier2Inst.instanceMatrix.needsUpdate = true;
      tier3Inst.instanceMatrix.needsUpdate = true;

      // Sway forest fern fronds in the wind
      for (let i = 0; i < fernWindData.length; i++) {
        const f = fernWindData[i];
        const fGust =
          Math.sin(windTime * (windSpeed * 1.35) + f.fx * 0.25 + f.fz * 0.2 + f.phase) *
          windPower;
        _dummyObj.position.set(f.fx, 0.05, f.fz);
        _dummyObj.rotation.set(f.tiltX + fGust * 0.14, f.rotY + fGust * 0.06, fGust * 0.08);
        _dummyObj.scale.set(f.scale * 1.15, f.scale, f.scale * 0.32);
        _dummyObj.updateMatrix();
        fernInst.setMatrixAt(i, _dummyObj.matrix);
      }
      fernInst.instanceMatrix.needsUpdate = true;

      // Sway 3D meadow grass tufts gently in the breeze
      for (let i = 0; i < grassWindData.length; i++) {
        const g = grassWindData[i];
        const gWave =
          Math.sin(windTime * (windSpeed * 1.2) + g.gx * 0.22 + g.gz * 0.18) * 0.11 * windPower;
        _dummyObj.position.set(g.gx, 0.015, g.gz);
        _dummyObj.rotation.set(g.tiltX + gWave * 0.5, g.rotY, g.tiltZ - gWave);
        _dummyObj.scale.set(g.sx, g.sy, g.sz);
        _dummyObj.updateMatrix();
        grassTuftInst.setMatrixAt(i, _dummyObj.matrix);
      }
      grassTuftInst.instanceMatrix.needsUpdate = true;

      // Animate shimmering water ditch flow & Cornfield stalk wind sway
      waterCanalTex.offset.x = (windTime * 0.14) % 1;
      for (let i = 0; i < cornWindData.length; i++) {
        const c = cornWindData[i];
        const cWave =
          Math.sin(windTime * (windSpeed * 1.15) + c.wx * 0.25 + c.wz * 0.2 + c.phase) *
          0.09 *
          windPower;
        _dummyObj.position.set(c.wx, 0.12, c.wz);
        _dummyObj.rotation.set(cWave * 0.65, c.rotY, -cWave);
        _dummyObj.scale.set(1, c.scaleY, 1);
        _dummyObj.updateMatrix();
        cornStalkInst.setMatrixAt(i, _dummyObj.matrix);

        _dummyObj.position.set(
          c.wx + Math.cos(c.rotY) * 0.08 - cWave * 0.45,
          0.12 + 0.92 * c.scaleY,
          c.wz + Math.sin(c.rotY) * 0.08 + cWave * 0.3
        );
        _dummyObj.rotation.set(0.24 + cWave * 0.6, c.rotY, 0.3 - cWave);
        _dummyObj.scale.setScalar(1);
        _dummyObj.updateMatrix();
        cornCobInst.setMatrixAt(i, _dummyObj.matrix);

        _dummyObj.position.set(
          c.wx - cWave * 0.85,
          0.12 + 1.62 * c.scaleY,
          c.wz + cWave * 0.55
        );
        _dummyObj.rotation.set(cWave * 0.65, c.rotY, -cWave);
        _dummyObj.scale.setScalar(1);
        _dummyObj.updateMatrix();
        cornTasselInst.setMatrixAt(i, _dummyObj.matrix);
      }
      cornStalkInst.instanceMatrix.needsUpdate = true;
      cornCobInst.instanceMatrix.needsUpdate = true;
      cornTasselInst.instanceMatrix.needsUpdate = true;

      // Title Screen Ambient Camera Pan & Idling
      if (screenState === 'title') {
        const t = performance.now() * 0.0004;
        camera.position.set(Math.sin(t) * 4.5, 23.5, 24.5 + Math.cos(t) * 2.0);
        camera.lookAt(0, 1.2, 0);
        rueRig.headGroup.rotation.y = Math.sin(t * 4) * 0.25;
        rueLanternLight.position.set(rueX + 0.5, 1.4, rueZ + 0.4);
        return;
      }

      if (screenState !== 'playing') {
        return;
      }

      elapsedRunSeconds += dt;

      // Hitstop freeze check for heavy impacts
      if (hitstopTimer > 0) {
        hitstopTimer = Math.max(0, hitstopTimer - dt);
        return;
      }

      // Cooldowns
      if (flareCooldown > 0) {
        flareCooldown = Math.max(0, flareCooldown - dt);
      }
      if (flareWaveTimer > 0) {
        flareWaveTimer = Math.max(0, flareWaveTimer - dt);
        const progress = 1 - flareWaveTimer / 1.15;
        const r = 0.8 + progress * LANTERN_FLARE_RADIUS;
        flareRingMesh.position.set(flareOriginX, 0.22, flareOriginZ);
        flareRingMesh.scale.setScalar(r);
        flareRingMat.opacity = (1 - progress) * 0.95;

        flareCoreRingMesh.position.set(flareOriginX, 0.28, flareOriginZ);
        flareCoreRingMesh.scale.setScalar(0.6 + progress * (LANTERN_FLARE_RADIUS * 0.78));
        flareCoreRingMat.opacity = (1 - progress) * 0.95;

        flareFireGroup.visible = true;
        flareFireGroup.position.set(flareOriginX, 0.12, flareOriginZ);
        const fireFade = Math.sin((1 - progress) * Math.PI * 0.5);
        flareOuterFlameMat.opacity = fireFade * 0.92;
        flareInnerFlameMat.opacity = fireFade * 0.95;
        const ringRadius = 1.0 + progress * (LANTERN_FLARE_RADIUS * 0.76);
        for (let i = 0; i < flareFlameTongues.length; i++) {
          const ft = flareFlameTongues[i];
          const flicker = 0.85 + Math.sin(windTime * 22 + ft.phase) * 0.22;
          const dist = ft.isCenter ? 0.65 + progress * 1.6 : ringRadius;
          ft.holder.position.set(Math.cos(ft.angle) * dist, 0, Math.sin(ft.angle) * dist);
          ft.holder.rotation.y = -ft.angle + windTime * 2.5;
          const hScale = (ft.isCenter ? 1.55 : 1.25) * (1 - progress * 0.3) * flicker;
          const wScale = (ft.isCenter ? 1.25 : 1.1) * (1 - progress * 0.22);
          ft.holder.scale.set(wScale, hScale, wScale);
        }
      } else {
        flareRingMat.opacity = 0;
        flareCoreRingMat.opacity = 0;
        flareFireGroup.visible = false;
      }

      // 1. Move Ranger Rue (WASD / Arrows + Click-to-Move)
      let moveX = 0;
      let moveZ = 0;
      if (keysPressed.has('KeyW') || keysPressed.has('ArrowUp')) moveZ -= 1;
      if (keysPressed.has('KeyS') || keysPressed.has('ArrowDown')) moveZ += 1;
      if (keysPressed.has('KeyA') || keysPressed.has('ArrowLeft')) moveX -= 1;
      if (keysPressed.has('KeyD') || keysPressed.has('ArrowRight')) moveX += 1;

      if (moveX !== 0 || moveZ !== 0) {
        moveTarget = null; // manual keyboard overrides click target
      } else if (moveTarget) {
        const dx = moveTarget.x - rueX;
        const dz = moveTarget.z - rueZ;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.35) {
          moveX = dx / dist;
          moveZ = dz / dist;
        } else {
          moveTarget = null;
        }
      }

      if (moveTargetAlpha > 0) {
        moveTargetAlpha = Math.max(0, moveTargetAlpha - dt * 1.4);
        (moveTargetRing.material as THREE.MeshBasicMaterial).opacity = moveTargetAlpha;
      }

      // Check if Rue is standing in Brine slime or boosted by Guard Tent
      let speedMultiplier = 1.0;
      for (const s of slimePatches) {
        if (Math.hypot(rueX - s.x, rueZ - s.z) < s.radius) {
          speedMultiplier = 0.68;
          break;
        }
      }
      pads.forEach((p) => {
        if (p.building?.type === 'guardtent' && p.building.upgradePath === 'pathB') {
          speedMultiplier *= 1.12;
        }
      });

      const moveLen = Math.hypot(moveX, moveZ);
      const rueSpeed = 6.4 * speedMultiplier;
      if (moveLen > 0.01) {
        const nx = moveX / moveLen;
        const nz = moveZ / moveLen;
        let nextX = rueX + nx * rueSpeed * dt;
        let nextZ = rueZ + nz * rueSpeed * dt;

        // Avoid walking inside the central Fort lodge (radius 3.1)
        const fortDist = Math.hypot(nextX, nextZ);
        if (fortDist < 3.15 && fortDist > 0.001) {
          nextX = (nextX / fortDist) * 3.15;
          nextZ = (nextZ / fortDist) * 3.15;
        }
        // Clamp to clearing radius
        const clearDist = Math.hypot(nextX, nextZ);
        if (clearDist > 16.8) {
          nextX = (nextX / clearDist) * 16.8;
          nextZ = (nextZ / clearDist) * 16.8;
        }

        const stepDist = Math.hypot(nextX - rueX, nextZ - rueZ);
        rueX = nextX;
        rueZ = nextZ;
        rueWalkPhase += stepDist * 3.4;

        const desiredYaw = Math.atan2(nx, nz);
        let diff = desiredYaw - rueRotationY;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        rueRotationY += diff * Math.min(1, dt * 14);
      }

      // Step deferred 'construction' animation state machine if active
      if (pendingConstruction !== null) {
        const cStep = stepConstructionTask({
          task: pendingConstruction,
          dt,
          phase,
          fenceSegments,
          pads,
          resources,
        });
        pendingConstruction = cStep.task;
        heroAnimState = cStep.heroAnimState;
        document.body.dataset.heroAnim = heroAnimState;

        if (cStep.completed && cStep.completedTask) {
          const doneTask = cStep.completedTask;
          fenceSegments = cStep.fenceSegments;
          pads = cStep.pads;
          resources = cStep.resources;
          selectRingMesh.scale.setScalar(1);

          if (doneTask.targetKind === 'fence') {
            const action = cStep.fenceOutcome ?? 'built';
            score += action === 'built' ? 40 : action === 'upgraded' ? 75 : 20;
            applyTaskEvent({
              buildingsBuiltDelta: action === 'built' ? 1 : 0,
              runScore: score,
            });
            rebuildFenceVisuals();
            soundFX.playBuild(action === 'upgraded');
            spawnParticles(
              doneTask.targetX,
              1.1,
              doneTask.targetZ,
              16,
              action === 'upgraded' ? 0x38bdf8 : 0xfbbf24,
              4.6
            );
            const msg =
              action === 'built'
                ? `Fence Built: ${doneTask.label}!`
                : action === 'upgraded'
                ? `Fence Upgraded (Lv.2 Spikes): ${doneTask.label}!`
                : `Fence Repaired: ${doneTask.label}!`;
            addCallout(msg, doneTask.targetX, 2.2, doneTask.targetZ, '#4ade80');
          } else {
            rebuildPadVisuals();
            if (doneTask.action === 'build_pad' && doneTask.buildingType) {
              score += 50;
              applyTaskEvent({ buildingsBuiltDelta: 1, runScore: score });
              soundFX.playBuild(false);
              spawnParticles(doneTask.targetX, 1.0, doneTask.targetZ, 16, 0xfbbf24, 4.6);
              addCallout(
                `Built ${BUILDING_CATALOG[doneTask.buildingType].name}!`,
                doneTask.targetX,
                2.2,
                doneTask.targetZ,
                '#4ade80'
              );
              selectedPadId = null;
              selectRingMesh.visible = false;
            } else if (doneTask.action === 'upgrade_pad' && doneTask.upgradePath) {
              score += 120;
              applyTaskEvent({ runScore: score });
              soundFX.playBuild(true);
              spawnParticles(doneTask.targetX, 1.5, doneTask.targetZ, 20, 0x38bdf8, 5.2);
              addCallout(`Upgraded: ${doneTask.label}!`, doneTask.targetX, 2.5, doneTask.targetZ, '#fbbf24');
              selectedPadId = null;
              selectRingMesh.visible = false;
            } else if (doneTask.action === 'repair_pad') {
              soundFX.playBuild(false);
              spawnParticles(doneTask.targetX, 1.0, doneTask.targetZ, 12, 0x4ade80, 4.0);
              addCallout('Repaired!', doneTask.targetX, 2.0, doneTask.targetZ, '#4ade80');
            }
          }
          syncHud(true);
        }
      } else {
        const nextAnim: HeroAnimState =
          rueHammerSwingTimer > 0 ? 'combat' : moveLen > 0.01 ? 'walk' : 'idle';
        if (heroAnimState !== nextAnim) {
          heroAnimState = nextAnim;
          document.body.dataset.heroAnim = heroAnimState;
        }
      }

      // Animate Rue's gait, distinct 'construction' state, or combat hammer swing
      if (heroAnimState === 'construction' && pendingConstruction) {
        const cProg =
          1 -
          pendingConstruction.remainingTime / Math.max(0.01, pendingConstruction.totalTime);
        const strikeWave = Math.sin(cProg * Math.PI * 6);
        const workSquat = Math.abs(strikeWave) * 0.16;
        const faceYaw = Math.atan2(
          pendingConstruction.targetX - rueX,
          pendingConstruction.targetZ - rueZ
        );
        rueRotationY = faceYaw;
        rueRig.group.position.set(rueX, workSquat, rueZ);
        rueRig.group.rotation.y = rueRotationY;
        rueRig.group.rotation.x = Math.max(0, strikeWave) * 0.18;
        // Left arm holds the Wooden Mallet -> rhythmic overhead construction hammering!
        rueRig.leftArm.rotation.x = -0.92 - strikeWave * 0.95;
        rueRig.leftArm.rotation.z = -0.18 + Math.cos(cProg * Math.PI * 6) * 0.14;
        // Right arm holds the Brass Lantern high to illuminate the construction site
        rueRig.rightArm.rotation.x = -0.65 + strikeWave * 0.16;
        rueRig.rightArm.rotation.z = 0.22;
        rueRig.headGroup.rotation.x = strikeWave * 0.22;
        rueLanternLight.position.set(
          rueX + Math.sin(rueRotationY) * 0.55,
          1.55,
          rueZ + Math.cos(rueRotationY) * 0.55
        );

        selectRingMesh.position.set(pendingConstruction.targetX, 0.09, pendingConstruction.targetZ);
        selectRingMesh.visible = true;
        selectRingMesh.scale.setScalar(1 + Math.sin(cProg * Math.PI * 6) * 0.08);

        constructionSparkTimer -= dt;
        if (constructionSparkTimer <= 0) {
          constructionSparkTimer = 0.25;
          spawnParticles(
            pendingConstruction.targetX,
            0.85,
            pendingConstruction.targetZ,
            5,
            0xfbbf24,
            3.2
          );
          soundFX.playGatherHit('wood');
        }
      } else {
        const bounce = Math.abs(Math.sin(rueWalkPhase)) * 0.14;
        rueRig.group.position.set(rueX, bounce, rueZ);
        rueRig.group.rotation.y = rueRotationY;
        rueRig.group.rotation.x = THREE.MathUtils.damp(rueRig.group.rotation.x, 0, 10, dt);
        rueRig.headGroup.rotation.x = THREE.MathUtils.damp(rueRig.headGroup.rotation.x, 0, 10, dt);
        rueRig.leftArm.rotation.z = Math.sin(rueWalkPhase * 0.5) * 0.08;
        rueRig.rightArm.rotation.z = THREE.MathUtils.damp(rueRig.rightArm.rotation.z, 0, 10, dt);
        rueLanternLight.position.set(
          rueX + Math.sin(rueRotationY) * 0.5,
          1.45,
          rueZ + Math.cos(rueRotationY) * 0.5
        );

        if (rueHammerSwingTimer > 0) {
          rueHammerSwingTimer = Math.max(0, rueHammerSwingTimer - dt * 4.5);
          rueRig.leftArm.rotation.x = -Math.sin(rueHammerSwingTimer * Math.PI) * 1.35;
          rueRig.rightArm.rotation.x = THREE.MathUtils.damp(rueRig.rightArm.rotation.x, 0, 10, dt);
        } else {
          rueRig.leftArm.rotation.x = THREE.MathUtils.damp(rueRig.leftArm.rotation.x, 0, 10, dt);
          rueRig.rightArm.rotation.x = THREE.MathUtils.damp(rueRig.rightArm.rotation.x, 0, 10, dt);
        }
      }

      // 2. Resource Node Gathering (Day or Night when Rue is close to a node)
      if (rueGatherCooldown > 0) {
        rueGatherCooldown = Math.max(0, rueGatherCooldown - dt);
      }
      for (const node of resourceNodes) {
        const mesh = nodeMeshesMap.get(node.id);
        if (node.respawnTimer > 0) {
          node.respawnTimer = Math.max(0, node.respawnTimer - dt);
          if (node.respawnTimer === 0) {
            node.amount = node.maxAmount;
            if (mesh) mesh.visible = true;
          }
          continue;
        }
        if (node.hitFlashTimer > 0) {
          node.hitFlashTimer = Math.max(0, node.hitFlashTimer - dt);
          if (mesh) {
            const s = 1 + Math.sin(node.hitFlashTimer * 30) * 0.14;
            mesh.scale.set(s, 2 - s, s);
          }
        } else if (mesh) {
          mesh.scale.setScalar(1);
        }

        const dNode = Math.hypot(node.x - rueX, node.z - rueZ);
        if (dNode <= 2.45 && rueGatherCooldown <= 0 && node.amount > 0) {
          rueGatherCooldown = 0.48;
          rueHammerSwingTimer = 1.0;
          node.hitFlashTimer = 0.14;
          const yieldAmt = node.type === 'wood' ? 10 : 8;
          node.amount = Math.max(0, node.amount - yieldAmt);
          resources = {
            ...resources,
            [node.type]: resources[node.type] + yieldAmt,
          };
          score += 12;
          if (node.type === 'wood') {
            applyTaskEvent({ woodCollectedDelta: yieldAmt, runScore: score });
          } else {
            applyTaskEvent({ runScore: score });
          }
          soundFX.playGatherHit(node.type);
          const chipColor =
            node.type === 'wood' ? 0xd97706 : node.type === 'stone' ? 0x94a3b8 : 0xf43f5e;
          spawnParticles(node.x, 0.7, node.z, 6, chipColor, 3.2);
          addCallout(
            `+${yieldAmt} ${node.type.toUpperCase()}`,
            node.x,
            1.6,
            node.z,
            node.type === 'wood' ? '#fbbf24' : node.type === 'stone' ? '#bae6fd' : '#fda4af',
            1.0
          );

          if (node.amount <= 0) {
            node.respawnTimer = 18.0;
            addCallout('Node Depleted! +25 PTS', node.x, 2.2, node.z, '#4ade80', 1.5);
            score += 25;
            if (mesh) mesh.visible = false;
          }
          break;
        }
      }

      // 3. Day Phase Timer -> Automatic Night Transition
      if (phase === 'day') {
        phaseTimeRemaining = Math.max(0, phaseTimeRemaining - dt);
        if (phaseTimeRemaining <= 0) {
          beginNightPhase(false);
        }
      } else {
        // Night Phase: Spawn queued zombies
        if (pendingWaveQueue.length > 0) {
          waveSpawnTimer -= dt;
          if (waveSpawnTimer <= 0) {
            const nextType = pendingWaveQueue.shift()!;
            spawnZombie(nextType);
            waveSpawnTimer = Math.max(0.75, 1.85 - dayNumber * 0.25);
          }
        }
      }

      // 4. Rue Automatic Hammer Bonk on Close Zombies
      if (rueAttackCooldown > 0) {
        rueAttackCooldown = Math.max(0, rueAttackCooldown - dt);
      }
      if (rueAttackCooldown <= 0) {
        let closestZ: ZombieEntity | null = null;
        let minD = 2.75;
        for (const z of zombies) {
          if (z.isDead || z.koTimer > 0) continue;
          const d = Math.hypot(z.x - rueX, z.z - rueZ);
          if (d < minD) {
            minD = d;
            closestZ = z;
          }
        }
        if (closestZ) {
          rueAttackCooldown = 0.65;
          rueHammerSwingTimer = 1.0;
          const dmgRes = applyDamageToZombie(closestZ, 30, 'melee');
          if (dmgRes.armorShattered) {
            stripZombieArmorVisuals(closestZ);
          }
          const dx = closestZ.x - rueX;
          const dz = closestZ.z - rueZ;
          const len = Math.hypot(dx, dz) || 1;
          const kbScale = closestZ.type === 'armored_undead' && closestZ.armorHp > 0 ? 0.35 : 0.85;
          closestZ.x += (dx / len) * kbScale;
          closestZ.z += (dz / len) * kbScale;
          soundFX.playAttackHit(true);
          spawnParticles(closestZ.x, 1.0, closestZ.z, 9, 0xfbbf24, 4.0);
          addCallout(
            dmgRes.armorDamage > 0 && !dmgRes.armorShattered
              ? `-${dmgRes.actualHpDamage} BONK! (-${dmgRes.armorDamage} ARMOR)`
              : `-${dmgRes.actualHpDamage} BONK!`,
            closestZ.x,
            1.9,
            closestZ.z,
            '#fbbf24',
            0.85
          );
          if (closestZ.hp <= 0 && closestZ.koTimer <= 0) {
            closestZ.koTimer = 0.35;
            hitstopTimer = 0.04;
          }
        }
      }

      // 5. Defenses (Towers / Traps / Campfires / Catapults / Guard Tents) Automatic Logic
      // First check if any Campfire has Roaring Bonfire (pathA) aura
      let hasBonfireBuff = false;
      for (const pad of pads) {
        if (!pad.building) continue;
        if (pad.building.type === 'campfire' && pad.building.upgradePath === 'pathA') {
          hasBonfireBuff = true;
          if (phase === 'night' && fortHp < FORT_MAX_HP) {
            fortHp = Math.min(FORT_MAX_HP, fortHp + 6 * dt);
          }
        }
      }

      for (const pad of pads) {
        const bld = pad.building;
        if (!bld) continue;
        const stats = getEffectiveBuildingStats(bld.type, bld.upgradePath);
        const rateMult = hasBonfireBuff ? 1.18 : 1.0;

        // Passive Palisade Tar-Pitch slow aura
        if (bld.type === 'palisade' && stats.specialEffect === 'slow_aura') {
          for (const z of zombies) {
            if (z.isDead || z.koTimer > 0) continue;
            if (Math.hypot(z.x - pad.x, z.z - pad.z) <= stats.range) {
              z.slowTimer = Math.max(z.slowTimer, 0.5);
              z.dashTimer = 0;
            }
          }
        }

        if (bld.cooldown > 0) {
          bld.cooldown = Math.max(0, bld.cooldown - dt * rateMult);
          continue;
        }

        // Find target zombie in range
        let targetZ: ZombieEntity | null = null;
        let bestDist = stats.range;
        for (const z of zombies) {
          if (z.isDead || z.koTimer > 0) continue;
          const d = Math.hypot(z.x - pad.x, z.z - pad.z);
          if (d <= bestDist) {
            bestDist = d;
            targetZ = z;
          }
        }

        if (!targetZ) continue;
        bld.cooldown = stats.attackInterval;

        if (bld.type === 'spiketrap' || bld.type === 'palisade') {
          // Direct AoE / Contact strike around pad
          for (const z of zombies) {
            if (z.isDead || z.koTimer > 0) continue;
            const d = Math.hypot(z.x - pad.x, z.z - pad.z);
            if (d <= stats.range) {
              const dmgRes = applyDamageToZombie(z, stats.damage, 'trap', stats.specialEffect);
              if (dmgRes.armorShattered) {
                stripZombieArmorVisuals(z);
              }
              if (bld.type === 'spiketrap') {
                // Spike traps hobble Swift Stumblers briefly
                z.slowTimer = Math.max(z.slowTimer, 1.4);
                z.dashTimer = 0;
              }
              if (stats.specialEffect === 'poison_spikes') {
                z.poisonTimer = 3.5;
                z.slowTimer = Math.max(z.slowTimer, 2.2);
              } else if (stats.specialEffect === 'knockback_trap') {
                const len = d || 1;
                const kbScale = z.type === 'armored_undead' && z.armorHp > 0 ? 0.35 : 1.4;
                z.x += ((z.x - pad.x) / len) * kbScale;
                z.z += ((z.z - pad.z) / len) * kbScale;
              }
            }
          }
          spawnParticles(pad.x, 0.5, pad.z, 6, 0x94a3b8, 3.0);
          soundFX.playAttackHit(false);
        } else {
          // Spawn Projectile (Watchtower bolt, Catapult boulder, Campfire ember, Guard Tent badger strike)
          const pId = nextEntityId++;
          const isCatapult = bld.type === 'catapult';
          const isEmber = bld.type === 'campfire';
          const projColor = isCatapult
            ? stats.specialEffect === 'meteor_splash'
              ? 0xf97316
              : 0x94a3b8
            : isEmber
            ? 0xfbbf24
            : bld.type === 'guardtent'
            ? 0x4ade80
            : 0x38bdf8;

          const pEntity: ProjectileEntity = {
            id: pId,
            x: pad.x,
            y: bld.type === 'watchtower' ? 2.6 : 1.3,
            z: pad.z,
            startX: pad.x,
            startZ: pad.z,
            targetX: targetZ.x,
            targetZ: targetZ.z,
            progress: 0,
            speed: isCatapult ? 1.35 : 3.2,
            arcHeight: isCatapult ? 3.8 : 0.85,
            damage: stats.damage,
            splashRadius: isCatapult
              ? stats.specialEffect === 'meteor_splash'
                ? 3.8
                : 2.6
              : stats.specialEffect === 'ember_splash'
              ? 2.4
              : 0.9,
            applySlow:
              stats.specialEffect === 'rapid_volley' ||
              stats.specialEffect === 'shatter_slow' ||
              stats.specialEffect === 'badger_stun',
            applyPoison: false,
            specialEffect: stats.specialEffect,
            colorHex: projColor,
          };
          projectiles.push(pEntity);

          const pMesh = new THREE.Mesh(
            projectileGeo,
            new THREE.MeshBasicMaterial({ color: projColor })
          );
          pMesh.position.set(pEntity.x, pEntity.y, pEntity.z);
          if (isCatapult) pMesh.scale.setScalar(1.65);
          scene.add(pMesh);
          projectileMeshesMap.set(pId, pMesh);
        }
      }

      // 6. Step Projectiles
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.progress += p.speed * dt;
        const pMesh = projectileMeshesMap.get(p.id);

        if (p.progress >= 1.0) {
          // Impact!
          const isSplash = p.splashRadius > 2.0;
          for (const z of zombies) {
            if (z.isDead || z.koTimer > 0) continue;
            const d = Math.hypot(z.x - p.targetX, z.z - p.targetZ);
            if (d <= p.splashRadius + 0.65) {
              const dmgRes = applyDamageToZombie(
                z,
                p.damage,
                isSplash ? 'splash' : 'projectile',
                p.specialEffect
              );
              if (dmgRes.armorShattered) {
                stripZombieArmorVisuals(z);
              } else if (z.type === 'armored_undead' && z.armorHp > 0 && !isSplash) {
                addCallout('CLANG! -45%', z.x, 2.0, z.z, '#94a3b8', 0.65);
              }
              if (p.applySlow) {
                z.slowTimer = Math.max(z.slowTimer, 2.2);
                z.dashTimer = 0;
              }
            }
          }
          spawnParticles(p.targetX, 0.6, p.targetZ, isSplash ? 14 : 6, p.colorHex, 4.0);
          soundFX.playAttackHit(isSplash);
          if (pMesh) {
            scene.remove(pMesh);
            projectileMeshesMap.delete(p.id);
          }
          projectiles.splice(i, 1);
        } else if (pMesh) {
          const lx = THREE.MathUtils.lerp(p.startX, p.targetX, p.progress);
          const lz = THREE.MathUtils.lerp(p.startZ, p.targetZ, p.progress);
          const ly = 0.6 + Math.sin(p.progress * Math.PI) * p.arcHeight;
          pMesh.position.set(lx, ly, lz);
          pMesh.rotation.x += dt * 8;
          pMesh.rotation.y += dt * 6;
        }
      }

      // 7. Step Zombies (9 Distinct Scary-Funny Archetype Behaviors & Boss Windup Telegraph)
      let baronWindingUp = false;
      for (let i = zombies.length - 1; i >= 0; i--) {
        const z = zombies[i];
        const zMesh = zombieMeshesMap.get(z.id);

        // KO topple transition (`0.35s`) before removal
        if (z.koTimer > 0) {
          z.koTimer -= dt;
          if (zMesh) {
            zMesh.rotation.x = (1 - z.koTimer / 0.35) * (Math.PI / 2);
            zMesh.position.y = Math.max(0, z.koTimer * 0.5);
          }
          if (z.koTimer <= 0) {
            z.isDead = true;
            const spec = ZOMBIE_CATALOG[z.type];
            zombiesDefeated++;
            score += spec.scoreValue;
            resources = {
              ...resources,
              tickets: resources.tickets + spec.ticketReward,
            };
            spawnParticles(z.x, 0.8, z.z, 14, 0xa3e635, 4.5);
            addCallout(`+${spec.scoreValue} PTS`, z.x, 1.8, z.z, '#4ade80', 1.1);
            if (zMesh) {
              scene.remove(zMesh);
              zombieMeshesMap.delete(z.id);
            }
            zombies.splice(i, 1);
          }
          continue;
        }

        if (z.slowTimer > 0) z.slowTimer = Math.max(0, z.slowTimer - dt);
        if (z.dashTimer > 0) z.dashTimer = Math.max(0, z.dashTimer - dt);
        if (z.frenzyTimer > 0) z.frenzyTimer = Math.max(0, z.frenzyTimer - dt);
        if (z.poisonTimer > 0) {
          z.poisonTimer = Math.max(0, z.poisonTimer - dt);
          z.hp = Math.max(0, z.hp - 8 * dt);
          if (z.hp <= 0 && z.koTimer <= 0) {
            z.koTimer = 0.35;
            continue;
          }
        }
        if (z.hitFlashTimer > 0) z.hitFlashTimer = Math.max(0, z.hitFlashTimer - dt);
        if (z.quipTimer > 0) {
          z.quipTimer = Math.max(0, z.quipTimer - dt);
          if (z.quipTimer === 0) z.quipText = null;
        }

        // Bone Howler periodic War-Cry Rally (+28% Frenzy Haste to nearby zombies)
        if (z.type === 'bone_howler') {
          z.howlCooldown -= dt;
          if (z.howlCooldown <= 0) {
            z.howlCooldown = 4.5;
            const rallied = applyBoneHowlerRally(z, zombies, 5.2);
            if (rallied > 0) {
              spawnParticles(z.x, 1.5, z.z, 12, 0x2dd4bf, 4.8);
              addCallout(`RALLY HOWL! (+28% SPD)`, z.x, 2.3, z.z, '#2dd4bf', 1.2);
            }
          }
        }

        // Swift Stumbler triggers Surge Dash when closing within 9.5m of the Fort (if not slowed)
        if (z.type === 'swift_stumbler' && z.slowTimer <= 0 && z.slimeDropTimer <= 0) {
          const distFromCenter = Math.hypot(z.x, z.z);
          if (distFromCenter < 9.5) {
            z.dashTimer = 2.0;
            z.slimeDropTimer = 6.0; // cooldown before next dash
            spawnParticles(z.x, 0.5, z.z, 8, 0xf97316, 4.2);
            addCallout('SURGE DASH!', z.x, 2.0, z.z, '#fb923c', 1.0);
          }
        } else if (z.type === 'swift_stumbler' && z.slimeDropTimer > 0) {
          z.slimeDropTimer = Math.max(0, z.slimeDropTimer - dt);
        }

        // Brine drops swamp slime patches
        if (z.type === 'brine') {
          z.slimeDropTimer -= dt;
          if (z.slimeDropTimer <= 0) {
            z.slimeDropTimer = 2.8;
            const sId = nextEntityId++;
            const sMesh = new THREE.Mesh(slimeGeo, slimeMat);
            sMesh.position.set(z.x, 0.04, z.z);
            sMesh.scale.setScalar(1.1);
            scene.add(sMesh);
            slimePatches.push({ id: sId, x: z.x, z: z.z, radius: 1.1, ttl: 7.0 });
            slimeMeshesMap.set(sId, sMesh);
          }
        }

        // Determine target:
        // 1) Outer Square Fence Perimeter (±9.6m) intercepts zombies outside the box if that side's segment is standing!
        // 2) Inside the fence, zombies target the 8 inner Weapon Pads or Central Fort.
        let targetX = 0;
        let targetZ = 0;
        let targetPad: PlacementPad | null = null;
        const blockingFence = findBlockingFenceSegment(z.x, z.z, fenceSegments);

        if (blockingFence) {
          targetX = blockingFence.x;
          targetZ = blockingFence.z;
        } else {
          let minPadDist = z.type === 'grumble' ? 5.2 : 3.2;
          for (const p of pads) {
            if (!p.building) continue;
            if (z.type === 'swift_stumbler' && z.slowTimer <= 0 && p.ring === 'outer') {
              continue; // Swift Stumblers evade outer-ring blockers while at full speed!
            }
            const dp = Math.hypot(p.x - z.x, p.z - z.z);
            if (dp < minPadDist) {
              minPadDist = dp;
              targetPad = p;
              targetX = p.x;
              targetZ = p.z;
            }
          }
        }

        const dx = targetX - z.x;
        const dz = targetZ - z.z;
        const distToTarget = Math.hypot(dx, dz);
        const stopRadius = blockingFence ? 1.35 : targetPad ? 1.65 : 3.25;

        if (distToTarget > stopRadius) {
          // Distinct movement policy per archetype via pure helper
          const effSpeed = computeZombieEffectiveSpeed(z);
          const nx = dx / distToTarget;
          const nz = dz / distToTarget;

          // Shamble weaves sideways; Swift Stumbler jukes rapidly
          const weave =
            z.type === 'shamble'
              ? Math.sin(z.walkPhase * 0.7) * 0.55
              : z.type === 'swift_stumbler'
              ? Math.sin(z.walkPhase * 1.4) * 0.28
              : 0;
          const moveDirX = nx - nz * weave;
          const moveDirZ = nz + nx * weave;

          z.x += moveDirX * effSpeed * dt;
          z.z += moveDirZ * effSpeed * dt;
          z.walkPhase += effSpeed * dt * 4.2;
          z.rotationY = Math.atan2(moveDirX, moveDirZ);
        } else {
          // Attack Outer Square Fence, Inner Weapon Pad, or Central Fort!
          z.walkPhase += dt * 3.0;
          if (z.type === 'baron') {
            // Baron Blight has a 0.65s dramatic windup telegraph before heavy strike
            baronWindingUp = true;
            z.windupTimer += dt;
            bossTelegraphRing.position.set(z.x, 0.09, z.z);
            const pulse = (z.windupTimer / 0.65) % 1;
            bossTelegraphRing.scale.setScalar(0.6 + pulse * 0.8);
            (bossTelegraphRing.material as THREE.MeshBasicMaterial).opacity = 0.65;

            if (z.windupTimer >= 0.65) {
              z.windupTimer = 0;
              cameraTrauma = Math.min(1.0, cameraTrauma + 0.48);
              soundFX.playAttackHit(true);
              if (blockingFence) {
                blockingFence.hp = Math.max(0, blockingFence.hp - z.damage);
                if (blockingFence.hp <= 0) {
                  blockingFence.level = 0;
                  blockingFence.buildProgress = 0;
                  rebuildFenceVisuals();
                  addCallout('Fence Breached!', blockingFence.x, 2.0, blockingFence.z, '#ef4444');
                }
              } else if (targetPad && targetPad.building) {
                targetPad.building.hp = Math.max(0, targetPad.building.hp - z.damage);
                if (targetPad.building.hp <= 0) {
                  targetPad.building = null;
                  rebuildPadVisuals();
                }
              } else {
                fortHp = Math.max(0, fortHp - z.damage);
              }
            }
          } else {
            z.attackCooldown -= dt;
            if (z.attackCooldown <= 0) {
              const spec = ZOMBIE_CATALOG[z.type];
              z.attackCooldown = spec.attackInterval;
              if (blockingFence) {
                blockingFence.hp = Math.max(0, blockingFence.hp - z.damage);
                if (blockingFence.level === 2) {
                  const thornRes = applyDamageToZombie(z, 18, 'trap');
                  if (thornRes.armorShattered) stripZombieArmorVisuals(z);
                }
                if (blockingFence.hp <= 0) {
                  blockingFence.level = 0;
                  blockingFence.buildProgress = 0;
                  rebuildFenceVisuals();
                  addCallout('Fence Breached!', blockingFence.x, 2.0, blockingFence.z, '#ef4444');
                }
              } else if (targetPad && targetPad.building) {
                targetPad.building.hp = Math.max(0, targetPad.building.hp - z.damage);
                // Palisade Ironbark thorns counter-damage
                if (
                  targetPad.building.type === 'palisade' &&
                  targetPad.building.upgradePath === 'pathA'
                ) {
                  const thornRes = applyDamageToZombie(z, 18, 'trap');
                  if (thornRes.armorShattered) stripZombieArmorVisuals(z);
                }
                if (targetPad.building.hp <= 0) {
                  addCallout('Structure Destroyed!', targetPad.x, 2.0, targetPad.z, '#ef4444');
                  targetPad.building = null;
                  rebuildPadVisuals();
                }
              } else {
                fortHp = Math.max(0, fortHp - z.damage);
                cameraTrauma = Math.min(1.0, cameraTrauma + 0.18);
                soundFX.playAttackHit(false);
              }
            }
          }
        }

        if (zMesh) {
          const waddle = Math.abs(Math.sin(z.walkPhase)) * (z.type === 'swift_stumbler' ? 0.18 : 0.12);
          zMesh.position.set(z.x, waddle, z.z);
          zMesh.rotation.y = z.rotationY;
          zMesh.rotation.z = Math.sin(z.walkPhase) * 0.09;
          const baseScale = ZOMBIE_CATALOG[z.type].scale;
          if (z.hitFlashTimer > 0) {
            zMesh.scale.set(baseScale * 1.15, baseScale * 0.86, baseScale * 1.15);
          } else {
            zMesh.scale.setScalar(baseScale);
          }
        }
      }

      if (!baronWindingUp) {
        (bossTelegraphRing.material as THREE.MeshBasicMaterial).opacity = 0;
      }

      // 8. Step Slime Patches
      for (let i = slimePatches.length - 1; i >= 0; i--) {
        const s = slimePatches[i];
        s.ttl -= dt;
        if (s.ttl <= 0) {
          const m = slimeMeshesMap.get(s.id);
          if (m) {
            scene.remove(m);
            slimeMeshesMap.delete(s.id);
          }
          slimePatches.splice(i, 1);
        }
      }

      // 9. Check Wave Clear or Win / Loss Outcome
      const activeZombiesCount = zombies.filter((z) => !z.isDead).length;
      const outcome = evaluateGameOutcome({
        fortHp,
        dayNumber,
        maxDays: MAX_DAYS,
        phase,
        activeZombiesCount,
        pendingWaveSpawns: pendingWaveQueue.length,
      });

      if (outcome) {
        finalizeRunOutcome(outcome);
        return;
      }

      if (phase === 'night' && activeZombiesCount === 0 && pendingWaveQueue.length === 0) {
        if (dayNumber < MAX_DAYS) {
          advanceToNextDay();
        }
      }

      // 10. Isometric Camera Damping + Night Zoom-In + Decaying Trauma Shake
      if (cameraTrauma > 0) {
        cameraTrauma = Math.max(0, cameraTrauma - dt * 1.6);
      }
      const shakeAmt = cameraTrauma * cameraTrauma * 0.55;
      const shakeX = (Math.random() - 0.5) * 2 * shakeAmt;
      const shakeZ = (Math.random() - 0.5) * 2 * shakeAmt;

      // Subtle pan toward Rue while keeping Fort (0,0) squarely in frame (auto-scaled on mobile portrait)
      const isPortrait = camera.aspect < 1.0;
      const followRatio = isPortrait ? 0.3 : 0.18;
      const portraitScale = isPortrait
        ? THREE.MathUtils.clamp(1 / Math.pow(camera.aspect, 0.36), 1.0, 1.35)
        : 1.0;
      const targetLookX = rueX * followRatio + shakeX;
      const targetLookZ = rueZ * followRatio + shakeZ;
      const nightZoom = THREE.MathUtils.lerp(1.0, 0.9, nightBlend);
      const distFactor = 24.5 * cameraZoom * nightZoom * portraitScale;

      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetLookX, 5.5, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, distFactor, 5.5, dt);
      camera.position.z = THREE.MathUtils.damp(
        camera.position.z,
        targetLookZ + distFactor * 0.98,
        5.5,
        dt
      );
      camera.lookAt(targetLookX, 0.6, targetLookZ);

      // 11. Update Pooled Particles & Projected Callouts
      for (let i = 0; i < MAX_PARTICLES; i++) {
        const p = particlePool[i];
        if (!p.active) continue;
        p.life -= dt;
        if (p.life <= 0) {
          p.active = false;
          _dummyObj.position.set(0, -10, 0);
          _dummyObj.scale.setScalar(0);
          _dummyObj.updateMatrix();
          particleMesh.setMatrixAt(i, _dummyObj.matrix);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy -= 9.8 * dt;
        p.z += p.vz * dt;
        const s = (p.life / p.maxLife) * p.scale;
        _dummyObj.position.set(p.x, Math.max(0.05, p.y), p.z);
        _dummyObj.scale.setScalar(s);
        _dummyObj.updateMatrix();
        particleMesh.setMatrixAt(i, _dummyObj.matrix);
        particleMesh.setColorAt(i, _color.setHex(p.colorHex));
      }
      particleMesh.instanceMatrix.needsUpdate = true;
      if (particleMesh.instanceColor) particleMesh.instanceColor.needsUpdate = true;

      // Update floating callouts, elite HP/Armor micro-bars & zombie speech bubbles in DOM overlay
      if (calloutContainerRef.current) {
        const w = renderer.domElement.clientWidth || window.innerWidth;
        const h = renderer.domElement.clientHeight || window.innerHeight;
        const htmlParts: string[] = [];

        for (let i = callouts.length - 1; i >= 0; i--) {
          const c = callouts[i];
          c.ttl -= dt;
          c.y += dt * 0.85;
          if (c.ttl <= 0) {
            callouts.splice(i, 1);
            continue;
          }
          _projVec.set(c.x, c.y, c.z).project(camera);
          if (_projVec.z >= -1 && _projVec.z <= 1) {
            const sx = ((_projVec.x + 1) * 0.5 * w).toFixed(0);
            const sy = ((-_projVec.y + 1) * 0.5 * h).toFixed(0);
            const op = Math.min(1, c.ttl / 0.35).toFixed(2);
            htmlParts.push(
              `<div style="position:absolute;left:${sx}px;top:${sy}px;transform:translate(-50%,-50%);color:${c.color};opacity:${op};" class="text-xs font-mono-tabular font-bold hud-stroke whitespace-nowrap">${c.text}</div>`
            );
          }
        }

        // Render active 'construction' animation progress badge over the target segment or pad
        if (pendingConstruction) {
          _projVec
            .set(pendingConstruction.targetX, 2.35, pendingConstruction.targetZ)
            .project(camera);
          if (_projVec.z >= -1 && _projVec.z <= 1) {
            const sx = ((_projVec.x + 1) * 0.5 * w).toFixed(0);
            const sy = ((-_projVec.y + 1) * 0.5 * h).toFixed(0);
            const pct = Math.max(
              0,
              Math.min(
                100,
                Math.round(
                  (1 -
                    pendingConstruction.remainingTime /
                      Math.max(0.01, pendingConstruction.totalTime)) *
                    100
                )
              )
            );
            htmlParts.push(
              `<div style="position:absolute;left:${sx}px;top:${sy}px;transform:translate(-50%,-100%);background:rgba(13,19,28,0.92);" class="px-2.5 py-1 rounded-lg border border-[#fbbf24] flex flex-col items-center pointer-events-none shadow-lg">` +
                `<div class="text-[10px] font-mono-tabular font-bold text-[#fef3c7] whitespace-nowrap">🔨 Constructing ${pendingConstruction.label} (${pct}%)</div>` +
                `<div class="w-28 h-1.5 rounded bg-[#090d16] border border-[#334155] overflow-hidden mt-1">` +
                `<div style="width:${pct}%;" class="h-full bg-[#fbbf24]"></div>` +
                `</div>` +
              `</div>`
            );
          }
        }

        // Render compact overhead tactical badges (HP + Armor Plating / Speed state) for Elite Zombies
        let statusTagCount = 0;
        for (const z of zombies) {
          if (statusTagCount >= 6) break;
          if (z.isDead || z.koTimer > 0) continue;
          const spec = ZOMBIE_CATALOG[z.type];
          const showBar = spec.isElite || z.hp < z.maxHp;
          if (!showBar) continue;
          _projVec.set(z.x, z.type === 'baron' ? 3.1 : 2.15, z.z).project(camera);
          if (_projVec.z >= -1 && _projVec.z <= 1) {
            const sxNum = (_projVec.x + 1) * 0.5 * w;
            const syNum = (-_projVec.y + 1) * 0.5 * h;
            if (syNum < 135 || syNum > h - 150) continue;
            const sx = sxNum.toFixed(0);
            const sy = syNum.toFixed(0);
            const hpPct = Math.max(0, Math.min(100, Math.round((z.hp / z.maxHp) * 100)));
            const armorPct =
              z.maxArmorHp > 0
                ? Math.max(0, Math.min(100, Math.round((z.armorHp / z.maxArmorHp) * 100)))
                : 0;
            const traitTag =
              z.type === 'swift_stumbler'
                ? z.slowTimer > 0
                  ? 'SLOWED'
                  : 'FAST'
                : z.type === 'armored_undead'
                ? z.armorHp > 0
                  ? `ARMOR ${Math.round(z.armorHp)}`
                  : 'CRACKED'
                : z.type === 'bone_howler'
                ? 'HOWLER'
                : '';

            htmlParts.push(
              `<div style="position:absolute;left:${sx}px;top:${sy}px;transform:translate(-50%,-100%);" class="flex flex-col items-center pointer-events-none">` +
                (traitTag
                  ? `<div style="color:${spec.badgeColor};" class="text-[9px] font-mono-tabular font-extrabold uppercase tracking-wider hud-stroke">${spec.name} · ${traitTag}</div>`
                  : '') +
                `<div class="w-12 h-1.5 rounded bg-[#090d16]/90 border border-[#334155] overflow-hidden mt-0.5">` +
                `<div style="width:${hpPct}%;" class="h-full bg-[#22c55e]"></div>` +
                `</div>` +
                (z.maxArmorHp > 0 && z.armorHp > 0
                  ? `<div class="w-12 h-1 rounded bg-[#090d16]/90 overflow-hidden mt-0.5"><div style="width:${armorPct}%;" class="h-full bg-[#38bdf8]"></div></div>`
                  : '') +
              `</div>`
            );
            statusTagCount++;
          }
        }

        // Render up to 2 active zombie dark-comedy speech bubbles (offset above the HP bar)
        let bubbleCount = 0;
        for (const z of zombies) {
          if (bubbleCount >= 2) break;
          if (!z.quipText || z.isDead || z.koTimer > 0) continue;
          _projVec.set(z.x, z.type === 'baron' ? 3.55 : 2.65, z.z).project(camera);
          if (_projVec.z >= -1 && _projVec.z <= 1) {
            const sxNum = (_projVec.x + 1) * 0.5 * w;
            const syNum = (-_projVec.y + 1) * 0.5 * h;
            if (syNum < 145 || syNum > h - 150) continue;
            const sx = sxNum.toFixed(0);
            const sy = syNum.toFixed(0);
            htmlParts.push(
              `<div style="position:absolute;left:${sx}px;top:${sy}px;transform:translate(-50%,-100%);background:rgba(13,19,28,0.88);" class="px-2 py-0.5 rounded border border-[#334155] text-[10px] text-[#fef3c7] whitespace-nowrap"><span class="text-[#fbbf24] font-semibold">${z.name}:</span> “${z.quipText}”</div>`
            );
            bubbleCount++;
          }
        }

        // Render crisp interactive WOOD / FOOD / STONE world labels & P1-P8 Build Pad indicators during Day Phase
        if (phase === 'day') {
          const tr = TRANSLATIONS[langRef.current];
          for (const pad of pads) {
            const isSel = pad.id === selectedPadId;
            _projVec.set(pad.x, pad.building ? 1.85 : isSel ? 0.85 : 0.28, pad.z).project(camera);
            if (_projVec.z >= -1 && _projVec.z <= 1) {
              const sxNum = (_projVec.x + 1) * 0.5 * w;
              const syNum = (-_projVec.y + 1) * 0.5 * h;
              if (syNum < 82 || syNum > h - 84) continue;
              const sx = sxNum.toFixed(0);
              const sy = syNum.toFixed(0);
              const padStyle = isSel
                ? 'border-[#fbbf24] text-[#090d16] bg-[#fbbf24]'
                : pad.building
                ? 'border-[#4ade80]/70 text-[#86efac]'
                : 'border-[#f59e0b]/60 text-[#fde68a]';
              const padBg = isSel ? '' : 'background:rgba(13,19,28,0.82);';
              const bldLocName = pad.building
                ? (tr.buildings[pad.building.type]?.shortName ?? BUILDING_CATALOG[pad.building.type].name)
                : '';
              const padText = pad.building
                ? `P${pad.id} · ${bldLocName}`
                : isSel
                ? tr.padSelectedWorldBadge(pad.id)
                : `P${pad.id}`;
              htmlParts.push(
                `<div style="position:absolute;left:${sx}px;top:${sy}px;transform:translate(-50%,-50%);${padBg}" class="px-1.5 py-0.5 rounded border ${padStyle} text-[8.5px] font-mono-tabular font-bold tracking-wider whitespace-nowrap pointer-events-none shadow">${padText}</div>`
              );
            }
          }

          for (const node of resourceNodes) {
            if (node.amount <= 0 || node.respawnTimer > 0) continue;
            _projVec.set(node.x, 1.95, node.z).project(camera);
            if (_projVec.z >= -1 && _projVec.z <= 1) {
              const sxNum = (_projVec.x + 1) * 0.5 * w;
              const syNum = (-_projVec.y + 1) * 0.5 * h;
              if (syNum < 88 || syNum > h - 84) continue;
              const sx = sxNum.toFixed(0);
              const sy = syNum.toFixed(0);
              const badgeStyle =
                node.type === 'wood'
                  ? 'border-[#f59e0b] text-[#fde68a]'
                  : node.type === 'food'
                  ? 'border-[#fb7185] text-[#fecdd3]'
                  : 'border-[#38bdf8] text-[#bae6fd]';
              const labelText =
                node.type === 'wood'
                  ? `${tr.woodLabel} · ${node.amount}`
                  : node.type === 'food'
                  ? `${tr.foodLabel} · ${node.amount}`
                  : `${tr.stoneLabel} · ${node.amount}`;
              htmlParts.push(
                `<div style="position:absolute;left:${sx}px;top:${sy}px;transform:translate(-50%,-100%);background:rgba(13,19,28,0.88);" class="px-1.5 py-0.5 rounded border ${badgeStyle} text-[9px] font-mono-tabular font-bold tracking-wider whitespace-nowrap pointer-events-none shadow">${labelText}</div>`
              );
            }
          }
        }

        calloutContainerRef.current.innerHTML = htmlParts.join('');
      }

      syncHud(false);
    }

    function tick() {
      if (isUnmounted) return;
      const now = performance.now();
      const rawDt = (now - lastFrameTime) / 1000;
      lastFrameTime = now;

      stepSimulation(rawDt);
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    frameId = requestAnimationFrame(tick);

    return () => {
      isUnmounted = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onWindowBlur);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('touchstart', onTouchStart);
      renderer.domElement.removeEventListener('touchmove', onTouchMove);
      renderer.domElement.removeEventListener('touchend', onTouchEnd);
      renderer.dispose();
    };
  }, [controllerRef]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0b1016]">
      {/* Isolated WebGL Mount Container */}
      <div ref={mountRef} className="w-full h-full" />
      {/* Zero-Occlusion World-Space Callout & Zombie Quip Overlay */}
      <div
        ref={calloutContainerRef}
        className="fixed inset-0 pointer-events-none overflow-hidden z-10"
      />
    </div>
  );
};
