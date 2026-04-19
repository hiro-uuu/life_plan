import type { Scenario } from '@/types/scenario';
import type {
  SimulationOutput,
  SimulationWarning,
  YearlyResult,
  ChildYearlyState,
} from '@/types/result';
import { buildInflationFactors } from './inflation';
import { computeHusbandIncome, computeWifeIncome } from './income';
import { computeExpenseByCategory, sumExpense } from './expense';
import { childAgeInYear, computeChildYearlyCost, stageForAge } from './child';
import { stepInvestment } from './investment';
import { buildAmortizationSchedule, getLoanPaymentForYear } from './loan';
import type { YearlyLoanPayment } from '@/types/loan';

/**
 * 年次離散モデルでライフプランをシミュレーションする純粋関数。
 * 出力: 各年の YearlyResult 配列と警告。
 */
export function simulate(scenario: Scenario): SimulationOutput {
  const { initialConditions } = scenario;
  const years = buildYearRange(initialConditions.startYear, initialConditions.husbandAge, initialConditions.endAge);
  const yearCount = years.length;

  // インフレ係数テーブル
  const inflationFactors = buildInflationFactors(
    initialConditions.inflationRatePercent,
    yearCount,
  );

  // ローンの年次スケジュールを事前計算
  const loanSchedules = new Map<string, YearlyLoanPayment[]>();
  let totalInitialLoanBalance = 0;
  for (const loan of scenario.loans) {
    loanSchedules.set(loan.id, buildAmortizationSchedule(loan));
    // 初期時点（シミュレーション開始年）の残債を加算
    if (loan.startYear <= initialConditions.startYear) {
      // 既に返済が始まっている or これから始まる → 残債は principal に近い
      // 単純化: 開始年以前は principal そのまま（要件の範囲では通常 startYear >= simulation 開始）
    }
    totalInitialLoanBalance += estimateOutstandingAtStart(loan, initialConditions.startYear);
  }

  // 繰越値
  let cashSavings = initialConditions.initialCashSavings;
  let investmentBalance = scenario.investment.initialBalance;
  const warnings: SimulationWarning[] = [];
  let cashNegativeReported = false;

  const rows: YearlyResult[] = [];

  for (let i = 0; i < yearCount; i++) {
    const year = years[i]!;
    const inflationFactor = inflationFactors[i] ?? 1;

    // 1. 年齢
    const husbandAge = initialConditions.husbandAge + i;
    const wifeAge = initialConditions.wifeAge + i;
    const childrenState: ChildYearlyState[] = scenario.children.map((c) => {
      const age = childAgeInYear(c, year);
      return { id: c.id, name: c.name, age, stage: stageForAge(age) };
    });

    // 2. 収入
    const husbandIncome = computeHusbandIncome(scenario.income.husband, i, year);
    const wifeResult = computeWifeIncome(scenario.income.wife, scenario.children, year);
    const wifeIncome = wifeResult.income;
    const totalIncome = husbandIncome + wifeIncome;

    // 3. 支出カテゴリ
    const expenseByCategory = computeExpenseByCategory(
      scenario.expense.categories,
      inflationFactor,
    );
    const categoryExpenseSum = sumExpense(expenseByCategory);

    // 4. 子ども関連
    let childExpense = 0;
    let childFood = 0;
    let childMisc = 0;
    let childEducation = 0;
    for (const child of scenario.children) {
      const c = computeChildYearlyCost(child, year, inflationFactor);
      childExpense += c.total;
      childFood += c.food;
      childMisc += c.misc;
      childEducation += c.education;
    }

    // 5. ローン返済（当年分の元利合計）
    let loanRepayment = 0;
    let loanInterestPaid = 0;
    let loanPrincipalPaid = 0;
    let loanOutstandingBalance = 0;
    for (const loan of scenario.loans) {
      const schedule = loanSchedules.get(loan.id) ?? [];
      const payment = getLoanPaymentForYear(loan, schedule, year);
      loanRepayment += payment.total;
      loanInterestPaid += payment.interest;
      loanPrincipalPaid += payment.principal;
      // 年末残債
      loanOutstandingBalance += outstandingForYear(loan, schedule, year);
    }

    const totalExpense = categoryExpenseSum + childExpense + loanRepayment;

    // 6. 投資（利回り → 積立 の順）
    const invStep = stepInvestment(investmentBalance, scenario.investment, i, year);
    investmentBalance = invStep.balance;

    // 7. キャッシュ更新（積立は「預金 → 投資残高への振替」扱い）
    cashSavings = cashSavings + totalIncome - totalExpense - invStep.contribution;

    if (!cashNegativeReported && cashSavings < 0) {
      warnings.push({
        kind: 'cashNegative',
        year,
        message: `${year}年で預金残高がマイナスになります`,
      });
      cashNegativeReported = true;
    }

    const netAssets = cashSavings + investmentBalance - loanOutstandingBalance;

    rows.push({
      year,
      index: i,
      husbandAge,
      wifeAge,
      children: childrenState,
      husbandIncome: Math.round(husbandIncome),
      wifeIncome: Math.round(wifeIncome),
      totalIncome: Math.round(totalIncome),
      expenseByCategory: roundRecord(expenseByCategory),
      childExpense: Math.round(childExpense),
      childExpenseBreakdown: {
        food: Math.round(childFood),
        misc: Math.round(childMisc),
        education: Math.round(childEducation),
      },
      loanRepayment: Math.round(loanRepayment),
      loanInterestPaid: Math.round(loanInterestPaid),
      loanPrincipalPaid: Math.round(loanPrincipalPaid),
      totalExpense: Math.round(totalExpense),
      investmentContribution: Math.round(invStep.contribution),
      investmentYield: Math.round(invStep.yieldAmount),
      investmentBalance: Math.round(investmentBalance),
      loanOutstandingBalance: Math.round(loanOutstandingBalance),
      cashSavings: Math.round(cashSavings),
      netAssets: Math.round(netAssets),
      isMaternityLeaveYear: wifeResult.isMaternityLeaveYear,
    });
  }

  // totalInitialLoanBalance は内部計算上の参考値。UI で利用する場合は拡張する。
  void totalInitialLoanBalance;

  return { rows, warnings };
}

/** 開始年から end 年齢までの暦年配列（両端含む） */
export function buildYearRange(startYear: number, husbandAge: number, endAge: number): number[] {
  const count = Math.max(0, endAge - husbandAge + 1);
  const out: number[] = [];
  for (let i = 0; i < count; i++) out.push(startYear + i);
  return out;
}

/** 開始年より前はローン未発生なので残債 0 */
function estimateOutstandingAtStart(loan: {
  principal: number;
  startYear: number;
}, simulationStartYear: number): number {
  if (loan.startYear > simulationStartYear) return 0;
  return loan.principal;
}

/**
 * 指定年末時点の残債。
 * - year < startYear: 0
 * - year in [startYear, startYear + termYears - 1]: schedule[offset].outstandingBalance
 * - year >= startYear + termYears: 0
 */
function outstandingForYear(
  loan: { startYear: number; termYears: number },
  schedule: YearlyLoanPayment[],
  year: number,
): number {
  const offset = year - loan.startYear;
  if (offset < 0) return 0;
  if (offset >= schedule.length) return 0;
  return schedule[offset]?.outstandingBalance ?? 0;
}

type NumRecord<K extends string> = Record<K, number>;
function roundRecord<K extends string>(r: NumRecord<K>): NumRecord<K> {
  const out = {} as NumRecord<K>;
  for (const key of Object.keys(r) as K[]) {
    out[key] = Math.round(r[key]);
  }
  return out;
}
