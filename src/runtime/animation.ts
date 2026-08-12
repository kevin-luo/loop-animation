export type RenderCallback = (time: number, progress: number) => void;

export interface TimelineStep {
  id: string;
  start: number;
  end: number;
}

export interface TimelineSnapshot {
  time: number;
  progress: number;
  stepIndex: number;
  playing: boolean;
}

export type TimelineListener = (snapshot: TimelineSnapshot) => void;

export interface LoopAnimationController {
  readonly duration: number;
  readonly ready: boolean;
  readonly qaTimes?: readonly number[];
  readonly boundaryTimes?: readonly number[];
  readonly currentTime: number;
  readonly steps?: readonly TimelineStep[];
  readonly currentStepIndex?: number;
  readonly isPlaying?: boolean;
  renderAt(time: number): void;
  play(): void;
  pause(): void;
  seek(time: number): void;
  goToStep?(index: number): void;
  nextStep?(): void;
  previousStep?(): void;
  subscribe?(listener: TimelineListener): () => void;
  destroy(): void;
}

export interface TimelineOptions {
  duration: number;
  onRender: RenderCallback;
  onPlayStateChange?: (playing: boolean) => void;
  qaTimes?: readonly number[];
  steps?: readonly TimelineStep[];
}

/**
 * Headless deterministic playback controller.
 *
 * The timeline owns time only. Chapters/steps are metadata used for navigation,
 * narration and QA; visual state must still be a continuous function of absolute
 * time inside onRender().
 */
export class DeterministicTimeline implements LoopAnimationController {
  public readonly duration: number;
  public readonly qaTimes: readonly number[];
  public readonly boundaryTimes: readonly number[];
  public readonly steps: readonly TimelineStep[];
  public ready = true;
  public currentTime = 0;
  public currentStepIndex = 0;

  private readonly onRender: RenderCallback;
  private readonly onPlayStateChange?: (playing: boolean) => void;
  private readonly listeners = new Set<TimelineListener>();
  private playing = false;
  private rafId: number | null = null;
  private playStartedAt = 0;
  private playStartedFrom = 0;

  constructor(options: TimelineOptions) {
    this.duration = Math.max(0.001, options.duration);
    this.onRender = options.onRender;
    this.onPlayStateChange = options.onPlayStateChange;
    this.steps = normalizeSteps(options.steps ?? [], this.duration);
    this.boundaryTimes = this.steps.slice(1).map((step) => step.start);
    this.qaTimes = normalizeQaTimes([
      ...(options.qaTimes ?? []),
      ...stepQaTimes(this.steps),
    ], this.duration);
    this.renderAt(0);
  }

  get isPlaying(): boolean {
    return this.playing;
  }

  renderAt(time: number): void {
    const clamped = Math.min(this.duration, Math.max(0, time));
    this.currentTime = clamped;
    this.currentStepIndex = stepIndexAt(this.steps, clamped);
    this.onRender(clamped, clamped / this.duration);
    this.emit();
  }

  seek(time: number): void {
    this.renderAt(time);
    if (this.playing) {
      this.playStartedAt = performance.now();
      this.playStartedFrom = this.currentTime;
    }
  }

  goToStep(index: number): void {
    if (this.steps.length === 0) return;
    const safeIndex = Math.min(this.steps.length - 1, Math.max(0, Math.round(index)));
    this.seek(this.steps[safeIndex].start);
  }

  nextStep(): void {
    if (this.steps.length === 0) return;
    this.goToStep(Math.min(this.steps.length - 1, this.currentStepIndex + 1));
  }

  previousStep(): void {
    if (this.steps.length === 0) return;
    const current = this.steps[this.currentStepIndex];
    const elapsedInStep = this.currentTime - (current?.start ?? 0);
    const target = elapsedInStep > 0.7 ? this.currentStepIndex : this.currentStepIndex - 1;
    this.goToStep(Math.max(0, target));
  }

  play(): void {
    if (this.playing) return;
    if (this.currentTime >= this.duration) this.currentTime = 0;

    this.playing = true;
    this.playStartedAt = performance.now();
    this.playStartedFrom = this.currentTime;
    this.onPlayStateChange?.(true);
    this.emit();

    const tick = (now: number) => {
      if (!this.playing) return;
      const elapsed = (now - this.playStartedAt) / 1000;
      const next = this.playStartedFrom + elapsed;
      this.renderAt(next);

      if (next >= this.duration) {
        this.pause();
        return;
      }

      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  pause(): void {
    if (!this.playing) return;
    this.playing = false;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.onPlayStateChange?.(false);
    this.emit();
  }

  subscribe(listener: TimelineListener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  destroy(): void {
    this.pause();
    this.listeners.clear();
    this.ready = false;
  }

  private snapshot(): TimelineSnapshot {
    return {
      time: this.currentTime,
      progress: this.currentTime / this.duration,
      stepIndex: this.currentStepIndex,
      playing: this.playing,
    };
  }

  private emit(): void {
    if (this.listeners.size === 0) return;
    const snapshot = this.snapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}

export function easeInOutCubic(t: number): number {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function smoothstep(t: number): number {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

export function smootherstep(t: number): number {
  const x = clamp01(t);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

export function segment(time: number, start: number, end: number): number {
  if (end <= start) return time >= end ? 1 : 0;
  return clamp01((time - start) / (end - start));
}

/** Smoothly rises from 0 → 1 over an absolute time interval. */
export function reveal(time: number, start: number, end: number): number {
  return smootherstep(segment(time, start, end));
}

/**
 * Smoothly fades in, holds, then fades out. Useful instead of visible=true/false
 * at chapter boundaries.
 */
export function envelope(
  time: number,
  fadeInStart: number,
  fadeInEnd: number,
  fadeOutStart: number,
  fadeOutEnd: number,
): number {
  const enter = reveal(time, fadeInStart, fadeInEnd);
  const leave = 1 - reveal(time, fadeOutStart, fadeOutEnd);
  return Math.min(enter, leave);
}

export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * clamp01(t);
}

export function stepIndexAt(steps: readonly TimelineStep[], time: number): number {
  if (steps.length === 0) return 0;
  const index = steps.findIndex((step) => time >= step.start && time < step.end);
  if (index >= 0) return index;
  return time < steps[0].start ? 0 : steps.length - 1;
}

export function stepProgressAt(step: TimelineStep, time: number): number {
  return segment(time, step.start, step.end);
}

export function stepQaTimes(steps: readonly TimelineStep[]): number[] {
  return steps.flatMap((step) => {
    const span = Math.max(0.001, step.end - step.start);
    return [
      step.start,
      step.start + span * 0.5,
      Math.max(step.start, step.end - 0.001),
    ];
  });
}

export function boundaryQaTimes(steps: readonly TimelineStep[], fps = 30): number[] {
  const epsilon = 1 / Math.max(1, fps);
  return steps.slice(1).flatMap((step) => [
    Math.max(0, step.start - epsilon),
    step.start,
    step.start + epsilon,
  ]);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function normalizeSteps(steps: readonly TimelineStep[], duration: number): readonly TimelineStep[] {
  return steps
    .map((step, index) => ({
      id: step.id || `step-${index + 1}`,
      start: Math.min(duration, Math.max(0, step.start)),
      end: Math.min(duration, Math.max(0, step.end)),
    }))
    .filter((step) => step.end > step.start)
    .sort((a, b) => a.start - b.start);
}

function normalizeQaTimes(times: readonly number[], duration: number): readonly number[] {
  const defaults = [0, duration * 0.25, duration * 0.5, duration * 0.75, Math.max(0, duration - 0.001)];
  const source = times.length > 0 ? [...times, ...defaults] : defaults;
  return [...new Set(source.map((time) => Number(Math.min(duration, Math.max(0, time)).toFixed(3))))].sort((a, b) => a - b);
}
