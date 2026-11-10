export type HeldItemShape = 'bowl' | 'ricebowl' | 'friedbag' | 'drink';

export interface MenuItem {
  id: string;
  shopId: string;
  name: string;
  price: number;
  emoji: string;
  hunger: number;
  warmth: number;
  mood: number;
  spice?: number;
  coolsSpice?: boolean;
  heldShape: HeldItemShape;
  dishColor: string;
  accentColor: string;
  description: string;
  eatComment: string;
}

export interface ShopConfig {
  id: string;
  name: string;
  signText: string;
  verticalSignText: string;
  subtitle: string;
  tag: string;
  side: 'left' | 'right';
  z: number;
  themeColor: string;
  accentColor: string;
  style: 'noodle' | 'bento' | 'spicy' | 'donburi' | 'fried' | 'tea';
  bossName: string;
  bossQuote: string;
  menuLines: string[];
  hasFreeSoup?: {
    potName: string;
    soupName: string;
    warmth: number;
    hunger: number;
    comment: string;
  };
  items: MenuItem[];
}

export interface LandmarkInfo {
  id: string;
  title: string;
  hint: string;
  rewardText: string;
}

export interface TriviaQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  reward: number;
  explanation: string;
}

export const SHOPS: ShopConfig[] = [
  {
    id: 'beef-noodle',
    name: '大Q麵店・大陸牛肉拌麵',
    signText: '大Q麵店・牛肉拌麵',
    verticalSignText: '大Q牛肉拌麵',
    subtitle: '光華路26巷西段名店（鄰近媽媽樂早餐） ・ 強蒜香免費大骨湯',
    tag: '40年傳奇老店',
    side: 'left',
    z: 15.5,
    themeColor: '#a62621',
    accentColor: '#ffd166',
    style: 'noodle',
    bossName: '大Q拌麵阿姨',
    bossQuote: '「同學進來坐喔！大Q手工乾麵跟蒜香牛肉拌麵剛起鍋，大骨清湯在門口自己盛！」',
    menuLines: ['招牌蒜香牛肉拌麵 $110', '大Q手工雙拼乾麵 $125', '古早味肉絲拌麵   $95', '★ 大骨清湯免費喝 ★'],
    hasFreeSoup: {
      potName: '大骨清湯自助桶',
      soupName: '熱呼呼大骨清湯',
      warmth: 22,
      hunger: 8,
      comment: '喝下一碗滾燙大骨清湯，整個人從指尖暖到心底！不愧是華岡人的冬天救星！',
    },
    items: [
      {
        id: 'beef-banmian',
        shopId: 'beef-noodle',
        name: '招牌蒜香牛肉拌麵',
        price: 110,
        emoji: '🍜',
        hunger: 42,
        warmth: 24,
        mood: 20,
        spice: 12,
        heldShape: 'bowl',
        dishColor: '#8d4925',
        accentColor: '#e9c46a',
        description: 'Q彈白麵拌入濃郁蒜泥、特製辣醬、豆干片與酸菜，遠在仇人坡就聞得到香味！',
        eatComment: '蒜香衝上天靈蓋！麵條超Q彈，配一口豆干和酸菜簡直魂牽夢縈！',
      },
      {
        id: 'combo-banmian',
        shopId: 'beef-noodle',
        name: '大Q手工雙拼拌麵',
        price: 125,
        emoji: '🥩',
        hunger: 52,
        warmth: 26,
        mood: 25,
        spice: 12,
        heldShape: 'bowl',
        dishColor: '#7a3b1e',
        accentColor: '#f4a261',
        description: '大Q麵店招牌拉麵加上厚切牛肉與滷肉絲雙重滿足，體育課後必吃補充！',
        eatComment: '肉量爆表！再盛一碗旁邊免費的大骨清湯，今天早八的疲憊都消散了！',
      },
      {
        id: 'pork-banmian',
        shopId: 'beef-noodle',
        name: '古早味肉絲拌麵',
        price: 95,
        emoji: '🥢',
        hunger: 38,
        warmth: 20,
        mood: 16,
        heldShape: 'bowl',
        dishColor: '#9e6234',
        accentColor: '#e9c46a',
        description: '不吃牛同學的首選，一樣保有靈魂蒜香醬汁與清脆酸菜。',
        eatComment: '醬汁鹹香剛好，簡單卻吃了四年都不會膩的味道！',
      },
    ],
  },
  {
    id: 'shanzihou-tea',
    name: 'COMEBUY 士林文化店・煎茶苑',
    signText: 'COMEBUY 文化店',
    verticalSignText: 'COMEBUY茶飲',
    subtitle: '光華路26巷 × 華岡路47巷2弄轉角地標 ・ 現萃海神與雙Q奶茶',
    tag: '現萃手搖地標',
    side: 'right',
    z: 15.5,
    themeColor: '#be185d',
    accentColor: '#fbcfe8',
    style: 'tea',
    bossName: 'COMEBUY 店員',
    bossQuote: '「歡迎光臨 COMEBUY 士林文化店！剛吃完大紅袍或牛肉拌麵嗎？來杯微冰海神奶茶或雙Q超解辣喔！」',
    menuLines: ['招牌雙Q奶茶2號  $65', '現萃海神蜂蜜奶茶 $60', '百香搖果樂       $60'],
    items: [
      {
        id: 'boba-milk',
        shopId: 'shanzihou-tea',
        name: '招牌雙Q奶茶 (波霸+粉條)',
        price: 65,
        emoji: '🧋',
        hunger: 18,
        warmth: 12,
        mood: 24,
        coolsSpice: true,
        heldShape: 'drink',
        dishColor: '#e7d3b5',
        accentColor: '#3b2416',
        description: 'COMEBUY 文化店必點！Q彈波霸加上晶瑩粉條與芋圓，瞬間撫平麻辣與疲勞！',
        eatComment: '雙Q口感太豐富了！濃郁奶香直接安撫了剛剛被蒜味與麻辣衝擊的味蕾！',
      },
      {
        id: 'cheese-tea',
        shopId: 'shanzihou-tea',
        name: '現萃海神蜂蜜煎茶',
        price: 60,
        emoji: '🍵',
        hunger: 12,
        warmth: 4,
        mood: 22,
        coolsSpice: true,
        heldShape: 'drink',
        dishColor: '#b7d79e',
        accentColor: '#fffdf7',
        description: '結合煎茶苑清香與日式煎茶烘焙蜜香，清爽回甘。',
        eatComment: '淡淡蜂蜜香與清爽煎茶味，跟陽明山的山嵐一樣讓人神清氣爽！',
      },
      {
        id: 'wintermelon-lemon',
        shopId: 'shanzihou-tea',
        name: '百香搖果樂',
        price: 60,
        emoji: '🍋',
        hunger: 14,
        warmth: 0,
        mood: 20,
        coolsSpice: true,
        heldShape: 'drink',
        dishColor: '#c98a3b',
        accentColor: '#fef08a',
        description: '酸甜百香果搭配椰果、愛玉與寒天晶球，吃完炸物或丼飯最解膩！',
        eatComment: '酸甜冰涼料超多！一口下去又可以再戰光華路下一攤！',
      },
    ],
  },
  {
    id: 'dahongpao',
    name: '大紅袍麵店（光華路26巷3號）',
    signText: '大紅袍麵店',
    verticalSignText: '大紅袍',
    subtitle: '光華路26巷中段川味名店 ・ 雙牛拌麵、紅油抄手與五倍辣挑戰',
    tag: '食在中國 味在四川',
    side: 'left',
    z: 0,
    themeColor: '#7f1d1d',
    accentColor: '#fca5a5',
    style: 'spicy',
    bossName: '大紅袍老闆',
    bossQuote: '「愛吃辣的看這邊！成都燃麵、紅油抄手現點現煮，裡面有冷氣跟座位可以進去坐喔！」',
    menuLines: ['招牌雙牛拌麵  $140', '紅油鮮肉抄手   $85', '五倍辣成都燃麵 $115', '怪味乾麵       $90'],
    items: [
      {
        id: 'double-beef',
        shopId: 'dahongpao',
        name: '招牌雙牛拌麵',
        price: 140,
        emoji: '🌶️',
        hunger: 48,
        warmth: 30,
        mood: 24,
        spice: 28,
        heldShape: 'bowl',
        dishColor: '#9b2226',
        accentColor: '#ee9b00',
        description: '牛肉燥加上厚實滷牛腱，拌入四川花椒紅油，香氣逼人！',
        eatComment: '牛腱燉得超嫩！花椒麻香在嘴裡散開，身體瞬間暖起來了！',
      },
      {
        id: 'red-oil-wonton',
        shopId: 'dahongpao',
        name: '紅油鮮肉抄手',
        price: 85,
        emoji: '🥟',
        hunger: 30,
        warmth: 24,
        mood: 18,
        spice: 24,
        heldShape: 'bowl',
        dishColor: '#bb3e03',
        accentColor: '#94d2bd',
        description: '滑嫩抄手泡在酸甜苦辣鹹香麻的四川紅油醬裡，口口過癮。',
        eatComment: '皮滑餡滿，紅油的微酸微麻超級涮嘴！',
      },
      {
        id: 'five-x-spicy',
        shopId: 'dahongpao',
        name: '傳說五倍辣成都燃麵',
        price: 115,
        emoji: '🔥',
        hunger: 40,
        warmth: 48,
        mood: 28,
        spice: 85,
        heldShape: 'bowl',
        dishColor: '#d00000',
        accentColor: '#ffb703',
        description: '文大吃辣勇者專屬！據說吃完就算陽明山寒流來也可以穿短袖！',
        eatComment: '哇啊啊！耳朵在冒煙！！陽明山十度冷風算什麼，我現在全身都是火！！',
      },
    ],
  },
  {
    id: 'thanksgiving',
    name: '感恩麵店（華岡路47巷2弄口）',
    signText: '感恩麵店',
    verticalSignText: '感恩麵店',
    subtitle: '華岡路47巷2弄中式麵食 ・ 豪邁烤肉蓋飯＋免費柴魚蔥花湯',
    tag: '月底省錢救星',
    side: 'right',
    z: 0,
    themeColor: '#d97706',
    accentColor: '#fffbeb',
    style: 'bento',
    bossName: '感恩老闆',
    bossQuote: '「下課啦？月底荷包緊沒關係，烤肉蓋飯飯幫你壓實一點，旁邊柴魚湯蔥花自己加！」',
    menuLines: ['招牌烤肉蓋飯   $95', '蒜泥白肉蓋飯   $95', '香濃麻醬乾麵   $60', '★ 柴魚清湯加蔥花 ★'],
    hasFreeSoup: {
      potName: '柴魚清湯保溫桶',
      soupName: '柴魚蔥花清湯',
      warmth: 20,
      hunger: 8,
      comment: '灑滿翠綠蔥花和薑絲的柴魚清湯，喝完陽明山的濕冷霧氣都退散了！',
    },
    items: [
      {
        id: 'bbq-rice',
        shopId: 'thanksgiving',
        name: '招牌烤肉蓋飯',
        price: 95,
        emoji: '🍛',
        hunger: 48,
        warmth: 22,
        mood: 22,
        heldShape: 'ricebowl',
        dishColor: '#b5632a',
        accentColor: '#6ab04c',
        description: '滿滿碳香烤肉片搭配入味豬耳朵與青菜，完全蓋住白飯的超高 CP 值神作！',
        eatComment: '烤肉醬汁拌飯超香！還有脆脆的豬耳朵配菜，95塊吃到撐真的太感恩了！',
      },
      {
        id: 'garlic-pork-rice',
        shopId: 'thanksgiving',
        name: '蒜泥白肉蓋飯',
        price: 95,
        emoji: '🥓',
        hunger: 45,
        warmth: 20,
        mood: 18,
        heldShape: 'ricebowl',
        dishColor: '#d89b72',
        accentColor: '#78b159',
        description: '滑嫩白肉淋上重本台式蒜蓉醬油膏，越吃越開胃。',
        eatComment: '蒜蓉醬油配白飯就是無敵！難怪每次下課都大排長龍！',
      },
      {
        id: 'sesame-noodle',
        shopId: 'thanksgiving',
        name: '銅板麻醬乾麵',
        price: 60,
        emoji: '🥣',
        hunger: 32,
        warmth: 16,
        mood: 14,
        heldShape: 'bowl',
        dishColor: '#c29258',
        accentColor: '#7fb069',
        description: '月底最後三天的救命稻草，香濃芝麻醬拌麵只要六十元！',
        eatComment: '月底吃這碗配兩碗免費柴魚湯，直接撐到領家教薪水！',
      },
    ],
  },
  {
    id: 'huagang-fried',
    name: '越福鄉越南料理・轉角元氣炸物',
    signText: '越福鄉・元氣炸雞',
    verticalSignText: '越福鄉河粉',
    subtitle: '光華路26巷東段人氣店 ・ 越式生牛肉河粉與酥脆大雞排',
    tag: '越式料理＆宵夜',
    side: 'left',
    z: -15.5,
    themeColor: '#b45309',
    accentColor: '#fde047',
    style: 'fried',
    bossName: '越福鄉＆炸物老闆',
    bossQuote: '「同學要吃熱騰騰的越式生牛肉河粉，還是剛起鍋的九層塔大雞排？加一點檸檬辣椒超開胃！」',
    menuLines: ['越福鄉生牛肉河粉 $120', '比臉大酥脆雞排   $85', '九層塔塩酥雞拼盤 $100'],
    items: [
      {
        id: 'giant-jipai',
        shopId: 'huagang-fried',
        name: '比臉大酥脆雞排',
        price: 85,
        emoji: '🍗',
        hunger: 38,
        warmth: 18,
        mood: 28,
        heldShape: 'friedbag',
        dishColor: '#d97706',
        accentColor: '#fef08a',
        description: '裹上古早味地瓜粉酥炸，撒滿胡椒鹽，走回宿舍路上整條街都聞得到！',
        eatComment: '卡滋卡滋！外皮超酥、裡面的雞汁還鎖住，果然宵夜吃雞排才叫大學生活！',
      },
      {
        id: 'basil-popcorn',
        shopId: 'huagang-fried',
        name: '越福鄉招牌生牛肉河粉',
        price: 120,
        emoji: '🍜',
        hunger: 46,
        warmth: 28,
        mood: 26,
        heldShape: 'bowl',
        dishColor: '#b45309',
        accentColor: '#4ade80',
        description: '大紅袍隔壁的人氣越南料理！鮮甜牛骨高湯沖熟粉嫩牛肉片，擠上新鮮檸檬與九層塔。',
        eatComment: '湯頭清甜回甘又帶檸檬香！滑順河粉配嫩牛肉片真的太道地了！',
      },
      {
        id: 'tempura-fries',
        shopId: 'huagang-fried',
        name: '越式脆皮烤肉法國麵包',
        price: 90,
        emoji: '🥖',
        hunger: 35,
        warmth: 14,
        mood: 22,
        heldShape: 'friedbag',
        dishColor: '#eab308',
        accentColor: '#fde68a',
        description: '烤到外酥內軟的越式法國麵包，夾入滿滿炭烤豬肉、醃蘿蔔絲與小黃瓜。',
        eatComment: '麵包咬下去超酥脆，酸甜蘿蔔絲配烤肉超清爽！',
      },
    ],
  },
  {
    id: 'akatori',
    name: '華美丼飯・好吃炒飯・The X Burger',
    signText: '華美丼飯・好吃炒飯',
    verticalSignText: '華美燒肉丼',
    subtitle: '光華路26巷 × 華岡路47巷人氣名店匯聚 ・ 炙燒牛五花丼與粒粒分明炒飯',
    tag: '人氣丼飯＆炒飯',
    side: 'right',
    z: -15.5,
    themeColor: '#3f2e21',
    accentColor: '#fdba74',
    style: 'donburi',
    bossName: '華美店長',
    bossQuote: '「歡迎光臨！不管是炙燒牛五花丼、大火快炒的好吃炒飯，還是美式厚牛堡這裡都吃得到！」',
    menuLines: ['華美炙燒牛五花丼 $145', '巷口大火鮭魚炒飯 $110', 'The X 厚切培根牛堡 $125'],
    items: [
      {
        id: 'aburi-beef-don',
        shopId: 'akatori',
        name: '華美炙燒牛五花丼',
        price: 145,
        emoji: '🥩',
        hunger: 50,
        warmth: 22,
        mood: 26,
        heldShape: 'ricebowl',
        dishColor: '#7c4727',
        accentColor: '#facc15',
        description: '噴槍炙燒出焦香牛五花，放上一顆誘人的半熟溫泉蛋。',
        eatComment: '把半熟蛋黃戳破流進焦香牛五花與米飯裡⋯⋯這就是考完期中的救贖啊！',
      },
      {
        id: 'karaage-don',
        shopId: 'akatori',
        name: '大火快炒黃金鮭魚炒飯',
        price: 110,
        emoji: '🍳',
        hunger: 48,
        warmth: 24,
        mood: 24,
        heldShape: 'ricebowl',
        dishColor: '#c97b32',
        accentColor: '#fde047',
        description: '華岡路47巷2弄名店必吃！大火爆炒出濃郁鑊氣，米飯粒粒分明金黃誘人。',
        eatComment: '鑊氣超足！每一口都吃得到蛋香與鮭魚香，份量超有誠意！',
      },
      {
        id: 'tamago-pork-don',
        shopId: 'akatori',
        name: 'The X 熔岩花生培根牛堡',
        price: 125,
        emoji: '🍔',
        hunger: 44,
        warmth: 20,
        mood: 24,
        heldShape: 'friedbag',
        dishColor: '#9c5a30',
        accentColor: '#fbbf24',
        description: '光華路26巷東側早午餐名店！手打多汁牛肉排淋上濃郁花生醬與焦脆培根。',
        eatComment: '花生醬配手打牛肉排鹹甜濃郁，咬下去肉汁直接爆出來！',
      },
    ],
  },
];

export const LANDMARKS: LandmarkInfo[] = [
  {
    id: 'enemy-slope',
    title: '仇人坡指標打卡',
    hint: '走到巷子入口（靠近文化校園側斜坡）查看路標',
    rewardText: '「只要跟曖昧對象走過仇人坡就會⋯⋯算了還是先去吃牛肉拌麵！」',
  },
  {
    id: 'fog-neon',
    title: '霧中燈箱奇景',
    hint: '在「陽明山大霧」天候下站在光華路26巷口欣賞紅燈箱',
    rewardText: '「文化學生經典視角：五步之外人畜不分，十步之外只見牛肉拌麵燈箱！」',
  },
  {
    id: 'free-soup-pro',
    title: '免費清湯雙料專家',
    hint: '同時喝過「牛肉拌麵大骨湯」與「感恩麵店柴魚湯」',
    rewardText: '「寒流來襲也不怕！兩鍋熱湯下肚，月底生活費省一半！」',
  },
  {
    id: 'five-x-hero',
    title: '大紅袍五倍辣勇者',
    hint: '點一份「傳說五倍辣燃麵」並吃下去！',
    rewardText: '「嘴唇腫得像香腸，但身體比穿羽絨衣還暖和！」',
  },
  {
    id: 'basin-nightview',
    title: '山仔后盆地夜景',
    hint: '一路走到巷尾的景觀平台，按 E 眺望台北盆地',
    rewardText: '「拿著剛買的雞排與珍奶看山腳萬家燈火，就是文化人專屬浪漫！」',
  },
  {
    id: 'wind-umbrella',
    title: '文化強風護傘戰士',
    hint: '在「文化強風」天候中撐起雨傘 (按 U)',
    rewardText: '「雨傘差點在風中開花！文化畢業生人人都有一雙抗十級陣風的鐵手！」',
  },
];

export const NPC_STUDENT_DIALOGUES: Array<{ speaker: string; lines: string[] }> = [
  {
    speaker: '新聞系學姐',
    lines: [
      '「剛從大忠館趕下來，外面風大到我剛剛傘差點翻過去！還好牛肉拌麵大骨湯免費喝！」',
      '「你知道嗎？光華路26巷這幾間老店，真的陪很多人從大一吃到畢業還回來懷念。」',
    ],
  },
  {
    speaker: '資工系大二生',
    lines: [
      '「月底只剩一百塊⋯⋯走吧去感恩麵店點碗麻醬麵配免費柴魚湯加滿滿蔥花！」',
      '「每次大霧一飄進巷子，整條光華路看起來都超像宮崎駿或賽博山城電影場景！」',
    ],
  },
  {
    speaker: '美術系同學',
    lines: [
      '「巷尾景觀台看下去的台北盆地夜景超美！買包華岡塩酥雞配珍珠鮮奶走過去剛剛好。」',
      '「我等一下要挑戰大紅袍五倍辣，如果我等下沒回來，幫我跟赤鳥家老闆說留一顆半熟蛋⋯⋯」',
    ],
  },
  {
    speaker: '剛爬完仇人坡的同學',
    lines: [
      '「呼⋯⋯呼⋯⋯文化斜坡走完腿好酸，但巷口蒜香味一飄過來我就復活了！」',
      '「建議按 [1] 或 [2] 切換成夜晚配大霧看看，紅燈籠跟招牌超有氣氛！」',
    ],
  },
];

export const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  {
    question: '在文化大學美食街「牛肉拌麵」點麵時，店門口最受學生歡迎的免費福利是什麼？',
    options: ['免費續麵三次', '免費無限暢飲大骨清湯', '免費送一顆溫泉蛋', '免費停車兩小時'],
    correctIndex: 1,
    reward: 150,
    explanation: '答對了！冷冷的陽明山配上一碗熱騰騰的免費大骨清湯，是文化人最暖胃的回憶！',
  },
  {
    question: '文化大學學生口中的「仇人坡」通常為什麼會有這個有趣的外號？',
    options: [
      '因為坡度又陡風又大，走上去狼狽到情侶容易吵架',
      '因為以前是武術社練拳的地方',
      '因為坡上只有賣苦瓜湯',
      '因為考試不及格才會被罰走那條路',
    ],
    correctIndex: 0,
    reward: 150,
    explanation: '沒錯！風大坡陡走起來氣喘吁吁，是每個華岡人的共同體驗！',
  },
  {
    question: '月底生活費見底時，光華路26巷哪一家店以大碗「烤肉蓋飯」與免費柴魚蔥花湯被稱為省錢救星？',
    options: ['感恩麵店', '台北101美食街', '士林藥燉排骨', '淡水阿給'],
    correctIndex: 0,
    reward: 150,
    explanation: '正確！「感恩麵店」便宜大碗又溫暖，真的讓人吃得滿心感恩！',
  },
  {
    question: '在文化大學遇到陽明山經典的「白牆大霧＋強風」時，撐傘最常發生什麼情況？',
    options: [
      '雨傘會自動飛去淡水',
      '傘面會被文化強風吹到直接開花翻面',
      '雨傘會結冰變成冰棒',
      '完全沒感覺，陽明山風很小',
    ],
    correctIndex: 1,
    reward: 150,
    explanation: '答對了！文化強風是出名的「雨傘殺手」，所以這遊戲裡撐傘遇到強風也會晃個不停喔！',
  },
];
