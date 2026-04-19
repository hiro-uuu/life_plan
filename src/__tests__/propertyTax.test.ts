import { describe, it, expect } from 'vitest';
import { calcPropertyTax } from '@/domain/propertyTax';
import type { PropertyTaxConfig } from '@/types/tax';

const baseConfig: PropertyTaxConfig = {
  enabled: true,
  landAssessedValue: 10_000_000,
  buildingAssessedValue: 8_000_000,
  isSmallResidentialLand: false,
  isNewConstruction: false,
  isLongLifeHousing: false,
  constructionYear: 2027,
};

describe('calcPropertyTax', () => {
  it('returns 0 when disabled', () => {
    expect(calcPropertyTax({ ...baseConfig, enabled: false }, 2028)).toBe(0);
  });

  it('calculates basic tax: (land + building) × 1.4%', () => {
    const tax = calcPropertyTax(baseConfig, 2028);
    // land: 10M × 1.4% = 140,000
    // building: 8M × 1.4% = 112,000
    // total: 252,000
    expect(tax).toBe(140_000 + 112_000);
  });

  it('applies small residential land exemption (1/6)', () => {
    const tax = calcPropertyTax(
      { ...baseConfig, isSmallResidentialLand: true },
      2028,
    );
    // land: 10M / 6 × 1.4% = 23,333 → 23,333
    // building: 8M × 1.4% = 112,000
    const expectedLand = Math.round((10_000_000 / 6) * 0.014);
    expect(tax).toBe(expectedLand + 112_000);
  });

  it('applies new construction reduction for 3 years', () => {
    const config: PropertyTaxConfig = {
      ...baseConfig,
      isNewConstruction: true,
      constructionYear: 2027,
    };
    // year 2027 (year 0): reduced
    const tax2027 = calcPropertyTax(config, 2027);
    // year 2029 (year 2): still reduced
    const tax2029 = calcPropertyTax(config, 2029);
    // year 2030 (year 3): not reduced
    const tax2030 = calcPropertyTax(config, 2030);

    const reducedBuildingTax = Math.round(8_000_000 * 0.014 * 0.5);
    const fullBuildingTax = Math.round(8_000_000 * 0.014);
    const landTax = Math.round(10_000_000 * 0.014);

    expect(tax2027).toBe(landTax + reducedBuildingTax);
    expect(tax2029).toBe(landTax + reducedBuildingTax);
    expect(tax2030).toBe(landTax + fullBuildingTax);
  });

  it('applies long-life housing reduction for 5 years', () => {
    const config: PropertyTaxConfig = {
      ...baseConfig,
      isNewConstruction: true,
      isLongLifeHousing: true,
      constructionYear: 2027,
    };
    // year 2031 (year 4): still reduced for long-life
    const tax2031 = calcPropertyTax(config, 2031);
    // year 2032 (year 5): not reduced
    const tax2032 = calcPropertyTax(config, 2032);

    const reducedBuildingTax = Math.round(8_000_000 * 0.014 * 0.5);
    const fullBuildingTax = Math.round(8_000_000 * 0.014);
    const landTax = Math.round(10_000_000 * 0.014);

    expect(tax2031).toBe(landTax + reducedBuildingTax);
    expect(tax2032).toBe(landTax + fullBuildingTax);
  });
});
