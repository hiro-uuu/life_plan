import { describe, it, expect } from 'vitest';
import {
  buildAmortizationSchedule,
  computeMonthlyPayment,
  getLoanPaymentForYear,
} from '@/domain/loan';
import type { Loan } from '@/types/loan';

const baseLoan: Loan = {
  id: 'l1',
  kind: 'mortgage',
  name: '住宅ローン',
  principal: 40_000_000,
  annualInterestRatePercent: 1.2,
  termYears: 35,
  startYear: 2026,
};

describe('loan', () => {
  it('computes monthly payment approx 116,681 for 40M / 1.2% / 35y', () => {
    const m = computeMonthlyPayment(baseLoan);
    expect(Math.round(m)).toBeGreaterThanOrEqual(116_680);
    expect(Math.round(m)).toBeLessThanOrEqual(116_682);
  });

  it('amortization schedule has termYears entries and final balance ~ 0', () => {
    const schedule = buildAmortizationSchedule(baseLoan);
    expect(schedule).toHaveLength(35);
    const last = schedule[schedule.length - 1]!;
    expect(Math.abs(last.outstandingBalance)).toBeLessThan(1);
    // 元金合計 ≈ principal
    const principalSum = schedule.reduce((a, r) => a + r.principal, 0);
    expect(Math.abs(principalSum - baseLoan.principal)).toBeLessThan(1);
  });

  it('zero interest case: monthly = P / n', () => {
    const loan: Loan = { ...baseLoan, annualInterestRatePercent: 0, termYears: 10 };
    const m = computeMonthlyPayment(loan);
    expect(m).toBeCloseTo(loan.principal / (10 * 12), 6);
    const schedule = buildAmortizationSchedule(loan);
    // 利息は 0
    for (const row of schedule) {
      expect(row.interest).toBeCloseTo(0, 6);
    }
  });

  it('returns 0 for years before start or after end', () => {
    const schedule = buildAmortizationSchedule(baseLoan);
    const before = getLoanPaymentForYear(baseLoan, schedule, 2025);
    const after = getLoanPaymentForYear(baseLoan, schedule, 2026 + 35);
    expect(before.total).toBe(0);
    expect(before.interest).toBe(0);
    expect(before.principal).toBe(0);
    expect(after.total).toBe(0);
  });

  it('annual total for a mid-year is positive and less than yearly payment cap', () => {
    const schedule = buildAmortizationSchedule(baseLoan);
    const mid = getLoanPaymentForYear(baseLoan, schedule, 2026);
    expect(mid.total).toBeGreaterThan(0);
    // 12 × monthlyPayment 近辺
    const m = computeMonthlyPayment(baseLoan);
    expect(mid.total).toBeCloseTo(m * 12, 0);
  });
});
