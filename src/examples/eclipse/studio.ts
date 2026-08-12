import * as THREE from 'three';
import { DeterministicTimeline, envelope, reveal, type TimelineStep } from '../../runtime/animation';
import { observeRendererViewport } from '../../runtime/canvas-viewport';
import { createStagePlayer, type StagePlayerCopy } from '../../runtime/stage-player';
import { getLanguage, persistLanguage, type AppLanguage } from '../../runtime/i18n';
import './studio.css';

const DURATION = 30;
const REAL_TILT = 5.1;
const DISPLAY_TILT = 13;
const ORBIT_RX = 3.2;
const ORBIT_RY = 1.08;

const STEPS = [
  { id: 'system', start: 0, end: 5 },
  { id: 'tilt', start: 5, end: 10 },
  { id: 'nodes', start: 10, end: 15 },
  { id: 'shadow', start: 15, end: 20 },
  { id: 'observers', start: 20, end: 25 },
  { id: 'rarity', start: 25, end: 30 },
] satisfies readonly TimelineStep[];

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing #app');
let language: AppLanguage = getLanguage();

const copy: Record<AppLanguage, StagePlayerCopy> = {
  zh: {
    brand: 'Loop Animation', category: 'Orbit · Spatial', topicTitle: '日食不是“每月一次”的简单遮挡', topicLead: '真正决定日食的是一组连续变化的空间几何关系。',
    chapterWord: '章节', keyWord: '记住', play: '播放', pause: '暂停', previous: '上一章', next: '下一章', details: '为什么？', closeDetails: '收起', language: 'EN',
    chapters: [
      { label: '建立系统', title: '先看清太阳、月球和地球的关系', summary: '太阳提供光，月球绕地球运动。日食要求月球来到太阳和地球之间。', details: '太阳是光源；地球和月球都只能反射太阳光。月球在轨道上不断运动，只有当它靠近太阳—地球视线方向时，才有机会把影子投向地球。', key: '“月球在中间”只是第一道条件。' },
      { label: '轨道倾角', title: '月球的轨道并不和地球公转平面重合', summary: `两层轨道面之间约有 ${REAL_TILT}° 的夹角，所以多数新月时月球会从视线上方或下方经过。`, details: '月球轨道相对黄道面有倾角。为了让空间关系更容易观察，画面把这个倾角放大显示；实际平均倾角约为 5.1°。', key: '轨道倾角解释了为什么新月并不等于日食。' },
      { label: '轨道交点', title: '只有靠近交点，新月才可能真正对齐', summary: '两层轨道面相交的位置叫交点。月球接近交点时，才有机会穿过太阳—地球视线。', details: '月球轨道与黄道面有两个交点。日食季出现时，太阳方向接近这条交点线；如果新月也恰好发生在这里，三者就可能接近共线。', key: '新月 + 靠近交点，才进入真正的日食窗口。' },
      { label: '影锥', title: '月球背后形成本影与半影', summary: '太阳光被月球挡住后，会在月球后方形成深浅不同的影区。', details: '本影内太阳圆面被完全遮住；半影内只遮住一部分。由于太阳并不是点光源，影子天然会形成不同区域，而不是一根简单的黑色柱子。', key: '本影决定日全食，半影决定日偏食。' },
      { label: '观察位置', title: '同一次日食，不同地点看到的结果不同', summary: '地球表面只有一条狭窄区域进入本影，更宽的区域只进入半影。', details: '月球本影投到地表的范围很小，而且会随着地球自转和月球运动移动。这条移动的狭窄路径就是日全食带；更大范围的观察者只能看到偏食。', key: '看到什么类型的日食，取决于你站在哪里。' },
      { label: '为什么稀少', title: '日食是多个条件同时满足的结果', summary: '新月、靠近交点、太阳方向接近交点线——任何一个条件错开，影子就会擦过地球。', details: '月球每个月都会经过新月，但交点方向并不会每个月都和太阳重合。因此大多数月份，月球影子从地球上方或下方掠过。只有在日食季附近，几何条件才有机会同时成立。', key: '日食稀少的原因来自三维轨道几何，而不只是“月球挡住太阳”。' },
    ],
  },
  en: {
    brand: 'Loop Animation', category: 'Orbit · Spatial', topicTitle: 'A solar eclipse is more than a monthly overlap', topicLead: 'What matters is a continuously changing 3D geometry between two orbital planes.',
    chapterWord: 'Chapter', keyWord: 'Remember', play: 'Play', pause: 'Pause', previous: 'Previous', next: 'Next', details: 'Why?', closeDetails: 'Close', language: '中文',
    chapters: [
      { label: 'The system', title: 'Start with the Sun, Moon and Earth', summary: 'The Sun supplies light and the Moon orbits Earth. An eclipse first requires the Moon to move between Sun and Earth.', details: 'The Sun is the light source. Earth and Moon only reflect sunlight. As the Moon moves continuously along its orbit, only positions near the Sun–Earth sightline can cast a shadow toward Earth.', key: '“Moon in the middle” is only the first condition.' },
      { label: 'Orbital tilt', title: "The Moon's orbit is not in the ecliptic plane", summary: `The orbital planes differ by about ${REAL_TILT}°, so most new moons pass above or below the Sun–Earth line.`, details: 'The lunar orbit is tilted relative to the ecliptic. The visualization exaggerates that angle so the spatial relationship is legible; the real average inclination is about 5.1°.', key: 'Orbital tilt is why new moon does not automatically mean eclipse.' },
      { label: 'Orbital nodes', title: 'New moon must also happen near a node', summary: 'The two planes intersect at nodes. Near a node, the Moon can actually cross the Sun–Earth sightline.', details: 'The lunar orbit intersects the ecliptic at two nodes. During an eclipse season, the Sun direction lies near the line of nodes. If new moon occurs then, all three bodies can become closely aligned.', key: 'New moon + near a node creates a real eclipse window.' },
      { label: 'Shadow cones', title: 'The Moon creates an umbra and a penumbra', summary: 'Blocking an extended light source produces distinct dark and partial-shadow regions behind the Moon.', details: 'Inside the umbra, the solar disk is completely covered. Inside the penumbra, only part of it is covered. Because the Sun has finite size, the shadow is not a simple black cylinder.', key: 'Umbra creates totality; penumbra creates a partial eclipse.' },
      { label: 'Observer position', title: 'The same eclipse looks different from different places', summary: 'Only a narrow path on Earth enters the umbra; a much broader region crosses the penumbra.', details: 'The umbral footprint is small and moves across Earth as the Moon moves and Earth rotates. That narrow moving strip is the path of totality; observers farther away see a partial eclipse.', key: 'What you see depends on where you are on Earth.' },
      { label: 'Why it is rare', title: 'Several geometric conditions must line up at once', summary: 'If new moon, node proximity or Sun direction is off, the lunar shadow simply misses Earth.', details: 'New moon occurs every month, but the line of nodes is not aligned with the Sun every month. Most of the time the Moon passes above or below the relevant sightline. Eclipse seasons are the periods when the geometry can work.', key: 'Rarity comes from 3D orbital geometry, not just one object covering another.' },
    ],
  },
};

const ui = createStagePlayer(root, { steps: STEPS, duration: DURATION, canvasAriaLabel: 'Continuous solar eclipse explainer' });
ui.overlay.innerHTML = `
  <span id="sun-label" class="story-object-label eclipse-label"></span>
  <span id="moon-label" class="story-object-label eclipse-label"></span>
  <span id="earth-label" class="story-object-label eclipse-label"></span>
  <div id="tilt-note" class="story-callout eclipse-callout"><strong></strong><small></small></div>
  <div id="node-a-note" class="story-callout eclipse-callout"><strong></strong><small></small></div>
  <div id="node-b-note" class="story-callout eclipse-callout"><strong></strong><small></small></div>
  <div id="umbra-note" class="story-callout eclipse-callout"><strong></strong><small></small></div>
  <div id="penumbra-note" class="story-callout eclipse-callout"><strong></strong><small></small></div>
  <div id="total-note" class="story-callout eclipse-callout eclipse-zone"><strong></strong><small></small></div>
  <div id="partial-note" class="story-callout eclipse-callout eclipse-zone"><strong></strong><small></small></div>
`;

const sunLabel = get<HTMLElement>('#sun-label');
const moonLabel = get<HTMLElement>('#moon-label');
const earthLabel = get<HTMLElement>('#earth-label');
const tiltNote = get<HTMLElement>('#tilt-note');
const nodeANote = get<HTMLElement>('#node-a-note');
const nodeBNote = get<HTMLElement>('#node-b-note');
const umbraNote = get<HTMLElement>('#umbra-note');
const penumbraNote = get<HTMLElement>('#penumbra-note');
const totalNote = get<HTMLElement>('#total-note');
const partialNote = get<HTMLElement>('#partial-note');

const extraCopy = {
  zh: {
    labels: ['太阳', '月球', '地球'],
    tilt: [`${REAL_TILT}° 轨道倾角`, '画面中放大以便观察'],
    node: ['轨道交点', '两层轨道面在这里相交'],
    umbra: ['本影', '太阳被完全遮住'],
    penumbra: ['半影', '太阳只被遮住一部分'],
    total: ['日全食带', '本影落到地表的狭窄区域'],
    partial: ['日偏食区域', '更宽的半影覆盖范围'],
  },
  en: {
    labels: ['Sun', 'Moon', 'Earth'],
    tilt: [`${REAL_TILT}° orbital tilt`, 'exaggerated here for visibility'],
    node: ['Orbital node', 'where the two planes intersect'],
    umbra: ['Umbra', 'the Sun is fully blocked'],
    penumbra: ['Penumbra', 'the Sun is partly blocked'],
    total: ['Path of totality', 'the narrow umbral footprint'],
    partial: ['Partial eclipse zone', 'the broader penumbral region'],
  },
} as const;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#02050a');
scene.fog = new THREE.FogExp2('#02050a', 0.011);

const camera = new THREE.PerspectiveCamera(41, 1, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ canvas: ui.canvas, antialias: true, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.04;

const ambient = new THREE.AmbientLight('#8190aa', 0.3);
scene.add(ambient);

const stars = createStars(900, 20260812);
scene.add(stars);

const sun = new THREE.Mesh(new THREE.SphereGeometry(1.85, 56, 56), new THREE.MeshBasicMaterial({ color: '#fee69a' }));
sun.position.set(-7.3, 0, 0);
scene.add(sun);
const corona = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTexture('#ffd67d'), transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending, depthWrite: false }));
corona.position.copy(sun.position);
corona.scale.set(8.2, 8.2, 1);
scene.add(corona);
const sunlight = new THREE.PointLight('#fff0bf', 42, 38, 1.3);
sunlight.position.copy(sun.position);
scene.add(sunlight);

const earth = new THREE.Mesh(new THREE.SphereGeometry(1.3, 56, 56), new THREE.MeshStandardMaterial({ color: '#1d5c90', roughness: 0.8 }));
earth.position.set(5.7, 0, 0);
scene.add(earth);
const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.42, 56, 56), new THREE.MeshBasicMaterial({ color: '#73c0ff', transparent: true, opacity: 0.11, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false }));
atmosphere.position.copy(earth.position);
scene.add(atmosphere);

const moon = new THREE.Mesh(new THREE.SphereGeometry(0.5, 42, 42), new THREE.MeshStandardMaterial({ color: '#aeb8c4', roughness: 0.94 }));
scene.add(moon);
const moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTexture('#c9d7e8'), transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false }));
moonGlow.scale.set(1.45, 1.45, 1);
scene.add(moonGlow);

const ecliptic = ellipseLine('#8fa8cb', 0.2, 0);
scene.add(ecliptic);
const lunarOrbit = ellipseLine('#d8b26f', 0.08, DISPLAY_TILT);
scene.add(lunarOrbit);

const orbitPlane = new THREE.Mesh(
  new THREE.RingGeometry(ORBIT_RX - 0.16, ORBIT_RX + 0.02, 128),
  new THREE.MeshBasicMaterial({ color: '#c6a36a', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
);
orbitPlane.position.copy(earth.position);
orbitPlane.rotation.x = Math.PI / 2 - THREE.MathUtils.degToRad(DISPLAY_TILT);
scene.add(orbitPlane);

const nodeA = marker('#8fc8ff');
const nodeB = marker('#8fc8ff');
nodeA.position.set(earth.position.x + ORBIT_RX, 0, 0);
nodeB.position.set(earth.position.x - ORBIT_RX, 0, 0);
scene.add(nodeA, nodeB);

const sunEarthLine = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([sun.position.clone(), earth.position.clone()]),
  new THREE.LineDashedMaterial({ color: '#d9e6f8', transparent: true, opacity: 0, dashSize: 0.16, gapSize: 0.13 }),
);
sunEarthLine.computeLineDistances();
scene.add(sunEarthLine);

const umbra = new THREE.Mesh(
  new THREE.ConeGeometry(0.58, 5.0, 48, 1, true),
  new THREE.MeshBasicMaterial({ color: '#03070c', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
);
scene.add(umbra);
const penumbra = new THREE.Mesh(
  new THREE.ConeGeometry(1.08, 5.5, 48, 1, true),
  new THREE.MeshBasicMaterial({ color: '#244766', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
);
scene.add(penumbra);

const totalMarker = new THREE.Object3D();
const partialMarker = new THREE.Object3D();
scene.add(totalMarker, partialMarker);

const cameraCurve = new THREE.CatmullRomCurve3([
  v(0, 4.7, 17),
  v(1.4, 4.2, 14.4),
  v(2.4, 3.7, 12.9),
  v(1.4, 3.0, 11.2),
  v(3.9, 2.45, 9.1),
  v(4.8, 1.9, 8.2),
  v(1.8, 3.6, 12.2),
], false, 'centripetal', 0.42);
const lookCurve = new THREE.CatmullRomCurve3([
  v(0.1, 0, 0),
  v(3.4, 0, 0),
  v(4.2, 0, 0),
  v(3.2, 0, 0),
  v(5.4, 0.05, 0),
  v(5.7, 0.1, 0),
  v(4.5, 0.1, 0),
], false, 'centripetal', 0.42);

const viewport = observeRendererViewport(renderer, camera, ui.stage, { maxPixelRatio: 1.5 });
const projected = new THREE.Vector3();
const shadowTarget = new THREE.Vector3();

function renderScene(time: number) {
  const orbitExplain = envelope(time, 3.7, 5.4, 12.8, 15.0);
  const nodeExplain = envelope(time, 8.4, 10.5, 16.1, 18.1);
  const shadowExplain = envelope(time, 13.0, 15.2, 23.8, 25.7);
  const observerExplain = envelope(time, 18.4, 20.2, 27.0, 29.0);
  const missExplain = reveal(time, 24.0, 28.2);

  const angle = Math.PI + 0.58 * Math.sin(((time - 15) / 30) * Math.PI);
  const local = new THREE.Vector3(
    Math.cos(angle) * ORBIT_RX,
    Math.sin(angle) * ORBIT_RY,
    Math.sin(angle) * 0.18,
  );
  local.applyAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(DISPLAY_TILT));
  local.y += missExplain * 0.62;
  moon.position.copy(earth.position).add(local);
  moonGlow.position.copy(moon.position);

  earth.rotation.y = time * 0.12;
  moon.rotation.y = time * 0.1;
  stars.rotation.y = time * 0.0012;
  corona.scale.setScalar(8.0 + Math.sin(time * 0.55) * 0.14 + shadowExplain * 0.22);

  (lunarOrbit.material as THREE.LineBasicMaterial).opacity = 0.08 + orbitExplain * 0.43 + nodeExplain * 0.14;
  (ecliptic.material as THREE.LineBasicMaterial).opacity = 0.14 + orbitExplain * 0.14;
  (orbitPlane.material as THREE.MeshBasicMaterial).opacity = orbitExplain * 0.075 + nodeExplain * 0.025;
  (nodeA.material as THREE.MeshBasicMaterial).opacity = nodeExplain * 0.9;
  (nodeB.material as THREE.MeshBasicMaterial).opacity = nodeExplain * 0.76;
  (sunEarthLine.material as THREE.LineDashedMaterial).opacity = nodeExplain * 0.34 + shadowExplain * 0.12;

  const shadowDirection = shadowTarget.copy(moon.position).sub(sun.position).normalize();
  const umbraEnd = moon.position.clone().add(shadowDirection.clone().multiplyScalar(5.0));
  const penumbraEnd = moon.position.clone().add(shadowDirection.clone().multiplyScalar(5.5));
  orientCone(umbra, moon.position, umbraEnd, 5.0);
  orientCone(penumbra, moon.position, penumbraEnd, 5.5);
  (umbra.material as THREE.MeshBasicMaterial).opacity = shadowExplain * 0.5 * (1 - missExplain * 0.55);
  (penumbra.material as THREE.MeshBasicMaterial).opacity = shadowExplain * 0.12 * (1 - missExplain * 0.35);

  sunlight.intensity = THREE.MathUtils.lerp(42, 34, shadowExplain * (1 - missExplain));
  ambient.intensity = THREE.MathUtils.lerp(0.3, 0.2, shadowExplain * (1 - missExplain));
  (atmosphere.material as THREE.MeshBasicMaterial).opacity = 0.1 + observerExplain * 0.07;

  totalMarker.position.copy(earth.position).add(v(-1.0, 0.12, 0.96));
  partialMarker.position.copy(earth.position).add(v(-0.12, 0.98, 0.82));

  const progress = Math.min(1, Math.max(0, time / DURATION));
  cameraCurve.getPointAt(progress, camera.position);
  camera.lookAt(lookCurve.getPointAt(progress));
  renderer.render(scene, camera);

  project(sun.position, sunLabel, 0.96, 14, -4);
  project(moon.position, moonLabel, 0.96, 12, 8);
  project(earth.position, earthLabel, 0.96, 14, -2);
  project(v(earth.position.x + 0.35, 2.15, 0.55), tiltNote, orbitExplain, 8, -8);
  project(nodeA.position, nodeANote, nodeExplain, 8, -14);
  project(nodeB.position, nodeBNote, nodeExplain * 0.78, 8, -14);
  project(v(2.65, -1.7, 0), umbraNote, shadowExplain * (1 - missExplain * 0.4), 8, 0);
  project(v(3.45, -2.25, 0), penumbraNote, shadowExplain * 0.9, 8, 0);
  project(totalMarker.position, totalNote, observerExplain * (1 - missExplain * 0.55), 14, 0);
  project(partialMarker.position, partialNote, observerExplain * 0.9, 14, -8);
}

const controller = new DeterministicTimeline({ duration: DURATION, steps: STEPS, onRender: renderScene });
window.__LOOP_ANIMATION__ = controller;
ui.applyCopy(copy[language], language);
applyOverlayCopy();
ui.bindController(controller);

ui.languageButton.addEventListener('click', () => {
  language = language === 'zh' ? 'en' : 'zh';
  persistLanguage(language);
  const url = new URL(window.location.href);
  url.searchParams.set('lang', language);
  history.replaceState({}, '', url);
  ui.applyCopy(copy[language], language);
  applyOverlayCopy();
  controller.renderAt(controller.currentTime);
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight') controller.nextStep();
  if (event.key === 'ArrowLeft') controller.previousStep();
  if (event.key === ' ') {
    event.preventDefault();
    controller.isPlaying ? controller.pause() : controller.play();
  }
});

function applyOverlayCopy() {
  const current = extraCopy[language];
  sunLabel.textContent = current.labels[0];
  moonLabel.textContent = current.labels[1];
  earthLabel.textContent = current.labels[2];
  setCallout(tiltNote, current.tilt);
  setCallout(nodeANote, current.node);
  setCallout(nodeBNote, current.node);
  setCallout(umbraNote, current.umbra);
  setCallout(penumbraNote, current.penumbra);
  setCallout(totalNote, current.total);
  setCallout(partialNote, current.partial);
}

function setCallout(element: HTMLElement, copyValue: readonly [string, string]) {
  const strong = element.querySelector('strong');
  const small = element.querySelector('small');
  if (strong) strong.textContent = copyValue[0];
  if (small) small.textContent = copyValue[1];
}

function project(world: THREE.Vector3, element: HTMLElement, opacity: number, offsetX = 0, offsetY = 0) {
  projected.copy(world).project(camera);
  const x = (projected.x * 0.5 + 0.5) * viewport.width + offsetX;
  const y = (-projected.y * 0.5 + 0.5) * viewport.height + offsetY;
  element.style.transform = `translate(${x}px, ${y}px)`;
  element.style.opacity = String(projected.z > 1 ? 0 : Math.min(1, Math.max(0, opacity)));
}

function ellipseLine(color: string, opacity: number, tilt: number) {
  const points = new THREE.EllipseCurve(earth.position.x, 0, ORBIT_RX, ORBIT_RY, 0, Math.PI * 2)
    .getPoints(150)
    .map((point) => new THREE.Vector3(point.x, point.y, 0));
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
  );
  line.rotation.x = THREE.MathUtils.degToRad(tilt);
  return line;
}

function marker(color: string) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 18, 18),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0 }),
  );
}

function orientCone(mesh: THREE.Mesh, from: THREE.Vector3, to: THREE.Vector3, length: number) {
  const direction = new THREE.Vector3().subVectors(to, from).normalize();
  const center = from.clone().add(direction.clone().multiplyScalar(length * 0.5));
  mesh.position.copy(center);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
}

function createStars(count: number, seed: number) {
  const random = seeded(seed);
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const radius = 18 + random() * 35;
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[index * 3 + 1] = radius * Math.cos(phi);
    positions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({ color: '#d8e6ff', size: 0.028, transparent: true, opacity: 0.7 }));
}

function radialTexture(color: string) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const context = canvas.getContext('2d')!;
  const gradient = context.createRadialGradient(128, 128, 8, 128, 128, 126);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.2, color);
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(canvas);
}

function seeded(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function v(x: number, y: number, z: number) {
  return new THREE.Vector3(x, y, z);
}

function get<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing ${selector}`);
  return element;
}
