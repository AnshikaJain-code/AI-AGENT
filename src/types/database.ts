export interface Database {
  public: {
    Tables: {
      notes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          raw_text: string;
          summary: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          raw_text: string;
          summary?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          raw_text?: string;
          summary?: string | null;
          updated_at?: string;
        };
      };
      quiz_attempts: {
        Row: {
          id: string;
          user_id: string;
          note_id: string | null;
          difficulty: 'easy' | 'medium' | 'hard';
          score: number;
          total_questions: number;
          correct_answers: number;
          details: QuizDetail[];
          question_type: 'mcq' | 'essay' | 'fill-blank' | 'matching';
          confidence_score: number | null;
          adaptive_difficulty: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          note_id?: string | null;
          difficulty: 'easy' | 'medium' | 'hard';
          score: number;
          total_questions: number;
          correct_answers: number;
          details?: QuizDetail[];
          question_type?: 'mcq' | 'essay' | 'fill-blank' | 'matching';
          confidence_score?: number | null;
          adaptive_difficulty?: boolean;
          created_at?: string;
        };
        Update: {
          note_id?: string | null;
          difficulty?: 'easy' | 'medium' | 'hard';
          score?: number;
          total_questions?: number;
          correct_answers?: number;
          details?: QuizDetail[];
          question_type?: 'mcq' | 'essay' | 'fill-blank' | 'matching';
          confidence_score?: number | null;
          adaptive_difficulty?: boolean;
        };
      };
      study_sessions: {
        Row: {
          id: string;
          user_id: string;
          minutes: number;
          session_type: 'focus' | 'break';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          minutes: number;
          session_type: 'focus' | 'break';
          created_at?: string;
        };
        Update: {
          minutes?: number;
          session_type?: 'focus' | 'break';
        };
      };
      prediction_runs: {
        Row: {
          id: string;
          user_id: string;
          exam_name: string;
          syllabus_summary: string | null;
          patterns: PredictionPatterns;
          generated_paper: GeneratedPaper;
          config: PredictionConfig;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          exam_name?: string;
          syllabus_summary?: string | null;
          patterns?: PredictionPatterns;
          generated_paper?: GeneratedPaper;
          config?: PredictionConfig;
          created_at?: string;
        };
        Update: {
          exam_name?: string;
          syllabus_summary?: string | null;
          patterns?: PredictionPatterns;
          generated_paper?: GeneratedPaper;
          config?: PredictionConfig;
        };
      };
      user_stats: {
        Row: {
          id: string;
          user_id: string;
          current_streak: number;
          longest_streak: number;
          last_study_date: string | null;
          total_study_minutes: number;
          weak_topics: string[];
          mastery_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          current_streak?: number;
          longest_streak?: number;
          last_study_date?: string | null;
          total_study_minutes?: number;
          weak_topics?: string[];
          mastery_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          current_streak?: number;
          longest_streak?: number;
          last_study_date?: string | null;
          total_study_minutes?: number;
          weak_topics?: string[];
          mastery_score?: number;
          updated_at?: string;
        };
      };
      achievement_badges: {
        Row: {
          id: string;
          name: string;
          description: string;
          icon_name: string;
          requirement_type: 'streak' | 'quizzes' | 'accuracy' | 'topics' | 'time' | 'custom';
          requirement_value: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          icon_name: string;
          requirement_type: 'streak' | 'quizzes' | 'accuracy' | 'topics' | 'time' | 'custom';
          requirement_value: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string;
          icon_name?: string;
          requirement_type?: 'streak' | 'quizzes' | 'accuracy' | 'topics' | 'time' | 'custom';
          requirement_value?: number;
        };
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          badge_id: string;
          earned_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          badge_id: string;
          earned_at?: string;
        };
        Update: {
          user_id?: string;
          badge_id?: string;
          earned_at?: string;
        };
      };
      flashcards: {
        Row: {
          id: string;
          user_id: string;
          note_id: string | null;
          question: string;
          answer: string;
          topic: string | null;
          difficulty: 'easy' | 'medium' | 'hard';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          note_id?: string | null;
          question: string;
          answer: string;
          topic?: string | null;
          difficulty?: 'easy' | 'medium' | 'hard';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          question?: string;
          answer?: string;
          topic?: string | null;
          difficulty?: 'easy' | 'medium' | 'hard';
          updated_at?: string;
        };
      };
      flashcard_reviews: {
        Row: {
          id: string;
          flashcard_id: string;
          user_id: string;
          ease_factor: number;
          interval_days: number;
          next_review_date: string;
          review_count: number;
          correct_count: number;
          last_reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          flashcard_id: string;
          user_id: string;
          ease_factor?: number;
          interval_days?: number;
          next_review_date?: string;
          review_count?: number;
          correct_count?: number;
          last_reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          ease_factor?: number;
          interval_days?: number;
          next_review_date?: string;
          review_count?: number;
          correct_count?: number;
          last_reviewed_at?: string | null;
        };
      };
      concept_map: {
        Row: {
          id: string;
          user_id: string;
          subject: string;
          concepts: Record<string, unknown>;
          relationships: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject: string;
          concepts?: Record<string, unknown>;
          relationships?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          subject?: string;
          concepts?: Record<string, unknown>;
          relationships?: Record<string, unknown>;
          updated_at?: string;
        };
      };
      annotations: {
        Row: {
          id: string;
          user_id: string;
          note_id: string;
          start_index: number;
          end_index: number;
          text: string;
          color: string;
          annotation_type: 'highlight' | 'note' | 'important';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          note_id: string;
          start_index: number;
          end_index: number;
          text: string;
          color?: string;
          annotation_type?: 'highlight' | 'note' | 'important';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          start_index?: number;
          end_index?: number;
          text?: string;
          color?: string;
          annotation_type?: 'annotation_type' | 'note' | 'important';
          updated_at?: string;
        };
      };
      voice_notes: {
        Row: {
          id: string;
          user_id: string;
          note_id: string | null;
          audio_url: string;
          transcription: string | null;
          extracted_points: unknown[];
          duration_seconds: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          note_id?: string | null;
          audio_url: string;
          transcription?: string | null;
          extracted_points?: unknown[];
          duration_seconds?: number | null;
          created_at?: string;
        };
        Update: {
          audio_url?: string;
          transcription?: string | null;
          extracted_points?: unknown[];
          duration_seconds?: number | null;
        };
      };
      study_groups: {
        Row: {
          id: string;
          creator_id: string;
          name: string;
          description: string | null;
          subject: string | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          name: string;
          description?: string | null;
          subject?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          subject?: string | null;
          is_public?: boolean;
          updated_at?: string;
        };
      };
      study_group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          group_id?: string;
          user_id?: string;
          joined_at?: string;
        };
      };
      question_bank: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          subject: string | null;
          is_public: boolean;
          questions: unknown[];
          share_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          subject?: string | null;
          is_public?: boolean;
          questions?: unknown[];
          share_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          subject?: string | null;
          is_public?: boolean;
          questions?: unknown[];
          share_count?: number;
          updated_at?: string;
        };
      };
      study_tips: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          topic: string | null;
          is_featured: boolean;
          upvotes: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content: string;
          topic?: string | null;
          is_featured?: boolean;
          upvotes?: number;
          created_at?: string;
        };
        Update: {
          title?: string;
          content?: string;
          topic?: string | null;
          is_featured?: boolean;
          upvotes?: number;
        };
      };
      topic_difficulty_stats: {
        Row: {
          id: string;
          user_id: string;
          topic: string;
          difficulty_score: number;
          accuracy: number;
          practice_count: number;
          time_to_mastery_days: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          topic: string;
          difficulty_score?: number;
          accuracy?: number;
          practice_count?: number;
          time_to_mastery_days?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          difficulty_score?: number;
          accuracy?: number;
          practice_count?: number;
          time_to_mastery_days?: number | null;
          updated_at?: string;
        };
      };
      leaderboard_cache: {
        Row: {
          id: string;
          rank: number | null;
          user_id: string;
          score: number;
          streak: number | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          rank?: number | null;
          user_id: string;
          score: number;
          streak?: number | null;
          updated_at?: string;
        };
        Update: {
          rank?: number | null;
          score?: number;
          streak?: number | null;
          updated_at?: string;
        };
      };
    };
  };
}

export interface QuizDetail {
  questionId: string;
  question: string;
  userAnswer: number | null;
  correctAnswer: number;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface TopicFrequency {
  name: string;
  frequency: number;
  totalMarks: number;
  yearsAppeared: number[];
}

export interface RepeatedQuestion {
  questionText: string;
  variants: string[];
  topic: string;
  timesRepeated: number;
}

export interface PredictionPatterns {
  topics: TopicFrequency[];
  repeatedQuestions: RepeatedQuestion[];
}

export interface PredictedQuestion {
  id: string;
  text: string;
  topic: string;
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  probabilityScore: number;
  sourceType: 'new' | 'inspired' | 'similar-to-past';
}

export interface PaperSection {
  name: string;
  totalMarks: number;
  questions: PredictedQuestion[];
}

export interface GeneratedPaper {
  sections: PaperSection[];
}

export interface PredictionConfig {
  totalQuestions?: number;
  sections?: { name: string; marks: number }[];
  marksDistribution?: Record<string, number>;
}

export type Note = Database['public']['Tables']['notes']['Row'];
export type QuizAttempt = Database['public']['Tables']['quiz_attempts']['Row'];
export type StudySession = Database['public']['Tables']['study_sessions']['Row'];
export type PredictionRun = Database['public']['Tables']['prediction_runs']['Row'];