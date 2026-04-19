import type {
  HousingType,
  HousingAgeType,
  MortgageDeductionConfig,
} from '@/types/tax';

// ============================================================
// 給与所得控除
// ============================================================

/** 給与所得控除額を計算する */
export function calcSalaryDeduction(grossSalary: number): number {
  if (grossSalary <= 0) return 0;
  if (grossSalary <= 1_625_000) return 550_000;
  if (grossSalary <= 1_800_000) return grossSalary * 0.4 - 100_000;
  if (grossSalary <= 3_600_000) return grossSalary * 0.3 + 80_000;
  if (grossSalary <= 6_600_000) return grossSalary * 0.2 + 440_000;
  if (grossSalary <= 8_500_000) return grossSalary * 0.1 + 1_100_000;
  return 1_950_000; // 上限
}

// ============================================================
// 社会保険料
// ============================================================

/** 社会保険料率 */
const HEALTH_INSURANCE_RATE = 0.04955;  // 健康保険（東京都協会けんぽ）
const PENSION_RATE = 0.0915;            // 厚生年金
const EMPLOYMENT_INSURANCE_RATE = 0.0055; // 雇用保険
const NURSING_CARE_RATE = 0.008;        // 介護保険（40歳以上）

/** 厚生年金の標準報酬月額上限（等級32 = 65万） */
const PENSION_MONTHLY_CAP = 650_000;
/** 健康保険の標準報酬月額上限（ = 139万） */
const HEALTH_MONTHLY_CAP = 1_390_000;

/**
 * 社会保険料を計算する（従業員負担分）
 * @param grossSalary 額面年収
 * @param age 年齢（40歳以上で介護保険適用）
 */
export function calcSocialInsurance(grossSalary: number, age: number): number {
  if (grossSalary <= 0) return 0;

  const monthlyGross = grossSalary / 12;

  const healthBase = Math.min(monthlyGross, HEALTH_MONTHLY_CAP);
  const pensionBase = Math.min(monthlyGross, PENSION_MONTHLY_CAP);

  let monthly = 0;
  monthly += healthBase * HEALTH_INSURANCE_RATE;
  monthly += pensionBase * PENSION_RATE;
  monthly += monthlyGross * EMPLOYMENT_INSURANCE_RATE;
  if (age >= 40) {
    monthly += healthBase * NURSING_CARE_RATE;
  }

  return Math.round(monthly * 12);
}

// ============================================================
// 所得税（累進課税 7段階 + 復興特別所得税）
// ============================================================

interface TaxBracket {
  upper: number;     // この段の上限（inclusive）
  rate: number;      // 税率
  deduction: number; // 速算控除額
}

const INCOME_TAX_BRACKETS: TaxBracket[] = [
  { upper: 1_949_000, rate: 0.05, deduction: 0 },
  { upper: 3_299_000, rate: 0.10, deduction: 97_500 },
  { upper: 6_949_000, rate: 0.20, deduction: 427_500 },
  { upper: 8_999_000, rate: 0.23, deduction: 636_000 },
  { upper: 17_999_000, rate: 0.33, deduction: 1_536_000 },
  { upper: 39_999_000, rate: 0.40, deduction: 2_796_000 },
  { upper: Infinity, rate: 0.45, deduction: 4_796_000 },
];

/** 復興特別所得税率 */
const RECONSTRUCTION_TAX_RATE = 0.021;

/**
 * 所得税を計算する（復興特別所得税込み）
 * @param taxableIncome 課税所得
 * @returns 所得税額（復興特別所得税込み）
 */
export function calcIncomeTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;

  const bracket = INCOME_TAX_BRACKETS.find((b) => taxableIncome <= b.upper)!;
  const baseTax = taxableIncome * bracket.rate - bracket.deduction;
  // 復興特別所得税
  return Math.round(baseTax * (1 + RECONSTRUCTION_TAX_RATE));
}

/** 復興特別所得税を除いた基本所得税を計算（住宅ローン控除の適用前に必要） */
export function calcBaseIncomeTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;
  const bracket = INCOME_TAX_BRACKETS.find((b) => taxableIncome <= b.upper)!;
  return Math.max(0, taxableIncome * bracket.rate - bracket.deduction);
}

// ============================================================
// 住民税
// ============================================================

/** 住民税所得割率 */
const RESIDENT_TAX_RATE = 0.10;
/** 住民税均等割額 */
const RESIDENT_TAX_FLAT = 5_000;
/** 基礎控除（住民税用） */
const BASIC_DEDUCTION_RESIDENT = 430_000;

/**
 * 住民税を計算する
 * @param taxableIncomeForResident 住民税の課税所得
 */
export function calcResidentTax(taxableIncomeForResident: number): number {
  if (taxableIncomeForResident <= 0) return RESIDENT_TAX_FLAT;
  return Math.round(taxableIncomeForResident * RESIDENT_TAX_RATE) + RESIDENT_TAX_FLAT;
}

// ============================================================
// 所得控除
// ============================================================

/** 基礎控除（所得税用） */
const BASIC_DEDUCTION_INCOME = 480_000;

interface DeductionParams {
  /** 社会保険料（全額控除） */
  socialInsurance: number;
  /** 配偶者控除を適用するか */
  applySpouseDeduction: boolean;
  /** 本人の合計所得（配偶者控除判定用） */
  totalIncome: number;
  /** 扶養する子どもの年齢配列（16歳以上のみ控除対象） */
  childAges: number[];
}

/**
 * 所得控除合計を計算する（所得税用）
 */
export function calcIncomeDeductions(params: DeductionParams): number {
  let deduction = BASIC_DEDUCTION_INCOME;

  // 社会保険料控除
  deduction += params.socialInsurance;

  // 配偶者控除（本人所得900万以下、配偶者所得48万以下）
  if (params.applySpouseDeduction && params.totalIncome <= 9_000_000) {
    deduction += 380_000;
  }

  // 扶養控除（16歳以上の子のみ）
  for (const age of params.childAges) {
    if (age >= 19 && age <= 22) {
      deduction += 630_000; // 特定扶養親族
    } else if (age >= 16) {
      deduction += 380_000; // 一般扶養親族
    }
  }

  return deduction;
}

/**
 * 所得控除合計を計算する（住民税用）
 * 基礎控除が異なる以外はほぼ同じ
 */
export function calcResidentDeductions(params: DeductionParams): number {
  let deduction = BASIC_DEDUCTION_RESIDENT;

  deduction += params.socialInsurance;

  if (params.applySpouseDeduction && params.totalIncome <= 9_000_000) {
    deduction += 330_000; // 住民税の配偶者控除
  }

  for (const age of params.childAges) {
    if (age >= 19 && age <= 22) {
      deduction += 450_000; // 住民税の特定扶養
    } else if (age >= 16) {
      deduction += 330_000; // 住民税の一般扶養
    }
  }

  return deduction;
}

// ============================================================
// 住宅ローン控除
// ============================================================

/**
 * 住宅ローン控除の借入限度額を取得（新築）
 */
export function getMortgageLoanLimit(
  housingType: HousingType,
  isChildRaising: boolean,
): number {
  switch (housingType) {
    case 'certified':
      return isChildRaising ? 50_000_000 : 45_000_000;
    case 'zeh':
      return isChildRaising ? 45_000_000 : 35_000_000;
    case 'energyEfficient':
      return isChildRaising ? 40_000_000 : 30_000_000;
    case 'other':
      return 0; // 控除対象外
  }
}

/** 控除期間を取得 */
export function getMortgageDeductionYears(
  housingAgeType: HousingAgeType,
  housingType: HousingType,
): number {
  if (housingType === 'other') return 0;
  if (housingAgeType === 'new') return 13;
  return 10; // 中古
}

/** 控除率 */
const MORTGAGE_DEDUCTION_RATE = 0.007; // 0.7%

/**
 * 住宅ローン控除額を計算する
 * @param yearEndBalance 年末ローン残高
 * @param config 住宅ローン控除設定
 * @param currentYear 現在の年
 * @returns 控除可能額（所得税 + 住民税から差し引く前の総額）
 */
export function calcMortgageDeduction(
  yearEndBalance: number,
  config: MortgageDeductionConfig,
  currentYear: number,
): number {
  if (!config.enabled) return 0;
  if (config.housingType === 'other') return 0;

  const deductionYears = getMortgageDeductionYears(
    config.housingAgeType,
    config.housingType,
  );
  const yearsElapsed = currentYear - config.moveInYear;
  if (yearsElapsed < 0 || yearsElapsed >= deductionYears) return 0;

  const loanLimit = getMortgageLoanLimit(
    config.housingType,
    config.isChildRaisingHousehold,
  );
  const eligibleBalance = Math.min(yearEndBalance, loanLimit);
  return Math.floor(eligibleBalance * MORTGAGE_DEDUCTION_RATE);
}

/**
 * 住宅ローン控除を所得税・住民税に適用する
 * @param mortgageDeductionAmount 控除額
 * @param incomeTaxBeforeDeduction 控除前の所得税（基本税額、復興税除く）
 * @param taxableIncomeForResident 住民税の課税所得
 * @returns { incomeTaxReduction, residentTaxReduction } 実際に控除される金額
 */
export function applyMortgageDeduction(
  mortgageDeductionAmount: number,
  incomeTaxBeforeDeduction: number,
  taxableIncomeForResident: number,
): { incomeTaxReduction: number; residentTaxReduction: number } {
  if (mortgageDeductionAmount <= 0) {
    return { incomeTaxReduction: 0, residentTaxReduction: 0 };
  }

  // まず所得税から控除
  const incomeTaxReduction = Math.min(mortgageDeductionAmount, incomeTaxBeforeDeduction);
  const remaining = mortgageDeductionAmount - incomeTaxReduction;

  // 残りを住民税から控除（課税所得の5%、最高97,500円）
  const residentTaxLimit = Math.min(
    Math.floor(taxableIncomeForResident * 0.05),
    97_500,
  );
  const residentTaxReduction = Math.min(remaining, residentTaxLimit);

  return { incomeTaxReduction, residentTaxReduction };
}

// ============================================================
// 年間手取り計算パイプライン（統合）
// ============================================================

export interface GrossToNetInput {
  /** 額面年収 */
  grossSalary: number;
  /** 年齢 */
  age: number;
  /** 子どもの年齢配列 */
  childAges: number[];
  /** 配偶者の所得が48万以下か */
  hasLowIncomeSpouse: boolean;
  /** 住宅ローン年末残高 */
  mortgageYearEndBalance: number;
  /** 住宅ローン控除設定 */
  mortgageDeduction: MortgageDeductionConfig;
  /** 現在の年 */
  currentYear: number;
}

export interface GrossToNetResult {
  grossSalary: number;
  salaryDeduction: number;
  socialInsurance: number;
  incomeDeductions: number;
  taxableIncomeForIncomeTax: number;
  taxableIncomeForResidentTax: number;
  baseIncomeTax: number;
  incomeTax: number;
  residentTax: number;
  mortgageDeductionAmount: number;
  mortgageIncomeTaxReduction: number;
  mortgageResidentTaxReduction: number;
  finalIncomeTax: number;
  finalResidentTax: number;
  netSalary: number;
}

/**
 * 額面年収から手取りを計算する完全パイプライン
 */
export function calcGrossToNet(input: GrossToNetInput): GrossToNetResult {
  const { grossSalary, age, childAges, hasLowIncomeSpouse } = input;

  if (grossSalary <= 0) {
    return {
      grossSalary: 0,
      salaryDeduction: 0,
      socialInsurance: 0,
      incomeDeductions: 0,
      taxableIncomeForIncomeTax: 0,
      taxableIncomeForResidentTax: 0,
      baseIncomeTax: 0,
      incomeTax: 0,
      residentTax: 0,
      mortgageDeductionAmount: 0,
      mortgageIncomeTaxReduction: 0,
      mortgageResidentTaxReduction: 0,
      finalIncomeTax: 0,
      finalResidentTax: 0,
      netSalary: 0,
    };
  }

  // 1. 社会保険料
  const socialInsurance = calcSocialInsurance(grossSalary, age);

  // 2. 給与所得控除
  const salaryDeduction = calcSalaryDeduction(grossSalary);

  // 3. 給与所得
  const salaryIncome = Math.max(0, grossSalary - salaryDeduction);

  // 4. 所得控除（所得税用）
  const incomeDeductions = calcIncomeDeductions({
    socialInsurance,
    applySpouseDeduction: hasLowIncomeSpouse,
    totalIncome: salaryIncome,
    childAges,
  });

  // 5. 課税所得（所得税用）
  const taxableIncomeForIncomeTax = Math.max(
    0,
    Math.floor((salaryIncome - incomeDeductions) / 1_000) * 1_000,
  );

  // 6. 所得控除（住民税用）
  const residentDeductions = calcResidentDeductions({
    socialInsurance,
    applySpouseDeduction: hasLowIncomeSpouse,
    totalIncome: salaryIncome,
    childAges,
  });

  // 7. 課税所得（住民税用）
  const taxableIncomeForResidentTax = Math.max(
    0,
    Math.floor((salaryIncome - residentDeductions) / 1_000) * 1_000,
  );

  // 8. 所得税（復興特別所得税込み）
  const baseIncomeTax = calcBaseIncomeTax(taxableIncomeForIncomeTax);
  const incomeTax = calcIncomeTax(taxableIncomeForIncomeTax);

  // 9. 住民税
  const residentTax = calcResidentTax(taxableIncomeForResidentTax);

  // 10. 住宅ローン控除
  const mortgageDeductionAmount = calcMortgageDeduction(
    input.mortgageYearEndBalance,
    input.mortgageDeduction,
    input.currentYear,
  );

  const { incomeTaxReduction: mortgageIncomeTaxReduction, residentTaxReduction: mortgageResidentTaxReduction } =
    applyMortgageDeduction(
      mortgageDeductionAmount,
      baseIncomeTax,
      taxableIncomeForResidentTax,
    );

  // 11. 最終税額
  const finalIncomeTax = Math.max(0, incomeTax - Math.round(mortgageIncomeTaxReduction * (1 + RECONSTRUCTION_TAX_RATE)));
  const finalResidentTax = Math.max(0, residentTax - mortgageResidentTaxReduction);

  // 12. 手取り
  const netSalary = grossSalary - socialInsurance - finalIncomeTax - finalResidentTax;

  return {
    grossSalary,
    salaryDeduction,
    socialInsurance,
    incomeDeductions,
    taxableIncomeForIncomeTax,
    taxableIncomeForResidentTax,
    baseIncomeTax,
    incomeTax,
    residentTax,
    mortgageDeductionAmount,
    mortgageIncomeTaxReduction,
    mortgageResidentTaxReduction,
    finalIncomeTax,
    finalResidentTax,
    netSalary,
  };
}
