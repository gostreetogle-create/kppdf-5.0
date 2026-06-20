import { z } from 'zod';

// Cycle 54 (B.2): Client модель расширена для поддержки юрлиц (B2B).
// Discriminated union по полю `type` вместо single flat schema — более
// строгая валидация, Zod выдаст точный branch при ошибке.

const phoneSchema = z
  .string()
  .min(1, 'Телефон обязателен')
  .max(50);

/** Общие поля для обоих типов клиентов. */
const baseSchema = z.object({
  phone: phoneSchema,
  email: z.string().max(200).optional(),
  personalMarkupPercent: z.number().min(0).max(100).optional(),
  notes: z.string().max(2000).optional(),
  isActive: z.boolean().default(true),
  organizationId: z.string().cuid().optional(),
});

/** Физлицо (default): требуются ФИО, опционально ИНН 12 цифр (ИП). */
const individualSchema = baseSchema.extend({
  type: z.literal('individual'),
  lastName: z.string().min(1, 'Фамилия обязательна').max(200),
  firstName: z.string().min(1, 'Имя обязательно').max(200),
  patronymic: z.string().max(200).optional(),
  inn: z
    .string()
    .regex(/^\d{12}$/, 'ИНН физлица/ИП должен содержать 12 цифр')
    .optional()
    .or(z.literal('')), // empty string from form = not provided
  address: z.string().max(500).optional(),
});

/** Юрлицо: обязательны companyName, inn (10 или 12 цифр), legalForm. */
const legalSchema = baseSchema.extend({
  type: z.literal('legal'),
  // lastName/firstName не required для legal — могут отсутствовать.
  // Дефолты '' обеспечивают non-null в DB (старые колонки NOT NULL).
  lastName: z.string().max(200).optional().default(''),
  firstName: z.string().max(200).optional().default(''),
  patronymic: z.string().max(200).optional(),
  // ИНН юрлица: 10 цифр (ООО/ОАО/ЗАО/etc.) или 12 (ИП).
  inn: z
    .string()
    .regex(/^\d{10}$|^\d{12}$/, 'ИНН юрлица: 10 цифр (юрлицо) или 12 (ИП)'),
  kpp: z
    .string()
    .regex(/^\d{9}$/, 'КПП должен содержать 9 цифр')
    .optional()
    .or(z.literal('')),
  ogrn: z
    .string()
    .regex(/^\d{13}$|^\d{15}$/, 'ОГРН: 13 цифр (юрлицо) или 15 (ИП)')
    .optional()
    .or(z.literal('')),
  legalAddress: z
    .string()
    .min(1, 'Юридический адрес обязателен')
    .max(500),
  companyName: z
    .string()
    .min(1, 'Название компании обязательно')
    .max(500),
  legalForm: z
    .string()
    .min(1, 'Организационно-правовая форма обязательна (ООО, ИП, АО, ПАО)')
    .max(50),
});

export const CreateClientSchema = z.discriminatedUnion('type', [
  individualSchema,
  legalSchema,
]);

/**
 * Update schema — flat permissive partial (cycle 54 backward-compat decision).
 *
 * Применяется к PUT /api/clients/[id]. Используем flat partial (не DU union)
 * потому что:
 *  - существующие API-консьюмеры могут PUT-ить без поля `type` —
 *    существующий client.type в БД остаётся;
 *  - flat partial не enforced discriminant pattern для update-flow;
 *  - при type change individual→legal или vice versa — валидация на уровне
 *    API может быть расширена (cycle-54.5 deferred).
 *
 * Если сделать strict DU union для UPDATE — старые клиенты теряют данные.
 */
export const UpdateClientSchema = z
  .object({
    type: z.enum(['individual', 'legal']).optional(),
    // individual
    lastName: z.string().max(200).optional(),
    firstName: z.string().max(200).optional(),
    patronymic: z.string().max(200).optional(),
    address: z.string().max(500).optional(),
    // legal
    companyName: z.string().max(500).optional(),
    legalForm: z.string().max(50).optional(),
    kpp: z.string().regex(/^\d{9}$/).optional().or(z.literal('')),
    ogrn: z.string().regex(/^\d{13}$|^\d{15}$/).optional().or(z.literal('')),
    legalAddress: z.string().max(500).optional(),
    // common
    phone: z.string().min(1).max(50).optional(),
    email: z.string().max(200).optional(),
    inn: z
      .string()
      .regex(/^\d{10}$|^\d{12}$/)
      .max(20)
      .optional(),
    personalMarkupPercent: z.number().min(0).max(100).optional(),
    notes: z.string().max(2000).optional(),
    isActive: z.boolean().optional(),
    organizationId: z.string().cuid().optional(),
  })
  .partial();

export type CreateClientInput = z.infer<typeof CreateClientSchema>;
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;
