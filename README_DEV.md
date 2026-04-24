# 🛠️ SWAFO Portal: Developer Setup Guide

Welcome group mates! Follow these steps to get the SWAFO system running on your local machine.

## 1. Prerequisites
- **Python 3.12+**
- **Node.js 18+**
- **Git**

## 2. Backend Setup (Django)
1. Navigate to the backend folder: `cd swafo-web-app/backend`
2. Create a virtual environment: `python -m venv .venv`
3. Activate it:
   - Windows (PowerShell): `.\.venv\Scripts\activate`
   - Windows (CMD): `.\.venv\Scripts\activate.bat`
   - Mac/Linux: `source .venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. **Setup Keys (CRITICAL)**: 
   - Inside the **backend root folder** (where `manage.py` is), you will see `.env.example`.
   - Create a new file named **`.env`** in that same folder.
   - Ask **Timothy** for the `GEMINI_API_KEY` and `DJANGO_SECRET_KEY` and paste them in.
6. Run migrations: `python manage.py migrate`
7. **Seed Data** (Do this to see students/rules):
   ```bash
   python seed_students.py
   python seed_officers.py
   python seed_patrols.py
   python seed_violations.py
   python bulk_seed_full_handbook.py
   ```
   *Note: `seed_violations.py` will populate the §27.3.5 Adjudication Queue for the Director.*

8. **Perfect Sync (Recommended)**: If your data looks different or unassigned on another device, use the Master Snapshot to force a perfect 1:1 match of all Students, Officers, and Violations:
   ```bash
   python manage.py flush --no-input
   python manage.py loaddata master_system_snapshot.json
   ```
   *Note: This will clear your current local data and replace it with the exact state from the Master Snapshot.*

9. Start server: `python manage.py runserver`

## 3. Frontend Setup (React)
1. Open a **NEW terminal window** (Keep the backend running!).
2. Navigate to the frontend folder: `cd swafo-web-app/frontend`
3. Install dependencies: `npm install`
4. Start development server: `npm run dev`

---

## 🏛️ Director Portal & Adjudication
To test the **Institutional Command Center**:
1. Login with an Admin/Director account (provided in `seed_officers.py`).
2. Navigate to **Case Oversight**.
3. Look for cases flagged with **"Director Decision Required"** (Escalated per §27.3.5).
4. Use the **Adjudication Panel** to select Sanctions 1-4 and click **Render Decision**.
5. Clicks and Decisions are persistent and will be reflected immediately in the **Student Portal**.

## 🛡️ Note on Intelligent Features
The **Smart Search** and **Duplicate Detection** require the `GEMINI_API_KEY` to be correctly set in your backend `.env` file. If the search isn't working, check your keys!
