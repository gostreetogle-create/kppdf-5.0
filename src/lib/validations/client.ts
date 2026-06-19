import { z } from 'zod';

export const CreateClientSchema = z.object({
  lastName: z.string().min(1, 'Фамилия обязательна').max(200),
  firstName: z.string().min(1, 'Имя обязательно').max(200),
  patronymic: z.string().max(200).optional(),
  phone: z.string().min(1, 'Телефон обязателен').max(50),
  email: z.string().max(200).optional(),
  inn: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  personalMarkupPercent: z.number().min(0).max(100).optional(),
  notes: z.string().max(2000).optional(),
  isActive: z.boolean().default(true),
  organizationId: z.string().cuid().optional(),
});

export const UpdateClientSchema = CreateClientSchema.partial();

export type CreateClientInput = z.infer<typeof CreateClientSchema>;
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;
