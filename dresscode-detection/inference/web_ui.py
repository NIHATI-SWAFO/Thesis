import os
import sys
import cv2
from pathlib import Path
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
BASE_DIR = Path(__file__).parent.parent
MODEL_PATH = BASE_DIR / "models" / "yolo11s_dev_best.pt"
CONFIDENCE_THRESHOLD = 0.35

# Global state for the web controls
CURRENT_MODE = "CIVILIAN_MODE"
YEAR_LEVEL = 1
LATEST_COMPLIANCE = None

# Initialize Flask app
app = Flask(__name__)

# Load Model
if not MODEL_PATH.exists():
    print(f"ERROR: Model not found at {MODEL_PATH}")
    sys.exit(1)
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
    cap = get_camera()
    while True:
        success, frame = cap.read()
        if not success:
            break
        
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
<html>
<head>
    <title>SWAFO Module 1 - Dress Code Detection</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        :root {
            --primary: #0b4528;
            --primary-dark: #072e1a;
            --danger: #dc3545;
            --danger-dark: #b02a37;
            --success: #198754;
            --bg-light: #f8f9fa;
            --border: #e9ecef;
            --text-main: #212529;
            --text-muted: #6c757d;
        }
        body { 
            font-family: 'Inter', sans-serif; 
            background-color: var(--bg-light); 
            margin: 0; 
            padding: 0; 
            color: var(--text-main);
            display: flex;
            flex-direction: column;
            height: 100vh;
        }
        .header { 
            background-color: white; 
            border-bottom: 1px solid var(--border);
            padding: 1rem 2rem; 
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .header h1 {
            margin: 0;
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--primary);
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        .controls-form {
            display: flex;
            gap: 1rem;
            align-items: center;
        }
        select {
            padding: 0.5rem;
            border: 1px solid var(--border);
            border-radius: 6px;
            font-family: inherit;
            font-size: 0.9rem;
            background-color: white;
            outline: none;
            cursor: pointer;
        }
        .main-container {
            display: flex;
            flex: 1;
            overflow: hidden;
        }
        .video-section {
            flex: 1;
            padding: 2rem;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: var(--bg-light);
        }
        .video-wrapper {
            background: black;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 8px 16px rgba(0,0,0,0.1);
            position: relative;
        }
        .video-wrapper img {
            display: block;
            max-width: 100%;
            height: auto;
        }
        .status-panel {
            width: 400px;
            background: white;
            border-left: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            box-shadow: -4px 0 15px rgba(0,0,0,0.03);
        }
        .status-header {
            padding: 1.5rem;
            border-bottom: 1px solid var(--border);
            background: #fff;
        }
        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            border-radius: 50px;
            font-weight: 600;
            font-size: 0.9rem;
            margin-bottom: 0.5rem;
        }
        .status-badge.compliant {
            background-color: #d1e7dd;
            color: var(--success);
        }
        .status-badge.non-compliant {
            background-color: #f8d7da;
            color: var(--danger);
        }
        .status-badge.waiting {
            background-color: #e2e3e5;
            color: var(--text-muted);
        }
        .violation-list {
            flex: 1;
            overflow-y: auto;
            padding: 1.5rem;
            background: #fafafa;
        }
        .violation-item {
            background: #fff;
            border: 1px solid var(--border);
            border-left: 4px solid var(--danger);
            border-radius: 6px;
            padding: 1rem;
            margin-bottom: 1rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .violation-title {
            font-weight: 600;
            color: var(--danger);
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            text-transform: capitalize;
        }
        .violation-desc {
            font-size: 0.85rem;
            color: var(--text-muted);
            margin-top: 0.5rem;
            line-height: 1.4;
        }
        .violation-ref {
            font-size: 0.75rem;
            font-weight: 600;
            background: #f8f9fa;
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            color: var(--text-main);
            border: 1px solid var(--border);
        }
        .action-section {
            padding: 1.5rem;
            border-top: 1px solid var(--border);
            background: #fff;
        }
        .record-btn {
            width: 100%;
            padding: 1rem;
            background-color: var(--danger);
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            transition: all 0.2s;
            box-shadow: 0 4px 6px rgba(220, 53, 69, 0.2);
        }
        .record-btn:hover {
            background-color: var(--danger-dark);
            transform: translateY(-1px);
            box-shadow: 0 6px 8px rgba(220, 53, 69, 0.3);
        }
        .record-btn:disabled {
            background-color: #ccc;
            box-shadow: none;
            cursor: not-allowed;
            transform: none;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1><i class="fa-solid fa-camera"></i> SWAFO Module 1: Live Dress Code Monitor</h1>
        <form class="controls-form" action="/update_settings" method="post" target="hidden-iframe">
            <select name="mode" id="mode" onchange="this.form.submit()">
                <option value="UNIFORM_MODE" {% if current_mode == 'UNIFORM_MODE' %}selected{% endif %}>Uniform Mode (Mon/Tue/Thu/Fri)</option>
                <option value="CIVILIAN_MODE" {% if current_mode == 'CIVILIAN_MODE' %}selected{% endif %}>Civilian Mode (Wash Days)</option>
            </select>
            <select name="year" id="year" onchange="this.form.submit()">
                <option value="1" {% if year_level == 1 %}selected{% endif %}>1st - 3rd Year</option>
                <option value="4" {% if year_level == 4 %}selected{% endif %}>4th Year</option>
            </select>
        </form>
    </div>
    
    <div class="main-container">
        <div class="video-section">
            <div class="video-wrapper">
                <img src="/video_feed" alt="Live Camera Feed">
            </div>
        </div>
        
        <div class="status-panel">
            <div class="status-header">
                <h3 style="margin-top:0; margin-bottom: 0.75rem; color: var(--text-main);">Live Assessment</h3>
                <div id="status-badge" class="status-badge waiting">
                    <i class="fa-solid fa-spinner fa-spin"></i> Initializing...
                </div>
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;" id="detection-mode">Mode: Loading...</div>
            </div>
            
            <div class="violation-list" id="violation-list">
                <div style="text-align: center; color: var(--text-muted); margin-top: 3rem;">
                    <i class="fa-solid fa-video" style="font-size: 2.5rem; margin-bottom: 1rem; opacity: 0.4;"></i>
                    <p>Awaiting camera feed...</p>
                </div>
            </div>
            
            <div class="action-section">
                <button id="record-btn" class="record-btn" disabled onclick="recordViolation()">
                    <i class="fa-solid fa-file-signature"></i> Record Violation
                </button>
            </div>
        </div>
    </div>
    
    <iframe name="hidden-iframe" style="display:none;"></iframe>

    <script>
        function updateStatus() {
            fetch('/api/status')
                .then(response => response.json())
                .then(data => {
                    if (data.compliance_status === "WAITING") return;
                    
                    const badge = document.getElementById('status-badge');
                    const list = document.getElementById('violation-list');
                    const btn = document.getElementById('record-btn');
                    const modeText = document.getElementById('detection-mode');
                    
                    modeText.innerText = `Current Rule: ${data.detection_mode}`;
                    
                    if (data.compliance_status === "COMPLIANT") {
                        badge.className = 'status-badge compliant';
                        badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> COMPLIANT';
                        list.innerHTML = `
                            <div style="text-align: center; color: var(--success); margin-top: 3rem;">
                                <i class="fa-solid fa-shield-check" style="font-size: 3.5rem; margin-bottom: 1rem; opacity: 0.9;"></i>
                                <h4 style="margin-bottom: 0.5rem; font-size: 1.1rem;">No Violations Detected</h4>
                                <p style="font-size: 0.9rem; color: var(--text-muted); margin-top: 0;">Student attire adheres to the handbook.</p>
                            </div>
                        `;
                        btn.disabled = true;
                    } else {
                        badge.className = 'status-badge non-compliant';
                        badge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> NON-COMPLIANT (${data.violation_count})`;
                        
                        let html = '';
                        data.violations.forEach(v => {
                            const formattedTitle = v.class.replace(/_/g, ' ');
                            html += `
                                <div class="violation-item">
                                    <div class="violation-title">
                                        <i class="fa-solid fa-circle-exclamation"></i> ${formattedTitle}
                                    </div>
                                    <span class="violation-ref">Sec ${v.handbook_ref}</span>
                                    <div class="violation-desc">${v.description}</div>
                                </div>
                            `;
                        });
                        list.innerHTML = html;
                        btn.disabled = false;
                    }
                })
                .catch(err => console.error('Error fetching status:', err));
        }

        function recordViolation() {
            alert("PLACEHOLDER: This will lock the camera frame and redirect to the SWAFO Module 2 Adjudication Flow to formally log the offense.");
        }

        // Poll every 500ms
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
    print("="*60)
    print(" STARTING WEB CAMERA SERVER ")
    print("="*60)
    print("1. Open your web browser")
    print("2. Go to: http://127.0.0.1:5000")
    print("="*60)
    
    # Run Flask server
    app.run(host='0.0.0.0', port=5000, debug=False)
