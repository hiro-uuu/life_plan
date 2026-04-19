import type { ExpenseCategoryKey } from './expense';
import type { EducationStage, NonEducationStage } from './child';

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
