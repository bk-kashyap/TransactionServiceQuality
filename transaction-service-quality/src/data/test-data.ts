import { randomBytes } from 'node:crypto';
export function documentNumber(length = 14): string {
  if (length < 1 || length > 20) throw new Error('Invalid test document length');
  return Array.from(randomBytes(length), byte => String(byte % 10)).join('');
}
export const operationTypes = [
  { id: 1, name: 'Normal Purchase', sign: -1, type: 'debit' },
  { id: 2, name: 'Installment Purchase', sign: -1, type: 'debit' },
  { id: 3, name: 'Withdrawal', sign: -1, type: 'debit' },
  { id: 4, name: 'Credit Voucher', sign: 1, type: 'credit' },
] as const;
