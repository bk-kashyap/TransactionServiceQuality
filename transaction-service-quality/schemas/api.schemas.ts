// Read the supplied YAML; do not silently strengthen its definitions locally.
const { spec } = require('../scripts/contract.cjs');
export const accountResponseSchema = spec.definitions['handler.accountResponse'];
export const transactionResponseSchema = spec.definitions['handler.transactionResponse'];
export const errorResponseSchema = spec.definitions['handler.errorResponse'];
export const createAccountRequestSchema = spec.definitions['handler.createAccountRequest'];
export const createTransactionRequestSchema = spec.definitions['handler.createTransactionRequest'];
