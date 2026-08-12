import * as THREE from 'three';
import {
  DeterministicTimeline,
  easeInOutCubic,
  lerp,
  segment,
  stepIndexAt,
  stepProgressAt,
  type TimelineStep,
} from '../../runtime/animation';
import { getLanguage, persistLanguage, type AppLanguage } from '../../runtime/i18n';
import './style.css';

const DURATION = 30;
const DISPLAY_TILT_DEG = 13;
const REAL_TILT_DEG = 5.1;

const STEPS = [
  { id: 'roles', start: 0, end: 5 },
  { id: 'tilt', start: 5, end: 10 },
  { id: 'alignment', start: 10, end: 15 },
  { id: 'shadow', start: 15, end: 20 },
  { id: 'observer', start: 20, end: 25 },
  { id: 'monthly', start: 25, end: 30 },
] satisfies readonly TimelineStep[];

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing #app');

let language: AppLanguage = getLanguage();
let playing = false;

const copy = {
  zh: {
    pageTitle: '为什么会发生日食？',
    pageLead: '用 6 个步骤看清太阳、月球、地球、轨道倾角和影子之间的关系。',
    labels: ['太阳', '月球', '地球'],
    play: '播放', pause: '暂停', previous: '上一步', next: '下一步', lang: 'EN',
    stepWord: '步骤', keyWord: '关键点',
    alignment: '太阳 · 月球 · 地球接近共线',
    total: '本影：日全食', partial: '半影：日偏食',
    umbra: '本影', penumbra: '半影', nodeA: '交点', nodeB: '交点',
    tilt: `${REAL_TILT_DEG}° 轨道倾角`,
    tiltHint: '画面为了看清关系，放大了倾角',
    steps: [
      {
        kicker: '先建立空间关系',
        title: '谁在发光，谁在绕谁运动？',
        body: '太阳是光源，地球接收太阳光，月球围绕地球运行。日食发生前，月球必须先来到太阳与地球之间。',
        key: '日食只可能出现在新月附近，但“新月”本身还不够。',
      },
      {
        kicker: '第一个关键条件',
        title: '月球轨道其实是倾斜的',
        body: `月球轨道相对黄道面倾斜约 ${REAL_TILT_DEG}°。所以大多数新月，月球会从太阳视线的上方或下方经过，影子根本碰不到地球。`,
        key: '这个倾角，是“为什么不会每个月都有日食”的核心原因。',
      },
      {
        kicker: '第二个关键条件',
        title: '新月还要刚好靠近轨道交点',
        body: '月球轨道穿过黄道面的两个位置叫交点。只有新月同时靠近交点，太阳、月球和地球才可能真正接近一条直线。',
        key: '新月 + 靠近交点，才进入日食窗口。',
      },
      {
        kicker: '影子开始形成',
        title: '月球把太阳光切成两层影子',
        body: '月球挡住太阳后，背后会形成更暗、更窄的本影，以及更宽的半影。本影里太阳被完全遮住，半影里只遮住一部分。',
        key: '本影决定日全食区域，半影决定日偏食区域。',
      },
      {
        kicker: '你看到什么取决于位置',
        title: '同一次日食，不同地点看到的并不一样',
        body: '地球表面落进本影的人会看到日全食；落进半影的人会看到日偏食。本影在地球表面移动，就形成一条狭窄的日全食带。',
        key: '日食类型不是只由时间决定，还取决于你站在地球上的哪里。',
      },
      {
        kicker: '把条件合在一起',
        title: '所以日食为什么这么少？',
        body: '必须同时满足：新月、接近交点、三体几乎共线。节点方向和太阳方向不对齐时，即使是新月，月球影子也会从地球上方或下方掠过。',
        key: '日食是多个几何条件同时满足的结果，而不是“月球每绕一圈就发生一次”。',
      },
    ],
  },
  en: {
    pageTitle: 'Why does a solar eclipse happen?',
    pageLead: 'Six steps reveal how the Sun, Moon, Earth, orbital tilt and shadow geometry fit together.',
    labels: ['Sun', 'Moon', 'Earth'],
    play: 'Play', pause: 'Pause', previous: 'Previous', next: 'Next', lang: '中文',
    stepWord: 'Step', keyWord: 'Key idea',
    alignment: 'Sun · Moon · Earth nearly align',
    total: 'Umbra: total eclipse', partial: 'Penumbra: partial eclipse',
    umbra: 'Umbra', penumbra: 'Penumbra', nodeA: 'Node', nodeB: 'Node',
    tilt: `${REAL_TILT_DEG}° orbital tilt`,
    tiltHint: 'Tilt is exaggerated here so the geometry is easier to see',
    steps: [
      {
        kicker: 'Build the spatial model',
        title: 'Who emits light, and who orbits whom?',
        body: 'The Sun is the light source, Earth receives that light, and the Moon orbits Earth. Before an eclipse can happen, the Moon must pass between the Sun and Earth.',
        key: 'Solar eclipses are only possible near new moon, but a new moon alone is not enough.',
      },
      {
        kicker: 'First crucial condition',
        title: "The Moon's orbit is tilted",
        body: `The lunar orbit is tilted by about ${REAL_TILT_DEG}° to the ecliptic. Most new moons therefore pass above or below the Sun–Earth line, so the Moon's shadow misses Earth.`,
        key: 'That tilt is the main reason a solar eclipse does not happen every month.',
      },
      {
        kicker: 'Second crucial condition',
        title: 'New moon must also occur near an orbital node',
        body: "The Moon's orbit crosses the ecliptic at two nodes. Only when new moon happens near a node can the Sun, Moon and Earth become closely aligned.",
        key: 'New moon + near a node creates an eclipse window.',
      },
      {
        kicker: 'The shadow takes shape',
        title: 'The Moon creates two important shadow regions',
        body: 'Behind the Moon, the narrow dark umbra is where the Sun is fully blocked. The wider penumbra is where only part of the Sun is blocked.',
        key: 'The umbra produces totality; the penumbra produces a partial eclipse.',
      },
      {
        kicker: 'Your location changes the event',
        title: 'The same eclipse looks different from different places',
        body: "Observers inside the umbra see a total eclipse. Observers inside the penumbra see a partial eclipse. The moving umbra traces a narrow path of totality across Earth's surface.",
        key: 'Eclipse type depends on where you are on Earth, not only on the time.',
      },
      {
        kicker: 'Put all the conditions together',
        title: 'So why are solar eclipses relatively rare?',
        body: "You need new moon, proximity to a node, and near-perfect alignment at the same time. When the node line is not aimed toward the Sun, the Moon's shadow passes above or below Earth.",
        key: 'An eclipse is a coincidence of several geometric conditions, not something that happens every lunar orbit.',
      },
    ],
  },
} as const;

root.innerHTML = `
  <main class="experience">
    <canvas id="scene" aria-label="Solar eclipse Three.js explainer"></canvas>
    <div class="space-noise"></div>
    <div class="vignette"></div>

    <header class="topic-header">
      <div class="eyebrow">Loop Animation · Orbit / Spatial</div>
      <h1 id="page-title"></h1>
      <p id="page-lead"></p>
    </header>

    <button id="eclipse-language" class="demo-language" type="button" data-export-hide></button>

    <aside class="lesson-panel" aria-live="polite">
      <div class="lesson-progress-row">
        <div class="lesson-count"><span id="step-word"></span><b id="step-number">01</b><i>/ ${String(STEPS.length).padStart(2, '0')}</i></div>
        <div id="step-dots" class="step-dots" data-export-hide>
          ${STEPS.map((step, index) => `<button type="button" data-step="${index}" aria-label="${step.id}"><span></span></button>`).join('')}
        </div>
      </div>
      <div class="lesson-copy">
        <div id="lesson-kicker" class="lesson-kicker"></div>
        <h2 id="lesson-title"></h2>
        <p id="lesson-body"></p>
        <div class="lesson-key"><span id="key-word"></span><p id="lesson-key"></p></div>
      </div>
      <div class="lesson-actions" data-export-hide>
        <button id="lesson-previous" type="button"><span>←</span><b></b></button>
        <button id="lesson-next" type="button"><b></b><span>→</span></button>
      </div>
    </aside>

    <div id="alignment" class="alignment-indicator"><i></i><span></span></div>
    <div id="tilt-callout" class="visual-callout visual-callout--tilt"><b></b><span></span></div>
    <div id="umbra-label" class="visual-callout visual-callout--shadow"><b></b></div>
    <div id="penumbra-label" class="visual-callout visual-callout--shadow"><b></b></div>
    <div id="total-label" class="visual-callout visual-callout--observer"><i></i><b></b></div>
    <div id="partial-label" class="visual-callout visual-callout--observer"><i></i><b></b></div>
    <div id="node-a-label" class="visual-callout visual-callout--node"><b></b></div>
    <div id="node-b-label" class="visual-callout visual-callout--node"><b></b></div>

    <span id="sun-label" class="object-label"></span>
    <span id="moon-label" class="object-label"></span>
    <span id="earth-label" class="object-label"></span>

    <footer class="controls" data-export-hide>
      <button id="toggle" type="button"></button>
      <div class="timeline-wrap"><input id="scrubber" type="range" min="0" max="${DURATION}" step="0.01" value="0" /><div id="timeline-steps" class="timeline-steps">${STEPS.map((step) => `<i style="left:${(step.start / DURATION) * 100}%"></i>`).join('')}</div></div>
      <span id="time">0.0 / ${DURATION}s</span>
    </footer>
  </main>`;

const canvas = document.querySelector<HTMLCanvasElement>('#scene')!;
const pageTitle = document.querySelector<HTMLElement>('#page-title')!;
const pageLead = document.querySelector<HTMLElement>('#page-lead')!;
const lessonKicker = document.querySelector<HTMLElement>('#lesson-kicker')!;
const lessonTitle = document.querySelector<HTMLElement>('#lesson-title')!;
const lessonBody = document.querySelector<HTMLElement>('#lesson-body')!;
const lessonKey = document.querySelector<HTMLElement>('#lesson-key')!;
const keyWord = document.querySelector<HTMLElement>('#key-word')!;
const stepWord = document.querySelector<HTMLElement>('#step-word')!;
const stepNumber = document.querySelector<HTMLElement>('#step-number')!;
const stepDots = [...document.querySelectorAll<HTMLButtonElement>('#step-dots button')];
const previousButton = document.querySelector<HTMLButtonElement>('#lesson-previous')!;
const nextButton = document.querySelector<HTMLButtonElement>('#lesson-next')!;
const languageButton = document.querySelector<HTMLButtonElement>('#eclipse-language')!;
const alignmentIndicator = document.querySelector<HTMLElement>('#alignment')!;
const alignmentText = alignmentIndicator.querySelector('span')!;
const tiltCallout = document.querySelector<HTMLElement>('#tilt-callout')!;
const tiltCalloutTitle = tiltCallout.querySelector('b')!;
const tiltCalloutHint = tiltCallout.querySelector('span')!;
const umbraLabel = document.querySelector<HTMLElement>('#umbra-label')!;
const penumbraLabel = document.querySelector<HTMLElement>('#penumbra-label')!;
const totalLabel = document.querySelector<HTMLElement>('#total-label')!;
const partialLabel = document.querySelector<HTMLElement>('#partial-label')!;
const nodeALabel = document.querySelector<HTMLElement>('#node-a-label')!;
const nodeBLabel = document.querySelector<HTMLElement>('#node-b-label')!;
const toggle = document.querySelector<HTMLButtonElement>('#toggle')!;
const scrubber = document.querySelector<HTMLInputElement>('#scrubber')!;
const timeLabel = document.querySelector<HTMLElement>('#time')!;
const sunLabel = document.querySelector<HTMLElement>('#sun-label')!;
const moonLabel = document.querySelector<HTMLElement>('#moon-label')!;
const earthLabel = document.querySelector<HTMLElement>('#earth-label')!;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#020407');
scene.fog = new THREE.FogExp2('#020407', .015);

const camera = new THREE.PerspectiveCamera(42, 1, .1, 100);
camera.position.set(0, 5.4, 17);
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
const starCount = 1300;
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  const radius = 18 + random() * 40;
  const theta = random() * Math.PI * 2;
  const phi = Math.acos(2 * random() - 1);
  starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
  starPositions[i * 3 + 1] = radius * Math.cos(phi);
  starPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
}
const starGeometry = new THREE.BufferGeometry();
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: '#d8e7ff', size: .032, transparent: true, opacity: .7 }));
scene.add(stars);

function radialTexture(stops: Array<[number, string]>) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  const gradient = ctx.createRadialGradient(128, 128, 5, 128, 128, 126);
  for (const [offset, color] of stops) gradient.addColorStop(offset, color);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

const sun = new THREE.Mesh(new THREE.SphereGeometry(1.62, 64, 64), new THREE.MeshBasicMaterial({ color: '#ffd36f' }));
sun.position.set(-5.6, 0, 0);
scene.add(sun);

const corona = new THREE.Sprite(new THREE.SpriteMaterial({
  map: radialTexture([
    [0, 'rgba(255,244,192,1)'], [.16, 'rgba(255,199,88,.62)'], [.5, 'rgba(255,144,48,.15)'], [1, 'rgba(255,120,20,0)'],
  ]),
  color: '#ffd079', transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false,
}));
corona.position.copy(sun.position);
corona.scale.set(7.3, 7.3, 1);
scene.add(corona);

const sunlight = new THREE.PointLight('#fff0be', 56, 42, 1.35);
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
  new THREE.SphereGeometry(1.45, 64, 64),
  new THREE.MeshBasicMaterial({ color: '#65bfff', transparent: true, opacity: .12, side: THREE.BackSide, blending: THREE.AdditiveBlending }),
);
atmosphere.position.copy(earth.position);
scene.add(atmosphere);

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

const orbitCurve = new THREE.EllipseCurve(0, 0, 3.12, 1.02, 0, Math.PI * 2);
const orbitPoints = orbitCurve.getPoints(180).map((p) => new THREE.Vector3(p.x, p.y, 0));
const orbit = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints(orbitPoints),
  new THREE.LineBasicMaterial({ color: '#7fa8e0', transparent: true, opacity: .26 }),
);
orbit.position.copy(earth.position);
scene.add(orbit);

const moonOrbitPlane = new THREE.Mesh(
  new THREE.RingGeometry(2.93, 3.16, 128),
  new THREE.MeshBasicMaterial({ color: '#5c8fd0', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
);
moonOrbitPlane.position.copy(earth.position);
scene.add(moonOrbitPlane);

const eclipticPlane = new THREE.Mesh(
  new THREE.RingGeometry(2.78, 3.28, 128),
  new THREE.MeshBasicMaterial({ color: '#d9a45e', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
);
eclipticPlane.position.copy(earth.position);
scene.add(eclipticPlane);

const nodeLine = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-3.55, 0, 0), new THREE.Vector3(3.55, 0, 0)]),
  new THREE.LineDashedMaterial({ color: '#f0c987', transparent: true, opacity: 0, dashSize: .13, gapSize: .1 }),
);
nodeLine.computeLineDistances();
nodeLine.position.copy(earth.position);
scene.add(nodeLine);

const nodeMaterial = new THREE.MeshBasicMaterial({ color: '#f0c987', transparent: true, opacity: 0 });
const nodeA = new THREE.Mesh(new THREE.SphereGeometry(.1, 20, 20), nodeMaterial.clone());
const nodeB = new THREE.Mesh(new THREE.SphereGeometry(.1, 20, 20), nodeMaterial.clone());
scene.add(nodeA, nodeB);

const shadowCone = new THREE.Mesh(
  new THREE.ConeGeometry(.62, 5.4, 56, 1, true),
  new THREE.MeshBasicMaterial({ color: '#030813', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
);
scene.add(shadowCone);

const penumbraCone = new THREE.Mesh(
  new THREE.ConeGeometry(1.16, 5.7, 56, 1, true),
  new THREE.MeshBasicMaterial({ color: '#17365b', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
);
scene.add(penumbraCone);

const alignmentLine = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([sun.position, earth.position]),
  new THREE.LineDashedMaterial({ color: '#e1ecfa', transparent: true, opacity: 0, dashSize: .16, gapSize: .15 }),
);
alignmentLine.computeLineDistances();
scene.add(alignmentLine);

const observerTotal = new THREE.Mesh(
  new THREE.SphereGeometry(.09, 20, 20),
  new THREE.MeshStandardMaterial({ color: '#86f0b4', emissive: '#2ecf79', emissiveIntensity: 1.2 }),
);
const observerPartial = new THREE.Mesh(
  new THREE.SphereGeometry(.09, 20, 20),
  new THREE.MeshStandardMaterial({ color: '#9ac8ff', emissive: '#4389df', emissiveIntensity: .9 }),
);
scene.add(observerTotal, observerPartial);

const shadowSpot = new THREE.Sprite(new THREE.SpriteMaterial({
  map: radialTexture([[0, 'rgba(0,0,0,.9)'], [.38, 'rgba(2,6,14,.7)'], [.72, 'rgba(22,50,82,.22)'], [1, 'rgba(20,50,90,0)']]),
  transparent: true, opacity: 0, depthWrite: false,
}));
shadowSpot.scale.set(1.4, 1.4, 1);
scene.add(shadowSpot);

function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / Math.max(1, height);
  camera.updateProjectionMatrix();
}

function worldToScreen(object: THREE.Object3D, element: HTMLElement, offsetY = 0) {
  const p = new THREE.Vector3();
  object.getWorldPosition(p);
  p.y += offsetY;
  worldPointToScreen(p, element);
}

function worldPointToScreen(point: THREE.Vector3, element: HTMLElement) {
  const p = point.clone().project(camera);
  const x = (p.x * .5 + .5) * canvas.clientWidth;
  const y = (-p.y * .5 + .5) * canvas.clientHeight;
  element.style.transform = `translate(${x}px, ${y}px)`;
}

function orientConeFromLight(mesh: THREE.Mesh, from: THREE.Vector3, lightSource: THREE.Vector3, length: number) {
  const direction = new THREE.Vector3().subVectors(from, lightSource).normalize();
  const center = from.clone().add(direction.clone().multiplyScalar(length * .5));
  mesh.position.copy(center);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
}

function setOpacity(element: HTMLElement, opacity: number) {
  element.style.opacity = String(Math.min(1, Math.max(0, opacity)));
}

function applyOrbitOrientation(nodeAngle: number) {
  const tilt = THREE.MathUtils.degToRad(DISPLAY_TILT_DEG);
  orbit.rotation.set(tilt, 0, nodeAngle);
  moonOrbitPlane.rotation.set(0, 0, nodeAngle);
  moonOrbitPlane.rotateX(tilt);
  nodeLine.rotation.z = nodeAngle;

  const left = new THREE.Vector3(-3.12, 0, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), nodeAngle).add(earth.position);
  const right = new THREE.Vector3(3.12, 0, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), nodeAngle).add(earth.position);
  nodeA.position.copy(left);
  nodeB.position.copy(right);
}

function moonPosition(orbitAngle: number, nodeAngle: number) {
  const tilt = THREE.MathUtils.degToRad(DISPLAY_TILT_DEG);
  const local = new THREE.Vector3(Math.cos(orbitAngle) * 3.12, Math.sin(orbitAngle) * 1.02, 0);
  local.applyAxisAngle(new THREE.Vector3(1, 0, 0), tilt);
  local.applyAxisAngle(new THREE.Vector3(0, 0, 1), nodeAngle);
  return earth.position.clone().add(local);
}

function updateLesson(time: number) {
  const index = stepIndexAt(STEPS, time);
  const step = STEPS[index];
  const stepCopy = copy[language].steps[index];
  const progress = stepProgressAt(step, time);

  lessonKicker.textContent = stepCopy.kicker;
  lessonTitle.textContent = stepCopy.title;
  lessonBody.textContent = stepCopy.body;
  lessonKey.textContent = stepCopy.key;
  stepNumber.textContent = String(index + 1).padStart(2, '0');

  stepDots.forEach((dot, dotIndex) => {
    dot.classList.toggle('is-active', dotIndex === index);
    dot.classList.toggle('is-complete', dotIndex < index);
    dot.style.setProperty('--step-progress', dotIndex === index ? `${progress * 100}%` : dotIndex < index ? '100%' : '0%');
  });

  previousButton.disabled = index === 0 && time < .7;
  nextButton.disabled = index === STEPS.length - 1 && time > STEPS[index].end - .7;
}

function applyLanguage() {
  const t = copy[language];
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  pageTitle.textContent = t.pageTitle;
  pageLead.textContent = t.pageLead;
  languageButton.textContent = t.lang;
  sunLabel.textContent = t.labels[0];
  moonLabel.textContent = t.labels[1];
  earthLabel.textContent = t.labels[2];
  toggle.textContent = playing ? t.pause : t.play;
  previousButton.querySelector('b')!.textContent = t.previous;
  nextButton.querySelector('b')!.textContent = t.next;
  stepWord.textContent = t.stepWord;
  keyWord.textContent = t.keyWord;
  alignmentText.textContent = t.alignment;
  tiltCalloutTitle.textContent = t.tilt;
  tiltCalloutHint.textContent = t.tiltHint;
  umbraLabel.querySelector('b')!.textContent = t.umbra;
  penumbraLabel.querySelector('b')!.textContent = t.penumbra;
  totalLabel.querySelector('b')!.textContent = t.total;
  partialLabel.querySelector('b')!.textContent = t.partial;
  nodeALabel.querySelector('b')!.textContent = t.nodeA;
  nodeBLabel.querySelector('b')!.textContent = t.nodeB;
}

function renderScene(time: number) {
  resize();
  const step = stepIndexAt(STEPS, time);
  const stepProgress = stepProgressAt(STEPS[step], time);

  const intro = easeInOutCubic(segment(time, 0, 3.6));
  const tiltReveal = easeInOutCubic(segment(time, 5.4, 8.2));
  const alignmentMove = easeInOutCubic(segment(time, 10.2, 14.1));
  const shadowReveal = easeInOutCubic(segment(time, 15.3, 18.1));
  const observerReveal = easeInOutCubic(segment(time, 20.2, 22.4));
  const monthlyReveal = easeInOutCubic(segment(time, 25.2, 28.2));

  const nodeAngle = step < 5 ? 0 : THREE.MathUtils.degToRad(lerp(0, 28, monthlyReveal));
  applyOrbitOrientation(nodeAngle);

  let orbitAngle = -1.7;
  if (step === 0) orbitAngle = lerp(-1.7, -1.35, easeInOutCubic(stepProgress));
  if (step === 1) orbitAngle = lerp(-1.35, -1.05, easeInOutCubic(stepProgress));
  if (step === 2) orbitAngle = lerp(-1.05, Math.PI, alignmentMove);
  if (step === 3 || step === 4) orbitAngle = Math.PI;
  if (step === 5) orbitAngle = Math.PI;

  moon.position.copy(moonPosition(orbitAngle, nodeAngle));
  moonRim.position.copy(moon.position);

  earth.rotation.y = time * .12;
  moon.rotation.y = time * .08;
  moonRim.rotation.copy(moon.rotation);
  stars.rotation.y = time * .0018;

  orientConeFromLight(shadowCone, moon.position, sun.position, 5.4);
  orientConeFromLight(penumbraCone, moon.position, sun.position, 5.7);

  const shadowVisibility = step === 3 ? shadowReveal : step === 4 ? 1 : step === 5 ? lerp(1, .72, monthlyReveal) : 0;
  (shadowCone.material as THREE.MeshBasicMaterial).opacity = .5 * shadowVisibility;
  (penumbraCone.material as THREE.MeshBasicMaterial).opacity = .1 * shadowVisibility;

  const planeOpacity = step === 1 ? tiltReveal : step === 2 ? lerp(.5, .16, alignmentMove) : step === 5 ? .12 + monthlyReveal * .2 : .025;
  (moonOrbitPlane.material as THREE.MeshBasicMaterial).opacity = .075 * planeOpacity * 6;
  (eclipticPlane.material as THREE.MeshBasicMaterial).opacity = .045 * planeOpacity * 6;
  (orbit.material as THREE.LineBasicMaterial).opacity = step === 0 ? .24 : step === 1 ? .45 : step === 5 ? .5 : .28;

  const nodeOpacity = step === 2 ? alignmentMove : step === 5 ? .35 + monthlyReveal * .65 : 0;
  (nodeLine.material as THREE.LineDashedMaterial).opacity = .5 * nodeOpacity;
  (nodeA.material as THREE.MeshBasicMaterial).opacity = nodeOpacity;
  (nodeB.material as THREE.MeshBasicMaterial).opacity = nodeOpacity;
  nodeA.scale.setScalar(1 + nodeOpacity * .8 + Math.sin(time * 4) * .08 * nodeOpacity);
  nodeB.scale.copy(nodeA.scale);

  const alignmentOpacity = step === 2 ? alignmentMove : step === 3 || step === 4 ? 1 : step === 5 ? 1 - monthlyReveal : 0;
  (alignmentLine.material as THREE.LineDashedMaterial).opacity = .28 * alignmentOpacity;
  setOpacity(alignmentIndicator, alignmentOpacity);

  const eclipseMoment = shadowVisibility * (1 - monthlyReveal * .72);
  sunlight.intensity = lerp(56, 40, eclipseMoment);
  ambient.intensity = lerp(.34, .2, eclipseMoment);
  (corona.material as THREE.SpriteMaterial).opacity = .77 + eclipseMoment * .18 + Math.sin(time * .8) * .02;
  corona.scale.setScalar(7.2 + Math.sin(time * .5) * .12 + eclipseMoment * .34);
  (atmosphere.material as THREE.MeshBasicMaterial).opacity = .1 + observerReveal * .06;

  observerTotal.position.copy(earth.position).add(new THREE.Vector3(-1.26, .08, .38));
  observerPartial.position.copy(earth.position).add(new THREE.Vector3(-1.06, .72, .32));
  observerTotal.visible = observerReveal > .01;
  observerPartial.visible = observerReveal > .01;
  observerTotal.scale.setScalar(.7 + observerReveal * .55 + Math.sin(time * 4.5) * .08 * observerReveal);
  observerPartial.scale.setScalar(.7 + observerReveal * .48 + Math.sin(time * 4.1 + 1) * .06 * observerReveal);

  shadowSpot.position.copy(earth.position).add(new THREE.Vector3(-1.28, .08, .3));
  (shadowSpot.material as THREE.SpriteMaterial).opacity = .72 * observerReveal * (1 - monthlyReveal);
  shadowSpot.scale.setScalar(1.2 + observerReveal * .45);

  const baseCameraZ = lerp(18.3, 14.6, intro);
  camera.position.z = baseCameraZ;
  camera.position.y = lerp(6.2, 3.8, intro);
  camera.position.x = 0;

  if (step === 3) {
    camera.position.z = lerp(14.6, 13.8, stepProgress);
    camera.position.x = lerp(0, .65, stepProgress);
  }
  if (step === 4) {
    camera.position.z = lerp(13.8, 11.7, easeInOutCubic(stepProgress));
    camera.position.x = lerp(.65, 2.55, easeInOutCubic(stepProgress));
    camera.position.y = lerp(3.8, 2.3, easeInOutCubic(stepProgress));
  }
  if (step === 5) {
    camera.position.z = lerp(12.6, 15.8, monthlyReveal);
    camera.position.x = lerp(2.1, .4, monthlyReveal);
    camera.position.y = lerp(2.5, 5.4, monthlyReveal);
  }

  const lookTarget = step === 4
    ? earth.position.clone().add(new THREE.Vector3(-.45, .2, 0))
    : step === 5
      ? earth.position.clone().add(new THREE.Vector3(-.8, 0, 0))
      : new THREE.Vector3(.4, 0, 0);
  camera.lookAt(lookTarget);

  setOpacity(tiltCallout, step === 1 ? tiltReveal : step === 5 ? monthlyReveal : 0);
  setOpacity(umbraLabel, step === 3 ? shadowReveal : step === 4 ? 1 - observerReveal * .55 : 0);
  setOpacity(penumbraLabel, step === 3 ? shadowReveal : step === 4 ? 1 - observerReveal * .55 : 0);
  setOpacity(totalLabel, observerReveal * (1 - monthlyReveal));
  setOpacity(partialLabel, observerReveal * (1 - monthlyReveal));
  setOpacity(nodeALabel, nodeOpacity);
  setOpacity(nodeBLabel, nodeOpacity);

  renderer.render(scene, camera);

  worldToScreen(sun, sunLabel);
  worldToScreen(moon, moonLabel);
  worldToScreen(earth, earthLabel);

  const tiltAnchor = earth.position.clone().add(new THREE.Vector3(-.8, 1.8, 0));
  worldPointToScreen(tiltAnchor, tiltCallout);
  const shadowDirection = new THREE.Vector3().subVectors(moon.position, sun.position).normalize();
  worldPointToScreen(moon.position.clone().add(shadowDirection.clone().multiplyScalar(1.7)), umbraLabel);
  worldPointToScreen(moon.position.clone().add(shadowDirection.clone().multiplyScalar(2.8)).add(new THREE.Vector3(0, .75, 0)), penumbraLabel);
  worldToScreen(observerTotal, totalLabel, -.2);
  worldToScreen(observerPartial, partialLabel, .1);
  worldToScreen(nodeA, nodeALabel, .2);
  worldToScreen(nodeB, nodeBLabel, .2);

  updateLesson(time);
  scrubber.value = String(time);
  timeLabel.textContent = `${time.toFixed(1)} / ${DURATION}s`;
}

const controller = new DeterministicTimeline({
  duration: DURATION,
  steps: STEPS,
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
  controller.renderAt(controller.currentTime);
});

stepDots.forEach((dot, index) => dot.addEventListener('click', () => controller.goToStep(index)));
previousButton.addEventListener('click', () => controller.previousStep());
nextButton.addEventListener('click', () => controller.nextStep());
scrubber.addEventListener('input', () => controller.seek(Number(scrubber.value)));
toggle.addEventListener('click', () => playing ? controller.pause() : controller.play());
window.addEventListener('resize', () => controller.renderAt(controller.currentTime));

applyLanguage();
controller.renderAt(0);
