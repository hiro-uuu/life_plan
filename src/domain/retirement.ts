import type { RetirementBonusConfig } from '@/types/tax';
import { calcIncomeTax } from './tax';

/**
 * 退職所得控除額を計算する
 *
 * - 勤続20年以下: 40万円 × 勤続年数（最低80万円）
 * - 勤続20年超: 800万円 + 70万円 ×（勤続年数 - 20年）
 */
export function calcRetirementDeduction(yearsOfService: number): number {
  if (yearsOfService <= 0) return 0;
  if (yearsOfService <= 20) {
    return Math.max(800_000, 400_000 * yearsOfService);
  }
  return 8_000_000 + 700_000 * (yearsOfService - 20);
}

/**
 * 退職金の税額を計算する
 *
 * 退職所得 = (退職金 - 退職所得控除) × 1/2
 * これに対して累進課税を適用
 */
export function calcRetirementTax(amount: number, yearsOfService: number): number {
  if (amount <= 0) return 0;

  const deduction = calcRetirementDeduction(yearsOfService);
  const taxableRetirementIncome = Math.max(0, Math.floor((amount - deduction) / 2));

  if (taxableRetirementIncome <= 0) return 0;

  // 所得税（復興特別所得税込み）
  const incomeTax = calcIncomeTax(taxableRetirementIncome);

  // 住民税（退職所得に対する住民税 = 10%）
  const residentTax = Math.round(taxableRetirementIncome * 0.10);

  return incomeTax + residentTax;
}

/**
 * 退職金の手取り額を計算する
 */
export function calcRetirementNet(config: RetirementBonusConfig): number {
  if (!config.enabled || config.amount <= 0) return 0;

  const tax = calcRetirementTax(config.amount, config.yearsOfService);
  return config.amount - tax;
}

/**
 * 指定年が退職年かどうか判定し、手取り額を返す
 */
export function getRetirementBonusForYear(
  config: RetirementBonusConfig | undefined,
  year: number,
): number {
  if (!config || !config.enabled) return 0;
  if (year !== config.retireYear) return 0;
  return calcRetirementNet(config);
}
