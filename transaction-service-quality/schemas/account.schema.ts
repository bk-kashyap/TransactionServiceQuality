import { z } from 'zod';

export const AccountResponseSchema = z.object({
  account_id: z.number(),
  document_number: z.string()
});