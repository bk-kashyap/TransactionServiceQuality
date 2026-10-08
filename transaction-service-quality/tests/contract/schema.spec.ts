import { test, expect } from '../../src/fixtures/api.fixture';
import { oracle } from '../../src/assertions/oracle';
import { validateSchema, validateContractResponse } from '../../src/validators/schema.validator';
import type { SchemaName } from '../../src/validators/schema.validator';
for (const [name, value] of [
  ['createAccountRequest', { document_number: 123 }], ['createTransactionRequest', { account_id: 1.5 }],
  ['accountResponse', { account_id: '1' }], ['transactionResponse', { operation_type_id: 2.5 }],
  ['errorResponse', { error: 42 }],
] as Array<[SchemaName, unknown]>) {
  test(`SCHEMA-${name} rejects wrong types @contract @pr`, async ({}, info) => {
    oracle(info, `SCHEMA-${name}`, 'CONTRACT', 'R-09', 'Validator misses property type/integer constraints');
    expect(() => validateSchema(name, value)).toThrow('handler.');
    // Empty objects really are allowed: this check prevents accidental local hardening.
    expect(() => validateSchema(name, {})).not.toThrow();
  });
}
test('CONTRACT-GET static response shape @contract @pr', async ({ request }, info) => {
  oracle(info, 'CONTRACT-GET', 'CONTRACT', 'R-09', 'GET response violates documented status/schema');
  // Does not assume account 1 exists or compare its identity to a static example.
  const response = await request.get('/accounts/1');
  await validateContractResponse('GET', '/accounts/{accountId}', response);
});
test('CONTRACT-TXN response schema @contract @pr', async ({ account, transactions }, info) => {
  oracle(info, 'CONTRACT-TXN', 'CONTRACT', 'R-09', 'Transaction response violates status/schema');
  const response = await transactions.createTransaction(account.account_id, 50, 1);
  expect(response.status()).toBe(201);
  await validateContractResponse('POST', '/transactions', response);
});
