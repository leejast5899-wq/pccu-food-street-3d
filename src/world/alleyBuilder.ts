import * as THREE from 'three';
import { SHOPS, ShopConfig } from '../data/shops';
import {
  createAsphaltTexture,
  createMenuBoardTexture,
  createSevenElevenSignTexture,
  createShopInteriorTexture,
  createSignTexture,
  createStreetSignTexture,
  createTileFacadeTexture,
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
  getGroundHeight: (z: number) => number;
}

export function getGroundHeight(z: number): number {
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

  // Shared materials
  const asphaltTex = createAsphaltTexture();
  const asphaltMat = new THREE.MeshStandardMaterial({
    map: asphaltTex,
    roughness: 0.85,
    metalness: 0.08,
  });

  const sidewalkMat = new THREE.MeshStandardMaterial({
    color: 0x6b7075,
    roughness: 0.9,
  });

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
    const isLeft = shop.side === 'left';
    const wallX = isLeft ? -8.4 : 8.4;
    const frontX = isLeft ? -6.3 : 6.3;
    const faceDir = isLeft ? 1 : -1;
    const palette = tilePalettes[idx % tilePalettes.length];
    const facadeTex = createTileFacadeTexture(palette[0], palette[1]);

    const shopGroup = new THREE.Group();
    shopGroup.position.set(0, 0, shop.z);

    // 3-story Taiwanese building block
    const bldgHeight = 10.5 + (idx % 2) * 1.4;
    const bldgGeo = new THREE.BoxGeometry(4.4, bldgHeight, 13.0);
    const bldgMat = new THREE.MeshStandardMaterial({ map: facadeTex, roughness: 0.88 });
    const bldgMesh = new THREE.Mesh(bldgGeo, bldgMat);
    bldgMesh.position.set(wallX, bldgHeight / 2, 0);
    bldgMesh.castShadow = true;
    bldgMesh.receiveShadow = true;
    shopGroup.add(bldgMesh);

    // Upper apartment windows + AC outdoor units
    for (let floor = 0; floor < 2; floor++) {
      const wy = 4.8 + floor * 3.1;
      for (let wz = -3.4; wz <= 3.4; wz += 3.4) {
        const lit = (idx + floor + Math.round(wz)) % 2 === 0;
        const winMat = new THREE.MeshStandardMaterial({
          color: lit ? 0xffe4a3 : 0x334155,
          emissive: new THREE.Color(lit ? 0xffbe55 : 0x0f172a),
          emissiveIntensity: lit ? 0.55 : 0.08,
          roughness: 0.25,
        });
        windowMaterials.push(winMat);
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.35, 1.65), winMat);
        win.position.set(wallX + faceDir * 2.21, wy, wz);
        shopGroup.add(win);
      }
      // Outdoor AC box
      const ac = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.6, 0.85),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 })
      );
      ac.position.set(wallX + faceDir * 2.45, wy - 0.5, 1.8);
      shopGroup.add(ac);
    }

    // Storefront awning / corrugated canopy
    const awningColor = new THREE.Color(shop.themeColor);
    const awningMat = new THREE.MeshStandardMaterial({
      color: awningColor,
      roughness: 0.65,
    });
    const awning = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.16, 11.4), awningMat);
    awning.position.set(frontX + faceDir * 0.85, 3.25, 0);
    awning.rotation.z = faceDir * -0.18;
    awning.castShadow = true;
    shopGroup.add(awning);

    // Glowing horizontal signboard
    const signTex = createSignTexture(shop.signText, shop.tag, shop.themeColor, shop.accentColor);
    const signMat = new THREE.MeshStandardMaterial({
      map: signTex,
      emissive: new THREE.Color(0xffffff),
      emissiveMap: signTex,
      emissiveIntensity: 0.45,
      roughness: 0.35,
    });
    emissiveSignMaterials.push(signMat);

    const signBox = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.35, 0.24), signMat);
    signBox.position.set(frontX + faceDir * 0.25, 3.9, 0);
    signBox.rotation.y = isLeft ? Math.PI / 2 : -Math.PI / 2;
    shopGroup.add(signBox);

    // Vertical projecting Taiwanese lightbox sign (直立招牌)
    const vTex = createVerticalSignTexture(shop.verticalSignText, shop.themeColor, shop.accentColor);
    const vMat = new THREE.MeshStandardMaterial({
      map: vTex,
      emissive: new THREE.Color(0xffffff),
      emissiveMap: vTex,
      emissiveIntensity: 0.55,
      roughness: 0.35,
    });
    emissiveSignMaterials.push(vMat);
    const vSign = new THREE.Mesh(new THREE.BoxGeometry(0.95, 2.7, 0.22), vMat);
    vSign.position.set(frontX + faceDir * 1.9, 4.9, 3.6);
    shopGroup.add(vSign);

    const vBracket = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.1, 0.1), metalMat);
    vBracket.position.set(frontX + faceDir * 1.0, 5.1, 3.6);
    shopGroup.add(vBracket);

    // Warm store interior recess & textured kitchen wall
    const interiorTex = createShopInteriorTexture(shop.signText, shop.style, shop.themeColor, shop.accentColor);
    const interiorGlowMat = new THREE.MeshStandardMaterial({
      map: interiorTex,
      emissive: new THREE.Color(0xfff0d4),
      emissiveMap: interiorTex,
      emissiveIntensity: 0.48,
      roughness: 0.65,
    });
    windowMaterials.push(interiorGlowMat);
    const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 3.0), interiorGlowMat);
    backdrop.position.set(wallX + faceDir * 2.22, 1.62, 0);
    backdrop.rotation.y = isLeft ? Math.PI / 2 : -Math.PI / 2;
    shopGroup.add(backdrop);

    // Service counter + counter-top props (bowls, pots, condiment jars, glass display)
    const counter = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.05, 4.8), steelMat);
    counter.position.set(frontX + faceDir * 0.35, 0.55, 0);
    counter.castShadow = true;
    counter.receiveShadow = true;
    shopGroup.add(counter);

    const glassCase = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.42, 1.8),
      new THREE.MeshStandardMaterial({
        color: 0xe0f2fe,
        transparent: true,
        opacity: 0.42,
        roughness: 0.15,
      })
    );
    glassCase.position.set(frontX + faceDir * 0.42, 1.28, -1.1);
    shopGroup.add(glassCase);

    for (let k = 0; k < 3; k++) {
      const prop = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.11, 0.14, 12),
        new THREE.MeshStandardMaterial({
          color: k === 0 ? 0xfef3c7 : shop.themeColor,
          roughness: 0.4,
        })
      );
      prop.position.set(frontX + faceDir * 0.4, 1.15, 0.6 + k * 0.65);
      shopGroup.add(prop);
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
    const sLight = new THREE.PointLight(0xffcf88, 16, 17, 1.25);
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
      const potStand = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.48, 0.85, 16), steelMat);
      potStand.position.set(frontX + faceDir * 0.9, 0.56, 3.2);
      const potLid = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.18, 16), metalMat);
      potLid.position.set(frontX + faceDir * 0.9, 1.02, 3.2);
      shopGroup.add(potStand, potLid);

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
    const stoolTop = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.08, 12), redStoolMat);
    stoolTop.position.set(stoolX, 0.54, tableZ);
    const stoolBase = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.4, 10), redStoolMat);
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

  // Main continuous building walls behind sidewalks
  colliders.push({ minX: -14, maxX: -6.35, minZ: -31, maxZ: 24.5 });
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

  // 5. Utility Poles, Overhead Sagging Cables & Swaying Red Lantern Strings
  const poleZList = [19, 6, -7, -21];
  poleZList.forEach((pz, i) => {
    const px = i % 2 === 0 ? -4.4 : 4.4;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 7.6, 8), metalMat);
    pole.position.set(px, 3.8, pz);
    scene.add(pole);

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
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirtHex, roughness: 0.75 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.85 });
  const skinMat = new THREE.MeshStandardMaterial({ color: skinHex, roughness: 0.7 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hatOrHairHex, roughness: 0.7 });

  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.75, 0.24), pantsMat);
  legs.position.y = 0.375;
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.68, 0.28), shirtMat);
  torso.position.y = 1.08;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.21, 12, 10), skinMat);
  head.position.y = 1.62;
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
  cap.position.y = 1.66;

  g.add(legs, torso, head, cap);
  return g;
}

function createScooterMesh(bodyColor: number): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.4, metalness: 0.25 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.7 });

  const fWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.14, 12), tireMat);
  fWheel.rotation.z = Math.PI / 2;
  fWheel.position.set(0, 0.24, 0.56);

  const bWheel = fWheel.clone();
  bWheel.position.set(0, 0.24, -0.56);

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.34, 1.3), bodyMat);
  chassis.position.set(0, 0.48, -0.05);

  const frontShield = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.72, 0.24), bodyMat);
  frontShield.position.set(0, 0.72, 0.45);
  frontShield.rotation.x = -0.18;

  const handlebar = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.08, 0.12), tireMat);
  handlebar.position.set(0, 1.08, 0.38);

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.68), seatMat);
  seat.position.set(0, 0.7, -0.25);

  const headlight = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xfef9c3, emissive: 0xfef08a, emissiveIntensity: 0.4 })
  );
  headlight.position.set(0, 0.85, 0.57);

  g.add(fWheel, bWheel, chassis, frontShield, handlebar, seat, headlight);
  return g;
}
