type SoundName = "stepForward" | "stepBack" | "filter" | "finalReveal";

type SoundDefinition = {
  src: string;
  volume: number;
  playbackRate?: number;
};

const baseUrl = import.meta.env.BASE_URL;

const soundDefinitions: Record<SoundName, SoundDefinition> = {
  stepForward: {
    src: `${baseUrl}sounds/step-forward.wav`,
    volume: 0.18,
    playbackRate: 1
  },
  stepBack: {
    src: `${baseUrl}sounds/step-back.wav`,
    volume: 0.15,
    playbackRate: 0.98
  },
  filter: {
    src: `${baseUrl}sounds/step-forward.wav`,
    volume: 0.11,
    playbackRate: 0.92
  },
  finalReveal: {
    src: `${baseUrl}sounds/final-reveal.wav`,
    volume: 0.17,
    playbackRate: 1
  }
};

class InterfaceAudio {
  private unlocked = false;

  unlock(): void {
    this.unlocked = true;
  }

  play(name: SoundName): void {
    if (!this.unlocked) {
      return;
    }

    const definition = soundDefinitions[name];
    const audio = new Audio(definition.src);
    audio.preload = "auto";
    audio.volume = definition.volume;
    audio.playbackRate = definition.playbackRate ?? 1;
    audio.play().catch(() => undefined);
  }
}

export const interfaceAudio = new InterfaceAudio();
