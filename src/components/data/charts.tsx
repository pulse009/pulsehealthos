'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

/**
 * Charts.
 *
 * A small, fixed categorical palette rather than per-chart colours, so a series
 * means the same thing everywhere. Values are integers (counts), so axes are
 * pinned to whole numbers — a "2.5 bookings" tick would be nonsense.
 */

const SERIES = {
  leads: 'oklch(0.62 0.17 253)',
  bookings: 'oklch(0.68 0.15 162)',
} as const;

const CATEGORICAL = [
  'oklch(0.62 0.17 253)',
  'oklch(0.68 0.15 162)',
  'oklch(0.75 0.15 85)',
  'oklch(0.63 0.2 25)',
  'oklch(0.6 0.13 300)',
  'oklch(0.7 0.05 250)',
];

const AXIS = { fontSize: 11, fill: 'var(--text-subtle)' } as const;

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '0.5rem',
  fontSize: '12px',
  color: 'var(--text)',
} as const;

/** "2026-03-04" → "4 Mar" */
function shortDate(value: string): string {
  const [, month, day] = value.split('-');
  if (!month || !day) return value;
  const names = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${Number(day)} ${names[Number(month)] ?? ''}`;
}

export function TrendChart({
  data,
}: {
  data: Array<{ date: string; leads: number; bookings: number }>;
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id="fillLeads" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={SERIES.leads} stopOpacity={0.3} />
              <stop offset="95%" stopColor={SERIES.leads} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="fillBookings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={SERIES.bookings} stopOpacity={0.3} />
              <stop offset="95%" stopColor={SERIES.bookings} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tick={AXIS}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={shortDate} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area
            type="monotone"
            dataKey="leads"
            name="Leads"
            stroke={SERIES.leads}
            fill="url(#fillLeads)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="bookings"
            name="Bookings"
            stroke={SERIES.bookings}
            fill="url(#fillBookings)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusBreakdownChart({ data }: { data: Array<{ name: string; value: number }> }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="text-muted flex h-64 items-center justify-center text-sm">
        No appointments yet.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data.filter((d) => d.value > 0)}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
          >
            {data
              .filter((d) => d.value > 0)
              .map((entry, index) => (
                <Cell key={entry.name} fill={CATEGORICAL[index % CATEGORICAL.length]} />
              ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FunnelChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="name" tick={AXIS} tickLine={false} axisLine={false} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'var(--surface-muted)' }} />
          <Bar dataKey="value" name="Leads" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={CATEGORICAL[index % CATEGORICAL.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
