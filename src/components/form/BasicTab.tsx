import { useScenario } from '@/state/ScenarioContext';
import { NumberField } from './NumberField';
import { PercentField } from './PercentField';
import { Section } from '@/components/common/Section';
import styles from './Form.module.css';

export function BasicTab() {
  const { scenario, dispatch } = useScenario();
  const ic = scenario.initialConditions;
  return (
    <Section title="基本条件" subtitle="開始年、年齢、初期預金、インフレ率">
      <div className={styles.grid2}>
        <NumberField
          label="開始年"
          value={ic.startYear}
          min={1900}
          max={2200}
          onChange={(v) => dispatch({ type: 'UPDATE_INITIAL', patch: { startYear: v } })}
        />
        <NumberField
          label="終了年齢（夫基準）"
          value={ic.endAge}
          min={ic.husbandAge}
          max={120}
          onChange={(v) => dispatch({ type: 'UPDATE_INITIAL', patch: { endAge: v } })}
        />
        <NumberField
          label="夫の年齢（開始時）"
          value={ic.husbandAge}
          min={0}
          max={120}
          onChange={(v) => dispatch({ type: 'UPDATE_INITIAL', patch: { husbandAge: v } })}
        />
        <NumberField
          label="妻の年齢（開始時）"
          value={ic.wifeAge}
          min={0}
          max={120}
          onChange={(v) => dispatch({ type: 'UPDATE_INITIAL', patch: { wifeAge: v } })}
        />
        <NumberField
          label="初期預金"
          value={ic.initialCashSavings}
          step={100_000}
          suffix="円"
          onChange={(v) =>
            dispatch({ type: 'UPDATE_INITIAL', patch: { initialCashSavings: v } })
          }
        />
        <PercentField
          label="インフレ率"
          value={ic.inflationRatePercent}
          min={-20}
          max={20}
          onChange={(v) =>
            dispatch({ type: 'UPDATE_INITIAL', patch: { inflationRatePercent: v } })
          }
          hint="applyInflation=on のカテゴリに毎年複利で適用"
        />
      </div>
    </Section>
  );
}
