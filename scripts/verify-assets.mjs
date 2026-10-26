import fs from 'node:fs/promises';
import path from 'node:path';
const html=await fs.readFile('index.html','utf8'),css=await fs.readFile('styles.css','utf8');
const urls=[...html.matchAll(/assets\/([\w.-]+\.(?:png|jpe?g|webp|svg))/g),...css.matchAll(/assets\/([\w.-]+\.(?:png|jpe?g|webp|svg))/g)].map(m=>m[1]);
const missing=[];
for(const name of new Set(urls)){
  try{const info=await fs.stat(path.join('assets',name));if(info.size<15)missing.push(name+': empty');}
  catch{missing.push(name+': missing');}
}
if(missing.length){console.error('Missing assets:\n'+missing.join('\n'));process.exit(1);}
console.log('Verified '+new Set(urls).size+' referenced local graphics.');
