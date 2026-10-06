import { APIRequestContext } from '@playwright/test';

export class TransactionApi {

  constructor(
    private readonly request: APIRequestContext
  ){}

  async createTransaction(accountId: number, amount: number, operationTypeId: number) {
     return this.request.post('/transactions', {
          data: {
               account_id: accountId,
               amount: amount,
               operation_type_id: operationTypeId
          }
     });
  }
}