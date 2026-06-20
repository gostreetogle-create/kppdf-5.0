import { describe, it, expect } from 'vitest';
import { CreateClientSchema, UpdateClientSchema } from '../validations/client';
import { CreateProductSchema, ProductModuleInputSchema, ModuleMaterialSchema } from '../validations/product';
import { CreateWarehouseSchema } from '../validations/warehouse';
import { CreateTenderSchema } from '../validations/tender';

// ═══════════════════════════════════════════════════════════════
// Client Validation (discriminated union: individual | legal)
// ═══════════════════════════════════════════════════════════════

describe('CreateClientSchema — individual', () => {
  it('должен пропускать минимальный валидный объект', () => {
    const result = CreateClientSchema.safeParse({
      type: 'individual',
      lastName: 'Иванов',
      firstName: 'Иван',
      phone: '+7 999 123 4567',
    });
    expect(result.success).toBe(true);
  });

  it('должен отклонять без lastName', () => {
    const result = CreateClientSchema.safeParse({
      type: 'individual',
      firstName: 'Иван',
      phone: '+7 999 123 4567',
    });
    expect(result.success).toBe(false);
  });

  it('должен отклонять без phone', () => {
    const result = CreateClientSchema.safeParse({
      type: 'individual',
      lastName: 'Иванов',
      firstName: 'Иван',
    });
    expect(result.success).toBe(false);
  });

  it('должен принимать INN 12 цифр для ИП', () => {
    const result = CreateClientSchema.safeParse({
      type: 'individual',
      lastName: 'Петров',
      firstName: 'Пётр',
      phone: '+7 999 000 1111',
      inn: '123456789012',
    });
    expect(result.success).toBe(true);
  });

  it('должен отклонять INN с буквами', () => {
    const result = CreateClientSchema.safeParse({
      type: 'individual',
      lastName: 'Петров',
      firstName: 'Пётр',
      phone: '+7 999 000 1111',
      inn: '12345abc9012',
    });
    expect(result.success).toBe(false);
  });

  it('должен устанавливать isActive=true по умолчанию', () => {
    const result = CreateClientSchema.parse({
      type: 'individual',
      lastName: 'Тест',
      firstName: 'Тест',
      phone: '+7 000 000 0000',
    });
    expect(result.isActive).toBe(true);
  });
});

describe('CreateClientSchema — legal', () => {
  it('должен пропускать минимальный валидный объект', () => {
    const result = CreateClientSchema.safeParse({
      type: 'legal',
      companyName: 'ООО Ромашка',
      inn: '1234567890',
      legalForm: 'ООО',
      legalAddress: 'г. Москва, ул. Ленина, д. 1',
      phone: '+7 495 111 2233',
    });
    expect(result.success).toBe(true);
  });

  it('должен отклонять без companyName', () => {
    const result = CreateClientSchema.safeParse({
      type: 'legal',
      inn: '1234567890',
      legalForm: 'ООО',
      legalAddress: 'г. Москва',
      phone: '+7 495 111 2233',
    });
    expect(result.success).toBe(false);
  });

  it('должен отклонять без legalAddress', () => {
    const result = CreateClientSchema.safeParse({
      type: 'legal',
      companyName: 'ООО Тест',
      inn: '1234567890',
      legalForm: 'ООО',
      phone: '+7 495 111 2233',
    });
    expect(result.success).toBe(false);
  });

  it('должен принимать ИНН 10 цифр', () => {
    const result = CreateClientSchema.safeParse({
      type: 'legal',
      companyName: 'ООО Тест',
      inn: '1234567890',
      legalForm: 'ООО',
      legalAddress: 'г. Москва',
      phone: '+7 495 111 2233',
    });
    expect(result.success).toBe(true);
  });

  it('должен отклонять ИНН 8 цифр', () => {
    const result = CreateClientSchema.safeParse({
      type: 'legal',
      companyName: 'ООО Тест',
      inn: '12345678',
      legalForm: 'ООО',
      legalAddress: 'г. Москва',
      phone: '+7 495 111 2233',
    });
    expect(result.success).toBe(false);
  });

  it('должен принимать КПП 9 цифр', () => {
    const result = CreateClientSchema.safeParse({
      type: 'legal',
      companyName: 'ООО Тест',
      inn: '1234567890',
      kpp: '123456789',
      legalForm: 'ООО',
      legalAddress: 'г. Москва',
      phone: '+7 495 111 2233',
    });
    expect(result.success).toBe(true);
  });
});

describe('UpdateClientSchema', () => {
  it('должен быть partial — все поля опциональны', () => {
    const result = UpdateClientSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('должен принимать частичное обновление', () => {
    const result = UpdateClientSchema.safeParse({ phone: '+7 999 111 2222' });
    expect(result.success).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// Product Validation
// ═══════════════════════════════════════════════════════════════

describe('CreateProductSchema', () => {
  it('должен пропускать минимальный валидный объект', () => {
    const result = CreateProductSchema.safeParse({ sku: 'SKU-001', name: 'Стул офисный' });
    expect(result.success).toBe(true);
  });

  it('должен устанавливать productType=purchased по умолчанию', () => {
    const result = CreateProductSchema.parse({ sku: 'SKU-001', name: 'Стул' });
    expect(result.productType).toBe('purchased');
  });

  it('должен устанавливать unit=шт по умолчанию', () => {
    const result = CreateProductSchema.parse({ sku: 'SKU-001', name: 'Стул' });
    expect(result.unit).toBe('шт');
  });

  it('должен отклонять пустой sku', () => {
    const result = CreateProductSchema.safeParse({ sku: '', name: 'Стул' });
    expect(result.success).toBe(false);
  });

  it('должен отклонять пустое name', () => {
    const result = CreateProductSchema.safeParse({ sku: 'SKU-001', name: '' });
    expect(result.success).toBe(false);
  });

  it('должен отклонять отрицательную basePrice', () => {
    const result = CreateProductSchema.safeParse({ sku: 'SKU-001', name: 'Стул', basePrice: -100 });
    expect(result.success).toBe(false);
  });

  it('должен принимать все поля', () => {
    const data = {
      sku: 'SKU-001',
      name: 'Стул офисный',
      description: 'Удобный стул',
      productType: 'manufactured' as const,
      basePrice: 15000,
      defaultMarkupPercent: 20,
      unit: 'шт',
      weightKg: 8.5,
      hasPassport: true,
      hasDrawing: false,
      ralCode: 'RAL 9010',
    };
    const result = CreateProductSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});

describe('ModuleMaterialSchema', () => {
  it('должен пропускать минимальный объект', () => {
    const result = ModuleMaterialSchema.safeParse({ name: 'Фанера' });
    expect(result.success).toBe(true);
  });

  it('должен устанавливать quantity=1 и unit=шт по умолчанию', () => {
    const result = ModuleMaterialSchema.parse({ name: 'Фанера' });
    expect(result.quantity).toBe(1);
    expect(result.unit).toBe('шт');
  });

  it('должен отклонять пустое name', () => {
    const result = ModuleMaterialSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });
});

describe('ProductModuleInputSchema', () => {
  it('должен пропускать минимальный объект', () => {
    const result = ProductModuleInputSchema.safeParse({ name: 'Каркас стола' });
    expect(result.success).toBe(true);
  });

  it('должен принимать вложенные materials', () => {
    const result = ProductModuleInputSchema.safeParse({
      name: 'Каркас',
      materials: [{ name: 'Фанера' }, { name: 'Краска', quantity: 2 }],
    });
    expect(result.success).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// Warehouse Validation
// ═══════════════════════════════════════════════════════════════

describe('CreateWarehouseSchema', () => {
  it('должен пропускать минимальный объект', () => {
    const result = CreateWarehouseSchema.safeParse({ name: 'Основной склад' });
    expect(result.success).toBe(true);
  });

  it('должен отклонять пустое name', () => {
    const result = CreateWarehouseSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// Tender Validation
// ═══════════════════════════════════════════════════════════════

describe('CreateTenderSchema', () => {
  it('должен пропускать минимальный объект', () => {
    const result = CreateTenderSchema.safeParse({ title: 'Тендер на поставку мебели' });
    expect(result.success).toBe(true);
  });

  it('должен устанавливать статус draft по умолчанию', () => {
    const result = CreateTenderSchema.parse({ title: 'Тест' });
    expect(result.status).toBe('draft');
  });

  it('должен отклонять пустое title', () => {
    const result = CreateTenderSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });
});
