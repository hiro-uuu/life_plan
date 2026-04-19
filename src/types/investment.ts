export interface InvestmentConfig {
  /** 初年度開始時点の投資残高（円） */
  initialBalance: number;
  /** 年間積立額（円） */
  annualContribution: number;
  /** 年利回り（%） */
  annualYieldPercent: number;
  /** 積立額を毎年追加する増額（円、オプション） */
  contributionRaiseAmount?: number;
  /** 積立を止める年（この年以降は積立 0） */
  stopContributionYear?: number;
}
