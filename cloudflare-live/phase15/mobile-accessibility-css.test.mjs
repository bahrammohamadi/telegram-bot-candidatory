import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
const css=readFileSync(new URL('./mobile-ui-refresh.css',import.meta.url),'utf8');
test('small-screen and zoom affordances remain available',()=>{
 for(const required of ['@media(max-width:320px)','@media(max-width:400px)','overflow-wrap:anywhere','font-size:max(1rem,16px)','touch-action:manipulation']){
  assert.ok(css.includes(required), 'missing accessibility rule: '+required);
 }
});
test('keyboard focus and high-contrast mode remain available',()=>{
 assert.match(css,/:focus-visible\s*\{/);
 assert.match(css,/@media\(forced-colors:active\)/);
});
test('reduced-motion preferences disable active transforms',()=>{
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{button:active:not\(:disabled\)\{transform:none\}\}/);
});
