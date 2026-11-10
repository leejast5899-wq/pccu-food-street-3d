import * as THREE from 'three';
import {
  AERIAL_STORES,
  AERIAL_STREETS,
  AerialStore,
  SECONDARY_ROADS,
} from '../data/aerialStores';
import { ShopConfig, getShopConfigForAerialStore } from '../data/shops';
import { normalizedToWorld } from './aerialMap';
import {
  createArcadeTileTexture,
  createAsphaltBumpMap,
  createAsphaltRoughnessMap,
  createAsphaltTexture,
  createCeilingGridTexture,
  createChalkboardSignTexture,
  createCorrugatedMetalTexture,
  createDahongpaoBaseballCalendarTexture,
  createDahongpaoCounterFrontTexture,
  createDahongpaoInteriorWallMenuTexture,
  createDahongpaoLanternTexture,
  createDahongpaoSevenFlavorsBannerTexture,
  createGoldenMarkerTexture,
  createMenuBoardTexture,
  createSevenElevenSignTexture,
  createShopInteriorTexture,
  createSignTexture,
  createStreetSignTexture,
  createTerrazzoFloorTexture,
  createTileBumpTexture,
  createTileFacadeTexture,
  createTissuePackTexture,
  createVerticalSignTexture,
} from './textures';

export interface AABB {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export type InteractableKind =
  | 'shop'
  | 'soup'
  | 'seat'
  | 'viewpoint'
  | 'trivia'
  | 'landmark-slope';

export interface Interactable {
  id: string;
  kind: InteractableKind;
  label: string;
  position: THREE.Vector3;
  radius: number;
  shop?: ShopConfig;
  aerialStore?: AerialStore;
  seatLookAt?: THREE.Vector3;
}

export interface SteamEmitter {
  origin: THREE.Vector3;
  spread: number;
}

export interface AnimatedWorldRefs {
  lanterns: THREE.Group[];
  flags: THREE.Mesh[];
  shopLights: THREE.PointLight[];
  emissiveSignMaterials: THREE.MeshStandardMaterial[];
  windowMaterials: THREE.MeshStandardMaterial[];
  streetLampLights: THREE.PointLight[];
  streetLampBulbs: THREE.MeshStandardMaterial[];
  cityLightsGroup: THREE.Group;
  asphaltMaterial: THREE.MeshStandardMaterial;
  steamEmitters: SteamEmitter[];
  goldenMarkers: THREE.Group[];
}

export interface BuiltAlley {
  rootGroup: THREE.Group;
  colliders: AABB[];
  interactables: Interactable[];
  animated: AnimatedWorldRefs;
  getGroundHeight: (z: number, x?: number) => number;
}

// Inverse world matrix of 大紅袍麵店 group so getGroundHeight works accurately in its local space
const dahongpaoInverseMatrix = new THREE.Matrix4();
let dahongpaoMatrixReady = false;

export function getGroundHeight(z: number, x = 0): number {
  if (dahongpaoMatrixReady) {
    const pt = new THREE.Vector3(x, 0, z).applyMatrix4(dahongpaoInverseMatrix);
    if (pt.z >= -4.25 && pt.z <= 4.25 && pt.x < -4.6 && pt.x > -12.8) {
      if (pt.x < -5.55) return 0.22; // Elevated interior terrazzo floor
      return 0.12; // 2-step ceramic-tiled entrance threshold
    }
  }
  return 0;
}

export function buildGuanghuaAlley(parentScene: THREE.Scene): BuiltAlley {
  const rootGroup = new THREE.Group();
  parentScene.add(rootGroup);
  const scene = rootGroup;
  const colliders: AABB[] = [];
  const interactables: Interactable[] = [];
  const lanterns: THREE.Group[] = [];
  const flags: THREE.Mesh[] = [];
  const shopLights: THREE.PointLight[] = [];
  const emissiveSignMaterials: THREE.MeshStandardMaterial[] = [];
  const windowMaterials: THREE.MeshStandardMaterial[] = [];
  const streetLampLights: THREE.PointLight[] = [];
  const streetLampBulbs: THREE.MeshStandardMaterial[] = [];
  const steamEmitters: SteamEmitter[] = [];
  const goldenMarkers: THREE.Group[] = [];
  const goldenMarkerTex = createGoldenMarkerTexture();

  const addGoldenMarker = (wx: number, wy: number, wz: number, scale = 1.65) => {
    const mGroup = new THREE.Group();
    mGroup.position.set(wx, wy, wz);

    const ringMat = new THREE.MeshBasicMaterial({
      map: goldenMarkerTex,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const ringMesh = new THREE.Mesh(new THREE.PlaneGeometry(scale, scale), ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.025;
    ringMesh.name = 'markerRing';

    const diamondMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: new THREE.Color(0xf59e0b),
      emissiveIntensity: 1.1,
      roughness: 0.2,
      metalness: 0.4,
    });
    const diamond = new THREE.Mesh(new THREE.OctahedronGeometry(0.13, 0), diamondMat);
    diamond.scale.set(0.85, 1.35, 0.85);
    diamond.position.y = 0.48;
    diamond.name = 'markerDiamond';

    mGroup.add(ringMesh, diamond);
    scene.add(mGroup);
    goldenMarkers.push(mGroup);
  };

  // Shared PBR materials
  const asphaltTex = createAsphaltTexture();
  const asphaltRoughMap = createAsphaltRoughnessMap();
  const asphaltBumpMap = createAsphaltBumpMap();
  const asphaltMat = new THREE.MeshStandardMaterial({
    map: asphaltTex,
    roughnessMap: asphaltRoughMap,
    bumpMap: asphaltBumpMap,
    bumpScale: 0.016,
    roughness: 0.78,
    metalness: 0.14,
  });

  const junctionAsphaltMat = new THREE.MeshStandardMaterial({
    color: 0x282c34,
    roughnessMap: asphaltRoughMap,
    bumpMap: asphaltBumpMap,
    bumpScale: 0.016,
    roughness: 0.8,
    metalness: 0.12,
  });

  const arcadeTileTex = createArcadeTileTexture();
  const sidewalkMat = new THREE.MeshStandardMaterial({
    map: arcadeTileTex,
    roughness: 0.76,
    metalness: 0.06,
  });

  const sharedTileBumpTex = createTileBumpTexture();
  const roofMetalTexGreen = createCorrugatedMetalTexture('#2d5a4c', true);
  const roofMetalTexBlue = createCorrugatedMetalTexture('#2b4c6f', true);
  const shutterMetalTex = createCorrugatedMetalTexture('#94a3b8', false);

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x3b4252,
    roughness: 0.45,
    metalness: 0.65,
  });

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xb8c2cc,
    roughness: 0.28,
    metalness: 0.78,
  });

  const redStoolMat = new THREE.MeshStandardMaterial({
    color: 0xd62828,
    roughness: 0.4,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x6f4e37,
    roughness: 0.8,
  });

  // =========================================================================
  // 1. 3D ROAD NETWORK FROM AERIAL MAP POSITIONING (華岡路47巷・47巷2弄・光華路26巷)
  // =========================================================================
  const buildRoadPolyline = (
    centerline: Array<{ x: number; z: number }>,
    roadWidth: number,
    withSidewalks: boolean
  ) => {
    for (let i = 0; i < centerline.length - 1; i++) {
      const p1 = normalizedToWorld(centerline[i].x, centerline[i].z);
      const p2 = normalizedToWorld(centerline[i + 1].x, centerline[i + 1].z);
      const dx = p2.x - p1.x;
      const dz = p2.z - p1.z;
      const len = Math.hypot(dx, dz);
      const midX = (p1.x + p2.x) * 0.5;
      const midZ = (p1.z + p2.z) * 0.5;
      const angleY = Math.atan2(dx, dz);

      const segGroup = new THREE.Group();
      segGroup.position.set(midX, 0, midZ);
      segGroup.rotation.y = angleY;

      const roadMesh = new THREE.Mesh(
        new THREE.BoxGeometry(roadWidth, 0.04, len + 1.6),
        asphaltMat
      );
      roadMesh.position.y = 0.02;
      roadMesh.receiveShadow = true;
      segGroup.add(roadMesh);

      if (withSidewalks) {
        const swWidth = 1.85;
        const swOffset = roadWidth * 0.5 + swWidth * 0.5 - 0.1;
        const leftWalk = new THREE.Mesh(
          new THREE.BoxGeometry(swWidth, 0.11, len + 1.2),
          sidewalkMat
        );
        leftWalk.position.set(-swOffset, 0.055, 0);
        leftWalk.receiveShadow = true;

        const rightWalk = new THREE.Mesh(
          new THREE.BoxGeometry(swWidth, 0.11, len + 1.2),
          sidewalkMat
        );
        rightWalk.position.set(swOffset, 0.055, 0);
        rightWalk.receiveShadow = true;

        segGroup.add(leftWalk, rightWalk);
      }

      scene.add(segGroup);
    }

    // Smooth circular asphalt pads at vertices
    centerline.forEach(({ x: nx, z: nz }) => {
      const pt = normalizedToWorld(nx, nz);
      const disc = new THREE.Mesh(
        new THREE.CylinderGeometry(roadWidth * 0.54, roadWidth * 0.54, 0.042, 20),
        junctionAsphaltMat
      );
      disc.position.set(pt.x, 0.018, pt.z);
      disc.receiveShadow = true;
      scene.add(disc);
    });
  };

  AERIAL_STREETS.forEach((st) => {
    buildRoadPolyline(st.centerline, st.width, true);
  });
  SECONDARY_ROADS.forEach((rd) => {
    buildRoadPolyline(rd.centerline, rd.width, false);
  });

  // =========================================================================
  // 2. STREET ENTRANCE ARCHWAYS, TAIPEI STREET SIGNS & LANDMARKS
  // =========================================================================
  const addStreetArchway = (
    nx: number,
    nz: number,
    rotY: number,
    title: string,
    subtitle: string,
    bgHex: string
  ) => {
    const pos = normalizedToWorld(nx, nz);
    const archGroup = new THREE.Group();
    archGroup.position.set(pos.x, 0, pos.z);
    archGroup.rotation.y = rotY;

    const poleL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 5.4, 10), metalMat);
    poleL.position.set(-4.3, 2.7, 0);
    const poleR = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 5.4, 10), metalMat);
    poleR.position.set(4.3, 2.7, 0);
    const crossbar = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.24, 0.24), metalMat);
    crossbar.position.set(0, 5.2, 0);
    archGroup.add(poleL, poleR, crossbar);

    const archSignTex = createSignTexture(title, subtitle, bgHex, '#fde047');
    const archSignMat = new THREE.MeshStandardMaterial({
      map: archSignTex,
      emissive: new THREE.Color(0xffffff),
      emissiveMap: archSignTex,
      emissiveIntensity: 0.48,
      roughness: 0.38,
    });
    emissiveSignMaterials.push(archSignMat);
    const archSign = new THREE.Mesh(new THREE.BoxGeometry(5.6, 1.45, 0.22), archSignMat);
    archSign.position.set(0, 5.15, 0);
    archGroup.add(archSign);
    scene.add(archGroup);
  };

  // Archway 1: 光華路26巷 Main Gateway (near 煎茶苑 & 7-ELEVEN 文學門市)
  addStreetArchway(
    -15,
    24,
    Math.atan2(28, -14),
    '光華路26巷 美食街',
    '大紅袍・大Q麵店・7-11文學門市・越福鄉',
    '#155e3b'
  );

  // Archway 2: 華岡路47巷 North Food Street Gateway
  addStreetArchway(
    -35,
    -27.5,
    Math.atan2(29, -12),
    '華岡路47巷 便當街',
    '8鍋・華美丼飯・火炎焱・敦煌快餐',
    '#7c2d12'
  );

  // Street Signpost Helper
  const addTaipeiStreetPost = (
    nx: number,
    nz: number,
    rotY: number,
    roadName: string,
    subText: string
  ) => {
    const pos = normalizedToWorld(nx, nz);
    const g = new THREE.Group();
    g.position.set(pos.x, 0, pos.z);
    g.rotation.y = rotY;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.0, 8), steelMat);
    post.position.set(0, 1.5, 0);
    const tex = createStreetSignTexture(roadName, subText, true);
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(1.75, 0.78, 0.08),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4 })
    );
    plate.position.set(0, 2.78, 0);
    g.add(post, plate);
    scene.add(g);
  };

  addTaipeiStreetPost(22, -1, -0.3, '華岡路47巷2弄', '← 感恩麵店・大學城・好吃炒飯');
  addTaipeiStreetPost(-6, 19, 0.4, '光華路26巷', '大紅袍麵店・文思文具・COMEBUY →');
  addTaipeiStreetPost(12, -37, 0.2, '華岡路47巷', '7-11大學門市・越南美食館 →');

  // Landmark 1: 仇人坡起點 (West intersection along 華岡路 toward campus)
  const slopePos = normalizedToWorld(-45, -10);
  const slopeSignTex = createStreetSignTexture('仇人坡起點', '風大坡陡・牽好雨傘與曖昧對象', false);
  const slopeBoard = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 1.2, 0.16),
    new THREE.MeshStandardMaterial({ map: slopeSignTex, roughness: 0.45 })
  );
  slopeBoard.position.set(slopePos.x, 2.5, slopePos.z);
  slopeBoard.rotation.y = 1.25;
  scene.add(slopeBoard);

  const slopePole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.4, 8), steelMat);
  slopePole.position.set(slopePos.x, 1.2, slopePos.z);
  scene.add(slopePole);
  addGoldenMarker(slopePos.x + 1.8, 0.03, slopePos.z + 0.5, 1.85);

  interactables.push({
    id: 'landmark-enemy-slope',
    kind: 'landmark-slope',
    label: '查看「仇人坡」校園指標（打卡點）',
    position: new THREE.Vector3(slopePos.x + 1.8, 1.3, slopePos.z + 0.5),
    radius: 4.0,
  });

  // Landmark 2: 山仔后台北盆地景觀台 (South-east overlooking Taipei Basin & Taipei 101)
  const lookoutPos = normalizedToWorld(18, 36);
  const deckGroup = new THREE.Group();
  deckGroup.position.set(lookoutPos.x, 0, lookoutPos.z);
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(11.5, 0.26, 7.5),
    new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.85 })
  );
  deck.position.set(0, 0.08, 0);
  deck.receiveShadow = true;
  deckGroup.add(deck);

  const benchSeat = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.14, 0.65), woodMat);
  benchSeat.position.set(-2.4, 0.58, 1.2);
  const benchLegL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.55), metalMat);
  benchLegL.position.set(-3.4, 0.3, 1.2);
  const benchLegR = benchLegL.clone();
  benchLegR.position.x = -1.4;
  deckGroup.add(benchSeat, benchLegL, benchLegR);

  const topRail = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.08, 0.08), steelMat);
  topRail.position.set(0, 1.08, 3.55);
  deckGroup.add(topRail);
  for (let rx = -5.2; rx <= 5.2; rx += 2.6) {
    const rPost = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.05, 8), steelMat);
    rPost.position.set(rx, 0.55, 3.55);
    deckGroup.add(rPost);
  }

  const viewTex = createStreetSignTexture('山仔后景觀台', '眺望台北盆地 & 台北101夜景', false);
  const viewSign = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.92, 0.1),
    new THREE.MeshStandardMaterial({ map: viewTex, roughness: 0.4 })
  );
  viewSign.position.set(2.4, 1.25, 3.35);
  viewSign.rotation.y = Math.PI;
  deckGroup.add(viewSign);
  scene.add(deckGroup);

  addGoldenMarker(lookoutPos.x + 1.2, 0.22, lookoutPos.z + 1.8, 1.85);
  interactables.push({
    id: 'lookout-basin',
    kind: 'viewpoint',
    label: '在景觀台眺望【台北盆地夜景】',
    position: new THREE.Vector3(lookoutPos.x + 1.2, 1.2, lookoutPos.z + 1.8),
    radius: 4.2,
  });

  interactables.push({
    id: 'seat-lookout',
    kind: 'seat',
    label: '坐上景觀台木椅看夜景吃宵夜',
    position: new THREE.Vector3(lookoutPos.x - 2.4, 0.95, lookoutPos.z + 1.2),
    radius: 2.6,
    seatLookAt: new THREE.Vector3(lookoutPos.x, 1.2, lookoutPos.z + 60),
  });

  // =========================================================================
  // 3. BUILD ALL 24 AERIAL STORES AT EXACT NORMALIZED COORDINATES
  // =========================================================================
  const tilePalettes = [
    ['#d8d2c5', '#a39c8e'],
    ['#c8b8a6', '#948371'],
    ['#cbd5e1', '#94a3b8'],
    ['#d6c7b8', '#8c7a6b'],
  ];

  // Key stores that receive real-time PointLights (keeping total PointLights <= 14 for fast WebGL shaders)
  const pointLightStoreIds = new Set([
    'dahongpao',
    '711-wenxue',
    'daq-noodle',
    'vietnam-fuxiang',
    'comebuy',
    'ganen-noodle',
    'haochi-fried-rice',
    '8guo',
    'huamei-donburi',
    '711-daxue',
  ]);

  const textureLoader = new THREE.TextureLoader();

  AERIAL_STORES.forEach((store, idx) => {
    const shop = getShopConfigForAerialStore(store);
    const storeWorldPos = normalizedToWorld(store.position.x, store.position.z);
    const rotY = store.rotationY ?? 0;

    // -----------------------------------------------------------------------
    // SPECIAL 1:1 WALK-IN STORE: 大紅袍麵店 (3 光華路26巷 at { x: 1, z: 25 })
    // -----------------------------------------------------------------------
    if (store.id === 'dahongpao') {
      const dhpGroup = new THREE.Group();
      const localInteractables: Interactable[] = [];
      const localSteam: SteamEmitter[] = [];
      const localColliders: AABB[] = [];

      buildDahongpaoStoreAndInterior({
        scene: dhpGroup,
        shop,
        colliders: localColliders,
        interactables: localInteractables,
        lanterns,
        shopLights,
        emissiveSignMaterials,
        windowMaterials,
        steamEmitters: localSteam,
        metalMat,
        steelMat,
      });

      // In buildDahongpaoStoreAndInterior, the storefront counter is at local (-5.18, 0, -1.85) facing +X.
      // Rotating by (rotY - Math.PI / 2) aligns local +X with the street-facing direction (sin(rotY), 0, cos(rotY)).
      const dhpRotY = rotY - Math.PI / 2;
      dhpGroup.rotation.y = dhpRotY;
      const localFrontAnchor = new THREE.Vector3(-4.8, 0, 0).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        dhpRotY
      );
      dhpGroup.position.copy(storeWorldPos).sub(localFrontAnchor);
      dhpGroup.updateMatrixWorld(true);

      dahongpaoInverseMatrix.copy(dhpGroup.matrixWorld).invert();
      dahongpaoMatrixReady = true;

      // Transform local interactables to world coordinates
      localInteractables.forEach((item) => {
        item.position.applyMatrix4(dhpGroup.matrixWorld);
        if (item.seatLookAt) {
          item.seatLookAt.applyMatrix4(dhpGroup.matrixWorld);
        }
        item.aerialStore = store;
        interactables.push(item);
      });

      // Transform local steam emitters to world coordinates
      localSteam.forEach((st) => {
        st.origin.applyMatrix4(dhpGroup.matrixWorld);
        steamEmitters.push(st);
      });

      // Transform local AABB colliders by sampling their 4 corners into world AABBs
      localColliders.forEach((box) => {
        const corners = [
          new THREE.Vector3(box.minX, 0, box.minZ).applyMatrix4(dhpGroup.matrixWorld),
          new THREE.Vector3(box.maxX, 0, box.minZ).applyMatrix4(dhpGroup.matrixWorld),
          new THREE.Vector3(box.minX, 0, box.maxZ).applyMatrix4(dhpGroup.matrixWorld),
          new THREE.Vector3(box.maxX, 0, box.maxZ).applyMatrix4(dhpGroup.matrixWorld),
        ];
        const xs = corners.map((c) => c.x);
        const zs = corners.map((c) => c.z);
        colliders.push({
          minX: Math.min(...xs),
          maxX: Math.max(...xs),
          minZ: Math.min(...zs),
          maxZ: Math.max(...zs),
        });
      });

      // Golden interactive marker in front of 大紅袍麵店 counter
      const markerWorld = new THREE.Vector3(-3.35, 0.03, -1.5).applyMatrix4(dhpGroup.matrixWorld);
      addGoldenMarker(markerWorld.x, markerWorld.y, markerWorld.z, 1.9);

      scene.add(dhpGroup);
      return;
    }

    // -----------------------------------------------------------------------
    // COMPACT STYLIZED TAIWANESE STOREFRONT FOR THE OTHER 23 AERIAL STORES
    // Local coordinate convention inside shopGroup:
    //   +Z faces OUTWARD toward the street centerline
    //   -Z goes INWARD into the building
    //   X spans along the storefront width (-2.6m to +2.6m)
    // -----------------------------------------------------------------------
    const shopGroup = new THREE.Group();
    shopGroup.position.copy(storeWorldPos);
    shopGroup.rotation.y = rotY;

    const palette = tilePalettes[idx % tilePalettes.length];
    const facadeTex = createTileFacadeTexture(palette[0], palette[1]);
    const bldgMat = new THREE.MeshStandardMaterial({
      map: facadeTex,
      bumpMap: sharedTileBumpTex,
      bumpScale: 0.022,
      roughness: 0.82,
    });

    const isSevenEleven = store.id === '711-wenxue' || store.id === '711-daxue';
    const bldgWidth = 5.2;
    const bldgDepth = 4.2;
    const upperHeight = 6.2 + (idx % 3) * 1.1;

    // 1. Upper apartment block (2F & 3F)
    const upperBldg = new THREE.Mesh(
      new THREE.BoxGeometry(bldgWidth, upperHeight, bldgDepth),
      bldgMat
    );
    upperBldg.position.set(0, 3.2 + upperHeight / 2, -0.3);
    upperBldg.castShadow = true;
    upperBldg.receiveShadow = true;
    shopGroup.add(upperBldg);

    // 2. Ground-floor side pillars & recessed back wall
    const pillarL = new THREE.Mesh(new THREE.BoxGeometry(0.85, 3.25, bldgDepth), bldgMat);
    pillarL.position.set(-bldgWidth / 2 + 0.42, 1.62, -0.3);
    const pillarR = new THREE.Mesh(new THREE.BoxGeometry(0.85, 3.25, bldgDepth), bldgMat);
    pillarR.position.set(bldgWidth / 2 - 0.42, 1.62, -0.3);
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(bldgWidth - 1.5, 3.25, 1.2), bldgMat);
    backWall.position.set(0, 1.62, -1.75);
    shopGroup.add(pillarL, pillarR, backWall);

    // 3. Corrugated Sheet-Metal Rooftop Addition (頂樓鐵皮加蓋) + Water Tower (不鏽鋼水塔)
    const roofTopY = 3.2 + upperHeight;
    const roofAddMat = new THREE.MeshStandardMaterial({
      map: idx % 2 === 0 ? roofMetalTexGreen : roofMetalTexBlue,
      roughness: 0.62,
      metalness: 0.35,
    });
    const roofShack = new THREE.Mesh(
      new THREE.BoxGeometry(bldgWidth - 0.6, 2.1, bldgDepth - 0.6),
      roofAddMat
    );
    roofShack.position.set(0, roofTopY + 1.05, -0.35);
    const roofOverhang = new THREE.Mesh(
      new THREE.BoxGeometry(bldgWidth + 0.2, 0.12, bldgDepth + 0.3),
      roofAddMat
    );
    roofOverhang.position.set(0, roofTopY + 2.12, -0.2);
    roofOverhang.rotation.x = 0.07;
    shopGroup.add(roofShack, roofOverhang);

    const waterTower = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.4, 14), steelMat);
    waterTower.position.set(idx % 2 === 0 ? -1.4 : 1.4, roofTopY + 0.7, -1.1);
    shopGroup.add(waterTower);

    // 4. Upper apartment windows + security cages + AC units
    for (let floor = 0; floor < 2; floor++) {
      const wy = 4.6 + floor * 2.75;
      for (const wx of [-1.25, 1.25]) {
        const lit = (idx + floor + (wx > 0 ? 1 : 0)) % 2 === 0;
        const winMat = new THREE.MeshStandardMaterial({
          color: lit ? 0xffe4a3 : 0x334155,
          emissive: new THREE.Color(lit ? 0xffbe55 : 0x0f172a),
          emissiveIntensity: lit ? 0.52 : 0.08,
          roughness: 0.2,
          metalness: 0.15,
        });
        windowMaterials.push(winMat);
        const win = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.2, 0.12), winMat);
        win.position.set(wx, wy, 1.82);
        const sill = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.08, 0.32), metalMat);
        sill.position.set(wx, wy - 0.62, 1.9);
        shopGroup.add(win, sill);
      }
    }

    // 5. Storefront Awning & Rolling Shutter Box
    const awningMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(shop.themeColor),
      roughness: 0.58,
      metalness: 0.18,
    });
    const awning = new THREE.Mesh(new THREE.BoxGeometry(bldgWidth + 0.1, 0.14, 1.95), awningMat);
    awning.position.set(0, 3.18, 2.35);
    awning.rotation.x = 0.18;
    awning.castShadow = true;
    shopGroup.add(awning);

    const shutterBox = new THREE.Mesh(
      new THREE.BoxGeometry(bldgWidth - 1.5, 0.34, 0.38),
      new THREE.MeshStandardMaterial({ map: shutterMetalTex, roughness: 0.5, metalness: 0.45 })
    );
    shutterBox.position.set(0, 2.98, 1.65);
    shopGroup.add(shutterBox);

    // 6. Horizontal Signboard (7-ELEVEN iconic stripe or custom Taiwanese shop sign)
    const signTex = isSevenEleven
      ? createSevenElevenSignTexture()
      : createSignTexture(store.name, `${store.category} ・ ${shop.tag}`, shop.themeColor, shop.accentColor);
    const signMat = new THREE.MeshStandardMaterial({
      map: signTex,
      emissive: new THREE.Color(0xffffff),
      emissiveMap: signTex,
      emissiveIntensity: 0.54,
      roughness: 0.28,
    });
    emissiveSignMaterials.push(signMat);
    const signBox = new THREE.Mesh(new THREE.BoxGeometry(bldgWidth - 0.1, 1.25, 0.26), signMat);
    signBox.position.set(0, 3.85, 2.02);
    shopGroup.add(signBox);

    // 7. Projecting Vertical Neon Signboard (直立發光燈箱招牌)
    const vTex = createVerticalSignTexture(
      store.name.slice(0, 6),
      shop.themeColor,
      shop.accentColor
    );
    const vMat = new THREE.MeshStandardMaterial({
      map: vTex,
      emissive: new THREE.Color(0xffffff),
      emissiveMap: vTex,
      emissiveIntensity: 0.64,
      roughness: 0.28,
    });
    emissiveSignMaterials.push(vMat);
    const vSign = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.45, 0.88), vMat);
    vSign.position.set(bldgWidth / 2 + 0.35, 4.9, 2.35);
    shopGroup.add(vSign);

    // 8. Recessed Store Interior Backdrop (uses store.facadeImage if provided, else procedural interior)
    const interiorTex = createShopInteriorTexture(
      store.name,
      shop.style,
      shop.themeColor,
      shop.accentColor
    );
    const interiorGlowMat = new THREE.MeshStandardMaterial({
      map: interiorTex,
      emissive: new THREE.Color(0xfff0d4),
      emissiveMap: interiorTex,
      emissiveIntensity: 0.32,
      roughness: 0.55,
    });
    if (store.facadeImage) {
      textureLoader.load(`${import.meta.env.BASE_URL}${store.facadeImage}`, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        interiorGlowMat.map = tex;
        interiorGlowMat.emissiveMap = tex;
        interiorGlowMat.needsUpdate = true;
      });
    }
    windowMaterials.push(interiorGlowMat);
    const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(bldgWidth - 1.7, 2.85), interiorGlowMat);
    backdrop.position.set(0, 1.58, -1.08);
    shopGroup.add(backdrop);

    const recessFloor = new THREE.Mesh(
      new THREE.BoxGeometry(bldgWidth - 1.6, 0.14, 2.8),
      new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.72 })
    );
    recessFloor.position.set(0, 0.07, 0.25);
    const recessLightPanel = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.05, 0.55),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: new THREE.Color(0xfffbeb),
        emissiveIntensity: 1.15,
      })
    );
    recessLightPanel.position.set(0, 2.95, 0.45);
    windowMaterials.push(recessLightPanel.material as THREE.MeshStandardMaterial);
    shopGroup.add(recessFloor, recessLightPanel);

    // 9. Storefront Counter / 7-ELEVEN Glass Front + Boss NPC + Props
    if (isSevenEleven) {
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0xe0f2fe,
        emissive: new THREE.Color(0xbae6fd),
        emissiveIntensity: 0.55,
        transparent: true,
        opacity: 0.78,
      });
      windowMaterials.push(glassMat);
      const glassFront = new THREE.Mesh(new THREE.BoxGeometry(bldgWidth - 1.7, 2.4, 0.12), glassMat);
      glassFront.position.set(0, 1.32, 1.55);
      shopGroup.add(glassFront);

      // ATM + Senior Student NPC outside 7-ELEVEN for Trivia quests
      const kiosk = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 1.65, 0.65),
        new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4 })
      );
      kiosk.position.set(-1.75, 0.85, 2.05);
      const seniorNpc = createStylizedPerson('#1d4ed8', '#f5d0b5', '#fde047');
      seniorNpc.position.set(1.65, 0.11, 2.15);
      shopGroup.add(kiosk, seniorNpc);

      shopGroup.updateMatrixWorld(true);
      const triviaWorldPos = new THREE.Vector3(1.65, 1.2, 2.85).applyMatrix4(shopGroup.matrixWorld);
      interactables.push({
        id: `trivia-${store.id}`,
        kind: 'trivia',
        label: `找【${store.name} 熱心學長姐】接委託賺飯錢`,
        position: triviaWorldPos,
        radius: 3.2,
      });
    } else {
      const counterMat =
        shop.style === 'donburi'
          ? new THREE.MeshStandardMaterial({ color: 0x4a3525, roughness: 0.72 })
          : shop.style === 'tea'
            ? new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.45 })
            : steelMat;
      const counter = new THREE.Mesh(new THREE.BoxGeometry(2.85, 1.02, 0.95), counterMat);
      counter.position.set(0, 0.55, 1.45);
      counter.castShadow = true;
      counter.receiveShadow = true;
      shopGroup.add(counter);

      if (shop.style === 'tea') {
        const cupSealer = new THREE.Mesh(
          new THREE.BoxGeometry(0.38, 0.54, 0.38),
          new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.35, metalness: 0.3 })
        );
        cupSealer.position.set(-0.75, 1.32, 1.48);
        shopGroup.add(cupSealer);
        for (let t = 0; t < 2; t++) {
          const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.2, 0.52, 14),
            new THREE.MeshStandardMaterial({ color: t === 0 ? 0x78350f : 0x065f46, roughness: 0.3, metalness: 0.55 })
          );
          barrel.position.set(0.25 + t * 0.58, 1.32, 1.45);
          shopGroup.add(barrel);
        }
      } else {
        const glassCase = new THREE.Mesh(
          new THREE.BoxGeometry(1.45, 0.48, 0.46),
          new THREE.MeshStandardMaterial({
            color: 0xe0f2fe,
            transparent: true,
            opacity: 0.42,
            roughness: 0.1,
            metalness: 0.15,
          })
        );
        glassCase.position.set(-0.45, 1.28, 1.48);
        shopGroup.add(glassCase);
      }

      // Boss NPC behind counter facing +Z (toward the street)
      const boss = createStylizedPerson(
        shop.themeColor,
        '#f5d0b5',
        shop.style === 'donburi' ? '#1f2937' : '#f8fafc'
      );
      boss.position.set(0, 0.12, 0.55);
      shopGroup.add(boss);

      // Wall Menu Board on side pillar
      const menuTex = createMenuBoardTexture(
        store.name.slice(0, 7),
        shop.menuLines,
        shop.themeColor,
        shop.accentColor
      );
      const menuBoard = new THREE.Mesh(
        new THREE.BoxGeometry(1.15, 1.55, 0.06),
        new THREE.MeshStandardMaterial({ map: menuTex, roughness: 0.45 })
      );
      menuBoard.position.set(-2.15, 1.75, 1.84);
      shopGroup.add(menuBoard);
    }

    // 10. Sidewalk Chalkboard Sign, Potted Flower & 2F Balcony Greenery
    const chalkTex = createChalkboardSignTexture(
      store.name.slice(0, 7),
      shop.menuLines[0] || '招牌人氣餐點',
      shop.menuLines[1] || '現點現做超暖胃'
    );
    const chalkBoard = new THREE.Mesh(
      new THREE.BoxGeometry(0.54, 0.84, 0.06),
      new THREE.MeshStandardMaterial({ map: chalkTex, roughness: 0.72 })
    );
    chalkBoard.position.set(-1.95, 0.52, 2.25);
    chalkBoard.rotation.y = 0.28;
    shopGroup.add(chalkBoard);

    const potMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.78 });
    const leafClusterMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.75 });
    const flowerPot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.3, 10), potMat);
    flowerPot.position.set(2.05, 0.25, 2.15);
    const bush = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), leafClusterMat);
    bush.position.set(2.05, 0.48, 2.15);
    shopGroup.add(flowerPot, bush);

    const balconyPlanter = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.3, 0.42), woodMat);
    balconyPlanter.position.set(0, 4.1, 2.02);
    const balconyGreenery = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.26, 0.46), leafClusterMat);
    balconyGreenery.position.set(0, 4.32, 2.05);
    shopGroup.add(balconyPlanter, balconyGreenery);

    // Optional PointLight on anchor stores
    if (pointLightStoreIds.has(store.id)) {
      const sLight = new THREE.PointLight(0xffcf88, 12, 20, 1.3);
      sLight.position.set(0, 2.85, 2.8);
      shopGroup.add(sLight);
      shopLights.push(sLight);
    }

    // Update world matrix so we can compute exact world positions for interactables, markers & colliders
    shopGroup.updateMatrixWorld(true);

    // Free Soup Pot for 大Q麵店 & 感恩麵店
    if (shop.hasFreeSoup) {
      const potStand = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.42, 0.82, 16), steelMat);
      potStand.position.set(1.85, 0.52, 1.85);
      shopGroup.add(potStand);
      shopGroup.updateMatrixWorld(true);

      const potWorld = new THREE.Vector3(1.85, 1.1, 2.2).applyMatrix4(shopGroup.matrixWorld);
      steamEmitters.push({
        origin: potWorld.clone(),
        spread: 0.25,
      });
      interactables.push({
        id: `soup-${store.id}`,
        kind: 'soup',
        label: `盛一碗免費【${shop.hasFreeSoup.soupName}】（${store.name}）`,
        position: potWorld,
        radius: 2.6,
        shop,
        aerialStore: store,
      });
    } else if (shop.style === 'fried' || shop.style === 'spicy') {
      const steamWorld = new THREE.Vector3(0, 1.25, 1.55).applyMatrix4(shopGroup.matrixWorld);
      steamEmitters.push({
        origin: steamWorld,
        spread: 0.3,
      });
    }

    // Outdoor Stool Seat in front of every non-convenience food shop
    if (!isSevenEleven && store.category !== '3C' && store.category !== '文具' && store.category !== '零售') {
      const stoolTop = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.19, 0.08, 12), redStoolMat);
      stoolTop.position.set(-1.35, 0.52, 2.45);
      const stoolBase = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.21, 0.4, 10), redStoolMat);
      stoolBase.position.set(-1.35, 0.28, 2.45);
      shopGroup.add(stoolTop, stoolBase);
      shopGroup.updateMatrixWorld(true);

      const seatWorld = new THREE.Vector3(-1.35, 0.95, 2.45).applyMatrix4(shopGroup.matrixWorld);
      const lookWorld = new THREE.Vector3(0, 1.2, 1.2).applyMatrix4(shopGroup.matrixWorld);
      interactables.push({
        id: `seat-${store.id}`,
        kind: 'seat',
        label: `坐下休息 / 享用美食（${store.name}）`,
        position: seatWorld,
        radius: 2.1,
        seatLookAt: lookWorld,
      });
    }

    // Glowing Golden Interactive Circle Marker on the street in front of the shop
    const frontMarkerWorld = new THREE.Vector3(0, 0.03, 3.35).applyMatrix4(shopGroup.matrixWorld);
    addGoldenMarker(frontMarkerWorld.x, frontMarkerWorld.y, frontMarkerWorld.z, 1.65);

    // Main Shop Interactable
    const interactWorld = new THREE.Vector3(0, 1.2, 2.95).applyMatrix4(shopGroup.matrixWorld);
    interactables.push({
      id: `shop-${store.id}`,
      kind: 'shop',
      label: `向【${store.name}】點餐`,
      position: interactWorld,
      radius: 3.6,
      shop,
      aerialStore: store,
    });

    // Building Collider Box
    const centerWorld = new THREE.Vector3(0, 0, -0.2).applyMatrix4(shopGroup.matrixWorld);
    colliders.push({
      minX: centerWorld.x - 2.1,
      maxX: centerWorld.x + 2.1,
      minZ: centerWorld.z - 2.1,
      maxZ: centerWorld.z + 2.1,
    });

    scene.add(shopGroup);
  });

  // =========================================================================
  // 4. PARKED TAIWANESE SCOOTERS, TAIPOWER UTILITY POLES & OVERHEAD LANTERNS
  //    DISTRIBUTED ALONG ALL THREE STREETS
  // =========================================================================
  const scooterSpots: Array<{ nx: number; nz: number; rotY: number; color: number }> = [
    { nx: -25, nz: 31, rotY: 0.4, color: 0x1e293b },
    { nx: -5, nz: 22, rotY: -0.35, color: 0xdc2626 },
    { nx: 12, nz: 14, rotY: 0.5, color: 0x0f766e },
    { nx: 30, nz: 4, rotY: -0.4, color: 0xf8fafc },
    { nx: 19, nz: -15, rotY: 1.4, color: 0x475569 },
    { nx: -32, nz: -27, rotY: 0.35, color: 0xb91c1c },
    { nx: -14, nz: -36, rotY: -0.3, color: 0x1d4ed8 },
    { nx: 10, nz: -40, rotY: 0.25, color: 0x334155 },
  ];
  scooterSpots.forEach((sc) => {
    const pos = normalizedToWorld(sc.nx, sc.nz);
    const scooter = createScooterMesh(sc.color);
    scooter.position.set(pos.x, 0.04, pos.z);
    scooter.rotation.y = sc.rotY;
    scene.add(scooter);
    colliders.push({
      minX: pos.x - 0.5,
      maxX: pos.x + 0.5,
      minZ: pos.z - 0.5,
      maxZ: pos.z + 0.5,
    });
  });

  // Taipower Utility Poles with Yellow-Black Hazard Wrap + Street Lamps
  const hazardCanvas = document.createElement('canvas');
  hazardCanvas.width = 128;
  hazardCanvas.height = 256;
  const hCtx = hazardCanvas.getContext('2d')!;
  hCtx.fillStyle = '#facc15';
  hCtx.fillRect(0, 0, 128, 256);
  hCtx.fillStyle = '#111827';
  for (let y = -128; y < 256; y += 36) {
    hCtx.beginPath();
    hCtx.moveTo(0, y);
    hCtx.lineTo(128, y + 64);
    hCtx.lineTo(128, y + 82);
    hCtx.lineTo(0, y + 18);
    hCtx.closePath();
    hCtx.fill();
  }
  const hazardTex = new THREE.CanvasTexture(hazardCanvas);
  hazardTex.colorSpace = THREE.SRGBColorSpace;
  const hazardMat = new THREE.MeshStandardMaterial({ map: hazardTex, roughness: 0.4 });

  const poleCoords: Array<{ nx: number; nz: number; hasLight: boolean }> = [
    { nx: -20, nz: 26, hasLight: true },
    { nx: 4, nz: 15, hasLight: true },
    { nx: 26, nz: 2, hasLight: false },
    { nx: 19, nz: -18, hasLight: true },
    { nx: -28, nz: -28, hasLight: true },
    { nx: 2, nz: -39, hasLight: false },
  ];

  poleCoords.forEach((p, i) => {
    const pos = normalizedToWorld(p.nx, p.nz);
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.15, 7.8, 12),
      new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.78 })
    );
    pole.position.set(pos.x, 3.9, pos.z);
    pole.castShadow = true;
    scene.add(pole);

    const wrap = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.152, 1.35, 12), hazardMat);
    wrap.position.set(pos.x, 1.15, pos.z);
    scene.add(wrap);

    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xfff3cc,
      emissive: new THREE.Color(0xffb84d),
      emissiveIntensity: 0.85,
    });
    streetLampBulbs.push(bulbMat);
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.14, 0.28), bulbMat);
    bulb.position.set(pos.x + (i % 2 === 0 ? 0.8 : -0.8), 6.75, pos.z);
    scene.add(bulb);

    if (p.hasLight) {
      const sLamp = new THREE.PointLight(0xffcf88, 20, 28, 1.2);
      sLamp.position.set(pos.x, 6.4, pos.z);
      scene.add(sLamp);
      streetLampLights.push(sLamp);
    }
  });

  // Overhead Red & Gold Lantern Strings across all 3 streets
  const lanternSpans: Array<[[number, number], [number, number]]> = [
    [[-22, 26], [-18, 33]],
    [[-9, 17], [-5, 25]],
    [[5, 11], [9, 19]],
    [[19, 4], [23, 12]],
    [[16, -24], [24, -22]],
    [[18, -14], [26, -12]],
    [[-38, -32], [-34, -21]],
    [[-24, -36], [-20, -24]],
    [[14, -44], [18, -35]],
  ];

  lanternSpans.forEach(([a, b]) => {
    const pA = normalizedToWorld(a[0], a[1]);
    const pB = normalizedToWorld(b[0], b[1]);
    const mid = pA.clone().add(pB).multiplyScalar(0.5);
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(pA.x, 5.3, pA.z),
      new THREE.Vector3(mid.x, 4.55, mid.z),
      new THREE.Vector3(pB.x, 5.3, pB.z)
    );
    const cableGeo = new THREE.TubeGeometry(curve, 10, 0.02, 5, false);
    const cable = new THREE.Mesh(cableGeo, metalMat);
    scene.add(cable);

    [0.25, 0.5, 0.75].forEach((t, k) => {
      const pt = curve.getPoint(t);
      const lGroup = new THREE.Group();
      lGroup.position.copy(pt);

      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.25, 4), metalMat);
      cord.position.y = -0.12;
      const lanternMat = new THREE.MeshStandardMaterial({
        color: k === 1 ? 0xfbbf24 : 0xdc2626,
        emissive: new THREE.Color(k === 1 ? 0xf59e0b : 0xef4444),
        emissiveIntensity: 0.85,
        roughness: 0.4,
      });
      emissiveSignMaterials.push(lanternMat);
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), lanternMat);
      body.scale.set(1, 1.25, 1);
      body.position.y = -0.4;
      lGroup.add(cord, body);
      scene.add(lGroup);
      lanterns.push(lGroup);
    });
  });

  // =========================================================================
  // 5. DISTANT YANGMINGSHAN FOOTHILLS & TAIPEI BASIN CITYSCAPE (South +Z Vista)
  // =========================================================================
  const cityLightsGroup = new THREE.Group();
  const mountainMat = new THREE.MeshStandardMaterial({ color: 0x1e352b, roughness: 0.95 });
  const valleyFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(460, 260),
    new THREE.MeshStandardMaterial({ color: 0x161b26, roughness: 0.98 })
  );
  valleyFloor.rotation.x = -Math.PI / 2;
  valleyFloor.position.set(0, -28, 155);
  scene.add(valleyFloor);

  const hillL = new THREE.Mesh(new THREE.ConeGeometry(44, 34, 7), mountainMat);
  hillL.position.set(-78, -12, 95);
  const hillR = new THREE.Mesh(new THREE.ConeGeometry(48, 36, 7), mountainMat);
  hillR.position.set(82, -11, 98);
  const farRange = new THREE.Mesh(new THREE.ConeGeometry(95, 42, 8), mountainMat);
  farRange.position.set(10, -14, 235);
  scene.add(hillL, hillR, farRange);

  const bldgColors = [0xffd166, 0x93c5fd, 0xfca5a5, 0xfef08a];
  for (let i = 0; i < 65; i++) {
    const bx = (Math.random() - 0.5) * 200;
    const bz = 82 + Math.random() * 115;
    const bh = 6 + Math.random() * 20;
    const bw = 2.4 + Math.random() * 4.5;
    const cityBldgMat = new THREE.MeshStandardMaterial({
      color: 0x262e3d,
      emissive: new THREE.Color(bldgColors[i % bldgColors.length]),
      emissiveIntensity: 0.55,
      roughness: 0.6,
    });
    const cb = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bw), cityBldgMat);
    cb.position.set(bx, -28 + bh / 2, bz);
    cityLightsGroup.add(cb);
  }

  // Stylized Taipei 101 landmark in southern distance
  const t101Group = new THREE.Group();
  t101Group.position.set(22, -28, 152);
  const t101Mat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    emissive: new THREE.Color(0x38bdf8),
    emissiveIntensity: 0.65,
    roughness: 0.4,
  });
  for (let seg = 0; seg < 6; seg++) {
    const segMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(3.2 - seg * 0.28, 2.5 - seg * 0.22, 5.5, 4),
      t101Mat
    );
    segMesh.position.y = 6 + seg * 5.2;
    segMesh.rotation.y = Math.PI / 4;
    t101Group.add(segMesh);
  }
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.5, 9, 6), t101Mat);
  spire.position.y = 39;
  t101Group.add(spire);
  cityLightsGroup.add(t101Group);
  scene.add(cityLightsGroup);

  return {
    rootGroup,
    colliders,
    interactables,
    getGroundHeight,
    animated: {
      lanterns,
      flags,
      shopLights,
      emissiveSignMaterials,
      windowMaterials,
      streetLampLights,
      streetLampBulbs,
      cityLightsGroup,
      asphaltMaterial: asphaltMat,
      steamEmitters,
      goldenMarkers,
    },
  };
}

export function createStylizedPerson(shirtHex: string, skinHex: string, hatOrHairHex: string): THREE.Group {
  const g = new THREE.Group();
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirtHex, roughness: 0.68 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.82 });
  const skinMat = new THREE.MeshStandardMaterial({ color: skinHex, roughness: 0.62 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hatOrHairHex, roughness: 0.65 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3 });

  // Articulated Left & Right Legs + Sneakers (stored in userData for walking animation)
  const leftLegPivot = new THREE.Group();
  leftLegPivot.name = 'leftLegPivot';
  leftLegPivot.position.set(-0.11, 0.72, 0);
  const leftLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.48, 8, 12), pantsMat);
  leftLeg.position.y = -0.3;
  const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.09, 0.26), shoeMat);
  leftShoe.position.set(0, -0.62, 0.04);
  leftLegPivot.add(leftLeg, leftShoe);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.name = 'rightLegPivot';
  rightLegPivot.position.set(0.11, 0.72, 0);
  const rightLeg = leftLeg.clone();
  const rightShoe = leftShoe.clone();
  rightLegPivot.add(rightLeg, rightShoe);

  // Sculpted Rounded Torso + Collar
  const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.19, 0.18, 14), pantsMat);
  hips.position.y = 0.74;

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.21, 0.36, 10, 16), shirtMat);
  torso.scale.set(1.12, 1, 0.78);
  torso.position.y = 1.08;
  torso.castShadow = true;

  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.08, 14), shirtMat);
  collar.position.y = 1.38;

  // Articulated Left & Right Arms + Hands
  const leftArmPivot = new THREE.Group();
  leftArmPivot.name = 'leftArmPivot';
  leftArmPivot.position.set(-0.27, 1.3, 0);
  const leftSleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.18, 8, 10), shirtMat);
  leftSleeve.position.y = -0.1;
  const leftForearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.24, 8, 10), skinMat);
  leftForearm.position.y = -0.28;
  leftArmPivot.add(leftSleeve, leftForearm);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.name = 'rightArmPivot';
  rightArmPivot.position.set(0.27, 1.3, 0);
  const rightSleeve = leftSleeve.clone();
  const rightForearm = leftForearm.clone();
  rightArmPivot.add(rightSleeve, rightForearm);

  // Neck + Sculpted Head + Ears + Eyes + Layered Hair
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.12, 12), skinMat);
  neck.position.y = 1.43;

  const headGroup = new THREE.Group();
  headGroup.position.y = 1.62;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.195, 18, 16), skinMat);
  head.scale.set(0.96, 1.04, 0.96);

  // Ears
  const earL = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 8), skinMat);
  earL.position.set(-0.185, -0.01, 0);
  const earR = earL.clone();
  earR.position.x = 0.185;

  // Expressive Eyes
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), eyeMat);
  eyeL.position.set(-0.068, 0.02, 0.175);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.068;

  // Layered 3D Hair Crown + Bangs + Back Hair
  const hairCrown = new THREE.Mesh(
    new THREE.SphereGeometry(0.208, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62),
    hairMat
  );
  hairCrown.position.y = 0.02;
  const hairBack = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.14, 8, 12), hairMat);
  hairBack.scale.set(1.15, 1, 0.65);
  hairBack.position.set(0, -0.02, -0.08);

  headGroup.add(head, earL, earR, eyeL, eyeR, hairCrown, hairBack);

  g.add(leftLegPivot, rightLegPivot, hips, torso, collar, leftArmPivot, rightArmPivot, neck, headGroup);
  g.userData = {
    leftLegPivot,
    rightLegPivot,
    leftArmPivot,
    rightArmPivot,
    headGroup,
  };
  return g;
}

function createScooterMesh(bodyColor: number): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: bodyColor,
    roughness: 0.24,
    metalness: 0.42,
  });
  const darkTrimMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.65 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.88 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.3, metalness: 0.78 });
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.58 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.18, metalness: 0.88 });

  // Front & Rear Tires + Alloy Rims
  const fTire = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.13, 18), tireMat);
  fTire.rotation.z = Math.PI / 2;
  fTire.position.set(0, 0.24, 0.58);
  const fRim = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.14, 14), rimMat);
  fRim.rotation.z = Math.PI / 2;
  fRim.position.set(0, 0.24, 0.58);

  const bTire = fTire.clone();
  bTire.position.set(0, 0.24, -0.58);
  const bRim = fRim.clone();
  bRim.position.set(0, 0.24, -0.58);

  // Front mudguard & fork tubes
  const mudguard = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.45),
    bodyMat
  );
  mudguard.position.set(0, 0.26, 0.58);
  const forkL = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.52, 8), chromeMat);
  forkL.position.set(-0.09, 0.45, 0.52);
  forkL.rotation.x = -0.22;
  const forkR = forkL.clone();
  forkR.position.x = 0.09;

  // Footboard & Lower Underbody Chassis
  const footboard = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.1, 0.65), darkTrimMat);
  footboard.position.set(0, 0.32, 0.05);

  // Sculpted Rear Side Fairings
  const rearBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.52, 8, 14), bodyMat);
  rearBody.rotation.x = Math.PI / 2 - 0.12;
  rearBody.scale.set(1.08, 1, 0.82);
  rearBody.position.set(0, 0.56, -0.34);

  // Aerodynamic Front Shield & Leg Shield
  const frontShield = new THREE.Mesh(new THREE.CapsuleGeometry(0.21, 0.46, 8, 14), bodyMat);
  frontShield.scale.set(1.05, 1, 0.65);
  frontShield.position.set(0, 0.72, 0.44);
  frontShield.rotation.x = -0.24;

  // Handlebar Cowling + Grips + Left/Right Rear-View Mirrors (後照鏡)
  const cowling = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.16, 0.24), bodyMat);
  cowling.position.set(0, 1.06, 0.36);
  const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.68, 8), darkTrimMat);
  handlebar.rotation.z = Math.PI / 2;
  handlebar.position.set(0, 1.06, 0.34);

  for (const side of [-1, 1]) {
    const mirrorStem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.2, 6), chromeMat);
    mirrorStem.position.set(side * 0.24, 1.18, 0.35);
    mirrorStem.rotation.z = side * -0.35;
    const mirrorHead = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 8), darkTrimMat);
    mirrorHead.scale.set(1.2, 0.85, 0.4);
    mirrorHead.position.set(side * 0.29, 1.26, 0.35);
    g.add(mirrorStem, mirrorHead);
  }

  // Stepped Dual Leather Seat + Rear Grab Rail
  const seatFront = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.38, 8, 12), seatMat);
  seatFront.rotation.x = Math.PI / 2;
  seatFront.scale.set(1.1, 1, 0.55);
  seatFront.position.set(0, 0.73, -0.22);

  const grabRail = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.05, 0.24), chromeMat);
  grabRail.position.set(0, 0.76, -0.66);

  // Exhaust Pipe with Silver Heat Shield (排氣管＋防燙蓋)
  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.042, 0.56, 10), darkTrimMat);
  exhaust.rotation.x = Math.PI / 2 + 0.18;
  exhaust.position.set(0.2, 0.34, -0.45);
  const heatShield = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.07, 0.34), chromeMat);
  heatShield.rotation.x = -0.18;
  heatShield.position.set(0.245, 0.35, -0.45);

  // Side Kickstand (側柱)
  const kickstand = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.012, 0.34, 6), darkTrimMat);
  kickstand.position.set(-0.22, 0.16, 0.02);
  kickstand.rotation.z = 0.45;

  // Headlight + Glowing Red Taillight + White Taiwanese License Plate ("MPR-8826")
  const headlight = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xfef9c3, emissive: 0xfef08a, emissiveIntensity: 0.6 })
  );
  headlight.scale.set(1.3, 0.9, 0.6);
  headlight.position.set(0, 1.06, 0.48);

  const taillight = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.08, 0.05),
    new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 0.75 })
  );
  taillight.position.set(0, 0.65, -0.74);

  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.13, 0.02),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 })
  );
  plate.position.set(0, 0.46, -0.76);
  plate.rotation.x = 0.22;

  g.add(
    fTire,
    fRim,
    bTire,
    bRim,
    mudguard,
    forkL,
    forkR,
    footboard,
    rearBody,
    frontShield,
    cowling,
    handlebar,
    seatFront,
    grabRail,
    exhaust,
    heatShield,
    kickstand,
    headlight,
    taillight,
    plate
  );
  return g;
}

interface DahongpaoBuilderParams {
  scene: THREE.Group;
  shop: ShopConfig;
  colliders: AABB[];
  interactables: Interactable[];
  lanterns: THREE.Group[];
  shopLights: THREE.PointLight[];
  emissiveSignMaterials: THREE.MeshStandardMaterial[];
  windowMaterials: THREE.MeshStandardMaterial[];
  steamEmitters: SteamEmitter[];
  metalMat: THREE.MeshStandardMaterial;
  steelMat: THREE.MeshStandardMaterial;
}

/**
 * 1:1 Authentic Exterior Stall + Walk-in Interior Dining Room for 大紅袍 (3 光華路26巷)
 * Reconstructed directly from the user's real exterior & interior reference photographs.
 */
function buildDahongpaoStoreAndInterior(params: DahongpaoBuilderParams): void {
  const {
    scene,
    shop,
    colliders,
    interactables,
    lanterns,
    shopLights,
    emissiveSignMaterials,
    windowMaterials,
    steamEmitters,
    metalMat,
    steelMat,
  } = params;

  const group = new THREE.Group();
  group.position.set(0, 0, 0);

  const whiteWallMat = new THREE.MeshStandardMaterial({ color: 0xf1f0ea, roughness: 0.85 });
  const weatheredConcreteMat = new THREE.MeshStandardMaterial({ color: 0x8d8c84, roughness: 0.92 });
  const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x1e2024, roughness: 0.45, metalness: 0.55 });
  const plywoodMat = new THREE.MeshStandardMaterial({ color: 0xc29b6c, roughness: 0.82 });
  const cardboardMat = new THREE.MeshStandardMaterial({ color: 0xb68f5e, roughness: 0.85 });

  // ============================================================================
  // 1. UPPER APARTMENT BUILDING (2nd & 3rd Floors above the walkable ground floor)
  // ============================================================================
  const upperFacadeTex = createTileFacadeTexture('#d8d5ce', '#9c988e');
  const upperBldg = new THREE.Mesh(
    new THREE.BoxGeometry(6.8, 7.6, 9.2),
    new THREE.MeshStandardMaterial({ map: upperFacadeTex, roughness: 0.88 })
  );
  upperBldg.position.set(-9.4, 7.05, 0);
  upperBldg.castShadow = true;
  upperBldg.receiveShadow = true;
  group.add(upperBldg);

  // Weathered concrete 2nd-floor slab overhang (老屋水泥雨庇) as seen at top of exterior photo
  const concreteLedge = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.34, 8.8), weatheredConcreteMat);
  concreteLedge.position.set(-5.65, 3.35, 0);
  group.add(concreteLedge);

  // Upper metal security grille windows (鐵窗)
  for (const wz of [-2.2, 2.0]) {
    const grille = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.35, 1.85), metalMat);
    grille.position.set(-5.85, 4.75, wz);
    group.add(grille);
  }

  // Projecting red sign on far right corner ("大紅袍" vertical/side sign)
  const vSignTex = createVerticalSignTexture('大紅袍', '#b91c1c', '#fef08a');
  const vSignMat = new THREE.MeshStandardMaterial({
    map: vSignTex,
    emissive: new THREE.Color(0xffffff),
    emissiveMap: vSignTex,
    emissiveIntensity: 0.55,
    roughness: 0.35,
  });
  emissiveSignMaterials.push(vSignMat);
  const vSign = new THREE.Mesh(new THREE.BoxGeometry(0.95, 2.5, 0.22), vSignMat);
  vSign.position.set(-4.5, 4.35, -3.9);
  group.add(vSign);

  // ============================================================================
  // 2. WALK-IN INTERIOR ROOM SHELL (x = -6.0 to -12.6, z = -4.2 to +4.2, y = 0.22 to 3.08)
  // ============================================================================
  // Elevated Terrazzo Interior Floor (y = 0.22)
  const floorTex = createTerrazzoFloorTexture();
  const interiorFloor = new THREE.Mesh(
    new THREE.BoxGeometry(6.9, 0.22, 8.4),
    new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.72 })
  );
  interiorFloor.position.set(-9.25, 0.11, 0);
  interiorFloor.receiveShadow = true;
  group.add(interiorFloor);

  // White T-bar grid drop ceiling (輕鋼架天花板, y = 3.06)
  const ceilingTex = createCeilingGridTexture();
  const ceilingMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(6.8, 8.4),
    new THREE.MeshStandardMaterial({ map: ceilingTex, roughness: 0.85, side: THREE.DoubleSide })
  );
  ceilingMesh.rotation.x = Math.PI / 2;
  ceilingMesh.position.set(-9.25, 3.06, 0);
  ceilingMesh.castShadow = true;
  group.add(ceilingMesh);

  // 6 Recessed Dual-Tube Fluorescent Ceiling Light Troffers (雙管輕鋼架日光燈盤)
  const trofferFrameMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.4, metalness: 0.5 });
  const tubeGlowMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0xf0f9ff),
    emissiveIntensity: 0.82,
    roughness: 0.2,
  });
  windowMaterials.push(tubeGlowMat);

  for (const lx of [-7.3, -9.4, -11.4]) {
    for (const lz of [-1.6, 1.3]) {
      const troffer = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.04, 0.58), trofferFrameMat);
      troffer.position.set(lx, 3.04, lz);
      const tube1 = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.02, 0.14), tubeGlowMat);
      tube1.position.set(lx, 3.02, lz - 0.14);
      const tube2 = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.02, 0.14), tubeGlowMat);
      tube2.position.set(lx, 3.02, lz + 0.14);
      group.add(troffer, tube1, tube2);
    }
  }

  // Balanced Daylight-White Interior PointLights
  const intLight1 = new THREE.PointLight(0xf8fafc, 3.6, 9.5, 1.35);
  intLight1.position.set(-7.8, 2.85, -0.2);
  const intLight2 = new THREE.PointLight(0xf8fafc, 3.6, 9.5, 1.35);
  intLight2.position.set(-10.8, 2.85, -0.2);
  group.add(intLight1, intLight2);

  // Back Wall (West, x = -12.6)
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.0, 8.4), whiteWallMat);
  backWall.position.set(-12.6, 1.65, 0);
  backWall.castShadow = true;
  group.add(backWall);

  // South Wall (Left wall when looking out from inside, z = -4.15)
  const southWall = new THREE.Mesh(new THREE.BoxGeometry(6.8, 3.0, 0.2), whiteWallMat);
  southWall.position.set(-9.25, 1.65, -4.15);
  southWall.castShadow = true;
  group.add(southWall);

  // North Wall (Right wall when looking out from inside, z = +4.15)
  const northWall = new THREE.Mesh(new THREE.BoxGeometry(6.8, 3.0, 0.2), whiteWallMat);
  northWall.position.set(-9.25, 1.65, 4.15);
  northWall.castShadow = true;
  group.add(northWall);

  // Wall Colliders for Walk-in Interior Room
  colliders.push({ minX: -13.0, maxX: -12.35, minZ: -4.35, maxZ: 4.35 }); // Back wall
  colliders.push({ minX: -12.8, maxX: -4.8, minZ: -4.35, maxZ: -3.95 }); // South wall
  colliders.push({ minX: -12.8, maxX: -4.8, minZ: 3.95, maxZ: 4.35 }); // North wall

  // ============================================================================
  // 3. SOUTH WALL DETAILS (Split AC Unit + Large Red 2x5 Circular Photo Menu Board)
  // ============================================================================
  const acUnit = new THREE.Mesh(
    new THREE.BoxGeometry(1.25, 0.36, 0.28),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 })
  );
  acUnit.position.set(-8.85, 2.72, -3.92);
  const acVent = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.05, 0.29), darkMetalMat);
  acVent.position.set(-8.85, 2.58, -3.91);
  group.add(acUnit, acVent);

  const wallMenuTex = createDahongpaoInteriorWallMenuTexture();
  const wallMenuMesh = new THREE.Mesh(
    new THREE.BoxGeometry(3.1, 1.62, 0.05),
    new THREE.MeshStandardMaterial({ map: wallMenuTex, roughness: 0.45 })
  );
  wallMenuMesh.position.set(-8.45, 1.68, -4.01);
  group.add(wallMenuMesh);

  // ============================================================================
  // 4. FRONT PARTITION WALL ("HERO! HITO! 冠軍之路 2026" Calendar + Newspapers + Boxes)
  //    AND TRANSPARENT PVC STRIP CURTAIN DOORWAY (透明塑膠門簾)
  // ============================================================================
  const partitionMaterials = [
    whiteWallMat, // +x (exterior behind chef)
    plywoodMat,   // -x (interior plywood with HERO! HITO! 2026 calendar)
    plywoodMat,
    plywoodMat,
    plywoodMat,
    plywoodMat,
  ];
  const plywoodPartition = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.86, 3.2), partitionMaterials);
  plywoodPartition.position.set(-6.12, 1.64, -2.45);
  group.add(plywoodPartition);

  const rightTilePillar = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 2.95, 0.55),
    new THREE.MeshStandardMaterial({ map: upperFacadeTex, roughness: 0.75 })
  );
  rightTilePillar.position.set(-5.85, 1.62, -3.82);
  group.add(rightTilePillar);

  const calendarTex = createDahongpaoBaseballCalendarTexture();
  const calendarPoster = new THREE.Mesh(
    new THREE.PlaneGeometry(1.08, 1.56),
    new THREE.MeshStandardMaterial({ map: calendarTex, roughness: 0.5 })
  );
  calendarPoster.rotation.y = -Math.PI / 2;
  calendarPoster.position.set(-6.20, 1.98, -2.92);
  group.add(calendarPoster);

  const baseBox = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.56), cardboardMat);
  baseBox.position.set(-6.44, 0.92, -3.48);
  group.add(baseBox);

  for (let n = 0; n < 7; n++) {
    const paperLayer = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.035, 0.52),
      new THREE.MeshStandardMaterial({ color: n % 2 === 0 ? 0xe5e7eb : 0xd1d5db, roughness: 0.9 })
    );
    paperLayer.position.set(-6.44, 1.12 + n * 0.04, -3.48);
    paperLayer.rotation.y = (n % 3 - 1) * 0.04;
    group.add(paperLayer);
  }

  const greenBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.16, 0.36),
    new THREE.MeshStandardMaterial({ color: 0x3f6212, roughness: 0.65 })
  );
  greenBox.position.set(-6.44, 1.46, -3.48);
  group.add(greenBox);

  const kyBox1 = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.55, 1.45), cardboardMat);
  kyBox1.position.set(-6.42, 1.02, -1.95);
  const kyBox2 = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.52, 0.65), cardboardMat);
  kyBox2.position.set(-6.44, 1.0, -2.95);
  group.add(kyBox1, kyBox2);

  // Clear Vertical-Strip PVC Plastic Curtain (透明防冷氣外洩塑膠門簾, z = -0.82 to +1.75)
  const curtainRod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.75, 10), steelMat);
  curtainRod.rotation.x = Math.PI / 2;
  curtainRod.position.set(-6.08, 2.94, 0.45);
  group.add(curtainRod);

  const pvcStripMat = new THREE.MeshPhysicalMaterial({
    color: 0xe0f2fe,
    transparent: true,
    opacity: 0.28,
    roughness: 0.12,
    metalness: 0.05,
    transmission: 0.45,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const numStrips = 9;
  for (let s = 0; s < numStrips; s++) {
    const sz = -0.72 + s * 0.29;
    const clamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.09, 0.27),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.5 })
    );
    clamp.position.set(-6.08, 2.86, sz);
    group.add(clamp);

    const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.31, 2.52), pvcStripMat);
    strip.rotation.y = Math.PI / 2 + (s % 2 === 0 ? 0.03 : -0.03);
    strip.position.set(-6.08 + (s % 2) * 0.012, 1.58, sz);
    group.add(strip);
  }

  // ============================================================================
  // 5. NORTH WALL DETAILS (Wall-Mounted Fans + Wooden Utility Shelves + Condiments)
  // ============================================================================
  for (const fx of [-7.65, -10.35]) {
    const fanGroup = new THREE.Group();
    fanGroup.position.set(fx, 2.42, 3.92);
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.25), steelMat);
    const cage = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.26, 0.12, 16),
      new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.4, metalness: 0.5 })
    );
    cage.rotation.x = Math.PI / 2 - 0.25;
    cage.position.set(0, -0.04, -0.18);
    fanGroup.add(bracket, cage);
    group.add(fanGroup);
  }

  const shelfLower = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.06, 0.52), plywoodMat);
  shelfLower.position.set(-8.8, 1.08, 3.82);
  const shelfUpper = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 0.38), plywoodMat);
  shelfUpper.position.set(-9.4, 1.98, 3.88);
  const underBox1 = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.65, 0.46), cardboardMat);
  underBox1.position.set(-9.6, 0.58, 3.82);
  const underBox2 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.58, 0.44), cardboardMat);
  underBox2.position.set(-8.5, 0.54, 3.82);
  group.add(shelfLower, shelfUpper, underBox1, underBox2);

  // ============================================================================
  // 6. 3 ROWS OF AUTHENTIC CREAM DINING TABLES + TISSUE PACKS + ROUND STOOLS + DINERS
  // ============================================================================
  const creamTableMat = new THREE.MeshStandardMaterial({ color: 0xebe0c5, roughness: 0.45 });
  const stoolSeatMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.5, metalness: 0.3 });
  const tissuePackTex = createTissuePackTexture();
  const tissuePackMat = new THREE.MeshStandardMaterial({ map: tissuePackTex, roughness: 0.4 });
  const whiteTissueMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, side: THREE.DoubleSide });

  const tableRowsX = [-7.35, -9.25, -11.15];
  tableRowsX.forEach((tx, rIdx) => {
    const tableCenterZ = -0.9;
    const tableLenZ = 3.8;

    const blackRim = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.055, tableLenZ + 0.04), darkMetalMat);
    blackRim.position.set(tx, 0.94, tableCenterZ);
    const creamTop = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.06, tableLenZ), creamTableMat);
    creamTop.position.set(tx, 0.95, tableCenterZ);
    creamTop.receiveShadow = true;
    group.add(blackRim, creamTop);

    for (const lz of [-2.55, -0.9, 0.75]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.72, 8), darkMetalMat);
      leg.position.set(tx, 0.58, lz);
      group.add(leg);
    }

    const tissueZ = -1.05 + (rIdx - 1) * 0.08;
    const tissuePack = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.11, 0.24), tissuePackMat);
    tissuePack.position.set(tx, 1.035, tissueZ);
    const tissueSheet = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.12), whiteTissueMat);
    tissueSheet.position.set(tx, 1.13, tissueZ);
    tissueSheet.rotation.y = 0.35;
    tissueSheet.rotation.z = 0.18;
    group.add(tissuePack, tissueSheet);

    for (const sz of [-2.25, -1.35, -0.45, 0.45]) {
      for (const sideOffset of [-0.52, 0.52]) {
        const sx = tx + sideOffset;
        const stoolSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.18, 0.05, 14), stoolSeatMat);
        stoolSeat.position.set(sx, 0.66, sz);
        const stoolBase = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.19, 0.42, 10), darkMetalMat);
        stoolBase.position.set(sx, 0.43, sz);
        group.add(stoolSeat, stoolBase);
      }
    }

    colliders.push({
      minX: tx - 0.42,
      maxX: tx + 0.42,
      minZ: -2.85,
      maxZ: 1.05,
    });
  });

  // Seated Diner 1 (Middle-row right side: Male student in crisp white shirt)
  const whiteShirtStudent = createSeatedDinerMesh('#f8fafc', '#f5d0b5', '#111827', false);
  whiteShirtStudent.position.set(-8.68, 0.22, 0.42);
  whiteShirtStudent.rotation.y = Math.PI / 2;
  group.add(whiteShirtStudent);

  // Seated Diner 2 (Back-row left side: Older gentleman in blue/white striped polo shirt)
  const stripedPoloUncle = createSeatedDinerMesh('#cbd5e1', '#eab696', '#9ca3af', true);
  stripedPoloUncle.position.set(-10.58, 0.22, -1.65);
  stripedPoloUncle.rotation.y = Math.PI / 2;
  group.add(stripedPoloUncle);

  for (const [bx, bz] of [
    [-7.35, 0.42],
    [-9.25, -1.65],
  ]) {
    const bowl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.09, 0.09, 14),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.35 })
    );
    bowl.position.set(bx, 1.02, bz);
    const chiliTop = new THREE.Mesh(
      new THREE.CircleGeometry(0.12, 12),
      new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.4 })
    );
    chiliTop.rotation.x = -Math.PI / 2;
    chiliTop.position.set(bx, 1.068, bz);
    group.add(bowl, chiliTop);
  }

  interactables.push({
    id: 'seat-dahongpao-photo-view',
    kind: 'seat',
    label: '坐進【大紅袍店內後排圓凳】（1:1 實景照片視角吹冷氣吃麵）',
    position: new THREE.Vector3(-11.72, 1.15, -0.45),
    radius: 2.3,
    seatLookAt: new THREE.Vector3(-5.8, 1.55, -0.45),
  });

  interactables.push({
    id: 'seat-dahongpao-front',
    kind: 'seat',
    label: '坐進【大紅袍店內前排座位】享用川味燃麵',
    position: new THREE.Vector3(-7.9, 1.15, -0.45),
    radius: 2.1,
    seatLookAt: new THREE.Vector3(-6.1, 1.65, -2.2),
  });

  // ============================================================================
  // 7. AUTHENTIC EXTERIOR STOREFRONT (3 光華路26巷 — Right Cooking Stall + Left Steps)
  // ============================================================================
  const stepTileMat = new THREE.MeshStandardMaterial({ color: 0x9e9589, roughness: 0.8 });
  const step1 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.11, 3.5), stepTileMat);
  step1.position.set(-4.95, 0.055, 1.8);
  const step2 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.21, 3.5), stepTileMat);
  step2.position.set(-5.52, 0.105, 1.8);
  const nosing1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 3.48), darkMetalMat);
  nosing1.position.set(-4.69, 0.11, 1.8);
  const nosing2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 3.48), darkMetalMat);
  nosing2.position.set(-5.21, 0.21, 1.8);
  group.add(step1, step2, nosing1, nosing2);

  for (const bz of [-3.1, -1.9, -0.7]) {
    const cinderBlock = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.18, 0.42), weatheredConcreteMat);
    cinderBlock.position.set(-4.95, 0.12, bz);
    group.add(cinderBlock);
  }

  const counterFrontTex = createDahongpaoCounterFrontTexture();
  const whiteCounterMat = new THREE.MeshStandardMaterial({ color: 0xe7e9ee, roughness: 0.65 });
  const counterFrontMat = new THREE.MeshStandardMaterial({ map: counterFrontTex, roughness: 0.5 });

  const stallBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.96, 1.04, 3.35),
    [
      counterFrontMat,
      whiteCounterMat,
      whiteCounterMat,
      whiteCounterMat,
      whiteCounterMat,
      whiteCounterMat,
    ]
  );
  stallBody.position.set(-5.18, 0.72, -1.85);
  stallBody.castShadow = true;
  stallBody.receiveShadow = true;
  group.add(stallBody);

  const sideShieldLower = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.88, 0.08), whiteCounterMat);
  sideShieldLower.position.set(-5.18, 0.64, -0.16);
  const sideShieldUpper = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.42, 0.08), whiteCounterMat);
  sideShieldUpper.position.set(-5.32, 1.26, -0.16);
  sideShieldUpper.rotation.z = -0.35;
  group.add(sideShieldLower, sideShieldUpper);

  const blackCounterTop = new THREE.Mesh(
    new THREE.BoxGeometry(1.08, 0.06, 3.45),
    new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.35, metalness: 0.25 })
  );
  blackCounterTop.position.set(-5.16, 1.26, -1.88);
  group.add(blackCounterTop);

  const paperBowlMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
  const stackPositions: Array<[number, number, number]> = [
    [-5.02, -0.45, 0.46],
    [-5.02, -0.74, 0.42],
    [-5.02, -1.00, 0.26],
  ];
  stackPositions.forEach(([sx, sz, sh]) => {
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.095, sh, 14), paperBowlMat);
    stack.position.set(sx, 1.29 + sh / 2, sz);
    group.add(stack);
  });

  const orderPad = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.04, 0.32),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 })
  );
  orderPad.position.set(-4.95, 1.31, -1.32);
  const miniStand = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.32, 0.22),
    new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.5 })
  );
  miniStand.position.set(-5.05, 1.45, -1.58);
  miniStand.rotation.z = -0.15;
  group.add(orderPad, miniStand);

  for (const bz of [-2.15, -2.48]) {
    const cBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.08, 0.11, 14), paperBowlMat);
    cBowl.position.set(-5.02, 1.34, bz);
    group.add(cBowl);
  }

  const deskFanStand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.08, 0.28, 10), paperBowlMat);
  deskFanStand.position.set(-5.02, 1.42, -3.05);
  const deskFanHead = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.09, 14), paperBowlMat);
  deskFanHead.rotation.z = Math.PI / 2;
  deskFanHead.position.set(-5.02, 1.62, -3.05);
  group.add(deskFanStand, deskFanHead);

  colliders.push({
    minX: -6.35,
    maxX: -4.55,
    minZ: -3.85,
    maxZ: -0.12,
  });

  const chefNpc = createStylizedPerson('#18181b', '#eab696', '#111827');
  chefNpc.position.set(-5.72, 0.22, -1.45);
  chefNpc.rotation.y = Math.PI / 2;
  group.add(chefNpc);

  steamEmitters.push({
    origin: new THREE.Vector3(-5.35, 1.38, -1.85),
    spread: 0.35,
  });

  // ============================================================================
  // 8. LEFT PREP AREA & BACK WALL RED BANNER ("人生七味：酸甜苦辣鹹香麻 ／ 食在中國 味在四川")
  // ============================================================================
  const fridge = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.45, 1.25), steelMat);
  fridge.position.set(-5.78, 0.94, 3.05);
  const greenBasket = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.18, 0.56),
    new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.45 })
  );
  greenBasket.position.set(-5.75, 1.75, 2.95);
  const orangePrep = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.12, 0.14, 12),
    new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.5 })
  );
  orangePrep.position.set(-5.75, 1.88, 2.95);
  group.add(fridge, greenBasket, orangePrep);

  colliders.push({
    minX: -6.25,
    maxX: -5.25,
    minZ: 2.35,
    maxZ: 3.85,
  });

  const apronStaff = createOrangeApronStaffMesh();
  apronStaff.position.set(-5.38, 0.22, 2.45);
  apronStaff.rotation.y = -Math.PI / 2 - 0.25;
  group.add(apronStaff);

  const qiweiTex = createDahongpaoSevenFlavorsBannerTexture();
  const qiweiBanner = new THREE.Mesh(
    new THREE.PlaneGeometry(1.95, 0.66),
    new THREE.MeshStandardMaterial({ map: qiweiTex, roughness: 0.55 })
  );
  qiweiBanner.rotation.y = Math.PI / 2;
  qiweiBanner.position.set(-6.02, 2.38, -1.65);
  group.add(qiweiBanner);

  // ============================================================================
  // 9. DUAL STOREFRONT CANOPIES + HANGING ROUND RED LANTERN ("大紅袍")
  // ============================================================================
  const brownAwningMat = new THREE.MeshStandardMaterial({
    color: 0x3e2f26,
    roughness: 0.78,
    side: THREE.DoubleSide,
  });
  const rightAwning = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.08, 4.35), brownAwningMat);
  rightAwning.position.set(-4.95, 2.92, -1.98);
  rightAwning.rotation.z = -0.22;
  rightAwning.castShadow = true;
  const awningRoller = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 4.38, 10), steelMat);
  awningRoller.rotation.x = Math.PI / 2;
  awningRoller.position.set(-3.92, 2.68, -1.98);
  group.add(rightAwning, awningRoller);

  const agedCanopyMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5c0,
    transparent: true,
    opacity: 0.86,
    roughness: 0.55,
  });
  const leftCanopy = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.14, 4.05), agedCanopyMat);
  leftCanopy.position.set(-4.98, 3.05, 2.15);
  leftCanopy.rotation.z = -0.18;
  for (const vz of [0.25, 1.55, 2.85, 3.95]) {
    const valanceStrip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.16), paperBowlMat);
    valanceStrip.position.set(-4.02, 2.76, vz);
    group.add(valanceStrip);
  }
  group.add(leftCanopy);

  const lanternGroup = new THREE.Group();
  lanternGroup.position.set(-4.72, 2.78, -2.75);
  const lanternCord = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 6), darkMetalMat);
  lanternCord.position.y = -0.1;

  const dhpLanternTex = createDahongpaoLanternTexture();
  const dhpLanternMat = new THREE.MeshStandardMaterial({
    map: dhpLanternTex,
    emissive: new THREE.Color(0xff4500),
    emissiveMap: dhpLanternTex,
    emissiveIntensity: 0.75,
    roughness: 0.45,
  });
  emissiveSignMaterials.push(dhpLanternMat);

  const lanternSphere = new THREE.Mesh(new THREE.SphereGeometry(0.32, 18, 14), dhpLanternMat);
  lanternSphere.scale.set(1.05, 0.88, 1.05);
  lanternSphere.position.y = -0.36;
  lanternGroup.add(lanternCord, lanternSphere);
  group.add(lanternGroup);
  lanterns.push(lanternGroup);

  const extLight = new THREE.PointLight(0xffe4b5, 16, 18, 1.2);
  extLight.position.set(-4.4, 2.65, -1.5);
  group.add(extLight);
  shopLights.push(extLight);

  interactables.push({
    id: `shop-${shop.id}`,
    kind: 'shop',
    label: `向【${shop.name}（光華路26巷3號）】點餐`,
    position: new THREE.Vector3(-4.25, 1.25, -1.65),
    radius: 3.6,
    shop,
  });

  scene.add(group);
}

function createOrangeApronStaffMesh(): THREE.Group {
  const g = createStylizedPerson('#18181b', '#eab696', '#1c1917');
  const tieMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.7 });

  const apronShell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.215, 0.23, 0.56, 16, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.62, side: THREE.DoubleSide })
  );
  apronShell.scale.set(1.08, 1, 0.82);
  apronShell.position.set(0, 0.98, 0);

  const strapL = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.48, 0.03), tieMat);
  strapL.position.set(-0.09, 1.15, -0.175);
  strapL.rotation.z = -0.24;
  const strapR = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.48, 0.03), tieMat);
  strapR.position.set(0.09, 1.15, -0.175);
  strapR.rotation.z = 0.24;
  const bow = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.04), tieMat);
  bow.position.set(0, 0.95, -0.185);

  g.add(apronShell, strapL, strapR, bow);
  return g;
}

function createSeatedDinerMesh(
  shirtHex: string,
  skinHex: string,
  hairHex: string,
  stripedPolo: boolean
): THREE.Group {
  const g = new THREE.Group();
  let shirtMat: THREE.MeshStandardMaterial;

  if (stripedPolo) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#475569';
    for (let y = 0; y < 256; y += 16) {
      ctx.fillRect(0, y, 256, 6);
    }
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(0, 0, 256, 28);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    shirtMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.72 });
  } else {
    shirtMat = new THREE.MeshStandardMaterial({ color: shirtHex, roughness: 0.65 });
  }

  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.82 });
  const skinMat = new THREE.MeshStandardMaterial({ color: skinHex, roughness: 0.62 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hairHex, roughness: 0.65 });

  for (const lx of [-0.11, 0.11]) {
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.082, 0.26, 8, 10), pantsMat);
    thigh.rotation.x = Math.PI / 2;
    thigh.position.set(lx, 0.52, 0.14);
    const calf = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.34, 8, 10), pantsMat);
    calf.position.set(lx, 0.26, 0.26);
    g.add(thigh, calf);
  }

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.38, 10, 16), shirtMat);
  torso.scale.set(1.14, 1, 0.8);
  torso.position.set(0, 0.92, 0.04);
  torso.rotation.x = 0.15;

  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.16, 0.08, 14),
    stripedPolo ? new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.7 }) : shirtMat
  );
  collar.position.set(0, 1.22, 0.08);
  collar.rotation.x = 0.15;

  for (const side of [-1, 1]) {
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.064, 0.2, 12), shirtMat);
    sleeve.position.set(side * 0.27, 1.04, 0.1);
    sleeve.rotation.x = -0.45;
    sleeve.rotation.z = side * -0.18;

    const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.058, 0.24, 8, 10), skinMat);
    forearm.position.set(side * 0.28, 0.88, 0.24);
    forearm.rotation.x = -1.1;
    forearm.rotation.z = side * 0.15;
    g.add(sleeve, forearm);
  }

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.088, 0.12, 12), skinMat);
  neck.position.set(0, 1.26, 0.09);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 16), skinMat);
  head.scale.set(0.96, 1.04, 0.96);
  head.position.set(0, 1.4, 0.11);

  const earL = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 8), skinMat);
  earL.position.set(-0.19, 1.39, 0.11);
  const earR = earL.clone();
  earR.position.x = 0.19;

  if (!stripedPolo) {
    const hairCrown = new THREE.Mesh(
      new THREE.SphereGeometry(0.212, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.64),
      hairMat
    );
    hairCrown.position.set(0, 1.42, 0.1);
    const hairNape = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.12, 8, 12), hairMat);
    hairNape.scale.set(1.15, 1, 0.65);
    hairNape.position.set(0, 1.36, 0.02);
    g.add(hairCrown, hairNape);
  }

  g.add(torso, collar, neck, head, earL, earR);
  return g;
}
