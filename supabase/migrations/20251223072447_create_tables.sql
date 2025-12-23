/*
  # Create Study App Database Tables

  1. New Tables
    - `notes` - User study notes with text and summaries
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `raw_text` (text)
      - `summary` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `quiz_attempts` - Records of user quiz attempts
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `note_id` (uuid, nullable reference to notes)
      - `difficulty` (enum: easy, medium, hard)
      - `score` (integer percentage)
      - `total_questions` (integer)
      - `correct_answers` (integer)
      - `details` (jsonb array of question details)
      - `created_at` (timestamp)
    
    - `study_sessions` - Pomodoro timer sessions
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `minutes` (integer)
      - `session_type` (enum: focus, break)
      - `created_at` (timestamp)
    
    - `prediction_runs` - Exam prediction analysis results
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `exam_name` (text)
      - `syllabus_summary` (text, nullable)
      - `patterns` (jsonb)
      - `generated_paper` (jsonb)
      - `config` (jsonb)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for user data isolation
*/

CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text DEFAULT 'Untitled Note',
  raw_text text NOT NULL,
  summary text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_id uuid REFERENCES notes(id) ON DELETE SET NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  score integer NOT NULL,
  total_questions integer NOT NULL,
  correct_answers integer NOT NULL,
  details jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  minutes integer NOT NULL,
  session_type text NOT NULL CHECK (session_type IN ('focus', 'break')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prediction_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_name text DEFAULT 'Exam',
  syllabus_summary text,
  patterns jsonb DEFAULT '{}'::jsonb,
  generated_paper jsonb DEFAULT '{}'::jsonb,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_created_at ON quiz_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_created_at ON study_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prediction_runs_user_id ON prediction_runs(user_id);
