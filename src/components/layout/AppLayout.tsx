import type { ReactNode } from 'react';
import styles from './AppLayout.module.css';

interface Props {
  header: ReactNode;
  form: ReactNode;
  table: ReactNode;
  charts: ReactNode;
}

export function AppLayout({ header, form, table, charts }: Props) {
  return (
    <div className={styles.root}>
      {header}
      <main className={styles.main}>
        <aside className={[styles.pane, styles.left, 'scrollbar-thin'].join(' ')}>{form}</aside>
        <section className={[styles.pane, styles.center, 'scrollbar-thin'].join(' ')}>
          {table}
        </section>
        <section className={[styles.pane, styles.right, 'scrollbar-thin'].join(' ')}>
          {charts}
        </section>
      </main>
    </div>
  );
}
