import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

// Execute only the actual navigation function with a synthetic DOM.
// No Telegram authentication, network requests, or Production data.
const source = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
const match = source.match(/^function switchTab\(name\)\{[^\n]+\}/m);
assert.ok(match, 'switchTab must exist in the shipped client code');

function fixture() {
  const buttons = ['home', 'tasks'].map(tab => ({
    dataset: { tab }, attributes: {},
    setAttribute(key, value) { this.attributes[key] = value; }
  }));
  const panels = ['home', 'tasks'].map(id => ({
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
      throw Error('Unexpected selector: ' + selector);
    },
    getElementById(id) { return panels.find(p => p.id === id) ?? null; }
  };
  const switchTab = runInNewContext(match[0] + ';switchTab', { document });
  return { buttons, panels, switchTab };
}

test('valid destination switches the active panel and ARIA state', () => {
  const { buttons, panels, switchTab } = fixture();
  switchTab('tasks');
  assert.deepEqual(panels.map(p => p.active), [false, true]);
  assert.deepEqual(buttons.map(b => b.attributes['aria-current']), ['false', 'page']);
});

test('unknown tab does not change active panel or ARIA state', () => {
  const { buttons, panels, switchTab } = fixture();
  switchTab('missing');
  assert.deepEqual(panels.map(p => p.active), [true, false]);
  assert.deepEqual(buttons.map(b => b.attributes), [{}, {}]);
});

test('missing destination panel cannot blank the current page', () => {
  const { buttons, panels, switchTab } = fixture();
  panels.splice(1, 1);
  switchTab('tasks');
  assert.equal(panels[0].active, true);
  assert.deepEqual(buttons.map(b => b.attributes), [{}, {}]);
});

test('destination must be an actual panel', () => {
  const { buttons, panels, switchTab } = fixture();
  panels[1].classList.contains = () => false;
  switchTab('tasks');
  assert.deepEqual(panels.map(p => p.active), [true, false]);
  assert.deepEqual(buttons.map(b => b.attributes), [{}, {}]);
});
