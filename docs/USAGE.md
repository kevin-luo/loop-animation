# Loop Animation — Usage Guide / 使用说明

这份文档优先面向**不会 Git、npm、Three.js 的普通用户**。

最短路径只有一句话：

> **复制提示词 → 打开 Codex → 粘贴 → 看结果。**

---

## 中文：小白最简单用法

### 第 1 步：复制提示词

你不需要先下载仓库，也不需要打开终端。

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

请直接采用合理默认值完成。

完成时不要只给技术日志，请直接告诉我：
1. 预览在哪里；
2. 生成了哪些文件；
3. 我下一步应该点什么或打开什么。

如果当前环境确实无法访问 GitHub，只告诉我需要在界面上完成的一个最简单操作，不要给我一串终端命令。
```

### 第 2 步：打开 Codex，粘贴

打开 Codex，把整段提示词贴进去发送即可。

你不需要理解：

```text
git clone
npm install
Three.js
Shader
Puppeteer
FFmpeg
Story Manifest
S(t)
```

这些属于实现细节。

### 第 3 步：看结果，用人话继续改

如果成品不满意，直接描述你看到的问题。

例如：

```text
继续优化这一版：
- 第二段太快；
- 文字挡住动画主体；
- 画面太暗；
- 山体太像 demo；
- 手机端标题太大；
- 第 3 段到第 4 段镜头有点跳。

修改完以后重新检查，并给我新的预览入口。
```

不需要自己判断该改 CSS、Three.js、shader 还是时间轴。

---

## 在线 Prompt Builder

如果你只知道“想做什么”，但不会写完整提示词，可以直接打开：

**https://kevin-luo.github.io/loop-animation/#prompt-builder**

只需要选择：

- 主题；
- 受众；
- 时长；
- 画面比例；
- 输出格式。

然后点击**复制完整提示词**，粘贴给 Codex。

生成的提示词已经包含：

- Loop Animation 项目地址；
- 自动获取项目的要求；
- 连续动画规则；
- 视觉质量要求；
- UI 要求；
- QA 要求；
- 最终交付说明。

---

## 常见提示词示例

### 科普：火山为什么会喷发

```text
请使用 Loop Animation：
https://github.com/kevin-luo/loop-animation

如果当前工作区没有项目，请你自行获取并读取 Skill 后继续，不要让我执行 git/npm 命令。

请制作“火山为什么会喷发”的交互式科普动画。

受众：普通用户
语言：中文
时长：40 秒
比例：9:16
输出：HTML + MP4

重点展示地表、岩层、岩浆房、压力累积和喷发过程。
复杂自然场景允许 raster/img2 + shader + Three.js 混合。
画面要有纪录片感，说明文字不要挡住主体。
最后给我预览入口和导出结果。
```

### 技术：TCP 三次握手

```text
请使用 Loop Animation：
https://github.com/kevin-luo/loop-animation

请制作“TCP 三次握手”的交互式动画解释。

受众：刚学网络的开发者
语言：中文
时长：30 秒
比例：16:9
输出：HTML + MP4 + SRT

让 Client 和 Server 始终保持为同一组对象，SYN / SYN-ACK / ACK 只是讲解章节，不要做成三张独立页面。
最后跑严格连续性 QA，并给我预览入口。
```

### 算法：快速排序

```text
请使用 Loop Animation：
https://github.com/kevin-luo/loop-animation

请制作“快速排序”的交互式动画解释。

受众：初学者
语言：中文
时长：35 秒
比例：16:9
输出：HTML + GIF

重点让 pivot、左右分区和数组状态保持连续，不要每一步重新画一套数组。
最后给我可交互预览和 GIF。
```

---

## 如果 Codex 说“我访问不了 GitHub”怎么办

普通用户不用立刻去学 Git。

直接回复 Codex：

```text
请不要给我终端命令。
只告诉我现在需要在界面上完成的一个最简单操作，完成后你继续处理剩下的步骤。
```

Codex 的具体运行环境可能不同。有些环境可以直接访问 GitHub，有些环境需要先选择一个文件夹或 Git 仓库作为工作位置。

你的目标始终是把技术准备交给 Codex，只保留必要的界面操作。

---

## 成品播放器怎么用

旗舰播放器支持：

- 播放 / 暂停；
- 拖动时间轴；
- 点击章节跳转；
- 上一章 / 下一章；
- “深入解释”；
- 中英文切换；
- 全屏；
- 键盘时间轴操作。

首次进入时会出现一条简短操作提示。

---

# English: beginner path

Normal users do not need Git, npm or Three.js knowledge.

### 1. Copy

```text
Use the Loop Animation open-source project to create an interactive visual explainer:
https://github.com/kevin-luo/loop-animation

If the project is not available in the current workspace, fetch it when GitHub access is available, read .agents/skills/loop-animation/SKILL.md, and continue.

Do not stop at setup instructions and do not ask me to run git, npm or terminal commands myself. Handle project setup, dependencies, running, QA and export for me.

Topic: Why can airplanes fly?
Audience: general
Language: English
Duration: 30 seconds
Aspect ratio: 16:9
Outputs: interactive HTML + MP4 + SRT

Choose sensible defaults and finish the task.
At the end, tell me where to preview it, which files were generated, and what I should open next.

If the environment truly cannot access GitHub, tell me only the single simplest UI action I need to take next instead of giving me terminal commands.
```

### 2. Paste into Codex

Send the whole prompt.

### 3. Refine in plain language

```text
Keep improving this version:
- scene two is too fast;
- text covers the main subject;
- the visuals still feel like a demo;
- make the camera transition smoother;
- the mobile title is too large.

Recheck it and give me the new preview entry point.
```

---

# Developer appendix / 开发者附录

下面才是开发者需要看的内容。普通用户可以完全忽略。

## Clone and run locally

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

## Quality checks

```bash
npm run typecheck
npm run build
npm run qa:continuity
npm run ui:smoke
```

## Export

```bash
npm run export:water-v2:mp4
npm run export:water-v2:gif
npm run export:water-v2:png
npm run story:water-v2:zh
npm run story:water-v2:en
```

视频 / GIF 导出需要 FFmpeg。

## Install the Skill globally

```bash
npm run skill:install
```

安装到：

```text
$HOME/.agents/skills/loop-animation
```

这个步骤**不是普通用户复制提示词使用项目的前置条件**。
