import { z } from 'zod';

export const TransactionResponseSchema = z.object({
  account_id: z.number(),
  amount: z.number(),
  event_date: z.string(),
  operation_type_id: z.number(),
  transaction_id: z.number(),
  type: z.string()
});