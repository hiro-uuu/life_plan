import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { importScenarioFromText } from '@/io/importScenario';
import { simulate } from '@/domain/simulate';

describe('sample scenario', () => {
  const path = resolve(__dirname, '../../public/scenarios/sample-default.json');
  const text = readFileSync(path, 'utf8');

  it('passes validation', () => {
    const result = importScenarioFromText(text);
    if (!result.ok) {
      // 失敗時に詳細出力
      // eslint-disable-next-line no-console
      console.error(result.errors, result.parseError);
    }
    expect(result.ok).toBe(true);
    expect(result.scenario).toBeDefined();
  });

  it('simulates without runtime errors and produces 37 rows', () => {
    const result = importScenarioFromText(text);
    expect(result.ok).toBe(true);
    if (!result.scenario) throw new Error('no scenario');
    const out = simulate(result.scenario);
    expect(out.rows).toHaveLength(37);
    // netAssets が整合
    for (const r of out.rows) {
      const expected = r.cashSavings + r.investmentBalance - r.loanOutstandingBalance;
      expect(Math.abs(r.netAssets - expected)).toBeLessThanOrEqual(1);
    }
  });
});
