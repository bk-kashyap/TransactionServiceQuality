import type { TestInfo, APIResponse, APIRequestContext } from '@playwright/test';
import { expect } from '@playwright/test';
import { validateSchema } from '../validators/schema.validator';
import { environment } from '../config/environment';
export type Authority = 'CONTRACT' | 'HEARSAY' | 'DOMAIN' | 'ASSUMPTION' | 'CONTRACT-GAP';
export function oracle(info: TestInfo, id: string, authority: Authority, risk: string, defect: string, gate = 'PR') {
  for (const [type, description] of Object.entries({ case: id, oracle: authority, risk, defect, gate, environment: environment.mode }))
    info.annotations.push({ type, description });
  if (info.title.includes('@behavior')) info.annotations.push({ type: 'policy', description: 'qa-reference-v1: explicit synthetic assumptions; exact status/unit/header rules require agreement before staging assertions' });
}
export async function expectError(response: APIResponse, status: number) {
  expect(response.status()).toBe(status);
  expect(response.headers()['content-type']).toContain('application/json');
  const body = await response.json();
  validateSchema('errorResponse', body);
  expect(typeof body.error, 'DOMAIN: structured error should explain rejection').toBe('string');
}
export async function persistedTransactions(request: APIRequestContext, accountId: number, key: string) {
  if (!environment.transactionQueryPath) throw new Error('BLOCKED: authoritative transaction query endpoint is not configured');
  const response = await request.get(environment.transactionQueryPath, { params: { account_id: accountId, idempotency_key: key } });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(Number.isInteger(body.count) && body.count >= 0).toBe(true);
  expect(Array.isArray(body.transactions)).toBe(true);
  expect(body.transactions.length).toBe(body.count);
  for (const transaction of body.transactions) {
    validateSchema('transactionResponse', transaction);
    expect(transaction.account_id).toBe(accountId);
    expect(Number.isInteger(transaction.transaction_id)).toBe(true);
  }
  expect(new Set(body.transactions.map((t: any) => t.transaction_id)).size).toBe(body.count);
  return body as { count: number; transactions: Array<{ transaction_id: number; amount: number; operation_type_id: number; type: string; account_id: number }> };
}
