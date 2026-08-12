export type RenderCallback = (time: number, progress: number) => void;

export interface LoopAnimationController {
  readonly duration: number;
  readonly ready: boolean;
  renderAt(time: number): void;
  play(): void;
  pause(): void;
  seek(time: number): void;
  destroy(): void;
}

export interface TimelineOptions {
  duration: number;
  onRender: RenderCallback;
  onPlayStateChange?: (playing: boolean) => void;
}

export class DeterministicTimeline implements LoopAnimationController {
  public readonly duration: number;
  public ready = true;

  private readonly onRender: RenderCallback;
  private readonly onPlayStateChange?: (playing: boolean) => void;
  private currentTime = 0;
  private isPlaying = false;
  private rafId: number | null = null;
  private playStartedAt = 0;
  private playStartedFrom = 0;

  constructor(options: TimelineOptions) {
    this.duration = Math.max(0.001, options.duration);
    this.onRender = options.onRender;
    this.onPlayStateChange = options.onPlayStateChange;
    this.renderAt(0);
  }

  renderAt(time: number): void {
    const clamped = Math.min(this.duration, Math.max(0, time));
    this.currentTime = clamped;
    this.onRender(clamped, clamped / this.duration);
  }

  seek(time: number): void {
    this.renderAt(time);
    if (this.isPlaying) {
      this.playStartedAt = performance.now();
      this.playStartedFrom = this.currentTime;
    }
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
