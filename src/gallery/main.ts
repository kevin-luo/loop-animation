import './style.css';

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing #app');

const demos = [
  {
    id: 'eclipse',
    eyebrow: 'ORBIT / SPATIAL',
    title: 'Why does a solar eclipse happen?',
    zh: '为什么会发生日食？',
    description: 'Use spatial alignment, orbital motion, and shadow geometry to explain a real astronomical event.',
  },
  {
    id: 'dns',
    eyebrow: 'FLOW / NETWORK',
    title: 'How does DNS find a website?',
    zh: 'DNS 是怎么找到网站的？',
    description: 'Watch a query travel through resolver, root, TLD, and authoritative DNS servers, then return an IP address.',
  },
  {
    id: 'binary',
    eyebrow: 'ALGORITHM / PROCESS',
    title: 'Why is binary search fast?',
    zh: '为什么二分查找这么快？',
    description: 'See half of the remaining search space disappear at every comparison.',
  },
];

function demoUrl(id: string, embed = false) {
  const url = new URL(window.location.href);
  url.search = '';
  url.searchParams.set('demo', id);
  if (embed) url.searchParams.set('embed', '1');
  return url.toString();
}

root.innerHTML = `
  <main class="gallery-shell">
    <nav class="gallery-nav">
      <a class="brand" href="./" aria-label="Loop Animation home">
        <span class="brand-mark"></span>
        <span>Loop Animation</span>
      </a>
      <div class="nav-links">
        <a href="https://github.com/kevin-luo/loop-animation" target="_blank" rel="noreferrer">GitHub</a>
        <a href="#quickstart">Use with Codex</a>
      </div>
    </nav>

    <section class="hero">
      <div class="hero-copy">
        <div class="kicker">CODEX SKILL · THREE.JS · DETERMINISTIC RENDERING</div>
        <h1>Turn concepts into<br/><span>animations that teach.</span></h1>
        <p class="hero-lead">One source, four outputs: interactive HTML, MP4, GIF and PNG. Every example below is a live Three.js scene generated with the same runtime.</p>
        <p class="hero-zh">把知识点变成真正能解释原理的交互动画，而不是会动的 PPT。</p>
        <div class="hero-actions">
          <a class="button button--primary" href="${demoUrl('eclipse')}">Open live demo</a>
          <a class="button" href="https://github.com/kevin-luo/loop-animation" target="_blank" rel="noreferrer">View source</a>
        </div>
      </div>
      <div class="hero-terminal" aria-label="Codex example prompt">
        <div class="terminal-top"><span></span><span></span><span></span><b>Codex</b></div>
        <pre><code>$loop-animation

Explain how DNS resolves a domain.

- 30 seconds
- vertical 9:16
- interactive HTML
- export MP4 + GIF
- run visual QA first</code></pre>
      </div>
    </section>

    <section class="showcase" id="examples">
      <div class="section-heading">
        <div>
          <span class="section-kicker">LIVE EXAMPLES</span>
          <h2>Different ideas need different motion.</h2>
        </div>
        <p>These are running pages, not screenshots. Open any example to scrub the deterministic timeline yourself.</p>
      </div>

      <div class="demo-grid">
        ${demos.map((demo, index) => `
          <article class="demo-card ${index === 0 ? 'demo-card--featured' : ''}">
            <div class="demo-frame-wrap">
              <iframe title="${demo.title}" src="${demoUrl(demo.id, true)}" loading="${index === 0 ? 'eager' : 'lazy'}" tabindex="-1"></iframe>
              <a class="frame-overlay" href="${demoUrl(demo.id)}" aria-label="Open ${demo.title}"></a>
              <span class="live-pill"><i></i> LIVE THREE.JS</span>
            </div>
            <div class="demo-meta">
              <div class="demo-eyebrow">${demo.eyebrow}</div>
              <h3>${demo.title}</h3>
              <div class="demo-zh">${demo.zh}</div>
              <p>${demo.description}</p>
              <a class="demo-link" href="${demoUrl(demo.id)}">Open interactive <span>↗</span></a>
            </div>
          </article>
        `).join('')}
      </div>
    </section>

    <section class="pipeline">
      <div class="section-heading compact">
        <div><span class="section-kicker">ONE SOURCE</span><h2>HTML first. Everything else is a render target.</h2></div>
      </div>
      <div class="pipeline-row">
        <div class="pipeline-node pipeline-node--source"><strong>Three.js</strong><span>renderAt(time)</span></div>
        <div class="pipeline-arrow">→</div>
        <div class="pipeline-node"><strong>HTML</strong><span>interactive</span></div>
        <div class="pipeline-node"><strong>MP4</strong><span>video</span></div>
        <div class="pipeline-node"><strong>GIF</strong><span>README</span></div>
        <div class="pipeline-node"><strong>PNG</strong><span>poster</span></div>
      </div>
    </section>

    <section class="quickstart" id="quickstart">
      <div class="quickstart-copy">
        <span class="section-kicker">QUICK START</span>
        <h2>Give Codex a concept.<br/>Let the skill direct the animation.</h2>
        <p>Clone the repository and Codex can discover the repo-level skill automatically from <code>.agents/skills/loop-animation</code>.</p>
      </div>
      <div class="code-panel"><pre><code>git clone https://github.com/kevin-luo/loop-animation.git
cd loop-animation
npm install
npm run dev</code></pre></div>
    </section>

    <footer class="gallery-footer">
      <span>Loop Animation · MIT</span>
      <span>Don't animate text. Animate ideas.</span>
    </footer>
  </main>
`;
