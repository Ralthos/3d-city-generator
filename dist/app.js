import * as THREE from 'three';
import {OrbitControls} from './OrbitControls.js';
import {generateCity,randomFromSeed} from './city.mjs';
import {createCityRenderer} from './scene.mjs';

const $=id=>document.getElementById(id),host=$('canvas');
let renderer,scene,camera,controls,model,cityRenderer,sun,ambient,skyLight,rainMesh,groundMaterial;
let topView=false,lightMode='day',rainOn=false,ready=false,appliedHeightMeters=120;
const roadNames=['narrow','medium','wide'];
const settings=()=>({size:Number($('size').value),density:Number($('density').value),height:Math.max(3,Math.floor(Number($('height').value)/3.4)),seed:$('seed').value.trim()||'METRO-2026',parkCoverage:Number($('parks').value),roadWidth:roadNames[Number($('road').value)]});
const newSeed=()=>{const values=crypto.getRandomValues(new Uint32Array(1));return 'METRO-'+values[0].toString(36).toUpperCase().slice(0,7);};
const notify=text=>{$('status').textContent=text;};
function updateLabels(){
  $('sizeValue').textContent=$('size').value+' × '+$('size').value;
  $('densityValue').textContent=$('density').value+'%';$('heightValue').textContent=$('height').value+' m';$('parksValue').textContent=$('parks').value+'%';
  $('roadValue').textContent=['Narrow','Medium','Wide'][Number($('road').value)];
  for(const id of ['size','density','height','parks','road']){const input=$(id),progress=(input.value-input.min)/(input.max-input.min)*100;input.style.background=`linear-gradient(90deg,#2867c7 ${progress}%,#dfe5ed ${progress}%)`;}
}
function build(randomize=false){
  if(!ready)return;if(randomize)$('seed').value=newSeed();
  model=generateCity(settings());appliedHeightMeters=Number($('height').value);$('seed').value=model.seed;
  cityRenderer.rebuild(model);$('buildingCount').textContent=model.buildings.length;$('blockCount').textContent=model.size**2;
  $('greenCount').textContent=model.parkBlocks.length;$('seedBadge').textContent=model.seed;
  controls.maxDistance=model.span*6;controls.minDistance=8;resetCamera();
  const extent=model.span*.8;Object.assign(sun.shadow.camera,{left:-extent,right:extent,top:extent,bottom:-extent,far:model.span*4});sun.shadow.camera.updateProjectionMatrix();
  sun.position.set(-model.span*.5,model.span,model.span*.4);fitRain(model.span);scene.fog.near=model.span*3;scene.fog.far=model.span*7;
  notify(`${model.buildings.length} buildings · ${model.parkBlocks.length} green spaces`);
  renderer.domElement.setAttribute('aria-label',`Miniature 3D city with ${model.buildings.length} buildings, ${model.size**2} blocks, and ${model.parkBlocks.length} green spaces. Drag to orbit, scroll to zoom.`);
}
function resize(){
  const width=host.clientWidth,height=host.clientHeight;renderer.setSize(width,height);camera.aspect=width/height;
  const panelOffset=width>760?Math.min(185,width*.15):0;
  camera.setViewOffset(width,height,panelOffset,width>760?-35:-20,width,height);camera.updateProjectionMatrix();
}
function resetCamera(){
  if(!model)return;const width=host.clientWidth,height=host.clientHeight,small=width<=760;
  const availableWidth=small?width:width-(width>1050?405:365);
  const framing=Math.max(1,(small?1.4:1.12)/(availableWidth/height)),distance=model.span*1.95*framing;
  controls.target.set(0,3,0);controls.enableRotate=!topView;
  if(topView){camera.position.set(0,distance,.01);controls.target.set(0,0,0);}else camera.position.copy(new THREE.Vector3(1,.95,1.16).normalize().multiplyScalar(distance));
  camera.far=Math.max(2000,model.span*12);camera.updateProjectionMatrix();controls.update();
}
function setView(top){topView=top;$('perspective').classList.toggle('active',!top);$('top').classList.toggle('active',top);resetCamera();}
function setLight(mode){
  lightMode=mode;const night=mode==='night',golden=mode==='golden';document.body.classList.toggle('night',night);
  document.querySelectorAll('[data-light]').forEach(b=>b.classList.toggle('active',b.dataset.light===mode));
  scene.background.set(night?'#0e1c2b':golden?'#e5ceb4':'#c3dce4');scene.fog.color.copy(scene.background);
  ambient.intensity=night?.14:golden?.85:1.0;ambient.color.set(night?'#7f95c4':'#e6edf4');
  skyLight.intensity=night?.35:1.2;skyLight.color.set(night?'#5c78a8':'#d9edf9');skyLight.groundColor.set(night?'#1c2633':'#7e906d');
  sun.intensity=night?.55:golden?2.6:2.7;sun.color.set(night?'#a9c2ff':golden?'#ffbd79':'#fff3dc');
  groundMaterial.color.set(night?'#3a4c58':'#bbd3d7');
  // Rain makes the sky overcast: a greyer background and a weaker sun.
  if(rainOn){scene.background.lerp(new THREE.Color(night?'#0a131c':'#8e9ca6'),.7);scene.fog.color.copy(scene.background);sun.intensity*=.45;}
  cityRenderer.setNight(night);renderer.toneMappingExposure=night?1.0:1.05;
}
// Rain is drawn as short falling streaks sized to the city, so it stays visible from the default camera distance.
const RAIN_DROPS=8000;let rainTop=110,rainLength=2.6;
function createRain(){
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(RAIN_DROPS*6),3));
  rainMesh=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:'#eef6fb',transparent:true,opacity:.6,depthWrite:false}));rainMesh.frustumCulled=false;rainMesh.visible=false;scene.add(rainMesh);
}
function fitRain(span){
  const positions=rainMesh.geometry.attributes.position.array,random=randomFromSeed('rain'),area=span*1.15;rainTop=Math.max(50,span*.4);rainLength=Math.max(2.2,span*.018);
  for(let i=0;i<positions.length;i+=6){const x=(random()-.5)*area,y=random()*rainTop,z=(random()-.5)*area;positions.set([x,y,z,x,y+rainLength,z],i);}
  rainMesh.geometry.attributes.position.needsUpdate=true;
}
function download(data,name,type){const blob=new Blob([data],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
function openTab(name){document.querySelectorAll('[data-tab]').forEach(b=>{const selected=b.dataset.tab===name;b.classList.toggle('active',selected);b.setAttribute('aria-selected',String(selected));});for(const id of ['layout','weather','export'])$(id+'Panel').hidden=id!==name;}
document.querySelectorAll('[data-tab]').forEach(button=>button.onclick=()=>openTab(button.dataset.tab));
for(const id of ['size','density','height','parks','road']){$(id).addEventListener('input',updateLabels);$(id).addEventListener('change',()=>build());}
$('generate').onclick=()=>build(true);$('applySeed').onclick=()=>build();
$('seed').addEventListener('keydown',event=>{if(event.key==='Enter')build();});
$('copySeed').onclick=async()=>{try{await navigator.clipboard.writeText($('seed').value);notify('Seed copied. Save it to return to this city.');}catch{$('seed').select();notify('Select and copy the highlighted seed.');}};
$('aboutButton').onclick=()=>$('about').showModal();$('closeAbout').onclick=()=>$('about').close();
$('about').addEventListener('click',event=>{if(event.target===$('about')){const r=$('about').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)$('about').close();}});
$('perspective').onclick=()=>{if(ready)setView(false);};$('top').onclick=()=>{if(ready)setView(true);};$('reset').onclick=()=>{if(ready)resetCamera();};
function zoom(factor){if(!ready)return;const offset=camera.position.clone().sub(controls.target),distance=THREE.MathUtils.clamp(offset.length()*factor,controls.minDistance,controls.maxDistance);camera.position.copy(controls.target).add(offset.setLength(distance));controls.update();}
$('zoomIn').onclick=()=>zoom(.8);$('zoomOut').onclick=()=>zoom(1.25);
document.querySelectorAll('[data-light]').forEach(button=>button.onclick=()=>{if(ready)setLight(button.dataset.light);});
$('rain').onclick=()=>{if(!ready)return;rainOn=!rainOn;rainMesh.visible=rainOn;setLight(lightMode);$('rain').setAttribute('aria-checked',String(rainOn));};
$('rotate').onclick=()=>{if(!ready)return;controls.autoRotate=!controls.autoRotate;$('rotate').setAttribute('aria-checked',String(controls.autoRotate));};
$('capture').onclick=()=>{if(!ready)return;renderer.render(scene,camera);renderer.domElement.toBlob(blob=>{if(blob){download(blob,'3d-procedural-city-'+model.seed+'.png','image/png');notify('City image saved.');}},'image/png');};
$('saveLayout').onclick=()=>{if(!ready)return;const {size,density,height,seed,parkCoverage,roadWidth}=model;const data={application:'3D Procedural City Generator',version:2,settings:{size,density,height,seed,parkCoverage,roadWidth},heightLimitMeters:appliedHeightMeters,lighting:lightMode,city:model};download(JSON.stringify(data,null,2),'3d-procedural-city-'+model.seed+'.json','application/json');notify('City layout exported.');};
updateLabels();
try{
  renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;host.appendChild(renderer.domElement);
  scene=new THREE.Scene();scene.background=new THREE.Color('#c3dce4');scene.fog=new THREE.Fog('#c3dce4',600,1800);
  camera=new THREE.PerspectiveCamera(38,1,.3,3000);controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.075;controls.maxPolarAngle=Math.PI*.47;controls.autoRotateSpeed=.6;
  ambient=new THREE.AmbientLight('#e6edf4',1);scene.add(ambient);skyLight=new THREE.HemisphereLight('#d9edf9','#7e906d',1.2);scene.add(skyLight);
  sun=new THREE.DirectionalLight('#fff3dc',2.7);sun.position.set(-120,220,100);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0002;sun.shadow.normalBias=.1;scene.add(sun);
  groundMaterial=new THREE.MeshStandardMaterial({color:'#bbd3d7',roughness:1});const ground=new THREE.Mesh(new THREE.PlaneGeometry(10000,10000),groundMaterial);ground.rotation.x=-Math.PI/2;ground.position.y=-3.2;ground.receiveShadow=true;scene.add(ground);
  cityRenderer=createCityRenderer(scene);createRain();resize();ready=true;build();$('loading').remove();new ResizeObserver(()=>{resize();if(model)resetCamera();}).observe(host);
  const clock=new THREE.Clock();renderer.setAnimationLoop(()=>{const delta=Math.min(clock.getDelta(),.05);controls.update();if(rainOn){const attribute=rainMesh.geometry.attributes.position,a=attribute.array,fall=delta*rainTop*.9;for(let i=0;i<a.length;i+=6){let y=a[i+1]-fall;if(y<0)y+=rainTop;a[i+1]=y;a[i+4]=y+rainLength;}attribute.needsUpdate=true;}renderer.render(scene,camera);});
}catch(error){console.error(error);$('loading').textContent='This 3D city needs WebGL. Please enable hardware acceleration and reload.';notify('The 3D view could not start.');$('generate').disabled=true;}
