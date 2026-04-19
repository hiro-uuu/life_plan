import type { Scenario } from '@/types/scenario';
import type { ExpenseCategoryKey, ExpenseItem } from '@/types/expense';
import type { Child } from '@/types/child';
import type { Loan } from '@/types/loan';
import type { HusbandSalary, WifeSalary } from '@/types/income';
import type { InvestmentConfig, InvestmentAccount } from '@/types/investment';
import type { InitialConditions } from '@/types/scenario';
import type {
  TaxConfig,
  MortgageDeductionConfig,
  PropertyTaxConfig,
  RetirementBonusConfig,
  IncomeInputMode,
} from '@/types/tax';

export type ScenarioAction =
  | { type: 'SET_SCENARIO'; scenario: Scenario }
  | { type: 'RESET' }
  | { type: 'SET_NAME'; name: string }
  | { type: 'UPDATE_INITIAL'; patch: Partial<InitialConditions> }
  | { type: 'UPDATE_HUSBAND'; patch: Partial<HusbandSalary> }
  | { type: 'UPDATE_WIFE'; patch: Partial<WifeSalary> }
  | {
      type: 'UPDATE_EXPENSE_CATEGORY';
      key: ExpenseCategoryKey;
      patch: Partial<ExpenseItem>;
    }
  | { type: 'UPDATE_INVESTMENT'; patch: Partial<InvestmentConfig> }
  | { type: 'ADD_LOAN'; loan: Loan }
  | { type: 'UPDATE_LOAN'; id: string; patch: Partial<Loan> }
  | { type: 'REMOVE_LOAN'; id: string }
  | { type: 'ADD_CHILD'; child: Child }
  | { type: 'UPDATE_CHILD'; id: string; patch: Partial<Child> }
  | { type: 'REMOVE_CHILD'; id: string }
  // v2: 税金関連アクション
  | { type: 'SET_INCOME_INPUT_MODE'; mode: IncomeInputMode }
  | { type: 'UPDATE_MORTGAGE_DEDUCTION'; patch: Partial<MortgageDeductionConfig> }
  | { type: 'UPDATE_PROPERTY_TAX'; patch: Partial<PropertyTaxConfig> }
  | { type: 'UPDATE_RETIREMENT_BONUS'; patch: Partial<RetirementBonusConfig> }
  // v2: 投資口座
  | { type: 'ADD_INVESTMENT_ACCOUNT'; account: InvestmentAccount }
  | { type: 'UPDATE_INVESTMENT_ACCOUNT'; id: string; patch: Partial<InvestmentAccount> }
  | { type: 'REMOVE_INVESTMENT_ACCOUNT'; id: string };

function ensureTaxConfig(state: Scenario): TaxConfig {
  return state.taxConfig ?? {
    incomeInputMode: 'takeHome',
    mortgageDeduction: {
      enabled: false,
      housingType: 'certified',
      housingAgeType: 'new',
      isChildRaisingHousehold: false,
      moveInYear: state.initialConditions.startYear,
    },
    propertyTax: {
      enabled: false,
      landAssessedValue: 0,
      buildingAssessedValue: 0,
      isSmallResidentialLand: true,
      isNewConstruction: false,
      isLongLifeHousing: false,
      constructionYear: state.initialConditions.startYear,
    },
    retirementBonus: {
      enabled: false,
      amount: 0,
      retireYear: state.initialConditions.startYear + 30,
      yearsOfService: 30,
    },
  };
}

export function scenarioReducer(state: Scenario, action: ScenarioAction): Scenario {
  const touchedAt = new Date().toISOString();
  const withTouch = (s: Scenario): Scenario => ({ ...s, updatedAt: touchedAt });

  switch (action.type) {
    case 'SET_SCENARIO':
      return action.scenario;
    case 'RESET':
      return state;
    case 'SET_NAME':
      return withTouch({ ...state, name: action.name });
    case 'UPDATE_INITIAL':
      return withTouch({
        ...state,
        initialConditions: { ...state.initialConditions, ...action.patch },
      });
    case 'UPDATE_HUSBAND':
      return withTouch({
        ...state,
        income: {
          ...state.income,
          husband: { ...state.income.husband, ...action.patch },
        },
      });
    case 'UPDATE_WIFE':
      return withTouch({
        ...state,
        income: {
          ...state.income,
          wife: { ...state.income.wife, ...action.patch },
        },
      });
    case 'UPDATE_EXPENSE_CATEGORY':
      return withTouch({
        ...state,
        expense: {
          categories: {
            ...state.expense.categories,
            [action.key]: { ...state.expense.categories[action.key], ...action.patch },
          },
        },
      });
    case 'UPDATE_INVESTMENT':
      return withTouch({ ...state, investment: { ...state.investment, ...action.patch } });
    case 'ADD_LOAN':
      return withTouch({ ...state, loans: [...state.loans, action.loan] });
    case 'UPDATE_LOAN':
      return withTouch({
        ...state,
        loans: state.loans.map((l) => (l.id === action.id ? { ...l, ...action.patch } : l)),
      });
    case 'REMOVE_LOAN':
      return withTouch({ ...state, loans: state.loans.filter((l) => l.id !== action.id) });
    case 'ADD_CHILD':
      return withTouch({ ...state, children: [...state.children, action.child] });
    case 'UPDATE_CHILD':
      return withTouch({
        ...state,
        children: state.children.map((c) =>
          c.id === action.id ? { ...c, ...action.patch } : c,
        ),
      });
    case 'REMOVE_CHILD':
      return withTouch({ ...state, children: state.children.filter((c) => c.id !== action.id) });

    // v2: 税金アクション
    case 'SET_INCOME_INPUT_MODE': {
      const tc = ensureTaxConfig(state);
      return withTouch({
        ...state,
        taxConfig: { ...tc, incomeInputMode: action.mode },
      });
    }
    case 'UPDATE_MORTGAGE_DEDUCTION': {
      const tc = ensureTaxConfig(state);
      return withTouch({
        ...state,
        taxConfig: {
          ...tc,
          mortgageDeduction: { ...tc.mortgageDeduction, ...action.patch },
        },
      });
    }
    case 'UPDATE_PROPERTY_TAX': {
      const tc = ensureTaxConfig(state);
      return withTouch({
        ...state,
        taxConfig: {
          ...tc,
          propertyTax: { ...tc.propertyTax, ...action.patch },
        },
      });
    }
    case 'UPDATE_RETIREMENT_BONUS': {
      const tc = ensureTaxConfig(state);
      return withTouch({
        ...state,
        taxConfig: {
          ...tc,
          retirementBonus: { ...tc.retirementBonus, ...action.patch },
        },
      });
    }

    // v2: 投資口座
    case 'ADD_INVESTMENT_ACCOUNT':
      return withTouch({
        ...state,
        investmentAccounts: [...(state.investmentAccounts ?? []), action.account],
      });
    case 'UPDATE_INVESTMENT_ACCOUNT':
      return withTouch({
        ...state,
        investmentAccounts: (state.investmentAccounts ?? []).map((a) =>
          a.id === action.id ? { ...a, ...action.patch } : a,
        ),
      });
    case 'REMOVE_INVESTMENT_ACCOUNT':
      return withTouch({
        ...state,
        investmentAccounts: (state.investmentAccounts ?? []).filter((a) => a.id !== action.id),
      });
  }
}
