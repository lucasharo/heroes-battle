import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { buildMatchDamageComparison } from '../game/physics';

interface MatchDamageChartProps {
  damageDealt: number;
  damageTaken: number;
  isVictory: boolean;
}

const formatCompactNumber = (value: number): string => {
  if (value >= 1000) {
    const compact = value / 1000;
    return `${Number.isInteger(compact) ? compact : compact.toFixed(1)}k`;
  }
  return String(Math.round(value));
};

export const MatchDamageChart: React.FC<MatchDamageChartProps> = ({
  damageDealt,
  damageTaken,
  isVictory,
}) => {
  const comparison = buildMatchDamageComparison(damageDealt, damageTaken);
  const maxVal = Math.max(comparison.dealt, comparison.taken, 100);
  const yDomainMax = Math.ceil((maxVal * 1.24) / 100) * 100;

  return (
    <div
      data-testid="gameover-damage-chart"
      className={`rounded-xl border px-3.5 pt-2.5 pb-2 ${
        isVictory
          ? 'border-amber-500/35 bg-slate-950/75'
          : 'border-slate-800 bg-slate-950/60'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Dano Causado × Sofrido
        </span>
        <span
          className={`text-[11px] font-extrabold font-mono-num ${
            comparison.netDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          Saldo: {comparison.netDiff >= 0 ? `+${comparison.netDiff}` : comparison.netDiff}
        </span>
      </div>

      <div className="w-full h-[116px]">
        <ResponsiveContainer width="100%" height={116} minWidth={200}>
          <BarChart
            data={comparison.bars}
            margin={{ top: 18, right: 12, left: -14, bottom: 0 }}
            barCategoryGap="28%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="rgba(148, 163, 184, 0.14)"
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#cbd5e1', fontSize: 11, fontWeight: 700 }}
            />
            <YAxis
              domain={[0, yDomainMax]}
              axisLine={false}
              tickLine={false}
              width={44}
              tickFormatter={formatCompactNumber}
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '0.5rem',
                fontSize: '12px',
                color: '#f8fafc',
                padding: '6px 10px',
              }}
              labelStyle={{ color: '#94a3b8', fontWeight: 700, marginBottom: '2px' }}
              formatter={(val) => [
                `${Number(val ?? 0).toLocaleString('pt-BR')} de dano`,
                'Total',
              ]}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56} isAnimationActive={false}>
              {comparison.bars.map((entry) => (
                <Cell key={entry.key} fill={entry.fill} />
              ))}
              <LabelList
                dataKey="value"
                position="top"
                fill="#e2e8f0"
                fontSize={11}
                fontWeight={800}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
