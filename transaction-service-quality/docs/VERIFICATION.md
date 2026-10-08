# Observed verification: 8 October 2026

Changes were implemented and executed in a temporary working copy. Automatic approval settings reject writes to the original C:\Project Junk project. A patch and corrected source archive are delivered separately; original source remains unchanged until the patch is applied in a writable session.

| Check | Observed result | Evidence scope |
|---|---|---|
| Full reference suite, 4 workers | 71 passed, 3 skipped, 0 failed; 74 cases | Synthetic mock only; docs/evidence/mock-run.json |
| Prism contract/harness subset, 2 workers, port 4020 | 11 passed | Original supplied contract; not provider conformance |
| TypeScript noEmit | Exit 0 | Installed TypeScript/Playwright types |
| Swagger structure/ref validation | Exit 0 | Original YAML; empty property sets remain permitted |
| k6 source syntax | node --check exit 0 | Syntax only, k6 runtime unavailable locally |
| Node performance workload smoke | Exit 0: 50 posts, 20 concurrent replays, count 1 | Local fixture/harness only, no service SLO conclusion |
| Release-gate evaluator self-test | Expected exit 1 with 3 skipped observations | Used localhost synthetic fixture as target, NOT actual staging; docs/evidence/release-gate-selftest.json |
| Traceability generation | 74 uniquely identified cases, required metadata present | Full mock run annotations and source locations |

Blocked: audit atomicity, balance reconciliation and security ownership. No real service, ledger, staging or production performance was tested. The release evaluator's localhost self-test validates that skips cannot approve a release; it does not supply staging evidence. Historical per-artifact author effort was not recorded and must be supplied from actual records.

On this managed Windows environment, Playwright-owned child-server teardown stalled on an early run; that run was interrupted and is not claimed as a completed pass. The implemented Node runner manages the child directly; subsequent complete executions exited normally. An existing service occupied port 4010, so verified Prism runs used MOCK_PORT=4020 rather than reusing an unknown service.
