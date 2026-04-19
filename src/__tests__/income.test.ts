import { describe, it, expect } from 'vitest';
import { computeHusbandIncome, computeWifeIncome, isMaternityLeaveYear } from '@/domain/income';
import type { HusbandSalary, WifeSalary } from '@/types/income';
import type { Child } from '@/types/child';
import { defaultEducationPlan } from '@/presets/defaultScenario';

const husband: HusbandSalary = {
  annualTakeHome: 6_000_000,
  annualRaiseAmount: 100_000,
};

const wife: WifeSalary = {
  annualTakeHome: 3_000_000,
  maternityLeaveYears: 1,
};

function makeChild(birthYear: number, maternityPauseApplied = true): Child {
  return {
    id: `c-${birthYear}`,
    birthYear,
    maternityPauseApplied,
    educationPlan: defaultEducationPlan(),
    childFoodAnnual: 200_000,
    childMiscAnnual: 100_000,
    applyInflationToChildCosts: true,
  };
}

describe('income', () => {
  it('husband income = base + raise * index', () => {
    expect(computeHusbandIncome(husband, 0, 2026)).toBe(6_000_000);
    expect(computeHusbandIncome(husband, 5, 2031)).toBe(6_500_000);
    expect(computeHusbandIncome(husband, 10, 2036)).toBe(7_000_000);
  });

  it('husband income is 0 after retireYear', () => {
    const h: HusbandSalary = { ...husband, retireYear: 2035 };
    expect(computeHusbandIncome(h, 9, 2035)).toBe(0);
    expect(computeHusbandIncome(h, 8, 2034)).toBeGreaterThan(0);
  });

  it('wife income is 0 only in birth year when maternityLeaveYears=1', () => {
    const children = [makeChild(2027)];
    expect(computeWifeIncome(wife, children, 2026).income).toBe(wife.annualTakeHome);
    expect(computeWifeIncome(wife, children, 2027).income).toBe(0);
    expect(computeWifeIncome(wife, children, 2028).income).toBe(wife.annualTakeHome);
  });

  it('wife income is 0 for 2 years when maternityLeaveYears=2', () => {
    const children = [makeChild(2027)];
    const w: WifeSalary = { ...wife, maternityLeaveYears: 2 };
    expect(computeWifeIncome(w, children, 2027).income).toBe(0);
    expect(computeWifeIncome(w, children, 2028).income).toBe(0);
    expect(computeWifeIncome(w, children, 2029).income).toBe(w.annualTakeHome);
  });

  it('maternityPauseApplied=false disables pause for that child', () => {
    const children = [makeChild(2027, false)];
    expect(isMaternityLeaveYear(wife, children, 2027)).toBe(false);
    expect(computeWifeIncome(wife, children, 2027).income).toBe(wife.annualTakeHome);
  });

  it('multiple children pause separately (with maternityLeaveYears=1)', () => {
    const children = [makeChild(2027), makeChild(2030)];
    expect(computeWifeIncome(wife, children, 2027).income).toBe(0);
    expect(computeWifeIncome(wife, children, 2028).income).toBe(wife.annualTakeHome);
    expect(computeWifeIncome(wife, children, 2030).income).toBe(0);
  });
});
