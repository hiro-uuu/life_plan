import { useState } from 'react';
import { TabBar, type Tab } from '@/components/common/TabBar';
import { BasicTab } from './BasicTab';
import { IncomeTab } from './IncomeTab';
import { ExpenseTab } from './ExpenseTab';
import { InvestmentTab } from './InvestmentTab';
import { LoanTab } from './LoanTab';
import { ChildrenTab } from './ChildrenTab';
import { TaxTab } from './TaxTab';

type TabKey = 'basic' | 'income' | 'expense' | 'investment' | 'loan' | 'children' | 'tax';

const TABS: readonly Tab<TabKey>[] = [
  { key: 'basic', label: '基本' },
  { key: 'income', label: '収入' },
  { key: 'expense', label: '支出' },
  { key: 'investment', label: '投資' },
  { key: 'loan', label: '負債' },
  { key: 'children', label: '子ども' },
  { key: 'tax', label: '税金' },
];

export function ConditionForm() {
  const [active, setActive] = useState<TabKey>('basic');
  return (
    <div>
      <TabBar tabs={TABS} active={active} onChange={setActive} />
      {active === 'basic' && <BasicTab />}
      {active === 'income' && <IncomeTab />}
      {active === 'expense' && <ExpenseTab />}
      {active === 'investment' && <InvestmentTab />}
      {active === 'loan' && <LoanTab />}
      {active === 'children' && <ChildrenTab />}
      {active === 'tax' && <TaxTab />}
    </div>
  );
}
