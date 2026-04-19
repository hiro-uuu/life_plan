import { describe, it, expect } from 'vitest';
import { calcChildAllowance } from '@/domain/childAllowance';
import type { Child } from '@/types/child';

function makeChild(birthYear: number): Child {
  return {
    id: `c-${birthYear}`,
    birthYear,
    maternityPauseApplied: true,
    educationPlan: {
      daycare: 'public',
      elementary: 'public',
      juniorHigh: 'public',
      highSchool: 'public',
      university: 'public',
    },
    childFoodAnnual: 0,
    childMiscAnnual: 0,
    applyInflationToChildCosts: false,
  };
}

describe('calcChildAllowance', () => {
  it('returns 0 for no children', () => {
    expect(calcChildAllowance([], 2026)).toBe(0);
  });

  it('returns 15,000/month for child age 0-2', () => {
    const children = [makeChild(2026)];
    // year 2026: age 0
    expect(calcChildAllowance(children, 2026)).toBe(15_000 * 12);
    // year 2028: age 2
    expect(calcChildAllowance(children, 2028)).toBe(15_000 * 12);
  });

  it('returns 10,000/month for child age 3-18', () => {
    const children = [makeChild(2020)];
    // year 2026: age 6
    expect(calcChildAllowance(children, 2026)).toBe(10_000 * 12);
    // year 2038: age 18
    expect(calcChildAllowance(children, 2038)).toBe(10_000 * 12);
  });

  it('returns 0 for child age 19+', () => {
    const children = [makeChild(2006)];
    // year 2026: age 20 → still countable but no allowance (over 18)
    expect(calcChildAllowance(children, 2026)).toBe(0);
  });

  it('returns 0 for unborn child', () => {
    const children = [makeChild(2028)];
    expect(calcChildAllowance(children, 2026)).toBe(0);
  });

  it('applies third-child bonus of 30,000/month', () => {
    const children = [
      makeChild(2020),
      makeChild(2022),
      makeChild(2024),
    ];
    // year 2026: ages 6, 4, 2
    // child 1 (age 6): 10,000/mo = 120,000
    // child 2 (age 4): 10,000/mo = 120,000
    // child 3 (age 2): 30,000/mo = 360,000  (third child)
    expect(calcChildAllowance(children, 2026)).toBe(120_000 + 120_000 + 360_000);
  });

  it('counts children up to 22 for third-child determination', () => {
    const children = [
      makeChild(2005), // age 21 in 2026 → still countable, no allowance (>18)
      makeChild(2010), // age 16 in 2026 → 2nd child, 10,000/mo
      makeChild(2020), // age 6 in 2026 → 3rd child, 30,000/mo
    ];
    expect(calcChildAllowance(children, 2026)).toBe(
      0 + 120_000 + 360_000,
    );
  });

  it('sums multiple eligible children', () => {
    const children = [
      makeChild(2020),
      makeChild(2023),
    ];
    // year 2026: ages 6, 3
    // both: 10,000/mo = 120,000 each
    expect(calcChildAllowance(children, 2026)).toBe(240_000);
  });
});
