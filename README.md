# Loop Animation

<p align="center">
  <strong>Turn concepts into interactive explainers with Codex + Three.js.</strong><br/>
  一句话生成可交互的 Three.js 科普动画，并从同一份源码导出 HTML、MP4、GIF 和 PNG。
</p>

<p align="center">
  <a href="#english">English</a> · <a href="#中文">中文</a>
</p>

<p align="center">
  <img alt="CI" src="https://github.com/kevin-luo/loop-animation/actions/workflows/ci.yml/badge.svg" />
  <img alt="MIT License" src="https://img.shields.io/badge/license-MIT-blue.svg" />
  <img alt="Three.js" src="https://img.shields.io/badge/Three.js-0.185-black" />
  <img alt="Codex Skill" src="https://img.shields.io/badge/Codex-Skill-111827" />
</p>

> **Don't animate text. Animate ideas.**
>
> **别让文字动起来，让知识本身动起来。**

Loop Animation is an open-source **Codex Skill + deterministic Three.js animation runtime** for educational explainers. The interactive HTML is the source artifact; video, GIF, poster images, and QA frames are deterministic renders of the same timeline.

```text
Concept / 知识点
      ↓
Learning goal / 教学目标
      ↓
Visual grammar / 视觉语法
      ↓
Storyboard / 分镜
      ↓
Three.js scene
      ↓
renderAt(time)
      ↓
Interactive HTML
   ┌──────┼────────┬────────┐
   ↓      ↓        ↓        ↓
  MP4    GIF      PNG     Visual QA
```

---

# English

## What is Loop Animation?

Most AI-generated educational videos eventually become animated slides: a title, a few cards, floating text, decorative particles, and generic transitions.

Loop Animation gives Codex a more opinionated workflow:

1. verify the concept;
2. define one learning goal;
3. choose a visual grammar;
4. storyboard before coding;
5. build a spatial explanation in Three.js;
6. drive every frame from absolute time;
7. inspect representative frames;
8. export multiple formats from the same source.

The first included example explains **why a solar eclipse happens** using the Sun, Moon, Earth, orbit geometry, shadow visualization, object labels, playback controls, and a seekable deterministic timeline.

## Features

- **Codex-native Skill** — repo-scoped skill lives at `.agents/skills/loop-animation/`.
- **Interactive HTML first** — play, pause, scrub, resize, and extend with meaningful interactions.
- **Deterministic rendering** — `renderAt(time)` produces reproducible frames.
- **One source, multiple outputs** — HTML, MP4, GIF, PNG.
- **Visual QA** — automatically sample key timestamps and generate a contact sheet.
- **9:16 + 16:9 friendly** — designed for both social video and desktop explainers.
- **Seeded procedural visuals** — exported frames do not change randomly between renders.
- **GitHub Pages ready** — the repository includes a Pages deployment workflow.

## Requirements

Before starting, install:

- **Node.js 22+**
- **npm**
- **FFmpeg** — required for MP4/GIF export
- a local environment supported by Puppeteer/Chromium

Check your environment:

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

Open the Vite URL printed in the terminal. The default page runs the solar-eclipse explainer.

Useful commands:

```bash
npm run dev              # local interactive preview
npm run typecheck        # TypeScript check
npm run build            # production HTML build → dist/
npm run qa               # vertical visual QA contact sheet
npm run qa:landscape     # landscape visual QA contact sheet
npm run export:mp4       # → .output/video.mp4
npm run export:gif       # → .output/preview.gif
npm run export:png       # → .output/poster.png
```

## Use it with Codex

### Method A — use the repo-scoped Skill (recommended)

Clone the repository and open Codex from inside the repo:

```bash
git clone https://github.com/kevin-luo/loop-animation.git
cd loop-animation
npm install
```

Codex can discover the checked-in Skill from:

```text
.agents/skills/loop-animation/SKILL.md
```

Invoke it explicitly in Codex:

```text
$loop-animation
```

Then give it a task, for example:

```text
$loop-animation

Explain why seasons happen.
Requirements:
- 45 seconds
- vertical 9:16
- English
- interactive HTML
- export MP4 and GIF
- show the Earth's axial tilt spatially
- avoid slide-like cards
```

Another example:

```text
$loop-animation

Visualize how DNS resolves example.com.
Show packets moving from browser → resolver → root → TLD → authoritative server.
Let the user scrub the timeline and inspect each stage.
Export HTML and a 1920x1080 MP4.
```

### Method B — install the Skill for your user account

After cloning and installing dependencies:

```bash
npm run skill:install
```

This copies the skill to:

```text
$HOME/.agents/skills/loop-animation
```

Then `$loop-animation` can be available from other repositories as well.

To replace an existing installation:

```bash
npm run skill:install:force
```

If Codex does not immediately show the updated Skill, restart Codex.

### Method C — use Codex's Skill installer

Codex also provides `$skill-installer`. You can invoke it and ask it to install the Loop Animation skill from this GitHub repository.

## Recommended prompt structure

You do not need a long prompt. Good requests usually contain four things:

```text
$loop-animation

Topic: Why can't humans breathe underwater?
Audience: general audience
Duration: 35 seconds
Format: 9:16 vertical HTML + MP4 + GIF

Requirements:
- explain gas exchange visually
- use a simple lung/gill comparison
- keep labels short
- run visual QA before export
```

For technical explainers:

```text
$loop-animation

Create an interactive explainer for how a CPU cache works.
Audience: junior programmers.
Use a flow/inside visual grammar.
Show CPU → L1 → L2 → RAM latency spatially.
Let users pause and scrub.
Output responsive HTML and 1080p MP4.
```

## Export formats

### HTML

```bash
npm run build
```

Output:

```text
dist/
```

This is the primary artifact and can be hosted as a static website.

### MP4

```bash
npm run export:mp4
```

Default output:

```text
.output/video.mp4
```

Default video size is `1080x1920 @ 30fps`.

Custom landscape export:

```bash
npm run build
node scripts/export.mjs \
  --format mp4 \
  --width 1920 \
  --height 1080 \
  --fps 60
```

### GIF

```bash
npm run export:gif
```

Output:

```text
.output/preview.gif
```

GIF is intended primarily for README previews and lightweight sharing. Use MP4 for final high-quality video.

### PNG poster

```bash
npm run export:png
```

Output:

```text
.output/poster.png
```

Choose a custom timestamp:

```bash
npm run build
node scripts/export.mjs --format png --time 9.5
```

## Visual QA

A visually broken animation can still compile successfully. Loop Animation therefore treats visual QA as part of the build loop.

Run:

```bash
npm run qa
```

Output:

```text
.output/qa/
├── contact-sheet.png
├── report.json
└── frames/
```

The contact sheet samples deterministic checkpoints across the timeline. Inspect it for:

- clipped labels;
- overlapping objects;
- dead or nearly identical scenes;
- weak focal hierarchy;
- low contrast;
- misleading geometry;
- poor vertical framing;
- abrupt state changes.

Landscape check:

```bash
npm run qa:landscape
```

Custom viewport and timestamps:

```bash
npm run build
node scripts/qa.mjs \
  --width 1440 \
  --height 1080 \
  --times 0,3.5,7,10,14,17.9
```

## Deterministic timeline

Every explainer exposes:

```ts
interface LoopAnimationController {
  duration: number;
  ready: boolean;
  qaTimes?: readonly number[];
  renderAt(time: number): void;
  play(): void;
  pause(): void;
  seek(time: number): void;
  destroy(): void;
}
```

And attaches it to:

```ts
window.__LOOP_ANIMATION__
```

The important rule is:

```ts
renderAt(8.0)
```

must produce the same conceptual frame whether the user watched normally, dragged backward, exported at 30 FPS, or exported at 60 FPS.

Avoid export-critical animation based on accumulated `deltaTime`, unseeded randomness, or wall-clock time.

## Create a new explainer manually

The easiest path is to use Codex, but you can also build one directly.

1. Create a storyboard:

```text
examples/my-topic/storyboard.md
```

2. Add your Three.js scene:

```text
src/examples/my-topic/
├── main.ts
└── style.css
```

3. Reuse the shared deterministic runtime:

```ts
import { DeterministicTimeline } from '../../runtime/animation';
```

4. Attach the controller:

```ts
const controller = new DeterministicTimeline({
  duration: 20,
  qaTimes: [0, 4, 8, 12, 16, 19.9],
  onRender(time) {
    // derive every visible state from `time`
    renderer.render(scene, camera);
  },
});

window.__LOOP_ANIMATION__ = controller;
```

5. Run the quality loop:

```bash
npm run typecheck
npm run build
npm run qa
npm run export:mp4
```

## Visual grammars

Loop Animation encourages Codex to choose a visual language that matches the concept:

| Grammar | Best for | Examples |
|---|---|---|
| Scale | relative size / distance | atom → cell → human → Earth |
| Inside | layers / internals | CPU, engine, body, architecture |
| Flow | moving information or matter | DNS, HTTP, blood, electricity |
| Compare | mechanism comparison | SSD vs HDD, lungs vs gills |
| Cause-effect | causal chains | greenhouse effect, feedback loops |
| Timeline | change over time | universe, evolution, history |
| Orbit / spatial | geometry in space | eclipse, seasons, tides |
| Simulation | parameter exploration | waves, probability, orbital tilt |

## Project structure

```text
loop-animation/
├── .agents/
│   └── skills/
│       └── loop-animation/
│           ├── SKILL.md
│           └── agents/openai.yaml
├── .github/workflows/
│   ├── ci.yml
│   └── pages.yml
├── examples/
│   └── eclipse/storyboard.md
├── scripts/
│   ├── export.mjs
│   ├── qa.mjs
│   └── install-skill.mjs
├── src/
│   ├── runtime/
│   │   └── animation.ts
│   └── examples/eclipse/
│       ├── main.ts
│       └── style.css
├── references/
├── index.html
├── vite.config.ts
└── package.json
```

## Design rules

**Prefer**

- one visual idea per scene;
- object continuity;
- spatial explanation;
- concise labels anchored to objects;
- meaningful transformations;
- restrained camera movement;
- responsive layouts.

**Avoid**

- generic glowing cards;
- decorative neon gradients;
- random particles with no teaching purpose;
- constant zooming;
- large text blocks;
- unexplained object pop-in/pop-out;
- tiny 3D text;
- frame-rate-dependent exports.

## Troubleshooting

### `ffmpeg was not found in PATH`

Install FFmpeg and confirm:

```bash
ffmpeg -version
```

Then reopen your terminal if necessary.

### Puppeteer / Chromium fails to launch

Run:

```bash
npm install
```

and ensure the environment allows Chromium to launch. Linux CI/container environments may require additional browser system libraries.

### Codex does not see `$loop-animation`

If you are inside this repository, make sure this file exists:

```text
.agents/skills/loop-animation/SKILL.md
```

For global installation:

```bash
npm run skill:install:force
```

Then restart Codex if the Skill list does not refresh.

### Video looks different from the HTML preview

Check for:

- unseeded `Math.random()`;
- animation driven by `deltaTime`;
- state mutated cumulatively between frames;
- asynchronous assets that are not ready before `ready = true`;
- layout that depends on a single aspect ratio.

## Roadmap

- [x] Codex repository Skill
- [x] deterministic Three.js timeline
- [x] interactive HTML playback
- [x] MP4 / GIF / PNG exporter
- [x] automatic visual-QA contact sheet
- [x] user-level Skill installer
- [x] GitHub Pages workflow
- [x] solar-eclipse example
- [ ] reusable network / scale / timeline starter templates
- [ ] subtitle tracks
- [ ] optional audio / TTS composition
- [ ] multi-example gallery
- [ ] automated visual regression comparisons

---

# 中文

## Loop Animation 是什么？

Loop Animation 是一个面向 **Codex + Three.js** 的开源科普动画 Skill。

你给 Codex 一个知识点，例如：

```text
为什么会发生日食？
DNS 是怎么找到服务器的？
CPU 缓存为什么能加速？
原子到底有多小？
四季为什么会变化？
```

Loop Animation 会引导 Codex 按一套固定工作流完成：

```text
知识点核查
   ↓
确定一个教学目标
   ↓
选择视觉语法
   ↓
先写分镜
   ↓
Three.js 场景
   ↓
确定性时间轴
   ↓
交互 HTML
   ↓
视觉 QA
   ↓
HTML / MP4 / GIF / PNG
```

项目最核心的理念是：

> **HTML 是源作品，视频和动图只是它的不同渲染结果。**

所以生成出来的不只是“视频”，还可以是一个能暂停、拖时间线、切视角、调参数的交互科普页面。

## 目前已经具备的能力

- Codex 可自动发现的 Repo Skill
- Three.js 交互动画
- 播放 / 暂停 / 时间轴拖动
- `renderAt(time)` 确定性逐帧渲染
- HTML 静态页面构建
- MP4 视频导出
- GIF 动图导出
- PNG 封面图导出
- 竖屏 / 横屏视觉 QA
- 自动抽取关键帧生成 Contact Sheet
- GitHub Pages 部署工作流
- 用户级 Skill 一键安装
- 日食科普 Demo

## 环境要求

需要：

- Node.js 22+
- npm
- FFmpeg
- 能正常运行 Puppeteer / Chromium 的电脑环境

确认版本：

```bash
node -v
npm -v
ffmpeg -version
```

## 第一次运行

```bash
git clone https://github.com/kevin-luo/loop-animation.git
cd loop-animation
npm install
npm run dev
```

终端会输出一个 Vite 本地地址，在浏览器打开即可看到默认的“为什么会发生日食”动画。

常用命令：

```bash
npm run dev              # 浏览器实时预览
npm run typecheck        # TypeScript 检查
npm run build            # 构建 HTML → dist/
npm run qa               # 竖屏视觉 QA
npm run qa:landscape     # 横屏视觉 QA
npm run export:mp4       # 导出 MP4
npm run export:gif       # 导出 GIF
npm run export:png       # 导出 PNG
```

## 在 Codex 里怎么用

### 方式一：直接在本仓库使用，推荐

先克隆：

```bash
git clone https://github.com/kevin-luo/loop-animation.git
cd loop-animation
npm install
```

仓库已经包含：

```text
.agents/skills/loop-animation/SKILL.md
```

从这个仓库里启动 Codex 后，可以显式调用：

```text
$loop-animation
```

然后直接描述你想做的内容：

```text
$loop-animation

做一个“为什么会有四季”的科普动画。

要求：
- 中文
- 45 秒
- 9:16 竖屏
- HTML 可以拖动时间轴
- 导出 MP4 和 GIF
- 必须通过地球公转和地轴倾角解释
- 不要做成 PPT 卡片动画
- 导出前先做视觉 QA
```

再比如程序员科普：

```text
$loop-animation

做一个 DNS 域名解析的交互动画。

从浏览器输入 example.com 开始，展示：
浏览器 → DNS Resolver → Root → TLD → Authoritative Server。

要求：
- 数据包要真正沿节点移动
- 每个阶段只保留一句短解释
- 可以暂停和拖动进度
- 16:9
- 最终给 HTML 和 MP4
```

### 方式二：安装到自己的 Codex Skill 目录

在仓库内执行：

```bash
npm run skill:install
```

它会自动复制到：

```text
$HOME/.agents/skills/loop-animation
```

之后你在其他项目里也可以调用：

```text
$loop-animation
```

如果已经安装过，需要覆盖：

```bash
npm run skill:install:force
```

如果 Codex 没有立即刷新 Skill，重启一次 Codex。

### 方式三：使用 `$skill-installer`

Codex 自带 `$skill-installer`。可以调用它，然后告诉它从这个 GitHub 仓库安装 `loop-animation` Skill。

## 推荐的提示词写法

不用写几百行提示词。

一个好的请求包含：

```text
主题
目标受众
时长
画幅
需要的输出格式
真正需要解释清楚的机制
```

例如：

```text
$loop-animation

主题：为什么人在水下不能直接呼吸？
受众：普通人
时长：35 秒
画幅：9:16
输出：HTML + MP4 + GIF

重点：
- 用肺和鱼鳃做可视化对比
- 展示氧气交换的过程
- 每个画面文字尽量少
- 导出前跑视觉 QA
```

## 导出 HTML

```bash
npm run build
```

结果：

```text
dist/
```

可以直接部署到静态网站、GitHub Pages、对象存储等环境。

## 导出 MP4

```bash
npm run export:mp4
```

默认：

```text
1080 × 1920
30 FPS
```

输出：

```text
.output/video.mp4
```

横屏 1080P 60FPS：

```bash
npm run build
node scripts/export.mjs \
  --format mp4 \
  --width 1920 \
  --height 1080 \
  --fps 60
```

## 导出 GIF

```bash
npm run export:gif
```

输出：

```text
.output/preview.gif
```

GIF 更适合 GitHub README 预览和轻量传播；正式视频建议使用 MP4。

## 导出封面 PNG

```bash
npm run export:png
```

输出：

```text
.output/poster.png
```

指定某一个时间点：

```bash
npm run build
node scripts/export.mjs --format png --time 9.5
```

## 视觉 QA 怎么用

代码能运行，不代表动画就好看。

所以 Loop Animation 把“抽帧检查”直接放进标准工作流。

```bash
npm run qa
```

会得到：

```text
.output/qa/
├── contact-sheet.png
├── report.json
└── frames/
```

`contact-sheet.png` 会把动画几个关键时间点放到一张大图里。

重点检查：

- 有没有元素遮挡
- 文字有没有被裁掉
- 竖屏构图是否拥挤
- 是否存在几秒钟画面几乎不动
- 标签是否太小
- 重点是否不明确
- 前后状态是否突然跳变
- 为了“好看”而做的几何是否会误导知识点

横屏：

```bash
npm run qa:landscape
```

指定自定义尺寸和检查时间：

```bash
npm run build
node scripts/qa.mjs \
  --width 1440 \
  --height 1080 \
  --times 0,3.5,7,10,14,17.9
```

## 为什么一定要 `renderAt(time)`？

普通网页动画经常这样写：

```text
上一帧位置 + deltaTime
↓
下一帧位置
```

这种方式实时播放没问题，但做视频导出时容易出现：

```text
机器快 → 一个结果
机器慢 → 另一个结果
30fps → 一个结果
60fps → 又一个结果
```

Loop Animation 要求：

```ts
renderAt(8.0)
```

无论从哪里跳到 8 秒，最终画面都应该一致。

因此：

```text
浏览器播放
拖动进度条
截图
GIF
30fps MP4
60fps MP4
```

全部使用同一份动画逻辑。

## 手动创建一个新的科普动画

虽然最推荐直接交给 Codex，但也可以自己开发。

先创建：

```text
examples/my-topic/storyboard.md
```

然后：

```text
src/examples/my-topic/
├── main.ts
└── style.css
```

复用：

```ts
import { DeterministicTimeline } from '../../runtime/animation';
```

核心：

```ts
const controller = new DeterministicTimeline({
  duration: 20,
  qaTimes: [0, 4, 8, 12, 16, 19.9],
  onRender(time) {
    // 所有画面状态都由 time 推导
    renderer.render(scene, camera);
  },
});

window.__LOOP_ANIMATION__ = controller;
```

完成后：

```bash
npm run typecheck
npm run build
npm run qa
npm run export:mp4
```

## 适合做什么类型的科普？

| 类型 | 适合内容 | 示例 |
|---|---|---|
| Scale 尺度 | 大小、距离、数量级 | 原子有多小、宇宙有多大 |
| Inside 内部 | 内部结构 | CPU、发动机、人体 |
| Flow 流动 | 信息/物质运动 | DNS、HTTP、血液、电流 |
| Compare 对比 | 两种机制对比 | SSD vs HDD、肺 vs 鱼鳃 |
| Cause-effect 因果 | 连锁关系 | 温室效应、反馈回路 |
| Timeline 时间线 | 随时间变化 | 宇宙、进化、历史 |
| Spatial 空间 | 几何和位置关系 | 日食、四季、潮汐 |
| Simulation 模拟 | 参数变化 | 波、概率、轨道倾角 |

## 设计原则

推荐：

- 一幕只讲一个核心知识点
- 尽量保留对象连续性
- 用空间位置解释关系
- 标签跟随被解释对象
- 动效承担解释作用
- 镜头移动克制
- 同时兼顾横屏和竖屏

避免：

- 满屏发光卡片
- 无意义渐变
- 无意义粒子
- 镜头一直 Zoom
- 大段文字
- 每句话都做弹出字幕
- 元素没有原因地突然出现/消失
- 依赖帧率的动画结果

## 常见问题

### 提示 `FFmpeg was not found in PATH`

先确认：

```bash
ffmpeg -version
```

没有的话安装 FFmpeg，安装后重新打开终端。

### Puppeteer / Chromium 启动失败

先重新：

```bash
npm install
```

Linux / Docker 环境还可能缺 Chromium 所需的系统库。

### Codex 看不到 `$loop-animation`

仓库内使用时确认：

```text
.agents/skills/loop-animation/SKILL.md
```

存在。

用户级安装：

```bash
npm run skill:install:force
```

仍没出现就重启 Codex。

### HTML 正常，但导出的视频画面不一样

重点排查：

- `Math.random()` 有没有固定 seed
- 是否使用累计 `deltaTime`
- 是否每渲染一帧都在修改上一次状态
- 异步资源是否还没加载完成就设置了 `ready`
- UI 是否只适配了一个尺寸

## 下一步

目前 V0.2 已经完成核心闭环。下一阶段重点：

- Network / Scale / Timeline 三类高质量模板
- 更多可直接看的 Demo
- 字幕轨道
- 可选 TTS / 音频合成
- Gallery 示例站
- 自动视觉回归比较

## Contributing / 参与贡献

欢迎贡献：

- 新的科普 Demo
- 可复用视觉模板
- Three.js 渲染优化
- 导出器改进
- QA 工具
- Skill 工作流优化
- 中英文文档修正

See [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## License

MIT
