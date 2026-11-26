import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

// Offline contract: execute the actual shipped switchTab, never a mock implementation.
// No network, Telegram initData, D1, authentication, or Production writes.
const source = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
const match = source.match(/^function switchTab\(name\)\{[^\n]+\}/m);
assert.ok(match, 'Shipped switchTab function must be present');
const names = ['home', 'journey', 'tasks', 'academy', 'account'];

function setup() {
  const buttons = names.map(tab => ({
    dataset: { tab }, attrs: {},
    setAttribute(k, v) { this.attrs[k] = v; }
  }));
  const panels = names.map(id => ({
    id, active: id === 'home',
    classList: {
      contains(token) { return token === 'panel'; },
      toggle(token, enabled) {
        assert.equal(token, 'active');
        panels.find(p => p.id === id).active = enabled;
      }
    }
  }));
  const document = {
    querySelectorAll(selector) {
      if (selector === '.tabs button') return buttons;
      if (selector === '.panel') return panels;
      throw new Error('Unexpected selector: ' + selector);
    },
    getElementById(id) { return panels.find(p => p.id === id) ?? null; }
  };
  return { buttons, panels, switchTab: runInNewContext(match[0] + ';switchTab', { document }) };
}

test('every ordered pair of the five tabs preserves exactly one panel and matching ARIA state', () => {
  for (const from of names) for (const to of names) {
    const { buttons, panels, switchTab } = setup();
    switchTab(from);
    switchTab(to);
    assert.deepEqual(panels.filter(p => p.active).map(p => p.id), [to], from + ' -> ' + to);
    assert.deepEqual(buttons.filter(b => b.attrs['aria-current'] === 'page').map(b => b.dataset.tab), [to]);
    assert.equal(buttons.filter(b => b.attrs['aria-current'] === 'false').length, 4);
  }
});

test('unrecognized destination after a valid transition preserves current state', () => {
  const { buttons, panels, switchTab } = setup();
  switchTab('academy');
  const before = buttons.map(b => b.attrs['aria-current']);
  for (const invalid of ['missing', '__proto__', 'constructor', '', 'ACADEMY']) {
    switchTab(invalid);
    assert.deepEqual(panels.filter(p => p.active).map(p => p.id), ['academy']);
    assert.deepEqual(buttons.map(b => b.attrs['aria-current']), before);
  }
});
