import * as THREE from 'three';
import { DeterministicTimeline, easeInOutCubic, segment } from '../../runtime/animation';
import './style.css';

const DURATION = 16;
const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing #app');

root.innerHTML = `
  <main class="dns-experience">
    <canvas id="dns-scene" aria-label="DNS resolution Three.js animation"></canvas>
    <div class="dns-vignette"></div>
    <header class="hud hud--top dns-hud">
      <div class="eyebrow">Loop Animation · Network Flow</div>
      <h1>DNS 是怎么找到网站的？</h1>
      <p id="dns-subtitle">输入一个域名后，浏览器需要先把它翻译成服务器的 IP 地址。</p>
    </header>
    <div id="dns-stage" class="stage-label">先从浏览器发出查询</div>
    <div id="dns-result" class="dns-result">example.com → <b>93.184.216.34</b></div>
    <footer class="dns-controls" data-export-hide>
      <button id="dns-toggle" type="button">播放</button>
      <input id="dns-scrubber" type="range" min="0" max="${DURATION}" step="0.01" value="0" />
      <span id="dns-time">0.0 / ${DURATION}s</span>
    </footer>
  </main>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#dns-scene')!;
const subtitle = document.querySelector<HTMLElement>('#dns-subtitle')!;
const stage = document.querySelector<HTMLElement>('#dns-stage')!;
const result = document.querySelector<HTMLElement>('#dns-result')!;
const toggle = document.querySelector<HTMLButtonElement>('#dns-toggle')!;
const scrubber = document.querySelector<HTMLInputElement>('#dns-scrubber')!;
const timeLabel = document.querySelector<HTMLElement>('#dns-time')!;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#06080d');
scene.fog = new THREE.FogExp2('#06080d', 0.025);

const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 100);
camera.position.set(0, 1.2, 16.5);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
scene.add(new THREE.AmbientLight('#7b8baa', 0.7));
const key = new THREE.DirectionalLight('#dbe7ff', 2.1);
key.position.set(-3, 6, 7);
scene.add(key);

const grid = new THREE.GridHelper(26, 26, '#1d2d47', '#101823');
grid.position.y = -3.6;
grid.material.opacity = 0.28;
grid.material.transparent = true;
scene.add(grid);

interface NetworkNode {
  id: string;
  title: string;
  subtitle: string;
  position: THREE.Vector3;
  color: string;
  mesh: THREE.Mesh;
  label: HTMLDivElement;
}

const nodeSpecs = [
  ['client', 'Browser', 'example.com', new THREE.Vector3(-6.4, -1.8, 0), '#6ca8ff'],
  ['resolver', 'Resolver', 'cache + recursive query', new THREE.Vector3(-2.7, 1.6, 0), '#8b9dff'],
  ['root', 'Root DNS', 'where is .com?', new THREE.Vector3(1.0, 2.8, 0), '#9b87f5'],
  ['tld', '.com TLD', 'where is example.com?', new THREE.Vector3(5.0, 1.0, 0), '#e3a86b'],
  ['auth', 'Authoritative', '93.184.216.34', new THREE.Vector3(3.4, -2.4, 0), '#68d9a0'],
] as const;

const labelsLayer = document.createElement('div');
labelsLayer.className = 'dns-label-layer';
document.querySelector('.dns-experience')!.append(labelsLayer);

const nodes: NetworkNode[] = nodeSpecs.map(([id, title, sub, position, color]) => {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.65, 1.02, 0.74),
    new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.08 }),
  );
  mesh.position.copy(position);
  scene.add(mesh);

  const halo = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 1.24, 0.82),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.06, wireframe: true }),
  );
  halo.position.copy(position);
  scene.add(halo);

  const label = document.createElement('div');
  label.className = 'dns-node-label';
  label.innerHTML = `<strong>${title}</strong><span>${sub}</span>`;
  labelsLayer.append(label);
  return { id, title, subtitle: sub, position, color, mesh, label };
});

const requestPath = [nodes[0].position, nodes[1].position, nodes[2].position, nodes[3].position, nodes[4].position];
const responsePath = [nodes[4].position, nodes[1].position, nodes[0].position];

function makeConnection(a: THREE.Vector3, b: THREE.Vector3) {
  const geometry = new THREE.BufferGeometry().setFromPoints([a, b]);
  const material = new THREE.LineBasicMaterial({ color: '#6f88aa', transparent: true, opacity: 0.18 });
  const line = new THREE.Line(geometry, material);
  scene.add(line);
  return line;
}

for (let i = 0; i < requestPath.length - 1; i++) makeConnection(requestPath[i], requestPath[i + 1]);
makeConnection(nodes[4].position, nodes[1].position);
makeConnection(nodes[1].position, nodes[0].position);

const packet = new THREE.Mesh(
  new THREE.SphereGeometry(0.16, 24, 24),
  new THREE.MeshBasicMaterial({ color: '#eaf4ff' }),
);
scene.add(packet);
const packetGlow = new THREE.PointLight('#72b7ff', 5, 4, 2);
scene.add(packetGlow);

const trail: THREE.Mesh[] = Array.from({ length: 8 }, (_, index) => {
  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 12, 12),
    new THREE.MeshBasicMaterial({ color: '#72b7ff', transparent: true, opacity: 0.35 - index * 0.035 }),
  );
  scene.add(dot);
  return dot;
});

function pointOnPath(points: THREE.Vector3[], progress: number) {
  const p = Math.min(0.999999, Math.max(0, progress));
  const scaled = p * (points.length - 1);
  const index = Math.floor(scaled);
  const local = scaled - index;
  return new THREE.Vector3().lerpVectors(points[index], points[Math.min(points.length - 1, index + 1)], local);
}

function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / Math.max(1, height);
  camera.updateProjectionMatrix();
}

function project(position: THREE.Vector3, element: HTMLElement) {
  const p = position.clone().project(camera);
  element.style.transform = `translate(${(p.x * .5 + .5) * canvas.clientWidth}px, ${(-p.y * .5 + .5) * canvas.clientHeight}px)`;
}

function setCopy(time: number) {
  if (time < 3) {
    stage.textContent = '1 · 浏览器先问递归解析器';
    subtitle.textContent = 'DNS 的任务，是把 example.com 这样的名字翻译成 IP 地址。';
  } else if (time < 7) {
    stage.textContent = '2 · Resolver 沿着 DNS 层级继续问';
    subtitle.textContent = 'Root 告诉它去问 .com，TLD 再指向真正负责这个域名的权威服务器。';
  } else if (time < 11) {
    stage.textContent = '3 · 权威服务器给出最终 IP';
    subtitle.textContent = '权威 DNS 保存最终记录：example.com 对应 93.184.216.34。';
  } else {
    stage.textContent = '4 · IP 返回浏览器，并被缓存';
    subtitle.textContent = '下一次再访问时，缓存可以让整个查找过程更快。';
  }
}

function renderScene(time: number) {
  resize();
  const intro = easeInOutCubic(segment(time, 0, 2));
  const requestProgress = easeInOutCubic(segment(time, 2, 10.2));
  const responseProgress = easeInOutCubic(segment(time, 10.2, 14.8));
  const isResponse = time >= 10.2;
  const activePath = isResponse ? responsePath : requestPath;
  const activeProgress = isResponse ? responseProgress : requestProgress;
  const current = pointOnPath(activePath, activeProgress);

  packet.visible = time >= 1.1 && time <= 15.2;
  packet.position.copy(current);
  packetGlow.position.copy(current);
  packetGlow.intensity = packet.visible ? 5 : 0;

  trail.forEach((dot, index) => {
    const delayed = Math.max(0, activeProgress - (index + 1) * 0.018);
    dot.visible = packet.visible && delayed > 0;
    dot.position.copy(pointOnPath(activePath, delayed));
  });

  nodes.forEach((node, index) => {
    const material = node.mesh.material as THREE.MeshStandardMaterial;
    const phase = Math.max(0, 1 - Math.abs(index / (nodes.length - 1) - requestProgress) * 5.5);
    const responsePulse = isResponse && (node.id === 'auth' || node.id === 'resolver' || node.id === 'client') ? Math.sin(time * 5) * 0.04 + 0.06 : 0;
    node.mesh.scale.setScalar(1 + phase * 0.09 + responsePulse);
    material.emissive.set(node.color);
    material.emissiveIntensity = 0.04 + phase * 0.26 + responsePulse;
  });

  result.style.opacity = String(segment(time, 9.6, 11.2));
  result.style.transform = `translate(-50%, ${12 - segment(time, 9.6, 11.2) * 12}px)`;
  camera.position.z = 17.8 - intro * 1.3;
  camera.position.y = 1.8 - intro * 0.7;
  camera.lookAt(0, -0.1, 0);
  setCopy(time);
  renderer.render(scene, camera);
  nodes.forEach((node) => project(node.position, node.label));
  scrubber.value = String(time);
  timeLabel.textContent = `${time.toFixed(1)} / ${DURATION}s`;
}

const controller = new DeterministicTimeline({
  duration: DURATION,
  qaTimes: [0, 2, 3, 6.8, 9.8, 10.4, 12.5, 15.8],
  onRender: renderScene,
  onPlayStateChange(playing) { toggle.textContent = playing ? '暂停' : '播放'; },
});
window.__LOOP_ANIMATION__ = controller;

toggle.addEventListener('click', () => toggle.textContent === '暂停' ? controller.pause() : controller.play());
scrubber.addEventListener('input', () => controller.seek(Number(scrubber.value)));
window.addEventListener('resize', () => controller.renderAt(Number(scrubber.value)));
controller.renderAt(0);
