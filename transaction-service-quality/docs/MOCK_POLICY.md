# qa-reference-v1: explicit synthetic policy

NOT the supplied API contract; NOT proof of provider behavior. APPROVED_POLICY=qa-reference-v1 means the provider owner agrees these exact assumptions for the environment; never set it merely to avoid skips.

| Topic | Reference policy | Authority |
|---|---|---|
| Documents | Required string, 10-14 digits inclusive, unique; invalid 400, duplicate 409 | Format hearsay; mandatory/unique/status assumptions |
| Requests | Flat object, required transaction fields; missing/wrong property 400 | Present-property types contractual; required/status proposed |
| Accounts | Integer IDs, echo document; reserved MAX_SAFE_INTEGER absent; unknown GET 404, invalid ID 400 | Identity/domain; exact mappings assumptions |
| Money | Caller major units; synthetic 0.01 minor unit; positive, exact 2 decimals, maximum 1,000,000; invalid 422 | Positive-input prose contractual; unit/precision/limit/status assumed |
| Operations | 1/2/3 negative debit, 4 positive credit; caller-unit return; unknown 422 | IDs/server sign prose; full map/type/unit hearsay/domain |
| Replay | Optional Idempotency-Key scoped account+key; same body original 201; changed body 409; no key independent | Replay hearsay; naming/scope/status/missing-key proposed |
| Errors | JSON {error:string}; malformed/empty 400, wrong content 415, >16 KiB 413, method 405 | Error field type contractual; mappings/limits proposed |
| Tracing | Unique X-Request-ID on success/error | Presence hearsay; naming/uniqueness assumed |
| Mock state | Complete read-after-write /__qa/transactions count by account_id/key; /__qa/accounts/{id} DELETE | Fixture-only endpoints, not supplied API |

State is in memory and resets on restart. Synchronous Map insertion only demonstrates local policy, not distributed/DB/ledger correctness. No balance or audit row is simulated. Prism is separately generated from original Swagger and implements no stateful reference policy.
