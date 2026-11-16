import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { soundFX } from '../game/audio';
import {
  createBuildingModel,
  createCentralFortModel,
  createPlacementPadMesh,
  createProceduralBumpTexture,
  createRangerRueModel,
  createResourceNodeModel,
  createStripedPajamaTexture,
  createZombieModel,
} from '../game/models';
import {
  applyBoneHowlerRally,
  applyDamageToZombie,
  applyLanternFlareToZombies,
  BUILDING_CATALOG,
  buildStructureOnPad,
  calculateRunScore,
  canAfford,
  computeZombieEffectiveSpeed,
  createInitialPads,
  DAY_DURATION_SECONDS,
  deductCost,
  evaluateGameOutcome,
  FORT_MAX_HP,
  getEffectiveBuildingStats,
  getWaveComposition,
  INITIAL_RESOURCES,
  LANTERN_FLARE_COOLDOWN,
  LANTERN_FLARE_RADIUS,
  MAX_DAYS,
  upgradeStructureOnPad,
  ZOMBIE_CATALOG,
} from '../game/rules';
import {
  checkAndApplyDailyReset,
  completeRunProgression,
  consumeTicketForRun,
  LANTERN_COSMETICS,
  loadDailyStateFromStorage,
  recordTaskProgress,
  saveDailyStateToStorage,
} from '../game/dailySystem';
import {
  BuildingType,
  DailyPersistenceState,
  DayNightPhase,
  FloatingCallout,
  GameScreenState,
  HudSnapshot,
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
}

// Pre-allocated module-scope math objects for Zero-GC inside the render loop
const _vec3 = new THREE.Vector3();
const _projVec = new THREE.Vector3();
const _dummyObj = new THREE.Object3D();
const _color = new THREE.Color();
const _daySkyColor = new THREE.Color(0x1b2e2b);
const _nightSkyColor = new THREE.Color(0x070d19);
const _daySunColor = new THREE.Color(0xffdfa8);
const _nightMoonColor = new THREE.Color(0x60a5fa);
const _dayHemiSky = new THREE.Color(0x8ecae6);
const _nightHemiSky = new THREE.Color(0x1d3557);

const MAX_PARTICLES = 160;
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
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const calloutContainerRef = useRef<HTMLDivElement | null>(null);
  const onHudUpdateRef = useRef(onHudUpdate);
  onHudUpdateRef.current = onHudUpdate;

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

    // 2. Outdoor Forest Terrain, Clearing, Trails & Instanced Forest Perimeter
    const outerGround = new THREE.Mesh(
      new THREE.CircleGeometry(85, 48),
      new THREE.MeshStandardMaterial({
        color: 0x16261c,
        roughness: 0.94,
        metalness: 0.04,
        bumpMap: bumpTex,
        bumpScale: 0.08,
      })
    );
    outerGround.rotation.x = -Math.PI / 2;
    outerGround.receiveShadow = true;
    scene.add(outerGround);

    const clearingDisc = new THREE.Mesh(
      new THREE.CircleGeometry(18.5, 40),
      new THREE.MeshStandardMaterial({
        color: 0x243b27,
        roughness: 0.88,
        metalness: 0.05,
        bumpMap: bumpTex,
        bumpScale: 0.05,
      })
    );
    clearingDisc.rotation.x = -Math.PI / 2;
    clearingDisc.position.y = 0.02;
    clearingDisc.receiveShadow = true;
    scene.add(clearingDisc);

    // 4 Dirt Trails (North, South, East, West)
    const trailMat = new THREE.MeshStandardMaterial({
      color: 0x3d2e22,
      roughness: 0.92,
      metalness: 0.04,
    });
    const nsTrail = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 46), trailMat);
    nsTrail.rotation.x = -Math.PI / 2;
    nsTrail.position.y = 0.032;
    nsTrail.receiveShadow = true;
    const ewTrail = new THREE.Mesh(new THREE.PlaneGeometry(46, 3.1), trailMat);
    ewTrail.rotation.x = -Math.PI / 2;
    ewTrail.position.y = 0.035;
    ewTrail.receiveShadow = true;
    scene.add(nsTrail, ewTrail);

    // Instanced Forest Pine Trees (> 20 repeated items -> InstancedMesh)
    const treeCount = 88;
    const trunkInst = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.24, 0.36, 1.8, 6),
      new THREE.MeshStandardMaterial({ color: 0x4a2f18, roughness: 0.88, flatShading: true }),
      treeCount
    );
    const tier1Inst = new THREE.InstancedMesh(
      new THREE.ConeGeometry(1.55, 2.6, 6),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.78, flatShading: true }),
      treeCount
    );
    const tier2Inst = new THREE.InstancedMesh(
      new THREE.ConeGeometry(1.18, 2.2, 6),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.72, flatShading: true }),
      treeCount
    );
    trunkInst.castShadow = !isSoftwareGl;
    tier1Inst.castShadow = !isSoftwareGl;
    tier2Inst.castShadow = !isSoftwareGl;

    let treeIdx = 0;
    for (let i = 0; i < 120 && treeIdx < treeCount; i++) {
      const angle = (i / 120) * Math.PI * 2 + (i % 3) * 0.09;
      // Leave narrow gaps on N/S/E/W trails so zombies emerge naturally along trails
      const cosA = Math.abs(Math.cos(angle));
      const sinA = Math.abs(Math.sin(angle));
      if (cosA < 0.11 || sinA < 0.11) continue;

      const radius = 19.2 + ((i * 37) % 14);
      const tx = Math.cos(angle) * radius;
      const tz = Math.sin(angle) * radius;
      const scale = 0.85 + ((i * 19) % 35) / 100;

      _dummyObj.position.set(tx, 0.9 * scale, tz);
      _dummyObj.rotation.set(0, (i * 1.1) % Math.PI, 0);
      _dummyObj.scale.setScalar(scale);
      _dummyObj.updateMatrix();
      trunkInst.setMatrixAt(treeIdx, _dummyObj.matrix);

      _dummyObj.position.set(tx, 2.3 * scale, tz);
      _dummyObj.updateMatrix();
      tier1Inst.setMatrixAt(treeIdx, _dummyObj.matrix);

      _dummyObj.position.set(tx, 3.65 * scale, tz);
      _dummyObj.updateMatrix();
      tier2Inst.setMatrixAt(treeIdx, _dummyObj.matrix);

      const shade = 0.18 + ((i * 13) % 12) / 100;
      _color.setHSL(0.38, 0.45, shade);
      tier1Inst.setColorAt(treeIdx, _color);
      _color.setHSL(0.39, 0.48, shade + 0.04);
      tier2Inst.setColorAt(treeIdx, _color);

      treeIdx++;
    }
    trunkInst.instanceMatrix.needsUpdate = true;
    tier1Inst.instanceMatrix.needsUpdate = true;
    tier2Inst.instanceMatrix.needsUpdate = true;
    if (tier1Inst.instanceColor) tier1Inst.instanceColor.needsUpdate = true;
    if (tier2Inst.instanceColor) tier2Inst.instanceColor.needsUpdate = true;
    trunkInst.computeBoundingSphere();
    tier1Inst.computeBoundingSphere();
    tier2Inst.computeBoundingSphere();
    scene.add(trunkInst, tier1Inst, tier2Inst);

    // Central Ranger Fort at (0, 0)
    const fortGroup = createCentralFortModel();
    scene.add(fortGroup);

    // Ranger Rue Rig
    const rueRig = createRangerRueModel();
    rueRig.group.position.set(0, 0, 4.0);
    scene.add(rueRig.group);

    // Lantern Flare Expanding Shockwave Ring Mesh
    const flareRingGeo = new THREE.RingGeometry(0.6, 1.0, 32);
    flareRingGeo.rotateX(-Math.PI / 2);
    const flareRingMat = new THREE.MeshBasicMaterial({
      color: 0xff9e1b,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const flareRingMesh = new THREE.Mesh(flareRingGeo, flareRingMat);
    flareRingMesh.position.y = 0.18;
    scene.add(flareRingMesh);

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
      flareRingMat.color.setHex(spec.threeColor);
      const lMat = rueRig.lanternMesh.material as THREE.MeshStandardMaterial;
      lMat.emissive.setHex(spec.threeColor);
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
    let runOutcome: 'victory' | 'defeat' | null = null;
    let elapsedRunSeconds = 0;
    let statusBanner: string | null = 'Day 1: Gather resources & fortify pads before nightfall!';
    let statusBannerTimer = 4.5;
    let cameraZoom = 1.0;
    let dockCollapsed = false;
    let cameraTrauma = 0;
    let hitstopTimer = 0;
    let nightBlend = 0; // 0 = Day, 1 = Night

    // Rue kinematics
    let rueX = 0;
    let rueZ = 4.0;
    let rueRotationY = 0;
    let rueWalkPhase = 0;
    let rueHammerSwingTimer = 0;
    let rueGatherCooldown = 0;
    let rueAttackCooldown = 0;
    let moveTarget: { x: number; z: number } | null = null;
    let moveTargetAlpha = 0;

    // Placement Pads & 3D Meshes
    let pads: PlacementPad[] = createInitialPads();
    const padMeshesMap = new Map<number, THREE.Group>();
    const buildingMeshesMap = new Map<number, THREE.Group>();
    const interactableTargets: THREE.Object3D[] = [outerGround, clearingDisc];

    function rebuildPadVisuals() {
      pads.forEach((pad) => {
        if (!padMeshesMap.has(pad.id)) {
          const padMesh = createPlacementPadMesh(pad.ring);
          padMesh.position.set(pad.x, 0, pad.z);
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
          buildingMeshesMap.delete(pad.id);
        }
        if (pad.building) {
          const bldMesh = createBuildingModel(pad.building.type, pad.building.upgradePath);
          bldMesh.position.set(pad.x, 0.14, pad.z);
          bldMesh.userData = { kind: 'pad', padId: pad.id };
          scene.add(bldMesh);
          buildingMeshesMap.set(pad.id, bldMesh);
        }
      });
    }
    rebuildPadVisuals();

    // Forest Resource Nodes (Wood, Stone, Food)
    const resourceNodes: ResourceNodeEntity[] = [
      { id: 101, type: 'wood', name: 'Fallen Timber', x: -11.5, z: -6.5, amount: 60, maxAmount: 60, hitFlashTimer: 0, respawnTimer: 0 },
      { id: 102, type: 'wood', name: 'Old Pine Stump', x: 11.2, z: -7.2, amount: 60, maxAmount: 60, hitFlashTimer: 0, respawnTimer: 0 },
      { id: 103, type: 'wood', name: 'Hollow Log', x: -12.0, z: 7.0, amount: 60, maxAmount: 60, hitFlashTimer: 0, respawnTimer: 0 },
      { id: 104, type: 'stone', name: 'Granite Outcrop', x: -7.8, z: -11.2, amount: 55, maxAmount: 55, hitFlashTimer: 0, respawnTimer: 0 },
      { id: 105, type: 'stone', name: 'Mossy Boulder', x: 11.8, z: 6.8, amount: 55, maxAmount: 55, hitFlashTimer: 0, respawnTimer: 0 },
      { id: 106, type: 'stone', name: 'Quartz Vein', x: 6.5, z: -11.8, amount: 55, maxAmount: 55, hitFlashTimer: 0, respawnTimer: 0 },
      { id: 107, type: 'food', name: 'Spooky Berry Bush', x: -6.8, z: 11.2, amount: 50, maxAmount: 50, hitFlashTimer: 0, respawnTimer: 0 },
      { id: 108, type: 'food', name: 'Glowcap Mushrooms', x: 7.5, z: 11.0, amount: 50, maxAmount: 50, hitFlashTimer: 0, respawnTimer: 0 },
    ];
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

    function setBanner(msg: string, duration = 3.5) {
      statusBanner = msg;
      statusBannerTimer = duration;
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
      runOutcome = null;
      elapsedRunSeconds = 0;
      cameraTrauma = 0;
      hitstopTimer = 0;
      rueX = 0;
      rueZ = 4.0;
      rueRotationY = 0;
      moveTarget = null;
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
        if (dailyState.coins < 50 || dailyState.tickets >= dailyState.maxDailyTickets) return;
        dailyState = {
          ...dailyState,
          coins: dailyState.coins - 50,
          tickets: Math.min(dailyState.maxDailyTickets, dailyState.tickets + 1),
        };
        saveDailyStateToStorage(dailyState);
        syncHud(true);
      },
      selectPad: (padId) => {
        selectedPadId = padId;
        if (padId !== null) {
          const pad = pads.find((p) => p.id === padId);
          if (pad) {
            selectRingMesh.position.set(pad.x, 0.08, pad.z);
            selectRingMesh.visible = true;
          }
        } else {
          selectRingMesh.visible = false;
        }
        syncHud(true);
      },
      buildOnSelectedPad: (type) => {
        if (screenState !== 'playing') return;
        let targetPad = pads.find((p) => p.id === selectedPadId);
        if (!targetPad || targetPad.building !== null) {
          targetPad = pads.find((p) => p.building === null);
          if (targetPad) selectedPadId = targetPad.id;
        }
        if (!targetPad) return;

        const res = buildStructureOnPad(targetPad, resources, type);
        if (res.success) {
          pads = pads.map((p) => (p.id === targetPad!.id ? res.updatedPad : p));
          resources = res.updatedResources;
          score += 50;
          applyTaskEvent({ buildingsBuiltDelta: 1, runScore: score });
          rebuildPadVisuals();
          soundFX.playBuild(false);
          spawnParticles(targetPad.x, 1.0, targetPad.z, 14, 0xfbbf24, 4.5);
          addCallout(`Built ${BUILDING_CATALOG[type].name}!`, targetPad.x, 2.2, targetPad.z, '#4ade80');
          syncHud(true);
        } else {
          setBanner('Not enough resources to build that structure!', 2.5);
          syncHud(true);
        }
      },
      upgradeSelectedPad: (pathId) => {
        if (screenState !== 'playing' || selectedPadId === null) return;
        const targetPad = pads.find((p) => p.id === selectedPadId);
        if (!targetPad || !targetPad.building) return;

        const res = upgradeStructureOnPad(targetPad, resources, pathId);
        if (res.success) {
          pads = pads.map((p) => (p.id === targetPad.id ? res.updatedPad : p));
          resources = res.updatedResources;
          score += 120;
          applyTaskEvent({ runScore: score });
          rebuildPadVisuals();
          soundFX.playBuild(true);
          spawnParticles(targetPad.x, 1.5, targetPad.z, 20, 0x38bdf8, 5.2);
          const upName = BUILDING_CATALOG[targetPad.building.type].paths[pathId].name;
          addCallout(`Upgraded: ${upName}!`, targetPad.x, 2.5, targetPad.z, '#fbbf24');
          syncHud(true);
        } else {
          setBanner('Need more Wood, Stone, or Food for that upgrade!', 2.5);
          syncHud(true);
        }
      },
      repairSelectedPad: () => {
        if (screenState !== 'playing' || selectedPadId === null) return;
        const targetPad = pads.find((p) => p.id === selectedPadId);
        if (!targetPad || !targetPad.building) return;
        if (targetPad.building.hp >= targetPad.building.maxHp) return;
        const repairCost = { wood: 10, stone: 5, food: 0 };
        if (!canAfford(resources, repairCost)) {
          setBanner('Need 10 Wood & 5 Stone to repair!', 2.0);
          syncHud(true);
          return;
        }
        resources = deductCost(resources, repairCost);
        targetPad.building.hp = targetPad.building.maxHp;
        soundFX.playBuild(false);
        addCallout('Repaired!', targetPad.x, 2.0, targetPad.z, '#4ade80');
        syncHud(true);
      },
      demolishSelectedPad: () => {
        if (screenState !== 'playing' || selectedPadId === null) return;
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
        if (screenState !== 'playing' || flareCooldown > 0.05) return;
        flareCooldown = LANTERN_FLARE_COOLDOWN;
        flareWaveTimer = 0.55;
        flareOriginX = rueX;
        flareOriginZ = rueZ;
        soundFX.playLanternFlare();
        cameraTrauma = Math.min(1.0, cameraTrauma + 0.35);
        const flareColor =
          LANTERN_COSMETICS[dailyState.equippedLanternId]?.threeColor ?? 0xff9e1b;
        spawnParticles(rueX, 1.1, rueZ, 24, flareColor, 6.5);
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
            ? `Lantern Flare! (${shatteredCount} Armor Shattered!)`
            : affectedCount > 0
            ? `Lantern Flare! (${affectedCount} stunned)`
            : 'Lantern Flare!',
          rueX,
          2.4,
          rueZ,
          '#fbbf24'
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
        cameraZoom = THREE.MathUtils.clamp(cameraZoom + delta, 0.75, 1.3);
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

    // Raycasting for Click-to-Move, Node Gathering & Pad Selection
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();

    const onPointerDown = (e: PointerEvent) => {
      if (screenState !== 'playing') return;
      if (e.button !== 0 && e.pointerType === 'mouse') return;

      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(interactableTargets, true);
      if (hits.length === 0) return;

      // Prioritize pad or resource node hits before ground
      const padHit = hits.find((h) => h.object.userData?.kind === 'pad');
      if (padHit) {
        const padId = padHit.object.userData.padId as number;
        api.selectPad(padId);
        const pad = pads.find((p) => p.id === padId);
        if (pad) {
          moveTarget = { x: pad.x, z: pad.z + 1.5 };
          moveTargetRing.position.set(pad.x, 0.06, pad.z + 1.5);
          moveTargetAlpha = 0.85;
        }
        return;
      }

      const nodeHit = hits.find((h) => h.object.userData?.kind === 'node');
      if (nodeHit) {
        const nodeId = nodeHit.object.userData.nodeId as number;
        const node = resourceNodes.find((n) => n.id === nodeId);
        if (node) {
          moveTarget = { x: node.x, z: node.z };
          moveTargetRing.position.set(node.x, 0.06, node.z);
          moveTargetAlpha = 0.9;
        }
        return;
      }

      // Ground click -> Click-to-Move / Tap-to-Move
      const groundPoint = hits[0].point;
      const clampedR = Math.min(16.8, Math.hypot(groundPoint.x, groundPoint.z));
      const angle = Math.atan2(groundPoint.z, groundPoint.x);
      const gx = Math.cos(angle) * clampedR;
      const gz = Math.sin(angle) * clampedR;
      moveTarget = { x: gx, z: gz };
      moveTargetRing.position.set(gx, 0.06, gz);
      moveTargetAlpha = 0.85;
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);

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
        pads: pads.map((p) => ({
          ...p,
          building: p.building ? { ...p.building } : null,
        })),
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

    function stepSimulation(rawDt: number) {
      const dt = Math.min(rawDt, 0.05);

      // Update status banner & ghost HP bar
      if (statusBannerTimer > 0) {
        statusBannerTimer = Math.max(0, statusBannerTimer - dt);
      }
      fortGhostHp = THREE.MathUtils.damp(fortGhostHp, fortHp, 3.2, dt);

      // Day <-> Night Lighting & Fog Atmosphere Interpolation
      const targetNightBlend = phase === 'night' ? 1.0 : 0.0;
      nightBlend = THREE.MathUtils.damp(nightBlend, targetNightBlend, 2.2, dt);

      _color.copy(_daySkyColor).lerp(_nightSkyColor, nightBlend);
      scene.background = _color.clone();
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.copy(_color);
        scene.fog.density = THREE.MathUtils.lerp(0.014, 0.022, nightBlend);
      }
      keyLight.color.copy(_daySunColor).lerp(_nightMoonColor, nightBlend);
      keyLight.intensity = THREE.MathUtils.lerp(1.65, 0.72, nightBlend);
      hemiLight.color.copy(_dayHemiSky).lerp(_nightHemiSky, nightBlend);
      hemiLight.intensity = THREE.MathUtils.lerp(0.85, 0.42, nightBlend);
      rueLanternLight.intensity = THREE.MathUtils.lerp(1.8, 3.4, nightBlend);
      fortWarmLight.intensity = THREE.MathUtils.lerp(1.5, 2.8, nightBlend);

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
        const progress = 1 - flareWaveTimer / 0.55;
        const r = 0.5 + progress * LANTERN_FLARE_RADIUS;
        flareRingMesh.position.set(flareOriginX, 0.22, flareOriginZ);
        flareRingMesh.scale.setScalar(r);
        flareRingMat.opacity = (1 - progress) * 0.85;
      } else {
        flareRingMat.opacity = 0;
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

      // Animate Rue's gait, nervous head glance & hammer swing
      const bounce = Math.abs(Math.sin(rueWalkPhase)) * 0.14;
      rueRig.group.position.set(rueX, bounce, rueZ);
      rueRig.group.rotation.y = rueRotationY;
      rueRig.leftArm.rotation.z = Math.sin(rueWalkPhase * 0.5) * 0.08;
      rueLanternLight.position.set(rueX + Math.sin(rueRotationY) * 0.5, 1.45, rueZ + Math.cos(rueRotationY) * 0.5);

      if (rueHammerSwingTimer > 0) {
        rueHammerSwingTimer = Math.max(0, rueHammerSwingTimer - dt * 4.5);
        rueRig.rightArm.rotation.x = -Math.sin(rueHammerSwingTimer * Math.PI) * 1.35;
      } else {
        rueRig.rightArm.rotation.x = THREE.MathUtils.damp(rueRig.rightArm.rotation.x, 0, 10, dt);
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
        // - Swift Stumblers slip past outer-ring structures unless slowed, rushing inner pads or the Central Fort!
        // - Old Grumble detours from 5.2m away to smash warm Campfires and outer structures.
        let targetX = 0;
        let targetZ = 0;
        let targetPad: PlacementPad | null = null;
        let minPadDist = z.type === 'grumble' ? 5.2 : 2.8;
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

        const dx = targetX - z.x;
        const dz = targetZ - z.z;
        const distToTarget = Math.hypot(dx, dz);
        const stopRadius = targetPad ? 1.65 : 3.25;

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
          // Attack building or Fort!
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
              if (targetPad && targetPad.building) {
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
              if (targetPad && targetPad.building) {
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

      // Subtle pan toward Rue while keeping Fort (0,0) squarely in frame
      const targetLookX = rueX * 0.18 + shakeX;
      const targetLookZ = rueZ * 0.18 + shakeZ;
      const nightZoom = THREE.MathUtils.lerp(1.0, 0.9, nightBlend);
      const distFactor = 24.5 * cameraZoom * nightZoom;

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
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
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
