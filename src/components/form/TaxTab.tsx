import { useScenario } from '@/state/ScenarioContext';
import { NumberField } from './NumberField';
import { Section } from '@/components/common/Section';
import styles from './Form.module.css';
import type { HousingType, HousingAgeType } from '@/types/tax';

export function TaxTab() {
  const { scenario, dispatch } = useScenario();
  const tc = scenario.taxConfig;
  if (!tc) return null;

  const md = tc.mortgageDeduction;
  const pt = tc.propertyTax;
  const rb = tc.retirementBonus;

  return (
    <div className={styles.sectionStack}>
      <Section title="収入入力モード">
        <div className={styles.grid2}>
          <label className={styles.eduStage}>
            モード
            <select
              value={tc.incomeInputMode}
              onChange={(e) =>
                dispatch({
                  type: 'SET_INCOME_INPUT_MODE',
                  mode: e.target.value as 'takeHome' | 'gross',
                })
              }
            >
              <option value="takeHome">手取り入力</option>
              <option value="gross">額面入力（税自動計算）</option>
            </select>
          </label>
        </div>
        <p className={styles.note}>
          {tc.incomeInputMode === 'gross'
            ? '※ 額面年収から社会保険料・所得税・住民税を自動計算します。住宅ローン控除や児童手当も反映されます。'
            : '※ 手取り入力モードでは税計算をスキップします。従来と同じ動作です。'}
        </p>
      </Section>

      {tc.incomeInputMode === 'gross' && (
        <>
          <Section title="住宅ローン控除">
            <div className={styles.grid2}>
              <label className={styles.inflationToggle}>
                <input
                  type="checkbox"
                  checked={md.enabled}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_MORTGAGE_DEDUCTION',
                      patch: { enabled: e.target.checked },
                    })
                  }
                />
                住宅ローン控除を適用する
              </label>
            </div>
            {md.enabled && (
              <div className={styles.grid2}>
                <label className={styles.eduStage}>
                  住宅種別
                  <select
                    value={md.housingType}
                    onChange={(e) =>
                      dispatch({
                        type: 'UPDATE_MORTGAGE_DEDUCTION',
                        patch: { housingType: e.target.value as HousingType },
                      })
                    }
                  >
                    <option value="certified">認定住宅（長期優良/低炭素）</option>
                    <option value="zeh">ZEH水準省エネ住宅</option>
                    <option value="energyEfficient">省エネ基準適合住宅</option>
                    <option value="other">その他（控除対象外）</option>
                  </select>
                </label>
                <label className={styles.eduStage}>
                  新築/中古
                  <select
                    value={md.housingAgeType}
                    onChange={(e) =>
                      dispatch({
                        type: 'UPDATE_MORTGAGE_DEDUCTION',
                        patch: { housingAgeType: e.target.value as HousingAgeType },
                      })
                    }
                  >
                    <option value="new">新築</option>
                    <option value="used">中古</option>
                  </select>
                </label>
                <label className={styles.inflationToggle}>
                  <input
                    type="checkbox"
                    checked={md.isChildRaisingHousehold}
                    onChange={(e) =>
                      dispatch({
                        type: 'UPDATE_MORTGAGE_DEDUCTION',
                        patch: { isChildRaisingHousehold: e.target.checked },
                      })
                    }
                  />
                  子育て・若者世帯
                </label>
                <NumberField
                  label="入居年"
                  value={md.moveInYear}
                  onChange={(v) =>
                    dispatch({
                      type: 'UPDATE_MORTGAGE_DEDUCTION',
                      patch: { moveInYear: v },
                    })
                  }
                />
              </div>
            )}
            <p className={styles.note}>
              ※ 年末ローン残高 × 0.7%を所得税・住民税から控除します。住宅ローン（負債タブ）の設定が必要です。
            </p>
          </Section>

          <Section title="固定資産税">
            <div className={styles.grid2}>
              <label className={styles.inflationToggle}>
                <input
                  type="checkbox"
                  checked={pt.enabled}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_PROPERTY_TAX',
                      patch: { enabled: e.target.checked },
                    })
                  }
                />
                固定資産税を計算する
              </label>
            </div>
            {pt.enabled && (
              <div className={styles.grid2}>
                <NumberField
                  label="土地の評価額"
                  value={pt.landAssessedValue}
                  step={100_000}
                  suffix="円"
                  onChange={(v) =>
                    dispatch({
                      type: 'UPDATE_PROPERTY_TAX',
                      patch: { landAssessedValue: v },
                    })
                  }
                />
                <NumberField
                  label="建物の評価額"
                  value={pt.buildingAssessedValue}
                  step={100_000}
                  suffix="円"
                  onChange={(v) =>
                    dispatch({
                      type: 'UPDATE_PROPERTY_TAX',
                      patch: { buildingAssessedValue: v },
                    })
                  }
                />
                <label className={styles.inflationToggle}>
                  <input
                    type="checkbox"
                    checked={pt.isSmallResidentialLand}
                    onChange={(e) =>
                      dispatch({
                        type: 'UPDATE_PROPERTY_TAX',
                        patch: { isSmallResidentialLand: e.target.checked },
                      })
                    }
                  />
                  小規模住宅用地（200m2以下）
                </label>
                <label className={styles.inflationToggle}>
                  <input
                    type="checkbox"
                    checked={pt.isNewConstruction}
                    onChange={(e) =>
                      dispatch({
                        type: 'UPDATE_PROPERTY_TAX',
                        patch: { isNewConstruction: e.target.checked },
                      })
                    }
                  />
                  新築住宅
                </label>
                {pt.isNewConstruction && (
                  <>
                    <label className={styles.inflationToggle}>
                      <input
                        type="checkbox"
                        checked={pt.isLongLifeHousing}
                        onChange={(e) =>
                          dispatch({
                            type: 'UPDATE_PROPERTY_TAX',
                            patch: { isLongLifeHousing: e.target.checked },
                          })
                        }
                      />
                      長期優良住宅（減額5年）
                    </label>
                    <NumberField
                      label="新築年"
                      value={pt.constructionYear}
                      onChange={(v) =>
                        dispatch({
                          type: 'UPDATE_PROPERTY_TAX',
                          patch: { constructionYear: v },
                        })
                      }
                    />
                  </>
                )}
              </div>
            )}
            <p className={styles.note}>
              ※ 評価額 × 1.4%。小規模住宅用地は土地が1/6。新築は建物が3年間（長期優良5年間）50%減。
            </p>
          </Section>

          <Section title="退職金">
            <div className={styles.grid2}>
              <label className={styles.inflationToggle}>
                <input
                  type="checkbox"
                  checked={rb.enabled}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_RETIREMENT_BONUS',
                      patch: { enabled: e.target.checked },
                    })
                  }
                />
                退職金を含める
              </label>
            </div>
            {rb.enabled && (
              <div className={styles.grid2}>
                <NumberField
                  label="退職金額"
                  value={rb.amount}
                  step={1_000_000}
                  suffix="円"
                  onChange={(v) =>
                    dispatch({
                      type: 'UPDATE_RETIREMENT_BONUS',
                      patch: { amount: v },
                    })
                  }
                />
                <NumberField
                  label="退職年"
                  value={rb.retireYear}
                  onChange={(v) =>
                    dispatch({
                      type: 'UPDATE_RETIREMENT_BONUS',
                      patch: { retireYear: v },
                    })
                  }
                />
                <NumberField
                  label="勤続年数"
                  value={rb.yearsOfService}
                  min={0}
                  onChange={(v) =>
                    dispatch({
                      type: 'UPDATE_RETIREMENT_BONUS',
                      patch: { yearsOfService: v },
                    })
                  }
                />
              </div>
            )}
            <p className={styles.note}>
              ※ 退職所得控除（勤続20年以下: 40万×年、超: 800万+70万×(年-20)）を適用し、(退職金-控除)×1/2に課税。
            </p>
          </Section>
        </>
      )}
    </div>
  );
}
