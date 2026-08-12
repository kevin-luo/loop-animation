---
name: loop-animation
description: Create polished interactive educational explainers with Three.js, then export the same deterministic animation as HTML, MP4, GIF, or PNG. Use when a user asks for a science, technology, math, history, mechanism, process, scale, comparison, timeline, or conceptual animation/explainer.
---

# Loop Animation

Create explanations that teach through space, motion, interaction, and visual causality.

## Core principle

The HTML experience is the source artifact. Video, GIF, and poster images are deterministic renders of that same experience.

Do not generate a slide deck disguised as an animation. Do not animate paragraphs. Animate the idea.

## Required workflow

1. **Verify the concept**
   - Identify the exact learning goal in one sentence.
   - For factual/scientific topics, verify uncertain claims before encoding them visually.
   - Separate simplified teaching models from literal physical scale or behavior.

2. **Choose a visual grammar**
   Pick the smallest useful set:
   - `scale`: relative size, distance, orders of magnitude
   - `inside`: layers, internals, anatomy, architecture
   - `flow`: packets, energy, matter, money, signals
   - `compare`: side-by-side mechanisms or outcomes
   - `cause-effect`: causal chains and feedback loops
   - `timeline`: evolution through time
   - `orbit/spatial`: spatial relationships and geometry
   - `simulation`: user-adjustable parameters

3. **Storyboard before coding**
   For each scene define:
   - start/end time
   - narration or teaching sentence
   - visible objects
   - motion and transformation
   - why the motion helps understanding

4. **Build with deterministic time**
   - Use Three.js for the visual world.
   - Use DOM/CSS overlays for concise labels and UI when they are clearer than 3D text.
   - The animation MUST expose `window.__LOOP_ANIMATION__`.
   - `renderAt(seconds)` is the source of truth.
   - Never make exported results depend on elapsed wall-clock time or frame rate.

5. **Make HTML interactive**
   Unless the user explicitly requests video-only output, include:
   - play/pause
   - scrub/seek
   - responsive resize
   - at least one meaningful interaction when the concept benefits from it

6. **Render and inspect**
   - Build the project.
   - Export a poster or representative frames.
   - Check overlap, clipping, contrast, excessive text, dead time, misleading geometry, and mobile readability.
   - Fix visible problems before final export.

7. **Export requested formats**
   - HTML: `npm run build` → `dist/`
   - MP4: `npm run export:mp4`
   - GIF: `npm run export:gif`
   - PNG: `npm run export:png`

## Runtime contract

Every explainer must expose:

```ts
interface LoopAnimationController {
  duration: number;
  ready: boolean;
  renderAt(time: number): void;
  play(): void;
  pause(): void;
  seek(time: number): void;
  destroy(): void;
}
```

Attach the controller:

```ts
window.__LOOP_ANIMATION__ = controller;
```

## Visual quality rules

Prefer:
- one visual idea per scene
- transformations that preserve object continuity
- physical/spatial explanation over decorative motion
- labels anchored to the object they explain
- strong hierarchy and generous negative space
- restrained camera movement
- responsive layouts that remain legible at 9:16 and 16:9

Avoid:
- generic glowing cards
- neon gradients as decoration
- random particles without meaning
- constant zooming
- large text blocks
- objects appearing/disappearing without conceptual reason
- more than two simultaneous focal points
- tiny labels baked into 3D geometry

## Aspect ratios

Default to responsive HTML. For exports use the user's requested target:
- `1920x1080` — landscape / Bilibili / YouTube
- `1080x1920` — vertical / Shorts / Douyin
- `1080x1440` — 3:4 social post
- `1080x1080` — square

Do not hard-code composition to one viewport. Re-check camera framing and overlays after aspect-ratio changes.

## Project structure

Keep generated work easy to inspect:

```text
src/
  runtime/
  examples/<topic>/
scripts/
references/
```

For a new explainer, duplicate the nearest example and replace topic-specific scene objects and storyboard logic rather than rewriting the export pipeline.
