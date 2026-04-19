import type { Scenario } from '@/types/scenario';

/** yyyyMMddHHmm を返す */
function timestampSlug(d = new Date()): string {
  const pad = (n: number): string => String(n).padStart(2, '0');
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes())
  );
}

/** ブラウザでシナリオを JSON としてダウンロード */
export function exportScenarioAsDownload(scenario: Scenario): void {
  const json = JSON.stringify(scenario, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = (scenario.name || 'scenario').replace(/[^\w\-一-龠ぁ-んァ-ヶ]/g, '_');
  a.href = url;
  a.download = `${safeName}-${timestampSlug()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
