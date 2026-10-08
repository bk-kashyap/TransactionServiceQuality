import http from 'k6/http';
import { check, fail } from 'k6';
import { Counter } from 'k6/metrics';
const baseURL = __ENV.BASE_URL || 'http://127.0.0.1:4011';
const target = Number(__ENV.TARGET_TPS || 10);
const concurrency = Number(__ENV.IDEMPOTENCY_CONCURRENCY || 5);
const preallocated = Number(__ENV.PREALLOCATED_VUS || 20);
const maxVUs = Number(__ENV.MAX_VUS || 100);
const mode = __ENV.TEST_ENV || 'mock';
const queryPath = __ENV.TRANSACTION_QUERY_PATH || (mode === 'mock' ? '/__qa/transactions' : '');
if (!Number.isInteger(target) || target < 1 || !Number.isInteger(concurrency) || concurrency < 2 || concurrency > 100) throw new Error('Invalid rate/concurrency');
if (!['mock', 'staging'].includes(mode)) throw new Error('TEST_ENV must be mock or staging for this workload');
if (!Number.isInteger(preallocated) || preallocated < 1 || !Number.isInteger(maxVUs) || maxVUs < preallocated) throw new Error('Invalid VU allocation');
if (mode !== 'mock' && __ENV.APPROVED_POLICY !== 'qa-reference-v1') throw new Error('Explicit approved reference-policy agreement required outside the synthetic mock');
if (!queryPath) throw new Error('BLOCKED: authoritative count query required for idempotency scenario');
const duplicates = new Counter('duplicate_response_ids');
const countFailures = new Counter('transaction_count_failures');
export const options = {
  scenarios: {
    transactions: { executor: 'constant-arrival-rate', exec: 'transaction', rate: target, timeUnit: '1s',
      duration: __ENV.DURATION || '10s', preAllocatedVUs: preallocated, maxVUs },
    idempotency: { executor: 'shared-iterations', exec: 'idempotency', vus: 2,
      iterations: Number(__ENV.IDEMPOTENCY_ITERATIONS || 10), maxDuration: '1m' },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'], checks: ['rate==1'],
    'http_req_duration{scenario:transactions}': ['p(95)<500', 'p(99)<1000'],
    duplicate_response_ids: ['count==0'], transaction_count_failures: ['count==0'], dropped_iterations: ['count==0'],
  },
};
function headers(key) {
  return { 'Content-Type': 'application/json', ...(key ? { 'Idempotency-Key': key } : {}),
    ...(__ENV.API_TOKEN ? { Authorization: `Bearer ${__ENV.API_TOKEN}` } : {}) };
}
export function setup() {
  const runId = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  let accountId = Number(__ENV.ACCOUNT_ID);
  let created = false;
  if (!Number.isSafeInteger(accountId) || accountId < 1) {
    const document = `${Date.now()}${Math.floor(Math.random() * 10)}`;
    const response = http.post(`${baseURL}/accounts`, JSON.stringify({ document_number: document }), { headers: headers() });
    if (response.status !== 201) fail(`Account setup failed: ${response.status}`);
    accountId = response.json('account_id'); created = true;
  }
  if (!Number.isSafeInteger(accountId) || accountId < 1) fail('No usable account ID');
  duplicates.add(0); countFailures.add(0);
  console.log(mode === 'mock' ? 'SYNTHETIC MOCK: measures script/harness, not service SLOs or financial correctness.' : 'Staging run: source and consistency of count adapter must be agreed.');
  return { accountId, runId, created };
}
function payload(data, operation = Number(__ENV.OPERATION_TYPE_ID || 1)) {
  return { account_id: data.accountId, amount: Number(__ENV.AMOUNT || 10.99), operation_type_id: operation };
}
export function transaction(data) {
  const body = payload(data);
  const response = http.post(`${baseURL}/transactions`, JSON.stringify(body), {
    headers: headers(`${data.runId}-${__VU}-${__ITER}`), tags: { endpoint: 'POST /transactions' },
  });
  const result = response.status === 201 ? response.json() : {};
  check(response, {
    'created': r => r.status === 201,
    'account and operation preserved': () => result.account_id === body.account_id && result.operation_type_id === body.operation_type_id,
    'caller-unit amount preserved': () => result.amount === (body.operation_type_id === 4 ? body.amount : -body.amount),
    'type preserved': () => result.type === (body.operation_type_id === 4 ? 'credit' : 'debit'),
  });
}
export function idempotency(data) {
  const key = `${data.runId}-replay-${__VU}-${__ITER}`;
  const body = payload(data, 1);
  const responses = http.batch(Array.from({ length: concurrency }, () => ({
    method: 'POST', url: `${baseURL}/transactions`, body: JSON.stringify(body), params: { headers: headers(key) },
  })));
  const results = responses.map(response => {
    check(response, { 'every replay succeeds': r => r.status === 201 });
    return response.status === 201 ? response.json() : {};
  });
  const ids = new Set(results.map(result => result.transaction_id));
  if (ids.size !== 1 || results.some(result => !Number.isInteger(result.transaction_id))) duplicates.add(1);
  const observed = http.get(`${baseURL}${queryPath}?account_id=${data.accountId}&idempotency_key=${encodeURIComponent(key)}`, { headers: headers() });
  const state = observed.status === 200 ? observed.json() : {};
  const valid = state.count === 1 && Array.isArray(state.transactions) && state.transactions.length === 1
    && state.transactions[0].transaction_id === results[0].transaction_id
    && state.transactions[0].amount === -body.amount && state.transactions[0].account_id === body.account_id;
  check(observed, { 'exactly one authoritative record': () => valid });
  if (!valid) countFailures.add(1);
}
export function teardown(data) {
  if (mode === 'mock' && data.created) {
    const response = http.del(`${baseURL}/__qa/accounts/${data.accountId}`, null, { headers: headers() });
    if (response.status !== 200) fail('Mock cleanup failed');
  } else if (data.created) console.log(`Retained staging test account ${data.accountId}; use the agreed retention job.`);
}
