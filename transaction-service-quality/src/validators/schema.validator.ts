import type { APIResponse } from '@playwright/test';
const contract = require('../../scripts/contract.cjs');
const names = { accountResponse: 'handler.accountResponse', transactionResponse: 'handler.transactionResponse',
  errorResponse: 'handler.errorResponse', createAccountRequest: 'handler.createAccountRequest',
  createTransactionRequest: 'handler.createTransactionRequest' } as const;
export type SchemaName = keyof typeof names;
export function validateSchema(name: SchemaName, payload: unknown): void { contract.validateSchema(names[name], payload); }
export async function validateContractResponse(method: string, route: string, response: APIResponse) {
  if (!response.headers()['content-type']?.includes('application/json')) throw new Error('Expected application/json response');
  const body = await response.json();
  contract.validateResponse(method, route, response.status(), body);
  return body;
}
