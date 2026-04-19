import { describe, it, expect } from 'vitest';
import { buildInflationFactors } from '@/domain/inflation';
import { computeExpenseByCategory } from '@/domain/expense';
import type { ExpenseCategoryKey, ExpenseItem } from '@/types/expense';

describe('inflation', () => {
  it('factors[i] = (1+rate)^i', () => {
    const f = buildInflationFactors(2, 5);
    expect(f[0]).toBeCloseTo(1, 10);
    expect(f[1]).toBeCloseTo(1.02, 10);
    expect(f[2]).toBeCloseTo(1.0404, 10);
    expect(f[3]).toBeCloseTo(Math.pow(1.02, 3), 10);
  });

  it('only categories with applyInflation=true are inflated', () => {
    const cats: Record<ExpenseCategoryKey, ExpenseItem> = {
      fixedCosts: { annualAmount: 1_000_000, applyInflation: true },
      carCosts: { annualAmount: 500_000, applyInflation: false },
      appliances: { annualAmount: 100_000, applyInflation: true },
      food: { annualAmount: 600_000, applyInflation: false },
      pocketMoney: { annualAmount: 300_000, applyInflation: false },
      dailyNecessities: { annualAmount: 200_000, applyInflation: true },
      misc: { annualAmount: 100_000, applyInflation: false },
      events: { annualAmount: 300_000, applyInflation: true },
    };
    const factor = 1.1;
    const result = computeExpenseByCategory(cats, factor);
    expect(result.fixedCosts).toBeCloseTo(1_100_000, 6);
    expect(result.carCosts).toBe(500_000);
    expect(result.appliances).toBeCloseTo(110_000, 6);
    expect(result.food).toBe(600_000);
    expect(result.dailyNecessities).toBeCloseTo(220_000, 6);
    expect(result.events).toBeCloseTo(330_000, 6);
  });
});
