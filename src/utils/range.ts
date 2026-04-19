export function range(start: number, endExclusive: number): number[] {
  const out: number[] = [];
  for (let i = start; i < endExclusive; i++) out.push(i);
  return out;
}
