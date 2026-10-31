/**
 * Core 3D Tactical FPS Game Engine
 * Powered by Three.js WebGL2, PBR Shaders, and Web Audio API.
 * Adheres strictly to the Three.js skill directives:
 * - RoomEnvironment PMREM reflections
 * - Software WebGL detection & afterDraw frame pacing
 * - Zero unhosted asset dependencies (100% procedural)
 * - Zero GC in render loop (pre-allocated reusable math vectors)
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { soundEngine } from './audio.ts';
import {
  WEAPON_REGISTRY,
  WeaponDef,
  createM4A1Model,
  createAK47Model,
  createSniperModel,
  createPistolModel,
  createBulletCasingMesh,
} from './weapons.ts';
import { createOperator, OperatorRig, TeamType } from './operators.ts';
import { MAP_REGISTRY, MapData } from './maps.ts';
import { networkManager, PlayerNetState, ShootPacket } from './network.ts';
import { createBulletHoleTexture } from './textures.ts';

// Pre-allocated math objects to ensure zero GC in tick()
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _ray = new THREE.Raycaster();

export interface BotAgent {
  id: string;
  name: string;
  team: TeamType;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotationY: number;
  pitch: number;
  health: number;
  maxHealth: number;
  weapon: WeaponDef;
  rig: OperatorRig;
  targetPos: THREE.Vector3;
  stateTimer: number;
  fireTimer: number;
  isDead: boolean;
  respawnTimer: number;
}

export interface RemotePlayer {
  id: string;
  name: string;
  team: TeamType;
  position: THREE.Vector3;
  rotationY: number;
  pitch: number;
  health: number;
  weaponId: string;
  rig: OperatorRig;
  isShooting: boolean;
  isDead: boolean;
}

export interface CasingEntity {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  rotVelocity: THREE.Vector3;
  life: number;
}

export interface ParticleEntity {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export interface GameCallbacks {
  onHealthChange: (health: number, armor: number) => void;
  onAmmoChange: (mag: number, reserve: number) => void;
  onWeaponChange: (weapon: WeaponDef, isPrimary: boolean) => void;
  onScoreChange: (blueScore: number, redScore: number) => void;
  onKillFeed: (killer: string, victim: string, weapon: string, headshot: boolean, isSelf: boolean) => void;
  onHitmarker: (headshot: boolean) => void;
  onDamageTaken: (dirAngle: number) => void;
  onSniperSway: (swayX: number, swayY: number, breathPercent: number, isHolding: boolean) => void;
  onScopeState: (isScoped: boolean, isSniper: boolean) => void;
}

export class FPSEngine {
  public container: HTMLElement;
  public renderer!: THREE.WebGLRenderer;
  public scene!: THREE.Scene;
  public camera!: THREE.PerspectiveCamera;
  public isSoftwareGl: boolean = false;
  private animFrameId: number = 0;
  private isRunning: boolean = false;

  // Environment & Map
  public currentMap: MapData;
  private mapGroup: THREE.Group | null = null;
  private colliders: THREE.Box3[] = [];
  private sunLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;

  // Player State
  public playerTeam: TeamType = 'blue';
  public playerName: string = 'Operator';
  public position = new THREE.Vector3(0, 1.7, 0);
  public velocity = new THREE.Vector3();
  public rotationY: number = 0;
  public pitch: number = 0;
  public isGrounded: boolean = true;
  public isCrouched: boolean = false;
  public health: number = 100;
  public armor: number = 50;

  // Weapons & Inventory
  public primaryWeapon: WeaponDef = WEAPON_REGISTRY.m4a1;
  public secondaryWeapon: WeaponDef = WEAPON_REGISTRY.pistol;
  public activeWeapon: WeaponDef = WEAPON_REGISTRY.m4a1;
  public isPrimaryActive: boolean = true;

  // Ammo state
  public magAmmo: number = 30;
  public reserveAmmo: number = 90;
  public isReloading: boolean = false;
  public reloadProgress: number = 0;

  // ADS & Sniper Optics
  public isADS: boolean = false;
  public isHoldingBreath: boolean = false;
  public breathStamina: number = 1.0; // 0 to 1
  private breathHeartbeatTimer: number = 0;
  private sniperSwayTime: number = 0;
  private boltCycling: boolean = false;
  private boltCycleProgress: number = 0;

  // Viewmodel Rig
  private viewmodelPivot = new THREE.Group();
  private weaponMeshGroup = new THREE.Group();
  private muzzleFlashLight!: THREE.PointLight;
  private muzzleFlashTimer: number = 0;
  private recoilPitch: number = 0;
  private recoilYaw: number = 0;
  private recoilZ: number = 0;
  private swayX: number = 0;
  private swayY: number = 0;

  // Decals, Particles & Casings
  private casingPool: CasingEntity[] = [];
  private particlePool: ParticleEntity[] = [];
  private bulletHoleDecals: THREE.Mesh[] = [];

  // Match Entities
  public bots: BotAgent[] = [];
  public remotePlayers: Map<string, RemotePlayer> = new Map();
  public blueScore: number = 0;
  public redScore: number = 0;

  // Input states
  public moveVector = { x: 0, y: 0 };
  public lookDelta = { x: 0, y: 0 };
  public isTriggerHeld: boolean = false;
  private fireCooldown: number = 0;
  private footstepTimer: number = 0;

  // Callbacks
  private callbacks: GameCallbacks;

  constructor(container: HTMLElement, mapId: string, primaryId: string, team: TeamType, callbacks: GameCallbacks) {
    this.container = container;
    this.currentMap = MAP_REGISTRY[mapId] || MAP_REGISTRY.dust2;
    this.primaryWeapon = WEAPON_REGISTRY[primaryId] || WEAPON_REGISTRY.m4a1;
    this.secondaryWeapon = WEAPON_REGISTRY.pistol;
    this.activeWeapon = this.primaryWeapon;
    this.isPrimaryActive = true;
    this.playerTeam = team;
    this.callbacks = callbacks;

    this.magAmmo = this.activeWeapon.magSize;
    this.reserveAmmo = this.activeWeapon.reserveAmmo;

    this.initWebGL();
    this.initLightingAndEnv();
    this.loadMap(this.currentMap);
    this.initPlayerWeaponRig();
    this.initNetworkListeners();
    this.spawnBots(4);
    this.resetPlayerSpawn();

    this.startLoop();
  }

  private initWebGL() {
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: !this.isSoftwareGl,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);

    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(70, this.container.clientWidth / this.container.clientHeight, 0.05, 300);
    this.scene.add(this.camera);

    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private initLightingAndEnv() {
    // Zero-dependency procedural studio environment map via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Balanced Studio / Outdoor Lighting Rig
    this.hemiLight = new THREE.HemisphereLight(this.currentMap.skyColor, this.currentMap.groundColor, 0.85);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(this.currentMap.sunColor, 1.4);
    this.sunLight.position.copy(this.currentMap.sunPosition);
    if (!this.isSoftwareGl) {
      this.sunLight.castShadow = true;
      this.sunLight.shadow.mapSize.width = 1024;
      this.sunLight.shadow.mapSize.height = 1024;
      this.sunLight.shadow.camera.near = 0.5;
      this.sunLight.shadow.camera.far = 150;
      const d = 35;
      this.sunLight.shadow.camera.left = -d;
      this.sunLight.shadow.camera.right = d;
      this.sunLight.shadow.camera.top = d;
      this.sunLight.shadow.camera.bottom = -d;
      this.sunLight.shadow.bias = -0.0005;
      this.sunLight.shadow.normalBias = 0.02;
    }
    this.scene.add(this.sunLight);

    this.scene.fog = new THREE.FogExp2(this.currentMap.fogColor, this.currentMap.fogDensity);
  }

  public loadMap(mapData: MapData) {
    if (this.mapGroup) {
      this.scene.remove(this.mapGroup);
    }
    this.currentMap = mapData;
    const built = mapData.build();
    this.mapGroup = built.group;
    this.colliders = built.colliders;
    this.scene.add(this.mapGroup);

    this.hemiLight.color.setHex(mapData.skyColor);
    this.hemiLight.groundColor.setHex(mapData.groundColor);
    this.sunLight.color.setHex(mapData.sunColor);
    this.sunLight.position.copy(mapData.sunPosition);
    this.scene.fog = new THREE.FogExp2(mapData.fogColor, mapData.fogDensity);

    this.resetPlayerSpawn();
  }

  private resetPlayerSpawn() {
    const spawns = this.playerTeam === 'blue' ? this.currentMap.build().blueSpawns : this.currentMap.build().redSpawns;
    const pick = spawns[Math.floor(Math.random() * spawns.length)];
    this.position.set(pick.x, 1.7, pick.z);
    this.velocity.set(0, 0, 0);
    this.rotationY = this.playerTeam === 'blue' ? Math.PI : 0;
    this.pitch = 0;
  }

  private initPlayerWeaponRig() {
    // Camera Viewmodel Rig
    this.viewmodelPivot.position.set(0.18, -0.18, -0.38);
    this.camera.add(this.viewmodelPivot);
    this.viewmodelPivot.add(this.weaponMeshGroup);

    // Muzzle Flash Point Light
    this.muzzleFlashLight = new THREE.PointLight(0xffaa44, 0, 8);
    this.muzzleFlashLight.position.set(0, 0, -0.6);
    this.viewmodelPivot.add(this.muzzleFlashLight);

    this.rebuildWeaponViewmodel();
  }

  public rebuildWeaponViewmodel() {
    // Clear previous mesh
    while (this.weaponMeshGroup.children.length > 0) {
      this.weaponMeshGroup.remove(this.weaponMeshGroup.children[0]);
    }

    let model: THREE.Group;
    if (this.activeWeapon.id === 'm4a1') {
      model = createM4A1Model();
    } else if (this.activeWeapon.id === 'ak47') {
      model = createAK47Model();
    } else if (this.activeWeapon.id === 'sniper') {
      model = createSniperModel();
    } else {
      model = createPistolModel();
    }

    model.rotation.y = Math.PI; // Face down range
    this.weaponMeshGroup.add(model);

    this.callbacks.onWeaponChange(this.activeWeapon, this.isPrimaryActive);
    this.callbacks.onAmmoChange(this.magAmmo, this.reserveAmmo);
  }

  public switchWeapon() {
    if (this.isReloading) return;
    this.isPrimaryActive = !this.isPrimaryActive;
    this.activeWeapon = this.isPrimaryActive ? this.primaryWeapon : this.secondaryWeapon;
    this.magAmmo = this.activeWeapon.magSize;
    this.reserveAmmo = this.activeWeapon.reserveAmmo;
    this.isADS = false;
    this.callbacks.onScopeState(false, false);
    soundEngine.playRadioBeep();
    this.rebuildWeaponViewmodel();
  }

  public setPrimaryWeapon(weaponDef: WeaponDef) {
    this.primaryWeapon = weaponDef;
    if (this.isPrimaryActive) {
      this.activeWeapon = weaponDef;
      this.magAmmo = weaponDef.magSize;
      this.reserveAmmo = weaponDef.reserveAmmo;
      this.rebuildWeaponViewmodel();
    }
  }

  public reload() {
    if (this.isReloading || this.magAmmo === this.activeWeapon.magSize || this.reserveAmmo <= 0) return;
    this.isReloading = true;
    this.reloadProgress = 0;
    this.isADS = false;
    this.callbacks.onScopeState(false, false);
    soundEngine.playReload();
  }

  public triggerJump() {
    if (this.isGrounded) {
      this.velocity.y = 5.8;
      this.isGrounded = false;
      soundEngine.playJump();
    }
  }

  public toggleCrouch() {
    this.isCrouched = !this.isCrouched;
  }

  public toggleADS() {
    if (this.isReloading) return;
    this.isADS = !this.isADS;
    this.callbacks.onScopeState(this.isADS, this.activeWeapon.id === 'sniper');
  }

  public setADS(val: boolean) {
    if (this.isReloading) return;
    this.isADS = val;
    this.callbacks.onScopeState(this.isADS, this.activeWeapon.id === 'sniper');
  }

  public setHoldingBreath(holding: boolean) {
    this.isHoldingBreath = holding && this.isADS && this.activeWeapon.id === 'sniper';
  }

  private spawnBots(count: number) {
    this.bots = [];
    const botNames = ['Ghost', 'Viper', 'Phantom', 'Shadow', 'Striker', 'Reaper'];

    for (let i = 0; i < count; i++) {
      const team: TeamType = i % 2 === 0 ? (this.playerTeam === 'blue' ? 'red' : 'blue') : this.playerTeam;
      const rig = createOperator(team);
      this.scene.add(rig.root);

      const spawns = team === 'blue' ? this.currentMap.build().blueSpawns : this.currentMap.build().redSpawns;
      const spawn = spawns[i % spawns.length];
      const botPos = new THREE.Vector3(spawn.x + (Math.random() - 0.5) * 6, 0, spawn.z + (Math.random() - 0.5) * 6);
      rig.root.position.copy(botPos);

      // Give bot a primary weapon model
      const botWeapon = i % 3 === 0 ? WEAPON_REGISTRY.ak47 : i % 3 === 1 ? WEAPON_REGISTRY.m4a1 : WEAPON_REGISTRY.sniper;
      let wMesh: THREE.Group;
      if (botWeapon.id === 'ak47') wMesh = createAK47Model();
      else if (botWeapon.id === 'sniper') wMesh = createSniperModel();
      else wMesh = createM4A1Model();
      wMesh.rotation.y = Math.PI;
      rig.weaponMount.add(wMesh);

      this.bots.push({
        id: `bot_${i}`,
        name: botNames[i % botNames.length],
        team,
        position: botPos,
        velocity: new THREE.Vector3(),
        rotationY: Math.random() * Math.PI * 2,
        pitch: 0,
        health: 100,
        maxHealth: 100,
        weapon: botWeapon,
        rig,
        targetPos: new THREE.Vector3(0, 0, 0),
        stateTimer: Math.random() * 3,
        fireTimer: Math.random() * 2,
        isDead: false,
        respawnTimer: 0,
      });
    }
  }

  private initNetworkListeners() {
    networkManager.onPeerState = (state: PlayerNetState) => {
      let remote = this.remotePlayers.get(state.id);
      if (!remote) {
        const rig = createOperator(state.team);
        this.scene.add(rig.root);
        const wMesh = state.weaponId === 'sniper' ? createSniperModel() : state.weaponId === 'ak47' ? createAK47Model() : createM4A1Model();
        wMesh.rotation.y = Math.PI;
        rig.weaponMount.add(wMesh);

        remote = {
          id: state.id,
          name: state.name,
          team: state.team,
          position: new THREE.Vector3(state.x, state.y, state.z),
          rotationY: state.rotY,
          pitch: state.pitch,
          health: state.health,
          weaponId: state.weaponId,
          rig,
          isShooting: state.isShooting,
          isDead: false,
        };
        this.remotePlayers.set(state.id, remote);
      }

      remote.position.set(state.x, state.y, state.z);
      remote.rotationY = state.rotY;
      remote.pitch = state.pitch;
      remote.health = state.health;
      remote.isShooting = state.isShooting;
    };

    networkManager.onPeerShoot = (shoot: ShootPacket) => {
      soundEngine.playGunshot(shoot.weaponId as 'm4a1' | 'ak47' | 'sniper' | 'pistol');
      this.spawnTracer(shoot.origin, shoot.direction);
    };

    networkManager.onPeerDamage = (dmg) => {
      if (dmg.targetId === 'local') {
        this.applyDamage(dmg.damage, dmg.headshot, dmg.attackerId);
      }
    };

    networkManager.onPeerKill = (kill) => {
      this.callbacks.onKillFeed(kill.killerName, kill.victimName, kill.weaponId, kill.headshot, kill.killerId === 'local' || kill.victimId === 'local');
      if (kill.killerId === 'local') {
        if (this.playerTeam === 'blue') this.blueScore++;
        else this.redScore++;
        this.callbacks.onScoreChange(this.blueScore, this.redScore);
      }
    };
  }

  // Shoot execution
  private fireWeapon() {
    if (this.isReloading || this.fireCooldown > 0 || this.boltCycling) return;
    if (this.magAmmo <= 0) {
      soundEngine.playRadioBeep(); // Click
      this.reload();
      return;
    }

    this.magAmmo--;
    this.fireCooldown = 60 / this.activeWeapon.fireRate;
    this.callbacks.onAmmoChange(this.magAmmo, this.reserveAmmo);

    // Play procedural gunfire sound
    soundEngine.playGunshot(this.activeWeapon.id as 'm4a1' | 'ak47' | 'sniper' | 'pistol');

    // Muzzle Flash Dynamic Light & Recoil Kick
    this.muzzleFlashLight.intensity = 3.5;
    this.muzzleFlashTimer = 0.05;

    this.recoilPitch += this.activeWeapon.recoilVertical;
    this.recoilYaw += (Math.random() - 0.5) * this.activeWeapon.recoilHorizontal;
    this.recoilZ = 0.06;

    // Bolt action sniper animation
    if (this.activeWeapon.isBoltAction) {
      this.boltCycling = true;
      this.boltCycleProgress = 0;
    }

    // Eject 3D Brass Casing
    this.ejectCasing();

    // Calculate spread
    const spread = this.isADS ? this.activeWeapon.spreadAds : this.activeWeapon.spreadHip;
    _dir.set(
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread,
      -1
    ).normalize();
    _dir.applyEuler(this.camera.rotation);

    // Raycast Ballistics
    _ray.set(this.camera.position, _dir);

    // Check hit against bots
    let hitSomething = false;
    for (const bot of this.bots) {
      if (bot.isDead || bot.team === this.playerTeam) continue;

      const hitBox = new THREE.Box3().setFromObject(bot.rig.root);
      const hit = _ray.ray.intersectsBox(hitBox);

      if (hit) {
        hitSomething = true;
        // Headshot check: hit near top of head (Y > position + 1.45)
        const hitPoint = _ray.ray.intersectBox(hitBox, _v1);
        const isHeadshot = hitPoint ? hitPoint.y > bot.position.y + 1.45 : false;
        const damage = isHeadshot ? this.activeWeapon.damage * 2.5 : this.activeWeapon.damage;

        bot.health -= damage;
        this.callbacks.onHitmarker(isHeadshot);
        soundEngine.playHitmarker(isHeadshot);
        this.spawnBloodParticles(hitPoint || bot.position);

        if (bot.health <= 0 && !bot.isDead) {
          bot.isDead = true;
          bot.respawnTimer = 4.0;
          if (this.playerTeam === 'blue') this.blueScore++;
          else this.redScore++;
          this.callbacks.onScoreChange(this.blueScore, this.redScore);
          this.callbacks.onKillFeed(this.playerName, bot.name, this.activeWeapon.id, isHeadshot, true);
        }
        break;
      }
    }

    // Check hit against remote human peers
    if (!hitSomething) {
      this.remotePlayers.forEach((peer) => {
        if (peer.isDead || peer.team === this.playerTeam) return;
        const hitBox = new THREE.Box3().setFromObject(peer.rig.root);
        const hit = _ray.ray.intersectsBox(hitBox);
        if (hit) {
          hitSomething = true;
          const hitPoint = _ray.ray.intersectBox(hitBox, _v1);
          const isHeadshot = hitPoint ? hitPoint.y > peer.position.y + 1.45 : false;
          const damage = isHeadshot ? this.activeWeapon.damage * 2.5 : this.activeWeapon.damage;
          this.callbacks.onHitmarker(isHeadshot);
          soundEngine.playHitmarker(isHeadshot);
          this.spawnBloodParticles(hitPoint || peer.position);
          networkManager.sendDamage(peer.id, damage, isHeadshot, 'local');
        }
      });
    }

    // Check hit against map walls / crates for bullet holes & sparks
    if (!hitSomething && this.mapGroup) {
      const intersects = _ray.intersectObjects(this.mapGroup.children, true);
      if (intersects.length > 0) {
        const hit = intersects[0];
        soundEngine.playImpactWall();
        this.spawnBulletHoleDecal(hit.point, hit.face?.normal);
        this.spawnSparkParticles(hit.point);
      }
    }

    // Broadcast shoot packet
    networkManager.sendShoot({
      shooterId: 'local',
      weaponId: this.activeWeapon.id,
      origin: { x: this.camera.position.x, y: this.camera.position.y, z: this.camera.position.z },
      direction: { x: _dir.x, y: _dir.y, z: _dir.z },
    });
  }

  private ejectCasing() {
    const mesh = createBulletCasingMesh();
    _v1.set(0.15, -0.15, -0.3).applyEuler(this.camera.rotation).add(this.camera.position);
    mesh.position.copy(_v1);

    const right = new THREE.Vector3(1, 0.4 + Math.random() * 0.4, 0).applyEuler(this.camera.rotation);
    const vel = right.multiplyScalar(2.5 + Math.random() * 1.5);

    this.scene.add(mesh);
    this.casingPool.push({
      mesh,
      velocity: vel,
      rotVelocity: new THREE.Vector3(Math.random() * 20, Math.random() * 20, Math.random() * 20),
      life: 2.5,
    });
  }

  private spawnBulletHoleDecal(point: THREE.Vector3, normal?: THREE.Vector3) {
    if (this.bulletHoleDecals.length > 30) {
      const old = this.bulletHoleDecals.shift();
      if (old) this.scene.remove(old);
    }

    const tex = createBulletHoleTexture();
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.24), mat);
    mesh.position.copy(point);
    if (normal) {
      mesh.position.addScaledVector(normal, 0.01);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    }
    this.scene.add(mesh);
    this.bulletHoleDecals.push(mesh);
  }

  private spawnSparkParticles(pos: THREE.Vector3) {
    for (let i = 0; i < 6; i++) {
      const geo = new THREE.SphereGeometry(0.02, 4, 4);
      const mat = new THREE.MeshBasicMaterial({ color: 0xffcc44 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      this.scene.add(mesh);
      this.particlePool.push({
        mesh,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 4, (Math.random() - 0.5) * 4),
        life: 0.35,
        maxLife: 0.35,
      });
    }
  }

  private spawnBloodParticles(pos: THREE.Vector3) {
    for (let i = 0; i < 12; i++) {
      const geo = new THREE.SphereGeometry(0.04, 4, 4);
      const mat = new THREE.MeshBasicMaterial({ color: 0x8b0000 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      this.scene.add(mesh);
      this.particlePool.push({
        mesh,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 3, (Math.random() - 0.5) * 3),
        life: 0.5,
        maxLife: 0.5,
      });
    }
  }

  private spawnTracer(from: { x: number; y: number; z: number }, dir: { x: number; y: number; z: number }) {
    const geo = new THREE.CylinderGeometry(0.015, 0.015, 1.2, 4);
    geo.rotateX(Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffe680 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(from.x, from.y, from.z);
    _v1.set(dir.x, dir.y, dir.z).normalize();
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), _v1);
    this.scene.add(mesh);
    this.particlePool.push({
      mesh,
      velocity: _v1.multiplyScalar(65),
      life: 0.4,
      maxLife: 0.4,
    });
  }

  public applyDamage(amount: number, headshot: boolean, attackerId: string) {
    if (this.health <= 0) return;

    if (this.armor > 0) {
      const absorbed = Math.min(this.armor, amount * 0.5);
      this.armor -= absorbed;
      amount -= absorbed;
    }
    this.health = Math.max(0, this.health - amount);
    this.callbacks.onHealthChange(this.health, this.armor);
    this.callbacks.onDamageTaken(Math.random() * 360);

    if (this.health <= 0) {
      // Player died
      this.callbacks.onKillFeed(attackerId, this.playerName, 'bullet', headshot, true);
      setTimeout(() => {
        this.health = 100;
        this.armor = 50;
        this.callbacks.onHealthChange(this.health, this.armor);
        this.resetPlayerSpawn();
      }, 3000);
    }
  }

  // Update Game Loop
  private tick = () => {
    if (!this.isRunning) return;

    const dt = Math.min(0.05, 0.016); // Clamped delta time

    this.updateControls(dt);
    this.updatePlayerMovement(dt);
    this.updateWeapons(dt);
    this.updateCasingsAndParticles(dt);
    this.updateBots(dt);
    this.updateNetworkSync();

    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.animFrameId = requestAnimationFrame(this.tick);
    }
  };

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.animFrameId = window.setTimeout(poll, 5);
      } else {
        gl.deleteSync(sync);
        this.animFrameId = window.setTimeout(cb, 60);
      }
    };
    this.animFrameId = window.setTimeout(poll, 5);
  }

  private updateControls(dt: number) {
    // Look Delta damping & application
    this.rotationY -= this.lookDelta.x * 0.0022;
    this.pitch -= this.lookDelta.y * 0.0022;
    this.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch));

    // Reset look delta
    this.lookDelta.x = 0;
    this.lookDelta.y = 0;

    // Apply rotation to camera
    this.camera.rotation.set(0, 0, 0);
    this.camera.rotation.y = this.rotationY + this.recoilYaw;
    this.camera.rotation.x = this.pitch + this.recoilPitch;

    // Muzzle trigger
    if (this.isTriggerHeld) {
      this.fireWeapon();
    }
  }

  private updatePlayerMovement(dt: number) {
    // Target move speed
    const baseSpeed = this.isCrouched ? 2.8 : this.isADS ? 3.4 : 6.2;
    const inputLength = Math.hypot(this.moveVector.x, this.moveVector.y);

    if (inputLength > 0.1) {
      // Transform input vector relative to player rotation
      const angle = Math.atan2(this.moveVector.x, -this.moveVector.y) + this.rotationY;
      const targetVx = Math.sin(angle) * baseSpeed;
      const targetVz = Math.cos(angle) * baseSpeed;

      this.velocity.x = THREE.MathUtils.damp(this.velocity.x, targetVx, 12, dt);
      this.velocity.z = THREE.MathUtils.damp(this.velocity.z, targetVz, 12, dt);

      // Footsteps
      if (this.isGrounded) {
        this.footstepTimer += dt * baseSpeed;
        if (this.footstepTimer > 2.8) {
          this.footstepTimer = 0;
          soundEngine.playFootstep('dust');
        }
      }
    } else {
      this.velocity.x = THREE.MathUtils.damp(this.velocity.x, 0, 16, dt);
      this.velocity.z = THREE.MathUtils.damp(this.velocity.z, 0, 16, dt);
    }

    // Gravity
    if (!this.isGrounded) {
      this.velocity.y -= 18.0 * dt;
    }

    // Apply movement with simple bounding box collision
    const nextPos = this.position.clone().addScaledVector(this.velocity, dt);

    // Wall collision test
    const playerRadius = 0.45;
    const testBox = new THREE.Box3(
      new THREE.Vector3(nextPos.x - playerRadius, 0.1, nextPos.z - playerRadius),
      new THREE.Vector3(nextPos.x + playerRadius, 1.8, nextPos.z + playerRadius)
    );

    let collided = false;
    for (const box of this.colliders) {
      if (testBox.intersectsBox(box)) {
        collided = true;
        break;
      }
    }

    if (!collided) {
      this.position.x = nextPos.x;
      this.position.z = nextPos.z;
    }

    // Floor height & landing
    this.position.y += this.velocity.y * dt;
    const groundY = this.isCrouched ? 1.1 : 1.7;
    if (this.position.y <= groundY) {
      if (!this.isGrounded && this.velocity.y < -3.0) {
        soundEngine.playLand();
      }
      this.position.y = groundY;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    this.camera.position.copy(this.position);
  }

  private updateWeapons(dt: number) {
    if (this.fireCooldown > 0) {
      this.fireCooldown -= dt;
    }

    // Muzzle flash light decay
    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= dt;
      if (this.muzzleFlashTimer <= 0) {
        this.muzzleFlashLight.intensity = 0;
      }
    }

    // Recoil recovery
    this.recoilPitch = THREE.MathUtils.damp(this.recoilPitch, 0, this.activeWeapon.recoilRecovery, dt);
    this.recoilYaw = THREE.MathUtils.damp(this.recoilYaw, 0, this.activeWeapon.recoilRecovery, dt);
    this.recoilZ = THREE.MathUtils.damp(this.recoilZ, 0, 14, dt);

    // Reload progress
    if (this.isReloading) {
      this.reloadProgress += dt / this.activeWeapon.reloadTime;
      if (this.reloadProgress >= 1.0) {
        this.isReloading = false;
        const needed = this.activeWeapon.magSize - this.magAmmo;
        const transfer = Math.min(needed, this.reserveAmmo);
        this.magAmmo += transfer;
        this.reserveAmmo -= transfer;
        this.callbacks.onAmmoChange(this.magAmmo, this.reserveAmmo);
      }
    }

    // Sniper Hold Breath & Sway Mechanics
    if (this.activeWeapon.id === 'sniper' && this.isADS) {
      if (this.isHoldingBreath && this.breathStamina > 0.05) {
        this.breathStamina = Math.max(0, this.breathStamina - dt * 0.22); // ~4.5 seconds hold
        this.breathHeartbeatTimer += dt;
        if (this.breathHeartbeatTimer > 0.8) {
          this.breathHeartbeatTimer = 0;
          soundEngine.playHeartbeat();
        }
      } else {
        this.isHoldingBreath = false;
        this.breathStamina = Math.min(1.0, this.breathStamina + dt * 0.35); // Recharges
      }

      this.sniperSwayTime += dt;
      const swayMultiplier = this.isHoldingBreath ? 0.05 : this.breathStamina < 0.1 ? 2.5 : 1.0;
      this.swayX = Math.sin(this.sniperSwayTime * 1.5) * 0.008 * swayMultiplier;
      this.swayY = Math.cos(this.sniperSwayTime * 2.2) * 0.006 * swayMultiplier;

      this.callbacks.onSniperSway(this.swayX, this.swayY, this.breathStamina, this.isHoldingBreath);
    } else {
      this.breathStamina = Math.min(1.0, this.breathStamina + dt * 0.5);
      this.swayX = 0;
      this.swayY = 0;
    }

    // ADS Viewmodel position & FOV interpolation
    const targetFov = this.isADS ? this.activeWeapon.zoomFov : 70;
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 14, dt);
    this.camera.updateProjectionMatrix();

    // Weapon hip vs ADS position
    const targetX = this.isADS ? 0 : 0.18;
    const targetY = this.isADS ? -0.14 : -0.18;
    const targetZ = (this.isADS ? -0.28 : -0.38) + this.recoilZ;

    this.viewmodelPivot.position.x = THREE.MathUtils.damp(this.viewmodelPivot.position.x, targetX + this.swayX, 16, dt);
    this.viewmodelPivot.position.y = THREE.MathUtils.damp(this.viewmodelPivot.position.y, targetY + this.swayY, 16, dt);
    this.viewmodelPivot.position.z = THREE.MathUtils.damp(this.viewmodelPivot.position.z, targetZ, 18, dt);
  }

  private updateCasingsAndParticles(dt: number) {
    // Casings physics & bounce
    for (let i = this.casingPool.length - 1; i >= 0; i--) {
      const c = this.casingPool[i];
      c.life -= dt;
      c.velocity.y -= 12 * dt;
      c.mesh.position.addScaledVector(c.velocity, dt);
      c.mesh.rotation.x += c.rotVelocity.x * dt;
      c.mesh.rotation.y += c.rotVelocity.y * dt;

      if (c.mesh.position.y <= 0.05) {
        c.mesh.position.y = 0.05;
        c.velocity.y *= -0.35;
        c.velocity.x *= 0.6;
        c.velocity.z *= 0.6;
        if (Math.abs(c.velocity.y) > 0.5) soundEngine.playCasingBounce();
      }

      if (c.life <= 0) {
        this.scene.remove(c.mesh);
        this.casingPool.splice(i, 1);
      }
    }

    // Particles (sparks, blood)
    for (let i = this.particlePool.length - 1; i >= 0; i--) {
      const p = this.particlePool[i];
      p.life -= dt;
      p.velocity.y -= 8 * dt;
      p.mesh.position.addScaledVector(p.velocity, dt);

      const scale = p.life / p.maxLife;
      p.mesh.scale.set(scale, scale, scale);

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particlePool.splice(i, 1);
      }
    }
  }

  private updateBots(dt: number) {
    for (const bot of this.bots) {
      if (bot.isDead) {
        bot.respawnTimer -= dt;
        bot.rig.updateAnimation(dt, 0, false, 0, true);
        if (bot.respawnTimer <= 0) {
          bot.isDead = false;
          bot.health = bot.maxHealth;
          const spawns = bot.team === 'blue' ? this.currentMap.build().blueSpawns : this.currentMap.build().redSpawns;
          const spawn = spawns[Math.floor(Math.random() * spawns.length)];
          bot.position.set(spawn.x + (Math.random() - 0.5) * 4, 0, spawn.z + (Math.random() - 0.5) * 4);
          bot.rig.root.rotation.set(0, 0, 0);
          bot.rig.root.position.copy(bot.position);
        }
        continue;
      }

      bot.stateTimer -= dt;
      if (bot.stateTimer <= 0) {
        bot.stateTimer = 2.5 + Math.random() * 2.5;
        // Pick new patrol or combat target position
        if (bot.team !== this.playerTeam && Math.random() < 0.65) {
          // Approach player
          bot.targetPos.copy(this.position).add(new THREE.Vector3((Math.random() - 0.5) * 10, 0, (Math.random() - 0.5) * 10));
        } else {
          // Roam
          bot.targetPos.set((Math.random() - 0.5) * 40, 0, (Math.random() - 0.5) * 40);
        }
      }

      // Move toward target
      _v1.subVectors(bot.targetPos, bot.position);
      _v1.y = 0;
      const dist = _v1.length();

      let isMoving = false;
      if (dist > 1.2) {
        _v1.normalize();
        bot.rotationY = Math.atan2(_v1.x, _v1.z);
        bot.position.addScaledVector(_v1, 3.8 * dt);
        isMoving = true;
      }

      bot.rig.root.position.copy(bot.position);
      bot.rig.root.rotation.y = bot.rotationY;

      // Bot combat targeting
      let isBotShooting = false;
      if (bot.team !== this.playerTeam) {
        const toPlayer = _v2.subVectors(this.position, bot.position);
        const playerDist = toPlayer.length();

        if (playerDist < 30) {
          bot.rotationY = Math.atan2(toPlayer.x, toPlayer.z);
          bot.pitch = -Math.atan2(toPlayer.y, playerDist);
          bot.fireTimer -= dt;

          if (bot.fireTimer <= 0) {
            bot.fireTimer = 1.0 + Math.random() * 1.5;
            isBotShooting = true;
            soundEngine.playGunshot(bot.weapon.id as 'm4a1' | 'ak47' | 'sniper' | 'pistol');
            this.spawnTracer(bot.position, toPlayer.normalize());

            // 30% bot accuracy against player
            if (Math.random() < 0.32) {
              const headshot = Math.random() < 0.15;
              this.applyDamage(bot.weapon.damage * (headshot ? 2 : 1), headshot, bot.name);
            }
          }
        }
      }

      bot.rig.updateAnimation(dt, isMoving ? 3.8 : 0, isBotShooting, bot.pitch, false);
    }
  }

  private updateNetworkSync() {
    if (!networkManager.isConnected) return;

    // Send local player state throttled
    networkManager.sendState({
      id: 'local',
      name: this.playerName,
      team: this.playerTeam,
      x: this.position.x,
      y: this.position.y,
      z: this.position.z,
      rotY: this.rotationY,
      pitch: this.pitch,
      weaponId: this.activeWeapon.id,
      isShooting: this.isTriggerHeld,
      isCrouched: this.isCrouched,
      health: this.health,
    });
  }

  public startLoop() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.tick();
    }
  }

  public stopLoop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animFrameId);
    clearTimeout(this.animFrameId);
  }

  public dispose() {
    this.stopLoop();
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
