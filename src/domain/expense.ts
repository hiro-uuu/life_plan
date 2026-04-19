import type { ExpenseCategoryKey, ExpenseItem } from '@/types/expense';
import { EXPENSE_CATEGORY_KEYS } from '@/types/expense';

/**
 * 支出カテゴリごとに当年額を計算する。
 * applyInflation = true のカテゴリは複利でインフレ適用。
 */
export function computeExpenseByCategory(
  categories: Record<ExpenseCategoryKey, ExpenseItem>,
  inflationFactor: number,
): Record<ExpenseCategoryKey, number> {
  const result = {} as Record<ExpenseCategoryKey, number>;
  for (const key of EXPENSE_CATEGORY_KEYS) {
    const item = categories[key];
    const amount = item.applyInflation ? item.annualAmount * inflationFactor : item.annualAmount;
    result[key] = amount;
  }
  return result;
}

export function sumExpense(byCategory: Record<ExpenseCategoryKey, number>): number {
  return EXPENSE_CATEGORY_KEYS.reduce((acc, k) => acc + byCategory[k], 0);
}
