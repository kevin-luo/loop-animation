import * as THREE from 'three';
import { DeterministicTimeline, easeInOutCubic, segment } from '../../runtime/animation';
import { getLanguage, persistLanguage, type AppLanguage } from '../../runtime/i18n';
import './style.css';

const DURATION = 16;
const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing #app');

let language: AppLanguage = getLanguage();
let playing = false;

const copy = {
  zh: {
    title: 'DNS 是怎么找到网站的？',
    subtitle: '输入域名后，浏览器必须先拿到服务器的 IP 地址。',
    stages: [
      '浏览器把域名交给递归解析器',
      '解析器沿 DNS 层级逐级询问',
      '权威 DNS 返回最终 IP',
      'IP 沿原路返回，并可以被缓存',
    ],
    descriptions: [
      'example.com 只是方便人记忆的名字，网络真正通信时仍然需要 IP。',
      'Root 指向 .com，TLD 再指向真正负责 example.com 的权威服务器。',
      '权威服务器保存最终记录：example.com 对应 93.184.216.34。',
      '解析结果返回浏览器。下一次访问时，缓存可以省掉一部分查询。',
    ],
    nodeSub: ['example.com', '递归查询 + 缓存', '寻找 .com', '寻找 example.com', '最终记录'],
    play: '播放', pause: '暂停', lang: 'EN', result: '解析完成',
  },
  en: {
    title: 'How does DNS find a website?',
    subtitle: 'Before connecting, the browser first needs the server IP behind the domain name.',
    stages: [
      'The browser asks a recursive resolver',
      'The resolver walks the DNS hierarchy',
      'The authoritative server returns the IP',
      'The answer travels back and can be cached',
    ],
    descriptions: [
      'example.com is a human-friendly name. The network still needs an IP address to connect.',
      'Root points to .com, then the TLD points to the authoritative server for example.com.',
      'The authoritative server owns the final record: example.com → 93.184.216.34.',
      'The result returns to the browser. Caching can skip part of this lookup next time.',
    ],
    nodeSub: ['example.com', 'recursive + cache', 'find .com', 'find example.com', 'final record'],
    play: 'Play', pause: 'Pause', lang: '中文', result: 'Resolved',
  },
} as const;

root.innerHTML = `
  <main class="dns-experience">
    <canvas id="dns-scene" aria-label="DNS resolution Three.js animation"></canvas>
    <div class="dns-noise"></div>
    <div class="dns-vignette"></div>
    <header class="dns-hud">
      <div class="eyebrow">Loop Animation · Network Flow</div>
      <h1 id="dns-title"></h1>
      <p id="dns-subtitle"></p>
    </header>
    <button id="dns-language" class="demo-language" type="button" data-export-hide></button>
    <div id="dns-stage" class="stage-label"></div>
    <div id="dns-result" class="dns-result">
      <span id="dns-result-label"></span>
      <strong>example.com</strong><i>→</i><b>93.184.216.34</b>
    </div>
    <div id="dns-hop" class="dns-hop"><span>QUERY</span><b>01 / 04</b></div>
    <footer class="dns-controls" data-export-hide>
      <button id="dns-toggle" type="button"></button>
      <input id="dns-scrubber" type="range" min="0" max="${DURATION}" step="0.01" value="0" />
      <span id="dns-time">0.0 / ${DURATION}s</span>
    </footer>
  </main>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#dns-scene')!;
const title = document.querySelector<HTMLElement>('#dns-title')!;
const subtitle = document.querySelector<HTMLElement>('#dns-subtitle')!;
const stage = document.querySelector<HTMLElement>('#dns-stage')!;
const result = document.querySelector<HTMLElement>('#dns-result')!;
const resultLabel = document.querySelector<HTMLElement>('#dns-result-label')!;
const hop = document.querySelector<HTMLElement>('#dns-hop')!;
const hopType = hop.querySelector('span')!;
const hopIndex = hop.querySelector('b')!;
const languageButton = document.querySelector<HTMLButtonElement>('#dns-language')!;
const toggle = document.querySelector<HTMLButtonElement>('#dns-toggle')!;
const scrubber = document.querySelector<HTMLInputElement>('#dns-scrubber')!;
const timeLabel = document.querySelector<HTMLElement>('#dns-time')!;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#05070c');
scene.fog = new THREE.FogExp2('#05070c', 0.021);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(0, 3.2, 17.8);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true;

scene.add(new THREE.AmbientLight('#627089', 0.42));
const rimLight = new THREE.DirectionalLight('#b9d8ff', 2.8);
rimLight.position.set(-7, 10, 8);
scene.add(rimLight);
const fillLight = new THREE.DirectionalLight('#6e6cff', 1.3);
fillLight.position.set(8, 4, 3);
scene.add(fillLight);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(34, 22),
  new THREE.MeshStandardMaterial({ color: '#080b10', roughness: 1, metalness: 0 }),
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -3.25;
floor.receiveShadow = true;
scene.add(floor);

const grid = new THREE.GridHelper(30, 30, '#163052', '#0c1725');
grid.position.y = -3.22;
(grid.material as THREE.Material).transparent = true;
(grid.material as THREE.Material).opacity = 0.22;
scene.add(grid);

function seeded(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = seeded(20260813);
const dustPositions = new Float32Array(520 * 3);
for (let i = 0; i < 520; i++) {
  dustPositions[i * 3] = (random() - .5) * 28;
  dustPositions[i * 3 + 1] = (random() - .35) * 13;
  dustPositions[i * 3 + 2] = (random() - .5) * 11;
}
const dustGeometry = new THREE.BufferGeometry();
dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: '#6e8db4', size: .025, transparent: true, opacity: .28 }));
scene.add(dust);

interface NetworkNode {
  id: string;
  title: string;
  position: THREE.Vector3;
  color: string;
  group: THREE.Group;
  core: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshStandardMaterial>;
  ring: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
  beam: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshBasicMaterial>;
  label: HTMLDivElement;
}

const nodeSpecs = [
  ['client', 'Browser', new THREE.Vector3(-6.6, -1.55, .4), '#67a8ff'],
  ['resolver', 'Resolver', new THREE.Vector3(-3.0, 1.35, -.2), '#7f89ff'],
  ['root', 'Root DNS', new THREE.Vector3(.9, 2.5, -.7), '#9f72ef'],
  ['tld', '.com TLD', new THREE.Vector3(5.0, .8, -.2), '#e2a364'],
  ['auth', 'Authoritative', new THREE.Vector3(3.6, -2.0, .55), '#58d398'],
] as const;

const labelLayer = document.createElement('div');
labelLayer.className = 'dns-label-layer';
document.querySelector('.dns-experience')!.append(labelLayer);

const nodes: NetworkNode[] = nodeSpecs.map(([id, nodeTitle, position, color], index) => {
  const group = new THREE.Group();
  group.position.copy(position);
  scene.add(group);

  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(.74, .86, .16, 40),
    new THREE.MeshStandardMaterial({ color: '#111822', roughness: .35, metalness: .58 }),
  );
  pedestal.position.y = -.5;
  pedestal.receiveShadow = true;
  group.add(pedestal);

  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(.48, .54, 1.03 + index * .04, 36),
    new THREE.MeshStandardMaterial({ color, roughness: .25, metalness: .42, emissive: color, emissiveIntensity: .06 }),
  );
  core.castShadow = true;
  group.add(core);

  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(.38, .44, .055, 36),
    new THREE.MeshBasicMaterial({ color: '#e9f3ff', transparent: true, opacity: .52 }),
  );
  cap.position.y = .55;
  group.add(cap);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(.78, .022, 12, 64),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .28 }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -.41;
  group.add(ring);

  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(.02, .08, 2.1, 14, 1, true),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .035, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  beam.position.y = 1.05;
  group.add(beam);

  const label = document.createElement('div');
  label.className = 'dns-node-label';
  label.innerHTML = `<strong>${nodeTitle}</strong><span></span>`;
  labelLayer.append(label);

  return { id, title: nodeTitle, position, color, group, core, ring, beam, label };
});

const requestOrder = [0, 1, 2, 3, 4];
const responseOrder = [4, 1, 0];

type Route = { curve: THREE.QuadraticBezierCurve3; mesh: THREE.Mesh<THREE.TubeGeometry, THREE.MeshBasicMaterial>; from: number; to: number };

function buildCurve(from: number, to: number, bend: number, color = '#5d84b6'): Route {
  const a = nodes[from].position.clone();
  const b = nodes[to].position.clone();
  const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(.5);
  mid.y += bend;
  mid.z += 1.0 + Math.abs(to - from) * .12;
  const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 48, .026, 8, false),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .14, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  scene.add(mesh);
  return { curve, mesh, from, to };
}

const requestRoutes: Route[] = [
  buildCurve(0, 1, .85),
  buildCurve(1, 2, .7),
  buildCurve(2, 3, .8),
  buildCurve(3, 4, .75),
];
const responseRoutes: Route[] = [
  buildCurve(4, 1, 1.1, '#55d99a'),
  buildCurve(1, 0, .7, '#55d99a'),
];

const packetGroup = new THREE.Group();
scene.add(packetGroup);
const packetOuter = new THREE.Mesh(
  new THREE.IcosahedronGeometry(.2, 1),
  new THREE.MeshBasicMaterial({ color: '#eaf5ff', transparent: true, opacity: .92 }),
);
packetGroup.add(packetOuter);
const packetShell = new THREE.Mesh(
  new THREE.IcosahedronGeometry(.34, 1),
  new THREE.MeshBasicMaterial({ color: '#71b7ff', wireframe: true, transparent: true, opacity: .22, blending: THREE.AdditiveBlending }),
);
packetGroup.add(packetShell);
const packetLight = new THREE.PointLight('#70b7ff', 7, 5, 2);
packetGroup.add(packetLight);

const trail = Array.from({ length: 14 }, (_, i) => {
  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(.055 + (13 - i) * .002, 10, 10),
    new THREE.MeshBasicMaterial({ color: '#70b7ff', transparent: true, opacity: .28 * (1 - i / 14), blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  scene.add(dot);
  return dot;
});

const impactRing = new THREE.Mesh(
  new THREE.RingGeometry(.32, .36, 48),
  new THREE.MeshBasicMaterial({ color: '#eef7ff', transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }),
);
impactRing.rotation.x = -Math.PI / 2;
scene.add(impactRing);

function routePoint(routes: Route[], progress: number) {
  const p = Math.max(0, Math.min(.999999, progress));
  const scaled = p * routes.length;
  const routeIndex = Math.floor(scaled);
  const local = scaled - routeIndex;
  return { point: routes[Math.min(routes.length - 1, routeIndex)].curve.getPoint(local), routeIndex, local };
}

function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / Math.max(1, height);
  camera.updateProjectionMatrix();
}

function project(position: THREE.Vector3, element: HTMLElement) {
  const p = position.clone();
  p.y += .88;
  p.project(camera);
  element.style.transform = `translate(${(p.x * .5 + .5) * canvas.clientWidth}px, ${(-p.y * .5 + .5) * canvas.clientHeight}px)`;
}

function currentPhase(time: number) {
  if (time < 3.2) return 0;
  if (time < 8.2) return 1;
  if (time < 11.1) return 2;
  return 3;
}

function applyLanguage() {
  const t = copy[language];
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  title.textContent = t.title;
  languageButton.textContent = t.lang;
  resultLabel.textContent = t.result;
  toggle.textContent = playing ? t.pause : t.play;
  nodes.forEach((node, i) => {
    const sub = node.label.querySelector('span');
    if (sub) sub.textContent = t.nodeSub[i];
  });
  const phase = currentPhase(Number(scrubber.value));
  stage.textContent = `${phase + 1} · ${t.stages[phase]}`;
  subtitle.textContent = t.descriptions[phase];
}

function renderScene(time: number) {
  resize();
  const intro = easeInOutCubic(segment(time, 0, 1.8));
  const requestProgress = easeInOutCubic(segment(time, 1.6, 10.2));
  const responseProgress = easeInOutCubic(segment(time, 10.45, 14.85));
  const response = time >= 10.45;
  const routes = response ? responseRoutes : requestRoutes;
  const progress = response ? responseProgress : requestProgress;
  const routeState = routePoint(routes, progress);

  packetGroup.visible = time >= .9 && time <= 15.1;
  packetGroup.position.copy(routeState.point);
  packetGroup.rotation.y = time * 2.5;
  packetGroup.rotation.x = time * 1.25;
  packetShell.scale.setScalar(1 + Math.sin(time * 5) * .1);
  (packetShell.material as THREE.MeshBasicMaterial).color.set(response ? '#58d99b' : '#72b8ff');
  packetLight.color.set(response ? '#58d99b' : '#72b8ff');

  trail.forEach((dot, i) => {
    const delayed = Math.max(0, progress - (i + 1) * .012);
    const state = routePoint(routes, delayed);
    dot.position.copy(state.point);
    dot.visible = packetGroup.visible && delayed > 0;
    (dot.material as THREE.MeshBasicMaterial).color.set(response ? '#58d99b' : '#72b8ff');
  });

  [...requestRoutes, ...responseRoutes].forEach((route) => {
    route.mesh.material.opacity = .07;
  });
  routes.forEach((route, i) => {
    route.mesh.material.opacity = i < routeState.routeIndex ? .24 : i === routeState.routeIndex ? .72 : .11;
  });

  const activeNodeIndex = response
    ? responseOrder[Math.min(responseOrder.length - 1, routeState.routeIndex + (routeState.local > .72 ? 1 : 0))]
    : requestOrder[Math.min(requestOrder.length - 1, routeState.routeIndex + (routeState.local > .72 ? 1 : 0))];

  nodes.forEach((node, index) => {
    const active = index === activeNodeIndex;
    const pulse = active ? .5 + .5 * Math.sin(time * 6) : 0;
    node.core.material.emissiveIntensity = .05 + (active ? .38 + pulse * .09 : 0);
    node.group.scale.setScalar(active ? 1.06 + pulse * .025 : 1);
    node.ring.scale.setScalar(active ? 1.05 + pulse * .18 : 1);
    node.ring.material.opacity = active ? .48 + pulse * .26 : .16;
    node.beam.material.opacity = active ? .08 + pulse * .06 : .018;
  });

  const hitPulse = Math.max(0, 1 - Math.abs(routeState.local - .985) * 16);
  impactRing.visible = hitPulse > 0.01;
  impactRing.position.copy(nodes[activeNodeIndex].position);
  impactRing.position.y = -2.72;
  impactRing.scale.setScalar(.8 + (1 - hitPulse) * 2.5);
  (impactRing.material as THREE.MeshBasicMaterial).opacity = hitPulse * .58;

  const phase = currentPhase(time);
  const t = copy[language];
  stage.textContent = `${phase + 1} · ${t.stages[phase]}`;
  subtitle.textContent = t.descriptions[phase];

  const resultReveal = easeInOutCubic(segment(time, 8.9, 10.6));
  result.style.opacity = String(resultReveal);
  result.style.transform = `translate(-50%, ${16 - resultReveal * 16}px) scale(${.96 + resultReveal * .04})`;

  hopType.textContent = response ? 'RESPONSE' : 'QUERY';
  hopIndex.textContent = `${String(routeState.routeIndex + 1).padStart(2, '0')} / ${String(routes.length).padStart(2, '0')}`;
  hop.dataset.mode = response ? 'response' : 'query';

  const focusX = routeState.point.x * .045;
  camera.position.x = focusX;
  camera.position.y = 3.8 - intro * .65 + Math.sin(time * .15) * .08;
  camera.position.z = 19.1 - intro * 1.45;
  camera.lookAt(.1 + focusX * .18, -.25, 0);
  dust.rotation.y = time * .003;

  renderer.render(scene, camera);
  nodes.forEach((node) => project(node.position, node.label));
  scrubber.value = String(time);
  timeLabel.textContent = `${time.toFixed(1)} / ${DURATION}s`;
}

const controller = new DeterministicTimeline({
  duration: DURATION,
  qaTimes: [0, 1.6, 3.2, 5.2, 8.2, 9.7, 10.5, 12.6, 15.8],
  onRender: renderScene,
  onPlayStateChange(value) {
    playing = value;
    toggle.textContent = value ? copy[language].pause : copy[language].play;
  },
});
window.__LOOP_ANIMATION__ = controller;

languageButton.addEventListener('click', () => {
  language = language === 'zh' ? 'en' : 'zh';
  persistLanguage(language);
  const url = new URL(window.location.href);
  url.searchParams.set('lang', language);
  history.replaceState({}, '', url);
  applyLanguage();
  controller.renderAt(Number(scrubber.value));
});

toggle.addEventListener('click', () => playing ? controller.pause() : controller.play());
scrubber.addEventListener('input', () => controller.seek(Number(scrubber.value)));
window.addEventListener('resize', () => controller.renderAt(Number(scrubber.value)));
applyLanguage();
controller.renderAt(0);
