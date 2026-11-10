import * as THREE from 'three';
import { TilesRenderer } from '3d-tiles-renderer';
import {
  GLTFExtensionsPlugin,
  GoogleCloudAuthPlugin,
  ReorientationPlugin,
} from '3d-tiles-renderer/plugins';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { ShopConfig } from '../data/shops';
import { createSignTexture } from '../world/textures';
import {
  ResolvedPlace,
  ResolvedShopSpot,
  queryGroundElevation,
  resolveGuanghuaAlleyCenter,
  resolveGuanghuaShopSpots,
} from './googleMapsLoader';

export interface TilesShopMarker {
  shop: ShopConfig;
  spot: ResolvedShopSpot;
  group: THREE.Group;
  position: THREE.Vector3;
  snappedToGround: boolean;
}

export class Google3DTilesWorld {
  public tiles: TilesRenderer | null = null;
  public markersGroup = new THREE.Group();
  public markers: TilesShopMarker[] = [];
  public center: ResolvedPlace | null = null;
  public loadedFirstTile = false;

  private scene: THREE.Scene;
  private dracoLoader: DRACOLoader;
  private raycaster = new THREE.Raycaster();
  private downDir = new THREE.Vector3(0, -1, 0);
  private ambientBoost: THREE.AmbientLight;
  private onError: (msg: string) => void;
  private onReady: (originPos: THREE.Vector3) => void;

  constructor(
    scene: THREE.Scene,
    onReady: (originPos: THREE.Vector3) => void,
    onError: (msg: string) => void
  ) {
    this.scene = scene;
    this.onReady = onReady;
    this.onError = onError;

    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('./draco/');

    this.ambientBoost = new THREE.AmbientLight(0xffffff, 1.35);
    this.ambientBoost.visible = false;
    this.scene.add(this.ambientBoost);
    this.scene.add(this.markersGroup);
  }

  public async mount(apiKey: string, customCenter?: { lat: number; lng: number }): Promise<void> {
    this.disposeTiles();
    this.loadedFirstTile = false;

    let center: ResolvedPlace;
    if (customCenter) {
      center = {
        lat: customCenter.lat,
        lng: customCenter.lng,
        displayName: '指定座標',
        formattedAddress: `${customCenter.lat.toFixed(5)}, ${customCenter.lng.toFixed(5)}`,
      };
    } else {
      center = await resolveGuanghuaAlleyCenter(apiKey);
    }
    this.center = center;

    const elev = await queryGroundElevation(apiKey, center.lat, center.lng);
    const originHeight = typeof elev === 'number' ? elev : 415;

    const tiles = new TilesRenderer('https://tile.googleapis.com/v1/3dtiles/root.json');
    tiles.errorTarget = 5;
    tiles.loadSiblings = true;

    tiles.registerPlugin(
      new GoogleCloudAuthPlugin({
        apiToken: apiKey,
        autoRefreshToken: true,
      })
    );

    tiles.registerPlugin(
      new GLTFExtensionsPlugin({
        dracoLoader: this.dracoLoader,
      })
    );

    tiles.registerPlugin(
      new ReorientationPlugin({
        lat: (center.lat * Math.PI) / 180,
        lon: (center.lng * Math.PI) / 180,
        height: originHeight,
      })
    );

    tiles.addEventListener('load-error', (ev) => {
      const msg = ev.error?.message || '載入 Google 3D Tiles 失敗';
      if (msg.includes('403') || msg.includes('401') || msg.includes('Forbidden')) {
        this.onError(
          'Google Map Tiles API 存取被拒（403/401）：請確認你的 Key 已在 Google Cloud 啟用「Map Tiles API」並綁定計費帳號；若無此權限，請改用「Google 3D 實景地圖模式（支援免費 Demo Key）」！'
        );
      }
    });

    tiles.addEventListener('load-model', () => {
      if (!this.loadedFirstTile) {
        this.loadedFirstTile = true;
        const groundY = this.sampleGroundHeight(0, 0, 250) ?? 0;
        this.onReady(new THREE.Vector3(0, groundY + 1.7, 0));
      }
    });

    this.tiles = tiles;
    this.scene.add(tiles.group);
    this.ambientBoost.visible = true;

    // Resolve and spawn glowing interactive storefront beacons at real Google Maps positions
    const spots = await resolveGuanghuaShopSpots(apiKey, center);
    this.buildShopBeacons(spots, originHeight);
  }

  private buildShopBeacons(spots: ResolvedShopSpot[], originHeight: number): void {
    while (this.markersGroup.children.length > 0) {
      this.markersGroup.remove(this.markersGroup.children[0]);
    }
    this.markers = [];

    if (!this.tiles) return;

    const ecef = new THREE.Vector3();

    spots.forEach((spot) => {
      this.tiles!.ellipsoid.getCartographicToPosition(
        (spot.lat * Math.PI) / 180,
        (spot.lng * Math.PI) / 180,
        originHeight,
        ecef
      );
      ecef.applyMatrix4(this.tiles!.group.matrixWorld);

      const beaconGroup = new THREE.Group();
      beaconGroup.position.set(ecef.x, 0, ecef.z);

      // Vertical holographic pillar + crisp floating signboard
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 5.5, 12),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(spot.shop.themeColor),
          transparent: true,
          opacity: 0.72,
        })
      );
      pillar.position.y = 2.75;

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.1, 0.08, 8, 24),
        new THREE.MeshBasicMaterial({ color: 0xffd166 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.25;

      const signTex = createSignTexture(
        spot.shop.signText,
        '按 E 點餐',
        spot.shop.themeColor,
        spot.shop.accentColor
      );
      const signSprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: signTex, depthTest: false })
      );
      signSprite.scale.set(4.6, 1.45, 1);
      signSprite.position.y = 6.2;

      beaconGroup.add(pillar, ring, signSprite);
      this.markersGroup.add(beaconGroup);

      this.markers.push({
        shop: spot.shop,
        spot,
        group: beaconGroup,
        position: beaconGroup.position,
        snappedToGround: false,
      });
    });
  }

  public sampleGroundHeight(x: number, z: number, startY = 250): number | null {
    if (!this.tiles) return null;
    this.raycaster.set(new THREE.Vector3(x, startY, z), this.downDir);
    this.raycaster.near = 0.1;
    this.raycaster.far = 850;
    const hits = this.raycaster.intersectObject(this.tiles.group, true);
    if (hits.length > 0) {
      return hits[0].point.y;
    }
    return null;
  }

  public update(camera: THREE.Camera, renderer: THREE.WebGLRenderer, elapsed: number): void {
    if (!this.tiles) return;

    this.tiles.setCamera(camera);
    this.tiles.setResolutionFromRenderer(camera, renderer);
    this.tiles.update();

    // Gently snap markers to real 3D tile terrain surface as tiles finish streaming
    this.markers.forEach((m, idx) => {
      if (!m.snappedToGround && Math.floor(elapsed * 2 + idx) % 6 === 0) {
        const gy = this.sampleGroundHeight(m.position.x, m.position.z, 250);
        if (gy !== null) {
          m.position.y = gy;
          m.snappedToGround = true;
        }
      }
      const ring = m.group.children[1];
      if (ring) {
        ring.scale.setScalar(1 + Math.sin(elapsed * 3 + idx) * 0.12);
      }
    });
  }

  public getAttributionsText(): string {
    if (!this.tiles) return '';
    const attrs = this.tiles.getAttributions();
    const texts = attrs
      .filter((a) => a.type === 'string' && typeof a.value === 'string')
      .map((a) => String(a.value).trim())
      .filter(Boolean);
    return Array.from(new Set(texts)).join(' | ');
  }

  public setVisible(visible: boolean): void {
    if (this.tiles) {
      this.tiles.group.visible = visible;
    }
    this.markersGroup.visible = visible;
    this.ambientBoost.visible = visible;
  }

  public disposeTiles(): void {
    if (this.tiles) {
      this.scene.remove(this.tiles.group);
      this.tiles.dispose();
      this.tiles = null;
    }
    while (this.markersGroup.children.length > 0) {
      this.markersGroup.remove(this.markersGroup.children[0]);
    }
    this.markers = [];
    this.ambientBoost.visible = false;
  }
}
