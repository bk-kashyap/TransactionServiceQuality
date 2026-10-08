# Executed case traceability

Generated from a full run with `npm run traceability`. Status describes that environment only. Mock passes do not retire real-service risk.

Environment: mock; cases: 74; run: 2026-10-08T05:33:35.077Z.

| Case | C1 risk | Defect caught | Oracle | CI gate | Source | Last result |
|---|---|---|---|---|---|---|
| ACC-001 | R-06 | Valid account request fails or returns wrong schema | CONTRACT | PR | accounts/create-account.spec.ts:6 | passed |
| ACC-GET | R-06 | Created account missing or returned under wrong identity | DOMAIN | PR | accounts/fetch-account.spec.ts:5 | passed |
| ACC-NOTFOUND | R-04 | Unknown account returned as existing | ASSUMPTION | PR | accounts/fetch-account.spec.ts:13 | passed |
| ACC-PATH | R-07 | Noninteger path parameter accepted | CONTRACT | PR | accounts/fetch-account.spec.ts:18 | passed |
| AMT-DECIMAL | R-03 | Amount accepted/rejected incorrectly or loses caller-unit value | ASSUMPTION | PR | transactions/create-transaction.spec.ts:10 | passed |
| AMT-LARGE | R-03 | Amount accepted/rejected incorrectly or loses caller-unit value | ASSUMPTION | PR | transactions/create-transaction.spec.ts:10 | passed |
| AMT-MAX | R-03 | Amount accepted/rejected incorrectly or loses caller-unit value | ASSUMPTION | PR | transactions/create-transaction.spec.ts:10 | passed |
| AMT-MINOR | R-03 | Amount accepted/rejected incorrectly or loses caller-unit value | ASSUMPTION | PR | transactions/create-transaction.spec.ts:10 | passed |
| AMT-NEGATIVE | R-03 | Amount accepted/rejected incorrectly or loses caller-unit value | CONTRACT | PR | transactions/create-transaction.spec.ts:10 | passed |
| AMT-PRECISION | R-03 | Amount accepted/rejected incorrectly or loses caller-unit value | ASSUMPTION | PR | transactions/create-transaction.spec.ts:10 | passed |
| AMT-SUBUNIT | R-03 | Amount accepted/rejected incorrectly or loses caller-unit value | ASSUMPTION | PR | transactions/create-transaction.spec.ts:10 | passed |
| AMT-VERY-LARGE | R-03 | Amount accepted/rejected incorrectly or loses caller-unit value | ASSUMPTION | PR | transactions/create-transaction.spec.ts:10 | passed |
| AMT-ZERO | R-03 | Amount accepted/rejected incorrectly or loses caller-unit value | CONTRACT | PR | transactions/create-transaction.spec.ts:10 | passed |
| CONTRACT-GET | R-09 | GET response violates documented status/schema | CONTRACT | PR | contract/schema.spec.ts:17 | passed |
| CONTRACT-TXN | R-09 | Transaction response violates status/schema | CONTRACT | PR | contract/schema.spec.ts:23 | passed |
| DOC-10 | R-06 | Document boundary accepted/rejected incorrectly | HEARSAY | Nightly/Staging | accounts/create-account.spec.ts:13 | passed |
| DOC-14 | R-06 | Document boundary accepted/rejected incorrectly | HEARSAY | Nightly/Staging | accounts/create-account.spec.ts:13 | passed |
| DOC-15 | R-06 | Document boundary accepted/rejected incorrectly | HEARSAY | Nightly/Staging | accounts/create-account.spec.ts:13 | passed |
| DOC-9 | R-06 | Document boundary accepted/rejected incorrectly | HEARSAY | Nightly/Staging | accounts/create-account.spec.ts:13 | passed |
| DOC-ALPHA | R-06 | Empty/nondigit document accepted | HEARSAY | Nightly/Staging | accounts/create-account.spec.ts:24 | passed |
| DOC-DUP | R-06 | Same document creates multiple accounts | DOMAIN | Nightly/Staging | accounts/create-account.spec.ts:29 | passed |
| DOC-EMPTY | R-06 | Empty/nondigit document accepted | HEARSAY | Nightly/Staging | accounts/create-account.spec.ts:24 | passed |
| DOC-MISSING | R-07 | Missing property or wrong property type accepted | DOMAIN | Nightly/Staging | accounts/create-account.spec.ts:37 | passed |
| DOC-NULL | R-07 | Missing property or wrong property type accepted | CONTRACT | Nightly/Staging | accounts/create-account.spec.ts:37 | passed |
| DOC-NUMBER | R-07 | Missing property or wrong property type accepted | CONTRACT | Nightly/Staging | accounts/create-account.spec.ts:37 | passed |
| GAP-AUDIT-ATOMICITY | R-08 | No audit read capability or rollback/fault injection oracle | CONTRACT-GAP | Pre-release | gaps/observability.spec.ts:8 | skipped |
| GAP-BALANCE-RECONCILIATION | R-03/R-05 | No balance or authoritative ledger API in supplied contract | CONTRACT-GAP | Pre-release | gaps/observability.spec.ts:8 | skipped |
| GAP-SECURITY-OWNERSHIP | R-11 | No agreed authentication/authorization contract or test principals | CONTRACT-GAP | Pre-release | gaps/observability.spec.ts:8 | skipped |
| GUARD-COUNT | R-01 | Count adapter reports one while returning two stored records | DOMAIN | PR | contract/guardrail.spec.ts:19 | passed |
| GUARD-DUP | R-01 | Guardrail fails to detect replay creating distinct IDs | DOMAIN | PR | contract/guardrail.spec.ts:14 | passed |
| GUARD-ERROR | R-01 | One success and many failures falsely pass incident guardrail | DOMAIN | PR | contract/guardrail.spec.ts:9 | passed |
| HTTP-EMPTY-ARRAY-accounts | R-07/R-10 | Parser/content negotiation/body limit failure | ASSUMPTION | Nightly/Staging | cross-cutting/http.spec.ts:12 | passed |
| HTTP-EMPTY-ARRAY-transactions | R-07/R-10 | Parser/content negotiation/body limit failure | ASSUMPTION | Nightly/Staging | cross-cutting/http.spec.ts:12 | passed |
| HTTP-EMPTY-BODY-accounts | R-07/R-10 | Parser/content negotiation/body limit failure | ASSUMPTION | Nightly/Staging | cross-cutting/http.spec.ts:12 | passed |
| HTTP-EMPTY-BODY-transactions | R-07/R-10 | Parser/content negotiation/body limit failure | ASSUMPTION | Nightly/Staging | cross-cutting/http.spec.ts:12 | passed |
| HTTP-EMPTY-OBJECT-accounts | R-07/R-10 | Parser/content negotiation/body limit failure | ASSUMPTION | Nightly/Staging | cross-cutting/http.spec.ts:12 | passed |
| HTTP-EMPTY-OBJECT-transactions | R-07/R-10 | Parser/content negotiation/body limit failure | ASSUMPTION | Nightly/Staging | cross-cutting/http.spec.ts:12 | passed |
| HTTP-MALFORMED-accounts | R-07/R-10 | Parser/content negotiation/body limit failure | ASSUMPTION | Nightly/Staging | cross-cutting/http.spec.ts:12 | passed |
| HTTP-MALFORMED-transactions | R-07/R-10 | Parser/content negotiation/body limit failure | ASSUMPTION | Nightly/Staging | cross-cutting/http.spec.ts:12 | passed |
| HTTP-METHOD-accounts | R-09 | Unsupported method is accepted; no Prism-specific error dependency | DOMAIN | PR | cross-cutting/http.spec.ts:20 | passed |
| HTTP-METHOD-transactions | R-09 | Unsupported method is accepted; no Prism-specific error dependency | DOMAIN | PR | cross-cutting/http.spec.ts:20 | passed |
| HTTP-OVERSIZED-accounts | R-07/R-10 | Parser/content negotiation/body limit failure | ASSUMPTION | Nightly/Staging | cross-cutting/http.spec.ts:12 | passed |
| HTTP-OVERSIZED-transactions | R-07/R-10 | Parser/content negotiation/body limit failure | ASSUMPTION | Nightly/Staging | cross-cutting/http.spec.ts:12 | passed |
| HTTP-WRONG-TYPE-accounts | R-07/R-10 | Parser/content negotiation/body limit failure | ASSUMPTION | Nightly/Staging | cross-cutting/http.spec.ts:12 | passed |
| HTTP-WRONG-TYPE-transactions | R-07/R-10 | Parser/content negotiation/body limit failure | ASSUMPTION | Nightly/Staging | cross-cutting/http.spec.ts:12 | passed |
| IDEMP-CHANGED | R-01 | Key collision silently changes an existing payment | DOMAIN | Nightly/Staging | idempotency/replay.spec.ts:13 | passed |
| IDEMP-MISSING | R-01 | Undocumented body deduplication merges legitimate independent transactions | ASSUMPTION | Nightly/Staging | idempotency/replay.spec.ts:19 | passed |
| IDEMP-REPLAY | R-01 | Retry returns a new transaction | HEARSAY | Nightly/Staging | idempotency/replay.spec.ts:6 | passed |
| REQ-ID | R-08 | Response lacks a unique request identifier | HEARSAY | Nightly/Staging | cross-cutting/http.spec.ts:25 | passed |
| SCHEMA-accountResponse | R-09 | Validator misses property type/integer constraints | CONTRACT | PR | contract/schema.spec.ts:10 | passed |
| SCHEMA-createAccountRequest | R-09 | Validator misses property type/integer constraints | CONTRACT | PR | contract/schema.spec.ts:10 | passed |
| SCHEMA-createTransactionRequest | R-09 | Validator misses property type/integer constraints | CONTRACT | PR | contract/schema.spec.ts:10 | passed |
| SCHEMA-errorResponse | R-09 | Validator misses property type/integer constraints | CONTRACT | PR | contract/schema.spec.ts:10 | passed |
| SCHEMA-transactionResponse | R-09 | Validator misses property type/integer constraints | CONTRACT | PR | contract/schema.spec.ts:10 | passed |
| T1-COUNT | R-01 | Concurrent replay creates multiple financial records | HEARSAY | Nightly/Pre-release | idempotency/concurrent-replay.spec.ts:9 | passed |
| T3-JOURNEY | R-02/R-03/R-04/R-05 | Journey loses account association, operation semantics, or resulting records | HEARSAY | PR | e2e/endtoendtransactions.spec.ts:8 | passed |
| TXN-account_id-missing | R-07 | Missing/wrong field accepted; malformed test wrapper hides validation | DOMAIN | PR | transactions/create-transaction.spec.ts:21 | passed |
| TXN-account_id-null | R-07 | Missing/wrong field accepted; malformed test wrapper hides validation | CONTRACT | PR | transactions/create-transaction.spec.ts:21 | passed |
| TXN-account_id-wrong-type | R-07 | Missing/wrong field accepted; malformed test wrapper hides validation | CONTRACT | PR | transactions/create-transaction.spec.ts:21 | passed |
| TXN-amount-missing | R-07 | Missing/wrong field accepted; malformed test wrapper hides validation | DOMAIN | PR | transactions/create-transaction.spec.ts:21 | passed |
| TXN-amount-null | R-07 | Missing/wrong field accepted; malformed test wrapper hides validation | CONTRACT | PR | transactions/create-transaction.spec.ts:21 | passed |
| TXN-amount-wrong-type | R-07 | Missing/wrong field accepted; malformed test wrapper hides validation | CONTRACT | PR | transactions/create-transaction.spec.ts:21 | passed |
| TXN-FRACTIONAL-OP | R-07 | Noninteger operation accepted | CONTRACT | PR | transactions/create-transaction.spec.ts:42 | passed |
| TXN-OP-1 | R-02/R-03/R-04 | Wrong account, operation, sign, type, or caller-unit amount | HEARSAY | PR | transactions/transaction-operation-types.spec.ts:6 | passed |
| TXN-OP-2 | R-02/R-03/R-04 | Wrong account, operation, sign, type, or caller-unit amount | HEARSAY | PR | transactions/transaction-operation-types.spec.ts:6 | passed |
| TXN-OP-3 | R-02/R-03/R-04 | Wrong account, operation, sign, type, or caller-unit amount | HEARSAY | PR | transactions/transaction-operation-types.spec.ts:6 | passed |
| TXN-OP-4 | R-02/R-03/R-04 | Wrong account, operation, sign, type, or caller-unit amount | HEARSAY | PR | transactions/transaction-operation-types.spec.ts:6 | passed |
| TXN-operation_type_id-missing | R-07 | Missing/wrong field accepted; malformed test wrapper hides validation | DOMAIN | PR | transactions/create-transaction.spec.ts:21 | passed |
| TXN-operation_type_id-null | R-07 | Missing/wrong field accepted; malformed test wrapper hides validation | CONTRACT | PR | transactions/create-transaction.spec.ts:21 | passed |
| TXN-operation_type_id-wrong-type | R-07 | Missing/wrong field accepted; malformed test wrapper hides validation | CONTRACT | PR | transactions/create-transaction.spec.ts:21 | passed |
| TXN-UNKNOWN-ACCOUNT | R-04 | Transaction accepted against nonexistent account; error mapping is reference-policy assumption | CONTRACT | PR | transactions/create-transaction.spec.ts:29 | passed |
| TXN-UNKNOWN-OP-0 | R-07 | Undocumented operation creates a financial transaction | DOMAIN | PR | transactions/create-transaction.spec.ts:37 | passed |
| TXN-UNKNOWN-OP-5 | R-07 | Undocumented operation creates a financial transaction | DOMAIN | PR | transactions/create-transaction.spec.ts:37 | passed |
| TXN-UNKNOWN-OP-99 | R-07 | Undocumented operation creates a financial transaction | DOMAIN | PR | transactions/create-transaction.spec.ts:37 | passed |
