import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  AERIAL_STORES,
  AERIAL_STREETS,
  AerialStore,
  CATEGORY_COLORS,
} from '../data/aerialStores';

/**
 * 空拍底圖與全區 3D 地圖定位系統（Aerial Map & Coordinate System）
 * - 將 Google 空拍圖作為全區 3D 場景的 Ground Plane 底圖材質
 * - 提供正規化座標 (-50 ~ 50) 與 3D 世界座標的雙向轉換
 * - 顯示 24 間店家的浮空標籤 (Billboard Label) 與點擊偵測盒
 * - 支援「編輯定位模式 (Debug Raycast Mode)」點擊地面印出 { x, z }
 */

const MAP_IMAGE_URL = `${import.meta.env.BASE_URL}textures/aerial-map.jpg`;
const MAP_ASPECT = 739 / 1024; // 空拍圖 高 / 寬

/** 每 1 正規化單位對應的世界距離（X 軸 140m 寬，Z 軸依圖片比例約 101m） */
export const AERIAL_SCALE_X = 1.4;
export const AERIAL_SCALE_Z = 1.4 * MAP_ASPECT;

export const GROUND_W = 100 * AERIAL_SCALE_X;
export const GROUND_D = 100 * AERIAL_SCALE_Z;

export function normalizedToWorld(x: number, z: number): THREE.Vector3 {
  return new THREE.Vector3(x * AERIAL_SCALE_X, 0, z * AERIAL_SCALE_Z);
}

export function worldToNormalized(v: THREE.Vector3): { x: number; z: number } {
  return {
    x: Math.round((v.x / AERIAL_SCALE_X) * 10) / 10,
    z: Math.round((v.z / AERIAL_SCALE_Z) * 10) / 10,
  };
}

function createLabelSprite(name: string, category: string, color: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  const r = 36;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.beginPath();
  ctx.moveTo(r, 8);
  ctx.lineTo(512 - r, 8);
  ctx.quadraticCurveTo(504, 8, 504, 8 + r);
  ctx.lineTo(504, 120 - r);
  ctx.quadraticCurveTo(504, 120, 512 - r, 120);
  ctx.lineTo(276, 120);
  ctx.lineTo(256, 150);
  ctx.lineTo(236, 120);
  ctx.lineTo(r, 120);
  ctx.quadraticCurveTo(8, 120, 8, 120 - r);
  ctx.lineTo(8, 8 + r);
  ctx.quadraticCurveTo(8, 8, r, 8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let fontSize = 44;
  ctx.font = `900 ${fontSize}px "Noto Sans TC", "PingFang TC", sans-serif`;
  while (ctx.measureText(name).width > 460 && fontSize > 22) {
    fontSize -= 2;
    ctx.font = `900 ${fontSize}px "Noto Sans TC", "PingFang TC", sans-serif`;
  }
  ctx.fillStyle = '#ffffff';
  ctx.fillText(name, 256, 50);

  ctx.font = '700 26px "Noto Sans TC", "PingFang TC", sans-serif';
  ctx.fillStyle = color;
  ctx.fillText(category, 256, 94);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(11.8, 3.7, 1);
  sprite.renderOrder = 12;
  return sprite;
}

export type AerialPickResult =
  | { type: 'store'; store: AerialStore }
  | { type: 'ground'; x: number; z: number; world: THREE.Vector3 }
  | null;

export class AerialMapWorld {
  public readonly group = new THREE.Group();
  public readonly labelsGroup = new THREE.Group();
  public readonly camera: THREE.PerspectiveCamera;
  public readonly controls: OrbitControls;
  public debugMode = false;

  private ground: THREE.Mesh;
  private storeMeshes: THREE.Mesh[] = [];
  private streetLines = new THREE.Group();
  private debugMarker: THREE.Group;
  private raycaster = new THREE.Raycaster();
  private textureLoader = new THREE.TextureLoader();

  constructor(scene: THREE.Scene, domElement: HTMLElement) {
    // Always keep the Google Aerial Ground Plane visible as the base map of the redesigned 3D world
    this.group.visible = true;
    scene.add(this.group);

    // 1. Ground plane with Google aerial photo
    const mapTex = this.textureLoader.load(MAP_IMAGE_URL);
    mapTex.colorSpace = THREE.SRGBColorSpace;
    mapTex.anisotropy = 8;
    this.ground = new THREE.Mesh(
      new THREE.PlaneGeometry(GROUND_W, GROUND_D),
      new THREE.MeshStandardMaterial({
        map: mapTex,
        roughness: 0.92,
        metalness: 0.04,
      })
    );
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -0.01;
    this.ground.receiveShadow = true;
    this.ground.name = 'aerialGround';
    this.group.add(this.ground);

    // Surrounding mountain/urban apron
    const apron = new THREE.Mesh(
      new THREE.PlaneGeometry(GROUND_W * 3.2, GROUND_D * 3.2),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.96 })
    );
    apron.rotation.x = -Math.PI / 2;
    apron.position.y = -0.08;
    this.group.add(apron);

    // 2. Street centerlines (visible in debug mode)
    const lineColors: Record<string, number> = {
      'huagang-47': 0x38bdf8,
      'huagang-47-2': 0xa3e635,
      'guanghua-26': 0xf472b6,
    };
    for (const st of AERIAL_STREETS) {
      const pts = st.centerline.map((p) => normalizedToWorld(p.x, p.z).setY(0.18));
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: lineColors[st.id] ?? 0xffffff, depthTest: false })
      );
      line.renderOrder = 15;
      this.streetLines.add(line);

      const mid = pts[Math.floor(pts.length / 2)];
      const lbl = createLabelSprite(
        st.name,
        '街道中心線',
        `#${(lineColors[st.id] ?? 0xffffff).toString(16).padStart(6, '0')}`
      );
      lbl.position.copy(mid).setY(4.2);
      lbl.scale.multiplyScalar(0.82);
      this.streetLines.add(lbl);
    }
    this.streetLines.visible = false;
    this.group.add(this.streetLines);

    // 3. Store pickable volumes + floating Billboard Labels above the 3D buildings
    AERIAL_STORES.forEach((store) => {
      const color = CATEGORY_COLORS[store.category] ?? '#94a3b8';
      const pos = normalizedToWorld(store.position.x, store.position.z);

      const storeGroup = new THREE.Group();
      storeGroup.position.copy(pos);
      storeGroup.rotation.y = store.rotationY;

      // Invisible raycast hit volume matching the 3D building footprint
      const hitBox = new THREE.Mesh(
        new THREE.BoxGeometry(6.8, 9.5, 6.2),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitBox.position.y = 4.75;
      hitBox.userData.store = store;
      storeGroup.add(hitBox);
      this.storeMeshes.push(hitBox);

      // Floating Billboard Label above the rooftop
      const label = createLabelSprite(store.name, store.category, color);
      label.position.set(0, 11.2, 0);
      storeGroup.add(label);

      this.labelsGroup.add(storeGroup);
    });
    this.labelsGroup.visible = false;
    this.group.add(this.labelsGroup);

    // 4. Debug click marker
    this.debugMarker = new THREE.Group();
    const pin = new THREE.Mesh(
      new THREE.ConeGeometry(0.75, 2.4, 12),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    pin.rotation.x = Math.PI;
    pin.position.y = 1.2;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.95, 1.4, 24),
      new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide, depthTest: false })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.14;
    this.debugMarker.add(pin, ring);
    this.debugMarker.visible = false;
    this.group.add(this.debugMarker);

    // 5. Dedicated orbit camera for Aerial Mode
    this.camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.5, 2500);
    this.camera.position.set(0, 108, 86);
    this.controls = new OrbitControls(this.camera, domElement);
    this.controls.target.set(0, 0, 2);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI * 0.47;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 260;
    this.controls.screenSpacePanning = false;
    this.controls.enabled = false;
    this.controls.update();
  }

  public setActive(active: boolean): void {
    this.controls.enabled = active;
    this.labelsGroup.visible = active;
  }

  public setDebugMode(on: boolean): void {
    this.debugMode = on;
    this.streetLines.visible = on;
    if (!on) this.debugMarker.visible = false;
  }

  public resize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  public update(elapsed: number): void {
    if (this.controls.enabled) {
      this.controls.update();
    }
    if (this.debugMarker.visible) {
      this.debugMarker.children[0].position.y = 1.2 + Math.sin(elapsed * 5) * 0.25;
    }
  }

  /** ndc: 螢幕正規化座標 (-1 ~ 1) */
  public pick(ndc: THREE.Vector2): AerialPickResult {
    this.raycaster.setFromCamera(ndc, this.camera);
    const storeHits = this.raycaster.intersectObjects(this.storeMeshes, false);
    if (storeHits.length > 0 && !this.debugMode) {
      return { type: 'store', store: storeHits[0].object.userData.store as AerialStore };
    }
    const groundHits = this.raycaster.intersectObject(this.ground, false);
    if (groundHits.length > 0) {
      const world = groundHits[0].point.clone();
      const n = worldToNormalized(world);
      return { type: 'ground', x: n.x, z: n.z, world };
    }
    if (storeHits.length > 0) {
      return { type: 'store', store: storeHits[0].object.userData.store as AerialStore };
    }
    return null;
  }

  public showDebugMarker(world: THREE.Vector3): void {
    this.debugMarker.position.set(world.x, 0, world.z);
    this.debugMarker.visible = true;
  }

  public focusStore(store: AerialStore): void {
    const p = normalizedToWorld(store.position.x, store.position.z);
    this.controls.target.copy(p);
    this.camera.position.set(p.x + 18, 34, p.z + 30);
  }
}
