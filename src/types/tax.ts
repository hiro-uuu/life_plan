/** 収入入力モード: 手取り / 額面 */
export type IncomeInputMode = 'takeHome' | 'gross';

/** 住宅種別（住宅ローン控除の借入限度額に影響） */
export type HousingType =
  | 'certified'       // 認定住宅（長期優良/低炭素）
  | 'zeh'             // ZEH水準省エネ住宅
  | 'energyEfficient' // 省エネ基準適合住宅
  | 'other';          // その他（控除対象外）

/** 住宅の新築/中古区分 */
export type HousingAgeType = 'new' | 'used';

/** 住宅ローン控除設定 */
export interface MortgageDeductionConfig {
  enabled: boolean;
  /** 住宅種別 */
  housingType: HousingType;
  /** 新築 or 中古 */
  housingAgeType: HousingAgeType;
  /** 子育て・若者世帯かどうか */
  isChildRaisingHousehold: boolean;
  /** 入居年（控除開始年） */
  moveInYear: number;
}

/** 固定資産税設定 */
export interface PropertyTaxConfig {
  enabled: boolean;
  /** 土地の評価額（円） */
  landAssessedValue: number;
  /** 建物の評価額（円） */
  buildingAssessedValue: number;
  /** 小規模住宅用地かどうか（200m2以下） */
  isSmallResidentialLand: boolean;
  /** 新築かどうか */
  isNewConstruction: boolean;
  /** 長期優良住宅かどうか（新築減額5年 vs 3年） */
  isLongLifeHousing: boolean;
  /** 新築年（減額期間の計算用） */
  constructionYear: number;
}

/** 退職金設定 */
export interface RetirementBonusConfig {
  enabled: boolean;
  /** 退職金額（円） */
  amount: number;
  /** 退職年 */
  retireYear: number;
  /** 勤続年数 */
  yearsOfService: number;
}

/** 投資口座の種別 */
export type InvestmentAccountType = 'nisa' | 'taxable';

/** 税計算全体設定 */
export interface TaxConfig {
  /** 収入入力モード */
  incomeInputMode: IncomeInputMode;
  /** 住宅ローン控除 */
  mortgageDeduction: MortgageDeductionConfig;
  /** 固定資産税 */
  propertyTax: PropertyTaxConfig;
  /** 退職金（夫） */
  retirementBonus: RetirementBonusConfig;
}

/** 税計算の年次内訳（結果表示用） */
export interface TaxBreakdown {
  /** 額面年収（夫婦合算） */
  grossIncome: number;
  /** 社会保険料合計 */
  socialInsurance: number;
  /** 所得税 */
  incomeTax: number;
  /** 住民税 */
  residentTax: number;
  /** 住宅ローン控除額 */
  mortgageDeduction: number;
  /** 児童手当 */
  childAllowance: number;
  /** 固定資産税 */
  propertyTax: number;
  /** 退職金（手取り） */
  retirementBonusNet: number;
}
