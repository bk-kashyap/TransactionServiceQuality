import { APIRequestContext } from '@playwright/test';
import { validateSchema } from '../src/validators/schema.validator';

export class TransactionApi {

  constructor(
    private readonly request: APIRequestContext
  ){}

  async createTransaction(accountId: number, amount: number, operationTypeId: number, idempotencyKey?: string) {
     validateSchema('createTransactionRequest', { account_id: accountId, amount, operation_type_id: operationTypeId });
     return this.request.post('/transactions', {
          headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
          data: {
               account_id: accountId,
               amount: amount,
               operation_type_id: operationTypeId
          }
     });
  }
}
