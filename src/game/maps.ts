/**
 * Map Environments:
 * 1. de_dust2 (Classic beige sandstone, stone arches, wooden crates)
 * 2. Abandoned Industrial Factory (Dark metal containers, warehouse corrugated sheets)
 * 3. Desert Outpost (Arid canyon environment, sand dunes, military tents)
 *
 * CRITICAL REQUIREMENT:
 * Every single map features prominent street-spray graffiti spelling "پوریا جم" / "poria_jam"
 * with realistic paint drips, stencil borders, and weathered edges on the primary ruined/abandoned walls.
 */

import * as THREE from 'three';
import {
  createPoriaJamGraffitiTexture,
  createSandstoneTexture,
  createCorrugatedMetalTexture,
  createWoodCrateTexture,
  createDesertSandTexture,
} from './textures.ts';

export interface MapData {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  graffitiLocation: string;
  previewThumbnail: string; // SVG or color gradient data
  skyColor: number;
  groundColor: number;
  sunColor: number;
  sunPosition: THREE.Vector3;
  fogColor: number;
  fogDensity: number;
  build: () => {
    group: THREE.Group;
    colliders: THREE.Box3[];
    blueSpawns: THREE.Vector3[];
    redSpawns: THREE.Vector3[];
  };
}

/**
 * MAP 1: de_dust2
 */
export function buildDust2Map() {
  const group = new THREE.Group();
  group.name = 'map_dust2';
  const colliders: THREE.Box3[] = [];

  const sandstoneTex = createSandstoneTexture();
  sandstoneTex.repeat.set(4, 2);
  const sandstoneMat = new THREE.MeshStandardMaterial({
    map: sandstoneTex,
    roughness: 0.9,
    metalness: 0.05,
  });

  const sandGroundTex = createDesertSandTexture();
  sandGroundTex.repeat.set(16, 16);
  const groundMat = new THREE.MeshStandardMaterial({
    map: sandGroundTex,
    roughness: 0.95,
    metalness: 0.02,
  });

  const woodCrateTex = createWoodCrateTexture();
  const woodCrateMat = new THREE.MeshStandardMaterial({
    map: woodCrateTex,
    roughness: 0.75,
    metalness: 0.1,
  });

  // 1. Terrain Ground (Play area ~ 60x60m)
  const groundGeo = new THREE.PlaneGeometry(120, 120);
  groundGeo.rotateX(-Math.PI / 2);
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.receiveShadow = true;
  group.add(ground);

  // Helper to add colliding walls
  const addWall = (x: number, y: number, z: number, w: number, h: number, d: number, mat = sandstoneMat) => {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    const box = new THREE.Box3().setFromObject(mesh);
    colliders.push(box);
    return mesh;
  };

  // Helper to add wooden crates
  const addCrate = (x: number, y: number, z: number, size: number = 1.8) => {
    const geo = new THREE.BoxGeometry(size, size, size);
    const mesh = new THREE.Mesh(geo, woodCrateMat);
    mesh.position.set(x, y + size / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    colliders.push(new THREE.Box3().setFromObject(mesh));
    return mesh;
  };

  // Perimeter Boundary Walls
  addWall(0, 0, -32, 64, 7, 2); // North wall
  addWall(0, 0, 32, 64, 7, 2);  // South wall
  addWall(-32, 0, 0, 2, 7, 64); // West wall
  addWall(32, 0, 0, 2, 7, 64);  // East wall

  // Central Courtyard & Dividing Corridors
  addWall(-12, 0, -8, 20, 6, 2);
  addWall(16, 0, -8, 16, 6, 2);
  addWall(-10, 0, 10, 2, 6, 22);
  addWall(12, 0, 12, 2, 6, 18);

  // Famous Sandstone Stone Arch (Middle Gate)
  const archLeft = addWall(-3, 0, 0, 1.8, 6, 2.5);
  const archRight = addWall(3, 0, 0, 1.8, 6, 2.5);
  const archTop = addWall(0, 4.2, 0, 7.8, 1.8, 2.5);

  // Stacks of Wooden Crates (Bombsite A & B)
  // Bombsite A (North-East)
  addCrate(20, 0, -18, 2.2);
  addCrate(22.2, 0, -18, 2.2);
  addCrate(21.1, 2.2, -18, 2.2); // Double stack crate
  addCrate(18, 0, -14, 1.8);

  // Bombsite B (South-West)
  addCrate(-20, 0, 18, 2.2);
  addCrate(-20, 0, 20.2, 2.2);
  addCrate(-20, 2.2, 19.1, 2.2);
  addCrate(-16, 0, 16, 1.8);

  // Mid Corridor Cover Crates
  addCrate(-4, 0, -14, 1.8);
  addCrate(6, 0, 14, 1.8);

  // =========================================================================
  // MANDATORY REQUIREMENT: PROMINENT "پوریا جم" / "poria_jam" STREET-SPRAY GRAFFITI
  // WITH REALISTIC PAINT DRIPS, STENCIL BORDERS, AND WEATHERED EDGES
  // Rendered on the main ruined sandstone courtyard wall right beside Middle Arch Gate!
  // =========================================================================
  const graffitiTex = createPoriaJamGraffitiTexture('neonCyan');
  const graffitiMat = new THREE.MeshStandardMaterial({
    map: graffitiTex,
    transparent: true,
    roughness: 0.85,
    metalness: 0.1,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  // Main primary graffiti on long courtyard wall facing players
  const graffitiGeo = new THREE.PlaneGeometry(9.0, 4.5);
  const graffitiMesh = new THREE.Mesh(graffitiGeo, graffitiMat);
  graffitiMesh.position.set(-8.9, 3.2, 0.05); // Mounted on middle arch wall
  graffitiMesh.castShadow = false;
  graffitiMesh.receiveShadow = true;
  group.add(graffitiMesh);

  // Secondary graffiti tag on Bombsite B entrance wall
  const graffitiGeo2 = new THREE.PlaneGeometry(7.0, 3.5);
  const graffitiMesh2 = new THREE.Mesh(graffitiGeo2, graffitiMat);
  graffitiMesh2.position.set(-9.9, 3.0, 10);
  graffitiMesh2.rotation.y = Math.PI / 2;
  group.add(graffitiMesh2);

  // Spawn Points
  const blueSpawns = [
    new THREE.Vector3(22, 0, 24),
    new THREE.Vector3(25, 0, 22),
    new THREE.Vector3(20, 0, 26),
  ];

  const redSpawns = [
    new THREE.Vector3(-22, 0, -24),
    new THREE.Vector3(-25, 0, -22),
    new THREE.Vector3(-20, 0, -26),
  ];

  return { group, colliders, blueSpawns, redSpawns };
}

/**
 * MAP 2: Abandoned Industrial Factory
 */
export function buildFactoryMap() {
  const group = new THREE.Group();
  group.name = 'map_factory';
  const colliders: THREE.Box3[] = [];

  const metalTex = createCorrugatedMetalTexture();
  metalTex.repeat.set(4, 2);
  const corrugatedMat = new THREE.MeshStandardMaterial({
    map: metalTex,
    roughness: 0.5,
    metalness: 0.75,
  });

  // Wet concrete floor
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x1a1d22,
    roughness: 0.35, // Wet reflective sheen
    metalness: 0.25,
  });

  const rustContainerMat = new THREE.MeshStandardMaterial({
    color: 0xb54d24, // Rusty orange shipping container
    roughness: 0.7,
    metalness: 0.5,
  });

  const blueContainerMat = new THREE.MeshStandardMaterial({
    color: 0x224c6e, // Steel blue shipping container
    roughness: 0.65,
    metalness: 0.6,
  });

  const girderMat = new THREE.MeshStandardMaterial({
    color: 0x30353d,
    roughness: 0.4,
    metalness: 0.9,
  });

  // 1. Wet Concrete Floor
  const groundGeo = new THREE.PlaneGeometry(120, 120);
  groundGeo.rotateX(-Math.PI / 2);
  const ground = new THREE.Mesh(groundGeo, floorMat);
  ground.receiveShadow = true;
  group.add(ground);

  const addWall = (x: number, y: number, z: number, w: number, h: number, d: number, mat = corrugatedMat) => {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    colliders.push(new THREE.Box3().setFromObject(mesh));
    return mesh;
  };

  // Helper to add shipping container
  const addContainer = (x: number, y: number, z: number, rotY: number = 0, mat = rustContainerMat) => {
    const geo = new THREE.BoxGeometry(3.0, 3.2, 7.5);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + 1.6, z);
    mesh.rotation.y = rotY;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    colliders.push(new THREE.Box3().setFromObject(mesh));
    return mesh;
  };

  // Warehouse Outer Walls
  addWall(0, 0, -30, 60, 9, 2);
  addWall(0, 0, 30, 60, 9, 2);
  addWall(-30, 0, 0, 2, 9, 60);
  addWall(30, 0, 0, 2, 9, 60);

  // Interior Dividing Corrugated Partitions
  addWall(-10, 0, -10, 18, 7, 1.5);
  addWall(12, 0, 10, 20, 7, 1.5);

  // Stacks of Shipping Containers
  addContainer(-14, 0, 14, 0, rustContainerMat);
  addContainer(-14, 3.2, 14, 0, blueContainerMat); // Stacked 2 high
  addContainer(15, 0, -12, Math.PI / 2, blueContainerMat);
  addContainer(-6, 0, -18, 0.4, rustContainerMat);
  addContainer(8, 0, 18, -0.3, blueContainerMat);

  // Overhead Industrial Steel Girders
  for (let z = -20; z <= 20; z += 10) {
    const girderGeo = new THREE.BoxGeometry(60, 0.8, 0.8);
    const girder = new THREE.Mesh(girderGeo, girderMat);
    girder.position.set(0, 7.5, z);
    group.add(girder);
  }

  // =========================================================================
  // MANDATORY REQUIREMENT: PROMINENT "پوریا جم" / "poria_jam" STREET-SPRAY GRAFFITI
  // WITH REALISTIC PAINT DRIPS, STENCIL BORDERS, AND WEATHERED EDGES
  // Rendered on the massive central corrugated warehouse wall and shipping container!
  // =========================================================================
  const graffitiTex = createPoriaJamGraffitiTexture('fireOrange');
  const graffitiMat = new THREE.MeshStandardMaterial({
    map: graffitiTex,
    transparent: true,
    roughness: 0.6,
    metalness: 0.2,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  // Main Warehouse Wall Graffiti
  const graffitiGeo = new THREE.PlaneGeometry(10.0, 5.0);
  const graffitiMesh = new THREE.Mesh(graffitiGeo, graffitiMat);
  graffitiMesh.position.set(-10, 3.8, -9.2); // Centered on main factory wall
  group.add(graffitiMesh);

  // Shipping Container Tag
  const containerTagGeo = new THREE.PlaneGeometry(6.0, 3.0);
  const containerTag = new THREE.Mesh(containerTagGeo, graffitiMat);
  containerTag.position.set(-12.45, 1.8, 14);
  containerTag.rotation.y = -Math.PI / 2;
  group.add(containerTag);

  const blueSpawns = [
    new THREE.Vector3(20, 0, 20),
    new THREE.Vector3(22, 0, 18),
    new THREE.Vector3(18, 0, 22),
  ];

  const redSpawns = [
    new THREE.Vector3(-20, 0, -20),
    new THREE.Vector3(-22, 0, -18),
    new THREE.Vector3(-18, 0, -22),
  ];

  return { group, colliders, blueSpawns, redSpawns };
}

/**
 * MAP 3: Desert Outpost
 */
export function buildDesertOutpostMap() {
  const group = new THREE.Group();
  group.name = 'map_outpost';
  const colliders: THREE.Box3[] = [];

  const sandTex = createDesertSandTexture();
  sandTex.repeat.set(16, 16);
  const sandMat = new THREE.MeshStandardMaterial({
    map: sandTex,
    roughness: 0.95,
    metalness: 0.02,
  });

  // Concrete blast bunker wall
  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0x9e988b,
    roughness: 0.9,
    metalness: 0.1,
  });

  // Military camo tent canvas
  const tentMat = new THREE.MeshStandardMaterial({
    color: 0x3d4233, // Military olive drab canvas
    roughness: 0.85,
    metalness: 0.05,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x22262c,
    roughness: 0.4,
    metalness: 0.85,
  });

  // 1. Terrain Ground
  const groundGeo = new THREE.PlaneGeometry(120, 120);
  groundGeo.rotateX(-Math.PI / 2);
  const ground = new THREE.Mesh(groundGeo, sandMat);
  ground.receiveShadow = true;
  group.add(ground);

  const addWall = (x: number, y: number, z: number, w: number, h: number, d: number, mat = concreteMat) => {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    colliders.push(new THREE.Box3().setFromObject(mesh));
    return mesh;
  };

  // Helper to add military tent
  const addMilitaryTent = (x: number, z: number, w: number = 7, l: number = 9, h: number = 4) => {
    const tentGroup = new THREE.Group();
    tentGroup.position.set(x, 0, z);

    // Tent prism / gable roof
    const roofGeo = new THREE.ConeGeometry(w * 0.75, h, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(roofGeo, tentMat);
    roof.position.y = h * 0.6;
    roof.scale.set(1.2, 1, 1.6);
    roof.castShadow = true;
    tentGroup.add(roof);

    group.add(tentGroup);
    colliders.push(new THREE.Box3().setFromObject(roof));
  };

  // Helper to add sniper watchtower
  const addWatchtower = (x: number, z: number) => {
    const towerGroup = new THREE.Group();
    towerGroup.position.set(x, 0, z);

    // 4 Steel Legs
    [-1.8, 1.8].forEach(lx => {
      [-1.8, 1.8].forEach(lz => {
        const legGeo = new THREE.CylinderGeometry(0.1, 0.12, 6, 8);
        const leg = new THREE.Mesh(legGeo, metalMat);
        leg.position.set(lx, 3, lz);
        leg.castShadow = true;
        towerGroup.add(leg);
      });
    });

    // Elevated Sniper Platform
    const platGeo = new THREE.BoxGeometry(4.2, 0.4, 4.2);
    const plat = new THREE.Mesh(platGeo, metalMat);
    plat.position.set(0, 5.8, 0);
    towerGroup.add(plat);

    // Platform railings
    const railGeo = new THREE.BoxGeometry(4.2, 1.0, 0.1);
    const r1 = new THREE.Mesh(railGeo, metalMat);
    r1.position.set(0, 6.4, -2.05);
    towerGroup.add(r1);

    group.add(towerGroup);
    colliders.push(new THREE.Box3().setFromObject(plat));
  };

  // Perimeter Canyon Rocks / Barriers
  addWall(0, 0, -32, 64, 8, 3);
  addWall(0, 0, 32, 64, 8, 3);
  addWall(-32, 0, 0, 3, 8, 64);
  addWall(32, 0, 0, 3, 8, 64);

  // Central Command Bunker Walls
  const bunkerWall = addWall(0, 0, -5, 24, 5, 2);
  addWall(-11, 0, 3, 2, 5, 14);
  addWall(11, 0, 3, 2, 5, 14);

  // Military Tents
  addMilitaryTent(-18, -14, 7, 9, 3.8);
  addMilitaryTent(18, 14, 7, 9, 3.8);

  // Sniper Perch Watchtowers
  addWatchtower(20, -18);
  addWatchtower(-20, 18);

  // Sandbag barricades
  addWall(-4, 0, 10, 6, 1.2, 1);
  addWall(4, 0, 10, 6, 1.2, 1);

  // =========================================================================
  // MANDATORY REQUIREMENT: PROMINENT "پوریا جم" / "poria_jam" STREET-SPRAY GRAFFITI
  // WITH REALISTIC PAINT DRIPS, STENCIL BORDERS, AND WEATHERED EDGES
  // Rendered right across the front blast wall of the central desert command bunker!
  // =========================================================================
  const graffitiTex = createPoriaJamGraffitiTexture('bloodRed');
  const graffitiMat = new THREE.MeshStandardMaterial({
    map: graffitiTex,
    transparent: true,
    roughness: 0.85,
    metalness: 0.15,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const graffitiGeo = new THREE.PlaneGeometry(10.0, 5.0);
  const graffitiMesh = new THREE.Mesh(graffitiGeo, graffitiMat);
  graffitiMesh.position.set(0, 2.8, -3.95); // Front face of bunker wall
  group.add(graffitiMesh);

  const blueSpawns = [
    new THREE.Vector3(18, 0, 22),
    new THREE.Vector3(22, 0, 20),
    new THREE.Vector3(15, 0, 24),
  ];

  const redSpawns = [
    new THREE.Vector3(-18, 0, -22),
    new THREE.Vector3(-22, 0, -20),
    new THREE.Vector3(-15, 0, -24),
  ];

  return { group, colliders, blueSpawns, redSpawns };
}

export const MAP_REGISTRY: Record<string, MapData> = {
  dust2: {
    id: 'dust2',
    name: 'de_dust2',
    subtitle: 'Arid Middle East Courtyard',
    description: 'Iconic beige sandstone architecture, central stone archway, bombsite crates, and long sightlines.',
    graffitiLocation: 'Main stone archway courtyard wall',
    previewThumbnail: 'linear-gradient(135deg, #dfbe88 0%, #857257 50%, #2b2216 100%)',
    skyColor: 0xeedcb2,
    groundColor: 0x5a4832,
    sunColor: 0xfff4db,
    sunPosition: new THREE.Vector3(40, 60, 30),
    fogColor: 0xd9c59d,
    fogDensity: 0.008,
    build: buildDust2Map,
  },
  factory: {
    id: 'factory',
    name: 'Abandoned Industrial Factory',
    subtitle: 'Corrugated Steel Warehouse',
    description: 'Dark industrial shipping container yard, corrugated sheet metal walls, overhead steel girders, and wet concrete floors.',
    graffitiLocation: 'Central warehouse facade & shipping container',
    previewThumbnail: 'linear-gradient(135deg, #2d333b 0%, #1c2128 50%, #b54d24 100%)',
    skyColor: 0x6e7888,
    groundColor: 0x1a1e24,
    sunColor: 0xc8d4e4,
    sunPosition: new THREE.Vector3(-30, 50, 40),
    fogColor: 0x2d333b,
    fogDensity: 0.012,
    build: buildFactoryMap,
  },
  outpost: {
    id: 'outpost',
    name: 'Desert Outpost',
    subtitle: 'Arid Canyon Bunker',
    description: 'Arid desert canyon perimeter, heavy concrete blast bunker walls, military camouflage tents, and elevated watchtowers.',
    graffitiLocation: 'Central bunker blast entrance wall',
    previewThumbnail: 'linear-gradient(135deg, #d4a359 0%, #3d4233 60%, #1e1e1a 100%)',
    skyColor: 0xf5d99b,
    groundColor: 0x4a3a22,
    sunColor: 0xffedbc,
    sunPosition: new THREE.Vector3(50, 55, -20),
    fogColor: 0xdfbe88,
    fogDensity: 0.009,
    build: buildDesertOutpostMap,
  },
};
