// SYNTHETIC REFERENCE MOCK: implements qa-reference-v1, not provider behavior.
const http = require('node:http');
const crypto = require('node:crypto');
const { validators } = require('./contract.cjs');
const accounts = new Map(), documents = new Map(), transactions = [], replay = new Map();
let nextAccount = 1, nextTransaction = 1;
const MAX_BODY = 16 * 1024;
function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'X-Request-ID': crypto.randomUUID(), 'X-QA-Mock': 'qa-reference-v1' });
  res.end(JSON.stringify(body));
}
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost'), route = url.pathname;
  const fail = (status, error) => send(res, status, { error });
  if (route === '/__qa/health' && req.method === 'GET') return send(res, 200, { mock: true, policy: 'qa-reference-v1' });
  if (route === '/__qa/transactions' && req.method === 'GET') {
    const matching = transactions.filter(t => t.account_id === Number(url.searchParams.get('account_id')) && t.idempotency_key === url.searchParams.get('idempotency_key'));
    return send(res, 200, { count: matching.length, transactions: matching.map(({ idempotency_key, ...t }) => t) });
  }
  const cleanup = /^\/__qa\/accounts\/(\d+)$/.exec(route);
  if (cleanup && req.method === 'DELETE') {
    const id = Number(cleanup[1]), account = accounts.get(id);
    if (account) documents.delete(account.document_number);
    accounts.delete(id);
    for (let i = transactions.length - 1; i >= 0; i--) if (transactions[i].account_id === id) transactions.splice(i, 1);
    for (const key of replay.keys()) if (key.startsWith(`${id}:`)) replay.delete(key);
    return send(res, 200, { cleaned: true });
  }
  const accountMatch = /^\/accounts\/([^/]+)$/.exec(route);
  if (accountMatch) {
    if (req.method !== 'GET') return fail(405, 'method not allowed');
    if (!/^\d+$/.test(accountMatch[1]) || !Number.isSafeInteger(Number(accountMatch[1]))) return fail(400, 'invalid account ID');
    const account = accounts.get(Number(accountMatch[1]));
    return account ? send(res, 200, account) : fail(404, 'account not found');
  }
  if (!['/accounts', '/transactions'].includes(route)) return fail(404, 'route not found');
  if (req.method !== 'POST') return fail(405, 'method not allowed');
  if (!(req.headers['content-type'] ?? '').toLowerCase().startsWith('application/json')) return fail(415, 'application/json required');
  let raw = '', oversized = false;
  try {
    for await (const chunk of req) {
      if (Buffer.byteLength(raw) + chunk.length > MAX_BODY) oversized = true;
      if (!oversized) raw += chunk.toString('utf8');
    }
  } catch { return fail(400, 'incomplete body'); }
  if (oversized) return fail(413, 'body exceeds reference-mock limit');
  let body;
  try { body = JSON.parse(raw); } catch { return fail(400, 'invalid JSON'); }
  const schemaName = route === '/accounts' ? 'handler.createAccountRequest' : 'handler.createTransactionRequest';
  if (!validators[schemaName](body)) return fail(400, 'request schema mismatch');
  if (route === '/accounts') {
    if (!/^[0-9]{10,14}$/.test(body.document_number ?? '')) return fail(400, 'invalid document number');
    if (documents.has(body.document_number)) return fail(409, 'duplicate document number');
    const account = { account_id: nextAccount++, document_number: body.document_number };
    accounts.set(account.account_id, account); documents.set(body.document_number, account.account_id);
    return send(res, 201, account);
  }
  if (!['account_id', 'amount', 'operation_type_id'].every(k => Object.hasOwn(body, k))) return fail(400, 'missing transaction field');
  if (!accounts.has(body.account_id)) return fail(422, 'account not found');
  if (![1, 2, 3, 4].includes(body.operation_type_id)) return fail(422, 'unknown operation type');
  const minor = Math.round(body.amount * 100);
  if (!(body.amount > 0) || body.amount > 1_000_000 || !Number.isSafeInteger(minor) || Math.abs(body.amount * 100 - minor) > 1e-7) return fail(422, 'invalid amount');
  const key = req.headers['idempotency-key'], scopedKey = key ? `${body.account_id}:${key}` : undefined;
  const fingerprint = JSON.stringify([body.account_id, body.amount, body.operation_type_id]);
  if (scopedKey && replay.has(scopedKey)) {
    const previous = replay.get(scopedKey);
    return previous.fingerprint === fingerprint ? send(res, 201, previous.transaction) : fail(409, 'idempotency key reused with different payload');
  }
  // Synchronous insertion is atomic in this mock. This is not proof of database/distributed correctness.
  const debit = body.operation_type_id !== 4;
  const transaction = { account_id: body.account_id, amount: (debit ? -minor : minor) / 100,
    event_date: new Date().toISOString(), operation_type_id: body.operation_type_id,
    transaction_id: nextTransaction++, type: debit ? 'debit' : 'credit' };
  transactions.push({ ...transaction, idempotency_key: key });
  if (scopedKey) replay.set(scopedKey, { fingerprint, transaction });
  return send(res, 201, transaction);
});
server.listen(Number(process.env.MOCK_PORT ?? 4011), '127.0.0.1', () => console.log('SYNTHETIC qa-reference-v1 mock ready'));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
