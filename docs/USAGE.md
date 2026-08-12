# Loop Animation — Usage Guide / 使用说明

This guide is for people who want to **use** Loop Animation, not learn its internals first.

这份文档面向“想直接做一个动画解释”的用户，不要求先理解 Three.js、Shader 或确定性时间轴。

---

## 中文：60 秒开始

### 1. 克隆仓库

```bash
git clone https://github.com/kevin-luo/loop-animation.git
cd loop-animation
npm install
```

然后用 Codex 打开这个仓库。

仓库已经包含：

```text
.agents/skills/loop-animation/SKILL.md
```

所以不需要把一大段规则手动粘给 Codex。

### 2. 最短用法

直接输入：

```text
$loop-animation

解释为什么飞机能飞起来。
```

如果你没有指定受众、时长、比例和输出格式，Skill 会采用合理默认值继续完成，不需要每一步都问你。

默认大致是：

```text
受众：普通用户
语言：跟随你的语言
时长：30 秒
比例：16:9
章节：5–7 个
交互：播放 / 暂停 / 拖动时间轴 / 章节跳转 / 深入解释
主要输出：交互 HTML
QA：严格连续性检查
```

### 3. 推荐提示词

需要更稳定的结果时，直接使用这份：

```text
$loop-animation

请制作一个关于「为什么飞机能飞起来？」的交互式科普动画。

受众：普通用户
语言：中文
时长：30 秒
比例：16:9
输出：HTML + MP4 + SRT/VTT

执行要求：
1. 先用一句话定义学习目标，再拆成 5–7 个章节。
2. 先决定最适合的视觉语法与美术方案；复杂自然场景允许 shader + 3D + raster/img2 混合，不要为了方便全部画成 SVG。
3. 全程使用一个连续世界 S(t)。章节只负责讲解和导航，禁止按 step 硬切相机、物体或整套场景。
4. 关键对象保持连续；镜头、粒子、材质和可见性都由绝对 time 推导，同一 timestamp 必须得到同一画面。
5. 画面占主导，文字只解释当前机制；说明、步骤和控件不要遮挡主体。
6. 提供播放/暂停、可拖时间轴、章节跳转、深入解释和必要的语言切换。
7. 完成后执行 typecheck、build、strict continuity QA，并检查桌面端与移动端构图。
8. 导出请求格式，并在完成时列出预览入口、生成文件位置和使用命令。

如果我的描述缺少非关键参数，请直接采用合理默认值继续，不要反复提问。
```

在线 Gallery 里也有一个 **Prompt Builder**，填主题、受众、时长、比例和输出格式即可自动生成这类提示词。

### 4. 怎么看结果

开发模式：

```bash
npm run dev
```

常用页面：

```text
/                         Gallery
/?demo=water-v2           水循环旗舰
/?demo=eclipse            日食旗舰
/?demo=dns                DNS 示例
/?demo=binary             二分查找示例
```

播放器里可以：

- 播放 / 暂停；
- 拖动时间轴；
- 点击章节直接跳转；
- 打开“深入解释”；
- 切换语言；
- 进入全屏。

首次打开旗舰播放器时，会显示一条简短操作提示。

### 5. 修改以后怎么检查

基础检查：

```bash
npm run typecheck
npm run build
```

旗舰连续性检查：

```bash
npm run qa:continuity
```

只检查 Water v2：

```bash
npm run qa:water-v2:strict
```

QA 会在章节边界自动检查：

```text
t - 1 frame
t
t + 1 frame
```

并输出 contact sheet、boundary continuity 图片和 report.json。

### 6. 怎么导出

Water v2：

```bash
npm run export:water-v2:mp4
npm run export:water-v2:gif
npm run export:water-v2:png
```

字幕 / 解说：

```bash
npm run story:water-v2:zh
npm run story:water-v2:en
```

输出通常位于：

```text
.output/
```

视频 / GIF 导出需要 FFmpeg。

### 7. 常见需求怎么说

#### 技术原理

```text
$loop-animation

解释 TCP 三次握手。
受众：刚学网络的开发者
时长：30 秒
比例：16:9
输出：HTML + MP4 + SRT

让 Client 和 Server 始终保持为同一组对象，SYN / SYN-ACK / ACK 只作为章节，不要切换成三张独立页面。
```

#### 科普

```text
$loop-animation

解释火山为什么会喷发。
受众：普通用户
时长：40 秒
比例：9:16
输出：HTML + MP4

希望能看到地表、岩层、岩浆房和压力变化。复杂自然环境允许混合 raster/img2 与 Three.js 动画。
```

#### 算法

```text
$loop-animation

解释快速排序。
受众：初学者
时长：35 秒
比例：16:9
输出：HTML + GIF

重点让 pivot、左右分区和数组状态保持连续，不要每一步重新画一套数组。
```

### 8. 如果效果不够好，怎么继续让 Codex 改

不要只说“优化一下”。优先指出具体问题：

```text
继续优化这一版：
- 主体被说明文字挡住了；
- 第 2 → 第 3 章镜头速度突然变化；
- 山体太像基础几何，没有真实层次；
- 手机端章节标题太大；
- 降雨开始得比旁白早；
- 需要把画面层次做得更像纪录片，不要像 SVG 信息图。

修改后重新跑 strict continuity QA，并给我新的预览入口和改动摘要。
```

---

## English: start in 60 seconds

### 1. Clone the repository

```bash
git clone https://github.com/kevin-luo/loop-animation.git
cd loop-animation
npm install
```

Open the repository in Codex. The repo-scoped Skill is already included at:

```text
.agents/skills/loop-animation/SKILL.md
```

### 2. Minimal request

```text
$loop-animation

Explain why airplanes can fly.
```

Missing non-critical details use sensible defaults automatically.

### 3. More controlled request

```text
$loop-animation

Create an interactive visual explainer about “Why can airplanes fly?”.

Audience: general
Language: English
Duration: 30 seconds
Aspect ratio: 16:9
Outputs: HTML + MP4 + SRT/VTT

Choose the visual grammar and art direction before coding. Use one continuous world S(t), keep important objects continuous, derive visual state from absolute time, keep UI away from the subject, and run strict continuity QA before export.

If non-critical details are missing, choose sensible defaults and continue instead of repeatedly asking questions.
```

### 4. Preview and QA

```bash
npm run dev
npm run typecheck
npm run build
npm run qa:continuity
```

### 5. Export

```bash
npm run export:water-v2:mp4
npm run export:water-v2:gif
npm run export:water-v2:png
npm run story:water-v2:en
```

Video/GIF export requires FFmpeg.

---

## Troubleshooting

### Codex does not recognize `$loop-animation`

Confirm you opened Codex inside the repository and that this file exists:

```text
.agents/skills/loop-animation/SKILL.md
```

You can also install the Skill globally:

```bash
npm run skill:install
```

### MP4 or GIF export fails

Check FFmpeg:

```bash
ffmpeg -version
```

### Browser export / QA fails

The export and QA scripts use Puppeteer/Chromium. Run:

```bash
npm install
npm run build
```

and inspect the reported Chromium/Puppeteer error.

### The animation works but still looks like a demo

Ask Codex to audit four things separately:

```text
visual hierarchy
art direction / materials
camera continuity
UI obstruction / mobile layout
```

For rich natural scenes, explicitly allow a hybrid raster/img2 + shader + Three.js treatment instead of forcing everything into primitive geometry.
