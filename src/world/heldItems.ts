import * as THREE from 'three';
import { HeldItemShape, MenuItem } from '../data/shops';

export class HeldItemRig {
  public root = new THREE.Group();
  private umbrellaGroup = new THREE.Group();
  private foodGroup = new THREE.Group();
  private eatAnimTimer = 0;

  constructor(camera: THREE.Camera) {
    camera.add(this.root);

    // Build first-person Umbrella (left-top view)
    const shaftMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.4 });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.9, 8), shaftMat);
    shaft.position.set(0, 0.25, 0);

    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      roughness: 0.45,
      side: THREE.DoubleSide,
    });
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.22, 10, 1, true), canopyMat);
    canopy.position.set(0, 0.72, 0);

    this.umbrellaGroup.add(shaft, canopy);
    this.umbrellaGroup.position.set(-0.26, 0.15, -0.52);
    this.umbrellaGroup.visible = false;
    this.root.add(this.umbrellaGroup);

    // Food group positioned in lower right hand
    this.foodGroup.position.set(0.32, -0.26, -0.52);
    this.foodGroup.visible = false;
    this.root.add(this.foodGroup);
  }

  public setUmbrellaVisible(visible: boolean): void {
    this.umbrellaGroup.visible = visible;
  }

  public setHeldFood(item: MenuItem | null): void {
    while (this.foodGroup.children.length > 0) {
      this.foodGroup.remove(this.foodGroup.children[0]);
    }
    if (!item) {
      this.foodGroup.visible = false;
      return;
    }

    this.foodGroup.visible = true;
    this.buildFoodMesh(item.heldShape, item.dishColor, item.accentColor);
  }

  public triggerEatAnim(): void {
    this.eatAnimTimer = 0.38;
  }

  public update(dt: number, elapsed: number, windStrength: number, moving: boolean): void {
    // Subtle hand sway when walking
    const bobX = moving ? Math.cos(elapsed * 7) * 0.01 : 0;
    const bobY = moving ? Math.abs(Math.sin(elapsed * 7)) * 0.012 : Math.sin(elapsed * 1.8) * 0.004;

    if (this.eatAnimTimer > 0) {
      this.eatAnimTimer = Math.max(0, this.eatAnimTimer - dt);
    }
    const eatPhase = Math.sin((this.eatAnimTimer / 0.38) * Math.PI);

    this.foodGroup.position.set(
      0.32 + bobX - eatPhase * 0.14,
      -0.25 + bobY + eatPhase * 0.12,
      -0.52 + eatPhase * 0.12
    );
    this.foodGroup.rotation.x = eatPhase * 0.35;

    // Umbrella wind tremor (famous Yangmingshan strong wind!)
    if (this.umbrellaGroup.visible) {
      const tremble = windStrength > 0.5 ? Math.sin(elapsed * 14) * windStrength * 0.09 : Math.sin(elapsed * 3) * 0.02;
      this.umbrellaGroup.rotation.z = 0.08 + tremble;
      this.umbrellaGroup.rotation.x = -0.15 + Math.cos(elapsed * 9) * windStrength * 0.05;
    }
  }

  private buildFoodMesh(shape: HeldItemShape, mainHex: string, accentHex: string): void {
    const mainMat = new THREE.MeshStandardMaterial({ color: mainHex, roughness: 0.65 });
    const accentMat = new THREE.MeshStandardMaterial({ color: accentHex, roughness: 0.55 });

    if (shape === 'bowl' || shape === 'ricebowl') {
      const bowl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.075, 0.085, 16),
        new THREE.MeshStandardMaterial({ color: shape === 'bowl' ? 0xf8fafc : 0x1e293b, roughness: 0.35 })
      );
      const foodTop = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.098, 0.022, 16), mainMat);
      foodTop.position.y = 0.032;
      const garnish = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), accentMat);
      garnish.position.set(0.02, 0.048, 0);

      // Chopsticks
      const stickMat = new THREE.MeshStandardMaterial({ color: 0xe2c799, roughness: 0.7 });
      const stick1 = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.002, 0.22, 6), stickMat);
      stick1.position.set(0.04, 0.06, 0.02);
      stick1.rotation.z = -0.9;
      const stick2 = stick1.clone();
      stick2.position.z = -0.01;
      stick2.rotation.z = -0.82;

      this.foodGroup.add(bowl, foodTop, garnish, stick1, stick2);
    } else if (shape === 'friedbag') {
      const bag = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.16, 0.06),
        new THREE.MeshStandardMaterial({ color: 0xe6ccb2, roughness: 0.9 })
      );
      const chicken = new THREE.Mesh(new THREE.DodecahedronGeometry(0.065, 0), mainMat);
      chicken.scale.set(1.2, 0.85, 0.6);
      chicken.position.set(0, 0.09, 0);
      this.foodGroup.add(bag, chicken);
    } else {
      // Boba Milk Tea cup
      const cup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.056, 0.042, 0.16, 14),
        mainMat
      );
      const pearls = new THREE.Mesh(
        new THREE.CylinderGeometry(0.046, 0.042, 0.035, 12),
        accentMat
      );
      pearls.position.y = -0.06;
      const lid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.058, 0.058, 0.01, 14),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
      );
      lid.position.y = 0.082;
      const straw = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.006, 0.14, 8),
        new THREE.MeshStandardMaterial({ color: 0xf43f5e })
      );
      straw.position.set(0.015, 0.13, 0);
      straw.rotation.z = -0.15;
      this.foodGroup.add(cup, pearls, lid, straw);
    }
  }
}
