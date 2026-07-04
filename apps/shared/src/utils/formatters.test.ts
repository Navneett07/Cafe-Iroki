import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDateTime } from './formatters';

describe('Formatters', () => {
  it('formats currency correctly', () => {
    expect(formatCurrency(1500)).toBe('₹1,500');
  });

  it('formats dates correctly', () => {
    const date = new Date('2026-07-04T00:00:00Z');
    expect(formatDateTime(date.toISOString())).toContain('2026');
  });
});
