import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Info,
  HelpCircle,
  X
} from 'lucide-react';
import {
  ComposedChart, Area, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceArea, ReferenceLine
} from 'recharts';

const ViolationTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;
  return (
    <div className="bg-white border border-[#d1fae5] rounded-xl px-4 py-3 shadow-lg">
      <p className="text-[13px] font-black text-[#003624] mb-2">{data?.full_date || label}</p>
      <div className="flex flex-col gap-1">
        <p className="text-[12px] text-[#10b981] font-bold">
          Daily Violations: <span className="text-[#003624]">{payload[0]?.value ?? '—'}</span>
        </p>
        <p className="text-[12px] text-[#065f46] font-bold">
          7-Day SMA: <span className="text-[#003624]">{payload[1]?.value ?? '—'}</span>
        </p>
        {data?.is_spike && (
          <p className="text-[11px] text-amber-600 font-bold mt-1">⚠ Spike detected ({data.spike_ratio}x SMA)</p>
        )}
      </div>
    </div>
  );
};

export default function ViolationsOverTimeChart({ analytics, headerActions }) {
  const [schoolDaysOnly, setSchoolDaysOnly] = useState(false);
  const [showHelper, setShowHelper] = useState(false);

  if (!analytics || !analytics.temporal) {
    return (
        <div className="flex-1 flex items-center justify-center min-h-[320px] bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
            <p className="text-slate-400 font-bold text-[13px]">No temporal data available</p>
        </div>
    );
  }

  const filteredTemporal = schoolDaysOnly 
    ? analytics.temporal.filter(d => d.is_weekday)
    : analytics.temporal;
  
  // Find weekend ranges for shading
  const weekendRanges = [];
  let weekendStart = null;
  filteredTemporal.forEach((d, i) => {
    const key = d.day || d.short_label;
    
    // In our backend, Monday=0, Sunday=6. is_weekday is < 6 (Mon-Sat).
    // For this context, Saturday is a school day. Weekends = Sunday only.
    if (!d.is_weekday && weekendStart === null) {
      weekendStart = key;
    } else if (d.is_weekday && weekendStart !== null) {
      const prevKey = filteredTemporal[i-1]?.day || filteredTemporal[i-1]?.short_label;
      weekendRanges.push({ start: weekendStart, end: prevKey });
      weekendStart = null;
    }
  });
  if (weekendStart) {
    const lastItem = filteredTemporal[filteredTemporal.length - 1];
    weekendRanges.push({ start: weekendStart, end: lastItem?.day || lastItem?.short_label });
  }

  const chartData = filteredTemporal.map(d => ({
    ...d,
    label: d.day !== "" ? d.day : d.short_label,
  }));

  return (
    <div className="bg-white rounded-[3rem] p-12 border border-[#f1f5f9] shadow-[0_20px_60px_rgba(0,0,0,0.02)] flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 relative">
            <BarChart3 className="text-[#004d33] opacity-40" />
            <h3 className="text-[22px] font-pjs font-black text-[#003624] tracking-tight">Violations Over Time</h3>
            <button 
              onClick={() => setShowHelper(!showHelper)}
              className="text-slate-300 hover:text-emerald-600 transition-colors"
            >
              <HelpCircle size={18} />
            </button>

            {showHelper && (
              <div className="absolute top-10 left-0 w-[320px] bg-white rounded-2xl shadow-2xl border border-emerald-100 p-6 z-[150] animate-fade-in">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-pjs font-black text-[#003624]">How to read this chart</h4>
                  <button onClick={() => setShowHelper(false)} className="text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 rounded-full p-1 transition-colors">
                    <X size={14} />
                  </button>
                </div>
                <div className="space-y-4 text-[12px] text-slate-600 leading-relaxed">
                  <p>
                    <strong className="text-[#10b981]">Daily Violations (Solid Line):</strong><br/>
                    The exact number of infractions recorded on a specific day.
                  </p>
                  <p>
                    <strong className="text-[#065f46]">7-Day Moving Average (Dashed Line):</strong><br/>
                    A rolling average of the past 7 days. It smooths out day-to-day noise to reveal the true underlying trend. It may appear above the daily line if recent days have lower violations than the previous week.
                  </p>
                  <p>
                    <strong className="text-[#f59e0b]">Spike Annotations (⚠):</strong><br/>
                    Automatically flags days where the violation count is more than 1.5x higher than the moving average, indicating anomalous activity.
                  </p>
                  <p>
                    <strong className="text-[#64748b]">Weekends (Shaded Areas):</strong><br/>
                    Non-school days are shaded to provide context for expected drops in volume.
                  </p>
                </div>
              </div>
            )}
          </div>
          {analytics.seasonality_trend && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`whitespace-nowrap inline-flex items-center gap-1.5 text-[11px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wider ${
                analytics.seasonality_trend.direction === 'RISING' ? 'bg-rose-50 text-rose-600' :
                analytics.seasonality_trend.direction === 'DECLINING' ? 'bg-emerald-50 text-emerald-600' :
                'bg-slate-100 text-slate-500'
              }`}>
                {analytics.seasonality_trend.direction === 'RISING' ? <TrendingUp size={12} /> :
                 analytics.seasonality_trend.direction === 'DECLINING' ? <TrendingDown size={12} /> :
                 <span>→</span>}
                {analytics.seasonality_trend.label}
              </span>
              <span className="text-[10px] font-bold text-slate-400 tracking-wide">
                via 7-Day SMA
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {headerActions}
          <div className="flex bg-slate-100 rounded-xl p-1 shrink-0">
            <button
              onClick={() => setSchoolDaysOnly(false)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${
                !schoolDaysOnly ? 'bg-white text-[#003624] shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              All Days
            </button>
            <button
              onClick={() => setSchoolDaysOnly(true)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${
                schoolDaysOnly ? 'bg-white text-[#003624] shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              School Days
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-6 ml-1">
        <div className="flex items-center gap-2">
          <div className="w-5 h-[3px] bg-[#10b981] rounded-full"></div>
          <span className="text-[11px] font-bold text-slate-500">Daily Violations</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-[3px] border-t-2 border-dashed border-[#065f46]"></div>
          <span className="text-[11px] font-bold text-slate-500">7-Day Moving Average</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#f0fdf4] border border-[#bbf7d0] rounded-sm"></div>
          <span className="text-[11px] font-bold text-slate-500">Weekend</span>
        </div>
      </div>

      <div className="flex-1 w-full relative min-h-[350px]">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 50, right: 30, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="violationFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0f2e9" vertical={false} />
            <XAxis 
              dataKey="label" 
              tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }} 
              axisLine={false} 
              tickLine={false}
              interval={4}
              angle={-25}
              textAnchor="end"
              height={40}
            />
            <YAxis 
              tickCount={6} 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
              label={{ value: 'Violations', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8', fontSize: 11, fontWeight: 600 }, offset: 20 }}
            />
            <Tooltip 
              content={<ViolationTooltip />} 
              allowEscapeViewBox={{ x: true, y: false }}
              wrapperStyle={{ zIndex: 100 }}
            />

            {/* Weekend Shading */}
            {!schoolDaysOnly && weekendRanges.map((range, i) => (
              <ReferenceArea
                key={i}
                x1={range.start}
                x2={range.end}
                fill="#f0fdf4"
                fillOpacity={0.7}
                stroke="none"
              />
            ))}

            {/* Spike Annotations */}
            {chartData.filter(d => d.is_spike).map((spike, i) => (
              <ReferenceLine
                key={`spike-${i}`}
                x={spike.label}
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                label={{ 
                    value: `⚠ ${spike.value}`, 
                    position: 'top', 
                    fill: '#b45309', 
                    fontSize: 12, 
                    fontWeight: 800,
                    offset: i % 2 === 0 ? 10 : 25
                }}
              />
            ))}

            {/* Area: Daily Violations */}
            <Area
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              fill="url(#violationFill)"
              strokeWidth={2.5}
              name="Daily Violations"
              dot={(props) => {
                if (props.value === 0) {
                  return (
                    <circle
                      key={props.index}
                      cx={props.cx}
                      cy={props.cy}
                      r={4}
                      fill="#10b981"
                      stroke="white"
                      strokeWidth={2}
                    />
                  );
                }
                return null;
              }}
              activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
            />

            {/* Line: 7-Day SMA */}
            <Line
              type="monotone"
              dataKey="ma"
              stroke="#065f46"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              name="7-Day SMA"
              activeDot={{ r: 4, fill: '#065f46', stroke: '#fff', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
