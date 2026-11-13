// Import with Node --import before synthetic runtime tests. Never deploy this module.
// Blocks all outbound HTTP(S), including requests from imported Worker code.
const forbidden = (url) => {
  throw new Error('OFFLINE_TEST_NETWORK_BLOCKED: ' + String(url).slice(0, 160));
};
globalThis.fetch = async (input) => forbidden(input?.url ?? input);
globalThis.WebSocket = class {
  constructor(url) { forbidden(url); }
};
// Prevent silent fallback to lower-level Node HTTP clients.
for (const name of ['node:http', 'node:https']) {
  const mod = await import(name);
  for (const method of ['request', 'get']) {
    // Built-in namespace properties are read-only; mutate the default export.
    mod.default[method] = (...args) => forbidden(args[0]);
  }
}
console.log('OFFLINE_TEST_NETWORK_GUARD_ACTIVE');
