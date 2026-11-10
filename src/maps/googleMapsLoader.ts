import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { SHOPS, ShopConfig } from '../data/shops';

export interface ResolvedPlace {
  lat: number;
  lng: number;
  displayName: string;
  formattedAddress: string;
}

export interface ResolvedShopSpot {
  shop: ShopConfig;
  lat: number;
  lng: number;
  displayName: string;
  formattedAddress: string;
}

const STORAGE_KEY = 'pccu_gmaps_api_key';
const ATTRIBUTION_IDS = ['gmp_git_agentskills_v1'];

let configuredApiKey: string | null = null;
let cachedCenter: ResolvedPlace | null = null;
let cachedShops: ResolvedShopSpot[] | null = null;

export function getSavedGoogleMapsApiKey(): string {
  const envKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ?? '';
  if (envKey.trim()) return envKey.trim();
  try {
    return localStorage.getItem(STORAGE_KEY)?.trim() ?? '';
  } catch {
    return '';
  }
}

export function saveGoogleMapsApiKey(key: string): { changedAfterLoad: boolean } {
  const clean = key.trim();
  try {
    if (clean) {
      localStorage.setItem(STORAGE_KEY, clean);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota errors
  }
  const changedAfterLoad = Boolean(configuredApiKey && configuredApiKey !== clean);
  if (changedAfterLoad) {
    cachedCenter = null;
    cachedShops = null;
  }
  return { changedAfterLoad };
}

export async function ensureGoogleMapsLoaded(apiKey: string): Promise<void> {
  if (!apiKey.trim()) {
    throw new Error('請先填入有效的 Google Maps Platform API Key。');
  }

  if (!configuredApiKey) {
    setOptions({
      key: apiKey.trim(),
      v: 'weekly',
      language: 'zh-TW',
      region: 'TW',
    });
    configuredApiKey = apiKey.trim();
  }

  await importLibrary('core');
}

export async function resolveGuanghuaAlleyCenter(apiKey: string): Promise<ResolvedPlace> {
  if (cachedCenter) return cachedCenter;
  await ensureGoogleMapsLoaded(apiKey);

  // Try Places API (New) first
  try {
    const { Place } = await importLibrary('places');
    const { places } = await Place.searchByText({
      textQuery: '台北市士林區光華路26巷 中國文化大學',
      fields: ['displayName', 'location', 'formattedAddress'],
      language: 'zh-TW',
      region: 'TW',
      maxResultCount: 1,
      internalUsageAttributionIds: ATTRIBUTION_IDS,
    });

    const first = places[0];
    if (first?.location) {
      cachedCenter = {
        lat: first.location.lat(),
        lng: first.location.lng(),
        displayName: first.displayName ?? '光華路26巷',
        formattedAddress: first.formattedAddress ?? '台北市士林區光華路26巷',
      };
      return cachedCenter;
    }
  } catch {
    // Fallback to Geocoding API if Places API (New) isn't enabled on this key
  }

  const { Geocoder } = await importLibrary('geocoding');
  const geocoder = new Geocoder();
  const geoRes = await geocoder.geocode({
    address: '台北市士林區光華路26巷',
    region: 'TW',
  });
  const firstResult = geoRes.results[0];
  if (!firstResult?.geometry?.location) {
    throw new Error('無法透過 Google Maps 定位光華路26巷，請確認已啟用 Places API (New) 或 Geocoding API。');
  }

  cachedCenter = {
    lat: firstResult.geometry.location.lat(),
    lng: firstResult.geometry.location.lng(),
    displayName: '光華路26巷',
    formattedAddress: firstResult.formatted_address ?? '台北市士林區光華路26巷',
  };
  return cachedCenter;
}

const SHOP_QUERY_MAP: Record<string, string> = {
  'beef-noodle': '牛肉拌麵 光華路26巷 士林區',
  thanksgiving: '感恩麵店 光華路26巷 士林區',
  dahongpao: '大紅袍 光華路26巷 士林區',
  akatori: '赤鳥家 光華路26巷 士林區',
  'huagang-fried': '鹽酥雞 光華路26巷 士林區',
  'shanzihou-tea': '手搖飲料 光華路 士林區 文化大學',
};

export async function resolveGuanghuaShopSpots(
  apiKey: string,
  center: ResolvedPlace
): Promise<ResolvedShopSpot[]> {
  if (cachedShops) return cachedShops;
  await ensureGoogleMapsLoaded(apiKey);

  const resolved: ResolvedShopSpot[] = [];
  try {
    const { Place } = await importLibrary('places');

    const queries = SHOPS.map(async (shop, idx) => {
      const textQuery = SHOP_QUERY_MAP[shop.id] ?? `${shop.signText} 文化大學`;
      try {
        const { places } = await Place.searchByText({
          textQuery,
          fields: ['displayName', 'location', 'formattedAddress'],
          locationBias: { lat: center.lat, lng: center.lng },
          language: 'zh-TW',
          region: 'TW',
          maxResultCount: 1,
          internalUsageAttributionIds: ATTRIBUTION_IDS,
        });
        const hit = places[0];
        if (hit?.location) {
          return {
            shop,
            lat: hit.location.lat(),
            lng: hit.location.lng(),
            displayName: hit.displayName ?? shop.name,
            formattedAddress: hit.formattedAddress ?? '光華路26巷',
          };
        }
      } catch {
        // Individual search fallback below
      }

      // Place along the live Google-resolved alley axis if a specific stall wasn't indexed separately
      const offsetMeters = (idx - 2.5) * 14;
      const sideMeters = shop.side === 'left' ? -5.5 : 5.5;
      return {
        shop,
        lat: center.lat + offsetMeters / 111320,
        lng: center.lng + sideMeters / (111320 * Math.cos((center.lat * Math.PI) / 180)),
        displayName: shop.name,
        formattedAddress: center.formattedAddress,
      };
    });

    const list = await Promise.all(queries);
    resolved.push(...list);
  } catch {
    // Places API unavailable; place markers along the live Geocoded alley center
    SHOPS.forEach((shop, idx) => {
      const offsetMeters = (idx - 2.5) * 14;
      const sideMeters = shop.side === 'left' ? -5.5 : 5.5;
      resolved.push({
        shop,
        lat: center.lat + offsetMeters / 111320,
        lng: center.lng + sideMeters / (111320 * Math.cos((center.lat * Math.PI) / 180)),
        displayName: shop.name,
        formattedAddress: center.formattedAddress,
      });
    });
  }

  cachedShops = resolved;
  return resolved;
}

export async function queryGroundElevation(
  apiKey: string,
  lat: number,
  lng: number
): Promise<number | null> {
  try {
    await ensureGoogleMapsLoaded(apiKey);
    const { ElevationService } = await importLibrary('elevation');
    const svc = new ElevationService();
    const res = await svc.getElevationForLocations({ locations: [{ lat, lng }] });
    return res.results[0]?.elevation ?? null;
  } catch {
    return null;
  }
}
