---
name: loop-animation
description: Create polished interactive educational explainers with Three.js, deterministic continuous motion, hybrid raster/shader/3D visual layers, guided narration, and HTML/MP4/GIF/PNG/SRT/VTT export. Use for science, technology, math, history, mechanisms, processes, scale comparisons, spatial explanations, simulations, or any concept that benefits from motion.
---

# Loop Animation

Create explanations that teach through **continuous visual storytelling**.

> Don't animate text. Animate ideas — and keep the visual world continuous while the explanation advances.

## Core model

```text
WORLD STATE             STORY MANIFEST          VIEW / OUTPUT
S(t)                    chapters               HTML controls
camera(t)               narration              captions
objects(t)              key ideas              language switch
materials(t)            timestamps             MP4 / GIF / PNG
particles(t)                                    SRT / VTT / narration
```

The world is a deterministic function of absolute time. Chapters are narration/navigation bookmarks. UI is replaceable. Story metadata is reusable by subtitles and future TTS.

Never let a chapter number become the source of truth for the visual world.

## Invocation contract

Users should not need to learn this architecture before using the Skill.

A valid request can be as short as:

```text
$loop-animation

Explain why airplanes can fly.
```

When the user omits non-critical production details, **choose sensible defaults and continue**. Do not turn a simple animation request into a long questionnaire.

Default assumptions unless the request says otherwise:

```text
Audience: general audience
Language: user's language
Duration: 30 seconds
Aspect ratio: 16:9
Chapters: 5–7
Primary output: interactive HTML
Secondary output: MP4 when FFmpeg is available
Captions: SRT/VTT when narration exists
Interaction: play/pause + draggable timeline + chapter navigation + deeper explanation
Art direction: topic-appropriate, stage-first, restrained UI
Continuity QA: strict
```

Ask a clarifying question only when ambiguity would materially change factual correctness, required source material, safety, or the core visual mechanism.

### Recommended full request

Users who want more control can provide:

```text
$loop-animation

Explain: <topic>
Audience: <general / student / developer / expert>
Language: <language>
Duration: <seconds>
Aspect ratio: <16:9 / 9:16 / 1:1>
Outputs: <HTML / MP4 / GIF / PNG / SRT/VTT>

Optional:
- visual style or references
- must-show mechanism
- interaction requirements
- constraints
```

Do not require implementation details such as shader names, camera curves, particle APIs, or Story Manifest fields from the user. Those are responsibilities of this Skill.

### Execution behavior

When operating inside this repository:

1. Inspect the relevant runtime and nearest example before editing.
2. Briefly state the intended learning goal, visual grammar, and continuous-world plan.
3. Implement instead of repeatedly asking for approval on routine details.
4. Run typecheck/build and the relevant strict QA.
5. If QA fails, fix the implementation and rerun it.
6. Finish with a concise handoff containing the preview route, changed files, export commands, and QA status.

Never claim that a generated raster/image asset was added if the generation or upload step actually failed.

## Required workflow

### 1. Define one learning goal

Write:

> After watching this, the learner should understand ____.

Verify uncertain factual claims before encoding them visually. If scale, angle, distance or timing is exaggerated for teaching, say so.

### 2. Choose visual grammar and art direction before coding

Pick the smallest visual system that can explain the idea well.

Visual grammars:

- `flow` — matter, packets, energy, signals
- `scale` — size and orders of magnitude
- `inside` — anatomy, layers, architecture
- `compare` — mechanisms or outcomes
- `cause-effect` — causal chains and feedback loops
- `timeline` — change through time
- `orbit/spatial` — geometry and spatial relationships
- `simulation` — adjustable parameters

Then choose a rendering mix:

```text
Three.js / shader / geometry
Raster / img2 / texture assets
HTML / CSS labels and controls
```

Use each layer for what it does best.

**Prefer Three.js / shaders for:**

- motion
- depth
- camera
- geometry
- particles
- paths
- spatial relationships
- interaction

**Prefer raster / img2 assets for:**

- painterly environments
- anatomy
- detailed surfaces
- complex natural scenes
- realistic or editorial illustration
- anything that looks obviously weak when rebuilt from primitive SVG shapes

Pure SVG / primitive geometry is still appropriate for diagrams, algorithms and mechanisms. It is not the default art direction for a showcase scene when richer visual treatment improves understanding.

If external/generated art is unavailable, improve the procedural/shader treatment and keep the asset boundary clean. Do not silently replace a promised high-fidelity asset with an unrelated placeholder.

### 3. Break the topic into 5–8 chapters

Each chapter defines:

- `id`
- start / end time
- short label
- one concise, speech-friendly `summary`
- optional deeper `details`
- one `key` takeaway
- the visual mechanism being emphasized

`summary` should work simultaneously as:

- on-screen explanation
- subtitle cue
- future TTS narration seed

Chapters organize explanation. **They do not own separate visual states.**

### 4. Storyboard one continuous world

Describe what exists for the full animation and how it changes over time.

Prefer object continuity:

- the same water droplet moves through the water cycle
- the same packet travels through network infrastructure
- the same Moon continues along one orbit
- the same red blood cell passes through heart, lungs and body
- the same quantity transforms instead of disappearing and being recreated

The learner should feel that one world is evolving.

### 5. Enforce the continuity contract

For chapter boundary `b`:

```text
S(b - ε) ≈ S(b + ε)
```

Check at least:

- position
- rotation
- scale
- opacity
- camera position
- camera target
- material properties

Avoid:

```ts
if (step === 0) camera.position.set(...);
object.visible = step === 2;
```

Prefer:

```ts
const rain = envelope(time, 10.7, 12.5, 19.2, 21.0);
material.opacity = rain;

cameraCurve.getPointAt(time / duration, camera.position);
```

### 6. Make `renderAt(seconds)` the source of truth

Every explainer exposes:

```ts
window.__LOOP_ANIMATION__
```

Prefer `DeterministicTimeline` from `src/runtime/animation.ts`.

The same timestamp must reproduce the same world state regardless of:

- playback frame rate
- previous seeks
- export FPS
- machine speed

Never accumulate export-critical state from the previous render.

Bad:

```ts
cloud.position.y += drift;
```

Good:

```ts
cloud.position.y = baseY + wave(time);
```

Seed procedural randomness.

### 7. Publish one localized Story Manifest

Flagship `StagePlayer` explainers publish:

```ts
window.__LOOP_STORY__
```

It is the canonical source for:

- HTML chapter copy
- SRT subtitles
- WebVTT captions
- narration JSON
- future TTS/audio composition

Do not maintain a second unrelated subtitle timeline if the Story Manifest already expresses the same narration.

### 8. Keep runtime, world and UI separate

The timeline owns time. The renderer owns the visual world. The UI subscribes to snapshots.

Do not rewrite large parts of the DOM inside every `renderScene()` frame.

For a stage-first starting point use:

```text
src/runtime/stage-player.ts
src/runtime/stage-player.css
```

Treat it as a view layer, not a mandatory template.

### 9. Default to stage-first interaction

Prefer:

- large uninterrupted visual stage
- one concise lower-third explanation
- directly scrubbable Storyline
- deeper explanation on demand
- lightweight anchored labels
- language switching instead of mixed bilingual screens
- an unobtrusive first-run usage hint
- fullscreen for detailed scenes when supported

Avoid permanent dashboard sidebars unless the topic genuinely benefits from them.

Target roughly:

```text
70% visual explanation
30% text / controls
```

Controls and captions must not cover the main subject. On small screens, simplify labels before shrinking everything into unreadable UI.

### 10. Synchronize narration and motion

Every narration change should correspond to a visible mechanism or a new interpretation of the same visible state.

Good:

> “Droplets grow until gravity wins.”

At that moment the cloud state changes and rain begins smoothly.

Weak:

> narration changes while the scene continues doing decorative movement.

### 11. Performance contract

Required practices:

- resize WebGL only when container size changes
- use `observeRendererViewport()`
- cap interactive DPR unless max resolution is requested
- prefer `THREE.Points` / `InstancedMesh` over many repeated Meshes
- reuse temporary vectors in hot loops
- keep real-time shadows only when they teach something
- avoid large permanent `backdrop-filter` layers
- update chapter text only when chapter changes
- derive all export-critical state from absolute time
- do not eagerly run several heavy WebGL previews on a landing page; lazy-load non-primary demos near the viewport

### 12. Bilingual behavior

When multiple languages are requested:

- default from browser language
- provide a language switch
- remember the choice
- keep each screen in one language
- publish the matching localized Story Manifest

Never place Chinese and English versions of the same explanation on screen at the same time.

### 13. Run visual + boundary QA

Inside this repository:

```bash
npm run typecheck
npm run build
npm run qa:continuity
```

Flagship Water v2:

```bash
npm run qa:water-v2
npm run qa:water-v2:strict
```

QA samples chapter boundaries at:

```text
t - 1 frame
t
t + 1 frame
```

Review:

```text
contact-sheet.png
boundary-continuity.png
report.json
```

Also inspect:

- clipping / overlap
- weak focal hierarchy
- text covering the subject
- dead frames
- misleading geometry
- poor mobile/landscape framing
- narration changing before the mechanism becomes visible
- first-run controls being understandable without a README

### 14. Export from one source

Visual outputs:

```bash
npm run export:water-v2:mp4
npm run export:water-v2:gif
npm run export:water-v2:png
```

Story outputs:

```bash
npm run story:water-v2:zh
npm run story:water-v2:en
npm run story:eclipse:zh
npm run story:eclipse:en
```

The interactive HTML, video, GIF, poster, subtitles and narration must derive from the same deterministic timeline and Story Manifest.

## Visual quality rules

Prefer:

- persistent objects that transform
- meaningful motion
- progressive disclosure
- strong focal hierarchy
- generous negative space
- restrained camera motion
- short anchored labels
- coherent light / material treatment
- raster or generated assets when primitive drawing would make the scene look like a demo

Avoid:

- generic glowing cards
- dashboard chrome around every animation
- random particles
- constant zooming
- paragraphs covering the visual subject
- hard visibility switches at chapter boundaries
- recreating the same object every chapter
- frame-rate-dependent simulation
- using SVG for a rich natural scene only because it is easy to generate

## Working in this repository

For a new showcase-quality explainer:

1. Read `src/examples/water-v2/main.ts` first.
2. Define the Story Manifest chapters.
3. Choose visual grammar and art pipeline.
4. Design one continuous world S(t).
5. Reuse `DeterministicTimeline` and `observeRendererViewport()`.
6. Use shader / 3D / raster / img2 assets intentionally.
7. Use absolute-time curves and envelopes.
8. Keep narration concise and speech-friendly.
9. Run typecheck, build, strict continuity QA and story export smoke checks.
10. Export all requested formats from the same source.

## Completion criteria

A task is complete only when:

- the concept is coherent
- visual quality fits the subject
- the world remains continuous across chapter boundaries
- deterministic seeking works
- playback is smooth
- first-run interaction is discoverable without reading source code
- explanatory UI does not dominate the visual
- bilingual switching is clean
- Story Manifest matches timing and active language
- boundary QA has no unexplained jumps
- requested visual/story exports succeed
- the result still teaches when paused at meaningful timestamps
- the final handoff tells the user exactly how to preview, edit and export the result
