import { test, expect } from '../../src/fixtures/api.fixture';
import { oracle, persistedTransactions } from '../../src/assertions/oracle';
import { environment } from '../../src/config/environment';
import { assertReplayResponses } from '../../src/assertions/replay';
function response(status: number, id = 1) {
  return { status: () => status, headers: () => ({ 'content-type': 'application/json' }),
    json: async () => ({ transaction_id: id, account_id: 1, amount: -50, operation_type_id: 1, type: 'debit' }) } as any;
}
test('GUARD-ERROR replay does not discard failed requests @contract @pr', async ({}, info) => {
  oracle(info, 'GUARD-ERROR', 'DOMAIN', 'R-01', 'One success and many failures falsely pass incident guardrail');
  await expect(assertReplayResponses([response(201), ...Array.from({ length: 19 }, () => response(500))],
    { account_id: 1, amount: 50, operation_type_id: 1 })).rejects.toThrow();
});
test('GUARD-DUP replay rejects distinct IDs @contract @pr', async ({}, info) => {
  oracle(info, 'GUARD-DUP', 'DOMAIN', 'R-01', 'Guardrail fails to detect replay creating distinct IDs');
  await expect(assertReplayResponses([response(201, 1), response(201, 2)],
    { account_id: 1, amount: 50, operation_type_id: 1 })).rejects.toThrow();
});
test('GUARD-COUNT rejects a dishonest count envelope @contract @pr', async ({}, info) => {
  oracle(info, 'GUARD-COUNT', 'DOMAIN', 'R-01', 'Count adapter reports one while returning two stored records');
  const previous = environment.transactionQueryPath;
  environment.transactionQueryPath = '/test-count-adapter';
  try {
    const request = { get: async () => ({ status: () => 200, json: async () => ({ count: 1,
      transactions: [{ account_id: 1, transaction_id: 1 }, { account_id: 1, transaction_id: 2 }] }) }) } as any;
    await expect(persistedTransactions(request, 1, 'test')).rejects.toThrow();
  } finally { environment.transactionQueryPath = previous; }
});
