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
   python manage.py seed_violations --count 150
   python bulk_seed_full_handbook.py
   ```
   *Note: `seed_violations` now uses the Django management command with GPS-ready coordinates across 52 campus locations.*

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
4. **Setup Frontend Environment (CRITICAL)**:
   - Create a file named **`.env`** inside the `frontend/` folder.
   - Paste the following:
     ```env
     VITE_API_URL=http://localhost:8000
     VITE_MAPBOX_TOKEN=pk.eyJ1IjoidGltb3RoeWRldmNhc3RybyIsImEiOiJjbW9kMjdiNjYwMW5yMnFvc3hpanJjdXE1In0.3l1oCD-Krj4UFm2tMYQYug
     ```
   - ⚠️ **Without this file, the Campus Map will NOT load and API calls will fail.**
5. Start development server: `npm run dev`

---

## 🏛️ Director Portal & Adjudication
To test the **Institutional Command Center**:
1. Login with an Admin/Director account (provided in `seed_officers.py`).
2. Navigate to **Case Oversight**.
3. Look for cases flagged with **"Director Decision Required"** (Escalated per §27.3.5).
4. Use the **Adjudication Panel** to select Sanctions 1-4 and click **Render Decision**.
5. Clicks and Decisions are persistent and will be reflected immediately in the **Student Portal**.

## 🗺️ Campus Map Analytics
The **Campus Map** provides spatial visualization of violations across DLSU-D.
1. Navigate to **Campus Map** in the sidebar.
2. The map uses **Mapbox GL JS** with native clustering and a custom Mapbox Studio style.
3. You can filter by **Date** and **Violation Category** to see hot spots.

### Seeding Heatmap Data
To populate the heatmap with realistic, GPS-ready violation data:
```bash
cd swafo-web-app/backend
python manage.py seed_violations --clear --count 150
```
- `--clear` wipes old violation data before seeding.
- `--count` sets the number of violations to generate (default: 150).
- Data is spread across **52 real campus buildings** with GPS jitter for realistic clustering.
- Coordinates are sourced from `backend/constants/locations.py` (auto-generated from OpenStreetMap).

### Customizing Map Style
The map design can be changed in `MapTrial.jsx` by updating the `style:` URL. We currently use a custom Mapbox Studio style:
`mapbox://styles/timothydevcastro/cmod8zewr004601pe41yy4304`

To create your own: Go to [studio.mapbox.com](https://studio.mapbox.com), design a style, publish it, and replace the URL.

---

## 🛡️ Note on Intelligent Features
The **Smart Search** and **Duplicate Detection** require the `GEMINI_API_KEY` to be correctly set in your backend `.env` file. If the search isn't working, check your keys!

## ⚠️ Common Issues

| Problem | Fix |
|---------|-----|
| All pages show "Failed to fetch" | Make sure `frontend/.env` has `VITE_API_URL=http://localhost:8000` and the backend is running |
| Campus Map shows "Loading..." forever | Make sure `frontend/.env` has the `VITE_MAPBOX_TOKEN` set |
| Heatmap shows 0 violations | Run `python manage.py seed_violations --count 150` in the backend |
| Database errors after pulling | Run `python manage.py migrate` to apply new migrations |
