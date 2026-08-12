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

## Quality bar

Avoid slide-like layouts, decorative particles, excessive glow, large text blocks, and purposeless camera motion.

Before considering a change complete:

1. run typecheck
2. build
3. render a PNG
4. inspect at least start/middle/end timestamps
5. verify backward seeking
