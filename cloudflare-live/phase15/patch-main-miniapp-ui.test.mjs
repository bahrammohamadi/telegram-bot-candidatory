import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const dir=mkdtempSync(join(tmpdir(),'candidatory-ui-'));
const script=new URL('./patch-main-miniapp-ui.mjs',import.meta.url).pathname;
try{
 const input=join(dir,'main.mjs'),output=join(dir,'out.mjs');
 const html='<!doctype html><html lang="fa" dir="rtl"><head><style>body{color:black}</style></head><body><main><h1>کاندیداتوری</h1></main></body></html>';
 const original='const TEST_PAGE='+JSON.stringify(html)+';\nexport default {fetch(){return new Response(TEST_PAGE)}};\n';
 writeFileSync(input,original);
 const result=spawnSync(process.execPath,[script,input,output],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
 const modified=readFileSync(output,'utf8');
 assert.match(modified,/Candidatory mobile visual refresh/);
 assert.equal(modified.slice(modified.indexOf('export default')),original.slice(original.indexOf('export default')),'Non-UI code must be byte-for-byte preserved');
 assert.equal(spawnSync(process.execPath,[script,output,join(dir,'again.mjs')]).status,1,'No double injection');
 writeFileSync(input,'const TEST_PAGE="invalid";');
 assert.equal(spawnSync(process.execPath,[script,input,output]).status,1,'Unexpected HTML must fail closed');
 console.log('PASS: main miniapp CSS-only patch, no API changes, duplicate and malformed inputs rejected');
}finally{rmSync(dir,{recursive:true,force:true})}
