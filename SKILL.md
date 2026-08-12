---
name: loop-animation
description: Create polished interactive educational explainers with Three.js, continuous deterministic motion, guided narration, and HTML/MP4/GIF/PNG/SRT/VTT export.
---

# Loop Animation

> Canonical Codex-discoverable copy: `.agents/skills/loop-animation/SKILL.md`

Loop Animation treats an explainer as **one continuous visual world**, not a set of animated slides.

## Core architecture

```text
continuous world S(t)
        +
Story Manifest
        +
replaceable interaction UI
        ↓
HTML / MP4 / GIF / PNG / SRT / VTT / narration JSON
```

Chapters are narration/navigation metadata. They must not own separate camera or object states.

### Do this

```ts
const rain = envelope(time, 8.5, 10.5, 16.5, 18.5);
material.opacity = rain;
cameraCurve.getPointAt(time / duration, camera.position);
```

### Avoid this

```ts
if (step === 2) object.visible = true;
if (step === 3) camera.position.set(...);
```

Those patterns create visual jumps at chapter boundaries.

## Runtime rules

- `renderAt(seconds)` is the deterministic visual source of truth.
- `window.__LOOP_STORY__` is the localized narration/timing source of truth for flagship StagePlayer demos.
- Same timestamp = same conceptual frame, independent of FPS or previous seeks.
- Use `DeterministicTimeline` from `src/runtime/animation.ts`.
- Use `reveal()` / `envelope()` for overlapping transitions.
- Use `observeRendererViewport()` instead of resizing WebGL every frame.
- Prefer `THREE.Points` / `InstancedMesh` over many particle Meshes.
- Update chapter text only when the chapter changes.
- Seed procedural randomness.

## UI direction

Default to a **stage-first interactive film** rather than a dashboard. Share playback/navigation behavior without forcing every topic into the same visual composition.

## QA

```bash
npm run typecheck
npm run build
npm run qa:continuity
```

Boundary QA samples `t - 1 frame`, `t`, and `t + 1 frame` and reports suspicious asymmetric visual changes.

## Story export

```bash
npm run story:water:zh
npm run story:water:en
npm run story:eclipse:zh
npm run story:eclipse:en
```

Produces localized narration JSON / Markdown plus SRT and WebVTT captions from the same Story Manifest used by the interactive page.

## Visual export

```bash
npm run export:mp4
npm run export:gif
npm run export:png
```

For full production rules, read `.agents/skills/loop-animation/SKILL.md`.
