# Guide to the SWAFO Student Academic Standing & Restorative Tier System
### *Bridging Automated Monitoring with Lasallian Formation & the DLSU-D Student Handbook (2022–2027)*

---

## 📌 Executive Summary: Why We Made This Change

In the earlier versions of our prototype, our system displayed automated risk badges such as:
* ❌ *"Low Risk"* / *"High Risk"* / *"Critical Risk"*
* ❌ *"Action Needed"* / *"Action Required"*

### Why SWAFO Rejected That Approach:
When presenting to the Student Welfare and Formation Office (SWAFO), officers rightly noted:
1. **SWAFO is a formative body, not a police precinct.** Terms like "High Risk" or "Critical Risk" sound like criminal surveillance and stigmatize students.
2. **The system should not boss officers around.** Prompts like *"Action Needed"* were redundant and intrusive because SWAFO officers already exercise professional discretion under school policy.
3. **What actually matters is the student's real-world standing.** When a student accumulates infractions, SWAFO and the student need to know:
   * *Can the student graduate or enroll next term (Clearance §14)?*
   * *Are they still eligible for Dean's List or Latin Honors?*
   * *Can SWAFO issue a Certificate of Good Moral Character (GMC)?*
   * *What corrective program (Formation §26.4, Reprimand §27.1, or Discipline Board §27.3.5) applies?*

### The New Approach:
We transformed the technical "Risk Score" into an **Academic Standing & Institutional Privileges Matrix**. 

Instead of an opaque number, the system translates student conduct into **clear, handbook-grounded academic impacts** that everyone—students, parents, guidance counselors, and SWAFO officers—can immediately understand.

---

## 🏛️ The 4 Student Standing Tiers at a Glance

| Old Term | **New Standing Tier** | Score Range | Handbook Citation | Institutional Clearance (§14) | Dean's List & Latin Honors | Good Moral Certificate (GMC) | What This Means in Layman's Terms |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **LOW** | 🟢 **Good Standing** | **0 – 25** | Section 14 | **CLEARED** (Unrestricted) | **Eligible** | **Available** (Unconditional) | Student has minimal or no active violations. Normal academic privileges and regular student life. |
| **MODERATE** | 🟡 **Under Review** | **26 – 50** | Section 27.1 | **Conditional** | Subject to semester conduct review | **Deferred** | Student has an emerging pattern or unresolved minor offenses. Formal written reprimand issued. GMC is held temporarily until obligations are cleared. |
| **HIGH** | 🟠 **Disciplinary Warning** | **51 – 75** | Section 26.4 | **Restricted** | ❌ **Disqualified** | ⚠️ **Withheld** | Student has repeated or major infractions. Parents are notified. Required to attend the **SWAFO Formation Program (§26.4)**. Disqualified from academic awards for the term. |
| **CRITICAL** | 🔴 **Disciplinary Probation** | **76 – 100** | Section 27.3.5 | ⛔ **HOLD** | ❌ **Forfeited** | 🚫 **Denied / Withheld** | Severe repeat or grave offenses. Clearance is **LOCKED** (cannot enroll or graduate). Case is formally referred to the SWAFO Director and the **Student Discipline Board (SDB)** for potential suspension or dismissal. |

---

## 🧮 How Points are Calculated: Step-by-Step Breakdown

To be completely transparent with students, SWAFO staff, and thesis evaluators, the system uses an objective, predictable calculation. 

Every violation's point value is determined by **three simple ingredients**:

```
[ Violation Points ] = [ Base Severity Weight ] × [ Recency Decay Factor ] × [ Status Multiplier ]
```

---

### Ingredient 1: Base Severity Weight
Derived directly from the DLSU-D Student Handbook rule classifications:
* **Minor Infraction** (e.g., dress code violation, ID not worn): **`15 points`**
* **Major Infraction** (e.g., repeated defiance, vandalism, unauthorized entry): **`30 points`**
* **General / Unclassified Infraction**: **`10 points`**

---

### Ingredient 2: Recency Decay Factor (The Restorative "Healing" Factor)
Instead of keeping a permanent penalty on the student, points naturally fade as time passes without new infractions. 

The system applies the mathematically proven exponential half-life formula:
$$\text{Decay Factor} = e^{-0.023 \times \text{Days Elapsed}}$$

* **At Day 0 (Today):** Factor is $1.0$ (100% full weight).
* **At Day 30:** Factor drops to $0.50$ (50% — **the score cuts in half**).
* **At Day 60:** Factor drops to $0.25$ (only 25% remains).
* **At Day 90:** Factor drops to $0.12$ (almost completely cleared).

#### 📊 Daily Decay Progression Table:
| Days Elapsed Since Violation | Decay Factor (% of Original Weight) | Single Minor (Base 15 pts, Resolved) | Single Major (Base 30 pts, Resolved) |
| :---: | :---: | :---: | :---: |
| **0 Days (Immediate)** | **100.0%** ($1.00$) | 15.0 pts | 30.0 pts |
| **7 Days (1 Week)** | **85.1%** ($0.85$) | 12.8 pts | 25.5 pts |
| **14 Days (2 Weeks)** | **72.5%** ($0.73$) | 10.9 pts | 21.8 pts |
| **30 Days (1 Month)** | **50.1%** ($0.50$) | **7.5 pts** | **15.0 pts** |
| **45 Days (1.5 Months)** | **35.5%** ($0.35$) | 5.3 pts | 10.7 pts |
| **60 Days (2 Months)** | **25.2%** ($0.25$) | **3.8 pts** | **7.6 pts** |
| **90 Days (3 Months)** | **12.6%** ($0.13$) | 1.9 pts | 3.8 pts |

---

### Ingredient 3: Status Multiplier (Responsiveness Incentive)
The system actively encourages students to address their infractions rather than ignoring them:
* **Active / Pending / Unresolved Violations:** **`1.5× multiplier`**  
  *(A penalty boost that reflects an active obligation the student hasn't dealt with yet).*
* **Resolved / Closed / Dismissed Violations:** **`1.0× multiplier`**  
  *(As soon as a student attends their formation or SWAFO resolves/dismisses the case, the 1.5× penalty is immediately removed, instantly lowering their score).*

---

### 🏆 Total Student Standing Score Formula
The student's final standing score is simply the sum of all their decayed violation points, capped at a maximum of 100:

$$\text{Final Score} = \min\left(100, \sum_{i=1}^{n} \left(\text{Base}_i \times e^{-0.023 \times t_i} \times \text{Multiplier}_i\right)\right)$$

---

## 📝 4 Real-World Walkthrough Scenarios

Here is how the math plays out in everyday student situations:

### Scenario 1: Juan commits 1 Minor Dress Code violation today and ignores it
* **Base Weight:** 15 pts (Minor)
* **Days Elapsed:** 0 days $\rightarrow$ Decay factor = $1.0$
* **Status:** Unresolved $\rightarrow$ Multiplier = $1.5$
* **Calculation:** $15 \times 1.0 \times 1.5 = \mathbf{22.5\text{ pts}}$
* **Resulting Standing:** **Good Standing (0 – 25 pts)**  
  * *Takeaway:* A single forgotten uniform or ID does **not** ruin a student's standing. They remain eligible for honors and clearance.

---

### Scenario 2: Maria commits 2 Minor violations in the same week and leaves them unsettled
* **Violation 1:** $15 \times 1.0 \times 1.5 = 22.5\text{ pts}$
* **Violation 2:** $15 \times 1.0 \times 1.5 = 22.5\text{ pts}$
* **Total Score:** $22.5 + 22.5 = \mathbf{45.0\text{ pts}}$
* **Resulting Standing:** 🟡 **Under Review (26 – 50 pts)**  
  * *Takeaway:* Repeated negligence without resolution moves the student into "Under Review". They receive a formal written reprimand (§27.1) and conditional clearance.

---

### Scenario 3: Maria learns her lesson, resolves one violation with SWAFO, and commits no new infractions for 30 days
* **Violation 1 (Attended SWAFO, now CLOSED, 30 days old):**  
  $15 \times 0.50 \times 1.0 = \mathbf{7.5\text{ pts}}$ *(1.5× penalty removed + 50% time decay)*
* **Violation 2 (Still unsettled, but 30 days old):**  
  $15 \times 0.50 \times 1.5 = \mathbf{11.25\text{ pts}}$ *(50% time decay)*
* **New Total Score:** $7.5 + 11.25 = \mathbf{18.8\text{ pts}}$
* **Resulting Standing:** 🟢 **Good Standing (0 – 25 pts)**  
  * *Takeaway:* **Restorative Justice in action!** Because Maria maintained good conduct for 30 days and took responsibility, her standing automatically returned to Good Standing without requiring bureaucratic manual resets.

---

### Scenario 4: Habitual repeat offenses (e.g., 2 Major violations within a week, unresolved)
* **Violation 1:** $30 \times 1.0 \times 1.5 = 45.0\text{ pts}$
* **Violation 2:** $30 \times 1.0 \times 1.5 = 45.0\text{ pts}$
* **Total Score:** $45.0 + 45.0 = \mathbf{90.0\text{ pts}}$
* **Resulting Standing:** 🔴 **Disciplinary Probation (76 – 100 pts)**  
  * *Takeaway:* Habitual, unresolved major infractions trigger Section 27.3.5 escalation. Clearance is put on **HOLD**, and the student is referred directly to the SWAFO Director and the Student Discipline Board.

---


## 🎯 The 3 Concrete Stakes for Students & SWAFO

Every tier directly answers three practical questions that SWAFO deals with every day:

```
                  ┌─────────────────────────────────────────┐
                  │        STUDENT STANDING EVALUATION       │
                  └────────────────────┬────────────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
┌──────────────────┐          ┌──────────────────┐          ┌──────────────────┐
│ 1. Institutional │          │ 2. Dean's List & │          │  3. Certificate  │
│ Clearance (§14)  │          │   Latin Honors   │          │  of Good Moral   │
├──────────────────┤          ├──────────────────┤          ├──────────────────┤
│ CLEARED:         │          │ ELIGIBLE:        │          │ AVAILABLE:       │
│ Normal enrolment │          │ In good standing │          │ Issued right away│
│ & graduation.    │          │ with zero holds. │          │                  │
│                  │          │                  │                  │
│ RESTRICTED/HOLD: │          │ DISQUALIFIED:    │          │ DEFERRED/HELD:   │
│ Enrollment locked│          │ Breach of student│          │ Cannot issue     │
│ until resolved.  │          │ handbook ethics. │          │ with active case.│
└──────────────────┘          └──────────────────┘          └──────────────────┘
```

### 1. Institutional Clearance (Student Handbook Section 14)
* **Good Standing:** Clearance is completely **CLEARED**. The student can freely enroll in next semester's subjects, request official transcripts (OTR), or apply for graduation.
* **Under Review:** Clearance is **Conditional** (clearance officer sees a note, but no hard block yet).
* **Disciplinary Warning / Probation:** Clearance is **Restricted** or placed on **HOLD**. The student cannot enroll or graduate until they complete their formation sessions or resolve their case with SWAFO.

### 2. Dean's List and Latin Honors Qualification
* The DLSU-D Student Handbook explicitly states that academic honors require a student to be free from major disciplinary sanctions.
* The system protects academic integrity: as soon as a student reaches **Disciplinary Warning (51+ pts)**, their dashboard clearly informs them that their honors eligibility is **Disqualified** for that evaluation cycle.

### 3. Certificate of Good Moral Character (GMC)
* Students frequently request GMC for scholarship renewals, board exam applications (PRC), internship endorsements, or job applications.
* The dashboard displays the real-time status:
  * **Available:** Safe for SWAFO staff to print immediately.
  * **Deferred:** Student must resolve active obligations first.
  * **Withheld:** Disciplinary sanction active; issuance blocked until cleared by the SWAFO Director.

---

## 🛡️ Important Clarification: The System Does NOT Replace SWAFO

When presenting to SWAFO officers or panelists, emphasize this guarantee:

> [!IMPORTANT]
> **The AI and Algorithm are Decision-Support Tools, NOT the Judge.**
> 
> * The system **does not automatically suspend or expel anyone.**
> * The system **does not take away SWAFO's discretion.**
> * Officers have complete authority to:
>   1. Accept student appeals and dismiss false flags.
>   2. Override clearance status directly from the portal.
>   3. Assign personalized restorative formation activities.
>   4. Mark cases as "Resolved / Closed", which immediately reduces the student's score.

The system's role is simply to provide **fair, transparent, consistent, and prompt awareness** so no student falls through the cracks and no officer has to manually cross-reference 5 different filing cabinets.

---

## 🗣️ Quick Presentation Cheat Sheet (For Tim & Groupmates)

When you explain this feature to SWAFO or your thesis panel, use these talking points:

### 1-Minute Elevator Pitch:
> *"Good morning, Ma'am/Sir. In response to your earlier feedback, we completely revamped our evaluation terminology. Instead of vague labels like 'High Risk' or automated commands like 'Action Needed,' our system directly mirrors the **DLSU-D Student Handbook 2022–2027**. 
> 
> Every score translates into what actually matters to a student: their **Institutional Clearance under Section 14**, their **eligibility for Dean's List and Latin Honors**, and their **Certificate of Good Moral Character**.
> 
> Furthermore, we implemented a **Restorative Justice decay factor**: students who commit minor infractions aren't permanently penalized. If they show good conduct, their score cuts in half every 30 days, giving them a clear path to rehabilitate their standing."*

### Anticipated Questions & Answers:

* **Q: "Does the system tell SWAFO what to do?"**  
  * **Answer:** *"No, Ma'am/Sir. The system only informs the student and the officer of the student's handbook standing. All final disciplinary decisions, hearings, and clearances remain 100% in SWAFO's hands."*

* **Q: "What if a student commits a violation by mistake (e.g., forgot their ID once)?"**  
  * **Answer:** *"A single minor violation is only 15 points, keeping them safely in **Good Standing**. Even if left as is, it decays naturally within 30 days. It only escalates if the student commits multiple repeated offenses."*

* **Q: "What if an officer resolves a case or accepts an appeal?"**  
  * **Answer:** *"Once the officer marks the case as Closed or Dismissed, the unresolved penalty multiplier is immediately lifted, and the score drops right away."*

---

*Prepared by: Timothy De Castro & Thesis Research Group (SWAFO Automated Monitoring Project)*  
*Aligned with: DLSU-D Student Handbook (2022–2027 Edition)*
