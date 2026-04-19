import type { HusbandSalary, WifeSalary } from './income';
import type { ExpenseCategoryKey, ExpenseItem } from './expense';
import type { InvestmentConfig, InvestmentAccount } from './investment';
import type { Loan } from './loan';
import type { Child } from './child';
import type { TaxConfig } from './tax';

export interface InitialConditions {
  /** シミュレーション開始年 */
  startYear: number;
  /** 開始年時点の夫の年齢（既定 29） */
  husbandAge: number;
  /** 開始年時点の妻の年齢 */
  wifeAge: number;
  /** 開始時点の預金残高（円） */
  initialCashSavings: number;
  /** 年率インフレ（%）、既定 0 */
  inflationRatePercent: number;
  /** シミュレーションを終える年齢（夫基準、既定 65） */
  endAge: number;
}

export interface Scenario {
  version: 1 | 2;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  initialConditions: InitialConditions;
  income: {
    husband: HusbandSalary;
    wife: WifeSalary;
  };
  expense: {
    categories: Record<ExpenseCategoryKey, ExpenseItem>;
  };
  /** v1互換: 単一投資設定 */
  investment: InvestmentConfig;
  /** v2: 複数投資口座（NISA/課税口座） */
  investmentAccounts?: InvestmentAccount[];
  loans: Loan[];
  children: Child[];
  /** v2: 税金設定（額面モードや住宅ローン控除等） */
  taxConfig?: TaxConfig;
}
