import { getLanguage, persistLanguage, type AppLanguage, withLanguage } from '../runtime/i18n';
import './style.css';

const root = document.querySelector<HTMLDivElement>('#app')!;
if (!root) throw new Error('Missing #app');

let language: AppLanguage = getLanguage();

const demos = [
  {
    id: 'eclipse',
    grammar: 'ORBIT / SPATIAL',
    title: { zh: '为什么会发生日食？', en: 'Why does a solar eclipse happen?' },
    description: {
      zh: '用轨道、遮挡与阴影几何关系，把“太阳—月球—地球”真正摆进空间里解释。',
      en: 'Explain the Sun–Moon–Earth alignment through orbit geometry, occlusion and moving shadow.',
    },
  },
  {
    id: 'dns',
    grammar: 'FLOW / NETWORK',
    title: { zh: 'DNS 是怎么找到网站的？', en: 'How does DNS find a website?' },
    description: {
      zh: '让一次域名查询沿 Resolver、Root、TLD、权威 DNS 真正跑一遍，再把 IP 带回来。',
      en: 'Watch one query move through resolver, root, TLD and authoritative DNS, then return the IP.',
    },
  },
  {
    id: 'binary',
    grammar: 'ALGORITHM / PROCESS',
    title: { zh: '为什么二分查找这么快？', en: 'Why is binary search so fast?' },
    description: {
      zh: '每次比较都直接淘汰一半候选，让复杂度从“一个个找”变成“不断砍半”。',
      en: 'See every comparison eliminate half the remaining candidates and collapse the search space.',
    },
  },
] as const;

const copy = {
  zh: {
    navDocs: '使用说明',
    kicker: 'CODEX SKILL · THREE.JS · DETERMINISTIC RENDERING',
    titleA: '把知识点，',
    titleB: '变成真正能讲明白的动画。',
    lead: '同一份 Three.js 源作品，可以直接作为交互 HTML，也可以确定性导出 MP4、GIF 和 PNG。重点不是让文字飞起来，而是让机制本身动起来。',
    primary: '查看在线实例',
    secondary: '查看源码',
    commandLabel: '给 Codex 的一句话',
    prompt: '$loop-animation\n\n解释 DNS 如何完成域名解析。\n\n- 30 秒\n- 9:16 竖屏\n- 可拖动时间轴\n- 导出 MP4 + GIF\n- 导出前跑视觉 QA',
    live: '实时 Three.js',
    sectionKicker: 'LIVE EXAMPLES',
    sectionTitle: '不同知识点，需要不同的视觉语法。',
    sectionDesc: '下面不是截图。每张卡片里都在运行真实的 Three.js 场景，点击后可以播放、暂停和拖动时间轴。',
    open: '打开交互实例',
    pipelineKicker: 'ONE SOURCE',
    pipelineTitle: 'HTML 是源作品，其他格式只是渲染目标。',
    pipelineLabels: ['交互页面', '视频', '动图', '封面'],
    quickKicker: 'QUICK START',
    quickTitle: '把知识点交给 Codex，Skill 负责动画导演。',
    quickDesc: '克隆仓库后，Codex 可以直接发现仓库内的 loop-animation Skill。',
    footer: '让知识本身动起来。',
    languageLabel: 'EN',
  },
  en: {
    navDocs: 'Usage',
    kicker: 'CODEX SKILL · THREE.JS · DETERMINISTIC RENDERING',
    titleA: 'Turn concepts into',
    titleB: 'animations that actually explain.',
    lead: 'One Three.js source becomes an interactive HTML explainer or a deterministic MP4, GIF and PNG render. Motion should reveal the mechanism, not decorate the text.',
    primary: 'Explore live demos',
    secondary: 'View source',
    commandLabel: 'One prompt for Codex',
    prompt: '$loop-animation\n\nExplain how DNS resolves a domain.\n\n- 30 seconds\n- vertical 9:16\n- interactive timeline\n- export MP4 + GIF\n- run visual QA first',
    live: 'Live Three.js',
    sectionKicker: 'LIVE EXAMPLES',
    sectionTitle: 'Different ideas need different visual grammars.',
    sectionDesc: 'These are not screenshots. Every card runs a real Three.js scene. Open one to play, pause and scrub the deterministic timeline.',
    open: 'Open interactive',
    pipelineKicker: 'ONE SOURCE',
    pipelineTitle: 'HTML is the source. Everything else is a render target.',
    pipelineLabels: ['interactive', 'video', 'README', 'poster'],
    quickKicker: 'QUICK START',
    quickTitle: 'Give Codex the concept. Let the Skill direct the animation.',
    quickDesc: 'Clone the repository and Codex can discover the repo-scoped loop-animation Skill automatically.',
    footer: 'Animate ideas, not text.',
    languageLabel: '中文',
  },
} as const;

function demoUrl(id: string, embed = false) {
  const url = new URL(window.location.href);
  url.search = '';
  url.searchParams.set('demo', id);
  if (embed) url.searchParams.set('embed', '1');
  withLanguage(url, language);
  return url.toString();
}

function text<T>(entry: { zh: T; en: T }): T {
  return entry[language];
}

function render() {
  const t = copy[language];
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';

  root.innerHTML = `
    <main class="gallery-shell">
      <nav class="gallery-nav">
        <a class="brand" href="./" aria-label="Loop Animation home">
          <span class="brand-mark"><i></i></span>
          <span>Loop Animation</span>
        </a>
        <div class="nav-links">
          <a href="#quickstart">${t.navDocs}</a>
          <a href="https://github.com/kevin-luo/loop-animation" target="_blank" rel="noreferrer">GitHub</a>
          <button class="language-switch" id="gallery-language" type="button">${t.languageLabel}</button>
        </div>
      </nav>

      <section class="hero">
        <div class="hero-glow hero-glow--one"></div>
        <div class="hero-glow hero-glow--two"></div>
        <div class="hero-copy">
          <div class="kicker">${t.kicker}</div>
          <h1>${t.titleA}<br/><span>${t.titleB}</span></h1>
          <p class="hero-lead">${t.lead}</p>
          <div class="hero-actions">
            <a class="button button--primary" href="#examples">${t.primary}</a>
            <a class="button" href="https://github.com/kevin-luo/loop-animation" target="_blank" rel="noreferrer">${t.secondary}</a>
          </div>
          <div class="hero-proof">
            <div><b>3</b><span>${language === 'zh' ? '种视觉语法实例' : 'visual grammars'}</span></div>
            <div><b>4</b><span>${language === 'zh' ? '种输出格式' : 'output formats'}</span></div>
            <div><b>1</b><span>${language === 'zh' ? '条确定性时间轴' : 'deterministic timeline'}</span></div>
          </div>
        </div>

        <div class="hero-stage" aria-label="Codex example prompt">
          <div class="orb orb--a"></div>
          <div class="orb orb--b"></div>
          <div class="orb orb--c"></div>
          <div class="orbit-line orbit-line--a"></div>
          <div class="orbit-line orbit-line--b"></div>
          <div class="hero-terminal">
            <div class="terminal-top"><span></span><span></span><span></span><b>Codex</b></div>
            <div class="terminal-label">${t.commandLabel}</div>
            <pre><code>${t.prompt}</code></pre>
          </div>
        </div>
      </section>

      <section class="showcase" id="examples">
        <div class="section-heading">
          <div>
            <span class="section-kicker">${t.sectionKicker}</span>
            <h2>${t.sectionTitle}</h2>
          </div>
          <p>${t.sectionDesc}</p>
        </div>

        <div class="demo-grid">
          ${demos.map((demo, index) => `
            <article class="demo-card ${index === 0 ? 'demo-card--featured' : ''}">
              <div class="demo-frame-wrap">
                <iframe title="${text(demo.title)}" src="${demoUrl(demo.id, true)}" loading="${index === 0 ? 'eager' : 'lazy'}" tabindex="-1"></iframe>
                <a class="frame-overlay" href="${demoUrl(demo.id)}" aria-label="${text(demo.title)}"></a>
                <span class="live-pill"><i></i>${t.live}</span>
                <span class="demo-number">0${index + 1}</span>
              </div>
              <div class="demo-meta">
                <div class="demo-eyebrow">${demo.grammar}</div>
                <h3>${text(demo.title)}</h3>
                <p>${text(demo.description)}</p>
                <a class="demo-link" href="${demoUrl(demo.id)}">${t.open}<span>↗</span></a>
              </div>
            </article>
          `).join('')}
        </div>
      </section>

      <section class="pipeline">
        <div class="section-heading compact">
          <div><span class="section-kicker">${t.pipelineKicker}</span><h2>${t.pipelineTitle}</h2></div>
        </div>
        <div class="pipeline-row">
          <div class="pipeline-node pipeline-node--source"><span class="pipeline-dot"></span><strong>Three.js</strong><small>renderAt(time)</small></div>
          <div class="pipeline-arrow">→</div>
          <div class="pipeline-node"><strong>HTML</strong><small>${t.pipelineLabels[0]}</small></div>
          <div class="pipeline-node"><strong>MP4</strong><small>${t.pipelineLabels[1]}</small></div>
          <div class="pipeline-node"><strong>GIF</strong><small>${t.pipelineLabels[2]}</small></div>
          <div class="pipeline-node"><strong>PNG</strong><small>${t.pipelineLabels[3]}</small></div>
        </div>
      </section>

      <section class="quickstart" id="quickstart">
        <div class="quickstart-copy">
          <span class="section-kicker">${t.quickKicker}</span>
          <h2>${t.quickTitle}</h2>
          <p>${t.quickDesc}</p>
        </div>
        <div class="code-panel"><div class="code-top"><span></span><span></span><span></span></div><pre><code>git clone https://github.com/kevin-luo/loop-animation.git
cd loop-animation
npm install
npm run dev</code></pre></div>
      </section>

      <footer class="gallery-footer">
        <span>Loop Animation · MIT</span>
        <span>${t.footer}</span>
      </footer>
    </main>
  `;

  document.querySelector<HTMLButtonElement>('#gallery-language')?.addEventListener('click', () => {
    language = language === 'zh' ? 'en' : 'zh';
    persistLanguage(language);
    const url = new URL(window.location.href);
    url.searchParams.set('lang', language);
    history.replaceState({}, '', url);
    render();
  });
}

render();
