/*
  # Add Advanced Features Database Tables

  1. New Tables for Gamification & Streaks
    - `user_stats` - Tracks user performance, streaks, weakness areas
    - `achievement_badges` - Badge definitions and requirements
    - `user_achievements` - User progress on badges

  2. New Tables for Spaced Repetition & Flashcards
    - `flashcards` - Intelligent flashcard system
    - `flashcard_reviews` - SRS scheduling and performance
    
  3. New Tables for Concept Mapping
    - `concept_map` - Topic relationships and connections
    
  4. New Tables for Note Features
    - `annotations` - Highlighting and annotations on notes
    - `voice_notes` - Voice recording and transcription
    
  5. New Tables for Social Features
    - `study_groups` - Group creation and management
    - `study_group_members` - Group membership tracking
    - `question_bank` - Shareable quiz questions
    - `study_tips` - Community study tips
    
  6. New Tables for Analytics
    - `topic_difficulty_stats` - Tracks topic difficulty
    - `leaderboard_cache` - Cached leaderboard data

  7. Security - Enable RLS on all tables with appropriate policies
*/

-- User Stats Table for tracking performance and streaks
CREATE TABLE IF NOT EXISTS user_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_study_date timestamptz,
  total_study_minutes integer DEFAULT 0,
  weak_topics text[] DEFAULT '{}',
  mastery_score numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Achievement Badges Table
CREATE TABLE IF NOT EXISTS achievement_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text NOT NULL,
  icon_name text NOT NULL,
  requirement_type text NOT NULL CHECK (requirement_type IN ('streak', 'quizzes', 'accuracy', 'topics', 'time', 'custom')),
  requirement_value integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- User Achievements Table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES achievement_badges(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Flashcards Table with SRS
CREATE TABLE IF NOT EXISTS flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_id uuid REFERENCES notes(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  topic text,
  difficulty text DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Flashcard Reviews (Spaced Repetition Tracking)
CREATE TABLE IF NOT EXISTS flashcard_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flashcard_id uuid NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ease_factor numeric DEFAULT 2.5,
  interval_days integer DEFAULT 1,
  next_review_date timestamptz NOT NULL DEFAULT (now() + interval '1 day'),
  review_count integer DEFAULT 0,
  correct_count integer DEFAULT 0,
  last_reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Concept Map Table for visualizing relationships
CREATE TABLE IF NOT EXISTS concept_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  concepts jsonb NOT NULL DEFAULT '{}',
  relationships jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Annotations Table for highlighting notes
CREATE TABLE IF NOT EXISTS annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_id uuid NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  start_index integer NOT NULL,
  end_index integer NOT NULL,
  text text NOT NULL,
  color text DEFAULT 'yellow',
  annotation_type text DEFAULT 'highlight' CHECK (annotation_type IN ('highlight', 'note', 'important')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Voice Notes Table
CREATE TABLE IF NOT EXISTS voice_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_id uuid REFERENCES notes(id) ON DELETE CASCADE,
  audio_url text NOT NULL,
  transcription text,
  extracted_points jsonb DEFAULT '[]',
  duration_seconds integer,
  created_at timestamptz DEFAULT now()
);

-- Study Groups Table
CREATE TABLE IF NOT EXISTS study_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  subject text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Study Group Members Table
CREATE TABLE IF NOT EXISTS study_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Question Bank for sharing quizzes
CREATE TABLE IF NOT EXISTS question_bank (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  subject text,
  is_public boolean DEFAULT false,
  questions jsonb NOT NULL DEFAULT '[]',
  share_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Study Tips Community Table
CREATE TABLE IF NOT EXISTS study_tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  topic text,
  is_featured boolean DEFAULT false,
  upvotes integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Topic Difficulty Stats
CREATE TABLE IF NOT EXISTS topic_difficulty_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic text NOT NULL,
  difficulty_score numeric DEFAULT 0,
  accuracy numeric DEFAULT 0,
  practice_count integer DEFAULT 0,
  time_to_mastery_days integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, topic)
);

-- Leaderboard Cache
CREATE TABLE IF NOT EXISTS leaderboard_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rank integer,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score numeric NOT NULL,
  streak integer,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Update Quiz Attempts to support new features
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS question_type text DEFAULT 'mcq' CHECK (question_type IN ('mcq', 'essay', 'fill-blank', 'matching'));
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS confidence_score numeric;
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS adaptive_difficulty boolean DEFAULT false;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_user_id ON flashcard_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_next_date ON flashcard_reviews(next_review_date);
CREATE INDEX IF NOT EXISTS idx_annotations_user_id ON annotations(user_id);
CREATE INDEX IF NOT EXISTS idx_annotations_note_id ON annotations(note_id);
CREATE INDEX IF NOT EXISTS idx_voice_notes_user_id ON voice_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_study_groups_creator_id ON study_groups(creator_id);
CREATE INDEX IF NOT EXISTS idx_study_group_members_user_id ON study_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_question_bank_user_id ON question_bank(user_id);
CREATE INDEX IF NOT EXISTS idx_study_tips_user_id ON study_tips(user_id);
CREATE INDEX IF NOT EXISTS idx_topic_stats_user_id ON topic_difficulty_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_score ON leaderboard_cache(score DESC);

-- Enable RLS on all tables
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_difficulty_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_stats
CREATE POLICY "Users can view own stats"
  ON user_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON user_stats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
  ON user_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for achievement_badges (public read)
CREATE POLICY "Badges are publicly readable"
  ON achievement_badges FOR SELECT
  USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can earn achievements"
  ON user_achievements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for flashcards
CREATE POLICY "Users can manage own flashcards"
  ON flashcards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create flashcards"
  ON flashcards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcards"
  ON flashcards FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own flashcards"
  ON flashcards FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for flashcard_reviews
CREATE POLICY "Users can manage own flashcard reviews"
  ON flashcard_reviews FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create flashcard reviews"
  ON flashcard_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcard reviews"
  ON flashcard_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for annotations
CREATE POLICY "Users can manage own annotations"
  ON annotations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create annotations"
  ON annotations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own annotations"
  ON annotations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own annotations"
  ON annotations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for voice_notes
CREATE POLICY "Users can manage own voice notes"
  ON voice_notes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create voice notes"
  ON voice_notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for study_groups
CREATE POLICY "Users can view own and public groups"
  ON study_groups FOR SELECT
  TO authenticated
  USING (
    is_public = true OR auth.uid() = creator_id OR
    EXISTS (
      SELECT 1 FROM study_group_members
      WHERE group_id = study_groups.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create study groups"
  ON study_groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

-- RLS Policies for study_group_members
CREATE POLICY "Users can view group members"
  ON study_group_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM study_group_members sgm
      WHERE sgm.group_id = study_group_members.group_id 
      AND sgm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join groups"
  ON study_group_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for question_bank
CREATE POLICY "Users can view own and public questions"
  ON question_bank FOR SELECT
  TO authenticated
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create question banks"
  ON question_bank FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own question banks"
  ON question_bank FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for study_tips (community table)
CREATE POLICY "Users can view study tips"
  ON study_tips FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create study tips"
  ON study_tips FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for topic_difficulty_stats
CREATE POLICY "Users can manage own topic stats"
  ON topic_difficulty_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create topic stats"
  ON topic_difficulty_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own topic stats"
  ON topic_difficulty_stats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for leaderboard_cache (public read for leaderboards)
CREATE POLICY "Leaderboard is publicly readable"
  ON leaderboard_cache FOR SELECT
  USING (true);
