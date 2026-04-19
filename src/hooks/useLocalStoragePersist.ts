import { useEffect, useRef } from 'react';
import type { Scenario } from '@/types/scenario';
import { validateScenario } from '@/io/validate';
import { migrateScenario } from '@/io/migrate';

const KEY = 'life-plan:last-scenario';

/** scenario の変化を localStorage に保存するフック */
export function usePersistScenario(scenario: Scenario): void {
  const firstRun = useRef(true);
  useEffect(() => {
    // 初回の hydration 直後は念のため即保存しておく
    try {
      localStorage.setItem(KEY, JSON.stringify(scenario));
    } catch {
      // quota 超過などは無視
    }
    firstRun.current = false;
  }, [scenario]);
}

/** 起動時に localStorage から復元する。なければ undefined */
export function loadPersistedScenario(): Scenario | undefined {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return undefined;
    const parsed: unknown = JSON.parse(raw);
    const migrated = migrateScenario(parsed);
    const result = validateScenario(migrated);
    return result.ok ? result.data : undefined;
  } catch {
    return undefined;
  }
}

export function clearPersistedScenario(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // noop
  }
}
