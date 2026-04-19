import { useId } from 'react';
import styles from './Field.module.css';

interface Props {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  hint?: string;
}

export function NumberField({ label, value, onChange, step, min, max, suffix, hint }: Props) {
  const id = useId();
  return (
    <label htmlFor={id} className={styles.field}>
      <span className={styles.label}>{label}</span>
      <span className={styles.inputWrap}>
        <input
          id={id}
          type="number"
          value={Number.isFinite(value) ? value : 0}
          step={step ?? 1}
          {...(min !== undefined ? { min } : {})}
          {...(max !== undefined ? { max } : {})}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === '') {
              onChange(0);
              return;
            }
            const n = Number(raw);
            if (Number.isFinite(n)) onChange(n);
          }}
        />
        {suffix && <span className={styles.suffix}>{suffix}</span>}
      </span>
      {hint && <span className={styles.hint}>{hint}</span>}
    </label>
  );
}
