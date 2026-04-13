import { filterTags, spreads, type DialogueLine, type FilterTag, type SpreadPost } from "../content/spreads";
import { buildInteractiveFooter } from "../phaser/FooterDuet";
import { SpreadCanvas } from "../phaser/SpreadScene";
import { interfaceAudio } from "./audio";

interface RuntimeLine {
  id: string;
  speakerName: string;
  text: string;
  focusCardId: string;
  kind: "card" | "interpreter";
}

interface SpreadRuntime {
  activeIndex: number;
  lines: RuntimeLine[];
  canvas: SpreadCanvas;
  stageShellElement: HTMLElement;
  bubbleElement: HTMLElement;
  bubbleSpeakerElement: HTMLElement;
  bubbleTextElement: HTMLElement;
  scrubberElement: HTMLInputElement;
}

const runtimeById = new Map<string, SpreadRuntime>();
const ACTIVE_FILTER_STORAGE_KEY = "speaking-arcanes:active-filter";

const filterImageByTag: Record<FilterTag, { inactive: string; active: string }> = {
  "Все": { inactive: "/filter-plaques/all.png", active: "/filter-plaques/all-active.png" },
  "Намерения": { inactive: "/filter-plaques/intentions.png", active: "/filter-plaques/intentions-active.png" },
  "Пауза": { inactive: "/filter-plaques/pause.png", active: "/filter-plaques/pause-active.png" },
  "Возвращение": { inactive: "/filter-plaques/return.png", active: "/filter-plaques/return-active.png" },
  "Выбор": { inactive: "/filter-plaques/choice.png", active: "/filter-plaques/choice-active.png" },
  "Самоощущение": { inactive: "/filter-plaques/self.png", active: "/filter-plaques/self-active.png" }
};

export function renderApp(root: HTMLElement): void {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let activeFilter: FilterTag = readStoredFilter();

  root.innerHTML = "";
  root.appendChild(buildShell());

  const filterRow = root.querySelector<HTMLElement>("[data-filter-row]");
  const feed = root.querySelector<HTMLElement>("[data-feed]");
  const footerRoot = root.querySelector<HTMLElement>("[data-footer-root]");
  const filtersSection = root.querySelector<HTMLElement>(".filters");

  if (!filterRow || !feed || !footerRoot || !filtersSection) {
    throw new Error("App shell is incomplete.");
  }

  footerRoot.replaceChildren(buildInteractiveFooter(reducedMotion));

  let lastScrollY = window.scrollY;
  window.addEventListener(
    "scroll",
    () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;

      if (currentScrollY < 96 || delta < -6) {
        filtersSection.classList.remove("filters--hidden");
      } else if (delta > 6) {
        filtersSection.classList.add("filters--hidden");
      }

      lastScrollY = currentScrollY;
    },
    { passive: true }
  );

  const renderFeed = (): void => {
    runtimeById.forEach((runtime) => destroySpreadRuntime(runtime));
    runtimeById.clear();
    filterRow.innerHTML = "";
    feed.innerHTML = "";

    for (const tag of filterTags) {
      const button = document.createElement("button");
      const isActive = tag === activeFilter;
      const image = document.createElement("img");
      button.type = "button";
      button.className = isActive ? "filter-chip is-active" : "filter-chip";
      image.className = "filter-chip__image";
      image.src = isActive ? filterImageByTag[tag].active : filterImageByTag[tag].inactive;
      image.alt = "";
      image.decoding = "async";
      button.append(image);
      button.setAttribute("aria-label", tag);
      button.setAttribute("aria-pressed", String(isActive));
      button.addEventListener("click", () => {
        interfaceAudio.unlock();
        interfaceAudio.play("filter");
        activeFilter = tag;
        storeActiveFilter(tag);
        renderFeed();
      });
      filterRow.appendChild(button);
    }

    const visibleSpreads = spreads.filter((item) => activeFilter === "Все" || item.tags.includes(activeFilter));

    visibleSpreads.forEach((spread) => {
      feed.appendChild(buildSpreadSection(spread, reducedMotion));
    });
  };

  renderFeed();
}

function readStoredFilter(): FilterTag {
  try {
    const storedValue = window.localStorage.getItem(ACTIVE_FILTER_STORAGE_KEY);
    return isFilterTag(storedValue) ? storedValue : "Все";
  } catch {
    return "Все";
  }
}

function storeActiveFilter(tag: FilterTag): void {
  try {
    window.localStorage.setItem(ACTIVE_FILTER_STORAGE_KEY, tag);
  } catch {
    // Ignore storage failures so filtering still works in restricted browsers.
  }
}

function isFilterTag(value: string | null): value is FilterTag {
  return value !== null && filterTags.includes(value as FilterTag);
}

function buildShell(): HTMLElement {
  const shell = document.createElement("div");
  shell.className = "page-shell";
  shell.innerHTML = `
    <main class="page">
      <section class="hero">
        <p class="hero__eyebrow">Speaking Arcanes</p>
        <h1 class="hero__title">
          <span class="hero__title-line">Три карты.</span>
          <span class="hero__title-line">Их спор.</span>
          <span class="hero__title-line">Мужской вывод,</span>
          <span class="hero__title-line">сказанный тихо.</span>
        </h1>
        <p class="hero__lede">
          Это мобильный нуарный блог о раскладах Таро Уэйта. Здесь расклад читается как короткая сцена:
          сначала смотри на карты, потом слушай их по одной реплике.
        </p>
        <div class="hero__meta">
          <p>Тап по левой половине сцены возвращает на шаг назад, по правой ведёт разговор дальше.</p>
          <p>Тонкий таймлайн под репликой позволяет сразу перескочить в любое место расклада.</p>
        </div>
      </section>
      <section class="filters" aria-label="Фильтр раскладов">
        <div class="filters__inner" data-filter-row></div>
      </section>
      <section class="feed" data-feed></section>
      <section data-footer-root></section>
    </main>
  `;

  return shell;
}

function buildSpreadSection(spread: SpreadPost, reducedMotion: boolean): HTMLElement {
  const lines = mergeDialogue(spread);
  const section = document.createElement("article");
  section.className = "spread";
  section.id = spread.slug;

  const header = document.createElement("header");
  header.className = "spread__header";
  header.innerHTML = `
    <p class="spread__kicker">${spread.tags.filter((tag) => tag !== "Все").join(" · ")}</p>
    <h2 class="spread__question">${spread.question}</h2>
    ${spread.introNote ? `<p class="spread__intro">${spread.introNote}</p>` : ""}
  `;

  const stageShell = document.createElement("div");
  stageShell.className = "spread__stage-shell";
  stageShell.tabIndex = 0;
  stageShell.setAttribute("aria-label", `Сцена расклада: ${spread.question}`);

  const stage = document.createElement("div");
  stage.className = "spread__stage";
  stage.setAttribute(
    "aria-label",
    `Расклад из трёх карт: ${spread.cards.map((card) => card.nameRu).join(", ")}`
  );
  stage.setAttribute("role", "img");

  const overlay = document.createElement("div");
  overlay.className = "spread__overlay";

  const nav = document.createElement("div");
  nav.className = "spread__nav";

  const backZone = document.createElement("button");
  backZone.type = "button";
  backZone.className = "spread__nav-zone spread__nav-zone--back";
  backZone.tabIndex = -1;
  backZone.setAttribute("aria-hidden", "true");

  const forwardZone = document.createElement("button");
  forwardZone.type = "button";
  forwardZone.className = "spread__nav-zone spread__nav-zone--forward";
  forwardZone.tabIndex = -1;
  forwardZone.setAttribute("aria-hidden", "true");

  nav.append(backZone, forwardZone);

  const legend = document.createElement("div");
  legend.className = "spread__legend";
  legend.innerHTML = spread.cards
    .map(
      (card, index) => `
        <span class="legend-card">
          <span class="legend-card__index">0${index + 1}</span>
          <span>${card.nameRu}</span>
        </span>
      `
    )
    .join("");

  overlay.append(legend);
  stageShell.append(stage, nav, overlay);

  const dialoguePanel = document.createElement("section");
  dialoguePanel.className = "spread__dialogue-panel";

  const bubble = document.createElement("div");
  bubble.className = "spread__bubble spread__bubble--card";
  bubble.setAttribute("aria-live", "polite");
  bubble.innerHTML = `
    <p class="spread__bubble-speaker"></p>
    <p class="spread__bubble-text"></p>
  `;

  const scrubber = document.createElement("input");
  scrubber.className = "spread__scrubber";
  scrubber.type = "range";
  scrubber.min = "0";
  scrubber.max = String(lines.length - 1);
  scrubber.step = "1";
  scrubber.value = "0";
  scrubber.setAttribute("aria-label", `Таймлайн диалога расклада: ${spread.question}`);

  dialoguePanel.append(bubble, scrubber);
  section.append(header, stageShell, dialoguePanel);

  const canvas = new SpreadCanvas(stage, {
    cards: spread.cards,
    activeLineIndex: 0,
    activeCardId: lines[0].focusCardId,
    reducedMotion
  });

  const runtime: SpreadRuntime = {
    activeIndex: 0,
    lines,
    canvas,
    stageShellElement: stageShell,
    bubbleElement: bubble,
    bubbleSpeakerElement: bubble.querySelector<HTMLElement>(".spread__bubble-speaker")!,
    bubbleTextElement: bubble.querySelector<HTMLElement>(".spread__bubble-text")!,
    scrubberElement: scrubber
  };

  runtimeById.set(spread.id, runtime);
  updateDialogueState(spread, runtime);

  backZone.addEventListener("click", () => {
    interfaceAudio.unlock();
    moveByStep(spread, runtime, -1);
  });

  forwardZone.addEventListener("click", () => {
    interfaceAudio.unlock();
    moveByStep(spread, runtime, 1);
  });

  stageShell.addEventListener("keydown", (event) => {
    if (!(event.target instanceof HTMLElement) || event.target !== stageShell) {
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      interfaceAudio.unlock();
      moveByStep(spread, runtime, -1);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      interfaceAudio.unlock();
      moveByStep(spread, runtime, 1);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      interfaceAudio.unlock();
      moveToIndex(spread, runtime, 0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      interfaceAudio.unlock();
      moveToIndex(spread, runtime, runtime.lines.length - 1);
    }
  });

  scrubber.addEventListener("input", () => {
    moveToIndex(spread, runtime, Number(scrubber.value), false);
  });

  return section;
}

function moveByStep(spread: SpreadPost, runtime: SpreadRuntime, delta: number): void {
  moveToIndex(spread, runtime, runtime.activeIndex + delta);
}

function moveToIndex(spread: SpreadPost, runtime: SpreadRuntime, index: number, emitSound = true): void {
  const previousIndex = runtime.activeIndex;
  const nextIndex = clamp(index, 0, runtime.lines.length - 1);
  if (nextIndex === runtime.activeIndex) {
    return;
  }

  runtime.activeIndex = nextIndex;
  updateDialogueState(spread, runtime);

  if (emitSound) {
    playTransitionSound(runtime, previousIndex, nextIndex);
  }
}

function updateDialogueState(spread: SpreadPost, runtime: SpreadRuntime): void {
  const activeLine = runtime.lines[runtime.activeIndex];
  const progress = runtime.lines.length > 1 ? (runtime.activeIndex / (runtime.lines.length - 1)) * 100 : 100;

  runtime.scrubberElement.style.setProperty("--progress", `${progress}%`);
  runtime.scrubberElement.value = String(runtime.activeIndex);
  runtime.bubbleSpeakerElement.textContent = activeLine.speakerName;
  runtime.bubbleTextElement.textContent = activeLine.text;
  runtime.bubbleElement.className = `spread__bubble spread__bubble--${activeLine.kind}`;

  runtime.bubbleElement.classList.remove("is-animating");
  void runtime.bubbleElement.offsetWidth;
  runtime.bubbleElement.classList.add("is-animating");

  runtime.canvas.update({
    cards: spread.cards,
    activeLineIndex: runtime.activeIndex,
    activeCardId: activeLine.focusCardId,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches
  });
}

function mergeDialogue(spread: SpreadPost): RuntimeLine[] {
  const mergedLines: RuntimeLine[] = spread.dialogue.map((line) => ({
    id: line.id,
    speakerName: resolveSpeakerName(spread, line),
    text: line.text,
    focusCardId: line.focusCardId,
    kind: "card" as const
  }));

  const lastFocusCardId = spread.dialogue[spread.dialogue.length - 1]?.focusCardId ?? spread.cards[1].id;

  mergedLines.push({
    id: `${spread.id}-interpreter`,
    speakerName: "Мужчина",
    text: spread.interpreterSummary,
    focusCardId: lastFocusCardId,
    kind: "interpreter"
  });

  return mergedLines;
}

function resolveSpeakerName(spread: SpreadPost, line: DialogueLine): string {
  return spread.cards.find((card) => card.id === line.speakerCardId)?.nameRu ?? "Аркан";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function destroySpreadRuntime(runtime: SpreadRuntime): void {
  runtime.canvas.destroy();
}

function playTransitionSound(runtime: SpreadRuntime, previousIndex: number, nextIndex: number): void {
  const reachedFinalLine = nextIndex === runtime.lines.length - 1 && previousIndex !== runtime.lines.length - 1;

  if (reachedFinalLine) {
    interfaceAudio.play("finalReveal");
    return;
  }

  if (nextIndex > previousIndex) {
    interfaceAudio.play("stepForward");
    return;
  }

  if (nextIndex < previousIndex) {
    interfaceAudio.play("stepBack");
  }
}
