import * as THREE from 'three';
import { DeterministicTimeline, easeInOutCubic, lerp, stepProgressAt, type TimelineStep } from '../../runtime/animation';
import { createLessonShell, type LessonShellCopy } from '../../runtime/lesson-shell';
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
let playing = false;

const copy: Record<AppLanguage, LessonShellCopy> = {
  zh: {
    brand: 'Loop Animation', category: 'Earth System / Flow', topicLabel: '主题', topicTitle: '水循环是怎么运转的？',
    topicLead: '从海洋蒸发开始，跟着一滴水走过输送、降水、径流和地下水。', panelTitle: '解说', controlsTitle: '演示控制',
    stepWord: '步骤', keyWord: '关键点', watchWord: '观察重点', play: '播放', pause: '暂停', previous: '上一步', next: '下一步', reset: '重置', lang: 'EN',
    steps: [
      { nav: '蒸发', kicker: 'Step 01 · 能量把水送上天空', title: '太阳加热海面，液态水变成水汽', body: '太阳持续给海洋输入能量，一部分水分子获得足够能量逃离水面，以水汽形式进入大气。', watch: '海面上的蓝色水汽粒子不断上升，太阳能量越强，蒸发越明显。', key: '蒸发把地表液态水转移到大气中，是水循环的起点。' },
      { nav: '水汽输送', kicker: 'Step 02 · 风把水汽搬到陆地', title: '水汽随空气移动，并在高处凝结成云', body: '水汽被风输送到陆地上空。空气抬升后温度下降，水汽逐渐凝结成细小水滴和冰晶，云层因此变厚。', watch: '水汽流向山地，云团由稀疏变得厚重，表示冷却与凝结正在增强。', key: '风负责水平输送，抬升和降温让水汽重新变回液态或固态。' },
      { nav: '降水', kicker: 'Step 03 · 云里的水终于落下来', title: '云滴不断碰撞长大，最终形成降雨', body: '云中的小水滴和冰晶不断碰撞、合并。当它们大到上升气流托不住时，就会以雨或雪的形式落回地表。', watch: '雨滴从云底落向山地，部分落到河谷，部分落到土壤表面。', key: '降水把大气中的水重新送回地表。' },
      { nav: '地表径流', kicker: 'Step 04 · 水沿地形重新回到海洋', title: '落到地表的水顺着坡度汇入溪流和河流', body: '无法立即渗入土壤的水会沿地势低处流动，从坡面汇入溪流，再进入河流，最终重新流回海洋。', watch: '蓝色流线从山坡向河谷汇聚，河流逐渐变亮并一路连接到海岸。', key: '地形决定地表水往哪里汇集，河流把陆地上的水送回海洋。' },
      { nav: '下渗与地下水', kicker: 'Step 05 · 还有一部分水会进入地下', title: '水渗进土壤和岩层，形成地下水流', body: '一部分降水会穿过土壤孔隙向下渗透，补给地下含水层。地下水会沿着岩层中的压力和坡度缓慢流动，最后重新补给河流、泉水或海洋。', watch: '地表出现向下的渗透流，地下蓝色通道被点亮，并缓慢流向海岸。', key: '水循环不仅发生在天空和地表，地下水也是整个系统的重要储库。' },
    ],
  },
  en: {
    brand: 'Loop Animation', category: 'Earth System / Flow', topicLabel: 'Topic', topicTitle: 'How does the water cycle work?',
    topicLead: 'Follow water from ocean evaporation through transport, precipitation, runoff and groundwater.', panelTitle: 'Explanation', controlsTitle: 'Playback',
    stepWord: 'Step', keyWord: 'Key idea', watchWord: 'What to watch', play: 'Play', pause: 'Pause', previous: 'Previous', next: 'Next', reset: 'Reset', lang: '中文',
    steps: [
      { nav: 'Evaporation', kicker: 'Step 01 · Energy lifts water', title: 'Sunlight turns surface water into vapor', body: 'Solar energy warms the ocean. Some water molecules gain enough energy to escape the surface and enter the atmosphere as water vapor.', watch: 'Blue vapor particles rise from the ocean; stronger sunlight makes the evaporation stream more visible.', key: 'Evaporation transfers liquid water from the surface into the atmosphere.' },
      { nav: 'Vapor transport', kicker: 'Step 02 · Wind carries moisture inland', title: 'Moist air rises, cools and condenses into clouds', body: 'Wind carries water vapor over land. As air is lifted over higher terrain it cools, and vapor condenses into tiny droplets and ice crystals, thickening the cloud.', watch: 'The vapor stream moves toward the mountains while the cloud mass becomes denser.', key: 'Wind transports moisture horizontally; uplift and cooling turn vapor back into droplets.' },
      { nav: 'Precipitation', kicker: 'Step 03 · Cloud water returns to the surface', title: 'Cloud droplets grow until gravity wins', body: 'Tiny droplets and ice crystals collide and merge. Once they become too heavy for rising air to support, they fall as rain or snow.', watch: 'Rain falls from the cloud toward the mountain, valley and soil.', key: 'Precipitation moves atmospheric water back to Earth’s surface.' },
      { nav: 'Surface runoff', kicker: 'Step 04 · Gravity routes water downhill', title: 'Water follows terrain into streams and rivers', body: 'Water that cannot immediately soak into the ground runs downhill, joins small channels, enters rivers and eventually returns to the ocean.', watch: 'Blue flow lines merge down the mountain and the river brightens all the way to the coast.', key: 'Topography controls where surface water collects and how rivers return it to the sea.' },
      { nav: 'Infiltration & groundwater', kicker: 'Step 05 · Part of the cycle happens underground', title: 'Water seeps into soil and recharges groundwater', body: 'Some precipitation infiltrates through soil and rock, recharging aquifers. Groundwater then moves slowly through porous layers and eventually feeds rivers, springs or the ocean.', watch: 'Vertical infiltration paths light up, followed by a slow underground flow toward the coast.', key: 'Groundwater is a major hidden reservoir in the water cycle.' },
    ],
  },
};

const ui = createLessonShell(root, { steps: STEPS, duration: DURATION, canvasAriaLabel: 'Interactive water cycle explainer' });
ui.overlay.innerHTML = `
  <div id="water-evap" class="lesson-callout water-callout"><strong></strong><small></small></div>
  <div id="water-cloud" class="lesson-callout water-callout"><strong></strong><small></small></div>
  <div id="water-rain" class="lesson-callout water-callout"><strong></strong><small></small></div>
  <div id="water-runoff" class="lesson-callout water-callout"><strong></strong><small></small></div>
  <div id="water-ground" class="lesson-callout water-callout"><strong></strong><small></small></div>`;
const callouts = ['#water-evap','#water-cloud','#water-rain','#water-runoff','#water-ground'].map(selector=>ui.overlay.querySelector<HTMLElement>(selector)!);
const calloutCopy = {
  zh: [['蒸发','液态水 → 水汽'],['水汽输送','风 + 抬升 + 冷却'],['降水','云滴长大后落下'],['地表径流','沿地形汇入河流'],['下渗与地下水','穿过土壤进入含水层']],
  en: [['Evaporation','liquid → vapor'],['Vapor transport','wind + uplift + cooling'],['Precipitation','droplets grow and fall'],['Surface runoff','terrain routes water downhill'],['Groundwater','infiltration into aquifers']],
} as const;

const scene = new THREE.Scene(); scene.background = new THREE.Color('#08131d'); scene.fog = new THREE.FogExp2('#08131d',.018);
const camera = new THREE.PerspectiveCamera(38,1,.1,100); const renderer = new THREE.WebGLRenderer({canvas:ui.canvas,antialias:true}); renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.05; renderer.shadowMap.enabled=true;
scene.add(new THREE.HemisphereLight('#b8dcff','#263b2c',1.4)); const sunLight=new THREE.DirectionalLight('#fff2bf',3.6); sunLight.position.set(-7,10,4); sunLight.castShadow=true; scene.add(sunLight);

const ocean = new THREE.Mesh(new THREE.PlaneGeometry(14,8,40,20),new THREE.MeshStandardMaterial({color:'#146fb1',roughness:.34,metalness:.02,transparent:true,opacity:.94})); ocean.rotation.x=-Math.PI/2; ocean.position.set(-5,-2.15,1); scene.add(ocean);
const oceanGlow = new THREE.Mesh(new THREE.PlaneGeometry(13.8,7.8),new THREE.MeshBasicMaterial({color:'#38a9ef',transparent:true,opacity:.1,blending:THREE.AdditiveBlending,depthWrite:false})); oceanGlow.rotation.x=-Math.PI/2; oceanGlow.position.set(-5,-2.1,1); scene.add(oceanGlow);
const underground = new THREE.Mesh(new THREE.BoxGeometry(11,3.2,7),new THREE.MeshStandardMaterial({color:'#5d4635',roughness:1})); underground.position.set(4.7,-3.55,0); scene.add(underground);
const soilTop = new THREE.Mesh(new THREE.BoxGeometry(11,.44,7),new THREE.MeshStandardMaterial({color:'#668f48',roughness:.95})); soilTop.position.set(4.7,-1.75,0); scene.add(soilTop);
const coast = new THREE.Mesh(new THREE.BoxGeometry(2,.5,7),new THREE.MeshStandardMaterial({color:'#c9b484',roughness:1})); coast.position.set(-.3,-1.78,0); scene.add(coast);

const mountains = new THREE.Group(); scene.add(mountains); [[3.8,1.3,0,2.5,5.2],[5.5,1.1,-.8,2.1,4.4],[6.8,1.2,.4,1.75,3.7]].forEach(([x,z,y,r,h],i)=>{const mountain=new THREE.Mesh(new THREE.ConeGeometry(r,h,7),new THREE.MeshStandardMaterial({color:i===0?'#536b59':'#49614f',roughness:.96}));mountain.position.set(x,y+.4,z); mountain.rotation.y=.35*i; mountain.castShadow=true; mountains.add(mountain); const snow=new THREE.Mesh(new THREE.ConeGeometry(r*.42,h*.23,7),new THREE.MeshStandardMaterial({color:'#d9e8ee',roughness:.8}));snow.position.set(x,y+h*.5+.05,z);snow.rotation.y=mountain.rotation.y;mountains.add(snow)});

const riverCurve = new THREE.CatmullRomCurve3([v(4.8,-.9,-.3),v(3.7,-1.35,-.1),v(2.4,-1.6,.35),v(1.2,-1.7,.1),v(.1,-1.82,.45),v(-1.4,-2.0,.6)]);
const river = new THREE.Mesh(new THREE.TubeGeometry(riverCurve,90,.13,10,false),new THREE.MeshBasicMaterial({color:'#3cb5ff',transparent:true,opacity:.18,blending:THREE.AdditiveBlending})); scene.add(river);
const groundwaterCurve = new THREE.CatmullRomCurve3([v(5.8,-2.7,1),v(4.4,-3.25,.7),v(2.7,-3.4,.4),v(1,-3.25,.6),v(-.8,-2.9,.8)]);
const groundwater = new THREE.Mesh(new THREE.TubeGeometry(groundwaterCurve,80,.11,10,false),new THREE.MeshBasicMaterial({color:'#38aaff',transparent:true,opacity:.04,blending:THREE.AdditiveBlending})); scene.add(groundwater);
const sun = new THREE.Mesh(new THREE.SphereGeometry(.72,40,40),new THREE.MeshBasicMaterial({color:'#ffd96b'})); sun.position.set(-6,5,-3); scene.add(sun); const sunHalo=new THREE.Sprite(new THREE.SpriteMaterial({map:radialTexture('#ffd86d'),transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false})); sunHalo.position.copy(sun.position);sunHalo.scale.set(4,4,1);scene.add(sunHalo);
const cloud = new THREE.Group(); scene.add(cloud); [[0,0,0,1.15],[1,.1,0,.95],[-1,.05,.1,.85],[.4,.55,-.1,.8],[-.45,.55,.05,.75]].forEach(([x,y,z,s])=>{const p=new THREE.Mesh(new THREE.SphereGeometry(s,28,20),new THREE.MeshStandardMaterial({color:'#dce7ee',roughness:.96,transparent:true,opacity:.86}));p.position.set(x,y,z);cloud.add(p)}); cloud.position.set(3.3,4.1,0);
const vapor = makeParticles(24,'#6dc9ff',.075); const rain = makeParticles(42,'#74c7ff',.045); const infiltrate = makeParticles(18,'#47aef5',.055); const runoffDots = makeParticles(16,'#4cbcff',.065); const groundwaterDots = makeParticles(14,'#3bafff',.06);

function renderScene(time:number){
  resize(); const step=ui.renderStep(time,copy[language]); ui.renderTime(time);
  const evap=easeInOutCubic(stepProgressAt(STEPS[0],time)), transport=easeInOutCubic(stepProgressAt(STEPS[1],time)), precip=easeInOutCubic(stepProgressAt(STEPS[2],time)), runoff=easeInOutCubic(stepProgressAt(STEPS[3],time)), ground=easeInOutCubic(stepProgressAt(STEPS[4],time));
  const oceanWave=Math.sin(time*.8)*.012; ocean.position.y=-2.15+oceanWave; oceanGlow.position.y=-2.1+oceanWave; sunHalo.scale.setScalar(3.8+evap*.55+Math.sin(time*.6)*.08); sunLight.intensity=3.2+evap*.8;
  cloud.position.x=lerp(1.1,3.3,transport); cloud.position.y=lerp(4.5,3.65,transport); cloud.scale.setScalar(.82+transport*.28+precip*.12); cloud.children.forEach(child=>{const mat=(child as THREE.Mesh).material as THREE.MeshStandardMaterial;mat.color.set(precip>0?'#aebdca':'#dce7ee');mat.opacity=.7+transport*.18});
  vapor.forEach((dot,index)=>{const p=(time*.35+index/24)%1;dot.visible=step<=1;dot.position.set(-5.2+(index%6)*.5,lerp(-1.85,3.4,p)+Math.sin(index*1.7+time)*.12,1+(index%4)*.18);dot.scale.setScalar(.7+p*.7);(dot.material as THREE.MeshBasicMaterial).opacity=(1-p)*(.15+.6*Math.max(evap,transport*.8))});
  rain.forEach((dot,index)=>{const p=(time*.55+index/42)%1;dot.visible=step===2||step===3;dot.position.set(2.1+(index%9)*.38,lerp(3.2,-1.45,p),-.8+(index%6)*.32);(dot.material as THREE.MeshBasicMaterial).opacity=precip*(.25+.75*(1-p))});
  (river.material as THREE.MeshBasicMaterial).opacity=.16+runoff*.82+ground*.18; runoffDots.forEach((dot,index)=>{const p=(runoff*.15+time*.22+index/16)%1;dot.visible=step>=3;dot.position.copy(riverCurve.getPoint(p));(dot.material as THREE.MeshBasicMaterial).opacity=.28+runoff*.7});
  infiltrate.forEach((dot,index)=>{const p=(time*.38+index/18)%1;dot.visible=step===4;dot.position.set(2+(index%6)*.72,lerp(-1.55,-3.15,p),-.5+(index%4)*.42);(dot.material as THREE.MeshBasicMaterial).opacity=ground*(.2+.7*(1-p))});
  (groundwater.material as THREE.MeshBasicMaterial).opacity=.04+ground*.8; groundwaterDots.forEach((dot,index)=>{const p=(time*.15+index/14)%1;dot.visible=step===4;dot.position.copy(groundwaterCurve.getPoint(p));(dot.material as THREE.MeshBasicMaterial).opacity=ground*(.25+.7*Math.sin(Math.PI*p))});
  const cameraTargets=[v(0,2.2,14.8),v(.8,2.5,14),v(1.8,2.5,13.4),v(1.4,1.4,13.2),v(1,-.2,12.4)]; const lookTargets=[v(0,0,0),v(.6,.4,0),v(2,.6,0),v(1,-.5,0),v(1,-1.6,0)]; const local=easeInOutCubic(stepProgressAt(STEPS[step],time)); camera.position.copy(lerpV(cameraTargets[step],cameraTargets[Math.min(4,step+1)],local*.36));camera.lookAt(lerpV(lookTargets[step],lookTargets[Math.min(4,step+1)],local*.36));
  renderer.render(scene,camera); updateCallouts(step,evap,transport,precip,runoff,ground);
}

const controller=new DeterministicTimeline({duration:DURATION,steps:STEPS,qaTimes:[0,4.7,5.3,9.7,10.4,14.7,15.4,19.7,20.5,24.8],onRender:renderScene,onPlayStateChange(value){playing=value;ui.setPlaying(value,copy[language])}});window.__LOOP_ANIMATION__=controller;ui.bindController(controller);ui.playButton.addEventListener('click',()=>playing?controller.pause():controller.play());ui.languageButton.addEventListener('click',()=>{language=language==='zh'?'en':'zh';persistLanguage(language);const url=new URL(location.href);url.searchParams.set('lang',language);history.replaceState({},'',url);applyCopy();controller.renderAt(controller.currentTime)});addEventListener('resize',()=>controller.renderAt(controller.currentTime));
applyCopy();controller.renderAt(0);

function applyCopy(){ui.applyCopy(copy[language],language,playing);calloutCopy[language].forEach((entry,index)=>{callouts[index].querySelector('strong')!.textContent=entry[0];callouts[index].querySelector('small')!.textContent=entry[1]})}
function updateCallouts(step:number,a:number,b:number,c:number,d:number,e:number){const op=[a,b,c,d,e];const points=[v(-4.3,.4,1),v(2.3,3.5,0),v(4.3,1.8,0),v(2.5,-.9,.2),v(2.3,-2.75,.5)];callouts.forEach((el,index)=>projectPoint(points[index],el,index===step?Math.max(.45,op[index]):op[index]*.22,12,-6))}
function resize(){const w=ui.canvas.clientWidth,h=ui.canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix()}
function makeParticles(count:number,color:string,size:number){return Array.from({length:count},()=>{const dot=new THREE.Mesh(new THREE.SphereGeometry(size,10,10),new THREE.MeshBasicMaterial({color,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(dot);return dot})}
function projectPoint(world:THREE.Vector3,element:HTMLElement,opacity:number,x=0,y=0){const p=world.clone().project(camera);element.style.transform=`translate(${(p.x*.5+.5)*ui.canvas.clientWidth+x}px,${(-p.y*.5+.5)*ui.canvas.clientHeight+y}px)`;element.style.opacity=String(Math.max(0,Math.min(1,opacity)))}
function radialTexture(color:string){const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d')!;const g=ctx.createRadialGradient(128,128,10,128,128,128);g.addColorStop(0,color);g.addColorStop(.2,color);g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,256,256);return new THREE.CanvasTexture(c)}
function v(x:number,y:number,z:number){return new THREE.Vector3(x,y,z)}function lerpV(a:THREE.Vector3,b:THREE.Vector3,t:number){return v(lerp(a.x,b.x,t),lerp(a.y,b.y,t),lerp(a.z,b.z,t))}
