# Cloud Deployment Guide: Render & Vercel 🚀

This guide explains how to host your backend on **Render** and your frontend on **Vercel**.

## 🏗️ Architecture Overview

| Component | Platform | Role |
| :--- | :--- | :--- |
| **Backend** | Render | Flask API, AI Logic, Database Connection |
| **Frontend** | Vercel | Static Assets, UI Hosting |
| **Database** | Supabase | Cloud Persistence (Managed) |

---

## 🟢 Part 1: Backend on Render

Render will host your Flask server (`app.py`).

### 1. Preparation
I've already created the following files in your `backend/` folder:
- **`Procfile`**: Tells Render how to start the Flask app.
- **`runtime.txt`**: Specifies the Python version.
- **Updated `requirements.txt`**: Includes `gunicorn` (production server).

### 2. Deployment Steps
1.  **Connect GitHub**: Log in to [Render](https://render.com), click **New +**, and select **Web Service**.
2.  **Select Repo**: Connect your `Ai-in-gaming` repository.
3.  **Settings**:
    - **Name**: `ai-gaming-backend`
    - **Language**: `Python 3`
    - **Build Command**: `pip install -r backend/requirements.txt`
    - **Start Command**: `gunicorn --chdir backend app:app`
4.  **Environment Variables**:
    Click **Advanced** -> **Add Environment Variable**:
    - `DATABASE_URL`: (Your Supabase URI)
    - `GROQ_API_KEY`: (Your AI Key)
    - `SECRET_KEY`: (A random string)

---

## 🔵 Part 2: Frontend on Vercel

Vercel is best for static files. Note: Since we are using Ginger templates, the most efficient way to use Vercel is to host your `static` assets there for lightning-fast loading.

### 1. Deployment Steps
1.  **Connect GitHub**: Log in to [Vercel](https://vercel.com) and import your repository.
2.  **Settings**:
    - **Framework Preset**: `Other`
    - **Root Directory**: `frontend`
3.  **Deploy**: Vercel will host your `static/` folder on a global CDN.

---

## ⚠️ Important Note on "Split" Deployment
Since your app is a "Monolith" (Flask serves the HTML), hosting part on Vercel and part on Render is usually done by:
1.  Hosting the **Entire Flask App on Render** (Easiest and recommended).
2.  **OR** Converting the frontend to a decoupled React/Vue app (Requires rewrite).

**My recommendation**: Use **Render** for the entire project for now. If you want to proceed with the split, let me know and I will help you refactor the routes to be a pure API! 🟡
