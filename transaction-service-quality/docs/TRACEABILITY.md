| Requirement         | Endpoint           | Test               | Status       |
| ------------------- | ------------------ | ------------------ | ------------ |
| Create account      | POST /accounts     | create-account     | Covered      |
| Get account         | GET /accounts/{id} | get-account        | Covered      |
| Create transaction  | POST /transactions | create-transaction | Covered      |
| Purchase sign       | POST /transactions | purchase-sign      | Contract gap |
| Withdrawal sign     | POST /transactions | withdrawal-sign    | Contract gap |
| Credit sign         | POST /transactions | credit-sign        | Contract gap |
| Idempotency         | POST /transactions | idempotency        | Contract gap |
| Request ID          | All                | request-id         | Contract gap |
| Audit atomicity     | Writes             | audit              | Not testable |
| Document validation | POST /accounts     | document tests     | Contract gap |


SECURITY Testing :

1. Authentication
2. Authorization
3. IDOR
4. Account enumeration
5. Input validation
6. Injection
7. Header manipulation
8. Replay
9. Idempotency abuse
10. Sensitive data exposure
11. Error-message leakage
12. Rate limiting
13. HTTP method abuse
14. Content-Type handling
15. Oversized payloads
16. Malformed JSON

But again, your current contract doesn't define authentication or authorization. So we record it as: 
Security contract gap

--------------------------------------------------------------------------------------------------------

MONEY TRANSACTION -specific test design : 

This is where we can see the real gap in the requirement.
For transactions, and their necessary TDD tests we can have amount entries as :

₹0
₹0.01
₹0.10
₹1
₹1.99
₹50
₹100
₹999.99
large amount
maximum supported amount

And there is a quality finding as : What is the supported monetary precision and maximum transaction amount?

------------------------------------------------------------------------------------------

Another critical issue is the currency.
The transaction request contains a JSON as :
{
  "account_id": 1,
  "amount": 50,
  "operation_type_id": 1
}

But there is no key: value pair of currency specifications : 
"currency": "INR"
The engineer says amounts are rupees, but the API doesn't say so.

If its a multi-currency, then currency must be part of the contract.