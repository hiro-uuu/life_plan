export type EducationStage =
  | 'daycare'
  | 'elementary'
  | 'juniorHigh'
  | 'highSchool'
  | 'university';

export type SchoolType = 'public' | 'private';

/** 教育費算出でステージに属さない年齢帯 */
export type NonEducationStage = 'preSchool' | 'postGrad';

export interface Child {
  id: string;
  name?: string;
  birthYear: number;
  /** 出産年の妻の産休適用フラグ */
  maternityPauseApplied: boolean;
  /** 各ステージで公立/私立を選ぶ */
  educationPlan: Record<EducationStage, SchoolType>;
  /** 年額を上書きしたいときだけ入れる（円） */
  educationCostOverride?: Partial<Record<EducationStage, number>>;
  /** 子ども一人あたりの年間食費（円） */
  childFoodAnnual: number;
  /** 子ども一人あたりの年間雑費（円） */
  childMiscAnnual: number;
  applyInflationToChildCosts: boolean;
}
