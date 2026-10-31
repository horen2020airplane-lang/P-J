/**
 * Procedural 3D Weapon Models & Ballistic Systems
 * Built using Three.js multi-part groups with PBR materials.
 * Features: M4A1, AK-47, Bolt-Action Sniper Rifle, Tactical Pistol.
 */

import * as THREE from 'three';

export interface WeaponDef {
  id: string;
  name: string;
  type: 'primary' | 'secondary';
  caliber: string;
  damage: number;
  fireRate: number; // rounds per minute
  magSize: number;
  reserveAmmo: number;
  reloadTime: number; // in seconds
  recoilVertical: number;
  recoilHorizontal: number;
  recoilRecovery: number;
  spreadHip: number;
  spreadAds: number;
  zoomFov: number; // Default camera FOV is ~70; sniper drops to 22
  isBoltAction?: boolean;
  boltCycleTime?: number; // seconds
  description: string;
  stats: {
    damage: number;   // 0-100
    fireRate: number; // 0-100
    accuracy: number; // 0-100
    range: number;    // 0-100
    mobility: number; // 0-100
  };
}

export const WEAPON_REGISTRY: Record<string, WeaponDef> = {
  m4a1: {
    id: 'm4a1',
    name: 'M4A1 Carbine',
    type: 'primary',
    caliber: '5.56 × 45mm NATO',
    damage: 32,
    fireRate: 750,
    magSize: 30,
    reserveAmmo: 90,
    reloadTime: 2.1,
    recoilVertical: 0.038,
    recoilHorizontal: 0.015,
    recoilRecovery: 9.0,
    spreadHip: 0.035,
    spreadAds: 0.006,
    zoomFov: 50,
    description: 'Versatile tactical assault rifle offering high rate of fire, controllable recoil, and superior medium-range precision.',
    stats: {
      damage: 70,
      fireRate: 85,
      accuracy: 82,
      range: 75,
      mobility: 78,
    },
  },
  ak47: {
    id: 'ak47',
    name: 'AK-47 Tactical',
    type: 'primary',
    caliber: '7.62 × 39mm Soviet',
    damage: 42,
    fireRate: 600,
    magSize: 30,
    reserveAmmo: 90,
    reloadTime: 2.4,
    recoilVertical: 0.055,
    recoilHorizontal: 0.024,
    recoilRecovery: 7.0,
    spreadHip: 0.045,
    spreadAds: 0.010,
    zoomFov: 52,
    description: 'Heavy assault rifle delivering thunderous stopping power and lethality at the cost of aggressive upward kick.',
    stats: {
      damage: 88,
      fireRate: 68,
      accuracy: 65,
      range: 80,
      mobility: 70,
    },
  },
  sniper: {
    id: 'sniper',
    name: 'AWM Bolt-Action Sniper',
    type: 'primary',
    caliber: '.338 Lapua Magnum',
    damage: 115, // One-shot kill to upper chest & head
    fireRate: 45,
    magSize: 5,
    reserveAmmo: 25,
    reloadTime: 3.2,
    recoilVertical: 0.16,
    recoilHorizontal: 0.03,
    recoilRecovery: 4.0,
    spreadHip: 0.18,
    spreadAds: 0.0005,
    zoomFov: 20, // High-zoom sniper optic
    isBoltAction: true,
    boltCycleTime: 1.1,
    description: 'Heavy anti-materiel sniper rifle. Call of Duty style high-zoom scope with peripheral blur and hold-breath steadying.',
    stats: {
      damage: 100,
      fireRate: 20,
      accuracy: 98,
      range: 100,
      mobility: 48,
    },
  },
  pistol: {
    id: 'pistol',
    name: 'Desert Hawk .50',
    type: 'secondary',
    caliber: '.50 Action Express',
    damage: 48,
    fireRate: 350,
    magSize: 7,
    reserveAmmo: 35,
    reloadTime: 1.6,
    recoilVertical: 0.065,
    recoilHorizontal: 0.015,
    recoilRecovery: 8.0,
    spreadHip: 0.025,
    spreadAds: 0.008,
    zoomFov: 58,
    description: 'High-caliber sidearm providing devastating close-quarters backup with rapid semi-automatic trigger response.',
    stats: {
      damage: 85,
      fireRate: 50,
      accuracy: 75,
      range: 55,
      mobility: 95,
    },
  },
};

// Procedural PBR Material Palette for Weapons
const metalDarkMat = new THREE.MeshStandardMaterial({
  color: 0x181a1f,
  metalness: 0.85,
  roughness: 0.28,
});

const metalSteelMat = new THREE.MeshStandardMaterial({
  color: 0x424750,
  metalness: 0.92,
  roughness: 0.22,
});

const polymerBlackMat = new THREE.MeshStandardMaterial({
  color: 0x121316,
  metalness: 0.1,
  roughness: 0.65,
});

const woodStockMat = new THREE.MeshStandardMaterial({
  color: 0x6e3d1b,
  metalness: 0.05,
  roughness: 0.55,
});

const sniperODGreenMat = new THREE.MeshStandardMaterial({
  color: 0x2e3529, // Olive drab tactical sniper finish
  metalness: 0.45,
  roughness: 0.45,
});

const glassLensMat = new THREE.MeshPhysicalMaterial({
  color: 0x052028,
  metalness: 0.1,
  roughness: 0.05,
  transmission: 0.8,
  thickness: 0.5,
  transparent: true,
  opacity: 0.9,
});

const brassCasingMat = new THREE.MeshStandardMaterial({
  color: 0xd4af37,
  metalness: 0.95,
  roughness: 0.15,
});

/**
 * Creates 3D procedural M4A1 model (composite THREE.Group)
 */
export function createM4A1Model(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'weapon_m4a1';

  // 1. Lower Receiver & Magazine Well
  const lowerGeo = new THREE.BoxGeometry(0.045, 0.08, 0.22);
  const lower = new THREE.Mesh(lowerGeo, metalDarkMat);
  lower.position.set(0, 0, 0);
  lower.castShadow = true;
  group.add(lower);

  // 2. Upper Receiver & Picatinny Top Rail
  const upperGeo = new THREE.BoxGeometry(0.042, 0.065, 0.24);
  const upper = new THREE.Mesh(upperGeo, metalDarkMat);
  upper.position.set(0, 0.065, 0.01);
  upper.castShadow = true;
  group.add(upper);

  const railGeo = new THREE.BoxGeometry(0.03, 0.012, 0.25);
  const rail = new THREE.Mesh(railGeo, metalSteelMat);
  rail.position.set(0, 0.103, 0.01);
  group.add(rail);

  // 3. Barrel & Gas Block
  const barrelGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.32, 16);
  barrelGeo.rotateX(Math.PI / 2);
  const barrel = new THREE.Mesh(barrelGeo, metalSteelMat);
  barrel.position.set(0, 0.07, 0.26);
  barrel.castShadow = true;
  group.add(barrel);

  // Tactical Suppressor / Muzzle Brake
  const brakeGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.08, 16);
  brakeGeo.rotateX(Math.PI / 2);
  const brake = new THREE.Mesh(brakeGeo, metalDarkMat);
  brake.position.set(0, 0.07, 0.44);
  group.add(brake);

  // 4. Quad Rail Handguard
  const handguardGeo = new THREE.BoxGeometry(0.052, 0.06, 0.18);
  const handguard = new THREE.Mesh(handguardGeo, polymerBlackMat);
  handguard.position.set(0, 0.065, 0.18);
  group.add(handguard);

  // 5. Curved STANAG Magazine
  const magGeo = new THREE.BoxGeometry(0.038, 0.16, 0.075);
  const mag = new THREE.Mesh(magGeo, metalSteelMat);
  mag.position.set(0, -0.09, 0.03);
  mag.rotation.x = -0.18;
  group.add(mag);

  // 6. Pistol Grip
  const gripGeo = new THREE.BoxGeometry(0.036, 0.11, 0.05);
  const grip = new THREE.Mesh(gripGeo, polymerBlackMat);
  grip.position.set(0, -0.075, -0.07);
  grip.rotation.x = -0.42;
  group.add(grip);

  // 7. Retractable Crane Stock
  const bufferTubeGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.18, 12);
  bufferTubeGeo.rotateX(Math.PI / 2);
  const bufferTube = new THREE.Mesh(bufferTubeGeo, metalSteelMat);
  bufferTube.position.set(0, 0.055, -0.18);
  group.add(bufferTube);

  const stockGeo = new THREE.BoxGeometry(0.046, 0.12, 0.14);
  const stock = new THREE.Mesh(stockGeo, polymerBlackMat);
  stock.position.set(0, 0.035, -0.22);
  group.add(stock);

  // 8. Holographic Red Dot Sight Optic
  const opticBaseGeo = new THREE.BoxGeometry(0.038, 0.02, 0.09);
  const opticBase = new THREE.Mesh(opticBaseGeo, metalDarkMat);
  opticBase.position.set(0, 0.115, 0.02);
  group.add(opticBase);

  const opticHoodGeo = new THREE.BoxGeometry(0.04, 0.045, 0.06);
  const opticHood = new THREE.Mesh(opticHoodGeo, polymerBlackMat);
  opticHood.position.set(0, 0.14, 0.02);
  group.add(opticHood);

  const opticLensGeo = new THREE.BoxGeometry(0.032, 0.032, 0.005);
  const opticLens = new THREE.Mesh(opticLensGeo, glassLensMat);
  opticLens.position.set(0, 0.14, 0.02);
  group.add(opticLens);

  // Ejection Port & Muzzle Tip Marker
  const muzzleTip = new THREE.Object3D();
  muzzleTip.name = 'muzzle_tip';
  muzzleTip.position.set(0, 0.07, 0.49);
  group.add(muzzleTip);

  const ejectPort = new THREE.Object3D();
  ejectPort.name = 'eject_port';
  ejectPort.position.set(0.03, 0.065, 0.01);
  group.add(ejectPort);

  return group;
}

/**
 * Creates 3D procedural AK-47 model (composite THREE.Group)
 */
export function createAK47Model(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'weapon_ak47';

  // 1. Stamped Steel Receiver
  const receiverGeo = new THREE.BoxGeometry(0.048, 0.085, 0.26);
  const receiver = new THREE.Mesh(receiverGeo, metalDarkMat);
  receiver.position.set(0, 0, 0);
  receiver.castShadow = true;
  group.add(receiver);

  // 2. Ribbed Receiver Dust Cover
  const coverGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.22, 16, 1, false, 0, Math.PI);
  coverGeo.rotateX(Math.PI / 2);
  coverGeo.rotateZ(Math.PI);
  const cover = new THREE.Mesh(coverGeo, metalSteelMat);
  cover.position.set(0, 0.042, -0.01);
  group.add(cover);

  // 3. Long Barrel & Gas Tube Assembly
  const barrelGeo = new THREE.CylinderGeometry(0.013, 0.013, 0.38, 16);
  barrelGeo.rotateX(Math.PI / 2);
  const barrel = new THREE.Mesh(barrelGeo, metalSteelMat);
  barrel.position.set(0, 0.045, 0.3);
  barrel.castShadow = true;
  group.add(barrel);

  const gasTubeGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.22, 12);
  gasTubeGeo.rotateX(Math.PI / 2);
  const gasTube = new THREE.Mesh(gasTubeGeo, metalDarkMat);
  gasTube.position.set(0, 0.072, 0.22);
  group.add(gasTube);

  // Front Sight Post & Slant Muzzle Compensator
  const frontSightGeo = new THREE.BoxGeometry(0.016, 0.04, 0.02);
  const frontSight = new THREE.Mesh(frontSightGeo, metalDarkMat);
  frontSight.position.set(0, 0.08, 0.45);
  group.add(frontSight);

  const compensatorGeo = new THREE.CylinderGeometry(0.017, 0.015, 0.05, 12);
  compensatorGeo.rotateX(Math.PI / 2);
  const compensator = new THREE.Mesh(compensatorGeo, metalSteelMat);
  compensator.position.set(0, 0.045, 0.5);
  group.add(compensator);

  // 4. Wooden Handguard (Upper & Lower)
  const woodForeGeo = new THREE.BoxGeometry(0.054, 0.068, 0.19);
  const woodFore = new THREE.Mesh(woodForeGeo, woodStockMat);
  woodFore.position.set(0, 0.055, 0.21);
  group.add(woodFore);

  // 5. Iconic Curved 30-round Banana Magazine
  const magGeo = new THREE.BoxGeometry(0.04, 0.18, 0.08);
  const mag = new THREE.Mesh(magGeo, metalDarkMat);
  mag.position.set(0, -0.1, 0.04);
  mag.rotation.x = -0.35;
  group.add(mag);

  // 6. Wooden Fixed Stock
  const stockGeo = new THREE.BoxGeometry(0.046, 0.11, 0.24);
  const stock = new THREE.Mesh(stockGeo, woodStockMat);
  stock.position.set(0, -0.01, -0.22);
  stock.rotation.x = 0.08;
  group.add(stock);

  // 7. Pistol Grip
  const gripGeo = new THREE.BoxGeometry(0.038, 0.1, 0.05);
  const grip = new THREE.Mesh(gripGeo, woodStockMat);
  grip.position.set(0, -0.07, -0.07);
  grip.rotation.x = -0.4;
  group.add(grip);

  // Muzzle Tip and Ejection Port
  const muzzleTip = new THREE.Object3D();
  muzzleTip.name = 'muzzle_tip';
  muzzleTip.position.set(0, 0.045, 0.54);
  group.add(muzzleTip);

  const ejectPort = new THREE.Object3D();
  ejectPort.name = 'eject_port';
  ejectPort.position.set(0.03, 0.04, 0.02);
  group.add(ejectPort);

  return group;
}

/**
 * Creates 3D procedural Bolt-Action Sniper Rifle (Call of Duty style AWM)
 * Features animated bolt handle, heavy fluted barrel, bipod, and high-zoom tactical scope
 */
export function createSniperModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'weapon_sniper';

  // 1. Heavy Tactical Sniper Chassis (Olive Drab PBR finish)
  const chassisGeo = new THREE.BoxGeometry(0.056, 0.09, 0.38);
  const chassis = new THREE.Mesh(chassisGeo, sniperODGreenMat);
  chassis.position.set(0, 0, 0.05);
  chassis.castShadow = true;
  group.add(chassis);

  // 2. Heavy Fluted Match Barrel
  const barrelGeo = new THREE.CylinderGeometry(0.016, 0.018, 0.55, 20);
  barrelGeo.rotateX(Math.PI / 2);
  const barrel = new THREE.Mesh(barrelGeo, metalSteelMat);
  barrel.position.set(0, 0.05, 0.48);
  barrel.castShadow = true;
  group.add(barrel);

  // Massive Muzzle Brake
  const brakeGeo = new THREE.BoxGeometry(0.04, 0.036, 0.09);
  const brake = new THREE.Mesh(brakeGeo, metalDarkMat);
  brake.position.set(0, 0.05, 0.78);
  group.add(brake);

  // 3. Ergonomic Thumbhole Sniper Stock & Adjustable Cheek Rest
  const stockGeo = new THREE.BoxGeometry(0.05, 0.13, 0.28);
  const stock = new THREE.Mesh(stockGeo, sniperODGreenMat);
  stock.position.set(0, -0.01, -0.25);
  group.add(stock);

  const cheekGeo = new THREE.BoxGeometry(0.044, 0.035, 0.12);
  const cheek = new THREE.Mesh(cheekGeo, polymerBlackMat);
  cheek.position.set(0, 0.07, -0.22);
  group.add(cheek);

  const buttpadGeo = new THREE.BoxGeometry(0.048, 0.14, 0.03);
  const buttpad = new THREE.Mesh(buttpadGeo, polymerBlackMat);
  buttpad.position.set(0, -0.01, -0.39);
  group.add(buttpad);

  // 4. Detachable Box Magazine (5-round .338)
  const magGeo = new THREE.BoxGeometry(0.042, 0.09, 0.07);
  const mag = new THREE.Mesh(magGeo, metalSteelMat);
  mag.position.set(0, -0.07, 0.06);
  group.add(mag);

  // 5. Functional Animated Bolt Handle
  const boltGroup = new THREE.Group();
  boltGroup.name = 'bolt_mechanism';
  boltGroup.position.set(0.026, 0.055, -0.03);

  const boltShaftGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.05, 12);
  boltShaftGeo.rotateZ(Math.PI / 2);
  const boltShaft = new THREE.Mesh(boltShaftGeo, metalSteelMat);
  boltShaft.position.set(0.022, 0, 0);
  boltGroup.add(boltShaft);

  const boltKnobGeo = new THREE.SphereGeometry(0.014, 12, 12);
  const boltKnob = new THREE.Mesh(boltKnobGeo, metalDarkMat);
  boltKnob.position.set(0.046, 0, 0);
  boltGroup.add(boltKnob);

  group.add(boltGroup);

  // 6. High-Magnification Optical Sniper Scope with Dual Mounting Rings
  const scopeBaseGeo = new THREE.BoxGeometry(0.034, 0.02, 0.18);
  const scopeBase = new THREE.Mesh(scopeBaseGeo, metalDarkMat);
  scopeBase.position.set(0, 0.095, 0.04);
  group.add(scopeBase);

  // Front Objective Bell
  const objBellGeo = new THREE.CylinderGeometry(0.026, 0.019, 0.09, 20);
  objBellGeo.rotateX(Math.PI / 2);
  const objBell = new THREE.Mesh(objBellGeo, metalSteelMat);
  objBell.position.set(0, 0.13, 0.15);
  group.add(objBell);

  // Scope Main Tube (34mm)
  const tubeGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.2, 20);
  tubeGeo.rotateX(Math.PI / 2);
  const tube = new THREE.Mesh(tubeGeo, metalDarkMat);
  tube.position.set(0, 0.13, 0.03);
  group.add(tube);

  // Ocular Eyepiece Bell
  const eyeBellGeo = new THREE.CylinderGeometry(0.022, 0.024, 0.08, 20);
  eyeBellGeo.rotateX(Math.PI / 2);
  const eyeBell = new THREE.Mesh(eyeBellGeo, metalSteelMat);
  eyeBell.position.set(0, 0.13, -0.1);
  group.add(eyeBell);

  // Windage and Elevation Turrets
  const turretVGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.02, 14);
  const turretV = new THREE.Mesh(turretVGeo, metalSteelMat);
  turretV.position.set(0, 0.155, 0.03);
  group.add(turretV);

  // Scope Lenses
  const frontLensGeo = new THREE.CircleGeometry(0.023, 16);
  const frontLens = new THREE.Mesh(frontLensGeo, glassLensMat);
  frontLens.position.set(0, 0.13, 0.196);
  group.add(frontLens);

  // 7. Folding Bipod Legs
  const bipodMountGeo = new THREE.BoxGeometry(0.04, 0.025, 0.03);
  const bipodMount = new THREE.Mesh(bipodMountGeo, metalDarkMat);
  bipodMount.position.set(0, -0.015, 0.4);
  group.add(bipodMount);

  [-0.03, 0.03].forEach(bx => {
    const legGeo = new THREE.CylinderGeometry(0.006, 0.005, 0.16, 8);
    const leg = new THREE.Mesh(legGeo, metalSteelMat);
    leg.position.set(bx, -0.09, 0.4);
    leg.rotation.z = bx > 0 ? -0.25 : 0.25;
    group.add(leg);
  });

  // Muzzle Tip and Eject Port
  const muzzleTip = new THREE.Object3D();
  muzzleTip.name = 'muzzle_tip';
  muzzleTip.position.set(0, 0.05, 0.83);
  group.add(muzzleTip);

  const ejectPort = new THREE.Object3D();
  ejectPort.name = 'eject_port';
  ejectPort.position.set(0.03, 0.055, 0.02);
  group.add(ejectPort);

  return group;
}

/**
 * Creates 3D procedural Tactical Pistol model (Desert Hawk .50)
 * Features separate slide assembly for blowback kick
 */
export function createPistolModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'weapon_pistol';

  // 1. Lower Polymer Receiver & Grip Frame
  const frameGeo = new THREE.BoxGeometry(0.034, 0.05, 0.14);
  const frame = new THREE.Mesh(frameGeo, polymerBlackMat);
  frame.position.set(0, 0, 0.02);
  group.add(frame);

  const gripGeo = new THREE.BoxGeometry(0.034, 0.12, 0.055);
  const grip = new THREE.Mesh(gripGeo, polymerBlackMat);
  grip.position.set(0, -0.065, -0.03);
  grip.rotation.x = -0.32;
  group.add(grip);

  // Trigger Guard & Trigger
  const guardGeo = new THREE.BoxGeometry(0.016, 0.04, 0.05);
  const guard = new THREE.Mesh(guardGeo, metalDarkMat);
  guard.position.set(0, -0.03, 0.03);
  group.add(guard);

  // 2. Milled Serrated Recoil Slide
  const slideGroup = new THREE.Group();
  slideGroup.name = 'slide_mechanism';
  slideGroup.position.set(0, 0.035, 0.02);

  const slideGeo = new THREE.BoxGeometry(0.036, 0.04, 0.19);
  const slide = new THREE.Mesh(slideGeo, metalSteelMat);
  slide.castShadow = true;
  slideGroup.add(slide);

  // Iron Sights
  const rearSightGeo = new THREE.BoxGeometry(0.02, 0.015, 0.01);
  const rearSight = new THREE.Mesh(rearSightGeo, metalDarkMat);
  rearSight.position.set(0, 0.026, -0.08);
  slideGroup.add(rearSight);

  const frontSightGeo = new THREE.BoxGeometry(0.008, 0.015, 0.01);
  const frontSight = new THREE.Mesh(frontSightGeo, metalDarkMat);
  frontSight.position.set(0, 0.026, 0.085);
  slideGroup.add(frontSight);

  group.add(slideGroup);

  // 3. Threaded Barrel
  const barrelGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.04, 14);
  barrelGeo.rotateX(Math.PI / 2);
  const barrel = new THREE.Mesh(barrelGeo, metalDarkMat);
  barrel.position.set(0, 0.035, 0.13);
  group.add(barrel);

  // Muzzle Tip and Eject Port
  const muzzleTip = new THREE.Object3D();
  muzzleTip.name = 'muzzle_tip';
  muzzleTip.position.set(0, 0.035, 0.15);
  group.add(muzzleTip);

  const ejectPort = new THREE.Object3D();
  ejectPort.name = 'eject_port';
  ejectPort.position.set(0.025, 0.035, 0);
  group.add(ejectPort);

  return group;
}

/**
 * Creates 3D Brass Bullet Casing Mesh for ejection physics
 */
export function createBulletCasingMesh(): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(0.006, 0.006, 0.024, 8);
  const mesh = new THREE.Mesh(geo, brassCasingMat);
  mesh.castShadow = true;
  return mesh;
}
