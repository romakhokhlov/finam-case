import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const spec=JSON.parse(await fs.readFile('figma-assets.json','utf8'));
const token=process.env.FIGMA_TOKEN;
if(!token) throw new Error('Missing FIGMA_TOKEN');
const outDir=path.resolve('assets');
await fs.mkdir(outDir,{recursive:true});
async function figma(endpoint){
  for(let attempt=0;attempt<6;attempt++){
    const r=await fetch('https://api.figma.com/v1'+endpoint,{headers:{'X-Figma-Token':token}});
    if(r.status===429||r.status>=500){if(attempt===5)throw new Error('Figma API '+r.status);await new Promise(x=>setTimeout(x,Math.min(5000*2**attempt,120000)));continue;}
    if(!r.ok)throw new Error('Figma API '+r.status+': '+(await r.text()).slice(0,500));
    return await r.json();
  }
}
function walk(node,out){if(!node)return;if(node.type==='RECTANGLE'||node.type==='ELLIPSE'||node.type==='VECTOR'||node.type==='POLYGON'||node.type==='STAR'){if(Array.isArray(node.fills)&&node.fills.some(f=>f.type==='IMAGE'&&f.visible!==false))out.push(node);}for(const c of node.children||[])walk(c,out);}
const entries=[];
for(const section of spec.sections||[]){
  const response=await figma('/files/'+spec.fileKey+'/nodes?ids='+encodeURIComponent(section.nodeId));
  const root=response.nodes?.[section.nodeId]?.document;
  if(!root) throw new Error('Missing section node '+section.nodeId);
  const layers=[];walk(root,layers);
  if(!layers.length) throw new Error('No IMAGE layers found inside '+section.nodeId);
  layers.forEach((node,i)=>entries.push({name:section.prefix+'-'+String(i+1).padStart(2,'0'),nodeId:node.id,maxWidth:section.maxWidth,quality:section.quality||84,source:node}));
}
const results=[];
for(const e of entries){
  const w=e.source;
  const width=w.absoluteBoundingBox?.width||w.size?.x;
  const scale=Math.min(Number(spec.maxScale||2),2,e.maxWidth/width);
  const render=await figma('/images/'+spec.fileKey+'?ids='+encodeURIComponent(e.nodeId)+'&format=png&scale='+scale.toFixed(5));
  const url=render.images?.[e.nodeId];if(!url)throw new Error('Missing render '+e.name);
  const input=Buffer.from(await (await fetch(url)).arrayBuffer());
  const meta=await sharp(input).metadata();
  const output=await sharp(input).webp({quality:e.quality,effort:6,alphaQuality:100}).toBuffer();
  await fs.writeFile(path.join(outDir,e.name+'.webp'),output);
  results.push({name:e.name,nodeId:e.nodeId,width:meta.width,height:meta.height,before:input.length,after:output.length});
}
let html=await fs.readFile('index.html','utf8');
const slides=results.map((x,i)=>'<div class="modular-slide" id="modular-slide-'+(i+1)+'" role="group" aria-label="'+(i+1)+' из '+results.length+'"><img src="assets/'+x.name+'.webp" alt="Modular Block System — image '+(i+1)+'" loading="lazy"></div>').join('');
html=html.replace('<!-- MODULAR_SLIDES --><!-- /MODULAR_SLIDES -->','<!-- MODULAR_SLIDES -->'+slides+'<!-- /MODULAR_SLIDES -->');
await fs.writeFile('index.html',html);
const keep=new Set(results.map(x=>x.name+'.webp'));
for(const f of await fs.readdir(outDir))if(/^modular-/.test(f)&&/\.(png|jpe?g|webp)$/i.test(f)&&!keep.has(f))await fs.unlink(path.join(outDir,f));
const before=results.reduce((a,x)=>a+x.before,0),after=results.reduce((a,x)=>a+x.after,0);
let report='# Figma modular section export report\n\n- Source node: '+spec.sections[0].nodeId+'\n- IMAGE layers exported: '+results.length+'\n- PNG input: '+before+' bytes\n- WebP output: '+after+' bytes\n- Reduction: '+(100*(1-after/before)).toFixed(1)+'%\n\n| File | Node | Dimensions | Before | After |\n|---|---|---|---:|---:|\n';
for(const x of results)report+='| '+x.name+'.webp | '+x.nodeId+' | '+x.width+'×'+x.height+' | '+x.before+' | '+x.after+' |\n';
await fs.writeFile('ASSET-REPORT.md',report);
console.log(report);
