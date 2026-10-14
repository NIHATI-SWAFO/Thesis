# SWAFOTECH Model Architecture & Rule Engine — Q&A Guide

## 1. THE DETERMINISTIC RULE ENGINE
**Q: What is a "Deterministic Rule Engine"?**
A: Think of it like a **Flowchart** or a **Recipe**. 
* **Non-Deterministic (AI):** Like a person guessing. They might change their mind depending on their mood or the lighting.
* **Deterministic (Our Engine):** A set of strict **If-Then** rules. If the AI says 'Slippers' and the Calendar says 'Monday', the result is **ALWAYS** 'Violation'. It never guesses or changes its mind. Same input always equals the same output.

---

## 2. PYTHON MODULE VS. FULL-AI
**Q: Why use a separate Python module for the rules? Why not just train the AI to detect "Violations" directly?**
A: We chose a separate module for three reasons:
1. **Legal Consistency:** AI models are "probabilistic" (maybe 90% sure). Institutional discipline requires 100% predictability.
2. **Ease of Maintenance:** If a rule changes (e.g., "Shorts allowed on Friday"), we change one line of code. We don't have to retrain the AI for 13 hours.
3. **Context Awareness:** The Python module can check the **Current Time** or **Calendar**. The YOLO model only sees pixels.

---

## 3. MODEL SELECTION (YOLO11)
**Q: Why YOLO11 over succeeding generations (like YOLOv12, v10, or YOLO-World)?**

A: We evaluated the newer generations, but rejected them for specific technical reasons:

1. **YOLOv12 & v13 (Experimental/Beta):** During our development, these were in their early release phases. They lacked the stable deployment support (TensorRT/ONNX) we needed for real-time 137 FPS. In a thesis, stability is prioritized over "experimental" releases.
2. **YOLOv26 (Research/Future):** While research-level versions like v26 have been announced, our project reached its **"Freezing Point"** during the implementation of the 119k image dataset. Retraining such a massive dataset on a mid-thesis fork would be unfeasible and risky.
3. **YOLO-World (Open-Vocabulary):** Too heavy for our 6GB VRAM (GTX 1660 Super). It also has lower accuracy on fine-grained textures like "ripped denim" compared to our custom-trained YOLO11 model.
4. **YOLOv10 (NMS-Free):** While slightly faster, it lacks the **C2PSA (Spatial Attention)** mechanism introduced in YOLO11. YOLO11 is superior at identifying "overlapping garments" due to this module.

---

## 4. DATASET LIMITATIONS (THE CROP TOP DEFENSE)
**Q: The Crop Top class has lower mAP. Why didn't you clean the dataset?**
A: We encountered a **Subjective Ambiguity** problem. 
1. **Source Noise:** Global fashion datasets often have conflicting labels for "Crop Top" based on camera angles or model poses.
2. **Audit Scope:** Cleaning this perfectly would require a manual audit of 46,000 images, which exceeds the thesis timeframe.
3. **Prioritization:** We prioritized **Uniforms and Footwear** (highest institutional impact). We mitigated the lower Crop Top accuracy by tuning the **Rule Engine** with a higher confidence threshold for that specific class to avoid false accusations.

---

## 5. DATASET BALANCING (THE 25% DOWNSAMPLING RATIO)
**Q: Why did you cut the image count of the major classes down to 25%?**
A: This was to fix the **Class Imbalance** problem (where major classes drown out minor ones).
1. **Preventing Bias:** We had over 80,000 images of `uniform_top` but only 3,000 of some prohibited items. If we trained on 100% of the data, the AI would become biased and just guess "Uniform" every time. By cutting the major classes down to 25% (around 20,000 images), we artificially balanced the dataset so the minority classes had a "louder voice."
2. **Diminishing Returns:** The top 25% of the majority class images already contain all the necessary visual diversity (angles, lighting, fabric types) to learn what a uniform looks like. The remaining 75% are redundant and offer no new information to the neural network.
3. **Training Efficiency:** Keeping 100% of the redundant data would drastically increase our training time without improving the mAP. Downsampling allowed us to train faster while maintaining high accuracy.

**Q: But why exactly 25%? Why not 10%, 30%, or 50%?**
A: The 25% value was not arbitrary; it was the **Empirical Sweet Spot** chosen based on two factors:
1. **Target Ratio Alignment:** Our minority classes had around 3,000 to 5,000 images. The majority class had over 80,000. By cutting the majority down to 25% (20,000 images), we brought the imbalance ratio from an unmanageable ~26:1 down to a much healthier **4:1 or 6:1 ratio**. YOLO models, when combined with our Class Loss Weighting (`cls=2.0`), can comfortably handle a 5:1 imbalance.
2. **Ablation Testing (Trial & Error):** If we cut it down to **10% (8,000 images)**, we started losing important visual variety for the uniforms, and our baseline accuracy dropped. If we left it at **50% (40,000 images)**, the "loud voice" problem was still too strong, and the AI kept ignoring the prohibited items. **25%** was the perfect intersection where minority class accuracy peaked without hurting the majority classes.

**Q: If YOLO (via Focal Loss) has built-in capabilities to handle class imbalances automatically, why did you still need to manually downsample the data?**
A: That is the "Two-Pronged Attack" of deep learning. While YOLO uses **Focal Loss** to automatically down-weight easy, common examples and focus on rare ones, it is not magic.
1. **The Limit of Focal Loss:** Focal Loss works perfectly for moderate imbalances (e.g., a 5:1 or 10:1 ratio). However, our original raw dataset had an extreme **26:1 ratio** (80k uniforms vs 3k prohibited items). At that extreme level, the sheer mathematical volume of the majority class gradients overwhelms the Focal Loss mechanism.
2. **The Hybrid Solution:** We didn't try to make the classes exactly equal (1:1), because doing so would mean throwing away too much uniform data and losing visual variance. Instead, we used **Manual Downsampling** to bring the extreme 26:1 ratio down to a manageable 5:1 ratio, and then let **YOLO's Focal Loss** (combined with our `cls=2.0` penalty) handle the rest automatically.

---

## 5. RISK ALGORITHMS (TEMPORAL DECAY)
**Q: What is "Exponential Temporal Decay" and why use $\lambda = 0.023$?**
A: 
1. **The Concept:** It is a "fading memory" system. Recent violations have a high risk score, while old violations naturally "decay" or fade away over time.
2. **Fairness:** Unlike simple counting (which is punitive), decay allows for student growth. If a student improves, their risk score naturally drops.
3. **The Lambda ($\lambda = 0.023$):** This constant was calculated to create a **30-day Half-Life**. A violation recorded today is worth 50% less in a month. This ensures the system stays relevant to the current semester's behavior.

**Q: Did you consider other algorithms like Linear Decay or Moving Averages?**
A: Yes, but they were rejected for being mathematically "unfair":
1. **Linear Decay:** Too abrupt. A violation would suddenly vanish on a specific day (e.g., Day 20) rather than fading gracefully.
2. **Step-Function:** Creates unfair "edges" where a violation on June 30th drops by 50% overnight on July 1st.
3. **Simple Moving Average:** It treats a month-old mistake as being just as relevant as one from this morning. **Exponential Decay** is superior because it prioritizes recency.

---

## 6. SYSTEM WORKFLOW (STORY OF A FRAME)
**Q: How does the model detect things in real-time?**
A: It happens in 9.3 milliseconds across four stages:
1. **Preprocessing:** Frame is resized to 640x640.
2. **Feature Extraction:** **C3k2 modules** scan for patterns; **C2PSA (Spatial Attention)** focuses on the student.
3. **Prediction:** Bounding boxes are drawn with confidence scores.
4. **Adjudication:** The labels are sent to the Rule Engine to check against the Handbook.
