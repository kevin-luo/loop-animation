# Loop Animation

**Turn concepts into interactive explainers with Codex + Three.js.**

Loop Animation is an open-source Codex skill and deterministic rendering runtime for creating educational animations that can be used as **interactive HTML**, then exported from the same source as **MP4**, **GIF**, or **PNG**.

> Don't animate text. Animate ideas.

## Why

Most AI-generated explainers end up as animated slides: title cards, floating text, decorative particles, and generic transitions.

Loop Animation pushes Codex toward a different workflow:

```text
concept
  ↓
learning goal
  ↓
visual grammar
  ↓
storyboard
  ↓
Three.js scene
  ↓
deterministic timeline
  ↓
interactive HTML
  ├── MP4
  ├── GIF
  └── PNG
```

The HTML experience is the source artifact. Video is just another render target.

## Demo: Why does a solar eclipse happen?

The first example in this repository explains a solar eclipse with a Three.js scene containing the Sun, Moon, Earth, orbit geometry, shadow visualization, labels, playback controls, and a seekable deterministic timeline.

```bash
npm install
npm run dev
```

Then open the local Vite URL.

## Export the same animation

### Interactive HTML

```bash
npm run build
```

The deployable site is written to `dist/`.

### MP4

```bash
npm run export:mp4
```

### GIF

```bash
npm run export:gif
```

### Poster PNG

```bash
npm run export:png
```

The renderer opens the built page in headless Chrome, seeks the animation to an exact timestamp for every frame, captures PNG frames, and sends them to FFmpeg.

Default video export is `1080x1920 @ 30fps`. You can call the exporter directly for other formats:

```bash
node scripts/export.mjs --format mp4 --width 1920 --height 1080 --fps 60
```

## Use as a Codex skill

The repository contains a top-level [`SKILL.md`](./SKILL.md). Give Codex access to the skill and ask for an explainer, for example:

```text
Use Loop Animation to explain why seasons happen.

Requirements:
- Chinese
- 45 seconds
- vertical 9:16
- interactive HTML
- export MP4 and GIF
- avoid slide-like layouts
```

Or:

```text
Use Loop Animation to visualize how DNS resolves a domain name.
Make packets move through the system and let the user scrub the timeline.
```

## What the skill teaches Codex

Loop Animation is deliberately opinionated about the production process:

1. Verify the concept.
2. Define one learning goal.
3. Choose a visual grammar.
4. Storyboard before coding.
5. Build the explanation as a spatial scene.
6. Drive all animation from absolute time.
7. Make the HTML version interactive.
8. Render representative frames.
9. Run visual QA.
10. Export the requested formats.

Supported visual grammars include:

- **Scale** — relative size, distance, orders of magnitude
- **Inside** — layers, anatomy, architecture
- **Flow** — packets, energy, matter, money, signals
- **Compare** — side-by-side mechanisms
- **Cause → effect** — causal chains
- **Timeline** — change over time
- **Orbit / spatial** — geometry and spatial relationships
- **Simulation** — adjustable parameters

## Deterministic rendering

Every animation exposes a small browser API:

```ts
interface LoopAnimationController {
  duration: number;
  ready: boolean;
  renderAt(time: number): void;
  play(): void;
  pause(): void;
  seek(time: number): void;
  destroy(): void;
}
```

The critical method is:

```ts
renderAt(time)
```

A frame at `8.0s` should look the same whether the user:

- watches the animation normally,
- drags the scrubber,
- jumps backward,
- exports at 30 FPS,
- exports at 60 FPS.

That makes HTML, screenshots, GIFs, and video different views of the same animation rather than separate implementations.

## Project structure

```text
loop-animation/
├── SKILL.md
├── README.md
├── src/
│   ├── runtime/
│   │   ├── animation.ts
│   │   └── global.d.ts
│   └── examples/
│       └── eclipse/
│           ├── main.ts
│           └── style.css
├── scripts/
│   └── export.mjs
├── references/
│   ├── architecture.md
│   ├── qa.md
│   └── visual-style.md
└── examples/
    └── eclipse/
        └── storyboard.md
```

## Design rules

Loop Animation tries to avoid the common "AI demo" look.

**Prefer**

- one visual idea per scene
- meaningful transformations
- stable cameras
- spatial explanations
- object continuity
- short anchored labels
- responsive composition

**Avoid**

- glowing cards everywhere
- random particles
- constant zooming
- long text blocks
- decorative motion
- objects popping in and out without meaning
- tiny labels inside the 3D world

## Requirements

- Node.js 22+
- FFmpeg available in `PATH`
- A browser environment supported by Puppeteer

## Roadmap

- [x] Codex `SKILL.md`
- [x] deterministic timeline runtime
- [x] interactive HTML playback
- [x] MP4/GIF/PNG exporter
- [x] first Three.js eclipse explainer
- [ ] automatic contact-sheet visual QA
- [ ] reusable scale / network / timeline templates
- [ ] subtitle track support
- [ ] audio/TTS composition
- [ ] multi-example gallery
- [ ] GitHub Pages demo

## Contributing

The most useful contributions are new reusable visual patterns, better rendering/QA infrastructure, and polished example explainers. See [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## License

MIT
