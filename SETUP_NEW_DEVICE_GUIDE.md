# New Device & Antigravity Setup Guide

This guide provides a step-by-step walkthrough to get the entire SWAFO thesis project running on your new device with a fresh Antigravity installation.

---

## Will this be hard?
**Not at all.** The entire codebase is now cleanly integrated, all merge conflicts are resolved, dependencies are declared in `requirements.txt` and `package.json`, and the latest code is live on GitHub branch `test`.

The entire setup takes **15–20 minutes**.

---

## ⚠️ Files to Copy from this Device First (Crucial)
Because security best practices prevent committing databases, API keys, and large AI weights into Git (`.gitignore`), you should copy **4 items** to a USB flash drive, Google Drive, or OneDrive from your current machine before switching:

| Item | Current Path on Old Machine | Destination on New Machine | Why Copy This? |
| :--- | :--- | :--- | :--- |
| **1. Database** | `swafo-web-app/backend/db.sqlite3` | `swafo-web-app/backend/db.sqlite3` | Preserves all student records (Timothy De Castro), physical barcode `20202330396`, history logs, and freedom wall posts without re-seeding. |
| **2. AI Model Weights** | `models/best.pt` (76 MB) | `models/best.pt` | The trained YOLO11s weights for Module 1 Live Dress Code Detection. |
| **3. Backend `.env`** | `swafo-web-app/backend/.env` | `swafo-web-app/backend/.env` | Contains `GEMINI_API_KEY` and `DJANGO_SECRET_KEY`. |
| **4. Frontend `.env`** | `swafo-web-app/frontend/.env` | `swafo-web-app/frontend/.env` | Contains `VITE_MAPBOX_TOKEN` and `VITE_API_URL`. |

*(If you don't copy `db.sqlite3`, you can still initialize an empty database and run the seed scripts provided in `swafo-web-app/backend/`).*

---

## Step 1: Install Prerequisites on New Device
Install these 4 software packages on your new device (if not already installed):

1. **Git for Windows**: Download from [git-scm.com](https://git-scm.com/)
2. **Node.js (LTS v20 or v22)**: Download from [nodejs.org](https://nodejs.org/) (includes `npm`)
3. **Python (3.11, 3.12, or 3.13)**: Download from [python.org](https://www.python.org/)
   - *Important*: Check the box **"Add python.exe to PATH"** during installation.
4. **Antigravity IDE**: Install your Antigravity setup installer.

---

## Step 2: Clone the Repository & Checkout `test`
Open **PowerShell** or **Command Prompt** in your preferred development folder (e.g., `Downloads` or `Projects`):

```powershell
# 1. Clone the repository
git clone https://github.com/NIHATI-SWAFO/Thesis.git

# 2. Navigate into the cloned folder
cd Thesis

# 3. Switch to the verified test branch
git checkout test
```

---

## Step 3: Place Your Copied Files
Copy the 4 saved items into their respective places:

1. Copy `db.sqlite3` into `Thesis/swafo-web-app/backend/db.sqlite3`
2. Create folder `models` in the root and place `best.pt` inside: `Thesis/models/best.pt`
3. Copy `.env` into `Thesis/swafo-web-app/backend/.env`
   *(Template if creating fresh:)*
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   DJANGO_SECRET_KEY='django-insecure-key-here'
   ```
4. Copy `.env` into `Thesis/swafo-web-app/frontend/.env`
   *(Template if creating fresh:)*
   ```env
   VITE_MAPBOX_TOKEN=pk.eyJ1IjoidGltb3RoeWRldmNhc3RybyIsImEiOiJjbW9kMjdiNjYwMW5yMnFvc3hpanJjdXE1In0.3l1oCD-Krj4UFm2tMYQYug
   VITE_API_URL=http://localhost:5000
   ```

---

## Step 4: Backend Setup (Django)

In your terminal, navigate to the backend folder:

```powershell
cd swafo-web-app/backend

# 1. Create a Python virtual environment
python -m venv .venv

# 2. Activate the virtual environment
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# (If PowerShell blocks script execution, run: Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned)

# 3. Upgrade pip and install all required dependencies
python -m pip install --upgrade pip
pip install -r requirements.txt

# 4. Run database migrations to make sure all tables are synced
python manage.py migrate

# 5. Verify system integrity (should report 0 issues)
python manage.py check

# 6. Start the Django backend server on port 5000
python manage.py runserver 5000
```
Backend will be live at `http://127.0.0.1:5000/`.

---

## Step 5: Frontend Setup (React / Vite)

Open a **new terminal tab** and navigate to the frontend folder:

```powershell
cd swafo-web-app/frontend

# 1. Install frontend packages (includes html-to-image, Lucide, Recharts, Tailwind)
npm install

# 2. Test the production bundle build (validates all JSX syntax)
npm run build

# 3. Start the Vite local development server
npm run dev
```
Frontend will be live at `http://localhost:5173/`.

---

## Step 6: Module 1 Live AI Dress Code Detection (Optional / Port 5050)

When you need to run the live AI dress code monitor with the YOLO11s computer vision model:

Open a **new terminal tab** in the project root:

```powershell
# 1. Ensure ultralytics, opencv, and flask are installed in your .venv
swafo-web-app\backend\.venv\Scripts\pip.exe install ultralytics opencv-python flask

# 2. Run the Lasallian HUD web interface on port 5050
swafo-web-app\backend\.venv\Scripts\python.exe dresscode-detection/inference/web_ui.py --model models/best.pt --port 5050
```
Open `http://localhost:5050/` in your browser.

---

## Step 7: Configuring Antigravity IDE

1. **Launch Antigravity**:
   - Open Antigravity.
   - Click **Open Folder...** and select the root `Thesis` folder.
2. **Select Python Interpreter**:
   - Open Command Palette (`Ctrl+Shift+P`).
   - Type and select: `Python: Select Interpreter`.
   - Point to the virtual environment you created:
     `Thesis/swafo-web-app/backend/.venv/Scripts/python.exe`
3. **Workspace Ready**:
   - Antigravity will automatically index the codebase and enable pair programming assistant tools immediately.

---

## 60-Second Sanity Check Checklist

Once both servers are running, test these 3 URLs in your browser to verify complete functionality:

- [ ] **Portal Login**: `http://localhost:5173/`
  - Login as Student: `dtl0396@dlsud.edu.ph` / `password123`
  - Verify **Institutional Standing & Privileges Card** is displayed (§14 Cleared, GMC Available).
  - Verify **ID Barcode** displays as `Linked (20202330396)`.
- [ ] **Director Records**:
  - Login as Director: `director@dlsud.edu.ph` / `password123`
  - Navigate to `/admin/students`
  - Verify **Behavioral Standing & Privileges** column displays standing badges, hover cards, and §14/§27 handbook citations.
- [ ] **Patrol Barcode Scanner**:
  - Open `/officer/patrol` or click "Scan Barcode".
  - Scan or enter `20202330396` → Instantly brings up student Timothy De Castro.

---

## Summary of Default Ports

| Service | Port | Local URL |
| :--- | :--- | :--- |
| **Vite Frontend Web App** | `5173` | `http://localhost:5173/` |
| **Django REST API Backend** | `5000` | `http://127.0.0.1:5000/` |
| **Module 1 AI HUD Monitor** | `5050` | `http://localhost:5050/` |
