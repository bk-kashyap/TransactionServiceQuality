import { test, expect } from '../../src/fixtures/api.fixture';
import { documentNumber } from '../../src/data/test-data';
import { oracle, expectError } from '../../src/assertions/oracle';
import { validateContractResponse } from '../../src/validators/schema.validator';

test('ACC-001 create account response @contract @pr', async ({ accounts }, info) => {
  oracle(info, 'ACC-001', 'CONTRACT', 'R-06', 'Valid account request fails or returns wrong schema');
  const response = await accounts.createAccount(documentNumber());
  expect(response.status()).toBe(201);
  await validateContractResponse('POST', '/accounts', response);
});
for (const length of [9, 10, 14, 15]) {
  test(`DOC-${length} document length ${length} @behavior @nightly`, async ({ accounts }, info) => {
    oracle(info, `DOC-${length}`, 'HEARSAY', 'R-06', 'Document boundary accepted/rejected incorrectly', 'Nightly/Staging');
    const value = documentNumber(length);
    const response = await accounts.createAccount(value);
    if ([10, 14].includes(length)) {
      expect(response.status()).toBe(201);
      expect((await validateContractResponse('POST', '/accounts', response)).document_number).toBe(value);
    } else await expectError(response, 400);
  });
}
for (const [id, value] of [['DOC-EMPTY', ''], ['DOC-ALPHA', '12345ABCDE0']] as const) {
  test(`${id} invalid document @behavior @nightly`, async ({ accounts }, info) => {
    oracle(info, id, 'HEARSAY', 'R-06', 'Empty/nondigit document accepted', 'Nightly/Staging');
    await expectError(await accounts.createAccount(value), 400);
  });
}
test('DOC-DUP duplicate document @behavior @nightly', async ({ accounts }, info) => {
  oracle(info, 'DOC-DUP', 'DOMAIN', 'R-06', 'Same document creates multiple accounts', 'Nightly/Staging');
  const value = documentNumber();
  expect((await accounts.createAccount(value)).status()).toBe(201);
  // 409 and uniqueness are qa-reference-v1 assumptions, not supplied contract outcomes.
  await expectError(await accounts.createAccount(value), 409);
});
for (const [id, payload] of [['DOC-MISSING', {}], ['DOC-NULL', { document_number: null }], ['DOC-NUMBER', { document_number: 1234567890 }]] as const) {
  test(`${id} request validation @behavior @nightly`, async ({ request }, info) => {
    oracle(info, id, id === 'DOC-MISSING' ? 'DOMAIN' : 'CONTRACT', 'R-07', 'Missing property or wrong property type accepted', 'Nightly/Staging');
    await expectError(await request.post('/accounts', { data: payload }), 400);
  });
}
