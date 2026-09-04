# 🚀 Sankalp Deployment Guide (Vercel & Render)

This guide provides step-by-step instructions for deploying the **Sankalp MPLADS Sentinel** project:
- **Frontend** (Vite / TanStack Start / React 19) deployed on **Vercel**
- **Backend** (FastAPI / SQLAlchemy / SQLite) deployed on **Render**

---

## 1. Deploying the Backend on Render

### Option A: Render Blueprints (Recommended)
1. Push this repository to GitHub/GitLab.
2. Log into [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** -> **Blueprint**.
4. Connect your repository. Render will automatically detect [`render.yaml`](file:///Users/prathameshnawale/Desktop/Sankalp-main/render.yaml) and configure the Python web service.
5. Click **Apply**.

### Option B: Manual Web Service Setup
1. On [Render Dashboard](https://dashboard.render.com/), click **New +** -> **Web Service**.
2. Connect your repository.
3. Configure the service settings:
   - **Name**: `sankalp-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn -w 2 -k uvicorn.workers.UvicornWorker api:app`
4. Add **Environment Variables**:
   - `ALLOWED_ORIGINS`: `https://your-frontend-domain.vercel.app` (or `*` for initial setup)
   - `PYTHON_VERSION`: `3.10.12`
5. Click **Create Web Service**.
6. Once deployed, copy your backend URL (e.g., `https://sankalp-backend.onrender.com`).

---

## 2. Deploying the Frontend on Vercel

### Option A: Vercel Dashboard (Web UI)
1. Log into [Vercel Dashboard](https://vercel.com/).
2. Click **Add New...** -> **Project**.
3. Import your GitHub/GitLab repository.
4. Set the project configuration:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Other` (or auto-detected Vite)
   - **Build Command**: `NITRO_PRESET=vercel npm run build`
   - **Output Directory**: `.vercel/output`
5. Add **Environment Variables**:
   - `VITE_API_BASE_URL`: `https://sankalp-backend.onrender.com` (Your Render backend URL)
   - `NITRO_PRESET`: `vercel`
6. Click **Deploy**.

### Option B: Vercel CLI
```bash
cd frontend
npm install -g vercel
vercel --prod
```
When prompted:
- Set Root Directory to `./` (inside `frontend/`) or choose default.
- Build command: `NITRO_PRESET=vercel npm run build`
- Output directory: `.vercel/output`

---

## 3. Environment Variables Summary

| Platform | Variable | Recommended Value / Description |
| :--- | :--- | :--- |
| **Render (Backend)** | `ALLOWED_ORIGINS` | `https://your-frontend.vercel.app` or `*` |
| **Render (Backend)** | `PYTHON_VERSION` | `3.10.12` |
| **Vercel (Frontend)** | `VITE_API_BASE_URL` | `https://sankalp-backend.onrender.com` |
| **Vercel (Frontend)** | `NITRO_PRESET` | `vercel` |

---

## 4. Local Build & Deployment Verification

### Test Frontend Build Locally:
```bash
cd frontend
npm run build:vercel
```

### Test Backend Locally:
```bash
cd backend
pip install -r requirements.txt
gunicorn -w 2 -k uvicorn.workers.UvicornWorker api:app --bind 0.0.0.0:8000
```
Then visit `http://localhost:8000/` or `http://localhost:8000/summary`.
