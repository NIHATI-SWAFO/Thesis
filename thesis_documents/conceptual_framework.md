# Conceptual Framework
## SWAFO: An AI-Powered Dress Code Detection and Violation Management System for DLSU-D

**De La Salle University - Dasmarinas**
**College of Science and Computer Studies**
**Chapter 2 Supporting Document**

---

## The Conceptual Framework

The conceptual framework of this study presents the complete lifecycle of the SWAFO system across two interrelated modules, each visualized as a structured processing pipeline. Figure 3.2.1 illustrates the machine learning research pipeline of Module 1, the AI-based Dress Code Detection system, tracing the sequential stages from raw data acquisition through model training, real-time inference, and formal performance evaluation. Figure 3.2.2 presents the institutional application layer of Module 2, the SWAFO Web Application, showing how detection outputs are operationalized into a full violation management and enforcement workflow spanning policy evaluation, case adjudication, patrol operations, and institutional analytics. Together, the two figures reflect the study's core architectural philosophy of modular integration, ensuring that the computational demands of AI detection remain decoupled from the performance of the web-based management portal while sharing a common database and application programming interface.

In Module 1, the framework begins with the assembly of a multi-source dataset of 204,927 raw images and 315,597 annotations drawn from seven data origins. These images are preprocessed through label format correction, class-balancing augmentation, and a stratified 70/20/10 train-validation-test split before being organized into a 14-class annotation schema that maps garment categories to the four policy domains defined in Section 27 of the DLSU-D Student Handbook. The YOLO11s backbone, equipped with 9.4 million parameters and online augmentation, is trained on a GTX 1660 SUPER GPU over 57 epochs before being deployed for real-time inference at 9.3 milliseconds per frame. The pipeline terminates in rigorous evaluation, including per-class average precision and mAP scoring, benchmarked against the prior UWear (2024) model to quantify performance improvements.

Module 2 receives the structured JSON compliance report produced by Module 1 and initiates the institutional enforcement workflow. A policy-aware rule engine applies the correct uniform or civilian mode based on the academic schedule and the student's year level, mapping any detected infractions to their specific handbook clauses. The violation is formally recorded with barcode-scanned student identity, officer-captured photo evidence, and GPS location data. The escalation engine then evaluates cumulative offenses, enforces a 24-hour duplicate guard, and triggers the applicable penalty from the Section 27 penalty ladder, advancing the case through a five-status adjudication lifecycle from OPEN to CLOSED. A temporal decay risk scoring algorithm continuously recalculates each student's behavioral risk index using an exponential decay function. This risk data informs both the analytics dashboard, which visualizes trends, recidivism patterns, and college-level benchmarks, and the patrol operations module, which uses Haversine distance scoring to compute priority-ranked patrol routes. Students access a personal portal displaying their compliance standing, violation history, case verdicts, and a Gemini-powered AI chatbot grounded in handbook content.




---

## Pipeline Diagram Structure

The two pipeline diagrams below are read left-to-right. Each box represents a distinct processing stage. Vertical arrows between the rows of Module 2 show the data flow relationships between the top and bottom stages.

### Figure 3.2.1: Conceptual Framework of Module 1 (Dress Code Detection)

### Row 1: AI Detection Pipeline (Module 1)

```
+-------------------------+     +-------------------------+     +-------------------------+     +-------------------------+
|   DATA COLLECTION       |     |   DATA PREPROCESSING    |     |   14-CLASS ANNOTATION   |     |   FEATURE EXTRACTION    |
|                         |     |                         |     |      SCHEMA             |     |                         |
|  - DeepFashion2         |     |  - Label Format Fixing  |     |                         |     |  - YOLO11s Backbone     |
|  - ModaNet              |     |    (2,190 polygon-to-   |     |  Uniform:               |     |    (101 fused layers)   |
|  - Open Images V7       | --> |    bbox conversions)    | --> |   uniform_top           | --> |  - 9.4M parameters      |
|  - Roboflow Uniform     |     |  - Subsampling          |     |   uniform_bottom        |     |  - 21.3 GFLOPs          |
|  - USTP Philippine      |     |    (cap at 5,000/class) |     |  Civilian:              |     |  - 640x640 input        |
|  - Roboflow Footwear    |     |  - Minority Augmentation|     |   5 sub-classes         |     |  - Hierarchical feature |
|  - Manual Web Scraping  |     |    (boost to 5,000)     |     |  Footwear:              |     |    learning (edges ->   |
|                         |     |  - 70/20/10 Split       |     |   shoes, slippers       |     |    textures -> shapes)  |
|  204,927 raw images     |     |  - Integrity Audit      |     |  Prohibited:            |     |  - Online Augmentation  |
|  315,597 annotations    |     |    (94,300 images)      |     |   5 sub-classes         |     |    (mosaic, HSV, flip,  |
|                         |     |                         |     |                         |     |    MixUp, copy-paste)   |
|                         |     |  82,036 balanced images |     |  14 total classes       |     |                         |
+-------------------------+     +-------------------------+     +-------------------------+     +-------------------------+
                                                                                                          |
                                                                                                          v
+-------------------------+     +-------------------------+     +-------------------------+     +-------------------------+
|   EVALUATION METRICS    |     |   BASELINE COMPARISON   |     |   REAL-TIME INFERENCE   |     |   MODEL TRAINING        |
|                         |     |                         |     |                         |     |                         |
|  - mAP@0.5 = 0.9031    |     |  vs UWear (2024):       |     |  - Preprocess: 1.1 ms   |     |  - YOLO11s architecture |
|  - mAP@0.5:0.95 = 0.73 |     |  - mAP: +11.48 pp      |     |  - Inference:  7.3 ms   |     |  - GTX 1660 SUPER      |
|  - Precision = 0.8560  | <-- |  - Precision: +12.24 pp | <-- |  - NMS:        0.9 ms   | <-- |  - Batch size: 8        |
|  - Recall = 0.8573     |     |  - Recall: +6.92 pp     |     |  - Total: 9.3 ms/frame  |     |  - Cls loss weight: 2.0 |
|  - 13/14 classes > 0.85|     |  - Skirt: 0.0 -> 0.866  |     |  - 107 FPS throughput   |     |  - Early stop: 20 pat  |
|  - Per-class AP         |     |  - Uniform: NEW 0.99    |     |  - Annotated frames     |     |  - 57 epochs / 13.5 hr |
|  - Confusion matrix     |     |  - Footwear: NEW 0.86+  |     |  - Confidence scores    |     |  - Checkpoint every 10  |
|  - Test set: 9,443 imgs|     |  - 6 new capabilities   |     |  - Bounding boxes       |     |  - CUDA GPU 0           |
+-------------------------+     +-------------------------+     +-------------------------+     +-------------------------+
                                                                          |
                                                                          | Detection Output (per frame):
                                                                          | class labels + bounding boxes + confidence
                                                                          v
==================================================================================================================

### Figure 3.2.2: Conceptual Framework of Module 2 (SWAFO Web Application)

### Row 2: Institutional Application Layer (Module 2)

+-------------------------+     +-------------------------+     +-------------------------+     +-------------------------+
|   POLICY-AWARE          |     |   VIOLATION RECORDING   |     |   ESCALATION ENGINE     |     |   TEMPORAL DECAY        |
|   RULE ENGINE           |     |   & EVIDENCE CAPTURE    |     |                         |     |   RISK SCORING          |
|                         |     |                         |     |                         |     |                         |
|  - UNIFORM_MODE         |     |  - Officer gate record  |     |  - Sec 27 penalty ladder|     |  - Score=sum(sev*e^-lt) |
|    (Mon-Tue, Thu-Fri)   | --> |  - Barcode / ID entry   | --> |  - Offense counting     | --> |  - lambda = 0.023       |
|  - CIVILIAN_MODE        |     |  - Rule search (hybrid) |     |  - 24h duplicate guard  |     |  - Capped at 100        |
|    (Wed/Sat, 4th yr)    |     |  - AI case summary      |     |  - Sec 27.3.5 auto-escal|     |  - Recent offense bias  |
|  - 4th year exception   |     |  - Photo evidence       |     |  - Director referral    |     |  - Risk leaderboard (10)|
|  - JSON comp. report    |     |  - GPS location tagging |     |  - 5-status lifecycle   |     |  - Tiers: Good/Oblig/   |
|  - Sec 27 clause mapping|     |                         |     |                         |     |    Repeat/Probation     |
+-------------------------+     +-------------------------+     +-------------------------+     +-------------------------+
             |                                |                             |                               |
             | (Defines rules for)            | (Informs)                   | (Escalates to)                | (Visualized in)
             v                                v                             v                               v
+-------------------------+     +-------------------------+     +-------------------------+     +-------------------------+
|   STUDENT PORTAL        |     |   PATROL OPERATIONS     |     |   CASE ADJUDICATION     |     |   ANALYTICS &           |
|   & AI ASSISTANT        |     |                         |     |   WORKFLOW              |     |   REPORTING DASHBOARD   |
|                         |     |                         |     |                         |     |                         |
|  - Dashboard risk score |     |  - AI-suggested routes  |     |  - OPEN                 |     |  - 7-day SMA + spikes   |
|  - Violation history    |     |    (top 5 priority)     |     |  - AWAITING_DECISION    |     |  - Recidivism patterns  |
|  - Case verdicts & sanc |     |  - Haversine distance   |     |  - DECISION_RENDERED    |     |    (Apriori rules)      |
|  - Compliance standing  |     |  - Live Mapbox GPS trail|     |  - DISMISSED / CLOSED   |     |  - College benchmarking |
|  - Gemini AI chatbot    |     |  - 30m auto-checkpoint  |     |                         |     |  - Policy breakdown     |
|    (handbook Q&A)       |     |  - Forensic photos      |     |  - Director decision    |     |  - PDF export(ReportLab)|
|  - Searchable handbook  |     |    (GPS/time embedded)  |     |  - Sanction tier select |     |  - Date/college filters |
|  - MSAL SSO login       |     |  - Session summary rep  |     |  - Clearance status     |     |  - Mapbox heatmap       |
|                         |     |                         |     |  - Officer assignment   |     |    GeoJSON clusters     |
+-------------------------+     +-------------------------+     +-------------------------+     +-------------------------+
```

### Connection Logic:

Row 1 Output --> Row 2 Input: The detection output (class labels, bounding boxes, confidence scores) feeds directly into the Policy-Aware Rule Engine, which evaluates compliance and generates the JSON report that initiates the violation recording workflow.

---

## Stage 1: Data Collection

This stage encompasses the acquisition of the raw image dataset used to train the dress code detection model. The study compiled a multi-source dataset of 204,927 raw images and 315,597 annotations drawn from seven categories of data sources: publicly available fashion datasets including DeepFashion2, ModaNet, and Open Images V7 for civilian and prohibited garment classes; Philippine school uniform datasets from Roboflow and USTP for uniform-specific training samples; Roboflow footwear datasets for shoes and slippers detection; and manually collected images from web sources to supplement underrepresented uniform classes. This multi-source strategy was necessary because no single existing dataset contained all 14 garment categories required for DLSU-D policy compliance evaluation, particularly the institution-specific uniform classes and Philippine-context prohibited items.

---

## Stage 2: Data Preprocessing

Data preprocessing involved three critical operations to transform the raw collected data into a training-ready format. First, 2,190 malformed labels that contained segmentation polygon coordinates instead of YOLO bounding box format were detected and converted to proper bounding box annotations using min/max coordinate extraction. Second, a two-stage class balancing strategy was applied to address an extreme 88:1 imbalance ratio between dominant civilian classes (approximately 71,000 samples) and minority uniform classes (fewer than 1,000 samples). Stage one capped dominant classes at 5,000 samples through random subsampling to reduce the ratio. Stage two boosted four minority classes through offline augmentation techniques including horizontal flips, rotation, brightness adjustment, and contrast modification: uniform_top from 684 to 5,000, uniform_bottom from 565 to 5,000, footwear_slippers from 1,269 to 5,000, and prohibited_ripped_pants from 1,449 to 5,000. Third, 94,300 images were audited for file integrity across all splits, and the final balanced dataset of 82,036 training images was partitioned into a 70/20/10 ratio for training, validation, and testing, formatted in YOLOv8-native annotation format (class center_x center_y width height).

---

## Stage 3: 14-Class Annotation Schema

The annotation schema defines the 14 garment classes that the detection model is trained to recognize, organized into four functional categories aligned with the DLSU-D dress code policy. The Uniform category contains two classes (uniform_top for the white polo or fitted blouse with De La Salle embroidery, and uniform_bottom for light khaki pants, short pants, or skorts) that represent entirely new detection capabilities absent from the UWear baseline. The Civilian category contains five classes covering short-sleeve tops, long-sleeve tops, trousers, shorts, and skirts. The Footwear category contains two classes (footwear_shoes for sneakers and low-cut shoes, and footwear_slippers for open sandals), also representing new capabilities not present in the baseline. The Prohibited category contains five classes directly mapped to specific Student Handbook Section 27.1.2 clauses: ripped pants (27.1.2.2), sleeveless tops (27.1.2.4), midriff and off-shoulder tops (27.1.2.6), leggings (27.1.2.8), and crop tops and halter blouses (27.1.2.9). This class taxonomy ensures that every detection output is directly traceable to a specific institutional policy rule.

---

## Stage 4: Feature Extraction

Feature extraction is performed automatically by the YOLO11s convolutional neural network architecture during the training process. Unlike traditional machine learning pipelines that require handcrafted feature engineering, the YOLO11s model learns hierarchical visual feature representations directly from the raw pixel data. The architecture consists of 101 fused layers with 9,418,218 parameters and operates at 21.3 GFLOPs, accepting a standardized 640 x 640 pixel input. The backbone network extracts low-level features such as edges, textures, and color patterns in early convolutional layers and progressively composes them into high-level semantic features such as garment shapes, fabric patterns, and clothing boundaries in deeper layers.

Online data augmentation was applied during the feature learning process to improve the model's ability to generalize across diverse visual conditions encountered at the campus gate. These augmentations include HSV color space perturbations (hue 0.015, saturation 0.7, brightness 0.4), geometric transformations (rotation of 15 degrees, translation of 0.1, scale of 0.5), horizontal flipping at 50% probability, mosaic augmentation combining four images per training sample, MixUp blending at 10%, and copy-paste augmentation at 10%. These transformations force the network to learn invariant feature representations that are robust to variations in lighting, camera angle, student positioning, and background clutter.

---

## Stage 5: Model Training

The model training stage involves optimizing the YOLO11s network to accurately detect and classify garments from the extracted features. Training was conducted on an NVIDIA GTX 1660 SUPER GPU with 6 GB VRAM using the following configuration: a batch size of 8 (the maximum supported by the available VRAM), a classification loss weight of 2.0 to apply stronger penalization for misclassification on minority classes, an early stopping patience of 20 epochs, and checkpoint saving every 10 epochs for training recovery. The model completed 57 epochs of training over approximately 13.5 hours, averaging 14.2 minutes per epoch at near 100% GPU utilization, before early stopping was triggered due to validation performance convergence.

---

## Stage 6: Real-Time Inference

During deployment at the campus gate, the trained model processes each input frame from the live camera feed through three sequential stages: preprocessing at 1.1 ms, neural network inference at 7.3 ms, and non-maximum suppression postprocessing at 0.9 ms, yielding a total processing time of approximately 9.3 ms per image or 107 frames per second. For each detected garment, the model outputs a bounding box with spatial coordinates, a class label from the 14-class taxonomy, and a confidence score. The inference output is rendered as an annotated image with color-coded bounding boxes identifying each detected garment and a compliance banner indicating the overall verdict, displayed on the SWAFO Officer's gate monitoring interface in real time.

---

## Stage 7: Evaluation Metrics and Baseline Comparison

The evaluation stage validates the trained model's detection accuracy using standard object detection metrics computed on the held-out test set of 9,443 images. The primary metric is mean Average Precision at an Intersection over Union threshold of 0.5 (mAP@0.5), which measures the model's combined ability to correctly localize and classify each garment instance. Secondary metrics include Precision (the proportion of correct detections among all predicted detections), Recall (the proportion of actual garments successfully detected), mAP@0.5:0.95 (averaged across IoU thresholds from 0.5 to 0.95), and per-class Average Precision for granular class-level analysis.

The Enhanced UWear model achieved a mAP@0.5 of 0.9031, surpassing the UWear baseline (Dancel, Kahulugan, and Viernes, 2024) of 0.7883 by 11.48 percentage points. Precision improved from 0.7336 to 0.8560 (+12.24 pp), and Recall improved from 0.7881 to 0.8573 (+6.92 pp). Per-class analysis confirmed that 13 out of 14 classes achieved an Average Precision above 0.85. The previously non-functional skirt class was fully resolved from approximately 0.0 AP to 0.8656 AP. The uniform classes (0.9919 and 0.9950 AP) and footwear classes (0.8631 and 0.9597 AP) represent six entirely new detection capabilities absent from the baseline system.

---

## Stage 8: Policy-Aware Rule Engine

The inference output feeds into the Policy-Aware Rule Engine, which bridges the AI detection pipeline with the institutional enforcement workflow. The engine receives the list of detected garments and evaluates them against the DLSU-D dress code policy defined in Section 27 of the Student Handbook. It operates in two modes: UNIFORM_MODE is applied on Monday, Tuesday, Thursday, and Friday for first through third year students, requiring the presence of uniform_top, uniform_bottom, and footwear_shoes with no prohibited items detected. CIVILIAN_MODE is applied on Wednesday and Saturday wash days and for all fourth year students, permitting any civilian attire provided no prohibited items are detected and footwear consists of closed shoes rather than slippers. A fourth year exception rule allows senior students to wear either the complete university uniform or civilian clothing on any day. For each evaluation, the rule engine produces a structured JSON compliance report containing the binary compliance verdict, the specific violation flags with their corresponding handbook clause references, and the severity classification.

---

## Stage 9: Violation Recording and Evidence Capture

When a non-compliant student is flagged on the monitoring screen, the SWAFO Officer calls the student over and initiates the formal violation recording process through the SWAFO Web Application. The officer identifies the student through barcode scanning using html5-qrcode or manual student number entry as a fallback, searches for the applicable handbook rule through a hybrid semantic and keyword search powered by Gemini API embeddings, and receives an AI-generated intelligent assessment report before final submission. The system attaches the AI-generated evidence including the annotated image and compliance report, tags the violation with GPS coordinates from the 52 registered campus building locations, and links the record to the student's pre-provisioned profile, the recording officer, and the specific handbook clause. The violation then enters the institutional case management workflow.

---

## Stage 10: Escalation Engine and Case Lifecycle

The institutional escalation engine processes each recorded violation through a series of deterministic rules aligned with the Section 27 penalty ladder. The engine queries the student's violation history to determine the offense instance number for the cited rule, selecting the appropriate penalty tier (1st through 5th offense) from the HandbookEntry table. A 24-hour duplicate detection guard prevents accidental double-reporting of the same rule for the same student during high-volume patrol periods. For major violations, the Section 27.3.5 cross-category detection algorithm monitors whether the student has accumulated repeated major offenses of different natures, automatically triggering a referral to the SDAO Director when the threshold is met. Cases enter a five-status lifecycle progressing from OPEN through AWAITING_DECISION, DECISION_RENDERED, and finally to CLOSED or DISMISSED, with the Director rendering formal sanctions, composing official remarks, and managing student clearance status (CLEARED or HOLD) at each adjudication stage.

---

## Stage 11: Temporal Decay Risk Scoring

The temporal decay risk scoring algorithm computes a dynamic behavioral risk index for each student based on their cumulative violation history. The score is calculated as the sum of each violation's severity weight multiplied by an exponential decay factor (e to the power of negative lambda times t, where lambda equals 0.023 and t represents the number of days since the violation was recorded). This formulation ensures that recent offenses carry greater mathematical weight than historical ones, producing a continuously updated score capped at 100 that reflects the student's current compliance trajectory. The computed scores populate a risk leaderboard displaying the top ten students and are used to classify students into compliance standing tiers: Good Standing, Has Obligation, Repeat Offender, or Probation.

---

## Stage 12: Patrol Operations and Route Optimization

The patrol operations module enables SWAFO Officers to conduct structured enforcement patrols across the campus. The AI-suggested patrol route algorithm computes a priority ranking of the top five campus buildings based on a composite score that combines historical violation density with Haversine spherical distance from the officer's current GPS position. During active patrols, the system tracks the officer's live GPS position on a Mapbox-powered interactive map, automatically secures checkpoints when the officer enters a 30-meter proximity radius of a designated location, and allows the capture of forensic watermarked photographs with embedded timestamps and GPS coordinates. Each patrol session is archived with duration, total distance traveled (computed via the Haversine formula), checkpoint data, and violation counts for administrative oversight.

---

## Stage 13: Analytics, Reporting, and Student Portal

The analytics dashboard aggregates all system data into a suite of visualization tools for institutional policy analysis. The Director's command center presents violations-over-time trend charts with a seven-day simple moving average and automated spike detection, a risk score leaderboard ranked by the temporal decay algorithm, recidivism pattern analysis using Apriori association rules, a college comparison chart benchmarking all eight colleges, a policy category breakdown of Minor, Major, and Traffic violations, and a campus violation heatmap rendered as Mapbox GeoJSON clusters with date and category filters. Per-college PDF reports can be generated through ReportLab for formal administrative distribution.

The Student Portal provides authenticated students with a personal dashboard displaying their risk score and compliance standing, a chronological violation history with case verdicts and director sanctions, a searchable Student Handbook interface focused on Section 27, and a Gemini-powered AI chatbot that processes natural language queries and returns contextually cited answers drawn from the handbook content. Student authentication is handled through Microsoft MSAL Single Sign-On using institutional @dlsud.edu.ph accounts, with the system automatically resolving the student's identity to their pre-provisioned institutional profile upon login.
