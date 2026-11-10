import * as THREE from 'three';
import { AnimatedWorldRefs } from './alleyBuilder';

export type TimeSlot = 'afternoon' | 'sunset' | 'night' | 'latenight';
export type WeatherMode = 'breeze' | 'fog' | 'wind' | 'rain';

export interface EnvInfo {
  timeLabel: string;
  weatherLabel: string;
  tempC: number;
  windStrength: number;
  rainIntensity: number;
  fogDensity: number;
  isDark: boolean;
}

const TIME_PRESETS: Record<
  TimeSlot,
  {
    label: string;
    sky: string;
    sunColor: string;
    sunIntensity: number;
    sunPos: [number, number, number];
    hemiSky: string;
    hemiGround: string;
    hemiIntensity: number;
    shopLightBoost: number;
    signEmissive: number;
    cityGlow: number;
    isDark: boolean;
  }
> = {
  afternoon: {
    label: '☀️ 午後晴朗',
    sky: '#8ec5fc',
    sunColor: '#fff5e0',
    sunIntensity: 2.0,
    sunPos: [22, 34, 16],
    hemiSky: '#cfe8ff',
    hemiGround: '#6b655c',
    hemiIntensity: 1.05,
    shopLightBoost: 4.5,
    signEmissive: 0.35,
    cityGlow: 0.15,
    isDark: false,
  },
  sunset: {
    label: '🌅 陽明山黃昏',
    sky: '#d97b54',
    sunColor: '#ff9452',
    sunIntensity: 1.55,
    sunPos: [-28, 12, -20],
    hemiSky: '#f7a477',
    hemiGround: '#3d312c',
    hemiIntensity: 0.85,
    shopLightBoost: 12.0,
    signEmissive: 0.78,
    cityGlow: 0.7,
    isDark: false,
  },
  night: {
    label: '🌙 華燈初上夜晚',
    sky: '#111829',
    sunColor: '#7691cc',
    sunIntensity: 0.48,
    sunPos: [-12, 26, -15],
    hemiSky: '#3b4e78',
    hemiGround: '#1b1e28',
    hemiIntensity: 0.52,
    shopLightBoost: 13.5,
    signEmissive: 1.0,
    cityGlow: 1.25,
    isDark: true,
  },
  latenight: {
    label: '🌌 深夜宵夜時段',
    sky: '#080c17',
    sunColor: '#566b99',
    sunIntensity: 0.32,
    sunPos: [10, 22, -10],
    hemiSky: '#24314f',
    hemiGround: '#141720',
    hemiIntensity: 0.38,
    shopLightBoost: 11.5,
    signEmissive: 0.92,
    cityGlow: 1.0,
    isDark: true,
  },
};

const WEATHER_PRESETS: Record<
  WeatherMode,
  {
    label: string;
    fogDensity: number;
    fogTint: string;
    windStrength: number;
    rainIntensity: number;
    tempOffset: number;
  }
> = {
  breeze: {
    label: '🌤️ 山城微風',
    fogDensity: 0.0085,
    fogTint: '#8da2be',
    windStrength: 0.22,
    rainIntensity: 0,
    tempOffset: 0,
  },
  fog: {
    label: '🌫️ 陽明山白牆大霧',
    fogDensity: 0.072,
    fogTint: '#cbd5e1',
    windStrength: 0.35,
    rainIntensity: 0,
    tempOffset: -3,
  },
  wind: {
    label: '💨 文化十級強風',
    fogDensity: 0.018,
    fogTint: '#94a3b8',
    windStrength: 1.0,
    rainIntensity: 0.12,
    tempOffset: -4,
  },
  rain: {
    label: '🌧️ 突來山雨',
    fogDensity: 0.036,
    fogTint: '#64748b',
    windStrength: 0.65,
    rainIntensity: 1.0,
    tempOffset: -5,
  },
};

export class WeatherAndTimeSystem {
  public timeSlot: TimeSlot = 'night';
  public weatherMode: WeatherMode = 'breeze';

  private scene: THREE.Scene;
  private world: AnimatedWorldRefs;
  private hemiLight: THREE.HemisphereLight;
  private dirLight: THREE.DirectionalLight;
  private fog: THREE.FogExp2;

  private currentSky = new THREE.Color('#131a2b');
  private currentFogDensity = 0.01;
  private currentWind = 0.22;
  private currentRain = 0;

  // Particles
  private rainPoints: THREE.Points;
  private rainPositions: Float32Array;
  private steamPoints: THREE.Points;
  private steamPositions: Float32Array;
  private steamAges: Float32Array;
  private leafMeshes: THREE.Mesh[] = [];

  constructor(scene: THREE.Scene, world: AnimatedWorldRefs) {
    this.scene = scene;
    this.world = world;

    this.fog = new THREE.FogExp2('#131a2b', 0.01);
    this.scene.fog = this.fog;
    this.scene.background = this.currentSky.clone();

    this.hemiLight = new THREE.HemisphereLight(0x3b4d75, 0x1a1c24, 0.5);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0x7c96cc, 0.5);
    this.dirLight.position.set(-12, 26, -15);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.set(1024, 1024);
    this.dirLight.shadow.camera.near = 2;
    this.dirLight.shadow.camera.far = 90;
    const d = 28;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.scene.add(this.dirLight);

    // Rain particle system
    const rainCount = 950;
    this.rainPositions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      this.rainPositions[i * 3] = (Math.random() - 0.5) * 32;
      this.rainPositions[i * 3 + 1] = Math.random() * 14;
      this.rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 48;
    }
    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0xcbd5e1,
      size: 0.12,
      transparent: true,
      opacity: 0,
    });
    this.rainPoints = new THREE.Points(rainGeo, rainMat);
    this.scene.add(this.rainPoints);

    // Steam particles rising from soup pots & fryers
    const steamCount = 90;
    this.steamPositions = new Float32Array(steamCount * 3);
    this.steamAges = new Float32Array(steamCount);
    for (let i = 0; i < steamCount; i++) {
      this.steamAges[i] = Math.random();
      this.resetSteamParticle(i);
    }
    const steamGeo = new THREE.BufferGeometry();
    steamGeo.setAttribute('position', new THREE.BufferAttribute(this.steamPositions, 3));
    const steamMat = new THREE.PointsMaterial({
      color: 0xf8fafc,
      size: 0.24,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    });
    this.steamPoints = new THREE.Points(steamGeo, steamMat);
    this.scene.add(this.steamPoints);

    // Wind-blown leaves (shaded naturally by scene lights, visible primarily during windy gusts)
    const leafGeo = new THREE.PlaneGeometry(0.11, 0.06);
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x6b8e23,
      roughness: 0.85,
      side: THREE.DoubleSide,
    });
    for (let i = 0; i < 20; i++) {
      const m = new THREE.Mesh(leafGeo, leafMat);
      m.position.set((Math.random() - 0.5) * 9, 0.4 + Math.random() * 3.5, -26 + Math.random() * 52);
      this.scene.add(m);
      this.leafMeshes.push(m);
    }
  }

  private resetSteamParticle(index: number): void {
    const emitters = this.world.steamEmitters;
    if (emitters.length === 0) return;
    const emitter = emitters[index % emitters.length];
    this.steamPositions[index * 3] = emitter.origin.x + (Math.random() - 0.5) * emitter.spread;
    this.steamPositions[index * 3 + 1] = emitter.origin.y + Math.random() * 0.15;
    this.steamPositions[index * 3 + 2] = emitter.origin.z + (Math.random() - 0.5) * emitter.spread;
  }

  public cycleTime(): TimeSlot {
    const order: TimeSlot[] = ['afternoon', 'sunset', 'night', 'latenight'];
    this.timeSlot = order[(order.indexOf(this.timeSlot) + 1) % order.length];
    return this.timeSlot;
  }

  public cycleWeather(): WeatherMode {
    const order: WeatherMode[] = ['breeze', 'fog', 'wind', 'rain'];
    this.weatherMode = order[(order.indexOf(this.weatherMode) + 1) % order.length];
    return this.weatherMode;
  }

  public getEnvInfo(): EnvInfo {
    const t = TIME_PRESETS[this.timeSlot];
    const w = WEATHER_PRESETS[this.weatherMode];
    const baseTemp = this.timeSlot === 'afternoon' ? 22 : this.timeSlot === 'sunset' ? 19 : 16;
    return {
      timeLabel: t.label,
      weatherLabel: w.label,
      tempC: baseTemp + w.tempOffset,
      windStrength: this.currentWind,
      rainIntensity: this.currentRain,
      fogDensity: this.currentFogDensity,
      isDark: t.isDark,
    };
  }

  public update(dt: number, elapsed: number, playerPos: THREE.Vector3): void {
    const tPreset = TIME_PRESETS[this.timeSlot];
    const wPreset = WEATHER_PRESETS[this.weatherMode];

    const blend = Math.min(1, dt * 2.2);

    // Blend sky & fog tint (blend darker in night fog so white fog feels natural at night)
    const targetSky = new THREE.Color(tPreset.sky);
    const fogTint = new THREE.Color(wPreset.fogTint);
    const fogMix = this.weatherMode === 'fog' ? (tPreset.isDark ? 0.35 : 0.72) : 0.2;
    const finalSky = targetSky.clone().lerp(fogTint, fogMix);

    this.currentSky.lerp(finalSky, blend);
    this.scene.background = this.currentSky;
    this.fog.color.copy(this.currentSky);

    this.currentFogDensity = THREE.MathUtils.lerp(this.currentFogDensity, wPreset.fogDensity, blend);
    this.fog.density = this.currentFogDensity;

    this.currentWind = THREE.MathUtils.lerp(this.currentWind, wPreset.windStrength, blend);
    this.currentRain = THREE.MathUtils.lerp(this.currentRain, wPreset.rainIntensity, blend);

    // Lighting transitions
    this.hemiLight.color.lerp(new THREE.Color(tPreset.hemiSky), blend);
    this.hemiLight.groundColor.lerp(new THREE.Color(tPreset.hemiGround), blend);
    this.hemiLight.intensity = THREE.MathUtils.lerp(this.hemiLight.intensity, tPreset.hemiIntensity, blend);

    this.dirLight.color.lerp(new THREE.Color(tPreset.sunColor), blend);
    this.dirLight.intensity = THREE.MathUtils.lerp(this.dirLight.intensity, tPreset.sunIntensity, blend);
    this.dirLight.position.lerp(new THREE.Vector3(...tPreset.sunPos), blend);

    // Shop lights & glowing signs
    this.world.shopLights.forEach((light) => {
      light.intensity = THREE.MathUtils.lerp(light.intensity, tPreset.shopLightBoost, blend);
    });
    this.world.streetLampLights.forEach((light) => {
      light.intensity = THREE.MathUtils.lerp(light.intensity, tPreset.isDark ? 15.0 : 1.5, blend);
    });
    this.world.streetLampBulbs.forEach((mat) => {
      mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, tPreset.isDark ? 1.2 : 0.15, blend);
    });
    this.world.emissiveSignMaterials.forEach((mat) => {
      mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, tPreset.signEmissive, blend);
    });
    this.world.windowMaterials.forEach((mat) => {
      mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, tPreset.isDark ? 0.65 : 0.25, blend);
    });

    // Wet asphalt shimmer when raining
    const targetRoughness = this.currentRain > 0.35 ? 0.25 : 0.86;
    this.world.asphaltMaterial.roughness = THREE.MathUtils.lerp(
      this.world.asphaltMaterial.roughness,
      targetRoughness,
      blend
    );

    // Distant Taipei skyline lights glow brighter at sunset/night
    this.world.cityLightsGroup.children.forEach((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        child.material.emissiveIntensity = tPreset.cityGlow;
      }
    });

    // Animate lanterns & shop flags in Yangmingshan wind
    const gust = 1 + Math.sin(elapsed * 2.1) * 0.35;
    this.world.lanterns.forEach((lantern, idx) => {
      lantern.rotation.z = Math.sin(elapsed * 3.0 + idx * 0.9) * (0.06 + this.currentWind * 0.34 * gust);
      lantern.rotation.x = Math.cos(elapsed * 2.3 + idx * 0.5) * (0.04 + this.currentWind * 0.2);
    });
    this.world.flags.forEach((flag, idx) => {
      flag.rotation.y = Math.sin(elapsed * (3.5 + this.currentWind * 5) + idx) * (0.15 + this.currentWind * 0.55);
      flag.rotation.z = -this.currentWind * 0.22 * gust;
    });

    // Update rain particles around player
    const rainMat = this.rainPoints.material as THREE.PointsMaterial;
    rainMat.opacity = this.currentRain * 0.65;
    if (this.currentRain > 0.05) {
      const count = this.rainPositions.length / 3;
      for (let i = 0; i < count; i++) {
        this.rainPositions[i * 3 + 1] -= dt * (15 + this.currentRain * 6);
        this.rainPositions[i * 3 + 2] -= dt * this.currentWind * 5;
        if (this.rainPositions[i * 3 + 1] < 0) {
          this.rainPositions[i * 3] = playerPos.x + (Math.random() - 0.5) * 26;
          this.rainPositions[i * 3 + 1] = 11 + Math.random() * 4;
          this.rainPositions[i * 3 + 2] = playerPos.z + (Math.random() - 0.5) * 30;
        }
      }
      this.rainPoints.geometry.attributes.position.needsUpdate = true;
    }

    // Update steam rising from soup pots
    const steamCount = this.steamAges.length;
    for (let i = 0; i < steamCount; i++) {
      this.steamAges[i] += dt * (0.55 + Math.random() * 0.2);
      if (this.steamAges[i] >= 1) {
        this.steamAges[i] = 0;
        this.resetSteamParticle(i);
      } else {
        this.steamPositions[i * 3] += Math.sin(elapsed * 2 + i) * dt * 0.18;
        this.steamPositions[i * 3 + 1] += dt * 0.95;
        this.steamPositions[i * 3 + 2] -= dt * this.currentWind * 0.55;
      }
    }
    this.steamPoints.geometry.attributes.position.needsUpdate = true;

    // Update wind-blown leaves (visible when strong Yangmingshan wind blows)
    const showLeaves = this.currentWind > 0.34;
    this.leafMeshes.forEach((leaf, idx) => {
      leaf.visible = showLeaves;
      if (!showLeaves) return;
      const speed = 1.2 + this.currentWind * 4.5;
      leaf.position.z -= dt * speed;
      leaf.position.x += Math.sin(elapsed * 3 + idx) * dt * (0.4 + this.currentWind * 1.4);
      leaf.position.y = 0.25 + ((Math.sin(elapsed * 2 + idx) + 1) * 0.5) * (1.2 + this.currentWind * 2.2);
      leaf.rotation.x += dt * (2 + this.currentWind * 5);
      leaf.rotation.z += dt * (1.5 + this.currentWind * 4);
      if (leaf.position.z < -34) {
        leaf.position.z = 26;
        leaf.position.x = (Math.random() - 0.5) * 8;
      }
    });
  }
}
