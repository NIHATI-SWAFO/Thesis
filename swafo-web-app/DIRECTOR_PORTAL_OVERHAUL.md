# SWAFO Director Portal Overhaul: Institutional Command Center

## 🎯 Objective
To fully differentiate the SWAFO Director (Admin) portal from the Officer portal across all 7 operational surfaces. The Director account will function as a high-level institutional oversight and decision-making tool.

---

## 🏛️ The 7-Page Overhaul Strategy

### 1. Director Overview (`/admin/dashboard`)
*   **Status**: ✅ COMPLETED.
*   **Features**: KPI Cards, 7-Day Trend Chart, Building Hotspots, and the §27.3.5 Decision Queue summary (Fully Synchronized).

### 2. Case Oversight (`/admin/cases`)
*   **Director Workflow**: Adjudication & Delegation. (✅ COMPLETED)
*   **New Features**:
    *   **§27.3.5 Decision Header**: Prominent panel for students with multiple major offenses. (✅)
    *   **Adjudication Controls**: Dropdown to select Sanctions 1-4 with a "Render Decision" button. (✅)
    *   **Officer Assignment**: Ability to delegate unassigned cases to specific officers via a staff dropdown. (✅)
    *   **Visibility**: New "Handling Officer" column showing 'SWAFO Director' for escalated cases. (✅)

### 3. Student Records (`/admin/students`)
*   **Director Workflow**: Institutional Compliance Oversight.
*   **New Features**:
    *   **Compliance Status Pills**: Visual 🟢/⚪/🔴 markers (Compliant / Under Review / Non-Compliant).
    *   **Clearance Master Toggle**: "CLEARED" vs "HOLD" status manageable only by the Director.
    *   **Risk Score Integration**: Real-time display of the Temporal Decay behavioral score.
    *   **Compliance Filtering**: Quick-filter tabs by institutional standing.

### 4. Patrol Oversight (`/admin/patrols`)
*   **Director Workflow**: Staff Performance & Real-time Accountability.
*   *New Features**:
    *   **Officer Performance Grid**: Summary cards for each officer (Total Patrols, Avg Duration, Evidence Logs).
    *   **Live Watch**: "Operational" pulse indicators for officers currently in a patrol session.
    *   **Officer-Specific Filtering**: Ability to drill down into logs for a specific officer.

### 5. Institutional Analytics (`/admin/analytics`)
*   **Director Workflow**: Behavioral Intelligence & Risk Prediction.
*   **New Features**:
    *   **Risk Score Leaderboard**: Top 10 high-risk students identified by the Temporal Decay algorithm.
    *   **Officer Workload Map**: Chart showing case distribution across the officer fleet.
    *   **Institutional Resolution Speed**: KPI tracking average case closure efficiency.

### 6. Handbook Master (`/admin/handbook`)
*   **Status**: ✅ STAYS AS-IS.
*   **Features**: Read-only reference of University Disciplinary Policy Section 27.

### 7. User Management (`/admin/users`)
*   **Director Workflow**: Staff Roster & Operational Health.
*   **New Features**:
    *   **Officer Directory**: List of all staff accounts with operational metrics.
    *   **System Health Stats**: Total vs Active officers, Average caseload per staff member.

---

## 🧠 Core Innovation: Behavioral Risk Scoring (Proposal A)

The Director's portal will be powered by a **Weighted Temporal Decay Function**:
`RiskScore(student) = Σ (Wₛ × e^(-0.03 × Δt))`

*   **Logic**: Recent violations carry significantly higher risk weights than old ones.
*   **Impact**: Allows the Director to intervene **proactively** when a student's behavior is accelerating, rather than just reacting to individual logs.

---

## 🛠️ Backend Intelligence Requirements
1.  **New Fields**: Add `is_cleared` (Boolean) and `clearance_notes` to the `StudentProfile` model.
2.  **New Endpoints**:
    *   `GET /api/users/?role=OFFICER`: For staff delegation and rosters.
    *   `PATCH /api/violations/:id/adjudicate/`: For rendering Director-level sanctions.
    *   `GET /api/analytics/risk-scores/`: To power the predictive leaderboard.

---

## ✅ Final Success Criteria
1.  **Zero Leakage**: Officer portal remains clean; Director-only features are strictly isolated to Admin routes.
2.  **Institutional Logic**: §27.3.5 cases can be resolved with official Director sanctions.
3.  **Visual Authority**: All Admin pages feel distinct and higher-level than the Officer versions.
