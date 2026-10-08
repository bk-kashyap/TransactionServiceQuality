# T3: API-only E2E journey

tests/e2e/endtoendtransactions.spec.ts uses Playwright APIRequestContext and shared fixtures. Create isolated account -> post all four operation types -> assert identity/type/sign/caller-unit amount -> read resulting transaction records via count adapter -> retrieve same account.

Run npm test -- --grep T3-JOURNEY. Each operation is a report step. The fixture tracks created IDs, tears down mock state, and attaches staging retention IDs. No browser or hidden DB is assumed.

Without the adapter an ordinary staging journey annotates response-only coverage and blocked state observation. Release fails on that missing observation. Mock reads verify synthetic records only. No balance or audit invariant is claimed.
