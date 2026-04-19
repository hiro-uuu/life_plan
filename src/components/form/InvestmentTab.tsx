import { useScenario } from '@/state/ScenarioContext';
import { NumberField } from './NumberField';
import { PercentField } from './PercentField';
import { Section } from '@/components/common/Section';
import styles from './Form.module.css';

export function InvestmentTab() {
  const { scenario, dispatch } = useScenario();
  const inv = scenario.investment;
  return (
    <Section title="投資（NISA 等）" subtitle="利回り → 積立 の順で年末残高を計算">
      <div className={styles.grid2}>
        <NumberField
          label="開始時点の残高"
          value={inv.initialBalance}
          step={100_000}
          suffix="円"
          onChange={(v) => dispatch({ type: 'UPDATE_INVESTMENT', patch: { initialBalance: v } })}
        />
        <NumberField
          label="年間積立額"
          value={inv.annualContribution}
          step={10_000}
          suffix="円"
          onChange={(v) =>
            dispatch({ type: 'UPDATE_INVESTMENT', patch: { annualContribution: v } })
          }
        />
        <PercentField
          label="年利回り"
          value={inv.annualYieldPercent}
          min={-50}
          max={50}
          onChange={(v) =>
            dispatch({ type: 'UPDATE_INVESTMENT', patch: { annualYieldPercent: v } })
          }
        />
        <NumberField
          label="積立の年間増額（任意）"
          value={inv.contributionRaiseAmount ?? 0}
          step={10_000}
          suffix="円"
          onChange={(v) =>
            dispatch({
              type: 'UPDATE_INVESTMENT',
              patch: { contributionRaiseAmount: v || undefined },
            })
          }
        />
        <NumberField
          label="積立停止年（任意）"
          value={inv.stopContributionYear ?? 0}
          onChange={(v) =>
            dispatch({
              type: 'UPDATE_INVESTMENT',
              patch: { stopContributionYear: v > 0 ? v : undefined },
            })
          }
          hint="0 なら停止なし"
        />
      </div>
      <p className={styles.note}>
        ※ 積立金は「支出」ではなく「預金 → 投資残高への振替」として扱われます。
      </p>
    </Section>
  );
}
