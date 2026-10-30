import fs from 'node:fs/promises';
import sharp from 'sharp';

const token=process.env.FIGMA_TOKEN;
if(!token)throw new Error('Missing FIGMA_TOKEN secret');
const key='zG9GLaQaUXOhPeZC9VOBmx';
const ids=['4315:62168','4383:41189','4315:62292','4315:62230'];
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function get(url,headers={}){
 for(let attempt=0;attempt<6;attempt++){
  const res=await fetch(url,{headers});
  if(res.status===429||res.status>=500){
   if(attempt===5)throw Error('Figma image API failed '+res.status);
   const retry=Number(res.headers.get('retry-after'));
   await sleep(Number.isFinite(retry)&&retry>0?retry*1000:Math.min(5000*2**attempt,90000));
   continue;
  }
  if(!res.ok)throw Error('Figma export failed '+res.status+' '+(await res.text()).slice(0,200));
  return res;
 }
}
const url='https://api.figma.com/v1/images/'+key+'?ids='+encodeURIComponent(ids.join(','))+'&format=png&scale=1';
const data=await(await get(url,{'X-Figma-Token':token})).json();
if(data.err)throw Error('Figma export error '+data.err);
let html=await fs.readFile('index.html','utf8');
let mapping=await fs.readFile('FIGMA-BLOCK-MAP.md','utf8');
for(let i=0;i<ids.length;i++){
 const src=data.images?.[ids[i]];
 if(!src)throw Error('Missing Figma render '+ids[i]);
 const input=Buffer.from(await(await get(src)).arrayBuffer());
 const meta=await sharp(input).metadata();
 if(meta.width!==1228||!meta.height||meta.height<500)throw Error('Unexpected dimensions for '+ids[i]+': '+meta.width+'x'+meta.height);
 const name='modular-slide-'+String(i+1).padStart(2,'0');
 const output=await sharp(input).webp({quality:84,effort:6,alphaQuality:100}).toBuffer();
 await fs.writeFile('assets/'+name+'.webp',output);
 const oldPath='assets/'+name+'.png',newPath='assets/'+name+'.webp';
 if(!html.includes(oldPath)||!mapping.includes(oldPath))throw Error('Missing image reference '+oldPath);
 html=html.replaceAll(oldPath,newPath);
 mapping=mapping.replaceAll(oldPath,newPath);
 await fs.unlink(oldPath);
 console.log(name,ids[i],meta.width,meta.height,input.length,output.length);
}
await fs.writeFile('index.html',html);
await fs.writeFile('FIGMA-BLOCK-MAP.md',mapping);
