# MODULE 2 — SWAFO Web Application Development Progress

**Project:** Development of a Standalone SWAFO Web Application for Violation Management  
**Institution:** De La Salle University-Dasmariñas (DLSU-D)  
**Stakeholders:** Mr. Ruel D. Elias (SWAFO), Dr. Eric A. Vargas (SDAO), Dr. Jacqueline L. Morta (OSS)  
**Adviser:** Rolando B. Barrameda  
**Stack:** React (Vite) + Tailwind CSS | Django + DRF | PostgreSQL  

> Source: `additional context/plan.md`, `project_context.md`, `research.md`
> **Current Focus & Status:** Aligning institutional data for thesis defense. We are synchronizing the Patrol Monitoring and Analytics modules with our core Violation database (April 18-20). Current step: Finalizing the Officer Portal's live data feeds.

---

## 1. AUTHENTICATION & ACCESS CONTROL

### Role-Based Login
- [x] Implement MSAL SSO for users
- [x] Implement AI-powered Smart Search
- [x] Implement Backend Violation Recording
- [x] Implement Offense Scaling Logic
- [x] Secure session management with Django SimpleJWT token-based auth
- [x] Enforce role-based route protection (Student / Officer / Admin)
- [x] **Mock Identity Bridge:** Implemented searchable Mock Login for 55 seeded students for thesis defense.

### Access Control Matrix (from `research.md` §7)
| Feature | Student | Officer | Admin | Status |
|---|---|---|---|---|
| View own profile | ✅ | ✅ | ✅ | ✅ Verified |
| View own violations | ✅ | ❌ | ✅ | ✅ Verified |
| Scan student ID | ❌ | ✅ | ✅ | ❌ Not started |
| Record violation | ❌ | ✅ | ✅ | ❌ Not started |
| View all violations | ❌ | ✅ | ✅ | ❌ Not started |
| Patrol logging | ❌ | ✅ | ✅ | ❌ Not started |
| Dashboard / analytics | ❌ | limited | ✅ | ❌ Not started |
| Manage users | ❌ | ❌ | ✅ | ❌ Not started |
| Access handbook | ✅ | ✅ | ✅ | 🟡 Frontend only |
| Use chatbot | ✅ | ❌ | ❌ | 🟡 Frontend only |

---

## 2. STUDENT PORTAL (Frontend UI)

> Requirement source: `research.md` §7 — Student Portal  
> Design source: `temp_folder_fordashboard/DESIGN.md` (Academic Curator aesthetic)

### Global Layout & Design System
- [x] React 19 + Vite + Tailwind CSS project setup
- [x] React Router v6 with protected nested routes
- [x] `StudentLayout.jsx` — custom sidebar (270px) and topbar (72px)
- [x] Global typography: Plus Jakarta Sans (headers), Manrope (body)
- [x] Global 90% scaling for high-density professional aesthetic
- [x] Custom color system: `#003624` primary, `#f2fcf8` surface, pure `bg-white` cards
- [x] "No-Line Rule" — boundaries via background color shifts, not 1px borders (per DESIGN.md)
- [x] Ambient shadow system using `on-surface` (#141d1c) tint instead of pure black

### Student Dashboard
- [x] High-density card layout matching `dashboard_student.jpg`
- [x] Academic standing summary card
- [x] Recent violation preview entries
- [x] Connect to live backend API for real student data

### Academic Profile — *"View personal profile"*
- [x] Student detail grid with avatar, ID, email, program info
- [x] Pure white cell contrast against mint background
- [x] Connect to live backend API for real profile data
- [ ] "Export Profile" button logic

### Violation Records — *"View violation history with case summaries"*
- [x] Stats cards and violation list UI
- [x] Fixed contrast/blending issues with `#f2fcf8` background
- [x] Connect to backend to fetch actual per-student violation history
- [x] Display case summaries and corrective action per violation
- [x] **Institutional Verdict Visibility:** Students can now view official Director remarks and sanctions in their resolution history.
- [x] **Formal Appeal Logic:** Replaced student "Self-Resolution" with a Director-led workflow and email-based appeal system for institutional integrity.

### Campus Handbook — *"Download or access university handbook"*
- [x] State-driven accordion system (expand/collapse)
- [x] Green top and left accent bars on open items
- [x] Live client-side search filter (title + content)
- [x] Pure white cells enforced (no off-green blending)
- [ ] Load actual handbook content from HandbookEntries DB table
- [ ] Add download/export handbook as PDF option

### AI Curator (Chatbot) — *"Rule-based chatbot for handbook Q&A"*
- [x] 2-column layout matching `chatbot_student.jpg` design
- [x] Custom message bubbles with source citations and action buttons
- [x] 5 clickable "Suggested Prompts" that fire into chat
- [x] Functional React state for sending/receiving messages
- [x] Connect to actual backend chatbot engine (Gemini API with Vector Context)
- [x] Return real handbook sections as answers with page/section references

### System Configuration (Settings)
- [x] Profile Information form (name, ID, email, biography)
- [x] Account Verified card with shield watermark icon
- [x] Custom notification toggle switches (Violation Updates, Handbook Updates, Security Digest)
- [x] Security Protocols section (Logout All Devices, Two-Factor Auth status)
- [x] Device History list with ACTIVE/REVOKE status pills
- [x] Privacy & Data card with "Download Data Archive" link
- [ ] Save notification preferences to backend
- [ ] Wire "Logout All Devices" to invalidate real sessions
- [ ] Wire "Revoke" device action to backend

---

## 3. SWAFO OFFICER PORTAL (In Progress)

> Requirement source: `research.md` §7 — SWAFO Officer sections

### Case Management
- [x] Create directory `src/features/cases/`
- [x] Implement `CaseManagement.jsx` component
- [x] Setup mock data and local filtering logic (search, status, priority, assignments)
- [x] Build Header & Stats Row with dynamic color coding
- [x] Build Asymmetric Grid Layout (left table, right utility cards)
- [x] Incorporate Priority Breakdown Card with 33% scales
- [x] Incorporate Recent Activity Timeline Card
- [x] **Visual Refinement:** ACHIEVED 1:1 parity with target Figma design (Pill badges, borderless clean cards, Teal labels).
- [x] Map mock data to `DRF` API responses once backend is built.
- [x] **Adjudication Engine:** Implemented institutional sanction controls (Sanctions 1-4) for §27.3.5 escalations.
- [x] **5-Status Workflow:** Transitioned cases from binary Pending/Closed to the institutional lifecycle (Open, Awaiting Decision, Decision Rendered, Closed, Dismissed).
- [x] **Portal-Based Modal:** Overhauled `CaseDetailModal` using `ReactDOM.createPortal` for viewport-centered, scrollable oversight.
- [x] **Staff Delegation:** Built-in officer assignment logic with automated 'SWAFO Director' labeling for escalated cases.
- [x] **Persistent Decisions:** Connected "Render Decision" logic to backend storage for formal institutional verdicts.
> **Approach & Findings:** Used an asymmetric grid layout (`flex-col xl:flex-row`) pitting the Case Table against utility widgets (Priority Breakdown, Recent Activity). Refined the KPI system to use status pills and removed bottom borders to align with the "Academic Curator" minimal-line rule.

### Reports & Analytics — *"View violation statistics and officer activity"*
- [x] Implement `ReportsAnalytics.jsx`
- [x] KPI Bento Grid (Total Violations, Active Cases, Closed Cases, Repeat Offenders, Resolution Speed)
- [x] **Professional Data Visualization:** Replaced hand-drawn SVG charts with `recharts` for defense-grade analytics.
- [x] **Moving Average Trendline:** Added dynamic 7-Day SMA calculation and rendering to identify true violation patterns.
- [x] **Chart Annotations:** Implemented 1.5x SMA spike detection, weekend shading, and interactive hover tooltips.
- [x] **Rolling Analytics Window:** Implemented dynamic 7-day temporal window for offense trends (Frontend/Backend Sync).
- [x] Multi-segment SVG Donut Charts for status distribution
- [x] "Officer Intelligence" detail cards with activity heatmaps
- [x] High-fidelity visual parity (Plus Jakarta Sans, brand green palette)
- [x] Connect to backend analytics endpoints for live data visualization
> **Approach:** Leveraged `recharts` for the main temporal trend chart and custom CSS for donut charts to maintain pixel-perfect control over the "Academic Curator" aesthetic.

### Patrol History & Monitoring — *"Replace SWAFO's current third-party timestamp app"*
- [x] Implement `PatrolHistory.jsx` with 2-column list/detail layout
-- [x] Interactive patrol list with high-fidelity status badges (mint/white)
+- [x] **Live Monitoring Sync:** `PatrolMonitoring.jsx` is fully connected to backend APIs; showing real active officers (Timothy De Castro, Harlene Bautista, etc.) from the DB.
+- [x] **Institutional Metric Alignment:** Charts and cards now accurately reflect 4 Active Patrols and a ~3.5h Average Duration.
- [x] Checkpoint timeline with semantic status indicators (secure/check)
- [ ] Map Navigation module with "View Full Map" interactive state
- [x] **Visual Refinement:** ACHIEVED 1:1 parity (ultra-thin 2px accents, solid white KPI text, balanced metric scaling)
- [ ] "Start Patrol" functional module (recording live session)
- [ ] Select patrol area/checkpoint within university
- [ ] Timestamped patrol photo capture (overlay: date, time, location, GPS coordinates)
- [ ] "End Patrol" button to close session
- [ ] Replace SWAFO's current third-party timestamp app with built-in solution
> **Approach:** Focused on making a digital replacement for manual patrol logging. The UI matches current high-end security dashboards with a focus on "Checkpoint Verification" data.

### Violation Recording
- [x] Setup base layout, aesthetic spacing, and generic data fields matching Figma designs (`RecordViolation.jsx`).
- [x] Map input groupings properly, implement strict `bg-white` and vertical green accent bars for consistency.
- [x] **Visual Refinement:** Implemented "Violation History" list within the recording view for context.
- [ ] Barcode scanner (camera-based, browser) using `html5-qrcode` or `@ericblade/quagga2`
- [ ] Auto-retrieve student profile from scanned barcode (name, college, department)
-- [ ] Violation type dropdown selector + manual entry option
-- [ ] Written statement / description field
+- [x] Violation type dropdown selector + manual entry option
+- [x] Written statement / description field
- [ ] Evidence upload (photo/file) via cloud storage (S3/Cloudinary)
-- [ ] Map each violation to a university handbook entry
+- [ ] Map each violation to a university handbook entry (Smart Search integrated).
+- [x] **Traffic Offense Support:** Integrated Section 27.4 logic for independent escalation and fine tracking (Php 1,000/2,000).

### System Output After Violation Submission
- [x] Auto-generated **case summary** of the incident (Tentatively working - needs improvement)
- [x] **Corrective action recommendation** based on violation type, student history, severity (Tentatively working - needs improvement)
-- [ ] **Duplicate case detection** — flag if student has a prior similar violation
+- [x] **Duplicate case detection** — flag if student has a prior similar violation (24-hour window backend verified).

---

## 4. ADMIN DASHBOARD (In Progress)

> Requirement source: `research.md` §7 — Reporting Dashboard (Admin)

- [x] **Director Command Center:** Fully synchronized dashboard with real-time §27.3.5 escalation monitoring.
- [x] **Institutional Audit Logic:** Backend-verified priority counting (bypassing historical cached data for live integrity).
- [x] **Case Oversight Integration:** Direct link between Dashboard KPI metrics and the Case Adjudication workflow.
- [ ] Enrollment/Violation proportionality analytics
- [ ] Officer performance heatmaps
- [ ] User management interface (Students, Officers, Admins)

---

## 5. INTELLIGENT FEATURES / ALGORITHMS (In Progress)

> Requirement source: `research.md` §7 — Intelligent Features; `plan.md` §5  
> These are the CS thesis highlights for defense

### 5.1 Patrol Route Optimization (Planned)
- [ ] Graph-based algorithm (Greedy Nearest Neighbor)
- [ ] Input: Building locations + Violation frequency
- [ ] Output: **Dynamic Patrol Sequence** (suggesting which building to check next)

### 5.2 Duplicate Case Detection (Implementation Complete)
- [x] **24-Hour Temporal Window** algorithm implemented in Backend
- [x] Interactive Amber Warning Modal in Frontend
- [x] Logic: Distinguishes between accidental double-logs and separate offenses.

### 5.3 Smart Corrective Action Recommendation (In Progress)
- [x] **Core Escalation Engine**: Counts violations and escalates per Section 27
- [/] **Handbook-to-Action Mapping**: Explicitly suggesting actions (e.g., Guidance Referral)
- [x] Output: Automated penalty recommendation during assessment.

### 5.4 Violation Analytics & Heatmap (In Progress)
- [x] **Analytics Engine**: Real-time charts on dashboard (Distribution & Trends)
- [ ] **Spatial Heatmap**: Visual map of the campus showing "Red Zones"
- [ ] Input: Coordinate mapping of violation records for spatial plotting
+- [x] **Rolling Analytics Window**: Implemented dynamic 7-day temporal window for offense trends (Frontend/Backend Sync).

### 5.5 Rule-Based Handbook Chatbot (In Progress)
- [x] **Hybrid Semantic Retrieval** (VSM + Cosine Similarity)
- [x] **Context-Injected NLP**: AI responses strictly limited to official rules
- [/] **Full Handbook Coverage**: Currently covers Section 27; expansion to entire manual pending.
- [x] Functionality: Student can ask handbook questions and get cited answers.

---

## 6. BACKEND & DATABASE (Implementation Complete)

> Requirement source: `plan.md` §2 Backend, §6 Database

### Django + DRF Setup
- [x] Initialize Django project with Django REST Framework
- [/] Configure PostgreSQL database connection (Currently SQLite for local dev)
- [x] Implement Django SimpleJWT authentication

### Database Tables (from `plan.md` §6)
- [x] `Users` — fully functional
- [x] `Students` — fully functional with profile resolution
- [x] `Violations` — fully functional with escalation logic + **Director Sanction fields**.
- [x] `HandbookEntries` — seeded with 82 rules
- [x] **Database Seeding:** 51 students (including Timothy De Castro) and historical data.

### API Endpoints
- [x] Student profile CRUD (via /api/users/search/)
- [x] Violation submission and retrieval
- [x] Patrol log recording
- [x] Handbook content retrieval
- [x] Chatbot query processing (AI Curator)

---

## 7. NON-FUNCTIONAL REQUIREMENTS (from `research.md` §8)

- [ ] Accessible via internet (web-based deployment)
- [ ] Mobile-responsive (officers patrol with phones/tablets)
- [ ] Secure data handling (student records, violation data)
- [ ] Fast barcode scanning (real-time or near real-time)
- [ ] Scalable for future use beyond dress code (attendance, safety)

---

## 8. DEPLOYMENT (from `plan.md` §4)

| Tier | Frontend | Backend | Database | Status |
|---|---|---|---|---|
| Free | Vercel | Render / Railway | Supabase (PostgreSQL) | ❌ Not started |
| School Server | Nginx (static) | Gunicorn + Django | PostgreSQL (local) | ❌ Not started |
| Paid | Vercel | Railway / DigitalOcean | Managed PostgreSQL | ❌ Not started |

> ⚠️ Hosting option not yet finalized — depends on school requirements and defense setup.

---

## KEY DESIGN DEVIATIONS & NOTES

- **Microsoft MSAL over Django SimpleJWT for student auth**: We chose MSAL redirect for SSO with `@dlsud.edu.ph` accounts. Django SimpleJWT will be used for Officer/Admin roles.
- **TailwindCSS used instead of shadcn/ui or MUI**: Per the "Academic Curator" design system, we built fully custom components rather than pulling from a component library.
- **No Zustand yet**: Currently using component-level React state. Global state manager will be added when backend integration begins.
- **Pure white cell rule**: All interactive surfaces must be `bg-white` with ambient shadows — never faint green tints that blend with the `#f2fcf8` background.
- **Strict 2-Case Threshold**: We explicitly chose a 2-violation threshold for "Non-Compliant" status to ensure immediate institutional intervention for repeat patterns.

---

## 9. INSTITUTIONAL STATUS LOGIC (Updated 5-Status Model)

### A. Violation Record Lifecycle (Per-Case)
| Status | Phase | Institutional Meaning |
|---|---|---|
| **OPEN** | Investigation | Officer is actively gathering facts and evidence. |
| **AWAITING_DECISION** | Escalation | Case escalated; waiting for Director's adjudication. |
| **DECISION_RENDERED** | Fulfillment | Director has issued sanctions; student must fulfill them. |
| **CLOSED** | Archived (Terminal) | Sanctions fulfilled; record formally closed. |
| **DISMISSED** | Archived (Terminal) | Case dropped or voided by Director. |

### B. Student Compliance Standing (Per-Student)
| Status Label | Database Mapping | Administrative Implication |
|---|---|---|
| **🟢 GOOD STANDING** | `total_violations == 0` | Student has perfectly clean record. |
| **🟢 CLEARED RECORD** | `active_violations == 0` & `total > 0`| Student had previous cases, but all are now CLOSED/DISMISSED. |
| **🟡 HAS OBLIGATION** | `active_violations > 0` | Student has an ongoing case blocking §14 Clearance. |
| **🔴 REPEAT OFFENDER**| `total_violations >= 2` | Behavioral pattern flagged in backend risk scoring. |
| **⛔ PROBATION**      | `total_violations >= 5` | Habitual Offender Pattern. Requires immediate SWAFO intervention. |
