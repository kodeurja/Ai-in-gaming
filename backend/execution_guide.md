# Local Execution Guide: AI Gaming Platform 🎮🏠

Follow these steps to run the decoupled Frontend and Backend locally.

## 🟢 Part 1: Backend Setup (Flask)

1.  **Install Dependencies**:
    Open a terminal in the project root and run:
    ```powershell
    pip install -r backend/requirements.txt
    ```
2.  **Environment Configuration**:
    -   Inside the `backend` folder, copy `.env.example` to `.env`.
    -   Set `DATABASE_URL=sqlite:///local.db` (for easy local testing).
    -   Set `FRONTEND_URL=http://localhost:5173` (to allow Vite to connect).
3.  **Run Backend**:
    ```powershell
    python backend/app.py
    ```
    (The backend server will run at `http://127.0.0.1:5000`)

---

## 🔵 Part 2: Frontend Setup (Vite)

1.  **Install Node Dependencies**:
    Navigate into the `frontend` folder and run:
    ```powershell
    npm install
    ```
2.  **Environment Configuration**:
    -   Inside the `frontend` folder, create a file named `.env`.
    -   Add this line: `VITE_BACKEND_URL=http://127.0.0.1:5000`
3.  **Run Frontend**:
    ```powershell
    npm run dev
    ```
    (The Vite dev server will run at `http://localhost:5173`)

---

## ✅ Step 3: Start Playing
1.  Open your browser to `http://localhost:5173`.
2.  Sign Up, create your persona, and start the missions!

## 🛠️ Troubleshooting
- **CORS Error**: If the frontend can't talk to the backend, double-check that `FRONTEND_URL` in `backend/.env` exactly matches your browser URL.
- **Node.js**: You must have [Node.js](https://nodejs.org/) installed to run the `npm` commands.
