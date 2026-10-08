import { test, expect } from '../../src/fixtures/api.fixture';
import { randomUUID } from 'node:crypto';
import { oracle, expectError, persistedTransactions } from '../../src/assertions/oracle';
import { environment } from '../../src/config/environment';
import { validateContractResponse } from '../../src/validators/schema.validator';
for (const [id, amount, accepted] of [
  ['ZERO', 0, false], ['NEGATIVE', -1, false], ['SUBUNIT', 0.001, false], ['PRECISION', 1.999, false],
  ['MINOR', 0.01, true], ['DECIMAL', 10.99, true], ['MAX', 1_000_000, true], ['LARGE', 1_000_000.01, false], ['VERY-LARGE', 1e15, false],
] as const) {
  test(`AMT-${id} amount ${amount} @behavior @pr`, async ({ account, transactions }, info) => {
    oracle(info, `AMT-${id}`, ['ZERO', 'NEGATIVE'].includes(id) ? 'CONTRACT' : 'ASSUMPTION', 'R-03', 'Amount accepted/rejected incorrectly or loses caller-unit value');
    const response = await transactions.createTransaction(account.account_id, amount, 1);
    if (accepted) {
      expect(response.status()).toBe(201);
      expect((await validateContractResponse('POST', '/transactions', response)).amount).toBe(-amount);
    } else await expectError(response, 422);
  });
}
for (const field of ['account_id', 'amount', 'operation_type_id']) {
  for (const kind of ['missing', 'null', 'wrong-type']) {
    test(`TXN-${field}-${kind} flat request @behavior @pr`, async ({ account, request }, info) => {
      oracle(info, `TXN-${field}-${kind}`, kind === 'missing' ? 'DOMAIN' : 'CONTRACT', 'R-07', 'Missing/wrong field accepted; malformed test wrapper hides validation');
      const payload: Record<string, unknown> = { account_id: account.account_id, amount: 50, operation_type_id: 1 };
      if (kind === 'missing') delete payload[field]; else payload[field] = kind === 'null' ? null : 'invalid';
      await expectError(await request.post('/transactions', { data: payload }), 400);
    });
  }
}
test('TXN-UNKNOWN-ACCOUNT referential integrity @behavior @pr', async ({ transactions, request }, info) => {
  oracle(info, 'TXN-UNKNOWN-ACCOUNT', 'CONTRACT', 'R-04', 'Transaction accepted against nonexistent account; error mapping is reference-policy assumption');
  const key = randomUUID();
  await expectError(await transactions.createTransaction(Number.MAX_SAFE_INTEGER, 50, 1, key), 422);
  if (environment.transactionQueryPath) expect((await persistedTransactions(request, Number.MAX_SAFE_INTEGER, key)).count).toBe(0);
  else info.annotations.push({ type: 'blocked-observation', description: 'Rejected response observed; no authoritative query to prove zero postings' });
});
for (const operation of [0, 5, 99]) {
  test(`TXN-UNKNOWN-OP-${operation} @behavior @pr`, async ({ account, transactions }, info) => {
    oracle(info, `TXN-UNKNOWN-OP-${operation}`, 'DOMAIN', 'R-07', 'Undocumented operation creates a financial transaction');
    await expectError(await transactions.createTransaction(account.account_id, 50, operation), 422);
  });
}
test('TXN-FRACTIONAL-OP schema rejection @behavior @pr', async ({ account, request }, info) => {
  oracle(info, 'TXN-FRACTIONAL-OP', 'CONTRACT', 'R-07', 'Noninteger operation accepted');
  await expectError(await request.post('/transactions', { data: { account_id: account.account_id, amount: 50, operation_type_id: 1.5 } }), 400);
});
