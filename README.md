# ライフプラン・ダッシュボード

29 歳から 65 歳までの家計資産をブラウザで可視化する、ローカル専用ダッシュボード。
シナリオは JSON で import/export でき、編集中の状態は `localStorage` に自動保存される。

## 機能

- **収入の部** — 夫（固定額昇給）・妻（産休考慮）の手取り年収
- **支出の部** — 固定費/自動車/大物家電/食費/お小遣い/日用品/雑費/イベント（カテゴリ単位でインフレ on/off）
- **投資の部** — NISA 等の複利シミュレーション（初期残高・積立・年利・積立停止年）
- **負債の部** — 住宅ローンを元利均等方式で自動計算、支出に反映
- **子ども関連** — 複数人対応。出産年は妻の収入 0。教育費は公立/私立で自動設定、個別上書きも可
- **表** — 年ごとの純資産推移（sticky header）。産休年はハイライト
- **グラフ** — 資産積層エリア、収入/支出ライン、負債残高ライン
- **JSON I/O** — エクスポート（ダウンロード）、インポート（ファイル）、サンプル読込、localStorage 自動保存

## 前提

- Node.js 18 以上
- ブラウザでローカルにのみ動かす用途

## セットアップ

```bash
npm install
```

## 開発サーバ

```bash
npm run dev
```

ブラウザで `http://localhost:5173` を開く。

## テスト

```bash
npm test
```

Vitest による純粋関数のユニットテスト（ローン計算、収入、投資、インフレ、統合シミュレーション、サンプル JSON の検証）。

## 本番ビルド

```bash
npm run build
npm run preview
```

## シナリオ JSON

- 起動時にサンプルを読み込みたい場合は、ヘッダの **「サンプル読込」** を押すと `public/scenarios/sample-default.json` がロードされる。
- 新しいシナリオを追加したい場合は、任意の JSON を `public/scenarios/` に置いて、アプリ上で「インポート」から読み込む（サンプルボタンは `sample-default.json` 固定）。
- エクスポートすると `<シナリオ名>-<yyyyMMddHHmm>.json` がダウンロードされる。

### JSON スキーマ

- `version` は常に `1`
- `initialConditions.husbandAge` 開始時の夫の年齢（既定 29）
- `initialConditions.endAge` 終了時の夫の年齢（既定 65）
- `income.wife.maternityLeaveYears`
  - `1` → 出産年のみ妻の収入 0（要件どおり）
  - `2` 以上 → 出産年を含む複数年が 0
- `expense.categories.*.applyInflation` true のカテゴリのみインフレ複利が適用される
- `loans[].annualInterestRatePercent` 年利（%）。元利均等方式で月次スケジュールを生成
- `children[].educationPlan` 各ステージの `public` / `private` を指定。金額は `src/presets/educationCosts.ts` から引かれる
- `children[].educationCostOverride` ステージ単位で金額を上書きできる

## シミュレーションモデルの要点

- 年単位の離散モデル（期末時点の満年齢で近似、誕生日ベースの日数計算はしない）
- 夫の給与にはインフレを適用しない（要件どおり実質賃金の目減りを表現）
- 投資積立は「支出」ではなく「預金 → 投資残高への振替」
- 住宅ローンはボーナス返済・繰上返済に非対応（将来の拡張ポイント）
- 税金は手取り前提（税計算なし）

## ディレクトリ構造

```
src/
  types/        # データモデル（Scenario, Child, Loan, ...）
  domain/       # 純粋関数: simulate/loan/income/expense/investment/inflation/child
  presets/      # 教育費プリセット、デフォルトシナリオ
  io/           # JSON import/export/validate/migrate
  state/        # Context + useReducer
  hooks/        # useSimulation, useLocalStoragePersist
  components/   # layout/form/table/charts/common
  utils/        # 日本円フォーマッタ等
  __tests__/    # Vitest
public/
  scenarios/    # サンプル JSON
```

## 拡張アイデア

- 複数シナリオの同時比較
- 繰上返済／ボーナス返済
- 税金・社会保険の自動計算（手取り計算）
- 配偶者の昇給モデル、iDeCo/DC の積立
- インフレを給与にも適用する切り替え
