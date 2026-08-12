export type RenderCallback = (time: number, progress: number) => void;

export interface TimelineStep {
  id: string;
  start: number;
  end: number;
}

export interface LoopAnimationController {
  readonly duration: number;
  readonly ready: boolean;
  readonly qaTimes?: readonly number[];
  readonly currentTime: number;
  readonly steps?: readonly TimelineStep[];
  readonly currentStepIndex?: number;
  renderAt(time: number): void;
  play(): void;
  pause(): void;
  seek(time: number): void;
  goToStep?(index: number): void;
  nextStep?(): void;
  previousStep?(): void;
  destroy(): void;
}

export interface TimelineOptions {
  duration: number;
  onRender: RenderCallback;
  onPlayStateChange?: (playing: boolean) => void;
  qaTimes?: readonly number[];
  steps?: readonly TimelineStep[];
}

export class DeterministicTimeline implements LoopAnimationController {
  public readonly duration: number;
  public readonly qaTimes: readonly number[];
  public readonly steps: readonly TimelineStep[];
  public ready = true;
  public currentTime = 0;
  public currentStepIndex = 0;

  private readonly onRender: RenderCallback;
  private readonly onPlayStateChange?: (playing: boolean) => void;
  private isPlaying = false;
  private rafId: number | null = null;
  private playStartedAt = 0;
  private playStartedFrom = 0;

  constructor(options: TimelineOptions) {
    this.duration = Math.max(0.001, options.duration);
    this.onRender = options.onRender;
    this.onPlayStateChange = options.onPlayStateChange;
    this.steps = normalizeSteps(options.steps ?? [], this.duration);
    this.qaTimes = normalizeQaTimes([
      ...(options.qaTimes ?? []),
      ...stepQaTimes(this.steps),
    ], this.duration);
    this.renderAt(0);
  }

  renderAt(time: number): void {
    const clamped = Math.min(this.duration, Math.max(0, time));
    this.currentTime = clamped;
    this.currentStepIndex = stepIndexAt(this.steps, clamped);
    this.onRender(clamped, clamped / this.duration);
  }

  seek(time: number): void {
    this.renderAt(time);
    if (this.isPlaying) {
      this.playStartedAt = performance.now();
      this.playStartedFrom = this.currentTime;
    }
  }

  goToStep(index: number): void {
    if (this.steps.length === 0) return;
    const safeIndex = Math.min(this.steps.length - 1, Math.max(0, Math.round(index)));
    this.seek(this.steps[safeIndex].start + 0.001);
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
    if (this.isPlaying) return;
    if (this.currentTime >= this.duration) this.currentTime = 0;

    this.isPlaying = true;
    this.playStartedAt = performance.now();
    this.playStartedFrom = this.currentTime;
    this.onPlayStateChange?.(true);

    const tick = (now: number) => {
      if (!this.isPlaying) return;
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
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.onPlayStateChange?.(false);
  }

  destroy(): void {
    this.pause();
    this.ready = false;
  }
}

export function easeInOutCubic(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function segment(time: number, start: number, end: number): number {
  if (end <= start) return time >= end ? 1 : 0;
  return Math.min(1, Math.max(0, (time - start) / (end - start)));
}

export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * Math.min(1, Math.max(0, t));
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
