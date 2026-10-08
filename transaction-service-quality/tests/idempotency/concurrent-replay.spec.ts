import { randomUUID } from 'node:crypto';
import { test, expect } from '../../src/fixtures/api.fixture';
import { environment } from '../../src/config/environment';
import { oracle, persistedTransactions } from '../../src/assertions/oracle';
import { assertReplayResponses } from '../../src/assertions/replay';
const concurrency = Number(process.env.IDEMPOTENCY_CONCURRENCY ?? 20);
if (!Number.isInteger(concurrency) || concurrency < 2 || concurrency > 100) throw new Error('IDEMPOTENCY_CONCURRENCY must be 2..100');

test('T1-COUNT concurrent same key exactly one stored record @behavior @nightly @release', async ({ request, account }, info) => {
  oracle(info, 'T1-COUNT', 'HEARSAY', 'R-01', 'Concurrent replay creates multiple financial records', 'Nightly/Pre-release');
  test.skip(!environment.transactionQueryPath, 'BLOCKED: supplied API cannot count stored transactions; configure an agreed authoritative query adapter');
  const key = randomUUID();
  const payload = { account_id: account.account_id, amount: 50, operation_type_id: 1 };
  expect((await persistedTransactions(request, account.account_id, key)).count).toBe(0);
  const responses = await Promise.all(Array.from({ length: concurrency }, () => request.post('/transactions', {
    headers: { 'Idempotency-Key': key }, data: payload,
  })));
  const returned = await assertReplayResponses(responses, payload);
  const observed = await persistedTransactions(request, account.account_id, key);
  expect(observed.count).toBe(1);
  expect(observed.transactions[0].transaction_id).toBe(returned.transaction_id);
  expect(observed.transactions[0].amount).toBe(-50);
  await info.attach('count-evidence', { body: JSON.stringify({ environment: environment.mode, concurrency, observed,
    meaning: environment.mode === 'mock' ? 'Synthetic in-memory mock count only; not service persistence evidence' : 'Requires agreed authoritative and consistent query source' }), contentType: 'application/json' });
});
