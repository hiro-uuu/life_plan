import { useScenario } from '@/state/ScenarioContext';
import { NumberField } from './NumberField';
import { Section } from '@/components/common/Section';
import styles from './Form.module.css';

export function IncomeTab() {
  const { scenario, dispatch } = useScenario();
  const { husband, wife } = scenario.income;

  return (
    <div className={styles.sectionStack}>
      <Section title="夫の収入（手取り）">
        <div className={styles.grid2}>
          <NumberField
            label="初年度の年収"
            value={husband.annualTakeHome}
            step={100_000}
            suffix="円"
            onChange={(v) => dispatch({ type: 'UPDATE_HUSBAND', patch: { annualTakeHome: v } })}
          />
          <NumberField
            label="年間昇給額"
            value={husband.annualRaiseAmount}
            step={10_000}
            suffix="円"
            onChange={(v) =>
              dispatch({ type: 'UPDATE_HUSBAND', patch: { annualRaiseAmount: v } })
            }
            hint="毎年この額ずつ加算（固定額）"
          />
          <NumberField
            label="退職年（任意）"
            value={husband.retireYear ?? 0}
            onChange={(v) =>
              dispatch({
                type: 'UPDATE_HUSBAND',
                patch: { retireYear: v > 0 ? v : undefined },
              })
            }
            hint="0 なら退職なし"
          />
        </div>
        <p className={styles.note}>
          ※ 要件通り、夫の給与にはインフレは適用されません（実質賃金の目減りを表現）。
        </p>
      </Section>

      <Section title="妻の収入（手取り）">
        <div className={styles.grid2}>
          <NumberField
            label="年収"
            value={wife.annualTakeHome}
            step={100_000}
            suffix="円"
            onChange={(v) => dispatch({ type: 'UPDATE_WIFE', patch: { annualTakeHome: v } })}
            hint="昇給なし（要件通り）"
          />
          <NumberField
            label="産休年数"
            value={wife.maternityLeaveYears}
            min={0}
            max={10}
            onChange={(v) =>
              dispatch({ type: 'UPDATE_WIFE', patch: { maternityLeaveYears: v } })
            }
            hint="1 なら出産年のみ 0。出産年を含む年数。"
          />
          <NumberField
            label="退職年（任意）"
            value={wife.retireYear ?? 0}
            onChange={(v) =>
              dispatch({ type: 'UPDATE_WIFE', patch: { retireYear: v > 0 ? v : undefined } })
            }
            hint="0 なら退職なし"
          />
        </div>
      </Section>
    </div>
  );
}
