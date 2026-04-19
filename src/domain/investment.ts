import type { InvestmentConfig, InvestmentAccount } from '@/types/investment';

export interface InvestmentYearStep {
  contribution: number;
  yieldAmount: number;
  balance: number;
}

/**
 * 1 年ぶんの投資残高更新を行う。
 * 計算順序: 期首残高 → 利回り発生 → 積立 → 期末残高
 * （積立には当年の利回りは付かない）
 */
export function stepInvestment(
  prevBalance: number,
  config: InvestmentConfig,
  index: number,
  year: number,
): InvestmentYearStep {
  const stop = config.stopContributionYear;
  const contributionBase = config.annualContribution + (config.contributionRaiseAmount ?? 0) * index;
  const contribution = stop !== undefined && year >= stop ? 0 : Math.max(0, contributionBase);
  const yieldAmount = prevBalance * (config.annualYieldPercent / 100);
  const balance = prevBalance + yieldAmount + contribution;
  return { contribution, yieldAmount, balance };
}

/** 課税口座の利益に対する税率 */
const TAXABLE_ACCOUNT_TAX_RATE = 0.20315;

export interface InvestmentAccountYearStep {
  id: string;
  name: string;
  accountType: 'nisa' | 'taxable';
  contribution: number;
  yieldAmount: number;
  tax: number;
  balance: number;
}

/**
 * 個別投資口座の1年分を計算する
 */
export function stepInvestmentAccount(
  prevBalance: number,
  account: InvestmentAccount,
  index: number,
  year: number,
): InvestmentAccountYearStep {
  const stop = account.stopContributionYear;
  const contributionBase = account.annualContribution + (account.contributionRaiseAmount ?? 0) * index;
  const contribution = stop !== undefined && year >= stop ? 0 : Math.max(0, contributionBase);

  const grossYield = prevBalance * (account.annualYieldPercent / 100);

  // 課税口座の場合、利益に対して20.315%課税
  let tax = 0;
  let yieldAmount = grossYield;
  if (account.accountType === 'taxable' && grossYield > 0) {
    tax = Math.round(grossYield * TAXABLE_ACCOUNT_TAX_RATE);
    yieldAmount = grossYield - tax;
  }

  const balance = prevBalance + yieldAmount + contribution;
  return {
    id: account.id,
    name: account.name,
    accountType: account.accountType,
    contribution,
    yieldAmount,
    tax,
    balance,
  };
}
