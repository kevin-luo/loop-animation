import { getLanguage, persistLanguage, type AppLanguage, withLanguage } from '../runtime/i18n';
import './style.css';
import './studio-enhancements.css';

const root = document.querySelector<HTMLDivElement>('#app')!;
if (!root) throw new Error('Missing #app');
let language: AppLanguage = getLanguage();

const demos = [
  {
    id: 'water-v2', grammar: 'HYBRID / EARTH SYSTEM', flagship: true,
    title: { zh: '一滴水如何走完整个水循环？', en: 'How does one drop travel through the water cycle?' },
    description: { zh: '视觉旗舰：shader 天空与海面、程序化地形、云层、粒子水汽与降雨，以及一条贯穿全程的水滴路径。', en: 'Visual flagship: shader sky and ocean, sculpted terrain, clouds, vapor/rain particles, and one continuous hero-drop path.' },
  },
  {
    id: 'eclipse', grammar: 'ORBIT / SPATIAL', flagship: true,
    title: { zh: '日食为什么不会每个月都发生？', en: 'Why does a solar eclipse not happen every month?' },
    description: { zh: '让月球沿同一条轨道连续运动，用倾角、交点、影区和观察位置解释真正的三维几何。', en: 'Keep the Moon on one continuous orbit while tilt, nodes, shadow regions and observer position reveal the 3D geometry.' },
  },
  {
    id: 'dns', grammar: 'FLOW / NETWORK', flagship: false,
    title: { zh: 'DNS 是怎么找到网站的？', en: 'How does DNS find a website?' },
    description: { zh: '网络流实验：让一次域名查询沿 Resolver、Root、TLD 和权威 DNS 跑一遍。', en: 'A network-flow experiment following a query through resolver, root, TLD and authoritative DNS.' },
  },
  {
    id: 'binary', grammar: 'ALGORITHM / PROCESS', flagship: false,
    title: { zh: '为什么二分查找这么快？', en: 'Why is binary search so fast?' },
    description: { zh: '算法实验：把每次比较淘汰一半候选的过程直接可视化。', en: 'An algorithm experiment visualizing how each comparison removes half the search space.' },
  },
] as const;

type AudienceKey = 'general' | 'student' | 'developer' | 'expert';

const copy = {
  zh: {
    navDocs: '怎么使用', navPrompt: '生成提示词',
    kicker: 'CODEX SKILL · THREE.JS · VISUAL EXPLAINERS',
    titleA: '告诉 Codex 一个知识点，',
    titleB: '让它做成可交互的动画解释。',
    lead: '你只需要说清楚“想解释什么”。Loop Animation 负责把内容拆成章节、设计连续视觉世界、生成 Three.js 动画、检查章节衔接，并导出网页、视频、动图和字幕。',
    primary: '先看效果', secondary: 'GitHub 源码', commandLabel: '最简单的用法', copy: '复制', copied: '已复制', copyFailed: '复制失败，请手动复制',
    heroPrompt: '$loop-animation\n\n解释为什么会发生日食。\n受众：普通用户\n时长：30 秒\n比例：16:9\n输出：交互 HTML + MP4 + SRT\n\n请直接采用合理默认值完成，并在导出前运行严格连续性 QA。',
    live: 'Live Three.js', flagship: 'Flagship · QA', experiment: 'Experiment',
    howKicker: 'HOW TO USE', howTitle: '不用先学 Three.js，三步就能开始。',
    howDesc: 'Skill 已经放在仓库里。打开项目后，Codex 可以直接通过 $loop-animation 读取完整制作规范。',
    steps: [
      { n: '01', title: '克隆并打开仓库', body: 'npm install 后，用 Codex 打开这个项目。仓库内已经包含 Skill，不需要额外复制规则。', code: 'git clone https://github.com/kevin-luo/loop-animation.git\ncd loop-animation\nnpm install' },
      { n: '02', title: '告诉 Codex 你要解释什么', body: '最短只要“$loop-animation + 一个知识点”。想控制受众、时长、比例和输出格式，可以用下面的提示词生成器。', code: '$loop-animation\n\n解释 TCP 三次握手。' },
      { n: '03', title: '预览、调整、导出', body: '先看交互页面，拖时间轴检查每一步。确认后让 Codex 跑严格 QA，再导出 MP4 / GIF / PNG / SRT / VTT。', code: 'npm run qa:continuity\nnpm run export:water-v2:mp4' },
    ],
    builderKicker: 'PROMPT BUILDER', builderTitle: '不会写提示词？填 4 个选项就够了。',
    builderDesc: '下面会生成一份适合 Codex 执行的完整任务说明。缺少非关键参数时，Skill 会自己采用合理默认值，不会不停追问。',
    topicLabel: '要解释什么', topicPlaceholder: '例如：为什么飞机能飞起来？', audienceLabel: '受众', durationLabel: '时长', aspectLabel: '画面比例', outputsLabel: '需要输出',
    audience: { general: '普通用户', student: '学生 / 初学者', developer: '开发者', expert: '专业用户' } as Record<AudienceKey,string>,
    seconds: '秒', generateCopy: '复制完整提示词', useSimple: '恢复示例',
    examplesKicker: 'LIVE EXAMPLES', examplesTitle: '先看成品，再决定你想做哪种。',
    examplesDesc: '第一张卡片会直接运行 Water v2。其他实例只有滚动到附近才加载，避免首页同时跑多个 WebGL 场景。',
    open: '打开交互实例',
    pipelineKicker: 'HOW IT WORKS', pipelineTitle: '一份连续世界，同时服务交互、视频和字幕。',
    pipelineLabels: ['交互页面', '视频', '动图', '字幕/旁白'],
    quickKicker: 'COMMANDS', quickTitle: '常用命令不需要记很多。',
    quickDesc: '开发时看 HTML；交付前跑 typecheck、build 和 continuity QA；需要视频或字幕时再调用对应导出命令。',
    footer: '世界连续，解释才真正成立。', languageLabel: 'EN',
    proofs: ['个 QA 旗舰实例', '类输出目标', '条确定性时间轴'],
  },
  en: {
    navDocs: 'How to use', navPrompt: 'Prompt builder',
    kicker: 'CODEX SKILL · THREE.JS · VISUAL EXPLAINERS',
    titleA: 'Give Codex a concept.',
    titleB: 'Turn it into an interactive visual explanation.',
    lead: 'You only need to say what should be explained. Loop Animation structures the story, designs one continuous visual world, builds the Three.js scene, checks chapter continuity, and exports web, video, GIF and captions.',
    primary: 'See the demos', secondary: 'GitHub source', commandLabel: 'The shortest useful prompt', copy: 'Copy', copied: 'Copied', copyFailed: 'Copy failed — select the text manually',
    heroPrompt: '$loop-animation\n\nExplain why solar eclipses happen.\nAudience: general\nDuration: 30 seconds\nAspect ratio: 16:9\nOutputs: interactive HTML + MP4 + SRT\n\nUse reasonable defaults and run strict continuity QA before export.',
    live: 'Live Three.js', flagship: 'Flagship · QA', experiment: 'Experiment',
    howKicker: 'HOW TO USE', howTitle: 'Three steps. No Three.js knowledge required.',
    howDesc: 'The Skill already lives inside the repository. Open the project in Codex and call $loop-animation to load the full production rules.',
    steps: [
      { n: '01', title: 'Clone and open the repo', body: 'Run npm install, then open the project in Codex. The repo-scoped Skill is already included.', code: 'git clone https://github.com/kevin-luo/loop-animation.git\ncd loop-animation\nnpm install' },
      { n: '02', title: 'Tell Codex what to explain', body: 'The minimum is “$loop-animation + a concept”. Use the builder below when you want to control audience, duration, aspect ratio and outputs.', code: '$loop-animation\n\nExplain the TCP three-way handshake.' },
      { n: '03', title: 'Review, refine, export', body: 'Scrub the interactive timeline first. Then run strict QA and export MP4 / GIF / PNG / SRT / VTT when the explanation is ready.', code: 'npm run qa:continuity\nnpm run export:water-v2:mp4' },
    ],
    builderKicker: 'PROMPT BUILDER', builderTitle: 'Do not know what to ask for? Pick four options.',
    builderDesc: 'This creates a production-ready Codex task. When non-critical details are missing, the Skill should choose sensible defaults instead of repeatedly asking questions.',
    topicLabel: 'What should it explain?', topicPlaceholder: 'e.g. Why can airplanes fly?', audienceLabel: 'Audience', durationLabel: 'Duration', aspectLabel: 'Aspect ratio', outputsLabel: 'Outputs',
    audience: { general: 'General audience', student: 'Student / beginner', developer: 'Developer', expert: 'Professional / expert' } as Record<AudienceKey,string>,
    seconds: 'sec', generateCopy: 'Copy full prompt', useSimple: 'Reset example',
    examplesKicker: 'LIVE EXAMPLES', examplesTitle: 'See the output before choosing a visual grammar.',
    examplesDesc: 'The first card runs Water v2 immediately. Other WebGL demos load only when they approach the viewport, keeping the gallery responsive.',
    open: 'Open interactive',
    pipelineKicker: 'HOW IT WORKS', pipelineTitle: 'One continuous world drives interaction, video and narration.',
    pipelineLabels: ['interactive', 'video', 'preview', 'captions/data'],
    quickKicker: 'COMMANDS', quickTitle: 'You only need a few commands.',
    quickDesc: 'Use HTML while developing. Before delivery, run typecheck, build and continuity QA. Export video or captions only when needed.',
    footer: 'A continuous world makes a coherent explanation.', languageLabel: '中文',
    proofs: ['QA-gated flagships', 'output targets', 'deterministic timeline'],
  },
} as const;

function demoUrl(id: string, embed = false) {
  const url = new URL(location.href);
  url.search = '';
  url.searchParams.set('demo', id);
  if (embed) url.searchParams.set('embed', '1');
  withLanguage(url, language);
  return url.toString();
}

function text<T>(value: { zh: T; en: T }) { return value[language]; }

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
          <a href="https://github.com/kevin-luo/loop-animation" target="_blank" rel="noreferrer">GitHub</a>
          <button class="language-switch" id="gallery-language" type="button">${t.languageLabel}</button>
        </div>
      </nav>

      <section class="hero">
        <div class="hero-glow hero-glow--one"></div><div class="hero-glow hero-glow--two"></div>
        <div class="hero-copy">
          <div class="kicker">${t.kicker}</div>
          <h1>${t.titleA}<br/><span>${t.titleB}</span></h1>
          <p class="hero-lead">${t.lead}</p>
          <div class="hero-actions"><a class="button button--primary" href="#examples">${t.primary}</a><a class="button" href="https://github.com/kevin-luo/loop-animation" target="_blank" rel="noreferrer">${t.secondary}</a></div>
          <div class="hero-proof"><div><b>2</b><span>${t.proofs[0]}</span></div><div><b>6</b><span>${t.proofs[1]}</span></div><div><b>1</b><span>${t.proofs[2]}</span></div></div>
        </div>
        <div class="hero-stage">
          <div class="orb orb--a"></div><div class="orb orb--b"></div><div class="orb orb--c"></div><div class="orbit-line orbit-line--a"></div><div class="orbit-line orbit-line--b"></div>
          <div class="hero-terminal">
            <div class="terminal-top"><span></span><span></span><span></span><b>Codex</b><button class="terminal-copy" id="hero-copy" type="button">${t.copy}</button></div>
            <div class="terminal-label">${t.commandLabel}</div><pre><code id="hero-prompt"></code></pre>
          </div>
        </div>
      </section>

      <section class="howto" id="howto">
        <div class="section-heading"><div><span class="section-kicker">${t.howKicker}</span><h2>${t.howTitle}</h2></div><p>${t.howDesc}</p></div>
        <div class="how-grid">${t.steps.map((step)=>`<article class="how-card"><span class="how-number">${step.n}</span><h3>${step.title}</h3><p>${step.body}</p><pre><code>${step.code}</code></pre></article>`).join('')}</div>
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
        <div class="demo-grid">${demos.map((demo,index)=>{
          const embedded = demoUrl(demo.id,true);
          const frameSource = index === 0 ? `src="${embedded}"` : `data-src="${embedded}"`;
          return `<article class="demo-card ${index===0?'demo-card--featured':''}"><div class="demo-frame-wrap"><iframe title="${text(demo.title)}" ${frameSource} loading="lazy" tabindex="-1"></iframe><div class="demo-loading"><span></span></div><a class="frame-overlay" href="${demoUrl(demo.id)}" aria-label="${t.open}: ${text(demo.title)}"></a><span class="live-pill"><i></i>${t.live}</span><span class="demo-number">0${index+1}</span></div><div class="demo-meta"><div class="demo-eyebrow">${demo.grammar} · ${demo.flagship?t.flagship:t.experiment}</div><h3>${text(demo.title)}</h3><p>${text(demo.description)}</p><a class="demo-link" href="${demoUrl(demo.id)}">${t.open}<span>↗</span></a></div></article>`;
        }).join('')}</div>
      </section>

      <section class="pipeline"><div class="section-heading compact"><div><span class="section-kicker">${t.pipelineKicker}</span><h2>${t.pipelineTitle}</h2></div></div><div class="pipeline-row"><div class="pipeline-node pipeline-node--source"><span class="pipeline-dot"></span><strong>World S(t)</strong><small>renderAt(time)</small></div><div class="pipeline-arrow">+</div><div class="pipeline-node"><strong>Story</strong><small>manifest</small></div><div class="pipeline-arrow">→</div><div class="pipeline-node"><strong>HTML</strong><small>${t.pipelineLabels[0]}</small></div><div class="pipeline-node"><strong>MP4</strong><small>${t.pipelineLabels[1]}</small></div><div class="pipeline-node"><strong>GIF</strong><small>${t.pipelineLabels[2]}</small></div><div class="pipeline-node"><strong>SRT/VTT</strong><small>${t.pipelineLabels[3]}</small></div></div></section>

      <section class="quickstart" id="commands"><div class="quickstart-copy"><span class="section-kicker">${t.quickKicker}</span><h2>${t.quickTitle}</h2><p>${t.quickDesc}</p></div><div class="code-panel"><div class="code-top"><span></span><span></span><span></span></div><pre><code>npm run dev\nnpm run typecheck\nnpm run build\nnpm run qa:continuity\n\n# Water v2 exports\nnpm run export:water-v2:mp4\nnpm run export:water-v2:gif\nnpm run story:water-v2:zh</code></pre></div></section>
      <footer class="gallery-footer"><span>Loop Animation · MIT · v0.6</span><span>${t.footer}</span></footer>
      <div class="copy-toast" id="copy-toast" role="status" aria-live="polite"></div>
    </main>`;

  const heroPrompt = get<HTMLElement>('#hero-prompt');
  heroPrompt.textContent = t.heroPrompt;

  get<HTMLButtonElement>('#gallery-language').addEventListener('click',()=>{
    language = language === 'zh' ? 'en' : 'zh';
    persistLanguage(language);
    const url = new URL(location.href);
    url.searchParams.set('lang',language);
    history.replaceState({},'',url);
    render();
  });

  get<HTMLButtonElement>('#hero-copy').addEventListener('click',()=>copyText(t.heroPrompt));

  const topic = get<HTMLInputElement>('#builder-topic');
  const audience = get<HTMLSelectElement>('#builder-audience');
  const duration = get<HTMLSelectElement>('#builder-duration');
  const aspect = get<HTMLSelectElement>('#builder-aspect');
  const builderPrompt = get<HTMLElement>('#builder-prompt');

  const updateBuilder = () => { builderPrompt.textContent = buildPrompt(); };
  get<HTMLFormElement>('#builder-form').addEventListener('input', updateBuilder);
  get<HTMLFormElement>('#builder-form').addEventListener('change', updateBuilder);
  get<HTMLButtonElement>('#builder-copy').addEventListener('click',()=>copyText(buildPrompt()));
  get<HTMLButtonElement>('#builder-copy-small').addEventListener('click',()=>copyText(buildPrompt()));
  get<HTMLButtonElement>('#builder-reset').addEventListener('click',()=>{
    topic.value = language === 'zh' ? '为什么飞机能飞起来？' : 'Why can airplanes fly?';
    audience.value = 'general'; duration.value = '30'; aspect.value = '16:9';
    root.querySelectorAll<HTMLInputElement>('input[name="output"]').forEach((checkbox)=>{ checkbox.checked = ['HTML','MP4','SRT/VTT'].includes(checkbox.value); });
    updateBuilder();
  });
  topic.value = language === 'zh' ? '为什么飞机能飞起来？' : 'Why can airplanes fly?';
  updateBuilder();
  lazyLoadDemos();

  function buildPrompt() {
    const selectedAudience = audience.value as AudienceKey;
    const selectedOutputs = [...root.querySelectorAll<HTMLInputElement>('input[name="output"]:checked')].map((input)=>input.value);
    const outputText = selectedOutputs.length ? selectedOutputs.join(' + ') : 'HTML';
    const subject = topic.value.trim() || (language === 'zh' ? '为什么飞机能飞起来？' : 'Why can airplanes fly?');
    if (language === 'zh') {
      return `$loop-animation\n\n请制作一个关于「${subject}」的交互式科普动画。\n\n受众：${t.audience[selectedAudience]}\n语言：中文\n时长：${duration.value} 秒\n比例：${aspect.value}\n输出：${outputText}\n\n执行要求：\n1. 先用一句话定义学习目标，再拆成 5–7 个章节。\n2. 先决定最适合的视觉语法与美术方案；复杂自然场景允许 shader + 3D + raster/img2 混合，不要为了方便全部画成 SVG。\n3. 全程使用一个连续世界 S(t)。章节只负责讲解和导航，禁止按 step 硬切相机、物体或整套场景。\n4. 关键对象保持连续；镜头、粒子、材质和可见性都由绝对 time 推导，同一 timestamp 必须得到同一画面。\n5. 画面占主导，文字只解释当前机制；说明、步骤和控件不要遮挡主体。\n6. 提供播放/暂停、可拖时间轴、章节跳转、深入解释和必要的语言切换。\n7. 完成后执行 typecheck、build、strict continuity QA，并检查桌面端与移动端构图。\n8. 导出请求格式，并在完成时列出预览入口、生成文件位置和使用命令。\n\n如果我的描述缺少非关键参数，请直接采用合理默认值继续，不要反复提问。`;
    }
    return `$loop-animation\n\nCreate an interactive visual explainer about “${subject}”.\n\nAudience: ${t.audience[selectedAudience]}\nLanguage: English\nDuration: ${duration.value} seconds\nAspect ratio: ${aspect.value}\nOutputs: ${outputText}\n\nExecution requirements:\n1. Define the learning goal in one sentence, then structure 5–7 chapters.\n2. Choose the visual grammar and art direction before coding. Rich natural scenes may combine shaders + 3D + raster/img2; do not default to SVG just because it is easy.\n3. Use one continuous world S(t). Chapters are narration/navigation bookmarks only; never hard-switch the camera, objects or whole scene by step.\n4. Keep important objects continuous. Camera, particles, materials and visibility must derive from absolute time so the same timestamp reproduces the same frame.\n5. Let the visual stage lead. Text should explain the active mechanism without covering the subject.\n6. Include play/pause, a draggable timeline, chapter navigation, deeper explanation and language switching when relevant.\n7. Run typecheck, build and strict continuity QA, then inspect desktop and mobile composition.\n8. Export the requested formats and finish by listing preview URLs, output files and commands.\n\nIf non-critical details are missing, choose sensible defaults and continue instead of repeatedly asking questions.`;
  }
}

function lazyLoadDemos() {
  const frames = [...root.querySelectorAll<HTMLIFrameElement>('iframe[data-src]')];
  if (!('IntersectionObserver' in window)) {
    frames.forEach((frame)=>{ frame.src = frame.dataset.src ?? ''; frame.removeAttribute('data-src'); });
    return;
  }
  const observer = new IntersectionObserver((entries)=>{
    entries.forEach((entry)=>{
      if (!entry.isIntersecting) return;
      const frame = entry.target as HTMLIFrameElement;
      frame.src = frame.dataset.src ?? '';
      frame.removeAttribute('data-src');
      observer.unobserve(frame);
    });
  },{rootMargin:'420px 0px'});
  frames.forEach((frame)=>observer.observe(frame));
}

async function copyText(value: string) {
  const t = copy[language];
  try {
    await navigator.clipboard.writeText(value);
    showToast(t.copied);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.style.position = 'fixed'; textarea.style.opacity = '0';
    document.body.appendChild(textarea); textarea.select();
    const ok = document.execCommand('copy'); textarea.remove();
    showToast(ok ? t.copied : t.copyFailed);
  }
}

function showToast(message: string) {
  const toast = root.querySelector<HTMLElement>('#copy-toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.setTimeout(()=>toast.classList.remove('is-visible'),1600);
}

function get<T extends Element>(selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing ${selector}`);
  return element;
}

render();
