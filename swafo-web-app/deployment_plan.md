# SWAFO System: Master Deployment Plan

**Project:** Intelligent Violation Management System  
**Target Architecture:** Decoupled Cloud Infrastructure  
**Status:** Planning Phase  

---

## 1. Cloud Technology Stack

| Layer | Provider | Purpose |
|---|---|---|
| **Frontend** | **Vercel** | Hosting the React 19 / Vite SPA. Provides global CDN and automatic SSL. |
| **Backend API** | **Railway** (or Render) | Hosting the Django 6.0 REST API. Handles server-side logic and AI integration. |
| **Database** | **Supabase (Postgres)** | High-performance relational database for persistent storage. |
| **Cloud Storage** | **Supabase Storage** | S3-compatible bucket for forensic image evidence and patrol captures. |

---

## 2. Deployment Roadmap

### Phase 1: Codebase Preparation (Local)
The system must be decoupled from the local environment to run on cloud servers.
- [ ] **Backend Dependencies**: Install `dj-database-url` (DB switching), `psycopg2-binary` (Postgres support), `whitenoise` (static files), and `supabase` (storage SDK).
- [ ] **Dynamic Settings**: Update `settings.py` to read `DATABASE_URL`, `DEBUG`, `ALLOWED_HOSTS`, and `CORS_ALLOWED_ORIGINS` from environment variables.
- [ ] **Static Asset Config**: Integrate WhiteNoise middleware to serve Django Admin CSS in production.
- [ ] **Deployment Scripts**:
    - Create `Procfile`: Command to start the web server (`gunicorn`).
    - Create `build.sh`: Script to automate migrations and `collectstatic`.
- [ ] **Push to GitHub**: Commit and push the production-ready configuration.

### Phase 2: Infrastructure Provisioning (Supabase)
Set up the "Brain" and "Memory" of the system.
- [ ] **Create Supabase Project**: Initialize "SWAFO-Portal" in the Supabase dashboard.
- [ ] **Database Connection**: Extract the PostgreSQL Connection String (Transaction mode).
- [ ] **Storage Bucket**: Create a public bucket named `violation-evidence` with RLS policies allowing uploads.
- [ ] **API Keys**: Retrieve the `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

### Phase 3: Backend Deployment (Railway/Render)
Launch the API server.
- [ ] **Connect Repository**: Link the GitHub repo and set the root directory to `/backend`.
- [ ] **Configure Environment Variables**:
    - `DATABASE_URL` (from Supabase)
    - `DJANGO_SECRET_KEY`
    - `GEMINI_API_KEY`
    - `SUPABASE_URL` & `SUPABASE_KEY`
- [ ] **Deployment Execution**: Wait for the build and retrieve the live API URL (e.g., `https://swafo-api.up.railway.app`).

### Phase 4: Frontend Deployment (Vercel)
Launch the user interface.
- [ ] **Connect Repository**: Link the GitHub repo and set the root directory to `/frontend`.
- [ ] **Framework Detection**: Vercel automatically detects Vite + React.
- [ ] **Configure API Connection**:
    - Set `VITE_API_URL` to your new Railway API URL.
- [ ] **Production Build**: Deploy and retrieve the live public URL.

### Phase 5: Data Initialization & Final Sync
- [ ] **Remote Migration**: Ensure the cloud Postgres schema is up-to-date.
- [ ] **Institutional Seeding**: Execute `python manage.py seed_handbook`, `seed_students`, etc., on the live database to populate rules and student profiles.
- [ ] **CORS Finalization**: Update the backend's `CORS_ALLOWED_ORIGINS` to include the final Vercel URL for security.

---

## 3. Environment Variables Cheat-Sheet

| Variable | Source | Used By |
|---|---|---|
| `DATABASE_URL` | Supabase (Settings > DB) | Backend (Django) |
| `VITE_API_URL` | Railway (Project URL) | Frontend (React) |
| `DJANGO_SECRET_KEY` | Generate new key | Backend (Django) |
| `GEMINI_API_KEY` | Google AI Studio | Backend (AI Assistant) |
| `SUPABASE_URL` | Supabase (Settings > API) | Backend (Storage) |
| `SUPABASE_KEY` | Supabase (Settings > API) | Backend (Storage) |

---

## 4. Maintenance & Scaling
- **Logs**: Use Railway's Log stream to monitor API hits.
- **Analytics**: Vercel Analytics can be enabled for frontend performance tracking.
- **Database Backups**: Managed automatically by Supabase.
