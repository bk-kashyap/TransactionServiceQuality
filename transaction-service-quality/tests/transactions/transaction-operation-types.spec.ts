import { test, expect } from '@playwright/test';
import { TransactionApi } from '../../api/transaction.api';

const operations = [
     {
          name: 'Normal Purchase',
          operationTypeId: 1,
          expectedSign: 'negative'
     },
     {
          name: 'Purchase with installments',
          operationTypeId: 2,
          expectedSign: 'negative'
     },
     {
          name: 'Withdrawal',
          operationTypeId: 3,
          expectedSign: 'negative'
     },
     {
          name: 'Credit Voucher',
          operationTypeId: 4,
          expectedSign: 'positive'
     }
];

     for (const operation of operations) {
     
          test(`${operation.name} should apply correct sign`, async ({ request }) => {
               const api = new TransactionApi(request);
               
               const response = await api.createTransaction(
                    1,
                    50,
                    operation.operationTypeId
               );
               
               expect(response.status()).toBe(201);
               
               const body = await response.json();
               
               if (operation.expectedSign === 'negative') {
                    expect(body.amount).toBeLessThan(0);
               }
               
               if (operation.expectedSign === 'positive') {
                    expect(body.amount).toBeGreaterThan(0);
               }
          }
     );
}