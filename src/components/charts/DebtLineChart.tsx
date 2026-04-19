import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { YearlyResult } from '@/types/result';
import { Section } from '@/components/common/Section';
import { manYen } from '@/utils/format';

interface Props {
  rows: YearlyResult[];
}

const TOOLTIP_STYLE = {
  background: '#1e2733',
  border: '1px solid #3a4654',
  borderRadius: 4,
  fontSize: 12,
  color: '#e6edf3',
};

function toNumber(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function DebtLineChart({ rows }: Props) {
  const data = rows.map((r) => ({ year: r.year, debt: r.loanOutstandingBalance }));
  const hasDebt = rows.some((r) => r.loanOutstandingBalance > 0);
  return (
    <Section title="負債残高">
      {!hasDebt ? (
        <p style={{ color: 'var(--text-dim)', fontSize: 12, margin: 0 }}>
          負債はありません
        </p>
      ) : (
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid stroke="#2a3440" strokeDasharray="3 3" />
              <XAxis dataKey="year" stroke="#9ba6b3" fontSize={11} />
              <YAxis
                stroke="#9ba6b3"
                fontSize={11}
                tickFormatter={(v: number) => manYen(v)}
                width={80}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v) => [manYen(toNumber(v)), '負債残高']}
                labelFormatter={(l) => `${l}年`}
              />
              <Line
                type="monotone"
                dataKey="debt"
                stroke="var(--chart-debt)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Section>
  );
}
