import { randomUUID } from 'node:crypto';
import { test, expect } from '../../src/fixtures/api.fixture';
import { oracle, expectError } from '../../src/assertions/oracle';
import { assertReplayResponses } from '../../src/assertions/replay';
import { validateContractResponse } from '../../src/validators/schema.validator';
test('IDEMP-REPLAY same key same body @behavior @nightly', async ({ account, transactions }, info) => {
  oracle(info, 'IDEMP-REPLAY', 'HEARSAY', 'R-01', 'Retry returns a new transaction', 'Nightly/Staging');
  const key = randomUUID();
  const first = await transactions.createTransaction(account.account_id, 50, 1, key);
  const second = await transactions.createTransaction(account.account_id, 50, 1, key);
  await assertReplayResponses([first, second], { account_id: account.account_id, amount: 50, operation_type_id: 1 });
});
test('IDEMP-CHANGED same key different body @behavior @nightly', async ({ account, transactions }, info) => {
  oracle(info, 'IDEMP-CHANGED', 'DOMAIN', 'R-01', 'Key collision silently changes an existing payment', 'Nightly/Staging');
  const key = randomUUID();
  expect((await transactions.createTransaction(account.account_id, 50, 1, key)).status()).toBe(201);
  await expectError(await transactions.createTransaction(account.account_id, 51, 1, key), 409);
});
test('IDEMP-MISSING identical bodies without keys are independent @behavior @nightly', async ({ account, transactions }, info) => {
  oracle(info, 'IDEMP-MISSING', 'ASSUMPTION', 'R-01', 'Undocumented body deduplication merges legitimate independent transactions', 'Nightly/Staging');
  const bodies = [];
  for (let i = 0; i < 2; i++) {
    const response = await transactions.createTransaction(account.account_id, 50, 1);
    expect(response.status()).toBe(201);
    bodies.push(await validateContractResponse('POST', '/transactions', response));
  }
  expect(Number.isInteger(bodies[0].transaction_id)).toBe(true);
  expect(Number.isInteger(bodies[1].transaction_id)).toBe(true);
  expect(bodies[0].transaction_id).not.toBe(bodies[1].transaction_id);
});
