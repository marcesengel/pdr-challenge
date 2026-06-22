import * as z from 'zod';

export const userSchema = z.object({
  id: z.number(),
  role: z.enum(['admin', 'editor', 'viewer']),
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
  phoneNumber: z.string(),
  birthDate: z.iso.date(),
});

export type User = z.infer<typeof userSchema>;
