import { describe, it, expect } from 'vitest';
import { formatDocNumber } from '../counter';

describe('formatDocNumber', () => {
  it('должен форматировать номер с префиксом и нулями', () => {
    expect(formatDocNumber('КП', 1)).toBe('КП-0001');
    expect(formatDocNumber('Д', 42)).toBe('Д-0042');
    expect(formatDocNumber('ЗК', 100)).toBe('ЗК-0100');
    expect(formatDocNumber('ОТГ', 9999)).toBe('ОТГ-9999');
  });

  it('должен обрабатывать большие числа', () => {
    expect(formatDocNumber('СФ', 10000)).toBe('СФ-10000');
    expect(formatDocNumber('ЗП', 123456)).toBe('ЗП-123456');
  });

  it('должен обрабатывать пустой префикс', () => {
    expect(formatDocNumber('', 1)).toBe('-0001');
  });

  it('должен обрабатывать префикс с дефисом', () => {
    expect(formatDocNumber('АС', 5)).toBe('АС-0005');
  });
});
