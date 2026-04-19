import { describe, it, expect } from 'vitest';
import { simulate } from '@/domain/simulate';
import { createDefaultScenario, createDefaultTaxConfig } from '@/presets/defaultScenario';
import type { Scenario } from '@/types/scenario';

function makeGrossScenario(): Scenario {
  const base = createDefaultScenario();
  return {
    ...base,
    version: 2,
    initialConditions: {
      ...base.initialConditions,
      startYear: 2026,
      husbandAge: 29,
      wifeAge: 29,
      endAge: 65,
    },
    income: {
      husband: {
        annualTakeHome: 6_000_000,
        annualGross: 8_000_000,
        annualRaiseAmount: 100_000,
      },
      wife: {
        annualTakeHome: 3_000_000,
        annualGross: 4_000_000,
        maternityLeaveYears: 1,
      },
    },
    children: [
      {
        ...base.children[0]!,
        birthYear: 2027,
      },
    ],
    taxConfig: {
      ...createDefaultTaxConfig(2026),
      incomeInputMode: 'gross',
    },
    investmentAccounts: undefined,
  };
}

function makeTakeHomeScenario(): Scenario {
  const scenario = makeGrossScenario();
  return {
    ...scenario,
    taxConfig: {
      ...scenario.taxConfig!,
      incomeInputMode: 'takeHome',
    },
  };
}

describe('simulate v2 - gross mode', () => {
  it('produces 37 rows from age 29 to 65', () => {
    const out = simulate(makeGrossScenario());
    expect(out.rows).toHaveLength(37);
    expect(out.rows[0]!.year).toBe(2026);
    expect(out.rows[0]!.husbandAge).toBe(29);
  });

  it('includes taxBreakdown when in gross mode', () => {
    const out = simulate(makeGrossScenario());
    const row = out.rows[0]!;
    expect(row.taxBreakdown).toBeDefined();
    expect(row.taxBreakdown!.grossIncome).toBe(12_000_000); // 8M + 4M
    expect(row.taxBreakdown!.socialInsurance).toBeGreaterThan(0);
    expect(row.taxBreakdown!.incomeTax).toBeGreaterThan(0);
    expect(row.taxBreakdown!.residentTax).toBeGreaterThan(0);
  });

  it('does not include taxBreakdown in takeHome mode', () => {
    const out = simulate(makeTakeHomeScenario());
    const row = out.rows[0]!;
    expect(row.taxBreakdown).toBeUndefined();
  });

  it('gross mode income is less than gross salary (taxes deducted)', () => {
    const out = simulate(makeGrossScenario());
    const row = out.rows[0]!;
    // totalIncome should include child allowance but be less than gross
    expect(row.totalIncome).toBeLessThan(12_000_000);
    expect(row.totalIncome).toBeGreaterThan(7_000_000);
  });

  it('netAssets = cash + investment - debt for every row (gross mode)', () => {
    const out = simulate(makeGrossScenario());
    for (const row of out.rows) {
      const expected = row.cashSavings + row.investmentBalance - row.loanOutstandingBalance;
      expect(Math.abs(row.netAssets - expected)).toBeLessThanOrEqual(1);
    }
  });

  it('child allowance is included in gross mode', () => {
    const out = simulate(makeGrossScenario());
    // child born 2027, year 2028 → age 1 → 15,000/mo = 180,000/year
    const row2028 = out.rows.find((r) => r.year === 2028)!;
    expect(row2028.taxBreakdown!.childAllowance).toBe(180_000);
  });

  it('child allowance is 0 before child is born', () => {
    const out = simulate(makeGrossScenario());
    const row2026 = out.rows[0]!;
    expect(row2026.taxBreakdown!.childAllowance).toBe(0);
  });
});

describe('simulate v2 - backward compatibility', () => {
  it('takeHome mode produces same results as v1', () => {
    const v1 = createDefaultScenario();
    const v1Fixed: Scenario = {
      ...v1,
      version: 1,
      initialConditions: {
        ...v1.initialConditions,
        startYear: 2026,
        husbandAge: 29,
        wifeAge: 29,
        endAge: 65,
      },
      children: [{ ...v1.children[0]!, birthYear: 2027 }],
      taxConfig: undefined,
      investmentAccounts: undefined,
    };

    const v2Fixed: Scenario = {
      ...v1Fixed,
      version: 2,
      taxConfig: {
        ...createDefaultTaxConfig(2026),
        incomeInputMode: 'takeHome',
      },
    };

    const out1 = simulate(v1Fixed);
    const out2 = simulate(v2Fixed);

    expect(out2.rows).toHaveLength(out1.rows.length);
    for (let i = 0; i < out1.rows.length; i++) {
      expect(out2.rows[i]!.totalIncome).toBe(out1.rows[i]!.totalIncome);
      expect(out2.rows[i]!.totalExpense).toBe(out1.rows[i]!.totalExpense);
      expect(out2.rows[i]!.cashSavings).toBe(out1.rows[i]!.cashSavings);
      expect(out2.rows[i]!.investmentBalance).toBe(out1.rows[i]!.investmentBalance);
      expect(out2.rows[i]!.netAssets).toBe(out1.rows[i]!.netAssets);
    }
  });
});

describe('simulate v2 - mortgage deduction', () => {
  it('applies housing loan deduction to reduce taxes', () => {
    const scenario = makeGrossScenario();
    scenario.loans = [
      {
        id: 'm1',
        kind: 'mortgage',
        name: '住宅ローン',
        principal: 40_000_000,
        annualInterestRatePercent: 1.2,
        termYears: 35,
        startYear: 2027,
      },
    ];
    scenario.taxConfig = {
      ...scenario.taxConfig!,
      mortgageDeduction: {
        enabled: true,
        housingType: 'certified',
        housingAgeType: 'new',
        isChildRaisingHousehold: false,
        moveInYear: 2027,
      },
    };

    const out = simulate(scenario);
    const row2028 = out.rows.find((r) => r.year === 2028)!;
    // Mortgage deduction should be around year-end-balance * 0.7%
    expect(row2028.taxBreakdown!.mortgageDeduction).toBeGreaterThan(200_000);
    expect(row2028.taxBreakdown!.mortgageDeduction).toBeLessThan(300_000);
  });
});

describe('simulate v2 - property tax', () => {
  it('adds property tax to expenses', () => {
    const scenario = makeGrossScenario();
    scenario.taxConfig = {
      ...scenario.taxConfig!,
      propertyTax: {
        enabled: true,
        landAssessedValue: 10_000_000,
        buildingAssessedValue: 8_000_000,
        isSmallResidentialLand: true,
        isNewConstruction: true,
        isLongLifeHousing: false,
        constructionYear: 2027,
      },
    };

    const out = simulate(scenario);
    const row2028 = out.rows.find((r) => r.year === 2028)!;
    expect(row2028.taxBreakdown!.propertyTax).toBeGreaterThan(0);
  });
});

describe('simulate v2 - retirement bonus', () => {
  it('adds retirement bonus in retirement year', () => {
    const scenario = makeGrossScenario();
    scenario.taxConfig = {
      ...scenario.taxConfig!,
      retirementBonus: {
        enabled: true,
        amount: 20_000_000,
        retireYear: 2060,
        yearsOfService: 35,
      },
    };

    const out = simulate(scenario);
    const retireRow = out.rows.find((r) => r.year === 2060)!;
    expect(retireRow.taxBreakdown!.retirementBonusNet).toBeGreaterThan(0);
    // With 35 years and 20M, deduction is 18.5M so most is tax-free
    expect(retireRow.taxBreakdown!.retirementBonusNet).toBeGreaterThan(19_000_000);
  });
});

describe('simulate v2 - multiple investment accounts', () => {
  it('calculates separate NISA and taxable accounts', () => {
    const scenario = makeGrossScenario();
    scenario.investmentAccounts = [
      {
        id: 'nisa1',
        name: 'NISA',
        accountType: 'nisa',
        initialBalance: 500_000,
        annualContribution: 360_000,
        annualYieldPercent: 4,
      },
      {
        id: 'taxable1',
        name: '課税口座',
        accountType: 'taxable',
        initialBalance: 500_000,
        annualContribution: 240_000,
        annualYieldPercent: 4,
      },
    ];

    const out = simulate(scenario);
    const row = out.rows[0]!;
    expect(row.investmentAccounts).toHaveLength(2);

    const nisa = row.investmentAccounts!.find((a) => a.id === 'nisa1')!;
    const taxable = row.investmentAccounts!.find((a) => a.id === 'taxable1')!;

    // NISA: no tax
    expect(nisa.tax).toBe(0);
    // Taxable: tax on yield
    expect(taxable.tax).toBeGreaterThan(0);

    // Total contribution
    expect(row.investmentContribution).toBe(360_000 + 240_000);
  });
});
