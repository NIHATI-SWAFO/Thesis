# SWAFO Academic Portal & UWear Enhancement Progress Tracking

**Project Title:** Development of a Standalone SWAFO Web Application for Violation Management and Enhancement of UWear for Uniform Compliance Monitoring at De La Salle University-Dasmariñas
**Institution:** De La Salle University-Dasmariñas (DLSU-D)
**Offices:** SWAFO, OSS, SDAO

---

## 1. MODULE 1: ENHANCED UWEAR (AI Detection Pipeline)

### Core Detection Enhancements
- [ ] Evaluate and select the precise object detection algorithm (e.g., YOLOv5 vs. YOLOv8).
- [ ] Aggregate dataset via Roboflow (combining primary self-gathered data + secondary sources).
- [ ] Train AI for full-body uniform compliance (moving beyond basic upper-body detection).
- [ ] Train AI to detect valid civilian attire restrictions during wash days.

---

## 2. MODULE 2: SWAFO WEB APP (Frontend & UI)

### Authentication & Architecture
- [x] Set up React 19 + Vite + TailwindCSS.
- [x] Finalize `App.jsx` React Router v6 architecture with protected routes.
- [x] Integrate Microsoft MSAL SSO (Redirect method, `@dlsud.edu.ph` cross-tenant handling).
- [x] Setup global typography standards (Plus Jakarta Sans, Manrope).

### Student Portal UI implementation (The "Academic Curator" Design)
- [x] **Global Layout**: Built `StudentLayout.jsx` with custom `270px` sidebar, matching strict topbar constraints. Implemented global 90% scaling.
- [x] **Dashboard Module**: Finalized high-density cards, matching scale and padding requirements without sharp 1px borders.
- [x] **Violation Records Module**: Built the history table, implementing specific `surface-container-lowest` color shifts. 
- [x] **Academic Profile Module**: Tightened padding, refined the student detail grid metrics.
- [x] **Campus Handbook Module**: Engineered state-driven accordions that enforce pure `bg-white` on expansion to avoid off-green blending against `#f2fcf8` background. Fixed gradient/shine layout on main headers natively.
- [x] **System Configuration (Settings)**: 
    - Replicated system layout fidelity 1:1.
    - Implemented Deep Green verification card with subtle 15% opacity `shield` background watermark.
    - Added custom Notification toggles and active Session mapping pills.
- [x] **AI Curator (Chatbot)**:
    - Entirely rebuilt the interface matching the requested 2-column layout.
    - Implemented Chatbot functionality mapping: 5 interactive Suggested Prompts update the primary message stream natively.

---

## 3. PENDING: SWAFO WEB APP (Backend & Officer Features)

### Platform API & Database Layer (Django/Postgres)
- [ ] Setup Django + Django REST Framework (DRF) environment.
- [ ] Configure PostgreSQL database mapping to defined models (Users, Students, Violations, PatrolLogs, HandbookEntries).
- [ ] Secure file/evidence upload to robust cloud storage (S3/Cloudinary).

### SWAFO Officer / Admin Tools
- [ ] **ID Barcode Scanner**: Integrate `html5-qrcode` or `Quagga2` for automated student lookup.
- [ ] **Violation Encoder**: Officer form to submit active cases linked to scanned IDs.
- [ ] **Patrol System**: Build custom timestamping interface overriding the third-party application limitation (capturing photo, GPS, datetime natively).

### Intelligent Features & Algorithms
- [ ] **Patrol Route Optimization**: Build graph-based logic (Dijkstra/greedy) for patrol suggestions.
- [ ] **Duplicate Case Detection**: Build string similarity matching to flag recurring violation submissions automatically.
- [ ] **Corrective Action Recommendation**: Map DLSU-D handbook rules into decision-tree logic to suggest automated actions.
- [ ] **Violation Analytics & Heatmap**: Aggregate location/time data via clustering on a global dashboard map.
- [ ] Connect the Student Chatbot UI to actual automated rule-retrieval APIs.

---

## 4. DESIGN & TECHNICAL DEVIATIONS (Project Governance)

- **Color/Space Rule Affirmation**: We strictly bypassed standard Tailwind defaults, enforcing a custom `primary` and `surface` map preventing component blending. Replaced harsh dividing borders entirely with background color shifts.
- **Module 2 Integration Focus**: Everything deployed this week strictly falls under Module 2 (Web UI layer). Connection to Module 1 (AI Pipeline) remains pending.
