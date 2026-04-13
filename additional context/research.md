# research.md — Requirements & Ideas
> Last updated: April 13, 2026
> Project: SWAFO Violation Management Web App + Enhanced UWear
> Institution: De La Salle University-Dasmariñas (DLSU-D)

---

## 1. PROJECT OVERVIEW

A two-module CS thesis system aimed at modernizing student discipline monitoring and enforcement at DLSU-D.

- **Module 1** — Enhancement of UWear (AI-based uniform compliance detection)
- **Module 2** — SWAFO Violation Management Web Application (standalone web app)

---

## 2. BACKGROUND & CONTEXT

- DLSU-D's School Uniform and Dress Code Policy took effect **September 1, 2025**
- 1st–3rd year students must wear prescribed uniform on **Monday, Tuesday, Thursday**
- 4th year students may wear civilian attire but may opt to wear uniform
- SWAFO currently operates **entirely on paper** — patrol, ID checking, violation recording
- SWAFO uses a **third-party timestamp app** (not built for their workflow) as patrol proof
- The barcode already present on student IDs is a key asset to leverage

---

## 3. KEY STAKEHOLDERS

| Name | Role |
|---|---|
| Mr. Ruel D. Elias | Director, Student Welfare and Formation Office (SWAFO) |
| Dr. Eric A. Vargas | Director, Student Development and Activities Office (SDAO) |
| Dr. Jacqueline L. Morta | Dean, Office of Student Services (OSS) |
| Rolando B. Barrameda | Thesis Adviser (also advised UWear) |

---

## 4. PRIOR WORK — UWEAR

| Field | Detail |
|---|---|
| Full Title | UWear: A Real-Time Dress Code Compliance System for College Students at DLSU-D Using YOLO-v5 |
| Authors | Rafael Jan M. Dancel, Angel Gabriel T. Kahulugan, Caleb Emmanuel C. Viernes |
| Year | 2024 |
| Adviser | Rolando B. Barrameda |
| Model | YOLOv5 |
| Type | Local Python application |
| Tools | OpenCV, PyTorch, Roboflow |
| Methodology | Agile, Mixed-methods |

### UWear Best Results (Epoch 45)
- mAP@0.5 = 0.7883
- Precision = 0.7336
- Recall = 0.7881

### UWear Limitations
- Upper torso detection only (not full-body)
- General dress code monitoring, not policy-specific uniform compliance
- 2D frames only, affected by lighting, obstruction, camera angle
- Limited to full-frontal views
- Does not cover full range of prohibited clothing items
- Not aligned with the current uniform policy conditions (uniform days vs civilian days)

---

## 5. RESEARCH GAPS

- UWear does not support full-body official uniform compliance
- No policy-aware checking (uniform day vs civilian/wash day conditions)
- SWAFO has no dedicated digital system for violation management
- No centralized records for patrol logs, violations, and case management
- No integrated system connecting monitoring → recording → analytics

---

## 6. MODULE 1 — ENHANCED UWEAR REQUIREMENTS

### Detection Goals
- Full-body uniform component detection (upper and lower torso)
- Uniform day detection: proper school uniform compliance
- Civilian/wash day detection: proper civilian attire (upper and lower torso)
- Policy-aware classification based on day type and year level

### Dataset Direction
- Combine **primary data** (self-gathered images and videos) and **secondary data sources**
- Focus on full-body uniform components and civilian attire variations
- Use a dataset platform (e.g., Roboflow) for preprocessing, annotation, and augmentation

### Clothing Categories to Cover (based on UWear + expansion)
- School uniform top
- School uniform bottom (pants/skirt)
- Civilian top (short sleeve, long sleeve)
- Civilian bottom (trousers, skirts, shorts)
- Accessories / ID lace (if applicable)

### Evaluation Metrics (to match or exceed UWear)
- Precision
- Recall
- mAP@0.5
- mAP@0.5:0.95

---

## 7. MODULE 2 — SWAFO WEB APP REQUIREMENTS

### User Roles
- **Student** — view profile, view violation history, access handbook, use chatbot
- **SWAFO Officer** — record violations, conduct patrol, scan IDs
- **SWAFO Admin** — full access, dashboard, analytics, manage records

### Core Features

#### Authentication
- Role-based login (Student / Officer / Admin)
- Secure session management

#### Student Portal
- View personal profile
- View violation history with case summaries
- Download or access university handbook
- Rule-based chatbot for handbook Q&A *(idea, not finalized)*

#### SWAFO Officer — Patrol Monitoring
- "Start Patrol" button to initiate a patrol session
- Select patrol area or checkpoint within the university
- Take a **timestamped patrol photo** as proof (overlay: date, time, location, coordinates)
- "End Patrol" button to close session
- System records: patrol count, duration, patrol history

#### SWAFO Officer — Violation Recording
- Scan barcode on student ID (camera-based, browser)
- Auto-retrieve student profile: name, college, department
- Select violation from dropdown or enter manually
- Add written statement or description
- Upload evidence (photo/file)
- Map violation to university handbook entry

#### System Output After Violation Submission
- **Case summary** — auto-generated summary of the incident
- **Corrective action recommendation** — suggested action based on violation type
- **Duplicate case detection** — flag if student has a prior similar violation

#### Violation Records
- Per-student violation history
- Stores case summary and corrective action
- Linked to reporting dashboard

#### Reporting Dashboard (Admin)
- Summary of reported violations
- Violation statistics and trends
- Heatmap of violation locations or frequency *(idea)*
- Patrol log summary

### Intelligent / Algorithm-Based Features *(CS thesis highlights)*
- **Patrol route optimization** — suggest efficient patrol paths *(algorithm TBD)*
- **Duplicate case detection** — detect if a case is similar to an existing one *(approach TBD)*
- **Corrective action recommendation** — rule-based logic tied to violation type and frequency *(logic TBD)*
- **Violation analytics and heatmap** — spatial or clustering-based analysis *(approach TBD)*
- **Rule-based handbook chatbot** — helps students query handbook content *(approach TBD)*

---

## 8. NON-FUNCTIONAL REQUIREMENTS

- Accessible via internet (web-based)
- Mobile-responsive (officers use it during patrol on phones/tablets)
- Secure data handling (student records, violation data)
- Fast barcode scanning (real-time or near real-time)
- Scalable for future use beyond dress code (e.g., attendance, safety)

---

## 9. IDEAS & NOTES (Ongoing)

- Timestamp feature inspired by a PNP-used third-party app that SWAFO currently uses
- Barcode on existing student IDs is already there — no new hardware needed
- The app should feel like a patrol tool, not just a records system
- Students having access to their own violation records promotes transparency
- SWAFO director also mentioned potential future use for safety and attendance tracking
- Module 1 and Module 2 should eventually be connected (detection output feeds into violation recording)

---

## 10. UN SDG ALIGNMENT (from UWear, carried forward)

- **SDG 4** — Quality Education: promotes discipline and professionalism
- **SDG 9** — Industry, Innovation, and Infrastructure: AI + web tech in campus management
- **SDG 10** — Reduced Inequality: consistent, unbiased enforcement
- **SDG 16** — Peace, Justice, Strong Institutions: transparent, fair policy enforcement
- **SDG 17** — Partnerships for the Goals: collaboration with university offices
