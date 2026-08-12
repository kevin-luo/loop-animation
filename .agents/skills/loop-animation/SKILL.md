---
name: loop-animation
description: Create polished interactive educational explainers with Three.js, continuous deterministic motion, guided narration, and HTML/MP4/GIF/PNG export. Use for science, technology, math, history, mechanisms, processes, scale comparisons, spatial explanations, simulations, or any concept that benefits from motion.
---

# Loop Animation

Create explanations that teach through **continuous visual storytelling**.

> Don't animate text. Animate ideas — and make the visual world remain continuous while the explanation advances.

## Mental model

Loop Animation has three separate layers:

```text
WORLD STATE             STORY METADATA          VIEW
S(t)                    chapters               HTML controls
camera(t)               narration              captions
objects(t)              key ideas              language switch
materials(t)            timestamps             details drawer
particles(t)
```

The **world state is a continuous function of absolute time**. Chapters are narration/navigation markers. The UI is a replaceable view layer.

Never let a chapter number become the source of truth for the visual world.

## Required workflow

### 1. Define one learning goal

Write:

> After watching this, the learner should understand ____.

Verify uncertain scientific or factual claims before encoding them visually. If scale or geometry is exaggerated for teaching, say so.

### 2. Break the topic into 5–8 chapters

Each chapter should answer one question and define:

- `id`
- start/end time
- short label
- one concise on-screen explanation
- optional deeper explanation
- one key takeaway
- the visual mechanism being emphasized

Chapters organize the explanation. **They do not own separate visual states.**

### 3. Storyboard one continuous world

Before coding, describe what exists for the full animation and how it evolves over time.

Prefer object continuity:

- the same water droplet travels through multiple parts of the water cycle
- the same packet moves through DNS infrastructure
- the same Moon continues along one orbit
- the same quantity transforms instead of disappearing and being recreated

The learner should feel that one world is evolving, not that five slides are being swapped.

### 4. Enforce the continuity contract

For every chapter boundary `b`, important visual state should satisfy approximately:

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
- major material properties

Camera motion should be smooth in velocity as well as position when possible.

#### Forbidden pattern

```ts
if (step === 0) camera.position.set(...);
else if (step === 1) camera.position.set(...);
```

or:

```ts
object.visible = step === 2;
```

Those patterns commonly create jumps at chapter boundaries.

#### Preferred pattern

Use absolute-time curves and overlapping envelopes:

```ts
const rain = envelope(time, 8.5, 10.5, 16.5, 18.5);
material.opacity = rain;

cameraCurve.getPointAt(time / duration, camera.position);
```

Use the helpers in `src/runtime/animation.ts` such as `reveal()` and `envelope()`.

### 5. Use `renderAt(seconds)` as the source of truth

Every explainer must expose:

```ts
window.__LOOP_ANIMATION__
```

Prefer `DeterministicTimeline` from `src/runtime/animation.ts`.

The same timestamp must produce the same frame regardless of:

- playback frame rate
- previous seeks
- export FPS
- how quickly the machine is running

Do not drive export-critical state from accumulated `deltaTime`, wall-clock time, or uncontrolled randomness. Seed procedural randomness.

### 6. Keep the runtime headless

The timeline controls time and emits snapshots. The renderer controls the visual world. The UI subscribes to time/chapter changes.

Do not make `renderScene()` rewrite large parts of the DOM every frame.

For new showcase-quality explainers, prefer the stage-first UI in:

```text
src/runtime/stage-player.ts
src/runtime/stage-player.css
```

But treat it as a view, not a required visual template. A topic may use a different UI if that teaches better.

### 7. Default to stage-first interaction

The visual explanation should dominate the screen.

Prefer:

- large uninterrupted visual stage
- one concise lower-third explanation
- chapter/storyline navigation integrated into the edge of the frame
- optional deeper explanation on demand
- lightweight anchored labels near the object they explain

Avoid turning every explainer into a dashboard with permanent left/right panels.

The default balance should be roughly:

```text
70% visual explanation
30% text / controls
```

If the animation already explains a fact visually, do not repeat it with a paragraph.

### 8. Synchronize narration and motion

Every narration change must correspond to a visible change or a new interpretation of the same visible state.

Good:

> “Droplets become heavy enough that gravity wins.”

At that moment cloud particles grow/darken and rain begins smoothly.

Weak:

> narration changes while the scene continues doing almost the same decorative movement.

### 9. Performance contract

Interactive playback should remain smooth on ordinary laptops and phones.

Required practices:

- resize WebGL only when the container size actually changes
- use `ResizeObserver` / `observeRendererViewport()` instead of `renderer.setSize()` every frame
- cap device pixel ratio unless the user explicitly needs maximum resolution
- prefer `THREE.Points` or `InstancedMesh` over dozens/hundreds of individual Mesh particles
- reuse vectors and temporary objects in hot render loops
- keep real-time shadows only when they teach something
- avoid large full-screen `backdrop-filter` layers
- update chapter text only when the chapter changes
- update tiny time/progress UI cheaply rather than rebuilding DOM each frame

### 10. Bilingual behavior

When multiple languages are requested:

- default from browser language
- provide a language switch
- remember the user's choice
- keep a whole screen in one language

Never mix Chinese and English versions of the same explanation on screen at once.

### 11. Run visual + boundary QA

Inside this repository:

```bash
npm run typecheck
npm run build
npm run qa:water
```

QA produces normal checkpoint frames plus **boundary continuity samples** at:

```text
t - 1 frame
t
t + 1 frame
```

Review `boundary-continuity.png` and `report.json`.

A large asymmetric pixel change around a boundary is a warning that a chapter may be causing a visual jump.

Inspect additionally for:

- clipping / overlap
- dead frames
- tiny labels
- weak focal hierarchy
- captions covering the subject
- narration changing before motion
- misleading geometry
- poor vertical and landscape framing

### 12. Export from the same source

```bash
npm run export:mp4
npm run export:gif
npm run export:png
```

The interactive HTML is the source artifact. Video, GIF, poster, subtitles and narration should derive from the same deterministic timeline.

## Visual grammar

Choose only what helps:

- `flow` — matter, packets, energy, signals
- `scale` — size and orders of magnitude
- `inside` — anatomy, layers, architecture
- `compare` — mechanisms or outcomes
- `cause-effect` — causal chains and feedback loops
- `timeline` — change through time
- `orbit/spatial` — geometry and spatial relationships
- `simulation` — adjustable parameters

## Visual quality rules

Prefer:

- persistent objects that transform
- meaningful motion
- progressive disclosure
- strong focal hierarchy
- generous negative space
- restrained cameras
- short anchored labels
- visual metaphors that remain physically coherent

Avoid:

- generic glowing cards
- dashboard chrome around every animation
- random particles
- constant zooming
- paragraphs covering the visual subject
- hard visibility switches at chapter boundaries
- recreating the same object in every chapter
- camera keyframes that do not meet continuously
- frame-rate-dependent simulation

## Working in this repository

For a new explainer:

1. Read `src/examples/water/main.ts` first for the current continuous-timeline pattern.
2. Define 5–8 chapters as story metadata.
3. Design one continuous world state across the whole duration.
4. Reuse `DeterministicTimeline`.
5. Use `observeRendererViewport()` for resizing.
6. Prefer `StagePlayer` for a stage-first starting point, but customize presentation when the topic needs it.
7. Use absolute-time curves/envelopes instead of chapter-conditioned visual states.
8. Run typecheck, build, normal QA and boundary QA.
9. Export requested formats from the same timeline.

## Completion criteria

A task is complete only when:

- the concept is coherent
- the visual world remains continuous across chapter boundaries
- deterministic seeking works
- chapter navigation works without changing the underlying world model
- playback is smooth
- explanatory UI does not dominate the visual
- bilingual output switches cleanly
- boundary QA has no unexplained jumps
- requested exports succeed
- the result still teaches when paused at meaningful timestamps
