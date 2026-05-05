# SWAFO System Documentation

**De La Salle University – Dasmariñas | College of Science and Computer Studies**
**Module 2: Intelligent Violation Management System**
**Version:** 1.0 | **Last Updated:** May 5, 2026

---

## 1. System Overview

SWAFO (Student Welfare and Formation Office) Portal is a full-stack web application that digitizes campus patrol enforcement and disciplinary case management at DLSU-D. It replaces the manual paper-based workflow with an intelligent, algorithm-driven platform featuring real-time GPS patrol tracking, AI-powered violation retrieval, automated penalty escalation, and data-driven analytics.

**Core Problem Solved:** SWAFO officers previously relied on printed handbooks, manual logbooks, and a third-party timestamp app. This system unifies patrol routing, violation recording, case adjudication, and institutional reporting into a single platform.

---

## 2. Technical Stack

### 2.1 Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.2 | UI framework (SPA) |
| Vite | 8.0 | Build tool and dev server |
| Tailwind CSS | 4.2 | Utility-first styling |
| React Router | 7.14 | Client-side routing |
| Mapbox GL JS | 3.22 | Campus map, heatmap, GPS tracking |
| Recharts | 3.8 | Data visualization (charts) |
| html5-qrcode | 2.3.8 | Barcode/QR scanner |
| html2canvas | 1.4 | Patrol summary image export |
| MSAL Browser | 5.6 | Microsoft SSO authentication |
| Zustand | 5.0 | State management |
| Axios | 1.15 | HTTP client |
| Lucide React | 1.11 | Icon library |
| React Markdown | 10.1 | Chatbot response rendering |

### 2.2 Backend
| Technology | Version | Purpose |
|---|---|---|
| Django | 6.0.4 | Web framework |
| Django REST Framework | 3.17 | REST API layer |
| SimpleJWT | 5.5 | Token-based auth (Officer/Admin) |
| Google Generative AI | latest | Gemini API (embeddings + chat) |
| ReportLab | 4.4.10 | PDF generation (college reports) |
| psycopg2-binary | 2.9 | PostgreSQL driver |
| django-cors-headers | 4.9 | Cross-origin requests |
| django-environ | latest | Environment variable management |

### 2.3 Infrastructure
| Layer | Development | Production (Planned) |
|---|---|---|
| Frontend | `localhost:5173` (Vite) | Vercel |
| Backend | `localhost:8000` (Django) | Railway / Render |
| Database | SQLite | PostgreSQL (Supabase) |
| Maps | Mapbox Studio (custom style) | Same |
| AI | Gemini Flash + Embedding 001 | Same |
| Auth | Microsoft MSAL (`@dlsud.edu.ph`) | Same |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT LAYER                      │
│  React 19 (Vite) + Tailwind CSS + Mapbox GL JS      │
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │ Student  │ │ Officer  │ │  Admin   │             │
│  │ Portal   │ │ Portal   │ │ Portal   │             │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘             │
│       └─────────────┼───────────┘                    │
│                     │ REST API (Axios/Fetch)          │
└─────────────────────┼───────────────────────────────┘
                      │
┌─────────────────────┼───────────────────────────────┐
│              API GATEWAY LAYER                       │
│         Django REST Framework (DRF)                  │
│                                                      │
│  /api/users/     → User & Student CRUD               │
│  /api/violations/→ Record, Assess, Heatmap           │
│  /api/patrols/   → Sessions, Stats, GPS Trails       │
│  /api/handbook/  → Rules, Smart Search               │
│  /api/analytics/ → Dashboards, PDF Reports           │
│  /api/ai/        → Chatbot (Gemini)                  │
└─────────────────────┼───────────────────────────────┘
                      │
┌─────────────────────┼───────────────────────────────┐
│              DATA & AI LAYER                         │
│                                                      │
│  SQLite/PostgreSQL     Google Gemini API              │
│  ┌─────────────┐      ┌────────────────┐             │
│  │ Users       │      │ Embedding 001  │             │
│  │ Students    │      │ (768-dim VSM)  │             │
│  │ Violations  │      ├────────────────┤             │
│  │ Handbook    │      │ Gemini Flash   │             │
│  │ Patrols     │      │ (NLP Chatbot)  │             │
│  └─────────────┘      └────────────────┘             │
└─────────────────────────────────────────────────────┘
```

---

## 4. Database Schema

### 4.1 User (extends AbstractUser)
| Field | Type | Attributes | Description |
|---|---|---|---|
| username | CharField(150) | unique, blank, null | Fallback identifier for MSAL compatibility |
| email | EmailField | unique | Primary authentication identifier |
| full_name | CharField(255) | blank | Display name |
| role | CharField(20) | choices, default='STUDENT' | Role-based access control. Choices: `STUDENT`, `OFFICER`, `ADMIN` |

### 4.2 StudentProfile (1:1 → User)
| Field | Type | Attributes | Description |
|---|---|---|---|
| user | OneToOneField | on_delete=CASCADE | Link to User model (`related_name='student_profile'`) |
| student_number | CharField(9) | unique, RegexValidator | 9-digit DLSU-D student ID |
| course | CharField(100) | | College/program (e.g., "BS Computer Science") |
| year_level | IntegerField | default=1 | 1–4 |
| clearance_status | CharField(20) | choices, default='CLEARED' | Director Oversight. Choices: `CLEARED`, `HOLD` |
| risk_score | FloatField | default=0.0 | Temporal Decay Score (computed, 0–100) |
| barcode_value | CharField(255) | blank, null | Future barcode mapping for ID scanning |

### 4.3 HandbookEntry
| Field | Type | Attributes | Description |
|---|---|---|---|
| rule_code | CharField(20) | unique | e.g., "27.3.1.20" |
| category | CharField(100) | | Minor Rule 27.1 / Major Rule 27.3 / Traffic — Minor / Traffic — Major |
| description | TextField | | Full rule text |
| penalty_1st–5th | CharField(255) | blank, null | Escalating penalty tiers |

**Seeded:** 82 rules from the DLSU-D Student Handbook Section 27.

### 4.4 Violation
| Field | Type | Attributes | Description |
|---|---|---|---|
| student | ForeignKey | on_delete=CASCADE | Offending student (`related_name='violations'`) |
| officer | ForeignKey | on_delete=SET_NULL, null | Recording officer (`related_name='recorded_violations'`) |
| assigned_to | ForeignKey | on_delete=SET_NULL, null, blank | Assigned investigator (`related_name='assigned_violations'`) |
| rule | ForeignKey | on_delete=PROTECT | Cited handbook rule (`related_name='violations'`) |
| location | CharField(255) | | Free-text location |
| location_name | CharField(255) | blank | Normalized key (matches DLSUD_LOCATIONS) |
| latitude, longitude | FloatField | blank, null | GPS coordinates (auto-populated from lookup) |
| description | TextField | | Officer's written statement |
| evidence_url | URLField | blank, null | Photo/file evidence link |
| status | CharField(20) | choices, default='OPEN' | Lifecycle status. Choices: `OPEN`, `AWAITING_DECISION`, `DECISION_RENDERED`, `DISMISSED`, `CLOSED` |
| case_summary | TextField | blank | AI-generated incident summary |
| corrective_action | CharField(255) | blank | System-recommended penalty |
| director_sanction | CharField(255) | blank, null | Formal sanction (Director only) |
| director_remarks | TextField | blank, null | Director's justification |
| timestamp | DateTimeField | auto_now_add=True | Auto-set on creation |
| updated_at | DateTimeField | auto_now=True | Auto-set on save |

### 4.5 PatrolSession
| Field | Type | Attributes | Description |
|---|---|---|---|
| officer | ForeignKey | on_delete=CASCADE | Patrolling officer (`related_name='patrols'`) |
| location | CharField(255) | | Patrol area name |
| start_time | DateTimeField | auto_now_add=True | Session start timestamp |
| end_time | DateTimeField | blank, null | Session end timestamp |
| status | CharField(20) | choices, default='IN_PROGRESS' | Lifecycle. Choices: `IN_PROGRESS`, `COMPLETED`, `CANCELLED` |
| checkpoints_data | JSONField | blank, default=list | Array of checkpoint objects |
| trail_coordinates | JSONField | blank, default=list | Array of [lng, lat] GPS breadcrumbs |
| distance_km | FloatField | default=0.0 | Total km traveled (Haversine) |
| shift_type | CharField(50) | blank, null | Morning / Afternoon / Evening |
| notes | TextField | blank, null | Officer notes |
| photos_count | IntegerField | default=0 | Evidence photos captured |
| violations_count | IntegerField | default=0 | Violations recorded during patrol |

---

## 5. API Endpoints

### 5.1 Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/mock-login/` | Defense demo login (bypasses MSAL) |

### 5.2 Users (`/api/users/`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `search/?q=` | Search by student number or name |
| GET | `profile-by-email/?email=` | MSAL identity resolution |
| GET | `list/?college=` | All students (filterable by college) |
| GET | `users/?role=` | All users filtered by role |
| GET | `colleges/` | Distinct college names |

### 5.3 Violations (`/api/violations/`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `assess/?student_id=&rule_code=` | **Intelligent Assessment** (escalation + duplicate detection) |
| POST | `record/` | Create a new violation record |
| GET | `list/?email=&student_id=&college=` | Filtered violation list |
| PATCH | `{id}/update-status/` | Change case status |
| PATCH | `{id}/assign/` | Assign officer to case |
| GET | `heatmap/?date_from=&date_to=&category=` | GeoJSON for Mapbox (with location_summary) |
| GET | `locations/?grouped=true` | All 52 campus building names |
| GET | `statistics/?today=true` | Quick violation category counts |

### 5.4 Patrols (`/api/patrols/`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `list/` | All patrol sessions |
| POST | `/` | Create new patrol session |
| POST | `{id}/end_session/` | End active patrol |
| GET | `statistics/` | KPIs (total, completed today, avg duration, photos, coverage %) |
| GET | `patrolled_today/` | Distinct locations patrolled today |

### 5.5 Handbook (`/api/handbook/`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `rules/` | All 82 handbook entries |
| GET | `smart-search/?q=` | Hybrid semantic + lexical search |

### 5.6 Analytics (`/api/analytics/`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `officer-dashboard/` | Officer-level stats |
| GET | `admin-dashboard/?college=&range=` | Full admin analytics (14 data sections) |
| GET | `college-report/?college=` | Per-college PDF download (ReportLab) |

### 5.7 AI Assistant (`/api/ai/`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `chat/` | Gemini-powered handbook Q&A |

---

## 6. Frontend Architecture

### 6.1 Routing Structure (React Router v7)

**Student Portal** (`/student/*`)
| Route | Component | Description |
|---|---|---|
| `/dashboard` | StudentDashboard | Academic standing + recent violations |
| `/profile` | StudentProfile | Personal info grid |
| `/violations` | StudentViolations | Violation history with resolutions |
| `/handbook` | StudentHandbook | Searchable accordion of rules |
| `/chatbot` | ChatBot | AI Curator (Gemini-powered Q&A) |
| `/settings` | StudentSettings | Notification preferences, security |

**Officer Portal** (`/officer/*`)
| Route | Component | Description |
|---|---|---|
| `/dashboard` | OfficerDashboard | Daily stats, quick actions |
| `/violations/new` | RecordViolation | Full violation recording flow (scanner + form) |
| `/cases` | CaseManagement | Case table with adjudication modal |
| `/students` | StudentRecords | Student directory with college filter |
| `/students/:id` | StudentProfileDetail | Individual student deep-dive |
| `/reports` | ReportsAnalytics | Charts, trends, college PDF export |
| `/patrols` | PatrolMonitoring | Active patrol dashboard |
| `/patrols/select` | MobilePatrolFlow | Area selection with heatmap |
| `/patrols/live` | MobilePatrolFlow | Live GPS tracking + camera |
| `/patrols/summary` | MobilePatrolFlow | Post-patrol summary with map |
| `/patrol-history` | PatrolHistory | Historical patrol sessions |
| `/campus-map` | MapTrial | Violation heatmap (Mapbox) |
| `/live-navigation` | LiveNavigation | Full-screen GPS navigation |

**Admin Portal** (`/admin/*`)
| Route | Component | Description |
|---|---|---|
| `/dashboard` | AdminDashboard | Director Command Center (KPIs, alerts) |
| `/cases` | CaseManagement (admin) | Full adjudication with §27.3.5 routing |
| `/students` | StudentRecords (admin) | Complete student management |
| `/analytics` | ReportsAnalytics (admin) | Full analytics with college PDF |
| `/patrols` | PatrolHistory (admin) | Patrol oversight |
| `/campus-map` | MapTrial | Heatmap analytics |
| `/handbook` | StudentHandbook (admin) | Handbook reference |
| `/users` | (Placeholder) | User management (pending) |

### 6.2 Component Summary (10,570+ lines of JSX)
| Component | Lines | Key Features |
|---|---|---|
| MobilePatrolFlow | 2,635 | 6-screen mobile patrol (select → live → camera → summary → history) |
| RecordViolation | 1,188 | Barcode scanner, smart search, assessment engine, location picker |
| CaseManagement | 1,036 | Case table, adjudication modal, portal-based overlay, 5-status workflow |
| ReportsAnalytics | 538 | Recharts visualizations, SMA trendline, college PDF button |
| MapTrial | 466 | Mapbox heatmap with clustering, date/category filters |
| StudentRecords | 445 | Student directory with college filter and violation counts |
| PatrolHistory | 396 | Patrol session list with detail view |
| SignIn | 390 | MSAL SSO + Mock login for 3 roles |
| OfficerDashboard | 335 | Daily KPIs + quick actions |
| ChatBot | 331 | Gemini-powered Q&A with suggested prompts |
| PatrolMonitoring | 327 | Active patrol grid |
| StudentViolations | 327 | Student's personal violation timeline |
| AdminDashboard | 315 | Director Command Center |
| LiveNavigation | 303 | Full-screen GPS with trail rendering |
| ViolationsOverTimeChart | 288 | Recharts time-series sub-component |
| StudentProfileDetail | 281 | Individual student deep-dive page |
| StudentDashboard | 268 | Student home with cards |
| StudentProfile | 248 | Profile info grid |
| StudentSettings | 248 | Settings page |
| StudentHandbook | 205 | Accordion with search |
| BarcodeScanner | ~150 | html5-qrcode wrapper component |

### 6.3 Layouts
| Layout | Description |
|---|---|
| StudentLayout | Sidebar (270px) + topbar (72px), Plus Jakarta Sans typography, `#003624` primary |
| OfficerLayout | Same structure, officer nav items, patrol quick-launch |
| AdminLayout | Director-grade layout with oversight navigation |

### 6.4 Design System ("Academic Curator")
- **Primary:** `#003624` (dark forest green)
- **Surface:** `#f2fcf8` (mint background)
- **Cards:** Pure `bg-white` (never faint green tints)
- **Typography:** Plus Jakarta Sans (headings), Manrope (body)
- **Scale:** Global 90% scaling for high-density aesthetic
- **Borders:** "No-Line Rule" — boundaries via background shifts, not 1px borders
- **Shadows:** Ambient shadow using `on-surface` (#141d1c) tint

---

## 7. Authentication Flow

### 7.1 Production (MSAL SSO)
```
Student → Microsoft Login → @dlsud.edu.ph verified
       → AuthContext extracts preferred_username (email)
       → GET /api/users/profile-by-email/?email=...
       → Backend: User.objects.get(email=...) → StudentProfile (1:1 FK)
       → Frontend receives: student_number, course, year_level, risk_score
```

### 7.2 Defense Demo (Mock Login)
```
Login Page → Search bar (55 seeded students)
          → Select student → loginAsMock(student)
          → localStorage stores {name, email, role}
          → AuthContext.currentUser resolves from localStorage
          
Officer/Admin → Dedicated buttons with pre-seeded accounts
             → loginAsOfficer() / loginAsAdmin()
```

**Priority:** Real MSAL account always overrides mock data. Mock storage is cleared when MSAL is detected.

---

## 8. Core Workflows

### 8.1 Violation Recording Flow
```
1. Officer opens RecordViolation
2. SCAN: Camera barcode scan (html5-qrcode) OR manual student number entry
3. IDENTIFY: API search → exact match on student_number → auto-populate profile
4. SELECT RULE: Smart Search (type "smoking" → VSM returns §27.x matches with % score)
                OR Manual dropdown (all 82 rules)
5. FILL FORM: Location (52-building dropdown), description, date/time
6. ASSESS: GET /api/violations/assess/?student_id=X&rule_code=Y
   → Backend counts prior violations
   → Returns: recommendation, instance_number, is_escalated, is_duplicate
   → If duplicate: amber modal (Discard / Proceed)
   → If escalated: red warning (§27.3.1.43 or §27.3.5)
7. SUBMIT: POST /api/violations/record/
   → Violation persisted with case_summary and corrective_action
```

### 8.2 Patrol Flow (Mobile)
```
1. Officer taps "Start Patrol" → SelectAreaScreen
2. MAP LOADS: Fetches violation heatmap GeoJSON + today's patrolled locations
3. AI SUGGESTED ROUTE: Top 5 unpatrolled high-risk buildings displayed
4. TAP BUILDING: Proximity cascade generates 4 nearby checkpoints (risk-ranked)
5. CONFIRM AREA → LiveMapScreen
   → GPS watchPosition tracks officer in real-time
   → Haversine accumulates distance (jitter filter < 2m)
   → Trail rendered as glowing line on Mapbox
   → Checkpoints auto-marked "Secured" within 30m proximity
6. CAMERA: WebRTC capture → Canvas watermark (timestamp + GPS breadcrumb) → base64
7. END PATROL → DynamicSummaryScreen
   → Duration, distance, trail map, shift type
   → Export as PNG (html2canvas)
   → Save to backend (POST /api/patrols/)
```

### 8.3 Case Adjudication Flow
```
1. Officer/Admin opens CaseManagement
2. Cases displayed in table with status pills (OPEN/AWAITING/RENDERED/CLOSED/DISMISSED)
3. Click case → CaseDetailModal (ReactDOM.createPortal)
4. ASSIGN: Officer assignment with automated labeling
5. STATUS TRANSITIONS:
   OPEN → AWAITING_DECISION (escalate to Director)
   AWAITING_DECISION → DECISION_RENDERED (Director selects Sanction 1-4 + remarks)
   DECISION_RENDERED → CLOSED (sanctions fulfilled)
   Any → DISMISSED (case dropped)
6. Director decisions persist to director_sanction and director_remarks fields
7. Students see verdict in their StudentViolations view
```

### 8.4 Analytics & Reporting Flow
```
1. Admin opens ReportsAnalytics
2. COLLEGE FILTER: Dynamic dropdown from /api/users/colleges/
   → All KPIs, charts, leaderboard re-scope to selected college
3. VISUALIZATIONS:
   - Temporal trend (Recharts AreaChart + 7-day SMA + spike detection)
   - Status distribution (donut chart)
   - College comparison (bar chart — always unfiltered)
   - Risk Score Leaderboard (top 10 by Temporal Decay score)
   - Recidivism Patterns (Apriori-inspired association rules)
   - Policy Breakdown (Minor/Major/Traffic distribution)
4. PDF EXPORT: "Generate College Report" button (appears when college selected)
   → GET /api/analytics/college-report/?college=X
   → ReportLab generates 6-section branded PDF
   → Direct browser download
```

---

## 9. Algorithms (Reference)

Full mathematical specifications are in `algorithm_specification.md`. Summary:

### Major Algorithms
1. **Risk-Driven Patrol Route Optimization** — Greedy Nearest Neighbor with violation-frequency weighting and cascading proximity radius (40m→500m). Deduplicates already-patrolled locations.
2. **Temporal Decay Risk Scoring** — Exponential decay: `weight = severity × e^(-0.023 × days) × unresolved_multiplier`. 30-day half-life. Score 0–100.

### Supporting Algorithms
| # | Algorithm | Location |
|---|---|---|
| 1 | Hybrid Semantic Search (VSM + Cosine + Lexical) | `ai_assistant/algorithms.py` |
| 2 | Deterministic Escalation (§27 Penalty Ladder) | `violations/views.py` |
| 3 | Duplicate Case Detection (24h window) | `violations/views.py` |
| 4 | Recidivism Pattern Detection (Apriori) | `analytics/views.py` |
| 5 | Violation Seasonality (7-day SMA + spike) | `ReportsAnalytics.jsx` |
| 6 | Haversine Distance (GPS + jitter filter) | `LiveNavigation.jsx` |
| 7 | Forensic Watermarking (Canvas pixel buffer) | `MobilePatrolFlow.jsx` |
| 8 | Context-Injection NLP (Gemini chatbot) | `ai_assistant/services.py` |
| 9 | Identity Bridge (MSAL → DRF) | `AuthContext.jsx` → `users/views.py` |
| 10 | Cross-Category §27.3.5 Classification | `violations/views.py` |
| 11 | Traffic Silo Logic (§27.4) | `violations/views.py` |
| 12 | Rolling Window Analytics (zero-fill) | `analytics/views.py` |

---

## 10. Data Seeding

| Script | Records | Purpose |
|---|---|---|
| `seed_students.py` | 51 students | Realistic college/course distribution across 8 colleges |
| `seed_officers.py` | 4 officers | SWAFO patrol officers + Director account |
| `seed_violations.py` | 151 violations | Weighted hotspot distribution (ICTC, Julian Felipe weighted higher) + Apriori behavioral pattern injection (5 sequences) + 60-day temporal spread |
| `seed_patrols.py` | ~10 sessions | Historical patrol data with trail coordinates |
| `bulk_seed_full_handbook.py` | 82 rules | All Section 27 rules with penalty tiers |
| `master_system_snapshot.json` | All | Django fixture for perfect 1:1 sync across machines |

**Campus Locations:** 52 buildings mapped in `constants/locations.py` with GPS coordinates sourced from OpenStreetMap.

---

## 11. Institutional Status Logic

### 11.1 Case Lifecycle (Per-Violation)
```
OPEN → AWAITING_DECISION → DECISION_RENDERED → CLOSED
                                              → DISMISSED
```

| Status | Phase | Meaning |
|---|---|---|
| OPEN | Investigation | Officer gathering facts |
| AWAITING_DECISION | Escalation | Waiting for Director |
| DECISION_RENDERED | Fulfillment | Sanctions issued, student must comply |
| CLOSED | Terminal | Sanctions fulfilled, case archived |
| DISMISSED | Terminal | Case dropped by Director |

### 11.2 Student Compliance Standing
| Label | Condition | Implication |
|---|---|---|
| 🟢 Good Standing | 0 violations | Clean record |
| 🟢 Cleared Record | 0 active, total > 0 | All cases closed |
| 🟡 Has Obligation | Active violations exist | Blocks §14 Clearance |
| 🔴 Repeat Offender | Total ≥ 2 | Flagged in risk scoring |
| ⛔ Probation | Total ≥ 5 | Habitual pattern, requires intervention |

---

## 12. Environment Configuration

### Backend (`backend/.env`)
```
DJANGO_SECRET_KEY=<secret>
GEMINI_API_KEY=<google-ai-key>
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=http://localhost:8000
VITE_MAPBOX_TOKEN=pk.eyJ1IjoidGltb3RoeWRldmNhc3RybyIs...
```

---

## 13. File Structure

```
swafo-web-app/
├── backend/
│   ├── apps/
│   │   ├── ai_assistant/     # Gemini services, SmartSearchAlgorithm, chatbot
│   │   ├── analytics/        # Admin/Officer dashboards, PDF report generator
│   │   ├── handbook/          # HandbookEntry model, smart search endpoint
│   │   ├── patrols/           # PatrolSession model, statistics, GPS tracking
│   │   ├── users/             # User, StudentProfile, risk score serializer
│   │   └── violations/        # Violation model, assessment engine, heatmap
│   ├── config/                # Django settings, root URLs
│   ├── constants/             # locations.py (52 campus buildings with GPS)
│   ├── seed_*.py              # Data seeding scripts
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/
│   └── src/
│       ├── api/config.js      # Centralized API endpoints
│       ├── assets/            # dlsud-campus.json (GeoJSON boundary)
│       ├── components/        # BarcodeScanner.jsx (shared)
│       ├── context/           # AuthContext.jsx (MSAL + Mock)
│       ├── features/
│       │   ├── analytics/     # ReportsAnalytics, ViolationsOverTimeChart
│       │   ├── auth/          # SignIn (MSAL + Mock login)
│       │   ├── cases/         # CaseManagement (adjudication)
│       │   ├── chatbot/       # ChatBot (Gemini AI Curator)
│       │   ├── dashboard/     # Student, Officer, Admin dashboards
│       │   ├── handbook/      # StudentHandbook (accordion + search)
│       │   ├── maps/          # MapTrial (heatmap), LiveNavigation (GPS)
│       │   ├── patrols/       # PatrolMonitoring, PatrolHistory, mobile/
│       │   ├── profile/       # StudentProfile
│       │   ├── settings/      # StudentSettings
│       │   ├── students/      # StudentRecords, StudentProfileDetail
│       │   └── violations/    # RecordViolation, StudentViolations
│       ├── hooks/             # useColleges (shared college filter hook)
│       ├── layouts/           # StudentLayout, OfficerLayout, AdminLayout
│       └── App.jsx            # Root routing (3 portal branches)
│
├── algorithm_specification.md
├── progress.md
├── README_DEV.md
└── system_documentation.md    # ← This file
```

---

## 14. Stakeholders

| Name | Role | System Access |
|---|---|---|
| Mr. Ruel D. Elias | SWAFO Head | Admin Portal |
| Dr. Eric A. Vargas | SDAO Director | Admin Portal (adjudication) |
| Dr. Jacqueline L. Morta | OSS Representative | Read-only analytics |
| Rolando B. Barrameda | Thesis Adviser | N/A |
| SWAFO Officers | Field enforcement | Officer Portal (mobile patrol) |
| DLSU-D Students | Policy subjects | Student Portal (view violations, chatbot) |

---

## 15. Pending Features

| Feature | Status | Notes |
|---|---|---|
| Evidence file upload (S3/Cloudinary) | UI exists, backend not wired | Photo upload to cloud storage |
| User management (Admin CRUD) | Placeholder page exists | Create/edit/disable accounts |
| Full handbook DB loading | Frontend uses hardcoded + DB mix | Transition to 100% API-driven |
| Production deployment | Not started | Vercel + Railway + Supabase |
| "End Patrol" formal archival | Partial | Save + close session flow |
| Heatmap enhancements | Documented in heatmap_improvements.md | Temporal decay weighting, time slider, 3D extrusions |
