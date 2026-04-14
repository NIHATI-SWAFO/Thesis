# MODULE 2 — SWAFO Web Application Development Progress

**Project:** Development of a Standalone SWAFO Web Application for Violation Management  
**Institution:** De La Salle University-Dasmariñas (DLSU-D)  
**Stakeholders:** Mr. Ruel D. Elias (SWAFO), Dr. Eric A. Vargas (SDAO), Dr. Jacqueline L. Morta (OSS)  
**Adviser:** Rolando B. Barrameda  
**Stack:** React (Vite) + Tailwind CSS | Django + DRF | PostgreSQL  

> Source: `additional context/plan.md`, `project_context.md`, `research.md`
> **Current Focus & Status:** Actively implementing the SWAFO Officer Portal Frontend components (Case Management & Record Violation). We are moving through the Figma designs using the MCP with no major blockers. The current step is finalizing the remaining Officer views before backend mapping.

---

## 1. AUTHENTICATION & ACCESS CONTROL

### Role-Based Login
- [x] Implement Microsoft MSAL SSO (redirect method) for Student login
- [ ] Implement Officer login flow (role-based)
- [ ] Implement Admin login flow (role-based)
- [ ] Secure session management with Django SimpleJWT token-based auth
- [ ] Enforce role-based route protection (Student / Officer / Admin)

### Access Control Matrix (from `research.md` §7)
| Feature | Student | Officer | Admin | Status |
|---|---|---|---|---|
| View own profile | ✅ | ✅ | ✅ | 🟡 Frontend only |
| View own violations | ✅ | ❌ | ✅ | 🟡 Frontend only |
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
- [ ] Connect to live backend API for real student data

### Academic Profile — *"View personal profile"*
- [x] Student detail grid with avatar, ID, email, program info
- [x] Pure white cell contrast against mint background
- [ ] Connect to live backend API for real profile data
- [ ] "Export Profile" button logic

### Violation Records — *"View violation history with case summaries"*
- [x] Stats cards and violation list UI
- [x] Fixed contrast/blending issues with `#f2fcf8` background
- [ ] Connect to backend to fetch actual per-student violation history
- [ ] Display case summaries and corrective action per violation

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
- [ ] Connect to actual backend chatbot engine (rule-based keyword matching or lightweight NLP retrieval)
- [ ] Return real handbook sections as answers with page/section references

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
- [ ] Map mock data to `DRF` API responses once backend is built.
> **Approach & Findings:** Used an asymmetric grid layout (`flex-col xl:flex-row`) pitting the Case Table against utility widgets (Priority Breakdown, Recent Activity). Discovered that this desktop layout looks visually perfect only when the table contains ~10 rows (added expanded mock data) to balance vertical height against the sidebars.

### Violation Recording
- [x] Setup base layout, aesthetic spacing, and generic data fields matching Figma designs (`RecordViolation.jsx`).
- [x] Map input groupings properly, implement strict `bg-white` and vertical green accent bars for consistency.
- [ ] Barcode scanner (camera-based, browser) using `html5-qrcode` or `@ericblade/quagga2`
- [ ] Auto-retrieve student profile from scanned barcode (name, college, department)
- [ ] Violation type dropdown selector + manual entry option
- [ ] Written statement / description field
- [ ] Evidence upload (photo/file) via cloud storage (S3/Cloudinary)
- [ ] Map each violation to a university handbook entry
> **Approach:** Extreme high-fidelity visual matching utilizing the Figma developer MCP. Prioritized spacing, typographic hierarchy, and custom accent elements.

### Patrol Monitoring
- [ ] "Start Patrol" button to initiate a patrol session
- [ ] Select patrol area/checkpoint within university
- [ ] Timestamped patrol photo capture (overlay: date, time, location, GPS coordinates)
- [ ] "End Patrol" button to close session
- [ ] System records patrol count, duration, and full patrol history
- [ ] Replace SWAFO's current third-party timestamp app with built-in solution

### System Output After Violation Submission
- [ ] Auto-generated **case summary** of the incident
- [ ] **Corrective action recommendation** based on violation type, student history, severity
- [ ] **Duplicate case detection** — flag if student has a prior similar violation

---

## 4. ADMIN DASHBOARD (Not Started)

> Requirement source: `research.md` §7 — Reporting Dashboard (Admin)

- [ ] Summary of all reported violations
- [ ] Violation statistics and trends (charts via Recharts or Chart.js)
- [ ] Patrol log summary and officer activity
- [ ] User management interface (Students, Officers, Admins)

---

## 5. INTELLIGENT FEATURES / ALGORITHMS (Not Started)

> Requirement source: `research.md` §7 — Intelligent Features; `plan.md` §5  
> These are the CS thesis highlights for defense

### 5.1 Patrol Route Optimization
- [ ] Graph-based algorithm (Dijkstra, TSP heuristic, or greedy nearest neighbor)
- [ ] Input: list of patrol checkpoints/locations
- [ ] Output: suggested patrol order/route

### 5.2 Duplicate Case Detection
- [ ] Rule-based matching or string similarity (e.g., Levenshtein) or embedding-based
- [ ] Input: new violation details + student's existing violation history
- [ ] Output: warning/flag if duplicate or near-duplicate found

### 5.3 Corrective Action Recommendation
- [ ] Rule-based decision logic mapped from university handbook
- [ ] Input: violation type, student violation count, violation severity
- [ ] Output: recommended action (warning, referral, suspension)

### 5.4 Violation Analytics & Heatmap
- [ ] Spatial clustering (K-means) or frequency aggregation by location
- [ ] Input: violation records with location/timestamp data
- [ ] Output: heatmap or chart on admin dashboard

### 5.5 Rule-Based Handbook Chatbot
- [ ] Rule-based keyword matching or lightweight NLP-based retrieval
- [ ] Input: student query
- [ ] Output: relevant handbook section or answer

---

## 6. BACKEND & DATABASE (Not Started)

> Requirement source: `plan.md` §2 Backend, §6 Database

### Django + DRF Setup
- [ ] Initialize Django project with Django REST Framework
- [ ] Configure PostgreSQL database connection
- [ ] Implement Django SimpleJWT authentication

### Database Tables (from `plan.md` §6)
- [ ] `Users` — id, name, email, role (student/officer/admin), college, department
- [ ] `Students` — user_id (FK), student_number, year_level, barcode_value
- [ ] `Violations` — id, student_id, officer_id, violation_type, description, evidence_url, handbook_ref, timestamp, location, case_summary, corrective_action, is_duplicate_flag
- [ ] `PatrolLogs` — id, officer_id, area, start_time, end_time, photo_url, coordinates, duration
- [ ] `HandbookEntries` — id, section, title, content, violation_category
- [ ] `ChatbotLogs` — id, student_id, query, response, timestamp (optional)

### API Endpoints
- [ ] Student profile CRUD
- [ ] Violation submission and retrieval
- [ ] Patrol log recording
- [ ] Handbook content retrieval
- [ ] Chatbot query processing

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
