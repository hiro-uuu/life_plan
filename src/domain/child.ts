import type { Child, EducationStage, NonEducationStage } from '@/types/child';
import { EDUCATION_COST_PRESET } from '@/presets/educationCosts';

/** 年齢からステージを判定する（0歳未満や22歳以上は 'preSchool'/'postGrad'） */
export function stageForAge(age: number): EducationStage | NonEducationStage {
  if (age < 0) return 'preSchool';
  if (age <= 5) return 'daycare';
  if (age <= 11) return 'elementary';
  if (age <= 14) return 'juniorHigh';
  if (age <= 17) return 'highSchool';
  if (age <= 21) return 'university';
  return 'postGrad';
}

/** 当年の子どもの年齢（年末時点の満年齢で近似） */
export function childAgeInYear(child: Child, year: number): number {
  return year - child.birthYear;
}

/**
 * 当年の子一人あたりの教育費を返す。
 * override があれば最優先、なければ schoolType × stage のプリセット。
 * ステージ外は 0。
 */
export function computeEducationCostForChild(child: Child, year: number): number {
  const age = childAgeInYear(child, year);
  const stage = stageForAge(age);
  if (stage === 'preSchool' || stage === 'postGrad') return 0;

  const override = child.educationCostOverride?.[stage];
  if (override !== undefined) return override;

  const schoolType = child.educationPlan[stage];
  return EDUCATION_COST_PRESET[stage][schoolType];
}

export interface ChildYearlyCost {
  food: number;
  misc: number;
  education: number;
  total: number;
}

export function computeChildYearlyCost(
  child: Child,
  year: number,
  inflationFactor: number,
): ChildYearlyCost {
  const age = childAgeInYear(child, year);
  // 生まれていない年は 0
  if (age < 0) {
    return { food: 0, misc: 0, education: 0, total: 0 };
  }
  const factor = child.applyInflationToChildCosts ? inflationFactor : 1;
  const food = child.childFoodAnnual * factor;
  const misc = child.childMiscAnnual * factor;
  const education = computeEducationCostForChild(child, year);
  return { food, misc, education, total: food + misc + education };
}
