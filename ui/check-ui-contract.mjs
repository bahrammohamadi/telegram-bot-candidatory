// UI smoke contract for the existing production dashboard (offline; no Telegram/D1 calls).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const ui = readFileSync(new URL('./candidatory-five-tabs-v1.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('./candidatory-light-rtl-v1.css', import.meta.url), 'utf8');
for (const tab of ['امروز','مسیر من','کارها','یادگیری','حساب']) assert(ui.includes(tab), 'Missing tab '+tab);
for (const target of ['گزارش عملکرد','برنامه و پیگیری وظایف','تمرین و آمادگی','پرونده من']) assert(ui.includes(target), 'Missing live dashboard module '+target);
assert(ui.includes('moduleButton.click()'), 'Navigation must reuse existing module handlers');
assert(!/fetch\s*\(|\.post\s*\(|\.submit\s*\(/.test(ui), 'UI navigation must not write to backend');
assert(css.includes('safe-area-inset-bottom'), 'Missing Telegram safe-area handling');
assert(css.includes('focus-visible'), 'Missing keyboard focus styling');
console.log('PASS: five-tab offline UI contract');
