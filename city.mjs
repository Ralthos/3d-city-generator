export function randomFromSeed(seed){let h=2166136261;for(const c of String(seed)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return()=>{h+=0x6D2B79F5;let t=h;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
const clamp=(value,min,max,fallback)=>{const n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;};
export function generateCity({size=8,density=70,height=24,seed='CITY-2048',parkCoverage=0,roadWidth='medium'}={}) {
  size=Math.round(clamp(size,3,16,8));density=clamp(density,0,100,70);height=Math.round(clamp(height,3,60,24));parkCoverage=clamp(parkCoverage,0,100,0);
  const road={narrow:6,medium:8,wide:11}[roadWidth]??8,pitch=20+road,span=size*pitch;
  const random=randomFromSeed(seed),parkRandom=randomFromSeed(seed+'parks'),buildings=[],parks=[],blocks=[],parkBlocks=[];
  for(let x=0;x<size;x++)for(let z=0;z<size;z++)blocks.push({blockX:x,blockZ:z,x:(x-size/2+.5)*pitch,z:(z-size/2+.5)*pitch,rank:parkRandom()});
  const greenIds=new Set([...blocks].sort((a,b)=>a.rank-b.rank).slice(0,Math.round(blocks.length*parkCoverage/100)).map(b=>b.blockX+','+b.blockZ));
  for(const block of blocks) {
    const green=greenIds.has(block.blockX+','+block.blockZ);
    if(green)parkBlocks.push({...block,type:block.rank>.5?'plaza':'park'});
    for(let a=0;a<2;a++)for(let b=0;b<2;b++) {
      const x=block.x+(a-.5)*9,z=block.z+(b-.5)*9;
      const occupied=random()*100<density,width=5.3+random()*2,depth=5.3+random()*2;
      const centrality=Math.max(.08,1-Math.hypot(x,z)/(span*.6));
      const choice=random();let type;
      if(choice<.18)type='house';else if(choice<.34)type='shop';else if(choice<.48)type='workshop';else if(choice<.72)type='apartment';else if(choice<.9)type='office';else type=centrality>.25?'tower':'apartment';
      let floors=Math.max(1,Math.round(2+Math.pow(random(),1.3)*(height-2)*(.25+.75*centrality)));
      floors=Math.min(height,type==='house'?3:type==='shop'?2:type==='workshop'?3:type==='apartment'?10:floors,floors);
      // Mid- and high-rise templates need a few floors to read correctly; the height cap still wins.
      floors=Math.min(height,Math.max({apartment:3,office:4,tower:8}[type]??1,floors));
      const shade=random(),roof=random(),trees=Math.floor(random()*3)+1;
      if(occupied&&!green)buildings.push({x,z,width,depth,floors,type,shade,roof,blockX:block.blockX,blockZ:block.blockZ,rotation:b===0?Math.PI:0});
      else if(!green)parks.push({x,z,trees});
    }
  }
  return{size,density,height,seed,parkCoverage,roadWidth,road,pitch,span,buildings,parks,parkBlocks,blocks,coverage:buildings.reduce((sum,b)=>sum+b.width*b.depth,0)/(span*span)*100,tallest:Math.max(0,...buildings.map(b=>b.floors))};
}
