import * as THREE from 'three';
import { SHOPS, ShopConfig } from '../data/shops';
import {
  createArcadeTileTexture,
  createAsphaltBumpMap,
  createAsphaltRoughnessMap,
  createAsphaltTexture,
  createCeilingGridTexture,
  createCorrugatedMetalTexture,
  createDahongpaoBaseballCalendarTexture,
  createDahongpaoCounterFrontTexture,
  createDahongpaoInteriorWallMenuTexture,
  createDahongpaoLanternTexture,
  createDahongpaoSevenFlavorsBannerTexture,
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
}

export interface BuiltAlley {
  rootGroup: THREE.Group;
  colliders: AABB[];
  interactables: Interactable[];
  animated: AnimatedWorldRefs;
  getGroundHeight: (z: number, x?: number) => number;
}

export function getGroundHeight(z: number, x = 0): number {
  // Inside or stepping into 大紅袍 (3 光華路26巷, z = -4.2 to +4.2, left side x < -4.6)
  if (z >= -4.25 && z <= 4.25 && x < -4.6) {
    if (x < -5.55) return 0.22; // Elevated interior terrazzo floor
    return 0.12; // 2-step tiled entrance threshold
  }
  if (z <= 24) return 0;
  // Gentle "仇人坡" ramp rising toward the campus entrance
  const t = Math.min(12, z - 24);
  return t * 0.22;
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

  // 1. Main Alley Road (z = -30 to +24)
  const roadGeo = new THREE.PlaneGeometry(9.6, 56);
  const roadMesh = new THREE.Mesh(roadGeo, asphaltMat);
  roadMesh.rotation.x = -Math.PI / 2;
  roadMesh.position.set(0, 0.01, -3);
  roadMesh.receiveShadow = true;
  scene.add(roadMesh);

  // Sidewalk arcades on both sides
  const leftWalk = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.14, 56), sidewalkMat);
  leftWalk.position.set(-6.0, 0.07, -3);
  leftWalk.receiveShadow = true;
  scene.add(leftWalk);

  const rightWalk = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.14, 56), sidewalkMat);
  rightWalk.position.set(6.0, 0.07, -3);
  rightWalk.receiveShadow = true;
  scene.add(rightWalk);

  // 2. Campus Entrance "仇人坡" Ramp (z = 24 to 36)
  const rampLength = 12.2;
  const rampSlopeAngle = Math.atan2(2.64, 12);
  const rampGroup = new THREE.Group();
  const rampRoad = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.3, rampLength), asphaltMat);
  rampRoad.position.set(0, 1.18, 29.8);
  rampRoad.rotation.x = -rampSlopeAngle;
  rampRoad.receiveShadow = true;
  rampGroup.add(rampRoad);

  // Side walls flanking the entrance ramp
  const stoneWallMat = new THREE.MeshStandardMaterial({ color: 0x565d63, roughness: 0.92 });
  const rampWallL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.2, 12.5), stoneWallMat);
  rampWallL.position.set(-5.6, 1.5, 29.8);
  rampGroup.add(rampWallL);
  const rampWallR = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.2, 12.5), stoneWallMat);
  rampWallR.position.set(5.6, 1.5, 29.8);
  rampGroup.add(rampWallR);

  // Campus Archway / Street Sign Pole at Entrance (z = 24.5)
  const archGroup = new THREE.Group();
  const poleL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 5.2, 10), metalMat);
  poleL.position.set(-4.6, 2.6, 24.2);
  const poleR = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 5.2, 10), metalMat);
  poleR.position.set(4.6, 2.6, 24.2);
  const crossbar = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.24, 0.24), metalMat);
  crossbar.position.set(0, 5.0, 24.2);
  archGroup.add(poleL, poleR, crossbar);

  // Main Entrance Banner Sign
  const archSignTex = createSignTexture('光華路26巷 美食街', '文化大學華岡商圈 ・ 歡迎同學下課覓食', '#155e3b', '#fde047');
  const archSignMat = new THREE.MeshStandardMaterial({
    map: archSignTex,
    emissive: new THREE.Color(0xffffff),
    emissiveMap: archSignTex,
    emissiveIntensity: 0.45,
    roughness: 0.4,
  });
  emissiveSignMaterials.push(archSignMat);
  const archSign = new THREE.Mesh(new THREE.BoxGeometry(5.6, 1.5, 0.2), archSignMat);
  archSign.position.set(0, 4.95, 24.2);
  archGroup.add(archSign);

  // Blue/Green Taipei Street Signpost near Entrance (z = 23.4, x = 4.35)
  const streetSignTex = createStreetSignTexture('光華路26巷', '← 往 仇人坡 / 文化校區', true);
  const streetSignMat = new THREE.MeshStandardMaterial({ map: streetSignTex, roughness: 0.4 });
  const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.0, 8), steelMat);
  signPost.position.set(4.2, 1.5, 23.2);
  const signPlate = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.78, 0.08), streetSignMat);
  signPlate.position.set(4.2, 2.75, 23.2);
  signPlate.rotation.y = -0.35;
  archGroup.add(signPost, signPlate);
  scene.add(archGroup);
  scene.add(rampGroup);

  // Enemy slope landmark at top of ramp (z = 32)
  const slopeSignTex = createStreetSignTexture('仇人坡起點', '風大坡陡・牽好雨傘與曖昧對象', false);
  const slopeBoard = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 1.2, 0.16),
    new THREE.MeshStandardMaterial({ map: slopeSignTex, roughness: 0.45 })
  );
  slopeBoard.position.set(0, 3.7, 33.8);
  slopeBoard.rotation.y = Math.PI;
  scene.add(slopeBoard);

  const slopePoleL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8), steelMat);
  slopePoleL.position.set(-1.1, 2.6, 33.8);
  const slopePoleR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8), steelMat);
  slopePoleR.position.set(1.1, 2.6, 33.8);
  scene.add(slopePoleL, slopePoleR);

  interactables.push({
    id: 'landmark-enemy-slope',
    kind: 'landmark-slope',
    label: '查看「仇人坡」校園指標（打卡點）',
    position: new THREE.Vector3(0, 2.1, 32.2),
    radius: 3.4,
  });

  // 3. Build the 6 Iconic Shops along Left & Right Sidewalks
  const tilePalettes = [
    ['#d8d2c5', '#a39c8e'],
    ['#c8b8a6', '#948371'],
    ['#cbd5e1', '#94a3b8'],
    ['#d6c7b8', '#8c7a6b'],
  ];

  SHOPS.forEach((shop, idx) => {
    if (shop.id === 'dahongpao') {
      buildDahongpaoStoreAndInterior({
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
      });
      return;
    }

    const isLeft = shop.side === 'left';
    const wallX = isLeft ? -8.4 : 8.4;
    const frontX = isLeft ? -6.3 : 6.3;
    const faceDir = isLeft ? 1 : -1;
    const palette = tilePalettes[idx % tilePalettes.length];
    const facadeTex = createTileFacadeTexture(palette[0], palette[1]);

    const shopGroup = new THREE.Group();
    shopGroup.position.set(0, 0, shop.z);

    // Upper apartment building block (2F & 3F above ground-floor recessed shop)
    const upperHeight = 7.4 + (idx % 2) * 1.4;
    const bldgMat = new THREE.MeshStandardMaterial({
      map: facadeTex,
      bumpMap: sharedTileBumpTex,
      bumpScale: 0.024,
      roughness: 0.82,
    });
    const upperBldg = new THREE.Mesh(new THREE.BoxGeometry(4.4, upperHeight, 13.0), bldgMat);
    upperBldg.position.set(wallX, 3.2 + upperHeight / 2, 0);
    upperBldg.castShadow = true;
    upperBldg.receiveShadow = true;
    shopGroup.add(upperBldg);

    // Ground-floor side pillars & deep recessed kitchen shell (3D hollowed storefront instead of flat wall!)
    const pillarL = new THREE.Mesh(new THREE.BoxGeometry(4.4, 3.25, 2.3), bldgMat);
    pillarL.position.set(wallX, 1.62, -5.35);
    const pillarR = new THREE.Mesh(new THREE.BoxGeometry(4.4, 3.25, 2.3), bldgMat);
    pillarR.position.set(wallX, 1.62, 5.35);
    const backRecessWall = new THREE.Mesh(new THREE.BoxGeometry(1.8, 3.25, 8.4), bldgMat);
    backRecessWall.position.set(wallX - faceDir * 1.3, 1.62, 0);
    shopGroup.add(pillarL, pillarR, backRecessWall);

    // Taiwanese Corrugated Sheet-Metal Rooftop Addition (頂樓鐵皮加蓋 + 不鏽鋼水塔)
    const roofTopY = 3.2 + upperHeight;
    const roofAddMat = new THREE.MeshStandardMaterial({
      map: idx % 2 === 0 ? roofMetalTexGreen : roofMetalTexBlue,
      roughness: 0.62,
      metalness: 0.35,
    });
    const roofShack = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.35, 10.6), roofAddMat);
    roofShack.position.set(wallX - faceDir * 0.15, roofTopY + 1.15, 0);
    const roofOverhang = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.12, 11.4), roofAddMat);
    roofOverhang.position.set(wallX + faceDir * 0.1, roofTopY + 2.35, 0);
    roofOverhang.rotation.z = faceDir * -0.08;
    shopGroup.add(roofShack, roofOverhang);

    // Shiny Stainless Steel Rooftop Water Tower (頂樓不鏽鋼水塔)
    const waterTower = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 1.65, 16), steelMat);
    waterTower.position.set(wallX - faceDir * 0.6, roofTopY + 0.85, idx % 2 === 0 ? -4.8 : 4.8);
    const waterDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.68, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
      steelMat
    );
    waterDome.position.set(wallX - faceDir * 0.6, roofTopY + 1.67, idx % 2 === 0 ? -4.8 : 4.8);
    shopGroup.add(waterTower, waterDome);

    // Upper apartment windows + Taiwanese protruding security grilles (老式凸鐵窗) + AC outdoor units
    for (let floor = 0; floor < 2; floor++) {
      const wy = 4.8 + floor * 3.1;
      for (let wz = -3.4; wz <= 3.4; wz += 3.4) {
        const lit = (idx + floor + Math.round(wz)) % 2 === 0;
        const winMat = new THREE.MeshStandardMaterial({
          color: lit ? 0xffe4a3 : 0x334155,
          emissive: new THREE.Color(lit ? 0xffbe55 : 0x0f172a),
          emissiveIntensity: lit ? 0.55 : 0.08,
          roughness: 0.2,
          metalness: 0.15,
        });
        windowMaterials.push(winMat);
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.35, 1.65), winMat);
        win.position.set(wallX + faceDir * 2.21, wy, wz);
        shopGroup.add(win);

        // Window frame & iron security cage bars
        const cage = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.42, 1.72), metalMat);
        cage.position.set(wallX + faceDir * 2.28, wy, wz);
        cage.scale.set(1, 0.08, 1);
        const sill = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 1.78), metalMat);
        sill.position.set(wallX + faceDir * 2.3, wy - 0.68, wz);
        shopGroup.add(cage, sill);
      }
      // Outdoor AC compressor box + fan grille + mounting brackets
      const acGroup = new THREE.Group();
      acGroup.position.set(wallX + faceDir * 2.48, wy - 0.5, 1.8);
      const acBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.52, 0.62, 0.88),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.55, metalness: 0.2 })
      );
      const acFan = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.22, 0.54, 14),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 })
      );
      acFan.rotation.z = Math.PI / 2;
      acFan.position.set(0, 0, -0.14);
      acGroup.add(acBox, acFan);
      shopGroup.add(acGroup);
    }

    // Storefront awning / corrugated canopy + metal support struts
    const awningColor = new THREE.Color(shop.themeColor);
    const awningMat = new THREE.MeshStandardMaterial({
      color: awningColor,
      roughness: 0.58,
      metalness: 0.18,
    });
    const awning = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.14, 11.4), awningMat);
    awning.position.set(frontX + faceDir * 0.88, 3.25, 0);
    awning.rotation.z = faceDir * -0.18;
    awning.castShadow = true;
    shopGroup.add(awning);

    // Rolling metal shutter box (鐵捲門收合捲箱) under awning
    const shutterBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.38, 8.4),
      new THREE.MeshStandardMaterial({ map: shutterMetalTex, roughness: 0.5, metalness: 0.45 })
    );
    shutterBox.position.set(frontX - faceDir * 0.05, 2.98, 0);
    shopGroup.add(shutterBox);

    // Glowing horizontal signboard
    const signTex = createSignTexture(shop.signText, shop.tag, shop.themeColor, shop.accentColor);
    const signMat = new THREE.MeshStandardMaterial({
      map: signTex,
      emissive: new THREE.Color(0xffffff),
      emissiveMap: signTex,
      emissiveIntensity: 0.52,
      roughness: 0.28,
    });
    emissiveSignMaterials.push(signMat);

    const signBox = new THREE.Mesh(new THREE.BoxGeometry(5.4, 1.38, 0.26), signMat);
    signBox.position.set(frontX + faceDir * 0.28, 3.92, 0);
    signBox.rotation.y = isLeft ? Math.PI / 2 : -Math.PI / 2;
    shopGroup.add(signBox);

    // Vertical projecting Taiwanese lightbox sign (直立招牌)
    const vTex = createVerticalSignTexture(shop.verticalSignText, shop.themeColor, shop.accentColor);
    const vMat = new THREE.MeshStandardMaterial({
      map: vTex,
      emissive: new THREE.Color(0xffffff),
      emissiveMap: vTex,
      emissiveIntensity: 0.62,
      roughness: 0.28,
    });
    emissiveSignMaterials.push(vMat);
    const vSign = new THREE.Mesh(new THREE.BoxGeometry(0.98, 2.75, 0.24), vMat);
    vSign.position.set(frontX + faceDir * 1.92, 4.95, 3.6);
    shopGroup.add(vSign);

    const vBracket1 = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.09, 0.09), metalMat);
    vBracket1.position.set(frontX + faceDir * 1.0, 5.55, 3.6);
    const vBracket2 = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.09, 0.09), metalMat);
    vBracket2.position.set(frontX + faceDir * 1.0, 4.25, 3.6);
    shopGroup.add(vBracket1, vBracket2);

    // Deep 3D Recessed Store Interior (tiled back wall + ceiling fluorescent tube + range hood + indoor dining table!)
    const interiorTex = createShopInteriorTexture(shop.signText, shop.style, shop.themeColor, shop.accentColor);
    const interiorGlowMat = new THREE.MeshStandardMaterial({
      map: interiorTex,
      emissive: new THREE.Color(0xfff0d4),
      emissiveMap: interiorTex,
      emissiveIntensity: 0.22,
      roughness: 0.65,
    });
    windowMaterials.push(interiorGlowMat);
    const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 3.0), interiorGlowMat);
    backdrop.position.set(wallX - faceDir * 0.38, 1.62, 0);
    backdrop.rotation.y = isLeft ? Math.PI / 2 : -Math.PI / 2;
    shopGroup.add(backdrop);

    // Recessed shop floor & ceiling with glowing fluorescent light panel
    const recessFloor = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.16, 8.2),
      new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.7 })
    );
    recessFloor.position.set(frontX - faceDir * 1.05, 0.08, 0);
    const recessLightPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.05, 3.6),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: new THREE.Color(0xfffbeb),
        emissiveIntensity: 1.2,
      })
    );
    recessLightPanel.position.set(frontX - faceDir * 0.9, 3.02, 0);
    windowMaterials.push(recessLightPanel.material as THREE.MeshStandardMaterial);
    shopGroup.add(recessFloor, recessLightPanel);

    // Stainless Steel Kitchen Exhaust Hood (不鏽鋼抽油煙機) inside recess
    const rangeHood = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.55, 3.2), steelMat);
    rangeHood.position.set(frontX - faceDir * 1.55, 2.48, 0.5);
    shopGroup.add(rangeHood);

    // Indoor table & stools visible inside the recessed shop
    const inTable = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.06, 1.6),
      new THREE.MeshStandardMaterial({ color: 0xe5dcc5, roughness: 0.5 })
    );
    inTable.position.set(frontX - faceDir * 1.35, 0.82, -2.5);
    const inLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.72, 8), metalMat);
    inLeg.position.set(frontX - faceDir * 1.35, 0.45, -2.5);
    shopGroup.add(inTable, inLeg);

    // Service counter + Shop-Specific 3D Cooking Equipment & Displays!
    const counterMat =
      shop.style === 'donburi'
        ? new THREE.MeshStandardMaterial({ color: 0x4a3525, roughness: 0.72 })
        : shop.style === 'tea'
          ? new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.45 })
          : steelMat;
    const counter = new THREE.Mesh(new THREE.BoxGeometry(1.12, 1.05, 4.8), counterMat);
    counter.position.set(frontX + faceDir * 0.35, 0.55, 0);
    counter.castShadow = true;
    counter.receiveShadow = true;
    shopGroup.add(counter);

    if (shop.style === 'fried') {
      // 華岡塩酥雞: Angled Glass Ingredient Display Cabinet filled with 3D skewers, cutlets & red baskets!
      const displayFrame = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.68, 2.5), steelMat);
      displayFrame.position.set(frontX + faceDir * 0.42, 1.38, -0.6);
      const displayGlass = new THREE.Mesh(
        new THREE.BoxGeometry(0.72, 0.64, 2.46),
        new THREE.MeshStandardMaterial({
          color: 0xe0f2fe,
          transparent: true,
          opacity: 0.36,
          roughness: 0.08,
          metalness: 0.15,
        })
      );
      displayGlass.position.set(frontX + faceDir * 0.44, 1.4, -0.6);
      shopGroup.add(displayFrame, displayGlass);

      // 3D rows of golden fried snacks & skewers inside case + red plastic picking baskets
      const foodColors = [0xd97706, 0xfacc15, 0x991b1b, 0x16a34a, 0xfef08a];
      for (let f = 0; f < 5; f++) {
        const tray = new THREE.Mesh(
          new THREE.BoxGeometry(0.45, 0.1, 0.38),
          new THREE.MeshStandardMaterial({ color: foodColors[f], roughness: 0.55 })
        );
        tray.position.set(frontX + faceDir * 0.44, 1.25, -1.55 + f * 0.46);
        shopGroup.add(tray);
      }
      for (let b = 0; b < 2; b++) {
        const redBasket = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.32), redStoolMat);
        redBasket.position.set(frontX + faceDir * 0.48, 1.14, 1.15 + b * 0.45);
        shopGroup.add(redBasket);
      }
    } else if (shop.style === 'tea') {
      // 山仔后手搖飲: Automatic Cup Sealer Machine + 3 Insulated Stainless Tea Barrels
      const cupSealer = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.58, 0.38),
        new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.35, metalness: 0.3 })
      );
      cupSealer.position.set(frontX + faceDir * 0.42, 1.36, -1.2);
      shopGroup.add(cupSealer);

      const barrelColors = [0x78350f, 0x065f46, 0x1e293b];
      for (let t = 0; t < 3; t++) {
        const barrel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.22, 0.22, 0.56, 16),
          new THREE.MeshStandardMaterial({ color: barrelColors[t], roughness: 0.3, metalness: 0.55 })
        );
        barrel.position.set(frontX + faceDir * 0.32, 1.35, 0.2 + t * 0.68);
        shopGroup.add(barrel);
      }
    } else if (shop.style === 'donburi') {
      // 赤鳥家燒肉丼: Japanese Wooden Slat Facade + Burgundy Noren Curtain + Twin Red Chochin Lanterns
      const norenMat = new THREE.MeshStandardMaterial({
        color: 0x7f1d1d,
        roughness: 0.85,
        side: THREE.DoubleSide,
      });
      for (let n = 0; n < 4; n++) {
        const flap = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.68), norenMat);
        flap.rotation.y = isLeft ? Math.PI / 2 : -Math.PI / 2;
        flap.position.set(frontX + faceDir * 0.42, 2.55, -1.6 + n * 1.05);
        shopGroup.add(flap);
      }
    } else {
      // 牛肉拌麵 / 感恩麵店: Glass display case + boiling noodle vats + garlic/condiment jars + stacked bowls
      const glassCase = new THREE.Mesh(
        new THREE.BoxGeometry(0.48, 0.46, 1.85),
        new THREE.MeshStandardMaterial({
          color: 0xe0f2fe,
          transparent: true,
          opacity: 0.4,
          roughness: 0.1,
          metalness: 0.15,
        })
      );
      glassCase.position.set(frontX + faceDir * 0.42, 1.3, -1.1);
      shopGroup.add(glassCase);

      for (let k = 0; k < 4; k++) {
        const prop = new THREE.Mesh(
          new THREE.CylinderGeometry(0.15, 0.12, 0.18, 14),
          new THREE.MeshStandardMaterial({
            color: k === 0 ? 0xfef3c7 : k === 1 ? 0xd97706 : shop.themeColor,
            roughness: 0.35,
          })
        );
        prop.position.set(frontX + faceDir * 0.4, 1.16, 0.4 + k * 0.55);
        shopGroup.add(prop);
      }
    }

    colliders.push({
      minX: (isLeft ? frontX + 0.35 : frontX - 0.35) - 0.7,
      maxX: (isLeft ? frontX + 0.35 : frontX - 0.35) + 0.7,
      minZ: shop.z - 2.6,
      maxZ: shop.z + 2.6,
    });

    // Wall Menu Board next to counter
    const menuTex = createMenuBoardTexture(shop.signText, shop.menuLines, shop.themeColor, shop.accentColor);
    const menuBoard = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 2.0, 0.08),
      new THREE.MeshStandardMaterial({ map: menuTex, roughness: 0.45 })
    );
    menuBoard.position.set(frontX - faceDir * 0.05, 1.85, -3.5);
    menuBoard.rotation.y = isLeft ? Math.PI / 2 : -Math.PI / 2;
    shopGroup.add(menuBoard);

    // Shop PointLight illuminating the counter, sidewalk, and road
    const sLight = new THREE.PointLight(0xffcf88, 9, 15, 1.35);
    sLight.position.set(frontX + faceDir * 1.9, 2.75, 0);
    shopGroup.add(sLight);
    shopLights.push(sLight);

    // Boss NPC behind counter
    const boss = createStylizedPerson(shop.themeColor, '#f5d0b5', shop.style === 'donburi' ? '#1f2937' : '#f8fafc');
    boss.position.set(frontX - faceDir * 0.5, 0.14, 0);
    boss.rotation.y = isLeft ? Math.PI / 2 : -Math.PI / 2;
    shopGroup.add(boss);

    // Register main shop interaction
    interactables.push({
      id: `shop-${shop.id}`,
      kind: 'shop',
      label: `向【${shop.name}】點餐`,
      position: new THREE.Vector3(frontX + faceDir * 1.75, 1.2, shop.z),
      radius: 3.1,
      shop,
    });

    // Free Soup Pot if available (牛肉拌麵大骨湯 / 感恩麵店柴魚湯)
    if (shop.hasFreeSoup) {
      const potStand = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.48, 0.85, 18), steelMat);
      potStand.position.set(frontX + faceDir * 0.9, 0.56, 3.2);
      const potLid = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.18, 18), metalMat);
      potLid.position.set(frontX + faceDir * 0.9, 1.02, 3.2);
      const ladleHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.45, 8), steelMat);
      ladleHandle.position.set(frontX + faceDir * 0.9, 1.22, 3.25);
      ladleHandle.rotation.z = 0.35;
      shopGroup.add(potStand, potLid, ladleHandle);

      const potWorldX = frontX + faceDir * 0.9;
      const potWorldZ = shop.z + 3.2;
      steamEmitters.push({
        origin: new THREE.Vector3(potWorldX, 1.15, potWorldZ),
        spread: 0.25,
      });

      colliders.push({
        minX: potWorldX - 0.55,
        maxX: potWorldX + 0.55,
        minZ: potWorldZ - 0.55,
        maxZ: potWorldZ + 0.55,
      });

      interactables.push({
        id: `soup-${shop.id}`,
        kind: 'soup',
        label: `盛一碗免費【${shop.hasFreeSoup.soupName}】`,
        position: new THREE.Vector3(potWorldX + faceDir * 0.7, 1.1, potWorldZ),
        radius: 2.3,
        shop,
      });
    } else if (shop.style === 'fried' || shop.style === 'spicy') {
      // Cooking steam emitter for fryer / spicy pot
      steamEmitters.push({
        origin: new THREE.Vector3(frontX + faceDir * 0.4, 1.2, shop.z),
        spread: 0.35,
      });
    }

    // Outdoor folding table & 2 red plastic stools (坐下吃美食!)
    const tableZ = -3.4;
    const tableX = frontX + faceDir * 1.65;
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.06, 1.3), steelMat);
    tableTop.position.set(tableX, 0.82, tableZ);
    const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.7, 8), metalMat);
    tableLeg.position.set(tableX, 0.45, tableZ);
    shopGroup.add(tableTop, tableLeg);

    // Stool 1 (interactable seat)
    const stoolX = tableX + faceDir * 0.75;
    const stoolTop = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.08, 14), redStoolMat);
    stoolTop.position.set(stoolX, 0.54, tableZ);
    const stoolBase = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.4, 12), redStoolMat);
    stoolBase.position.set(stoolX, 0.3, tableZ);
    shopGroup.add(stoolTop, stoolBase);

    colliders.push({
      minX: tableX - 0.55,
      maxX: tableX + 0.55,
      minZ: shop.z + tableZ - 0.72,
      maxZ: shop.z + tableZ + 0.72,
    });

    interactables.push({
      id: `seat-${shop.id}`,
      kind: 'seat',
      label: `坐下休息 / 享用美食（${shop.signText}）`,
      position: new THREE.Vector3(stoolX, 0.95, shop.z + tableZ),
      radius: 2.0,
      seatLookAt: new THREE.Vector3(tableX, 1.0, shop.z + tableZ),
    });

    // Decorative swaying banner flag
    const flagGeo = new THREE.PlaneGeometry(0.65, 1.7, 4, 8);
    const flagMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(shop.themeColor),
      side: THREE.DoubleSide,
      roughness: 0.75,
    });
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(frontX + faceDir * 1.6, 2.25, 4.6);
    shopGroup.add(flag);
    flags.push(flag);

    scene.add(shopGroup);
  });

  // Main continuous building walls behind sidewalks (carved open at z = -4.25..4.25 for 大紅袍 walk-in interior!)
  colliders.push({ minX: -14, maxX: -6.35, minZ: -31, maxZ: -4.25 });
  colliders.push({ minX: -14, maxX: -6.35, minZ: 4.25, maxZ: 24.5 });
  colliders.push({ minX: 6.35, maxX: 14, minZ: -34, maxZ: 24.5 });
  // Entrance ramp side walls
  colliders.push({ minX: -10, maxX: -4.8, minZ: 23.5, maxZ: 36 });
  colliders.push({ minX: 4.8, maxX: 10, minZ: 23.5, maxZ: 36 });
  // Top of 仇人坡 boundary
  colliders.push({ minX: -10, maxX: 10, minZ: 33.8, maxZ: 37 });

  // 4. Parked Taiwanese Scooters along curb
  const scooterPositions: Array<{ x: number; z: number; rotY: number; color: number }> = [
    { x: -4.05, z: 21.0, rotY: 0.15, color: 0x1e293b },
    { x: -4.05, z: 7.4, rotY: -0.08, color: 0xdc2626 },
    { x: 4.05, z: 20.5, rotY: Math.PI - 0.12, color: 0x0f766e },
    { x: 4.05, z: -8.5, rotY: Math.PI + 0.1, color: 0xf8fafc },
    { x: -4.05, z: -22.2, rotY: 0.05, color: 0x475569 },
  ];
  scooterPositions.forEach((sc) => {
    const scooter = createScooterMesh(sc.color);
    scooter.position.set(sc.x, 0, sc.z);
    scooter.rotation.y = sc.rotY;
    scene.add(scooter);
    colliders.push({
      minX: sc.x - 0.55,
      maxX: sc.x + 0.55,
      minZ: sc.z - 0.95,
      maxZ: sc.z + 0.95,
    });
  });

  // 5. Taipower Utility Poles (台電電線桿 + 黃黑反光警示貼紙 + 桿上變壓器), Overhead Cables & Red Lantern Strings
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

  const poleZList = [19, 6, -7, -21];
  poleZList.forEach((pz, i) => {
    const px = i % 2 === 0 ? -4.4 : 4.4;
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.15, 7.8, 12),
      new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.78 })
    );
    pole.position.set(px, 3.9, pz);
    pole.castShadow = true;
    scene.add(pole);

    // Yellow-black reflective Taipower warning wrap at base of pole
    const wrap = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.152, 1.35, 12), hazardMat);
    wrap.position.set(px, 1.15, pz);
    scene.add(wrap);

    // Pole-mounted cylindrical transformer (台電桿上變壓器桶)
    const transformer = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.72, 12), steelMat);
    transformer.position.set(px, 5.45, pz + (i % 2 === 0 ? -0.28 : 0.28));
    scene.add(transformer);

    // Street lamp arm
    const lampArm = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.08), metalMat);
    const armDir = px < 0 ? 1 : -1;
    lampArm.position.set(px + armDir * 0.65, 6.8, pz);
    scene.add(lampArm);

    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xfff3cc,
      emissive: new THREE.Color(0xffb84d),
      emissiveIntensity: 0.8,
    });
    streetLampBulbs.push(bulbMat);
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.12, 0.25), bulbMat);
    bulb.position.set(px + armDir * 1.25, 6.72, pz);
    scene.add(bulb);

    const sLamp = new THREE.PointLight(0xffcf88, 22, 24, 1.2);
    sLamp.position.set(px + armDir * 1.25, 6.4, pz);
    scene.add(sLamp);
    streetLampLights.push(sLamp);
  });

  // Catenary power lines & lantern strings crossing the alley
  const lanternStringZ = [17, 7.5, -2, -11, -20];
  lanternStringZ.forEach((lz) => {
    // Sagging cable across alley
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-4.5, 5.2, lz),
      new THREE.Vector3(0, 4.45, lz),
      new THREE.Vector3(4.5, 5.2, lz)
    );
    const cableGeo = new THREE.TubeGeometry(curve, 12, 0.02, 5, false);
    const cable = new THREE.Mesh(cableGeo, metalMat);
    scene.add(cable);

    // 3 warm lanterns along the wire
    [-2.1, 0, 2.1].forEach((lx, k) => {
      const t = (lx + 4.5) / 9;
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
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), lanternMat);
      body.scale.set(1, 1.25, 1);
      body.position.y = -0.4;
      lGroup.add(cord, body);
      scene.add(lGroup);
      lanterns.push(lGroup);
    });
  });

  // 6. 7-ELEVEN Corner & "學長姐快閃問答 / 補貼板" (z = -28, x = 6.3)
  const sevenGroup = new THREE.Group();
  sevenGroup.position.set(6.5, 0, -28.5);
  const sevenBuilding = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 8.0, 9.5),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 })
  );
  sevenBuilding.position.set(1.9, 4.0, 0);
  sevenGroup.add(sevenBuilding);

  const sevenTex = createSevenElevenSignTexture();
  const sevenSignMat = new THREE.MeshStandardMaterial({
    map: sevenTex,
    emissive: new THREE.Color(0xffffff),
    emissiveMap: sevenTex,
    emissiveIntensity: 0.5,
  });
  emissiveSignMaterials.push(sevenSignMat);
  const sevenSign = new THREE.Mesh(new THREE.BoxGeometry(6.6, 1.35, 0.24), sevenSignMat);
  sevenSign.position.set(-0.35, 3.6, 0);
  sevenSign.rotation.y = -Math.PI / 2;
  sevenGroup.add(sevenSign);

  // Bright glass window
  const sevenGlassMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    emissive: new THREE.Color(0xbae6fd),
    emissiveIntensity: 0.55,
  });
  windowMaterials.push(sevenGlassMat);
  const sevenGlass = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.3, 6.2), sevenGlassMat);
  sevenGlass.position.set(-0.28, 1.35, 0);
  sevenGroup.add(sevenGlass);

  // ATM / Senior Noticeboard kiosk
  const kiosk = new THREE.Mesh(
    new THREE.BoxGeometry(0.65, 1.7, 0.9),
    new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4 })
  );
  kiosk.position.set(-0.7, 0.85, 2.2);
  sevenGroup.add(kiosk);

  const seniorNpc = createStylizedPerson('#1d4ed8', '#f5d0b5', '#fde047');
  seniorNpc.position.set(-1.3, 0.14, 0.4);
  seniorNpc.rotation.y = -Math.PI / 2;
  sevenGroup.add(seniorNpc);

  const sevenLight = new THREE.PointLight(0xe0f2fe, 18, 18, 1.25);
  sevenLight.position.set(-1.5, 2.8, 0);
  sevenGroup.add(sevenLight);
  shopLights.push(sevenLight);
  scene.add(sevenGroup);

  interactables.push({
    id: 'trivia-atm',
    kind: 'trivia',
    label: '找 7-11 門口的【熱心學長姐】接委託賺飯錢',
    position: new THREE.Vector3(5.0, 1.2, -28.1),
    radius: 3.0,
  });

  // 7. 山仔后台北盆地景觀平台 (z = -31 to -43)
  const deckGeo = new THREE.BoxGeometry(15.2, 0.3, 14);
  const deckMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.85 });
  const deck = new THREE.Mesh(deckGeo, deckMat);
  deck.position.set(0, -0.05, -37.2);
  deck.receiveShadow = true;
  scene.add(deck);

  // Lookout wooden bench
  const benchSeat = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.14, 0.65), woodMat);
  benchSeat.position.set(-3.2, 0.55, -40.5);
  const benchLegL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.55), metalMat);
  benchLegL.position.set(-4.3, 0.28, -40.5);
  const benchLegR = benchLegL.clone();
  benchLegR.position.x = -2.1;
  scene.add(benchSeat, benchLegL, benchLegR);

  // Guardrails along deck perimeter
  const railPostsX = [-7.2, -4.8, -2.4, 0, 2.4, 4.8, 7.2];
  railPostsX.forEach((rx) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.1, 8), steelMat);
    post.position.set(rx, 0.55, -43.5);
    scene.add(post);
  });
  const topRail = new THREE.Mesh(new THREE.BoxGeometry(14.6, 0.08, 0.08), steelMat);
  topRail.position.set(0, 1.08, -43.5);
  const midRail = new THREE.Mesh(new THREE.BoxGeometry(14.6, 0.05, 0.05), steelMat);
  midRail.position.set(0, 0.62, -43.5);
  scene.add(topRail, midRail);

  // Side railings for lookout
  const sideRailL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.1, 14), steelMat);
  sideRailL.position.set(-7.3, 0.55, -36.5);
  const sideRailR = sideRailL.clone();
  sideRailR.position.x = 7.3;
  scene.add(sideRailL, sideRailR);

  // Lookout plaque
  const viewTex = createStreetSignTexture('山仔后景觀台', '眺望台北盆地 & 台北101', false);
  const viewSign = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 0.9, 0.1),
    new THREE.MeshStandardMaterial({ map: viewTex, roughness: 0.4 })
  );
  viewSign.position.set(2.2, 1.15, -43.2);
  scene.add(viewSign);

  // Deck collision boundaries
  colliders.push({ minX: -9, maxX: 9, minZ: -46, maxZ: -43.1 });
  colliders.push({ minX: -9, maxX: -7.0, minZ: -44, maxZ: -30.5 });
  colliders.push({ minX: 7.0, maxX: 9, minZ: -44, maxZ: -33.5 });

  interactables.push({
    id: 'lookout-basin',
    kind: 'viewpoint',
    label: '在景觀台眺望【台北盆地夜景】',
    position: new THREE.Vector3(0.5, 1.2, -42.3),
    radius: 3.5,
  });

  interactables.push({
    id: 'seat-lookout',
    kind: 'seat',
    label: '坐上木椅看風景吃宵夜',
    position: new THREE.Vector3(-3.2, 0.95, -40.5),
    radius: 2.3,
    seatLookAt: new THREE.Vector3(-1.5, 1.4, -85),
  });

  // 8. Distant Yangmingshan Foothills + Stylized Taipei Basin Cityscape (z = -65 to -160)
  const cityLightsGroup = new THREE.Group();
  const mountainMat = new THREE.MeshStandardMaterial({ color: 0x1e352b, roughness: 0.95 });
  const valleyFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(420, 260),
    new THREE.MeshStandardMaterial({ color: 0x161b26, roughness: 0.98 })
  );
  valleyFloor.rotation.x = -Math.PI / 2;
  valleyFloor.position.set(0, -28, -145);
  scene.add(valleyFloor);

  // Flanking mountain hills
  const hillL = new THREE.Mesh(new THREE.ConeGeometry(42, 34, 7), mountainMat);
  hillL.position.set(-48, -12, -88);
  const hillR = new THREE.Mesh(new THREE.ConeGeometry(46, 36, 7), mountainMat);
  hillR.position.set(52, -11, -94);
  const farRange = new THREE.Mesh(new THREE.ConeGeometry(90, 42, 8), mountainMat);
  farRange.position.set(-15, -14, -220);
  scene.add(hillL, hillR, farRange);

  // Distant Taipei buildings + Taipei 101 silhouette
  const bldgColors = [0xffd166, 0x93c5fd, 0xfca5a5, 0xfef08a];
  for (let i = 0; i < 65; i++) {
    const bx = (Math.random() - 0.5) * 180;
    const bz = -72 - Math.random() * 115;
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

  // Stylized Taipei 101 landmark in distance
  const t101Group = new THREE.Group();
  t101Group.position.set(16, -28, -148);
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
  leftLegPivot.position.set(-0.11, 0.72, 0);
  const leftLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.48, 8, 12), pantsMat);
  leftLeg.position.y = -0.3;
  const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.09, 0.26), shoeMat);
  leftShoe.position.set(0, -0.62, 0.04);
  leftLegPivot.add(leftLeg, leftShoe);

  const rightLegPivot = new THREE.Group();
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
  leftArmPivot.position.set(-0.27, 1.3, 0);
  const leftSleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.18, 8, 10), shirtMat);
  leftSleeve.position.y = -0.1;
  const leftForearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.24, 8, 10), skinMat);
  leftForearm.position.y = -0.28;
  leftArmPivot.add(leftSleeve, leftForearm);

  const rightArmPivot = new THREE.Group();
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
  group.position.set(0, 0, shop.z); // z = 0

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
  for (let wz of [-2.2, 2.0]) {
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

  // Balanced Daylight-White Interior PointLights (independent of outdoor shopLightBoost so walls don't overexpose)
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
  // White Split AC Indoor Unit near ceiling (分離式冷氣室內機)
  const acUnit = new THREE.Mesh(
    new THREE.BoxGeometry(1.25, 0.36, 0.28),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 })
  );
  acUnit.position.set(-8.85, 2.72, -3.92);
  const acVent = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.05, 0.29), darkMetalMat);
  acVent.position.set(-8.85, 2.58, -3.91);
  group.add(acUnit, acVent);

  // Large Red Sichuan Menu Board ("大紅袍 乾麵 · 味在四川" with 2x5 circular food photos)
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
  // Partition behind the exterior cooking stall (x = -6.12, z = -4.05 to -0.85):
  // Exterior face (+x, behind chef) is white wall; Interior face (-x, dining room) is wooden plywood!
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

  // Tiled pillar on far right behind the cooking counter & fan (as seen in exterior photo)
  const rightTilePillar = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 2.95, 0.55),
    new THREE.MeshStandardMaterial({ map: upperFacadeTex, roughness: 0.75 })
  );
  rightTilePillar.position.set(-5.85, 1.62, -3.82);
  group.add(rightTilePillar);

  // "HERO! HITO! 冠軍之路 2026" Blue Baseball Calendar Poster on inside face of plywood (-x face)
  const calendarTex = createDahongpaoBaseballCalendarTexture();
  const calendarPoster = new THREE.Mesh(
    new THREE.PlaneGeometry(1.08, 1.56),
    new THREE.MeshStandardMaterial({ map: calendarTex, roughness: 0.5 })
  );
  calendarPoster.rotation.y = -Math.PI / 2;
  calendarPoster.position.set(-6.20, 1.98, -2.92);
  group.add(calendarPoster);

  // Stacked folded newspapers (舊報紙堆) + green "Fitness" box + cardboard boxes below calendar
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

  // Wide "KY-850" Brown Cardboard Boxes stacked against partition behind front table
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
    // White top header clamp band
    const clamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.09, 0.27),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.5 })
    );
    clamp.position.set(-6.08, 2.86, sz);
    group.add(clamp);

    // Translucent glossy vertical PVC strip
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.31, 2.52), pvcStripMat);
    strip.rotation.y = Math.PI / 2 + (s % 2 === 0 ? 0.03 : -0.03);
    strip.position.set(-6.08 + (s % 2) * 0.012, 1.58, sz);
    group.add(strip);
  }

  // ============================================================================
  // 5. NORTH WALL DETAILS (Wall-Mounted Fans + Wooden Utility Shelves + Condiments)
  // ============================================================================
  // 2 Wall-Mounted Oscillating Fans (壁掛式工業扇)
  for (const fx of [-7.65, -10.35]) {
    const fanGroup = new THREE.Group();
    fanGroup.position.set(fx, 2.42, 3.92);
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.25), steelMat);
    const cage = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.26, 0.12, 16),
      new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.4, metalness: 0.5, wireframe: false })
    );
    cage.rotation.x = Math.PI / 2 - 0.25;
    cage.position.set(0, -0.04, -0.18);
    fanGroup.add(bracket, cage);
    group.add(fanGroup);
  }

  // Wooden Utility Shelves along North Wall (右側木製置物架、調味料、紙箱與塑膠袋)
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
    // Long rectangular cream-topped table with black metal trim (spanning z = -2.85 to +1.05)
    const tableCenterZ = -0.9;
    const tableLenZ = 3.8;

    const blackRim = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.055, tableLenZ + 0.04), darkMetalMat);
    blackRim.position.set(tx, 0.94, tableCenterZ);
    const creamTop = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.06, tableLenZ), creamTableMat);
    creamTop.position.set(tx, 0.95, tableCenterZ);
    creamTop.receiveShadow = true;
    group.add(blackRim, creamTop);

    // Table legs
    for (const lz of [-2.55, -0.9, 0.75]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.72, 8), darkMetalMat);
      leg.position.set(tx, 0.58, lz);
      group.add(leg);
    }

    // Iconic Blue-and-White Soft Plastic Tissue Pack ("Hello 抽取式衛生紙") in center of each table
    const tissueZ = -1.05 + (rIdx - 1) * 0.08;
    const tissuePack = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.11, 0.24), tissuePackMat);
    tissuePack.position.set(tx, 1.035, tissueZ);
    // Pulled-up white tissue sheet sticking out of the top
    const tissueSheet = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.12), whiteTissueMat);
    tissueSheet.position.set(tx, 1.13, tissueZ);
    tissueSheet.rotation.y = 0.35;
    tissueSheet.rotation.z = 0.18;
    group.add(tissuePack, tissueSheet);

    // Round dark metal stools along both sides of the table
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

    // Table collider (leaving walkable aisle on the North/right side z = +1.15..+3.65 AND between tables)
    colliders.push({
      minX: tx - 0.42,
      maxX: tx + 0.42,
      minZ: -2.85,
      maxZ: 1.05,
    });
  });

  // Seated Diner 1 (Middle-row right side: Male student in crisp white shirt, seen from behind in photo!)
  const whiteShirtStudent = createSeatedDinerMesh('#f8fafc', '#f5d0b5', '#111827', false);
  whiteShirtStudent.position.set(-8.68, 0.22, 0.42);
  whiteShirtStudent.rotation.y = Math.PI / 2; // Facing +x (toward entrance/curtain)
  group.add(whiteShirtStudent);

  // Seated Diner 2 (Back-row left side: Older gentleman in blue/white striped polo shirt eating noodles!)
  const stripedPoloUncle = createSeatedDinerMesh('#cbd5e1', '#eab696', '#9ca3af', true);
  stripedPoloUncle.position.set(-10.58, 0.22, -1.65);
  stripedPoloUncle.rotation.y = Math.PI / 2; // Facing +x (leaning over back table)
  group.add(stripedPoloUncle);

  // Noodle bowls in front of both diners
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

  // Interactable Indoor Seat 1: Sit at the exact camera perspective of the user's interior photo!
  interactables.push({
    id: 'seat-dahongpao-photo-view',
    kind: 'seat',
    label: '坐進【大紅袍店內後排圓凳】（1:1 實景照片視角吹冷氣吃麵）',
    position: new THREE.Vector3(-11.72, 1.15, -0.45),
    radius: 2.3,
    seatLookAt: new THREE.Vector3(-5.8, 1.55, -0.45),
  });

  // Interactable Indoor Seat 2: Sit at the front table right inside the PVC strip curtain
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
  // Left-side 2-step ceramic-tiled entrance steps (z = +0.05 to +3.65, x = -4.65 to -5.85)
  const stepTileMat = new THREE.MeshStandardMaterial({ color: 0x9e9589, roughness: 0.8 });
  const step1 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.11, 3.5), stepTileMat);
  step1.position.set(-4.95, 0.055, 1.8);
  const step2 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.21, 3.5), stepTileMat);
  step2.position.set(-5.52, 0.105, 1.8);
  // Anti-slip black nosing strips on step edges
  const nosing1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 3.48), darkMetalMat);
  nosing1.position.set(-4.69, 0.11, 1.8);
  const nosing2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 3.48), darkMetalMat);
  nosing2.position.set(-5.21, 0.21, 1.8);
  group.add(step1, step2, nosing1, nosing2);

  // Right-side White Cooking Stall Counter (白色料理台, z = -3.65 to -0.15, x = -4.75 to -5.75)
  // Hollow concrete blocks base under counter (空心磚墊高底座)
  for (const bz of [-3.1, -1.9, -0.7]) {
    const cinderBlock = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.18, 0.42), weatheredConcreteMat);
    cinderBlock.position.set(-4.95, 0.12, bz);
    group.add(cinderBlock);
  }

  // Main white counter box with 4-panel food photo front texture ("000" knobs + "大紅袍" red strip)
  const counterFrontTex = createDahongpaoCounterFrontTexture();
  const whiteCounterMat = new THREE.MeshStandardMaterial({ color: 0xe7e9ee, roughness: 0.65 });
  const counterFrontMat = new THREE.MeshStandardMaterial({ map: counterFrontTex, roughness: 0.5 });

  const stallBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.96, 1.04, 3.35),
    [
      counterFrontMat, // +x (street-facing front with 4 food photos & 000 knobs!)
      whiteCounterMat, // -x
      whiteCounterMat, // +y
      whiteCounterMat, // -y
      whiteCounterMat, // +z (left side toward steps)
      whiteCounterMat, // -z (right side)
    ]
  );
  stallBody.position.set(-5.18, 0.72, -1.85);
  stallBody.castShadow = true;
  stallBody.receiveShadow = true;
  group.add(stallBody);

  // Distinctive Angled White Side Shield on left (+z) side of counter (白色斜角防風側擋板)
  const sideShieldLower = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.88, 0.08), whiteCounterMat);
  sideShieldLower.position.set(-5.18, 0.64, -0.16);
  const sideShieldUpper = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.42, 0.08), whiteCounterMat);
  sideShieldUpper.position.set(-5.32, 1.26, -0.16);
  sideShieldUpper.rotation.z = -0.35;
  group.add(sideShieldLower, sideShieldUpper);

  // Black Countertop Overhang (黑色料理台檯面)
  const blackCounterTop = new THREE.Mesh(
    new THREE.BoxGeometry(1.08, 0.06, 3.45),
    new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.35, metalness: 0.25 })
  );
  blackCounterTop.position.set(-5.16, 1.26, -1.88);
  group.add(blackCounterTop);

  // Countertop Props from Exterior Photo:
  // 1) 3 Tall stacks of white paper/plastic bowls on left (+z) end of counter
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

  // 2) Order pad & small upright menu stand in center of counter
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

  // 3) 2 White ceramic bowls in middle-right
  for (const bz of [-2.15, -2.48]) {
    const cBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.08, 0.11, 14), paperBowlMat);
    cBowl.position.set(-5.02, 1.34, bz);
    group.add(cBowl);
  }

  // 4) Small white oscillating desk fan on right (-z) end of counter (白色小電扇)
  const deskFanStand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.08, 0.28, 10), paperBowlMat);
  deskFanStand.position.set(-5.02, 1.42, -3.05);
  const deskFanHead = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.09, 14), paperBowlMat);
  deskFanHead.rotation.z = Math.PI / 2;
  deskFanHead.position.set(-5.02, 1.62, -3.05);
  group.add(deskFanStand, deskFanHead);

  // Collider for the exterior cooking stall + partition
  colliders.push({
    minX: -6.35,
    maxX: -4.55,
    minZ: -3.85,
    maxZ: -0.12,
  });

  // Chef in black short-sleeve T-shirt behind cooking counter (黑衣老闆)
  const chefNpc = createStylizedPerson('#18181b', '#eab696', '#111827');
  chefNpc.position.set(-5.72, 0.22, -1.45);
  chefNpc.rotation.y = Math.PI / 2;
  group.add(chefNpc);

  // Steam rising from noodle boiler behind the counter
  steamEmitters.push({
    origin: new THREE.Vector3(-5.35, 1.38, -1.85),
    spread: 0.35,
  });

  // ============================================================================
  // 8. LEFT PREP AREA (Stainless Fridge + Green Basket + Staff in Orange Apron)
  //    AND BACK WALL RED BANNER ("人生七味：酸甜苦辣鹹香麻 ／ 食在中國 味在四川")
  // ============================================================================
  // Stainless Steel Commercial Refrigerator (不鏽鋼冰箱) on left side (z = +2.35 to +3.75)
  const fridge = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.45, 1.25), steelMat);
  fridge.position.set(-5.78, 0.94, 3.05);
  // Green plastic colander/basket on top of fridge (綠色塑膠菜籃)
  const greenBasket = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.18, 0.56),
    new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.45 })
  );
  greenBasket.position.set(-5.75, 1.75, 2.95);
  // Orange-red prep bowl inside basket
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

  // Female Staff Member in Orange Apron with Black Cross-Ties on Back (橘色圍裙店員)
  const apronStaff = createOrangeApronStaffMesh();
  apronStaff.position.set(-5.38, 0.22, 2.45);
  apronStaff.rotation.y = -Math.PI / 2 - 0.25; // Facing inward toward prep counter, showing orange apron back tie!
  group.add(apronStaff);

  // Red Horizontal Wall Banner above cooking/prep area:
  // 「人生七味：酸 甜 苦 辣 鹹 香 麻 ／ 食在中國 味在四川」
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
  // Right Canopy (z = -4.15 to +0.15): Dark Brown Retractable Canvas Awning (深咖啡色伸縮遮雨棚)
  const brownAwningMat = new THREE.MeshStandardMaterial({
    color: 0x3e2f26,
    roughness: 0.78,
    side: THREE.DoubleSide,
  });
  const rightAwning = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.08, 4.35), brownAwningMat);
  rightAwning.position.set(-4.95, 2.92, -1.98);
  rightAwning.rotation.z = -0.22;
  rightAwning.castShadow = true;
  // Front roller tube bar
  const awningRoller = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 4.38, 10), steelMat);
  awningRoller.rotation.x = Math.PI / 2;
  awningRoller.position.set(-3.92, 2.68, -1.98);
  group.add(rightAwning, awningRoller);

  // Left Canopy (z = +0.15 to +4.15): Aged Translucent Corrugated Dome Canopy (半圓弧波浪採光罩)
  const agedCanopyMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5c0,
    transparent: true,
    opacity: 0.86,
    roughness: 0.55,
  });
  const leftCanopy = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.14, 4.05), agedCanopyMat);
  leftCanopy.position.set(-4.98, 3.05, 2.15);
  leftCanopy.rotation.z = -0.18;
  // White vertical valance strips hanging from front of left canopy
  for (const vz of [0.25, 1.55, 2.85, 3.95]) {
    const valanceStrip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.16), paperBowlMat);
    valanceStrip.position.set(-4.02, 2.76, vz);
    group.add(valanceStrip);
  }
  group.add(leftCanopy);

  // Traditional Round Red Cloth Lantern ("大紅袍") hanging under right side of brown awning
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

  // Exterior Warm Storefront Light above cooking counter
  const extLight = new THREE.PointLight(0xffe4b5, 16, 16, 1.2);
  extLight.position.set(-4.4, 2.65, -1.5);
  group.add(extLight);
  shopLights.push(extLight);

  // Main Shop Order Interaction at the White Cooking Counter
  interactables.push({
    id: `shop-${shop.id}`,
    kind: 'shop',
    label: `向【${shop.name}（光華路26巷3號）】點餐`,
    position: new THREE.Vector3(-4.25, 1.25, -1.65),
    radius: 3.3,
    shop,
  });

  scene.add(group);
}

/**
 * Helper: Creates the staff member wearing an orange apron tied in the back over a black shirt
 * as seen on the left steps of the exterior photo.
 */
function createOrangeApronStaffMesh(): THREE.Group {
  const g = createStylizedPerson('#18181b', '#eab696', '#1c1917');
  const apronMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.62 });
  const tieMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.7 });

  // Sculpted wrap-around orange apron shell
  const apronShell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.215, 0.23, 0.56, 16, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.62, side: THREE.DoubleSide })
  );
  apronShell.scale.set(1.08, 1, 0.82);
  apronShell.position.set(0, 0.98, 0);

  // Black cross-straps and bow tie on the back of the orange apron
  const strapL = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.48, 0.03), tieMat);
  strapL.position.set(-0.09, 1.15, -0.175);
  strapL.rotation.z = -0.24;
  const strapR = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.48, 0.03), tieMat);
  strapR.position.set(0.09, 1.15, -0.175);
  strapR.rotation.z = 0.24;
  const bow = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.04), tieMat);
  bow.position.set(0, 0.95, -0.185);

  g.add(apronShell, apronMat ? strapL : strapL, strapR, bow);
  return g;
}

/**
 * Helper: Creates a smooth, sculpted seated diner for the interior of 大紅袍
 */
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
    // Blue polo collar band
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

  // Seated capsule thighs & calves
  for (const lx of [-0.11, 0.11]) {
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.082, 0.26, 8, 10), pantsMat);
    thigh.rotation.x = Math.PI / 2;
    thigh.position.set(lx, 0.52, 0.14);
    const calf = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.34, 8, 10), pantsMat);
    calf.position.set(lx, 0.26, 0.26);
    g.add(thigh, calf);
  }

  // Sculpted rounded torso leaning slightly toward the noodle bowl
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

  // Rounded sleeves & forearms resting on table
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

  // Neck + Sculpted Head + Ears
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
    // Full dark hair + natural nape taper for the young male student in white shirt
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
