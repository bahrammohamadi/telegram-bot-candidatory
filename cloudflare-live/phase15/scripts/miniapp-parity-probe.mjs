#!/usr/bin/env node
// Read-only, sanitized Mini App parity probe. Never sends Telegram credentials.
// Usage: node cloudflare-live/phase15/scripts/miniapp-parity-probe.mjs https://MAIN_URL https://INTEGRATION_URL
const [mainUrl, testUrl] = process.argv.slice(2);
if (!mainUrl || !testUrl) {
  console.error('Usage: node miniapp-parity-probe.mjs <main HTTPS URL> <integration HTTPS URL>');
  process.exit(2);
}
const paths = ['/api/tasks', '/api/progress', '/api/studio', '/api/admin-console'];
const normalize = (input) => {
  const url = new URL(input);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash)
    throw Error('Only credential-free HTTPS origins are accepted');
  return url.origin;
};
async function probe(origin, path) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(origin + path, {
      method: 'GET', redirect: 'manual', signal: controller.signal,
      headers: { Accept: 'application/json' }
    });
    // Do not read response body: it might contain user data.
    return { path, status: response.status, contentType: (response.headers.get('content-type') || '').split(';')[0] };
  } catch (error) {
    return { path, error: error.name === 'AbortError' ? 'timeout' : 'network_error' };
  } finally { clearTimeout(timeout); }
}
try {
  const origins = [normalize(mainUrl), normalize(testUrl)];
  if (origins[0] === origins[1]) throw Error('Origins must be different');
  const result = {};
  for (const [i, label] of ['main', 'integration'].entries()) {
    result[label] = [];
    for (const path of paths) result[label].push(await probe(origins[i], path));
  }
  const mismatches = paths.filter((_, i) =>
    result.main[i].status !== result.integration[i].status ||
    result.main[i].contentType !== result.integration[i].contentType);
  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), results: result, mismatches, note: 'Unauthenticated GET status parity only; not functional or signed Telegram parity' }, null, 2));
  if (mismatches.length) process.exitCode = 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 2;
}
