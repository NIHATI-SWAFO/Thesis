# Violations Over Time Chart — Improvement Documentation v2
> Component: `ViolationsOverTimeChart`
> Page: `/admin/analytics` and `/admin/dashboard`
> Algorithm: 7-Day Simple Moving Average (SMA)
> Review Date: April 2026
> Previous Version: violations_chart_improvements.md

---

## Progress Summary

| Issue from v1 | Status |
|---|---|
| SMA second line not rendered | ✅ Fixed |
| No Y-axis labels | ✅ Fixed |
| No hover tooltip | ✅ Fixed |
| Floating SMA label — no legend | ✅ Fixed |
| Weekend shading missing | ✅ Fixed |
| Spike annotations missing | ✅ Fixed |
| Trend badge not referencing SMA | ✅ Fixed |

**7 of 7 critical and important issues from v1 are resolved.**
Remaining issues are new findings from the v2 review below.

---

## Current State Assessment

The chart now correctly renders two lines (Daily Violations + 7-Day SMA), has a Y-axis, a working hover tooltip, a proper legend, weekend shading, and spike annotations. This is a strong upgrade. The fundamentals are structurally correct.

Remaining issues are polish, data accuracy, and UX problems that must be resolved before defense.

---

## Remaining Issues

### 🔴 Critical — Must Fix Before Defense

---

#### Issue 1 — Spike Annotation Labels Are Unreadable
**What is wrong:**
The orange ⚠ markers appear at the top of the spike reference lines but the annotation text is too small to read clearly. The whole point of spike annotation is that the Director sees the peak count at a glance. If the number is unreadable the feature is purely decorative.

**Current behavior:**
```
⚠ 5   ← too small, barely visible
```

**Expected behavior:**
```
⚠ 24 violations   ← clear, bold, readable
```

**Fix:**
```jsx
// In your spike ReferenceLine label config
label={{
  value: `⚠ ${spike.count} violations`,
  position: 'top',
  fill: '#b45309',
  fontSize: 12,        // increase from current
  fontWeight: 600,     // make bold
  offset: 8           // add spacing from top edge
}}
```

---

### 🟡 Important — Should Fix Before Defense

---

#### Issue 2 — SMA Line Exceeds Raw Violation Line — No Explanation
**What is wrong:**
On the right side of the chart around Apr 20 onwards, the dashed SMA line is visibly higher than the solid daily violation line. This is mathematically correct — the SMA smooths out recent drops so it reflects the prior 7 days average, not just today — but visually it looks wrong to a non-technical panel member.

A panel member will ask: "Why is the average higher than the actual violations?"

**Fix — Add info icon with tooltip explanation:**
```jsx
// Next to the legend or chart title
const SMAInfoTooltip = () => (
  <span
    title="The 7-Day SMA reflects a rolling average of the past 7 days.
           It may appear above daily counts when recent days
           are lower than the preceding week."
    style={{ cursor: 'help', color: '#6b7280', fontSize: 12 }}
  >
    ⓘ
  </span>
)
```

**Alternative — Add note below chart:**
```
ⓘ The 7-Day Moving Average may exceed daily counts when
  recent violations are lower than the prior week average.
```

---

#### Issue 3 — Trend Badge vs Chart Visual Mismatch
**What is wrong:**
The badge shows `RISING ↑ 27.4% THIS MONTH` but the most recent visible data shows a sharp spike followed by an immediate crash to near zero. The Director sees a declining endpoint but the badge says rising — these tell contradictory stories and will be challenged during defense.

**Root cause:**
The trend calculation is likely comparing the full month start against the full month end, which means the spike in the middle distorts the comparison. The recent crash at the end is not properly weighted.

**Fix — Compare last 7 days vs previous 7 days only:**
```python
def detect_trend(sma_values: list) -> dict:
    """
    Compares the most recent 7-day SMA window against
    the previous 7-day SMA window for accurate recent trend.

    Avoids distortion from mid-period spikes by focusing
    only on the two most recent weekly windows.
    """
    if len(sma_values) < 14:
        return {
            'trend': 'INSUFFICIENT DATA',
            'percentage': 0,
            'direction': 'neutral'
        }

    previous_week = sum(sma_values[-14:-7]) / 7
    current_week  = sum(sma_values[-7:])   / 7

    if previous_week == 0:
        return {
            'trend': 'STABLE',
            'percentage': 0,
            'direction': 'neutral'
        }

    change = ((current_week - previous_week) / previous_week) * 100

    if change > 10:
        return {
            'trend': 'RISING',
            'percentage': round(change, 1),
            'direction': 'up'
        }
    elif change < -10:
        return {
            'trend': 'DECLINING',
            'percentage': round(abs(change), 1),
            'direction': 'down'
        }
    else:
        return {
            'trend': 'STABLE',
            'percentage': round(abs(change), 1),
            'direction': 'neutral'
        }
```

---

#### Issue 4 — Sharp V-Shaped Dips Look Like Missing Data
**What is wrong:**
Around Apr 13 and Apr 20 there are very sharp V-shaped drops to near zero. These look like data gaps or rendering artifacts rather than genuine zero-violation days. A panel member may question data integrity.

**Two possible causes and fixes:**

**Cause A — These are genuine zero-violation days:**
```jsx
// Add a dot marker on zero-value points to confirm real data
<Line
  dataKey="violations"
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
      )
    }
    return null
  }}
/>
```

**Cause B — Weekends slipping through School Days filter:**
```python
# Verify your School Days filter logic
# IMPORTANT: In DLSU-D context, Saturday is considered an active school/patrol day!
# Therefore, school days = Monday to Saturday.
# Only Sunday must be excluded when the 'School Days' toggle is active.

from datetime import date

def filter_school_days(violations: list) -> list:
    # Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5
    # Only Sunday (6) is excluded
    SCHOOL_DAYS = {0, 1, 2, 3, 4, 5}  
    return [
        v for v in violations
        if v['date'].weekday() in SCHOOL_DAYS
    ]
```

---

#### Issue 5 — Tooltip Clipped Off-Screen on Right Side
**What is wrong:**
The hover tooltip for Tuesday April 21 is being partially cut off by the right boundary of the chart container. A scrollbar is visible inside the tooltip area confirming the overflow issue.

**Fix:**
```jsx
<Tooltip
  content={<CustomTooltip />}
  allowEscapeViewBox={{ x: true, y: false }}
  wrapperStyle={{ zIndex: 100 }}
/>
```

**Also ensure the chart has enough right margin:**
```jsx
<ComposedChart
  data={chartData}
  margin={{ top: 20, right: 40, bottom: 20, left: 20 }}
  // Increase right margin so tooltip has room to render
>
```

---

#### Issue 6 — Weekend Shading Bleeding into School Day Columns
**What is wrong:**
The rightmost weekend shading column appears to cover an area around Apr 20 that includes active school day data. A shading column incorrectly covering a Tuesday is a bug that raises questions about data accuracy during defense.

**Fix — Verify weekend range calculation (DLSU-D Context):**
```javascript
// Ensure weekend ranges are strictly Sunday only, as Saturday is an active school day.
function getWeekendRanges(data) {
  const ranges = []
  let start = null

  data.forEach((point, i) => {
    const day = new Date(point.date).getDay()
    const isWeekend = day === 0  // 0=Sun. Saturday (6) is a school day.

    if (isWeekend && start === null) {
      start = point.date
    } else if (!isWeekend && start !== null) {
      ranges.push({ start, end: data[i - 1].date })
      start = null
    }
  })

  // Close last range if it ends on a weekend
  if (start !== null) {
    ranges.push({ start, end: data[data.length - 1].date })
  }

  return ranges
}
```

---

## Final Checklist — Full History

| # | Fix | Priority | v1 Status | v2 Status |
|---|---|---|---|---|
| 1 | Two lines rendered | 🔴 Critical | ⬜ Todo | ✅ Done |
| 2 | Y-axis labels | 🔴 Critical | ⬜ Todo | ✅ Done |
| 3 | Hover tooltip | 🟡 Important | ⬜ Todo | ✅ Done |
| 4 | Proper legend | 🟡 Important | ⬜ Todo | ✅ Done |
| 5 | Weekend shading | 🟢 Nice | ⬜ Todo | ✅ Done |
| 6 | Spike annotations | 🟢 Nice | ⬜ Todo | ✅ Done |
| 7 | Trend badge references SMA | 🟡 Important | ⬜ Todo | ✅ Done |
| 8 | Spike annotation labels readable | 🔴 Critical | N/A | ⬜ Todo |
| 9 | SMA above raw line — add explanation | 🟡 Important | N/A | ⬜ Todo |
| 10 | Trend badge vs visual mismatch | 🟡 Important | N/A | ⬜ Todo |
| 11 | V-shaped dips — verify data or filter | 🟡 Important | N/A | ⬜ Todo |
| 12 | Tooltip clipped off-screen | 🟡 Important | N/A | ⬜ Todo |
| 13 | Weekend shading bleeding into school days | 🟡 Important | N/A | ⬜ Todo |

---

## Overall Assessment

**v1 → v2 Progress: 7 of 7 previous issues resolved. 6 new issues identified.**

The chart is now structurally correct and algorithmically sound. All the core requirements for a CS thesis analytics component are present. Remaining issues are in three categories:

**Readability** — spike labels too small (Issue 1)

**Algorithmic accuracy** — trend calculation window causing badge vs visual mismatch (Issue 3), SMA exceeding raw values with no explanation (Issue 2)

**Data integrity** — V-shaped dips need verification (Issue 4), weekend shading bleeding (Issue 6), tooltip clipping (Issue 5)

Fix Issues 1, 3, and 5 as the minimum before defense. Issues 2, 4, and 6 add credibility and should be done if time allows.

---

## What Defense-Ready Looks Like

```
┌──────────────────────────────────────────────────────────┐
│ 📊 Violations Over Time        [ALL DAYS] [SCHOOL DAYS]  │
│                                                          │
│ 📉 DECLINING ↓ 18.3% THIS WEEK  via 7-Day SMA  ⓘ       │
│                                                          │
│ ━━ Daily Violations   ╌╌ 7-Day Moving Average  □ Weekend │
│                                                          │
│ 10|  ⚠ 9 violations                                     │
│  8|      |                                              │
│  6|    ╱╲|                                              │
│  4|   ╱  ╲    ╱╲                                        │
│  2|╱╲╱    ╲__╱  ╲____                                   │
│  0|_________[S S]_______[S S]_______                    │
│   Mar30  06M  11S  16T  21T  26S                        │
│                                                         │
│ ⓘ SMA may exceed daily count when recent days           │
│   are lower than prior week average                     │
└──────────────────────────────────────────────────────────┘
```

Readable spike labels, correct trend window, verified weekend ranges, tooltip fully visible, SMA behavior explained. This is the defense-ready target.

---

*End of ViolationsOverTime Chart Improvement Documentation v2*
*Previous version: violations_chart_improvements.md*
