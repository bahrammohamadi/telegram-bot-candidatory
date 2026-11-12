const test = require('node:test');
const assert = require('node:assert/strict');

// Stub Appwrite itself, not production data or a live database.
const sdkPath = require.resolve('node-appwrite');
const original = require(sdkPath);
const documents = new Map();
class Client { setEndpoint() { return this; } setProject() { return this; } setKey() { return this; } }
class Databases {
  async createDocument(db, col, id, data) {
    if (documents.has(id)) throw Object.assign(new Error('duplicate'), { code: 409 });
    const doc = { ...data, $id: id }; documents.set(id, doc); return doc;
  }
  async getDocument(db, col, id) { return documents.get(id); }
}
require.cache[sdkPath].exports = { ...original, Client, Databases };
process.env.APPWRITE_PROJECT_ID = 'test';
process.env.APPWRITE_API_KEY = 'test';
process.env.DATABASE_ID = 'test';
const { createTask } = require('../../src/utils/db');
require.cache[sdkPath].exports = original;

test('same request key deduplicates concurrently, different requests remain distinct', async () => {
  const [a, b] = await Promise.all([
    createTask('user', { title: 'Test task', idempotencyKey: 'request-1' }),
    createTask('user', { title: 'Test task', idempotencyKey: 'request-1' }),
  ]);
  assert.equal(a.task.$id, b.task.$id);
  assert.equal([a, b].filter(x => x.deduplicated).length, 1);
  const c = await createTask('user', { title: 'Test task', idempotencyKey: 'request-2' });
  const d = await createTask('other', { title: 'Test task', idempotencyKey: 'request-1' });
  assert.notEqual(a.task.$id, c.task.$id);
  assert.notEqual(a.task.$id, d.task.$id);
});
