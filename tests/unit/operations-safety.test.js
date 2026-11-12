const test = require('node:test');
const assert = require('node:assert/strict');
const { mainMenuKB } = require('../../src/utils/keyboard');
const { handleOperationsCallback } = require('../../src/flows/operations');

test('experimental menu is opt-in and old navigation stays available', () => {
  delete process.env.ENABLE_EXPERIMENTAL_OPERATIONS;
  const disabled = JSON.stringify(mainMenuKB({ userId: '1' }));
  assert.doesNotMatch(disabled, /ops:today/);
  assert.match(disabled, /start_consultation/);
  process.env.ENABLE_EXPERIMENTAL_OPERATIONS = 'true';
  assert.match(JSON.stringify(mainMenuKB({ userId: '1' })), /ops:today/);
  delete process.env.ENABLE_EXPERIMENTAL_OPERATIONS;
});

test('stale privacy callbacks cannot trigger destructive or incomplete actions', async () => {
  for (const action of ['export', 'delete_confirm', 'delete_yes', 'ai_approve:123']) {
    let answer;
    const ctx = { callbackQuery: { data: `ops:${action}` }, answerCallbackQuery: async v => { answer = v; } };
    assert.equal(await handleOperationsCallback(ctx), true);
    assert.equal(answer.show_alert, true);
  }
});
