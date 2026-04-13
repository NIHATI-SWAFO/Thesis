# PROJECT REFERENCE DOCUMENT

## Current Study Title
**Development of a Standalone SWAFO Web Application for Violation Management and Enhancement of UWear for Uniform Compliance Monitoring at De La Salle University-Dasmariñas**

## Nature of the Study
This is a two-module computer science thesis project that combines:
* Enhancement of an existing AI-based dress code detection system, UWear.
* Development of a standalone SWAFO web application for violation management.
* The study involves computer vision, web development, database design, system integration, and algorithm-based features for analytics and optimization.

## Institution
De La Salle University-Dasmariñas (DLSU-D)

## Offices Involved
* Student Welfare and Formation Office (SWAFO)
* Office of Student Services (OSS)
* Student Development and Activities Office (SDAO)

## Key Stakeholders Mentioned in Project Context
* **Dr. Eric A. Vargas:** Director of the Student Development and Activities Office
* **Dr. Jacqueline L. Morta:** Office of Student Services
* **Mr. Ruel D. Elias:** Director of the Student Welfare and Formation Office

---

## BACKGROUND OF THE CURRENT STUDY
DLSU-D has institutional policies intended to promote discipline, professionalism, and order among students. One important policy is the School Uniform and Dress Code Policy, which officially took effect on September 1, 2025.

Despite this, enforcement remains largely manual. SWAFO officers still patrol physically, inspect students manually, check IDs, and write violations on paper. This makes the process slow, inconsistent, hard to retrieve, and difficult to summarize into reports.

The study emerged from consultations with university offices regarding operational problems that can be improved through research and technology. One of the needs identified was a system that allows SWAFO to record violations digitally using the barcode already present on student IDs. Another idea raised was a web platform where students can view their own violation records.

During coordination with SWAFO, it was also learned that the office currently uses a third-party timestamp application as proof of patrol activity. However, this tool is not customized for SWAFO’s workflow, which supports the need for a dedicated institution-specific system.

---

## RELATED PRIOR STUDY: UWEAR

* **Full Title:** UWear: A Real-Time Dress Code Compliance System for College Students at De La Salle University – Dasmariñas Using YOLO-v5
* **Authors:** Rafael Jan M. Dancel, Angel Gabriel T. Kahulugan, Caleb Emmanuel C. Viernes
* **Thesis Adviser:** Rolando B. Barrameda
* **Academic Unit:** De La Salle University - Dasmariñas, College of Science and Computer Studies, Bachelor of Science in Computer Science, Intelligent Systems Track
* **Year:** 2024
* **Purpose:** Developed as a real-time dress code compliance system that uses YOLOv5 for object detection in order to support dress code monitoring and reduce manual checking by school personnel. Built as a local Python application.
* **What UWear Detects:** Clothing items relevant to the university dress code (shirts, skirts, pants, accessories) and compares them against predefined rules to determine compliance.

### Technical Foundation of UWear
* Local Python application
* YOLOv5 object detection
* OpenCV
* PyTorch
* Roboflow for data preparation, annotation, and preprocessing

### Development Methodology of UWear
* Agile development methodology
* Mixed-methods research approach

### Clothing Categories Mentioned in UWear
Valid or invalid depending on handbook rules:
* Short Sleeve Top
* Long Sleeve Top
* Sling
* Shorts
* Trousers
* Skirts
* Short Sleeve Dress
* Long Sleeve Dress
* Sling Dress

### UWear Evaluation Metrics
* Precision
* Recall
* mAP@0.5
* mAP@0.5:0.95
* Loss values for box, objectness, and classification

### Best Reported UWear Results (At epoch 45)
* **mAP@0.5:** 0.7883
* **Precision:** 0.7336
* **Recall:** 0.7881
* **val/box_loss:** 0.0276
* **val/obj_loss:** 0.0075
* **val/cls_loss:** 0.0158

### Limitations of UWear Relevant to Current Study
* Uses 2D frames only.
* Depends on video quality.
* Affected by poor lighting, obstruction, and camera angle.
* Limited to full-frontal views.
* Does not cover the full range of prohibited clothing items.
* Limitations in recognizing some clothing variations.
* Depends on sufficient hardware for real-time processing.
* *Project Direction Note:* The earlier system is limited in terms of full official uniform compliance and was focused more on general attire monitoring, with practical emphasis on upper-body detection rather than complete full-body policy-based compliance.

---

## RESEARCH GAP OF THE CURRENT STUDY
* UWear is not yet sufficient for strict full-body uniform compliance monitoring under the current uniform policy.
* The university now needs policy-aware checking for different conditions, such as uniform days and civilian or wash days.
* SWAFO still lacks a dedicated digital system for violation management, patrol logging, and centralized records.
* Current operations remain paper-based and inefficient.
* There is no integrated system connecting monitoring, patrol activity, violation encoding, case handling, and analytics.

---

## CURRENT STUDY: TWO-MODULE SYSTEM
These two modules are intended to work as a connected solution for student discipline monitoring and enforcement.

### MODULE 1: ENHANCEMENT OF UWEAR
* **Purpose:** To improve UWear so it can better support the present institutional requirements of DLSU-D.
* **Direction of Improvement:** * From general dress code monitoring toward stricter uniform compliance monitoring.
    * From practical upper-body emphasis toward full-body uniform component detection.
    * Improvement of civilian attire detection during civilian or wash days.
    * Alignment with the current university policy conditions.
* **Final Feature Direction:**
    * Detection of uniform for uniform days.
    * Detection of proper civilian attire, upper and lower torso, during civilian or wash days.
* **Dataset Direction:** Combine primary data (self-gathered images and videos) and secondary data sources.
* **Refined Dataset Objective:** To collect, augment, and annotate a dataset for dress code detection by combining primary data and secondary data sources, focusing on full-body uniform components and improved civilian attire detection, using a dataset platform such as [e.g., Roboflow] for preprocessing and labeling.
* **Tentative Technical Components:**
    * Programming language: placeholder
    * Dataset platform: placeholder
    * Detection algorithm: placeholder

### MODULE 2: STANDALONE SWAFO WEB APPLICATION
* **Purpose:** To digitize SWAFO operations related to patrol, violation recording, case management, and reporting.
* **Final Features:**
    * ID barcode scanning
    * Student profile and history retrieval
    * Violation encoding
    * Case management
    * Evidence upload
    * Handbook mapping
    * Corrective action recommendation
    * Duplicate case detection
    * Case summary generation
    * Violation reporting dashboard
    * Patrol route optimization
    * Timestamp
* **Intended Intelligent/Algorithm-Based Features to Highlight:**
    * Patrol route optimization
    * Violation analytics and heatmap-related analysis
    * Duplicate case detection
    * Corrective action recommendation
    * Possibly rule-based handbook assistance or chatbot support

---

## PROPOSED SYSTEM FLOW OF THE WEB APPLICATION

**1. User Login**
* The user logs in either as: Student OR SWAFO Admin/Officer.

**2. Student Access**
* View their profile.
* View their violation history.
* Access or download the university handbook.
* Possibly use a rule-based chatbot for handbook questions.

**3. SWAFO Admin or Officer Access**
* Redirected to the reporting homepage or dashboard.

**4. Patrol Monitoring**
* Officer selects "Start Patrol".
* Officer chooses a patrol area or checkpoint.
* Officer takes a timestamped patrol photo as proof (timestamp includes date, time, location).
* Officer ends patrol.
* System records patrol count and patrol duration in history.

**5. Violation Report Summary**
* The dashboard contains a summary of reported violations.

**6. Violation Recording**
* Officer scans the barcode on the student ID.
* Student profile appears.
* Officer selects a violation from a dropdown or enters it manually.
* Officer may add a written statement or description.

**7. System Output After Submission**
* Case summary
* Corrective action recommendation
* Duplicate case detection

**8. Record Storage**
* The case summary is stored under the student’s violation record.

**9. Violation Records Per Student**
* A separate section shows the list of student violations, including: case summary, corrective action recommendation, link to reporting dashboard and statistics.

---

## SUPPORTING OPERATIONAL CONTEXT
The idea for the SWAFO application came from meetings with university offices regarding problems that could be solved through research. Suggested improvements included:
* Barcode-based student identification during SWAFO patrol operations.
* An online system where students can view violations.
* Integrating a customized timestamp functionality into the system, inspired by SWAFO's current use of a third-party timestamp application for patrol proof.

---

## GENERAL OBJECTIVE CURRENTLY DRAFTED
To develop a Standalone SWAFO Web Application for Violation Management and Enhancement of UWear for Uniform Compliance Monitoring at De La Salle University-Dasmariñas, utilizing [e.g., YOLO-based object detection algorithm] for automated dress code detection and [e.g., web-based technologies] for system implementation. *(Tentative based on final tech stack).*

---

## SPECIFIC OBJECTIVES CURRENTLY DRAFTED
1.  To conduct interviews, consultations, and requirement gathering with SWAFO personnel and relevant stakeholders, and to analyze existing workflows, patrol processes, and violation handling procedures.
2.  To collect, augment, and annotate a dataset for dress code detection by combining primary data (self-gathered images and videos) and secondary data sources, focusing on full-body uniform components and improved civilian attire detection, using a dataset platform such as [e.g., Roboflow] for preprocessing and labeling.
3.  To analyze and define detection criteria for both uniform days and civilian or wash days, based on institutional policies, and translate these into model classes and rules.
4.  To design the system architecture of the two-module system, including the AI-based dress code detection pipeline, the SWAFO web-based violation management system, and the data flow between detection, recording, and reporting components.
5.  To develop and train an improved dress code detection model using [e.g., YOLOv5, YOLOv8, or similar object detection algorithm], incorporating improved full-body detection and enhanced classification of compliant and non-compliant attire.
6.  To design and implement intelligent features within the web application, including patrol route optimization using [e.g., graph-based algorithms], violation analytics and heatmap visualization using [e.g., spatial or clustering techniques], duplicate case detection using [e.g., rule-based or similarity matching approaches], and corrective action recommendation using [e.g., rule-based decision logic].
7.  To design and develop the database structure using [e.g., MySQL, Firebase, or equivalent], including student records, violation history, patrol logs, evidence, and analytics data.
8.  To develop the SWAFO standalone web application using [e.g., React, Laravel, or similar frameworks], implementing features such as barcode scanning, student identification, violation encoding, case management, evidence upload, case summary generation, and dashboard reporting.
9.  To integrate system functionalities, ensuring coordination between detection outputs, violation recording, and analytics or reporting modules.
10. To test and evaluate the system, including detection model performance using precision, recall, and mAP, system usability and efficiency through user testing, and the functionality of optimization and analytics features.
11. To refine and improve the system based on evaluation results and feedback from SWAFO personnel and users.

---

## IMPORTANT FACTS TO REMEMBER FOR WRITING

### About UWear
* It is a real prior thesis at DLSU-D.
* Written by Dancel, Kahulugan, and Viernes.
* Adviser: Rolando B. Barrameda.
* Year: 2024.
* Uses YOLOv5 as a local Python application.
* Had positive evaluation, but with technical and practical limitations.

### About Your Current Study
* It is **not** just an AI project.
* It is **not** just a CRUD web app.
* It is a two-module, institution-focused CS thesis.
* It combines AI detection, web systems, database design, and algorithm-based features for operations and analytics.

### About the Project Direction
* Full-body uniform components are important.
* Civilian attire detection is part of the enhancement.
* SWAFO workflow digitization is central.
* Patrol, timestamping, reporting, barcode-based identification, and case handling are all core parts.
* Patrol optimization and analytics should be highlighted as major CS contributions.