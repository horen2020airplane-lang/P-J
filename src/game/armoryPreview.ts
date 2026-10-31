/**
 * 3D Interactive Armory Weapon Turntable Preview
 * Renders the chosen procedural firearm on a dedicated spinning pedestal with studio lighting.
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createM4A1Model, createAK47Model, createSniperModel, createPistolModel } from './weapons.ts';

export class ArmoryPreview {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private currentWeaponGroup: THREE.Group | null = null;
  private pedestal: THREE.Mesh;
  private animFrameId: number = 0;
  private isRotating: boolean = true;
  private targetRotY: number = 0;
  private dragStartX: number = 0;
  private isDragging: boolean = false;

  constructor(container: HTMLElement, weaponId: string) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 50);
    this.camera.position.set(0, 0.35, 1.25);
    this.camera.lookAt(0, 0.05, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    container.appendChild(this.renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // Studio lights
    const keyLight = new THREE.DirectionalLight(0xffeedd, 2.0);
    keyLight.position.set(2, 3, 2);
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x00f0ff, 1.2);
    rimLight.position.set(-2, 1, -2);
    this.scene.add(rimLight);

    const fillLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(fillLight);

    // Pedestal
    const pedGeo = new THREE.CylinderGeometry(0.55, 0.6, 0.08, 32);
    const pedMat = new THREE.MeshStandardMaterial({
      color: 0x111317,
      metalness: 0.85,
      roughness: 0.25,
    });
    this.pedestal = new THREE.Mesh(pedGeo, pedMat);
    this.pedestal.position.y = -0.25;
    this.scene.add(this.pedestal);

    // Cyan pedestal glowing ring
    const ringGeo = new THREE.TorusGeometry(0.53, 0.012, 16, 48);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = -0.21;
    this.scene.add(ring);

    this.setWeapon(weaponId);

    // Drag interaction
    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', (e) => {
      this.isDragging = true;
      this.isRotating = false;
      this.dragStartX = e.clientX;
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.isDragging || !this.currentWeaponGroup) return;
      const dx = e.clientX - this.dragStartX;
      this.dragStartX = e.clientX;
      this.targetRotY += dx * 0.01;
    });

    window.addEventListener('pointerup', () => {
      this.isDragging = false;
      // Resume slow idle spin after 3 seconds
      setTimeout(() => {
        if (!this.isDragging) this.isRotating = true;
      }, 3000);
    });

    this.tick();
  }

  public setWeapon(weaponId: string) {
    if (this.currentWeaponGroup) {
      this.scene.remove(this.currentWeaponGroup);
    }

    let model: THREE.Group;
    if (weaponId === 'm4a1') model = createM4A1Model();
    else if (weaponId === 'ak47') model = createAK47Model();
    else if (weaponId === 'sniper') model = createSniperModel();
    else model = createPistolModel();

    model.position.set(0, 0, 0);
    model.scale.set(1.4, 1.4, 1.4);
    this.currentWeaponGroup = model;
    this.scene.add(this.currentWeaponGroup);
  }

  private tick = () => {
    if (this.currentWeaponGroup) {
      if (this.isRotating) {
        this.targetRotY += 0.012;
      }
      this.currentWeaponGroup.rotation.y = THREE.MathUtils.damp(
        this.currentWeaponGroup.rotation.y,
        this.targetRotY,
        10,
        0.016
      );
    }

    this.renderer.render(this.scene, this.camera);
    this.animFrameId = requestAnimationFrame(this.tick);
  };

  public resize(w: number, h: number) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  public dispose() {
    cancelAnimationFrame(this.animFrameId);
    this.renderer.dispose();
  }
}
