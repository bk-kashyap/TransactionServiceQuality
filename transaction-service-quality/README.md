# Transactions Service Quality

Start with [SUBMISSION.md](SUBMISSION.md). Node 24 and npm are used by CI. All tests use Playwright APIRequestContext; no browser installation is needed.

```powershell
npm.cmd ci
npm.cmd run contract:validate
npm.cmd run typecheck
npm.cmd test
npm.cmd run test:prism
```

Commands run from `transaction-service-quality`. `.cmd` avoids the local PowerShell restriction on npm.ps1 without changing execution policy. The runner starts/stops its server, waits for readiness and rejects occupied ports. Override MOCK_PORT as needed. MANAGE_MOCK=0 is for an explicitly started local mock; stateful fixtures check its policy identity.

Default TEST_ENV=mock uses the synthetic stateful reference mock on port 4011. test:prism uses the unmodified supplied Swagger and Prism on port 4010, running contract/harness checks only. Neither is provider correctness evidence.

Staging, after owner agreement on the reference policy:

```powershell
$env:TEST_ENV='staging'
$env:BASE_URL='https://your-approved-staging-host'
$env:APPROVED_POLICY='qa-reference-v1'
# Only after an authoritative count/read adapter is agreed and available:
$env:TRANSACTION_QUERY_PATH='/transactions'
npm.cmd test
```

Do not set APPROVED_POLICY merely to avoid skips. It means the provider owner agrees the exact assumptions in [MOCK_POLICY](docs/MOCK_POLICY.md). Without it behavior cases are blocked. The count adapter uses account_id and idempotency_key and returns {count,transactions}; see [proposed changes](docs/PROPOSED_CONTRACT_CHANGES.md).

Other scripts: test:pr, test:nightly, test:release, perf:smoke, perf:k6, traceability, report. `.env.example.txt` documents variables; it is not automatically loaded. The release command requires staging and fails on skipped required observations. Audit, balance and security cases remain blocked. Staging account IDs are attached for an agreed retention job because the supplied API has no DELETE. Local mock records are cleaned by fixtures.
