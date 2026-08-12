# Loop Animation

<p align="center">
  <strong>Turn concepts into guided interactive explainers with Codex + Three.js.</strong><br/>
  用 Codex + Three.js，把知识点做成真正可以逐步讲解、交互和导出的视频级动画。
</p>

<p align="center">
  <a href="https://kevin-luo.github.io/loop-animation/"><strong>Live Gallery</strong></a> ·
  <a href="#english">English</a> ·
  <a href="#中文">中文</a>
</p>

<p align="center">
  <img alt="CI" src="https://github.com/kevin-luo/loop-animation/actions/workflows/ci.yml/badge.svg" />
  <img alt="MIT License" src="https://img.shields.io/badge/license-MIT-blue.svg" />
  <img alt="Three.js" src="https://img.shields.io/badge/Three.js-0.185-black" />
  <img alt="Codex Skill" src="https://img.shields.io/badge/Codex-Skill-111827" />
  <img alt="Version" src="https://img.shields.io/badge/version-0.4.0-6b7280" />
</p>

> **Don't animate text. Animate ideas — and explain what changes.**  
> **别让文字动起来。让知识本身动起来，而且每一步都要讲清楚“为什么变”。**

<p align="center">
  <a href="https://kevin-luo.github.io/loop-animation/?demo=water">
    <img src="docs/media/water.gif" alt="Loop Animation water cycle demo" width="820" />
  </a>
</p>

<p align="center">
  <sub>The preview above is rendered automatically from the real Three.js scene by Puppeteer + FFmpeg.</sub><br/>
  <sub>上面的 GIF 由真实 Three.js 场景通过 Puppeteer + FFmpeg 自动生成，不是手工宣传图。</sub>
</p>

## Live examples / 在线实例

| Example | Visual grammar | Interaction | Live |
|---|---|---|---|
| Water cycle / 水循环 | Earth system · Flow | 5 guided steps | [Open](https://kevin-luo.github.io/loop-animation/?demo=water) |
| Solar eclipse / 日食 | Orbit · Spatial | 6 guided steps | [Open](https://kevin-luo.github.io/loop-animation/?demo=eclipse) |
| DNS resolution / DNS 解析 | Network · Flow | deterministic timeline | [Open](https://kevin-luo.github.io/loop-animation/?demo=dns) |
| Binary search / 二分查找 | Algorithm · Process | deterministic timeline | [Open](https://kevin-luo.github.io/loop-animation/?demo=binary) |

**Gallery:** https://kevin-luo.github.io/loop-animation/

```text
Concept / 知识点
        ↓
5–8 teachable steps / 教学步骤
        ↓
Narration + visible change / 解说 + 对应画面变化
        ↓
Three.js scene + Lesson Shell
        ↓
renderAt(time)
        ↓
┌──────────────┬────────┬───────┬───────┐
│ Interactive  │ MP4    │ GIF   │ PNG   │
│ HTML lesson  │ video  │ demo  │ poster│
└──────────────┴────────┴───────┴───────┘
```

---

# English

## What is Loop Animation?

Loop Animation is an open-source **Codex Skill + guided lesson UI + deterministic Three.js rendering runtime** for educational explainers.

The project is built around one idea: an educational animation should not be a slide deck with moving decorations. Every teaching step should create a meaningful visual change that helps the learner understand the mechanism.

A normal Loop Animation lesson separates the UI into four zones:

```text
┌─────────────┬──────────────────────────────┬───────────────┐
│ Step rail   │ Main visual stage            │ Explanation   │
│             │                              │               │
│ 01          │ Three.js scene               │ What happens  │
│ 02          │ labels + focused callouts    │ What to watch │
│ 03          │                              │ Key idea      │
└─────────────┴──────────────────────────────┴───────────────┘
┌────────────────────────────────────────────────────────────┐
│ Reset · Play/Pause · deterministic scrubber               │
└────────────────────────────────────────────────────────────┘
```

The explanation never needs to cover the primary visual stage.

## v0.4 highlights

- **Codex-native Skill** in `.agents/skills/loop-animation/`
- **Reusable guided lesson shell** in `src/runtime/lesson-shell.ts`
- left-side clickable teaching steps
- large independent Three.js stage
- right-side narration / what-to-watch / key takeaway
- previous / next step controls
- play / pause / reset / timeline scrubbing
- full Chinese / English language switching — no mixed-language UI
- deterministic `renderAt(time)` runtime
- MP4 / GIF / PNG export from the same source
- automated visual QA contact sheets
- GitHub Pages live Gallery
- real README GIFs rendered by GitHub Actions
- four demo routes, including new guided **Water Cycle** and redesigned **Solar Eclipse** lessons

## Requirements

- Node.js 22+
- npm
- FFmpeg for MP4/GIF export
- Chromium/Puppeteer-compatible environment

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

Open the Vite URL printed in the terminal.

Direct demo routes:

```text
?demo=water
?demo=eclipse
?demo=dns
?demo=binary
```

## Use with Codex

The repo contains a repo-scoped Codex Skill:

```text
.agents/skills/loop-animation/SKILL.md
```

Inside the repository, invoke:

```text
$loop-animation
```

Example prompt:

```text
$loop-animation

Explain how the water cycle works.

Audience: general audience
Language: English
Duration: 35 seconds
Format: 16:9
Outputs: interactive HTML + MP4 + GIF

Requirements:
- split the explanation into 5 teachable steps
- keep the main animation stage unobstructed
- every step must cause a meaningful visual change
- provide previous / next step navigation
- provide play/pause and a scrub-able timeline
- show “what to watch” and one key takeaway for each step
- run visual QA before export
```

A technical example:

```text
$loop-animation

Explain how a TCP three-way handshake works.

Audience: junior developers
Duration: 30 seconds
Format: 16:9
Language: Chinese
Outputs: HTML + MP4

Requirements:
- Client and Server keep stable positions
- visualize SYN, SYN-ACK and ACK as moving packets
- explain one state transition per step
- use the guided lesson shell
- do not place narration on top of the network animation
```

## Install the Skill globally

```bash
npm run skill:install
```

Installed to:

```text
$HOME/.agents/skills/loop-animation
```

Overwrite an existing copy:

```bash
npm run skill:install:force
```

## Guided lesson model

Each normal explainer should have 5–8 steps. Each step should define:

```ts
{
  id: 'precipitation',
  start: 10,
  end: 15,

  // localized copy
  nav: 'Precipitation',
  title: 'Cloud droplets grow until gravity wins',
  body: '...',
  watch: 'Watch the rain fall toward the mountain and soil.',
  key: 'Precipitation returns atmospheric water to the surface.'
}
```

The important rule is:

```text
new explanation
      ↓
new visible state
```

If the text changes but the visual state is almost identical, the step is not finished.

## Shared Lesson Shell

New guided examples should reuse:

```ts
import { createLessonShell } from '../../runtime/lesson-shell';
```

Minimal setup:

```ts
const ui = createLessonShell(root, {
  steps: STEPS,
  duration: 30,
  canvasAriaLabel: 'Interactive explainer',
});

const controller = new DeterministicTimeline({
  duration: 30,
  steps: STEPS,
  onRender(time) {
    ui.renderStep(time, copy[language]);
    ui.renderTime(time);

    // Derive all Three.js state from absolute time.
    renderer.render(scene, camera);
  },
});

window.__LOOP_ANIMATION__ = controller;
ui.bindController(controller);
```

The shared shell provides:

- step rail;
- progress pills;
- explanation panel;
- what-to-watch block;
- key-idea block;
- previous/next controls;
- reset;
- timeline scrubber;
- responsive layout;
- lightweight `embed=1` mode for Gallery previews.

## Deterministic timeline

Every animation exposes:

```ts
interface LoopAnimationController {
  duration: number;
  ready: boolean;
  currentTime: number;
  steps?: readonly TimelineStep[];
  currentStepIndex?: number;
  renderAt(time: number): void;
  play(): void;
  pause(): void;
  seek(time: number): void;
  goToStep?(index: number): void;
  nextStep?(): void;
  previousStep?(): void;
}
```

The same timestamp must reconstruct the same conceptual state:

```ts
renderAt(12.5)
```

regardless of whether the user reached it by normal playback, seeking backward, screenshot QA, 30 FPS export or 60 FPS export.

Avoid export-critical state driven by accumulated `deltaTime`, wall-clock time or unseeded randomness.

## Export HTML

```bash
npm run build
```

Output:

```text
dist/
```

## Export MP4

Default demo:

```bash
npm run export:mp4
```

Water cycle 1080p landscape:

```bash
npm run export:water:mp4
```

Or manually:

```bash
npm run build
node scripts/export.mjs \
  --format mp4 \
  --demo water \
  --width 1920 \
  --height 1080 \
  --fps 30
```

Output:

```text
.output/water.mp4
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

Use GIF for README/social previews. Use MP4 for final video quality.

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

## Visual QA

Generate a contact sheet from meaningful timeline checkpoints:

```bash
npm run qa
```

Water cycle landscape QA:

```bash
npm run qa:water
```

Output:

```text
.output/qa/<demo>/
├── contact-sheet.png
├── report.json
└── frames/
```

Inspect:

- whether explanation panels overlap the stage;
- clipping and tiny labels;
- dead / nearly identical steps;
- misleading geometry;
- abrupt camera changes;
- weak focal hierarchy;
- poor landscape / vertical composition;
- steps whose narration changes but visuals do not.

## Current examples

### Water Cycle

```text
Evaporation
   ↓
Vapor transport + condensation
   ↓
Precipitation
   ↓
Surface runoff
   ↓
Infiltration + groundwater
```

The scene contains programmatic ocean, terrain, mountains, clouds, river, rain, runoff and underground-water motion.

Storyboard:

```text
examples/water/storyboard.md
```

### Solar Eclipse

```text
Spatial roles
   ↓
5.1° orbital tilt
   ↓
Orbital nodes
   ↓
Umbra + penumbra
   ↓
Observer locations
   ↓
Why eclipses are rare
```

The main explanation panel is now outside the Three.js stage so the orbit geometry remains visible.

### DNS Resolution

A packet-flow example through Browser → Resolver → Root → TLD → Authoritative DNS.

### Binary Search

An algorithm/process example showing the search space shrinking after every comparison.

## Project structure

```text
loop-animation/
├── .agents/
│   └── skills/loop-animation/
│       ├── SKILL.md
│       └── agents/openai.yaml
├── .github/workflows/
│   ├── ci.yml
│   ├── pages.yml
│   └── preview-media.yml
├── docs/media/
│   ├── water.gif
│   └── eclipse.gif
├── examples/
│   ├── water/storyboard.md
│   └── eclipse/storyboard.md
├── scripts/
│   ├── export.mjs
│   ├── qa.mjs
│   └── install-skill.mjs
├── src/
│   ├── main.ts
│   ├── gallery/
│   ├── runtime/
│   │   ├── animation.ts
│   │   ├── lesson-shell.ts
│   │   └── lesson-shell.css
│   └── examples/
│       ├── water/
│       ├── eclipse/
│       ├── dns/
│       └── binary/
└── package.json
```

## Design rules

Prefer:

- one teaching question per step;
- explanation beside the stage, not over it;
- visible mechanism changes;
- object continuity;
- anchored short labels;
- restrained camera motion;
- stable composition;
- complete language switching;
- layouts that remain readable at 16:9 and 9:16.

Avoid:

- floating narration cards covering the subject;
- paragraph-heavy scenes;
- generic glowing UI everywhere;
- decorative particles with no explanatory role;
- constant zooming;
- changing copy while the visual remains unchanged;
- mixed Chinese + English UI unless the lesson itself requires both languages.

---

# 中文

## Loop Animation 是什么？

Loop Animation 是一个开源的 **Codex Skill + Three.js 科普动画运行时 + 分步教学 UI**。

它解决的不是“让 AI 生成一个会动的页面”，而是让 Codex 按真正的教学过程生成动画：

1. 先确定一个明确的学习目标；
2. 拆成 5～8 个能独立讲清楚的步骤；
3. 每一步都有解说；
4. 每一步都有对应的画面变化；
5. 用户可以暂停、切步骤、拖时间轴；
6. 最终从同一份源码导出 HTML / MP4 / GIF / PNG。

## v0.4 最大变化

之前的解说卡片会压在 Three.js 场景上，现在统一改成了**教学工作台布局**：

```text
左侧                 中间                      右侧
步骤导航             动画主舞台                当前解说
01 蒸发              Three.js                 发生了什么
02 输送                                        看哪里
03 降水                                        关键点

                    底部
            重置 / 播放 / 时间轴
```

也就是说：**动画区域就是动画区域，解说不会再遮住主要画面。**

## 快速开始

```bash
git clone https://github.com/kevin-luo/loop-animation.git
cd loop-animation
npm install
npm run dev
```

然后打开终端中 Vite 输出的地址。

首页是 Gallery，也可以直接打开：

```text
?demo=water
?demo=eclipse
?demo=dns
?demo=binary
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

例如：

```text
$loop-animation

解释水循环是怎么运转的。

受众：普通用户
语言：中文
时长：35 秒
比例：16:9
输出：交互 HTML + MP4 + GIF

要求：
- 拆成 5 个教学步骤
- 每一步都必须产生对应的画面变化
- 左侧显示步骤导航
- 中间只放动画主舞台
- 右侧放当前步骤解说、观察重点、关键点
- 支持上一步 / 下一步
- 支持播放暂停和拖动时间轴
- 导出前运行视觉 QA
```

或者：

```text
$loop-animation

解释 TCP 三次握手。

受众：初级程序员
语言：中文
时长：30 秒
比例：16:9

要求：
- Client 和 Server 的位置固定
- SYN / SYN-ACK / ACK 用数据包移动表示
- 每个步骤只解释一次状态变化
- 解说区不能盖住网络动画
- 最终导出 HTML 和 MP4
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

## 新的教学壳 Lesson Shell

创建新示例时，不需要重新设计一套 UI。

直接：

```ts
import { createLessonShell } from '../../runtime/lesson-shell';

const ui = createLessonShell(root, {
  steps: STEPS,
  duration: 30,
  canvasAriaLabel: '科普动画',
});
```

它默认提供：

- 左侧步骤列表
- 中间 Three.js Canvas
- 右侧完整解说
- 观察重点
- 关键点
- 上一步 / 下一步
- 播放 / 暂停
- 重置
- 时间轴
- 当前步骤进度
- Gallery iframe 精简模式
- 响应式布局

## 步骤怎么写？

一个步骤至少包含：

```text
标题
正文解释
观察重点
关键点
对应的画面变化
```

例如水循环的“降水”：

```text
解释：
云里的小水滴不断碰撞、长大，直到上升气流托不住。

观察重点：
雨滴开始从云底落向山地和土壤。

关键点：
降水把大气中的水重新送回地表。

动画变化：
云层变厚 → 雨滴出现 → 雨落到山地和河谷。
```

这里最重要的一条规则是：

> **文案进入下一步，画面也必须进入下一种可观察状态。**

## 导出 MP4

默认：

```bash
npm run export:mp4
```

水循环 1080p 横屏：

```bash
npm run export:water:mp4
```

也可以自定义：

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

适合 README 和社交平台预览。

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

## Visual QA

普通 QA：

```bash
npm run qa
```

水循环：

```bash
npm run qa:water
```

会输出：

```text
.output/qa/<demo>/
├── contact-sheet.png
├── report.json
└── frames/
```

重点检查：

- 解说是否遮住动画；
- 文案变化后画面有没有同步变化；
- 标签是否重叠；
- 主体是否被裁掉；
- 不同步骤是否看起来几乎一样；
- 相机运动是否过度；
- 16:9 / 9:16 构图是否仍然成立。

## 当前最完整的两个示例

### 1. 水循环

```text
蒸发
 ↓
水汽输送与凝结
 ↓
降水
 ↓
地表径流
 ↓
下渗与地下水
```

场景中的海洋、山体、云、雨、河流、地表径流和地下水全部由代码生成并随时间变化。

### 2. 日食

```text
建立空间关系
 ↓
5.1° 轨道倾角
 ↓
轨道交点
 ↓
本影与半影
 ↓
不同观察位置
 ↓
为什么日食不会每个月发生
```

新版日食已经把步骤和解说移到主舞台之外，Three.js 场景不再被大卡片挡住。

## License

MIT
