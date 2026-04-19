import { describe, it, expect } from 'vitest';
import {
  calcRetirementDeduction,
  calcRetirementTax,
  calcRetirementNet,
  getRetirementBonusForYear,
} from '@/domain/retirement';
import type { RetirementBonusConfig } from '@/types/tax';

describe('calcRetirementDeduction', () => {
  it('returns 0 for 0 years', () => {
    expect(calcRetirementDeduction(0)).toBe(0);
  });

  it('returns min 800,000 for short tenure', () => {
    expect(calcRetirementDeduction(1)).toBe(800_000);
    expect(calcRetirementDeduction(2)).toBe(800_000);
  });

  it('returns 40万 × years for 3-20 years', () => {
    expect(calcRetirementDeduction(10)).toBe(4_000_000);
    expect(calcRetirementDeduction(20)).toBe(8_000_000);
  });

  it('returns 800万 + 70万 × (years-20) for over 20 years', () => {
    expect(calcRetirementDeduction(25)).toBe(8_000_000 + 700_000 * 5);
    expect(calcRetirementDeduction(35)).toBe(8_000_000 + 700_000 * 15);
    // 35 years: 8M + 10.5M = 18.5M
    expect(calcRetirementDeduction(35)).toBe(18_500_000);
  });
});

describe('calcRetirementTax', () => {
  it('returns 0 when amount <= deduction', () => {
    // 35 years → deduction = 18.5M
    expect(calcRetirementTax(18_500_000, 35)).toBe(0);
    expect(calcRetirementTax(10_000_000, 35)).toBe(0);
  });

  it('calculates tax for amount > deduction', () => {
    // 35 years, 20M retirement
    // deduction: 18.5M
    // taxable: (20M - 18.5M) / 2 = 750,000
    // income tax on 750,000 (5% bracket): 37,500 * 1.021 = 38,288 (rounded)
    // resident tax: 750,000 * 10% = 75,000
    const tax = calcRetirementTax(20_000_000, 35);
    expect(tax).toBeGreaterThan(0);
    expect(tax).toBe(Math.round(37_500 * 1.021) + 75_000);
  });

  it('returns 0 for 0 amount', () => {
    expect(calcRetirementTax(0, 35)).toBe(0);
  });
});

describe('calcRetirementNet', () => {
  it('returns full amount when tax is 0', () => {
    const config: RetirementBonusConfig = {
      enabled: true,
      amount: 18_000_000,
      retireYear: 2060,
      yearsOfService: 35,
    };
    expect(calcRetirementNet(config)).toBe(18_000_000);
  });

  it('returns amount - tax', () => {
    const config: RetirementBonusConfig = {
      enabled: true,
      amount: 30_000_000,
      retireYear: 2060,
      yearsOfService: 35,
    };
    const net = calcRetirementNet(config);
    expect(net).toBeLessThan(30_000_000);
    expect(net).toBeGreaterThan(25_000_000);
  });

  it('returns 0 when disabled', () => {
    expect(
      calcRetirementNet({
        enabled: false,
        amount: 20_000_000,
        retireYear: 2060,
        yearsOfService: 35,
      }),
    ).toBe(0);
  });
});

describe('getRetirementBonusForYear', () => {
  const config: RetirementBonusConfig = {
    enabled: true,
    amount: 20_000_000,
    retireYear: 2060,
    yearsOfService: 35,
  };

  it('returns 0 for non-retirement year', () => {
    expect(getRetirementBonusForYear(config, 2050)).toBe(0);
  });

  it('returns net amount for retirement year', () => {
    const net = getRetirementBonusForYear(config, 2060);
    expect(net).toBeGreaterThan(0);
    expect(net).toBeLessThanOrEqual(20_000_000);
  });

  it('returns 0 when config is undefined', () => {
    expect(getRetirementBonusForYear(undefined, 2060)).toBe(0);
  });
});
