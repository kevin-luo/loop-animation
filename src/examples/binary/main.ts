import * as THREE from 'three';
import { DeterministicTimeline, easeInOutCubic, segment } from '../../runtime/animation';
import './style.css';

const DURATION = 15;
const values = [4, 9, 13, 18, 22, 27, 31, 38, 44, 51, 57, 63, 68, 73, 79, 84, 91];
const targetIndex = 13;
const targetValue = values[targetIndex];

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing #app');

root.innerHTML = `
  <main class="binary-experience">
    <canvas id="binary-scene" aria-label="Binary search Three.js animation"></canvas>
    <div class="binary-vignette"></div>
    <header class="hud hud--top binary-hud">
      <div class="eyebrow">Loop Animation · Algorithm Process</div>
      <h1>为什么二分查找这么快？</h1>
      <p id="binary-subtitle">目标数字：<b>${targetValue}</b>。每比较一次，就能直接丢掉一半候选。</p>
    </header>
    <div id="binary-stage" class="stage-label">先看全部 17 个候选</div>
    <div id="binary-stats" class="binary-stats"><span>comparisons</span><b>0</b><i>/ 17</i></div>
    <footer class="binary-controls" data-export-hide>
      <button id="binary-toggle" type="button">播放</button>
      <input id="binary-scrubber" type="range" min="0" max="${DURATION}" step="0.01" value="0" />
      <span id="binary-time">0.0 / ${DURATION}s</span>
    </footer>
  </main>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#binary-scene')!;
const subtitle = document.querySelector<HTMLElement>('#binary-subtitle')!;
const stage = document.querySelector<HTMLElement>('#binary-stage')!;
const stats = document.querySelector<HTMLElement>('#binary-stats')!;
const statsValue = stats.querySelector('b')!;
const toggle = document.querySelector<HTMLButtonElement>('#binary-toggle')!;
const scrubber = document.querySelector<HTMLInputElement>('#binary-scrubber')!;
const timeLabel = document.querySelector<HTMLElement>('#binary-time')!;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#07090d');
scene.fog = new THREE.FogExp2('#07090d', 0.025);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(0, 7.1, 18.6);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
scene.add(new THREE.AmbientLight('#728099', 0.8));
const light = new THREE.DirectionalLight('#f3f6ff', 2.4);
light.position.set(-5, 9, 8);
scene.add(light);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(32, 15),
  new THREE.MeshStandardMaterial({ color: '#0b0f15', roughness: 1 }),
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.3;
floor.receiveShadow = true;
scene.add(floor);

const labelsLayer = document.createElement('div');
labelsLayer.className = 'binary-label-layer';
document.querySelector('.binary-experience')!.append(labelsLayer);

interface BarItem {
  mesh: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
  label: HTMLDivElement;
  x: number;
}

const spacing = 0.78;
const startX = -((values.length - 1) * spacing) / 2;
const bars: BarItem[] = values.map((value, index) => {
  const height = 1.05 + (value / 100) * 2.9;
  const material = new THREE.MeshStandardMaterial({ color: '#4e6b91', roughness: 0.62, transparent: true, opacity: 1 });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.56, height, 0.68), material);
  const x = startX + index * spacing;
  mesh.position.set(x, height / 2 - 0.28, 0);
  mesh.castShadow = true;
  scene.add(mesh);

  const label = document.createElement('div');
  label.className = 'binary-value';
  label.textContent = String(value);
  labelsLayer.append(label);
  return { mesh, label, x };
});

const targetRing = new THREE.Mesh(
  new THREE.TorusGeometry(0.52, 0.045, 14, 48),
  new THREE.MeshBasicMaterial({ color: '#7ce6ab', transparent: true, opacity: 0 }),
);
targetRing.rotation.x = Math.PI / 2;
targetRing.position.set(bars[targetIndex].x, 0.06, 0.7);
scene.add(targetRing);

const searchSteps = [
  { start: 0, end: 16, pivot: 8, comparisons: 1, label: '中间值 44，比 73 小 → 左半边全部排除' },
  { start: 9, end: 16, pivot: 12, comparisons: 2, label: '中间值 68，还是比 73 小 → 再排除一半' },
  { start: 13, end: 16, pivot: 14, comparisons: 3, label: '中间值 79，比 73 大 → 右侧排除' },
  { start: 13, end: 13, pivot: 13, comparisons: 4, label: '找到 73：只比较了 4 次' },
] as const;

function currentStep(time: number) {
  if (time < 3.3) return 0;
  if (time < 6.5) return 1;
  if (time < 9.5) return 2;
  return 3;
}

function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / Math.max(1, height);
  camera.updateProjectionMatrix();
}

function project(mesh: THREE.Object3D, element: HTMLElement) {
  const p = new THREE.Vector3();
  mesh.getWorldPosition(p);
  p.y += 0.3;
  p.project(camera);
  element.style.transform = `translate(${(p.x * .5 + .5) * canvas.clientWidth}px, ${(-p.y * .5 + .5) * canvas.clientHeight}px)`;
}

function renderScene(time: number) {
  resize();
  const intro = easeInOutCubic(segment(time, 0, 1.8));
  const step = currentStep(time);
  const state = searchSteps[step];
  const stepBlend = step === 0 ? easeInOutCubic(segment(time, 1.6, 3.1)) : easeInOutCubic(segment(time, [3.3, 6.5, 9.5][step - 1], [4.4, 7.6, 10.8][step - 1]));

  bars.forEach((bar, index) => {
    const active = index >= state.start && index <= state.end;
    const pivot = index === state.pivot;
    const found = step === 3 && index === targetIndex;
    const material = bar.mesh.material;

    if (!active) {
      material.color.set('#24303f');
      material.emissive.set('#000000');
      material.opacity = 0.17 + (1 - stepBlend) * 0.5;
      bar.mesh.scale.y = 0.78 + (1 - stepBlend) * 0.22;
      bar.label.style.opacity = String(0.18 + (1 - stepBlend) * 0.55);
    } else if (found) {
      material.color.set('#55c98a');
      material.emissive.set('#2f9d67');
      material.emissiveIntensity = 0.42 + Math.sin(time * 5) * 0.08;
      material.opacity = 1;
      bar.mesh.scale.set(1.13, 1.13, 1.13);
      bar.label.style.opacity = '1';
    } else if (pivot) {
      material.color.set('#e0a766');
      material.emissive.set('#9d652f');
      material.emissiveIntensity = 0.28;
      material.opacity = 1;
      bar.mesh.scale.set(1.08, 1.08, 1.08);
      bar.label.style.opacity = '1';
    } else {
      material.color.set('#587ba9');
      material.emissive.set('#243f63');
      material.emissiveIntensity = 0.09;
      material.opacity = 0.92;
      bar.mesh.scale.set(1, 1, 1);
      bar.label.style.opacity = '.78';
    }
  });

  const revealFound = segment(time, 10.1, 11.4);
  (targetRing.material as THREE.MeshBasicMaterial).opacity = revealFound * 0.85;
  targetRing.scale.setScalar(0.8 + revealFound * 0.4 + Math.sin(time * 4) * 0.03);

  stage.textContent = state.label;
  statsValue.textContent = String(state.comparisons);
  subtitle.innerHTML = step < 3
    ? `目标数字：<b>${targetValue}</b>。每一次比较都会把剩余范围缩小一半。`
    : `目标数字：<b>${targetValue}</b>。17 个候选，只用了 <b>4 次比较</b>。`;

  camera.position.z = 19.7 - intro * 1.2 - revealFound * 1.1;
  camera.position.y = 7.8 - intro * 0.7;
  camera.lookAt(0, 1.35, 0);
  renderer.render(scene, camera);
  bars.forEach((bar) => project(bar.mesh, bar.label));
  scrubber.value = String(time);
  timeLabel.textContent = `${time.toFixed(1)} / ${DURATION}s`;
}

const controller = new DeterministicTimeline({
  duration: DURATION,
  qaTimes: [0, 2.9, 3.5, 6.2, 6.8, 9.2, 9.8, 11.2, 14.8],
  onRender: renderScene,
  onPlayStateChange(playing) { toggle.textContent = playing ? '暂停' : '播放'; },
});
window.__LOOP_ANIMATION__ = controller;

toggle.addEventListener('click', () => toggle.textContent === '暂停' ? controller.pause() : controller.play());
scrubber.addEventListener('input', () => controller.seek(Number(scrubber.value)));
window.addEventListener('resize', () => controller.renderAt(Number(scrubber.value)));
controller.renderAt(0);
