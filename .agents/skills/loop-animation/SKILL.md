---
name: loop-animation
description: Create polished interactive educational explainers with Three.js and deterministic step-based timelines, then export the same work as HTML, MP4, GIF, or PNG. Use for science, technology, math, history, mechanisms, processes, scale comparisons, timelines, spatial explanations, simulations, or any concept that benefits from motion and guided explanation.
---

# Loop Animation

Create explanations that teach through **narration + visible change + interaction**.

## Core principle

The interactive HTML experience is the source artifact. MP4, GIF, PNG, subtitles, narration scripts, and QA frames are deterministic renders or derivatives of the same explainer.

Do not generate a slide deck disguised as an animation. Do not place a short paragraph above an unrelated moving scene. **Every explanatory step must cause a meaningful visual change.**

> Don't animate text. Animate ideas — and explain what the viewer is seeing while it changes.

## Required workflow

### 1. Define and verify the learning goal

Write one sentence first:

> After watching this, the viewer should understand ____.

For factual or scientific subjects, verify uncertain claims before encoding them visually. Clearly distinguish a simplified teaching model from literal scale or physical behavior.

### 2. Break the explanation into 5–8 teachable steps

A normal explainer should have **5 to 8 steps**, not one long animation with four vague captions.

Each step MUST define:

- `id`
- start and end time
- short step title
- 1 concise explanatory paragraph
- one key takeaway
- visible objects involved
- the exact visual change that occurs during the step
- optional interaction available in HTML

A good step answers one question only.

Example:

```text
Step 1 — Establish the system
Explain: Sun emits light, Moon orbits Earth.
Visual change: reveal bodies and orbital path.

Step 2 — Show orbital tilt
Explain: lunar orbit is tilted about 5.1° to the ecliptic.
Visual change: reveal both planes and highlight the angle.

Step 3 — Approach a node
Explain: new moon must occur near an orbital node.
Visual change: illuminate the two nodes and move the Moon toward one.
```

Do not advance to the next step if the current step has not created a visibly different state.

### 3. Choose the visual grammar

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

### 4. Storyboard before coding

For every step define:

- start and end time
- narration / explanatory copy
- key takeaway
- visible objects
- motion or transformation
- why that motion improves understanding
- any interaction available in HTML

Keep one primary visual idea per step.

### 5. Use a step-aware deterministic timeline

Use Three.js for the visual world and DOM/CSS overlays for concise narration, labels, controls, formulas, and annotations when they are clearer than 3D text.

Every animation MUST expose:

```ts
window.__LOOP_ANIMATION__
```

The controller contract is:

```ts
interface LoopAnimationController {
  duration: number;
  ready: boolean;
  currentTime: number;
  qaTimes?: readonly number[];
  steps?: readonly TimelineStep[];
  currentStepIndex?: number;
  renderAt(time: number): void;
  play(): void;
  pause(): void;
  seek(time: number): void;
  goToStep?(index: number): void;
  nextStep?(): void;
  previousStep?(): void;
  destroy(): void;
}
```

Prefer the shared `DeterministicTimeline` in `src/runtime/animation.ts` and pass `steps` to it.

`renderAt(seconds)` is the source of truth. A frame at the same timestamp must be visually reproducible regardless of playback speed, frame rate, or previous seeks.

Never drive export-critical state from accumulated `deltaTime`, uncontrolled randomness, or wall-clock time. Seed procedural randomness.

### 6. Make the HTML a guided lesson, not a passive player

Unless the user explicitly requests video-only output, include:

- current step number, e.g. `03 / 06`
- current step title
- concise explanation of what is happening
- one key takeaway or conclusion
- previous / next step controls
- clickable step progress indicators
- play / pause
- scrub / seek
- responsive resize
- readable anchored labels
- language switching when multiple languages are requested

The HTML version should let a learner pause on any step and understand the state without needing the animation to keep running.

If a user asks for bilingual output, use **language switching**, not mixed-language copy on the same screen.

### 7. Synchronize explanation and motion

This is mandatory.

When the explanation says:

> “The lunar orbit is tilted.”

The visual must reveal or emphasize the two orbital planes and the tilt.

When it says:

> “The umbra reaches Earth.”

The visual must reveal the umbra and its contact with Earth.

Avoid captions that merely describe a scene that looks almost identical to the previous step.

### 8. Derive video narration and subtitles from the same steps

For MP4/GIF workflows, the step copy should also provide the narration/subtitle source.

Recommended derived outputs:

```text
output/
├── video.mp4
├── preview.gif
├── poster.png
├── narration.md
├── subtitles.zh-CN.srt
└── storyboard.md
```

Do not maintain a separate script that can silently drift away from the visual timeline.

### 9. Build and run visual QA

Inside the Loop Animation repository:

```bash
npm run typecheck
npm run build
npm run qa
```

`npm run qa` generates a contact sheet plus timestamp metadata. Step boundaries and midpoints are automatically useful QA checkpoints when the timeline receives `steps`.

Inspect for:

- clipping and overlap
- tiny or low-contrast labels
- explanation panel covering the visual focus
- two adjacent steps that look almost identical
- narration changing before the visual changes
- misleading geometry
- abrupt state changes
- weak focal hierarchy
- poor 9:16 framing

Also run landscape QA when relevant:

```bash
npm run qa:landscape
```

Fix visible problems before final export.

### 10. Export requested formats

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

- one visual idea per step
- explanations that point to what is visibly changing
- transformations that preserve object continuity
- physical or spatial explanation over decorative motion
- labels anchored to the object they explain
- progressive disclosure
- strong hierarchy and generous negative space
- restrained camera movement
- responsive composition that survives both 9:16 and 16:9

Avoid:

- generic glowing cards
- neon gradients used only as decoration
- random particles without explanatory meaning
- constant zooming
- large text blocks
- one caption for several unrelated changes
- several steps with nearly identical frames
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

Do not hard-code composition for one viewport. Re-check camera framing, narration panels, DOM overlays, and label placement after aspect-ratio changes.

## Working in this repository

For a new explainer:

1. Read the nearest example in `src/examples/`.
2. Create a topic storyboard under `examples/<topic>/storyboard.md`.
3. Define 5–8 steps before writing Three.js code.
4. Reuse `src/runtime/animation.ts`; do not rewrite the timeline/export pipeline without a reason.
5. Add the new scene under `src/examples/<topic>/`.
6. Pass the step definitions into `DeterministicTimeline`.
7. Add guided step UI for HTML.
8. Run typecheck, build, QA, then the requested exports.
9. Update README examples when the new explainer is polished enough to showcase.

## Completion criteria

A task is complete only when:

- the concept is factually coherent
- the storyboard and step breakdown exist before implementation
- every step has narration + a visible state change
- previous / next step navigation works in HTML
- deterministic seeking works
- HTML is responsive
- bilingual output uses language switching rather than mixed copy
- QA output has been inspected
- requested export formats succeed
- the result still teaches when paused on any individual step
