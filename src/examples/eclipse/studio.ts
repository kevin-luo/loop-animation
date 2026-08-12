import * as THREE from 'three';
import { DeterministicTimeline, easeInOutCubic, lerp, stepProgressAt, type TimelineStep } from '../../runtime/animation';
import { createLessonShell, type LessonShellCopy } from '../../runtime/lesson-shell';
import { getLanguage, persistLanguage, type AppLanguage } from '../../runtime/i18n';
import './studio.css';

const DURATION = 30;
const REAL_TILT = 5.1;
const DISPLAY_TILT = 13;
const ORBIT_RX = 3.2;
const ORBIT_RY = 1.08;
const STEPS = [
  { id: 'roles', start: 0, end: 5 },
  { id: 'tilt', start: 5, end: 10 },
  { id: 'nodes', start: 10, end: 15 },
  { id: 'shadow', start: 15, end: 20 },
  { id: 'observers', start: 20, end: 25 },
  { id: 'summary', start: 25, end: 30 },
] satisfies readonly TimelineStep[];

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing #app');
let language: AppLanguage = getLanguage();
let playing = false;

const copy: Record<AppLanguage, LessonShellCopy> = {
  zh: {
    brand: 'Loop Animation', category: 'Orbit / Spatial', topicLabel: '主题', topicTitle: '为什么会发生日食？',
    topicLead: '把新月、轨道倾角、交点和影子拆成 6 个可观察步骤。', panelTitle: '解说', controlsTitle: '演示控制',
    stepWord: '步骤', keyWord: '关键点', watchWord: '观察重点', play: '播放', pause: '暂停', previous: '上一步', next: '下一步', reset: '重置', lang: 'EN',
    steps: [
      { nav: '建立空间关系', kicker: 'Step 01 · 先把角色摆清楚', title: '谁在发光，谁在绕谁运动？', body: '太阳是光源，地球接收太阳光，月球围绕地球运行。要发生日食，月球必须先来到太阳和地球之间。', watch: '先看三者的相对位置：太阳在左，地球在右，月球围绕地球运行。', key: '日食只可能出现在新月附近，但新月本身还远远不够。' },
      { nav: '月球轨道倾斜', kicker: 'Step 02 · 第一个限制条件', title: '月球轨道其实是倾斜的', body: `月球轨道相对黄道面倾斜约 ${REAL_TILT}°。多数新月时，月球会从太阳视线的上方或下方经过，影子根本碰不到地球。`, watch: '白色轨道表示参考平面，金色轨道表示倾斜后的月球轨道。', key: '轨道倾角是“为什么不会每个月都有日食”的核心原因。' },
      { nav: '交点与对齐', kicker: 'Step 03 · 第二个限制条件', title: '新月还要刚好靠近轨道交点', body: '月球轨道与黄道面的两个交叉点叫“交点”。只有新月同时靠近交点，太阳、月球和地球才可能真正接近一条直线。', watch: '两个交点会被点亮，月球沿轨道向其中一个交点靠近。', key: '新月 + 靠近交点，才进入日食窗口。' },
      { nav: '本影和半影', kicker: 'Step 04 · 影子开始形成', title: '月球把太阳光切成两层影子', body: '月球挡住太阳后，背后会形成更窄更暗的本影，以及更宽更浅的半影。本影里太阳被完全遮住，半影里只遮住一部分。', watch: '看月球后方的两层影锥：深色是本影，浅色是半影。', key: '本影决定日全食区域，半影决定日偏食区域。' },
      { nav: '不同地点不同景象', kicker: 'Step 05 · 你站在哪里很重要', title: '同一次日食，不同地点看到的并不一样', body: '地球表面落进本影的人会看到日全食；落进半影的人会看到日偏食。本影在地球表面移动，就形成一条狭窄的日全食带。', watch: '镜头靠近地球后，比较日全食区域和日偏食区域。', key: '日食类型不只由时间决定，还取决于你站在地球上的哪里。' },
      { nav: '为什么不常发生', kicker: 'Step 06 · 把条件合在一起', title: '所以日食为什么这么少？', body: '必须同时满足：新月、接近交点、三体几乎共线。只要节点方向和太阳方向没有对齐，即使是新月，月球影子也会从地球上方或下方掠过。', watch: '最后一步月球开始错位，影子从地球旁边掠过。', key: '日食是多个几何条件同时成立的结果。' },
    ],
  },
  en: {
    brand: 'Loop Animation', category: 'Orbit / Spatial', topicLabel: 'Topic', topicTitle: 'Why does a solar eclipse happen?',
    topicLead: 'Break new moon, orbital tilt, nodes and shadow geometry into six observable steps.', panelTitle: 'Explanation', controlsTitle: 'Playback',
    stepWord: 'Step', keyWord: 'Key idea', watchWord: 'What to watch', play: 'Play', pause: 'Pause', previous: 'Previous', next: 'Next', reset: 'Reset', lang: '中文',
    steps: [
      { nav: 'Establish the system', kicker: 'Step 01 · Set the scene', title: 'Who emits light, and who orbits whom?', body: 'The Sun is the light source, Earth receives sunlight, and the Moon orbits Earth. For a solar eclipse to happen, the Moon must first pass between the Sun and Earth.', watch: 'Start with the big spatial picture: Sun on the left, Earth on the right, Moon orbiting Earth.', key: 'A solar eclipse is only possible near new moon, but new moon alone is not enough.' },
      { nav: 'The orbit is tilted', kicker: 'Step 02 · First constraint', title: "The Moon's orbit is tilted", body: `The lunar orbit is tilted by about ${REAL_TILT}° relative to the ecliptic. During most new moons, the Moon passes above or below the Sun-Earth line, so its shadow misses Earth.`, watch: 'The pale orbit is the reference plane; the gold orbit shows the tilted lunar orbit.', key: 'Orbital tilt is the main reason a solar eclipse does not happen every month.' },
      { nav: 'Nodes and alignment', kicker: 'Step 03 · Second constraint', title: 'New moon must happen near an orbital node', body: 'The two intersections between the lunar orbit and the ecliptic are called nodes. Only when new moon happens near a node can the Sun, Moon and Earth become closely aligned.', watch: 'Both nodes light up while the Moon approaches one of them.', key: 'New moon + near a node creates an eclipse window.' },
      { nav: 'Umbra and penumbra', kicker: 'Step 04 · The shadow appears', title: 'The Moon creates two shadow regions', body: 'Behind the Moon, the narrow darker umbra is where the Sun is fully blocked. The wider penumbra is where only part of the Sun is blocked.', watch: 'Look behind the Moon: the dark inner cone is the umbra and the softer outer cone is the penumbra.', key: 'Umbra produces totality; penumbra produces a partial eclipse.' },
      { nav: 'Different places, different view', kicker: 'Step 05 · Your location matters', title: 'The same eclipse looks different from different places', body: 'Observers inside the umbra see a total eclipse. Observers inside the penumbra see a partial eclipse. The moving umbra traces a narrow path of totality across Earth.', watch: 'The camera moves closer to Earth so both viewing zones become easier to compare.', key: 'Eclipse type depends on where you are on Earth, not only on the time.' },
      { nav: 'Why eclipses are rare', kicker: 'Step 06 · Put the conditions together', title: 'So why are solar eclipses relatively rare?', body: 'You need new moon, proximity to a node, and near-perfect alignment at the same time. If the node direction is off, the Moon still passes by, but its shadow sweeps above or below Earth.', watch: 'In the final step the Moon drifts out of alignment and its shadow misses Earth.', key: 'A solar eclipse is a coincidence of several geometric conditions.' },
    ],
  },
};

const ui = createLessonShell(root, { steps: STEPS, duration: DURATION, canvasAriaLabel: 'Solar eclipse interactive explainer' });
ui.overlay.innerHTML = `
  <span id="sun-label" class="lesson-object-label"></span><span id="moon-label" class="lesson-object-label"></span><span id="earth-label" class="lesson-object-label"></span>
  <div id="tilt-callout" class="lesson-callout eclipse-callout eclipse-callout--tilt"><div><strong></strong><small></small></div></div>
  <div id="alignment-callout" class="lesson-callout eclipse-callout eclipse-callout--alignment"><i class="lesson-callout-dot"></i><strong></strong></div>
  <div id="umbra-label" class="lesson-callout eclipse-callout eclipse-callout--shadow"><strong></strong></div>
  <div id="penumbra-label" class="lesson-callout eclipse-callout eclipse-callout--shadow"><strong></strong></div>
  <div id="node-a" class="lesson-callout eclipse-callout eclipse-callout--node"><strong></strong></div><div id="node-b" class="lesson-callout eclipse-callout eclipse-callout--node"><strong></strong></div>
  <div id="total-zone" class="lesson-callout eclipse-callout eclipse-callout--observer"><i class="zone-dot zone-dot--total"></i><strong></strong></div>
  <div id="partial-zone" class="lesson-callout eclipse-callout eclipse-callout--observer"><i class="zone-dot zone-dot--partial"></i><strong></strong></div>`;

const sunLabel = get('#sun-label'); const moonLabel = get('#moon-label'); const earthLabel = get('#earth-label');
const tiltCallout = get('#tilt-callout'); const tiltTitle = tiltCallout.querySelector('strong')!; const tiltHint = tiltCallout.querySelector('small')!;
const alignmentCallout = get('#alignment-callout'); const alignmentText = alignmentCallout.querySelector('strong')!;
const umbraLabel = get('#umbra-label'); const penumbraLabel = get('#penumbra-label'); const nodeALabel = get('#node-a'); const nodeBLabel = get('#node-b');
const totalZone = get('#total-zone'); const partialZone = get('#partial-zone');

const extra = {
  zh: { labels: ['太阳','月球','地球'], tilt: `${REAL_TILT}° 轨道倾角`, tiltHint: '为便于观察，画面中倾角被放大', alignment: '太阳 · 月球 · 地球接近共线', umbra: '本影', penumbra: '半影', node: '交点', total: '日全食区域', partial: '日偏食区域' },
  en: { labels: ['Sun','Moon','Earth'], tilt: `${REAL_TILT}° orbital tilt`, tiltHint: 'The tilt is exaggerated for visibility', alignment: 'Sun · Moon · Earth nearly align', umbra: 'Umbra', penumbra: 'Penumbra', node: 'Node', total: 'Total eclipse zone', partial: 'Partial eclipse zone' },
} as const;

const scene = new THREE.Scene(); scene.background = new THREE.Color('#02060d'); scene.fog = new THREE.FogExp2('#02060d', .012);
const camera = new THREE.PerspectiveCamera(42, 1, .1, 100);
const renderer = new THREE.WebGLRenderer({ canvas: ui.canvas, antialias: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.06; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.shadowMap.enabled = true;
const ambient = new THREE.AmbientLight('#8292af', .36); scene.add(ambient);

const random = seeded(20260812); const starPositions = new Float32Array(1000 * 3);
for (let i=0;i<1000;i++){const r=18+random()*36,t=random()*Math.PI*2,p=Math.acos(2*random()-1);starPositions[i*3]=r*Math.sin(p)*Math.cos(t);starPositions[i*3+1]=r*Math.cos(p);starPositions[i*3+2]=r*Math.sin(p)*Math.sin(t)}
const starGeometry = new THREE.BufferGeometry(); starGeometry.setAttribute('position',new THREE.BufferAttribute(starPositions,3)); const stars = new THREE.Points(starGeometry,new THREE.PointsMaterial({color:'#d8e6ff',size:.028,transparent:true,opacity:.72})); scene.add(stars);

const sun = new THREE.Mesh(new THREE.SphereGeometry(1.92,64,64),new THREE.MeshBasicMaterial({color:'#fee79a'})); sun.position.set(-7.5,0,0); scene.add(sun);
const corona = new THREE.Sprite(new THREE.SpriteMaterial({map:createGlowTexture(),color:'#ffd68b',transparent:true,opacity:.72,blending:THREE.AdditiveBlending,depthWrite:false})); corona.position.copy(sun.position); corona.scale.set(8.6,8.6,1); scene.add(corona);
const sunlight = new THREE.PointLight('#fff0bf',48,40,1.3); sunlight.position.copy(sun.position); scene.add(sunlight);
const earth = new THREE.Mesh(new THREE.SphereGeometry(1.34,64,64),new THREE.MeshStandardMaterial({color:'#1e5e97',roughness:.78,metalness:.02})); earth.position.set(5.8,0,0); scene.add(earth);
const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.44,64,64),new THREE.MeshBasicMaterial({color:'#78c2ff',transparent:true,opacity:.12,side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false})); atmosphere.position.copy(earth.position); scene.add(atmosphere);
const moon = new THREE.Mesh(new THREE.SphereGeometry(.52,48,48),new THREE.MeshStandardMaterial({color:'#b3bdc9',roughness:.92})); scene.add(moon); const moonRim = new THREE.Mesh(new THREE.SphereGeometry(.545,48,48),new THREE.MeshBasicMaterial({color:'#eff6ff',transparent:true,opacity:.08,wireframe:true})); scene.add(moonRim);
const ecliptic = ellipseLine('#91a8cb',.22,0); scene.add(ecliptic); const lunarOrbit = ellipseLine('#d8b26f',.06,DISPLAY_TILT); scene.add(lunarOrbit);
const orbitPlane = new THREE.Mesh(new THREE.RingGeometry(ORBIT_RX-.14,ORBIT_RX+.03,128),new THREE.MeshBasicMaterial({color:'#c8a66e',transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false})); orbitPlane.position.copy(earth.position); orbitPlane.rotation.x=Math.PI/2-THREE.MathUtils.degToRad(DISPLAY_TILT); scene.add(orbitPlane);
const nodeA = marker(earth.position.x+ORBIT_RX); const nodeB = marker(earth.position.x-ORBIT_RX);
const alignmentLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([sun.position.clone(),earth.position.clone()]),new THREE.LineDashedMaterial({color:'#dbe8ff',transparent:true,opacity:0,dashSize:.14,gapSize:.12})); alignmentLine.computeLineDistances(); scene.add(alignmentLine);
const umbra = new THREE.Mesh(new THREE.ConeGeometry(.62,5.05,56,1,true),new THREE.MeshBasicMaterial({color:'#07101b',transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false})); scene.add(umbra);
const penumbra = new THREE.Mesh(new THREE.ConeGeometry(1.06,5.5,56,1,true),new THREE.MeshBasicMaterial({color:'#183250',transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false})); scene.add(penumbra);
const totalMarker = new THREE.Object3D(); const partialMarker = new THREE.Object3D(); scene.add(totalMarker,partialMarker);

const cam = [v(0,4.8,17.2),v(2.3,4.3,12.3),v(1.4,3.7,12),v(.6,2.9,10.6),v(4.4,2.4,8.6),v(1.6,4,12.8)];
const look = [v(.2,0,0),v(4.6,0,0),v(4.1,0,0),v(3.3,0,0),v(5.8,.1,0),v(4.8,.2,0)];

function renderScene(time:number){
  resize(); const step=ui.renderStep(time,copy[language]); ui.renderTime(time);
  const intro=easeInOutCubic(stepProgressAt(STEPS[0],time)), tilt=easeInOutCubic(stepProgressAt(STEPS[1],time)), align=easeInOutCubic(stepProgressAt(STEPS[2],time)), shadow=easeInOutCubic(stepProgressAt(STEPS[3],time)), observer=easeInOutCubic(stepProgressAt(STEPS[4],time)), summary=easeInOutCubic(stepProgressAt(STEPS[5],time));
  let angle=1.4; if(step===0)angle=lerp(1.55,1.15,intro); else if(step===1)angle=lerp(1.15,.45,tilt); else if(step===2)angle=lerp(.45,Math.PI,align); else if(step===3)angle=lerp(Math.PI,Math.PI+.12,shadow); else if(step===4)angle=lerp(Math.PI+.12,Math.PI-.08,observer); else angle=lerp(Math.PI-.08,Math.PI-.1,summary);
  const local=new THREE.Vector3(Math.cos(angle)*ORBIT_RX,Math.sin(angle)*ORBIT_RY,Math.sin(angle)*.22); local.applyAxisAngle(new THREE.Vector3(1,0,0),THREE.MathUtils.degToRad(DISPLAY_TILT)); local.y+=summary*1.7; moon.position.copy(earth.position).add(local); moonRim.position.copy(moon.position);
  earth.rotation.y=time*.16; moon.rotation.y=time*.12; moonRim.rotation.copy(moon.rotation); stars.rotation.y=time*.002; corona.scale.setScalar(8.2+Math.sin(time*.55)*.18+shadow*.34);
  (orbitPlane.material as THREE.MeshBasicMaterial).opacity=.02+tilt*.065+align*.05+summary*.02; (lunarOrbit.material as THREE.LineBasicMaterial).opacity=.08+tilt*.4+align*.22; (ecliptic.material as THREE.LineBasicMaterial).opacity=.14+tilt*.18+summary*.16;
  (nodeA.material as THREE.MeshBasicMaterial).opacity=align*.95+summary*.2; (nodeB.material as THREE.MeshBasicMaterial).opacity=align*.75+summary*.15; (alignmentLine.material as THREE.LineDashedMaterial).opacity=align*.36+shadow*.14;
  orientCone(umbra,moon.position,earth.position,5.05); orientCone(penumbra,moon.position,earth.position,5.5); (umbra.material as THREE.MeshBasicMaterial).opacity=shadow*.54+observer*.08; (penumbra.material as THREE.MeshBasicMaterial).opacity=shadow*.11+observer*.02;
  sunlight.intensity=lerp(48,38,shadow*(1-summary*.8)); ambient.intensity=lerp(.36,.22,shadow*(1-summary*.8));
  totalMarker.position.copy(earth.position).add(v(-1.02,.18,.96)); partialMarker.position.copy(earth.position).add(v(-.12,1,.86));
  const localProgress=easeInOutCubic(stepProgressAt(STEPS[step],time)); camera.position.copy(lerpV(cam[step],cam[Math.min(cam.length-1,step+1)],localProgress*.4)); camera.lookAt(lerpV(look[step],look[Math.min(look.length-1,step+1)],localProgress*.4));
  renderer.render(scene,camera); project(sun,sunLabel,1,14,-4); project(moon,moonLabel,1,14,8); project(earth,earthLabel,1,14,-2); projectPoint(v(earth.position.x+.2,2.2,.6),tiltCallout,Math.max(tilt*.95,summary*.65),16,-8); project(nodeA,nodeALabel,Math.max(align*.95,summary*.4),8,-16); project(nodeB,nodeBLabel,Math.max(align*.75,summary*.3),8,-16); projectPoint(v(1.5,-1.65,0),alignmentCallout,align*(1-shadow*.35)); projectPoint(v(2.7,-1.75,0),umbraLabel,shadow*.95); projectPoint(v(3.5,-2.35,0),penumbraLabel,shadow*.88); project(totalMarker,totalZone,observer*(1-summary*.35),16); project(partialMarker,partialZone,observer*(1-summary*.2),16,-8);
}

const controller=new DeterministicTimeline({duration:DURATION,steps:STEPS,qaTimes:[0,4.6,5.2,9.5,10.4,14.8,15.6,19.5,20.5,24.6,29.7],onRender:renderScene,onPlayStateChange(value){playing=value;ui.setPlaying(value,copy[language])}}); window.__LOOP_ANIMATION__=controller; ui.bindController(controller);
ui.playButton.addEventListener('click',()=>playing?controller.pause():controller.play()); ui.languageButton.addEventListener('click',()=>{language=language==='zh'?'en':'zh';persistLanguage(language);const url=new URL(location.href);url.searchParams.set('lang',language);history.replaceState({},'',url);applyCopy();controller.renderAt(controller.currentTime)}); addEventListener('resize',()=>controller.renderAt(controller.currentTime)); addEventListener('keydown',(event)=>{if(event.key==='ArrowRight')controller.nextStep?.();if(event.key==='ArrowLeft')controller.previousStep?.();if(event.key===' '){event.preventDefault();playing?controller.pause():controller.play()}});
applyCopy(); controller.renderAt(0);

function applyCopy(){ui.applyCopy(copy[language],language,playing);const t=extra[language];sunLabel.textContent=t.labels[0];moonLabel.textContent=t.labels[1];earthLabel.textContent=t.labels[2];tiltTitle.textContent=t.tilt;tiltHint.textContent=t.tiltHint;alignmentText.textContent=t.alignment;umbraLabel.querySelector('strong')!.textContent=t.umbra;penumbraLabel.querySelector('strong')!.textContent=t.penumbra;nodeALabel.querySelector('strong')!.textContent=t.node;nodeBLabel.querySelector('strong')!.textContent=t.node;totalZone.querySelector('strong')!.textContent=t.total;partialZone.querySelector('strong')!.textContent=t.partial}
function get(selector:string){const el=ui.overlay.querySelector<HTMLElement>(selector);if(!el)throw new Error(`Missing ${selector}`);return el}
function resize(){const w=ui.canvas.clientWidth,h=ui.canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix()}
function project(object:THREE.Object3D,element:HTMLElement,opacity=1,x=0,y=0){const p=new THREE.Vector3();object.getWorldPosition(p);projectPoint(p,element,opacity,x,y)}
function projectPoint(world:THREE.Vector3,element:HTMLElement,opacity:number,x=0,y=0){const p=world.clone().project(camera);element.style.transform=`translate(${(p.x*.5+.5)*ui.canvas.clientWidth+x}px,${(-p.y*.5+.5)*ui.canvas.clientHeight+y}px)`;element.style.opacity=String(Math.max(0,Math.min(1,opacity)))}
function orientCone(mesh:THREE.Mesh,from:THREE.Vector3,to:THREE.Vector3,length:number){const d=new THREE.Vector3().subVectors(to,from).normalize();mesh.position.copy(from).add(d.clone().multiplyScalar(length*.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d)}
function ellipseLine(color:string,opacity:number,tilt:number){const points=new THREE.EllipseCurve(earth.position.x,0,ORBIT_RX,ORBIT_RY,0,Math.PI*2).getPoints(160).map(p=>new THREE.Vector3(p.x,p.y,0));const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color,transparent:true,opacity}));line.rotation.x=THREE.MathUtils.degToRad(tilt);return line}
function marker(x:number){const m=new THREE.Mesh(new THREE.SphereGeometry(.075,20,20),new THREE.MeshBasicMaterial({color:'#7ec1ff',transparent:true,opacity:0}));m.position.set(x,0,0);scene.add(m);return m}
function createGlowTexture(){const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d')!;const g=ctx.createRadialGradient(128,128,10,128,128,126);g.addColorStop(0,'rgba(255,248,205,.96)');g.addColorStop(.18,'rgba(255,214,122,.56)');g.addColorStop(.52,'rgba(255,166,59,.12)');g.addColorStop(1,'rgba(255,120,20,0)');ctx.fillStyle=g;ctx.fillRect(0,0,256,256);return new THREE.CanvasTexture(c)}
function seeded(seed:number){return()=>{let t=(seed+=0x6d2b79f5);t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
function v(x:number,y:number,z:number){return new THREE.Vector3(x,y,z)}
function lerpV(a:THREE.Vector3,b:THREE.Vector3,t:number){return v(lerp(a.x,b.x,t),lerp(a.y,b.y,t),lerp(a.z,b.z,t))}
