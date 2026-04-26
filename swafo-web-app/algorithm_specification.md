# Thesis Specification: AI/ML Algorithms for SWAFO Portal

**Authoritative Technical Documentation**  
**Version:** 1.0.0  
**Status:** Implementation Complete  

This document outlines the specific computer science algorithms and mathematical models implemented within the SWAFO Violation Management System. These features drive the \"Intelligent\" capabilities required for the thesis defense.

---

## 1. Smart Violation Retrieval Algorithm
The system replaces traditional keyword search with a **Hybrid Semantic Retrieval** engine. This ensures that natural language descriptions of incidents (e.g., \"smoking\", \"not proper uniform\") accurately map to the university handbook's disciplinary taxonomy.

### 1.1 Vector Space Modeling (VSM)
We utilize **Vector Space Modeling** to represent handbook rules as points in high-dimensional space. 
- **Model**: `gemini-embedding-001`
- **Dimensionality**: 768 dimensions per vector.
- **Process**: Each handbook entry's description is passed through the embedding model to generate a numerical \"coordinate\" (vector) that represents its semantic meaning.

### 1.2 Hybrid Scoring Model (Semantic + Lexical)
Pure semantic search can miss exact keyword matches (e.g., a query for rule code "27.1.3" may rank lower than a semantically similar but wrong rule). To address this, the system implements a **Weighted Hybrid Scoring** model that combines two independent scoring functions:

**Component A — Cosine Similarity (Semantic, 60% weight):**
$$S_{semantic} = \cos(\theta) = \frac{A \cdot B}{\|A\| \|B\|}$$

**Component B — Token Overlap & Containment (Lexical, 40% weight):**
$$S_{lexical} = (0.4 \times \frac{|Q \cap C|}{|Q|}) + (0.6 \times \frac{\text{containment matches}}{|Q|})$$

Where $Q$ = query tokens, $C$ = candidate tokens, and "containment matches" counts partial substring matches (e.g., "smoke" matching "smoking").

**Final Hybrid Score:**
$$Score = (0.6 \times S_{semantic}) + (0.4 \times S_{lexical})$$

- **Fallback**: If embedding vectors are unavailable (API failure), the system degrades gracefully to 100% lexical scoring.
- **Output**: The system returns the top 8 matches ranked by the hybrid score.

### 1.3 Pre-warm Embedding Cache Strategy
To achieve sub-second response times, the system implements an **In-Memory Embedding Cache**.
- **Cold Start**: On the initial search request, the system performs a batch embedding of all 82 handbook rules.
- **Persistent State**: The resulting vectors are stored in the server's RAM (via a Python dictionary/cache).
- **Latency Reduction**: Subsequent searches bypass the rule-embedding phase, reducing API latency by ~90% (from ~2.8s to <0.3s).

---

## 2. Deterministic Escalation Algorithm
For disciplinary fairness, the system employs a **State-Based Deterministic Algorithm** to track student history and recommend sanctions per **Section 27** of the Handbook.

### 2.1 Offense Aggregation Logic (Minor Offenses)
When a minor violation (Section 27.1) is recorded, the algorithm performs the following look-behind:
1.  **Count**($V_{student, 27.1}$): Total count of minor violations linked to the student.
2.  **Mapping**:
    -   $Count = 0$ $\rightarrow$ **Written Warning**
    -   $Count = 1$ $\rightarrow$ **1st Minor Offense**
    -   $Count = 2$ $\rightarrow$ **2nd Minor Offense**
    -   $Count = 3$ $\rightarrow$ **MAJOR ESCALATION (27.3.1.43)**

### 2.2 Section 27.3.1.43 Escalation Clause
As per the handbook, once a student hits their 4th cumulative minor offense, the logic automatically \"breaks\" the minor offenses category and escalates the case to a **Major Rule 27.3.1.43**. This triggers mandatory probation or suspension, which the system flags on the Officer's dashboard.

---

## 3. Natural Language Processing (Chatbot)
The \"Academic Curator\" Chatbot uses a **Context-Injection NLP** pattern.
1.  **Query Extraction**: Extracts keywords from student questions.
2.  **Context Construction**: The system injects relevant handbook sections directly into the AI prompt.
3.  **Deterministic Citations**: The algorithm ensures the AI cannot \"hallucinate\" rules by restricting its knowledge base strictly to the retrieved context, forcing it to cite specific Sections/Paragraphs.

---

## 4. Duplicate Case Detection Algorithm
To maintain data integrity and prevent redundant case logging, the system implements a **Rule-Based Exact Match & Temporal Similarity** algorithm.

### 4.1 Lookup Logic
When an officer initiates a violation assessment, the algorithm executes a look-behind scan:
1.  **Filter**: Searches the database for violations where `student_id` = $S$ AND `rule_code` = $R$.
2.  **Temporal Thresholding**: The algorithm applies a 24-hour window ($T \leq 24h$) to the query.
3.  **Validation**: If a match exists within this window ($V_{match} \neq \emptyset$), the system triggers the "Duplicate Alert" state. 
    - *Note: Matches outside this window are treated as independent "Repeat Offenses" for escalation logic.*

### 4.2 Interactive Override Mechanism
Unlike deterministic escalation, the duplicate detection logic utilizes an **Interactive Interrupt** pattern:
- **System Action**: Retrieves metadata from the previous incident (Time, Date, Location, ID).
- **Human-in-the-loop**: Presents the officer with an amber "Caution" modal.
- **Branching**:
    -   **Action: Discard** $\rightarrow$ Nullifies current draft, preventing database inflation.
    -   **Action: Proceed** $\rightarrow$ Overrides the warning, allowing for cases where a student commits the same violation twice in a short period (e.g., repeated uniform breaches in separate time blocks).

---

## 5. Traffic Offense Escalation Algorithm
Traffic violations (Section 27.4) utilize a **Siloed Frequency Aggregation** model that operates independently of the general behavior tables.

### 5.1 Stacking & Silo Logic
Unlike general behavior rules which stack by specific `rule_code`, traffic violations stack by **Category Grouping**:
1.  **Group A**: `Traffic — Minor`
2.  **Group B**: `Traffic — Major`

### 5.2 Hybrid Record Handover
The algorithm implements a **Cross-Table Handover** mechanism:
-   **Trigger**: When a student's `Traffic — Minor` count ($T_{minor}$) reaches $2$.
-   **Action**: The system auto-recommends a **Minor Offense** on the general disciplinary record (Section 27.1).
-   **Financial Penalty**: The algorithm automatically injects institutional fines based on frequency ($Php 1,000$ or $Php 2,000$).

---

## 6. Temporal Analytics Aggregation Algorithm
The dashboard's rolling intelligence is powered by a **Sliding-Window Time-Series Aggregation** algorithm that provides real-time visibility into campus compliance trends.

### 6.1 Rolling 7-Day Window Calculation
To drive the trend charts, the system executes a look-behind aggregation:
1.  **Interval Definition**: Defines a window $W = [T_{now} - 6 \text{ days}, T_{now}]$.
2.  **Date Normalization**: The algorithm normalizes all `ViolationRecord` timestamps to the local `Asia/Manila` timezone to ensure alignment with university business hours.
3.  **Grouped Aggregation**: Performs a `COUNT(*)` grouped by `DATE(timestamp)` for each day in $W$.
4.  **Zero-Fill Logic**: To ensure chart continuity, the algorithm injects $0$ values for any dates within the window that have no recorded violations, preventing UI "jumps."

### 6.2 Hotspot Ranking (Frequency Clustering)
The system identifies "Red Zones" using a simple frequency-based ranking:
- **Formula**: $Score_{location} = \sum V_{location}$ within $W$.
- **Output**: Returns the top 5 locations with a status indicator (e.g., "High Alert") if $Score > \text{threshold}$.

---

## 7. Institutional Identity Bridge Algorithm
To ensure 100% data integrity, the system implements a **Deterministic Profile Resolution Bridge** that connects the Cloud Authentication layer to the Institutional Data layer.

### 7.1 MSAL-to-DRF Handshake
1.  **Auth Token Extraction**: Upon Microsoft SSO success, the system extracts the `preferred_username` (Verified Email).
2.  **Unique Identifier Resolution**: The algorithm performs an exact match query: `User.objects.get(email=verified_email)`.
3.  **Profile Linking**: It then executes a **1:1 Mapping** to the `StudentProfile` table using the User Foreign Key.
4.  **Outcome**: This eliminates manual data entry errors. The student's **Student Number** and **College** are resolved algorithmically, ensuring that every violation is recorded against the correct legal identity.

---

## 8. Temporal Decay Risk Score Algorithm
To provide the Director with an accurate, real-time assessment of a student's behavioral risk, the system replaces raw historical violation counts with a dynamically computed **Temporal Decay Risk Score**.

### 8.1 The Problem with Raw Counts
A student with 3 violations from 2 years ago is behaviorally distinct from a student with 3 violations from yesterday. Raw counts treat them identically. The Temporal Decay algorithm solves this by weighting incidents based on both **severity** and **recency**.

### 8.2 Mathematical Model
For each violation $V_i$ on a student's record, the algorithm calculates a risk weight using exponential decay:

**Formula:**
$$Weight(V_i) = S_i \times e^{(-\lambda \times t_i)} \times U_i$$

Where:
-   **$S_i$ (Severity Base Weight)**: 
    -   Major Violation = 30 pts
    -   Minor Violation = 15 pts
    -   General / Uncategorized = 10 pts
-   **$\lambda$ (Decay Rate)**: $0.023$. This specific constant gives the function a **30-day half-life**. A violation loses ~50% of its risk contribution every 30 days without re-offense.
-   **$t_i$ (Time Elapsed)**: Days elapsed since the violation occurred.
-   **$U_i$ (Unresolved Multiplier)**: $1.5$ if the case is `OPEN` or `PENDING` (representing an active threat), or $1.0$ if `RESOLVED`.

**Final Score:**
$$Total Risk = \min\left(100, \sum_{i=1}^{n} Weight(V_i)\right)$$

### 8.3 Interpretation Guide
The resulting score (0-100) maps directly to the Director's Compliance Dashboard:
-   **0 - 25 (LOW)**: Behaviorally stable. No action required.
-   **26 - 50 (MODERATE)**: Emerging pattern. Flag for monitoring.
-   **51 - 75 (HIGH)**: Active concern. Schedule counseling/intervention.
-   **76 - 100 (CRITICAL)**: Imminent risk. Recommend Clearance HOLD and §27.3.5 review.

---

## 9. Cross-Category Major Offense Classification (Section 27.3.5)
When a student accumulates multiple **Major** offenses, the handbook requires the system to distinguish between repeated violations of the *same rule* versus violations of *different rules*. This distinction triggers fundamentally different disciplinary outcomes.

### 9.1 Classification Logic
When a new Major violation is assessed, the algorithm performs a **Cross-Reference Validation** against the student's entire major offense history:

1.  **Aggregate**: Retrieve all prior Major violations for the student, including escalated Traffic Majors.
    $$H_{major} = \{V \mid V.student = S \wedge V.category \in \text{Major Categories}\}$$
2.  **Classify**: Compare the `rule_code` of the current violation against every entry in $H_{major}$.
    -   If **all** prior majors share the **exact same `rule_code`** as the current one → **Same Nature** (standard penalty escalation applies: 1st → 2nd → 3rd → 4th offense).
    -   If **any** prior major has a **different `rule_code`** → **Different Nature** (Section 27.3.5).
3.  **Output**:
    -   **Same Nature**: System auto-recommends the next penalty tier from the handbook (e.g., `penalty_2nd`).
    -   **Different Nature**: System flags the case as `"FOR SWAFO DIRECTOR DECISION (Section 27.3.5 - Different Nature)"` and routes it to the Director's Alert Queue on the Admin Dashboard.

### 9.2 Why This Matters
Under DLSU-D's handbook, a student who commits Theft (27.3.1.1) and later commits Vandalism (27.3.1.5) is treated more severely than a student who commits Theft twice — because it indicates a broader pattern of misconduct rather than a single recurring behavior. The system automates this classification so officers do not need to manually cross-check a student's entire disciplinary history.

---

## 10. Recidivism Pattern Detection Algorithm (Apriori-Inspired)
To move from reactive to proactive monitoring, the system identifies **Association Rules** between different violation categories. This reveals "High-Correlation Paths" in student behavior.

### 10.1 Association Rule Mining
The algorithm scans the historical records of all repeat offenders to find frequent pairs of violations $(A, B)$ where $A$ precedes $B$.

**Key Metrics:**
1.  **Support**: The frequency of the pattern occurring across the entire student population.
    $$Support(A \rightarrow B) = \frac{\text{Students with both } A \text{ and } B}{\text{Total Students}}$$
2.  **Confidence**: The probability that a student who commits violation $A$ will subsequently commit violation $B$.
    $$Confidence(A \rightarrow B) = \frac{\text{Count}(A, B)}{\text{Count}(A)}$$

### 10.2 Predictive Output
The system flags any pattern where $Confidence > 50\%$. This allows the Director to see "Gateway Violations"—minor infractions that are statistically likely to lead to more severe misconduct.

---

## 11. Violation Seasonality Algorithm (Moving Average)
To distinguish between isolated peaks and sustained institutional trends, the dashboard utilizes a **Simple Moving Average (SMA)** for temporal smoothing.

### 11.1 SMA Calculation
The system calculates a rolling average of daily violation counts to generate a "Trend Line."

**Formula:**
$$SMA_t = \frac{1}{k} \sum_{i=0}^{k-1} V_{t-i}$$

Where:
-   **$k$**: The window size (default = 7 days).
-   **$V$**: The actual violation count for a given day.

### 11.2 Interpretive Value
By comparing the **Daily Count** against the **SMA**, the system can identify "Seasonal Anomalies." 
- If $V_t > 1.5 \times SMA_t$, the system flags a "Volume Spike" (⚠), signaling to the Director that a specific event or environmental factor is driving an unusual surge in violations.

### 11.3 Institutional Context (Temporal Filtering)
Unlike standard analytics algorithms that assume a 5-day work week, this implementation is explicitly calibrated to the DLSU-D university schedule.
- **School Days (Active Patrols):** Monday through Saturday ($Monday \le \text{Day} \le Saturday$). Saturday is treated mathematically as an active data point rather than an expected weekend drop-off.
- **Weekends (Baseline):** Only Sunday is treated as a non-school day.
This context ensures accurate filtering when toggling "School Days" and prevents false volume drops from heavily skewing the 7-day trend analysis.

---

## Summary of Technical Stack
- **AI Core**: Google Gemini 1.5 (Pro/Flash)
- **Embedding Engine**: Gemini Embedding 001
- **Backend**: Django (Python 3.12)
- **Frontend**: React 19 (Vite)
- **Database**: PostgreSQL (Production) / SQLite (Development)
