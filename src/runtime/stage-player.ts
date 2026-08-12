import type { AppLanguage } from './i18n';
import type { LoopAnimationController, TimelineSnapshot, TimelineStep } from './animation';
import { reveal, stepIndexAt } from './animation';
import { buildStoryManifest, type StoryChapterCopy } from './story';
import './stage-player.css';

export interface StageChapterCopy extends StoryChapterCopy {}

export interface StagePlayerCopy {
  brand: string;
  category: string;
  topicTitle: string;
  topicLead: string;
  chapterWord: string;
  keyWord: string;
  play: string;
  pause: string;
  previous: string;
  next: string;
  details: string;
  closeDetails: string;
  language: string;
  chapters: readonly StageChapterCopy[];
}

export interface StagePlayerOptions {
  steps: readonly TimelineStep[];
  duration: number;
  canvasAriaLabel: string;
}

export interface StagePlayer {
  canvas: HTMLCanvasElement;
  stage: HTMLElement;
  overlay: HTMLDivElement;
  languageButton: HTMLButtonElement;
  detailsButton: HTMLButtonElement;
  applyCopy(copy: StagePlayerCopy, language: AppLanguage): void;
  bindController(controller: LoopAnimationController): void;
  renderAt(time: number): void;
  dispose(): void;
}

export function createStagePlayer(root: HTMLDivElement, options: StagePlayerOptions): StagePlayer {
  const total = options.steps.length;
  const weights = options.steps.map((step) => Math.max(0.001, step.end - step.start));

  root.innerHTML = `
    <div class="story-player">
      <main id="story-stage" class="story-stage">
        <canvas id="story-canvas" aria-label="${escapeHtml(options.canvasAriaLabel)}"></canvas>
        <div class="story-stage-shade"></div>
        <div id="story-overlay" class="story-overlay"></div>

        <header class="story-header">
          <a class="story-identity" href="./" aria-label="Back to Loop Animation gallery">
            <span class="story-mark"></span>
            <span class="story-identity-copy">
              <strong id="story-brand"></strong>
              <small id="story-category"></small>
            </span>
          </a>
          <div class="story-topic">
            <strong id="story-topic-title"></strong>
            <span id="story-topic-lead"></span>
          </div>
          <button id="story-language" class="story-language" type="button"></button>
        </header>

        <section id="story-caption" class="story-caption" aria-live="polite">
          <div class="story-caption-meta">
            <span id="story-chapter-count"></span>
            <i></i>
            <span id="story-chapter-label"></span>
          </div>
          <h1 id="story-chapter-title"></h1>
          <p id="story-chapter-summary"></p>
          <button id="story-details-button" class="story-details-button" type="button"></button>
        </section>

        <aside id="story-details" class="story-details" aria-hidden="true">
          <button id="story-details-close" class="story-details-close" type="button" aria-label="Close">×</button>
          <span id="story-details-label" class="story-details-label"></span>
          <h2 id="story-details-title"></h2>
          <p id="story-details-body"></p>
          <div class="story-keyline">
            <span id="story-key-word"></span>
            <strong id="story-key"></strong>
          </div>
        </aside>

        <footer class="story-controls" data-export-hide>
          <div class="story-transport">
            <button id="story-previous" type="button" class="story-control-button" aria-label="Previous chapter">←</button>
            <button id="story-play" type="button" class="story-play-button" aria-label="Play"></button>
            <button id="story-next" type="button" class="story-control-button" aria-label="Next chapter">→</button>
          </div>

          <div id="story-line" class="story-line">
            <div id="story-line-track" class="story-line-track" role="slider" tabindex="0" aria-label="Timeline" aria-valuemin="0" aria-valuemax="${options.duration}" aria-valuenow="0">
              <i class="story-line-fill"></i><b class="story-playhead"></b>
            </div>
            <div class="story-chapters">
              ${options.steps.map((step, index) => `
                <button type="button" class="story-chapter-button" data-chapter="${index}" style="--chapter-weight:${weights[index]}">
                  <span>${String(index + 1).padStart(2, '0')}</span>
                  <strong>${escapeHtml(step.id)}</strong>
                </button>
              `).join('')}
            </div>
          </div>

          <time id="story-time">0.0s</time>
        </footer>
      </main>
    </div>
  `;

  const stage = get<HTMLElement>('#story-stage');
  const canvas = get<HTMLCanvasElement>('#story-canvas');
  const overlay = get<HTMLDivElement>('#story-overlay');
  const languageButton = get<HTMLButtonElement>('#story-language');
  const detailsButton = get<HTMLButtonElement>('#story-details-button');
  const detailsPanel = get<HTMLElement>('#story-details');
  const detailsClose = get<HTMLButtonElement>('#story-details-close');
  const previousButton = get<HTMLButtonElement>('#story-previous');
  const playButton = get<HTMLButtonElement>('#story-play');
  const nextButton = get<HTMLButtonElement>('#story-next');
  const line = get<HTMLElement>('#story-line');
  const lineTrack = get<HTMLElement>('#story-line-track');
  const timeLabel = get<HTMLTimeElement>('#story-time');
  const caption = get<HTMLElement>('#story-caption');
  const chapterButtons = [...root.querySelectorAll<HTMLButtonElement>('.story-chapter-button')];

  const brand = get<HTMLElement>('#story-brand');
  const category = get<HTMLElement>('#story-category');
  const topicTitle = get<HTMLElement>('#story-topic-title');
  const topicLead = get<HTMLElement>('#story-topic-lead');
  const chapterCount = get<HTMLElement>('#story-chapter-count');
  const chapterLabel = get<HTMLElement>('#story-chapter-label');
  const chapterTitle = get<HTMLElement>('#story-chapter-title');
  const chapterSummary = get<HTMLElement>('#story-chapter-summary');
  const detailsLabel = get<HTMLElement>('#story-details-label');
  const detailsTitle = get<HTMLElement>('#story-details-title');
  const detailsBody = get<HTMLElement>('#story-details-body');
  const keyWord = get<HTMLElement>('#story-key-word');
  const key = get<HTMLElement>('#story-key');

  let currentCopy: StagePlayerCopy | null = null;
  let lastChapter = -1;
  let lastTimeLabel = Number.NEGATIVE_INFINITY;
  let unsubscribe: (() => void) | null = null;
  let controllerRef: LoopAnimationController | null = null;
  let detailsOpen = false;
  let draggingTimeline = false;

  function applyCopy(copy: StagePlayerCopy, language: AppLanguage) {
    currentCopy = copy;
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    window.__LOOP_STORY__ = buildStoryManifest({
      language,
      duration: options.duration,
      topicTitle: copy.topicTitle,
      topicLead: copy.topicLead,
      steps: options.steps,
      chapters: copy.chapters,
    });
    brand.textContent = copy.brand;
    category.textContent = copy.category;
    topicTitle.textContent = copy.topicTitle;
    topicLead.textContent = copy.topicLead;
    languageButton.textContent = copy.language;
    detailsButton.textContent = copy.details;
    detailsClose.title = copy.closeDetails;
    keyWord.textContent = copy.keyWord;
    previousButton.title = copy.previous;
    nextButton.title = copy.next;

    copy.chapters.forEach((chapter, index) => {
      const label = chapterButtons[index]?.querySelector('strong');
      if (label) label.textContent = chapter.label;
    });

    lastChapter = -1;
    renderAt(controllerRef?.currentTime ?? 0);
  }

  function renderChapter(index: number) {
    if (!currentCopy) return;
    const chapter = currentCopy.chapters[index];
    if (!chapter) return;

    chapterCount.textContent = `${currentCopy.chapterWord} ${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
    chapterLabel.textContent = chapter.label;
    chapterTitle.textContent = chapter.title;
    chapterSummary.textContent = chapter.summary;
    detailsLabel.textContent = chapter.label;
    detailsTitle.textContent = chapter.title;
    detailsBody.textContent = chapter.details;
    key.textContent = chapter.key;

    chapterButtons.forEach((button, buttonIndex) => {
      button.classList.toggle('is-active', buttonIndex === index);
      button.classList.toggle('is-past', buttonIndex < index);
    });

    previousButton.disabled = index === 0;
    nextButton.disabled = index === total - 1;
    lastChapter = index;
  }

  function renderAt(time: number) {
    if (!currentCopy) return;
    const index = stepIndexAt(options.steps, time);
    if (index !== lastChapter) renderChapter(index);

    const step = options.steps[index];
    const fadeIn = reveal(time, step.start, Math.min(step.end, step.start + 0.28));
    const fadeOut = 1 - reveal(time, Math.max(step.start, step.end - 0.22), step.end);
    caption.style.setProperty('--caption-opacity', String(Math.min(fadeIn, fadeOut)));

    const progress = Math.min(1, Math.max(0, time / options.duration));
    line.style.setProperty('--story-progress', String(progress));
    lineTrack.setAttribute('aria-valuenow', time.toFixed(2));

    if (Math.abs(time - lastTimeLabel) >= 0.1 || time === 0 || time >= options.duration) {
      timeLabel.textContent = `${time.toFixed(1)}s`;
      lastTimeLabel = time;
    }
  }

  function renderSnapshot(snapshot: TimelineSnapshot) {
    renderAt(snapshot.time);
    if (!currentCopy) return;
    playButton.textContent = snapshot.playing ? 'Ⅱ' : '▶';
    playButton.title = snapshot.playing ? currentCopy.pause : currentCopy.play;
    playButton.setAttribute('aria-label', snapshot.playing ? currentCopy.pause : currentCopy.play);
  }

  function bindController(controller: LoopAnimationController) {
    controllerRef = controller;
    unsubscribe?.();
    unsubscribe = controller.subscribe?.(renderSnapshot) ?? null;

    chapterButtons.forEach((button, index) => button.addEventListener('click', () => controller.goToStep?.(index)));
    previousButton.addEventListener('click', () => controller.previousStep?.());
    nextButton.addEventListener('click', () => controller.nextStep?.());
    playButton.addEventListener('click', () => controller.isPlaying ? controller.pause() : controller.play());
  }

  function seekFromPointer(clientX: number) {
    if (!controllerRef) return;
    const rect = lineTrack.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / Math.max(1, rect.width)));
    controllerRef.seek(ratio * options.duration);
  }

  lineTrack.addEventListener('pointerdown', (event) => {
    draggingTimeline = true;
    lineTrack.setPointerCapture(event.pointerId);
    seekFromPointer(event.clientX);
  });
  lineTrack.addEventListener('pointermove', (event) => {
    if (draggingTimeline) seekFromPointer(event.clientX);
  });
  lineTrack.addEventListener('pointerup', (event) => {
    draggingTimeline = false;
    if (lineTrack.hasPointerCapture(event.pointerId)) lineTrack.releasePointerCapture(event.pointerId);
  });
  lineTrack.addEventListener('pointercancel', () => { draggingTimeline = false; });
  lineTrack.addEventListener('keydown', (event) => {
    if (!controllerRef) return;
    const jump = event.shiftKey ? 1 : 0.25;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      controllerRef.seek(Math.min(options.duration, controllerRef.currentTime + jump));
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      controllerRef.seek(Math.max(0, controllerRef.currentTime - jump));
    } else if (event.key === 'Home') {
      event.preventDefault(); controllerRef.seek(0);
    } else if (event.key === 'End') {
      event.preventDefault(); controllerRef.seek(options.duration);
    }
  });

  function setDetailsOpen(open: boolean) {
    detailsOpen = open;
    detailsPanel.classList.toggle('is-open', open);
    detailsPanel.setAttribute('aria-hidden', String(!open));
    detailsButton.setAttribute('aria-expanded', String(open));
    if (currentCopy) detailsButton.textContent = open ? currentCopy.closeDetails : currentCopy.details;
  }

  detailsButton.addEventListener('click', () => setDetailsOpen(!detailsOpen));
  detailsClose.addEventListener('click', () => setDetailsOpen(false));

  function dispose() {
    unsubscribe?.();
    unsubscribe = null;
    if (window.__LOOP_STORY__) delete window.__LOOP_STORY__;
  }

  return {
    canvas,
    stage,
    overlay,
    languageButton,
    detailsButton,
    applyCopy,
    bindController,
    renderAt,
    dispose,
  };
}

function get<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing ${selector}`);
  return element;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character] ?? character);
}
