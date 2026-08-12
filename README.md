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
  <img alt="Version" src="https://img.shields.io/badge/version-0.5.0-6b7280" />
</p>

> **The chapter changes. The world does not reset.**  
> **章节会切换，世界不会重置。**

<p align="center">
  <a href="https://kevin-luo.github.io/loop-animation/?demo=water">
    <img src="docs/media/water.gif" alt="Loop Animation water cycle demo" width="820" />
  </a>
</p>

<p align="center">
  <sub>This GIF is rendered automatically from the real Three.js scene by Puppeteer + FFmpeg.</sub><br/>
  <sub>上面的 GIF 由真实 Three.js 场景通过 Puppeteer + FFmpeg 自动生成，不是手工宣传图。</sub>
</p>

## Live examples / 在线实例

| Example | Status | Visual grammar | Live |
|---|---|---|---|
| Water cycle / 水循环 | **Flagship · continuity gated** | Earth system · Flow | [Open](https://kevin-luo.github.io/loop-animation/?demo=water) |
| Solar eclipse / 日食 | **Flagship · continuity gated** | Orbit · Spatial | [Open](https://kevin-luo.github.io/loop-animation/?demo=eclipse) |
| DNS resolution / DNS 解析 | Earlier experiment | Network · Flow | [Open](https://kevin-luo.github.io/loop-animation/?demo=dns) |
| Binary search / 二分查找 | Earlier experiment | Algorithm · Process | [Open](https://kevin-luo.github.io/loop-animation/?demo=binary) |

**Gallery:** https://kevin-luo.github.io/loop-animation/

```text
                    ┌───────────────────────────────┐
                    │ Continuous world state S(t)   │
Concept ───────────▶│ camera(t) · objects(t)        │
                    │ particles(t) · materials(t)   │
                    └──────────────┬────────────────┘
                                   │
                    ┌──────────────▼────────────────┐
                    │ Story metadata                │
                    │ chapters · narration · keys   │
                    └──────────────┬────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
       Interactive HTML        MP4 / GIF              PNG
```

---

# English

## What is Loop Animation?

Loop Animation is an open-source **Codex Skill + deterministic Three.js runtime + export/QA toolchain** for educational visual explainers.

The central idea is simple:

> An explainer should be one world evolving through time, not a stack of animated slides.

In v0.5, chapters are only narration and navigation metadata. The visual world remains a continuous function of absolute time:

```text
WORLD STATE             STORY METADATA          VIEW
S(t)                    chapters               controls
camera(t)               narration              captions
objects(t)              key ideas              language switch
materials(t)            timestamps             details drawer
particles(t)
```

This separation solves two common AI-animation problems:

1. chapter boundaries no longer need to reset the camera or recreate objects;
2. the same deterministic source can be scrubbed interactively or rendered frame-by-frame to video.

## v0.5 highlights

- continuous world model `S(t)` instead of step-owned visual states;
- headless observable `DeterministicTimeline`;
- smooth `reveal()` and `envelope()` helpers for overlapping transitions;
- stage-first interactive film UI instead of permanent dashboard sidebars;
- optional deeper explanation drawer;
- continuous camera curves for flagship demos;
- `ResizeObserver`-based WebGL sizing instead of resizing every frame;
- DPR capped for smoother interactive playback;
- `THREE.Points` particle fields in the water-cycle flagship;
- automated **boundary continuity QA** at `t−1 frame / t / t+1 frame`;
- strict continuity checks in GitHub Actions;
- deterministic HTML / MP4 / GIF / PNG output from the same source;
- Chinese / English switching without mixed-language UI.

## Requirements

- Node.js 22+
- npm
- FFmpeg for MP4/GIF export
- Chromium/Puppeteer-compatible environment for export and QA

```bash
node -v
npm -v
ffmpeg -version
```

## Quick start

```bash
git clone https://github.com/kevin-luo/loop-animation.git
cd loop-animation
npm install
npm run dev
```

Open the Vite URL shown in the terminal.

Demo routes:

```text
?demo=water
?demo=eclipse
?demo=dns
?demo=binary
```

## Use with Codex

The repository contains a repo-scoped Codex Skill:

```text
.agents/skills/loop-animation/SKILL.md
```

Inside the repository, invoke:

```text
$loop-animation
```

Recommended prompt:

```text
$loop-animation

Explain how the water cycle works.

Audience: general audience
Language: English
Duration: 35 seconds
Format: 16:9
Outputs: interactive HTML + MP4 + GIF

Requirements:
- design one continuous world S(t)
- use 5 chapters only as narration/navigation bookmarks
- never switch camera/object state with `if (step === ...)`
- keep one water drop visually continuous across the explanation
- let the visual stage dominate the screen
- use short on-screen narration and deeper details on demand
- run strict boundary continuity QA before export
```

Another example:

```text
$loop-animation

Explain a TCP three-way handshake.

Audience: junior developers
Language: Chinese
Duration: 30 seconds
Outputs: HTML + MP4

Requirements:
- Client and Server remain persistent objects
- packets move continuously along stable routes
- SYN → SYN-ACK → ACK are chapters, not separate scenes
- narration changes without resetting the network world
- use a stage-first layout
- run boundary continuity QA
```

## Install the Skill globally

```bash
npm run skill:install
```

Installed to:

```text
$HOME/.agents/skills/loop-animation
```

Overwrite an existing installation:

```bash
npm run skill:install:force
```

## Architecture

### 1. Headless deterministic timeline

`src/runtime/animation.ts` owns time, playback, chapter metadata and subscriptions.

```ts
const controller = new DeterministicTimeline({
  duration: 25,
  steps: CHAPTERS,
  onRender(time) {
    renderWorldAt(time);
  },
});

window.__LOOP_ANIMATION__ = controller;
```

Important contract:

```text
same timestamp = same visual frame
```

Whether the user reaches `12.5s` by normal playback, seeking backward, screenshot QA, 30 FPS export or 60 FPS export, the conceptual scene must be reproducible.

### 2. Chapters are metadata, not visual states

Avoid:

```ts
if (step === 1) camera.position.set(...);
object.visible = step === 2;
```

Those patterns usually create jumps at boundaries.

Prefer absolute-time functions:

```ts
const rain = envelope(time, 8.6, 10.7, 16.8, 18.7);
rainMaterial.opacity = rain;

cameraCurve.getPointAt(time / DURATION, camera.position);
```

The continuity contract around every chapter boundary `b` is approximately:

```text
S(b - ε) ≈ S(b + ε)
```

### 3. Stage-first UI

The current flagship UI lives in:

```text
src/runtime/stage-player.ts
src/runtime/stage-player.css
```

It provides:

- a large uninterrupted visual stage;
- concise lower-third narration;
- storyline/chapter navigation integrated at the bottom;
- previous / play / next controls;
- optional deeper explanation drawer;
- language switch;
- lightweight embed/export modes.

It is intentionally a **view layer**, not a required template. The water-cycle and eclipse demos already compose it differently.

The older `lesson-shell.ts/css` remains only for compatibility with earlier experiments. New flagship explainers should not treat it as the canonical design.

### 4. Resize only when necessary

Use:

```ts
import { observeRendererViewport } from '../../runtime/canvas-viewport';

const viewport = observeRendererViewport(renderer, camera, stage, {
  maxPixelRatio: 1.5,
});
```

This avoids calling `renderer.setSize()` and `camera.updateProjectionMatrix()` on every animation frame.

## Motion helpers

### `reveal()`

Smoothly turns a process on over an absolute time window:

```ts
const groundwater = reveal(time, 17.4, 20.5);
```

### `envelope()`

Fade in → hold → fade out without hard visibility cuts:

```ts
const precipitation = envelope(
  time,
  8.6, 10.7,
  16.8, 18.7,
);
```

Use these instead of:

```ts
mesh.visible = currentStep === 2;
```

## Boundary continuity QA

Normal visual QA:

```bash
npm run qa:water
npm run qa:eclipse
```

Strict continuity gates:

```bash
npm run qa:water:strict
npm run qa:eclipse:strict
npm run qa:continuity
```

For every chapter boundary, QA captures the **canvas only** at:

```text
t - 1 frame
t
t + 1 frame
```

It compares normalized pixel differences and flags suspicious asymmetric changes.

Output:

```text
.output/qa/<demo>/
├── contact-sheet.png
├── boundary-continuity.png
├── report.json
├── frames/
└── boundaries/
```

The strict workflow is also executed by GitHub Actions.

Boundary QA is a heuristic, not a proof of physical correctness. Review warnings visually and still inspect the contact sheet for composition, clipping and misleading geometry.

## Performance rules

Flagship explainers should:

- resize WebGL only after an actual viewport change;
- cap interactive DPR unless maximum resolution is specifically needed;
- prefer `THREE.Points` / `InstancedMesh` over many separate particle meshes;
- avoid real-time shadows unless they teach something;
- reuse vectors in hot render loops;
- avoid large permanent backdrop-filter layers;
- update chapter copy only when the chapter changes;
- seed procedural randomness;
- derive export-critical state only from absolute time.

## Export HTML

```bash
npm run build
```

Output:

```text
dist/
```

## Export MP4

```bash
npm run export:water:mp4
```

Custom:

```bash
npm run build
node scripts/export.mjs \
  --format mp4 \
  --demo water \
  --width 1920 \
  --height 1080 \
  --fps 30
```

## Export GIF

```bash
npm run export:water:gif
```

Or:

```bash
npm run build
node scripts/export.mjs --format gif --demo eclipse --width 960 --height 540 --fps 15
```

Use GIF for README/social preview. Prefer MP4 for final video quality.

## Export PNG

```bash
npm run build
node scripts/export.mjs \
  --format png \
  --demo water \
  --time 13 \
  --width 1920 \
  --height 1080
```

## Flagship example: Water Cycle

The v0.5 water-cycle demo is the reference implementation for new work.

It uses:

- one global continuous camera curve;
- overlapping evaporation / transport / rain / runoff / groundwater envelopes;
- `THREE.Points` particle fields;
- one highlighted water drop that persists across the journey;
- a secondary branch into groundwater;
- stage-first narration;
- strict chapter-boundary QA.

```text
Ocean
  ↑ evaporation
Atmosphere
  → transport
Cloud
  ↓ precipitation
Land
  → river runoff → ocean
  ↓ infiltration
Groundwater → ocean
```

Source:

```text
src/examples/water/main.ts
```

## Flagship example: Solar Eclipse

The eclipse demo uses a different composition to prove that StagePlayer is not a one-template UI system.

It keeps one continuous orbital world and progressively emphasizes:

```text
Sun / Moon / Earth
      ↓
orbital tilt
      ↓
nodes
      ↓
umbra + penumbra
      ↓
observer position
      ↓
why the shadow usually misses Earth
```

Source:

```text
src/examples/eclipse/studio.ts
```

## Project structure

```text
loop-animation/
├── .agents/
│   └── skills/loop-animation/
│       ├── SKILL.md
│       └── agents/openai.yaml
├── .github/workflows/
│   ├── ci.yml
│   ├── continuity-qa.yml
│   ├── pages.yml
│   └── preview-media.yml
├── docs/media/
│   ├── water.gif
│   └── eclipse.gif
├── scripts/
│   ├── export.mjs
│   ├── qa.mjs
│   └── install-skill.mjs
├── src/
│   ├── gallery/
│   ├── runtime/
│   │   ├── animation.ts
│   │   ├── canvas-viewport.ts
│   │   ├── stage-player.ts
│   │   ├── stage-player.css
│   │   ├── lesson-shell.ts       # legacy compatibility
│   │   └── lesson-shell.css      # legacy compatibility
│   └── examples/
│       ├── water/
│       ├── eclipse/
│       ├── dns/
│       └── binary/
└── package.json
```

## Contributing

The most useful contributions are:

- new continuous visual grammars;
- polished educational examples;
- better boundary/visual QA;
- rendering/export performance improvements;
- reusable deterministic motion primitives;
- accessibility and interaction improvements.

Before opening a PR:

```bash
npm run typecheck
npm run build
npm run qa:continuity
```

---

# 中文

## Loop Animation 是什么？

Loop Animation 是一个开源的 **Codex Skill + Three.js 确定性动画运行时 + 导出 / QA 工具链**。

v0.5 的核心理解只有一句话：

> **一个科普动画应该是一整个世界在持续变化，而不是几张“会动的 PPT”不断切换。**

现在我们把系统拆成三层：

```text
视觉世界 S(t)           故事元数据              交互视图
camera(t)              chapters              controls
objects(t)             narration             captions
particles(t)           key ideas             language switch
materials(t)           timestamps            details drawer
```

其中最重要的是：

**章节只负责“讲到哪里”，不能决定“画面突然变成什么”。**

## v0.5 主要变化

- Step / Chapter 从视觉状态控制器降级为讲解书签；
- 相机、物体、粒子、材质全部从全局绝对时间 `time` 推导；
- 新增 `reveal()` / `envelope()`，替代硬切的 `visible = true/false`；
- 新增 Stage-first 交互方式，画面占主体，解说缩成纪录片式下三分之一；
- 深入解释按“为什么？”再展开；
- 水循环改用连续相机曲线与 `THREE.Points` 粒子系统；
- WebGL 只在尺寸真正变化时 resize；
- 默认限制 DPR，改善普通电脑和手机上的流畅度；
- 新增章节边界连续性 QA；
- GitHub Actions 会自动跑严格 continuity gate；
- 水循环和日食成为当前两个旗舰实例；
- 中英文仍是完整切换，不在同一个画面混排。

## 快速开始

```bash
git clone https://github.com/kevin-luo/loop-animation.git
cd loop-animation
npm install
npm run dev
```

访问：

```text
?demo=water
?demo=eclipse
```

首页 Gallery：

```text
https://kevin-luo.github.io/loop-animation/
```

## 在 Codex 中使用

仓库内已经包含：

```text
.agents/skills/loop-animation/SKILL.md
```

直接调用：

```text
$loop-animation
```

推荐提示词：

```text
$loop-animation

解释水循环。

受众：普通用户
语言：中文
时长：35 秒
比例：16:9
输出：交互 HTML + MP4 + GIF

要求：
- 先设计一个连续世界 S(t)
- 5 个章节只作为解说和导航书签
- 禁止用 if (step === ...) 切换相机或物体状态
- 让同一滴水贯穿主要过程
- 画面占主体，文字只解释关键变化
- 详细原理按需展开
- 导出前运行 strict boundary continuity QA
```

技术类例子：

```text
$loop-animation

解释 TCP 三次握手。

受众：初级开发者
语言：中文
时长：30 秒
输出：HTML + MP4

要求：
- Client / Server 始终是同一组对象
- SYN / SYN-ACK / ACK 沿稳定路径连续移动
- 三个阶段是章节，不是三张不同场景
- 章节切换时不能重置镜头
- 使用 Stage-first 交互
- 运行连续性 QA
```

## 全局安装 Skill

```bash
npm run skill:install
```

安装到：

```text
$HOME/.agents/skills/loop-animation
```

强制覆盖：

```bash
npm run skill:install:force
```

## 最重要的开发规则：世界必须连续

错误方式：

```ts
if (step === 1) {
  camera.position.set(1, 2, 10);
}

if (step === 2) {
  camera.position.set(8, 4, 6);
}
```

用户正常播放跨过边界时，镜头一定会“咔”一下。

同样不要这样：

```ts
rain.visible = step === 2;
```

推荐方式：

```ts
const rain = envelope(time, 8.6, 10.7, 16.8, 18.7);
rainMaterial.opacity = rain;

cameraCurve.getPointAt(time / DURATION, camera.position);
```

所以章节边界 `b` 应尽量满足：

```text
S(b - ε) ≈ S(b + ε)
```

至少要考虑：

- position
- rotation
- scale
- opacity
- camera position
- camera target
- 重要材质状态

## Headless Timeline

核心时间控制器：

```text
src/runtime/animation.ts
```

它负责：

- 当前时间；
- 播放 / 暂停；
- Seek；
- 章节元数据；
- 当前章节索引；
- UI 订阅；
- QA 时间点。

它**不负责**决定某一步应该长什么样。

这意味着视觉层只需要实现：

```ts
function renderWorldAt(time: number) {
  // 所有画面状态都由 absolute time 推导
}
```

## `reveal()` 和 `envelope()`

渐进出现：

```ts
const groundwater = reveal(time, 17.4, 20.5);
```

淡入 → 保持 → 淡出：

```ts
const precipitation = envelope(
  time,
  8.6, 10.7,
  16.8, 18.7,
);
```

这类函数可以让前后两个知识过程有自然重叠，不需要等到章节边界才“开关”。

## Stage-first UI

现在旗舰实例默认使用：

```text
src/runtime/stage-player.ts
src/runtime/stage-player.css
```

设计原则：

```text
画面约 70%+
文字 / 控制约 30%-
```

它提供：

- 大面积完整动画舞台；
- 纪录片式简短解说；
- 底部 Storyline；
- 上一章 / 播放 / 下一章；
- “为什么？”详细解释；
- 中英文切换；
- embed / export 模式。

但 StagePlayer **只是视图层起点，不是所有动画必须长成同一个模板**。

例如：

- 水循环的解说偏左；
- 日食的解说在桌面端偏右；
- 未来人体、网络、数学都可以根据内容重新组织视觉布局。

旧的 `lesson-shell.ts/css` 只保留给 DNS / Binary 等早期实验兼容，新旗舰实例不要继续以它为设计基准。

## 性能优化规则

### 不要每帧 resize

使用：

```ts
observeRendererViewport(renderer, camera, stage, {
  maxPixelRatio: 1.5,
});
```

只有实际尺寸改变时才：

```text
renderer.setSize()
camera.updateProjectionMatrix()
```

### 粒子不要一粒一个 Mesh

大量粒子优先：

```text
THREE.Points
InstancedMesh
```

当前水循环的蒸发、水汽、降雨、径流和地下水全部已经改成 `THREE.Points`。

### 其他规则

- 普通互动模式不要无脑 DPR=2；
- 没教学价值的实时阴影直接关闭；
- 热循环里复用临时 Vector；
- DOM 文案只在章节变化时更新；
- 随机过程固定 seed；
- 视频关键状态不能依赖 `deltaTime` 累积。

## 连续性 QA

水循环：

```bash
npm run qa:water
npm run qa:water:strict
```

日食：

```bash
npm run qa:eclipse
npm run qa:eclipse:strict
```

一次检查两个旗舰实例：

```bash
npm run qa:continuity
```

每个章节边界自动截：

```text
t - 1 frame
t
t + 1 frame
```

输出：

```text
.output/qa/<demo>/
├── contact-sheet.png
├── boundary-continuity.png
├── report.json
├── frames/
└── boundaries/
```

`report.json` 会记录边界前后画面的归一化像素差异。如果某一侧突然比另一侧大很多，就会标为 warning。

注意：这个检查只能发现“疑似视觉跳变”，不能证明动画一定科学正确。所以还要人工检查：

- 遮挡；
- 字太小；
- 构图；
- 信息焦点；
- 物理 / 几何是否误导；
- 解说和动画是否真正同步。

## 导出 HTML

```bash
npm run build
```

输出：

```text
dist/
```

## 导出 MP4

```bash
npm run export:water:mp4
```

自定义：

```bash
npm run build
node scripts/export.mjs \
  --format mp4 \
  --demo water \
  --width 1920 \
  --height 1080 \
  --fps 30
```

## 导出 GIF

```bash
npm run export:water:gif
```

或者：

```bash
node scripts/export.mjs --format gif --demo eclipse --width 960 --height 540 --fps 15
```

GIF 更适合 README / 社交媒体预览；正式视频优先 MP4。

## 导出 PNG

```bash
npm run build
node scripts/export.mjs \
  --format png \
  --demo water \
  --time 13 \
  --width 1920 \
  --height 1080
```

## 旗舰实例：水循环

水循环已经成为当前新架构的标准参考：

- 一条全局连续相机曲线；
- 蒸发 / 输送 / 降水 / 径流 / 地下水过程互相重叠；
- 所有大批量粒子使用 `THREE.Points`；
- 一颗高亮“主水滴”贯穿主要路径；
- 地下水作为第二条平滑分支出现；
- 没有 `visible = step === n`；
- 没有章节边界切相机；
- 严格连续性 QA 已接入 Actions。

源码：

```text
src/examples/water/main.ts
```

## 旗舰实例：日食

日食没有照搬水循环的排版。

它保留同一套连续时间 / 交互协议，但采用：

- 中央天体世界；
- 桌面端右侧纪录片式解说；
- 更少的空间标注；
- 一条连续月球轨道；
- 连续相机和观察目标；
- 逐渐强调轨道倾角、交点、本影、半影和观察位置。

源码：

```text
src/examples/eclipse/studio.ts
```

## 项目结构

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
│   ├── water.gif
│   └── eclipse.gif
├── scripts/
│   ├── export.mjs
│   ├── qa.mjs
│   └── install-skill.mjs
├── src/
│   ├── gallery/
│   ├── runtime/
│   │   ├── animation.ts
│   │   ├── canvas-viewport.ts
│   │   ├── stage-player.ts
│   │   ├── stage-player.css
│   │   ├── lesson-shell.ts      # 旧实例兼容
│   │   └── lesson-shell.css     # 旧实例兼容
│   └── examples/
│       ├── water/
│       ├── eclipse/
│       ├── dns/
│       └── binary/
└── package.json
```

## 贡献方向

现在最欢迎的 PR：

- 新的连续视觉语法；
- 真正有教学价值的旗舰示例；
- Boundary / Visual QA；
- 渲染和导出性能优化；
- 可复用确定性 motion primitives；
- 无障碍和交互体验。

提交前建议运行：

```bash
npm run typecheck
npm run build
npm run qa:continuity
```

## License

MIT
