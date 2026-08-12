# Loop Animation

<p align="center">
  <strong>Turn a concept into a continuous interactive visual explainer with Codex + Three.js.</strong><br/>
  用 Codex + Three.js，把一个知识点变成连续、可交互、可导出的动画解释。
</p>

<p align="center">
  <a href="https://kevin-luo.github.io/loop-animation/"><strong>Live Gallery</strong></a> ·
  <a href="https://kevin-luo.github.io/loop-animation/#prompt-builder"><strong>Prompt Builder</strong></a> ·
  <a href="docs/USAGE.md"><strong>Usage Guide / 使用说明</strong></a>
</p>

<p align="center">
  <img alt="CI" src="https://github.com/kevin-luo/loop-animation/actions/workflows/ci.yml/badge.svg" />
  <img alt="Continuity QA" src="https://github.com/kevin-luo/loop-animation/actions/workflows/continuity-qa.yml/badge.svg" />
  <img alt="MIT License" src="https://img.shields.io/badge/license-MIT-blue.svg" />
  <img alt="Three.js" src="https://img.shields.io/badge/Three.js-0.185-black" />
  <img alt="Codex Skill" src="https://img.shields.io/badge/Codex-Skill-111827" />
  <img alt="Version" src="https://img.shields.io/badge/version-0.6.0-6b7280" />
</p>

> **The chapter changes. The world does not reset.**  
> **章节会切换，世界不会重置。**

<p align="center">
  <a href="https://kevin-luo.github.io/loop-animation/?demo=water-v2">
    <img src="docs/media/water-v2.gif" alt="Loop Animation Water v2 flagship demo" width="860" />
  </a>
</p>

<p align="center">
  <sub>Rendered automatically from the real deterministic Three.js scene by Puppeteer + FFmpeg.</sub><br/>
  <sub>上面的 GIF 由真实确定性 Three.js 场景通过 Puppeteer + FFmpeg 自动生成。</sub>
</p>

## Start in 60 seconds / 60 秒开始

```bash
git clone https://github.com/kevin-luo/loop-animation.git
cd loop-animation
npm install
```

Open this repository in Codex. The repo already contains the Skill:

```text
.agents/skills/loop-animation/SKILL.md
```

Then the minimum useful request is simply:

```text
$loop-animation

解释为什么飞机能飞起来。
```

or:

```text
$loop-animation

Explain why airplanes can fly.
```

You do **not** need to specify shaders, camera curves, Story Manifest fields, or Three.js APIs. When non-critical details are missing, the Skill uses sensible defaults and continues.

想控制受众、时长、比例、输出格式，可以直接使用在线 **Prompt Builder**：

**https://kevin-luo.github.io/loop-animation/#prompt-builder**

完整操作说明、提示词模板和常见问题：[`docs/USAGE.md`](docs/USAGE.md)

## What it does / 它会做什么

Given a topic, the Skill is designed to:

1. define the learning goal and structure 5–7 chapters;
2. choose an appropriate visual grammar and art direction;
3. build one continuous deterministic world `S(t)` instead of swapping animated slides;
4. provide play/pause, draggable timeline, chapter navigation, deeper explanation, language switching and fullscreen;
5. run strict chapter-boundary continuity QA;
6. export HTML / MP4 / GIF / PNG / SRT / VTT / narration data from the same source.

用户只需要说清楚“想解释什么”。实现细节、连续性规则、视觉 QA 和导出流程由 Skill 负责。

## Live examples / 在线实例

| Example | Status | Visual grammar | Live |
|---|---|---|---|
| **Water Cycle v2 / 水循环 v2** | **Flagship · continuity gated** | Hybrid · Earth system · Flow | [Open](https://kevin-luo.github.io/loop-animation/?demo=water-v2) |
| Solar Eclipse / 日食 | **Flagship · continuity gated** | Orbit · Spatial | [Open](https://kevin-luo.github.io/loop-animation/?demo=eclipse) |
| DNS resolution / DNS 解析 | Earlier experiment | Network · Flow | [Open](https://kevin-luo.github.io/loop-animation/?demo=dns) |
| Binary search / 二分查找 | Earlier experiment | Algorithm · Process | [Open](https://kevin-luo.github.io/loop-animation/?demo=binary) |

The Gallery lazy-loads non-primary WebGL previews so the landing page does not run every scene at once.

## One continuous source / 一份连续源作品

```text
                         ONE SOURCE OF TRUTH

                 ┌───────────────────────────┐
                 │ Continuous world S(t)     │
                 │ camera / objects / motion │
                 └─────────────┬─────────────┘
                               │
                 ┌─────────────▼─────────────┐
                 │ Story Manifest            │
                 │ chapters / narration      │
                 │ timing / key ideas        │
                 └─────────────┬─────────────┘
                               │
       ┌────────────┬──────────┼──────────┬───────────┐
       ▼            ▼          ▼          ▼           ▼
  Interactive     MP4/GIF     PNG       SRT/VTT    narration
     HTML          video     poster     captions       JSON
```

The core rule is simple:

```text
same timestamp = same conceptual frame
```

Avoid chapter-owned scene state:

```ts
// avoid
if (step === 1) camera.position.set(...);
object.visible = step === 2;
```

Prefer absolute-time state:

```ts
const rain = envelope(time, 10.7, 12.5, 19.2, 21.0);
rainMaterial.opacity = rain;

cameraCurve.getPointAt(time / DURATION, camera.position);
```

For chapter boundary `b`:

```text
S(b - ε) ≈ S(b + ε)
```

That continuity target is checked automatically in CI.

## v0.6 visual direction: Hybrid Visual Pipeline

The current flagship no longer assumes code should draw every pixel.

```text
Raster / generated art / textures
             +
Three.js world + shaders + motion
             +
Story Manifest
             +
lightweight interaction UI
```

Use each layer for what it does best:

- **Three.js / shaders** — motion, depth, camera, geometry, particles, paths, interaction;
- **raster / img2 assets** — detailed natural scenes, anatomy, surfaces and editorial illustration;
- **HTML/CSS** — short captions, controls and accessibility;
- **Story Manifest** — narration, subtitles and future TTS.

Pure SVG / primitive geometry is still useful for algorithms and mechanism diagrams. Rich natural scenes should not look like an SVG demo merely because SVG is easy to generate.

### Water v2 currently uses

- shader-rendered sky;
- moving shader ocean;
- sculpted 3D terrain with vegetation / rock / snow altitude coloring;
- volumetric-style cloud sprites;
- `THREE.Points` vapor and rain fields;
- river and groundwater paths;
- one highlighted hero drop across the full explanation;
- continuous Catmull-Rom camera motion;
- deterministic absolute-time rendering;
- strict chapter-boundary QA.

## Recommended Codex request / 推荐提示词

The short prompt is enough for normal use. For tighter control:

```text
$loop-animation

请制作一个关于「为什么飞机能飞起来？」的交互式科普动画。

受众：普通用户
语言：中文
时长：30 秒
比例：16:9
输出：HTML + MP4 + SRT/VTT

执行要求：
- 先定义学习目标，再拆成 5–7 个章节；
- 先决定最适合的视觉语法和美术方案；
- 全程使用一个连续世界 S(t)，章节只负责讲解和导航；
- 禁止按 step 硬切相机、物体或整套场景；
- 复杂自然场景允许 shader + 3D + raster/img2 混合；
- 画面占主导，说明和控件不要挡住主体；
- 完成后执行 typecheck、build 和 strict continuity QA；
- 最后告诉我预览入口、生成文件位置和导出命令。

如果缺少非关键参数，请直接采用合理默认值继续，不要反复提问。
```

The Gallery has an interactive builder that generates this format automatically.

## Player interaction / 播放器怎么用

Flagship `StagePlayer` provides:

- play / pause;
- directly draggable timeline;
- chapter jump buttons;
- previous / next chapter;
- deeper explanation drawer;
- language switching;
- fullscreen;
- keyboard timeline seeking;
- a first-run usage hint that disappears after interaction.

The UI is intentionally stage-first: the visual explanation remains the main subject.

## Development / 开发

Requirements:

- Node.js 22+
- npm
- FFmpeg for MP4/GIF export
- Chromium/Puppeteer-compatible environment for export and QA

```bash
npm run dev
```

Routes:

```text
?demo=water-v2
?demo=eclipse
?demo=water
?demo=dns
?demo=binary
```

## Quality checks / 质量检查

```bash
npm run typecheck
npm run build
npm run qa:continuity
```

Water v2 only:

```bash
npm run qa:water-v2:strict
```

At every chapter boundary, QA captures:

```text
t - 1 frame
t
t + 1 frame
```

Outputs:

```text
.output/qa/<demo>/
├── contact-sheet.png
├── boundary-continuity.png
├── report.json
├── frames/
└── boundaries/
```

The pixel-diff gate detects suspicious jumps. Visual review should also check hierarchy, clipping, mobile framing, text obstruction and narration/motion synchronization.

## Export / 导出

Water v2:

```bash
npm run export:water-v2:mp4
npm run export:water-v2:gif
npm run export:water-v2:png
```

Story / captions:

```bash
npm run story:water-v2:zh
npm run story:water-v2:en
npm run story:eclipse:zh
npm run story:eclipse:en
```

All current flagship story outputs:

```bash
npm run story:all
```

Custom video export:

```bash
node scripts/export.mjs \
  --format mp4 \
  --demo water-v2 \
  --width 1920 \
  --height 1080 \
  --fps 30
```

Outputs are written under `.output/` by default.

## Install the Skill globally / 全局安装 Skill

Repo-scoped usage requires no global install. If you want the Skill available outside this repository:

```bash
npm run skill:install
```

Installed to:

```text
$HOME/.agents/skills/loop-animation
```

Overwrite an older installation:

```bash
npm run skill:install:force
```

## Project structure

```text
loop-animation/
├── .agents/skills/loop-animation/
│   ├── SKILL.md
│   └── agents/openai.yaml
├── .github/workflows/
│   ├── ci.yml
│   ├── continuity-qa.yml
│   ├── pages.yml
│   └── preview-media.yml
├── docs/
│   ├── USAGE.md
│   └── media/
│       ├── water-v2.gif
│       └── eclipse.gif
├── scripts/
│   ├── export.mjs
│   ├── export-story.mjs
│   ├── qa.mjs
│   └── install-skill.mjs
├── src/
│   ├── gallery/
│   ├── runtime/
│   │   ├── animation.ts
│   │   ├── canvas-viewport.ts
│   │   ├── stage-player.ts
│   │   ├── stage-player.css
│   │   ├── stage-player-enhancements.css
│   │   └── story.ts
│   └── examples/
│       ├── water-v2/      # current visual flagship
│       ├── eclipse/       # spatial flagship
│       ├── water/         # v0.5 reference
│       ├── dns/           # early experiment
│       └── binary/        # early experiment
└── package.json
```

## Contributing / 贡献

Before a PR that changes a flagship scene or shared runtime:

```bash
npm run typecheck
npm run build
npm run qa:continuity
npm run story:all
```

Useful contribution directions:

- new continuous visual grammars;
- raster/img2 layered scenes;
- shader / 3D visual treatments;
- better visual and continuity QA;
- deterministic motion primitives;
- export/runtime performance;
- captions / TTS / audio pipelines;
- accessibility and interaction.

## License

MIT
