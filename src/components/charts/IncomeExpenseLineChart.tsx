import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
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

export function IncomeExpenseLineChart({ rows }: Props) {
  const data = rows.map((r) => ({
    year: r.year,
    income: r.totalIncome,
    expense: r.totalExpense,
  }));
  return (
    <Section title="収入と支出">
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
              formatter={(v, name) => [
                manYen(toNumber(v)),
                String(name) === 'income' ? '収入' : '支出',
              ]}
              labelFormatter={(l) => `${l}年`}
            />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              formatter={(name) => (String(name) === 'income' ? '収入' : '支出')}
            />
            <Line
              type="monotone"
              dataKey="income"
              stroke="var(--chart-income)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="expense"
              stroke="var(--chart-expense)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Section>
  );
}
