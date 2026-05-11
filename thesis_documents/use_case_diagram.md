# Use Case Diagram
## SWAFO: An AI-Powered Dress Code Detection and Violation Management System for DLSU-D

---

## Actors (4)

| Actor | Type | Portals / Modules | Description |
|---|---|---|---|
| **Student** | Primary | Module 2 — Student Portal only | DLSU-D student subject to dress code policy. Views their own data. |
| **SWAFO Officer** | Primary | Module 1 + Module 2 — Officer Portal | Field enforcement officer stationed at the campus gate. Monitors the live camera feed, calls flagged students, and records violations via the Officer Portal. Also conducts patrols. |
| **Director (Admin)** | Primary | Module 2 — Admin Portal only | SWAFO Head / SDAO Director. Adjudicates cases, manages clearances, oversees analytics. |
| **AI Module** | System | Module 1 only | Automated YOLO11s detection pipeline running on the live camera feed. Detects garments and flags violators in real-time on screen. |

> ⚠️ The **Student does NOT interact with Module 1** (dress code detection). The student only passes through the gate — the live camera scans them automatically.
> ⚠️ The **Director does NOT interact with Module 1**. Director is strictly in the Admin Portal.
> ⚠️ The **AI Module does NOT auto-transmit to Module 2**. It only flags violators on the Officer's screen. The **Officer is the bridge** — the Officer calls the student, records the violation via the Officer Portal, and that data goes to Module 2.

---

## System Boundaries (2 rectangles)

1. **MODULE 1: AI-Based Dress Code Detection System** (smaller, top or left)
2. **MODULE 2: SWAFO Web Application** (larger, contains 3 sub-portals)

---

## Part 1: MODULE 1 — AI-Based Dress Code Detection System

### Explanation (Thesis Narrative)

Figure X.1 illustrates the Use Case Diagram for Module 1, the AI-Based Dress Code Detection System. This module is physically deployed at the campus gates of De La Salle University–Dasmariñas, where a live camera feed continuously monitors students as they enter the premises. The primary human actor in this module is the SWAFO Officer, who is stationed at the gate and monitors the detection interface in real time. The secondary actor is the AI Module, a system-level actor that represents the automated YOLO11s-based garment detection pipeline operating on the camera feed.

The operational flow begins when the Officer initiates monitoring of the live camera feed. This use case includes the automatic detection of garments across fourteen predefined clothing classes by the AI Module, which in turn includes an evaluation of the detected garments against the institutional dress code rules defined in Section 27 of the Student Handbook. If the rule engine determines that the student is non-compliant, the system extends into flagging the violator on the Officer's screen through an annotated image with red bounding boxes and a violation banner. A compliance report containing the specific violation flags and handbook references is generated for every evaluation.

When a violator is flagged on screen, the Officer may choose to act by calling the flagged student over and recording the violation at the gate. This use case represents the critical human-in-the-loop step that bridges Module 1 and Module 2. The Officer identifies the student through barcode scanning or manual ID lookup, attaches the AI-generated evidence, and submits the violation record, which is then stored in the SWAFO Web Application database. Two optional extend relationships allow the Officer to manually select the detection mode and specify the student year level, overriding the system's automatic configuration when necessary.

### Use Cases

| UC# | Use Case | Actor(s) |
|---|---|---|
| UC-1 | Monitor Live Camera Feed at Gate | Officer |
| UC-2 | Detect Garments via YOLO11s (14 Classes) | AI Module |
| UC-3 | Evaluate Dress Code Compliance (Rule Engine) | AI Module |
| UC-4 | Flag Violator on Screen (Annotated Image with bounding boxes + banner) | AI Module |
| UC-5 | Generate Compliance Report (violation flags + handbook refs) | AI Module |
| UC-6 | Record Violation at Gate (call flagged student, scan barcode / ID lookup, attach AI evidence) | Officer |

### Relationships

| From | To | Type | Condition |
|---|---|---|---|
| UC-1 (Monitor Live Feed) | UC-2 (Detect Garments) | `<<include>>` | Always — every frame from the live feed is processed by the AI |
| UC-2 (Detect Garments) | UC-3 (Evaluate Compliance) | `<<include>>` | Always — compliance check follows detection |
| UC-3 (Evaluate Compliance) | UC-4 (Flag Violator on Screen) | `<<extend>>` | Only when violations are detected — screen shows red banner + red bounding boxes |
| UC-3 (Evaluate Compliance) | UC-5 (Generate Compliance Report) | `<<include>>` | Always — report is generated for every evaluation |
| UC-4 (Flag Violator on Screen) | UC-6 (Record Violation at Gate) | `<<extend>>` | Only when Officer decides to act — Officer calls the flagged student, records violation |
| UC-6 (Record Violation at Gate) | UC-5 (Generate Compliance Report) | `<<include>>` | AI evidence (compliance report + annotated image) is attached to the violation record |
| UC-1 (Monitor Live Feed) | Select Detection Mode (UNIFORM / CIVILIAN / AUTO) | `<<extend>>` | Optional — Officer may manually override auto-mode |
| UC-1 (Monitor Live Feed) | Specify Student Year Level | `<<extend>>` | Optional — Officer may manually override |

### Actor Connections (Direct Links Only)

- **Officer** → UC-1 Monitor Live Camera Feed at Gate
- **Officer** → UC-6 Record Violation at Gate
- **AI Module** → UC-2 Detect Garments
- **AI Module** → UC-3 Evaluate Dress Code Compliance
- **AI Module** → UC-4 Flag Violator on Screen
- **AI Module** → UC-5 Generate Compliance Report

---

## Cross-Module Bridge

The bridge between Module 1 and Module 2 is the **SWAFO Officer**. The AI (Module 1) flags the violator on screen → the Officer calls the student → records the violation at the gate (UC-6) → that violation data is stored in the SWAFO Web App (Module 2).

| From | To | Bridge Actor | Description |
|---|---|---|---|
| UC-6 (Record Violation at Gate — Module 1) | UC-16 (Record Violation — Module 2 Officer Portal) | **Officer** | Officer records the violation at the gate with the AI evidence attached (annotated image + compliance report). The violation record is stored in the SWAFO database and appears in the Officer Portal, Admin Portal, and Student Portal. |

---

## MODULE 2 — Shared Use Cases

| UC# | Use Case | Actor(s) |
|---|---|---|
| UC-7 | Log In to the System | Student, Officer, Director |

### Relationships — Log In (UC-7)
| From | To | Type | Condition |
|---|---|---|---|
| UC-7 (Log In) | Log In via Microsoft MSAL SSO | `<<extend>>` | Production — uses @dlsud.edu.ph institutional account |
| UC-7 (Log In) | Log In via Mock Login (Defense Demo) | `<<extend>>` | Demo mode — selects from seeded students/officers/admin |

---

## Part 2: MODULE 2 — Student Portal

### Explanation (Thesis Narrative)

Figure X.2 presents the Use Case Diagram for the Student Portal of the SWAFO Web Application. The sole actor in this subsystem is the Student, who accesses the portal by logging in through the shared authentication system, which supports both Microsoft MSAL Single Sign-On using institutional @dlsud.edu.ph accounts in production and a mock login interface for thesis defense demonstration purposes.

Upon successful authentication, the Student is presented with a personal dashboard that consolidates their academic standing, computed risk score, and a summary of recent violation records. The Student may also view their personal profile, which displays institutional information such as their student number, course, year level, and email address. The violation history view provides a chronological timeline of all recorded cases associated with the Student. This use case includes the automatic display of each case's verdict and director sanctions, as well as the computation and presentation of the Student's overall compliance standing, which is classified into tiers such as Good Standing, Has Obligation, Repeat Offender, or Probation.

The Student Portal further provides access to the institutional Student Handbook through a searchable accordion interface focused on Section 27 dress code rules, which may optionally extend into a keyword-based search functionality. Additionally, the Student may interact with an AI-powered chatbot, which leverages the Gemini language model to process natural language queries and return contextually cited answers drawn from the handbook content. Finally, the Student may manage account settings related to notifications, security preferences, and device history.

### Use Cases

| UC# | Use Case |
|---|---|
| UC-8 | View Personal Dashboard (academic standing, risk score, recent violations) |
| UC-9 | View Personal Profile (student number, course, year level, email) |
| UC-10 | View Own Violation History (timeline of all cases) |
| UC-11 | View Case Verdict and Director Sanctions |
| UC-12 | View Compliance Standing (GOOD STANDING / HAS OBLIGATION / REPEAT OFFENDER / PROBATION) |
| UC-13 | Browse Student Handbook (searchable accordion — Section 27 rules) |
| UC-14 | Ask AI Chatbot / AI Curator (Gemini-powered handbook Q&A) |
| UC-15 | Manage Account Settings (notifications, security, device history) |

### Relationships

| From | To | Type | Condition |
|---|---|---|---|
| UC-10 (View Violation History) | UC-11 (View Case Verdict) | `<<include>>` | Each violation entry shows its verdict |
| UC-10 (View Violation History) | UC-12 (View Compliance Standing) | `<<include>>` | Standing is computed from violation history |
| UC-13 (Browse Handbook) | Search Handbook by Keyword | `<<extend>>` | Optional — student may use search filter |
| UC-14 (Ask AI Chatbot) | Receive AI-Generated Cited Answer | `<<include>>` | Gemini processes query and injects handbook context |

### Actor Connections (Direct Links Only)

- **Student** → UC-7 Log In to the System
- **Student** → UC-8 View Personal Dashboard
- **Student** → UC-9 View Personal Profile
- **Student** → UC-10 View Own Violation History
- **Student** → UC-13 Browse Student Handbook
- **Student** → UC-14 Ask AI Chatbot
- **Student** → UC-15 Manage Account Settings

---

## Part 3: MODULE 2 — Officer Portal

### Explanation (Thesis Narrative)

Figure X.3 depicts the Use Case Diagram for the Officer Portal of the SWAFO Web Application. The primary actor is the SWAFO Officer, who is responsible for field-level enforcement operations including violation recording, case management, and campus patrol.

The Officer's core workflow begins with the Record Violation use case, which represents the digital counterpart of the gate-side recording process initiated in Module 1. This use case includes three mandatory sub-functions: scanning the student's ID barcode using the device camera powered by html5-qrcode, searching for the applicable handbook rule through a smart hybrid search combining semantic and keyword matching, and receiving an intelligent assessment report generated by the system before final submission. If the barcode scan fails, the system extends into a fallback manual student number entry. The intelligent assessment report itself includes automatic duplicate case detection within a 24-hour temporal window and determination of the appropriate penalty tier through the §27 Escalation Engine. When the student's violation record triggers a major violation threshold involving offenses of different natures, the system automatically extends into the §27.3.5 cross-category escalation protocol. Furthermore, if the escalation rules determine that the case warrants director-level review, the system automatically escalates the case status from OPEN to AWAITING_DECISION, without requiring manual intervention from the Officer.

The case management subsystem allows the Officer to view and manage all violation cases through a table interface organized by a five-status workflow (OPEN, UNDER_REVIEW, AWAITING_DECISION, DECISION_RENDERED, CLOSED). This use case includes viewing case details and optionally extends into claiming an unassigned case or updating the case status. Notably, the Officer cannot assign cases to other officers; only the Director holds that authority. The Officer may only claim cases that are currently unassigned.

The patrol operations subsystem enables the Officer to conduct structured enforcement patrols across the campus. Starting a patrol session includes selecting a patrol area from the campus map, viewing AI-suggested patrol routes based on the top five priority buildings ranked by violation density, tracking the Officer's live GPS position on a Mapbox-powered real-time trail, and automatically securing checkpoints when the Officer enters a 30-meter proximity radius. The Officer may optionally capture forensic watermarked photos with embedded timestamps and GPS coordinates. Ending the patrol session generates a summary report, which may optionally be exported as a PNG image. Additionally, the Officer has access to patrol history, the campus violation heatmap, and live full-screen GPS navigation.

The Officer Portal also provides access to supplementary features including a student records directory with college-based filtering, individual student profile deep-dives displaying violation history and risk scores, an officer dashboard with daily KPIs and active case summaries, reports and analytics with charts and trend visualizations, and the student handbook.

### Violation Management

| UC# | Use Case |
|---|---|
| UC-16 | Record Violation |
| UC-17 | Scan Student ID Barcode (html5-qrcode camera) |
| UC-17a | Manual Student Number Entry (Fallback) |
| UC-18 | Search Handbook Rules via Smart Search (hybrid semantic + keyword) |
| UC-19 | Receive Intelligent Assessment Report |
| UC-20 | Detect Duplicate Case (24-hour temporal window) |
| UC-21 | Determine Penalty via Escalation Engine (§27 Penalty Ladder) |
| UC-22 | Trigger Cross-Category Escalation (§27.3.5) |
| UC-27 | Auto-Escalate Case to Director (OPEN → AWAITING_DECISION) |

### Case Management

| UC# | Use Case |
|---|---|
| UC-23 | View and Manage Cases (case table with 5-status workflow) |
| UC-24 | View Case Details |
| UC-25 | Claim Unassigned Case |
| UC-26 | Update Case Status |

### Patrol Operations

| UC# | Use Case |
|---|---|
| UC-28 | Start Patrol Session |
| UC-29 | Select Patrol Area from Campus Map |
| UC-30 | View AI-Suggested Patrol Route (top 5 priority buildings by violation density) |
| UC-31 | Track Live GPS Position (real-time trail on Mapbox) |
| UC-32 | Auto-Secure Checkpoints (triggered within 30m proximity) |
| UC-33 | Capture Forensic Watermarked Photo (timestamp + GPS on canvas) |
| UC-34 | End Patrol Session and Generate Summary |
| UC-35 | Export Patrol Summary as PNG |
| UC-36 | View Patrol History (past sessions, trails, distance, checkpoints) |
| UC-37 | View Campus Violation Heatmap (Mapbox — date/category filters) |
| UC-38 | Use Live Full-Screen GPS Navigation |

### Other Officer Features

| UC# | Use Case |
|---|---|
| UC-39 | View Student Records Directory (college filter) |
| UC-40 | View Individual Student Profile Deep-Dive (violation history, risk score) |
| UC-41 | View Officer Dashboard (daily KPIs, active cases, quick actions) |
| UC-42 | View Reports and Analytics (charts, trends, college filter) |
| UC-43 | Browse Student Handbook |

### Relationships — Officer Portal

#### Record Violation (UC-16) — includes chain:
| From | To | Type | Condition |
|---|---|---|---|
| UC-16 | UC-17 (Scan Barcode) | `<<include>>` | Must identify student before recording |
| UC-16 | UC-18 (Smart Search Rules) | `<<include>>` | Must select handbook rule |
| UC-16 | UC-19 (Receive Assessment) | `<<include>>` | System auto-assesses before submission |
| UC-19 | UC-20 (Duplicate Detection) | `<<include>>` | Always checked within 24h window |
| UC-19 | UC-21 (Escalation Engine) | `<<include>>` | Always determines penalty tier |
| UC-19 | UC-22 (§27.3.5 Escalation) | `<<extend>>` | Only when major violation threshold is met |
| UC-19 | UC-27 (Auto-Escalate to Director) | `<<extend>>` | Automatically triggers if escalation rules apply (e.g. major violation of different nature) |
| UC-17 (Scan Barcode) | UC-17a (Manual Student Number Entry) | `<<extend>>` | If barcode scan fails, officer types ID manually |

#### Case Management (UC-23):
| From | To | Type | Condition |
|---|---|---|---|
| UC-23 | UC-24 (View Case Details) | `<<include>>` | Always — clicking a case shows details |
| UC-23 | UC-25 (Claim Case) | `<<extend>>` | Optional — Officer claims an unassigned case |
| UC-23 | UC-26 (Update Status) | `<<extend>>` | Optional |

#### Patrol (UC-28):
| From | To | Type | Condition |
|---|---|---|---|
| UC-28 | UC-29 (Select Area) | `<<include>>` | Must select area before patrol starts |
| UC-28 | UC-30 (AI-Suggested Route) | `<<include>>` | System always shows priority buildings |
| UC-28 | UC-31 (Track GPS) | `<<include>>` | GPS tracking is always active during patrol |
| UC-28 | UC-32 (Auto-Secure Checkpoints) | `<<include>>` | Proximity trigger always active |
| UC-28 | UC-33 (Capture Photo) | `<<extend>>` | Optional — officer may or may not capture photos |
| UC-28 | UC-34 (End Patrol + Summary) | `<<include>>` | Patrol must be formally ended |
| UC-34 | UC-35 (Export PNG) | `<<extend>>` | Optional — officer may export |

### Actor Connections (Direct Links Only)

- **Officer** → UC-7 Log In to the System
- **Officer** → UC-16 Record Violation
- **Officer** → UC-23 View and Manage Cases
- **Officer** → UC-28 Start Patrol Session
- **Officer** → UC-36 View Patrol History
- **Officer** → UC-37 View Campus Violation Heatmap
- **Officer** → UC-38 Use Live Full-Screen GPS Navigation
- **Officer** → UC-39 View Student Records Directory
- **Officer** → UC-40 View Individual Student Profile Deep-Dive
- **Officer** → UC-41 View Officer Dashboard
- **Officer** → UC-42 View Reports and Analytics
- **Officer** → UC-43 Browse Student Handbook

---

## Part 4: MODULE 2 — Admin Portal

### Explanation (Thesis Narrative)

Figure X.4 presents the Use Case Diagram for the Admin Portal of the SWAFO Web Application. The sole actor in this subsystem is the Director, who serves as the SWAFO Head or SDAO Director responsible for institutional-level case adjudication, student clearance management, and data-driven policy oversight.

The Director's primary entry point is the Director Command Center, a centralized dashboard that presents institutional key performance indicators, live alerts for newly escalated cases, and real-time monitoring of §27.3.5 cross-category escalation triggers across the student population. From this command center, the Director exercises authority over two critical administrative functions: case adjudication and officer assignment.

The case adjudication workflow allows the Director to review cases that have been automatically escalated to the AWAITING_DECISION status by the system's escalation engine. This use case includes the rendering of a formal disciplinary decision, which requires the Director to select an appropriate sanction tier and compose official director remarks. Upon rendering a decision, the Director may optionally close the case once sanctions have been fulfilled, transitioning its status from DECISION_RENDERED to CLOSED. Alternatively, the Director may dismiss a case entirely, moving it from any status to DISMISSED. The Director may also set a student's clearance status to either CLEARED or HOLD, directly affecting the student's eligibility under Section 14 clearance requirements. The Director is the only actor with the authority to assign officers to specific cases, ensuring appropriate distribution of enforcement responsibilities. The Director also has full access to view and manage all cases across all colleges through a comprehensive case table with college and status filters.

The institutional analytics dashboard provides the Director with a suite of data visualization tools for policy analysis. This dashboard includes a violations-over-time chart with a seven-day simple moving average and automated spike detection, a risk score leaderboard displaying the top ten students ranked by a temporal decay scoring algorithm, recidivism pattern analysis using Apriori association rules to identify correlated violation behaviors, a college comparison chart benchmarking all eight colleges that remains permanently unfiltered for fairness, and a policy category breakdown showing the distribution of Minor, Major, and Traffic violations. The Director may optionally filter the analytics by college or by date range. When a specific college is selected, the Director may generate a branded per-college PDF report using ReportLab.

Additional administrative capabilities include a campus violation heatmap at the admin level with date and category filters, oversight of all patrol sessions conducted by officers including GPS trails, distances, and captured photos, a comprehensive student records management interface with clearance status tracking that optionally extends into individual student profile deep-dives, and access to the student handbook.

### Use Cases

| UC# | Use Case |
|---|---|
| UC-44 | View Director Command Center (institutional KPIs, live alerts, §27.3.5 monitoring) |
| UC-45 | Adjudicate Case (review escalated case + render formal decision) |
| UC-46 | Render Disciplinary Decision (select sanction tier + write director remarks) |
| UC-47 | Close Case (DECISION_RENDERED → CLOSED after sanctions fulfilled) |
| UC-48 | Dismiss Case (any status → DISMISSED) |
| UC-49 | Set Student Clearance Status (CLEARED / HOLD — affects §14 clearance eligibility) |
| UC-50 | View and Manage All Cases (full case table with college/status filters) |
| UC-51 | Assign Officer to Case |
| UC-52 | View Institutional Analytics Dashboard |
| UC-53 | View Violations Over Time Chart (7-day SMA + spike detection) |
| UC-54 | View Risk Score Leaderboard (top 10 students by temporal decay score) |
| UC-55 | View Recidivism Patterns (Apriori association rules) |
| UC-56 | View College Comparison Chart (all 8 colleges, always unfiltered) |
| UC-57 | View Policy Category Breakdown (Minor / Major / Traffic distribution) |
| UC-58 | Filter Analytics by College |
| UC-59 | Filter Analytics by Date Range |
| UC-60 | Generate Per-College PDF Report (ReportLab branded export) |
| UC-61 | View Campus Violation Heatmap (admin-level, date/category filters) |
| UC-62 | Oversee All Patrol Sessions (officer patrol logs, GPS trails, distance, photos) |
| UC-63 | View and Manage Student Records (all students + clearance status) |
| UC-64 | View Individual Student Profile (deep-dive: violations, risk score, standing) |
| UC-65 | Browse Student Handbook |

### Relationships — Admin Portal

#### Case Adjudication (UC-45):
| From | To | Type | Condition |
|---|---|---|---|
| UC-45 | UC-46 (Render Decision) | `<<include>>` | Must select sanction and write remarks |
| UC-45 | UC-47 (Close Case) | `<<extend>>` | Only when sanctions are fulfilled |
| UC-45 | UC-48 (Dismiss Case) | `<<extend>>` | Only when Director decides to drop case |
| UC-45 | UC-49 (Set Clearance HOLD) | `<<extend>>` | Optional — Director may flag student |

#### Analytics (UC-52):
| From | To | Type | Condition |
|---|---|---|---|
| UC-52 | UC-53 (Violations Over Time) | `<<include>>` | Always shown |
| UC-52 | UC-54 (Risk Leaderboard) | `<<include>>` | Always shown |
| UC-52 | UC-55 (Recidivism Patterns) | `<<include>>` | Always shown |
| UC-52 | UC-56 (College Comparison) | `<<include>>` | Always shown, never filtered |
| UC-52 | UC-57 (Policy Breakdown) | `<<include>>` | Always shown |
| UC-52 | UC-58 (Filter by College) | `<<extend>>` | Optional |
| UC-52 | UC-59 (Filter by Date Range) | `<<extend>>` | Optional |
| UC-52 | UC-60 (Generate PDF Report) | `<<extend>>` | Only when a college is selected |

#### Student Records (UC-63):
| From | To | Type | Condition |
|---|---|---|---|
| UC-63 | UC-64 (View Student Deep-Dive) | `<<extend>>` | Optional — click on specific student |
| UC-63 | UC-49 (Set Clearance Status) | `<<extend>>` | Optional — Director may set HOLD/CLEARED |

### Actor Connections (Direct Links Only)

- **Director** → UC-7 Log In to the System
- **Director** → UC-44 View Director Command Center
- **Director** → UC-45 Adjudicate Case
- **Director** → UC-50 View and Manage All Cases
- **Director** → UC-51 Assign Officer to Case
- **Director** → UC-52 View Institutional Analytics Dashboard
- **Director** → UC-61 View Campus Violation Heatmap (Admin-Level)
- **Director** → UC-62 Oversee All Patrol Sessions
- **Director** → UC-63 View and Manage Student Records
- **Director** → UC-65 Browse Student Handbook

---

## Quick Reference: Who Can Do What

| Feature | Student | Officer | Director |
|---|---|---|---|
| Use Module 1 (AI Detection) | ❌ | ✅ | ❌ |
| View own profile & violations | ✅ | ❌ | ❌ |
| View compliance standing | ✅ | ❌ | ❌ |
| Browse handbook | ✅ | ✅ | ✅ |
| Use AI Chatbot | ✅ | ❌ | ❌ |
| Record violation | ❌ | ✅ | ❌ |
| Scan student barcode | ❌ | ✅ | ❌ |
| Claim unassigned case | ❌ | ✅ | ❌ |
| Assign officer to case | ❌ | ❌ | ✅ |
| Adjudicate / render decision | ❌ | ❌ | ✅ |
| Set clearance HOLD | ❌ | ❌ | ✅ |
| Conduct patrol | ❌ | ✅ | ❌ |
| View heatmap | ❌ | ✅ | ✅ |
| View analytics | ❌ | Limited | ✅ Full |
| Generate PDF report | ❌ | ❌ | ✅ |
| View student directory | ❌ | ✅ | ✅ |
| Oversee all patrols | ❌ | ❌ | ✅ |
