import { useRef, useState } from 'react';
import { useScenario } from '@/state/ScenarioContext';
import { Button } from '@/components/common/Button';
import { exportScenarioAsDownload } from '@/io/exportScenario';
import { importScenarioFromFile, importScenarioFromText } from '@/io/importScenario';
import { createDefaultScenario } from '@/presets/defaultScenario';
import { clearPersistedScenario } from '@/hooks/useLocalStoragePersist';
import type { SimulationWarning } from '@/types/result';
import styles from './AppHeader.module.css';

interface Props {
  warnings: SimulationWarning[];
}

export function AppHeader({ warnings }: Props) {
  const { scenario, dispatch, hadRestored } = useScenario();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const result = await importScenarioFromFile(f);
    if (result.ok && result.scenario) {
      dispatch({ type: 'SET_SCENARIO', scenario: result.scenario });
      setStatus(`読み込み成功: ${result.scenario.name}`);
    } else if (result.parseError) {
      setStatus(`JSON 解析失敗: ${result.parseError}`);
    } else if (result.errors) {
      setStatus(
        `バリデーション失敗: ${result.errors
          .slice(0, 3)
          .map((x) => `${x.path}: ${x.message}`)
          .join(' / ')}${result.errors.length > 3 ? ' ...' : ''}`,
      );
    }
    e.target.value = '';
  };

  const handleSample = async () => {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}scenarios/sample-default.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const result = importScenarioFromText(text);
      if (result.ok && result.scenario) {
        dispatch({ type: 'SET_SCENARIO', scenario: result.scenario });
        setStatus(`サンプル読込: ${result.scenario.name}`);
      } else {
        setStatus('サンプル読込に失敗しました');
      }
    } catch (e) {
      setStatus(`サンプル読込エラー: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleReset = () => {
    if (!window.confirm('現在の編集内容を破棄して新規シナリオに戻しますか？')) return;
    clearPersistedScenario();
    dispatch({ type: 'SET_SCENARIO', scenario: createDefaultScenario() });
    setStatus('新規シナリオを開始しました');
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>ライフプラン</h1>
          <span className={styles.subtitle}>家計資産シミュレーション</span>
        </div>
        <label className={styles.nameField}>
          シナリオ名
          <input
            value={scenario.name}
            onChange={(e) => dispatch({ type: 'SET_NAME', name: e.target.value })}
          />
        </label>
        {hadRestored && <span className={styles.restored}>編集中（ローカル保存あり）</span>}
      </div>

      <div className={styles.right}>
        {warnings.length > 0 && (
          <span className={styles.warning} title={warnings.map((w) => w.message).join('\n')}>
            ⚠ {warnings[0]!.message}
          </span>
        )}
        <Button onClick={handleSample}>サンプル読込</Button>
        <Button onClick={() => fileRef.current?.click()}>インポート</Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={handleImport}
        />
        <Button variant="primary" onClick={() => exportScenarioAsDownload(scenario)}>
          エクスポート
        </Button>
        <Button variant="danger" onClick={handleReset}>
          新規
        </Button>
      </div>

      {status && (
        <div className={styles.status} role="status">
          {status}
        </div>
      )}
    </header>
  );
}
