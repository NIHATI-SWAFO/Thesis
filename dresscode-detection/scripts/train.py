"""
SWAFOTECH YOLO11s Model Training Script
=======================================
This script automates the transfer learning training pipeline of the YOLO11s model
on the balanced 14-class campus dress code dataset.

Execution:
    .venv\\Scripts\\python.exe scripts/train.py
"""

import os
from pathlib import Path
from ultralytics import YOLO

# ============================================================
# CONFIGURATION
# ============================================================
BASE_DIR = Path(__file__).parent.parent
DATA_YAML = BASE_DIR / "dataset" / "balanced" / "data.yaml"
PRETRAINED_MODEL = BASE_DIR / "yolo11s.pt"

def main():
    print("=" * 60)
    print("SWAFOTECH DRESS CODE DETECTION — MODEL TRAINING PIPELINE")
    print(f"  Dataset Configuration: {DATA_YAML}")
    print(f"  Pretrained Weights:     {PRETRAINED_MODEL}")
    print("=" * 60)

    # 1. Initialize YOLO11s Model with pre-trained COCO weights (Transfer Learning)
    if not PRETRAINED_MODEL.exists():
        print(f"Downloading pre-trained YOLO11s weights to {PRETRAINED_MODEL}...")
    
    model = YOLO(str(PRETRAINED_MODEL))

    # 2. Run the Ultralytics Training Pipeline
    # These parameters ensure optimal learning rates and memory usage
    results = model.train(
        data=str(DATA_YAML),      # Path to dataset data.yaml
        epochs=100,               # Number of training epochs (full dataset sweeps)
        imgsz=640,                # Input image size (square 640x640)
        batch=16,                 # Number of training samples processed per batch
        device=0,                 # Device selection (0 = First CUDA GPU, 'cpu' = CPU)
        workers=4,                # Number of data loading workers
        optimizer="AdamW",        # AdamW optimizer for stable gradient steps
        lr0=0.01,                 # Initial learning rate
        lrf=0.01,                 # Final OneCycleLR learning rate fraction
        val=True,                 # Run validation on the val split after each epoch
        name="swafotech_yolo11s", # Experiment save directory name
        exist_ok=True             # Overwrite folder if it exists
    )

    print("\nTraining completed successfully!")
    print(f"Best model weights saved in runs/detect/swafotech_yolo11s/weights/best.pt")

if __name__ == "__main__":
    main()
