# T1: PISMO-4412 retry-storm incident and regression guardrail

Simulated incident: customers double-debited during concurrent retries on POST /transactions. No actual provider logs/code were supplied; hypotheses and observations below are not claimed diagnoses.

## Verification

Implemented in tests/idempotency/concurrent-replay.spec.ts. Create an isolated account/key; count baseline 0; send N=20 concurrent identical requests sharing Idempotency-Key; assert EVERY approved response is 201 with correct account/operation/type/value and the same integer transaction ID; independently read complete authoritative state and require count exactly 1 with the same ID/value. Concurrency is configurable 2..100. The reference replay-status semantics are assumptions needing provider agreement.

Run npm run test:nightly -- --grep T1-COUNT. Sequential replay, changed-body key reuse and missing keys are separate cases. GUARD-ERROR rejects one success plus nineteen failures; GUARD-DUP rejects different returned IDs; GUARD-COUNT rejects a count envelope inconsistent with returned records. Failures are never filtered out or retried into green.

## Observability blocker

Original Swagger has neither an idempotency header nor a transaction read/count operation. It cannot independently prove exactly one persisted posting. T1 is skipped as BLOCKED without an agreed count adapter; release rejects that skip. Mock count demonstrates only synthetic in-memory behavior. Identical response IDs are not persistent-record evidence.

Minimum provider change: document scoped key/fingerprint/replay/conflict/in-progress/TTL semantics and an authoritative complete count/read by account+key with agreed consistency. Configure TRANSACTION_QUERY_PATH to the adapter in PROPOSED_CONTRACT_CHANGES.md. Its count must come from postings, not cached responses. Count 1 does not prove transaction-plus-audit atomicity; that requires audit read/fault evidence. NO-GO for Ops sign-off until those observations exist.

## Ranked root-cause hypotheses

1. Check-then-insert race without DB uniqueness: simultaneous requests both see no key and create postings. Discriminator: two rows with the same scoped key and overlapping pre-insert spans; inspect unique constraint and transaction boundaries.
2. Idempotency response/key stored after financial commit: a timeout/crash between posting and key save leaves retries unprotected. Discriminator: persisted posting with absent key record, fault injection between commits; duplicates correlate with that window.
3. Per-instance/eventually consistent key store: simultaneous requests on different instances see different key states. Discriminator: cross-instance duplicate rate exceeds same-instance rate; trace instance identity and key-store reads.

## Regression and systemic fix

PR runs guardrail evaluator tests and critical operations. Nightly runs concurrent same-key count; pre-release repeats on a real multi-instance staging provider with fault/timeout scenarios. No assertion retries. Retain request IDs, returned IDs, authoritative count and environment. Unique test keys and accounts avoid unrelated shared state; an agreed completion/read-consistency signal avoids arbitrary sleeps.

Tell dev to reserve a scoped idempotency key atomically under DB uniqueness, store immutable payload fingerprint, transaction reference and replay response within the financial/audit transaction, and define safe in-progress/conflict/TTL behavior. External effects require an outbox/ledger strategy appropriate to their transaction boundary. Test crash recovery and cross-instance races. Update contract, compatibility gates and reviews to require that evidence. No backend fix is claimed here because no service source was supplied.

## Production detection

Signal: duplicate_posting_groups, sourced from authoritative financial postings or reconciliation. Query scoped non-null keys: GROUP BY tenant_id, account_id, idempotency_key HAVING COUNT(*) > 1. These are proposed instrumentation fields, not known DB schema. Evaluate every minute; ANY confirmed duplicate group pages Payments Ops and transaction-service on-call immediately. Include key/account scope and transaction IDs in restricted diagnostic evidence; avoid unbounded key labels in metrics. Exclude independent keyless payments from replay-duplicate detection. Track replay/conflict rate as secondary signals, never as substitutes for financial-effect count.
