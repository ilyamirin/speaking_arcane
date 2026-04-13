import {
  filterTags,
  tarotImageManifest,
  type DialogueLine,
  type FilterTag,
  type SpreadPost,
  type TarotCard
} from "../content/cards";
import { spreads } from "../content/spreads";
import { buildInteractiveFooter } from "../phaser/FooterDuet";
import { SpreadCanvas } from "../phaser/SpreadScene";
import { interfaceAudio } from "./audio";

interface RuntimeLine {
  id: string;
  speakerName: string;
  text: string;
  focusCardId: TarotCard["id"];
  kind: "card" | "interpreter";
}

interface SpreadRuntime {
  spread: SpreadPost;
  activeIndex: number;
  lines: RuntimeLine[];
  canvas: SpreadCanvas | null;
  sectionElement: HTMLElement;
  stageShellElement: HTMLElement;
  stageElement: HTMLElement;
  stageSceneElement: HTMLElement;
  posterElement: HTMLElement;
  posterCardElements: Map<TarotCard["id"], HTMLElement>;
  bubbleElement: HTMLElement;
  bubbleSpeakerElement: HTMLElement;
  bubbleTextElement: HTMLElement;
  scrubberElement: HTMLInputElement;
  hydrationState: "poster" | "hydrating" | "live";
  hydrationTaskId: number | null;
}

const runtimeById = new Map<string, SpreadRuntime>();
const ACTIVE_FILTER_STORAGE_KEY = "speaking-arcanes:active-filter";
const FEED_BATCH_SIZE = 6;
const FEED_OBSERVER_ROOT_MARGIN = "1600px 0px";
const HYDRATE_ROOT_MARGIN = "1200px 0px";
const DEHYDRATE_DISTANCE = 2600;

const filterImageByTag: Record<FilterTag, { inactive: string; active: string }> = {
  "Все": { inactive: "/filter-plaques/all.png", active: "/filter-plaques/all-active.png" },
  "Намерения": { inactive: "/filter-plaques/intentions.png", active: "/filter-plaques/intentions-active.png" },
  "Пауза": { inactive: "/filter-plaques/pause.png", active: "/filter-plaques/pause-active.png" },
  "Возвращение": { inactive: "/filter-plaques/return.png", active: "/filter-plaques/return-active.png" },
  "Выбор": { inactive: "/filter-plaques/choice.png", active: "/filter-plaques/choice-active.png" },
  "Самоощущение": { inactive: "/filter-plaques/self.png", active: "/filter-plaques/self-active.png" },
  "Коммуникация": {
    inactive: "/filter-plaques/communication.png",
    active: "/filter-plaques/communication-active.png"
  },
  "Границы": { inactive: "/filter-plaques/boundaries.png", active: "/filter-plaques/boundaries-active.png" },
  "Переход": { inactive: "/filter-plaques/transition.png", active: "/filter-plaques/transition-active.png" }
};

export function renderApp(root: HTMLElement): void {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let activeFilter: FilterTag = readStoredFilter();
  let allFilteredSpreads: SpreadPost[] = [];
  let renderedCount = 0;
  let feedSentinel: HTMLElement | null = null;
  let feedObserver: IntersectionObserver | null = null;
  let hydrateObserver: IntersectionObserver | null = null;
  let pruneQueued = false;

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
      scheduleCanvasPrune();
    },
    { passive: true }
  );

  const renderFilterRow = (): void => {
    filterRow.innerHTML = "";

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
        if (tag === activeFilter) {
          return;
        }

        interfaceAudio.unlock();
        interfaceAudio.play("filter");
        activeFilter = tag;
        storeActiveFilter(tag);
        window.scrollTo({ top: 0, behavior: "auto" });
        renderFeed();
      });
      filterRow.appendChild(button);
    }
  };

  const cleanupFeed = (): void => {
    feedObserver?.disconnect();
    hydrateObserver?.disconnect();
    feedObserver = null;
    hydrateObserver = null;
    feedSentinel = null;

    runtimeById.forEach((runtime) => destroySpreadRuntime(runtime));
    runtimeById.clear();
    feed.innerHTML = "";
    renderedCount = 0;
  };

  const createObservers = (): void => {
    hydrateObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const spreadId = (entry.target as HTMLElement).dataset.spreadId;
          if (!spreadId) {
            return;
          }

          const runtime = runtimeById.get(spreadId);
          if (!runtime || entry.intersectionRatio <= 0) {
            return;
          }

          scheduleHydration(runtime, reducedMotion);
        });
      },
      {
        root: null,
        rootMargin: HYDRATE_ROOT_MARGIN,
        threshold: 0
      }
    );

    feedObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          renderNextBatch();
        }
      },
      {
        root: null,
        rootMargin: FEED_OBSERVER_ROOT_MARGIN,
        threshold: 0
      }
    );
  };

  const ensureFeedSentinel = (): void => {
    if (!feedSentinel) {
      feedSentinel = document.createElement("div");
      feedSentinel.className = "feed__sentinel";
      feedSentinel.setAttribute("aria-hidden", "true");
      feedObserver?.observe(feedSentinel);
    }

    feed.append(feedSentinel);
  };

  const renderNextBatch = (): void => {
    if (renderedCount >= allFilteredSpreads.length) {
      ensureFeedSentinel();
      return;
    }

    const nextSpreads = allFilteredSpreads.slice(renderedCount, renderedCount + FEED_BATCH_SIZE);
    const fragment = document.createDocumentFragment();

    nextSpreads.forEach((spread) => {
      const section = buildSpreadSection(spread);
      fragment.append(section);
      hydrateObserver?.observe(section);
    });

    if (feedSentinel) {
      feedSentinel.remove();
    }

    feed.append(fragment);
    renderedCount += nextSpreads.length;
    ensureFeedSentinel();
    scheduleCanvasPrune();
  };

  const renderFeed = (): void => {
    cleanupFeed();
    renderFilterRow();
    createObservers();
    allFilteredSpreads = spreads.filter((item) => activeFilter === "Все" || item.tags.includes(activeFilter));
    renderNextBatch();
  };

  function buildSpreadSection(spread: SpreadPost): HTMLElement {
    const lines = mergeDialogue(spread);
    const section = document.createElement("article");
    section.className = "spread";
    section.id = spread.slug;
    section.dataset.spreadId = spread.id;

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

    const poster = buildStagePoster(spread);
    const stageScene = document.createElement("div");
    stageScene.className = "spread__stage-scene";
    stage.append(poster.element, stageScene);

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

    const runtime: SpreadRuntime = {
      spread,
      activeIndex: 0,
      lines,
      canvas: null,
      sectionElement: section,
      stageShellElement: stageShell,
      stageElement: stage,
      stageSceneElement: stageScene,
      posterElement: poster.element,
      posterCardElements: poster.cardsById,
      bubbleElement: bubble,
      bubbleSpeakerElement: bubble.querySelector<HTMLElement>(".spread__bubble-speaker")!,
      bubbleTextElement: bubble.querySelector<HTMLElement>(".spread__bubble-text")!,
      scrubberElement: scrubber,
      hydrationState: "poster",
      hydrationTaskId: null
    };

    runtimeById.set(spread.id, runtime);
    updateDialogueState(runtime, reducedMotion);

    backZone.addEventListener("click", () => {
      interfaceAudio.unlock();
      moveByStep(runtime, -1, reducedMotion);
    });

    forwardZone.addEventListener("click", () => {
      interfaceAudio.unlock();
      moveByStep(runtime, 1, reducedMotion);
    });

    stageShell.addEventListener("keydown", (event) => {
      if (!(event.target instanceof HTMLElement) || event.target !== stageShell) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        interfaceAudio.unlock();
        moveByStep(runtime, -1, reducedMotion);
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        interfaceAudio.unlock();
        moveByStep(runtime, 1, reducedMotion);
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        interfaceAudio.unlock();
        moveToIndex(runtime, 0, reducedMotion);
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        interfaceAudio.unlock();
        moveToIndex(runtime, runtime.lines.length - 1, reducedMotion);
      }
    });

    scrubber.addEventListener("input", () => {
      moveToIndex(runtime, Number(scrubber.value), reducedMotion, false);
    });

    return section;
  }

  function scheduleCanvasPrune(): void {
    if (pruneQueued) {
      return;
    }

    pruneQueued = true;
    window.requestAnimationFrame(() => {
      pruneQueued = false;
      pruneDistantCanvases();
    });
  }

  function pruneDistantCanvases(): void {
    const viewportTop = window.scrollY;
    const viewportBottom = viewportTop + window.innerHeight;

    runtimeById.forEach((runtime) => {
      const rect = runtime.sectionElement.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const bottom = rect.bottom + window.scrollY;

      if (bottom < viewportTop - DEHYDRATE_DISTANCE || top > viewportBottom + DEHYDRATE_DISTANCE) {
        dehydrateRuntime(runtime);
      }
    });
  }

  function scheduleHydration(runtime: SpreadRuntime, prefersReducedMotion: boolean): void {
    if (runtime.hydrationState !== "poster") {
      return;
    }

    runtime.hydrationState = "hydrating";
    runtime.stageElement.classList.add("is-hydrating");

    runtime.hydrationTaskId = scheduleIdleTask(() => {
      runtime.hydrationTaskId = null;

      if (runtime.hydrationState !== "hydrating" || !runtime.sectionElement.isConnected) {
        return;
      }

      hydrateRuntime(runtime, prefersReducedMotion);
    });
  }

  function hydrateRuntime(runtime: SpreadRuntime, prefersReducedMotion: boolean): void {
    if (runtime.canvas) {
      runtime.hydrationState = "live";
      runtime.stageElement.classList.remove("is-hydrating");
      runtime.stageElement.classList.add("is-live");
      return;
    }

    runtime.stageSceneElement.innerHTML = "";
    runtime.canvas = new SpreadCanvas(runtime.stageSceneElement, {
      cards: runtime.spread.cards,
      activeLineIndex: runtime.activeIndex,
      activeCardId: runtime.lines[runtime.activeIndex].focusCardId,
      reducedMotion: prefersReducedMotion
    });
    runtime.hydrationState = "live";
    runtime.stageElement.classList.remove("is-hydrating");
    runtime.stageElement.classList.add("is-live");
  }

  function dehydrateRuntime(runtime: SpreadRuntime): void {
    if (runtime.hydrationTaskId !== null) {
      cancelIdleTask(runtime.hydrationTaskId);
      runtime.hydrationTaskId = null;
    }

    if (runtime.canvas) {
      runtime.canvas.destroy();
      runtime.canvas = null;
    }

    runtime.hydrationState = "poster";
    runtime.stageElement.classList.remove("is-live", "is-hydrating");
    runtime.stageSceneElement.innerHTML = "";
  }

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
        <p class="hero__eyebrow">Speaking Arcane</p>
        <h1 class="hero__title">
          <span class="hero__title-line">Три карты.</span>
          <span class="hero__title-line">Их спор.</span>
          <span class="hero__title-line">Мужской вывод,</span>
          <span class="hero__title-line">сказанный тихо.</span>
        </h1>
        <p class="hero__lede">
          Это тихий блог раскладов Таро Уэйта. Здесь расклад звучит как короткая сцена:
          сначала смотри на карты, потом слушай, как они спорят между собой.
        </p>
        <div class="hero__meta">
          <p>Коснись левой половины сцены, чтобы вернуться на шаг назад. Правой — чтобы двинуть разговор дальше.</p>
          <p>Под репликой есть тонкий таймлайн. По нему можно сразу перейти в нужное место расклада.</p>
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

function moveByStep(runtime: SpreadRuntime, delta: number, reducedMotion: boolean): void {
  moveToIndex(runtime, runtime.activeIndex + delta, reducedMotion);
}

function moveToIndex(runtime: SpreadRuntime, index: number, reducedMotion: boolean, emitSound = true): void {
  const previousIndex = runtime.activeIndex;
  const nextIndex = clamp(index, 0, runtime.lines.length - 1);
  if (nextIndex === runtime.activeIndex) {
    return;
  }

  runtime.activeIndex = nextIndex;
  updateDialogueState(runtime, reducedMotion);

  if (emitSound) {
    playTransitionSound(runtime, previousIndex, nextIndex);
  }
}

function updateDialogueState(runtime: SpreadRuntime, reducedMotion: boolean): void {
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

  updatePosterState(runtime, activeLine.focusCardId);

  runtime.canvas?.update({
    cards: runtime.spread.cards,
    activeLineIndex: runtime.activeIndex,
    activeCardId: activeLine.focusCardId,
    reducedMotion
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

function buildStagePoster(spread: SpreadPost): {
  element: HTMLElement;
  cardsById: Map<TarotCard["id"], HTMLElement>;
} {
  const poster = document.createElement("div");
  poster.className = "spread__poster";

  const cardsById = new Map<TarotCard["id"], HTMLElement>();

  spread.cards.forEach((card, index) => {
    const cardShell = document.createElement("div");
    const image = document.createElement("img");
    cardShell.className = `spread__poster-card spread__poster-card--${index === 0 ? "left" : index === 1 ? "center" : "right"}`;
    image.className = "spread__poster-image";
    image.src = tarotImageManifest[card.imageKey];
    image.alt = "";
    image.decoding = "async";
    image.loading = "lazy";
    cardShell.append(image);
    poster.append(cardShell);
    cardsById.set(card.id, cardShell);
  });

  return { element: poster, cardsById };
}

function updatePosterState(runtime: SpreadRuntime, activeCardId: TarotCard["id"]): void {
  runtime.posterCardElements.forEach((element, cardId) => {
    element.classList.toggle("is-focus", cardId === activeCardId);
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function destroySpreadRuntime(runtime: SpreadRuntime): void {
  if (runtime.hydrationTaskId !== null) {
    cancelIdleTask(runtime.hydrationTaskId);
    runtime.hydrationTaskId = null;
  }

  runtime.canvas?.destroy();
  runtime.canvas = null;
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

function scheduleIdleTask(task: () => void): number {
  const requestIdleCallback = (window as Window & {
    requestIdleCallback?: (callback: () => void) => number;
  }).requestIdleCallback;

  if (typeof requestIdleCallback === "function") {
    return requestIdleCallback(task);
  }

  return window.setTimeout(task, 0);
}

function cancelIdleTask(taskId: number): void {
  const cancelIdleCallback = (window as Window & {
    cancelIdleCallback?: (id: number) => void;
  }).cancelIdleCallback;

  if (typeof cancelIdleCallback === "function") {
    cancelIdleCallback(taskId);
    return;
  }

  window.clearTimeout(taskId);
}
