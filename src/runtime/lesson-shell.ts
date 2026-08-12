import type { AppLanguage } from './i18n';
import type { LoopAnimationController, TimelineStep } from './animation';
import { stepIndexAt } from './animation';
import './lesson-shell.css';

export interface LessonStepCopy {
  nav: string;
  kicker: string;
  title: string;
  body: string;
  watch: string;
  key: string;
}

export interface LessonShellCopy {
  brand: string;
  category: string;
  topicLabel: string;
  topicTitle: string;
  topicLead: string;
  panelTitle: string;
  controlsTitle: string;
  stepWord: string;
  keyWord: string;
  watchWord: string;
  play: string;
  pause: string;
  previous: string;
  next: string;
  reset: string;
  lang: string;
  steps: readonly LessonStepCopy[];
}

export interface LessonShellOptions {
  steps: readonly TimelineStep[];
  duration: number;
  canvasAriaLabel: string;
}

export interface LessonShell {
  canvas: HTMLCanvasElement;
  overlay: HTMLDivElement;
  languageButton: HTMLButtonElement;
  previousButton: HTMLButtonElement;
  nextButton: HTMLButtonElement;
  playButton: HTMLButtonElement;
  resetButton: HTMLButtonElement;
  scrubber: HTMLInputElement;
  stepButtons: HTMLButtonElement[];
  pillButtons: HTMLButtonElement[];
  applyCopy(copy: LessonShellCopy, language: AppLanguage, playing: boolean): void;
  renderStep(time: number, copy: LessonShellCopy): number;
  renderTime(time: number): void;
  setPlaying(playing: boolean, copy: LessonShellCopy): void;
  bindController(controller: LoopAnimationController): void;
}

export function createLessonShell(root: HTMLDivElement, options: LessonShellOptions): LessonShell {
  const count = options.steps.length;
  root.innerHTML = `
    <div class="lesson-root">
      <div class="lesson-shell">
        <aside class="lesson-sidebar lesson-panel-surface">
          <div class="lesson-sidebar-head">
            <span class="lesson-brand-mark"></span>
            <div><div id="lesson-brand" class="lesson-brand"></div><div id="lesson-category" class="lesson-category"></div></div>
          </div>
          <div class="lesson-topic-card">
            <span id="lesson-topic-label" class="lesson-eyebrow"></span>
            <h1 id="lesson-topic-title"></h1>
            <p id="lesson-topic-lead"></p>
          </div>
          <div class="lesson-step-head"><span id="lesson-step-word"></span><b id="lesson-left-count">01 / ${pad(count)}</b></div>
          <div id="lesson-step-list" class="lesson-step-list">
            ${options.steps.map((step, index) => `
              <button class="lesson-step-item" type="button" data-step="${index}">
                <span class="lesson-step-index">${pad(index + 1)}</span>
                <span class="lesson-step-copy"><strong>${escapeHtml(step.id)}</strong><small></small></span>
                <i class="lesson-step-state"></i>
              </button>
            `).join('')}
          </div>
        </aside>

        <section class="lesson-stage lesson-panel-surface">
          <div class="lesson-stage-topbar">
            <span id="lesson-stage-count" class="lesson-stage-chip"></span>
            <span id="lesson-stage-name" class="lesson-stage-subchip"></span>
          </div>
          <canvas id="lesson-scene" aria-label="${escapeHtml(options.canvasAriaLabel)}"></canvas>
          <div class="lesson-stage-noise"></div>
          <div class="lesson-stage-vignette"></div>
          <div id="lesson-overlay" class="lesson-overlay"></div>
        </section>

        <aside class="lesson-explain lesson-panel-surface">
          <div class="lesson-explain-head">
            <div>
              <span id="lesson-panel-title" class="lesson-eyebrow"></span>
              <div class="lesson-panel-progress">
                <b id="lesson-panel-count">01 / ${pad(count)}</b>
                <div id="lesson-pills" class="lesson-pills">${options.steps.map((_, index) => `<button type="button" data-pill="${index}" aria-label="Step ${index + 1}"></button>`).join('')}</div>
              </div>
            </div>
            <button id="lesson-language" class="lesson-language" type="button"></button>
          </div>

          <div class="lesson-explain-card" aria-live="polite">
            <div id="lesson-kicker" class="lesson-kicker"></div>
            <h2 id="lesson-title"></h2>
            <p id="lesson-body" class="lesson-body"></p>
            <div class="lesson-meta-grid">
              <div class="lesson-meta-block"><span id="lesson-watch-word" class="lesson-meta-label"></span><p id="lesson-watch"></p></div>
              <div class="lesson-meta-block lesson-meta-block--key"><span id="lesson-key-word" class="lesson-meta-label"></span><p id="lesson-key"></p></div>
            </div>
          </div>

          <div class="lesson-explain-actions" data-export-hide>
            <button id="lesson-previous" type="button" class="lesson-button lesson-button--ghost"></button>
            <button id="lesson-next" type="button" class="lesson-button lesson-button--primary"></button>
          </div>
        </aside>
      </div>

      <footer class="lesson-transport lesson-panel-surface" data-export-hide>
        <div class="lesson-transport-head"><span id="lesson-controls-title" class="lesson-eyebrow"></span><b id="lesson-time">0.0 / ${Math.round(options.duration)}s</b></div>
        <div class="lesson-transport-main">
          <button id="lesson-reset" type="button" class="lesson-button lesson-button--ghost lesson-transport-button"></button>
          <button id="lesson-play" type="button" class="lesson-button lesson-button--primary lesson-transport-button"></button>
          <div class="lesson-scrubber-wrap">
            <input id="lesson-scrubber" type="range" min="0" max="${options.duration}" step="0.01" value="0" />
            <div class="lesson-scrubber-marks">${options.steps.slice(1).map((step) => `<i style="left:${(step.start / options.duration) * 100}%"></i>`).join('')}</div>
          </div>
        </div>
      </footer>
    </div>
  `;

  const canvas = get<HTMLCanvasElement>('#lesson-scene');
  const overlay = get<HTMLDivElement>('#lesson-overlay');
  const languageButton = get<HTMLButtonElement>('#lesson-language');
  const previousButton = get<HTMLButtonElement>('#lesson-previous');
  const nextButton = get<HTMLButtonElement>('#lesson-next');
  const playButton = get<HTMLButtonElement>('#lesson-play');
  const resetButton = get<HTMLButtonElement>('#lesson-reset');
  const scrubber = get<HTMLInputElement>('#lesson-scrubber');
  const stepButtons = [...root.querySelectorAll<HTMLButtonElement>('.lesson-step-item')];
  const pillButtons = [...root.querySelectorAll<HTMLButtonElement>('.lesson-pills button')];

  const brand = get<HTMLElement>('#lesson-brand');
  const category = get<HTMLElement>('#lesson-category');
  const topicLabel = get<HTMLElement>('#lesson-topic-label');
  const topicTitle = get<HTMLElement>('#lesson-topic-title');
  const topicLead = get<HTMLElement>('#lesson-topic-lead');
  const panelTitle = get<HTMLElement>('#lesson-panel-title');
  const controlsTitle = get<HTMLElement>('#lesson-controls-title');
  const stepWord = get<HTMLElement>('#lesson-step-word');
  const leftCount = get<HTMLElement>('#lesson-left-count');
  const stageCount = get<HTMLElement>('#lesson-stage-count');
  const stageName = get<HTMLElement>('#lesson-stage-name');
  const panelCount = get<HTMLElement>('#lesson-panel-count');
  const kicker = get<HTMLElement>('#lesson-kicker');
  const title = get<HTMLElement>('#lesson-title');
  const body = get<HTMLElement>('#lesson-body');
  const watchWord = get<HTMLElement>('#lesson-watch-word');
  const watch = get<HTMLElement>('#lesson-watch');
  const keyWord = get<HTMLElement>('#lesson-key-word');
  const key = get<HTMLElement>('#lesson-key');
  const timeLabel = get<HTMLElement>('#lesson-time');

  function applyCopy(copy: LessonShellCopy, language: AppLanguage, playing: boolean) {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    brand.textContent = copy.brand;
    category.textContent = copy.category;
    topicLabel.textContent = copy.topicLabel;
    topicTitle.textContent = copy.topicTitle;
    topicLead.textContent = copy.topicLead;
    panelTitle.textContent = copy.panelTitle;
    controlsTitle.textContent = copy.controlsTitle;
    stepWord.textContent = copy.stepWord;
    watchWord.textContent = copy.watchWord;
    keyWord.textContent = copy.keyWord;
    languageButton.textContent = copy.lang;
    previousButton.textContent = `← ${copy.previous}`;
    nextButton.textContent = `${copy.next} →`;
    resetButton.textContent = copy.reset;
    playButton.textContent = playing ? copy.pause : copy.play;
    copy.steps.forEach((step, index) => {
      const strong = stepButtons[index]?.querySelector('strong');
      const small = stepButtons[index]?.querySelector('small');
      if (strong) strong.textContent = step.nav;
      if (small) small.textContent = step.title;
    });
  }

  function renderStep(time: number, copy: LessonShellCopy) {
    const index = stepIndexAt(options.steps, time);
    const step = copy.steps[index];
    const countText = `${pad(index + 1)} / ${pad(count)}`;
    leftCount.textContent = countText;
    stageCount.textContent = `${copy.stepWord} ${countText}`;
    stageName.textContent = step.nav;
    panelCount.textContent = countText;
    kicker.textContent = step.kicker;
    title.textContent = step.title;
    body.textContent = step.body;
    watch.textContent = step.watch;
    key.textContent = step.key;
    stepButtons.forEach((button, buttonIndex) => {
      button.classList.toggle('is-active', buttonIndex === index);
      button.classList.toggle('is-done', buttonIndex < index);
    });
    pillButtons.forEach((button, buttonIndex) => {
      button.classList.toggle('is-active', buttonIndex === index);
      button.classList.toggle('is-done', buttonIndex < index);
    });
    previousButton.disabled = index === 0 && time < options.steps[0].start + 0.7;
    nextButton.disabled = index === count - 1;
    return index;
  }

  function renderTime(time: number) {
    scrubber.value = String(time);
    timeLabel.textContent = `${time.toFixed(1)} / ${Math.round(options.duration)}s`;
  }

  function setPlaying(playing: boolean, copy: LessonShellCopy) {
    playButton.textContent = playing ? copy.pause : copy.play;
  }

  function bindController(controller: LoopAnimationController) {
    stepButtons.forEach((button, index) => button.addEventListener('click', () => controller.goToStep?.(index)));
    pillButtons.forEach((button, index) => button.addEventListener('click', () => controller.goToStep?.(index)));
    previousButton.addEventListener('click', () => controller.previousStep?.());
    nextButton.addEventListener('click', () => controller.nextStep?.());
    resetButton.addEventListener('click', () => { controller.pause(); controller.seek(0); });
    scrubber.addEventListener('input', () => controller.seek(Number(scrubber.value)));
  }

  return { canvas, overlay, languageButton, previousButton, nextButton, playButton, resetButton, scrubber, stepButtons, pillButtons, applyCopy, renderStep, renderTime, setPlaying, bindController };
}

function get<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing ${selector}`);
  return element;
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character);
}
