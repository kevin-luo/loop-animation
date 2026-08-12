---
name: loop-animation
description: Create polished interactive educational explainers with Three.js and deterministic timelines, then export the same animation as HTML, MP4, GIF, or PNG. Use for science, technology, math, history, mechanisms, processes, scale comparisons, timelines, spatial explanations, simulations, or any concept that benefits from motion and interaction.
---

# Loop Animation

Create explanations that teach through space, motion, interaction, and visual causality.

## Core principle

The interactive HTML experience is the source artifact. MP4, GIF, PNG, and QA frames are deterministic renders of the same animation.

Do not generate a slide deck disguised as an animation. Do not animate paragraphs. **Animate the idea.**

## Required workflow

### 1. Define and verify the learning goal

Write one sentence first:

> After watching this, the viewer should understand ____.

For factual or scientific subjects, verify uncertain claims before encoding them visually. Clearly distinguish a simplified teaching model from literal scale or physical behavior.

### 2. Choose the visual grammar

Choose the smallest useful set:

- `scale` — relative size, distance, orders of magnitude
- `inside` — layers, internals, anatomy, architecture
- `flow` — packets, energy, matter, money, signals
- `compare` — side-by-side mechanisms or outcomes
- `cause-effect` — causal chains and feedback loops
- `timeline` — evolution through time
- `orbit/spatial` — spatial relationships and geometry
- `simulation` — user-adjustable parameters

Do not default to cards or bullet points when a spatial explanation is possible.

### 3. Storyboard before coding

For every scene define:

- start and end time
- one teaching sentence
- visible objects
- motion or transformation
- why that motion improves understanding
- any interaction available in HTML

Keep one primary visual idea per scene.

### 4. Build with deterministic time

Use Three.js for the visual world and DOM/CSS overlays for concise labels, controls, formulas, and annotations when they are clearer than 3D text.

Every animation MUST expose:

```ts
window.__LOOP_ANIMATION__
```

The controller contract is:

```ts
interface LoopAnimationController {
  duration: number;
  ready: boolean;
  qaTimes?: readonly number[];
  renderAt(time: number): void;
  play(): void;
  pause(): void;
  seek(time: number): void;
  destroy(): void;
}
```

`renderAt(seconds)` is the source of truth. A frame at the same timestamp must be visually reproducible regardless of playback speed, frame rate, or previous seeks.

Never drive export-critical state from accumulated `deltaTime`, uncontrolled randomness, or wall-clock time. Seed procedural randomness.

### 5. Make the HTML useful by itself

Unless the user explicitly requests video-only output, include:

- play / pause
- scrub / seek
- responsive resize
- readable labels
- at least one meaningful interaction when the concept benefits from it

The interactive version should add explanatory value rather than merely replaying a video in a browser.

### 6. Build and run visual QA

Inside the Loop Animation repository:

```bash
npm run typecheck
npm run build
npm run qa
```

`npm run qa` generates `.output/qa/contact-sheet.png` plus timestamp metadata. Inspect the contact sheet for:

- clipping and overlap
- tiny or low-contrast labels
- dead or nearly identical frames
- misleading geometry
- abrupt state changes
- weak focal hierarchy
- poor 9:16 framing

Also run landscape QA when relevant:

```bash
npm run qa:landscape
```

Fix visible problems before final export.

### 7. Export requested formats

```bash
npm run export:mp4
npm run export:gif
npm run export:png
npm run build
```

Outputs:

- HTML → `dist/`
- MP4 → `.output/video.mp4`
- GIF → `.output/preview.gif`
- PNG → `.output/poster.png`

For custom output dimensions, call the exporter directly:

```bash
node scripts/export.mjs --format mp4 --width 1920 --height 1080 --fps 60
```

## Visual quality rules

Prefer:

- one visual idea per scene
- transformations that preserve object continuity
- physical or spatial explanation over decorative motion
- labels anchored to the object they explain
- strong hierarchy and generous negative space
- restrained camera movement
- responsive composition that survives both 9:16 and 16:9

Avoid:

- generic glowing cards
- neon gradients used only as decoration
- random particles without explanatory meaning
- constant zooming
- large text blocks
- objects appearing and disappearing without conceptual reason
- more than two simultaneous focal points
- tiny labels baked into 3D geometry
- frame-rate-dependent simulation during deterministic export

## Aspect ratios

Default to responsive HTML. For export:

- `1920x1080` — landscape / Bilibili / YouTube
- `1080x1920` — vertical / Shorts / Douyin / Reels
- `1080x1440` — 3:4 social post
- `1080x1080` — square

Do not hard-code composition for one viewport. Re-check camera framing, DOM overlays, and label placement after aspect-ratio changes.

## Working in this repository

For a new explainer:

1. Read the nearest example in `src/examples/`.
2. Create a topic storyboard under `examples/<topic>/storyboard.md`.
3. Reuse `src/runtime/animation.ts`; do not rewrite the timeline/export pipeline without a reason.
4. Add the new scene under `src/examples/<topic>/`.
5. Set meaningful QA checkpoints when scene boundaries matter.
6. Run typecheck, build, QA, then the requested exports.
7. Update README examples when the new explainer is polished enough to showcase.

## Completion criteria

A task is complete only when:

- the concept is factually coherent
- the storyboard exists before implementation
- deterministic seeking works
- HTML is responsive
- QA output has been inspected
- requested export formats succeed
- the result teaches through motion instead of relying on paragraphs of text
