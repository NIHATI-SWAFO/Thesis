# plan.md — Tech Stack, Frameworks & Algorithms
> Last updated: April 13, 2026
> Project: SWAFO Violation Management Web App + Enhanced UWear
> Institution: De La Salle University-Dasmariñas (DLSU-D)

---

## 1. ARCHITECTURE OVERVIEW

```
┌─────────────────────┐        ┌──────────────────────────┐
│   React Frontend    │ ◄────► │   Django REST Backend     │
│   (Vite + Tailwind) │  API   │   (Django REST Framework) │
└─────────────────────┘        └──────────────────────────┘
                                          │
                               ┌──────────┴───────────┐
                               │     PostgreSQL DB     │
                               └──────────────────────┘
```

Two separate modules, one shared backend and database:
- **Module 1** — Enhanced UWear (AI detection pipeline, Python-based)
- **Module 2** — SWAFO Web App (React frontend + Django backend)

Future integration: Module 1 detection output → feeds into Module 2 violation recording

---

## 2. MODULE 2 — SWAFO WEB APP TECH STACK

### Frontend
| Area | Choice | Reason |
|---|---|---|
| Framework | **React** (via Vite) | Team has experience; component-based; fast dev setup |
| Styling | **Tailwind CSS** | Utility-first, consistent design, mobile-responsive |
| Routing | **React Router v6** | Standard for multi-page React apps |
| State Management | **Zustand** or Context API | Lightweight; suitable for role-based state |
| Barcode Scanning | **html5-qrcode** or **@ericblade/quagga2** | Browser camera-based barcode scanning, no extra hardware |
| HTTP Client | **Axios** | Clean API calls to Django backend |
| UI Components | **shadcn/ui** or **MUI** | Pre-built accessible components |
| Charts / Analytics | **Recharts** or **Chart.js** | Violation statistics and dashboard charts |

### Backend
| Area | Choice | Reason |
|---|---|---|
| Framework | **Django + Django REST Framework (DRF)** | Team has Python/Django experience; robust for REST APIs |
| Authentication | **Django SimpleJWT** | Token-based auth, supports role-based access |
| File/Evidence Upload | **Django + cloud storage (e.g., Cloudinary or S3)** | Handle photo evidence uploads |
| Image Capture / Timestamp | Custom React component + backend storage | Capture patrol photo with timestamp overlay on frontend |

### Database
| Area | Choice | Reason |
|---|---|---|
| Database | **PostgreSQL** | Relational, robust, works natively with Django |
| ORM | Django ORM (built-in) | Handles all DB queries through Python |

---

## 3. MODULE 1 — ENHANCED UWEAR TECH STACK

| Area | Choice | Status |
|---|---|---|
| Detection Algorithm | **[ TBD — YOLOv5 / YOLOv8 / other ]** | Not finalized |
| Programming Language | **Python** | Confirmed |
| Dataset Platform | **[ TBD — Roboflow or equivalent ]** | Likely Roboflow (same as UWear) |
| CV Library | **OpenCV** | Likely carried over from UWear |
| Deep Learning Framework | **PyTorch** | Likely carried over from UWear |
| Deployment | **[ TBD ]** | Not finalized |

> ⚠️ Module 1 tech stack is **not yet finalized**. Update this section once the detection algorithm and deployment approach are confirmed.

---

## 4. HOSTING & DEPLOYMENT OPTIONS

| Tier | Frontend | Backend | Database |
|---|---|---|---|
| Free | Vercel | Render or Railway | Supabase (PostgreSQL) |
| School Server | Nginx (static) | Gunicorn + Django | PostgreSQL (local) |
| Paid | Vercel | Railway or DigitalOcean | Managed PostgreSQL |

> ⚠️ Hosting option is **not yet finalized**. Choose based on school requirements and defense setup.

---

## 5. INTELLIGENT FEATURES — ALGORITHM PLAN

### 5.1 Patrol Route Optimization
- **Goal:** Suggest an efficient patrol path for SWAFO officers across university checkpoints
- **Approach:** [ TBD — graph-based algorithm, e.g., Dijkstra, TSP heuristic, or greedy nearest neighbor ]
- **Input:** List of patrol checkpoints / locations
- **Output:** Suggested patrol order / route
- **Status:** ⚠️ Not finalized

### 5.2 Duplicate Case Detection
- **Goal:** Flag if a newly submitted violation is similar to an existing case for the same student
- **Approach:** [ See algorithm_specification.md for Implementation Details ]
- **Input:** New violation details + student's existing violation history
- **Output:** Warning or flag if duplicate or near-duplicate found
- **Status:** ✅ **Implemented**

### 5.3 Corrective Action Recommendation
- **Goal:** Suggest an appropriate corrective action based on violation type and student's history
- **Approach:** Rule-based decision logic (e.g., if violation type = X and frequency = N, recommend Y)
- **Input:** Violation type, student violation count, violation severity
- **Output:** Recommended corrective action (e.g., warning, referral, suspension)
- **Status:** ⚠️ Not finalized — rule logic needs to be mapped from university handbook

### 5.4 Violation Analytics & Heatmap
- **Goal:** Visualize where and when violations are most frequent across the campus
- **Approach:** [ TBD — spatial clustering (e.g., K-means) or simple frequency aggregation by location ]
- **Input:** Violation records with location/timestamp data
- **Output:** Heatmap or chart on dashboard
- **Status:** ⚠️ Not finalized

### 5.5 Rule-Based Handbook Chatbot (Student Portal)
- **Goal:** Allow students to ask questions about the university handbook without manually browsing it
- **Approach:** [ TBD — rule-based keyword matching, or lightweight NLP-based retrieval ]
- **Input:** Student query
- **Output:** Relevant handbook section or answer
- **Status:** ⚠️ Not finalized — depends on availability of handbook in structured/digital form

---

## 6. DATABASE — KEY TABLES (Tentative)

```
Users
- id, name, email, role (student / officer / admin), college, department

Students
- user_id (FK), student_number, year_level, barcode_value

Violations
- id, student_id (FK), officer_id (FK), violation_type, description,
  evidence_url, handbook_ref, timestamp, location, case_summary,
  corrective_action, is_duplicate_flag

PatrolLogs
- id, officer_id (FK), area, start_time, end_time, photo_url,
  coordinates, duration

HandbookEntries
- id, section, title, content, violation_category

ChatbotLogs (optional)
- id, student_id (FK), query, response, timestamp
```

---

## 7. SYSTEM ROLES & ACCESS CONTROL

| Feature | Student | Officer | Admin |
|---|---|---|---|
| View own profile | ✅ | ✅ | ✅ |
| View own violations | ✅ | ❌ | ✅ |
| Scan student ID | ❌ | ✅ | ✅ |
| Record violation | ❌ | ✅ | ✅ |
| View all violations | ❌ | ✅ | ✅ |
| Patrol logging | ❌ | ✅ | ✅ |
| Dashboard / analytics | ❌ | limited | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| Access handbook | ✅ | ✅ | ✅ |
| Use chatbot | ✅ | ❌ | ❌ |

---

## 8. DEVELOPMENT METHODOLOGY

- **Agile** (same as UWear) — iterative sprints
- Start with core screens and flows, then layer in intelligent features
- Continuous testing with SWAFO personnel as primary users

---

## 9. PENDING DECISIONS (Update as finalized)

| Decision | Status |
|---|---|
| Detection algorithm (Module 1) | ⚠️ TBD |
| Dataset platform (Module 1) | ⚠️ Likely Roboflow |
| Hosting platform | ⚠️ TBD |
| State management library | ⚠️ Zustand vs Context API |
| UI component library | ⚠️ shadcn/ui vs MUI |
| Patrol route algorithm | ⚠️ TBD |
| Duplicate detection approach | ✅ Implemented (See algorithm_spec) |
| Handbook chatbot approach | ⚠️ TBD |
| Heatmap / analytics approach | ⚠️ TBD |
| Module 1 + Module 2 integration method | ⚠️ TBD |
