import type { Scenario } from '@/types/scenario';
import type { Child } from '@/types/child';
import type { HusbandSalary, WifeSalary } from '@/types/income';

/** 夫の年収（手取り、固定額昇給モデル） */
export function computeHusbandIncome(husband: HusbandSalary, index: number, year: number): number {
  if (husband.retireYear !== undefined && year >= husband.retireYear) return 0;
  return husband.annualTakeHome + husband.annualRaiseAmount * index;
}

/** 妻の年収（手取り、産休考慮） */
export function computeWifeIncome(
  wife: WifeSalary,
  children: Child[],
  year: number,
): { income: number; isMaternityLeaveYear: boolean } {
  if (wife.retireYear !== undefined && year >= wife.retireYear) {
    return { income: 0, isMaternityLeaveYear: false };
  }
  const isLeave = isMaternityLeaveYear(wife, children, year);
  return { income: isLeave ? 0 : wife.annualTakeHome, isMaternityLeaveYear: isLeave };
}

/**
 * 出産年を含む maternityLeaveYears 年間は収入 0 とする。
 * 例: maternityLeaveYears = 1 → 出産年のみ 0（要件準拠）
 *     maternityLeaveYears = 2 → 出産年＋翌年が 0
 */
export function isMaternityLeaveYear(
  wife: WifeSalary,
  children: Child[],
  year: number,
): boolean {
  const leaveYears = Math.max(0, Math.floor(wife.maternityLeaveYears));
  if (leaveYears === 0) return false;
  return children.some((c) => {
    if (!c.maternityPauseApplied) return false;
    const delta = year - c.birthYear;
    return delta >= 0 && delta < leaveYears;
  });
}

/** シナリオの初年度から末期までの収入配列（ユーティリティ） */
export function computeYearlyIncomes(scenario: Scenario, years: number[]): number[] {
  return years.map((y, i) => {
    const h = computeHusbandIncome(scenario.income.husband, i, y);
    const w = computeWifeIncome(scenario.income.wife, scenario.children, y);
    return h + w.income;
  });
}
