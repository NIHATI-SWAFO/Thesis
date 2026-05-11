# Thesis Defense Presentation Outline (Updated)

Based on your specific **13-Stage Modular Dual-Pipeline Framework**, here is the corrected presentation outline. This layout ensures you demonstrate both the technical rigor of the AI (Module 1) and the institutional impact of the Web App (Module 2).

---

## 1. BACKGROUND (1-2 Slides)
*   **Visual Suggestion:** Side-by-side comparison.
    *   *Left:* Photo of manual gate checking (Bottlenecks, paper logs).
    *   *Right:* Screenshot of your **Live Dress Code Monitor** (Instant, AI-powered).
*   **Talking Point:** Discuss the shift from the manual UWear (2024) baseline to your "Enhanced" AI-powered system that handles 14 classes.

## 2. STATEMENT OF THE PROBLEM (1 Slide)
*   **Visual Suggestion (The "Pain Points" Infographic):**
    1.  **Imbalance & Inaccuracy:** Why previous systems (UWear) failed at footwear and uniform detection.
    2.  **Manual Adjudication:** The "Data Silo" problem where violations aren't tracked or escalated properly.
    3.  **Static Enforcement:** The lack of a "Risk Score" that adapts over time (Temporal Decay).

## 3. RESEARCH FRAMEWORK (2 Slides)
**Goal:** Showcase Figures 3.2.1 and 3.2.2 from your paper.
*   **Slide 3A: Module 1 (AI Research Pipeline):** Show the 8-stage pipeline from Data Collection to Baseline Comparison. Highlight the "Balanced Dataset" of 82,036 images.
*   **Slide 3B: Module 2 (Institutional Application Layer):** Show the 8-component lifecycle from the Rule Engine to the Analytics Dashboard.
*   **Key Concept:** Explain the **Decoupled Architecture**—the AI processes frames in 9.3ms without slowing down the management portal.

## 4. SPECIFIC OBJECTIVES (1 Slide)
*   **Visual (Technical Roadmap):**
    *   **Obj 1:** Assemble and balance a 14-class dataset (204,927 raw images).
    *   **Obj 2:** Train YOLO11s with 9.4M parameters for real-time inference.
    *   **Obj 3:** Build the SWAFO Web App with 5-status adjudication and AI-suggested patrol routes.
    *   **Obj 4:** Implement the **Temporal Decay Risk Scoring** algorithm.

## 5. SCOPE AND LIMITATION (1 Slide)
*   **Visual (In vs. Out Table):**
    *   **In-Scope:** DLSU-D Student Handbook Sec 27, 14 garment classes, Mapbox Heatmaps, Gemini-powered Handbook Chatbot.
    *   **Out-of-Scope:** Facial recognition, faculty/visitor monitoring, native mobile app (uses responsive web).

## 6. SIGNIFICANCE (1 Slide)
*   **Visual (Stakeholder Impact):** 
    *   **SWD Office:** Automated escalation and penalty ladder calculation.
    *   **Officers:** Haversine-based patrol route optimization.
    *   **Students:** MSAL SSO Student Portal to track their own "Compliance Standing."

## 6. RESEARCH METHODOLOGY OVERVIEW (1 Slide)
The research methodology follows a 13-stage modular framework designed to bridge the gap between automated object detection and institutional enforcement. By utilizing a dual-pipeline architecture, the study decouples the real-time YOLO11s computer vision model from the SWAFOTECH rule engine, which was programmatically aligned with Section 27 of the DLSU-D Student Handbook. This process involved a data-centric balancing strategy to mitigate extreme class imbalances, the implementation of complex temporal decay risk scoring algorithms, and the integration of institutional patrol optimization to provide a comprehensive, policy-aware solution for campus dress code management.

## 7. DETAILED METHODOLOGY (4-5 Slides)

*(Below is the exact text and data you can copy-paste onto your slides)*

*   **Slide 7A: Data Preprocessing & Balancing (Stage 2)**
    *   **The Problem:** Extreme 88:1 imbalance (71,000 civilian vs. <1,000 uniform samples).
    *   **Result:** Reduced imbalance ratio to **2.5:1**, resulting in a final dataset of **82,036 images** (70/20/10 split).
    *   **Table for Slide:**
        
        | Class Category | Example Classes | Original Count | Balancing Technique | Final Count |
        | :--- | :--- | :--- | :--- | :--- |
        | **Dominant Civilian** | Trousers, Shorts, Shoes | ~71,000 total | Random Subsampling (Capped) | ~5,000 per class |
        | **Minority Uniform** | Uniform Top, Bottom | 565 - 684 | Offline Augmentation (Boosted) | ~5,000 per class |
        | **Minority Prohibited** | Ripped Pants, Slippers | 1,269 - 1,449 | Offline Augmentation (Boosted) | ~5,000 per class |

*   **Slide 7B: YOLO11s AI Training Pipeline (Stages 4-5)**
    *   **Architecture:** YOLO11s Backbone, 101 fused layers, 9.4 Million parameters (21.3 GFLOPs).
    *   **Hardware:** Trained on NVIDIA GTX 1660 SUPER (6GB VRAM) at Batch Size 8.
    *   **Training Duration:** 57 epochs over 13.5 hours (Early stopping triggered).
    *   **Online Augmentation Used:** Mosaic, MixUp (10%), Copy-Paste (10%), HSV adjustments.

*   **Slide 7C: Policy-Aware Rule Engine & Escalation (Stages 8 & 10)**
    *   **Policies Covered:** Fully automates the adjudication for **Minor Violations (Section 27.1)**, **Major Violations (Section 27.3)**, and **Traffic Violations**, instantly calculating escalating penalties from the 1st to 5th offense.
    *   **Escalation Logic:** Includes a **24-hour duplicate guard** to prevent double-logging, and automatic SDAO Director referrals for repeated major offenses (Sec 27.3.5).
    *   **Table 1 for Slide (Rule Engine Logic):**

        | Enforcement Mode | Applicable Days / Students | Required Garments | Prohibited Garments |
        | :--- | :--- | :--- | :--- |
        | **Uniform Mode** | Mon, Tue, Thu (Years 1-3) | Uniform Top, Uniform Bottom, Shoes | All Prohibited Items (e.g., Slippers, Ripped Pants) |
        | **Civilian Mode** | Wed, Fri, Sat (All) & 4th Years (Any) | Any Civilian Top & Bottom, Closed Shoes | All Prohibited Items + Shorts & Slippers |
    
    *   **Table 2 for Slide (Handbook Policy Coverage):**

        | Violation Category | Handbook Reference | Total Policies Managed |
        | :--- | :--- | :--- |
        | **Minor Offenses** | Section 27.1.1 to 27.1.9 | **25 Policies** |
        | **Major Offenses** | Section 27.3.1 to 27.3.3 | **56 Policies** |
        | **Traffic Offenses** | Section 27.4.2 to 27.4.3 | **19 Policies** |
        | **TOTAL** | **Full System Integration** | **100 Managed Rules** |

    *   **Flowchart for Slide:** *OPEN → AWAITING_DECISION → DECISION_RENDERED → CLOSED / DISMISSED*.

*   **Slide 7D: Advanced Algorithms (Stages 11 & 12)**
    *   **Temporal Decay Risk Scoring:** 
        *   Calculates dynamic behavioral risk using an exponential decay function.
        *   **Formula:** $Score = \sum (sev \cdot e^{-\lambda t})$ (where $\lambda = 0.023$).
        *   Ensures recent violations carry mathematically higher weight than older ones.
    *   **Patrol Route Optimization:** 
        *   Uses the **Haversine Distance Formula** combined with historical violation density to suggest the top 5 priority campus buildings for officers to patrol.

*   **Slide 7E: SWAFO Web Application Ecosystem (Stages 9, 12, & 13)**
    *   **The Problem:** Manual paper logging creates data silos and slow resolution times.
    *   **The Solution:** A centralized, Next.js institutional portal connecting guards, directors, and students.
    *   **Table for Slide (Web App Features):**
        
        | Web App Component | Key Technologies | Primary Institutional Features |
        | :--- | :--- | :--- |
        | **Violation Recording** | html5-qrcode, Gemini API | ID Barcode scanning, AI hybrid semantic rule search, GPS tagging |
        | **Patrol Operations** | Mapbox GL JS, Geolocation | Live GPS tracking, 30m auto-checkpoints, Forensic watermarked photos |
        | **Analytics Dashboard** | Chart.js, Mapbox, ReportLab | 7-day SMA trendline, Campus violation heatmaps, PDF Report export |
        | **Student Portal** | MSAL (SSO), Gemini API | Live compliance standing, Violation history, AI Handbook Chatbot |

## 8. STATISTICAL TOOLS & EVALUATION (1-2 Slides)
*   **Slide 8A: Module 1 Performance:**
    *   **Visuals:** Confusion Matrix and the mAP@0.5 score of **0.911 (91.1%)**. 
    *   **Comparison Table (UWear vs. SWAFOTECH Dress Code Detection):**

        | Metric | UWear (2024 Baseline) | SWAFOTECH Dress Code Detection (This Study) | Delta (Improvement) |
        | :--- | :--- | :--- | :--- |
        | **Model Architecture** | **YOLOv5** | **YOLO11s** | 6-Generation Upgrade |
        | **mAP@0.5 Score** | 0.7883 (78.8%) | **0.911 (91.1%)** | **+12.27 pp** |
        | **Garment Classes** | 8 Classes | **14 Classes** | +6 New Categories |
        | **Policy Awareness** | ❌ None (Static) | ✅ Rule-Engine Integrated | Institutional Alignment |
        | **Footwear Detection**| ❌ Not Supported | ✅ Shoes & Slippers | 27.1.2.11 Coverage |
*   **Slide 8B: Module 2 Evaluation:**
    *   **Metric:** System Usability Scale (SUS) and UAT (User Acceptance Testing) by SWD personnel.
    *   **Visual:** Screenshot of the **Analytics Dashboard** (7-day SMA and Heatmap) as proof of reporting capability.
