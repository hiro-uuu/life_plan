import type { Scenario } from '@/types/scenario';
import { migrateScenario } from './migrate';
import { validateScenario, type ValidationError } from './validate';

export interface ImportResult {
  ok: boolean;
  scenario?: Scenario;
  errors?: ValidationError[];
  /** JSON.parse 失敗時のメッセージ */
  parseError?: string;
}

export async function importScenarioFromFile(file: File): Promise<ImportResult> {
  const text = await file.text();
  return importScenarioFromText(text);
}

export function importScenarioFromText(text: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return { ok: false, parseError: e instanceof Error ? e.message : String(e) };
  }
  const migrated = migrateScenario(parsed);
  const result = validateScenario(migrated);
  if (!result.ok || !result.data) {
    return { ok: false, errors: result.errors };
  }
  return { ok: true, scenario: result.data };
}
