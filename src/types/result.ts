import type { ExpenseCategoryKey } from './expense';
import type { EducationStage, NonEducationStage } from './child';
import type { TaxBreakdown } from './tax';

export interface ChildYearlyState {
  id: string;
  name: string | undefined;
  age: number;
  stage: EducationStage | NonEducationStage;
}

export interface ChildExpenseBreakdown {
  food: number;
  misc: number;
  education: number;
}

/** 投資口座別の年次結果 */
export interface InvestmentAccountResult {
  id: string;
  name: string;
  accountType: 'nisa' | 'taxable';
  contribution: number;
  yieldAmount: number;
  tax: number;
  balance: number;
}

export interface YearlyResult {
  year: number;
  /** シミュレーション開始年を 0 とするインデックス */
  index: number;
  husbandAge: number;
  wifeAge: number;
  children: ChildYearlyState[];

  husbandIncome: number;
  wifeIncome: number;
  totalIncome: number;

  /** 税内訳（gross モード時のみ詳細が入る） */
  taxBreakdown?: TaxBreakdown;

  expenseByCategory: Record<ExpenseCategoryKey, number>;
  childExpense: number;
  childExpenseBreakdown: ChildExpenseBreakdown;
  loanRepayment: number;
  loanInterestPaid: number;
  loanPrincipalPaid: number;
  totalExpense: number;

  investmentContribution: number;
  investmentYield: number;
  investmentBalance: number;
  /** 口座別の内訳 */
  investmentAccounts?: InvestmentAccountResult[];

  loanOutstandingBalance: number;
  cashSavings: number;
  netAssets: number;

  isMaternityLeaveYear: boolean;
}

export interface SimulationWarning {
  kind: 'cashNegative';
  year: number;
  message: string;
}

export interface SimulationOutput {
  rows: YearlyResult[];
  warnings: SimulationWarning[];
}
