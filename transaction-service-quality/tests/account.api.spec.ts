import { test, expect } from '@playwright/test';

test('Get bank account details', async ({ request }) => {

    const response = await request.get(
        '/api/accounts/ACC10001'
    );

    expect(response.status()).toBe(200);

    const account = await response.json();

    expect(account.accountId).toBe('ACC10001');
    expect(account.customerId).toBe('CUST1001');
    expect(account.accountType).toBe('SAVINGS');
    expect(account.currency).toBe('INR');
    expect(account.balance).toBe(50000);
    expect(account.status).toBe('ACTIVE');
});