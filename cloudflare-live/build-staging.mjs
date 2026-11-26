import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {compose} from './phase2/compose.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const base=read('./staging-worker.js'),manifest=JSON.parse(read('./environment-manifest.json'));
if(createHash('sha256').update(base).digest('hex')!==manifest.staging.sha256)throw Error('Baseline changed');
const output=compose(base,read('./phase2/navigation.js'),read('./phase2/navigation.css'));
mkdirSync(new URL('./dist/',import.meta.url),{recursive:true});writeFileSync(new URL('./dist/staging-worker.mjs',import.meta.url),output);
console.log(JSON.stringify({sha256:createHash('sha256').update(output).digest('hex'),length:output.length}));
