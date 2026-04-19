import styles from './TabBar.module.css';

export interface Tab<K extends string> {
  key: K;
  label: string;
}

interface Props<K extends string> {
  tabs: readonly Tab<K>[];
  active: K;
  onChange: (k: K) => void;
}

export function TabBar<K extends string>({ tabs, active, onChange }: Props<K>) {
  return (
    <div className={styles.root} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={t.key === active}
          className={[styles.tab, t.key === active ? styles.active : ''].join(' ')}
          onClick={() => onChange(t.key)}
          type="button"
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
