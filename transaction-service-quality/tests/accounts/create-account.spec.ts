import { test, expect } from '@playwright/test';
import { AccountResponseSchema } from '../../schemas/account.schema';

/*
Our first API test will be for the endpoint that creates a new bank account. 
The endpoint validation is defined as follows:
POST /accounts
       │
       ├── Request structure
       ├── HTTP status
       ├── Response structure
       └── Data types

  * IMPORTANT NOTE: The document number validation rules are not specified in the contract.
       "Expected rejection — authority: hearsay. The published contract does not define 
       the boundary, therefore this test currently represents an implementation expectation requiring confirmation".
*/
test.describe('Accounts API', () => {

  const docu_number : string = "1234567890";

  test('should create an account', async ({ request }) => {

    // When the document number passed is valid, that is more than 10 and less than 14 digits.
    // the server should respond with a 201 Created status code.
    const requestBody = {
      document_number : docu_number
    };

    const response = await request.post('/accounts', {
      data: requestBody
    });

    expect(response.status()).toBe(201);

    const body = await response.json();

    expect(body).toHaveProperty('account_id');
    expect(body).toHaveProperty('document_number');

    expect(typeof body.account_id).toBe('number');
    expect(typeof body.document_number).toBe('string');
  });

  test('Validate the account response schema', async ({ request }) => {

    // When the document number passed is valid, that is more than 10 and less than 14 digits.
    // the server should respond with a 201 Created status code.
    const requestBody = {
      document_number : docu_number
    };

    const response = await request.post('/accounts', {
      data: requestBody
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    const result = AccountResponseSchema.safeParse(body);
          expect(result.success).toBe(true);
  });

  test('When a duplicate account is created with same docu_number', async ({ request }) => {

    // When the document number passed is valid, that is more than 10 and less than 14 digits.
    // the server should respond with a 201 Created status code.
    const requestBody = {
      document_number : docu_number
    };

    const response = await request.post('/accounts', {
      data: requestBody
    });

    // Expecting a 409 Conflict status code when trying to create a duplicate account with the same document number.
    expect(response.status()).toBe(409);

    const body = await response.json();

    expect(typeof body.error_msg).toBe('duplication of account with same document number');

    expect(typeof body.status).toBe('number');
    expect(typeof body.error_msg).toBe('string');

    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('error_msg');
  });

  test('When document number passed is > 10 && < 14 digits', async ({ request }) => {

    // When the document number passed is valid, that is more than 10 and less than 14 digits.
    // the server should respond with a 201 Created status code.
    const requestBody = {
      document_number: '12345678900'
    };

    const response = await request.post('/accounts', {
      data: requestBody
    });

    expect(response.status()).toBe(201);

    const body = await response.json();

    expect(body).toHaveProperty('account_id');
    expect(body).toHaveProperty('document_number');

    expect(typeof body.account_id).toBe('number');
    expect(typeof body.document_number).toBe('string');
  });

  test('When document number passed is less than 10 digits', async ({ request }) => {

    const requestBody = {
      document_number: '123456'
    };

    const response = await request.post('/accounts', {
      data: requestBody
    });

    expect(response.status()).toBe(400);

    const body = await response.json();

    expect(body).toHaveProperty('error');
    //expect(body).toHaveProperty('document_number');

    expect(typeof body.account_id).toBe('number');
    expect(typeof body.document_number).toBe('string');
  });

  test('When document number passed is more than 14 digits', async ({ request }) => {

    const requestBody = {
      document_number: '123456'
    };

    const response = await request.post('/accounts', {
      data: requestBody
    });

    expect(response.status()).toBe(400);

    const body = await response.json();

    expect(body).toHaveProperty('error');
    //expect(body).toHaveProperty('document_number');

    expect(typeof body.account_id).toBe('number');
    expect(typeof body.document_number).toBe('string');
  });

  /**
   *  When a client sends a request using an HTTP method that the server recognizes but 
   * does not support for the requested resource. This error is part of the HTTP response 
   * status codes and indicates a mismatch between the method used and the server's 
   * configuration for that resource.
   */
  test('When passed an incorrect HTTP method', async ({ request }) => {

    const requestBody = {
      document_number: '12345676900'
    };

    const response = await request.get('/accounts', {
      data: requestBody
    });

    expect(response.status()).toBe(405);

    const body = await response.json();
    //console.log("BODY ===== ",body.status);

    // Response Body assertions
    expect(response.status()).toBe(405);
    expect(body.type).toBe('https://stoplight.io/prism/errors#NO_METHOD_MATCHED_ERROR');
    expect(body.title).toBe('Route resolved, but no method matched');
    expect(body.detail).toContain('/accounts');

    expect(typeof body.title).toBe('string');
    expect(typeof body.detail).toBe('string');
    expect(typeof body.type).toBe('string');
  });

  /**
   * When the account request body is passed as an empty object, the server should respond with a 
   * 400 Bad Request status code.
   * This indicates that the server cannot process the request due to client-side errors, 
   * such as missing required fields or invalid data.
   * The response body should contain an error message indicating that the request body is 
   * invalid or missing required fields.
   */

  test('When account request body is passed as an empty object', async ({ request }) => {

    const requestBody = "";

    /*const requestBody = {
      document_number: '12345676900'
    };*/

    const response = await request.post('/accounts', {
      data: requestBody
    });

    expect(response.status()).toBe(400);

    const body = await response.json();

    // Response Body assertions
    //expect(response.status()).toBe(400);
    expect(body.error).toBe('account not found');

  });

  test('When document number passed is combination of alphanumeric characters', async ({ request }) => {

    // When the document number passed is a combination of alphanumeric characters, that is more than 10 and less than 14 digits.
    // the server should respond with a 400 Bad Request status code.
    const requestBody = {
      document_number: '1234567abcde'
    };

    const response = await request.post('/accounts', {
      data: requestBody
    });

    expect(response.status()).toBe(400);

    const body = await response.json();

    /**
     * Expect to throw a 400 Bad Request error with a message indicating that the account was not created.
     */
    expect(typeof body).toBe('error');
    expect(body.error).toBe('account not created');
    expect(typeof body.status).toBe('string');
  });


  /**
   * When the request body is passed as an empty object, the server should respond with a 400 Bad Request status code.
   * This indicates that the server cannot process the request due to client-side errors, 
   * such as missing required fields or invalid data.
   * The response body should contain an error message indicating that the request body is 
   * invalid or missing required fields.
   */
  test('When the request body is passed as an empty object', async ({ request }) => {

    const requestBody = "";
    const response = await request.post('/accounts', {
      data: requestBody
    });

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.error).toBe('account not found');

  });

  /**
   * Raw JSON is passed as an empty array, the server should respond with a 400 Bad Request status code.
   * This indicates that the server cannot process the request due to client-side errors, 
   * such as missing required fields or invalid data.
   * The response body should contain an error message indicating that the request body is 
   * invalid or missing required fields.
   */
  test('When account request body is passed as an empty array', async ({ request }) => {

    const requestBody = {};
    const response = await request.post('/accounts', {
      data: requestBody
    });

    // Assertion on the response status code to ensure it is 400 Bad Request
    expect(response.status()).toBe(400);

    const body = await response.json();

    // Response Body assertions
    expect(body.error).toBe('account cannot be created with empty request body');

  });
});

/**
 * Validation Gaps : 
 * 1. We should not automatically assume every malformed document number must return 400, 
 * because the contract doesn't specify the document-number validation rules.
 * Input*	            		*What we need to determine*
"1234567890"	    		Does the minimum-length boundary work?
"12345678901234"			Does the maximum-length boundary work?
"123456789"	        		Is a value below the stated minimum rejected?
"123456789012345"			Is a value above the stated maximum rejected?
"12345ABCDE"	    		Are non-digit characters rejected?
""	                		Is an empty string rejected?
Missing document_number	    Is the field mandatory?
Existing document number	Are duplicate accounts prevented?

******************************************************************************************

POST /accounts

Positive
 ├── valid document
 └── boundary document

Negative
 ├── missing body
 ├── missing document_number
 ├── empty document_number
 ├── invalid format
 ├── too short
 ├── too long
 └── duplicate document
 */