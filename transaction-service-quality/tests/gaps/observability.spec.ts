import { test } from '../../src/fixtures/api.fixture';
import { oracle } from '../../src/assertions/oracle';
for (const [id, risk, missing] of [
  ['AUDIT-ATOMICITY', 'R-08', 'No audit read capability or rollback/fault injection oracle'],
  ['BALANCE-RECONCILIATION', 'R-03/R-05', 'No balance or authoritative ledger API in supplied contract'],
  ['SECURITY-OWNERSHIP', 'R-11', 'No agreed authentication/authorization contract or test principals'],
] as const) {
  test(`GAP-${id} release evidence @gap @release`, async ({}, info) => {
    oracle(info, `GAP-${id}`, 'CONTRACT-GAP', risk, missing, 'Pre-release');
    test.skip(true, `BLOCKED: ${missing}; mock behavior cannot fill this evidence gap`);
  });
}
