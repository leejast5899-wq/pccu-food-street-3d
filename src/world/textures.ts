import * as THREE from 'three';

function makeCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  return { canvas, ctx };
}

function finalizeTexture(canvas: HTMLCanvasElement, repeatX = 1, repeatY = 1): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  if (repeatX !== 1 || repeatY !== 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.needsUpdate = true;
  return tex;
}

export function createSignTexture(title: string, subtitle: string, bgColor: string, accentColor: string): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(1024, 320);

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 1024, 320);
  grad.addColorStop(0, bgColor);
  grad.addColorStop(1, '#181414');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 320);

  // Taiwanese lightbox border frame
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 12;
  ctx.strokeRect(18, 18, 988, 284);

  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 3;
  ctx.strokeRect(32, 32, 960, 256);

  // Decorative side stamp
  ctx.fillStyle = accentColor;
  ctx.fillRect(58, 62, 18, 196);
  ctx.fillRect(948, 62, 18, 196);

  // Main Title
  ctx.fillStyle = '#fffdf7';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 108px "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif';
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 14;
  ctx.fillText(title, 512, 134);

  // Subtitle
  ctx.shadowBlur = 0;
  ctx.fillStyle = accentColor;
  ctx.font = '700 38px "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif';
  ctx.fillText(subtitle, 512, 232);

  return finalizeTexture(canvas);
}

export function createVerticalSignTexture(text: string, bgColor: string, accentColor: string): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(256, 768);
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 256, 768);

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 10;
  ctx.strokeRect(12, 12, 232, 744);

  const chars = Array.from(text);
  const startY = chars.length <= 4 ? 145 : 105;
  const stepY = chars.length <= 4 ? 145 : 112;

  ctx.fillStyle = '#fffdf8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${chars.length <= 4 ? 102 : 84}px "Noto Sans TC", "PingFang TC", sans-serif`;
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 8;

  chars.forEach((ch, idx) => {
    ctx.fillText(ch, 128, startY + idx * stepY);
  });

  return finalizeTexture(canvas);
}

export function createMenuBoardTexture(title: string, lines: string[], bgColor: string, accentColor: string): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(512, 640);
  ctx.fillStyle = '#1b1d24';
  ctx.fillRect(0, 0, 512, 640);

  // Header strip
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 512, 110);

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '800 42px "Noto Sans TC", "PingFang TC", sans-serif';
  ctx.fillText(`${title} 價目表`, 256, 56);

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 6;
  ctx.strokeRect(16, 128, 480, 492);

  ctx.textAlign = 'left';
  ctx.font = '700 34px "Noto Sans TC", "PingFang TC", sans-serif';
  lines.forEach((line, i) => {
    const y = 200 + i * 105;
    ctx.fillStyle = i === lines.length - 1 && line.includes('★') ? '#ffd166' : '#f5f2eb';
    ctx.fillText(line, 42, y);
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(42, y + 44, 428, 2);
  });

  return finalizeTexture(canvas);
}

export function createStreetSignTexture(mainText: string, subText: string, green = true): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(512, 220);
  ctx.fillStyle = green ? '#155e3b' : '#1d4ed8';
  ctx.fillRect(0, 0, 512, 220);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, 492, 200);

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 72px "Noto Sans TC", "PingFang TC", sans-serif';
  ctx.fillText(mainText, 256, 92);

  ctx.font = '700 34px "Noto Sans TC", "PingFang TC", sans-serif';
  ctx.fillStyle = '#fef08a';
  ctx.fillText(subText, 256, 168);

  return finalizeTexture(canvas);
}

export function createSevenElevenSignTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(768, 220);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 768, 220);

  // Iconic orange, green, red bands
  ctx.fillStyle = '#f97316';
  ctx.fillRect(0, 0, 768, 52);
  ctx.fillStyle = '#15803d';
  ctx.fillRect(0, 60, 768, 56);
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(0, 124, 768, 38);

  ctx.fillStyle = '#111827';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 46px "Noto Sans TC", sans-serif';
  ctx.fillText('7-ELEVEN 光華山仔后門市', 384, 190);

  return finalizeTexture(canvas);
}

export function createAsphaltTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(512, 1024);
  ctx.fillStyle = '#2d3138';
  ctx.fillRect(0, 0, 512, 1024);

  // Asphalt speckle grain
  for (let i = 0; i < 16000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 1024;
    const v = 35 + Math.floor(Math.random() * 34);
    ctx.fillStyle = `rgb(${v},${v + 2},${v + 5})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Red/white Taiwanese curb stripes on both sides
  const stripeLen = 64;
  for (let y = 0; y < 1024; y += stripeLen) {
    const isRed = Math.floor(y / stripeLen) % 2 === 0;
    ctx.fillStyle = isRed ? '#b91c1c' : '#cbd5e1';
    ctx.fillRect(8, y, 16, stripeLen);
    ctx.fillRect(488, y, 16, stripeLen);
  }

  // Subtle center worn track & drain grates
  ctx.fillStyle = 'rgba(20, 22, 27, 0.35)';
  ctx.fillRect(150, 0, 70, 1024);
  ctx.fillRect(292, 0, 70, 1024);

  // Manhole cover
  ctx.beginPath();
  ctx.arc(256, 360, 26, 0, Math.PI * 2);
  ctx.fillStyle = '#475569';
  ctx.fill();
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 4;
  ctx.stroke();

  return finalizeTexture(canvas, 1, 6);
}

export function createTileFacadeTexture(baseHex: string, lineHex: string): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(256, 256);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = lineHex;
  ctx.lineWidth = 2;
  for (let y = 0; y < 256; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
    const offset = (y / 32) % 2 === 0 ? 0 : 32;
    for (let x = offset; x < 256; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 32);
      ctx.stroke();
    }
  }
  return finalizeTexture(canvas, 3, 2);
}

export function createShopInteriorTexture(
  title: string,
  style: 'noodle' | 'bento' | 'spicy' | 'donburi' | 'fried' | 'tea',
  themeColor: string,
  accentColor: string
): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(1024, 512);

  // Warm kitchen tile background
  const bg = style === 'donburi' ? '#2c221c' : style === 'tea' ? '#e6f4f1' : '#f3ead8';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1024, 512);

  // Subtle ceramic tile grid
  ctx.strokeStyle = style === 'donburi' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 2;
  for (let x = 0; x < 1024; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y < 512; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  // Stainless steel hood / kitchen shelf band
  ctx.fillStyle = style === 'donburi' ? '#4a3728' : '#cbd5e1';
  ctx.fillRect(0, 0, 1024, 92);
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.fillRect(0, 92, 1024, 10);

  // Hanging wall menu plaques
  const plaqueColors = [themeColor, '#b91c1c', '#15803d', '#b45309'];
  for (let i = 0; i < 4; i++) {
    const px = 120 + i * 110;
    ctx.fillStyle = plaqueColors[i % plaqueColors.length];
    ctx.fillRect(px, 128, 82, 150);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(px + 4, 132, 74, 142);
    ctx.fillStyle = '#fffdf7';
    ctx.textAlign = 'center';
    ctx.font = '800 28px "Noto Sans TC", sans-serif';
    const labels = ['招牌', '人氣', '加湯', '內用'];
    ctx.fillText(labels[i], px + 41, 205);
  }

  // Kitchen shelf & bottles/bowls silhouettes
  ctx.fillStyle = '#64748b';
  ctx.fillRect(590, 230, 360, 16);
  for (let b = 0; b < 6; b++) {
    ctx.fillStyle = b % 2 === 0 ? themeColor : '#eab308';
    ctx.fillRect(615 + b * 54, 175, 28, 55);
  }

  // Shop name poster on back wall
  ctx.fillStyle = themeColor;
  ctx.fillRect(600, 290, 340, 120);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 44px "Noto Sans TC", sans-serif';
  ctx.fillText(title, 770, 350);

  // Lower counter apron wainscoting
  ctx.fillStyle = 'rgba(15, 23, 42, 0.14)';
  ctx.fillRect(0, 420, 1024, 92);

  return finalizeTexture(canvas);
}

/**
 * 1:1 Authentic Texture for 大紅袍 Exterior Cooking Stall Front
 * Combines high-DPI procedural detailing + real photographic crops from exterior-source.jpg
 */
export function createDahongpaoCounterFrontTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(1024, 680);

  // Weathered white painted metal counter body
  ctx.fillStyle = '#e7e9ee';
  ctx.fillRect(0, 0, 1024, 680);

  // Subtle vertical panel seam & lower street grime
  ctx.fillStyle = 'rgba(15, 23, 42, 0.08)';
  ctx.fillRect(0, 610, 1024, 70);
  ctx.strokeStyle = 'rgba(71, 85, 105, 0.25)';
  ctx.lineWidth = 3;
  ctx.strokeRect(8, 8, 1008, 664);

  // Top center black gas-burner knob panel ("0 0 0")
  ctx.fillStyle = '#18181b';
  ctx.fillRect(390, 26, 224, 96);
  ctx.strokeStyle = '#71717a';
  ctx.lineWidth = 3;
  ctx.strokeRect(390, 26, 224, 96);

  for (let i = 0; i < 3; i++) {
    const cx = 434 + i * 68;
    const cy = 74;
    ctx.beginPath();
    ctx.arc(cx, cy, 24, 0, Math.PI * 2);
    ctx.fillStyle = '#a1a1aa';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, 17, 0, Math.PI * 2);
    ctx.fillStyle = '#09090b';
    ctx.fill();
    // Knob pointer bar
    ctx.fillStyle = '#e4e4e7';
    ctx.fillRect(cx - 2, cy - 15, 4, 14);
  }

  // Red banner frame for the 4-panel food photo poster
  const posterX = 36;
  const posterY = 142;
  const posterW = 952;
  const posterH = 472;

  ctx.fillStyle = '#a81c1c';
  ctx.fillRect(posterX, posterY, posterW, posterH);

  // Helper to draw each food panel before photo overlay loads
  const drawProceduralFoodPanels = () => {
    // Panel 1 (far left): Braised beef shank slices (滷牛腱切盤)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(50, 166, 210, 428);
    ctx.fillStyle = '#5c2415';
    ctx.beginPath();
    ctx.arc(155, 390, 88, 0, Math.PI * 2);
    ctx.fill();
    for (let s = 0; s < 7; s++) {
      ctx.fillStyle = s % 2 === 0 ? '#7c341e' : '#9a4728';
      ctx.beginPath();
      ctx.ellipse(135 + (s % 3) * 22, 345 + Math.floor(s / 3) * 42, 34, 22, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#15803d';
    ctx.font = '800 24px "Noto Sans TC", sans-serif';
    ctx.fillText('招牌滷味', 105, 206);

    // Panel 2 (mid-left): Red-oil wontons with bok choy (紅油抄手)
    ctx.fillStyle = '#fefce8';
    ctx.fillRect(272, 166, 205, 428);
    ctx.fillStyle = '#b91c1c';
    ctx.font = '900 28px "Noto Sans TC", serif';
    ctx.fillText('紅', 292, 210);
    ctx.fillText('油', 292, 245);
    ctx.fillText('抄', 292, 280);
    ctx.fillText('手', 292, 315);
    // Wontons & greens
    ctx.fillStyle = '#fde68a';
    for (let w = 0; w < 6; w++) {
      ctx.beginPath();
      ctx.arc(385 + (w % 2) * 34, 340 + Math.floor(w / 2) * 52, 26, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.ellipse(340, 455, 36, 58, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Panel 3 (mid-right): Spicy Sichuan dry beef noodles (雙牛拌麵)
    ctx.fillStyle = '#fff7ed';
    ctx.fillRect(606, 166, 182, 428);
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.ellipse(697, 385, 76, 130, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d97706';
    for (let n = 0; n < 8; n++) {
      ctx.fillRect(645, 285 + n * 24, 104, 10);
    }

    // Panel 4 (far right): Wonton & noodle soup with greens (鮮肉抄手麵)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(798, 166, 174, 428);
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.ellipse(885, 390, 72, 120, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(885, 430, 45, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawCenterCalligraphyStrip = () => {
    // Center vertical red strip: "大 紅 袍"
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(486, 152, 112, 452);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.strokeRect(492, 158, 100, 440);

    ctx.fillStyle = '#111827';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 76px "Kaiti TC", "STKaiti", "DFKai-SB", "Noto Serif TC", serif';
    ctx.fillText('大', 542, 245);
    ctx.fillText('紅', 542, 378);
    ctx.fillText('袍', 542, 510);
  };

  drawProceduralFoodPanels();
  drawCenterCalligraphyStrip();

  const tex = finalizeTexture(canvas);

  // Load real exterior photo crop and composite food panels onto counter banner
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    // In exterior-source.jpg (470x1024), the 4-panel food banner sits at x=238..400, y=515..715
    ctx.save();
    ctx.beginPath();
    ctx.rect(48, 162, 926, 436);
    ctx.clip();
    ctx.drawImage(img, 238, 520, 162, 192, 48, 162, 926, 436);
    ctx.restore();

    // Crisp panel dividers & center "大紅袍" vertical red calligraphy strip on top
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.strokeRect(48, 162, 926, 436);
    ctx.beginPath();
    ctx.moveTo(266, 162);
    ctx.lineTo(266, 598);
    ctx.moveTo(792, 162);
    ctx.lineTo(792, 598);
    ctx.stroke();

    drawCenterCalligraphyStrip();
    tex.needsUpdate = true;
  };
  img.src = `${import.meta.env.BASE_URL}textures/dahongpao/exterior-source.jpg`;

  return tex;
}

/**
 * 1:1 Authentic Texture for the Red Wall Banner behind 大紅袍 Counter:
 * 「人生七味：酸 甜 苦 辣 鹹 香 麻 ／ 食在中國 味在四川」
 */
export function createDahongpaoSevenFlavorsBannerTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(1024, 360);

  const grad = ctx.createLinearGradient(0, 0, 1024, 360);
  grad.addColorStop(0, '#b91c1c');
  grad.addColorStop(0.5, '#dc2626');
  grad.addColorStop(1, '#991b1b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 360);

  // Gold traditional auspicious corner borders (left & right vertical bands as seen in photo)
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 6;
  ctx.strokeRect(18, 18, 988, 324);

  // Decorative gold lattice strips on left & right sides
  ctx.fillStyle = '#facc15';
  for (let y = 28; y < 320; y += 36) {
    ctx.fillRect(28, y, 26, 22);
    ctx.fillRect(970, y, 26, 22);
  }

  // Top line: 人生七味：酸 甜 苦 辣 鹹 香 麻
  ctx.fillStyle = '#111827';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 52px "Kaiti TC", "STKaiti", "Noto Serif TC", "PingFang TC", serif';
  ctx.fillText('人生七味：酸 甜 苦 辣 鹹 香 麻', 512, 118);

  // Bottom line: 食在中國   味在四川
  ctx.font = '900 78px "Kaiti TC", "STKaiti", "Noto Serif TC", "PingFang TC", serif';
  ctx.fillText('食在中國    味在四川', 512, 245);

  return finalizeTexture(canvas);
}

/**
 * Round Red Cloth Lantern Texture for 大紅袍 ("大紅袍" calligraphy in black ink)
 */
export function createDahongpaoLanternTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(512, 256);

  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#991b1b');
  grad.addColorStop(0.5, '#dc2626');
  grad.addColorStop(1, '#7f1d1d');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  // Horizontal lantern wire ribs
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.lineWidth = 2;
  for (let y = 24; y < 256; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Gold top and bottom trim bands
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, 0, 512, 18);
  ctx.fillRect(0, 238, 512, 18);

  // Calligraphy "大紅袍" repeated on front/back of sphere wrap
  ctx.fillStyle = '#09090b';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 54px "Kaiti TC", "STKaiti", "Noto Serif TC", serif';
  [128, 384].forEach((x) => {
    ctx.fillText('大', x - 64, 128);
    ctx.fillText('紅', x, 128);
    ctx.fillText('袍', x + 64, 128);
  });

  return finalizeTexture(canvas);
}

/**
 * 1:1 Authentic Texture for the Left-Wall Red Circular Photo Menu Board inside 大紅袍
 * Matches media_1794311890300_7698646f.jpg:
 * Red background, "大紅袍 乾麵" top header, "味在四川" right vertical text,
 * and 2 rows x 5 columns of circular food photos with yellow vertical dish tags above each.
 */
export function createDahongpaoInteriorWallMenuTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(1024, 680);

  // Authentic Sichuan red board background
  ctx.fillStyle = '#9e2a25';
  ctx.fillRect(0, 0, 1024, 680);

  ctx.strokeStyle = '#f3ead8';
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, 1004, 660);

  // Top Header: "大 紅 袍   乾 麵"
  ctx.fillStyle = '#18181b';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 68px "Kaiti TC", "STKaiti", "Noto Serif TC", serif';
  ctx.fillText('大 紅 袍    乾 麵', 485, 68);

  // Right vertical calligraphy: "味 在 四 川"
  ctx.font = '900 52px "Kaiti TC", "STKaiti", "Noto Serif TC", serif';
  const rightChars = ['味', '在', '四', '川'];
  rightChars.forEach((ch, idx) => {
    ctx.fillText(ch, 948, 215 + idx * 105);
  });

  // 2 rows x 5 columns of circular food bowls + vertical yellow name tags
  const dishes = [
    { name: '雙牛拌麵', bowl: '#7f1d1d', garnish: '#16a34a' },
    { name: '紅油抄手', bowl: '#b91c1c', garnish: '#22c55e' },
    { name: '成都燃麵', bowl: '#991b1b', garnish: '#eab308' },
    { name: '牛肉乾麵', bowl: '#78350f', garnish: '#15803d' },
    { name: '擔擔乾麵', bowl: '#b45309', garnish: '#4ade80' },
    { name: '酸辣抄手', bowl: '#9a3412', garnish: '#22c55e' },
    { name: '椒麻雞絲', bowl: '#854d0e', garnish: '#16a34a' },
    { name: '怪味乾麵', bowl: '#7c2d12', garnish: '#facc15' },
    { name: '榨菜肉絲', bowl: '#a16207', garnish: '#15803d' },
    { name: '紅油水餃', bowl: '#b91c1c', garnish: '#4ade80' },
  ];

  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 5; col++) {
      const idx = row * 5 + col;
      const d = dishes[idx];
      const cx = 115 + col * 172;
      const cy = 285 + row * 265;

      // Yellow vertical dish label tag above the photo frame
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(cx - 24, cy - 155, 48, 72);
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - 24, cy - 155, 48, 72);

      ctx.fillStyle = '#7f1d1d';
      ctx.font = '800 17px "Noto Sans TC", sans-serif';
      const chars = Array.from(d.name);
      chars.forEach((ch, cIdx) => {
        ctx.fillText(ch, cx, cy - 142 + cIdx * 16);
      });

      // White square photo card
      ctx.fillStyle = '#f5f5f4';
      ctx.fillRect(cx - 64, cy - 72, 128, 144);
      ctx.strokeStyle = '#d6d3d1';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - 64, cy - 72, 128, 144);

      // Circular dark bowl rim
      ctx.beginPath();
      ctx.arc(cx, cy, 52, 0, Math.PI * 2);
      ctx.fillStyle = '#1c1917';
      ctx.fill();

      // Inner noodle/wonton filling
      ctx.beginPath();
      ctx.arc(cx, cy, 44, 0, Math.PI * 2);
      ctx.fillStyle = d.bowl;
      ctx.fill();

      // Noodle strands & greens highlight
      ctx.fillStyle = '#fcd34d';
      for (let s = -2; s <= 2; s++) {
        ctx.fillRect(cx - 26, cy + s * 9 - 2, 52, 4);
      }
      ctx.beginPath();
      ctx.arc(cx + 14, cy - 12, 14, 0, Math.PI * 2);
      ctx.fillStyle = d.garnish;
      ctx.fill();
    }
  }

  return finalizeTexture(canvas);
}

/**
 * 1:1 Authentic Texture for the "HERO! HITO! 冠軍之路 2026" Blue Baseball Calendar Poster
 * Draws directly from the uploaded interior photo (media_1794311890300_7698646f.jpg)!
 */
export function createDahongpaoBaseballCalendarTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(512, 880);

  // Fallback high-detail procedural rendering before image finishes loading
  const grad = ctx.createLinearGradient(0, 0, 0, 880);
  grad.addColorStop(0, '#1e3a8a');
  grad.addColorStop(0.45, '#1d4ed8');
  grad.addColorStop(1, '#172554');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 880);

  ctx.fillStyle = '#f8fafc';
  ctx.textAlign = 'center';
  ctx.font = '900 54px "Impact", "Noto Sans TC", sans-serif';
  ctx.fillText('HERO! HITO!', 256, 72);
  ctx.fillStyle = '#93c5fd';
  ctx.font = '900 72px "Noto Sans TC", sans-serif';
  ctx.fillText('冠軍之路', 256, 152);

  // Calendar grid (months 1-12) in lower half
  ctx.fillStyle = '#eff6ff';
  ctx.font = '700 22px monospace';
  for (let m = 0; m < 12; m++) {
    const col = m % 3;
    const row = Math.floor(m / 3);
    const mx = 96 + col * 160;
    const my = 470 + row * 95;
    ctx.fillText(`${m + 1}月`, mx, my);
    for (let r = 0; r < 4; r++) {
      ctx.fillRect(mx - 52, my + 14 + r * 12, 104, 4);
    }
  }

  const tex = finalizeTexture(canvas);

  // Overlay the exact cropped region from the user's real interior photo!
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    // In interior-source.jpg (850x1024), the poster is at x=149..294, y=224..480
    ctx.drawImage(img, 149, 224, 145, 256, 0, 0, 512, 880);
    tex.needsUpdate = true;
  };
  img.src = `${import.meta.env.BASE_URL}textures/dahongpao/interior-source.jpg`;

  return tex;
}

/**
 * White T-bar acoustic drop ceiling grid texture (輕鋼架天花板)
 */
export function createCeilingGridTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(512, 512);
  ctx.fillStyle = '#e5e5e0';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle acoustic gypsum speckle
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.25)';
    ctx.fillRect(x, y, 2, 2);
  }

  // T-bar metal grid lines
  ctx.strokeStyle = '#9ca3af';
  ctx.lineWidth = 6;
  for (let x = 0; x <= 512; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y <= 512; y += 128) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  return finalizeTexture(canvas, 3, 3);
}

/**
 * Terrazzo / stone tile floor inside Taiwanese noodle shop (磨石子地磚)
 */
export function createTerrazzoFloorTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(512, 512);
  ctx.fillStyle = '#9ca3af';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 6500; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const v = 115 + Math.floor(Math.random() * 65);
    ctx.fillStyle = `rgb(${v},${v + 2},${v})`;
    ctx.fillRect(x, y, 3, 3);
  }

  ctx.strokeStyle = 'rgba(55, 65, 81, 0.35)';
  ctx.lineWidth = 3;
  for (let i = 0; i <= 512; i += 128) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  return finalizeTexture(canvas, 3, 3);
}

/**
 * Blue-and-white soft plastic tissue pack texture (桌上抽取式衛生紙)
 */
export function createTissuePackTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(256, 160);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 256, 160);

  // Blue wave graphic on side of tissue pack
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(18, 22, 92, 116);
  ctx.fillStyle = '#60a5fa';
  ctx.beginPath();
  ctx.arc(110, 80, 48, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 24px sans-serif';
  ctx.fillText('Hello', 32, 86);

  return finalizeTexture(canvas);
}
