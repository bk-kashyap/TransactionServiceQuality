import type { APIResponse } from '@playwright/test';
import { expect } from '@playwright/test';
import { validateContractResponse } from '../validators/schema.validator';
export async function assertReplayResponses(responses: APIResponse[], payload: { account_id: number; amount: number; operation_type_id: number }) {
  expect(responses.length).toBeGreaterThan(1);
  const bodies = [];
  // Do not filter failures out: one success and N-1 errors must never pass.
  for (const response of responses) {
    expect(response.status(), 'Every request must satisfy approved replay status semantics').toBe(201);
    const body = await validateContractResponse('POST', '/transactions', response);
    expect(body.account_id).toBe(payload.account_id);
    expect(body.operation_type_id).toBe(payload.operation_type_id);
    expect(body.amount).toBe(-payload.amount);
    expect(body.type).toBe('debit');
    expect(Number.isInteger(body.transaction_id)).toBe(true);
    bodies.push(body);
  }
  expect(new Set(bodies.map(body => body.transaction_id)).size).toBe(1);
  return bodies[0];
}
