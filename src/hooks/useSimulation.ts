import { useMemo } from 'react';
import type { Scenario } from '@/types/scenario';
import { simulate } from '@/domain/simulate';
import type { SimulationOutput } from '@/types/result';

export function useSimulation(scenario: Scenario): SimulationOutput {
  return useMemo(() => simulate(scenario), [scenario]);
}
