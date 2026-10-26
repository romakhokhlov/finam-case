import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const spec = JSON.parse(await fs.readFile('figma-assets.json', 'utf8'));
const token = process.env.FIGMA_TOKEN;
if (!token) throw new Error('Missing FIGMA_TOKEN');
const fileKey=spec.fileKey;
const outDir=path.resolve('assets');
await fs.mkdir(outDir,{recursive:true});

async function figma(endpoint) {
  const r=await fetch('https://api.figma.com/v1'+endpoint,{headers:{'X-Figma-Token':token}});
  if(!r.ok)throw new Error('Figma API '+r.status+': '+(await r.text()).slice(0,500));
  const body=await r.json();
  if(body.err||body.error)throw new Error('Figma API error: '+JSON.stringify(body).slice(0,500));
  return body;
}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const nodeIds=spec.images.map(item=>item.nodeId);
const fileNodes=await figma('/files/'+fileKey+'/nodes?ids='+encodeURIComponent(nodeIds.join(',')));
const candidates=new Map();
for (const entry of spec.images) {
  const node=fileNodes.nodes?.[entry.nodeId]?.document;
  if(!node || !['RECTANGLE','ELLIPSE','VECTOR','POLYGON','STAR'].includes(node.type))
    throw new Error('Not an individual shape: '+entry.name);
  if(!Array.isArray(node.fills)||!node.fills.some(fill=>fill.type==='IMAGE'&&fill.visible!==false))
    throw new Error('Refusing to export non-IMAGE layer: '+entry.name);
  const w=node.absoluteBoundingBox?.width||node.size?.x;
  if(!(w>0))throw new Error('Unknown layer width: '+entry.name);
  const scale=Math.min(Number(spec.maxScale||2),2,entry.maxWidth/w);
  if(!(scale>0))throw new Error('Bad scale: '+entry.name);
  const render=await figma('/images/'+fileKey+'?ids='+encodeURIComponent(entry.nodeId)+'&format=png&scale='+scale.toFixed(5));
  const imageUrl=render.images?.[entry.nodeId];
  if(!imageUrl)throw new Error('Missing render URL for '+entry.name);
  const response=await fetch(imageUrl);
  if(!response.ok)throw new Error('Render failed for '+entry.name+': '+response.status);
  const input=Buffer.from(await response.arrayBuffer());
  const meta=await sharp(input).metadata();
  if(!(meta.width>0&&meta.height>0))throw new Error('Invalid bitmap: '+entry.name);
  if(meta.width>entry.maxWidth+2)throw new Error('Exported width exceeds limit: '+entry.name);
  const output=await sharp(input).webp({quality:entry.quality??84,effort:6,alphaQuality:100}).toBuffer();
  const check=await sharp(output).metadata();
  if(check.width!==meta.width||check.height!==meta.height)throw new Error('Geometry changed: '+entry.name);
  candidates.set(entry.name,{output,originalBytes:input.length,width:meta.width,height:meta.height,outputBytes:output.length,hasAlpha:!!meta.hasAlpha,nodeId:entry.nodeId});
  await sleep(400);
}
for(const [name,item] of candidates)await fs.writeFile(path.join(outDir,name+'.webp'),item.output);
for(const filename of ['index.html','styles.css']){
  let source=await fs.readFile(filename,'utf8');
  for(const entry of spec.images)source=source.replaceAll(entry.name+'.png',entry.name+'.webp');
  await fs.writeFile(filename,source);
}
const html=await fs.readFile('index.html','utf8'),css=await fs.readFile('styles.css','utf8');
const refs=new Set([...html.matchAll(/assets\/([\w.-]+\.(?:png|jpe?g|webp|svg))/g),...css.matchAll(/assets\/([\w.-]+\.(?:png|jpe?g|webp|svg))/g)].map(match=>match[1]));
const needed=new Set(spec.images.map(x=>x.name+'.webp'));
for(const ref of refs)if(ref.endsWith('.webp')&&!needed.has(ref))throw new Error('Unexpected webp ref: '+ref);
for(const name of needed)if(!refs.has(name))throw new Error('No HTML reference for '+name);
for(const old of await fs.readdir(outDir))if(/\.(png|jpe?g|webp)$/i.test(old)&&!needed.has(old))await fs.unlink(path.join(outDir,old));
const items=[...candidates.entries()].map(([name,d])=>({name,nodeId:d.nodeId,width:d.width,height:d.height,sourcePNGBytes:d.originalBytes,webpBytes:d.outputBytes,alpha:d.hasAlpha}));
const before=items.reduce((s,x)=>s+x.sourcePNGBytes,0),after=items.reduce((s,x)=>s+x.webpBytes,0);
let report='# Figma image export report\n\n';
report+='- Exported from individual IMAGE layers, never parent frames.\n';
report+='- Count: '+items.length+'\n- PNG render input: '+before+' bytes\n- WebP output: '+after+' bytes\n';
report+='- Reduction: '+(100*(1-after/before)).toFixed(1)+'%\n';
report+='- Largest file: '+Math.max(...items.map(x=>x.webpBytes))+' bytes\n';
report+='- No new backgrounds, pixel-level masking, or cropping outside Figma source layers.\n\n';
report+='| File | Node | Dimensions | Before | After | Alpha |\n|---|---|---|---:|---:|---|\n';
for(const x of items)report+='| '+x.name+'.webp | '+x.nodeId+' | '+x.width+'×'+x.height+' | '+x.sourcePNGBytes+' | '+x.webpBytes+' | '+(x.alpha?'yes':'no')+' |\n';
await fs.writeFile('ASSET-REPORT.md',report);
console.log(report);
