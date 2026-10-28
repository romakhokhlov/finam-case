import fs from 'node:fs/promises';
import sharp from 'sharp';

const fileKey='zG9GLaQaUXOhPeZC9VOBmx';
const parentId='2344:2011';
const items=[
  ['2422:4224','image-49','example-image-one',444,1053],
  ['2422:4225','image-50','example-image-two',444,1053],
  ['2425:4249','image-46','example-image-three',444,1269],
  ['2425:4251','image-48','example-image-four',444,1269],
  ['2423:4230','image-67','example-image-five',444,882],
  ['2424:4238','image-69','example-image-six',444,882]
];
const token=process.env.FIGMA_TOKEN;
if(!token) throw new Error('Missing FIGMA_TOKEN secret');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function figma(endpoint){
  for(let attempt=0;attempt<7;attempt++){
    const r=await fetch('https://api.figma.com/v1'+endpoint,{headers:{'X-Figma-Token':token}});
    if(r.status===429||r.status>=500){
      if(attempt===6)throw new Error('Figma API retries exhausted: '+r.status);
      const retry=Number(r.headers.get('retry-after'));
      await sleep(Number.isFinite(retry)&&retry>0?Math.min(retry*1000,180000):Math.min(6000*2**attempt,120000));
      continue;
    }
    if(!r.ok)throw new Error('Figma API '+r.status+': '+(await r.text()).slice(0,500));
    const data=await r.json();
    if(data.err||data.error)throw new Error('Figma error '+JSON.stringify(data));
    return data;
  }
}
async function download(url){
  for(let attempt=0;attempt<5;attempt++){
    const r=await fetch(url);
    if(r.ok)return Buffer.from(await r.arrayBuffer());
    if((r.status!==429&&r.status<500)||attempt===4)throw new Error('Image download HTTP '+r.status);
    await sleep(2000*2**attempt);
  }
}
const source=await figma('/files/'+fileKey+'/nodes?ids='+encodeURIComponent(parentId));
const root=source.nodes?.[parentId]?.document;
if(root?.type!=='FRAME')throw new Error('Figma parent frame missing');
const known=new Map();
function collect(node){
  known.set(node.id,node);
  for(const child of node.children||[])collect(child);
}
collect(root);
const html=await fs.readFile('index.html','utf8');
const start=html.indexOf('<div id="examples-media"');
const end=html.indexOf('\n</section>',start);
if(start<0||end<0)throw new Error('Missing #examples-media');
const markup=html.slice(start,end);
for(const [id,name,htmlId,width,height] of items){
  const n=known.get(id),rect=n?.absoluteBoundingBox;
  if(n?.type!=='RECTANGLE'||!n.fills?.some(f=>f.type==='IMAGE')||!rect
    ||Math.abs(rect.width-width)>1||Math.abs(rect.height-height)>1)throw new Error('Unexpected Figma image '+id);
  const tags=[...markup.matchAll(/<img\b[^>]*>/g)].map(m=>m[0]).filter(s=>s.includes('id="'+htmlId+'"'));
  if(tags.length!==1||!tags[0].includes('src="assets/'+name+'.webp"'))throw new Error('Wrong HTML image mapping: '+htmlId);
}
const ids=items.map(x=>x[0]).join(',');
const rendered=await figma('/images/'+fileKey+'?ids='+encodeURIComponent(ids)+'&format=png&scale=2');
const output=new Map(),report=[];
for(const [id,name,,width,height] of items){
  const url=rendered.images?.[id];
  if(!url)throw new Error('No Figma render for '+id);
  const png=await download(url);
  const meta=await sharp(png).metadata();
  if(!meta.width||!meta.height)throw new Error('Invalid PNG '+id);
  const webp=await sharp(png).rotate().resize({width:width*2,withoutEnlargement:true})
    .webp({quality:84,effort:6,alphaQuality:100}).toBuffer({resolveWithObject:true});
  const ratio=webp.info.width/webp.info.height;
  if(Math.abs(ratio-width/height)>.003||webp.info.width<width)throw new Error('Unexpected crop or resolution for '+id);
  output.set(name+'.webp',webp.data);
  report.push({node:id,file:name+'.webp',px:[webp.info.width,webp.info.height],bytes:webp.data.length});
}
await fs.mkdir('assets',{recursive:true});
for(const [file,bytes] of output)await fs.writeFile('assets/'+file,bytes);
console.log(JSON.stringify({target:'#examples-media',source:parentId,files:report},null,2));
