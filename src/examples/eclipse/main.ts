import * as THREE from 'three';
import { DeterministicTimeline, easeInOutCubic, lerp, segment } from '../../runtime/animation';
import './style.css';

const DURATION = 18;
const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing #app');

root.innerHTML = `
  <main class="experience">
    <canvas id="scene" aria-label="日食原理 Three.js 动画"></canvas>
    <div class="vignette"></div>
    <header class="hud hud--top">
      <div class="eyebrow">Loop Animation · Interactive Science</div>
      <h1 id="title">为什么会发生日食？</h1>
      <p id="subtitle">太阳、月球和地球短暂排成一线时，月球的影子会落到地球上。</p>
    </header>
    <div id="stage-label" class="stage-label">先看三者的位置</div>
    <span id="sun-label" class="object-label">太阳</span>
    <span id="moon-label" class="object-label">月球</span>
    <span id="earth-label" class="object-label">地球</span>
    <footer class="controls" data-export-hide>
      <button id="toggle" type="button">播放</button>
      <input id="scrubber" type="range" min="0" max="${DURATION}" step="0.01" value="0" />
      <span id="time">0.0 / ${DURATION}s</span>
    </footer>
  </main>`;

const canvas = document.querySelector<HTMLCanvasElement>('#scene')!;
const title = document.querySelector<HTMLElement>('#title')!;
const subtitle = document.querySelector<HTMLElement>('#subtitle')!;
const stageLabel = document.querySelector<HTMLElement>('#stage-label')!;
const toggle = document.querySelector<HTMLButtonElement>('#toggle')!;
const scrubber = document.querySelector<HTMLInputElement>('#scrubber')!;
const timeLabel = document.querySelector<HTMLElement>('#time')!;
const sunLabel = document.querySelector<HTMLElement>('#sun-label')!;
const moonLabel = document.querySelector<HTMLElement>('#moon-label')!;
const earthLabel = document.querySelector<HTMLElement>('#earth-label')!;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#05070a');
scene.fog = new THREE.FogExp2('#05070a', 0.018);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(0, 5.2, 15);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
scene.add(new THREE.AmbientLight('#7b8aa5', 0.38));

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(20260812);
const starCount = 800;
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  const radius = 20 + random() * 30;
  const theta = random() * Math.PI * 2;
  const phi = Math.acos(2 * random() - 1);
  starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
  starPositions[i * 3 + 1] = radius * Math.cos(phi);
  starPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
}
const starGeometry = new THREE.BufferGeometry();
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: '#dce7ff', size: 0.035, transparent: true, opacity: 0.7 }));
scene.add(stars);

const sun = new THREE.Mesh(new THREE.SphereGeometry(1.65, 64, 64), new THREE.MeshBasicMaterial({ color: '#ffd36a' }));
sun.position.set(-5.5, 0, 0);
scene.add(sun);
const sunGlow = new THREE.Mesh(new THREE.SphereGeometry(1.9, 64, 64), new THREE.MeshBasicMaterial({ color: '#ffb347', transparent: true, opacity: 0.12, side: THREE.BackSide }));
sunGlow.position.copy(sun.position);
scene.add(sunGlow);
const sunlight = new THREE.PointLight('#fff2c2', 45, 40, 1.4);
sunlight.position.copy(sun.position);
scene.add(sunlight);

const earth = new THREE.Mesh(new THREE.SphereGeometry(1.35, 64, 64), new THREE.MeshStandardMaterial({ color: '#2c6ca8', roughness: 0.86 }));
earth.position.set(5.4, 0, 0);
scene.add(earth);
const moon = new THREE.Mesh(new THREE.SphereGeometry(0.52, 48, 48), new THREE.MeshStandardMaterial({ color: '#b8bec7', roughness: 0.95 }));
scene.add(moon);

const orbitCurve = new THREE.EllipseCurve(earth.position.x, 0, 3.1, 1.15, 0, Math.PI * 2);
const orbit = new THREE.Line(new THREE.BufferGeometry().setFromPoints(orbitCurve.getPoints(128).map((p) => new THREE.Vector3(p.x, 0, p.y))), new THREE.LineBasicMaterial({ color: '#8da4c8', transparent: true, opacity: 0.25 }));
scene.add(orbit);
const shadowCone = new THREE.Mesh(new THREE.ConeGeometry(0.58, 4.5, 48, 1, true), new THREE.MeshBasicMaterial({ color: '#111827', transparent: true, opacity: 0, side: THREE.DoubleSide }));
shadowCone.rotation.z = -Math.PI / 2;
scene.add(shadowCone);

function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / Math.max(1, height);
  camera.updateProjectionMatrix();
}

function worldToScreen(object: THREE.Object3D, element: HTMLElement) {
  const p = new THREE.Vector3();
  object.getWorldPosition(p);
  p.project(camera);
  element.style.transform = `translate(${(p.x * 0.5 + 0.5) * canvas.clientWidth}px, ${(-p.y * 0.5 + 0.5) * canvas.clientHeight}px)`;
}

function setNarration(time: number) {
  if (time < 4) {
    stageLabel.textContent = '先看太阳、月球和地球的位置';
    subtitle.textContent = '月球绕地球运行，但它的轨道相对地球公转平面略有倾斜。';
  } else if (time < 9) {
    stageLabel.textContent = '月球移动到太阳与地球之间';
    subtitle.textContent = '当三者逐渐接近一条直线，月球开始挡住一部分太阳光。';
  } else if (time < 14) {
    stageLabel.textContent = '月球影子扫过地球表面';
    subtitle.textContent = '落在本影区域的人会看到日全食，半影区域则会看到日偏食。';
  } else {
    stageLabel.textContent = '关键：轨道倾角让日食不会每月发生';
    subtitle.textContent = '只有月球同时接近轨道交点并位于太阳和地球之间时，条件才刚好满足。';
  }
}

function renderScene(time: number) {
  resize();
  const intro = easeInOutCubic(segment(time, 0, 3.5));
  const align = easeInOutCubic(segment(time, 3.5, 10));
  const reveal = easeInOutCubic(segment(time, 8.5, 12));
  const orbitAngle = lerp(-1.9, Math.PI, align);
  moon.position.set(earth.position.x + Math.cos(orbitAngle) * 3.1, Math.sin(orbitAngle) * 1.15 * (1 - align) + lerp(0.75, 0, align), Math.sin(orbitAngle) * 0.35);
  earth.rotation.y = time * 0.18;
  moon.rotation.y = time * 0.11;
  stars.rotation.y = time * 0.003;
  camera.position.z = lerp(17.5, 13.5, intro);
  camera.position.y = lerp(6.2, 4.0, intro);
  camera.lookAt(0.2, 0, 0);
  (orbit.material as THREE.LineBasicMaterial).opacity = lerp(0.08, 0.28, intro) * (1 - reveal * 0.55);
  (shadowCone.material as THREE.MeshBasicMaterial).opacity = 0.48 * reveal;
  shadowCone.position.set(2.8, 0, 0);
  title.style.opacity = String(1 - segment(time, 3.5, 5) * 0.35);
  setNarration(time);
  renderer.render(scene, camera);
  worldToScreen(sun, sunLabel);
  worldToScreen(moon, moonLabel);
  worldToScreen(earth, earthLabel);
  scrubber.value = String(time);
  timeLabel.textContent = `${time.toFixed(1)} / ${DURATION}s`;
}

const controller = new DeterministicTimeline({
  duration: DURATION,
  qaTimes: [0, 3.4, 4, 8.4, 9, 11.9, 14, 17.9],
  onRender: renderScene,
  onPlayStateChange(playing) { toggle.textContent = playing ? '暂停' : '播放'; },
});
window.__LOOP_ANIMATION__ = controller;
scrubber.addEventListener('input', () => controller.seek(Number(scrubber.value)));
toggle.addEventListener('click', () => toggle.textContent === '暂停' ? controller.pause() : controller.play());
window.addEventListener('resize', () => controller.renderAt(Number(scrubber.value)));
controller.renderAt(0);
