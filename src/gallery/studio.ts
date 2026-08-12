import { getLanguage, persistLanguage, type AppLanguage, withLanguage } from '../runtime/i18n';
import './style.css';

const root = document.querySelector<HTMLDivElement>('#app')!;
if (!root) throw new Error('Missing #app');
let language: AppLanguage = getLanguage();

const demos = [
  {
    id: 'water-v2', grammar: 'HYBRID / EARTH SYSTEM', flagship: true,
    title: { zh: '一滴水如何走完整个水循环？', en: 'How does one drop travel through the water cycle?' },
    description: { zh: '新的视觉旗舰：shader 天空与海面、程序化地形、云层 sprite、粒子水汽与降雨，加上一条真正连续的 hero drop 路径。', en: 'The new visual flagship: shader sky and ocean, sculpted terrain, cloud sprites, vapor/rain particles, and one truly continuous hero-drop path.' },
  },
  {
    id: 'eclipse', grammar: 'ORBIT / SPATIAL', flagship: true,
    title: { zh: '日食为什么不会每个月都发生？', en: 'Why does a solar eclipse not happen every month?' },
    description: { zh: '让月球沿同一条轨道连续运动，用倾角、交点、影区和观察位置解释真正的三维几何。', en: 'Keep the Moon on one continuous orbit while tilt, nodes, shadow regions and observer position reveal the 3D geometry.' },
  },
  {
    id: 'dns', grammar: 'FLOW / NETWORK', flagship: false,
    title: { zh: 'DNS 是怎么找到网站的？', en: 'How does DNS find a website?' },
    description: { zh: '早期网络流实验：让一次域名查询沿 Resolver、Root、TLD 和权威 DNS 跑一遍。', en: 'An earlier network-flow experiment following a query through resolver, root, TLD and authoritative DNS.' },
  },
  {
    id: 'binary', grammar: 'ALGORITHM / PROCESS', flagship: false,
    title: { zh: '为什么二分查找这么快？', en: 'Why is binary search so fast?' },
    description: { zh: '早期算法实验：把每次比较淘汰一半候选的过程直接可视化。', en: 'An earlier algorithm experiment visualizing how each comparison removes half the search space.' },
  },
] as const;

const copy = {
  zh: {
    navDocs: '使用说明',
    kicker: 'CODEX SKILL · THREE.JS · CONTINUOUS VISUAL STORIES',
    titleA: '让一个知识世界',
    titleB: '连续地讲完自己的故事。',
    lead: '章节只负责告诉你“现在讲到哪里”。镜头、物体、粒子和材质始终来自同一条连续时间轴 S(t)。新的 Water v2 进一步把视觉底层升级成 shader、程序化地形与粒子系统，减少“示意图感”。',
    primary: '查看在线实例', secondary: '查看源码', commandLabel: '给 Codex 的一句话',
    prompt: '$loop-animation\n\n解释水循环。\n\n- 先设计一个连续世界 S(t)\n- 章节只作为讲解书签\n- 不用 step 硬切相机/物体\n- shader / raster / 3D 负责画面质感\n- 画面主导，文字只补关键解释\n- 运行 boundary continuity QA',
    live: 'Live Three.js', flagship: 'Flagship · Continuity gated', experiment: 'Earlier experiment',
    sectionKicker: 'LIVE EXAMPLES', sectionTitle: '章节会切换，世界不会重置。',
    sectionDesc: '当前旗舰实例优先追求连续世界与视觉质感：连续相机路径、重叠 envelope、shader / 3D / 粒子系统，并在每个章节边界自动检查 t−1帧 / t / t+1帧。',
    open: '打开交互实例',
    pipelineKicker: 'ONE CONTINUOUS SOURCE', pipelineTitle: '世界状态、故事清单和输出格式彼此解耦。',
    pipelineLabels: ['交互页面', '视频', '动图', '字幕/旁白'],
    quickKicker: 'QUICK START', quickTitle: '克隆仓库，Codex 直接发现 Skill。',
    quickDesc: '在仓库中调用 $loop-animation。先规划连续世界与 Story Manifest，再让 Codex 构建场景并跑连续性 QA。',
    footer: '世界连续，解释才真正成立。', languageLabel: 'EN',
    proofs: ['个连续性旗舰实例', '类输出目标', '套确定性世界模型'],
  },
  en: {
    navDocs: 'Usage',
    kicker: 'CODEX SKILL · THREE.JS · CONTINUOUS VISUAL STORIES',
    titleA: 'Build one visual world',
    titleB: 'and let it explain itself continuously.',
    lead: 'Chapters only tell the learner where the story is. Camera, objects, particles and materials remain functions of one continuous timeline S(t). Water v2 pushes the visual layer further with shaders, sculpted terrain and particle systems.',
    primary: 'Explore live demos', secondary: 'View source', commandLabel: 'One prompt for Codex',
    prompt: '$loop-animation\n\nExplain the water cycle.\n\n- design one continuous world S(t)\n- chapters are narration bookmarks only\n- never hard-switch camera/object state by step\n- use shader / raster / 3D for visual quality\n- let visuals lead; text explains only what matters\n- run boundary continuity QA',
    live: 'Live Three.js', flagship: 'Flagship · Continuity gated', experiment: 'Earlier experiment',
    sectionKicker: 'LIVE EXAMPLES', sectionTitle: 'The chapter changes. The world does not reset.',
    sectionDesc: 'Flagship demos now prioritize both continuity and visual quality: continuous camera paths, overlapping envelopes, shader / 3D / particle systems, and automated t−1 frame / t / t+1 frame checks.',
    open: 'Open interactive',
    pipelineKicker: 'ONE CONTINUOUS SOURCE', pipelineTitle: 'World state, story manifest and output formats stay decoupled.',
    pipelineLabels: ['interactive', 'video', 'preview', 'captions/data'],
    quickKicker: 'QUICK START', quickTitle: 'Clone the repo. Codex discovers the Skill.',
    quickDesc: 'Call $loop-animation in the repository. Design the continuous world and Story Manifest first, then build the scene and run continuity QA.',
    footer: 'A continuous world makes a coherent explanation.', languageLabel: '中文',
    proofs: ['continuity-gated flagships', 'output targets', 'deterministic world model'],
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
        <a class="brand" href="./"><span class="brand-mark"><i></i></span><span>Loop Animation</span></a>
        <div class="nav-links"><a href="#quickstart">${t.navDocs}</a><a href="https://github.com/kevin-luo/loop-animation" target="_blank" rel="noreferrer">GitHub</a><button class="language-switch" id="gallery-language" type="button">${t.languageLabel}</button></div>
      </nav>
      <section class="hero">
        <div class="hero-glow hero-glow--one"></div><div class="hero-glow hero-glow--two"></div>
        <div class="hero-copy"><div class="kicker">${t.kicker}</div><h1>${t.titleA}<br/><span>${t.titleB}</span></h1><p class="hero-lead">${t.lead}</p><div class="hero-actions"><a class="button button--primary" href="#examples">${t.primary}</a><a class="button" href="https://github.com/kevin-luo/loop-animation" target="_blank" rel="noreferrer">${t.secondary}</a></div><div class="hero-proof"><div><b>2</b><span>${t.proofs[0]}</span></div><div><b>6</b><span>${t.proofs[1]}</span></div><div><b>1</b><span>${t.proofs[2]}</span></div></div></div>
        <div class="hero-stage"><div class="orb orb--a"></div><div class="orb orb--b"></div><div class="orb orb--c"></div><div class="orbit-line orbit-line--a"></div><div class="orbit-line orbit-line--b"></div><div class="hero-terminal"><div class="terminal-top"><span></span><span></span><span></span><b>Codex</b></div><div class="terminal-label">${t.commandLabel}</div><pre><code>${t.prompt}</code></pre></div></div>
      </section>
      <section class="showcase" id="examples"><div class="section-heading"><div><span class="section-kicker">${t.sectionKicker}</span><h2>${t.sectionTitle}</h2></div><p>${t.sectionDesc}</p></div><div class="demo-grid">${demos.map((demo,index)=>`<article class="demo-card ${index===0?'demo-card--featured':''}"><div class="demo-frame-wrap"><iframe title="${text(demo.title)}" src="${demoUrl(demo.id,true)}" loading="${index<2?'eager':'lazy'}" tabindex="-1"></iframe><a class="frame-overlay" href="${demoUrl(demo.id)}"></a><span class="live-pill"><i></i>${t.live}</span><span class="demo-number">0${index+1}</span></div><div class="demo-meta"><div class="demo-eyebrow">${demo.grammar} · ${demo.flagship?t.flagship:t.experiment}</div><h3>${text(demo.title)}</h3><p>${text(demo.description)}</p><a class="demo-link" href="${demoUrl(demo.id)}">${t.open}<span>↗</span></a></div></article>`).join('')}</div></section>
      <section class="pipeline"><div class="section-heading compact"><div><span class="section-kicker">${t.pipelineKicker}</span><h2>${t.pipelineTitle}</h2></div></div><div class="pipeline-row"><div class="pipeline-node pipeline-node--source"><span class="pipeline-dot"></span><strong>World S(t)</strong><small>renderAt(time)</small></div><div class="pipeline-arrow">+</div><div class="pipeline-node"><strong>Story</strong><small>manifest</small></div><div class="pipeline-arrow">→</div><div class="pipeline-node"><strong>HTML</strong><small>${t.pipelineLabels[0]}</small></div><div class="pipeline-node"><strong>MP4</strong><small>${t.pipelineLabels[1]}</small></div><div class="pipeline-node"><strong>GIF</strong><small>${t.pipelineLabels[2]}</small></div><div class="pipeline-node"><strong>SRT/VTT</strong><small>${t.pipelineLabels[3]}</small></div></div></section>
      <section class="quickstart" id="quickstart"><div class="quickstart-copy"><span class="section-kicker">${t.quickKicker}</span><h2>${t.quickTitle}</h2><p>${t.quickDesc}</p></div><div class="code-panel"><div class="code-top"><span></span><span></span><span></span></div><pre><code>git clone https://github.com/kevin-luo/loop-animation.git\ncd loop-animation\nnpm install\nnpm run dev\n\n# flagship continuity checks\nnpm run qa:continuity</code></pre></div></section>
      <footer class="gallery-footer"><span>Loop Animation · MIT · v0.5</span><span>${t.footer}</span></footer>
    </main>`;
  document.querySelector<HTMLButtonElement>('#gallery-language')?.addEventListener('click',()=>{language=language==='zh'?'en':'zh';persistLanguage(language);const url=new URL(location.href);url.searchParams.set('lang',language);history.replaceState({},'',url);render();});
}
render();
