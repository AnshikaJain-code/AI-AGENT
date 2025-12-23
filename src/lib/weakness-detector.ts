import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface WeaknessTopic {
  topic: string;
  correctCount: number;
  totalAttempts: number;
  accuracy: number;
  lastAttemptDate: string;
}

export interface WeaknessAnalysis {
  weakTopics: WeaknessTopic[];
  overallAccuracy: number;
  averageDifficulty: string;
  recommendedFocus: string[];
}

export async function analyzeUserWeaknesses(
  userId: string
): Promise<WeaknessAnalysis> {
  const { data: quizzes } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (!quizzes || quizzes.length === 0) {
    return {
      weakTopics: [],
      overallAccuracy: 0,
      averageDifficulty: 'medium',
      recommendedFocus: [],
    };
  }

  const topicStats = new Map<
    string,
    { correct: number; total: number; lastDate: string }
  >();
  let totalCorrect = 0;
  let totalQuestions = 0;
  const difficultyCount = { easy: 0, medium: 0, hard: 0 };

  quizzes.forEach((quiz) => {
    totalCorrect += quiz.correct_answers;
    totalQuestions += quiz.total_questions;
    difficultyCount[quiz.difficulty]++;

    if (quiz.details && Array.isArray(quiz.details)) {
      (quiz.details as any[]).forEach((detail) => {
        const topic = detail.topic || 'General';
        const current = topicStats.get(topic) || {
          correct: 0,
          total: 0,
          lastDate: quiz.created_at,
        };

        current.total++;
        if (detail.isCorrect) current.correct++;
        current.lastDate = quiz.created_at;

        topicStats.set(topic, current);
      });
    }
  });

  const weakTopics: WeaknessTopic[] = Array.from(topicStats.entries())
    .map(([topic, stats]) => ({
      topic,
      correctCount: stats.correct,
      totalAttempts: stats.total,
      accuracy: (stats.correct / stats.total) * 100,
      lastAttemptDate: stats.lastDate,
    }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 10);

  const overallAccuracy =
    totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

  const avgDifficultyKey = Object.entries(difficultyCount).sort(
    (a, b) => b[1] - a[1]
  )[0][0];

  const recommendedFocus = weakTopics
    .filter((t) => t.accuracy < 70)
    .slice(0, 5)
    .map((t) => t.topic);

  return {
    weakTopics,
    overallAccuracy,
    averageDifficulty: avgDifficultyKey,
    recommendedFocus,
  };
}

export async function generateWeaknessPracticeMaterials(
  userId: string,
  topics: string[]
): Promise<
  Array<{
    topic: string;
    questionCount: number;
    estimatedTime: number;
  }>
> {
  return topics.map((topic) => ({
    topic,
    questionCount: Math.floor(Math.random() * 5) + 5,
    estimatedTime: Math.floor(Math.random() * 15) + 10,
  }));
}

export async function getTopicDifficultyStats(
  userId: string
): Promise<Map<string, number>> {
  const { data: quizzes } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('user_id', userId);

  const topicDifficulty = new Map<string, number>();

  if (!quizzes) return topicDifficulty;

  quizzes.forEach((quiz) => {
    if (quiz.details && Array.isArray(quiz.details)) {
      (quiz.details as any[]).forEach((detail) => {
        const topic = detail.topic || 'General';
        const accuracy = detail.isCorrect ? 100 : 0;
        const current = topicDifficulty.get(topic) || 0;
        topicDifficulty.set(topic, (current + accuracy) / 2);
      });
    }
  });

  return topicDifficulty;
}

export async function saveDifficultyStat(
  userId: string,
  topic: string,
  accuracy: number,
  difficulty: string
) {
  const { data: existing } = await supabase
    .from('topic_difficulty_stats')
    .select('*')
    .eq('user_id', userId)
    .eq('topic', topic)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('topic_difficulty_stats')
      .update({
        accuracy,
        difficulty_score: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        practice_count: (existing.practice_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    await supabase.from('topic_difficulty_stats').insert({
      user_id: userId,
      topic,
      accuracy,
      difficulty_score:
        difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
      practice_count: 1,
    });
  }
}
