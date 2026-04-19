import type { Scenario } from '@/types/scenario';
import type { TaxConfig } from '@/types/tax';

/** v2 で追加されるデフォルトの税設定 */
function defaultTaxConfig(): TaxConfig {
  return {
    incomeInputMode: 'takeHome',
    mortgageDeduction: {
      enabled: false,
      housingType: 'certified',
      housingAgeType: 'new',
      isChildRaisingHousehold: false,
      moveInYear: new Date().getFullYear(),
    },
    propertyTax: {
      enabled: false,
      landAssessedValue: 0,
      buildingAssessedValue: 0,
      isSmallResidentialLand: true,
      isNewConstruction: false,
      isLongLifeHousing: false,
      constructionYear: new Date().getFullYear(),
    },
    retirementBonus: {
      enabled: false,
      amount: 20_000_000,
      retireYear: new Date().getFullYear() + 30,
      yearsOfService: 35,
    },
  };
}

/**
 * v1 → v2 マイグレーション
 * - version を 2 に上げる
 * - taxConfig を追加（手取りモード = 既存と完全互換）
 * - investmentAccounts は追加しない（v1 の単一投資設定を維持）
 * - income に annualGross を追加（デフォルト 0）
 */
function migrateV1ToV2(obj: Record<string, unknown>): Record<string, unknown> {
  const migrated: Record<string, unknown> = { ...obj, version: 2 };

  // taxConfig がなければデフォルトを追加
  if (!migrated.taxConfig) {
    migrated.taxConfig = defaultTaxConfig();
  }

  // income に annualGross を追加
  const income = migrated.income as Record<string, unknown> | undefined;
  if (income) {
    const husband = income.husband as Record<string, unknown> | undefined;
    if (husband && husband.annualGross === undefined) {
      husband.annualGross = 0;
    }
    const wife = income.wife as Record<string, unknown> | undefined;
    if (wife && wife.annualGross === undefined) {
      wife.annualGross = 0;
    }
  }

  return migrated;
}

/**
 * version フィールドに応じて最新形式へ変換する。
 */
export function migrateScenario(input: unknown): unknown {
  if (typeof input !== 'object' || input === null) return input;
  const obj = input as Record<string, unknown>;
  const version = obj.version;
  switch (version) {
    case 1:
      return migrateV1ToV2(obj) as unknown as Scenario;
    case 2:
      return obj as unknown as Scenario;
    default:
      // 未知のバージョンはそのまま通す（バリデーションで弾く）
      return obj;
  }
}
