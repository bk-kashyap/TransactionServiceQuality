import { test, expect } from '../../src/fixtures/api.fixture';
import { operationTypes } from '../../src/data/test-data';
import { oracle } from '../../src/assertions/oracle';
import { validateContractResponse } from '../../src/validators/schema.validator';
for (const operation of operationTypes) {
  test(`TXN-OP-${operation.id} ${operation.name} @behavior @pr`, async ({ account, transactions }, info) => {
    oracle(info, `TXN-OP-${operation.id}`, 'HEARSAY', 'R-02/R-03/R-04', 'Wrong account, operation, sign, type, or caller-unit amount');
    const amount = 10.99;
    const response = await transactions.createTransaction(account.account_id, amount, operation.id);
    expect(response.status()).toBe(201);
    const body = await validateContractResponse('POST', '/transactions', response);
    expect(body.account_id).toBe(account.account_id);
    expect(body.operation_type_id).toBe(operation.id);
    expect(body.type).toBe(operation.type);
    expect(body.amount).toBe(operation.sign * amount);
    expect(Number.isInteger(body.transaction_id)).toBe(true);
  });
}
