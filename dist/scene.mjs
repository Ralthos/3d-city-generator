import * as THREE from 'three';
import {randomFromSeed} from './city.mjs';

const COLORS={white:'#e7e6dd',concrete:'#aeb7bc',dark:'#273644',glass:'#3d8199',wood:'#956b49',grass:'#7cad43',road:'#485360'};
export function createCityRenderer(scene) {
  const solid=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.88});
  // glass: facades and unlit panes. lit: panes that glow at night. nightLit: office/tower window lights shown only at night. lamp: streetlights and headlights.
  const glass=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.3,metalness:.15});
  const lit=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.3,metalness:.15,emissive:'#ffc36b',emissiveIntensity:0});
  const nightLit=new THREE.MeshBasicMaterial({color:0xffffff,visible:false});
  const lamp=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.5,emissive:'#ffe2a0',emissiveIntensity:0});
  const materials={solid,glass,lit,nightLit,lamp};
  const warmLights=['#ffd58a','#ffe7b0','#fff1d0','#ffc670','#f6e2b8'];
  let winRandom=Math.random;const warm=()=>warmLights[Math.floor(winRandom()*warmLights.length)];
  const water=new THREE.MeshStandardMaterial({color:'#35afce',roughness:.22,metalness:.2});
  const roofShape=new THREE.Shape();roofShape.moveTo(-.5,0);roofShape.lineTo(.5,0);roofShape.lineTo(0,1);roofShape.closePath();
  const roofGeometry=new THREE.ExtrudeGeometry(roofShape,{depth:1,bevelEnabled:false});roofGeometry.translate(0,0,-.5);
  const geometries={box:new THREE.BoxGeometry(1,1,1),leaf:new THREE.IcosahedronGeometry(1,1),roof:roofGeometry,cylinder:new THREE.CylinderGeometry(1,1,1,12),cone:new THREE.ConeGeometry(1,1,8),sphere:new THREE.SphereGeometry(1,8,6)};
  let group,batches;
  function add(kind,p,s,color,rotation=0,mat='solid'){const key=kind+':'+mat;(batches[key]??={kind,mat,items:[]}).items.push({p,s,color,rotation});}
  const box=(x,y,z,w,h,d,color,r=0,mat='solid')=>add('box',[x,y,z],[w,h,d],color,r,mat);
  function tree(x,z,scale=1,y=.61){box(x,y+1.1*scale,z,.3*scale,2.2*scale,.3*scale,'#7d6643');add('leaf',[x,y+3*scale,z],[1.5*scale,1.9*scale,1.5*scale],'#4d863e');add('leaf',[x+.7*scale,y+2.6*scale,z+.2*scale],[1.1*scale,1.2*scale,1.1*scale],'#65a04a');}
  function bench(x,z,rotation=0){box(x,.96,z,2,.18,.6,'#b28c56',rotation);const sin=Math.sin(rotation),cos=Math.cos(rotation);box(x-sin*.3,1.3,z-cos*.3,2,.65,.12,'#b28c56',rotation);for(const sign of [-1,1])box(x+cos*.7*sign,.73,z-sin*.7*sign,.16,.5,.5,'#344958',rotation);}
  function building(b) {
    const {width:w,depth:d,floors:f,type,shade}=b,y0=.66;
    // Shops and workshops need a minimum wall height so storefronts, awnings, and garage doors fit below the roof.
    let h=f*1.05+.75;if(type==='shop')h=Math.max(h,3.4);if(type==='workshop')h=Math.max(h,3.8);
    const palette=['#cb7256','#dbb36e','#d1d7cf','#d5c0a5','#927673','#719ca1','#e4c687','#bd7a60'];
    const wall=palette[Math.floor(shade*palette.length)],accent=['#bc5546','#276c7f','#415b76','#8e5b44','#557d5b'][Math.floor(b.roof*5)];
    // All six templates use local coordinates so each building can face its street.
    const B=(x,y,z,bw,bh,bd,c,r=0,mat='solid')=>{const sn=Math.sin(b.rotation),cs=Math.cos(b.rotation);box(b.x+x*cs+z*sn,y+y0,b.z+z*cs-x*sn,bw,bh,bd,c,r+b.rotation,mat);};
    const pane=(x,y,z,bw,bh,bd)=>B(x,y,z,bw,bh,bd,'#416d82',0,winRandom()<.45?'lit':'glass');
    const roof=(height,rw=w,rd=d)=>{B(0,height,0,rw+.3,.24,rd+.3,COLORS.white);B(0,height+.2,0,rw*.88,.16,rd*.88,'#858e90');};
    // front: how far a base band protrudes, so the door sits on top of it instead of inside it.
    const door=(front=0)=>{const z=d/2+front;B(0,.65,z+.03,1,1.3,.09,'#284753');B(.36,.65,z+.1,.06,.08,.03,'#e0be64');B(0,.12,z+.37,1.6,.24,.7,COLORS.concrete);};
    const windows=(floors,height,width=w,depth=d,start=0,skipDoor=false)=>{for(let floor=start;floor<floors;floor++){const y=.3+(floor+.5)*(height-.6)/floors;for(let col=-1;col<=1;col++){const x=col*width*.29;for(const sign of [-1,1]){if(skipDoor&&floor===start&&col===0&&sign===1)continue;B(x,y,sign*(depth/2+.035),.97,.8,.09,'#e1d8bc');pane(x,y,sign*(depth/2+.09),.69,.58,.035);}const z=col*depth*.29;for(const sign of [-1,1]){B(sign*(width/2+.035),y,z,.09,.8,.97,'#ddd4bd');pane(sign*(width/2+.09),y,z,.035,.58,.69);}}}};
    B(0,.08,0,w+.32,.16,d+.32,COLORS.concrete);
    if(type==='house') {
      B(0,h/2,0,w,h,d,wall);B(0,.28,0,w+.12,.36,d+.12,'#d4c5ae');
      add('roof',[b.x,h+y0,b.z],[w+.7,1.7,d+.6],'#b64a39',b.rotation);
      windows(f,h,w,d,0,true);door();B(w*.3,h+.6,-d*.2,.7,1.7,.65,'#a16f55');
      B(0,1.6,d/2+.5,2,.2,1.4,'#f0dfb5');for(const sign of [-1,1])B(sign*.85,.8,d/2+.95,.1,1.6,.1,'#eee4ca');
    } else if(type==='shop') {
      B(0,h/2,0,w,h,d,wall);roof(h);B(0,h-.25,d/2+.12,w,.65,.18,accent);
      for(const sign of [-1,1]){pane(sign*w*.27,1,d/2+.07,w*.32,1.35,.1);B(sign*w*.27,1,d/2+.14,.07,1.35,.09,'#d6dfe0');}
      door();for(let stripe=0;stripe<8;stripe++)B((stripe-3.5)*w/8,1.9,d/2+.65,w/8,.2,1.4,stripe%2?'#f0e6d3':accent);
      B(w*.29,h+.32,-d*.21,1.1,.6,1.3,'#a1a6a4');
    } else if(type==='workshop') {
      B(0,h*.4,0,w,h*.8,d,'#a4aca4');B(0,.4,0,w+.06,.8,d+.06,accent);
      add('roof',[b.x,h*.8+y0,b.z],[w+.35,1.2,d+.2],'#4d6875',b.rotation);
      for(let i=-1;i<=1;i++) {B(i*w*.27,1.2,d/2+.04,w*.2,1.8,.1,'#546773');for(let j=0;j<4;j++)B(i*w*.27,.55+j*.36,d/2+.12,w*.2,.04,.05,'#9caaad');}
      B(-w*.35,h*.8+.9,-d*.32,.5,2,.5,'#b7b1a6');B(-w*.35,h*.8+1.5,-d*.32,.55,.35,.55,'#bd6048');
      for(const sign of [-1,1])pane(sign*(w/2+.04),h*.6,0,.08,.6,d*.75);
    } else if(type==='apartment') {
      B(0,h/2,0,w,h,d,wall);B(0,.65,0,w+.12,1.3,d+.12,'#9c9b94');windows(f,h,w,d,1);door(.06);
      for(let floor=1;floor<f;floor++){const y=floor*1.05+.5;B(0,y,0,w+.15,.11,d+.15,'#dccfb5');if(floor%2===1)for(const sign of [-1,1]){B(sign*w*.28,y,d/2+.47,1.8,.12,.85,'#d6d7ca');B(sign*w*.28,y+.43,d/2+.85,1.8,.08,.07,'#4d6469');for(const k of [-1,0,1])B(sign*w*.28+k*.7,y+.23,d/2+.85,.055,.45,.055,'#53636a');}}
      roof(h);B(w*.22,h+.45,-d*.2,1.4,.7,1.5,'#a1a8a5');
    } else if(type==='office') {
      B(0,h/2,0,w,h,d,'#377e95',0,'glass');B(0,.55,0,w+.28,1.1,d+.28,'#d5dce0');
      for(let floor=1;floor<=f;floor++)B(0,floor*1.05+.5,0,w+.16,.12,d+.16,'#bdcad0');
      for(const col of [-.46,-.15,.15,.46]){for(const sign of [-1,1]){B(col*w,h/2,sign*(d/2+.04),.11,h,.11,'#d7dfe0');B(sign*(w/2+.04),h/2,col*d,.11,h,.11,'#d7dfe0');}}
      for(let k=1;k<f;k++){const y=k*1.05+1.03;for(const bay of [-.305,0,.305])for(const sign of [-1,1]){if(winRandom()<.5)B(bay*w,y,sign*(d/2+.07),w*.25,.62,.04,warm(),0,'nightLit');if(winRandom()<.5)B(sign*(w/2+.07),y,bay*d,.04,.62,d*.25,warm(),0,'nightLit');}}
      roof(h);door(.14);B(0,h+.45,0,w*.5,.7,d*.4,'#879a9e');B(0,1.35,d/2+.74,w*.6,.16,1.6,'#dce5e6');
    } else {
      const first=h*.45,second=h*.8;
      B(0,first/2,0,w,first,d,'#467f91',0,'glass');B(0,(first+second)/2,0,w*.81,second-first,d*.81,'#42778b',0,'glass');B(0,(second+h)/2,0,w*.6,h-second,d*.6,'#376a7b',0,'glass');
      for(let floor=1;floor<=f;floor++){const y=floor*1.05+.45,scale=y<first?1:y<second?.81:.6;B(0,y,0,w*scale+.14,.13,d*scale+.14,'#d8d1b6');for(const sign of [-1,1]){B(sign*w*scale*.47,y-.45,0,.18,.95,d*scale+.08,'#e0d8bb');B(0,y-.45,sign*d*scale*.47,w*scale+.08,.95,.18,'#e0d8bb');}}
      const tier=y=>y<first?1:y<second?.81:.6;
      for(let k=1;k<f;k++){const y=k*1.05+.975,scale=tier(y);if(tier(y-.31)!==tier(y+.31)||y+.31>h)continue;const sw=w*scale,sd=d*scale;
        for(const bay of [-.3,0,.3])for(const sign of [-1,1]){if(winRandom()<.45)B(bay*sw,y,sign*(sd/2+.05),sw*.24,.62,.04,warm(),0,'nightLit');if(winRandom()<.45)B(sign*(sw/2+.05),y,bay*sd,.04,.62,sd*.24,warm(),0,'nightLit');}}
      roof(h,w*.6,d*.6);B(0,h+1.4,0,.16,2.5,.16,'#aabcc1');B(0,.6,0,w+.25,1.2,d+.25,'#b4b7ac');door(.13);
    }
  }
  function createCar(x,z,rotation,color) {
    const sn=Math.sin(rotation),cs=Math.cos(rotation);
    const C=(lx,y,lz,w,h,d,c,mat='solid')=>box(x+lx*cs+lz*sn,y,z+lz*cs-lx*sn,w,h,d,c,rotation,mat);
    C(0,.65,0,1.05,.42,2.25,color);C(0,1.02,-.12,.9,.4,1.2,color);C(0,1.08,.52,.75,.28,.06,'#b4e0e5','glass');C(0,1.08,-.73,.75,.26,.06,'#82b6c4','glass');
    for(const side of [-1,1]){C(side*.54,.43,-.7,.14,.4,.4,'#202a34');C(side*.54,.43,.7,.14,.4,.4,'#202a34');C(side*.32,.68,1.14,.2,.12,.04,'#fff2bd','lamp');C(side*.32,.68,-1.14,.2,.12,.04,'#d24c3d');}
  }
  function rebuild(model) {
    if(group){group.traverse(o=>{if(o.isInstancedMesh)o.dispose();});scene.remove(group);}
    group=new THREE.Group();group.name='Miniature city';batches={};const {span,pitch,road,size}=model,half=span/2,random=randomFromSeed(model.seed+'streets');winRandom=randomFromSeed(model.seed+'windows');
    // The border slabs scale with road width so the outer road never overhangs the base.
    box(0,-1.7,0,span+road+9,2.4,span+road+9,'#789b88');box(0,-.38,0,span+road+4,.52,span+road+4,'#b5c4bf');box(0,-.03,0,span+road,.2,span+road,COLORS.road);
    for(const block of model.blocks){box(block.x,.22,block.z,20.5,.4,20.5,'#c9d0cc');box(block.x,.45,block.z,18.9,.12,18.9,'#a5b196');}
    const stripe='#e9e5ce';
    for(let i=0;i<=size;i++) {
      const p=-half+i*pitch;
      for(let j=0;j<size;j++) {
        const c=(j-size/2+.5)*pitch;
        for(let dash=-8;dash<=8;dash+=4){box(p,.092,c+dash,.15,.025,1.7,stripe);box(c+dash,.092,p,1.7,.025,.15,stripe);}
        // Two lanes, shoulder lines, and stop bars remain clear at junctions.
        for(const sign of [-1,1]){box(p+sign*(road/2-.6),.1,c,.09,.025,18.4,'#c1cbcb');box(c,.1,p+sign*(road/2-.6),18.4,.025,.09,'#c1cbcb');}
      }
      for(let j=0;j<=size;j++) {
        const q=-half+j*pitch;
        // Zebra stripes span the full road width, and crossings that would lie outside the city edge are skipped.
        const stripes=Math.floor((road/2-.6)/.65);
        for(let stripeIndex=-stripes;stripeIndex<=stripes;stripeIndex++)for(const side of [-1,1]) {
          const along=road/2+.75;
          if(Math.abs(q+side*along)<half)box(p+stripeIndex*.65,.1,q+side*along,.38,.03,1.3,'#eef0e8');
          if(Math.abs(p+side*along)<half)box(p+side*along,.1,q+stripeIndex*.65,1.3,.03,.38,'#eef0e8');
        }
      }
    }
    for(const b of model.buildings)building(b);
    model.parks.forEach(p=>{box(p.x,.57,p.z,7.8,.15,7.8,'#7fab44');for(let i=0;i<p.trees;i++)tree(p.x+(random()-.5)*4.5,p.z+(random()-.5)*4.5,.65+random()*.2);});
    for(const park of model.parkBlocks) {
      const {x,z,type}=park;box(x,.58,z,18.6,.15,18.6,'#79a743');
      box(x,.69,z,2.1,.09,18.6,'#d3c9aa');box(x,.69,z,18.6,.09,2.1,'#d3c9aa');
      for(const sx of [-1,1])for(const sz of [-1,1]){tree(x+sx*6,z+sz*6,1);tree(x+sx*3.8,z+sz*6,.8);box(x+sx*6,.8,z+sz*3.3,3,.5,.8,'#57923b');}
      for(const sign of [-1,1]){bench(x+sign*4,z+2,0);bench(x+sign*4,z-2,Math.PI);}
      if(type==='plaza') {
        box(x,.73,z,7.5,.16,7.5,'#c6c6b7');add('cylinder',[x,.95,z],[2.65,.4,2.65],'#d1d4cb');add('cylinder',[x,1.17,z],[2.25,.1,2.25],'#44acbf',0,'water');add('cylinder',[x,1.8,z],[.4,1.4,.4],'#c6d5cd');add('sphere',[x,2.65,z],[.6,.65,.6],'#81cee1',0,'water');
      }else{box(x,.76,z,5,.2,5,'#c8bb91');for(const sign of [-1,1])box(x+sign*1.7,1.8,z,.14,2,.14,'#e0ab5f');box(x,2.65,z,3.8,.18,.2,'#e19c54');}
    }
    // Streetlights sit on the corners of each sidewalk, clear of building lots.
    for(const b of model.blocks)for(const sign of [-1,1]) {
      const x=b.x+sign*9.3,z=b.z+sign*9.3;
      box(x,2.5,z,.12,4.5,.12,'#4f6572');box(x+sign*.35,4.7,z,.85,.12,.18,'#4f6572');box(x+sign*.65,4.62,z,.35,.08,.25,'#f3df9b',0,'lamp');
    }
    const carColors=['#e65a48','#edbb49','#dfe2dd','#3c88c3','#74a5a7','#ce6b43'];
    for(let i=0;i<Math.min(size*size*2,105);i++) {
      const lane=Math.floor(random()*(size+1)),segment=Math.floor(random()*size),offset=(random()-.5)*15,side=random()>.5?1:-1;
      const x=-half+lane*pitch+side*road*.23,z=(segment-size/2+.5)*pitch+offset;
      if(i%2)createCar(z,x,side>0?Math.PI/2:-Math.PI/2,carColors[i%carColors.length]);else createCar(x,z,side>0?0:Math.PI,carColors[i%carColors.length]);
    }
    const dummy=new THREE.Object3D(),color=new THREE.Color();
    for(const batch of Object.values(batches)) {
      const mat=batch.mat==='water'?water:materials[batch.mat]??solid;
      const mesh=new THREE.InstancedMesh(geometries[batch.kind],mat,batch.items.length);
      batch.items.forEach((item,index)=>{dummy.position.set(...item.p);dummy.scale.set(...item.s);dummy.rotation.set(0,item.rotation,0);dummy.updateMatrix();mesh.setMatrixAt(index,dummy.matrix);mesh.setColorAt(index,color.set(item.color));});
      mesh.castShadow=batch.mat!=='nightLit';mesh.receiveShadow=true;mesh.frustumCulled=false;group.add(mesh);
    }
    scene.add(group);return group;
  }
  return{rebuild,setNight(value){lit.emissiveIntensity=value?.9:0;nightLit.visible=value;lamp.emissiveIntensity=value?2.2:0;}};
}
