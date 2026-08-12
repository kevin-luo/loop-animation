import type { LoopAnimationController } from './animation';

declare global {
  interface Window {
    __LOOP_ANIMATION__?: LoopAnimationController;
  }
}

export {};
