import Phaser from "phaser";
import { interfaceAudio } from "../ui/audio";

const LAST_CARD_WIDTH = 720;
const LAST_CARD_HEIGHT = 520;
const LAST_CARD_BACK_IMAGE = "/footer-cards/last-card-back.png";
const LAST_CARD_FACE_IMAGE = "/footer-cards/last-card-face.png";
const LAST_CARD_STORAGE_KEY = "speaking-arcanes:last-card-secret-index";
const LAST_CARD_SECRETS = [
  "Ты уже всё поняла. Я только дал тебе право себе поверить.",
  "Не жди ещё одного знака. Ты сама и была знаком.",
  "Тебя смущала не тайна. Тебя смущала правда.",
  "Ты искала его намерение, а увидела собственную цену.",
  "Если мужчина медлит, это ещё не загадка. Иногда это просто его предел.",
  "Не всякая пауза полна смысла. Иногда молчание и есть ответ.",
  "Последний аркан здесь — твоя трезвость.",
  "То, что тебя задело, уже показало слабое место истории.",
  "Я бы сказал тебе мягче, но честность всё равно звучит именно так.",
  "Тебе не нужно дожимать судьбу. Достаточно не уговаривать себя.",
  "Иногда тебя держит не мужчина. Тебя держит надежда на красивый сюжет.",
  "Оставь себе достоинство, а не ожидание. Оно идёт тебе больше."
] as const;

function createEmberTexture(scene: Phaser.Scene, key: string): void {
  if (scene.textures.exists(key)) {
    return;
  }

  const graphics = scene.add.graphics();
  graphics.fillStyle(0xf0c7a2, 1);
  graphics.fillCircle(4, 4, 4);
  graphics.generateTexture(key, 8, 8);
  graphics.destroy();
}

class LastCardFooterScene extends Phaser.Scene {
  private cardShell!: Phaser.GameObjects.Container;

  private cardBack!: Phaser.GameObjects.Container;

  private cardFront!: Phaser.GameObjects.Container;

  private deckShell!: Phaser.GameObjects.Container;

  private halo!: Phaser.GameObjects.Ellipse;

  private dragProgress = 0;

  private revealed = false;

  private reducedMotion = false;

  constructor() {
    super("last-card-footer");
  }

  init(data: { reducedMotion: boolean }): void {
    this.reducedMotion = data.reducedMotion;
  }

  preload(): void {
    this.load.image("footer-last-card-back", LAST_CARD_BACK_IMAGE);
    this.load.image("footer-last-card-face", LAST_CARD_FACE_IMAGE);
  }

  create(): void {
    createEmberTexture(this, "footer-ember");

    this.add
      .rectangle(LAST_CARD_WIDTH / 2, LAST_CARD_HEIGHT / 2, LAST_CARD_WIDTH, LAST_CARD_HEIGHT, 0x0a090b, 1)
      .setStrokeStyle(1, 0x2e2527, 0.5);

    this.add.ellipse(LAST_CARD_WIDTH / 2, LAST_CARD_HEIGHT * 0.82, 360, 64, 0x120f14, 0.9);

    this.halo = this.add.ellipse(LAST_CARD_WIDTH / 2, LAST_CARD_HEIGHT * 0.46, 320, 420, 0x5a2d31, 0.09);
    this.halo.setBlendMode(Phaser.BlendModes.SCREEN);

    this.deckShell = this.buildDeckShell();
    this.cardBack = this.buildCardBack();
    this.cardFront = this.buildCardFace().setVisible(false);

    this.cardShell = this.add.container(LAST_CARD_WIDTH / 2, 312, [this.cardBack, this.cardFront]);

    if (!this.reducedMotion) {
      this.tweens.add({
        targets: this.halo,
        alpha: { from: 0.07, to: 0.14 },
        duration: 3200,
        yoyo: true,
        repeat: -1,
        ease: "Sine.InOut"
      });

      this.tweens.add({
        targets: this.deckShell,
        y: 336,
        duration: 2600,
        yoyo: true,
        repeat: -1,
        ease: "Sine.InOut"
      });
    }

    this.applyPose();
  }

  setDragProgress(progress: number): void {
    if (this.revealed) {
      return;
    }

    this.dragProgress = Phaser.Math.Clamp(progress, 0, 1);
    this.applyPose();
  }

  snapBack(): void {
    if (this.revealed) {
      return;
    }

    this.tweens.killTweensOf(this.cardShell);
    this.tweens.killTweensOf(this.deckShell);
    this.tweens.addCounter({
      from: this.dragProgress,
      to: 0,
      duration: this.reducedMotion ? 1 : 260,
      ease: "Quad.Out",
      onUpdate: (tween) => {
        this.dragProgress = tween.getValue() ?? 0;
        this.applyPose();
      }
    });
  }

  reveal(onComplete: () => void): void {
    if (this.revealed) {
      return;
    }

    this.revealed = true;
    this.tweens.killTweensOf(this.cardShell);
    this.tweens.killTweensOf(this.deckShell);

    const liftTarget = this.cardShell.y - 82;
    const baseX = this.cardShell.x;

    this.tweens.add({
      targets: this.cardShell,
      y: liftTarget,
      angle: -2,
      duration: this.reducedMotion ? 1 : 220,
      ease: "Quad.Out",
      onComplete: () => {
        this.tweens.add({
          targets: this.cardShell,
          scaleX: 0.02,
          duration: this.reducedMotion ? 1 : 130,
          ease: "Quad.In",
          onComplete: () => {
            this.cardBack.setVisible(false);
            this.cardFront.setVisible(true);
            this.cardShell.setX(baseX);
            this.cardShell.setScale(0.02, 1.02);

            this.tweens.add({
              targets: this.cardShell,
              scaleX: 1.02,
              y: liftTarget - 4,
              duration: this.reducedMotion ? 1 : 180,
              ease: "Quad.Out",
              onComplete: () => {
                onComplete();
              }
            });
          }
        });
      }
    });
  }

  resetCard(): void {
    this.revealed = false;
    this.dragProgress = 0;
    this.cardBack.setVisible(true);
    this.cardFront.setVisible(false);
    this.cardShell.setScale(1);
    this.cardShell.setAngle(0);
    this.applyPose();
  }

  private applyPose(): void {
    const offsetY = this.dragProgress * 154;
    const offsetX = this.dragProgress * 8;
    const angle = -this.dragProgress * 5;
    const scale = 1 + this.dragProgress * 0.04;

    this.cardShell.setPosition(LAST_CARD_WIDTH / 2 + offsetX, 312 - offsetY);
    this.cardShell.setAngle(angle);
    this.cardShell.setScale(scale);
    this.deckShell.setAlpha(1 - this.dragProgress * 0.16);
    this.halo.setAlpha(0.09 + this.dragProgress * 0.1);
  }

  private buildDeckShell(): Phaser.GameObjects.Container {
    if (this.textures.exists("footer-last-card-back")) {
      const rear = this.add.image(0, 0, "footer-last-card-back").setDisplaySize(186, 280).setAngle(-4.2).setAlpha(0.5);
      const front = this.add.image(5, -6, "footer-last-card-back").setDisplaySize(186, 280).setAngle(-1.8).setAlpha(0.34);
      return this.add.container(LAST_CARD_WIDTH / 2, 332, [rear, front]);
    }

    return this.add.container(LAST_CARD_WIDTH / 2, 332, [
      this.add
        .rectangle(0, 0, 182, 294, 0x100f13, 0.62)
        .setAngle(-4.2)
        .setStrokeStyle(1, 0x4a3a3c, 0.6),
      this.add
        .rectangle(5, -6, 182, 294, 0x141219, 0.46)
        .setAngle(-1.8)
        .setStrokeStyle(1, 0x544446, 0.54)
    ]);
  }

  private buildCardBack(): Phaser.GameObjects.Container {
    if (this.textures.exists("footer-last-card-back")) {
      const glow = this.add.rectangle(0, 0, 202, 318, 0x120f15, 0.56).setStrokeStyle(2, 0x6d5456, 0.9);
      const image = this.add.image(0, 0, "footer-last-card-back").setDisplaySize(192, 306);
      return this.add.container(0, 0, [glow, image]);
    }

    const backGraphics = this.add.graphics();
    backGraphics.lineStyle(2, 0x8a6364, 0.9);
    backGraphics.strokeRoundedRect(-70, -114, 140, 228, 12);
    backGraphics.lineStyle(1, 0xb59c8d, 0.38);
    backGraphics.strokeCircle(0, 0, 42);
    backGraphics.strokeCircle(0, 0, 18);
    backGraphics.strokeTriangle(0, -64, 40, 0, 0, 64);
    backGraphics.lineBetween(-54, 0, 54, 0);

    const cardFrame = this.add
      .rectangle(0, 0, 194, 310, 0x17151b, 0.98)
      .setStrokeStyle(2, 0x6d5456, 0.95);
    const cardInner = this.add.rectangle(0, 0, 178, 294, 0x231c23, 1).setStrokeStyle(1, 0xc7bdb4, 0.22);

    return this.add.container(0, 0, [cardFrame, cardInner, backGraphics]);
  }

  private buildCardFace(): Phaser.GameObjects.Container {
    if (this.textures.exists("footer-last-card-face")) {
      const glow = this.add.rectangle(0, 0, 202, 318, 0xe4dbd0, 0.18).setStrokeStyle(2, 0x6a4d4f, 0.84);
      const image = this.add.image(0, 0, "footer-last-card-face").setDisplaySize(192, 306);
      return this.add.container(0, 0, [glow, image]);
    }

    const frontFrame = this.add
      .rectangle(0, 0, 194, 310, 0xe1d7ca, 0.98)
      .setStrokeStyle(2, 0x6a4d4f, 0.9);
    const frontInner = this.add.rectangle(0, 0, 178, 294, 0xf0e6db, 1).setStrokeStyle(1, 0x9a7b7d, 0.32);
    const frontMark = this.add
      .text(0, -4, "XIII", {
        fontFamily: "Georgia, serif",
        fontSize: "46px",
        color: "#6a4d4f"
      })
      .setOrigin(0.5);
    const frontCaption = this.add
      .text(0, 86, "последняя", {
        fontFamily: "Georgia, serif",
        fontSize: "24px",
        color: "#8c6a6d"
      })
      .setOrigin(0.5);

    return this.add.container(0, 0, [frontFrame, frontInner, frontMark, frontCaption]);
  }
}

class LastCardCanvas {
  private game: Phaser.Game;

  constructor(private container: HTMLElement, reducedMotion: boolean) {
    this.game = new Phaser.Game({
      type: Phaser.CANVAS,
      width: LAST_CARD_WIDTH,
      height: LAST_CARD_HEIGHT,
      parent: container,
      transparent: true,
      backgroundColor: "#09090b",
      banner: false,
      scene: [LastCardFooterScene],
      scale: {
        mode: Phaser.Scale.NONE,
        width: LAST_CARD_WIDTH,
        height: LAST_CARD_HEIGHT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      render: {
        antialias: true,
        pixelArt: false,
        transparent: true
      },
      callbacks: {
        postBoot: (game) => {
          game.scene.start("last-card-footer", { reducedMotion });
        }
      }
    });
  }

  setDragProgress(progress: number): void {
    (this.game.scene.getScene("last-card-footer") as LastCardFooterScene | undefined)?.setDragProgress(progress);
  }

  snapBack(): void {
    (this.game.scene.getScene("last-card-footer") as LastCardFooterScene | undefined)?.snapBack();
  }

  reveal(onComplete: () => void): void {
    (this.game.scene.getScene("last-card-footer") as LastCardFooterScene | undefined)?.reveal(onComplete);
  }

  reset(): void {
    (this.game.scene.getScene("last-card-footer") as LastCardFooterScene | undefined)?.resetCard();
  }

  destroy(): void {
    this.game.destroy(true);
  }
}

export function buildInteractiveFooter(reducedMotion: boolean): HTMLElement {
  const section = document.createElement("section");
  section.className = "footer-duet";

  section.innerHTML = `
    <div class="footer-duet__card-block">
      <div class="footer-duet__copy">
        <p class="footer-duet__eyebrow">Последняя карта</p>
        <p class="footer-duet__lede">Потяни карту вверх и забери у сайта одну тихую фразу напоследок.</p>
      </div>
      <div class="footer-duet__card-shell" data-last-card-shell tabindex="0" aria-label="Последняя карта, потяни вверх чтобы открыть">
        <div class="footer-duet__card-stage" data-last-card-stage></div>
        <div class="footer-duet__secret" data-last-card-secret>
          <p class="footer-duet__secret-label">Секретная фраза</p>
          <p class="footer-duet__secret-text" data-last-card-text></p>
        </div>
        <button type="button" class="footer-duet__button" data-last-card-reset>Снова</button>
      </div>
      <div class="footer-duet__meta footer-duet__meta--stacked">
        <p class="footer-duet__copyright">Ilya G Mirin 2026</p>
        <p>Cards and UI sounds adapted from open sources.</p>
      </div>
    </div>
  `;

  const cardShell = section.querySelector<HTMLElement>("[data-last-card-shell]") ?? section.querySelector<HTMLElement>(".footer-duet__card-shell");
  const cardStage = section.querySelector<HTMLElement>("[data-last-card-stage]");
  const secret = section.querySelector<HTMLElement>("[data-last-card-secret]");
  const secretText = section.querySelector<HTMLElement>("[data-last-card-text]");
  const cardReset = section.querySelector<HTMLButtonElement>("[data-last-card-reset]");

  if (!cardShell || !cardStage || !secret || !secretText || !cardReset) {
    throw new Error("Interactive footer markup is incomplete.");
  }

  const lastCardCanvas = new LastCardCanvas(cardStage, reducedMotion);

  let dragActive = false;
  let startY = 0;
  let secretShown = false;

  const readLastSecretIndex = (): number => {
    try {
      const rawLastIndex = window.localStorage.getItem(LAST_CARD_STORAGE_KEY);
      if (rawLastIndex === null) {
        return -1;
      }

      const parsedIndex = Number.parseInt(rawLastIndex, 10);
      return Number.isFinite(parsedIndex) ? parsedIndex : -1;
    } catch {
      return -1;
    }
  };

  const writeLastSecretIndex = (index: number): void => {
    try {
      window.localStorage.setItem(LAST_CARD_STORAGE_KEY, String(index));
    } catch {
      // Ignore storage errors and keep runtime-only rotation.
    }
  };

  const chooseNextSecret = (): string => {
    const lastIndex = readLastSecretIndex();
    const availableIndices = LAST_CARD_SECRETS.map((_, index) => index).filter((index) => index !== lastIndex);
    const pool = availableIndices.length > 0 ? availableIndices : LAST_CARD_SECRETS.map((_, index) => index);
    const nextIndex = pool[Phaser.Math.Between(0, pool.length - 1)] ?? 0;
    writeLastSecretIndex(nextIndex);
    return LAST_CARD_SECRETS[nextIndex];
  };

  const revealSecret = (): void => {
    secretShown = true;
    secretText.textContent = chooseNextSecret();
    secret.classList.add("is-visible");
    cardReset.classList.add("is-visible");
    interfaceAudio.play("finalReveal");
  };

  const resetLastCard = (): void => {
    secretShown = false;
    dragActive = false;
    secret.classList.remove("is-visible");
    cardReset.classList.remove("is-visible");
    lastCardCanvas.reset();
  };

  const handlePointerDown = (event: PointerEvent): void => {
    if (secretShown) {
      return;
    }

    dragActive = true;
    startY = event.clientY;
    interfaceAudio.unlock();
    cardShell.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent): void => {
    if (!dragActive || secretShown) {
      return;
    }

    const delta = Math.max(0, startY - event.clientY);
    const progress = Phaser.Math.Clamp(delta / 150, 0, 1);
    lastCardCanvas.setDragProgress(progress);
  };

  const handlePointerUp = (event: PointerEvent): void => {
    if (!dragActive || secretShown) {
      return;
    }

    dragActive = false;
    cardShell.releasePointerCapture?.(event.pointerId);
    const delta = Math.max(0, startY - event.clientY);
    const progress = Phaser.Math.Clamp(delta / 150, 0, 1);

    if (progress >= 0.68) {
      interfaceAudio.play("stepForward");
      lastCardCanvas.reveal(() => {
        window.setTimeout(revealSecret, reducedMotion ? 1 : 80);
      });
      return;
    }

    lastCardCanvas.snapBack();
  };

  cardShell.addEventListener("pointerdown", handlePointerDown);
  cardShell.addEventListener("pointermove", handlePointerMove);
  cardShell.addEventListener("pointerup", handlePointerUp);
  cardShell.addEventListener("pointercancel", handlePointerUp);
  cardShell.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      interfaceAudio.unlock();
      if (secretShown) {
        resetLastCard();
        return;
      }

      interfaceAudio.play("stepForward");
      lastCardCanvas.reveal(() => {
        window.setTimeout(revealSecret, reducedMotion ? 1 : 80);
      });
    }
  });

  cardReset.addEventListener("click", () => {
    interfaceAudio.unlock();
    interfaceAudio.play("stepBack");
    resetLastCard();
  });

  return section;
}
