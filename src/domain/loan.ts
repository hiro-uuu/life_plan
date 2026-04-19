import type { Loan, YearlyLoanPayment } from '@/types/loan';

/**
 * 元利均等返済方式で月次スケジュールを生成し、年次に集約する。
 * - 月利 r = annualRatePercent / 100 / 12
 * - 月返済 M = P * r / (1 - (1 + r)^(-n)), n = termYears * 12
 * - 金利 0% は M = P / n
 * - 年次の返済額は当該年中の月返済合計。元金/利息も同様に集約。
 * - 端数: 月次は四捨五入せず素の数値を用い、最終月で残債を精算して ±1 円以内に収める。
 *
 * 戻り値は「借入年から最終年まで」1 年ごとの配列。
 */
export function buildAmortizationSchedule(loan: Loan): YearlyLoanPayment[] {
  const { principal, annualInterestRatePercent, termYears } = loan;
  if (termYears <= 0 || principal <= 0) {
    return [];
  }

  const n = termYears * 12;
  const rMonth = annualInterestRatePercent / 100 / 12;
  const isZeroRate = rMonth === 0;

  const monthlyPayment = isZeroRate
    ? principal / n
    : (principal * rMonth) / (1 - Math.pow(1 + rMonth, -n));

  const yearly: YearlyLoanPayment[] = [];
  let balance = principal;

  for (let year = 0; year < termYears; year++) {
    let yearInterest = 0;
    let yearPrincipal = 0;
    let yearTotal = 0;

    for (let m = 0; m < 12; m++) {
      const isLastMonth = year === termYears - 1 && m === 11;
      const interest = isZeroRate ? 0 : balance * rMonth;
      let principalPaid = monthlyPayment - interest;
      let paid = monthlyPayment;

      if (isLastMonth) {
        // 最終月は残債を丸ごと返す（丸め誤差の精算）
        principalPaid = balance;
        paid = balance + interest;
      }

      balance -= principalPaid;
      yearInterest += interest;
      yearPrincipal += principalPaid;
      yearTotal += paid;
    }

    yearly.push({
      total: yearTotal,
      interest: yearInterest,
      principal: yearPrincipal,
      outstandingBalance: Math.max(0, balance),
    });
  }

  return yearly;
}

/**
 * 指定した暦年に属する返済データを返す。該当しなければ 0 を返す。
 * outstandingBalance はその年末時点（返済前が借入年、返済後が以降）。
 */
export function getLoanPaymentForYear(
  loan: Loan,
  schedule: YearlyLoanPayment[],
  year: number,
): YearlyLoanPayment {
  const offset = year - loan.startYear;
  const zero: YearlyLoanPayment = {
    total: 0,
    interest: 0,
    principal: 0,
    outstandingBalance: 0,
  };
  if (offset < 0) {
    // 開始年より前 → 残債もまだ発生していない
    return zero;
  }
  if (offset >= schedule.length) {
    // 完済済み
    return zero;
  }
  return schedule[offset] ?? zero;
}

/** その年の月返済額（参考表示用） */
export function computeMonthlyPayment(loan: Loan): number {
  const { principal, annualInterestRatePercent, termYears } = loan;
  if (termYears <= 0 || principal <= 0) return 0;
  const n = termYears * 12;
  const rMonth = annualInterestRatePercent / 100 / 12;
  if (rMonth === 0) return principal / n;
  return (principal * rMonth) / (1 - Math.pow(1 + rMonth, -n));
}
