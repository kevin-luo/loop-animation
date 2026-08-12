# Loop Animation repository instructions

## Product goal

Loop Animation is a Codex skill plus runtime for generating interactive educational Three.js animations that can be deterministically exported to HTML, MP4, GIF, and PNG.

## Non-negotiable architecture

- `renderAt(time)` is the source of truth for visual state.
- Exported frames must not depend on frame rate or prior frame history.
- HTML remains the primary/source artifact.
- Video/GIF/PNG are derived renders.
- Prefer DOM/CSS for labels and controls; prefer Three.js for spatial content.
- Keep example-specific code out of the shared runtime unless the abstraction is reusable.
- For normal guided explainers, use `src/runtime/lesson-shell.ts` instead of inventing a new floating-card layout.

## Guided lesson UI

A normal explainer should separate information into four zones:

1. **left rail** — clickable teaching steps;
2. **center stage** — the visual explanation itself;
3. **right rail** — narration, what-to-watch and key takeaway;
4. **bottom transport** — play/pause, reset and deterministic scrubber.

Do not place a large narration card on top of the main scene. The center stage should keep enough uninterrupted space for the concept to remain readable.

Each step must produce a visible state change. A new sentence with an almost-identical frame is not a valid teaching step.

When bilingual output is requested, switch the complete interface language. Do not mix Chinese and English copy on the same screen.

## Quality bar

Avoid slide-like layouts, decorative particles, excessive glow, large text blocks, and purposeless camera motion.

Before considering a change complete:

1. run typecheck
2. build
3. render a PNG
4. inspect at least start/middle/end timestamps
5. verify backward seeking
6. check that explanation panels never cover the primary animation focal point
