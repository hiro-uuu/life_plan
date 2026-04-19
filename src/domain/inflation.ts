/** インデックス i に対する複利係数 (1+rate)^i のテーブルを作る */
export function buildInflationFactors(ratePercent: number, years: number): number[] {
  const rate = ratePercent / 100;
  const factors: number[] = [];
  for (let i = 0; i < years; i++) {
    factors.push(Math.pow(1 + rate, i));
  }
  return factors;
}
