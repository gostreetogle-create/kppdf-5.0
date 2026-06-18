import { describe, it, expect } from 'vitest';
import {
  CreateProductionOrderSchema,
  ProductionOrderStatusSchema,
  UpdateProductionOrderSchema,
} from '../validations/production-order';
import {
  CreateProposalSchema,
  ProposalStatusSchema,
} from '../validations/proposal';
import {
  CreateContractSchema,
  ContractStatusSchema,
} from '../validations/contract';

describe('CreateProductionOrderSchema', () => {
  it('должен пропускать минимальный валидный объект', () => {
    const result = CreateProductionOrderSchema.safeParse({ title: 'Тестовый заказ' });
    expect(result.success).toBe(true);
  });

  it('должен устанавливать статус по умолчанию', () => {
    const result = CreateProductionOrderSchema.parse({ title: 'Тест' });
    expect(result.status).toBe('planned');
  });

  it('должен устанавливать приоритет по умолчанию', () => {
    const result = CreateProductionOrderSchema.parse({ title: 'Тест' });
    expect(result.priority).toBe(0);
  });

  it('должен отклонять пустое название', () => {
    const result = CreateProductionOrderSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('должен пропускать все поля', () => {
    const data = {
      title: 'Заказ №42',
      status: 'in_progress',
      priority: 2,
      ralCode: 'RAL 9010',
      notes: 'Срочно',
      plannedStart: '2026-06-20T00:00:00.000Z',
      plannedEnd: '2026-06-25T00:00:00.000Z',
    };
    const result = CreateProductionOrderSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('должен отклонять невалидный статус', () => {
    const result = CreateProductionOrderSchema.safeParse({ title: 'Тест', status: 'invalid_status' });
    expect(result.success).toBe(false);
  });

  it('должен отклонять отрицательный приоритет', () => {
    const result = CreateProductionOrderSchema.safeParse({ title: 'Тест', priority: -1 });
    expect(result.success).toBe(false);
  });
});

describe('UpdateProductionOrderSchema', () => {
  it('должен быть partial — все поля опциональны', () => {
    const result = UpdateProductionOrderSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('должен пропускать частичное обновление', () => {
    const result = UpdateProductionOrderSchema.safeParse({ status: 'completed' });
    expect(result.success).toBe(true);
  });
});

describe('ProductionOrderStatusSchema', () => {
  it('должен пропускать валидный статус', () => {
    const result = ProductionOrderStatusSchema.safeParse({ status: 'completed' });
    expect(result.success).toBe(true);
  });

  it('должен отклонять невалидный статус', () => {
    const result = ProductionOrderStatusSchema.safeParse({ status: 'deleted' });
    expect(result.success).toBe(false);
  });
});

describe('CreateProposalSchema', () => {
  it('должен пропускать минимальный валидный объект', () => {
    const result = CreateProposalSchema.safeParse({ title: 'КП для клиента' });
    expect(result.success).toBe(true);
  });

  it('должен устанавливать статус по умолчанию', () => {
    const result = CreateProposalSchema.parse({ title: 'Тест' });
    expect(result.status).toBe('draft');
  });

  it('должен отклонять пустое название', () => {
    const result = CreateProposalSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('должен пропускать RAL код', () => {
    const result = CreateProposalSchema.safeParse({ title: 'Тест', ralCode: 'RAL 9010' });
    expect(result.success).toBe(true);
  });

  it('должен валидировать items', () => {
    const data = {
      title: 'КП',
      items: [
        { quantity: 2, unitPrice: 1000 },
        { quantity: 1, unitPrice: 500 },
      ],
    };
    const result = CreateProposalSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('должен отклонять items с отрицательным quantity', () => {
    const data = {
      title: 'КП',
      items: [{ quantity: -1, unitPrice: 1000 }],
    };
    const result = CreateProposalSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('ProposalStatusSchema', () => {
  it('должен пропускать статус paid', () => {
    const result = ProposalStatusSchema.safeParse({ status: 'paid' });
    expect(result.success).toBe(true);
  });

  it('должен отклонять неизвестный статус', () => {
    const result = ProposalStatusSchema.safeParse({ status: 'unknown' });
    expect(result.success).toBe(false);
  });
});

describe('CreateContractSchema', () => {
  it('должен пропускать минимальный валидный объект', () => {
    const result = CreateContractSchema.safeParse({ title: 'Договор поставки' });
    expect(result.success).toBe(true);
  });

  it('должен устанавливать статус по умолчанию', () => {
    const result = CreateContractSchema.parse({ title: 'Тест' });
    expect(result.status).toBe('draft');
  });

  it('должен отклонять пустое название', () => {
    const result = CreateContractSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('должен пропускать все поля', () => {
    const data = {
      title: 'Договор №42',
      status: 'active',
      totalAmount: 150000,
      notes: 'Срочный заказ',
      signedAt: '2026-06-20T00:00:00.000Z',
    };
    const result = CreateContractSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('должен отклонять невалидный статус', () => {
    const result = CreateContractSchema.safeParse({ title: 'Тест', status: 'deleted' });
    expect(result.success).toBe(false);
  });

  it('должен пропускать items', () => {
    const data = {
      title: 'Договор',
      items: [
        { name: 'Стол', quantity: 2, unitPrice: 15000 },
        { name: 'Стул', quantity: 10, unitPrice: 5000 },
      ],
    };
    const result = CreateContractSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('должен отклонять item с пустым названием', () => {
    const data = {
      title: 'Договор',
      items: [{ name: '', quantity: 1, unitPrice: 100 }],
    };
    const result = CreateContractSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('должен отклонять отрицательный totalAmount', () => {
    const result = CreateContractSchema.safeParse({ title: 'Тест', totalAmount: -100 });
    expect(result.success).toBe(false);
  });
});

describe('ContractStatusSchema', () => {
  it('должен пропускать активный статус', () => {
    const result = ContractStatusSchema.safeParse({ status: 'active' });
    expect(result.success).toBe(true);
  });

  it('должен отклонять невалидный статус', () => {
    const result = ContractStatusSchema.safeParse({ status: 'unknown' });
    expect(result.success).toBe(false);
  });
});
