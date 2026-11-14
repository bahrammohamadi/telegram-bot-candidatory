// Construct a reversible opt-in review route. Never replace production APIs or data.
// GitHub canonical production snapshot is checked against Cloudflare SHA-256 before deployment.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const here=new URL('./',import.meta.url);
const read=p=>readFileSync(new URL(p,here),'utf8');
execFileSync(process.execPath,[new URL('../reconstruct.mjs',here).pathname],{stdio:'pipe'});
const prod=read('../worker.js');
const sha=createHash('sha256').update(prod).digest('hex');
if(sha!=='79d3c4780bb58637b7c9a9202ca19da1ff50e12608c486378cf187ebe3acd543'||prod.length!==300672)
 throw Error('Historical production snapshot changed; deployment forbidden');
let preview=read('./preview-worker-snapshot-2026-11-08.mjs');
if(preview.length!==147178||!preview.endsWith('}};\n')||!preview.includes('url.pathname==="/api/tasks"'))
 throw Error('Test preview source mismatch');
const m=preview.match(/^const TEST_PAGE=("(?:\\.|[^"\\])*");\n/);
if(!m)throw Error('Preview does not have embedded TEST_PAGE');
let html=JSON.parse(m[1]);
const apiCount=(html.match(/fetch\('\/api\//g)||[]).length;
if(apiCount<12||!html.includes('<body><main>')||!html.includes('</style>'))
 throw Error('Preview HTML URL markers changed');
html=html.replaceAll("fetch('/api/","fetch('/review/api/");
const banner='<section class="main-review-notice" role="note"><strong>نسخه جدید در حالت بازبینی</strong><p>این بخش به دیتابیس آزمایشی متصل است؛ اطلاعات نسخه اصلی تغییر نمی‌کند. پرداخت واقعی و مدل هوش مصنوعی فعال نیستند.</p><a href="/">بازگشت به نسخه اصلی</a></section>';
html=html.replace('<body><main>','<body><main>'+banner);
html=html.replace('<title>آزمایش پرونده کاندیداتوری</title>','<title>پیش‌نمایش امکانات جدید | کاندیداتوری</title>');
html=html.replace('<h1>پرونده آزمایشی کاندیداتوری</h1>','<h1>پیش‌نمایش امکانات جدید کاندیداتوری</h1>');
html=html.replaceAll('ربات آزمایشی تلگرام','ربات اصلی تلگرام');
html=html.replace('</style>',".main-review-notice{border:2px solid #0b8069;border-radius:13px;padding:12px 14px;margin:0 0 15px;background:var(--tg-theme-secondary-bg-color,#e6f5f0);color:var(--tg-theme-text-color,#183b31)}.main-review-notice strong{font-size:17px}.main-review-notice p{margin:9px 0;line-height:1.7}.main-review-notice a{font-weight:700;color:#067361;text-decoration:underline}.main-review-notice a:focus-visible{outline:3px solid #0b8069}</style>");
preview=preview.replace(m[0],'const TEST_PAGE='+JSON.stringify(html)+';\n');
const actualCount=(html.match(/fetch\('\/review\/api\//g)||[]).length;
if(actualCount!==apiCount)throw Error('Not every preview API was rewritten');
const output=new URL('./dist/',here);mkdirSync(output,{recursive:true});
writeFileSync(new URL('./legacy.mjs',output),prod);
writeFileSync(new URL('./preview.mjs',output),preview);
writeFileSync(new URL('./entrypoint.mjs',output),read('./entrypoint.mjs'));
console.log(JSON.stringify({ok:true,productionBytes:prod.length,originalSha256:sha,previewBytes:preview.length,rewrittenApiCalls:actualCount,rootLegacyUntouched:true,aiDisabled:true}));
