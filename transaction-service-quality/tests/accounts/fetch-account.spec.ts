import { test, expect } from '../../src/fixtures/api.fixture';
import { oracle, expectError } from '../../src/assertions/oracle';
import { validateContractResponse } from '../../src/validators/schema.validator';

test('ACC-GET retrieve own created account @behavior @pr', async ({ account, accounts }, info) => {
  oracle(info, 'ACC-GET', 'DOMAIN', 'R-06', 'Created account missing or returned under wrong identity');
  const response = await accounts.getAccount(account.account_id);
  expect(response.status()).toBe(200);
  const body = await validateContractResponse('GET', '/accounts/{accountId}', response);
  expect(body.account_id).toBe(account.account_id);
  expect(body.document_number).toBe(account.document_number);
});
test('ACC-NOTFOUND unknown account @behavior @pr', async ({ accounts }, info) => {
  oracle(info, 'ACC-NOTFOUND', 'ASSUMPTION', 'R-04', 'Unknown account returned as existing');
  // The reference mock has no such account; staging reserves this ID under the approved policy.
  await expectError(await accounts.getAccount(Number.MAX_SAFE_INTEGER), 404);
});
test('ACC-PATH invalid encoded account ID @behavior @pr', async ({ request }, info) => {
  oracle(info, 'ACC-PATH', 'CONTRACT', 'R-07', 'Noninteger path parameter accepted');
  await expectError(await request.get(`/accounts/${encodeURIComponent('@#$%67')}`), 400);
});
