// Reproducibly compose the *existing production news Worker* with an isolated
// one-shot manual notice queue. Preserves all scheduled news publishing functions.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
let source=read('./manual-publish-prechange-2026-11-03.mjs');
if(source.length!==40744||!source.includes('async scheduled(event,env,ctx)')||
 !source.includes('runSpecialContent(env,event.scheduledTime)')||
 !source.includes("u.pathname==='/test-publish'"))throw Error('Unexpected news Worker baseline; stop');
if(source.includes('runManualPublishOutbox(env)'))throw Error('Already integrated');
const before='runSpecialContent(env,event.scheduledTime)]))}};';
const after='runSpecialContent(env,event.scheduledTime),runManualPublishOutbox(env)]))}};';
if(source.split(before).length!==2)throw Error('Scheduled handler anchor changed; stop');
source=source.replace(before,after);
const handler=read('./manual-outbox-handler.mjs');
if(!handler.includes("status='queued' AND attempts=0")||!handler.includes('runManualPublishOutbox'))throw Error('Handler missing at-most-once claim');
source+='\n'+handler;
const dir=new URL('./dist/',import.meta.url);mkdirSync(dir,{recursive:true});
writeFileSync(new URL('./dist/news-worker-manual-outbox.mjs',import.meta.url),source);
writeFileSync(new URL('./dist/manual-handler-test.mjs',import.meta.url),handler+'\nexport {runManualPublishOutbox};\n');
console.log('PASS: news Worker composition, cron/news functions intact, single manual outbox callback added');
