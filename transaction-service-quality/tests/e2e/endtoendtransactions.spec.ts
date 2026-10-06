import { test, expect } from '@playwright/test';

test('Create account and create transaction journey', async ({ request }) => {

    // STEP 1
    const accountResponse = await request.post('/accounts', {
        data: {
          document_number: '12345678900'
        }
     });

    expect(accountResponse.status()).toBe(201);
    const account = await accountResponse.json();
    expect(account.account_id).toBeDefined();


    // STEP 2
    const transactionResponse = await request.post('/transactions', {
        data: {
          account_id: account.account_id,
          amount: 50,
          operation_type_id: 1
        }
     });

    expect(transactionResponse.status()).toBe(201);
    const transaction = await transactionResponse.json();
    expect(transaction.account_id).toBe(account.account_id);


    // STEP 3
    const getAccountResponse = await request.get(`/accounts/${account.account_id}`);
    expect(getAccountResponse.status()).toBe(200);
    const retrievedAccount = await getAccountResponse.json();
    expect(retrievedAccount.account_id).toBe(account.account_id);
  }
);

/**
 * High Priority Quality Gates
 * Missing Idempotency Id or Key in the request header
 * 
 * 1. Create a transaction with a unique idempotency key and verify that the transaction is 
 * created successfully.
 * 2. Create a transaction with the same idempotency key and verify that the transaction is not 
 * created again, but the response is the same as the first request.
 * 3. Create a transaction with a different idempotency key and verify that the transaction is 
 * created successfully.
 * 4. Create a transaction with a missing idempotency key and verify that the transaction is 
 * created successfully.
 * 5. Also, a tranactionId is returned in the response, which can be used to verify that the 
 * transaction is created successfully.
 * 6. Or a X-corelation-id is returned in the response, which can be used to verify that the transaction flow.
 * 
 * Contract Quality Gates :
 *                     CI
                     │
          ┌──────────┼───────────┐
          ▼          ▼           ▼
     Contract     API Tests    Journey
     Validation
          │          │           │
          └──────────┼───────────┘
                     ▼
                Quality Gate
                     │
              ┌──────┴──────┐
              ▼             ▼
             PASS           FAIL
              │             │
           Deploy       Stop Pipeline
 */