export type ExpenseCategoryKey =
  | 'fixedCosts'
  | 'carCosts'
  | 'appliances'
  | 'food'
  | 'pocketMoney'
  | 'dailyNecessities'
  | 'misc'
  | 'events';

export interface ExpenseItem {
  annualAmount: number;
  applyInflation: boolean;
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategoryKey, string> = {
  fixedCosts: '固定費',
  carCosts: '自動車関連',
  appliances: '大物家電',
  food: '食費',
  pocketMoney: 'お小遣い',
  dailyNecessities: '日用品',
  misc: '雑費',
  events: 'イベント(旅行等)',
};

export const EXPENSE_CATEGORY_KEYS: ExpenseCategoryKey[] = [
  'fixedCosts',
  'carCosts',
  'appliances',
  'food',
  'pocketMoney',
  'dailyNecessities',
  'misc',
  'events',
];
