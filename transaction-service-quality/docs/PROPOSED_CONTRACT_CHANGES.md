# Proposed provider additions (not applied to original Swagger)

T1 minimally needs a documented scoped transaction idempotency key AND an authoritative count/read observation. Identical response IDs cannot establish one persisted posting.

Propose Idempotency-Key on POST /transactions, scope including tenant/account, payload fingerprint, same-body replay, changed-body conflict, concurrent/in-progress behavior, TTL and persistence across restarts. Reference 201 replay/409 conflict are proposals requiring agreement.

Propose GET /transactions?account_id={id}&idempotency_key={key} returning {count:1,transactions:[transactionResponse]}. Required nonnegative count must include ALL authoritative postings for that scoped key, not response-cache entries. Required array is complete, unique IDs, with agreed read-after-write consistency after requests finish. Never use first-page length as total count. TRANSACTION_QUERY_PATH configures this adapter using the same query names/response envelope. Existing authoritative observability may implement the adapter once its source/consistency is agreed.

Other proposed commitments: required properties, operation/type enums/map, currency/caller/storage units, money representation/rounding/limits, document rules/duplicates, structured error causes/statuses, request-ID, security/ownership and timestamp format. Audit atomicity additionally requires audit read and rollback/fault evidence. Balance verification depends on provider responsibilities and ledger observation.

No header, enum, required property, status or read operation is silently added to supplied YAML. Mock observability is fixture-only.
