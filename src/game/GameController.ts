import * as THREE from 'three';
import { SoundEngine } from '../audio/soundEngine';
import {
  LANDMARKS,
  MenuItem,
  SHOPS,
  ShopConfig,
  TRIVIA_QUESTIONS,
  TriviaQuestion,
} from '../data/shops';
import { Google3DTilesWorld } from '../maps/google3DTiles';
import { GoogleMap3DController } from '../maps/googleMaps3D';
import { getSavedGoogleMapsApiKey, saveGoogleMapsApiKey } from '../maps/googleMapsLoader';
import { AABB, BuiltAlley, Interactable, buildGuanghuaAlley } from '../world/alleyBuilder';
import { HeldItemRig } from '../world/heldItems';
import { StudentNPC, StudentNPCManager } from '../world/npcs';
import { WeatherAndTimeSystem } from '../world/weatherAndTime';

type ViewMode = 'alley' | 'map3d' | '3dtiles';

type ActiveTarget =
  | { source: 'world'; item: Interactable; distance: number }
  | { source: 'npc'; npc: StudentNPC; distance: number }
  | { source: 'tiles-shop'; shop: ShopConfig; distance: number };

export class GameController {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  private alley: BuiltAlley;
  private weatherTime: WeatherAndTimeSystem;
  private npcManager: StudentNPCManager;
  private heldRig: HeldItemRig;
  private google3DTiles: Google3DTilesWorld;
  private googleMap3D: GoogleMap3DController;
  private sound = new SoundEngine();

  private viewMode: ViewMode = 'alley';

  // Player state
  private playerPos = new THREE.Vector3(0, 1.65, 22.8);
  private velocityY = 0;
  private yaw = 0; // 0 looks toward -Z (down the alley)
  private pitch = -0.04;
  private isGrounded = true;
  private isSeated = false;
  private preSeatPos = new THREE.Vector3();

  // Stats
  private money = 600;
  private hunger = 68;
  private warmth = 76;
  private spice = 0;
  private umbrellaOpen = false;
  private heldFood: MenuItem | null = null;
  private heldBites = 0;
  private discoveredFoods = new Set<string>();
  private discoveredLandmarks = new Set<string>();
  private freeSoupsTasted = new Set<string>();
  private answeredTriviaCount = 0;

  // Controls & modes
  private keys = new Set<string>();
  private started = false;
  private preferPointerLock = true;
  private pointerLocked = false;
  private draggingLook = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private photoMode = false;
  private modalOpen = false;
  private dialogueOpen = false;
  private activeTarget: ActiveTarget | null = null;
  private journalTab: 'foods' | 'landmarks' = 'foods';
  private activeTrivia: TriviaQuestion | null = null;

  private clock = new THREE.Clock();
  private totalFoodsCount = SHOPS.reduce((sum, s) => sum + s.items.length, 0);

  // DOM references
  private elCrosshair = document.getElementById('crosshair')!;
  private elHudTop = document.getElementById('hud-top')!;
  private elQuickActions = document.getElementById('hud-quick-actions')!;
  private elControlsHint = document.getElementById('hud-controls-hint')!;
  private elEnvStatus = document.getElementById('env-status-text')!;
  private elMoney = document.getElementById('stat-money')!;
  private elHungerNum = document.getElementById('stat-hunger-num')!;
  private elHungerBar = document.getElementById('stat-hunger-bar')!;
  private elWarmthNum = document.getElementById('stat-warmth-num')!;
  private elWarmthBar = document.getElementById('stat-warmth-bar')!;
  private elJournalCount = document.getElementById('stat-journal')!;
  private elInteractPrompt = document.getElementById('interact-prompt')!;
  private elInteractLabel = document.getElementById('interact-label')!;
  private elHeldCard = document.getElementById('held-item-card')!;
  private elHeldEmoji = document.getElementById('held-emoji')!;
  private elHeldName = document.getElementById('held-name')!;
  private elHeldSub = document.getElementById('held-sub')!;
  private elHeldBites = document.getElementById('held-bites')!;
  private elSeatedBanner = document.getElementById('seated-banner')!;
  private elToastContainer = document.getElementById('toast-container')!;
  private elDialogueBox = document.getElementById('dialogue-box')!;
  private elDialogueSpeaker = document.getElementById('dialogue-speaker')!;
  private elDialogueText = document.getElementById('dialogue-text')!;
  private elModalBackdrop = document.getElementById('modal-backdrop')!;
  private elShopModal = document.getElementById('shop-modal')!;
  private elJournalModal = document.getElementById('journal-modal')!;
  private elTriviaModal = document.getElementById('trivia-modal')!;
  private elGmapsModal = document.getElementById('gmaps-modal')!;
  private elGoogleMap3DContainer = document.getElementById('google-map3d-container')!;
  private elGoogleMap3DControls = document.getElementById('google-map3d-controls')!;
  private elGoogleAttributionBar = document.getElementById('google-attribution-bar')!;
  private elGoogleAttributionText = document.getElementById('google-attribution-text')!;
  private elInputGmapsKey = document.getElementById('input-gmaps-key') as HTMLInputElement;
  private elGmapsStatus = document.getElementById('gmaps-status-msg')!;
  private elStartOverlay = document.getElementById('start-overlay')!;
  private elPhotoExitHint = document.getElementById('photo-exit-hint')!;
  private elRainVignette = document.getElementById('rain-vignette')!;
  private elSpiceVignette = document.getElementById('spice-vignette')!;
  private elColdVignette = document.getElementById('cold-vignette')!;
  private elBtnUmbrella = document.getElementById('btn-umbrella')!;
  private elBtnSound = document.getElementById('btn-sound')!;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.12, 4500);
    this.camera.rotation.order = 'YXZ';
    this.scene.add(this.camera);

    this.alley = buildGuanghuaAlley(this.scene);
    this.weatherTime = new WeatherAndTimeSystem(this.scene, this.alley.animated);
    this.npcManager = new StudentNPCManager(this.scene);
    this.heldRig = new HeldItemRig(this.camera);

    this.google3DTiles = new Google3DTilesWorld(
      this.scene,
      (originPos) => {
        if (this.viewMode === '3dtiles') {
          this.playerPos.copy(originPos);
          this.isGrounded = true;
          this.showToast('✅ 已對齊 Google 1:1 實景光華路26巷地形！WASD 可直接步行探索');
        }
      },
      (errMsg) => {
        this.showToast(errMsg);
        this.setGmapsStatus(errMsg, true);
      }
    );

    this.googleMap3D = new GoogleMap3DController(this.elGoogleMap3DContainer, {
      onSelectShop: (shop) => {
        this.openShopModal(shop);
      },
      onStatus: (msg) => {
        this.showToast(msg);
      },
    });

    this.bindEvents();
    this.updateHUD();

    const params = new URLSearchParams(window.location.search);
    if (params.get('preview') === '1' || params.has('view')) {
      this.startGame(false);
      const view = params.get('view');
      if (view === 'dahongpao-ext') {
        // Switch to afternoon daylight for crisp storefront inspection
        this.weatherTime.cycleTime();
        this.weatherTime.cycleTime(); // night -> latenight -> afternoon
        this.playerPos.set(-1.35, 1.78, 0.95);
        this.yaw = Math.PI / 2 - 0.38;
        this.pitch = -0.06;
        this.updateHUD();
      } else if (view === 'dahongpao-int') {
        this.weatherTime.cycleTime();
        this.weatherTime.cycleTime();
        this.playerPos.set(-11.45, 1.56, -0.85);
        this.yaw = -Math.PI / 2 + 0.08;
        this.pitch = -0.02;
        this.updateHUD();
      }
    }

    this.animate();
  }

  private bindEvents(): void {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Start buttons
    document.getElementById('btn-start-game')!.addEventListener('click', () => {
      this.startGame(true);
    });
    document.getElementById('btn-start-unlocked')!.addEventListener('click', () => {
      this.startGame(false);
    });
    document.getElementById('btn-start-google3d')!.addEventListener('click', () => {
      this.startGame(false);
      this.openGmapsModal();
    });

    // Pointer lock changes
    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === this.canvas;
      this.canvas.classList.toggle('locked', this.pointerLocked);
    });

    // Canvas mouse look (Pointer Lock OR drag fallback)
    this.canvas.addEventListener('mousedown', (e) => {
      if (!this.started || this.modalOpen) return;
      this.sound.init();
      if (this.dialogueOpen) {
        this.closeDialogue();
        return;
      }
      if (this.preferPointerLock && !this.pointerLocked) {
        this.canvas.requestPointerLock();
      } else {
        this.draggingLook = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      }
    });

    window.addEventListener('mouseup', () => {
      this.draggingLook = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.started || this.modalOpen) return;
      if (this.pointerLocked) {
        this.yaw -= e.movementX * 0.0022;
        this.pitch = THREE.MathUtils.clamp(this.pitch - e.movementY * 0.0022, -1.1, 1.1);
      } else if (this.draggingLook) {
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        this.yaw -= dx * 0.0045;
        this.pitch = THREE.MathUtils.clamp(this.pitch - dy * 0.0045, -1.1, 1.1);
      }
    });

    // Keyboard input
    window.addEventListener('keydown', (e) => {
      if (!this.started) return;
      const code = e.code;

      if (code === 'Tab') {
        e.preventDefault();
        this.toggleJournalModal();
        return;
      }

      if (code === 'Escape') {
        if (this.modalOpen) {
          this.closeAllModals();
        } else if (this.dialogueOpen) {
          this.closeDialogue();
        } else if (this.photoMode) {
          this.togglePhotoMode();
        }
        return;
      }

      if (this.modalOpen) return;

      this.keys.add(code);

      if (code === 'KeyE') {
        if (this.dialogueOpen) {
          this.closeDialogue();
        } else if (this.isSeated) {
          this.standUp();
        } else {
          this.triggerInteract();
        }
      } else if (code === 'Space') {
        if (this.isSeated) {
          this.standUp();
        } else if (this.isGrounded) {
          this.velocityY = 4.9;
          this.isGrounded = false;
        }
      } else if (code === 'KeyF') {
        this.eatHeldFood();
      } else if (code === 'KeyU') {
        this.toggleUmbrella();
      } else if (code === 'Digit1') {
        this.cycleTime();
      } else if (code === 'Digit2') {
        this.cycleWeather();
      } else if (code === 'KeyJ') {
        this.toggleJournalModal();
      } else if (code === 'KeyG') {
        this.openGmapsModal();
      } else if (code === 'KeyP') {
        this.togglePhotoMode();
      } else if (code === 'KeyM') {
        this.toggleMute();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    // Top-right HUD quick action buttons
    document.getElementById('btn-real-3d')!.addEventListener('click', () => {
      this.sound.init();
      this.openGmapsModal();
    });
    document.getElementById('btn-time')!.addEventListener('click', () => {
      this.sound.init();
      this.cycleTime();
    });
    document.getElementById('btn-weather')!.addEventListener('click', () => {
      this.sound.init();
      this.cycleWeather();
    });
    this.elBtnUmbrella.addEventListener('click', () => {
      this.sound.init();
      this.toggleUmbrella();
    });
    document.getElementById('btn-journal')!.addEventListener('click', () => {
      this.sound.init();
      this.toggleJournalModal();
    });
    document.getElementById('btn-photo')!.addEventListener('click', () => {
      this.sound.init();
      this.togglePhotoMode();
    });
    this.elBtnSound.addEventListener('click', () => {
      this.sound.init();
      this.toggleMute();
    });

    // Dialogue close
    this.elDialogueBox.addEventListener('click', () => this.closeDialogue());

    // Modal close buttons & backdrop
    document.getElementById('close-shop-modal')!.addEventListener('click', () => this.closeAllModals());
    document.getElementById('close-journal-modal')!.addEventListener('click', () => this.closeAllModals());
    document.getElementById('close-trivia-modal')!.addEventListener('click', () => this.closeAllModals());
    document.getElementById('close-gmaps-modal')!.addEventListener('click', () => this.closeAllModals());
    this.elModalBackdrop.addEventListener('click', (e) => {
      if (e.target === this.elModalBackdrop) this.closeAllModals();
    });

    // Google Maps 3D modal controls
    document.getElementById('btn-toggle-key-vis')!.addEventListener('click', () => {
      const isPwd = this.elInputGmapsKey.type === 'password';
      this.elInputGmapsKey.type = isPwd ? 'text' : 'password';
    });
    document.getElementById('btn-mode-map3d')!.addEventListener('click', () => {
      void this.handleSelectViewMode('map3d');
    });
    document.getElementById('btn-mode-3dtiles')!.addEventListener('click', () => {
      void this.handleSelectViewMode('3dtiles');
    });
    document.getElementById('btn-mode-alley')!.addEventListener('click', () => {
      void this.handleSelectViewMode('alley');
    });

    document.getElementById('btn-map3d-alley')!.addEventListener('click', () => {
      this.googleMap3D.flyToAlleyStreet();
    });
    document.getElementById('btn-map3d-campus')!.addEventListener('click', () => {
      this.googleMap3D.flyToCampusOverview();
    });
    document.getElementById('btn-map3d-basin')!.addEventListener('click', () => {
      this.googleMap3D.flyToTaipeiBasin();
    });
    document.getElementById('btn-map3d-back')!.addEventListener('click', () => {
      void this.switchViewMode('alley');
    });

    document.getElementById('tab-foods')!.addEventListener('click', () => {
      this.journalTab = 'foods';
      this.renderJournal();
    });
    document.getElementById('tab-landmarks')!.addEventListener('click', () => {
      this.journalTab = 'landmarks';
      this.renderJournal();
    });
  }

  private startGame(lockPointer: boolean): void {
    this.sound.init();
    this.sound.playUiClick();
    this.started = true;
    this.preferPointerLock = lockPointer;
    this.elStartOverlay.classList.add('hidden');
    this.elCrosshair.classList.remove('hidden');

    if (lockPointer) {
      try {
        this.canvas.requestPointerLock();
      } catch {
        // Fallback smoothly to drag mode if blocked
      }
    }

    this.showToast('歡迎來到文化大學光華路26巷！往前走就是牛肉拌麵與感恩麵店 🍜');
  }

  private cycleTime(): void {
    const t = this.weatherTime.cycleTime();
    this.sound.playUiClick();
    const msgMap = {
      afternoon: '切換為 ☀️ 午後晴朗：下課鐘響，學生湧入光華路！',
      sunset: '切換為 🌅 陽明山黃昏：夕陽把山城巷弄染成金橘色～',
      night: '切換為 🌙 華燈初上：紅燈籠與店面燈箱全亮起來了！',
      latenight: '切換為 🌌 深夜宵夜時段：最適合買包雞排配珍奶！',
    };
    this.showToast(msgMap[t]);
    this.updateHUD();
  }

  private cycleWeather(): void {
    const w = this.weatherTime.cycleWeather();
    this.sound.playUiClick();
    const msgMap = {
      breeze: '天候：🌤️ 山城微風，能見度極佳，巷尾看得到台北盆地！',
      fog: '天候：🌫️ 陽明山白牆大霧來襲！十步外只見牛肉拌麵燈箱發光！',
      wind: '天候：💨 文化十級強風吹起！小心撐傘會被吹歪！',
      rain: '天候：🌧️ 陽明山突來山雨！快按 [U] 撐起雨傘！',
    };
    this.showToast(msgMap[w]);
    if (w === 'fog') {
      this.unlockLandmark('fog-neon');
    }
    if (w === 'wind' && this.umbrellaOpen) {
      this.unlockLandmark('wind-umbrella');
    }
    this.updateHUD();
  }

  private toggleUmbrella(): void {
    this.umbrellaOpen = !this.umbrellaOpen;
    this.heldRig.setUmbrellaVisible(this.umbrellaOpen);
    this.sound.playUmbrellaToggle(this.umbrellaOpen);
    this.elBtnUmbrella.classList.toggle('active', this.umbrellaOpen);
    if (this.umbrellaOpen && this.weatherTime.weatherMode === 'wind') {
      this.unlockLandmark('wind-umbrella');
      this.showToast('💨 強風把傘吹得嘎嘎作響！抓緊傘柄啊華岡人！');
    } else {
      this.showToast(this.umbrellaOpen ? '☂️ 撐起雨傘，擋住山風與細雨' : '收起雨傘');
    }
  }

  private togglePhotoMode(): void {
    this.photoMode = !this.photoMode;
    this.elHudTop.classList.toggle('hidden', this.photoMode);
    this.elQuickActions.classList.toggle('hidden', this.photoMode);
    this.elControlsHint.classList.toggle('hidden', this.photoMode);
    this.elCrosshair.classList.toggle('hidden', this.photoMode);
    this.elPhotoExitHint.classList.toggle('hidden', !this.photoMode);
    if (this.photoMode) {
      this.elInteractPrompt.classList.add('hidden');
    }
  }

  private toggleMute(): void {
    const muted = this.sound.toggleMute();
    this.elBtnSound.textContent = muted ? '🔇 靜音' : '🔊 音效';
    this.showToast(muted ? '已關閉環境音效' : '已開啟光華路環境音效');
  }

  private triggerInteract(): void {
    if (!this.activeTarget) return;

    if (this.activeTarget.source === 'tiles-shop') {
      this.openShopModal(this.activeTarget.shop);
      return;
    }

    if (this.activeTarget.source === 'npc') {
      const npc = this.activeTarget.npc;
      this.sound.playUiClick();
      this.showDialogue(npc.speaker, this.npcManager.nextLine(npc));
      return;
    }

    const item = this.activeTarget.item;
    if (item.kind === 'shop' && item.shop) {
      this.openShopModal(item.shop);
    } else if (item.kind === 'soup' && item.shop?.hasFreeSoup) {
      this.drinkFreeSoup(item.shop);
    } else if (item.kind === 'seat') {
      this.sitDown(item);
    } else if (item.kind === 'viewpoint') {
      this.sound.playUiClick();
      this.unlockLandmark('basin-nightview');
      const isFog = this.weatherTime.weatherMode === 'fog';
      this.showDialogue(
        '山仔后景觀台',
        isFog
          ? '今天陽明山大霧把台北盆地蓋住變成一片白牆了⋯⋯不過霧氣朦朧別有一番詩意！試著按 [2] 切回微風看看夜景吧！'
          : '從文化大學旁俯瞰整個台北盆地與遠方閃亮的台北101，手裡拿著剛買的巷弄美食，這就是華岡人最棒的小確幸！'
      );
    } else if (item.kind === 'landmark-slope') {
      this.sound.playUiClick();
      this.unlockLandmark('enemy-slope');
      this.showDialogue(
        '仇人坡校園指標',
        '傳說情侶走過風大坡陡的仇人坡就會吵架⋯⋯不如一起轉身進光華路26巷吃碗熱騰騰牛肉拌麵最實在！'
      );
    } else if (item.kind === 'trivia') {
      this.openTriviaModal();
    }
  }

  private drinkFreeSoup(shop: ShopConfig): void {
    const soup = shop.hasFreeSoup!;
    this.sound.playEatSound(true);
    this.warmth = Math.min(100, this.warmth + soup.warmth);
    this.hunger = Math.min(100, this.hunger + soup.hunger);
    this.freeSoupsTasted.add(shop.id);
    this.showDialogue(`${shop.bossName}・${soup.potName}`, soup.comment);

    if (this.freeSoupsTasted.has('beef-noodle') && this.freeSoupsTasted.has('thanksgiving')) {
      this.unlockLandmark('free-soup-pro');
    }
    this.updateHUD();
  }

  private sitDown(seatItem: Interactable): void {
    this.sound.playUiClick();
    this.preSeatPos.copy(this.playerPos);
    this.isSeated = true;
    this.playerPos.set(seatItem.position.x, 1.15, seatItem.position.z);
    if (seatItem.seatLookAt) {
      const dx = seatItem.seatLookAt.x - this.playerPos.x;
      const dz = seatItem.seatLookAt.z - this.playerPos.z;
      this.yaw = Math.atan2(-dx, -dz);
      this.pitch = -0.05;
    }
    this.elSeatedBanner.classList.remove('hidden');
    this.showToast(this.heldFood ? '🪑 坐下來了！按 [F] 慢慢品嚐手中的美食' : '🪑 坐在路邊板凳休息吹風');
  }

  private standUp(): void {
    if (!this.isSeated) return;
    this.sound.playUiClick();
    this.isSeated = false;
    this.playerPos.copy(this.preSeatPos);
    this.elSeatedBanner.classList.add('hidden');
  }

  private openShopModal(shop: ShopConfig): void {
    this.sound.playUiClick();
    this.releasePointerIfLocked();
    this.modalOpen = true;
    this.keys.clear();

    document.getElementById('shop-modal-tag')!.textContent = shop.tag;
    document.getElementById('shop-modal-title')!.textContent = shop.name;
    document.getElementById('shop-modal-quote')!.textContent = shop.bossQuote;

    const grid = document.getElementById('shop-menu-grid')!;
    grid.innerHTML = '';

    shop.items.forEach((item) => {
      const discovered = this.discoveredFoods.has(item.id);
      const card = document.createElement('div');
      card.className = 'menu-item';
      card.innerHTML = `
        <div>
          <div class="menu-item-top">
            <h3>${item.emoji} ${item.name} ${discovered ? '✅' : ''}</h3>
            <span class="menu-price">NT$ ${item.price}</span>
          </div>
          <p class="menu-desc">${item.description}</p>
        </div>
        <div>
          <div class="menu-tags" style="margin-bottom: 10px;">
            <span class="menu-badge">飽足 +${item.hunger}</span>
            <span class="menu-badge">暖身 +${item.warmth}</span>
            ${item.spice ? `<span class="menu-badge">🌶️ 辣度 +${item.spice}</span>` : ''}
            ${item.coolsSpice ? `<span class="menu-badge">🧊 解辣</span>` : ''}
          </div>
          <button class="order-btn" ${this.money < item.price ? 'disabled' : ''}>
            ${this.money < item.price ? '餘額不足（找巷尾7-11學長賺飯錢）' : '點一份現做帶著吃'}
          </button>
        </div>
      `;
      card.querySelector('.order-btn')!.addEventListener('click', () => {
        this.purchaseItem(item);
      });
      grid.appendChild(card);
    });

    this.elModalBackdrop.classList.remove('hidden');
    this.elShopModal.classList.remove('hidden');
    this.elJournalModal.classList.add('hidden');
    this.elTriviaModal.classList.add('hidden');
    this.elGmapsModal.classList.add('hidden');
  }

  private purchaseItem(item: MenuItem): void {
    if (this.money < item.price) return;
    this.money -= item.price;
    this.heldFood = item;
    this.heldBites = 3;
    this.heldRig.setHeldFood(item);
    this.discoveredFoods.add(item.id);
    this.sound.playOrderSuccess();

    this.closeAllModals();
    this.updateHUD();
    this.showToast(`🎉 買到了 ${item.emoji} ${item.name}！按 [F] 開動（也可以找板凳坐下吃）`);
  }

  private eatHeldFood(): void {
    if (!this.heldFood || this.heldBites <= 0) return;

    const item = this.heldFood;
    const isDrink = item.heldShape === 'drink';
    this.sound.playEatSound(isDrink);
    this.heldRig.triggerEatAnim();

    const ratio = 1 / 3;
    this.hunger = Math.min(100, this.hunger + Math.round(item.hunger * ratio));
    this.warmth = Math.min(100, this.warmth + Math.round(item.warmth * ratio));

    if (item.spice) {
      this.spice = Math.min(100, this.spice + Math.round(item.spice * ratio));
    }
    if (item.coolsSpice) {
      this.spice = Math.max(0, this.spice - 32);
    }

    this.heldBites -= 1;
    if (this.heldBites <= 0) {
      this.showToast(`${item.emoji} ${item.eatComment}`);
      if (item.id === 'five-x-spicy') {
        this.unlockLandmark('five-x-hero');
      }
      this.heldFood = null;
      this.heldRig.setHeldFood(null);
    } else {
      this.showToast(`${item.emoji} ${isDrink ? '喝了一大口' : '吃了一大口'}（還剩 ${this.heldBites} 口）`);
    }

    this.updateHUD();
  }

  private toggleJournalModal(): void {
    if (this.modalOpen && !this.elJournalModal.classList.contains('hidden')) {
      this.closeAllModals();
      return;
    }
    this.sound.playUiClick();
    this.releasePointerIfLocked();
    this.modalOpen = true;
    this.keys.clear();

    this.renderJournal();
    this.elModalBackdrop.classList.remove('hidden');
    this.elJournalModal.classList.remove('hidden');
    this.elShopModal.classList.add('hidden');
    this.elTriviaModal.classList.add('hidden');
    this.elGmapsModal.classList.add('hidden');
  }

  private renderJournal(): void {
    document.getElementById('count-foods')!.textContent = `${this.discoveredFoods.size}/${this.totalFoodsCount}`;
    document.getElementById('count-landmarks')!.textContent = `${this.discoveredLandmarks.size}/${LANDMARKS.length}`;

    document.getElementById('tab-foods')!.classList.toggle('active', this.journalTab === 'foods');
    document.getElementById('tab-landmarks')!.classList.toggle('active', this.journalTab === 'landmarks');

    const content = document.getElementById('journal-content')!;
    content.innerHTML = '';

    if (this.journalTab === 'foods') {
      SHOPS.forEach((shop) => {
        shop.items.forEach((item) => {
          const unlocked = this.discoveredFoods.has(item.id);
          const card = document.createElement('div');
          card.className = `journal-card ${unlocked ? 'unlocked' : 'locked'}`;
          card.innerHTML = `
            <h4>${item.emoji} ${item.name} ${unlocked ? '✓' : ''}</h4>
            <p style="margin-bottom:4px; color:#ffd166;">${shop.signText} ・ NT$ ${item.price}</p>
            <p>${unlocked ? item.description : '尚未品嚐：前往該店家點餐即可解鎖圖鑑！'}</p>
          `;
          content.appendChild(card);
        });
      });
    } else {
      LANDMARKS.forEach((lm) => {
        const unlocked = this.discoveredLandmarks.has(lm.id);
        const card = document.createElement('div');
        card.className = `journal-card ${unlocked ? 'unlocked' : 'locked'}`;
        card.innerHTML = `
          <h4>${unlocked ? '📍' : '🔒'} ${lm.title}</h4>
          <p>${unlocked ? lm.rewardText : `解鎖線索：${lm.hint}`}</p>
        `;
        content.appendChild(card);
      });
    }
  }

  private openTriviaModal(): void {
    this.sound.playUiClick();
    this.releasePointerIfLocked();
    this.modalOpen = true;
    this.keys.clear();

    const q = TRIVIA_QUESTIONS[this.answeredTriviaCount % TRIVIA_QUESTIONS.length];
    this.activeTrivia = q;

    const body = document.getElementById('trivia-body')!;
    body.innerHTML = `
      <div class="trivia-question">${q.question}</div>
      <div class="trivia-options"></div>
    `;
    const optContainer = body.querySelector('.trivia-options')!;
    q.options.forEach((optText, idx) => {
      const btn = document.createElement('button');
      btn.className = 'trivia-opt';
      btn.textContent = `${idx + 1}. ${optText}`;
      btn.addEventListener('click', () => {
        if (!this.activeTrivia) return;
        if (idx === this.activeTrivia.correctIndex) {
          this.money += this.activeTrivia.reward;
          this.answeredTriviaCount += 1;
          this.sound.playAchievement();
          this.showToast(`🎉 ${this.activeTrivia.explanation}（獲得 NT$ ${this.activeTrivia.reward}！）`);
          this.updateHUD();
          this.closeAllModals();
        } else {
          this.sound.playUiClick();
          btn.style.borderColor = '#ef4444';
          btn.textContent = `${optText}（再想想看喔～）`;
        }
      });
      optContainer.appendChild(btn);
    });

    this.elModalBackdrop.classList.remove('hidden');
    this.elTriviaModal.classList.remove('hidden');
    this.elShopModal.classList.add('hidden');
    this.elJournalModal.classList.add('hidden');
    this.elGmapsModal.classList.add('hidden');
  }

  private openGmapsModal(): void {
    this.sound.playUiClick();
    this.releasePointerIfLocked();
    this.modalOpen = true;
    this.keys.clear();

    const saved = getSavedGoogleMapsApiKey();
    if (!this.elInputGmapsKey.value && saved) {
      this.elInputGmapsKey.value = saved;
    }
    this.updateModeButtonsUI();

    this.elModalBackdrop.classList.remove('hidden');
    this.elGmapsModal.classList.remove('hidden');
    this.elShopModal.classList.add('hidden');
    this.elJournalModal.classList.add('hidden');
    this.elTriviaModal.classList.add('hidden');
  }

  private setGmapsStatus(msg: string, isError = false): void {
    this.elGmapsStatus.textContent = msg;
    this.elGmapsStatus.classList.remove('hidden');
    this.elGmapsStatus.classList.toggle('error', isError);
  }

  private updateModeButtonsUI(): void {
    document.getElementById('btn-mode-map3d')!.classList.toggle('active', this.viewMode === 'map3d');
    document.getElementById('btn-mode-3dtiles')!.classList.toggle('active', this.viewMode === '3dtiles');
    document.getElementById('btn-mode-alley')!.classList.toggle('active', this.viewMode === 'alley');
  }

  private async handleSelectViewMode(targetMode: ViewMode): Promise<void> {
    if (targetMode === 'alley') {
      await this.switchViewMode('alley');
      this.closeAllModals();
      return;
    }

    const enteredKey = this.elInputGmapsKey.value.trim() || getSavedGoogleMapsApiKey();
    if (!enteredKey) {
      this.setGmapsStatus('請先貼上 Google Maps API Key（可用免費 Maps Demo Key 體驗 Google 3D 實景地圖模式！）', true);
      return;
    }

    const { changedAfterLoad } = saveGoogleMapsApiKey(enteredKey);
    if (changedAfterLoad) {
      this.setGmapsStatus('偵測到更換新的 API Key，正在重新載入頁面套用設定…');
      setTimeout(() => window.location.reload(), 650);
      return;
    }

    try {
      this.setGmapsStatus('正在連線 Google Maps Platform 並定位文化大學光華路26巷…');
      await this.switchViewMode(targetMode, enteredKey);
      this.closeAllModals();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.setGmapsStatus(`載入失敗：${msg}`, true);
    }
  }

  private async switchViewMode(targetMode: ViewMode, apiKey?: string): Promise<void> {
    if (targetMode === 'alley') {
      this.googleMap3D.unmount();
      this.elGoogleMap3DContainer.classList.add('hidden');
      this.elGoogleMap3DControls.classList.add('hidden');
      this.elGoogleAttributionBar.classList.add('hidden');
      this.google3DTiles.setVisible(false);
      this.alley.rootGroup.visible = true;
      this.npcManager.group.visible = true;
      if (this.viewMode === '3dtiles') {
        this.playerPos.set(0, 1.65, 22.8);
      }
      this.viewMode = 'alley';
      this.elCrosshair.classList.toggle('hidden', this.photoMode);
      this.updateModeButtonsUI();
      this.showToast('🏘️ 已切換為離線街景模式');
      return;
    }

    const key = apiKey || getSavedGoogleMapsApiKey();
    if (!key) {
      this.openGmapsModal();
      return;
    }

    if (targetMode === 'map3d') {
      this.releasePointerIfLocked();
      this.google3DTiles.setVisible(false);
      this.elGoogleAttributionBar.classList.add('hidden');
      this.elCrosshair.classList.add('hidden');
      this.elInteractPrompt.classList.add('hidden');
      this.elGoogleMap3DContainer.classList.remove('hidden');
      this.elGoogleMap3DControls.classList.remove('hidden');
      this.viewMode = 'map3d';
      this.updateModeButtonsUI();
      await this.googleMap3D.mount(key);
      return;
    }

    // targetMode === '3dtiles'
    this.googleMap3D.unmount();
    this.elGoogleMap3DContainer.classList.add('hidden');
    this.elGoogleMap3DControls.classList.add('hidden');
    this.alley.rootGroup.visible = false;
    this.npcManager.group.visible = false;
    this.elGoogleAttributionBar.classList.remove('hidden');
    this.elCrosshair.classList.toggle('hidden', this.photoMode);
    this.viewMode = '3dtiles';
    this.updateModeButtonsUI();

    await this.google3DTiles.mount(key);
    this.google3DTiles.setVisible(true);
    this.playerPos.set(0, 18, 0);
  }

  private closeAllModals(): void {
    this.modalOpen = false;
    this.elModalBackdrop.classList.add('hidden');
    this.elShopModal.classList.add('hidden');
    this.elJournalModal.classList.add('hidden');
    this.elTriviaModal.classList.add('hidden');
    this.elGmapsModal.classList.add('hidden');
    if (this.preferPointerLock && this.started && this.viewMode !== 'map3d') {
      try {
        this.canvas.requestPointerLock();
      } catch {
        // ignore
      }
    }
  }

  private releasePointerIfLocked(): void {
    if (document.pointerLockElement === this.canvas) {
      document.exitPointerLock();
    }
  }

  private showDialogue(speaker: string, text: string): void {
    this.dialogueOpen = true;
    this.elDialogueSpeaker.textContent = speaker;
    this.elDialogueText.textContent = text;
    this.elDialogueBox.classList.remove('hidden');
  }

  private closeDialogue(): void {
    this.dialogueOpen = false;
    this.elDialogueBox.classList.add('hidden');
  }

  private unlockLandmark(id: string): void {
    if (this.discoveredLandmarks.has(id)) return;
    this.discoveredLandmarks.add(id);
    const lm = LANDMARKS.find((l) => l.id === id);
    if (lm) {
      this.sound.playAchievement();
      this.showToast(`🏆 文化打卡解鎖：【${lm.title}】`);
    }
  }

  private showToast(text: string): void {
    const el = document.createElement('div');
    el.className = 'toast-msg';
    el.textContent = text;
    this.elToastContainer.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.3s ease';
      setTimeout(() => el.remove(), 320);
    }, 3400);
  }

  private updateHUD(): void {
    const env = this.weatherTime.getEnvInfo();
    this.elEnvStatus.textContent = `${env.timeLabel} ・ ${env.weatherLabel} (${env.tempC}°C)`;
    this.elMoney.textContent = `NT$ ${this.money}`;
    this.elHungerNum.textContent = `${Math.round(this.hunger)}%`;
    this.elHungerBar.style.width = `${Math.max(0, Math.min(100, this.hunger))}%`;
    this.elWarmthNum.textContent = `${Math.round(this.warmth)}%`;
    this.elWarmthBar.style.width = `${Math.max(0, Math.min(100, this.warmth))}%`;
    this.elJournalCount.textContent = `${this.discoveredFoods.size} / ${this.totalFoodsCount}`;

    if (this.heldFood && this.heldBites > 0) {
      this.elHeldCard.classList.remove('hidden');
      this.elHeldEmoji.textContent = this.heldFood.emoji;
      this.elHeldName.textContent = this.heldFood.name;
      this.elHeldSub.textContent = this.heldFood.description.slice(0, 26) + '…';
      this.elHeldBites.textContent = String(this.heldBites);
    } else {
      this.elHeldCard.classList.add('hidden');
    }

    // Screen weather / spice vignettes
    this.elRainVignette.style.opacity = this.umbrellaOpen ? '0.15' : String(env.rainIntensity * 0.85);
    this.elSpiceVignette.style.opacity = String((this.spice / 100) * 0.9);
    this.elColdVignette.style.opacity = this.warmth < 35 ? String(((35 - this.warmth) / 35) * 0.8) : '0';
  }

  private updatePlayerMovement(dt: number, elapsed: number): void {
    const env = this.weatherTime.getEnvInfo();
    if (!this.started || this.modalOpen || this.isSeated || this.viewMode === 'map3d') {
      this.camera.position.copy(this.playerPos);
      this.camera.rotation.set(this.pitch, this.yaw, 0);
      this.heldRig.update(dt, elapsed, env.windStrength, false);
      return;
    }

    const forwardInput =
      (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0) -
      (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0);
    const strafeInput =
      (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0) -
      (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0);

    const sprinting = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    const windPenalty = this.umbrellaOpen && env.windStrength > 0.7 ? 0.82 : 1.0;
    const baseSpeed =
      (this.viewMode === '3dtiles'
        ? sprinting
          ? 10.5
          : 5.2
        : sprinting
          ? 6.2
          : 3.9) * windPenalty;

    const moveDir = new THREE.Vector3();
    if (forwardInput !== 0 || strafeInput !== 0) {
      const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
      const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
      moveDir.addScaledVector(forward, forwardInput);
      moveDir.addScaledVector(right, strafeInput);
      moveDir.normalize();
      this.sound.playFootstep(sprinting);
    }

    if (this.viewMode === '3dtiles') {
      this.playerPos.x += moveDir.x * baseSpeed * dt;
      this.playerPos.z += moveDir.z * baseSpeed * dt;
    } else {
      // Separate X and Z collision resolution for smooth sliding
      const radius = 0.42;
      const nextX = this.playerPos.x + moveDir.x * baseSpeed * dt;
      if (!this.collidesWithWorld(nextX, this.playerPos.z, radius, this.alley.colliders)) {
        this.playerPos.x = nextX;
      }
      const nextZ = this.playerPos.z + moveDir.z * baseSpeed * dt;
      if (!this.collidesWithWorld(this.playerPos.x, nextZ, radius, this.alley.colliders)) {
        this.playerPos.z = nextZ;
      }
    }

    // Gravity & ground height following (Google 3D Tiles raycast OR 仇人坡 ramp)
    let groundY = this.playerPos.y;
    if (this.viewMode === '3dtiles') {
      const rayStartY = this.google3DTiles.loadedFirstTile ? this.playerPos.y + 3.0 : 250;
      const tileGround = this.google3DTiles.sampleGroundHeight(this.playerPos.x, this.playerPos.z, rayStartY);
      groundY = tileGround !== null ? tileGround + 1.65 : this.playerPos.y;
    } else {
      groundY = this.alley.getGroundHeight(this.playerPos.z, this.playerPos.x) + 1.65;
    }

    if (!this.isGrounded || this.playerPos.y > groundY + 0.01) {
      this.velocityY -= 14.5 * dt;
      this.playerPos.y += this.velocityY * dt;
      if (this.playerPos.y <= groundY) {
        this.playerPos.y = groundY;
        this.velocityY = 0;
        this.isGrounded = true;
      }
    } else {
      this.playerPos.y = THREE.MathUtils.lerp(this.playerPos.y, groundY, Math.min(1, dt * 15));
    }

    // Subtle walking head-bob
    const isMoving = moveDir.lengthSq() > 0.01 && this.isGrounded;
    const bobOffset = isMoving ? Math.sin(elapsed * (sprinting ? 13 : 9)) * 0.032 : 0;

    this.camera.position.set(this.playerPos.x, this.playerPos.y + bobOffset, this.playerPos.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0);
    this.heldRig.update(dt, elapsed, env.windStrength, isMoving);
  }

  private collidesWithWorld(x: number, z: number, radius: number, boxes: AABB[]): boolean {
    for (const box of boxes) {
      if (
        x + radius > box.minX &&
        x - radius < box.maxX &&
        z + radius > box.minZ &&
        z - radius < box.maxZ
      ) {
        return true;
      }
    }
    return false;
  }

  private updateInteractables(): void {
    if (!this.started || this.modalOpen || this.photoMode || this.isSeated || this.viewMode === 'map3d') {
      this.activeTarget = null;
      this.elInteractPrompt.classList.add('hidden');
      this.elCrosshair.classList.remove('active');
      return;
    }

    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    let bestScore = Infinity;
    let bestTarget: ActiveTarget | null = null;

    if (this.viewMode === '3dtiles') {
      for (const m of this.google3DTiles.markers) {
        const dx = m.position.x - this.playerPos.x;
        const dz = m.position.z - this.playerPos.z;
        const dist = Math.hypot(dx, dz);
        if (dist <= 6.5) {
          const dir = new THREE.Vector3(dx, 0, dz).normalize();
          const dot = forward.dot(dir);
          const score = dist - dot * 1.1;
          if (score < bestScore) {
            bestScore = score;
            bestTarget = { source: 'tiles-shop', shop: m.shop, distance: dist };
          }
        }
      }
    } else {
      for (const item of this.alley.interactables) {
        const dx = item.position.x - this.playerPos.x;
        const dz = item.position.z - this.playerPos.z;
        const dist = Math.hypot(dx, dz);
        if (dist <= item.radius) {
          const dir = new THREE.Vector3(dx, 0, dz).normalize();
          const dot = forward.dot(dir);
          // Prefer items in front of camera
          const score = dist - dot * 1.1;
          if (score < bestScore) {
            bestScore = score;
            bestTarget = { source: 'world', item, distance: dist };
          }
        }
      }

      const nearNpc = this.npcManager.findNearest(this.playerPos, 2.7);
      if (nearNpc) {
        const dist = nearNpc.mesh.position.distanceTo(this.playerPos);
        if (dist < bestScore) {
          bestTarget = { source: 'npc', npc: nearNpc, distance: dist };
        }
      }
    }

    this.activeTarget = bestTarget;
    if (bestTarget) {
      const label =
        bestTarget.source === 'world'
          ? bestTarget.item.label
          : bestTarget.source === 'tiles-shop'
            ? `向【${bestTarget.shop.name}】點餐`
            : `與【${bestTarget.npc.speaker}】聊天`;
      this.elInteractLabel.textContent = label;
      this.elInteractPrompt.classList.remove('hidden');
      this.elCrosshair.classList.add('active');
    } else {
      this.elInteractPrompt.classList.add('hidden');
      this.elCrosshair.classList.remove('active');
    }
  }

  private updateStatsSlowly(dt: number): void {
    if (!this.started || this.modalOpen) return;
    const env = this.weatherTime.getEnvInfo();

    // Very gentle lifestyle drain
    this.hunger = Math.max(5, this.hunger - dt * 0.22);
    const rainColdFactor = env.rainIntensity > 0.3 && !this.umbrellaOpen ? 0.65 : 0.16;
    const windColdFactor = env.windStrength * 0.22;
    this.warmth = Math.max(8, this.warmth - dt * (rainColdFactor + windColdFactor));

    if (this.spice > 0) {
      this.spice = Math.max(0, this.spice - dt * 3.5);
    }

    // Periodically refresh HUD bars smoothly
    if (Math.random() < dt * 2.5) {
      this.updateHUD();
    }
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);
    const dt = Math.min(0.05, this.clock.getDelta());
    const elapsed = this.clock.elapsedTime;

    this.weatherTime.update(dt, elapsed, this.playerPos);
    const env = this.weatherTime.getEnvInfo();
    this.sound.updateAmbience(env.windStrength, env.rainIntensity, this.umbrellaOpen);

    if (this.viewMode !== 'map3d') {
      if (this.viewMode === 'alley') {
        this.npcManager.update(dt, elapsed, env.rainIntensity, env.windStrength, this.playerPos);
      } else if (this.viewMode === '3dtiles') {
        this.google3DTiles.update(this.camera, this.renderer, elapsed);
        if (Math.floor(elapsed * 2) !== Math.floor((elapsed - dt) * 2)) {
          const attr = this.google3DTiles.getAttributionsText();
          if (attr) {
            this.elGoogleAttributionText.textContent = attr;
          }
        }
      }
      this.updatePlayerMovement(dt, elapsed);
      this.updateInteractables();
      this.renderer.render(this.scene, this.camera);
    }

    this.updateStatsSlowly(dt);
  };
}
