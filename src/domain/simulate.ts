import type { Scenario } from '@/types/scenario';
import type {
  SimulationOutput,
  SimulationWarning,
  YearlyResult,
  ChildYearlyState,
  InvestmentAccountResult,
} from '@/types/result';
import type { TaxBreakdown } from '@/types/tax';
import { buildInflationFactors } from './inflation';
import { computeHusbandIncome, computeWifeIncome } from './income';
import { computeExpenseByCategory, sumExpense } from './expense';
import { childAgeInYear, computeChildYearlyCost, stageForAge } from './child';
import { stepInvestment, stepInvestmentAccount } from './investment';
import { buildAmortizationSchedule, getLoanPaymentForYear } from './loan';
import { calcGrossToNet } from './tax';
import { calcChildAllowance } from './childAllowance';
import { calcPropertyTax } from './propertyTax';
import { getRetirementBonusForYear } from './retirement';
import type { YearlyLoanPayment } from '@/types/loan';

/**
 * 年次離散モデルでライフプランをシミュレーションする純粋関数。
 * 出力: 各年の YearlyResult 配列と警告。
 */
export function simulate(scenario: Scenario): SimulationOutput {
  const { initialConditions } = scenario;
  const years = buildYearRange(initialConditions.startYear, initialConditions.husbandAge, initialConditions.endAge);
  const yearCount = years.length;

  const isGrossMode = scenario.taxConfig?.incomeInputMode === 'gross';

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
    totalInitialLoanBalance += estimateOutstandingAtStart(loan, initialConditions.startYear);
  }

  // 繰越値
  let cashSavings = initialConditions.initialCashSavings;
  let investmentBalance = scenario.investment.initialBalance;
  const warnings: SimulationWarning[] = [];
  let cashNegativeReported = false;

  // 複数投資口座の残高追跡
  const accounts = scenario.investmentAccounts ?? [];
  const accountBalances = new Map<string, number>();
  for (const a of accounts) {
    accountBalances.set(a.id, a.initialBalance);
  }

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
    const childAges = childrenState.map((c) => c.age).filter((a) => a >= 0);

    // 2. ローン返済（当年分の元利合計）— 先に計算して年末残高を取得
    let loanRepayment = 0;
    let loanInterestPaid = 0;
    let loanPrincipalPaid = 0;
    let loanOutstandingBalance = 0;
    let mortgageYearEndBalance = 0;
    for (const loan of scenario.loans) {
      const schedule = loanSchedules.get(loan.id) ?? [];
      const payment = getLoanPaymentForYear(loan, schedule, year);
      loanRepayment += payment.total;
      loanInterestPaid += payment.interest;
      loanPrincipalPaid += payment.principal;
      const outstanding = outstandingForYear(loan, schedule, year);
      loanOutstandingBalance += outstanding;
      if (loan.kind === 'mortgage') {
        mortgageYearEndBalance += outstanding;
      }
    }

    // 3. 収入計算
    let husbandIncome: number;
    let wifeIncome: number;
    let totalIncome: number;
    let taxBreakdown: TaxBreakdown | undefined;
    const wifeResult = computeWifeIncome(scenario.income.wife, scenario.children, year);

    if (isGrossMode) {
      // 額面モード: 額面年収 → 税計算 → 手取り
      const husbandGross = scenario.income.husband.annualGross ?? 0;
      const wifeGross = scenario.income.wife.annualGross ?? 0;
      const husbandRaise = scenario.income.husband.annualRaiseAmount * i;
      const isHusbandRetired = scenario.income.husband.retireYear !== undefined && year >= scenario.income.husband.retireYear;
      const isWifeRetired = scenario.income.wife.retireYear !== undefined && year >= scenario.income.wife.retireYear;

      const currentHusbandGross = isHusbandRetired ? 0 : husbandGross + husbandRaise;
      const currentWifeGross = (isWifeRetired || wifeResult.isMaternityLeaveYear) ? 0 : wifeGross;

      // 夫婦それぞれの税計算
      const mortgageConfig = scenario.taxConfig!.mortgageDeduction;

      // 妻の所得が低いかどうか（配偶者控除判定）
      const wifeIsLowIncome = currentWifeGross <= 2_016_000; // 給与所得控除後103万→48万以下
      const husbandIsLowIncome = currentHusbandGross <= 2_016_000;

      const husbandNet = calcGrossToNet({
        grossSalary: currentHusbandGross,
        age: husbandAge,
        childAges,
        hasLowIncomeSpouse: wifeIsLowIncome,
        mortgageYearEndBalance,
        mortgageDeduction: mortgageConfig,
        currentYear: year,
      });

      const wifeNet = calcGrossToNet({
        grossSalary: currentWifeGross,
        age: wifeAge,
        childAges: [], // 扶養は夫で計上
        hasLowIncomeSpouse: husbandIsLowIncome,
        mortgageYearEndBalance: 0, // ローン控除は夫で計上
        mortgageDeduction: { ...mortgageConfig, enabled: false },
        currentYear: year,
      });

      husbandIncome = husbandNet.netSalary;
      wifeIncome = wifeNet.netSalary;

      // 児童手当
      const childAllowance = calcChildAllowance(scenario.children, year);

      // 固定資産税
      const propertyTax = scenario.taxConfig!.propertyTax.enabled
        ? calcPropertyTax(scenario.taxConfig!.propertyTax, year)
        : 0;

      // 退職金
      const retirementBonusNet = getRetirementBonusForYear(
        scenario.taxConfig!.retirementBonus,
        year,
      );

      taxBreakdown = {
        grossIncome: currentHusbandGross + currentWifeGross,
        socialInsurance: husbandNet.socialInsurance + wifeNet.socialInsurance,
        incomeTax: husbandNet.finalIncomeTax + wifeNet.finalIncomeTax,
        residentTax: husbandNet.finalResidentTax + wifeNet.finalResidentTax,
        mortgageDeduction: husbandNet.mortgageDeductionAmount,
        childAllowance,
        propertyTax,
        retirementBonusNet,
      };

      totalIncome = husbandIncome + wifeIncome + childAllowance + retirementBonusNet;
    } else {
      // 手取りモード: 既存ロジック（変更なし）
      husbandIncome = computeHusbandIncome(scenario.income.husband, i, year);
      wifeIncome = wifeResult.income;
      totalIncome = husbandIncome + wifeIncome;
    }

    // 4. 支出カテゴリ
    const expenseByCategory = computeExpenseByCategory(
      scenario.expense.categories,
      inflationFactor,
    );
    const categoryExpenseSum = sumExpense(expenseByCategory);

    // 5. 子ども関連
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

    // 6. 固定資産税（支出に加算、grossモードのみ）
    const propertyTaxExpense = isGrossMode && taxBreakdown ? taxBreakdown.propertyTax : 0;

    const totalExpense = categoryExpenseSum + childExpense + loanRepayment + propertyTaxExpense;

    // 7. 投資
    let investmentContribution = 0;
    let investmentYield = 0;
    let investmentAccountResults: InvestmentAccountResult[] | undefined;

    if (accounts.length > 0) {
      // 複数口座モード
      investmentAccountResults = [];
      for (const account of accounts) {
        const prevBal = accountBalances.get(account.id) ?? 0;
        const step = stepInvestmentAccount(prevBal, account, i, year);
        accountBalances.set(account.id, step.balance);
        investmentContribution += step.contribution;
        investmentYield += step.yieldAmount;
        investmentAccountResults.push({
          id: step.id,
          name: step.name,
          accountType: step.accountType,
          contribution: Math.round(step.contribution),
          yieldAmount: Math.round(step.yieldAmount),
          tax: Math.round(step.tax),
          balance: Math.round(step.balance),
        });
      }
      investmentBalance = Array.from(accountBalances.values()).reduce((a, b) => a + b, 0);
    } else {
      // 単一口座モード（v1互換）
      const invStep = stepInvestment(investmentBalance, scenario.investment, i, year);
      investmentBalance = invStep.balance;
      investmentContribution = invStep.contribution;
      investmentYield = invStep.yieldAmount;
    }

    // 8. キャッシュ更新（積立は「預金 → 投資残高への振替」扱い）
    cashSavings = cashSavings + totalIncome - totalExpense - investmentContribution;

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
      taxBreakdown: taxBreakdown
        ? {
            grossIncome: Math.round(taxBreakdown.grossIncome),
            socialInsurance: Math.round(taxBreakdown.socialInsurance),
            incomeTax: Math.round(taxBreakdown.incomeTax),
            residentTax: Math.round(taxBreakdown.residentTax),
            mortgageDeduction: Math.round(taxBreakdown.mortgageDeduction),
            childAllowance: Math.round(taxBreakdown.childAllowance),
            propertyTax: Math.round(taxBreakdown.propertyTax),
            retirementBonusNet: Math.round(taxBreakdown.retirementBonusNet),
          }
        : undefined,
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
      investmentContribution: Math.round(investmentContribution),
      investmentYield: Math.round(investmentYield),
      investmentBalance: Math.round(investmentBalance),
      investmentAccounts: investmentAccountResults,
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
