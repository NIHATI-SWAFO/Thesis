import os
import sys
import time
import cv2
import numpy as np
from pathlib import Path
# pyrefly: ignore [missing-import]
from flask import Flask, render_template_string, Response, request, jsonify
try:
    from ultralytics import YOLO
except ImportError:
    print("ERROR: ultralytics not installed.")
    sys.exit(1)

# Import our compliance logic
sys.path.append(str(Path(__file__).parent))
from detect import assess_compliance, draw_detections, CLASS_NAMES

# ============================================================
# CONFIGURATION
# ============================================================
BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent

_CANDIDATES = [
    ROOT_DIR / "models" / "best.pt",
    BASE_DIR / "models" / "best.pt",
    BASE_DIR / "models" / "yolo11s_dev_best.pt",
    ROOT_DIR / "best.pt",
]
MODEL_PATH = next((p for p in _CANDIDATES if p.exists()), None)
CONFIDENCE_THRESHOLD = 0.35

# Global state for the web controls
CURRENT_MODE = "CIVILIAN_MODE"
YEAR_LEVEL = 1
LATEST_COMPLIANCE = None

# Initialize Flask app
app = Flask(__name__)

# Load Model
if not MODEL_PATH or not MODEL_PATH.exists():
    print(f"ERROR: Model weights not found in {[str(p) for p in _CANDIDATES]}")
    sys.exit(1)
print(f"[*] Loaded YOLO Detection Model: {MODEL_PATH}")
model = YOLO(str(MODEL_PATH))

# Global camera object
camera = None

def get_camera():
    global camera
    if camera is None:
        camera = cv2.VideoCapture(0)
        camera.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    return camera


def generate_frames():
    global LATEST_COMPLIANCE
    cap = get_camera()
    while True:
        if cap is None or not cap.isOpened():
            frame = np.zeros((720, 1280, 3), dtype=np.uint8)
            cv2.putText(frame, "Camera not detected / in use by another app", (280, 360), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (200, 200, 200), 2)
            ret, buffer = cv2.imencode('.jpg', frame)
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
            time.sleep(0.5)
            continue

        success, frame = cap.read()
        if not success:
            frame = np.zeros((720, 1280, 3), dtype=np.uint8)
            cv2.putText(frame, "Waiting for video frame...", (380, 360), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (200, 200, 200), 2)
            ret, buffer = cv2.imencode('.jpg', frame)
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
            time.sleep(0.1)
            continue
        
        # 1. Run YOLO inference
        results = model(frame, conf=CONFIDENCE_THRESHOLD, verbose=False)
        result = results[0]

        # 2. Extract detections
        detections = []
        for box in result.boxes:
            cid = int(box.cls[0])
            conf = float(box.conf[0])
            bbox = box.xyxy[0].tolist()
            detections.append({
                "class_id": cid,
                "class_name": CLASS_NAMES.get(cid, f"unknown_{cid}"),
                "confidence": conf,
                "bbox": bbox,
            })

        # 3. Assess Compliance
        compliance = assess_compliance(detections, CURRENT_MODE, YEAR_LEVEL)
        compliance["detection_mode"] = f"{CURRENT_MODE} (Yr {YEAR_LEVEL})"

        global LATEST_COMPLIANCE
        LATEST_COMPLIANCE = compliance

        # 4. Draw Overlay
        annotated_frame = draw_detections(frame, detections, compliance)

        # 5. Convert to JPEG for web streaming
        ret, buffer = cv2.imencode('.jpg', annotated_frame)
        frame_bytes = buffer.tobytes()

        # Yield frame in MJPEG format
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')


# ============================================================
# WEB ROUTES
# ============================================================

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SWAFOTECH — Module 1: Live Dress Code Monitor</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
    <style>
        :root {
            --brand-primary: #003624;
            --brand-dark: #002619;
            --brand-surface: #004d33;
            --brand-emerald: #10b981;
            --brand-accent: #006b5d;
            --brand-tint: #ecfdf5;
            
            --bg-page: #f6f9f8;
            --bg-surface: #ffffff;
            --bg-subtle: #f1f5f3;
            --border-light: #e2e8f0;
            --border-emerald: rgba(16, 185, 129, 0.25);
            
            --text-heading: #0f172a;
            --text-body: #334155;
            --text-muted: #64748b;
            
            --danger-bg: #fff1f2;
            --danger-border: #fecdd3;
            --danger-text: #9f1239;
            --danger-accent: #e11d48;
            
            --success-bg: #ecfdf5;
            --success-border: #a7f3d0;
            --success-text: #065f46;
            --success-accent: #059669;
            
            --radius-xl: 24px;
            --radius-lg: 16px;
            --radius-md: 12px;
            --radius-sm: 8px;
            
            --shadow-card: 0 10px 30px -10px rgba(0, 54, 36, 0.08);
            --shadow-hover: 0 20px 40px -15px rgba(0, 54, 36, 0.12);
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background-color: var(--bg-page);
            color: var(--text-body);
            height: 100vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            -webkit-font-smoothing: antialiased;
        }

        /* ════════════════════════ TOP NAVIGATION BAR ════════════════════════ */
        .navbar {
            background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-surface) 100%);
            color: white;
            padding: 0.85rem 1.75rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 4px 20px rgba(0, 38, 25, 0.25);
            z-index: 100;
        }

        .navbar-brand {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .brand-logo {
            width: 44px;
            height: 44px;
            border-radius: var(--radius-md);
            background: rgba(255, 255, 255, 0.12);
            border: 1px solid rgba(255, 255, 255, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--brand-emerald);
            box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.15);
        }

        .brand-titles h1 {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 1.15rem;
            font-weight: 800;
            letter-spacing: -0.02em;
            color: #ffffff;
            line-height: 1.2;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .brand-titles h1 span.badge-module {
            font-size: 0.65rem;
            font-weight: 800;
            background: rgba(16, 185, 129, 0.2);
            color: #6ee7b7;
            border: 1px solid rgba(110, 231, 183, 0.3);
            padding: 0.15rem 0.5rem;
            border-radius: 9999px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
        }

        .brand-titles p {
            font-size: 0.75rem;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.7);
            letter-spacing: 0.01em;
        }

        .navbar-controls {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .status-pill-live {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(0, 0, 0, 0.25);
            border: 1px solid rgba(255, 255, 255, 0.15);
            padding: 0.45rem 0.85rem;
            border-radius: 9999px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.72rem;
            font-weight: 700;
            color: #e2e8f0;
            letter-spacing: 0.05em;
        }

        .live-pulse {
            width: 8px;
            height: 8px;
            background-color: #ef4444;
            border-radius: 50%;
            box-shadow: 0 0 10px #ef4444;
            animation: pulse-dot 1.8s infinite;
        }

        @keyframes pulse-dot {
            0% { transform: scale(0.95); opacity: 0.8; }
            50% { transform: scale(1.3); opacity: 1; }
            100% { transform: scale(0.95); opacity: 0.8; }
        }

        .controls-form {
            display: flex;
            gap: 0.75rem;
            align-items: center;
        }

        .custom-select-wrap {
            position: relative;
            display: flex;
            align-items: center;
        }

        .custom-select-wrap select {
            appearance: none;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: #ffffff;
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 0.82rem;
            font-weight: 600;
            padding: 0.55rem 2.2rem 0.55rem 1rem;
            border-radius: var(--radius-md);
            cursor: pointer;
            outline: none;
            transition: all 0.2s ease;
        }

        .custom-select-wrap select:hover {
            background: rgba(255, 255, 255, 0.16);
            border-color: rgba(255, 255, 255, 0.35);
        }

        .custom-select-wrap select:focus {
            border-color: var(--brand-emerald);
            background: rgba(0, 54, 36, 0.9);
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.25);
        }

        .custom-select-wrap select option {
            background-color: var(--brand-primary);
            color: #ffffff;
        }

        .custom-select-wrap .select-icon {
            position: absolute;
            right: 0.75rem;
            pointer-events: none;
            color: rgba(255, 255, 255, 0.6);
            font-size: 1.1rem;
        }

        .portal-link-btn {
            background: rgba(16, 185, 129, 0.2);
            border: 1px solid rgba(16, 185, 129, 0.4);
            color: #6ee7b7;
            padding: 0.55rem 1rem;
            border-radius: var(--radius-md);
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 0.8rem;
            font-weight: 700;
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 0.4rem;
            transition: all 0.2s ease;
        }

        .portal-link-btn:hover {
            background: rgba(16, 185, 129, 0.35);
            color: #ffffff;
            transform: translateY(-1px);
        }

        /* ════════════════════════ MAIN CONTAINER ════════════════════════ */
        .main-layout {
            display: flex;
            flex: 1;
            height: calc(100vh - 66px);
            overflow: hidden;
        }

        /* ════════════════════════ VIDEO FEED SECTION ════════════════════════ */
        .feed-stage {
            flex: 1;
            background: radial-gradient(circle at center, #edf4f0 0%, #e1ebe5 100%);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 1.5rem;
            position: relative;
            overflow: hidden;
        }

        .viewfinder-card {
            background: #000000;
            border-radius: var(--radius-xl);
            box-shadow: 0 25px 60px -15px rgba(0, 54, 36, 0.28), 0 0 0 1px rgba(0, 54, 36, 0.12);
            position: relative;
            max-width: 960px;
            width: 100%;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        .viewfinder-topbar {
            background: rgba(15, 23, 42, 0.85);
            backdrop-blur: 8px;
            color: rgba(255, 255, 255, 0.8);
            padding: 0.6rem 1.25rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.72rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            z-index: 10;
        }

        .cam-id {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: #cbd5e1;
            font-weight: 700;
        }

        .cam-id .active-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background-color: var(--brand-emerald);
            box-shadow: 0 0 8px var(--brand-emerald);
        }

        .model-spec {
            color: #94a3b8;
            font-weight: 500;
        }

        .video-container {
            position: relative;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #000000;
        }

        .video-container img {
            display: block;
            width: 100%;
            height: auto;
            max-height: calc(100vh - 200px);
            object-fit: contain;
        }

        /* Futuristic HUD Corner Reticles */
        .hud-bracket {
            position: absolute;
            width: 24px;
            height: 24px;
            border-color: rgba(16, 185, 129, 0.85);
            pointer-events: none;
            z-index: 5;
        }
        .bracket-tl { top: 14px; left: 14px; border-top: 3px solid var(--brand-emerald); border-left: 3px solid var(--brand-emerald); border-top-left-radius: 8px; }
        .bracket-tr { top: 14px; right: 14px; border-top: 3px solid var(--brand-emerald); border-right: 3px solid var(--brand-emerald); border-top-right-radius: 8px; }
        .bracket-bl { bottom: 14px; left: 14px; border-bottom: 3px solid var(--brand-emerald); border-left: 3px solid var(--brand-emerald); border-bottom-left-radius: 8px; }
        .bracket-br { bottom: 14px; right: 14px; border-bottom: 3px solid var(--brand-emerald); border-right: 3px solid var(--brand-emerald); border-bottom-right-radius: 8px; }

        .feed-meta-bottom {
            margin-top: 0.85rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            max-width: 960px;
            padding: 0 0.5rem;
            color: var(--text-muted);
            font-size: 0.75rem;
            font-weight: 600;
        }

        .feed-meta-bottom span {
            display: flex;
            align-items: center;
            gap: 0.35rem;
        }

        /* ════════════════════════ RIGHT ADJUDICATION PANEL ════════════════════════ */
        .sidebar-panel {
            width: 440px;
            background: var(--bg-surface);
            border-left: 1px solid var(--border-light);
            display: flex;
            flex-direction: column;
            box-shadow: -8px 0 30px rgba(0, 54, 36, 0.04);
            z-index: 10;
        }

        .panel-header {
            padding: 1.5rem 1.75rem 1.25rem;
            border-bottom: 1px solid var(--border-light);
            background: #ffffff;
            position: relative;
        }

        .panel-eyebrow {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 0.68rem;
            font-weight: 800;
            color: var(--brand-accent);
            letter-spacing: 0.12em;
            text-transform: uppercase;
            display: flex;
            align-items: center;
            gap: 0.4rem;
            margin-bottom: 0.35rem;
        }

        .panel-title {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 1.35rem;
            font-weight: 800;
            color: var(--text-heading);
            letter-spacing: -0.02em;
            line-height: 1.2;
        }

        /* ════════════════════════ LIVE STATUS CARD ════════════════════════ */
        .status-container {
            padding: 1.25rem 1.75rem;
            border-bottom: 1px solid var(--border-light);
            background: #fafcfb;
        }

        .status-banner {
            border-radius: var(--radius-lg);
            padding: 1.15rem 1.25rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }

        .status-banner.waiting {
            background: #f1f5f9;
            border: 1.5px solid #cbd5e1;
            color: #475569;
        }

        .status-banner.compliant {
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
            border: 1.5px solid #a7f3d0;
            color: var(--success-text);
            box-shadow: 0 8px 20px -6px rgba(5, 150, 105, 0.15);
        }

        .status-banner.non-compliant {
            background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%);
            border: 1.5px solid #fecdd3;
            color: var(--danger-text);
            box-shadow: 0 8px 20px -6px rgba(225, 29, 72, 0.18);
        }

        .status-icon-wrap {
            width: 48px;
            height: 48px;
            border-radius: var(--radius-md);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            font-size: 1.75rem;
        }

        .compliant .status-icon-wrap {
            background: #ffffff;
            color: var(--success-accent);
            box-shadow: 0 4px 10px rgba(5, 150, 105, 0.12);
        }

        .non-compliant .status-icon-wrap {
            background: #ffffff;
            color: var(--danger-accent);
            box-shadow: 0 4px 10px rgba(225, 29, 72, 0.15);
        }

        .waiting .status-icon-wrap {
            background: #ffffff;
            color: #64748b;
        }

        .status-content {
            flex: 1;
        }

        .status-title {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 1rem;
            font-weight: 800;
            letter-spacing: -0.01em;
            line-height: 1.25;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .status-tag {
            font-size: 0.65rem;
            font-weight: 800;
            padding: 0.2rem 0.55rem;
            border-radius: 9999px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .non-compliant .status-tag {
            background: #f43f5e;
            color: #ffffff;
        }

        .compliant .status-tag {
            background: #10b981;
            color: #ffffff;
        }

        .status-desc {
            font-size: 0.78rem;
            font-weight: 500;
            margin-top: 0.3rem;
            opacity: 0.85;
            line-height: 1.35;
        }

        /* ════════════════════════ DETECTED ATTIRE SUMMARY ════════════════════════ */
        .attire-summary {
            padding: 0.85rem 1.75rem;
            background: #ffffff;
            border-bottom: 1px solid var(--border-light);
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
        }

        .attire-summary-title {
            font-size: 0.68rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--text-muted);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .detected-tags-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.4rem;
            min-height: 28px;
            align-items: center;
        }

        .garment-tag {
            display: inline-flex;
            align-items: center;
            gap: 0.3rem;
            padding: 0.25rem 0.65rem;
            border-radius: var(--radius-sm);
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            font-size: 0.72rem;
            font-weight: 600;
            color: #1e293b;
        }

        .garment-tag.prohibited-tag {
            background: #fff1f2;
            border-color: #fecdd3;
            color: #9f1239;
        }

        .garment-tag.uniform-tag {
            background: #ecfdf5;
            border-color: #a7f3d0;
            color: #065f46;
        }

        .garment-tag span.conf-pill {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.65rem;
            opacity: 0.75;
        }

        /* ════════════════════════ VIOLATION LIST (SIDE CELLS) ════════════════════════ */
        .violations-container {
            flex: 1;
            overflow-y: auto;
            padding: 1.25rem 1.75rem;
            background: #fafcfb;
            display: flex;
            flex-direction: column;
            gap: 0.85rem;
        }

        /* Custom Scrollbar */
        .violations-container::-webkit-scrollbar {
            width: 6px;
        }
        .violations-container::-webkit-scrollbar-track {
            background: transparent;
        }
        .violations-container::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 9999px;
        }
        .violations-container::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }

        /* Elegant Violation Card Cells */
        .violation-card {
            background: #ffffff;
            border: 1.5px solid var(--danger-border);
            border-radius: var(--radius-lg);
            padding: 1.15rem 1.25rem;
            box-shadow: 0 4px 15px -3px rgba(225, 29, 72, 0.06);
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .violation-card::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 4px;
            background: linear-gradient(180deg, #f43f5e 0%, #be123c 100%);
            border-top-left-radius: var(--radius-lg);
            border-bottom-left-radius: var(--radius-lg);
        }

        .violation-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px -5px rgba(225, 29, 72, 0.12);
            border-color: #fda4af;
        }

        .violation-card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.5rem;
        }

        .violation-handbook-pill {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.68rem;
            font-weight: 700;
            padding: 0.25rem 0.55rem;
            background: #fff1f2;
            color: var(--danger-accent);
            border: 1px solid #fecdd3;
            border-radius: 6px;
            letter-spacing: 0.05em;
            display: flex;
            align-items: center;
            gap: 0.35rem;
        }

        .violation-type-badge {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 0.65rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: #94a3b8;
        }

        .violation-card-title {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 0.95rem;
            font-weight: 800;
            color: #881337;
            letter-spacing: -0.01em;
            line-height: 1.3;
            display: flex;
            align-items: center;
            gap: 0.45rem;
        }

        .violation-card-title .material-symbols-outlined {
            font-size: 1.15rem;
            color: var(--danger-accent);
        }

        .violation-card-desc {
            font-size: 0.8rem;
            line-height: 1.45;
            color: #475569;
            font-weight: 500;
        }

        .violation-card-footer {
            margin-top: 0.25rem;
            padding-top: 0.5rem;
            border-top: 1px dashed #fee2e2;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 0.7rem;
            font-weight: 600;
            color: #9f1239;
        }

        .violation-card-footer span {
            display: flex;
            align-items: center;
            gap: 0.3rem;
        }

        /* Compliant Empty State */
        .empty-compliant-state {
            padding: 3rem 1.5rem;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            color: var(--success-text);
        }

        .empty-icon-shield {
            width: 72px;
            height: 72px;
            border-radius: 50%;
            background: #d1fae5;
            border: 2px solid #a7f3d0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--success-accent);
            margin-bottom: 0.5rem;
            box-shadow: 0 10px 25px rgba(16, 185, 129, 0.2);
            animation: bounce-gentle 3s infinite;
        }

        @keyframes bounce-gentle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
        }

        .empty-icon-shield .material-symbols-outlined {
            font-size: 2.5rem;
        }

        .empty-compliant-state h4 {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 1.15rem;
            font-weight: 800;
            color: var(--brand-primary);
        }

        .empty-compliant-state p {
            font-size: 0.82rem;
            color: #64748b;
            max-width: 260px;
            line-height: 1.4;
        }

        /* ════════════════════════ ACTION FOOTER ════════════════════════ */
        .panel-footer {
            padding: 1.25rem 1.75rem;
            background: #ffffff;
            border-top: 1px solid var(--border-light);
            box-shadow: 0 -4px 15px rgba(0, 54, 36, 0.03);
        }

        .record-incident-btn {
            width: 100%;
            padding: 1rem 1.5rem;
            background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-surface) 100%);
            color: #ffffff;
            border: none;
            border-radius: var(--radius-md);
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 0.88rem;
            font-weight: 800;
            letter-spacing: 0.02em;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.6rem;
            box-shadow: 0 10px 25px -5px rgba(0, 54, 36, 0.35);
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }

        .record-incident-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 15px 30px -5px rgba(0, 54, 36, 0.45);
            background: linear-gradient(135deg, #00281b 0%, #005a3b 100%);
        }

        .record-incident-btn:active:not(:disabled) {
            transform: scale(0.98);
        }

        .record-incident-btn:disabled {
            background: #e2e8f0;
            color: #94a3b8;
            box-shadow: none;
            cursor: not-allowed;
            transform: none;
        }

        .record-incident-btn .material-symbols-outlined {
            font-size: 1.25rem;
        }

        /* Subtext hint */
        .footer-hint {
            font-size: 0.7rem;
            color: #94a3b8;
            text-align: center;
            margin-top: 0.5rem;
            font-weight: 500;
        }
    </style>
</head>
<body>

    <!-- ════════════════════════ TOP NAVIGATION BAR ════════════════════════ -->
    <header class="navbar">
        <div class="navbar-brand">
            <div class="brand-logo">
                <span class="material-symbols-outlined">center_focus_strong</span>
            </div>
            <div class="brand-titles">
                <h1>SWAFOTECH VISION <span class="badge-module">MODULE 1</span></h1>
                <p>DLSU-D Smart Campus Dress Code Monitoring System</p>
            </div>
        </div>

        <div class="navbar-controls">
            <div class="status-pill-live">
                <div class="live-pulse"></div>
                <span>LIVE FEED</span>
            </div>

            <form class="controls-form" action="/update_settings" method="post" target="hidden-iframe">
                <div class="custom-select-wrap">
                    <select name="mode" id="mode" onchange="this.form.submit()">
                        <option value="UNIFORM_MODE" {% if current_mode == 'UNIFORM_MODE' %}selected{% endif %}>Uniform Mode (Mon/Tue/Thu)</option>
                        <option value="CIVILIAN_MODE" {% if current_mode == 'CIVILIAN_MODE' %}selected{% endif %}>Civilian / Wash Day (Wed/Fri/Sat)</option>
                    </select>
                    <span class="material-symbols-outlined select-icon">expand_more</span>
                </div>

                <div class="custom-select-wrap">
                    <select name="year" id="year" onchange="this.form.submit()">
                        <option value="1" {% if year_level == 1 %}selected{% endif %}>Year Level: 1st – 3rd Year</option>
                        <option value="4" {% if year_level == 4 %}selected{% endif %}>Year Level: 4th Year (Graduating)</option>
                    </select>
                    <span class="material-symbols-outlined select-icon">expand_more</span>
                </div>
            </form>

            <a href="http://localhost:5173" target="_blank" class="portal-link-btn" title="Open SWAFO Web Application">
                <span class="material-symbols-outlined" style="font-size: 18px;">open_in_new</span>
                <span>SWAFO Portal</span>
            </a>
        </div>
    </header>

    <!-- ════════════════════════ MAIN LAYOUT ════════════════════════ -->
    <main class="main-layout">

        <!-- LEFT: VIDEO STREAM STAGE -->
        <section class="feed-stage">
            <div class="viewfinder-card">
                <div class="viewfinder-topbar">
                    <div class="cam-id">
                        <div class="active-dot"></div>
                        <span>OPTICAL ENTRANCE CAMERA • FEED 01</span>
                    </div>
                    <div class="model-spec">
                        <span>MODEL: YOLO11s (88.9% mAP) • CONF: 35%</span>
                    </div>
                </div>

                <div class="video-container">
                    <!-- HUD Reticles -->
                    <div class="hud-bracket bracket-tl"></div>
                    <div class="hud-bracket bracket-tr"></div>
                    <div class="hud-bracket bracket-bl"></div>
                    <div class="hud-bracket bracket-br"></div>

                    <img src="/video_feed" alt="SWAFOTECH Live Inference Stream">
                </div>
            </div>

            <div class="feed-meta-bottom">
                <span><span class="material-symbols-outlined" style="font-size: 15px;">policy</span> Institutional Policy: Handbook Section 27.1.2</span>
                <span id="live-clock"><span class="material-symbols-outlined" style="font-size: 15px;">schedule</span> Active Monitor</span>
            </div>
        </section>

        <!-- RIGHT: ADJUDICATION SIDEBAR PANEL -->
        <aside class="sidebar-panel">
            <div class="panel-header">
                <div class="panel-eyebrow">
                    <span class="material-symbols-outlined" style="font-size: 15px;">verified_user</span>
                    <span>AUTOMATED ADJUDICATION</span>
                </div>
                <h2 class="panel-title">Attire Compliance Status</h2>
            </div>

            <!-- Real-Time Status Card -->
            <div class="status-container">
                <div id="status-banner" class="status-banner waiting">
                    <div class="status-icon-wrap" id="status-icon">
                        <span class="material-symbols-outlined">hourglass_top</span>
                    </div>
                    <div class="status-content">
                        <div class="status-title">
                            <span id="status-heading">INITIALIZING AI...</span>
                            <span id="status-tag" class="status-tag">STANDBY</span>
                        </div>
                        <p class="status-desc" id="status-subtext">Awaiting camera detection frame...</p>
                    </div>
                </div>
            </div>

            <!-- Detected Garments Chip Bar -->
            <div class="attire-summary">
                <div class="attire-summary-title">
                    <span>YOLO Detected Garments</span>
                    <span id="attire-count" style="font-family: 'JetBrains Mono', monospace;">0 detected</span>
                </div>
                <div class="detected-tags-list" id="detected-tags-list">
                    <span class="garment-tag" style="color: #94a3b8;">Scanning attire...</span>
                </div>
            </div>

            <!-- Scrollable Violation Cards -->
            <div class="violations-container" id="violations-container">
                <div class="empty-compliant-state">
                    <div class="empty-icon-shield">
                        <span class="material-symbols-outlined">shield_check</span>
                    </div>
                    <h4>Scanning in Progress</h4>
                    <p>Point camera at student attire to run real-time compliance evaluation.</p>
                </div>
            </div>

            <!-- Incident Adjudication Action Button -->
            <div class="panel-footer">
                <button id="record-btn" class="record-incident-btn" disabled onclick="recordViolation()">
                    <span class="material-symbols-outlined">assignment_turned_in</span>
                    <span>TRANSFER TO SWAFO RECORD</span>
                </button>
                <p class="footer-hint">Directly escalates detected violation to Module 2 Adjudication Flow</p>
            </div>
        </aside>

    </main>

    <iframe name="hidden-iframe" style="display:none;"></iframe>

    <script>
        // Update live clock
        setInterval(() => {
            const clockEl = document.getElementById('live-clock');
            if (clockEl) {
                const now = new Date();
                clockEl.innerHTML = `<span class="material-symbols-outlined" style="font-size: 15px;">schedule</span> ${now.toLocaleTimeString()}`;
            }
        }, 1000);

        function updateStatus() {
            fetch('/api/status')
                .then(response => response.json())
                .then(data => {
                    if (data.compliance_status === "WAITING") return;

                    const banner = document.getElementById('status-banner');
                    const iconWrap = document.getElementById('status-icon');
                    const heading = document.getElementById('status-heading');
                    const tag = document.getElementById('status-tag');
                    const subtext = document.getElementById('status-subtext');
                    const container = document.getElementById('violations-container');
                    const recordBtn = document.getElementById('record-btn');
                    const tagsList = document.getElementById('detected-tags-list');
                    const attireCount = document.getElementById('attire-count');

                    // 1. Update Detected Garment Chips
                    if (data.detected_classes && data.detected_classes.length > 0) {
                        attireCount.innerText = `${data.detected_classes.length} items detected`;
                        let tagHtml = '';
                        data.detected_classes.forEach(c => {
                            const isProhibited = c.startsWith('prohibited') || c.includes('slippers');
                            const isUniform = c.startsWith('uniform');
                            const tagClass = isProhibited ? 'garment-tag prohibited-tag' : (isUniform ? 'garment-tag uniform-tag' : 'garment-tag');
                            const cleanName = c.replace(/_/g, ' ');
                            tagHtml += `<span class="${tagClass}"><span>${cleanName}</span></span>`;
                        });
                        tagsList.innerHTML = tagHtml;
                    } else {
                        attireCount.innerText = '0 items detected';
                        tagsList.innerHTML = '<span class="garment-tag" style="color: #94a3b8;">No attire in frame</span>';
                    }

                    // 2. Update Status Card and Violation Cards
                    if (data.compliance_status === "COMPLIANT") {
                        banner.className = 'status-banner compliant';
                        iconWrap.innerHTML = '<span class="material-symbols-outlined">verified</span>';
                        heading.innerText = 'OFFICIALLY COMPLIANT';
                        tag.innerText = 'CLEARED';
                        subtext.innerText = `Attire adheres to DLSU-D Handbook Section 27.1.2 (${data.detection_mode})`;

                        container.innerHTML = `
                            <div class="empty-compliant-state">
                                <div class="empty-icon-shield">
                                    <span class="material-symbols-outlined">verified</span>
                                </div>
                                <h4>Attire Compliant</h4>
                                <p>Student garments adhere to the DLSU-D dress code policy for ${data.detection_mode}.</p>
                            </div>
                        `;
                        recordBtn.disabled = true;
                    } else {
                        banner.className = 'status-banner non-compliant';
                        iconWrap.innerHTML = '<span class="material-symbols-outlined">warning</span>';
                        heading.innerText = 'NON-COMPLIANT ATTIRE';
                        tag.innerText = `${data.violation_count} INFRACTIONS`;
                        subtext.innerText = `Policy violation detected under Section 27.1.2 (${data.detection_mode})`;

                        let cardsHtml = '';
                        data.violations.forEach((v, idx) => {
                            const cleanClass = v.class.replace(/_/g, ' ').toUpperCase();
                            cardsHtml += `
                                <div class="violation-card">
                                    <div class="violation-card-header">
                                        <div class="violation-handbook-pill">
                                            <span class="material-symbols-outlined" style="font-size: 14px;">gavel</span>
                                            <span>SEC ${v.handbook_ref}</span>
                                        </div>
                                        <span class="violation-type-badge">${v.severity || 'MINOR OFFENSE'}</span>
                                    </div>

                                    <div class="violation-card-title">
                                        <span class="material-symbols-outlined">error</span>
                                        <span>${cleanClass}</span>
                                    </div>

                                    <p class="violation-card-desc">${v.description}</p>

                                    <div class="violation-card-footer">
                                        <span>
                                            <span class="material-symbols-outlined" style="font-size: 14px;">report_problem</span>
                                            Mandated Sanction: 1st Instance Written Warning
                                        </span>
                                    </div>
                                </div>
                            `;
                        });
                        container.innerHTML = cardsHtml;
                        recordBtn.disabled = false;
                    }
                })
                .catch(err => console.error('Status sync error:', err));
        }

        function recordViolation() {
            // Lock and open SWAFO Module 2 Record Violation in new tab
            const targetUrl = "http://localhost:5173/violations/record";
            const confirmRecord = confirm("Transfer this detected attire violation to the SWAFO Module 2 Violation Adjudication Portal?");
            if (confirmRecord) {
                window.open(targetUrl, "_blank");
            }
        }

        // Poll status every 500ms
        setInterval(updateStatus, 500);
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    return render_template_string(
        HTML_TEMPLATE, 
        current_mode=CURRENT_MODE, 
        year_level=YEAR_LEVEL
    )

@app.route('/video_feed')
def video_feed():
    # Returns the streaming response using our generator
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/api/status')
def api_status():
    if LATEST_COMPLIANCE:
        return jsonify(LATEST_COMPLIANCE)
    return jsonify({"compliance_status": "WAITING", "violations": []})

@app.route('/update_settings', methods=['POST'])
def update_settings():
    global CURRENT_MODE, YEAR_LEVEL
    CURRENT_MODE = request.form.get('mode', CURRENT_MODE)
    YEAR_LEVEL = int(request.form.get('year', YEAR_LEVEL))
    
    # Auto-switch to civilian mode if 4th year is selected
    if YEAR_LEVEL == 4:
        CURRENT_MODE = "CIVILIAN_MODE"
        
    print(f"[*] Settings updated: {CURRENT_MODE}, Year {YEAR_LEVEL}")
    return "OK", 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5050))
    print("="*60)
    print(" STARTING SWAFOTECH DRESS CODE DETECTION WEB APP ")
    print("="*60)
    print(f"1. Open your web browser")
    print(f"2. Go to: http://localhost:{port}")
    print("="*60)
    
    # Run Flask server
    app.run(host='0.0.0.0', port=port, debug=False)
