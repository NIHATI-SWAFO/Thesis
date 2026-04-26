# Violations Over Time Chart — Improvement Documentation
> Component: `ViolationsOverTimeChart`
> Page: `/admin/analytics` and `/admin/dashboard`
> Algorithm: 7-Day Simple Moving Average (SMA)
> Last Updated: April 2026

---

## Current State Assessment

The chart currently renders a single line showing raw daily violation counts with a trend badge and All Days / School Days toggle. The 7-Day SMA label is present but the algorithm is not yet visually represented on the chart itself.

---

## Issues Found

### 🔴 Critical — Must Fix Before Defense

---

#### Issue 1 — SMA Second Line Not Rendered
**What is wrong:**
The 7-Day SMA is being calculated but not drawn on the chart. There is only one line — the raw daily count. The entire purpose of the Moving Average algorithm is to show the smoothed trend against the noisy raw data. Without two lines, the algorithm has no visual proof of existence. A panel member will call this out immediately.

**What it should look like:**
```
Line 1 — Raw daily count     → solid filled area (current green)
Line 2 — 7-Day SMA           → thinner solid line, lighter shade or dashed
```

**Recharts Implementation:**
```jsx
import {
  ComposedChart, Area, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

<ComposedChart data={chartData}>
  <CartesianGrid strokeDasharray="3 3" stroke="#e0f2e9" />
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip content={<CustomTooltip />} />
  <Legend />

  {/* Line 1 — Raw daily violations */}
  <Area
    type="monotone"
    dataKey="violations"
    stroke="#10b981"
    fill="#d1fae5"
    fillOpacity={0.4}
    strokeWidth={2}
    name="Daily Violations"
  />

  {/* Line 2 — 7-Day SMA */}
  <Line
    type="monotone"
    dataKey="sma7"
    stroke="#065f46"
    strokeWidth={2}
    strokeDasharray="5 5"
    dot={false}
    name="7-Day SMA"
  />
</ComposedChart>
```

**Backend SMA Calculation:**
```python
def calculate_sma(violations: list, window: int = 7) -> list:
    """
    Calculates 7-Day Simple Moving Average for violation counts.
    
    Args:
        violations: list of dicts with 'date' and 'count' keys
        window: number of days for moving average (default 7)
    
    Returns:
        violations list with 'sma7' key added to each entry
    """
    counts = [v['count'] for v in violations]
    
    for i in range(len(counts)):
        if i < window - 1:
            # Not enough data yet — partial average
            sma = sum(counts[:i+1]) / (i+1)
        else:
            sma = sum(counts[i-window+1:i+1]) / window
        violations[i]['sma7'] = round(sma, 2)
    
    return violations
```

---

#### Issue 2 — No Y-Axis Labels
**What is wrong:**
The Y-axis is completely empty. This means the scale is invisible and the 59.3% decline claim cannot be verified visually by the panel.

**Fix:**
```jsx
<YAxis
  tickCount={6}
  tickFormatter={(value) => value}
  axisLine={false}
  tickLine={false}
  tick={{ fill: '#6b7280', fontSize: 12 }}
  label={{
    value: 'Violations',
    angle: -90,
    position: 'insideLeft',
    style: { fill: '#6b7280', fontSize: 11 }
  }}
/>
```

**Expected result:**
```
25 |
20 |
15 |
10 |
 5 |
 0 |_______________________
```

---

### 🟡 Important — Should Fix Before Defense

---

#### Issue 3 — No Hover Tooltip with SMA Value
**What is wrong:**
Hovering over a data point shows nothing or generic data. The Director needs to see both the raw count and the SMA value for any given day to make informed decisions.

**Fix — Custom Tooltip Component:**
```jsx
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null

  return (
    <div style={{
      background: 'white',
      border: '1px solid #d1fae5',
      borderRadius: '8px',
      padding: '12px 16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
    }}>
      <p style={{ fontWeight: 600, marginBottom: 6 }}>{label}</p>
      <p style={{ color: '#10b981' }}>
        Daily Violations: <strong>{payload[0]?.value}</strong>
      </p>
      <p style={{ color: '#065f46' }}>
        7-Day SMA: <strong>{payload[1]?.value}</strong>
      </p>
    </div>
  )
}
```

**Expected result on hover:**
```
┌──────────────────────────┐
│ Thursday, April 16       │
│ Daily Violations:  23    │
│ 7-Day SMA:         14.3  │
└──────────────────────────┘
```

---

#### Issue 4 — Dark Vertical Bar Markers Unexplained
**What is wrong:**
Two dark vertical bars appear at 16 THU and 21 TUE with no label or legend entry. Without explanation these look like rendering bugs. A panel member will ask what they are.

**Options:**
```
Option A — Label them as peak day markers
  → Add a legend entry: "▐ Peak Day"
  → Add a tooltip that says "Highest violation day in period"

Option B — Remove them entirely
  → If they serve no specific purpose, clean them out
  → Less visual noise is better
```

**If keeping them — Recharts Reference Line:**
```jsx
import { ReferenceLine } from 'recharts'

{peakDays.map(day => (
  <ReferenceLine
    key={day.date}
    x={day.date}
    stroke="#064e3b"
    strokeWidth={1.5}
    strokeDasharray="4 4"
    label={{
      value: `Peak: ${day.count}`,
      position: 'top',
      fill: '#064e3b',
      fontSize: 10
    }}
  />
))}
```

---

#### Issue 5 — 7-DAY SMA Label Floating Without Context
**What is wrong:**
The `7-DAY SMA` text sits next to the trend badge but is not tied to anything visual. It reads as orphaned text.

**Fix — Convert to proper legend:**
```jsx
// Replace floating label with a proper chart legend
const CustomLegend = () => (
  <div style={{ display: 'flex', gap: 20, fontSize: 12, color: '#6b7280' }}>
    <span>
      <span style={{ color: '#10b981' }}>━━</span> Daily Violations
    </span>
    <span>
      <span style={{ color: '#065f46' }}>╌╌</span> 7-Day Moving Average
    </span>
  </div>
)
```

Place this directly below the chart title and above the chart area.

---

#### Issue 6 — Trend Label vs Chart Visual Mismatch
**What is wrong:**
The badge says `DECLINING ↓ 59.3%` but the chart visually shows a significant spike in the middle period. Without Y-axis labels and the SMA line, the Director cannot reconcile the declining label with the spike they see. This is a credibility issue during defense.

**Fix — Trend badge should reference the SMA line explicitly:**
```jsx
const TrendBadge = ({ trend, percentage }) => {
  const isDecline = trend === 'DECLINING'
  
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      background: isDecline ? '#d1fae5' : '#fee2e2',
      borderRadius: 20,
      padding: '4px 12px',
      fontSize: 12,
      fontWeight: 600,
      color: isDecline ? '#065f46' : '#991b1b'
    }}>
      {isDecline ? '↓' : '↑'} {trend} {percentage}% THIS MONTH
      <span style={{ fontWeight: 400, opacity: 0.7 }}>via 7-Day SMA</span>
    </div>
  )
}
```

**Backend trend detection:**
```python
def detect_trend(sma_values: list) -> dict:
    """
    Compares first week SMA average vs last week SMA average
    to determine overall monthly trend direction.
    """
    if len(sma_values) < 14:
        return {'trend': 'INSUFFICIENT DATA', 'percentage': 0}
    
    first_week_avg = sum(sma_values[:7]) / 7
    last_week_avg  = sum(sma_values[-7:]) / 7
    
    if first_week_avg == 0:
        return {'trend': 'STABLE', 'percentage': 0}
    
    change = ((last_week_avg - first_week_avg) / first_week_avg) * 100
    
    if change > 10:
        return {'trend': 'RISING',    'percentage': round(change, 1)}
    elif change < -10:
        return {'trend': 'DECLINING', 'percentage': round(abs(change), 1)}
    else:
        return {'trend': 'STABLE',    'percentage': round(abs(change), 1)}
```

---

### 🟢 Nice to Have — Adds Polish

---

#### Issue 7 — Weekend Columns Not Visually Distinct
**What is wrong:**
The School Days toggle exists but even on All Days view, weekends are not distinguished. The Director cannot immediately tell which dips are expected weekend lulls vs genuine drops.

**Fix — Reference Areas for weekends:**
```jsx
import { ReferenceArea } from 'recharts'

{weekendRanges.map((range, i) => (
  <ReferenceArea
    key={i}
    x1={range.start}
    x2={range.end}
    fill="#f0fdf4"
    fillOpacity={0.5}
    label={{
      value: 'Weekend',
      position: 'insideTop',
      fontSize: 9,
      fill: '#9ca3af'
    }}
  />
))}
```

---

#### Issue 8 — No Auto-Annotation for Significant Spikes
**What is wrong:**
The spike at 16 THU is clearly significant but goes unannotated. The Director has to mentally note it without context.

**Fix — Auto-detect and annotate spikes:**
```python
def detect_spikes(violations: list, threshold: float = 1.5) -> list:
    """
    Flags days where violations exceed threshold * 7-day SMA.
    These are auto-annotated on the chart as significant spikes.
    """
    spikes = []
    for v in violations:
        if v.get('sma7') and v['sma7'] > 0:
            if v['count'] > threshold * v['sma7']:
                spikes.append({
                    'date': v['date'],
                    'count': v['count'],
                    'sma7': v['sma7'],
                    'ratio': round(v['count'] / v['sma7'], 2)
                })
    return spikes
```

```jsx
// Annotate detected spikes on chart
{spikes.map(spike => (
  <ReferenceLine
    key={spike.date}
    x={spike.date}
    stroke="#f59e0b"
    strokeWidth={1}
    label={{
      value: `⚠ ${spike.count} violations`,
      position: 'top',
      fill: '#b45309',
      fontSize: 10
    }}
  />
))}
```

---

## Final Checklist Before Defense

| # | Fix | Priority | Status |
|---|---|---|---|
| 1 | Add SMA second line to chart | 🔴 Critical | ✅ Done |
| 2 | Add Y-axis labels with scale | 🔴 Critical | ✅ Done |
| 3 | Add custom hover tooltip | 🟡 Important | ✅ Done |
| 4 | Label or remove dark vertical bars | 🟡 Important | ✅ Done |
| 5 | Replace floating SMA label with legend | 🟡 Important | ✅ Done |
| 6 | Fix trend badge to reference SMA explicitly | 🟡 Important | ✅ Done |
| 7 | Shade weekend columns | 🟢 Nice | ✅ Done |
| 8 | Auto-annotate spike days | 🟢 Nice | ✅ Done |

---

## What the Final Chart Should Look Like

```
┌─────────────────────────────────────────────────────┐
│ 📊 Violations Over Time        [ALL DAYS][SCHOOL DAYS]│
│                                                      │
│ 📉 DECLINING ↓ 59.3% THIS MONTH  via 7-Day SMA      │
│ ━━ Daily Violations   ╌╌ 7-Day Moving Average        │
│                                                      │
│ 25|     ╱╲  ⚠24                                     │
│ 20|    ╱  ╲_____╱╲                                  │
│ 15|╱╲_╱   SMA    ╲____                              │
│ 10|                    ╲                            │
│  5|                     ╲___                        │
│  0|_________[S][S]_________[S][S]__________         │
│    01W  06M  11S  16T  21T  26S                     │
│         └shaded weekends┘                           │
└─────────────────────────────────────────────────────┘
```

Two lines, Y-axis scale, labeled weekends, spike annotations, hover tooltip, proper legend. This is what a fully implemented Moving Average analytics chart looks like for a CS thesis defense.

---

*End of ViolationsOverTime Chart Improvement Documentation*
