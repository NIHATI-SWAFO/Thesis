# SWAFO System: Algorithm Specification

**De La Salle University – Dasmariñas**  
**College of Science and Computer Studies**  
**Module 2: Intelligent Violation Management System**

**Document Version:** 2.0  
**Status:** Implementation Complete  
**Last Updated:** May 5, 2026

---

## Table of Contents

1. [Introduction](#1-introduction)
2. **MAJOR ALGORITHM I** — [Risk-Driven Patrol Route Optimization](#2-major-algorithm-i--risk-driven-patrol-route-optimization)
3. **MAJOR ALGORITHM II** — [Temporal Decay Risk Scoring](#3-major-algorithm-ii--temporal-decay-risk-scoring)
4. **SUPPORTING ALGORITHMS**
   - 4.1 [Hybrid Semantic Retrieval Engine (Smart Search)](#41-hybrid-semantic-retrieval-engine-smart-search)
   - 4.2 [Deterministic Escalation Engine (§27 Penalty Ladder)](#42-deterministic-escalation-engine-27-penalty-ladder)
   - 4.3 [Duplicate Case Detection](#43-duplicate-case-detection)
   - 4.4 [Recidivism Pattern Detection (Apriori-Inspired)](#44-recidivism-pattern-detection-apriori-inspired)
   - 4.5 [Violation Seasonality Analysis (Moving Average)](#45-violation-seasonality-analysis-moving-average)
   - 4.6 [Spherical Distance Calculation (Haversine Formula)](#46-spherical-distance-calculation-haversine-formula)
   - 4.7 [Forensic Watermarking (Canvas Pixel Buffer)](#47-forensic-watermarking-canvas-pixel-buffer)
   - 4.8 [Context-Injection NLP (Chatbot)](#48-context-injection-nlp-chatbot)
   - 4.9 [Institutional Identity Bridge (MSAL-to-DRF)](#49-institutional-identity-bridge-msal-to-drf)
   - 4.10 [Cross-Category Major Offense Classification (§27.3.5)](#410-cross-category-major-offense-classification-2735)
   - 4.11 [Traffic Offense Silo Logic (§27.4)](#411-traffic-offense-silo-logic-274)
   - 4.12 [Temporal Analytics Aggregation (Rolling Window)](#412-temporal-analytics-aggregation-rolling-window)
5. [Technical Stack Summary](#5-technical-stack-summary)

---

## 1. Introduction

The SWAFO Violation Management System replaces the manual, paper-based patrol and disciplinary workflow at DLSU-D with an intelligent, algorithm-driven platform. The system's central purpose is to **optimize how SWAFO officers patrol the campus and enforce disciplinary policy** — from deciding which buildings to check first, to accurately scoring student risk, to automatically citing the correct handbook rule.

This document formally specifies each algorithm used in the system, organized into two tiers:

- **Major Algorithms**: The two core intelligent features that represent the primary CS thesis contributions. These are the flagship patrol-centric algorithms that define the system's identity — one optimizes *where* officers go, and the other quantifies *who* they should be monitoring.
- **Supporting Algorithms**: Complementary logic modules that enable the system's operational integrity, data quality, and real-time analytics. While individually simpler, they are necessary for the major algorithms to function within the institutional context.

---

## 2. MAJOR ALGORITHM I — Risk-Driven Patrol Route Optimization

### 2.1 The Problem

SWAFO officers currently patrol the DLSU-D campus with **no data-driven guidance**. They walk the same familiar routes every shift, often revisiting low-risk buildings out of habit while high-violation hotspots go unchecked. There is no mechanism to answer the question: *"Given my current position on campus, which building should I check next?"*

The campus has **52 mapped buildings**, and patrol time is limited (typically 2–4 hour shifts). Without optimization, officers waste time on low-risk zones while genuine hotspots accumulate violations undetected.

### 2.2 What Would Happen Without It

Without the Patrol Route Optimizer:
1. **Blind patrolling**: Officers choose routes based on personal preference or habit, not data.
2. **Cold zones**: High-violation buildings that are physically distant from the officer's usual route are systematically ignored.
3. **Redundant coverage**: Multiple officers may patrol the same building within hours while others go unchecked all day.
4. **No risk prioritization**: A building with 20 violations is treated the same as one with 0.

### 2.3 How It Works

The system implements a **Greedy Nearest Neighbor algorithm** enhanced with **violation-frequency risk weighting** and **real-time deduplication of already-patrolled locations**. The algorithm executes in three phases:

#### Phase 1 — Heatmap Data Ingestion

When an officer opens the patrol area selection screen, the system fetches the **GeoJSON violation heatmap** from the backend (`/api/violations/heatmap/`). This returns every violation record with its GPS coordinates and associated building name. The system also fetches today's **already-patrolled locations** (`/api/patrols/patrolled-today/`) to prevent redundant coverage.

The data is processed into a `locationData` array where each entry contains:
- Building name
- GPS coordinates (lng, lat)
- Violation count (used as risk weight)

> **Implementation**: `MobilePatrolFlow.jsx → SelectAreaScreen → useEffect` (Lines 550–618)

#### Phase 2 — AI Suggested Route (Global)

Before the officer selects any area, the system generates a **campus-wide suggested route** by:

1. **Filtering** out buildings with zero violations.
2. **Filtering** out buildings already patrolled today (case-insensitive match).
3. **Sorting** the remaining buildings by violation count in descending order (highest risk first).
4. **Selecting** the top 5 as the "AI Suggested Route."

$$Route_{suggested} = \text{Top-5}\left(\text{Sort}_{desc}\left(\{B \mid V_B > 0 \wedge B \notin P_{today}\}\right)\right)$$

Where $V_B$ is the violation count for building $B$, and $P_{today}$ is the set of already-patrolled locations.

> **Implementation**: `MobilePatrolFlow.jsx → SelectAreaScreen` (Lines 581–587)

#### Phase 3 — Proximity Checkpoint Cascade (Area-Specific)

Once the officer taps a building on the map, the algorithm generates a **localized patrol sequence** of up to 4 nearby checkpoints using a **cascading proximity radius**:

1. **Radius cascade**: The algorithm attempts to find nearby buildings within progressively expanding radii:
   - 40 meters → 100 meters → 250 meters → 500 meters
   - At each radius, if at least 1 building is found, the cascade stops.
   - **Final fallback**: If no buildings are within 500m, select the 4 closest by raw distance (no radius cap).

2. **Risk-weighted ranking**: Within the proximity pool, buildings are **sorted by violation count** (descending), not by distance. This ensures the officer visits the *most dangerous* nearby building first, not just the *closest* one.

3. **Output**: A patrol sequence of up to 5 checkpoints (the selected building + 4 nearby), each annotated with:
   - Building name
   - Risk label (Low / Moderate / High / Very High / Critical)
   - Violation count
   - GPS coordinates for map rendering

**Risk Classification Thresholds:**

| Violation Count | Risk Label | Color |
|-----------------|------------|-------|
| 0 – 3 | Low | 🟢 Green |
| 4 – 6 | Moderate | 🟡 Yellow |
| 7 – 10 | High | 🟠 Orange |
| 11 – 20 | Very High | 🔴 Red |
| 21+ | Critical | ⛔ Dark Red |

> **Implementation**: `MobilePatrolFlow.jsx → computeCheckpointsFromData()` (Lines 50–80)  
> **Proximity math**: `haversineKm()` (Lines 30–37) — Haversine great-circle distance

#### Phase 4 — Real-Time Patrol Execution

During the active patrol, the system provides:
- **Live GPS tracking** with breadcrumb trail visualization on Mapbox
- **Distance accumulation** using Haversine with micro-jitter filtering (< 2m discarded)
- **Elapsed time and pace calculation**: `pace = totalMinutes / distanceKm`
- **Violation heatmap overlay toggle** — officer can enable/disable the risk heatmap during patrol to see if they're approaching a hotspot
- **Checkpoint proximity detection**: checkpoints within 30m of the officer's position are auto-marked as "Secured"

> **Implementation**: `MobilePatrolFlow.jsx → LiveMapScreen` (Lines 1054+) and `LiveNavigation.jsx`

### 2.4 How It Improved the System

| Metric | Without Algorithm | With Algorithm |
|--------|-------------------|----------------|
| Route decision method | Officer intuition / habit | Data-driven risk ranking |
| Checkpoint prioritization | None — arbitrary walk order | Violation-weighted proximity cascade |
| Redundant coverage | Undetected — officers overlap | Today's patrolled locations excluded |
| Risk visibility during patrol | None — blind walking | Live heatmap overlay on Mapbox |
| Patrol documentation | Manual logbook | GPS trail + distance + time + forensic photos |

---

## 3. MAJOR ALGORITHM II — Temporal Decay Risk Scoring

### 3.1 The Problem

The SWAFO Director needs to quickly assess whether a student is an active behavioral risk or a historically reformed individual. The traditional method is to **count total violations** — but this metric is fundamentally misleading.

**Example**: Student A committed 3 violations last week. Student B committed 3 violations two years ago and has been clean since. A raw count of `3` treats both students identically. The Director would have to manually read through each violation's timestamp to understand the difference — an impractical task when monitoring hundreds of students.

### 3.2 What Would Happen Without It

Without the Temporal Decay algorithm:
1. **False equivalence**: A reformed student and an active repeat offender would appear identical on the dashboard.
2. **Manual timeline reading**: The Director would need to open each student's full history and mentally compute recency — a cognitive burden that does not scale.
3. **Delayed intervention**: Genuinely at-risk students would not be flagged in real-time because the system would have no way to distinguish between old and recent violations.
4. **Stale leaderboards**: The "Risk Score Leaderboard" would be meaningless if it ranked by raw counts instead of time-weighted severity.

### 3.3 How It Works

For every violation $V_i$ on a student's record, the algorithm computes a **risk weight** using exponential decay:

$$Weight(V_i) = S_i \times e^{(-\lambda \times t_i)} \times U_i$$

Where:

| Variable | Meaning | Values |
|----------|---------|--------|
| $S_i$ | **Severity Base Weight** — How serious the violation category is | Major = 30 pts, Minor = 15 pts, General = 10 pts |
| $\lambda$ | **Decay Rate** — Controls how fast a violation's influence fades | $0.023$ (chosen to produce a **30-day half-life**) |
| $t_i$ | **Time Elapsed** — Days since the violation occurred | Computed as `(now - timestamp) / 86400` |
| $U_i$ | **Unresolved Multiplier** — Boosts weight for active (non-terminal) cases | $1.5$ if status is `OPEN` or `AWAITING_DECISION`; $1.0$ if `CLOSED` or `DISMISSED` |

**Final Risk Score:**

$$TotalRisk = \min\left(100, \sum_{i=1}^{n} Weight(V_i)\right)$$

The score is capped at 100 to maintain a normalized scale.

### 3.4 Why λ = 0.023

The decay constant $\lambda = 0.023$ was specifically chosen because it gives the function a **30-day half-life**:

$$e^{-0.023 \times 30} \approx 0.50$$

This means a violation loses approximately 50% of its risk contribution after 30 days without a re-offense. This aligns with the university's academic month cycle — if a student goes a full month without incident, their risk profile should meaningfully decrease.

### 3.5 Score Interpretation

| Score Range | Risk Level | Color | Action |
|-------------|------------|-------|--------|
| 0 – 25 | **LOW** | 🟢 Green | Behaviorally stable. No action required. |
| 26 – 50 | **MODERATE** | 🟡 Amber | Emerging pattern. Flag for monitoring. |
| 51 – 75 | **HIGH** | 🟠 Orange | Active concern. Schedule counseling or intervention. |
| 76 – 100 | **CRITICAL** | 🔴 Red | Imminent risk. Recommend Clearance HOLD and §27.3.5 review. |

### 3.6 Where It Appears

The Temporal Decay Risk Score is surfaced across the entire system:
- **Director's Compliance Dashboard** — Risk Score Leaderboard showing the top at-risk students.
- **Per-College PDF Report** — Section 3 (Behavioral Risk Score) includes a risk distribution bar chart and top at-risk student table.
- **Student Profile API** — Every `StudentProfileSerializer` response includes the computed `risk_score`.
- **Patrol Route Optimizer** — The heatmap's per-building violation counts are derived from the same data pipeline that feeds the risk score.

> **Implementation**: `apps/users/serializers.py → StudentProfileSerializer.get_risk_score()` (Lines 78–105)

### 3.7 How It Improved the System

| Metric | Without Algorithm | With Algorithm |
|--------|-------------------|----------------|
| Risk assessment method | Raw violation count (misleading) | Time-weighted exponential decay (accurate) |
| Distinguishes old vs. recent | No | Yes — score naturally diminishes over time |
| Unresolved case urgency | Not factored | 1.5× multiplier for active cases |
| Director's cognitive load | Must read each student's full timeline | Single normalized score (0–100) |
| Proactive intervention | Impossible | Students scoring 76+ are automatically flagged |

---

## 4. Supporting Algorithms

### 4.1 Hybrid Semantic Retrieval Engine (Smart Search)

**Problem**: Officers must identify the correct handbook rule (out of 82) when recording a violation. They describe incidents in natural language ("smoking near the gate"), but the handbook uses formal taxonomy. Traditional keyword search fails because the words don't match.

**What happens without it**: Officers spend 2–5 minutes manually browsing rules, risking incorrect citations that undermine disciplinary action.

**How it works**: The algorithm combines two scoring functions into a weighted hybrid:

**Cosine Similarity (Semantic, 60% weight):**
$$S_{semantic} = \cos(\theta) = \frac{A \cdot B}{\|A\| \|B\|}$$

Each of the 82 rules is embedded into 768-dimensional vectors using Google's `gemini-embedding-001` model. The officer's query is embedded into the same space, and cosine similarity ranks the rules by meaning.

**Token Overlap & Containment (Lexical, 40% weight):**
$$S_{lexical} = (0.4 \times \frac{|Q \cap C|}{|Q|}) + (0.6 \times \frac{\text{containment matches}}{|Q|})$$

This catches exact matches that semantic search might miss (e.g., searching for rule code "27.1.3").

**Final Score:**
$$Score = (0.6 \times S_{semantic}) + (0.4 \times S_{lexical})$$

**Graceful degradation**: If the embedding API fails, the system falls back to 100% lexical scoring.

**Pre-warm cache**: On the first search, all 82 rule embeddings are batched and cached in server RAM, reducing subsequent searches from ~2.8s to < 0.3s (~90% latency reduction).

> **Implementation**: `apps/ai_assistant/algorithms.py → SmartSearchAlgorithm` and `apps/ai_assistant/services.py → GeminiService.semantic_search()`

---

### 4.2 Deterministic Escalation Engine (§27 Penalty Ladder)

**Problem**: The DLSU-D Handbook (Section 27) defines a strict penalty ladder — a student's 3rd minor offense automatically escalates to a Major offense (§27.3.1.43). Officers had to manually count prior violations before deciding the penalty.

**What happens without it**: Officers may issue incorrect penalties — under-penalizing repeat offenders or over-penalizing first-timers.

**How it works**: When a violation is assessed, the algorithm performs a state-based look-behind:
1. Count all prior violations of the same category for the student.
2. Map the count to the handbook's penalty ladder (Warning → 1st Minor → 2nd Minor → **Major Escalation**).
3. Cross-table tallying: traffic minor offenses reaching their 2nd instance count toward the total minor offense threshold.

> **Implementation**: `apps/violations/views.py → ViolationAssessmentView.get()` (Lines 69–91)

---

### 4.3 Duplicate Case Detection

**Problem**: In high-traffic patrols, an officer might accidentally log the same violation twice, or two officers might record the same incident independently.

**What happens without it**: Duplicate entries inflate the student's record, artificially triggering escalation sanctions.

**How it works**: The algorithm queries for any violation matching the **same student** AND **same rule** within a **24-hour temporal window**:

$$\text{Duplicate} = \exists V \mid V.student = S \wedge V.rule = R \wedge V.timestamp \geq (T_{now} - 24h)$$

If found, the officer receives an amber warning modal with **Discard** (nullify draft) or **Proceed** (legitimate re-offense) options.

> **Implementation**: `apps/violations/views.py → ViolationAssessmentView.get()` (Lines 124–143)

---

### 4.4 Recidivism Pattern Detection (Apriori-Inspired)

**Problem**: The Director needs to identify which violations tend to follow each other — are loitering violations "gateways" to uniform violations?

**What happens without it**: Discipline remains purely reactive — no ability to identify behavioral trends or intervene proactively.

**How it works**: The algorithm scans all repeat offenders' chronologically ordered histories and identifies frequent pairs $(A, B)$ where $A$ precedes $B$:

$$Confidence(A \rightarrow B) = \frac{Count(A, B)}{Count(A)}$$

Patterns with $Confidence > 10\%$ are surfaced as "Gateway Violations" on the Director's Dashboard and in the Per-College PDF Report.

> **Implementation**: `apps/analytics/views.py → AdminDashboardAPIView` (Lines 191–221)

---

### 4.5 Violation Seasonality Analysis (Moving Average)

**Problem**: A single spike in daily violations doesn't necessarily indicate a sustained trend. The Director needs to distinguish isolated peaks from genuine shifts.

**What happens without it**: Every daily spike appears equally alarming, making resource allocation impossible.

**How it works**: A **7-day Simple Moving Average (SMA)** smooths daily violation counts:

$$SMA_t = \frac{1}{7} \sum_{i=0}^{6} V_{t-i}$$

If $V_t > 1.5 \times SMA_t$, the system flags a **"Volume Spike"** (⚠). The implementation is calibrated to DLSU-D's Monday–Saturday schedule (Sunday is the only non-school day).

> **Implementation**: Frontend — `ReportsAnalytics.jsx` (SMA calculation and spike annotation)

---

### 4.6 Spherical Distance Calculation (Haversine Formula)

**Problem**: During live patrols, the system must calculate distance traveled. Flat-earth geometry (Pythagorean theorem) is mathematically incorrect for GPS coordinates on a spherical surface.

**What happens without it**: Distance calculations would be inaccurate, and GPS noise would artificially inflate the total.

**How it works**:

$$Distance = R \times 2 \times \text{atan2}\left(\sqrt{a}, \sqrt{1-a}\right)$$

Where $R = 6371$ km and $a = \sin^2(dLat/2) + \cos(lat_1) \times \cos(lat_2) \times \sin^2(dLng/2)$.

**Noise filtering**:
- **Micro-jitter**: $< 0.002$ km (2m) → discarded as sensor noise.
- **Teleportation**: $\geq 0.2$ km (200m) instantaneously → discarded as GPS signal jump.

> **Implementation**: `LiveNavigation.jsx → haversine()` and `MobilePatrolFlow.jsx → haversineKm()`

---

### 4.7 Forensic Watermarking (Canvas Pixel Buffer)

**Problem**: Evidentiary photos must be tamper-resistant. If a student contests a violation, the institution needs to prove the photo was taken at a specific time and location.

**What happens without it**: Photos are raw camera output with no embedded metadata — legally contestable.

**How it works**:
1. A hidden HTML5 `<canvas>` intercepts the video frame.
2. **Temporal stamp**: Exact local millisecond time drawn via `fillText()`.
3. **Spatial stamp**: $O(1)$ look-behind on the patrol's `trailCoords` array extracts the most recent GPS coordinate (truncated to 5 decimal places).
4. **Immutable flattening**: Image pixels + text overlays are flattened into a single base64 JPEG via `canvas.toDataURL()`.

> **Implementation**: `MobilePatrolFlow.jsx` (Camera capture and canvas watermark logic)

---

### 4.8 Context-Injection NLP (Chatbot)

**Problem**: Students need to ask questions about the handbook, but a general-purpose AI might hallucinate rules that don't exist.

**What happens without it**: Students rely on peer misinformation or must read the entire handbook themselves.

**How it works**: The chatbot loads the full handbook text into the AI prompt and explicitly constrains the model to **only cite rules present in the injected context**. Questions outside scope receive a referral to the SWAFO office. This ensures zero hallucination risk for institutional policy.

> **Implementation**: `apps/ai_assistant/services.py → GeminiService.get_response()`  
> **Model**: Google Gemini Flash (latest)

---

### 4.9 Institutional Identity Bridge (MSAL-to-DRF)

**Problem**: Students authenticate via Microsoft SSO (`@dlsud.edu.ph`), but violations are stored by student number. Any mismatch creates orphaned records.

**What happens without it**: Manual data entry errors — wrong student number, orphaned records.

**How it works**: Deterministic chain: `preferred_username` → `User.objects.get(email=...)` → `StudentProfile` via 1:1 Foreign Key. No ambiguity or manual input.

> **Implementation**: Frontend auth context → Backend `UserSerializer` + `StudentProfileSerializer`

---

### 4.10 Cross-Category Major Offense Classification (§27.3.5)

**Problem**: The handbook treats repeated **same** major offenses differently from **different** major offenses. The latter requires Director adjudication. Officers cannot be expected to cross-reference a student's entire history manually.

**What happens without it**: Officers might apply standard escalation to a student who should have been referred to the Director under §27.3.5.

**How it works**: When a Major violation is assessed, the algorithm compares the current `rule_code` against all prior majors. If **any** prior major has a different rule code → auto-refer to Director ("Different Nature").

> **Implementation**: `apps/violations/views.py → ViolationAssessmentView.get()` (Lines 93–122)

---

### 4.11 Traffic Offense Silo Logic (§27.4)

**Problem**: Traffic violations (§27.4) operate on an independent penalty schedule with monetary fines but can cross over into the general disciplinary record. This dual-track system is error-prone manually.

**What happens without it**: Traffic violations might be ignored in the general count (under-penalizing) or double-counted (over-penalizing).

**How it works**: Traffic violations stack by category group (Minor Traffic / Major Traffic). Key crossover: 2nd Traffic Minor → Minor Offense on general record + Php 1,000 fine. 2nd Traffic Major → cross-checked against existing majors for §27.3.5 routing.

> **Implementation**: `apps/violations/views.py → ViolationAssessmentView.get()` (Lines 45–67)

---

### 4.12 Temporal Analytics Aggregation (Rolling Window)

**Problem**: The Director's dashboard needs violation trends over time, but raw daily counts are noisy and dates with zero violations cause visual artifacts.

**What happens without it**: Jagged, unreadable charts with missing dates causing visual "jumps."

**How it works**:
1. Window: $W = [T_{now} - 6\text{ days}, T_{now}]$
2. Timestamps normalized to `Asia/Manila`.
3. `COUNT(*)` grouped by `DATE(timestamp)`.
4. Zero-fill: dates with no violations injected with $0$.

Hotspot ranking: $Score_{location} = \sum V_{location}$ within $W$. Top 5 locations returned with alert indicators.

> **Implementation**: `apps/analytics/views.py → AdminDashboardAPIView`

---

## 5. Technical Stack Summary

| Layer | Technology |
|-------|------------|
| **AI Core** | Google Gemini Flash (latest) |
| **Embedding Engine** | Gemini Embedding 001 (768-dim vectors) |
| **Backend Framework** | Django 6.0 + Django REST Framework |
| **Frontend Framework** | React 19 (Vite 8) + Tailwind CSS |
| **Mapping & GPS** | Mapbox GL JS (custom Studio style) |
| **Database** | PostgreSQL (Production) / SQLite (Development) |
| **Authentication** | Microsoft MSAL (SSO) + Django SimpleJWT |
| **PDF Generation** | ReportLab (v4.4.10) |
| **Language** | Python 3.12 (Backend), JavaScript ES2024 (Frontend) |
