import os
from flask import Flask, render_template, url_for, flash, redirect, request, jsonify
from datetime import datetime
from flask_login import LoginManager, login_user, current_user, logout_user, login_required
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash

# Load environment variables
load_dotenv()

from models import db, User, Persona, GameState, PuzzleLog, QuizLog, GateProgress, QuestionHistory
from ai_engine import AIEngine

# Initialize AI Engine
ai_engine = AIEngine()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'default-dev-key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///site.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

login_manager = LoginManager(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# --- Helpers ---

def get_or_create_game_state(user_id):
    state = GameState.query.filter_by(user_id=user_id).first()
    if not state:
        state = GameState(user_id=user_id)
        db.session.add(state)
        db.session.commit()
    return state

# --- Routes ---

@app.route("/")
@app.route("/home")
def home():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return render_template('landing.html')

@app.route("/signup", methods=['GET', 'POST'])
def signup():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
        
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        if user:
            flash('Username already exists.', 'danger')
            return redirect(url_for('home'))
            
        hashed_password = generate_password_hash(password, method='scrypt')
        new_user = User(username=username, password=hashed_password)
        
        try:
            db.session.add(new_user)
            db.session.commit()
            login_user(new_user)
            return redirect(url_for('create_persona'))
        except:
             flash('An error occurred.', 'danger')

    return render_template('landing.html', mode='signup')

@app.route("/login", methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password, password):
            login_user(user)
            return redirect(url_for('dashboard'))
        else:
            flash('Login Unsuccessful.', 'danger')
            
    return render_template('landing.html', mode='login')

@app.route("/logout")
def logout():
    logout_user()
    return redirect(url_for('home'))

@app.route("/dashboard")
@login_required
def dashboard():
    """Main Hub after login."""
    return render_template('hub.html')

@app.route("/roadmap")
@login_required
def roadmap():
    """Learning Roadmap Section."""
    return render_template('roadmap.html')

@app.route("/game_dashboard")
@login_required
def game_dashboard():
    """The original 6-gate game dashboard."""
    state = get_or_create_game_state(current_user.id)
    steps = [
        {"id": 1, "label": "GATE 1"},
        {"id": 2, "label": "GATE 2"},
        {"id": 3, "label": "GATE 3"},
        {"id": 4, "label": "GATE 4"},
        {"id": 5, "label": "GATE 5"},
        {"id": 6, "label": "GATE 6"}
    ]
    return render_template('game_dashboard.html', state=state, steps=steps)

@app.route("/create_persona", methods=['GET', 'POST'])
@login_required
def create_persona():
    if request.method == 'POST':
        name = request.form.get('name')
        style = request.form.get('style')
        gender = request.form.get('gender')
        
        persona = Persona.query.filter_by(user_id=current_user.id).first()
        if not persona:
            persona = Persona(user_id=current_user.id, name=name, avatar_data={'style': style, 'gender': gender})
            db.session.add(persona)
        else:
            persona.name = name
            persona.avatar_data = {'style': style, 'gender': gender}
            
        db.session.commit()
        return redirect(url_for('dashboard'))

    persona = Persona.query.filter_by(user_id=current_user.id).first()
    return render_template('persona.html', persona=persona)


@app.route("/quiz")
@login_required
def quiz():
    state = get_or_create_game_state(current_user.id)
    if state.current_step < 6:
        flash("Complete all puzzles first!", "danger")
        return redirect(url_for('game_dashboard'))
        
    log = QuizLog.query.filter_by(user_id=current_user.id, cycle=state.current_cycle).first()
    if not log:
        questions = ai_engine.generate_quiz_data(state.current_cycle)
        log = QuizLog(user_id=current_user.id, cycle=state.current_cycle, questions=questions)
        db.session.add(log)
        db.session.commit()
        
    return render_template('quiz.html', log=log, state=state)

@app.route("/api/puzzle_hint", methods=['POST'])
@login_required
def puzzle_hint():
    data = request.json
    step = data.get('step')
    puzzle_type = data.get('puzzle_type')
    
    prompt = f"Provide a short, cryptic hint for a {puzzle_type} puzzle (Step {step}). Max 15 words."
    hint = ai_engine.generate_chat_response(prompt)
    
    return jsonify({"hint": hint})

@app.route("/api/solve_puzzle", methods=['POST'])
@login_required
def solve_puzzle():
    data = request.json
    step = data.get('step')
    
    state = GameState.query.filter_by(user_id=current_user.id).first()
    log = PuzzleLog.query.filter_by(user_id=current_user.id, cycle=state.current_cycle, step=step).first()
    
    if log:
        log.solved = True
        log.solved_at = datetime.utcnow()
        if state.current_step == step:
            state.current_step += 1
        db.session.commit()
        return jsonify({"success": True, "next_url": url_for('game_dashboard')})
    
    return jsonify({"success": False}), 404


@app.route("/quiz/setup")
@login_required
def quiz_setup():
    return render_template('quiz_setup.html')

@app.route("/api/start_quiz", methods=['POST'])
@login_required
def start_quiz():
    data = request.json
    difficulty = data.get('difficulty', 'Intermediate')
    
    # Generate 5 questions via AI Engine
    questions = ai_engine.generate_quiz(difficulty)
    
    # Store in QuizLog (temporary for this session)
    state = get_or_create_game_state(current_user.id)
    new_quiz = QuizLog(
        user_id=current_user.id,
        cycle=state.current_cycle,
        questions=questions,
        score=0
    )
    db.session.add(new_quiz)
    db.session.commit()
    
    return jsonify({"success": True, "quiz_id": new_quiz.id})

@app.route("/quiz/play/<int:quiz_id>")
@login_required
def play_quiz(quiz_id):
    quiz = QuizLog.query.get_or_404(quiz_id)
    if quiz.user_id != current_user.id:
        return redirect(url_for('game_dashboard'))
    state = get_or_create_game_state(current_user.id)
    return render_template('quiz.html', quiz=quiz, state=state)

@app.route("/api/submit_quiz", methods=['POST'])
@login_required
def submit_quiz():
    data = request.json
    quiz_id = data.get('quiz_id')
    answers = data.get('answers') # List of indices
    
    quiz = QuizLog.query.get(quiz_id)
    if not quiz:
        return jsonify({"success": False})

    questions = quiz.questions
    score = 0
    correct_count = 0
    
    results = []

    for i, q in enumerate(questions):
        user_ans = answers[i]
        correct_ans = q['correct_index']
        is_correct = (user_ans == correct_ans)
        
        if is_correct:
            score += 10
            correct_count += 1
            # Track history to prevent repeat
            # check if exists
            exists = QuestionHistory.query.filter_by(user_id=current_user.id, question_hash=q['question']).first()
            if not exists:
                qh = QuestionHistory(user_id=current_user.id, question_hash=q['question'], topic='AI', is_correct=True)
                db.session.add(qh)
        
        results.append({
            "question_index": i,
            "is_correct": is_correct,
            "correct_option": correct_ans
        })
        
    quiz.score = score
    db.session.commit()
    
    # RULE: 5/5 to unlock
    # RULE: Relaxed - Always pass to puzzle
    passed = True # (correct_count == 5)
    
    if passed:
        # Unlock Puzzle
        state = get_or_create_game_state(current_user.id)
        current_gate_num = state.current_step
        
        # Mark Gate as Unlocked (status stored in GameState for now as step)
        # Using GameState step logic: step 1 = Gate 1 Locked -> Quiz Passed -> Gate 1 Unlocked (or show puzzle)
        # We need to distinguish between "Quiz Passed, Puzzle Pending"
        # For simplicity: Passing Quiz redirects to Puzzle View
        return jsonify({"success": True, "passed": True, "redirect": url_for('puzzle_view', step=current_gate_num)})
    else:
        return jsonify({"success": True, "passed": False, "results": results})

@app.route("/puzzle/<int:step>")
@login_required
def puzzle_view(step):
    state = get_or_create_game_state(current_user.id)
    if step > state.current_step:
        flash("Gate Locked. Complete the Quiz first.", "danger")
        return redirect(url_for('game_dashboard'))
        
    # Check for existing log
    log = PuzzleLog.query.filter_by(user_id=current_user.id, cycle=state.current_cycle, step=step).first()
    
    if not log:
        params = ai_engine.generate_puzzle_data(step, state.current_cycle)
        log = PuzzleLog(
            user_id=current_user.id,
            cycle=state.current_cycle,
            step=step,
            puzzle_type=params['type'],
            puzzle_data=params['data']
        )
        db.session.add(log)
        db.session.commit()
    
    return render_template('puzzle.html', puzzle_data=log.puzzle_data, puzzle_type=log.puzzle_type, step=step)

@app.route("/api/reboot_puzzle", methods=['POST'])
@login_required
def reboot_puzzle():
    data = request.json
    step = data.get('step')
    state = get_or_create_game_state(current_user.id)
    
    # Delete the existing log to force regeneration on reload
    log = PuzzleLog.query.filter_by(user_id=current_user.id, cycle=state.current_cycle, step=step).first()
    if log:
        db.session.delete(log)
        db.session.commit()
    
    return jsonify({"success": True})

# --- Main ---

def init_db():
    with app.app_context():
        db.drop_all() # Reset for transformation
        db.create_all()
        print("Database reset and initialized.")

if __name__ == '__main__':
    # Force reset if models changed
    init_db()
    app.run(debug=True)
