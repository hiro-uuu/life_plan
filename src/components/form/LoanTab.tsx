import { useScenario } from '@/state/ScenarioContext';
import { NumberField } from './NumberField';
import { PercentField } from './PercentField';
import { Section } from '@/components/common/Section';
import { Button } from '@/components/common/Button';
import { cryptoRandomId } from '@/presets/defaultScenario';
import { computeMonthlyPayment } from '@/domain/loan';
import { yen } from '@/utils/format';
import styles from './Form.module.css';
import type { Loan } from '@/types/loan';

export function LoanTab() {
  const { scenario, dispatch } = useScenario();
  return (
    <Section
      title="負債（ローン）"
      subtitle="元利均等方式で毎月返済額を自動計算"
      actions={
        <Button
          variant="primary"
          onClick={() =>
            dispatch({
              type: 'ADD_LOAN',
              loan: {
                id: cryptoRandomId(),
                kind: 'mortgage',
                name: '住宅ローン',
                principal: 30_000_000,
                annualInterestRatePercent: 1.2,
                termYears: 35,
                startYear: scenario.initialConditions.startYear + 1,
              },
            })
          }
        >
          + 追加
        </Button>
      }
    >
      {scenario.loans.length === 0 && (
        <p className={styles.note}>ローンは登録されていません。</p>
      )}
      <div className={styles.sectionStack}>
        {scenario.loans.map((l) => (
          <LoanCard key={l.id} loan={l} />
        ))}
      </div>
    </Section>
  );
}

function LoanCard({ loan }: { loan: Loan }) {
  const { dispatch } = useScenario();
  const monthly = computeMonthlyPayment(loan);
  return (
    <div className={styles.childCard}>
      <div className={styles.childHeader}>
        <input
          className={styles.childName}
          value={loan.name}
          onChange={(e) =>
            dispatch({ type: 'UPDATE_LOAN', id: loan.id, patch: { name: e.target.value } })
          }
        />
        <Button
          variant="danger"
          onClick={() => dispatch({ type: 'REMOVE_LOAN', id: loan.id })}
        >
          削除
        </Button>
      </div>
      <div className={styles.grid2}>
        <label className={styles.eduStage}>
          種別
          <select
            value={loan.kind}
            onChange={(e) =>
              dispatch({
                type: 'UPDATE_LOAN',
                id: loan.id,
                patch: { kind: e.target.value as Loan['kind'] },
              })
            }
          >
            <option value="mortgage">住宅ローン</option>
            <option value="other">その他</option>
          </select>
        </label>
        <NumberField
          label="元本"
          value={loan.principal}
          step={100_000}
          suffix="円"
          onChange={(v) =>
            dispatch({ type: 'UPDATE_LOAN', id: loan.id, patch: { principal: v } })
          }
        />
        <PercentField
          label="年利"
          value={loan.annualInterestRatePercent}
          min={0}
          max={50}
          step={0.01}
          onChange={(v) =>
            dispatch({
              type: 'UPDATE_LOAN',
              id: loan.id,
              patch: { annualInterestRatePercent: v },
            })
          }
        />
        <NumberField
          label="返済年数"
          value={loan.termYears}
          min={1}
          max={60}
          onChange={(v) =>
            dispatch({ type: 'UPDATE_LOAN', id: loan.id, patch: { termYears: v } })
          }
        />
        <NumberField
          label="返済開始年"
          value={loan.startYear}
          onChange={(v) =>
            dispatch({ type: 'UPDATE_LOAN', id: loan.id, patch: { startYear: v } })
          }
        />
      </div>
      <p className={styles.note}>月返済額（目安）: {yen(monthly)}</p>
    </div>
  );
}
