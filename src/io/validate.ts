import type { Scenario } from '@/types/scenario';
import type { ExpenseCategoryKey } from '@/types/expense';
import { EXPENSE_CATEGORY_KEYS } from '@/types/expense';
import type { EducationStage, SchoolType } from '@/types/child';

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: ValidationError[];
  /** ok: true なら必ず入る */
  data?: Scenario;
}

const EDUCATION_STAGES: EducationStage[] = [
  'daycare',
  'elementary',
  'juniorHigh',
  'highSchool',
  'university',
];
const SCHOOL_TYPES: SchoolType[] = ['public', 'private'];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function err(errors: ValidationError[], path: string, message: string): void {
  errors.push({ path, message });
}

function checkNumber(
  v: unknown,
  path: string,
  errors: ValidationError[],
  opts: { min?: number; max?: number; integer?: boolean } = {},
): number | undefined {
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    err(errors, path, '数値である必要があります');
    return undefined;
  }
  if (opts.integer && !Number.isInteger(v)) {
    err(errors, path, '整数である必要があります');
  }
  if (opts.min !== undefined && v < opts.min) {
    err(errors, path, `${opts.min} 以上である必要があります`);
  }
  if (opts.max !== undefined && v > opts.max) {
    err(errors, path, `${opts.max} 以下である必要があります`);
  }
  return v;
}

function checkString(v: unknown, path: string, errors: ValidationError[]): string | undefined {
  if (typeof v !== 'string') {
    err(errors, path, '文字列である必要があります');
    return undefined;
  }
  return v;
}

function checkBoolean(v: unknown, path: string, errors: ValidationError[]): boolean | undefined {
  if (typeof v !== 'boolean') {
    err(errors, path, '真偽値である必要があります');
    return undefined;
  }
  return v;
}

/**
 * taxConfig のバリデーション（v2 用）
 */
function validateTaxConfig(tc: unknown, errors: ValidationError[]): void {
  if (!isRecord(tc)) {
    err(errors, 'taxConfig', 'オブジェクトではありません');
    return;
  }

  const validModes = ['takeHome', 'gross'];
  if (!validModes.includes(tc.incomeInputMode as string)) {
    err(errors, 'taxConfig.incomeInputMode', 'takeHome | gross');
  }

  // mortgageDeduction
  const md = tc.mortgageDeduction;
  if (isRecord(md)) {
    checkBoolean(md.enabled, 'taxConfig.mortgageDeduction.enabled', errors);
    const validHousingTypes = ['certified', 'zeh', 'energyEfficient', 'other'];
    if (!validHousingTypes.includes(md.housingType as string)) {
      err(errors, 'taxConfig.mortgageDeduction.housingType', 'certified | zeh | energyEfficient | other');
    }
    const validAgeTypes = ['new', 'used'];
    if (!validAgeTypes.includes(md.housingAgeType as string)) {
      err(errors, 'taxConfig.mortgageDeduction.housingAgeType', 'new | used');
    }
    checkBoolean(md.isChildRaisingHousehold, 'taxConfig.mortgageDeduction.isChildRaisingHousehold', errors);
    checkNumber(md.moveInYear, 'taxConfig.mortgageDeduction.moveInYear', errors, { integer: true });
  }

  // propertyTax
  const pt = tc.propertyTax;
  if (isRecord(pt)) {
    checkBoolean(pt.enabled, 'taxConfig.propertyTax.enabled', errors);
    checkNumber(pt.landAssessedValue, 'taxConfig.propertyTax.landAssessedValue', errors, { min: 0 });
    checkNumber(pt.buildingAssessedValue, 'taxConfig.propertyTax.buildingAssessedValue', errors, { min: 0 });
    checkBoolean(pt.isSmallResidentialLand, 'taxConfig.propertyTax.isSmallResidentialLand', errors);
    checkBoolean(pt.isNewConstruction, 'taxConfig.propertyTax.isNewConstruction', errors);
    checkBoolean(pt.isLongLifeHousing, 'taxConfig.propertyTax.isLongLifeHousing', errors);
    checkNumber(pt.constructionYear, 'taxConfig.propertyTax.constructionYear', errors, { integer: true });
  }

  // retirementBonus
  const rb = tc.retirementBonus;
  if (isRecord(rb)) {
    checkBoolean(rb.enabled, 'taxConfig.retirementBonus.enabled', errors);
    checkNumber(rb.amount, 'taxConfig.retirementBonus.amount', errors, { min: 0 });
    checkNumber(rb.retireYear, 'taxConfig.retirementBonus.retireYear', errors, { integer: true });
    checkNumber(rb.yearsOfService, 'taxConfig.retirementBonus.yearsOfService', errors, { min: 0, integer: true });
  }
}

/**
 * investmentAccounts のバリデーション（v2 用）
 */
function validateInvestmentAccounts(accts: unknown, errors: ValidationError[]): void {
  if (!Array.isArray(accts)) {
    err(errors, 'investmentAccounts', '配列ではありません');
    return;
  }
  accts.forEach((a, idx) => {
    const path = `investmentAccounts[${idx}]`;
    if (!isRecord(a)) {
      err(errors, path, 'オブジェクトではありません');
      return;
    }
    checkString(a.id, `${path}.id`, errors);
    checkString(a.name, `${path}.name`, errors);
    const validTypes = ['nisa', 'taxable'];
    if (!validTypes.includes(a.accountType as string)) {
      err(errors, `${path}.accountType`, 'nisa | taxable');
    }
    checkNumber(a.initialBalance, `${path}.initialBalance`, errors, { min: 0 });
    checkNumber(a.annualContribution, `${path}.annualContribution`, errors, { min: 0 });
    checkNumber(a.annualYieldPercent, `${path}.annualYieldPercent`, errors, { min: -50, max: 50 });
    if (a.contributionRaiseAmount !== undefined) {
      checkNumber(a.contributionRaiseAmount, `${path}.contributionRaiseAmount`, errors);
    }
    if (a.stopContributionYear !== undefined) {
      checkNumber(a.stopContributionYear, `${path}.stopContributionYear`, errors, { integer: true });
    }
  });
}

/**
 * Scenario の手書きバリデーション。失敗しても部分的な data を返すことはしない。
 * 未知のキーは警告にしない（無視）ため、拡張に寛容。
 */
export function validateScenario(input: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!isRecord(input)) {
    return { ok: false, errors: [{ path: '$', message: 'オブジェクトではありません' }] };
  }

  // version
  if (input.version !== 1 && input.version !== 2) {
    err(errors, 'version', 'version は 1 または 2 である必要があります');
  }

  checkString(input.id, 'id', errors);
  checkString(input.name, 'name', errors);
  checkString(input.createdAt, 'createdAt', errors);
  checkString(input.updatedAt, 'updatedAt', errors);

  // initialConditions
  const ic = input.initialConditions;
  if (!isRecord(ic)) {
    err(errors, 'initialConditions', 'オブジェクトではありません');
  } else {
    checkNumber(ic.startYear, 'initialConditions.startYear', errors, {
      min: 1900,
      max: 2200,
      integer: true,
    });
    checkNumber(ic.husbandAge, 'initialConditions.husbandAge', errors, {
      min: 0,
      max: 120,
      integer: true,
    });
    checkNumber(ic.wifeAge, 'initialConditions.wifeAge', errors, {
      min: 0,
      max: 120,
      integer: true,
    });
    checkNumber(ic.initialCashSavings, 'initialConditions.initialCashSavings', errors);
    checkNumber(ic.inflationRatePercent, 'initialConditions.inflationRatePercent', errors, {
      min: -20,
      max: 20,
    });
    checkNumber(ic.endAge, 'initialConditions.endAge', errors, {
      min: 0,
      max: 120,
      integer: true,
    });
  }

  // income
  const income = input.income;
  if (!isRecord(income)) {
    err(errors, 'income', 'オブジェクトではありません');
  } else {
    const h = income.husband;
    if (!isRecord(h)) {
      err(errors, 'income.husband', 'オブジェクトではありません');
    } else {
      checkNumber(h.annualTakeHome, 'income.husband.annualTakeHome', errors, { min: 0 });
      checkNumber(h.annualRaiseAmount, 'income.husband.annualRaiseAmount', errors);
      if (h.retireYear !== undefined) {
        checkNumber(h.retireYear, 'income.husband.retireYear', errors, { integer: true });
      }
      if (h.annualGross !== undefined) {
        checkNumber(h.annualGross, 'income.husband.annualGross', errors, { min: 0 });
      }
    }
    const w = income.wife;
    if (!isRecord(w)) {
      err(errors, 'income.wife', 'オブジェクトではありません');
    } else {
      checkNumber(w.annualTakeHome, 'income.wife.annualTakeHome', errors, { min: 0 });
      checkNumber(w.maternityLeaveYears, 'income.wife.maternityLeaveYears', errors, {
        min: 0,
        max: 10,
        integer: true,
      });
      if (w.retireYear !== undefined) {
        checkNumber(w.retireYear, 'income.wife.retireYear', errors, { integer: true });
      }
      if (w.annualGross !== undefined) {
        checkNumber(w.annualGross, 'income.wife.annualGross', errors, { min: 0 });
      }
    }
  }

  // expense
  const expense = input.expense;
  if (!isRecord(expense)) {
    err(errors, 'expense', 'オブジェクトではありません');
  } else if (!isRecord(expense.categories)) {
    err(errors, 'expense.categories', 'オブジェクトではありません');
  } else {
    for (const key of EXPENSE_CATEGORY_KEYS) {
      const item = (expense.categories as Record<string, unknown>)[key];
      const path = `expense.categories.${key}`;
      if (!isRecord(item)) {
        err(errors, path, 'オブジェクトではありません');
        continue;
      }
      checkNumber(item.annualAmount, `${path}.annualAmount`, errors, { min: 0 });
      checkBoolean(item.applyInflation, `${path}.applyInflation`, errors);
    }
  }

  // investment
  const inv = input.investment;
  if (!isRecord(inv)) {
    err(errors, 'investment', 'オブジェクトではありません');
  } else {
    checkNumber(inv.initialBalance, 'investment.initialBalance', errors, { min: 0 });
    checkNumber(inv.annualContribution, 'investment.annualContribution', errors, { min: 0 });
    checkNumber(inv.annualYieldPercent, 'investment.annualYieldPercent', errors, {
      min: -50,
      max: 50,
    });
    if (inv.contributionRaiseAmount !== undefined) {
      checkNumber(inv.contributionRaiseAmount, 'investment.contributionRaiseAmount', errors);
    }
    if (inv.stopContributionYear !== undefined) {
      checkNumber(inv.stopContributionYear, 'investment.stopContributionYear', errors, {
        integer: true,
      });
    }
  }

  // investmentAccounts (optional, v2)
  if (input.investmentAccounts !== undefined) {
    validateInvestmentAccounts(input.investmentAccounts, errors);
  }

  // loans
  if (!Array.isArray(input.loans)) {
    err(errors, 'loans', '配列ではありません');
  } else {
    input.loans.forEach((l, idx) => {
      const path = `loans[${idx}]`;
      if (!isRecord(l)) {
        err(errors, path, 'オブジェクトではありません');
        return;
      }
      checkString(l.id, `${path}.id`, errors);
      if (l.kind !== 'mortgage' && l.kind !== 'other') {
        err(errors, `${path}.kind`, 'mortgage | other');
      }
      checkString(l.name, `${path}.name`, errors);
      checkNumber(l.principal, `${path}.principal`, errors, { min: 0 });
      checkNumber(l.annualInterestRatePercent, `${path}.annualInterestRatePercent`, errors, {
        min: 0,
        max: 50,
      });
      checkNumber(l.termYears, `${path}.termYears`, errors, { min: 0, max: 60, integer: true });
      checkNumber(l.startYear, `${path}.startYear`, errors, { integer: true });
    });
  }

  // children
  if (!Array.isArray(input.children)) {
    err(errors, 'children', '配列ではありません');
  } else {
    input.children.forEach((c, idx) => {
      const path = `children[${idx}]`;
      if (!isRecord(c)) {
        err(errors, path, 'オブジェクトではありません');
        return;
      }
      checkString(c.id, `${path}.id`, errors);
      if (c.name !== undefined) checkString(c.name, `${path}.name`, errors);
      checkNumber(c.birthYear, `${path}.birthYear`, errors, { integer: true });
      checkBoolean(c.maternityPauseApplied, `${path}.maternityPauseApplied`, errors);
      if (!isRecord(c.educationPlan)) {
        err(errors, `${path}.educationPlan`, 'オブジェクトではありません');
      } else {
        for (const stage of EDUCATION_STAGES) {
          const v = (c.educationPlan as Record<string, unknown>)[stage];
          if (typeof v !== 'string' || !SCHOOL_TYPES.includes(v as SchoolType)) {
            err(errors, `${path}.educationPlan.${stage}`, 'public | private');
          }
        }
      }
      if (c.educationCostOverride !== undefined) {
        if (!isRecord(c.educationCostOverride)) {
          err(errors, `${path}.educationCostOverride`, 'オブジェクトではありません');
        } else {
          for (const k of Object.keys(c.educationCostOverride)) {
            if (!EDUCATION_STAGES.includes(k as EducationStage)) {
              err(errors, `${path}.educationCostOverride.${k}`, '未知のステージ');
              continue;
            }
            checkNumber(
              (c.educationCostOverride as Record<string, unknown>)[k],
              `${path}.educationCostOverride.${k}`,
              errors,
              { min: 0 },
            );
          }
        }
      }
      checkNumber(c.childFoodAnnual, `${path}.childFoodAnnual`, errors, { min: 0 });
      checkNumber(c.childMiscAnnual, `${path}.childMiscAnnual`, errors, { min: 0 });
      checkBoolean(c.applyInflationToChildCosts, `${path}.applyInflationToChildCosts`, errors);
    });
  }

  // taxConfig (optional, v2)
  if (input.taxConfig !== undefined) {
    validateTaxConfig(input.taxConfig, errors);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  // すべて通ったので Scenario として信頼する
  return { ok: true, errors: [], data: input as unknown as Scenario };
}

/** カテゴリキー一覧（不足しているとバリデーションで落ちる） */
export const REQUIRED_EXPENSE_KEYS: readonly ExpenseCategoryKey[] = EXPENSE_CATEGORY_KEYS;
