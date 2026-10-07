# SUBMISSION.md

# Transactions Service — QA / Automation / Risk Submission

## 1. Submission Overview

This repository submission is structured around the five assignment artifacts:

- **C1 — Risk Assessment / Performance & Release Strategy**
- **C2 — Automation Strategy & Framework Architecture**
- **C3 — Contract Audit & Schema-Driven Validation**
- **C4 — API Test Design, Automation & Traceability**
- **C5 — Defect Register & Prediction**

The goal was not to maximize the number of test cases. The goal was to demonstrate how I would approach a small cardholder transaction service as a QA/quality owner joining the squad: understand what the contract actually guarantees, identify what it does not guarantee, automate what can be objectively tested, identify high-impact financial risks, and establish what must be fixed before the service can safely move toward real-money production use.

The central conclusion across the artifacts is:

> **The current contract is sufficient to build a useful API automation harness and deterministic mock-based suite, but it is not sufficient to safely sign off a cardholder money-movement service.**

The release position is therefore:

> **NO-GO for production money movement until the critical financial, security, idempotency, consistency, observability and contract-definition gaps are resolved and verified against a real implementation.**

This is a risk-based conclusion, not a claim that the implementation is necessarily broken.

---

## 2. What Is Included

| Artifact | Purpose | Primary outcome |
|---|---|---|
| `C1.md` | Risk assessment and release position | Prioritized money-movement risks and NO-GO rationale |
| `C2.md` | Automation strategy | Maintainable Playwright/TypeScript architecture, environment strategy, CI and isolation |
| `C3.md` | Contract audit | Schema weaknesses, consumer safety, security/operability gaps |
| `C4.md` | Executable API test strategy | Test inventory, Playwright structure, oracle classification, traceability and CI gates |
| `C5.md` | Prediction / defect register | Highest-risk implementation predictions and confirming tests |
| `SUBMISSION.md` | Submission index | How to navigate, run, review, and debrief the work |

The detailed evidence remains in the individual C1–C5 artifacts so that the reviewer can trace the conclusions back to the analysis rather than treating this file as a replacement for them.

---

# 3. Assignment Interpretation

The supplied contract exposes three functional API operations:

```text
POST /accounts
GET  /accounts/{accountId}
POST /transactions
```

The transaction model describes four operation types:

```text
1 = Normal Purchase
2 = Purchase with installments
3 = Withdrawal
4 = Credit Voucher
```

The contract also states that the caller supplies a positive amount and that the server applies the appropriate sign based on operation type.

The assignment is therefore not simply an API CRUD exercise.

The quality question I used throughout the work was:

> **Can another engineer use this automation approach, switch from mock to staging, run it in CI, understand exactly why a test failed, and know whether the result represents a contract violation, a business-rule defect, an assumption, or a contract gap?**

That led to five design principles:

1. Contract-first validation.
2. Risk-first test prioritization.
3. Explicit oracle classification.
4. Mock → staging environment independence.
5. No production-money release without demonstrable financial invariants.

---

# 4. Repository / Artifact Map

A squad-ready implementation should follow this structure:

```text
transactions-api-tests/
│
├── SUBMISSION.md
├── C1.md
├── C2.md
├── C3.md
├── C4.md
├── C5.md
│
├── tests/
│   ├── accounts/
│   │   ├── create-account.spec.ts
│   │   ├── account-validation.spec.ts
│   │   └── get-account.spec.ts
│   │
│   ├── transactions/
│   │   ├── purchase.spec.ts
│   │   ├── installment.spec.ts
│   │   ├── withdrawal.spec.ts
│   │   ├── credit-voucher.spec.ts
│   │   ├── amount-validation.spec.ts
│   │   ├── account-validation.spec.ts
│   │   └── operation-type.spec.ts
│   │
│   ├── cross-cutting/
│   │   ├── malformed-json.spec.ts
│   │   ├── content-type.spec.ts
│   │   ├── method-not-allowed.spec.ts
│   │   └── request-id.spec.ts
│   │
│   ├── idempotency/
│   │   └── concurrent-replay.spec.ts
│   │
│   └── e2e/
│       └── cardholder-transaction-journey.spec.ts
│
├── src/
│   ├── clients/
│   │   ├── api-client.ts
│   │   ├── account-client.ts
│   │   └── transaction-client.ts
│   │
│   ├── models/
│   │   ├── account.ts
│   │   └── transaction.ts
│   │
│   ├── fixtures/
│   │   └── test-fixtures.ts
│   │
│   ├── data/
│   │   ├── account-data.ts
│   │   ├── transaction-data.ts
│   │   └── c4-test-cases.ts
│   │
│   ├── config/
│   │   └── environment.ts
│   │
│   ├── assertions/
│   │   ├── account-assertions.ts
│   │   └── transaction-assertions.ts
│   │
│   └── utils/
│       ├── id-generator.ts
│       └── correlation.ts
│
├── schemas/
│   └── transactions.yaml
│
├── playwright.config.ts
├── package.json
└── .github/
    └── workflows/
        └── api-tests.yml
```

The important architectural seam is:

```text
Test cases
    ↓
Domain/API clients
    ↓
HTTP abstraction
    ↓
Environment configuration
    ↓
Mock / Staging
```

The tests should not need to change when moving from the contract-generated mock to staging.

---

# 5. How to Run

## 5.1 Prerequisites

Expected local tooling:

- Node.js
- npm
- Playwright
- The supplied OpenAPI YAML
- The configured mock/Prism service for local contract execution
- Access to staging for staging/pre-release execution

The exact repository scripts should remain the single source of truth if `package.json` provides them.

## 5.2 Install dependencies

```bash
npm ci
```

If the repository is being initialized for the first time:

```bash
npm install
npx playwright install
```

## 5.3 Run the default API suite

```bash
npx playwright test
```

## 5.4 Run against the local mock

The base URL should be configuration-driven rather than hard-coded into clients.

Example:

```bash
BASE_URL=http://localhost:8080 npx playwright test
```

On Windows PowerShell:

```powershell
$env:BASE_URL="http://localhost:8080"
npx playwright test
```

## 5.5 Run against staging

Example:

```bash
BASE_URL=$STAGING_URL npx playwright test
```

The test cases should remain unchanged; only the environment configuration changes.

## 5.6 Run a focused C4 suite

Examples:

```bash
npx playwright test tests/c4
```

or, using the repository's final test layout:

```bash
npx playwright test tests/accounts
npx playwright test tests/transactions
npx playwright test tests/cross-cutting
npx playwright test tests/idempotency
```

## 5.7 View the Playwright report

```bash
npx playwright show-report
```

## 5.8 Important execution rule

Retries are deliberately not used as a mechanism to turn failures green.

For a financial API:

```text
Assertion failure       → do not retry
Schema mismatch         → do not retry
Wrong HTTP status       → do not retry
Business-rule failure   → do not retry

Infrastructure timeout  → possibly retry
502/503                 → possibly retry
Process/environment     → possibly retry
```

If a first attempt fails and a retry succeeds, the result should remain visible as an intermittent/infrastructure result rather than being silently reported as a clean pass.

---

# 6. Oracle Classification

One of the most important design choices in this submission is that not every test expectation has the same authority.

Each test should be classified as one of:

| Oracle | Meaning |
|---|---|
| `CONTRACT` | Explicitly defined by the supplied OpenAPI contract |
| `HEARSAY` | Communicated outside the formal contract and therefore requires confirmation |
| `DOMAIN` | Financial/payment-domain expectation that should be agreed as a business rule |
| `ASSUMPTION` | Working assumption used to explore a risk, not a release requirement |
| `CONTRACT-GAP` | Behaviour cannot be objectively asserted because the contract does not define the necessary rule |

Example:

```text
POST /accounts valid request → 201
Oracle: CONTRACT
```

Whereas:

```text
document_number must be 10–14 digits
Oracle: HEARSAY / CONTRACT-GAP
```

The second statement must not be presented as a formal API requirement until the product/business rule is confirmed.

This distinction is intentional and is a key part of the quality strategy.

---

# 7. C1 — Risk and Release Assessment

## Highest-risk failure modes

| Rank | Failure mode | Impact | Likelihood | Risk |
|---:|---|---|---|---|
| 1 | Double debit / duplicate transaction | Catastrophic | High | P0 |
| 2 | Incorrect amount / balance | Catastrophic | Medium | P0 |
| 3 | Lost transaction / audit record | Catastrophic | Medium | P0 |
| 4 | Transaction/account inconsistency | Catastrophic | Medium | P0 |
| 5 | Unauthorized money movement | Catastrophic | Medium | P0 |
| 6 | Incorrect sign by operation type | High | Medium | P1 |
| 7 | Precision / rounding error | High | Medium | P1/P0 |
| 8 | Invalid account/document accepted | Medium/High | Medium | P1 |
| 9 | Poor latency | Medium | Unknown | P2 |
| 10 | Cosmetic/schema inconsistency | Low | Medium | P3 |

The critical risks are not cosmetic API issues. They are financial correctness and control failures.

## Release position

**NO-GO for production money movement.**

The service should not be trusted with real money until the following are defined, implemented and independently verified:

- Idempotency and replay semantics.
- Monetary precision and rounding.
- Currency.
- Account balance / available-credit semantics.
- Transaction validity rules and limits.
- Concurrency and atomicity.
- Authentication and authorization.
- Transaction/account consistency.
- Auditability and correlation.
- Structured error semantics.
- Required request fields.
- Stable transaction lifecycle semantics.
- Consumer contracts for critical downstream/upstream consumers.

---

# 8. C2 — Automation Strategy

## Framework goals

The automation framework is intended to demonstrate:

1. Clear separation between tests and API mechanics.
2. Mock → staging environment switching.
3. Deterministic and isolated test data.
4. CI execution strategy.
5. Parallel execution without corrupting shared payment state.
6. Reusable API clients and assertions.
7. Traceable test oracles.

## Environment model

```text
TEST_ENV
   │
   ├── mock
   │      └── localhost
   │
   └── staging
          └── staging URL
```

The test remains the same.

The API client should receive the configured base URL rather than owning environment-specific URLs.

## CI model

### PR gate

Target: approximately 5–10 minutes.

Run:

- Contract/schema validation.
- API smoke.
- Critical happy paths.
- Critical negative paths.
- Transaction operation types.
- Critical amount cases.
- Referential integrity.
- HTTP behaviour.

### Nightly

Run:

- Full functional suite.
- Complete document-number matrix.
- Full amount boundary matrix.
- Idempotency.
- Concurrency.
- Request/correlation ID checks.
- Large-payload/security cases.
- Consumer contract checks where available.

### Pre-release / staging

Run:

- Full regression.
- Contract validation.
- Integration checks.
- Idempotency/concurrency.
- Security checks.
- Performance smoke.
- Environment validation.
- Production-like data validation where appropriate.

---

# 9. C3 — Contract Audit

The contract is useful as a starting point, but it is under-specified for a production-grade payment/transaction core.

## Critical/high findings

### Required request fields

The account request's `document_number` is not explicitly marked required.

The transaction request's:

```text
account_id
amount
operation_type_id
```

are also not formally required.

A financial API should not allow an empty object or partially populated transaction to become ambiguous.

### Amount constraints

The contract does not define:

- Minimum.
- Maximum.
- Decimal precision.
- Currency.
- Rounding.
- Number of decimal places.
- Zero-value behaviour.
- Maximum digits.
- Scientific notation behaviour.
- Minor-unit representation.

### Operation type

The description defines four values, but the schema does not formally constrain the integer to:

```yaml
enum: [1, 2, 3, 4]
```

Therefore arbitrary values such as `999` are not prevented at schema level.

### Document number

The contract does not define:

- Minimum length.
- Maximum length.
- Pattern.
- Numeric-only requirement.
- Normalization.
- Whitespace behaviour.
- Uniqueness.
- Duplicate-account behaviour.

### Error model

The error model is essentially free text.

A structured model such as:

```json
{
  "code": "ACCOUNT_NOT_FOUND",
  "message": "Account does not exist",
  "details": []
}
```

would be much safer for automation and downstream consumers.

### Security

No authentication or authorization scheme is defined.

Questions that must be answered include:

- Who can create an account?
- Who can post a transaction?
- Can one caller access another customer's account?
- What scopes/roles are required?
- How are expired credentials handled?
- What should produce `401` vs `403`?

### Idempotency

No idempotency mechanism or replay semantics are defined.

This is a production-blocking concern for a money-moving API.

### Currency and financial representation

Currency is absent.

A payment transaction must have an explicit monetary representation and deterministic precision/rounding rules.

### Transaction lifecycle

The current response does not expose an explicit lifecycle such as:

```text
PENDING
AUTHORIZED
POSTED/COMPLETED
FAILED
REVERSED
REFUNDED
DECLINED
```

Whether every state is required depends on the service's architectural responsibility, but that responsibility must be explicitly defined.

### Balance and transaction history

The contract does not expose a balance source of truth or transaction retrieval/history APIs.

Without a balance oracle, the automation cannot contractually assert:

```text
balance_before
      ↓
transaction
      ↓
balance_after
```

and verify the financial invariant.

### Consumer safety

The submission proposes consumer-driven contracts for critical consumers:

```text
Mobile App
    ↕ Pact
Transactions Service
    ↕ Pact
Ledger Service
```

The ledger consumer is especially important because transaction ID, account ID, amount, type and event date must remain stable and semantically correct.

---

# 10. C4 — Executable Test Strategy

The proposed inventory is approximately 45–55 tests, intentionally prioritized rather than inflated for test-count purposes.

## Account coverage

```text
ACC-001 Create valid account
ACC-002 Verify created account
ACC-003 Get existing account
ACC-004 Get non-existent account
ACC-005 Missing document_number
ACC-006 null document_number
ACC-007 empty document_number
ACC-008 9-digit document
ACC-009 10-digit document
ACC-010 14-digit document
ACC-011 15-digit document
ACC-012 alphabetic document
ACC-013 alphanumeric document
ACC-014 special-character document
ACC-015 leading-zero document
ACC-016 duplicate document
```

## Transaction coverage

```text
TXN-001 Normal purchase
TXN-002 Installment purchase
TXN-003 Withdrawal
TXN-004 Credit voucher
TXN-005 Non-existent account
TXN-006 Unknown operation type
TXN-007 Missing account_id
TXN-008 Missing operation_type_id
TXN-009 Missing amount
```

## Amount coverage

```text
AMT-001 Zero
AMT-002 Negative
AMT-003 0.01
AMT-004 Sub-unit
AMT-005 50
AMT-006 100.50
AMT-007 High precision
AMT-008 Very large
AMT-009 Extreme large
AMT-010 Scientific notation
```

## Idempotency coverage

```text
IDEMP-001 First request
IDEMP-002 Exact replay
IDEMP-003 Same key / different amount
IDEMP-004 Same key / different account
IDEMP-005 Missing key
IDEMP-006 Concurrent same-key requests
```

## HTTP / cross-cutting

```text
HTTP-001 Wrong method
HTTP-002 Malformed JSON
HTTP-003 Wrong Content-Type
HTTP-004 Empty body
HTTP-005 Missing body
HTTP-006 Oversized body

REQ-001 Request ID on success
REQ-002 Request ID on error
REQ-003 Request ID uniqueness
```

---

# 11. Traceability Model

Every test should be traceable to:

```text
Test Case
   ↓
Risk
   ↓
Defect
   ↓
Oracle / Authority
   ↓
CI Gate
```

Representative examples:

| Case | Risk | Defect | Oracle | Gate |
|---|---|---|---|---|
| ACC-001 | Account creation failure | Valid account cannot be created | Contract | PR |
| ACC-004 | Referential integrity | Missing account incorrectly returns success | Contract | PR |
| TXN-001..004 | Sign correctness | Wrong debit/credit direction | Contract + domain interpretation | PR/Staging |
| AMT-002 | Invalid financial input | Negative amount processed | Contract | PR |
| AMT-001 | Invalid financial input | Zero amount processed | Domain | Nightly/Staging |
| IDEMP-002 | Double charge | Replay creates second financial posting | Contract gap / prediction | Staging |
| IDEMP-006 | Concurrency | Same logical transaction posted multiple times | Domain / prediction | Staging |
| REQ-001 | Traceability | Response has no request ID | Hearsay / contract gap | Staging |
| HTTP-001 | API contract violation | Unsupported method accepted | Contract | PR |

---

# 12. C5 — Prediction Register

The prediction strategy intentionally focuses on defects with direct financial impact.

## P-01 — Duplicate transaction / double charge

**Prediction:** submitting the same transaction twice may create two financial transactions because the contract does not define idempotency.

Confirming test:

```text
POST /transactions
same request
same logical transaction
submit twice
```

A result such as:

```text
Request 1 → 201 → transaction_id 101
Request 2 → 201 → transaction_id 102
```

would strongly indicate duplicate financial posting.

**Risk:** P0 / catastrophic.

## P-02 — Wrong debit/credit sign

Execute operation types 1–4 and verify the financial direction.

Expected domain interpretation:

```text
1 Normal Purchase       → debit
2 Installment Purchase  → debit
3 Withdrawal            → debit
4 Credit Voucher        → credit
```

**Risk:** P0/P1 depending on the agreed contract semantics.

## P-03 — Negative or zero amount bypass

The description says the caller should send a positive amount, but the schema does not formally enforce it.

Test:

```text
amount = -100
amount = 0
```

A transaction being created would be a serious financial validation defect once the business rule is formally confirmed.

## P-04 — Decimal / rounding defect

Test:

```text
10.99
0.01
high precision
repeated sub-unit values
```

Look for precision loss, rounding or truncation.

This cannot be fully asserted until currency and monetary precision rules are defined.

## P-05 — Invalid operation type accepted

Test:

```text
0
5
99
999
null
```

An unsupported operation should not create a financial transaction.

## P-06 — Concurrent transaction race condition

Send concurrent requests against the same controlled account.

The prediction is that an implementation without appropriate atomicity/locking could approve transactions based on stale financial state.

This requires a real service and an observable financial source of truth; a basic contract mock is insufficient.

## P-07 — Installment operation behaves like a normal transaction

The contract names an installment operation but provides no:

- installment count,
- schedule,
- interest,
- fees,
- due date,
- remaining balance,
- installment state.

This is partly a product/contract-definition gap rather than automatically an implementation defect.

## P-08 — Duplicate account creation for the same document

The account endpoint accepts a document number but does not define uniqueness.

A normal customer-account model would commonly require a duplicate to be rejected, but that must be explicitly agreed rather than invented as a contract requirement.

---

# 13. What Can Be Automated Now vs What Is Blocked

| Area | Status | Reason |
|---|---|---|
| OpenAPI/schema validation | Ready | Contract provides the schema |
| HTTP status validation | Ready | Published outcomes exist |
| Request/response shape | Ready | Schemas are available |
| Account happy path | Ready | Contract defines endpoint |
| Account lookup | Ready | Contract defines 200/404 behaviour |
| Transaction operation matrix | Ready | Four operation IDs are documented |
| Missing/wrong types | Ready | Schema-driven |
| Malformed JSON | Ready | Cross-cutting API test |
| Content-Type behaviour | Ready/partial | Behaviour needs stronger contract definition |
| Invalid operation type | Partial | Description says 1–4; schema lacks enum |
| Zero amount | Partial | Domain expectation; contract gap |
| Decimal precision | Blocked | Currency/precision rules absent |
| Balance reconciliation | Blocked | No balance/source-of-truth API |
| Idempotency | Blocked at contract level | No idempotency mechanism |
| Concurrency/atomicity | Blocked at mock level | Requires real implementation/state |
| Authentication | Blocked | Security contract absent |
| Refund/reversal | Blocked | Not represented |
| Installment schedule | Blocked | Missing model |
| Transaction history | Blocked | No history endpoint |
| Consumer Pact contracts | Pending | Consumer expectations need to be defined |

---

# 14. Deliberately Skipped / Not Claimed as Complete

This section is intentional. I did **not** convert every missing requirement into a made-up test expectation.

## 14.1 Real-money balance verification

**Skipped as a release assertion.**

Reason: the contract does not expose account balance or an equivalent financial source of truth.

I would not claim:

```text
balance_before - purchase = balance_after
```

until the service provides an authoritative observable balance/ledger state.

## 14.2 Idempotency implementation sign-off

**Not claimed as verified from the supplied contract/mock.**

Reason: there is no idempotency key or replay contract.

Required before production:

- Define key/header.
- Define replay semantics.
- Define same-key/different-payload behaviour.
- Define persistence/uniqueness boundary.
- Test concurrent replay.
- Verify exactly-once financial posting semantics.

## 14.3 Concurrency correctness

**Not claimed as proven by mock testing.**

Reason: concurrency and atomicity are implementation/system properties. They require the real service, controlled financial state and an authoritative post-transaction state.

## 14.4 Authentication / authorization

**Not implemented as a contract-driven requirement.**

Reason: the supplied contract contains no security scheme.

The production test plan should include:

```text
No token          → 401
Invalid token     → 401
Expired token     → 401
Insufficient scope → 403
Authorized caller → success
Cross-account access → forbidden
```

once the architecture/security model is defined.

## 14.5 Refund / reversal / chargeback

**Not treated as implemented features.**

Reason: a credit voucher must not automatically be interpreted as a refund, reversal or chargeback.

The product must define the semantics and API/event model first.

## 14.6 Installment schedule correctness

**Not claimed as testable end-to-end.**

Reason: the current model does not contain installment count, schedule, interest, fees, due date or remaining balance.

## 14.7 Transaction history / retrieval

**Not claimed as verifiable through the supplied API.**

Reason: the contract does not expose transaction retrieval/history.

## 14.8 Merchant/card/payment-method semantics

**Not invented.**

Reason: the current contract does not contain merchant, terminal, MCC, card token/payment method or authorization-code data. These are requirements to clarify, not assumptions to add silently.

## 14.9 Performance sign-off

**Not claimed as production performance validation.**

Reason: meaningful performance acceptance requires agreed SLO/SLA targets, expected transaction volume, concurrency, workload mix and production-like infrastructure.

The risk strategy identifies latency as important, but functional contract tests alone cannot establish production performance.

## 14.10 Mock fidelity

A passing Prism/mock test is **not treated as evidence that the real implementation is correct**.

The mock demonstrates that the automation harness can execute against the OpenAPI interpretation.

Real-service verification remains required for financial invariants, persistence, concurrency, idempotency, security and operational behaviour.

---

# 15. Performance / Production Quality Position

For a card payment/transaction service, performance must be evaluated as a business-quality characteristic, not only as raw response time.

The relevant production signals include:

- Transaction success/failure rate.
- Duplicate transaction rate.
- 5xx rate.
- P95/P99 latency.
- Timeout rate.
- Reconciliation mismatches.
- Transaction processing throughput.
- Error rate under peak concurrency.
- Resource saturation.
- Recovery behaviour.
- Financial consistency under load.

The quality dashboard proposed in C1 includes signals such as:

```text
Duplicate transaction rate
Transaction failure rate
5xx rate
P95 latency
Reconciliation mismatches
```

A performance gate should not pass merely because average latency is low if financial correctness degrades under concurrency.

---

# 16. Release Gates

The proposed release dashboard is:

```text
TRANSACTIONS SERVICE QUALITY

P0 DEFECTS                  MUST BE 0
CONTRACT BLOCKERS           MUST BE 0
CRITICAL TESTS              100% PASS
IDEMPOTENCY                 VERIFIED
MONEY PRECISION             VERIFIED
SECURITY GATE               VERIFIED
AUDITABILITY                VERIFIED

FINANCIAL CORRECTNESS
---------------------
Purchase sign correctness
Withdrawal sign correctness
Credit sign correctness
Invalid amount rejection
Precision validation
Balance reconciliation

AUTOMATION HEALTH
-----------------
Contract validation
API functional
Negative API
Critical E2E
Flaky tests
Environment failures

PRODUCTION SIGNALS
------------------
Duplicate transaction rate
Transaction failure rate
5xx rate
P95 latency
Reconciliation mismatches
```

Current release recommendation from the analysis:

> **NO-GO**

Reason:

> **Critical financial guarantees are not yet contractually observable, enforceable, or sufficiently verified against the real service.**

---

# 17. What I Would Require Before Trusting This Service With Real Money

This is the primary question I would defend in the debrief.

I would require the following before approving production money movement:

## P0 — Must be fixed

### 1. Idempotency

Define and implement:

- Idempotency key.
- Key scope.
- Replay semantics.
- Same key / same payload.
- Same key / different payload.
- Concurrent duplicate requests.
- Persistence/uniqueness guarantees.

### 2. Monetary correctness

Define:

- Currency.
- Monetary representation.
- Precision/scale.
- Rounding.
- Minimum/maximum transaction.
- Zero/negative rules.
- Overflow behaviour.
- Minor-unit storage and API round-trip semantics.

### 3. Financial invariants

Provide an authoritative source of truth for:

```text
before state
   ↓
transaction
   ↓
after state
```

and verify reconciliation.

### 4. Atomicity / concurrency

Demonstrate that concurrent transactions cannot create financially inconsistent state.

### 5. Authentication and authorization

Prove that:

- callers are authenticated,
- callers are authorized,
- account ownership/access is enforced,
- service-to-service access is controlled,
- credentials are handled correctly.

### 6. Transaction uniqueness and auditability

Every financial posting must be uniquely identifiable and traceable through:

```text
request ID
correlation ID
transaction ID
audit/reference ID
```

### 7. Contract completeness

Make critical rules machine-readable:

- `required`
- `enum`
- `minimum`
- `maximum`
- `pattern`
- `format`
- structured errors
- security requirements
- expected HTTP outcomes

---

# 18. P1 — Required Before Broad Production Confidence

- Transaction lifecycle/status.
- Reversal/refund semantics.
- Installment model.
- Transaction retrieval/history.
- Consumer contracts.
- API versioning.
- Rate limiting.
- Content negotiation.
- Standardized error codes.
- Account lifecycle rules.
- Document-number validation and uniqueness.
- Operational dashboards and alerting.

---

# 19. Debrief Talking Points

The debrief should not be presented as:

> "I wrote a lot of tests."

It should be presented as:

### 1. I started with the contract.

The OpenAPI is the formal authority.

### 2. I separated facts from assumptions.

A missing rule is not silently converted into a QA requirement.

### 3. I prioritized money-impacting failure modes.

Double debit, incorrect amount/sign, lost transaction state, unauthorized movement and financial inconsistency outrank cosmetic schema issues.

### 4. I designed the automation for a squad, not a one-off assignment.

The framework has:

- API clients.
- Fixtures.
- Data generation.
- Assertions.
- Configuration.
- Environment switching.
- CI gates.
- Traceability.

### 5. I would not over-trust the mock.

A contract-generated mock proves the harness and contract interpretation, not the production implementation.

### 6. My NO-GO is evidence-based.

The service is not being rejected because "more tests are needed."

It is being rejected because critical financial guarantees are currently absent or not observable enough to support a safe money-movement release.

---

# 20. Time Spent Per Artifact

I have intentionally **not fabricated elapsed time**. The assignment explicitly asks for time spent, and the values below should be replaced with the actual time recorded by the candidate before final submission.

| Artifact | Scope | Time spent |
|---|---|---:|
| C1 | Risk assessment, release position, performance/quality strategy | `[ENTER ACTUAL]` |
| C2 | Automation architecture, CI, environment/data/isolation strategy | `[ENTER ACTUAL]` |
| C3 | Contract audit, schema gaps, consumer/security analysis | `[ENTER ACTUAL]` |
| C4 | Test design, Playwright architecture, traceability, CI gates | `[ENTER ACTUAL]` |
| C5 | Prediction register, confirming tests, debrief reasoning | `[ENTER ACTUAL]` |
| Final integration | Consolidation, cross-artifact consistency, submission review | `[ENTER ACTUAL]` |
| **Total** | | **`[ENTER ACTUAL TOTAL]`** |

### Why this is deliberately left explicit

I would rather show an accurate time record than manufacture a polished but false number. The final submitted copy should contain the actual elapsed time from the work log/calendar/session record.

---

# 21. Definition of Done for This Assignment

I consider the submission complete when the reviewer can answer "yes" to all of the following:

- [x] The API contract has been reviewed critically.
- [x] Financial risks are ranked by business impact.
- [x] Automation architecture is reusable.
- [x] Mock and staging are configuration-driven.
- [x] Test data/isolation strategy is defined.
- [x] CI strategy distinguishes PR, nightly and pre-release suites.
- [x] Contract/schema validation is addressed.
- [x] API functional and negative testing is addressed.
- [x] Oracle authority is explicit.
- [x] C1 risks map into C4 tests.
- [x] C5 predictions have confirming-test strategies.
- [x] Missing product/contract rules are explicitly called out.
- [x] The mock is not treated as proof of production correctness.
- [x] A clear production NO-GO position is stated.
- [ ] Actual implementation execution results are claimed only where genuinely observed.
- [ ] Actual time spent is populated before final submission.

---

# 22. Final Position

## Would I trust the current service with real money?

**No — not yet.**

The service can support a useful API automation strategy and provides enough contract surface to begin meaningful testing. However, the current contract does not establish several guarantees that are fundamental to a production money-movement system.

The most important blockers are:

```text
IDEMPOTENCY
MONEY PRECISION / CURRENCY
FINANCIAL INVARIANTS
CONCURRENCY / ATOMICITY
AUTHENTICATION / AUTHORIZATION
AUDITABILITY / CORRELATION
TRANSACTION UNIQUENESS
CONTRACTUAL VALIDATION RULES
```

The required next step is not simply "write more tests."

The required next step is to make the critical financial behaviour **explicit, observable and enforceable**, implement it, and then independently verify it against the real service and production-like infrastructure.

That is the threshold I would require before changing the release position from:

> **NO-GO**

to:

> **GO for controlled production rollout.**
