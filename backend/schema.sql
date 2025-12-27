-- Database Schema for Supabase (PostgreSQL)

-- User Table
CREATE TABLE "user" (
    id SERIAL PRIMARY KEY,
    username VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- Persona Table
CREATE TABLE persona (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES "user"(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(50) NOT NULL,
    avatar_data JSONB NOT NULL DEFAULT '{}'
);

-- Game State Table
CREATE TABLE game_state (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES "user"(id) ON DELETE CASCADE NOT NULL,
    current_cycle INTEGER DEFAULT 1,
    current_step INTEGER DEFAULT 1,
    completed_cycles INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Puzzle Log Table
CREATE TABLE puzzle_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES "user"(id) ON DELETE CASCADE NOT NULL,
    cycle INTEGER NOT NULL,
    step INTEGER NOT NULL,
    puzzle_type VARCHAR(50) NOT NULL,
    puzzle_data JSONB NOT NULL,
    solved BOOLEAN DEFAULT FALSE,
    solved_at TIMESTAMP
);

-- Quiz Log Table
CREATE TABLE quiz_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES "user"(id) ON DELETE CASCADE NOT NULL,
    cycle INTEGER NOT NULL,
    questions JSONB NOT NULL,
    score INTEGER DEFAULT 0,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gate Progress Table
CREATE TABLE gate_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES "user"(id) ON DELETE CASCADE NOT NULL,
    gate_number INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'locked',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Question History Table
CREATE TABLE question_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES "user"(id) ON DELETE CASCADE NOT NULL,
    question_hash VARCHAR(64) NOT NULL,
    topic VARCHAR(50),
    is_correct BOOLEAN DEFAULT FALSE,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initial Mock Data (Optional)
-- INSERT INTO "user" (username, password) VALUES ('tester123', 'hashed_password_here');
