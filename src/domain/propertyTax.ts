import type { PropertyTaxConfig } from '@/types/tax';

/** 固定資産税率 */
const PROPERTY_TAX_RATE = 0.014; // 1.4%

/** 新築減額割合 */
const NEW_CONSTRUCTION_REDUCTION = 0.5; // 50%減

/**
 * 固定資産税を計算する
 *
 * - 税率: 評価額 × 1.4%
 * - 住宅用地特例: 小規模住宅用地（200m2以下）は土地評価額の1/6
 * - 新築減額: 建物分が3年間50%減（長期優良住宅は5年間）
 *
 * @param config 固定資産税設定
 * @param currentYear 現在の年
 * @returns 固定資産税額
 */
export function calcPropertyTax(
  config: PropertyTaxConfig,
  currentYear: number,
): number {
  if (!config.enabled) return 0;

  // 土地の税額
  let landValue = config.landAssessedValue;
  if (config.isSmallResidentialLand) {
    landValue = landValue / 6; // 小規模住宅用地特例
  }
  const landTax = Math.round(landValue * PROPERTY_TAX_RATE);

  // 建物の税額
  let buildingTax = Math.round(config.buildingAssessedValue * PROPERTY_TAX_RATE);

  // 新築減額の適用
  if (config.isNewConstruction) {
    const reductionYears = config.isLongLifeHousing ? 5 : 3;
    const yearsElapsed = currentYear - config.constructionYear;
    if (yearsElapsed >= 0 && yearsElapsed < reductionYears) {
      buildingTax = Math.round(buildingTax * NEW_CONSTRUCTION_REDUCTION);
    }
  }

  return landTax + buildingTax;
}
