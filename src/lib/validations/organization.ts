import { z } from 'zod';

export const CreateOrganizationSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(500),
  shortName: z.string().max(200).default(''),
  legalForm: z.string().max(100).default(''),
  inn: z.string().max(20).default(''),
  kpp: z.string().max(20).default(''),
  ogrn: z.string().max(50).default(''),
  phone: z.string().max(50).default(''),
  email: z.string().max(200).default(''),
  legalAddress: z.string().max(500).default(''),
  postalAddress: z.string().max(500).default(''),
  bankName: z.string().max(200).default(''),
  bankBik: z.string().max(20).default(''),
  bankAccount: z.string().max(50).default(''),
  signerName: z.string().max(200).default(''),
  signerPosition: z.string().max(200).default(''),
  // Оставляем contactPerson для обратной совместимости + DaData
  contactPerson: z.string().max(200).default(''),
  // Связь с Person (контактные лица организации)
  contactPersonIds: z.array(z.string()).default([]),
  paymentTermDays: z.number().int().min(0).default(0),
  vatRate: z.number().min(0).max(100).default(20),
  isActive: z.boolean().default(true),
  roleIds: z.array(z.string()).default([]),
});

export const UpdateOrganizationSchema = CreateOrganizationSchema.partial();

export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>;
