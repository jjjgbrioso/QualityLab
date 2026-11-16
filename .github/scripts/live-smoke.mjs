// Read-only smoke test of the live site, run after each production deploy.
// It signs in once as the public seed customer (Alice), reads a few pages and endpoints, and signs out.
// Nothing is created, changed or deleted.
//
//   node .github/scripts/live-smoke.mjs                    (BASE_URL defaults to the live site)
//   TEST_PASSWORD=... node .github/scripts/live-smoke.mjs  (otherwise read from web-app/scripts/seed-data.ts)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const BASE_URL = (process.env.BASE_URL || 'https://quality-lab-jb.vercel.app').replace(/\/+$/, '');
const API = `${BASE_URL}/api/v1`;
const EMAIL = process.env.TEST_USERNAME || 'alice@qualitylab.test';

function seedCustomerPassword() {
  const seed = readFileSync(fileURLToPath(new URL('../../web-app/scripts/seed-data.ts', import.meta.url)), 'utf8');
  const match = seed.match(/CUSTOMER_PASSWORD\s*=\s*"([^"]+)"/);
  if (!match) throw new Error('CUSTOMER_PASSWORD not found in seed-data.ts');
  return match[1];
}

const results = [];
async function check(name, fn) {
  const started = Date.now();
  try {
    const detail = await fn();
    results.push({ name, ok: true, ms: Date.now() - started, detail });
  } catch (error) {
    results.push({ name, ok: false, ms: Date.now() - started, detail: error.message });
  }
}

async function get(path, token) {
  const response = await fetch(path.startsWith('http') ? path : `${API}${path}`, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
    redirect: 'manual',
    signal: AbortSignal.timeout(20_000),
  });
  return response;
}

async function json(response, expectedStatus = 200) {
  if (response.status !== expectedStatus) throw new Error(`status ${response.status}, expected ${expectedStatus}`);
  return response.json();
}

const password = process.env.TEST_PASSWORD || seedCustomerPassword();
let token;

await check('Health: app and database are up', async () => {
  const body = await json(await get('/health'));
  if (body.data?.status !== 'ok') throw new Error(`status is ${body.data?.status}`);
  if (body.data?.database?.status !== 'up') throw new Error(`database is ${body.data?.database?.status}`);
  return `environment ${body.data.environment}, database ${body.data.database.latencyMs} ms`;
});

await check('Home page loads', async () => {
  const response = await get(`${BASE_URL}/`);
  if (response.status !== 200) throw new Error(`status ${response.status}`);
  if (!(await response.text()).includes('QualityLab')) throw new Error('page does not mention QualityLab');
  return 'status 200';
});

await check('Sign-in page loads', async () => {
  const response = await get(`${BASE_URL}/login`);
  if (response.status !== 200) throw new Error(`status ${response.status}`);
  return 'status 200';
});

await check('Product catalogue API returns products', async () => {
  const body = await json(await get('/products?pageSize=1'));
  if (!Array.isArray(body.data) || body.data.length !== 1) throw new Error('no product returned');
  return `first product ${body.data[0].id}`;
});

await check('Hotel search API returns hotels', async () => {
  const body = await json(await get('/hotels?pageSize=1'));
  if (!Array.isArray(body.data) || body.data.length !== 1) throw new Error('no hotel returned');
  return `first hotel ${body.data[0].id}`;
});

await check('Test customer can sign in to E-commerce', async () => {
  const response = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password, module: 'ecommerce' }),
    signal: AbortSignal.timeout(20_000),
  });
  const body = await json(response);
  token = body.data?.token ?? body.data?.accessToken ?? body.token;
  if (!token) throw new Error('no token in the response');
  return 'signed in';
});

await check('Signed-in customer can read the cart and orders', async () => {
  if (!token) throw new Error('skipped: sign-in failed');
  await json(await get('/cart', token));
  const orders = await json(await get('/orders', token));
  return `${Array.isArray(orders.data) ? orders.data.length : '?'} orders listed`;
});

await check('Customer signs out', async () => {
  if (!token) throw new Error('skipped: sign-in failed');
  const response = await fetch(`${API}/auth/logout`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`status ${response.status}`);
  return `status ${response.status}`;
});

const failed = results.filter((r) => !r.ok);
const lines = [`## Live smoke test: ${failed.length ? 'FAILED' : 'passed'}`, '', `Target: ${BASE_URL}`, '', '| Check | Result | Time | Detail |', '| --- | --- | ---: | --- |'];
for (const r of results) lines.push(`| ${r.name} | ${r.ok ? 'pass' : '**FAIL**'} | ${r.ms} ms | ${String(r.detail).replace(/\|/g, '/')} |`);
const report = lines.join('\n');
console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFileSync } = await import('node:fs');
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`);
}
process.exitCode = failed.length ? 1 : 0;
