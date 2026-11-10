import { importLibrary } from '@googlemaps/js-api-loader';
import { ShopConfig } from '../data/shops';
import {
  ResolvedPlace,
  ResolvedShopSpot,
  ensureGoogleMapsLoaded,
  queryGroundElevation,
  resolveGuanghuaAlleyCenter,
  resolveGuanghuaShopSpots,
} from './googleMapsLoader';

export interface GoogleMap3DCallbacks {
  onSelectShop: (shop: ShopConfig, resolvedInfo: ResolvedShopSpot) => void;
  onStatus: (message: string) => void;
}

export class GoogleMap3DController {
  private container: HTMLElement;
  private callbacks: GoogleMap3DCallbacks;
  private mapEl: google.maps.maps3d.Map3DElement | null = null;
  private centerPlace: ResolvedPlace | null = null;
  private baseElevation = 415;

  constructor(container: HTMLElement, callbacks: GoogleMap3DCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
  }

  public async mount(apiKey: string): Promise<void> {
    this.callbacks.onStatus('正在透過 Google Maps Platform 載入 1:1 文化大學光華路26巷 3D 實景…');
    await ensureGoogleMapsLoaded(apiKey);

    const center = await resolveGuanghuaAlleyCenter(apiKey);
    this.centerPlace = center;

    const elev = await queryGroundElevation(apiKey, center.lat, center.lng);
    if (typeof elev === 'number') {
      this.baseElevation = elev;
    }

    const [{ Map3DElement, Marker3DInteractiveElement, AltitudeMode, MapMode }, { PinElement }] =
      await Promise.all([importLibrary('maps3d'), importLibrary('marker')]);

    const spots = await resolveGuanghuaShopSpots(apiKey, center);

    this.container.innerHTML = '';

    const mapEl = new Map3DElement({
      center: { lat: center.lat, lng: center.lng, altitude: this.baseElevation + 8 },
      range: 190,
      tilt: 64,
      heading: 340,
      mode: MapMode.HYBRID,
      internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
    });
    mapEl.style.width = '100%';
    mapEl.style.height = '100%';
    mapEl.style.display = 'block';

    // Interactive 3D markers for each food shop along Guanghua Lane 26
    spots.forEach((spot) => {
      const marker = new Marker3DInteractiveElement({
        position: { lat: spot.lat, lng: spot.lng, altitude: 18 },
        altitudeMode: AltitudeMode.RELATIVE_TO_GROUND,
        extruded: true,
        label: `${spot.shop.signText}`,
        title: `${spot.displayName} — 點擊看菜單`,
      });

      const pin = new PinElement({
        background: spot.shop.themeColor,
        borderColor: '#ffffff',
        glyphColor: '#ffffff',
        scale: 1.25,
      });
      marker.append(pin);

      marker.addEventListener('gmp-click', () => {
        this.flyToSpot(spot.lat, spot.lng, 68, 68);
        this.callbacks.onSelectShop(spot.shop, spot);
      });

      mapEl.append(marker);
    });

    this.container.appendChild(mapEl);
    this.mapEl = mapEl;
    this.callbacks.onStatus(
      `✅ 已連線 Google 1:1 3D 實景（${center.displayName}）！拖曳旋轉、滾輪縮放，點擊店家地標即可點餐！`
    );
  }

  public flyToAlleyStreet(): void {
    if (!this.mapEl || !this.centerPlace) return;
    this.mapEl.flyCameraTo({
      endCamera: {
        center: {
          lat: this.centerPlace.lat,
          lng: this.centerPlace.lng,
          altitude: this.baseElevation + 6,
        },
        range: 95,
        tilt: 72,
        heading: 345,
      },
      durationMillis: 1400,
    });
  }

  public flyToCampusOverview(): void {
    if (!this.mapEl || !this.centerPlace) return;
    this.mapEl.flyCameraTo({
      endCamera: {
        center: {
          lat: this.centerPlace.lat,
          lng: this.centerPlace.lng,
          altitude: this.baseElevation + 20,
        },
        range: 580,
        tilt: 55,
        heading: 25,
      },
      durationMillis: 1600,
    });
  }

  public flyToTaipeiBasin(): void {
    if (!this.mapEl || !this.centerPlace) return;
    this.mapEl.flyCameraTo({
      endCamera: {
        center: {
          lat: this.centerPlace.lat,
          lng: this.centerPlace.lng,
          altitude: this.baseElevation + 45,
        },
        range: 340,
        tilt: 82,
        heading: 205,
      },
      durationMillis: 1600,
    });
  }

  private flyToSpot(lat: number, lng: number, range: number, tilt: number): void {
    if (!this.mapEl) return;
    this.mapEl.flyCameraTo({
      endCamera: {
        center: { lat, lng, altitude: this.baseElevation + 8 },
        range,
        tilt,
        heading: 350,
      },
      durationMillis: 950,
    });
  }

  public unmount(): void {
    this.container.innerHTML = '';
    this.mapEl = null;
  }
}
