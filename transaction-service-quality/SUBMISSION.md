# Assignment submission

Required C1-C5, T1 and T3 are indexed below. T2 is the selected depth track; T4 is additionally documented as a design. Mock passes establish harness execution, not Transactions Service correctness.

| Artifact | Location | Run/review | Time record |
|---|---|---|---|
| C1 | [Risk and metrics](docs/C1.md) | Read | Original effort not recorded |
| C2 | [Framework/CI](docs/C2.md), src and scripts | npm run typecheck; npm run test:pr | Original effort not recorded |
| C3 | [Contract register](docs/C3.md), scripts/contract.cjs | npm run contract:validate; npm run test:prism | Original effort not recorded |
| C4 | [Suite](docs/C4.md), [matrix](docs/TRACEABILITY.md) | npm test; npm run traceability | Original effort not recorded |
| C5 | [Predictions](docs/C5.md) and C3 | Review tests and observation prerequisites | Original effort not recorded |
| T1 | [Incident](docs/PISMO-4412-T1-QA-Automation-Strategy.md) | npm run test:nightly -- --grep T1-COUNT | Original effort not recorded |
| T2 | [Performance](docs/T2_Performance_Testing_Strategy_k6_Card_Payments.md) | npm run perf:smoke; k6 command in T2 | Original effort not recorded |
| T3 | [Journey](docs/T3_E2E.md), tests/e2e | npm test -- --grep T3-JOURNEY | Original effort not recorded |
| T4 (design) | [AI guardrails](docs/T4_AI_GUARDRAILS.md) | Read; no running generator claimed | Original effort not recorded |
| AI usage | [AI_NOTES](AI_NOTES.md) | Read | Verification evidence records actual runs |

Run from transaction-service-quality; use npm.cmd if PowerShell blocks npm.ps1. [README](README.md) covers configuration. [VERIFICATION](docs/VERIFICATION.md) records observed results and limits. Historical per-artifact effort cannot reliably be inferred from timestamps: the submitter must supply actual records before claiming that requirement complete. No hours are fabricated.

Deliberately not claimed: real-provider persistence, production SLOs, audit atomicity, authentication/authorization, balance reconciliation, refund/reversal or installment schedules. No staging/database access was provided. The supplied YAML is unchanged; proposed additions and reference mock policy are separate.

Release position: **NO-GO for real money**, pending authoritative idempotency/count, monetary unit/precision, security and audit/financial-state observations. A green PR mock gate is not release approval.
