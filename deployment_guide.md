# Decoupled Deployment Guide: Render & Vercel 🚀☁️

This guide outlines how to host your backend on **Render** (as an API) and your frontend on **Vercel** (as a static site).

## 🏗️ Architecture Overview
- **Backend (Render)**: Processes logic, AI generation, and database interactions.
- **Frontend (Vercel)**: Serves the HTML, CSS, and JavaScript. Communicates with Render via `fetch()`.

---

## 🟢 Part 1: Deploy Backend (Render)

1.  **Log in to Render** and click **New > Web Service**.
2.  **Connect your GitHub Repository**: `Ai-in-gaming`.
3.  **Configure Settings**:
    -   **Name**: `ai-gaming-backend`
    -   **Environment**: `Python 3`
    -   **Region**: (Choose closest to you)
    -   **Build Command**: `pip install -r backend/requirements.txt`
    -   **Start Command**: `gunicorn --chdir backend app:app`
4.  **Environment Variables**:
    -   `DATABASE_URL`: Your Supabase connection string.
    -   `GROQ_API_KEY`: Your Groq API key.
    -   `SECRET_KEY`: A long random string.
5.  **Wait for Deployment**: Once "Live", copy your backend URL (e.g., `https://ai-gaming-backend.onrender.com`).

---

## 🔵 Part 2: Configure Frontend Environment

The frontend is agnostic and will pull your Render URL during the Vercel build process. **Do not hardcode your URL in the the JS files.**

1.  Open your **Vercel Dashboard**.
2.  Go to **Settings > Environment Variables**.
3.  Add a new variable:
    -   **Key**: `BACKEND_URL`
    -   **Value**: `https://ai-gaming-backend.onrender.com` (Your Render URL)

---

## 🟡 Part 3: Deploy Frontend (Vercel)

1.  **Project Settings**:
    -   **Framework Preset**: `Other`
    -   **Root Directory**: `frontend`
2.  **Build & Development Settings**:
    -   **Build Command**: `sed -i "s|__BACKEND_URL__|${BACKEND_URL}|g" static/js/config.js`
    -   **Output Directory**: `.`
3.  **Click Deploy**. Vercel will now automatically inject your Render link into the code during the build.

---

## 🔒 Security Note: CORS
The backend is configured to accept requests with credentials. Ensure your `SECRET_KEY` is consistent. If you face "CORS" errors, double-check that `config.js` has the EXACT Render URL (no trailing slash).

---

## ✅ Verification
1.  Visit your Vercel URL.
2.  Try to Sign Up.
3.  If successful, you will be redirected to the Persona page, confirming the Frontend-Backend bridge is active!
