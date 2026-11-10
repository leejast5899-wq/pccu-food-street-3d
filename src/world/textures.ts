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
