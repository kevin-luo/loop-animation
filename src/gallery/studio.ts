import { getLanguage, persistLanguage, type AppLanguage, withLanguage } from '../runtime/i18n';
import './style.css';
import './studio-enhancements.css';
import './gallery-preview.css';

const root = document.querySelector<HTMLDivElement>('#app')!;
if (!root) throw new Error('Missing #app');

const REPO_URL = 'https://github.com/kevin-luo/loop-animation';
const CODEX_URL = 'https://chatgpt.com/codex/';
let language: AppLanguage = getLanguage();

type AudienceKey = 'general' | 'student' | 'developer' | 'expert';

type Demo = {
  id: 'water-v2' | 'eclipse' | 'dns' | 'binary';
  grammar: string;
  flagship: boolean;
  title: { zh: string; en: string };
  description: { zh: string; en: string };
  poster: string;
  preview?: string;
};

const demos: Demo[] = [
  {
    id: 'water-v2', grammar: 'HYBRID / EARTH SYSTEM', flagship: true,
    title: { zh: '一滴水如何走完整个水循环？', en: 'How does one drop travel through the water cycle?' },
    description: { zh: '视觉旗舰：shader 天空与海面、程序化地形、云层、粒子水汽与降雨，以及一条贯穿全程的水滴路径。', en: 'Visual flagship: shader sky and ocean, sculpted terrain, clouds, vapor/rain particles, and one continuous hero-drop path.' },
    poster: 'water-v2-poster.webp', preview: 'water-v2-preview.mp4',
  },
  {
    id: 'eclipse', grammar: 'ORBIT / SPATIAL', flagship: true,
    title: { zh: '日食为什么不会每个月都发生？', en: 'Why does a solar eclipse not happen every month?' },
    description: { zh: '让月球沿同一条轨道连续运动，用倾角、交点、影区和观察位置解释真正的三维几何。', en: 'Keep the Moon on one continuous orbit while tilt, nodes, shadow regions and observer position reveal the 3D geometry.' },
    poster: 'eclipse-poster.webp', preview: 'eclipse-preview.mp4',
  },
  {
    id: 'dns', grammar: 'FLOW / NETWORK', flagship: false,
    title: { zh: 'DNS 是怎么找到网站的？', en: 'How does DNS find a website?' },
    description: { zh: '网络流实验：让一次域名查询沿 Resolver、Root、TLD 和权威 DNS 跑一遍。', en: 'A network-flow experiment following a query through resolver, root, TLD and authoritative DNS.' },
    poster: 'dns-poster.webp',
  },
  {
    id: 'binary', grammar: 'ALGORITHM / PROCESS', flagship: false,
    title: { zh: '为什么二分查找这么快？', en: 'Why is binary search so fast?' },
    description: { zh: '算法实验：把每次比较淘汰一半候选的过程直接可视化。', en: 'An algorithm experiment visualizing how each comparison removes half the search space.' },
    poster: 'binary-poster.webp',
  },
];

const copy = {
  zh: {
    navDocs: '怎么使用', navPrompt: '生成提示词',
    kicker: 'COPY · PASTE · LET CODEX BUILD',
    titleA: '复制一段提示词，', titleB: '交给 Codex 做成动画。',
    lead: '不会 Git、npm、Three.js 都没关系。你只需要复制提示词并粘贴给 Codex；项目获取、依赖、动画实现、QA 和导出都交给 Codex 处理。',
    primary: '复制提示词给 Codex', openCodex: '打开 Codex', secondary: '先看效果',
    commandLabel: '直接复制这一段', copy: '复制', copied: '已复制，可以去 Codex 粘贴了', copyFailed: '复制失败，请手动复制',
    heroPrompt: `请使用 Loop Animation 开源项目帮我制作一个交互式科普动画：\n${REPO_URL}\n\n如果当前工作区还没有这个项目，请在可以访问 GitHub 时自行获取它，并读取 .agents/skills/loop-animation/SKILL.md 后继续执行。不要停在“请先安装/克隆”的说明，也不要让我自己执行 git、npm 或终端命令；这些准备工作请你完成。\n\n主题：为什么会发生日食？\n受众：普通用户\n语言：中文\n时长：30 秒\n比例：16:9\n输出：交互 HTML + MP4 + SRT\n\n请直接采用合理默认值完成，最后给我预览入口和导出结果。`,
    howKicker: 'HOW TO USE', howTitle: '小白就做三件事：复制、粘贴、看结果。',
    howDesc: '首页不要求你先学任何开发命令。只有想自己改源码的开发者，才需要看页面最下面的“开发者方式”。',
    steps: [
      { n: '01', title: '复制提示词', body: '点击上面的“复制提示词给 Codex”，或者用下面的 Prompt Builder 填好主题后再复制。', code: '① 点击「复制提示词给 Codex」' },
      { n: '02', title: '打开 Codex，直接粘贴', body: '把整段提示词粘贴进去并发送。能访问 GitHub 时，Codex 会自己获取 Loop Animation 并完成准备工作。', code: '② 粘贴 → 发送' },
      { n: '03', title: '看预览，用人话继续改', body: 'Codex 完成后会告诉你预览入口。哪里不满意就直接说“第二段太快”“文字挡住主体”“画面再高级一点”。', code: '③ 继续优化：第二段太快，文字挡住主体。' },
    ],
    fallback: '如果你的 Codex 当前环境不能访问 GitHub，让它只告诉你需要点哪一步，不要让它甩一堆终端命令给你。',
    builderKicker: 'PROMPT BUILDER', builderTitle: '只填你关心的 4 个选项，剩下让 Codex 决定。',
    builderDesc: '生成出来的是“自启动提示词”：它会带上项目地址，并要求 Codex 自己处理项目准备、实现、检查和导出。',
    topicLabel: '要解释什么', topicPlaceholder: '例如：为什么飞机能飞起来？', audienceLabel: '受众', durationLabel: '时长', aspectLabel: '画面比例', outputsLabel: '需要输出',
    audience: { general: '普通用户', student: '学生 / 初学者', developer: '开发者', expert: '专业用户' } as Record<AudienceKey, string>,
    seconds: '秒', generateCopy: '复制完整提示词', useSimple: '恢复示例',
    examplesKicker: 'LIVE EXAMPLES', examplesTitle: '先看成品，再决定你想做什么。',
    examplesDesc: '首页现在只加载轻量预览图，不会偷偷启动多个 WebGL。旗舰实例点击“播放预览”才下载短视频；真正的 Three.js 只在打开完整实例后运行。',
    previewBadge: 'REAL FRAME', playPreview: '播放预览', stopPreview: '停止预览', open: '打开交互实例',
    pipelineKicker: 'WHAT CODEX DOES', pipelineTitle: '你负责描述主题，技术流程由 Codex 接管。', pipelineLabels: ['交互页面', '视频', '动图', '字幕/旁白'],
    quickKicker: 'FOR DEVELOPERS · OPTIONAL', quickTitle: '下面这些命令，普通用户可以完全忽略。',
    quickDesc: '只有你想自己开发、调试或贡献源码时才需要这些命令。日常使用直接复制提示词给 Codex 即可。',
    footer: '你负责想讲什么，Codex 负责把它做出来。', languageLabel: 'EN', proofs: ['个 QA 旗舰实例', '类输出目标', '条确定性时间轴'],
  },
  en: {
    navDocs: 'How to use', navPrompt: 'Prompt builder',
    kicker: 'COPY · PASTE · LET CODEX BUILD',
    titleA: 'Copy one prompt.', titleB: 'Let Codex turn it into an animation.',
    lead: 'No Git, npm or Three.js knowledge required. Copy the prompt and paste it into Codex; let Codex handle project setup, implementation, QA and export.',
    primary: 'Copy prompt for Codex', openCodex: 'Open Codex', secondary: 'See the demos',
    commandLabel: 'Copy this directly', copy: 'Copy', copied: 'Copied — paste it into Codex', copyFailed: 'Copy failed — select the text manually',
    heroPrompt: `Use the Loop Animation open-source project to create an interactive visual explainer:\n${REPO_URL}\n\nIf this project is not available in the current workspace, fetch it when GitHub access is available, read .agents/skills/loop-animation/SKILL.md, and continue. Do not stop at setup instructions and do not ask me to run git, npm or terminal commands myself; handle the setup work for me.\n\nTopic: Why do solar eclipses happen?\nAudience: general\nLanguage: English\nDuration: 30 seconds\nAspect ratio: 16:9\nOutputs: interactive HTML + MP4 + SRT\n\nChoose sensible defaults, finish the task, and give me the preview entry point and exported results.`,
    howKicker: 'HOW TO USE', howTitle: 'Three beginner steps: copy, paste, review.',
    howDesc: 'The landing page does not assume command-line knowledge. Git/npm instructions live only in the optional developer section below.',
    steps: [
      { n: '01', title: 'Copy the prompt', body: 'Click “Copy prompt for Codex” above, or use the Prompt Builder below to customize the topic first.', code: '① Click “Copy prompt for Codex”' },
      { n: '02', title: 'Open Codex and paste it', body: 'Paste the whole prompt and send it. When GitHub access is available, Codex should fetch Loop Animation and handle setup.', code: '② Paste → Send' },
      { n: '03', title: 'Review and refine in plain language', body: 'Codex should return a preview. Ask naturally: “scene two is too fast”, “the text covers the subject”, or “make the visuals more polished”.', code: '③ Refine: scene two is too fast; keep text off the subject.' },
    ],
    fallback: 'If the current Codex environment cannot access GitHub, ask it to give you only the single UI action required next instead of terminal commands.',
    builderKicker: 'PROMPT BUILDER', builderTitle: 'Pick four things you care about. Let Codex decide the rest.',
    builderDesc: 'The generated prompt bootstraps itself: it includes the repository URL and tells Codex to handle setup, implementation, QA and export.',
    topicLabel: 'What should it explain?', topicPlaceholder: 'e.g. Why can airplanes fly?', audienceLabel: 'Audience', durationLabel: 'Duration', aspectLabel: 'Aspect ratio', outputsLabel: 'Outputs',
    audience: { general: 'General audience', student: 'Student / beginner', developer: 'Developer', expert: 'Professional / expert' } as Record<AudienceKey, string>,
    seconds: 'sec', generateCopy: 'Copy full prompt', useSimple: 'Reset example',
    examplesKicker: 'LIVE EXAMPLES', examplesTitle: 'See the output, then decide what you want to explain.',
    examplesDesc: 'The Gallery now loads lightweight posters only—no hidden WebGL boot. Flagship motion previews download only after a click; full Three.js starts only when you open the interactive demo.',
    previewBadge: 'REAL FRAME', playPreview: 'Play preview', stopPreview: 'Stop preview', open: 'Open interactive',
    pipelineKicker: 'WHAT CODEX DOES', pipelineTitle: 'You describe the topic. Codex handles the production workflow.', pipelineLabels: ['interactive', 'video', 'preview', 'captions/data'],
    quickKicker: 'FOR DEVELOPERS · OPTIONAL', quickTitle: 'Most users can ignore every command below.',
    quickDesc: 'Use these only when you want to develop, debug or contribute yourself. Normal usage is copy → paste into Codex.',
    footer: 'You choose the idea. Codex builds the explainer.', languageLabel: '中文', proofs: ['QA-gated flagships', 'output targets', 'deterministic timeline'],
  },
} as const;

function text(value: { zh: string; en: string }) { return value[language]; }

function demoUrl(id: Demo['id']) {
  const url = new URL(location.href);
  url.search = '';
  url.searchParams.set('demo', id);
  withLanguage(url, language);
  return url.toString();
}

function mediaUrl(file: string) {
  return new URL(`./docs/media/${file}`, location.href).toString();
}

function render() {
  const t = copy[language];
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  root.innerHTML = `
    <main class="gallery-shell">
      <nav class="gallery-nav">
        <a class="brand" href="./" aria-label="Loop Animation"><span class="brand-mark"><i></i></span><span>Loop Animation</span></a>
        <div class="nav-links">
          <a href="#howto">${t.navDocs}</a>
          <a href="#prompt-builder">${t.navPrompt}</a>
          <a href="${REPO_URL}" target="_blank" rel="noreferrer">GitHub</a>
          <button class="language-switch" id="gallery-language" type="button">${t.languageLabel}</button>
        </div>
      </nav>

      <section class="hero">
        <div class="hero-glow hero-glow--one"></div><div class="hero-glow hero-glow--two"></div>
        <div class="hero-copy">
          <div class="kicker">${t.kicker}</div>
          <h1>${t.titleA}<br/><span>${t.titleB}</span></h1>
          <p class="hero-lead">${t.lead}</p>
          <div class="hero-actions"><button class="button button--primary" id="hero-copy-main" type="button">${t.primary}</button><a class="button" href="${CODEX_URL}" target="_blank" rel="noreferrer">${t.openCodex}</a><a class="button" href="#examples">${t.secondary}</a></div>
          <div class="hero-proof"><div><b>2</b><span>${t.proofs[0]}</span></div><div><b>6</b><span>${t.proofs[1]}</span></div><div><b>1</b><span>${t.proofs[2]}</span></div></div>
        </div>
        <div class="hero-stage">
          <div class="orb orb--a"></div><div class="orb orb--b"></div><div class="orb orb--c"></div><div class="orbit-line orbit-line--a"></div><div class="orbit-line orbit-line--b"></div>
          <div class="hero-terminal"><div class="terminal-top"><span></span><span></span><span></span><b>Codex</b><button class="terminal-copy" id="hero-copy" type="button">${t.copy}</button></div><div class="terminal-label">${t.commandLabel}</div><pre><code id="hero-prompt"></code></pre></div>
        </div>
      </section>

      <section class="howto" id="howto">
        <div class="section-heading"><div><span class="section-kicker">${t.howKicker}</span><h2>${t.howTitle}</h2></div><p>${t.howDesc}</p></div>
        <div class="how-grid">${t.steps.map((step) => `<article class="how-card"><span class="how-number">${step.n}</span><h3>${step.title}</h3><p>${step.body}</p><pre><code>${step.code}</code></pre></article>`).join('')}</div>
        <p class="beginner-fallback">${t.fallback}</p>
      </section>

      <section class="prompt-builder" id="prompt-builder">
        <div class="section-heading"><div><span class="section-kicker">${t.builderKicker}</span><h2>${t.builderTitle}</h2></div><p>${t.builderDesc}</p></div>
        <div class="builder-shell">
          <form class="builder-form" id="builder-form">
            <label class="builder-field builder-field--wide"><span>${t.topicLabel}</span><input id="builder-topic" type="text" autocomplete="off" placeholder="${t.topicPlaceholder}" /></label>
            <label class="builder-field"><span>${t.audienceLabel}</span><select id="builder-audience"><option value="general">${t.audience.general}</option><option value="student">${t.audience.student}</option><option value="developer">${t.audience.developer}</option><option value="expert">${t.audience.expert}</option></select></label>
            <label class="builder-field"><span>${t.durationLabel}</span><select id="builder-duration"><option value="20">20 ${t.seconds}</option><option value="30" selected>30 ${t.seconds}</option><option value="45">45 ${t.seconds}</option><option value="60">60 ${t.seconds}</option></select></label>
            <label class="builder-field"><span>${t.aspectLabel}</span><select id="builder-aspect"><option value="16:9" selected>16:9</option><option value="9:16">9:16</option><option value="1:1">1:1</option></select></label>
            <fieldset class="builder-outputs"><legend>${t.outputsLabel}</legend><label><input type="checkbox" name="output" value="HTML" checked /> HTML</label><label><input type="checkbox" name="output" value="MP4" checked /> MP4</label><label><input type="checkbox" name="output" value="GIF" /> GIF</label><label><input type="checkbox" name="output" value="PNG" /> PNG</label><label><input type="checkbox" name="output" value="SRT/VTT" checked /> SRT/VTT</label></fieldset>
            <div class="builder-actions"><button class="button button--primary" id="builder-copy" type="button">${t.generateCopy}</button><button class="button" id="builder-reset" type="button">${t.useSimple}</button></div>
          </form>
          <div class="builder-preview"><div class="builder-preview-top"><span>CODEX TASK</span><button id="builder-copy-small" type="button">${t.copy}</button></div><pre><code id="builder-prompt"></code></pre></div>
        </div>
      </section>

      <section class="showcase" id="examples">
        <div class="section-heading"><div><span class="section-kicker">${t.examplesKicker}</span><h2>${t.examplesTitle}</h2></div><p>${t.examplesDesc}</p></div>
        <div class="demo-grid">${demos.map((demo, index) => {
          const previewButton = demo.preview ? `<button class="preview-play" type="button" data-preview="${mediaUrl(demo.preview)}" data-demo="${demo.id}" aria-label="${t.playPreview}: ${text(demo.title)}"><span class="preview-play-icon">▶</span><span class="preview-play-text">${t.playPreview}</span></button>` : '';
          return `<article class="demo-card ${index === 0 ? 'demo-card--featured' : ''}" data-demo-card="${demo.id}"><div class="demo-frame-wrap"><img class="demo-poster" src="${mediaUrl(demo.poster)}" alt="" ${index === 0 ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"'} decoding="async" /><video class="demo-preview-video" muted loop playsinline preload="none" aria-hidden="true"></video><a class="frame-overlay" href="${demoUrl(demo.id)}" aria-label="${t.open}: ${text(demo.title)}"></a>${previewButton}<span class="live-pill"><i></i>${t.previewBadge}</span><span class="demo-number">0${index + 1}</span></div><div class="demo-meta"><div class="demo-eyebrow">${demo.grammar} · ${demo.flagship ? 'FLAGSHIP · QA' : 'EXPERIMENT'}</div><h3>${text(demo.title)}</h3><p>${text(demo.description)}</p><a class="demo-link" href="${demoUrl(demo.id)}">${t.open}<span>↗</span></a></div></article>`;
        }).join('')}</div>
      </section>

      <section class="pipeline"><div class="section-heading compact"><div><span class="section-kicker">${t.pipelineKicker}</span><h2>${t.pipelineTitle}</h2></div></div><div class="pipeline-row"><div class="pipeline-node pipeline-node--source"><span class="pipeline-dot"></span><strong>Prompt</strong><small>topic / audience</small></div><div class="pipeline-arrow">→</div><div class="pipeline-node"><strong>Codex</strong><small>setup + build + QA</small></div><div class="pipeline-arrow">→</div><div class="pipeline-node"><strong>HTML</strong><small>${t.pipelineLabels[0]}</small></div><div class="pipeline-node"><strong>MP4</strong><small>${t.pipelineLabels[1]}</small></div><div class="pipeline-node"><strong>GIF</strong><small>${t.pipelineLabels[2]}</small></div><div class="pipeline-node"><strong>SRT/VTT</strong><small>${t.pipelineLabels[3]}</small></div></div></section>

      <section class="quickstart developer-only" id="commands"><div class="quickstart-copy"><span class="section-kicker">${t.quickKicker}</span><h2>${t.quickTitle}</h2><p>${t.quickDesc}</p></div><div class="code-panel"><div class="code-top"><span></span><span></span><span></span></div><pre><code>git clone ${REPO_URL}.git\ncd loop-animation\nnpm install\nnpm run dev\nnpm run qa:continuity</code></pre></div></section>
      <footer class="gallery-footer"><span>Loop Animation · MIT · v0.6</span><span>${t.footer}</span></footer><div class="copy-toast" id="copy-toast" role="status" aria-live="polite"></div>
    </main>`;

  const heroPrompt = get<HTMLElement>('#hero-prompt');
  heroPrompt.textContent = t.heroPrompt;
  get<HTMLButtonElement>('#gallery-language').addEventListener('click', () => { stopActivePreview(); language = language === 'zh' ? 'en' : 'zh'; persistLanguage(language); const url = new URL(location.href); url.searchParams.set('lang', language); history.replaceState({}, '', url); render(); });
  get<HTMLButtonElement>('#hero-copy').addEventListener('click', () => copyText(t.heroPrompt));
  get<HTMLButtonElement>('#hero-copy-main').addEventListener('click', () => copyText(t.heroPrompt));

  const topic = get<HTMLInputElement>('#builder-topic');
  const audience = get<HTMLSelectElement>('#builder-audience');
  const duration = get<HTMLSelectElement>('#builder-duration');
  const aspect = get<HTMLSelectElement>('#builder-aspect');
  const builderPrompt = get<HTMLElement>('#builder-prompt');
  const updateBuilder = () => { builderPrompt.textContent = buildPrompt(); };
  get<HTMLFormElement>('#builder-form').addEventListener('input', updateBuilder);
  get<HTMLFormElement>('#builder-form').addEventListener('change', updateBuilder);
  get<HTMLButtonElement>('#builder-copy').addEventListener('click', () => copyText(buildPrompt()));
  get<HTMLButtonElement>('#builder-copy-small').addEventListener('click', () => copyText(buildPrompt()));
  get<HTMLButtonElement>('#builder-reset').addEventListener('click', () => { topic.value = language === 'zh' ? '为什么飞机能飞起来？' : 'Why can airplanes fly?'; audience.value = 'general'; duration.value = '30'; aspect.value = '16:9'; root.querySelectorAll<HTMLInputElement>('input[name="output"]').forEach((checkbox) => { checkbox.checked = ['HTML', 'MP4', 'SRT/VTT'].includes(checkbox.value); }); updateBuilder(); });
  topic.value = language === 'zh' ? '为什么飞机能飞起来？' : 'Why can airplanes fly?';
  updateBuilder();

  root.querySelectorAll<HTMLImageElement>('.demo-poster').forEach((image) => { image.addEventListener('load', () => image.closest('.demo-frame-wrap')?.classList.add('is-poster-ready'), { once: true }); image.addEventListener('error', () => { image.hidden = true; image.closest('.demo-frame-wrap')?.classList.add('is-poster-error'); }, { once: true }); if (image.complete && image.naturalWidth > 0) image.closest('.demo-frame-wrap')?.classList.add('is-poster-ready'); });
  root.querySelectorAll<HTMLButtonElement>('.preview-play').forEach((button) => button.addEventListener('click', () => togglePreview(button)));

  function buildPrompt() {
    const selectedAudience = audience.value as AudienceKey;
    const selectedOutputs = [...root.querySelectorAll<HTMLInputElement>('input[name="output"]:checked')].map((input) => input.value);
    const outputText = selectedOutputs.length ? selectedOutputs.join(' + ') : 'HTML';
    const subject = topic.value.trim() || (language === 'zh' ? '为什么飞机能飞起来？' : 'Why can airplanes fly?');
    if (language === 'zh') return `请使用 Loop Animation 开源项目帮我制作动画：\n${REPO_URL}\n\n如果当前工作区还没有这个项目，请在可以访问 GitHub 时自行获取它，并读取 .agents/skills/loop-animation/SKILL.md 后继续执行。不要停在安装说明，也不要让我自己执行 git、npm 或终端命令；项目准备、依赖安装、运行和导出都请你处理。\n\n请制作一个关于「${subject}」的交互式科普动画。\n\n受众：${t.audience[selectedAudience]}\n语言：中文\n时长：${duration.value} 秒\n比例：${aspect.value}\n输出：${outputText}\n\n执行要求：\n1. 先定义学习目标，再拆成 5–7 个章节。\n2. 先决定视觉语法与美术方案；复杂自然场景允许 shader + 3D + raster/img2 混合，不要为了方便全部画成 SVG。\n3. 全程使用一个连续世界 S(t)，禁止按 step 硬切相机、物体或整套场景。\n4. 关键对象、镜头、粒子和材质都由绝对 time 推导，同一 timestamp 必须得到同一画面。\n5. 画面占主导，文字和控件不要遮挡主体。\n6. 提供播放/暂停、可拖时间轴、章节跳转、深入解释和必要的语言切换。\n7. 完成后执行 typecheck、build、strict continuity QA，并检查桌面端与移动端构图。\n8. 导出请求格式，并直接告诉我预览在哪里、生成了哪些文件、下一步怎么查看。\n\n如果当前环境无法访问 GitHub，只告诉我需要在界面上完成的一个最简单操作，不要给我一串终端命令。其他非关键参数请直接采用合理默认值。`;
    return `Use the Loop Animation open-source project to create this explainer:\n${REPO_URL}\n\nIf the project is not available in the current workspace, fetch it when GitHub access is available, read .agents/skills/loop-animation/SKILL.md, and continue. Do not stop at setup instructions or ask me to run git, npm or terminal commands myself.\n\nCreate an interactive visual explainer about “${subject}”.\n\nAudience: ${t.audience[selectedAudience]}\nLanguage: English\nDuration: ${duration.value} seconds\nAspect ratio: ${aspect.value}\nOutputs: ${outputText}\n\nExecution requirements:\n1. Define one learning goal, then structure 5–7 chapters.\n2. Choose visual grammar and art direction first. Rich natural scenes may combine shaders + 3D + raster/img2; do not default to SVG because it is easy.\n3. Use one continuous world S(t); never hard-switch the camera, objects or whole scene by chapter.\n4. Derive important objects, camera, particles and materials from absolute time so identical timestamps reproduce identical frames.\n5. Let the visual stage lead and keep text/controls off the subject.\n6. Include play/pause, a draggable timeline, chapter navigation, deeper explanation and language switching when relevant.\n7. Run typecheck, build and strict continuity QA, then inspect desktop and mobile composition.\n8. Export the requested formats and finish with preview URLs, generated files and the simplest next action.\n\nIf the environment cannot access GitHub, tell me only the single simplest UI action I need to take next instead of terminal commands. Choose sensible defaults for all other missing details.`;
  }
}

let activePreview: { video: HTMLVideoElement; button: HTMLButtonElement; wrap: HTMLElement } | null = null;

function togglePreview(button: HTMLButtonElement) {
  const wrap = button.closest<HTMLElement>('.demo-frame-wrap');
  const video = wrap?.querySelector<HTMLVideoElement>('.demo-preview-video');
  const source = button.dataset.preview;
  if (!wrap || !video || !source) return;
  if (activePreview?.button === button) { stopActivePreview(); return; }
  stopActivePreview();
  const t = copy[language];
  activePreview = { video, button, wrap };
  video.src = source;
  video.setAttribute('aria-hidden', 'false');
  wrap.classList.add('is-previewing');
  button.classList.add('is-active');
  const label = button.querySelector<HTMLElement>('.preview-play-text');
  if (label) label.textContent = t.stopPreview;
  video.play().catch(() => { stopActivePreview(); window.location.href = button.closest<HTMLElement>('[data-demo-card]')?.querySelector<HTMLAnchorElement>('.demo-link')?.href ?? location.href; });
}

function stopActivePreview() {
  if (!activePreview) return;
  const { video, button, wrap } = activePreview;
  video.pause(); video.removeAttribute('src'); video.load(); video.setAttribute('aria-hidden', 'true'); wrap.classList.remove('is-previewing'); button.classList.remove('is-active');
  const label = button.querySelector<HTMLElement>('.preview-play-text');
  if (label) label.textContent = copy[language].playPreview;
  activePreview = null;
}

async function copyText(value: string) {
  const t = copy[language];
  try { await navigator.clipboard.writeText(value); showToast(t.copied); }
  catch { const textarea = document.createElement('textarea'); textarea.value = value; textarea.style.position = 'fixed'; textarea.style.opacity = '0'; document.body.appendChild(textarea); textarea.select(); const ok = document.execCommand('copy'); textarea.remove(); showToast(ok ? t.copied : t.copyFailed); }
}

function showToast(message: string) {
  const toast = root.querySelector<HTMLElement>('#copy-toast');
  if (!toast) return;
  toast.textContent = message; toast.classList.add('is-visible'); window.setTimeout(() => toast.classList.remove('is-visible'), 1600);
}

function get<T extends Element>(selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing ${selector}`);
  return element;
}

render();
