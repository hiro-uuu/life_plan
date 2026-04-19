import type { Scenario } from '@/types/scenario';

/**
 * version フィールドに応じて最新形式へ変換する。
 * 現状は v1 のみ。将来 v2 以降を追加する際はここに switch 分岐を足す。
 */
export function migrateScenario(input: unknown): unknown {
  if (typeof input !== 'object' || input === null) return input;
  const obj = input as Record<string, unknown>;
  const version = obj.version;
  switch (version) {
    case 1:
      return obj as unknown as Scenario;
    default:
      // 未知のバージョンはそのまま通す（バリデーションで弾く）
      return obj;
  }
}
