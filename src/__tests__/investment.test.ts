import { describe, it, expect } from 'vitest';
import { stepInvestment } from '@/domain/investment';
import type { InvestmentConfig } from '@/types/investment';

describe('investment', () => {
  it('1M principal, 4% yield, no contribution, 10 years ≈ 1,480,244', () => {
    const config: InvestmentConfig = {
      initialBalance: 1_000_000,
      annualContribution: 0,
      annualYieldPercent: 4,
    };
    let balance = config.initialBalance;
    for (let i = 0; i < 10; i++) {
      const step = stepInvestment(balance, config, i, 2026 + i);
      balance = step.balance;
    }
    // 1,000,000 * 1.04^10 = 1,480,244.28...
    expect(Math.round(balance)).toBe(1_480_244);
  });

  it('contribution each year grows the balance via compounding', () => {
    const config: InvestmentConfig = {
      initialBalance: 0,
      annualContribution: 600_000,
      annualYieldPercent: 4,
    };
    let balance = 0;
    for (let i = 0; i < 5; i++) {
      const step = stepInvestment(balance, config, i, 2026 + i);
      balance = step.balance;
    }
    // 期末積立の近似: sum_{k=0..4} 600,000 * (1.04)^k  = 600000 * ((1.04^5 - 1)/0.04)
    const expected = 600_000 * ((Math.pow(1.04, 5) - 1) / 0.04);
    expect(balance).toBeCloseTo(expected, 0);
  });

  it('stopContributionYear stops contributions', () => {
    const config: InvestmentConfig = {
      initialBalance: 0,
      annualContribution: 100_000,
      annualYieldPercent: 0,
      stopContributionYear: 2028,
    };
    let balance = 0;
    const years = [2026, 2027, 2028, 2029];
    for (let i = 0; i < years.length; i++) {
      balance = stepInvestment(balance, config, i, years[i]!).balance;
    }
    // 2026, 2027 の 2 回だけ積立 → 200,000
    expect(balance).toBe(200_000);
  });

  it('contributionRaiseAmount adds per year', () => {
    const config: InvestmentConfig = {
      initialBalance: 0,
      annualContribution: 100_000,
      contributionRaiseAmount: 10_000,
      annualYieldPercent: 0,
    };
    let balance = 0;
    for (let i = 0; i < 3; i++) {
      balance = stepInvestment(balance, config, i, 2026 + i).balance;
    }
    // 100,000 + 110,000 + 120,000 = 330,000
    expect(balance).toBe(330_000);
  });
});
