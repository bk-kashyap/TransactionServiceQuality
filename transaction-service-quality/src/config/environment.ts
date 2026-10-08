const mode = process.env.TEST_ENV ?? 'mock';
if (!['mock', 'prism', 'staging'].includes(mode)) throw new Error('TEST_ENV must be mock, prism, or staging');
if (mode === 'staging' && !process.env.BASE_URL) throw new Error('BASE_URL is required for staging');
if (mode !== 'staging' && process.env.BASE_URL) throw new Error('Use TEST_ENV=staging for an external BASE_URL');
const port = Number(process.env.MOCK_PORT ?? (mode === 'prism' ? 4010 : 4011));
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid MOCK_PORT');
const baseURL = process.env.BASE_URL ?? `http://127.0.0.1:${port}`;
if (!['http:', 'https:'].includes(new URL(baseURL).protocol)) throw new Error('BASE_URL must use HTTP(S)');
export const environment = { mode, port, baseURL,
  policyApproved: mode === 'mock' || process.env.APPROVED_POLICY === 'qa-reference-v1',
  transactionQueryPath: mode === 'mock' ? '/__qa/transactions' : process.env.TRANSACTION_QUERY_PATH,
};
