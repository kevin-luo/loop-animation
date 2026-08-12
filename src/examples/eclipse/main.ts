import * as THREE from 'three';
import { DeterministicTimeline, easeInOutCubic, lerp, segment } from '../../runtime/animation';
import { getLanguage, persistLanguage, type AppLanguage } from '../../runtime/i18n';
import './style.css';

const DURATION = 18;
const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing #app');

let language: AppLanguage = getLanguage();
let playing = false;

const copy = {
  zh: {
    title: '为什么会发生日食？',
    stages: [
      '先看太阳、月球和地球的位置关系',
      '月球逐渐移动到太阳与地球之间',
      '月球的影子扫过地球表面',
      '轨道倾角决定：日食不会每个月发生',
    ],
    descriptions: [
      '月球绕地球运行，但月球轨道与地球公转平面并不完全重合。',
      '当太阳、月球、地球接近排成一线，月球开始挡住来自太阳的光。',
      '本影落到地球上的区域会看到日全食，半影区域会看到日偏食。',
      '只有月球接近轨道交点，同时又位于太阳和地球之间时，日食条件才成立。',
    ],
    labels: ['太阳', '月球', '地球'], play: '播放', pause: '暂停', lang: 'EN', alignment: '三体接近共线',
  },
  en: {
    title: 'Why does a solar eclipse happen?',
    stages: [
      'Start with the Sun, Moon and Earth in space',
      'The Moon moves between the Sun and Earth',
      "The Moon's shadow sweeps across Earth",
      'Orbital tilt is why eclipses do not happen every month',
    ],
    descriptions: [
      "The Moon orbits Earth, but its orbital plane is slightly tilted relative to Earth's orbital plane.",
      'When the three bodies nearly align, the Moon begins to block sunlight from reaching Earth.',
      'Observers inside the umbra see a total eclipse; observers in the penumbra see a partial eclipse.',
      'An eclipse requires the Moon to be near an orbital node while also passing between the Sun and Earth.',
    ],
    labels: ['Sun', 'Moon', 'Earth'], play: 'Play', pause: 'Pause', lang: '中文', alignment: 'Near-perfect alignment',
  },
} as const;

root.innerHTML = `
  <main class="experience">
    <canvas id="scene" aria-label="Solar eclipse Three.js animation"></canvas>
    <div class="space-noise"></div>
    <div class="vignette"></div>
    <header class="hud hud--top">
      <div class="eyebrow">Loop Animation · Orbit / Spatial</div>
      <h1 id="title"></h1>
      <p id="subtitle"></p>
    </header>
    <button id="eclipse-language" class="demo-language" type="button" data-export-hide></button>
    <div id="stage-label" class="stage-label"></div>
    <div id="alignment" class="alignment-indicator"><i></i><span></span></div>
    <span id="sun-label" class="object-label"></span>
    <span id="moon-label" class="object-label"></span>
    <span id="earth-label" class="object-label"></span>
    <footer class="controls" data-export-hide>
      <button id="toggle" type="button"></button>
      <input id="scrubber" type="range" min="0" max="${DURATION}" step="0.01" value="0" />
      <span id="time">0.0 / ${DURATION}s</span>
    </footer>
  </main>`;

const canvas = document.querySelector<HTMLCanvasElement>('#scene')!;
const title = document.querySelector<HTMLElement>('#title')!;
const subtitle = document.querySelector<HTMLElement>('#subtitle')!;
const stageLabel = document.querySelector<HTMLElement>('#stage-label')!;
const alignmentIndicator = document.querySelector<HTMLElement>('#alignment')!;
const alignmentText = alignmentIndicator.querySelector('span')!;
const languageButton = document.querySelector<HTMLButtonElement>('#eclipse-language')!;
const toggle = document.querySelector<HTMLButtonElement>('#toggle')!;
const scrubber = document.querySelector<HTMLInputElement>('#scrubber')!;
const timeLabel = document.querySelector<HTMLElement>('#time')!;
const sunLabel = document.querySelector<HTMLElement>('#sun-label')!;
const moonLabel = document.querySelector<HTMLElement>('#moon-label')!;
const earthLabel = document.querySelector<HTMLElement>('#earth-label')!;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#030508');
scene.fog = new THREE.FogExp2('#030508', .016);

const camera = new THREE.PerspectiveCamera(42, 1, .1, 100);
camera.position.set(0, 5.2, 15);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const ambient = new THREE.AmbientLight('#70809a', .34);
scene.add(ambient);

function seeded(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = seeded(20260812);
const starCount = 1150;
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  const radius = 18 + random() * 38;
  const theta = random() * Math.PI * 2;
  const phi = Math.acos(2 * random() - 1);
  starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
  starPositions[i * 3 + 1] = radius * Math.cos(phi);
  starPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
}
const starGeometry = new THREE.BufferGeometry();
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: '#d8e7ff', size: .032, transparent: true, opacity: .72 }));
scene.add(stars);

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  const gradient = ctx.createRadialGradient(128, 128, 8, 128, 128, 126);
  gradient.addColorStop(0, 'rgba(255,244,192,0.98)');
  gradient.addColorStop(.16, 'rgba(255,199,88,0.65)');
  gradient.addColorStop(.48, 'rgba(255,144,48,0.16)');
  gradient.addColorStop(1, 'rgba(255,120,20,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(1.62, 64, 64),
  new THREE.MeshBasicMaterial({ color: '#ffd36f' }),
);
sun.position.set(-5.55, 0, 0);
scene.add(sun);

const corona = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: '#ffd079', transparent: true, opacity: .78, blending: THREE.AdditiveBlending, depthWrite: false }));
corona.position.copy(sun.position);
corona.scale.set(7.2, 7.2, 1);
scene.add(corona);

const coronaRing = new THREE.Mesh(
  new THREE.TorusGeometry(1.92, .035, 16, 128),
  new THREE.MeshBasicMaterial({ color: '#ffd991', transparent: true, opacity: .25, blending: THREE.AdditiveBlending }),
);
coronaRing.position.copy(sun.position);
coronaRing.rotation.y = Math.PI / 2;
scene.add(coronaRing);

const sunlight = new THREE.PointLight('#fff0be', 54, 42, 1.35);
sunlight.position.copy(sun.position);
scene.add(sunlight);

const earth = new THREE.Mesh(
  new THREE.SphereGeometry(1.34, 64, 64),
  new THREE.MeshStandardMaterial({ color: '#245f9a', roughness: .77, metalness: .02 }),
);
earth.position.set(5.35, 0, 0);
earth.castShadow = true;
scene.add(earth);

const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(1.44, 64, 64),
  new THREE.MeshBasicMaterial({ color: '#65bfff', transparent: true, opacity: .12, side: THREE.BackSide, blending: THREE.AdditiveBlending }),
);
atmosphere.position.copy(earth.position);
scene.add(atmosphere);

const earthGlow = new THREE.PointLight('#57aaff', 2.2, 5, 2);
earthGlow.position.set(earth.position.x + .6, .6, 1.5);
scene.add(earthGlow);

const moon = new THREE.Mesh(
  new THREE.SphereGeometry(.52, 48, 48),
  new THREE.MeshStandardMaterial({ color: '#aeb6c1', roughness: .94, metalness: 0 }),
);
moon.castShadow = true;
scene.add(moon);

const moonRim = new THREE.Mesh(
  new THREE.SphereGeometry(.545, 48, 48),
  new THREE.MeshBasicMaterial({ color: '#d6e0ec', transparent: true, opacity: .1, wireframe: true }),
);
scene.add(moonRim);

const orbitCurve = new THREE.EllipseCurve(earth.position.x, 0, 3.12, 1.0, 0, Math.PI * 2);
const orbitPoints = orbitCurve.getPoints(160).map((p) => new THREE.Vector3(p.x, p.y, 0));
const orbit = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints(orbitPoints),
  new THREE.LineBasicMaterial({ color: '#86a7d7', transparent: true, opacity: .28 }),
);
orbit.rotation.x = THREE.MathUtils.degToRad(11);
scene.add(orbit);

const orbitPlane = new THREE.Mesh(
  new THREE.RingGeometry(2.94, 3.12, 128),
  new THREE.MeshBasicMaterial({ color: '#6f92bf', transparent: true, opacity: .028, side: THREE.DoubleSide, depthWrite: false }),
);
orbitPlane.position.copy(earth.position);
orbitPlane.rotation.x = Math.PI / 2 - THREE.MathUtils.degToRad(11);
scene.add(orbitPlane);

const shadowCone = new THREE.Mesh(
  new THREE.ConeGeometry(.64, 4.7, 56, 1, true),
  new THREE.MeshBasicMaterial({ color: '#07101c', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
);
scene.add(shadowCone);

const penumbraCone = new THREE.Mesh(
  new THREE.ConeGeometry(1.08, 5.2, 56, 1, true),
  new THREE.MeshBasicMaterial({ color: '#18304d', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
);
scene.add(penumbraCone);

const alignmentLine = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([sun.position, earth.position]),
  new THREE.LineDashedMaterial({ color: '#d5e4f7', transparent: true, opacity: .0, dashSize: .16, gapSize: .15 }),
);
alignmentLine.computeLineDistances();
scene.add(alignmentLine);

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
  element.style.transform = `translate(${(p.x * .5 + .5) * canvas.clientWidth}px, ${(-p.y * .5 + .5) * canvas.clientHeight}px)`;
}

function phase(time: number) {
  if (time < 4) return 0;
  if (time < 9) return 1;
  if (time < 14) return 2;
  return 3;
}

function applyLanguage() {
  const t = copy[language];
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  title.textContent = t.title;
  languageButton.textContent = t.lang;
  sunLabel.textContent = t.labels[0];
  moonLabel.textContent = t.labels[1];
  earthLabel.textContent = t.labels[2];
  alignmentText.textContent = t.alignment;
  toggle.textContent = playing ? t.pause : t.play;
}

function orientCone(mesh: THREE.Mesh, from: THREE.Vector3, to: THREE.Vector3, length: number) {
  const direction = new THREE.Vector3().subVectors(to, from).normalize();
  const center = new THREE.Vector3().copy(from).add(direction.clone().multiplyScalar(length * .5));
  mesh.position.copy(center);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
}

function renderScene(time: number) {
  resize();
  const intro = easeInOutCubic(segment(time, 0, 3.2));
  const align = easeInOutCubic(segment(time, 3.5, 10));
  const shadowReveal = easeInOutCubic(segment(time, 8.2, 11.5));
  const nodeReveal = easeInOutCubic(segment(time, 13.5, 16.2));
  const orbitAngle = lerp(-1.78, Math.PI, align);

  const localMoon = new THREE.Vector3(Math.cos(orbitAngle) * 3.12, Math.sin(orbitAngle) * 1.0, Math.sin(orbitAngle) * .26);
  localMoon.applyAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(11));
  moon.position.copy(earth.position).add(localMoon);
  moonRim.position.copy(moon.position);

  earth.rotation.y = time * .18;
  moon.rotation.y = time * .11;
  moonRim.rotation.copy(moon.rotation);
  stars.rotation.y = time * .0025;
  coronaRing.rotation.x = time * .04;

  orientCone(shadowCone, moon.position, earth.position, 4.7);
  orientCone(penumbraCone, moon.position, earth.position, 5.2);
  (shadowCone.material as THREE.MeshBasicMaterial).opacity = .48 * shadowReveal;
  (penumbraCone.material as THREE.MeshBasicMaterial).opacity = .085 * shadowReveal;
  (alignmentLine.material as THREE.LineDashedMaterial).opacity = .12 * shadowReveal + .13 * nodeReveal;

  const eclipseMoment = easeInOutCubic(segment(time, 8.7, 11.1)) * (1 - easeInOutCubic(segment(time, 12.8, 14.4)));
  sunlight.intensity = lerp(54, 40, eclipseMoment);
  ambient.intensity = lerp(.34, .22, eclipseMoment);
  (corona.material as THREE.SpriteMaterial).opacity = .72 + eclipseMoment * .2 + Math.sin(time * .9) * .025;
  corona.scale.setScalar(7.15 + Math.sin(time * .55) * .12 + eclipseMoment * .4);
  atmosphere.scale.setScalar(1 + Math.sin(time * 1.5) * .003);
  (atmosphere.material as THREE.MeshBasicMaterial).opacity = .1 + eclipseMoment * .08;

  camera.position.z = lerp(17.4, 13.7, intro) - eclipseMoment * .65;
  camera.position.y = lerp(6.1, 4.15, intro) - eclipseMoment * .2;
  camera.position.x = lerp(-.45, .25, align);
  camera.lookAt(.3, 0, 0);

  (orbit.material as THREE.LineBasicMaterial).opacity = lerp(.09, .29, intro) * (1 - shadowReveal * .56 + nodeReveal * .25);
  (orbitPlane.material as THREE.MeshBasicMaterial).opacity = .02 + nodeReveal * .045;

  title.style.opacity = String(1 - segment(time, 3.6, 5.1) * .34);
  const current = phase(time);
  const t = copy[language];
  stageLabel.textContent = `${current + 1} · ${t.stages[current]}`;
  subtitle.textContent = t.descriptions[current];
  alignmentIndicator.style.opacity = String(shadowReveal * (1 - nodeReveal * .35));

  renderer.render(scene, camera);
  worldToScreen(sun, sunLabel);
  worldToScreen(moon, moonLabel);
  worldToScreen(earth, earthLabel);
  scrubber.value = String(time);
  timeLabel.textContent = `${time.toFixed(1)} / ${DURATION}s`;
}

const controller = new DeterministicTimeline({
  duration: DURATION,
  qaTimes: [0, 3.4, 4.1, 8.5, 9.3, 11.1, 13.8, 16.2, 17.9],
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

scrubber.addEventListener('input', () => controller.seek(Number(scrubber.value)));
toggle.addEventListener('click', () => playing ? controller.pause() : controller.play());
window.addEventListener('resize', () => controller.renderAt(Number(scrubber.value)));
applyLanguage();
controller.renderAt(0);
