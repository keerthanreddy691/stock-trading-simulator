import React from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 mb-0.5">{label}</p>
      <p className="font-bold text-white">${Number(payload[0].value).toFixed(2)}</p>
    </div>
  );
};

const StockChart = ({ data = [], color = '#6366f1', height = 180 }) => {
  const isUp = data.length >= 2 && data[data.length - 1].price >= data[0].price;
  const lineColor = color || (isUp ? '#10b981' : '#ef4444');

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${lineColor.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={lineColor} stopOpacity={0.25} />
            <stop offset="95%" stopColor={lineColor} stopOpacity={0}    />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis
          domain={['auto', 'auto']}
          tick={{ fill: '#64748b', fontSize: 10 }}
          tickLine={false} axisLine={false}
          tickFormatter={(v) => `$${v}`}
          width={52}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone" dataKey="price"
          stroke={lineColor} strokeWidth={2}
          fill={`url(#grad-${lineColor.replace('#', '')})`}
          dot={false} activeDot={{ r: 4, fill: lineColor, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default StockChart;
