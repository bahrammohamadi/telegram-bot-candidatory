import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Source-only regression for the existing miniapp, not evidence of live Worker parity.
const source = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
const match = source.match(/function switchTab\(name\)\{[^\n]*\}/);
assert.ok(match, 'switchTab function must remain discoverable');

function fixture() {
  const tabs = ['home', 'tasks', 'academy'].map(name => ({
    dataset: { tab: name },
    attrs: {},
    setAttribute(k, v) { this.attrs[k] = v; },
  }));
  const panels = tabs.map(tab => ({ id: tab.dataset.tab, classList: {
    active: false,
    toggle(_name, active) { this.active = active; },
  } }));
  const document = { querySelectorAll(selector) {
    return selector === '.tabs button' ? tabs : panels;
  } };
  vm.runInNewContext(match[0] + '; switchTab("tasks");', { document });
  return { tabs, panels, document };
}

test('switching selects exactly one matching tab and panel', () => {
  const { tabs, panels } = fixture();
  assert.deepEqual(tabs.map(t => t.attrs['aria-current']), ['false', 'page', 'false']);
  assert.deepEqual(panels.map(p => p.classList.active), [false, true, false]);
});

test('unknown tab never clears an existing selected panel', () => {
  const { tabs, panels, document } = fixture();
  vm.runInNewContext(match[0] + '; switchTab("nonexistent");', { document });
  assert.equal(tabs.filter(t => t.attrs['aria-current'] === 'page').length, 1);
  assert.equal(panels.filter(p => p.classList.active).length, 1);
});
