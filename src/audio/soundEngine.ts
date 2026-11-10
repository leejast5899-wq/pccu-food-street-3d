export class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private streetGain: GainNode | null = null;
  private muted = false;
  private initialized = false;
  private lastStepTime = 0;

  public init(): void {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return;
    }

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.muted ? 0 : 0.45;
    this.masterGain.connect(this.ctx.destination);

    // Create reusable white/pink noise buffer for ambient street, wind, and rain
    const bufferSize = this.ctx.sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.12;
    }

    // 1. Cozy street sizzle & warm alley murmur
    const streetSrc = this.ctx.createBufferSource();
    streetSrc.buffer = noiseBuffer;
    streetSrc.loop = true;
    const streetFilter = this.ctx.createBiquadFilter();
    streetFilter.type = 'bandpass';
    streetFilter.frequency.value = 520;
    streetFilter.Q.value = 0.7;
    this.streetGain = this.ctx.createGain();
    this.streetGain.gain.value = 0.08;
    streetSrc.connect(streetFilter).connect(this.streetGain).connect(this.masterGain);
    streetSrc.start();

    // 2. Yangmingshan wind howl
    const windSrc = this.ctx.createBufferSource();
    windSrc.buffer = noiseBuffer;
    windSrc.loop = true;
    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 260;
    windFilter.Q.value = 3.2;
    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0.01;
    windSrc.connect(windFilter).connect(this.windGain).connect(this.masterGain);
    windSrc.start();

    // 3. Rain patter
    const rainSrc = this.ctx.createBufferSource();
    rainSrc.buffer = noiseBuffer;
    rainSrc.loop = true;
    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'highpass';
    rainFilter.frequency.value = 1800;
    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0.0;
    rainSrc.connect(rainFilter).connect(this.rainGain).connect(this.masterGain);
    rainSrc.start();

    this.initialized = true;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.45, this.ctx.currentTime, 0.08);
    }
    return this.muted;
  }

  public updateAmbience(windStrength: number, rainIntensity: number, umbrellaOpen: boolean): void {
    if (!this.ctx || !this.windGain || !this.rainGain || !this.streetGain) return;
    const now = this.ctx.currentTime;
    const targetWind = 0.02 + windStrength * 0.22;
    const targetRain = rainIntensity * (umbrellaOpen ? 0.24 : 0.16);
    this.windGain.gain.setTargetAtTime(targetWind, now, 0.35);
    this.rainGain.gain.setTargetAtTime(targetRain, now, 0.35);
    this.streetGain.gain.setTargetAtTime(0.075 - rainIntensity * 0.02, now, 0.35);
  }

  public playFootstep(sprinting: boolean): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = performance.now();
    const interval = sprinting ? 290 : 450;
    if (now - this.lastStepTime < interval) return;
    this.lastStepTime = now;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(115 + Math.random() * 20, t);
    osc.frequency.exponentialRampToValueAtTime(48, t + 0.07);
    gain.gain.setValueAtTime(0.09, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(gain).connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.085);
  }

  public playUiClick(): void {
    this.playTone(580, 740, 0.06, 'sine', 0.12);
  }

  public playOrderSuccess(): void {
    this.playTone(587.33, 880, 0.14, 'triangle', 0.2);
    setTimeout(() => this.playTone(880, 1174.66, 0.18, 'triangle', 0.18), 90);
  }

  public playEatSound(isDrink: boolean): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    if (isDrink) {
      this.playTone(320, 520, 0.14, 'sine', 0.16);
      setTimeout(() => this.playTone(460, 620, 0.12, 'sine', 0.12), 110);
    } else {
      this.playTone(260, 160, 0.09, 'sawtooth', 0.1);
      setTimeout(() => this.playTone(300, 190, 0.09, 'triangle', 0.12), 85);
    }
  }

  public playUmbrellaToggle(open: boolean): void {
    this.playTone(open ? 240 : 460, open ? 540 : 210, 0.12, 'sine', 0.15);
  }

  public playAchievement(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, freq * 1.01, 0.22, 'triangle', 0.16), idx * 90);
    });
  }

  private playTone(
    startFreq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType,
    volume: number
  ): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), t + duration);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain).connect(this.masterGain);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }
}
