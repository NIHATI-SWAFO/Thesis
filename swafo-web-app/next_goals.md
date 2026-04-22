# Next Goals — SWAFO Director Account & Algorithm Innovation

**Status:** Planning Phase  
**Last Updated:** April 21, 2026

---

# PART 1: Director Account — Full Page Plan

## Current State (Status: Phase 1 Complete)

The Director (Admin) account now features a fully synchronized 6-page institutional command center. All core operational modules have been integrated.

| Sidebar Item | Route | Implementation Status |
|---|---|---|
| Director Overview | `/admin/dashboard` | ✅ LIVE: KPI Cards & Decision Queue |
| Case Oversight | `/admin/cases` | ✅ LIVE: §27.3.5 Director Queue |
| Student Records | `/admin/students` | ✅ LIVE: Full Compliance History |
| Institutional Analytics | `/admin/analytics` | ✅ LIVE: Behavior Intelligence |
| Handbook Master | `/admin/handbook` | ✅ LIVE: Policy Reference |
| User Management | `/admin/users` | 🚧 Module Loading (Placeholder) |

---

## Completed Pages (Institutional Tier)

### Page 1: Director Overview (`/admin/dashboard`) [✅ LIVE]
- **Executive KPIs**: Total Infractions, **Pending Director Decisions (§27.3.5)**, Resolution Rate, Active Surveillance
- **Interactive Routing**: KPI cards link directly to Case Oversight and Student Records.
- **Section 27.3.5 Alert Panel**: Summary of students requiring manual Director intervention.

### Page 2: Violation & Case Oversight (`/admin/cases`) [✅ LIVE]
- **Director Decision Queue**: Specifically filtered for students with 2+ different-nature major offenses.
- **Handbook Basis**: *"Sanctions for the commission of second up to fourth major offenses of different nature shall be decided by the SWAFO Director"*
- **Resolution Control**: Full lifecycle management of institutional infractions.

### Page 3: Student Records (`/admin/students`) [✅ LIVE]
- Reuse `StudentRecords.jsx` and `StudentProfileDetail.jsx` from Officer portal
- Director sees all students, full violation history
- Additional labels: clearance status (§14), formation program status (§26.4)

### Page 4: Institutional Analytics (`/admin/analytics`)
- Reuse `ReportsAnalytics.jsx` from Officer portal
- Add: College Distribution, Year Level Distribution, Policy Breakdown charts

### Page 5: Handbook Master (`/admin/handbook`)
- Reuse `StudentHandbook.jsx` from Student portal
- Read-only reference for the Director to verify system logic

---

## Reusability Summary

| Page | Can Reuse From | New Work Needed |
|---|---|---|
| Director Overview | Partial (existing `AdminDashboard.jsx`) | Rework KPIs + add 27.3.5 panel |
| Violation & Case Oversight | `CaseManagement.jsx` (Officer) | New: 27.3.5 Decision Queue component |
| Student Records | `StudentRecords.jsx` + `StudentProfileDetail.jsx` (Officer) | Just wire routes |
| Institutional Analytics | `ReportsAnalytics.jsx` (Officer) | Just wire routes |
| Handbook Master | `StudentHandbook.jsx` (Student) | Just wire routes |

---
---

# PART 2: Algorithm Innovation Proposals

> These are potential NEW algorithms to implement for the thesis defense. Each is independent — we can pick one or combine elements.

---

## Proposal A: Behavioral Risk Scoring with Temporal Decay

### Problem
The system only reacts AFTER a student hits their 4th minor offense. The Director has no way to see which students are trending toward escalation before it happens.

### Algorithm
A **Weighted Temporal Decay Function** that calculates a real-time "Risk Score" for every student.

**Formula:**
```
RiskScore(student) = Σ (Wₛ × e^(-λ × Δt))

Where:
  Wₛ = severity weight
       → 1.0 for minor offense
       → 3.0 for major offense
       → 2.0 for traffic offense
  
  λ  = decay constant (controls how fast old violations lose weight)
       → suggested: 0.03 (half-life ≈ 23 days)
  
  Δt = number of days since the violation was recorded
  
  e^(-λ × Δt) = exponential decay — recent violations weigh more
```

**Example:**
- Student A: 1 major offense 2 days ago → Score = 3.0 × e^(-0.03 × 2) = **2.83**
- Student B: 3 minor offenses 90 days ago → Score = 3 × (1.0 × e^(-0.03 × 90)) = **0.20**
- Student A scores higher despite fewer total violations — because their behavior is **recent and accelerating**

### What the Director Sees
A ranked list of students sorted by Risk Score. High-risk students (accelerating pattern) appear at the top with red indicators. Dormant students drop to the bottom.

### Data Needed
❌ No external data needed. Works on existing seeded violations. Just need to ensure seed data has variety (some clustered, some spread out).

### Thesis Defense Angle
> *"We implemented a temporal risk scoring model using exponential decay weighting to identify students exhibiting accelerating behavioral patterns, enabling proactive institutional intervention."*

### Feasibility
- **Backend:** One Django query + Python math — no ML libraries needed
- **Frontend:** Ranked list component with color-coded scores
- **Estimated effort:** 1–2 sessions

---

## Proposal B: Case-Based Reasoning (CBR) for Section 27.3.5

### Problem
When a student has major offenses of **different nature** (e.g., Smoking + Vandalism), the system can't auto-recommend a sanction per Section 27.3.5. The Director decides from scratch every time with no guidance.

### Algorithm
**Case-Based Reasoning (CBR)** — a classic AI technique:

1. **Retrieve:** When a 27.3.5 case appears, search the database for past students with a similar combination of offense types
2. **Compare:** Calculate similarity between the current student's offense profile and historical cases
3. **Recommend:** Show what sanctions the Director chose in similar past cases
4. **Learn:** Every new Director decision becomes a precedent for future cases

**Example:**
- Current student has: Smoking (27.3.1.31) + Vandalism (27.3.1.29)
- System finds 3 past students with similar Misconduct × Misconduct profiles
- Past Director decisions: Sanction 2, Sanction 3, Sanction 2
- System suggests: *"Based on 3 precedent cases, recommended range: Sanction 2–3"*

### Data Needed
⚠️ **Problem:** SWAFO is currently paper-based, so there are no historical Director decisions to learn from. We would need to either:
- Seed fake past decisions (less convincing for defense)
- Or start with "no precedents found" and let it learn over time (more honest but less impressive to demo)

### Thesis Defense Angle
> *"We implemented a Case-Based Reasoning engine to assist the SWAFO Director in Section 27.3.5 adjudication by analyzing historical decision precedents for similar multi-offense student profiles."*

### Feasibility
- **Backend:** Moderate — need a similarity metric for offense profiles
- **Frontend:** Precedent display panel with recommendation
- **Data concern:** Need to simulate past decisions for demo
- **Estimated effort:** 2–3 sessions

---

## Proposal C: Violation Co-occurrence Pattern Mining

### Problem
The Director doesn't know if certain types of violations tend to lead to other, more serious ones. Are there hidden behavioral patterns?

### Algorithm
**Association Rule Mining** (simplified Apriori approach):

1. **Scan** all students' violation timelines
2. **Find** frequent violation sequences (e.g., A → B within N days)
3. **Calculate:**
   - **Support** = how many students show this pattern / total students
   - **Confidence** = P(B happens | A happened)
4. **Surface** the top patterns as "Behavioral Intelligence"

**Example outputs:**
- *"Students with 2+ dress code violations within 30 days have a 72% chance of committing a Misconduct violation within 60 days"* (confidence: 0.72, support: 0.15)
- *"Loitering violations are correlated with smoking violations"* (confidence: 0.68, support: 0.12)

### Data Needed
⚠️ **Problem:** Association rule mining needs a decent volume of data to find statistically meaningful patterns. With only 51 seeded students, any "discovered" patterns would be artifacts of how we seeded the data, not real institutional insights.

### Thesis Defense Angle
> *"We applied association rule mining to campus violation records to discover temporal co-occurrence patterns, providing the SWAFO Director with predictive behavioral intelligence."*

### Feasibility
- **Backend:** Moderate — need to scan violation timelines and compute support/confidence
- **Frontend:** "Pattern Intelligence" panel showing discovered rules
- **Data concern:** Needs volume to be convincing — 51 students is thin
- **Estimated effort:** 2–3 sessions

---

## Recommendation

| Proposal | Panel Impression | Data Feasibility | Build Effort | Recommendation |
|---|---|---|---|---|
| **A: Risk Scoring** | 🟢 Strong math, clean formula | 🟢 Works with existing data | 🟢 Low (1–2 sessions) | ✅ **Do this one** |
| **B: CBR** | 🟢 Classic AI technique | 🟡 Needs simulated decisions | 🟡 Medium (2–3 sessions) | 🟡 Consider if time allows |
| **C: Pattern Mining** | 🟢 Data mining technique | 🔴 Needs large dataset | 🟡 Medium (2–3 sessions) | ❌ Skip — data too thin |

**Suggested approach:** Implement **Proposal A (Risk Scoring)** as the primary Director-level innovation. If time permits, add **Proposal B (CBR)** as a secondary feature for the Section 27.3.5 Decision Queue.
