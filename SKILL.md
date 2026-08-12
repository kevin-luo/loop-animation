---
name: loop-animation
description: Create polished interactive educational explainers with Three.js and deterministic timelines, then export the same animation as HTML, MP4, GIF, or PNG. Use for science, technology, math, history, mechanisms, processes, scale comparisons, timelines, spatial explanations, simulations, or any concept that benefits from motion and interaction.
---

# Loop Animation

Create explanations that teach through space, motion, interaction, and visual causality.

> Canonical Codex-discoverable copy: `.agents/skills/loop-animation/SKILL.md`

## Core principle

The interactive HTML experience is the source artifact. MP4, GIF, PNG, and QA frames are deterministic renders of the same animation.

Do not generate a slide deck disguised as an animation. Do not animate paragraphs. **Animate the idea.**

## Required workflow

1. Define and verify one learning goal.
2. Choose a visual grammar: scale, inside, flow, compare, cause-effect, timeline, orbit/spatial, or simulation.
3. Storyboard every scene before coding.
4. Build with Three.js plus concise DOM/CSS overlays.
5. Drive all animation from deterministic `renderAt(seconds)`.
6. Make HTML interactive and responsive.
7. Run visual QA with `npm run qa` and `npm run qa:landscape` when relevant.
8. Fix visible issues before export.
9. Export HTML, MP4, GIF, or PNG from the same source.

## Runtime contract

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

Attach it as:

```ts
window.__LOOP_ANIMATION__ = controller;
```

A frame rendered at the same timestamp must be reproducible regardless of frame rate, previous seeks, or playback speed. Seed procedural randomness and avoid accumulated delta-time state for export-critical motion.

## Quality loop

```bash
npm run typecheck
npm run build
npm run qa
npm run qa:landscape
```

Inspect `.output/qa/contact-sheet.png` for clipping, overlap, dead frames, unreadable labels, misleading geometry, and weak framing.

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

## Visual rules

Prefer object continuity, spatial explanation, anchored labels, strong hierarchy, negative space, restrained cameras, and responsive layouts.

Avoid decorative cards, random particles, constant zooming, long text, unexplained pop-in/out, more than two simultaneous focal points, and frame-rate-dependent animation.

## Completion criteria

A task is complete only when the storyboard exists, deterministic seeking works, HTML is responsive, QA output has been inspected, requested exports succeed, and the final result teaches through motion rather than paragraphs.
