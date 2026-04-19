import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
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

export function AssetStackedAreaChart({ rows }: Props) {
  const data = rows.map((r) => ({
    year: r.year,
    cash: Math.max(0, r.cashSavings),
    invest: r.investmentBalance,
    debt: -r.loanOutstandingBalance,
    netAssets: r.netAssets,
  }));
  return (
    <Section title="資産推移（預金・投資・負債）">
      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid stroke="#2a3440" strokeDasharray="3 3" />
            <XAxis dataKey="year" stroke="#9ba6b3" fontSize={11} />
            <YAxis
              stroke="#9ba6b3"
              fontSize={11}
              tickFormatter={(v: number) => manYen(v)}
              width={80}
            />
            <ReferenceLine y={0} stroke="#6b7685" />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value, name) => [manYen(toNumber(value)), labelOf(String(name))]}
              labelFormatter={(label) => `${label}年`}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} formatter={(name) => labelOf(String(name))} />
            <Area
              type="monotone"
              dataKey="cash"
              stackId="1"
              stroke="var(--chart-cash)"
              fill="var(--chart-cash)"
              fillOpacity={0.35}
            />
            <Area
              type="monotone"
              dataKey="invest"
              stackId="1"
              stroke="var(--chart-invest)"
              fill="var(--chart-invest)"
              fillOpacity={0.35}
            />
            <Area
              type="monotone"
              dataKey="debt"
              stackId="2"
              stroke="var(--chart-debt)"
              fill="var(--chart-debt)"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Section>
  );
}

function toNumber(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function labelOf(key: string): string {
  switch (key) {
    case 'cash':
      return '預金';
    case 'invest':
      return '投資';
    case 'debt':
      return '負債';
    case 'netAssets':
      return '純資産';
    default:
      return key;
  }
}
