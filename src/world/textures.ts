import * as THREE from 'three';

function makeCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  return { canvas, ctx };
}

function finalizeTexture(canvas: HTMLCanvasElement, repeatX = 1, repeatY = 1, isDataMap = false): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = isDataMap ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  tex.anisotropy = 8;
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

  // Acrylic lightbox backlit radial + linear gradient
  const grad = ctx.createLinearGradient(0, 0, 1024, 320);
  grad.addColorStop(0, bgColor);
  grad.addColorStop(0.5, bgColor);
  grad.addColorStop(1, '#1a1212');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 320);

  // Internal fluorescent tube glow bands inside acrylic sign
  const tubeGlow = ctx.createLinearGradient(0, 40, 0, 280);
  tubeGlow.addColorStop(0, 'rgba(255,255,255,0.06)');
  tubeGlow.addColorStop(0.32, 'rgba(255,250,230,0.22)');
  tubeGlow.addColorStop(0.5, 'rgba(255,255,255,0.08)');
  tubeGlow.addColorStop(0.72, 'rgba(255,250,230,0.18)');
  tubeGlow.addColorStop(1, 'rgba(0,0,0,0.25)');
  ctx.fillStyle = tubeGlow;
  ctx.fillRect(0, 0, 1024, 320);

  // Outer metallic aluminum frame + corner bolts
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, 1010, 306);

  // Taiwanese lightbox border frame + Warm Marquee Bulb-Lit Perimeter Dots
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 10;
  ctx.strokeRect(22, 22, 980, 276);

  // Warm tungsten bulb-lit border dots (matching "written in bright warm bulb-lit signage")
  for (let bx = 46; bx <= 980; bx += 44) {
    for (const by of [22, 298]) {
      ctx.beginPath();
      ctx.arc(bx, by, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#fffbeb';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 10;
      ctx.fill();
    }
  }
  ctx.shadowBlur = 0;

  ctx.strokeStyle = 'rgba(255,255,255,0.34)';
  ctx.lineWidth = 3;
  ctx.strokeRect(36, 36, 952, 248);

  // Traditional seal stamp on left & phone/location badge on right
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(58, 60, 74, 198);
  ctx.strokeStyle = '#fde68a';
  ctx.lineWidth = 3;
  ctx.strokeRect(63, 65, 64, 188);
  ctx.fillStyle = '#fffdf7';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 30px "Kaiti TC", "STKaiti", "Noto Serif TC", serif';
  ['華', '岡', '名', '店'].forEach((ch, idx) => {
    ctx.fillText(ch, 95, 92 + idx * 44);
  });

  // Right decorative pillar
  ctx.fillStyle = accentColor;
  ctx.fillRect(928, 60, 22, 198);

  // Main Title with 3D outline stroke + drop shadow
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 112px "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif';
  ctx.shadowColor = 'rgba(0,0,0,0.72)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 5;
  ctx.lineWidth = 10;
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.strokeText(title, 526, 130);
  ctx.fillStyle = '#fffdf7';
  ctx.fillText(title, 526, 130);

  // Subtitle pill bar
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.fillRect(210, 204, 632, 54);
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(210, 204, 632, 54);

  ctx.fillStyle = accentColor;
  ctx.font = '800 36px "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif';
  ctx.fillText(`★ ${subtitle} ★`, 526, 232);

  return finalizeTexture(canvas);
}

export function createVerticalSignTexture(text: string, bgColor: string, accentColor: string): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(256, 768);
  const grad = ctx.createLinearGradient(0, 0, 256, 0);
  grad.addColorStop(0, '#1e293b');
  grad.addColorStop(0.08, bgColor);
  grad.addColorStop(0.5, bgColor);
  grad.addColorStop(0.92, bgColor);
  grad.addColorStop(1, '#1e293b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 768);

  // Center acrylic tube glow
  const glow = ctx.createRadialGradient(128, 384, 20, 128, 384, 340);
  glow.addColorStop(0, 'rgba(255,255,255,0.22)');
  glow.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 256, 768);

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 10;
  ctx.strokeRect(14, 14, 228, 740);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, 208, 720);

  const chars = Array.from(text);
  const startY = chars.length <= 3 ? 190 : chars.length <= 4 ? 145 : 105;
  const stepY = chars.length <= 3 ? 185 : chars.length <= 4 ? 145 : 112;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${chars.length <= 4 ? 104 : 84}px "Noto Sans TC", "PingFang TC", sans-serif`;
  ctx.shadowColor = 'rgba(0,0,0,0.65)';
  ctx.shadowBlur = 12;
  ctx.lineWidth = 8;
  ctx.strokeStyle = 'rgba(0,0,0,0.65)';

  chars.forEach((ch, idx) => {
    const cy = startY + idx * stepY;
    ctx.strokeText(ch, 128, cy);
    ctx.fillStyle = '#fffdf8';
    ctx.fillText(ch, 128, cy);
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
  ctx.fillText('7-ELEVEN 文學門市・文思文具行', 384, 190);

  return finalizeTexture(canvas);
}

/**
 * Handwritten Sidewalk Chalkboard Sign Texture (手寫木框小黑板立牌)
 */
export function createChalkboardSignTexture(title: string, line1: string, line2: string): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(384, 512);
  // Slate blackboard surface
  ctx.fillStyle = '#1e242b';
  ctx.fillRect(0, 0, 384, 512);

  // Dusty chalk smudge grain
  for (let i = 0; i < 1600; i++) {
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(Math.random() * 384, Math.random() * 512, 3, 3);
  }

  // Warm wooden frame border
  ctx.strokeStyle = '#8b5a2b';
  ctx.lineWidth = 24;
  ctx.strokeRect(12, 12, 360, 488);

  // Hand-drawn dashed chalk border
  ctx.strokeStyle = '#fde68a';
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 8]);
  ctx.strokeRect(34, 34, 316, 444);
  ctx.setLineDash([]);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fca5a5';
  ctx.font = '900 30px "Noto Sans TC", sans-serif';
  ctx.fillText('★ TODAY SPECIAL ★', 192, 82);

  ctx.fillStyle = '#fef08a';
  ctx.font = '900 40px "Noto Sans TC", sans-serif';
  ctx.fillText(title.slice(0, 7), 192, 146);

  // Cute chalk divider wave
  ctx.strokeStyle = '#93c5fd';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(64, 192);
  ctx.lineTo(320, 192);
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 28px "Noto Sans TC", sans-serif';
  ctx.fillText(line1, 192, 260);
  ctx.fillStyle = '#86efac';
  ctx.fillText(line2, 192, 326);

  ctx.fillStyle = '#fdba74';
  ctx.font = '800 26px "Noto Sans TC", sans-serif';
  ctx.fillText('歡迎內用 / 外帶 [按 E]', 192, 418);

  return finalizeTexture(canvas);
}

/**
 * Glowing Interactive Golden Circle Marker Texture ("glowing interactive golden circle marker on the entryway")
 */
export function createGoldenMarkerTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(512, 512);
  ctx.clearRect(0, 0, 512, 512);

  const cx = 256;
  const cy = 256;

  // Soft warm golden radial aura
  const aura = ctx.createRadialGradient(cx, cy, 30, cx, cy, 245);
  aura.addColorStop(0, 'rgba(251, 191, 36, 0.28)');
  aura.addColorStop(0.62, 'rgba(245, 158, 11, 0.18)');
  aura.addColorStop(0.84, 'rgba(254, 240, 138, 0.65)');
  aura.addColorStop(0.95, 'rgba(245, 158, 11, 0.85)');
  aura.addColorStop(1, 'rgba(245, 158, 11, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(cx, cy, 245, 0, Math.PI * 2);
  ctx.fill();

  // Outer crisp glowing golden ring
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 10;
  ctx.shadowColor = '#f59e0b';
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(cx, cy, 224, 0, Math.PI * 2);
  ctx.stroke();

  // Segmented inner RPG quest rune ring
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 6;
  ctx.setLineDash([28, 16]);
  ctx.beginPath();
  ctx.arc(cx, cy, 184, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // 4 Cardinal diamond markers
  for (let a = 0; a < 4; a++) {
    const ang = (a * Math.PI) / 2;
    const dx = cx + Math.cos(ang) * 204;
    const dy = cy + Math.sin(ang) * 204;
    ctx.save();
    ctx.translate(dx, dy);
    ctx.rotate(ang + Math.PI / 4);
    ctx.fillStyle = '#fffbeb';
    ctx.fillRect(-10, -10, 20, 20);
    ctx.restore();
  }

  return finalizeTexture(canvas);
}

export function createAsphaltTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(1024, 2048);
  ctx.fillStyle = '#252930';
  ctx.fillRect(0, 0, 1024, 2048);

  // Subtle asphalt patch variation & damp mountain road sheen
  for (let p = 0; p < 24; p++) {
    const px = 120 + Math.random() * 780;
    const py = Math.random() * 2048;
    const pr = 80 + Math.random() * 160;
    const grad = ctx.createRadialGradient(px, py, 10, px, py, pr);
    grad.addColorStop(0, p % 2 === 0 ? 'rgba(15,18,24,0.35)' : 'rgba(55,62,72,0.22)');
    grad.addColorStop(1, 'rgba(37,41,48,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(px - pr, py - pr, pr * 2, pr * 2);
  }

  // Fine mineral aggregate speckle grain
  for (let i = 0; i < 42000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 2048;
    const v = 28 + Math.floor(Math.random() * 42);
    ctx.fillStyle = `rgb(${v},${v + 2},${v + 5})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Concrete roadside gutter apron on both edges
  ctx.fillStyle = '#474c54';
  ctx.fillRect(0, 0, 56, 2048);
  ctx.fillRect(968, 0, 56, 2048);

  // Authentic Taipei continuous red no-parking curb line (紅線) with weathered paint cracks
  ctx.fillStyle = '#c83228';
  ctx.fillRect(58, 0, 22, 2048);
  ctx.fillRect(944, 0, 22, 2048);
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = 'rgba(37,41,48,0.45)';
    ctx.fillRect(56 + Math.random() * 26, Math.random() * 2048, 4, 3);
    ctx.fillRect(942 + Math.random() * 26, Math.random() * 2048, 4, 3);
  }

  // Cast-iron storm drain grates (水溝蓋) along both gutters
  for (let y = 120; y < 2048; y += 340) {
    for (const gx of [10, 974]) {
      ctx.fillStyle = '#181b20';
      ctx.fillRect(gx, y, 40, 86);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 3;
      ctx.strokeRect(gx, y, 40, 86);
      ctx.fillStyle = '#475569';
      for (let sy = y + 8; sy < y + 80; sy += 10) {
        ctx.fillRect(gx + 4, sy, 32, 4);
      }
    }
  }

  // Subtle tire tracks & asphalt crack lines
  ctx.fillStyle = 'rgba(14, 16, 21, 0.36)';
  ctx.fillRect(280, 0, 130, 2048);
  ctx.fillRect(614, 0, 130, 2048);

  // Detailed Taipei round cast-iron manhole covers
  for (const [mx, my] of [
    [512, 640],
    [460, 1580],
  ]) {
    ctx.beginPath();
    ctx.arc(mx, my, 52, 0, Math.PI * 2);
    ctx.fillStyle = '#334155';
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(mx, my, 36, 0, Math.PI * 2);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(mx, my, 16, 0, Math.PI * 2);
    ctx.stroke();
  }

  return finalizeTexture(canvas, 1, 5);
}

/**
 * PBR Roughness Map for Yangmingshan Damp Asphalt + Puddle Reflections
 * Dark areas (low roughness) create mirror-like reflections of neon signs & lanterns!
 */
export function createAsphaltRoughnessMap(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(512, 1024);
  // Base damp asphalt roughness (~0.68)
  ctx.fillStyle = '#aeaeae';
  ctx.fillRect(0, 0, 512, 1024);

  // Subtle organic dampness variations (no hard circular edges)
  for (let i = 0; i < 45; i++) {
    const px = Math.random() * 512;
    const py = Math.random() * 1024;
    const r = 60 + Math.random() * 130;
    const grad = ctx.createRadialGradient(px, py, 5, px, py, r);
    grad.addColorStop(0, i % 2 === 0 ? 'rgba(90,90,90,0.28)' : 'rgba(210,210,210,0.22)');
    grad.addColorStop(1, 'rgba(174,174,174,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(px - r, py - r, r * 2, r * 2);
  }

  // Subtle wheel-track polish
  ctx.fillStyle = 'rgba(110, 110, 110, 0.25)';
  ctx.fillRect(140, 0, 64, 1024);
  ctx.fillRect(308, 0, 64, 1024);

  return finalizeTexture(canvas, 1, 5, true);
}

/**
 * PBR Bump Map for Asphalt Micro-Aggregate Relief
 */
export function createAsphaltBumpMap(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(512, 1024);
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 512, 1024);

  for (let i = 0; i < 28000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 1024;
    const v = 90 + Math.floor(Math.random() * 90);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(x, y, 2, 2);
  }
  return finalizeTexture(canvas, 1, 5, true);
}

/**
 * Authentic Taiwanese Arcade Non-Slip Red/Slate Tile Sidewalk Texture (騎樓防滑紅磚與洗石子地磚)
 */
export function createArcadeTileTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(512, 512);
  ctx.fillStyle = '#7c584c';
  ctx.fillRect(0, 0, 512, 512);

  // Individual square clay/slate tile color variation
  const tileSize = 64;
  for (let ty = 0; ty < 512; ty += tileSize) {
    for (let tx = 0; tx < 512; tx += tileSize) {
      const shade = (Math.random() - 0.5) * 14;
      ctx.fillStyle = `rgb(${118 + shade}, ${88 + shade * 0.8}, ${78 + shade * 0.7})`;
      ctx.fillRect(tx + 2, ty + 2, tileSize - 4, tileSize - 4);

      // Subtle anti-slip concentric groove inside each arcade tile
      ctx.strokeStyle = 'rgba(40, 25, 20, 0.22)';
      ctx.lineWidth = 2;
      ctx.strokeRect(tx + 10, ty + 10, tileSize - 20, tileSize - 20);
    }
  }

  // Grout lines
  ctx.strokeStyle = '#3f3a36';
  ctx.lineWidth = 4;
  for (let i = 0; i <= 512; i += tileSize) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  // Washed terrazzo curb edge strip (洗石子騎樓邊條)
  ctx.fillStyle = '#6b7280';
  ctx.fillRect(0, 0, 36, 512);
  ctx.fillRect(476, 0, 36, 512);
  for (let i = 0; i < 1800; i++) {
    const v = 70 + Math.floor(Math.random() * 90);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(Math.random() * 36, Math.random() * 512, 2, 2);
    ctx.fillRect(476 + Math.random() * 36, Math.random() * 512, 2, 2);
  }

  return finalizeTexture(canvas, 1, 14);
}

export function createTileFacadeTexture(baseHex: string, lineHex: string): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(512, 512);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 512, 512);

  // Individual ceramic brick variation
  for (let y = 0; y < 512; y += 32) {
    const offset = (y / 32) % 2 === 0 ? 0 : 32;
    for (let x = -32; x < 512; x += 64) {
      const tint = (Math.random() - 0.5) * 16;
      ctx.fillStyle = tint > 0 ? `rgba(255,255,255,${tint / 255})` : `rgba(0,0,0,${-tint / 255})`;
      ctx.fillRect(x + offset + 2, y + 2, 60, 28);
    }
  }

  // Mortar lines
  ctx.strokeStyle = lineHex;
  ctx.lineWidth = 3;
  for (let y = 0; y <= 512; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
    const offset = (y / 32) % 2 === 0 ? 0 : 32;
    for (let x = offset; x <= 512; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 32);
      ctx.stroke();
    }
  }

  // Subtle mountain-climate rain streak weathering
  const weatherGrad = ctx.createLinearGradient(0, 0, 0, 512);
  weatherGrad.addColorStop(0, 'rgba(15, 23, 42, 0.16)');
  weatherGrad.addColorStop(0.25, 'rgba(0, 0, 0, 0)');
  weatherGrad.addColorStop(0.8, 'rgba(0, 0, 0, 0)');
  weatherGrad.addColorStop(1, 'rgba(15, 23, 42, 0.22)');
  ctx.fillStyle = weatherGrad;
  ctx.fillRect(0, 0, 512, 512);

  return finalizeTexture(canvas, 3, 2);
}

export function createTileBumpTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(256, 256);
  ctx.fillStyle = '#d8d8d8';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#303030';
  ctx.lineWidth = 3;
  for (let y = 0; y <= 256; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
    const offset = (y / 32) % 2 === 0 ? 0 : 32;
    for (let x = offset; x <= 256; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 32);
      ctx.stroke();
    }
  }
  return finalizeTexture(canvas, 3, 2, true);
}

/**
 * Corrugated Sheet Metal Texture for Taiwanese Rooftop Additions & Canopies (鐵皮浪板與鐵捲門)
 */
export function createCorrugatedMetalTexture(baseHex: string, rustTint = true): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(256, 256);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  for (let x = 0; x < 256; x += 16) {
    const grad = ctx.createLinearGradient(x, 0, x + 16, 0);
    grad.addColorStop(0, 'rgba(0,0,0,0.28)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.18)');
    grad.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, 16, 256);
  }

  if (rustTint) {
    const rustGrad = ctx.createLinearGradient(0, 0, 0, 256);
    rustGrad.addColorStop(0, 'rgba(120, 53, 15, 0.25)');
    rustGrad.addColorStop(0.5, 'rgba(0,0,0,0)');
    rustGrad.addColorStop(1, 'rgba(120, 53, 15, 0.32)');
    ctx.fillStyle = rustGrad;
    ctx.fillRect(0, 0, 256, 256);
  }

  return finalizeTexture(canvas, 4, 1);
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
