#!/usr/bin/env node
// Read-only audit: a passing isolated integration build is NOT proof of main Mini App parity.
import {readFileSync} from 'node:fs';
const base=readFileSync(new URL('../phase14/integration-deployed-snapshot-2026-11-03.mjs',import.meta.url),'utf8');
const builder=readFileSync(new URL('./build-progress-tasks.mjs',import.meta.url),'utf8');
const extract=s=>{const m=s.match(/^const TEST_PAGE=("(?:\\\\.|[^"\\\\])*");/m);if(!m)throw Error('missing single embedded Mini App page');return JSON.parse(m[1]);};
const page=extract(base);
const routes=['/api/tasks','/api/progress','/api/assistant','/api/admin-console'];
const missing=routes.filter(r=>!base.includes(r));
if(missing.length)throw Error('Integration snapshot missing routes: '+missing.join(','));
if(!page.includes('id=\\"tasks')||!page.includes('id=\\"progress'))throw Error('Task and progress UI must be in one embedded page');
if(!builder.includes('const TEST_PAGE=')||!builder.includes('progressCard('))throw Error('Phase15 builder must patch the same embedded Mini App');
if(!page.includes('پرونده آزمایشی کاندیداتوری'))throw Error('Integration page changed: re-audit before promotion');
console.log('PASS: isolated snapshot retains task/progress UI and API routes in a single page');
console.log('BLOCKED: this is explicitly an isolated TEST page, not verified production Mini App parity');
console.log('NO-GO for production until main Mini App source, navigation, existing user data and signed two-account WebView are independently compared');
