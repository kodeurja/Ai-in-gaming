# Execution Guide: AI Gaming Platform

Follow these steps to set up and run the project on your local machine.

## Prerequisites
- Python 3.8 or higher installed.
- An API Key (Groq or Gemini) - see `api_keys.md`.

## Step 1: Install Dependencies
Open your terminal in the project folder and run:
```bash
pip install -r backend/requirements.txt
```

## Step 2: Configure Environment
1.  Navigate to the `backend` folder.
2.  Copy the `.env.example` file and rename it to `.env`.
3.  Open `.env` in a text editor and add your `GROQ_API_KEY` and `DATABASE_URL` (for Supabase).

## Step 3: Run the Application
Run the Flask server from the root directory:
```bash
python backend/app.py
```
You should see output indicating the server is running, usually at `http://127.0.0.1:5000`.

## Step 4: Play the Game
1.  Open your browser and go to `http://127.0.0.1:5000`.
2.  **Sign Up** for a new account.
3.  Go to **Create Persona** to customize your avatar.
4.  Go to **My Game** (Dashboard) to see your puzzles.
5.  Click on **Puzzle 1** to start playing.
6.  Complete the puzzle to unlock the next level and eventually the AI Quiz.

## Troubleshooting
- **Database Error**: If you see database errors, delete `instance/site.db` (if it exists) and restart the app. The app automatically creates the DB on start.
- **API Error**: Ensure your `.env` file has the correct API key and no extra spaces.
