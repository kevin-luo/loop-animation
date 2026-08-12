---
name: loop-animation
description: Create polished interactive educational explainers with Three.js, continuous deterministic motion, hybrid raster/shader/3D visuals, guided narration, and HTML/MP4/GIF/PNG/SRT/VTT export.
---

# Loop Animation

> Canonical Codex-discoverable copy: `.agents/skills/loop-animation/SKILL.md`

Loop Animation treats an explainer as **one continuous visual world**, not a set of animated slides.

## Start here

A valid request can be as short as:

```text
$loop-animation

解释为什么飞机能飞起来。
```

or:

```text
$loop-animation

Explain why airplanes can fly.
```

Users do not need to provide Three.js implementation details. When non-critical details are missing, use sensible defaults and continue instead of repeatedly asking questions.

Default profile:

```text
Audience: general
Language: user's language
Duration: 30s
Aspect ratio: 16:9
Chapters: 5–7
Interaction: play/pause + draggable timeline + chapter navigation + deeper explanation
Primary output: interactive HTML
Continuity QA: strict
```

For a guided prompt builder and practical usage instructions:

```text
Live Gallery: https://kevin-luo.github.io/loop-animation/#prompt-builder
Guide: docs/USAGE.md
```

## Core architecture

```text
continuous world S(t)
        +
Story Manifest
        +
hybrid visual layers
        +
replaceable interaction UI
        ↓
HTML / MP4 / GIF / PNG / SRT / VTT / narration JSON
```

Chapters are narration/navigation metadata. They must not own separate camera or object states.

## Visual direction

Use the right rendering layer for the job:

```text
Three.js / shaders  → motion, camera, geometry, particles, interaction
Raster / img2       → rich environments, anatomy, detailed surfaces
HTML / CSS          → short explanations, controls, accessibility
Story Manifest      → narration, subtitles, future TTS
```

SVG and primitives remain useful for diagrams and algorithms. Do not force a rich natural scene into primitive drawing when raster/generated art or shaders would teach better.

Current visual reference:

```text
src/examples/water-v2/main.ts
```

## Continuity rules

Prefer:

```ts
const rain = envelope(time, 10.7, 12.5, 19.2, 21.0);
material.opacity = rain;
cameraCurve.getPointAt(time / duration, camera.position);
```

Avoid:

```ts
if (step === 2) object.visible = true;
if (step === 3) camera.position.set(...);
```

Never accumulate export-critical state from previous renders:

```ts
// bad
cloud.position.y += drift;

// good
cloud.position.y = baseY + wave(time);
```

## Runtime rules

- `renderAt(seconds)` is the deterministic visual source of truth.
- `window.__LOOP_STORY__` is the localized narration/timing source of truth for flagship StagePlayer demos.
- Same timestamp = same conceptual frame, independent of FPS or previous seeks.
- Use `DeterministicTimeline`.
- Use `reveal()` / `envelope()` for overlapping transitions.
- Use `observeRendererViewport()` instead of resizing WebGL every frame.
- Prefer `THREE.Points` / `InstancedMesh` for repeated particles.
- Seed procedural randomness.
- Keep controls and captions away from the main subject.
- Lazy-load non-primary WebGL previews on gallery pages.

## QA

```bash
npm run typecheck
npm run build
npm run qa:continuity
```

Water v2:

```bash
npm run qa:water-v2:strict
```

Boundary QA samples `t - 1 frame`, `t`, and `t + 1 frame` and reports suspicious asymmetric visual changes.

## Story export

```bash
npm run story:water-v2:zh
npm run story:water-v2:en
npm run story:eclipse:zh
npm run story:eclipse:en
```

## Visual export

```bash
npm run export:water-v2:mp4
npm run export:water-v2:gif
npm run export:water-v2:png
```

For full production rules, read `.agents/skills/loop-animation/SKILL.md`.
