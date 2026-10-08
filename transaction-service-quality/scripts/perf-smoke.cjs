// Dependency-free workload smoke when k6 is unavailable. Not a substitute for a k6/SLO run.
const { spawn } = require('node:child_process');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const port = 4012, base = `http://127.0.0.1:${port}`;
const mock = spawn(process.execPath, [path.join(__dirname, 'mock-server.cjs')], { env: { ...process.env, MOCK_PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'] });
let accountId;
async function call(route, options = {}) {
  const response = await fetch(`${base}${route}`, options);
  const body = await response.json();
  return { status: response.status, body };
}
(async () => {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Mock startup timed out')), 10_000);
    mock.once('error', error => { clearTimeout(timer); reject(error); });
    mock.once('exit', code => { clearTimeout(timer); reject(new Error(`Mock exited: ${code}`)); });
    mock.stdout.once('data', () => { clearTimeout(timer); resolve(); });
    mock.stderr.on('data', chunk => process.stderr.write(chunk));
  });
  const document = crypto.randomBytes(14).reduce((s, n) => s + n % 10, '');
  const account = await call('/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ document_number: document }) });
  assert.equal(account.status, 201); accountId = account.body.account_id;
  const payload = JSON.stringify({ account_id: accountId, amount: 10.99, operation_type_id: 1 });
  const times = [];
  for (let i = 0; i < 50; i++) {
    const start = performance.now();
    const result = await call('/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: payload });
    times.push(performance.now() - start); assert.equal(result.status, 201); assert.equal(result.body.amount, -10.99);
  }
  const key = crypto.randomUUID();
  const responses = await Promise.all(Array.from({ length: 20 }, () => call('/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key }, body: payload })));
  for (const response of responses) assert.equal(response.status, 201);
  assert.equal(new Set(responses.map(response => response.body.transaction_id)).size, 1);
  const observed = await call(`/__qa/transactions?account_id=${accountId}&idempotency_key=${key}`);
  assert.equal(observed.status, 200); assert.equal(observed.body.count, 1);
  times.sort((a, b) => a - b);
  console.log(JSON.stringify({ evidence: 'Synthetic mock workload smoke only; no service SLO conclusion', requests: 50, concurrentReplays: 20, count: 1, harnessP95Ms: times[Math.ceil(times.length * .95) - 1] }));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  try { if (accountId) await call(`/__qa/accounts/${accountId}`, { method: 'DELETE' }); }
  finally { mock.kill(); }
});
