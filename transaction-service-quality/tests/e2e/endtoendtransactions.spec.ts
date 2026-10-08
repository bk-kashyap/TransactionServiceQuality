import { randomUUID } from 'node:crypto';
import { test, expect } from '../../src/fixtures/api.fixture';
import { operationTypes } from '../../src/data/test-data';
import { environment } from '../../src/config/environment';
import { oracle, persistedTransactions } from '../../src/assertions/oracle';
import { validateContractResponse } from '../../src/validators/schema.validator';

test('T3-JOURNEY account and all operation types @behavior @pr @release', async ({ request, account, accounts, transactions }, info) => {
  oracle(info, 'T3-JOURNEY', 'HEARSAY', 'R-02/R-03/R-04/R-05', 'Journey loses account association, operation semantics, or resulting records');
  const ids: number[] = [];
  for (const operation of operationTypes) {
    await test.step(`${operation.name}: post and verify resulting record`, async () => {
      const key = randomUUID();
      const response = await transactions.createTransaction(account.account_id, 10.99, operation.id, key);
      expect(response.status()).toBe(201);
      const body = await validateContractResponse('POST', '/transactions', response);
      expect(body.account_id).toBe(account.account_id);
      expect(body.operation_type_id).toBe(operation.id);
      expect(body.amount).toBe(operation.sign * 10.99);
      expect(body.type).toBe(operation.type);
      expect(Number.isInteger(body.transaction_id)).toBe(true);
      ids.push(body.transaction_id);
      if (environment.transactionQueryPath) {
        const observed = await persistedTransactions(request, account.account_id, key);
        expect(observed.count).toBe(1);
        expect(observed.transactions[0]).toMatchObject(body);
      } else {
        info.annotations.push({ type: 'blocked-observation', description: 'No transaction read/count contract: response-only journey cannot establish persisted state' });
        if (process.env.RELEASE_GATE === '1') throw new Error('Release state verification BLOCKED: missing TRANSACTION_QUERY_PATH');
      }
    });
  }
  expect(new Set(ids).size).toBe(4);
  const retrieved = await accounts.getAccount(account.account_id);
  expect(retrieved.status()).toBe(200);
  expect(await validateContractResponse('GET', '/accounts/{accountId}', retrieved)).toMatchObject(account);
});
