import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
// Patch ONLY the TEST_PAGE HTML string of an exported, reviewed production Worker.
// No deployment, D1 mutation, secrets or other runtime routes are touched.
const [sourcePath,outputPath]=process.argv.slice(2);
if(!sourcePath||!outputPath||resolve(sourcePath)===resolve(outputPath))throw Error('Usage: node patch-main-miniapp-ui.mjs <reviewed-source.mjs> <output.mjs>');
const original=readFileSync(sourcePath,'utf8');
const css=readFileSync(new URL('./mobile-ui-refresh.css',import.meta.url),'utf8');
// Cloudflare returns a multipart bundle. Validate its exact three-module layout
// before modifying the preview module; reject any unknown/changed bundle.
if(original.startsWith('--')){
 const lineEnd=original.indexOf('\r\n');
 if(lineEnd<0)throw Error('Malformed multipart boundary');
 const boundary=original.slice(0,lineEnd);
 const parts=original.split(boundary).slice(1,-1);
 const modules=parts.map(part=>{
  const cut=part.indexOf('\r\n\r\n');
  if(cut<0)throw Error('Malformed multipart module');
  return {name:(part.slice(0,cut).match(/name="([^"]+)"/)||[])[1],body:part.slice(cut+4)};
 });
 if(modules.length!==3||modules.map(x=>x.name).sort().join(',')!=='entrypoint.mjs,legacy.mjs,preview.mjs')throw Error('Unexpected multipart modules');
 if(!modules.find(x=>x.name==='preview.mjs').body.includes('const TEST_PAGE='))throw Error('Missing preview module HTML');
 if(modules.some(x=>x.name!=='preview.mjs'&&x.body.includes('const TEST_PAGE=')))throw Error('Ambiguous HTML in non-preview module');
}
const pattern=/const TEST_PAGE=("(?:\\.|[^"\\])*");/g;
const matches=[...original.matchAll(pattern)];
if(matches.length!==1)throw Error('Fail closed: expected exactly one TEST_PAGE JSON string');
const html=JSON.parse(matches[0][1]);
if(!html.includes('<html')||!html.includes('</style>')||!html.includes('dir=\\"rtl\\"')&&!html.includes('dir="rtl"'))throw Error('Fail closed: unexpected RTL HTML');
if(html.includes('/* Candidatory mobile visual refresh'))throw Error('Already patched: refusing duplicate insertion');
const refreshed=html.replace('</style>',css+'\n</style>');
const replacement='const TEST_PAGE='+JSON.stringify(refreshed)+';';
const updated=original.replace(matches[0][0],replacement);
if(updated===original||updated.replace(replacement,matches[0][0])!==original)throw Error('Non-UI code changed');
if((updated.match(/const TEST_PAGE=/g)||[]).length!==1)throw Error('Unexpected TEST_PAGE count');
writeFileSync(outputPath,updated);
const hash=x=>createHash('sha256').update(x).digest('hex');
console.log(JSON.stringify({sourceSha256:hash(original),outputSha256:hash(updated),changedBytes:Buffer.byteLength(updated)-Buffer.byteLength(original),scope:'TEST_PAGE only',status:'review-required'}));
