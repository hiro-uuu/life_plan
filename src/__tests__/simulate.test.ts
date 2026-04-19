import { describe, it, expect } from 'vitest';
import { simulate } from '@/domain/simulate';
import { createDefaultScenario } from '@/presets/defaultScenario';
import type { Scenario } from '@/types/scenario';

function fixScenario(base: Scenario): Scenario {
  // テスト安定化のため固定年齢・固定年
  return {
    ...base,
    initialConditions: {
      ...base.initialConditions,
      startYear: 2026,
      husbandAge: 29,
      wifeAge: 29,
      endAge: 65,
    },
    children: [
      {
        ...base.children[0]!,
        birthYear: 2027,
      },
    ],
  };
}

describe('simulate', () => {
  it('produces 37 rows from age 29 to 65 inclusive', () => {
    const scenario = fixScenario(createDefaultScenario());
    const out = simulate(scenario);
    expect(out.rows).toHaveLength(37);
    expect(out.rows[0]!.year).toBe(2026);
    expect(out.rows[0]!.husbandAge).toBe(29);
    expect(out.rows[out.rows.length - 1]!.year).toBe(2062);
    expect(out.rows[out.rows.length - 1]!.husbandAge).toBe(65);
  });

  it('netAssets = cash + investment - loanOutstanding for every row', () => {
    const scenario = fixScenario(createDefaultScenario());
    const out = simulate(scenario);
    for (const row of out.rows) {
      const expected = row.cashSavings + row.investmentBalance - row.loanOutstandingBalance;
      // Math.round で丸めているので ±1 の誤差を許容
      expect(Math.abs(row.netAssets - expected)).toBeLessThanOrEqual(1);
    }
  });

  it('wife income becomes 0 in maternity year (birthYear + 0)', () => {
    const scenario = fixScenario(createDefaultScenario());
    const out = simulate(scenario);
    const birthRow = out.rows.find((r) => r.year === 2027)!;
    expect(birthRow.wifeIncome).toBe(0);
    expect(birthRow.isMaternityLeaveYear).toBe(true);
    const nextRow = out.rows.find((r) => r.year === 2028)!;
    expect(nextRow.wifeIncome).toBeGreaterThan(0);
  });

  it('child education cost jumps at elementary entry age (6)', () => {
    const scenario = fixScenario(createDefaultScenario());
    const out = simulate(scenario);
    // child born 2027 → age 6 in 2033 (daycare 5 → elementary 6)
    const beforeRow = out.rows.find((r) => r.year === 2032)!;
    const afterRow = out.rows.find((r) => r.year === 2033)!;
    // daycare public = 300k, elementary public = 350k → わずかに上がる
    expect(afterRow.childExpenseBreakdown.education).toBeGreaterThan(
      beforeRow.childExpenseBreakdown.education - 1,
    );
    // 大学入学 (18歳 = 2045年) でさらに跳ね上がる
    const uniRow = out.rows.find((r) => r.year === 2045)!;
    expect(uniRow.childExpenseBreakdown.education).toBeGreaterThan(
      afterRow.childExpenseBreakdown.education,
    );
  });

  it('small initial cash triggers cashNegative warning', () => {
    const scenario: Scenario = {
      ...fixScenario(createDefaultScenario()),
      initialConditions: {
        ...fixScenario(createDefaultScenario()).initialConditions,
        initialCashSavings: 0,
      },
    };
    // 無理やり支出を大きく
    scenario.expense.categories.fixedCosts.annualAmount = 10_000_000;
    const out = simulate(scenario);
    expect(out.warnings.length).toBeGreaterThan(0);
    expect(out.warnings[0]!.kind).toBe('cashNegative');
  });

  it('mortgage loan reduces outstanding balance each year and zeros out at end', () => {
    const base = fixScenario(createDefaultScenario());
    const scenario: Scenario = {
      ...base,
      loans: [
        {
          id: 'm1',
          kind: 'mortgage',
          name: '住宅ローン',
          principal: 40_000_000,
          annualInterestRatePercent: 1.2,
          termYears: 35,
          startYear: 2027,
        },
      ],
    };
    const out = simulate(scenario);
    const startRow = out.rows.find((r) => r.year === 2027)!;
    const midRow = out.rows.find((r) => r.year === 2040)!;
    const endRow = out.rows.find((r) => r.year === 2061)!;
    expect(startRow.loanOutstandingBalance).toBeGreaterThan(30_000_000);
    expect(midRow.loanOutstandingBalance).toBeLessThan(startRow.loanOutstandingBalance);
    expect(endRow.loanOutstandingBalance).toBeLessThan(1);
    expect(startRow.loanRepayment).toBeGreaterThan(0);
  });
});
