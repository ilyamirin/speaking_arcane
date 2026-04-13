import Phaser from "phaser";
import { interfaceAudio } from "../ui/audio";

const FOOTER_SCENE_KEY = "witch-board-footer";
const FOOTER_TEXTURE_KEY = "witch-board-surface";
const FOOTER_TEXTURE_URL = "/footer-textures/witch-board-surface.png";
const FOOTER_SCENE_WIDTH = 720;
const FOOTER_SCENE_HEIGHT = 420;
const VERDICT_STORAGE_KEY = "speaking-arcanes:footer-last-verdict";
const HOME_X = FOOTER_SCENE_WIDTH / 2;
const HOME_Y = FOOTER_SCENE_HEIGHT * 0.56;

type FooterPhase = "idle" | "moving" | "revealed" | "resetting";

interface GlyphAnchor {
  id: string;
  label: string;
  x: number;
  y: number;
}

interface VerdictWord {
  id: string;
  text: string;
  glyphSequence: [GlyphAnchor["id"], GlyphAnchor["id"], GlyphAnchor["id"]];
}

interface FooterBoardSceneData {
  reducedMotion: boolean;
}

interface GlyphView {
  anchor: GlyphAnchor;
  dot: Phaser.GameObjects.Arc;
  ring: Phaser.GameObjects.Arc;
  text: Phaser.GameObjects.Text;
}

const glyphAnchors: GlyphAnchor[] = [
  { id: "zh", label: "Ж", x: 118, y: 110 },
  { id: "d", label: "Д", x: 228, y: 110 },
  { id: "i", label: "И", x: 338, y: 110 },
  { id: "s", label: "С", x: 448, y: 110 },
  { id: "to", label: "ТО", x: 560, y: 110 },
  { id: "p", label: "П", x: 94, y: 170 },
  { id: "pi", label: "ПИ", x: 194, y: 170 },
  { id: "sh", label: "Ш", x: 294, y: 170 },
  { id: "smo", label: "СМО", x: 394, y: 170 },
  { id: "t", label: "Т", x: 494, y: 170 },
  { id: "ri", label: "РИ", x: 594, y: 170 },
  { id: "mo", label: "МО", x: 118, y: 246 },
  { id: "l", label: "Л", x: 214, y: 246 },
  { id: "chi", label: "ЧИ", x: 310, y: 246 },
  { id: "ot", label: "ОТ", x: 406, y: 246 },
  { id: "pus", label: "ПУС", x: 502, y: 246 },
  { id: "ti", label: "ТИ", x: 598, y: 246 },
  { id: "sp", label: "СП", x: 118, y: 314 },
  { id: "ro", label: "РО", x: 230, y: 314 },
  { id: "si", label: "СИ", x: 342, y: 314 },
  { id: "se", label: "СЕ", x: 454, y: 314 },
  { id: "b", label: "Б", x: 566, y: 314 },
  { id: "ya", label: "Я", x: 646, y: 246 }
];

const verdictWords: VerdictWord[] = [
  { id: "wait", text: "ЖДИ", glyphSequence: ["zh", "d", "i"] },
  { id: "stop", text: "СТОП", glyphSequence: ["s", "to", "p"] },
  { id: "write", text: "ПИШИ", glyphSequence: ["pi", "sh", "i"] },
  { id: "watch", text: "СМОТРИ", glyphSequence: ["smo", "t", "ri"] },
  { id: "silence", text: "МОЛЧИ", glyphSequence: ["mo", "l", "chi"] },
  { id: "release", text: "ОТПУСТИ", glyphSequence: ["ot", "pus", "ti"] },
  { id: "ask", text: "СПРОСИ", glyphSequence: ["sp", "ro", "si"] },
  { id: "self", text: "СЕБЯ", glyphSequence: ["se", "b", "ya"] }
];

const glyphById = new Map(glyphAnchors.map((glyph) => [glyph.id, glyph]));
let inMemoryLastVerdictId: string | null = null;

function readStoredVerdict(): string | null {
  try {
    return window.localStorage.getItem(VERDICT_STORAGE_KEY);
  } catch {
    return inMemoryLastVerdictId;
  }
}

function storeVerdict(id: string): void {
  inMemoryLastVerdictId = id;

  try {
    window.localStorage.setItem(VERDICT_STORAGE_KEY, id);
  } catch {
    return;
  }
}

function chooseVerdict(excludedId: string | null): VerdictWord {
  const pool = verdictWords.filter((word) => word.id !== excludedId);
  const source = pool.length > 0 ? pool : verdictWords;
  const index = Math.floor(Math.random() * source.length);
  return source[index] ?? verdictWords[0];
}

class FooterBoardScene extends Phaser.Scene {
  private reducedMotion = false;

  private glyphViews = new Map<string, GlyphView>();

  private ready = false;

  private planchette!: Phaser.GameObjects.Container;

  private verdictGlow!: Phaser.GameObjects.Ellipse;

  private guideLine!: Phaser.GameObjects.Rectangle;

  private homeHalo!: Phaser.GameObjects.Ellipse;

  constructor() {
    super(FOOTER_SCENE_KEY);
  }

  init(data: FooterBoardSceneData): void {
    this.reducedMotion = data.reducedMotion;
  }

  preload(): void {
    if (!this.textures.exists(FOOTER_TEXTURE_KEY)) {
      this.load.image(FOOTER_TEXTURE_KEY, FOOTER_TEXTURE_URL);
    }
  }

  create(): void {
    this.drawBoardSurface();
    this.drawGlyphs();
    this.drawHomeHalo();
    this.drawPlanchette();
    this.drawVerdictGlow();

    if (!this.reducedMotion) {
      this.tweens.add({
        targets: this.homeHalo,
        alpha: { from: 0.06, to: 0.16 },
        yoyo: true,
        repeat: -1,
        duration: 2600,
        ease: "Sine.InOut"
      });
    }

    this.ready = true;
  }

  isReady(): boolean {
    return this.ready;
  }

  setHighlightedGlyphs(activeIds: string[]): void {
    const active = new Set(activeIds);

    this.glyphViews.forEach((view, id) => {
      const isActive = active.has(id);
      view.text.setColor(isActive ? "#f7efe6" : "#ab9f95");
      view.text.setAlpha(isActive ? 1 : 0.66);
      view.dot.setFillStyle(isActive ? 0xa87768 : 0xc9b9a8, isActive ? 0.84 : 0.18);
      view.ring.setStrokeStyle(isActive ? 2 : 1, isActive ? 0xe2c4a9 : 0x5d4b46, isActive ? 0.88 : 0.4);
      view.ring.setScale(isActive ? 1.08 : 1);
    });
  }

  setVerdictGlow(visible: boolean): void {
    this.verdictGlow.setAlpha(visible ? 1 : 0);
    this.guideLine.setAlpha(visible ? 0.65 : 0.3);
  }

  animateKnock(glyphId: string, isFinal: boolean, onComplete: () => void): void {
    const anchor = glyphById.get(glyphId);
    if (!anchor) {
      onComplete();
      return;
    }

    const targetX = anchor.x;
    const targetY = anchor.y + 14;
    const duration = this.reducedMotion ? 320 : 620;

    this.tweens.killTweensOf(this.planchette);
    this.planchette.setDepth(8);

    this.tweens.add({
      targets: this.planchette,
      x: targetX,
      y: targetY,
      angle: Phaser.Math.Clamp((targetX - HOME_X) * 0.024, -10, 10),
      scaleX: isFinal ? 1.01 : 1,
      scaleY: isFinal ? 1.01 : 1,
      duration,
      ease: this.reducedMotion ? "Quad.Out" : "Cubic.Out",
      onComplete: () => {
        this.flashAt(anchor.x, anchor.y);
        onComplete();
      }
    });
  }

  animateReset(onComplete: () => void): void {
    this.tweens.killTweensOf(this.planchette);
    this.setVerdictGlow(false);

    this.tweens.add({
      targets: this.planchette,
      x: HOME_X,
      y: HOME_Y,
      angle: 0,
      scaleX: 1,
      scaleY: 1,
      duration: this.reducedMotion ? 220 : 360,
      ease: "Sine.Out",
      onComplete
    });
  }

  private drawBoardSurface(): void {
    this.add
      .rectangle(FOOTER_SCENE_WIDTH / 2, FOOTER_SCENE_HEIGHT / 2, FOOTER_SCENE_WIDTH, FOOTER_SCENE_HEIGHT, 0x080709, 1)
      .setAlpha(0.98);

    const board = this.add.graphics();
    board.fillStyle(0x0e0d11, 0.96);
    board.lineStyle(1, 0x302728, 0.92);
    board.fillRoundedRect(34, 22, FOOTER_SCENE_WIDTH - 68, FOOTER_SCENE_HEIGHT - 44, 28);
    board.strokeRoundedRect(34, 22, FOOTER_SCENE_WIDTH - 68, FOOTER_SCENE_HEIGHT - 44, 28);

    if (this.textures.exists(FOOTER_TEXTURE_KEY)) {
      this.add
        .image(FOOTER_SCENE_WIDTH / 2, FOOTER_SCENE_HEIGHT / 2, FOOTER_TEXTURE_KEY)
        .setDisplaySize(FOOTER_SCENE_WIDTH - 72, FOOTER_SCENE_HEIGHT - 48)
        .setAlpha(0.24);
    }

    const veil = this.add.graphics();
    veil.fillStyle(0x0b0a0d, 0.5);
    veil.fillRoundedRect(36, 24, FOOTER_SCENE_WIDTH - 72, FOOTER_SCENE_HEIGHT - 48, 28);

    const ornaments = this.add.graphics();
    ornaments.lineStyle(1, 0x4e403d, 0.38);
    ornaments.strokeRoundedRect(56, 44, FOOTER_SCENE_WIDTH - 112, FOOTER_SCENE_HEIGHT - 88, 24);
    ornaments.strokeCircle(FOOTER_SCENE_WIDTH / 2, FOOTER_SCENE_HEIGHT / 2 + 10, 122);
    ornaments.strokeCircle(FOOTER_SCENE_WIDTH / 2, FOOTER_SCENE_HEIGHT / 2 + 10, 164);
    ornaments.strokeCircle(156, 212, 88);
    ornaments.strokeCircle(564, 212, 88);
    ornaments.lineStyle(1, 0x5a4b47, 0.26);
    ornaments.beginPath();
    ornaments.moveTo(124, 86);
    ornaments.lineTo(596, 86);
    ornaments.moveTo(96, 344);
    ornaments.lineTo(624, 344);
    ornaments.moveTo(360, 68);
    ornaments.lineTo(360, 352);
    ornaments.strokePath();

    this.guideLine = this.add
      .rectangle(FOOTER_SCENE_WIDTH / 2, FOOTER_SCENE_HEIGHT - 70, 264, 1, 0xa97e71, 0.3)
      .setOrigin(0.5)
      .setAlpha(0.3);
  }

  private drawGlyphs(): void {
    glyphAnchors.forEach((anchor) => {
      const ring = this.add.circle(anchor.x, anchor.y + 18, 24, 0x000000, 0).setStrokeStyle(1, 0x5d4b46, 0.4);
      const dot = this.add.circle(anchor.x, anchor.y + 18, 3.6, 0xc9b9a8, 0.18);
      const text = this.add
        .text(anchor.x, anchor.y - 4, anchor.label, {
          fontFamily: '"Instrument Serif", serif',
          fontSize: anchor.label.length > 2 ? "21px" : "25px",
          color: "#ab9f95",
          align: "center"
        })
        .setOrigin(0.5)
        .setAlpha(0.66);

      this.glyphViews.set(anchor.id, { anchor, dot, ring, text });
    });
  }

  private drawHomeHalo(): void {
    this.homeHalo = this.add
      .ellipse(HOME_X, HOME_Y + 14, 126, 126, 0xa67869, 0.08)
      .setBlendMode(Phaser.BlendModes.SCREEN);
  }

  private drawPlanchette(): void {
    const body = this.add.ellipse(0, 0, 92, 118, 0xd7cabd, 0.08).setStrokeStyle(2, 0xd9c9b5, 0.76);
    const inner = this.add.ellipse(0, 12, 34, 34, 0x0b0a0d, 0.94).setStrokeStyle(1, 0xd9c9b5, 0.5);
    const pointer = this.add.triangle(0, 36, 0, 0, 15, 18, -15, 18, 0xd9c9b5, 0.22);
    const gloss = this.add.ellipse(-10, -24, 42, 18, 0xffffff, 0.08);
    const footLeft = this.add.circle(-22, 38, 3, 0xdbcbb9, 0.42);
    const footRight = this.add.circle(22, 38, 3, 0xdbcbb9, 0.42);

    this.planchette = this.add.container(HOME_X, HOME_Y, [body, pointer, inner, gloss, footLeft, footRight]);
    this.planchette.setDepth(8);
  }

  private drawVerdictGlow(): void {
    this.verdictGlow = this.add
      .ellipse(FOOTER_SCENE_WIDTH / 2, FOOTER_SCENE_HEIGHT - 82, 260, 48, 0x8c5f56, 0.18)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setAlpha(0);
  }

  private flashAt(x: number, y: number): void {
    const pulse = this.add.circle(x, y + 18, 8, 0xe0c7aa, 0.32).setBlendMode(Phaser.BlendModes.SCREEN);

    this.tweens.add({
      targets: pulse,
      scale: this.reducedMotion ? 1.2 : 2.4,
      alpha: 0,
      duration: this.reducedMotion ? 160 : 320,
      ease: "Sine.Out",
      onComplete: () => pulse.destroy()
    });
  }
}

class FooterBoardCanvas {
  private game: Phaser.Game;

  constructor(private container: HTMLElement, reducedMotion: boolean) {
    this.game = new Phaser.Game({
      type: Phaser.CANVAS,
      width: FOOTER_SCENE_WIDTH,
      height: FOOTER_SCENE_HEIGHT,
      parent: container,
      transparent: true,
      backgroundColor: "#09090b",
      banner: false,
      scene: [FooterBoardScene],
      scale: {
        mode: Phaser.Scale.NONE,
        width: FOOTER_SCENE_WIDTH,
        height: FOOTER_SCENE_HEIGHT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      render: {
        antialias: true,
        pixelArt: false,
        transparent: true
      },
      callbacks: {
        postBoot: (game) => {
          game.scene.start(FOOTER_SCENE_KEY, { reducedMotion });
        }
      }
    });
  }

  setHighlightedGlyphs(ids: string[]): void {
    this.withScene((scene) => {
      scene.setHighlightedGlyphs(ids);
    });
  }

  setVerdictGlow(visible: boolean): void {
    this.withScene((scene) => {
      scene.setVerdictGlow(visible);
    });
  }

  animateKnock(glyphId: string, isFinal: boolean, onComplete: () => void): void {
    this.withScene((scene) => {
      scene.animateKnock(glyphId, isFinal, onComplete);
    });
  }

  animateReset(onComplete: () => void): void {
    this.withScene((scene) => {
      scene.animateReset(onComplete);
    });
  }

  destroy(): void {
    this.game.destroy(true);
  }

  private get scene(): FooterBoardScene | undefined {
    return this.game.scene.getScene(FOOTER_SCENE_KEY) as FooterBoardScene | undefined;
  }

  private withScene(action: (scene: FooterBoardScene) => void): void {
    const scene = this.scene;

    if (scene?.isReady()) {
      action(scene);
      return;
    }

    window.setTimeout(() => {
      this.withScene(action);
    }, 16);
  }
}

class FooterBoardRuntime {
  private canvas: FooterBoardCanvas;

  private phase: FooterPhase = "idle";

  private knockCount = 0;

  private activeVerdict = chooseVerdict(readStoredVerdict());

  private lastVerdictId = readStoredVerdict();

  private highlightedGlyphIds: GlyphAnchor["id"][] = [];

  constructor(
    stageElement: HTMLElement,
    private stageShellElement: HTMLElement,
    private verdictElement: HTMLElement,
    reducedMotion: boolean
  ) {
    this.canvas = new FooterBoardCanvas(stageElement, reducedMotion);
    this.canvas.setHighlightedGlyphs([]);
    this.canvas.setVerdictGlow(false);
  }

  activate(): void {
    interfaceAudio.unlock();

    if (this.phase === "moving" || this.phase === "resetting") {
      return;
    }

    if (this.phase === "revealed") {
      this.resetAndRestart();
      return;
    }

    this.performKnock();
  }

  destroy(): void {
    this.canvas.destroy();
  }

  private performKnock(): void {
    if (this.knockCount >= 3) {
      return;
    }

    this.phase = "moving";
    const glyphId = this.activeVerdict.glyphSequence[this.knockCount];
    const isFinal = this.knockCount === 2;

    interfaceAudio.play(isFinal ? "finalReveal" : "stepForward");

    this.canvas.animateKnock(glyphId, isFinal, () => {
      this.highlightedGlyphIds.push(glyphId);
      this.canvas.setHighlightedGlyphs(this.highlightedGlyphIds);
      this.knockCount += 1;

      if (isFinal) {
        this.phase = "revealed";
        this.lastVerdictId = this.activeVerdict.id;
        storeVerdict(this.activeVerdict.id);
        this.canvas.setVerdictGlow(true);
        this.verdictElement.textContent = this.activeVerdict.text;
        this.verdictElement.classList.add("is-visible");
        this.stageShellElement.classList.add("is-revealed");
        return;
      }

      this.phase = "idle";
    });
  }

  private resetAndRestart(): void {
    this.phase = "resetting";
    this.stageShellElement.classList.remove("is-revealed");
    this.verdictElement.classList.remove("is-visible");
    this.verdictElement.textContent = "";

    this.canvas.animateReset(() => {
      this.highlightedGlyphIds = [];
      this.canvas.setHighlightedGlyphs([]);
      this.activeVerdict = chooseVerdict(this.lastVerdictId);
      this.knockCount = 0;
      this.phase = "idle";
      this.performKnock();
    });
  }
}

export function buildInteractiveFooter(reducedMotion = false): HTMLElement {
  const section = document.createElement("section");
  section.className = "footer-duet footer-duet--board";

  const board = document.createElement("div");
  board.className = "footer-duet__board";
  board.innerHTML = `
    <div class="footer-duet__lead">
      <p class="footer-duet__prompt">Коснись трижды.</p>
      <p class="footer-duet__hint">Планшетка ответит тихо и без спешки.</p>
    </div>
    <div
      class="footer-duet__stage-shell"
      data-footer-board-shell
      role="button"
      tabindex="0"
      aria-label="Ведьмина доска. Коснись трижды, чтобы услышать короткий ответ."
    >
      <div class="footer-duet__stage" data-footer-board-stage></div>
      <div class="footer-duet__hit-area" data-footer-board-hit-area aria-hidden="true"></div>
    </div>
    <p class="footer-duet__verdict" data-footer-board-verdict aria-live="polite"></p>
  `;

  const meta = document.createElement("div");
  meta.className = "footer-duet__meta footer-duet__meta--stacked";
  meta.innerHTML = `
    <p class="footer-duet__copyright">Ilya G Mirin 2026</p>
    <p>Cards and UI sounds adapted from open sources. All readings and editorial content are AI generated.</p>
  `;

  section.append(board, meta);

  const stageShellElement = board.querySelector<HTMLElement>("[data-footer-board-shell]");
  const stageElement = board.querySelector<HTMLElement>("[data-footer-board-stage]");
  const hitAreaElement = board.querySelector<HTMLElement>("[data-footer-board-hit-area]");
  const verdictElement = board.querySelector<HTMLElement>("[data-footer-board-verdict]");

  if (!stageShellElement || !stageElement || !hitAreaElement || !verdictElement) {
    throw new Error("Footer board shell is incomplete.");
  }

  let runtime: FooterBoardRuntime | null = null;
  let lastPointerActivation = 0;

  const activateBoard = (): void => {
    runtime?.activate();
  };

  const activateFromPointer = (event: Event): void => {
    event.preventDefault();
    event.stopPropagation();

    const now = Date.now();
    if (now - lastPointerActivation < 220) {
      return;
    }

    lastPointerActivation = now;
    activateBoard();
  };

  hitAreaElement.addEventListener("pointerup", activateFromPointer);
  hitAreaElement.addEventListener(
    "touchend",
    (event) => {
      activateFromPointer(event);
    },
    { passive: false }
  );
  hitAreaElement.addEventListener("click", activateFromPointer);
  stageShellElement.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    activateBoard();
  });

  requestAnimationFrame(() => {
    if (!section.isConnected) {
      return;
    }

    runtime = new FooterBoardRuntime(stageElement, stageShellElement, verdictElement, reducedMotion);
  });

  window.addEventListener(
    "pagehide",
    () => {
      runtime?.destroy();
    },
    { once: true }
  );

  return section;
}
