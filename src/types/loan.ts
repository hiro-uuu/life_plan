export type LoanKind = 'mortgage' | 'other';

export interface Loan {
  id: string;
  kind: LoanKind;
  name: string;
  /** 借入元本（円） */
  principal: number;
  /** 年利（%） */
  annualInterestRatePercent: number;
  /** 返済年数 */
  termYears: number;
  /** 返済開始年 */
  startYear: number;
}

export interface YearlyLoanPayment {
  /** 当年の元利合計 */
  total: number;
  interest: number;
  principal: number;
  /** 年末時点の残債 */
  outstandingBalance: number;
}
