import {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useEffect,
  useState,
  type ReactNode,
  type Dispatch,
} from 'react';
import type { Scenario } from '@/types/scenario';
import { scenarioReducer, type ScenarioAction } from './scenarioReducer';
import { createDefaultScenario } from '@/presets/defaultScenario';
import { loadPersistedScenario, usePersistScenario } from '@/hooks/useLocalStoragePersist';

interface ScenarioContextValue {
  scenario: Scenario;
  dispatch: Dispatch<ScenarioAction>;
  hadRestored: boolean;
}

const ScenarioContext = createContext<ScenarioContextValue | undefined>(undefined);

export function ScenarioProvider({ children }: { children: ReactNode }) {
  // 初回マウント時のみ localStorage を参照（SSR 無しのローカル前提）
  const [initial, restored] = useMemo<[Scenario, boolean]>(() => {
    const p = loadPersistedScenario();
    if (p) return [p, true];
    return [createDefaultScenario(), false];
  }, []);
  const [scenario, dispatch] = useReducer(scenarioReducer, initial);
  const [hadRestored, setHadRestored] = useState(restored);

  usePersistScenario(scenario);

  // インポート等で SET_SCENARIO が走ったら「復元」バッジは消す
  useEffect(() => {
    if (scenario !== initial) setHadRestored(false);
  }, [scenario, initial]);

  const value = useMemo(
    () => ({ scenario, dispatch, hadRestored }),
    [scenario, dispatch, hadRestored],
  );

  return <ScenarioContext.Provider value={value}>{children}</ScenarioContext.Provider>;
}

export function useScenario(): ScenarioContextValue {
  const ctx = useContext(ScenarioContext);
  if (!ctx) throw new Error('useScenario must be used within ScenarioProvider');
  return ctx;
}
