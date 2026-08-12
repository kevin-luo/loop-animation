# Contributing to Loop Animation

Thanks for helping make code-generated explainers clearer, smoother, and more useful.

## Current design principle

A flagship Loop Animation explainer should be **one continuous visual world**.

Chapters describe the story and provide navigation. They should not reset the camera, recreate the scene, or hard-switch visibility at chapter boundaries.

Think in terms of:

```text
continuous world S(t)
+
story metadata
+
replaceable view layer
```

## Good contributions

- reusable continuous visual grammars
- polished example explainers
- deterministic rendering fixes
- boundary/visual QA improvements
- export and runtime performance improvements
- motion primitives based on absolute time
- responsive interaction fixes
- accessibility improvements
- factual or pedagogical corrections

## Before opening a PR

Run:

```bash
npm install
npm run typecheck
npm run build
```

If the change affects a flagship animation or shared motion runtime, also run:

```bash
npm run qa:continuity
```

Review both:

```text
contact-sheet.png
boundary-continuity.png
```

A green automated continuity check is necessary, but it is not a substitute for visual review.

## Continuity contract

At every chapter boundary `b`, important visual state should remain approximately continuous:

```text
S(b - ε) ≈ S(b + ε)
```

Avoid patterns such as:

```ts
if (step === 2) camera.position.set(...);
mesh.visible = step === 3;
```

Prefer absolute-time curves and smooth envelopes:

```ts
const emphasis = envelope(time, 8, 10, 16, 18);
cameraCurve.getPointAt(time / duration, camera.position);
```

Also scrub backward and forward manually. The visual result at a timestamp must not depend on the path used to reach it.

## Adding a new example

1. Define one learning goal.
2. Write 5–8 useful chapters as story metadata.
3. Design the persistent visual world before coding chapter-specific emphasis.
4. Decide what objects should survive across multiple chapters.
5. Build camera/object/material state from absolute time.
6. Use `observeRendererViewport()` instead of resizing WebGL every frame.
7. Prefer `THREE.Points` or `InstancedMesh` for repeated particles/objects.
8. Keep the visual stage dominant; use concise narration and optional deeper details.
9. Test landscape and mobile layouts when practical.
10. Run visual + boundary QA.
11. Include a representative screenshot or generated GIF in the PR description.

## UI contributions

`StagePlayer` is the current stage-first starting point, but it is intentionally a **view layer, not a mandatory template**.

Do not make every example look identical just to reuse UI code. Share playback, chapter, language, seek, accessibility, and export behavior; let each topic choose the composition that teaches it best.

The older `LessonShell` remains for compatibility with early experiments and should not be treated as the visual direction for new flagship demos.
