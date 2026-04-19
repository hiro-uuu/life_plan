import type { Scenario } from '@/types/scenario';
import type { ExpenseCategoryKey, ExpenseItem } from '@/types/expense';
import type { Child } from '@/types/child';
import type { Loan } from '@/types/loan';
import type { HusbandSalary, WifeSalary } from '@/types/income';
import type { InvestmentConfig } from '@/types/investment';
import type { InitialConditions } from '@/types/scenario';

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
  | { type: 'REMOVE_CHILD'; id: string };

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
  }
}
