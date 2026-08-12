import * as THREE from 'three';
import { DeterministicTimeline, envelope, reveal, type TimelineStep } from '../../runtime/animation';
import { observeRendererViewport } from '../../runtime/canvas-viewport';
import { createStagePlayer, type StagePlayerCopy } from '../../runtime/stage-player';
import { getLanguage, persistLanguage, type AppLanguage } from '../../runtime/i18n';
import './style.css';

const DURATION = 30;
const STEPS = [
  { id: 'evaporation', start: 0, end: 6 },
  { id: 'transport', start: 6, end: 12 },
  { id: 'precipitation', start: 12, end: 18 },
  { id: 'runoff', start: 18, end: 24 },
  { id: 'groundwater', start: 24, end: 30 },
] satisfies readonly TimelineStep[];

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing #app');
let language: AppLanguage = getLanguage();

const copy: Record<AppLanguage, StagePlayerCopy> = {
  zh: {
    brand: 'Loop Animation', category: 'Earth System · Cinematic Flow',
    topicTitle: '一滴水，走完整个地球循环',
    topicLead: '同一个世界持续变化：海洋、空气、云、山地、河流和地下水从不重置。',
    chapterWord: '章节', keyWord: '记住', play: '播放', pause: '暂停', previous: '上一章', next: '下一章', details: '深入解释', closeDetails: '收起', language: 'EN',
    chapters: [
      { label: '蒸发', title: '太阳先把海水送进空气', summary: '海面得到能量，一部分水分子离开液面，进入大气。', details: '蒸发不是水“消失”了，而是从液态变成了水汽。温度、风速和空气湿度都会影响蒸发速度。', key: '水的状态变了，位置也变了。' },
      { label: '输送与凝结', title: '风把水汽带向陆地和山地', summary: '空气抬升后逐渐冷却，水汽开始凝结成云滴。', details: '湿空气遇到山地被迫上升，温度降低；达到露点后，水汽在微小颗粒周围凝结，形成云滴。', key: '风负责搬运，冷却负责凝结。' },
      { label: '降水', title: '云滴长大以后，重力开始占上风', summary: '云中的水滴不断碰撞合并，最终以雨的形式回到地面。', details: '当水滴足够大，上升气流无法继续托住它们，重力就让它们落向地表。', key: '降水把大气中的水重新交还给地表。' },
      { label: '地表径流', title: '水沿着地形寻找更低的地方', summary: '一部分雨水汇进溪流和河流，很快又向海洋移动。', details: '坡度、土壤吸水能力和地形共同决定径流。小水流逐渐汇聚成河流，形成陆地到海洋的快速回路。', key: '河流是一条快速返回海洋的路径。' },
      { label: '地下水', title: '还有一条更慢、更隐蔽的回路', summary: '另一部分水向下渗透，在岩土层中缓慢移动，最终也会重新进入河流或海洋。', details: '水通过土壤孔隙和可渗透岩层进入含水层。地下水移动更慢，却能持续补给泉水、河流和沿海水体。', key: '天空、地表和地下，本质上属于同一个水系统。' },
    ],
  },
  en: {
    brand: 'Loop Animation', category: 'Earth System · Cinematic Flow',
    topicTitle: 'One drop, one continuous journey around Earth',
    topicLead: 'Ocean, air, cloud, mountain, river and groundwater remain one evolving world.',
    chapterWord: 'Chapter', keyWord: 'Remember', play: 'Play', pause: 'Pause', previous: 'Previous', next: 'Next', details: 'Go deeper', closeDetails: 'Close', language: '中文',
    chapters: [
      { label: 'Evaporation', title: 'Solar energy first lifts water into the air', summary: 'The ocean gains energy and some water molecules escape the liquid surface.', details: 'Evaporation does not make water vanish. It changes liquid water into vapor. Temperature, wind and humidity all affect the rate.', key: 'The state changes, and so does the location of the water.' },
      { label: 'Transport & condensation', title: 'Wind carries moisture inland and upward', summary: 'As air rises over terrain it cools, allowing vapor to condense into cloud droplets.', details: 'Moist air forced upward by mountains cools. Once it reaches the dew point, vapor condenses around tiny particles and becomes cloud droplets.', key: 'Wind transports moisture; cooling condenses it.' },
      { label: 'Precipitation', title: 'Droplets grow until gravity wins', summary: 'Cloud droplets collide and merge until they become heavy enough to fall as rain.', details: 'When droplets grow large enough that rising air can no longer support them, gravity returns the water to the surface.', key: 'Precipitation returns atmospheric water to land.' },
      { label: 'Runoff', title: 'Water follows terrain toward lower ground', summary: 'Some rain joins streams and rivers, moving relatively quickly back toward the ocean.', details: 'Slope, soil and terrain route surface water into channels, streams and rivers. This creates a fast path from land to ocean.', key: 'Rivers are the fast return route.' },
      { label: 'Groundwater', title: 'A slower hidden route continues underground', summary: 'Other water infiltrates soil and rock, then travels slowly through groundwater before returning to surface water.', details: 'Water enters pores and permeable rock, recharging aquifers. Groundwater moves slowly but continually feeds springs, rivers and coastal water.', key: 'Atmosphere, surface and groundwater are one connected system.' },
    ],
  },
};

const ui = createStagePlayer(root, { steps: STEPS, duration: DURATION, canvasAriaLabel: 'Cinematic continuous water cycle explainer' });
ui.stage.classList.add('water-v2-stage');
ui.overlay.innerHTML = `
  <div id="hero-drop-tag" class="water-v2-tag"><span></span></div>
  <div id="process-tag" class="water-v2-process"><strong></strong><small></small></div>
`;
const heroTag = get<HTMLElement>('#hero-drop-tag');
const processTag = get<HTMLElement>('#process-tag');

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2('#8bbbd3', 0.018);
const camera = new THREE.PerspectiveCamera(41, 1, 0.1, 120);
const renderer = new THREE.WebGLRenderer({ canvas: ui.canvas, antialias: true, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

// Sky is rendered as a full scene background shader so the stage never reads as a flat SVG-like diagram.
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(72, 32, 16),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: { uSun: { value: new THREE.Vector3(-0.8, 0.55, -0.25) } },
    vertexShader: `varying vec3 vWorld; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vWorld=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `
      varying vec3 vWorld; uniform vec3 uSun;
      void main(){
        vec3 d=normalize(vWorld); float h=clamp(d.y*.5+.5,0.,1.);
        vec3 horizon=vec3(.73,.86,.94); vec3 zenith=vec3(.10,.30,.55);
        vec3 c=mix(horizon,zenith,pow(h,.72));
        float sun=pow(max(dot(d,normalize(uSun)),0.),180.);
        float glow=pow(max(dot(d,normalize(uSun)),0.),12.);
        c += vec3(1.0,.78,.38)*sun*2.2 + vec3(1.0,.70,.32)*glow*.22;
        gl_FragColor=vec4(c,1.0);
      }`,
  }),
);
scene.add(sky);

scene.add(new THREE.HemisphereLight('#d8edff', '#263a2a', 1.7));
const sunLight = new THREE.DirectionalLight('#fff0c3', 3.4);
sunLight.position.set(-9, 12, 5);
scene.add(sunLight);

const ocean = new THREE.Mesh(
  new THREE.PlaneGeometry(18, 10, 120, 70),
  new THREE.ShaderMaterial({
    transparent: false,
    uniforms: { uTime: { value: 0 }, uStrength: { value: 0 } },
    vertexShader: `
      uniform float uTime; varying float vWave; varying vec2 vUv;
      void main(){ vUv=uv; vec3 p=position; float w=sin(p.x*1.7+uTime*.8)*.07+sin(p.y*2.9-uTime*.55)*.035; p.z+=w; vWave=w; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.); }
    `,
    fragmentShader: `
      varying float vWave; varying vec2 vUv; uniform float uStrength;
      void main(){ vec3 deep=vec3(.025,.24,.38); vec3 shallow=vec3(.04,.49,.68); float g=smoothstep(0.,1.,vUv.y); vec3 c=mix(deep,shallow,g*.72); c+=max(vWave,0.)*vec3(.6,.9,1.4); c+=uStrength*vec3(.02,.07,.09); gl_FragColor=vec4(c,1.); }
    `,
  }),
);
ocean.rotation.x = -Math.PI / 2;
ocean.position.set(-5.4, -2.0, 0.7);
scene.add(ocean);

// Deterministic sculpted terrain: broad shapes + many small triangles read as landscape instead of iconography.
const terrainGeo = new THREE.PlaneGeometry(14, 10, 90, 64);
const position = terrainGeo.attributes.position as THREE.BufferAttribute;
for (let i = 0; i < position.count; i += 1) {
  const x = position.getX(i); const y = position.getY(i);
  const ridge = 3.8 * Math.exp(-Math.pow((x - 2.3) / 3.2, 2)) * Math.exp(-Math.pow((y + .2) / 4.5, 2));
  const detail = Math.sin(x * 1.5 + y * .7) * .18 + Math.sin(y * 2.1 - x * .4) * .10;
  const coastFade = THREE.MathUtils.smoothstep(x, -3.4, -1.0);
  position.setZ(i, (ridge + detail) * coastFade);
}
terrainGeo.computeVertexNormals();
const terrain = new THREE.Mesh(terrainGeo, new THREE.MeshStandardMaterial({ color: '#5f7c4e', roughness: .96, metalness: 0, flatShading: false }));
terrain.rotation.x = -Math.PI / 2;
terrain.rotation.z = -0.08;
terrain.position.set(4.2, -1.88, -0.15);
scene.add(terrain);

const cliff = new THREE.Mesh(new THREE.BoxGeometry(11.4, 3.4, 7.8, 24, 8, 12), new THREE.MeshStandardMaterial({ color: '#594a3b', roughness: 1 }));
cliff.position.set(4.7, -3.65, 0.15);
scene.add(cliff);

const riverCurve = new THREE.CatmullRomCurve3([
  v(7.1,-.6,-.1), v(5.8,-1.0,.1), v(4.3,-1.25,-.05), v(2.9,-1.48,.22), v(1.4,-1.66,.15), v(-.2,-1.82,.48), v(-1.8,-1.96,.65)
], false, 'centripetal');
const riverMat = new THREE.MeshBasicMaterial({ color: '#42b8ff', transparent: true, opacity: .30, blending: THREE.AdditiveBlending, depthWrite: false });
const river = new THREE.Mesh(new THREE.TubeGeometry(riverCurve, 120, .13, 10, false), riverMat);
scene.add(river);

const undergroundCurve = new THREE.CatmullRomCurve3([
  v(6.0,-2.15,.7),v(5.4,-2.8,.65),v(4.0,-3.22,.48),v(2.4,-3.38,.55),v(.8,-3.18,.72),v(-.8,-2.72,.86)
], false, 'centripetal');
const undergroundMat = new THREE.MeshBasicMaterial({ color: '#55b8e8', transparent: true, opacity: .05, blending: THREE.AdditiveBlending, depthWrite: false });
const underground = new THREE.Mesh(new THREE.TubeGeometry(undergroundCurve, 100, .08, 8, false), undergroundMat);
scene.add(underground);

const cloudTexture = radialTexture('rgba(255,255,255,.95)');
const clouds = new THREE.Group();
scene.add(clouds);
for (let i = 0; i < 24; i += 1) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTexture, transparent: true, opacity: .48, depthWrite: false }));
  const a = seeded(i + 41); const b = seeded(i + 91); const c = seeded(i + 151);
  sprite.position.set(2.2 + a*5.2, 3.4 + b*1.45, -1.7 + c*2.2);
  const s = 1.15 + seeded(i + 401) * 1.25; sprite.scale.set(2.15*s, 1.18*s, 1);
  clouds.add(sprite);
}

const vapor = pointsField(180, '#d8f5ff', .085, (i) => {
  const r=seeded(i+10); return v(-6.5+r*3.7,-1.72+seeded(i+20)*.38,-.3+seeded(i+30)*2.5);
});
const rain = pointsField(300, '#9fdcff', .052, (i) => v(2.8+seeded(i+50)*4.6,1.8+seeded(i+60)*2.7,-1.2+seeded(i+70)*2.7));
scene.add(vapor, rain);

const hero = new THREE.Mesh(new THREE.SphereGeometry(.12,24,24), new THREE.MeshBasicMaterial({ color: '#baf1ff' }));
const heroGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTexture('rgba(110,220,255,1)'), transparent:true, opacity:.78, blending:THREE.AdditiveBlending, depthWrite:false }));
heroGlow.scale.set(.78,.78,1); scene.add(hero,heroGlow);

const heroPath = new THREE.CatmullRomCurve3([
  v(-5.9,-1.5,.9), v(-5.3,.2,.8), v(-3.3,2.0,.25), v(.7,3.2,-.6), v(4.1,3.6,-.55), v(5.2,1.0,.1), v(4.4,-1.2,.25), v(2.2,-1.55,.25), v(-.6,-1.9,.58), v(2.0,-2.65,.55), v(4.2,-3.25,.5), v(-1.0,-2.68,.82)
], false, 'centripetal');

const cameraCurve = new THREE.CatmullRomCurve3([
  v(-2.0,4.2,13.5), v(-1.0,4.7,12.4), v(1.8,4.3,11.8), v(4.4,3.5,10.2), v(4.8,2.4,9.4), v(2.0,2.1,10.2), v(.3,1.8,11.1)
], false, 'centripetal');
const lookCurve = new THREE.CatmullRomCurve3([
  v(-2.7,-.2,0),v(-2.0,.5,0),v(2.1,.7,0),v(4.6,.4,0),v(3.2,-1.1,.2),v(2.4,-2.1,.45),v(1.2,-1.8,.4)
], false, 'centripetal');
const viewport = observeRendererViewport(renderer,camera,ui.stage,{maxPixelRatio:1.35});
const projected = new THREE.Vector3();

function renderScene(time:number, progress:number){
  const evaporation=envelope(time,.4,2.0,8.0,10.0);
  const transport=envelope(time,4.8,6.8,13.0,15.0);
  const precipitation=envelope(time,10.7,12.5,19.2,21.0);
  const runoff=envelope(time,16.0,18.2,25.0,27.0);
  const groundwater=reveal(time,20.5,25.3);

  (ocean.material as THREE.ShaderMaterial).uniforms.uTime.value=time;
  (ocean.material as THREE.ShaderMaterial).uniforms.uStrength.value=evaporation;
  riverMat.opacity=.18+runoff*.62;
  undergroundMat.opacity=.035+groundwater*.42;

  const vaporMat=vapor.material as THREE.PointsMaterial; vaporMat.opacity=.04+evaporation*.58;
  const vaporPos=vapor.geometry.attributes.position as THREE.BufferAttribute;
  for(let i=0;i<vaporPos.count;i+=1){ const base=-1.72+seeded(i+20)*.38; const phase=(time*.24+seeded(i+300))%1; vaporPos.setY(i,base+phase*4.4); vaporPos.setX(i,-6.5+seeded(i+10)*3.7+Math.sin(time*.45+i)*.05); }
  vaporPos.needsUpdate=true;

  const rainMat=rain.material as THREE.PointsMaterial; rainMat.opacity=precipitation*.78;
  const rainPos=rain.geometry.attributes.position as THREE.BufferAttribute;
  for(let i=0;i<rainPos.count;i+=1){ const phase=(time*.72+seeded(i+500))%1; rainPos.setY(i,4.2-phase*5.8); }
  rainPos.needsUpdate=true;

  clouds.position.x=Math.sin(time*.08)*.24+transport*.52;
  clouds.children.forEach((child,index)=>{ const mat=(child as THREE.Sprite).material as THREE.SpriteMaterial; mat.opacity=.34+transport*.18+precipitation*.18; child.position.y += Math.sin(time*.11+index*.7)*.0008; });

  // The highlighted drop is continuous through the whole animation; chapters never teleport it.
  const p=Math.min(.9999,Math.max(0,progress)); heroPath.getPointAt(p,hero.position); heroGlow.position.copy(hero.position);
  heroGlow.scale.setScalar(.65+Math.sin(time*4)*.06);

  cameraCurve.getPointAt(progress,camera.position); const target=lookCurve.getPointAt(progress); camera.lookAt(target);
  renderer.render(scene,camera);
  project(hero.position,heroTag,1,12,-22);
  updateProcessTag(time,evaporation,transport,precipitation,runoff,groundwater);
}

function updateProcessTag(time:number,ev:number,tr:number,pr:number,ro:number,gw:number){
  const t=language==='zh'
    ? [['蒸发','太阳能让水离开海面'],['输送','风把水汽送向山地'],['降水','云滴长大并落回地面'],['径流','水沿地形重新汇向海洋'],['地下水','渗入地下的水缓慢返回']]
    : [['Evaporation','solar energy lifts water'],['Transport','wind carries moisture inland'],['Precipitation','droplets grow and fall'],['Runoff','terrain routes water back'],['Groundwater','infiltrated water returns slowly']];
  const strengths=[ev,tr,pr,ro,gw]; let index=0; strengths.forEach((value,i)=>{ if(value>strengths[index]) index=i; });
  processTag.querySelector('strong')!.textContent=t[index][0]; processTag.querySelector('small')!.textContent=t[index][1];
  processTag.style.opacity=String(Math.max(...strengths)*.92); processTag.style.left=index===0?'24%':index===1?'51%':index===2?'70%':index===3?'62%':'58%'; processTag.style.top=index===0?'66%':index===1?'25%':index===2?'31%':index===3?'64%':'78%';
  heroTag.querySelector('span')!.textContent=language==='zh'?'同一滴水':'the same drop';
}

function project(world:THREE.Vector3,element:HTMLElement,opacity:number,dx=0,dy=0){ projected.copy(world).project(camera); const w=ui.stage.clientWidth,h=ui.stage.clientHeight; const x=(projected.x*.5+.5)*w+dx,y=(-projected.y*.5+.5)*h+dy; element.style.transform=`translate(${x}px,${y}px) translate(-50%,-50%)`; element.style.opacity=String(opacity); }
function pointsField(count:number,color:string,size:number,create:(i:number)=>THREE.Vector3){ const data=new Float32Array(count*3); for(let i=0;i<count;i+=1){const p=create(i);data[i*3]=p.x;data[i*3+1]=p.y;data[i*3+2]=p.z;} const geometry=new THREE.BufferGeometry(); geometry.setAttribute('position',new THREE.BufferAttribute(data,3)); return new THREE.Points(geometry,new THREE.PointsMaterial({color,size,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending})); }
function radialTexture(center:string){ const c=document.createElement('canvas'); c.width=c.height=128; const ctx=c.getContext('2d')!; const g=ctx.createRadialGradient(64,64,2,64,64,62); g.addColorStop(0,center); g.addColorStop(.45,'rgba(255,255,255,.46)'); g.addColorStop(1,'rgba(255,255,255,0)'); ctx.fillStyle=g;ctx.fillRect(0,0,128,128); return new THREE.CanvasTexture(c); }
function seeded(seed:number){ const x=Math.sin(seed*12.9898+78.233)*43758.5453; return x-Math.floor(x); }
function v(x:number,y:number,z:number){return new THREE.Vector3(x,y,z);}
function get<T extends Element>(selector:string){const e=document.querySelector<T>(selector);if(!e)throw new Error(`Missing ${selector}`);return e;}

const controller=new DeterministicTimeline({duration:DURATION,steps:STEPS,qaTimes:[1.5,7.8,13.8,20.2,27.5],onRender:renderScene});
window.__LOOP_ANIMATION__=controller;
ui.bindController(controller);

function applyLanguage(){ ui.applyCopy(copy[language],language); controller.renderAt(controller.currentTime); }
ui.languageButton.addEventListener('click',()=>{language=language==='zh'?'en':'zh';persistLanguage(language);const url=new URL(location.href);url.searchParams.set('lang',language);history.replaceState({},'',url);applyLanguage();});
applyLanguage();

window.addEventListener('keydown',(event)=>{if(event.key===' '){event.preventDefault();controller.isPlaying?controller.pause():controller.play();}});
window.addEventListener('beforeunload',()=>{viewport.dispose();ui.dispose();controller.destroy();renderer.dispose();});
