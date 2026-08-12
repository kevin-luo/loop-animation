# Loop Animation

<p align="center">
  <strong>Copy a prompt. Let Codex turn a concept into an interactive visual explainer.</strong><br/>
  复制一段提示词，让 Codex 把知识点做成可交互动画。
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

> **You choose the idea. Codex handles the production workflow.**  
> **你负责想讲什么，Codex 负责把它做出来。**

<p align="center">
  <a href="https://kevin-luo.github.io/loop-animation/?demo=water-v2">
    <img src="docs/media/water-v2.gif" alt="Loop Animation Water v2 flagship demo" width="860" />
  </a>
</p>

## 最简单的用法：不用会 Git，也不用会 npm

普通用户只需要做三件事：

1. **复制下面的提示词**；
2. **打开 Codex，粘贴并发送**；
3. **看预览，哪里不满意就继续用人话说。**

直接复制：

```text
请使用 Loop Animation 开源项目帮我制作一个交互式科普动画：
https://github.com/kevin-luo/loop-animation

如果当前工作区还没有这个项目，请在可以访问 GitHub 时自行获取它，并读取 .agents/skills/loop-animation/SKILL.md 后继续执行。

不要停在“请先安装/克隆”的说明，也不要让我自己执行 git、npm 或终端命令；项目准备、依赖安装、运行、QA 和导出都请你处理。

主题：为什么飞机能飞起来？
受众：普通用户
语言：中文
时长：30 秒
比例：16:9
输出：交互 HTML + MP4 + SRT

请直接采用合理默认值完成。完成时不要只给技术日志，请直接告诉我：预览在哪里、生成了哪些文件、下一步怎么查看。

如果当前环境确实无法访问 GitHub，只告诉我需要在界面上完成的一个最简单操作，不要给我一串终端命令。
```

也可以直接使用在线 **Prompt Builder**，只填主题、受众、时长和比例：

**https://kevin-luo.github.io/loop-animation/#prompt-builder**

### 完成以后怎么继续改

不用学任何专业词，直接说问题：

```text
继续优化这一版：
- 第二段太快；
- 文字挡住主体；
- 画面太像 demo；
- 镜头变化再平滑一点；
- 手机端标题太大。

改完以后重新检查，并给我新的预览入口。
```

## English: easiest way to use it

You do not need Git, npm or Three.js knowledge for the normal path.

1. Copy the prompt.
2. Open Codex and paste it.
3. Review the preview and ask for changes in plain language.

```text
Use the Loop Animation open-source project to create an interactive visual explainer:
https://github.com/kevin-luo/loop-animation

If this project is not available in the current workspace, fetch it when GitHub access is available, read .agents/skills/loop-animation/SKILL.md, and continue.

Do not stop at setup instructions and do not ask me to run git, npm or terminal commands myself. Handle project setup, dependencies, running, QA and export for me.

Topic: Why can airplanes fly?
Audience: general
Language: English
Duration: 30 seconds
Aspect ratio: 16:9
Outputs: interactive HTML + MP4 + SRT

Choose sensible defaults and finish the task. At the end, tell me where to preview it, which files were generated, and what I should open next.

If the environment truly cannot access GitHub, tell me only the single simplest UI action I need to take next instead of giving me terminal commands.
```

## What Loop Animation does / 它会做什么

Given a topic, the production workflow is designed to:

- define one clear learning goal;
- structure the explanation into 5–7 chapters;
- choose a topic-appropriate visual grammar and art direction;
- build one continuous deterministic world `S(t)`;
- keep camera, objects, particles and materials continuous across chapter boundaries;
- provide play/pause, draggable timeline, chapter navigation, deeper explanation, language switching and fullscreen;
- run strict continuity QA;
- export HTML / MP4 / GIF / PNG / SRT / VTT / narration data from the same source.

The user should not need to understand shaders, Three.js APIs, `S(t)`, Story Manifest, Puppeteer or FFmpeg before using the project.

## Live examples / 在线实例

| Example | Status | Visual grammar | Live |
|---|---|---|---|
| **Water Cycle v2 / 水循环 v2** | **Flagship · continuity gated** | Hybrid · Earth system · Flow | [Open](https://kevin-luo.github.io/loop-animation/?demo=water-v2) |
| Solar Eclipse / 日食 | **Flagship · continuity gated** | Orbit · Spatial | [Open](https://kevin-luo.github.io/loop-animation/?demo=eclipse) |
| DNS resolution / DNS 解析 | Earlier experiment | Network · Flow | [Open](https://kevin-luo.github.io/loop-animation/?demo=dns) |
| Binary search / 二分查找 | Earlier experiment | Algorithm · Process | [Open](https://kevin-luo.github.io/loop-animation/?demo=binary) |

## Core idea / 核心原则

> **The chapter changes. The world does not reset.**

An explainer should feel like one world evolving through time, not a stack of animated slides.

```text
Continuous world S(t)
        +
Story Manifest
        +
Hybrid visual layers
        +
Lightweight interaction UI
        ↓
HTML / MP4 / GIF / PNG / SRT / VTT / narration
```

For a chapter boundary `b`:

```text
S(b - ε) ≈ S(b + ε)
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

## Hybrid Visual Pipeline

Flagship scenes can combine:

```text
Raster / generated art / textures
             +
Three.js / shaders / 3D / particles
             +
Story Manifest
             +
HTML/CSS interaction UI
```

Use each layer for what it does best:

- **Three.js / shaders** — motion, depth, camera, geometry, particles and interaction;
- **raster / img2 assets** — detailed environments, anatomy, surfaces and editorial illustration;
- **HTML/CSS** — concise explanation, controls and accessibility;
- **Story Manifest** — narration, subtitles and future TTS.

Pure SVG / primitive geometry is useful for algorithms and mechanism diagrams. Rich natural scenes should not look like an SVG demo merely because SVG is easy to generate.

## For developers / 开发者方式（可选）

Everything below is optional for normal users.

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

Repo-scoped Skill:

```text
.agents/skills/loop-animation/SKILL.md
```

Developer quality checks:

```bash
npm run typecheck
npm run build
npm run qa:continuity
npm run ui:smoke
```

Water v2 exports:

```bash
npm run export:water-v2:mp4
npm run export:water-v2:gif
npm run export:water-v2:png
npm run story:water-v2:zh
npm run story:water-v2:en
```

The CI quality gate also runs a Puppeteer UI smoke test for the Gallery Prompt Builder and flagship StagePlayer interaction.

## Install the Skill globally / 全局安装 Skill（开发者可选）

```bash
npm run skill:install
```

Installed to:

```text
$HOME/.agents/skills/loop-animation
```

This is **not required** for the copy-paste beginner path above.

## Project structure

```text
loop-animation/
├── .agents/skills/loop-animation/
│   ├── SKILL.md
│   └── agents/openai.yaml
├── .github/workflows/
├── docs/
│   ├── USAGE.md
│   └── media/
├── scripts/
│   ├── export.mjs
│   ├── export-story.mjs
│   ├── qa.mjs
│   ├── ui-smoke.mjs
│   └── install-skill.mjs
├── src/
│   ├── gallery/
│   ├── runtime/
│   └── examples/
│       ├── water-v2/
│       ├── eclipse/
│       ├── water/
│       ├── dns/
│       └── binary/
└── package.json
```

## Contributing

Before a PR that changes a flagship scene or shared runtime:

```bash
npm run typecheck
npm run build
npm run qa:continuity
npm run ui:smoke
npm run story:all
```

## License

MIT
