# T4: AI generation and maintenance (design)

Written design, as permitted by T4; no running generator/healer is claimed. T2 is the implemented selected depth track.

Feed versioned OpenAPI, hearsay register, risk IDs and approved policy into generation. Require case ID, exact input, oracle/source pointer, outcome, risk/defect/gate and observation prerequisites. Generate present-field valid/type-invalid cases from schema; never invent required fields, money units, errors or idempotency. Produce reviewed patches and reject invented endpoints before discovery/type/schema/mock checks.

Guardrail: an independent evaluator owns oracles. Generation cannot edit schemas, expected statuses, money invariants, skips, thresholds, release blockers or CI selections. Repairs may change transport/configuration or proven data collisions with reviewer evidence. Wrong signed money or multiple persisted same-key rows stays red and becomes a defect; no relaxed assertion or new skip. Semantic changes need contract-owner approval. Mock passes never approve provider changes.

Measure on a versioned independently labeled set with seeded sign/unit leaks, missing/wrong IDs, key races, partial audit writes, malformed input and known environment faults. Ground truth comes from controlled providers/records, not generated assertions. False-pass = seeded defects accepted / seeded defects; false-fail = known-good behaviors rejected / known-good behaviors. Report by risk and model/prompt version with sample counts and confidence limits. Initial gate: zero false passes for R-01/R-02/R-03/R-04 and investigated false failures. GUARD-ERROR/DUP/COUNT implement small evaluator probes, not a complete seeded-provider study.

Refuse AI real-money execution, production credentials/PII, automatic financial oracle/contract changes, self-healing money assertions and release sign-off. Human owners and independent evidence remain required. AI_NOTES records actual usage separately.
