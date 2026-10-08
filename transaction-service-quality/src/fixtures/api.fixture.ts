import { test as base, expect } from '@playwright/test';
import { AccountsClient } from '../clients/accounts.client';
import { TransactionApi } from '../../api/transaction.api';
import { documentNumber } from '../data/test-data';
import { validateContractResponse } from '../validators/schema.validator';
import { environment } from '../config/environment';
type Account = { account_id: number; document_number: string };
export const test = base.extend<{ accounts: AccountsClient; transactions: TransactionApi; account: Account; policyGuard: void }>({
  policyGuard: [async ({ request }, use, info) => {
    if (info.title.includes('@behavior')) test.skip(!environment.policyApproved,
      'BLOCKED: qa-reference-v1 is synthetic; staging needs explicit policy approval, Prism has no stateful business oracle');
    if (process.env.RELEASE_GATE === '1' && environment.mode !== 'staging') throw new Error('Release gate requires staging; mock green is harness evidence only');
    if (environment.mode === 'mock') {
      const health = await request.get('/__qa/health');
      expect(health.status()).toBe(200);
      expect((await health.json()).policy).toBe('qa-reference-v1');
    }
    await use();
  }, { auto: true }],
  accounts: async ({ request }, use, info) => {
    const client = new AccountsClient(request);
    const createdIds = new Set<number>();
    const original = client.createAccount.bind(client);
    client.createAccount = async document => {
      const response = await original(document);
      if (response.status() === 201) {
        const body = await response.json();
        if (Number.isInteger(body.account_id)) createdIds.add(body.account_id);
      }
      return response;
    };
    try { await use(client); }
    finally {
      if (environment.mode === 'mock') {
        for (const id of createdIds) expect((await request.delete(`/__qa/accounts/${id}`)).status(), 'mock cleanup').toBe(200);
      } else if (createdIds.size) {
        await info.attach('retained-test-account-ids', { body: JSON.stringify([...createdIds]), contentType: 'application/json' });
      }
    }
  },
  transactions: async ({ request }, use) => { await use(new TransactionApi(request)); },
  account: async ({ accounts }, use) => {
    const response = await accounts.createAccount(documentNumber());
    expect(response.status()).toBe(201);
    const body = await validateContractResponse('POST', '/accounts', response);
    // An ID is necessary for the journey; schema alone does not require one.
    expect(Number.isInteger(body.account_id), 'DOMAIN: created account must expose a usable ID').toBe(true);
    await use(body);
  },
});
export { expect };
