import { ScenarioProvider, useScenario } from '@/state/ScenarioContext';
import { useSimulation } from '@/hooks/useSimulation';
import { AppLayout } from '@/components/layout/AppLayout';
import { AppHeader } from '@/components/layout/AppHeader';
import { ConditionForm } from '@/components/form/ConditionForm';
import { ResultsTable } from '@/components/table/ResultsTable';
import { AssetStackedAreaChart } from '@/components/charts/AssetStackedAreaChart';
import { IncomeExpenseLineChart } from '@/components/charts/IncomeExpenseLineChart';
import { DebtLineChart } from '@/components/charts/DebtLineChart';

function Dashboard() {
  const { scenario } = useScenario();
  const { rows, warnings } = useSimulation(scenario);

  return (
    <AppLayout
      header={<AppHeader warnings={warnings} />}
      form={<ConditionForm />}
      table={<ResultsTable rows={rows} />}
      charts={
        <>
          <AssetStackedAreaChart rows={rows} />
          <IncomeExpenseLineChart rows={rows} />
          <DebtLineChart rows={rows} />
        </>
      }
    />
  );
}

export default function App() {
  return (
    <ScenarioProvider>
      <Dashboard />
    </ScenarioProvider>
  );
}
