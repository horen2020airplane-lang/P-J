/**
 * Realistic Human Operator 3D Models
 * Strictly NO robots, NO animals - 100% human tactical operators.
 * Blue Team: Counter-Terrorists (Tactical SWAT / Spec Ops gear)
 * Red Team: Terrorists (Urban Guerilla / Desert Rebel tactical gear)
 */

import * as THREE from 'three';

export type TeamType = 'blue' | 'red';

// Materials for Realistic Human Operators
const skinMat = new THREE.MeshStandardMaterial({
  color: 0xd9a17e,
  roughness: 0.65,
  metalness: 0.05,
});

// Blue Team Spec-Ops Materials
const blueUniformMat = new THREE.MeshStandardMaterial({
  color: 0x1d2736, // Navy blue combat uniform
  roughness: 0.8,
  metalness: 0.1,
});

const blueKevlarMat = new THREE.MeshStandardMaterial({
  color: 0x0f151e, // Black/dark navy tactical ballistic vest
  roughness: 0.5,
  metalness: 0.25,
});

const blueHelmetMat = new THREE.MeshStandardMaterial({
  color: 0x161d27, // Tactical FAST helmet
  roughness: 0.4,
  metalness: 0.35,
});

// Red Team Terrorist Materials
const redUniformMat = new THREE.MeshStandardMaterial({
  color: 0x4a3a2d, // Tactical desert combat fatigue
  roughness: 0.85,
  metalness: 0.05,
});

const redHarnessMat = new THREE.MeshStandardMaterial({
  color: 0x221a14, // Dark leather/canvas ammo harness
  roughness: 0.6,
  metalness: 0.15,
});

const redShemaghMat = new THREE.MeshStandardMaterial({
  color: 0x8a2b2b, // Crimson & khaki tactical shemagh balaclava
  roughness: 0.9,
  metalness: 0.0,
});

// Shared Tactical Accessories
const goggleLensMat = new THREE.MeshPhysicalMaterial({
  color: 0x0a1a20,
  metalness: 0.2,
  roughness: 0.1,
  transmission: 0.6,
  transparent: true,
  opacity: 0.85,
});

const bootsMat = new THREE.MeshStandardMaterial({
  color: 0x111113,
  roughness: 0.7,
  metalness: 0.2,
});

export interface OperatorRig {
  root: THREE.Group;
  upperBody: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  weaponMount: THREE.Group;
  team: TeamType;
  updateAnimation: (dt: number, speed: number, isShooting: boolean, pitch: number, isDead: boolean) => void;
}

/**
 * Creates 100% Human Military Operator
 */
export function createOperator(team: TeamType): OperatorRig {
  const root = new THREE.Group();
  root.name = `operator_${team}`;

  const uniformMat = team === 'blue' ? blueUniformMat : redUniformMat;
  const vestMat = team === 'blue' ? blueKevlarMat : redHarnessMat;

  // 1. Lower Body / Pelvis
  const pelvisGeo = new THREE.BoxGeometry(0.34, 0.18, 0.22);
  const pelvis = new THREE.Mesh(pelvisGeo, uniformMat);
  pelvis.position.y = 0.95;
  pelvis.castShadow = true;
  root.add(pelvis);

  // 2. Upper Body Group (Pivots for Aim Pitch & Breathing)
  const upperBody = new THREE.Group();
  upperBody.position.y = 1.05;
  root.add(upperBody);

  // Human Torso / Abdomen & Chest
  const torsoGeo = new THREE.BoxGeometry(0.38, 0.44, 0.24);
  const torso = new THREE.Mesh(torsoGeo, uniformMat);
  torso.position.y = 0.22;
  torso.castShadow = true;
  upperBody.add(torso);

  // Heavy Tactical Ballistic Vest (MOLLE webbing pouches)
  const vestGeo = new THREE.BoxGeometry(0.42, 0.38, 0.28);
  const vest = new THREE.Mesh(vestGeo, vestMat);
  vest.position.y = 0.23;
  vest.castShadow = true;
  upperBody.add(vest);

  // 3 Pouches on vest front
  [-0.1, 0, 0.1].forEach((px) => {
    const pouchGeo = new THREE.BoxGeometry(0.08, 0.14, 0.06);
    const pouch = new THREE.Mesh(pouchGeo, vestMat);
    pouch.position.set(px, 0.18, 0.16);
    upperBody.add(pouch);
  });

  // Radio pack on back
  const radioGeo = new THREE.BoxGeometry(0.12, 0.18, 0.08);
  const radio = new THREE.Mesh(radioGeo, vestMat);
  radio.position.set(0.08, 0.26, -0.16);
  upperBody.add(radio);

  // 3. Head & Helmet / Shemagh
  const head = new THREE.Group();
  head.position.set(0, 0.48, 0);
  upperBody.add(head);

  // Human Neck
  const neckGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.1, 12);
  const neck = new THREE.Mesh(neckGeo, skinMat);
  neck.position.y = 0.02;
  head.add(neck);

  // Human Face / Head base
  const faceGeo = new THREE.BoxGeometry(0.2, 0.22, 0.2);
  const face = new THREE.Mesh(faceGeo, skinMat);
  face.position.y = 0.14;
  face.castShadow = true;
  head.add(face);

  if (team === 'blue') {
    // Spec-Ops: FAST Tactical Ballistic Helmet with NVG Mount
    const helmetGeo = new THREE.SphereGeometry(0.14, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.65);
    const helmet = new THREE.Mesh(helmetGeo, blueHelmetMat);
    helmet.position.set(0, 0.18, 0);
    head.add(helmet);

    // NVG Front Shroud
    const shroudGeo = new THREE.BoxGeometry(0.05, 0.06, 0.03);
    const shroud = new THREE.Mesh(shroudGeo, blueKevlarMat);
    shroud.position.set(0, 0.22, 0.13);
    head.add(shroud);

    // Ballistic Goggles
    const goggleGeo = new THREE.BoxGeometry(0.19, 0.06, 0.07);
    const goggle = new THREE.Mesh(goggleGeo, goggleLensMat);
    goggle.position.set(0, 0.15, 0.1);
    head.add(goggle);

    // Tactical Comms Headset
    [-0.12, 0.12].forEach(hx => {
      const earcupGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.03, 12);
      earcupGeo.rotateZ(Math.PI / 2);
      const earcup = new THREE.Mesh(earcupGeo, blueHelmetMat);
      earcup.position.set(hx, 0.15, 0);
      head.add(earcup);
    });
  } else {
    // Red Team: Tactical Shemagh Balaclava wrap
    const shemaghGeo = new THREE.BoxGeometry(0.24, 0.26, 0.24);
    const shemagh = new THREE.Mesh(shemaghGeo, redShemaghMat);
    shemagh.position.y = 0.14;
    head.add(shemagh);

    // Tactical Desert Goggles
    const goggleGeo = new THREE.BoxGeometry(0.18, 0.06, 0.06);
    const goggle = new THREE.Mesh(goggleGeo, goggleLensMat);
    goggle.position.set(0, 0.16, 0.11);
    head.add(goggle);
  }

  // 4. Arms & Hands
  // Right Arm (Weapon Trigger Arm)
  const rightArm = new THREE.Group();
  rightArm.position.set(0.24, 0.38, 0);
  upperBody.add(rightArm);

  const rUpperArmGeo = new THREE.BoxGeometry(0.11, 0.26, 0.11);
  const rUpperArm = new THREE.Mesh(rUpperArmGeo, uniformMat);
  rUpperArm.position.y = -0.12;
  rUpperArm.castShadow = true;
  rightArm.add(rUpperArm);

  const rForearmGeo = new THREE.BoxGeometry(0.09, 0.24, 0.09);
  const rForearm = new THREE.Mesh(rForearmGeo, skinMat);
  rForearm.position.set(0, -0.32, 0.1);
  rForearm.rotation.x = -0.8;
  rightArm.add(rForearm);

  // Weapon Mount Anchor
  const weaponMount = new THREE.Group();
  weaponMount.position.set(0.08, -0.36, 0.35);
  upperBody.add(weaponMount);

  // Left Arm (Weapon Support Foregrip Arm)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.24, 0.38, 0);
  upperBody.add(leftArm);

  const lUpperArmGeo = new THREE.BoxGeometry(0.11, 0.26, 0.11);
  const lUpperArm = new THREE.Mesh(lUpperArmGeo, uniformMat);
  lUpperArm.position.y = -0.12;
  lUpperArm.castShadow = true;
  leftArm.add(lUpperArm);

  const lForearmGeo = new THREE.BoxGeometry(0.09, 0.24, 0.09);
  const lForearm = new THREE.Mesh(lForearmGeo, skinMat);
  lForearm.position.set(0.12, -0.3, 0.16);
  lForearm.rotation.x = -0.7;
  lForearm.rotation.y = 0.5;
  leftArm.add(lForearm);

  // 5. Legs & Tactical Boots
  // Left Leg
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.11, 0.9, 0);
  root.add(leftLeg);

  const lThighGeo = new THREE.BoxGeometry(0.14, 0.44, 0.15);
  const lThigh = new THREE.Mesh(lThighGeo, uniformMat);
  lThigh.position.y = -0.22;
  lThigh.castShadow = true;
  leftLeg.add(lThigh);

  const lShinGeo = new THREE.BoxGeometry(0.12, 0.44, 0.13);
  const lShin = new THREE.Mesh(lShinGeo, uniformMat);
  lShin.position.y = -0.62;
  lShin.castShadow = true;
  leftLeg.add(lShin);

  const lBootGeo = new THREE.BoxGeometry(0.13, 0.14, 0.22);
  const lBoot = new THREE.Mesh(lBootGeo, bootsMat);
  lBoot.position.set(0, -0.84, 0.04);
  leftLeg.add(lBoot);

  // Right Leg
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.11, 0.9, 0);
  root.add(rightLeg);

  const rThighGeo = new THREE.BoxGeometry(0.14, 0.44, 0.15);
  const rThigh = new THREE.Mesh(rThighGeo, uniformMat);
  rThigh.position.y = -0.22;
  rThigh.castShadow = true;
  rightLeg.add(rThigh);

  const rShinGeo = new THREE.BoxGeometry(0.12, 0.44, 0.13);
  const rShin = new THREE.Mesh(rShinGeo, uniformMat);
  rShin.position.y = -0.62;
  rShin.castShadow = true;
  rightLeg.add(rShin);

  const rBootGeo = new THREE.BoxGeometry(0.13, 0.14, 0.22);
  const rBoot = new THREE.Mesh(rBootGeo, bootsMat);
  rBoot.position.set(0, -0.84, 0.04);
  rightLeg.add(rBoot);

  // Animation state tracker
  let animTime = Math.random() * 10;

  const updateAnimation = (dt: number, speed: number, isShooting: boolean, pitch: number, isDead: boolean) => {
    animTime += dt;

    if (isDead) {
      // Death collapse ragdoll animation
      root.rotation.x = THREE.MathUtils.damp(root.rotation.x, -Math.PI / 2, 8, dt);
      root.position.y = THREE.MathUtils.damp(root.position.y, 0.2, 8, dt);
      leftLeg.rotation.x = THREE.MathUtils.damp(leftLeg.rotation.x, 0.4, 6, dt);
      rightLeg.rotation.x = THREE.MathUtils.damp(rightLeg.rotation.x, -0.3, 6, dt);
      upperBody.rotation.x = 0;
      return;
    }

    // Aim Pitch (Upper body tilts up and down with weapon)
    upperBody.rotation.x = THREE.MathUtils.damp(upperBody.rotation.x, pitch, 14, dt);

    // Natural Breathing idle
    const breath = Math.sin(animTime * 2.2) * 0.015;
    upperBody.position.y = 1.05 + breath;

    if (speed > 0.1) {
      // Running / Walking cycle
      const strideFreq = speed > 4.5 ? 12 : 7;
      const legAngle = Math.sin(animTime * strideFreq) * 0.65;
      leftLeg.rotation.x = legAngle;
      rightLeg.rotation.x = -legAngle;

      // Subtle hip bobbing
      root.position.y = Math.abs(Math.sin(animTime * strideFreq * 2)) * 0.04;
    } else {
      // Idle stance
      leftLeg.rotation.x = THREE.MathUtils.damp(leftLeg.rotation.x, 0.08, 6, dt);
      rightLeg.rotation.x = THREE.MathUtils.damp(rightLeg.rotation.x, -0.08, 6, dt);
      root.position.y = 0;
    }

    // Weapon firing recoil kick
    if (isShooting) {
      weaponMount.position.z = 0.35 - 0.04;
    } else {
      weaponMount.position.z = THREE.MathUtils.damp(weaponMount.position.z, 0.35, 16, dt);
    }
  };

  return {
    root,
    upperBody,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    weaponMount,
    team,
    updateAnimation,
  };
}
