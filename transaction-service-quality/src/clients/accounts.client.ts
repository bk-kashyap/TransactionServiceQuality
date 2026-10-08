import { APIRequestContext } from '@playwright/test';
import { validateSchema } from '../validators/schema.validator';

export class AccountsClient {

    constructor(
        private readonly request: APIRequestContext
    ) {}

    async createAccount(documentNumber: string) {
        validateSchema('createAccountRequest', { document_number: documentNumber });
        return this.request.post('/accounts', {
            data: {
                document_number: documentNumber
            }
        });
    }

    async getAccount( accountId: number ) {
        return this.request.get(
            `/accounts/${accountId}`
        );
    }
}
