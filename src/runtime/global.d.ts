import type { LoopAnimationController } from './animation';
import type { StoryManifest } from './story';

declare global {
  interface Window {
    __LOOP_ANIMATION__?: LoopAnimationController;
    __LOOP_STORY__?: StoryManifest;
  }
}

export {};
