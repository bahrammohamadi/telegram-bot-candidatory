import {readdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
const dir=join(root,'snapshot-parts');
const parts=readdirSync(dir).filter(x=>/^part-\d{3}\.txt$/.test(x)).sort();
if(parts.length!==31)throw new Error('Expected 31 chunks; got '+parts.length);
const source=parts.map((p,i)=>{
 if(p!==('part-'+String(i).padStart(3,'0')+'.txt'))throw new Error('Missing chunk '+i);
 const chunk=readFileSync(join(dir,p),'utf8');
 if(chunk.length!==(i===30?672:10000))throw new Error('Invalid chunk length at '+i);
 return chunk;
}).join('');
if(source.length!==300672||!source.startsWith('// Candidatory')||!source.endsWith('};'))throw new Error('Invalid live Worker snapshot');
const sha256=createHash('sha256').update(source,'utf8').digest('hex');
writeFileSync(join(root,'worker.js'),source);
console.log('Reconstructed',parts.length,'segments, length=',source.length,'sha256=',sha256);
