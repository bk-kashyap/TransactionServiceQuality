# T2 — Performance Testing Strategy
## Transactions Service | Card Payment Domain | k6

**Audience:** Development Manager, Product Owner, Engineering / QA Team  
**Primary tool:** k6  
**API contract:** `transactions-service.v1(2).yaml`

---

## 1. Executive Summary

This document defines a production-oriented performance testing strategy for the Transactions Service described in the supplied OpenAPI/YAML contract.

The service is a Pismo-style transactions service for managing cardholder accounts and recording financial operations. The primary performance scope is:

- `POST /transactions`
- `POST /accounts`
- `GET /accounts/{accountId}` as a supporting read workload
- Concurrent/idempotency testing on the transaction path
- Throughput, latency and technical error-rate measurement
- Financial correctness under load
- Same-account concurrency and contention
- Database/application/infrastructure observability
- Performance regression detection

> **For a card-payment transaction service, performance is not only speed. A successful performance test must demonstrate sufficient capacity and acceptable latency while preserving financial correctness, consistency and idempotency under realistic concurrency.**

---

## 2. Scope and API Contract

The YAML defines the transaction request as:

```json
{
  "account_id": 1,
  "amount": 50,
  "operation_type_id": 1
}
```

The response contains:

```json
{
  "account_id": 1,
  "amount": -100.5,
  "event_date": "2026-05-28T17:00:00Z",
  "operation_type_id": 1,
  "transaction_id": 1,
  "type": "debit"
}
```

`POST /transactions` documents `201`, `400`, `405`, and `422` responses. The endpoint records a financial operation against an existing account and defines four operation types: Normal Purchase, Purchase with installments, Withdrawal, and Credit Voucher. The request amount is positive; the server applies the correct sign based on operation type.

`POST /accounts` accepts `document_number` and returns `account_id` and `document_number` on successful creation.

### Important idempotency observation

The supplied YAML does **not** document an `Idempotency-Key` header or an idempotency response contract. However, the assignment explicitly requires concurrency testing on the idempotency path.

Therefore:

> Idempotency must be confirmed with the service implementation/team before the final performance test is considered contract-complete. It should not be represented as an existing YAML-defined API feature unless the implementation provides it.

---

## 3. Why k6?

k6 is the selected primary performance-testing tool.

| Requirement | k6 suitability |
|---|---|
| REST API testing | Excellent |
| JSON payloads | Native |
| Parameterisation | Excellent |
| TPS/RPS modelling | Excellent |
| Virtual users/concurrency | Excellent |
| Thresholds/SLOs | Native |
| Custom metrics | Native |
| Version control | Excellent |
| CI/CD integration | Excellent |
| Lightweight execution | Excellent |
| API regression testing | Excellent |

k6 allows performance tests to be version-controlled alongside application and API tests.

Recommended structure:

```text
performance/
├── k6/
│   ├── transactions.js
│   ├── accounts.js
│   ├── idempotency.js
│   ├── account-contention.js
│   └── thresholds.js
├── data/
│   ├── accounts.json
│   └── transactions.json
└── README.md
```

k6 should be the source of truth for automated performance gates.

---

# 4. Performance in the Card Payment Domain

A generic REST API performance test commonly measures:

- Requests/sec
- Average response time
- Error rate

That is insufficient for a financial transaction service.

A card-payment performance strategy must evaluate:

```text
Capacity
   +
Latency
   +
Reliability
   +
Concurrency
   +
Financial correctness
   +
Idempotency
   +
Data consistency
   +
Dependency behaviour
```

The key business question is:

> **Can the service sustain the required payment transaction volume within the agreed latency and reliability objectives without creating incorrect, duplicated, missing or inconsistent financial transactions?**

---

# 5. Business-Critical Performance Parameters

## 5.1 Throughput

Measure:

- Transactions Per Second (TPS)
- Requests Per Second (RPS)
- Sustained TPS
- Peak TPS
- Burst TPS

For this service, `POST /transactions` is the primary TPS measurement.

## 5.2 Latency

Measure:

- p50
- p90
- p95
- p99
- Maximum latency

Do not rely on average latency alone. Tail latency is especially important for payment systems.

## 5.3 Technical Error Rate

Measure separately:

- HTTP 2xx
- HTTP 4xx
- HTTP 5xx
- Timeouts
- Connection failures
- Application errors

A business rejection is not automatically equivalent to a technical failure.

## 5.4 Business Outcomes

Where the real payment architecture exposes these concepts, distinguish:

- Approved transactions
- Business declines
- Technical failures
- Timeouts
- Dependency failures

The current YAML is a transaction-recording service contract and does not itself expose card-network authorization or issuer-decision semantics. Those should only be measured if they exist in the real architecture.

---

# 6. Financial Correctness Is a Performance Requirement

A financial system cannot be declared successful merely because it is fast.

Example:

```text
1000 TPS
p95 = 50 ms
```

but:

```text
2 duplicate debits
```

must be considered a failure.

Therefore:

> **Performance success = Capacity + Latency + Reliability + Financial Correctness.**

Validate under load:

- No duplicate financial effects
- No missing transactions
- No unexpected transactions
- Correct account association
- Correct amount
- Correct operation type
- Correct transaction response
- Consistent transaction state

---

# 7. Idempotency and Concurrent Requests

The assignment explicitly requires concurrency on the idempotency path.

This is critical because payment clients may retry after:

- Network timeout
- Gateway timeout
- Client timeout
- Temporary service failure
- Lost response
- User retry

Expected behaviour for the same logical payment:

```text
Requests received: 2
Financial effects: 1
```

not:

```text
Requests received: 2
Financial effects: 2
```

## Idempotency concurrency matrix

| Concurrent requests | Expected financial effects |
|---:|---:|
| 1 | 1 |
| 2 | 1 |
| 5 | 1 |
| 10 | 1 |
| 25 | 1 |
| 50 | 1 |
| 100 | 1 |

The same logical idempotency key should be used for requests representing the same payment.

### Critical assertion

```text
Duplicate financial effects = 0
```

This is a business correctness invariant, not merely a latency SLO.

---

# 8. Same-Account Concurrency

Run multiple transactions concurrently against the same account.

Example:

```text
Account 1001

Request 1 → debit 100
Request 2 → debit 200
Request 3 → debit 300
Request 4 → debit 400
```

Expected aggregate financial effect:

```text
1000
```

This can expose:

- Race conditions
- Lost updates
- Database locking problems
- Serialization bottlenecks
- Deadlocks
- Transaction isolation issues
- Hot-row contention

---

# 9. Transaction Mix

The YAML defines:

| Operation Type | Description |
|---:|---|
| 1 | Normal Purchase |
| 2 | Purchase with installments |
| 3 | Withdrawal |
| 4 | Credit Voucher |

Do not test only operation type `1`.

Initial test assumption:

| Operation | Percentage |
|---|---:|
| Normal Purchase | 70% |
| Installment Purchase | 15% |
| Withdrawal | 5% |
| Credit Voucher | 10% |

These are test assumptions, not production facts. Replace them with production telemetry when available.

---

# 10. Transaction Amount Distribution

Do not use one fixed amount for every request.

Test:

- Small transactions
- Medium transactions
- Large transactions
- Boundary values
- Maximum supported values
- Decimal values where applicable

Example test distribution:

```text
Small:   10–100
Medium:  100–5,000
Large:   5,000–50,000
```

The production distribution should come from business data.

---

# 11. Account Distribution

Test different account distributions because database contention can change dramatically.

### Scenario A — Many accounts

```text
Large account population
100 TPS
```

### Scenario B — Few accounts

```text
Small account population
100 TPS
```

### Scenario C — Single hot account

```text
1 account
100 TPS
```

The hot-account scenario is useful for discovering:

- Row locks
- Serialization
- Connection contention
- Database hotspots
- Lost updates
- Deadlocks

---

# 12. Initial SLOs

The supplied YAML does not define production performance SLOs.

Therefore the following are **initial engineering assumptions for the assignment** and must not be presented as industry-mandated values.

| Metric | Initial SLO | Rationale |
|---|---:|---|
| Sustained throughput | 100 TPS | Assignment engineering assumption |
| p95 latency | ≤ 500 ms | Initial API performance target |
| p99 latency | ≤ 1000 ms | Initial tail-latency target |
| Technical error rate | ≤ 1% | Initial load-test ceiling |
| 5xx rate | ≤ 0.1% | Recommended stricter technical target |
| Duplicate financial effects | 0 | Business correctness invariant |
| Missing financial effects | 0 | Business correctness invariant |

### Source of the numbers

**100 TPS:** No production traffic profile was supplied. This is a demonstrable starting target.

**p95 ≤ 500 ms:** Initial engineering target for an interactive API. It should ultimately be derived from product and architecture requirements.

**p99 ≤ 1000 ms:** Initial tail-latency guardrail.

**Technical error rate ≤ 1%:** Initial performance-test ceiling. Production SLOs should ultimately be tied to the service's availability/error-budget policy.

**Duplicate/missing effects = 0:** Financial correctness invariants, not invented performance targets.

---

# 13. Where Production SLOs Should Come From

Replace assignment assumptions with evidence from:

- Production transaction volume
- Peak traffic
- Business growth forecast
- Merchant/customer expectations
- Existing SLAs/SLOs
- Payment authorization requirements
- Downstream timeout budgets
- Infrastructure capacity
- Database capacity
- Error budgets
- Historical latency data

Example capacity model:

```text
Peak production TPS
        ×
Expected growth
        ×
Capacity/safety factor
        =
Required capacity target
```

The actual safety factor should be agreed with architecture/engineering.

---

# 14. Recommended Performance Workloads

## Smoke

```text
1 TPS
1 minute
```

Purpose: validate environment, k6 script, payload, authentication and metrics.

## Baseline

```text
10 TPS
5 minutes
```

Purpose: establish a clean performance baseline.

## Normal

```text
50 TPS
10 minutes
```

Purpose: represent normal operating conditions.

## Target

```text
100 TPS
10 minutes
```

Purpose: validate declared SLOs.

Expected:

```text
TPS >= 100
p95 <= 500 ms
p99 <= 1000 ms
technical error <= 1%
duplicate effects = 0
```

## Stress

```text
200 TPS
10 minutes
```

Purpose: identify capacity limits and degradation behaviour.

## Spike

```text
10 TPS → 200 TPS
```

Purpose: burst handling, autoscaling, connection creation, queues and recovery.

## Soak

```text
100 TPS
2–4 hours
```

Purpose: detect memory leaks, connection leaks, resource exhaustion and gradual degradation.

## Recovery

Introduce dependency slowdown/failure, then restore it and measure:

- Error recovery
- Latency recovery
- Queue drain
- Connection recovery
- Return-to-normal time

---

# 15. Recommended Test Matrix

| Test | Load | Duration | Objective |
|---|---:|---:|---|
| Smoke | 1 TPS | 1 min | Harness validation |
| Baseline | 10 TPS | 5 min | Baseline |
| Normal | 50 TPS | 10 min | Normal capacity |
| Target | 100 TPS | 10 min | SLO validation |
| Stress | 200 TPS | 10 min | Capacity discovery |
| Spike | 10→200 TPS | 5 min | Burst behaviour |
| Soak | 100 TPS | 2–4 hr | Stability |
| Idempotency | 10/25/50/100 concurrent | Short burst | Duplicate protection |
| Hot account | 100 TPS | 10 min | Account contention |
| Mixed accounts | 100 TPS | 10 min | Realistic distribution |

---

# 16. k6 Test Design

## `POST /transactions`

Parameterise:

- `BASE_URL`
- `ACCOUNT_ID`
- `AMOUNT`
- `OPERATION_TYPE_ID`
- `TARGET_TPS`
- `DURATION`

Representative request:

```javascript
const payload = JSON.stringify({
    account_id: Number(__ENV.ACCOUNT_ID || 1),
    amount: Number(__ENV.AMOUNT || 50),
    operation_type_id: Number(
        __ENV.OPERATION_TYPE_ID || 1
    ),
});

const response = http.post(
    `${BASE_URL}/transactions`,
    payload,
    {
        headers: {
            'Content-Type': 'application/json',
        },
        tags: {
            endpoint: 'POST /transactions',
        },
    }
);
```

The implementation should validate HTTP `201` and important response fields rather than treating any HTTP response as success.

## Example execution

```bash
k6 run   -e BASE_URL=http://localhost:8080   -e ACCOUNT_ID=1   -e AMOUNT=100   -e OPERATION_TYPE_ID=1   -e TARGET_TPS=100   -e DURATION=10m   performance/k6/transactions.js
```

---

# 17. k6 Thresholds

Recommended initial thresholds:

```javascript
thresholds: {
    http_req_failed: ['rate<0.01'],

    http_req_duration: [
        'p(95)<500',
        'p(99)<1000',
    ],

    transaction_errors: [
        'rate<0.01',
    ],

    transaction_latency: [
        'p(95)<500',
        'p(99)<1000',
    ],
}
```

These thresholds directly represent the initial assignment SLOs.

---

# 18. `/accounts` Performance

`POST /accounts` accepts:

```json
{
    "document_number": "12345678900"
}
```

Successful creation returns `201 Created`.

The performance test should generate unique document numbers for new-account workloads.

Otherwise the test may measure duplicate validation rather than actual account-creation capacity.

---

# 19. `/accounts/{accountId}` Supporting Workload

Although not the primary T2 endpoint, `GET /accounts/{accountId}` can be included in a mixed workload to evaluate read/write interaction and database contention.

Example:

```text
80% POST /transactions
10% POST /accounts
10% GET /accounts/{accountId}
```

These percentages are test assumptions and should eventually be replaced with production traffic mix.

---

# 20. Database Performance

Monitor:

- DB CPU
- DB memory
- Active connections
- Connection pool utilisation
- Query latency
- Slow queries
- Transactions/sec
- Lock waits
- Deadlocks
- Disk I/O
- Transaction commits
- Transaction rollbacks

Investigate especially:

```text
Account lookup
Transaction insert
Account state/balance update
Idempotency storage/check
```

---

# 21. Application Performance

Monitor:

- CPU
- Memory
- GC
- Thread/worker utilisation
- Active requests
- Request queues
- Connection pools
- Application restarts
- GC pauses

Correlate:

```text
TPS
vs
p95/p99
vs
CPU
vs
DB CPU
vs
DB latency
```

---

# 22. Infrastructure Performance

Monitor:

- CPU
- Memory
- Network throughput
- Network latency
- Packet loss
- Disk IOPS
- Disk latency
- Container throttling
- Pod/container restarts
- Load balancer utilisation
- Autoscaling events

The load generator must also be monitored.

---

# 23. Load Generator Health

A performance test becomes unreliable if k6 itself is saturated.

Monitor:

- Load-generator CPU
- Load-generator memory
- Network utilisation
- Request-generation rate
- Dropped iterations
- k6 execution errors

If the generator cannot produce the requested load, the result should not be used to make a service-capacity claim.

---

# 24. Mock Environment Limitations

A mock environment can validate:

- k6 script correctness
- Request generation
- Payload correctness
- Parameterisation
- Header handling
- Concurrency mechanics
- Threshold configuration
- Reporting
- CI integration

It cannot establish:

- Real application capacity
- Database performance
- Database locking
- Transaction commit latency
- Real persistence behaviour
- Real idempotency-store contention
- Downstream service latency
- Production infrastructure capacity
- Real autoscaling behaviour
- Real p95/p99 service capacity

> **A mock performance run validates the performance-test harness and request-generation behaviour; it does not establish the performance capacity of the real service.**

---

# 25. Requirements Before Performance Numbers Are Meaningful

Before claiming that the service supports a specific TPS, the environment should be production-like.

### Application

- Production-like build
- Production-like configuration
- Equivalent important runtime settings

### Database

- Production-like DB engine/version
- Representative data volume
- Representative indexes
- Representative connection limits

### Infrastructure

- Comparable CPU/memory
- Comparable container/pod limits
- Comparable autoscaling
- Comparable network path
- Comparable load balancing

### Data

- Realistic number of accounts
- Realistic transaction history
- Realistic account distribution
- Realistic transaction amounts
- Realistic operation mix

### Dependencies

Identify whether dependencies are:

- Real
- Sandbox
- Stubbed
- Mocked

Also model realistic latency, rate limits, timeouts and failures.

---

# 26. Financial Data Validation

Every successful transaction should be validated beyond HTTP status.

Validate:

- `transaction_id` exists
- `account_id` is correct
- `amount` has the expected value/sign
- `operation_type_id` is correct
- `event_date` is valid
- Transaction type is correct

Example:

```text
Request:
account_id = 1
amount = 100
operation_type_id = 1

Expected:
HTTP 201
transaction_id != null
account_id = 1
expected amount/sign
operation_type_id = 1
```

---

# 27. End-of-Test Financial Reconciliation

Include an independent reconciliation step.

Example:

```text
Transactions submitted: 10,000
Expected financial effects: 10,000
Persisted financial effects: 10,000
Duplicate effects: 0
Missing effects: 0
Unexpected effects: 0
```

Any mismatch should be considered a failure irrespective of latency.

---

# 28. Performance Regression Gate

Recommended CI/CD flow:

```text
Build
  ↓
Unit tests
  ↓
API/integration tests
  ↓
Deploy performance candidate
  ↓
Environment health check
  ↓
Warm-up
  ↓
Performance test
  ↓
Infrastructure health validation
  ↓
Baseline comparison
  ↓
PASS / FAIL / INCONCLUSIVE
```

---

# 29. PASS / FAIL / INCONCLUSIVE

## PASS

The application meets the agreed performance and correctness criteria.

## FAIL

There is sufficient evidence of application/service regression.

## INCONCLUSIVE

The result cannot reliably determine service performance because of infrastructure/test-environment problems.

Examples:

- Load-generator saturation
- DB infrastructure issue
- Network incident
- Unexpected autoscaling instability
- Unrelated workload
- Dependency outage
- Deployment during test
- Insufficient sample size

This protects CI/CD from false failures.

---

# 30. Regression Rules

Example initial rules:

### FAIL if

```text
p95 > 500 ms
```

or:

```text
p99 > 1000 ms
```

or:

```text
technical error rate > 1%
```

or:

```text
achieved throughput < required target
```

or:

```text
duplicate financial effect > 0
```

or:

```text
missing financial effect > 0
```

or:

```text
statistically meaningful regression versus trusted baseline
```

---

# 31. Historical Baseline

Use a rolling set of trusted performance runs.

Example:

```text
Run 1 = 470 ms
Run 2 = 480 ms
Run 3 = 475 ms
Run 4 = 490 ms
Run 5 = 485 ms
```

Use the median:

```text
Baseline p95 = 480 ms
```

Candidate:

```text
Candidate p95 = 550 ms
```

Regression:

```text
(550 - 480) / 480 × 100
= 14.6%
```

The actual regression threshold should be agreed with engineering.

---

# 32. Avoiding False Failures

Before failing a build, check:

- Was the load generator healthy?
- Was the application healthy?
- Was the database healthy?
- Was the network healthy?
- Was autoscaling stable?
- Was another workload consuming resources?
- Was there an infrastructure incident?
- Was there a deployment during the test?
- Was a dependency unavailable?
- Was the sample size sufficient?

If the environment was unhealthy:

```text
Result = INCONCLUSIVE
```

not:

```text
Application = FAIL
```

---

# 33. Performance Report

Each run should capture:

### Test information

- Build/version
- Environment
- Test date/time
- Test duration
- Scenario

### Traffic

- Target TPS
- Achieved TPS
- Total requests
- Successful requests

### Latency

- p50
- p90
- p95
- p99
- Max

### Errors

- 4xx
- 5xx
- Timeouts
- Connection failures

### Business correctness

- Transactions submitted
- Transactions persisted
- Duplicate effects
- Missing transactions
- Unexpected transactions
- Amount mismatches

### Infrastructure

- Application CPU
- Application memory
- DB CPU
- DB latency
- DB connections
- Lock waits
- Deadlocks
- Autoscaling events

### Regression

- Historical baseline
- Current result
- Regression percentage
- Statistical assessment
- Final decision

---

# 34. Example Executive Result

```text
====================================================
CARD TRANSACTION PERFORMANCE TEST
====================================================

Build:              v1.4.2
Environment:        Performance
Duration:           10 minutes

Target TPS:         100
Achieved TPS:       101.4
Requests:           60,840

LATENCY
----------------------------------------------------
p50:                120 ms
p90:                280 ms
p95:                410 ms
p99:                780 ms
Max:               1800 ms

ERRORS
----------------------------------------------------
4xx:                0.12%
5xx:                0.03%
Timeouts:           0.01%
Technical errors:   0.04%

BUSINESS CORRECTNESS
----------------------------------------------------
Submitted:          60,840
Persisted:          60,840
Duplicate effects:  0
Missing:            0

INFRASTRUCTURE
----------------------------------------------------
Application CPU:    62%
Application Memory: 68%
DB CPU:             71%
DB Connections:     54%
Lock waits:         Low

SLO
----------------------------------------------------
TPS >= 100          PASS
p95 <= 500 ms       PASS
p99 <= 1000 ms      PASS
Errors <= 1%        PASS
Duplicates = 0      PASS

FINAL RESULT
----------------------------------------------------
PASS
====================================================
```

---

# 35. Business-Standard Parameter Summary

| Category | Parameter | Importance |
|---|---|---|
| Capacity | TPS/RPS | Processing capacity |
| Capacity | Peak TPS | Peak business demand |
| Capacity | Burst TPS | Sudden demand |
| Latency | p50 | Typical experience |
| Latency | p95 | Main user experience |
| Latency | p99 | Tail experience |
| Reliability | 5xx | Technical failures |
| Reliability | Timeout rate | Payment uncertainty |
| Reliability | Connection failures | Infrastructure health |
| Business | Success rate | Processing outcome |
| Business | Decline rate | Business outcome where applicable |
| Integrity | Duplicate rate | Financial correctness |
| Integrity | Missing transaction rate | Financial correctness |
| Integrity | Amount mismatch | Financial correctness |
| Integrity | Account mismatch | Financial correctness |
| Idempotency | Duplicate financial effect | Critical invariant |
| Concurrency | Same-account TPS | Contention |
| Concurrency | Same-key concurrency | Idempotency |
| Database | Query latency | Persistence bottleneck |
| Database | Lock waits | Contention |
| Database | Deadlocks | Stability/correctness |
| Database | Connection pool | Capacity |
| Application | CPU | Saturation |
| Application | Memory | Saturation/leaks |
| Application | GC | Runtime behaviour |
| Infrastructure | Network latency | Transport/dependency |
| Scaling | Autoscaling response | Burst handling |
| Recovery | Recovery time | Resilience |
| Stability | Soak degradation | Long-running behaviour |

---

# 36. Definition of Done

- [ ] k6 selected and justified
- [ ] SLOs documented before implementation
- [ ] Source/rationale for every SLO documented
- [ ] `POST /transactions` implemented
- [ ] `POST /accounts` implemented
- [ ] Tests parameterised
- [ ] Transaction mix implemented
- [ ] Amount distribution implemented
- [ ] Account distribution implemented
- [ ] Idempotency concurrency implemented
- [ ] Same-account contention tested
- [ ] Smoke test implemented
- [ ] Baseline test implemented
- [ ] Target test implemented
- [ ] Stress test implemented
- [ ] Spike test implemented
- [ ] Soak test defined
- [ ] Response validation implemented
- [ ] Financial correctness validation implemented
- [ ] Application telemetry defined
- [ ] Database telemetry defined
- [ ] Infrastructure telemetry defined
- [ ] Mock limitations documented
- [ ] Real-environment prerequisites documented
- [ ] Historical baseline defined
- [ ] Regression gate defined
- [ ] Infrastructure-noise detection defined
- [ ] PASS/FAIL/INCONCLUSIVE model implemented

---

# 37. Final Recommendation

**k6 should be the primary performance-testing tool and CI/CD performance-gate mechanism.**

The production-quality strategy is:

```text
              k6 Performance Testing
                       |
       +---------------+----------------+
       |               |                |
   Capacity          Latency         Reliability
       |               |                |
      TPS             p95             5xx
    Peak TPS          p99             Timeout
    Burst TPS         p50             Connection
       |               |                |
       +---------------+----------------+
                       |
                  Concurrency
                       |
          +------------+-------------+
          |                          |
     Same account              Same idempotency key
          |                          |
      DB contention              Duplicate protection
          |                          |
          +------------+-------------+
                       |
                Financial Integrity
                       |
             +---------+---------+
             |         |         |
          Correct   Complete   No duplicate
          amount    records      effects
                       |
                  Observability
                       |
          App + DB + Infra + Network
                       |
                Regression Gate
                       |
           PASS / FAIL / INCONCLUSIVE
```

> **The purpose of T2 is to establish whether the Transactions Service can sustain the required card-transaction workload with predictable latency and acceptable technical failure rates while preserving financial correctness, transaction consistency and idempotency under realistic concurrency.**

The proposed `100 TPS`, `p95 ≤ 500 ms`, `p99 ≤ 1 second`, and `≤1% technical error rate` are **initial assignment SLOs**, not production commitments. They must be replaced or confirmed using actual traffic, business requirements, architecture capacity and historical production telemetry before being used as formal production SLOs.

---

# Appendix A — Questions for Dev Manager / PO

1. What is expected normal TPS?
2. What is expected peak TPS?
3. What peak burst should the service tolerate?
4. What p95 latency is acceptable?
5. What p99 latency is acceptable?
6. What technical error rate is acceptable?
7. How should business declines be classified?
8. What is the transaction mix across the four operation types?
9. What is the transaction amount distribution?
10. How many accounts should the performance environment contain?
11. What percentage of traffic hits the same/hot account?
12. What is the expected retry behaviour?
13. Is `Idempotency-Key` supported by the implementation?
14. What is the idempotency contract?
15. What should happen for concurrent duplicate requests?
16. Which downstream dependencies must be real versus mocked?
17. What are the database capacity limits?
18. What is the availability/error-budget target?
19. What regression percentage should block a release?
20. Which infrastructure conditions should make a run `INCONCLUSIVE`?

---

# Appendix B — Evidence vs Assumptions

## Contract-derived facts

Taken from the supplied YAML:

- Service purpose
- Endpoint names
- Request fields
- Response fields
- HTTP response codes
- Transaction operation types
- Positive transaction amount requirement

## Assignment requirements

- Use k6
- Declare SLOs
- Test transaction/account endpoints
- Include idempotency concurrency
- Explain mock limitations
- Define real-environment prerequisites
- Define a regression gate resilient to infrastructure noise

## Engineering assumptions

- Initial 100 TPS target
- Initial p95/p99 targets
- Initial error-rate ceiling
- Example transaction mix
- Example workload levels

These assumptions should be reviewed and replaced with production evidence when available.
