# T2: Performance testing

Tool: k6, because versioned JS workload, arrival-rate scheduling, concurrent HTTP batch requests, custom correctness metrics and thresholds suit an API-only service. No production capacity result is claimed.

## SLO declarations BEFORE workload execution

Initial engineering assumptions, not assignment-mandated values or production commitments: 100 logical TPS for 10 minutes, p95 <500 ms, p99 <1000 ms, technical error rate <1%, zero dropped target arrivals, zero duplicate financial effects, all correctness checks passing. Rationale: an initial moderate sustained workload with tail-latency and retry-risk visibility; validate/replace with traffic forecasts, peak distributions, business requirements and platform capacity. Zero duplicate effects follows financial risk, not a guessed latency budget.

## Runnable script

performance/k6/transactions.js sets constant-arrival-rate POST /transactions plus a separate concurrent same-key scenario. Each main iteration uses a new key. Each replay iteration batches N identical requests, checks every status, returned IDs and an authoritative count of 1. No failed requests are dropped. Target TPS describes main logical operations; replay traffic and count reads are additional HTTP work and must be reported separately.

Start the local reference server in one terminal with npm run mock. With k6 installed, run:

```powershell
k6 run -e TEST_ENV=mock -e BASE_URL=http://127.0.0.1:4011 -e TARGET_TPS=100 -e DURATION=10m -e IDEMPOTENCY_CONCURRENCY=20 performance/k6/transactions.js
```

Defaults are a short 10 TPS/10 s smoke, 5 concurrent replay requests and 10 replay iterations. Other parameters: ACCOUNT_ID, AMOUNT, OPERATION_TYPE_ID, PREALLOCATED_VUS, MAX_VUS, IDEMPOTENCY_ITERATIONS, API_TOKEN. setup creates an isolated numeric-document account when no account is supplied. teardown removes locally created mock state; staging retains IDs for approved cleanup. For staging require TEST_ENV=staging, owner-approved policy and TRANSACTION_QUERY_PATH. Never load-test production from this harness.

If k6 is unavailable, npm run perf:smoke executes a separately labeled dependency-free Node harness smoke: 50 valid posts, 20 concurrent same-key retries, count 1 and cleanup. It is not a k6 run or service SLO result. k6 source syntax can be checked with node --check performance/k6/transactions.js; syntax alone does not verify the k6 runtime.

## Evidence and service regression gate

Mock results measure script, local HTTP fixture and harness overhead; no real DB, ledger, audit, authorization, replicas or production dependency costs exist. Meaningful service acceptance needs provider access, workload mix/peak forecast, realistic dataset, auth, production-like DB/replicas/dependencies, documented units/key semantics, authoritative count/reconciliation, load-generator headroom and stable telemetry.

Capture environment/build/config, arrival/completed/dropped operations, wire requests, p95/p99 by endpoint/scenario, transport/5xx versus business rejection, key collision/duplicate count and CPU/network/DB saturation. Compare with a versioned baseline under matching conditions. Any duplicate or wrong amount fails immediately regardless of speed. Latency/error regressions fail only after environment/generator health is established; noisy/saturated/unavailable infrastructure is INCONCLUSIVE and cannot approve release. Preserve the failing run; a rerun does not overwrite it. The initial local CI perf smoke is a harness gate; real k6 gates require the agreed environment and baseline.
