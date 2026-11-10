/**
 * 空拍底圖模式（Aerial Map Mode）店家定位資料
 *
 * 座標系統：正規化 X / Z 皆為 -50 ~ 50，對應空拍底圖 public/textures/aerial-map.jpg
 *   - 左上角 = (-50, -50)，右下角 = (+50, +50)
 *   - X 往右（東）遞增，Z 往下（南）遞增
 *
 * 微調方式：在遊戲中進入「🗺️ 空拍定位」模式並開啟「📍 編輯定位」，
 * 點擊地面即會在 Console 印出精確的 { x, z }，直接貼回下方對應店家即可。
 *
 * 明天補實拍照片：
 *   - facadeImage：3D 建築正面貼圖路徑，例如 'textures/stores/dahongpao-facade.jpg'（放在 public/ 底下）
 *   - streetPhotos：點擊店家後彈窗顯示的實拍照片路徑陣列
 *   - rotationY：null = 自動朝向所屬街道中心線；填入數字（弧度）可手動覆寫
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
  /** null = 自動朝向街道中心 */
  rotationY: number | null;
  /** 3D 建築正面貼圖（null = 尚未拍攝，使用彩色方塊 Placeholder） */
  facadeImage: string | null;
  /** 點擊店家後彈窗顯示的實拍照片 */
  streetPhotos: string[];
  /** 對應到步行街景模式 SHOPS 中的店家 id（可點餐），沒有則省略 */
  linkedShopId?: string;
}

export interface AerialStreet {
  id: AerialStreetId;
  name: string;
  /** 街道中心線（正規化座標），用於自動計算店面朝向 */
  centerline: Array<{ x: number; z: number }>;
}

/** 三條主要街道的中心線（依空拍底圖描繪，可用編輯定位模式微調） */
export const AERIAL_STREETS: AerialStreet[] = [
  {
    id: 'huagang-47',
    name: '華岡路47巷',
    centerline: [
      { x: -50, z: -15 },
      { x: -36, z: -24 },
      { x: -20, z: -31 },
      { x: -4, z: -39 },
      { x: 6, z: -44 },
      { x: 26, z: -48 },
      { x: 50, z: -52 },
    ],
  },
  {
    id: 'huagang-47-2',
    name: '華岡路47巷2弄',
    centerline: [
      { x: 6, z: -44 },
      { x: 10, z: -28 },
      { x: 14, z: -14 },
      { x: 18, z: 1 },
    ],
  },
  {
    id: 'guanghua-26',
    name: '光華路26巷',
    centerline: [
      { x: -50, z: 38 },
      { x: -30, z: 32 },
      { x: -12, z: 25 },
      { x: 4, z: 18 },
      { x: 18, z: 10 },
      { x: 32, z: 4 },
      { x: 50, z: -3 },
    ],
  },
];

const store = (
  id: string,
  name: string,
  street: AerialStreetId,
  x: number,
  z: number,
  side: AerialStoreSide,
  category: string,
  linkedShopId?: string
): AerialStore => ({
  id,
  name,
  street,
  side,
  category,
  position: { x, y: 0, z },
  rotationY: null,
  facadeImage: null,
  streetPhotos: [],
  ...(linkedShopId ? { linkedShopId } : {}),
});

export const AERIAL_STORES: AerialStore[] = [
  // 1. 華岡路47巷（北側橫向街道，由西向東斜上）
  store('dunhuang', '敦煌快餐', 'huagang-47', -45, -32, 'north', '便當'),
  store('huoyanyan', '火炎焱炭火專門', 'huagang-47', -38, -36, 'north', '燒肉便當'),
  store('teppan-bento', '鐵板便當', 'huagang-47', -30, -38, 'north', '便當'),
  store('8guo', '8鍋文大店', 'huagang-47', -40, -18, 'south', '火鍋'),
  store('huamei', '華美丼飯(原華美自助餐廳)', 'huagang-47', -24, -22, 'south', '快餐', 'akatori'),
  store('yuanyuanyuan', '元圓源', 'huagang-47', -22, -28, 'south', '餐飲'),
  store('vietnam-hall', '越南美食館', 'huagang-47', -12, -45, 'north', '越南料理'),
  store('711-daxue', '7-ELEVEN 大學門市', 'huagang-47', 18, -42, 'north', '便利商店'),
  store('pccu-sports', '文化體育用品社', 'huagang-47', 28, -46, 'north', '零售'),

  // 2. 華岡路47巷2弄（中央縱向連接巷，由北向南）
  store('haochi-friedrice', '好吃炒飯', 'huagang-47-2', 18, -25, 'east', '中式'),
  store('univ-foodcourt', '大學城餐飲美食館', 'huagang-47-2', 20, -20, 'east', '美食街'),
  store('ganen', '感恩麵店', 'huagang-47-2', 22, -12, 'east', '中式麵食', 'thanksgiving'),
  store('comebuy', 'COMEBUY 士林文化店', 'huagang-47-2', 25, -4, 'corner', '手搖飲', 'shanzihou-tea'),

  // 3. 光華路26巷（南側橫向街道，由西向東斜上）
  store('straight-a', 'Straight A Apple 教育商店', 'guanghua-26', -46, 25, 'west', '3C'),
  store('jiancha', '煎茶苑', 'guanghua-26', -22, 24, 'north', '手搖飲'),
  store('mamale', '媽媽樂早餐', 'guanghua-26', -18, 36, 'south', '早餐'),
  store('daq', '大Q麵店', 'guanghua-26', -14, 33, 'south', '中式麵食', 'beef-noodle'),
  store('711-wenxue', '7-ELEVEN 文學門市', 'guanghua-26', -10, 16, 'north', '便利商店'),
  store('dahongpao', '大紅袍麵店', 'guanghua-26', 1, 25, 'south', '麵食', 'dahongpao'),
  store('wensi', '文思文具行', 'guanghua-26', 6, 10, 'north', '文具'),
  store('yuefuxiang', '越福鄉越南料理', 'guanghua-26', 18, 16, 'south', '越南料理', 'huagang-fried'),
  store('the-x-burger', 'The X Burger', 'guanghua-26', 31, -6, 'north', '早餐'),
  store('corner-genki', '轉角元氣站', 'guanghua-26', 42, 2, 'south', '餐飲'),
  store('window-books', '/窗裡/ 有食.有書', 'guanghua-26', 44, 8, 'south', '複合式'),
];

/** 依分類給 Placeholder 方塊不同顏色 */
export const CATEGORY_COLORS: Record<string, string> = {
  便當: '#f59e0b',
  燒肉便當: '#ea580c',
  火鍋: '#dc2626',
  快餐: '#d97706',
  餐飲: '#a16207',
  越南料理: '#16a34a',
  便利商店: '#0ea5e9',
  零售: '#6366f1',
  中式: '#b91c1c',
  美食街: '#c026d3',
  中式麵食: '#be123c',
  麵食: '#7f1d1d',
  手搖飲: '#db2777',
  '3C': '#64748b',
  早餐: '#facc15',
  文具: '#2563eb',
  複合式: '#0d9488',
};
