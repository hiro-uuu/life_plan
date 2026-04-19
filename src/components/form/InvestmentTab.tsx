import { useScenario } from '@/state/ScenarioContext';
import { NumberField } from './NumberField';
import { PercentField } from './PercentField';
import { Section } from '@/components/common/Section';
import { Button } from '@/components/common/Button';
import { cryptoRandomId } from '@/presets/defaultScenario';
import styles from './Form.module.css';
import type { InvestmentAccount } from '@/types/investment';
import type { InvestmentAccountType } from '@/types/tax';

export function InvestmentTab() {
  const { scenario, dispatch } = useScenario();
  const inv = scenario.investment;
  const accounts = scenario.investmentAccounts ?? [];
  const hasAccounts = accounts.length > 0;

  return (
    <div className={styles.sectionStack}>
      {!hasAccounts && (
        <Section title="投資（単一口座）" subtitle="利回り → 積立 の順で年末残高を計算">
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
      )}

      <Section
        title="投資口座（NISA / 課税口座）"
        subtitle="口座ごとにNISA（非課税）か課税口座かを設定"
        actions={
          <Button
            variant="primary"
            onClick={() =>
              dispatch({
                type: 'ADD_INVESTMENT_ACCOUNT',
                account: {
                  id: cryptoRandomId(),
                  name: 'NISA口座',
                  accountType: 'nisa',
                  initialBalance: 0,
                  annualContribution: 600_000,
                  annualYieldPercent: 4,
                },
              })
            }
          >
            + 口座追加
          </Button>
        }
      >
        {accounts.length === 0 && (
          <p className={styles.note}>
            口座を追加すると、上の単一投資設定の代わりに口座ごとの個別計算になります。
            NISA口座は利益非課税、課税口座は利益に20.315%課税されます。
          </p>
        )}
        <div className={styles.sectionStack}>
          {accounts.map((a) => (
            <AccountCard key={a.id} account={a} />
          ))}
        </div>
      </Section>
    </div>
  );
}

function AccountCard({ account }: { account: InvestmentAccount }) {
  const { dispatch } = useScenario();
  return (
    <div className={styles.childCard}>
      <div className={styles.childHeader}>
        <input
          className={styles.childName}
          value={account.name}
          onChange={(e) =>
            dispatch({
              type: 'UPDATE_INVESTMENT_ACCOUNT',
              id: account.id,
              patch: { name: e.target.value },
            })
          }
        />
        <Button
          variant="danger"
          onClick={() => dispatch({ type: 'REMOVE_INVESTMENT_ACCOUNT', id: account.id })}
        >
          削除
        </Button>
      </div>
      <div className={styles.grid2}>
        <label className={styles.eduStage}>
          口座種別
          <select
            value={account.accountType}
            onChange={(e) =>
              dispatch({
                type: 'UPDATE_INVESTMENT_ACCOUNT',
                id: account.id,
                patch: { accountType: e.target.value as InvestmentAccountType },
              })
            }
          >
            <option value="nisa">NISA（非課税）</option>
            <option value="taxable">課税口座</option>
          </select>
        </label>
        <NumberField
          label="開始残高"
          value={account.initialBalance}
          step={100_000}
          suffix="円"
          onChange={(v) =>
            dispatch({
              type: 'UPDATE_INVESTMENT_ACCOUNT',
              id: account.id,
              patch: { initialBalance: v },
            })
          }
        />
        <NumberField
          label="年間積立額"
          value={account.annualContribution}
          step={10_000}
          suffix="円"
          onChange={(v) =>
            dispatch({
              type: 'UPDATE_INVESTMENT_ACCOUNT',
              id: account.id,
              patch: { annualContribution: v },
            })
          }
        />
        <PercentField
          label="年利回り"
          value={account.annualYieldPercent}
          min={-50}
          max={50}
          onChange={(v) =>
            dispatch({
              type: 'UPDATE_INVESTMENT_ACCOUNT',
              id: account.id,
              patch: { annualYieldPercent: v },
            })
          }
        />
        <NumberField
          label="積立の年間増額（任意）"
          value={account.contributionRaiseAmount ?? 0}
          step={10_000}
          suffix="円"
          onChange={(v) =>
            dispatch({
              type: 'UPDATE_INVESTMENT_ACCOUNT',
              id: account.id,
              patch: { contributionRaiseAmount: v || undefined },
            })
          }
        />
        <NumberField
          label="積立停止年（任意）"
          value={account.stopContributionYear ?? 0}
          onChange={(v) =>
            dispatch({
              type: 'UPDATE_INVESTMENT_ACCOUNT',
              id: account.id,
              patch: { stopContributionYear: v > 0 ? v : undefined },
            })
          }
          hint="0 なら停止なし"
        />
      </div>
      {account.accountType === 'nisa' && (
        <p className={styles.note}>
          ※ NISA: 年間最大360万円、生涯1,800万円まで非課税。利益に対する税金はかかりません。
        </p>
      )}
      {account.accountType === 'taxable' && (
        <p className={styles.note}>
          ※ 課税口座: 利益に対して20.315%（所得税15.315% + 住民税5%）が課税されます。
        </p>
      )}
    </div>
  );
}
