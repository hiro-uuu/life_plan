import { describe, it, expect } from 'vitest';
import {
  calcSalaryDeduction,
  calcSocialInsurance,
  calcIncomeTax,
  calcBaseIncomeTax,
  calcResidentTax,
  calcIncomeDeductions,
  calcGrossToNet,
  calcMortgageDeduction,
  applyMortgageDeduction,
  getMortgageLoanLimit,
  getMortgageDeductionYears,
} from '@/domain/tax';
import type { MortgageDeductionConfig } from '@/types/tax';

describe('calcSalaryDeduction', () => {
  it('returns 550,000 for income <= 1,625,000', () => {
    expect(calcSalaryDeduction(1_000_000)).toBe(550_000);
    expect(calcSalaryDeduction(1_625_000)).toBe(550_000);
  });

  it('applies 40% - 100,000 for 1,625,001 ~ 1,800,000', () => {
    expect(calcSalaryDeduction(1_800_000)).toBe(1_800_000 * 0.4 - 100_000);
  });

  it('applies 30% + 80,000 for 1,800,001 ~ 3,600,000', () => {
    expect(calcSalaryDeduction(3_000_000)).toBe(3_000_000 * 0.3 + 80_000);
  });

  it('applies 20% + 440,000 for 3,600,001 ~ 6,600,000', () => {
    expect(calcSalaryDeduction(5_000_000)).toBe(5_000_000 * 0.2 + 440_000);
  });

  it('applies 10% + 1,100,000 for 6,600,001 ~ 8,500,000', () => {
    expect(calcSalaryDeduction(8_000_000)).toBe(8_000_000 * 0.1 + 1_100_000);
  });

  it('caps at 1,950,000 for income > 8,500,000', () => {
    expect(calcSalaryDeduction(10_000_000)).toBe(1_950_000);
    expect(calcSalaryDeduction(20_000_000)).toBe(1_950_000);
  });

  it('returns 0 for 0 or negative', () => {
    expect(calcSalaryDeduction(0)).toBe(0);
    expect(calcSalaryDeduction(-100)).toBe(0);
  });
});

describe('calcSocialInsurance', () => {
  it('returns 0 for 0 income', () => {
    expect(calcSocialInsurance(0, 30)).toBe(0);
  });

  it('calculates ~14.7% for age under 40', () => {
    const si = calcSocialInsurance(8_000_000, 30);
    // Should be around 14.7% of gross, but with caps
    expect(si).toBeGreaterThan(1_000_000);
    expect(si).toBeLessThan(1_500_000);
  });

  it('includes nursing care insurance for age >= 40', () => {
    const si30 = calcSocialInsurance(8_000_000, 30);
    const si40 = calcSocialInsurance(8_000_000, 40);
    expect(si40).toBeGreaterThan(si30);
  });
});

describe('calcIncomeTax', () => {
  it('returns 0 for 0 taxable income', () => {
    expect(calcIncomeTax(0)).toBe(0);
  });

  it('calculates 5% bracket correctly (with reconstruction tax)', () => {
    const tax = calcIncomeTax(1_000_000);
    // 1,000,000 * 5% = 50,000 * 1.021 = 51,050
    expect(tax).toBe(Math.round(50_000 * 1.021));
  });

  it('calculates 10% bracket correctly', () => {
    const tax = calcIncomeTax(2_000_000);
    // 2,000,000 * 10% - 97,500 = 102,500 * 1.021 = 104,652.5 → 104,653
    expect(tax).toBe(Math.round(102_500 * 1.021));
  });

  it('calculates 20% bracket correctly', () => {
    const tax = calcIncomeTax(5_000_000);
    // 5,000,000 * 20% - 427,500 = 572,500 * 1.021
    expect(tax).toBe(Math.round(572_500 * 1.021));
  });
});

describe('calcBaseIncomeTax', () => {
  it('returns base tax without reconstruction surcharge', () => {
    expect(calcBaseIncomeTax(1_000_000)).toBe(50_000);
  });
});

describe('calcResidentTax', () => {
  it('returns flat amount for 0 taxable income', () => {
    expect(calcResidentTax(0)).toBe(5_000);
  });

  it('calculates 10% + flat for positive income', () => {
    const tax = calcResidentTax(3_000_000);
    expect(tax).toBe(Math.round(3_000_000 * 0.1) + 5_000);
  });
});

describe('calcIncomeDeductions', () => {
  it('includes basic deduction of 480,000', () => {
    const d = calcIncomeDeductions({
      socialInsurance: 0,
      applySpouseDeduction: false,
      totalIncome: 5_000_000,
      childAges: [],
    });
    expect(d).toBe(480_000);
  });

  it('adds social insurance', () => {
    const d = calcIncomeDeductions({
      socialInsurance: 1_000_000,
      applySpouseDeduction: false,
      totalIncome: 5_000_000,
      childAges: [],
    });
    expect(d).toBe(480_000 + 1_000_000);
  });

  it('adds spouse deduction for low-income spouse', () => {
    const d = calcIncomeDeductions({
      socialInsurance: 0,
      applySpouseDeduction: true,
      totalIncome: 5_000_000,
      childAges: [],
    });
    expect(d).toBe(480_000 + 380_000);
  });

  it('does not add spouse deduction when income > 9M', () => {
    const d = calcIncomeDeductions({
      socialInsurance: 0,
      applySpouseDeduction: true,
      totalIncome: 10_000_000,
      childAges: [],
    });
    expect(d).toBe(480_000);
  });

  it('adds dependent deduction for children 16+', () => {
    const d = calcIncomeDeductions({
      socialInsurance: 0,
      applySpouseDeduction: false,
      totalIncome: 5_000_000,
      childAges: [15, 16, 20],
    });
    // age 15: no deduction
    // age 16: 380,000
    // age 20: 630,000 (special dependent)
    expect(d).toBe(480_000 + 380_000 + 630_000);
  });
});

describe('calcGrossToNet', () => {
  const baseMortgage: MortgageDeductionConfig = {
    enabled: false,
    housingType: 'certified',
    housingAgeType: 'new',
    isChildRaisingHousehold: false,
    moveInYear: 2027,
  };

  it('returns 0 for 0 gross', () => {
    const result = calcGrossToNet({
      grossSalary: 0,
      age: 30,
      childAges: [],
      hasLowIncomeSpouse: false,
      mortgageYearEndBalance: 0,
      mortgageDeduction: baseMortgage,
      currentYear: 2026,
    });
    expect(result.netSalary).toBe(0);
  });

  it('produces ~600万 net from ~800万 gross for a 30yo with no spouse deduction', () => {
    const result = calcGrossToNet({
      grossSalary: 8_000_000,
      age: 30,
      childAges: [],
      hasLowIncomeSpouse: false,
      mortgageYearEndBalance: 0,
      mortgageDeduction: baseMortgage,
      currentYear: 2026,
    });
    // Expect net to be roughly 5.8M-6.2M
    expect(result.netSalary).toBeGreaterThan(5_500_000);
    expect(result.netSalary).toBeLessThan(6_500_000);
    expect(result.socialInsurance).toBeGreaterThan(0);
    expect(result.finalIncomeTax).toBeGreaterThan(0);
    expect(result.finalResidentTax).toBeGreaterThan(0);
  });

  it('applies mortgage deduction', () => {
    const mortgage: MortgageDeductionConfig = {
      enabled: true,
      housingType: 'certified',
      housingAgeType: 'new',
      isChildRaisingHousehold: false,
      moveInYear: 2027,
    };
    const withoutMortgage = calcGrossToNet({
      grossSalary: 8_000_000,
      age: 30,
      childAges: [],
      hasLowIncomeSpouse: false,
      mortgageYearEndBalance: 40_000_000,
      mortgageDeduction: { ...mortgage, enabled: false },
      currentYear: 2028,
    });
    const withMortgage = calcGrossToNet({
      grossSalary: 8_000_000,
      age: 30,
      childAges: [],
      hasLowIncomeSpouse: false,
      mortgageYearEndBalance: 40_000_000,
      mortgageDeduction: mortgage,
      currentYear: 2028,
    });
    expect(withMortgage.netSalary).toBeGreaterThan(withoutMortgage.netSalary);
    expect(withMortgage.mortgageDeductionAmount).toBeGreaterThan(0);
  });
});

describe('getMortgageLoanLimit', () => {
  it('returns correct limits for certified housing', () => {
    expect(getMortgageLoanLimit('certified', true)).toBe(50_000_000);
    expect(getMortgageLoanLimit('certified', false)).toBe(45_000_000);
  });

  it('returns 0 for other housing type', () => {
    expect(getMortgageLoanLimit('other', true)).toBe(0);
  });
});

describe('getMortgageDeductionYears', () => {
  it('returns 13 for new certified housing', () => {
    expect(getMortgageDeductionYears('new', 'certified')).toBe(13);
  });

  it('returns 10 for used housing', () => {
    expect(getMortgageDeductionYears('used', 'certified')).toBe(10);
  });

  it('returns 0 for other type', () => {
    expect(getMortgageDeductionYears('new', 'other')).toBe(0);
  });
});

describe('calcMortgageDeduction', () => {
  it('returns 0 when disabled', () => {
    expect(
      calcMortgageDeduction(40_000_000, {
        enabled: false,
        housingType: 'certified',
        housingAgeType: 'new',
        isChildRaisingHousehold: false,
        moveInYear: 2027,
      }, 2028),
    ).toBe(0);
  });

  it('calculates 0.7% of year-end balance up to loan limit', () => {
    const deduction = calcMortgageDeduction(40_000_000, {
      enabled: true,
      housingType: 'certified',
      housingAgeType: 'new',
      isChildRaisingHousehold: false,
      moveInYear: 2027,
    }, 2028);
    // limit is 45M, balance is 40M → 40M * 0.7% = 280,000
    expect(deduction).toBe(280_000);
  });

  it('caps at loan limit', () => {
    const deduction = calcMortgageDeduction(60_000_000, {
      enabled: true,
      housingType: 'certified',
      housingAgeType: 'new',
      isChildRaisingHousehold: false,
      moveInYear: 2027,
    }, 2028);
    // limit is 45M → 45M * 0.7% = 315,000
    expect(deduction).toBe(315_000);
  });

  it('returns 0 after deduction period ends', () => {
    const deduction = calcMortgageDeduction(40_000_000, {
      enabled: true,
      housingType: 'certified',
      housingAgeType: 'new',
      isChildRaisingHousehold: false,
      moveInYear: 2027,
    }, 2040); // 13 years after 2027
    expect(deduction).toBe(0);
  });
});

describe('applyMortgageDeduction', () => {
  it('applies from income tax first, then resident tax', () => {
    const result = applyMortgageDeduction(280_000, 200_000, 3_000_000);
    // income tax reduction: min(280,000, 200,000) = 200,000
    // remaining: 80,000
    // resident tax limit: min(3,000,000 * 5%, 97,500) = min(150,000, 97,500) = 97,500
    // resident tax reduction: min(80,000, 97,500) = 80,000
    expect(result.incomeTaxReduction).toBe(200_000);
    expect(result.residentTaxReduction).toBe(80_000);
  });

  it('does not exceed resident tax limit', () => {
    const result = applyMortgageDeduction(400_000, 100_000, 1_000_000);
    // income tax reduction: 100,000
    // remaining: 300,000
    // resident tax limit: min(50,000, 97,500) = 50,000
    // resident tax reduction: 50,000
    expect(result.incomeTaxReduction).toBe(100_000);
    expect(result.residentTaxReduction).toBe(50_000);
  });
});
