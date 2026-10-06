How we would divide the actual assignment : 

With all the learning and the implementation everything at once.
We recommend 10 implementation stages:

Stage 1 — Contract assessment : 
Goal: Understand what the API promises and identify gaps.

Stage 2 — Project setup
Goal: Playwright TypeScript framework.

Stage 3 — Prism mock
Goal: Make tests executable without the real service.

Stage 4 — API abstraction
Goal: Separate HTTP calls from tests.

That is :
tests/accounts/executablefiles.spec.ts
tests/transactions/executablefiles.spec.ts
tests/e2e/executablefiles.spec.ts

Stage 5 — Contract validation
Goal:  schemas and API contracts

Stage 6 — Functional testing
Goal : positive, negative, edge cases, boundary values etc

Stage 7 — Negative/boundary testing on status codes and errors/warnings
Goal: Failure behavior on 
400
404
422
405
invalid inputs and more ...

Stage 8 — E2E journey
Goal: Chain APIs.
Create Account
      ↓
Create Transaction
      ↓
Get Account

Stage 9 — Quality gates + reporting

Goal: CI readiness.
test
→ report
→ metrics
→ gate

Stage 10 — Staff-level quality assessment
Goal: Demonstrate what cannot be tested and why.

Idempotency  ------- > gap
Request-ID  ------- >  gap
Audit  ------- >  gap
Currency   ------- > gap
Document validation   ------- > gap
Money precision  ------- >  gap
Security contract  ------- >  gap 

------------------ +++++++++++++++++++++++++++++ ------------------------- +++++++++++++++++++++++++ ----------------------------

C1 : Test strategy, risk & metrics (the most important deliverable)

C1 Test Strategy
│
├── 1. Quality objective
├── 2. Risk model
├── 3. Risk-ranked failure modes
├── 4. Test pyramid
├── 5. QA vs Developer ownership
├── 6. Quality metrics/dashboard
└── 7. Assumptions/open questions.

 = > Quality Objective : 
	The quality objective is to provide evidence that the Transactions Service can safely become a system of record for money movement. 
	The strategy prioritizes , prevention of duplicate or lost transactions, contract compatibility, referential integrity, auditability and safe failure behavior over raw test volume.
	
	│
	├── 1. Financial correctness
	├── 2. Prevention of duplicate or lost transactions
	├── 3. Contract compatibility - 
	├── 4. Referential integrity - Database table relationships must always be consistent.
	├── 5. Auditability - 
	│						Immutable audit logs recording every access and alteration attempt, 
	│						Unique transaction IDs for all activities,
	│						Time-stamped ledger entries preventing data manipulation.
	├── 6. Safe failure behavior over raw test volume. - 
							Ensure that when a system breaks, it leaves the bank and user in a secure state, than
							Maximize the number of tests run (e.g., executing 10,000 automated scripts).
							
 = > Risk Model :
		P0 = unacceptable financial/regulatory/customer impact
		P1 = serious functional or operational impact
		P2 = moderate impact
		P3 = minor impact.
		
	Testing checks on :
	1. P0-01 — Duplicate financial transaction.
	2. P0-02 — Incorrect transaction amount/sign.
	3. P0-03 — Transaction posted to wrong account. (Its an integrity failure).
	4. P0-04 — Transaction accepted but lost. (201 OK - Transaction appears successful but the financial record not persisted).
	5. P0-05 — Balance/financial state inconsistency. (Transaction says ₹100 debit, but the Account balance says otherwise).
	
	Audit trail (Not P0 but a nearing P1) and its a release blocking clarification :
		- Audit divergence → We say that, every write creates an audit row atomically (audit trail is legally/regulatorily required mandate).
		- Slow end-points - more than 3 seconds.
		  Failure	------------------→ Priority
		  
			Wrong debit amount				P0
			Duplicate charge				P0
			Wrong account charged			P0
			Lost transaction				P0
			Audit divergence				P1/P0 depending on regulatory role
			Incorrect error code			P1/P2
			Slow response					P2 unless timeout causes duplicate/retry risk
			Poor error message				P2/P3
		
		Test Pyramid :
		
		          E2E
                 /   \
                /     \
             API /    Functional
            /             \
       Contract /        Schema
          /                 \
 Developer Unit /          Component
	
			
		Unit Tests : Owned primarily by developers.
		Contract Tests : 
			- Request/response incompatibility
			- Schema drift
			- Missing fields
			- Wrong types
			- Unexpected response shapes.
		API functional : 
			- Actual endpoint behavior
			- HTTP semantics
			- Validation
			- Error handling
			- Referential integrity
		E2E : High-value journey. (Account → Transactions → Audits)
			  Technically we should not be putting every permutations into E2E testing.
			  
		QA/Quality-owned : 
			- Risk model
			- Contract quality
			- Independent API validation
			- Cross-service behavior
			- E2E critical journeys
			- Quality gates
			- Testability
			- Release evidence
			- Quality metrics
			- Risk acceptance
			
		Dev and QA owned : 
			- Performance
			- Security
			- Observability
			- Resilience
			- Test data
			- Contract evolution.
			
-----------------------------------------------------------------------------------------------------------------------
			
Why Is QA Metrics Relevant for Fintech?
Issues that it addresses or resolves:

1. Vanity metrics create confidence without exposing financial or customer risk.
2. Teams optimize test counts rather than detection and prevention.
3. Coverage percentages hide critical payment and ledger gaps
4. Different groups use inconsistent metric definitions
5. Pass rates mix product, environment, data, and test-system failures
6. Monthly averages hide slow feedback and high-risk outliers
7. Metrics are collected without changing priorities
8. Quality reporting becomes a QA scoreboard rather than shared engineering evidence
9. Audit and compliance concerns remain disconnected from test reporting

Resolved Issues Through QA Metrics : 

1. Testing activity becomes connected to escaped risk and customer outcomes
2. Teams see where feedback is slow, noisy, or ineffective
3. Leadership can identify and fund the constraints affecting quality
4. Product failures are separated from test-system failures
5. Metric definitions become stable enough to support trends
6. Critical money journeys receive contextual reporting
7. Improvement work can be evaluated against measurable outcomes
8. Quality ownership becomes shared across engineering, product, QA, risk, compliance, and operations.

Core Components of QA Metrics for Fintech :
 
1. Customer and business outcome measures
2. Defect flow and escape measures
3. Feedback speed and reliability measures
4. Test portfolio health and maintenance measures
5. Learning, prevention, and ownership measures
6. Agreed metric definitions
7. Decision ownership
8. Context by journey, change, release, and financial risk

The goal is to create earlier, clearer, and more decision-ready evidence about failures that matter across financial journeys such as:

1. Customer onboarding
2. Identity verification
3. Payment initiation
4. Transaction processing
5. Settlement
6. Refunds
7. Disputes
8. Reconciliation
9. Fraud review
10. Banking-partner integrations