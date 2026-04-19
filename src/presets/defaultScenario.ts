import type { Scenario } from '@/types/scenario';
import type { Child, EducationStage, SchoolType } from '@/types/child';

export function defaultEducationPlan(): Record<EducationStage, SchoolType> {
  return {
    daycare: 'public',
    elementary: 'public',
    juniorHigh: 'public',
    highSchool: 'public',
    university: 'public',
  };
}

export function createDefaultChild(birthYear: number, name?: string): Child {
  return {
    id: cryptoRandomId(),
    name,
    birthYear,
    maternityPauseApplied: true,
    educationPlan: defaultEducationPlan(),
    childFoodAnnual: 200_000,
    childMiscAnnual: 100_000,
    applyInflationToChildCosts: true,
  };
}

/** 空のシナリオ雛形を生成する。要件の「29歳、1年後に子」を既定に織り込む */
export function createDefaultScenario(): Scenario {
  const now = new Date();
  const startYear = now.getFullYear();
  return {
    version: 1,
    id: cryptoRandomId(),
    name: '新規シナリオ',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    initialConditions: {
      startYear,
      husbandAge: 29,
      wifeAge: 29,
      initialCashSavings: 5_000_000,
      inflationRatePercent: 0,
      endAge: 65,
    },
    income: {
      husband: {
        annualTakeHome: 6_000_000,
        annualRaiseAmount: 100_000,
      },
      wife: {
        annualTakeHome: 3_000_000,
        maternityLeaveYears: 1,
      },
    },
    expense: {
      categories: {
        fixedCosts: { annualAmount: 1_800_000, applyInflation: true },
        carCosts: { annualAmount: 400_000, applyInflation: true },
        appliances: { annualAmount: 150_000, applyInflation: true },
        food: { annualAmount: 720_000, applyInflation: true },
        pocketMoney: { annualAmount: 600_000, applyInflation: false },
        dailyNecessities: { annualAmount: 240_000, applyInflation: true },
        misc: { annualAmount: 200_000, applyInflation: true },
        events: { annualAmount: 300_000, applyInflation: true },
      },
    },
    investment: {
      initialBalance: 1_000_000,
      annualContribution: 600_000,
      annualYieldPercent: 4,
    },
    loans: [],
    children: [createDefaultChild(startYear + 1, '第1子')],
  };
}

export function cryptoRandomId(): string {
  // ブラウザ/jsdom の両方で動く。古い環境用のフォールバック付き
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}
