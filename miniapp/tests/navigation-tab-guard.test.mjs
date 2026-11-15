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
  const document = { getElementById(id) { return panels.find(p => p.id === id) || null; }, querySelectorAll(selector) {
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


test('tab button without its panel cannot blank the current view', () => {
  const { tabs, panels, document } = fixture();
  tabs.push({ dataset: { tab: 'missing-panel' }, attrs: {}, setAttribute(k,v) { this.attrs[k] = v; } });
  const before = panels.map(p => p.classList.active);
  vm.runInNewContext(match[0] + '; switchTab("missing-panel");', { document });
  assert.deepEqual(panels.map(p => p.classList.active), before);
  assert.equal(tabs.filter(t => t.attrs['aria-current'] === 'page').length, 1);
});

test('panel without a navigation button cannot hijack the selected view', () => {
  const { tabs, panels, document } = fixture();
  panels.push({ id: 'orphan-panel', classList: { active: false, toggle(_name, active) { this.active = active; } } });
  vm.runInNewContext(match[0] + '; switchTab("orphan-panel");', { document });
  assert.deepEqual(tabs.map(t => t.attrs['aria-current']), ['false','page','false']);
  assert.equal(panels.find(p => p.id === 'orphan-panel').classList.active, false);
});
