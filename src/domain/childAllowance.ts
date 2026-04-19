import type { Child } from '@/types/child';

/**
 * 児童手当の年額を計算する（2024年10月改正後ルール）
 *
 * - 0〜2歳: 月15,000円（第3子以降 30,000円）
 * - 3歳〜高校卒業（18歳年度末）: 月10,000円（第3子以降 30,000円）
 * - 所得制限なし
 * - 第3子カウント: 22歳年度末までの子を含む
 *
 * @param children 全ての子ども
 * @param year 対象年
 * @returns 年間の児童手当合計
 */
export function calcChildAllowance(children: Child[], year: number): number {
  if (children.length === 0) return 0;

  // 22歳年度末までの子をカウントに含める（第3子判定）
  // 年度末 = 翌年3月末。簡略化のため year - birthYear <= 22 で判定
  const countableChildren = children
    .filter((c) => {
      const age = year - c.birthYear;
      return age >= 0 && age <= 22;
    })
    .sort((a, b) => a.birthYear - b.birthYear); // 年長順

  let totalAnnual = 0;

  for (let i = 0; i < countableChildren.length; i++) {
    const child = countableChildren[i]!;
    const age = year - child.birthYear;

    // 手当の対象は 0〜18歳（高校卒業 = 18歳年度末）
    if (age < 0 || age > 18) continue;

    const isThirdOrLater = i >= 2; // 0-indexed: 第3子以降
    let monthlyAmount: number;

    if (age <= 2) {
      monthlyAmount = isThirdOrLater ? 30_000 : 15_000;
    } else {
      // 3歳〜18歳
      monthlyAmount = isThirdOrLater ? 30_000 : 10_000;
    }

    totalAnnual += monthlyAmount * 12;
  }

  return totalAnnual;
}
