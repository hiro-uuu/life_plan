import { useScenario } from '@/state/ScenarioContext';
import { Section } from '@/components/common/Section';
import {
  EXPENSE_CATEGORY_KEYS,
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategoryKey,
} from '@/types/expense';
import styles from './Form.module.css';

export function ExpenseTab() {
  return (
    <Section
      title="年間支出（カテゴリ別）"
      subtitle="年額円。applyInflation を ON にしたカテゴリは年率インフレが複利で適用される"
    >
      <div>
        {EXPENSE_CATEGORY_KEYS.map((key) => (
          <CategoryRow key={key} k={key} />
        ))}
      </div>
      <p className={styles.note}>
        ※ 子ども関連費用（食費・雑費・教育費）は「子ども」タブで管理します。
        住宅ローンは「負債」タブで設定すると返済額が支出に自動反映されます。
      </p>
    </Section>
  );
}

function CategoryRow({ k }: { k: ExpenseCategoryKey }) {
  const { scenario, dispatch } = useScenario();
  const item = scenario.expense.categories[k];
  return (
    <div className={styles.categoryRow}>
      <span className={styles.categoryName}>{EXPENSE_CATEGORY_LABELS[k]}</span>
      <input
        className={styles.categoryInput}
        type="number"
        value={item.annualAmount}
        step={10_000}
        min={0}
        onChange={(e) =>
          dispatch({
            type: 'UPDATE_EXPENSE_CATEGORY',
            key: k,
            patch: { annualAmount: Number(e.target.value) || 0 },
          })
        }
      />
      <label className={styles.inflationToggle}>
        <input
          type="checkbox"
          checked={item.applyInflation}
          onChange={(e) =>
            dispatch({
              type: 'UPDATE_EXPENSE_CATEGORY',
              key: k,
              patch: { applyInflation: e.target.checked },
            })
          }
        />
        インフレ
      </label>
    </div>
  );
}
