# Official YOLO11s Master Benchmark Evaluation Report
**Project:** NIHATI-SWAFO Smart Campus Dress Code Monitoring System  
**Dataset Split:** Official Master Test Split (`balanced/images/test`) — **100% Evaluated (No Sampling)**  
**Architecture:** YOLO11s (`9.42M` parameters, `21.3 GFLOPs`, `100` layers)  
**Total Test Images:** Exactly **8,989 images**  
**Total Evaluated Instances:** Exactly **13,727 ground-truth bounding boxes**  
**Overall Performance:** **$\mathbf{88.9\%}$ mAP@0.50** | **$\mathbf{83.8\%}$ Precision** | **$\mathbf{82.8\%}$ Recall** | **$\mathbf{83.3\%}$ F1-Score** | **$\mathbf{73.2\%}$ mAP@0.50:0.95**  

---

## 1. Official Master Test Split Results Table (Thesis Chapter 4)

| Target Class | Test Instances ($N$) | Precision ($P$) | Recall ($R$) | F1-Score ($F_1$) | mAP@0.50 | mAP@0.50:0.95 |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **`uniform_top`** | 203 | 94.2% | 91.6% | **92.9%** | **94.1%** | 88.0% |
| **`uniform_bottom`** | 193 | 90.0% | 91.7% | **90.8%** | **95.3%** | 91.5% |
| **`civilian_top_short_sleeve`** | 1,976 | 82.8% | 87.9% | **85.3%** | **91.5%** | 77.5% |
| **`civilian_top_long_sleeve`** | 994 | 74.6% | 78.2% | **76.4%** | **81.6%** | 66.8% |
| **`civilian_bottom_trousers`** | 1,684 | 89.1% | 86.6% | **87.8%** | **93.5%** | 76.0% |
| **`civilian_bottom_shorts`** | 935 | 85.0% | 82.9% | **83.9%** | **91.5%** | 72.3% |
| **`civilian_bottom_skirt`** | 773 | 77.3% | 78.4% | **77.8%** | **84.4%** | 70.5% |
| **`footwear_shoes`** | 1,889 | 82.4% | 71.8% | **76.7%** | **80.8%** | 55.7% |
| **`footwear_slippers`** | 477 | 90.3% | 72.4% | **80.4%** | **85.6%** | 61.3% |
| **`prohibited_ripped_pants`** | 214 | 75.8% | 82.7% | **79.1%** | **87.8%** | 74.4% |
| **`prohibited_leggings`** | 506 | 83.8% | 82.0% | **82.9%** | **89.1%** | 72.3% |
| **`prohibited_sleeveless`** | 3,259 | 87.6% | 89.2% | **88.4%** | **94.5%** | 70.5% |
| **`prohibited_crop_halter`** | 72 | 78.0% | 90.3% | **83.7%** | **92.0%** | 81.4% |
| **`prohibited_midriff_offshoulder`** | 552 | 82.4% | 72.9% | **77.4%** | **83.0%** | 66.8% |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **ALL CLASSES (Official Master Test Split)** | **13,727** | **83.8%** | **82.8%** | **83.3%** | **88.9%** | **73.2%** |

---

## 2. Key Academic Analysis & Defense Discussion

1. **Rock-Solid Institutional Uniform Identification:**
   - `uniform_top`: **$94.1\%$ mAP@0.50** ($P=94.2\%$, $R=91.6\%$, $F_1=92.9\%$)
   - `uniform_bottom`: **$95.3\%$ mAP@0.50** ($P=90.0\%$, $R=91.7\%$, $F_1=90.8\%$)
   - Both uniform elements achieve exceptional bounding box localization (**$88.0\%$ and $91.5\%$ mAP@50-95$**).
2. **Comprehensive Prohibited Garment Detection:**
   - `prohibited_sleeveless`: **$94.5\%$ mAP@0.50** across 3,259 test instances.
   - `prohibited_crop_halter`: **$92.0\%$ mAP@0.50** ($R=90.3\%$, $F_1=83.7\%$).
   - `prohibited_leggings`: **$89.1\%$ mAP@0.50** across 506 test instances.
   - `prohibited_ripped_pants`: **$87.8\%$ mAP@0.50** across 214 test instances.
   - `prohibited_midriff_offshoulder`: **$83.0\%$ mAP@0.50** across 552 test instances.
3. **Everyday Civilian Clothing vs. Infractions:**
   - Trousers (`civilian_bottom_trousers`) reached **$93.5\%$ mAP@0.50**.
   - Short sleeve civilian shirts reached **$91.5\%$ mAP@0.50**.
   - Footwear detection maintains strong robustness: closed shoes at **$80.8\%$ mAP@0.50** (1,889 instances) and slippers at **$85.6\%$ mAP@0.50** with **$90.3\%$ Precision**.

---

## 3. High-Resolution Visual Evidence Saved
Evaluation artifacts from all 8,989 test images are saved in:
- `models/eval_plots_official_test/confusion_matrix.png`
- `models/eval_plots_official_test/confusion_matrix_normalized.png`
- `models/eval_plots_official_test/BoxPR_curve.png`
- `models/eval_plots_official_test/BoxF1_curve.png`
