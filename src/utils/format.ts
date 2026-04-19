const jpYen = new Intl.NumberFormat('ja-JP');
const jpYenSigned = new Intl.NumberFormat('ja-JP', { signDisplay: 'auto' });

/** 円表記。負値はそのまま "-" 付き */
export function yen(value: number): string {
  return `¥${jpYen.format(Math.round(value))}`;
}

/** 万円単位の表示（表でスペースを節約したい時に使う） */
export function manYen(value: number): string {
  const man = value / 10_000;
  return `${jpYenSigned.format(Math.round(man))}万`;
}

/** 素の数値フォーマット（通貨記号なし） */
export function numberJP(value: number): string {
  return jpYen.format(Math.round(value));
}

/** 小数1桁のパーセント */
export function percent(value: number): string {
  return `${value.toFixed(1)}%`;
}
