import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  AERIAL_STORES,
  AERIAL_STREETS,
  AerialStore,
  CATEGORY_COLORS,
} from '../data/aerialStores';

/**
 * 空拍底圖模式：
 * - 以 Google 空拍圖作為 Ground Plane 材質
 * - 依正規化座標 (-50 ~ 50) 放置店家 Placeholder 方塊 + 浮空店名標籤
 * - 店面自動朝向所屬街道中心線
 * - 編輯定位模式：點擊地面回報正規化 { x, z }
 */

const MAP_IMAGE_URL = `${import.meta.env.BASE_URL}textures/aerial-map.jpg`;
const MAP_ASPECT = 739 / 1024; // 空拍圖 高 / 寬

/** 每 1 正規化單位對應的世界距離（X 軸 140m 寬，Z 軸依圖片比例） */
export const AERIAL_SCALE_X = 1.4;
export const AERIAL_SCALE_Z = 1.4 * MAP_ASPECT;

const GROUND_W = 100 * AERIAL_SCALE_X;
const GROUND_D = 100 * AERIAL_SCALE_Z;

export function normalizedToWorld(x: number, z: number): THREE.Vector3 {
  return new THREE.Vector3(x * AERIAL_SCALE_X, 0, z * AERIAL_SCALE_Z);
}

export function worldToNormalized(v: THREE.Vector3): { x: number; z: number } {
  return {
    x: Math.round((v.x / AERIAL_SCALE_X) * 10) / 10,
    z: Math.round((v.z / AERIAL_SCALE_Z) * 10) / 10,
  };
}

/** 找出點到折線上最近的點（世界座標，保留圖片比例） */
function nearestPointOnPolyline(p: THREE.Vector3, line: THREE.Vector3[]): THREE.Vector3 {
  let best = line[0].clone();
  let bestDist = Infinity;
  const seg = new THREE.Line3();
  const tmp = new THREE.Vector3();
  for (let i = 0; i < line.length - 1; i++) {
    seg.set(line[i], line[i + 1]);
    seg.closestPointToPoint(p, true, tmp);
    const d = tmp.distanceToSquared(p);
    if (d < bestDist) {
      bestDist = d;
      best = tmp.clone();
    }
  }
  return best;
}

function createLabelSprite(name: string, category: string, color: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  // Rounded pill background
  const r = 36;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.86)';
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
  sprite.scale.set(12.8, 4.0, 1);
  sprite.renderOrder = 10;
  return sprite;
}

export type AerialPickResult =
  | { type: 'store'; store: AerialStore }
  | { type: 'ground'; x: number; z: number; world: THREE.Vector3 }
  | null;

export class AerialMapWorld {
  public readonly group = new THREE.Group();
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
    this.group.visible = false;
    scene.add(this.group);

    // Independent lighting so the map stays readable at any time of day
    const hemi = new THREE.HemisphereLight(0xffffff, 0x64748b, 1.6);
    const sun = new THREE.DirectionalLight(0xfff3d6, 1.4);
    sun.position.set(60, 120, 40);
    this.group.add(hemi, sun);

    // 1. Ground plane with Google aerial photo
    const mapTex = this.textureLoader.load(MAP_IMAGE_URL);
    mapTex.colorSpace = THREE.SRGBColorSpace;
    mapTex.anisotropy = 8;
    this.ground = new THREE.Mesh(
      new THREE.PlaneGeometry(GROUND_W, GROUND_D),
      new THREE.MeshBasicMaterial({ map: mapTex, toneMapped: false })
    );
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.name = 'aerialGround';
    this.group.add(this.ground);

    // Dark surrounding apron so edges look clean
    const apron = new THREE.Mesh(
      new THREE.PlaneGeometry(GROUND_W * 3, GROUND_D * 3),
      new THREE.MeshBasicMaterial({ color: 0x1e293b })
    );
    apron.rotation.x = -Math.PI / 2;
    apron.position.y = -0.05;
    this.group.add(apron);

    // 2. Street centerlines (visible in debug mode)
    const lineColors: Record<string, number> = {
      'huagang-47': 0x38bdf8,
      'huagang-47-2': 0xa3e635,
      'guanghua-26': 0xf472b6,
    };
    const streetWorldLines = new Map<string, THREE.Vector3[]>();
    for (const st of AERIAL_STREETS) {
      const pts = st.centerline.map((p) => normalizedToWorld(p.x, p.z).setY(0.08));
      streetWorldLines.set(st.id, pts);
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: lineColors[st.id] ?? 0xffffff, depthTest: false })
      );
      line.renderOrder = 5;
      this.streetLines.add(line);

      const mid = pts[Math.floor(pts.length / 2)];
      const lbl = createLabelSprite(st.name, '街道中心線', `#${(lineColors[st.id] ?? 0xffffff).toString(16).padStart(6, '0')}`);
      lbl.position.copy(mid).setY(3);
      lbl.scale.multiplyScalar(0.8);
      this.streetLines.add(lbl);
    }
    this.streetLines.visible = false;
    this.group.add(this.streetLines);

    // 3. Store placeholder boxes + billboard labels
    AERIAL_STORES.forEach((store, idx) => {
      const color = CATEGORY_COLORS[store.category] ?? '#94a3b8';
      const pos = normalizedToWorld(store.position.x, store.position.z);

      let rotY = store.rotationY;
      if (rotY === null) {
        const line = streetWorldLines.get(store.street);
        if (line) {
          const target = nearestPointOnPolyline(pos, line);
          rotY = Math.atan2(target.x - pos.x, target.z - pos.z);
        } else {
          rotY = 0;
        }
        store.rotationY = Math.round(rotY * 1000) / 1000;
      }

      const storeGroup = new THREE.Group();
      storeGroup.position.copy(pos);
      storeGroup.rotation.y = rotY;

      const height = 3.2 + (idx % 3) * 1.1;
      const bodyMat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.55,
        transparent: true,
        opacity: 0.9,
      });
      const body = new THREE.Mesh(new THREE.BoxGeometry(4.6, height, 3.6), bodyMat);
      body.position.y = height / 2;
      body.userData.store = store;
      storeGroup.add(body);
      this.storeMeshes.push(body);

      // Front facade panel (+Z local, faces the street). Swapped for the real photo when facadeImage is set.
      const facadeMat = new THREE.MeshStandardMaterial({
        color: 0xfffbeb,
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.35,
        roughness: 0.4,
      });
      if (store.facadeImage) {
        const ft = this.textureLoader.load(`${import.meta.env.BASE_URL}${store.facadeImage}`);
        ft.colorSpace = THREE.SRGBColorSpace;
        facadeMat.map = ft;
        facadeMat.color.set(0xffffff);
        facadeMat.emissiveIntensity = 0.05;
      }
      const facade = new THREE.Mesh(new THREE.PlaneGeometry(4.3, height * 0.8), facadeMat);
      facade.position.set(0, height * 0.42, 1.81);
      facade.userData.store = store;
      storeGroup.add(facade);
      this.storeMeshes.push(facade);

      // Awning + door-direction arrow so the facing is obvious from above
      const awning = new THREE.Mesh(
        new THREE.BoxGeometry(4.8, 0.14, 1.1),
        new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.6 })
      );
      awning.position.set(0, height * 0.82, 2.25);
      awning.rotation.x = 0.25;
      storeGroup.add(awning);

      const arrow = new THREE.Mesh(
        new THREE.ConeGeometry(0.55, 1.3, 3),
        new THREE.MeshBasicMaterial({ color: 0xfef08a })
      );
      arrow.rotation.x = Math.PI / 2;
      arrow.position.set(0, 0.25, 2.9);
      storeGroup.add(arrow);

      const label = createLabelSprite(store.name, store.category, color);
      label.position.set(0, height + 2.4, 0);
      storeGroup.add(label);

      this.group.add(storeGroup);
    });

    // 4. Debug click marker
    this.debugMarker = new THREE.Group();
    const pin = new THREE.Mesh(
      new THREE.ConeGeometry(0.7, 2.2, 12),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    pin.rotation.x = Math.PI;
    pin.position.y = 1.1;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 1.3, 24),
      new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide, depthTest: false })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.1;
    this.debugMarker.add(pin, ring);
    this.debugMarker.visible = false;
    this.group.add(this.debugMarker);

    // 5. Dedicated orbit camera
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 2000);
    this.camera.position.set(0, 120, 95);
    this.controls = new OrbitControls(this.camera, domElement);
    this.controls.target.set(0, 0, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI * 0.47;
    this.controls.minDistance = 12;
    this.controls.maxDistance = 260;
    this.controls.screenSpacePanning = false;
    this.controls.enabled = false;
    this.controls.update();
  }

  public setActive(active: boolean): void {
    this.group.visible = active;
    this.controls.enabled = active;
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
    this.controls.update();
    if (this.debugMarker.visible) {
      this.debugMarker.children[0].position.y = 1.1 + Math.sin(elapsed * 5) * 0.25;
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
