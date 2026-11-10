/**
 * 空拍底圖與 3D 街區共用定位資料（Unified Aerial & 3D World Store Data）
 *
 * 座標系統：正規化 X / Z 皆為 -50 ~ 50，1:1 對應空拍底圖 public/textures/aerial-map.jpg
 *   - 左上角 = (-50, -50)，右下角 = (+50, +50)
 *   - X 往右（東）遞增，Z 往下（南）遞增
 *
 * 微調方式：在遊戲中開啟「🗺️ 空拍定位」→「📍 編輯定位」（或按 B 再按 K），
 * 點擊地面即會在 Console 印出精確的 { x, z }，直接修改下方 AERIAL_STORES 即可同步更新 3D 街景與空拍定位！
 */

export type AerialStreetId = 'huagang-47' | 'huagang-47-2' | 'guanghua-26';

export type AerialStoreSide = 'north' | 'south' | 'east' | 'west' | 'corner';

export interface AerialStore {
  id: string;
  name: string;
  street: AerialStreetId;
  side: AerialStoreSide;
  category: string;
  position: { x: number; y: number; z: number };
  /** 弧度；初始化時由街道中心線自動計算並寫入，亦可手動指定 */
  rotationY: number;
  /** 3D 建築正面實拍貼圖路徑（相對於 public/），null 則使用預設門面與招牌 */
  facadeImage: string | null;
  /** 點擊店家彈窗顯示的實拍照片路徑陣列（相對於 public/） */
  streetPhotos: string[];
  /** 對應 SHOPS 點餐系統的店家 ID */
  linkedShopId: string;
}

export interface AerialStreet {
  id: AerialStreetId;
  name: string;
  /** 街道中心線（正規化座標 -50 ~ 50），用於鋪設 3D 柏油道路與自動計算店面朝向 */
  centerline: Array<{ x: number; z: number }>;
  width: number;
}

/** 三條主要街道中心線（精確對齊 Google 空拍底圖道路） */
export const AERIAL_STREETS: AerialStreet[] = [
  {
    id: 'huagang-47',
    name: '華岡路47巷',
    width: 8.2,
    centerline: [
      { x: -49, z: -22 },
      { x: -36, z: -28 },
      { x: -20, z: -35 },
      { x: -4, z: -42 },
      { x: 9, z: -47 },
      { x: 24, z: -49 },
      { x: 40, z: -50 },
    ],
  },
  {
    id: 'huagang-47-2',
    name: '華岡路47巷2弄',
    width: 7.0,
    centerline: [
      { x: 9, z: -47 },
      { x: 12, z: -30 },
      { x: 15, z: -16 },
      { x: 19, z: -2 },
      { x: 21, z: 5 },
    ],
  },
  {
    id: 'guanghua-26',
    name: '光華路26巷',
    width: 8.6,
    centerline: [
      { x: -42, z: 42 },
      { x: -26, z: 33 },
      { x: -12, z: 25 },
      { x: 2, z: 18 },
      { x: 15, z: 10 },
      { x: 21, z: 5 },
      { x: 34, z: -1 },
      { x: 48, z: -6 },
    ],
  },
];

/** 輔助連接道路（西側華岡路林蔭大道 ＆ 7-11文學門市旁中央連接巷） */
export const SECONDARY_ROADS: Array<{
  id: string;
  name: string;
  width: number;
  centerline: Array<{ x: number; z: number }>;
}> = [
  {
    id: 'huagang-rd-west',
    name: '華岡路（往校園／仇人坡）',
    width: 9.0,
    centerline: [
      { x: -49, z: -22 },
      { x: -45, z: 0 },
      { x: -41, z: 22 },
      { x: -37, z: 44 },
    ],
  },
  {
    id: 'wenxue-lane',
    name: '光華路26巷中段連接弄',
    width: 5.8,
    centerline: [
      { x: -20, z: -35 },
      { x: -16, z: -10 },
      { x: -12, z: 25 },
    ],
  },
];

/** 依店家與所屬街道中心線計算朝向街道的 rotationY（弧度） */
export function computeStoreFacingRotationY(x: number, z: number, streetId: AerialStreetId): number {
  const street = AERIAL_STREETS.find((s) => s.id === streetId);
  if (!street) return 0;
  const pts = street.centerline;
  let bestX = pts[0].x;
  let bestZ = pts[0].z;
  let bestDistSq = Infinity;

  for (let i = 0; i < pts.length - 1; i++) {
    const ax = pts[i].x;
    const az = pts[i].z;
    const bx = pts[i + 1].x;
    const bz = pts[i + 1].z;
    const abx = bx - ax;
    const abz = bz - az;
    const lenSq = abx * abx + abz * abz || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * abx + (z - az) * abz) / lenSq));
    const cx = ax + t * abx;
    const cz = az + t * abz;
    const dSq = (x - cx) * (x - cx) + (z - cz) * (z - cz);
    if (dSq < bestDistSq) {
      bestDistSq = dSq;
      bestX = cx;
      bestZ = cz;
    }
  }
  return Math.round(Math.atan2(bestX - x, bestZ - z) * 1000) / 1000;
}

function makeStore(
  id: string,
  name: string,
  street: AerialStreetId,
  x: number,
  z: number,
  side: AerialStoreSide,
  category: string,
  linkedShopId: string,
  facadeImage: string | null = null,
  streetPhotos: string[] = []
): AerialStore {
  return {
    id,
    name,
    street,
    side,
    category,
    position: { x, y: 0, z },
    rotationY: computeStoreFacingRotationY(x, z, street),
    facadeImage,
    streetPhotos,
    linkedShopId,
  };
}

export const AERIAL_STORES: AerialStore[] = [
  // ===========================================================================
  // 1. 華岡路47巷（北側橫向街道，由西向東斜上）
  // ===========================================================================
  makeStore('dunhuang', '敦煌快餐', 'huagang-47', -45, -32, 'north', '便當', 'dunhuang'),
  makeStore('huoyanyan', '火炎焱炭火專門', 'huagang-47', -38, -36, 'north', '燒肉便當', 'huoyanyan'),
  makeStore('teppan-bento', '鐵板便當', 'huagang-47', -30, -38, 'north', '便當', 'teppan-bento'),
  makeStore('8guo', '8鍋文大店', 'huagang-47', -40, -18, 'south', '火鍋', '8guo'),
  makeStore('huamei', '華美丼飯(原華美自助餐廳)', 'huagang-47', -24, -22, 'south', '快餐', 'akatori'),
  makeStore('yuanyuanyuan', '元圓源', 'huagang-47', -22, -28, 'south', '餐飲', 'yuanyuanyuan'),
  makeStore('vietnam-hall', '越南美食館', 'huagang-47', -12, -45, 'north', '越南料理', 'vietnam-hall'),
  makeStore('711-daxue', '7-ELEVEN 大學門市', 'huagang-47', 18, -42, 'north', '便利商店', '711-daxue'),
  makeStore('pccu-sports', '文化體育用品社', 'huagang-47', 28, -46, 'north', '零售', 'pccu-sports'),

  // ===========================================================================
  // 2. 華岡路47巷2弄（中央縱向連接巷，由北向南）
  // ===========================================================================
  makeStore('haochi-friedrice', '好吃炒飯', 'huagang-47-2', 18, -25, 'east', '中式', 'haochi-friedrice'),
  makeStore('univ-foodcourt', '大學城餐飲美食館', 'huagang-47-2', 20, -20, 'east', '美食街', 'univ-foodcourt'),
  makeStore('ganen', '感恩麵店', 'huagang-47-2', 22, -12, 'east', '中式麵食', 'thanksgiving'),
  makeStore('comebuy', 'COMEBUY 士林文化店', 'huagang-47-2', 25, -4, 'corner', '手搖飲', 'shanzihou-tea'),

  // ===========================================================================
  // 3. 光華路26巷（南側橫向街道，由西向東斜上）
  // ===========================================================================
  makeStore('straight-a', 'Straight A Apple 教育商店', 'guanghua-26', -46, 25, 'west', '3C', 'straight-a'),
  makeStore('jiancha', '煎茶苑', 'guanghua-26', -22, 24, 'north', '手搖飲', 'jiancha'),
  makeStore('mamale', '媽媽樂早餐', 'guanghua-26', -18, 36, 'south', '早餐', 'mamale'),
  makeStore('daq', '大Q麵店', 'guanghua-26', -14, 33, 'south', '中式麵食', 'beef-noodle'),
  makeStore('711-wenxue', '7-ELEVEN 文學門市', 'guanghua-26', -10, 16, 'north', '便利商店', '711-wenxue'),
  makeStore(
    'dahongpao',
    '大紅袍麵店',
    'guanghua-26',
    1,
    25,
    'south',
    '麵食',
    'dahongpao',
    'textures/dahongpao/exterior-source.jpg',
    ['textures/dahongpao/exterior-source.jpg', 'textures/dahongpao/interior-source.jpg']
  ),
  makeStore('wensi', '文思文具行', 'guanghua-26', 6, 10, 'north', '文具', 'wensi'),
  makeStore('yuefuxiang', '越福鄉越南料理', 'guanghua-26', 18, 16, 'south', '越南料理', 'huagang-fried'),
  makeStore('the-x-burger', 'The X Burger', 'guanghua-26', 31, -6, 'north', '早餐', 'the-x-burger'),
  makeStore('corner-genki', '轉角元氣站', 'guanghua-26', 42, 2, 'south', '餐飲', 'corner-genki'),
  makeStore('window-books', '/窗裡/ 有食.有書', 'guanghua-26', 44, 8, 'south', '複合式', 'window-books'),
];

/** 依分類給建築與標籤不同主題色 */
export const CATEGORY_COLORS: Record<string, string> = {
  便當: '#d97706',
  燒肉便當: '#ea580c',
  火鍋: '#dc2626',
  快餐: '#b45309',
  餐飲: '#a16207',
  越南料理: '#15803d',
  便利商店: '#0284c7',
  零售: '#4f46e5',
  中式: '#b91c1c',
  美食街: '#9333ea',
  中式麵食: '#be123c',
  麵食: '#7f1d1d',
  手搖飲: '#db2777',
  '3C': '#475569',
  早餐: '#ca8a04',
  文具: '#1d4ed8',
  複合式: '#0f766e',
};
