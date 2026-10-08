import { test, expect } from '../../src/fixtures/api.fixture';
import { oracle, expectError } from '../../src/assertions/oracle';
for (const [id, data, contentType, status] of [
  ['MALFORMED', '{"document_number":', 'application/json', 400],
  ['WRONG-TYPE', '{"document_number":"12345678900"}', 'text/plain', 415],
  ['EMPTY-BODY', '', 'application/json', 400],
  ['EMPTY-OBJECT', {}, 'application/json', 400],
  ['EMPTY-ARRAY', [], 'application/json', 400],
  ['OVERSIZED', JSON.stringify({ document_number: '1'.repeat(20_000) }), 'application/json', 413],
] as const) {
  for (const route of ['/accounts', '/transactions']) {
    test(`HTTP-${id}-${route.slice(1)} @behavior @nightly`, async ({ request }, info) => {
      oracle(info, `HTTP-${id}-${route.slice(1)}`, 'ASSUMPTION', 'R-07/R-10', 'Parser/content negotiation/body limit failure', 'Nightly/Staging');
      // 415/413 and field-required rules are reference-policy proposals, not supplied contract outcomes.
      await expectError(await request.post(route, { headers: { 'Content-Type': contentType }, data }), status);
    });
  }
}
for (const route of ['/accounts', '/transactions']) {
  test(`HTTP-METHOD-${route.slice(1)} @behavior @pr`, async ({ request }, info) => {
    oracle(info, `HTTP-METHOD-${route.slice(1)}`, 'DOMAIN', 'R-09', 'Unsupported method is accepted; no Prism-specific error dependency');
    await expectError(await request.get(route), 405);
  });
}
test('REQ-ID success and error response @behavior @nightly', async ({ accounts, account, request }, info) => {
  oracle(info, 'REQ-ID', 'HEARSAY', 'R-08', 'Response lacks a unique request identifier', 'Nightly/Staging');
  const responses = [await accounts.getAccount(account.account_id), await request.get('/accounts/not-an-integer')];
  const ids = responses.map(response => response.headers()['x-request-id']);
  for (const id of ids) expect(typeof id === 'string' && id.trim().length > 0).toBe(true);
  expect(new Set(ids).size).toBe(2);
});
