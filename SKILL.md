---
name: loop-animation
description: Create polished interactive educational explainers with Three.js, continuous deterministic motion, guided narration, and HTML/MP4/GIF/PNG export.
---

# Loop Animation

> Canonical Codex-discoverable copy: `.agents/skills/loop-animation/SKILL.md`

Loop Animation treats an explainer as **one continuous visual world**, not a set of animated slides.

## Core architecture

```text
continuous world S(t)
        +
chapter metadata
        +
replaceable interaction UI
```

Chapters are narration and navigation markers. They must not own separate camera/object states.

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

- `renderAt(seconds)` is the deterministic source of truth.
- Same timestamp = same frame, independent of FPS or previous seeks.
- Use `DeterministicTimeline` from `src/runtime/animation.ts`.
- Use `reveal()` / `envelope()` for overlapping transitions.
- Use `observeRendererViewport()` instead of resizing WebGL every frame.
- Prefer `THREE.Points` / `InstancedMesh` over many particle Meshes.
- Update chapter text only when the chapter changes.
- Seed procedural randomness.

## UI direction

Default to a **stage-first interactive film** rather than a dashboard.

Prefer:

- a large uninterrupted visual stage
- one concise lower-third explanation
- an integrated storyline/progress control
- deeper explanation on demand
- language switching instead of mixed bilingual copy

`src/runtime/stage-player.ts` is a starting view layer, not a mandatory template.

## QA

```bash
npm run typecheck
npm run build
npm run qa:water
npm run qa:water:strict
```

QA now samples chapter boundaries at `t - 1 frame`, `t`, and `t + 1 frame` and reports suspicious asymmetric pixel changes.

## Export

```bash
npm run export:mp4
npm run export:gif
npm run export:png
```

The same deterministic HTML source should drive video, GIF, poster, narration, subtitles and QA.

For full production rules, read `.agents/skills/loop-animation/SKILL.md`.
