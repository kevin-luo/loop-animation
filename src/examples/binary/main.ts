import * as THREE from 'three';
import { DeterministicTimeline, easeInOutCubic, lerp, segment } from '../../runtime/animation';
import { getLanguage, persistLanguage, type AppLanguage } from '../../runtime/i18n';
import './style.css';

const DURATION = 15;
const values = [4, 9, 13, 18, 22, 27, 31, 38, 44, 51, 57, 63, 68, 73, 79, 84, 91];
const targetIndex = 13;
const targetValue = values[targetIndex];

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing #app');

let language: AppLanguage = getLanguage();
let playing = false;

const copy = {
  zh: {
    title: '为什么二分查找这么快？',
    intro: `目标数字：${targetValue}。每次比较，都能直接砍掉一半搜索范围。`,
    found: `17 个候选，只比较 4 次就锁定了 ${targetValue}。`,
    stages: [
      '先看全部 17 个有序候选',
      '44 < 73：左半区全部淘汰',
      '68 < 73：搜索范围再次减半',
      '79 > 73：右侧淘汰，锁定 73',
    ],
    comparisons: '比较次数', remaining: '剩余候选', play: '播放', pause: '暂停', lang: 'EN', target: 'TARGET',
  },
  en: {
    title: 'Why is binary search so fast?',
    intro: `Target: ${targetValue}. Every comparison can eliminate half of the remaining search space.`,
    found: `Only 4 comparisons were needed to find ${targetValue} among 17 candidates.`,
    stages: [
      'Start with all 17 sorted candidates',
      '44 < 73: discard the entire left half',
      '68 < 73: halve the search space again',
      '79 > 73: discard the right side and lock 73',
    ],
    comparisons: 'comparisons', remaining: 'remaining', play: 'Play', pause: 'Pause', lang: '中文', target: 'TARGET',
  },
} as const;

root.innerHTML = `
  <main class="binary-experience">
    <canvas id="binary-scene" aria-label="Binary search Three.js animation"></canvas>
    <div class="binary-grid-overlay"></div>
    <div class="binary-vignette"></div>
    <header class="binary-hud">
      <div class="eyebrow">Loop Animation · Algorithm Process</div>
      <h1 id="binary-title"></h1>
      <p id="binary-subtitle"></p>
    </header>
    <button id="binary-language" class="demo-language" type="button" data-export-hide></button>
    <div id="binary-stage" class="stage-label"></div>
    <div class="binary-target"><span id="binary-target-label">TARGET</span><b>${targetValue}</b></div>
    <div id="binary-stats" class="binary-stats">
      <div><span id="comparisons-label"></span><b id="comparisons-value">0</b></div>
      <div><span id="remaining-label"></span><b id="remaining-value">17</b></div>
    </div>
    <footer class="binary-controls" data-export-hide>
      <button id="binary-toggle" type="button"></button>
      <input id="binary-scrubber" type="range" min="0" max="${DURATION}" step="0.01" value="0" />
      <span id="binary-time">0.0 / ${DURATION}s</span>
    </footer>
  </main>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#binary-scene')!;
const title = document.querySelector<HTMLElement>('#binary-title')!;
const subtitle = document.querySelector<HTMLElement>('#binary-subtitle')!;
const stage = document.querySelector<HTMLElement>('#binary-stage')!;
const comparisonsLabel = document.querySelector<HTMLElement>('#comparisons-label')!;
const remainingLabel = document.querySelector<HTMLElement>('#remaining-label')!;
const comparisonsValue = document.querySelector<HTMLElement>('#comparisons-value')!;
const remainingValue = document.querySelector<HTMLElement>('#remaining-value')!;
const targetLabel = document.querySelector<HTMLElement>('#binary-target-label')!;
const languageButton = document.querySelector<HTMLButtonElement>('#binary-language')!;
const toggle = document.querySelector<HTMLButtonElement>('#binary-toggle')!;
const scrubber = document.querySelector<HTMLInputElement>('#binary-scrubber')!;
const timeLabel = document.querySelector<HTMLElement>('#binary-time')!;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#06080c');
scene.fog = new THREE.FogExp2('#06080c', 0.024);

const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 100);
camera.position.set(0, 6.7, 17.8);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

scene.add(new THREE.AmbientLight('#60728a', .45));
const keyLight = new THREE.DirectionalLight('#dce9ff', 2.8);
keyLight.position.set(-6, 10, 8);
scene.add(keyLight);
const blueLight = new THREE.PointLight('#528fff', 16, 18, 2);
blueLight.position.set(0, 4.2, 2.5);
scene.add(blueLight);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(34, 20),
  new THREE.MeshStandardMaterial({ color: '#080b10', roughness: .78, metalness: .2 }),
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1.65;
floor.receiveShadow = true;
scene.add(floor);

const grid = new THREE.GridHelper(30, 30, '#183052', '#0d1724');
grid.position.y = -1.63;
(grid.material as THREE.Material).transparent = true;
(grid.material as THREE.Material).opacity = .24;
scene.add(grid);

function seeded(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = seeded(7313);
const particlePositions = new Float32Array(360 * 3);
for (let i = 0; i < 360; i++) {
  particlePositions[i * 3] = (random() - .5) * 26;
  particlePositions[i * 3 + 1] = random() * 9 - 1;
  particlePositions[i * 3 + 2] = (random() - .5) * 8;
}
const particleGeometry = new THREE.BufferGeometry();
particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ color: '#6888b4', size: .022, transparent: true, opacity: .2 }));
scene.add(particles);

const labelsLayer = document.createElement('div');
labelsLayer.className = 'binary-label-layer';
document.querySelector('.binary-experience')!.append(labelsLayer);

interface TileItem {
  group: THREE.Group;
  tile: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
  cap: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>;
  label: HTMLDivElement;
  x: number;
}

const spacing = .79;
const startX = -((values.length - 1) * spacing) / 2;
const tiles: TileItem[] = values.map((value, index) => {
  const group = new THREE.Group();
  const x = startX + index * spacing;
  group.position.set(x, 0, 0);
  scene.add(group);

  const tile = new THREE.Mesh(
    new THREE.BoxGeometry(.6, .74, 1.15),
    new THREE.MeshStandardMaterial({ color: '#36577f', roughness: .34, metalness: .38, transparent: true, opacity: .96, emissive: '#183455', emissiveIntensity: .08 }),
  );
  tile.castShadow = true;
  group.add(tile);

  const cap = new THREE.Mesh(
    new THREE.BoxGeometry(.48, .035, .88),
    new THREE.MeshBasicMaterial({ color: '#9fc9ff', transparent: true, opacity: .22, blending: THREE.AdditiveBlending }),
  );
  cap.position.y = .39;
  group.add(cap);

  const label = document.createElement('div');
  label.className = 'binary-value';
  label.textContent = String(value);
  labelsLayer.append(label);
  return { group, tile, cap, label, x };
});

const rangePlate = new THREE.Mesh(
  new THREE.BoxGeometry(1, .055, 1.64),
  new THREE.MeshBasicMaterial({ color: '#4c94ff', transparent: true, opacity: .09, blending: THREE.AdditiveBlending, depthWrite: false }),
);
rangePlate.position.y = -.48;
scene.add(rangePlate);

const rangeEdge = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1, .08, 1.7)),
  new THREE.LineBasicMaterial({ color: '#6aa7ff', transparent: true, opacity: .5 }),
);
rangeEdge.position.y = -.45;
scene.add(rangeEdge);

const scanner = new THREE.Group();
scene.add(scanner);
const scanBeam = new THREE.Mesh(
  new THREE.CylinderGeometry(.018, .075, 5.4, 14, 1, true),
  new THREE.MeshBasicMaterial({ color: '#ffbf68', transparent: true, opacity: .15, blending: THREE.AdditiveBlending, depthWrite: false }),
);
scanBeam.position.y = 2.3;
scanner.add(scanBeam);
const scanRing = new THREE.Mesh(
  new THREE.TorusGeometry(.48, .027, 12, 64),
  new THREE.MeshBasicMaterial({ color: '#ffbd69', transparent: true, opacity: .65, blending: THREE.AdditiveBlending }),
);
scanRing.rotation.x = Math.PI / 2;
scanRing.position.y = -.53;
scanner.add(scanRing);
const scanLight = new THREE.PointLight('#ffae58', 9, 5, 2);
scanLight.position.y = 1.1;
scanner.add(scanLight);

const foundRing = new THREE.Mesh(
  new THREE.TorusGeometry(.62, .045, 14, 72),
  new THREE.MeshBasicMaterial({ color: '#5ee29c', transparent: true, opacity: 0, blending: THREE.AdditiveBlending }),
);
foundRing.rotation.x = Math.PI / 2;
foundRing.position.set(tiles[targetIndex].x, -.53, .02);
scene.add(foundRing);
const foundLight = new THREE.PointLight('#59dd98', 0, 6, 2);
foundLight.position.set(tiles[targetIndex].x, 1, 1);
scene.add(foundLight);

const searchSteps = [
  { start: 0, end: 16, pivot: 8, comparisons: 1, enter: 0, settle: 2.9 },
  { start: 9, end: 16, pivot: 12, comparisons: 2, enter: 3.2, settle: 5.9 },
  { start: 13, end: 16, pivot: 14, comparisons: 3, enter: 6.3, settle: 8.9 },
  { start: 13, end: 13, pivot: 13, comparisons: 4, enter: 9.3, settle: 11.1 },
] as const;

function currentStep(time: number) {
  if (time < 3.2) return 0;
  if (time < 6.3) return 1;
  if (time < 9.3) return 2;
  return 3;
}

function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / Math.max(1, height);
  camera.updateProjectionMatrix();
}

function project(item: TileItem) {
  const p = new THREE.Vector3();
  item.group.getWorldPosition(p);
  p.y += .72;
  p.project(camera);
  item.label.style.transform = `translate(${(p.x * .5 + .5) * canvas.clientWidth}px, ${(-p.y * .5 + .5) * canvas.clientHeight}px)`;
}

function applyLanguage() {
  const t = copy[language];
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  title.textContent = t.title;
  languageButton.textContent = t.lang;
  comparisonsLabel.textContent = t.comparisons;
  remainingLabel.textContent = t.remaining;
  targetLabel.textContent = t.target;
  toggle.textContent = playing ? t.pause : t.play;
}

function renderScene(time: number) {
  resize();
  const intro = easeInOutCubic(segment(time, 0, 1.6));
  const step = currentStep(time);
  const state = searchSteps[step];
  const blend = easeInOutCubic(segment(time, state.enter, state.settle));
  const t = copy[language];

  const width = (state.end - state.start + 1) * spacing;
  const center = (tiles[state.start].x + tiles[state.end].x) * .5;
  rangePlate.position.x = center;
  rangePlate.scale.x = width;
  rangePlate.material.opacity = .08 + Math.sin(time * 2.4) * .015;
  rangeEdge.position.x = center;
  rangeEdge.scale.x = width;

  const pivotX = tiles[state.pivot].x;
  scanner.position.x = pivotX;
  const scanPulse = .5 + .5 * Math.sin(time * 5.4);
  scanRing.scale.setScalar(.9 + scanPulse * .14);
  (scanRing.material as THREE.MeshBasicMaterial).opacity = step === 3 ? .18 : .42 + scanPulse * .22;
  (scanBeam.material as THREE.MeshBasicMaterial).opacity = step === 3 ? .035 : .08 + scanPulse * .08;
  scanLight.intensity = step === 3 ? 1.2 : 6 + scanPulse * 4;

  tiles.forEach((item, index) => {
    const active = index >= state.start && index <= state.end;
    const pivot = index === state.pivot;
    const found = step === 3 && index === targetIndex;

    if (!active) {
      const rejectedDepth = 1.15 + (index % 3) * .12;
      item.group.position.y = lerp(0, -1.18, blend);
      item.group.position.z = lerp(0, rejectedDepth, blend);
      item.group.rotation.x = lerp(0, -.38, blend);
      item.tile.material.color.set('#1d2734');
      item.tile.material.emissive.set('#000000');
      item.tile.material.emissiveIntensity = 0;
      item.tile.material.opacity = .16 + (1 - blend) * .56;
      item.cap.material.opacity = .025 + (1 - blend) * .14;
      item.label.style.opacity = String(.1 + (1 - blend) * .5);
    } else if (found) {
      const success = easeInOutCubic(segment(time, 9.6, 11.1));
      item.group.position.y = success * .23;
      item.group.position.z = 0;
      item.group.rotation.x = 0;
      item.group.scale.setScalar(1 + success * .18 + Math.sin(time * 4.5) * .02);
      item.tile.material.color.set('#3ab779');
      item.tile.material.emissive.set('#2aa76d');
      item.tile.material.emissiveIntensity = .38;
      item.tile.material.opacity = 1;
      item.cap.material.color.set('#a9ffd2');
      item.cap.material.opacity = .72;
      item.label.style.opacity = '1';
    } else if (pivot) {
      item.group.position.y = .11 + scanPulse * .035;
      item.group.position.z = 0;
      item.group.rotation.x = 0;
      item.group.scale.setScalar(1.08 + scanPulse * .025);
      item.tile.material.color.set('#d38e43');
      item.tile.material.emissive.set('#a7672e');
      item.tile.material.emissiveIntensity = .3;
      item.tile.material.opacity = 1;
      item.cap.material.color.set('#ffe0a5');
      item.cap.material.opacity = .62;
      item.label.style.opacity = '1';
    } else {
      item.group.position.y = 0;
      item.group.position.z = 0;
      item.group.rotation.x = 0;
      item.group.scale.setScalar(1);
      item.tile.material.color.set('#38648f');
      item.tile.material.emissive.set('#1d436c');
      item.tile.material.emissiveIntensity = .11;
      item.tile.material.opacity = .94;
      item.cap.material.color.set('#93c5ff');
      item.cap.material.opacity = .24;
      item.label.style.opacity = '.72';
    }
  });

  const found = easeInOutCubic(segment(time, 9.6, 11.15));
  foundRing.material.opacity = found * (.58 + Math.sin(time * 4.5) * .12);
  foundRing.scale.setScalar(.75 + found * .55);
  foundLight.intensity = found * 11;

  stage.textContent = `${step + 1} · ${t.stages[step]}`;
  subtitle.textContent = step === 3 ? t.found : t.intro;
  comparisonsValue.textContent = String(state.comparisons);
  remainingValue.textContent = String(state.end - state.start + 1);

  const focus = easeInOutCubic(segment(time, 2.6, 11.1));
  camera.position.x = center * .12 * focus;
  camera.position.y = 7.4 - intro * .72 - found * .3;
  camera.position.z = 19.1 - intro * 1.35 - found * .8;
  camera.lookAt(center * .15, -.05, 0);
  particles.rotation.y = time * .0025;

  renderer.render(scene, camera);
  tiles.forEach(project);
  scrubber.value = String(time);
  timeLabel.textContent = `${time.toFixed(1)} / ${DURATION}s`;
}

const controller = new DeterministicTimeline({
  duration: DURATION,
  qaTimes: [0, 2.8, 3.3, 5.8, 6.4, 8.8, 9.4, 10.8, 14.8],
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
