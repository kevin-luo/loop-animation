# Loop Animation

<p align="center">
  <strong>Turn concepts into continuous interactive visual stories with Codex + Three.js.</strong><br/>
  用 Codex + Three.js，把知识点变成连续、可解释、可交互、可导出的视觉故事。
</p>

<p align="center">
  <a href="https://kevin-luo.github.io/loop-animation/"><strong>Live Gallery</strong></a> ·
  <a href="#english">English</a> ·
  <a href="#中文">中文</a>
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

## Live examples / 在线实例

| Example | Status | Visual grammar | Live |
|---|---|---|---|
| **Water Cycle v2 / 水循环 v2** | **Flagship · continuity gated** | Hybrid · Earth system · Flow | [Open](https://kevin-luo.github.io/loop-animation/?demo=water-v2) |
| Solar Eclipse / 日食 | **Flagship · continuity gated** | Orbit · Spatial | [Open](https://kevin-luo.github.io/loop-animation/?demo=eclipse) |
| DNS resolution / DNS 解析 | Earlier experiment | Network · Flow | [Open](https://kevin-luo.github.io/loop-animation/?demo=dns) |
| Binary search / 二分查找 | Earlier experiment | Algorithm · Process | [Open](https://kevin-luo.github.io/loop-animation/?demo=binary) |

**Gallery:** https://kevin-luo.github.io/loop-animation/

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

---

# English

## What is Loop Animation?

Loop Animation is an open-source **Codex Skill + deterministic Three.js runtime + story/export/QA toolchain** for educational explainers.

The project is built around one rule:

> An explainer should be one world evolving through time, not a stack of animated slides.

Chapters tell the learner **where the explanation is**. They do not reset the camera, recreate objects, or replace the world.

```text
WORLD STATE             STORY METADATA          VIEW / OUTPUT
S(t)                    chapters               HTML controls
camera(t)               narration              captions
objects(t)              key ideas              language switch
materials(t)            timestamps             MP4 / GIF / PNG
particles(t)                                    SRT / VTT / narration
```

## v0.6: push beyond the “SVG demo” look

The first versions proved deterministic playback and chapter continuity. v0.6 moves the visual system forward.

The new `water-v2` flagship uses:

- a shader-rendered sky instead of a flat background;
- a moving shader ocean;
- sculpted 3D terrain with altitude-based vegetation / rock / snow coloring;
- volumetric-style cloud sprites;
- `THREE.Points` vapor and rain fields;
- river and groundwater paths embedded in the world;
- one highlighted **hero drop** moving continuously through the complete explanation;
- a continuous Catmull-Rom camera path;
- Stage-first narration that does not cover the main visual subject;
- strict chapter-boundary continuity QA.

### Hybrid visual philosophy

For showcase-quality explainers, Loop Animation no longer assumes that code should draw every pixel.

```text
Raster / generated art / textures
             +
Three.js world + shaders + motion
             +
Story Manifest
             +
lightweight interaction UI
```

Use the right tool for each layer:

- **Three.js / shaders** — motion, depth, camera, particles, geometry, interaction;
- **raster / img2 assets** — painterly environments, anatomy, surfaces, detailed illustration;
- **HTML/CSS** — short captions, controls and accessibility;
- **Story Manifest** — narration, subtitles and future TTS.

Pure SVG or primitive geometry is still useful for diagrams and mechanisms, but it should not be the default art direction for a flagship scene when a richer visual language helps learning.

## Why continuity matters

Avoid chapter-owned world states:

```ts
if (step === 1) camera.position.set(...);
if (step === 2) object.visible = true;
```

Prefer absolute-time functions:

```ts
const rain = envelope(time, 10.7, 12.5, 19.2, 21.0);
rainMaterial.opacity = rain;

cameraCurve.getPointAt(time / DURATION, camera.position);
```

For a chapter boundary `b`, the continuity target is approximately:

```text
S(b - ε) ≈ S(b + ε)
```

This is automatically checked by CI.

## Quick start

Requirements:

- Node.js 22+
- npm
- FFmpeg for MP4/GIF export
- Chromium/Puppeteer-compatible environment for export and QA

```bash
git clone https://github.com/kevin-luo/loop-animation.git
cd loop-animation
npm install
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

## Use with Codex

Repo-scoped Skill:

```text
.agents/skills/loop-animation/SKILL.md
```

Inside the repository:

```text
$loop-animation
```

Recommended prompt:

```text
$loop-animation

Explain the water cycle.

Audience: general audience
Language: English
Duration: 30 seconds
Format: 16:9
Outputs: interactive HTML + MP4 + GIF + SRT

Requirements:
- design one continuous world S(t)
- chapters are narration/navigation bookmarks only
- never hard-switch camera or object states by chapter
- keep one highlighted water drop continuous through the explanation
- use shaders / raster art / 3D where they improve visual quality
- let the visual stage dominate the screen
- keep on-screen narration concise
- run strict boundary continuity QA before export
```

## Install the Skill globally

```bash
npm run skill:install
```

Installed to:

```text
$HOME/.agents/skills/loop-animation
```

Overwrite:

```bash
npm run skill:install:force
```

## Deterministic runtime

`src/runtime/animation.ts` owns time and playback only.

```ts
const controller = new DeterministicTimeline({
  duration: 30,
  steps: CHAPTERS,
  onRender(time) {
    renderWorldAt(time);
  },
});

window.__LOOP_ANIMATION__ = controller;
```

Contract:

```text
same timestamp = same conceptual frame
```

Normal playback, seeking backward, 30 FPS export, and 60 FPS export should reproduce the same world state at the same timestamp.

### Motion helpers

```ts
const groundwater = reveal(time, 20.5, 25.3);

const precipitation = envelope(
  time,
  10.7, 12.5,
  19.2, 21.0,
);
```

Use these instead of hard visibility changes at chapter boundaries.

## Stage-first interaction

Current starting view:

```text
src/runtime/stage-player.ts
src/runtime/stage-player.css
```

It provides:

- large visual stage;
- documentary-style narration;
- draggable Storyline timeline;
- previous / play / next;
- deeper explanation on demand;
- keyboard seeking;
- language switching;
- embed/export modes.

`StagePlayer` is a **view layer, not a mandatory template**. The topic should decide composition.

## Story Manifest

Flagship StagePlayer demos publish:

```ts
window.__LOOP_STORY__
```

The same localized story drives:

```text
HTML narration
SRT subtitles
WebVTT captions
narration.json
narration.md
future TTS / audio composition
```

Export Water v2:

```bash
npm run story:water-v2:zh
npm run story:water-v2:en
```

Export eclipse:

```bash
npm run story:eclipse:zh
npm run story:eclipse:en
```

All current flagship languages:

```bash
npm run story:all
```

## Boundary continuity QA

Water v2:

```bash
npm run qa:water-v2
npm run qa:water-v2:strict
```

Eclipse:

```bash
npm run qa:eclipse
npm run qa:eclipse:strict
```

Both flagship gates:

```bash
npm run qa:continuity
```

For each chapter boundary, QA captures the canvas at:

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

## Performance rules

Flagship explainers should:

- resize WebGL only after the viewport actually changes;
- cap interactive DPR unless maximum resolution is required;
- prefer `THREE.Points` / `InstancedMesh` for repeated particles;
- avoid real-time shadows unless they teach something;
- seed procedural randomness;
- never accumulate export-critical state from the previous frame;
- update chapter DOM only when the chapter changes;
- derive the visual world from absolute time.

A subtle but important rule:

```ts
// bad: depends on render history
cloud.position.y += drift;

// good: deterministic
cloud.position.y = baseY + wave(time);
```

## Export

### HTML

```bash
npm run build
```

### Water v2 MP4

```bash
npm run export:water-v2:mp4
```

### Water v2 GIF

```bash
npm run export:water-v2:gif
```

### Water v2 poster

```bash
npm run export:water-v2:png
```

Custom:

```bash
node scripts/export.mjs \
  --format mp4 \
  --demo water-v2 \
  --width 1920 \
  --height 1080 \
  --fps 30
```

Clip export:

```bash
node scripts/export.mjs \
  --format gif \
  --demo water-v2 \
  --start 8 \
  --duration 10 \
  --width 960 \
  --height 540 \
  --fps 10
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
├── docs/media/
│   ├── water-v2.gif
│   └── eclipse.gif
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
│   │   └── story.ts
│   └── examples/
│       ├── water-v2/      # current visual flagship
│       ├── eclipse/       # spatial flagship
│       ├── water/         # v0.5 reference
│       ├── dns/           # early experiment
│       └── binary/        # early experiment
└── package.json
```

---

# 中文

## Loop Animation 是什么？

Loop Animation 是一个开源的 **Codex Skill + Three.js 确定性动画运行时 + Story / 导出 / QA 工具链**。

核心原则：

> **一个科普动画应该是一整个世界在持续变化，不应该是几张“会动的 PPT”不断切换。**

章节只负责告诉用户“现在讲到哪里”。镜头、物体、粒子和材质都来自同一个连续世界：

```text
S(t)
```

## v0.6：开始解决“程序绘图 Demo 感”

前面的版本解决了播放卡顿、章节硬切、时间轴不确定等底层问题。

v0.6 开始把重心放到**视觉质量**。

新的 `water-v2` 包含：

- Shader 天空；
- 动态 Shader 海面；
- 程序化 3D 地形；
- 根据海拔变化的植被 / 岩石 / 雪线颜色；
- 云层 Sprite；
- `THREE.Points` 水汽与降雨；
- 河流和地下水路径；
- 一颗贯穿全程的 hero drop；
- 一条连续相机曲线；
- 不遮挡主体的 Stage-first 解说；
- 自动 Boundary Continuity QA。

在线查看：

```text
https://kevin-luo.github.io/loop-animation/?demo=water-v2
```

## 新的视觉路线：Hybrid Visual Pipeline

旗舰动画不再要求所有画面都由代码直接画。

```text
Raster / img2 / 高质量纹理
             +
Three.js / Shader / 3D / 粒子动画
             +
Story Manifest
             +
轻量交互 UI
```

各自负责自己擅长的事情：

- **Three.js / Shader**：运动、空间、镜头、粒子、几何、交互；
- **Raster / img2**：复杂环境、人体、材质、写实插画、场景质感；
- **HTML/CSS**：短解说、控制、无障碍；
- **Story Manifest**：字幕、旁白、未来 TTS。

SVG 和基础几何仍然适合流程图、机制图、算法解释，但当“画面质感本身能提高理解”时，不再强行只靠 SVG。

## 快速开始

```bash
git clone https://github.com/kevin-luo/loop-animation.git
cd loop-animation
npm install
npm run dev
```

访问：

```text
?demo=water-v2
?demo=eclipse
?demo=water
?demo=dns
?demo=binary
```

## 给 Codex 使用

仓库包含：

```text
.agents/skills/loop-animation/SKILL.md
```

直接：

```text
$loop-animation
```

推荐提示词：

```text
$loop-animation

解释水循环。

受众：普通用户
语言：中文
时长：30 秒
比例：16:9
输出：交互 HTML + MP4 + GIF + SRT

要求：
- 先设计一个连续世界 S(t)
- 章节只是讲解书签
- 禁止按 step 硬切相机或物体
- 让同一滴水贯穿主要过程
- 画面需要质感时允许 shader / raster / img2 / 3D 混合
- 画面占主体，文字只解释关键变化
- 导出前运行 strict boundary continuity QA
```

## 为什么播放会更顺

禁止这种写法：

```ts
if (step === 1) camera.position.set(...);
object.visible = step === 2;
```

改成：

```ts
const rain = envelope(time, 10.7, 12.5, 19.2, 21.0);
rainMaterial.opacity = rain;

cameraCurve.getPointAt(time / DURATION, camera.position);
```

章节边界 `b` 应尽量满足：

```text
S(b - ε) ≈ S(b + ε)
```

## 确定性规则

同一个 timestamp 必须得到同一个概念画面。

所以禁止依赖上一帧累积：

```ts
// 错误
cloud.position.y += drift;
```

应该从绝对时间计算：

```ts
// 正确
cloud.position.y = baseY + wave(time);
```

正常播放、往回拖、30 FPS 导出、60 FPS 导出都要成立。

## Stage-first UI

旗舰实例默认：

- 大面积视觉舞台；
- 纪录片式简短解说；
- 可拖动 Storyline；
- 上一章 / 播放 / 下一章；
- “深入解释”按需展开；
- 中英文切换；
- Embed / Export 模式。

`StagePlayer` 是交互层，不是强制所有 Demo 长一样的模板。

## Story Manifest

同一份 Story 数据直接服务：

```text
网页解说
SRT
VTT
narration.json
narration.md
未来 TTS
```

水循环 v2：

```bash
npm run story:water-v2:zh
npm run story:water-v2:en
```

日食：

```bash
npm run story:eclipse:zh
npm run story:eclipse:en
```

全部：

```bash
npm run story:all
```

## 连续性 QA

水循环 v2：

```bash
npm run qa:water-v2
npm run qa:water-v2:strict
```

日食：

```bash
npm run qa:eclipse
npm run qa:eclipse:strict
```

两个旗舰：

```bash
npm run qa:continuity
```

每个章节边界会自动检查：

```text
t - 1 frame
t
t + 1 frame
```

并生成：

```text
.output/qa/<demo>/
├── contact-sheet.png
├── boundary-continuity.png
├── report.json
├── frames/
└── boundaries/
```

## 导出

HTML：

```bash
npm run build
```

Water v2 MP4：

```bash
npm run export:water-v2:mp4
```

GIF：

```bash
npm run export:water-v2:gif
```

PNG：

```bash
npm run export:water-v2:png
```

自定义：

```bash
node scripts/export.mjs \
  --format mp4 \
  --demo water-v2 \
  --width 1920 \
  --height 1080 \
  --fps 30
```

## 贡献前检查

```bash
npm run typecheck
npm run build
npm run qa:continuity
npm run story:all
```

欢迎继续增强：

- img2 / raster 分层场景；
- 高质量纹理与材质；
- 人体 / 宇宙 / 地理等旗舰实例；
- Shader 与 3D 视觉语法；
- Boundary / Visual QA；
- 性能和导出；
- 字幕 / TTS / 音频流水线。

## License

MIT
