# PISMO-4412 — QA Automation & Incident Regression Guardrail

## 1. Executive Summary

The simulated incident is a retry storm causing possible double-debits through `POST /transactions`. The required proof is:

**N concurrent requests with the same idempotency key must result in exactly one persisted transaction.**

The supplied Swagger contract documents `POST /transactions`, its request body, and its `201` response, but does **not** document an `Idempotency-Key` header or any transaction list/count/read capability. Therefore, the current published API cannot independently prove the strongest requirement: **exactly one persisted transaction**.

A Playwright/TypeScript concurrency test can be implemented now to verify that successful requests resolve to one `transaction_id`, but that is an intermediate signal, not authoritative proof of one persisted row.

## 2. Contract Findings

`POST /transactions` accepts:

JSON :
{
  "account_id": 1,
  "amount": 50,
  "operation_type_id": 1
}


The contract states operation types:

- `1` — Normal Purchase
- `2` — Purchase with installments
- `3` — Withdrawal
- `4` — Credit Voucher

The client sends a positive amount; the server applies the appropriate sign.

The `201 Created` response contains:

json
{
  "account_id": 1,
  "amount": -100.5,
  "event_date": "2026-05-28T17:00:00Z",
  "operation_type_id": 1,
  "transaction_id": 1,
  "type": "debit"
}
 |

The published contract does not document:

- `Idempotency-Key`
- idempotency key in the request body
- idempotency key in the response
- transaction list/read/search endpoint
- transaction count
- transaction lookup by idempotency key

## 3. Verification Design

### Scenario

 |text
N concurrent POST /transactions
          |
          | same Idempotency-Key
          | same payload
          v
    Transaction service
          |
          v
 exactly one persisted transaction
 |

Start with `N = 20`. A nightly stress matrix can later use `2, 10, 20, 50, 100`.

### Playwright implementation

 |typescript
import { test, expect } from '@playwright/test';
import crypto from 'node:crypto';

const N = Number(process.env.IDEMPOTENCY_CONCURRENCY ?? 20);

type TransactionResponse = {
  account_id: number;
  amount: number;
  event_date: string;
  operation_type_id: number;
  transaction_id: number;
  type: string;
};

test('same idempotency key creates exactly one transaction', async ({ request }) => {
  const idempotencyKey = `qa-pismo-4412-${crypto.randomUUID()}`;
  const accountId = Number(process.env.TEST_ACCOUNT_ID);

  test.skip(!Number.isInteger(accountId));

  const payload = {
    account_id: accountId,
    amount: 50,
    operation_type_id: 1,
  };

  const responses = await Promise.all(
    Array.from({ length: N }, () =>
      request.post('/transactions', {
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        data: payload,
      })
    )
  );

  const created = responses.filter(r => r.status() === 201);

  expect(created.length).toBeGreaterThan(0);

  const bodies = (
    await Promise.all(created.map(r => r.json()))
  ) as TransactionResponse[];

  const ids = bodies.map(b => b.transaction_id);

  expect(new Set(ids).size).toBe(1);
});
 |

Use `Promise.all()` because this incident is about a race. Sequential requests do not reproduce the concurrency condition.

## 4. Critical Observability Finding

This assertion:

 |typescript
expect(new Set(ids).size).toBe(1);
 |

proves only that successful responses resolve to one logical transaction ID.

It does **not** prove that storage contains one transaction.

For example:

 |text
Request A -> INSERT transaction 101 -> return 101
Request B -> INSERT transaction 102 -> replay 101
 |

The API could return `101` to every caller while two records exist.

Therefore:

> **Response replay consistency is not the same as persistence-level idempotency.**

### Release decision

With the current published contract:

> **QA cannot independently sign off the release against the requirement "exactly one transaction was created."**

This is an observability/contract gap, not a reason to weaken the acceptance criterion.

## 5. Minimum Contract Change

Development should publish:

### Request

 |http
Idempotency-Key: <unique-key>
 |

for `POST /transactions`.

### Semantics

Same key + same payload:

 |text
same logical transaction
no second transaction
 |

### Conflict semantics

Same key + different payload must have explicitly defined behavior, e.g.:

 |http
409 Conflict
 |

### Authoritative audit/read path

For example:

 |http
GET /transactions?account_id=<id>&idempotency_key=<key>
 |

returning enough information to establish:

 |json
{
  "count": 1,
  "transactions": [...]
}
 |

Then the definitive Playwright assertion becomes:

 |typescript
const audit = await request.get(
  `/transactions?account_id=${accountId}&idempotency_key=${idempotencyKey}`
);

expect(audit.status()).toBe(200);
expect((await audit.json()).count).toBe(1);
 |

## 6. Root-Cause Hypotheses

### 1. Check-then-insert race — highest likelihood

 |text
A -> key exists? NO
B -> key exists? NO
A -> INSERT
B -> INSERT
 |

**Discriminator:** multiple persisted transaction IDs for the same idempotency key.

### 2. Idempotency record written too late

Possible flow:

 |text
create transaction
commit
record idempotency key
 |

**Discriminator:** distributed trace shows transaction creation preceding durable idempotency reservation.

### 3. Distributed idempotency-store inconsistency

Different service nodes may see different idempotency state.

**Discriminator:** duplicates correlate with service instances, regions, stores, or replication/visibility delays.

## 7. Regression Guardrail

The exact test should be a blocking CI gate.

### PR gate

 |text
T1 concurrency test
N = 20
mock
retries = 0
 |

### Staging/release gate

 |text
T1 concurrency test
N = 20
staging
retries = 0
 |

The same test code should run against both environments by changing only `BASE_URL`.

## 8. Avoiding False-Green CI

Do **not** retry this test.

Bad:

 |typescript
retries: 3
 |

A race can fail once and pass on retry, producing a misleading green build.

Use:

 |typescript
retries: 0
 |

Also keep Playwright workers controlled; concurrency is deliberately generated inside the test with `Promise.all()`.

## 9. Mock → Staging

Use:

 |typescript
use: {
  baseURL: process.env.BASE_URL ?? 'http://localhost:8080'
}
 |

Mock:

 |bash
BASE_URL=http://localhost:8080 TEST_ACCOUNT_ID=1 npx playwright test tests/pismo-4412-idempotency.spec.ts
 |

Staging:

 |bash
BASE_URL=$STAGING_BASE_URL TEST_ACCOUNT_ID=1 npx playwright test tests/pismo-4412-idempotency.spec.ts
 |

No test-code change is required.

## 10. Production Metric / Alert

Preferred signal:

 |text
duplicate_transaction_count
 |

Conceptually detect:

 |sql
SELECT idempotency_key, COUNT(*)
FROM transactions
GROUP BY idempotency_key
HAVING COUNT(*) > 1;
 |

Recommended threshold:

> **Any confirmed duplicate transaction should trigger a high-severity alert.**

Source:

- transaction database, or
- financial reconciliation pipeline

Page:

- Payments Ops
- Transactions service on-call

A replay/conflict-rate metric is useful as a secondary signal but cannot replace authoritative duplicate detection.

## 11. Systemic Fix

The engineering solution should close the entire class of defect:

1. Document `Idempotency-Key`.
2. Define same-key replay semantics.
3. Define same-key/different-payload conflict semantics.
4. Enforce persistence-level uniqueness for the correct business scope.
5. Make idempotency reservation and transaction creation atomic.
6. Expose authoritative audit/read capability.
7. Keep the concurrency regression test permanently in CI.
8. Disable retries for the regression gate.
9. Add production duplicate detection and paging.
10. Add idempotency requirements to engineering code review.

## 12. Code Review Checklist

 |text
[ ] Idempotency mechanism explicitly defined
[ ] Idempotency key documented in API contract
[ ] Same-key replay behavior documented
[ ] Same-key/different-payload behavior documented
[ ] Persistence uniqueness constraint exists
[ ] Concurrent request test exists
[ ] Test validates persisted count where possible
[ ] Test runs with retries disabled
[ ] Test runs against staging before release
[ ] Production duplicate metric exists
[ ] Production alert exists
[ ] Operational owner identified
 |

## 13. Recommended Repository Structure

 |text
qa-automation/
├── tests/
│   └── pismo-4412-idempotency.spec.ts
├── fixtures/
│   └── test-data.ts
├── utils/
│   └── transaction-api.ts
├── playwright.config.ts
├── package.json
├── CI configuration
└── docs/
    └── T1-PISMO-4412.md
 |

## 14. Acceptance Criteria

### Verifiable now

- [x] Generate unique idempotency key
- [x] Send N concurrent requests
- [x] Use the same request payload
- [x] Verify successful responses resolve to one transaction ID
- [x] Disable retries
- [x] Run against mock
- [x] Point unchanged test at staging using `BASE_URL`

### Blocked by current contract

- [ ] Query persisted transactions by idempotency key
- [ ] Assert persisted count == 1

## 15. Submission-Ready Incident Summary

> **PISMO-4412 — Idempotency Regression Guardrail**
>
> The defect under investigation is duplicate financial transaction creation during concurrent retries of `POST /transactions`.
>
> The verification test sends N concurrent requests using the same idempotency key and identical transaction payload. The regression test is implemented in Playwright/TypeScript using `Promise.all()` to create genuine request concurrency.
>
> The current API contract permits verification that successful concurrent responses resolve to a single `transaction_id`, but it does not expose an authoritative transaction lookup/count mechanism or document an `Idempotency-Key` request header. Consequently, the published API cannot prove the stronger requirement that exactly one transaction was persisted.
>
> QA therefore cannot independently sign off the full exactly-one guarantee until development exposes an authoritative audit/read capability and documents the idempotency contract.
>
> The most likely root cause is a check-then-insert race, followed by late idempotency-record persistence and distributed idempotency-store consistency issues. The discriminating evidence should come from transaction persistence records, distributed tracing, and idempotency-store behavior.
>
> The regression test should be a blocking CI gate with retries disabled. It should run against the mock during PR validation and the same unchanged test should run against staging before release.
>
> Production protection should include a duplicate-transaction reconciliation metric, alerting on any confirmed duplicate, sourced from the transaction database or reconciliation pipeline and paging Payments Ops plus the Transactions service on-call.
>
> The systemic fix is to combine an explicit idempotency API contract, atomic idempotency reservation and transaction creation, persistence-level uniqueness enforcement, authoritative auditability, a permanent concurrency regression test, production monitoring, and an engineering review checklist.

## 16. Final T1 Position

The strongest QA/Staff-level conclusion is not simply:

"I wrote a Playwright test and it passes."

It is:

**"I designed the concurrency test, identified exactly what it proves, identified what the current API cannot prove, refused to equate response replay with persistence correctness, specified the minimum contract change required for authoritative verification, added a zero-retry regression guardrail, and defined the production and systemic controls needed to prevent recurrence."**
