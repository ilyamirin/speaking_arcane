import Phaser from "phaser";
import { tarotImageManifest, type TarotCard } from "../content/cards";

const SCENE_WIDTH = 720;
const SCENE_HEIGHT = 688;
const CARD_HEIGHT = 336;
const CARD_SPACING = 208;
const CARD_CENTER_Y = 344;

interface SpreadSceneInit {
  cards: [TarotCard, TarotCard, TarotCard];
  reducedMotion: boolean;
}

interface SpreadSceneData extends SpreadSceneInit {
  activeLineIndex: number;
  activeCardId: TarotCard["id"];
}

interface CardView {
  card: TarotCard;
  shell: Phaser.GameObjects.Container;
  frame: Phaser.GameObjects.Rectangle;
  image: Phaser.GameObjects.Image;
  baseX: number;
  baseY: number;
}

class TarotSpreadScene extends Phaser.Scene {
  private cardViews: CardView[] = [];

  private activeCardId = "";

  private activeLineIndex = 0;

  private reducedMotion = false;

  constructor() {
    super("tarot-spread");
  }

  init(data: SpreadSceneInit): void {
    this.reducedMotion = data.reducedMotion;
  }

  preload(): void {
    const { cards } = this.game.registry.get("spreadData") as SpreadSceneData;

    for (const card of cards) {
      const url = tarotImageManifest[card.imageKey as keyof typeof tarotImageManifest];
      if (!this.textures.exists(card.imageKey)) {
        this.load.image(card.imageKey, url);
      }
    }
  }

  create(): void {
    const data = this.game.registry.get("spreadData") as SpreadSceneData;

    this.activeCardId = data.activeCardId;
    this.activeLineIndex = data.activeLineIndex;

    this.add
      .rectangle(SCENE_WIDTH / 2, SCENE_HEIGHT / 2, SCENE_WIDTH, SCENE_HEIGHT, 0x09090b, 1)
      .setStrokeStyle(1, 0x34292a, 0.5);

    const glow = this.add.ellipse(
      SCENE_WIDTH / 2,
      SCENE_HEIGHT * 0.46,
      SCENE_WIDTH * 0.82,
      SCENE_HEIGHT * 0.92,
      0x4b161d,
      0.16
    );
    glow.setBlendMode(Phaser.BlendModes.SCREEN);

    data.cards.forEach((card, index) => {
      const baseX = SCENE_WIDTH / 2 + (index - 1) * CARD_SPACING;
      const baseY = CARD_CENTER_Y;
      const texture = this.textures.get(card.imageKey);
      const source = texture.getSourceImage() as { width: number; height: number };
      const cardWidth = Math.round((CARD_HEIGHT * source.width) / source.height);

      const frame = this.add
        .rectangle(0, 0, cardWidth + 16, CARD_HEIGHT + 16, 0x100f13, 0.76)
        .setStrokeStyle(1, 0x685759, 0.84);

      const image = this.add
        .image(0, -4, card.imageKey)
        .setDisplaySize(cardWidth, CARD_HEIGHT)
        .setAlpha(0.98);

      const vignette = this.add
        .rectangle(0, -4, cardWidth, CARD_HEIGHT, 0x070608, 0.14)
        .setBlendMode(Phaser.BlendModes.MULTIPLY);

      const shell = this.add.container(baseX, baseY, [frame, image, vignette]).setAlpha(this.reducedMotion ? 1 : 0);

      this.cardViews.push({
        card,
        shell,
        frame,
        image,
        baseX,
        baseY
      });

      if (!this.reducedMotion) {
        shell.y += 14;

        this.tweens.add({
          targets: shell,
          alpha: 1,
          y: baseY,
          duration: 540 + index * 90,
          ease: "Sine.Out"
        });

        this.tweens.add({
          targets: shell,
          angle: { from: -0.9 + index * 0.5, to: 0.9 - index * 0.5 },
          yoyo: true,
          repeat: -1,
          duration: 4600 + index * 350,
          ease: "Sine.InOut"
        });
      }
    });

    if (!this.reducedMotion) {
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.1, to: 0.22 },
        yoyo: true,
        repeat: -1,
        duration: 3600,
        ease: "Sine.InOut"
      });
    }

    this.applyState();
  }

  updateState(activeLineIndex: number, activeCardId: string): void {
    this.activeLineIndex = activeLineIndex;
    this.activeCardId = activeCardId;
    this.applyState();
  }

  private applyState(): void {
    this.cardViews.forEach((view) => {
      const isActive = view.card.id === this.activeCardId;
      const emphasis = 1 + Math.min(this.activeLineIndex, 9) * 0.003;
      const scale = isActive ? 1.03 * emphasis : 0.95;

      view.shell.setScale(scale);
      view.shell.setPosition(view.baseX, view.baseY + (isActive ? -6 : 0));
      view.shell.setAlpha(isActive ? 1 : 0.88);

      view.image.setTint(isActive ? 0xffffff : 0xc9c0bb);
      view.frame.setStrokeStyle(isActive ? 2 : 1, isActive ? 0xa06d6d : 0x685759, isActive ? 1 : 0.7);
    });
  }
}

export interface SpreadCanvasState {
  cards: [TarotCard, TarotCard, TarotCard];
  activeLineIndex: number;
  activeCardId: TarotCard["id"];
  reducedMotion: boolean;
}

export class SpreadCanvas {
  private game: Phaser.Game;

  constructor(private container: HTMLElement, private state: SpreadCanvasState) {
    this.game = new Phaser.Game({
      type: Phaser.CANVAS,
      width: SCENE_WIDTH,
      height: SCENE_HEIGHT,
      parent: container,
      transparent: true,
      backgroundColor: "#09090b",
      banner: false,
      scene: [TarotSpreadScene],
      scale: {
        mode: Phaser.Scale.NONE,
        width: SCENE_WIDTH,
        height: SCENE_HEIGHT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      render: {
        antialias: true,
        pixelArt: false,
        transparent: true
      },
      callbacks: {
        postBoot: (game) => {
          game.registry.set("spreadData", this.state);
          game.scene.start("tarot-spread", {
            cards: this.state.cards,
            reducedMotion: this.state.reducedMotion
          });
        }
      }
    });
  }

  update(nextState: SpreadCanvasState): void {
    this.state = nextState;
    this.game.registry.set("spreadData", nextState);

    const scene = this.game.scene.getScene("tarot-spread") as TarotSpreadScene | undefined;
    scene?.updateState(nextState.activeLineIndex, nextState.activeCardId);
  }

  destroy(): void {
    this.game.destroy(true);
  }
}
