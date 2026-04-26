# Institutional Status Workflow Overhaul

## Overview
This document summarizes the system-wide transition from the legacy status model to the **Institutional 5-Status Lifecycle**. This update addresses the "logic gap" where students were able to self-resolve serious infractions, shifting authority to the Director and formalizing the adjudication process.

## 1. The New Status Lifecycle
The system now enforces a strict, linear state machine for all campus violations:

| Status | Phase | Description |
| :--- | :--- | :--- |
| `OPEN` | **Investigation** | Incident recorded; Officer is conducting an initial investigation. |
| `AWAITING_DECISION` | **Escalation** | Investigation complete; Case is in the Director's queue for review. |
| `DECISION_RENDERED` | **Fulfillment** | Director has prescribed sanctions; Student is currently fulfilling requirements. |
| `CLOSED` | **Archived** | **[Terminal]** Sanctions fulfilled; Record formally closed and indexed. |
| `DISMISSED` | **Archived** | **[Terminal]** Case dropped or voided by Director review. |

## 2. Role-Based Impacts

### 🏛️ SWAFO Director
- **Central Adjudicator**: Only the Director can move cases from `AWAITING_DECISION` to `DECISION_RENDERED` or `DISMISSED`.
- **Closure Authority**: Only the Director can finalize a case to `CLOSED` after verifying fulfillment.
- **Decision Queue**: New dashboard alerts surface cases requiring immediate institutional judgment.

### 👮 Security Officer
- **Fact Finder**: Restricted to managing the `OPEN` phase.
- **Escalation Logic**: Once an officer completes their report or assigns it to the Director, the case automatically moves to `AWAITING_DECISION`.
- **Read-Only Post-Escalation**: Officers can no longer modify case statuses once they enter the Director's queue.

### 🎓 Student
- **Zero-Resolution Authority**: The "Acknowledge" (self-resolve) capability has been removed.
- **Read-Only Transparency**: Students see their case progress through the institutional workflow but cannot trigger transitions.
- **Formal Appeal**: Replaced in-app status changes with a direct email inquiry system to the SWAFO Office.

## 3. Technical Implementation

### Backend Changes
- **Models**: Updated `Violation.status` choices in `apps/violations/models.py`.
- **Risk Scoring**: Modified `Temporal Decay` logic to exclude `CLOSED` and `DISMISSED` records from risk calculations.
- **Data Migration**: Applied migration `0004_update_status_choices` with the following legacy mapping:
  - `UNDER_REVIEW` → `OPEN`
  - `PENDING` → `AWAITING_DECISION`
  - `RESOLVED` → `CLOSED`
  - `APPEALED` → `AWAITING_DECISION`

### Frontend Changes
- **Overhauled Components**:
  - `CaseManagement.jsx`: Full redesign of the adjudication modal and filters.
  - `StudentDashboard.jsx`: Removed self-closure actions; added appeal metadata logic.
  - `OfficerDashboard.jsx`: Updated donut charts and KPIs to match the 5-status model.
  - `ReportsAnalytics.jsx`: Realigned all institutional trends with the new status distribution.

## 4. Verification Status
- [x] Backend status validation logic.
- [x] Automated status transition on officer assignment.
- [x] Director-only action permissions.
- [x] Student read-only record view.
- [x] Legacy data integrity migration.

---
**Institutional Policy Note**: This workflow ensures that every recorded violation is formally accounted for by SWAFO administration before being archived.
