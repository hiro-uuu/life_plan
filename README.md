# ライフプラン・ダッシュボード

29 歳から 65 歳までの家計資産をブラウザで可視化する、ローカル専用ダッシュボード。
シナリオは JSON で import/export でき、編集中の状態は `localStorage` に自動保存される。

## 機能

- **収入の部** — 夫（固定額昇給）・妻（産休考慮）。手取り入力 or 額面入力（税自動計算）を選択可能
- **税金・社会保険** — 額面モード時に社保・所得税（7 段階累進）・住民税を自動計算
- **住宅ローン控除** — 年末残高 × 0.7%の税額控除。住宅種別・世帯種別による借入限度額を反映
- **児童手当** — 2024 年改正後ルール（所得制限なし、第 3 子加算）で自動計算
- **固定資産税** — 評価額ベース。小規模住宅用地特例・新築減額に対応
- **退職金** — 退職所得控除（勤続年数ベース）と 1/2 課税を適用
- **支出の部** — 固定費/自動車/大物家電/食費/お小遣い/日用品/雑費/イベント（カテゴリ単位でインフレ on/off）
- **投資の部** — NISA（非課税）/課税口座を個別管理。課税口座は利益に 20.315%課税
- **負債の部** — 住宅ローンを元利均等方式で自動計算、支出に反映
- **子ども関連** — 複数人対応。出産年は妻の収入 0。教育費は公立/私立で自動設定、個別上書きも可
- **表** — 年ごとの純資産推移（sticky header）。額面モード時は税内訳列を追加表示
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

Vitest による純粋関数のユニットテスト（税計算・児童手当・固定資産税・退職金・ローン計算・収入・投資・インフレ・統合シミュレーション・v2 統合テスト・サンプル JSON の検証）。

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

- `version` は `1` または `2`（v1 はインポート時に自動で v2 へマイグレーション）
- `initialConditions.husbandAge` 開始時の夫の年齢（既定 29）
- `initialConditions.endAge` 終了時の夫の年齢（既定 65）
- `income.wife.maternityLeaveYears`
  - `1` → 出産年のみ妻の収入 0（要件どおり）
  - `2` 以上 → 出産年を含む複数年が 0
- `income.husband.annualGross` / `income.wife.annualGross` — 額面年収（gross モード用）
- `taxConfig.incomeInputMode` — `'takeHome'`（手取り）or `'gross'`（額面・税自動計算）
- `taxConfig.mortgageDeduction` — 住宅ローン控除設定（住宅種別・新築/中古・子育て世帯）
- `taxConfig.propertyTax` — 固定資産税設定（評価額・特例）
- `taxConfig.retirementBonus` — 退職金設定（金額・勤続年数）
- `investmentAccounts[]` — 複数投資口座（NISA/課税口座）
- `expense.categories.*.applyInflation` true のカテゴリのみインフレ複利が適用される
- `loans[].annualInterestRatePercent` 年利（%）。元利均等方式で月次スケジュールを生成
- `children[].educationPlan` 各ステージの `public` / `private` を指定。金額は `src/presets/educationCosts.ts` から引かれる
- `children[].educationCostOverride` ステージ単位で金額を上書きできる

## シミュレーションモデルの要点

- 年単位の離散モデル（期末時点の満年齢で近似、誕生日ベースの日数計算はしない）
- 夫の給与にはインフレを適用しない（要件どおり実質賃金の目減りを表現）
- 投資積立は「支出」ではなく「預金 → 投資残高への振替」
- 住宅ローンはボーナス返済・繰上返済に非対応（将来の拡張ポイント）
- **額面モード**: 額面年収 → 社会保険料 → 所得控除 → 所得税/住民税 → 住宅ローン控除 → 児童手当 → 手取り
- **手取りモード**: 従来どおり手取り前提（税計算なし）。v1 シナリオとの完全互換

## ディレクトリ構造

```
src/
  types/        # データモデル（Scenario, Child, Loan, Tax, ...）
  domain/       # 純粋関数: simulate/loan/income/expense/investment/inflation/child/tax/childAllowance/propertyTax/retirement
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
- 配偶者の昇給モデル、iDeCo/DC の積立
- インフレを給与にも適用する切り替え
