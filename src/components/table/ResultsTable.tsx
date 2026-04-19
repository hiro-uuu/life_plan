import type { YearlyResult } from '@/types/result';
import { manYen } from '@/utils/format';
import styles from './ResultsTable.module.css';

interface Props {
  rows: YearlyResult[];
}

export function ResultsTable({ rows }: Props) {
  const hasGrossMode = rows.some((r) => r.taxBreakdown);

  return (
    <div className={[styles.wrap, 'scrollbar-thin'].join(' ')}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.stickyCol}>年</th>
            <th>夫歳</th>
            <th>妻歳</th>
            {hasGrossMode && <th>額面</th>}
            {hasGrossMode && <th>社保</th>}
            {hasGrossMode && <th>税金</th>}
            {hasGrossMode && <th>控除</th>}
            <th className={styles.good}>収入</th>
            <th className={styles.bad}>支出</th>
            <th>収支</th>
            <th>預金</th>
            <th>投資</th>
            <th>負債</th>
            <th className={styles.bold}>純資産</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const diff = r.totalIncome - r.totalExpense;
            const tb = r.taxBreakdown;
            return (
              <tr
                key={r.year}
                className={[
                  r.isMaternityLeaveYear ? styles.maternity : '',
                  r.cashSavings < 0 ? styles.danger : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                title={
                  r.isMaternityLeaveYear
                    ? `${r.year} 産休年（妻の収入 0）`
                    : undefined
                }
              >
                <td className={styles.stickyCol}>{r.year}</td>
                <td>{r.husbandAge}</td>
                <td>{r.wifeAge}</td>
                {hasGrossMode && (
                  <td className={styles.num}>{tb ? manYen(tb.grossIncome) : '-'}</td>
                )}
                {hasGrossMode && (
                  <td className={styles.num}>{tb ? manYen(tb.socialInsurance) : '-'}</td>
                )}
                {hasGrossMode && (
                  <td className={styles.num}>
                    {tb ? manYen(tb.incomeTax + tb.residentTax) : '-'}
                  </td>
                )}
                {hasGrossMode && (
                  <td className={styles.num}>
                    {tb ? manYen(tb.mortgageDeduction + tb.childAllowance) : '-'}
                  </td>
                )}
                <td className={styles.num}>{manYen(r.totalIncome)}</td>
                <td className={styles.num}>{manYen(r.totalExpense)}</td>
                <td className={[styles.num, diff < 0 ? styles.bad : styles.good].join(' ')}>
                  {manYen(diff)}
                </td>
                <td className={styles.num}>{manYen(r.cashSavings)}</td>
                <td className={styles.num}>{manYen(r.investmentBalance)}</td>
                <td className={styles.num}>{manYen(-r.loanOutstandingBalance)}</td>
                <td className={[styles.num, styles.bold].join(' ')}>{manYen(r.netAssets)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
