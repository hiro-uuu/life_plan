import type { InvestmentConfig } from '@/types/investment';

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
