---
name: loop-animation
description: Create polished interactive educational explainers with Three.js and deterministic step-based timelines, then export the same work as HTML, MP4, GIF, or PNG.
---

# Loop Animation

Create explainers that combine **narration, visible change, and interaction**.

> Canonical Codex-discoverable copy: `.agents/skills/loop-animation/SKILL.md`

## Core principle

The interactive HTML experience is the source artifact. MP4, GIF, PNG, narration scripts, subtitles, and QA frames should come from the same deterministic explainer.

**Don't animate text. Animate ideas — and explain what changes at every step.**

## Required workflow

1. Define and verify one learning goal.
2. Break the topic into **5–8 teachable steps**.
3. Give every step a title, concise explanation, key takeaway, visible objects, and a meaningful visual change.
4. Choose the visual grammar: scale, inside, flow, compare, cause-effect, timeline, orbit/spatial, or simulation.
5. Storyboard before coding.
6. Build with Three.js plus concise DOM/CSS narration overlays.
7. Drive everything from deterministic `renderAt(seconds)`.
8. Pass step definitions into the shared `DeterministicTimeline`.
9. Make HTML navigable with previous / next step, step progress, play / pause, and scrub / seek.
10. For bilingual output, use language switching instead of mixed-language copy.
11. Run visual QA at step starts, midpoints, and boundaries.
12. Export HTML, MP4, GIF, or PNG from the same source.

## Step-aware runtime contract

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

Attach it as:

```ts
window.__LOOP_ANIMATION__ = controller;
```

A frame rendered at the same timestamp must be reproducible regardless of frame rate, previous seeks, or playback speed. Seed procedural randomness and avoid accumulated delta-time state for export-critical motion.

## Guided HTML requirements

Unless the user requests video-only output, show:

- current step, e.g. `03 / 06`
- step title
- short explanation
- one key takeaway
- previous / next step
- clickable step progress
- play / pause
- scrub / seek
- anchored labels
- language switch when needed

A learner should be able to pause on any step and still understand the current visual state.

## Quality loop

```bash
npm run typecheck
npm run build
npm run qa
npm run qa:landscape
```

Inspect the contact sheet for clipping, overlap, unreadable narration, steps that look too similar, narration that changes before the visual state changes, misleading geometry, and weak framing.

## Export

```bash
npm run export:mp4
npm run export:gif
npm run export:png
```

Custom example:

```bash
node scripts/export.mjs --format mp4 --width 1920 --height 1080 --fps 60
```

## Completion criteria

A task is complete only when the storyboard exists, every step has narration plus a visible change, step navigation works, deterministic seeking works, HTML is responsive, bilingual output switches language cleanly, QA has been inspected, requested exports succeed, and the result still teaches when paused on an individual step.
