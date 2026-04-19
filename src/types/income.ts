export interface HusbandSalary {
  /** 初年度の手取り年収（円） */
  annualTakeHome: number;
  /** 毎年の昇給額（円、固定額） */
  annualRaiseAmount: number;
  /** 退職年（この年以降は収入 0）。未指定なら退職なし */
  retireYear?: number;
}

export interface WifeSalary {
  /** 初年度の手取り年収（円、昇給なし） */
  annualTakeHome: number;
  /** 産休/育休の年数（出産年を含む）。1 なら出産年のみ 0 */
  maternityLeaveYears: number;
  /** 退職年（この年以降は収入 0） */
  retireYear?: number;
}
