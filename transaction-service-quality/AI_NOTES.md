# AI Use and Engineering Judgment

## Correction-session update (8 October 2026)

Codex corrected the API suite and payload/assertion defects, implemented YAML-derived validation, isolated fixtures, configurable environments, incident count verification, reference mock, performance scripts, CI gates and traceability. The original Swagger was preserved. Changes were prepared in a temporary working copy because the original project is outside the session's writable scope.

One misleading approach caught during correction was treating a single returned transaction ID as proof of exactly one persisted posting. The incident test now checks an independently read count and keeps the original API's missing observation explicit. Another concrete defect caught by type checking was the reporter's synchronous onEnd result: it was changed to the asynchronous signature required by the installed Playwright types.

The implementation deliberately rejected silently adding mandatory properties or money constraints to local contract schemas. Instead it reads the supplied YAML and labels extra behavior as qa-reference-v1 assumptions. It also rejects dropping failed concurrent responses from the guardrail; GUARD-ERROR demonstrates why one success plus nineteen failures must not pass.

Observed corrected results and remaining runtime limitations are recorded in docs/VERIFICATION.md. No real-provider, ledger or production performance result is claimed. Historical author effort still needs actual records.

## Historical review snapshot (before corrections below)

The following text describes the earlier repository state. Its defects and missing files are historical findings, not the corrected working copy's current status.

## Scope and attribution

This note records the AI-assisted repository review performed with OpenAI Codex on 8 October 2026. It distinguishes verified repository facts from proposed improvements and unsupported expectations. Earlier AI conversations were not available to this review, so this note does not attribute every existing test or strategy document to AI, or claim that earlier decisions were made when there is no evidence of them.

## What AI was used for

Codex was used to inspect the Swagger contract, Playwright configuration, API clients, Zod and AJV schemas, all eight test files, dependency manifests, GitHub Actions workflow, and QA strategy documents. It helped identify inconsistencies between executable assertions, documented plans, and the published contract, and drafted this note.

The review checked the following concrete questions:

- Which endpoint paths, fields, and status codes are actually documented?
- Which assertions encode extra assumptions about document numbers, errors, account identity, or transaction behavior?
- What does a passing mock test establish, and what requires a real service and a persistence oracle?
- Which framework and CI capabilities exist in code, and which appear only in strategy documents?

AI was used as a review aid. Its explanations were checked against repository files and local tool output; they were not treated as independent evidence of service behavior.

## Where AI was wrong or misleading, and how it was caught

The assistant initially interpreted the request for `AI_NOTES.md` as a request for a project guide covering architecture and execution. That was the wrong deliverable. The assignment excerpt supplied during the review explicitly asks for AI usage, an AI mistake, and a decision against an AI suggestion. Comparing the proposed scope with that wording caught the mistake, and the document was rewritten around judgment and evidence.

A substantive misleading claim was also found in the existing submission instructions: `docs/SUBMISSION.md` describes switching to staging by setting `BASE_URL`. The executable `playwright.config.ts` instead hardcodes `http://127.0.0.1:4010`; its dotenv loading is commented out. `.env.example.txt` does not change that behavior. Setting `BASE_URL` alone therefore does not switch this suite to staging. This was caught by reading the configuration rather than trusting the run instructions. The original author/tool behind those instructions is unverified, so this is recorded as a repository finding rather than an invented account of a prior AI conversation.

## A decision made against the AI's suggested approach

The user redirected the assistant's proposed project-guide approach by supplying the assignment's actual AI-use requirement. This note follows that decision: it records review evidence and limitations instead of presenting a broad project handbook as the assignment deliverable.

For technical follow-up, the review also declines to apply the schema-hardening proposal in `docs/C3.md` automatically. That proposal recommends adding required request properties. Such a change may be desirable for a future agreed contract, but adding it only to local validators would silently strengthen the current contract. The existing AJV schemas deliberately preserve the supplied contract's optional properties. No contract or test behavior was changed as part of this documentation task. This is a decision in the present review, not a claim about the submitter's earlier AI-use history.

## Concrete assertions to defend in the debrief

The formal reference is `contract/transactions-service.v1.yaml`, a Swagger 2.0 document. Descriptions and schemas must both be read: a business rule can appear in prose without being enforced by the schema.

| Check or claim | Evidence and defensible interpretation |
| --- | --- |
| Account creation returns `201` | `POST /accounts` documents `201`, `400`, and `405`. Successful creation is a documented outcome; a mock returning it does not prove persistence. |
| Account retrieval returns `200` | `GET /accounts/{accountId}` documents `200`, `400`, `404`, and `405`, with an integer path parameter. A static example is not proof that the requested account was retrieved. |
| Transaction creation returns `201` | `POST /transactions` documents `201`, `400`, `405`, and `422`. The listing alone does not specify which invalid input maps to each error. |
| Positive transaction input and server-applied sign | The transaction description explicitly says to send a positive amount and that the server applies the correct sign. Operation IDs `1` through `4` are described in prose. No schema enum or numeric minimum enforces those rules. Exact sign mapping should be explained from the operation semantics and confirmed with the service owner. |
| AJV response validation passes | `schemas/api.schemas.ts` checks types of present properties but has no property-level `required` lists or `additionalProperties: false`. An empty object can pass. The schema tests add separate presence assertions; these are stronger expectations than the YAML schema alone. |
| Zod response validation passes | `schemas/account.schema.ts` and `schemas/transaction.schema.ts` require their listed fields, but use `z.number()` for IDs and `z.string()` for `event_date`. Passing does not establish integer IDs, timestamp validity, sign correctness, persistence, or financial accuracy. |
| The E2E journey passes | `tests/e2e/endtoendtransactions.spec.ts` chains account creation, transaction creation, and account retrieval. Against a static mock, repeated example IDs can satisfy these assertions without any stored state. |

## Unsupported expectations and existing test defects

These findings remain in the source; recording them is not a claim that they have been fixed.

- `tests/accounts/create-account.spec.ts` assumes document-length limits, numeric-only content, duplicate rejection with `409`, and specific error messages. The contract defines none of those rules. Its duplicate test does not arrange its own initial creation, and the suite runs fully in parallel with shared document numbers.
- The same file compares `typeof body.error_msg` to a full error message and `typeof body` to `'error'`. JavaScript `typeof` cannot return either value. Its "more than 14 digits" case sends six digits; its "empty array" case sends `{}`. Those tests do not exercise their stated inputs.
- `tests/transactions/create-transaction.spec.ts` wraps negative request payloads in an extra `data` property before passing them as Playwright's `data` option. It therefore sends `{ "data": { ... } }` instead of the documented flat transaction object. Several assertions inspect `body.status` rather than the HTTP status and compare `typeof` results to error messages.
- `tests/accounts/fetch-account.spec.ts` requests account `2` but expects account `1`, matching the contract example rather than account identity. It expects `400` for an unknown account without a confirmed error mapping. Its raw path containing `#` does not reliably exercise the intended path input because `#` introduces a URL fragment.
- `tests/account.api.spec.ts` targets `/api/accounts/ACC10001` and expects camelCase banking fields, currency, and balance. That endpoint and response shape are absent from the supplied contract.
- The unsupported-method test checks Prism-specific error fields. Those checks describe the mock implementation, while the contract error model contains an `error` string.
- The operation-sign tests check only positive/negative output, not the operation ID returned, account identity, or absolute amount. A negative static example can satisfy all debit cases without implementing sign conversion.

These are examples of why a plausible test name or an AI-generated assertion is not a reliable oracle. Unsupported requirements need an explicit owner and confirmation; malformed tests need correction before their failures are treated as product defects.

## What was verified, and what was not

`npx.cmd --no-install playwright test --list --reporter=list` successfully discovered **30 tests in eight files** in the `chromium` project. This checks test discovery and module loading; it is not a test pass result. The `.cmd` executable was used because the local PowerShell policy blocks the `npm.ps1` and `npx.ps1` wrappers.

The local Prism CLI's mock command and default port `4010` were checked with `npx.cmd --no-install prism mock --help`. No mock server or real service was started, and no endpoint tests or performance workloads were executed in this review. Existing report directories were not used as evidence for a fresh passing run.

The workflow in `.github/workflows/playwright.yml` installs dependencies and browsers, runs Playwright, and uploads the report, but does not start the API or a Prism mock. `playwright.config.ts` has no active `webServer`. The checked-in workflow therefore lacks a configured service at the default URL.

The C1–C5 documents, incident strategy, and k6 strategy contain proposed architecture and verification plans. The `performance/` directory has no implementation files; there is no executable k6 suite. The proposed performance targets are initial assumptions, not measured results or production commitments. Idempotency, audit atomicity, concurrency correctness, authentication, ledger reconciliation, and balance verification have not been established by this review or by a passing contract mock.

## Ownership

Every submitted assertion needs an explanation of its input, its expected outcome, the authority for that expectation, and what environment produced the result. Contract gaps must remain visible rather than being filled with plausible banking rules. A mock pass demonstrates the harness's interaction with the mock; service correctness requires evidence from the implementation and, where relevant, persisted financial state.

Before presenting this as a complete history of the assignment, the submitter should add their actual earlier AI tool usage and a personally confirmed technical suggestion they rejected. Those facts cannot be reconstructed honestly from repository contents alone.
