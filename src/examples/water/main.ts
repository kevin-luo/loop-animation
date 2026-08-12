import * as THREE from 'three';
import { DeterministicTimeline, envelope, reveal, type TimelineStep } from '../../runtime/animation';
import { observeRendererViewport } from '../../runtime/canvas-viewport';
import { createStagePlayer, type StagePlayerCopy } from '../../runtime/stage-player';
import { getLanguage, persistLanguage, type AppLanguage } from '../../runtime/i18n';
import './style.css';

const DURATION = 25;
const STEPS = [
  { id: 'evaporation', start: 0, end: 5 },
  { id: 'transport', start: 5, end: 10 },
  { id: 'precipitation', start: 10, end: 15 },
  { id: 'runoff', start: 15, end: 20 },
  { id: 'groundwater', start: 20, end: 25 },
] satisfies readonly TimelineStep[];

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing #app');

let language: AppLanguage = getLanguage();

const copy: Record<AppLanguage, StagePlayerCopy> = {
  zh: {
    brand: 'Loop Animation',
    category: 'Earth System · Flow',
    topicTitle: '水循环：一滴水的旅程',
    topicLead: '不是五个互不相干的镜头，而是一套连续流动的地球系统。',
    chapterWord: '章节', keyWord: '记住', play: '播放', pause: '暂停', previous: '上一章', next: '下一章', details: '为什么？', closeDetails: '收起', language: 'EN',
    chapters: [
      { label: '蒸发', title: '太阳把海水送进大气', summary: '水没有消失。它只是从液态变成水汽，离开海面向上移动。', details: '太阳辐射给海洋表层提供能量。少量水分子获得足够动能后脱离液面，进入近地大气。温度、风速和空气湿度都会影响蒸发速度。', key: '蒸发改变水的状态，也改变水所在的位置。' },
      { label: '输送与凝结', title: '风把水汽搬向陆地', summary: '空气移动带走水汽；空气抬升并冷却后，水汽开始凝结成云滴。', details: '水汽会跟随大尺度空气流动。当湿空气被地形抬升时，温度降低，达到露点后水汽凝结在微小颗粒周围，形成云滴或冰晶。', key: '风负责搬运，冷却负责把看不见的水汽重新变成可见的云。' },
      { label: '降水', title: '云滴长大，重力开始占上风', summary: '小水滴不断碰撞和合并，直到上升气流再也托不住它们。', details: '云中的水滴和冰晶持续碰撞、聚并。当颗粒足够大时，重力超过空气上升运动提供的支撑，它们就以雨、雪或冰雹的形式落回地表。', key: '降水把大气中的水重新交还给地表。' },
      { label: '地表径流', title: '落下来的水会顺着地形寻找低处', summary: '一部分水汇入溪流和河流，沿着重力方向重新接近海洋。', details: '降水到达地面后，如果土壤无法立刻吸收，就会形成地表径流。坡度和地形决定水流方向，小股水流逐渐汇成溪流、河流和湖泊。', key: '河流是陆地与海洋之间的一条快速回路。' },
      { label: '地下水', title: '还有一条更慢、更隐蔽的回路', summary: '另一部分水向下渗入岩土层，在地下缓慢移动，最后仍会回到河流或海洋。', details: '水会穿过土壤孔隙和可渗透岩层，补给地下含水层。地下水的移动速度通常远慢于地表河流，但它能持续补给泉水、河流和近岸海洋。', key: '水循环同时发生在天空、地表和地下，而且这些路径彼此连接。' },
    ],
  },
  en: {
    brand: 'Loop Animation',
    category: 'Earth System · Flow',
    topicTitle: 'The water cycle: one drop, one connected system',
    topicLead: 'Not five disconnected scenes — one continuous journey through atmosphere, land and ocean.',
    chapterWord: 'Chapter', keyWord: 'Remember', play: 'Play', pause: 'Pause', previous: 'Previous', next: 'Next', details: 'Why?', closeDetails: 'Close', language: '中文',
    chapters: [
      { label: 'Evaporation', title: 'Solar energy lifts water into the atmosphere', summary: 'The water does not disappear. It changes state and moves away from the ocean surface as vapor.', details: 'Solar radiation adds energy to surface water. Some molecules gain enough kinetic energy to escape the liquid surface and enter the lower atmosphere. Temperature, wind and humidity all influence the rate.', key: 'Evaporation changes both the state of water and where it is stored.' },
      { label: 'Transport & condensation', title: 'Wind carries moisture inland', summary: 'Moving air transports vapor; uplift and cooling then allow it to condense into cloud droplets.', details: 'Water vapor travels with larger air masses. When moist air is forced upward over terrain it cools. Once it reaches the dew point, vapor condenses around tiny particles into droplets or ice crystals.', key: 'Wind transports moisture; cooling makes invisible vapor visible again.' },
      { label: 'Precipitation', title: 'Droplets grow until gravity wins', summary: 'Cloud particles collide and merge until rising air can no longer keep them aloft.', details: 'Droplets and ice crystals repeatedly collide and combine. When they become sufficiently large, gravity overwhelms the support from rising air and they fall as rain, snow or hail.', key: 'Precipitation returns atmospheric water to the surface.' },
      { label: 'Surface runoff', title: 'Water follows the terrain downhill', summary: 'Some water joins streams and rivers, moving quickly back toward the ocean under gravity.', details: 'Water that cannot immediately infiltrate the ground becomes surface runoff. Slope and terrain route it into small channels, then streams, rivers and lakes.', key: 'Rivers form a relatively fast return path from land to ocean.' },
      { label: 'Groundwater', title: 'A slower hidden route continues underground', summary: 'Other water infiltrates soil and rock, then moves slowly through aquifers before returning to rivers or the sea.', details: 'Water can pass through soil pores and permeable rock, recharging aquifers. Groundwater often moves far more slowly than rivers, yet it steadily feeds springs, streams and coastal waters.', key: 'The water cycle connects atmosphere, surface water and groundwater into one system.' },
    ],
  },
};

const ui = createStagePlayer(root, {
  steps: STEPS,
  duration: DURATION,
  canvasAriaLabel: 'Continuous interactive water cycle explainer',
});

ui.overlay.innerHTML = `
  <div id="water-evap" class="story-callout water-callout"><strong></strong><small></small></div>
  <div id="water-cloud" class="story-callout water-callout"><strong></strong><small></small></div>
  <div id="water-rain" class="story-callout water-callout"><strong></strong><small></small></div>
  <div id="water-runoff" class="story-callout water-callout"><strong></strong><small></small></div>
  <div id="water-ground" class="story-callout water-callout"><strong></strong><small></small></div>
  <div id="hero-drop-label" class="water-drop-label"></div>
`;

const callouts = [
  get<HTMLElement>('#water-evap'),
  get<HTMLElement>('#water-cloud'),
  get<HTMLElement>('#water-rain'),
  get<HTMLElement>('#water-runoff'),
  get<HTMLElement>('#water-ground'),
];
const heroDropLabel = get<HTMLElement>('#hero-drop-label');

const extraCopy = {
  zh: {
    hero: '同一滴水',
    callouts: [
      ['蒸发', '液态水 → 水汽'],
      ['凝结', '水汽 → 云滴'],
      ['降水', '重力把水带回地表'],
      ['径流', '沿地形汇入河流'],
      ['地下水', '更慢的隐藏回路'],
    ],
  },
  en: {
    hero: 'the same drop',
    callouts: [
      ['Evaporation', 'liquid → vapor'],
      ['Condensation', 'vapor → cloud droplets'],
      ['Precipitation', 'gravity returns water'],
      ['Runoff', 'terrain routes water'],
      ['Groundwater', 'the slower hidden route'],
    ],
  },
} as const;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#08131b');
scene.fog = new THREE.FogExp2('#08131b', 0.018);

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
const renderer = new THREE.WebGLRenderer({
  canvas: ui.canvas,
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.04;

scene.add(new THREE.HemisphereLight('#c5e3ff', '#24362a', 1.45));
const sunlight = new THREE.DirectionalLight('#fff0bd', 3.2);
sunlight.position.set(-7, 10, 5);
scene.add(sunlight);

const ocean = new THREE.Mesh(
  new THREE.PlaneGeometry(14, 8),
  new THREE.MeshStandardMaterial({ color: '#126ca8', roughness: 0.38, metalness: 0.03 }),
);
ocean.rotation.x = -Math.PI / 2;
ocean.position.set(-5, -2.12, 1);
scene.add(ocean);

const oceanGlow = new THREE.Mesh(
  new THREE.PlaneGeometry(13.7, 7.7),
  new THREE.MeshBasicMaterial({ color: '#37a9ef', transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false }),
);
oceanGlow.rotation.x = -Math.PI / 2;
oceanGlow.position.set(-5, -2.08, 1);
scene.add(oceanGlow);

const underground = new THREE.Mesh(
  new THREE.BoxGeometry(11, 3.3, 7),
  new THREE.MeshStandardMaterial({ color: '#514237', roughness: 1 }),
);
underground.position.set(4.7, -3.6, 0);
scene.add(underground);

const soilTop = new THREE.Mesh(
  new THREE.BoxGeometry(11, 0.5, 7),
  new THREE.MeshStandardMaterial({ color: '#64804b', roughness: 0.95 }),
);
soilTop.position.set(4.7, -1.72, 0);
scene.add(soilTop);

const coast = new THREE.Mesh(
  new THREE.BoxGeometry(2.2, 0.52, 7),
  new THREE.MeshStandardMaterial({ color: '#b9a77d', roughness: 0.98 }),
);
coast.position.set(-0.25, -1.78, 0);
scene.add(coast);

const mountains = new THREE.Group();
scene.add(mountains);
[
  [3.8, 0, 1.3, 2.5, 5.2],
  [5.5, -0.8, 1.1, 2.1, 4.4],
  [6.9, 0.55, 1.2, 1.75, 3.7],
].forEach(([x, z, y, radius, height], index) => {
  const mountain = new THREE.Mesh(
    new THREE.ConeGeometry(radius, height, 8),
    new THREE.MeshStandardMaterial({ color: index === 0 ? '#526b58' : '#445d4c', roughness: 0.98 }),
  );
  mountain.position.set(x, y + 0.35, z);
  mountain.rotation.y = index * 0.27;
  mountains.add(mountain);

  const snow = new THREE.Mesh(
    new THREE.ConeGeometry(radius * 0.42, height * 0.23, 8),
    new THREE.MeshStandardMaterial({ color: '#dce8ea', roughness: 0.84 }),
  );
  snow.position.set(x, y + height * 0.5 + 0.04, z);
  snow.rotation.y = mountain.rotation.y;
  mountains.add(snow);
});

const riverCurve = new THREE.CatmullRomCurve3([
  v(4.85, -0.85, -0.2),
  v(3.7, -1.26, -0.08),
  v(2.55, -1.54, 0.28),
  v(1.25, -1.66, 0.12),
  v(0.05, -1.8, 0.46),
  v(-1.35, -1.98, 0.62),
], false, 'centripetal');
const river = new THREE.Mesh(
  new THREE.TubeGeometry(riverCurve, 96, 0.14, 10, false),
  new THREE.MeshBasicMaterial({ color: '#3bb5ff', transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false }),
);
scene.add(river);

const groundwaterCurve = new THREE.CatmullRomCurve3([
  v(5.45, -2.05, 0.6),
  v(4.8, -2.8, 0.7),
  v(3.3, -3.3, 0.5),
  v(1.7, -3.35, 0.6),
  v(0.15, -3.08, 0.78),
  v(-1.1, -2.65, 0.82),
], false, 'centripetal');
const groundwater = new THREE.Mesh(
  new THREE.TubeGeometry(groundwaterCurve, 90, 0.105, 10, false),
  new THREE.MeshBasicMaterial({ color: '#36aaff', transparent: true, opacity: 0.035, blending: THREE.AdditiveBlending, depthWrite: false }),
);
scene.add(groundwater);

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(0.72, 36, 36),
  new THREE.MeshBasicMaterial({ color: '#ffd96b' }),
);
sun.position.set(-6, 5, -3);
scene.add(sun);
const sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({
  map: radialTexture('#ffd86d'),
  transparent: true,
  opacity: 0.46,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
}));
sunHalo.position.copy(sun.position);
sunHalo.scale.set(4, 4, 1);
scene.add(sunHalo);

const cloud = new THREE.Group();
scene.add(cloud);
[
  [0, 0, 0, 1.12], [1, 0.08, 0, 0.92], [-0.96, 0.06, 0.08, 0.82],
  [0.36, 0.52, -0.1, 0.78], [-0.42, 0.5, 0.05, 0.72],
].forEach(([x, y, z, scale]) => {
  const puff = new THREE.Mesh(
    new THREE.SphereGeometry(scale, 24, 18),
    new THREE.MeshStandardMaterial({ color: '#dce7ee', roughness: 0.97, transparent: true, opacity: 0.8 }),
  );
  puff.position.set(x, y, z);
  cloud.add(puff);
});
cloud.position.set(1.0, 4.35, 0);

const vaporPath = new THREE.CatmullRomCurve3([
  v(-5.0, -1.82, 1.0), v(-4.5, 0.1, 0.95), v(-3.3, 2.2, 0.75), v(-1.6, 3.25, 0.45),
], false, 'centripetal');
const transportPath = new THREE.CatmullRomCurve3([
  v(-1.8, 3.2, 0.4), v(-0.2, 3.65, 0.2), v(1.5, 3.8, 0.05), v(3.25, 3.68, 0),
], false, 'centripetal');

const vaporField = createPointField(54, '#76d2ff', 0.09);
const transportField = createPointField(46, '#99dbff', 0.075);
const rainField = createPointField(64, '#73c9ff', 0.055);
const runoffField = createPointField(42, '#4fc0ff', 0.07);
const groundwaterField = createPointField(34, '#4db9ff', 0.065);

const heroCurve = new THREE.CatmullRomCurve3([
  v(-5.1, -1.76, 1.05),
  v(-3.15, 2.5, 0.75),
  v(3.15, 3.72, 0.05),
  v(4.85, -1.22, -0.12),
  v(1.7, -1.62, 0.38),
  v(-1.2, -1.95, 0.62),
], false, 'centripetal', 0.45);
const heroDrop = new THREE.Mesh(
  new THREE.SphereGeometry(0.105, 16, 16),
  new THREE.MeshBasicMaterial({ color: '#e3f8ff' }),
);
scene.add(heroDrop);
const heroGlow = new THREE.Sprite(new THREE.SpriteMaterial({
  map: radialTexture('#66caff'), transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false,
}));
heroGlow.scale.set(0.8, 0.8, 1);
scene.add(heroGlow);

const branchDrop = new THREE.Mesh(
  new THREE.SphereGeometry(0.085, 14, 14),
  new THREE.MeshBasicMaterial({ color: '#8edbff', transparent: true, opacity: 0 }),
);
scene.add(branchDrop);
const branchGlow = new THREE.Sprite(new THREE.SpriteMaterial({
  map: radialTexture('#44b8ff'), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false,
}));
branchGlow.scale.set(0.62, 0.62, 1);
scene.add(branchGlow);

const cameraCurve = new THREE.CatmullRomCurve3([
  v(0.0, 2.4, 15.2),
  v(0.3, 2.8, 14.6),
  v(1.25, 2.95, 14.0),
  v(1.7, 2.3, 13.5),
  v(1.25, 1.5, 13.2),
  v(0.8, -0.05, 12.5),
], false, 'centripetal', 0.4);
const lookCurve = new THREE.CatmullRomCurve3([
  v(0, 0.3, 0),
  v(0.4, 0.55, 0),
  v(1.4, 0.65, 0),
  v(1.7, -0.2, 0),
  v(1.2, -0.7, 0),
  v(0.7, -1.5, 0),
], false, 'centripetal', 0.4);

const viewport = observeRendererViewport(renderer, camera, ui.stage, { maxPixelRatio: 1.5 });

const calloutWorld = [
  v(-4.3, 0.65, 1.0),
  v(2.55, 3.65, 0),
  v(4.45, 1.45, -0.2),
  v(2.45, -1.15, 0.18),
  v(2.35, -2.78, 0.55),
];
const tmpProjected = new THREE.Vector3();

function renderScene(time: number) {
  const evaporation = envelope(time, 0.15, 1.25, 8.8, 10.8);
  const transport = envelope(time, 3.4, 5.6, 12.0, 14.1);
  const precipitation = envelope(time, 8.6, 10.7, 16.8, 18.7);
  const runoff = envelope(time, 13.2, 15.4, 22.3, 24.6);
  const groundwaterFlow = reveal(time, 17.4, 20.5);

  const oceanWave = Math.sin(time * 0.72) * 0.013;
  ocean.position.y = -2.12 + oceanWave;
  oceanGlow.position.y = -2.08 + oceanWave;
  (oceanGlow.material as THREE.MeshBasicMaterial).opacity = 0.075 + evaporation * 0.07;
  sunHalo.scale.setScalar(3.8 + evaporation * 0.5 + Math.sin(time * 0.55) * 0.08);
  sunlight.intensity = 3.0 + evaporation * 0.75;

  const cloudTravel = reveal(time, 2.8, 9.4);
  cloud.position.x = THREE.MathUtils.lerp(0.9, 3.25, cloudTravel);
  cloud.position.y = THREE.MathUtils.lerp(4.35, 3.7, cloudTravel);
  const cloudDensity = Math.min(1, transport * 0.8 + precipitation * 0.65);
  cloud.scale.setScalar(0.84 + cloudDensity * 0.28);
  cloud.children.forEach((child) => {
    const material = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
    material.color.setRGB(
      THREE.MathUtils.lerp(0.86, 0.62, precipitation * 0.55),
      THREE.MathUtils.lerp(0.91, 0.69, precipitation * 0.55),
      THREE.MathUtils.lerp(0.94, 0.76, precipitation * 0.55),
    );
    material.opacity = 0.62 + cloudDensity * 0.26;
  });

  updateCurveField(vaporField, vaporPath, time * 0.115, 0.82, evaporation, (index, point) => {
    point.x += ((index % 7) - 3) * 0.055;
    point.z += ((index % 5) - 2) * 0.04;
  });
  updateCurveField(transportField, transportPath, time * 0.082, 0.95, transport, (index, point) => {
    point.y += Math.sin(index * 1.7 + time * 0.7) * 0.08;
    point.z += ((index % 6) - 2.5) * 0.045;
  });
  updateRainField(rainField, time, precipitation);
  updateCurveField(runoffField, riverCurve, time * 0.105, 1, runoff);
  updateCurveField(groundwaterField, groundwaterCurve, time * 0.063, 1, groundwaterFlow);

  (river.material as THREE.MeshBasicMaterial).opacity = 0.16 + runoff * 0.74 + groundwaterFlow * 0.08;
  (groundwater.material as THREE.MeshBasicMaterial).opacity = 0.03 + groundwaterFlow * 0.72;

  const heroProgress = Math.min(1, Math.max(0, time / DURATION));
  heroCurve.getPointAt(heroProgress, heroDrop.position);
  heroGlow.position.copy(heroDrop.position);
  const heroPulse = 0.72 + Math.sin(time * 4.2) * 0.08;
  heroGlow.scale.set(heroPulse, heroPulse, 1);

  const branch = reveal(time, 19.2, 21.0);
  const branchProgress = Math.min(1, Math.max(0, (time - 19.2) / 5.8));
  groundwaterCurve.getPointAt(branchProgress, branchDrop.position);
  branchGlow.position.copy(branchDrop.position);
  (branchDrop.material as THREE.MeshBasicMaterial).opacity = branch * 0.9;
  (branchGlow.material as THREE.SpriteMaterial).opacity = branch * 0.5;

  const cameraProgress = Math.min(1, Math.max(0, time / DURATION));
  cameraCurve.getPointAt(cameraProgress, camera.position);
  const lookAt = lookCurve.getPointAt(cameraProgress);
  camera.lookAt(lookAt);

  renderer.render(scene, camera);

  updateCallout(callouts[0], calloutWorld[0], evaporation, 10, -8);
  updateCallout(callouts[1], calloutWorld[1], transport, 10, -6);
  updateCallout(callouts[2], calloutWorld[2], precipitation, 10, -6);
  updateCallout(callouts[3], calloutWorld[3], runoff, 10, -6);
  updateCallout(callouts[4], calloutWorld[4], groundwaterFlow, 10, -6);
  updateCallout(heroDropLabel, heroDrop.position, 0.88, 12, -16);
}

const controller = new DeterministicTimeline({
  duration: DURATION,
  steps: STEPS,
  onRender: renderScene,
});
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
  heroDropLabel.textContent = current.hero;
  current.callouts.forEach((entry, index) => {
    const strong = callouts[index].querySelector('strong');
    const small = callouts[index].querySelector('small');
    if (strong) strong.textContent = entry[0];
    if (small) small.textContent = entry[1];
  });
}

function createPointField(count: number, color: string, size: number) {
  const positions = new Float32Array(count * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color,
    size,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geometry, material);
  scene.add(points);
  return { count, positions, geometry, material, points };
}

type PointField = ReturnType<typeof createPointField>;

function updateCurveField(
  field: PointField,
  curve: THREE.Curve<THREE.Vector3>,
  offset: number,
  spread: number,
  opacity: number,
  mutate?: (index: number, point: THREE.Vector3) => void,
) {
  const point = new THREE.Vector3();
  for (let index = 0; index < field.count; index += 1) {
    const phase = fract(offset + (index / field.count) * spread);
    curve.getPointAt(phase, point);
    mutate?.(index, point);
    field.positions[index * 3] = point.x;
    field.positions[index * 3 + 1] = point.y;
    field.positions[index * 3 + 2] = point.z;
  }
  field.geometry.attributes.position.needsUpdate = true;
  field.material.opacity = opacity * 0.72;
}

function updateRainField(field: PointField, time: number, opacity: number) {
  for (let index = 0; index < field.count; index += 1) {
    const phase = fract(time * 0.18 + index / field.count);
    const x = 2.25 + (index % 11) * 0.28;
    const y = THREE.MathUtils.lerp(3.15, -1.48, phase);
    const z = -0.9 + (index % 7) * 0.27;
    field.positions[index * 3] = x;
    field.positions[index * 3 + 1] = y;
    field.positions[index * 3 + 2] = z;
  }
  field.geometry.attributes.position.needsUpdate = true;
  field.material.opacity = opacity * 0.78;
}

function updateCallout(element: HTMLElement, world: THREE.Vector3, opacity: number, offsetX = 0, offsetY = 0) {
  tmpProjected.copy(world).project(camera);
  const behind = tmpProjected.z > 1;
  const x = (tmpProjected.x * 0.5 + 0.5) * viewport.width + offsetX;
  const y = (-tmpProjected.y * 0.5 + 0.5) * viewport.height + offsetY;
  element.style.transform = `translate(${x}px, ${y}px)`;
  element.style.opacity = String(behind ? 0 : Math.min(1, Math.max(0, opacity)));
}

function radialTexture(color: string) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const context = canvas.getContext('2d')!;
  const gradient = context.createRadialGradient(128, 128, 8, 128, 128, 126);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.22, color);
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(canvas);
}

function fract(value: number) {
  return value - Math.floor(value);
}

function v(x: number, y: number, z: number) {
  return new THREE.Vector3(x, y, z);
}

function get<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing ${selector}`);
  return element;
}
