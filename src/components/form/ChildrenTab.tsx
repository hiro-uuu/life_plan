import { useScenario } from '@/state/ScenarioContext';
import { NumberField } from './NumberField';
import { Section } from '@/components/common/Section';
import { Button } from '@/components/common/Button';
import { createDefaultChild } from '@/presets/defaultScenario';
import {
  EDUCATION_COST_PRESET,
  EDUCATION_STAGE_LABELS,
} from '@/presets/educationCosts';
import type { Child, EducationStage, SchoolType } from '@/types/child';
import { yen } from '@/utils/format';
import styles from './Form.module.css';

const STAGES: EducationStage[] = [
  'daycare',
  'elementary',
  'juniorHigh',
  'highSchool',
  'university',
];

export function ChildrenTab() {
  const { scenario, dispatch } = useScenario();
  return (
    <Section
      title="子ども"
      subtitle="複数追加可能。教育費は公立/私立で自動設定、上書きも可"
      actions={
        <Button
          variant="primary"
          onClick={() =>
            dispatch({
              type: 'ADD_CHILD',
              child: createDefaultChild(
                scenario.initialConditions.startYear + 1,
                `第${scenario.children.length + 1}子`,
              ),
            })
          }
        >
          + 追加
        </Button>
      }
    >
      {scenario.children.length === 0 && (
        <p className={styles.note}>子どもは登録されていません。</p>
      )}
      <div className={styles.sectionStack}>
        {scenario.children.map((c, idx) => (
          <ChildCard key={c.id} child={c} index={idx} />
        ))}
      </div>
    </Section>
  );
}

function ChildCard({ child, index }: { child: Child; index: number }) {
  const { dispatch } = useScenario();
  const setPlan = (stage: EducationStage, t: SchoolType) =>
    dispatch({
      type: 'UPDATE_CHILD',
      id: child.id,
      patch: { educationPlan: { ...child.educationPlan, [stage]: t } },
    });

  return (
    <div className={styles.childCard}>
      <div className={styles.childHeader}>
        <input
          className={styles.childName}
          value={child.name ?? ''}
          placeholder={`第${index + 1}子`}
          onChange={(e) =>
            dispatch({
              type: 'UPDATE_CHILD',
              id: child.id,
              patch: { name: e.target.value || undefined },
            })
          }
        />
        <Button
          variant="danger"
          onClick={() => dispatch({ type: 'REMOVE_CHILD', id: child.id })}
        >
          削除
        </Button>
      </div>

      <div className={styles.grid2}>
        <NumberField
          label="誕生年"
          value={child.birthYear}
          onChange={(v) =>
            dispatch({ type: 'UPDATE_CHILD', id: child.id, patch: { birthYear: v } })
          }
        />
        <label className={styles.inflationToggle}>
          <input
            type="checkbox"
            checked={child.maternityPauseApplied}
            onChange={(e) =>
              dispatch({
                type: 'UPDATE_CHILD',
                id: child.id,
                patch: { maternityPauseApplied: e.target.checked },
              })
            }
          />
          出産時に妻の産休を適用
        </label>
        <NumberField
          label="年間食費"
          value={child.childFoodAnnual}
          step={10_000}
          suffix="円"
          onChange={(v) =>
            dispatch({ type: 'UPDATE_CHILD', id: child.id, patch: { childFoodAnnual: v } })
          }
        />
        <NumberField
          label="年間雑費"
          value={child.childMiscAnnual}
          step={10_000}
          suffix="円"
          onChange={(v) =>
            dispatch({ type: 'UPDATE_CHILD', id: child.id, patch: { childMiscAnnual: v } })
          }
        />
        <label className={styles.inflationToggle}>
          <input
            type="checkbox"
            checked={child.applyInflationToChildCosts}
            onChange={(e) =>
              dispatch({
                type: 'UPDATE_CHILD',
                id: child.id,
                patch: { applyInflationToChildCosts: e.target.checked },
              })
            }
          />
          子ども費用にインフレ適用
        </label>
      </div>

      <div className={styles.eduGrid}>
        {STAGES.map((stage) => {
          const current = child.educationPlan[stage];
          const override = child.educationCostOverride?.[stage];
          const presetAmount = EDUCATION_COST_PRESET[stage][current];
          return (
            <div key={stage} className={styles.eduStage}>
              <span>{EDUCATION_STAGE_LABELS[stage]}</span>
              <select
                value={current}
                onChange={(e) => setPlan(stage, e.target.value as SchoolType)}
              >
                <option value="public">公立 {yen(EDUCATION_COST_PRESET[stage].public)}</option>
                <option value="private">
                  私立 {yen(EDUCATION_COST_PRESET[stage].private)}
                </option>
              </select>
              <input
                type="number"
                value={override ?? ''}
                placeholder={`上書き（既定 ${presetAmount.toLocaleString()}）`}
                onChange={(e) => {
                  const v = e.target.value === '' ? undefined : Number(e.target.value);
                  const next = { ...(child.educationCostOverride ?? {}) };
                  if (v === undefined) {
                    delete next[stage];
                  } else {
                    next[stage] = v;
                  }
                  dispatch({
                    type: 'UPDATE_CHILD',
                    id: child.id,
                    patch: {
                      educationCostOverride: Object.keys(next).length ? next : undefined,
                    },
                  });
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
