import { test, expect } from '@playwright/test';
import { TransactionApi } from '../../api/transaction.api';
import { TransactionResponseSchema } from '../../schemas/transaction.schema';

test.describe('Transactions API', () => {

  test('should create a purchase transaction', async ({ request }) => {

      const transactionApi = new TransactionApi(request);

      const response = await transactionApi.createTransaction(1, 50, 1);

      expect(response.status()).toBe(201);

      const body = await response.json();

      expect(body).toHaveProperty('transaction_id');
      expect(body).toHaveProperty('account_id');
      expect(body).toHaveProperty('amount');
      expect(body).toHaveProperty('operation_type_id');
      expect(body).toHaveProperty('event_date');
      expect(body).toHaveProperty('type');

      const result = TransactionResponseSchema.safeParse(body);
      expect(result.success).toBe(true);

    });

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

     /**
      * Verifies the transaction creation when account_id value isn't provided.
      */
     test("Verify the transaction when account_id isn't provided", async ({ request }) => {
        const requestBody = {
          data: {
                  account_id: null,
                  amount: 100.00,
                  operation_type_id: 2
                }
        };

      console.log("Request Body: ", requestBody);
      const response = await request.post('/transactions', {
        data: requestBody
      });

      //expect(response.status()).toBe("422 Unprocessable Entity (WebDAV) (RFC 4918)");
      //expect(response.status()).toBe(422);
      const body = await response.json();

      expect(body.status).toBe(400);
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
      expect(typeof body.error).toBe('account_id not found');
      const result = TransactionResponseSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    /**
      * Verifies the transaction creation when amount isn't value provided.
      */
     test("Verify the transaction when amount isn't provided", async ({ request }) => {
        const requestBody = {
          data: {
                  account_id: 1,
                  amount: "",
                  operation_type_id: 2
                }
        };

      console.log("Request Body: ", requestBody);
      const response = await request.post('/transactions', {
        data: requestBody
      });

      //expect(response.status()).toBe("422 Unprocessable Entity (WebDAV) (RFC 4918)");
      //expect(response.status()).toBe(422);
      const body = await response.json();

      expect(body.status).toBe(400);
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
      expect(typeof body.error).toBe('amount not found');
      const result = TransactionResponseSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    /**
      * Verifies the transaction creation when operation_type_id value isn't provided.
      */
     test("Verify the transaction when operation_type_id isn't provided", async ({ request }) => {
        const requestBody = {
          data: {
                  account_id: 1,
                  amount: 100.00,
                  operation_type_id: null
                }
        };

      console.log("Request Body: ", requestBody);
      const response = await request.post('/transactions', {
        data: requestBody
      });

      //expect(response.status()).toBe("422 Unprocessable Entity (WebDAV) (RFC 4918)");
      //expect(response.status()).toBe(422);
      const body = await response.json();

      expect(body.status).toBe(400);
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
      expect(typeof body.error).toBe('operation_type_id not found');
      const result = TransactionResponseSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    /**
      * Verifies the transaction creation when account_id key-value property is not provided.
      */
     test("Verify the transaction when account_id key-value property is not provided", async ({ request }) => {
        const requestBody = {
          data: {
                  amount: 100.00,
                  operation_type_id: 2
                }
        };

      console.log("Request Body: ", requestBody);
      const response = await request.post('/transactions', {
          data: requestBody
      });
      
      const body = await response.json();

      expect(body.status).toBe(400);
      expect(body).toHaveProperty('error');
      expect(typeof body).toBe('error');
      expect(typeof body.error).toBe('string');
      expect(body.error).toBe('account_id not found');
      const result = TransactionResponseSchema.safeParse(body);
      expect(result.success).toBe(false);

      /*
      expect(typeof body).toBe('error');
      expect(body.error).toBe('account not created');
      expect(typeof body.status).toBe('string');
      */
    });

    /**
      * Verifies the transaction creation when amount key-value property is not provided.
      */
     test("Verify the transaction when amount key-value property is not provided", async ({ request }) => {
        const requestBody = {
          data: {
                  account_id: 1,                  
                  operation_type_id: 2
                }
        };

      console.log("Request Body: ", requestBody);
      const response = await request.post('/transactions', {
          data: requestBody
      });
      
      const body = await response.json();

      expect(body.status).toBe(400);
      expect(body).toHaveProperty('error');
      expect(typeof body).toBe('error');
      expect(typeof body.error).toBe('string');
      expect(body.error).toBe('amount not found');
      const result = TransactionResponseSchema.safeParse(body);
      expect(result.success).toBe(false);

      /*
      expect(typeof body).toBe('error');
      expect(body.error).toBe('account not created');
      expect(typeof body.status).toBe('string');
      */
    });

    /**
      * Verifies the transaction creation when operation_type_id key-value property is not provided.
      */
     test("Verify the transaction when operation_type_id key-value property is not provided", async ({ request }) => {
        const requestBody = {
          data: {
                  account_id: 1,
                  amount: 100.00                  
                }
        };

      console.log("Request Body: ", requestBody);
      const response = await request.post('/transactions', {
          data: requestBody
      });
      
      const body = await response.json();

      expect(body.status).toBe(400);
      expect(body).toHaveProperty('error');
      expect(typeof body).toBe('error');
      expect(typeof body.error).toBe('string');
      expect(body.error).toBe('operation_type_id not found');
      const result = TransactionResponseSchema.safeParse(body);
      expect(result.success).toBe(false);

      /*
      expect(typeof body).toBe('error');
      expect(body.error).toBe('account not created');
      expect(typeof body.status).toBe('string');
      */
    });
});

/**
 * Transactions negative tests
 * 
 * POST /transactions

├── missing body
├── missing account_id
├── invalid account_id
├── account doesn't exist
├── missing amount
├── zero amount
├── negative amount
├── invalid operation_type_id
├── operation_type_id = 0
├── operation_type_id = 5
├── non-integer operation_type_id
├── malformed JSON
└── incorrect Content-Type
 * 
 */