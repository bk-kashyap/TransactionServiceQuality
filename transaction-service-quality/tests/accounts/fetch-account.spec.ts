import { test, expect } from "playwright/test";

test.describe("Fetch Account API Tests", () => {
     test("Fetch account by account_id", async ({ request }) => {
          // Create an account first to get a valid account_id
          // Make a GET request to your API endpoint
          const response = await request.get('/accounts/2');

          // Validate the response status
          expect(response.status()).toBe(200);
          expect(response.status()).toBe(200);

          // Parse the response body as JSON
          const body = await response.json();

          // Validate the response body structure
          expect(body).toHaveProperty('document_number');
          expect(body).toHaveProperty('account_id');
          // Example assertions on the response body
          expect(typeof body.account_id).toBe('number');
          expect(typeof body.document_number).toBe('string');

          // Assert number field
          expect(body.account_id).toBe(1);
          expect(body.document_number).toBeDefined(); // adjust based on your API response
     });

     test('Fetch non-existent account and validate 400 Bad Request', async ({request}) => {
          // Create an account first to get a valid account_id
          // Make a GET request to your API endpoint
          const response = await request.get('/accounts/223134');

          // Validate the response status
          expect(response.status()).toBe(400);

          // Parse the response body as JSON
          const body = await response.json();

          // Validate the response body structure
          expect(body).toHaveProperty('error');
          
          // Example assertions on the response body
          expect(typeof body.error).toBe('string');
          
          // Assert number field
          expect(body.error).toBe('account not found'); // adjust based on your API response
     });

     test('Validate the invalid account_id', async ({request}) => {
          // Create an account first to get a valid account_id
          // Make a GET request to your API endpoint
          const response = await request.get('/accounts/@#$%67');

          // Validate the response status
          expect(response.status()).toBe(400);

          // Parse the response body as JSON
          const body = await response.json();

          // Validate the response body structure
          expect(body).toHaveProperty('error');

          // Example assertions on the response body
          expect(typeof body.error).toBe('string');
          
          // Assert number field
          expect(body.error).toBe('account not found'); // adjust based on your API response
     });

     test('Validate when account_id is not passed', async ({request}) => {
          // Create an account first to get a valid account_id
          // Make a GET request to your API endpoint
          const response = await request.get('/accounts/');

          // Validate the response status
          expect(response.status()).toBe(400);

          // Parse the response body as JSON
          const body = await response.json();

          // Validate the response body structure
          expect(body).toHaveProperty('error');

          // Example assertions on the response body
          expect(typeof body.error).toBe('string');
          
          // Assert number field
          expect(body.error).toBe('account not found'); // adjust based on your API response
     });
});